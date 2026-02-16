const { adminWishlistService } = require('../services/adminWishlistService');
const { loggerService } = require('../services/logger');

/**
 * Admin Wishlist Controller
 * 
 * Request handlers for admin wishlist operations
 */

class AdminWishlistController {
  /**
   * Get wishlist statistics
   * GET /api/v1/admin/wishlists/statistics
   */
  async getStatistics(req, res) {
    try {
      const { startDate, endDate } = req.query;

      const statistics = await adminWishlistService.getStatistics(
        startDate ? new Date(startDate) : null,
        endDate ? new Date(endDate) : null
      );

      // Validate statistics data - handle empty data scenarios
      if (!statistics) {
        return res.status(200).json({
          success: true,
          message: 'No wishlist data available',
          messageBn: 'কোনো উইশলিস্ট ডেটা উপলব্ধ নেই',
          data: {
            totalWishlists: 0,
            totalItems: 0,
            averageItemsPerWishlist: 0,
            publicWishlists: 0,
            sharedWishlists: 0,
            conversionRate: 0,
            topProducts: [],
            creationTrend: []
          }
        });
      }

      res.json({
        success: true,
        message: 'Wishlist statistics retrieved successfully',
        messageBn: 'উইশলিস্ট পরিসংখ্যান সফলভাবে পুনরুদ্ধার করা হয়েছে',
        data: statistics
      });
    } catch (error) {
      loggerService.error('Error in getStatistics admin controller', {
        error: error.message,
        startDate: req.query.startDate,
        endDate: req.query.endDate
      });

      res.status(500).json({
        success: false,
        error: 'Failed to retrieve wishlist statistics',
        message: 'Failed to retrieve wishlist statistics',
        messageBn: 'উইশলিস্ট পরিসংখ্যান পুনরুদ্ধার করতে ব্যর্থ হয়েছে'
      });
    }
  }

  /**
   * Get all wishlists
   * GET /api/v1/admin/wishlists
   */
  async getAllWishlists(req, res) {
    try {
      const {
        page = 1,
        limit = 10,
        sortBy = 'createdAt',
        sortOrder = 'desc',
        search = null,
        isPublic = null,
        userId = null
      } = req.query;

      const result = await adminWishlistService.getAllWishlists({
        page: parseInt(page),
        limit: parseInt(limit),
        sortBy,
        sortOrder,
        search,
        isPublic: isPublic === 'true' ? true : isPublic === 'false' ? false : null,
        userId
      });

      res.json({
        success: true,
        message: 'Wishlists retrieved successfully',
        messageBn: 'উইশলিস্টগুলি সফলভাবে পুনরুদ্ধার করা হয়েছে',
        data: result
      });
    } catch (error) {
      loggerService.error('Error in getAllWishlists admin controller', {
        error: error.message,
        query: req.query
      });

      res.status(500).json({
        success: false,
        error: 'Failed to retrieve wishlists',
        message: 'Failed to retrieve wishlists',
        messageBn: 'উইশলিস্টগুলি পুনরুদ্ধার করতে ব্যর্থ হয়েছে'
      });
    }
  }

