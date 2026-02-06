/**
 * Search Personalization API Routes
 * 
 * This module provides endpoints for managing user preferences, personalized
 * search results, recommendations, and behavior tracking.
 */

const express = require('express');
const { body, query, validationResult } = require('express-validator');
const { authMiddleware } = require('../middleware/auth');
const { loggerService } = require('../services/logger');
const { SearchPersonalizationService } = require('../services/searchPersonalization.service');

const router = express.Router();

// Initialize services
let searchPersonalizationService;

/**
 * Initialize search personalization controller with services
 * @param {Object} services - Service instances
 */
function initializeSearchPersonalizationController(services) {
  searchPersonalizationService = services.searchPersonalizationService || new SearchPersonalizationService();
}

/**
 * Validation middleware
 */
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors.array()
    });
  }
  next();
};

// ============================================
// SEARCH PERSONALIZATION ENDPOINTS
// ============================================

/**
 * GET /api/search/personalization/preferences - Get user preferences
 */
router.get('/preferences', async (req, res, next) => {
  try {
    // Authentication required
    if (!req.user) {
      return res.status(401).json({
        error: 'Authentication required'
      });
    }

    const userId = req.user.id;

    const preferences = await searchPersonalizationService.getUserPreferences(userId);

    res.status(200).json({
      success: true,
      data: preferences
    });
  } catch (error) {
    loggerService.error('Failed to get user preferences', {
      error: error instanceof Error ? error.message : 'Unknown error',
      userId: req.user?.id
    });
    next(error);
  }
});

/**
 * PUT /api/search/personalization/preferences - Update user preferences
 * 
 * Request Body:
 * - preferredCategories (array): Preferred category IDs (optional)
 * - preferredBrands (array): Preferred brand IDs (optional)
 * - priceRangeMin (number): Minimum price (optional)
 * - priceRangeMax (number): Maximum price (optional)
 */
router.put('/preferences', [
  body('preferredCategories').optional().isArray().withMessage('Preferred categories must be an array'),
  body('preferredBrands').optional().isArray().withMessage('Preferred brands must be an array'),
  body('priceRangeMin').optional().isInt({ min: 0 }).withMessage('Price range min must be a non-negative integer'),
  body('priceRangeMax').optional().isInt({ min: 0 }).withMessage('Price range max must be a non-negative integer')
], handleValidationErrors, async (req, res, next) => {
  try {
    // Authentication required
    if (!req.user) {
      return res.status(401).json({
        error: 'Authentication required'
      });
    }

    const userId = req.user.id;
    const preferences = req.body;

    const updatedPreferences = await searchPersonalizationService.updateUserPreferences(userId, preferences);

    res.status(200).json({
      success: true,
      data: updatedPreferences
    });
  } catch (error) {
    loggerService.error('Failed to update user preferences', {
      error: error instanceof Error ? error.message : 'Unknown error',
      userId: req.user?.id
    });
    next(error);
  }
});

/**
 * GET /api/search/personalization/results - Get personalized search results
 * 
 * Query Parameters:
 * - query (string): Search query (required)
 */
router.get('/results', [
  query('query').trim().notEmpty().withMessage('Query is required')
], handleValidationErrors, async (req, res, next) => {
  try {
    // Authentication required
    if (!req.user) {
      return res.status(401).json({
        error: 'Authentication required'
      });
    }

    const userId = req.user.id;
    const query = req.query.query;

    const personalizedResults = await searchPersonalizationService.getPersonalizedResults(query, userId);

    res.status(200).json({
      success: true,
      data: personalizedResults
    });
  } catch (error) {
    loggerService.error('Failed to get personalized results', {
      error: error instanceof Error ? error.message : 'Unknown error',
      userId: req.user?.id
    });
    next(error);
  }
});

/**
 * GET /api/search/personalization/suggestions - Get personalized suggestions
 * 
 * Query Parameters:
 * - limit (number): Maximum number of suggestions (default: 10)
 */
router.get('/suggestions', [
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50')
], handleValidationErrors, async (req, res, next) => {
  try {
    // Authentication required
    if (!req.user) {
      return res.status(401).json({
        error: 'Authentication required'
      });
    }

    const userId = req.user.id;
    const limit = parseInt(req.query.limit) || 10;

    const suggestions = await searchPersonalizationService.getPersonalizedSuggestions(userId, limit);

    res.status(200).json({
      success: true,
      data: suggestions
    });
  } catch (error) {
    loggerService.error('Failed to get personalized suggestions', {
      error: error instanceof Error ? error.message : 'Unknown error',
      userId: req.user?.id
    });
    next(error);
  }
});

