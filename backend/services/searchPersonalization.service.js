/**
 * Search Personalization Service
 * 
 * This service manages user preference profiles, personalized search results,
 * behavior-based search suggestions, and recommendation engine foundation.
 */

const { PrismaClient } = require('@prisma/client');
const { loggerService } = require('./logger');

class SearchPersonalizationService {
  constructor(prisma = null, elasticsearchClient = null) {
    this.prisma = prisma || new PrismaClient();
    this.elasticsearchClient = elasticsearchClient;
  }

  /**
   * Update user search preferences
   * 
   * @param {string} userId - User ID
   * @param {object} preferences - User preferences to update
   * @returns {Promise<object>} Updated user preferences
   */
  async updateUserPreferences(userId, preferences) {
    try {
      const existingPreferences = await this.prisma.userSearchPreferences.findUnique({
        where: { userId }
      });

      let updatedPreferences;

      if (existingPreferences) {
        // Merge existing preferences with new preferences
        updatedPreferences = await this.prisma.userSearchPreferences.update({
          where: { userId },
          data: {
            preferredCategories: preferences.preferredCategories !== undefined 
              ? preferences.preferredCategories 
              : existingPreferences.preferredCategories,
            preferredBrands: preferences.preferredBrands !== undefined 
              ? preferences.preferredBrands 
              : existingPreferences.preferredBrands,
            priceRangeMin: preferences.priceRangeMin !== undefined 
              ? preferences.priceRangeMin 
              : existingPreferences.priceRangeMin,
            priceRangeMax: preferences.priceRangeMax !== undefined 
              ? preferences.priceRangeMax 
              : existingPreferences.priceRangeMax
            // lastUpdated field removed - doesn't exist in database schema
          }
        });
      } else {
        // Create new preferences
        updatedPreferences = await this.prisma.userSearchPreferences.create({
          data: {
            userId,
            preferredCategories: preferences.preferredCategories || [],
            preferredBrands: preferences.preferredBrands || [],
            priceRangeMin: preferences.priceRangeMin,
            priceRangeMax: preferences.priceRangeMax,
            searchHistory: []
            // lastUpdated field removed - doesn't exist in database schema
          }
        });
      }

      loggerService.info('User preferences updated', {
        userId,
        preferences
      });

      return updatedPreferences;
    } catch (error) {
      loggerService.error('Failed to update user preferences', {
        error: error instanceof Error ? error.message : 'Unknown error',
        userId
      });
      throw error;
    }
  }

  /**
   * Get user search preferences
   * 
   * @param {string} userId - User ID
   * @returns {Promise<object>} User preferences
   */
  async getUserPreferences(userId) {
    try {
      const preferences = await this.prisma.userSearchPreferences.findUnique({
        where: { userId }
      });

      if (!preferences) {
        // Return default preferences
        return {
          userId,
          preferredCategories: [],
          preferredBrands: [],
          priceRangeMin: null,
          priceRangeMax: null,
          searchHistory: [],
          lastUpdated: new Date()
        };
      }

      loggerService.info('User preferences retrieved', {
        userId
      });

      return preferences;
    } catch (error) {
      loggerService.error('Failed to get user preferences', {
        error: error instanceof Error ? error.message : 'Unknown error',
        userId
      });
      throw error;
    }
  }

  /**
   * Get personalized search results
   * 
   * @param {string} query - Search query
   * @param {string} userId - User ID
   * @returns {Promise<object>} Personalized search results
   */
  async getPersonalizedResults(query, userId) {
    try {
      // Get user preferences
      const preferences = await this.getUserPreferences(userId);

      // Build personalized filters based on preferences
      const personalizedFilters = {};
      
      if (preferences.preferredCategories && preferences.preferredCategories.length > 0) {
        personalizedFilters.categoryIds = preferences.preferredCategories;
      }
      
      if (preferences.preferredBrands && preferences.preferredBrands.length > 0) {
        personalizedFilters.brandIds = preferences.preferredBrands;
      }
      
      if (preferences.priceRangeMin !== null || preferences.priceRangeMax !== null) {
        personalizedFilters.priceRange = {
          min: preferences.priceRangeMin,
          max: preferences.priceRangeMax
        };
      }

      // Build Elasticsearch query with personalization
      const esQuery = this.buildPersonalizedQuery(query, preferences);

      // Execute search
      const indexName = this.buildIndexName('product');
      const response = await this.elasticsearchClient.search({
        index: indexName,
        body: esQuery
      });

      // Process results
      const results = this.processSearchResults(response);

      loggerService.info('Personalized search completed', {
        userId,
        query,
        totalResults: results.total
      });

      return {
        ...results,
        personalized: true,
        preferencesApplied: {
          categories: preferences.preferredCategories,
          brands: preferences.preferredBrands,
          priceRange: {
            min: preferences.priceRangeMin,
            max: preferences.priceRangeMax
          }
        }
      };
    } catch (error) {
      loggerService.error('Failed to get personalized results', {
        error: error instanceof Error ? error.message : 'Unknown error',
        query,
        userId
      });
      throw error;
    }
  }

