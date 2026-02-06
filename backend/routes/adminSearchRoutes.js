/**
 * Admin Search API Routes
 * 
 * This module provides admin-only endpoints for search analytics and management
 * including search analytics data, popular searches, and performance metrics.
 */

const express = require('express');
const { query, param, validationResult } = require('express-validator');
const { authMiddleware } = require('../middleware/auth');
const { rbacAuthMiddleware } = require('../middleware/rbacAuth');
const { loggerService } = require('../services/logger');
const { databaseService } = require('../services/database');
const AdminSearchController = require('../controllers/adminSearchController');

const router = express.Router();

// Initialize AdminSearchController with SearchService
// Note: SearchService will be initialized during application startup
let adminSearchController;

/**
 * Initialize admin search controller with search service instance
 * @param {Object} searchService - SearchService instance
 */
function initializeAdminSearchController(searchService) {
  adminSearchController = new AdminSearchController(searchService);
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
// ADMIN SEARCH ENDPOINTS
// ============================================

/**
 * GET /api/admin/search/analytics - Search analytics endpoint
 * 
 * Query Parameters:
 * - startDate (ISO8601): Start date for analytics period
 * - endDate (ISO8601): End date for analytics period
 * - groupBy (string): Grouping option (day, week, month)
 * 
 * Requires: Admin authentication and RBAC authorization
 */
router.get('/analytics', [
  query('startDate').optional().isISO8601(),
  query('endDate').optional().isISO8601(),
  query('groupBy').optional().isIn(['day', 'week', 'month'])
], handleValidationErrors, 
  authMiddleware.authenticate(),
  rbacAuthMiddleware.requireRole('ADMIN', 'SUPER_ADMIN'),
  async (req, res, next) => {
    await adminSearchController.getSearchAnalytics(req, res, next);
  }
);

/**
 * GET /api/admin/search/popular - Popular searches endpoint
 * 
 * Query Parameters:
 * - limit (number): Maximum results (default: 50, max: 200)
 * - period (string): Time period (today, week, month, all)
 * - startDate (ISO8601): Custom start date
 * - endDate (ISO8601): Custom end date
 * 
 * Requires: Admin authentication and RBAC authorization
 */
router.get('/popular', [
  query('limit').optional().isInt({ min: 1, max: 200 }),
  query('period').optional().isIn(['today', 'week', 'month', 'all']),
  query('startDate').optional().isISO8601(),
  query('endDate').optional().isISO8601()
], handleValidationErrors,
  authMiddleware.authenticate(),
  rbacAuthMiddleware.requireRole('ADMIN', 'SUPER_ADMIN'),
  async (req, res, next) => {
    await adminSearchController.getPopularSearches(req, res, next);
  }
);

/**
 * GET /api/admin/search/performance - Performance metrics endpoint
 * 
 * Query Parameters:
 * - startDate (ISO8601): Start date for performance period
 * - endDate (ISO8601): End date for performance period
 * 
 * Requires: Admin authentication and RBAC authorization
 */
router.get('/performance', [
  query('startDate').optional().isISO8601(),
  query('endDate').optional().isISO8601()
], handleValidationErrors,
  authMiddleware.authenticate(),
  rbacAuthMiddleware.requireRole('ADMIN', 'SUPER_ADMIN'),
  async (req, res, next) => {
    await adminSearchController.getSearchPerformance(req, res, next);
  }
);

/**
 * GET /api/v1/admin/search/queries - Get list of search queries
 * 
 * Query Parameters:
 * - page (number): Page number (default: 1)
 * - limit (number): Items per page (default: 20)
 * - query (string): Filter by query text (optional)
 * - sortBy (string): Sort field (default: count)
 * - sortOrder (string): Sort order (asc/desc, default: desc)
 */
router.get('/queries', [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('query').optional().isString().withMessage('Query must be a string'),
  query('sortBy').optional().isIn(['query', 'count', 'avg_results', 'avg_response_time', 'conversion_rate', 'last_searched']).withMessage('Invalid sort field'),
  query('sortOrder').optional().isIn(['asc', 'desc']).withMessage('Invalid sort order')
], handleValidationErrors, async (req, res, next) => {
  try {
    // Authentication required
    if (!req.user) {
      return res.status(401).json({
        error: 'Authentication required'
      });
    }

    // Only allow admins to access admin search queries
    if (req.user.role !== 'admin' && req.user.role !== 'super_admin') {
      return res.status(403).json({
        error: 'Insufficient permissions'
      });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const query = req.query.query || null;
    const sortBy = req.query.sortBy || 'count';
    const sortOrder = req.query.sortOrder || 'desc';

    // Build query
    let sql = `
      SELECT 
        sq.id,
        sq.query_text as query,
        COUNT(*) as count,
        AVG(sq.result_count) as avg_results,
        AVG(EXTRACT(EPOCH FROM (sq.response_time)) * 1000) as avg_response_time,
        COUNT(CASE WHEN sq.conversion = true THEN 1 END)::float / COUNT(*) as conversion_rate,
        MAX(sq.created_at) as last_searched
      FROM search_queries sq
      WHERE 1=1
    `;
    
    const params = [];
    let paramCount = 1;

    if (query) {
      sql += ` AND sq.query_text ILIKE $${paramCount}`;
      params.push(`%${query}%`);
      paramCount++;
    }

    sql += ` GROUP BY sq.id ORDER BY ${sortBy} ${sortOrder}`;
    sql += ` LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    params.push(limit, (page - 1) * limit);

    // Get total count
    const countSql = `
      SELECT COUNT(DISTINCT sq.id) as total
      FROM search_queries sq
      WHERE 1=1
    `;
    const countParams = [];
    let countParamCount = 1;

    if (query) {
      const countSqlFiltered = countSql.replace('WHERE 1=1', `WHERE sq.query_text ILIKE $${countParamCount}`);
      countParams.push(`%${query}%`);
      const countResult = await databaseService.query(countSqlFiltered, countParams);
      var total = parseInt(countResult.rows[0].total);
    } else {
      const countResult = await databaseService.query(countSql, countParams);
      var total = parseInt(countResult.rows[0].total);
    }

    // Get queries
    const result = await databaseService.query(sql, params);

    res.status(200).json({
      success: true,
      data: {
        queries: result.rows,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    loggerService.error('Failed to get admin search queries', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    next(error);
  }
});

/**
 * GET /api/v1/admin/search/queries/:id - Get details for a specific search query
 * 
 * Path Parameters:
 * - id (string): Query ID
 */
router.get('/queries/:id', [
  param('id').isString().withMessage('Query ID must be a string')
], handleValidationErrors, async (req, res, next) => {
  try {
    // Authentication required
    if (!req.user) {
      return res.status(401).json({
        error: 'Authentication required'
      });
    }

    // Only allow admins to access admin search query details
    if (req.user.role !== 'admin' && req.user.role !== 'super_admin') {
      return res.status(403).json({
        error: 'Insufficient permissions'
      });
    }

    const queryId = req.params.id;

    // Get query details
    const queryResult = await databaseService.query(`
      SELECT 
        sq.id,
        sq.query_text as query,
        COUNT(*) as total_searches,
        AVG(sq.result_count) as avg_results,
        AVG(EXTRACT(EPOCH FROM (sq.response_time)) * 1000) as avg_response_time,
        MIN(EXTRACT(EPOCH FROM (sq.response_time)) * 1000) as min_response_time,
        MAX(EXTRACT(EPOCH FROM (sq.response_time)) * 1000) as max_response_time,
        COUNT(CASE WHEN sq.conversion = true THEN 1 END)::float / COUNT(*) as conversion_rate,
        COUNT(CASE WHEN sq.result_count = 0 THEN 1 END) as zero_result_count,
        MIN(sq.created_at) as first_searched,
        MAX(sq.created_at) as last_searched
      FROM search_queries sq
      WHERE sq.id = $1
      GROUP BY sq.id
    `, [queryId]);

    if (queryResult.rows.length === 0) {
      return res.status(404).json({
        error: 'Query not found'
      });
    }

    // Get recent searches for this query
    const recentSearchesResult = await databaseService.query(`
      SELECT 
        sq.id,
        sq.user_id,
        sq.result_count,
        EXTRACT(EPOCH FROM (sq.response_time)) * 1000 as response_time,
        sq.conversion,
        sq.created_at
      FROM search_queries sq
      WHERE sq.query_text = (SELECT query_text FROM search_queries WHERE id = $1 LIMIT 1)
      ORDER BY sq.created_at DESC
      LIMIT 20
    `, [queryId]);

    res.status(200).json({
      success: true,
      data: {
        query: queryResult.rows[0],
        recentSearches: recentSearchesResult.rows
      }
    });
  } catch (error) {
    loggerService.error('Failed to get admin search query details', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    next(error);
  }
});

/**
 * GET /api/v1/admin/search/users/:id/behavior - Get user search behavior
 * 
 * Path Parameters:
 * - id (string): User ID
 * 
 * Query Parameters:
 * - timeRange (string): Time range (today, week, month, all) (default: week)
 */
router.get('/users/:id/behavior', [
  param('id').isString().withMessage('User ID must be a string'),
  query('timeRange').optional().isIn(['today', 'week', 'month', 'all']).withMessage('Invalid time range')
], handleValidationErrors, async (req, res, next) => {
  try {
    // Authentication required
    if (!req.user) {
      return res.status(401).json({
        error: 'Authentication required'
      });
    }

    // Only allow admins to access admin user behavior
    if (req.user.role !== 'admin' && req.user.role !== 'super_admin') {
      return res.status(403).json({
        error: 'Insufficient permissions'
      });
    }

    const userId = req.params.id;
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

    // Get user behavior data
    const behaviorResult = await databaseService.query(`
      SELECT 
        sq.id,
        sq.query_text as query,
        sq.result_count,
        EXTRACT(EPOCH FROM (sq.response_time)) * 1000 as response_time,
        sq.conversion,
        sq.created_at
      FROM search_queries sq
      WHERE sq.user_id = $1 
        AND sq.created_at >= $2 
        AND sq.created_at <= $3
      ORDER BY sq.created_at DESC
      LIMIT 100
    `, [userId, startDate, endDate]);

    // Get user search statistics
    const statsResult = await databaseService.query(`
      SELECT 
        COUNT(*) as total_searches,
        COUNT(CASE WHEN sq.result_count = 0 THEN 1 END) as zero_result_count,
        COUNT(CASE WHEN sq.conversion = true THEN 1 END) as conversion_count,
        AVG(sq.result_count) as avg_results,
        AVG(EXTRACT(EPOCH FROM (sq.response_time)) * 1000) as avg_response_time,
        COUNT(DISTINCT sq.query_text) as unique_queries
      FROM search_queries sq
      WHERE sq.user_id = $1 
        AND sq.created_at >= $2 
        AND sq.created_at <= $3
    `, [userId, startDate, endDate]);

    // Get user preferences
    const preferencesResult = await databaseService.query(`
      SELECT 
        sp.id,
        sp.preferred_categories,
        sp.preferred_brands,
        sp.price_range_min,
        sp.price_range_max,
        sp.updated_at
      FROM search_personalization sp
      WHERE sp.user_id = $1
    `, [userId]);

    res.status(200).json({
      success: true,
      data: {
        userId,
        timeRange,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        behavior: behaviorResult.rows,
        statistics: statsResult.rows[0] || {},
        preferences: preferencesResult.rows[0] || null
      }
    });
  } catch (error) {
    loggerService.error('Failed to get admin user behavior', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    next(error);
  }
});

/**
 * GET /api/v1/admin/search/optimization/experiments - Get optimization experiments
 * 
 * Query Parameters:
 * - timeRange (string): Time range (today, week, month, all) (default: week)
 * - status (string): Filter by status (active, paused, completed) (optional)
 */
router.get('/optimization/experiments', [
  query('timeRange').optional().isIn(['today', 'week', 'month', 'all']).withMessage('Invalid time range'),
  query('status').optional().isIn(['active', 'paused', 'completed']).withMessage('Invalid status')
], handleValidationErrors, async (req, res, next) => {
  try {
    // Authentication required
    if (!req.user) {
      return res.status(401).json({
        error: 'Authentication required'
      });
    }

    // Only allow admins to access admin optimization experiments
    if (req.user.role !== 'admin' && req.user.role !== 'super_admin') {
      return res.status(403).json({
        error: 'Insufficient permissions'
      });
    }

    const timeRange = req.query.timeRange || 'week';
    const status = req.query.status || null;

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

    // Build query
    let sql = `
      SELECT 
        soe.id,
        soe.name,
        soe.description,
        soe.algorithm_variant as algorithmVariant,
        soe.start_date as startDate,
        soe.end_date as endDate,
        soe.sample_size as sampleSize,
        soe.control_group_percentage as controlGroupPercentage,
        soe.status,
        COUNT(soer.id) as total_participants,
        AVG(soer.conversion_rate) as avg_conversion_rate
      FROM search_optimization_experiments soe
      LEFT JOIN search_optimization_experiment_results soer ON soe.id = soer.experiment_id
      WHERE soe.created_at >= $1 AND soe.created_at <= $2
    `;
    
    const params = [startDate, endDate];
    let paramCount = 3;

    if (status) {
      sql += ` AND soe.status = $${paramCount}`;
      params.push(status);
      paramCount++;
    }

    sql += ` GROUP BY soe.id ORDER BY soe.created_at DESC`;

    const result = await databaseService.query(sql, params);

    res.status(200).json({
      success: true,
      data: {
        timeRange,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        experiments: result.rows
      }
    });
  } catch (error) {
    loggerService.error('Failed to get admin optimization experiments', {
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
  initializeAdminSearchController
};
