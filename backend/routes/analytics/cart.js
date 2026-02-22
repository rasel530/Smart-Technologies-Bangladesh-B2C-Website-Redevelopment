const express = require('express');
const { body, query, validationResult } = require('express-validator');
const cartAnalyticsService = require('../../services/cartAnalyticsService');
const { authMiddleware } = require('../../middleware/auth');
const { rbacAuthMiddleware } = require('../../middleware/rbacAuth');

const router = express.Router();

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

/**
 * @route GET /api/v1/analytics/cart/events
 * @desc Get cart events with filters
 * @access Private (Admin only)
 */
router.get('/events', [
  query('cartId').optional().isUUID().withMessage('Invalid cart ID'),
  query('userId').optional().isUUID().withMessage('Invalid user ID'),
  query('eventType').optional().isIn(['add', 'remove', 'update', 'view', 'checkout_initiated', 'checkout_completed']).withMessage('Invalid event type'),
  query('startDate').optional().isISO8601().withMessage('Invalid start date format'),
  query('endDate').optional().isISO8601().withMessage('Invalid end date format'),
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100')
], handleValidationErrors, authMiddleware.authenticate(), rbacAuthMiddleware.requirePermission('cart:analytics'), async (req, res) => {
  try {
    const filters = {
      cartId: req.query.cartId,
      userId: req.query.userId,
      eventType: req.query.eventType,
      startDate: req.query.startDate,
      endDate: req.query.endDate,
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 50
    };

    const result = await cartAnalyticsService.getCartEvents(filters);

    res.json({
      success: true,
      message: 'Cart events retrieved successfully',
      messageBn: 'কার্ট ইভেন্ট সফলভাবে পাওয়া গেছে',
      data: result
    });
  } catch (error) {
    console.error('Error getting cart events:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get cart events',
      message: 'Failed to get cart events',
      messageBn: 'কার্ট ইভেন্ট পেতে ব্যর্থ হয়েছে'
    });
  }
});

/**
 * @route GET /api/v1/analytics/cart/abandonment
 * @desc Get cart abandonment metrics
 * @access Private (Admin only)
 */
router.get('/abandonment', [
  query('startDate').optional().isISO8601().withMessage('Invalid start date format'),
  query('endDate').optional().isISO8601().withMessage('Invalid end date format')
], handleValidationErrors, authMiddleware.authenticate(), rbacAuthMiddleware.requirePermission('cart:analytics'), async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const result = await cartAnalyticsService.getCartAbandonmentRate(
      startDate ? new Date(startDate) : null,
      endDate ? new Date(endDate) : null
    );

    res.json({
      success: true,
      message: 'Abandonment metrics retrieved successfully',
      messageBn: 'অ্যান্ডোনমেন্ট মেট্রিক্স সফলভাবে পাওয়া গেছে',
      data: result
    });
  } catch (error) {
    console.error('Error getting abandonment metrics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get abandonment metrics',
      message: 'Failed to get abandonment metrics',
      messageBn: 'অ্যান্ডোনমেন্ট মেট্রিক্স পেতে ব্যর্থ হয়েছে'
    });
  }
});

/**
 * @route GET /api/v1/analytics/cart/conversion-funnel
 * @desc Get conversion funnel data
 * @access Private (Admin only)
 */
router.get('/conversion-funnel', [
  query('startDate').optional().isISO8601().withMessage('Invalid start date format'),
  query('endDate').optional().isISO8601().withMessage('Invalid end date format')
], handleValidationErrors, authMiddleware.authenticate(), rbacAuthMiddleware.requirePermission('cart:analytics'), async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const result = await cartAnalyticsService.getConversionFunnel(
      startDate ? new Date(startDate) : null,
      endDate ? new Date(endDate) : null
    );

    res.json({
      success: true,
      message: 'Conversion funnel data retrieved successfully',
      messageBn: 'কনভার্সন ফানেল ডেটা সফলভাবে পাওয়া গেছে',
      data: result
    });
  } catch (error) {
    console.error('Error getting conversion funnel:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get conversion funnel data',
      message: 'Failed to get conversion funnel data',
      messageBn: 'কনভার্সন ফানেল ডেটা পেতে ব্যর্থ হয়েছে'
    });
  }
});

