const { wishlistService } = require('../services/wishlistService');
const { loggerService } = require('../services/logger');
const { authMiddleware } = require('../middleware/auth');

/**
 * Wishlist Controller
 * 
 * Request handlers for wishlist operations
 */

class WishlistController {
  /**
   * Get all wishlists for authenticated user
   * GET /api/wishlists
   */
  async getWishlists(req, res) {
    try {
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required',
          message: 'You must be authenticated to access your wishlists',
          messageBn: 'আপনাকে প্রমাণীকরণ করতে হবে'
        });
      }

      const includeItems = req.query.includeItems === 'true';
      let page = parseInt(req.query.page) || 1;
      let limit = parseInt(req.query.limit) || 10;

      // Validate pagination parameters
      if (isNaN(page) || page < 1) {
        page = 1;
      }
      if (isNaN(limit) || limit < 1) {
        limit = 10;
      }
      if (limit > 100) {
        limit = 100;
      }

      const result = await wishlistService.getUserWishlists(userId, includeItems, page, limit);

      res.json({
        success: true,
        message: 'Wishlists retrieved successfully',
        messageBn: 'উইশলিস্টগুলি সফলভাবে পুনরুদ্ধার করা হয়েছে',
        data: result
      });
    } catch (error) {
      loggerService.error('Error in getWishlists controller', {
        error: error.message,
        userId: req.user?.id
      });

      let statusCode = 500;
      let errorMessage = 'Failed to retrieve wishlists';
      let errorMessageBn = 'উইশলিস্টগুলি পুনরুদ্ধার করতে ব্যর্থ হয়েছে';

      if (error.message.includes('not found')) {
        statusCode = 404;
        errorMessage = 'Wishlist not found';
        errorMessageBn = 'উইশলিস্ট পাওয়া যায়নি';
      }

      res.status(statusCode).json({
        success: false,
        error: error.message || errorMessage,
        message: errorMessage,
        messageBn: errorMessageBn
      });
    }
  }

  /**
   * Create a new wishlist
   * POST /api/wishlists
   */
  async createWishlist(req, res) {
    try {
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required',
          message: 'You must be authenticated to create a wishlist',
          messageBn: 'উইশলিস্ট তৈরি করতে আপনাকে প্রমাণীকরণ করতে হবে'
        });
      }

      const { name, isDefault, isPublic } = req.body;

      const wishlist = await wishlistService.createWishlist(userId, {
        name,
        isDefault,
        isPublic
      });

      res.status(201).json({
        success: true,
        message: 'Wishlist created successfully',
        messageBn: 'উইশলিস্ট সফলভাবে তৈরি করা হয়েছে',
        data: wishlist
      });
    } catch (error) {
      loggerService.error('Error in createWishlist controller', {
        error: error.message,
        userId: req.user?.id
      });

      let statusCode = 500;
      let errorMessage = 'Failed to create wishlist';
      let errorMessageBn = 'উইশলিস্ট তৈরি করতে ব্যর্থ হয়েছে';

      res.status(statusCode).json({
        success: false,
        error: error.message || errorMessage,
        message: errorMessage,
        messageBn: errorMessageBn
      });
    }
  }

  /**
   * Get a specific wishlist by ID
   * GET /api/wishlists/:id
   */
  async getWishlistById(req, res) {
    try {
      const { id } = req.params;
      const includeItems = req.query.includeItems !== 'false';

      const wishlist = await wishlistService.getWishlistById(id, includeItems);

      if (!wishlist) {
        return res.status(404).json({
          success: false,
          error: 'Wishlist not found',
          message: 'The requested wishlist was not found',
          messageBn: 'অনুরোধ করা উইশলিস্ট পাওয়া যায়নি'
        });
      }

      res.json({
        success: true,
        message: 'Wishlist retrieved successfully',
        messageBn: 'উইশলিস্ট সফলভাবে পুনরুদ্ধার করা হয়েছে',
        data: wishlist
      });
    } catch (error) {
      loggerService.error('Error in getWishlistById controller', {
        error: error.message,
        wishlistId: req.params.id
      });

      res.status(500).json({
        success: false,
        error: 'Failed to retrieve wishlist',
        message: 'Failed to retrieve wishlist',
        messageBn: 'উইশলিস্ট পুনরুদ্ধার করতে ব্যর্থ হয়েছে'
      });
    }
  }

  /**
   * Update a wishlist
   * PUT /api/wishlists/:id
   */
  async updateWishlist(req, res) {
    try {
      const { id } = req.params;
      const { name, isDefault, isPublic } = req.body;

      const wishlist = await wishlistService.updateWishlist(id, {
        name,
        isDefault,
        isPublic
      });

      res.json({
        success: true,
        message: 'Wishlist updated successfully',
        messageBn: 'উইশলিস্ট সফলভাবে আপডেট করা হয়েছে',
        data: wishlist
      });
    } catch (error) {
      loggerService.error('Error in updateWishlist controller', {
        error: error.message,
        wishlistId: req.params.id
      });

      let statusCode = 500;
      let errorMessage = 'Failed to update wishlist';
      let errorMessageBn = 'উইশলিস্ট আপডেট করতে ব্যর্থ হয়েছে';

      if (error.message.includes('not found')) {
        statusCode = 404;
        errorMessage = 'Wishlist not found';
        errorMessageBn = 'উইশলিস্ট পাওয়া যায়নি';
      }

      res.status(statusCode).json({
        success: false,
        error: error.message || errorMessage,
        message: errorMessage,
        messageBn: errorMessageBn
      });
    }
  }

  /**
   * Delete a wishlist
   * DELETE /api/wishlists/:id
   */
  async deleteWishlist(req, res) {
    try {
      const { id } = req.params;

      const result = await wishlistService.deleteWishlist(id);

      res.json({
        success: true,
        message: 'Wishlist deleted successfully',
        messageBn: 'উইশলিস্ট সফলভাবে মুছে ফেলা হয়েছে',
        data: result
      });
    } catch (error) {
      loggerService.error('Error in deleteWishlist controller', {
        error: error.message,
        wishlistId: req.params.id
      });

      let statusCode = 500;
      let errorMessage = 'Failed to delete wishlist';
      let errorMessageBn = 'উইশলিস্ট মুছে ফেলতে ব্যর্থ হয়েছে';

      if (error.message.includes('not found')) {
        statusCode = 404;
        errorMessage = 'Wishlist not found';
        errorMessageBn = 'উইশলিস্ট পাওয়া যায়নি';
      }

      res.status(statusCode).json({
        success: false,
        error: error.message || errorMessage,
        message: errorMessage,
        messageBn: errorMessageBn
      });
    }
  }

  /**
   * Add a product to a wishlist
   * POST /api/wishlists/:id/items
   */
  async addItemToWishlist(req, res) {
    try {
      const { id: wishlistId } = req.params;
      const { productId } = req.body;
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required',
          message: 'You must be authenticated to add items to a wishlist',
          messageBn: 'উইশলিস্টে আইটেম যোগ করতে আপনাকে প্রমাণীকরণ করতে হবে'
        });
      }

      const wishlistItem = await wishlistService.addItemToWishlist(wishlistId, productId, userId);

      res.status(201).json({
        success: true,
        message: 'Item added to wishlist successfully',
        messageBn: 'আইটেম সফলভাবে উইশলিস্টে যোগ করা হয়েছে',
        data: wishlistItem
      });
    } catch (error) {
      loggerService.error('Error in addItemToWishlist controller', {
        error: error.message,
        wishlistId: req.params.id,
        productId: req.body.productId
      });

      let statusCode = 500;
      let errorMessage = 'Failed to add item to wishlist';
      let errorMessageBn = 'উইশলিস্টে আইটেম যোগ করতে ব্যর্থ হয়েছে';

      if (error.message.includes('Wishlist not found')) {
        statusCode = 404;
        errorMessage = 'Wishlist not found';
        errorMessageBn = 'উইশলিস্ট পাওয়া যায়নি';
      } else if (error.message.includes('Product not found')) {
        statusCode = 404;
        errorMessage = 'Product not found';
        errorMessageBn = 'পণ্যটি পাওয়া যায়নি';
      } else if (error.message.includes('already in wishlist')) {
        statusCode = 409;
        errorMessage = 'Product already in wishlist';
        errorMessageBn = 'পণ্যটি ইতিমধ্যে উইশলিস্টে আছে';
      }

      res.status(statusCode).json({
        success: false,
        error: error.message || errorMessage,
        message: errorMessage,
        messageBn: errorMessageBn
      });
    }
  }

  /**
   * Remove an item from a wishlist
   * DELETE /api/wishlists/:id/items/:itemId
   */
  async removeItemFromWishlist(req, res) {
    try {
      const { id: wishlistId, itemId } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required',
          message: 'You must be authenticated to remove items from a wishlist',
          messageBn: 'উইশলিস্ট থেকে আইটেম সরাতে আপনাকে প্রমাণীকরণ করতে হবে'
        });
      }

      const result = await wishlistService.removeItemFromWishlist(wishlistId, itemId, userId);

      res.json({
        success: true,
        message: 'Item removed from wishlist successfully',
        messageBn: 'আইটেম সফলভাবে উইশলিস্ট থেকে সরানো হয়েছে',
        data: result
      });
    } catch (error) {
      loggerService.error('Error in removeItemFromWishlist controller', {
        error: error.message,
        wishlistId: req.params.id,
        itemId: req.params.itemId
      });

      let statusCode = 500;
      let errorMessage = 'Failed to remove item from wishlist';
      let errorMessageBn = 'উইশলিস্ট থেকে আইটেম সরাতে ব্যর্থ হয়েছে';

      if (error.message.includes('not found')) {
        statusCode = 404;
        errorMessage = 'Wishlist item not found';
        errorMessageBn = 'উইশলিস্ট আইটেম পাওয়া যায়নি';
      }

      res.status(statusCode).json({
        success: false,
        error: error.message || errorMessage,
        message: errorMessage,
        messageBn: errorMessageBn
      });
    }
  }

  /**
   * Move wishlist items to cart
   * POST /api/wishlists/:id/items/move-to-cart
   */
  async moveItemsToCart(req, res) {
    try {
      const { id: wishlistId } = req.params;
      const { itemIds } = req.body;
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required',
          message: 'You must be authenticated to move items to cart',
          messageBn: 'কার্টে আইটেম সরাতে আপনাকে প্রমাণীকরণ করতে হবে'
        });
      }

      const result = await wishlistService.moveItemsToCart(wishlistId, itemIds, userId);

      res.json({
        success: true,
        message: result.failedItems.length > 0
          ? 'Some items moved to cart successfully'
          : 'All items moved to cart successfully',
        messageBn: result.failedItems.length > 0
          ? 'কিছু আইটেম সফলভাবে কার্টে সরানো হয়েছে'
          : 'সব আইটেম সফলভাবে কার্টে সরানো হয়েছে',
        data: result
      });
    } catch (error) {
      loggerService.error('Error in moveItemsToCart controller', {
        error: error.message,
        wishlistId: req.params.id,
        itemIds: req.body.itemIds
      });

      let statusCode = 500;
      let errorMessage = 'Failed to move items to cart';
      let errorMessageBn = 'কার্টে আইটেম সরাতে ব্যর্থ হয়েছে';

      if (error.message.includes('not found')) {
        statusCode = 404;
        errorMessage = 'Wishlist not found';
        errorMessageBn = 'উইশলিস্ট পাওয়া যায়নি';
      } else if (error.message.includes('No valid items')) {
        statusCode = 400;
        errorMessage = 'No valid items found';
        errorMessageBn = 'কোনো বৈধ আইটেম পাওয়া যায়নি';
      }

      res.status(statusCode).json({
        success: false,
        error: error.message || errorMessage,
        message: errorMessage,
        messageBn: errorMessageBn
      });
    }
  }

  /**
   * Get all items in a specific wishlist
   * GET /api/wishlists/:id/items
   */
  async getWishlistItems(req, res, next) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      // Get wishlist with items
      const wishlist = await wishlistService.getWishlistById(id, true, userId);

      if (!wishlist) {
        return res.status(404).json({
          success: false,
          message: 'Wishlist not found',
          messageBn: 'উইশলিস্ট পাওয়া যায়নি'
        });
      }

      // Return only the items
      res.json({
        success: true,
        message: 'Wishlist items retrieved successfully',
        messageBn: 'উইশলিস্ট আইটেমগুলি সফলভাবে পুনরুদ্ধার করা হয়েছে',
        data: {
          wishlistId: wishlist.id,
          items: wishlist.items || []
        }
      });
    } catch (error) {
      loggerService.error('Error in getWishlistItems controller', {
        error: error.message,
        wishlistId: req.params.id,
        userId: req.user?.id
      });
      next(error);
    }
  }

  /**
   * Move a single item from wishlist to cart
   * POST /api/wishlists/:id/items/:itemId/move-to-cart
   */
  async moveSingleItemToCart(req, res, next) {
    try {
      const { id, itemId } = req.params;
      const userId = req.user.id;

      // Move single item to cart
      const result = await wishlistService.moveItemsToCart(id, [itemId], userId);

      res.json({
        success: true,
        message: 'Item moved to cart successfully',
        messageBn: 'আইটেম সফলভাবে কার্টে সরানো হয়েছে',
        data: result
      });
    } catch (error) {
      loggerService.error('Error in moveSingleItemToCart controller', {
        error: error.message,
        wishlistId: req.params.id,
        itemId: req.params.itemId,
        userId: req.user?.id
      });
      next(error);
    }
  }

  /**
   * Generate share token for a wishlist
   * POST /api/wishlists/:id/share
   */
  async generateShareToken(req, res) {
    try {
      const { id: wishlistId } = req.params;

      const shareData = await wishlistService.generateShareToken(wishlistId);

      res.json({
        success: true,
        message: 'Share token generated successfully',
        messageBn: 'শেয়ার টোকেন সফলভাবে তৈরি করা হয়েছে',
        data: shareData
      });
    } catch (error) {
      loggerService.error('Error in generateShareToken controller', {
        error: error.message,
        wishlistId: req.params.id
      });

      let statusCode = 500;
      let errorMessage = 'Failed to generate share token';
      let errorMessageBn = 'শেয়ার টোকেন তৈরি করতে ব্যর্থ হয়েছে';

      if (error.message.includes('not found')) {
        statusCode = 404;
        errorMessage = 'Wishlist not found';
        errorMessageBn = 'উইশলিস্ট পাওয়া যায়নি';
      }

      res.status(statusCode).json({
        success: false,
        error: error.message || errorMessage,
        message: errorMessage,
        messageBn: errorMessageBn
      });
    }
  }

  /**
   * Access a shared wishlist
   * GET /api/wishlists/shared/:shareToken
   */
  async getSharedWishlist(req, res) {
    try {
      const { shareToken } = req.params;

      const wishlist = await wishlistService.getWishlistByShareToken(shareToken);

      res.json({
        success: true,
        message: 'Shared wishlist retrieved successfully',
        messageBn: 'শেয়ার করা উইশলিস্ট সফলভাবে পুনরুদ্ধার করা হয়েছে',
        data: wishlist
      });
    } catch (error) {
      loggerService.error('Error in getSharedWishlist controller', {
        error: error.message,
        shareToken: req.params.shareToken
      });

      let statusCode = 500;
      let errorMessage = 'Failed to retrieve shared wishlist';
      let errorMessageBn = 'শেয়ার করা উইশলিস্ট পুনরুদ্ধার করতে ব্যর্থ হয়েছে';

      if (error.message.includes('not found')) {
        statusCode = 404;
        errorMessage = 'Shared wishlist not found';
        errorMessageBn = 'শেয়ার করা উইশলিস্ট পাওয়া যায়নি';
      }

      res.status(statusCode).json({
        success: false,
        error: error.message || errorMessage,
        message: errorMessage,
        messageBn: errorMessageBn
      });
    }
  }

  /**
   * Export a wishlist
   * GET /api/wishlists/:id/export
   */
  async exportWishlist(req, res) {
    try {
      const { id: wishlistId } = req.params;
      const { format } = req.query;
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required',
          message: 'You must be authenticated to export a wishlist',
          messageBn: 'উইশলিস্ট এক্সপোর্ট করতে আপনাকে প্রমাণীকরণ করতে হবে'
        });
      }

      // Validate format early to fail fast
      const validFormats = ['csv', 'pdf'];
      if (!format || !validFormats.includes(format.toLowerCase())) {
        return res.status(400).json({
          success: false,
          error: 'Invalid format',
          message: 'Format must be either csv or pdf',
          messageBn: 'ফরম্যাট অবশ্যই csv বা pdf হতে হবে'
        });
      }

      const normalizedFormat = format.toLowerCase();

      if (normalizedFormat === 'csv') {
        const csvContent = await wishlistService.exportWishlistAsCSV(wishlistId);

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename="wishlist.csv"');
        return res.send(csvContent);
      } else if (normalizedFormat === 'pdf') {
        const pdfBuffer = await wishlistService.exportWishlistAsPDF(wishlistId);

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename="wishlist.pdf"');
        return res.send(pdfBuffer);
      }
    } catch (error) {
      loggerService.error('Error in exportWishlist controller', {
        error: error.message,
        wishlistId: req.params.id,
        format: req.query.format
      });

      let statusCode = 500;
      let errorMessage = 'Failed to export wishlist';
      let errorMessageBn = 'উইশলিস্ট এক্সপোর্ট করতে ব্যর্থ হয়েছে';

      if (error.message.includes('not found')) {
        statusCode = 404;
        errorMessage = 'Wishlist not found';
        errorMessageBn = 'উইশলিস্ট পাওয়া যায়নি';
      }

      res.status(statusCode).json({
        success: false,
        error: error.message || errorMessage,
        message: errorMessage,
        messageBn: errorMessageBn
      });
    }
  }

  /**
   * Get wishlist analytics (admin only)
   * GET /api/wishlists/analytics
   */
  async getAnalytics(req, res) {
    try {
      const { startDate, endDate } = req.query;

      const analytics = await wishlistService.getAnalytics(
        startDate ? new Date(startDate) : null,
        endDate ? new Date(endDate) : null
      );

      res.json({
        success: true,
        message: 'Analytics retrieved successfully',
        messageBn: 'অ্যানালিটিক্স সফলভাবে পুনরুদ্ধার করা হয়েছে',
        data: analytics
      });
    } catch (error) {
      loggerService.error('Error in getAnalytics controller', {
        error: error.message,
        startDate: req.query.startDate,
        endDate: req.query.endDate
      });

      res.status(500).json({
        success: false,
        error: 'Failed to retrieve analytics',
        message: 'Failed to retrieve analytics',
        messageBn: 'অ্যানালিটিক্স পুনরুদ্ধার করতে ব্যর্থ হয়েছে'
      });
    }
  }
}

// Singleton instance
const wishlistController = new WishlistController();

module.exports = {
  WishlistController,
  wishlistController
};
