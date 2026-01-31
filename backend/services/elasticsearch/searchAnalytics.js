/**
 * Search Analytics Service
 * 
 * This service handles logging and analyzing search queries for insights
 * into user behavior and search performance.
 */

const { PrismaClient } = require('@prisma/client');
const { loggerService } = require('../logger');

class SearchAnalyticsService {
  constructor() {
    this.prisma = new PrismaClient();
  }

  /**
   * Log a search query
   * @param {string} query - Search query
   * @param {string|null} userId - User ID (optional)
   * @param {number} resultsCount - Number of results returned
   * @param {number} executionTime - Search execution time in milliseconds
   * @param {Object} filters - Applied filters
   * @returns {Promise<Object>} Log result
   */
  async logSearch(query, userId, resultsCount, executionTime, filters = {}) {
    try {
      // Create search log entry
      const searchLog = await this.prisma.searchLog.create({
        data: {
          query: query || '',
          userId: userId,
          resultsCount: resultsCount || 0,
          executionTime: executionTime || 0,
          filters: filters || {},
          ipAddress: null, // Can be added from request
          userAgent: null, // Can be added from request
          timestamp: new Date()
        }
      });

      loggerService.debug('Search query logged', {
        query,
        userId,
        resultsCount,
        executionTime
      });

      return {
        success: true,
        message: 'Search logged successfully',
        searchLog
      };

    } catch (error) {
      loggerService.error('Failed to log search', {
        error: error.message,
        query
      });

      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get top search queries
   * @param {Date} startDate - Start date
   * @param {Date} endDate - End date
   * @param {number} limit - Maximum number of results
   * @returns {Promise<Object>} Top queries result
   */
  async getTopQueries(startDate, endDate, limit = 10) {
    try {
      const topQueries = await this.prisma.searchLog.groupBy({
        by: ['query'],
        where: {
          timestamp: {
            gte: startDate,
            lte: endDate
          },
          query: {
            not: ''
          }
        },
        _count: {
          query: true
        },
        orderBy: {
          _count: {
            query: 'desc'
          }
        },
        take: limit
      });

      return {
        success: true,
        topQueries: topQueries.map(q => ({
          query: q.query,
          count: q._count.query
        }))
      };

    } catch (error) {
      loggerService.error('Failed to get top queries', {
        error: error.message
      });

      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get zero-result searches
   * @param {Date} startDate - Start date
   * @param {Date} endDate - End date
   * @param {number} limit - Maximum number of results
   * @returns {Promise<Object>} Zero-result searches
   */
  async getZeroResultSearches(startDate, endDate, limit = 10) {
    try {
      const zeroResultSearches = await this.prisma.searchLog.findMany({
        where: {
          timestamp: {
            gte: startDate,
            lte: endDate
          },
          resultsCount: 0,
          query: {
            not: ''
          }
        },
        select: {
          query: true,
          timestamp: true
        },
        orderBy: {
          timestamp: 'desc'
        },
        take: limit
      });

      return {
        success: true,
        zeroResultSearches
      };

    } catch (error) {
      loggerService.error('Failed to get zero-result searches', {
        error: error.message
      });

      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get average result count
   * @param {Date} startDate - Start date
   * @param {Date} endDate - End date
   * @returns {Promise<Object>} Average result count
   */
  async getAverageResultCount(startDate, endDate) {
    try {
      const result = await this.prisma.searchLog.aggregate({
        where: {
          timestamp: {
            gte: startDate,
            lte: endDate
          }
        },
        _avg: {
          resultsCount: true
        },
        _count: {
          id: true
        }
      });

      return {
        success: true,
        averageResultCount: result._avg.resultsCount || 0,
        totalSearches: result._count.id || 0
      };

    } catch (error) {
      loggerService.error('Failed to get average result count', {
        error: error.message
      });

      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get search volume over time
   * @param {Date} startDate - Start date
   * @param {Date} endDate - End date
   * @param {string} interval - Time interval (hour, day, week, month)
   * @returns {Promise<Object>} Search volume over time
   */
  async getSearchVolumeOverTime(startDate, endDate, interval = 'day') {
    try {
      // Get all search logs in the date range
      const searchLogs = await this.prisma.searchLog.findMany({
        where: {
          timestamp: {
            gte: startDate,
            lte: endDate
          }
        },
        select: {
          timestamp: true
        },
        orderBy: {
          timestamp: 'asc'
        }
      });

      // Group by interval
      const grouped = {};
      searchLogs.forEach(log => {
        const date = new Date(log.timestamp);
        let key;

        switch (interval) {
          case 'hour':
            key = date.toISOString().substring(0, 13) + ':00';
            break;
          case 'day':
            key = date.toISOString().substring(0, 10);
            break;
          case 'week':
            const weekStart = new Date(date);
            weekStart.setDate(date.getDate() - date.getDay());
            key = weekStart.toISOString().substring(0, 10);
            break;
          case 'month':
            key = date.toISOString().substring(0, 7);
            break;
          default:
            key = date.toISOString().substring(0, 10);
        }

        if (!grouped[key]) {
          grouped[key] = 0;
        }
        grouped[key]++;
      });

      // Convert to array
      const volumeOverTime = Object.entries(grouped).map(([date, count]) => ({
        date,
        count
      }));

      return {
        success: true,
        volumeOverTime
      };

    } catch (error) {
      loggerService.error('Failed to get search volume over time', {
        error: error.message
      });

      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get search analytics summary
   * @param {Date} startDate - Start date
   * @param {Date} endDate - End date
   * @returns {Promise<Object>} Analytics summary
   */
  async getAnalyticsSummary(startDate, endDate) {
    try {
      // Get top queries
      const topQueriesResult = await this.getTopQueries(startDate, endDate, 10);
      
      // Get zero-result searches
      const zeroResultResult = await this.getZeroResultSearches(startDate, endDate, 10);
      
      // Get average result count
      const avgResultResult = await this.getAverageResultCount(startDate, endDate);
      
      // Get search volume over time
      const volumeResult = await this.getSearchVolumeOverTime(startDate, endDate, 'day');

      // Get unique searches
      const uniqueSearches = await this.prisma.searchLog.groupBy({
        by: ['query'],
        where: {
          timestamp: {
            gte: startDate,
            lte: endDate
          },
          query: {
            not: ''
          }
        }
      });

      // Get searches with results vs without results
      const resultDistribution = await this.prisma.searchLog.groupBy({
        by: ['resultsCount'],
        where: {
          timestamp: {
            gte: startDate,
            lte: endDate
          }
        },
        _count: {
          id: true
        }
      });

      const withResults = resultDistribution
        .filter(r => r.resultsCount > 0)
        .reduce((sum, r) => sum + r._count.id, 0);
      
      const withoutResults = resultDistribution
        .filter(r => r.resultsCount === 0)
        .reduce((sum, r) => sum + r._count.id, 0);

      // Get average execution time
      const avgExecutionTime = await this.prisma.searchLog.aggregate({
        where: {
          timestamp: {
            gte: startDate,
            lte: endDate
          }
        },
        _avg: {
          executionTime: true
        }
      });

      return {
        success: true,
        summary: {
          period: {
            startDate,
            endDate
          },
          totalSearches: avgResultResult.totalSearches,
          uniqueSearches: uniqueSearches.length,
          averageResultCount: avgResultResult.averageResultCount,
          averageExecutionTime: avgExecutionTime._avg.executionTime || 0,
          searchesWithResults: withResults,
          searchesWithoutResults: withoutResults,
          topQueries: topQueriesResult.topQueries,
          zeroResultSearches: zeroResultResult.zeroResultSearches,
          volumeOverTime: volumeResult.volumeOverTime
        }
      };

    } catch (error) {
      loggerService.error('Failed to get analytics summary', {
        error: error.message
      });

      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get search trends
   * @param {number} days - Number of days to analyze
   * @returns {Promise<Object>} Search trends
   */
  async getSearchTrends(days = 7) {
    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const summary = await this.getAnalyticsSummary(startDate, endDate);

      return {
        success: true,
        trends: summary.summary
      };

    } catch (error) {
      loggerService.error('Failed to get search trends', {
        error: error.message
      });

      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Clean up old search logs
   * @param {number} daysToKeep - Number of days to keep
   * @returns {Promise<Object>} Cleanup result
   */
  async cleanupOldLogs(daysToKeep = 90) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

      const result = await this.prisma.searchLog.deleteMany({
        where: {
          timestamp: {
            lt: cutoffDate
          }
        }
      });

      loggerService.info('Old search logs cleaned up', {
        daysToKeep,
        deletedCount: result.count
      });

      return {
        success: true,
        message: 'Old logs cleaned up successfully',
        deletedCount: result.count
      };

    } catch (error) {
      loggerService.error('Failed to clean up old logs', {
        error: error.message
      });

      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get search logs for a specific user
   * @param {string} userId - User ID
   * @param {number} limit - Maximum number of results
   * @returns {Promise<Object>} User search logs
   */
  async getUserSearchHistory(userId, limit = 20) {
    try {
      const searchLogs = await this.prisma.searchLog.findMany({
        where: {
          userId: userId,
          query: {
            not: ''
          }
        },
        select: {
          query: true,
          resultsCount: true,
          timestamp: true
        },
        orderBy: {
          timestamp: 'desc'
        },
        take: limit
      });

      return {
        success: true,
        searchLogs
      };

    } catch (error) {
      loggerService.error('Failed to get user search history', {
        error: error.message,
        userId
      });

      return {
        success: false,
        error: error.message
      };
    }
  }
}

// Singleton instance
const searchAnalyticsService = new SearchAnalyticsService();

module.exports = {
  SearchAnalyticsService,
  searchAnalyticsService
};
