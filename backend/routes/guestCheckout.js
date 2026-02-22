const express = require('express');
const { body, param, query, validationResult } = require('express-validator');
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
  maxRequests: 50, // 50 requests per window
  message: 'Too many guest checkout requests. Please try again later.',
  messageBn: 'অনেক গুলি অতিথি চেকআউট অনুরোধ। অনুগ্রহ করে পুনরায় চেষ্টা করুন।',
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
// Guest Checkout Routes
// ============================================================================

/**
 * POST /api/v1/guest/checkout/initiate
 * Initiate guest checkout
 * Body: { cartId }
 */
router.post('/checkout/initiate', [
  body('cartId').isUUID().withMessage('Invalid cart ID')
], handleValidationErrors, guestCheckoutRateLimit, guestCheckoutController.initiateGuestCheckout);

/**
 * GET /api/v1/guest/checkout/session/:sessionId
 * Get guest checkout session
 */
router.get('/checkout/session/:sessionId', [
  param('sessionId').isUUID().withMessage('Invalid session ID')
], handleValidationErrors, guestCheckoutRateLimit, guestCheckoutController.getGuestCheckoutSession);

/**
 * POST /api/v1/guest/checkout/session/:sessionId/info
 * Save guest information
 * Body: { firstName, lastName, email, phone }
 */
router.post('/checkout/session/:sessionId/info', [
  param('sessionId').isUUID().withMessage('Invalid session ID'),
  body('firstName').optional().isString().trim().notEmpty().withMessage('First name is required'),
  body('lastName').optional().isString().trim().notEmpty().withMessage('Last name is required'),
  body('email').optional().isEmail().withMessage('Invalid email format'),
  body('phone').optional().isString().trim().withMessage('Invalid phone format')
], handleValidationErrors, guestCheckoutRateLimit, guestCheckoutController.saveGuestInfo);

/**
 * POST /api/v1/guest/checkout/session/:sessionId/complete
 * Complete guest checkout
 * Body: { shippingAddress, billingAddress, paymentMethod, paymentDetails, notes }
 */
router.post('/checkout/session/:sessionId/complete', [
  param('sessionId').isUUID().withMessage('Invalid session ID'),
  body('shippingAddress').isObject().withMessage('Shipping address is required'),
  body('billingAddress').optional().isObject(),
  body('paymentMethod').isIn(['CASH_ON_DELIVERY', 'EMI', 'BKASH', 'NAGAD', 'ROCKET', 'MCASH', 'BANK_TRANSFER', 'CREDIT_CARD']).withMessage('Invalid payment method'),
  body('paymentDetails').optional().isObject(),
  body('notes').optional().isString()
], handleValidationErrors, guestCheckoutRateLimit, guestCheckoutController.completeGuestCheckout);

// ============================================================================
// Guest Order Routes
// ============================================================================

/**
 * GET /api/v1/guest/orders
 * Get guest orders
 * Query: { email, phone, page, limit }
 */
router.get('/orders', [
  query('email').optional().isEmail().withMessage('Invalid email format'),
  query('phone').optional().isString().trim(),
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be at least 1'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100')
], handleValidationErrors, guestCheckoutRateLimit, guestCheckoutController.getGuestOrders);

/**
 * GET /api/v1/guest/orders/:orderNumber
 * Get guest order details
 * Query: { email, phone }
 */
router.get('/orders/:orderNumber', [
  param('orderNumber').isString().trim().notEmpty().withMessage('Order number is required'),
  query('email').optional().isEmail().withMessage('Invalid email format'),
  query('phone').optional().isString().trim()
], handleValidationErrors, guestCheckoutRateLimit, guestCheckoutController.getGuestOrderDetails);

// ============================================================================
// Guest Cart Merge Routes
// ============================================================================

/**
 * POST /api/v1/guest/merge-cart
 * Merge guest cart on login
 * Body: { guestSessionId }
 * Requires authentication
 */
router.post('/merge-cart', [
  body('guestSessionId').isUUID().withMessage('Invalid guest session ID')
], handleValidationErrors, authMiddleware.authenticate(), guestCheckoutRateLimit, guestCheckoutController.mergeGuestCart);

/**
 * POST /api/v1/guest/convert-to-user
 * Convert guest to user
 * Body: { guestSessionId, email, password, firstName, lastName, phone }
 */
router.post('/convert-to-user', [
  body('guestSessionId').isUUID().withMessage('Invalid guest session ID'),
  body('email').isEmail().withMessage('Invalid email format'),
  body('password').isString().isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('firstName').isString().trim().notEmpty().withMessage('First name is required'),
  body('lastName').isString().trim().notEmpty().withMessage('Last name is required'),
  body('phone').optional().isString().trim()
], handleValidationErrors, guestCheckoutRateLimit, guestCheckoutController.convertGuestToUser);

module.exports = router;
