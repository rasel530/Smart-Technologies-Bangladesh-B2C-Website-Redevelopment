const express = require('express');
const { body, param, query, validationResult } = require('express-validator');
const { authMiddleware } = require('../../middleware/auth');
const { rateLimitService } = require('../../services/rateLimitService');
const { adminCartWishlistController } = require('../../controllers/cartWishlist/adminCartWishlist.controller');
const { loggerService } = require('../../services/logger');

const router = express.Router();

// Logger for admin cart-wishlist routes
const adminLogger = {
  info: (message, data) => loggerService.info(message, data),
  warn: (message, data) => loggerService.warn(message, data),
  error: (message, data) => loggerService.error(message, data)
};

// Rate limiting configuration
const adminRateLimitConfig = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 50, // 50 requests per window
  message: 'Too many admin requests. Please try again later.',
  messageBn: 'অনেক অ্যাডমিন অনুরোধ। অনুগ্রহ করে পুনরায় চেষ্টা করুন।',
  skipSuccessfulRequests: false
};

const adminRateLimit = rateLimitService.createRateLimit(adminRateLimitConfig);

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
// Admin Cart-Wishlist Endpoints
// ============================================================================

/**
 * GET /api/v1/admin/cart-wishlist/sync/status
 * Get system-wide sync status (admin only)
 */
router.get('/admin/cart-wishlist/sync/status', [
  // No validation required for GET
], authMiddleware.authenticate(), adminRateLimit, (req, res, next) => {
  // Verify admin role
  adminCartWishlistController.verifyAdmin(req, res, (err) => {
    if (err) return;
    adminLogger.info('Get system sync status request', {
      adminUserId: req.user?.id
    });
    adminCartWishlistController.getSystemSyncStatus(req, res);
  });
});

/**
 * GET /api/v1/admin/cart-wishlist/conflicts
 * Get all conflicts (admin only)
 */
router.get('/admin/cart-wishlist/conflicts', [
  // No validation required for GET
], authMiddleware.authenticate(), adminRateLimit, (req, res, next) => {
  // Verify admin role
  adminCartWishlistController.verifyAdmin(req, res, (err) => {
    if (err) return;
    adminLogger.info('Get all conflicts request', {
      adminUserId: req.user?.id
    });
    adminCartWishlistController.getAllConflicts(req, res);
  });
});

/**
 * POST /api/v1/admin/cart-wishlist/conflicts/:conflictId/resolve
 * Admin conflict resolution (admin only)
 */
router.post('/admin/cart-wishlist/conflicts/:conflictId/resolve', [
  param('conflictId').isUUID().withMessage('Invalid conflict ID'),
  body('resolution').isIn(['keep_cart', 'keep_wishlist', 'merge']).withMessage('Invalid resolution type'),
  body('adminNote').optional().isString().withMessage('Admin note must be a string')
], handleValidationErrors, authMiddleware.authenticate(), adminRateLimit, (req, res, next) => {
  // Verify admin role
  adminCartWishlistController.verifyAdmin(req, res, (err) => {
    if (err) return;
    adminLogger.info('Admin resolve conflict request', {
      adminUserId: req.user?.id,
      conflictId: req.params.conflictId,
      resolution: req.body.resolution
    });
    adminCartWishlistController.adminResolveConflict(req, res);
  });
});

/**
 * GET /api/v1/admin/cart-wishlist/analytics/system
 * Get combined analytics (admin only)
 */
router.get('/admin/cart-wishlist/analytics/system', [
  query('startDate').optional().isISO8601().withMessage('Invalid start date format'),
  query('endDate').optional().isISO8601().withMessage('Invalid end date format')
], handleValidationErrors, authMiddleware.authenticate(), adminRateLimit, (req, res, next) => {
  // Verify admin role
  adminCartWishlistController.verifyAdmin(req, res, (err) => {
    if (err) return;
    adminLogger.info('Get system analytics request', {
      adminUserId: req.user?.id,
      filters: { startDate: req.query.startDate, endDate: req.query.endDate }
    });
    adminCartWishlistController.getSystemAnalytics(req, res);
  });
});

/**
 * GET /api/v1/admin/cart-wishlist/moves
 * Get move history (admin only)
 */
