/**
 * Admin Inventory Controller
 * 
 * Provides admin API endpoints for inventory reservation tracking:
 * - GET /api/v1/admin/carts/inventory-impact - List products with reserved stock
 * - GET /api/v1/admin/carts/inventory-impact/summary - Dashboard summary
 * - GET /api/v1/admin/carts/inventory-impact/product/:productId - Product details
 * - POST /api/v1/admin/carts/inventory-impact/release/:reservationId - Release reservation
 * - POST /api/v1/admin/carts/inventory-impact/release-by-cart/:cartId - Release cart reservations
 * - GET /api/v1/admin/carts/inventory-impact/export - Export CSV
 */

const { inventoryReservationService, RESERVATION_STATUS } = require('../services/inventoryReservationService');
const { loggerService } = require('../services/logger');

class AdminInventoryController {
  constructor() {
    this.service = inventoryReservationService;
    this.logger = loggerService;
  }

  /**
   * Get inventory impact across all carts
   * GET /api/v1/admin/carts/inventory-impact
   * 
   * Query params:
   * - statusFilter: Filter by status ('all', 'low', 'out', 'normal')
   * - lowStockOnly: boolean - Only show low stock products
   * - page: Page number (default: 1)
   * - limit: Items per page (default: 50)
   */
  async getInventoryImpact(req, res) {
    try {
      const {
        statusFilter = 'all',
        lowStockOnly = 'false',
        page = 1,
        limit = 50
      } = req.query;

      const result = await this.service.getInventoryImpact({
        statusFilter,
        lowStockOnly: lowStockOnly === 'true',
        page: parseInt(page),
        limit: parseInt(limit)
      });

      res.json({
        success: true,
        message: 'Inventory impact retrieved successfully',
        messageBn: 'ইনভেন্টরি ইমপ্যাক্ট সফলভাবে পুনরুদ্ধার করা হয়েছে',
        ...result
      });
    } catch (error) {
      this.logger.error('Error in getInventoryImpact controller', {
        error: error.message,
        stack: error.stack
      });

      res.status(500).json({
        success: false,
        error: error.message || 'Failed to retrieve inventory impact',
        message: 'Failed to retrieve inventory impact',
        messageBn: 'ইনভেন্টরি ইমপ্যাক্ট পুনরুদ্ধার করতে ব্যর্থ হয়েছে'
      });
    }
  }

  /**
   * Get inventory dashboard summary
   * GET /api/v1/admin/carts/inventory-impact/summary
   */
  async getInventoryDashboard(req, res) {
    try {
      const result = await this.service.getInventoryDashboard();

      res.json({
        success: true,
        message: 'Inventory dashboard data retrieved successfully',
        messageBn: 'ইনভেন্টরি ড্যাশবোর্ড ডেটা সফলভাবে পুনরুদ্ধার করা হয়েছে',
        ...result
      });
    } catch (error) {
      this.logger.error('Error in getInventoryDashboard controller', {
        error: error.message,
        stack: error.stack
      });

      res.status(500).json({
        success: false,
        error: error.message || 'Failed to retrieve inventory dashboard',
        message: 'Failed to retrieve inventory dashboard',
        messageBn: 'ইনভেন্টরি ড্যাশবোর্ড পুনরুদ্ধার করতে ব্যর্থ হয়েছে'
      });
    }
  }

  /**
   * Get reserved stock for a specific product
   * GET /api/v1/admin/carts/inventory-impact/product/:productId
   */
  async getProductReservedStock(req, res) {
    try {
      const { productId } = req.params;
      const { variantId } = req.query;

      if (!productId) {
        return res.status(400).json({
          success: false,
          error: 'Product ID is required',
          message: 'Product ID is required',
          messageBn: 'পণ্য আইডি প্রয়োজন'
        });
      }

      const result = await this.service.getProductReservedStock(productId, variantId);

      res.json({
        success: true,
        message: 'Product reserved stock retrieved successfully',
        messageBn: 'পণ্যের সংরক্ষিত স্টক সফলভাবে পুনরুদ্ধার করা হয়েছে',
        ...result
      });
    } catch (error) {
      this.logger.error('Error in getProductReservedStock controller', {
        error: error.message,
        stack: error.stack
      });

      res.status(500).json({
        success: false,
        error: error.message || 'Failed to retrieve product reserved stock',
        message: 'Failed to retrieve product reserved stock',
        messageBn: 'পণ্যের সংরক্ষিত স্টক পুনরুদ্ধার করতে ব্যর্থ হয়েছে'
      });
    }
  }

