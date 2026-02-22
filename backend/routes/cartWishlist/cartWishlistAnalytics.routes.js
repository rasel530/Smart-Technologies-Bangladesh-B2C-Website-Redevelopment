const express = require('express');
const { query, validationResult } = require('express-validator');
const { authMiddleware } = require('../../middleware/auth');
const { rateLimitService } = require('../../services/rateLimitService');
const { cartWishlistAnalyticsController } = require('../../controllers/cartWishlist/cartWishlistAnalytics.controller');
const { loggerService } = require('../../services/logger');

const router = express.Router();

// Logger for cart-wishlist analytics routes
const analyticsLogger = {
  info: (message, data) => loggerService.info(message, data),
  warn: (message, data) => loggerService.warn(message, data),
  error: (message, data) => loggerService.error(message, data)
};

// Rate limiting configuration
const analyticsRateLimitConfig = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 100, // 100 requests per window
  message: 'Too many analytics requests. Please try again later.',
  messageBn: 'অনেক বিশ্লেষণ অনুরোধ। অনুগ্রহ করে পুনরায় চেষ্টা করুন।',
  skipSuccessfulRequests: false
};

const analyticsRateLimit = rateLimitService.createRateLimit(analyticsRateLimitConfig);

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
// User Behavior Analytics Endpoints
// ============================================================================

/**
 * GET /api/v1/cart-wishlist/analytics/behavior
 * Get user behavior analytics
 */
router.get('/cart-wishlist/analytics/behavior', [
  query('startDate').optional().isISO8601().withMessage('Invalid start date format'),
  query('endDate').optional().isISO8601().withMessage('Invalid end date format'),
  query('userId').optional().isUUID().withMessage('Invalid user ID')
], handleValidationErrors, authMiddleware.authenticate(), analyticsRateLimit, (req, res) => {
  analyticsLogger.info('Get behavior analytics request', {
    userId: req.user?.id,
    targetUserId: req.query.userId,
    filters: { startDate: req.query.startDate, endDate: req.query.endDate }
  });
  cartWishlistAnalyticsController.getBehaviorAnalytics(req, res);
});

/**
 * GET /api/v1/cart-wishlist/analytics/conversion
 * Get conversion funnel analytics
 */
router.get('/cart-wishlist/analytics/conversion', [
  query('startDate').optional().isISO8601().withMessage('Invalid start date format'),
  query('endDate').optional().isISO8601().withMessage('Invalid end date format')
], handleValidationErrors, authMiddleware.authenticate(), analyticsRateLimit, (req, res) => {
  analyticsLogger.info('Get conversion analytics request', {
    userId: req.user?.id,
    filters: { startDate: req.query.startDate, endDate: req.query.endDate }
  });
  cartWishlistAnalyticsController.getConversionAnalytics(req, res);
});

/**
 * GET /api/v1/cart-wishlist/analytics/abandonment
 * Get cart abandonment analytics
 */
router.get('/cart-wishlist/analytics/abandonment', [
  query('startDate').optional().isISO8601().withMessage('Invalid start date format'),
  query('endDate').optional().isISO8601().withMessage('Invalid end date format')
], handleValidationErrors, authMiddleware.authenticate(), analyticsRateLimit, (req, res) => {
  analyticsLogger.info('Get abandonment analytics request', {
    userId: req.user?.id,
    filters: { startDate: req.query.startDate, endDate: req.query.endDate }
  });
  cartWishlistAnalyticsController.getAbandonmentAnalytics(req, res);
});

/**
 * GET /api/v1/cart-wishlist/analytics/performance
 * Get performance metrics
 */
router.get('/cart-wishlist/analytics/performance', [
  query('startDate').optional().isISO8601().withMessage('Invalid start date format'),
  query('endDate').optional().isISO8601().withMessage('Invalid end date format')
], handleValidationErrors, authMiddleware.authenticate(), analyticsRateLimit, (req, res) => {
  analyticsLogger.info('Get performance metrics request', {
    userId: req.user?.id,
    filters: { startDate: req.query.startDate, endDate: req.query.endDate }
  });
  cartWishlistAnalyticsController.getPerformanceMetrics(req, res);
});

/**
 * GET /api/v1/cart-wishlist/reports
 * Generate comprehensive report
 */
router.get('/cart-wishlist/reports', [
  query('format').optional().isIn(['json', 'csv']).withMessage('Invalid format. Must be json or csv'),
  query('startDate').optional().isISO8601().withMessage('Invalid start date format'),
  query('endDate').optional().isISO8601().withMessage('Invalid end date format')
], handleValidationErrors, authMiddleware.authenticate(), analyticsRateLimit, (req, res) => {
  analyticsLogger.info('Generate report request', {
    userId: req.user?.id,
    format: req.query.format,
    filters: { startDate: req.query.startDate, endDate: req.query.endDate }
  });
  cartWishlistAnalyticsController.generateReport(req, res);
});

module.exports = router;