/**
 * GET /api/search/personalization/recommendations - Get recommendations
 * 
 * Query Parameters:
 * - type (string): Recommendation type (trending, similar, personalized) (default: personalized)
 */
router.get('/recommendations', [
  query('type').optional().isIn(['trending', 'similar', 'personalized']).withMessage('Invalid recommendation type')
], handleValidationErrors, async (req, res, next) => {
  try {
    // Authentication required
    if (!req.user) {
      return res.status(401).json({
        error: 'Authentication required'
      });
    }

    const userId = req.user.id;
    const type = req.query.type || 'personalized';

    const recommendations = await searchPersonalizationService.generateRecommendations(userId, type);

    res.status(200).json({
      success: true,
      data: recommendations
    });
  } catch (error) {
    loggerService.error('Failed to get recommendations', {
      error: error instanceof Error ? error.message : 'Unknown error',
      userId: req.user?.id,
      type
    });
    next(error);
  }
});

/**
 * POST /api/search/personalization/recommendation/click - Track recommendation click
 * 
 * Request Body:
 * - productId (string): Product ID (required)
 * - recommendationId (string): Recommendation ID (optional)
 */
router.post('/recommendation/click', [
  body('productId').isUUID().withMessage('Invalid product ID'),
  body('recommendationId').optional().isUUID().withMessage('Invalid recommendation ID')
], handleValidationErrors, async (req, res, next) => {
  try {
    // Authentication required
    if (!req.user) {
      return res.status(401).json({
        error: 'Authentication required'
      });
    }

    const userId = req.user.id;
    const { productId, recommendationId } = req.body;

    const result = await searchPersonalizationService.trackRecommendationClick(userId, productId, recommendationId);

    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    loggerService.error('Failed to track recommendation click', {
      error: error instanceof Error ? error.message : 'Unknown error',
      userId: req.user?.id
    });
    next(error);
  }
});

/**
 * POST /api/search/personalization/recommendation/conversion - Track recommendation conversion
 * 
 * Request Body:
 * - productId (string): Product ID (required)
 */
router.post('/recommendation/conversion', [
  body('productId').isUUID().withMessage('Invalid product ID')
], handleValidationErrors, async (req, res, next) => {
  try {
    // Authentication required
    if (!req.user) {
      return res.status(401).json({
        error: 'Authentication required'
      });
    }

    const userId = req.user.id;
    const { productId } = req.body;

    const result = await searchPersonalizationService.trackRecommendationConversion(userId, productId);

    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    loggerService.error('Failed to track recommendation conversion', {
      error: error instanceof Error ? error.message : 'Unknown error',
      userId: req.user?.id
    });
    next(error);
  }
});

/**
 * POST /api/search/personalization/history - Add search to history
 * 
 * Request Body:
 * - query (string): Search query (required)
 */
router.post('/history', [
  body('query').trim().notEmpty().withMessage('Query is required')
], handleValidationErrors, async (req, res, next) => {
  try {
    // Authentication required
    if (!req.user) {
      return res.status(401).json({
        error: 'Authentication required'
      });
    }

    const userId = req.user.id;
    const { query } = req.body;

    const updatedPreferences = await searchPersonalizationService.addToSearchHistory(userId, query);

    res.status(200).json({
      success: true,
      data: updatedPreferences
    });
  } catch (error) {
    loggerService.error('Failed to add to search history', {
      error: error instanceof Error ? error.message : 'Unknown error',
      userId: req.user?.id
    });
    next(error);
  }
});

/**
 * GET /api/search/personalization/history - Get search history
 * 
 * Query Parameters:
 * - limit (number): Maximum number of items (default: 20)
 */
router.get('/history', [
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100')
], handleValidationErrors, async (req, res, next) => {
  try {
    // Authentication required
    if (!req.user) {
      return res.status(401).json({
        error: 'Authentication required'
      });
    }

    const userId = req.user.id;
    const limit = parseInt(req.query.limit) || 20;

    const searchHistory = await searchPersonalizationService.getSearchHistory(userId, limit);

    res.status(200).json({
      success: true,
      data: searchHistory
    });
  } catch (error) {
    loggerService.error('Failed to get search history', {
      error: error instanceof Error ? error.message : 'Unknown error',
      userId: req.user?.id
    });
    next(error);
  }
});

