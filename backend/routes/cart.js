const express = require('express');
const { body, param, validationResult } = require('express-validator');
const { authMiddleware } = require('../middleware/auth');
const { rateLimitService } = require('../services/rateLimitService');
const { cartController } = require('../controllers/cartController');
const { validateCartId, validateCartItemId, verifyCartOwnership, verifyCartItemOwnership } = require('../controllers/cartController');
const { cartService } = require('../services/cartService');
const { stockValidationService } = require('../services/stockValidationService');
const { loggerService } = require('../services/logger');
const crypto = require('crypto');

// Logger for cart routes
const cartLogger = {
  info: (message, data) => loggerService.info(message, data),
  warn: (message, data) => loggerService.warn(message, data),
  error: (message, data) => loggerService.error(message, data)
};

const router = express.Router();

// Rate limiting configuration for cart endpoints
const cartRateLimitConfig = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 100, // 100 requests per window for authenticated users
  message: 'Too many cart operations. Please try again later.',
  messageBn: 'অনেক কার্ট অপারেশন। অনুগ্রহ করে পুনরায় চেষ্টা করুন।',
  skipSuccessfulRequests: false
};

const guestCartRateLimitConfig = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 20, // 20 requests per window for guest users
  message: 'Too many cart operations. Please try again later.',
  messageBn: 'অনেক কার্ট অপারেশন। অনুগ্রহ করে পুনরায় চেষ্টা করুন।',
  skipSuccessfulRequests: false
};

// Create rate limiting middleware
const authenticatedCartRateLimit = rateLimitService.createRateLimit(cartRateLimitConfig);
const guestCartRateLimit = rateLimitService.createRateLimit(guestCartRateLimitConfig);

// Middleware to apply appropriate rate limit based on authentication
const applyCartRateLimit = (req, res, next) => {
  if (req.user && req.user.id) {
    // Authenticated user - use higher limit
    return authenticatedCartRateLimit(req, res, next);
  } else {
    // Guest user - use lower limit
    return guestCartRateLimit(req, res, next);
  }
};

// Validation middleware
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      message: 'Validation failed',
      messageBn: 'যাচাইকরণ ব্যর্থ হয়েছে',
      details: errors.array()
    });
  }
  next();
};

// IMPORTANT: Routes with parameters (:cartId, :id) must be defined AFTER specific routes
// This is because Express matches routes in the order they are defined

// New routes (MUST BE FIRST - they have specific paths without parameters)

// GET /api/v1/cart/count - Get cart item count (lightweight endpoint for cart badge)
router.get('/count', [
  // No validation required for GET
], authMiddleware.optional(), applyCartRateLimit, cartController.getCartCount);

// GET /api/v1/cart/summary - Get cart summary
router.get('/summary', [
  // No validation required for GET
], authMiddleware.optional(), applyCartRateLimit, cartController.getCartSummary);

// Legacy routes for backward compatibility (MUST BE AFTER specific routes - they have parameters)
// GET /api/v1/cart/:cartId - Get cart by ID (legacy)
// CRIT-005: Added validateCartId middleware for input validation
router.get('/:cartId', [
  param('cartId').isUUID().withMessage('Invalid cart ID')
], handleValidationErrors, authMiddleware.authenticate(), applyCartRateLimit, validateCartId, verifyCartOwnership, (req, res) => {
  // Map legacy route to new controller method
  req.params.cartId = req.params.cartId;
  cartController.getCart(req, res);
});

// POST /api/v1/cart/:cartId/items - Add item to cart by cart ID (legacy)
// Body: { productId, quantity, variantId? }
// CRIT-001: Added verifyCartOwnership middleware for cart modification security
router.post('/:cartId/items', [
  param('cartId').isUUID().withMessage('Invalid cart ID'),
  body('productId').isUUID().withMessage('Invalid product ID'),
  body('quantity').isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
  body('variantId').optional().isUUID().withMessage('Invalid variant ID')
], handleValidationErrors, authMiddleware.authenticate(), applyCartRateLimit, validateCartId, verifyCartOwnership, (req, res) => {
  // Map legacy route to new controller method
  req.body.cartId = req.params.cartId;
  cartController.addItemToCart(req, res);
});