/**
 * @route GET /api/v1/analytics/cart/average-value
 * @desc Get average cart value (AOV) stats
 * @access Private (Admin only)
 */
router.get('/average-value', [
  query('startDate').optional().isISO8601().withMessage('Invalid start date format'),
  query('endDate').optional().isISO8601().withMessage('Invalid end date format')
], handleValidationErrors, authMiddleware.authenticate(), rbacAuthMiddleware.requirePermission('cart:analytics'), async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const result = await cartAnalyticsService.getAverageCartValue(
      startDate ? new Date(startDate) : null,
      endDate ? new Date(endDate) : null
    );

    res.json({
      success: true,
      message: 'Average cart value retrieved successfully',
      messageBn: 'গড় কার্ট মান সফলভাবে পাওয়া গেছে',
      data: result
    });
  } catch (error) {
    console.error('Error getting average cart value:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get average cart value',
      message: 'Failed to get average cart value',
      messageBn: 'গড় কার্ট মান পেতে ব্যর্থ হয়েছে'
    });
  }
});

/**
 * @route GET /api/v1/analytics/cart/popular-products
 * @desc Get popular products in carts
 * @access Private (Admin only)
 */
router.get('/popular-products', [
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('startDate').optional().isISO8601().withMessage('Invalid start date format'),
  query('endDate').optional().isISO8601().withMessage('Invalid end date format')
], handleValidationErrors, authMiddleware.authenticate(), rbacAuthMiddleware.requirePermission('cart:analytics'), async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const { startDate, endDate } = req.query;
    const result = await cartAnalyticsService.getPopularProductsInCarts(
      limit,
      startDate ? new Date(startDate) : null,
      endDate ? new Date(endDate) : null
    );

    res.json({
      success: true,
      message: 'Popular products retrieved successfully',
      messageBn: 'জনপ্রিয় পণ্যগুলি সফলভাবে পাওয়া গেছে',
      data: result
    });
  } catch (error) {
    console.error('Error getting popular products:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get popular products',
      message: 'Failed to get popular products',
      messageBn: 'জনপ্রিয় পণ্যগুলি পেতে ব্যর্থ হয়েছে'
    });
  }
});

/**
 * @route GET /api/v1/analytics/cart/recommendations
 * @desc Get optimization recommendations
 * @access Private (Admin only)
 */
router.get('/recommendations', authMiddleware.authenticate(), rbacAuthMiddleware.requirePermission('cart:analytics'), async (req, res) => {
  try {
    const result = await cartAnalyticsService.generateOptimizationRecommendations();

    res.json({
      success: true,
      message: 'Optimization recommendations retrieved successfully',
      messageBn: 'অপ্টিমাইজেশন সুপারিশ সফলভাবে পাওয়া গেছে',
      data: result
    });
  } catch (error) {
    console.error('Error getting optimization recommendations:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get optimization recommendations',
      message: 'Failed to get optimization recommendations',
      messageBn: 'অপ্টিমাইজেশন সুপারিশ পেতে ব্যর্থ হয়েছে'
    });
  }
});

/**
 * @route GET /api/v1/analytics/cart/trends
 * @desc Get trend data over time
 * @access Private (Admin only)
 */
router.get('/trends', [
  query('days').optional().isInt({ min: 1, max: 365 }).withMessage('Days must be between 1 and 365')
], handleValidationErrors, authMiddleware.authenticate(), rbacAuthMiddleware.requirePermission('cart:analytics'), async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 30;
    const result = await cartAnalyticsService.getTrends(days);

    res.json({
      success: true,
      message: 'Trend data retrieved successfully',
      messageBn: 'ট্রেন্ড ডেটা সফলভাবে পাওয়া গেছে',
      data: result
    });
  } catch (error) {
    console.error('Error getting trend data:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get trend data',
      message: 'Failed to get trend data',
      messageBn: 'ট্রেন্ড ডেটা পেতে ব্যর্থ হয়েছে'
    });
  }
});

/**
 * @route GET /api/v1/analytics/cart/realtime
 * @desc Get real-time analytics
 * @access Private (Admin only)
 */
