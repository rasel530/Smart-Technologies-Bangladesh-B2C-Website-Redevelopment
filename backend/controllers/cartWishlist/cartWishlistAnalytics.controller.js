const { cartWishlistAnalyticsService } = require('../../services/cartWishlist/cartWishlistAnalytics.service');
const { loggerService } = require('../../services/logger');

/**
 * Cart-Wishlist Analytics Controller
 * 
 * Handles HTTP requests for cart-wishlist analytics:
 * - User behavior analytics
 * - Conversion funnel analytics
 * - Abandonment analytics
 * - Performance metrics
 * - Report generation
 */
class CartWishlistAnalyticsController {
  /**
   * Get user behavior analytics
   * GET /api/v1/cart-wishlist/analytics/behavior
   */
  async getBehaviorAnalytics(req, res) {
    try {
      const userId = req.user?.id;
      const isAdmin = req.user?.role === 'admin' || req.user?.role === 'super_admin';

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

      // Only admins can query other users' data
      const targetUserId = isAdmin && req.query.userId ? req.query.userId : userId;

      const filters = {
        startDate: req.query.startDate,
        endDate: req.query.endDate
      };

      const result = await cartWishlistAnalyticsService.getBehaviorAnalytics(
        targetUserId,
        filters
      );

      return res.status(200).json(result);
    } catch (error) {
      loggerService.error('Error in getBehaviorAnalytics controller', {
        error: error.message,
        stack: error.stack
      });

      return res.status(500).json({
        success: false,
        error: {
          message: error.message,
          code: 500,
          messageBn: 'আচরণ বিশ্লেষণ পেতে ব্যর্থ হয়েছে'
        }
      });
    }
  }

  /**
   * Get conversion funnel analytics
   * GET /api/v1/cart-wishlist/analytics/conversion
   */
  async getConversionAnalytics(req, res) {
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
        startDate: req.query.startDate,
        endDate: req.query.endDate
      };

      const result = await cartWishlistAnalyticsService.getConversionAnalytics(filters);

      return res.status(200).json(result);
    } catch (error) {
      loggerService.error('Error in getConversionAnalytics controller', {
        error: error.message,
        stack: error.stack
      });

      return res.status(500).json({
        success: false,
        error: {
          message: error.message,
          code: 500,
          messageBn: 'কনভার্সন বিশ্লেষণ পেতে ব্যর্থ হয়েছে'
        }
      });
    }
  }

  /**
   * Get cart abandonment analytics
   * GET /api/v1/cart-wishlist/analytics/abandonment
   */
  async getAbandonmentAnalytics(req, res) {
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
        startDate: req.query.startDate,
        endDate: req.query.endDate
      };

      const result = await cartWishlistAnalyticsService.getAbandonmentAnalytics(filters);

      return res.status(200).json(result);
    } catch (error) {
      loggerService.error('Error in getAbandonmentAnalytics controller', {
        error: error.message,
        stack: error.stack
      });

      return res.status(500).json({
        success: false,
        error: {
          message: error.message,
          code: 500,
          messageBn: 'পরিত্যাগ বিশ্লেষণ পেতে ব্যর্থ হয়েছে'
        }
      });
    }
  }

  /**
   * Get performance metrics
   * GET /api/v1/cart-wishlist/analytics/performance
   */
  async getPerformanceMetrics(req, res) {
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
        startDate: req.query.startDate,
        endDate: req.query.endDate
      };

      const result = await cartWishlistAnalyticsService.getPerformanceMetrics(filters);

      return res.status(200).json(result);
    } catch (error) {
      loggerService.error('Error in getPerformanceMetrics controller', {
        error: error.message,
        stack: error.stack
      });

      return res.status(500).json({
        success: false,
        error: {
          message: error.message,
          code: 500,
          messageBn: 'পারফরম্যান্স মেট্রিক্স পেতে ব্যর্থ হয়েছে'
        }
      });
    }
  }

  /**
   * Generate comprehensive report
   * GET /api/v1/cart-wishlist/reports
   */
  async generateReport(req, res) {
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

      const format = req.query.format || 'json';
      const filters = {
        startDate: req.query.startDate,
        endDate: req.query.endDate
      };

      if (!['json', 'csv'].includes(format)) {
        return res.status(400).json({
          success: false,
          error: {
            message: 'format must be either json or csv',
            code: 400,
            messageBn: 'ফরম্যাট অবশ্যই json বা csv হতে হবে'
          }
        });
      }

      const result = await cartWishlistAnalyticsService.generateReport(format, filters);

      if (format === 'csv') {
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="cart-wishlist-report-${Date.now()}.csv"`);
        return res.send(result.report);
      }

      return res.status(200).json(result);
    } catch (error) {
      loggerService.error('Error in generateReport controller', {
        error: error.message,
        stack: error.stack
      });

      return res.status(500).json({
        success: false,
        error: {
          message: error.message,
          code: 500,
          messageBn: 'রিপোর্ট তৈরি করতে ব্যর্থ হয়েছে'
        }
      });
    }
  }
}

module.exports = {
  cartWishlistAnalyticsController: new CartWishlistAnalyticsController()
};
