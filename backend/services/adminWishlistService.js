const { PrismaClient } = require('@prisma/client');
const { loggerService } = require('./logger');

/**
 * Admin Wishlist Service
 * 
 * Business logic layer for admin wishlist management including:
 * - Wishlist statistics and analytics
 * - User wishlist management
 * - Product wishlist analytics
 * - Wishlist moderation
 * - Wishlist settings management
 */
class AdminWishlistService {
  constructor() {
    this.prisma = new PrismaClient();
    this.logger = loggerService;
  }

  /**
   * Get wishlist statistics
   * @param {Date} startDate - Start date for filtering
   * @param {Date} endDate - End date for filtering
   * @returns {Promise<Object>} Wishlist statistics
   */
  async getStatistics(startDate = null, endDate = null) {
    try {
      const dateFilter = {};
      if (startDate || endDate) {
        dateFilter.createdAt = {};
        if (startDate) {
          dateFilter.createdAt.gte = startDate;
        }
        if (endDate) {
          dateFilter.createdAt.lte = endDate;
        }
      }

      // Total wishlists
      const totalWishlists = await this.prisma.wishlist.count({
        where: dateFilter
      });

      // Total wishlist items
      const totalItems = await this.prisma.wishlistItem.count();

      // Average items per wishlist
      const averageItemsPerWishlist = totalWishlists > 0 
        ? totalItems / totalWishlists 
        : 0;

      // Public wishlists count
      const publicWishlists = await this.prisma.wishlist.count({
        where: {
          ...dateFilter,
          isPublic: true
        }
      });

      // Shared wishlists count (wishlists with shareToken)
      const sharedWishlists = await this.prisma.wishlist.count({
        where: {
          ...dateFilter,
          shareToken: {
            not: null
          }
        }
      });

      // Get top 10 most wishlisted products
      const topProducts = await this.prisma.wishlistItem.groupBy({
        by: ['productId'],
        _count: {
          productId: true
        },
        orderBy: {
          _count: {
            productId: 'desc'
          }
        },
        take: 10
      });

      // Fetch product details for top products
      const topProductsWithDetails = await Promise.all(
        topProducts.map(async (item) => {
          const product = await this.prisma.product.findUnique({
            where: { id: item.productId },
            select: {
              id: true,
              name: true,
              sku: true,
              regularPrice: true,
              salePrice: true,
              images: {
                where: { displayOrder: 0 },
                take: 1,
                select: {
                  originalUrl: true,
                  thumbnailUrl: true
                }
              }
            }
          });
          return {
            ...product,
            wishlistCount: item._count.productId
          };
        })
      );

      // Calculate conversion rate (items moved to cart / total items)
      const moveEvents = await this.prisma.wishlistAnalytics.count({
        where: {
          eventType: 'move_to_cart'
        }
      });
      const conversionRate = totalItems > 0 ? moveEvents / totalItems : 0;

      // Wishlist creation trend (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const creationTrend = await this.prisma.wishlist.groupBy({
        by: ['createdAt'],
        where: {
          createdAt: {
            gte: thirtyDaysAgo
          }
        },
        _count: {
          id: true
        },
        orderBy: {
          createdAt: 'asc'
        }
      });

      // Group by day
      const trendByDay = {};
      creationTrend.forEach((item) => {
        const dateKey = item.createdAt.toISOString().split('T')[0];
        trendByDay[dateKey] = (trendByDay[dateKey] || 0) + item._count.id;
      });

