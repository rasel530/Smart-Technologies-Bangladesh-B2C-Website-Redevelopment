const express = require('express');
const { body, param, validationResult } = require('express-validator');
const { authMiddleware } = require('../middleware/auth');
const { rateLimitService } = require('../services/rateLimitService');
const { mobileCartService } = require('../services/mobileCartService');
const { loggerService } = require('../services/logger');

// Logger for mobile cart routes
const mobileCartLogger = {
  info: (message, data) => loggerService.info(message, data),
  warn: (message, data) => loggerService.warn(message, data),
  error: (message, data) => loggerService.error(message, data)
};

const router = express.Router();

// Rate limiting configuration for mobile cart endpoints
const mobileCartRateLimitConfig = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 200, // 200 requests per window
  message: 'Too many requests. Please try again later.',
  messageBn: 'অনেক রিকোয়েস্ট অনেক। অনুগ্রহ করে পুনরায় চেষ্টা করুন।',
  skipSuccessfulRequests: false
};

// Create rate limiting middleware
const mobileCartRateLimit = rateLimitService.createRateLimit(mobileCartRateLimitConfig);

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
// Mobile Cart Optimization Routes
// ============================================================================

// POST /api/v1/mobile/offline-change - Record offline cart change
router.post('/offline-change', [
  body('deviceId').isString().notEmpty().withMessage('Device ID is required'),
  body('action').isIn(['add', 'update', 'remove', 'clear']).withMessage('Invalid action'),
  body('productId').optional().isUUID().withMessage('Invalid product ID'),
  body('variantId').optional().isUUID().withMessage('Invalid variant ID'),
  body('quantity').optional().isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
  body('previousValue').optional(),
  body('newValue').optional()
], handleValidationErrors, authMiddleware.optional(), mobileCartRateLimit, async (req, res) => {
  try {
    const userId = req.user?.id || null;
    const sessionId = req.headers['x-session-id'] || null;
    const changeData = {
      ...req.body,
      userId,
      sessionId
    };

    const offlineChange = await mobileCartService.recordOfflineChange(changeData);

    res.json({
      success: true,
      message: 'Offline change recorded',
      messageBn: 'অফলাইন পরিবর্তন রেকর্ড করা হয়েছে',
      data: offlineChange
    });
  } catch (error) {
    mobileCartLogger.error('Error recording offline change', {
      error: error.message
    });
    res.status(500).json({
      success: false,
      error: 'Failed to record offline change',
      message: 'Failed to record offline change',
      messageBn: 'অফলাইন পরিবর্তন রেকর্ড করতে ব্যর্থ হয়েছে'
    });
  }
});

// POST /api/v1/mobile/sync - Sync offline changes
router.post('/sync', [
  body('deviceId').isString().notEmpty().withMessage('Device ID is required')
], handleValidationErrors, authMiddleware.optional(), mobileCartRateLimit, async (req, res) => {
  try {
    const userId = req.user?.id || null;
    const sessionId = req.headers['x-session-id'] || null;
    const { deviceId } = req.body;

    const result = await mobileCartService.syncOfflineChanges(userId, sessionId, deviceId);

    res.json({
      success: true,
      message: 'Offline changes synced',
      messageBn: 'অফলাইন পরিবর্তন সিঙ্ক করা হয়েছে',
      data: result
    });
  } catch (error) {
    mobileCartLogger.error('Error syncing offline changes', {
      error: error.message
    });
    res.status(500).json({
      success: false,
      error: 'Failed to sync offline changes',
      message: 'Failed to sync offline changes',
      messageBn: 'অফলাইন পরিবর্তন সিঙ্ক করতে ব্যর্থ হয়েছে'
    });
  }
});

