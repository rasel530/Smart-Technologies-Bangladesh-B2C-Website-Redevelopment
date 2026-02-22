/**
 * Admin Performance Routes
 * 
 * API endpoints for monitoring cart performance metrics
 * and cache statistics.
 * 
 * @module routes/admin/performance
 */

const express = require('express');
const { authMiddleware } = require('../../middleware/auth');
const { roleBasedAccess } = require('../../middleware/roleBasedAccess');
const { cartPerformanceService } = require('../../services/cartPerformanceService');
const { cartCacheService } = require('../../services/cartCacheService');
const { cartQueueService } = require('../../services/cartQueueService');
const { compressionMiddleware } = require('../../middleware/compression');

const router = express.Router();

// Apply compression to all admin performance routes
router.use(compressionMiddleware());

/**
 * GET /api/v1/admin/performance/cart
 * Get cart performance metrics
 */
router.get('/cart', 
  authMiddleware.authenticate(),
  roleBasedAccess(['admin', 'super_admin']),
  async (req, res) => {
    try {
      const report = await cartPerformanceService.generatePerformanceReport();
      
      res.json({
        success: true,
        data: report,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to generate performance report',
        message: error.message,
      });
    }
  }
);

/**
 * GET /api/v1/admin/performance/cache
 * Get cache statistics
 */
router.get('/cache',
  authMiddleware.authenticate(),
  roleBasedAccess(['admin', 'super_admin']),
  async (req, res) => {
    try {
      const stats = cartCacheService.getCacheStats();
      
      res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to get cache statistics',
        message: error.message,
      });
    }
  }
);

/**
 * GET /api/v1/admin/performance/queue
 * Get queue status
 */
router.get('/queue',
  authMiddleware.authenticate(),
  roleBasedAccess(['admin', 'super_admin']),
  async (req, res) => {
    try {
      const status = await cartQueueService.getQueueStatus();
      
      res.json({
        success: true,
        data: status,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to get queue status',
        message: error.message,
      });
    }
  }
);

/**
 * GET /api/v1/admin/performance/dead-letter
 * Get dead letter queue entries
 */
router.get('/dead-letter',
  authMiddleware.authenticate(),
  roleBasedAccess(['admin', 'super_admin']),
  async (req, res) => {
    try {
      const limit = parseInt(req.query.limit) || 100;
      const entries = await cartQueueService.getDeadLetterEntries(limit);
      
      res.json({
        success: true,
        data: {
          entries,
          count: entries.length,
        },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to get dead letter entries',
        message: error.message,
      });
    }
  }
);

/**
 * POST /api/v1/admin/performance/dead-letter/:id/retry
 * Retry a dead letter entry
 */
router.post('/dead-letter/:id/retry',
  authMiddleware.authenticate(),
  roleBasedAccess(['admin', 'super_admin']),
  async (req, res) => {
    try {
      const result = await cartQueueService.retryDeadLetterEntry(req.params.id);
      
      if (result.success) {
        res.json({
          success: true,
          message: 'Entry scheduled for retry',
          data: result,
        });
      } else {
        res.status(400).json({
          success: false,
          error: result.error,
        });
      }
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to retry dead letter entry',
        message: error.message,
      });
    }
  }
);

/**
 * POST /api/v1/admin/performance/cache/clear
 * Clear all cart cache
 */
router.post('/cache/clear',
  authMiddleware.authenticate(),
  roleBasedAccess(['admin', 'super_admin']),
  async (req, res) => {
    try {
      await cartCacheService.clearAllCache();
      
      res.json({
        success: true,
        message: 'Cart cache cleared successfully',
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to clear cache',
        message: error.message,
      });
    }
  }
);

/**
 * POST /api/v1/admin/performance/queue/clear
 * Clear all queues
 */
router.post('/queue/clear',
  authMiddleware.authenticate(),
  roleBasedAccess(['admin', 'super_admin']),
  async (req, res) => {
    try {
      const result = await cartQueueService.clearAllQueues();
      
      if (result.success) {
        res.json({
          success: true,
          message: 'All queues cleared successfully',
        });
      } else {
        res.status(400).json({
          success: false,
          error: result.error,
        });
      }
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to clear queues',
        message: error.message,
      });
    }
  }
);

/**
 * POST /api/v1/admin/performance/alerts/:id/acknowledge
 * Acknowledge a performance alert
 */
router.post('/alerts/:id/acknowledge',
  authMiddleware.authenticate(),
  roleBasedAccess(['admin', 'super_admin']),
  async (req, res) => {
    try {
      const acknowledged = cartPerformanceService.acknowledgeAlert(req.params.id);
      
      if (acknowledged) {
        res.json({
          success: true,
          message: 'Alert acknowledged',
        });
      } else {
        res.status(404).json({
          success: false,
          error: 'Alert not found',
        });
      }
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to acknowledge alert',
        message: error.message,
      });
    }
  }
);

/**
 * GET /api/v1/admin/performance/slow-queries
 * Get slow query log
 */
router.get('/slow-queries',
  authMiddleware.authenticate(),
  roleBasedAccess(['admin', 'super_admin']),
  async (req, res) => {
    try {
      const metrics = cartPerformanceService.getMetrics({
        includeSlowQueries: true,
      });
      
      res.json({
        success: true,
        data: {
          slowQueries: metrics.slowQueries,
          count: metrics.slowQueries?.length || 0,
        },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to get slow queries',
        message: error.message,
      });
    }
  }
);

/**
 * GET /api/v1/admin/performance/dashboard
 * Get complete dashboard data
 */
router.get('/dashboard',
  authMiddleware.authenticate(),
  roleBasedAccess(['admin', 'super_admin']),
  async (req, res) => {
    try {
      const [performanceReport, cacheStats, queueStatus] = await Promise.all([
        cartPerformanceService.generatePerformanceReport(),
        cartCacheService.getCacheStats(),
        cartQueueService.getQueueStatus(),
      ]);
      
      res.json({
        success: true,
        data: {
          performance: performanceReport,
          cache: cacheStats,
          queue: queueStatus,
          timestamp: new Date().toISOString(),
        },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to generate dashboard data',
        message: error.message,
      });
    }
  }
);

module.exports = router;