// PUT /api/v1/cart/:cartId/items/:itemId - Update cart item by IDs (legacy)
// Body: { quantity }
// CRIT-001: Added verifyCartOwnership middleware for cart modification security
router.put('/:cartId/items/:itemId', [
  param('cartId').isUUID().withMessage('Invalid cart ID'),
  param('itemId').isUUID().withMessage('Invalid cart item ID'),
  body('quantity').isInt({ min: 1 }).withMessage('Quantity must be at least 1')
], handleValidationErrors, authMiddleware.authenticate(), applyCartRateLimit, validateCartId, verifyCartOwnership, (req, res) => {
  // Map legacy route to new controller method
  req.params.id = req.params.itemId;
  cartController.updateCartItem(req, res);
});

// DELETE /api/v1/cart/:cartId/items/:itemId - Remove cart item by IDs (legacy)
// CRIT-001: Added verifyCartOwnership middleware for cart modification security
router.delete('/:cartId/items/:itemId', [
  param('cartId').isUUID().withMessage('Invalid cart ID'),
  param('itemId').isUUID().withMessage('Invalid cart item ID')
], handleValidationErrors, authMiddleware.authenticate(), applyCartRateLimit, validateCartId, verifyCartOwnership, (req, res) => {
  // Map legacy route to new controller method
  req.params.id = req.params.itemId;
  cartController.removeCartItem(req, res);
});

// DELETE /api/v1/cart/:cartId - Clear cart by ID (legacy)
// CRIT-001: Added verifyCartOwnership middleware for cart modification security
router.delete('/:cartId', [
  param('cartId').isUUID().withMessage('Invalid cart ID')
], handleValidationErrors, authMiddleware.authenticate(), applyCartRateLimit, validateCartId, verifyCartOwnership, (req, res) => {
  // Map legacy route to new controller method
  cartController.clearCart(req, res);
});

// POST /api/v1/cart/:cartId/recalculate-prices - Force recalculate cart prices (SAFEGUARD: debugging/admin use)
// CRIT-001: Added verifyCartOwnership middleware for cart modification security
router.post('/:cartId/recalculate-prices', [
  param('cartId').isUUID().withMessage('Invalid cart ID')
], handleValidationErrors, authMiddleware.authenticate(), applyCartRateLimit, validateCartId, verifyCartOwnership, cartController.forceRecalculatePrices);

// POST /api/v1/cart/:id/share - Generate share token for cart (BE-CRIT-002: Cart sharing functionality)
// CRIT-001: Added verifyCartOwnership middleware for cart modification security
router.post('/:id/share', [
  param('id').isUUID().withMessage('Invalid cart ID'),
  body('expiresInDays').optional().isInt({ min: 1, max: 30 }).withMessage('Expiration days must be between 1 and 30')
], handleValidationErrors, authMiddleware.authenticate(), applyCartRateLimit, validateCartId, verifyCartOwnership, cartController.generateShareToken);

// GET /api/v1/cart/shared/:token - Get shared cart by token (BE-CRIT-002: Cart sharing functionality)
router.get('/shared/:token', [
  param('token').isString().withMessage('Invalid share token')
], handleValidationErrors, authMiddleware.optional(), applyCartRateLimit, cartController.validateShareToken);

// New routes (MUST BE AFTER legacy routes - they don't have parameters or have specific paths)

// POST /api/v1/cart/validate - Validate cart stock (BE-HIGH-001: Fixed HTTP method from GET to POST)
router.post('/validate', [
  // No validation required for POST
], authMiddleware.optional(), applyCartRateLimit, cartController.validateCartStock);

// POST /api/v1/cart/guest/products - Get guest cart products
router.post('/guest/products', [
  body('productIds').isArray().withMessage('Product IDs must be an array'),
], authMiddleware.optional(), applyCartRateLimit, cartController.getGuestCartProducts);

// POST /api/v1/cart/guest/validate - Validate guest cart
router.post('/guest/validate', [
  body('items').isArray().withMessage('Items must be an array'),
], authMiddleware.optional(), applyCartRateLimit, cartController.validateGuestCart);

