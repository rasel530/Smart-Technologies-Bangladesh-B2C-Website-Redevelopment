const express = require('express');
const { body, validationResult } = require('express-validator');
const { authMiddleware } = require('../middleware/auth');
const { accountPreferencesService } = require('../services/accountPreferences.service');
const { loggerService } = require('../services/logger');

const router = express.Router();

// Validation constants
const VALID_NOTIFICATION_FREQUENCIES = ['immediate', 'daily', 'weekly', 'monthly'];
const VALID_PROFILE_VISIBILITY = ['public', 'private', 'friends_only'];
const VALID_2FA_METHODS = ['sms', 'authenticator_app'];

// Validation middleware
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      message: 'Invalid request data',
      messageBn: 'অবৈধ অনুরোধ ব্যর্থ'
    });
  }
  next();
};

// Rate limiting map for deletion and export endpoints
const rateLimitMap = new Map();

const checkRateLimit = (userId, action) => {
  const now = Date.now();
  const oneHour = 60 * 60 * 1000; // 1 hour in milliseconds

  const key = `${userId}_${action}`;
  const lastAttempt = rateLimitMap.get(key);

  if (lastAttempt && (now - lastAttempt < oneHour)) {
    const remainingTime = Math.ceil((oneHour - (now - lastAttempt)) / 1000 / 60); // minutes
    return {
      allowed: false,
      remainingTime
    };
  }

  rateLimitMap.set(key, now);
  return { allowed: true };
};

