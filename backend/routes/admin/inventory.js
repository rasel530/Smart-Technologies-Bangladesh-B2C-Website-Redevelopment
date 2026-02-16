const express = require('express');
const { query, param, body, validationResult } = require('express-validator');
const { rbacAuthMiddleware } = require('../../middleware/rbacAuth');
const { authMiddleware } = require('../../middleware/auth');
const { adminInventoryController } = require('../../controllers/adminInventoryController');

const router = express.Router();

/**
 * Admin Inventory Routes
 * All routes require authentication and appropriate permissions
 */

// Validation middleware
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      message: 'Validation failed',
      messageBn: 'যাচাইকরণ ব্যর্থ হয়েছে',
      details: errors.array()
    });
  }
  next();
};

// Add logging middleware to trace requests
const logRequest = (req, res, next) => {
  console.log('[ADMIN INVENTORY ROUTE] Request received:', {
    method: req.method,
    path: req.path,
    url: req.originalUrl,
    timestamp: new Date().toISOString()
  });
  next();
};

/**
 * GET /api/v1/admin/carts/inventory-impact
 * Get inventory impact across all carts
 * Permission: inventory:read
 */
router.get('/inventory-impact', [
  query('statusFilter').optional().isIn(['all', 'low', 'out', 'normal']).withMessage('Invalid status filter'),
  query('lowStockOnly').optional().isBoolean().withMessage('lowStockOnly must be a boolean'),
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100')
], logRequest, handleValidationErrors, authMiddleware.authenticate(), rbacAuthMiddleware.requirePermission('inventory:read'), adminInventoryController.getInventoryImpact);

/**
 * GET /api/v1/admin/carts/inventory-impact/summary
 * Get inventory dashboard summary
 * Permission: inventory:read
 */
router.get('/inventory-impact/summary', [
], logRequest, handleValidationErrors, authMiddleware.authenticate(), rbacAuthMiddleware.requirePermission('inventory:read'), adminInventoryController.getInventoryDashboard);

/**
 * GET /api/v1/admin/carts/inventory-impact/product/:productId
 * Get reserved stock for a specific product
 * Permission: inventory:read
 */
router.get('/inventory-impact/product/:productId', [
  param('productId').isUUID().withMessage('Invalid product ID'),
  query('variantId').optional().isUUID().withMessage('Invalid variant ID')
], logRequest, handleValidationErrors, authMiddleware.authenticate(), rbacAuthMiddleware.requirePermission('inventory:read'), adminInventoryController.getProductReservedStock);

/**
 * POST /api/v1/admin/carts/inventory-impact/release/:reservationId
 * Release a stock reservation (manual admin action)
 * Permission: inventory:write
 */
router.post('/inventory-impact/release/:reservationId', [
  param('reservationId').isUUID().withMessage('Invalid reservation ID'),
  body('reason').optional().isString().withMessage('Reason must be a string'),
  body('adminId').isString().withMessage('Admin ID is required')
], logRequest, handleValidationErrors, authMiddleware.authenticate(), rbacAuthMiddleware.requirePermission('inventory:write'), adminInventoryController.releaseReservation);

/**
 * POST /api/v1/admin/carts/inventory-impact/release-by-cart/:cartId
 * Release all reservations for a cart
 * Permission: inventory:write
 */
router.post('/inventory-impact/release-by-cart/:cartId', [
  param('cartId').isUUID().withMessage('Invalid cart ID'),
  body('reason').optional().isString().withMessage('Reason must be a string'),
  body('adminId').isString().withMessage('Admin ID is required')
], logRequest, handleValidationErrors, authMiddleware.authenticate(), rbacAuthMiddleware.requirePermission('inventory:write'), adminInventoryController.releaseCartReservations);

/**
 * GET /api/v1/admin/carts/inventory-impact/export
 * Export inventory impact to CSV
 * Permission: inventory:read
 */
router.get('/inventory-impact/export', [
], logRequest, handleValidationErrors, authMiddleware.authenticate(), rbacAuthMiddleware.requirePermission('inventory:read'), adminInventoryController.exportInventoryImpact);

/**
 * POST /api/v1/admin/carts/inventory-impact/confirm/:reservationId
 * Confirm a reservation (for checkout)
 * Permission: inventory:write
 */
router.post('/inventory-impact/confirm/:reservationId', [
  param('reservationId').isUUID().withMessage('Invalid reservation ID')
], logRequest, handleValidationErrors, authMiddleware.authenticate(), rbacAuthMiddleware.requirePermission('inventory:write'), adminInventoryController.confirmReservation);

/**
 * POST /api/v1/admin/carts/inventory-impact/cleanup
 * Cleanup expired reservations (manual trigger)
 * Permission: inventory:admin
 */
router.post('/inventory-impact/cleanup', [
], logRequest, handleValidationErrors, authMiddleware.authenticate(), rbacAuthMiddleware.requirePermission('inventory:admin'), adminInventoryController.cleanupExpiredReservations);

/**
 * GET /api/v1/admin/carts/inventory-impact/audit/:reservationId
 * Get audit logs for a reservation
 * Permission: inventory:read
 */
router.get('/inventory-impact/audit/:reservationId', [
  param('reservationId').isUUID().withMessage('Invalid reservation ID')
], logRequest, handleValidationErrors, authMiddleware.authenticate(), rbacAuthMiddleware.requirePermission('inventory:read'), adminInventoryController.getReservationAuditLogs);

module.exports = router;
