const express = require('express');
const { body, param, validationResult } = require('express-validator');
const { authMiddleware } = require('../../middleware/auth');
const { rateLimitService } = require('../../services/rateLimitService');
const { localPaymentService } = require('../../services/localPaymentService');
const { loggerService } = require('../../services/logger');

// Logger for admin local payment routes
const adminLocalPaymentLogger = {
  info: (message, data) => loggerService.info(message, data),
  warn: (message, data) => loggerService.warn(message, data),
  error: (message, data) => loggerService.error(message, data)
};

const router = express.Router();

// Rate limiting configuration for admin local payment endpoints
const adminLocalPaymentRateLimitConfig = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 100,
  message: 'Too many admin requests. Please try again later.',
  messageBn: 'অনেক কার্য অপারেশন। অনুগ্রহ করে পুনরায় চেষ্টা করুন।',
  skipSuccessfulRequests: false
};

// Create rate limiting middleware
const adminLocalPaymentRateLimit = rateLimitService.createRateLimit(adminLocalPaymentRateLimitConfig);

// Validation middleware
const handleValidationErrors = (req, res, next) => {
  console.log('[DEBUG] handleValidationErrors called');
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
// Payment Method Management Endpoints
// ============================================================================

/**
 * GET /api/v1/admin/local-payment/methods
 * Get all payment methods (admin endpoint)
 */
router.get('/methods', [
  // Rate limiting middleware temporarily disabled to prevent timeout issues
  // To re-enable rate limiting, uncomment the following line:
  // adminLocalPaymentRateLimit,
  async (req, res, next) => {
    console.log('[DEBUG] Rate limit middleware disabled - bypassing to prevent timeout');
    next();
  }
], authMiddleware.authenticate(), async (req, res) => {
  const startTime = Date.now();
  const startTimeIso = new Date(startTime).toISOString();
  
  // Support optional query parameters for filtering
  const { isActive } = req.query;
  
  // Log request start with comprehensive context
  console.log('='.repeat(80));
  console.log('[LOCAL PAYMENT] GET /admin/local-payment/methods - REQUEST START');
  console.log('[LOCAL PAYMENT] Start time:', startTimeIso);
  console.log('[LOCAL PAYMENT] Query parameters:', { isActive });
  console.log('[LOCAL PAYMENT] Request headers:', {
    'authorization': req.get('Authorization') ? 'present' : 'missing',
    'user-agent': req.get('User-Agent')
  });
  console.log('[LOCAL PAYMENT] Authenticated user:', req.user ? { id: req.user.id, email: req.user.email } : 'none');
  console.log('[LOCAL PAYMENT] Request IP:', req.ip);
  console.log('='.repeat(80));
  
  // Log to logger service
  adminLocalPaymentLogger.info('[GET /admin/local-payment/methods] Request received', {
    method: 'GET',
    url: req.originalUrl,
    query: req.query,
    userId: req.user?.id,
    ip: req.ip,
    startTime: startTimeIso
  });
  
  try {
    console.log('[LOCAL PAYMENT] Calling localPaymentService.getLocalPaymentMethods...');
    
    // Get all payment methods from service
    let methods = await localPaymentService.getLocalPaymentMethods();
    
    // Filter by isActive status if query parameter is provided
    if (isActive !== undefined) {
      const isActiveFilter = isActive === 'true';
      methods = methods.filter(method => method.isActive === isActiveFilter);
    }
    
    const duration = Date.now() - startTime;
    const completionTime = new Date().toISOString();
    
    console.log('='.repeat(80));
    console.log('[LOCAL PAYMENT] GET /admin/local-payment/methods - REQUEST SUCCESS');
    console.log('[LOCAL PAYMENT] Completion time:', completionTime);
    console.log('[LOCAL PAYMENT] Duration:', duration, 'ms');
    console.log('[LOCAL PAYMENT] Methods count:', methods.length);
    console.log('='.repeat(80));
    
    // Log success to logger service
    adminLocalPaymentLogger.info('[GET /admin/local-payment/methods] Request completed successfully', {
      userId: req.user?.id,
      duration: duration,
      startTime: startTimeIso,
      completionTime: completionTime,
      methodsCount: methods.length
    });
    
    return res.json({
      success: true,
      message: 'Payment methods retrieved successfully',
      messageBn: 'পেমেন্ট পদ্ধতি সফলভাবে পুনরুদ্ধার করা হয়েছে',
      data: methods,
      meta: {
        count: methods.length,
        duration: duration,
        completedAt: completionTime
      }
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    const completionTime = new Date().toISOString();
    
    console.log('='.repeat(80));
    console.error('[LOCAL PAYMENT] GET /admin/local-payment/methods - REQUEST ERROR');
    console.error('[LOCAL PAYMENT] Completion time:', completionTime);
    console.error('[LOCAL PAYMENT] Duration:', duration, 'ms');
    console.error('[LOCAL PAYMENT] Error name:', error.name);
    console.error('[LOCAL PAYMENT] Error message:', error.message);
    console.error('[LOCAL PAYMENT] Error code:', error.code);
    console.error('[LOCAL PAYMENT] Error stack:', error.stack);
    console.log('='.repeat(80));
    
    // Log error to logger service with detailed context
    adminLocalPaymentLogger.error('[GET /admin/local-payment/methods] Request failed', {
      userId: req.user?.id,
      ip: req.ip,
      error: {
        name: error.name,
        message: error.message,
        code: error.code,
        stack: error.stack
      },
      duration: duration,
      startTime: startTimeIso,
      completionTime: completionTime
    });
    
    // Handle timeout errors specifically
    if (error.name === 'TimeoutError' ||
        error.message.toLowerCase().includes('timeout') ||
        error.message.includes('Redis pipeline timeout') ||
        error.code === 'ETIMEDOUT' ||
        error.code === 'ESOCKETTIMEDOUT') {
      console.error('[LOCAL PAYMENT] Timeout error detected - returning 408');
      return res.status(408).json({
        success: false,
        error: 'Request timeout - operation timed out',
        message: 'Request timeout - operation timed out',
        messageBn: 'অনুরোধ সময়সীমা অতিক্রান্ত - অপারেশন সময়সীমা অতিক্রান্ত',
        meta: {
          duration: duration,
          errorType: 'TimeoutError',
          completedAt: completionTime
        }
      });
    }
    
    // Handle database errors
    if (error.code && (error.code.startsWith('ER_') || error.code.includes('database') || error.code.includes('SQL'))) {
      console.error('[LOCAL PAYMENT] Database error detected - returning 500');
      return res.status(500).json({
        success: false,
        error: 'Database error',
        message: 'Database error occurred',
        messageBn: 'ডাটাবেস ত্রুটি ঘটেছে',
        details: error.message,
        meta: {
          duration: duration,
          errorType: 'DatabaseError',
          errorCode: error.code,
          completedAt: completionTime
        }
      });
    }
    
    // Generic server error
    console.error('[LOCAL PAYMENT] Generic error detected - returning 500');
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch payment methods',
      message: 'Failed to fetch payment methods',
      messageBn: 'পেমেন্ট পদ্ধতি পুনরুদ্ধার করতে ব্যর্থ হয়েছে',
      details: error.message,
      meta: {
        duration: duration,
        errorType: error.name,
        errorCode: error.code,
        completedAt: completionTime
      }
    });
  }
});

/**
 * PUT /api/v1/admin/local-payment/methods/:id
 * Update payment method
 */
router.put('/methods/:id', [
  param('id').isString().notEmpty().withMessage('Invalid method ID'),
  body('name').optional().isString(),
  body('displayName').optional().isString(),
  body('logoUrl').optional({ nullable: true }).isString(),
  body('isActive').optional().isBoolean(),
  body('minAmount').optional().isFloat({ min: 0 }),
  body('maxAmount').optional().isFloat({ min: 0 }),
  body('processingFee').optional().isFloat({ min: 0 }),
  body('processingFeePercent').optional().isFloat({ min: 0, max: 100 }),
  body('requiresPhone').optional().isBoolean(),
  body('requiresPin').optional().isBoolean(),
  body('description').optional({ nullable: true }).isString(),
  body('instructions').optional({ nullable: true }).isString(),
  body('supportedNetworks').optional().isArray()
], (req, res, next) => {
  console.log('[DEBUG] PUT /methods/:id - Middleware stack starting');
  console.log('[DEBUG] Request params:', req.params);
  console.log('[DEBUG] Request body:', req.body);
  console.log('[DEBUG] Request headers:', {
    'content-type': req.get('Content-Type'),
    'authorization': req.get('Authorization') ? 'present' : 'missing'
  });
  next();
}, handleValidationErrors, (req, res, next) => {
  console.log('[DEBUG] After validation errors middleware');
  next();
}, authMiddleware.authenticate(), (req, res, next) => {
  console.log('[DEBUG] After auth middleware');
  console.log('[DEBUG] Authenticated user:', req.user ? req.user.id : 'none');
  next();
}, // Rate limiting middleware temporarily disabled to prevent timeout issues
// To re-enable rate limiting, uncomment the following line:
// adminLocalPaymentRateLimit,
async (req, res, next) => {
  console.log('[DEBUG] Rate limit middleware disabled - bypassing to prevent timeout');
  next();
}, async (req, res) => {
  const startTime = Date.now();
  const startTimeIso = new Date(startTime).toISOString();
  const { id } = req.params;
  const updateData = req.body;
  
  // Log request start with comprehensive context
  console.log('='.repeat(80));
  console.log('[LOCAL PAYMENT] PUT /admin/local-payment/methods/:id - REQUEST START');
  console.log('[LOCAL PAYMENT] Start time:', startTimeIso);
  console.log('[LOCAL PAYMENT] Method ID:', id);
  console.log('[LOCAL PAYMENT] Request body:', JSON.stringify(updateData, null, 2));
  console.log('[LOCAL PAYMENT] Request headers:', {
    'content-type': req.get('Content-Type'),
    'authorization': req.get('Authorization') ? 'present' : 'missing',
    'user-agent': req.get('User-Agent')
  });
  console.log('[LOCAL PAYMENT] Authenticated user:', req.user ? { id: req.user.id, email: req.user.email } : 'none');
  console.log('[LOCAL PAYMENT] Request IP:', req.ip);
  console.log('='.repeat(80));
  
  // Log to logger service
  adminLocalPaymentLogger.info('[PUT /admin/local-payment/methods/:id] Request received', {
    method: 'PUT',
    url: req.originalUrl,
    methodId: id,
    body: updateData,
    userId: req.user?.id,
    ip: req.ip,
    startTime: startTimeIso
  });
  
  try {
    console.log('[LOCAL PAYMENT] Calling localPaymentService.updatePaymentMethod...');
    
    const method = await localPaymentService.updatePaymentMethod(id, updateData);
    
    const duration = Date.now() - startTime;
    const completionTime = new Date().toISOString();
    
    console.log('='.repeat(80));
    console.log('[LOCAL PAYMENT] PUT /admin/local-payment/methods/:id - REQUEST SUCCESS');
    console.log('[LOCAL PAYMENT] Completion time:', completionTime);
    console.log('[LOCAL PAYMENT] Duration:', duration, 'ms');
    console.log('[LOCAL PAYMENT] Updated method:', JSON.stringify(method, null, 2));
    console.log('='.repeat(80));
    
    // Log success to logger service
    adminLocalPaymentLogger.info('[PUT /admin/local-payment/methods/:id] Request completed successfully', {
      methodId: id,
      userId: req.user?.id,
      duration: duration,
      startTime: startTimeIso,
      completionTime: completionTime,
      updatedMethod: method
    });
    
    return res.json({
      success: true,
      message: 'Payment method updated successfully',
      messageBn: 'পেমেন্ট পদ্ধতি সফলভাবে আপডেট করা হয়েছে',
      data: method,
      meta: {
        duration: duration,
        completedAt: completionTime
      }
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    const completionTime = new Date().toISOString();
    
    console.log('='.repeat(80));
    console.error('[LOCAL PAYMENT] PUT /admin/local-payment/methods/:id - REQUEST ERROR');
    console.error('[LOCAL PAYMENT] Completion time:', completionTime);
    console.error('[LOCAL PAYMENT] Duration:', duration, 'ms');
    console.error('[LOCAL PAYMENT] Error name:', error.name);
    console.error('[LOCAL PAYMENT] Error message:', error.message);
    console.error('[LOCAL PAYMENT] Error code:', error.code);
    console.error('[LOCAL PAYMENT] Error stack:', error.stack);
    console.log('='.repeat(80));
    
    // Log error to logger service with detailed context
    adminLocalPaymentLogger.error('[PUT /admin/local-payment/methods/:id] Request failed', {
      methodId: id,
      userId: req.user?.id,
      ip: req.ip,
      error: {
        name: error.name,
        message: error.message,
        code: error.code,
        stack: error.stack
      },
      duration: duration,
      startTime: startTimeIso,
      completionTime: completionTime,
      body: updateData
    });
    
    // Handle timeout errors specifically
    if (error.name === 'TimeoutError' ||
        error.message.toLowerCase().includes('timeout') ||
        error.message.includes('Redis pipeline timeout') ||
        error.code === 'ETIMEDOUT' ||
        error.code === 'ESOCKETTIMEDOUT') {
      console.error('[LOCAL PAYMENT] Timeout error detected - returning 408');
      return res.status(408).json({
        success: false,
        error: 'Request timeout - operation timed out',
        message: 'Request timeout - operation timed out',
        messageBn: 'অনুরোধ সময়সীমা অতিক্রান্ত - অপারেশন সময়সীমা অতিক্রান্ত',
        meta: {
          duration: duration,
          errorType: 'TimeoutError',
          completedAt: completionTime
        }
      });
    }
    
    // Handle not found errors
    if (error.message.toLowerCase().includes('not found') || error.code === 'NOT_FOUND') {
      console.error('[LOCAL PAYMENT] Not found error detected - returning 404');
      return res.status(404).json({
        success: false,
        error: 'Payment method not found',
        message: 'Payment method not found',
        messageBn: 'পেমেন্ট পদ্ধতি তথ্য পাওয়া যায়নি',
        meta: {
          methodId: id,
          duration: duration,
          completedAt: completionTime
        }
      });
    }
    
    // Handle validation errors
    if (error.name === 'ValidationError' || error.code === 'VALIDATION_ERROR') {
      console.error('[LOCAL PAYMENT] Validation error detected - returning 400');
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        message: 'Validation failed',
        messageBn: 'যাচাইকরণ ব্যর্থ হয়েছে',
        details: error.message,
        meta: {
          duration: duration,
          errorType: 'ValidationError',
          completedAt: completionTime
        }
      });
    }
    
    // Handle database errors
    if (error.code && (error.code.startsWith('ER_') || error.code.includes('database') || error.code.includes('SQL'))) {
      console.error('[LOCAL PAYMENT] Database error detected - returning 500');
      return res.status(500).json({
        success: false,
        error: 'Database error',
        message: 'Database error occurred',
        messageBn: 'ডাটাবেস ত্রুটি ঘটেছে',
        details: error.message,
        meta: {
          duration: duration,
          errorType: 'DatabaseError',
          errorCode: error.code,
          completedAt: completionTime
        }
      });
    }
    
    // Generic server error
    console.error('[LOCAL PAYMENT] Generic error detected - returning 500');
    return res.status(500).json({
      success: false,
      error: 'Failed to update payment method',
      message: 'Failed to update payment method',
      messageBn: 'পেমেন্ট পদ্ধতি আপডেট করতে ব্যর্থ হয়েছে',
      details: error.message,
      meta: {
        duration: duration,
        errorType: error.name,
        errorCode: error.code,
        completedAt: completionTime
      }
    });
  }
});

/**
 * POST /api/v1/admin/local-payment/methods
 * Create a new payment method
 */
router.post('/methods', [
  body('name').isString().notEmpty().withMessage('Name is required'),
  body('code').isString().notEmpty().withMessage('Code is required'),
  body('displayName').isString().notEmpty().withMessage('Display name is required'),
  body('logoUrl').optional({ nullable: true }).isString(),
  body('isActive').optional().isBoolean(),
  body('minAmount').optional().isFloat({ min: 0 }),
  body('maxAmount').optional().isFloat({ min: 0 }),
  body('processingFee').optional().isFloat({ min: 0 }),
  body('processingFeePercent').optional().isFloat({ min: 0, max: 100 }),
  body('requiresPhone').optional().isBoolean(),
  body('requiresPin').optional().isBoolean(),
  body('description').optional({ nullable: true }).isString(),
  body('instructions').optional({ nullable: true }).isString(),
  body('supportedNetworks').optional().isArray()
], (req, res, next) => {
  console.log('[DEBUG] POST /methods - Middleware stack starting');
  console.log('[DEBUG] Request body:', req.body);
  console.log('[DEBUG] Request headers:', {
    'content-type': req.get('Content-Type'),
    'authorization': req.get('Authorization') ? 'present' : 'missing'
  });
  next();
}, handleValidationErrors, (req, res, next) => {
  console.log('[DEBUG] After validation errors middleware');
  next();
}, authMiddleware.authenticate(), (req, res, next) => {
  console.log('[DEBUG] After auth middleware');
  console.log('[DEBUG] Authenticated user:', req.user ? req.user.id : 'none');
  next();
}, // Rate limiting middleware temporarily disabled to prevent timeout issues
// To re-enable rate limiting, uncomment the following line:
// adminLocalPaymentRateLimit,
async (req, res, next) => {
  console.log('[DEBUG] Rate limit middleware disabled - bypassing to prevent timeout');
  next();
}, async (req, res) => {
  const startTime = Date.now();
  const startTimeIso = new Date(startTime).toISOString();
  const methodData = req.body;
  
  // Log request start with comprehensive context
  console.log('='.repeat(80));
  console.log('[LOCAL PAYMENT] POST /admin/local-payment/methods - REQUEST START');
  console.log('[LOCAL PAYMENT] Start time:', startTimeIso);
  console.log('[LOCAL PAYMENT] Request body:', JSON.stringify(methodData, null, 2));
  console.log('[LOCAL PAYMENT] Request headers:', {
    'content-type': req.get('Content-Type'),
    'authorization': req.get('Authorization') ? 'present' : 'missing',
    'user-agent': req.get('User-Agent')
  });
  console.log('[LOCAL PAYMENT] Authenticated user:', req.user ? { id: req.user.id, email: req.user.email } : 'none');
  console.log('[LOCAL PAYMENT] Request IP:', req.ip);
  console.log('='.repeat(80));
  
  // Log to logger service
  adminLocalPaymentLogger.info('[POST /admin/local-payment/methods] Request received', {
    method: 'POST',
    url: req.originalUrl,
    body: methodData,
    userId: req.user?.id,
    ip: req.ip,
    startTime: startTimeIso
  });
  
  try {
    console.log('[LOCAL PAYMENT] Calling localPaymentService.createPaymentMethod...');
    
    const method = await localPaymentService.createPaymentMethod(methodData);
    
    const duration = Date.now() - startTime;
    const completionTime = new Date().toISOString();
    
    console.log('='.repeat(80));
    console.log('[LOCAL PAYMENT] POST /admin/local-payment/methods - REQUEST SUCCESS');
    console.log('[LOCAL PAYMENT] Completion time:', completionTime);
    console.log('[LOCAL PAYMENT] Duration:', duration, 'ms');
    console.log('[LOCAL PAYMENT] Created method:', JSON.stringify(method, null, 2));
    console.log('='.repeat(80));
    
    // Log success to logger service
    adminLocalPaymentLogger.info('[POST /admin/local-payment/methods] Request completed successfully', {
      userId: req.user?.id,
      duration: duration,
      startTime: startTimeIso,
      completionTime: completionTime,
      createdMethod: method
    });
    
    return res.status(201).json({
      success: true,
      message: 'Payment method created successfully',
      messageBn: 'পেমেন্ট পদ্ধতি সফলভাবে তৈরি করা হয়েছে',
      data: method,
      meta: {
        duration: duration,
        completedAt: completionTime
      }
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    const completionTime = new Date().toISOString();
    
    console.log('='.repeat(80));
    console.error('[LOCAL PAYMENT] POST /admin/local-payment/methods - REQUEST ERROR');
    console.error('[LOCAL PAYMENT] Completion time:', completionTime);
    console.error('[LOCAL PAYMENT] Duration:', duration, 'ms');
    console.error('[LOCAL PAYMENT] Error name:', error.name);
    console.error('[LOCAL PAYMENT] Error message:', error.message);
    console.error('[LOCAL PAYMENT] Error code:', error.code);
    console.error('[LOCAL PAYMENT] Error stack:', error.stack);
    console.log('='.repeat(80));
    
    // Log error to logger service with detailed context
    adminLocalPaymentLogger.error('[POST /admin/local-payment/methods] Request failed', {
      userId: req.user?.id,
      ip: req.ip,
      error: {
        name: error.name,
        message: error.message,
        code: error.code,
        stack: error.stack
      },
      duration: duration,
      startTime: startTimeIso,
      completionTime: completionTime,
      body: methodData
    });
    
    // Handle timeout errors specifically
    if (error.name === 'TimeoutError' ||
        error.message.toLowerCase().includes('timeout') ||
        error.message.includes('Redis pipeline timeout') ||
        error.code === 'ETIMEDOUT' ||
        error.code === 'ESOCKETTIMEDOUT') {
      console.error('[LOCAL PAYMENT] Timeout error detected - returning 408');
      return res.status(408).json({
        success: false,
        error: 'Request timeout - operation timed out',
        message: 'Request timeout - operation timed out',
        messageBn: 'অনুরোধ সময়সীমা অতিক্রান্ত - অপারেশন সময়সীমা অতিক্রান্ত',
        meta: {
          duration: duration,
          errorType: 'TimeoutError',
          completedAt: completionTime
        }
      });
    }
    
    // Handle validation errors
    if (error.name === 'ValidationError' || error.code === 'VALIDATION_ERROR') {
      console.error('[LOCAL PAYMENT] Validation error detected - returning 400');
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        message: 'Validation failed',
        messageBn: 'যাচাইকরণ ব্যর্থ হয়েছে',
        details: error.message,
        meta: {
          duration: duration,
          errorType: 'ValidationError',
          completedAt: completionTime
        }
      });
    }
    
    // Handle duplicate code errors
    if (error.code === 'P2002' && error.meta?.target?.includes('code')) {
      console.error('[LOCAL PAYMENT] Duplicate code error detected - returning 409');
      return res.status(409).json({
        success: false,
        error: 'Payment method code already exists',
        message: 'A payment method with this code already exists',
        messageBn: 'এই কোড সহ একটি পেমেন্ট পদ্ধতি ইতিমধ্যেই বিদ্যমান',
        meta: {
          duration: duration,
          errorType: 'DuplicateError',
          completedAt: completionTime
        }
      });
    }
    
    // Handle database errors
    if (error.code && (error.code.startsWith('ER_') || error.code.includes('database') || error.code.includes('SQL'))) {
      console.error('[LOCAL PAYMENT] Database error detected - returning 500');
      return res.status(500).json({
        success: false,
        error: 'Database error',
        message: 'Database error occurred',
        messageBn: 'ডাটাবেস ত্রুটি ঘটেছে',
        details: error.message,
        meta: {
          duration: duration,
          errorType: 'DatabaseError',
          errorCode: error.code,
          completedAt: completionTime
        }
      });
    }
    
    // Generic server error
    console.error('[LOCAL PAYMENT] Generic error detected - returning 500');
    return res.status(500).json({
      success: false,
      error: 'Failed to create payment method',
      message: 'Failed to create payment method',
      messageBn: 'পেমেন্ট পদ্ধতি তৈরি করতে ব্যর্থ হয়েছে',
      details: error.message,
      meta: {
        duration: duration,
        errorType: error.name,
        errorCode: error.code,
        completedAt: completionTime
      }
    });
  }
});

/**
 * DELETE /api/v1/admin/local-payment/methods/:id
 * Delete a payment method
 */
router.delete('/methods/:id', [
  param('id').isString().notEmpty().withMessage('Invalid method ID')
], (req, res, next) => {
  console.log('[DEBUG] DELETE /methods/:id - Middleware stack starting');
  console.log('[DEBUG] Request params:', req.params);
  console.log('[DEBUG] Request headers:', {
    'authorization': req.get('Authorization') ? 'present' : 'missing'
  });
  next();
}, handleValidationErrors, (req, res, next) => {
  console.log('[DEBUG] After validation errors middleware');
  next();
}, authMiddleware.authenticate(), (req, res, next) => {
  console.log('[DEBUG] After auth middleware');
  console.log('[DEBUG] Authenticated user:', req.user ? req.user.id : 'none');
  next();
}, // Rate limiting middleware temporarily disabled to prevent timeout issues
// To re-enable rate limiting, uncomment the following line:
// adminLocalPaymentRateLimit,
async (req, res, next) => {
  console.log('[DEBUG] Rate limit middleware disabled - bypassing to prevent timeout');
  next();
}, async (req, res) => {
  const startTime = Date.now();
  const startTimeIso = new Date(startTime).toISOString();
  const { id } = req.params;
  
  // Log request start with comprehensive context
  console.log('='.repeat(80));
  console.log('[LOCAL PAYMENT] DELETE /admin/local-payment/methods/:id - REQUEST START');
  console.log('[LOCAL PAYMENT] Start time:', startTimeIso);
  console.log('[LOCAL PAYMENT] Method ID:', id);
  console.log('[LOCAL PAYMENT] Request headers:', {
    'authorization': req.get('Authorization') ? 'present' : 'missing',
    'user-agent': req.get('User-Agent')
  });
  console.log('[LOCAL PAYMENT] Authenticated user:', req.user ? { id: req.user.id, email: req.user.email } : 'none');
  console.log('[LOCAL PAYMENT] Request IP:', req.ip);
  console.log('='.repeat(80));
  
  // Log to logger service
  adminLocalPaymentLogger.info('[DELETE /admin/local-payment/methods/:id] Request received', {
    method: 'DELETE',
    url: req.originalUrl,
    methodId: id,
    userId: req.user?.id,
    ip: req.ip,
    startTime: startTimeIso
  });
  
  try {
    console.log('[LOCAL PAYMENT] Calling localPaymentService.deletePaymentMethod...');
    
    const result = await localPaymentService.deletePaymentMethod(id);
    
    const duration = Date.now() - startTime;
    const completionTime = new Date().toISOString();
    
    console.log('='.repeat(80));
    console.log('[LOCAL PAYMENT] DELETE /admin/local-payment/methods/:id - REQUEST SUCCESS');
    console.log('[LOCAL PAYMENT] Completion time:', completionTime);
    console.log('[LOCAL PAYMENT] Duration:', duration, 'ms');
    console.log('[LOCAL PAYMENT] Delete result:', result);
    console.log('='.repeat(80));
    
    // Log success to logger service
    adminLocalPaymentLogger.info('[DELETE /admin/local-payment/methods/:id] Request completed successfully', {
      methodId: id,
      userId: req.user?.id,
      duration: duration,
      startTime: startTimeIso,
      completionTime: completionTime
    });
    
    return res.json({
      success: true,
      message: 'Payment method deleted successfully',
      messageBn: 'পেমেন্ট পদ্ধতি সফলভাবে মুছে ফেলা হয়েছে',
      data: result,
      meta: {
        duration: duration,
        completedAt: completionTime
      }
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    const completionTime = new Date().toISOString();
    
    console.log('='.repeat(80));
    console.error('[LOCAL PAYMENT] DELETE /admin/local-payment/methods/:id - REQUEST ERROR');
    console.error('[LOCAL PAYMENT] Completion time:', completionTime);
    console.error('[LOCAL PAYMENT] Duration:', duration, 'ms');
    console.error('[LOCAL PAYMENT] Error name:', error.name);
    console.error('[LOCAL PAYMENT] Error message:', error.message);
    console.error('[LOCAL PAYMENT] Error code:', error.code);
    console.error('[LOCAL PAYMENT] Error stack:', error.stack);
    console.log('='.repeat(80));
    
    // Log error to logger service with detailed context
    adminLocalPaymentLogger.error('[DELETE /admin/local-payment/methods/:id] Request failed', {
      methodId: id,
      userId: req.user?.id,
      ip: req.ip,
      error: {
        name: error.name,
        message: error.message,
        code: error.code,
        stack: error.stack
      },
      duration: duration,
      startTime: startTimeIso,
      completionTime: completionTime
    });
    
    // Handle timeout errors specifically
    if (error.name === 'TimeoutError' ||
        error.message.toLowerCase().includes('timeout') ||
        error.message.includes('Redis pipeline timeout') ||
        error.code === 'ETIMEDOUT' ||
        error.code === 'ESOCKETTIMEDOUT') {
      console.error('[LOCAL PAYMENT] Timeout error detected - returning 408');
      return res.status(408).json({
        success: false,
        error: 'Request timeout - operation timed out',
        message: 'Request timeout - operation timed out',
        messageBn: 'অনুরোধ সময়সীমা অতিক্রান্ত - অপারেশন সময়সীমা অতিক্রান্ত',
        meta: {
          duration: duration,
          errorType: 'TimeoutError',
          completedAt: completionTime
        }
      });
    }
    
    // Handle not found errors
    if (error.code === 'P2025' || error.message.toLowerCase().includes('not found')) {
      console.error('[LOCAL PAYMENT] Not found error detected - returning 404');
      return res.status(404).json({
        success: false,
        error: 'Payment method not found',
        message: 'Payment method not found',
        messageBn: 'পেমেন্ট পদ্ধতি তথ্য পাওয়া যায়নি',
        meta: {
          methodId: id,
          duration: duration,
          errorType: 'NotFoundError',
          completedAt: completionTime
        }
      });
    }
    
    // Handle validation errors
    if (error.name === 'ValidationError' || error.code === 'VALIDATION_ERROR') {
      console.error('[LOCAL PAYMENT] Validation error detected - returning 400');
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        message: 'Validation failed',
        messageBn: 'যাচাইকরণ ব্যর্থ হয়েছে',
        details: error.message,
        meta: {
          duration: duration,
          errorType: 'ValidationError',
          completedAt: completionTime
        }
      });
    }
    
    // Handle database errors
    if (error.code && (error.code.startsWith('ER_') || error.code.includes('database') || error.code.includes('SQL'))) {
      console.error('[LOCAL PAYMENT] Database error detected - returning 500');
      return res.status(500).json({
        success: false,
        error: 'Database error',
        message: 'Database error occurred',
        messageBn: 'ডাটাবেস ত্রুটি ঘটেছে',
        details: error.message,
        meta: {
          duration: duration,
          errorType: 'DatabaseError',
          errorCode: error.code,
          completedAt: completionTime
        }
      });
    }
    
    // Generic server error
    console.error('[LOCAL PAYMENT] Generic error detected - returning 500');
    return res.status(500).json({
      success: false,
      error: 'Failed to delete payment method',
      message: 'Failed to delete payment method',
      messageBn: 'পেমেন্ট পদ্ধতি মুছে ফেলতে ব্যর্থ হয়েছে',
      details: error.message,
      meta: {
        duration: duration,
        errorType: error.name,
        errorCode: error.code,
        completedAt: completionTime
      }
    });
  }
});

// ============================================================================
// SMS Subscription Management Endpoints
// ============================================================================

/**
 * GET /api/v1/admin/local-payment/sms-subscriptions
 * Get all SMS subscriptions (admin endpoint)
 */
router.get('/sms-subscriptions', [
  // Rate limiting middleware temporarily disabled to prevent timeout issues
  // To re-enable rate limiting, uncomment the following line:
  // adminLocalPaymentRateLimit,
  async (req, res, next) => {
    console.log('[DEBUG] Rate limit middleware disabled - bypassing to prevent timeout');
    next();
  }
], authMiddleware.authenticate(), async (req, res) => {
  const startTime = Date.now();
  const startTimeIso = new Date(startTime).toISOString();
  
  // Support optional query parameters for filtering
  const { status, userId } = req.query;
  
  // Log request start with comprehensive context
  console.log('='.repeat(80));
  console.log('[LOCAL PAYMENT] GET /admin/local-payment/sms-subscriptions - REQUEST START');
  console.log('[LOCAL PAYMENT] Start time:', startTimeIso);
  console.log('[LOCAL PAYMENT] Query parameters:', { status, userId });
  console.log('[LOCAL PAYMENT] Request headers:', {
    'authorization': req.get('Authorization') ? 'present' : 'missing',
    'user-agent': req.get('User-Agent')
  });
  console.log('[LOCAL PAYMENT] Authenticated user:', req.user ? { id: req.user.id, email: req.user.email } : 'none');
  console.log('[LOCAL PAYMENT] Request IP:', req.ip);
  console.log('='.repeat(80));
  
  // Log to logger service
  adminLocalPaymentLogger.info('[GET /admin/local-payment/sms-subscriptions] Request received', {
    method: 'GET',
    url: req.originalUrl,
    query: req.query,
    userId: req.user?.id,
    ip: req.ip,
    startTime: startTimeIso
  });
  
  try {
    console.log('[LOCAL PAYMENT] Calling localPaymentService.getAllSmsSubscriptions...');
    
    // Get all SMS subscriptions from service
    let subscriptions = await localPaymentService.getAllSmsSubscriptions();
    
    // Map database fields to frontend expectations and include user details
    const { databaseService } = require('../../services/database');
    const prisma = databaseService.getClient();
    
    const subscriptionsWithUsers = await Promise.all(
      subscriptions.map(async (subscription) => {
        // Get user details
        const user = await prisma.user.findUnique({
          where: { id: subscription.userId },
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true
          }
        });
        
        // Map database fields to frontend expectations
        return {
          id: subscription.id,
          userId: subscription.userId,
          phoneNumber: subscription.phoneNumber,
          paymentMethod: subscription.paymentMethod,
          amount: subscription.amount,
          status: subscription.status,
          startDate: subscription.lastPaymentAt ? subscription.lastPaymentAt.toISOString() : subscription.createdAt.toISOString(),
          endDate: subscription.nextPaymentAt ? subscription.nextPaymentAt.toISOString() : undefined,
          createdAt: subscription.createdAt.toISOString(),
          updatedAt: subscription.updatedAt.toISOString(),
          user: user ? {
            id: user.id,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email
          } : undefined
        };
      })
    );
    
    // Filter by status if query parameter is provided
    let filteredSubscriptions = subscriptionsWithUsers;
    if (status) {
      filteredSubscriptions = filteredSubscriptions.filter(sub => sub.status === status);
    }
    
    // Filter by userId if query parameter is provided
    if (userId) {
      filteredSubscriptions = filteredSubscriptions.filter(sub => sub.userId === userId);
    }
    
    const duration = Date.now() - startTime;
    const completionTime = new Date().toISOString();
    
    console.log('='.repeat(80));
    console.log('[LOCAL PAYMENT] GET /admin/local-payment/sms-subscriptions - REQUEST SUCCESS');
    console.log('[LOCAL PAYMENT] Completion time:', completionTime);
    console.log('[LOCAL PAYMENT] Duration:', duration, 'ms');
    console.log('[LOCAL PAYMENT] Subscriptions count:', filteredSubscriptions.length);
    console.log('='.repeat(80));
    
    // Log success to logger service
    adminLocalPaymentLogger.info('[GET /admin/local-payment/sms-subscriptions] Request completed successfully', {
      userId: req.user?.id,
      duration: duration,
      startTime: startTimeIso,
      completionTime: completionTime,
      subscriptionsCount: filteredSubscriptions.length
    });
    
    return res.json({
      success: true,
      message: 'SMS subscriptions retrieved successfully',
      messageBn: 'এসএমএস সাবস্ক্রিপশন সফলভাবে পুনরুদ্ধার করা হয়েছে',
      data: filteredSubscriptions,
      meta: {
        count: filteredSubscriptions.length,
        duration: duration,
        completedAt: completionTime
      }
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    const completionTime = new Date().toISOString();
    
    console.log('='.repeat(80));
    console.error('[LOCAL PAYMENT] GET /admin/local-payment/sms-subscriptions - REQUEST ERROR');
    console.error('[LOCAL PAYMENT] Completion time:', completionTime);
    console.error('[LOCAL PAYMENT] Duration:', duration, 'ms');
    console.error('[LOCAL PAYMENT] Error name:', error.name);
    console.error('[LOCAL PAYMENT] Error message:', error.message);
    console.error('[LOCAL PAYMENT] Error code:', error.code);
    console.error('[LOCAL PAYMENT] Error stack:', error.stack);
    console.log('='.repeat(80));
    
    // Log error to logger service with detailed context
    adminLocalPaymentLogger.error('[GET /admin/local-payment/sms-subscriptions] Request failed', {
      userId: req.user?.id,
      ip: req.ip,
      error: {
        name: error.name,
        message: error.message,
        code: error.code,
        stack: error.stack
      },
      duration: duration,
      startTime: startTimeIso,
      completionTime: completionTime
    });
    
    // Handle timeout errors specifically
    if (error.name === 'TimeoutError' ||
        error.message.toLowerCase().includes('timeout') ||
        error.message.includes('Redis pipeline timeout') ||
        error.code === 'ETIMEDOUT' ||
        error.code === 'ESOCKETTIMEDOUT') {
      console.error('[LOCAL PAYMENT] Timeout error detected - returning 408');
      return res.status(408).json({
        success: false,
        error: 'Request timeout - operation timed out',
        message: 'Request timeout - operation timed out',
        messageBn: 'অনুরোধ সময়সীমা অতিক্রান্ত - অপারেশন সময়সীমা অতিক্রান্ত',
        meta: {
          duration: duration,
          errorType: 'TimeoutError',
          completedAt: completionTime
        }
      });
    }
    
    // Handle database errors
    if (error.code && (error.code.startsWith('ER_') || error.code.includes('database') || error.code.includes('SQL'))) {
      console.error('[LOCAL PAYMENT] Database error detected - returning 500');
      return res.status(500).json({
        success: false,
        error: 'Database error',
        message: 'Database error occurred',
        messageBn: 'ডাটাবেস ত্রুটি ঘটেছে',
        details: error.message,
        meta: {
          duration: duration,
          errorType: 'DatabaseError',
          errorCode: error.code,
          completedAt: completionTime
        }
      });
    }
    
    // Generic server error
    console.error('[LOCAL PAYMENT] Generic error detected - returning 500');
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch SMS subscriptions',
      message: 'Failed to fetch SMS subscriptions',
      messageBn: 'এসএমএস সাবস্ক্রিপশন পুনরুদ্ধার করতে ব্যর্থ হয়েছে',
      details: error.message,
      meta: {
        duration: duration,
        errorType: error.name,
        errorCode: error.code,
        completedAt: completionTime
      }
    });
  }
});

