/**
 * Stock Validation Service
 * 
 * Provides comprehensive stock validation for cart operations including:
 * - Stock availability checking with reservation
 * - Stock reservation system with expiration
 * - Backorder handling
 * - Concurrent request handling with ETag support
 * - Reservation cleanup for expired carts
 */

const { PrismaClient } = require('@prisma/client');
const { redisConnectionPool } = require('./redisConnectionPool');
const { loggerService } = require('./logger');

// Backorder configuration
const BACKORDER_CONFIG = {
  // Enable or disable backorders
  ENABLED: process.env.BACKORDER_ENABLED === 'true' || false,
  // Maximum quantity that can be backordered per product
  MAX_BACKORDER_QUANTITY: parseInt(process.env.BACKORDER_MAX_QUANTITY) || 10,
  // Default reservation expiry in minutes (for abandoned carts)
  RESERVATION_EXPIRY_MINUTES: parseInt(process.env.STOCK_RESERVATION_EXPIRY) || 30,
  // Cleanup interval for expired reservations (in seconds)
  CLEANUP_INTERVAL: parseInt(process.env.RESERVATION_CLEANUP_INTERVAL) || 300,
};

// Stock reservation status enum
const RESERVATION_STATUS = {
  ACTIVE: 'active',
  EXPIRED: 'expired',
  COMMITTED: 'committed',
  RELEASED: 'released',
};

class StockValidationService {
  constructor() {
    this.prisma = new PrismaClient();
    this.redis = redisConnectionPool.getClient('stockValidation');
    this.logger = loggerService;
    this.cleanupInterval = null;
  }