// GET /api/v1/mobile/pending-changes - Get pending offline changes
router.get('/pending-changes', [
  param('deviceId').optional().isString().withMessage('Invalid device ID')
], handleValidationErrors, authMiddleware.optional(), mobileCartRateLimit, async (req, res) => {
  try {
    const userId = req.user?.id || null;
    const sessionId = req.headers['x-session-id'] || null;
    const deviceId = req.query.deviceId || null;

    const pendingChanges = await mobileCartService.getPendingChanges(userId, sessionId, deviceId);

    res.json({
      success: true,
      message: 'Pending changes retrieved',
      messageBn: 'মুলতুবি পরিবর্তন পুনরুদ্ধার করা হয়েছে',
      data: pendingChanges,
      count: pendingChanges.length
    });
  } catch (error) {
    mobileCartLogger.error('Error getting pending changes', {
      error: error.message
    });
    res.status(500).json({
      success: false,
      error: 'Failed to get pending changes',
      message: 'Failed to get pending changes',
      messageBn: 'মুলতুবি পরিবর্তন পেতে ব্যর্থ হয়েছে'
    });
  }
});

// POST /api/v1/mobile/analytics - Record mobile analytics
router.post('/analytics', [
  body('deviceId').isString().notEmpty().withMessage('Device ID is required'),
  body('platform').isIn(['mobile', 'desktop', 'tablet']).withMessage('Invalid platform'),
  body('action').isIn(['view', 'add', 'update', 'remove', 'checkout', 'abandon']).withMessage('Invalid action'),
  body('deviceType').optional().isString(),
  body('browser').optional().isString(),
  body('networkType').optional().isString(),
  body('networkSpeed').optional().isString(),
  body('screenResolution').optional().isString(),
  body('cartId').optional().isUUID().withMessage('Invalid cart ID'),
  body('productId').optional().isUUID().withMessage('Invalid product ID'),
  body('paymentMethod').optional().isString(),
  body('emiPlanId').optional().isUUID().withMessage('Invalid EMI plan ID'),
  body('duration').optional().isInt({ min: 0 }).withMessage('Duration must be a positive integer'),
  body('pageCount').optional().isInt({ min: 0 }).withMessage('Page count must be a positive integer'),
  body('touchCount').optional().isInt({ min: 0 }).withMessage('Touch count must be a positive integer'),
  body('scrollDepth').optional().isInt({ min: 0, max: 100 }).withMessage('Scroll depth must be between 0 and 100'),
  body('metadata').optional()
], handleValidationErrors, authMiddleware.optional(), mobileCartRateLimit, async (req, res) => {
  try {
    const userId = req.user?.id || null;
    const sessionId = req.headers['x-session-id'] || null;
    const analyticsData = {
      ...req.body,
      userId,
      sessionId
    };

    const analytics = await mobileCartService.recordMobileAnalytics(analyticsData);

    res.json({
      success: true,
      message: 'Mobile analytics recorded',
      messageBn: 'মোবাইল অ্যানালিটিক্স রেকর্ড করা হয়েছে',
      data: analytics
    });
  } catch (error) {
    mobileCartLogger.error('Error recording mobile analytics', {
      error: error.message
    });
    res.status(500).json({
      success: false,
      error: 'Failed to record mobile analytics',
      message: 'Failed to record mobile analytics',
      messageBn: 'মোবাইল অ্যানালিটিক্স রেকর্ড করতে ব্যর্থ হয়েছে'
    });
  }
});

// GET /api/v1/mobile/analytics - Get mobile analytics with filters
router.get('/analytics', [
  // Query params are validated in the handler
], handleValidationErrors, authMiddleware.authenticate(), mobileCartRateLimit, async (req, res) => {
  try {
    const filters = {
      userId: req.user.id,
      sessionId: req.query.sessionId,
      deviceId: req.query.deviceId,
      platform: req.query.platform,
      action: req.query.action,
      startDate: req.query.startDate,
      endDate: req.query.endDate,
      limit: parseInt(req.query.limit) || 100
    };

    const analytics = await mobileCartService.getMobileAnalytics(filters);

    res.json({
      success: true,
      message: 'Mobile analytics retrieved',
      messageBn: 'মোবাইল অ্যানালিটিক্স পুনরুদ্ধার করা হয়েছে',
      data: analytics,
      count: analytics.length
    });
  } catch (error) {
    mobileCartLogger.error('Error getting mobile analytics', {
      error: error.message
    });
    res.status(500).json({
      success: false,
      error: 'Failed to get mobile analytics',
      message: 'Failed to get mobile analytics',
      messageBn: 'মোবাইল অ্যানালিটিক্স পেতে ব্যর্থ হয়েছে'
    });
  }
});

