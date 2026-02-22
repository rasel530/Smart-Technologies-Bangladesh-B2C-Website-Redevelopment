const express = require('express');
const { body, param, validationResult } = require('express-validator');
const { authMiddleware } = require('../middleware/auth');
const { rateLimitService } = require('../services/rateLimitService');
const { checkoutController } = require('../controllers/checkoutController');
const { validateCheckoutSessionId, verifyCheckoutSessionOwnership } = require('../controllers/checkoutController');
const { loggerService } = require('../services/logger');

const router = express.Router();

// Logger for checkout routes
const checkoutLogger = {
  info: (message, data) => loggerService.info(message, data),
  warn: (message, data) => loggerService.warn(message, data),
  error: (message, data) => loggerService.error(message, data)
};

// Rate limiting configuration for checkout endpoints
const checkoutRateLimitConfig = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 50, // 50 requests per window for authenticated users
  message: 'Too many checkout operations. Please try again later.',
  messageBn: 'অনেক চেকআউট অপারেশন। অনুগ্রহ করে পুনরায় চেষ্টা করুন।',
  skipSuccessfulRequests: false
};

const guestCheckoutRateLimitConfig = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 10, // 10 requests per window for guest users
  message: 'Too many checkout operations. Please try again later.',
  messageBn: 'অনেক চেকআউট অপারেশন। অনুগ্রহ করে পুনরায় চেষ্টা করুন।',
  skipSuccessfulRequests: false
};

// Create rate limiting middleware
const authenticatedCheckoutRateLimit = rateLimitService.createRateLimit(checkoutRateLimitConfig);
const guestCheckoutRateLimit = rateLimitService.createRateLimit(guestCheckoutRateLimitConfig);

// Middleware to apply appropriate rate limit based on authentication
const applyCheckoutRateLimit = (req, res, next) => {
  if (req.user && req.user.id) {
    // Authenticated user - use higher limit
    return authenticatedCheckoutRateLimit(req, res, next);
  } else {
    // Guest user - use lower limit
    return guestCheckoutRateLimit(req, res, next);
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

// ============================================================================
// Checkout Flow Endpoints
// ============================================================================

// POST /api/v1/checkout/initiate - Initialize checkout session
router.post('/initiate', [
  body('cartId').isUUID().withMessage('Invalid cart ID')
], handleValidationErrors, authMiddleware.optional(), applyCheckoutRateLimit, checkoutController.initiateCheckout);

// GET /api/v1/checkout/session/:sessionId - Get checkout session
router.get('/session/:sessionId', [
  param('sessionId').isUUID().withMessage('Invalid checkout session ID')
], handleValidationErrors, authMiddleware.optional(), applyCheckoutRateLimit, validateCheckoutSessionId, verifyCheckoutSessionOwnership, checkoutController.getCheckoutSession);

// PUT /api/v1/checkout/session/:sessionId/step - Update checkout step
router.put('/session/:sessionId/step', [
  param('sessionId').isUUID().withMessage('Invalid checkout session ID'),
  body('step').isString().withMessage('Step is required'),
  body('data').optional().isObject().withMessage('Data must be an object')
], handleValidationErrors, authMiddleware.optional(), applyCheckoutRateLimit, validateCheckoutSessionId, verifyCheckoutSessionOwnership, checkoutController.updateCheckoutStep);

// POST /api/v1/checkout/session/:sessionId/address - Save address step
router.post('/session/:sessionId/address', [
  param('sessionId').isUUID().withMessage('Invalid checkout session ID'),
  body('shippingAddress').optional().isObject().withMessage('Invalid shipping address'),
  body('billingAddress').optional().isObject().withMessage('Invalid billing address'),
  body('savedAddressId').optional().isUUID().withMessage('Invalid saved address ID')
], handleValidationErrors, authMiddleware.optional(), applyCheckoutRateLimit, validateCheckoutSessionId, verifyCheckoutSessionOwnership, checkoutController.saveAddressStep);

// POST /api/v1/checkout/session/:sessionId/shipping - Save shipping step
router.post('/session/:sessionId/shipping', [
  param('sessionId').isUUID().withMessage('Invalid checkout session ID'),
  body('method').isString().withMessage('Shipping method is required')
], handleValidationErrors, authMiddleware.optional(), applyCheckoutRateLimit, validateCheckoutSessionId, verifyCheckoutSessionOwnership, checkoutController.saveShippingStep);

// POST /api/v1/checkout/session/:sessionId/payment - Save payment step
router.post('/session/:sessionId/payment', [
  param('sessionId').isUUID().withMessage('Invalid checkout session ID'),
  body('method').isString().withMessage('Payment method is required'),
  body('details').optional().isObject().withMessage('Payment details must be an object')
], handleValidationErrors, authMiddleware.optional(), applyCheckoutRateLimit, validateCheckoutSessionId, verifyCheckoutSessionOwnership, checkoutController.savePaymentStep);

// POST /api/v1/checkout/session/:sessionId/complete - Complete checkout
router.post('/session/:sessionId/complete', [
  param('sessionId').isUUID().withMessage('Invalid checkout session ID')
], handleValidationErrors, authMiddleware.optional(), applyCheckoutRateLimit, validateCheckoutSessionId, verifyCheckoutSessionOwnership, checkoutController.completeCheckout);

// DELETE /api/v1/checkout/session/:sessionId - Cancel checkout session
router.delete('/session/:sessionId', [
  param('sessionId').isUUID().withMessage('Invalid checkout session ID'),
  body('reason').optional().isString().withMessage('Reason must be a string')
], handleValidationErrors, authMiddleware.optional(), applyCheckoutRateLimit, validateCheckoutSessionId, verifyCheckoutSessionOwnership, checkoutController.cancelCheckout);

// ============================================================================
// Additional Utility Endpoints
// ============================================================================

// GET /api/v1/checkout/shipping-methods - Get available shipping methods
router.get('/shipping-methods', authMiddleware.optional(), applyCheckoutRateLimit, (req, res) => {
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
    checkoutLogger.error('Error getting shipping methods', {
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

// GET /api/v1/checkout/payment-methods - Get available payment methods
router.get('/payment-methods', authMiddleware.optional(), applyCheckoutRateLimit, (req, res) => {
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
    checkoutLogger.error('Error getting payment methods', {
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

// POST /api/v1/checkout/validate-address - Validate address data
router.post('/validate-address', [
  body('address').isObject().withMessage('Address data is required')
], handleValidationErrors, authMiddleware.optional(), applyCheckoutRateLimit, (req, res) => {
  try {
    const { address } = req.body;
    const { checkoutService } = require('../services/checkoutService');
    const validation = checkoutService.validateAddress(address);

    res.json({
      success: validation.isValid,
      message: validation.isValid ? 'Address is valid' : 'Address validation failed',
      messageBn: validation.isValid ? 'ঠিকানা বৈধ' : 'ঠিকানা যাচাইকরণ ব্যর্থ হয়েছে',
      data: validation
    });
  } catch (error) {
    checkoutLogger.error('Error validating address', {
      error: error.message,
      stack: error.stack
    });

    res.status(500).json({
      success: false,
      error: 'Failed to validate address',
      message: 'Failed to validate address',
      messageBn: 'ঠিকানা যাচাইকরণ করতে ব্যর্থ হয়েছে'
    });
  }
});

module.exports = router;
