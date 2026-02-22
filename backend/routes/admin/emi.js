const express = require('express');
const { body, param, query, validationResult } = require('express-validator');
const { rbacAuthMiddleware } = require('../../middleware/rbacAuth');
const { authMiddleware } = require('../../middleware/auth');
const { PrismaClient } = require('@prisma/client');

const router = express.Router();
const prisma = new PrismaClient();

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

/**
 * Admin EMI Routes
 * All routes require authentication and appropriate permissions
 */

// Add logging middleware to trace requests
const logRequest = (req, res, next) => {
  console.log('[ADMIN EMI ROUTE] Request received:', {
    method: req.method,
    path: req.path,
    url: req.originalUrl,
    timestamp: new Date().toISOString()
  });
  next();
};

// ==================== EMI PROVIDER ROUTES ====================

/**
 * GET /api/v1/admin/emi/providers - List all EMI providers
 * Permission: emi:read
 */
router.get('/providers', [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('isActive').optional().isBoolean().withMessage('isActive must be a boolean'),
  query('search').optional().isString().withMessage('Search must be a string')
], logRequest, handleValidationErrors, authMiddleware.authenticate(), rbacAuthMiddleware.requirePermission('emi:read'), async (req, res) => {
  try {
    const { page = 1, limit = 10, isActive, search } = req.query;
    const skip = (page - 1) * limit;

    const where = {};
    if (isActive !== undefined) {
      where.isActive = isActive === 'true';
    }
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { website: { contains: search, mode: 'insensitive' } }
      ];
    }

    const [providers, total] = await Promise.all([
      prisma.emiProvider.findMany({
        where,
        skip,
        take: parseInt(limit),
        include: {
          emiPlans: {
            where: { isActive: true },
            orderBy: { displayOrder: 'asc' }
          }
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.emiProvider.count({ where })
    ]);

    res.json({
      success: true,
      message: 'EMI providers retrieved successfully',
      messageBn: 'ইএমআই প্রোভাইডার সফলভাবে পুনরুদ্ধার করা হয়েছে',
      data: {
        providers,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('[ADMIN EMI] Error fetching providers:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch EMI providers',
      messageBn: 'ইএমআই প্রোভাইডার পুনরুদ্ধার করতে ব্যর্থ হয়েছে',
      error: error.message
    });
  }
});

/**
 * GET /api/v1/admin/emi/providers/:id - Get EMI provider by ID
 * Permission: emi:read
 */
router.get('/providers/:id', [
  param('id').isUUID().withMessage('Invalid provider ID')
], handleValidationErrors, authMiddleware.authenticate(), rbacAuthMiddleware.requirePermission('emi:read'), async (req, res) => {
  try {
    const { id } = req.params;

    const provider = await prisma.emiProvider.findUnique({
      where: { id },
      include: {
        emiPlans: {
          orderBy: { displayOrder: 'asc' }
        }
      }
    });

    if (!provider) {
      return res.status(404).json({
        success: false,
        message: 'EMI provider not found',
        messageBn: 'ইএমআই প্রোভাইডার পাওয়া যায়নি'
      });
    }

    res.json({
      success: true,
      message: 'EMI provider retrieved successfully',
      messageBn: 'ইএমআই প্রোভাইডার সফলভাবে পুনরুদ্ধার করা হয়েছে',
      data: provider
    });
  } catch (error) {
    console.error('[ADMIN EMI] Error fetching provider:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch EMI provider',
      messageBn: 'ইএমআই প্রোভাইডার পুনরুদ্ধার করতে ব্যর্থ হয়েছে',
      error: error.message
    });
  }
});

/**
 * POST /api/v1/admin/emi/providers - Create EMI provider
 * Permission: emi:write
 */
router.post('/providers', [
  body('name').notEmpty().isString().withMessage('Provider name is required'),
  body('name').isLength({ min: 2, max: 100 }).withMessage('Provider name must be between 2 and 100 characters'),
  body('logoUrl').optional().isURL().withMessage('Logo URL must be a valid URL'),
  body('website').optional().isURL().withMessage('Website must be a valid URL'),
  body('isActive').optional().isBoolean().withMessage('isActive must be a boolean'),
  body('minAmount').optional().isFloat({ min: 0 }).withMessage('Min amount must be non-negative'),
  body('maxAmount').optional().isFloat({ min: 0 }).withMessage('Max amount must be non-negative'),
  body('processingFee').optional().isFloat({ min: 0 }).withMessage('Processing fee must be non-negative'),
  body('interestRate').optional().isFloat({ min: 0 }).withMessage('Interest rate must be non-negative')
], handleValidationErrors, authMiddleware.authenticate(), rbacAuthMiddleware.requirePermission('emi:write'), async (req, res) => {
  try {
    const {
      name,
      logoUrl,
      website,
      isActive = true,
      minAmount = 5000,
      maxAmount = 500000,
      processingFee = 0,
      interestRate = 0
    } = req.body;

    const provider = await prisma.emiProvider.create({
      data: {
        name,
        logoUrl,
        website,
        isActive,
        minAmount,
        maxAmount,
        processingFee,
        interestRate
      }
    });

    res.status(201).json({
      success: true,
      message: 'EMI provider created successfully',
      messageBn: 'ইএমআই প্রোভাইডার সফলভাবে তৈরি করা হয়েছে',
      data: provider
    });
  } catch (error) {
    console.error('[ADMIN EMI] Error creating provider:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create EMI provider',
      messageBn: 'ইএমআই প্রোভাইডার তৈরি করতে ব্যর্থ হয়েছে',
      error: error.message
    });
  }
});

/**
 * PUT /api/v1/admin/emi/providers/:id - Update EMI provider
 * Permission: emi:write
 */
router.put('/providers/:id', [
  param('id').isUUID().withMessage('Invalid provider ID'),
  body('name').optional().isString().withMessage('Provider name must be a string'),
  body('name').optional().isLength({ min: 2, max: 100 }).withMessage('Provider name must be between 2 and 100 characters'),
  body('logoUrl').optional().isURL().withMessage('Logo URL must be a valid URL'),
  body('website').optional().isURL().withMessage('Website must be a valid URL'),
  body('isActive').optional().isBoolean().withMessage('isActive must be a boolean'),
  body('minAmount').optional().isFloat({ min: 0 }).withMessage('Min amount must be non-negative'),
  body('maxAmount').optional().isFloat({ min: 0 }).withMessage('Max amount must be non-negative'),
  body('processingFee').optional().isFloat({ min: 0 }).withMessage('Processing fee must be non-negative'),
  body('interestRate').optional().isFloat({ min: 0 }).withMessage('Interest rate must be non-negative')
], handleValidationErrors, authMiddleware.authenticate(), rbacAuthMiddleware.requirePermission('emi:write'), async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const provider = await prisma.emiProvider.update({
      where: { id },
      data: updateData
    });

    res.json({
      success: true,
      message: 'EMI provider updated successfully',
      messageBn: 'ইএমআই প্রোভাইডার সফলভাবে আপডেট করা হয়েছে',
      data: provider
    });
  } catch (error) {
    console.error('[ADMIN EMI] Error updating provider:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({
        success: false,
        message: 'EMI provider not found',
        messageBn: 'ইএমআই প্রোভাইডার পাওয়া যায়নি'
      });
    }
    res.status(500).json({
      success: false,
      message: 'Failed to update EMI provider',
      messageBn: 'ইএমআই প্রোভাইডার আপডেট করতে ব্যর্থ হয়েছে',
      error: error.message
    });
  }
});

