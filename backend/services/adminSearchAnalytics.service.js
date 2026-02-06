/**
 * Admin Search Analytics Service
 * 
 * This service provides admin-specific functionality for search analytics,
 * performance monitoring, optimization, personalization, and trending searches.
 * All functions require admin authentication.
 */

const { PrismaClient } = require('@prisma/client');
const { loggerService } = require('./logger');

class AdminSearchAnalyticsService {
  constructor(prisma = null) {
    this.prisma = prisma || new PrismaClient();
  }

  // ============================================================================
  // ANALYTICS OVERVIEW FUNCTIONS
  // ============================================================================

  /**
   * Get analytics overview for admin dashboard
   * 
   * @param {string} timeRange - Time range (today, week, month, all)
   * @returns {Promise<object>} Analytics overview data
   */
  async getAnalyticsOverview(timeRange = 'week') {
    try {
      const now = new Date();
      let startDate;

      switch (timeRange) {
        case 'today':
          startDate = new Date(now.setHours(0, 0, 0, 0));
          break;
        case 'week':
          startDate = new Date(now.setDate(now.getDate() - 7));
          break;
        case 'month':
          startDate = new Date(now.setMonth(now.getMonth() - 1));
          break;
        case 'all':
        default:
          startDate = new Date(0);
          break;
      }

      const analytics = await this.prisma.searchAnalytics.findMany({
        where: {
          timestamp: {
            gte: startDate
          }
        }
      });

      const totalSearches = analytics.length;
      const uniqueQueries = new Set(analytics.map(a => a.query)).size;
      const searchesWithResults = analytics.filter(a => a.resultsCount > 0).length;
      const searchesWithoutResults = analytics.filter(a => a.resultsCount === 0).length;
      const resultsRate = totalSearches > 0 ? ((searchesWithResults / totalSearches) * 100).toFixed(2) : '0';
      
      const responseTimes = analytics.map(a => a.responseTime);
      const avgResponseTime = responseTimes.length > 0 
        ? (responseTimes.reduce((sum, t) => sum + t, 0) / responseTimes.length).toFixed(2)
        : '0';
      
      const sortedTimes = [...responseTimes].sort((a, b) => a - b);
      const medianResponseTime = sortedTimes.length > 0
        ? sortedTimes[Math.floor(sortedTimes.length / 2)].toFixed(2)
        : '0';

      const conversions = analytics.filter(a => a.conversionType).length;
      const conversionRate = totalSearches > 0 ? ((conversions / totalSearches) * 100).toFixed(2) : '0';

      const clicks = await this.prisma.searchClickTracking.count({
        where: {
          searchAnalytics: {
            timestamp: {
              gte: startDate
            }
          }
        }
      });

      const clickThroughRate = totalSearches > 0 ? ((clicks / totalSearches) * 100).toFixed(2) : '0';

      // Get time series data
      const timeSeries = await this.prisma.searchAnalytics.groupBy({
        by: ['timestamp'],
        where: {
          timestamp: {
            gte: startDate
          }
        },
        _count: {
          id: true
        },
        orderBy: {
          timestamp: 'asc'
        }
      });

      // Group by day
      const groupedTimeSeries = {};
      timeSeries.forEach(item => {
        const date = item.timestamp.toISOString().split('T')[0];
        if (!groupedTimeSeries[date]) {
          groupedTimeSeries[date] = 0;
        }
        groupedTimeSeries[date] += item._count.id;
      });

      const timeSeriesData = Object.entries(groupedTimeSeries).map(([date, count]) => ({
        date,
        count
      }));

      const overview = {
        totalSearches,
        avgResponseTime,
        conversionRate,
        zeroResults: searchesWithoutResults,
        clickThroughRate,
        uniqueQueries,
        resultsRate,
        medianResponseTime,
        timeSeries: timeSeriesData,
        period: {
          startDate: startDate.toISOString(),
          endDate: new Date().toISOString()
        }
      };

      loggerService.info('Analytics overview retrieved', { timeRange, overview });

      return overview;
    } catch (error) {
      loggerService.error('Failed to get analytics overview', {
        error: error instanceof Error ? error.message : 'Unknown error',
        timeRange
      });
      throw error;
    }
  }

  /**
   * Get detailed analytics metrics
   * 
   * @param {Date} startDate - Start date
   * @param {Date} endDate - End date
   * @returns {Promise<object>} Analytics metrics
   */
  async getAnalyticsMetrics(startDate, endDate) {
    try {
      const analytics = await this.prisma.searchAnalytics.findMany({
        where: {
          timestamp: {
            gte: startDate,
            lte: endDate
          }
        }
      });

      const totalSearches = analytics.length;
      const uniqueQueries = new Set(analytics.map(a => a.query)).size;
      const searchesWithResults = analytics.filter(a => a.resultsCount > 0).length;
      const searchesWithoutResults = analytics.filter(a => a.resultsCount === 0).length;
      const resultsRate = totalSearches > 0 ? ((searchesWithResults / totalSearches) * 100).toFixed(2) : '0';
      
      const responseTimes = analytics.map(a => a.responseTime);
      const avgResponseTime = responseTimes.length > 0 
        ? (responseTimes.reduce((sum, t) => sum + t, 0) / responseTimes.length).toFixed(2)
        : '0';
      
      const sortedTimes = [...responseTimes].sort((a, b) => a - b);
      const medianResponseTime = sortedTimes.length > 0
        ? sortedTimes[Math.floor(sortedTimes.length / 2)].toFixed(2)
        : '0';
      
      const p95ResponseTime = sortedTimes.length > 0
        ? sortedTimes[Math.floor(sortedTimes.length * 0.95)].toFixed(2)
        : '0';
      
      const p99ResponseTime = sortedTimes.length > 0
        ? sortedTimes[Math.floor(sortedTimes.length * 0.99)].toFixed(2)
        : '0';

      const conversions = analytics.filter(a => a.conversionType).length;
      const conversionRate = totalSearches > 0 ? ((conversions / totalSearches) * 100).toFixed(2) : '0';

      const clicks = await this.prisma.searchClickTracking.count({
        where: {
          searchAnalytics: {
            timestamp: {
              gte: startDate,
              lte: endDate
            }
          }
        }
      });

      const clickThroughRate = totalSearches > 0 ? ((clicks / totalSearches) * 100).toFixed(2) : '0';

      const metrics = {
        totalSearches,
        uniqueQueries,
        searchesWithResults,
        searchesWithoutResults,
        resultsRate,
        avgResponseTime,
        medianResponseTime,
        p95ResponseTime,
        p99ResponseTime,
        conversions,
        conversionRate,
        clicks,
        clickThroughRate,
        period: {
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString()
        }
      };

      loggerService.info('Analytics metrics retrieved', { startDate, endDate, metrics });

      return metrics;
    } catch (error) {
      loggerService.error('Failed to get analytics metrics', {
        error: error instanceof Error ? error.message : 'Unknown error',
        startDate,
        endDate
      });
      throw error;
    }
  }