router.get('/admin/cart-wishlist/moves', [
  query('userId').optional().isUUID().withMessage('Invalid user ID'),
  query('productId').optional().isUUID().withMessage('Invalid product ID'),
  query('moveType').optional().isIn(['cart_to_wishlist', 'wishlist_to_cart']).withMessage('Invalid move type'),
  query('startDate').optional().isISO8601().withMessage('Invalid start date format'),
  query('endDate').optional().isISO8601().withMessage('Invalid end date format'),
  query('page').optional().isInt({ min: 1 }).withMessage('Invalid page number'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Invalid limit')
], handleValidationErrors, authMiddleware.authenticate(), adminRateLimit, (req, res, next) => {
  // Verify admin role
  adminCartWishlistController.verifyAdmin(req, res, (err) => {
    if (err) return;
    adminLogger.info('Get admin move history request', {
      adminUserId: req.user?.id,
      filters: req.query
    });
    adminCartWishlistController.getAdminMoveHistory(req, res);
  });
});

/**
 * GET /api/v1/admin/cart-wishlist/sync/recent
 * Get recent sync operations (admin only)
 */
router.get('/admin/cart-wishlist/sync/recent', [
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Invalid limit')
], handleValidationErrors, authMiddleware.authenticate(), adminRateLimit, (req, res, next) => {
  // Verify admin role
  adminCartWishlistController.verifyAdmin(req, res, (err) => {
    if (err) return;
    adminLogger.info('Get recent syncs request', {
      adminUserId: req.user?.id,
      limit: req.query.limit
    });
    adminCartWishlistController.getRecentSyncs(req, res);
  });
});

/**
 * POST /api/v1/admin/cart-wishlist/conflicts/bulk-resolve
 * Bulk resolve conflicts (admin only)
 */
router.post('/admin/cart-wishlist/conflicts/bulk-resolve', [
  body('conflictIds').isArray({ min: 1 }).withMessage('conflictIds must be a non-empty array'),
  body('conflictIds.*').isUUID().withMessage('Invalid conflict ID in array'),
  body('resolution').isIn(['keep_cart', 'keep_wishlist', 'merge']).withMessage('Invalid resolution type')
], handleValidationErrors, authMiddleware.authenticate(), adminRateLimit, (req, res, next) => {
  // Verify admin role
  adminCartWishlistController.verifyAdmin(req, res, (err) => {
    if (err) return;
    adminLogger.info('Bulk resolve conflicts request', {
      adminUserId: req.user?.id,
      conflictIds: req.body.conflictIds,
      resolution: req.body.resolution
    });
    adminCartWishlistController.bulkResolveConflicts(req, res);
  });
});

/**
 * GET /api/v1/admin/cart-wishlist/analytics/behavior
 * Get behavior analytics (admin only)
 */
router.get('/admin/cart-wishlist/analytics/behavior', [
  query('startDate').optional().isISO8601().withMessage('Invalid start date format'),
  query('endDate').optional().isISO8601().withMessage('Invalid end date format')
], handleValidationErrors, authMiddleware.authenticate(), adminRateLimit, (req, res, next) => {
  // Verify admin role
  adminCartWishlistController.verifyAdmin(req, res, (err) => {
    if (err) return;
    adminLogger.info('Get behavior analytics request', {
      adminUserId: req.user?.id,
      filters: { startDate: req.query.startDate, endDate: req.query.endDate }
    });
    adminCartWishlistController.getBehaviorAnalytics(req, res);
  });
});

/**
 * GET /api/v1/admin/cart-wishlist/analytics/conversion
 * Get conversion analytics (admin only)
 */
router.get('/admin/cart-wishlist/analytics/conversion', [
  query('startDate').optional().isISO8601().withMessage('Invalid start date format'),
  query('endDate').optional().isISO8601().withMessage('Invalid end date format')
], handleValidationErrors, authMiddleware.authenticate(), adminRateLimit, (req, res, next) => {
  // Verify admin role
  adminCartWishlistController.verifyAdmin(req, res, (err) => {
    if (err) return;
    adminLogger.info('Get conversion analytics request', {
      adminUserId: req.user?.id,
      filters: { startDate: req.query.startDate, endDate: req.query.endDate }
    });
    adminCartWishlistController.getConversionAnalytics(req, res);
  });
});

/**
 * GET /api/v1/admin/cart-wishlist/analytics/abandonment
 * Get abandonment analytics (admin only)
 */
router.get('/admin/cart-wishlist/analytics/abandonment', [
  query('startDate').optional().isISO8601().withMessage('Invalid start date format'),
  query('endDate').optional().isISO8601().withMessage('Invalid end date format')
], handleValidationErrors, authMiddleware.authenticate(), adminRateLimit, (req, res, next) => {
  // Verify admin role
  adminCartWishlistController.verifyAdmin(req, res, (err) => {
    if (err) return;
    adminLogger.info('Get abandonment analytics request', {
      adminUserId: req.user?.id,
      filters: { startDate: req.query.startDate, endDate: req.query.endDate }
    });
    adminCartWishlistController.getAbandonmentAnalytics(req, res);
  });
});

/**
 * GET /api/v1/admin/cart-wishlist/analytics/performance
 * Get performance metrics (admin only)
 */
router.get('/admin/cart-wishlist/analytics/performance', [
  query('startDate').optional().isISO8601().withMessage('Invalid start date format'),
  query('endDate').optional().isISO8601().withMessage('Invalid end date format')
], handleValidationErrors, authMiddleware.authenticate(), adminRateLimit, (req, res, next) => {
  // Verify admin role
  adminCartWishlistController.verifyAdmin(req, res, (err) => {
    if (err) return;
    adminLogger.info('Get performance metrics request', {
      adminUserId: req.user?.id,
      filters: { startDate: req.query.startDate, endDate: req.query.endDate }
    });
    adminCartWishlistController.getPerformanceMetrics(req, res);
  });
});

/**
 * POST /api/v1/admin/cart-wishlist/analytics/report
 * Generate report (admin only)
 */
router.post('/admin/cart-wishlist/analytics/report', [
  body('type').isIn(['json', 'csv']).withMessage('Invalid report type'),
  body('startDate').optional().isISO8601().withMessage('Invalid start date format'),
  body('endDate').optional().isISO8601().withMessage('Invalid end date format')
], handleValidationErrors, authMiddleware.authenticate(), adminRateLimit, (req, res, next) => {
  // Verify admin role
  adminCartWishlistController.verifyAdmin(req, res, (err) => {
    if (err) return;
    adminLogger.info('Generate report request', {
      adminUserId: req.user?.id,
      type: req.body.type,
      filters: { startDate: req.body.startDate, endDate: req.body.endDate }
    });
    adminCartWishlistController.generateReport(req, res);
  });
});

/**
 * GET /api/v1/admin/cart-wishlist/users/:userId/behavior
 * Get user behavior data (admin only)
 */
router.get('/admin/cart-wishlist/users/:userId/behavior', [
  param('userId').isUUID().withMessage('Invalid user ID'),
  query('startDate').optional().isISO8601().withMessage('Invalid start date format'),
  query('endDate').optional().isISO8601().withMessage('Invalid end date format')
], handleValidationErrors, authMiddleware.authenticate(), adminRateLimit, (req, res, next) => {
  // Verify admin role
  adminCartWishlistController.verifyAdmin(req, res, (err) => {
    if (err) return;
    adminLogger.info('Get user behavior data request', {
      adminUserId: req.user?.id,
      userId: req.params.userId,
      filters: { startDate: req.query.startDate, endDate: req.query.endDate }
    });
    adminCartWishlistController.getUserBehaviorData(req, res);
  });
});

/**
 * GET /api/v1/admin/cart-wishlist/users/search
 * Search users (admin only)
 */
router.get('/admin/cart-wishlist/users/search', [
  query('q').notEmpty().withMessage('Search query is required')
], handleValidationErrors, authMiddleware.authenticate(), adminRateLimit, (req, res, next) => {
  // Verify admin role
  adminCartWishlistController.verifyAdmin(req, res, (err) => {
    if (err) return;
    adminLogger.info('Search users request', {
      adminUserId: req.user?.id,
      query: req.query.q
    });
    adminCartWishlistController.searchUsers(req, res);
  });
});

module.exports = router;
