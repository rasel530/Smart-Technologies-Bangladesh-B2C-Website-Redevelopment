const express = require('express');
const { body, validationResult } = require('express-validator');
const { PrismaClient } = require('@prisma/client');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// Valid profile visibility values
const VALID_PROFILE_VISIBILITY = ['PUBLIC', 'PRIVATE'];

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

// Get user's privacy settings
router.get('/privacy', authMiddleware.authenticate(), async (req, res) => {
  try {
    const userId = req.user.id;

    // Try to find existing privacy settings
    let privacySettings = await prisma.userPrivacySettings.findUnique({
      where: { userId }
    });

    // If no privacy settings exist, create default settings
    if (!privacySettings) {
      privacySettings = await prisma.userPrivacySettings.create({
        data: {
          userId,
          profileVisibility: 'PRIVATE',
          showEmail: false,
          showPhone: false,
          showAddress: false,
          allowSearchByEmail: false,
          allowSearchByPhone: false,
          twoFactorEnabled: false
        }
      });
    }

    res.json({
      success: true,
      data: { settings: privacySettings }
    });

  } catch (error) {
    console.error('Get privacy settings error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch privacy settings',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Update user's privacy settings
router.put('/privacy', [
  body('profileVisibility').optional().isIn(VALID_PROFILE_VISIBILITY).withMessage('Invalid profile visibility value'),
  body('showEmail').optional().isBoolean(),
  body('showPhone').optional().isBoolean(),
  body('showAddress').optional().isBoolean(),
  body('allowSearchByEmail').optional().isBoolean(),
  body('allowSearchByPhone').optional().isBoolean(),
  body('twoFactorEnabled').optional().isBoolean()
], handleValidationErrors, authMiddleware.authenticate(), async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      profileVisibility,
      showEmail,
      showPhone,
      showAddress,
      allowSearchByEmail,
      allowSearchByPhone,
      twoFactorEnabled
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

    // Check if privacy settings exist
    const existingSettings = await prisma.userPrivacySettings.findUnique({
      where: { userId }
    });

    // Build update data object with only provided fields
    const updateData = {};
    if (profileVisibility !== undefined) updateData.profileVisibility = profileVisibility;
    if (showEmail !== undefined) updateData.showEmail = showEmail;
    if (showPhone !== undefined) updateData.showPhone = showPhone;
    if (showAddress !== undefined) updateData.showAddress = showAddress;
    if (allowSearchByEmail !== undefined) updateData.allowSearchByEmail = allowSearchByEmail;
    if (allowSearchByPhone !== undefined) updateData.allowSearchByPhone = allowSearchByPhone;
    if (twoFactorEnabled !== undefined) updateData.twoFactorEnabled = twoFactorEnabled;

    let privacySettings;

    if (existingSettings) {
      // Update existing privacy settings
      privacySettings = await prisma.userPrivacySettings.update({
        where: { userId },
        data: updateData
      });
    } else {
      // Create new privacy settings with provided values and defaults for missing ones
      privacySettings = await prisma.userPrivacySettings.create({
        data: {
          userId,
          profileVisibility: profileVisibility !== undefined ? profileVisibility : 'PRIVATE',
          showEmail: showEmail !== undefined ? showEmail : false,
          showPhone: showPhone !== undefined ? showPhone : false,
          showAddress: showAddress !== undefined ? showAddress : false,
          allowSearchByEmail: allowSearchByEmail !== undefined ? allowSearchByEmail : false,
          allowSearchByPhone: allowSearchByPhone !== undefined ? allowSearchByPhone : false,
          twoFactorEnabled: twoFactorEnabled !== undefined ? twoFactorEnabled : false
        }
      });
    }

    res.json({
      success: true,
      data: {
        settings: privacySettings
      }
    });

  } catch (error) {
    console.error('Update privacy settings error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update privacy settings',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

module.exports = router;