// Audit logging function
const logAuditEvent = async (userId, action, details) => {
  try {
    loggerService.info('Account Preferences Audit', {
      userId,
      action,
      details,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    loggerService.error('Failed to log audit event', error);
  }
};

// ==================== NOTIFICATION PREFERENCES ====================

/**
 * GET /api/user/preferences/notifications
 * Get user's notification preferences
 */
router.get('/preferences/notifications', authMiddleware.authenticate(), async (req, res) => {
  try {
    const userId = req.user.id;
    const preferences = await accountPreferencesService.getNotificationPreferences(userId);

    res.json({
      success: true,
      data: preferences
    });
  } catch (error) {
    loggerService.error('Get notification preferences error', error);
    res.status(500).json({
      error: 'Failed to fetch notification preferences',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
      messageBn: 'নোটিফিকেশন পছনা ব্যর্থ'
    });
  }
});

/**
 * PUT /api/user/preferences/notifications
 * Update notification preferences
 */
router.put('/preferences/notifications', [
  body('email').optional().isBoolean(),
  body('sms').optional().isBoolean(),
  body('whatsapp').optional().isBoolean(),
  body('marketing').optional().isBoolean(),
  body('newsletter').optional().isBoolean(),
  body('orderUpdates').optional().isBoolean(),
  body('securityAlerts').optional().isBoolean(),
  body('push').optional().isBoolean(),
  body('frequency').optional().isIn(VALID_NOTIFICATION_FREQUENCIES).withMessage('Invalid notification frequency')
], handleValidationErrors, authMiddleware.authenticate(), async (req, res) => {
  try {
    const userId = req.user.id;
    const updates = {
      email: req.body.email,
      sms: req.body.sms,
      whatsapp: req.body.whatsapp,
      marketing: req.body.marketing,
      newsletter: req.body.newsletter,
      orderUpdates: req.body.orderUpdates,
      securityAlerts: req.body.securityAlerts,
      push: req.body.push
    };

    const preferences = await accountPreferencesService.updateNotificationPreferences(userId, updates);

    await logAuditEvent(userId, 'UPDATE_NOTIFICATION_PREFERENCES', updates);

    res.json({
      success: true,
      message: 'Notification preferences updated successfully',
      messageBn: 'নোটিফিকেশন পছনা ব্যর্থ',
      data: preferences
    });
  } catch (error) {
    loggerService.error('Update notification preferences error', error);
    res.status(500).json({
      error: 'Failed to update notification preferences',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
      messageBn: 'নোটিফিকেশন পছনা ব্যর্থ'
    });
  }
});

/**
 * GET /api/user/preferences/communication
 * Get communication preferences
 */
router.get('/preferences/communication', authMiddleware.authenticate(), async (req, res) => {
  try {
    const userId = req.user.id;
    const preferences = await accountPreferencesService.getCommunicationPreferences(userId);

    res.json({
      success: true,
      data: preferences
    });
  } catch (error) {
    loggerService.error('Get communication preferences error', error);
    res.status(500).json({
      error: 'Failed to fetch communication preferences',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
      messageBn: 'যোগাযোগ পছনা সফল হয়া ব্যর্থ'
    });
  }
});

/**
 * PUT /api/user/preferences/communication
 * Update communication preferences
 */
router.put('/preferences/communication', [
  body('email').optional().isBoolean(),
  body('sms').optional().isBoolean(),
  body('whatsapp').optional().isBoolean(),
  body('marketing').optional().isBoolean(),
  body('newsletter').optional().isBoolean(),
  body('frequency').optional().isIn(VALID_NOTIFICATION_FREQUENCIES).withMessage('Invalid notification frequency')
], handleValidationErrors, authMiddleware.authenticate(), async (req, res) => {
  try {
    const userId = req.user.id;
    const updates = {
      email: req.body.email,
      sms: req.body.sms,
      whatsapp: req.body.whatsapp,
      marketing: req.body.marketing,
      newsletter: req.body.newsletter,
      frequency: req.body.frequency
    };

    const preferences = await accountPreferencesService.updateNotificationPreferences(userId, updates);

    await logAuditEvent(userId, 'UPDATE_COMMUNICATION_PREFERENCES', updates);

    res.json({
      success: true,
      message: 'Communication preferences updated successfully',
      messageBn: 'যোগাযোগ পছনা সফল হয়া ব্যর্থ',
      data: preferences
    });
  } catch (error) {
    loggerService.error('Update communication preferences error', error);
    res.status(500).json({
      error: 'Failed to update communication preferences',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
      messageBn: 'যোগাযোগ পছনা সফল হয়া ব্যর্থ'
    });
  }
});

// ==================== PRIVACY SETTINGS ====================

/**
 * GET /api/user/preferences/privacy
 * Get privacy settings
 */
router.get('/preferences/privacy', authMiddleware.authenticate(), async (req, res) => {
  try {
    const userId = req.user.id;
    const settings = await accountPreferencesService.getPrivacySettings(userId);

    res.json({
      success: true,
      data: settings
    });
  } catch (error) {
    loggerService.error('Get privacy settings error', error);
    res.status(500).json({
      error: 'Failed to fetch privacy settings',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
      messageBn: 'গোপনীয়তা সেটিং ব্যর্থ'
    });
  }
});

/**
 * PUT /api/user/preferences/privacy
 * Update privacy settings
 */
router.put('/preferences/privacy', [
  body('twoFactorEnabled').optional().isBoolean(),
  body('dataSharingEnabled').optional().isBoolean(),
  body('profileVisibility').optional().isIn(VALID_PROFILE_VISIBILITY).withMessage('Invalid profile visibility'),
  body('showEmail').optional().isBoolean(),
  body('showPhone').optional().isBoolean(),
  body('showAddress').optional().isBoolean(),
  body('allowSearchByEmail').optional().isBoolean(),
  body('allowSearchByPhone').optional().isBoolean(),
  body('twoFactorMethod').optional().isIn(VALID_2FA_METHODS).withMessage('Invalid 2FA method'),
  body('twoFactorSecret').optional()
], handleValidationErrors, authMiddleware.authenticate(), async (req, res) => {
  try {
    const userId = req.user.id;
    const updates = req.body;

    const settings = await accountPreferencesService.updatePrivacySettings(userId, updates);

    await logAuditEvent(userId, 'UPDATE_PRIVACY_SETTINGS', updates);

    res.json({
      success: true,
      message: 'Privacy settings updated successfully',
      messageBn: 'গোপনীয়তা সেটিং ব্যর্থ',
      data: settings
    });
  } catch (error) {
    loggerService.error('Update privacy settings error', error);
    res.status(500).json({
      error: 'Failed to update privacy settings',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
      messageBn: 'গোপনীয়তা সেটিং ব্যর্থ'
    });
  }
});

// ==================== PASSWORD MANAGEMENT ====================

/**
 * POST /api/user/password/change
 * Change password
 */
router.post('/password/change', [
  body('currentPassword').notEmpty().trim().withMessage('Current password is required'),
  body('newPassword').isLength({ min: 8, max: 128 }).withMessage('Password must be between 8 and 128 characters'),
  body('confirmPassword').notEmpty().trim().withMessage('Password confirmation is required')
], handleValidationErrors, authMiddleware.authenticate(), async (req, res) => {
  try {
    const userId = req.user.id;
    const { currentPassword, newPassword, confirmPassword } = req.body;

    // Validate new password matches confirmation
    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        error: 'Passwords do not match',
        message: 'New password and confirmation password must match',
        messageBn: 'নতুন পাসওয়ার্ড একই হতে হবে'
      });
    }

    // Validate password strength (at least 8 chars, mixed case, numbers)
    if (newPassword.length < 8) {
      return res.status(400).json({
        error: 'Password too weak',
        message: 'Password must be at least 8 characters long',
        messageBn: 'পাসওয়ার্ড একই হতে হবে'
      });
    }

    if (!/[A-Z]/.test(newPassword)) {
      return res.status(400).json({
        error: 'Password too weak',
        message: 'Password must contain at least one uppercase letter',
        messageBn: 'পাসওয়ার্ডে অবশ্যই একই হতে হবে'
      });
    }

    if (!/[a-z]/.test(newPassword)) {
      return res.status(400).json({
        error: 'Password too weak',
        message: 'Password must contain at least one lowercase letter',
        messageBn: 'পাসওয়ার্ডে অবশ্যই একই হতে হবে'
      });
    }

    if (!/\d/.test(newPassword)) {
      return res.status(400).json({
        error: 'Password too weak',
        message: 'Password must contain at least one number',
        messageBn: 'পাসওয়ার্ডে অংশ্যই একই হতে হবে'
      });
    }

    await accountPreferencesService.changePassword(userId, currentPassword, newPassword);

    await logAuditEvent(userId, 'CHANGE_PASSWORD', { timestamp: new Date().toISOString() });

    res.json({
      success: true,
      message: 'Password changed successfully',
      messageBn: 'পাসওয়ার্ডে সফল হয়া ব্যর্থ'
    });
  } catch (error) {
    loggerService.error('Change password error', error);
    res.status(500).json({
      error: 'Failed to change password',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
      messageBn: 'পাসওয়ার্ড ব্যর্থ ব্যর্থ'
    });
  }
});

