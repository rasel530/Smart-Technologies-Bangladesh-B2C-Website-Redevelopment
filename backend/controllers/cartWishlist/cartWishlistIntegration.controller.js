const { cartWishlistIntegrationService } = require('../../services/cartWishlist/cartWishlistIntegration.service');
const { loggerService } = require('../../services/logger');

/**
 * Cart-Wishlist Integration Controller
 * 
 * Handles HTTP requests for cart-wishlist integration features:
 * - Move items from cart to wishlist
 * - Move items from wishlist to cart
 * - Bulk move operations
 */
class CartWishlistIntegrationController {
  /**
   * Move a single cart item to wishlist
   * POST /api/v1/cart-wishlist/integration/move-to-wishlist (itemId in body)
   * POST /api/v1/cart/items/:itemId/move-to-wishlist (itemId in params - legacy)
   */
  async moveCartItemToWishlist(req, res) {
    try {
      // Support both body and params for itemId (new route uses body, legacy uses params)
      const itemId = req.body.itemId || req.params.itemId;
      const { wishlistId } = req.body;
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

      const result = await cartWishlistIntegrationService.moveCartItemToWishlist(
        itemId,
        userId,
        wishlistId
      );

      return res.status(200).json(result);
    } catch (error) {
      loggerService.error('Error in moveCartItemToWishlist controller', {
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
          messageBn: 'আইটেম সরানো ব্যর্থ হয়েছে'
        }
      });
    }
  }

  /**
   * Bulk move cart items to wishlist
   * POST /api/v1/cart/bulk-move-to-wishlist
   */
  async bulkMoveCartItemsToWishlist(req, res) {
    try {
      const { itemIds, wishlistId } = req.body;
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

      if (!Array.isArray(itemIds) || itemIds.length === 0) {
        return res.status(400).json({
          success: false,
          error: {
            message: 'itemIds must be a non-empty array',
            code: 400,
            messageBn: 'itemIds অবশ্যই একটি খালি অ্যারে হতে হবে'
          }
        });
      }

      const result = await cartWishlistIntegrationService.bulkMoveCartItemsToWishlist(
        itemIds,
        userId,
        wishlistId
      );

      return res.status(200).json(result);
    } catch (error) {
      loggerService.error('Error in bulkMoveCartItemsToWishlist controller', {
        error: error.message,
        stack: error.stack
      });

      return res.status(500).json({
        success: false,
        error: {
          message: error.message,
          code: 500,
          messageBn: 'বাল্ক সরানো ব্যর্থ হয়েছে'
        }
      });
    }
  }

  /**
   * Move all cart items to wishlist
   * POST /api/v1/cart/move-all-to-wishlist
   */
  async moveAllCartItemsToWishlist(req, res) {
    try {
      const { wishlistId } = req.body;
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

      const result = await cartWishlistIntegrationService.moveAllCartItemsToWishlist(
        userId,
        wishlistId
      );

      return res.status(200).json(result);
    } catch (error) {
      loggerService.error('Error in moveAllCartItemsToWishlist controller', {
        error: error.message,
        stack: error.stack
      });

      return res.status(500).json({
        success: false,
        error: {
          message: error.message,
          code: 500,
          messageBn: 'সব আইটেম সরানো ব্যর্থ হয়েছে'
        }
      });
    }
  }

  /**
   * Bulk move wishlist items to cart
   * POST /api/v1/wishlist/bulk-move-to-cart
   */
  async bulkMoveWishlistItemsToCart(req, res) {
    try {
      const { itemIds, cartId } = req.body;
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

      if (!Array.isArray(itemIds) || itemIds.length === 0) {
        return res.status(400).json({
          success: false,
          error: {
            message: 'itemIds must be a non-empty array',
            code: 400,
            messageBn: 'itemIds অবশ্যই একটি খালি অ্যারে হতে হবে'
          }
        });
      }

      const result = await cartWishlistIntegrationService.bulkMoveWishlistItemsToCart(
        itemIds,
        userId,
        cartId
      );

      return res.status(200).json(result);
    } catch (error) {
      loggerService.error('Error in bulkMoveWishlistItemsToCart controller', {
        error: error.message,
        stack: error.stack
      });

      return res.status(500).json({
        success: false,
        error: {
          message: error.message,
          code: 500,
          messageBn: 'বাল্ক সরানো ব্যর্থ হয়েছে'
        }
      });
    }
  }

  /**
   * Move all wishlist items to cart
   * POST /api/v1/wishlist/:id/move-all-to-cart
   */
  async moveAllWishlistItemsToCart(req, res) {
    try {
      const { id: wishlistId } = req.params;
      const { cartId } = req.body;
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

      const result = await cartWishlistIntegrationService.moveAllWishlistItemsToCart(
        wishlistId,
        userId,
        cartId
      );

      return res.status(200).json(result);
    } catch (error) {
      loggerService.error('Error in moveAllWishlistItemsToCart controller', {
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
          messageBn: 'সব আইটেম সরানো ব্যর্থ হয়েছে'
        }
      });
    }
  }

  /**
   * Get move history for user
   * GET /api/v1/cart-wishlist/move-history
   */
  async getMoveHistory(req, res) {
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
        productId: req.query.productId,
        moveType: req.query.moveType,
        startDate: req.query.startDate,
        endDate: req.query.endDate,
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 20
      };

      const result = await cartWishlistIntegrationService.getMoveHistory(
        userId,
        filters
      );

      return res.status(200).json(result);
    } catch (error) {
      loggerService.error('Error in getMoveHistory controller', {
        error: error.message,
        stack: error.stack
      });

      return res.status(500).json({
        success: false,
        error: {
          message: error.message,
          code: 500,
          messageBn: 'সরানোর ইতিহাস পেতে ব্যর্থ হয়েছে'
        }
      });
    }
  }
}

module.exports = {
  cartWishlistIntegrationController: new CartWishlistIntegrationController()
};
