/**
 * Cart Performance Service
 * 
 * Performance monitoring for cart operations with:
 * - Cart load time tracking
 * - Cache hit rate monitoring
 * - Database query time tracking
 * - Slow query logging
 * - Performance reports
 * - Performance degradation alerts
 * 
 * @module services/cartPerformanceService
 */

const { loggerService } = require('./logger');
const { PrismaClient } = require('@prisma/client');
const { cartCacheService } = require('./cartCacheService');

class CartPerformanceService {
  constructor() {
    this.logger = loggerService;
    this.prisma = new PrismaClient();
    
    // Performance thresholds
    this.thresholds = {
      cartLoadTimeMs: parseInt(process.env.CART_PERF_LOAD_TIME_THRESHOLD) || 2000, // 2 seconds
      dbQueryTimeMs: parseInt(process.env.CART_PERF_DB_QUERY_THRESHOLD) || 100, // 100ms
      cacheHitRatePercent: parseInt(process.env.CART_PERF_CACHE_HIT_THRESHOLD) || 80, // 80%
      apiResponseTimeMs: parseInt(process.env.CART_PERF_API_RESPONSE_THRESHOLD) || 500, // 500ms
      memoryUsageMB: parseInt(process.env.CART_PERF_MEMORY_THRESHOLD) || 512, // 512MB
    };
    
    // Metrics storage
    this.metrics = {
      // Cart load times
      cartLoads: [],
      cartLoadTimestamps: [],
      
      // Database query times
      dbQueries: [],
      dbQueryTimestamps: [],
      
      // API response times
      apiResponses: [],
      apiResponseTimestamps: [],
      
      // Cache statistics
      cacheStats: [],
      cacheStatTimestamps: [],
      
      // Memory usage
      memoryUsage: [],
      memoryTimestamps: [],
      
      // Slow queries log
      slowQueries: [],
      
      // Alerts
      alerts: [],
    };
    
    // Configuration
    this.config = {
      maxMetricsPerType: parseInt(process.env.CART_PERF_MAX_METRICS) || 10000,
      alertCooldownMs: parseInt(process.env.CART_PERF_ALERT_COOLDOWN) || 300000, // 5 minutes
      reportIntervalMs: parseInt(process.env.CART_PERF_REPORT_INTERVAL) || 3600000, // 1 hour
      retentionHours: parseInt(process.env.CART_PERF_RETENTION_HOURS) || 24,
    };
    
    // Alert tracking
    this.lastAlertTime = new Map();
    
    // Start monitoring
    this.startMonitoring();
  }

  /**
   * Start performance monitoring
   */
  startMonitoring() {
    // Start periodic reporting
    this.reportInterval = setInterval(
      () => this.generatePerformanceReport(),
      this.config.reportIntervalMs
    );
    
    // Start memory monitoring
    this.memoryInterval = setInterval(
      () => this._trackMemoryUsage(),
      60000 // Every minute
    );
    
    this.logger.info('CartPerformanceService monitoring started', {
      thresholds: this.thresholds,
      config: this.config,
    });
  }

  /**
   * Stop performance monitoring
   */
  stopMonitoring() {
    if (this.reportInterval) {
      clearInterval(this.reportInterval);
      this.reportInterval = null;
    }
    
    if (this.memoryInterval) {
      clearInterval(this.memoryInterval);
      this.memoryInterval = null;
    }
    
    this.logger.info('CartPerformanceService monitoring stopped');
  }

  /**
   * Track cart load time
   * 
   * @param {number} durationMs - Load duration in milliseconds
   * @param {Object} metadata - Additional metadata
   */
  trackCartLoadTime(durationMs, metadata = {}) {
    const timestamp = Date.now();
    
    this.metrics.cartLoads.push(durationMs);
    this.metrics.cartLoadTimestamps.push(timestamp);
    
    // Check threshold
    if (durationMs > this.thresholds.cartLoadTimeMs) {
      this._createAlert('CART_LOAD_SLOW', {
        durationMs,
        threshold: this.thresholds.cartLoadTimeMs,
        metadata,
      });
    }
    
    // Clean old metrics
    this._cleanOldMetrics('cartLoads', 'cartLoadTimestamps');
    
    this.logger.debug('Cart load time tracked', {
      durationMs,
      cartId: metadata.cartId,
      userId: metadata.userId,
    });
  }

