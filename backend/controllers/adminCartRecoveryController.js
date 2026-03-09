/**
 * Admin Cart Recovery Controller
 * Handles cart recovery operations for the admin panel
 * 
 * Endpoints:
 * - POST /api/v1/admin/carts/:id/recover - Recover a single abandoned cart
 * - POST /api/v1/admin/carts/:id/generate-share-link - Generate shareable link
 * - POST /api/v1/admin/carts/bulk/recover - Bulk recover carts
 * - GET /api/v1/admin/carts/recovery/stats - Get recovery statistics
 * - GET /api/v1/admin/carts/:id/recovery-history - Get recovery history
 */

const { PrismaClient } = require('@prisma/client');
const { loggerService } = require('../services/logger');
const { cartRecoveryService } = require('../services/cartRecoveryService');
const cartAnalyticsService = require('../services/cartAnalyticsService');

// Create Prisma client instance at module level
const prisma = new PrismaClient();

class AdminCartRecoveryController {
  constructor() {
    this.prisma = prisma;
    this.recoveryService = cartRecoveryService;
  }

  /**
   * Recover an abandoned cart to active state
   * POST /api/v1/admin/carts/:id/recover
   * Body: { adminId, notifyUser, emailTemplate, notes }
   */
  async recoverCart(req, res) {
    try {
      const { id: cartId } = req.params;
      const { adminId, notifyUser = false, emailTemplate = 'cart_recovery', notes } = req.body;

      // Validate admin ID from authentication
      const requestingAdminId = adminId || req.user?.id;
      
      if (!requestingAdminId) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required',
          message: 'Admin authentication is required',
          messageBn: 'অ্যাডমিন প্রমাণীকরণ প্রয়োজন'
        });
      }

      // Validate cart ID
      if (!cartId) {
        return res.status(400).json({
          success: false,
          error: 'Cart ID required',
          message: 'Cart ID is required',
          messageBn: 'কার্ট আইডি প্রয়োজন'
        });
      }

      // Recover the cart
      const result = await this.recoveryService.recoverCart(cartId, requestingAdminId, {
        notifyUser,
        emailTemplate,
        notes
      });

      res.json({
        success: true,
        message: 'Cart recovered successfully',
        messageBn: 'কার্ট সফলভাবে পুনরুদ্ধার করা হয়েছে',
        data: result
      });
    } catch (error) {
      loggerService.error('Error in recoverCart controller', {
        cartId: req.params.id,
        error: error.message,
        stack: error.stack
      });

      // Handle specific errors
      if (error.message.includes('not found')) {
        return res.status(404).json({
          success: false,
          error: 'Cart not found',
          message: error.message,
          messageBn: 'কার্ট পাওয়া যায়নি'
        });
      }

      if (error.message.includes('Cannot recover')) {
        return res.status(400).json({
          success: false,
          error: 'Invalid cart status',
          message: error.message,
          messageBn: 'কার্ট স্ট্যাটাস বৈধ নয়'
        });
      }

      if (error.message.includes('exceeded maximum')) {
        return res.status(400).json({
          success: false,
          error: 'Maximum recovery attempts exceeded',
          message: error.message,
          messageBn: 'সর্বোচ্চ পুনরুদ্ধার প্রচেষ্টা অতিক্রম করা হয়েছে'
        });
      }

      res.status(500).json({
        success: false,
        error: 'Failed to recover cart',
        message: error.message || 'Failed to recover cart',
        messageBn: 'কার্ট পুনরুদ্ধার করতে ব্যর্থ হয়েছে',
        ...(process.env.NODE_ENV === 'development' && {
          details: {
            stack: error.stack
          }
        })
      });
    }
  }

  /**
   * Generate a shareable link for a cart
   * POST /api/v1/admin/carts/:id/generate-share-link
   * Body: { expiresInDays, sendEmail, recipientEmail, customMessage }
   */
  async generateShareLink(req, res) {
    try {
      const { id: cartId } = req.params;
      const { expiresInDays = 7, sendEmail = false, recipientEmail, customMessage } = req.body;

      // Validate cart ID
      if (!cartId) {
        return res.status(400).json({
          success: false,
          error: 'Cart ID required',
          message: 'Cart ID is required',
          messageBn: 'কার্ট আইডি প্রয়োজন'
        });
      }

      // Validate email if sending
      if (sendEmail && !recipientEmail) {
        return res.status(400).json({
          success: false,
          error: 'Recipient email required',
          message: 'Recipient email is required when sendEmail is true',
          messageBn: 'ইমেইল পাঠানো হলে প্রাপকের ইমেইল প্রয়োজন'
        });
      }

      // Generate share link
      const result = await this.recoveryService.shareCart(cartId, {
        expiresInDays,
        sendEmail,
        recipientEmail,
        customMessage
      });

      res.json({
        success: true,
        message: 'Share link generated successfully',
        messageBn: 'শেয়ার লিংক সফলভাবে তৈরি করা হয়েছে',
        data: {
          shareUrl: result.shareUrl,
          expiresAt: result.expiresAt,
          emailSent: result.emailSent
        }
      });
    } catch (error) {
      loggerService.error('Error in generateShareLink controller', {
        cartId: req.params.id,
        error: error.message,
        stack: error.stack
      });

      if (error.message.includes('not found')) {
        return res.status(404).json({
          success: false,
          error: 'Cart not found',
          message: error.message,
          messageBn: 'কার্ট পাওয়া যায়নি'
        });
      }

      res.status(500).json({
        success: false,
        error: 'Failed to generate share link',
        message: error.message || 'Failed to generate share link',
        messageBn: 'শেয়ার লিংক তৈরি করতে ব্যর্থ হয়েছে',
        ...(process.env.NODE_ENV === 'development' && {
          details: {
            stack: error.stack
          }
        })
      });
    }
  }

  /**
   * Generate recovery token for a cart
   * POST /api/v1/admin/carts/:id/generate-recovery-token
   * Body: { expiresInDays }
   */
  async generateRecoveryToken(req, res) {
    try {
      const { id: cartId } = req.params;
      const { expiresInDays = 7 } = req.body;

      // Validate cart ID
      if (!cartId) {
        return res.status(400).json({
          success: false,
          error: 'Cart ID required',
          message: 'Cart ID is required',
          messageBn: 'কার্ট আইডি প্রয়োজন'
        });
      }

      // Generate recovery token
      const result = await this.recoveryService.generateRecoveryToken(cartId);

      res.json({
        success: true,
        message: 'Recovery token generated successfully',
        messageBn: 'পুনরুদ্ধার টোকেন সফলভাবে তৈরি করা হয়েছে',
        data: {
          token: result.token,
          expiresAt: result.expiresAt,
          shareUrl: result.shareUrl
        }
      });
    } catch (error) {
      loggerService.error('Error in generateRecoveryToken controller', {
        cartId: req.params.id,
        error: error.message,
        stack: error.stack
      });

      if (error.message.includes('not found')) {
        return res.status(404).json({
          success: false,
          error: 'Cart not found',
          message: error.message,
          messageBn: 'কার্ট পাওয়া যায়নি'
        });
      }

      res.status(500).json({
        success: false,
        error: 'Failed to generate recovery token',
        message: error.message || 'Failed to generate recovery token',
        messageBn: 'পুনরুদ্ধার টোকেন তৈরি করতে ব্যর্থ হয়েছে',
        ...(process.env.NODE_ENV === 'development' && {
          details: {
            stack: error.stack
          }
        })
      });
    }
  }

  /**
   * Validate a recovery token
   * POST /api/v1/admin/carts/recovery/validate
   * Body: { token }
   */
  async validateRecoveryToken(req, res) {
    try {
      const { token } = req.body;

      if (!token) {
        return res.status(400).json({
          success: false,
          error: 'Token required',
          message: 'Recovery token is required',
          messageBn: 'পুনরুদ্ধার টোকেন প্রয়োজন'
        });
      }

      const result = await this.recoveryService.validateRecoveryToken(token);

      if (!result.valid) {
        return res.status(400).json({
          success: false,
          error: 'Invalid token',
          message: result.reason,
          messageBn: 'টোকেন বৈধ নয়'
        });
      }

      res.json({
        success: true,
        message: 'Token is valid',
        messageBn: 'টোকেন বৈধ',
        data: {
          valid: true,
          cartId: result.cart?.id,
          status: result.cart?.status,
          alreadyActive: result.alreadyActive || false
        }
      });
    } catch (error) {
      loggerService.error('Error in validateRecoveryToken controller', {
        error: error.message,
        stack: error.stack
      });

      res.status(500).json({
        success: false,
        error: 'Failed to validate recovery token',
        message: error.message || 'Failed to validate recovery token',
        messageBn: 'পুনরুদ্ধার টোকেন যাচাই করতে ব্যর্থ হয়েছে',
        ...(process.env.NODE_ENV === 'development' && {
          details: {
            stack: error.stack
          }
        })
      });
    }
  }

  /**
   * Bulk recover multiple carts
   * POST /api/v1/admin/carts/bulk/recover
   * Body: { cartIds, adminId, notifyUsers, notes }
   */
  async bulkRecoverCarts(req, res) {
    try {
      const { cartIds, adminId, notifyUsers = false, notes } = req.body;
      const requestingAdminId = adminId || req.user?.id;

      if (!requestingAdminId) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required',
          message: 'Admin authentication is required',
          messageBn: 'অ্যাডমিন প্রমাণীকরণ প্রয়োজন'
        });
      }

      if (!cartIds || !Array.isArray(cartIds) || cartIds.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'Invalid cart IDs',
          message: 'Cart IDs array is required',
          messageBn: 'কার্ট আইডি অ্যারে প্রয়োজন'
        });
      }

      if (cartIds.length > 100) {
        return res.status(400).json({
          success: false,
          error: 'Too many carts',
          message: 'Cannot recover more than 100 carts at once',
          messageBn: 'একবারে ১০০টির বেশি কার্ট পুনরুদ্ধার করা যাবে না'
        });
      }

      // Perform bulk recovery
      const result = await this.recoveryService.bulkRecoverCarts(cartIds, requestingAdminId, {
        notifyUsers,
        notes
      });

      res.json({
        success: true,
        message: `Bulk recovery completed: ${result.summary.recovered} recovered, ${result.summary.failed} failed`,
        messageBn: `বাল্ক পুনরুদ্ধার সম্পন্ন: ${result.summary.recovered}টি পুনরুদ্ধার, ${result.summary.failed}টি ব্যর্থ`,
        data: result
      });
    } catch (error) {
      loggerService.error('Error in bulkRecoverCarts controller', {
        cartIds: req.body.cartIds,
        error: error.message,
        stack: error.stack
      });

      if (error.message.includes('No valid')) {
        return res.status(400).json({
          success: false,
          error: 'No valid carts',
          message: error.message,
          messageBn: 'কোনো বৈধ কার্ট নেই'
        });
      }

      res.status(500).json({
        success: false,
        error: 'Failed to bulk recover carts',
        message: error.message || 'Failed to bulk recover carts',
        messageBn: 'কার্ট বাল্ক পুনরুদ্ধার করতে ব্যর্থ হয়েছে',
        ...(process.env.NODE_ENV === 'development' && {
          details: {
            stack: error.stack
          }
        })
      });
    }
  }

  /**
   * Get recovery statistics
   * GET /api/v1/admin/carts/recovery/stats
   * Query: { startDate, endDate }
   */
  async getRecoveryStats(req, res) {
    try {
      const { startDate, endDate, days } = req.query;
      
      const daysNum = days ? parseInt(days) : 30;

      // Get comprehensive recovery statistics using analytics service
      const [summary, dailyStats, templateStats, discountStats, hourlyStats] = await Promise.all([
        cartAnalyticsService.getRecoveryStatistics(daysNum),
        cartAnalyticsService.getDailyRecoveryStats(daysNum),
        cartAnalyticsService.getTemplateStats(daysNum),
        cartAnalyticsService.getDiscountStats(daysNum),
        cartAnalyticsService.getHourlyStats(daysNum)
      ]);

      res.json({
        success: true,
        message: 'Recovery statistics retrieved successfully',
        messageBn: 'পুনরুদ্ধার পরিসংখ্যান সফলভাবে পুনরুদ্ধার করা হয়েছে',
        data: {
          ...summary,
          dailyStats,
          templateStats,
          discountStats,
          hourlyStats
        }
      });
    } catch (error) {
      loggerService.error('Error in getRecoveryStats controller', {
        error: error.message,
        stack: error.stack
      });

      res.status(500).json({
        success: false,
        error: 'Failed to get recovery statistics',
        message: error.message || 'Failed to get recovery statistics',
        messageBn: 'পুনরুদ্ধার পরিসংখ্যান পেতে ব্যর্থ হয়েছে',
        ...(process.env.NODE_ENV === 'development' && {
          details: {
            stack: error.stack
          }
        })
      });
    }
  }

  /**
   * Get recovery history for a specific cart
   * GET /api/v1/admin/carts/:id/recovery-history
   */
  async getRecoveryHistory(req, res) {
    try {
      const { id: cartId } = req.params;

      if (!cartId) {
        return res.status(400).json({
          success: false,
          error: 'Cart ID required',
          message: 'Cart ID is required',
          messageBn: 'কার্ট আইডি প্রয়োজন'
        });
      }

      const history = await this.recoveryService.getRecoveryHistory(cartId);

      res.json({
        success: true,
        message: 'Recovery history retrieved successfully',
        messageBn: 'পুনরুদ্ধার ইতিহাস সফলভাবে পুনরুদ্ধার করা হয়েছে',
        data: history
      });
    } catch (error) {
      loggerService.error('Error in getRecoveryHistory controller', {
        cartId: req.params.id,
        error: error.message,
        stack: error.stack
      });

      res.status(500).json({
        success: false,
        error: 'Failed to get recovery history',
        message: error.message || 'Failed to get recovery history',
        messageBn: 'পুনরুদ্ধার ইতিহাস পেতে ব্যর্থ হয়েছে',
        ...(process.env.NODE_ENV === 'development' && {
          details: {
            stack: error.stack
          }
        })
      });
    }
  }

  /**
   * Invalidate a recovery token
   * POST /api/v1/admin/carts/:id/invalidate-recovery-token
   */
  async invalidateRecoveryToken(req, res) {
    try {
      const { id: cartId } = req.params;

      if (!cartId) {
        return res.status(400).json({
          success: false,
          error: 'Cart ID required',
          message: 'Cart ID is required',
          messageBn: 'কার্ট আইডি প্রয়োজন'
        });
      }

      const result = await this.recoveryService.invalidateRecoveryToken(cartId);

      res.json({
        success: true,
        message: 'Recovery token invalidated successfully',
        messageBn: 'পুনরুদ্ধার টোকেন সফলভাবে বাতিল করা হয়েছে',
        data: result
      });
    } catch (error) {
      loggerService.error('Error in invalidateRecoveryToken controller', {
        cartId: req.params.id,
        error: error.message,
        stack: error.stack
      });

      res.status(500).json({
        success: false,
        error: 'Failed to invalidate recovery token',
        message: error.message || 'Failed to invalidate recovery token',
        messageBn: 'পুনরুদ্ধার টোকেন বাতিল করতে ব্যর্থ হয়েছে',
        ...(process.env.NODE_ENV === 'development' && {
          details: {
            stack: error.stack
          }
        })
      });
    }
  }

  /**
   * Send recovery notification to cart owner
   * POST /api/v1/admin/carts/:id/notify-recovery
   * Body: { emailTemplate }
   */
  async sendRecoveryNotification(req, res) {
    try {
      const { id: cartId } = req.params;
      const { emailTemplate = 'cart_recovery' } = req.body;

      if (!cartId) {
        return res.status(400).json({
          success: false,
          error: 'Cart ID required',
          message: 'Cart ID is required',
          messageBn: 'কার্ট আইডি প্রয়োজন'
        });
      }

      // Get cart with user info
      const cart = await this.prisma.carts.findUnique({
        where: { id: cartId },
        include: {
          user: {
            select: {
              email: true,
              firstName: true
            }
          }
        }
      });

      if (!cart) {
        return res.status(404).json({
          success: false,
          error: 'Cart not found',
          message: 'Cart not found',
          messageBn: 'কার্ট পাওয়া যায়নি'
        });
      }

      if (!cart.user?.email) {
        return res.status(400).json({
          success: false,
          error: 'No email available',
          message: 'Cart owner has no email address',
          messageBn: 'কার্ট মালিকের কোনো ইমেইল ঠিকানা নেই'
        });
      }

      // Generate recovery token and send notification
      await this.recoveryService.generateRecoveryToken(cartId);
      const result = await this.recoveryService.sendRecoveryNotification(
        cart.user.email,
        cart.user.firstName,
        cartId,
        emailTemplate
      );

      res.json({
        success: true,
        message: 'Recovery notification sent successfully',
        messageBn: 'পুনরুদ্ধার বিজ্ঞপ্তি সফলভাবে পাঠানো হয়েছে',
        data: {
          email: cart.user.email,
          messageId: result.messageId
        }
      });
    } catch (error) {
      loggerService.error('Error in sendRecoveryNotification controller', {
        cartId: req.params.id,
        error: error.message,
        stack: error.stack
      });

      res.status(500).json({
        success: false,
        error: 'Failed to send recovery notification',
        message: error.message || 'Failed to send recovery notification',
        messageBn: 'পুনরুদ্ধার বিজ্ঞপ্তি পাঠাতে ব্যর্থ হয়েছে',
        ...(process.env.NODE_ENV === 'development' && {
          details: {
            stack: error.stack
          }
        })
      });
    }
  }
}

// Singleton instance
const adminCartRecoveryController = new AdminCartRecoveryController();

module.exports = {
  AdminCartRecoveryController,
  adminCartRecoveryController
};
