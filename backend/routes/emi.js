const express = require('express');
const { body, param, query, validationResult } = require('express-validator');
const { authMiddleware } = require('../middleware/auth');
const { rateLimitService } = require('../services/rateLimitService');
const { emiService } = require('../services/emiService');
const { loggerService } = require('../services/logger');

// Logger for EMI routes
const emiLogger = {
  info: (message, data) => loggerService.info(message, data),
  warn: (message, data) => loggerService.warn(message, data),
  error: (message, data) => loggerService.error(message, data)
};

const router = express.Router();

// Rate limiting configuration for EMI endpoints
const emiRateLimitConfig = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 200,
  message: 'Too many EMI requests. Please try again later.',
  messageBn: 'অনেক কার্য অপারেশন। অনুগ্রহ করে পুনরায় চেষ্টা করুন।',
  skipSuccessfulRequests: false
};

// Create rate limiting middleware
const emiRateLimit = rateLimitService.createRateLimit(emiRateLimitConfig);

// Validation middleware
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    // Debug logging for validation errors
    emiLogger.error('[EMI Validation] Validation failed', {
      endpoint: req.path,
      method: req.method,
      query: req.query,
      body: req.body,
      validationErrors: errors.array()
    });
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
// EMI Provider Endpoints
// ============================================================================

/**
 * GET /api/v1/emi/providers
 * Get all EMI providers with optional filtering
 */
router.get('/providers', [
  // No validation required for GET
], emiRateLimit, async (req, res) => {
  try {
    // Extract query parameters for filtering
    const { search, isActive } = req.query;
    
    // Build filters object
    const filters = {};
    if (search) filters.search = search;
    if (isActive !== undefined) filters.isActive = isActive === 'true' || isActive === true;

    const providers = await emiService.getEmiProviders(filters);
    
    res.json({
      success: true,
      message: 'EMI providers retrieved successfully',
      messageBn: 'ইএমআই প্রোভাইডার তালিকা সফলভাবে পুনরুন',
      data: providers
    });
  } catch (error) {
    emiLogger.error('[GET /emi/providers] Error fetching EMI providers', {
      error: error.message,
      stack: error.stack
    });
    
    // Check for specific error types and return appropriate status codes
    const errorMessage = error.message.toLowerCase();
    
    if (errorMessage.includes('not found')) {
      return res.status(404).json({
        success: false,
        error: 'EMI providers not found',
        message: 'EMI providers not found',
        messageBn: 'ইএমআই প্রোভাইডার তালিকা পাওয়া যায়নি'
      });
    }
    
    if (errorMessage.includes('required') ||
        errorMessage.includes('cannot be') ||
        errorMessage.includes('must be') ||
        errorMessage.includes('invalid')) {
      return res.status(400).json({
        success: false,
        error: error.message,
        message: error.message,
        messageBn: error.message
      });
    }
    
    // Default to 500 for unexpected errors
    res.status(500).json({
      success: false,
      error: 'Failed to fetch EMI providers',
      message: 'Failed to fetch EMI providers',
      messageBn: 'ইএমআই প্রোভাইডার তালিকা আনতে পারা যায়নি'
    });
  }
});

/**
 * GET /api/v1/emi/providers/:providerId
 * Get EMI provider by ID
 */
