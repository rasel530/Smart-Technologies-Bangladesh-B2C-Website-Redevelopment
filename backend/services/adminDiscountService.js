/**
 * Admin Discount Service
 * 
 * Handles all admin discount operations including:
 * - Creating and managing discount codes
 * - Applying discounts to carts
 * - Validating discount eligibility
 * - Audit logging for all discount actions
 */

const { PrismaClient } = require('@prisma/client');
const { loggerService } = require('./logger');

class AdminDiscountService {
  constructor() {
    this.prisma = new PrismaClient();
    this.logger = loggerService;
  }

  /**
   * Create a new admin discount code
   * @param {Object} data - Discount data
   * @param {string} data.code - Unique discount code
   * @param {string} data.type - Discount type (PERCENTAGE, FIXED, PROMOTIONAL)
   * @param {number} data.value - Discount value
   * @param {string} data.description - Optional description
   * @param {number} data.maxUses - Maximum number of uses (optional)
   * @param {Date} data.expiresAt - Expiration date (optional)
   * @param {string} adminId - ID of the admin creating the discount
   * @returns {Promise<Object>} Created discount
   */
  async createAdminDiscount(data, adminId) {
    try {
      const { code, type, value, description, maxUses, expiresAt } = data;

      // Validate input
      if (!code || !type || value === undefined) {
        throw new Error('Code, type, and value are required');
      }

      // Validate discount type
      const validTypes = ['PERCENTAGE', 'FIXED', 'PROMOTIONAL'];
      if (!validTypes.includes(type)) {
        throw new Error(`Invalid discount type. Must be one of: ${validTypes.join(', ')}`);
      }

      // Validate percentage value
      if (type === 'PERCENTAGE' && (value < 0 || value > 100)) {
        throw new Error('Percentage value must be between 0 and 100');
      }

      // Check if code already exists
      const existingDiscount = await this.prisma.adminDiscount.findUnique({
        where: { code: code.toUpperCase() }
      });

      if (existingDiscount) {
        throw new Error(`Discount code '${code}' already exists`);
      }

      // Create discount
      const discount = await this.prisma.adminDiscount.create({
        data: {
          code: code.toUpperCase(),
          type,
          value: parseFloat(value),
          description,
          maxUses,
          expiresAt: expiresAt ? new Date(expiresAt) : null,
          createdBy: adminId
        }
      });

      // Create audit log
      await this.createAuditLog(discount.id, null, discount, 'CREATE', adminId, 'Discount created');

      this.logger.info('Admin discount created', {
        discountId: discount.id,
        code: discount.code,
        type: discount.type,
        value: discount.value,
        adminId
      });

      return discount;
    } catch (error) {
      this.logger.error('Error creating admin discount', {
        error: error.message,
        data,
        adminId
      });
      throw error;
    }
  }

  /**
   * Get all admin discounts with pagination and filtering
   * @param {Object} options - Query options
   * @param {boolean} options.isActive - Filter by active status
   * @param {number} options.page - Page number (1-based)
   * @param {number} options.limit - Items per page
   * @returns {Promise<Object>} Paginated discounts
   */
  async getAllAdminDiscounts(options = {}) {
    try {
      const { isActive, page = 1, limit = 20 } = options;
      const skip = (page - 1) * limit;

      // Build where clause
      const where = {};
      if (typeof isActive === 'boolean') {
        where.isActive = isActive;
      }

      // Get total count
      const total = await this.prisma.adminDiscount.count({ where });

      // Get discounts
      const discounts = await this.prisma.adminDiscount.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' }
      });