  /**
   * Get personalized search suggestions
   * 
   * @param {string} userId - User ID
   * @param {number} limit - Maximum number of suggestions
   * @returns {Promise<Array>} Personalized suggestions
   */
  async getPersonalizedSuggestions(userId, limit = 10) {
    try {
      const preferences = await this.getUserPreferences(userId);
      const suggestions = [];

      // Get recent search history
      const recentSearches = await this.prisma.searchAnalytics.findMany({
        where: { userId },
        orderBy: { timestamp: 'desc' },
        take: 5,
        distinct: ['query']
      });

      recentSearches.forEach(search => {
        suggestions.push({
          type: 'recent_search',
          text: search.query,
          timestamp: search.timestamp
        });
      });

      // Get product recommendations
      const recommendations = await this.prisma.searchRecommendations.findMany({
        where: { 
          userId,
          clicked: false
        },
        orderBy: { score: 'desc' },
        take: limit - suggestions.length,
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
      });

      recommendations.forEach(rec => {
        suggestions.push({
          type: 'recommendation',
          productId: rec.productId,
          product: rec.product,
          reason: rec.reason,
          score: rec.score
        });
      });

      loggerService.info('Personalized suggestions retrieved', {
        userId,
        count: suggestions.length
      });

      return suggestions.slice(0, limit);
    } catch (error) {
      loggerService.error('Failed to get personalized suggestions', {
        error: error instanceof Error ? error.message : 'Unknown error',
        userId
      });
      throw error;
    }
  }

  /**
   * Generate recommendations for a user
   * 
   * @param {string} userId - User ID
   * @param {string} type - Recommendation type (trending, similar, personalized)
   * @returns {Promise<Array>} Generated recommendations
   */
  async generateRecommendations(userId, type = 'personalized') {
    try {
      const recommendations = [];
      const preferences = await this.getUserPreferences(userId);

      switch (type) {
        case 'trending':
          // Get trending products
          const trendingProducts = await this.getTrendingProducts(10);
          trendingProducts.forEach(product => {
            recommendations.push({
              userId,
              productId: product.id,
              recommendationType: 'trending',
              score: product.trendScore || 1.0,
              reason: 'Trending product'
            });
          });
          break;

        case 'similar':
          // Get products similar to user's preferred categories/brands
          const similarProducts = await this.getSimilarProducts(preferences, 10);
          similarProducts.forEach(product => {
            recommendations.push({
              userId,
              productId: product.id,
              recommendationType: 'similar',
              score: product.score || 1.0,
              reason: `Similar to your preferences`
            });
          });
          break;

        case 'personalized':
        default:
          // Generate personalized recommendations based on user behavior
          const personalizedProducts = await this.getPersonalizedProducts(userId, preferences, 10);
          personalizedProducts.forEach(product => {
            recommendations.push({
              userId,
              productId: product.id,
              recommendationType: 'personalized',
              score: product.score || 1.0,
              reason: product.reason || 'Based on your preferences'
            });
          });
          break;
      }

      // Save recommendations to database
      const savedRecommendations = await Promise.all(
        recommendations.map(rec => 
          this.prisma.searchRecommendations.create({
            data: rec
          })
        )
      );

      loggerService.info('Recommendations generated', {
        userId,
        type,
        count: savedRecommendations.length
      });

      return savedRecommendations;
    } catch (error) {
      loggerService.error('Failed to generate recommendations', {
        error: error instanceof Error ? error.message : 'Unknown error',
        userId,
        type
      });
      throw error;
    }
  }

