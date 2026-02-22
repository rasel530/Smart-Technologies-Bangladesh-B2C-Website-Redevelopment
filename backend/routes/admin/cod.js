const express = require('express');
const { body, param, validationResult } = require('express-validator');
const { rbacAuthMiddleware } = require('../../middleware/rbacAuth');
const { authMiddleware } = require('../../middleware/auth');
const { codService } = require('../../services/codService');

const router = express.Router();

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
 * Admin COD Routes
 * All routes require authentication and appropriate permissions
 */

// Add logging middleware to trace requests
const logRequest = (req, res, next) => {
  console.log('[ADMIN COD ROUTE] Request received:', {
    method: req.method,
    path: req.path,
    url: req.originalUrl,
    timestamp: new Date().toISOString()
  });
  next();
};

/**
 * GET /api/v1/admin/cod/settings - Get COD settings
 * Permission: cod:read
 */
router.get('/settings', [
  logRequest,
  handleValidationErrors,
  authMiddleware.authenticate(),
  rbacAuthMiddleware.requirePermission('cod:read')
], async (req, res) => {
  try {
    const settings = await codService.getCodSettings();

    res.json({
      success: true,
      message: 'COD settings retrieved successfully',
      messageBn: 'ক্যাশ অন ডেলিভারি সেটিংস সফলভাবে পুনরুদ্ধার করা হয়েছে',
      data: settings
    });
  } catch (error) {
    console.error('[ADMIN COD] Error fetching COD settings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch COD settings',
      messageBn: 'ক্যাশ অন ডেলিভারি সেটিংস পুনরুদ্ধার করতে ব্যর্থ হয়েছে',
      error: error.message
    });
  }
});

/**
 * PUT /api/v1/admin/cod/settings - Update COD settings
 * Permission: cod:write
 */
router.put('/settings', [
  body('isEnabled').optional().isBoolean().withMessage('isEnabled must be a boolean'),
  body('minAmount').optional().isFloat({ min: 0 }).withMessage('Min amount must be non-negative'),
  body('maxAmount').optional().isFloat({ min: 0 }).withMessage('Max amount must be non-negative'),
  body('additionalFee').optional().isFloat({ min: 0 }).withMessage('Additional fee must be non-negative'),
  body('freeAboveAmount').optional().isFloat({ min: 0 }).withMessage('Free above amount must be non-negative'),
  body('requirePhoneVerification').optional().isBoolean().withMessage('requirePhoneVerification must be a boolean'),
  body('requireAddressVerification').optional().isBoolean().withMessage('requireAddressVerification must be a boolean'),
  body('maxDailyOrders').optional().isInt({ min: 1 }).withMessage('Max daily orders must be a positive integer'),
  body('maxWeeklyOrders').optional().isInt({ min: 1 }).withMessage('Max weekly orders must be a positive integer'),
  body('deliveryDays').optional().isInt({ min: 1 }).withMessage('Delivery days must be a positive integer'),
  body('availableDivisions').optional().isArray().withMessage('availableDivisions must be an array'),
  body('unavailableDivisions').optional().isArray().withMessage('unavailableDivisions must be an array'),
  body('notes').optional().isString().withMessage('Notes must be a string')
], handleValidationErrors, authMiddleware.authenticate(), rbacAuthMiddleware.requirePermission('cod:write'), async (req, res) => {
  try {
    const settingsData = req.body;

    const updatedSettings = await codService.updateCodSettings(settingsData);

    res.json({
      success: true,
      message: 'COD settings updated successfully',
      messageBn: 'ক্যাশ অন ডেলিভারি সেটিংস সফলভাবে আপডেট করা হয়েছে',
      data: updatedSettings
    });
  } catch (error) {
    console.error('[ADMIN COD] Error updating COD settings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update COD settings',
      messageBn: 'ক্যাশ অন ডেলিভারি সেটিংস আপডেট করতে ব্যর্থ হয়েছে',
      error: error.message
    });
  }
});

/**
 * GET /api/v1/admin/cod/configuration - Get COD configuration (for frontend)
 * Permission: cod:read
 */
router.get('/configuration', [
  logRequest,
  handleValidationErrors,
  authMiddleware.authenticate(),
  rbacAuthMiddleware.requirePermission('cod:read')
], async (req, res) => {
  try {
    const configuration = await codService.getCodConfiguration();

    res.json({
      success: true,
      message: 'COD configuration retrieved successfully',
      messageBn: 'ক্যাশ অন ডেলিভারি কনফিগারেশন সফলভাবে পুনরুদ্ধার করা হয়েছে',
      data: configuration
    });
  } catch (error) {
    console.error('[ADMIN COD] Error fetching COD configuration:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch COD configuration',
      messageBn: 'ক্যাশ অন ডেলিভারি কনফিগারেশন পুনরুদ্ধার করতে ব্যর্থ হয়েছে',
      error: error.message
    });
  }
});

module.exports = router;