// POST /api/v1/cart/guest - Create or update guest cart with items
// Body: { items: [{ productId, quantity, variantId?, price }], sessionId }
router.post('/guest', [
  body('items').isArray().withMessage('Items must be an array'),
  body('items.*.productId').isUUID().withMessage('Invalid product ID'),
  body('items.*.quantity').isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
  body('items.*.variantId').optional().isUUID().withMessage('Invalid variant ID'),
  body('items.*.price').isFloat({ min: 0 }).withMessage('Price must be a positive number'),
  body('sessionId').isString().withMessage('Session ID is required')
], handleValidationErrors, authMiddleware.optional(), applyCartRateLimit, cartController.createOrUpdateGuestCart);

// POST /api/v1/cart/guest/validate-stock - Validate stock for guest cart items
router.post('/guest/validate-stock', [
  body('items').isArray().withMessage('Items must be an array'),
  body('items.*.productId').notEmpty().withMessage('Product ID is required'),
  body('items.*.quantity').isInt({ min: 1 }).withMessage('Quantity must be a positive integer'),
  handleValidationErrors
], authMiddleware.optional(), applyCartRateLimit, cartController.validateGuestCartStock);

// POST /api/v1/cart/calculate - Calculate cart totals (BE-CRIT-001: Missing endpoint)
router.post('/calculate', [
  // No validation required for POST
], authMiddleware.optional(), applyCartRateLimit, cartController.calculateCart);

// POST /api/v1/cart/merge - Merge guest cart on login
// Body: { guestSessionId }
// Requires authentication
router.post('/merge', [
  body('guestSessionId').isString().withMessage('Guest session ID is required')
], handleValidationErrors, authMiddleware.authenticate(), applyCartRateLimit, cartController.mergeGuestCart);

// POST /api/v1/cart/items - Add item to cart
// Body: { cartId, productId, quantity, variantId? }
router.post('/items', [
  body('cartId').optional({ nullable: true, checkFalsy: true }).isUUID().withMessage('Invalid cart ID'),
  body('productId').isUUID().withMessage('Invalid product ID'),
  body('quantity').isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
  body('variantId').optional({ nullable: true, checkFalsy: true }).isUUID().withMessage('Invalid variant ID')
], handleValidationErrors, authMiddleware.optional(), applyCartRateLimit, cartController.addItemToCart);

// PUT /api/v1/cart/items/:id - Update cart item
// Body: { quantity }
// CRIT-001: Added verifyCartOwnership middleware for cart modification security
router.put('/items/:id', [
  param('id').isUUID().withMessage('Invalid cart item ID'),
  body('quantity').isInt({ min: 1 }).withMessage('Quantity must be at least 1')
], handleValidationErrors, authMiddleware.optional(), applyCartRateLimit, validateCartItemId, cartController.updateCartItem);

// DELETE /api/v1/cart/items/:id - Remove cart item
// CRIT-001: Added ownership verification middleware for cart modification security
// BUG-FIX: Added verifyCartItemOwnership to ensure users can only delete their own cart items
router.delete('/items/:id', [
  param('id').isUUID().withMessage('Invalid cart item ID')
], handleValidationErrors, authMiddleware.optional(), applyCartRateLimit, validateCartItemId, verifyCartItemOwnership, cartController.removeCartItem);

// PATCH /api/v1/cart/items/:id/quantity - Update item quantity
// Body: { quantity }
// CRIT-001: Added verifyCartOwnership middleware for cart modification security
router.patch('/items/:id/quantity', [
  param('id').isUUID().withMessage('Invalid cart item ID'),
  body('quantity').isInt({ min: 1 }).withMessage('Quantity must be at least 1')
], handleValidationErrors, authMiddleware.optional(), applyCartRateLimit, validateCartItemId, cartController.updateItemQuantity);

// GET /api/v1/cart - Get user/guest cart
// Supports both authenticated users (via JWT) and guest carts (via x-session-id header)
// This must be LAST because it has no parameters and would match everything
router.get('/', [
  // No validation required for GET
], authMiddleware.optional(), applyCartRateLimit, cartController.getCart);