  /**
   * Track a recommendation click
   * 
   * @param {string} userId - User ID
   * @param {string} productId - Product ID
   * @param {string} recommendationId - Recommendation ID
   * @returns {Promise<object>} Updated recommendation
   */
  async trackRecommendationClick(userId, productId, recommendationId) {
    try {
      const recommendation = await this.prisma.searchRecommendations.updateMany({
        where: {
          userId,
          productId,
          id: recommendationId
        },
        data: {
          clicked: true
        }
      });

      loggerService.info('Recommendation click tracked', {
        userId,
        productId,
        recommendationId
      });

      return recommendation;
    } catch (error) {
      loggerService.error('Failed to track recommendation click', {
        error: error instanceof Error ? error.message : 'Unknown error',
        userId,
        productId
      });
      throw error;
    }
  }

  /**
   * Track a recommendation conversion
   * 
   * @param {string} userId - User ID
   * @param {string} productId - Product ID
   * @returns {Promise<object>} Updated recommendation
   */
  async trackRecommendationConversion(userId, productId) {
    try {
      const recommendation = await this.prisma.searchRecommendations.updateMany({
        where: {
          userId,
          productId
        },
        data: {
          converted: true
        }
      });

      loggerService.info('Recommendation conversion tracked', {
        userId,
        productId
      });

      return recommendation;
    } catch (error) {
      loggerService.error('Failed to track recommendation conversion', {
        error: error instanceof Error ? error.message : 'Unknown error',
        userId,
        productId
      });
      throw error;
    }
  }

  /**
   * Add search to user history
   * 
   * @param {string} userId - User ID
   * @param {string} query - Search query
   * @returns {Promise<object>} Updated preferences
   */
  async addToSearchHistory(userId, query) {
    try {
      const preferences = await this.getUserPreferences(userId);
      const searchHistory = preferences.searchHistory || [];

      // Add new query to history (max 50 items)
      const updatedHistory = [query, ...searchHistory].slice(0, 50);

      const updatedPreferences = await this.prisma.userSearchPreferences.update({
        where: { userId },
        data: {
          searchHistory: updatedHistory
        }
      });

      loggerService.info('Search added to history', {
        userId,
        query
      });

      return updatedPreferences;
    } catch (error) {
      loggerService.error('Failed to add to search history', {
        error: error instanceof Error ? error.message : 'Unknown error',
        userId,
        query
      });
      throw error;
    }
  }