/**
 * DELETE /api/v1/admin/emi/providers/:idOrCode - Delete EMI provider
 * Permission: emi:delete
 */
router.delete('/providers/:idOrCode', [
  param('idOrCode').custom((value) => {
    // Accept either UUID format or code format
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
    const isCode = /^[a-z0-9-]+(-[a-z0-9-]+)*$/.test(value);
    return isUUID || isCode;
  }).withMessage('Invalid provider identifier'),
  handleValidationErrors
], authMiddleware.authenticate(), rbacAuthMiddleware.requirePermission('emi:delete'), async (req, res) => {
  try {
    const { idOrCode } = req.params;
    
    // Try to find by UUID first, then by code
    let provider;
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrCode);
    
    if (isUUID) {
      provider = await prisma.emiProvider.findUnique({
        where: { id: idOrCode },
        include: { emiPlans: true }
      });
    } else {
      provider = await prisma.emiProvider.findUnique({
        where: { code: idOrCode },
        include: { emiPlans: true }
      });
    }
    
    if (!provider) {
      return res.status(404).json({
        success: false,
        error: 'EMI provider not found',
        message: 'EMI provider not found',
        messageBn: 'ইএমআই প্রোভাইডার পাওয়া যায়নি'
      });
    }
    
    await prisma.emiProvider.delete({
      where: { id: provider.id }
    });
    
    res.json({
      success: true,
      message: 'EMI provider deleted successfully',
      messageBn: 'ইএমআই প্রোভাইডার সফলভাবে মুছে ফেলা হয়েছে'
    });
  } catch (error) {
    console.error('[ADMIN EMI] Error deleting provider:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete EMI provider',
      message: 'Failed to delete EMI provider',
      messageBn: 'ইএমআই প্রোভাইডার মুছে ফেলতে ব্যর্থ হয়েছে'
    });
  }
});

