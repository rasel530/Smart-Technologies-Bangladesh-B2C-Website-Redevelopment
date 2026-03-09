const { cartService } = require('../services/cartService');
const { stockValidationService } = require('../services/stockValidationService');
const { loggerService } = require('../services/logger');
const crypto = require('crypto');

// ============================================================================
// CRIT-005: Input Validation and Sanitization - UUID Validation
// ============================================================================
const { v4: uuidv4 } = require('uuid');

// Validate UUID format
const validateUUID = (id) => {
  if (!id || typeof id !== 'string') {
    return false;
  }
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(id);
};

// Middleware for cartId validation
const validateCartId = (req, res, next) => {
  const { cartId } = req.params;
  if (!validateUUID(cartId)) {
    return res.status(400).json({
      success: false,
      error: {
        message: 'Invalid cart ID format',
        code: 400,
        details: { cartId: 'Must be a valid UUID' }
      }
    });
  }
  next();
};

// Middleware for cartItemId validation
const validateCartItemId = (req, res, next) => {
  const { id } = req.params;
  if (!validateUUID(id)) {
    return res.status(400).json({
      success: false,
      error: {
        message: 'Invalid cart item ID format',
        code: 400,
        details: { id: 'Must be a valid UUID' }
      }
    });
  }
  next();
};

// ============================================================================
// CRIT-001: Cart Item Ownership Verification Middleware
// ============================================================================
// Verify that the cart item belongs to the authenticated user or session
// BUG-FIX: Added to prevent users from deleting items from other users' carts
const verifyCartItemOwnership = async (req, res, next) => {
  const { id } = req.params;
  const userId = req.user?.id || null;
  const sessionId = req.headers['x-session-id'] || null;

  try {
    // Get the cart item with its associated cart
    const cartItem = await cartService.prisma.cart_items.findUnique({
      where: { id },
      include: {
        cart: true
      }
    });

    if (!cartItem) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'Cart item not found',
          code: 404,
          details: null
        }
      });
    }

    // Check ownership: cart must belong to user or session
    const cart = cartItem.cart;
    const userMatch = userId && cart.userId === userId;
    const sessionMatch = sessionId && cart.sessionId === sessionId;

    if (!userMatch && !sessionMatch) {
      loggerService.warn('Cart item ownership verification failed', {
        cartItemId: id,
        cartId: cart.id,
        userId,
        sessionId,
        cartUserId: cart.userId,
        cartSessionId: cart.sessionId
      });
      return res.status(403).json({
        success: false,
        error: {
          message: 'Not authorized to modify this cart item',
          code: 403,
          details: null
        }
      });
    }

    // Attach cart item to request for use in controller
    req.cartItem = cartItem;
    next();
  } catch (error) {
    loggerService.error('Error in cart item ownership verification', {
      cartItemId: id,
      error: error.message,
      stack: error.stack
    });
    return res.status(500).json({
      success: false,
      error: {
        message: 'Error verifying cart item ownership',
        code: 500,
        details: process.env.NODE_ENV === 'development' ? error.message : null
      }
    });
  }
};

// ============================================================================
// CRIT-001: Cart Ownership Verification Middleware
// ============================================================================
// Verify that the cart belongs to the authenticated user or session
const verifyCartOwnership = async (req, res, next) => {
  const { cartId } = req.params;
  const userId = req.user?.id || null;
  const sessionId = req.headers['x-session-id'] || null;

  try {
    const cart = await cartService.prisma.carts.findUnique({
      where: { id: cartId }
    });

    if (!cart) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'Cart not found',
          code: 404,
          details: null
        }
      });
    }

    // Check ownership: cart must belong to user or session
    const userMatch = userId && cart.userId === userId;
    const sessionMatch = sessionId && cart.sessionId === sessionId;

    if (!userMatch && !sessionMatch) {
      loggerService.warn('Cart ownership verification failed', {
        cartId,
        userId,
        sessionId,
        cartUserId: cart.userId,
        cartSessionId: cart.sessionId
      });
      return res.status(403).json({
        success: false,
        error: {
          message: 'Not authorized to modify this cart',
          code: 403,
          details: null
        }
      });
    }

    // Attach cart to request for use in controller
    req.cart = cart;
    next();
  } catch (error) {
    loggerService.error('Error in cart ownership verification', {
      cartId,
      error: error.message,
      stack: error.stack
    });
    return res.status(500).json({
      success: false,
      error: {
        message: 'Error verifying cart ownership',
        code: 500,
        details: process.env.NODE_ENV === 'development' ? error.message : null
      }
    });
  }
};

// ============================================================================
// CRIT-007: Standardized Error Response Format
// ============================================================================
const errorResponse = (message, statusCode = 400, details = null) => ({
  success: false,
  error: {
    message,
    code: statusCode,
    ...(details && { details })
  }
});

// ============================================================================
// CRIT-005: Input Sanitization Helper
// ============================================================================
const sanitizeInput = (input, type = 'string') => {
  if (input === null || input === undefined) {
    return type === 'number' ? 0 : '';
  }
  
  switch (type) {
    case 'number':
      const num = parseInt(input, 10);
      return isNaN(num) ? 0 : num;
    case 'float':
      const float = parseFloat(input);
      return isNaN(float) ? 0 : float;
    case 'string':
    default:
      return String(input).trim();
  }
};

// ============================================================================
// CRIT-005: Type Coercion Prevention
// ============================================================================
const validateQuantity = (quantity) => {
  if (typeof quantity !== 'number' || !Number.isInteger(quantity)) {
    return false;
  }
  return quantity >= 1;
};