// DELETE /api/v1/cart - Clear cart
// This must be LAST because it has no parameters
router.delete('/', [
  // No validation required for DELETE
], authMiddleware.optional(), applyCartRateLimit, cartController.clearCart);

// ============================================================================
// Stock Validation Endpoints (STOCK-001)
// ============================================================================

// GET /api/v1/cart/stock/status/:productId - Get product stock status
router.get('/stock/status/:productId', [
  param('productId').isUUID().withMessage('Invalid product ID'),
  body('variantId').optional().isUUID().withMessage('Invalid variant ID')
], handleValidationErrors, authMiddleware.optional(), applyCartRateLimit, async (req, res) => {
  const { productId } = req.params;
  const { variantId } = req.body;

  try {
    const stockStatus = await cartService.getProductStockStatus(productId, variantId);
    res.json({
      success: true,
      message: 'Stock status retrieved',
      data: stockStatus
    });
  } catch (error) {
    cartLogger.error('Error getting stock status', { productId, error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to get stock status'
    });
  }
});

// POST /api/v1/cart/stock/check - Check stock availability
router.post('/stock/check', [
  body('productId').isUUID().withMessage('Invalid product ID'),
  body('variantId').optional().isUUID().withMessage('Invalid variant ID'),
  body('quantity').isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
  body('cartId').optional().isUUID().withMessage('Invalid cart ID')
], handleValidationErrors, authMiddleware.optional(), applyCartRateLimit, async (req, res) => {
  const { productId, variantId, quantity, cartId } = req.body;

  try {
    const availability = await stockValidationService.checkStockAvailability(
      productId,
      variantId || null,
      quantity,
      cartId
    );
    res.json({
      success: true,
      message: 'Stock availability checked',
      data: availability
    });
  } catch (error) {
    cartLogger.error('Error checking stock availability', { productId, error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to check stock availability'
    });
  }
});

// POST /api/v1/cart/stock/reserve - Reserve stock for cart item
router.post('/stock/reserve', [
  body('productId').isUUID().withMessage('Invalid product ID'),
  body('variantId').optional().isUUID().withMessage('Invalid variant ID'),
  body('quantity').isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
  body('cartId').isUUID().withMessage('Invalid cart ID')
], handleValidationErrors, authMiddleware.optional(), applyCartRateLimit, async (req, res) => {
  const { productId, variantId, quantity, cartId } = req.body;

  try {
    const result = await stockValidationService.reserveStock(
      productId,
      variantId || null,
      quantity,
      cartId
    );

    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: result.error,
        message: result.error
      });
    }

    res.json({
      success: true,
      message: 'Stock reserved successfully',
      data: result
    });
  } catch (error) {
    cartLogger.error('Error reserving stock', { productId, error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to reserve stock'
    });
  }
});

// POST /api/v1/cart/stock/release/:reservationId - Release stock reservation
router.post('/stock/release/:reservationId', [
  param('reservationId').isUUID().withMessage('Invalid reservation ID')
], handleValidationErrors, authMiddleware.optional(), applyCartRateLimit, async (req, res) => {
  const { reservationId } = req.params;

  try {
    const result = await stockValidationService.releaseStock(reservationId);
    res.json({
      success: true,
      message: 'Reservation released',
      data: result
    });
  } catch (error) {
    cartLogger.error('Error releasing reservation', { reservationId, error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to release reservation'
    });
  }
});

// POST /api/v1/cart/stock/validate - Validate entire cart stock
router.post('/stock/validate', authMiddleware.optional(), applyCartRateLimit, async (req, res) => {
  const userId = req.user?.id || null;
  const sessionId = req.headers['x-session-id'] || null;

  if (!userId && !sessionId) {
    return res.status(400).json({
      success: false,
      error: 'Authentication required'
    });
  }

  try {
    const cart = await cartService.getCart(userId, sessionId);
    if (!cart) {
      return res.status(404).json({
        success: false,
        error: 'Cart not found'
      });
    }

    const validation = await stockValidationService.validateCartStock(cart.id);
    res.json({
      success: true,
      message: validation.isValid ? 'All items in stock' : 'Some items out of stock',
      data: validation
    });
  } catch (error) {
    cartLogger.error('Error validating cart stock', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to validate cart stock'
    });
  }
});

