const { cartWishlistSyncService } = require('../../services/cartWishlist/cartWishlistSync.service');
const { loggerService } = require('../../services/logger');

/**
 * Cart-Wishlist Sync Controller
 * 
 * Handles HTTP requests for cart-wishlist synchronization:
 * - Get sync status
 * - Trigger manual sync
 * - Get pending sync operations
 * - Sync offline changes
 * - Cancel sync
 * - Resolve conflicts
 */
class CartWishlistSyncController {
  /**
   * Get current sync status for user
   * GET /api/v1/cart-wishlist/sync-status
   */
  async getSyncStatus(req, res) {
    try {
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          error: {
            message: 'Authentication required',
            code: 401,
            messageBn: 'প্রমাণীকরণ প্রয়োজন'
          }
        });
      }

      const result = await cartWishlistSyncService.getSyncStatus(userId);

      return res.status(200).json(result);
    } catch (error) {
      loggerService.error('Error in getSyncStatus controller', {
        error: error.message,
        stack: error.stack
      });

      return res.status(500).json({
        success: false,
        error: {
          message: error.message,
          code: 500,
          messageBn: 'সিঙ্ক স্ট্যাটাস পেতে ব্যর্থ হয়েছে'
        }
      });
    }
  }

  /**
   * Trigger manual synchronization
   * POST /api/v1/cart-wishlist/trigger-sync
   */
  async triggerSync(req, res) {
    try {
      const { cartId, wishlistId } = req.body;
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          error: {
            message: 'Authentication required',
            code: 401,
            messageBn: 'প্রমাণীকরণ প্রয়োজন'
          }
        });
      }

      const result = await cartWishlistSyncService.triggerSync(
        userId,
        cartId,
        wishlistId
      );

      return res.status(200).json(result);
    } catch (error) {
      loggerService.error('Error in triggerSync controller', {
        error: error.message,
        stack: error.stack
      });

      return res.status(500).json({
        success: false,
        error: {
          message: error.message,
          code: 500,
          messageBn: 'সিঙ্ক ট্রিগার করতে ব্যর্থ হয়েছে'
        }
      });
    }
  }

  /**
   * Get pending sync operations
   * GET /api/v1/cart-wishlist/pending-sync
   */
  async getPendingSync(req, res) {
    try {
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          error: {
            message: 'Authentication required',
            code: 401,
            messageBn: 'প্রমাণীকরণ প্রয়োজন'
          }
        });
      }

      const result = await cartWishlistSyncService.getPendingSyncOperations(userId);

      return res.status(200).json(result);
    } catch (error) {
      loggerService.error('Error in getPendingSync controller', {
        error: error.message,
        stack: error.stack
      });

      return res.status(500).json({
        success: false,
        error: {
          message: error.message,
          code: 500,
          messageBn: 'মুলতুবি সিঙ্ক অপারেশন পেতে ব্যর্থ হয়েছে'
        }
      });
    }
  }

  /**
   * Sync offline changes when user comes online
   * POST /api/v1/cart-wishlist/offline-sync
   */
  async syncOfflineChanges(req, res) {
    try {
      const { operations } = req.body;
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          error: {
            message: 'Authentication required',
            code: 401,
            messageBn: 'প্রমাণীকরণ প্রয়োজন'
          }
        });
      }

      if (!Array.isArray(operations)) {
        return res.status(400).json({
          success: false,
          error: {
            message: 'operations must be an array',
            code: 400,
            messageBn: 'অপারেশন অবশ্যই একটি অ্যারে হতে হবে'
          }
        });
      }

      const result = await cartWishlistSyncService.syncOfflineChanges(
        userId,
        operations
      );

      return res.status(200).json(result);
    } catch (error) {
      loggerService.error('Error in syncOfflineChanges controller', {
        error: error.message,
        stack: error.stack
      });

      return res.status(500).json({
        success: false,
        error: {
          message: error.message,
          code: 500,
          messageBn: 'অফলাইন সিঙ্ক ব্যর্থ হয়েছে'
        }
      });
    }
  }

  /**
   * Cancel/remove a sync operation
   * POST /api/v1/cart-wishlist/sync/:syncId/cancel
   * DELETE /api/v1/cart-wishlist/sync/:id (legacy)
   */
  async cancelSync(req, res) {
    try {
      const syncId = req.params.syncId || req.params.id;
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          error: {
            message: 'Authentication required',
            code: 401,
            messageBn: 'প্রমাণীকরণ প্রয়োজন'
          }
        });
      }

      const result = await cartWishlistSyncService.cancelSync(syncId, userId);

      return res.status(200).json(result);
    } catch (error) {
      loggerService.error('Error in cancelSync controller', {
        error: error.message,
        stack: error.stack
      });

      const statusCode = error.message.includes('not found') ? 404 :
                       error.message.includes('Unauthorized') ? 403 : 500;

      return res.status(statusCode).json({
        success: false,
        error: {
          message: error.message,
          code: statusCode,
          messageBn: 'সিঙ্ক বাতিল করতে ব্যর্থ হয়েছে'
        }
      });
    }
  }

  /**
   * Resolve a sync conflict
   * POST /api/v1/cart-wishlist/sync/conflicts/:conflictId/resolve
   * POST /api/v1/cart-wishlist/resolve-conflict (legacy)
   */
  async resolveConflict(req, res) {
    try {
      // Support both body (new route) and params (legacy route)
      const conflictId = req.params.conflictId || req.body.conflictId;
      const { resolution } = req.body;
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          error: {
            message: 'Authentication required',
            code: 401,
            messageBn: 'প্রমাণীকরণ প্রয়োজন'
          }
        });
      }

      if (!conflictId) {
        return res.status(400).json({
          success: false,
          error: {
            message: 'conflictId is required',
            code: 400,
            messageBn: 'conflictId প্রয়োজন'
          }
        });
      }

      if (!resolution || !['keep_cart', 'keep_wishlist', 'merge'].includes(resolution)) {
        return res.status(400).json({
          success: false,
          error: {
            message: 'resolution must be one of: keep_cart, keep_wishlist, merge',
            code: 400,
            messageBn: 'রেজোলিউশন অবশ্যই একটি হতে হবে: keep_cart, keep_wishlist, merge'
          }
        });
      }

      const result = await cartWishlistSyncService.resolveConflict(
        conflictId,
        resolution,
        userId
      );

      return res.status(200).json(result);
    } catch (error) {
      loggerService.error('Error in resolveConflict controller', {
        error: error.message,
        stack: error.stack
      });

      const statusCode = error.message.includes('not found') ? 404 :
                       error.message.includes('Unauthorized') ? 403 : 500;

      return res.status(statusCode).json({
        success: false,
        error: {
          message: error.message,
          code: statusCode,
          messageBn: 'কনফ্লিক্ট সমাধান করতে ব্যর্থ হয়েছে'
        }
      });
    }
  }

  /**
   * Get all sync conflicts for user
   * GET /api/v1/cart-wishlist/sync/conflicts
   */
  async getSyncConflicts(req, res) {
    try {
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          error: {
            message: 'Authentication required',
            code: 401,
            messageBn: 'প্রমাণীকরণ প্রয়োজন'
          }
        });
      }

      const result = await cartWishlistSyncService.getSyncConflicts(userId);

      return res.status(200).json(result);
    } catch (error) {
      loggerService.error('Error in getSyncConflicts controller', {
        error: error.message,
        stack: error.stack
      });

      return res.status(500).json({
        success: false,
        error: {
          message: error.message,
          code: 500,
          messageBn: 'সিঙ্ক কনফ্লিক্ট পেতে ব্যর্থ হয়েছে'
        }
      });
    }
  }

  /**
   * Get user sync history
   * GET /api/v1/cart-wishlist/sync-history
   */
  async getSyncHistory(req, res) {
    try {
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          error: {
            message: 'Authentication required',
            code: 401,
            messageBn: 'প্রমাণীকরণ প্রয়োজন'
          }
        });
      }

      const filters = {
        status: req.query.status,
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 20
      };

      const result = await cartWishlistSyncService.getUserSyncHistory(
        userId,
        filters
      );

      return res.status(200).json(result);
    } catch (error) {
      loggerService.error('Error in getSyncHistory controller', {
        error: error.message,
        stack: error.stack
      });

      return res.status(500).json({
        success: false,
        error: {
          message: error.message,
          code: 500,
          messageBn: 'সিঙ্ক ইতিহাস পেতে ব্যর্থ হয়েছে'
        }
      });
    }
  }
}

module.exports = {
  cartWishlistSyncController: new CartWishlistSyncController()
};
