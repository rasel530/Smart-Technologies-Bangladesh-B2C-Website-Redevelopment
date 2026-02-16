/**
 * Inventory Reservation Service
 * 
 * Provides comprehensive inventory reservation tracking for admin operations including:
 * - Inventory impact analysis across all carts
 * - Reserved stock tracking per product
 * - Reservation management (release, confirm, cleanup)
 * - Dashboard data aggregation
 * - Audit logging for admin actions
 */

const { PrismaClient } = require('@prisma/client');
const { loggerService } = require('./logger');

// Reservation status constants
const RESERVATION_STATUS = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  RELEASED: 'released',
  EXPIRED: 'expired'
};

// Reservation expiry in minutes (default 30 minutes for cart expiration)
const RESERVATION_EXPIRY_MINUTES = parseInt(process.env.STOCK_RESERVATION_EXPIRY) || 30;

class InventoryReservationService {
  constructor() {
    this.prisma = new PrismaClient();
    this.logger = loggerService;
    this.cleanupInterval = null;
  }

  /**
   * Initialize the service and start cleanup interval
   */
  async initialize() {
    this.logger.info('Initializing InventoryReservationService');
    
    // Start background cleanup for expired reservations
    this.startCleanupInterval();
    
    // Initial cleanup
    await this.cleanupExpiredReservations();
  }

