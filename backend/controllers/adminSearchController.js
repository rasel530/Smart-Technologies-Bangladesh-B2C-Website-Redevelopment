/**
 * Admin Search Controller
 * 
 * This module provides admin-only controller functions for search analytics
 * including search analytics data, popular searches, and performance metrics.
 */

const { PrismaClient } = require('@prisma/client');
const { loggerService } = require('../services/logger');

/**
 * Admin Search Controller class
 */
class AdminSearchController {
  constructor(searchService) {
    this.searchService = searchService;
    this.prisma = new PrismaClient();
  }

  /**
   * Get search analytics data
   * GET /api/admin/search/analytics
   */
  getSearchAnalytics = async (req, res, next) => {
    const startTime = Date.now();

    try {
      // Extract query parameters
      const { startDate, endDate, groupBy } = req.query;

      // Default to last 30 days if not provided
      const defaultStartDate = new Date();
      defaultStartDate.setDate(defaultStartDate.getDate() - 30);

      const searchStartDate = startDate ? new Date(startDate) : defaultStartDate;
      const searchEndDate = endDate ? new Date(endDate) : new Date();

      // Validate dates
      if (isNaN(searchStartDate.getTime()) || isNaN(searchEndDate.getTime())) {
        return res.status(400).json({
          error: 'Validation failed',
          message: 'Invalid date format'
        });
      }

      if (searchStartDate > searchEndDate) {
        return res.status(400).json({
          error: 'Validation failed',
          message: 'Start date must be before end date'
        });
      }

      // Log request
      loggerService.info('Admin search analytics request', {
        userId: req.user?.id,
        startDate: searchStartDate,
        endDate: searchEndDate,
        groupBy
      });

      // Get analytics data from search logs
      const searchLogs = await this.prisma.searchLog.findMany({
        where: {
          timestamp: {
            gte: searchStartDate,
            lte: searchEndDate
          }
        },
        orderBy: {
          timestamp: 'desc'
        },
        take: 10000 // Limit to prevent large result sets
      });

      // Calculate analytics
      const analytics = this.calculateAnalytics(searchLogs, groupBy);

      // Send response
      res.json({
        analytics,
        period: {
          startDate: searchStartDate,
          endDate: searchEndDate
        },
        totalSearches: searchLogs.length,
        executionTime: Date.now() - startTime
      });

      loggerService.info('Admin search analytics completed', {
        userId: req.user?.id,
        totalSearches: searchLogs.length,
        executionTime: Date.now() - startTime
      });

    } catch (error) {
      const executionTime = Date.now() - startTime;

      loggerService.error('Admin search analytics failed', {
        error: error.message || 'Unknown error',
        userId: req.user?.id,
        executionTime
      });

      // Send error response
      res.status(500).json({
        error: 'Failed to get search analytics',
        message: error.message || 'Internal server error',
        executionTime
      });

      next(error);
    }
  };

  /**
   * Get popular searches for admin
   * GET /api/admin/search/popular
   */
  getPopularSearches = async (req, res, next) => {
    const startTime = Date.now();

    try {
      // Extract query parameters
      const { limit, period, startDate, endDate } = req.query;

      // Parse limit (default: 50, max: 200)
      const parsedLimit = limit ? Math.min(parseInt(limit), 200) : 50;

      // Parse period
      const parsedPeriod = period || 'all';

      // Calculate date range based on period
      let dateFilter = {};
      if (parsedPeriod === 'today') {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        dateFilter = { gte: today };
      } else if (parsedPeriod === 'week') {
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        dateFilter = { gte: weekAgo };
      } else if (parsedPeriod === 'month') {
        const monthAgo = new Date();
        monthAgo.setDate(monthAgo.getDate() - 30);
        dateFilter = { gte: monthAgo };
      } else if (startDate && endDate) {
        dateFilter = {
          gte: new Date(startDate),
          lte: new Date(endDate)
        };
      }

      // Log request
      loggerService.info('Admin popular searches request', {
        userId: req.user?.id,
        limit: parsedLimit,
        period: parsedPeriod
      });

      // Get popular searches from search logs
      const popularSearches = await this.prisma.searchLog.groupBy({
        by: ['query'],
        where: Object.keys(dateFilter).length > 0 ? {
          timestamp: dateFilter
        } : undefined,
        _count: {
          query: true
        },
        orderBy: {
          _count: {
            query: 'desc'
          }
        },
        take: parsedLimit
      });

      // Transform results
      const results = popularSearches.map(ps => ({
        query: ps.query,
        count: ps._count.query,
        lastSearchedAt: this.getLastSearchTime(ps.query)
      }));

      // Send response
      res.json({
        searches: results,
        count: results.length,
        period: parsedPeriod,
        executionTime: Date.now() - startTime
      });

      loggerService.info('Admin popular searches completed', {
        userId: req.user?.id,
        count: results.length,
        executionTime: Date.now() - startTime
      });

    } catch (error) {
      const executionTime = Date.now() - startTime;

      loggerService.error('Admin popular searches failed', {
        error: error.message || 'Unknown error',
        userId: req.user?.id,
        executionTime
      });

      // Send error response
      res.status(500).json({
        error: 'Failed to get popular searches',
        message: error.message || 'Internal server error',
        executionTime
      });

      next(error);
    }
  };