  /**
   * Initialize the service and start cleanup interval
   */
  async initialize() {
    this.logger.info('Initializing StockValidationService');
    
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
      this.logger.info('StockValidationService cleanup interval stopped');
    }
  }

  /**
   * Start periodic cleanup of expired reservations
   */
  startCleanupInterval() {
    if (this.cleanupInterval) {
      return;
    }

    this.cleanupInterval = setInterval(async () => {
      try {
        await this.cleanupExpiredReservations();
      } catch (error) {
        this.logger.error('Error during reservation cleanup', { error: error.message });
      }
    }, BACKORDER_CONFIG.CLEANUP_INTERVAL * 1000);

    this.logger.info('StockValidationService cleanup interval started', {
      interval: BACKORDER_CONFIG.CLEANUP_INTERVAL
    });
  }

  /**
   * Check stock availability for a product/variant
   * Returns detailed availability information
   * 
   * @param {string} productId - Product ID
   * @param {string} variantId - Variant ID (optional)
   * @param {number} quantity - Requested quantity
   * @param {string} cartId - Cart ID for reservation tracking
   * @returns {Promise<Object>} Availability details
   */
  async checkStockAvailability(productId, variantId = null, quantity = 1, cartId = null) {
    try {
      // Get product/variant with current stock
      let stockData;
      let stockField;
      
      if (variantId) {
        stockData = await this.prisma.productVariant.findUnique({
          where: { id: variantId },
          select: {
            id: true,
            stock: true,
            name: true,
            product: {
              select: { id: true, name: true, status: true }
            }
          }
        });
        stockField = 'variant';
      } else {
        stockData = await this.prisma.product.findUnique({
          where: { id: productId },
          select: {
            id: true,
            stockQuantity: true,
            name: true,
            status: true
          }
        });
        stockField = 'product';
      }

      if (!stockData) {
        return {
          available: false,
          currentStock: 0,
          reserved: 0,
          availableForSale: 0,
          backorderAllowed: false,
          error: 'Product not found'
        };
      }

      if (stockData.product?.status !== 'active' && stockField === 'variant') {
        return {
          available: false,
          currentStock: stockData.stock,
          reserved: 0,
          availableForSale: 0,
          backorderAllowed: false,
          error: 'Product is not available'
        };
      }

      if (stockData.status !== 'active' && stockField === 'product') {
        return {
          available: false,
          currentStock: stockData.stockQuantity,
          reserved: 0,
          availableForSale: 0,
          backorderAllowed: false,
          error: 'Product is not available'
        };
      }

      // Calculate current stock based on field
      // allowBackorder field doesn't exist in Prisma schema - default to false
      const currentStock = stockField === 'variant' ? stockData.stock : stockData.stockQuantity;
      const allowBackorder = false;

      // Calculate reserved stock from active reservations
      const reservedStock = await this.getReservedStock(productId, variantId);
      const availableForSale = Math.max(0, currentStock - reservedStock);

      // Check if quantity is available
      const canFulfill = availableForSale >= quantity;
      // Backorder is disabled since allowBackorder field doesn't exist in schema
      const canBackorder = false;

      // Determine backorder quantity if applicable
      let backorderQuantity = 0;
      if (!canFulfill && canBackorder) {
        backorderQuantity = quantity - availableForSale;
      }

      return {
        available: canFulfill || canBackorder,
        currentStock,
        reserved: reservedStock,
        availableForSale,
        requestedQuantity: quantity,
        backorderAllowed: allowBackorder,
        backorderQuantity: canBackorder ? backorderQuantity : 0,
        canBackorder,
        productName: stockField === 'variant' ? stockData.product?.name : stockData.name,
        variantName: stockField === 'variant' ? stockData.name : null,
        error: !canFulfill && !canBackorder 
          ? `Insufficient stock. Available: ${availableForSale}, Requested: ${quantity}`
          : null
      };
    } catch (error) {
      this.logger.error('Error checking stock availability', {
        productId,
        variantId,
        quantity,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Get total reserved stock for a product/variant
   * 
   * @param {string} productId - Product ID
   * @param {string} variantId - Variant ID (optional)
   * @returns {Promise<number>} Reserved stock quantity
   */
  async getReservedStock(productId, variantId = null) {
    try {
      const now = new Date();
      
      // Get sum of active reservations
      const result = await this.prisma.stockReservation.aggregate({
        where: {
          productId,
          variantId: variantId || null,
          status: RESERVATION_STATUS.ACTIVE,
          expiresAt: { gt: now }
        },
        _sum: {
          quantity: true
        }
      });

      return result._sum.quantity || 0;
    } catch (error) {
      this.logger.error('Error getting reserved stock', {
        productId,
        variantId,
        error: error.message
      });
      return 0; // Return 0 on error to allow operations to continue
    }
  }

  /**
   * Reserve stock for a cart item
   * Creates a reservation that expires after a set time
   * 
   * @param {string} productId - Product ID
   * @param {string} variantId - Variant ID (optional)
   * @param {number} quantity - Quantity to reserve
   * @param {string} cartId - Cart ID for reference
   * @returns {Promise<Object>} Reservation details
   */
  async reserveStock(productId, variantId = null, quantity, cartId) {
    try {
      // Check availability first
      const availability = await this.checkStockAvailability(productId, variantId, quantity, cartId);
      
      if (!availability.available) {
        return {
          success: false,
          error: availability.error,
          reservationId: null
        };
      }

      // Calculate expiry time
      const expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() + BACKORDER_CONFIG.RESERVATION_EXPIRY_MINUTES);

      // Create reservation
      const reservation = await this.prisma.stockReservation.create({
        data: {
          productId,
          variantId: variantId || null,
          cartId,
          quantity,
          status: RESERVATION_STATUS.ACTIVE,
          expiresAt
        }
      });

      this.logger.info('Stock reserved', {
        reservationId: reservation.id,
        productId,
        variantId,
        quantity,
        cartId,
        expiresAt
      });

      return {
        success: true,
        reservationId: reservation.id,
        expiresAt,
        message: 'Stock reserved successfully'
      };
    } catch (error) {
      this.logger.error('Error reserving stock', {
        productId,
        variantId,
        quantity,
        cartId,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Release a stock reservation
   * 
   * @param {string} reservationId - Reservation ID to release
   * @returns {Promise<Object>} Release result
   */
  async releaseStock(reservationId) {
    try {
      const reservation = await this.prisma.stockReservation.findUnique({
        where: { id: reservationId }
      });

      if (!reservation) {
        return {
          success: false,
          error: 'Reservation not found'
        };
      }

      if (reservation.status !== RESERVATION_STATUS.ACTIVE) {
        return {
          success: false,
          error: `Cannot release reservation with status: ${reservation.status}`
        };
      }

      await this.prisma.stockReservation.update({
        where: { id: reservationId },
        data: {
          status: RESERVATION_STATUS.RELEASED,
          releasedAt: new Date()
        }
      });

      this.logger.info('Stock reservation released', {
        reservationId,
        productId: reservation.productId,
        variantId: reservation.variantId,
        quantity: reservation.quantity
      });

      return {
        success: true,
        message: 'Reservation released successfully'
      };
    } catch (error) {
      this.logger.error('Error releasing stock reservation', {
        reservationId,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Release all reservations for a cart
   * 
   * @param {string} cartId - Cart ID
   * @returns {Promise<Object>} Release result
   */
  async releaseCartReservations(cartId) {
    try {
      const now = new Date();
      
      // Release all active reservations for the cart
      const result = await this.prisma.stockReservation.updateMany({
        where: {
          cartId,
          status: RESERVATION_STATUS.ACTIVE,
          expiresAt: { gt: now }
        },
        data: {
          status: RESERVATION_STATUS.RELEASED,
          releasedAt: now
        }
      });

      this.logger.info('Cart reservations released', {
        cartId,
        reservationsReleased: result.count
      });

      return {
        success: true,
        releasedCount: result.count
      };
    } catch (error) {
      this.logger.error('Error releasing cart reservations', {
        cartId,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Commit stock reservation (called during checkout)
   * Converts reservation to committed stock
   * 
   * @param {string} reservationId - Reservation ID
   * @returns {Promise<Object>} Commit result
   */
  async commitStock(reservationId) {
    try {
      const reservation = await this.prisma.stockReservation.findUnique({
        where: { id: reservationId }
      });

      if (!reservation) {
        return {
          success: false,
          error: 'Reservation not found'
        };
      }

      await this.prisma.stockReservation.update({
        where: { id: reservationId },
        data: {
          status: RESERVATION_STATUS.COMMITTED,
          committedAt: new Date()
        }
      });

      this.logger.info('Stock reservation committed', {
        reservationId,
        productId: reservation.productId,
        variantId: reservation.variantId,
        quantity: reservation.quantity
      });

      return {
        success: true,
        message: 'Reservation committed successfully'
      };
    } catch (error) {
      this.logger.error('Error committing stock reservation', {
        reservationId,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Extend reservation expiry (called when cart activity is detected)
   * 
   * @param {string} reservationId - Reservation ID
   * @param {number} additionalMinutes - Additional minutes to extend
   * @returns {Promise<Object>} Extend result
   */
  async extendReservation(reservationId, additionalMinutes = null) {
    try {
      const minutes = additionalMinutes || BACKORDER_CONFIG.RESERVATION_EXPIRY_MINUTES;
      const newExpiry = new Date();
      newExpiry.setMinutes(newExpiry.getMinutes() + minutes);

      await this.prisma.stockReservation.update({
        where: { id: reservationId },
        data: {
          expiresAt: newExpiry
        }
      });

      this.logger.info('Reservation extended', {
        reservationId,
        newExpiry
      });

      return {
        success: true,
        newExpiry
      };
    } catch (error) {
      this.logger.error('Error extending reservation', {
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
      const expiredReservations = await this.prisma.stockReservation.findMany({
        where: {
          status: RESERVATION_STATUS.ACTIVE,
          expiresAt: { lte: now }
        }
      });

      // Update status to expired
      const result = await this.prisma.stockReservation.updateMany({
        where: {
          status: RESERVATION_STATUS.ACTIVE,
          expiresAt: { lte: now }
        },
        data: {
          status: RESERVATION_STATUS.EXPIRED,
          expiredAt: now
        }
      });

      if (expiredReservations.length > 0) {
        this.logger.info('Expired reservations cleaned up', {
          count: expiredReservations.length,
          products: [...new Set(expiredReservations.map(r => r.productId))]
        });
      }

      return {
        success: true,
        cleanedCount: result.count,
        expiredAt: now
      };
    } catch (error) {
      this.logger.error('Error cleaning up expired reservations', {
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Validate cart stock for all items
   * Checks if all items in cart are still available
   * 
   * @param {string} cartId - Cart ID
   * @returns {Promise<Object>} Validation result
   */
  async validateCartStock(cartId) {
    try {
      const cartItems = await this.prisma.cartItem.findMany({
        where: { cartId },
        include: {
          product: {
            select: { id: true, name: true, status: true }
          },
          variant: {
            select: { id: true, name: true, stock: true }
          }
        }
      });

      const validationResults = [];
      let isValid = true;

      for (const item of cartItems) {
        const availability = await this.checkStockAvailability(
          item.productId,
          item.variantId,
          item.quantity,
          cartId
        );

        validationResults.push({
          cartItemId: item.id,
          productId: item.productId,
          variantId: item.variantId,
          productName: item.product.name,
          variantName: item.variant?.name || null,
          requestedQuantity: item.quantity,
          currentStock: availability.currentStock,
          availableForSale: availability.availableForSale,
          backorderQuantity: availability.backorderQuantity,
          canBackorder: availability.canBackorder,
          isAvailable: availability.available,
          error: availability.error
        });

        if (!availability.available) {
          isValid = false;
        }
      }

      return {
        isValid,
        cartId,
        validationResults,
        unavailableItems: validationResults.filter(r => !r.isAvailable)
      };
    } catch (error) {
      this.logger.error('Error validating cart stock', {
        cartId,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Generate ETag for cart (for concurrent request handling)
   * 
   * @param {string} cartId - Cart ID
   * @param {number} version - Cart version number
   * @returns {string} ETag string
   */
  generateETag(cartId, version) {
    return `"${cartId}-${version}-${Date.now()}"`;
  }

  /**
   * Parse ETag to extract cart info
   * 
   * @param {string} etag - ETag string
   * @returns {Object|null} Parsed ETag or null if invalid
   */
  parseETag(etag) {
    if (!etag) return null;
    
    // Remove quotes
    const cleaned = etag.replace(/"/g, '');
    const parts = cleaned.split('-');
    
    if (parts.length < 2) return null;
    
    return {
      cartId: parts[0],
      version: parseInt(parts[1]) || 0,
      timestamp: parseInt(parts[2]) || 0
    };
  }

  /**
   * Check if ETag matches current cart state
   * 
   * @param {string} cartId - Cart ID
   * @param {string} clientETag - Client's ETag
   * @param {number} currentVersion - Current cart version
   * @returns {boolean} True if ETag is still valid
   */
  validateETag(cartId, clientETag, currentVersion) {
    if (!clientETag) return true;
    
    const parsed = this.parseETag(clientETag);
    if (!parsed) return true;
    
    // Check if ETag matches cart and version
    return parsed.cartId === cartId && parsed.version === currentVersion;
  }

  /**
   * Increment cart version (called after cart modifications)
   * 
   * @param {string} cartId - Cart ID
   * @returns {Promise<number>} New version number
   */
  async incrementCartVersion(cartId) {
    try {
      const cart = await this.prisma.cart.findUnique({
        where: { id: cartId },
        select: { version: true }
      });

      const newVersion = (cart?.version || 0) + 1;

      await this.prisma.cart.update({
        where: { id: cartId },
        data: { version: newVersion }
      });

      return newVersion;
    } catch (error) {
      this.logger.error('Error incrementing cart version', {
        cartId,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Get stock status for product display
   * 
   * @param {string} productId - Product ID
   * @param {string} variantId - Variant ID (optional)
   * @returns {Promise<Object>} Stock status for display
   */
  async getProductStockStatus(productId, variantId = null) {
    try {
      const availability = await this.checkStockAvailability(productId, variantId, 1);
      
      let status;
      let statusText;
      let statusColor;

      if (availability.availableForSale <= 0) {
        if (availability.canBackorder) {
          status = 'backorder';
          statusText = 'Available for backorder';
          statusColor = 'orange';
        } else {
          status = 'out_of_stock';
          statusText = 'Out of stock';
          statusColor = 'red';
        }
      } else if (availability.availableForSale <= 5) {
        status = 'low_stock';
        statusText = `Only ${availability.availableForSale} left`;
        statusColor = 'orange';
      } else {
        status = 'in_stock';
        statusText = 'In stock';
        statusColor = 'green';
      }

      return {
        status,
        statusText,
        statusColor,
        quantity: availability.availableForSale,
        maxQuantity: availability.canBackorder 
          ? availability.availableForSale + BACKORDER_CONFIG.MAX_BACKORDER_QUANTITY 
          : availability.availableForSale,
        allowBackorder: availability.canBackorder || false,
        currentStock: availability.currentStock
      };
    } catch (error) {
      this.logger.error('Error getting product stock status', {
        productId,
        variantId,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Extend all reservations for a cart (called on cart activity)
   * 
   * @param {string} cartId - Cart ID
   * @returns {Promise<Object>} Extension result
   */
  async extendCartReservations(cartId) {
    try {
      const now = new Date();
      const newExpiry = new Date();
      newExpiry.setMinutes(newExpiry.getMinutes() + BACKORDER_CONFIG.RESERVATION_EXPIRY_MINUTES);

      const result = await this.prisma.stockReservation.updateMany({
        where: {
          cartId,
          status: RESERVATION_STATUS.ACTIVE,
          expiresAt: { gt: now }
        },
        data: {
          expiresAt: newExpiry
        }
      });

      this.logger.info('Cart reservations extended', {
        cartId,
        reservationsExtended: result.count
      });

      return {
        success: true,
        extendedCount: result.count,
        newExpiry
      };
    } catch (error) {
      this.logger.error('Error extending cart reservations', {
        cartId,
        error: error.message
      });
      throw error;
    }
  }
}

// Singleton instance
const stockValidationService = new StockValidationService();

module.exports = {
  StockValidationService,
  stockValidationService,
  BACKORDER_CONFIG,
  RESERVATION_STATUS
};
