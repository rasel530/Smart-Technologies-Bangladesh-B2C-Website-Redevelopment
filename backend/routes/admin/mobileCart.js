const express = require('express');
const { body, param, query, validationResult } = require('express-validator');
const { authMiddleware } = require('../../middleware/auth');
const { mobileCartService } = require('../../services/mobileCartService');

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

// ==================== MOBILE CART ROUTES ====================

/**
 * POST /api/v1/admin/mobile/offline-change - Record offline cart change
 * Permission: auth required
 */
router.post('/offline-change', [
  body('deviceId').notEmpty().withMessage('Device ID is required'),
  body('action').isIn(['add', 'update', 'remove', 'clear']).withMessage('Invalid action')
], handleValidationErrors, authMiddleware.authenticate(), async (req, res) => {
  try {
    const result = await mobileCartService.recordOfflineChange(req.body);
    res.json({
      success: true,
      message: 'Offline change recorded',
      messageBn: 'অফলাইন পরিবর্তন রেকর্ড হয়েছে',
      data: result
    });
  } catch (error) {
    console.error('Error recording offline change:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to record offline change',
      message: 'Failed to record offline change',
      messageBn: 'অফলাইন পরিবর্তন রেকর্ড হয়েছে',
      error: error.message
    });
  }
});

/**
 * POST /api/v1/admin/mobile/sync - Sync offline changes
 * Permission: auth required
 */
router.post('/sync', [
  body('deviceId').notEmpty().withMessage('Device ID is required')
], handleValidationErrors, authMiddleware.authenticate(), async (req, res) => {
  const userId = req.user?.id || null;
  const sessionId = req.headers['x-session-id'] || null;
  const { deviceId } = req.body;
  const result = await mobileCartService.syncOfflineChanges(userId, sessionId, deviceId);
  res.json({
    success: true,
    message: 'Offline changes synced',
    messageBn: 'অফলাইন পরিবর্তন রেকর্ড হয়েছে',
    data: result
  });
});

/**
 * GET /api/v1/admin/mobile/pending-changes - Get pending offline changes
 * Permission: auth required
 */
router.get('/pending-changes', [
  query('deviceId').optional().isString().withMessage('Invalid device ID')
], handleValidationErrors, authMiddleware.authenticate(), async (req, res) => {
  const userId = req.user?.id || null;
  const sessionId = req.headers['x-session-id'] || null;
  const deviceId = req.query.deviceId || null;
  const changes = await mobileCartService.getPendingChanges(userId, sessionId, deviceId);
  res.json({
    success: true,
    message: 'Pending changes retrieved',
    messageBn: 'মুলতুবি পরিবর্তন রেকর্ড হয়েছে',
    data: changes,
    count: changes.length
  });
});

/**
 * POST /api/v1/admin/mobile/analytics - Record mobile analytics
 * Permission: auth required
 */
router.post('/analytics', [
  body('deviceId').notEmpty().withMessage('Device ID is required'),
  body('platform').isIn(['mobile', 'desktop', 'tablet']).withMessage('Invalid platform'),
  body('action').isIn(['view', 'add', 'update', 'remove', 'checkout', 'abandon']).withMessage('Invalid action')
], handleValidationErrors, authMiddleware.authenticate(), async (req, res) => {
  const result = await mobileCartService.recordMobileAnalytics(req.body);
  res.json({
    success: true,
    message: 'Mobile analytics recorded',
    messageBn: 'মোবাইল অ্যালানিটিক্স রেকর্ড হয়েছে',
    data: result
  });
});

/**
 * GET /api/v1/admin/mobile/analytics - Get mobile analytics with filters
 * Permission: auth required
 */
router.get('/analytics', [
  query('platform').optional().isIn(['mobile', 'desktop', 'tablet']),
  query('action').optional().isIn(['view', 'add', 'update', 'remove', 'checkout', 'abandon']),
], handleValidationErrors, authMiddleware.authenticate(), async (req, res) => {
  const filters = {
    userId: req.user.id,
    platform: req.query.platform,
    action: req.query.action,
    startDate: req.query.startDate,
    endDate: req.query.endDate,
    limit: req.query.limit ? parseInt(req.query.limit) : 100
  };
  const analytics = await mobileCartService.getMobileAnalytics(filters);
  res.json({
    success: true,
    message: 'Mobile analytics retrieved',
    messageBn: 'মোবাইল অ্যালানিটিক্স রেকর্ড হয়েছে',
    data: analytics,
    count: analytics.length
  });
});

/**
 * GET /api/v1/admin/mobile/performance - Get mobile performance metrics
 * Permission: auth required
 */
router.get('/performance', [
], handleValidationErrors, authMiddleware.authenticate(), async (req, res) => {
  const metrics = await mobileCartService.getMobilePerformanceMetrics();
  res.json({
    success: true,
    message: 'Mobile performance metrics retrieved',
    messageBn: 'মোবাইল অ্যালানিটিক্স রেকর্ড হয়েছে',
    data: metrics
  });
});

/**
 * GET /api/v1/admin/mobile/optimized-cart/:cartId - Get optimized cart for mobile
 * Permission: auth optional
 */
router.get('/optimized-cart/:cartId', [
  param('cartId').isUUID().withMessage('Invalid cart ID')
], handleValidationErrors, authMiddleware.optional(), async (req, res) => {
  const { cartId } = req.params.cartId;
  const cart = await mobileCartService.optimizeCartForMobile(cartId);
  res.json({
    success: true,
    message: 'Optimized cart retrieved',
    messageBn: 'অপ্টিমালিটিক্স রেকর্ড হয়েছে',
    data: cart
  });
});

/**
 * POST /api/v1/admin/mobile/device-info - Record device info
 * Permission: auth optional
 */
router.post('/device-info', [
  body('deviceId').notEmpty().withMessage('Device ID is required'),
  body('platform').isIn(['mobile', 'desktop', 'tablet']).withMessage('Invalid platform'),
  body('deviceType').optional().isString(),
  body('browser').optional().isString(),
  body('networkType').optional().isString(),
  body('networkSpeed').optional().isString(),
  body('screenResolution').optional().isString()
], handleValidationErrors, authMiddleware.optional(), async (req, res) => {
  const result = await mobileCartService.recordDeviceInfo(req.body);
  res.json({
    success: true,
    message: 'Device info recorded',
    messageBn: 'ডিভাইস তথ্য রেকর্ড হয়েছে',
    data: result
  });
});

/**
 * GET /api/v1/admin/mobile/analytics/export - Export analytics data
 * Permission: auth required
 */
router.get('/analytics/export', [
], handleValidationErrors, authMiddleware.authenticate(), async (req, res) => {
  try {
    const filters = {
      userId: req.user.id,
      startDate: req.query.startDate,
      endDate: req.query.endDate
    };
    const analytics = await mobileCartService.getMobileAnalytics(filters);
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', 'attachment; filename=mobile-analytics-export.json');
    res.send(JSON.stringify(analytics, null, 2));
  } catch (error) {
    console.error('Error exporting analytics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to export analytics',
      message: 'Failed to export analytics',
      messageBn: 'অ্যালানিটিক্স রেকর্ড হয়েছে',
      error: error.message
    });
  }
});

module.exports = router;
