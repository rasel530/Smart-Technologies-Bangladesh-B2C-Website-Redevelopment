/**
 * Search API Routes
 * 
 * This module provides search endpoints using SearchService with support for
 * advanced product search, autocomplete, suggestions, and popular searches.
 */

const express = require('express');
const { body, query, validationResult } = require('express-validator');
const { authMiddleware } = require('../middleware/auth');
const { loggerService } = require('../services/logger');
const SearchController = require('../controllers/searchController');

const router = express.Router();

// Initialize SearchController with SearchService
// Note: SearchService will be initialized during application startup
let searchController;

/**
 * Initialize search controller with search service instance
 * @param {Object} searchService - SearchService instance
 */
function initializeSearchController(searchService) {
  searchController = new SearchController(searchService);
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
// SEARCH ENDPOINTS
// ============================================

/**
 * GET /api/search/products - Advanced search endpoint
 * 
 * Query Parameters:
 * - query (string): Search query text
 * - categories[] (string[]): Category IDs to filter
 * - brands[] (string[]): Brand IDs to filter
 * - priceRange[min] (number): Minimum price
 * - priceRange[max] (number): Maximum price
 * - specifications (object): Specification filters
 * - inStock (boolean): Filter in-stock products only
 * - featured (boolean): Filter featured products only
 * - newArrivals (boolean): Filter new arrivals only
 * - bestSellers (boolean): Filter best sellers only
 * - sort[field] (string): Sort field (relevance, price, rating, newest, name)
 * - sort[order] (string): Sort order (asc, desc)
 * - page (number): Page number (default: 1)
 * - perPage (number): Results per page (default: 20, max: 100)
 * - facets[] (string[]): Facets to return
 */
router.get('/products', [
  query('query').optional().isString().trim(),
  query('categories').optional().isArray(),
  query('brands').optional().isArray(),
  query('priceRange[min]').optional().isFloat({ min: 0 }),
  query('priceRange[max]').optional().isFloat({ min: 0 }),
  query('specifications').optional().isString(),
  query('inStock').optional().isBoolean(),
  query('featured').optional().isBoolean(),
  query('newArrivals').optional().isBoolean(),
  query('bestSellers').optional().isBoolean(),
  query('sort').optional().isString(),
  query('page').optional().isInt({ min: 1 }),
  query('perPage').optional().isInt({ min: 1, max: 100 }),
  query('facets').optional().isArray()
], handleValidationErrors, async (req, res, next) => {
  // Optional authentication - public search doesn't require auth
  // but we attach user info if available for analytics
  await authMiddleware.optional()(req, res, () => {
    return searchController.advancedSearch(req, res, next);
  });
});

/**
 * GET /api/search/autocomplete - Autocomplete endpoint
 * 
 * Query Parameters:
 * - query (string): Partial query text (required)
 * - limit (number): Maximum suggestions (default: 10, max: 20)
 * - language (string): Language preference (en, bn)
 */
router.get('/autocomplete', [
  query('query').trim().notEmpty().withMessage('Query is required'),
  query('limit').optional().isInt({ min: 1, max: 20 }),
  query('language').optional().isIn(['en', 'bn'])
], handleValidationErrors, async (req, res, next) => {
  // Optional authentication
  await authMiddleware.optional()(req, res, () => {
    return searchController.autocomplete(req, res, next);
  });
});

/**
 * GET /api/search/suggestions - Search suggestions endpoint
 * 
 * Query Parameters:
 * - query (string): Search query (required)
 */
router.get('/suggestions', [
  query('query').trim().notEmpty().withMessage('Query is required')
], handleValidationErrors, async (req, res, next) => {
  // Optional authentication
  await authMiddleware.optional()(req, res, () => {
    return searchController.getSuggestions(req, res, next);
  });
});

/**
 * GET /api/search/popular - Popular searches endpoint
 * 
 * Query Parameters:
 * - limit (number): Maximum results (default: 10, max: 50)
 * - period (string): Time period (today, week, month, all)
 */
router.get('/popular', [
  query('limit').optional().isInt({ min: 1, max: 50 }),
  query('period').optional().isIn(['today', 'week', 'month', 'all'])
], handleValidationErrors, async (req, res, next) => {
  // Optional authentication
  await authMiddleware.optional()(req, res, () => {
    return searchController.getPopularSearches(req, res, next);
  });
});

// ============================================
// EXPORTS
// ============================================

module.exports = {
  router,
  initializeSearchController
};