  /**
   * Get user's search history
   * 
   * @param {string} userId - User ID
   * @param {number} limit - Maximum number of items to return
   * @returns {Promise<Array>} Search history
   */
  async getSearchHistory(userId, limit = 20) {
    try {
      const preferences = await this.getUserPreferences(userId);
      const searchHistory = (preferences.searchHistory || []).slice(0, limit);

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
   * Clear user's search history
   * 
   * @param {string} userId - User ID
   * @returns {Promise<object>} Updated preferences
   */
  async clearSearchHistory(userId) {
    try {
      const updatedPreferences = await this.prisma.userSearchPreferences.update({
        where: { userId },
        data: {
          searchHistory: []
        }
      });

      loggerService.info('Search history cleared', {
        userId
      });

      return updatedPreferences;
    } catch (error) {
      loggerService.error('Failed to clear search history', {
        error: error instanceof Error ? error.message : 'Unknown error',
        userId
      });
      throw error;
    }
  }

  /**
   * Learn from user behavior
   * 
   * @param {string} userId - User ID
   * @param {string} productId - Product ID
   * @param {string} action - User action (view, click, add_to_cart, purchase)
   * @returns {Promise<object>} Updated preferences
   */
  async learnFromBehavior(userId, productId, action) {
    try {
      const product = await this.prisma.product.findUnique({
        where: { id: productId },
        include: {
          categories: true,
          brand: true
        }
      });

      if (!product) {
        throw new Error('Product not found');
      }

      const preferences = await this.getUserPreferences(userId);
      const preferredCategories = preferences.preferredCategories || [];
      const preferredBrands = preferences.preferredBrands || [];

      // Update preferences based on action
      if (action === 'purchase' || action === 'add_to_cart') {
        // Add product's categories to preferred categories
        const categoryIds = product.categories.map(c => c.id);
        const newCategories = [...new Set([...preferredCategories, ...categoryIds])];

        // Add product's brand to preferred brands
        if (product.brand && !preferredBrands.includes(product.brand.id)) {
          const newBrands = [...preferredBrands, product.brand.id];

          await this.updateUserPreferences(userId, {
            preferredCategories: newCategories,
            preferredBrands: newBrands
          });
        }
      }

      loggerService.info('Behavior learned', {
        userId,
        productId,
        action
      });

      return await this.getUserPreferences(userId);
    } catch (error) {
      loggerService.error('Failed to learn from behavior', {
        error: error instanceof Error ? error.message : 'Unknown error',
        userId,
        productId,
        action
      });
      throw error;
    }
  }

  /**
   * Get trending products
   * 
   * @param {number} limit - Maximum number of products
   * @returns {Promise<Array>} Trending products
   */
  async getTrendingProducts(limit = 10) {
    try {
      const trendingSearches = await this.prisma.searchTrending.findMany({
        where: { isTrending: true },
        orderBy: { trendScore: 'desc' },
        take: limit
      });

      // Get products related to trending searches
      const productIds = trendingSearches
        .filter(t => t.category)
        .map(t => t.category)
        .slice(0, limit);

      if (productIds.length === 0) {
        return [];
      }

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

      return products.map(p => ({
        ...p,
        trendScore: trendingSearches.find(t => t.category === p.id)?.trendScore || 0
      }));
    } catch (error) {
      loggerService.error('Failed to get trending products', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return [];
    }
  }

  /**
   * Get products similar to user preferences
   * 
   * @param {object} preferences - User preferences
   * @param {number} limit - Maximum number of products
   * @returns {Promise<Array>} Similar products
   */
  async getSimilarProducts(preferences, limit = 10) {
    try {
      const { preferredCategories, preferredBrands } = preferences;

      if ((!preferredCategories || preferredCategories.length === 0) && 
          (!preferredBrands || preferredBrands.length === 0)) {
        return [];
      }

      const products = await this.prisma.product.findMany({
        where: {
          OR: [
            preferredCategories && preferredCategories.length > 0 ? {
              categories: {
                some: {
                  id: { in: preferredCategories }
                }
              }
            } : {},
            preferredBrands && preferredBrands.length > 0 ? {
              brandId: { in: preferredBrands }
            } : {}
          ],
          status: 'active',
          visibility: 'public'
        },
        take: limit,
        include: {
          brand: true,
          categories: true
        }
      });

      return products.map(p => ({
        ...p,
        score: this.calculateSimilarityScore(p, preferences)
      })).sort((a, b) => b.score - a.score);
    } catch (error) {
      loggerService.error('Failed to get similar products', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return [];
    }
  }

  /**
   * Get personalized products for a user
   * 
   * @param {string} userId - User ID
   * @param {object} preferences - User preferences
   * @param {number} limit - Maximum number of products
   * @returns {Promise<Array>} Personalized products
   */
  async getPersonalizedProducts(userId, preferences, limit = 10) {
    try {
      // Get user's recent search analytics
      const recentSearches = await this.prisma.searchAnalytics.findMany({
        where: { userId },
        orderBy: { timestamp: 'desc' },
        take: 10
      });

      // Extract categories and brands from recent searches
      const categoryIds = new Set();
      const brandIds = new Set();

      for (const search of recentSearches) {
        const filters = search.filtersApplied || {};
        if (filters.categoryIds) {
          filters.categoryIds.forEach(id => categoryIds.add(id));
        }
        if (filters.brandIds) {
          filters.brandIds.forEach(id => brandIds.add(id));
        }
      }

      // Get products matching user's interests
      const products = await this.prisma.product.findMany({
        where: {
          OR: [
            categoryIds.size > 0 ? {
              categories: {
                some: {
                  id: { in: Array.from(categoryIds) }
                }
              }
            } : {},
            brandIds.size > 0 ? {
              brandId: { in: Array.from(brandIds) }
            } : {}
          ],
          status: 'active',
          visibility: 'public'
        },
        take: limit,
        include: {
          brand: true,
          categories: true
        }
      });

      return products.map(p => ({
        ...p,
        score: this.calculatePersonalizationScore(p, preferences, recentSearches),
        reason: 'Based on your recent searches'
      })).sort((a, b) => b.score - a.score);
    } catch (error) {
      loggerService.error('Failed to get personalized products', {
        error: error instanceof Error ? error.message : 'Unknown error',
        userId
      });
      return [];
    }
  }

  /**
   * Build personalized Elasticsearch query
   * 
   * @param {string} query - Search query
   * @param {object} preferences - User preferences
   * @returns {object} Elasticsearch query body
   */
  buildPersonalizedQuery(query, preferences) {
    const queryBody = {
      query: {
        bool: {
          must: [
            {
              multi_match: {
                query,
                fields: ['name.en^3', 'name.bn^2', 'description^1', 'shortDescription^1.5'],
                type: 'best_fields',
                fuzziness: 'AUTO'
              }
            }
          ],
          should: []
        }
      }
    };

    // Add category boosts
    if (preferences.preferredCategories && preferences.preferredCategories.length > 0) {
      preferences.preferredCategories.forEach(categoryId => {
        queryBody.query.bool.should.push({
          term: {
            'categories.id': {
              value: categoryId,
              boost: 2.0
            }
          }
        });
      });
    }

    // Add brand boosts
    if (preferences.preferredBrands && preferences.preferredBrands.length > 0) {
      preferences.preferredBrands.forEach(brandId => {
        queryBody.query.bool.should.push({
          term: {
            brandId: {
              value: brandId,
              boost: 1.5
            }
          }
        });
      });
    }

    return queryBody;
  }

  /**
   * Calculate similarity score for a product
   * 
   * @param {object} product - Product object
   * @param {object} preferences - User preferences
   * @returns {number} Similarity score
   */
  calculateSimilarityScore(product, preferences) {
    let score = 0;

    const { preferredCategories, preferredBrands } = preferences;

    if (preferredCategories && preferredCategories.length > 0) {
      const productCategories = product.categories?.map(c => c.id) || [];
      const matchingCategories = productCategories.filter(c => preferredCategories.includes(c));
      score += (matchingCategories.length / preferredCategories.length) * 0.6;
    }

    if (preferredBrands && preferredBrands.length > 0) {
      if (preferredBrands.includes(product.brandId)) {
        score += 0.4;
      }
    }

    return score;
  }

  /**
   * Calculate personalization score for a product
   * 
   * @param {object} product - Product object
   * @param {object} preferences - User preferences
   * @param {Array} recentSearches - Recent search analytics
   * @returns {number} Personalization score
   */
  calculatePersonalizationScore(product, preferences, recentSearches) {
    let score = 0;

    // Base score from preferences
    const preferenceScore = this.calculateSimilarityScore(product, preferences);
    score += preferenceScore * 0.5;

    // Score from recent searches
    const categoryIds = product.categories?.map(c => c.id) || [];
    for (const search of recentSearches) {
      const filters = search.filtersApplied || {};
      if (filters.categoryIds) {
        const matchingCategories = filters.categoryIds.filter(id => categoryIds.includes(id));
        score += (matchingCategories.length / filters.categoryIds.length) * 0.1;
      }
      if (filters.brandIds && filters.brandIds.includes(product.brandId)) {
        score += 0.1;
      }
    }

    return Math.min(score, 1.0);
  }

  /**
   * Process Elasticsearch search results
   * 
   * @param {object} response - Elasticsearch response
   * @returns {object} Processed results
   */
  processSearchResults(response) {
    const hits = response.hits || {};
    const total = typeof hits.total === 'object' ? hits.total.value : hits.total || 0;

    return {
      total,
      results: (hits.hits || []).map(hit => ({
        id: hit._id,
        score: hit._score,
        ...hit._source
      }))
    };
  }

  /**
   * Build index name with prefix
   * 
   * @param {string} type - Index type
   * @returns {string} Index name
   */
  buildIndexName(type) {
    const prefix = process.env.ELASTICSEARCH_INDEX_PREFIX || 'smarttech_';
    return `${prefix}${type}s`;
  }
}

module.exports = { SearchPersonalizationService };