  /**
   * Stop cleanup interval on shutdown
   */
  shutdown() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
      this.logger.info('InventoryReservationService cleanup interval stopped');
    }
  }

  /**
   * Start periodic cleanup of expired reservations
   */
  startCleanupInterval() {
    if (this.cleanupInterval) {
      return;
    }

    // Run cleanup every 5 minutes
    const cleanupIntervalMs = 300000; // 5 minutes

    this.cleanupInterval = setInterval(async () => {
      try {
        await this.cleanupExpiredReservations();
      } catch (error) {
        this.logger.error('Error during reservation cleanup', { error: error.message });
      }
    }, cleanupIntervalMs);

    this.logger.info('InventoryReservationService cleanup interval started', {
      intervalMs: cleanupIntervalMs
    });
  }

  /**
   * Get inventory impact across all carts
   * Returns products with reserved stock from active carts
   * 
   * @param {Object} options - Filter options
   * @param {string} options.statusFilter - Filter by status: 'all', 'low', 'out', 'normal'
   * @param {boolean} options.lowStockOnly - Only show low stock products
   * @param {string} options.dateStart - Start date for filtering
   * @param {string} options.dateEnd - End date for filtering
   * @param {number} options.page - Page number
   * @param {number} options.limit - Items per page
   * @returns {Promise<Object>} Products with reserved stock info
   */
  async getInventoryImpact(options = {}) {
    try {
      const {
        statusFilter = 'all',
        lowStockOnly = false,
        dateStart,
        dateEnd,
        page = 1,
        limit = 50
      } = options;

      const skip = (parseInt(page) - 1) * parseInt(limit);
      const take = parseInt(limit);

      // Build where clause for reservations
      const reservationWhere = {
        status: { in: [RESERVATION_STATUS.PENDING, RESERVATION_STATUS.CONFIRMED] },
        expiresAt: { gt: new Date() } // Only active reservations
      };

      // Get products with active reservations
      const reservations = await this.prisma.productStockReservation.findMany({
        where: reservationWhere,
        include: {
          product: {
            select: {
              id: true,
              name: true,
              sku: true,
              stockQuantity: true,
              lowStockThreshold: true
            }
          },
          cart: {
            select: {
              id: true,
              userId: true,
              status: true,
              createdAt: true,
              user: {
                select: {
                  id: true,
                  email: true,
                  firstName: true,
                  lastName: true
                }
              }
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      }) || [];

      // Group reservations by product
      const productImpactMap = new Map();

      for (const reservation of reservations) {
        const productId = reservation.productId;
        
        if (!productImpactMap.has(productId)) {
          const product = reservation.product;
          const totalStock = product.stockQuantity || 0;
          const lowStockThreshold = product.lowStockThreshold || 10;
          const reservedStock = 0;
          const availableStock = Math.max(0, totalStock - reservedStock);

          productImpactMap.set(productId, {
            productId,
            productName: product.name,
            productSku: product.sku,
            totalStock,
            lowStockThreshold,
            reservedStock: 0,
            availableStock,
            status: availableStock === 0 ? 'out_of_stock' : 
                   availableStock <= lowStockThreshold ? 'low_stock' : 'normal',
            cartBreakdown: []
          });
        }

        const productData = productImpactMap.get(productId);
        productData.reservedStock += reservation.quantity;
        productData.availableStock = Math.max(0, productData.totalStock - productData.reservedStock);
        productData.status = productData.availableStock === 0 ? 'out_of_stock' :
                           productData.availableStock <= productData.lowStockThreshold ? 'low_stock' : 'normal';

        // Add cart breakdown
        productData.cartBreakdown.push({
          cartId: reservation.cartId,
          cartItemId: reservation.cartItemId,
          quantity: reservation.quantity,
          reservationStatus: reservation.status,
          createdAt: reservation.createdAt,
          expiresAt: reservation.expiresAt,
          cartStatus: reservation.cart.status,
          userEmail: reservation.cart.user?.email || null,
          userName: reservation.cart.user ? 
            `${reservation.cart.user.firstName || ''} ${reservation.cart.user.lastName || ''}`.trim() : 
            'Guest'
        });
      }

      // Apply filters
      let products = Array.from(productImpactMap.values());

      // Filter by status
      if (statusFilter === 'low') {
        products = products.filter(p => p.status === 'low_stock');
      } else if (statusFilter === 'out') {
        products = products.filter(p => p.status === 'out_of_stock');
      } else if (statusFilter === 'normal') {
        products = products.filter(p => p.status === 'normal');
      }

      // Filter by low stock only
      if (lowStockOnly) {
        products = products.filter(p => p.status === 'low_stock' || p.status === 'out_of_stock');
      }

      // Calculate totals
      const totalProducts = products.length;
      const lowStockCount = products.filter(p => p.status === 'low_stock').length;
      const outOfStockCount = products.filter(p => p.status === 'out_of_stock').length;
      const totalReservedQuantity = products.reduce((sum, p) => sum + p.reservedStock, 0);

      // Paginate
      const paginatedProducts = products.slice(skip, skip + take);
      const totalPages = Math.ceil(products.length / take);

      return {
        success: true,
        data: {
          products: paginatedProducts,
          summary: {
            totalProducts,
            lowStockCount,
            outOfStockCount,
            totalReservedQuantity,
            normalStockCount: totalProducts - lowStockCount - outOfStockCount
          },
          pagination: {
            page: parseInt(page),
            limit: take,
            total: products.length,
            pages: totalPages,
            hasNext: parseInt(page) < totalPages,
            hasPrev: parseInt(page) > 1
          }
        }
      };
    } catch (error) {
      this.logger.error('Error getting inventory impact', {
        error: error.message,
        stack: error.stack
      });
      throw error;
    }
  }

  /**
   * Get reserved stock for a specific product
   * 
   * @param {string} productId - Product ID
   * @param {string} variantId - Variant ID (optional)
   * @returns {Promise<Object>} Product reservations grouped by cart
   */
  async getProductReservedStock(productId, variantId = null) {
    try {
      const where = {
        productId,
        status: { in: [RESERVATION_STATUS.PENDING, RESERVATION_STATUS.CONFIRMED] },
        expiresAt: { gt: new Date() }
      };

      if (variantId) {
        where.variantId = variantId;
      }

      const reservations = await this.prisma.productStockReservation.findMany({
        where,
        include: {
          cart: {
            include: {
              user: {
                select: {
                  id: true,
                  email: true,
                  firstName: true,
                  lastName: true
                }
              }
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      });

      // Group by cart
      const cartBreakdownMap = new Map();
      let totalReserved = 0;

      for (const reservation of reservations) {
        const cartId = reservation.cartId;
        totalReserved += reservation.quantity;

        if (!cartBreakdownMap.has(cartId)) {
          cartBreakdownMap.set(cartId, {
            cartId,
            cartStatus: reservation.cart.status,
            user: reservation.cart.user ? {
              id: reservation.cart.user.id,
              email: reservation.cart.user.email,
              name: `${reservation.cart.user.firstName || ''} ${reservation.cart.user.lastName || ''}`.trim()
            } : { name: 'Guest' },
            items: [],
            totalReserved: 0
          });
        }

        const cartData = cartBreakdownMap.get(cartId);
        cartData.items.push({
          reservationId: reservation.id,
          cartItemId: reservation.cartItemId,
          quantity: reservation.quantity,
          status: reservation.status,
          createdAt: reservation.createdAt,
          expiresAt: reservation.expiresAt
        });
        cartData.totalReserved += reservation.quantity;
      }

      return {
        success: true,
        data: {
          productId,
          variantId,
          totalReservations: reservations.length,
          totalReserved,
          cartBreakdown: Array.from(cartBreakdownMap.values())
        }
      };
    } catch (error) {
      this.logger.error('Error getting product reserved stock', {
        productId,
        variantId,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Release stock reservation (manual admin action)
   * 
   * @param {string} reservationId - Reservation ID to release
   * @param {string} adminId - Admin performing the action
   * @param {string} reason - Reason for release
   * @returns {Promise<Object>} Release result
   */
  async releaseReservation(reservationId, adminId, reason = 'Manual release') {
    try {
      const reservation = await this.prisma.productStockReservation.findUnique({
        where: { id: reservationId }
      });

      if (!reservation) {
        return {
          success: false,
          error: 'Reservation not found'
        };
      }

      if (reservation.status === RESERVATION_STATUS.RELEASED || 
          reservation.status === RESERVATION_STATUS.EXPIRED) {
        return {
          success: false,
          error: `Cannot release reservation with status: ${reservation.status}`
        };
      }

      const previousStatus = reservation.status;

      // Update reservation status
      await this.prisma.productStockReservation.update({
        where: { id: reservationId },
        data: {
          status: RESERVATION_STATUS.RELEASED,
          releasedAt: new Date()
        }
      });

      // Create audit log entry
      await this.prisma.inventoryReservationAuditLog.create({
        data: {
          reservationId,
          action: 'RELEASED',
          adminId,
          reason,
          previousStatus,
          newStatus: RESERVATION_STATUS.RELEASED,
          quantity: reservation.quantity
        }
      });

      // Update product stock
      await this.updateProductAvailableStock(reservation.productId);

      this.logger.info('Stock reservation released by admin', {
        reservationId,
        productId: reservation.productId,
        quantity: reservation.quantity,
        adminId,
        reason
      });

      return {
        success: true,
        message: 'Reservation released successfully',
        data: {
          reservationId,
          productId: reservation.productId,
          quantity: reservation.quantity,
          adminId,
          reason
        }
      };
    } catch (error) {
      this.logger.error('Error releasing stock reservation', {
        reservationId,
        adminId,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Release all reservations for a cart
   * 
   * @param {string} cartId - Cart ID
   * @param {string} adminId - Admin performing the action
   * @param {string} reason - Reason for release
   * @returns {Promise<Object>} Release result
   */
  async releaseCartReservations(cartId, adminId, reason = 'Cart reservations released') {
    try {
      const now = new Date();

      // Find all active reservations for this cart
      const reservations = await this.prisma.productStockReservation.findMany({
        where: {
          cartId,
          status: { in: [RESERVATION_STATUS.PENDING, RESERVATION_STATUS.CONFIRMED] },
          expiresAt: { gt: now }
        }
      });

      if (reservations.length === 0) {
        return {
          success: true,
          message: 'No active reservations found for this cart',
          data: { releasedCount: 0 }
        };
      }

      // Update all reservations
      await this.prisma.productStockReservation.updateMany({
        where: {
          cartId,
          status: { in: [RESERVATION_STATUS.PENDING, RESERVATION_STATUS.CONFIRMED] },
          expiresAt: { gt: now }
        },
        data: {
          status: RESERVATION_STATUS.RELEASED,
          releasedAt: now
        }
      });

      // Create audit log entries
      const productIds = new Set();
      for (const reservation of reservations) {
        await this.prisma.inventoryReservationAuditLog.create({
          data: {
            reservationId: reservation.id,
            action: 'RELEASED',
            adminId,
            reason,
            previousStatus: reservation.status,
            newStatus: RESERVATION_STATUS.RELEASED,
            quantity: reservation.quantity
          }
        });
        productIds.add(reservation.productId);
      }

      // Update product stocks
      for (const productId of productIds) {
        await this.updateProductAvailableStock(productId);
      }

      this.logger.info('Cart reservations released by admin', {
        cartId,
        adminId,
        reservationsReleased: reservations.length,
        reason
      });

      return {
        success: true,
        message: `${reservations.length} reservations released successfully`,
        data: {
          cartId,
          releasedCount: reservations.length,
          adminId,
          reason
        }
      };
    } catch (error) {
      this.logger.error('Error releasing cart reservations', {
        cartId,
        adminId,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Confirm reservation (for checkout conversion)
   * 
   * @param {string} reservationId - Reservation ID
   * @returns {Promise<Object>} Confirm result
   */
  async confirmReservation(reservationId) {
    try {
      const reservation = await this.prisma.productStockReservation.findUnique({
        where: { id: reservationId }
      });

      if (!reservation) {
        return {
          success: false,
          error: 'Reservation not found'
        };
      }

      if (reservation.status !== RESERVATION_STATUS.PENDING) {
        return {
          success: false,
          error: `Cannot confirm reservation with status: ${reservation.status}`
        };
      }

      await this.prisma.productStockReservation.update({
        where: { id: reservationId },
        data: {
          status: RESERVATION_STATUS.CONFIRMED
        }
      });

      // Update product available stock (confirmed = committed, so reduce available)
      await this.updateProductAvailableStock(reservation.productId);

      return {
        success: true,
        message: 'Reservation confirmed successfully',
        data: { reservationId }
      };
    } catch (error) {
      this.logger.error('Error confirming reservation', {
        reservationId,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Cleanup expired reservations
   * Releases reserved stock from expired reservations
   * 
   * @returns {Promise<Object>} Cleanup result
   */
  async cleanupExpiredReservations() {
    try {
      const now = new Date();

      // Find expired reservations
      const expiredReservations = await this.prisma.productStockReservation.findMany({
        where: {
          status: RESERVATION_STATUS.PENDING,
          expiresAt: { lte: now }
        }
      });

      if (expiredReservations.length === 0) {
        return {
          success: true,
          message: 'No expired reservations found',
          data: { cleanedCount: 0 }
        };
      }

      // Update status to expired
      const result = await this.prisma.productStockReservation.updateMany({
        where: {
          status: RESERVATION_STATUS.PENDING,
          expiresAt: { lte: now }
        },
        data: {
          status: RESERVATION_STATUS.EXPIRED,
          releasedAt: now
        }
      });

      // Update product stocks for affected products
      const productIds = [...new Set(expiredReservations.map(r => r.productId))];
      for (const productId of productIds) {
        await this.updateProductAvailableStock(productId);
      }

      // Create audit log entries for expired reservations
      for (const reservation of expiredReservations) {
        await this.prisma.inventoryReservationAuditLog.create({
          data: {
            reservationId: reservation.id,
            action: 'EXPIRED',
            reason: 'Reservation expired',
            previousStatus: RESERVATION_STATUS.PENDING,
            newStatus: RESERVATION_STATUS.EXPIRED,
            quantity: reservation.quantity
          }
        });
      }

      this.logger.info('Expired reservations cleaned up', {
        cleanedCount: result.count,
        productsAffected: productIds.length
      });

      return {
        success: true,
        message: `${result.count} expired reservations cleaned up`,
        data: {
          cleanedCount: result.count,
          productsAffected: productIds.length
        }
      };
    } catch (error) {
      this.logger.error('Error cleaning up expired reservations', {
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Get inventory summary dashboard data
   * 
   * @returns {Promise<Object>} Dashboard summary data
   */
  async getInventoryDashboard() {
    try {
      const now = new Date();
      const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      // Get all products with their stock information
      const products = await this.prisma.product.findMany({
        select: {
          id: true,
          name: true,
          sku: true,
          stockQuantity: true,
          lowStockThreshold: true
        }
      });

      // Get active reservations
      const activeReservations = await this.prisma.productStockReservation.findMany({
        where: {
          status: { in: [RESERVATION_STATUS.PENDING, RESERVATION_STATUS.CONFIRMED] },
          expiresAt: { gt: now }
        }
      });

      // Calculate product stock status
      const productStockMap = new Map();
      for (const product of products) {
        const reservedStock = activeReservations
          .filter(r => r.productId === product.id)
          .reduce((sum, r) => sum + r.quantity, 0);
        
        const availableStock = Math.max(0, (product.stockQuantity || 0) - reservedStock);
        const lowStockThreshold = product.lowStockThreshold || 10;

        productStockMap.set(product.id, {
          productId: product.id,
          productName: product.name,
          productSku: product.sku,
          totalStock: product.stockQuantity || 0,
          reservedStock,
          availableStock,
          lowStockThreshold
        });
      }

      const productsData = Array.from(productStockMap.values());

      // Calculate summary stats
      const totalProducts = productsData.length;
      const productsWithLowStock = productsData.filter(p => 
        p.availableStock <= p.lowStockThreshold && p.availableStock > 0
      ).length;
      const productsOutOfStock = productsData.filter(p => p.availableStock === 0).length;
      const totalReservedStock = productsData.reduce((sum, p) => sum + p.reservedStock, 0);

      // Get at-risk products (expired reservations in last 24h)
      const recentlyExpired = await this.prisma.productStockReservation.count({
        where: {
          status: RESERVATION_STATUS.EXPIRED,
          expiredAt: { gte: oneDayAgo }
        }
      });

      // Get expired reservations count
      const expiredCount = await this.prisma.productStockReservation.count({
        where: {
          status: RESERVATION_STATUS.EXPIRED
        }
      });

      // Get recent reservation activity (last 24h)
      const recentActivity = await this.prisma.productStockReservation.findMany({
        where: {
          createdAt: { gte: oneDayAgo }
        },
        include: {
          product: {
            select: { name: true }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: 10
      });

      // Get products at risk (low available stock + high reservation)
      const atRiskProducts = productsData
        .filter(p => p.reservedStock > 0 && p.availableStock <= p.lowStockThreshold)
        .sort((a, b) => a.availableStock - b.availableStock)
        .slice(0, 10);

      return {
        success: true,
        data: {
          summary: {
            totalProducts,
            productsWithLowStock,
            productsOutOfStock,
            totalReservedStock,
            recentlyExpired,
            expiredReservationsCount: expiredCount,
            atRiskProductCount: atRiskProducts.length
          },
          stockDistribution: {
            inStock: productsData.filter(p => p.availableStock > p.lowStockThreshold).length,
            lowStock: productsWithLowStock,
            outOfStock: productsOutOfStock
          },
          atRiskProducts,
          recentActivity: recentActivity.map(r => ({
            reservationId: r.id,
            productName: r.product.name,
            quantity: r.quantity,
            status: r.status,
            createdAt: r.createdAt
          }))
        }
      };
    } catch (error) {
      this.logger.error('Error getting inventory dashboard', {
        error: error.message,
        stack: error.stack
      });
      throw error;
    }
  }

  /**
   * Update product available stock
   * 
   * @param {string} productId - Product ID
   */
  async updateProductAvailableStock(productId) {
    try {
      const product = await this.prisma.product.findUnique({
        where: { id: productId },
        select: { stockQuantity: true }
      });

      if (!product) return;

      // Calculate current reserved stock
      const reservedStock = await this.prisma.productStockReservation.aggregate({
        where: {
          productId,
          status: { in: [RESERVATION_STATUS.PENDING, RESERVATION_STATUS.CONFIRMED] },
          expiresAt: { gt: new Date() }
        },
        _sum: { quantity: true }
      });

      const totalStock = product.stockQuantity || 0;
      const reserved = reservedStock._sum.quantity || 0;
      const available = Math.max(0, totalStock - reserved);

      // Update or create ProductStock record
      await this.prisma.productStock.upsert({
        where: { productId },
        update: {
          totalStock,
          reservedStock: reserved,
          availableStock: available,
          updatedAt: new Date()
        },
        create: {
          productId,
          totalStock,
          reservedStock: reserved,
          availableStock: available
        }
      });
    } catch (error) {
      this.logger.error('Error updating product available stock', {
        productId,
        error: error.message
      });
    }
  }

  /**
   * Create a new stock reservation
   * 
   * @param {Object} data - Reservation data
   * @returns {Promise<Object>} Created reservation
   */
  async createReservation(data) {
    try {
      const { productId, variantId, cartId, cartItemId, quantity } = data;

      const expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() + RESERVATION_EXPIRY_MINUTES);

      const reservation = await this.prisma.productStockReservation.create({
        data: {
          productId,
          variantId,
          cartId,
          cartItemId,
          quantity,
          status: RESERVATION_STATUS.PENDING,
          expiresAt
        }
      });

      // Update product stock
      await this.updateProductAvailableStock(productId);

      return {
        success: true,
        data: reservation
      };
    } catch (error) {
      this.logger.error('Error creating reservation', {
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Export inventory impact to CSV
   * 
   * @returns {Promise<string>} CSV content
   */
  async exportInventoryImpact() {
    try {
      const result = await this.getInventoryImpact({ limit: 10000 });
      const products = result.data.products;

      const headers = [
        'Product ID',
        'Product Name',
        'SKU',
        'Total Stock',
        'Reserved Stock',
        'Available Stock',
        'Status',
        'Carts Reserved',
        'Cart Details'
      ];

      const rows = products.map(p => [
        p.productId,
        p.productName,
        p.productSku,
        p.totalStock,
        p.reservedStock,
        p.availableStock,
        p.status,
        p.cartBreakdown.length,
        p.cartBreakdown.map(c => 
          `Cart: ${c.cartId}, Qty: ${c.quantity}, User: ${c.userName}`
        ).join('; ')
      ]);

      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      ].join('\n');

      return {
        success: true,
        data: csvContent,
        filename: `inventory_impact_${new Date().toISOString().split('T')[0]}.csv`
      };
    } catch (error) {
      this.logger.error('Error exporting inventory impact', {
        error: error.message
      });
      throw error;
    }
  }
}

// Singleton instance
const inventoryReservationService = new InventoryReservationService();

module.exports = {
  InventoryReservationService,
  inventoryReservationService,
  RESERVATION_STATUS
};
