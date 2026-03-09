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

// POST /api/v1/checkout/initialize - Initialize checkout session
router.post('/initialize', [
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

// POST /api/v1/checkout/session/:sessionId/step - Update checkout step (for guest checkout info)
router.post('/session/:sessionId/step', [
  param('sessionId').isUUID().withMessage('Invalid checkout session ID'),
  body('step').isString().withMessage('Step is required'),
  body('data').optional().isObject().withMessage('Data must be an object')
], handleValidationErrors, authMiddleware.optional(), applyCheckoutRateLimit, validateCheckoutSessionId, verifyCheckoutSessionOwnership, checkoutController.updateCheckoutStep);

// POST /api/v1/checkout/step - Update checkout step (alias with sessionId in body)
router.post('/step', [
  body('sessionId').isUUID().withMessage('Invalid checkout session ID'),
  body('step').isString().withMessage('Step is required'),
  body('data').optional().isObject().withMessage('Data must be an object')
], handleValidationErrors, authMiddleware.optional(), applyCheckoutRateLimit, async (req, res, next) => {
  // Move sessionId from body to params for consistency with existing controller
  req.params.sessionId = req.body.sessionId;
  next();
}, validateCheckoutSessionId, verifyCheckoutSessionOwnership, checkoutController.updateCheckoutStep);

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

// POST /api/v1/checkout/save - Save checkout progress (alias for updateCheckoutStep)
router.post('/save', [
  body('sessionId').isUUID().withMessage('Invalid checkout session ID'),
  body('step').optional().isString().withMessage('Step must be a string'),
  body('data').optional().isObject().withMessage('Data must be an object')
], handleValidationErrors, authMiddleware.optional(), applyCheckoutRateLimit, checkoutController.saveProgress);

// POST /api/v1/checkout/validate - Validate checkout step
router.post('/validate', [
  body('sessionId').isUUID().withMessage('Invalid checkout session ID'),
  body('step').isString().withMessage('Step is required'),
  body('data').optional().isObject().withMessage('Data must be an object')
], handleValidationErrors, authMiddleware.optional(), applyCheckoutRateLimit, async (req, res, next) => {
  // Move sessionId from body to params for consistency with existing controller
  req.params.sessionId = req.body.sessionId;
  next();
}, validateCheckoutSessionId, verifyCheckoutSessionOwnership, async (req, res) => {
  try {
    const { step, data } = req.body;
    const { sessionId } = req.params;

    // If this is a guest session, validate differently
    if (req.isGuestSession && req.guestSession) {
      const guestCheckoutService = require('../services/guestCheckoutService');
      
      // Validate step
      const validSteps = ['info', 'address', 'shipping', 'payment', 'review'];
      if (!validSteps.includes(step)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid checkout step',
          message: 'Invalid checkout step',
          messageBn: 'অবৈধ চেকআউট ধাপ',
          details: { validSteps }
        });
      }

      const errors = [];
      const warnings = [];
      let canProceed = true;
      const metadata = req.guestSession.metadata || {};

      if (step === 'info') {
        if (!req.guestSession.firstName || !req.guestSession.lastName) {
          errors.push('Guest name is required');
          canProceed = false;
        }
        if (!req.guestSession.email && !req.guestSession.phone) {
          errors.push('Email or phone is required');
          canProceed = false;
        }
      } else if (step === 'address') {
        const addressData = data || metadata.address;
        if (!addressData || !addressData.address) {
          errors.push('Shipping address is required');
          canProceed = false;
        }
      } else if (step === 'shipping') {
        const shippingData = data || metadata.shipping;
        if (!shippingData || !shippingData.method) {
          errors.push('Shipping method is required');
          canProceed = false;
        }
      } else if (step === 'payment') {
        const paymentData = data || metadata.payment;
        if (!paymentData || !paymentData.method) {
          errors.push('Payment method is required');
          canProceed = false;
        }
      }

      return res.json({
        success: true,
        message: 'Guest checkout step validated successfully',
        messageBn: 'অতিথি চেকআউট ধাপ সফলভাবে যাচাই করা হয়েছে',
        data: {
          isValid: canProceed,
          step,
          errors,
          warnings,
          canProceed
        }
      });
    }

    // Regular checkout session validation
    // Validate step
    const validSteps = ['address', 'shipping', 'payment', 'review'];
    if (!validSteps.includes(step)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid checkout step',
        message: 'Invalid checkout step',
        messageBn: 'অবৈধ চেকআউট ধাপ',
        details: { validSteps }
      });
    }

    // Get checkout session
    const checkoutSession = await prisma.checkoutSession.findUnique({
      where: { id: sessionId }
    });

    if (!checkoutSession) {
      return res.status(404).json({
        success: false,
        error: 'Checkout session not found',
        message: 'Checkout session not found',
        messageBn: 'চেকআউট সেশন পাওয়া যায়নি'
      });
    }

    // Perform step-specific validation
    const errors = [];
    const warnings = [];
    let canProceed = true;

    if (step === 'address') {
      const addressData = data || checkoutSession.data?.address;
      if (!addressData || !addressData.shippingAddress) {
        errors.push('Shipping address is required');
        canProceed = false;
      }
    } else if (step === 'shipping') {
      const shippingData = data || checkoutSession.data?.shipping;
      if (!shippingData || !shippingData.method) {
        errors.push('Shipping method is required');
        canProceed = false;
      }
    } else if (step === 'payment') {
      const paymentData = data || checkoutSession.data?.payment;
      if (!paymentData || !paymentData.method) {
        errors.push('Payment method is required');
        canProceed = false;
      }
    }

    res.json({
      success: true,
      message: 'Checkout step validated successfully',
      messageBn: 'চেকআউট ধাপ সফলভাবে যাচাই করা হয়েছে',
      data: {
        isValid: canProceed,
        step,
        errors,
        warnings,
        canProceed
      }
    });
  } catch (error) {
    checkoutLogger.error('Error validating checkout step', {
      error: error.message,
      stack: error.stack,
      sessionId: req.body.sessionId,
      step: req.body.step
    });

    res.status(500).json({
      success: false,
      error: 'Failed to validate checkout step',
      message: 'Failed to validate checkout step',
      messageBn: 'চেকআউট ধাপ যাচাইকরণ করতে ব্যর্থ হয়েছে'
    });
  }
});