// GET /api/v1/mobile/performance - Get mobile performance metrics
router.get('/performance', [], handleValidationErrors, authMiddleware.authenticate(), mobileCartRateLimit, async (req, res) => {
  try {
    const metrics = await mobileCartService.getMobilePerformanceMetrics();

    res.json({
      success: true,
      message: 'Mobile performance metrics retrieved',
      messageBn: 'মোবাইল পারফরম্যান্স মেট্রিক্স পুনরুদ্ধার করা হয়েছে',
      data: metrics
    });
  } catch (error) {
    mobileCartLogger.error('Error getting mobile performance metrics', {
      error: error.message
    });
    res.status(500).json({
      success: false,
      error: 'Failed to get mobile performance metrics',
      message: 'Failed to get mobile performance metrics',
      messageBn: 'মোবাইল পারফরম্যান্স মেট্রিক্স পেতে ব্যর্থ হয়েছে'
    });
  }
});

// GET /api/v1/mobile/optimized-cart/:cartId - Get optimized cart for mobile
router.get('/optimized-cart/:cartId', [
  param('cartId').isUUID().withMessage('Invalid cart ID')
], handleValidationErrors, authMiddleware.optional(), mobileCartRateLimit, async (req, res) => {
  try {
    const { cartId } = req.params;

    // Import cartService to get cart data
    const { cartService } = require('../services/cartService');
    const cartData = await cartService.getCartById(cartId);

    if (!cartData) {
      return res.status(404).json({
        success: false,
        error: 'Cart not found',
        message: 'Cart not found',
        messageBn: 'কার্ট পাওয়া যায়নি'
      });
    }

    const optimizedCart = await mobileCartService.optimizeCartForMobile(cartData);

    res.json({
      success: true,
      message: 'Optimized cart retrieved',
      messageBn: 'অপ্টিমাইজড কার্ট পুনরুদ্ধার করা হয়েছে',
      data: optimizedCart
    });
  } catch (error) {
    mobileCartLogger.error('Error getting optimized cart', {
      error: error.message
    });
    res.status(500).json({
      success: false,
      error: 'Failed to get optimized cart',
      message: 'Failed to get optimized cart',
      messageBn: 'অপ্টিমাইজড কার্ট পেতে ব্যর্থ হয়েছে'
    });
  }
});

// POST /api/v1/mobile/device-info - Record device info
router.post('/device-info', [
  body('deviceId').isString().notEmpty().withMessage('Device ID is required'),
  body('platform').isIn(['mobile', 'desktop', 'tablet']).withMessage('Invalid platform'),
  body('deviceType').optional().isString(),
  body('browser').optional().isString(),
  body('networkType').optional().isString(),
  body('networkSpeed').optional().isString(),
  body('screenResolution').optional().isString()
], handleValidationErrors, authMiddleware.optional(), mobileCartRateLimit, async (req, res) => {
  try {
    const userId = req.user?.id || null;
    const sessionId = req.headers['x-session-id'] || null;
    const deviceInfo = {
      ...req.body,
      userId,
      sessionId
    };

    const result = await mobileCartService.recordDeviceInfo(deviceInfo);

    res.json({
      success: true,
      message: 'Device info recorded',
      messageBn: 'ডিভাইস তথ্য রেকর্ড করা হয়েছে',
      data: result
    });
  } catch (error) {
    mobileCartLogger.error('Error recording device info', {
      error: error.message
    });
    res.status(500).json({
      success: false,
      error: 'Failed to record device info',
      message: 'Failed to record device info',
      messageBn: 'ডিভাইস তথ্য রেকর্ড করতে ব্যর্থ হয়েছে'
    });
  }
});

module.exports = router;