class CartController {
  // Get user/guest cart
  async getCart(req, res) {
    // Fix for Issue 3: GET /api/v1/cart 500 Internal Server Error
    // Added detailed logging to identify exact error point
    try {
      const userId = req.user?.id || null;
      const sessionId = req.headers['x-session-id'] || null;

      loggerService.info('getCart called', {
        userId,
        sessionId,
        hasUser: !!req.user,
        timestamp: new Date().toISOString()
      });

      if (!userId && !sessionId) {
        return res.status(400).json({
          success: false,
          error: 'Authentication required',
          message: 'Either user authentication or session ID is required',
          messageBn: 'ব্যবহারকারী প্রমাণীকরণ বা সেশন আইডি প্রয়োজন'
        });
      }

      // FIX: Always fetch cart from database to ensure prices are recalculated
      // This prevents stale cached cart data with old subtotal values
      // Invalidate cache to ensure fresh data (Fix 2 for Issue 3)
      if (sessionId) {
        await cartService.invalidateCartCacheBySession(sessionId);
      }
      loggerService.info('Fetching cart from database (bypassing cache)', { userId, sessionId });
      const cart = await cartService.getCart(userId, sessionId);
      loggerService.info('Database cart result', { 
        userId, 
        sessionId, 
        cartFound: !!cart, 
        subtotal: cart?.subtotal,
        itemCount: cart?.items?.length || 0
      });

      // Cache result for future requests (only for logged-in users)
      if (cart && userId) {
        try {
          await cartService.setCartInCache(cart.id, cart);
          loggerService.info('Cart cached successfully', { cartId: cart.id });
        } catch (cacheError) {
          loggerService.warn('Failed to cache cart, continuing without cache', {
            cartId: cart.id,
            error: cacheError.message
          });
          // Continue even if caching fails
        }
      }

      if (!cart) {
        loggerService.info('No cart found, creating new cart', { userId, sessionId });
        // Create new cart if none exists
        const newCart = await cartService.createCart(userId, sessionId);
        loggerService.info('New cart created', { cartId: newCart?.id });
        
        res.json({
          success: true,
          message: 'Cart retrieved successfully',
          messageBn: 'কার্ট সফলভাবে পুনরুদ্ধার করা হয়েছে',
          data: newCart
        });
        return;
      }

      res.json({
        success: true,
        message: 'Cart retrieved successfully',
        messageBn: 'কার্ট সফলভাবে পুনরুদ্ধার করা হয়েছে',
        data: cart
      });
    } catch (error) {
      // Enhanced error logging with full error details
      const errorDetails = {
        errorName: error.name,
        errorMessage: error.message,
        errorCode: error.code,
        errorStack: error.stack,
        userId: req.user?.id,
        sessionId: req.headers['x-session-id'],
        hasUser: !!req.user,
        timestamp: new Date().toISOString()
      };

      loggerService.error('Error in getCart controller', errorDetails);

      // Console log for immediate debugging
      console.error('[getCart] ERROR DETAILS:', {
        errorName: error.name,
        errorMessage: error.message,
        errorCode: error.code,
        userId: req.user?.id,
        sessionId: req.headers['x-session-id']
      });

      // Provide more specific error information with enhanced error type detection
      let errorMessage = 'Failed to retrieve cart';
      let errorMessageBn = 'কার্ট পুনরুদ্ধার করতে ব্যর্থ হয়েছে';
      let details = {
        errorName: error.name,
        errorCode: error.code
      };

      // Distinguish between different error types
      if (error.message.includes('Redis') || 
          error.message.includes('ECONNREFUSED') || 
          error.message.includes('ETIMEDOUT') ||
          error.code === 'ECONNREFUSED' ||
          error.code === 'ETIMEDOUT') {
        errorMessage = 'Cache service unavailable, please try again';
        errorMessageBn = 'ক্যাশ সার্ভিস অনুপলব্ধ, অনুগ্রহ করে আবার চেষ্টা করুন';
        details = { 
          ...details,
          cacheError: true, 
          originalError: error.message,
          errorType: 'REDIS_ERROR'
        };
      } else if (error.message.includes('database') || 
                 error.message.includes('Prisma') ||
                 error.code?.startsWith('P')) {
        errorMessage = 'Database error occurred, please try again';
        errorMessageBn = 'ডাটাবেস ত্রুটি ঘটেছে, অনুগ্রহ করে আবার চেষ্টা করুন';
        details = { 
          ...details,
          databaseError: true, 
          originalError: error.message,
          errorType: 'DATABASE_ERROR',
          prismaCode: error.code
        };
      } else if (error.message.includes('connect') || error.code === 'P1001') {
        errorMessage = 'Database connection failed, please try again';
        errorMessageBn = 'ডাটাবেস সংযোগ ব্যর্থ হয়েছে, অনুগ্রহ করে আবার চেষ্টা করুন';
        details = { 
          ...details,
          connectionError: true, 
          originalError: error.message,
          errorType: 'CONNECTION_ERROR'
        };
      } else {
        details = { 
          ...details,
          originalError: error.message,
          errorType: 'UNKNOWN_ERROR'
        };
      }

      res.status(500).json({
        success: false,
        error: errorMessage,
        message: errorMessage,
        messageBn: errorMessageBn,
        ...(process.env.NODE_ENV === 'development' && { details })
      });
    }
  }

