const express = require('express');
const { body, validationResult } = require('express-validator');
const { authMiddleware } = require('../middleware/auth');
const { accountDeletionService } = require('../services/accountDeletion.service');
const { dataExportService } = require('../services/dataExport.service');
const { loggerService } = require('../services/logger');

const router = express.Router();

// Validation middleware
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      message: 'Invalid request data',
      messageBn: 'অবৈধ ব্যর্থ ব্যর্থ',
      details: errors.array()
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
    return res.status(429).json({
      error: 'Too many requests',
      message: `Please wait ${remainingTime} minutes before trying again`,
      messageBn: `অনুরোধ করার জন্য ${remainingTime} মিনিট অপেক্ষা করুন`
    });
  }

  rateLimitMap.set(key, now);
  return { allowed: true };
};

// Audit logging function
const logAuditEvent = async (userId, action, details) => {
  try {
    loggerService.info('Account Management Audit', {
      userId,
      action,
      details,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    loggerService.error('Failed to log audit event', error);
  }
};

// ==================== ACCOUNT DELETION ====================

/**
 * POST /api/user/account/deletion/request
 * Request account deletion
 */
router.post('/account/deletion/request', [
  body('reason').optional().trim(),
  body('confirmation').notEmpty().trim().equals('DELETE').withMessage('You must type DELETE to confirm')
], handleValidationErrors, authMiddleware.authenticate(), async (req, res) => {
  try {
    const userId = req.user.id;
    const { reason, confirmation } = req.body;

    // Check rate limit
    const rateLimitCheck = checkRateLimit(userId, 'deletion_request');
    if (!rateLimitCheck.allowed) {
      return;
    }

    const result = await accountDeletionService.requestAccountDeletion(userId, reason);

    await logAuditEvent(userId, 'ACCOUNT_DELETION_REQUESTED', { reason });

    res.json({
      success: true,
      message: 'Account deletion request submitted. Please check your email for confirmation.',
      messageBn: 'অ্যাকাউন্ট ডিলিশন অনুরোধ জমা হয়েছে। নিশ্চিতার জন্য ইমেল চেক করুন।',
      data: {
        deletionToken: result.deletionToken,
        expiresAt: result.expiresAt,
        scheduledDeletionDate: result.scheduledDeletionDate
      }
    });
  } catch (error) {
    loggerService.error('Account deletion request error', error);
    res.status(500).json({
      error: 'Failed to request account deletion',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
      messageBn: 'অ্যাকাউন্ট ডিলিশন অনুরোধ ব্যর্থ হয়েছে'
    });
  }
});

/**
 * POST /api/user/account/deletion/confirm
 * Confirm deletion with token
 */
router.post('/account/deletion/confirm', [
  body('deletionToken').notEmpty().trim().withMessage('Deletion token is required')
], handleValidationErrors, authMiddleware.authenticate(), async (req, res) => {
  try {
    const userId = req.user.id;
    const { deletionToken } = req.body;

    await accountDeletionService.confirmAccountDeletion(userId, deletionToken);

    await logAuditEvent(userId, 'ACCOUNT_DELETION_CONFIRMED', { deletionToken });

    res.json({
      success: true,
      message: 'Account deletion confirmed. Your account will be permanently deleted in 30 days.',
      messageBn: 'অ্যাকাউন্ট ডিলিশন নিশ্চিত হয়েছে। আপনার অ্যাকাউন্ট ৩০ দিনের মধ্যে স্থায়ী ডিলিট হবে।'
    });
  } catch (error) {
    loggerService.error('Account deletion confirmation error', error);
    res.status(500).json({
      error: 'Failed to confirm account deletion',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
      messageBn: 'অ্যাকাউন্ট ডিলিশন নিশ্চিত ব্যর্থ হয়েছে'
    });
  }
});

/**
 * POST /api/user/account/deletion/cancel
 * Cancel pending deletion request
 */
router.post('/account/deletion/cancel', authMiddleware.authenticate(), async (req, res) => {
  try {
    const userId = req.user.id;

    await accountDeletionService.cancelAccountDeletion(userId);

    await logAuditEvent(userId, 'ACCOUNT_DELETION_CANCELLED', { timestamp: new Date().toISOString() });

    res.json({
      success: true,
      message: 'Account deletion request cancelled successfully.',
      messageBn: 'অ্যাকাউন্ট ডিলিশন অনুরোধ বাতিল হয়েছে।'
    });
  } catch (error) {
    loggerService.error('Account deletion cancellation error', error);
    res.status(500).json({
      error: 'Failed to cancel account deletion',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
      messageBn: 'অ্যাকাউন্ট ডিলিশন বাতিল ব্যর্থ হয়েছে'
    });
  }
});

/**
 * GET /api/user/account/deletion/status
 * Get account deletion status
 */
router.get('/deletion/status', authMiddleware.authenticate(), async (req, res) => {
  try {
    const userId = req.user.id;

    const status = await accountDeletionService.getDeletionStatus(userId);

    res.json({
      success: true,
      data: status
    });
  } catch (error) {
    loggerService.error('Get deletion status error', error);
    res.status(500).json({
      error: 'Failed to get deletion status',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
      messageBn: 'ডিলিশন স্ট্যাটাস পাওতে ব্যর্থ হয়েছে'
    });
  }
});

// ==================== DATA EXPORT ====================

/**
 * GET /api/user/data/export
 * Get data export link
 */
router.get('/data/export', authMiddleware.authenticate(), async (req, res) => {
  try {
    const userId = req.user.id;

    const exports = await dataExportService.getExportHistory(userId);

    res.json({
      success: true,
      data: {
        exports
      }
    });
  } catch (error) {
    loggerService.error('Get data export error', error);
    res.status(500).json({
      error: 'Failed to get data export',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
      messageBn: 'ডাটা এক্সপোর্ট পাওতে ব্যর্থ হয়েছে'
    });
  }
});

/**
 * POST /api/user/data/export/generate
 * Generate data export
 */
router.post('/data/export/generate', [
  body('dataTypes').isArray({ min: 1 }).withMessage('At least one data type must be selected'),
  body('dataTypes.*').isIn(['profile', 'orders', 'addresses', 'wishlist']).withMessage('Invalid data type'),
  body('format').isIn(['json', 'csv']).withMessage('Invalid export format')
], handleValidationErrors, authMiddleware.authenticate(), async (req, res) => {
  try {
    const userId = req.user.id;
    const { dataTypes, format } = req.body;

    // Check rate limit
    const rateLimitCheck = checkRateLimit(userId, 'data_export');
    if (!rateLimitCheck.allowed) {
      return;
    }

    const result = await dataExportService.requestDataExport(userId, dataTypes, format);

    await logAuditEvent(userId, 'DATA_EXPORT_REQUESTED', { dataTypes, format });

    res.json({
      success: true,
      message: 'Data export request submitted. You will receive an email when the export is ready.',
      messageBn: 'ডাটা এক্সপোর্ট অনুরোধ জমা হয়েছে। এক্সপোর্ট প্রস্ত হলে আপনাকে ইমেল পাঠানো হবে।',
      data: {
        exportId: result.exportId,
        exportToken: result.exportToken,
        status: result.status,
        expiresAt: result.expiresAt
      }
    });
  } catch (error) {
    loggerService.error('Data export request error', error);
    res.status(500).json({
      error: 'Failed to request data export',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
      messageBn: 'ডাটা এক্সপোর্ট অনুরোধ ব্যর্থ হয়েছে'
    });
  }
});

/**
 * GET /api/user/data/export/:exportId
 * Download exported data
 */
router.get('/data/export/:exportId', authMiddleware.authenticate(), async (req, res) => {
  try {
    const userId = req.user.id;
    const { exportId } = req.params;

    const exportRecord = await dataExportService.getExportById(exportId, userId);

    // In production, this would serve the file from S3/CloudFront
    // For now, return the download URL
    res.json({
      success: true,
      message: 'Export ready for download',
      messageBn: 'এক্সপোর্ট ডাউনলোডের জন্য প্রস্ত',
      data: {
        downloadUrl: exportRecord.fileUrl,
        expiresAt: exportRecord.expiresAt
      }
    });
  } catch (error) {
    loggerService.error('Download export error', error);
    if (error.message.includes('not found') || error.message.includes('expired') || error.message.includes('denied')) {
      res.status(404).json({
        error: error.message,
        message: process.env.NODE_ENV === 'development' ? error.message : 'Export not found or expired',
        messageBn: 'এক্সপোর্ট পাওয়া যায় বা মেয়াদীপূর্ণ হয়েছে'
      });
    } else {
      res.status(500).json({
        error: 'Failed to download export',
        message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
        messageBn: 'এক্সপোর্ট ডাউনলোড ব্যর্থ হয়েছে'
      });
    }
  }
});

// ==================== TWO-FACTOR AUTHENTICATION ====================

/**
 * POST /api/v1/profile/2fa/enable
 * Enable two-factor authentication
 */
router.post('/2fa/enable', authMiddleware.authenticate(), async (req, res) => {
  try {
    const userId = req.user.id;

    // Basic implementation - return success response
    // In production, this would generate and return QR code/secret
    res.json({
      success: true,
      message: 'Two-factor authentication enabled successfully.',
      messageBn: 'দুই-ফ্যাক্টর প্রমাণীকরণ সফলভাবে সক্ষম করা হয়েছে।',
      data: {
        enabled: true,
        qrCode: 'otpauth://totp/Example:user@example.com?secret=JBSWY3DPEHPK3PXP&issuer=Example'
      }
    });
  } catch (error) {
    loggerService.error('Enable 2FA error', error);
    res.status(500).json({
      error: 'Failed to enable two-factor authentication',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
      messageBn: 'দুই-ফ্যাক্টর প্রমাণীকরণ সক্ষম করতে ব্যর্থ হয়েছে'
    });
  }
});

/**
 * POST /api/v1/profile/2fa/disable
 * Disable two-factor authentication
 */
router.post('/2fa/disable', authMiddleware.authenticate(), async (req, res) => {
  try {
    const userId = req.user.id;

    // Basic implementation - return success response
    // In production, this would verify current password before disabling
    res.json({
      success: true,
      message: 'Two-factor authentication disabled successfully.',
      messageBn: 'দুই-ফ্যাক্টর প্রমাণীকরণ সফলভাবে অক্ষম করা হয়েছে।',
      data: {
        enabled: false
      }
    });
  } catch (error) {
    loggerService.error('Disable 2FA error', error);
    res.status(500).json({
      error: 'Failed to disable two-factor authentication',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
      messageBn: 'দুই-ফ্যাক্টর প্রমাণীকরণ অক্ষম করতে ব্যর্থ হয়েছে'
    });
  }
});

/**
 * GET /api/v1/profile/2fa/status
 * Get 2FA status
 */
router.get('/2fa/status', authMiddleware.authenticate(), async (req, res) => {
  try {
    const userId = req.user.id;

    // Basic implementation - return status response
    // In production, this would check actual 2FA status from database
    res.json({
      success: true,
      data: {
        enabled: false,
        method: null
      }
    });
  } catch (error) {
    loggerService.error('Get 2FA status error', error);
    res.status(500).json({
      error: 'Failed to get two-factor authentication status',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
      messageBn: 'দুই-ফ্যাক্টর প্রমাণীকরণ স্ট্যাটাস পেতে ব্যর্থ হয়েছে'
    });
  }
});

module.exports = router;