// ==================== EMI PLAN ROUTES ====================

/**
 * GET /api/v1/admin/emi/plans - List all EMI plans
 * Permission: emi:read
 */
router.get('/plans', [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('isActive').optional().isBoolean().withMessage('isActive must be a boolean'),
  query('providerId').optional().isUUID().withMessage('Invalid provider ID'),
  query('search').optional().isString().withMessage('Search must be a string')
], logRequest, handleValidationErrors, authMiddleware.authenticate(), rbacAuthMiddleware.requirePermission('emi:read'), async (req, res) => {
  try {
    const { page = 1, limit = 10, isActive, providerId, search } = req.query;
    const skip = (page - 1) * limit;

    const where = {};
    if (isActive !== undefined) {
      where.isActive = isActive === 'true';
    }
    if (providerId) {
      where.providerId = providerId;
    }
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } }
      ];
    }

    const [plans, total] = await Promise.all([
      prisma.emiPlan.findMany({
        where,
        skip,
        take: parseInt(limit),
        include: {
          provider: true
        },
        orderBy: { displayOrder: 'asc' }
      }),
      prisma.emiPlan.count({ where })
    ]);

    res.json({
      success: true,
      message: 'EMI plans retrieved successfully',
      messageBn: 'ইএমআই প্ল্যান সফলভাবে পুনরুদ্ধার করা হয়েছে',
      data: {
        plans,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('[ADMIN EMI] Error fetching plans:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch EMI plans',
      messageBn: 'ইএমআই প্ল্যান পুনরুদ্ধার করতে ব্যর্থ হয়েছে',
      error: error.message
    });
  }
});

/**
 * GET /api/v1/admin/emi/plans/:id - Get EMI plan by ID
 * Permission: emi:read
 */
router.get('/plans/:id', [
  param('id').isUUID().withMessage('Invalid plan ID')
], handleValidationErrors, authMiddleware.authenticate(), rbacAuthMiddleware.requirePermission('emi:read'), async (req, res) => {
  try {
    const { id } = req.params;

    const plan = await prisma.emiPlan.findUnique({
      where: { id },
      include: {
        provider: true
      }
    });

    if (!plan) {
      return res.status(404).json({
        success: false,
        message: 'EMI plan not found',
        messageBn: 'ইএমআই প্ল্যান পাওয়া যায়নি'
      });
    }

    res.json({
      success: true,
      message: 'EMI plan retrieved successfully',
      messageBn: 'ইএমআই প্ল্যান সফলভাবে পুনরুদ্ধার করা হয়েছে',
      data: plan
    });
  } catch (error) {
    console.error('[ADMIN EMI] Error fetching plan:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch EMI plan',
      messageBn: 'ইএমআই প্ল্যান পুনরুদ্ধার করতে ব্যর্থ হয়েছে',
      error: error.message
    });
  }
});

/**
 * POST /api/v1/admin/emi/plans - Create EMI plan
 * Permission: emi:write
 */