// ==================== TWO FACTOR AUTHENTICATION ====================

/**
 * POST /api/user/2fa/enable
 * Enable 2FA
 */
router.post('/2fa/enable', [
  body('method').notEmpty().trim().isIn(VALID_2FA_METHODS).withMessage('Invalid 2FA method'),
  body('phoneNumber').optional().trim()
], handleValidationErrors, authMiddleware.authenticate(), async (req, res) => {
  try {
    const userId = req.user.id;
    const { method, phoneNumber } = req.body;

    const result = await accountPreferencesService.enableTwoFactor(userId, method, phoneNumber);

    await logAuditEvent(userId, 'ENABLE_2FA', { method, phoneNumber: method === 'sms' ? phoneNumber : null });

    res.json({
      success: true,
      message: '2FA enabled successfully',
      messageBn: '2FA সফল হয়া ব্যর্থ',
      data: {
        twoFactorEnabled: result.twoFactorEnabled,
        twoFactorMethod: result.twoFactorMethod,
        phoneNumber: result.phoneNumber,
        twoFactorSecret: result.twoFactorSecret
      }
    });
  } catch (error) {
    loggerService.error('Enable 2FA error', error);
    res.status(500).json({
      error: 'Failed to enable 2FA',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
      messageBn: '2FA সক্রিয়া ব্যর্থ'
    });
  }
});

/**
 * POST /api/user/2fa/disable
 * Disable 2FA
 */
router.post('/2fa/disable', authMiddleware.authenticate(), async (req, res) => {
  try {
    const userId = req.user.id;

    await accountPreferencesService.disableTwoFactor(userId);

    await logAuditEvent(userId, 'DISABLE_2FA', { timestamp: new Date().toISOString() });

    res.json({
      success: true,
      message: '2FA disabled successfully',
      messageBn: '2FA বন্ধ করা হয়া ব্যর্থ'
    });
  } catch (error) {
    loggerService.error('Disable 2FA error', error);
    res.status(500).json({
      error: 'Failed to disable 2FA',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
      messageBn: '2FA বন্ধ করা ব্যর্থ'
    });
  }
});

module.exports = router;
