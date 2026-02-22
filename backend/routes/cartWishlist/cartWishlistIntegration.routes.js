const express = require('express');
const { body, param, validationResult } = require('express-validator');
const { authMiddleware } = require('../../middleware/auth');
const { rateLimitService } = require('../../services/rateLimitService');
const { cartWishlistIntegrationController } = require('../../controllers/cartWishlist/cartWishlistIntegration.controller');
const { loggerService } = require('../../services/logger');

const router = express.Router();

// Logger for cart-wishlist integration routes
const integrationLogger = {
  info: (message, data) => loggerService.info(message, data),
  warn: (message, data) => loggerService.warn(message, data),
  error: (message, data) => loggerService.error(message, data)
};

// Rate limiting configuration
const integrationRateLimitConfig = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 50, // 50 requests per window
  message: 'Too many integration operations. Please try again later.',
  messageBn: 'অনেক ইন্টিগ্রেশন অপারেশন। অনুগ্রহ করে পুনরায় চেষ্টা করুন।',
  skipSuccessfulRequests: false
};

const integrationRateLimit = rateLimitService.createRateLimit(integrationRateLimitConfig);

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

// ============================================================================
// Cart to Wishlist Endpoints
// ============================================================================

/**
 * POST /api/v1/cart-wishlist/integration/move-to-wishlist
 * Move a single cart item to wishlist (itemId in body)
 */
router.post('/cart-wishlist/integration/move-to-wishlist', [
  body('itemId').isUUID().withMessage('Invalid cart item ID'),
  body('wishlistId').optional().isUUID().withMessage('Invalid wishlist ID')
], handleValidationErrors, authMiddleware.authenticate(), integrationRateLimit, (req, res) => {
  integrationLogger.info('Move cart item to wishlist request', {
    itemId: req.body.itemId,
    userId: req.user?.id
  });
  cartWishlistIntegrationController.moveCartItemToWishlist(req, res);
});

/**
 * POST /api/v1/cart/items/:itemId/move-to-wishlist
 * Move a single cart item to wishlist (itemId in URL params - legacy)
 */
router.post('/cart/items/:itemId/move-to-wishlist', [
  param('itemId').isUUID().withMessage('Invalid cart item ID'),
  body('wishlistId').optional().isUUID().withMessage('Invalid wishlist ID')
], handleValidationErrors, authMiddleware.authenticate(), integrationRateLimit, (req, res) => {
  integrationLogger.info('Move cart item to wishlist request (legacy)', {
    itemId: req.params.itemId,
    userId: req.user?.id
  });
  cartWishlistIntegrationController.moveCartItemToWishlist(req, res);
});

/**
 * POST /api/v1/cart-wishlist/integration/bulk-move-to-wishlist
 * Bulk move cart items to wishlist
 */
router.post('/cart-wishlist/integration/bulk-move-to-wishlist', [
  body('itemIds').isArray({ min: 1 }).withMessage('itemIds must be a non-empty array'),
  body('itemIds.*').isUUID().withMessage('Invalid item ID in array'),
  body('wishlistId').optional().isUUID().withMessage('Invalid wishlist ID')
], handleValidationErrors, authMiddleware.authenticate(), integrationRateLimit, (req, res) => {
  integrationLogger.info('Bulk move cart items to wishlist request', {
    itemCount: req.body.itemIds?.length,
    userId: req.user?.id
  });
  cartWishlistIntegrationController.bulkMoveCartItemsToWishlist(req, res);
});

/**
 * POST /api/v1/cart-wishlist/integration/move-all-to-wishlist
 * Move all cart items to wishlist
 */
router.post('/cart-wishlist/integration/move-all-to-wishlist', [
  body('wishlistId').optional().isUUID().withMessage('Invalid wishlist ID')
], handleValidationErrors, authMiddleware.authenticate(), integrationRateLimit, (req, res) => {
  integrationLogger.info('Move all cart items to wishlist request', {
    userId: req.user?.id
  });
  cartWishlistIntegrationController.moveAllCartItemsToWishlist(req, res);
});

// ============================================================================
// Legacy Routes (for backward compatibility)
// ============================================================================

/**
 * POST /api/v1/cart/bulk-move-to-wishlist
 * Bulk move cart items to wishlist (legacy)
 */