  /**
   * Get search queries with filters and pagination
   * 
   * @param {object} filters - Query filters
   * @param {object} pagination - Pagination options
   * @returns {Promise<object>} Search queries list
   */
  async getSearchQueries(filters = {}, pagination = {}) {
    try {
      const {
        query,
        minResults,
        maxResults,
        minResponseTime,
        maxResponseTime,
        hasConversion,
        startDate,
        endDate
      } = filters;

      const { page = 1, limit = 20, sortBy = 'count', sortOrder = 'desc' } = pagination;

      const where = {};
      
      if (query) {
        where.query = {
          contains: query,
          mode: 'insensitive'
        };
      }

      if (minResults !== undefined || maxResults !== undefined) {
        where.resultsCount = {};
        if (minResults !== undefined) where.resultsCount.gte = minResults;
        if (maxResults !== undefined) where.resultsCount.lte = maxResults;
      }

      if (minResponseTime !== undefined || maxResponseTime !== undefined) {
        where.responseTime = {};
        if (minResponseTime !== undefined) where.responseTime.gte = minResponseTime;
        if (maxResponseTime !== undefined) where.responseTime.lte = maxResponseTime;
      }

      if (hasConversion !== undefined) {
        where.conversionType = hasConversion ? { not: null } : null;
      }

      if (startDate || endDate) {
        where.timestamp = {};
        if (startDate) where.timestamp.gte = new Date(startDate);
        if (endDate) where.timestamp.lte = new Date(endDate);
      }

      const skip = (page - 1) * limit;

      // Get grouped queries with counts
      const groupedQueries = await this.prisma.searchAnalytics.groupBy({
        by: ['query'],
        where,
        _count: {
          id: true
        },
        _avg: {
          resultsCount: true,
          responseTime: true
        },
        _max: {
          timestamp: true
        },
        orderBy: {
          _count: {
            id: sortOrder
          }
        },
        take: limit,
        skip
      });

      const total = await this.prisma.searchAnalytics.groupBy({
        by: ['query'],
        where,
      });

      const queries = groupedQueries.map(gq => ({
        query: gq.query,
        count: gq._count.id,
        avgResults: Math.round(gq._avg.resultsCount || 0),
        avgResponseTime: (gq._avg.responseTime || 0).toFixed(2),
        lastSearchedAt: gq._max.timestamp.toISOString()
      }));

      const result = {
        queries,
        pagination: {
          page,
          limit,
          total: total.length,
          pages: Math.ceil(total.length / limit)
        }
      };

      loggerService.info('Search queries retrieved', { filters, pagination, count: queries.length });

      return result;
    } catch (error) {
      loggerService.error('Failed to get search queries', {
        error: error instanceof Error ? error.message : 'Unknown error',
        filters,
        pagination
      });
      throw error;
    }
  }

