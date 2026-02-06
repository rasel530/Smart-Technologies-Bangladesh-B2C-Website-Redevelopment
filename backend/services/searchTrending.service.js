/**
 * Search Trending Service
 * 
 * This service tracks trending searches, calculates trend scores based on recency
 * and frequency, and updates trending status.
 */

const { PrismaClient } = require('@prisma/client');
const { loggerService } = require('./logger');

class SearchTrendingService {
  constructor(prisma = null) {
    this.prisma = prisma || new PrismaClient();
    this.trendDecayFactor = 0.1; // Decay factor for older searches
    this.trendThreshold = 10; // Minimum score to be considered trending
  }

  /**
   * Record a search for trending calculation
   * 
   * @param {string} query - Search query
   * @param {string} category - Category (optional)
   * @returns {Promise<object>} Updated trending record
   */
  async recordSearch(query, category = null) {
    try {
      const normalizedQuery = query.toLowerCase().trim();

      // Check if trending record exists
      let trending = await this.prisma.searchTrending.findUnique({
        where: { query: normalizedQuery }
      });

      if (trending) {
        // Update existing record
        trending = await this.prisma.searchTrending.update({
          where: { query: normalizedQuery },
          data: {
            searchCount: {
              increment: 1
            },
            lastSearchedAt: new Date(),
            category: category || trending.category
          }
        });
      } else {
        // Create new record
        trending = await this.prisma.searchTrending.create({
          data: {
            query: normalizedQuery,
            searchCount: 1,
            trendScore: 1.0,
            lastSearchedAt: new Date(),
            category,
            isTrending: false
          }
        });
      }

      loggerService.info('Search recorded for trending', {
        query: normalizedQuery,
        searchCount: trending.searchCount
      });

      return trending;
    } catch (error) {
      loggerService.error('Failed to record search for trending', {
        error: error instanceof Error ? error.message : 'Unknown error',
        query
      });
      throw error;
    }
  }