router.get('/providers/:providerId', [
  param('providerId').isUUID().withMessage('Invalid provider ID')
], handleValidationErrors, emiRateLimit, async (req, res) => {
  try {
    const { providerId } = req.params;
    const provider = await emiService.getEmiProviderById(providerId);
    
    res.json({
      success: true,
      message: 'EMI provider retrieved successfully',
      messageBn: 'ইএমআই প্রোভাইডার তথ্য সফলভাবে পুনরুন',
      data: provider
    });
  } catch (error) {
    emiLogger.error('[GET /emi/providers/:providerId] Error fetching EMI provider', {
      providerId: req.params.providerId,
      error: error.message,
      stack: error.stack
    });
    
    // Check for specific error types and return appropriate status codes
    const errorMessage = error.message.toLowerCase();
    
    if (errorMessage.includes('not found')) {
      return res.status(404).json({
        success: false,
        error: 'EMI provider not found',
        message: 'EMI provider not found',
        messageBn: 'ইএমআই প্রোভাইডার তথ্য পাওয়া যায়নি'
      });
    }
    
    if (errorMessage.includes('required') ||
        errorMessage.includes('cannot be') ||
        errorMessage.includes('must be') ||
        errorMessage.includes('invalid')) {
      return res.status(400).json({
        success: false,
        error: error.message,
        message: error.message,
        messageBn: error.message
      });
    }
    
    // Default to 500 for unexpected errors
    res.status(500).json({
      success: false,
      error: 'Failed to fetch EMI provider',
      message: 'Failed to fetch EMI provider',
      messageBn: 'ইএমআই প্রোভাইডার তথ্য আনতে পারা যায়নি'
    });
  }
});

/**
 * POST /api/v1/emi/providers
 * Create a new EMI provider (Admin only)
 */
