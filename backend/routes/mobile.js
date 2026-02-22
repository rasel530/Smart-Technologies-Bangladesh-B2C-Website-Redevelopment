const express = require('express');
const { body, param, validationResult } = require('express-validator');
const { authMiddleware } = require('../middleware/auth');
const { rateLimitService } = require('../services/rateLimitService');
const { mobileService } = require('../services/mobileService');
const { loggerService } = require('../services/logger');

// Logger for mobile routes
const mobileLogger = {
  info: (message, data) => loggerService.info(message, data),
  warn: (message, data) => loggerService.warn(message, data),
  error: (message, data) => loggerService.error(message, data)
};

const router = express.Router();

// Rate limiting configuration for mobile endpoints
const mobileRateLimitConfig = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 200, // 200 requests per window
  message: 'Too many requests. Please try again later.',
  messageBn: 'অনেক রিকোয়েস্ট অনেক। অনুগ্রহ করে পুনরায় চেষ্টা করুন।',
  skipSuccessfulRequests: false
};

// Create rate limiting middleware
const mobileRateLimit = rateLimitService.createRateLimit(mobileRateLimitConfig);

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
// Offline Cart Sync Endpoints
// ============================================================================

/**
 * POST /api/v1/mobile/cart/sync-offline
 * Sync offline cart changes to server
 */
router.post('/cart/sync-offline', [
  body('userId').isUUID().withMessage('Invalid user ID'),
  body('offlineCart').isObject().withMessage('Offline cart must be an object'),
  body('offlineCart.items').isArray().withMessage('Items must be an array'),
  body('offlineCart.lastSyncAt').isISO8601().withMessage('Invalid last sync timestamp'),
  body('offlineCart.version').isInt({ min: 1 }).withMessage('Version must be a positive integer'),
  body('conflicts').optional().isArray()
], handleValidationErrors, authMiddleware.authenticate(), mobileRateLimit, async (req, res) => {
  try {
    const { userId, offlineCart, conflicts } = req.body;
    
    // Verify user ID matches authenticated user
    if (userId !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'Forbidden',
        message: 'You can only sync your own cart',
        messageBn: 'আপনি শুধুমাত্র নিজের কার্ট সিঙ্ক করতে পারেন'
      });
    }

    const result = await mobileService.syncOfflineCart(userId, offlineCart, conflicts);

    res.json({
      success: true,
      message: 'Offline cart synced successfully',
      messageBn: 'অফলাইন কার্ট সফলভাবে সিঙ্ক করা হয়েছে',
      data: result
    });
  } catch (error) {
    mobileLogger.error('Error syncing offline cart', {
      error: error.message,
      userId: req.body.userId
    });
    res.status(500).json({
      success: false,
      error: 'Failed to sync offline cart',
      message: 'Failed to sync offline cart',
      messageBn: 'অফলাইন কার্ট সিঙ্ক করতে ব্যর্থ হয়েছে'
    });
  }
});

/**
 * GET /api/v1/mobile/cart/sync-status/:userId
 * Get sync status for user
 */
router.get('/cart/sync-status/:userId', [
  param('userId').isUUID().withMessage('Invalid user ID')
], handleValidationErrors, authMiddleware.authenticate(), mobileRateLimit, async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Verify user ID matches authenticated user
    if (userId !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'Forbidden',
        message: 'You can only view your own sync status',
        messageBn: 'আপনি শুধুমাত্র নিজের সিঙ্ক স্ট্যাটাস দেখতে পারেন'
      });
    }

    const syncStatus = await mobileService.getSyncStatus(userId);

    res.json({
      success: true,
      message: 'Sync status retrieved',
      messageBn: 'সিঙ্ক স্ট্যাটাস পুনরুদ্ধার করা হয়েছে',
      data: syncStatus
    });
  } catch (error) {
    mobileLogger.error('Error getting sync status', {
      error: error.message,
      userId: req.params.userId
    });
    res.status(500).json({
      success: false,
      error: 'Failed to get sync status',
      message: 'Failed to get sync status',
      messageBn: 'সিঙ্ক স্ট্যাটাস পেতে ব্যর্থ হয়েছে'
    });
  }
});

// ============================================================================
// Mobile Cart Endpoints
// ============================================================================

/**
 * GET /api/v1/mobile/cart/summary/:userId
 * Lightweight cart summary for mobile
 */
router.get('/cart/summary/:userId', [
  param('userId').isUUID().withMessage('Invalid user ID')
], handleValidationErrors, authMiddleware.authenticate(), mobileRateLimit, async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Verify user ID matches authenticated user
    if (userId !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'Forbidden',
        message: 'You can only view your own cart summary',
        messageBn: 'আপনি শুধুমাত্র নিজের কার্ট সারসংক্ষেপ দেখতে পারেন'
      });
    }

    const summary = await mobileService.getMobileCartSummary(userId);

    res.json({
      success: true,
      message: 'Cart summary retrieved',
      messageBn: 'কার্ট সারসংক্ষেপ পুনরুদ্ধার করা হয়েছে',
      data: summary
    });
  } catch (error) {
    mobileLogger.error('Error getting cart summary', {
      error: error.message,
      userId: req.params.userId
    });
    res.status(500).json({
      success: false,
      error: 'Failed to get cart summary',
      message: 'Failed to get cart summary',
      messageBn: 'কার্ট সারসংক্ষেপ পেতে ব্যর্থ হয়েছে'
    });
  }
});

/**
 * GET /api/v1/mobile/cart/items/:userId
 * Get cart items with pagination (optimized payload)
 */