/**
 * PUT /api/v1/admin/local-payment/sms-subscriptions/:id
 * Update SMS subscription status
 */
router.put('/sms-subscriptions/:id', [
  param('id').isString().notEmpty().withMessage('Invalid subscription ID'),
  body('status').optional().isIn(['active', 'cancelled', 'expired', 'pending']).withMessage('Invalid status value'),
  body('phoneNumber').optional().isString(),
  body('paymentMethod').optional().isString()
], (req, res, next) => {
  console.log('[DEBUG] PUT /sms-subscriptions/:id - Middleware stack starting');
  console.log('[DEBUG] Request params:', req.params);
  console.log('[DEBUG] Request body:', req.body);
  console.log('[DEBUG] Request headers:', {
    'content-type': req.get('Content-Type'),
    'authorization': req.get('Authorization') ? 'present' : 'missing'
  });
  next();
}, handleValidationErrors, (req, res, next) => {
  console.log('[DEBUG] After validation errors middleware');
  next();
}, authMiddleware.authenticate(), (req, res, next) => {
  console.log('[DEBUG] After auth middleware');
  console.log('[DEBUG] Authenticated user:', req.user ? req.user.id : 'none');
  next();
}, // Rate limiting middleware temporarily disabled to prevent timeout issues
// To re-enable rate limiting, uncomment the following line:
// adminLocalPaymentRateLimit,
async (req, res, next) => {
  console.log('[DEBUG] Rate limit middleware disabled - bypassing to prevent timeout');
  next();
}, async (req, res) => {
  const startTime = Date.now();
  const startTimeIso = new Date(startTime).toISOString();
  const { id } = req.params;
  const updateData = req.body;
  
  // Log request start with comprehensive context
  console.log('='.repeat(80));
  console.log('[LOCAL PAYMENT] PUT /admin/local-payment/sms-subscriptions/:id - REQUEST START');
  console.log('[LOCAL PAYMENT] Start time:', startTimeIso);
  console.log('[LOCAL PAYMENT] Subscription ID:', id);
  console.log('[LOCAL PAYMENT] Request body:', JSON.stringify(updateData, null, 2));
  console.log('[LOCAL PAYMENT] Request headers:', {
    'content-type': req.get('Content-Type'),
    'authorization': req.get('Authorization') ? 'present' : 'missing',
    'user-agent': req.get('User-Agent')
  });
  console.log('[LOCAL PAYMENT] Authenticated user:', req.user ? { id: req.user.id, email: req.user.email } : 'none');
  console.log('[LOCAL PAYMENT] Request IP:', req.ip);
  console.log('='.repeat(80));
  
  // Log to logger service
  adminLocalPaymentLogger.info('[PUT /admin/local-payment/sms-subscriptions/:id] Request received', {
    method: 'PUT',
    url: req.originalUrl,
    subscriptionId: id,
    body: updateData,
    userId: req.user?.id,
    ip: req.ip,
    startTime: startTimeIso
  });
  
  try {
    console.log('[LOCAL PAYMENT] Calling localPaymentService.updateSmsSubscription...');
    
    const subscription = await localPaymentService.updateSmsSubscription(id, updateData);
    
    const duration = Date.now() - startTime;
    const completionTime = new Date().toISOString();
    
    console.log('='.repeat(80));
    console.log('[LOCAL PAYMENT] PUT /admin/local-payment/sms-subscriptions/:id - REQUEST SUCCESS');
    console.log('[LOCAL PAYMENT] Completion time:', completionTime);
    console.log('[LOCAL PAYMENT] Duration:', duration, 'ms');
    console.log('[LOCAL PAYMENT] Updated subscription:', JSON.stringify(subscription, null, 2));
    console.log('='.repeat(80));
    
    // Log success to logger service
    adminLocalPaymentLogger.info('[PUT /admin/local-payment/sms-subscriptions/:id] Request completed successfully', {
      subscriptionId: id,
      userId: req.user?.id,
      duration: duration,
      startTime: startTimeIso,
      completionTime: completionTime,
      updatedSubscription: subscription
    });
    
    return res.json({
      success: true,
      message: 'SMS subscription updated successfully',
      messageBn: 'এসএমএস সাবস্ক্রিপশন সফলভাবে আপডেট করা হয়েছে',
      data: subscription,
      meta: {
        duration: duration,
        completedAt: completionTime
      }
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    const completionTime = new Date().toISOString();
    
    console.log('='.repeat(80));
    console.error('[LOCAL PAYMENT] PUT /admin/local-payment/sms-subscriptions/:id - REQUEST ERROR');
    console.error('[LOCAL PAYMENT] Completion time:', completionTime);
    console.error('[LOCAL PAYMENT] Duration:', duration, 'ms');
    console.error('[LOCAL PAYMENT] Error name:', error.name);
    console.error('[LOCAL PAYMENT] Error message:', error.message);
    console.error('[LOCAL PAYMENT] Error code:', error.code);
    console.error('[LOCAL PAYMENT] Error stack:', error.stack);
    console.log('='.repeat(80));
    
    // Log error to logger service with detailed context
    adminLocalPaymentLogger.error('[PUT /admin/local-payment/sms-subscriptions/:id] Request failed', {
      subscriptionId: id,
      userId: req.user?.id,
      ip: req.ip,
      error: {
        name: error.name,
        message: error.message,
        code: error.code,
        stack: error.stack
      },
      duration: duration,
      startTime: startTimeIso,
      completionTime: completionTime,
      body: updateData
    });
    
    // Handle timeout errors specifically
    if (error.name === 'TimeoutError' ||
        error.message.toLowerCase().includes('timeout') ||
        error.message.includes('Redis pipeline timeout') ||
        error.code === 'ETIMEDOUT' ||
        error.code === 'ESOCKETTIMEDOUT') {
      console.error('[LOCAL PAYMENT] Timeout error detected - returning 408');
      return res.status(408).json({
        success: false,
        error: 'Request timeout - operation timed out',
        message: 'Request timeout - operation timed out',
        messageBn: 'অনুরোধ সময়সীমা অতিক্রান্ত - অপারেশন সময়সীমা অতিক্রান্ত',
        meta: {
          duration: duration,
          errorType: 'TimeoutError',
          completedAt: completionTime
        }
      });
    }
    
    // Handle not found errors
    if (error.code === 'P2025' || error.message.toLowerCase().includes('not found')) {
      console.error('[LOCAL PAYMENT] Not found error detected - returning 404');
      return res.status(404).json({
        success: false,
        error: 'SMS subscription not found',
        message: 'SMS subscription not found',
        messageBn: 'এসএমএস সাবস্ক্রিপশন তথ্য পাওয়া যায়নি',
        meta: {
          subscriptionId: id,
          duration: duration,
          errorType: 'NotFoundError',
          completedAt: completionTime
        }
      });
    }
    
    // Handle validation errors
    if (error.name === 'ValidationError' || error.code === 'VALIDATION_ERROR') {
      console.error('[LOCAL PAYMENT] Validation error detected - returning 400');
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        message: 'Validation failed',
        messageBn: 'যাচাইকরণ ব্যর্থ হয়েছে',
        details: error.message,
        meta: {
          duration: duration,
          errorType: 'ValidationError',
          completedAt: completionTime
        }
      });
    }
    
    // Handle database errors
    if (error.code && (error.code.startsWith('ER_') || error.code.includes('database') || error.code.includes('SQL'))) {
      console.error('[LOCAL PAYMENT] Database error detected - returning 500');
      return res.status(500).json({
        success: false,
        error: 'Database error',
        message: 'Database error occurred',
        messageBn: 'ডাটাবেস ত্রুটি ঘটেছে',
        details: error.message,
        meta: {
          duration: duration,
          errorType: 'DatabaseError',
          errorCode: error.code,
          completedAt: completionTime
        }
      });
    }
    
    // Generic server error
    console.error('[LOCAL PAYMENT] Generic error detected - returning 500');
    return res.status(500).json({
      success: false,
      error: 'Failed to update SMS subscription',
      message: 'Failed to update SMS subscription',
      messageBn: 'এসএমএস সাবস্ক্রিপশন আপডেট করতে ব্যর্থ হয়েছে',
      details: error.message,
      meta: {
        duration: duration,
        errorType: error.name,
        errorCode: error.code,
        completedAt: completionTime
      }
    });
  }
});