  /**
   * Calculate trend scores for all searches
   * 
   * @returns {Promise<Array>} Array of updated trending records
   */
  async calculateTrendScores() {
    try {
      const allTrending = await this.prisma.searchTrending.findMany();

      const now = new Date();
      const updatedRecords = [];

      for (const trending of allTrending) {
        // Calculate time decay factor
        const hoursSinceSearch = (now - new Date(trending.lastSearchedAt)) / (1000 * 60 * 60);
        const timeDecay = Math.exp(-this.trendDecayFactor * hoursSinceSearch);

        // Calculate trend score: frequency * time decay
        const trendScore = trending.searchCount * timeDecay;

        // Determine if trending
        const isTrending = trendScore >= this.trendThreshold;

        // Update record
        const updated = await this.prisma.searchTrending.update({
          where: { id: trending.id },
          data: {
            trendScore,
            isTrending
          }
        });

        updatedRecords.push(updated);
      }

      loggerService.info('Trend scores calculated', {
        totalRecords: updatedRecords.length,
        trendingCount: updatedRecords.filter(r => r.isTrending).length
      });

      return updatedRecords;
    } catch (error) {
      loggerService.error('Failed to calculate trend scores', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  /**
   * Get trending searches
   * 
   * @param {number} limit - Maximum number of results to return
   * @returns {Promise<Array>} Array of trending searches
   */
  async getTrendingSearches(limit = 20) {
    try {
      const trendingSearches = await this.prisma.searchTrending.findMany({
        where: {
          isTrending: true
        },
        orderBy: {
          trendScore: 'desc'
        },
        take: limit
      });

      loggerService.info('Trending searches retrieved', {
        count: trendingSearches.length
      });

      return trendingSearches.map(t => ({
        query: t.query,
        searchCount: t.searchCount,
        trendScore: t.trendScore,
        lastSearchedAt: t.lastSearchedAt,
        category: t.category
      }));
    } catch (error) {
      loggerService.error('Failed to get trending searches', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  /**
   * Get trending products
   * 
   * @param {number} limit - Maximum number of products to return
   * @param {string} category - Filter by category (optional)
   * @returns {Promise<Array>} Array of trending products
   */
  async getTrendingProducts(limit = 10, category = null) {
    try {
      // Get trending searches with category information
      const trendingSearches = await this.prisma.searchTrending.findMany({
        where: {
          isTrending: true,
          ...(category ? { category } : {})
        },
        orderBy: {
          trendScore: 'desc'
        },
        take: limit * 2 // Get more to filter by products
      });

      // Extract product IDs from trending searches
      const productIds = trendingSearches
        .filter(t => t.category)
        .map(t => t.category)
        .slice(0, limit);

      if (productIds.length === 0) {
        // Fallback: get most viewed products from analytics
        return await this.getMostViewedProducts(limit, category);
      }

      // Get products
      const products = await this.prisma.product.findMany({
        where: {
          id: { in: productIds },
          status: 'active',
          visibility: 'public'
        },
        take: limit,
        include: {
          brand: true,
          categories: true
        }
      });

      // Add trend score to products
      const productsWithTrend = products.map(p => {
        const trending = trendingSearches.find(t => t.category === p.id);
        return {
          ...p,
          trendScore: trending?.trendScore || 0,
          searchCount: trending?.searchCount || 0
        };
      });

      // Sort by trend score
      productsWithTrend.sort((a, b) => b.trendScore - a.trendScore);

      loggerService.info('Trending products retrieved', {
        count: productsWithTrend.length,
        category
      });

      return productsWithTrend;
    } catch (error) {
      loggerService.error('Failed to get trending products', {
        error: error instanceof Error ? error.message : 'Unknown error',
        category
      });
      throw error;
    }
  }

  /**
   * Get most viewed products from search analytics
   * 
   * @param {number} limit - Maximum number of products
   * @param {string} category - Filter by category (optional)
   * @returns {Promise<Array>} Array of most viewed products
   */
  async getMostViewedProducts(limit = 10, category = null) {
    try {
      const now = new Date();
      const weekAgo = new Date(now.setDate(now.getDate() - 7));

      // Get click tracking data
      const clickTrackings = await this.prisma.searchClickTracking.findMany({
        where: {
          clickedAt: {
            gte: weekAgo
          }
        },
        include: {
          product: {
            include: {
              brand: true,
              categories: true
            }
          }
        }
      });

      // Count clicks per product
      const productClicks = {};
      clickTrackings.forEach(ct => {
        if (!productClicks[ct.productId]) {
          productClicks[ct.productId] = {
            productId: ct.productId,
            product: ct.product,
            clickCount: 0,
            avgPosition: 0,
            avgDwellTime: 0
          };
        }
        productClicks[ct.productId].clickCount++;
        productClicks[ct.productId].avgPosition += ct.position;
        productClicks[ct.productId].avgDwellTime += ct.dwellTime;
      });

      // Calculate averages and filter by category
      let products = Object.values(productClicks).map(p => ({
        ...p.product,
        clickCount: p.clickCount,
        avgPosition: p.avgPosition / p.clickCount,
        avgDwellTime: p.avgDwellTime / p.clickCount,
        trendScore: p.clickCount // Use click count as trend score
      }));

      if (category) {
        products = products.filter(p => 
          p.categories.some(c => c.id === category)
        );
      }

      // Sort by click count and limit
      products.sort((a, b) => b.clickCount - a.clickCount);

      loggerService.info('Most viewed products retrieved', {
        count: Math.min(products.length, limit),
        category
      });

      return products.slice(0, limit);
    } catch (error) {
      loggerService.error('Failed to get most viewed products', {
        error: error instanceof Error ? error.message : 'Unknown error',
        category
      });
      throw error;
    }
  }

  /**
   * Get trending searches by category
   * 
   * @param {string} category - Category to filter by
   * @param {number} limit - Maximum number of results
   * @returns {Promise<Array>} Array of trending searches for category
   */
  async getTrendingByCategory(category, limit = 10) {
    try {
      const trendingSearches = await this.prisma.searchTrending.findMany({
        where: {
          isTrending: true,
          category
        },
        orderBy: {
          trendScore: 'desc'
        },
        take: limit
      });

      loggerService.info('Trending searches by category retrieved', {
        category,
        count: trendingSearches.length
      });

      return trendingSearches.map(t => ({
        query: t.query,
        searchCount: t.searchCount,
        trendScore: t.trendScore,
        lastSearchedAt: t.lastSearchedAt
      }));
    } catch (error) {
      loggerService.error('Failed to get trending searches by category', {
        error: error instanceof Error ? error.message : 'Unknown error',
        category
      });
      throw error;
    }
  }

  /**
   * Get rising searches (newly trending)
   * 
   * @param {number} limit - Maximum number of results
   * @returns {Promise<Array>} Array of rising searches
   */
  async getRisingSearches(limit = 10) {
    try {
      const now = new Date();
      const dayAgo = new Date(now.setDate(now.getDate() - 1));

      // Get searches that became trending in the last day
      const risingSearches = await this.prisma.searchTrending.findMany({
        where: {
          isTrending: true,
          lastSearchedAt: {
            gte: dayAgo
          }
        },
        orderBy: {
          trendScore: 'desc'
        },
        take: limit
      });

      loggerService.info('Rising searches retrieved', {
        count: risingSearches.length
      });

      return risingSearches.map(t => ({
        query: t.query,
        searchCount: t.searchCount,
        trendScore: t.trendScore,
        lastSearchedAt: t.lastSearchedAt,
        category: t.category
      }));
    } catch (error) {
      loggerService.error('Failed to get rising searches', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  /**
   * Get trending statistics
   * 
   * @returns {Promise<object>} Trending statistics
   */
  async getTrendingStatistics() {
    try {
      const allTrending = await this.prisma.searchTrending.findMany();

      const stats = {
        totalSearches: allTrending.reduce((sum, t) => sum + t.searchCount, 0),
        uniqueQueries: allTrending.length,
        trendingCount: allTrending.filter(t => t.isTrending).length,
        avgTrendScore: this.calculateAverage(allTrending.map(t => t.trendScore)),
        maxTrendScore: Math.max(...allTrending.map(t => t.trendScore)),
        topTrending: allTrending
          .filter(t => t.isTrending)
          .sort((a, b) => b.trendScore - a.trendScore)
          .slice(0, 5)
          .map(t => ({
            query: t.query,
            searchCount: t.searchCount,
            trendScore: t.trendScore
          }))
      };

      loggerService.info('Trending statistics retrieved', stats);

      return stats;
    } catch (error) {
      loggerService.error('Failed to get trending statistics', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  /**
   * Clear old trending data
   * 
   * @param {number} daysToKeep - Number of days to keep data
   * @returns {Promise<number>} Number of records deleted
   */
  async clearOldTrendingData(daysToKeep = 30) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

      const result = await this.prisma.searchTrending.deleteMany({
        where: {
          lastSearchedAt: {
            lt: cutoffDate
          },
          isTrending: false
        }
      });

      loggerService.info('Old trending data cleared', {
        daysToKeep,
        recordsDeleted: result.count
      });

      return result.count;
    } catch (error) {
      loggerService.error('Failed to clear old trending data', {
        error: error instanceof Error ? error.message : 'Unknown error',
        daysToKeep
      });
      throw error;
    }
  }

  /**
   * Update trend threshold
   * 
   * @param {number} threshold - New trend threshold
   */
  updateTrendThreshold(threshold) {
    this.trendThreshold = threshold;
    loggerService.info('Trend threshold updated', { threshold });
  }

  /**
   * Update trend decay factor
   * 
   * @param {number} factor - New decay factor
   */
  updateTrendDecayFactor(factor) {
    this.trendDecayFactor = factor;
    loggerService.info('Trend decay factor updated', { factor });
  }

  /**
   * Calculate average of an array
   * 
   * @param {Array<number>} values - Array of numbers
   * @returns {number} Average
   */
  calculateAverage(values) {
    if (values.length === 0) return 0;
    return values.reduce((sum, val) => sum + val, 0) / values.length;
  }
}

module.exports = { SearchTrendingService };