router.get('/cart/items/:userId', [
  param('userId').isUUID().withMessage('Invalid user ID'),
  // Query params are validated in the handler
], handleValidationErrors, authMiddleware.authenticate(), mobileRateLimit, async (req, res) => {
  try {
    const { userId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    
    // Verify user ID matches authenticated user
    if (userId !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'Forbidden',
        message: 'You can only view your own cart items',
        messageBn: 'আপনি শুধুমাত্র নিজের কার্ট আইটেম দেখতে পারেন'
      });
    }

    const items = await mobileService.getMobileCartItems(userId, page, limit);

    res.json({
      success: true,
      message: 'Cart items retrieved',
      messageBn: 'কার্ট আইটেম পুনরুদ্ধার করা হয়েছে',
      data: items
    });
  } catch (error) {
    mobileLogger.error('Error getting cart items', {
      error: error.message,
      userId: req.params.userId
    });
    res.status(500).json({
      success: false,
      error: 'Failed to get cart items',
      message: 'Failed to get cart items',
      messageBn: 'কার্ট আইটেম পেতে ব্যর্থ হয়েছে'
    });
  }
});

// ============================================================================
// SMS Notification Endpoints
// ============================================================================

/**
 * POST /api/v1/mobile/cart/subscribe-sms
 * Subscribe to cart update notifications
 */
router.post('/cart/subscribe-sms', [
  body('userId').isUUID().withMessage('Invalid user ID'),
  body('phoneNumber').isString().notEmpty().withMessage('Phone number is required'),
  body('events').isArray().withMessage('Events must be an array'),
  body('events.*').isIn(['item_added', 'item_removed', 'price_changed', 'cart_abandoned']).withMessage('Invalid event type')
], handleValidationErrors, authMiddleware.authenticate(), mobileRateLimit, async (req, res) => {
  try {
    const { userId, phoneNumber, events } = req.body;
    
    // Verify user ID matches authenticated user
    if (userId !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'Forbidden',
        message: 'You can only subscribe for yourself',
        messageBn: 'আপনি শুধুমাত্র নিজের জন্য সাবস্ক্রাইব করতে পারেন'
      });
    }

    const result = await mobileService.subscribeToCartSmsNotifications(userId, phoneNumber, events);

    res.json({
      success: true,
      message: 'Successfully subscribed to SMS notifications',
      messageBn: 'SMS নোটিফিকেশনে সফলভাবে সাবস্ক্রাইব করা হয়েছে',
      data: result
    });
  } catch (error) {
    mobileLogger.error('Error subscribing to SMS notifications', {
      error: error.message,
      userId: req.body.userId
    });
    res.status(500).json({
      success: false,
      error: 'Failed to subscribe to SMS notifications',
      message: 'Failed to subscribe to SMS notifications',
      messageBn: 'SMS নোটিফিকেশনে সাবস্ক্রাইব করতে ব্যর্থ হয়েছে'
    });
  }
});

/**
 * POST /api/v1/mobile/cart/unsubscribe-sms
 * Unsubscribe from notifications
 */
router.post('/cart/unsubscribe-sms', [
  body('userId').isUUID().withMessage('Invalid user ID')
], handleValidationErrors, authMiddleware.authenticate(), mobileRateLimit, async (req, res) => {
  try {
    const { userId } = req.body;
    
    // Verify user ID matches authenticated user
    if (userId !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'Forbidden',
        message: 'You can only unsubscribe for yourself',
        messageBn: 'আপনি শুধুমাত্র নিজের জন্য আনসাবস্ক্রাইব করতে পারেন'
      });
    }

    const result = await mobileService.unsubscribeFromCartSmsNotifications(userId);

    res.json({
      success: true,
      message: 'Successfully unsubscribed from SMS notifications',
      messageBn: 'SMS নোটিফিকেশন থেকে সফলভাবে আনসাবস্ক্রাইব করা হয়েছে',
      data: result
    });
  } catch (error) {
    mobileLogger.error('Error unsubscribing from SMS notifications', {
      error: error.message,
      userId: req.body.userId
    });
    res.status(500).json({
      success: false,
      error: 'Failed to unsubscribe from SMS notifications',
      message: 'Failed to unsubscribe from SMS notifications',
      messageBn: 'SMS নোটিফিকেশন থেকে আনসাবস্ক্রাইব করতে ব্যর্থ হয়েছে'
    });
  }
});

/**
 * GET /api/v1/mobile/cart/sms-status/:userId
 * Get SMS subscription status
 */
router.get('/cart/sms-status/:userId', [
  param('userId').isUUID().withMessage('Invalid user ID')
], handleValidationErrors, authMiddleware.authenticate(), mobileRateLimit, async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Verify user ID matches authenticated user
    if (userId !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'Forbidden',
        message: 'You can only view your own SMS status',
        messageBn: 'আপনি শুধুমাত্র নিজের SMS স্ট্যাটাস দেখতে পারেন'
      });
    }

    const status = await mobileService.getSmsNotificationStatus(userId);

    res.json({
      success: true,
      message: 'SMS subscription status retrieved',
      messageBn: 'SMS সাবস্ক্রিপশন স্ট্যাটাস পুনরুদ্ধার করা হয়েছে',
      data: status
    });
  } catch (error) {
    mobileLogger.error('Error getting SMS subscription status', {
      error: error.message,
      userId: req.params.userId
    });
    res.status(500).json({
      success: false,
      error: 'Failed to get SMS subscription status',
      message: 'Failed to get SMS subscription status',
      messageBn: 'SMS সাবস্ক্রিপশন স্ট্যাটাস পেতে ব্যর্থ হয়েছে'
    });
  }
});

module.exports = router;