  /**
   * Get search performance metrics
   * GET /api/admin/search/performance
   */
  getSearchPerformance = async (req, res, next) => {
    const startTime = Date.now();

    try {
      // Extract query parameters
      const { startDate, endDate } = req.query;

      // Default to last 30 days if not provided
      const defaultStartDate = new Date();
      defaultStartDate.setDate(defaultStartDate.getDate() - 30);

      const searchStartDate = startDate ? new Date(startDate) : defaultStartDate;
      const searchEndDate = endDate ? new Date(endDate) : new Date();

      // Validate dates
      if (isNaN(searchStartDate.getTime()) || isNaN(searchEndDate.getTime())) {
        return res.status(400).json({
          error: 'Validation failed',
          message: 'Invalid date format'
        });
      }

      // Log request
      loggerService.info('Admin search performance request', {
        userId: req.user?.id,
        startDate: searchStartDate,
        endDate: searchEndDate
      });

      // Get search logs for performance metrics
      const searchLogs = await this.prisma.searchLog.findMany({
        where: {
          timestamp: {
            gte: searchStartDate,
            lte: searchEndDate
          }
        },
        select: {
          query: true,
          resultsCount: true,
          executionTime: true,
          timestamp: true,
          filters: true
        },
        orderBy: {
          timestamp: 'desc'
        }
      });

      // Calculate performance metrics
      const performance = this.calculatePerformanceMetrics(searchLogs);

      // Send response
      res.json({
        performance,
        period: {
          startDate: searchStartDate,
          endDate: searchEndDate
        },
        totalSearches: searchLogs.length,
        executionTime: Date.now() - startTime
      });

      loggerService.info('Admin search performance completed', {
        userId: req.user?.id,
        totalSearches: searchLogs.length,
        executionTime: Date.now() - startTime
      });

    } catch (error) {
      const executionTime = Date.now() - startTime;

      loggerService.error('Admin search performance failed', {
        error: error.message || 'Unknown error',
        userId: req.user?.id,
        executionTime
      });

      // Send error response
      res.status(500).json({
        error: 'Failed to get search performance',
        message: error.message || 'Internal server error',
        executionTime
      });

      next(error);
    }
  };

  /**
   * Calculate analytics from search logs
   * @param {Array} searchLogs - Search log entries
   * @param {string} groupBy - Grouping option (day, week, month)
   * @returns {Object} Analytics data
   */
  calculateAnalytics(searchLogs, groupBy) {
    // Basic statistics
    const totalSearches = searchLogs.length;
    const uniqueQueries = new Set(searchLogs.map(log => log.query.toLowerCase())).size;
    const searchesWithResults = searchLogs.filter(log => log.resultsCount > 0).length;
    const searchesWithoutResults = totalSearches - searchesWithResults;

    // Average execution time
    const avgExecutionTime = totalSearches > 0
      ? searchLogs.reduce((sum, log) => sum + (log.executionTime || 0), 0) / totalSearches
      : 0;

    // Median execution time
    const sortedExecutionTimes = searchLogs
      .map(log => log.executionTime || 0)
      .sort((a, b) => a - b);
    const medianExecutionTime = sortedExecutionTimes.length > 0
      ? sortedExecutionTimes[Math.floor(sortedExecutionTimes.length / 2)]
      : 0;

    // Top queries
    const queryCounts = {};
    searchLogs.forEach(log => {
      const query = log.query.toLowerCase();
      queryCounts[query] = (queryCounts[query] || 0) + 1;
    });
    const topQueries = Object.entries(queryCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([query, count]) => ({ query, count }));

    // Searches per day/week/month based on groupBy
    let timeSeries = [];
    if (groupBy === 'day') {
      timeSeries = this.getTimeSeries(searchLogs, 'day');
    } else if (groupBy === 'week') {
      timeSeries = this.getTimeSeries(searchLogs, 'week');
    } else if (groupBy === 'month') {
      timeSeries = this.getTimeSeries(searchLogs, 'month');
    }

    return {
      totalSearches,
      uniqueQueries,
      searchesWithResults,
      searchesWithoutResults,
      resultsRate: totalSearches > 0 ? (searchesWithResults / totalSearches * 100).toFixed(2) : 0,
      avgExecutionTime: avgExecutionTime.toFixed(2),
      medianExecutionTime: medianExecutionTime.toFixed(2),
      topQueries,
      timeSeries
    };
  }

