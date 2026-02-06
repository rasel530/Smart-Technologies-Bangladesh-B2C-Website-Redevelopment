/**
 * Search Optimization API Routes
 * 
 * This module provides endpoints for search query optimization, A/B testing experiments,
 * and analyzing query patterns.
 */

const express = require('express');
const { body, query, validationResult } = require('express-validator');
const { authMiddleware } = require('../middleware/auth');
const { loggerService } = require('../services/logger');
const { SearchOptimizationService } = require('../services/searchOptimization.service');

const router = express.Router();

// Initialize services
let searchOptimizationService;

/**
 * Initialize search optimization controller with services
 * @param {Object} services - Service instances
 */
function initializeSearchOptimizationController(services) {
  searchOptimizationService = services.searchOptimizationService || new SearchOptimizationService();
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
// SEARCH OPTIMIZATION ENDPOINTS
// ============================================

/**
 * GET /api/search/optimization/patterns - Get query patterns analysis
 * 
 * Query Parameters:
 * - timeRange (string): Time range (hour, day, week, month) (default: week)
 */
router.get('/patterns', authMiddleware.authenticate(), [
  query('timeRange').optional().isIn(['hour', 'day', 'week', 'month']).withMessage('Invalid time range')
], handleValidationErrors, async (req, res, next) => {
  try {
    // Only allow admins to access query patterns
    if (req.user.role !== 'admin' && req.user.role !== 'super_admin') {
      return res.status(403).json({
        error: 'Insufficient permissions'
      });
    }

    const timeRange = req.query.timeRange || 'week';

    const queryPatterns = await searchOptimizationService.analyzeQueryPatterns(timeRange);

    res.status(200).json({
      success: true,
      data: queryPatterns
    });
  } catch (error) {
    loggerService.error('Failed to get query patterns', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    next(error);
  }
});

/**
 * POST /api/search/optimization/optimize - Optimize a search query
 * 
 * Request Body:
 * - query (string): Search query text (required)
 * - userId (string): User ID (optional)
 */
router.post('/optimize', [
  body('query').trim().notEmpty().withMessage('Query is required'),
  body('userId').optional().isUUID().withMessage('Invalid user ID')
], handleValidationErrors, async (req, res, next) => {
  try {
    const { query, userId } = req.body;

    const optimizedQuery = await searchOptimizationService.optimizeQuery(query, userId);

    res.status(200).json({
      success: true,
      data: optimizedQuery
    });
  } catch (error) {
    loggerService.error('Failed to optimize query', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    next(error);
  }
});

/**
 * POST /api/search/optimization/experiment - Create A/B test experiment
 * 
 * Request Body:
 * - name (string): Experiment name (required)
 * - description (string): Experiment description (optional)
 * - algorithmVariant (string): Algorithm variant to test (required)
 * - startDate (string): Start date (ISO 8601 format) (required)
 * - endDate (string): End date (ISO 8601 format) (optional)
 */
router.post('/experiment', authMiddleware.authenticate(), [
  body('name').trim().notEmpty().withMessage('Experiment name is required'),
  body('description').optional().isString(),
  body('algorithmVariant').trim().notEmpty().withMessage('Algorithm variant is required'),
  body('startDate').isISO8601().withMessage('Invalid start date format'),
  body('endDate').optional().isISO8601().withMessage('Invalid end date format')
], handleValidationErrors, async (req, res, next) => {
  try {
    // Only allow admins to create experiments
    if (req.user.role !== 'admin' && req.user.role !== 'super_admin') {
      return res.status(403).json({
        error: 'Insufficient permissions'
      });
    }

    const { name, description, algorithmVariant, startDate, endDate } = req.body;

    const experiment = await searchOptimizationService.createExperiment(
      name,
      description,
      algorithmVariant,
      new Date(startDate),
      endDate ? new Date(endDate) : null
    );

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
 * GET /api/search/optimization/experiment/:id - Get experiment results
 * 
 * Path Parameters:
 * - id (string): Experiment ID
 */
router.get('/experiment/:id', authMiddleware.authenticate(), async (req, res, next) => {
  try {
    // Only allow admins to access experiment results
    if (req.user.role !== 'admin' && req.user.role !== 'super_admin') {
      return res.status(403).json({
        error: 'Insufficient permissions'
      });
    }

    const experimentId = req.params.id;

    const experimentResults = await searchOptimizationService.getExperimentResults(experimentId);

    res.status(200).json({
      success: true,
      data: experimentResults
    });
  } catch (error) {
    loggerService.error('Failed to get experiment results', {
      error: error instanceof Error ? error.message : 'Unknown error',
      experimentId: req.params.id
    });
    next(error);
  }
});

/**
 * GET /api/search/optimization/experiments - List all experiments
 * 
 * Query Parameters:
 * - activeOnly (boolean): Only return active experiments (default: false)
 */
router.get('/experiments', authMiddleware.authenticate(), [
  query('activeOnly').optional().isBoolean().withMessage('activeOnly must be a boolean')
], handleValidationErrors, async (req, res, next) => {
  try {
    // Only allow admins to list experiments
    if (req.user.role !== 'admin' && req.user.role !== 'super_admin') {
      return res.status(403).json({
        error: 'Insufficient permissions'
      });
    }

    const activeOnly = req.query.activeOnly === 'true' || req.query.activeOnly === true;

    const experiments = await searchOptimizationService.listExperiments(activeOnly);

    res.status(200).json({
      success: true,
      data: experiments
    });
  } catch (error) {
    loggerService.error('Failed to list experiments', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    next(error);
  }
});

/**
 * POST /api/search/optimization/assign - Assign user to experiment
 * 
 * Request Body:
 * - userId (string): User ID (required)
 * - experimentId (string): Experiment ID (required)
 */
router.post('/assign', [
  body('userId').isUUID().withMessage('Invalid user ID'),
  body('experimentId').isUUID().withMessage('Invalid experiment ID')
], handleValidationErrors, async (req, res, next) => {
  try {
    const { userId, experimentId } = req.body;

    const variant = await searchOptimizationService.assignUserToExperiment(userId, experimentId);

    res.status(200).json({
      success: true,
      data: {
        userId,
        experimentId,
        variant
      }
    });
  } catch (error) {
    loggerService.error('Failed to assign user to experiment', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    next(error);
  }
});

/**
 * POST /api/search/optimization/results - Get optimized search results
 * 
 * Request Body:
 * - query (string): Search query (required)
 * - filters (object): Search filters (optional)
 * - sortBy (string): Sort order (optional)
 * - userId (string): User ID (optional)
 * - experimentVariant (string): A/B test variant (optional)
 */
router.post('/results', [
  body('query').trim().notEmpty().withMessage('Query is required'),
  body('filters').optional().isObject(),
  body('sortBy').optional().isString(),
  body('userId').optional().isUUID().withMessage('Invalid user ID'),
  body('experimentVariant').optional().isString()
], handleValidationErrors, async (req, res, next) => {
  try {
    const { query, filters, sortBy, userId, experimentVariant } = req.body;

    const optimizedResults = await searchOptimizationService.getOptimizedResults(
      query,
      filters || {},
      sortBy || 'relevance',
      userId,
      experimentVariant
    );

    res.status(200).json({
      success: true,
      data: optimizedResults
    });
  } catch (error) {
    loggerService.error('Failed to get optimized results', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    next(error);
  }
});

/**
 * POST /api/search/optimization/metrics - Update experiment metrics
 * 
 * Request Body:
 * - experimentId (string): Experiment ID (required)
 * - metrics (object): Metrics to update (required)
 */
router.post('/metrics', authMiddleware.authenticate(), [
  body('experimentId').isUUID().withMessage('Invalid experiment ID'),
  body('metrics').isObject().withMessage('Metrics must be an object')
], handleValidationErrors, async (req, res, next) => {
  try {
    // Only allow admins to update experiment metrics
    if (req.user.role !== 'admin' && req.user.role !== 'super_admin') {
      return res.status(403).json({
        error: 'Insufficient permissions'
      });
    }

    const { experimentId, metrics } = req.body;

    const experiment = await searchOptimizationService.updateExperimentMetrics(experimentId, metrics);

    res.status(200).json({
      success: true,
      data: experiment
    });
  } catch (error) {
    loggerService.error('Failed to update experiment metrics', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    next(error);
  }
});

/**
 * DELETE /api/search/optimization/cache - Clear query optimization cache
 */
router.delete('/cache', authMiddleware.authenticate(), async (req, res, next) => {
  try {
    // Only allow admins to clear cache
    if (req.user.role !== 'admin' && req.user.role !== 'super_admin') {
      return res.status(403).json({
        error: 'Insufficient permissions'
      });
    }

    searchOptimizationService.clearCache();

    res.status(200).json({
      success: true,
      message: 'Query optimization cache cleared'
    });
  } catch (error) {
    loggerService.error('Failed to clear cache', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    next(error);
  }
});

/**
 * POST /api/admin/search/optimization/experiments/:id/results - Get experiment results
 * 
 * Path Parameters:
 * - id (string): Experiment ID
 */
router.post('/admin/optimization/experiments/:id/results', authMiddleware.authenticate(), requireRole(['ADMIN', 'SUPER_ADMIN']), async (req, res, next) => {
  try {
    const { id } = req.params;
    const results = await searchOptimizationService.getExperimentResults(id);
    res.json({ success: true, data: results });
  } catch (error) {
    loggerService.error('Failed to get experiment results', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    next(error);
  }
});

/**
 * POST /api/admin/search/optimization/recommendations - Get optimization recommendations
 */
router.post('/admin/optimization/recommendations', authMiddleware.authenticate(), requireRole(['ADMIN', 'SUPER_ADMIN']), async (req, res, next) => {
  try {
    const recommendations = await searchOptimizationService.generateOptimizationReport();
    res.json({ success: true, data: recommendations });
  } catch (error) {
    loggerService.error('Failed to generate optimization recommendations', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    next(error);
  }
});

/**
 * GET /api/v1/search-optimization/insights - Get optimization insights
 * 
 * Query Parameters:
 * - timeRange (string): Time range (hour, day, week, month) (default: week)
 */
router.get('/insights', authMiddleware.authenticate(), [
  query('timeRange').optional().isIn(['hour', 'day', 'week', 'month']).withMessage('Invalid time range')
], handleValidationErrors, async (req, res, next) => {
  try {
    // Only allow admins to access optimization insights
    if (req.user.role !== 'admin' && req.user.role !== 'super_admin') {
      return res.status(403).json({
        error: 'Insufficient permissions'
      });
    }

    const timeRange = req.query.timeRange || 'week';

    const insights = await searchOptimizationService.getOptimizationInsights(timeRange);

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

/**
 * GET /api/v1/search-optimization/relevance-metrics - Get relevance metrics
 * 
 * Query Parameters:
 * - timeRange (string): Time range (hour, day, week, month) (default: week)
 */
router.get('/relevance-metrics', authMiddleware.authenticate(), [
  query('timeRange').optional().isIn(['hour', 'day', 'week', 'month']).withMessage('Invalid time range')
], handleValidationErrors, async (req, res, next) => {
  try {
    // Only allow admins to access relevance metrics
    if (req.user.role !== 'admin' && req.user.role !== 'super_admin') {
      return res.status(403).json({
        error: 'Insufficient permissions'
      });
    }

    const timeRange = req.query.timeRange || 'week';

    const relevanceMetrics = await searchOptimizationService.getRelevanceMetrics(timeRange);

    res.status(200).json({
      success: true,
      data: relevanceMetrics
    });
  } catch (error) {
    loggerService.error('Failed to get relevance metrics', {
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
  initializeSearchOptimizationController
};
