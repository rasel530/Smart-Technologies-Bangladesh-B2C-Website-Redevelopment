const { PrismaClient } = require('@prisma/client');
const { loggerService } = require('../logger');
const { cartService } = require('../cartService');
const { wishlistService } = require('../wishlistService');

/**
 * Cart-Wishlist Integration Service
 * 
 * Business logic for cart-wishlist integration features:
 * - Move items from cart to wishlist
 * - Move items from wishlist to cart
 * - Bulk move operations
 * - Move history tracking
 */
class CartWishlistIntegrationService {
  constructor() {
    this.prisma = new PrismaClient();
    this.logger = loggerService;
  }

  /**
   * Move a single cart item to wishlist
   * @param {string} cartItemId - Cart item ID
   * @param {string} userId - User ID
   * @param {string} wishlistId - Optional wishlist ID (uses default if not provided)
   * @returns {Promise<Object>} Result with cart item and wishlist item
   */
  async moveCartItemToWishlist(cartItemId, userId, wishlistId = null) {
    try {
      this.logger.info('Moving cart item to wishlist', { cartItemId, userId, wishlistId });

      // Get cart item with full details
      const cartItem = await this.prisma.cartItem.findUnique({
        where: { id: cartItemId },
        include: {
          cart: {
            include: {
              user: true
            }
          },
          product: true,
          variant: true
        }
      });

      if (!cartItem) {
        throw new Error('Cart item not found');
      }

      // Verify ownership
      if (cartItem.cart.userId !== userId) {
        throw new Error('Unauthorized: Cart item does not belong to user');
      }

      // Get or create default wishlist
      let targetWishlistId = wishlistId;
      if (!targetWishlistId) {
        const defaultWishlist = await this.prisma.wishlist.findFirst({
          where: { userId, isDefault: true }
        });
        
        if (defaultWishlist) {
          targetWishlistId = defaultWishlist.id;
        } else {
          // Create default wishlist
          const newWishlist = await this.prisma.wishlist.create({
            data: {
              userId,
              name: 'My Wishlist',
              isDefault: true
            }
          });
          targetWishlistId = newWishlist.id;
        }
      }

      // Verify wishlist ownership
      const wishlist = await this.prisma.wishlist.findUnique({
        where: { id: targetWishlistId }
      });

      if (!wishlist || wishlist.userId !== userId) {
        throw new Error('Wishlist not found or unauthorized');
      }

      // Check if product already in wishlist
      const existingItem = await this.prisma.wishlistItem.findUnique({
        where: {
          wishlistId_productId: {
            wishlistId: targetWishlistId,
            productId: cartItem.productId
          }
        }
      });

      let wishlistItem;
      if (existingItem) {
        // Product already in wishlist, skip adding
        wishlistItem = existingItem;
        this.logger.info('Product already in wishlist', { wishlistItemId: existingItem.id });
      } else {
        // Add to wishlist
        wishlistItem = await this.prisma.wishlistItem.create({
          data: {
            wishlistId: targetWishlistId,
            productId: cartItem.productId
          },
          include: {
            product: true
          }
        });
      }

      // Record move history
      try {
        await this.prisma.cartWishlistMoveHistory.create({
          data: {
            userId,
            productId: cartItem.productId,
            moveType: 'cart_to_wishlist',
            quantity: cartItem.quantity,
            sourceId: cartItem.cartId,
            destinationId: targetWishlistId
          }
        });
      } catch (historyError) {
        // Log history recording error but don't fail the operation
        this.logger.warn('Failed to record move history', {
          error: historyError.message,
          cartItemId,
          userId
        });
      }

      // Remove from cart - wrap in try-catch to prevent errors after successful response
      try {
        await this.prisma.cartItem.delete({
          where: { id: cartItemId }
        });

        // Update cart totals
        await cartService.calculateCartTotals(cartItem.cartId);
      } catch (error) {
        this.logger.error('Error deleting cart item after move to wishlist', {
          cartItemId,
          userId,
          error: error.message
        });

        // Log the error but don't re-throw
        // The move operation has already succeeded at this point
      }

      this.logger.info('Cart item moved to wishlist successfully', {
        cartItemId,
        wishlistItemId: wishlistItem.id
      });

      return {
        success: true,
        cartItem: {
          id: cartItem.id,
          productId: cartItem.productId,
          quantity: cartItem.quantity,
          price: cartItem.price
        },
        wishlistItem: {
          id: wishlistItem.id,
          productId: wishlistItem.productId,
          addedAt: wishlistItem.addedAt
        }
      };
    } catch (error) {
      this.logger.error('Error moving cart item to wishlist', {
        cartItemId,
        userId,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Bulk move cart items to wishlist
   * @param {Array<string>} itemIds - Array of cart item IDs
   * @param {string} userId - User ID
   * @param {string} wishlistId - Optional wishlist ID
   * @returns {Promise<Object>} Bulk move result
   */
  async bulkMoveCartItemsToWishlist(itemIds, userId, wishlistId = null) {
    const results = [];
    let moved = 0;
    let failed = 0;

    try {
      this.logger.info('Bulk moving cart items to wishlist', { itemIds, userId, wishlistId });

      // Get or create default wishlist if not provided
      let targetWishlistId = wishlistId;
      if (!targetWishlistId) {
        const defaultWishlist = await this.prisma.wishlist.findFirst({
          where: { userId, isDefault: true }
        });
        
        if (defaultWishlist) {
          targetWishlistId = defaultWishlist.id;
        } else {
          const newWishlist = await this.prisma.wishlist.create({
            data: {
              userId,
              name: 'My Wishlist',
              isDefault: true
            }
          });
          targetWishlistId = newWishlist.id;
        }
      }

      // Process each item
      for (const itemId of itemIds) {
        try {
          const result = await this.moveCartItemToWishlist(itemId, userId, targetWishlistId);
          results.push({
            itemId,
            success: true,
            error: null
          });
          moved++;
        } catch (error) {
          results.push({
            itemId,
            success: false,
            error: error.message
          });
          failed++;
        }
      }

      this.logger.info('Bulk move completed', { moved, failed });

      return {
        success: true,
        moved,
        failed,
        results
      };
    } catch (error) {
      this.logger.error('Error in bulk move cart items to wishlist', {
        userId,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Move all cart items to wishlist
   * @param {string} userId - User ID
   * @param {string} wishlistId - Optional wishlist ID
   * @returns {Promise<Object>} Move all result
   */
  async moveAllCartItemsToWishlist(userId, wishlistId = null) {
    try {
      this.logger.info('Moving all cart items to wishlist', { userId, wishlistId });

      // Get user's cart
      const cart = await this.prisma.cart.findUnique({
        where: { userId },
        include: {
          items: true
        }
      });

      if (!cart || cart.items.length === 0) {
        return {
          success: true,
          moved: 0,
          failed: 0,
          results: []
        };
      }

      const itemIds = cart.items.map(item => item.id);
      return await this.bulkMoveCartItemsToWishlist(itemIds, userId, wishlistId);
    } catch (error) {
      this.logger.error('Error moving all cart items to wishlist', {
        userId,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Bulk move wishlist items to cart
   * @param {Array<string>} itemIds - Array of wishlist item IDs
   * @param {string} userId - User ID
   * @param {string} cartId - Optional cart ID
   * @returns {Promise<Object>} Bulk move result
   */
  async bulkMoveWishlistItemsToCart(itemIds, userId, cartId = null) {
    const results = [];
    let moved = 0;
    let failed = 0;

    try {
      this.logger.info('Bulk moving wishlist items to cart', { itemIds, userId, cartId });

      // Get or create user's cart
      let targetCartId = cartId;
      if (!targetCartId) {
        const userCart = await this.prisma.cart.findUnique({
          where: { userId }
        });
        
        if (userCart) {
          targetCartId = userCart.id;
        } else {
          // Create cart
          const newCart = await this.prisma.cart.create({
            data: {
              userId
            }
          });
          targetCartId = newCart.id;
        }
      }

      // Get wishlist items
      const wishlistItems = await this.prisma.wishlistItem.findMany({
        where: { id: { in: itemIds } },
        include: {
          wishlist: true,
          product: true
        }
      });

      // Process each item
      for (const wishlistItem of wishlistItems) {
        try {
          // Verify ownership
          if (wishlistItem.wishlist.userId !== userId) {
            throw new Error('Unauthorized: Wishlist item does not belong to user');
          }

          // Check if product already in cart
          const existingCartItem = await this.prisma.cartItem.findFirst({
            where: {
              cartId: targetCartId,
              productId: wishlistItem.productId,
              variantId: null
            }
          });

          if (existingCartItem) {
            // Update quantity
            await this.prisma.cartItem.update({
              where: { id: existingCartItem.id },
              data: {
                quantity: existingCartItem.quantity + 1,
                subtotal: Number(existingCartItem.price) * (existingCartItem.quantity + 1)
              }
            });
          } else {
            // Add to cart
            // Fix: Properly validate and convert salePrice
            const salePriceNum = parseFloat(wishlistItem.product.salePrice);
            const regularPriceNum = parseFloat(wishlistItem.product.regularPrice);
            const hasValidSalePrice = salePriceNum && salePriceNum > 0 && salePriceNum < regularPriceNum;
            const price = hasValidSalePrice ? salePriceNum : regularPriceNum;
            await this.prisma.cartItem.create({
              data: {
                cartId: targetCartId,
                productId: wishlistItem.productId,
                quantity: 1,
                price: parseFloat(price),
                subtotal: parseFloat(price)
              },
              select: {
                id: true,
                cartId: true,
                productId: true,
                quantity: true,
                price: true,
                subtotal: true,
                addedAt: true,
                product: {
                  select: {
                    id: true,
                    name: true,
                    slug: true,
                    regularPrice: true,
                    salePrice: true,
                    images: true
                  }
                }
              }
            });
          }

          // Record move history
          await this.prisma.cartWishlistMoveHistory.create({
            data: {
              userId,
              productId: wishlistItem.productId,
              moveType: 'wishlist_to_cart',
              quantity: 1,
              sourceId: wishlistItem.wishlistId,
              destinationId: targetCartId
            }
          });

          // Remove from wishlist
          await this.prisma.wishlistItem.delete({
            where: { id: wishlistItem.id }
          });

          results.push({
            itemId: wishlistItem.id,
            success: true,
            error: null
          });
          moved++;
        } catch (error) {
          results.push({
            itemId: wishlistItem.id,
            success: false,
            error: error.message
          });
          failed++;
        }
      }

      // Update cart totals
      await cartService.calculateCartTotals(targetCartId);

      this.logger.info('Bulk move wishlist items to cart completed', { moved, failed });

      return {
        success: true,
        moved,
        failed,
        results
      };
    } catch (error) {
      this.logger.error('Error in bulk move wishlist items to cart', {
        userId,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Move all wishlist items to cart
   * @param {string} wishlistId - Wishlist ID
   * @param {string} userId - User ID
   * @param {string} cartId - Optional cart ID
   * @returns {Promise<Object>} Move all result
   */
  async moveAllWishlistItemsToCart(wishlistId, userId, cartId = null) {
    try {
      this.logger.info('Moving all wishlist items to cart', { wishlistId, userId, cartId });

      // Verify wishlist ownership
      const wishlist = await this.prisma.wishlist.findUnique({
        where: { id: wishlistId },
        include: {
          items: true
        }
      });

      if (!wishlist || wishlist.userId !== userId) {
        throw new Error('Wishlist not found or unauthorized');
      }

      if (wishlist.items.length === 0) {
        return {
          success: true,
          moved: 0,
          failed: 0,
          results: []
        };
      }

      const itemIds = wishlist.items.map(item => item.id);
      return await this.bulkMoveWishlistItemsToCart(itemIds, userId, cartId);
    } catch (error) {
      this.logger.error('Error moving all wishlist items to cart', {
        wishlistId,
        userId,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Get move history for a user
   * @param {string} userId - User ID
   * @param {Object} filters - Optional filters
   * @returns {Promise<Object>} Move history
   */
  async getMoveHistory(userId, filters = {}) {
    try {
      const { productId, moveType, startDate, endDate, page = 1, limit = 20 } = filters;
      const skip = (page - 1) * limit;

      const where = { userId };
      
      if (productId) where.productId = productId;
      if (moveType) where.moveType = moveType;
      if (startDate || endDate) {
        where.createdAt = {};
        if (startDate) where.createdAt.gte = new Date(startDate);
        if (endDate) where.createdAt.lte = new Date(endDate);
      }

      const history = await this.prisma.cartWishlistMoveHistory.findMany({
        where,
        include: {
          product: {
            include: {
              images: {
                where: { displayOrder: 0 },
                take: 1
              }
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      });

      const total = await this.prisma.cartWishlistMoveHistory.count({ where });

      return {
        history,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      this.logger.error('Error getting move history', { userId, error: error.message });
      throw error;
    }
  }
}

module.exports = {
  cartWishlistIntegrationService: new CartWishlistIntegrationService()
};
