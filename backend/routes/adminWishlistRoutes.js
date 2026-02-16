const express = require('express');
const { adminWishlistController } = require('../controllers/adminWishlistController');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// ============================================================================
// Admin Wishlist Statistics
// ============================================================================

/**
 * GET /api/v1/admin/wishlists/statistics
 * Get wishlist statistics (admin only)
 */
router.get('/statistics', 
  authMiddleware.authenticate(),
  adminWishlistController.getStatistics.bind(adminWishlistController)
);

// ============================================================================
// Admin Wishlist Management
// ============================================================================

/**
 * GET /api/v1/admin/wishlists
 * Get all wishlists with pagination and filters (admin only)
 */
router.get('/', 
  authMiddleware.authenticate(),
  adminWishlistController.getAllWishlists.bind(adminWishlistController)
);

/**
 * GET /api/v1/admin/wishlists/users
 * Get users with wishlists (admin only)
 */
router.get('/users', 
  authMiddleware.authenticate(),
  adminWishlistController.getUsersWithWishlists.bind(adminWishlistController)
);

/**
 * GET /api/v1/admin/wishlists/users/:userId
 * Get user wishlists (admin only)
 */
router.get('/users/:userId', 
  authMiddleware.authenticate(),
  adminWishlistController.getUserWishlists.bind(adminWishlistController)
);

/**
 * DELETE /api/v1/admin/wishlists/:id
 * Delete wishlist (admin override)
 */
router.delete('/:id', 
  authMiddleware.authenticate(),
  adminWishlistController.deleteWishlist.bind(adminWishlistController)
);

// ============================================================================
// Admin Wishlist Analytics
// ============================================================================

/**
 * GET /api/v1/admin/wishlists/analytics
 * Get wishlist analytics (admin only)
 */
router.get('/analytics', 
  authMiddleware.authenticate(),
  adminWishlistController.getAnalytics.bind(adminWishlistController)
);

/**
 * GET /api/v1/admin/wishlists/products
 * Get product wishlist analytics (admin only)
 */
router.get('/products', 
  authMiddleware.authenticate(),
  adminWishlistController.getProductAnalytics.bind(adminWishlistController)
);

// ============================================================================
// Admin Wishlist Settings
// ============================================================================

/**
 * GET /api/v1/admin/wishlists/settings
 * Get wishlist settings (admin only)
 */
router.get('/settings', 
  authMiddleware.authenticate(),
  adminWishlistController.getSettings.bind(adminWishlistController)
);

/**
 * PUT /api/v1/admin/wishlists/settings
 * Update wishlist settings (admin only)
 */
router.put('/settings', 
  authMiddleware.authenticate(),
  adminWishlistController.updateSettings.bind(adminWishlistController)
);

// ============================================================================
// Admin Wishlist Moderation
// ============================================================================

/**
 * GET /api/v1/admin/wishlists/moderation
 * Get moderation queue (admin only)
 */
router.get('/moderation', 
  authMiddleware.authenticate(),
  adminWishlistController.getModerationQueue.bind(adminWishlistController)
);

/**
 * POST /api/v1/admin/wishlists/moderation/:id/approve
 * Approve wishlist in moderation (admin only)
 */
router.post('/moderation/:id/approve', 
  authMiddleware.authenticate(),
  adminWishlistController.approveWishlist.bind(adminWishlistController)
);

/**
 * POST /api/v1/admin/wishlists/moderation/:id/reject
 * Reject wishlist in moderation (admin only)
 */
router.post('/moderation/:id/reject', 
  authMiddleware.authenticate(),
  adminWishlistController.rejectWishlist.bind(adminWishlistController)
);

module.exports = router;
