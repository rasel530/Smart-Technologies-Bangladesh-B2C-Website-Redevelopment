const express = require('express');
const { body, param, query, validationResult } = require('express-validator');
const { rbacAuthMiddleware } = require('../../middleware/rbacAuth');
const { authMiddleware } = require('../../middleware/auth');
const { adminCartController } = require('../../controllers/adminCartController');
const { adminCartRecoveryController } = require('../../controllers/adminCartRecoveryController');
const { adminCartAuditController } = require('../../controllers/adminCartAuditController');
const { adminCleanupController } = require('../../controllers/adminCleanupController');

const router = express.Router();

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

/**
 * Admin Cart Routes
 * All routes require authentication and appropriate permissions
 */

// Add logging middleware to trace requests
const logRequest = (req, res, next) => {
  console.log('[ADMIN CART ROUTE] Request received:', {
    method: req.method,
    path: req.path,
    url: req.originalUrl,
    timestamp: new Date().toISOString()
  });
  next();
};

// GET /api/v1/admin/carts - List all carts with pagination and filters
// Permission: cart:read
router.get('/', [
  // Query parameters validation
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('status').optional().isIn(['active', 'abandoned', 'converted', 'expired']).withMessage('Invalid status'),
  query('userId').optional().isUUID().withMessage('Invalid user ID'),
  query('sortBy').optional().isIn(['createdAt', 'updatedAt', 'total', 'status']).withMessage('Invalid sort field'),
  query('sortOrder').optional().isIn(['asc', 'desc']).withMessage('Invalid sort order')
], logRequest, handleValidationErrors, authMiddleware.authenticate(), rbacAuthMiddleware.requirePermission('cart:read'), adminCartController.getAllCarts);

// GET /api/v1/admin/carts/analytics - Get cart analytics data
// Permission: cart:analytics
router.get('/analytics', [
  // Query parameters validation
  query('startDate').optional().isISO8601().withMessage('Invalid start date format'),
  query('endDate').optional().isISO8601().withMessage('Invalid end date format')
], logRequest, handleValidationErrors, authMiddleware.authenticate(), rbacAuthMiddleware.requirePermission('cart:analytics'), adminCartController.getCartAnalytics);

// GET /api/v1/admin/carts/analytics/conversion - Get cart conversion rates (BE-HIGH-002: Analytics endpoints)
// Permission: cart:analytics
router.get('/analytics/conversion', [
  // Query parameters validation
  query('startDate').optional().isISO8601().withMessage('Invalid start date format'),
  query('endDate').optional().isISO8601().withMessage('Invalid end date format')
], handleValidationErrors, authMiddleware.authenticate(), rbacAuthMiddleware.requirePermission('cart:analytics'), adminCartController.getCartConversionRates);

// GET /api/v1/admin/carts/analytics/average-value - Get average cart value (BE-HIGH-002: Analytics endpoints)
// Permission: cart:analytics
router.get('/analytics/average-value', [
  // Query parameters validation
  query('startDate').optional().isISO8601().withMessage('Invalid start date format'),
  query('endDate').optional().isISO8601().withMessage('Invalid end date format')
], handleValidationErrors, authMiddleware.authenticate(), rbacAuthMiddleware.requirePermission('cart:analytics'), adminCartController.getAverageCartValue);

// GET /api/v1/admin/carts/analytics/abandonment - Get cart abandonment rates (BE-HIGH-002: Analytics endpoints)
// Permission: cart:analytics
router.get('/analytics/abandonment', [
  // Query parameters validation
  query('startDate').optional().isISO8601().withMessage('Invalid start date format'),
  query('endDate').optional().isISO8601().withMessage('Invalid end date format')
], handleValidationErrors, authMiddleware.authenticate(), rbacAuthMiddleware.requirePermission('cart:analytics'), adminCartController.getCartAbandonmentRates);