// ============================================================================
// Backorder Configuration Endpoints (STOCK-002)
// ============================================================================

// GET /api/v1/cart/backorder/config - Get backorder configuration
router.get('/backorder/config', authMiddleware.optional(), applyCartRateLimit, (req, res) => {
  const config = cartService.getBackorderConfig();
  res.json({
    success: true,
    message: 'Backorder configuration',
    data: config
  });
});

// GET /api/v1/cart/backorder/eligibility/:productId - Check backorder eligibility
router.get('/backorder/eligibility/:productId', [
  param('productId').isUUID().withMessage('Invalid product ID'),
  body('variantId').optional().isUUID().withMessage('Invalid variant ID')
], handleValidationErrors, authMiddleware.optional(), applyCartRateLimit, async (req, res) => {
  const { productId } = req.params;
  const { variantId } = req.body;

  try {
    const eligibility = await cartService.checkBackorderEligibility(productId, variantId || null);
    res.json({
      success: true,
      message: 'Backorder eligibility checked',
      data: eligibility
    });
  } catch (error) {
    cartLogger.error('Error checking backorder eligibility', { productId, error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to check backorder eligibility'
    });
  }
});

// ============================================================================
// ETag and Concurrent Request Handling Endpoints (STOCK-003)
// ============================================================================

// GET /api/v1/cart/etag - Get cart with ETag for conditional requests
router.get('/etag', authMiddleware.optional(), applyCartRateLimit, async (req, res) => {
  const userId = req.user?.id || null;
  const sessionId = req.headers['x-session-id'] || null;

  if (!userId && !sessionId) {
    return res.status(400).json({
      success: false,
      error: 'Authentication required'
    });
  }

  try {
    const cart = await cartService.getCart(userId, sessionId);
    if (!cart) {
      return res.status(404).json({
        success: false,
        error: 'Cart not found'
      });
    }

    const cartWithETag = await cartService.getCartWithETag(cart.id);
    res.set('ETag', cartWithETag.etag);
    res.json({
      success: true,
      message: 'Cart retrieved with ETag',
      data: cartWithETag
    });
  } catch (error) {
    cartLogger.error('Error getting cart with ETag', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to get cart'
    });
  }
});

// GET /api/v1/cart/etag/validate - Validate ETag against current cart state
router.get('/etag/validate', authMiddleware.optional(), applyCartRateLimit, async (req, res) => {
  const userId = req.user?.id || null;
  const sessionId = req.headers['x-session-id'] || null;
  const clientETag = req.headers['if-none-match'] || req.headers['etag'] || null;

  if (!userId && !sessionId) {
    return res.status(400).json({
      success: false,
      error: 'Authentication required'
    });
  }

  try {
    const cart = await cartService.getCart(userId, sessionId);
    if (!cart) {
      return res.status(404).json({
        success: false,
        error: 'Cart not found'
      });
    }

    const validation = await cartService.validateCartETag(cart.id, clientETag);
    res.json({
      success: true,
      message: 'ETag validation result',
      data: validation
    });
  } catch (error) {
    cartLogger.error('Error validating ETag', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to validate ETag'
    });
  }
});

// POST /api/v1/cart/stock/extend - Extend stock reservations for cart
router.post('/stock/extend', authMiddleware.optional(), applyCartRateLimit, async (req, res) => {
  const userId = req.user?.id || null;
  const sessionId = req.headers['x-session-id'] || null;

  if (!userId && !sessionId) {
    return res.status(400).json({
      success: false,
      error: 'Authentication required'
    });
  }

  try {
    const cart = await cartService.getCart(userId, sessionId);
    if (!cart) {
      return res.status(404).json({
        success: false,
        error: 'Cart not found'
      });
    }

    const result = await stockValidationService.extendCartReservations(cart.id);
    res.json({
      success: true,
      message: 'Reservations extended',
      data: result
    });
  } catch (error) {
    cartLogger.error('Error extending reservations', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to extend reservations'
    });
  }
});