router.post('/providers', [
  body('name').trim().notEmpty().withMessage('Provider name is required'),
  body('logoUrl').optional().isURL().withMessage('Logo URL must be a valid URL'),
  body('website').optional().isURL().withMessage('Website must be a valid URL'),
  body('minAmount').optional().isFloat({ min: 0 }).withMessage('Minimum amount must be a positive number'),
  body('maxAmount').optional().isFloat({ min: 0 }).withMessage('Maximum amount must be a positive number'),
  body('processingFee').optional().isFloat({ min: 0 }).withMessage('Processing fee must be a positive number'),
  body('interestRate').optional().isFloat({ min: 0 }).withMessage('Interest rate must be a positive number'),
  body('isActive').optional().isBoolean().withMessage('isActive must be a boolean')
], handleValidationErrors, emiRateLimit, async (req, res) => {
  try {
    const provider = await emiService.createEmiProvider(req.body);
    
    res.status(201).json({
      success: true,
      message: 'EMI provider created successfully',
      messageBn: 'ইএমআই প্রোভাইডার সফলভাবে তৈরি করা হয়েছে',
      data: provider
    });
  } catch (error) {
    emiLogger.error('[POST /emi/providers] Error creating EMI provider', {
      error: error.message
    });
    
    if (error.message.includes('not found')) {
      return res.status(404).json({
        success: false,
        error: error.message,
        message: error.message,
        messageBn: error.message
      });
    }
    
    if (error.message.includes('required') || 
        error.message.includes('cannot be') || 
        error.message.includes('must be')) {
      return res.status(400).json({
        success: false,
        error: error.message,
        message: error.message,
        messageBn: error.message
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Failed to create EMI provider',
      message: 'Failed to create EMI provider',
      messageBn: 'ইএমআই প্রোভাইডার তৈরি করতে ব্যর্থ হয়েছে'
    });
  }
});

/**
 * PUT /api/v1/emi/providers/:providerId
 * Update an EMI provider (Admin only)
 */
router.put('/providers/:providerId', [
  param('providerId').isUUID().withMessage('Invalid provider ID'),
  body('name').optional().trim().notEmpty().withMessage('Provider name cannot be empty'),
  body('logoUrl').optional().isURL().withMessage('Logo URL must be a valid URL'),
  body('website').optional().isURL().withMessage('Website must be a valid URL'),
  body('minAmount').optional().isFloat({ min: 0 }).withMessage('Minimum amount must be a positive number'),
  body('maxAmount').optional().isFloat({ min: 0 }).withMessage('Maximum amount must be a positive number'),
  body('processingFee').optional().isFloat({ min: 0 }).withMessage('Processing fee must be a positive number'),
  body('interestRate').optional().isFloat({ min: 0 }).withMessage('Interest rate must be a positive number'),
  body('isActive').optional().isBoolean().withMessage('isActive must be a boolean')
], handleValidationErrors, emiRateLimit, async (req, res) => {
  try {
    const { providerId } = req.params;
    const provider = await emiService.updateEmiProvider(providerId, req.body);
    
    res.json({
      success: true,
      message: 'EMI provider updated successfully',
      messageBn: 'ইএমআই প্রোভাইডার সফলভাবে আপডেট করা হয়েছে',
      data: provider
    });
  } catch (error) {
    emiLogger.error('[PUT /emi/providers/:providerId] Error updating EMI provider', {
      providerId: req.params.providerId,
      error: error.message
    });
    
    if (error.message.includes('not found')) {
      return res.status(404).json({
        success: false,
        error: error.message,
        message: error.message,
        messageBn: error.message
      });
    }
    
    if (error.message.includes('cannot be') || error.message.includes('must be')) {
      return res.status(400).json({
        success: false,
        error: error.message,
        message: error.message,
        messageBn: error.message
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Failed to update EMI provider',
      message: 'Failed to update EMI provider',
      messageBn: 'ইএমআই প্রোভাইডার আপডেট করতে ব্যর্থ হয়েছে'
    });
  }
});

/**
 * DELETE /api/v1/emi/providers/:providerId
 * Delete an EMI provider (Admin only)
 */
router.delete('/providers/:providerId', [
  param('providerId').isUUID().withMessage('Invalid provider ID')
], handleValidationErrors, emiRateLimit, async (req, res) => {
  try {
    const { providerId } = req.params;
    const provider = await emiService.deleteEmiProvider(providerId);
    
    res.json({
      success: true,
      message: 'EMI provider deleted successfully',
      messageBn: 'ইএমআই প্রোভাইডার সফলভাবে মুছে ফেলা হয়েছে',
      data: provider
    });
  } catch (error) {
    emiLogger.error('[DELETE /emi/providers/:providerId] Error deleting EMI provider', {
      providerId: req.params.providerId,
      error: error.message
    });
    
    if (error.message.includes('not found')) {
      return res.status(404).json({
        success: false,
        error: error.message,
        message: error.message,
        messageBn: error.message
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Failed to delete EMI provider',
      message: 'Failed to delete EMI provider',
      messageBn: 'ইএমআই প্রোভাইডার মুছে ফেলতে ব্যর্থ হয়েছে'
    });
  }
});

// ============================================================================
// EMI Plan Endpoints
// ============================================================================

/**
 * GET /api/v1/emi/plans
 * Get all EMI plans with optional filtering
 */
router.get('/plans', [
  // No validation required for GET
], emiRateLimit, async (req, res) => {
  try {
    // Extract query parameters for filtering
    const { search, isActive, providerId } = req.query;
    
    // Build filters object
    const filters = {};
    if (search) filters.search = search;
    if (isActive !== undefined) filters.isActive = isActive === 'true' || isActive === true;
    if (providerId) filters.providerId = providerId;

    const plans = await emiService.getEmiPlans(filters);
    
    res.json({
      success: true,
      message: 'EMI plans retrieved successfully',
      messageBn: 'ইএমআই প্ল্যানগুলি সফলভাবে পুনরুন',
      data: plans
    });
  } catch (error) {
    emiLogger.error('[GET /emi/plans] Error fetching EMI plans', {
      error: error.message,
      stack: error.stack
    });
    
    // Check for specific error types and return appropriate status codes
    const errorMessage = error.message.toLowerCase();
    
    if (errorMessage.includes('not found')) {
      return res.status(404).json({
        success: false,
        error: 'EMI plan not found',
        message: 'EMI plan not found',
        messageBn: 'ইএমআই প্ল্যানটি পাওয়া যায়নি'
      });
    }
    
    if (errorMessage.includes('required') ||
        errorMessage.includes('cannot be') ||
        errorMessage.includes('must be') ||
        errorMessage.includes('invalid')) {
      return res.status(400).json({
        success: false,
        error: error.message,
        message: error.message,
        messageBn: error.message
      });
    }
    
    // Default to 500 for unexpected errors
    res.status(500).json({
      success: false,
      error: 'Failed to fetch EMI plans',
      message: 'Failed to fetch EMI plans',
      messageBn: 'ইএমআই প্ল্যানগুলি আনতে পারা যায়নি'
    });
  }
});

/**
 * GET /api/v1/emi/plans/:planId
 * Get EMI plan by ID
 */
router.get('/plans/:planId', [
  param('planId').isUUID().withMessage('Invalid plan ID')
], handleValidationErrors, emiRateLimit, async (req, res) => {
  try {
    const { planId } = req.params;
    const plan = await emiService.getEmiPlanById(planId);
    
    res.json({
      success: true,
      message: 'EMI plan retrieved successfully',
      messageBn: 'ইএমআই প্ল্যানটি সফলভাবে পুনরুন',
      data: plan
    });
  } catch (error) {
    emiLogger.error('[GET /emi/plans/:planId] Error fetching EMI plan', {
      planId: req.params.planId,
      error: error.message
    });
    
    if (error.message.includes('not found')) {
      return res.status(404).json({
        success: false,
        error: 'EMI plan not found',
        message: 'EMI plan not found',
        messageBn: 'ইএমআই প্ল্যানটি পাওয়া যায়নি'
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Failed to fetch EMI plan',
      message: 'Failed to fetch EMI plan',
      messageBn: 'ইএমআই প্ল্যানটি আনতে পারা যায়নি'
    });
  }
});

/**
 * POST /api/v1/emi/plans
 * Create a new EMI plan (Admin only)
 */
router.post('/plans', [
  body('providerId').isUUID().withMessage('Invalid provider ID'),
  body('name').trim().notEmpty().withMessage('Plan name is required'),
  body('duration').isInt({ min: 1 }).withMessage('Duration must be a positive integer'),
  body('interestRate').isFloat({ min: 0 }).withMessage('Interest rate must be a positive number'),
  body('minAmount').isFloat({ min: 0 }).withMessage('Minimum amount must be a positive number'),
  body('maxAmount').isFloat({ min: 0 }).withMessage('Maximum amount must be a positive number'),
  body('processingFee').optional().isFloat({ min: 0 }).withMessage('Processing fee must be a positive number'),
  body('downPayment').optional().isFloat({ min: 0 }).withMessage('Down payment must be a positive number'),
  body('isActive').optional().isBoolean().withMessage('isActive must be a boolean'),
  body('displayOrder').optional().isInt({ min: 0 }).withMessage('Display order must be a positive integer')
], handleValidationErrors, emiRateLimit, async (req, res) => {
  try {
    // Debug logging to diagnose validation issues
    emiLogger.info('[POST /emi/plans] Request body received', {
      body: req.body,
      bodyTypes: Object.keys(req.body).reduce((acc, key) => {
        acc[key] = typeof req.body[key];
        return acc;
      }, {})
    });

    const plan = await emiService.createEmiPlan(req.body);
    
    res.status(201).json({
      success: true,
      message: 'EMI plan created successfully',
      messageBn: 'ইএমআই প্ল্যান সফলভাবে তৈরি করা হয়েছে',
      data: plan
    });
  } catch (error) {
    emiLogger.error('[POST /emi/plans] Error creating EMI plan', {
      error: error.message,
      stack: error.stack,
      body: req.body
    });
    
    if (error.message.includes('not found')) {
      return res.status(404).json({
        success: false,
        error: error.message,
        message: error.message,
        messageBn: error.message
      });
    }
    
    if (error.message.includes('required') || error.message.includes('cannot be') || error.message.includes('must be')) {
      return res.status(400).json({
        success: false,
        error: error.message,
        message: error.message,
        messageBn: error.message
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Failed to create EMI plan',
      message: 'Failed to create EMI plan',
      messageBn: 'ইএমআই প্ল্যান তৈরি করতে ব্যর্থ হয়েছে'
    });
  }
});

/**
 * PUT /api/v1/emi/plans/:planId
 * Update an EMI plan (Admin only)
 */
router.put('/plans/:planId', [
  param('planId').isUUID().withMessage('Invalid plan ID'),
  body('name').optional().trim().notEmpty().withMessage('Plan name cannot be empty'),
  body('duration').optional().isInt({ min: 1 }).withMessage('Duration must be a positive integer'),
  body('interestRate').optional().isFloat({ min: 0 }).withMessage('Interest rate must be a positive number'),
  body('minAmount').optional().isFloat({ min: 0 }).withMessage('Minimum amount must be a positive number'),
  body('maxAmount').optional().isFloat({ min: 0 }).withMessage('Maximum amount must be a positive number'),
  body('processingFee').optional().isFloat({ min: 0 }).withMessage('Processing fee must be a positive number'),
  body('downPayment').optional().isFloat({ min: 0 }).withMessage('Down payment must be a positive number'),
  body('isActive').optional().isBoolean().withMessage('isActive must be a boolean'),
  body('displayOrder').optional().isInt({ min: 0 }).withMessage('Display order must be a positive integer')
], handleValidationErrors, emiRateLimit, async (req, res) => {
  try {
    const { planId } = req.params;
    const plan = await emiService.updateEmiPlan(planId, req.body);
    
    res.json({
      success: true,
      message: 'EMI plan updated successfully',
      messageBn: 'ইএমআই প্ল্যান সফলভাবে আপডেট করা হয়েছে',
      data: plan
    });
  } catch (error) {
    emiLogger.error('[PUT /emi/plans/:planId] Error updating EMI plan', {
      planId: req.params.planId,
      error: error.message
    });
    
    if (error.message.includes('not found')) {
      return res.status(404).json({
        success: false,
        error: error.message,
        message: error.message,
        messageBn: error.message
      });
    }
    
    if (error.message.includes('cannot be') || error.message.includes('must be')) {
      return res.status(400).json({
        success: false,
        error: error.message,
        message: error.message,
        messageBn: error.message
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Failed to update EMI plan',
      message: 'Failed to update EMI plan',
      messageBn: 'ইএমআই প্ল্যান আপডেট করতে ব্যর্থ হয়েছে'
    });
  }
});

/**
 * DELETE /api/v1/emi/plans/:planId
 * Delete an EMI plan (Admin only)
 */
router.delete('/plans/:planId', [
  param('planId').isUUID().withMessage('Invalid plan ID')
], handleValidationErrors, emiRateLimit, async (req, res) => {
  console.log('[PUBLIC EMI DELETE] Route handler invoked for:', req.params.planId);
  console.log('[PUBLIC EMI DELETE] Full URL:', req.originalUrl);
  try {
    const { planId } = req.params;
    const plan = await emiService.deleteEmiPlan(planId);
    
    res.json({
      success: true,
      message: 'EMI plan deleted successfully',
      messageBn: 'ইএমআই প্ল্যান সফলভাবে মুছে ফেলা হয়েছে',
      data: plan
    });
  } catch (error) {
    emiLogger.error('[DELETE /emi/plans/:planId] Error deleting EMI plan', {
      planId: req.params.planId,
      error: error.message
    });
    
    if (error.message.includes('not found')) {
      return res.status(404).json({
        success: false,
        error: error.message,
        message: error.message,
        messageBn: error.message
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Failed to delete EMI plan',
      message: 'Failed to delete EMI plan',
      messageBn: 'ইএমআই প্ল্যান মুছে ফেলতে ব্যর্থ হয়েছে'
    });
  }
});

// ============================================================================
// EMI Calculation Endpoints
// ============================================================================

/**
 * GET /api/v1/emi/calculate
 * Calculate EMI for a given amount and plan
 * Query: { amount, planId }
 */
router.get('/calculate', [
  query('amount').isFloat({ min: 0 }).withMessage('Invalid amount'),
  query('planId').optional().isString().withMessage('Invalid plan ID')
], handleValidationErrors, emiRateLimit, async (req, res) => {
  try {
    const { amount, planId } = req.query;
    
    if (!planId) {
      // Get all available plans for the amount
      const availablePlans = await emiService.getAvailableEmiPlans(amount);
      
      return res.json({
        success: true,
        message: 'Available EMI plans retrieved',
        messageBn: 'উপলব্ধ ইএমআই প্ল্যানগুলি পুনরুন',
        data: {
          amount: parseFloat(amount),
          availablePlans
        }
      });
    }
    
    // Get detailed EMI calculation for specific plan
    const emiDetails = await emiService.getEmiDetails(planId, amount);
    
    res.json({
      success: true,
      message: 'EMI calculated successfully',
      messageBn: 'ইএমআই সফলভাবে হিসাব করা হয়েছে',
      data: emiDetails
    });
  } catch (error) {
    emiLogger.error('[GET /emi/calculate] Error calculating EMI', {
      amount: req.query.amount,
      planId: req.query.planId,
      error: error.message
    });
    
    if (error.message.includes('not found')) {
      return res.status(404).json({
        success: false,
        error: 'EMI plan not found',
        message: 'EMI plan not found',
        messageBn: 'ইএমআই প্ল্যানটি পাওয়া যায়নি'
      });
    }
    
    if (error.message.includes('not active')) {
      return res.status(400).json({
        success: false,
        error: 'EMI plan is not active',
        message: 'EMI plan is not active',
        messageBn: 'ইএমআই প্ল্যানটি সক্রিয় নেই'
      });
    }
    
    if (error.message.includes('between')) {
      return res.status(400).json({
        success: false,
        error: 'Amount not eligible for this plan',
        message: error.message,
        messageBn: 'এই প্ল্যানের জন্য পরিমাণটি উপযুক্ত নয়'
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Failed to calculate EMI',
      message: 'Failed to calculate EMI',
      messageBn: 'ইএমআই হিসাব করতে ব্যর্থ হয়েছে'
    });
  }
});

/**
 * GET /api/v1/emi/eligibility/:amount
 * Check EMI eligibility for a given amount
 */
router.get('/eligibility/:amount', [
  param('amount').isFloat({ min: 0 }).withMessage('Invalid amount'),
  query('planId').optional().isString().withMessage('Invalid plan ID')
], handleValidationErrors, emiRateLimit, async (req, res) => {
  try {
    const { amount } = req.params;
    const { planId } = req.query;
    
    const eligibility = await emiService.validateEmiEligibility(amount, planId);
    
    res.json({
      success: true,
      message: 'EMI eligibility checked',
      messageBn: 'ইএমআই যোগ্যতা পরীক্ষা করা হয়েছে',
      data: eligibility
    });
  } catch (error) {
    emiLogger.error('[GET /emi/eligibility/:amount] Error checking EMI eligibility', {
      amount: req.params.amount,
      planId: req.query.planId,
      error: error.message,
      stack: error.stack
    });
    
    // Check for specific error types and return appropriate status codes
    const errorMessage = error.message.toLowerCase();
    
    if (errorMessage.includes('not found')) {
      return res.status(404).json({
        success: false,
        error: 'EMI plan not found',
        message: 'EMI plan not found',
        messageBn: 'ইএমআই প্ল্যানটি পাওয়া যায়নি'
      });
    }
    
    if (errorMessage.includes('not active')) {
      return res.status(400).json({
        success: false,
        error: 'EMI plan is not active',
        message: 'EMI plan is not active',
        messageBn: 'ইএমআই প্ল্যানটি সক্রিয় নেই'
      });
    }
    
    if (errorMessage.includes('between') || errorMessage.includes('not eligible')) {
      return res.status(400).json({
        success: false,
        error: 'Amount not eligible for this plan',
        message: error.message,
        messageBn: 'এই প্ল্যানের জন্য পরিমাণটি উপযুক্ত নয়'
      });
    }
    
    if (errorMessage.includes('required') ||
        errorMessage.includes('cannot be') ||
        errorMessage.includes('must be') ||
        errorMessage.includes('invalid')) {
      return res.status(400).json({
        success: false,
        error: error.message,
        message: error.message,
        messageBn: error.message
      });
    }
    
    // Default to 500 for unexpected errors
    res.status(500).json({
      success: false,
      error: 'Failed to check EMI eligibility',
      message: 'Failed to check EMI eligibility',
      messageBn: 'ইএমআই যোগ্যতা পরীক্ষা করতে ব্যর্থ হয়েছে'
    });
  }
});

/**
 * GET /api/v1/emi/available/:amount
 * Get available EMI plans for a given amount
 */
router.get('/available/:amount', [
  param('amount').isFloat({ min: 0 }).withMessage('Invalid amount')
], handleValidationErrors, emiRateLimit, async (req, res) => {
  try {
    const { amount } = req.params;
    const availablePlans = await emiService.getAvailableEmiPlans(amount);
    
    res.json({
      success: true,
      message: 'Available EMI plans retrieved',
      messageBn: 'উপলব্ধ ইএমআই প্ল্যানগুলি পুনরুন',
      data: {
        amount: parseFloat(amount),
        plans: availablePlans
      }
    });
  } catch (error) {
    emiLogger.error('[GET /emi/available/:amount] Error fetching available EMI plans', {
      amount: req.params.amount,
      error: error.message,
      stack: error.stack
    });
    
    // Check for specific error types and return appropriate status codes
    const errorMessage = error.message.toLowerCase();
    
    if (errorMessage.includes('not found')) {
      return res.status(404).json({
        success: false,
        error: 'No EMI plans available',
        message: 'No EMI plans available',
        messageBn: 'কোন ইএমআই প্ল্যান উপলব্ধ নেই'
      });
    }
    
    if (errorMessage.includes('required') ||
        errorMessage.includes('cannot be') ||
        errorMessage.includes('must be') ||
        errorMessage.includes('invalid')) {
      return res.status(400).json({
        success: false,
        error: error.message,
        message: error.message,
        messageBn: error.message
      });
    }
    
    // Default to 500 for unexpected errors
    res.status(500).json({
      success: false,
      error: 'Failed to fetch available EMI plans',
      message: 'Failed to fetch available EMI plans',
      messageBn: 'উপলব্ধ ইএমআই প্ল্যানগুলি আনতে পারা যায়নি'
    });
  }
});

// ============================================================================
// EMI Configuration Endpoint
// ============================================================================

/**
 * GET /api/v1/emi/configuration
 * Get EMI configuration (for frontend display)
 */
router.get('/configuration', [
  // No validation required for GET
], emiRateLimit, async (req, res) => {
  try {
    const configuration = await emiService.getEmiConfiguration();
    
    res.json({
      success: true,
      message: 'EMI configuration retrieved successfully',
      messageBn: 'ইএমআই কনফিগারেশন সফলভাবে পুনরুন',
      data: configuration
    });
  } catch (error) {
    emiLogger.error('[GET /emi/configuration] Error fetching EMI configuration', {
      error: error.message,
      stack: error.stack
    });
    
    // Check for specific error types and return appropriate status codes
    const errorMessage = error.message.toLowerCase();
    
    if (errorMessage.includes('not found')) {
      return res.status(404).json({
        success: false,
        error: 'EMI configuration not found',
        message: 'EMI configuration not found',
        messageBn: 'ইএমআই কনফিগারেশন পাওয়া যায়নি'
      });
    }
    
    if (errorMessage.includes('required') ||
        errorMessage.includes('cannot be') ||
        errorMessage.includes('must be') ||
        errorMessage.includes('invalid')) {
      return res.status(400).json({
        success: false,
        error: error.message,
        message: error.message,
        messageBn: error.message
      });
    }
    
    // Default to 500 for unexpected errors
    res.status(500).json({
      success: false,
      error: 'Failed to fetch EMI configuration',
      message: 'Failed to fetch EMI configuration',
      messageBn: 'ইএমআই কনফিগারেশন আনতে পারা যায়নি'
    });
  }
});

module.exports = router;
