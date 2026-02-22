const express = require('express');
const { body, param, validationResult } = require('express-validator');
const { authMiddleware } = require('../../middleware/auth');
const { rateLimitService } = require('../../services/rateLimitService');
const { cartWishlistSyncController } = require('../../controllers/cartWishlist/cartWishlistSync.controller');
const { loggerService } = require('../../services/logger');

const router = express.Router();

// Logger for cart-wishlist sync routes
const syncLogger = {
  info: (message, data) => loggerService.info(message, data),
  warn: (message, data) => loggerService.warn(message, data),
  error: (message, data) => loggerService.error(message, data)
};

// Rate limiting configuration
const syncRateLimitConfig = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 30, // 30 requests per window
  message: 'Too many sync operations. Please try again later.',
  messageBn: 'অনেক সিঙ্ক অপারেশন। অনুগ্রহ করে পুনরায় চেষ্টা করুন।',
  skipSuccessfulRequests: false
};

const syncRateLimit = rateLimitService.createRateLimit(syncRateLimitConfig);

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
// Sync Status Endpoints
// ============================================================================

/**
 * GET /api/v1/cart-wishlist/sync/status
 * Get current sync status for user
 */
router.get('/cart-wishlist/sync/status', [
  // No validation required for GET
], authMiddleware.authenticate(), syncRateLimit, (req, res) => {
  syncLogger.info('Get sync status request', {
    userId: req.user?.id
  });
  cartWishlistSyncController.getSyncStatus(req, res);
});

/**
 * POST /api/v1/cart-wishlist/sync/trigger
 * Trigger manual synchronization
 */
router.post('/cart-wishlist/sync/trigger', [
  body('cartId').optional().isUUID().withMessage('Invalid cart ID'),
  body('wishlistId').optional().isUUID().withMessage('Invalid wishlist ID')
], handleValidationErrors, authMiddleware.authenticate(), syncRateLimit, (req, res) => {
  syncLogger.info('Trigger sync request', {
    userId: req.user?.id,
    cartId: req.body.cartId,
    wishlistId: req.body.wishlistId
  });
  cartWishlistSyncController.triggerSync(req, res);
});

/**
 * GET /api/v1/cart-wishlist/sync/pending
 * Get pending sync operations
 */
router.get('/cart-wishlist/sync/pending', [
  // No validation required for GET
], authMiddleware.authenticate(), syncRateLimit, (req, res) => {
  syncLogger.info('Get pending sync request', {
    userId: req.user?.id
  });
  cartWishlistSyncController.getPendingSync(req, res);
});

/**
 * POST /api/v1/cart-wishlist/sync/offline
 * Sync offline changes when user comes online
 */
router.post('/cart-wishlist/sync/offline', [
  body('operations').isArray({ min: 1 }).withMessage('operations must be a non-empty array'),
  body('operations.*.type').isString().notEmpty().withMessage('operation type is required'),
  body('operations.*.data').isObject().withMessage('operation data must be an object'),
  body('operations.*.timestamp').isISO8601().withMessage('operation timestamp must be ISO8601 format')
], handleValidationErrors, authMiddleware.authenticate(), syncRateLimit, (req, res) => {
  syncLogger.info('Offline sync request', {
    userId: req.user?.id,
    operationsCount: req.body.operations?.length
  });
  cartWishlistSyncController.syncOfflineChanges(req, res);
});

/**
 * POST /api/v1/cart-wishlist/sync/:syncId/cancel
 * Cancel a sync operation
 */
router.post('/cart-wishlist/sync/:syncId/cancel', [
  param('syncId').isUUID().withMessage('Invalid sync ID')
], handleValidationErrors, authMiddleware.authenticate(), syncRateLimit, (req, res) => {
  syncLogger.info('Cancel sync request', {
    syncId: req.params.syncId,
    userId: req.user?.id
  });
  cartWishlistSyncController.cancelSync(req, res);
});

/**
 * POST /api/v1/cart-wishlist/sync/conflicts/:conflictId/resolve
 * Resolve a sync conflict
 */
router.post('/cart-wishlist/sync/conflicts/:conflictId/resolve', [
  param('conflictId').isUUID().withMessage('Invalid conflict ID'),
  body('resolution').isIn(['keep_cart', 'keep_wishlist', 'merge']).withMessage('Invalid resolution type')
], handleValidationErrors, authMiddleware.authenticate(), syncRateLimit, (req, res) => {
  syncLogger.info('Resolve conflict request', {
    conflictId: req.params.conflictId,
    resolution: req.body.resolution,
    userId: req.user?.id
  });
  cartWishlistSyncController.resolveConflict(req, res);
});