router.post('/plans', [
  body('providerId').notEmpty().isUUID().withMessage('Provider ID is required'),
  body('name').notEmpty().isString().withMessage('Plan name is required'),
  body('name').isLength({ min: 2, max: 100 }).withMessage('Plan name must be between 2 and 100 characters'),
  body('duration').notEmpty().isInt({ min: 1, max: 60 }).withMessage('Duration must be between 1 and 60 months'),
  body('interestRate').notEmpty().isFloat({ min: 0, max: 30 }).withMessage('Interest rate must be between 0 and 30'),
  body('minAmount').optional().isFloat({ min: 0 }).withMessage('Min amount must be non-negative'),
  body('maxAmount').optional().isFloat({ min: 0 }).withMessage('Max amount must be non-negative'),
  body('processingFee').optional().isFloat({ min: 0 }).withMessage('Processing fee must be non-negative'),
  body('downPayment').optional().isFloat({ min: 0 }).withMessage('Down payment must be non-negative'),
  body('isActive').optional().isBoolean().withMessage('isActive must be a boolean'),
  body('displayOrder').optional().isInt({ min: 0 }).withMessage('Display order must be a non-negative integer')
], handleValidationErrors, authMiddleware.authenticate(), rbacAuthMiddleware.requirePermission('emi:write'), async (req, res) => {
  try {
    const {
      providerId,
      name,
      duration,
      interestRate,
      minAmount = 5000,
      maxAmount = 500000,
      processingFee = 0,
      downPayment = 0,
      isActive = true,
      displayOrder = 0
    } = req.body;

    const plan = await prisma.emiPlan.create({
      data: {
        providerId,
        name,
        duration,
        interestRate,
        minAmount,
        maxAmount,
        processingFee,
        downPayment,
        isActive,
        displayOrder
      }
    });

    res.status(201).json({
      success: true,
      message: 'EMI plan created successfully',
      messageBn: 'ইএমআই প্ল্যান সফলভাবে তৈরি করা হয়েছে',
      data: plan
    });
  } catch (error) {
    console.error('[ADMIN EMI] Error creating plan:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create EMI plan',
      messageBn: 'ইএমআই প্ল্যান তৈরি করতে ব্যর্থ হয়েছে',
      error: error.message
    });
  }
});

/**
 * PUT /api/v1/admin/emi/plans/:id - Update EMI plan
 * Permission: emi:write
 */
router.put('/plans/:id', [
  param('id').isUUID().withMessage('Invalid plan ID'),
  body('providerId').optional().isUUID().withMessage('Provider ID must be a valid UUID'),
  body('name').optional().isString().withMessage('Plan name must be a string'),
  body('name').optional().isLength({ min: 2, max: 100 }).withMessage('Plan name must be between 2 and 100 characters'),
  body('duration').optional().isInt({ min: 1, max: 60 }).withMessage('Duration must be between 1 and 60 months'),
  body('interestRate').optional().isFloat({ min: 0, max: 30 }).withMessage('Interest rate must be between 0 and 30'),
  body('minAmount').optional().isFloat({ min: 0 }).withMessage('Min amount must be non-negative'),
  body('maxAmount').optional().isFloat({ min: 0 }).withMessage('Max amount must be non-negative'),
  body('processingFee').optional().isFloat({ min: 0 }).withMessage('Processing fee must be non-negative'),
  body('downPayment').optional().isFloat({ min: 0 }).withMessage('Down payment must be non-negative'),
  body('isActive').optional().isBoolean().withMessage('isActive must be a boolean'),
  body('displayOrder').optional().isInt({ min: 0 }).withMessage('Display order must be a non-negative integer')
], handleValidationErrors, authMiddleware.authenticate(), rbacAuthMiddleware.requirePermission('emi:write'), async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const plan = await prisma.emiPlan.update({
      where: { id },
      data: updateData
    });

    res.json({
      success: true,
      message: 'EMI plan updated successfully',
      messageBn: 'ইএমআই প্ল্যান সফলভাবে আপডেট করা হয়েছে',
      data: plan
    });
  } catch (error) {
    console.error('[ADMIN EMI] Error updating plan:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({
        success: false,
        message: 'EMI plan not found',
        messageBn: 'ইএমআই প্ল্যান পাওয়া যায়নি'
      });
    }
    res.status(500).json({
      success: false,
      message: 'Failed to update EMI plan',
      messageBn: 'ইএমআই প্ল্যান আপডেট করতে ব্যর্থ হয়েছে',
      error: error.message
    });
  }
});

/**
 * DELETE /api/v1/admin/emi/plans/:idOrCode - Delete EMI plan
 * Permission: emi:delete
 */
