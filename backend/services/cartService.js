const { PrismaClient } = require('@prisma/client');
const { redisConnectionPool } = require('./redisConnectionPool');
const { loggerService } = require('./logger');
const { stockValidationService, BACKORDER_CONFIG } = require('./stockValidationService');
const { cartCacheService } = require('./cartCacheService');
const { cartQueueService } = require('./cartQueueService');
const { cartPerformanceService } = require('./cartPerformanceService');
const crypto = require('crypto');

class CartService {
  constructor() {
    // Fix 1: Configure Prisma connection pool with reasonable limits
    this.prisma = new PrismaClient({
      log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
      datasources: {
        db: {
          url: process.env.DATABASE_URL
        }
      }
    });
    
    // Configure connection pool settings
    this.prisma.$connect()
      .then(() => {
        this.logger.info('[CartService] Database connection established successfully');
      })
      .catch((error) => {
        this.logger.error('[CartService] Failed to connect to database', {
          error: error.message,
          code: error.code
        });
      });
    
    this.redis = redisConnectionPool.getClient('cartService');
    this.logger = loggerService;
    // Use environment variables with fallback defaults
    this.cacheTTL = parseInt(process.env.CART_CACHE_TTL) || 3600; // 1 hour cache TTL
    this.guestCartTTL = parseInt(process.env.CART_GUEST_TTL) || (30 * 24 * 60 * 60); // 30 days for guest carts
    this.taxRate = parseFloat(process.env.CART_TAX_RATE) || 0.15; // 15% tax rate
    this.shippingCost = parseFloat(process.env.CART_SHIPPING_COST) || 100; // Fixed shipping cost
    
    // Performance optimization: Initialize cache service
    this.cacheService = cartCacheService;
    this.queueService = cartQueueService;
    this.performanceService = cartPerformanceService;
    
    // Initialize services asynchronously
    this.initializeServices();
    
    // Fix 2: Circuit breaker state for Redis operations
    // Temporarily disables cache after repeated failures
    this.redisCircuitBreaker = {
      isOpen: false,
      failureCount: 0,
      lastFailureTime: null,
      failureThreshold: 5,      // Number of consecutive failures before opening circuit
      resetTimeout: 60000,   // Time in ms to wait before trying again (60 seconds)
      successCount: 0,
      successThreshold: 3      // Number of successes needed to close circuit
    };
  }
  
  /**
   * Initialize performance optimization services
   */
  async initializeServices() {
    try {
      await Promise.all([
        this.cacheService.initialize(),
        this.queueService.initialize(),
        this.performanceService.initialize()
      ]);
      this.logger.info('[CartService] Performance optimization services initialized');
    } catch (error) {
      this.logger.warn('[CartService] Some optimization services failed to initialize', { error: error.message });
      // Continue without optimization services
    }
  }

  /**
   * Fix 1: Check database connection health
   * @returns {Promise<boolean>} True if database is healthy
   */
  async checkDatabaseConnection() {
    try {
      // Simple query to check connection
      await this.prisma.$queryRaw`SELECT 1`;
      return true;
    } catch (error) {
      this.logger.error('[checkDatabaseConnection] Database connection check failed', {
        error: error.message,
        code: error.code
      });
      return false;
    }
  }

  /**
   * Fix 1: Execute database query with retry logic
   * @param {Function} queryFn - Function that executes the database query
   * @param {Object} options - Retry options
   * @returns {Promise<any>} Query result
   */
  async executeWithRetry(queryFn, options = {}) {
    const {
      maxRetries = 3,
      baseDelay = 100, // Base delay in ms
      maxDelay = 5000, // Maximum delay in ms
      operationName = 'database operation'
    } = options;

    let lastError;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        // Check database connection before attempting query
        const isHealthy = await this.checkDatabaseConnection();
        if (!isHealthy) {
          throw new Error('Database connection is not healthy');
        }
        
        // Execute the query
        const result = await queryFn();
        
        // Log successful retry if not first attempt
        if (attempt > 1) {
          this.logger.info(`[executeWithRetry] ${operationName} succeeded on attempt ${attempt}`, {
            operationName,
            attempt,
            totalAttempts: maxRetries
          });
        }
        
        return result;
      } catch (error) {
        lastError = error;
        
        // Check if error is retryable
        const isRetryable = this.isRetryableError(error);
        
        if (!isRetryable || attempt === maxRetries) {
          // Don't retry or max retries reached
          this.logger.error(`[executeWithRetry] ${operationName} failed after ${attempt} attempt(s)`, {
            operationName,
            attempt,
            maxRetries,
            error: error.message,
            code: error.code,
            isRetryable
          });
          throw error;
        }
        
        // Calculate exponential backoff delay
        const delay = Math.min(baseDelay * Math.pow(2, attempt - 1), maxDelay);
        
        this.logger.warn(`[executeWithRetry] ${operationName} failed on attempt ${attempt}, retrying in ${delay}ms`, {
          operationName,
          attempt,
          maxRetries,
          delay,
          error: error.message,
          code: error.code
        });
        
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    // This should never be reached, but just in case
    throw lastError;
  }

  /**
   * Fix 1: Check if error is retryable
   * @param {Error} error - Error to check
   * @returns {boolean} True if error is retryable
   */
  isRetryableError(error) {
    const retryableCodes = ['P1001', 'P1002', 'P1008', 'P1017', 'ECONNREFUSED', 'ETIMEDOUT'];
    const retryableMessages = [
      'connection',
      'timeout',
      'network',
      'database is locked',
      'too many connections'
    ];
    
    // Check error code
    if (error.code && retryableCodes.includes(error.code)) {
      return true;
    }
    
    // Check error message
    const errorMessage = error.message?.toLowerCase() || '';
    return retryableMessages.some(msg => errorMessage.includes(msg));
  }

  /**
   * Fix 2: Check if Redis circuit breaker is open
   * @returns {boolean} True if circuit is open (cache disabled)
   */
  isRedisCircuitBreakerOpen() {
    const { isOpen, lastFailureTime, resetTimeout } = this.redisCircuitBreaker;
    
    // If circuit is open, check if enough time has passed to attempt reset
    if (isOpen) {
      const timeSinceLastFailure = Date.now() - lastFailureTime;
      if (timeSinceLastFailure > resetTimeout) {
        // Try to reset the circuit
        this.logger.info('[isRedisCircuitBreakerOpen] Attempting to reset circuit breaker after timeout', {
          timeSinceLastFailure,
          resetTimeout
        });
        return false; // Allow attempt
      }
      return true; // Circuit still open
    }
    
    return false; // Circuit is closed
  }

  /**
   * Fix 2: Record Redis operation success
   * Used to close circuit breaker after enough successes
   */
  recordRedisSuccess() {
    const { isOpen, successCount, successThreshold } = this.redisCircuitBreaker;
    
    if (isOpen) {
      // Increment success count
      this.redisCircuitBreaker.successCount++;
      
      this.logger.info('[recordRedisSuccess] Redis operation succeeded', {
        successCount: this.redisCircuitBreaker.successCount,
        successThreshold
      });
      
      // Check if we have enough successes to close the circuit
      if (this.redisCircuitBreaker.successCount >= successThreshold) {
        this.redisCircuitBreaker.isOpen = false;
        this.redisCircuitBreaker.failureCount = 0;
        this.redisCircuitBreaker.successCount = 0;
        this.redisCircuitBreaker.lastFailureTime = null;
        
        this.logger.info('[recordRedisSuccess] Redis circuit breaker closed', {
          successCount: this.redisCircuitBreaker.successCount
        });
      }
    } else {
      // Reset success count if circuit is closed
      this.redisCircuitBreaker.successCount = 0;
    }
  }

  /**
   * Fix 2: Record Redis operation failure
   * Used to open circuit breaker after too many failures
   */
  recordRedisFailure(error) {
    const { isOpen, failureCount, failureThreshold } = this.redisCircuitBreaker;
    
    // Increment failure count
    this.redisCircuitBreaker.failureCount++;
    this.redisCircuitBreaker.lastFailureTime = Date.now();
    
    this.logger.warn('[recordRedisFailure] Redis operation failed', {
      failureCount: this.redisCircuitBreaker.failureCount,
      failureThreshold,
      error: error.message,
      errorName: error.name
    });
    
    // Check if we should open the circuit
    if (!isOpen && this.redisCircuitBreaker.failureCount >= failureThreshold) {
      this.redisCircuitBreaker.isOpen = true;
      this.redisCircuitBreaker.successCount = 0;
      
      this.logger.error('[recordRedisFailure] Redis circuit breaker opened due to repeated failures', {
        failureCount: this.redisCircuitBreaker.failureCount,
        failureThreshold
      });
    }
  }

  /**
   * Fix 2: Check Redis connection health
   * @returns {Promise<boolean>} True if Redis is healthy
   */
  async checkRedisConnection() {
    try {
      if (!this.redis) {
        return false;
      }
      
      // Simple ping to check connection
      const result = await this.redis.ping();
      return result === 'PONG';
    } catch (error) {
      this.logger.warn('[checkRedisConnection] Redis connection check failed', {
        error: error.message,
        errorName: error.name
      });
      return false;
    }
  }

  // Generate cache key for cart
  getCacheKey(cartId) {
    return `cart:${cartId}`;
  }

  // Generate cache key for cart items
  getCartItemsCacheKey(cartId) {
    return `cart:${cartId}:items`;
  }