  // SAFEGUARD: Force recalculate cart prices (for debugging/admin use)
  async forceRecalculatePrices(req, res) {
    try {
      const { cartId } = req.params;
      
      loggerService.info('[forceRecalculatePrices] Forced price recalculation requested', {
        cartId,
        userId: req.user?.id,
        timestamp: new Date().toISOString()
      });

      // Verify cart ownership
      const cart = await cartService.prisma.carts.findUnique({
        where: { id: cartId }
      });

      if (!cart) {
        return res.status(404).json({
          success: false,
          error: 'Cart not found',
          message: 'Cart not found',
          messageBn: 'কার্ট পাওয়া যায়নি'
        });
      }

      // Check ownership
      const userId = req.user?.id || null;
      const sessionId = req.headers['x-session-id'] || null;
      const userMatch = userId && cart.userId === userId;
      const sessionMatch = sessionId && cart.sessionId === sessionId;

      if (!userMatch && !sessionMatch) {
        return res.status(403).json({
          success: false,
          error: 'Not authorized',
          message: 'You are not authorized to modify this cart',
          messageBn: 'আপনি এই কার্ট পরিবর্তন করার অনুমতি নেই'
        });
      }

      // Force recalculate prices
      const result = await cartService.forceRecalculateAllCartPrices(cartId);

      loggerService.info('[forceRecalculatePrices] Price recalculation completed', {
        cartId,
        result
      });

      res.json({
        success: true,
        message: 'Cart prices recalculated successfully',
        messageBn: 'কার্টের দাম সফলভাবে পুনর্গণনা করা হয়েছে',
        data: result
      });
    } catch (error) {
      loggerService.error('[forceRecalculatePrices] Error in forced price recalculation', {
        cartId: req.params.cartId,
        error: error.message,
        stack: error.stack
      });

      res.status(500).json({
        success: false,
        error: 'Failed to recalculate prices',
        message: 'An error occurred while recalculating cart prices',
        messageBn: 'কার্টের দাম পুনর্গণনা করতে সমস্যা হয়েছে',
        ...(process.env.NODE_ENV === 'development' && { details: error.message })
      });
    }
  }

