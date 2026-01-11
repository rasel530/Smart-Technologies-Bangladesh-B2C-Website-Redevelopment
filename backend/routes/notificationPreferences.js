const express = require('express');
const { body, validationResult } = require('express-validator');
const { PrismaClient } = require('@prisma/client');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// Valid language codes
const VALID_LANGUAGES = ['en', 'bn'];

// Valid timezones (sample list - can be expanded)
const VALID_TIMEZONES = [
  'UTC',
  'Asia/Dhaka',
  'Asia/Kolkata',
  'America/New_York',
  'America/Los_Angeles',
  'Europe/London',
  'Europe/Paris',
  'Asia/Tokyo',
  'Australia/Sydney'
];

// Valid contact methods
const VALID_CONTACT_METHODS = ['email', 'phone', 'both'];

// Validation middleware
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors.array()
    });
  }
  next();
};

// Get user's notification preferences
router.get('/notifications', authMiddleware.authenticate(), async (req, res) => {
  try {
    const userId = req.user.id;

    // Try to find existing preferences
    let preferences = await prisma.userNotificationPreferences.findUnique({
      where: { userId }
    });

    // If no preferences exist, create default preferences
    if (!preferences) {
      preferences = await prisma.userNotificationPreferences.create({
        data: {
          userId,
          emailNotifications: true,
          smsNotifications: false,
          whatsappNotifications: true,
          marketingCommunications: true,
          newsletterSubscription: true,
          notificationFrequency: 'immediate'
        }
      });
    }

    res.json({
      success: true,
      data: { preferences }
    });

  } catch (error) {
    console.error('Get notification preferences error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch notification preferences',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Update user's notification preferences
router.put('/notifications', [
  body('emailNotifications').optional().isBoolean(),
  body('smsNotifications').optional().isBoolean(),
  body('whatsappNotifications').optional().isBoolean(),
  body('marketingCommunications').optional().isBoolean(),
  body('newsletterSubscription').optional().isBoolean(),
  body('notificationFrequency').optional().isString()
], handleValidationErrors, authMiddleware.authenticate(), async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      emailNotifications,
      smsNotifications,
      whatsappNotifications,
      marketingCommunications,
      newsletterSubscription,
      notificationFrequency
    } = req.body;

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Check if preferences exist
    const existingPreferences = await prisma.userNotificationPreferences.findUnique({
      where: { userId }
    });

    // Build update data object with only provided fields
    const updateData = {};
    if (emailNotifications !== undefined) updateData.emailNotifications = emailNotifications;
    if (smsNotifications !== undefined) updateData.smsNotifications = smsNotifications;
    if (whatsappNotifications !== undefined) updateData.whatsappNotifications = whatsappNotifications;
    if (marketingCommunications !== undefined) updateData.marketingCommunications = marketingCommunications;
    if (newsletterSubscription !== undefined) updateData.newsletterSubscription = newsletterSubscription;
    if (notificationFrequency !== undefined) updateData.notificationFrequency = notificationFrequency;

    let preferences;

    if (existingPreferences) {
      // Update existing preferences
      preferences = await prisma.userNotificationPreferences.update({
        where: { userId },
        data: updateData
      });
    } else {
      // Create new preferences with provided values and defaults for missing ones
      preferences = await prisma.userNotificationPreferences.create({
        data: {
          userId,
          emailNotifications: emailNotifications !== undefined ? emailNotifications : true,
          smsNotifications: smsNotifications !== undefined ? smsNotifications : false,
          whatsappNotifications: whatsappNotifications !== undefined ? whatsappNotifications : true,
          marketingCommunications: marketingCommunications !== undefined ? marketingCommunications : true,
          newsletterSubscription: newsletterSubscription !== undefined ? newsletterSubscription : true,
          notificationFrequency: notificationFrequency !== undefined ? notificationFrequency : 'immediate'
        }
      });
    }

    res.json({
      success: true,
      data: {
        preferences
      }
    });

  } catch (error) {
    console.error('Update notification preferences error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update notification preferences',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// ==================== COMMUNICATION PREFERENCES ====================

// Get user's communication preferences
router.get('/communication', authMiddleware.authenticate(), async (req, res) => {
  try {
    const userId = req.user.id;

    // Try to find existing preferences
    let preferences = await prisma.userCommunicationPreferences.findUnique({
      where: { userId }
    });

    // If no preferences exist, create default preferences
    if (!preferences) {
      preferences = await prisma.userCommunicationPreferences.create({
        data: {
          userId,
          preferredLanguage: 'en',
          preferredTimezone: 'UTC',
          preferredContactMethod: 'email',
          marketingConsent: false,
          dataSharingConsent: false
        }
      });
    }

    res.json({
      success: true,
      data: { preferences }
    });

  } catch (error) {
    console.error('Get communication preferences error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch communication preferences',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Update user's communication preferences
router.put('/communication', [
  body('preferredLanguage').optional().isIn(VALID_LANGUAGES).withMessage('Invalid language code'),
  body('preferredTimezone').optional().isIn(VALID_TIMEZONES).withMessage('Invalid timezone'),
  body('preferredContactMethod').optional().isIn(VALID_CONTACT_METHODS).withMessage('Invalid contact method'),
  body('marketingConsent').optional().isBoolean(),
  body('dataSharingConsent').optional().isBoolean()
], handleValidationErrors, authMiddleware.authenticate(), async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      preferredLanguage,
      preferredTimezone,
      preferredContactMethod,
      marketingConsent,
      dataSharingConsent
    } = req.body;

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Check if preferences exist
    const existingPreferences = await prisma.userCommunicationPreferences.findUnique({
      where: { userId }
    });

    // Build update data object with only provided fields
    const updateData = {};
    if (preferredLanguage !== undefined) updateData.preferredLanguage = preferredLanguage;
    if (preferredTimezone !== undefined) updateData.preferredTimezone = preferredTimezone;
    if (preferredContactMethod !== undefined) updateData.preferredContactMethod = preferredContactMethod;
    if (marketingConsent !== undefined) updateData.marketingConsent = marketingConsent;
    if (dataSharingConsent !== undefined) updateData.dataSharingConsent = dataSharingConsent;

    let preferences;

    if (existingPreferences) {
      // Update existing preferences
      preferences = await prisma.userCommunicationPreferences.update({
        where: { userId },
        data: updateData
      });
    } else {
      // Create new preferences with provided values and defaults for missing ones
      preferences = await prisma.userCommunicationPreferences.create({
        data: {
          userId,
          preferredLanguage: preferredLanguage !== undefined ? preferredLanguage : 'en',
          preferredTimezone: preferredTimezone !== undefined ? preferredTimezone : 'UTC',
          preferredContactMethod: preferredContactMethod !== undefined ? preferredContactMethod : 'email',
          marketingConsent: marketingConsent !== undefined ? marketingConsent : false,
          dataSharingConsent: dataSharingConsent !== undefined ? dataSharingConsent : false
        }
      });
    }

    res.json({
      success: true,
      data: {
        preferences
      }
    });

  } catch (error) {
    console.error('Update communication preferences error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update communication preferences',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

module.exports = router;
