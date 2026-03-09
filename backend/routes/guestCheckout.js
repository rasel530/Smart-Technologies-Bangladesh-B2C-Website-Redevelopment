const express = require('express');
const { body, param, validationResult } = require('express-validator');
const { authMiddleware } = require('../middleware/auth');
const { rateLimitService } = require('../services/rateLimitService');
const { guestCheckoutController } = require('../controllers/guestCheckoutController');
const { validateGuestSessionId } = require('../controllers/guestCheckoutController');
const { loggerService } = require('../services/logger');

const router = express.Router();

// Logger for guest checkout routes
const guestCheckoutLogger = {
  info: (message, data) => loggerService.info(message, data),
  warn: (message, data) => loggerService.warn(message, data),
  error: (message, data) => loggerService.error(message, data)
};

// Rate limiting configuration for guest checkout endpoints
const guestCheckoutRateLimitConfig = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 10, // 10 requests per window for guest users
  message: 'Too many checkout operations. Please try again later.',
  messageBn: 'অনেক চেকআউট অপারেশন। অনুগ্রহ করে পুনরায় চেষ্টা করুন।',
  skipSuccessfulRequests: false
};

// Create rate limiting middleware
const guestCheckoutRateLimit = rateLimitService.createRateLimit(guestCheckoutRateLimitConfig);

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
// Guest Checkout Flow Endpoints
// ============================================================================

// POST /api/v1/guest/checkout/initiate - Initiate guest checkout
router.post('/checkout/initiate', [
  body('cartId').optional().isUUID().withMessage('Invalid cart ID'),
  body('guestId').optional().isUUID().withMessage('Invalid guest ID'),
  body('sessionId').optional().isUUID().withMessage('Invalid session ID'),
  body('platform').optional().isString().withMessage('Platform must be a string'),
  body('language').optional().isString().withMessage('Language must be a string')
], handleValidationErrors, guestCheckoutRateLimit, guestCheckoutController.initiateGuestCheckout);

// GET /api/v1/guest/checkout/session/:sessionId - Get guest checkout session
router.get('/checkout/session/:sessionId', [
  param('sessionId').isUUID().withMessage('Invalid checkout session ID')
], handleValidationErrors, guestCheckoutRateLimit, validateGuestSessionId, guestCheckoutController.getGuestCheckoutSession);

// POST /api/v1/guest/checkout/session/:sessionId/info - Save guest information
router.post('/checkout/session/:sessionId/info', [
  param('sessionId').isUUID().withMessage('Invalid checkout session ID'),
  body('firstName').optional().isString().withMessage('First name must be a string'),
  body('lastName').optional().isString().withMessage('Last name must be a string'),
  body('email').optional().isEmail().withMessage('Invalid email format'),
  body('phone').optional().isString().withMessage('Phone must be a string')
], handleValidationErrors, guestCheckoutRateLimit, validateGuestSessionId, guestCheckoutController.saveGuestInfo);

// POST /api/v1/guest/checkout/session/:sessionId/complete - Complete guest checkout
router.post('/checkout/session/:sessionId/complete', [
  param('sessionId').isUUID().withMessage('Invalid checkout session ID'),
  body('shippingAddress').optional().isObject().withMessage('Shipping address must be an object'),
  body('billingAddress').optional().isObject().withMessage('Billing address must be an object'),
  body('paymentMethod').optional().isString().withMessage('Payment method must be a string'),
  body('paymentDetails').optional().isObject().withMessage('Payment details must be an object'),
  body('notes').optional().isString().withMessage('Notes must be a string')
], handleValidationErrors, guestCheckoutRateLimit, validateGuestSessionId, guestCheckoutController.completeGuestCheckout);

// ============================================================================
// Guest Order Management Endpoints
// ============================================================================

// GET /api/v1/guest/orders - Get guest orders
router.get('/orders', guestCheckoutRateLimit, guestCheckoutController.getGuestOrders);

// GET /api/v1/guest/orders/:orderNumber - Get guest order details
router.get('/orders/:orderNumber', [
  param('orderNumber').isString().withMessage('Invalid order number')
], handleValidationErrors, guestCheckoutRateLimit, guestCheckoutController.getGuestOrderDetails);

// ============================================================================
// Guest Cart Management Endpoints
// ============================================================================

// POST /api/v1/guest/merge-cart - Merge guest cart on login
router.post('/merge-cart', [
  body('guestSessionId').isUUID().withMessage('Invalid guest session ID')
], handleValidationErrors, authMiddleware.authenticate, guestCheckoutRateLimit, guestCheckoutController.mergeGuestCart);

// POST /api/v1/guest/convert-to-user - Convert guest to user
router.post('/convert-to-user', [
  body('guestSessionId').isUUID().withMessage('Invalid guest session ID'),
  body('email').isEmail().withMessage('Invalid email format'),
  body('password').isString().withMessage('Password is required'),
  body('firstName').isString().withMessage('First name is required'),
  body('lastName').isString().withMessage('Last name is required'),
  body('phone').optional().isString().withMessage('Phone must be a string')
], handleValidationErrors, guestCheckoutRateLimit, guestCheckoutController.convertGuestToUser);

// ============================================================================
// Utility Endpoints
// ============================================================================

// GET /api/v1/guest/shipping-methods - Get available shipping methods
router.get('/shipping-methods', guestCheckoutRateLimit, (req, res) => {
  try {
    const { checkoutService } = require('../services/checkoutService');
    const shippingMethods = checkoutService.getShippingMethods();

    res.json({
      success: true,
      message: 'Shipping methods retrieved successfully',
      messageBn: 'শিপিং পদ্ধতি সফলভাবে পুনরুদ্ধার করা হয়েছে',
      data: shippingMethods
    });
  } catch (error) {
    guestCheckoutLogger.error('Error getting shipping methods', {
      error: error.message,
      stack: error.stack
    });

    res.status(500).json({
      success: false,
      error: 'Failed to retrieve shipping methods',
      message: 'Failed to retrieve shipping methods',
      messageBn: 'শিপিং পদ্ধতি পুনরুদ্ধার করতে ব্যর্থ হয়েছে'
    });
  }
});

// GET /api/v1/guest/payment-methods - Get available payment methods
router.get('/payment-methods', guestCheckoutRateLimit, (req, res) => {
  try {
    const { checkoutService } = require('../services/checkoutService');
    const paymentMethods = checkoutService.getPaymentMethods();

    res.json({
      success: true,
      message: 'Payment methods retrieved successfully',
      messageBn: 'পেমেন্ট পদ্ধতি সফলভাবে পুনরুদ্ধার করা হয়েছে',
      data: paymentMethods
    });
  } catch (error) {
    guestCheckoutLogger.error('Error getting payment methods', {
      error: error.message,
      stack: error.stack
    });

    res.status(500).json({
      success: false,
      error: 'Failed to retrieve payment methods',
      message: 'Failed to retrieve payment methods',
      messageBn: 'পেমেন্ট পদ্ধতি পুনরুদ্ধার করতে ব্যর্থ হয়েছে'
    });
  }
});

module.exports = router;