      return {
        discounts,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      this.logger.error('Error getting admin discounts', {
        error: error.message,
        options
      });
      throw error;
    }
  }

  /**
   * Get a single discount by ID
   * @param {string} discountId - Discount ID
   * @returns {Promise<Object>} Discount with usage stats
   */
  async getDiscountById(discountId) {
    try {
      const discount = await this.prisma.adminDiscount.findUnique({
        where: { id: discountId }
      });

      if (!discount) {
        throw new Error('Discount not found');
      }

      // Calculate usage stats
      const usageStats = {
        usedCount: discount.usedCount,
        maxUses: discount.maxUses,
        remainingUses: discount.maxUses ? discount.maxUses - discount.usedCount : null,
        usagePercentage: discount.maxUses 
          ? Math.round((discount.usedCount / discount.maxUses) * 100) 
          : null
      };

      return {
        ...discount,
        usageStats
      };
    } catch (error) {
      this.logger.error('Error getting discount by ID', {
        error: error.message,
        discountId
      });
      throw error;
    }
  }

  /**
   * Update an existing discount
   * @param {string} discountId - Discount ID
   * @param {Object} data - Update data
   * @param {string} adminId - Admin ID
   * @returns {Promise<Object>} Updated discount
   */
  async updateDiscount(discountId, data, adminId) {
    try {
      const existing = await this.prisma.adminDiscount.findUnique({
        where: { id: discountId }
      });

      if (!existing) {
        throw new Error('Discount not found');
      }

      // Build update data
      const updateData = {};
      if (typeof data.isActive === 'boolean') {
        updateData.isActive = data.isActive;
      }
      if (data.maxUses !== undefined) {
        updateData.maxUses = data.maxUses;
      }
      if (data.expiresAt !== undefined) {
        updateData.expiresAt = data.expiresAt ? new Date(data.expiresAt) : null;
      }
      if (data.description !== undefined) {
        updateData.description = data.description;
      }

      const updated = await this.prisma.adminDiscount.update({
        where: { id: discountId },
        data: updateData
      });

      // Create audit log
      await this.createAuditLog(discountId, existing, updated, 'UPDATE', adminId, 'Discount updated');

      this.logger.info('Admin discount updated', {
        discountId,
        changes: updateData,
        adminId
      });

      return updated;
    } catch (error) {
      this.logger.error('Error updating discount', {
        error: error.message,
        discountId,
        data,
        adminId
      });
      throw error;
    }
  }

  /**
   * Delete a discount
   * @param {string} discountId - Discount ID
   * @param {string} adminId - Admin ID
   * @param {string} reason - Deletion reason
   * @returns {Promise<Object>} Deleted discount
   */
  async deleteDiscount(discountId, adminId, reason = 'Manual deletion') {
    try {
      const existing = await this.prisma.adminDiscount.findUnique({
        where: { id: discountId }
      });

      if (!existing) {
        throw new Error('Discount not found');
      }

      // Soft delete by deactivating
      const deleted = await this.prisma.adminDiscount.update({
        where: { id: discountId },
        data: { isActive: false }
      });

      // Create audit log
      await this.createAuditLog(discountId, existing, deleted, 'DELETE', adminId, reason);

      this.logger.info('Admin discount deleted', {
        discountId,
        adminId,
        reason
      });

      return deleted;
    } catch (error) {
      this.logger.error('Error deleting discount', {
        error: error.message,
        discountId,
        adminId
      });
      throw error;
    }
  }

  /**
   * Validate a discount code
   * @param {string} code - Discount code
   * @returns {Promise<Object>} Validation result
   */
  async validateDiscount(code) {
    try {
      const discount = await this.prisma.adminDiscount.findUnique({
        where: { code: code.toUpperCase() }
      });

      if (!discount) {
        return {
          valid: false,
          reason: 'INVALID_CODE',
          message: 'Discount code not found'
        };
      }

      // Check if active
      if (!discount.isActive) {
        return {
          valid: false,
          reason: 'INACTIVE',
          message: 'This discount code is no longer active'
        };
      }

      // Check expiration
      if (discount.expiresAt && new Date(discount.expiresAt) < new Date()) {
        return {
          valid: false,
          reason: 'EXPIRED',
          message: 'This discount code has expired'
        };
      }

      // Check start date
      if (new Date(discount.startsAt) > new Date()) {
        return {
          valid: false,
          reason: 'NOT_YET_ACTIVE',
          message: 'This discount code is not yet active'
        };
      }

      // Check usage limit
      if (discount.maxUses && discount.usedCount >= discount.maxUses) {
        return {
          valid: false,
          reason: 'USAGE_LIMIT_REACHED',
          message: 'This discount code has reached its usage limit'
        };
      }

      return {
        valid: true,
        discount: {
          id: discount.id,
          code: discount.code,
          type: discount.type,
          value: parseFloat(discount.value),
          description: discount.description
        },
        reason: 'VALID',
        message: 'Discount code is valid'
      };
    } catch (error) {
      this.logger.error('Error validating discount', {
        error: error.message,
        code
      });
      throw error;
    }
  }

  /**
   * Apply a discount to a cart
   * @param {string} cartId - Cart ID
   * @param {string} discountCode - Discount code
   * @param {string} adminId - Admin ID
   * @returns {Promise<Object>} Updated cart with discount applied
   */
  async applyDiscount(cartId, discountCode, adminId) {
    try {
      // Validate discount code
      const validation = await this.validateDiscount(discountCode);
      if (!validation.valid) {
        throw new Error(validation.message);
      }

      const discount = validation.discount;

      // Get cart with items
      const cart = await this.prisma.cart.findUnique({
        where: { id: cartId },
        include: {
          items: {
            include: {
              product: true,
              variant: true
            }
          }
        }
      });

      if (!cart) {
        throw new Error('Cart not found');
      }

      if (cart.items.length === 0) {
        throw new Error('Cannot apply discount to empty cart');
      }

      // Calculate discount amount
      const subtotal = parseFloat(cart.subtotal);
      let discountAmount = 0;

      if (discount.type === 'PERCENTAGE') {
        discountAmount = subtotal * (discount.value / 100);
      } else if (discount.type === 'FIXED') {
        discountAmount = Math.min(discount.value, subtotal);
      } else if (discount.type === 'PROMOTIONAL') {
        discountAmount = discount.value;
      }

      // Apply discount to all items
      await this.prisma.$transaction(async (tx) => {
        for (const item of cart.items) {
          // Calculate item's portion of the discount
          const itemSubtotal = parseFloat(item.subtotal);
          const itemDiscountRatio = itemSubtotal / subtotal;
          const itemDiscount = discountAmount * itemDiscountRatio;

          await tx.cartItem.update({
            where: { id: item.id },
            data: {
              originalPrice: item.price,
              appliedDiscount: parseFloat(itemDiscount.toFixed(2)),
              discountType: discount.type,
              discountReason: `Admin discount: ${discount.code}`,
              adminDiscountId: discount.id
            }
          });
        }

        // Update cart totals
        const taxRate = 0.15;
        const shippingCost = 100;
        const newSubtotal = subtotal;
        const newTax = newSubtotal * taxRate;
        const newTotal = newSubtotal + newTax + shippingCost - discountAmount;

        await tx.cart.update({
          where: { id: cartId },
          data: {
            discount: parseFloat(discountAmount.toFixed(2)),
            subtotal: newSubtotal,
            tax: parseFloat(newTax.toFixed(2)),
            total: parseFloat(newTotal.toFixed(2))
          }
        });
      });

      // Increment discount usage count
      await this.prisma.adminDiscount.update({
        where: { id: discount.id },
        data: {
          usedCount: { increment: 1 }
        }
      });

      // Create audit log
      await this.createAuditLog(
        discount.id,
        cartId,
        { discountAmount, discountType: discount.type },
        'APPLY',
        adminId,
        `Discount applied to cart ${cartId}`
      );

      this.logger.info('Discount applied to cart', {
        cartId,
        discountId: discount.id,
        discountCode: discount.code,
        discountAmount,
        adminId
      });

      // Return updated cart
      return await this.getCartWithDiscount(cartId);
    } catch (error) {
      this.logger.error('Error applying discount to cart', {
        error: error.message,
        cartId,
        discountCode,
        adminId
      });
      throw error;
    }
  }

  /**
   * Apply a discount to specific items in a cart
   * @param {string} cartId - Cart ID
   * @param {string[]} itemIds - Array of cart item IDs to apply discount to
   * @param {Object} discountData - Discount configuration
   * @param {string} discountData.discountType - Type of discount
   * @param {number} discountData.discountValue - Discount value
   * @param {string} adminId - Admin ID
   * @returns {Promise<Object>} Updated cart
   */
  async applyDiscountToItems(cartId, itemIds, discountData, adminId) {
    try {
      const { discountType, discountValue } = discountData;

      // Get cart items
      const items = await this.prisma.cartItem.findMany({
        where: {
          id: { in: itemIds },
          cartId
        },
        include: {
          product: true,
          variant: true
        }
      });

      if (items.length === 0) {
        throw new Error('No valid items found to apply discount');
      }

      // Calculate total of selected items
      const selectedSubtotal = items.reduce((sum, item) => sum + parseFloat(item.subtotal), 0);
      
      // Calculate discount amount
      let totalDiscount = 0;
      if (discountType === 'PERCENTAGE') {
        totalDiscount = selectedSubtotal * (discountValue / 100);
      } else {
        totalDiscount = Math.min(discountValue, selectedSubtotal);
      }

      // Apply discount to selected items
      await this.prisma.$transaction(async (tx) => {
        for (const item of items) {
          const itemSubtotal = parseFloat(item.subtotal);
          const itemDiscountRatio = itemSubtotal / selectedSubtotal;
          const itemDiscount = totalDiscount * itemDiscountRatio;

          await tx.cartItem.update({
            where: { id: item.id },
            data: {
              originalPrice: item.price,
              appliedDiscount: parseFloat(itemDiscount.toFixed(2)),
              discountType,
              discountReason: 'Admin manual discount',
              adminDiscountId: null
            }
          });
        }

        // Recalculate cart totals
        const allItems = await tx.cartItem.findMany({
          where: { cartId }
        });

        const cartSubtotal = allItems.reduce((sum, item) => sum + parseFloat(item.subtotal), 0);
        const cartDiscount = allItems.reduce((sum, item) => sum + (parseFloat(item.appliedDiscount) || 0), 0);
        const taxRate = 0.15;
        const shippingCost = 100;
        const newTax = cartSubtotal * taxRate;
        const newTotal = cartSubtotal + newTax + shippingCost - cartDiscount;

        await tx.cart.update({
          where: { id: cartId },
          data: {
            discount: parseFloat(cartDiscount.toFixed(2)),
            subtotal: cartSubtotal,
            tax: parseFloat(newTax.toFixed(2)),
            total: parseFloat(newTotal.toFixed(2))
          }
        });
      });

      this.logger.info('Discount applied to specific items', {
        cartId,
        itemIds,
        discountType,
        discountValue,
        totalDiscount,
        adminId
      });

      return await this.getCartWithDiscount(cartId);
    } catch (error) {
      this.logger.error('Error applying discount to items', {
        error: error.message,
        cartId,
        itemIds,
        discountData,
        adminId
      });
      throw error;
    }
  }

  /**
   * Remove discount from a cart
   * @param {string} cartId - Cart ID
   * @param {string} adminId - Admin ID
   * @param {string} reason - Reason for removal
   * @returns {Promise<Object>} Updated cart
   */
  async removeDiscount(cartId, adminId, reason = 'Manual removal') {
    try {
      // Get cart with discount info
      const cart = await this.prisma.cart.findUnique({
        where: { id: cartId },
        include: {
          items: true
        }
      });

      if (!cart) {
        throw new Error('Cart not found');
      }

      // Reset discount fields on items
      await this.prisma.$transaction(async (tx) => {
        for (const item of cart.items) {
          await tx.cartItem.update({
            where: { id: item.id },
            data: {
              originalPrice: null,
              appliedDiscount: 0,
              discountType: null,
              discountReason: null,
              adminDiscountId: null
            }
          });
        }

        // Recalculate cart totals
        const items = await tx.cartItem.findMany({
          where: { cartId }
        });

        const subtotal = items.reduce((sum, item) => sum + parseFloat(item.subtotal), 0);
        const taxRate = parseFloat(process.env.CART_TAX_RATE) || 0.15;
        const shippingCost = parseFloat(process.env.CART_SHIPPING_COST) || 100;
        // Tax rate is stored as percentage (e.g., 10 for 10%), so divide by 100 to get decimal
        const tax = subtotal * (taxRate / 100);
        const total = subtotal + tax + shippingCost;

        await tx.cart.update({
          where: { id: cartId },
          data: {
            discount: 0,
            subtotal,
            tax: parseFloat(tax.toFixed(2)),
            total: parseFloat(total.toFixed(2))
          }
        });
      });

      // Create audit log
      await this.createAuditLog(
        null,
        cartId,
        null,
        'REMOVE',
        adminId,
        reason
      );

      this.logger.info('Discount removed from cart', {
        cartId,
        adminId,
        reason
      });

      return await this.getCartWithDiscount(cartId);
    } catch (error) {
      this.logger.error('Error removing discount from cart', {
        error: error.message,
        cartId,
        adminId,
        reason
      });
      throw error;
    }
  }

  /**
   * Bulk apply discount to multiple carts
   * @param {string[]} cartIds - Array of cart IDs
   * @param {string} discountCode - Discount code to apply
   * @param {string} adminId - Admin ID
   * @returns {Promise<Object>} Summary of results
   */
  async bulkApplyDiscount(cartIds, discountCode, adminId) {
    try {
      const results = {
        applied: [],
        failed: []
      };

      // Validate discount first
      const validation = await this.validateDiscount(discountCode);
      if (!validation.valid) {
        throw new Error(`Discount validation failed: ${validation.message}`);
      }

      for (const cartId of cartIds) {
        try {
          await this.applyDiscount(cartId, discountCode, adminId);
          results.applied.push(cartId);
        } catch (error) {
          results.failed.push({
            cartId,
            reason: error.message
          });
        }
      }

      this.logger.info('Bulk discount application completed', {
        discountCode,
        totalCarts: cartIds.length,
        applied: results.applied.length,
        failed: results.failed.length,
        adminId
      });

      return {
        ...results,
        summary: {
          total: cartIds.length,
          applied: results.applied.length,
          failed: results.failed.length
        }
      };
    } catch (error) {
      this.logger.error('Error in bulk discount application', {
        error: error.message,
        cartIds,
        discountCode,
        adminId
      });
      throw error;
    }
  }

  /**
   * Get cart with discount information
   * @param {string} cartId - Cart ID
   * @returns {Promise<Object>} Cart with discount details
   */
  async getCartWithDiscount(cartId) {
    const cart = await this.prisma.cart.findUnique({
      where: { id: cartId },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                nameEn: true,
                sku: true,
                images: {
                  where: { displayOrder: 0 },
                  take: 1,
                  select: { id: true, originalUrl: true, optimizedUrl: true, thumbnailUrl: true }
                }
              }
            },
            variant: true
          }
        },
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true
          }
        }
      }
    });

    if (!cart) {
      throw new Error('Cart not found');
    }

    // Calculate discount breakdown
    const discountBreakdown = cart.items
      .filter(item => item.appliedDiscount && item.appliedDiscount > 0)
      .map(item => ({
        itemId: item.id,
        productName: item.product?.name || 'Unknown',
        originalPrice: parseFloat(item.originalPrice) || parseFloat(item.price),
        appliedDiscount: parseFloat(item.appliedDiscount),
        finalPrice: parseFloat(item.price) - parseFloat(item.appliedDiscount),
        discountType: item.discountType,
        discountReason: item.discountReason
      }));

    return {
      ...cart,
      discountBreakdown,
      totalDiscount: parseFloat(cart.discount),
      itemCount: cart.items.length,
      totalItems: cart.items.reduce((sum, item) => sum + item.quantity, 0)
    };
  }

  /**
   * Create an audit log entry
   * @param {string} discountId - Discount ID (optional)
   * @param {string} cartId - Cart ID (optional)
   * @param {Object} data - Data to log
   * @param {string} action - Action type
   * @param {string} adminId - Admin ID
   * @param {string} reason - Reason for action
   */
  async createAuditLog(discountId, cartId, data, action, adminId, reason) {
    try {
      await this.prisma.adminDiscountAuditLog.create({
        data: {
          discountId,
          cartId,
          adminId,
          action,
          previousData: data?.previousData || null,
          newData: data?.newData || data || null,
          reason
        }
      });
    } catch (error) {
      // Don't throw on audit log failures
      this.logger.warn('Failed to create audit log', {
        error: error.message,
        discountId,
        cartId,
        action
      });
    }
  }

  /**
   * Get audit logs for a discount
   * @param {string} discountId - Discount ID
   * @param {Object} options - Query options
   * @returns {Promise<Object>} Audit logs
   */
  async getAuditLogs(discountId, options = {}) {
    try {
      const { page = 1, limit = 50 } = options;
      const skip = (page - 1) * limit;

      const [logs, total] = await Promise.all([
        this.prisma.adminDiscountAuditLog.findMany({
          where: { discountId },
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' }
        }),
        this.prisma.adminDiscountAuditLog.count({ where: { discountId } })
      ]);

      return {
        logs,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      this.logger.error('Error getting audit logs', {
        error: error.message,
        discountId
      });
      throw error;
    }
  }
}

// Singleton instance
const adminDiscountService = new AdminDiscountService();

module.exports = {
  AdminDiscountService,
  adminDiscountService
};