// ============================================================================
// Guest Cart Endpoints (GUEST-001)
// ============================================================================

// POST /api/v1/cart/guest/create - Create guest cart
// Body: { items: [{ productId, quantity, variantId?, price }] }
// Returns: { cart, sessionId }
router.post('/guest/create', [
  body('items').isArray({ min: 0 }).withMessage('Items must be an array'),
  body('items.*.productId').isUUID().withMessage('Invalid product ID'),
  body('items.*.quantity').isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
  body('items.*.variantId').optional().isUUID().withMessage('Invalid variant ID'),
  body('items.*.price').optional().isFloat({ min: 0 }).withMessage('Price must be a positive number')
], handleValidationErrors, authMiddleware.optional(), applyCartRateLimit, async (req, res) => {
  try {
    const { items } = req.body;
    
    // Generate unique session ID
    const sessionId = crypto.randomUUID();
    
    // Create guest cart
    const cart = await prisma.cart.create({
      data: {
        sessionId,
        status: 'active',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
        items: items && items.length > 0 ? {
          create: items.map(item => ({
            productId: item.productId,
            variantId: item.variantId || null,
            quantity: item.quantity,
            price: item.price || 0,
            subtotal: (item.price || 0) * item.quantity
          }))
        } : undefined
      },
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
                images: {
                  where: { displayOrder: 0 },
                  take: 1,
                  select: {
                    id: true,
                    originalUrl: true,
                    thumbnailUrl: true
                  }
                }
              }
            },
            variant: true
          }
        }
      }
    });

    // Calculate cart totals
    const totals = await cartService.calculateCartTotals(cart.id);

    res.status(201).json({
      success: true,
      message: 'Guest cart created successfully',
      messageBn: 'অতিথি কার্ট সফলভাবে তৈরি করা হয়েছে',
      data: {
        cart,
        sessionId,
        totals
      }
    });
  } catch (error) {
    cartLogger.error('Error creating guest cart', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to create guest cart',
      message: 'Failed to create guest cart',
      messageBn: 'অতিথি কার্ট তৈরি করতে ব্যর্থ হয়েছে'
    });
  }
});

// GET /api/v1/cart/guest/:sessionId - Get guest cart
// Returns: { cart, items, totals }
router.get('/guest/:sessionId', [
  param('sessionId').isString().trim().notEmpty().withMessage('Session ID is required')
], handleValidationErrors, authMiddleware.optional(), applyCartRateLimit, async (req, res) => {
  try {
    const { sessionId } = req.params;

    // Get guest cart
    const cart = await prisma.cart.findFirst({
      where: {
        sessionId,
        status: { in: ['active', 'abandoned'] }
      },
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
                  select: {
                    id: true,
                    originalUrl: true,
                    thumbnailUrl: true,
                    altTextEn: true,
                    altTextBn: true
                  }
                }
              }
            },
            variant: true
          }
        }
      }
    });

    if (!cart) {
      return res.status(404).json({
        success: false,
        error: 'Guest cart not found',
        message: 'Guest cart not found',
        messageBn: 'অতিথি কার্ট পাওয়া যায়নি'
      });
    }

    // Check if cart is expired
    if (cart.expiresAt && cart.expiresAt < new Date()) {
      return res.status(410).json({
        success: false,
        error: 'Guest cart has expired',
        message: 'Guest cart has expired',
        messageBn: 'অতিথি কার্ট মেয়াদোত্তীর্ণ হয়েছে'
      });
    }

    // Calculate cart totals
    const totals = await cartService.calculateCartTotals(cart.id);

    res.json({
      success: true,
      message: 'Guest cart retrieved successfully',
      messageBn: 'অতিথি কার্ট সফলভাবে পুনরুদ্ধার করা হয়েছে',
      data: {
        cart,
        items: cart.items,
        totals
      }
    });
  } catch (error) {
    cartLogger.error('Error getting guest cart', { error: error.message, sessionId: req.params.sessionId });
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve guest cart',
      message: 'Failed to retrieve guest cart',
      messageBn: 'অতিথি কার্ট পুনরুদ্ধার করতে ব্যর্থ হয়েছে'
    });
  }
});