/**
 * POST /api/v1/admin/local-payment/sms-subscriptions
 * Create a new SMS subscription
 */
router.post('/sms-subscriptions', [
  body('userId').isString().notEmpty().withMessage('User ID is required'),
  body('phoneNumber').isString().notEmpty().withMessage('Phone number is required'),
  body('paymentMethod').isString().notEmpty().withMessage('Payment method is required'),
  body('amount').isFloat({ min: 0 }).withMessage('Amount is required'),
  body('status').optional().isString().isIn(['active', 'pending', 'cancelled', 'expired']).withMessage('Invalid status value')
], (req, res, next) => {
  console.log('[DEBUG] POST /sms-subscriptions - Middleware stack starting');
  console.log('[DEBUG] Request body:', req.body);
  console.log('[DEBUG] Request headers:', {
    'content-type': req.get('Content-Type'),
    'authorization': req.get('Authorization') ? 'present' : 'missing'
  });
  next();
}, handleValidationErrors, (req, res, next) => {
  console.log('[DEBUG] After validation errors middleware');
  next();
}, authMiddleware.authenticate(), (req, res, next) => {
  console.log('[DEBUG] After auth middleware');
  console.log('[DEBUG] Authenticated user:', req.user ? req.user.id : 'none');
  next();
}, // Rate limiting middleware temporarily disabled to prevent timeout issues
// To re-enable rate limiting, uncomment the following line:
// adminLocalPaymentRateLimit,
async (req, res, next) => {
  console.log('[DEBUG] Rate limit middleware disabled - bypassing to prevent timeout');
  next();
}, async (req, res) => {
  const startTime = Date.now();
  const startTimeIso = new Date(startTime).toISOString();
  
  // Log request start with comprehensive context
  console.log('='.repeat(80));
  console.log('[LOCAL PAYMENT] POST /admin/local-payment/sms-subscriptions - REQUEST START');
  console.log('[LOCAL PAYMENT] Start time:', startTimeIso);
  console.log('[LOCAL PAYMENT] Request body:', JSON.stringify(req.body, null, 2));
  console.log('[LOCAL PAYMENT] Request headers:', {
    'content-type': req.get('Content-Type'),
    'authorization': req.get('Authorization') ? 'present' : 'missing',
    'user-agent': req.get('User-Agent')
  });
  console.log('[LOCAL PAYMENT] Authenticated user:', req.user ? { id: req.user.id, email: req.user.email } : 'none');
  console.log('[LOCAL PAYMENT] Request IP:', req.ip);
  console.log('='.repeat(80));
  
  // Log to logger service
  adminLocalPaymentLogger.info('[POST /admin/local-payment/sms-subscriptions] Request received', {
    method: 'POST',
    url: req.originalUrl,
    body: req.body,
    userId: req.user?.id,
    ip: req.ip,
    startTime: startTimeIso
  });
  
  try {
    console.log('[LOCAL PAYMENT] Calling localPaymentService.createSmsSubscription...');
    
    const subscription = await localPaymentService.createSmsSubscription(
      req.body.userId,
      req.body.phoneNumber,
      req.body.paymentMethod,
      req.body.amount,
      req.body.status || 'pending'
    );
    
    const duration = Date.now() - startTime;
    const completionTime = new Date().toISOString();
    
    console.log('='.repeat(80));
    console.log('[LOCAL PAYMENT] POST /admin/local-payment/sms-subscriptions - REQUEST SUCCESS');
    console.log('[LOCAL PAYMENT] Completion time:', completionTime);
    console.log('[LOCAL PAYMENT] Duration:', duration, 'ms');
    console.log('[LOCAL PAYMENT] Created subscription:', JSON.stringify(subscription, null, 2));
    console.log('='.repeat(80));
    
    // Log success to logger service
    adminLocalPaymentLogger.info('[POST /admin/local-payment/sms-subscriptions] Request completed successfully', {
      userId: req.user?.id,
      duration: duration,
      startTime: startTimeIso,
      completionTime: completionTime,
      createdSubscription: subscription
    });
    
    return res.status(201).json({
      success: true,
      message: 'SMS subscription created successfully',
      messageBn: 'এসএমএস সাবস্করিপশন সফলভাবে তৈরি করা হয়েছে',
      data: subscription,
      meta: {
        duration: duration,
        completedAt: completionTime
      }
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    const completionTime = new Date().toISOString();
    
    console.log('='.repeat(80));
    console.error('[LOCAL PAYMENT] POST /admin/local-payment/sms-subscriptions - REQUEST ERROR');
    console.error('[LOCAL PAYMENT] Completion time:', completionTime);
    console.error('[LOCAL PAYMENT] Duration:', duration, 'ms');
    console.error('[LOCAL PAYMENT] Error name:', error.name);
    console.error('[LOCAL PAYMENT] Error message:', error.message);
    console.error('[LOCAL PAYMENT] Error code:', error.code);
    console.error('[LOCAL PAYMENT] Error stack:', error.stack);
    console.log('='.repeat(80));
    
    // Log error to logger service with detailed context
    adminLocalPaymentLogger.error('[POST /admin/local-payment/sms-subscriptions] Request failed', {
      userId: req.user?.id,
      ip: req.ip,
      error: {
        name: error.name,
        message: error.message,
        code: error.code,
        stack: error.stack
      },
      duration: duration,
      startTime: startTimeIso,
      completionTime: completionTime,
      body: req.body
    });
    
    // Handle timeout errors specifically
    if (error.name === 'TimeoutError' ||
        error.message.toLowerCase().includes('timeout') ||
        error.message.includes('Redis pipeline timeout') ||
        error.code === 'ETIMEDOUT' ||
        error.code === 'ESOCKETTIMEDOUT') {
      console.error('[LOCAL PAYMENT] Timeout error detected - returning 408');
      return res.status(408).json({
        success: false,
        error: 'Request timeout - operation timed out',
        message: 'Request timeout - operation timed out',
        messageBn: 'অনুরোধ সময়সীমা অতিক্রান্ত - অপারেশন সময়সীমা অতিক্রান্ত',
        meta: {
          duration: duration,
          errorType: 'TimeoutError',
          completedAt: completionTime
        }
      });
    }
    
    // Handle validation errors
    if (error.name === 'ValidationError' || error.code === 'VALIDATION_ERROR') {
      console.error('[LOCAL PAYMENT] Validation error detected - returning 400');
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        message: 'Validation failed',
        messageBn: 'যাচাইকরণ ব্যর্থ হয়েছে',
        details: error.message,
        meta: {
          duration: duration,
          errorType: 'ValidationError',
          completedAt: completionTime
        }
      });
    }
    
    // Handle database errors
    if (error.code && (error.code.startsWith('ER_') || error.code.includes('database') || error.code.includes('SQL'))) {
      console.error('[LOCAL PAYMENT] Database error detected - returning 500');
      return res.status(500).json({
        success: false,
        error: 'Database error',
        message: 'Database error occurred',
        messageBn: 'ডাটাবেস ত্রুটি ঘটেছে',
        details: error.message,
        meta: {
          duration: duration,
          errorType: 'DatabaseError',
          errorCode: error.code,
          completedAt: completionTime
        }
      });
    }
    
    // Generic server error
    console.error('[LOCAL PAYMENT] Generic error detected - returning 500');
    return res.status(500).json({
      success: false,
      error: 'Failed to create SMS subscription',
      message: 'Failed to create SMS subscription',
      messageBn: 'এসএমএস সাবস্করিপশন তৈরি করতে ব্যর্থ হয়েছে',
      details: error.message,
      meta: {
        duration: duration,
        errorType: error.name,
        errorCode: error.code,
        completedAt: completionTime
      }
    });
  }
});