  /**
   * Track database query time
   * 
   * @param {string} queryType - Type of query
   * @param {number} durationMs - Query duration in milliseconds
   * @param {Object} metadata - Additional metadata
   */
  trackDatabaseQuery(queryType, durationMs, metadata = {}) {
    const timestamp = Date.now();
    
    this.metrics.dbQueries.push({
      type: queryType,
      duration: durationMs,
      timestamp,
      ...metadata,
    });
    this.metrics.dbQueryTimestamps.push(timestamp);
    
    // Check if slow query
    if (durationMs > this.thresholds.dbQueryTimeMs) {
      this._logSlowQuery(queryType, durationMs, metadata);
      
      this._createAlert('DB_QUERY_SLOW', {
        queryType,
        durationMs,
        threshold: this.thresholds.dbQueryTimeMs,
        metadata,
      });
    }
    
    // Clean old metrics
    this._cleanOldMetrics('dbQueries', 'dbQueryTimestamps');
  }

  /**
   * Track API response time
   * 
   * @param {string} endpoint - API endpoint
   * @param {number} durationMs - Response duration in milliseconds
   * @param {Object} metadata - Additional metadata
   */
  trackApiResponse(endpoint, durationMs, metadata = {}) {
    const timestamp = Date.now();
    
    this.metrics.apiResponses.push({
      endpoint,
      duration: durationMs,
      timestamp,
      ...metadata,
    });
    this.metrics.apiResponseTimestamps.push(timestamp);
    
    // Check threshold
    if (durationMs > this.thresholds.apiResponseTimeMs) {
      this._createAlert('API_RESPONSE_SLOW', {
        endpoint,
        durationMs,
        threshold: this.thresholds.apiResponseTimeMs,
        metadata,
      });
    }
    
    // Clean old metrics
    this._cleanOldMetrics('apiResponses', 'apiResponseTimestamps');
  }

  /**
   * Track cache hit rate
   * 
   * @param {Object} cacheStats - Cache statistics from cartCacheService
   */
  trackCacheHitRate(cacheStats) {
    const timestamp = Date.now();
    
    this.metrics.cacheStats.push({
      ...cacheStats,
      timestamp,
    });
    this.metrics.cacheStatTimestamps.push(timestamp);
    
    // Check threshold
    if (cacheStats.hitRate < this.thresholds.cacheHitRatePercent) {
      this._createAlert('CACHE_HIT_RATE_LOW', {
        hitRate: cacheStats.hitRate,
        threshold: this.thresholds.cacheHitRatePercent,
        stats: cacheStats,
      });
    }
    
    // Clean old metrics
    this._cleanOldMetrics('cacheStats', 'cacheStatTimestamps');
  }

  /**
   * Get current cache statistics
   */
  async getCacheStats() {
    try {
      const stats = cartCacheService.getCacheStats();
      return stats;
    } catch (error) {
      this.logger.error('Error getting cache stats', { error: error.message });
      return null;
    }
  }

  /**
   * Log slow query details
   */
  _logSlowQuery(queryType, durationMs, metadata) {
    const slowQuery = {
      type: queryType,
      duration: durationMs,
      timestamp: new Date().toISOString(),
      metadata,
    };
    
    this.metrics.slowQueries.push(slowQuery);
    
    // Keep only last 1000 slow queries
    if (this.metrics.slowQueries.length > 1000) {
      this.metrics.slowQueries = this.metrics.slowQueries.slice(-1000);
    }
    
    this.logger.warn('Slow database query detected', slowQuery);
  }