router.post('/cart/bulk-move-to-wishlist', [
  body('itemIds').isArray({ min: 1 }).withMessage('itemIds must be a non-empty array'),
  body('itemIds.*').isUUID().withMessage('Invalid item ID in array'),
  body('wishlistId').optional().isUUID().withMessage('Invalid wishlist ID')
], handleValidationErrors, authMiddleware.authenticate(), integrationRateLimit, (req, res) => {
  integrationLogger.info('Bulk move cart items to wishlist request (legacy)', {
    itemCount: req.body.itemIds?.length,
    userId: req.user?.id
  });
  cartWishlistIntegrationController.bulkMoveCartItemsToWishlist(req, res);
});

/**
 * POST /api/v1/cart/move-all-to-wishlist
 * Move all cart items to wishlist (legacy)
 */
router.post('/cart/move-all-to-wishlist', [
  body('wishlistId').optional().isUUID().withMessage('Invalid wishlist ID')
], handleValidationErrors, authMiddleware.authenticate(), integrationRateLimit, (req, res) => {
  integrationLogger.info('Move all cart items to wishlist request (legacy)', {
    userId: req.user?.id
  });
  cartWishlistIntegrationController.moveAllCartItemsToWishlist(req, res);
});

// ============================================================================
// Wishlist to Cart Endpoints
// ============================================================================

/**
 * POST /api/v1/cart-wishlist/integration/bulk-move-to-cart
 * Bulk move wishlist items to cart
 */
router.post('/cart-wishlist/integration/bulk-move-to-cart', [
  body('itemIds').isArray({ min: 1 }).withMessage('itemIds must be a non-empty array'),
  body('itemIds.*').isUUID().withMessage('Invalid item ID in array'),
  body('cartId').optional().isUUID().withMessage('Invalid cart ID')
], handleValidationErrors, authMiddleware.authenticate(), integrationRateLimit, (req, res) => {
  integrationLogger.info('Bulk move wishlist items to cart request', {
    itemCount: req.body.itemIds?.length,
    userId: req.user?.id
  });
  cartWishlistIntegrationController.bulkMoveWishlistItemsToCart(req, res);
});

// ============================================================================
// Legacy Routes (for backward compatibility)
// ============================================================================

/**
 * POST /api/v1/wishlist/bulk-move-to-cart
 * Bulk move wishlist items to cart (legacy)
 */
router.post('/wishlist/bulk-move-to-cart', [
  body('itemIds').isArray({ min: 1 }).withMessage('itemIds must be a non-empty array'),
  body('itemIds.*').isUUID().withMessage('Invalid item ID in array'),
  body('cartId').optional().isUUID().withMessage('Invalid cart ID')
], handleValidationErrors, authMiddleware.authenticate(), integrationRateLimit, (req, res) => {
  integrationLogger.info('Bulk move wishlist items to cart request (legacy)', {
    itemCount: req.body.itemIds?.length,
    userId: req.user?.id
  });
  cartWishlistIntegrationController.bulkMoveWishlistItemsToCart(req, res);
});

/**
 * POST /api/v1/cart-wishlist/integration/wishlist/:id/move-all-to-cart
 * Move all wishlist items to cart
 */
router.post('/cart-wishlist/integration/wishlist/:id/move-all-to-cart', [
  param('id').isUUID().withMessage('Invalid wishlist ID'),
  body('cartId').optional().isUUID().withMessage('Invalid cart ID')
], handleValidationErrors, authMiddleware.authenticate(), integrationRateLimit, (req, res) => {
  integrationLogger.info('Move all wishlist items to cart request', {
    wishlistId: req.params.id,
    userId: req.user?.id
  });
  cartWishlistIntegrationController.moveAllWishlistItemsToCart(req, res);
});

/**
 * POST /api/v1/wishlist/:id/move-all-to-cart
 * Move all wishlist items to cart (legacy)
 */
router.post('/wishlist/:id/move-all-to-cart', [
  param('id').isUUID().withMessage('Invalid wishlist ID'),
  body('cartId').optional().isUUID().withMessage('Invalid cart ID')
], handleValidationErrors, authMiddleware.authenticate(), integrationRateLimit, (req, res) => {
  integrationLogger.info('Move all wishlist items to cart request (legacy)', {
    wishlistId: req.params.id,
    userId: req.user?.id
  });
  cartWishlistIntegrationController.moveAllWishlistItemsToCart(req, res);
});

// ============================================================================
// Move History
// ============================================================================

/**
 * GET /api/v1/cart-wishlist/move-history
 * Get move history for user
 */
router.get('/cart-wishlist/move-history', [
  // Query params are optional
], handleValidationErrors, authMiddleware.authenticate(), integrationRateLimit, (req, res) => {
  integrationLogger.info('Get move history request', {
    userId: req.user?.id,
    filters: req.query
  });
  cartWishlistIntegrationController.getMoveHistory(req, res);
});

module.exports = router;
