/**
 * Search Performance Monitoring Service
 * 
 * This service monitors search query response times, Elasticsearch query execution metrics,
 * cache hit/miss ratios, zero-result queries, and performance metrics aggregation.
 */

const { PrismaClient } = require('@prisma/client');
const { loggerService } = require('./logger');

class SearchPerformanceService {
  constructor(prisma = null) {
    this.prisma = prisma || new PrismaClient();
    this.responseTimeBuffer = [];
    this.cacheHits = 0;
    this.cacheMisses = 0;
    this.zeroResultCount = 0;
    this.queryCount = 0;
  }

  /**
   * Record performance metrics for a batch of searches
   * 
   * @param {number} queryCount - Number of queries processed
   * @param {number} avgResponseTime - Average response time in milliseconds
   * @param {number} p95ResponseTime - 95th percentile response time
   * @param {number} p99ResponseTime - 99th percentile response time
   * @param {number} cacheHitRate - Cache hit rate (0-1)
   * @param {number} zeroResultQueries - Number of queries with zero results
   * @returns {Promise<object>} Created performance metrics record
   */
  async recordPerformanceMetrics(queryCount, avgResponseTime, p95ResponseTime, p99ResponseTime, cacheHitRate, zeroResultQueries) {
    try {
      const performanceMetrics = await this.prisma.searchPerformanceMetrics.create({
        data: {
          queryCount,
          avgResponseTime,
          p95ResponseTime,
          p99ResponseTime,
          cacheHitRate,
          zeroResultQueries
          // totalQueries field removed - doesn't exist in database schema
        }
      });

      loggerService.info('Performance metrics recorded', {
        metricsId: performanceMetrics.id,
        queryCount,
        avgResponseTime,
        cacheHitRate
      });

      return performanceMetrics;
    } catch (error) {
      loggerService.error('Failed to record performance metrics', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  /**
   * Get performance metrics for a time range
   * 
   * @param {string} timeRange - Time range (hour, day, week, month)
   * @returns {Promise<object>} Performance metrics
   */
  async getPerformanceMetrics(timeRange = 'day') {
    try {
      const now = new Date();
      let startDate;

      switch (timeRange) {
        case 'hour':
          startDate = new Date(now.setHours(now.getHours() - 1));
          break;
        case 'day':
          startDate = new Date(now.setDate(now.getDate() - 1));
          break;
        case 'week':
          startDate = new Date(now.setDate(now.getDate() - 7));
          break;
        case 'month':
          startDate = new Date(now.setMonth(now.getMonth() - 1));
          break;
        default:
          startDate = new Date(now.setDate(now.getDate() - 1));
      }

      const metrics = await this.prisma.searchPerformanceMetrics.findMany({
        where: {
          timestamp: {
            gte: startDate
          }
        },
        orderBy: {
          timestamp: 'desc'
        }
      });

      if (metrics.length === 0) {
        return {
          timeRange,
          metrics: [],
          summary: {
            avgResponseTime: 0,
            p95ResponseTime: 0,
            p99ResponseTime: 0,
            cacheHitRate: 0,
            zeroResultRate: 0,
            totalQueries: 0
          }
        };
      }

      // Calculate summary statistics
      const summary = {
        avgResponseTime: this.calculateAverage(metrics.map(m => m.avgResponseTime)),
        p95ResponseTime: this.calculateAverage(metrics.map(m => m.p95ResponseTime)),
        p99ResponseTime: this.calculateAverage(metrics.map(m => m.p99ResponseTime)),
        cacheHitRate: this.calculateAverage(metrics.map(m => m.cacheHitRate)),
        zeroResultRate: metrics.reduce((sum, m) => sum + m.zeroResultQueries, 0) /
                         metrics.reduce((sum, m) => sum + m.queryCount, 0),
        totalQueries: metrics.reduce((sum, m) => sum + m.queryCount, 0)
      };

      loggerService.info('Performance metrics retrieved', {
        timeRange,
        metricsCount: metrics.length,
        summary
      });

      return {
        timeRange,
        metrics,
        summary
      };
    } catch (error) {
      loggerService.error('Failed to get performance metrics', {
        error: error instanceof Error ? error.message : 'Unknown error',
        timeRange
      });
      throw error;
    }
  }

  /**
   * Get performance alerts based on thresholds
   * 
   * @param {object} threshold - Threshold values for alerts
   * @returns {Promise<Array>} Array of performance alerts
   */
  async getPerformanceAlerts(threshold = {}) {
    try {
      const {
        maxAvgResponseTime = 1000,
        maxP95ResponseTime = 2000,
        maxP99ResponseTime = 3000,
        minCacheHitRate = 0.7,
        maxZeroResultRate = 0.1
      } = threshold;

      const now = new Date();
      const oneHourAgo = new Date(now.setHours(now.getHours() - 1));

      const recentMetrics = await this.prisma.searchPerformanceMetrics.findMany({
        where: {
          timestamp: {
            gte: oneHourAgo
          }
        },
        orderBy: {
          timestamp: 'desc'
        }
      });

      const alerts = [];

      if (recentMetrics.length > 0) {
        const latest = recentMetrics[0];
        const avgResponseTime = this.calculateAverage(recentMetrics.map(m => m.avgResponseTime));
        const avgCacheHitRate = this.calculateAverage(recentMetrics.map(m => m.cacheHitRate));
        const avgZeroResultRate = recentMetrics.reduce((sum, m) => sum + m.zeroResultQueries, 0) /
                               recentMetrics.reduce((sum, m) => sum + m.queryCount, 0);

        if (avgResponseTime > maxAvgResponseTime) {
          alerts.push({
            type: 'high_response_time',
            severity: avgResponseTime > maxAvgResponseTime * 2 ? 'critical' : 'warning',
            message: `Average response time ${avgResponseTime.toFixed(2)}ms exceeds threshold ${maxAvgResponseTime}ms`,
            value: avgResponseTime,
            threshold: maxAvgResponseTime
          });
        }

        if (latest.p95ResponseTime > maxP95ResponseTime) {
          alerts.push({
            type: 'high_p95_response_time',
            severity: latest.p95ResponseTime > maxP95ResponseTime * 2 ? 'critical' : 'warning',
            message: `P95 response time ${latest.p95ResponseTime}ms exceeds threshold ${maxP95ResponseTime}ms`,
            value: latest.p95ResponseTime,
            threshold: maxP95ResponseTime
          });
        }

        if (latest.p99ResponseTime > maxP99ResponseTime) {
          alerts.push({
            type: 'high_p99_response_time',
            severity: latest.p99ResponseTime > maxP99ResponseTime * 2 ? 'critical' : 'warning',
            message: `P99 response time ${latest.p99ResponseTime}ms exceeds threshold ${maxP99ResponseTime}ms`,
            value: latest.p99ResponseTime,
            threshold: maxP99ResponseTime
          });
        }

        if (avgCacheHitRate < minCacheHitRate) {
          alerts.push({
            type: 'low_cache_hit_rate',
            severity: avgCacheHitRate < minCacheHitRate * 0.5 ? 'critical' : 'warning',
            message: `Cache hit rate ${(avgCacheHitRate * 100).toFixed(2)}% below threshold ${(minCacheHitRate * 100).toFixed(2)}%`,
            value: avgCacheHitRate,
            threshold: minCacheHitRate
          });
        }

        if (avgZeroResultRate > maxZeroResultRate) {
          alerts.push({
            type: 'high_zero_result_rate',
            severity: avgZeroResultRate > maxZeroResultRate * 2 ? 'critical' : 'warning',
            message: `Zero result rate ${(avgZeroResultRate * 100).toFixed(2)}% exceeds threshold ${(maxZeroResultRate * 100).toFixed(2)}%`,
            value: avgZeroResultRate,
            threshold: maxZeroResultRate
          });
        }
      }

      loggerService.info('Performance alerts retrieved', {
        alertCount: alerts.length
      });

      return alerts;
    } catch (error) {
      loggerService.error('Failed to get performance alerts', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  /**
   * Aggregate performance data for a date range
   * 
   * @param {Date} startDate - Start date
   * @param {Date} endDate - End date
   * @returns {Promise<object>} Aggregated performance data
   */
  async aggregatePerformanceData(startDate, endDate) {
    try {
      const metrics = await this.prisma.searchPerformanceMetrics.findMany({
        where: {
          timestamp: {
            gte: startDate,
            lte: endDate
          }
        },
        orderBy: {
          timestamp: 'asc'
        }
      });

      if (metrics.length === 0) {
        return {
          startDate,
          endDate,
          totalRecords: 0,
          summary: null
        };
      }

      const summary = {
        totalQueries: metrics.reduce((sum, m) => sum + m.queryCount, 0),
        avgResponseTime: this.calculateAverage(metrics.map(m => m.avgResponseTime)),
        minResponseTime: Math.min(...metrics.map(m => m.avgResponseTime)),
        maxResponseTime: Math.max(...metrics.map(m => m.avgResponseTime)),
        p95ResponseTime: this.calculateAverage(metrics.map(m => m.p95ResponseTime)),
        p99ResponseTime: this.calculateAverage(metrics.map(m => m.p99ResponseTime)),
        avgCacheHitRate: this.calculateAverage(metrics.map(m => m.cacheHitRate)),
        totalZeroResults: metrics.reduce((sum, m) => sum + m.zeroResultQueries, 0),
        zeroResultRate: metrics.reduce((sum, m) => sum + m.zeroResultQueries, 0) /
                         metrics.reduce((sum, m) => sum + m.queryCount, 0),
        dataPoints: metrics.length
      };

      // Calculate hourly breakdown
      const hourlyBreakdown = {};
      metrics.forEach(m => {
        const hour = new Date(m.timestamp).getHours();
        if (!hourlyBreakdown[hour]) {
          hourlyBreakdown[hour] = {
            queryCount: 0,
            avgResponseTime: 0,
            cacheHitRate: 0
          };
        }
        hourlyBreakdown[hour].queryCount += m.queryCount;
        hourlyBreakdown[hour].avgResponseTime += m.avgResponseTime;
        hourlyBreakdown[hour].cacheHitRate += m.cacheHitRate;
      });

      Object.keys(hourlyBreakdown).forEach(hour => {
        const data = hourlyBreakdown[hour];
        const count = metrics.filter(m => new Date(m.timestamp).getHours() === parseInt(hour)).length;
        data.avgResponseTime = data.avgResponseTime / count;
        data.cacheHitRate = data.cacheHitRate / count;
      });

      loggerService.info('Performance data aggregated', {
        startDate,
        endDate,
        totalRecords: metrics.length,
        summary
      });

      return {
        startDate,
        endDate,
        totalRecords: metrics.length,
        summary,
        hourlyBreakdown
      };
    } catch (error) {
      loggerService.error('Failed to aggregate performance data', {
        error: error instanceof Error ? error.message : 'Unknown error',
        startDate,
        endDate
      });
      throw error;
    }
  }

  /**
   * Track individual query response time
   * 
   * @param {number} responseTime - Response time in milliseconds
   * @param {boolean} cached - Whether result was from cache
   * @param {number} resultsCount - Number of results returned
   */
  trackQuery(responseTime, cached = false, resultsCount = 0) {
    this.responseTimeBuffer.push(responseTime);
    this.queryCount++;

    if (cached) {
      this.cacheHits++;
    } else {
      this.cacheMisses++;
    }

    if (resultsCount === 0) {
      this.zeroResultCount++;
    }

    // Keep buffer size manageable
    if (this.responseTimeBuffer.length > 1000) {
      this.responseTimeBuffer.shift();
    }
  }

  /**
   * Calculate and flush current performance metrics
   * 
   * @returns {Promise<object>} Flushed performance metrics
   */
  async flushMetrics() {
    if (this.queryCount === 0) {
      return null;
    }

    const sortedTimes = [...this.responseTimeBuffer].sort((a, b) => a - b);
    const avgResponseTime = this.calculateAverage(this.responseTimeBuffer);
    const p95Index = Math.floor(sortedTimes.length * 0.95);
    const p99Index = Math.floor(sortedTimes.length * 0.99);
    const p95ResponseTime = sortedTimes[p95Index] || 0;
    const p99ResponseTime = sortedTimes[p99Index] || 0;
    const cacheHitRate = this.cacheHits / this.queryCount;

    const metrics = await this.recordPerformanceMetrics(
      this.queryCount,
      avgResponseTime,
      p95ResponseTime,
      p99ResponseTime,
      cacheHitRate,
      this.zeroResultCount
    );

    // Reset counters
    this.responseTimeBuffer = [];
    this.cacheHits = 0;
    this.cacheMisses = 0;
    this.zeroResultCount = 0;
    this.queryCount = 0;

    return metrics;
  }

  /**
   * Get real-time performance statistics
   * 
   * @returns {object} Real-time performance statistics
   */
  getRealTimeStats() {
    const sortedTimes = [...this.responseTimeBuffer].sort((a, b) => a - b);
    const avgResponseTime = this.calculateAverage(this.responseTimeBuffer);
    const p95Index = Math.floor(sortedTimes.length * 0.95);
    const p99Index = Math.floor(sortedTimes.length * 0.99);
    const cacheHitRate = this.queryCount > 0 ? this.cacheHits / this.queryCount : 0;

    return {
      queryCount: this.queryCount,
      avgResponseTime,
      p95ResponseTime: sortedTimes[p95Index] || 0,
      p99ResponseTime: sortedTimes[p99Index] || 0,
      cacheHitRate,
      cacheHits: this.cacheHits,
      cacheMisses: this.cacheMisses,
      zeroResultCount: this.zeroResultCount,
      zeroResultRate: this.queryCount > 0 ? this.zeroResultCount / this.queryCount : 0
    };
  }

  /**
   * Calculate average of an array of numbers
   * 
   * @param {Array<number>} values - Array of numbers
   * @returns {number} Average value
   */
  calculateAverage(values) {
    if (values.length === 0) return 0;
    return values.reduce((sum, val) => sum + val, 0) / values.length;
  }

  /**
   * Get zero-result queries for analysis
   * 
   * @param {Date} startDate - Start date
   * @param {Date} endDate - End date
   * @returns {Promise<Array>} Array of zero-result search analytics
   */
  async getZeroResultQueries(startDate, endDate) {
    try {
      const zeroResultQueries = await this.prisma.searchAnalytics.findMany({
        where: {
          resultsCount: 0,
          timestamp: {
            gte: startDate,
            lte: endDate
          }
        },
        orderBy: {
          timestamp: 'desc'
        },
        take: 100
      });

      // Group by query to find most common zero-result searches
      const queryGroups = {};
      zeroResultQueries.forEach(zr => {
        if (!queryGroups[zr.query]) {
          queryGroups[zr.query] = {
            query: zr.query,
            count: 0,
            lastSeen: zr.timestamp
          };
        }
        queryGroups[zr.query].count++;
      });

      const sortedQueries = Object.values(queryGroups)
        .sort((a, b) => b.count - a.count)
        .slice(0, 20);

      loggerService.info('Zero-result queries retrieved', {
        startDate,
        endDate,
        totalQueries: zeroResultQueries.length,
        uniqueQueries: Object.keys(queryGroups).length
      });

      return {
        totalQueries: zeroResultQueries.length,
        uniqueQueries: Object.keys(queryGroups).length,
        topQueries: sortedQueries
      };
    } catch (error) {
      loggerService.error('Failed to get zero-result queries', {
        error: error instanceof Error ? error.message : 'Unknown error',
        startDate,
        endDate
      });
      throw error;
    }
  }

  /**
   * Get cache statistics for the specified time range
   * @param {string} timeRange - Time range (hour, day, week, month)
   * @returns {Promise<Object>} Cache statistics
   */
  async getCacheStats(timeRange = 'day') {
    // Calculate time range in milliseconds
    const timeRanges = {
      hour: 60 * 60 * 1000,
      day: 24 * 60 * 60 * 1000,
      week: 7 * 24 * 60 * 60 * 1000,
      month: 30 * 24 * 60 * 60 * 1000
    };

    const timeRangeMs = timeRanges[timeRange] || timeRanges.day;
    const startTime = new Date(Date.now() - timeRangeMs);

    // Get cache performance metrics from the database
    const cacheMetrics = await this.prisma.searchPerformanceMetrics.findMany({
      where: {
        timestamp: {
          gte: startTime
        },
        cacheHitRate: {
          not: null
        }
      },
      select: {
        cacheHitRate: true,
        timestamp: true
      },
      orderBy: {
        timestamp: 'asc'
      }
    });

    // Calculate aggregate statistics
    const totalQueries = cacheMetrics.length;
    const avgCacheHitRate = totalQueries > 0
      ? cacheMetrics.reduce((sum, m) => sum + (m.cacheHitRate || 0), 0) / totalQueries
      : 0;

    const cacheHits = Math.round(totalQueries * (avgCacheHitRate / 100));
    const cacheMisses = totalQueries - cacheHits;

    return {
      timeRange,
      startTime,
      endTime: new Date(),
      totalQueries,
      cacheHits,
      cacheMisses,
      avgCacheHitRate: Math.round(avgCacheHitRate * 100) / 100,
      hitRate: Math.round(avgCacheHitRate * 100) / 100,
      missRate: Math.round((100 - avgCacheHitRate) * 100) / 100,
      history: cacheMetrics.map(m => ({
        timestamp: m.timestamp,
        hitRate: m.cacheHitRate
      }))
    };
  }

  /**
   * Get comparison data between two time ranges
   * @param {string} currentRange - Current time range (hour, day, week, month)
   * @param {string} previousRange - Previous time range (hour, day, week, month)
   * @returns {Promise<Object>} Comparison data
   */
  async getComparisonData(currentRange = 'week', previousRange = 'previous_week') {
    try {
      const now = new Date();
      let currentStartDate, previousStartDate, previousEndDate;

      // Calculate current range start date
      switch (currentRange) {
        case 'hour':
          currentStartDate = new Date(now.setHours(now.getHours() - 1));
          break;
        case 'day':
          currentStartDate = new Date(now.setDate(now.getDate() - 1));
          break;
        case 'week':
          currentStartDate = new Date(now.setDate(now.getDate() - 7));
          break;
        case 'month':
          currentStartDate = new Date(now.setMonth(now.getMonth() - 1));
          break;
        default:
          currentStartDate = new Date(now.setDate(now.getDate() - 7));
      }

      // Calculate previous range dates
      const currentRangeDuration = now - currentStartDate;
      previousEndDate = new Date(currentStartDate);
      previousStartDate = new Date(previousEndDate.getTime() - currentRangeDuration);

      // Get current period metrics
      const currentMetrics = await this.prisma.searchPerformanceMetrics.findMany({
        where: {
          timestamp: {
            gte: currentStartDate
          }
        }
      });

      // Get previous period metrics
      const previousMetrics = await this.prisma.searchPerformanceMetrics.findMany({
        where: {
          timestamp: {
            gte: previousStartDate,
            lte: previousEndDate
          }
        }
      });

      // Calculate current period summary
      const currentSummary = this.calculatePeriodSummary(currentMetrics);
      const previousSummary = this.calculatePeriodSummary(previousMetrics);

      // Calculate percentage changes
      const comparison = {
        current: {
          range: currentRange,
          startDate: currentStartDate,
          endDate: now,
          summary: currentSummary
        },
        previous: {
          range: previousRange,
          startDate: previousStartDate,
          endDate: previousEndDate,
          summary: previousSummary
        },
        changes: {
          avgResponseTime: this.calculatePercentageChange(
            previousSummary.avgResponseTime,
            currentSummary.avgResponseTime
          ),
          p95ResponseTime: this.calculatePercentageChange(
            previousSummary.p95ResponseTime,
            currentSummary.p95ResponseTime
          ),
          p99ResponseTime: this.calculatePercentageChange(
            previousSummary.p99ResponseTime,
            currentSummary.p99ResponseTime
          ),
          cacheHitRate: this.calculatePercentageChange(
            previousSummary.cacheHitRate,
            currentSummary.cacheHitRate
          ),
          zeroResultRate: this.calculatePercentageChange(
            previousSummary.zeroResultRate,
            currentSummary.zeroResultRate
          ),
          totalQueries: this.calculatePercentageChange(
            previousSummary.totalQueries,
            currentSummary.totalQueries
          )
        }
      };

      loggerService.info('Performance comparison retrieved', {
        currentRange,
        previousRange,
        currentQueries: currentSummary.totalQueries,
        previousQueries: previousSummary.totalQueries
      });

      return comparison;
    } catch (error) {
      loggerService.error('Failed to get comparison data', {
        error: error instanceof Error ? error.message : 'Unknown error',
        currentRange,
        previousRange
      });
      throw error;
    }
  }

  /**
   * Get response time distribution for the specified time range
   * @param {string} timeRange - Time range (hour, day, week, month)
   * @returns {Promise<Object>} Response time distribution data
   */
  async getResponseTimeDistribution(timeRange = 'week') {
    try {
      const now = new Date();
      let startDate;

      switch (timeRange) {
        case 'hour':
          startDate = new Date(now.setHours(now.getHours() - 1));
          break;
        case 'day':
          startDate = new Date(now.setDate(now.getDate() - 1));
          break;
        case 'week':
          startDate = new Date(now.setDate(now.getDate() - 7));
          break;
        case 'month':
          startDate = new Date(now.setMonth(now.getMonth() - 1));
          break;
        default:
          startDate = new Date(now.setDate(now.getDate() - 7));
      }

      const metrics = await this.prisma.searchPerformanceMetrics.findMany({
        where: {
          timestamp: {
            gte: startDate
          }
        },
        orderBy: {
          timestamp: 'asc'
        }
      });

      // Create response time buckets
      const buckets = {
        '0-100ms': 0,
        '100-200ms': 0,
        '200-300ms': 0,
        '300-500ms': 0,
        '500-1000ms': 0,
        '1000-2000ms': 0,
        '2000ms+': 0
      };

      let totalResponseTime = 0;
      let responseTimes = [];

      metrics.forEach(m => {
        const avgTime = m.avgResponseTime || 0;
        totalResponseTime += avgTime;
        responseTimes.push(avgTime);

        // Bucket the response time
        if (avgTime < 100) {
          buckets['0-100ms'] += m.queryCount;
        } else if (avgTime < 200) {
          buckets['100-200ms'] += m.queryCount;
        } else if (avgTime < 300) {
          buckets['200-300ms'] += m.queryCount;
        } else if (avgTime < 500) {
          buckets['300-500ms'] += m.queryCount;
        } else if (avgTime < 1000) {
          buckets['500-1000ms'] += m.queryCount;
        } else if (avgTime < 2000) {
          buckets['1000-2000ms'] += m.queryCount;
        } else {
          buckets['2000ms+'] += m.queryCount;
        }
      });

      const totalQueries = Object.values(buckets).reduce((sum, count) => sum + count, 0);

      // Calculate percentiles
      const sortedTimes = responseTimes.sort((a, b) => a - b);
      const p50 = this.calculatePercentile(sortedTimes, 50);
      const p75 = this.calculatePercentile(sortedTimes, 75);
      const p90 = this.calculatePercentile(sortedTimes, 90);
      const p95 = this.calculatePercentile(sortedTimes, 95);
      const p99 = this.calculatePercentile(sortedTimes, 99);

      const distribution = {
        timeRange,
        startDate,
        endDate: now,
        totalQueries,
        averageResponseTime: metrics.length > 0 ? totalResponseTime / metrics.length : 0,
        percentiles: {
          p50,
          p75,
          p90,
          p95,
          p99
        },
        buckets: Object.entries(buckets).map(([label, count]) => ({
          label,
          count,
          percentage: totalQueries > 0 ? (count / totalQueries) * 100 : 0
        })),
        history: metrics.map(m => ({
          timestamp: m.timestamp,
          avgResponseTime: m.avgResponseTime,
          p95ResponseTime: m.p95ResponseTime,
          p99ResponseTime: m.p99ResponseTime
        }))
      };

      loggerService.info('Response time distribution retrieved', {
        timeRange,
        totalQueries,
        avgResponseTime: distribution.averageResponseTime
      });

      return distribution;
    } catch (error) {
      loggerService.error('Failed to get response time distribution', {
        error: error instanceof Error ? error.message : 'Unknown error',
        timeRange
      });
      throw error;
    }
  }

  /**
   * Calculate period summary from metrics
   * @param {Array} metrics - Array of performance metrics
   * @returns {Object} Period summary
   */
  calculatePeriodSummary(metrics) {
    if (metrics.length === 0) {
      return {
        avgResponseTime: 0,
        p95ResponseTime: 0,
        p99ResponseTime: 0,
        cacheHitRate: 0,
        zeroResultRate: 0,
        totalQueries: 0
      };
    }

    return {
      avgResponseTime: this.calculateAverage(metrics.map(m => m.avgResponseTime)),
      p95ResponseTime: this.calculateAverage(metrics.map(m => m.p95ResponseTime)),
      p99ResponseTime: this.calculateAverage(metrics.map(m => m.p99ResponseTime)),
      cacheHitRate: this.calculateAverage(metrics.map(m => m.cacheHitRate)),
      zeroResultRate: metrics.reduce((sum, m) => sum + m.zeroResultQueries, 0) /
                       metrics.reduce((sum, m) => sum + m.queryCount, 0),
      totalQueries: metrics.reduce((sum, m) => sum + m.queryCount, 0)
    };
  }

  /**
   * Calculate percentage change between two values
   * @param {number} oldValue - Old value
   * @param {number} newValue - New value
   * @returns {number} Percentage change
   */
  calculatePercentageChange(oldValue, newValue) {
    if (oldValue === 0) {
      return newValue > 0 ? 100 : 0;
    }
    return ((newValue - oldValue) / oldValue) * 100;
  }

  /**
   * Calculate percentile from sorted array
   * @param {Array} values - Sorted array of values
   * @param {number} percentile - Percentile to calculate (0-100)
   * @returns {number} Percentile value
   */
  calculatePercentile(values, percentile) {
    if (values.length === 0) return 0;
    const index = Math.ceil((percentile / 100) * values.length) - 1;
    return values[Math.max(0, index)];
  }
}

module.exports = { SearchPerformanceService };
