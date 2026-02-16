/**
 * Admin Discount Controller
 * 
 * Handles all HTTP requests for admin discount management
 */

const { adminDiscountService } = require('../services/adminDiscountService');
const { loggerService } = require('../services/logger');

class AdminDiscountController {
  constructor() {
    this.service = adminDiscountService;
    this.logger = loggerService;
  }

  /**
   * Create a new admin discount
   * POST /api/v1/admin/discounts
   */
  async createDiscount(req, res, next) {
    try {
      const { code, type, value, description, maxUses, expiresAt } = req.body;
      const adminId = req.user?.id || req.body.adminId;

      if (!adminId) {
        return res.status(400).json({
          success: false,
          error: 'Admin ID is required'
        });
      }

      const discount = await this.service.createAdminDiscount({
        code,
        type,
        value,
        description,
        maxUses,
        expiresAt
      }, adminId);

      res.status(201).json({
        success: true,
        discount
      });
    } catch (error) {
      this.logger.error('Error creating discount', { error: error.message });
      
      if (error.message.includes('already exists')) {
        return res.status(409).json({
          success: false,
          error: error.message
        });
      }
      
      next(error);
    }
  }

  /**
   * Get all admin discounts
   * GET /api/v1/admin/discounts
   */
  async getAllDiscounts(req, res, next) {
    try {
      const { isActive, page, limit } = req.query;

      const result = await this.service.getAllAdminDiscounts({
        isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined,
        page: parseInt(page) || 1,
        limit: parseInt(limit) || 20
      });

      res.json({
        success: true,
        ...result
      });
    } catch (error) {
      this.logger.error('Error getting discounts', { error: error.message });
      next(error);
    }
  }

  /**
   * Get a single discount by ID
   * GET /api/v1/admin/discounts/:id
   */
  async getDiscountById(req, res, next) {
    try {
      const { id } = req.params;

      const discount = await this.service.getDiscountById(id);

      res.json({
        success: true,
        discount
      });
    } catch (error) {
      this.logger.error('Error getting discount by ID', { error: error.message });
      
      if (error.message === 'Discount not found') {
        return res.status(404).json({
          success: false,
          error: error.message
        });
      }
      
      next(error);
    }
  }

  /**
   * Update a discount
   * PUT /api/v1/admin/discounts/:id
   */
  async updateDiscount(req, res, next) {
    try {
      const { id } = req.params;
      const { isActive, maxUses, expiresAt, description } = req.body;
      const adminId = req.user?.id || req.body.adminId;

      if (!adminId) {
        return res.status(400).json({
          success: false,
          error: 'Admin ID is required'
        });
      }

      const discount = await this.service.updateDiscount(id, {
        isActive,
        maxUses: maxUses ? parseInt(maxUses) : undefined,
        expiresAt,
        description
      }, adminId);

      res.json({
        success: true,
        discount
      });
    } catch (error) {
      this.logger.error('Error updating discount', { error: error.message });
      
      if (error.message === 'Discount not found') {
        return res.status(404).json({
          success: false,
          error: error.message
        });
      }
      
      next(error);
    }
  }

  /**
   * Delete a discount
   * DELETE /api/v1/admin/discounts/:id
   */
  async deleteDiscount(req, res, next) {
    try {
      const { id } = req.params;
      const { reason } = req.body;
      const adminId = req.user?.id || req.body.adminId;

      if (!adminId) {
        return res.status(400).json({
          success: false,
          error: 'Admin ID is required'
        });
      }

      const discount = await this.service.deleteDiscount(id, adminId, reason);

      res.json({
        success: true,
        message: 'Discount deactivated successfully',
        discount
      });
    } catch (error) {
      this.logger.error('Error deleting discount', { error: error.message });
      
      if (error.message === 'Discount not found') {
        return res.status(404).json({
          success: false,
          error: error.message
        });
      }
      
      next(error);
    }
  }

  /**
   * Validate a discount code
   * POST /api/v1/admin/discounts/validate
   */
  async validateDiscount(req, res, next) {
    try {
      const { code } = req.body;

      if (!code) {
        return res.status(400).json({
          success: false,
          error: 'Discount code is required'
        });
      }

      const result = await this.service.validateDiscount(code);

      res.json({
        success: true,
        ...result
      });
    } catch (error) {
      this.logger.error('Error validating discount', { error: error.message });
      next(error);
    }
  }