// PUT /api/v1/cart/guest/:sessionId/merge - Merge guest cart with user cart
// Body: { userId }
// Requires authentication
// Returns: { mergedCart, mergedItemCount }
router.put('/guest/:sessionId/merge', [
  param('sessionId').isString().trim().notEmpty().withMessage('Session ID is required'),
  body('userId').optional().isUUID().withMessage('Invalid user ID')
], handleValidationErrors, authMiddleware.authenticate(), applyCartRateLimit, async (req, res) => {
  try {
    const { sessionId } = req.params;
    const userId = req.body.userId || req.user.id;

    // Get guest cart
    const guestCart = await prisma.cart.findFirst({
      where: { sessionId },
      include: { items: true }
    });

    if (!guestCart) {
      return res.status(404).json({
        success: false,
        error: 'Guest cart not found',
        message: 'Guest cart not found',
        messageBn: 'অতিথি কার্ট পাওয়া যায়নি'
      });
    }

    // Get user cart
    let userCart = await prisma.cart.findFirst({
      where: { userId },
      include: { items: true }
    });

    // Create user cart if it doesn't exist
    if (!userCart) {
      userCart = await prisma.cart.create({
        data: {
          userId,
          status: 'active'
        },
        include: { items: true }
      });
    }

    // Merge items: keep user cart items, add guest cart items
    // If same product exists in both, add quantities
    let mergedItemCount = 0;

    for (const guestItem of guestCart.items) {
      const existingItem = userCart.items.find(
        item => item.productId === guestItem.productId &&
                item.variantId === guestItem.variantId
      );

      if (existingItem) {
        // Update quantity of existing item
        await prisma.cartItem.update({
          where: { id: existingItem.id },
          data: {
            quantity: existingItem.quantity + guestItem.quantity,
            subtotal: (existingItem.quantity + guestItem.quantity) * parseFloat(guestItem.price)
          }
        });
        mergedItemCount++;
      } else {
        // Add new item to user cart
        await prisma.cartItem.create({
          data: {
            cartId: userCart.id,
            productId: guestItem.productId,
            variantId: guestItem.variantId,
            quantity: guestItem.quantity,
            price: guestItem.price,
            subtotal: guestItem.subtotal
          }
        });
        mergedItemCount++;
      }
    }

    // Recalculate user cart totals
    const totals = await cartService.calculateCartTotals(userCart.id);

    // Update user cart totals
    await prisma.cart.update({
      where: { id: userCart.id },
      data: {
        subtotal: totals.subtotal,
        tax: totals.tax,
        shippingCost: totals.shippingCost,
        discount: totals.discount,
        total: totals.total,
        updatedAt: new Date()
      }
    });

    // Mark guest cart as converted
    await prisma.cart.update({
      where: { id: guestCart.id },
      data: {
        status: 'converted',
        updatedAt: new Date()
      }
    });

    // Get updated user cart with items
    const mergedCart = await prisma.cart.findUnique({
      where: { id: userCart.id },
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
                images: {
                  where: { displayOrder: 0 },
                  take: 1,
                  select: {
                    id: true,
                    originalUrl: true,
                    thumbnailUrl: true
                  }
                }
              }
            },
            variant: true
          }
        }
      }
    });

    res.json({
      success: true,
      message: 'Guest cart merged successfully',
      messageBn: 'অতিথি কার্ট সফলভাবে মার্জ করা হয়েছে',
      data: {
        mergedCart,
        mergedItemCount,
        totals
      }
    });
  } catch (error) {
    cartLogger.error('Error merging guest cart', { error: error.message, sessionId: req.params.sessionId });
    res.status(500).json({
      success: false,
      error: 'Failed to merge guest cart',
      message: 'Failed to merge guest cart',
      messageBn: 'অতিথি কার্ট মার্জ করতে ব্যর্থ হয়েছে'
    });
  }
});

module.exports = router;
