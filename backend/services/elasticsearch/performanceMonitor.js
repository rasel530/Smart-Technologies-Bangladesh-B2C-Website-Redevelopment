/**
 * Elasticsearch Performance Monitor Service
 * 
 * This module provides performance monitoring for the Smart Tech B2C e-commerce platform,
 * including query response time tracking, cache hit rate monitoring, index statistics tracking,
 * performance alerts, and slow query logging.
 */

const { loggerService } = require('../logger');
const { INDEX_NAMES } = require('./indexManager');

/**
 * Performance monitor configuration
 */
const MONITOR_CONFIG = {
  // Performance targets
  TARGETS: {
    SEARCH_RESPONSE_TIME_P95: 300, // ms
    FILTER_RESPONSE_TIME: 100, // ms
    AGGREGATION_RESPONSE_TIME: 200, // ms
    CACHE_HIT_RATE: 80, // percentage
    CONCURRENT_QUERIES: 10000
  },
  
  // Alert thresholds
  ALERT_THRESHOLDS: {
    SLOW_QUERY_MS: 500,
    CRITICAL_QUERY_MS: 1000,
    LOW_CACHE_HIT_RATE: 50,
    HIGH_ERROR_RATE: 5, // percentage
    HIGH_INDEX_SIZE_GB: 100
  },
  
  // Monitoring intervals
  MONITORING_INTERVALS: {
    STATS: 60000, // 1 minute
    CACHE_STATS: 30000, // 30 seconds
    SLOW_QUERY_LOG: 10000 // 10 seconds
  },
  
  // Query history settings
  QUERY_HISTORY: {
    MAX_SIZE: 10000,
    RETENTION_DAYS: 7
  },
  
  // Slow query logging
  SLOW_QUERY_LOGGING: {
    ENABLED: true,
    MIN_DURATION_MS: 300,
    INCLUDE_PROFILE: true
  }
};

/**
 * Performance metrics storage
 */
class MetricsStore {
  constructor() {
    this.queryMetrics = [];
    this.cacheMetrics = {
      hits: 0,
      misses: 0,
      total: 0
    };
    this.indexMetrics = {};
    this.errorMetrics = {
      total: 0,
      byType: {}
    };
    this.alerts = [];
    this.maxAlerts = 1000;
  }

  addQueryMetric(metric) {
    this.queryMetrics.push({
      ...metric,
      timestamp: Date.now()
    });

    // Limit size
    if (this.queryMetrics.length > MONITOR_CONFIG.QUERY_HISTORY.MAX_SIZE) {
      this.queryMetrics.shift();
    }
  }

  addCacheMetric(hit) {
    this.cacheMetrics.total++;
    if (hit) {
      this.cacheMetrics.hits++;
    } else {
      this.cacheMetrics.misses++;
    }
  }

  setIndexMetrics(indexName, metrics) {
    this.indexMetrics[indexName] = {
      ...metrics,
      timestamp: Date.now()
    };
  }

  addErrorMetric(errorType) {
    this.errorMetrics.total++;
    this.errorMetrics.byType[errorType] =
      (this.errorMetrics.byType[errorType] || 0) + 1;
  }

  addAlert(alert) {
    this.alerts.push({
      ...alert,
      timestamp: Date.now()
    });

    // Limit size
    if (this.alerts.length > this.maxAlerts) {
      this.alerts.shift();
    }
  }

  getQueryMetrics(limit = 100) {
    return this.queryMetrics.slice(-limit);
  }

  getCacheMetrics() {
    const hitRate = this.cacheMetrics.total > 0
      ? (this.cacheMetrics.hits / this.cacheMetrics.total * 100).toFixed(2)
      : 0;

    return {
      ...this.cacheMetrics,
      hitRate: `${hitRate}%`
    };
  }

  getIndexMetrics(indexName) {
    return this.indexMetrics[indexName];
  }

  getAllIndexMetrics() {
    return { ...this.indexMetrics };
  }

  getErrorMetrics() {
    return { ...this.errorMetrics };
  }

  getAlerts(limit = 50) {
    return this.alerts.slice(-limit);
  }

  clearMetrics() {
    this.queryMetrics = [];
    this.cacheMetrics = {
      hits: 0,
      misses: 0,
      total: 0
    };
    this.indexMetrics = {};
    this.errorMetrics = {
      total: 0,
      byType: {}
    };
    this.alerts = [];
  }
}

/**
 * Performance Monitor Service class
 */
class PerformanceMonitorService {
  constructor(elasticsearchClient, indexManager, cacheService = null) {
    this.client = elasticsearchClient;
    this.indexManager = indexManager;
    this.cacheService = cacheService;
    this.config = MONITOR_CONFIG;
    this.metrics = new MetricsStore();
    this.monitoringIntervals = {};
    this.isMonitoring = false;
  }

