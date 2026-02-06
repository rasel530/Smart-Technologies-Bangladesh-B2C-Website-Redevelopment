/**
 * Admin Search Analytics API Routes
 * 
 * This module provides admin-only endpoints for search analytics, performance monitoring,
 * optimization, personalization, and trending searches management.
 * All endpoints require admin authentication.
 */

const express = require('express');
const { body, query, param, validationResult } = require('express-validator');
const { authMiddleware } = require('../../middleware/auth');
const { loggerService } = require('../../services/logger');
const { AdminSearchAnalyticsService } = require('../../services/adminSearchAnalytics.service');

const router = express.Router();

// Initialize services
let adminSearchAnalyticsService;

/**
 * Initialize admin search analytics controller with services
 * @param {Object} services - Service instances
 */
function initializeAdminSearchAnalyticsController(services) {
  adminSearchAnalyticsService = services.adminSearchAnalyticsService || new AdminSearchAnalyticsService();
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
 * Admin authentication middleware
 */
const authenticateAdmin = [
  authMiddleware.authenticate(),
  authMiddleware.adminOnly()
];

// ============================================================================
// ANALYTICS ENDPOINTS
// ============================================================================

/**
 * GET /api/admin/search/analytics/overview - Get analytics overview
 * 
 * Query Parameters:
 * - timeRange (string): Time period (today, week, month, all) (default: week)
 */
router.get('/analytics/overview', [
  query('timeRange').optional().isIn(['today', 'week', 'month', 'all']).withMessage('Invalid time range')
], handleValidationErrors, ...authenticateAdmin, async (req, res, next) => {
  try {
    const timeRange = req.query.timeRange || 'week';

    const overview = await adminSearchAnalyticsService.getAnalyticsOverview(timeRange);

    res.status(200).json({
      success: true,
      data: overview
    });
  } catch (error) {
    loggerService.error('Failed to get analytics overview', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    next(error);
  }
});

/**
 * GET /api/admin/search/analytics/metrics - Get analytics metrics
 * 
 * Query Parameters:
 * - startDate (string): Start date (ISO 8601 format)
 * - endDate (string): End date (ISO 8601 format)
 */
router.get('/analytics/metrics', [
  query('startDate').optional().isISO8601().withMessage('Invalid start date format'),
  query('endDate').optional().isISO8601().withMessage('Invalid end date format')
], handleValidationErrors, ...authenticateAdmin, async (req, res, next) => {
  try {
    const startDate = req.query.startDate 
      ? new Date(req.query.startDate) 
      : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const endDate = req.query.endDate 
      ? new Date(req.query.endDate) 
      : new Date();

    const metrics = await adminSearchAnalyticsService.getAnalyticsMetrics(startDate, endDate);

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
 * GET /api/admin/search/analytics/queries - Get search queries
 * 
 * Query Parameters:
 * - query (string): Filter by query text
 * - minResults (number): Minimum results count
 * - maxResults (number): Maximum results count
 * - minResponseTime (number): Minimum response time
 * - maxResponseTime (number): Maximum response time
 * - hasConversion (boolean): Filter by conversion status
 * - startDate (string): Start date (ISO 8601 format)
 * - endDate (string): End date (ISO 8601 format)
 * - page (number): Page number (default: 1)
 * - limit (number): Results per page (default: 20)
 * - sortBy (string): Sort field (default: count)
 * - sortOrder (string): Sort order (asc, desc) (default: desc)
 */
router.get('/analytics/queries', [
  query('query').optional().isString(),
  query('minResults').optional().isInt({ min: 0 }),
  query('maxResults').optional().isInt({ min: 0 }),
  query('minResponseTime').optional().isInt({ min: 0 }),
  query('maxResponseTime').optional().isInt({ min: 0 }),
  query('hasConversion').optional().isBoolean(),
  query('startDate').optional().isISO8601(),
  query('endDate').optional().isISO8601(),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('sortBy').optional().isString(),
  query('sortOrder').optional().isIn(['asc', 'desc'])
], handleValidationErrors, ...authenticateAdmin, async (req, res, next) => {
  try {
    const filters = {
      query: req.query.query,
      minResults: req.query.minResults ? parseInt(req.query.minResults) : undefined,
      maxResults: req.query.maxResults ? parseInt(req.query.maxResults) : undefined,
      minResponseTime: req.query.minResponseTime ? parseInt(req.query.minResponseTime) : undefined,
      maxResponseTime: req.query.maxResponseTime ? parseInt(req.query.maxResponseTime) : undefined,
      hasConversion: req.query.hasConversion !== undefined ? req.query.hasConversion === 'true' : undefined,
      startDate: req.query.startDate,
      endDate: req.query.endDate
    };

    const pagination = {
      page: req.query.page ? parseInt(req.query.page) : 1,
      limit: req.query.limit ? parseInt(req.query.limit) : 20,
      sortBy: req.query.sortBy || 'count',
      sortOrder: req.query.sortOrder || 'desc'
    };

    const result = await adminSearchAnalyticsService.getSearchQueries(filters, pagination);

    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    loggerService.error('Failed to get search queries', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    next(error);
  }
});

/**
 * GET /api/admin/search/analytics/queries/:id - Get query details
 * 
 * Path Parameters:
 * - id (string): Query ID or query string
 */
router.get('/analytics/queries/:id', [
  param('id').trim().notEmpty().withMessage('Query ID is required')
], handleValidationErrors, ...authenticateAdmin, async (req, res, next) => {
  try {
    const queryId = req.params.id;

    const details = await adminSearchAnalyticsService.getQueryDetails(queryId);

    res.status(200).json({
      success: true,
      data: details
    });
  } catch (error) {
    loggerService.error('Failed to get query details', {
      error: error instanceof Error ? error.message : 'Unknown error',
      queryId: req.params.id
    });
    next(error);
  }
});

/**
 * GET /api/admin/search/analytics/zero-results - Get zero-result queries
 * 
 * Query Parameters:
 * - limit (number): Maximum number of results (default: 50)
 */
router.get('/analytics/zero-results', [
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100')
], handleValidationErrors, ...authenticateAdmin, async (req, res, next) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit) : 50;

    const queries = await adminSearchAnalyticsService.getZeroResultQueries(limit);

    res.status(200).json({
      success: true,
      data: queries
    });
  } catch (error) {
    loggerService.error('Failed to get zero-result queries', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    next(error);
  }
});

/**
 * GET /api/admin/search/analytics/conversions - Get conversion data
 * 
 * Query Parameters:
 * - timeRange (string): Time period (today, week, month, all) (default: week)
 */
router.get('/analytics/conversions', [
  query('timeRange').optional().isIn(['today', 'week', 'month', 'all']).withMessage('Invalid time range')
], handleValidationErrors, ...authenticateAdmin, async (req, res, next) => {
  try {
    const timeRange = req.query.timeRange || 'week';

    const data = await adminSearchAnalyticsService.getConversionData(timeRange);

    res.status(200).json({
      success: true,
      data: data
    });
  } catch (error) {
    loggerService.error('Failed to get conversion data', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    next(error);
  }
});

/**
 * GET /api/admin/search/analytics/export - Export analytics data
 * 
 * Query Parameters:
 * - format (string): Export format (csv, excel) (default: csv)
 * - startDate (string): Start date (ISO 8601 format)
 * - endDate (string): End date (ISO 8601 format)
 * - minResults (number): Minimum results count
 * - maxResults (number): Maximum results count
 */
router.get('/analytics/export', [
  query('format').optional().isIn(['csv', 'excel']).withMessage('Invalid format'),
  query('startDate').optional().isISO8601(),
  query('endDate').optional().isISO8601(),
  query('minResults').optional().isInt({ min: 0 }),
  query('maxResults').optional().isInt({ min: 0 })
], handleValidationErrors, ...authenticateAdmin, async (req, res, next) => {
  try {
    const format = req.query.format || 'csv';
    const filters = {
      startDate: req.query.startDate,
      endDate: req.query.endDate,
      minResults: req.query.minResults ? parseInt(req.query.minResults) : undefined,
      maxResults: req.query.maxResults ? parseInt(req.query.maxResults) : undefined
    };

    const exportData = await adminSearchAnalyticsService.exportAnalyticsData(format, filters);

    res.status(200).json({
      success: true,
      data: exportData
    });
  } catch (error) {
    loggerService.error('Failed to export analytics data', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    next(error);
  }
});

// ============================================================================
// PERFORMANCE ENDPOINTS
// ============================================================================

/**
 * GET /api/admin/search/performance/overview - Get performance overview
 * 
 * Query Parameters:
 * - timeRange (string): Time period (today, week, month, all) (default: week)
 */
router.get('/performance/overview', [
  query('timeRange').optional().isIn(['today', 'week', 'month', 'all']).withMessage('Invalid time range')
], handleValidationErrors, ...authenticateAdmin, async (req, res, next) => {
  try {
    const timeRange = req.query.timeRange || 'week';

    const overview = await adminSearchAnalyticsService.getPerformanceOverview(timeRange);

    res.status(200).json({
      success: true,
      data: overview
    });
  } catch (error) {
    loggerService.error('Failed to get performance overview', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    next(error);
  }
});

/**
 * GET /api/admin/search/performance/metrics - Get performance metrics
 * 
 * Query Parameters:
 * - timeRange (string): Time period (today, week, month, all) (default: week)
 */
router.get('/performance/metrics', [
  query('timeRange').optional().isIn(['today', 'week', 'month', 'all']).withMessage('Invalid time range')
], handleValidationErrors, ...authenticateAdmin, async (req, res, next) => {
  try {
    const timeRange = req.query.timeRange || 'week';

    const metrics = await adminSearchAnalyticsService.getPerformanceMetrics(timeRange);

    res.status(200).json({
      success: true,
      data: metrics
    });
  } catch (error) {
    loggerService.error('Failed to get performance metrics', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    next(error);
  }
});

/**
 * GET /api/admin/search/performance/alerts - Get performance alerts
 * 
 * Query Parameters:
 * - slowQueryThreshold (number): Slow query threshold in ms (default: 1000)
 * - highZeroResultsThreshold (number): High zero results threshold (default: 10)
 * - lowCacheHitThreshold (number): Low cache hit threshold (default: 50)
 */
router.get('/performance/alerts', [
  query('slowQueryThreshold').optional().isInt({ min: 0 }),
  query('highZeroResultsThreshold').optional().isInt({ min: 0 }),
  query('lowCacheHitThreshold').optional().isInt({ min: 0, max: 100 })
], handleValidationErrors, ...authenticateAdmin, async (req, res, next) => {
  try {
    const thresholds = {
      slowQueryThreshold: req.query.slowQueryThreshold ? parseInt(req.query.slowQueryThreshold) : 1000,
      highZeroResultsThreshold: req.query.highZeroResultsThreshold ? parseInt(req.query.highZeroResultsThreshold) : 10,
      lowCacheHitThreshold: req.query.lowCacheHitThreshold ? parseInt(req.query.lowCacheHitThreshold) : 50
    };

    const alerts = await adminSearchAnalyticsService.getPerformanceAlerts(thresholds);

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
 * PUT /api/admin/search/performance/alerts/:id - Update alert status
 * 
 * Path Parameters:
 * - id (string): Alert ID
 * 
 * Request Body:
 * - status (string): New status (acknowledged, dismissed, resolved)
 */
router.put('/performance/alerts/:id', [
  param('id').trim().notEmpty().withMessage('Alert ID is required'),
  body('status').isIn(['acknowledged', 'dismissed', 'resolved']).withMessage('Invalid status')
], handleValidationErrors, ...authenticateAdmin, async (req, res, next) => {
  try {
    const alertId = req.params.id;
    const { status } = req.body;

    const result = await adminSearchAnalyticsService.updateAlertStatus(alertId, status);

    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    loggerService.error('Failed to update alert status', {
      error: error instanceof Error ? error.message : 'Unknown error',
      alertId: req.params.id
    });
    next(error);
  }
});

/**
 * GET /api/admin/search/performance/comparison - Get performance comparison
 * 
 * Query Parameters:
 * - period1 (string): First period (today, week, month)
 * - period2 (string): Second period (today, week, month)
 */
router.get('/performance/comparison', [
  query('period1').isIn(['today', 'week', 'month']).withMessage('Invalid period1'),
  query('period2').isIn(['today', 'week', 'month']).withMessage('Invalid period2')
], handleValidationErrors, ...authenticateAdmin, async (req, res, next) => {
  try {
    const period1 = req.query.period1;
    const period2 = req.query.period2;

    const comparison = await adminSearchAnalyticsService.getPerformanceComparison(period1, period2);

    res.status(200).json({
      success: true,
      data: comparison
    });
  } catch (error) {
    loggerService.error('Failed to get performance comparison', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    next(error);
  }
});

/**
 * POST /api/admin/search/performance/threshold - Update performance threshold
 * 
 * Request Body:
 * - slowQueryThreshold (number): Slow query threshold in ms
 * - highZeroResultsThreshold (number): High zero results threshold
 * - lowCacheHitThreshold (number): Low cache hit threshold
 */
router.post('/performance/threshold', [
  body('slowQueryThreshold').optional().isInt({ min: 0 }),
  body('highZeroResultsThreshold').optional().isInt({ min: 0 }),
  body('lowCacheHitThreshold').optional().isInt({ min: 0, max: 100 })
], handleValidationErrors, ...authenticateAdmin, async (req, res, next) => {
  try {
    const thresholds = req.body;

    const result = await adminSearchAnalyticsService.updatePerformanceThreshold(thresholds);

    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    loggerService.error('Failed to update performance threshold', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    next(error);
  }
});

// ============================================================================
// OPTIMIZATION ENDPOINTS
// ============================================================================

/**
 * GET /api/admin/search/optimization/patterns - Get query patterns
 * 
 * Query Parameters:
 * - timeRange (string): Time period (today, week, month, all) (default: week)
 */
router.get('/optimization/patterns', [
  query('timeRange').optional().isIn(['today', 'week', 'month', 'all']).withMessage('Invalid time range')
], handleValidationErrors, ...authenticateAdmin, async (req, res, next) => {
  try {
    const timeRange = req.query.timeRange || 'week';

    const patterns = await adminSearchAnalyticsService.getQueryPatterns(timeRange);

    res.status(200).json({
      success: true,
      data: patterns
    });
  } catch (error) {
    loggerService.error('Failed to get query patterns', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    next(error);
  }
});

/**
 * GET /api/admin/search/optimization/experiments - Get experiments
 * 
 * Query Parameters:
 * - status (string): Filter by status (active, paused, completed)
 * - sortBy (string): Sort field (default: startDate)
 * - sortOrder (string): Sort order (asc, desc) (default: desc)
 */
router.get('/optimization/experiments', [
  query('status').optional().isIn(['active', 'paused', 'completed']).withMessage('Invalid status'),
  query('sortBy').optional().isString(),
  query('sortOrder').optional().isIn(['asc', 'desc']).withMessage('Invalid sort order')
], handleValidationErrors, ...authenticateAdmin, async (req, res, next) => {
  try {
    const filters = {
      status: req.query.status,
      sortBy: req.query.sortBy || 'startDate',
      sortOrder: req.query.sortOrder || 'desc'
    };

    const experiments = await adminSearchAnalyticsService.getExperiments(filters);

    res.status(200).json({
      success: true,
      data: experiments
    });
  } catch (error) {
    loggerService.error('Failed to get experiments', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    next(error);
  }
});

/**
 * GET /api/admin/search/optimization/experiments/:id - Get experiment details
 * 
 * Path Parameters:
 * - id (string): Experiment ID
 */
router.get('/optimization/experiments/:id', [
  param('id').trim().notEmpty().withMessage('Experiment ID is required')
], handleValidationErrors, ...authenticateAdmin, async (req, res, next) => {
  try {
    const experimentId = req.params.id;

    const details = await adminSearchAnalyticsService.getExperimentDetails(experimentId);

    res.status(200).json({
      success: true,
      data: details
    });
  } catch (error) {
    loggerService.error('Failed to get experiment details', {
      error: error instanceof Error ? error.message : 'Unknown error',
      experimentId: req.params.id
    });
    next(error);
  }
});

/**
 * POST /api/admin/search/optimization/experiments - Create experiment
 * 
 * Request Body:
 * - name (string): Experiment name
 * - description (string): Experiment description
 * - algorithmVariant (string): Algorithm variant
 * - startDate (string): Start date (ISO 8601 format)
 * - endDate (string): End date (ISO 8601 format) (optional)
 * - sampleSize (number): Sample size
 * - controlGroupPercentage (number): Control group percentage (default: 50)
 */
router.post('/optimization/experiments', [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('description').trim().notEmpty().withMessage('Description is required'),
  body('algorithmVariant').trim().notEmpty().withMessage('Algorithm variant is required'),
  body('startDate').isISO8601().withMessage('Invalid start date format'),
  body('endDate').optional().isISO8601().withMessage('Invalid end date format'),
  body('sampleSize').isInt({ min: 1 }).withMessage('Sample size must be a positive integer'),
  body('controlGroupPercentage').optional().isInt({ min: 1, max: 99 }).withMessage('Control group percentage must be between 1 and 99')
], handleValidationErrors, ...authenticateAdmin, async (req, res, next) => {
  try {
    const experimentData = req.body;

    const experiment = await adminSearchAnalyticsService.createExperiment(experimentData);

    res.status(201).json({
      success: true,
      data: experiment
    });
  } catch (error) {
    loggerService.error('Failed to create experiment', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    next(error);
  }
});

/**
 * PUT /api/admin/search/optimization/experiments/:id/status - Update experiment status
 * 
 * Path Parameters:
 * - id (string): Experiment ID
 * 
 * Request Body:
 * - status (string): New status (active, paused, completed)
 */
router.put('/optimization/experiments/:id/status', [
  param('id').trim().notEmpty().withMessage('Experiment ID is required'),
  body('status').isIn(['active', 'paused', 'completed']).withMessage('Invalid status')
], handleValidationErrors, ...authenticateAdmin, async (req, res, next) => {
  try {
    const experimentId = req.params.id;
    const { status } = req.body;

    const experiment = await adminSearchAnalyticsService.updateExperimentStatus(experimentId, status);

    res.status(200).json({
      success: true,
      data: experiment
    });
  } catch (error) {
    loggerService.error('Failed to update experiment status', {
      error: error instanceof Error ? error.message : 'Unknown error',
      experimentId: req.params.id
    });
    next(error);
  }
});

/**
 * DELETE /api/admin/search/optimization/experiments/:id - Delete experiment
 * 
 * Path Parameters:
 * - id (string): Experiment ID
 */
router.delete('/optimization/experiments/:id', [
  param('id').trim().notEmpty().withMessage('Experiment ID is required')
], handleValidationErrors, ...authenticateAdmin, async (req, res, next) => {
  try {
    const experimentId = req.params.id;

    await adminSearchAnalyticsService.deleteExperiment(experimentId);

    res.status(200).json({
      success: true,
      message: 'Experiment deleted successfully'
    });
  } catch (error) {
    loggerService.error('Failed to delete experiment', {
      error: error instanceof Error ? error.message : 'Unknown error',
      experimentId: req.params.id
    });
    next(error);
  }
});

/**
 * GET /api/admin/search/optimization/insights - Get optimization insights
 */
router.get('/optimization/insights', ...authenticateAdmin, async (req, res, next) => {
  try {
    const insights = await adminSearchAnalyticsService.getOptimizationInsights();

    res.status(200).json({
      success: true,
      data: insights
    });
  } catch (error) {
    loggerService.error('Failed to get optimization insights', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    next(error);
  }
});

// ============================================================================
// PERSONALIZATION ENDPOINTS
// ============================================================================

/**
 * GET /api/admin/search/personalization/overview - Get personalization overview
 */
router.get('/personalization/overview', ...authenticateAdmin, async (req, res, next) => {
  try {
    const overview = await adminSearchAnalyticsService.getPersonalizationOverview();

    res.status(200).json({
      success: true,
      data: overview
    });
  } catch (error) {
    loggerService.error('Failed to get personalization overview', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    next(error);
  }
});

/**
 * GET /api/admin/search/personalization/users - Get user preferences list
 * 
 * Query Parameters:
 * - page (number): Page number (default: 1)
 * - limit (number): Results per page (default: 20)
 */
router.get('/personalization/users', [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 })
], handleValidationErrors, ...authenticateAdmin, async (req, res, next) => {
  try {
    const pagination = {
      page: req.query.page ? parseInt(req.query.page) : 1,
      limit: req.query.limit ? parseInt(req.query.limit) : 20
    };

    const result = await adminSearchAnalyticsService.getUserPreferencesList({}, pagination);

    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    loggerService.error('Failed to get user preferences list', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    next(error);
  }
});

/**
 * GET /api/admin/search/personalization/users/:id - Get user preferences detail
 * 
 * Path Parameters:
 * - id (string): User ID
 */
router.get('/personalization/users/:id', [
  param('id').trim().notEmpty().withMessage('User ID is required')
], handleValidationErrors, ...authenticateAdmin, async (req, res, next) => {
  try {
    const userId = req.params.id;

    const detail = await adminSearchAnalyticsService.getUserPreferencesDetail(userId);

    res.status(200).json({
      success: true,
      data: detail
    });
  } catch (error) {
    loggerService.error('Failed to get user preferences detail', {
      error: error instanceof Error ? error.message : 'Unknown error',
      userId: req.params.id
    });
    next(error);
  }
});

/**
 * PUT /api/admin/search/personalization/users/:id - Update user preferences
 * 
 * Path Parameters:
 * - id (string): User ID
 * 
 * Request Body:
 * - preferences (object): User preferences
 */
router.put('/personalization/users/:id', [
  param('id').trim().notEmpty().withMessage('User ID is required'),
  body().isObject().withMessage('Preferences must be an object')
], handleValidationErrors, ...authenticateAdmin, async (req, res, next) => {
  try {
    const userId = req.params.id;
    const preferences = req.body;

    const updated = await adminSearchAnalyticsService.updateUserPreferencesAdmin(userId, preferences);

    res.status(200).json({
      success: true,
      data: updated
    });
  } catch (error) {
    loggerService.error('Failed to update user preferences', {
      error: error instanceof Error ? error.message : 'Unknown error',
      userId: req.params.id
    });
    next(error);
  }
});

/**
 * GET /api/admin/search/personalization/metrics - Get personalization metrics
 * 
 * Query Parameters:
 * - timeRange (string): Time period (today, week, month, all) (default: week)
 */
router.get('/personalization/metrics', [
  query('timeRange').optional().isIn(['today', 'week', 'month', 'all']).withMessage('Invalid time range')
], handleValidationErrors, ...authenticateAdmin, async (req, res, next) => {
  try {
    const timeRange = req.query.timeRange || 'week';

    const metrics = await adminSearchAnalyticsService.getPersonalizationMetrics(timeRange);

    res.status(200).json({
      success: true,
      data: metrics
    });
  } catch (error) {
    loggerService.error('Failed to get personalization metrics', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    next(error);
  }
});

/**
 * GET /api/admin/search/personalization/recommendations - Get recommendation statistics
 * 
 * Query Parameters:
 * - timeRange (string): Time period (today, week, month, all) (default: week)
 */
router.get('/personalization/recommendations', [
  query('timeRange').optional().isIn(['today', 'week', 'month', 'all']).withMessage('Invalid time range')
], handleValidationErrors, ...authenticateAdmin, async (req, res, next) => {
  try {
    const timeRange = req.query.timeRange || 'week';

    const stats = await adminSearchAnalyticsService.getRecommendationStats(timeRange);

    res.status(200).json({
      success: true,
      data: stats
    });
  } catch (error) {
    loggerService.error('Failed to get recommendation statistics', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    next(error);
  }
});

/**
 * PUT /api/admin/search/personalization/config - Update personalization configuration
 * 
 * Request Body:
 * - config (object): Personalization configuration
 */
router.put('/personalization/config', [
  body().isObject().withMessage('Config must be an object')
], handleValidationErrors, ...authenticateAdmin, async (req, res, next) => {
  try {
    const config = req.body;

    const result = await adminSearchAnalyticsService.updatePersonalizationConfig(config);

    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    loggerService.error('Failed to update personalization config', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    next(error);
  }
});

// ============================================================================
// TRENDING ENDPOINTS
// ============================================================================

/**
 * GET /api/admin/search/trending/overview - Get trending overview
 */
router.get('/trending/overview', ...authenticateAdmin, async (req, res, next) => {
  try {
    const overview = await adminSearchAnalyticsService.getTrendingOverview();

    res.status(200).json({
      success: true,
      data: overview
    });
  } catch (error) {
    loggerService.error('Failed to get trending overview', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    next(error);
  }
});

/**
 * GET /api/admin/search/trending/searches - Get trending searches
 * 
 * Query Parameters:
 * - limit (number): Maximum number of results (default: 20)
 * - timeRange (string): Time period (1h, 24h, 7d, 30d) (default: 24h)
 */
router.get('/trending/searches', [
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('timeRange').optional().isIn(['1h', '24h', '7d', '30d']).withMessage('Invalid time range')
], handleValidationErrors, ...authenticateAdmin, async (req, res, next) => {
  try {
    const filters = {
      limit: req.query.limit ? parseInt(req.query.limit) : 20,
      timeRange: req.query.timeRange || '24h'
    };

    const searches = await adminSearchAnalyticsService.getTrendingSearches(filters);

    res.status(200).json({
      success: true,
      data: searches
    });
  } catch (error) {
    loggerService.error('Failed to get trending searches', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    next(error);
  }
});

/**
 * GET /api/admin/search/trending/products - Get trending products
 * 
 * Query Parameters:
 * - limit (number): Maximum number of results (default: 20)
 * - timeRange (string): Time period (1h, 24h, 7d, 30d) (default: 24h)
 */
router.get('/trending/products', [
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('timeRange').optional().isIn(['1h', '24h', '7d', '30d']).withMessage('Invalid time range')
], handleValidationErrors, ...authenticateAdmin, async (req, res, next) => {
  try {
    const filters = {
      limit: req.query.limit ? parseInt(req.query.limit) : 20,
      timeRange: req.query.timeRange || '24h'
    };

    const products = await adminSearchAnalyticsService.getTrendingProducts(filters);

    res.status(200).json({
      success: true,
      data: products
    });
  } catch (error) {
    loggerService.error('Failed to get trending products', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    next(error);
  }
});

/**
 * POST /api/admin/search/trending/calculate - Calculate trends
 */
router.post('/trending/calculate', ...authenticateAdmin, async (req, res, next) => {
  try {
    const result = await adminSearchAnalyticsService.calculateTrends();

    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    loggerService.error('Failed to calculate trends', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    next(error);
  }
});

/**
 * PUT /api/admin/search/trending/threshold - Update trend threshold
 * 
 * Request Body:
 * - threshold (number): New threshold
 */
router.put('/trending/threshold', [
  body('threshold').isInt({ min: 0 }).withMessage('Threshold must be a non-negative integer')
], handleValidationErrors, ...authenticateAdmin, async (req, res, next) => {
  try {
    const threshold = req.body.threshold;

    const result = await adminSearchAnalyticsService.updateTrendThreshold(threshold);

    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    loggerService.error('Failed to update trend threshold', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    next(error);
  }
});

/**
 * PUT /api/admin/search/trending/decay - Update trend decay
 * 
 * Request Body:
 * - decay (number): New decay factor
 */
router.put('/trending/decay', [
  body('decay').isFloat({ min: 0, max: 1 }).withMessage('Decay must be between 0 and 1')
], handleValidationErrors, ...authenticateAdmin, async (req, res, next) => {
  try {
    const decay = req.body.decay;

    const result = await adminSearchAnalyticsService.updateTrendDecay(decay);

    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    loggerService.error('Failed to update trend decay', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    next(error);
  }
});

/**
 * DELETE /api/admin/search/trending/old - Clear old trends
 * 
 * Query Parameters:
 * - days (number): Days to keep (default: 30)
 */
router.delete('/trending/old', [
  query('days').optional().isInt({ min: 1 })
], handleValidationErrors, ...authenticateAdmin, async (req, res, next) => {
  try {
    const days = req.query.days ? parseInt(req.query.days) : 30;

    const result = await adminSearchAnalyticsService.clearOldTrends(days);

    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    loggerService.error('Failed to clear old trends', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    next(error);
  }
});

// ============================================================================
// EXPORTS
// ============================================================================

module.exports = {
  router,
  initializeAdminSearchAnalyticsController
};