  /**
   * Release a stock reservation (manual admin action)
   * POST /api/v1/admin/carts/inventory-impact/release/:reservationId
   * 
   * Body:
   * - reason: string - Reason for release
   * - adminId: string - Admin performing the action
   */
  async releaseReservation(req, res) {
    try {
      const { reservationId } = req.params;
      const { reason, adminId } = req.body;

      if (!reservationId) {
        return res.status(400).json({
          success: false,
          error: 'Reservation ID is required',
          message: 'Reservation ID is required',
          messageBn: 'রিজার্ভেশন আইডি প্রয়োজন'
        });
      }

      if (!adminId) {
        return res.status(400).json({
          success: false,
          error: 'Admin ID is required',
          message: 'Admin ID is required',
          messageBn: 'অ্যাডমিন আইডি প্রয়োজন'
        });
      }

      const result = await this.service.releaseReservation(
        reservationId,
        adminId,
        reason || 'Manual release by admin'
      );

      if (!result.success) {
        return res.status(400).json({
          success: false,
          error: result.error,
          message: result.error,
          messageBn: result.error
        });
      }

      res.json({
        success: true,
        message: 'Reservation released successfully',
        messageBn: 'রিজার্ভেশন সফলভাবে মুক্ত করা হয়েছে',
        ...result
      });
    } catch (error) {
      this.logger.error('Error in releaseReservation controller', {
        error: error.message,
        stack: error.stack
      });

      res.status(500).json({
        success: false,
        error: error.message || 'Failed to release reservation',
        message: 'Failed to release reservation',
        messageBn: 'রিজার্ভেশন মুক্ত করতে ব্যর্থ হয়েছে'
      });
    }
  }

  /**
   * Release all reservations for a cart
   * POST /api/v1/admin/carts/inventory-impact/release-by-cart/:cartId
   * 
   * Body:
   * - reason: string - Reason for release
   * - adminId: string - Admin performing the action
   */
  async releaseCartReservations(req, res) {
    try {
      const { cartId } = req.params;
      const { reason, adminId } = req.body;

      if (!cartId) {
        return res.status(400).json({
          success: false,
          error: 'Cart ID is required',
          message: 'Cart ID is required',
          messageBn: 'কার্ট আইডি প্রয়োজন'
        });
      }

      if (!adminId) {
        return res.status(400).json({
          success: false,
          error: 'Admin ID is required',
          message: 'Admin ID is required',
          messageBn: 'অ্যাডমিন আইডি প্রয়োজন'
        });
      }

      const result = await this.service.releaseCartReservations(
        cartId,
        adminId,
        reason || 'Cart reservations released by admin'
      );

      res.json({
        success: true,
        message: result.message,
        messageBn: result.message,
        ...result
      });
    } catch (error) {
      this.logger.error('Error in releaseCartReservations controller', {
        error: error.message,
        stack: error.stack
      });

      res.status(500).json({
        success: false,
        error: error.message || 'Failed to release cart reservations',
        message: 'Failed to release cart reservations',
        messageBn: 'কার্ট রিজার্ভেশন মুক্ত করতে ব্যর্থ হয়েছে'
      });
    }
  }

