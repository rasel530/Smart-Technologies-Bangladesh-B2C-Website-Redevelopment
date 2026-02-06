/**
 * Search Analytics Service
 * 
 * This service handles tracking search terms, user behavior, clicks, conversions,
 * and storing search history for analysis.
 */

const { PrismaClient } = require('@prisma/client');
const { loggerService } = require('./logger');

class SearchAnalyticsService {
  constructor(prisma = null) {
    this.prisma = prisma || new PrismaClient();
  }

  /**
   * Track a search event with metadata
   * 
   * @param {string} userId - User ID (optional for anonymous searches)
   * @param {string} sessionId - Session ID for tracking
   * @param {string} query - Search query text
   * @param {number} resultsCount - Number of results returned
   * @param {number} responseTime - Response time in milliseconds
   * @param {object} filters - Applied filters
   * @param {string} sortBy - Sort order
   * @param {object} deviceInfo - Device information
   * @returns {Promise<object>} Created search analytics record
   */
  async trackSearch(userId, sessionId, query, resultsCount, responseTime, filters = {}, sortBy = null, deviceInfo = {}) {
    try {
      const { ipAddress, userAgent, deviceType } = deviceInfo;

      const searchAnalytics = await this.prisma.searchAnalytics.create({
        data: {
          userId: userId || null,
          sessionId,
          query,
          resultsCount,
          responseTime,
          filtersApplied: filters,
          sortBy,
          ipAddress,
          userAgent,
          deviceType
        }
      });

      loggerService.info('Search tracked successfully', {
        searchAnalyticsId: searchAnalytics.id,
        query,
        resultsCount,
        userId: userId || 'anonymous'
      });

      return searchAnalytics;
    } catch (error) {
      loggerService.error('Failed to track search', {
        error: error instanceof Error ? error.message : 'Unknown error',
        query,
        userId
      });
      throw error;
    }
  }

  /**
   * Track a click on a search result
   * 
   * @param {string} searchAnalyticsId - ID of the search analytics record
   * @param {string} productId - ID of the clicked product
   * @param {number} position - Position of the result (1-based)
   * @returns {Promise<object>} Created click tracking record
   */
  async trackClick(searchAnalyticsId, productId, position) {
    try {
      const clickTracking = await this.prisma.searchClickTracking.create({
        data: {
          searchAnalyticsId,
          productId,
          position
        }
      });

      // Update clicked results in search analytics
      await this.prisma.searchAnalytics.update({
        where: { id: searchAnalyticsId },
        data: {
          clickedResults: {
            push: { productId, position, clickedAt: new Date() }
          }
        }
      });

      loggerService.info('Search click tracked successfully', {
        clickTrackingId: clickTracking.id,
        searchAnalyticsId,
        productId,
        position
      });

      return clickTracking;
    } catch (error) {
      loggerService.error('Failed to track search click', {
        error: error instanceof Error ? error.message : 'Unknown error',
        searchAnalyticsId,
        productId
      });
      throw error;
    }
  }

  /**
   * Track a conversion from search
   * 
   * @param {string} searchAnalyticsId - ID of the search analytics record
   * @param {string} conversionType - Type of conversion (click, add_to_cart, purchase)
   * @param {string} productId - ID of the product (optional)
   * @returns {Promise<object>} Updated search analytics record
   */
  async trackConversion(searchAnalyticsId, conversionType, productId = null) {
    try {
      const searchAnalytics = await this.prisma.searchAnalytics.update({
        where: { id: searchAnalyticsId },
        data: {
          conversionType,
          productId
        }
      });

      loggerService.info('Search conversion tracked successfully', {
        searchAnalyticsId,
        conversionType,
        productId
      });

      return searchAnalytics;
    } catch (error) {
      loggerService.error('Failed to track search conversion', {
        error: error instanceof Error ? error.message : 'Unknown error',
        searchAnalyticsId,
        conversionType
      });
      throw error;
    }
  }

