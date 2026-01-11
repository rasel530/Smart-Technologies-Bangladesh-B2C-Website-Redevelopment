const express = require('express');
const { body, param, validationResult } = require('express-validator');
const { PrismaClient } = require('@prisma/client');
const { authMiddleware } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const crypto = require('crypto');

const router = express.Router();
const prisma = new PrismaClient();

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

// Configure multer for profile picture uploads
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads/profile-pictures');
    try {
      await fs.mkdir(uploadDir, { recursive: true });
      cb(null, uploadDir);
    } catch (error) {
      cb(error, uploadDir);
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `profile-${req.user.id}-${uniqueSuffix}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (extname && mimetype) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files (jpeg, jpg, png, gif, webp) are allowed'));
    }
  }
});

// Get user profile (authenticated user)
router.get('/me', authMiddleware.authenticate(), async (req, res) => {
  try {
    const userId = req.user.id;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        dateOfBirth: true,
        gender: true,
        role: true,
        status: true,
        image: true,
        createdAt: true,
        updatedAt: true,
        lastLoginAt: true,
        emailVerified: true,
        phoneVerified: true,
        addresses: {
          orderBy: { isDefault: 'desc' }
        },
        _count: {
          select: {
            orders: true,
            reviews: true
          }
        }
      }
    });

    if (!user) {
      return res.status(404).json({
        error: 'User not found'
      });
    }

    res.json({
      success: true,
      data: { user }
    });

  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch profile',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Update user profile
router.put('/me', [
  body('firstName').optional().notEmpty().trim().isLength({ min: 2, max: 50 }),
  body('lastName').optional().notEmpty().trim().isLength({ min: 2, max: 50 }),
  body('phone').optional().matches(/^(\+880|01)(1[3-9]\d{8}|\d{9})$/),
  body('dateOfBirth').optional().isISO8601().toDate(),
  body('gender').optional().isIn(['MALE', 'FEMALE', 'OTHER'])
], handleValidationErrors, authMiddleware.authenticate(), async (req, res) => {
  try {
    const userId = req.user.id;
    const { firstName, lastName, phone, dateOfBirth, gender } = req.body;

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!existingUser) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Check if phone is already used by another user
    if (phone && phone !== existingUser.phone) {
      const phoneUser = await prisma.user.findFirst({
        where: { phone, NOT: { id: userId } }
      });

      if (phoneUser) {
        return res.status(409).json({
          success: false,
          error: 'Phone number already exists'
        });
      }
    }

    const updateData = {};
    if (firstName !== undefined) updateData.firstName = firstName;
    if (lastName !== undefined) updateData.lastName = lastName;
    if (phone !== undefined) {
      updateData.phone = phone;
      updateData.phoneVerified = null; // Require re-verification (null = not verified)
    }
    if (dateOfBirth !== undefined) updateData.dateOfBirth = dateOfBirth;
    if (gender !== undefined) updateData.gender = gender;

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        dateOfBirth: true,
        gender: true,
        phoneVerified: true,
        updatedAt: true
      }
    });

    res.json({
      success: true,
      data: {
        message: 'Profile updated successfully',
        user: updatedUser
      }
    });
    
    // Update session createdAt to prevent stale session detection
    if (req.sessionId) {
      try {
        const { sessionService } = require('../services/sessionService');
        await sessionService.refreshSession(req.sessionId, req, {
          maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        });
        console.log('Session timestamp refreshed after profile update');
      } catch (error) {
        console.error('Failed to refresh session timestamp:', error);
      }
    }

  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update profile',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Upload profile picture
router.post('/me/picture', authMiddleware.authenticate(), upload.single('picture'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No file uploaded'
      });
    }

    const userId = req.user.id;
    const pictureUrl = `/uploads/profile-pictures/${req.file.filename}`;

    // Delete old profile picture if exists
    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { image: true }
    });

    if (existingUser && existingUser.image) {
      const oldPicturePath = path.join(__dirname, '..', existingUser.image);
      try {
        await fs.unlink(oldPicturePath);
      } catch (error) {
        console.error('Error deleting old profile picture:', error);
      }
    }

    // Update user with new picture
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { image: pictureUrl },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        dateOfBirth: true,
        gender: true,
        role: true,
        status: true,
        image: true,
        createdAt: true,
        updatedAt: true,
        lastLoginAt: true,
        emailVerified: true,
        phoneVerified: true,
        addresses: {
          orderBy: { isDefault: 'desc' }
        },
        _count: {
          select: {
            orders: true,
            reviews: true
          }
        }
      }
    });

    res.json({
      success: true,
      data: {
        message: 'Profile picture uploaded successfully',
        user: updatedUser
      }
    });

  } catch (error) {
    console.error('Upload profile picture error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to upload profile picture',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Delete profile picture
router.delete('/me/picture', authMiddleware.authenticate(), async (req, res) => {
  try {
    const userId = req.user.id;

    // Get current user
    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { image: true }
    });

    if (!existingUser) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Delete file if exists
    if (existingUser.image) {
      const picturePath = path.join(__dirname, '..', existingUser.image);
      try {
        await fs.unlink(picturePath);
      } catch (error) {
        console.error('Error deleting profile picture:', error);
      }
    }

    // Update user
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { image: null },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        dateOfBirth: true,
        gender: true,
        role: true,
        status: true,
        image: true,
        createdAt: true,
        updatedAt: true,
        lastLoginAt: true,
        emailVerified: true,
        phoneVerified: true,
        addresses: {
          orderBy: { isDefault: 'desc' }
        },
        _count: {
          select: {
            orders: true,
            reviews: true
          }
        }
      }
    });

    res.json({
      success: true,
      data: {
        message: 'Profile picture deleted successfully',
        user: updatedUser
      }
    });

  } catch (error) {
    console.error('Delete profile picture error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete profile picture',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Request email change
router.post('/me/email/change', [
  body('newEmail').isEmail().normalizeEmail()
], handleValidationErrors, authMiddleware.authenticate(), async (req, res) => {
  try {
    const userId = req.user.id;
    const { newEmail } = req.body;

    // Check if email is already used
    const existingUser = await prisma.user.findFirst({
      where: { email: newEmail }
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        error: 'Email already exists'
      });
    }

    // Generate verification token
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Store email change request (using emailVerificationToken table)
    await prisma.emailVerificationToken.create({
      data: {
        userId,
        token,
        expiresAt
      }
    });

    // In production, send email with verification link
    // For now, return the token for testing
    res.json({
      success: true,
      data: {
        message: 'Email change request created',
        requiresVerification: true,
        verificationToken: process.env.NODE_ENV === 'development' ? token : undefined
      }
    });

  } catch (error) {
    console.error('Request email change error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to request email change',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Confirm email change
router.post('/me/email/confirm', [
  body('newEmail').isEmail().normalizeEmail(),
  body('token').notEmpty()
], handleValidationErrors, authMiddleware.authenticate(), async (req, res) => {
  try {
    const userId = req.user.id;
    const { newEmail, token } = req.body;

    // Verify token
    const verificationToken = await prisma.emailVerificationToken.findFirst({
      where: {
        userId,
        token,
        expiresAt: {
          gt: new Date()
        }
      }
    });

    if (!verificationToken) {
      return res.status(400).json({
        success: false,
        error: 'Invalid or expired verification token'
      });
    }

    // Update user email
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        email: newEmail,
        emailVerified: false
      },
      select: {
        id: true,
        email: true,
        emailVerified: true,
        updatedAt: true
      }
    });

    // Delete used token
    await prisma.emailVerificationToken.delete({
      where: { id: verificationToken.id }
    });

    res.json({
      success: true,
      data: {
        message: 'Email changed successfully',
        user: updatedUser
      }
    });

  } catch (error) {
    console.error('Confirm email change error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to confirm email change',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Request phone change
router.post('/me/phone/change', [
  body('newPhone').matches(/^(\+880|01)(1[3-9]\d{8}|\d{9})$/)
], handleValidationErrors, authMiddleware.authenticate(), async (req, res) => {
  try {
    const userId = req.user.id;
    const { newPhone } = req.body;

    // Check if phone is already used
    const existingUser = await prisma.user.findFirst({
      where: { phone: newPhone }
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        error: 'Phone number already exists'
      });
    }

    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Store OTP
    await prisma.phoneOTP.create({
      data: {
        userId,
        phone: newPhone,
        otp,
        expiresAt
      }
    });

    // In production, send OTP via SMS
    // For now, return the OTP for testing
    res.json({
      success: true,
      data: {
        message: 'OTP sent to new phone number',
        requiresVerification: true,
        otp: process.env.NODE_ENV === 'development' ? otp : undefined
      }
    });

  } catch (error) {
    console.error('Request phone change error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to request phone change',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Confirm phone change
router.post('/me/phone/confirm', [
  body('newPhone').matches(/^(\+880|01)(1[3-9]\d{8}|\d{9})$/),
  body('otp').isLength({ min: 6, max: 6 })
], handleValidationErrors, authMiddleware.authenticate(), async (req, res) => {
  try {
    const userId = req.user.id;
    const { newPhone, otp } = req.body;

    // Verify OTP
    const phoneOTP = await prisma.phoneOTP.findFirst({
      where: {
        userId,
        phone: newPhone,
        otp,
        expiresAt: {
          gt: new Date()
        }
      }
    });

    if (!phoneOTP) {
      return res.status(400).json({
        success: false,
        error: 'Invalid or expired OTP'
      });
    }

    // Update user phone
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        phone: newPhone,
        phoneVerified: new Date() // Set verification timestamp
      },
      select: {
        id: true,
        phone: true,
        phoneVerified: true,
        updatedAt: true
      }
    });

    // Mark OTP as verified
    await prisma.phoneOTP.update({
      where: { id: phoneOTP.id },
      data: { verifiedAt: new Date() }
    });

    res.json({
      success: true,
      data: {
        message: 'Phone changed successfully',
        user: updatedUser
      }
    });

  } catch (error) {
    console.error('Confirm phone change error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to confirm phone change',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Get account settings
router.get('/me/settings', authMiddleware.authenticate(), async (req, res) => {
  try {
    const userId = req.user.id;

    // For now, return default settings
    // In production, this would be stored in a user_settings table
    const settings = {
      notifications: {
        email: {
          orderUpdates: true,
          specialOffers: true,
          newsletter: false
        },
        sms: {
          orderUpdates: true,
          specialOffers: false
        }
      },
      privacy: {
        profileVisibility: 'public',
        showOrders: false,
        showReviews: false
      },
      preferences: {
        language: 'en',
        currency: 'BDT'
      }
    };

    res.json({
      success: true,
      data: { settings }
    });

  } catch (error) {
    console.error('Get settings error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch settings',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Update account settings
router.put('/me/settings', [
  body('notifications').optional().isObject(),
  body('privacy').optional().isObject(),
  body('preferences').optional().isObject()
], handleValidationErrors, authMiddleware.authenticate(), async (req, res) => {
  try {
    const userId = req.user.id;
    const { notifications, privacy, preferences } = req.body;

    // In production, this would update a user_settings table
    // For now, just return success
    const settings = {
      notifications: notifications || {},
      privacy: privacy || {},
      preferences: preferences || {}
    };

    res.json({
      success: true,
      data: {
        message: 'Settings updated successfully',
        settings
      }
    });

  } catch (error) {
    console.error('Update settings error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update settings',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Request account deletion
router.post('/me/delete', [
  body('password').notEmpty()
], handleValidationErrors, authMiddleware.authenticate(), async (req, res) => {
  try {
    const userId = req.user.id;
    const { password } = req.body;

    // Verify password
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        _count: {
          select: {
            orders: true
          }
        }
      }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Check if user has orders
    if (user._count.orders > 0) {
      return res.status(400).json({
        success: false,
        error: 'Cannot delete account with existing orders',
        suggestion: 'Contact support for assistance'
      });
    }

    // In production, verify password before deletion
    // For now, just generate deletion token
    const deletionToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    res.json({
      success: true,
      data: {
        message: 'Account deletion requested',
        requiresConfirmation: true,
        deletionToken: process.env.NODE_ENV === 'development' ? deletionToken : undefined,
        expiresAt
      }
    });

  } catch (error) {
    console.error('Request account deletion error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to request account deletion',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Confirm account deletion
router.post('/me/delete/confirm', [
  body('token').notEmpty()
], handleValidationErrors, authMiddleware.authenticate(), async (req, res) => {
  try {
    const userId = req.user.id;
    const { token } = req.body;

    // In production, verify deletion token
    // For now, proceed with deletion
    await prisma.user.delete({
      where: { id: userId }
    });

    res.json({
      success: true,
      data: {
        message: 'Account deleted successfully'
      }
    });

  } catch (error) {
    console.error('Confirm account deletion error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete account',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Change password
router.post('/me/password/change', [
  body('currentPassword').notEmpty(),
  body('newPassword').notEmpty().isLength({ min: 8 }),
  body('confirmPassword').notEmpty()
], handleValidationErrors, authMiddleware.authenticate(), async (req, res) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;
    const userId = req.user.id;
    
    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'New password and confirm password do not match'
      });
    }
    
    const { accountPreferencesService } = require('../services/accountPreferences.service');
    await accountPreferencesService.changePassword(userId, currentPassword, newPassword);
    
    res.json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    console.error('Password change error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to change password'
    });
  }
});

module.exports = router;