  /**
   * Export inventory impact to CSV
   * GET /api/v1/admin/carts/inventory-impact/export
   */
  async exportInventoryImpact(req, res) {
    try {
      const result = await this.service.exportInventoryImpact();

      // Set response headers for CSV download
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`);

      res.send(result.data);
    } catch (error) {
      this.logger.error('Error in exportInventoryImpact controller', {
        error: error.message,
        stack: error.stack
      });

      res.status(500).json({
        success: false,
        error: error.message || 'Failed to export inventory impact',
        message: 'Failed to export inventory impact',
        messageBn: 'ইনভেন্টরি ইমপ্যাক্ট রপ্তানি করতে ব্যর্থ হয়েছে'
      });
    }
  }

  /**
   * Confirm a reservation (for checkout)
   * POST /api/v1/admin/carts/inventory-impact/confirm/:reservationId
   */
  async confirmReservation(req, res) {
    try {
      const { reservationId } = req.params;

      if (!reservationId) {
        return res.status(400).json({
          success: false,
          error: 'Reservation ID is required',
          message: 'Reservation ID is required',
          messageBn: 'রিজার্ভেশন আইডি প্রয়োজন'
        });
      }

      const result = await this.service.confirmReservation(reservationId);

      if (!result.success) {
        return res.status(400).json({
          success: false,
          error: result.error,
          message: result.error,
          messageBn: result.error
        });
      }

      res.json({
        success: true,
        message: 'Reservation confirmed successfully',
        messageBn: 'রিজার্ভেশন সফলভাবে নিশ্চিত করা হয়েছে',
        ...result
      });
    } catch (error) {
      this.logger.error('Error in confirmReservation controller', {
        error: error.message,
        stack: error.stack
      });

      res.status(500).json({
        success: false,
        error: error.message || 'Failed to confirm reservation',
        message: 'Failed to confirm reservation',
        messageBn: 'রিজার্ভেশন নিশ্চিত করতে ব্যর্থ হয়েছে'
      });
    }
  }

  /**
   * Cleanup expired reservations (manual trigger)
   * POST /api/v1/admin/carts/inventory-impact/cleanup
   */
  async cleanupExpiredReservations(req, res) {
    try {
      const result = await this.service.cleanupExpiredReservations();

      res.json({
        success: true,
        message: result.message,
        messageBn: result.message,
        ...result
      });
    } catch (error) {
      this.logger.error('Error in cleanupExpiredReservations controller', {
        error: error.message,
        stack: error.stack
      });

      res.status(500).json({
        success: false,
        error: error.message || 'Failed to cleanup expired reservations',
        message: 'Failed to cleanup expired reservations',
        messageBn: 'মেয়াদোত্তীর্ণ রিজার্ভেশন পরিষ্কার করতে ব্যর্থ হয়েছে'
      });
    }
  }

  /**
   * Get audit logs for a reservation
   * GET /api/v1/admin/carts/inventory-impact/audit/:reservationId
   */
  async getReservationAuditLogs(req, res) {
    try {
      const { reservationId } = req.params;
      const { PrismaClient } = require('@prisma/client');
      const prisma = new PrismaClient();

      if (!reservationId) {
        return res.status(400).json({
          success: false,
          error: 'Reservation ID is required',
          message: 'Reservation ID is required',
          messageBn: 'রিজার্ভেশন আইডি প্রয়োজন'
        });
      }

      const auditLogs = await prisma.inventoryReservationAuditLog.findMany({
        where: { reservationId },
        orderBy: { createdAt: 'desc' }
      });

      res.json({
        success: true,
        message: 'Audit logs retrieved successfully',
        messageBn: 'অডিট লগ সফলভাবে পুনরুদ্ধার করা হয়েছে',
        data: auditLogs
      });
    } catch (error) {
      this.logger.error('Error in getReservationAuditLogs controller', {
        error: error.message,
        stack: error.stack
      });

      res.status(500).json({
        success: false,
        error: error.message || 'Failed to retrieve audit logs',
        message: 'Failed to retrieve audit logs',
        messageBn: 'অডিট লগ পুনরুদ্ধার করতে ব্যর্থ হয়েছে'
      });
    }
  }
}

// Singleton instance
const adminInventoryController = new AdminInventoryController();

module.exports = {
  AdminInventoryController,
  adminInventoryController
};