      this.logger.info('Admin wishlist statistics retrieved', { startDate, endDate });
      return {
        totalWishlists,
        totalItems,
        averageItemsPerWishlist: Math.round(averageItemsPerWishlist * 100) / 100,
        publicWishlists,
        sharedWishlists,
        conversionRate: Math.round(conversionRate * 100) / 100,
        topProducts: topProductsWithDetails.filter(p => p !== null),
        creationTrend: Object.entries(trendByDay).map(([date, count]) => ({
          date,
          count
        }))
      };
    } catch (error) {
      this.logger.error('Error fetching admin wishlist statistics', { startDate, endDate, error: error.message });
      throw error;
    }
  }

  /**
   * Get all wishlists with pagination and filters
   * @param {Object} options - Query options
   * @returns {Promise<Object>} Paginated wishlists
   */
  async getAllWishlists(options = {}) {
    try {
      const {
        page = 1,
        limit = 10,
        sortBy = 'createdAt',
        sortOrder = 'desc',
        search = null,
        isPublic = null,
        userId = null
      } = options;

      const skip = (page - 1) * limit;

      const where = {};
      if (search) {
        where.OR = [
          { name: { contains: search, mode: 'insensitive' } }
        ];
      }
      if (isPublic !== null) {
        where.isPublic = isPublic;
      }
      if (userId) {
        where.userId = userId;
      }

      const wishlists = await this.prisma.wishlist.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true
            }
          },
          _count: {
            select: { items: true }
          }
        },
        orderBy: {
          [sortBy]: sortOrder
        },
        skip,
        take: limit
      });

      const total = await this.prisma.wishlist.count({ where });

      return {
        wishlists,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      this.logger.error('Error fetching all wishlists', { options, error: error.message });
      throw error;
    }
  }

  /**
   * Get user wishlists
   * @param {string} userId - User ID
   * @returns {Promise<Object>} User wishlist data
   */
  async getUserWishlists(userId) {
    try {
      // Get user details
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          role: true
        }
      });

      if (!user) {
        throw new Error('User not found');
      }

      // Get user's wishlists
      const wishlists = await this.prisma.wishlist.findMany({
        where: { userId },
        include: {
          _count: {
            select: { items: true }
          }
        },
        orderBy: { createdAt: 'desc' }
      });

      // Get total items across all wishlists
      const totalItems = await this.prisma.wishlistItem.count({
        where: {
          wishlist: {
            userId
          }
        }
      });

      // Get last activity (most recent wishlist update)
      const lastActivity = await this.prisma.wishlist.findFirst({
        where: { userId },
        orderBy: { updatedAt: 'desc' },
        select: { updatedAt: true }
      });

      return {
        user,
        wishlists,
        totalItems,
        lastActivity: lastActivity?.updatedAt || null
      };
    } catch (error) {
      this.logger.error('Error fetching user wishlists', { userId, error: error.message });
      throw error;
    }
  }

  /**
   * Delete user wishlist (admin override)
   * @param {string} wishlistId - Wishlist ID
   * @returns {Promise<Object>} Deletion result
   */
  async deleteWishlist(wishlistId) {
    try {
      const wishlist = await this.prisma.wishlist.findUnique({
        where: { id: wishlistId }
      });

      if (!wishlist) {
        throw new Error('Wishlist not found');
      }

      await this.prisma.wishlist.delete({
        where: { id: wishlistId }
      });

      this.logger.info('Admin deleted wishlist', { wishlistId });
      return { success: true };
    } catch (error) {
      this.logger.error('Error deleting wishlist', { wishlistId, error: error.message });
      throw error;
    }
  }

  /**
   * Get detailed wishlist analytics
   * @param {Date} startDate - Start date
   * @param {Date} endDate - End date
   * @param {string} groupBy - Group by period (day, week, month)
   * @returns {Promise<Object>} Analytics data
   */
  async getAnalytics(startDate = null, endDate = null, groupBy = 'day') {
    try {
      const dateFilter = {};
      if (startDate || endDate) {
        dateFilter.createdAt = {};
        if (startDate) {
          dateFilter.createdAt.gte = startDate;
        }
        if (endDate) {
          dateFilter.createdAt.lte = endDate;
        }
      }

      // Get analytics events
      const events = await this.prisma.wishlistAnalytics.findMany({
        where: dateFilter,
        orderBy: { createdAt: 'desc' }
      });

      // Aggregate events by type
      const eventCounts = events.reduce((acc, event) => {
        acc[event.eventType] = (acc[event.eventType] || 0) + 1;
        return acc;
      }, {});

      // Wishlist creation rate
      const creationEvents = events.filter(e => e.eventType === 'create').length;
      const creationRate = creationEvents;

      // Average wishlist size
      const wishlistSizes = await this.prisma.wishlist.findMany({
        include: {
          _count: {
            select: { items: true }
          }
        }
      });
      const avgWishlistSize = wishlistSizes.length > 0
        ? wishlistSizes.reduce((sum, w) => sum + w._count.items, 0) / wishlistSizes.length
        : 0;

      // Wishlist abandonment rate (wishlists with no activity in 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const abandonedWishlists = await this.prisma.wishlist.count({
        where: {
          updatedAt: {
            lt: thirtyDaysAgo
          }
        }
      });
      const totalWishlists = await this.prisma.wishlist.count();
      const abandonmentRate = totalWishlists > 0 ? abandonedWishlists / totalWishlists : 0;

      // Sharing statistics
      const shareEvents = events.filter(e => e.eventType === 'share').length;
      const exportEvents = events.filter(e => e.eventType === 'export').length;

      // Group creation trend by period
      const creationTrend = await this.prisma.wishlist.findMany({
        where: dateFilter,
        select: {
          createdAt: true
        },
        orderBy: { createdAt: 'asc' }
      });

      const groupedTrend = {};
      creationTrend.forEach((item) => {
        let key;
        const date = new Date(item.createdAt);
        if (groupBy === 'day') {
          key = date.toISOString().split('T')[0];
        } else if (groupBy === 'week') {
          const weekStart = new Date(date);
          weekStart.setDate(date.getDate() - date.getDay());
          key = weekStart.toISOString().split('T')[0];
        } else {
          key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        }
        groupedTrend[key] = (groupedTrend[key] || 0) + 1;
      });

      this.logger.info('Admin wishlist analytics retrieved', { startDate, endDate, groupBy });
      return {
        creationRate,
        averageWishlistSize: Math.round(avgWishlistSize * 100) / 100,
        abandonmentRate: Math.round(abandonmentRate * 100) / 100,
        // Use remove_item event type with movedToCart metadata for conversion calculation
        conversionRate: (eventCounts.remove_item || 0) / (eventCounts.create || 1),
        sharingStats: {
          totalShares: shareEvents,
          totalExports: exportEvents
        },
        eventCounts,
        creationTrend: Object.entries(groupedTrend).map(([date, count]) => ({
          date,
          count
        }))
      };
    } catch (error) {
      this.logger.error('Error fetching wishlist analytics', { startDate, endDate, groupBy, error: error.message });
      throw error;
    }
  }

  /**
   * Get product wishlist analytics
   * @param {Object} options - Query options
   * @returns {Promise<Object>} Product wishlist data
   */
  async getProductAnalytics(options = {}) {
    try {
      const {
        page = 1,
        limit = 10,
        sortBy = 'wishlistCount',
        sortOrder = 'desc',
        categoryId = null,
        minPrice = null,
        maxPrice = null
      } = options;

      const skip = (page - 1) * limit;

      // Build where clause for product filtering at database level
      const productWhere = {};
      if (categoryId) {
        productWhere.categoryId = categoryId;
      }
      if (minPrice || maxPrice) {
        productWhere.OR = [];
        if (minPrice !== null) {
          productWhere.OR.push({ salePrice: { gte: minPrice } });
          productWhere.OR.push({ 
            salePrice: null, 
            regularPrice: { gte: minPrice } 
          });
        }
        if (maxPrice !== null) {
          productWhere.OR.push({ salePrice: { lte: maxPrice } });
          productWhere.OR.push({ 
            salePrice: null, 
            regularPrice: { lte: maxPrice } 
          });
        }
      }

      // Get products with wishlist counts, filtered at database level
      const productsWithCounts = await this.prisma.wishlistItem.groupBy({
        by: ['productId'],
        _count: {
          productId: true
        },
        where: productWhere.categoryId || productWhere.OR ? {
          product: productWhere
        } : undefined,
        orderBy: {
          _count: {
            productId: sortOrder
          }
        }
      });

      // Fetch product details with pagination
      const paginatedProductIds = productsWithCounts
        .slice(skip, skip + limit)
        .map(item => item.productId);

      const products = await Promise.all(
        paginatedProductIds.map(async (productId) => {
          const product = await this.prisma.product.findUnique({
            where: { id: productId },
            select: {
              id: true,
              name: true,
              sku: true,
              regularPrice: true,
              salePrice: true,
              categoryId: true,
              images: {
                where: { displayOrder: 0 },
                take: 1,
                select: {
                  originalUrl: true,
                  thumbnailUrl: true
                }
              }
            }
          });

          if (!product) return null;

          // Get last added date
          const lastAdded = await this.prisma.wishlistItem.findFirst({
            where: { productId },
            orderBy: { addedAt: 'desc' },
            select: { addedAt: true }
          });

          const wishlistCount = productsWithCounts.find(p => p.productId === productId)?._count.productId || 0;

          return {
            ...product,
            wishlistCount,
            lastAdded: lastAdded?.addedAt || null
          };
        })
      );

      const filteredProducts = products.filter(p => p !== null);

      // Sort by specified field if needed
      if (sortBy !== 'wishlistCount') {
        filteredProducts.sort((a, b) => {
          const aVal = a[sortBy];
          const bVal = b[sortBy];
          return sortOrder === 'asc' ? aVal - bVal : bVal - aVal;
        });
      }

      return {
        products: filteredProducts,
        pagination: {
          page,
          limit,
          total: productsWithCounts.length,
          totalPages: Math.ceil(productsWithCounts.length / limit)
        }
      };
    } catch (error) {
      this.logger.error('Error fetching product wishlist analytics', { options, error: error.message });
      throw error;
    }
  }

  /**
   * Get wishlist settings
   * @returns {Promise<Object>} Wishlist settings
   */
  async getSettings() {
    try {
      // TODO: Implement proper settings persistence
      // This is a placeholder implementation. In production, create a settings table
      // (e.g., wishlist_settings) to store these values persistently in the database.
      // The settings table should have columns: key, value, description, updatedAt
      // For now, return default settings
      return {
        maxWishlistsPerUser: 10,
        maxItemsPerWishlist: 100,
        defaultPrivacy: 'private',
        shareTokenExpirationDays: 30,
        enableSharing: true,
        enableExport: true,
        analyticsRetentionDays: 90
      };
    } catch (error) {
      this.logger.error('Error fetching wishlist settings', { error: error.message });
      throw error;
    }
  }

  /**
   * Update wishlist settings
   * @param {Object} settings - Settings to update
   * @returns {Promise<Object>} Updated settings
   */
  async updateSettings(settings) {
    try {
      // TODO: Implement proper settings persistence
      // This is a placeholder implementation. In production, create a settings table
      // (e.g., wishlist_settings) to store these values persistently in the database.
      // The settings table should have columns: key, value, description, updatedAt
      // For now, return the settings as if updated
      const updatedSettings = {
        maxWishlistsPerUser: settings.maxWishlistsPerUser ?? 10,
        maxItemsPerWishlist: settings.maxItemsPerWishlist ?? 100,
        defaultPrivacy: settings.defaultPrivacy ?? 'private',
        shareTokenExpirationDays: settings.shareTokenExpirationDays ?? 30,
        enableSharing: settings.enableSharing ?? true,
        enableExport: settings.enableExport ?? true,
        analyticsRetentionDays: settings.analyticsRetentionDays ?? 90
      };

      this.logger.info('Admin updated wishlist settings', { settings: updatedSettings });
      return updatedSettings;
    } catch (error) {
      this.logger.error('Error updating wishlist settings', { settings, error: error.message });
      throw error;
    }
  }

  /**
   * Get moderation queue (flagged wishlists)
   * @param {Object} options - Query options
   * @returns {Promise<Object>} Moderation queue
   */
  async getModerationQueue(options = {}) {
    try {
      const {
        page = 1,
        limit = 10,
        status = 'pending'
      } = options;

      const skip = (page - 1) * limit;

      // TODO: Implement moderation queue functionality
      // This feature is not implemented yet. To implement:
      // 1. Create a flagged_wishlists table with columns: id, wishlistId, flagReason, status, flaggedBy, reviewedBy, reviewedAt, createdAt
      // 2. Add logic to flag wishlists based on content, user reports, or automated rules
      // 3. Implement approve/reject functionality with proper status updates
      // For now, return empty array as no moderation system exists yet
      const flaggedWishlists = [];

      return {
        wishlists: flaggedWishlists,
        pagination: {
          page,
          limit,
          total: 0,
          totalPages: 0
        }
      };
    } catch (error) {
      this.logger.error('Error fetching moderation queue', { options, error: error.message });
      throw error;
    }
  }

  /**
   * Approve wishlist in moderation
   * @param {string} wishlistId - Wishlist ID
   * @returns {Promise<Object>} Approval result
   */
  async approveWishlist(wishlistId) {
    try {
      // In a real implementation, this would update the moderation status
      this.logger.info('Admin approved wishlist', { wishlistId });
      return { success: true };
    } catch (error) {
      this.logger.error('Error approving wishlist', { wishlistId, error: error.message });
      throw error;
    }
  }

  /**
   * Reject wishlist in moderation
   * @param {string} wishlistId - Wishlist ID
   * @param {string} reason - Rejection reason
   * @returns {Promise<Object>} Rejection result
   */
  async rejectWishlist(wishlistId, reason) {
    try {
      // In a real implementation, this would update the moderation status
      this.logger.info('Admin rejected wishlist', { wishlistId, reason });
      return { success: true };
    } catch (error) {
      this.logger.error('Error rejecting wishlist', { wishlistId, reason, error: error.message });
      throw error;
    }
  }

  /**
   * Get users with wishlist activity
   * @param {Object} options - Query options
   * @returns {Promise<Object>} Users with wishlist data
   */
  async getUsersWithWishlists(options = {}) {
    try {
      const {
        page = 1,
        limit = 10,
        search = null
      } = options;

      const skip = (page - 1) * limit;

      const where = {};
      if (search) {
        where.OR = [
          { firstName: { contains: search, mode: 'insensitive' } },
          { lastName: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } }
        ];
      }

      // Get users who have wishlists
      const users = await this.prisma.user.findMany({
        where: {
          ...where,
          wishlists: {
            some: {}
          }
        },
        include: {
          _count: {
            select: { wishlists: true }
          }
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' }
      });

      // Get wishlist details for each user
      const usersWithDetails = await Promise.all(
        users.map(async (user) => {
          const totalItems = await this.prisma.wishlistItem.count({
            where: {
              wishlist: {
                userId: user.id
              }
            }
          });

          const lastActivity = await this.prisma.wishlist.findFirst({
            where: { userId: user.id },
            orderBy: { updatedAt: 'desc' },
            select: { updatedAt: true }
          });

          return {
            ...user,
            totalItems,
            lastActivity: lastActivity?.updatedAt || null
          };
        })
      );

      const total = await this.prisma.user.count({
        where: {
          ...where,
          wishlists: {
            some: {}
          }
        }
      });

      return {
        users: usersWithDetails,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      this.logger.error('Error fetching users with wishlists', { options, error: error.message });
      throw error;
    }
  }
}

// Singleton instance
const adminWishlistService = new AdminWishlistService();

module.exports = {
  AdminWishlistService,
  adminWishlistService
};