router.get('/realtime', authMiddleware.authenticate(), rbacAuthMiddleware.requirePermission('cart:analytics'), async (req, res) => {
  try {
    const result = await cartAnalyticsService.getRealtimeAnalytics();

    res.json({
      success: true,
      message: 'Realtime analytics retrieved successfully',
      messageBn: 'রিয়েলটাইম অ্যানালিটিক্স সফলভাবে পাওয়া গেছে',
      data: result
    });
  } catch (error) {
    console.error('Error getting realtime analytics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get realtime analytics',
      message: 'Failed to get realtime analytics',
      messageBn: 'রিয়েলটাইম অ্যানালিটিক্স পেতে ব্যর্থ হয়েছে'
    });
  }
});

/**
 * @route GET /api/v1/analytics/cart/dashboard
 * @desc Get full dashboard data
 * @access Private (Admin only)
 */
router.get('/dashboard', authMiddleware.authenticate(), rbacAuthMiddleware.requirePermission('cart:analytics'), async (req, res) => {
  try {
    const result = await cartAnalyticsService.getDashboardData();

    res.json({
      success: true,
      message: 'Dashboard data retrieved successfully',
      messageBn: 'ড্যাশবোর্ড ডেটা সফলভাবে পাওয়া গেছে',
      data: result
    });
  } catch (error) {
    console.error('Error getting dashboard data:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get dashboard data',
      message: 'Failed to get dashboard data',
      messageBn: 'ড্যাশবোর্ড ডেটা পেতে ব্যর্থ হয়েছে'
    });
  }
});

/**
 * @route POST /api/v1/analytics/cart/event
 * @desc Track a cart event (from frontend)
 * @access Public (but validates cart/user if provided)
 */
router.post('/event', [
  body('cartId').isUUID().withMessage('Valid cart ID is required'),
  body('eventType').isIn(['view', 'add', 'remove', 'checkout_initiated']).withMessage('Invalid event type'),
  body('productId').optional().isUUID().withMessage('Invalid product ID'),
  body('quantity').optional().isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
  body('price').optional().isFloat({ min: 0 }).withMessage('Price must be non-negative')
], handleValidationErrors, async (req, res) => {
  try {
    const { cartId, eventType, productId, quantity, price } = req.body;
    const userId = req.user?.id || req.body.userId || null;

    let result;
    switch (eventType) {
      case 'add':
        result = await cartAnalyticsService.trackAddToCart(cartId, userId, productId, quantity, price);
        break;
      case 'remove':
        result = await cartAnalyticsService.trackRemoveFromCart(cartId, userId, productId, quantity);
        break;
      case 'view':
        result = await cartAnalyticsService.trackCartView(cartId, userId);
        break;
      case 'checkout_initiated':
        result = await cartAnalyticsService.trackCheckoutInitiated(cartId, userId);
        break;
      default:
        result = await cartAnalyticsService.trackCartEvent(cartId, userId, eventType, { productId, quantity, price });
    }

    res.json({
      success: true,
      message: 'Event tracked successfully',
      messageBn: 'ইভেন্ট সফলভাবে ট্র্যাক করা হয়েছে',
      data: result
    });
  } catch (error) {
    console.error('Error tracking cart event:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to track event',
      message: 'Failed to track event',
      messageBn: 'ইভেন্ট ট্র্যাক করতে ব্যর্থ হয়েছে'
    });
  }
});

/**
 * @route POST /api/v1/analytics/cart/abandonment-reason
 * @desc Record cart abandonment reason
 * @access Public
 */
router.post('/abandonment-reason', [
  body('cartId').isUUID().withMessage('Valid cart ID is required'),
  body('reason').isString().notEmpty().withMessage('Reason is required')
], handleValidationErrors, async (req, res) => {
  try {
    const { cartId, reason } = req.body;
    await cartAnalyticsService.recordAbandonmentReason(cartId, reason);

    res.json({
      success: true,
      message: 'Abandonment reason recorded successfully',
      messageBn: 'অ্যান্ডোনমেন্ট কারণ সফলভাবে রেকর্ড করা হয়েছে'
    });
  } catch (error) {
    console.error('Error recording abandonment reason:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to record abandonment reason',
      message: 'Failed to record abandonment reason',
      messageBn: 'অ্যান্ডোনমেন্ট কারণ রেকর্ড করতে ব্যর্থ হয়েছে'
    });
  }
});

module.exports = router;