  /**
   * Create performance alert
   */
  _createAlert(type, data) {
    const now = Date.now();
    const lastAlert = this.lastAlertTime.get(type) || 0;
    
    // Check cooldown
    if (now - lastAlert < this.config.alertCooldownMs) {
      return;
    }
    
    this.lastAlertTime.set(type, now);
    
    const alert = {
      id: `alert_${now}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      severity: this._getAlertSeverity(type, data),
      message: this._getAlertMessage(type, data),
      data,
      timestamp: now,
      acknowledged: false,
    };
    
    this.metrics.alerts.push(alert);
    
    // Keep only last 100 alerts
    if (this.metrics.alerts.length > 100) {
      this.metrics.alerts = this.metrics.alerts.slice(-100);
    }
    
    this.logger.warn(`Performance alert: ${alert.message}`, alert);
  }

  /**
   * Get alert severity
   */
  _getAlertSeverity(type, data) {
    switch (type) {
      case 'CART_LOAD_SLOW':
        return data.durationMs > this.thresholds.cartLoadTimeMs * 2 ? 'critical' : 'warning';
      case 'DB_QUERY_SLOW':
        return data.durationMs > this.thresholds.dbQueryTimeMs * 3 ? 'critical' : 'warning';
      case 'API_RESPONSE_SLOW':
        return data.durationMs > this.thresholds.apiResponseTimeMs * 2 ? 'critical' : 'warning';
      case 'CACHE_HIT_RATE_LOW':
        return data.hitRate < this.thresholds.cacheHitRatePercent / 2 ? 'critical' : 'warning';
      case 'MEMORY_HIGH':
        return data.usageMB > this.thresholds.memoryUsageMB * 1.5 ? 'critical' : 'warning';
      default:
        return 'warning';
    }
  }

  /**
   * Get alert message
   */
  _getAlertMessage(type, data) {
    switch (type) {
      case 'CART_LOAD_SLOW':
        return `Cart load time (${data.durationMs}ms) exceeded threshold (${data.threshold}ms)`;
      case 'DB_QUERY_SLOW':
        return `Database query '${data.queryType}' (${data.durationMs}ms) exceeded threshold (${data.threshold}ms)`;
      case 'API_RESPONSE_SLOW':
        return `API response for '${data.endpoint}' (${data.durationMs}ms) exceeded threshold (${data.threshold}ms)`;
      case 'CACHE_HIT_RATE_LOW':
        return `Cache hit rate (${data.hitRate}%) below threshold (${data.threshold}%)`;
      case 'MEMORY_HIGH':
        return `Memory usage (${data.usageMB}MB) exceeded threshold (${data.threshold}MB)`;
      default:
        return `Performance alert: ${type}`;
    }
  }

  /**
   * Track memory usage
   */
  _trackMemoryUsage() {
    if (typeof process.memoryUsage !== 'function') return;
    
    const usage = process.memoryUsage();
    const usageMB = Math.round(usage.heapUsed / 1024 / 1024);
    const timestamp = Date.now();
    
    this.metrics.memoryUsage.push(usageMB);
    this.metrics.memoryTimestamps.push(timestamp);
    
    // Check threshold
    if (usageMB > this.thresholds.memoryUsageMB) {
      this._createAlert('MEMORY_HIGH', {
        usageMB,
        threshold: this.thresholds.memoryUsageMB,
        details: usage,
      });
    }
    
    // Clean old metrics
    this._cleanOldMetrics('memoryUsage', 'memoryTimestamps');
  }

  /**
   * Clean old metrics based on retention policy
   */
  _cleanOldMetrics(dataKey, timestampKey) {
    const cutoffTime = Date.now() - (this.config.retentionHours * 60 * 60 * 1000);
    const timestamps = this.metrics[timestampKey];
    const data = this.metrics[dataKey];
    
    if (!timestamps || !data) return;
    
    // Find index of first item to keep
    let keepIndex = 0;
    for (let i = 0; i < timestamps.length; i++) {
      if (timestamps[i] >= cutoffTime) {
        keepIndex = i;
        break;
      }
    }
    
    // Remove old items
    if (keepIndex > 0) {
      this.metrics[timestampKey] = timestamps.slice(keepIndex);
      this.metrics[dataKey] = data.slice(keepIndex);
    }
    
    // Also limit by max count
    if (this.metrics[dataKey].length > this.config.maxMetricsPerType) {
      const excess = this.metrics[dataKey].length - this.config.maxMetricsPerType;
      this.metrics[dataKey] = this.metrics[dataKey].slice(excess);
      this.metrics[timestampKey] = this.metrics[timestampKey].slice(excess);
    }
  }

  /**
   * Calculate statistics for an array of numbers
   */
  _calculateStats(values) {
    if (!values || values.length === 0) {
      return {
        count: 0,
        min: 0,
        max: 0,
        avg: 0,
        p50: 0,
        p95: 0,
        p99: 0,
      };
    }
    
    const sorted = [...values].sort((a, b) => a - b);
    const count = sorted.length;
    const min = sorted[0];
    const max = sorted[count - 1];
    const sum = sorted.reduce((a, b) => a + b, 0);
    const avg = sum / count;
    
    const percentile = (p) => {
      const index = Math.ceil((p / 100) * count) - 1;
      return sorted[Math.max(0, Math.min(index, count - 1))];
    };
    
    return {
      count,
      min,
      max,
      avg: Math.round(avg * 100) / 100,
      p50: percentile(50),
      p95: percentile(95),
      p99: percentile(99),
    };
  }

  /**
   * Generate performance report
   */
  async generatePerformanceReport() {
    const now = Date.now();
    const report = {
      timestamp: new Date().toISOString(),
      period: {
        start: new Date(now - this.config.reportIntervalMs).toISOString(),
        end: new Date(now).toISOString(),
      },
      summary: {},
      details: {},
      recommendations: [],
    };

    // Cart load time statistics
    const cartLoadStats = this._calculateStats(this.metrics.cartLoads);
    report.summary.cartLoadTime = {
      ...cartLoadStats,
      threshold: this.thresholds.cartLoadTimeMs,
      status: cartLoadStats.avg > this.thresholds.cartLoadTimeMs ? 'degraded' : 'healthy',
    };

    // Database query statistics
    const dbQueryDurations = this.metrics.dbQueries.map(q => q.duration);
    const dbQueryStats = this._calculateStats(dbQueryDurations);
    report.summary.databaseQueries = {
      ...dbQueryStats,
      totalQueries: this.metrics.dbQueries.length,
      slowQueries: this.metrics.slowQueries.length,
      threshold: this.thresholds.dbQueryTimeMs,
      status: dbQueryStats.avg > this.thresholds.dbQueryTimeMs ? 'degraded' : 'healthy',
    };

    // API response statistics
    const apiDurations = this.metrics.apiResponses.map(r => r.duration);
    const apiStats = this._calculateStats(apiDurations);
    report.summary.apiResponses = {
      ...apiStats,
      totalRequests: this.metrics.apiResponses.length,
      threshold: this.thresholds.apiResponseTimeMs,
      status: apiStats.avg > this.thresholds.apiResponseTimeMs ? 'degraded' : 'healthy',
    };

    // Cache statistics
    const latestCacheStats = await this.getCacheStats();
    report.summary.cache = {
      ...latestCacheStats,
      threshold: this.thresholds.cacheHitRatePercent,
      status: latestCacheStats && latestCacheStats.hitRate < this.thresholds.cacheHitRatePercent
        ? 'degraded'
        : 'healthy',
    };

    // Memory statistics
    const memoryStats = this._calculateStats(this.metrics.memoryUsage);
    report.summary.memory = {
      ...memoryStats,
      current: this.metrics.memoryUsage.length > 0
        ? this.metrics.memoryUsage[this.metrics.memoryUsage.length - 1]
        : 0,
      threshold: this.thresholds.memoryUsageMB,
      status: memoryStats.avg > this.thresholds.memoryUsageMB ? 'degraded' : 'healthy',
    };

    // Active alerts
    report.summary.alerts = {
      total: this.metrics.alerts.length,
      unacknowledged: this.metrics.alerts.filter(a => !a.acknowledged).length,
      critical: this.metrics.alerts.filter(a => a.severity === 'critical').length,
      warning: this.metrics.alerts.filter(a => a.severity === 'warning').length,
    };

    // Generate recommendations
    report.recommendations = this._generateRecommendations(report.summary);

    this.logger.info('Performance report generated', {
      timestamp: report.timestamp,
      cartLoadAvg: cartLoadStats.avg,
      dbQueryAvg: dbQueryStats.avg,
      cacheHitRate: latestCacheStats?.hitRate,
    });

    return report;
  }

  /**
   * Generate performance recommendations
   */
  _generateRecommendations(summary) {
    const recommendations = [];

    // Cart load time recommendations
    if (summary.cartLoadTime.avg > this.thresholds.cartLoadTimeMs) {
      recommendations.push({
        category: 'cart_load',
        priority: 'high',
        message: 'Cart load times are above threshold. Consider:',
        actions: [
          'Enable cart caching with higher TTL',
          'Optimize database queries for cart retrieval',
          'Implement cart data preloading',
          'Review cart item eager loading strategy',
        ],
      });
    }

    // Database query recommendations
    if (summary.databaseQueries.avg > this.thresholds.dbQueryTimeMs) {
      recommendations.push({
        category: 'database',
        priority: 'high',
        message: 'Database query times are above threshold. Consider:',
        actions: [
          'Add database indexes for cart queries',
          'Optimize Prisma queries with select/include',
          'Implement query result caching',
          'Review and optimize slow queries',
        ],
      });
    }

    // Cache recommendations
    if (summary.cache.hitRate < this.thresholds.cacheHitRatePercent) {
      recommendations.push({
        category: 'cache',
        priority: 'medium',
        message: 'Cache hit rate is below threshold. Consider:',
        actions: [
          'Increase cache TTL for frequently accessed carts',
          'Implement cache warming for active carts',
          'Review cache invalidation strategy',
          'Enable cache-aside pattern for cart reads',
        ],
      });
    }

    // API response recommendations
    if (summary.apiResponses.avg > this.thresholds.apiResponseTimeMs) {
      recommendations.push({
        category: 'api',
        priority: 'medium',
        message: 'API response times are above threshold. Consider:',
        actions: [
          'Enable response compression',
          'Implement API response caching',
          'Optimize payload sizes',
          'Add pagination for cart items',
        ],
      });
    }

    // Memory recommendations
    if (summary.memory.avg > this.thresholds.memoryUsageMB) {
      recommendations.push({
        category: 'memory',
        priority: 'medium',
        message: 'Memory usage is above threshold. Consider:',
        actions: [
          'Review cache size limits',
          'Implement cache eviction policies',
          'Optimize data structures in memory',
          'Monitor for memory leaks',
        ],
      });
    }

    return recommendations;
  }

  /**
   * Get performance metrics
   */
  getMetrics(options = {}) {
    const {
      includeSlowQueries = false,
      includeAlerts = false,
      timeRange = null,
    } = options;

    const metrics = {
      cartLoads: this.metrics.cartLoads,
      dbQueries: this.metrics.dbQueries,
      apiResponses: this.metrics.apiResponses,
      memoryUsage: this.metrics.memoryUsage,
    };

    if (includeSlowQueries) {
      metrics.slowQueries = this.metrics.slowQueries;
    }

    if (includeAlerts) {
      metrics.alerts = this.metrics.alerts;
    }

    // Filter by time range if provided
    if (timeRange) {
      const { start, end } = timeRange;
      // Implementation for time range filtering
    }

    return metrics;
  }

  /**
   * Acknowledge an alert
   */
  acknowledgeAlert(alertId) {
    const alert = this.metrics.alerts.find(a => a.id === alertId);
    
    if (alert) {
      alert.acknowledged = true;
      alert.acknowledgedAt = Date.now();
      return true;
    }
    
    return false;
  }

  /**
   * Clear all metrics
   */
  clearMetrics() {
    this.metrics = {
      cartLoads: [],
      cartLoadTimestamps: [],
      dbQueries: [],
      dbQueryTimestamps: [],
      apiResponses: [],
      apiResponseTimestamps: [],
      cacheStats: [],
      cacheStatTimestamps: [],
      memoryUsage: [],
      memoryTimestamps: [],
      slowQueries: [],
      alerts: [],
    };
    
    this.logger.info('Performance metrics cleared');
  }

  /**
   * Performance measurement decorator
   * Wraps a function to measure its execution time
   */
  measurePerformance(fn, metricType, metadata = {}) {
    return async (...args) => {
      const start = Date.now();
      
      try {
        const result = await fn(...args);
        const duration = Date.now() - start;
        
        switch (metricType) {
          case 'cartLoad':
            this.trackCartLoadTime(duration, metadata);
            break;
          case 'dbQuery':
            this.trackDatabaseQuery(metadata.queryType || 'unknown', duration, metadata);
            break;
          case 'apiResponse':
            this.trackApiResponse(metadata.endpoint || 'unknown', duration, metadata);
            break;
        }
        
        return result;
      } catch (error) {
        const duration = Date.now() - start;
        
        // Still track the timing even if it failed
        switch (metricType) {
          case 'cartLoad':
            this.trackCartLoadTime(duration, { ...metadata, error: true });
            break;
          case 'dbQuery':
            this.trackDatabaseQuery(metadata.queryType || 'unknown', duration, { ...metadata, error: true });
            break;
          case 'apiResponse':
            this.trackApiResponse(metadata.endpoint || 'unknown', duration, { ...metadata, error: true });
            break;
        }
        
        throw error;
      }
    };
  }
}

// Export singleton instance
const cartPerformanceService = new CartPerformanceService();

module.exports = {
  cartPerformanceService,
  CartPerformanceService,
};
