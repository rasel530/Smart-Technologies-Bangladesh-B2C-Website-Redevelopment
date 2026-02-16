const { PrismaClient } = require('@prisma/client');
const { loggerService } = require('./logger');
const { cartService } = require('./cartService');
const crypto = require('crypto');
const PDFDocument = require('pdfkit');

/**
 * Wishlist Service
 * 
 * Business logic layer for wishlist management including:
 * - Wishlist CRUD operations
 * - Wishlist item management
 * - Wishlist sharing
 * - Wishlist analytics
 * - Move to cart functionality
 */
class WishlistService {
  constructor() {
    this.prisma = new PrismaClient();
    this.logger = loggerService;
  }

  /**
   * Get all wishlists for a user
   * @param {string} userId - User ID
   * @param {boolean} includeItems - Whether to include wishlist items
   * @param {number} page - Page number for pagination
   * @param {number} limit - Number of items per page
   * @returns {Promise<Object>} Paginated wishlists
   */
  async getUserWishlists(userId, includeItems = false, page = 1, limit = 10) {
    try {
      const skip = (page - 1) * limit;

      const wishlists = await this.prisma.wishlist.findMany({
        where: { userId },
        include: includeItems ? {
          items: {
            include: {
              product: {
                include: {
                  images: {
                    where: { displayOrder: 0 },
                    take: 1,
                    select: { id: true, originalUrl: true, optimizedUrl: true, thumbnailUrl: true, altTextEn: true, altTextBn: true }
                  }
                }
              }
            },
            orderBy: { addedAt: 'desc' },
            take: 5 // Limit preview items
          },
          _count: {
            select: { items: true }
          }
        } : {
          _count: {
            select: { items: true }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      });

      const total = await this.prisma.wishlist.count({
        where: { userId }
      });

      return {
        wishlists,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      this.logger.error('Error fetching user wishlists', { userId, error: error.message });
      throw error;
    }
  }

  /**
   * Get a specific wishlist by ID
   * @param {string} id - Wishlist ID
   * @param {boolean} includeItems - Whether to include wishlist items
   * @returns {Promise<Object>} Wishlist object
   */
  async getWishlistById(id, includeItems = true) {
    try {
      const wishlist = await this.prisma.wishlist.findUnique({
        where: { id },
        include: includeItems ? {
          items: {
            include: {
              product: {
                include: {
                  images: {
                    where: { displayOrder: 0 },
                    take: 1,
                    select: { id: true, originalUrl: true, optimizedUrl: true, thumbnailUrl: true, altTextEn: true, altTextBn: true }
                  }
                }
              }
            },
            orderBy: { addedAt: 'desc' }
          },
          _count: {
            select: { items: true }
          }
        } : {
          _count: {
            select: { items: true }
          }
        }
      });

      return wishlist;
    } catch (error) {
      this.logger.error('Error fetching wishlist by ID', { id, error: error.message });
      throw error;
    }
  }

  /**
   * Get a wishlist by share token (public access)
   * @param {string} shareToken - Share token
   * @returns {Promise<Object>} Wishlist object
   */
  async getWishlistByShareToken(shareToken) {
    try {
      const wishlist = await this.prisma.wishlist.findUnique({
        where: { shareToken },
        include: {
          items: {
            include: {
              product: {
                include: {
                  images: {
                    where: { displayOrder: 0 },
                    take: 1,
                    select: { id: true, originalUrl: true, optimizedUrl: true, thumbnailUrl: true, altTextEn: true, altTextBn: true }
                  }
                }
              }
            },
            orderBy: { addedAt: 'desc' }
          },
          _count: {
            select: { items: true }
          },
          user: {
            select: { id: true, firstName: true, lastName: true }
          }
        }
      });

      if (!wishlist) {
        throw new Error('Wishlist not found');
      }

      // Track analytics event
      await this.trackWishlistEvent(wishlist.id, 'view', null, { accessedVia: 'shareToken' });

      return wishlist;
    } catch (error) {
      this.logger.error('Error fetching wishlist by share token', { shareToken, error: error.message });
      throw error;
    }
  }

  /**
   * Create a new wishlist
   * @param {string} userId - User ID
   * @param {Object} data - Wishlist data
   * @returns {Promise<Object>} Created wishlist
   */
  async createWishlist(userId, data) {
    try {
      const { name, isDefault, isPublic } = data;

      // If setting as default, remove default flag from other wishlists
      if (isDefault) {
        await this.prisma.wishlist.updateMany({
          where: {
            userId,
            isDefault: true
          },
          data: {
            isDefault: false
          }
        });
      }

      const wishlist = await this.prisma.wishlist.create({
        data: {
          userId,
          name: name || 'My Wishlist',
          isDefault: isDefault || false,
          isPublic: isPublic || false
        }
      });

      // Track analytics event
      await this.trackWishlistEvent(wishlist.id, 'create', userId);

      this.logger.info('Wishlist created', { wishlistId: wishlist.id, userId });
      return wishlist;
    } catch (error) {
      this.logger.error('Error creating wishlist', { userId, error: error.message });
      throw error;
    }
  }

  /**
   * Update a wishlist
   * @param {string} id - Wishlist ID
   * @param {Object} data - Wishlist data to update
   * @returns {Promise<Object>} Updated wishlist
   */
  async updateWishlist(id, data) {
    try {
      const { name, isDefault, isPublic } = data;

      // Get current wishlist
      const currentWishlist = await this.prisma.wishlist.findUnique({
        where: { id },
        select: { userId: true, isDefault: true }
      });

      if (!currentWishlist) {
        throw new Error('Wishlist not found');
      }

      // If setting as default, remove default flag from other wishlists
      if (isDefault && !currentWishlist.isDefault) {
        await this.prisma.wishlist.updateMany({
          where: {
            userId: currentWishlist.userId,
            isDefault: true
          },
          data: {
            isDefault: false
          }
        });
      }

      const wishlist = await this.prisma.wishlist.update({
        where: { id },
        data: {
          ...(name !== undefined && { name }),
          ...(isDefault !== undefined && { isDefault }),
          ...(isPublic !== undefined && { isPublic })
        }
      });

      // Track analytics event
      await this.trackWishlistEvent(id, 'update', currentWishlist.userId);

      this.logger.info('Wishlist updated', { wishlistId: id });
      return wishlist;
    } catch (error) {
      this.logger.error('Error updating wishlist', { id, error: error.message });
      throw error;
    }
  }

  /**
   * Delete a wishlist
   * @param {string} id - Wishlist ID
   * @returns {Promise<Object>} Deletion result
   */
  async deleteWishlist(id) {
    try {
      // Get wishlist before deletion for analytics
      const wishlist = await this.prisma.wishlist.findUnique({
        where: { id },
        select: { userId: true }
      });

      if (!wishlist) {
        throw new Error('Wishlist not found');
      }

      await this.prisma.wishlist.delete({
        where: { id }
      });

      this.logger.info('Wishlist deleted', { wishlistId: id, userId: wishlist.userId });
      return { success: true };
    } catch (error) {
      this.logger.error('Error deleting wishlist', { id, error: error.message });
      throw error;
    }
  }

  /**
   * Add a product to a wishlist
   * @param {string} wishlistId - Wishlist ID
   * @param {string} productId - Product ID
   * @param {string} userId - User ID for analytics
   * @returns {Promise<Object>} Created wishlist item
   */
  async addItemToWishlist(wishlistId, productId, userId) {
    try {
      // Validate wishlist exists
      const wishlist = await this.prisma.wishlist.findUnique({
        where: { id: wishlistId }
      });

      if (!wishlist) {
        throw new Error('Wishlist not found');
      }

      // Validate product exists
      const product = await this.prisma.product.findUnique({
        where: { id: productId }
      });

      if (!product) {
        throw new Error('Product not found');
      }

      // Check if item already exists
      const existingItem = await this.prisma.wishlistItem.findFirst({
        where: {
          wishlistId,
          productId
        }
      });

      if (existingItem) {
        throw new Error('Product already in wishlist');
      }

      const wishlistItem = await this.prisma.wishlistItem.create({
        data: {
          wishlistId,
          productId
        },
        include: {
          product: true
        }
      });

      // Track analytics event
      await this.trackWishlistEvent(wishlistId, 'add_item', userId, { productId });

      this.logger.info('Item added to wishlist', { wishlistId, productId });
      return wishlistItem;
    } catch (error) {
      this.logger.error('Error adding item to wishlist', { wishlistId, productId, error: error.message });
      throw error;
    }
  }

  /**
   * Remove an item from a wishlist
   * @param {string} wishlistId - Wishlist ID
   * @param {string} itemId - Wishlist item ID
   * @param {string} userId - User ID for analytics
   * @returns {Promise<Object>} Deletion result
   */
  async removeItemFromWishlist(wishlistId, itemId, userId) {
    try {
      // Check if item exists
      const item = await this.prisma.wishlistItem.findFirst({
        where: {
          id: itemId,
          wishlistId
        }
      });

      if (!item) {
        throw new Error('Wishlist item not found');
      }

      await this.prisma.wishlistItem.delete({
        where: { id: itemId }
      });

      // Track analytics event
      await this.trackWishlistEvent(wishlistId, 'remove_item', userId, { productId: item.productId });

      this.logger.info('Item removed from wishlist', { wishlistId, itemId });
      return { success: true };
    } catch (error) {
      this.logger.error('Error removing item from wishlist', { wishlistId, itemId, error: error.message });
      throw error;
    }
  }

  /**
   * Move wishlist items to cart
   * @param {string} wishlistId - Wishlist ID
   * @param {Array<string>} itemIds - Array of wishlist item IDs
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Move result
   */
  async moveItemsToCart(wishlistId, itemIds, userId) {
    try {
      // Get wishlist items
      const items = await this.prisma.wishlistItem.findMany({
        where: {
          id: { in: itemIds },
          wishlistId
        },
        include: {
          product: true
        }
      });

      if (items.length === 0) {
        throw new Error('No valid items found');
      }

      // Get or create user cart
      let cart = await this.prisma.cart.findUnique({
        where: { userId }
      });

      if (!cart) {
        try {
          cart = await this.prisma.cart.create({
            data: {
              userId,
              subtotal: 0,
              tax: 0,
              shippingCost: 0,
              discount: 0,
              total: 0,
              status: 'active'
            }
          });
        } catch (cartError) {
          this.logger.error('Failed to create cart for user', { userId, error: cartError.message });
          throw new Error('Failed to create cart. Please try again.');
        }
      }

      // Move items to cart
      const movedItems = [];
      const failedItems = [];

      for (const item of items) {
        try {
          // Check if item already in cart
          const existingCartItem = await this.prisma.cartItem.findFirst({
            where: {
              cartId: cart.id,
              productId: item.productId
            }
          });

          if (existingCartItem) {
            // Update quantity
            await this.prisma.cartItem.update({
              where: { id: existingCartItem.id },
              data: {
                quantity: existingCartItem.quantity + 1,
                subtotal: parseFloat(existingCartItem.price) * (existingCartItem.quantity + 1)
              }
            });
          } else {
            // Add to cart
            const price = item.product.salePrice || item.product.regularPrice;
            await this.prisma.cartItem.create({
              data: {
                cartId: cart.id,
                productId: item.productId,
                quantity: 1,
                price: parseFloat(price),
                subtotal: parseFloat(price)
              }
            });
          }

          // Remove from wishlist
          await this.prisma.wishlistItem.delete({
            where: { id: item.id }
          });

          movedItems.push({
            itemId: item.id,
            productId: item.productId,
            productName: item.product.name
          });

          // Track analytics event
          await this.trackWishlistEvent(wishlistId, 'remove_item', userId, { productId: item.productId, movedToCart: true });
        } catch (itemError) {
          failedItems.push({
            itemId: item.id,
            productId: item.productId,
            error: itemError.message
          });
        }
      }

      // Recalculate cart totals
      const totals = await cartService.calculateCartTotals(cart.id);

      this.logger.info('Items moved to cart', { wishlistId, movedCount: movedItems.length, failedCount: failedItems.length });

      return {
        success: true,
        cartId: cart.id,
        movedItems,
        failedItems,
        totals
      };
    } catch (error) {
      this.logger.error('Error moving items to cart', { wishlistId, itemIds, error: error.message });
      throw error;
    }
  }

  /**
   * Generate share token for a wishlist
   * @param {string} wishlistId - Wishlist ID
   * @returns {Promise<Object>} Share token and URL
   */
  async generateShareToken(wishlistId) {
    try {
      // Validate wishlist exists
      const wishlist = await this.prisma.wishlist.findUnique({
        where: { id: wishlistId },
        select: { userId: true, isPublic: true }
      });

      if (!wishlist) {
        throw new Error('Wishlist not found');
      }

      // Generate unique token
      const shareToken = crypto.randomBytes(32).toString('hex');

      // Update wishlist with share token
      const updatedWishlist = await this.prisma.wishlist.update({
        where: { id: wishlistId },
        data: {
          shareToken,
          isPublic: true
        }
      });

      // Track analytics event
      await this.trackWishlistEvent(wishlistId, 'share', wishlist.userId);

      const shareUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/wishlist/shared/${shareToken}`;

      this.logger.info('Share token generated', { wishlistId, shareToken });
      return {
        shareToken,
        shareUrl
      };
    } catch (error) {
      this.logger.error('Error generating share token', { wishlistId, error: error.message });
      throw error;
    }
  }

  /**
   * Export wishlist as CSV
   * @param {string} wishlistId - Wishlist ID
   * @returns {Promise<string>} CSV content
   */
  async exportWishlistAsCSV(wishlistId) {
    try {
      const wishlist = await this.prisma.wishlist.findUnique({
        where: { id: wishlistId },
        include: {
          items: {
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
            orderBy: { addedAt: 'desc' }
          }
        }
      });

      if (!wishlist) {
        throw new Error('Wishlist not found');
      }

      // Generate CSV header
      const csvHeader = 'Product Name,SKU,Price,Added At,Image URL\n';

      // Generate CSV rows
      const csvRows = wishlist.items.map(item => {
        const product = item.product;
        const imageUrl = product.images[0]?.originalUrl || '';
        const price = product.salePrice || product.regularPrice;
        const addedAt = new Date(item.addedAt).toISOString();

        return `"${product.name}","${product.sku}","${price}","${addedAt}","${imageUrl}"`;
      }).join('\n');

      const csvContent = csvHeader + csvRows;

      // Track analytics event
      await this.trackWishlistEvent(wishlistId, 'export', wishlist.userId, { format: 'csv' });

      this.logger.info('Wishlist exported as CSV', { wishlistId });
      return csvContent;
    } catch (error) {
      this.logger.error('Error exporting wishlist as CSV', { wishlistId, error: error.message });
      throw error;
    }
  }

  /**
   * Export wishlist as PDF
   * @param {string} wishlistId - Wishlist ID
   * @returns {Promise<Buffer>} PDF buffer
   */
  async exportWishlistAsPDF(wishlistId) {
    try {
      const wishlist = await this.prisma.wishlist.findUnique({
        where: { id: wishlistId },
        include: {
          items: {
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
            orderBy: { addedAt: 'desc' }
          }
        }
      });

      if (!wishlist) {
        throw new Error('Wishlist not found');
      }

      // Create PDF document
      const doc = new PDFDocument({ size: 'A4', margin: 50 });
      const chunks = [];

      // Collect PDF chunks
      doc.on('data', (chunk) => chunks.push(chunk));

      // Return promise that resolves when PDF is generated
      return new Promise((resolve, reject) => {
        try {
          // Add title
          doc.fontSize(24)
             .font('Helvetica-Bold')
             .text('Wishlist', { align: 'center' });
          
          doc.moveDown();
          
          // Add wishlist name
          doc.fontSize(18)
             .text(wishlist.name, { align: 'center' });
          
          doc.moveDown();
          
          // Add metadata
          doc.fontSize(10)
             .font('Helvetica')
             .text(`Created: ${new Date(wishlist.createdAt).toLocaleDateString()}`)
             .text(`Total Items: ${wishlist.items.length}`);
          
          doc.moveDown();
          
          // Add separator line
          doc.moveTo(50, doc.y)
             .lineTo(545, doc.y)
             .stroke();
          
          doc.moveDown();
          
          // Add items
          if (wishlist.items.length > 0) {
            wishlist.items.forEach((item, index) => {
              const product = item.product;
              const price = product.salePrice || product.regularPrice;
              
              // Item number and name
              doc.fontSize(12)
                 .font('Helvetica-Bold')
                 .text(`${index + 1}. ${product.name}`);
              
              // Item details
              doc.fontSize(10)
                 .font('Helvetica')
                 .text(`   SKU: ${product.sku || 'N/A'}`)
                 .text(`   Price: ${typeof price === 'number' ? price.toFixed(2) : price}`)
                 .text(`   Added: ${new Date(item.addedAt).toLocaleDateString()}`);
              
              doc.moveDown();
            });
          } else {
            doc.fontSize(12)
               .text('No items in this wishlist.');
          }
          
          // Add footer
          doc.moveTo(50, 750)
             .lineTo(545, 750)
             .stroke();
          
          doc.fontSize(8)
             .text('Generated by Smart Technologies Bangladesh', { align: 'center' });
          
          // Finalize PDF
          doc.on('end', () => {
            const pdfBuffer = Buffer.concat(chunks);
            
            // Track analytics event
            this.trackWishlistEvent(wishlistId, 'export', wishlist.userId, { format: 'pdf' })
              .catch(err => this.logger.warn('Failed to track analytics', { error: err.message }));
            
            this.logger.info('Wishlist exported as PDF', { wishlistId });
            resolve(pdfBuffer);
          });
          
          doc.end();
        } catch (error) {
          reject(error);
        }
      });
    } catch (error) {
      this.logger.error('Error exporting wishlist as PDF', { wishlistId, error: error.message });
      throw error;
    }
  }

  /**
   * Get wishlist analytics (admin only)
   * @param {Date} startDate - Start date for analytics
   * @param {Date} endDate - End date for analytics
   * @returns {Promise<Object>} Analytics data
   */
  async getAnalytics(startDate, endDate) {
    try {
      const where = {};
      if (startDate || endDate) {
        where.createdAt = {};
        if (startDate) {
          where.createdAt.gte = startDate;
        }
        if (endDate) {
          where.createdAt.lte = endDate;
        }
      }

      // Get analytics events
      const events = await this.prisma.wishlistAnalytics.findMany({
        where,
        orderBy: { createdAt: 'desc' }
      });

      // Aggregate data
      const eventCounts = events.reduce((acc, event) => {
        acc[event.eventType] = (acc[event.eventType] || 0) + 1;
        return acc;
      }, {});

      // Get total wishlists
      const totalWishlists = await this.prisma.wishlist.count();

      // Get total wishlist items
      const totalItems = await this.prisma.wishlistItem.count();

      // Get public wishlists count
      const publicWishlists = await this.prisma.wishlist.count({
        where: { isPublic: true }
      });

      this.logger.info('Wishlist analytics retrieved', { startDate, endDate });
      return {
        summary: {
          totalWishlists,
          totalItems,
          publicWishlists,
          totalEvents: events.length
        },
        events: eventCounts,
        recentEvents: events.slice(0, 100) // Last 100 events
      };
    } catch (error) {
      this.logger.error('Error fetching wishlist analytics', { startDate, endDate, error: error.message });
      throw error;
    }
  }

  /**
   * Track wishlist analytics event
   * @param {string} wishlistId - Wishlist ID
   * @param {string} eventType - Event type
   * @param {string} userId - User ID
   * @param {Object} metadata - Additional metadata
   * @returns {Promise<void>}
   */
  async trackWishlistEvent(wishlistId, eventType, userId = null, metadata = {}) {
    try {
      await this.prisma.wishlistAnalytics.create({
        data: {
          wishlistId,
          eventType,
          userId,
          metadata
        }
      });
    } catch (error) {
      // Log analytics errors for debugging but don't throw
      // Analytics failures should not break the main functionality
      this.logger.warn('Error tracking wishlist event', { 
        wishlistId, 
        eventType, 
        userId,
        error: error.message,
        stack: error.stack 
      });
    }
  }

  /**
   * Verify wishlist ownership
   * @param {string} wishlistId - Wishlist ID
   * @param {string} userId - User ID
   * @returns {Promise<boolean>} True if user owns wishlist
   */
  async verifyOwnership(wishlistId, userId) {
    try {
      const wishlist = await this.prisma.wishlist.findUnique({
        where: { id: wishlistId },
        select: { userId: true }
      });

      if (!wishlist) {
        throw new Error('Wishlist not found');
      }

      return wishlist.userId === userId;
    } catch (error) {
      this.logger.error('Error verifying wishlist ownership', { wishlistId, userId, error: error.message });
      throw error;
    }
  }

  /**
   * Get user's default wishlist
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Default wishlist
   */
  async getDefaultWishlist(userId) {
    try {
      const wishlist = await this.prisma.wishlist.findFirst({
        where: {
          userId,
          isDefault: true
        },
        include: {
          items: {
            include: {
              product: {
                include: {
                  images: {
                    where: { displayOrder: 0 },
                    take: 1,
                    select: { id: true, originalUrl: true, optimizedUrl: true, thumbnailUrl: true, altTextEn: true, altTextBn: true }
                  }
                }
              }
            },
            orderBy: { addedAt: 'desc' }
          },
          _count: {
            select: { items: true }
          }
        }
      });

      return wishlist;
    } catch (error) {
      this.logger.error('Error fetching default wishlist', { userId, error: error.message });
      throw error;
    }
  }
}

// Singleton instance
const wishlistService = new WishlistService();

module.exports = {
  WishlistService,
  wishlistService
};
