const express = require('express');
const { body, validationResult } = require('express-validator');
const { PrismaClient } = require('@prisma/client');
const { authMiddleware } = require('../middleware/auth');
const bcrypt = require('bcryptjs');

const router = express.Router();
const prisma = new PrismaClient();

// Rate limiting map (in production, use Redis or a proper rate limiting library)
const deletionAttempts = new Map();

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

// Rate limiting middleware
const checkRateLimit = (req, res, next) => {
  const userId = req.user.id;
  const now = Date.now();
  const oneHour = 60 * 60 * 1000; // 1 hour in milliseconds

  // Clean up old entries
  for (const [id, timestamp] of deletionAttempts.entries()) {
    if (now - timestamp > oneHour) {
      deletionAttempts.delete(id);
    }
  }

  // Check if user has attempted deletion recently
  if (deletionAttempts.has(userId)) {
    const lastAttempt = deletionAttempts.get(userId);
    const timeSinceLastAttempt = now - lastAttempt;
    const remainingTime = Math.ceil((oneHour - timeSinceLastAttempt) / 1000 / 60); // minutes

    return res.status(429).json({
      success: false,
      error: 'Too many deletion attempts',
      message: `Please wait ${remainingTime} minutes before trying again`
    });
  }

  next();
};

// Audit logging function
const logDeletionEvent = async (userId, action, details) => {
  try {
    // In production, you might want to store this in a dedicated audit log table
    console.log(`[AUDIT] Account Deletion - User: ${userId}, Action: ${action}, Details: ${JSON.stringify(details)}, Timestamp: ${new Date().toISOString()}`);
  } catch (error) {
    console.error('Failed to log deletion event:', error);
  }
};

// Delete user account
router.delete('/account', [
  body('password').notEmpty().withMessage('Password is required')
], handleValidationErrors, authMiddleware.authenticate(), checkRateLimit, async (req, res) => {
  try {
    const userId = req.user.id;
    const { password } = req.body;

    // Step 1: Validate user is authenticated (already done by authMiddleware)

    // Step 2: Get user details
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        orders: {
          where: {
            status: {
              notIn: ['DELIVERED', 'CANCELLED', 'REFUNDED']
            }
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

    // Check if user has already been deleted
    if (user.deletedAt) {
      return res.status(400).json({
        success: false,
        error: 'Account has already been deleted'
      });
    }

    // Step 3: Verify user has no active orders
    if (user.orders && user.orders.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Cannot delete account with active orders',
        message: 'Please complete or cancel your active orders before deleting your account',
        activeOrders: user.orders.length
      });
    }

    // Step 4: Verify password
    if (!user.password) {
      return res.status(400).json({
        success: false,
        error: 'Password verification failed',
        message: 'This account uses social login and cannot be deleted through this method'
      });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        error: 'Invalid password',
        message: 'The password you entered is incorrect'
      });
    }

    // Step 5: Perform soft delete (set deleted_at timestamp)
    const deletedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        deletedAt: new Date(),
        email: `${user.email}_deleted_${Date.now()}`, // Make email unique to allow reuse
        phone: user.phone ? `${user.phone}_deleted_${Date.now()}` : null, // Make phone unique to allow reuse
        status: 'INACTIVE'
      }
    });

    // Step 6: Clean up related data
    // Delete user sessions
    await prisma.userSession.deleteMany({
      where: { userId }
    });

    // Delete notification preferences
    await prisma.userNotificationPreferences.deleteMany({
      where: { userId }
    });

    // Delete communication preferences
    await prisma.userCommunicationPreferences.deleteMany({
      where: { userId }
    });

    // Delete privacy settings
    await prisma.userPrivacySettings.deleteMany({
      where: { userId }
    });

    // Delete addresses
    await prisma.address.deleteMany({
      where: { userId }
    });

    // Delete cart
    await prisma.cart.deleteMany({
      where: { userId }
    });

    // Delete wishlist
    await prisma.wishlist.deleteMany({
      where: { userId }
    });

    // Delete email verification tokens
    await prisma.emailVerificationToken.deleteMany({
      where: { userId }
    });

    // Delete phone OTPs
    await prisma.phoneOTP.deleteMany({
      where: { userId }
    });

    // Delete password history
    await prisma.passwordHistory.deleteMany({
      where: { userId }
    });

    // Delete social accounts
    await prisma.userSocialAccount.deleteMany({
      where: { userId }
    });

    // Note: We keep orders and reviews for historical/audit purposes
    // They will be associated with the soft-deleted user

    // Step 7: Log deletion event for audit trail
    await logDeletionEvent(userId, 'ACCOUNT_DELETED', {
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      deletedAt: deletedUser.deletedAt
    });

    // Record rate limit attempt
    deletionAttempts.set(userId, Date.now());

    res.json({
      success: true,
      message: 'Account deleted successfully',
      data: {
        deletedAt: deletedUser.deletedAt
      }
    });

  } catch (error) {
    console.error('Delete account error:', error);
    
    // Log the error for audit purposes
    if (req.user && req.user.id) {
      await logDeletionEvent(req.user.id, 'ACCOUNT_DELETION_FAILED', {
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }

    res.status(500).json({
      success: false,
      error: 'Failed to delete account',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Get account deletion status
router.get('/account/deletion-status', authMiddleware.authenticate(), async (req, res) => {
  try {
    const userId = req.user.id;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        deletedAt: true,
        orders: {
          where: {
            status: {
              notIn: ['DELIVERED', 'CANCELLED', 'REFUNDED']
            }
          },
          select: {
            id: true,
            orderNumber: true,
            status: true
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

    res.json({
      success: true,
      data: {
        isDeleted: !!user.deletedAt,
        deletedAt: user.deletedAt,
        hasActiveOrders: user.orders.length > 0,
        activeOrdersCount: user.orders.length,
        activeOrders: user.orders
      }
    });

  } catch (error) {
    console.error('Get deletion status error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get deletion status',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

module.exports = router;
