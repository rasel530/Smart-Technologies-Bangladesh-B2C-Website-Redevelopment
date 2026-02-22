const express = require('express');
const { body, param, query, validationResult } = require('express-validator');
const { authMiddleware } = require('../middleware/auth');
const { rateLimitService } = require('../services/rateLimitService');
const { codService } = require('../services/codService');
const { loggerService } = require('../services/logger');

// Logger for COD routes
const codLogger = {
  info: (message, data) => loggerService.info(message, data),
  warn: (message, data) => loggerService.warn(message, data),
  error: (message, data) => loggerService.error(message, data)
};

const router = express.Router();

// Rate limiting configuration for COD endpoints
const codRateLimitConfig = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 200,
  message: 'Too many COD requests. Please try again later.',
  messageBn: 'অনেক কার্য অপারেশন। অনুগ্রহ করে পুনরায় চেষ্টা করুন।',
  skipSuccessfulRequests: false
};

// Create rate limiting middleware
const codRateLimit = rateLimitService.createRateLimit(codRateLimitConfig);

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
// COD Settings Endpoints
// ============================================================================

/**
 * GET /api/v1/cod/settings
 * Get COD settings
 */
router.get('/settings', [
  // No validation required for GET
], codRateLimit, async (req, res) => {
  try {
    const settings = await codService.getCodSettings();
    
    res.json({
      success: true,
      message: 'COD settings retrieved successfully',
      messageBn: 'ক্যাশ অন ডেলিভারি সেটিংস সফলভাবে পুনরুন',
      data: settings
    });
  } catch (error) {
    codLogger.error('[GET /cod/settings] Error fetching COD settings', {
      error: error.message
    });
    res.status(500).json({
      success: false,
      error: 'Failed to fetch COD settings',
      message: 'Failed to fetch COD settings',
      messageBn: 'ক্যাশ অন ডেলিভারি সেটিংস আনতে পারা যায়নি'
    });
  }
});

/**
 * GET /api/v1/cod/configuration
 * Get COD configuration (for frontend display)
 */
router.get('/configuration', [
  // No validation required for GET
], codRateLimit, async (req, res) => {
  try {
    const configuration = await codService.getCodConfiguration();
    
    res.json({
      success: true,
      message: 'COD configuration retrieved successfully',
      messageBn: 'ক্যাশ অন ডেলিভারি কনফিগারেশন সফলভাবে পুনরুন',
      data: configuration
    });
  } catch (error) {
    codLogger.error('[GET /cod/configuration] Error fetching COD configuration', {
      error: error.message
    });
    res.status(500).json({
      success: false,
      error: 'Failed to fetch COD configuration',
      message: 'Failed to fetch COD configuration',
      messageBn: 'ক্যাশ অন ডেলিভারি কনফিগারেশন আনতে পারা যায়নি'
    });
  }
});

// ============================================================================
// COD Availability Endpoints
// ============================================================================

/**
 * GET /api/v1/cod/availability
 * Check COD availability for address and amount
 * Query: { division, amount }
 */
router.get('/availability', [
  query('division').optional().isString().withMessage('Invalid division'),
  query('amount').isFloat({ min: 0 }).withMessage('Invalid amount')
], handleValidationErrors, codRateLimit, async (req, res) => {
  try {
    const { division, amount } = req.query;
    
    const address = division ? { division } : null;
    const availability = await codService.isCodAvailable(address, amount);
    
    res.json({
      success: true,
      message: 'COD availability checked',
      messageBn: 'ক্যাশ অন ডেলিভারি উপলব্ধতা পরীক্ষা করা হয়েছে',
      data: availability
    });
  } catch (error) {
    codLogger.error('[GET /cod/availability] Error checking COD availability', {
      query: req.query,
      error: error.message
    });
    res.status(500).json({
      success: false,
      error: 'Failed to check COD availability',
      message: 'Failed to check COD availability',
      messageBn: 'ক্যাশ অন ডেলিভারি উপলব্ধতা পরীক্ষা করতে ব্যর্থ হয়েছে'
    });
  }
});

/**
 * GET /api/v1/cod/validate
 * Validate COD order
 * Query: { userId, division, amount }
 */
router.get('/validate', [
  query('userId').optional().isUUID().withMessage('Invalid user ID'),
  query('division').optional().isString().withMessage('Invalid division'),
  query('amount').isFloat({ min: 0 }).withMessage('Invalid amount')
], handleValidationErrors, codRateLimit, async (req, res) => {
  try {
    const { userId, division, amount } = req.query;
    
    const address = division ? { division } : null;
    const validation = await codService.validateCodOrder(userId, address, amount);
    
    res.json({
      success: true,
      message: 'COD order validated',
      messageBn: 'ক্যাশ অন ডেলিভারি অর্ডার যাচাই করা হয়েছে',
      data: validation
    });
  } catch (error) {
    codLogger.error('[GET /cod/validate] Error validating COD order', {
      query: req.query,
      error: error.message
    });
    res.status(500).json({
      success: false,
      error: 'Failed to validate COD order',
      message: 'Failed to validate COD order',
      messageBn: 'ক্যাশ অন ডেলিভারি অর্ডার যাচাই করতে ব্যর্থ হয়েছে'
    });
  }
});

// ============================================================================
// COD Fee Endpoints
// ============================================================================

/**
 * GET /api/v1/cod/fee/:amount
 * Calculate COD fee for a given amount
 */
router.get('/fee/:amount', [
  param('amount').isFloat({ min: 0 }).withMessage('Invalid amount')
], handleValidationErrors, codRateLimit, async (req, res) => {
  try {
    const { amount } = req.params;
    const fee = await codService.calculateCodFee(amount);
    
    res.json({
      success: true,
      message: 'COD fee calculated',
      messageBn: 'ক্যাশ অন ডেলিভারি ফি হিসাব করা হয়েছে',
      data: {
        amount: parseFloat(amount),
        fee
      }
    });
  } catch (error) {
    codLogger.error('[GET /cod/fee/:amount] Error calculating COD fee', {
      amount: req.params.amount,
      error: error.message
    });
    res.status(500).json({
      success: false,
      error: 'Failed to calculate COD fee',
      message: 'Failed to calculate COD fee',
      messageBn: 'ক্যাশ অন ডেলিভারি ফি হিসাব করতে ব্যর্থ হয়েছে'
    });
  }
});

// ============================================================================
// COD Limit Endpoints
// ============================================================================

/**
 * GET /api/v1/cod/limit/:userId
 * Check COD order limits for a user
 */
router.get('/limit/:userId', [
  param('userId').isUUID().withMessage('Invalid user ID')
], handleValidationErrors, codRateLimit, async (req, res) => {
  try {
    const { userId } = req.params;
    const limitCheck = await codService.checkCodLimit(userId);
    
    res.json({
      success: true,
      message: 'COD limit checked',
      messageBn: 'ক্যাশ অন ডেলিভারি সীমা পরীক্ষা করা হয়েছে',
      data: limitCheck
    });
  } catch (error) {
    codLogger.error('[GET /cod/limit/:userId] Error checking COD limit', {
      userId: req.params.userId,
      error: error.message
    });
    res.status(500).json({
      success: false,
      error: 'Failed to check COD limit',
      message: 'Failed to check COD limit',
      messageBn: 'ক্যাশ অন ডেলিভারি সীমা পরীক্ষা করতে ব্যর্থ হয়েছে'
    });
  }
});

module.exports = router;