// GET /api/v1/admin/carts/analytics/popular-products - Get popular products in carts (BE-HIGH-002: Analytics endpoints)
// Permission: cart:analytics
router.get('/analytics/popular-products', [
  // Query parameters validation
  query('startDate').optional().isISO8601().withMessage('Invalid start date format'),
  query('endDate').optional().isISO8601().withMessage('Invalid end date format'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100')
], handleValidationErrors, authMiddleware.authenticate(), rbacAuthMiddleware.requirePermission('cart:analytics'), adminCartController.getPopularProductsInCarts);

// GET /api/v1/admin/carts/analytics/time-in-cart - Get time in cart statistics (BE-HIGH-002: Analytics endpoints)
// Permission: cart:analytics
router.get('/analytics/time-in-cart', [
  // Query parameters validation
  query('startDate').optional().isISO8601().withMessage('Invalid start date format'),
  query('endDate').optional().isISO8601().withMessage('Invalid end date format')
], handleValidationErrors, authMiddleware.authenticate(), rbacAuthMiddleware.requirePermission('cart:analytics'), adminCartController.getTimeInCartStatistics);

// GET /api/v1/admin/carts/analytics/dashboard - Get full dashboard data
// Permission: cart:analytics
router.get('/analytics/dashboard', [
  // Query parameters validation
  query('startDate').optional().isISO8601().withMessage('Invalid start date format'),
  query('endDate').optional().isISO8601().withMessage('Invalid end date format')
], handleValidationErrors, authMiddleware.authenticate(), rbacAuthMiddleware.requirePermission('cart:analytics'), adminCartController.getCartAnalyticsDashboard);

// GET /api/v1/admin/carts/analytics/realtime - Get real-time stats
// Permission: cart:analytics
router.get('/analytics/realtime', authMiddleware.authenticate(), rbacAuthMiddleware.requirePermission('cart:analytics'), adminCartController.getCartRealtimeAnalytics);

// GET /api/v1/admin/carts/analytics/trends - Get trend data over time
// Permission: cart:analytics
router.get('/analytics/trends', [
  query('days').optional().isInt({ min: 1, max: 365 }).withMessage('Days must be between 1 and 365')
], handleValidationErrors, authMiddleware.authenticate(), rbacAuthMiddleware.requirePermission('cart:analytics'), adminCartController.getCartTrends);

// GET /api/v1/admin/carts/analytics/recommendations - Get optimization recommendations
// Permission: cart:analytics
router.get('/analytics/recommendations', authMiddleware.authenticate(), rbacAuthMiddleware.requirePermission('cart:analytics'), adminCartController.getCartRecommendations);

// DELETE /api/v1/admin/carts/expired - Clean up expired carts
// Permission: cart:delete
router.delete('/expired', authMiddleware.authenticate(), rbacAuthMiddleware.requirePermission('cart:delete'), adminCartController.cleanupExpiredCarts);

// GET /api/v1/admin/carts/export - Export carts to CSV (AP-HIGH-001: Export functionality)
// Permission: cart:read
router.get('/export', [
  // Query parameters validation
  query('status').optional().isIn(['active', 'abandoned', 'converted', 'expired']).withMessage('Invalid status'),
  query('userId').optional().isUUID().withMessage('Invalid user ID'),
  query('startDate').optional().isISO8601().withMessage('Invalid start date format'),
  query('endDate').optional().isISO8601().withMessage('Invalid end date format'),
  query('sortBy').optional().isIn(['createdAt', 'updatedAt', 'total', 'status']).withMessage('Invalid sort field'),
  query('sortOrder').optional().isIn(['asc', 'desc']).withMessage('Invalid sort order')
], handleValidationErrors, authMiddleware.authenticate(), rbacAuthMiddleware.requirePermission('cart:read'), adminCartController.exportCarts);

// DELETE /api/v1/admin/carts/bulk - Bulk delete carts (AP-HIGH-002: Bulk actions)
// Permission: cart:delete
router.delete('/bulk', [
  body('cartIds').isArray({ min: 1, max: 100 }).withMessage('Cart IDs must be an array with 1-100 items'),
  body('cartIds.*').isUUID().withMessage('Invalid cart ID in array')
], handleValidationErrors, authMiddleware.authenticate(), rbacAuthMiddleware.requirePermission('cart:delete'), adminCartController.bulkDeleteCarts);

// DELETE /api/v1/admin/carts/bulk/clear - Bulk clear carts (AP-HIGH-002: Bulk actions)
// Permission: cart:delete
router.delete('/bulk/clear', [
  body('cartIds').isArray({ min: 1, max: 100 }).withMessage('Cart IDs must be an array with 1-100 items'),
  body('cartIds.*').isUUID().withMessage('Invalid cart ID in array')
], handleValidationErrors, authMiddleware.authenticate(), rbacAuthMiddleware.requirePermission('cart:delete'), adminCartController.bulkClearCarts);

// PUT /api/v1/admin/carts/bulk/status - Bulk update cart status (AP-HIGH-002: Bulk actions)
// Permission: cart:write
router.put('/bulk/status', [
  body('cartIds').isArray({ min: 1, max: 100 }).withMessage('Cart IDs must be an array with 1-100 items'),
  body('cartIds.*').isUUID().withMessage('Invalid cart ID in array'),
  body('status').isIn(['active', 'abandoned', 'converted', 'expired']).withMessage('Invalid status')
], handleValidationErrors, authMiddleware.authenticate(), rbacAuthMiddleware.requirePermission('cart:write'), adminCartController.bulkUpdateCartStatus);

// ==================== CART ACTION ROUTES ====================
// These routes must be defined BEFORE the /:id route to avoid UUID validation issues

/**
 * GET /api/v1/admin/carts/inventory - Inventory management page endpoint
 * Permission: inventory:read
 */
router.get('/inventory', [
], logRequest, handleValidationErrors, authMiddleware.authenticate(), rbacAuthMiddleware.requirePermission('inventory:read'), async (req, res) => {
  res.json({
    success: true,
    message: 'Inventory management endpoint',
    data: {
      action: 'inventory',
      availableEndpoints: [
        '/inventory-impact',
        '/inventory-impact/summary',
        '/inventory-impact/product/:productId',
        '/inventory-impact/export'
      ]
    }
  });
});

/**
 * GET /api/v1/admin/carts/recovery - Cart recovery management page endpoint
 * Permission: cart:read
 */
router.get('/recovery', [
], logRequest, handleValidationErrors, authMiddleware.authenticate(), rbacAuthMiddleware.requirePermission('cart:read'), async (req, res) => {
  res.json({
    success: true,
    message: 'Cart recovery management endpoint',
    data: {
      action: 'recovery',
      availableEndpoints: [
        '/recovery/stats',
        '/bulk/recover',
        '/recovery/validate'
      ]
    }
  });
});

/**
 * GET /api/v1/admin/carts/recovery/stats - Get recovery statistics
 * Permission: cart:read
 */
router.get('/recovery/stats', [
  query('startDate').optional().isISO8601().withMessage('Invalid start date format'),
  query('endDate').optional().isISO8601().withMessage('Invalid end date format'),
  query('days').optional().isInt({ min: 1, max: 365 }).withMessage('Days must be between 1 and 365')
], logRequest, handleValidationErrors, authMiddleware.authenticate(), rbacAuthMiddleware.requirePermission('cart:read'), adminCartRecoveryController.getRecoveryStats);

/**
 * GET /api/v1/admin/carts/discounts - Discount management page endpoint
 * Permission: discount:read
 */
router.get('/discounts', [
], logRequest, handleValidationErrors, authMiddleware.authenticate(), rbacAuthMiddleware.requirePermission('discount:read'), async (req, res) => {
  res.json({
    success: true,
    message: 'Discount management endpoint',
    data: {
      action: 'discounts',
      availableEndpoints: [
        '/discounts',
        '/discounts/validate',
        '/bulk/discount'
      ]
    }
  });
});

/**
 * GET /api/v1/admin/carts/cleanup - Cart cleanup management page endpoint
 * Permission: cart:read
 */
router.get('/cleanup', [
], logRequest, handleValidationErrors, authMiddleware.authenticate(), rbacAuthMiddleware.requirePermission('cart:read'), async (req, res) => {
  res.json({
    success: true,
    message: 'Cart cleanup management endpoint',
    data: {
      action: 'cleanup',
      availableEndpoints: [
        '/cleanup/expired',
        '/cleanup/reservations',
        '/cleanup/abandoned',
        '/cleanup/full',
        '/cleanup/reminders',
        '/cleanup/stats',
        '/cleanup/history',
        '/cleanup/schedule/status'
      ]
    }
  });
});

/**
 * GET /api/v1/admin/carts/recovery/settings - Get recovery settings
 * Permission: cart:read
 */
console.log('[ROUTES] Registering GET /api/v1/admin/carts/recovery/settings');
router.get('/recovery/settings', [
  authMiddleware.authenticate(),
  rbacAuthMiddleware.requirePermission('cart:read')
], adminCartController.getRecoverySettings);
console.log('[ROUTES] GET /api/v1/admin/carts/recovery/settings registered successfully');

/**
 * PUT /api/v1/admin/carts/recovery/settings - Update recovery settings
 * Permission: cart:write
 */
console.log('[ROUTES] Registering PUT /api/v1/admin/carts/recovery/settings');
router.put('/recovery/settings', [
  authMiddleware.authenticate(),
  rbacAuthMiddleware.requirePermission('cart:write')
], adminCartController.updateRecoverySettings);
console.log('[ROUTES] PUT /api/v1/admin/carts/recovery/settings registered successfully');

// ==================== DYNAMIC CART ID ROUTES ====================
// These routes come AFTER all specific action routes above
// They require a valid UUID for cart ID

// GET /api/v1/admin/carts/:id - Get cart details
// Permission: cart:read
router.get('/:id', [
  param('id').isUUID().withMessage('Invalid cart ID')
], handleValidationErrors, authMiddleware.authenticate(), rbacAuthMiddleware.requirePermission('cart:read'), adminCartController.getCartById);

// GET /api/v1/admin/carts/:id/items - Get cart items
// Permission: cart:read
router.get('/:id/items', [
  param('id').isUUID().withMessage('Invalid cart ID')
], handleValidationErrors, authMiddleware.authenticate(), rbacAuthMiddleware.requirePermission('cart:read'), adminCartController.getCartItems);

// PUT /api/v1/admin/carts/:id/items/:itemId - Update cart item (admin override)
// Permission: cart:write
router.put('/:id/items/:itemId', [
  param('id').isUUID().withMessage('Invalid cart ID'),
  param('itemId').isUUID().withMessage('Invalid cart item ID'),
  body('quantity').optional().isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
  body('price').optional().isFloat({ min: 0 }).withMessage('Price must be non-negative')
], handleValidationErrors, authMiddleware.authenticate(), rbacAuthMiddleware.requirePermission('cart:write'), adminCartController.updateCartItem);

// DELETE /api/v1/admin/carts/:id/items/:itemId - Remove cart item (admin override)
// Permission: cart:delete
router.delete('/:id/items/:itemId', [
  param('id').isUUID().withMessage('Invalid cart ID'),
  param('itemId').isUUID().withMessage('Invalid cart item ID')
], handleValidationErrors, authMiddleware.authenticate(), rbacAuthMiddleware.requirePermission('cart:delete'), adminCartController.removeCartItem);

// DELETE /api/v1/admin/carts/:id - Clear cart (admin override)
// Permission: cart:delete
router.delete('/:id', [
  param('id').isUUID().withMessage('Invalid cart ID')
], handleValidationErrors, authMiddleware.authenticate(), rbacAuthMiddleware.requirePermission('cart:delete'), adminCartController.clearCart);

// GET /api/v1/admin/carts/:id/export - Export single cart to CSV (AP-HIGH-001: Export functionality)
// Permission: cart:read
router.get('/:id/export', [
  param('id').isUUID().withMessage('Invalid cart ID')
], handleValidationErrors, authMiddleware.authenticate(), rbacAuthMiddleware.requirePermission('cart:read'), adminCartController.exportCartById);

// POST /api/v1/admin/carts/:id/recover - Recover an abandoned cart
// Permission: cart:write
router.post('/:id/recover', [
  param('id').isUUID().withMessage('Invalid cart ID'),
  body('notifyUser').optional().isBoolean().withMessage('notifyUser must be a boolean'),
  body('emailTemplate').optional().isString().withMessage('emailTemplate must be a string'),
  body('notes').optional().isString().withMessage('notes must be a string')
], handleValidationErrors, authMiddleware.authenticate(), rbacAuthMiddleware.requirePermission('cart:write'), adminCartRecoveryController.recoverCart);

// POST /api/v1/admin/carts/:id/generate-recovery-token - Generate recovery token
// Permission: cart:write
router.post('/:id/generate-recovery-token', [
  param('id').isUUID().withMessage('Invalid cart ID'),
  body('expiresInDays').optional().isInt({ min: 1, max: 30 }).withMessage('expiresInDays must be between 1 and 30')
], handleValidationErrors, authMiddleware.authenticate(), rbacAuthMiddleware.requirePermission('cart:write'), adminCartRecoveryController.generateRecoveryToken);

// POST /api/v1/admin/carts/:id/invalidate-recovery-token - Invalidate recovery token
// Permission: cart:write
router.post('/:id/invalidate-recovery-token', [
  param('id').isUUID().withMessage('Invalid cart ID')
], handleValidationErrors, authMiddleware.authenticate(), rbacAuthMiddleware.requirePermission('cart:write'), adminCartRecoveryController.invalidateRecoveryToken);

// POST /api/v1/admin/carts/:id/generate-share-link - Generate shareable link
// Permission: cart:write
router.post('/:id/generate-share-link', [
  param('id').isUUID().withMessage('Invalid cart ID'),
  body('expiresInDays').optional().isInt({ min: 1, max: 30 }).withMessage('expiresInDays must be between 1 and 30'),
  body('sendEmail').optional().isBoolean().withMessage('sendEmail must be a boolean'),
  body('recipientEmail').optional().isEmail().withMessage('Invalid recipient email'),
  body('customMessage').optional().isString().withMessage('customMessage must be a string')
], handleValidationErrors, authMiddleware.authenticate(), rbacAuthMiddleware.requirePermission('cart:write'), adminCartRecoveryController.generateShareLink);

// POST /api/v1/admin/carts/:id/notify-recovery - Send recovery notification
// Permission: cart:write
router.post('/:id/notify-recovery', [
  param('id').isUUID().withMessage('Invalid cart ID'),
  body('emailTemplate').optional().isString().withMessage('emailTemplate must be a string')
], handleValidationErrors, authMiddleware.authenticate(), rbacAuthMiddleware.requirePermission('cart:write'), adminCartRecoveryController.sendRecoveryNotification);

// POST /api/v1/admin/carts/bulk/recover - Bulk recover carts
// Permission: cart:write
router.post('/bulk/recover', [
  body('cartIds').isArray({ min: 1, max: 100 }).withMessage('Cart IDs must be an array with 1-100 items'),
  body('cartIds.*').isUUID().withMessage('Invalid cart ID in array'),
  body('notifyUsers').optional().isBoolean().withMessage('notifyUsers must be a boolean'),
  body('notes').optional().isString().withMessage('notes must be a string')
], handleValidationErrors, authMiddleware.authenticate(), rbacAuthMiddleware.requirePermission('cart:write'), adminCartRecoveryController.bulkRecoverCarts);

// GET /api/v1/admin/carts/:id/recovery-history - Get recovery history
// Permission: cart:read
router.get('/:id/recovery-history', [
  param('id').isUUID().withMessage('Invalid cart ID')
], handleValidationErrors, authMiddleware.authenticate(), rbacAuthMiddleware.requirePermission('cart:read'), adminCartRecoveryController.getRecoveryHistory);

// POST /api/v1/admin/carts/recovery/validate - Validate recovery token
// Permission: cart:read
router.post('/recovery/validate', [
  body('token').notEmpty().isString().withMessage('Recovery token is required')
], handleValidationErrors, authMiddleware.authenticate(), rbacAuthMiddleware.requirePermission('cart:read'), adminCartRecoveryController.validateRecoveryToken);

// ==================== CART AUDIT LOGGING ROUTES ====================

// GET /api/v1/admin/carts/:id/audit - Get audit logs for a cart
// Permission: cart:read
router.get('/:id/audit', [
  param('id').isUUID().withMessage('Invalid cart ID'),
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('action').optional().isString().withMessage('Action must be a string'),
  query('entityType').optional().isString().withMessage('Entity type must be a string'),
  query('fromDate').optional().isISO8601().withMessage('Invalid start date format'),
  query('toDate').optional().isISO8601().withMessage('Invalid end date format')
], handleValidationErrors, authMiddleware.authenticate(), rbacAuthMiddleware.requirePermission('cart:read'), adminCartAuditController.getCartAuditLogs);

// GET /api/v1/admin/carts/:id/audit/summary - Get audit summary for a cart
// Permission: cart:read
router.get('/:id/audit/summary', [
  param('id').isUUID().withMessage('Invalid cart ID')
], handleValidationErrors, authMiddleware.authenticate(), rbacAuthMiddleware.requirePermission('cart:read'), adminCartAuditController.getAuditSummary);

// GET /api/v1/admin/carts/:id/audit/:logId - Get specific audit log entry
// Permission: cart:read
router.get('/:id/audit/:logId', [
  param('id').isUUID().withMessage('Invalid cart ID'),
  param('logId').isUUID().withMessage('Invalid audit log ID')
], handleValidationErrors, authMiddleware.authenticate(), rbacAuthMiddleware.requirePermission('cart:read'), adminCartAuditController.getAuditLogById);

// GET /api/v1/admin/carts/:id/audit/search - Search audit logs
// Permission: cart:read
router.get('/:id/audit/search', [
  param('id').isUUID().withMessage('Invalid cart ID'),
  query('q').notEmpty().isString().withMessage('Search query is required')
], handleValidationErrors, authMiddleware.authenticate(), rbacAuthMiddleware.requirePermission('cart:read'), adminCartAuditController.searchAuditLogs);

// GET /api/v1/admin/carts/:id/audit/export - Export audit logs
// Permission: cart:read
router.get('/:id/audit/export', [
  param('id').isUUID().withMessage('Invalid cart ID'),
  query('fromDate').optional().isISO8601().withMessage('Invalid start date format'),
  query('toDate').optional().isISO8601().withMessage('Invalid end date format'),
  query('actions').optional().isString().withMessage('Actions must be a comma-separated string'),
  query('format').optional().isIn(['json', 'csv']).withMessage('Format must be json or csv')
], handleValidationErrors, authMiddleware.authenticate(), rbacAuthMiddleware.requirePermission('cart:read'), adminCartAuditController.exportAuditLogs);

// POST /api/v1/admin/carts/:id/audit/rollback/:logId - Rollback an action
// Permission: cart:write
router.post('/:id/audit/rollback/:logId', [
  param('id').isUUID().withMessage('Invalid cart ID'),
  param('logId').isUUID().withMessage('Invalid audit log ID'),
  body('reason').optional().isString().withMessage('Reason must be a string')
], handleValidationErrors, authMiddleware.authenticate(), rbacAuthMiddleware.requirePermission('cart:write'), adminCartAuditController.rollbackAction);

// POST /api/v1/admin/carts/:id/notes - Add a note to a cart
// Permission: cart:write
router.post('/:id/notes', [
  param('id').isUUID().withMessage('Invalid cart ID'),
  body('content').notEmpty().isString().withMessage('Note content is required'),
  body('content').isLength({ max: 5000 }).withMessage('Note content cannot exceed 5000 characters'),
  body('isPrivate').optional().isBoolean().withMessage('isPrivate must be a boolean')
], handleValidationErrors, authMiddleware.authenticate(), rbacAuthMiddleware.requirePermission('cart:write'), adminCartAuditController.addNote);

// GET /api/v1/admin/carts/:id/notes - Get notes for a cart
// Permission: cart:read
router.get('/:id/notes', [
  param('id').isUUID().withMessage('Invalid cart ID'),
  query('includePrivate').optional().isBoolean().withMessage('includePrivate must be a boolean')
], handleValidationErrors, authMiddleware.authenticate(), rbacAuthMiddleware.requirePermission('cart:read'), adminCartAuditController.getCartNotes);

// PUT /api/v1/admin/carts/notes/:noteId - Update a note
// Permission: cart:write
router.put('/notes/:noteId', [
  param('noteId').isUUID().withMessage('Note ID'),
  body('content').notEmpty().isString().withMessage('Note content is required'),
  body('content').isLength({ max: 5000 }).withMessage('Note content cannot exceed 5000 characters')
], handleValidationErrors, authMiddleware.authenticate(), rbacAuthMiddleware.requirePermission('cart:write'), adminCartAuditController.updateNote);

// DELETE /api/v1/admin/carts/notes/:noteId - Delete a note
// Permission: cart:delete
router.delete('/notes/:noteId', [
  param('noteId').isUUID().withMessage('Invalid note ID')
], handleValidationErrors, authMiddleware.authenticate(), rbacAuthMiddleware.requirePermission('cart:delete'), adminCartAuditController.deleteNote);

// GET /api/v1/admin/audit/stats - Get audit statistics (global)
// Permission: cart:read
router.get('/stats/audit', [
  query('fromDate').optional().isISO8601().withMessage('Invalid start date format'),
  query('toDate').optional().isISO8601().withMessage('Invalid end date format'),
  query('action').optional().isString().withMessage('Action must be a string')
], handleValidationErrors, authMiddleware.authenticate(), rbacAuthMiddleware.requirePermission('cart:read'), adminCartAuditController.getAuditStats);

// ==================== CART CLEANUP ROUTES ====================

// POST /api/v1/admin/carts/cleanup/expired - Clean up expired carts
// Permission: cart:delete
router.post('/cleanup/expired', [
  body('dryRun').optional().isBoolean().withMessage('dryRun must be a boolean'),
  body('batchSize').optional().isInt({ min: 1, max: 5000 }).withMessage('batchSize must be between 1 and 5000')
], handleValidationErrors, authMiddleware.authenticate(), rbacAuthMiddleware.requirePermission('cart:delete'), adminCleanupController.cleanupExpiredCarts);

// POST /api/v1/admin/carts/cleanup/reservations - Clean up expired reservations
// Permission: cart:delete
router.post('/cleanup/reservations', handleValidationErrors, authMiddleware.authenticate(), rbacAuthMiddleware.requirePermission('cart:delete'), adminCleanupController.cleanupExpiredReservations);

// POST /api/v1/admin/carts/cleanup/abandoned - Clean up abandoned carts
// Permission: cart:write
router.post('/cleanup/abandoned', [
  body('thresholdDays').optional().isInt({ min: 1, max: 30 }).withMessage('thresholdDays must be between 1 and 30'),
  body('sendReminders').optional().isBoolean().withMessage('sendReminders must be a boolean'),
  body('dryRun').optional().isBoolean().withMessage('dryRun must be a boolean')
], handleValidationErrors, authMiddleware.authenticate(), rbacAuthMiddleware.requirePermission('cart:write'), adminCleanupController.cleanupAbandonedCarts);

// POST /api/v1/admin/carts/cleanup/full - Run full cleanup
// Permission: cart:delete
router.post('/cleanup/full', [
  body('includeReservations').optional().isBoolean().withMessage('includeReservations must be a boolean'),
  body('includeAbandoned').optional().isBoolean().withMessage('includeAbandoned must be a boolean'),
  body('sendReminders').optional().isBoolean().withMessage('sendReminders must be a boolean')
], handleValidationErrors, authMiddleware.authenticate(), rbacAuthMiddleware.requirePermission('cart:delete'), adminCleanupController.runFullCleanup);

// POST /api/v1/admin/carts/cleanup/reminders - Send recovery reminder emails
// Permission: cart:write
router.post('/cleanup/reminders', [
  body('thresholdDays').optional().isInt({ min: 1, max: 14 }).withMessage('thresholdDays must be between 1 and 14'),
  body('batchSize').optional().isInt({ min: 1, max: 500 }).withMessage('batchSize must be between 1 and 500')
], handleValidationErrors, authMiddleware.authenticate(), rbacAuthMiddleware.requirePermission('cart:write'), adminCleanupController.sendRecoveryReminders);

// GET /api/v1/admin/carts/cleanup/stats - Get cleanup statistics
// Permission: cart:read
router.get('/cleanup/stats', [
  query('startDate').optional().isISO8601().withMessage('Invalid start date format'),
  query('endDate').optional().isISO8601().withMessage('Invalid end date format')
], handleValidationErrors, authMiddleware.authenticate(), rbacAuthMiddleware.requirePermission('cart:read'), adminCleanupController.getCleanupStats);

// GET /api/v1/admin/carts/cleanup/history - Get cleanup history
// Permission: cart:read
router.get('/cleanup/history', [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('type').optional().isString().withMessage('Type must be a string')
], handleValidationErrors, authMiddleware.authenticate(), rbacAuthMiddleware.requirePermission('cart:read'), adminCleanupController.getCleanupHistory);

// POST /api/v1/admin/carts/cleanup/schedule/start - Start cleanup scheduler
// Permission: cart:admin
router.post('/cleanup/schedule/start', handleValidationErrors, authMiddleware.authenticate(), rbacAuthMiddleware.requirePermission('cart:admin'), adminCleanupController.startScheduler);

// POST /api/v1/admin/carts/cleanup/schedule/stop - Stop cleanup scheduler
// Permission: cart:admin
router.post('/cleanup/schedule/stop', handleValidationErrors, authMiddleware.authenticate(), rbacAuthMiddleware.requirePermission('cart:admin'), adminCleanupController.stopScheduler);

// GET /api/v1/admin/carts/cleanup/schedule/status - Get scheduler status
// Permission: cart:read
router.get('/cleanup/schedule/status', handleValidationErrors, authMiddleware.authenticate(), rbacAuthMiddleware.requirePermission('cart:read'), adminCleanupController.getSchedulerStatus);

// POST /api/v1/admin/carts/cleanup/schedule/run/:jobName - Manually run a scheduled job
// Permission: cart:admin
router.post('/cleanup/schedule/run/:jobName', [
  param('jobName').isString().withMessage('Job name must be a string')
], handleValidationErrors, authMiddleware.authenticate(), rbacAuthMiddleware.requirePermission('cart:admin'), adminCleanupController.runScheduledJob);

module.exports = router;