  /**
   * Get search history for a user
   * 
   * @param {string} userId - User ID
   * @param {number} limit - Maximum number of records to return
   * @returns {Promise<Array>} Array of search analytics records
   */
  async getSearchHistory(userId, limit = 20) {
    try {
      const searchHistory = await this.prisma.searchAnalytics.findMany({
        where: { userId },
        orderBy: { timestamp: 'desc' },
        take: limit,
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
        }
      });

      loggerService.info('Search history retrieved', {
        userId,
        count: searchHistory.length
      });

      return searchHistory;
    } catch (error) {
      loggerService.error('Failed to get search history', {
        error: error instanceof Error ? error.message : 'Unknown error',
        userId
      });
      throw error;
    }
  }

  /**
   * Get popular searches based on frequency
   * 
   * @param {number} limit - Maximum number of results to return
   * @param {string} timeRange - Time range for analysis (today, week, month, all)
   * @returns {Promise<Array>} Array of popular search queries
   */
  async getPopularSearches(limit = 10, timeRange = 'week') {
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

      const popularSearches = await this.prisma.searchAnalytics.groupBy({
        by: ['query'],
        where: {
          timestamp: {
            gte: startDate
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

      loggerService.info('Popular searches retrieved', {
        timeRange,
        count: popularSearches.length
      });

      return popularSearches.map(ps => ({
        query: ps.query,
        searchCount: ps._count.query
      }));
    } catch (error) {
      loggerService.error('Failed to get popular searches', {
        error: error instanceof Error ? error.message : 'Unknown error',
        timeRange
      });
      throw error;
    }
  }

  /**
   * Get analytics metrics for a time period
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
      const totalResults = analytics.reduce((sum, a) => sum + a.resultsCount, 0);
      const avgResponseTime = totalSearches > 0 
        ? analytics.reduce((sum, a) => sum + a.responseTime, 0) / totalSearches 
        : 0;
      const conversions = analytics.filter(a => a.conversionType).length;
      const conversionRate = totalSearches > 0 ? (conversions / totalSearches) * 100 : 0;
      const zeroResultSearches = analytics.filter(a => a.resultsCount === 0).length;
      const zeroResultRate = totalSearches > 0 ? (zeroResultSearches / totalSearches) : 0;
      const uniqueSearches = new Set(analytics.map(a => a.query)).size;
      
      // Calculate click-through rate
      const searchesWithClicks = analytics.filter(a => a.clickedResults && a.clickedResults.length > 0).length;
      const clickThroughRate = totalSearches > 0 ? (searchesWithClicks / totalSearches) : 0;
      
      // Calculate P95 response time
      const sortedResponseTimes = analytics.map(a => a.responseTime).sort((a, b) => a - b);
      const p95Index = Math.floor(sortedResponseTimes.length * 0.95);
      const p95ResponseTime = sortedResponseTimes.length > 0 ? sortedResponseTimes[p95Index] || 0 : 0;
      
      // Cache hit rate (placeholder - would need actual cache tracking)
      const cacheHitRate = 0.75; // Default value

      const metrics = {
        totalSearches,
        uniqueSearches,
        totalResults,
        avgResponseTime,
        conversions,
        conversionRate: conversionRate / 100, // Return as decimal
        zeroResultRate,
        clickThroughRate,
        p95ResponseTime,
        cacheHitRate
      };

      loggerService.info('Analytics metrics retrieved', {
        startDate,
        endDate,
        metrics
      });

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
   * Get search trends over time
   * 
   * @param {Date} startDate - Start date
   * @param {Date} endDate - End date
   * @param {string} granularity - Time granularity (hour, day, week, month)
   * @returns {Promise<Array>} Array of trend data points
   */
  async getSearchTrends(startDate, endDate, granularity = 'day') {
    try {
      const analytics = await this.prisma.searchAnalytics.findMany({
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

      // Group data by granularity
      const groupedData = {};
      
      analytics.forEach(search => {
        let key;
        const date = new Date(search.timestamp);
        
        switch (granularity) {
          case 'hour':
            key = date.toISOString().slice(0, 13) + ':00:00.000Z';
            break;
          case 'day':
            key = date.toISOString().slice(0, 10) + 'T00:00:00.000Z';
            break;
          case 'week':
            const weekStart = new Date(date);
            weekStart.setDate(date.getDate() - date.getDay());
            key = weekStart.toISOString().slice(0, 10) + 'T00:00:00.000Z';
            break;
          case 'month':
            key = date.toISOString().slice(0, 7) + '-01T00:00:00.000Z';
            break;
          default:
            key = date.toISOString().slice(0, 10) + 'T00:00:00.000Z';
        }
        
        if (!groupedData[key]) {
          groupedData[key] = {
            date: key,
            searchCount: 0,
            avgResponseTime: 0,
            zeroResults: 0
          };
        }
        
        groupedData[key].searchCount++;
        groupedData[key].avgResponseTime += search.responseTime;
        if (search.resultsCount === 0) {
          groupedData[key].zeroResults++;
        }
      });

      // Calculate averages and convert to array
      const trends = Object.values(groupedData).map(trend => ({
        date: trend.date,
        searchCount: trend.searchCount,
        avgResponseTime: trend.searchCount > 0 ? trend.avgResponseTime / trend.searchCount : 0,
        zeroResults: trend.zeroResults
      }));

      loggerService.info('Search trends retrieved', {
        startDate,
        endDate,
        granularity,
        count: trends.length
      });

      return trends;
    } catch (error) {
      loggerService.error('Failed to get search trends', {
        error: error instanceof Error ? error.message : 'Unknown error',
        startDate,
        endDate,
        granularity
      });
      throw error;
    }
  }

  /**
   * Update dwell time for a click
   * 
   * @param {string} clickTrackingId - ID of the click tracking record
   * @param {number} dwellTime - Time spent on product page in milliseconds
   * @returns {Promise<object>} Updated click tracking record
   */
  async updateDwellTime(clickTrackingId, dwellTime) {
    try {
      const clickTracking = await this.prisma.searchClickTracking.update({
        where: { id: clickTrackingId },
        data: { dwellTime }
      });

      loggerService.info('Dwell time updated', {
        clickTrackingId,
        dwellTime
      });

      return clickTracking;
    } catch (error) {
      loggerService.error('Failed to update dwell time', {
        error: error instanceof Error ? error.message : 'Unknown error',
        clickTrackingId
      });
      throw error;
    }
  }

  /**
   * Get search analytics by session
   * 
   * @param {string} sessionId - Session ID
   * @returns {Promise<Array>} Array of search analytics records for the session
   */
  async getSearchBySession(sessionId) {
    try {
      const searchAnalytics = await this.prisma.searchAnalytics.findMany({
        where: { sessionId },
        orderBy: { timestamp: 'desc' },
        include: {
          clickTrackings: true
        }
      });

      loggerService.info('Session searches retrieved', {
        sessionId,
        count: searchAnalytics.length
      });

      return searchAnalytics;
    } catch (error) {
      loggerService.error('Failed to get session searches', {
        error: error instanceof Error ? error.message : 'Unknown error',
        sessionId
      });
      throw error;
    }
  }
}

module.exports = { SearchAnalyticsService };
