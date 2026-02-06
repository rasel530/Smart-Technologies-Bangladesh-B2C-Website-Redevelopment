/**
 * Search Trending API Routes
 * 
 * This module provides endpoints for tracking trending searches, calculating trend scores,
 * and retrieving trending products.
 */

const express = require('express');
const { body, query, validationResult } = require('express-validator');
const { authMiddleware } = require('../middleware/auth');
const { loggerService } = require('../services/logger');
const { SearchTrendingService } = require('../services/searchTrending.service');

const router = express.Router();

// Initialize services
let searchTrendingService;

/**
 * Initialize search trending controller with services
 * @param {Object} services - Service instances
 */
function initializeSearchTrendingController(services) {
  searchTrendingService = services.searchTrendingService || new SearchTrendingService();
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

/**
 * Role-based access control middleware
 */
const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Authentication required'
      });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        error: 'Insufficient permissions'
      });
    }
    next();
  };
};

// ============================================
// SEARCH TRENDING ENDPOINTS
// ============================================

/**
 * GET /api/v1/search-trending - Get trending searches
 * 
 * Query Parameters:
 * - limit (number): Maximum number of results (default: 20)
 * - timeRange (string): Time range (hour, day, week, month) (default: day)
 */
router.get('/', authMiddleware.authenticate(), [
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('timeRange').optional().isIn(['hour', 'day', 'week', 'month']).withMessage('Invalid time range')
], handleValidationErrors, async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit) || 20;
    const timeRange = req.query.timeRange || 'day';

    // Convert timeRange to startDate
    const startDate = new Date();
    switch(timeRange) {
      case 'hour':
        startDate.setHours(startDate.getHours() - 1);
        break;
      case 'day':
        startDate.setDate(startDate.getDate() - 1);
        break;
      case 'week':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(startDate.getMonth() - 1);
        break;
    }

    const trendingSearches = await searchTrendingService.getTrendingSearches(limit, timeRange, startDate);

    res.status(200).json({
      success: true,
      data: {
        timeRange,
        startDate: startDate.toISOString(),
        limit,
        searches: trendingSearches
      }
    });
  } catch (error) {
    loggerService.error('Failed to get trending searches', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    next(error);
  }
});

/**
 * GET /api/search/trending/products - Get trending products
 * 
 * Query Parameters:
 * - limit (number): Maximum number of products (default: 10)
 * - category (string): Filter by category (optional)
 */
router.get('/products', authMiddleware.authenticate(), [
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50'),
  query('category').optional().isString().withMessage('Category must be a string')
], handleValidationErrors, async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const category = req.query.category || null;

    const trendingProducts = await searchTrendingService.getTrendingProducts(limit, category);

    res.status(200).json({
      success: true,
      data: trendingProducts
    });
  } catch (error) {
    loggerService.error('Failed to get trending products', {
      error: error instanceof Error ? error.message : 'Unknown error',
      category: req.query.category
    });
    next(error);
  }
});

/**
 * POST /api/search/trending/record - Record search for trending
 * 
 * Request Body:
 * - query (string): Search query (required)
 * - category (string): Category (optional)
 */
router.post('/record', authMiddleware.authenticate(), [
  body('query').trim().notEmpty().withMessage('Query is required'),
  body('category').optional().isString().withMessage('Category must be a string')
], handleValidationErrors, async (req, res, next) => {
  try {
    const { query, category } = req.body;

    const trending = await searchTrendingService.recordSearch(query, category);

    res.status(201).json({
      success: true,
      data: trending
    });
  } catch (error) {
    loggerService.error('Failed to record search for trending', {
      error: error instanceof Error ? error.message : 'Unknown error',
      query: req.body.query
    });
    next(error);
  }
});

/**
 * POST /api/search/trending/calculate - Calculate trend scores
 */
router.post('/calculate', authMiddleware.authenticate(), requireRole(['ADMIN', 'SUPER_ADMIN']), async (req, res, next) => {
  try {
    const updatedRecords = await searchTrendingService.calculateTrendScores();

    res.status(200).json({
      success: true,
      data: updatedRecords
    });
  } catch (error) {
    loggerService.error('Failed to calculate trend scores', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    next(error);
  }
});

/**
 * GET /api/search/trending/category/:category - Get trending searches by category
 * 
 * Path Parameters:
 * - category (string): Category to filter by
 * 
 * Query Parameters:
 * - limit (number): Maximum number of results (default: 10)
 */
router.get('/category/:category', authMiddleware.authenticate(), [
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50')
], handleValidationErrors, async (req, res, next) => {
  try {
    const category = req.params.category;
    const limit = parseInt(req.query.limit) || 10;

    const trendingSearches = await searchTrendingService.getTrendingByCategory(category, limit);

    res.status(200).json({
      success: true,
      data: trendingSearches
    });
  } catch (error) {
    loggerService.error('Failed to get trending searches by category', {
      error: error instanceof Error ? error.message : 'Unknown error',
      category: req.params.category
    });
    next(error);
  }
});

/**
 * GET /api/search/trending/rising - Get rising searches
 * 
 * Query Parameters:
 * - limit (number): Maximum number of results (default: 10)
 */
router.get('/rising', authMiddleware.authenticate(), [
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50')
], handleValidationErrors, async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit) || 10;

    const risingSearches = await searchTrendingService.getRisingSearches(limit);

    res.status(200).json({
      success: true,
      data: risingSearches
    });
  } catch (error) {
    loggerService.error('Failed to get rising searches', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    next(error);
  }
});

