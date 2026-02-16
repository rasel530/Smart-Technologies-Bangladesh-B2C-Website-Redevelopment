/**
 * Admin Discount Routes
 * 
 * Routes for managing admin discounts and applying them to carts
 */

const express = require('express');
const router = express.Router();
const { body, param, query } = require('express-validator');
const { authMiddleware } = require('../../middleware/auth');
const { rbacAuthMiddleware } = require('../../middleware/rbacAuth');
const { handleValidationErrors } = require('../../middleware/validation');
const { adminDiscountController } = require('../../controllers/adminDiscountController');
const { logRequest } = require('../../middleware/requestLogger');

// Validation middleware
const validateDiscountCode = [
  body('discountCode')
    .trim()
    .notEmpty()
    .withMessage('Discount code is required')
    .isLength({ min: 3, max: 20 })
    .withMessage('Discount code must be between 3 and 20 characters')
    .matches(/^[A-Z0-9_-]+$/)
    .withMessage('Discount code can only contain uppercase letters, numbers, underscores, and hyphens')
];

const validateCreateDiscount = [
  body('code')
    .trim()
    .notEmpty()
    .withMessage('Discount code is required')
    .isLength({ min: 3, max: 20 })
    .withMessage('Discount code must be between 3 and 20 characters')
    .matches(/^[A-Z0-9_-]+$/)
    .withMessage('Discount code can only contain uppercase letters, numbers, underscores, and hyphens'),
  body('type')
    .notEmpty()
    .withMessage('Discount type is required')
    .isIn(['PERCENTAGE', 'FIXED', 'PROMOTIONAL'])
    .withMessage('Invalid discount type'),
  body('value')
    .notEmpty()
    .withMessage('Discount value is required')
    .isFloat({ min: 0 })
    .withMessage('Discount value must be a positive number'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description must be less than 500 characters'),
  body('maxUses')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Max uses must be a positive integer'),
  body('expiresAt')
    .optional()
    .isISO8601()
    .withMessage('Invalid expiration date format')
];

const validateApplyToItems = [
  body('itemIds')
    .isArray({ min: 1 })
    .withMessage('Item IDs must be a non-empty array'),
  body('itemIds.*')
    .isUUID()
    .withMessage('Each item ID must be a valid UUID'),
  body('discountType')
    .notEmpty()
    .withMessage('Discount type is required')
    .isIn(['PERCENTAGE', 'FIXED', 'PROMOTIONAL'])
    .withMessage('Invalid discount type'),
  body('discountValue')
    .notEmpty()
    .withMessage('Discount value is required')
    .isFloat({ min: 0 })
    .withMessage('Discount value must be a positive number')
];

// ============================================
// DISCOUNT MANAGEMENT ROUTES
// ============================================

// GET /api/v1/admin/discounts - List all discounts
router.get(
  '/discounts',
  logRequest,
  query('isActive').optional().isBoolean().withMessage('isActive must be a boolean'),
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  handleValidationErrors,
  authMiddleware.authenticate(),
  rbacAuthMiddleware.requirePermission('discount:read'),
  adminDiscountController.getAllDiscounts.bind(adminDiscountController)
);

// POST /api/v1/admin/discounts - Create a new discount
router.post(
  '/discounts',
  logRequest,
  validateCreateDiscount,
  handleValidationErrors,
  authMiddleware.authenticate(),
  rbacAuthMiddleware.requirePermission('discount:write'),
  adminDiscountController.createDiscount.bind(adminDiscountController)
);

// GET /api/v1/admin/discounts/:id - Get discount by ID
router.get(
  '/discounts/:id',
  logRequest,
  param('id').isUUID().withMessage('Invalid discount ID'),
  handleValidationErrors,
  authMiddleware.authenticate(),
  rbacAuthMiddleware.requirePermission('discount:read'),
  adminDiscountController.getDiscountById.bind(adminDiscountController)
);

// PUT /api/v1/admin/discounts/:id - Update a discount
router.put(
  '/discounts/:id',
  logRequest,
  param('id').isUUID().withMessage('Invalid discount ID'),
  body('isActive').optional().isBoolean().withMessage('isActive must be a boolean'),
  body('maxUses').optional().isInt({ min: 1 }).withMessage('Max uses must be a positive integer'),
  body('expiresAt').optional().isISO8601().withMessage('Invalid expiration date format'),
  body('description').optional().trim().isLength({ max: 500 }).withMessage('Description must be less than 500 characters'),
  handleValidationErrors,
  authMiddleware.authenticate(),
  rbacAuthMiddleware.requirePermission('discount:write'),
  adminDiscountController.updateDiscount.bind(adminDiscountController)
);

// DELETE /api/v1/admin/discounts/:id - Delete/deactivate a discount
router.delete(
  '/discounts/:id',
  logRequest,
  param('id').isUUID().withMessage('Invalid discount ID'),
  body('reason').optional().trim().isLength({ max: 500 }).withMessage('Reason must be less than 500 characters'),
  handleValidationErrors,
  authMiddleware.authenticate(),
  rbacAuthMiddleware.requirePermission('discount:delete'),
  adminDiscountController.deleteDiscount.bind(adminDiscountController)
);

// POST /api/v1/admin/discounts/validate - Validate a discount code
router.post(
  '/discounts/validate',
  logRequest,
  body('discountCode')
    .trim()
    .notEmpty()
    .withMessage('Discount code is required'),
  handleValidationErrors,
  authMiddleware.authenticate(),
  rbacAuthMiddleware.requirePermission('discount:read'),
  adminDiscountController.validateDiscount.bind(adminDiscountController)
);

// GET /api/v1/admin/discounts/:id/audit - Get audit logs for a discount
router.get(
  '/discounts/:id/audit',
  logRequest,
  param('id').isUUID().withMessage('Invalid discount ID'),
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  handleValidationErrors,
  authMiddleware.authenticate(),
  rbacAuthMiddleware.requirePermission('discount:read'),
  adminDiscountController.getAuditLogs.bind(adminDiscountController)
);

// ============================================
// CART DISCOUNT ROUTES
// ============================================

// GET /api/v1/admin/carts/discounts - List all discounts (cart management context)
router.get(
  '/carts/discounts',
  logRequest,
  query('isActive').optional().isBoolean().withMessage('isActive must be a boolean'),
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  handleValidationErrors,
  authMiddleware.authenticate(),
  rbacAuthMiddleware.requirePermission('discount:read'),
  adminDiscountController.getAllDiscounts.bind(adminDiscountController)
);

// POST /api/v1/admin/carts/discounts - Create a new discount (cart management context)
router.post(
  '/carts/discounts',
  logRequest,
  validateCreateDiscount,
  handleValidationErrors,
  authMiddleware.authenticate(),
  rbacAuthMiddleware.requirePermission('discount:write'),
  adminDiscountController.createDiscount.bind(adminDiscountController)
);

// GET /api/v1/admin/carts/:id/discount - Get cart with discount details
router.get(
  '/carts/:id/discount',
  logRequest,
  param('id').isUUID().withMessage('Invalid cart ID'),
  handleValidationErrors,
  authMiddleware.authenticate(),
  rbacAuthMiddleware.requirePermission('cart:read'),
  adminDiscountController.getCartWithDiscount.bind(adminDiscountController)
);

// POST /api/v1/admin/carts/:id/discount - Apply discount to cart
router.post(
  '/carts/:id/discount',
  logRequest,
  param('id').isUUID().withMessage('Invalid cart ID'),
  validateDiscountCode,
  body('adminId')
    .notEmpty()
    .withMessage('Admin ID is required'),
  handleValidationErrors,
  authMiddleware.authenticate(),
  rbacAuthMiddleware.requirePermission('cart:write'),
  adminDiscountController.applyDiscountToCart.bind(adminDiscountController)
);

// DELETE /api/v1/admin/carts/:id/discount - Remove discount from cart
router.delete(
  '/carts/:id/discount',
  logRequest,
  param('id').isUUID().withMessage('Invalid cart ID'),
  body('adminId')
    .notEmpty()
    .withMessage('Admin ID is required'),
  body('reason')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Reason must be less than 500 characters'),
  handleValidationErrors,
  authMiddleware.authenticate(),
  rbacAuthMiddleware.requirePermission('cart:write'),
  adminDiscountController.removeDiscountFromCart.bind(adminDiscountController)
);

// POST /api/v1/admin/carts/:id/discount/items - Apply discount to specific items
router.post(
  '/carts/:id/discount/items',
  logRequest,
  param('id').isUUID().withMessage('Invalid cart ID'),
  validateApplyToItems,
  body('adminId')
    .notEmpty()
    .withMessage('Admin ID is required'),
  handleValidationErrors,
  authMiddleware.authenticate(),
  rbacAuthMiddleware.requirePermission('cart:write'),
  adminDiscountController.applyDiscountToItems.bind(adminDiscountController)
);

// POST /api/v1/admin/carts/bulk/discount - Bulk apply discount to multiple carts
router.post(
  '/carts/bulk/discount',
  logRequest,
  body('cartIds')
    .isArray({ min: 1 })
    .withMessage('Cart IDs must be a non-empty array'),
  body('cartIds.*')
    .isUUID()
    .withMessage('Each cart ID must be a valid UUID'),
  validateDiscountCode,
  body('adminId')
    .notEmpty()
    .withMessage('Admin ID is required'),
  handleValidationErrors,
  authMiddleware.authenticate(),
  rbacAuthMiddleware.requirePermission('cart:write'),
  adminDiscountController.bulkApplyDiscount.bind(adminDiscountController)
);

module.exports = router;
