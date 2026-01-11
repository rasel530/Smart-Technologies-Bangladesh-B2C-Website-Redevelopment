const { body, validationResult } = require('express-validator');

/**
 * Validation middleware for account management
 */
const validateAccountManagement = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      message: 'Invalid request data',
      messageBn: 'অবৈধ অনুরোধ ব্যর্থ',
      details: errors.array()
    });
  }
  
  next();
};

/**
 * Validate password change
 */
const validatePasswordChange = [
  body('currentPassword').notEmpty().trim().withMessage('Current password is required'),
  body('newPassword').isLength({ min: 8, max: 128 }).withMessage('Password must be between 8 and 128 characters'),
  body('confirmPassword').notEmpty().trim().withMessage('Password confirmation is required')
];

/**
 * Validate 2FA enable
 */
const validate2FAEnable = [
  body('method').notEmpty().trim().isIn(['sms', 'authenticator_app']).withMessage('Invalid 2FA method'),
  body('phoneNumber').optional().trim()
];

/**
 * Validate account deletion request
 */
const validateAccountDeletionRequest = [
  body('reason').optional().trim(),
  body('confirmation').notEmpty().trim().equals('DELETE').withMessage('You must type DELETE to confirm')
];

/**
 * Validate deletion confirmation
 */
const validateDeletionConfirmation = [
  body('deletionToken').notEmpty().trim().withMessage('Deletion token is required')
];

/**
 * Validate data export request
 */
const validateDataExportRequest = [
  body('dataTypes').isArray({ min: 1 }).withMessage('At least one data type must be selected'),
  body('dataTypes.*').isIn(['profile', 'orders', 'addresses', 'wishlist']).withMessage('Invalid data type'),
  body('format').isIn(['json', 'csv']).withMessage('Invalid export format')
];

module.exports = {
  validateAccountManagement,
  validatePasswordChange,
  validate2FAEnable,
  validateAccountDeletionRequest,
  validateDeletionConfirmation,
  validateDataExportRequest
};