/**
 * GET /api/v1/cart-wishlist/sync/conflicts
 * Get all sync conflicts
 */
router.get('/cart-wishlist/sync/conflicts', [
  // No validation required for GET
], authMiddleware.authenticate(), syncRateLimit, (req, res) => {
  syncLogger.info('Get sync conflicts request', {
    userId: req.user?.id
  });
  cartWishlistSyncController.getSyncConflicts(req, res);
});

// ============================================================================
// Legacy Routes (for backward compatibility)
// ============================================================================

/**
 * GET /api/v1/cart-wishlist/sync-status
 * Get current sync status for user (legacy)
 */
router.get('/cart-wishlist/sync-status', [
  // No validation required for GET
], authMiddleware.authenticate(), syncRateLimit, (req, res) => {
  syncLogger.info('Get sync status request (legacy)', {
    userId: req.user?.id
  });
  cartWishlistSyncController.getSyncStatus(req, res);
});

/**
 * POST /api/v1/cart-wishlist/trigger-sync
 * Trigger manual synchronization (legacy)
 */
router.post('/cart-wishlist/trigger-sync', [
  body('cartId').optional().isUUID().withMessage('Invalid cart ID'),
  body('wishlistId').optional().isUUID().withMessage('Invalid wishlist ID')
], handleValidationErrors, authMiddleware.authenticate(), syncRateLimit, (req, res) => {
  syncLogger.info('Trigger sync request (legacy)', {
    userId: req.user?.id,
    cartId: req.body.cartId,
    wishlistId: req.body.wishlistId
  });
  cartWishlistSyncController.triggerSync(req, res);
});

/**
 * GET /api/v1/cart-wishlist/pending-sync
 * Get pending sync operations (legacy)
 */
router.get('/cart-wishlist/pending-sync', [
  // No validation required for GET
], authMiddleware.authenticate(), syncRateLimit, (req, res) => {
  syncLogger.info('Get pending sync request (legacy)', {
    userId: req.user?.id
  });
  cartWishlistSyncController.getPendingSync(req, res);
});

/**
 * POST /api/v1/cart-wishlist/offline-sync
 * Sync offline changes when user comes online (legacy)
 */
router.post('/cart-wishlist/offline-sync', [
  body('operations').isArray({ min: 1 }).withMessage('operations must be a non-empty array'),
  body('operations.*.type').isString().notEmpty().withMessage('operation type is required'),
  body('operations.*.data').isObject().withMessage('operation data must be an object'),
  body('operations.*.timestamp').isISO8601().withMessage('operation timestamp must be ISO8601 format')
], handleValidationErrors, authMiddleware.authenticate(), syncRateLimit, (req, res) => {
  syncLogger.info('Offline sync request (legacy)', {
    userId: req.user?.id,
    operationsCount: req.body.operations?.length
  });
  cartWishlistSyncController.syncOfflineChanges(req, res);
});

/**
 * DELETE /api/v1/cart-wishlist/sync/:id
 * Cancel/remove a sync operation (legacy)
 */
router.delete('/cart-wishlist/sync/:id', [
  param('id').isUUID().withMessage('Invalid sync ID')
], handleValidationErrors, authMiddleware.authenticate(), syncRateLimit, (req, res) => {
  syncLogger.info('Cancel sync request (legacy)', {
    syncId: req.params.id,
    userId: req.user?.id
  });
  cartWishlistSyncController.cancelSync(req, res);
});

/**
 * POST /api/v1/cart-wishlist/resolve-conflict
 * Resolve a sync conflict (legacy)
 */
router.post('/cart-wishlist/resolve-conflict', [
  body('conflictId').isUUID().withMessage('Invalid conflict ID'),
  body('resolution').isIn(['keep_cart', 'keep_wishlist', 'merge']).withMessage('Invalid resolution type')
], handleValidationErrors, authMiddleware.authenticate(), syncRateLimit, (req, res) => {
  syncLogger.info('Resolve conflict request (legacy)', {
    conflictId: req.body.conflictId,
    resolution: req.body.resolution,
    userId: req.user?.id
  });
  cartWishlistSyncController.resolveConflict(req, res);
});

/**
 * GET /api/v1/cart-wishlist/sync-history
 * Get user sync history
 */
router.get('/cart-wishlist/sync-history', [
  // Query params are optional
], handleValidationErrors, authMiddleware.authenticate(), syncRateLimit, (req, res) => {
  syncLogger.info('Get sync history request', {
    userId: req.user?.id,
    filters: req.query
  });
  cartWishlistSyncController.getSyncHistory(req, res);
});

module.exports = router;
