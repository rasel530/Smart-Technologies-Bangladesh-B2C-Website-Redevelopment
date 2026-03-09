const { cartWishlistAnalyticsService } = require('../../services/cartWishlist/cartWishlistAnalytics.service');
const { cartWishlistSyncService } = require('../../services/cartWishlist/cartWishlistSync.service');
const { loggerService } = require('../../services/logger');

/**
 * Admin Cart-Wishlist Controller
 * 
 * Handles HTTP requests for admin cart-wishlist operations:
 * - System-wide sync status
 * - Conflict management
 * - System analytics
 * - Move history (admin view)
 */
class AdminCartWishlistController {
  /**
   * Verify admin role middleware
   */
  verifyAdmin(req, res, next) {
    const userRole = req.user?.role;
    
    if (!userRole || (userRole !== 'admin' && userRole !== 'super_admin')) {
      return res.status(403).json({
        success: false,
        error: {
          message: 'Admin access required',
          code: 403,
          messageBn: 'অ্যাডমিন অ্যাক্সেস প্রয়োজন'
        }
      });
    }
    
    next();
  }

  /**
   * Get system-wide sync status (admin only)
   * GET /api/v1/admin/cart-wishlist/sync-status
   */
  async getSystemSyncStatus(req, res) {
    try {
      const result = await cartWishlistAnalyticsService.getSystemSyncStatus();

      return res.status(200).json(result);
    } catch (error) {
      loggerService.error('Error in getSystemSyncStatus controller', {
        error: error.message,
        stack: error.stack
      });

      return res.status(500).json({
        success: false,
        error: {
          message: error.message,
          code: 500,
          messageBn: 'সিস্টেম সিঙ্ক স্ট্যাটাস পেতে ব্যর্থ হয়েছে'
        }
      });
    }
  }

  /**
   * Get all conflicts (admin only)
   * GET /api/v1/admin/cart-wishlist/conflicts
   */
  async getAllConflicts(req, res) {
    try {
      const result = await cartWishlistAnalyticsService.getAllConflicts();

      return res.status(200).json(result);
    } catch (error) {
      loggerService.error('Error in getAllConflicts controller', {
        error: error.message,
        stack: error.stack
      });

      return res.status(500).json({
        success: false,
        error: {
          message: error.message,
          code: 500,
          messageBn: 'সব কনফ্লিক্ট পেতে ব্যর্থ হয়েছে'
        }
      });
    }
  }

  /**
   * Admin conflict resolution (admin only)
   * POST /api/v1/admin/cart-wishlist/conflicts/:conflictId/resolve
   */
  async adminResolveConflict(req, res) {
    try {
      const conflictId = req.params.conflictId;
      const { resolution, adminNote } = req.body;
      const adminUserId = req.user?.id;

      if (!conflictId) {
        return res.status(400).json({
          success: false,
          error: {
            message: 'conflictId is required',
            code: 400,
            messageBn: 'conflictId প্রয়োজন'
          }
        });
      }

      if (!resolution || !['keep_cart', 'keep_wishlist', 'merge'].includes(resolution)) {
        return res.status(400).json({
          success: false,
          error: {
            message: 'resolution must be one of: keep_cart, keep_wishlist, merge',
            code: 400,
            messageBn: 'রেজোলিউশন অবশ্যই একটি হতে হবে: keep_cart, keep_wishlist, merge'
          }
        });
      }

      // Get conflict to verify ownership
      const conflict = await cartWishlistSyncService.prisma.cartWishlistSync.findUnique({
        where: { id: conflictId }
      });

      if (!conflict) {
        return res.status(404).json({
          success: false,
          error: {
            message: 'Conflict not found',
            code: 404,
            messageBn: 'কনফ্লিক্ট পাওয়া যায়নি'
          }
        });
      }

      // Admin can resolve any conflict, bypassing ownership check
      const result = await cartWishlistSyncService.resolveConflict(
        conflictId,
        resolution,
        conflict.userId // Use original user ID for resolution
      );

      // Log admin action
      loggerService.info('Admin resolved conflict', {
        adminUserId,
        conflictId,
        resolution,
        adminNote
      });

      return res.status(200).json(result);
    } catch (error) {
      loggerService.error('Error in adminResolveConflict controller', {
        error: error.message,
        stack: error.stack
      });

      const statusCode = error.message.includes('not found') ? 404 : 500;

      return res.status(statusCode).json({
        success: false,
        error: {
          message: error.message,
          code: statusCode,
          messageBn: 'কনফ্লিক্ট সমাধান করতে ব্যর্থ হয়েছে'
        }
      });
    }
  }

