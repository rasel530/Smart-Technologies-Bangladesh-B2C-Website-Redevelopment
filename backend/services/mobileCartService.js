const { PrismaClient } = require('@prisma/client');
const { loggerService } = require('./logger');
const crypto = require('crypto');

class MobileCartService {
  constructor() {
    this.prisma = new PrismaClient({
      log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
      datasources: {
        db: {
          url: process.env.DATABASE_URL
        }
      }
    });

    this.prisma.$connect()
      .then(() => {
        this.logger.info('[MobileCartService] Database connection established successfully');
      })
      .catch((error) => {
        this.logger.error('[MobileCartService] Failed to connect to database', {
          error: error.message,
          code: error.code
        });
      });

    this.logger = loggerService;
  }

  /**
   * Record offline cart change
   * @param {Object} changeData - Offline change data
   * @returns {Promise<Object>} Created offline change record
   */
  async recordOfflineChange(changeData) {
    try {
      const {
        userId,
        sessionId,
        deviceId,
        action,
        productId,
        variantId,
        quantity,
        previousValue,
        newValue
      } = changeData;

      if (!deviceId) {
        throw new Error('deviceId is required');
      }

      if (!action) {
        throw new Error('action is required');
      }

      const validActions = ['add', 'update', 'remove', 'clear'];
      if (!validActions.includes(action)) {
        throw new Error(`Invalid action. Valid actions are: ${validActions.join(', ')}`);
      }

      const offlineChange = await this.prisma.offlineCartChange.create({
        data: {
          userId,
          sessionId,
          deviceId,
          action,
          productId,
          variantId,
          quantity,
          previousValue,
          newValue,
          isSynced: false,
          failedAttempts: 0
        }
      });

      this.logger.info('Offline cart change recorded', {
        changeId: offlineChange.id,
        userId,
        sessionId,
        deviceId,
        action
      });

      return offlineChange;
    } catch (error) {
      this.logger.error('Error recording offline cart change', {
        error: error.message,
        changeData
      });
      throw error;
    }
  }

