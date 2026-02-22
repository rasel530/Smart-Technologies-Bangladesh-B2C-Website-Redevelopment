/**
 * Cart Cache Service
 * 
 * Enhanced Redis caching service for cart operations with:
 * - Cache-aside pattern implementation
 * - Cache stampede protection
 * - Redis hashes for structured data
 * - Configurable TTL and cache warming
 * 
 * @module services/cartCacheService
 */

const { redisConnectionPool } = require('./redisConnectionPool');
const { loggerService } = require('./logger');

class CartCacheService {
  constructor() {
    this.redis = null;
    this.logger = loggerService;
    this.isInitialized = false;
    
    // Cache configuration
    this.config = {
      // TTL settings (in seconds)
      defaultTTL: parseInt(process.env.CART_CACHE_TTL) || 3600, // 1 hour
      guestCartTTL: parseInt(process.env.CART_GUEST_CACHE_TTL) || 1800, // 30 minutes
      summaryTTL: parseInt(process.env.CART_SUMMARY_CACHE_TTL) || 300, // 5 minutes
      itemCountTTL: parseInt(process.env.CART_ITEM_COUNT_CACHE_TTL) || 60, // 1 minute
      
      // Stampede protection
      stampedeLockTTL: 10, // 10 seconds lock
      stampedeRetryDelay: 50, // 50ms between retries
      stampedeMaxRetries: 100, // Max retries
      
      // Cache warming
      warmBatchSize: parseInt(process.env.CART_WARM_BATCH_SIZE) || 50,
      
      // Memory management
      maxCacheEntries: parseInt(process.env.CART_MAX_CACHE_ENTRIES) || 10000,
    };
    
    // Cache statistics
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      invalidations: 0,
      stampedeLocks: 0,
      stampedeAvoided: 0,
      errors: 0,
      startTime: Date.now(),
    };
    
    // Pending promises for stampede protection
    this.pendingGets = new Map();
    