  /**
   * Get combined analytics (admin only)
   * GET /api/v1/admin/cart-wishlist/analytics
   */
  async getSystemAnalytics(req, res) {
    try {
      const filters = {
        startDate: req.query.startDate,
        endDate: req.query.endDate
      };

      const result = await cartWishlistAnalyticsService.getSystemAnalytics(filters);

      return res.status(200).json(result);
    } catch (error) {
      loggerService.error('Error in getSystemAnalytics controller', {
        error: error.message,
        stack: error.stack
      });

      return res.status(500).json({
        success: false,
        error: {
          message: error.message,
          code: 500,
          messageBn: 'সিস্টেম বিশ্লেষণ পেতে ব্যর্থ হয়েছে'
        }
      });
    }
  }

  /**
   * Get move history (admin only)
   * GET /api/v1/admin/cart-wishlist/move-history
   */
  async getAdminMoveHistory(req, res) {
    try {
      const { cartWishlistIntegrationService } = require('../../services/cartWishlist/cartWishlistIntegration.service');

      const filters = {
        userId: req.query.userId,
        productId: req.query.productId,
        moveType: req.query.moveType,
        startDate: req.query.startDate,
        endDate: req.query.endDate,
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 20
      };

      const result = await cartWishlistIntegrationService.getMoveHistory(
        filters.userId,
        filters
      );

      return res.status(200).json(result);
    } catch (error) {
      loggerService.error('Error in getAdminMoveHistory controller', {
        error: error.message,
        stack: error.stack
      });

      return res.status(500).json({
        success: false,
        error: {
          message: error.message,
          code: 500,
          messageBn: 'সরানোর ইতিহাস পেতে ব্যর্থ হয়েছে'
        }
      });
    }
  }

  /**
   * Get recent sync operations (admin only)
   * GET /api/v1/admin/cart-wishlist/sync/recent
   */
  async getRecentSyncs(req, res) {
    try {
      const limit = parseInt(req.query.limit) || 10;
      
      const recentSyncs = await cartWishlistSyncService.prisma.cartWishlistSync.findMany({
        where: {
          syncStatus: { in: ['syncing', 'completed', 'failed'] }
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true
            }
          }
        },
        orderBy: { lastSyncAt: 'desc' },
        take: limit
      });

