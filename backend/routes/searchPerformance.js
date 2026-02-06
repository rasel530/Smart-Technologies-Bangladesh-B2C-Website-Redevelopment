/**
 * Search Performance API Routes
 * 
 * This module provides endpoints for monitoring search performance metrics,
 * tracking response times, cache efficiency, and generating alerts.
 */

const express = require('express');
const { body, query, validationResult } = require('express-validator');
const { authMiddleware } = require('../middleware/auth');
const { loggerService } = require('../services/logger');
const { SearchPerformanceService } = require('../services/searchPerformance.service');

const router = express.Router();

// Initialize services
let searchPerformanceService;

/**
 * Initialize search performance controller with services
 * @param {Object} services - Service instances
 */
function initializeSearchPerformanceController(services) {
  searchPerformanceService = services.searchPerformanceService || new SearchPerformanceService();
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
// SEARCH PERFORMANCE ENDPOINTS
// ============================================

/**
 * GET /api/search/performance - Get performance metrics
 * 
 * Query Parameters:
 * - timeRange (string): Time range (hour, day, week, month) (default: day)
 */
router.get('/', authMiddleware.authenticate(), [
  query('timeRange').optional().isIn(['hour', 'day', 'week', 'month']).withMessage('Invalid time range')
], handleValidationErrors, async (req, res, next) => {
  try {
    // Only allow admins to access performance metrics
    if (req.user.role !== 'admin' && req.user.role !== 'super_admin') {
      return res.status(403).json({
        error: 'Insufficient permissions'
      });
    }

    const timeRange = req.query.timeRange || 'day';

    const performanceMetrics = await searchPerformanceService.getPerformanceMetrics(timeRange);

    res.status(200).json({
      success: true,
      data: performanceMetrics
    });
  } catch (error) {
    loggerService.error('Failed to get performance metrics', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    next(error);
  }
});

/**
 * GET /api/search/performance/alerts - Get performance alerts
 * 
 * Query Parameters:
 * - maxAvgResponseTime (number): Maximum average response time threshold (default: 1000)
 * - maxP95ResponseTime (number): Maximum P95 response time threshold (default: 2000)
 * - maxP99ResponseTime (number): Maximum P99 response time threshold (default: 3000)
 * - minCacheHitRate (number): Minimum cache hit rate threshold (default: 0.7)
 * - maxZeroResultRate (number): Maximum zero result rate threshold (default: 0.1)
 */
router.get('/alerts', authMiddleware.authenticate(), [
  query('maxAvgResponseTime').optional().isInt({ min: 0 }).withMessage('Invalid max average response time'),
  query('maxP95ResponseTime').optional().isInt({ min: 0 }).withMessage('Invalid max P95 response time'),
  query('maxP99ResponseTime').optional().isInt({ min: 0 }).withMessage('Invalid max P99 response time'),
  query('minCacheHitRate').optional().isFloat({ min: 0, max: 1 }).withMessage('Invalid min cache hit rate'),
  query('maxZeroResultRate').optional().isFloat({ min: 0, max: 1 }).withMessage('Invalid max zero result rate')
], handleValidationErrors, async (req, res, next) => {
  try {
    // Only allow admins to access performance alerts
    if (req.user.role !== 'admin' && req.user.role !== 'super_admin') {
      return res.status(403).json({
        error: 'Insufficient permissions'
      });
    }

    const threshold = {
      maxAvgResponseTime: parseInt(req.query.maxAvgResponseTime) || 1000,
      maxP95ResponseTime: parseInt(req.query.maxP95ResponseTime) || 2000,
      maxP99ResponseTime: parseInt(req.query.maxP99ResponseTime) || 3000,
      minCacheHitRate: parseFloat(req.query.minCacheHitRate) || 0.7,
      maxZeroResultRate: parseFloat(req.query.maxZeroResultRate) || 0.1
    };

    const alerts = await searchPerformanceService.getPerformanceAlerts(threshold);

    res.status(200).json({
      success: true,
      data: alerts
    });
  } catch (error) {
    loggerService.error('Failed to get performance alerts', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    next(error);
  }
});

/**
 * POST /api/search/performance/record - Record performance metrics
 * 
 * Request Body:
 * - queryCount (number): Number of queries processed (required)
 * - avgResponseTime (number): Average response time in milliseconds (required)
 * - p95ResponseTime (number): 95th percentile response time (required)
 * - p99ResponseTime (number): 99th percentile response time (required)
 * - cacheHitRate (number): Cache hit rate (0-1) (required)
 * - zeroResultQueries (number): Number of zero-result queries (required)
 */
router.post('/record', authMiddleware.authenticate(), [
  body('queryCount').isInt({ min: 0 }).withMessage('Query count must be a non-negative integer'),
  body('avgResponseTime').isInt({ min: 0 }).withMessage('Average response time must be a non-negative integer'),
  body('p95ResponseTime').isInt({ min: 0 }).withMessage('P95 response time must be a non-negative integer'),
  body('p99ResponseTime').isInt({ min: 0 }).withMessage('P99 response time must be a non-negative integer'),
  body('cacheHitRate').isFloat({ min: 0, max: 1 }).withMessage('Cache hit rate must be between 0 and 1'),
  body('zeroResultQueries').isInt({ min: 0 }).withMessage('Zero result queries must be a non-negative integer')
], handleValidationErrors, async (req, res, next) => {
  try {
    // Only allow admins to record performance metrics
    if (req.user.role !== 'admin' && req.user.role !== 'super_admin') {
      return res.status(403).json({
        error: 'Insufficient permissions'
      });
    }

    const {
      queryCount,
      avgResponseTime,
      p95ResponseTime,
      p99ResponseTime,
      cacheHitRate,
      zeroResultQueries
    } = req.body;

    const performanceMetrics = await searchPerformanceService.recordPerformanceMetrics(
      queryCount,
      avgResponseTime,
      p95ResponseTime,
      p99ResponseTime,
      cacheHitRate,
      zeroResultQueries
    );

    res.status(201).json({
      success: true,
      data: performanceMetrics
    });
  } catch (error) {
    loggerService.error('Failed to record performance metrics', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    next(error);
  }
});

/**
 * GET /api/search/performance/aggregate - Aggregate performance data
 * 
 * Query Parameters:
 * - startDate (string): Start date (ISO 8601 format) (required)
 * - endDate (string): End date (ISO 8601 format) (required)
 */
router.get('/aggregate', authMiddleware.authenticate(), [
  query('startDate').isISO8601().withMessage('Invalid start date format'),
  query('endDate').isISO8601().withMessage('Invalid end date format')
], handleValidationErrors, async (req, res, next) => {
  try {
    // Only allow admins to access aggregated data
    if (req.user.role !== 'admin' && req.user.role !== 'super_admin') {
      return res.status(403).json({
        error: 'Insufficient permissions'
      });
    }

    const startDate = new Date(req.query.startDate);
    const endDate = new Date(req.query.endDate);

    const aggregatedData = await searchPerformanceService.aggregatePerformanceData(startDate, endDate);

    res.status(200).json({
      success: true,
      data: aggregatedData
    });
  } catch (error) {
    loggerService.error('Failed to aggregate performance data', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    next(error);
  }
});

/**
 * GET /api/v1/search-performance/zero-results - Get zero-result queries (PUBLIC)
 * 
 * Query Parameters:
 * - timeRange (string): Time range (hour, day, week, month) (default: week)
 * - limit (number): Maximum number of results (default: 10)
 */
router.get('/zero-results', [
  query('timeRange').optional().isIn(['hour', 'day', 'week', 'month']).withMessage('Invalid time range'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100')
], handleValidationErrors, async (req, res, next) => {
  try {
    // Public endpoint - no authentication required
    const timeRange = req.query.timeRange || 'week';
    const limit = parseInt(req.query.limit) || 10;

    // Convert timeRange to startDate/endDate
    const endDate = new Date();
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

    const result = await searchPerformanceService.getZeroResultQueries(startDate, endDate);
    
    // Extract and format the top queries as expected by frontend
    const formattedQueries = result.topQueries
      .slice(0, limit)
      .map(q => ({
        query: q.query,
        count: q.count,
        lastSearched: q.lastSeen
      }));

    res.status(200).json({
      success: true,
      data: formattedQueries
    });
  } catch (error) {
    loggerService.error('Failed to get zero-result queries', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    next(error);
  }
});

/**
 * GET /api/search/performance/realtime - Get real-time performance statistics
 */
router.get('/realtime', authMiddleware.authenticate(), async (req, res, next) => {
  try {
    // Only allow admins to access real-time stats
    if (req.user.role !== 'admin' && req.user.role !== 'super_admin') {
      return res.status(403).json({
        error: 'Insufficient permissions'
      });
    }

    const realTimeStats = searchPerformanceService.getRealTimeStats();

    res.status(200).json({
      success: true,
      data: realTimeStats
    });
  } catch (error) {
    loggerService.error('Failed to get real-time stats', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    next(error);
  }
});

/**
 * POST /api/search/performance/flush - Flush current performance metrics
 */
router.post('/flush', authMiddleware.authenticate(), async (req, res, next) => {
  try {
    // Only allow admins to flush metrics
    if (req.user.role !== 'admin' && req.user.role !== 'super_admin') {
      return res.status(403).json({
        error: 'Insufficient permissions'
      });
    }

    const metrics = await searchPerformanceService.flushMetrics();

    res.status(200).json({
      success: true,
      data: metrics
    });
  } catch (error) {
    loggerService.error('Failed to flush metrics', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    next(error);
  }
});

/**
 * GET /api/search/performance/cache-stats - Get cache statistics
 * 
 * Query Parameters:
 * - timeRange (string): Time range (hour, day, week, month) (default: day)
 */
router.get('/cache-stats', authMiddleware.authenticate(), [
  query('timeRange').optional().isIn(['hour', 'day', 'week', 'month']).withMessage('Invalid time range')
], handleValidationErrors, async (req, res, next) => {
  try {
    // Only allow admins to access cache stats
    if (req.user.role !== 'admin' && req.user.role !== 'super_admin') {
      return res.status(403).json({
        error: 'Insufficient permissions'
      });
    }

    const timeRange = req.query.timeRange || 'day';

    const cacheStats = await searchPerformanceService.getCacheStats(timeRange);

    res.status(200).json({
      success: true,
      data: cacheStats
    });
  } catch (error) {
    loggerService.error('Failed to get cache stats', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    next(error);
  }
});

/**
 * GET /api/v1/search-performance/comparison - Compare performance between time ranges
 * 
 * Query Parameters:
 * - currentRange (string): Current time range (hour, day, week, month) (required)
 * - previousRange (string): Previous time range (hour, day, week, month) (required)
 */
router.get('/comparison', authMiddleware.authenticate(), [
  query('currentRange').isIn(['hour', 'day', 'week', 'month']).withMessage('Invalid current time range'),
  query('previousRange').isIn(['hour', 'day', 'week', 'month']).withMessage('Invalid previous time range')
], handleValidationErrors, async (req, res, next) => {
  try {
    // Only allow admins to access performance comparison
    if (req.user.role !== 'admin' && req.user.role !== 'super_admin') {
      return res.status(403).json({
        error: 'Insufficient permissions'
      });
    }

    const { currentRange, previousRange } = req.query;

    const comparisonData = await searchPerformanceService.getComparisonData(currentRange, previousRange);

    res.status(200).json({
      success: true,
      data: comparisonData
    });
  } catch (error) {
    loggerService.error('Failed to get performance comparison', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    next(error);
  }
});

/**
 * GET /api/v1/search-performance/response-time-distribution - Get response time distribution
 * 
 * Query Parameters:
 * - timeRange (string): Time range (hour, day, week, month) (default: week)
 */
router.get('/response-time-distribution', authMiddleware.authenticate(), [
  query('timeRange').optional().isIn(['hour', 'day', 'week', 'month']).withMessage('Invalid time range')
], handleValidationErrors, async (req, res, next) => {
  try {
    // Only allow admins to access response time distribution
    if (req.user.role !== 'admin' && req.user.role !== 'super_admin') {
      return res.status(403).json({
        error: 'Insufficient permissions'
      });
    }

    const timeRange = req.query.timeRange || 'week';

    const distributionData = await searchPerformanceService.getResponseTimeDistribution(timeRange);

    res.status(200).json({
      success: true,
      data: distributionData
    });
  } catch (error) {
    loggerService.error('Failed to get response time distribution', {
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
  initializeSearchPerformanceController
};