/**
 * DELETE /api/search/personalization/history - Clear search history
 */
router.delete('/history', async (req, res, next) => {
  try {
    // Authentication required
    if (!req.user) {
      return res.status(401).json({
        error: 'Authentication required'
      });
    }

    const userId = req.user.id;

    const updatedPreferences = await searchPersonalizationService.clearSearchHistory(userId);

    res.status(200).json({
      success: true,
      data: updatedPreferences
    });
  } catch (error) {
    loggerService.error('Failed to clear search history', {
      error: error instanceof Error ? error.message : 'Unknown error',
      userId: req.user?.id
    });
    next(error);
  }
});

/**
 * POST /api/search/personalization/behavior - Learn from user behavior
 * 
 * Request Body:
 * - productId (string): Product ID (required)
 * - action (string): User action (view, click, add_to_cart, purchase) (required)
 */
router.post('/behavior', [
  body('productId').isUUID().withMessage('Invalid product ID'),
  body('action').isIn(['view', 'click', 'add_to_cart', 'purchase']).withMessage('Invalid action')
], handleValidationErrors, async (req, res, next) => {
  try {
    // Authentication required
    if (!req.user) {
      return res.status(401).json({
        error: 'Authentication required'
      });
    }

    const userId = req.user.id;
    const { productId, action } = req.body;

    const updatedPreferences = await searchPersonalizationService.learnFromBehavior(userId, productId, action);

    res.status(200).json({
      success: true,
      data: updatedPreferences
    });
  } catch (error) {
    loggerService.error('Failed to learn from behavior', {
      error: error instanceof Error ? error.message : 'Unknown error',
      userId: req.user?.id
    });
    next(error);
  }
});

/**
 * POST /api/search/personalization/track - Track user behavior
 * 
 * Request Body:
 * - userId (string): User ID (required)
 * - action (string): User action (view, click, add_to_cart, purchase) (required)
 * - data (object): Additional data (optional)
 */
router.post('/track', authMiddleware.authenticate(), async (req, res, next) => {
  try {
    const { userId, action, data } = req.body;
    await searchPersonalizationService.trackBehavior(userId, action, data);
    res.json({ success: true, message: 'Behavior tracked successfully' });
  } catch (error) {
    loggerService.error('Failed to track behavior', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    next(error);
  }
});

/**
 * GET /api/v1/search-personalization/admin/recommendations - Admin recommendations
 * 
 * Query Parameters:
 * - timeRange (string): Time period (today, week, month, all) (default: week)
 */
router.get('/admin/recommendations', [
  query('timeRange').optional().isIn(['today', 'week', 'month', 'all']).withMessage('Invalid time range')
], handleValidationErrors, async (req, res, next) => {
  try {
    // Authentication required
    if (!req.user) {
      return res.status(401).json({
        error: 'Authentication required'
      });
    }

    // Only allow admins to access admin recommendations
    if (req.user.role !== 'admin' && req.user.role !== 'super_admin') {
      return res.status(403).json({
        error: 'Insufficient permissions'
      });
    }

    const timeRange = req.query.timeRange || 'week';

    // Calculate date range based on timeRange
    const endDate = new Date();
    const startDate = new Date();
    switch(timeRange) {
      case 'today':
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'week':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(startDate.getMonth() - 1);
        break;
      case 'all':
        startDate.setFullYear(startDate.getFullYear() - 10); // Large date range for "all"
        break;
    }

    // Get recommendations from database
    const recommendations = await db.query(`
      SELECT 
        pr.id,
        pr.type,
        pr.product_id,
        pr.user_id,
        pr.score,
        pr.reason,
        pr.created_at,
        p.name as product_name,
        p.price,
        p.image_url,
        u.email as user_email
      FROM product_recommendations pr
      LEFT JOIN products p ON pr.product_id = p.id
      LEFT JOIN users u ON pr.user_id = u.id
      WHERE pr.created_at >= $1 AND pr.created_at <= $2
      ORDER BY pr.created_at DESC
      LIMIT 100
    `, [startDate, endDate]);

    res.status(200).json({
      success: true,
      data: {
        timeRange,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        count: recommendations.rows.length,
        recommendations: recommendations.rows
      }
    });
  } catch (error) {
    loggerService.error('Failed to get admin recommendations', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    next(error);
  }
});

// ============================================
// EXPORTS
// ============================================

module.exports = {
  router,
  initializeSearchPersonalizationController
};