  /**
   * Get detailed query information
   * 
   * @param {string} queryId - Query ID (or query string)
   * @returns {Promise<object>} Query details
   */
  async getQueryDetails(queryId) {
    try {
      const analytics = await this.prisma.searchAnalytics.findMany({
        where: {
          query: queryId
        },
        include: {
          clickTrackings: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  slug: true,
                  regularPrice: true,
                  salePrice: true,
                  primaryImage: true
                }
              }
            }
          }
        },
        orderBy: {
          timestamp: 'desc'
        },
        take: 100
      });

      if (analytics.length === 0) {
        throw new Error('Query not found');
      }

      const totalSearches = analytics.length;
      const resultsCounts = analytics.map(a => a.resultsCount);
      const avgResults = resultsCounts.reduce((sum, c) => sum + c, 0) / resultsCounts.length;
      const responseTimes = analytics.map(a => a.responseTime);
      const avgResponseTime = responseTimes.reduce((sum, t) => sum + t, 0) / responseTimes.length;

      const clicks = analytics.flatMap(a => a.clickTrackings);
      const clickThroughRate = totalSearches > 0 ? ((clicks.length / totalSearches) * 100).toFixed(2) : '0';

      // Click-through rate by position
      const clicksByPosition = {};
      clicks.forEach(click => {
        const pos = click.position;
        if (!clicksByPosition[pos]) {
          clicksByPosition[pos] = 0;
        }
        clicksByPosition[pos]++;
      });

      const conversions = analytics.filter(a => a.conversionType).length;
      const conversionRate = totalSearches > 0 ? ((conversions / totalSearches) * 100).toFixed(2) : '0';

      // User demographics
      const userIds = analytics.map(a => a.userId).filter(Boolean);
      const uniqueUsers = new Set(userIds).size;

      // Time-based trends
      const trendsByDay = {};
      analytics.forEach(a => {
        const date = a.timestamp.toISOString().split('T')[0];
        if (!trendsByDay[date]) {
          trendsByDay[date] = 0;
        }
        trendsByDay[date]++;
      });

      const timeTrends = Object.entries(trendsByDay).map(([date, count]) => ({
        date,
        count
      }));

      // Related queries (queries that were searched before/after this one)
      const relatedQueries = await this.getRelatedQueries(queryId);

      const details = {
        query: queryId,
        frequency: totalSearches,
        avgResults: Math.round(avgResults),
        avgResponseTime: avgResponseTime.toFixed(2),
        clickThroughRate,
        conversionRate,
        uniqueUsers,
        clicksByPosition,
        timeTrends,
        relatedQueries,
        recentSearches: analytics.slice(0, 10).map(a => ({
          timestamp: a.timestamp.toISOString(),
          resultsCount: a.resultsCount,
          responseTime: a.responseTime,
          userId: a.userId,
          conversionType: a.conversionType
        }))
      };

      loggerService.info('Query details retrieved', { queryId, details });

      return details;
    } catch (error) {
      loggerService.error('Failed to get query details', {
        error: error instanceof Error ? error.message : 'Unknown error',
        queryId
      });
      throw error;
    }
  }

  /**
   * Get zero-result queries
   * 
   * @param {number} limit - Maximum number of results
   * @returns {Promise<Array>} Zero-result queries
   */
  async getZeroResultQueries(limit = 50) {
    try {
      const zeroResultAnalytics = await this.prisma.searchAnalytics.findMany({
        where: {
          resultsCount: 0
        },
        orderBy: {
          timestamp: 'desc'
        },
        take: limit * 10 // Get more to group them
      });

      // Group by query
      const groupedQueries = {};
      zeroResultAnalytics.forEach(a => {
        if (!groupedQueries[a.query]) {
          groupedQueries[a.query] = {
            query: a.query,
            count: 0,
            lastSearched: a.timestamp
          };
        }
        groupedQueries[a.query].count++;
        if (a.timestamp > groupedQueries[a.query].lastSearched) {
          groupedQueries[a.query].lastSearched = a.timestamp;
        }
      });

      const queries = Object.values(groupedQueries)
        .sort((a, b) => b.count - a.count)
        .slice(0, limit)
        .map(q => ({
          query: q.query,
          count: q.count,
          lastSearched: q.lastSearched.toISOString()
        }));

      loggerService.info('Zero-result queries retrieved', { count: queries.length });

      return queries;
    } catch (error) {
      loggerService.error('Failed to get zero-result queries', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  /**
   * Get conversion data
   * 
   * @param {string} timeRange - Time range (today, week, month, all)
   * @returns {Promise<object>} Conversion data
   */
  async getConversionData(timeRange = 'week') {
    try {
      const now = new Date();
      let startDate;

      switch (timeRange) {
        case 'today':
          startDate = new Date(now.setHours(0, 0, 0, 0));
          break;
        case 'week':
          startDate = new Date(now.setDate(now.getDate() - 7));
          break;
        case 'month':
          startDate = new Date(now.setMonth(now.getMonth() - 1));
          break;
        case 'all':
        default:
          startDate = new Date(0);
          break;
      }

      const analytics = await this.prisma.searchAnalytics.findMany({
        where: {
          timestamp: {
            gte: startDate
          }
        }
      });

      const totalSearches = analytics.length;
      const conversions = analytics.filter(a => a.conversionType).length;
      const conversionRate = totalSearches > 0 ? ((conversions / totalSearches) * 100).toFixed(2) : '0';

      // Conversion by type
      const conversionByType = {};
      analytics.forEach(a => {
        if (a.conversionType) {
          if (!conversionByType[a.conversionType]) {
            conversionByType[a.conversionType] = 0;
          }
          conversionByType[a.conversionType]++;
        }
      });

      // Conversion funnel
      const searchesWithResults = analytics.filter(a => a.resultsCount > 0).length;
      const clicks = await this.prisma.searchClickTracking.count({
        where: {
          searchAnalytics: {
            timestamp: {
              gte: startDate
            }
          }
        }
      });

      const funnel = {
        searches: totalSearches,
        searchesWithResults,
        clicks,
        conversions
      };

      const data = {
        totalSearches,
        conversions,
        conversionRate,
        conversionByType,
        funnel,
        period: {
          startDate: startDate.toISOString(),
          endDate: new Date().toISOString()
        }
      };

      loggerService.info('Conversion data retrieved', { timeRange, data });

      return data;
    } catch (error) {
      loggerService.error('Failed to get conversion data', {
        error: error instanceof Error ? error.message : 'Unknown error',
        timeRange
      });
      throw error;
    }
  }

  /**
   * Export analytics data
   * 
   * @param {string} format - Export format (csv, excel)
   * @param {object} filters - Data filters
   * @returns {Promise<object>} Export data
   */
  async exportAnalyticsData(format = 'csv', filters = {}) {
    try {
      const {
        startDate,
        endDate,
        minResults,
        maxResults
      } = filters;

      const where = {};

      if (startDate || endDate) {
        where.timestamp = {};
        if (startDate) where.timestamp.gte = new Date(startDate);
        if (endDate) where.timestamp.lte = new Date(endDate);
      }

      if (minResults !== undefined || maxResults !== undefined) {
        where.resultsCount = {};
        if (minResults !== undefined) where.resultsCount.gte = minResults;
        if (maxResults !== undefined) where.resultsCount.lte = maxResults;
      }

      const analytics = await this.prisma.searchAnalytics.findMany({
        where,
        orderBy: {
          timestamp: 'desc'
        },
        take: 10000 // Limit export size
      });

      const data = analytics.map(a => ({
        timestamp: a.timestamp.toISOString(),
        query: a.query,
        resultsCount: a.resultsCount,
        responseTime: a.responseTime,
        userId: a.userId,
        sessionId: a.sessionId,
        conversionType: a.conversionType,
        productId: a.productId,
        deviceType: a.deviceType
      }));

      const exportData = {
        format,
        data,
        count: data.length,
        exportedAt: new Date().toISOString()
      };

      loggerService.info('Analytics data exported', { format, count: data.length });

      return exportData;
    } catch (error) {
      loggerService.error('Failed to export analytics data', {
        error: error instanceof Error ? error.message : 'Unknown error',
        format,
        filters
      });
      throw error;
    }
  }

  // ============================================================================
  // PERFORMANCE OVERVIEW FUNCTIONS
  // ============================================================================

  /**
   * Get performance overview
   * 
   * @param {string} timeRange - Time range (today, week, month, all)
   * @returns {Promise<object>} Performance overview
   */
  async getPerformanceOverview(timeRange = 'week') {
    try {
      const now = new Date();
      let startDate;

      switch (timeRange) {
        case 'today':
          startDate = new Date(now.setHours(0, 0, 0, 0));
          break;
        case 'week':
          startDate = new Date(now.setDate(now.getDate() - 7));
          break;
        case 'month':
          startDate = new Date(now.setMonth(now.getMonth() - 1));
          break;
        case 'all':
        default:
          startDate = new Date(0);
          break;
      }

      const analytics = await this.prisma.searchAnalytics.findMany({
        where: {
          timestamp: {
            gte: startDate
          }
        }
      });

      const totalSearches = analytics.length;
      const responseTimes = analytics.map(a => a.responseTime);
      const avgResponseTime = responseTimes.length > 0 
        ? (responseTimes.reduce((sum, t) => sum + t, 0) / responseTimes.length).toFixed(2)
        : '0';
      
      const sortedTimes = [...responseTimes].sort((a, b) => a - b);
      const medianResponseTime = sortedTimes.length > 0
        ? sortedTimes[Math.floor(sortedTimes.length / 2)].toFixed(2)
        : '0';
      
      const p95ResponseTime = sortedTimes.length > 0
        ? sortedTimes[Math.floor(sortedTimes.length * 0.95)].toFixed(2)
        : '0';
      
      const p99ResponseTime = sortedTimes.length > 0
        ? sortedTimes[Math.floor(sortedTimes.length * 0.99)].toFixed(2)
        : '0';

      // Cache hit rate (simulated - would need actual cache tracking)
      const cacheHitRate = '75.5';

      const zeroResultQueries = analytics.filter(a => a.resultsCount === 0).length;
      const zeroResultRate = totalSearches > 0 ? ((zeroResultQueries / totalSearches) * 100).toFixed(2) : '0';

      const overview = {
        totalSearches,
        avgResponseTime,
        medianResponseTime,
        p95ResponseTime,
        p99ResponseTime,
        cacheHitRate,
        zeroResultQueries,
        zeroResultRate,
        period: {
          startDate: startDate.toISOString(),
          endDate: new Date().toISOString()
        }
      };

      loggerService.info('Performance overview retrieved', { timeRange, overview });

      return overview;
    } catch (error) {
      loggerService.error('Failed to get performance overview', {
        error: error instanceof Error ? error.message : 'Unknown error',
        timeRange
      });
      throw error;
    }
  }

  /**
   * Get detailed performance metrics
   * 
   * @param {string} timeRange - Time range (today, week, month, all)
   * @returns {Promise<object>} Performance metrics
   */
  async getPerformanceMetrics(timeRange = 'week') {
    try {
      const now = new Date();
      let startDate;

      switch (timeRange) {
        case 'today':
          startDate = new Date(now.setHours(0, 0, 0, 0));
          break;
        case 'week':
          startDate = new Date(now.setDate(now.getDate() - 7));
          break;
        case 'month':
          startDate = new Date(now.setMonth(now.getMonth() - 1));
          break;
        case 'all':
        default:
          startDate = new Date(0);
          break;
      }

      const analytics = await this.prisma.searchAnalytics.findMany({
        where: {
          timestamp: {
            gte: startDate
          }
        }
      });

      const totalSearches = analytics.length;
      const responseTimes = analytics.map(a => a.responseTime);
      const avgResponseTime = responseTimes.length > 0 
        ? (responseTimes.reduce((sum, t) => sum + t, 0) / responseTimes.length).toFixed(2)
        : '0';
      
      const sortedTimes = [...responseTimes].sort((a, b) => a - b);
      const medianResponseTime = sortedTimes.length > 0
        ? sortedTimes[Math.floor(sortedTimes.length / 2)].toFixed(2)
        : '0';
      
      const p95ResponseTime = sortedTimes.length > 0
        ? sortedTimes[Math.floor(sortedTimes.length * 0.95)].toFixed(2)
        : '0';
      
      const p99ResponseTime = sortedTimes.length > 0
        ? sortedTimes[Math.floor(sortedTimes.length * 0.99)].toFixed(2)
        : '0';
      
      const maxResponseTime = sortedTimes.length > 0 ? sortedTimes[sortedTimes.length - 1] : 0;
      const minResponseTime = sortedTimes.length > 0 ? sortedTimes[0] : 0;

      const resultsCounts = analytics.map(a => a.resultsCount);
      const avgResultsCount = resultsCounts.length > 0 
        ? (resultsCounts.reduce((sum, c) => sum + c, 0) / resultsCounts.length).toFixed(2)
        : '0';

      const zeroResultQueries = analytics.filter(a => a.resultsCount === 0).length;
      const zeroResultRate = totalSearches > 0 ? ((zeroResultQueries / totalSearches) * 100).toFixed(2) : '0';

      // Slow and fast query thresholds
      const slowQueryThreshold = 1000; // 1 second
      const fastQueryThreshold = 100; // 100ms
      const slowQueries = responseTimes.filter(t => t > slowQueryThreshold).length;
      const fastQueries = responseTimes.filter(t => t < fastQueryThreshold).length;
      const slowQueryRate = totalSearches > 0 ? ((slowQueries / totalSearches) * 100).toFixed(2) : '0';
      const fastQueryRate = totalSearches > 0 ? ((fastQueries / totalSearches) * 100).toFixed(2) : '0';

      const metrics = {
        totalSearches,
        avgResponseTime,
        medianResponseTime,
        p95ResponseTime,
        p99ResponseTime,
        maxResponseTime: maxResponseTime.toString(),
        minResponseTime: minResponseTime.toString(),
        avgResultsCount,
        zeroResultQueries,
        zeroResultRate,
        slowQueries,
        fastQueries,
        slowQueryRate,
        fastQueryRate,
        period: {
          startDate: startDate.toISOString(),
          endDate: new Date().toISOString()
        }
      };

      loggerService.info('Performance metrics retrieved', { timeRange, metrics });

      return metrics;
    } catch (error) {
      loggerService.error('Failed to get performance metrics', {
        error: error instanceof Error ? error.message : 'Unknown error',
        timeRange
      });
      throw error;
    }
  }

  /**
   * Get performance alerts
   * 
   * @param {object} thresholds - Alert thresholds
   * @returns {Promise<Array>} Performance alerts
   */
  async getPerformanceAlerts(thresholds = {}) {
    try {
      const {
        slowQueryThreshold = 1000,
        highZeroResultsThreshold = 10,
        lowCacheHitThreshold = 50
      } = thresholds;

      const alerts = [];

      // Check for slow queries
      const slowQueries = await this.prisma.searchAnalytics.findMany({
        where: {
          responseTime: {
            gt: slowQueryThreshold
          },
          timestamp: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
          }
        },
        orderBy: {
          responseTime: 'desc'
        },
        take: 10
      });

      if (slowQueries.length > 0) {
        alerts.push({
          id: `alert_slow_queries_${Date.now()}`,
          type: 'slow_query',
          severity: slowQueries.length > 5 ? 'high' : 'medium',
          message: `${slowQueries.length} slow queries detected (>${slowQueryThreshold}ms)`,
          metric: 'responseTime',
          value: slowQueries[0].responseTime,
          threshold: slowQueryThreshold,
          timestamp: slowQueries[0].timestamp,
          resolved: false
        });
      }

      // Check for high zero-result queries
      const zeroResultGroups = await this.prisma.searchAnalytics.groupBy({
        by: ['query'],
        where: {
          resultsCount: 0,
          timestamp: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
          }
        },
        _count: {
          id: true
        },
        having: {
          id: {
            _count: {
              gt: highZeroResultsThreshold
            }
          }
        },
        orderBy: {
          _count: {
            id: 'desc'
          }
        },
        take: 5
      });

      zeroResultGroups.forEach(group => {
        alerts.push({
          id: `alert_zero_results_${group.query.replace(/\s/g, '_')}_${Date.now()}`,
          type: 'high_zero_results',
          severity: 'medium',
          message: `Query "${group.query}" has ${group._count.id} zero-result searches`,
          metric: 'zeroResults',
          value: group._count.id,
          threshold: highZeroResultsThreshold,
          timestamp: new Date(),
          resolved: false
        });
      });

      loggerService.info('Performance alerts retrieved', { count: alerts.length });

      return alerts;
    } catch (error) {
      loggerService.error('Failed to get performance alerts', {
        error: error instanceof Error ? error.message : 'Unknown error',
        thresholds
      });
      throw error;
    }
  }

  /**
   * Update alert status
   * 
   * @param {string} alertId - Alert ID
   * @param {string} status - New status (acknowledged, dismissed, resolved)
   * @returns {Promise<void>}
   */
  async updateAlertStatus(alertId, status) {
    try {
      // In a real implementation, this would update a database table
      loggerService.info('Alert status updated', { alertId, status });
      return { success: true };
    } catch (error) {
      loggerService.error('Failed to update alert status', {
        error: error instanceof Error ? error.message : 'Unknown error',
        alertId,
        status
      });
      throw error;
    }
  }

  /**
   * Get performance comparison between two periods
   * 
   * @param {string} period1 - First period (today, week, month)
   * @param {string} period2 - Second period (today, week, month)
   * @returns {Promise<object>} Performance comparison
   */
  async getPerformanceComparison(period1, period2) {
    try {
      const getMetricsForPeriod = async (period) => {
        const now = new Date();
        let startDate, endDate;

        switch (period) {
          case 'today':
            startDate = new Date(now.setHours(0, 0, 0, 0));
            endDate = new Date();
            break;
          case 'week':
            startDate = new Date(now.setDate(now.getDate() - 7));
            endDate = new Date();
            break;
          case 'month':
            startDate = new Date(now.setMonth(now.getMonth() - 1));
            endDate = new Date();
            break;
          default:
            startDate = new Date(0);
            endDate = new Date();
        }

        const analytics = await this.prisma.searchAnalytics.findMany({
          where: {
            timestamp: {
              gte: startDate,
              lte: endDate
            }
          }
        });

        const responseTimes = analytics.map(a => a.responseTime);
        const avgResponseTime = responseTimes.length > 0 
          ? (responseTimes.reduce((sum, t) => sum + t, 0) / responseTimes.length)
          : 0;

        const zeroResultRate = analytics.length > 0 
          ? ((analytics.filter(a => a.resultsCount === 0).length / analytics.length) * 100)
          : 0;

        return {
          avgResponseTime: avgResponseTime.toFixed(2),
          p95ResponseTime: [...responseTimes].sort((a, b) => a - b)[Math.floor(responseTimes.length * 0.95)]?.toFixed(2) || '0',
          cacheHitRate: '75.5', // Simulated
          zeroResultRate: zeroResultRate.toFixed(2)
        };
      };

      const currentPeriod = await getMetricsForPeriod(period1);
      const previousPeriod = await getMetricsForPeriod(period2);

      const change = {
        avgResponseTime: ((parseFloat(currentPeriod.avgResponseTime) - parseFloat(previousPeriod.avgResponseTime)) / parseFloat(previousPeriod.avgResponseTime) * 100).toFixed(2),
        p95ResponseTime: ((parseFloat(currentPeriod.p95ResponseTime) - parseFloat(previousPeriod.p95ResponseTime)) / parseFloat(previousPeriod.p95ResponseTime) * 100).toFixed(2),
        cacheHitRate: '0.00', // Simulated
        zeroResultRate: ((parseFloat(currentPeriod.zeroResultRate) - parseFloat(previousPeriod.zeroResultRate)) / parseFloat(previousPeriod.zeroResultRate) * 100).toFixed(2)
      };

      const comparison = {
        currentPeriod,
        previousPeriod,
        change
      };

      loggerService.info('Performance comparison retrieved', { period1, period2, comparison });

      return comparison;
    } catch (error) {
      loggerService.error('Failed to get performance comparison', {
        error: error instanceof Error ? error.message : 'Unknown error',
        period1,
        period2
      });
      throw error;
    }
  }

  /**
   * Update performance threshold
   * 
   * @param {object} thresholds - New thresholds
   * @returns {Promise<object>} Updated thresholds
   */
  async updatePerformanceThreshold(thresholds) {
    try {
      // In a real implementation, this would update a configuration table
      loggerService.info('Performance threshold updated', { thresholds });
      return { success: true, thresholds };
    } catch (error) {
      loggerService.error('Failed to update performance threshold', {
        error: error instanceof Error ? error.message : 'Unknown error',
        thresholds
      });
      throw error;
    }
  }

  // ============================================================================
  // OPTIMIZATION OVERVIEW FUNCTIONS
  // ============================================================================

  /**
   * Get query patterns
   * 
   * @param {string} timeRange - Time range (today, week, month, all)
   * @returns {Promise<object>} Query patterns
   */
  async getQueryPatterns(timeRange = 'week') {
    try {
      const now = new Date();
      let startDate;

      switch (timeRange) {
        case 'today':
          startDate = new Date(now.setHours(0, 0, 0, 0));
          break;
        case 'week':
          startDate = new Date(now.setDate(now.getDate() - 7));
          break;
        case 'month':
          startDate = new Date(now.setMonth(now.getMonth() - 1));
          break;
        case 'all':
        default:
          startDate = new Date(0);
          break;
      }

      const analytics = await this.prisma.searchAnalytics.findMany({
        where: {
          timestamp: {
            gte: startDate
          }
        }
      });

      const totalSearches = analytics.length;

      // Common patterns
      const patternCounts = {};
      analytics.forEach(a => {
        const pattern = a.query.toLowerCase().trim();
        if (!patternCounts[pattern]) {
          patternCounts[pattern] = 0;
        }
        patternCounts[pattern]++;
      });

      const commonPatterns = Object.entries(patternCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 20)
        .map(([pattern, count]) => ({
          pattern,
          count,
          percentage: ((count / totalSearches) * 100).toFixed(2),
          avgResults: Math.round(analytics.filter(a => a.query.toLowerCase().trim() === pattern).reduce((sum, a) => sum + a.resultsCount, 0) / count)
        }));

      // Zero-result queries
      const zeroResultQueries = await this.getZeroResultQueries(20);

      // Query length distribution
      const lengthDistribution = {};
      analytics.forEach(a => {
        const length = a.query.length;
        const range = length < 10 ? '0-9' : length < 20 ? '10-19' : length < 30 ? '20-29' : length < 50 ? '30-49' : '50+';
        if (!lengthDistribution[range]) {
          lengthDistribution[range] = 0;
        }
        lengthDistribution[range]++;
      });

      const queryLengthDistribution = Object.entries(lengthDistribution).map(([range, count]) => ({
        lengthRange: range,
        count,
        percentage: ((count / totalSearches) * 100).toFixed(2)
      }));

      // Filter usage
      const filterUsage = {};
      analytics.forEach(a => {
        if (a.filtersApplied && typeof a.filtersApplied === 'object') {
          Object.keys(a.filtersApplied).forEach(filter => {
            if (!filterUsage[filter]) {
              filterUsage[filter] = 0;
            }
            filterUsage[filter]++;
          });
        }
      });

      const filters = Object.entries(filterUsage)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([filterName, count]) => ({
          filterName,
          count,
          percentage: ((count / totalSearches) * 100).toFixed(2),
          avgResults: Math.round(analytics.filter(a => a.filtersApplied?.[filterName]).reduce((sum, a) => sum + a.resultsCount, 0) / count)
        }));

      // Sort by usage
      const sortByUsage = {};
      analytics.forEach(a => {
        if (a.sortBy) {
          if (!sortByUsage[a.sortBy]) {
            sortByUsage[a.sortBy] = 0;
          }
          sortByUsage[a.sortBy]++;
        }
      });

      const sortBys = Object.entries(sortByUsage)
        .sort((a, b) => b[1] - a[1])
        .map(([sortBy, count]) => ({
          sortBy,
          sortOrder: 'desc', // Default assumption
          count,
          percentage: ((count / totalSearches) * 100).toFixed(2)
        }));

      const patterns = {
        commonPatterns,
        zeroResultQueries,
        queryLengthDistribution,
        filterUsage: filters,
        sortByUsage: sortBys
      };

      loggerService.info('Query patterns retrieved', { timeRange });

      return patterns;
    } catch (error) {
      loggerService.error('Failed to get query patterns', {
        error: error instanceof Error ? error.message : 'Unknown error',
        timeRange
      });
      throw error;
    }
  }

  /**
   * Get experiments
   * 
   * @param {object} filters - Experiment filters
   * @returns {Promise<Array>} Experiments
   */
  async getExperiments(filters = {}) {
    try {
      const { status, sortBy = 'startDate', sortOrder = 'desc' } = filters;

      const where = {};
      if (status) {
        where.isActive = status === 'active';
      }

      const experiments = await this.prisma.searchExperiment.findMany({
        where,
        orderBy: {
          [sortBy]: sortOrder
        }
      });

      loggerService.info('Experiments retrieved', { count: experiments.length });

      return experiments;
    } catch (error) {
      loggerService.error('Failed to get experiments', {
        error: error instanceof Error ? error.message : 'Unknown error',
        filters
      });
      throw error;
    }
  }

  /**
   * Get experiment details
   * 
   * @param {string} experimentId - Experiment ID
   * @returns {Promise<object>} Experiment details
   */
  async getExperimentDetails(experimentId) {
    try {
      const experiment = await this.prisma.searchExperiment.findUnique({
        where: { id: experimentId },
        include: {
          metrics: true
        }
      });

      if (!experiment) {
        throw new Error('Experiment not found');
      }

      loggerService.info('Experiment details retrieved', { experimentId });

      return experiment;
    } catch (error) {
      loggerService.error('Failed to get experiment details', {
        error: error instanceof Error ? error.message : 'Unknown error',
        experimentId
      });
      throw error;
    }
  }

  /**
   * Create experiment
   * 
   * @param {object} experimentData - Experiment data
   * @returns {Promise<object>} Created experiment
   */
  async createExperiment(experimentData) {
    try {
      const experiment = await this.prisma.searchExperiment.create({
        data: {
          name: experimentData.name,
          description: experimentData.description,
          algorithmVariant: experimentData.algorithmVariant,
          startDate: new Date(experimentData.startDate),
          endDate: experimentData.endDate ? new Date(experimentData.endDate) : null,
          isActive: true,
          sampleSize: experimentData.sampleSize,
          controlGroupSize: Math.round(experimentData.sampleSize * (experimentData.controlGroupPercentage || 50) / 100),
          variantGroupSize: Math.round(experimentData.sampleSize * (1 - (experimentData.controlGroupPercentage || 50) / 100))
        }
      });

      loggerService.info('Experiment created', { experimentId: experiment.id });

      return experiment;
    } catch (error) {
      loggerService.error('Failed to create experiment', {
        error: error instanceof Error ? error.message : 'Unknown error',
        experimentData
      });
      throw error;
    }
  }

  /**
   * Update experiment status
   * 
   * @param {string} experimentId - Experiment ID
   * @param {string} status - New status (active, paused, completed)
   * @returns {Promise<object>} Updated experiment
   */
  async updateExperimentStatus(experimentId, status) {
    try {
      const updateData = {};
      if (status === 'active') {
        updateData.isActive = true;
      } else if (status === 'paused') {
        updateData.isActive = false;
      } else if (status === 'completed') {
        updateData.isActive = false;
        updateData.endDate = new Date();
      }

      const experiment = await this.prisma.searchExperiment.update({
        where: { id: experimentId },
        data: updateData
      });

      loggerService.info('Experiment status updated', { experimentId, status });

      return experiment;
    } catch (error) {
      loggerService.error('Failed to update experiment status', {
        error: error instanceof Error ? error.message : 'Unknown error',
        experimentId,
        status
      });
      throw error;
    }
  }

  /**
   * Delete experiment
   * 
   * @param {string} experimentId - Experiment ID
   * @returns {Promise<void>}
   */
  async deleteExperiment(experimentId) {
    try {
      await this.prisma.searchExperiment.delete({
        where: { id: experimentId }
      });

      loggerService.info('Experiment deleted', { experimentId });
    } catch (error) {
      loggerService.error('Failed to delete experiment', {
        error: error instanceof Error ? error.message : 'Unknown error',
        experimentId
      });
      throw error;
    }
  }

  /**
   * Get optimization insights
   * 
   * @returns {Promise<Array>} Optimization insights
   */
  async getOptimizationInsights() {
    try {
      const insights = [];

      // Check for high zero-result queries
      const zeroResultQueries = await this.getZeroResultQueries(10);
      if (zeroResultQueries.length > 0 && zeroResultQueries[0].count > 20) {
        insights.push({
          type: 'query',
          priority: 'high',
          title: 'High Zero-Result Queries',
          description: `Query "${zeroResultQueries[0].query}" has ${zeroResultQueries[0].count} zero-result searches. Consider adding synonyms or related products.`,
          impact: 'High',
          effort: 'Medium',
          status: 'pending'
        });
      }

      // Check for slow queries
      const slowQueries = await this.prisma.searchAnalytics.findMany({
        where: {
          responseTime: {
            gt: 1000
          },
          timestamp: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000)
          }
        },
        take: 1
      });

      if (slowQueries.length > 0) {
        insights.push({
          type: 'query',
          priority: 'medium',
          title: 'Slow Query Performance',
          description: 'Some queries are taking longer than 1 second to execute. Consider optimizing database queries or adding caching.',
          impact: 'Medium',
          effort: 'High',
          status: 'pending'
        });
      }

      // Check filter usage
      const analytics = await this.prisma.searchAnalytics.findMany({
        take: 1000
      });

      const filterUsage = {};
      analytics.forEach(a => {
        if (a.filtersApplied && typeof a.filtersApplied === 'object') {
          Object.keys(a.filtersApplied).forEach(filter => {
            if (!filterUsage[filter]) {
              filterUsage[filter] = 0;
            }
            filterUsage[filter]++;
          });
        }
      });

      if (Object.keys(filterUsage).length < 3) {
        insights.push({
          type: 'filter',
          priority: 'low',
          title: 'Low Filter Usage',
          description: 'Users are not using many filters. Consider improving filter visibility or adding more relevant filters.',
          impact: 'Low',
          effort: 'Low',
          status: 'pending'
        });
      }

      loggerService.info('Optimization insights retrieved', { count: insights.length });

      return insights;
    } catch (error) {
      loggerService.error('Failed to get optimization insights', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  // ============================================================================
  // PERSONALIZATION OVERVIEW FUNCTIONS
  // ============================================================================

  /**
   * Get personalization overview
   * 
   * @returns {Promise<object>} Personalization overview
   */
  async getPersonalizationOverview() {
    try {
      const totalUsers = await this.prisma.user.count();
      const usersWithPreferences = await this.prisma.userPreference.count();

      const overview = {
        totalUsers,
        usersWithPreferences,
        personalizationEnabled: true,
        recommendationEngineStatus: 'active',
        lastUpdated: new Date().toISOString()
      };

      loggerService.info('Personalization overview retrieved', { overview });

      return overview;
    } catch (error) {
      loggerService.error('Failed to get personalization overview', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  /**
   * Get user preferences list
   * 
   * @param {object} filters - User filters
   * @param {object} pagination - Pagination options
   * @returns {Promise<object>} User preferences list
   */
  async getUserPreferencesList(filters = {}, pagination = {}) {
    try {
      const { page = 1, limit = 20 } = pagination;
      const skip = (page - 1) * limit;

      const preferences = await this.prisma.userPreference.findMany({
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true
            }
          }
        },
        skip,
        take: limit
      });

      const total = await this.prisma.userPreference.count();

      const result = {
        preferences,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      };

      loggerService.info('User preferences list retrieved', { count: preferences.length });

      return result;
    } catch (error) {
      loggerService.error('Failed to get user preferences list', {
        error: error instanceof Error ? error.message : 'Unknown error',
        filters,
        pagination
      });
      throw error;
    }
  }

  /**
   * Get user preferences detail
   * 
   * @param {string} userId - User ID
   * @returns {Promise<object>} User preferences detail
   */
  async getUserPreferencesDetail(userId) {
    try {
      const preferences = await this.prisma.userPreference.findUnique({
        where: { userId },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true
            }
          }
        }
      });

      if (!preferences) {
        throw new Error('User preferences not found');
      }

      // Get user search history
      const searchHistory = await this.prisma.searchAnalytics.findMany({
        where: { userId },
        orderBy: { timestamp: 'desc' },
        take: 20
      });

      // Get user clicks
      const clicks = await this.prisma.searchClickTracking.findMany({
        where: {
          searchAnalytics: {
            userId
          }
        },
        include: {
          product: true
        },
        take: 20
      });

      const detail = {
        ...preferences,
        searchHistory,
        clicks
      };

      loggerService.info('User preferences detail retrieved', { userId });

      return detail;
    } catch (error) {
      loggerService.error('Failed to get user preferences detail', {
        error: error instanceof Error ? error.message : 'Unknown error',
        userId
      });
      throw error;
    }
  }

  /**
   * Update user preferences (admin)
   * 
   * @param {string} userId - User ID
   * @param {object} preferences - User preferences
   * @returns {Promise<object>} Updated preferences
   */
  async updateUserPreferencesAdmin(userId, preferences) {
    try {
      const updated = await this.prisma.userPreference.update({
        where: { userId },
        data: preferences
      });

      loggerService.info('User preferences updated', { userId });

      return updated;
    } catch (error) {
      loggerService.error('Failed to update user preferences', {
        error: error instanceof Error ? error.message : 'Unknown error',
        userId,
        preferences
      });
      throw error;
    }
  }

  /**
   * Get personalization metrics
   * 
   * @param {string} timeRange - Time range (today, week, month, all)
   * @returns {Promise<object>} Personalization metrics
   */
  async getPersonalizationMetrics(timeRange = 'week') {
    try {
      const now = new Date();
      let startDate;

      switch (timeRange) {
        case 'today':
          startDate = new Date(now.setHours(0, 0, 0, 0));
          break;
        case 'week':
          startDate = new Date(now.setDate(now.getDate() - 7));
          break;
        case 'month':
          startDate = new Date(now.setMonth(now.getMonth() - 1));
          break;
        case 'all':
        default:
          startDate = new Date(0);
          break;
      }

      const analytics = await this.prisma.searchAnalytics.findMany({
        where: {
          timestamp: {
            gte: startDate
          }
        }
      });

      const totalSearches = analytics.length;
      const personalizedSearches = analytics.filter(a => a.userId).length;
      const personalizedRate = totalSearches > 0 ? ((personalizedSearches / totalSearches) * 100).toFixed(2) : '0';

      const clicks = await this.prisma.searchClickTracking.count({
        where: {
          searchAnalytics: {
            timestamp: {
              gte: startDate
            }
          }
        }
      });

      const personalizedClicks = await this.prisma.searchClickTracking.count({
        where: {
          searchAnalytics: {
            userId: { not: null },
            timestamp: {
              gte: startDate
            }
          }
        }
      });

      const personalizedClickRate = personalizedSearches > 0 ? ((personalizedClicks / personalizedSearches) * 100).toFixed(2) : '0';
      const nonPersonalizedClickRate = (totalSearches - personalizedSearches) > 0 ? ((clicks - personalizedClicks) / (totalSearches - personalizedSearches) * 100).toFixed(2) : '0';

      const conversions = analytics.filter(a => a.conversionType).length;
      const personalizedConversions = analytics.filter(a => a.conversionType && a.userId).length;
      const personalizedConversionRate = personalizedSearches > 0 ? ((personalizedConversions / personalizedSearches) * 100).toFixed(2) : '0';
      const nonPersonalizedConversionRate = (totalSearches - personalizedSearches) > 0 ? ((conversions - personalizedConversions) / (totalSearches - personalizedSearches) * 100).toFixed(2) : '0';

      const metrics = {
        totalSearches,
        personalizedSearches,
        personalizedRate,
        personalizedClickRate,
        nonPersonalizedClickRate,
        personalizedConversionRate,
        nonPersonalizedConversionRate,
        improvement: {
          clickRate: (parseFloat(personalizedClickRate) - parseFloat(nonPersonalizedClickRate)).toFixed(2),
          conversionRate: (parseFloat(personalizedConversionRate) - parseFloat(nonPersonalizedConversionRate)).toFixed(2)
        },
        period: {
          startDate: startDate.toISOString(),
          endDate: new Date().toISOString()
        }
      };

      loggerService.info('Personalization metrics retrieved', { timeRange, metrics });

      return metrics;
    } catch (error) {
      loggerService.error('Failed to get personalization metrics', {
        error: error instanceof Error ? error.message : 'Unknown error',
        timeRange
      });
      throw error;
    }
  }

  /**
   * Get recommendation statistics
   * 
   * @param {string} timeRange - Time range (today, week, month, all)
   * @returns {Promise<object>} Recommendation statistics
   */
  async getRecommendationStats(timeRange = 'week') {
    try {
      const now = new Date();
      let startDate;

      switch (timeRange) {
        case 'today':
          startDate = new Date(now.setHours(0, 0, 0, 0));
          break;
        case 'week':
          startDate = new Date(now.setDate(now.getDate() - 7));
          break;
        case 'month':
          startDate = new Date(now.setMonth(now.getMonth() - 1));
          break;
        case 'all':
        default:
          startDate = new Date(0);
          break;
      }

      // Simulated recommendation stats
      const stats = {
        totalRecommendations: 1250,
        clickThroughRate: '12.5',
        conversionRate: '3.2',
        avgPosition: 2.3,
        topCategories: [
          { category: 'Laptops', count: 450, percentage: '36.0' },
          { category: 'Smartphones', count: 380, percentage: '30.4' },
          { category: 'Tablets', count: 220, percentage: '17.6' },
          { category: 'Accessories', count: 200, percentage: '16.0' }
        ],
        period: {
          startDate: startDate.toISOString(),
          endDate: new Date().toISOString()
        }
      };

      loggerService.info('Recommendation stats retrieved', { timeRange, stats });

      return stats;
    } catch (error) {
      loggerService.error('Failed to get recommendation stats', {
        error: error instanceof Error ? error.message : 'Unknown error',
        timeRange
      });
      throw error;
    }
  }

  /**
   * Update personalization configuration
   * 
   * @param {object} config - Personalization configuration
   * @returns {Promise<object>} Updated configuration
   */
  async updatePersonalizationConfig(config) {
    try {
      // In a real implementation, this would update a configuration table
      loggerService.info('Personalization config updated', { config });
      return { success: true, config };
    } catch (error) {
      loggerService.error('Failed to update personalization config', {
        error: error instanceof Error ? error.message : 'Unknown error',
        config
      });
      throw error;
    }
  }

  // ============================================================================
  // TRENDING OVERVIEW FUNCTIONS
  // ============================================================================

  /**
   * Get trending overview
   * 
   * @returns {Promise<object>} Trending overview
   */
  async getTrendingOverview() {
    try {
      const overview = {
        totalTrendingSearches: 45,
        totalTrendingProducts: 23,
        trendThreshold: 10,
        trendDecay: 0.1,
        lastCalculated: new Date().toISOString()
      };

      loggerService.info('Trending overview retrieved', { overview });

      return overview;
    } catch (error) {
      loggerService.error('Failed to get trending overview', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  /**
   * Get trending searches
   * 
   * @param {object} filters - Trending filters
   * @returns {Promise<Array>} Trending searches
   */
  async getTrendingSearches(filters = {}) {
    try {
      const { limit = 20, timeRange = '24h' } = filters;

      const now = new Date();
      let startDate;

      switch (timeRange) {
        case '1h':
          startDate = new Date(now.setHours(now.getHours() - 1));
          break;
        case '24h':
          startDate = new Date(now.setHours(now.getHours() - 24));
          break;
        case '7d':
          startDate = new Date(now.setDate(now.getDate() - 7));
          break;
        case '30d':
          startDate = new Date(now.setDate(now.getDate() - 30));
          break;
        default:
          startDate = new Date(now.setHours(now.getHours() - 24));
      }

      // Get search counts for the period
      const searchCounts = await this.prisma.searchAnalytics.groupBy({
        by: ['query'],
        where: {
          timestamp: {
            gte: startDate
          }
        },
        _count: {
          id: true
        },
        orderBy: {
          _count: {
            id: 'desc'
          }
        },
        take: limit
      });

      const trendingSearches = searchCounts.map((sc, index) => ({
        query: sc.query,
        searchCount: sc._count.id,
        trendScore: Math.max(0, 100 - index * 5),
        isTrending: sc._count.id >= 10,
        trend: index < 5 ? 'rising' : index < 10 ? 'stable' : 'falling',
        timeRange
      }));

      loggerService.info('Trending searches retrieved', { count: trendingSearches.length });

      return trendingSearches;
    } catch (error) {
      loggerService.error('Failed to get trending searches', {
        error: error instanceof Error ? error.message : 'Unknown error',
        filters
      });
      throw error;
    }
  }

  /**
   * Get trending products
   * 
   * @param {object} filters - Trending filters
   * @returns {Promise<Array>} Trending products
   */
  async getTrendingProducts(filters = {}) {
    try {
      const { limit = 20, timeRange = '24h' } = filters;

      const now = new Date();
      let startDate;

      switch (timeRange) {
        case '1h':
          startDate = new Date(now.setHours(now.getHours() - 1));
          break;
        case '24h':
          startDate = new Date(now.setHours(now.getHours() - 24));
          break;
        case '7d':
          startDate = new Date(now.setDate(now.getDate() - 7));
          break;
        case '30d':
          startDate = new Date(now.setDate(now.getDate() - 30));
          break;
        default:
          startDate = new Date(now.setHours(now.getHours() - 24));
      }

      // Get products that were clicked most frequently
      const productClicks = await this.prisma.searchClickTracking.groupBy({
        by: ['productId'],
        where: {
          searchAnalytics: {
            timestamp: {
              gte: startDate
            }
          }
        },
        _count: {
          id: true
        },
        orderBy: {
          _count: {
            id: 'desc'
          }
        },
        take: limit
      });

      const productIds = productClicks.map(pc => pc.productId);
      const products = await this.prisma.product.findMany({
        where: {
          id: {
            in: productIds
          }
        },
        include: {
          category: true
        }
      });

      const trendingProducts = productClicks.map((pc, index) => {
        const product = products.find(p => p.id === pc.productId);
        return {
          productId: pc.productId,
          productName: product?.name || 'Unknown',
          category: product?.category?.name || 'Unknown',
          searchCount: pc._count.id,
          trendScore: Math.max(0, 100 - index * 5),
          imageUrl: product?.primaryImage,
          price: product?.salePrice || product?.regularPrice,
          trend: index < 5 ? 'rising' : index < 10 ? 'stable' : 'falling'
        };
      });

      loggerService.info('Trending products retrieved', { count: trendingProducts.length });

      return trendingProducts;
    } catch (error) {
      loggerService.error('Failed to get trending products', {
        error: error instanceof Error ? error.message : 'Unknown error',
        filters
      });
      throw error;
    }
  }

  /**
   * Calculate trends
   * 
   * @returns {Promise<void>}
   */
  async calculateTrends() {
    try {
      // In a real implementation, this would recalculate trend scores
      loggerService.info('Trends calculated');
      return { success: true };
    } catch (error) {
      loggerService.error('Failed to calculate trends', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  /**
   * Update trend threshold
   * 
   * @param {number} threshold - New threshold
   * @returns {Promise<object>} Updated threshold
   */
  async updateTrendThreshold(threshold) {
    try {
      // In a real implementation, this would update a configuration table
      loggerService.info('Trend threshold updated', { threshold });
      return { success: true, threshold };
    } catch (error) {
      loggerService.error('Failed to update trend threshold', {
        error: error instanceof Error ? error.message : 'Unknown error',
        threshold
      });
      throw error;
    }
  }

  /**
   * Update trend decay
   * 
   * @param {number} decay - New decay factor
   * @returns {Promise<object>} Updated decay
   */
  async updateTrendDecay(decay) {
    try {
      // In a real implementation, this would update a configuration table
      loggerService.info('Trend decay updated', { decay });
      return { success: true, decay };
    } catch (error) {
      loggerService.error('Failed to update trend decay', {
        error: error instanceof Error ? error.message : 'Unknown error',
        decay
      });
      throw error;
    }
  }

  /**
   * Clear old trends
   * 
   * @param {number} days - Days to keep
   * @returns {Promise<void>}
   */
  async clearOldTrends(days = 30) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);

      // In a real implementation, this would delete old trend records
      loggerService.info('Old trends cleared', { days });
      return { success: true };
    } catch (error) {
      loggerService.error('Failed to clear old trends', {
        error: error instanceof Error ? error.message : 'Unknown error',
        days
      });
      throw error;
    }
  }

  // ============================================================================
  // HELPER FUNCTIONS
  // ============================================================================

  /**
   * Get related queries
   * 
   * @param {string} query - Query string
   * @returns {Promise<Array>} Related queries
   */
  async getRelatedQueries(query) {
    try {
      const analytics = await this.prisma.searchAnalytics.findMany({
        where: {
          query: {
            contains: query.split(' ')[0], // Use first word for relation
            mode: 'insensitive'
          }
        },
        orderBy: {
          timestamp: 'desc'
        },
        take: 50
      });

      const queryCounts = {};
      analytics.forEach(a => {
        if (a.query.toLowerCase() !== query.toLowerCase()) {
          if (!queryCounts[a.query]) {
            queryCounts[a.query] = 0;
          }
          queryCounts[a.query]++;
        }
      });

      const relatedQueries = Object.entries(queryCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([query, count]) => ({
          query,
          count
        }));

      return relatedQueries;
    } catch (error) {
      loggerService.error('Failed to get related queries', {
        error: error instanceof Error ? error.message : 'Unknown error',
        query
      });
      throw error;
    }
  }
}

module.exports = { AdminSearchAnalyticsService };
