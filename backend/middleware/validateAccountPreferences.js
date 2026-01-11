const { body, validationResult } = require('express-validator');

/**
 * Validation middleware for account preferences
 */
const validateAccountPreferences = (req, res, next) => {
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
 * Validate notification preferences update
 */
const validateNotificationPreferences = [
  body('email').optional().isBoolean().withMessage('Email notification must be a boolean'),
  body('sms').optional().isBoolean().withMessage('SMS notification must be a boolean'),
  body('whatsapp').optional().isBoolean().withMessage('WhatsApp notification must be a boolean'),
  body('marketing').optional().isBoolean().withMessage('Marketing notification must be a boolean'),
  body('newsletter').optional().isBoolean().withMessage('Newsletter subscription must be a boolean'),
  body('frequency').optional().isIn(['immediate', 'daily', 'weekly', 'monthly']).withMessage('Invalid notification frequency')
];

/**
 * Validate communication preferences update
 */
const validateCommunicationPreferences = [
  body('email').optional().isBoolean().withMessage('Email notification must be a boolean'),
  body('sms').optional().isBoolean().withMessage('SMS notification must be a boolean'),
  body('whatsapp').optional().isBoolean().withMessage('WhatsApp notification must be a boolean'),
  body('marketing').optional().isBoolean().withMessage('Marketing notification must be a boolean'),
  body('newsletter').optional().isBoolean().withMessage('Newsletter subscription must be a boolean'),
  body('frequency').optional().isIn(['immediate', 'daily', 'weekly', 'monthly']).withMessage('Invalid notification frequency')
];

/**
 * Validate privacy settings update
 */
const validatePrivacySettings = [
  body('twoFactorEnabled').optional().isBoolean().withMessage('2FA enabled must be a boolean'),
  body('dataSharingEnabled').optional().isBoolean().withMessage('Data sharing enabled must be a boolean'),
  body('profileVisibility').optional().isIn(['public', 'private', 'friends_only']).withMessage('Invalid profile visibility')
];

module.exports = {
  validateAccountPreferences,
  validateNotificationPreferences,
  validateCommunicationPreferences,
  validatePrivacySettings
};
