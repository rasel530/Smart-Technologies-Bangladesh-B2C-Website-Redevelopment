const express = require('express');
const { body, validationResult } = require('express-validator');
const { authMiddleware } = require('../middleware/auth');
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

// Rate limiting map for export endpoints
const rateLimitMap = new Map();

const checkRateLimit = (userId, action, res) => {
  const now = Date.now();
  const fiveMinutes = 5 * 60 * 1000; // 5 minutes in milliseconds

  const key = `${userId}_${action}`;
  const lastAttempt = rateLimitMap.get(key);

  if (lastAttempt && (now - lastAttempt < fiveMinutes)) {
    const remainingTime = Math.ceil((fiveMinutes - (now - lastAttempt)) / 1000 / 60); // minutes
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
    loggerService.info('Data Export Audit', {
      userId,
      action,
      details,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    loggerService.error('Failed to log audit event', error);
  }
};

// ==================== DATA EXPORT ====================

/**
 * GET /api/v1/profile/data/export
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
 * POST /api/v1/profile/data/export/generate
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
    const rateLimitCheck = checkRateLimit(userId, 'data_export', res);
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
        export: {
          exportId: result.exportId,
          dataTypes: req.body.dataTypes,
          format: req.body.format,
          status: result.status,
          requestedAt: new Date().toISOString(),
          expiresAt: result.expiresAt
        }
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
 * GET /api/v1/profile/data/export/:exportId
 * Download exported data
 */
router.get('/data/export/:exportId', authMiddleware.authenticate(), async (req, res) => {
  console.log('[DataExport Route] GET /data/export/:exportId called');
  console.log('[DataExport Route] exportId:', req.params.exportId);
  console.log('[DataExport Route] userId:', req.user.id);
  console.log('[DataExport Route] Request headers:', req.headers);
  
  try {
    const userId = req.user.id;
    const { exportId } = req.params;

    console.log('[DataExport Route] Calling getExportById...');
    const exportRecord = await dataExportService.getExportById(exportId, userId);

    console.log('[DataExport Route] Export record found:', {
      id: exportRecord.id,
      status: exportRecord.status,
      fileUrl: exportRecord.fileUrl,
      userId: exportRecord.userId,
      expiresAt: exportRecord.expiresAt
    });
    
    // Check if file exists
    const fs = require('fs').promises;
    const path = require('path');
    const exportDir = path.join(__dirname, '..', 'exports');
    const filename = exportRecord.fileUrl ? exportRecord.fileUrl.replace('/exports/', '') : null;
    
    if (filename) {
      const filepath = path.join(exportDir, filename);
      console.log('[DataExport Route] Checking if file exists:', filepath);
      try {
        await fs.access(filepath);
        console.log('[DataExport Route] File exists and is accessible');
      } catch (err) {
        console.log('[DataExport Route] File does NOT exist or is not accessible:', err.message);
      }
    } else {
      console.log('[DataExport Route] No fileUrl in export record');
    }

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
    console.error('[DataExport Route] Error:', error);
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

module.exports = router;
