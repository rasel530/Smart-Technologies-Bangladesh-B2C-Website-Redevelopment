/**
 * Admin Elasticsearch Management Routes
 * 
 * This module provides admin-only endpoints for managing and monitoring Elasticsearch cluster,
 * including health monitoring, index management, backup management, performance monitoring,
 * and synonym management.
 */

const express = require('express');
const { body, query, param, validationResult } = require('express-validator');
const { elasticsearchConfig } = require('../../config/elasticsearch');
const { elasticsearchClientService } = require('../../services/elasticsearch/client');
const { IndexManagerService, getIndexName, getAliasName } = require('../../services/elasticsearch/indexManager');
const { CacheService } = require('../../services/elasticsearch/cache');
const { PerformanceMonitorService } = require('../../services/elasticsearch/performanceMonitor');
const { 
  getAllSynonyms, 
  getCategorySynonyms, 
  getAllCategories,
  searchSynonyms,
  addSynonym,
  removeSynonym,
  exportSynonymsToFile,
  importSynonymsFromFile,
  getSynonymStatistics
} = require('../../services/elasticsearch/synonyms');
const { authMiddleware } = require('../../middleware/auth');
const { loggerService } = require('../../services/logger');

const router = express.Router();

// Initialize services
const client = elasticsearchConfig.getClient();
const indexManager = new IndexManagerService(client);
const redisClient = require('../../config/redis').redisClient;
const cacheService = new CacheService(redisClient);
const performanceMonitor = new PerformanceMonitorService(client, indexManager, cacheService);

// Validation middleware
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
// CLUSTER HEALTH ENDPOINTS
// ============================================

