/**
 * Admin Search API Routes
 * 
 * This module provides admin-only endpoints for search analytics and management
 * including search analytics data, popular searches, and performance metrics.
 */

const express = require('express');
const { query, validationResult } = require('express-validator');
const { authMiddleware } = require('../middleware/auth');
const { rbacAuthMiddleware } = require('../middleware/rbacAuth');
const { loggerService } = require('../services/logger');
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

// ============================================
// EXPORTS
// ============================================

module.exports = {
  router,
  initializeAdminSearchController
};