  /**
   * Get user wishlists
   * GET /api/v1/admin/wishlists/users/:userId
   */
  async getUserWishlists(req, res) {
    try {
      const { userId } = req.params;

      const result = await adminWishlistService.getUserWishlists(userId);

      res.json({
        success: true,
        message: 'User wishlists retrieved successfully',
        messageBn: 'ব্যবহারকারীর উইশলিস্টগুলি সফলভাবে পুনরুদ্ধার করা হয়েছে',
        data: result
      });
    } catch (error) {
      loggerService.error('Error in getUserWishlists admin controller', {
        error: error.message,
        userId: req.params.userId
      });

      let statusCode = 500;
      let errorMessage = 'Failed to retrieve user wishlists';
      let errorMessageBn = 'ব্যবহারকারীর উইশলিস্টগুলি পুনরুদ্ধার করতে ব্যর্থ হয়েছে';

      if (error.message.includes('not found')) {
        statusCode = 404;
        errorMessage = 'User not found';
        errorMessageBn = 'ব্যবহারকারী পাওয়া যায়নি';
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
   * Delete wishlist (admin override)
   * DELETE /api/v1/admin/wishlists/:id
   */
  async deleteWishlist(req, res) {
    try {
      const { id } = req.params;

      const result = await adminWishlistService.deleteWishlist(id);

      res.json({
        success: true,
        message: 'Wishlist deleted successfully',
        messageBn: 'উইশলিস্ট সফলভাবে মুছে ফেলা হয়েছে',
        data: result
      });
    } catch (error) {
      loggerService.error('Error in deleteWishlist admin controller', {
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
   * Get wishlist analytics
   * GET /api/v1/admin/wishlists/analytics
   */
  async getAnalytics(req, res) {
    try {
      const { startDate, endDate, groupBy = 'day' } = req.query;

      const analytics = await adminWishlistService.getAnalytics(
        startDate ? new Date(startDate) : null,
        endDate ? new Date(endDate) : null,
        groupBy
      );

      res.json({
        success: true,
        message: 'Wishlist analytics retrieved successfully',
        messageBn: 'উইশলিস্ট অ্যানালিটিক্স সফলভাবে পুনরুদ্ধার করা হয়েছে',
        data: analytics
      });
    } catch (error) {
      loggerService.error('Error in getAnalytics admin controller', {
        error: error.message,
        startDate: req.query.startDate,
        endDate: req.query.endDate,
        groupBy: req.query.groupBy
      });

      res.status(500).json({
        success: false,
        error: 'Failed to retrieve wishlist analytics',
        message: 'Failed to retrieve wishlist analytics',
        messageBn: 'উইশলিস্ট অ্যানালিটিক্স পুনরুদ্ধার করতে ব্যর্থ হয়েছে'
      });
    }
  }

  /**
   * Get product wishlist analytics
   * GET /api/v1/admin/wishlists/products
   */
  async getProductAnalytics(req, res) {
    try {
      const {
        page = 1,
        limit = 10,
        sortBy = 'wishlistCount',
        sortOrder = 'desc',
        categoryId = null,
        minPrice = null,
        maxPrice = null
      } = req.query;

      const result = await adminWishlistService.getProductAnalytics({
        page: parseInt(page),
        limit: parseInt(limit),
        sortBy,
        sortOrder,
        categoryId,
        minPrice: minPrice ? parseFloat(minPrice) : null,
        maxPrice: maxPrice ? parseFloat(maxPrice) : null
      });

      res.json({
        success: true,
        message: 'Product wishlist analytics retrieved successfully',
        messageBn: 'পণ্য উইশলিস্ট অ্যানালিটিক্স সফলভাবে পুনরুদ্ধার করা হয়েছে',
        data: result
      });
    } catch (error) {
      loggerService.error('Error in getProductAnalytics admin controller', {
        error: error.message,
        query: req.query
      });

      res.status(500).json({
        success: false,
        error: 'Failed to retrieve product wishlist analytics',
        message: 'Failed to retrieve product wishlist analytics',
        messageBn: 'পণ্য উইশলিস্ট অ্যানালিটিক্স পুনরুদ্ধার করতে ব্যর্থ হয়েছে'
      });
    }
  }

  /**
   * Get wishlist settings
   * GET /api/v1/admin/wishlists/settings
   */
  async getSettings(req, res) {
    try {
      const settings = await adminWishlistService.getSettings();

      res.json({
        success: true,
        message: 'Wishlist settings retrieved successfully',
        messageBn: 'উইশলিস্ট সেটিংস সফলভাবে পুনরুদ্ধার করা হয়েছে',
        data: settings
      });
    } catch (error) {
      loggerService.error('Error in getSettings admin controller', {
        error: error.message
      });

      res.status(500).json({
        success: false,
        error: 'Failed to retrieve wishlist settings',
        message: 'Failed to retrieve wishlist settings',
        messageBn: 'উইশলিস্ট সেটিংস পুনরুদ্ধার করতে ব্যর্থ হয়েছে'
      });
    }
  }

  /**
   * Update wishlist settings
   * PUT /api/v1/admin/wishlists/settings
   */
  async updateSettings(req, res) {
    try {
      const settings = req.body;

      const updatedSettings = await adminWishlistService.updateSettings(settings);

      res.json({
        success: true,
        message: 'Wishlist settings updated successfully',
        messageBn: 'উইশলিস্ট সেটিংস সফলভাবে আপডেট করা হয়েছে',
        data: updatedSettings
      });
    } catch (error) {
      loggerService.error('Error in updateSettings admin controller', {
        error: error.message,
        settings: req.body
      });

      res.status(500).json({
        success: false,
        error: 'Failed to update wishlist settings',
        message: 'Failed to update wishlist settings',
        messageBn: 'উইশলিস্ট সেটিংস আপডেট করতে ব্যর্থ হয়েছে'
      });
    }
  }

  /**
   * Get moderation queue
   * GET /api/v1/admin/wishlists/moderation
   */
  async getModerationQueue(req, res) {
    try {
      const {
        page = 1,
        limit = 10,
        status = 'pending'
      } = req.query;

      const result = await adminWishlistService.getModerationQueue({
        page: parseInt(page),
        limit: parseInt(limit),
        status
      });

      res.json({
        success: true,
        message: 'Moderation queue retrieved successfully',
        messageBn: 'মডারেশন সারি সফলভাবে পুনরুদ্ধার করা হয়েছে',
        data: result
      });
    } catch (error) {
      loggerService.error('Error in getModerationQueue admin controller', {
        error: error.message,
        query: req.query
      });

      res.status(500).json({
        success: false,
        error: 'Failed to retrieve moderation queue',
        message: 'Failed to retrieve moderation queue',
        messageBn: 'মডারেশন সারি পুনরুদ্ধার করতে ব্যর্থ হয়েছে'
      });
    }
  }

  /**
   * Approve wishlist in moderation
   * POST /api/v1/admin/wishlists/moderation/:id/approve
   */
  async approveWishlist(req, res) {
    try {
      const { id } = req.params;

      const result = await adminWishlistService.approveWishlist(id);

      res.json({
        success: true,
        message: 'Wishlist approved successfully',
        messageBn: 'উইশলিস্ট সফলভাবে অনুমোদিত হয়েছে',
        data: result
      });
    } catch (error) {
      loggerService.error('Error in approveWishlist admin controller', {
        error: error.message,
        wishlistId: req.params.id
      });

      res.status(500).json({
        success: false,
        error: 'Failed to approve wishlist',
        message: 'Failed to approve wishlist',
        messageBn: 'উইশলিস্ট অনুমোদন করতে ব্যর্থ হয়েছে'
      });
    }
  }

  /**
   * Reject wishlist in moderation
   * POST /api/v1/admin/wishlists/moderation/:id/reject
   */
  async rejectWishlist(req, res) {
    try {
      const { id } = req.params;
      const { reason } = req.body;

      const result = await adminWishlistService.rejectWishlist(id, reason);

      res.json({
        success: true,
        message: 'Wishlist rejected successfully',
        messageBn: 'উইশলিস্ট সফলভাবে প্রত্যাখ্যাত হয়েছে',
        data: result
      });
    } catch (error) {
      loggerService.error('Error in rejectWishlist admin controller', {
        error: error.message,
        wishlistId: req.params.id,
        reason: req.body.reason
      });

      res.status(500).json({
        success: false,
        error: 'Failed to reject wishlist',
        message: 'Failed to reject wishlist',
        messageBn: 'উইশলিস্ট প্রত্যাখ্যান করতে ব্যর্থ হয়েছে'
      });
    }
  }

  /**
   * Get users with wishlists
   * GET /api/v1/admin/wishlists/users
   */
  async getUsersWithWishlists(req, res) {
    try {
      const {
        page = 1,
        limit = 10,
        search = null
      } = req.query;

      const result = await adminWishlistService.getUsersWithWishlists({
        page: parseInt(page),
        limit: parseInt(limit),
        search
      });

      res.json({
        success: true,
        message: 'Users with wishlists retrieved successfully',
        messageBn: 'উইশলিস্ট সহ ব্যবহারকারীরা সফলভাবে পুনরুদ্ধার করা হয়েছে',
        data: result
      });
    } catch (error) {
      loggerService.error('Error in getUsersWithWishlists admin controller', {
        error: error.message,
        query: req.query
      });

      res.status(500).json({
        success: false,
        error: 'Failed to retrieve users with wishlists',
        message: 'Failed to retrieve users with wishlists',
        messageBn: 'উইশলিস্ট সহ ব্যবহারকারীদের পুনরুদ্ধার করতে ব্যর্থ হয়েছে'
      });
    }
  }
}

// Singleton instance
const adminWishlistController = new AdminWishlistController();

module.exports = {
  AdminWishlistController,
  adminWishlistController
};
