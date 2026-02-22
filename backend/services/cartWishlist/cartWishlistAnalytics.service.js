const { PrismaClient } = require('@prisma/client');
const { loggerService } = require('../logger');

/**
 * Cart-Wishlist Analytics Service
 * 
 * Business logic for cart-wishlist analytics:
 * - User behavior analytics
 * - Conversion funnel analytics
 * - Abandonment analytics
 * - Performance metrics
 */
class CartWishlistAnalyticsService {
  constructor() {
    this.prisma = new PrismaClient();
    this.logger = loggerService;
  }

  /**
   * Get user behavior analytics
   * @param {string} userId - User ID (optional, for admin queries)
   * @param {Object} filters - Date filters
   * @returns {Promise<Object>} Behavior analytics
   */
  async getBehaviorAnalytics(userId = null, filters = {}) {
    const { startDate, endDate } = filters;
    const where = {};
    
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }
    
    if (userId) {
      where.userId = userId;
    }

    // 1. Calculate user behavior metrics
    const userBehaviorData = await this.prisma.cartWishlistMoveHistory.groupBy({
      by: ['userId'],
      where: { ...where },
      _count: {
        moveType: true
      }
    });

    // Get user names for each user
    const userIds = userBehaviorData.map(u => u.userId);
    const users = await this.prisma.user.findMany({
      where: { id: { in: userIds } },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true
      }
    });

    const userMap = new Map(users.map(u => [u.id, u]));

    // Format user behavior data
    const userBehavior = userBehaviorData.map(ub => {
      const user = userMap.get(ub.userId);
      return {
        userId: ub.userId,
        userName: user ? `${user.firstName} ${user.lastName}`.trim() || user.email : 'Unknown',
        cartAdds: 0, // Will be calculated from cart events
        cartRemoves: 0,
        wishlistAdds: 0,
        wishlistRemoves: 0,
        moveOperations: ub._count.moveType
      };
    });

    // 2. Calculate move patterns
    const cartToWishlist = await this.prisma.cartWishlistMoveHistory.count({
      where: { ...where, moveType: 'cart_to_wishlist' }
    });

    const wishlistToCart = await this.prisma.cartWishlistMoveHistory.count({
      where: { ...where, moveType: 'wishlist_to_cart' }
    });

    // Calculate cartToWishlistToCart pattern (complex query)
    // This requires finding items that went cart→wishlist→cart
    const cartToWishlistToCart = await this.calculateCartWishlistToCartPattern(where);

    // 3. Calculate time in cart metrics
    // Note: CartItem doesn't have removedAt field, so we can't calculate time in cart
    // Return default values for now
    const timeInCart = { average: 0, median: 0, max: 0 };

    // 4. Calculate time in wishlist metrics
    // Note: WishlistItem doesn't have removedAt field, so we can't calculate time in wishlist
    // Return default values for now
    const timeInWishlist = { average: 0, median: 0, max: 0 };

    return {
      userBehavior,
      timeInCart,
      timeInWishlist,
      movePatterns: {
        cartToWishlist,
        wishlistToCart,
        cartToWishlistToCart
      }
    };
  }

  // Helper method to calculate time metrics
  calculateTimeMetrics(times) {
    if (times.length === 0) {
      return { average: 0, median: 0, max: 0 };
    }

    const sorted = [...times].sort((a, b) => a - b);
    const sum = sorted.reduce((acc, val) => acc + val, 0);
    const average = sum / sorted.length;
    const median = sorted.length % 2 === 0
      ? (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2
      : sorted[Math.floor(sorted.length / 2)];
    const max = sorted[sorted.length - 1];

    return { average, median, max };
  }

  // Helper method to calculate cart→wishlist→cart pattern
  async calculateCartWishlistToCartPattern(where) {
    // Find items that moved from cart to wishlist
    const cartToWishlistMoves = await this.prisma.cartWishlistMoveHistory.findMany({
      where: { ...where, moveType: 'cart_to_wishlist' },
      select: {
        userId: true,
        productId: true,
        createdAt: true
      }
    });

    let count = 0;

    for (const move of cartToWishlistMoves) {
      // Check if the same item moved back to cart after this move
      const backToCart = await this.prisma.cartWishlistMoveHistory.findFirst({
        where: {
          userId: move.userId,
          productId: move.productId,
          moveType: 'wishlist_to_cart',
          createdAt: { gt: move.createdAt }
        },
        orderBy: { createdAt: 'asc' }
      });

      if (backToCart) {
        count++;
      }
    }

    return count;
  }

  /**
   * Get conversion funnel analytics
   * @param {Object} filters - Date filters
   * @returns {Promise<Object>} Conversion analytics
   */
  async getConversionAnalytics(filters = {}) {
    try {
      const { startDate, endDate } = filters;
      const where = {};
      
      if (startDate || endDate) {
        where.createdAt = {};
        if (startDate) where.createdAt.gte = new Date(startDate);
        if (endDate) where.createdAt.lte = new Date(endDate);
      }

      // Count funnel metrics
      const views = await this.prisma.cartEvent.count({
        where: { ...where, eventType: 'view', userId: { not: null } }
      });
      
      const cartAdds = await this.prisma.cartEvent.count({
        where: { ...where, eventType: 'add', userId: { not: null } }
      });
      
      const wishlistAdds = await this.prisma.wishlistItem.count(where);
      
      const cartToWishlistMoves = await this.prisma.cartWishlistMoveHistory.count({
        where: { ...where, moveType: 'cart_to_wishlist' }
      });
      
      const wishlistToCartMoves = await this.prisma.cartWishlistMoveHistory.count({
        where: { ...where, moveType: 'wishlist_to_cart' }
      });
      
      const checkouts = await this.prisma.cart.count({
        where: { ...where, status: 'converted' }
      });

      // Calculate conversion rates
      const viewToCart = views > 0 ? (cartAdds / views) * 100 : 0;
      const viewToWishlist = views > 0 ? (wishlistAdds / views) * 100 : 0;
      const cartToCheckout = cartAdds > 0 ? (checkouts / cartAdds) * 100 : 0;
      const wishlistToCart = wishlistAdds > 0 ? (wishlistToCartMoves / wishlistAdds) * 100 : 0;
      const wishlistToCheckout = wishlistAdds > 0 ? (checkouts / wishlistAdds) * 100 : 0;

      return {
        funnel: {
          views,
          cartAdds,
          wishlistAdds,
          cartToWishlistMoves,
          wishlistToCartMoves,
          checkouts
        },
        conversionRates: {
          viewToCart: parseFloat(viewToCart.toFixed(2)),
          viewToWishlist: parseFloat(viewToWishlist.toFixed(2)),
          cartToCheckout: parseFloat(cartToCheckout.toFixed(2)),
          wishlistToCart: parseFloat(wishlistToCart.toFixed(2)),
          wishlistToCheckout: parseFloat(wishlistToCheckout.toFixed(2))
        },
        topConvertedProducts: [] // Implement if needed
      };
    } catch (error) {
      this.logger.error('Error getting conversion analytics', { error: error.message });
      throw error;
    }
  }

  /**
   * Get cart abandonment analytics
   * @param {Object} filters - Date filters
   * @returns {Promise<Object>} Abandonment analytics
   */
  async getAbandonmentAnalytics(filters = {}) {
    try {
      const { startDate, endDate } = filters;
      const where = {};
      
      if (startDate || endDate) {
        where.createdAt = {};
        if (startDate) where.createdAt.gte = new Date(startDate);
        if (endDate) where.createdAt.lte = new Date(endDate);
      }

      // Count abandoned carts (carts with items that haven't been checked out)
      const abandonedCarts = await this.prisma.cart.count({
        where: {
          ...where,
          status: 'active',
          updatedAt: {
            lt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // 30 days ago
          }
        }
      });

      // Count total carts
      const totalCarts = await this.prisma.cart.count({
        where: { ...where }
      });

      // Calculate cart abandonment rate
      const cartAbandonmentRate = totalCarts > 0 ? (abandonedCarts / totalCarts) * 100 : 0;

      // Count abandoned wishlists (wishlists with items that haven't been moved to cart)
      const abandonedWishlists = await this.prisma.wishlist.count({
        where: {
          ...where,
          updatedAt: {
            lt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // 30 days ago
          }
        }
      });

      // Count total wishlists
      const totalWishlists = await this.prisma.wishlist.count({
        where: { ...where }
      });

      // Calculate wishlist abandonment rate
      const wishlistAbandonmentRate = totalWishlists > 0 ? (abandonedWishlists / totalWishlists) * 100 : 0;

      // Calculate average time before abandonment
      // Note: CartItem and WishlistItem don't have removedAt field, so we can't calculate time before abandonment
      // Return default values for now
      const averageTimeBeforeCartAbandon = 0;
      const averageTimeBeforeWishlistAbandon = 0;

      // Get abandonment trend (last 7 days)
      const abandonmentTrend = [];
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        date.setHours(0, 0, 0, 0);
        const nextDate = new Date(date);
        nextDate.setDate(nextDate.getDate() + 1);

        const dayCartAbandonments = await this.prisma.cart.count({
          where: {
            status: 'active',
            updatedAt: {
              gte: date,
              lt: nextDate
            }
          }
        });

        const dayWishlistAbandonments = await this.prisma.wishlist.count({
          where: {
            updatedAt: {
              gte: date,
              lt: nextDate
            }
          }
        });

        abandonmentTrend.push({
          date: date.toISOString().split('T')[0],
          cartAbandonments: dayCartAbandonments,
          wishlistAbandonments: dayWishlistAbandonments
        });
      }

      // Get top abandoned products
      // Note: CartItem doesn't have removedAt field, so we can't track abandoned products
      // Return empty array for now
      const topAbandonedCartProducts = [];

      const topAbandonedProducts = [];

      return {
        cartAbandonment: {
          totalAbandoned: abandonedCarts,
          abandonmentRate: parseFloat(cartAbandonmentRate.toFixed(2)),
          averageTimeBeforeAbandon: parseFloat(averageTimeBeforeCartAbandon.toFixed(2))
        },
        wishlistAbandonment: {
          totalAbandoned: abandonedWishlists,
          abandonmentRate: parseFloat(wishlistAbandonmentRate.toFixed(2)),
          averageTimeBeforeAbandon: parseFloat(averageTimeBeforeWishlistAbandon.toFixed(2))
        },
        abandonmentTrend,
        topAbandonedProducts
      };
    } catch (error) {
      this.logger.error('Error getting abandonment analytics', { error: error.message });
      throw error;
    }
  }

  /**
   * Get performance metrics
   * @param {Object} filters - Date filters
   * @returns {Promise<Object>} Performance metrics
   */
  async getPerformanceMetrics(filters = {}) {
    try {
      const { startDate, endDate } = filters;

      this.logger.info('Getting performance metrics', { startDate, endDate });

      const where = {};
      if (startDate || endDate) {
        where.timestamp = {};
        if (startDate) where.timestamp.gte = new Date(startDate);
        if (endDate) where.timestamp.lte = new Date(endDate);
      }

      // Get sync records
      const syncRecords = await this.prisma.cartWishlistSync.findMany({
        where,
        select: {
          createdAt: true,
          updatedAt: true,
          syncStatus: true
        }
      });

      // Calculate average sync time
      const syncTimes = syncRecords
        .filter(record => record.syncStatus === 'completed')
        .map(record => (record.updatedAt - record.createdAt) / 1000); // in seconds

      const averageSyncTime = syncTimes.length > 0
        ? syncTimes.reduce((sum, time) => sum + time, 0) / syncTimes.length
        : 0;

      // Count failed syncs
      const failedSyncs = syncRecords.filter(record => record.syncStatus === 'failed').length;

      // Count successful moves
      const successfulMoves = await this.prisma.cartWishlistMoveHistory.count(where);

      // Count failed moves (from sync error messages)
      const failedMoves = failedSyncs; // Simplified - in real implementation, would track actual failed moves

      return {
        averageSyncTime: parseFloat(averageSyncTime.toFixed(2)),
        failedSyncs,
        successfulMoves,
        failedMoves
      };
    } catch (error) {
      this.logger.error('Error getting performance metrics', { error: error.message });
      throw error;
    }
  }

  /**
   * Generate comprehensive report
   * @param {string} format - Report format: 'json' or 'csv'
   * @param {Object} filters - Date filters
   * @returns {Promise<Object>} Report
   */
  async generateReport(format = 'json', filters = {}) {
    try {
      const { startDate, endDate } = filters;

      this.logger.info('Generating report', { format, startDate, endDate });

      // Get all analytics data
      const behaviorAnalytics = await this.getBehaviorAnalytics(null, filters);
      const conversionAnalytics = await this.getConversionAnalytics(filters);
      const abandonmentAnalytics = await this.getAbandonmentAnalytics(filters);
      const performanceMetrics = await this.getPerformanceMetrics(filters);

      const report = {
        generatedAt: new Date().toISOString(),
        period: {
          startDate: startDate || 'all time',
          endDate: endDate || 'now'
        },
        behavior: behaviorAnalytics,
        conversion: conversionAnalytics,
        abandonment: abandonmentAnalytics,
        performance: performanceMetrics
      };

      if (format === 'csv') {
        // Convert to CSV format
        const csv = this.convertToCSV(report);
        return {
          format: 'csv',
          report: csv,
          generatedAt: report.generatedAt
        };
      }

      return {
        format: 'json',
        report,
        generatedAt: report.generatedAt
      };
    } catch (error) {
      this.logger.error('Error generating report', { error: error.message });
      throw error;
    }
  }

  /**
   * Convert report data to CSV format
   * @param {Object} report - Report object
   * @returns {string} CSV string
   */
  convertToCSV(report) {
    // Simplified CSV conversion
    const lines = [
      'Cart-Wishlist Integration Report',
      `Generated At,${report.generatedAt}`,
      `Period,${report.period.startDate} - ${report.period.endDate}`,
      '',
      'Conversion Metrics',
      `View to Cart,${report.conversion.viewToCart}%`,
      `Cart to Wishlist,${report.conversion.cartToWishlist}%`,
      `Wishlist to Cart,${report.conversion.wishlistToCart}%`,
      `Cart to Checkout,${report.conversion.cartToCheckout}%`,
      `Overall Conversion,${report.conversion.overallConversion}%`,
      '',
      'Abandonment Metrics',
      `Abandoned Carts,${report.abandonment.abandonedCarts}`,
      `Abandonment Rate,${report.abandonment.abandonmentRate}%`,
      `Avg Time Before Abandonment,${report.abandonment.averageTimeBeforeAbandonment} minutes`,
      '',
      'Performance Metrics',
      `Avg Sync Time,${report.performance.averageSyncTime} seconds`,
      `Failed Syncs,${report.performance.failedSyncs}`,
      `Successful Moves,${report.performance.successfulMoves}`
    ];

    return lines.join('\n');
  }

  /**
   * Get system-wide analytics (admin only)
   * @param {Object} filters - Date filters
   * @returns {Promise<Object>} System analytics
   */
  async getSystemAnalytics(filters = {}) {
    try {
      const { startDate, endDate } = filters;

      this.logger.info('Getting system analytics', { startDate, endDate });

      const where = {};
      if (startDate || endDate) {
        where.timestamp = {};
        if (startDate) where.timestamp.gte = new Date(startDate);
        if (endDate) where.timestamp.lte = new Date(endDate);
      }

      // 1. Cart Activity - Query cart events for adds, removes, views
      const cartAdds = await this.prisma.cartEvent.count({
        where: { ...where, eventType: 'add' }
      });

      const cartRemoves = await this.prisma.cartEvent.count({
        where: { ...where, eventType: 'remove' }
      });

      const cartViews = await this.prisma.cartEvent.count({
        where: { ...where, eventType: 'view' }
      });

      // 2. Wishlist Activity - Query wishlist items for adds, removes, views
      // Note: WishlistItem doesn't have a removedAt field in the schema
      // We count all wishlist items as adds since items are deleted when removed
      // Don't apply date filters to wishlistItem queries as they don't have timestamp field
      const wishlistAdds = await this.prisma.wishlistItem.count(where);

      // For wishlist removes, we can't track them directly as WishlistItem doesn't have removedAt
      // We'll set it to 0 for now, or we could track this via WishlistAnalytics events
      const wishlistRemoves = 0;

      // Wishlist views - track from wishlist analytics events
      // Don't apply date filters here either as wishlistAnalytics has different schema
      const wishlistViews = await this.prisma.wishlistAnalytics.count({
        where: { ...where, eventType: 'view' }
      });

      // 3. Move Operations - Query cartWishlistMoveHistory table
      const cartToWishlist = await this.prisma.cartWishlistMoveHistory.count({
        where: { ...where, moveType: 'cart_to_wishlist' }
      });

      const wishlistToCart = await this.prisma.cartWishlistMoveHistory.count({
        where: { ...where, moveType: 'wishlist_to_cart' }
      });

      const totalMoves = cartToWishlist + wishlistToCart;

      // 4. Sync Stats - Query cartWishlistSync table
      const totalSyncs = await this.prisma.cartWishlistSync.count(where);

      const successfulSyncs = await this.prisma.cartWishlistSync.count({
        where: { ...where, syncStatus: 'completed' }
      });

      const failedSyncs = await this.prisma.cartWishlistSync.count({
        where: { ...where, syncStatus: 'failed' }
      });

      // Calculate average sync time from completed sync records
      const syncRecords = await this.prisma.cartWishlistSync.findMany({
        where: { ...where, syncStatus: 'completed' },
        select: {
          createdAt: true,
          updatedAt: true
        }
      });

      const syncTimes = syncRecords
        .filter(record => record.updatedAt && record.createdAt)
        .map(record => (new Date(record.updatedAt).getTime() - new Date(record.createdAt).getTime()) / 1000); // in seconds

      const averageSyncTime = syncTimes.length > 0
        ? syncTimes.reduce((sum, time) => sum + time, 0) / syncTimes.length
        : 0;

      // 5. Conflict Stats - Calculate from sync failures
      const totalConflicts = failedSyncs;

      // Resolved conflicts - syncs that were previously failed but are now completed
      // This is a simplified approach - in a real implementation, you might track this more explicitly
      const resolvedConflicts = await this.prisma.cartWishlistSync.count({
        where: { ...where, syncStatus: 'completed', errorMessage: { not: null } }
      });

      const pendingConflicts = totalConflicts - resolvedConflicts;

      // 6. Build the response object with the exact structure expected by the frontend
      const result = {
        cartActivity: {
          totalAdds: cartAdds,
          totalRemoves: cartRemoves,
          totalViews: cartViews
        },
        wishlistActivity: {
          totalAdds: wishlistAdds,
          totalRemoves: wishlistRemoves,
          totalViews: wishlistViews
        },
        moveOperations: {
          cartToWishlist,
          wishlistToCart,
          total: totalMoves
        },
        syncStats: {
          totalSyncs,
          successfulSyncs,
          failedSyncs,
          averageSyncTime: parseFloat(averageSyncTime.toFixed(2))
        },
        conflictStats: {
          totalConflicts,
          resolvedConflicts,
          pendingConflicts
        }
      };

      // Add date range if filters were provided
      if (startDate || endDate) {
        result.dateRange = {
          startDate: startDate || null,
          endDate: endDate || null
        };
      }

      return result;
    } catch (error) {
      this.logger.error('Error getting system analytics', { error: error.message });
      throw error;
    }
  }

  /**
   * Get all conflicts (admin only)
   * @returns {Promise<Object>} Conflicts
   */
  async getAllConflicts() {
    try {
      this.logger.info('Getting all conflicts');

      const conflicts = await this.prisma.cartWishlistSync.findMany({
        where: {
          syncStatus: 'failed'
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true
            }
          },
          cart: true,
          wishlist: true
        },
        orderBy: { createdAt: 'desc' }
      });

      return {
        conflicts: conflicts.map(conflict => ({
          id: conflict.id,
          userId: conflict.userId,
          userEmail: conflict.user?.email,
          type: 'sync_conflict',
          data: {
            cartId: conflict.cartId,
            wishlistId: conflict.wishlistId,
            errorMessage: conflict.errorMessage
          },
          createdAt: conflict.createdAt
        }))
      };
    } catch (error) {
      this.logger.error('Error getting all conflicts', { error: error.message });
      throw error;
    }
  }

  /**
   * Get system-wide sync status (admin only)
   * @returns {Promise<Object>} System sync status
   */
  async getSystemSyncStatus() {
    try {
      this.logger.info('Getting system sync status');

      // Count total syncs
      const totalSyncs = await this.prisma.cartWishlistSync.count();

      // Count active syncs
      const activeSyncs = await this.prisma.cartWishlistSync.count({
        where: { syncStatus: 'syncing' }
      });

      // Count failed syncs
      const failedSyncs = await this.prisma.cartWishlistSync.count({
        where: { syncStatus: 'failed' }
      });

      // Get recent syncs
      const recentSyncs = await this.prisma.cartWishlistSync.findMany({
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
        take: 10
      });

      return {
        totalSyncs,
        activeSyncs,
        failedSyncs,
        recentSyncs: recentSyncs.map(sync => ({
          userId: sync.userId,
          userEmail: sync.user?.email,
          status: sync.syncStatus,
          lastSyncAt: sync.lastSyncAt
        }))
      };
    } catch (error) {
      this.logger.error('Error getting system sync status', { error: error.message });
      throw error;
    }
  }
}

module.exports = {
  cartWishlistAnalyticsService: new CartWishlistAnalyticsService()
};