// POST /api/v1/checkout/complete - Complete checkout (alias with sessionId in body)
router.post('/complete', [
  body('sessionId').isUUID().withMessage('Invalid checkout session ID'),
  body('data').optional().isObject().withMessage('Data must be an object')
], handleValidationErrors, authMiddleware.optional(), applyCheckoutRateLimit, async (req, res, next) => {
  // Move sessionId from body to params for consistency with existing controller
  req.params.sessionId = req.body.sessionId;
  next();
}, validateCheckoutSessionId, verifyCheckoutSessionOwnership, checkoutController.completeCheckout);

// POST /api/v1/checkout/abandon - Abandon checkout
router.post('/abandon', [
  body('sessionId').isUUID().withMessage('Invalid checkout session ID'),
  body('reason').optional().isString().withMessage('Reason must be a string'),
  body('saveData').optional().isBoolean().withMessage('Save data must be a boolean')
], handleValidationErrors, authMiddleware.optional(), applyCheckoutRateLimit, async (req, res, next) => {
  // Move sessionId from body to params for consistency with existing controller
  req.params.sessionId = req.body.sessionId;
  next();
}, validateCheckoutSessionId, verifyCheckoutSessionOwnership, checkoutController.cancelCheckout);

// POST /api/v1/checkout/recover - Recover checkout
router.post('/recover', [
  body('recoveryToken').isString().withMessage('Recovery token is required')
], handleValidationErrors, authMiddleware.optional(), applyCheckoutRateLimit, async (req, res) => {
  try {
    const { recoveryToken } = req.body;

    // Find abandoned checkout session by recovery token
    const checkoutSession = await prisma.checkoutSession.findFirst({
      where: {
        status: 'abandoned',
        data: {
          path: ['recoveryToken'],
          equals: recoveryToken
        }
      }
    });

    if (!checkoutSession) {
      return res.status(404).json({
        success: false,
        error: 'Recovery token not found or expired',
        message: 'Recovery token not found or expired',
        messageBn: 'পুনরুদ্ধার টোকেন পাওয়া যায়নি বা মেয়াদোত্তীর্ণ হয়েছে'
      });
    }

    // Update session status to active
    const updatedSession = await prisma.checkoutSession.update({
      where: { id: checkoutSession.id },
      data: {
        status: 'active',
        updatedAt: new Date()
      }
    });

    // Update expiration time
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes

    res.json({
      success: true,
      message: 'Checkout recovered successfully',
      messageBn: 'চেকআউট সফলভাবে পুনরুদ্ধার করা হয়েছে',
      data: {
        session: updatedSession,
        recovery: {
          recoveredAt: new Date().toISOString(),
          expiresAt: expiresAt.toISOString()
        }
      }
    });
  } catch (error) {
    checkoutLogger.error('Error recovering checkout', {
      error: error.message,
      stack: error.stack,
      recoveryToken: req.body.recoveryToken
    });

    res.status(500).json({
      success: false,
      error: 'Failed to recover checkout',
      message: 'Failed to recover checkout',
      messageBn: 'চেকআউট পুনরুদ্ধার করতে ব্যর্থ হয়েছে'
    });
  }
});

// POST /api/v1/checkout/extend - Extend checkout session
router.post('/extend', [
  body('sessionId').isUUID().withMessage('Invalid checkout session ID')
], handleValidationErrors, authMiddleware.optional(), applyCheckoutRateLimit, async (req, res, next) => {
  // Move sessionId from body to params for consistency with existing controller
  req.params.sessionId = req.body.sessionId;
  next();
}, validateCheckoutSessionId, verifyCheckoutSessionOwnership, async (req, res) => {
  try {
    const { sessionId } = req.params;

    // Extend session expiration
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes

    const updatedSession = await prisma.checkoutSession.update({
      where: { id: sessionId },
      data: {
        expiresAt,
        updatedAt: new Date()
      }
    });

    res.json({
      success: true,
      message: 'Session extended successfully',
      messageBn: 'সেশন সফলভাবে প্রসারিত করা হয়েছে',
      data: {
        expiresAt: expiresAt.toISOString()
      }
    });
  } catch (error) {
    checkoutLogger.error('Error extending checkout session', {
      error: error.message,
      stack: error.stack,
      sessionId: req.body.sessionId
    });

    res.status(500).json({
      success: false,
      error: 'Failed to extend session',
      message: 'Failed to extend session',
      messageBn: 'সেশন প্রসারিত করতে ব্যর্থ হয়েছে'
    });
  }
});

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
