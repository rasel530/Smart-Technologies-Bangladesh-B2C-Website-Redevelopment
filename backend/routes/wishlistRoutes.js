const express = require('express');
const { wishlistController } = require('../controllers/wishlistController');
const { authMiddleware } = require('../middleware/auth');
const {
  verifyWishlistOwnership,
  verifyWishlistOwnershipOrAdmin,
  verifyAdminAccess,
  verifyPublicAccessOrOwnership
} = require('../middleware/wishlistAuth');
const {
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
} = require('../validators/wishlistValidator');

const router = express.Router();

// ============================================================================
// Wishlist CRUD Operations
// ============================================================================

/**
 * GET /api/v1/wishlists
 * Get all wishlists for authenticated user
 */
router.get('/',
  authMiddleware.authenticate(),
  validateGetWishlists,
  wishlistController.getWishlists.bind(wishlistController)
);

/**
 * POST /api/v1/wishlists
 * Create a new wishlist
 */
router.post('/',
  authMiddleware.authenticate(),
  validateCreateWishlist,
  wishlistController.createWishlist.bind(wishlistController)
);

/**
 * GET /api/v1/wishlists/analytics
 * Get wishlist analytics data (admin only)
 */
router.get('/analytics',
  authMiddleware.authenticate(),
  validateGetAnalytics,
  verifyAdminAccess,
  wishlistController.getAnalytics.bind(wishlistController)
);

/**
 * GET /api/v1/wishlists/:id
 * Get a specific wishlist by ID
 * Accessible if:
 * - User owns the wishlist, OR
 * - Wishlist is public, OR
 * - Valid shareToken is provided
 */
router.get('/:id', 
  validateWishlistId,
  verifyPublicAccessOrOwnership,
  wishlistController.getWishlistById.bind(wishlistController)
);

/**
 * PUT /api/v1/wishlists/:id
 * Update wishlist details (owner only)
 */
router.put('/:id', 
  authMiddleware.authenticate(),
  validateWishlistId,
  validateUpdateWishlist,
  verifyWishlistOwnership,
  wishlistController.updateWishlist.bind(wishlistController)
);

/**
 * DELETE /api/v1/wishlists/:id
 * Delete a wishlist (owner only)
 */
router.delete('/:id', 
  authMiddleware.authenticate(),
  validateWishlistId,
  verifyWishlistOwnership,
  wishlistController.deleteWishlist.bind(wishlistController)
);

// ============================================================================
// Wishlist Item Management
// ============================================================================

/**
 * POST /api/v1/wishlists/:id/items
 * Add a product to a wishlist
 */
router.post('/:id/items', 
  authMiddleware.authenticate(),
  validateWishlistId,
  validateAddItem,
  verifyWishlistOwnership,
  wishlistController.addItemToWishlist.bind(wishlistController)
);

/**
 * DELETE /api/v1/wishlists/:id/items/:itemId
 * Remove an item from a wishlist
 */
router.delete('/:id/items/:itemId', 
  authMiddleware.authenticate(),
  validateWishlistId,
  validateWishlistItemId,
  verifyWishlistOwnership,
  wishlistController.removeItemFromWishlist.bind(wishlistController)
);

/**
 * GET /api/v1/wishlists/:id/items
 * Get all items in a specific wishlist
 */
router.get('/:id/items',
  authMiddleware.authenticate(),
  validateWishlistId,
  verifyWishlistOwnership,
  wishlistController.getWishlistItems.bind(wishlistController)
);

/**
 * POST /api/v1/wishlists/:id/items/move-to-cart
 * Move wishlist items to cart
 */
router.post('/:id/items/move-to-cart', 
  authMiddleware.authenticate(),
  validateWishlistId,
  validateMoveItems,
  verifyWishlistOwnership,
  wishlistController.moveItemsToCart.bind(wishlistController)
);

/**
 * POST /api/v1/wishlists/:id/items/:itemId/move-to-cart
 * Move a single item to cart
 */
router.post('/:id/items/:itemId/move-to-cart',
  authMiddleware.authenticate(),
  validateWishlistId,
  validateWishlistItemId,
  verifyWishlistOwnership,
  wishlistController.moveSingleItemToCart.bind(wishlistController)
);

// ============================================================================
// Wishlist Sharing
// ============================================================================

/**
 * POST /api/v1/wishlists/:id/share
 * Generate share token for a wishlist (owner only)
 */
router.post('/:id/share', 
  authMiddleware.authenticate(),
  validateWishlistId,
  verifyWishlistOwnership,
  wishlistController.generateShareToken.bind(wishlistController)
);

/**
 * GET /api/v1/wishlists/shared/:shareToken
 * Access a shared wishlist (public, no auth required)
 */
router.get('/shared/:shareToken', 
  validateShareToken,
  wishlistController.getSharedWishlist.bind(wishlistController)
);

/**
 * GET /api/v1/wishlists/:id/export
 * Export wishlist as CSV or PDF
 */
router.get('/:id/export', 
  authMiddleware.authenticate(),
  validateWishlistId,
  validateExportWishlist,
  verifyWishlistOwnership,
  wishlistController.exportWishlist.bind(wishlistController)
);

// ============================================================================
// Wishlist Analytics (Admin Only)
// ============================================================================

module.exports = router;
