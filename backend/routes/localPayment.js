const express = require('express');
const { body, param, query, validationResult } = require('express-validator');
const { authMiddleware } = require('../middleware/auth');
const { rateLimitService } = require('../services/rateLimitService');
const { localPaymentService } = require('../services/localPaymentService');
const { loggerService } = require('../services/logger');

// Logger for local payment routes
const localPaymentLogger = {
  info: (message, data) => loggerService.info(message, data),
  warn: (message, data) => loggerService.warn(message, data),
  error: (message, data) => loggerService.error(message, data)
};

const router = express.Router();

// Rate limiting configuration for local payment endpoints
const localPaymentRateLimitConfig = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 200,
  message: 'Too many local payment requests. Please try again later.',
  messageBn: 'অনেক কার্য অপারেশন। অনুগ্রহ করে পুনরায় চেষ্টা করুন।',
  skipSuccessfulRequests: false
};

// Create rate limiting middleware
const localPaymentRateLimit = rateLimitService.createRateLimit(localPaymentRateLimitConfig);

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
// Local Payment Method Endpoints
// ============================================================================

/**
 * GET /api/v1/local-payment/methods
 * Get all active local payment methods
 */
router.get('/methods', localPaymentRateLimit, async (req, res) => {
  try {
    const methods = await localPaymentService.getLocalPaymentMethods();
    
    res.json({
      success: true,
      message: 'Local payment methods retrieved successfully',
      messageBn: 'স্থানীয় পেমেন্ট পদ্ধতি তালিকা সফলভাবে পুনরুন',
      data: methods
    });
  } catch (error) {
    localPaymentLogger.error('[GET /local-payment/methods] Error fetching local payment methods', {
      error: error.message
    });
    res.status(500).json({
      success: false,
      error: 'Failed to fetch local payment methods',
      message: 'Failed to fetch local payment methods',
      messageBn: 'স্থানীয় পেমেন্ট পদ্ধতি তালিকা আনতে পারা যায়নি'
    });
  }
});

/**
 * GET /api/v1/local-payment/methods/:code
 * Get payment method by code
 */
