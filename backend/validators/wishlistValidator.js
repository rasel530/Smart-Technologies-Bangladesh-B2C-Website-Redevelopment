const { body, param, query, validationResult } = require('express-validator');

/**
 * Wishlist Validator
 * 
 * Input validation schemas for wishlist operations
 */

/**
 * Handle validation errors middleware
 */
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: errors.array()
    });
  }
  next();
};

/**
 * Validate wishlist ID parameter
 */
const validateWishlistId = [
  param('id')
    .exists()
    .withMessage('Wishlist ID is required')
    .isUUID()
    .withMessage('Invalid wishlist ID format'),
  handleValidationErrors
];

/**
 * Validate wishlist item ID parameter
 */
const validateWishlistItemId = [
  param('itemId')
    .exists()
    .withMessage('Wishlist item ID is required')
    .isUUID()
    .withMessage('Invalid wishlist item ID format'),
  handleValidationErrors
];

/**
 * Validate share token parameter
 */
const validateShareToken = [
  param('shareToken')
    .exists()
    .withMessage('Share token is required')
    .isLength({ min: 64, max: 64 })
    .withMessage('Invalid share token format'),
  handleValidationErrors
];

/**
 * Validate create wishlist request body
 */
const validateCreateWishlist = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Name must be between 1 and 100 characters'),
  body('isDefault')
    .optional()
    .isBoolean()
    .withMessage('isDefault must be a boolean'),
  body('isPublic')
    .optional()
    .isBoolean()
    .withMessage('isPublic must be a boolean'),
  handleValidationErrors
];

/**
 * Validate update wishlist request body
 */
const validateUpdateWishlist = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Name must be between 1 and 100 characters'),
  body('isDefault')
    .optional()
    .isBoolean()
    .withMessage('isDefault must be a boolean'),
  body('isPublic')
    .optional()
    .isBoolean()
    .withMessage('isPublic must be a boolean'),
  handleValidationErrors
];

/**
 * Validate add item to wishlist request body
 */
const validateAddItem = [
  body('productId')
    .exists()
    .withMessage('Product ID is required')
    .isUUID()
    .withMessage('Invalid product ID format'),
  handleValidationErrors
];

/**
 * Validate move items to cart request body
 */
const validateMoveItems = [
  body('itemIds')
    .exists()
    .withMessage('Item IDs are required')
    .isArray({ min: 1 })
    .withMessage('Item IDs must be a non-empty array'),
  body('itemIds.*')
    .isUUID()
    .withMessage('All item IDs must be valid UUIDs'),
  handleValidationErrors
];

/**
 * Validate export wishlist query parameters
 */
const validateExportWishlist = [
  query('format')
    .exists()
    .withMessage('Format is required')
    .isIn(['csv', 'pdf'])
    .withMessage('Format must be either csv or pdf'),
  handleValidationErrors
];

/**
 * Validate get wishlists query parameters
 */
const validateGetWishlists = [
  query('includeItems')
    .optional()
    .isBoolean()
    .withMessage('includeItems must be a boolean'),
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  handleValidationErrors
];

/**
 * Validate analytics query parameters
 */
const validateGetAnalytics = [
  query('startDate')
    .optional()
    .isISO8601()
    .withMessage('startDate must be a valid ISO 8601 date'),
  query('endDate')
    .optional()
    .isISO8601()
    .withMessage('endDate must be a valid ISO 8601 date'),
  handleValidationErrors
];

module.exports = {
  handleValidationErrors,
  validateWishlistId,
  validateWishlistItemId,
  validateShareToken,
  validateCreateWishlist,
  validateUpdateWishlist,
  validateAddItem,
  validateMoveItems,
  validateExportWishlist,
  validateGetWishlists,
  validateGetAnalytics
};