  /**
   * Get time series data
   * @param {Array} searchLogs - Search log entries
   * @param {string} granularity - Time granularity (day, week, month)
   * @returns {Array} Time series data
   */
  getTimeSeries(searchLogs, granularity) {
    const timeMap = {};

    searchLogs.forEach(log => {
      const date = new Date(log.timestamp);
      let key;

      if (granularity === 'day') {
        key = date.toISOString().split('T')[0]; // YYYY-MM-DD
      } else if (granularity === 'week') {
        const weekNumber = this.getWeekNumber(date);
        key = `${date.getFullYear()}-W${weekNumber}`;
      } else if (granularity === 'month') {
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      }

      timeMap[key] = (timeMap[key] || 0) + 1;
    });

    return Object.entries(timeMap)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }

  /**
   * Get week number from date
   * @param {Date} date - Date object
   * @returns {number} Week number
   */
  getWeekNumber(date) {
    const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
    const pastDaysOfYear = (date - firstDayOfYear) / 86400000;
    return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
  }

  /**
   * Get last search time for a query
   * @param {string} query - Search query
   * @returns {Date} Last search timestamp
   */
  async getLastSearchTime(query) {
    const lastSearch = await this.prisma.searchLog.findFirst({
      where: { query },
      orderBy: { timestamp: 'desc' },
      select: { timestamp: true }
    });
    return lastSearch?.timestamp;
  }

  /**
   * Calculate performance metrics from search logs
   * @param {Array} searchLogs - Search log entries
   * @returns {Object} Performance metrics
   */
  calculatePerformanceMetrics(searchLogs) {
    const totalSearches = searchLogs.length;

    if (totalSearches === 0) {
      return {
        totalSearches: 0,
        avgExecutionTime: 0,
        medianExecutionTime: 0,
        p95ExecutionTime: 0,
        p99ExecutionTime: 0,
        maxExecutionTime: 0,
        minExecutionTime: 0,
        avgResultsCount: 0,
        zeroResultsRate: 0,
        slowQueries: 0,
        fastQueries: 0
      };
    }

    // Execution time metrics
    const executionTimes = searchLogs.map(log => log.executionTime || 0).sort((a, b) => a - b);
    const avgExecutionTime = executionTimes.reduce((sum, time) => sum + time, 0) / totalSearches;
    const medianExecutionTime = executionTimes[Math.floor(executionTimes.length / 2)];
    const p95ExecutionTime = executionTimes[Math.floor(executionTimes.length * 0.95)];
    const p99ExecutionTime = executionTimes[Math.floor(executionTimes.length * 0.99)];
    const maxExecutionTime = executionTimes[executionTimes.length - 1];
    const minExecutionTime = executionTimes[0];

    // Results count metrics
    const resultsCounts = searchLogs.map(log => log.resultsCount || 0);
    const avgResultsCount = resultsCounts.reduce((sum, count) => sum + count, 0) / totalSearches;
    const zeroResultsCount = resultsCounts.filter(count => count === 0).length;
    const zeroResultsRate = (zeroResultsCount / totalSearches * 100).toFixed(2);

    // Slow and fast queries (thresholds: slow > 500ms, fast < 100ms)
    const slowQueries = executionTimes.filter(time => time > 500).length;
    const fastQueries = executionTimes.filter(time => time < 100).length;

    return {
      totalSearches,
      avgExecutionTime: avgExecutionTime.toFixed(2),
      medianExecutionTime: medianExecutionTime.toFixed(2),
      p95ExecutionTime: p95ExecutionTime.toFixed(2),
      p99ExecutionTime: p99ExecutionTime.toFixed(2),
      maxExecutionTime: maxExecutionTime.toFixed(2),
      minExecutionTime: minExecutionTime.toFixed(2),
      avgResultsCount: avgResultsCount.toFixed(2),
      zeroResultsRate: zeroResultsRate,
      slowQueries,
      fastQueries,
      slowQueryRate: ((slowQueries / totalSearches) * 100).toFixed(2),
      fastQueryRate: ((fastQueries / totalSearches) * 100).toFixed(2)
    };
  }
}

module.exports = AdminSearchController;
