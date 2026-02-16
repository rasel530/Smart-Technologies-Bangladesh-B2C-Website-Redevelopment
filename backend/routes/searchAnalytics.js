/**
 * Search Analytics API Routes
 * 
 * This module provides endpoints for tracking search events, clicks, conversions,
 * and retrieving analytics data.
 */

const express = require('express');
const { body, query, validationResult } = require('express-validator');
const { authMiddleware } = require('../middleware/auth');
const { loggerService } = require('../services/logger');
const { SearchAnalyticsService } = require('../services/searchAnalytics.service');

const router = express.Router();

// Initialize services
let searchAnalyticsService;

/**
 * Initialize search analytics controller with services
 * @param {Object} services - Service instances
 */
function initializeSearchAnalyticsController(services) {
  searchAnalyticsService = services.searchAnalyticsService || new SearchAnalyticsService();
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
// SEARCH ANALYTICS ENDPOINTS
// ============================================

/**
 * POST /api/search/analytics/track - Track search event
 * 
 * Request Body:
 * - query (string): Search query text (required)
 * - resultsCount (number): Number of results returned (required)
 * - responseTime (number): Response time in milliseconds (required)
 * - filters (object): Applied filters (optional)
 * - sortBy (string): Sort order (optional)
 * - deviceInfo (object): Device information (optional)
 */
router.post('/track', [
  body('query').trim().notEmpty().withMessage('Query is required'),
  body('resultsCount').isInt({ min: 0 }).withMessage('Results count must be a non-negative integer'),
  body('responseTime').isInt({ min: 0 }).withMessage('Response time must be a non-negative integer'),
  body('filters').optional().isObject(),
  body('sortBy').optional().isString(),
  body('deviceInfo').optional().isObject()
], handleValidationErrors, async (req, res, next) => {
  try {
    const { query, resultsCount, responseTime, filters, sortBy, deviceInfo } = req.body;
    
    // Get user info from auth middleware (optional - anonymous searches allowed)
    const userId = req.user?.id || null;
    const sessionId = req.sessionID || req.headers['x-session-id'] || generateSessionId();

    const searchAnalytics = await searchAnalyticsService.trackSearch(
      userId,
      sessionId,
      query,
      resultsCount,
      responseTime,
      filters,
      sortBy,
      deviceInfo || {}
    );

    res.status(201).json({
      success: true,
      data: searchAnalytics
    });
  } catch (error) {
    loggerService.error('Failed to track search', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    next(error);
  }
});

/**
 * POST /api/search/analytics/click - Track result click
 * 
 * Request Body:
 * - searchAnalyticsId (string): ID of search analytics record (required)
 * - productId (string): ID of clicked product (required)
 * - position (number): Position of result (1-based) (required)
 */
router.post('/click', [
  body('searchAnalyticsId').isUUID().withMessage('Invalid search analytics ID'),
  body('productId').isUUID().withMessage('Invalid product ID'),
  body('position').isInt({ min: 1 }).withMessage('Position must be a positive integer')
], handleValidationErrors, async (req, res, next) => {
  try {
    const { searchAnalyticsId, productId, position } = req.body;

    const clickTracking = await searchAnalyticsService.trackClick(
      searchAnalyticsId,
      productId,
      position
    );

    res.status(201).json({
      success: true,
      data: clickTracking
    });
  } catch (error) {
    loggerService.error('Failed to track click', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    next(error);
  }
});

/**
 * POST /api/search/analytics/conversion - Track conversion
 * 
 * Request Body:
 * - searchAnalyticsId (string): ID of search analytics record (required)
 * - conversionType (string): Type of conversion (click, add_to_cart, purchase) (required)
 * - productId (string): ID of product (optional)
 */
router.post('/conversion', [
  body('searchAnalyticsId').isUUID().withMessage('Invalid search analytics ID'),
  body('conversionType').isIn(['click', 'add_to_cart', 'purchase']).withMessage('Invalid conversion type'),
  body('productId').optional().isUUID().withMessage('Invalid product ID')
], handleValidationErrors, async (req, res, next) => {
  try {
    const { searchAnalyticsId, conversionType, productId } = req.body;

    const searchAnalytics = await searchAnalyticsService.trackConversion(
      searchAnalyticsId,
      conversionType,
      productId
    );

    res.status(200).json({
      success: true,
      data: searchAnalytics
    });
  } catch (error) {
    loggerService.error('Failed to track conversion', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    next(error);
  }
});

/**
 * GET /api/search/analytics/history - Get user search history
 * 
 * Query Parameters:
 * - limit (number): Maximum number of records (default: 20)
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

    const searchHistory = await searchAnalyticsService.getSearchHistory(userId, limit);

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
 * GET /api/search/analytics/popular - Get popular searches
 * 
 * Query Parameters:
 * - limit (number): Maximum number of results (default: 10)
 * - timeRange (string): Time period (today, week, month, all) (default: week)
 */
router.get('/popular', [
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50'),
  query('timeRange').optional().isIn(['today', 'week', 'month', 'all']).withMessage('Invalid time range')
], handleValidationErrors, async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const timeRange = req.query.timeRange || 'week';

    const popularSearches = await searchAnalyticsService.getPopularSearches(limit, timeRange);

    res.status(200).json({
      success: true,
      data: popularSearches
    });
  } catch (error) {
    loggerService.error('Failed to get popular searches', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    next(error);
  }
});

/**
 * GET /api/search/analytics/trends - Get search trends over time (PUBLIC)
 * 
 * Query Parameters:
 * - startDate (string): Start date (ISO 8601 format)
 * - endDate (string): End date (ISO 8601 format)
 * - granularity (string): Time granularity (hour, day, week, month) (default: day)
 */
router.get('/trends', [
  query('startDate').optional().isISO8601().withMessage('Invalid start date format'),
  query('endDate').optional().isISO8601().withMessage('Invalid end date format'),
  query('granularity').optional().isIn(['hour', 'day', 'week', 'month']).withMessage('Invalid granularity')
], handleValidationErrors, async (req, res, next) => {
  try {
    // Public endpoint - no authentication required
    const startDate = req.query.startDate 
      ? new Date(req.query.startDate) 
      : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // Default: 7 days ago
    const endDate = req.query.endDate 
      ? new Date(req.query.endDate) 
      : new Date();
    const granularity = req.query.granularity || 'day';

    const trends = await searchAnalyticsService.getSearchTrends(startDate, endDate, granularity);

    res.status(200).json({
      success: true,
      data: trends
    });
  } catch (error) {
    loggerService.error('Failed to get search trends', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    next(error);
  }
});

/**
 * GET /api/search/analytics/metrics - Get analytics metrics (PUBLIC)
 * 
 * Query Parameters:
 * - startDate (string): Start date (ISO 8601 format)
 * - endDate (string): End date (ISO 8601 format)
 */
router.get('/metrics', [
  query('startDate').optional().isISO8601().withMessage('Invalid start date format'),
  query('endDate').optional().isISO8601().withMessage('Invalid end date format')
], handleValidationErrors, async (req, res, next) => {
  try {
    // Public endpoint - no authentication required for basic metrics
    const startDate = req.query.startDate 
      ? new Date(req.query.startDate) 
      : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // Default: 7 days ago
    const endDate = req.query.endDate 
      ? new Date(req.query.endDate) 
      : new Date();

    const metrics = await searchAnalyticsService.getAnalyticsMetrics(startDate, endDate);

    res.status(200).json({
      success: true,
      data: metrics
    });
  } catch (error) {
    loggerService.error('Failed to get analytics metrics', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    next(error);
  }
});

/**
 * POST /api/search/analytics/dwell-time - Update dwell time for a click
 * 
 * Request Body:
 * - clickTrackingId (string): ID of click tracking record (required)
 * - dwellTime (number): Time spent on product page in milliseconds (required)
 */
router.post('/dwell-time', [
  body('clickTrackingId').isUUID().withMessage('Invalid click tracking ID'),
  body('dwellTime').isInt({ min: 0 }).withMessage('Dwell time must be a non-negative integer')
], handleValidationErrors, async (req, res, next) => {
  try {
    const { clickTrackingId, dwellTime } = req.body;

    const clickTracking = await searchAnalyticsService.updateDwellTime(clickTrackingId, dwellTime);

    res.status(200).json({
      success: true,
      data: clickTracking
    });
  } catch (error) {
    loggerService.error('Failed to update dwell time', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    next(error);
  }
});

/**
 * GET /api/search/analytics/session - Get search analytics by session
 * 
 * Query Parameters:
 * - sessionId (string): Session ID (required)
 */
router.get('/session', [
  query('sessionId').notEmpty().withMessage('Session ID is required')
], handleValidationErrors, async (req, res, next) => {
  try {
    const sessionId = req.query.sessionId;

    const searchAnalytics = await searchAnalyticsService.getSearchBySession(sessionId);

    res.status(200).json({
      success: true,
      data: searchAnalytics
    });
  } catch (error) {
    loggerService.error('Failed to get session searches', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    next(error);
  }
});

/**
 * GET /api/admin/search/analytics - Comprehensive analytics dashboard
 * 
 * Query Parameters:
 * - startDate (string): Start date (ISO 8601 format)
 * - endDate (string): End date (ISO 8601 format)
 * - groupBy (string): Group by field (day, week, month)
 */
router.get('/admin/analytics', [
  query('startDate').optional().isISO8601().withMessage('Invalid start date format'),
  query('endDate').optional().isISO8601().withMessage('Invalid end date format'),
  query('groupBy').optional().isIn(['day', 'week', 'month']).withMessage('Invalid group by value')
], handleValidationErrors, authMiddleware.authenticate(), async (req, res, next) => {
  try {
    // Check if user has admin role
    const userRole = req.user?.role?.toUpperCase();
    if (!req.user || (userRole !== 'ADMIN' && userRole !== 'SUPER_ADMIN')) {
      return res.status(403).json({
        error: 'Insufficient permissions'
      });
    }
    
    const { startDate, endDate, groupBy } = req.query;
    const analytics = await searchAnalyticsService.getAnalytics(startDate, endDate, groupBy);
    res.json({ success: true, data: analytics });
  } catch (error) {
    loggerService.error('Failed to get admin analytics', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    next(error);
  }
});

/**
 * GET /api/admin/search/performance - Performance metrics
 * 
 * Query Parameters:
 * - startDate (string): Start date (ISO 8601 format)
 * - endDate (string): End date (ISO 8601 format)
 */
router.get('/admin/performance', [
  query('startDate').optional().isISO8601().withMessage('Invalid start date format'),
  query('endDate').optional().isISO8601().withMessage('Invalid end date format')
], handleValidationErrors, authMiddleware.authenticate(), async (req, res, next) => {
  try {
    // Check if user has admin role
    const userRole = req.user?.role?.toUpperCase();
    if (!req.user || (userRole !== 'ADMIN' && userRole !== 'SUPER_ADMIN')) {
      return res.status(403).json({
        error: 'Insufficient permissions'
      });
    }
    
    const { startDate, endDate } = req.query;
    const metrics = await searchAnalyticsService.getPerformanceMetrics(startDate, endDate);
    res.json({ success: true, data: metrics });
  } catch (error) {
    loggerService.error('Failed to get performance metrics', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    next(error);
  }
});

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Generate a random session ID
 * @returns {string} Session ID
 */
function generateSessionId() {
  return `sess_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// ============================================
// EXPORTS
// ============================================

module.exports = {
  router,
  initializeSearchAnalyticsController
};