  /**
   * Sync offline changes to server
   * @param {string} userId - User ID
   * @param {string} sessionId - Session ID
   * @param {string} deviceId - Device ID
   * @returns {Promise<Object>} Sync result
   */
  async syncOfflineChanges(userId, sessionId, deviceId) {
    try {
      this.logger.info('Syncing offline changes', { userId, sessionId, deviceId });

      // Get pending changes
      const pendingChanges = await this.prisma.offlineCartChange.findMany({
        where: {
          OR: [
            { userId },
            { sessionId }
          ],
          deviceId,
          isSynced: false
        },
        orderBy: { createdAt: 'asc' }
      });

      if (pendingChanges.length === 0) {
        return {
          success: true,
          synced: 0,
          failed: 0,
          message: 'No pending changes to sync'
        };
      }

      let synced = 0;
      let failed = 0;
      const errors = [];

      // Process each change
      for (const change of pendingChanges) {
        try {
          // Apply the change based on action type
          await this.applyOfflineChange(change);
          
          // Mark as synced
          await this.prisma.offlineCartChange.update({
            where: { id: change.id },
            data: {
              isSynced: true,
              syncedAt: new Date()
            }
          });

          synced++;
        } catch (error) {
          failed++;
          errors.push({
            changeId: change.id,
            error: error.message
          });

          // Increment failed attempts
          await this.prisma.offlineCartChange.update({
            where: { id: change.id },
            data: {
              failedAttempts: { increment: 1 },
              errorMessage: error.message
            }
          });

          this.logger.error('Failed to sync offline change', {
            changeId: change.id,
            error: error.message
          });
        }
      }

      this.logger.info('Offline sync completed', {
        userId,
        sessionId,
        deviceId,
        synced,
        failed,
        total: pendingChanges.length
      });

      return {
        success: true,
        synced,
        failed,
        total: pendingChanges.length,
        errors
      };
    } catch (error) {
      this.logger.error('Error syncing offline changes', {
        userId,
        sessionId,
        deviceId,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Apply offline change to cart
   * @private
   * @param {Object} change - Offline change record
   */
  async applyOfflineChange(change) {
    // This method would integrate with cartService to apply changes
    // For now, we'll just mark the logic as a placeholder
    this.logger.info('Applying offline change', {
      changeId: change.id,
      action: change.action,
      productId: change.productId
    });

    // TODO: Integrate with cartService to actually apply changes
    // switch (change.action) {
    //   case 'add':
    //     await cartService.addItemToCart(...);
    //     break;
    //   case 'update':
    //     await cartService.updateCartItemQuantity(...);
    //     break;
    //   case 'remove':
    //     await cartService.removeCartItem(...);
    //     break;
    //   case 'clear':
    //     await cartService.clearCart(...);
    //     break;
    // }
  }

  /**
   * Get pending offline changes
   * @param {string} userId - User ID
   * @param {string} sessionId - Session ID
   * @param {string} deviceId - Device ID
   * @returns {Promise<Array>} Pending offline changes
   */
  async getPendingChanges(userId, sessionId, deviceId) {
    try {
      const pendingChanges = await this.prisma.offlineCartChange.findMany({
        where: {
          OR: [
            { userId },
            { sessionId }
          ],
          deviceId,
          isSynced: false
        },
        orderBy: { createdAt: 'desc' }
      });

      this.logger.info('Retrieved pending offline changes', {
        userId,
        sessionId,
        deviceId,
        count: pendingChanges.length
      });

      return pendingChanges;
    } catch (error) {
      this.logger.error('Error getting pending offline changes', {
        userId,
        sessionId,
        deviceId,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Record mobile analytics
   * @param {Object} analyticsData - Mobile analytics data
   * @returns {Promise<Object>} Created analytics record
   */
  async recordMobileAnalytics(analyticsData) {
    try {
      const {
        userId,
        sessionId,
        deviceId,
        platform,
        deviceType,
        browser,
        networkType,
        networkSpeed,
        screenResolution,
        cartId,
        action,
        productId,
        paymentMethod,
        emiPlanId,
        duration,
        pageCount,
        touchCount,
        scrollDepth,
        metadata
      } = analyticsData;

      if (!deviceId) {
        throw new Error('deviceId is required');
      }

      if (!platform) {
        throw new Error('platform is required');
      }

      if (!action) {
        throw new Error('action is required');
      }

      const validPlatforms = ['mobile', 'desktop', 'tablet'];
      if (!validPlatforms.includes(platform)) {
        throw new Error(`Invalid platform. Valid platforms are: ${validPlatforms.join(', ')}`);
      }

      const validActions = ['view', 'add', 'update', 'remove', 'checkout', 'abandon'];
      if (!validActions.includes(action)) {
        throw new Error(`Invalid action. Valid actions are: ${validActions.join(', ')}`);
      }

      const analytics = await this.prisma.cartAnalyticsBd.create({
        data: {
          userId,
          sessionId,
          deviceId,
          platform,
          deviceType,
          browser,
          networkType,
          networkSpeed,
          screenResolution,
          cartId,
          action,
          productId,
          paymentMethod,
          emiPlanId,
          duration,
          pageCount,
          touchCount,
          scrollDepth,
          metadata
        }
      });

      this.logger.info('Mobile analytics recorded', {
        analyticsId: analytics.id,
        userId,
        sessionId,
        deviceId,
        platform,
        action
      });

      return analytics;
    } catch (error) {
      this.logger.error('Error recording mobile analytics', {
        error: error.message,
        analyticsData
      });
      throw error;
    }
  }

  /**
   * Get mobile analytics with filters
   * @param {Object} filters - Analytics filters
   * @returns {Promise<Array>} Mobile analytics records
   */
  async getMobileAnalytics(filters = {}) {
    try {
      const {
        userId,
        sessionId,
        deviceId,
        platform,
        action,
        startDate,
        endDate,
        limit = 100
      } = filters;

      const where = {};

      if (userId) where.userId = userId;
      if (sessionId) where.sessionId = sessionId;
      if (deviceId) where.deviceId = deviceId;
      if (platform) where.platform = platform;
      if (action) where.action = action;

      // Validate date formats
      if (startDate || endDate) {
        where.createdAt = {};
        
        if (startDate) {
          const parsedStartDate = new Date(startDate);
          if (isNaN(parsedStartDate.getTime())) {
            const error = new Error('Invalid startDate format. Please provide a valid ISO date string (e.g., 2024-01-01 or 2024-01-01T00:00:00Z)');
            error.statusCode = 400;
            error.code = 'INVALID_DATE_FORMAT';
            throw error;
          }
          where.createdAt.gte = parsedStartDate;
        }
        
        if (endDate) {
          const parsedEndDate = new Date(endDate);
          if (isNaN(parsedEndDate.getTime())) {
            const error = new Error('Invalid endDate format. Please provide a valid ISO date string (e.g., 2024-01-01 or 2024-01-01T00:00:00Z)');
            error.statusCode = 400;
            error.code = 'INVALID_DATE_FORMAT';
            throw error;
          }
          where.createdAt.lte = parsedEndDate;
        }
      }

      const analytics = await this.prisma.cartAnalyticsBd.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit
      });

      this.logger.info('Retrieved mobile analytics', {
        filters,
        count: analytics.length
      });

      return analytics;
    } catch (error) {
      this.logger.error('Error getting mobile analytics', {
        filters,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Get mobile performance metrics
   * @returns {Promise<Object>} Performance metrics
   */
  async getMobilePerformanceMetrics() {
    try {
      // Get analytics from last 7 days
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const analytics = await this.prisma.cartAnalyticsBd.findMany({
        where: {
          createdAt: { gte: sevenDaysAgo }
        }
      });

      // Calculate metrics
      const totalEvents = analytics.length;
      const mobileEvents = analytics.filter(a => a.platform === 'mobile').length;
      const desktopEvents = analytics.filter(a => a.platform === 'desktop').length;
      const tabletEvents = analytics.filter(a => a.platform === 'tablet').length;

      const networkTypeCounts = analytics.reduce((acc, a) => {
        if (a.networkType) {
          acc[a.networkType] = (acc[a.networkType] || 0) + 1;
        }
        return acc;
      }, {});

      const actionCounts = analytics.reduce((acc, a) => {
        acc[a.action] = (acc[a.action] || 0) + 1;
        return acc;
      }, {});

      const avgDuration = analytics
        .filter(a => a.duration !== null)
        .reduce((sum, a) => sum + a.duration, 0) / 
        (analytics.filter(a => a.duration !== null).length || 1);

      const avgTouchCount = analytics
        .filter(a => a.touchCount !== null)
        .reduce((sum, a) => sum + a.touchCount, 0) / 
        (analytics.filter(a => a.touchCount !== null).length || 1);

      const metrics = {
        totalEvents,
        platformBreakdown: {
          mobile: mobileEvents,
          desktop: desktopEvents,
          tablet: tabletEvents
        },
        networkTypeBreakdown: networkTypeCounts,
        actionBreakdown: actionCounts,
        averageMetrics: {
          duration: Math.round(avgDuration),
          touchCount: Math.round(avgTouchCount)
        },
        period: {
          startDate: sevenDaysAgo.toISOString(),
          endDate: new Date().toISOString()
        }
      };

      this.logger.info('Retrieved mobile performance metrics', metrics);

      return metrics;
    } catch (error) {
      this.logger.error('Error getting mobile performance metrics', {
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Optimize cart data for mobile
   * @param {Object} cartData - Full cart data
   * @returns {Promise<Object>} Optimized cart data
   */
  async optimizeCartForMobile(cartData) {
    try {
      if (!cartData) {
        throw new Error('Cart data is required');
      }

      // Optimize items for mobile
      const optimizedItems = (cartData.items || []).map(item => ({
        id: item.id,
        productId: item.productId,
        variantId: item.variantId,
        productName: item.product?.name || item.productName,
        productNameEn: item.product?.nameEn || item.productNameEn,
        productNameBn: item.product?.nameBn || item.productNameBn,
        quantity: item.quantity,
        price: parseFloat(item.price),
        subtotal: parseFloat(item.subtotal),
        // Use thumbnail URL for mobile (smaller images)
        image: item.product?.images?.[0]?.thumbnailUrl || 
                item.product?.images?.[0]?.optimizedUrl || 
                item.product?.images?.[0]?.originalUrl || 
                item.image,
        variantName: item.variant?.name || item.variantName,
        inStock: item.variant ? item.variant.stock > 0 : item.product?.stockQuantity > 0
      }));

      // Optimize cart structure
      const optimizedCart = {
        id: cartData.id,
        userId: cartData.userId,
        sessionId: cartData.sessionId,
        items: optimizedItems,
        totals: {
          subtotal: parseFloat(cartData.subtotal || 0),
          tax: parseFloat(cartData.tax || 0),
          shippingCost: parseFloat(cartData.shippingCost || 0),
          discount: parseFloat(cartData.discount || 0),
          total: parseFloat(cartData.total || 0)
        },
        itemCount: cartData.itemCount || optimizedItems.length,
        totalItems: cartData.totalItems || optimizedItems.reduce((sum, item) => sum + item.quantity, 0),
        status: cartData.status,
        updatedAt: cartData.updatedAt
      };

      this.logger.info('Cart optimized for mobile', {
        cartId: cartData.id,
        itemCount: optimizedItems.length
      });

      return optimizedCart;
    } catch (error) {
      this.logger.error('Error optimizing cart for mobile', {
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Compress cart data for mobile transmission
   * @param {Object} cartData - Cart data to compress
   * @returns {Promise<Object>} Compressed cart data
   */
  async compressCartData(cartData) {
    try {
      if (!cartData) {
        throw new Error('Cart data is required');
      }

      // Remove unnecessary fields for mobile
      const compressed = {
        i: cartData.id, // cart id
        s: parseFloat(cartData.subtotal || 0), // subtotal
        t: parseFloat(cartData.tax || 0), // tax
        sc: parseFloat(cartData.shippingCost || 0), // shipping cost
        d: parseFloat(cartData.discount || 0), // discount
        tot: parseFloat(cartData.total || 0), // total
        ic: cartData.itemCount || 0, // item count
        tic: cartData.totalItems || 0, // total items
        items: (cartData.items || []).map(item => ({
          i: item.id, // item id
          p: item.productId, // product id
          v: item.variantId, // variant id
          n: item.product?.name || item.productName, // name
          q: item.quantity, // quantity
          pr: parseFloat(item.price), // price
          st: parseFloat(item.subtotal), // subtotal
          img: item.product?.images?.[0]?.thumbnailUrl || item.image // image
        }))
      };

      // Calculate size reduction
      const originalSize = JSON.stringify(cartData).length;
      const compressedSize = JSON.stringify(compressed).length;
      const reductionPercent = ((originalSize - compressedSize) / originalSize * 100).toFixed(2);

      this.logger.info('Cart data compressed', {
        originalSize,
        compressedSize,
        reductionPercent
      });

      return compressed;
    } catch (error) {
      this.logger.error('Error compressing cart data', {
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Record device info
   * @param {Object} deviceInfo - Device information
   * @returns {Promise<Object>} Created device info record
   */
  async recordDeviceInfo(deviceInfo) {
    try {
      const {
        userId,
        sessionId,
        deviceId,
        platform,
        deviceType,
        browser,
        networkType,
        networkSpeed,
        screenResolution
      } = deviceInfo;

      if (!deviceId) {
        throw new Error('deviceId is required');
      }

      // Record as an analytics event
      const analytics = await this.prisma.cartAnalyticsBd.create({
        data: {
          userId,
          sessionId,
          deviceId,
          platform,
          deviceType,
          browser,
          networkType,
          networkSpeed,
          screenResolution,
          action: 'view',
          metadata: {
            type: 'device_info',
            ...deviceInfo
          }
        }
      });

      this.logger.info('Device info recorded', {
        analyticsId: analytics.id,
        deviceId,
        platform
      });

      return analytics;
    } catch (error) {
      this.logger.error('Error recording device info', {
        error: error.message,
        deviceInfo
      });
      throw error;
    }
  }

  /**
   * Get device breakdown statistics
   * @returns {Promise<Object>} Device breakdown
   */
  async getDeviceBreakdown() {
    try {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const analytics = await this.prisma.cartAnalyticsBd.findMany({
        where: {
          createdAt: { gte: sevenDaysAgo }
        }
      });

      const platformBreakdown = analytics.reduce((acc, a) => {
        acc[a.platform] = (acc[a.platform] || 0) + 1;
        return acc;
      }, {});

      const deviceTypeBreakdown = analytics.reduce((acc, a) => {
        if (a.deviceType) {
          acc[a.deviceType] = (acc[a.deviceType] || 0) + 1;
        }
        return acc;
      }, {});

      const networkBreakdown = analytics.reduce((acc, a) => {
        if (a.networkType) {
          acc[a.networkType] = (acc[a.networkType] || 0) + 1;
        }
        return acc;
      }, {});

      return {
        platformBreakdown,
        deviceTypeBreakdown,
        networkBreakdown,
        totalEvents: analytics.length,
        period: {
          startDate: sevenDaysAgo.toISOString(),
          endDate: new Date().toISOString()
        }
      };
    } catch (error) {
      this.logger.error('Error getting device breakdown', {
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Get network breakdown statistics
   * @returns {Promise<Object>} Network breakdown
   */
  async getNetworkBreakdown() {
    try {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const analytics = await this.prisma.cartAnalyticsBd.findMany({
        where: {
          createdAt: { gte: sevenDaysAgo },
          networkType: { not: null }
        }
      });

      const networkTypeBreakdown = analytics.reduce((acc, a) => {
        acc[a.networkType] = (acc[a.networkType] || 0) + 1;
        return acc;
      }, {});

      const networkSpeedBreakdown = analytics.reduce((acc, a) => {
        if (a.networkSpeed) {
          acc[a.networkSpeed] = (acc[a.networkSpeed] || 0) + 1;
        }
        return acc;
      }, {});

      return {
        networkTypeBreakdown,
        networkSpeedBreakdown,
        totalEvents: analytics.length,
        period: {
          startDate: sevenDaysAgo.toISOString(),
          endDate: new Date().toISOString()
        }
      };
    } catch (error) {
      this.logger.error('Error getting network breakdown', {
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Cleanup old offline changes
   * @param {number} daysOld - Delete changes older than this many days
   * @returns {Promise<Object>} Cleanup result
   */
  async cleanupOldOfflineChanges(daysOld = 30) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);

      const deleted = await this.prisma.offlineCartChange.deleteMany({
        where: {
          createdAt: { lt: cutoffDate },
          isSynced: true
        }
      });

      this.logger.info('Old offline changes cleaned up', {
        daysOld,
        deletedCount: deleted.count
      });

      return {
        success: true,
        deletedCount: deleted.count
      };
    } catch (error) {
      this.logger.error('Error cleaning up old offline changes', {
        daysOld,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Cleanup old analytics data
   * @param {number} daysOld - Delete analytics older than this many days
   * @returns {Promise<Object>} Cleanup result
   */
  async cleanupOldAnalytics(daysOld = 90) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);

      const deleted = await this.prisma.cartAnalyticsBd.deleteMany({
        where: {
          createdAt: { lt: cutoffDate }
        }
      });

      this.logger.info('Old analytics cleaned up', {
        daysOld,
        deletedCount: deleted.count
      });

      return {
        success: true,
        deletedCount: deleted.count
      };
    } catch (error) {
      this.logger.error('Error cleaning up old analytics', {
        daysOld,
        error: error.message
      });
      throw error;
    }
  }
}

// Singleton instance
const mobileCartService = new MobileCartService();

module.exports = {
  MobileCartService,
  mobileCartService
};