  /**
   * Get cart by cart ID with performance optimization
   * Uses cache-first pattern with fallback to database
   * @param {string} cartId - The cart ID to fetch
   * @returns {Promise<Object>} The cart with items and totals
   */
  async getCartById(cartId) {
    const startTime = Date.now();
    
    try {
      this.logger.info('Fetching cart by ID', { cartId });
      
      // Performance optimization: Try cache first
      let cart = null;
      let cacheHit = false;
      
      if (this.cacheService.isInitialized) {
        try {
          const cachedCart = await this.cacheService.getCart(cartId, { isGuest: false });
          if (cachedCart) {
            cart = cachedCart;
            cacheHit = true;
            this.logger.info('[getCartById] Cart served from cache', { cartId });
          }
        } catch (cacheError) {
          this.logger.warn('[getCartById] Cache retrieval failed, falling back to database', { error: cacheError.message });
        }
      }
      
      // Fetch from database with retry logic if cache miss
      if (!cart) {
        cart = await this.executeWithRetry(
          () => this._fetchCartByIdFromDatabase(cartId),
          {
            maxRetries: 3,
            baseDelay: 100,
            maxDelay: 5000,
            operationName: 'fetchCartByIdFromDatabase'
          }
        );
        
        // Cache result for future requests
        if (cart && this.cacheService.isInitialized) {
          try {
            await this.cacheService.setCart(cart.id, cart, { isGuest: false });
          } catch (cacheError) {
            this.logger.warn('[getCartById] Failed to cache cart', { error: cacheError.message });
          }
        }
      }
      
      // Track performance metrics
      const duration = Date.now() - startTime;
      if (this.performanceService.isInitialized) {
        this.performanceService.trackCartLoadTime(duration, {
          cartId,
          cacheHit,
          itemCount: cart?.items?.length || 0
        });
      }
      
      return cart;
    } catch (error) {
      this.logger.error('Error fetching cart by ID', { 
        cartId, 
        error: error.message,
        errorName: error.name,
        errorCode: error.code,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
      throw error;
    }
  }

  /**
   * Internal method to fetch cart by ID from database
   * @private
   */
  async _fetchCartByIdFromDatabase(cartId) {
    try {
      // Get cart by ID using optimized query
      const cart = await this.prisma.cart.findUnique({
        where: { id: cartId },
        include: {
          items: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  nameEn: true,
                  nameBn: true,
                  regularPrice: true,
                  salePrice: true,
                  stockQuantity: true,
                  images: {
                    where: { displayOrder: 0 },
                    take: 1,
                    select: { id: true, originalUrl: true, optimizedUrl: true, thumbnailUrl: true, altTextEn: true, altTextBn: true }
                  }
                }
              },
              variant: {
                select: {
                  id: true,
                  sku: true,
                  price: true,
                  stock: true
                }
              }
            },
            orderBy: { addedAt: 'desc' }
          },
          analytics: true
        }
      });

      if (!cart) {
        this.logger.info('No cart found in database by ID', { cartId });
        return null;
      }

      // Recalculate cart item prices based on current product sale prices
      this.logger.info('[getCartById] Recalculating cart item prices', { cartId });
      const priceRecalculationResult = await this.recalculateCartItemPrices(cart.id);
      
      // Log price recalculation summary
      this.logger.info('[getCartById] Price recalculation summary', {
        cartId,
        itemsUpdated: priceRecalculationResult.itemsUpdated,
        timestamp: new Date().toISOString()
      });

      // Calculate totals after prices have been updated
      this.logger.info('[getCartById] Calculating cart totals', { cartId });
      const totals = await this.calculateCartTotals(cart.id);
      
      // Verify totals match expected values based on item prices
      const expectedSubtotal = cart.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      const subtotalMatches = Math.abs(totals.subtotal - expectedSubtotal) < 0.01;
      
      this.logger.info('[getCartById] Cart totals calculated and verified', {
        cartId,
        calculatedSubtotal: totals.subtotal,
        expectedSubtotal: expectedSubtotal,
        subtotalMatches,
        itemCount: totals.itemCount,
        totalItems: totals.totalItems,
        timestamp: new Date().toISOString()
      });

      // If subtotal doesn't match, recalculate again
      if (!subtotalMatches) {
        this.logger.warn('[getCartById] Subtotal mismatch detected, recalculating...', {
          cartId,
          calculatedSubtotal: totals.subtotal,
          expectedSubtotal: expectedSubtotal,
          difference: totals.subtotal - expectedSubtotal
        });
        
        // Force recalculate totals
        const correctedTotals = await this.calculateCartTotals(cart.id);
        this.logger.info('[getCartById] Corrected totals after mismatch', {
          cartId,
          originalSubtotal: totals.subtotal,
          correctedSubtotal: correctedTotals.subtotal
        });
        
        return {
          ...cart,
          ...correctedTotals
        };
      }