/**
 * GET /api/search/trending/statistics - Get trending statistics
 */
router.get('/statistics', authMiddleware.authenticate(), requireRole(['ADMIN', 'SUPER_ADMIN']), async (req, res, next) => {
  try {
    const statistics = await searchTrendingService.getTrendingStatistics();

    res.status(200).json({
      success: true,
      data: statistics
    });
  } catch (error) {
    loggerService.error('Failed to get trending statistics', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    next(error);
  }
});

/**
 * DELETE /api/search/trending/old - Clear old trending data
 * 
 * Query Parameters:
 * - daysToKeep (number): Number of days to keep (default: 30)
 */
router.delete('/old', authMiddleware.authenticate(), requireRole(['ADMIN', 'SUPER_ADMIN']), [
  query('daysToKeep').optional().isInt({ min: 1, max: 365 }).withMessage('Days to keep must be between 1 and 365')
], handleValidationErrors, async (req, res, next) => {
  try {
    const daysToKeep = parseInt(req.query.daysToKeep) || 30;

    const deletedCount = await searchTrendingService.clearOldTrendingData(daysToKeep);

    res.status(200).json({
      success: true,
      data: {
        deletedCount
      }
    });
  } catch (error) {
    loggerService.error('Failed to clear old trending data', {
      error: error instanceof Error ? error.message : 'Unknown error',
      daysToKeep: req.query.daysToKeep
    });
    next(error);
  }
});

/**
 * PUT /api/search/trending/threshold - Update trend threshold
 * 
 * Request Body:
 * - threshold (number): New trend threshold (required)
 */
router.put('/threshold', authMiddleware.authenticate(), requireRole(['ADMIN', 'SUPER_ADMIN']), [
  body('threshold').isInt({ min: 0 }).withMessage('Threshold must be a non-negative integer')
], handleValidationErrors, async (req, res, next) => {
  try {
    const { threshold } = req.body;

    searchTrendingService.updateTrendThreshold(threshold);

    res.status(200).json({
      success: true,
      data: {
        threshold
      }
    });
  } catch (error) {
    loggerService.error('Failed to update trend threshold', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    next(error);
  }
});

/**
 * PUT /api/search/trending/decay - Update trend decay factor
 * 
 * Request Body:
 * - factor (number): New decay factor (required)
 */
router.put('/decay', authMiddleware.authenticate(), requireRole(['ADMIN', 'SUPER_ADMIN']), [
  body('factor').isFloat({ min: 0, max: 1 }).withMessage('Decay factor must be between 0 and 1')
], handleValidationErrors, async (req, res, next) => {
  try {
    const { factor } = req.body;

    searchTrendingService.updateTrendDecayFactor(factor);

    res.status(200).json({
      success: true,
      data: {
        decayFactor: factor
      }
    });
  } catch (error) {
    loggerService.error('Failed to update trend decay factor', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    next(error);
  }
});

/**
 * GET /api/admin/search/trending - Detailed trending data (admin)
 */
router.get('/admin/trending', authMiddleware.authenticate(), requireRole(['ADMIN', 'SUPER_ADMIN']), async (req, res, next) => {
  try {
    const statistics = await searchTrendingService.getTrendingStatistics();
    res.json({ success: true, data: statistics });
  } catch (error) {
    loggerService.error('Failed to get admin trending data', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    next(error);
  }
});

/**
 * POST /api/admin/search/trending/recalculate - Recalculate trends
 */
router.post('/admin/trending/recalculate', authMiddleware.authenticate(), requireRole(['ADMIN', 'SUPER_ADMIN']), async (req, res, next) => {
  try {
    await searchTrendingService.calculateTrendScores();
    res.json({ success: true, message: 'Trend scores recalculated successfully' });
  } catch (error) {
    loggerService.error('Failed to recalculate trends', {
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
  initializeSearchTrendingController
};