      return res.status(200).json({
        success: true,
        data: recentSyncs.map(sync => ({
          id: sync.id,
          userId: sync.userId,
          userEmail: sync.user?.email,
          status: sync.syncStatus,
          lastSyncAt: sync.lastSyncAt,
          createdAt: sync.createdAt
        }))
      });
    } catch (error) {
      loggerService.error('Error in getRecentSyncs controller', {
        error: error.message,
        stack: error.stack
      });

      return res.status(500).json({
        success: false,
        error: {
          message: error.message,
          code: 500,
          messageBn: 'সাম্প্রতিক সিঙ্ক পেতে ব্যর্থ হয়েছে'
        }
      });
    }
  }

  /**
   * Bulk resolve conflicts (admin only)
   * POST /api/v1/admin/cart-wishlist/conflicts/bulk-resolve
   */
  async bulkResolveConflicts(req, res) {
    try {
      const { conflictIds, resolution } = req.body;
      const adminUserId = req.user?.id;

      if (!conflictIds || !Array.isArray(conflictIds) || conflictIds.length === 0) {
        return res.status(400).json({
          success: false,
          error: {
            message: 'conflictIds is required and must be a non-empty array',
            code: 400,
            messageBn: 'conflictIds প্রয়োজন এবং অবশ্যই একটি খালি না এমন অ্যারে হতে হবে'
          }
        });
      }

      if (!resolution || !['keep_cart', 'keep_wishlist', 'merge'].includes(resolution)) {
        return res.status(400).json({
          success: false,
          error: {
            message: 'resolution must be one of: keep_cart, keep_wishlist, merge',
            code: 400,
            messageBn: 'রেজোলিউশন অবশ্যই একটি হতে হবে: keep_cart, keep_wishlist, merge'
          }
        });
      }

      const results = [];
      const errors = [];

      for (const conflictId of conflictIds) {
        try {
          // Get conflict to verify it exists
          const conflict = await cartWishlistSyncService.prisma.cartWishlistSync.findUnique({
            where: { id: conflictId }
          });

          if (!conflict) {
            errors.push({ conflictId, error: 'Conflict not found' });
            continue;
          }

          // Resolve the conflict
          const result = await cartWishlistSyncService.resolveConflict(
            conflictId,
            resolution,
            conflict.userId
          );

          results.push({ conflictId, success: true, result });
        } catch (error) {
          errors.push({ conflictId, error: error.message });
        }
      }

      // Log admin action
      loggerService.info('Admin bulk resolved conflicts', {
        adminUserId,
        conflictIds,
        resolution,
        resolvedCount: results.length,
        errorCount: errors.length
      });

      return res.status(200).json({
        success: true,
        data: {
          resolved: results,
          errors,
          summary: {
            total: conflictIds.length,
            resolved: results.length,
            failed: errors.length
          }
        }
      });
    } catch (error) {
      loggerService.error('Error in bulkResolveConflicts controller', {
        error: error.message,
        stack: error.stack
      });

      return res.status(500).json({
        success: false,
        error: {
          message: error.message,
          code: 500,
          messageBn: 'বাল্ক কনফ্লিক্ট সমাধান করতে ব্যর্থ হয়েছে'
        }
      });
    }
  }

  /**
   * Get behavior analytics (admin only)
   * GET /api/v1/admin/cart-wishlist/analytics/behavior
   */
  async getBehaviorAnalytics(req, res) {
    try {
      const filters = {
        startDate: req.query.startDate,
        endDate: req.query.endDate
      };

      const result = await cartWishlistAnalyticsService.getBehaviorAnalytics(null, filters);

      return res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      loggerService.error('Error in getBehaviorAnalytics controller', {
        error: error.message,
        stack: error.stack
      });

      return res.status(500).json({
        success: false,
        error: {
          message: error.message,
          code: 500,
          messageBn: 'বিহেভিয়ার বিশ্লেষণ পেতে ব্যর্থ হয়েছে'
        }
      });
    }
  }

  /**
   * Get conversion analytics (admin only)
   * GET /api/v1/admin/cart-wishlist/analytics/conversion
   */
  async getConversionAnalytics(req, res) {
    try {
      const filters = {
        startDate: req.query.startDate,
        endDate: req.query.endDate
      };

      const result = await cartWishlistAnalyticsService.getConversionAnalytics(filters);

      return res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      loggerService.error('Error in getConversionAnalytics controller', {
        error: error.message,
        stack: error.stack
      });

      return res.status(500).json({
        success: false,
        error: {
          message: error.message,
          code: 500,
          messageBn: 'কনভার্সন বিশ্লেষণ পেতে ব্যর্থ হয়েছে'
        }
      });
    }
  }

  /**
   * Get abandonment analytics (admin only)
   * GET /api/v1/admin/cart-wishlist/analytics/abandonment
   */
  async getAbandonmentAnalytics(req, res) {
    try {
      const filters = {
        startDate: req.query.startDate,
        endDate: req.query.endDate
      };

      const result = await cartWishlistAnalyticsService.getAbandonmentAnalytics(filters);

      return res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      loggerService.error('Error in getAbandonmentAnalytics controller', {
        error: error.message,
        stack: error.stack
      });

      return res.status(500).json({
        success: false,
        error: {
          message: error.message,
          code: 500,
          messageBn: 'পরিত্যাগ বিশ্লেষণ পেতে ব্যর্থ হয়েছে'
        }
      });
    }
  }

  /**
   * Get performance metrics (admin only)
   * GET /api/v1/admin/cart-wishlist/analytics/performance
   */
  async getPerformanceMetrics(req, res) {
    try {
      const filters = {
        startDate: req.query.startDate,
        endDate: req.query.endDate
      };

      const result = await cartWishlistAnalyticsService.getPerformanceMetrics(filters);

      return res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      loggerService.error('Error in getPerformanceMetrics controller', {
        error: error.message,
        stack: error.stack
      });

      return res.status(500).json({
        success: false,
        error: {
          message: error.message,
          code: 500,
          messageBn: 'পারফরম্যান্স মেট্রিক্স পেতে ব্যর্থ হয়েছে'
        }
      });
    }
  }

  /**
   * Generate report (admin only)
   * POST /api/v1/admin/cart-wishlist/analytics/report
   */
  async generateReport(req, res) {
    try {
      const { type, startDate, endDate } = req.body;

      if (!type || !['json', 'csv'].includes(type)) {
        return res.status(400).json({
          success: false,
          error: {
            message: 'type must be one of: json, csv',
            code: 400,
            messageBn: 'টাইপ অবশ্যই একটি হতে হবে: json, csv'
          }
        });
      }

      const filters = {
        startDate,
        endDate
      };

      const result = await cartWishlistAnalyticsService.generateReport(type, filters);

      return res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      loggerService.error('Error in generateReport controller', {
        error: error.message,
        stack: error.stack
      });

      return res.status(500).json({
        success: false,
        error: {
          message: error.message,
          code: 500,
          messageBn: 'রিপোর্ট তৈরি করতে ব্যর্থ হয়েছে'
        }
      });
    }
  }

  /**
   * Get user behavior data (admin only)
   * GET /api/v1/admin/cart-wishlist/users/:userId/behavior
   */
  async getUserBehaviorData(req, res) {
    try {
      const { userId } = req.params;

      if (!userId) {
        return res.status(400).json({
          success: false,
          error: {
            message: 'userId is required',
            code: 400,
            messageBn: 'userId প্রয়োজন'
          }
        });
      }

      const filters = {
        startDate: req.query.startDate,
        endDate: req.query.endDate
      };

      const result = await cartWishlistAnalyticsService.getBehaviorAnalytics(userId, filters);

      return res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      loggerService.error('Error in getUserBehaviorData controller', {
        error: error.message,
        stack: error.stack
      });

      return res.status(500).json({
        success: false,
        error: {
          message: error.message,
          code: 500,
          messageBn: 'ব্যবহারকারীর বিহেভিয়ার ডেটা পেতে ব্যর্থ হয়েছে'
        }
      });
    }
  }

  /**
   * Search users (admin only)
   * GET /api/v1/admin/cart-wishlist/users/search
   */
  async searchUsers(req, res) {
    try {
      const { q } = req.query;

      if (!q || q.trim().length === 0) {
        return res.status(400).json({
          success: false,
          error: {
            message: 'Search query is required',
            code: 400,
            messageBn: 'অনুসন্ধান ক্যোয়ারি প্রয়োজন'
          }
        });
      }

      const { PrismaClient } = require('@prisma/client');
      const prisma = new PrismaClient();

      // Search users by email, first name, or last name
      const users = await prisma.users.findMany({
        where: {
          OR: [
            { email: { contains: q, mode: 'insensitive' } },
            { firstName: { contains: q, mode: 'insensitive' } },
            { lastName: { contains: q, mode: 'insensitive' } }
          ]
        },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          createdAt: true
        },
        take: 20
      });

      return res.status(200).json({
        success: true,
        data: users
      });
    } catch (error) {
      loggerService.error('Error in searchUsers controller', {
        error: error.message,
        stack: error.stack
      });

      return res.status(500).json({
        success: false,
        error: {
          message: error.message,
          code: 500,
          messageBn: 'ব্যবহারকারী অনুসন্ধান করতে ব্যর্থ হয়েছে'
        }
      });
    }
  }
}

module.exports = {
  adminCartWishlistController: new AdminCartWishlistController()
};