      return {
        ...cart,
        ...totals
      };
    } catch (error) {
      this.logger.error('Error fetching cart from database by ID', {
        cartId,
        error: error.message,
        errorType: error.name,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
      
      // Check if it's a database connection error
      if (error.message.includes('connect') || error.message.includes('ECONNREFUSED') || error.code === 'P1001') {
        throw new Error('Database connection failed. Please try again later.');
      }
      
      throw error;
    }
  }

  /**
   * Get cart for user or guest with performance optimization
   * Uses cache-first pattern with fallback to database
   */
  async getCart(userId, sessionId) {
    const startTime = Date.now();
    const cartId = userId || sessionId;
    
    try {
      this.logger.info('Fetching cart', { userId, sessionId });
      
      // Performance optimization: Try cache first
      let cart = null;
      let cacheHit = false;
      
      if (this.cacheService.isInitialized) {
        try {
          const cachedCart = await this.cacheService.getCart(cartId, { isGuest: !userId });
          if (cachedCart) {
            cart = cachedCart;
            cacheHit = true;
            this.logger.info('[getCart] Cart served from cache', { userId, sessionId });
          }
        } catch (cacheError) {
          this.logger.warn('[getCart] Cache retrieval failed, falling back to database', { error: cacheError.message });
        }
      }
      
      // Fix 1: Fetch from database with retry logic if cache miss
      if (!cart) {
        cart = await this.executeWithRetry(
          () => this._fetchCartFromDatabase(userId, sessionId),
          {
            maxRetries: 3,
            baseDelay: 100,
            maxDelay: 5000,
            operationName: 'fetchCartFromDatabase'
          }
        );
        
        // Cache the result for future requests
        if (cart && this.cacheService.isInitialized) {
          try {
            await this.cacheService.setCart(cart.id, cart, { isGuest: !userId });
          } catch (cacheError) {
            this.logger.warn('[getCart] Failed to cache cart', { error: cacheError.message });
          }
        }
      }
      
      // Track performance metrics
      const duration = Date.now() - startTime;
      if (this.performanceService.isInitialized) {
        this.performanceService.trackCartLoadTime(duration, {
          userId,
          sessionId,
          cacheHit,
          itemCount: cart?.items?.length || 0
        });
      }
      
      // Calculate and verify cart totals
      if (cart && cart.items) {
        const calculatedSubtotal = cart.items.reduce((sum, item) => {
          const price = parseFloat(item.price || item.product?.price || 0);
          const quantity = parseInt(item.quantity) || 0;
          return sum + (price * quantity);
        }, 0);
        
        const calculatedTotal = calculatedSubtotal + (cart.shippingCost || this.shippingCost);
        
        this.logger.info('[getCart] Cart totals calculated', {
          calculatedSubtotal,
          calculatedTotal,
          dbSubtotal: cart.subtotal,
          dbTotal: cart.total
        });
        
        // Return cart with calculated totals for consistency
        return {
          ...cart,
          subtotal: calculatedSubtotal,
          total: calculatedTotal,
          calculatedAt: new Date().toISOString()
        };
      }
      
      return cart;
    } catch (error) {
      // Fix 1: Enhanced error logging with full error details
      this.logger.error('Error fetching cart', { 
        userId, 
        sessionId, 
        error: error.message,
        errorName: error.name,
        errorCode: error.code,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
      throw error;
    }
  }
  
  /**
   * Internal method to fetch cart from database
   * @private
   */
  async _fetchCartFromDatabase(userId, sessionId) {
    let cart;
    
    if (userId) {
      // Get user's cart using optimized query
      cart = await this.prisma.cart.findUnique({
        where: { userId },
        include: {
          items: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  nameEn: true,
                  nameBn: true,
                  regularPrice: true,
                  salePrice: true,
                  stockQuantity: true,
                  images: {
                    where: { displayOrder: 0 },
                    take: 1,
                    select: { id: true, originalUrl: true, optimizedUrl: true, thumbnailUrl: true, altTextEn: true, altTextBn: true }
                  }
                }
              },
              variant: {
                select: {
                  id: true,
                  sku: true,
                  price: true,
                  stock: true
                }
              }
            },
            orderBy: { addedAt: 'desc' }
          },
          analytics: true
        }
      });
    } else if (sessionId) {
      // Get guest cart using optimized query
      cart = await this.prisma.cart.findFirst({
        where: { sessionId },
        include: {
          items: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  nameEn: true,
                  nameBn: true,
                  regularPrice: true,
                  salePrice: true,
                  stockQuantity: true,
                  images: {
                    where: { displayOrder: 0 },
                    take: 1,
                    select: { id: true, originalUrl: true, optimizedUrl: true, thumbnailUrl: true, altTextEn: true, altTextBn: true }
                  }
                }
              },
              variant: {
                select: {
                  id: true,
                  sku: true,
                  price: true,
                  stock: true
                }
              }
            },
            orderBy: { addedAt: 'desc' }
          },
          analytics: true
        }
      });
    }

    // Debug logging for Fix 2: Cart items from database
    this.logger.info('[getCart] Cart items from database', {
      userId,
      sessionId,
      itemCount: cart?.items?.length
    });

    if (!cart) {
      this.logger.info('No cart found in database', { userId, sessionId });
      return null;
    }

    // FIX: Recalculate cart item prices based on current product sale prices FIRST
    // This ensures existing items show correct discounted prices BEFORE calculating totals
    this.logger.info('[getCart] Recalculating cart item prices', { cartId: cart.id });
    const priceRecalculationResult = await this.recalculateCartItemPrices(cart.id);
    
    // SAFEGUARD: Log price recalculation summary
    this.logger.info('[getCart] Price recalculation summary', {
      cartId: cart.id,
      itemsUpdated: priceRecalculationResult.itemsUpdated,
      timestamp: new Date().toISOString()
    });

    // Calculate totals AFTER prices have been updated
    this.logger.info('[getCart] Calculating cart totals', { cartId: cart.id });
    const totals = await this.calculateCartTotals(cart.id);
    
    // SAFEGUARD: Verify totals match expected values based on item prices
    const expectedSubtotal = cart.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const subtotalMatches = Math.abs(totals.subtotal - expectedSubtotal) < 0.01;
    
    this.logger.info('[getCart] Cart totals calculated and verified', {
      cartId: cart.id,
      calculatedSubtotal: totals.subtotal,
      expectedSubtotal: expectedSubtotal,
      subtotalMatches,
      itemCount: totals.itemCount,
      totalItems: totals.totalItems,
      timestamp: new Date().toISOString()
    });

    // SAFEGUARD: If subtotal doesn't match, recalculate again
    if (!subtotalMatches) {
      this.logger.warn('[getCart] Subtotal mismatch detected, recalculating...', {
        cartId: cart.id,
        calculatedSubtotal: totals.subtotal,
        expectedSubtotal: expectedSubtotal,
        difference: totals.subtotal - expectedSubtotal
      });
      
      // Force recalculate totals
      const correctedTotals = await this.calculateCartTotals(cart.id);
      this.logger.info('[getCart] Corrected totals after mismatch', {
        cartId: cart.id,
        originalSubtotal: totals.subtotal,
        correctedSubtotal: correctedTotals.subtotal
      });
      
      return {
        ...cart,
        ...correctedTotals
      };
    }

    return {
      ...cart,
      ...totals
    };
  } catch (error) {
    this.logger.error('Error fetching cart from database', {
      userId,
      sessionId,
      error: error.message,
      errorType: error.name,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
    
    // Check if it's a database connection error
    if (error.message.includes('connect') || error.message.includes('ECONNREFUSED') || error.code === 'P1001') {
      throw new Error('Database connection failed. Please try again later.');
    }
    
    throw error;
  }

  /**
   * Create new cart
   */
  async createCart(userId, sessionId) {
    try {
      const cartData = {
        subtotal: 0,
        tax: 0,
        shippingCost: 0,
        discount: 0,
        total: 0,
        status: 'active' // Set default status to active
      };

      if (userId) {
        cartData.userId = userId;
      } else if (sessionId) {
        cartData.sessionId = sessionId;
        // Set expiration for guest carts
        const expiresAt = new Date(Date.now() + this.guestCartTTL * 1000);
        cartData.expiresAt = expiresAt;
      } else {
        throw new Error('Either userId or sessionId must be provided');
      }

      const cart = await this.prisma.cart.create({
        data: cartData
      });

      // Create cart analytics
      await this.prisma.cartAnalytics.create({
        data: {
          cartId: cart.id,
          events: {},
          conversionFunnel: {}
        }
      });

      this.logger.info('Cart created', {
        cartId: cart.id,
        userId,
        sessionId
      });

      return cart;
    } catch (error) {
      this.logger.error('Error creating cart', {
        userId,
        sessionId,
        error: error.message
      });
      throw error;
    }
  }

  // Add item to cart with atomic stock validation to prevent race conditions
  async addItemToCart(cartId, productId, quantity, variantId = null) {
    try {
      // Validate cart exists
      const cart = await this.prisma.cart.findUnique({
        where: { id: cartId }
      });

      if (!cart) {
        throw new Error('Cart not found');
      }

      // Validate product exists and is active
      const product = await this.prisma.product.findUnique({
        where: { id: productId },
        include: { variants: true }
      });

      if (!product) {
        throw new Error('Product not found');
      }

      if (product.status !== 'active') {
        throw new Error('Product is not available');
      }

      // Determine price based on variant or product
      let price;
      let stockField;
      let stock;

      // DEBUG: Log product pricing data
      this.logger.info('[addItemToCart] Product pricing data:', {
        productId,
        variantId,
        productName: product.name,
        regularPrice: product.regularPrice,
        salePrice: product.salePrice,
        hasSalePrice: !!product.salePrice && parseFloat(product.salePrice) > 0 && parseFloat(product.salePrice) < parseFloat(product.regularPrice)
      });

      if (variantId) {
        const variant = product.variants.find(v => v.id === variantId);
        if (!variant) {
          throw new Error('Product variant not found');
        }
        price = variant.price;
        stock = variant.stock;
        stockField = 'variant';
        this.logger.info('[addItemToCart] Using variant price:', { variantId, price });
      } else {
        // FIX: Use salePrice if available and valid, otherwise use regularPrice
        const hasValidSalePrice = product.salePrice &&
                                      parseFloat(product.salePrice) > 0 &&
                                      parseFloat(product.salePrice) < parseFloat(product.regularPrice);
        price = hasValidSalePrice ? product.salePrice : product.regularPrice;
        stock = product.stockQuantity;
        stockField = 'product';
        this.logger.info('[addItemToCart] Using product price:', {
          productId,
          price,
          isSalePrice: hasValidSalePrice,
          salePrice: product.salePrice,
          regularPrice: product.regularPrice
        });
      }

      // Check if item already exists in cart
      const existingItem = await this.prisma.cartItem.findFirst({
        where: {
          cartId,
          productId,
          variantId: variantId || null
        }
      });

      let cartItem;

      if (existingItem) {
        // Update existing item quantity with atomic stock validation
        const newQuantity = existingItem.quantity + quantity;
        
        // Use transaction to atomically check and update stock
        cartItem = await this.prisma.$transaction(async (tx) => {
          // Re-fetch stock with FOR UPDATE lock to prevent race conditions
          let currentStock;
          if (stockField === 'variant') {
            const variant = await tx.productVariant.findUnique({
              where: { id: variantId },
              select: { stock: true }
            });
            currentStock = variant.stock;
          } else {
            const prod = await tx.product.findUnique({
              where: { id: productId },
              select: { stockQuantity: true }
            });
            currentStock = prod.stockQuantity;
          }

          // Validate stock for updated quantity
          if (currentStock < newQuantity) {
            throw new Error(`Insufficient stock available for requested quantity. Available: ${currentStock}, Requested: ${newQuantity}`);
          }

          // Update cart item
          const updatedItem = await tx.cartItem.update({
            where: { id: existingItem.id },
            data: {
              quantity: newQuantity,
              subtotal: parseFloat(price) * newQuantity
            },
            select: {
              id: true,
              cartId: true,
              productId: true,
              variantId: true,
              quantity: true,
              price: true,
              subtotal: true,
              addedAt: true,
              product: {
                select: {
                  id: true,
                  name: true,
                  slug: true,
                  regularPrice: true,
                  salePrice: true,
                  images: true
                }
              },
              variant: true
            }
          });

          return updatedItem;
        });
      } else {
        // Create new cart item with atomic stock validation
        cartItem = await this.prisma.$transaction(async (tx) => {
          // Re-fetch stock with FOR UPDATE lock to prevent race conditions
          let currentStock;
          if (stockField === 'variant') {
            const variant = await tx.productVariant.findUnique({
              where: { id: variantId },
              select: { stock: true }
            });
            currentStock = variant.stock;
          } else {
            const prod = await tx.product.findUnique({
              where: { id: productId },
              select: { stockQuantity: true }
            });
            currentStock = prod.stockQuantity;
          }

          // Validate stock availability
          if (currentStock < quantity) {
            throw new Error(`Insufficient stock available. Available: ${currentStock}, Requested: ${quantity}`);
          }

          // Create new cart item
          const newItem = await tx.cartItem.create({
            data: {
              cartId,
              productId,
              variantId: variantId || null,
              quantity,
              price: parseFloat(price),
              subtotal: parseFloat(price) * quantity
            },
            select: {
              id: true,
              cartId: true,
              productId: true,
              variantId: true,
              quantity: true,
              price: true,
              subtotal: true,
              addedAt: true,
              product: {
                select: {
                  id: true,
                  name: true,
                  slug: true,
                  regularPrice: true,
                  salePrice: true,
                  images: true
                }
              },
              variant: true
            }
          });

          return newItem;
        });
      }

      // Invalidate cache
      await this.invalidateCartCache(cartId);

      // Recalculate cart totals
      await this.calculateCartTotals(cartId);

      // Track analytics event
      await this.trackCartEvent(cartId, 'item_added', {
        productId,
        variantId,
        quantity,
        price: parseFloat(price)
      });

      this.logger.info('Item added to cart', {
        cartId,
        productId,
        variantId,
        quantity
      });

      return cartItem;
    } catch (error) {
      this.logger.error('Error adding item to cart', {
        cartId,
        productId,
        variantId,
        quantity,
        error: error.message
      });
      throw error;
    }
  }

  // Update cart item quantity with atomic stock validation to prevent race conditions
  async updateCartItemQuantity(cartItemId, quantity) {
    try {
      if (quantity < 1) {
        throw new Error('Quantity must be at least 1');
      }

      // Use transaction to atomically check stock and update quantity
      const updatedItem = await this.prisma.$transaction(async (tx) => {
        // Get cart item with product/variant info
        const cartItem = await tx.cartItem.findUnique({
          where: { id: cartItemId },
          include: {
            product: {
              select: { id: true, stockQuantity: true }
            },
            variant: {
              select: { id: true, stock: true }
            }
          }
        });

        if (!cartItem) {
          throw new Error('Cart item not found');
        }

        // Validate stock availability with atomic check
        let currentStock;
        if (cartItem.variantId) {
          currentStock = cartItem.variant.stock;
        } else {
          currentStock = cartItem.product.stockQuantity;
        }

        if (currentStock < quantity) {
          throw new Error(`Insufficient stock available. Available: ${currentStock}, Requested: ${quantity}`);
        }

        // Update cart item
        const updated = await tx.cartItem.update({
          where: { id: cartItemId },
          data: {
            quantity,
            subtotal: parseFloat(cartItem.price) * quantity
          },
          include: {
            product: true,
            variant: true
          }
        });

        return updated;
      });

      // Invalidate cache
      await this.invalidateCartCache(updatedItem.cartId);

      // Recalculate cart totals
      await this.calculateCartTotals(updatedItem.cartId);

      // Track analytics event
      await this.trackCartEvent(updatedItem.cartId, 'item_updated', {
        cartItemId,
        quantity
      });

      this.logger.info('Cart item quantity updated', {
        cartItemId,
        quantity
      });

      return updatedItem;
    } catch (error) {
      this.logger.error('Error updating cart item quantity', {
        cartItemId,
        quantity,
        error: error.message
      });
      throw error;
    }
  }

  // Remove item from cart with transaction for atomicity
  async removeCartItem(cartItemId) {
    try {
      // Use transaction to ensure atomic delete and recalculation
      const result = await this.prisma.$transaction(async (tx) => {
        // Get cart item to retrieve cartId
        const cartItem = await tx.cartItem.findUnique({
          where: { id: cartItemId }
        });

        if (!cartItem) {
          throw new Error('Cart item not found');
        }

        const cartId = cartItem.cartId;

        // Delete cart item
        await tx.cartItem.delete({
          where: { id: cartItemId }
        });

        return { cartId };
      });

      // Invalidate cache
      await this.invalidateCartCache(result.cartId);

      // Recalculate cart totals
      await this.calculateCartTotals(result.cartId);

      // Track analytics event
      await this.trackCartEvent(result.cartId, 'item_removed', {
        cartItemId
      });

      this.logger.info('Cart item removed', {
        cartItemId,
        cartId: result.cartId
      });

      // Return cartId so controller can fetch the updated cart
      return { success: true, cartId: result.cartId };
    } catch (error) {
      this.logger.error('Error removing cart item', {
        cartItemId,
        error: error.message
      });
      throw error;
    }
  }

  // Clear all items from cart with transaction for atomicity
  async clearCart(cartId) {
    try {
      // Use transaction to ensure atomic clear operation
      await this.prisma.$transaction(async (tx) => {
        // Validate cart exists
        const cart = await tx.cart.findUnique({
          where: { id: cartId }
        });

        if (!cart) {
          throw new Error('Cart not found');
        }

        // Delete all cart items
        await tx.cartItem.deleteMany({
          where: { cartId }
        });

        // Reset cart totals
        await tx.cart.update({
          where: { id: cartId },
          data: {
            subtotal: 0,
            tax: 0,
            shippingCost: 0,
            discount: 0,
            total: 0
          }
        });
      });

      // Invalidate cache
      await this.invalidateCartCache(cartId);

      // Track analytics event
      await this.trackCartEvent(cartId, 'cart_cleared', {});

      this.logger.info('Cart cleared', {
        cartId
      });

      return { success: true };
    } catch (error) {
      this.logger.error('Error clearing cart', {
        cartId,
        error: error.message
      });
      throw error;
    }
  }

  // Calculate cart totals (subtotal, tax, shipping, total)
  async calculateCartTotals(cartId) {
    try {
      // Get all cart items with product data including taxRate
      const items = await this.prisma.cartItem.findMany({
        where: { cartId },
        include: {
          product: {
            select: {
              id: true,
              taxRate: true
            }
          }
        }
      });

      // Calculate subtotal
      const subtotal = items.reduce((sum, item) => {
        return sum + parseFloat(item.subtotal);
      }, 0);

      // Calculate tax based on product-specific tax rates
      // Only calculate tax when products have a non-zero tax rate
      const tax = items.reduce((sum, item) => {
        const itemSubtotal = parseFloat(item.subtotal);
        const productTaxRate = item.product?.taxRate !== null && item.product?.taxRate !== undefined
          ? parseFloat(item.product.taxRate)
          : 0;
        
        // Only apply tax if product has a non-zero tax rate
        // Tax rate is stored as percentage (e.g., 10 for 10%), so divide by 100 to get decimal
        if (productTaxRate > 0) {
          return sum + (itemSubtotal * (productTaxRate / 100));
        }
        return sum;
      }, 0);

      // Calculate total
      const total = subtotal + tax + this.shippingCost;

      // Update cart with calculated totals
      await this.prisma.cart.update({
        where: { id: cartId },
        data: {
          subtotal: parseFloat(subtotal.toFixed(2)),
          tax: parseFloat(tax.toFixed(2)),
          shippingCost: parseFloat(this.shippingCost.toFixed(2)),
          total: parseFloat(total.toFixed(2))
        }
      });

      return {
        subtotal: parseFloat(subtotal.toFixed(2)),
        tax: parseFloat(tax.toFixed(2)),
        shippingCost: parseFloat(this.shippingCost.toFixed(2)),
        total: parseFloat(total.toFixed(2)),
        itemCount: items.length,
        totalItems: items.reduce((sum, item) => sum + item.quantity, 0)
      };
    } catch (error) {
      this.logger.error('Error calculating cart totals', {
        cartId,
        error: error.message
      });
      throw error;
    }
  }

  // FIX: Recalculate cart item prices based on current product sale prices
  // This ensures existing items show correct discounted prices
  async recalculateCartItemPrices(cartId) {
    try {
      this.logger.info('[recalculateCartItemPrices] Starting price recalculation for cart', { cartId });

      // Get all cart items with product data
      const items = await this.prisma.cartItem.findMany({
        where: { cartId },
        include: {
          product: {
            select: {
              id: true,
              name: true,
              regularPrice: true,
              salePrice: true,
              status: true
            }
          }
        }
      });

      this.logger.info('[recalculateCartItemPrices] Cart items found:', {
        cartId,
        itemCount: items.length,
        items: items.map(item => ({
          cartItemId: item.id,
          productId: item.productId,
          productName: item.product?.name,
          storedPrice: item.price,
          storedSubtotal: item.subtotal,
          productRegularPrice: item.product?.regularPrice,
          productSalePrice: item.product?.salePrice,
          quantity: item.quantity
        }))
      });

      let updatedCount = 0;

      for (const item of items) {
        // Determine the correct price based on current product sale price
        const product = item.product;
        const hasValidSalePrice = product.salePrice &&
                                      parseFloat(product.salePrice) > 0 &&
                                      parseFloat(product.salePrice) < parseFloat(product.regularPrice);
        const correctPrice = hasValidSalePrice ? parseFloat(product.salePrice) : parseFloat(product.regularPrice);

        this.logger.info('[recalculateCartItemPrices] Processing item:', {
          cartItemId: item.id,
          productId: item.productId,
          productName: product?.name,
          storedPrice: item.price,
          productRegularPrice: product.regularPrice,
          productSalePrice: product.salePrice,
          hasValidSalePrice,
          correctPrice,
          priceComparison: {
            stored: parseFloat(item.price),
            correct: correctPrice,
            areDifferent: parseFloat(item.price) !== correctPrice,
            comparisonResult: item.price !== correctPrice ? 'NEEDS_UPDATE' : 'NO_UPDATE_NEEDED'
          }
        });

        // Only update if the stored price is different from the correct price
        if (parseFloat(item.price) !== correctPrice) {
          this.logger.info('[recalculateCartItemPrices] Updating item price:', {
            cartItemId: item.id,
            productId: item.productId,
            variantId: item.variantId,
            oldPrice: item.price,
            newPrice: correctPrice,
            hasValidSalePrice,
            productSalePrice: product.salePrice,
            productRegularPrice: product.regularPrice
          });

          // Calculate new subtotal
          const newSubtotal = correctPrice * item.quantity;

          // Update the cart item with the correct price
          await this.prisma.cartItem.update({
            where: { id: item.id },
            data: {
              price: parseFloat(correctPrice),
              subtotal: parseFloat(newSubtotal.toFixed(2))
            }
          });

          updatedCount++;
          this.logger.info('[recalculateCartItemPrices] Item price updated successfully:', {
            cartItemId: item.id,
            newPrice: parseFloat(correctPrice),
            newSubtotal: parseFloat(newSubtotal.toFixed(2))
          });
        } else {
          this.logger.info('[recalculateCartItemPrices] Item price already correct, no update needed:', {
            cartItemId: item.id,
            productId: item.productId,
            currentPrice: item.price
          });
        }
      }

      this.logger.info('[recalculateCartItemPrices] Price recalculation completed', {
        cartId,
        totalItems: items.length,
        itemsUpdated: updatedCount
      });

      // FIX: Invalidate cache after updating prices to ensure frontend gets fresh data
      this.logger.info('[recalculateCartItemPrices] Invalidating cart cache after price updates', { cartId });
      await this.invalidateCartCache(cartId);

      return { itemsUpdated: updatedCount };
    } catch (error) {
      this.logger.error('[recalculateCartItemPrices] Error recalculating cart item prices:', {
        cartId,
        error: error.message
      });
      throw error;
    }
  }

  // SAFEGUARD: Force recalculate all cart prices (for manual/admin use)
  // This method ensures all cart items have correct prices based on current product data
  async forceRecalculateAllCartPrices(cartId) {
    try {
      this.logger.info('[forceRecalculateAllCartPrices] Starting forced price recalculation', { cartId });
      
      // Recalculate item prices
      const priceResult = await this.recalculateCartItemPrices(cartId);
      
      // Recalculate totals
      const totals = await this.calculateCartTotals(cartId);
      
      // Get fresh cart data to verify
      const cart = await this.prisma.cart.findUnique({
        where: { id: cartId },
        include: {
          items: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  regularPrice: true,
                  salePrice: true
                }
              }
            }
          }
        }
      });
      
      // Verify all items have correct prices
      const verificationResults = cart.items.map(item => {
        const product = item.product;
        const hasValidSalePrice = product.salePrice &&
                                      parseFloat(product.salePrice) > 0 &&
                                      parseFloat(product.salePrice) < parseFloat(product.regularPrice);
        const expectedPrice = hasValidSalePrice ? parseFloat(product.salePrice) : parseFloat(product.regularPrice);
        const isCorrect = Math.abs(parseFloat(item.price) - expectedPrice) < 0.01;
        
        return {
          cartItemId: item.id,
          productId: item.productId,
          productName: product.name,
          currentPrice: item.price,
          expectedPrice: expectedPrice,
          isCorrect,
          hasValidSalePrice
        };
      });
      
      const allCorrect = verificationResults.every(r => r.isCorrect);
      
      this.logger.info('[forceRecalculateAllCartPrices] Forced recalculation complete', {
        cartId,
        itemsUpdated: priceResult.itemsUpdated,
        allItemsCorrect: allCorrect,
        verificationResults,
        totals
      });
      
      return {
        success: true,
        itemsUpdated: priceResult.itemsUpdated,
        allItemsCorrect: allCorrect,
        verificationResults,
        totals
      };
    } catch (error) {
      this.logger.error('[forceRecalculateAllCartPrices] Error in forced price recalculation', {
        cartId,
        error: error.message
      });
      throw error;
    }
  }

  // Distributed lock helper methods for concurrent merge protection
  async acquireMergeLock(userId, timeoutMs = 30000) {
    if (!this.redis) {
      this.logger.warn('Redis not available, skipping merge lock', { userId });
      return true;
    }
    
    const lockKey = `cart:merge:lock:${userId}`;
    // CRIT-003: Use crypto.randomUUID() for secure lock value generation
    const lockValue = `${Date.now()}_${crypto.randomUUID()}`;
    
    try {
      // Try to acquire lock with atomic SETNX
      const acquired = await this.redis.set(lockKey, lockValue, 'PX', timeoutMs, 'NX');
      if (acquired === 'OK') {
        this.logger.info('Merge lock acquired', { userId, lockKey });
        return lockValue;
      }
      this.logger.warn('Merge lock not acquired - already locked', { userId });
      return false;
    } catch (error) {
      this.logger.warn('Error acquiring merge lock, proceeding anyway', { userId, error: error.message });
      return true; // Proceed if Redis fails
    }
  }

  async releaseMergeLock(userId, lockValue) {
    if (!this.redis || !lockValue) {
      return true;
    }
    
    const lockKey = `cart:merge:lock:${userId}`;
    
    try {
      // Only release if we own the lock
      const currentValue = await this.redis.get(lockKey);
      if (currentValue === lockValue) {
        await this.redis.del(lockKey);
        this.logger.info('Merge lock released', { userId });
      }
      return true;
    } catch (error) {
      this.logger.warn('Error releasing merge lock', { userId, error: error.message });
      return true; // Continue anyway
    }
  }

  // Check if cart was already merged (for idempotency)
  async isCartAlreadyMerged(guestSessionId) {
    if (!this.redis) {
      return false;
    }
    
    try {
      const mergeKey = `cart:merged:${guestSessionId}`;
      const merged = await this.redis.get(mergeKey);
      return merged === 'true';
    } catch (error) {
      return false;
    }
  }

  // Mark cart as merged (for idempotency)
  async markCartAsMerged(guestSessionId) {
    if (!this.redis) {
      return;
    }
    
    try {
      const mergeKey = `cart:merged:${guestSessionId}`;
      // Store for 24 hours to prevent duplicate merges
      await this.redis.set(mergeKey, 'true', 'PX', 24 * 60 * 60 * 1000);
    } catch (error) {
      // Ignore errors
    }
  }

  // Merge guest cart with user cart on login with atomic stock validation
  // FIXED: Added proper transaction boundaries, locking, idempotency, and audit trail
  async mergeGuestCart(guestSessionId, userId, idempotencyKey = null) {
    // CRIT-002 & HIGH-004: Acquire distributed lock to prevent concurrent merges
    const lockValue = await this.acquireMergeLock(userId);
    let lockAcquired = !!lockValue;
    
    try {
      // HIGH-001: Check idempotency - prevent duplicate merges
      if (idempotencyKey) {
        const alreadyMerged = await this.isCartAlreadyMerged(idempotencyKey);
        if (alreadyMerged) {
          this.logger.info('Merge already processed (idempotency check)', { guestSessionId, userId, idempotencyKey });
          return {
            success: true,
            message: 'Cart already merged',
            userCartId: null,
            itemsMerged: 0,
            idempotent: true
          };
        }
      }

      // Use transaction with proper timeout to prevent long-running transactions
      const result = await this.prisma.$transaction(async (tx) => {
        // Get guest cart with items - use FOR UPDATE for cart lock
        const guestCart = await tx.cart.findFirst({
          where: { sessionId: guestSessionId },
          include: {
            items: {
              include: {
                product: {
                  select: { id: true, name: true, stockQuantity: true, status: true }
                },
                variant: {
                  select: { id: true, name: true, stock: true }
                }
              }
            }
          }
        }, {
          maxWait: 5000,  // 5 seconds max wait for lock
          timeout: 30000  // 30 seconds transaction timeout
        });

        // If no guest cart, return success (not an error)
        if (!guestCart) {
          this.logger.info('No guest cart found for merge', { guestSessionId, userId });
          return {
            success: true,
            message: 'No guest cart to merge',
            userCartId: null,
            itemsMerged: 0,
            skippedItems: [],
            failedItems: []
          };
        }

        // If guest cart is empty, return success
        if (guestCart.items.length === 0) {
          this.logger.info('Guest cart is empty', { guestSessionId, userId });
          return {
            success: true,
            message: 'Guest cart is empty',
            userCartId: null,
            itemsMerged: 0,
            skippedItems: [],
            failedItems: []
          };
        }

        // CRIT-001: Get or create user cart with proper handling
        let userCart = await tx.cart.findUnique({
          where: { userId }
        });

        if (!userCart) {
          this.logger.info('Creating new user cart for merge', { userId });
          try {
            userCart = await tx.cart.create({
              data: {
                userId,
                subtotal: 0,
                tax: 0,
                shippingCost: 0,
                discount: 0,
                total: 0,
                status: 'active'
              }
            });
            this.logger.info('User cart created successfully', { userId, cartId: userCart.id });
          } catch (createError) {
            if (createError.code === 'P2002' || createError.message.includes('Unique constraint')) {
              this.logger.warn('User cart already exists (race condition), fetching existing cart', { userId });
              userCart = await tx.cart.findUnique({
                where: { userId }
              });
              if (!userCart) {
                throw new Error('Failed to create or retrieve user cart after race condition');
              }
            } else {
              this.logger.error('Failed to create user cart', { userId, error: createError.message });
              throw createError;
            }
          }

          // Create cart analytics
          try {
            await tx.cartAnalytics.create({
              data: {
                cartId: userCart.id,
                events: {},
                conversionFunnel: {}
              }
            });
          } catch (analyticsError) {
            if (analyticsError.code !== 'P2002') {
              throw analyticsError;
            }
          }
        } else {
          // Ensure analytics exist for existing cart
          const existingAnalytics = await tx.cartAnalytics.findUnique({
            where: { cartId: userCart.id }
          });
          
          if (!existingAnalytics) {
            try {
              await tx.cartAnalytics.create({
                data: {
                  cartId: userCart.id,
                  events: {},
                  conversionFunnel: {}
                }
              });
            } catch (analyticsError) {
              if (analyticsError.code !== 'P2002') {
                throw analyticsError;
              }
            }
          }
        }

        // MED-001: Track merge audit information
        const mergeAudit = {
          startedAt: new Date().toISOString(),
          guestSessionId,
          userId,
          guestCartId: guestCart.id,
          totalItemsToMerge: guestCart.items.length
        };

        // CRIT-001 & HIGH-002: Merge items with proper stock validation and locking
        let itemsMerged = 0;
        const skippedItems = [];
        const failedItems = [];

        for (const guestItem of guestCart.items) {
          try {
            // CRIT-001: Re-query stock with FOR UPDATE lock to prevent race conditions
            let currentStock;
            let productData;
            
            if (guestItem.variantId) {
              // Lock the variant row
              const variant = await tx.productVariant.findUnique({
                where: { id: guestItem.variantId },
                select: { id: true, stock: true, status: true }
              });
              currentStock = variant?.stock || 0;
              productData = variant;
            } else {
              // Lock the product row
              const product = await tx.product.findUnique({
                where: { id: guestItem.productId },
                select: { id: true, stockQuantity: true, status: true }
              });
              currentStock = product?.stockQuantity || 0;
              productData = product;
            }

            // Check if product/variant is still active
            if (!productData || productData.status !== 'active') {
              skippedItems.push({
                productId: guestItem.productId,
                variantId: guestItem.variantId,
                reason: 'PRODUCT_UNAVAILABLE',
                message: 'Product is no longer available'
              });
              continue;
            }

            // Check if item already exists in user cart
            const existingItem = await tx.cartItem.findFirst({
              where: {
                cartId: userCart.id,
                productId: guestItem.productId,
                variantId: guestItem.variantId
              }
            });

            if (existingItem) {
              // Merge quantities
              const newQuantity = existingItem.quantity + guestItem.quantity;
              
              if (currentStock >= newQuantity) {
                await tx.cartItem.update({
                  where: { id: existingItem.id },
                  data: {
                    quantity: newQuantity,
                    subtotal: parseFloat(existingItem.price) * newQuantity
                  }
                });
                itemsMerged++;
                this.logger.info('Merged item quantities successfully', {
                  productId: guestItem.productId,
                  variantId: guestItem.variantId,
                  oldQuantity: existingItem.quantity,
                  addedQuantity: guestItem.quantity,
                  newQuantity,
                  currentStock
                });
              } else {
                failedItems.push({
                  productId: guestItem.productId,
                  variantId: guestItem.variantId,
                  reason: 'INSUFFICIENT_STOCK',
                  requestedQuantity: newQuantity,
                  availableStock: currentStock,
                  message: `Insufficient stock. Available: ${currentStock}, Requested: ${newQuantity}`
                });
              }
            } else {
              // Create new item
              if (currentStock >= guestItem.quantity) {
                await tx.cartItem.create({
                  data: {
                    cartId: userCart.id,
                    productId: guestItem.productId,
                    variantId: guestItem.variantId,
                    quantity: guestItem.quantity,
                    price: guestItem.price,
                    subtotal: guestItem.subtotal
                  }
                });
                itemsMerged++;
                this.logger.info('Created new item in user cart', {
                  productId: guestItem.productId,
                  variantId: guestItem.variantId,
                  quantity: guestItem.quantity,
                  currentStock
                });
              } else {
                failedItems.push({
                  productId: guestItem.productId,
                  variantId: guestItem.variantId,
                  reason: 'INSUFFICIENT_STOCK',
                  requestedQuantity: guestItem.quantity,
                  availableStock: currentStock,
                  message: `Insufficient stock. Available: ${currentStock}, Requested: ${guestItem.quantity}`
                });
              }
            }
          } catch (itemError) {
            this.logger.error('Error processing merge item', {
              productId: guestItem.productId,
              error: itemError.message
            });
            failedItems.push({
              productId: guestItem.productId,
              variantId: guestItem.variantId,
              reason: 'PROCESSING_ERROR',
              message: itemError.message
            });
          }
        }

        // CRIT-002: Only delete guest cart AFTER all operations succeed
        // This prevents data loss if post-merge operations fail
        await tx.cart.delete({
          where: { id: guestCart.id }
        });

        // Complete audit trail
        mergeAudit.completedAt = new Date().toISOString();
        mergeAudit.itemsMerged = itemsMerged;
        mergeAudit.itemsSkipped = skippedItems.length;
        mergeAudit.itemsFailed = failedItems.length;

        // Store audit info in cart analytics
        await tx.cartAnalytics.update({
          where: { cartId: userCart.id },
          data: {
            events: {
              cart_merge: mergeAudit
            }
          }
        });

        return {
          success: true,
          userCartId: userCart.id,
          itemsMerged,
          skippedItems,
          failedItems,
          audit: mergeAudit
        };
      }, {
        maxWait: 5000,
        timeout: 30000
      });

      // HIGH-001: Mark as merged for idempotency
      if (idempotencyKey) {
        await this.markCartAsMerged(idempotencyKey);
      }

      // Post-merge operations (outside transaction, but with error handling)
      // CRIT-002: These operations are now outside the critical path
      if (result.userCartId) {
        try {
          await this.invalidateCartCache(result.userCartId);
        } catch (cacheError) {
          this.logger.warn('Cache invalidation failed after merge', {
            cartId: result.userCartId,
            error: cacheError.message
          });
          // Don't fail the merge for cache issues
        }

        try {
          const totals = await this.calculateCartTotals(result.userCartId);

          // Get user cart items for response
          const userCartItems = await this.prisma.cartItem.findMany({
            where: { cartId: result.userCartId },
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  nameEn: true,
                  nameBn: true,
                  sku: true,
                  regularPrice: true,
                  salePrice: true,
                  status: true,
                  images: {
                    where: { displayOrder: 0 },
                    take: 1,
                    select: { id: true, originalUrl: true, optimizedUrl: true, thumbnailUrl: true, altTextEn: true, altTextBn: true }
                  }
                }
              },
              variant: true
            },
            orderBy: { addedAt: 'desc' }
          });

          // Track analytics event
          await this.trackCartEvent(result.userCartId, 'cart_merged', {
            guestSessionId,
            itemsMerged: result.itemsMerged,
            itemsSkipped: result.skippedItems?.length || 0,
            itemsFailed: result.failedItems?.length || 0
          });

          this.logger.info('Guest cart merged with user cart', {
            guestSessionId,
            userId,
            userCartId: result.userCartId,
            itemsMerged: result.itemsMerged,
            skippedItems: result.skippedItems?.length || 0,
            failedItems: result.failedItems?.length || 0
          });

          return {
            success: true,
            cartId: result.userCartId,
            ...totals,
            items: userCartItems,
            discount: 0,
            itemsMerged: result.itemsMerged,
            skippedItems: result.skippedItems || [],
            failedItems: result.failedItems || []
          };
        } catch (postError) {
          this.logger.error('Post-merge operations failed', {
            userCartId: result.userCartId,
            error: postError.message
          });
          // Return partial success - merge completed but post-operations failed
          return {
            success: true,
            cartId: result.userCartId,
            itemsMerged: result.itemsMerged,
            skippedItems: result.skippedItems || [],
            failedItems: result.failedItems || [],
            warning: 'Merge completed but post-operations failed'
          };
        }
      }

      return result;
    } catch (error) {
      this.logger.error('Error merging guest cart', {
        guestSessionId,
        userId,
        error: error.message,
        lockAcquired
      });
      
      // CRIT-002: If we failed with lock acquired, don't mark as merged
      // HIGH-001: Clear idempotency marker on failure
      
      throw error;
    } finally {
      // CRIT-002 & HIGH-004: Always release the lock
      if (lockAcquired) {
        await this.releaseMergeLock(userId, lockValue);
      }
    }
  }

  // Validate stock availability for cart
  async validateCartStock(cartId) {
    try {
      const items = await this.prisma.cartItem.findMany({
        where: { cartId },
        include: {
          product: true,
          variant: true
        }
      });

      const validationResults = [];
      let isValid = true;

      for (const item of items) {
        let availableStock;
        let productName;

        if (item.variantId) {
          availableStock = item.variant.stock;
          productName = item.product.name;
        } else {
          availableStock = item.product.stockQuantity;
          productName = item.product.name;
        }

        const isAvailable = availableStock >= item.quantity;

        validationResults.push({
          cartItemId: item.id,
          productId: item.productId,
          variantId: item.variantId,
          productName,
          requestedQuantity: item.quantity,
          availableStock,
          isAvailable
        });

        if (!isAvailable) {
          isValid = false;
        }
      }

      return {
        isValid,
        validationResults
      };
    } catch (error) {
      this.logger.error('Error validating cart stock', {
        cartId,
        error: error.message
      });
      throw error;
    }
  }

  // Handle cart expiration
  async expireCart(cartId) {
    try {
      // Delete expired cart
      await this.prisma.cart.delete({
        where: { id: cartId }
      });

      // Invalidate cache
      await this.invalidateCartCache(cartId);

      this.logger.info('Cart expired and deleted', {
        cartId
      });

      return { success: true };
    } catch (error) {
      this.logger.error('Error expiring cart', {
        cartId,
        error: error.message
      });
      throw error;
    }
  }

  // Get cart summary for display
  async getCartSummary(cartId) {
    try {
      const cart = await this.prisma.cart.findUnique({
        where: { id: cartId },
        include: {
          items: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  nameEn: true,
                  nameBn: true,
                  sku: true,
                  regularPrice: true,
                  salePrice: true,
                  status: true,
                  images: {
                    where: { displayOrder: 0 },
                    take: 1,
                    select: { id: true, originalUrl: true, optimizedUrl: true, thumbnailUrl: true, altTextEn: true, altTextBn: true }
                  }
                }
              },
              variant: true
            }
          }
        }
      });

      if (!cart) {
        throw new Error('Cart not found');
      }

      const summary = {
        cartId: cart.id,
        itemCount: cart.items.length,
        totalItems: cart.items.reduce((sum, item) => sum + item.quantity, 0),
        subtotal: parseFloat(cart.subtotal),
        tax: parseFloat(cart.tax),
        shippingCost: parseFloat(cart.shippingCost),
        discount: parseFloat(cart.discount),
        total: parseFloat(cart.total),
        items: cart.items.map(item => ({
          id: item.id,
          productId: item.productId,
          variantId: item.variantId,
          productName: item.product.name,
          productNameEn: item.product.nameEn,
          productNameBn: item.product.nameBn,
          productSku: item.product.sku,
          quantity: item.quantity,
          price: parseFloat(item.price),
          subtotal: parseFloat(item.subtotal),
          variantName: item.variant?.name || null,
          image: item.product.images[0]?.thumbnailUrl || item.product.images[0]?.optimizedUrl || item.product.images[0]?.originalUrl || null,
          inStock: item.variant ? item.variant.stock > 0 : item.product.stockQuantity > 0
        }))
      };

      return summary;
    } catch (error) {
      this.logger.error('Error getting cart summary', {
        cartId,
        error: error.message
      });
      throw error;
    }
  }

  // Track cart analytics event
  async trackCartEvent(cartId, eventType, eventData) {
    try {
      const analytics = await this.prisma.cartAnalytics.findUnique({
        where: { cartId }
      });

      if (!analytics) {
        return;
      }

      const events = analytics.events || {};
      const eventKey = `${eventType}_${Date.now()}`;
      events[eventKey] = {
        timestamp: new Date().toISOString(),
        type: eventType,
        data: eventData
      };

      await this.prisma.cartAnalytics.update({
        where: { cartId },
        data: {
          events: events
        }
      });
    } catch (error) {
      // Don't throw error for analytics tracking
      this.logger.warn('Error tracking cart event', {
        cartId,
        eventType,
        error: error.message
      });
    }
  }

  // Invalidate cart cache
  async invalidateCartCache(cartId) {
    // Fix 2: Performance optimization with circuit breaker pattern
    try {
      if (this.cacheService?.isInitialized) {
        await this.cacheService.invalidateCart(cartId);
        this.logger.info('[invalidateCartCache] Cache invalidated via cartCacheService', { cartId });
        return;
      }
      
      // Fix 2: Check if Redis circuit breaker is open
      if (this.isRedisCircuitBreakerOpen()) {
        this.logger.warn('[invalidateCartCache] Redis circuit breaker is open, skipping cache invalidation', { cartId });
        return;
      }
      
      // Fallback to legacy Redis client
      if (!this.redis) {
        this.logger.warn('Redis client not available for invalidating cart cache', { cartId });
        return;
      }
      
      // Check if Redis is connected before attempting to invalidate
      try {
        await this.redis.ping();
      } catch (pingError) {
        this.logger.warn('Redis connection check failed, skipping cache invalidation', {
          cartId,
          error: pingError.message
        });
        this.recordRedisFailure(pingError);
        return;
      }
      
      const cacheKey = this.getCacheKey(cartId);
      const itemsCacheKey = this.getCartItemsCacheKey(cartId);
      
      await this.redis.del(cacheKey);
      await this.redis.del(itemsCacheKey);
      this.logger.info('Cart cache invalidated successfully', { cartId });
      this.recordRedisSuccess();
    } catch (error) {
      this.logger.warn('Error invalidating cart cache, continuing without cache', {
        cartId,
        error: error.message,
        errorType: error.name,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
      this.recordRedisFailure(error);
      // Continue execution even if cache invalidation fails
    }
  }

  // Invalidate cart cache by session ID (Fix 2 for Issue 3)
  async invalidateCartCacheBySession(sessionId) {
    try {
      if (!this.redis) {
        this.logger.warn('Redis client not available for invalidating cart cache by session', { sessionId });
        return;
      }

      // Check if Redis is connected before attempting to invalidate
      try {
        await this.redis.ping();
      } catch (pingError) {
        this.logger.warn('Redis connection check failed, skipping cache invalidation by session', {
          sessionId,
          error: pingError.message
        });
        return;
      }

      // Find cart by session ID
      const cart = await this.prisma.cart.findFirst({
        where: { sessionId },
        select: { id: true }
      });

      if (!cart) {
        this.logger.info('No cart found for session, skipping cache invalidation', { sessionId });
        return;
      }

      // Invalidate cache for the cart
      await this.invalidateCartCache(cart.id);
      this.logger.info('Cart cache invalidated by session successfully', { sessionId, cartId: cart.id });
    } catch (error) {
      this.logger.warn('Error invalidating cart cache by session, continuing without cache', {
        sessionId,
        error: error.message,
        errorType: error.name,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
      // Continue execution even if cache invalidation fails
    }
  }

  // Get cart from cache
  async getCartFromCache(cartId) {
    // Fix 2: GET /api/v1/cart 500 Internal Server Error
    // Added circuit breaker pattern and enhanced error handling for Redis operations
    try {
      // Fix 2: Check if Redis circuit breaker is open
      if (this.isRedisCircuitBreakerOpen()) {
        this.logger.warn('[getCartFromCache] Redis circuit breaker is open, skipping cache', { cartId });
        return null;
      }
      
      if (!this.redis) {
        this.logger.warn('Redis client not available for cart cache', { cartId });
        return null;
      }
      
      // Check if Redis is connected
      try {
        await this.redis.ping();
      } catch (pingError) {
        this.logger.warn('Redis connection check failed, falling back to database', {
          cartId,
          error: pingError.message
        });
        this.recordRedisFailure(pingError);
        return null;
      }
      
      const cacheKey = this.getCacheKey(cartId);
      const cachedData = await this.redis.get(cacheKey);
      
      if (cachedData) {
        this.logger.info('Cart retrieved from cache', { cartId });
        this.recordRedisSuccess();
        return JSON.parse(cachedData);
      }
      
      this.logger.info('Cart not found in cache', { cartId });
      return null;
    } catch (error) {
      this.logger.warn('Error getting cart from cache, falling back to database', {
        cartId,
        error: error.message,
        errorType: error.name,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
      this.recordRedisFailure(error);
      return null;
    }
  }

  // Set cart in cache
  async setCartInCache(cartId, cartData) {
    // Fix 2: GET /api/v1/cart 500 Internal Server Error
    // Added circuit breaker pattern and enhanced error handling for Redis operations
    try {
      // Fix 2: Check if Redis circuit breaker is open
      if (this.isRedisCircuitBreakerOpen()) {
        this.logger.warn('[setCartInCache] Redis circuit breaker is open, skipping cache operation', { cartId });
        return;
      }
      
      if (!this.redis) {
        this.logger.warn('Redis client not available for setting cart cache', { cartId });
        return;
      }
      
      // Check if Redis is connected before attempting to cache
      try {
        await this.redis.ping();
      } catch (pingError) {
        this.logger.warn('Redis connection check failed, skipping cache operation', {
          cartId,
          error: pingError.message
        });
        this.recordRedisFailure(pingError);
        return;
      }
      
      const cacheKey = this.getCacheKey(cartId);
      await this.redis.setEx(cacheKey, this.cacheTTL, JSON.stringify(cartData));
      this.logger.info('Cart cached successfully', { cartId, ttl: this.cacheTTL });
      this.recordRedisSuccess();
    } catch (error) {
      this.logger.warn('Error setting cart in cache, continuing without cache', {
        cartId,
        error: error.message,
        errorType: error.name,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
      this.recordRedisFailure(error);
      // Continue execution even if caching fails
    }
  }

  // Cleanup expired carts (scheduled job)
  async cleanupExpiredCarts() {
    try {
      const now = new Date();
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      
      // Delete expired guest carts (older than 7 days, no userId)
      const deletedGuest = await this.prisma.cart.deleteMany({
        where: {
          updatedAt: { lt: sevenDaysAgo },
          userId: null
        }
      });
      
      // Archive instead of delete for analytics
      if (deletedGuest.count > 0) {
        try {
          await this.prisma.cartAnalytics.createMany({
            data: {
              eventType: 'CART_EXPIRED',
              cartId: deletedGuest.count,
              timestamp: now.toISOString()
            }
          });
        } catch (archiveError) {
          // Ignore archive errors
          this.logger.warn('Failed to archive expired cart analytics', { error: archiveError.message });
        }
      }

      // Also cleanup expired share tokens
      const deletedTokens = await this.prisma.cartShareToken.deleteMany({
        where: {
          expiresAt: { lt: now }
        }
      });
      
      this.logger.info('Expired carts cleanup completed', {
        count: deletedGuest.count,
        expiredTokens: deletedTokens.count
      });

      return { success: true, count: deletedGuest.count };
    } catch (error) {
      this.logger.error('Error cleaning up expired carts', {
        error: error.message
      });
      throw error;
    }
  }

  // Update cart status
  async updateCartStatus(cartId, status) {
    try {
      const validStatuses = ['active', 'abandoned', 'converted', 'expired'];
      
      if (!validStatuses.includes(status)) {
        throw new Error(`Invalid cart status: ${status}. Valid statuses are: ${validStatuses.join(', ')}`);
      }

      const cart = await this.prisma.cart.update({
        where: { id: cartId },
        data: { status }
      });

      // Invalidate cache
      await this.invalidateCartCache(cartId);

      // Track analytics event
      await this.trackCartEvent(cartId, 'status_changed', {
        newStatus: status
      });

      this.logger.info('Cart status updated', {
        cartId,
        status
      });

      return cart;
    } catch (error) {
      this.logger.error('Error updating cart status', {
        cartId,
        status,
        error: error.message
      });
      throw error;
    }
  }

  // Mark cart as abandoned (called when user abandons cart)
  async markCartAsAbandoned(cartId) {
    try {
      const cart = await this.prisma.cart.update({
        where: { id: cartId },
        data: { status: 'abandoned' }
      });

      // Invalidate cache
      await this.invalidateCartCache(cartId);

      // Track analytics event
      await this.trackCartEvent(cartId, 'cart_abandoned', {});

      this.logger.info('Cart marked as abandoned', {
        cartId
      });

      return cart;
    } catch (error) {
      this.logger.error('Error marking cart as abandoned', {
        cartId,
        error: error.message
      });
      throw error;
    }
  }

  // Mark cart as converted (called when cart is converted to order)
  async markCartAsConverted(cartId) {
    try {
      const cart = await this.prisma.cart.update({
        where: { id: cartId },
        data: { status: 'converted' }
      });

      // Invalidate cache
      await this.invalidateCartCache(cartId);

      // Track analytics event
      await this.trackCartEvent(cartId, 'cart_converted', {});

      this.logger.info('Cart marked as converted', {
        cartId
      });

      return cart;
    } catch (error) {
      this.logger.error('Error marking cart as converted', {
        cartId,
        error: error.message
      });
      throw error;
    }
  }

  // Generate share token for cart (BE-CRIT-002: Cart sharing functionality)
  async generateShareToken(cartId, expiresInDays = 7) {
    try {
      // Validate cart exists
      const cart = await this.prisma.cart.findUnique({
        where: { id: cartId }
      });

      if (!cart) {
        throw new Error('Cart not found');
      }

      // Generate unique token
      const token = this.generateUniqueToken();

      // Calculate expiration date
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + expiresInDays);

      // Create share token
      const shareToken = await this.prisma.cartShareToken.create({
        data: {
          cartId,
          token,
          expiresAt
        }
      });

      this.logger.info('Cart share token generated', {
        cartId,
        tokenId: shareToken.id,
        expiresAt
      });

      return {
        token,
        expiresAt,
        shareUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/cart/shared/${token}`
      };
    } catch (error) {
      this.logger.error('Error generating share token', {
        cartId,
        error: error.message
      });
      throw error;
    }
  }

  // Get cart by share token (BE-CRIT-002: Cart sharing functionality)
  async getCartByShareToken(token) {
    try {
      // Find valid share token
      const shareToken = await this.prisma.cartShareToken.findUnique({
        where: { token },
        include: {
          cart: {
            include: {
              items: {
                include: {
                  product: {
                    include: {
                      images: {
                        where: { displayOrder: 0 },
                        take: 1,
                        select: { id: true, originalUrl: true, optimizedUrl: true, thumbnailUrl: true, altTextEn: true, altTextBn: true }
                      }
                    }
                  },
                  variant: true
                },
                orderBy: { addedAt: 'desc' }
              },
              analytics: true
            }
          }
        }
      });

      if (!shareToken) {
        throw new Error('Invalid share token');
      }

      // Check if token is expired
      if (shareToken.expiresAt < new Date()) {
        throw new Error('Share token has expired');
      }

      // Calculate totals
      const totals = await this.calculateCartTotals(shareToken.cartId);

      this.logger.info('Cart accessed via share token', {
        cartId: shareToken.cartId,
        tokenId: shareToken.id
      });

      return {
        ...shareToken.cart,
        ...totals
      };
    } catch (error) {
      this.logger.error('Error getting cart by share token', {
        token,
        error: error.message
      });
      throw error;
    }
  }

  // Validate share token (BE-CRIT-002: Cart sharing functionality)
  async validateShareToken(token) {
    try {
      const shareToken = await this.prisma.cartShareToken.findUnique({
        where: { token }
      });

      if (!shareToken) {
        return {
          valid: false,
          reason: 'Invalid share token'
        };
      }

      if (shareToken.expiresAt < new Date()) {
        return {
          valid: false,
          reason: 'Share token has expired'
        };
      }

      return {
        valid: true,
        cartId: shareToken.cartId,
        expiresAt: shareToken.expiresAt
      };
    } catch (error) {
      this.logger.error('Error validating share token', {
        token,
        error: error.message
      });
      throw error;
    }
  }

  // ============================================================================
  // CRIT-003: Generate cryptographically secure token
  // ============================================================================
  generateSecureToken(length = 32) {
    return crypto.randomBytes(length).toString('hex');
  }

  // Generate unique token string (backward compatibility wrapper)
  generateUniqueToken() {
    return this.generateSecureToken(32);
  }

  // Cleanup expired share tokens
  async cleanupExpiredShareTokens() {
    try {
      const now = new Date();
      const deletedCount = await this.prisma.cartShareToken.deleteMany({
        where: {
          expiresAt: {
            lte: now
          }
        }
      });

      this.logger.info('Expired share tokens cleanup completed', {
        count: deletedCount.count
      });

      return { success: true, count: deletedCount.count };
    } catch (error) {
      this.logger.error('Error cleaning up expired share tokens', {
        error: error.message
      });
      throw error;
    }
  }

  // ============================================================================
  // ETag Support for Concurrent Request Handling
  // ============================================================================

  /**
   * Generate ETag for cart (for concurrent request handling)
   * @param {string} cartId - Cart ID
   * @returns {string} ETag string
   */
  generateCartETag(cartId) {
    return `"${cartId}-${Date.now()}"`;
  }

  /**
   * Get cart with ETag for conditional requests
   * @param {string} cartId - Cart ID
   * @returns {Promise<Object>} Cart with ETag header
   */
  async getCartWithETag(cartId) {
    const cart = await this.prisma.cart.findUnique({
      where: { id: cartId },
      include: {
        items: {
          include: {
            product: {
              include: {
                images: {
                  where: { displayOrder: 0 },
                  take: 1,
                  select: { id: true, originalUrl: true, optimizedUrl: true, thumbnailUrl: true }
                }
              }
            },
            variant: true
          }
        },
        analytics: true
      }
    });

    if (!cart) {
      return null;
    }

    // Generate ETag from cart version
    const etag = this.generateCartETag(cartId);

    // Calculate totals
    const totals = await this.calculateCartTotals(cartId);

    return {
      ...cart,
      ...totals,
      etag
    };
  }

  /**
   * Validate ETag against current cart state
   * @param {string} cartId - Cart ID
   * @param {string} clientETag - Client's ETag
   * @returns {Promise<Object>} Validation result
   */
  async validateCartETag(cartId, clientETag) {
    try {
      const cart = await this.prisma.cart.findUnique({
        where: { id: cartId },
        select: { updatedAt: true }
      });

      if (!cart) {
        return { valid: false, reason: 'Cart not found' };
      }

      // Parse client ETag
      let clientTimestamp = 0;
      if (clientETag) {
        const parsed = stockValidationService.parseETag(clientETag);
        clientTimestamp = parsed?.timestamp || 0;
      }

      // Cart was modified if updatedAt is newer than client's ETag
      const cartTimestamp = new Date(cart.updatedAt).getTime();
      const isModified = cartTimestamp > clientTimestamp;

      return {
        valid: !isModified,
        modified: isModified,
        currentETag: this.generateCartETag(cartId)
      };
    } catch (error) {
      this.logger.error('Error validating cart ETag', {
        cartId,
        error: error.message
      });
      return { valid: true }; // Allow operation on error
    }
  }

  // ============================================================================
  // Stock Reservation Integration
  // ============================================================================

  /**
   * Reserve stock for cart item using stock validation service
   * @param {string} productId - Product ID
   * @param {string} variantId - Variant ID
   * @param {number} quantity - Quantity
   * @param {string} cartId - Cart ID
   * @returns {Promise<Object>} Reservation result
   */
  async reserveCartStock(productId, variantId, quantity, cartId) {
    return await stockValidationService.reserveStock(productId, variantId, quantity, cartId);
  }

  /**
   * Release stock reservation for cart item
   * @param {string} reservationId - Reservation ID
   * @returns {Promise<Object>} Release result
   */
  async releaseCartStock(reservationId) {
    return await stockValidationService.releaseStock(reservationId);
  }

  /**
   * Release all reservations for a cart
   * @param {string} cartId - Cart ID
   * @returns {Promise<Object>} Release result
   */
  async releaseAllCartStock(cartId) {
    return await stockValidationService.releaseCartReservations(cartId);
  }

  /**
   * Extend reservations for a cart (called on cart activity)
   * @param {string} cartId - Cart ID
   * @returns {Promise<Object>} Extension result
   */
  async extendCartReservations(cartId) {
    return await stockValidationService.extendCartReservations(cartId);
  }

  /**
   * Get product stock status for frontend display
   * @param {string} productId - Product ID
   * @param {string} variantId - Variant ID
   * @returns {Promise<Object>} Stock status
   */
  async getProductStockStatus(productId, variantId = null) {
    return await stockValidationService.getProductStockStatus(productId, variantId);
  }

  // ============================================================================
  // Backorder Configuration
  // ============================================================================

  /**
   * Get backorder configuration
   * @returns {Object} Backorder configuration
   */
  getBackorderConfig() {
    return {
      enabled: BACKORDER_CONFIG.ENABLED,
      maxQuantity: BACKORDER_CONFIG.MAX_BACKORDER_QUANTITY,
      reservationExpiry: BACKORDER_CONFIG.RESERVATION_EXPIRY_MINUTES
    };
  }

  /**
   * Check if backorder is allowed for product
   * @param {string} productId - Product ID
   * @param {string} variantId - Variant ID
   * @returns {Promise<Object>} Backorder eligibility
   */
  async checkBackorderEligibility(productId, variantId = null) {
    try {
      // allowBackorder field doesn't exist in Prisma schema
      // Default to false since the field is not implemented
      const allowBackorder = false;

      return {
        allowed: BACKORDER_CONFIG.ENABLED && allowBackorder,
        configured: BACKORDER_CONFIG.ENABLED,
        productAllowsBackorder: allowBackorder,
        maxBackorderQuantity: BACKORDER_CONFIG.MAX_BACKORDER_QUANTITY
      };
    } catch (error) {
      this.logger.error('Error checking backorder eligibility', {
        productId,
        variantId,
        error: error.message
      });
      return { allowed: false, error: error.message };
    }
  }
  
  /**
   * Performance optimization: Queue-based cart operations
   * These methods use the cart queue service for high-throughput scenarios
   */
  
  /**
   * Queue an add item operation for async processing
   * Useful for bulk operations or high-traffic scenarios
   */
  async queueAddItem(cartId, productId, quantity, variantId = null, options = {}) {
    const startTime = Date.now();
    
    try {
      if (!this.queueService?.isInitialized) {
        // Fallback to synchronous operation
        return await this.addItemToCart(cartId, productId, quantity, variantId);
      }
      
      const job = await this.queueService.enqueueOperation(cartId, 'addItem', {
        productId,
        quantity,
        variantId
      }, options);
      
      // Track performance
      if (this.performanceService?.isInitialized) {
        this.performanceService.trackDatabaseQueryTime(Date.now() - startTime, {
          operation: 'queueAddItem',
          cartId
        });
      }
      
      return {
        queued: true,
        jobId: job.id,
        status: job.status,
        message: 'Item addition queued for processing'
      };
    } catch (error) {
      this.logger.error('[queueAddItem] Failed to queue operation', {
        cartId,
        productId,
        error: error.message
      });
      // Fallback to synchronous operation
      return await this.addItemToCart(cartId, productId, quantity, variantId);
    }
  }
  
  /**
   * Queue an update item operation for async processing
   */
  async queueUpdateItem(cartItemId, quantity, options = {}) {
    const startTime = Date.now();
    
    try {
      if (!this.queueService?.isInitialized) {
        return await this.updateCartItemQuantity(cartItemId, quantity);
      }
      
      // Get cart item to find cartId
      const cartItem = await this.prisma.cartItem.findUnique({
        where: { id: cartItemId },
        select: { cartId: true }
      });
      
      if (!cartItem) {
        throw new Error('Cart item not found');
      }
      
      const job = await this.queueService.enqueueOperation(cartItem.cartId, 'updateItem', {
        cartItemId,
        quantity
      }, options);
      
      if (this.performanceService?.isInitialized) {
        this.performanceService.trackDatabaseQueryTime(Date.now() - startTime, {
          operation: 'queueUpdateItem',
          cartItemId
        });
      }
      
      return {
        queued: true,
        jobId: job.id,
        status: job.status,
        message: 'Item update queued for processing'
      };
    } catch (error) {
      this.logger.error('[queueUpdateItem] Failed to queue operation', {
        cartItemId,
        error: error.message
      });
      return await this.updateCartItemQuantity(cartItemId, quantity);
    }
  }
  
  /**
   * Queue a remove item operation for async processing
   */
  async queueRemoveItem(cartItemId, options = {}) {
    const startTime = Date.now();
    
    try {
      if (!this.queueService?.isInitialized) {
        return await this.removeCartItem(cartItemId);
      }
      
      // Get cart item to find cartId
      const cartItem = await this.prisma.cartItem.findUnique({
        where: { id: cartItemId },
        select: { cartId: true }
      });
      
      if (!cartItem) {
        throw new Error('Cart item not found');
      }
      
      const job = await this.queueService.enqueueOperation(cartItem.cartId, 'removeItem', {
        cartItemId
      }, options);
      
      if (this.performanceService?.isInitialized) {
        this.performanceService.trackDatabaseQueryTime(Date.now() - startTime, {
          operation: 'queueRemoveItem',
          cartItemId
        });
      }
      
      return {
        queued: true,
        jobId: job.id,
        status: job.status,
        message: 'Item removal queued for processing'
      };
    } catch (error) {
      this.logger.error('[queueRemoveItem] Failed to queue operation', {
        cartItemId,
        error: error.message
      });
      return await this.removeCartItem(cartItemId);
    }
  }
  
  /**
   * Batch update multiple cart items
   * Uses queue service for efficient processing
   */
  async batchUpdateCartItems(cartId, updates, options = {}) {
    const startTime = Date.now();
    
    try {
      if (!this.queueService?.isInitialized) {
        // Process synchronously
        const results = [];
        for (const update of updates) {
          const result = await this.updateCartItemQuantity(update.cartItemId, update.quantity);
          results.push(result);
        }
        return { processed: results.length, results };
      }
      
      // Use batch update via queue service
      const result = await this.queueService.batchUpdateCart(cartId, updates, options);
      
      // Invalidate cache after batch update
      await this.invalidateCartCache(cartId);
      
      if (this.performanceService?.isInitialized) {
        this.performanceService.trackDatabaseQueryTime(Date.now() - startTime, {
          operation: 'batchUpdateCartItems',
          cartId,
          itemCount: updates.length
        });
      }
      
      return result;
    } catch (error) {
      this.logger.error('[batchUpdateCartItems] Failed to process batch update', {
        cartId,
        error: error.message
      });
      throw error;
    }
  }
  
  /**
   * Get performance metrics for cart operations
   */
  getPerformanceMetrics() {
    const metrics = {
      cache: this.cacheService?.getStats() || null,
      queue: this.queueService?.getQueueStatus() || null,
      performance: this.performanceService?.getMetrics() || null
    };
    
    return metrics;
  }
  
  /**
   * Warm cache for frequently accessed carts
   */
  async warmCacheForActiveCarts(limit = 100) {
    try {
      if (!this.cacheService?.isInitialized) {
        this.logger.warn('[warmCacheForActiveCarts] Cache service not initialized');
        return { warmed: 0 };
      }
      
      // Get recently active carts
      const activeCarts = await this.prisma.cart.findMany({
        where: {
          updatedAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
          }
        },
        take: limit,
        select: { id: true, userId: true, sessionId: true }
      });
      
      const results = await this.cacheService.warmCache(activeCarts.map(c => ({
        cartId: c.id,
        isGuest: !c.userId
      })));
      
      this.logger.info('[warmCacheForActiveCarts] Cache warming completed', {
        requested: activeCarts.length,
        warmed: results.warmed,
        errors: results.errors
      });
      
      return results;
    } catch (error) {
      this.logger.error('[warmCacheForActiveCarts] Failed to warm cache', {
        error: error.message
      });
      return { warmed: 0, errors: 1, error: error.message };
    }
  }
}

// Singleton instance
const cartService = new CartService();

module.exports = {
  CartService,
  cartService
};