  // Add item to cart
  async addItemToCart(req, res) {
    try {
      const { cartId, productId, quantity, variantId } = req.body;
      const userId = req.user?.id || null;
      const sessionId = req.headers['x-session-id'] || null;

      // Validation
      if (!productId || !quantity) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields',
          message: 'productId and quantity are required',
          messageBn: 'productId এবং quantity প্রয়োজন'
        });
      }

      let actualCartId = cartId;

      // FIX: If no cartId provided, create one for guests
      if (!actualCartId && !userId && sessionId) {
        const newCart = await cartService.createCart(null, sessionId);
        actualCartId = newCart.id;
        loggerService.info('Auto-created guest cart for add item', { cartId: actualCartId });
      }

      // Verify cart exists and belongs to user/session
      const cart = await cartService.prisma.carts.findUnique({
        where: { id: actualCartId }
      });

      if (!cart) {
        return res.status(404).json({
          success: false,
          error: 'Cart not found',
          message: 'Cart not found',
          messageBn: 'কার্ট পাওয়ানি'
        });
      }

      // Check ownership
      const userMatch = userId && cart.userId === userId;
      const sessionMatch = sessionId && cart.sessionId === sessionId;

      if (!userMatch && !sessionMatch) {
        return res.status(403).json({
          success: false,
          error: 'Not authorized to modify this cart',
          message: 'Not authorized to modify this cart',
          messageBn: 'আপনি এই কার্ট পরিবর্তন করার অনুমতি নেই'
        });
      }

      const cartItem = await cartService.addItemToCart(
        actualCartId,
        productId,
        quantity,
        variantId || null
      );

      // Fetch the updated cart to return full cart object
      const updatedCart = await cartService.getCart(userId, sessionId);

      res.status(201).json({
        success: true,
        message: 'Item added to cart successfully',
        messageBn: 'আইটেম কার্টে সফলভাবে যোগ করা হয়েছে',
        data: updatedCart
      });
    } catch (error) {
      loggerService.error('Error in addItemToCart controller', {
        error: error.message,
        stack: error.stack
      });

      let statusCode = 500;
      let errorMessage = 'Failed to add item to cart';
      let errorMessageBn = 'কার্টে আইটেম যোগ করতে ব্যর্থ হয়েছে';

      if (error.message === 'Cart not found') {
        statusCode = 404;
        errorMessage = 'Cart not found';
        errorMessageBn = 'কার্ট পাওয়া যায়নি';
      } else if (error.message === 'Product not found') {
        statusCode = 404;
        errorMessage = 'Product not found';
        errorMessageBn = 'পণ্যটি পাওয়া যায়নি';
      } else if (error.message === 'Product is not available') {
        statusCode = 400;
        errorMessage = 'Product is not available';
        errorMessageBn = 'পণ্যটি উপলব্ধ নেই';
      } else if (error.message === 'Insufficient stock available') {
        statusCode = 400;
        errorMessage = 'Insufficient stock available';
        errorMessageBn = 'পর্যাপ্ত স্টক নেই';
      }

      res.status(statusCode).json({
        success: false,
        error: error.message,
        message: errorMessage,
        messageBn: errorMessageBn
      });
    }
  }

  // Update cart item
  async updateCartItem(req, res) {
    try {
      const { id } = req.params;
      const { quantity } = req.body;

      // Validation
      if (!quantity || quantity < 1) {
        return res.status(400).json({
          success: false,
          error: 'Invalid quantity',
          message: 'Quantity must be at least 1',
          messageBn: 'পরিমাণ অবশ্যই কমপক্ষে 1 হতে হবে'
        });
      }

      const cartItem = await cartService.updateCartItemQuantity(id, quantity);

      res.json({
        success: true,
        message: 'Cart item updated successfully',
        messageBn: 'কার্ট আইটেম সফলভাবে আপডেট করা হয়েছে',
        data: cartItem
      });
    } catch (error) {
      loggerService.error('Error in updateCartItem controller', {
        error: error.message,
        stack: error.stack
      });

      let statusCode = 500;
      let errorMessage = 'Failed to update cart item';
      let errorMessageBn = 'কার্ট আইটেম আপডেট করতে ব্যর্থ হয়েছে';

      if (error.message === 'Cart item not found') {
        statusCode = 404;
        errorMessage = 'Cart item not found';
        errorMessageBn = 'কার্ট আইটেম পাওয়া যায়নি';
      } else if (error.message === 'Insufficient stock available') {
        statusCode = 400;
        errorMessage = 'Insufficient stock available';
        errorMessageBn = 'পর্যাপ্ত স্টক নেই';
      }

      res.status(statusCode).json({
        success: false,
        error: error.message,
        message: errorMessage,
        messageBn: errorMessageBn
      });
    }
  }

  // Remove cart item
  async removeCartItem(req, res) {
    try {
      const { id } = req.params;

      const result = await cartService.removeCartItem(id);

      // BUG-FIX: Return the full updated cart instead of just success
      // This ensures frontend state stays synchronized after removal
      let updatedCart = await cartService.getCartById(result.cartId);

      // BUG-FIX: If cart is null (all items removed), return empty cart structure
      // to prevent "Invalid cart response from server" error on frontend
      if (!updatedCart) {
        updatedCart = {
          id: result.cartId,
          items: [],
          subtotal: 0,
          tax: 0,
          shippingCost: 0,
          discount: 0,
          total: 0,
          itemCount: 0,
          totalItems: 0
        };
      }

      res.json({
        success: true,
        message: 'Item removed from cart successfully',
        messageBn: 'আইটেম কার্ট থেকে সফলভাবে সরানো হয়েছে',
        data: updatedCart
      });
    } catch (error) {
      loggerService.error('Error in removeCartItem controller', {
        error: error.message,
        stack: error.stack
      });

      let statusCode = 500;
      let errorMessage = 'Failed to remove item from cart';
      let errorMessageBn = 'কার্ট থেকে আইটেম সরাতে ব্যর্থ হয়েছে';

      if (error.message === 'Cart item not found') {
        statusCode = 404;
        errorMessage = 'Cart item not found';
        errorMessageBn = 'কার্ট আইটেম পাওয়া যায়নি';
      }

      res.status(statusCode).json({
        success: false,
        error: error.message,
        message: errorMessage,
        messageBn: errorMessageBn
      });
    }
  }

  // Update item quantity (PATCH endpoint)
  async updateItemQuantity(req, res) {
    try {
      const { id } = req.params;
      const { quantity } = req.body;

      // Validation
      if (!quantity || quantity < 1) {
        return res.status(400).json({
          success: false,
          error: 'Invalid quantity',
          message: 'Quantity must be at least 1',
          messageBn: 'পরিমাণ অবশ্যই কমপক্ষে 1 হতে হবে'
        });
      }

      const cartItem = await cartService.updateCartItemQuantity(id, quantity);

      // BUG-FIX: Return the full updated cart instead of just the cart item
      // This ensures frontend state stays synchronized after quantity update
      // FIX: Use getCartById instead of getCart to properly fetch by cartId
      const updatedCart = await cartService.getCartById(cartItem.cartId);

      res.json({
        success: true,
        message: 'Item quantity updated successfully',
        messageBn: 'আইটেম পরিমাণ সফলভাবে আপডেট করা হয়েছে',
        data: updatedCart
      });
    } catch (error) {
      loggerService.error('Error in updateItemQuantity controller', {
        error: error.message,
        stack: error.stack
      });

      let statusCode = 500;
      let errorMessage = 'Failed to update item quantity';
      let errorMessageBn = 'আইটেম পরিমাণ আপডেট করতে ব্যর্থ হয়েছে';

      if (error.message === 'Cart item not found') {
        statusCode = 404;
        errorMessage = 'Cart item not found';
        errorMessageBn = 'কার্ট আইটেম পাওয়া যায়নি';
      } else if (error.message === 'Insufficient stock available') {
        statusCode = 400;
        errorMessage = 'Insufficient stock available';
        errorMessageBn = 'পর্যাপ্ত স্টক নেই';
      }

      res.status(statusCode).json({
        success: false,
        error: error.message,
        message: errorMessage,
        messageBn: errorMessageBn
      });
    }
  }

  // Get cart summary
  async getCartSummary(req, res) {
    try {
      const userId = req.user?.id || null;
      const sessionId = req.headers['x-session-id'] || null;

      if (!userId && !sessionId) {
        return res.status(400).json({
          success: false,
          error: 'Authentication required',
          message: 'Either user authentication or session ID is required',
          messageBn: 'ব্যবহারকারী প্রমাণীকরণ বা সেশন আইডি প্রয়োজন'
        });
      }

      const cart = await cartService.getCart(userId, sessionId);

      if (!cart) {
        return res.status(404).json({
          success: false,
          error: 'Cart not found',
          message: 'Cart not found',
          messageBn: 'কার্ট পাওয়া যায়নি'
        });
      }

      const summary = await cartService.getCartSummary(cart.id);

      res.json({
        success: true,
        message: 'Cart summary retrieved successfully',
        messageBn: 'কার্ট সারসংক্ষেপ সফলভাবে পুনরুদ্ধার করা হয়েছে',
        data: summary
      });
    } catch (error) {
      loggerService.error('Error in getCartSummary controller', {
        error: error.message,
        stack: error.stack
      });

      res.status(500).json({
        success: false,
        error: 'Failed to retrieve cart summary',
        message: 'Failed to retrieve cart summary',
        messageBn: 'কার্ট সারসংক্ষেপ পুনরুদ্ধার করতে ব্যর্থ হয়েছে'
      });
    }
  }

  // Merge guest cart on login - FIXED: Added idempotency key support and improved error handling
  async mergeGuestCart(req, res) {
    try {
      const { guestSessionId, idempotencyKey } = req.body;
      const userId = req.user?.id;

      // Add detailed logging for debugging
      loggerService.info('Attempting to merge guest cart', {
        userId,
        guestSessionId,
        hasIdempotencyKey: !!idempotencyKey,
        timestamp: new Date().toISOString()
      });

      if (!userId) {
        loggerService.warn('mergeGuestCart failed: no authenticated user');
        return res.status(401).json({
          success: false,
          error: 'Authentication required',
          message: 'User must be authenticated to merge cart',
          messageBn: 'কার্ট মার্জ করতে ব্যবহারকারী প্রমাণীকরণ প্রয়োজন'
        });
      }

      if (!guestSessionId) {
        loggerService.warn('mergeGuestCart failed: missing guestSessionId', {
          body: req.body,
          keys: Object.keys(req.body)
        });
        return res.status(400).json({
          success: false,
          error: 'Missing guest session ID',
          message: 'guestSessionId is required in request body',
          messageBn: 'guestSessionId প্রয়োজন',
          details: {
            expectedField: 'guestSessionId',
            receivedFields: Object.keys(req.body),
            hint: 'Ensure the request body contains { "guestSessionId": "your-session-id" }'
          }
        });
      }

      // Pass idempotency key to service for duplicate prevention
      const result = await cartService.mergeGuestCart(guestSessionId, userId, idempotencyKey);

      loggerService.info('Guest cart merged successfully', {
        userId,
        guestSessionId,
        itemsMerged: result.itemsMerged,
        itemsSkipped: result.skippedItems?.length || 0,
        itemsFailed: result.failedItems?.length || 0
      });

      // Build detailed response with merge information
      const responseData = {
        success: true,
        message: result.itemsMerged > 0 
          ? 'Guest cart merged successfully' 
          : 'No items to merge',
        messageBn: result.itemsMerged > 0 
          ? 'গেস্ট কার্ট সফলভাবে মার্জ করা হয়েছে' 
          : 'মার্জ করার জন্য কোনো আইটেম নেই',
        data: {
          cartId: result.cartId || result.userCartId,
          itemsMerged: result.itemsMerged,
          skippedItems: result.skippedItems || [],
          failedItems: result.failedItems || [],
          subtotal: result.subtotal,
          tax: result.tax,
          shippingCost: result.shippingCost,
          discount: result.discount,
          total: result.total,
          items: result.items
        }
      };

      // Add warning if some items failed
      if (result.failedItems?.length > 0) {
        responseData.message = 'Some items could not be merged';
        responseData.messageBn = 'কিছু আইটেম মার্জ করা যায়নি';
      }

      res.json(responseData);
    } catch (error) {
      loggerService.error('Error in mergeGuestCart controller', {
        error: error.message,
        stack: error.stack,
        code: error.code,
        meta: error.meta,
        userId: req.user?.id,
        guestSessionId: req.body?.guestSessionId,
        timestamp: new Date().toISOString()
      });

      let errorMessage = 'Failed to merge guest cart';
      let errorMessageBn = 'গেস্ট কার্ট মার্জ করতে ব্যর্থ হয়েছে';
      let statusCode = 500;
      let details = {};

      // Enhanced error handling
      if (error.message.includes('not found')) {
        errorMessage = 'Guest cart not found';
        errorMessageBn = 'গেস্ট কার্ট পাওয়া যায়নি';
        statusCode = 404;
        details = { cartNotFound: true, originalError: error.message };
      } else if (error.message.includes('database') || error.message.includes('Prisma')) {
        errorMessage = 'Database error occurred while merging cart';
        errorMessageBn = 'কার্ট মার্জ করার সময় ডাটাবেস ত্রুটি ঘটেছে';
        details = { databaseError: true, originalError: error.message };
      } else if (error.message.includes('already merged') || error.message.includes('already processed')) {
        errorMessage = 'Cart was already merged';
        errorMessageBn = 'কার্ট ইতিমধ্যে মার্জ করা হয়েছে';
        statusCode = 409;
        details = { alreadyMerged: true };
      } else if (error.message.includes('Concurrent') || error.message.includes('locked')) {
        errorMessage = 'Another merge is in progress. Please try again.';
        errorMessageBn = 'আরেকটি মার্জ চলছে। অনুগ্রহ করে আবার চেষ্টা করুন।';
        statusCode = 409;
        details = { mergeInProgress: true };
      } else if (error.message.includes('Insufficient stock')) {
        errorMessage = 'Some items have insufficient stock';
        errorMessageBn = 'কিছু আইটেমের পর্যাপ্ত স্টক নেই';
        statusCode = 400;
        details = { stockError: true, originalError: error.message };
      }

      res.status(statusCode).json({
        success: false,
        error: error.message || errorMessage,
        message: errorMessage,
        messageBn: errorMessageBn,
        ...(process.env.NODE_ENV === 'development' && {
          details: {
            ...details,
            code: error.code,
            meta: error.meta,
            stack: error.stack
          }
        })
      });
    }
  }

  // Clear cart
  async clearCart(req, res) {
    try {
      const userId = req.user?.id || null;
      const sessionId = req.headers['x-session-id'] || null;

      if (!userId && !sessionId) {
        return res.status(400).json({
          success: false,
          error: 'Authentication required',
          message: 'Either user authentication or session ID is required',
          messageBn: 'ব্যবহারকারী প্রমাণীকরণ বা সেশন আইডি প্রয়োজন'
        });
      }

      const cart = await cartService.getCart(userId, sessionId);

      if (!cart) {
        return res.status(404).json({
          success: false,
          error: 'Cart not found',
          message: 'Cart not found',
          messageBn: 'কার্ট পাওয়া যায়নি'
        });
      }

      const result = await cartService.clearCart(cart.id);

      res.json({
        success: true,
        message: 'Cart cleared successfully',
        messageBn: 'কার্ট সফলভাবে সাফ করা হয়েছে',
        data: result
      });
    } catch (error) {
      loggerService.error('Error in clearCart controller', {
        error: error.message,
        stack: error.stack
      });

      res.status(500).json({
        success: false,
        error: 'Failed to clear cart',
        message: 'Failed to clear cart',
        messageBn: 'কার্ট সাফ করতে ব্যর্থ হয়েছে'
      });
    }
  }

  // Validate cart stock
  async validateCartStock(req, res) {
    try {
      const userId = req.user?.id || null;
      const sessionId = req.headers['x-session-id'] || null;

      if (!userId && !sessionId) {
        return res.status(400).json({
          success: false,
          error: 'Authentication required',
          message: 'Either user authentication or session ID is required',
          messageBn: 'ব্যবহারকারী প্রমাণীকরণ বা সেশন আইডি প্রয়োজন'
        });
      }

      const cart = await cartService.getCart(userId, sessionId);

      if (!cart) {
        return res.status(404).json({
          success: false,
          error: 'Cart not found',
          message: 'Cart not found',
          messageBn: 'কার্ট পাওয়া যায়নি'
        });
      }

      const validation = await cartService.validateCartStock(cart.id);

      res.json({
        success: true,
        message: validation.isValid ? 'All items are in stock' : 'Some items are out of stock',
        messageBn: validation.isValid ? 'সব আইটেম স্টকে আছে' : 'কিছু আইটেম স্টকে নেই',
        data: validation
      });
    } catch (error) {
      loggerService.error('Error in validateCartStock controller', {
        error: error.message,
        stack: error.stack
      });

      res.status(500).json({
        success: false,
        error: 'Failed to validate cart stock',
        message: 'Failed to validate cart stock',
        messageBn: 'কার্ট স্টক যাচাই করতে ব্যর্থ হয়েছে'
      });
    }
  }

  // Calculate cart totals (BE-CRIT-001: Missing POST /api/v1/cart/calculate endpoint)
  async calculateCart(req, res) {
    try {
      const userId = req.user?.id || null;
      const sessionId = req.headers['x-session-id'] || null;

      if (!userId && !sessionId) {
        return res.status(400).json({
          success: false,
          error: 'Authentication required',
          message: 'Either user authentication or session ID is required',
          messageBn: 'ব্যবহারকারী প্রমাণীকরণ বা সেশন আইডি প্রয়োজন'
        });
      }

      const cart = await cartService.getCart(userId, sessionId);

      if (!cart) {
        return res.status(404).json({
          success: false,
          error: 'Cart not found',
          message: 'Cart not found',
          messageBn: 'কার্ট পাওয়া যায়নি'
        });
      }

      // Calculate cart totals
      const totals = await cartService.calculateCartTotals(cart.id);

      res.json({
        success: true,
        message: 'Cart totals calculated successfully',
        messageBn: 'কার্ট মোট সফলভাবে গণনা করা হয়েছে',
        data: {
          cartId: cart.id,
          ...totals
        }
      });
    } catch (error) {
      loggerService.error('Error in calculateCart controller', {
        error: error.message,
        stack: error.stack
      });

      res.status(500).json({
        success: false,
        error: 'Failed to calculate cart totals',
        message: 'Failed to calculate cart totals',
        messageBn: 'কার্ট মোট গণনা করতে ব্যর্থ হয়েছে'
      });
    }
  }

  // Generate share token for cart (BE-CRIT-002: Cart sharing functionality)
  async generateShareToken(req, res) {
    try {
      const { id } = req.params;
      const { expiresInDays } = req.body;

      // Validate cart exists
      const cart = await cartService.prisma.carts.findUnique({
        where: { id }
      });

      if (!cart) {
        return res.status(404).json({
          success: false,
          error: 'Cart not found',
          message: 'Cart not found',
          messageBn: 'কার্ট পাওয়া যায়নি'
        });
      }

      // Generate share token
      const shareData = await cartService.generateShareToken(id, expiresInDays);

      res.json({
        success: true,
        message: 'Share token generated successfully',
        messageBn: 'শেয়ার টোকেন সফলভাবে তৈরি করা হয়েছে',
        data: shareData
      });
    } catch (error) {
      loggerService.error('Error in generateShareToken controller', {
        error: error.message,
        stack: error.stack
      });

      res.status(500).json({
        success: false,
        error: 'Failed to generate share token',
        message: 'Failed to generate share token',
        messageBn: 'শেয়ার টোকেন তৈরি করতে ব্যর্থ হয়েছে'
      });
    }
  }

  // Get guest cart products (for fetching product details)
  async getGuestCartProducts(req, res) {
    try {
      const { productIds } = req.body;

      if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'Product IDs are required',
          message: 'Product IDs are required',
          messageBn: 'পণ্যগুলি প্রয়োজন'
        });
      }

      const products = await cartService.prisma.products.findMany({
        where: {
          id: { in: productIds },
          status: 'active'
        },
        include: {
          product_images: {
            where: { display_order: 0 },
            take: 1,
            select: { id: true, original_url: true, optimized_url: true, thumbnail_url: true, alt_text_en: true, alt_text_bn: true }
          }
        }
      });

      loggerService.info('Guest cart products fetched', { productIds, count: products.length });

      res.json({
        success: true,
        message: 'Products fetched successfully',
        messageBn: 'পণ্যগুলি সফলভাবে পুনরুদ্ধার হয়েছে',
        data: products
      });
    } catch (error) {
      loggerService.error('Error fetching guest cart products', {
        error: error.message,
        stack: error.stack
      });

      res.status(500).json({
        success: false,
        error: 'Failed to fetch products',
        message: 'Failed to fetch products',
        messageBn: 'পণ্যগুলি আনা করতে ব্যর্থ হয়েছে'
      });
    }
  }

  // Validate guest cart (check product availability and stock)
  async validateGuestCart(req, res) {
    try {
      const { items } = req.body;

      if (!items || !Array.isArray(items)) {
        return res.status(400).json({
          success: false,
          error: 'Items are required',
          message: 'Items are required',
          messageBn: 'আইটেম প্রয়োজন'
        });
      }

      const validationResults = [];
      let isValid = true;

      for (const item of items) {
        const product = await cartService.prisma.products.findUnique({
          where: { id: item.productId }
        });

        if (!product) {
          validationResults.push({
            productId: item.productId,
            variantId: item.variantId,
            reason: 'Product not found'
          });
          isValid = false;
          continue;
        }

        if (product.status !== 'active') {
          validationResults.push({
            productId: item.productId,
            variantId: item.variantId,
            reason: 'Product is not available'
          });
          isValid = false;
          continue;
        }

        // Check stock
        let availableStock;
        if (item.variantId) {
          const variant = product.variants.find(v => v.id === item.variantId);
          availableStock = variant ? variant.stock : 0;
        } else {
          availableStock = product.stockQuantity;
        }

        if (availableStock < item.quantity) {
          validationResults.push({
            productId: item.productId,
            variantId: item.variantId,
            reason: 'Insufficient stock',
            availableStock
          });
          isValid = false;
        }
      }

      loggerService.info('Guest cart validation completed', {
        isValid,
        invalidCount: validationResults.length
      });

      res.json({
        success: true,
        isValid,
        message: isValid ? 'All items are valid' : 'Some items are invalid',
        messageBn: isValid ? 'সব আইটেম সঠিক' : 'কিছু আইটেম সঠিক',
        data: {
          isValid,
          validationResults
        }
      });
    } catch (error) {
      loggerService.error('Error validating guest cart', {
        error: error.message,
        stack: error.stack
      });

      res.status(500).json({
        success: false,
        error: 'Failed to validate cart',
        message: 'Failed to validate cart',
        messageBn: 'কার্ট যাচাই করতে ব্যর্থ হয়েছে'
      });
    }
  }

  /**
   * Create or update guest cart with items
   * This endpoint syncs guest cart items from localStorage to the backend
   * @route POST /api/v1/cart/guest
   */
  async createOrUpdateGuestCart(req, res) {
    try {
      const { items, sessionId } = req.body;
      const userId = req.user?.id || null;

      loggerService.info('createOrUpdateGuestCart called', {
        userId,
        sessionId,
        itemCount: items?.length,
        timestamp: new Date().toISOString()
      });

      // Validation
      if (!sessionId) {
        return res.status(400).json({
          success: false,
          error: 'Session ID is required',
          message: 'sessionId is required in request body',
          messageBn: 'sessionId প্রয়োজন'
        });
      }

      if (!items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'Items are required',
          message: 'items array is required and must not be empty',
          messageBn: 'items প্রয়োজন'
        });
      }

      // Get or create guest cart
      let cart = await cartService.getCart(userId, sessionId);

      if (!cart) {
        // Create new guest cart
        cart = await cartService.createCart(null, sessionId);
        loggerService.info('Created new guest cart', { cartId: cart.id, sessionId });
      }

      // Add/update items in cart
      const results = [];
      for (const item of items) {
        try {
          const { productId, quantity, variantId, price } = item;

          // Check if item already exists
          const existingItem = await cartService.prisma.cart_items.findFirst({
            where: {
              cartId: cart.id,
              productId,
              variantId: variantId || null
            }
          });

          let cartItem;
          if (existingItem) {
            // Update existing item
            cartItem = await cartService.prisma.cart_items.update({
              where: { id: existingItem.id },
              data: {
                quantity,
                price: parseFloat(price),
                subtotal: parseFloat(price) * quantity
              }
            });
            loggerService.info('Updated existing cart item', {
              cartId: cart.id,
              itemId: existingItem.id,
              productId,
              quantity
            });
          } else {
            // Add new item using cartService
            cartItem = await cartService.addItemToCart(
              cart.id,
              productId,
              quantity,
              variantId || null
            );
            loggerService.info('Added new cart item', {
              cartId: cart.id,
              productId,
              quantity
            });
          }

          results.push({
            productId,
            success: true,
            cartItemId: cartItem.id
          });
        } catch (itemError) {
          loggerService.error('Error processing cart item', {
            item,
            error: itemError.message
          });
          results.push({
            productId: item.productId,
            success: false,
            error: itemError.message
          });
        }
      }

      // Recalculate cart totals
      const totals = await cartService.calculateCartTotals(cart.id);

      // Get updated cart with items
      const updatedCart = await cartService.getCart(null, sessionId);

      loggerService.info('Guest cart sync completed', {
        cartId: cart.id,
        sessionId,
        itemsProcessed: results.length,
        successfulItems: results.filter(r => r.success).length,
        failedItems: results.filter(r => !r.success).length
      });

      res.json({
        success: true,
        message: results.length > 0 
          ? 'Guest cart synced successfully' 
          : 'No items to sync',
        messageBn: results.length > 0 
          ? 'গেস্ট কার্ট সফলভাবে সিঙ্ক হয়েছে' 
          : 'সিঙ্ক করার জন্য কোনো আইটেম নেই',
        // Return cartId at top level for frontend compatibility
        id: updatedCart?.id,
        data: {
          cartId: updatedCart?.id,
          itemsProcessed: results.length,
          successfulItems: results.filter(r => r.success).length,
          failedItems: results.filter(r => !r.success).length,
          results,
          subtotal: totals.subtotal,
          tax: totals.tax,
          shippingCost: totals.shippingCost,
          total: totals.total
        }
      });
    } catch (error) {
      loggerService.error('Error in createOrUpdateGuestCart controller', {
        error: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString()
      });

      let errorMessage = 'Failed to sync guest cart';
      let errorMessageBn = 'গেস্ট কার্ট সিঙ্ক করতে ব্যর্থ হয়েছে';
      let statusCode = 500;

      if (error.message.includes('Product not found')) {
        statusCode = 404;
        errorMessage = 'Product not found';
        errorMessageBn = 'পণ্যটি পাওয়া যায়নি';
      } else if (error.message.includes('Product is not available')) {
        statusCode = 400;
        errorMessage = 'Product is not available';
        errorMessageBn = 'পণ্যটি উপলব্ধ নেই';
      } else if (error.message.includes('Insufficient stock')) {
        statusCode = 400;
        errorMessage = 'Insufficient stock';
        errorMessageBn = 'পর্যাপ্ত স্টক নেই';
      }

      res.status(statusCode).json({
        success: false,
        error: errorMessage,
        message: errorMessage,
        messageBn: errorMessageBn
      });
    }
  }

  /**
   * Validate stock for guest cart items
   * @route POST /api/v1/cart/guest/validate-stock
   */
  async validateGuestCartStock(req, res) {
    try {
      const { items } = req.body;
      const userId = req.user?.id || null;
      const sessionId = req.headers['x-session-id'] || null;

      // Validate each item's stock availability
      const validationResults = [];
      let isValid = true;
      const unavailableItems = [];

      for (const item of items) {
        const { productId, variantId, quantity } = item;

        try {
          // Check stock availability using the stock validation service
          const stockCheck = await stockValidationService.checkStockAvailability(
            productId,
            variantId || null,
            quantity,
            null
          );

          const itemResult = {
            productId,
            variantId: variantId || null,
            productName: stockCheck.productName || 'Unknown Product',
            requestedQuantity: quantity,
            currentStock: stockCheck.currentStock,
            availableForSale: stockCheck.availableForSale,
            backorderQuantity: stockCheck.backorderQuantity || 0,
            canBackorder: stockCheck.canBackorder || false,
            isAvailable: stockCheck.available,
            error: null
          };

          validationResults.push(itemResult);

          if (!stockCheck.available) {
            isValid = false;
            unavailableItems.push(itemResult);
          }
        } catch (error) {
          isValid = false;
          validationResults.push({
            productId,
            variantId: variantId || null,
            productName: 'Unknown Product',
            requestedQuantity: quantity,
            currentStock: 0,
            availableForSale: 0,
            backorderQuantity: 0,
            canBackorder: false,
            isAvailable: false,
            error: error.message
          });
          unavailableItems.push({
            productId,
            variantId: variantId || null,
            error: error.message
          });
        }
      }

      return res.status(200).json({
        success: true,
        isValid,
        message: isValid 
          ? 'All items are in stock' 
          : 'Some items are out of stock or unavailable',
        data: {
          isValid,
          validationResults,
          unavailableItems: unavailableItems.length > 0 ? unavailableItems : undefined
        }
      });
    } catch (error) {
      loggerService.error('Error validating guest cart stock:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to validate stock',
        error: error.message
      });
    }
  }

  // Validate share token (BE-CRIT-002: Cart sharing functionality)
  async validateShareToken(req, res) {
    try {
      const { token } = req.params;

      // Get cart by share token
      const cart = await cartService.getCartByShareToken(token);

      res.json({
        success: true,
        message: 'Shared cart retrieved successfully',
        messageBn: 'শেয়ার করা কার্ট সফলভাবে পুনরুদ্ধার করা হয়েছে',
        data: cart
      });
    } catch (error) {
      loggerService.error('Error in getSharedCart controller', {
        error: error.message,
        stack: error.stack
      });

      let statusCode = 500;
      let errorMessage = 'Failed to retrieve shared cart';
      let errorMessageBn = 'শেয়ার করা কার্ট পুনরুদ্ধার করতে ব্যর্থ হয়েছে';

      if (error.message === 'Invalid share token') {
        statusCode = 404;
        errorMessage = 'Invalid share token';
        errorMessageBn = 'অবৈধ শেয়ার টোকেন';
      } else if (error.message === 'Share token has expired') {
        statusCode = 410;
        errorMessage = 'Share token has expired';
        errorMessageBn = 'শেয়ার টোকেন মেয়াদোত্তীর্ণ হয়েছে';
      }

      res.status(statusCode).json({
        success: false,
        error: error.message,
        message: errorMessage,
        messageBn: errorMessageBn
      });
    }
  }

  // Get cart item count (lightweight endpoint for cart badge)
  async getCartCount(req, res) {
    try {
      const userId = req.user?.id || null;
      const sessionId = req.headers['x-session-id'] || null;

      if (!userId && !sessionId) {
        return res.json({
          success: true,
          data: { itemCount: 0 }
        });
      }

      // Try to get from cache first
      let cart;
      if (userId) {
        try {
          cart = await cartService.getCartFromCache(userId);
        } catch (cacheError) {
          loggerService.warn('Cache retrieval failed for cart count', {
            userId,
            error: cacheError.message
          });
          cart = null;
        }
      }

      if (!cart) {
        cart = await cartService.getCart(userId, sessionId);
      }

      // Calculate item count from cart items
      let itemCount = 0;
      if (cart && cart.items && Array.isArray(cart.items)) {
        itemCount = cart.items.reduce((total, item) => {
          return total + (item.quantity || 0);
        }, 0);
      }

      res.json({
        success: true,
        data: { itemCount }
      });
    } catch (error) {
      loggerService.error('Error in getCartCount controller', {
        error: error.message,
        stack: error.stack,
        userId: req.user?.id,
        sessionId: req.headers['x-session-id']
      });

      // Return 0 on error to not break the UI
      res.json({
        success: true,
        data: { itemCount: 0 }
      });
    }
  }
}

// Singleton instance
const cartController = new CartController();

module.exports = {
  CartController,
  cartController,
  validateCartId,
  validateCartItemId,
  verifyCartOwnership,
  verifyCartItemOwnership
};