    this.initialize();
  }

  /**
   * Initialize the cache service
   */
  async initialize() {
    try {
      this.redis = redisConnectionPool.getClient('cartCacheService');
      this.isInitialized = !!this.redis;
      
      if (this.isInitialized) {
        this.logger.info('CartCacheService initialized successfully');
      } else {
        this.logger.warn('CartCacheService initialized without Redis');
      }
    } catch (error) {
      this.logger.error('Failed to initialize CartCacheService', { error: error.message });
      this.isInitialized = false;
    }
  }

  /**
   * Generate cache key for cart data
   */
  getCartKey(cartId) {
    return `cart:data:${cartId}`;
  }

  /**
   * Generate cache key for cart items
   */
  getCartItemsKey(cartId) {
    return `cart:items:${cartId}`;
  }

  /**
   * Generate cache key for cart summary
   */
  getCartSummaryKey(cartId) {
    return `cart:summary:${cartId}`;
  }

  /**
   * Generate cache key for cart item count
   */
  getCartItemCountKey(cartId) {
    return `cart:count:${cartId}`;
  }

  /**
   * Generate cache key for user's carts
   */
  getUserCartsKey(userId) {
    return `user:carts:${userId}`;
  }

  /**
   * Generate stampede lock key
   */
  getStampedeLockKey(key) {
    return `lock:stampede:${key}`;
  }

  /**
   * Acquire stampede lock to prevent cache stampede
   */
  async acquireStampedeLock(key) {
    if (!this.isInitialized || !this.redis) return false;
    
    const lockKey = this.getStampedeLockKey(key);
    
    try {
      // Use SET NX EX for atomic lock acquisition
      const result = await this.redis.set(lockKey, '1', {
        NX: true,
        EX: this.config.stampedeLockTTL
      });
      
      if (result === 'OK') {
        this.stats.stampedeLocks++;
        return true;
      }
      return false;
    } catch (error) {
      this.logger.error('Error acquiring stampede lock', { key, error: error.message });
      return false;
    }
  }

  /**
   * Release stampede lock
   */
  async releaseStampedeLock(key) {
    if (!this.isInitialized || !this.redis) return;
    
    const lockKey = this.getStampedeLockKey(key);
    
    try {
      await this.redis.del(lockKey);
    } catch (error) {
      this.logger.error('Error releasing stampede lock', { key, error: error.message });
    }
  }

  /**
   * Wait for stampede lock to be released
   */
  async waitForStampedeLock(key) {
    const lockKey = this.getStampedeLockKey(key);
    let retries = 0;
    
    while (retries < this.config.stampedeMaxRetries) {
      try {
        const exists = await this.redis.exists(lockKey);
        if (!exists) return true;
        
        await new Promise(resolve => setTimeout(resolve, this.config.stampedeRetryDelay));
        retries++;
      } catch (error) {
        this.logger.error('Error waiting for stampede lock', { key, error: error.message });
        return false;
      }
    }
    
    this.logger.warn('Stampede lock wait timeout', { key, retries });
    return false;
  }

  /**
   * Get cart from cache with fallback to database
   * Implements cache-aside pattern with stampede protection
   * 
   * @param {string} cartId - Cart ID
   * @param {Function} fetchFromDB - Function to fetch from database if cache miss
   * @returns {Promise<Object|null>} Cart data or null
   */
  async getCart(cartId, fetchFromDB = null) {
    if (!this.isInitialized || !this.redis) {
      if (fetchFromDB) return await fetchFromDB();
      return null;
    }

    const cacheKey = this.getCartKey(cartId);
    
    // Check for pending promise (in-flight request deduplication)
    if (this.pendingGets.has(cacheKey)) {
      this.logger.debug('Using pending promise for cart', { cartId });
      return this.pendingGets.get(cacheKey);
    }

    const promise = this._getCartInternal(cartId, cacheKey, fetchFromDB);
    this.pendingGets.set(cacheKey, promise);
    
    try {
      const result = await promise;
      return result;
    } finally {
      this.pendingGets.delete(cacheKey);
    }
  }

  /**
   * Internal method to get cart with stampede protection
   */
  async _getCartInternal(cartId, cacheKey, fetchFromDB) {
    try {
      // Try to get from cache using Redis hash
      const cachedData = await this.redis.hGetAll(cacheKey);
      
      if (cachedData && Object.keys(cachedData).length > 0) {
        // Parse stored data
        const cart = this._deserializeCartHash(cachedData);
        this.stats.hits++;
        this.logger.debug('Cart cache hit', { cartId });
        return cart;
      }

      this.stats.misses++;
      this.logger.debug('Cart cache miss', { cartId });

      // If no fetch function provided, return null
      if (!fetchFromDB) return null;

      // Try to acquire stampede lock
      const hasLock = await this.acquireStampedeLock(cacheKey);
      
      if (!hasLock) {
        // Another process is fetching, wait and retry
        this.stats.stampedeAvoided++;
        this.logger.debug('Cache stampede detected, waiting', { cartId });
        
        const released = await this.waitForStampedeLock(cacheKey);
        if (released) {
          // Try cache again
          const retryData = await this.redis.hGetAll(cacheKey);
          if (retryData && Object.keys(retryData).length > 0) {
            this.stats.hits++;
            return this._deserializeCartHash(retryData);
          }
        }
        
        // Fallback to DB if cache is still empty
        return await fetchFromDB();
      }

      try {
        // Fetch from database
        const cart = await fetchFromDB();
        
        if (cart) {
          // Cache the result
          await this.setCart(cartId, cart);
        }
        
        return cart;
      } finally {
        await this.releaseStampedeLock(cacheKey);
      }
    } catch (error) {
      this.stats.errors++;
      this.logger.error('Error getting cart from cache', { cartId, error: error.message });
      
      // Fallback to database on error
      if (fetchFromDB) {
        return await fetchFromDB();
      }
      return null;
    }
  }

  /**
   * Cache cart data with configurable TTL
   * Uses Redis hashes for structured data storage
   * 
   * @param {string} cartId - Cart ID
   * @param {Object} data - Cart data to cache
   * @param {number} ttl - Time to live in seconds (optional)
   * @returns {Promise<boolean>} Success status
   */
  async setCart(cartId, data, ttl = null) {
    if (!this.isInitialized || !this.redis) return false;

    const cacheKey = this.getCartKey(cartId);
    const cacheTTL = ttl || this.config.defaultTTL;

    try {
      // Serialize cart data to hash
      const hashData = this._serializeCartHash(data);
      
      // Use pipeline for atomic operation
      const pipeline = this.redis.multi();
      pipeline.hSet(cacheKey, hashData);
      pipeline.expire(cacheKey, cacheTTL);
      
      await pipeline.exec();
      
      this.stats.sets++;
      this.logger.debug('Cart cached', { cartId, ttl: cacheTTL });
      
      // Also cache items separately for quick access
      if (data.items && Array.isArray(data.items)) {
        await this._setCartItems(cartId, data.items, cacheTTL);
      }
      
      return true;
    } catch (error) {
      this.stats.errors++;
      this.logger.error('Error setting cart cache', { cartId, error: error.message });
      return false;
    }
  }

  /**
   * Set cart items in cache
   */
  async _setCartItems(cartId, items, ttl) {
    const itemsKey = this.getCartItemsKey(cartId);
    
    try {
      const serialized = JSON.stringify(items);
      await this.redis.setEx(itemsKey, ttl, serialized);
    } catch (error) {
      this.logger.error('Error setting cart items cache', { cartId, error: error.message });
    }
  }

  /**
   * Invalidate cart cache
   * 
   * @param {string} cartId - Cart ID
   * @returns {Promise<boolean>} Success status
   */
  async invalidateCart(cartId) {
    if (!this.isInitialized || !this.redis) return false;

    try {
      const keys = [
        this.getCartKey(cartId),
        this.getCartItemsKey(cartId),
        this.getCartSummaryKey(cartId),
        this.getCartItemCountKey(cartId),
      ];
      
      await this.redis.del(keys);
      
      this.stats.invalidations++;
      this.logger.debug('Cart cache invalidated', { cartId });
      
      return true;
    } catch (error) {
      this.stats.errors++;
      this.logger.error('Error invalidating cart cache', { cartId, error: error.message });
      return false;
    }
  }

  /**
   * Invalidate all user carts
   * 
   * @param {string} userId - User ID
   * @returns {Promise<boolean>} Success status
   */
  async invalidateUserCarts(userId) {
    if (!this.isInitialized || !this.redis) return false;

    try {
      const userCartsKey = this.getUserCartsKey(userId);
      const cartIds = await this.redis.sMembers(userCartsKey);
      
      if (cartIds && cartIds.length > 0) {
        // Invalidate each cart
        await Promise.all(cartIds.map(cartId => this.invalidateCart(cartId)));
        
        // Remove user carts set
        await this.redis.del(userCartsKey);
      }
      
      this.logger.debug('User carts cache invalidated', { userId, count: cartIds?.length || 0 });
      return true;
    } catch (error) {
      this.stats.errors++;
      this.logger.error('Error invalidating user carts', { userId, error: error.message });
      return false;
    }
  }

  /**
   * Get cached cart item count
   * 
   * @param {string} cartId - Cart ID
   * @returns {Promise<number|null>} Item count or null
   */
  async getCartItemCount(cartId) {
    if (!this.isInitialized || !this.redis) return null;

    const countKey = this.getCartItemCountKey(cartId);
    
    try {
      const count = await this.redis.get(countKey);
      
      if (count !== null) {
        this.stats.hits++;
        return parseInt(count);
      }
      
      this.stats.misses++;
      return null;
    } catch (error) {
      this.stats.errors++;
      this.logger.error('Error getting cart item count', { cartId, error: error.message });
      return null;
    }
  }

  /**
   * Set cart item count in cache
   * 
   * @param {string} cartId - Cart ID
   * @param {number} count - Item count
   * @param {number} ttl - Time to live (optional)
   * @returns {Promise<boolean>} Success status
   */
  async setCartItemCount(cartId, count, ttl = null) {
    if (!this.isInitialized || !this.redis) return false;

    const countKey = this.getCartItemCountKey(cartId);
    const cacheTTL = ttl || this.config.itemCountTTL;
    
    try {
      await this.redis.setEx(countKey, cacheTTL, count.toString());
      this.stats.sets++;
      return true;
    } catch (error) {
      this.stats.errors++;
      this.logger.error('Error setting cart item count', { cartId, error: error.message });
      return false;
    }
  }

  /**
   * Get cached cart summary
   * 
   * @param {string} cartId - Cart ID
   * @returns {Promise<Object|null>} Cart summary or null
   */
  async getCartSummary(cartId) {
    if (!this.isInitialized || !this.redis) return null;

    const summaryKey = this.getCartSummaryKey(cartId);
    
    try {
      const summary = await this.redis.get(summaryKey);
      
      if (summary) {
        this.stats.hits++;
        return JSON.parse(summary);
      }
      
      this.stats.misses++;
      return null;
    } catch (error) {
      this.stats.errors++;
      this.logger.error('Error getting cart summary', { cartId, error: error.message });
      return null;
    }
  }

  /**
   * Set cart summary in cache
   * 
   * @param {string} cartId - Cart ID
   * @param {Object} summary - Cart summary
   * @param {number} ttl - Time to live (optional)
   * @returns {Promise<boolean>} Success status
   */
  async setCartSummary(cartId, summary, ttl = null) {
    if (!this.isInitialized || !this.redis) return false;

    const summaryKey = this.getCartSummaryKey(cartId);
    const cacheTTL = ttl || this.config.summaryTTL;
    
    try {
      await this.redis.setEx(summaryKey, cacheTTL, JSON.stringify(summary));
      this.stats.sets++;
      return true;
    } catch (error) {
      this.stats.errors++;
      this.logger.error('Error setting cart summary', { cartId, error: error.message });
      return false;
    }
  }

  /**
   * Warm cache with multiple carts
   * Preloads carts into cache for better performance
   * 
   * @param {Array<string>} cartIds - Array of cart IDs
   * @param {Function} fetchFromDB - Function to fetch carts from database
   * @returns {Promise<Object>} Warming results
   */
  async warmCache(cartIds, fetchFromDB) {
    if (!this.isInitialized || !this.redis) {
      return { success: false, reason: 'Cache not available' };
    }

    if (!cartIds || cartIds.length === 0) {
      return { success: true, warmed: 0 };
    }

    const results = {
      success: true,
      total: cartIds.length,
      warmed: 0,
      failed: 0,
      errors: [],
    };

    // Process in batches
    const batches = this._chunkArray(cartIds, this.config.warmBatchSize);
    
    for (const batch of batches) {
      try {
        // Fetch carts from database
        const carts = await fetchFromDB(batch);
        
        if (carts && carts.length > 0) {
          // Cache each cart
          await Promise.all(
            carts.map(cart => 
              this.setCart(cart.id, cart)
                .then(() => results.warmed++)
                .catch(err => {
                  results.failed++;
                  results.errors.push({ cartId: cart.id, error: err.message });
                })
            )
          );
        }
      } catch (error) {
        this.logger.error('Error warming cache batch', { error: error.message });
        results.failed += batch.length;
        results.errors.push({ batchSize: batch.length, error: error.message });
      }
    }

    this.logger.info('Cache warming completed', {
      total: results.total,
      warmed: results.warmed,
      failed: results.failed,
    });

    return results;
  }

  /**
   * Get cache statistics
   * 
   * @returns {Object} Cache statistics
   */
  getCacheStats() {
    const uptime = Date.now() - this.stats.startTime;
    const totalRequests = this.stats.hits + this.stats.misses;
    const hitRate = totalRequests > 0 ? (this.stats.hits / totalRequests) * 100 : 0;
    
    return {
      ...this.stats,
      uptime,
      totalRequests,
      hitRate: Math.round(hitRate * 100) / 100,
      isInitialized: this.isInitialized,
      config: {
        defaultTTL: this.config.defaultTTL,
        guestCartTTL: this.config.guestCartTTL,
        summaryTTL: this.config.summaryTTL,
        itemCountTTL: this.config.itemCountTTL,
      },
    };
  }

  /**
   * Reset cache statistics
   */
  resetStats() {
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      invalidations: 0,
      stampedeLocks: 0,
      stampedeAvoided: 0,
      errors: 0,
      startTime: Date.now(),
    };
  }

  /**
   * Clear all cart cache entries
   * 
   * @returns {Promise<boolean>} Success status
   */
  async clearAllCache() {
    if (!this.isInitialized || !this.redis) return false;

    try {
      // Get all cart keys
      const keys = await this.redis.keys('cart:*');
      const lockKeys = await this.redis.keys('lock:stampede:*');
      const userKeys = await this.redis.keys('user:carts:*');
      
      const allKeys = [...keys, ...lockKeys, ...userKeys];
      
      if (allKeys.length > 0) {
        await this.redis.del(allKeys);
      }
      
      this.logger.info('All cart cache cleared', { keysDeleted: allKeys.length });
      this.resetStats();
      
      return true;
    } catch (error) {
      this.logger.error('Error clearing cart cache', { error: error.message });
      return false;
    }
  }

  /**
   * Serialize cart data to Redis hash format
   */
  _serializeCartHash(data) {
    const hash = {};
    
    // Store primitive fields
    if (data.id) hash.id = data.id;
    if (data.userId) hash.userId = data.userId;
    if (data.sessionId) hash.sessionId = data.sessionId;
    if (data.status) hash.status = data.status;
    if (data.subtotal !== undefined) hash.subtotal = data.subtotal.toString();
    if (data.tax !== undefined) hash.tax = data.tax.toString();
    if (data.shippingCost !== undefined) hash.shippingCost = data.shippingCost.toString();
    if (data.discount !== undefined) hash.discount = data.discount.toString();
    if (data.total !== undefined) hash.total = data.total.toString();
    if (data.createdAt) hash.createdAt = data.createdAt;
    if (data.updatedAt) hash.updatedAt = data.updatedAt;
    if (data.expiresAt) hash.expiresAt = data.expiresAt;
    
    // Store items as JSON string
    if (data.items) {
      hash.items = JSON.stringify(data.items);
      hash.itemCount = data.items.length.toString();
    }
    
    // Store analytics as JSON
    if (data.analytics) {
      hash.analytics = JSON.stringify(data.analytics);
    }
    
    return hash;
  }

  /**
   * Deserialize cart data from Redis hash format
   */
  _deserializeCartHash(hash) {
    const data = { ...hash };
    
    // Parse numeric fields
    if (hash.subtotal) data.subtotal = parseFloat(hash.subtotal);
    if (hash.tax) data.tax = parseFloat(hash.tax);
    if (hash.shippingCost) data.shippingCost = parseFloat(hash.shippingCost);
    if (hash.discount) data.discount = parseFloat(hash.discount);
    if (hash.total) data.total = parseFloat(hash.total);
    if (hash.itemCount) data.itemCount = parseInt(hash.itemCount);
    
    // Parse JSON fields
    if (hash.items) {
      try {
        data.items = JSON.parse(hash.items);
      } catch (e) {
        data.items = [];
      }
    }
    
    if (hash.analytics) {
      try {
        data.analytics = JSON.parse(hash.analytics);
      } catch (e) {
        data.analytics = null;
      }
    }
    
    return data;
  }

  /**
   * Chunk array into smaller arrays
   */
  _chunkArray(array, size) {
    const chunks = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }
}

// Export singleton instance
const cartCacheService = new CartCacheService();

module.exports = {
  cartCacheService,
  CartCacheService,
};