  /**
   * Apply discount to a cart
   * POST /api/v1/admin/carts/:id/discount
   */
  async applyDiscountToCart(req, res, next) {
    try {
      const { id: cartId } = req.params;
      const { discountCode } = req.body;
      const adminId = req.user?.id || req.body.adminId;

      if (!discountCode) {
        return res.status(400).json({
          success: false,
          error: 'Discount code is required'
        });
      }

      const cart = await this.service.applyDiscount(cartId, discountCode, adminId);

      // Calculate discount amount from cart
      const discountAmount = cart.discountBreakdown?.reduce(
        (sum, item) => sum + item.appliedDiscount, 
        0
      ) || parseFloat(cart.totalDiscount) || 0;

      res.json({
        success: true,
        cart,
        discountAmount
      });
    } catch (error) {
      this.logger.error('Error applying discount to cart', { error: error.message });
      
      if (error.message.includes('not found') || error.message.includes('empty cart')) {
        return res.status(404).json({
          success: false,
          error: error.message
        });
      }
      
      if (error.message.includes('not valid') || error.message.includes('expired') || error.message.includes('not active')) {
        return res.status(400).json({
          success: false,
          error: error.message
        });
      }
      
      next(error);
    }
  }

  /**
   * Apply discount to specific items in a cart
   * POST /api/v1/admin/carts/:id/discount/items
   */
  async applyDiscountToItems(req, res, next) {
    try {
      const { id: cartId } = req.params;
      const { itemIds, discountType, discountValue } = req.body;
      const adminId = req.user?.id || req.body.adminId;

      if (!itemIds || !Array.isArray(itemIds) || itemIds.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'Item IDs are required'
        });
      }

      if (!discountType || discountValue === undefined) {
        return res.status(400).json({
          success: false,
          error: 'Discount type and value are required'
        });
      }

      const cart = await this.service.applyDiscountToItems(
        cartId,
        itemIds,
        { discountType, discountValue: parseFloat(discountValue) },
        adminId
      );

      res.json({
        success: true,
        cart
      });
    } catch (error) {
      this.logger.error('Error applying discount to items', { error: error.message });
      
      if (error.message.includes('not found') || error.message.includes('No valid items')) {
        return res.status(404).json({
          success: false,
          error: error.message
        });
      }
      
      next(error);
    }
  }

  /**
   * Remove discount from a cart
   * DELETE /api/v1/admin/carts/:id/discount
   */
  async removeDiscountFromCart(req, res, next) {
    try {
      const { id: cartId } = req.params;
      const { reason } = req.body;
      const adminId = req.user?.id || req.body.adminId;

      const cart = await this.service.removeDiscount(cartId, adminId, reason);

      res.json({
        success: true,
        cart
      });
    } catch (error) {
      this.logger.error('Error removing discount from cart', { error: error.message });
      
      if (error.message === 'Cart not found') {
        return res.status(404).json({
          success: false,
          error: error.message
        });
      }
      
      next(error);
    }
  }

  /**
   * Get cart with discount details
   * GET /api/v1/admin/carts/:id/discount
   */
  async getCartWithDiscount(req, res, next) {
    try {
      const { id: cartId } = req.params;

      const cart = await this.service.getCartWithDiscount(cartId);

      res.json({
        success: true,
        cart
      });
    } catch (error) {
      this.logger.error('Error getting cart with discount', { error: error.message });
      
      if (error.message === 'Cart not found') {
        return res.status(404).json({
          success: false,
          error: error.message
        });
      }
      
      next(error);
    }
  }

  /**
   * Bulk apply discount to multiple carts
   * POST /api/v1/admin/carts/bulk/discount
   */
  async bulkApplyDiscount(req, res, next) {
    try {
      const { cartIds, discountCode } = req.body;
      const adminId = req.user?.id || req.body.adminId;

      if (!cartIds || !Array.isArray(cartIds) || cartIds.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'Cart IDs are required'
        });
      }

      if (!discountCode) {
        return res.status(400).json({
          success: false,
          error: 'Discount code is required'
        });
      }

      const result = await this.service.bulkApplyDiscount(cartIds, discountCode, adminId);

      res.json({
        success: true,
        ...result
      });
    } catch (error) {
      this.logger.error('Error in bulk discount application', { error: error.message });
      
      if (error.message.includes('Discount validation failed')) {
        return res.status(400).json({
          success: false,
          error: error.message
        });
      }
      
      next(error);
    }
  }

  /**
   * Get audit logs for a discount
   * GET /api/v1/admin/discounts/:id/audit
   */
  async getAuditLogs(req, res, next) {
    try {
      const { id: discountId } = req.params;
      const { page, limit } = req.query;

      const result = await this.service.getAuditLogs(discountId, {
        page: parseInt(page) || 1,
        limit: parseInt(limit) || 50
      });

      res.json({
        success: true,
        ...result
      });
    } catch (error) {
      this.logger.error('Error getting audit logs', { error: error.message });
      next(error);
    }
  }
}

// Singleton instance
const adminDiscountController = new AdminDiscountController();

module.exports = {
  AdminDiscountController,
  adminDiscountController
};