router.get('/methods/:code',
  param('code').isString().notEmpty().withMessage('Invalid payment method code'),
  handleValidationErrors,
  localPaymentRateLimit,
  async (req, res) => {
  try {
    // Add logging at the start of route handler
    console.log('[LOCAL PAYMENT] Request received for code:', req.params.code);

    const { code } = req.params;
    const method = await localPaymentService.getPaymentMethodByCode(code);
    
    res.json({
      success: true,
      message: 'Payment method retrieved successfully',
      messageBn: 'পেমেন্ট পদ্ধতি তথ্য সফলভাবে পুনরুন',
      data: method
    });
  } catch (error) {
    localPaymentLogger.error('[GET /local-payment/methods/:code] Error fetching payment method', {
      code: req.params.code,
      error: error.message
    });
    
    if (error.message.includes('not found')) {
      return res.status(404).json({
        success: false,
        error: 'Payment method not found',
        message: 'Payment method not found',
        messageBn: 'পেমেন্ট পদ্ধতি তথ্য পাওয়া যায়নি'
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Failed to fetch payment method',
      message: 'Failed to fetch payment method',
      messageBn: 'পেমেন্ট পদ্ধতি তথ্য আনতে পারা যায়নি'
    });
  }
});

// ============================================================================
// Payment Fee Calculation Endpoints
// ============================================================================

/**
 * GET /api/v1/local-payment/fee/:amount/:methodCode
 * Calculate payment fee
 */
router.get('/fee/:amount/:methodCode',
  param('amount').isFloat({ min: 0 }).withMessage('Invalid amount'),
  param('methodCode').isString().notEmpty().withMessage('Invalid payment method code'),
  handleValidationErrors,
  localPaymentRateLimit,
  async (req, res) => {
  try {
    const { amount, methodCode } = req.params;
    const feeResult = await localPaymentService.calculatePaymentFee(amount, methodCode);
    
    res.json({
      success: true,
      message: 'Payment fee calculated successfully',
      messageBn: 'পেমেন্ট ফি সফলভাবে হিসাব করা হয়েছে',
      data: feeResult
    });
  } catch (error) {
    localPaymentLogger.error('[GET /local-payment/fee/:amount/:methodCode] Error calculating payment fee', {
      amount: req.params.amount,
      methodCode: req.params.methodCode,
      error: error.message
    });
    
    if (error.message.includes('not found')) {
      return res.status(404).json({
        success: false,
        error: 'Payment method not found',
        message: 'Payment method not found',
        messageBn: 'পেমেন্ট পদ্ধতি তথ্য পাওয়া যায়নি'
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Failed to calculate payment fee',
      message: 'Failed to calculate payment fee',
      messageBn: 'পেমেন্ট ফি হিসাব করতে ব্যর্থ হয়েছে'
    });
  }
});

// ============================================================================
// Payment Validation Endpoints
// ============================================================================

/**
 * GET /api/v1/local-payment/validate/:methodCode/:amount
 * Validate payment method for amount
 */
router.get('/validate/:methodCode/:amount',
  param('methodCode').isString().notEmpty().withMessage('Invalid payment method code'),
  param('amount').isFloat({ min: 0 }).withMessage('Invalid amount'),
  handleValidationErrors,
  localPaymentRateLimit,
  async (req, res) => {
  try {
    const { methodCode, amount } = req.params;
    const validation = await localPaymentService.validatePaymentMethod(methodCode, amount);
    
    res.json({
      success: true,
      message: 'Payment method validated',
      messageBn: 'পেমেন্ট পদ্ধতি যাচাই করা হয়েছে',
      data: validation
    });
  } catch (error) {
    localPaymentLogger.error('[GET /local-payment/validate/:methodCode/:amount] Error validating payment method', {
      methodCode: req.params.methodCode,
      amount: req.params.amount,
      error: error.message
    });
    
    if (error.message.includes('not found')) {
      return res.status(404).json({
        success: false,
        error: 'Payment method not found',
        message: 'Payment method not found',
        messageBn: 'পেমেন্ট পদ্ধতি তথ্য পাওয়া যায়নি'
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Failed to validate payment method',
      message: 'Failed to validate payment method',
      messageBn: 'পেমেন্ট পদ্ধতি যাচাই করতে ব্যর্থ হয়েছে'
    });
  }
});

// ============================================================================
// Payment Processing Endpoints
// ============================================================================

/**
 * POST /api/v1/local-payment/process
 * Process local payment
 */
router.post('/process',
  body('userId').isUUID().withMessage('Invalid user ID'),
  body('methodCode').isString().notEmpty().withMessage('Invalid payment method code'),
  body('amount').isFloat({ min: 0 }).withMessage('Invalid amount'),
  body('phoneNumber').optional().isString().withMessage('Invalid phone number'),
  body('pin').optional().isString().withMessage('Invalid PIN'),
  body('orderId').optional().isUUID().withMessage('Invalid order ID'),
  handleValidationErrors,
  authMiddleware.authenticate,
  localPaymentRateLimit,
  async (req, res) => {
  try {
    const paymentData = req.body;
    const result = await localPaymentService.processLocalPayment(paymentData);
    
    res.json({
      success: true,
      message: 'Local payment processed successfully',
      messageBn: 'স্থানীয় পেমেন্ট সফলভাবে প্রক্রিয়া করা হয়েছে',
      data: result
    });
  } catch (error) {
    localPaymentLogger.error('[POST /local-payment/process] Error processing local payment', {
      paymentData: req.body,
      error: error.message
    });
    
    if (error.message.includes('not found')) {
      return res.status(404).json({
        success: false,
        error: 'Payment method not found',
        message: 'Payment method not found',
        messageBn: 'পেমেন্ট পদ্ধতি তথ্য পাওয়া যায়নি'
      });
    }
    
    if (error.message.includes('Minimum') || error.message.includes('Maximum')) {
      return res.status(400).json({
        success: false,
        error: error.message,
        message: error.message,
        messageBn: error.message
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Failed to process local payment',
      message: 'Failed to process local payment',
      messageBn: 'স্থানীয় পেমেন্ট প্রক্রিয়া করতে ব্যর্থ হয়েছে'
    });
  }
});

// ============================================================================
// Payment Instructions Endpoints
// ============================================================================

/**
 * GET /api/v1/local-payment/instructions/:methodCode
 * Get payment instructions for a method
 */
router.get('/instructions/:methodCode',
  param('methodCode').isString().notEmpty().withMessage('Invalid payment method code'),
  query('language').optional().isIn(['en', 'bn']).withMessage('Invalid language'),
  handleValidationErrors,
  localPaymentRateLimit,
  async (req, res) => {
  try {
    const { methodCode } = req.params;
    const { language = 'en' } = req.query;
    const instructions = await localPaymentService.getPaymentInstructions(methodCode, language);
    
    res.json({
      success: true,
      message: 'Payment instructions retrieved successfully',
      messageBn: 'পেমেন্ট নির্দেশনা সফলভাবে পুনরুন',
      data: instructions
    });
  } catch (error) {
    localPaymentLogger.error('[GET /local-payment/instructions/:methodCode] Error getting payment instructions', {
      methodCode: req.params.methodCode,
      language: req.query.language,
      error: error.message
    });
    
    if (error.message.includes('not found')) {
      return res.status(404).json({
        success: false,
        error: 'Payment method not found',
        message: 'Payment method not found',
        messageBn: 'পেমেন্ট পদ্ধতি তথ্য পাওয়া যায়নি'
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Failed to get payment instructions',
      message: 'Failed to get payment instructions',
      messageBn: 'পেমেন্ট নির্দেশনা আনতে পারা যায়নি'
    });
  }
});

// ============================================================================
// SMS Subscription Endpoints
// ============================================================================

/**
 * GET /api/v1/local-payment/sms-subscription/:userId
 * Get SMS subscription for user
 */
router.get('/sms-subscription/:userId',
  param('userId').isUUID().withMessage('Invalid user ID'),
  handleValidationErrors,
  authMiddleware.authenticate,
  localPaymentRateLimit,
  async (req, res) => {
  try {
    const { userId } = req.params;
    const subscription = await localPaymentService.getSmsSubscription(userId);
    
    if (!subscription) {
      return res.json({
        success: true,
        message: 'No SMS subscription found',
        messageBn: 'কোনো SMS সাবস্ক্রিপশন পাওয়া যায়নি',
        data: null
      });
    }
    
    res.json({
      success: true,
      message: 'SMS subscription retrieved successfully',
      messageBn: 'SMS সাবস্ক্রিপশন তথ্য সফলভাবে পুনরুন',
      data: subscription
    });
  } catch (error) {
    localPaymentLogger.error('[GET /local-payment/sms-subscription/:userId] Error getting SMS subscription', {
      userId: req.params.userId,
      error: error.message
    });
    res.status(500).json({
      success: false,
      error: 'Failed to get SMS subscription',
      message: 'Failed to get SMS subscription',
      messageBn: 'SMS সাবস্ক্রিপশন তথ্য আনতে পারা যায়নি'
    });
  }
});

/**
 * POST /api/v1/local-payment/sms-subscription
 * Create SMS subscription
 */
router.post('/sms-subscription',
  body('userId').isUUID().withMessage('Invalid user ID'),
  body('phoneNumber').isString().notEmpty().withMessage('Invalid phone number'),
  body('paymentMethod').isString().notEmpty().withMessage('Invalid payment method'),
  handleValidationErrors,
  authMiddleware.authenticate,
  localPaymentRateLimit,
  async (req, res) => {
  try {
    const { userId, phoneNumber, paymentMethod } = req.body;
    const subscription = await localPaymentService.createSmsSubscription(userId, phoneNumber, paymentMethod);
    
    res.status(201).json({
      success: true,
      message: 'SMS subscription created successfully',
      messageBn: 'SMS সাবস্ক্রিপশন সফলভাবে তৈরি করা হয়েছে',
      data: subscription
    });
  } catch (error) {
    localPaymentLogger.error('[POST /local-payment/sms-subscription] Error creating SMS subscription', {
      userId: req.body.userId,
      phoneNumber: req.body.phoneNumber,
      paymentMethod: req.body.paymentMethod,
      error: error.message
    });
    
    if (error.message.includes('already has an active')) {
      return res.status(400).json({
        success: false,
        error: error.message,
        message: error.message,
        messageBn: error.message
      });
    }
    
    if (error.message.includes('not found')) {
      return res.status(404).json({
        success: false,
        error: 'Payment method not found',
        message: 'Payment method not found',
        messageBn: 'পেমেন্ট পদ্ধতি তথ্য পাওয়া যায়নি'
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Failed to create SMS subscription',
      message: 'Failed to create SMS subscription',
      messageBn: 'SMS সাবস্ক্রিপশন তৈরি করতে ব্যর্থ হয়েছে'
    });
  }
});

/**
 * PUT /api/v1/local-payment/sms-subscription/:id
 * Update SMS subscription
 */
router.put('/sms-subscription/:id',
  param('id').isUUID().withMessage('Invalid subscription ID'),
  handleValidationErrors,
  authMiddleware.authenticate,
  localPaymentRateLimit,
  async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    const subscription = await localPaymentService.updateSmsSubscription(id, updateData);
    
    res.json({
      success: true,
      message: 'SMS subscription updated successfully',
      messageBn: 'SMS সাবস্ক্রিপশন সফলভাবে আপডেট করা হয়েছে',
      data: subscription
    });
  } catch (error) {
    localPaymentLogger.error('[PUT /local-payment/sms-subscription/:id] Error updating SMS subscription', {
      subscriptionId: req.params.id,
      updateData: req.body,
      error: error.message
    });
    
    if (error.message.includes('not found')) {
      return res.status(404).json({
        success: false,
        error: 'SMS subscription not found',
        message: 'SMS subscription not found',
        messageBn: 'SMS সাবস্ক্রিপশন তথ্য পাওয়া যায়নি'
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Failed to update SMS subscription',
      message: 'Failed to update SMS subscription',
      messageBn: 'SMS সাবস্ক্রিপশন আপডেট করতে ব্যর্থ হয়েছে'
    });
  }
});

/**
 * DELETE /api/v1/local-payment/sms-subscription/:id
 * Cancel SMS subscription
 */
router.delete('/sms-subscription/:id',
  param('id').isUUID().withMessage('Invalid subscription ID'),
  handleValidationErrors,
  authMiddleware.authenticate,
  localPaymentRateLimit,
  async (req, res) => {
  try {
    const { id } = req.params;
    const subscription = await localPaymentService.cancelSmsSubscription(id);
    
    res.json({
      success: true,
      message: 'SMS subscription cancelled successfully',
      messageBn: 'SMS সাবস্ক্রিপশন সফলভাবে বাতিল করা হয়েছে',
      data: subscription
    });
  } catch (error) {
    localPaymentLogger.error('[DELETE /local-payment/sms-subscription/:id] Error cancelling SMS subscription', {
      subscriptionId: req.params.id,
      error: error.message
    });
    
    if (error.message.includes('not found')) {
      return res.status(404).json({
        success: false,
        error: 'SMS subscription not found',
        message: 'SMS subscription not found',
        messageBn: 'SMS সাবস্ক্রিপশন তথ্য পাওয়া যায়নি'
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Failed to cancel SMS subscription',
      message: 'Failed to cancel SMS subscription',
      messageBn: 'SMS সাবস্ক্রিপশন বাতিল করতে ব্যর্থ হয়েছে'
    });
  }
});

// ============================================================================
// Configuration Endpoint
// ============================================================================

/**
 * GET /api/v1/local-payment/configuration
 * Get local payment configuration (for frontend display)
 */
router.get('/configuration', localPaymentRateLimit, async (req, res) => {
  try {
    const configuration = await localPaymentService.getLocalPaymentConfiguration();
    
    res.json({
      success: true,
      message: 'Local payment configuration retrieved successfully',
      messageBn: 'স্থানীয় পেমেন্ট কনফিগারেশন সফলভাবে পুনরুন',
      data: configuration
    });
  } catch (error) {
    localPaymentLogger.error('[GET /local-payment/configuration] Error fetching local payment configuration', {
      error: error.message
    });
    res.status(500).json({
      success: false,
      error: 'Failed to fetch local payment configuration',
      message: 'Failed to fetch local payment configuration',
      messageBn: 'স্থানীয় পেমেন্ট কনফিগারেশন আনতে পারা যায়নি'
    });
  }
});

module.exports = router;