/**
 * DELETE /api/v1/admin/local-payment/sms-subscriptions/:id
 * Cancel SMS subscription
 */
router.delete('/sms-subscriptions/:id', [
  param('id').isString().notEmpty().withMessage('Invalid subscription ID')
], (req, res, next) => {
  console.log('[DEBUG] DELETE /sms-subscriptions/:id - Middleware stack starting');
  console.log('[DEBUG] Request params:', req.params);
  console.log('[DEBUG] Request headers:', {
    'authorization': req.get('Authorization') ? 'present' : 'missing'
  });
  next();
}, handleValidationErrors, (req, res, next) => {
  console.log('[DEBUG] After validation errors middleware');
  next();
}, authMiddleware.authenticate(), (req, res, next) => {
  console.log('[DEBUG] After auth middleware');
  console.log('[DEBUG] Authenticated user:', req.user ? req.user.id : 'none');
  next();
}, // Rate limiting middleware temporarily disabled to prevent timeout issues
// To re-enable rate limiting, uncomment the following line:
// adminLocalPaymentRateLimit,
async (req, res, next) => {
  console.log('[DEBUG] Rate limit middleware disabled - bypassing to prevent timeout');
  next();
}, async (req, res) => {
  const startTime = Date.now();
  const startTimeIso = new Date(startTime).toISOString();
  const { id } = req.params;
  
  // Log request start with comprehensive context
  console.log('='.repeat(80));
  console.log('[LOCAL PAYMENT] DELETE /admin/local-payment/sms-subscriptions/:id - REQUEST START');
  console.log('[LOCAL PAYMENT] Start time:', startTimeIso);
  console.log('[LOCAL PAYMENT] Subscription ID:', id);
  console.log('[LOCAL PAYMENT] Request headers:', {
    'authorization': req.get('Authorization') ? 'present' : 'missing',
    'user-agent': req.get('User-Agent')
  });
  console.log('[LOCAL PAYMENT] Authenticated user:', req.user ? { id: req.user.id, email: req.user.email } : 'none');
  console.log('[LOCAL PAYMENT] Request IP:', req.ip);
  console.log('='.repeat(80));
  
  // Log to logger service
  adminLocalPaymentLogger.info('[DELETE /admin/local-payment/sms-subscriptions/:id] Request received', {
    method: 'DELETE',
    url: req.originalUrl,
    subscriptionId: id,
    userId: req.user?.id,
    ip: req.ip,
    startTime: startTimeIso
  });
  
  try {
    console.log('[LOCAL PAYMENT] Calling localPaymentService.cancelSmsSubscription...');
    
    const subscription = await localPaymentService.cancelSmsSubscription(id);
    
    const duration = Date.now() - startTime;
    const completionTime = new Date().toISOString();
    
    console.log('='.repeat(80));
    console.log('[LOCAL PAYMENT] DELETE /admin/local-payment/sms-subscriptions/:id - REQUEST SUCCESS');
    console.log('[LOCAL PAYMENT] Completion time:', completionTime);
    console.log('[LOCAL PAYMENT] Duration:', duration, 'ms');
    console.log('[LOCAL PAYMENT] Cancelled subscription:', JSON.stringify(subscription, null, 2));
    console.log('='.repeat(80));
    
    // Log success to logger service
    adminLocalPaymentLogger.info('[DELETE /admin/local-payment/sms-subscriptions/:id] Request completed successfully', {
      subscriptionId: id,
      userId: req.user?.id,
      duration: duration,
      startTime: startTimeIso,
      completionTime: completionTime
    });
    
    return res.json({
      success: true,
      message: 'SMS subscription cancelled successfully',
      messageBn: 'এসএমএস সাবস্ক্রিপশন সফলভাবে বাতিল করা হয়েছে',
      data: subscription,
      meta: {
        duration: duration,
        completedAt: completionTime
      }
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    const completionTime = new Date().toISOString();
    
    console.log('='.repeat(80));
    console.error('[LOCAL PAYMENT] DELETE /admin/local-payment/sms-subscriptions/:id - REQUEST ERROR');
    console.error('[LOCAL PAYMENT] Completion time:', completionTime);
    console.error('[LOCAL PAYMENT] Duration:', duration, 'ms');
    console.error('[LOCAL PAYMENT] Error name:', error.name);
    console.error('[LOCAL PAYMENT] Error message:', error.message);
    console.error('[LOCAL PAYMENT] Error code:', error.code);
    console.error('[LOCAL PAYMENT] Error stack:', error.stack);
    console.log('='.repeat(80));
    
    // Log error to logger service with detailed context
    adminLocalPaymentLogger.error('[DELETE /admin/local-payment/sms-subscriptions/:id] Request failed', {
      subscriptionId: id,
      userId: req.user?.id,
      ip: req.ip,
      error: {
        name: error.name,
        message: error.message,
        code: error.code,
        stack: error.stack
      },
      duration: duration,
      startTime: startTimeIso,
      completionTime: completionTime
    });
    
    // Handle timeout errors specifically
    if (error.name === 'TimeoutError' ||
        error.message.toLowerCase().includes('timeout') ||
        error.message.includes('Redis pipeline timeout') ||
        error.code === 'ETIMEDOUT' ||
        error.code === 'ESOCKETTIMEDOUT') {
      console.error('[LOCAL PAYMENT] Timeout error detected - returning 408');
      return res.status(408).json({
        success: false,
        error: 'Request timeout - operation timed out',
        message: 'Request timeout - operation timed out',
        messageBn: 'অনুরোধ সময়সীমা অতিক্রান্ত - অপারেশন সময়সীমা অতিক্রান্ত',
        meta: {
          duration: duration,
          errorType: 'TimeoutError',
          completedAt: completionTime
        }
      });
    }
    
    // Handle not found errors
    if (error.code === 'P2025' || error.message.toLowerCase().includes('not found')) {
      console.error('[LOCAL PAYMENT] Not found error detected - returning 404');
      return res.status(404).json({
        success: false,
        error: 'SMS subscription not found',
        message: 'SMS subscription not found',
        messageBn: 'এসএমএস সাবস্ক্রিপশন তথ্য পাওয়া যায়নি',
        meta: {
          subscriptionId: id,
          duration: duration,
          errorType: 'NotFoundError',
          completedAt: completionTime
        }
      });
    }
    
    // Handle validation errors
    if (error.name === 'ValidationError' || error.code === 'VALIDATION_ERROR') {
      console.error('[LOCAL PAYMENT] Validation error detected - returning 400');
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        message: 'Validation failed',
        messageBn: 'যাচাইকরণ ব্যর্থ হয়েছে',
        details: error.message,
        meta: {
          duration: duration,
          errorType: 'ValidationError',
          completedAt: completionTime
        }
      });
    }
    
    // Handle database errors
    if (error.code && (error.code.startsWith('ER_') || error.code.includes('database') || error.code.includes('SQL'))) {
      console.error('[LOCAL PAYMENT] Database error detected - returning 500');
      return res.status(500).json({
        success: false,
        error: 'Database error',
        message: 'Database error occurred',
        messageBn: 'ডাটাবেস ত্রুটি ঘটেছে',
        details: error.message,
        meta: {
          duration: duration,
          errorType: 'DatabaseError',
          errorCode: error.code,
          completedAt: completionTime
        }
      });
    }
    
    // Generic server error
    console.error('[LOCAL PAYMENT] Generic error detected - returning 500');
    return res.status(500).json({
      success: false,
      error: 'Failed to cancel SMS subscription',
      message: 'Failed to cancel SMS subscription',
      messageBn: 'এসএমএস সাবস্ক্রিপশন বাতিল করতে ব্যর্থ হয়েছে',
      details: error.message,
      meta: {
        duration: duration,
        errorType: error.name,
        errorCode: error.code,
        completedAt: completionTime
      }
    });
  }
});

module.exports = router;