router.delete('/plans/:idOrCode', [
  param('idOrCode').custom((value) => {
    console.log('[ADMIN EMI DELETE] Validating idOrCode:', value);
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
    const isCode = /^[a-z0-9-]+(-[a-z0-9-]+)*$/.test(value);
    console.log('[ADMIN EMI DELETE] isUUID:', isUUID, 'isCode:', isCode);
    return isUUID || isCode;
  }).withMessage('Invalid plan identifier'),
  handleValidationErrors
], authMiddleware.authenticate(), rbacAuthMiddleware.requirePermission('emi:delete'), async (req, res) => {
  console.log('[ADMIN EMI DELETE] Route handler invoked for:', req.params.idOrCode);
  console.log('[ADMIN EMI DELETE] Full URL:', req.originalUrl);
  try {
    const { idOrCode } = req.params;
    
    // Try to find by UUID first, then by code
    let plan;
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrCode);
    
    if (isUUID) {
      plan = await prisma.emiPlan.findUnique({
        where: { id: idOrCode },
        include: { provider: true }
      });
    } else {
      plan = await prisma.emiPlan.findUnique({
        where: { code: idOrCode },
        include: { provider: true }
      });
    }
    
    if (!plan) {
      return res.status(404).json({
        success: false,
        error: 'EMI plan not found',
        message: 'EMI plan not found',
        messageBn: 'ইএমআই প্ল্যান পাওয়া যায়নি'
      });
    }
    
    await prisma.emiPlan.delete({
      where: { id: plan.id }
    });
    
    res.json({
      success: true,
      message: 'EMI plan deleted successfully',
      messageBn: 'ইএমআই প্ল্যান সফলভাবে মুছে ফেলা হয়েছে'
    });
  } catch (error) {
    console.error('[ADMIN EMI] Error deleting plan:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete EMI plan',
      message: 'Failed to delete EMI plan',
      messageBn: 'ইএমআই প্ল্যান মুছে ফেলতে ব্যর্থ হয়েছে'
    });
  }
});

/**
 * PUT /api/v1/admin/emi/providers/:id/toggle-status - Toggle provider status
 * Permission: emi:write
 */
router.put('/providers/:id/toggle-status', [
  param('id').isUUID().withMessage('Invalid provider ID')
], handleValidationErrors, authMiddleware.authenticate(), rbacAuthMiddleware.requirePermission('emi:write'), async (req, res) => {
  try {
    const { id } = req.params;

    const provider = await prisma.emiProvider.findUnique({
      where: { id }
    });

    if (!provider) {
      return res.status(404).json({
        success: false,
        message: 'EMI provider not found',
        messageBn: 'ইএমআই প্রোভাইডার পাওয়া যায়নি'
      });
    }

    const updatedProvider = await prisma.emiProvider.update({
      where: { id },
      data: { isActive: !provider.isActive }
    });

    res.json({
      success: true,
      message: `EMI provider ${updatedProvider.isActive ? 'activated' : 'deactivated'} successfully`,
      messageBn: `ইএমআই প্রোভাইডার ${updatedProvider.isActive ? 'সক্রিয়' : 'নিষ্ক্রিয়'} করা হয়েছে`,
      data: updatedProvider
    });
  } catch (error) {
    console.error('[ADMIN EMI] Error toggling provider status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to toggle provider status',
      messageBn: 'প্রোভাইডার স্ট্যাটাস টগল করতে ব্যর্থ হয়েছে',
      error: error.message
    });
  }
});

/**
 * PUT /api/v1/admin/emi/plans/:id/toggle-status - Toggle plan status
 * Permission: emi:write
 */
router.put('/plans/:id/toggle-status', [
  param('id').isUUID().withMessage('Invalid plan ID')
], handleValidationErrors, authMiddleware.authenticate(), rbacAuthMiddleware.requirePermission('emi:write'), async (req, res) => {
  try {
    const { id } = req.params;

    const plan = await prisma.emiPlan.findUnique({
      where: { id }
    });

    if (!plan) {
      return res.status(404).json({
        success: false,
        message: 'EMI plan not found',
        messageBn: 'ইএমআই প্ল্যান পাওয়া যায়নি'
      });
    }

    const updatedPlan = await prisma.emiPlan.update({
      where: { id },
      data: { isActive: !plan.isActive }
    });

    res.json({
      success: true,
      message: `EMI plan ${updatedPlan.isActive ? 'activated' : 'deactivated'} successfully`,
      messageBn: `ইএমআই প্ল্যান ${updatedPlan.isActive ? 'সক্রিয়' : 'নিষ্ক্রিয়'} করা হয়েছে`,
      data: updatedPlan
    });
  } catch (error) {
    console.error('[ADMIN EMI] Error toggling plan status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to toggle plan status',
      messageBn: 'প্ল্যান স্ট্যাটাস টগল করতে ব্যর্থ হয়েছে',
      error: error.message
    });
  }
});

module.exports = router;