  /**
   * Initialize performance monitor service
   * @returns {Promise<Object>} Result of initialization
   */
  async initialize() {
    try {
      loggerService.info('Initializing Elasticsearch Performance Monitor Service');

      // Start monitoring
      this.startMonitoring();

      loggerService.info('Performance Monitor Service initialized successfully');

      return {
        success: true,
        message: 'Performance Monitor Service initialized successfully'
      };
    } catch (error) {
      loggerService.error('Failed to initialize Performance Monitor Service', {
        error: error.message,
        stack: error.stack
      });

      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Start monitoring
   */
  startMonitoring() {
    if (this.isMonitoring) {
      loggerService.warn('Performance monitoring already running');
      return;
    }

    this.isMonitoring = true;

    // Monitor index statistics
    this.monitoringIntervals.stats = setInterval(async () => {
      await this.collectIndexStats();
    }, this.config.MONITORING_INTERVALS.STATS);

    // Monitor slow queries
    this.monitoringIntervals.slowQuery = setInterval(async () => {
      await this.checkSlowQueries();
    }, this.config.MONITORING_INTERVALS.SLOW_QUERY_LOG);

    loggerService.info('Performance monitoring started');
  }

  /**
   * Stop monitoring
   */
  stopMonitoring() {
    if (!this.isMonitoring) {
      loggerService.warn('Performance monitoring not running');
      return;
    }

    this.isMonitoring = false;

    // Clear all intervals
    Object.values(this.monitoringIntervals).forEach(interval => {
      clearInterval(interval);
    });
    this.monitoringIntervals = {};

    loggerService.info('Performance monitoring stopped');
  }

  /**
   * Track query execution
   * @param {string} queryType - Query type (search, filter, aggregation)
   * @param {string} indexName - Index name
   * @param {Object} query - Query details
   * @param {number} duration - Query duration in milliseconds
   * @param {boolean} cacheHit - Whether query hit cache
   * @param {Object} profile - Query profile (optional)
   */
  trackQuery(queryType, indexName, query, duration, cacheHit = false, profile = null) {
    try {
      // Add query metric
      this.metrics.addQueryMetric({
        type: queryType,
        indexName,
        query: this.sanitizeQuery(query),
        duration,
        cacheHit,
        profile
      });

      // Track cache metric
      if (this.cacheService) {
        this.metrics.addCacheMetric(cacheHit);
      }

      // Log slow queries
      if (this.config.SLOW_QUERY_LOGGING.ENABLED &&
          duration >= this.config.SLOW_QUERY_LOGGING.MIN_DURATION_MS) {
        this.logSlowQuery(queryType, indexName, query, duration, profile);
      }

      // Check for performance alerts
      this.checkPerformanceAlerts(queryType, duration, cacheHit);

      loggerService.debug('Query tracked', {
        type: queryType,
        indexName,
        duration,
        cacheHit
      });
    } catch (error) {
      loggerService.error('Failed to track query', {
        error: error.message,
        stack: error.stack
      });
    }
  }

  /**
   * Sanitize query for logging (remove sensitive data)
   * @param {Object} query - Query object
   * @returns {Object} Sanitized query
   */
  sanitizeQuery(query) {
    try {
      const sanitized = JSON.parse(JSON.stringify(query));

      // Remove sensitive fields
      if (sanitized.query) {
        delete sanitized.query.profile;
      }

      // Limit size
      const json = JSON.stringify(sanitized);
      if (json.length > 1000) {
        return JSON.parse(json.substring(0, 1000) + '...');
      }

      return sanitized;
    } catch (error) {
      return { error: 'Failed to sanitize query' };
    }
  }

  /**
   * Log slow query
   * @param {string} queryType - Query type
   * @param {string} indexName - Index name
   * @param {Object} query - Query details
   * @param {number} duration - Query duration
   * @param {Object} profile - Query profile
   */
  logSlowQuery(queryType, indexName, query, duration, profile = null) {
    const level = duration >= this.config.ALERT_THRESHOLDS.CRITICAL_QUERY_MS
      ? 'error'
      : 'warn';

    loggerService[level]('Slow query detected', {
      type: queryType,
      indexName,
      duration,
      query: this.sanitizeQuery(query),
      profile
    });

    // Add to alerts if critical
    if (duration >= this.config.ALERT_THRESHOLDS.CRITICAL_QUERY_MS) {
      this.metrics.addAlert({
        type: 'critical_query',
        severity: 'critical',
        message: `Critical slow query: ${queryType} took ${duration}ms`,
        details: {
          queryType,
          indexName,
          duration,
          query: this.sanitizeQuery(query)
        }
      });
    }
  }

  /**
   * Check for performance alerts
   * @param {string} queryType - Query type
   * @param {number} duration - Query duration
   * @param {boolean} cacheHit - Cache hit status
   */
  checkPerformanceAlerts(queryType, duration, cacheHit) {
    const cacheMetrics = this.metrics.getCacheMetrics();
    const hitRate = parseFloat(cacheMetrics.hitRate);

    // Check for slow query alert
    if (duration >= this.config.ALERT_THRESHOLDS.SLOW_QUERY_MS) {
      this.metrics.addAlert({
        type: 'slow_query',
        severity: duration >= this.config.ALERT_THRESHOLDS.CRITICAL_QUERY_MS
          ? 'critical'
          : 'warning',
        message: `Slow ${queryType} query: ${duration}ms`,
        details: {
          queryType,
          duration,
          threshold: this.config.ALERT_THRESHOLDS.SLOW_QUERY_MS
        }
      });
    }

    // Check for low cache hit rate
    if (hitRate < this.config.ALERT_THRESHOLDS.LOW_CACHE_HIT_RATE &&
        this.metrics.cacheMetrics.total > 100) {
      this.metrics.addAlert({
        type: 'low_cache_hit_rate',
        severity: 'warning',
        message: `Low cache hit rate: ${cacheMetrics.hitRate}`,
        details: {
          hitRate: cacheMetrics.hitRate,
          threshold: this.config.ALERT_THRESHOLDS.LOW_CACHE_HIT_RATE
        }
      });
    }
  }

  /**
   * Collect index statistics
   * @returns {Promise<Object>} Collection results
   */
  async collectIndexStats() {
    try {
      const indices = [INDEX_NAMES.products, INDEX_NAMES.categories, INDEX_NAMES.brands];

      for (const indexName of indices) {
        const statsResult = await this.indexManager.getIndexStats(indexName);

        if (statsResult.success) {
          this.metrics.setIndexMetrics(indexName, statsResult.stats);

          // Check for large index alert
          const sizeInBytes = statsResult.stats.store?.size_in_bytes || 0;
          const sizeInGB = sizeInBytes / (1024 * 1024 * 1024);

          if (sizeInGB > this.config.ALERT_THRESHOLDS.HIGH_INDEX_SIZE_GB) {
            this.metrics.addAlert({
              type: 'large_index',
              severity: 'warning',
              message: `Large index size: ${sizeInGB.toFixed(2)}GB`,
              details: {
                indexName,
                sizeInGB,
                threshold: this.config.ALERT_THRESHOLDS.HIGH_INDEX_SIZE_GB
              }
            });
          }
        }
      }

      return {
        success: true
      };
    } catch (error) {
      loggerService.error('Failed to collect index stats', {
        error: error.message,
        stack: error.stack
      });

      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Check slow queries
   * @returns {Promise<Object>} Check results
   */
  async checkSlowQueries() {
    try {
      const queryMetrics = this.metrics.getQueryMetrics();
      const slowQueries = queryMetrics.filter(
        m => m.duration >= this.config.SLOW_QUERY_LOGGING.MIN_DURATION_MS
      );

      if (slowQueries.length > 0) {
        loggerService.info('Slow queries detected', {
          count: slowQueries.length,
          avgDuration: (slowQueries.reduce((sum, m) => sum + m.duration, 0) / slowQueries.length).toFixed(2)
        });
      }

      return {
        success: true,
        slowQueries: slowQueries.length
      };
    } catch (error) {
      loggerService.error('Failed to check slow queries', {
        error: error.message,
        stack: error.stack
      });

      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get performance report
   * @returns {Object} Performance report
   */
  getPerformanceReport() {
    const queryMetrics = this.metrics.getQueryMetrics();
    const cacheMetrics = this.metrics.getCacheMetrics();
    const indexMetrics = this.metrics.getAllIndexMetrics();
    const errorMetrics = this.metrics.getErrorMetrics();
    const alerts = this.metrics.getAlerts();

    // Calculate query statistics
    const searchQueries = queryMetrics.filter(m => m.type === 'search');
    const filterQueries = queryMetrics.filter(m => m.type === 'filter');
    const aggregationQueries = queryMetrics.filter(m => m.type === 'aggregation');

    const calculateStats = (queries) => {
      if (queries.length === 0) {
        return { count: 0, avg: 0, min: 0, max: 0, p95: 0, p99: 0 };
      }

      const durations = queries.map(m => m.duration).sort((a, b) => a - b);
      const sum = durations.reduce((a, b) => a + b, 0);

      return {
        count: queries.length,
        avg: (sum / queries.length).toFixed(2),
        min: durations[0],
        max: durations[durations.length - 1],
        p95: durations[Math.floor(durations.length * 0.95)],
        p99: durations[Math.floor(durations.length * 0.99)]
      };
    };

    return {
      summary: {
        totalQueries: queryMetrics.length,
        totalErrors: errorMetrics.total,
        totalAlerts: alerts.length,
        cacheHitRate: cacheMetrics.hitRate
      },
      queries: {
        all: calculateStats(queryMetrics),
        search: calculateStats(searchQueries),
        filter: calculateStats(filterQueries),
        aggregation: calculateStats(aggregationQueries)
      },
      cache: cacheMetrics,
      indexes: indexMetrics,
      errors: errorMetrics,
      alerts: alerts.slice(-20), // Last 20 alerts
      targets: this.config.TARGETS
    };
  }

  /**
   * Get query performance by type
   * @param {string} queryType - Query type
   * @returns {Object} Query performance statistics
   */
  getQueryPerformance(queryType) {
    const queryMetrics = this.metrics.getQueryMetrics();
    const filtered = queryMetrics.filter(m => m.type === queryType);

    if (filtered.length === 0) {
      return {
        count: 0,
        avgDuration: 0,
        minDuration: 0,
        maxDuration: 0,
        p95Duration: 0,
        p99Duration: 0,
        cacheHitRate: '0%'
      };
    }

    const durations = filtered.map(m => m.duration).sort((a, b) => a - b);
    const sum = durations.reduce((a, b) => a + b, 0);
    const cacheHits = filtered.filter(m => m.cacheHit).length;

    return {
      count: filtered.length,
      avgDuration: (sum / filtered.length).toFixed(2),
      minDuration: durations[0],
      maxDuration: durations[durations.length - 1],
      p95Duration: durations[Math.floor(durations.length * 0.95)],
      p99Duration: durations[Math.floor(durations.length * 0.99)],
      cacheHitRate: `${((cacheHits / filtered.length) * 100).toFixed(2)}%`
    };
  }

  /**
   * Get recent alerts
   * @param {number} limit - Number of alerts to return
   * @returns {Array} Recent alerts
   */
  getRecentAlerts(limit = 50) {
    return this.metrics.getAlerts(limit);
  }

  /**
   * Get performance targets status
   * @returns {Object} Targets status
   */
  getTargetsStatus() {
    const report = this.getPerformanceReport();
    const targets = this.config.TARGETS;

    return {
      searchResponseTime: {
        target: targets.SEARCH_RESPONSE_TIME_P95,
        current: report.queries.search.p95,
        status: report.queries.search.p95 <= targets.SEARCH_RESPONSE_TIME_P95
          ? 'met'
          : 'not_met'
      },
      filterResponseTime: {
        target: targets.FILTER_RESPONSE_TIME,
        current: report.queries.filter.p95,
        status: report.queries.filter.p95 <= targets.FILTER_RESPONSE_TIME
          ? 'met'
          : 'not_met'
      },
      aggregationResponseTime: {
        target: targets.AGGREGATION_RESPONSE_TIME,
        current: report.queries.aggregation.p95,
        status: report.queries.aggregation.p95 <= targets.AGGREGATION_RESPONSE_TIME
          ? 'met'
          : 'not_met'
      },
      cacheHitRate: {
        target: `${targets.CACHE_HIT_RATE}%`,
        current: report.cache.hitRate,
        status: parseFloat(report.cache.hitRate) >= targets.CACHE_HIT_RATE
          ? 'met'
          : 'not_met'
      }
    };
  }

  /**
   * Clear all metrics
   */
  clearMetrics() {
    this.metrics.clearMetrics();
    loggerService.info('Performance metrics cleared');
  }

  /**
   * Get monitoring status
   * @returns {Object} Monitoring status
   */
  getStatus() {
    return {
      isMonitoring: this.isMonitoring,
      config: this.config,
      metricsCount: {
        queries: this.metrics.queryMetrics.length,
        alerts: this.metrics.alerts.length
      }
    };
  }

  /**
   * Shutdown performance monitor service
   * @returns {Promise<Object>} Result of shutdown
   */
  async shutdown() {
    try {
      loggerService.info('Shutting down Performance Monitor Service');

      // Stop monitoring
      this.stopMonitoring();

      loggerService.info('Performance Monitor Service shut down successfully');

      return {
        success: true,
        message: 'Performance Monitor Service shut down successfully'
      };
    } catch (error) {
      loggerService.error('Failed to shut down Performance Monitor Service', {
        error: error.message,
        stack: error.stack
      });

      return {
        success: false,
        error: error.message
      };
    }
  }
}

module.exports = {
  PerformanceMonitorService,
  MONITOR_CONFIG,
  MetricsStore
};