// GET /api/v1/admin/elasticsearch/health - Get cluster health
router.get('/health', authMiddleware.authenticate(), authMiddleware.adminOnly(), async (req, res) => {
  try {
    const healthResult = await elasticsearchClientService.checkHealth();

    if (!healthResult.success) {
      return res.status(503).json({
        error: 'Elasticsearch health check failed',
        message: healthResult.error
      });
    }

    res.json({
      health: {
        status: healthResult.status,
        clusterName: healthResult.clusterName,
        numberOfNodes: healthResult.numberOfNodes,
        activeShards: healthResult.activeShards,
        timestamp: healthResult.timestamp
      }
    });

  } catch (error) {
    loggerService.error('Elasticsearch health check error', {
      error: error.message,
      stack: error.stack
    });

    res.status(500).json({
      error: 'Failed to get cluster health',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// GET /api/v1/admin/elasticsearch/nodes - Get node information
router.get('/nodes', authMiddleware.authenticate(), authMiddleware.adminOnly(), async (req, res) => {
  try {
    const nodesInfo = await client.nodes.info();

    const nodes = Object.entries(nodesInfo.nodes).map(([nodeId, nodeData]) => ({
      id: nodeId,
      name: nodeData.name,
      host: nodeData.host,
      ip: nodeData.ip,
      version: nodeData.version,
      transportAddress: nodeData.transport_address,
      httpAddress: nodeData.http_address,
      roles: nodeData.roles,
      attributes: nodeData.attributes
    }));

    res.json({
      nodes,
      count: nodes.length
    });

  } catch (error) {
    loggerService.error('Failed to get node information', {
      error: error.message,
      stack: error.stack
    });

    res.status(500).json({
      error: 'Failed to get node information',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// GET /api/v1/admin/elasticsearch/stats - Get cluster statistics
router.get('/stats', authMiddleware.authenticate(), authMiddleware.adminOnly(), async (req, res) => {
  try {
    const clusterStats = await client.cluster.stats();

    res.json({
      clusterName: clusterStats.cluster_name,
      status: clusterStats.status,
      indices: {
        count: clusterStats.indices.count,
        docs: clusterStats.indices.docs,
        store: clusterStats.indices.store,
        indexing: clusterStats.indices.indexing,
        search: clusterStats.indices.search
      },
      nodes: {
        count: clusterStats.nodes.count,
        os: clusterStats.nodes.os,
        jvm: clusterStats.nodes.jvm,
        process: clusterStats.nodes.process
      }
    });

  } catch (error) {
    loggerService.error('Failed to get cluster statistics', {
      error: error.message,
      stack: error.stack
    });

    res.status(500).json({
      error: 'Failed to get cluster statistics',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// ============================================
// INDEX MANAGEMENT ENDPOINTS
// ============================================

// GET /api/admin/elasticsearch/indices - List all indices
router.get('/indices', authMiddleware.authenticate(), authMiddleware.adminOnly(), async (req, res) => {
  try {
    const indicesResult = await indexManager.getAllIndices();

    if (!indicesResult.success) {
      return res.status(500).json({
        error: 'Failed to get indices',
        message: indicesResult.error
      });
    }

    // Get detailed stats for each index
    const indices = [];
    for (const indexName of indicesResult.indices) {
      const statsResult = await indexManager.getIndexStats(indexName);
      const settingsResult = await indexManager.getIndexSettings(indexName);

      indices.push({
        name: indexName,
        stats: statsResult.success ? statsResult.stats : null,
        settings: settingsResult.success ? settingsResult.settings : null
      });
    }

    res.json({
      indices,
      count: indices.length
    });

  } catch (error) {
    loggerService.error('Failed to list indices', {
      error: error.message,
      stack: error.stack
    });

    res.status(500).json({
      error: 'Failed to list indices',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// GET /api/admin/elasticsearch/indices/:name - Get index details
router.get('/indices/:name', [
  param('name').trim().notEmpty().withMessage('Index name is required')
], handleValidationErrors, authMiddleware.authenticate(), authMiddleware.adminOnly(), async (req, res) => {
  try {
    const { name } = req.params;

    const [existsResult, statsResult, settingsResult, mappingResult] = await Promise.all([
      indexManager.checkIndexExists(name),
      indexManager.getIndexStats(name),
      indexManager.getIndexSettings(name),
      indexManager.getIndexMapping(name)
    ]);

    if (!existsResult.success || !existsResult.exists) {
      return res.status(404).json({
        error: 'Index not found',
        message: `Index '${name}' does not exist`
      });
    }

    res.json({
      name,
      exists: true,
      stats: statsResult.success ? statsResult.stats : null,
      settings: settingsResult.success ? settingsResult.settings : null,
      mapping: mappingResult.success ? mappingResult.mapping : null
    });

  } catch (error) {
    loggerService.error('Failed to get index details', {
      error: error.message,
      stack: error.stack,
      indexName: req.params.name
    });

    res.status(500).json({
      error: 'Failed to get index details',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// POST /api/admin/elasticsearch/indices/:name/reindex - Reindex data
router.post('/indices/:name/reindex', [
  param('name').trim().notEmpty().withMessage('Index name is required'),
  body('destIndex').trim().notEmpty().withMessage('Destination index is required')
], handleValidationErrors, authMiddleware.authenticate(), authMiddleware.adminOnly(), async (req, res) => {
  try {
    const { name: sourceIndex } = req.params;
    const { destIndex } = req.body;

    const reindexResult = await indexManager.reindex(sourceIndex, destIndex);

    if (!reindexResult.success) {
      return res.status(500).json({
        error: 'Reindex failed',
        message: reindexResult.error
      });
    }

    res.json({
      success: true,
      message: 'Reindex completed successfully',
      sourceIndex,
      destIndex,
      total: reindexResult.total,
      created: reindexResult.created,
      updated: reindexResult.updated,
      deleted: reindexResult.deleted
    });

  } catch (error) {
    loggerService.error('Failed to reindex', {
      error: error.message,
      stack: error.stack,
      sourceIndex: req.params.name,
      destIndex: req.body.destIndex
    });

    res.status(500).json({
      error: 'Reindex failed',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// DELETE /api/admin/elasticsearch/indices/:name - Delete index
router.delete('/indices/:name', [
  param('name').trim().notEmpty().withMessage('Index name is required')
], handleValidationErrors, authMiddleware.authenticate(), authMiddleware.adminOnly(), async (req, res) => {
  try {
    const { name } = req.params;

    const deleteResult = await indexManager.deleteIndex(name);

    if (!deleteResult.success) {
      return res.status(500).json({
        error: 'Failed to delete index',
        message: deleteResult.error
      });
    }

    res.json({
      success: true,
      message: 'Index deleted successfully',
      indexName: name
    });

  } catch (error) {
    loggerService.error('Failed to delete index', {
      error: error.message,
      stack: error.stack,
      indexName: req.params.name
    });

    res.status(500).json({
      error: 'Failed to delete index',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// POST /api/admin/elasticsearch/indices/:name/refresh - Refresh index
router.post('/indices/:name/refresh', [
  param('name').trim().notEmpty().withMessage('Index name is required')
], handleValidationErrors, authMiddleware.authenticate(), authMiddleware.adminOnly(), async (req, res) => {
  try {
    const { name } = req.params;

    const refreshResult = await indexManager.refreshIndex(name);

    if (!refreshResult.success) {
      return res.status(500).json({
        error: 'Failed to refresh index',
        message: refreshResult.error
      });
    }

    res.json({
      success: true,
      message: 'Index refreshed successfully',
      indexName: name
    });

  } catch (error) {
    loggerService.error('Failed to refresh index', {
      error: error.message,
      stack: error.stack,
      indexName: req.params.name
    });

    res.status(500).json({
      error: 'Failed to refresh index',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// ============================================
// BACKUP MANAGEMENT ENDPOINTS
// ============================================

// GET /api/admin/elasticsearch/backups - List backups
router.get('/backups', authMiddleware.authenticate(), authMiddleware.adminOnly(), async (req, res) => {
  try {
    // For now, we'll use snapshot management through Elasticsearch
    // This is a placeholder that would interact with snapshot repositories
    const snapshotResult = await client.snapshot.getRepository({
      repository: '*'
    });

    const repositories = Object.keys(snapshotResult);

    res.json({
      repositories,
      count: repositories.length,
      message: 'Backup repositories listed'
    });

  } catch (error) {
    loggerService.error('Failed to list backups', {
      error: error.message,
      stack: error.stack
    });

    res.status(500).json({
      error: 'Failed to list backups',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// POST /api/admin/elasticsearch/backups/create - Create backup
router.post('/backups/create', [
  body('repository').trim().notEmpty().withMessage('Repository name is required'),
  body('snapshot').trim().notEmpty().withMessage('Snapshot name is required'),
  body('indices').optional().isArray().withMessage('Indices must be an array')
], handleValidationErrors, authMiddleware.authenticate(), authMiddleware.adminOnly(), async (req, res) => {
  try {
    const { repository, snapshot, indices } = req.body;

    const snapshotBody = {
      snapshot,
      repository,
      wait_for_completion: true
    };

    if (indices && indices.length > 0) {
      snapshotBody.indices = indices.join(',');
    }

    const result = await client.snapshot.create(snapshotBody);

    res.json({
      success: true,
      message: 'Backup created successfully',
      snapshot: result.snapshot,
      repository,
      snapshotInfo: result
    });

  } catch (error) {
    loggerService.error('Failed to create backup', {
      error: error.message,
      stack: error.stack,
      repository: req.body.repository,
      snapshot: req.body.snapshot
    });

    res.status(500).json({
      error: 'Failed to create backup',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// POST /api/admin/elasticsearch/backups/:id/restore - Restore from backup
router.post('/backups/:id/restore', [
  param('id').trim().notEmpty().withMessage('Backup ID is required'),
  body('repository').trim().notEmpty().withMessage('Repository name is required')
], handleValidationErrors, authMiddleware.authenticate(), authMiddleware.adminOnly(), async (req, res) => {
  try {
    const { id: snapshot } = req.params;
    const { repository } = req.body;

    const restoreBody = {
      snapshot,
      repository,
      wait_for_completion: true
    };

    const result = await client.snapshot.restore(restoreBody);

    res.json({
      success: true,
      message: 'Backup restored successfully',
      snapshot,
      repository,
      restoreInfo: result
    });

  } catch (error) {
    loggerService.error('Failed to restore backup', {
      error: error.message,
      stack: error.stack,
      snapshot: req.params.id,
      repository: req.body.repository
    });

    res.status(500).json({
      error: 'Failed to restore backup',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// ============================================
// PERFORMANCE MONITORING ENDPOINTS
// ============================================

// GET /api/admin/elasticsearch/performance - Get performance metrics
router.get('/performance', authMiddleware.authenticate(), authMiddleware.adminOnly(), async (req, res) => {
  try {
    const report = performanceMonitor.getPerformanceReport();

    res.json({
      performance: report
    });

  } catch (error) {
    loggerService.error('Failed to get performance metrics', {
      error: error.message,
      stack: error.stack
    });

    res.status(500).json({
      error: 'Failed to get performance metrics',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// GET /api/admin/elasticsearch/performance/slow-queries - Get slow queries
router.get('/performance/slow-queries', [
  query('limit').optional().isInt({ min: 1, max: 100 })
], handleValidationErrors, authMiddleware.authenticate(), authMiddleware.adminOnly(), async (req, res) => {
  try {
    const { limit = 50 } = req.query;

    const queryMetrics = performanceMonitor.metrics.getQueryMetrics(parseInt(limit));
    const slowQueries = queryMetrics.filter(m => m.duration >= 300);

    res.json({
      slowQueries,
      count: slowQueries.length
    });

  } catch (error) {
    loggerService.error('Failed to get slow queries', {
      error: error.message,
      stack: error.stack
    });

    res.status(500).json({
      error: 'Failed to get slow queries',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// GET /api/admin/elasticsearch/performance/alerts - Get performance alerts
router.get('/performance/alerts', [
  query('limit').optional().isInt({ min: 1, max: 100 })
], handleValidationErrors, authMiddleware.authenticate(), authMiddleware.adminOnly(), async (req, res) => {
  try {
    const { limit = 50 } = req.query;

    const alerts = performanceMonitor.getRecentAlerts(parseInt(limit));

    res.json({
      alerts,
      count: alerts.length
    });

  } catch (error) {
    loggerService.error('Failed to get performance alerts', {
      error: error.message,
      stack: error.stack
    });

    res.status(500).json({
      error: 'Failed to get performance alerts',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// GET /api/admin/elasticsearch/performance/targets - Get performance targets status
router.get('/performance/targets', authMiddleware.authenticate(), authMiddleware.adminOnly(), async (req, res) => {
  try {
    const targetsStatus = performanceMonitor.getTargetsStatus();

    res.json({
      targets: targetsStatus
    });

  } catch (error) {
    loggerService.error('Failed to get performance targets', {
      error: error.message,
      stack: error.stack
    });

    res.status(500).json({
      error: 'Failed to get performance targets',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// ============================================
// CACHE MANAGEMENT ENDPOINTS
// ============================================

// GET /api/admin/elasticsearch/cache - Get cache statistics
router.get('/cache', authMiddleware.authenticate(), authMiddleware.adminOnly(), async (req, res) => {
  try {
    const stats = cacheService.getStats();
    const cacheInfo = await cacheService.getCacheInfo();

    res.json({
      stats,
      info: cacheInfo
    });

  } catch (error) {
    loggerService.error('Failed to get cache statistics', {
      error: error.message,
      stack: error.stack
    });

    res.status(500).json({
      error: 'Failed to get cache statistics',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// DELETE /api/admin/elasticsearch/cache - Clear cache
router.delete('/cache', [
  body('pattern').optional().isString().withMessage('Pattern must be a string')
], handleValidationErrors, authMiddleware.authenticate(), authMiddleware.adminOnly(), async (req, res) => {
  try {
    const { pattern } = req.body;

    let deletedCount;
    if (pattern) {
      deletedCount = await cacheService.deletePattern(pattern);
    } else {
      deletedCount = await cacheService.invalidateAllCache();
    }

    res.json({
      success: true,
      message: 'Cache cleared successfully',
      deletedCount
    });

  } catch (error) {
    loggerService.error('Failed to clear cache', {
      error: error.message,
      stack: error.stack
    });

    res.status(500).json({
      error: 'Failed to clear cache',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// ============================================
// SYNONYM MANAGEMENT ENDPOINTS
// ============================================

// GET /api/admin/elasticsearch/synonyms - Get all synonyms
router.get('/synonyms', [
  query('category').optional().isString().withMessage('Category must be a string')
], handleValidationErrors, authMiddleware.authenticate(), authMiddleware.adminOnly(), async (req, res) => {
  try {
    const { category } = req.query;

    let synonyms;
    if (category) {
      synonyms = getCategorySynonyms(category);
    } else {
      synonyms = getAllSynonyms();
    }

    const stats = getSynonymStatistics();
    const categories = getAllCategories();

    res.json({
      synonyms,
      categories,
      stats,
      count: synonyms.length
    });

  } catch (error) {
    loggerService.error('Failed to get synonyms', {
      error: error.message,
      stack: error.stack
    });

    res.status(500).json({
      error: 'Failed to get synonyms',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// POST /api/admin/elasticsearch/synonyms - Add synonym
router.post('/synonyms', [
  body('category').trim().notEmpty().withMessage('Category is required'),
  body('rule').trim().notEmpty().withMessage('Synonym rule is required')
], handleValidationErrors, authMiddleware.authenticate(), authMiddleware.adminOnly(), async (req, res) => {
  try {
    const { category, rule } = req.body;

    const result = addSynonym(category, rule);

    if (!result.success) {
      return res.status(400).json({
        error: 'Failed to add synonym',
        message: result.error
      });
    }

    res.json({
      success: true,
      message: 'Synonym added successfully',
      ...result
    });

  } catch (error) {
    loggerService.error('Failed to add synonym', {
      error: error.message,
      stack: error.stack
    });

    res.status(500).json({
      error: 'Failed to add synonym',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// DELETE /api/admin/elasticsearch/synonyms/:id - Remove synonym
router.delete('/synonyms/:id', [
  param('id').trim().notEmpty().withMessage('Synonym ID is required'),
  body('category').trim().notEmpty().withMessage('Category is required')
], handleValidationErrors, authMiddleware.authenticate(), authMiddleware.adminOnly(), async (req, res) => {
  try {
    const { id: rule } = req.params;
    const { category } = req.body;

    const result = removeSynonym(category, rule);

    if (!result.success) {
      return res.status(400).json({
        error: 'Failed to remove synonym',
        message: result.error
      });
    }

    res.json({
      success: true,
      message: 'Synonym removed successfully',
      ...result
    });

  } catch (error) {
    loggerService.error('Failed to remove synonym', {
      error: error.message,
      stack: error.stack
    });

    res.status(500).json({
      error: 'Failed to remove synonym',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// GET /api/admin/elasticsearch/synonyms/export - Export synonyms
router.get('/synonyms/export', authMiddleware.authenticate(), authMiddleware.adminOnly(), async (req, res) => {
  try {
    const content = exportSynonymsToFile();

    res.setHeader('Content-Type', 'text/plain');
    res.setHeader('Content-Disposition', 'attachment; filename=synonyms.txt');
    res.send(content);

  } catch (error) {
    loggerService.error('Failed to export synonyms', {
      error: error.message,
      stack: error.stack
    });

    res.status(500).json({
      error: 'Failed to export synonyms',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// POST /api/admin/elasticsearch/synonyms/import - Import synonyms
router.post('/synonyms/import', [
  body('content').trim().notEmpty().withMessage('Content is required'),
  body('category').trim().notEmpty().withMessage('Category must be a string')
], handleValidationErrors, authMiddleware.authenticate(), authMiddleware.adminOnly(), async (req, res) => {
  try {
    const { content, category } = req.body;

    const result = importSynonymsFromFile(content, category);

    if (!result.success) {
      return res.status(400).json({
        error: 'Failed to import synonyms',
        message: result.error
      });
    }

    res.json({
      success: true,
      message: 'Synonyms imported successfully',
      ...result
    });

  } catch (error) {
    loggerService.error('Failed to import synonyms', {
      error: error.message,
      stack: error.stack
    });

    res.status(500).json({
      error: 'Failed to import synonyms',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// GET /api/admin/elasticsearch/synonyms/categories - Get synonym categories
router.get('/synonyms/categories', authMiddleware.authenticate(), authMiddleware.adminOnly(), async (req, res) => {
  try {
    const categories = getAllCategories();
    const stats = getSynonymStatistics();

    const categoryDetails = categories.map(category => ({
      name: category,
      ruleCount: stats.categories[category]?.ruleCount || 0,
      totalTerms: stats.categories[category]?.totalTerms || 0
    }));

    res.json({
      categories: categoryDetails,
      totalCategories: categories.length,
      totalRules: stats.totalRules
    });

  } catch (error) {
    loggerService.error('Failed to get synonym categories', {
      error: error.message,
      stack: error.stack
    });

    res.status(500).json({
      error: 'Failed to get synonym categories',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

module.exports = router;
