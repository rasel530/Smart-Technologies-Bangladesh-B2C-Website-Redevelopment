/**
 * Search Service (JavaScript version)
 * 
 * This module provides comprehensive search functionality for Smart Tech B2C e-commerce platform,
 * including advanced product search, faceted search, sorting, pagination, autocomplete, suggestions,
 * caching, and search analytics logging.
 */

const { elasticsearchQueryBuilder } = require('./elasticsearchQueryBuilder');
const { loggerService } = require('./logger');
const { PrismaClient } = require('@prisma/client');
const { SearchAnalyticsService } = require('./searchAnalytics.service');
const { SearchPerformanceService } = require('./searchPerformance.service');
const { SearchOptimizationService } = require('./searchOptimization.service');
const { SearchPersonalizationService } = require('./searchPersonalization.service');
const { SearchTrendingService } = require('./searchTrending.service');

/**
 * Default search service configuration
 */
const DEFAULT_CONFIG = {
  defaultPage: 1,
  defaultPageSize: 20,
  maxPageSize: 100,
  enableCaching: true,
  cacheTTL: 300,
  enableAnalytics: true,
  minScore: 0.1,
  enableFuzzyByDefault: true,
  defaultLanguage: 'en',
  enableQueryOptimization: true
};

/**
 * Search Service class
 */
class SearchService {
  constructor(elasticsearchClient, prisma, redisClient = null, config = {}) {
    this.elasticsearchClient = elasticsearchClient;
    this.prisma = prisma;
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.queryBuilder = elasticsearchQueryBuilder;
    this.cacheService = null;
    this.isInitialized = false;
    
    // Initialize cache service if Redis is available
    if (redisClient) {
      const { SearchCacheService } = require('./searchCacheService');
      this.cacheService = new SearchCacheService(redisClient);
    }
    
    // Initialize new search analytics and optimization services
    this.searchAnalyticsService = new SearchAnalyticsService(prisma);
    this.searchPerformanceService = new SearchPerformanceService(prisma);
    this.searchOptimizationService = new SearchOptimizationService(prisma, elasticsearchClient);
    this.searchPersonalizationService = new SearchPersonalizationService(prisma, elasticsearchClient);
    this.searchTrendingService = new SearchTrendingService(prisma);
  }

  /**
   * Initialize search service
   */
  async initialize() {
    try {
      loggerService.info('Initializing search service');

      // Initialize cache service if available
      if (this.cacheService && this.config.enableCaching) {
        await this.cacheService.initialize();
      }

      this.isInitialized = true;
      loggerService.info('Search service initialized successfully');
    } catch (error) {
      loggerService.error('Failed to initialize search service', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  /**
   * Advanced product search
   */
  async advancedSearch(searchQuery, userId, ipAddress, userAgent) {
    const startTime = Date.now();

    try {
      // Apply defaults
      const query = {
        ...searchQuery,
        page: searchQuery.page ?? this.config.defaultPage,
        pageSize: Math.min(
          searchQuery.pageSize ?? this.config.defaultPageSize,
          this.config.maxPageSize
        ),
        sort: searchQuery.sort ?? 'relevance',
        language: searchQuery.language ?? this.config.defaultLanguage,
        enableFuzzy: searchQuery.enableFuzzy ?? this.config.enableFuzzyByDefault,
        minScore: searchQuery.minScore ?? this.config.minScore
      };

      // Check cache if enabled
      let cached = null;
      if (this.cacheService && this.config.enableCaching) {
        const cacheKey = this.cacheService.generateCacheKey(query);
        cached = await this.cacheService.get(cacheKey);

        if (cached) {
          const executionTime = Date.now() - startTime;
          
          // Track performance metrics for cached results
          this.searchPerformanceService.trackQuery(executionTime, true, cached.total || 0);
          
          loggerService.info('Search results retrieved from cache', {
            query: query.query,
            executionTime,
            cached: true
          });

          return {
            ...cached,
            executionTime,
            cached: true
          };
        }
      }

      // Optimize query if enabled
      let optimizedQuery = query.query;
      if (this.config.enableQueryOptimization) {
        const optimization = await this.searchOptimizationService.optimizeQuery(query.query, userId);
        optimizedQuery = optimization.optimizedQuery;
      }

      // Apply personalization if userId provided
      let personalizedFilters = {};
      if (userId && this.config.enableQueryOptimization) {
        const preferences = await this.searchPersonalizationService.getUserPreferences(userId);
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
      }

      // Merge personalized filters with query filters
      const mergedFilters = {
        ...query,
        ...personalizedFilters
      };

      // Build Elasticsearch query
      const esQuery = this.queryBuilder.buildSearchQuery(mergedFilters);

      // Execute search
      const indexName = this.buildIndexName('product');
      const response = await this.elasticsearchClient.search({
        index: indexName,
        body: esQuery
      });

      const executionTime = Date.now() - startTime;

      // Process results
      const result = this.processSearchResults(response, mergedFilters);

      // Cache results if enabled
      if (this.cacheService && this.config.enableCaching) {
        const cacheKey = this.cacheService.generateCacheKey(mergedFilters);
        await this.cacheService.set(cacheKey, result, this.config.cacheTTL);
      }

      // Track search analytics
      const sessionId = searchQuery.sessionId || `sess_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const searchAnalytics = await this.searchAnalyticsService.trackSearch(
        userId,
        sessionId,
        query.query,
        result.total,
        executionTime,
        {
          categoryIds: mergedFilters.categoryIds,
          brandIds: mergedFilters.brandIds,
          priceRange: mergedFilters.priceRange,
          specifications: mergedFilters.specifications,
          inStockOnly: mergedFilters.inStockOnly,
          featuredOnly: mergedFilters.featuredOnly
        },
        mergedFilters.sort,
        {
          ipAddress,
          userAgent,
          deviceType: searchQuery.deviceType
        }
      );

      // Track performance metrics for non-cached results
      this.searchPerformanceService.trackQuery(executionTime, false, result.total);

      // Record search for trending
      await this.searchTrendingService.recordSearch(query.query, mergedFilters.categoryIds?.[0]);

      // Add to user search history if userId provided
      if (userId) {
        await this.searchPersonalizationService.addToSearchHistory(userId, query.query);
      }

      loggerService.info('Advanced search completed', {
        query: query.query,
        total: result.total,
        executionTime,
        cached: false,
        searchAnalyticsId: searchAnalytics.id
      });

      return {
        ...result,
        executionTime,
        cached: false,
        searchAnalyticsId: searchAnalytics.id
      };
    } catch (error) {
      const executionTime = Date.now() - startTime;

      loggerService.error('Advanced search failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        query: searchQuery.query,
        executionTime
      });

      return {
        success: false,
        total: 0,
        results: [],
        page: searchQuery.page ?? this.config.defaultPage,
        pageSize: searchQuery.pageSize ?? this.config.defaultPageSize,
        totalPages: 0,
        executionTime,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Search autocomplete
   */
  async autocomplete(query, language = 'en') {
    const startTime = Date.now();

    try {
      if (!query || query.trim().length === 0) {
        return {
          success: true,
          query,
          products: [],
          categories: [],
          brands: [],
          popularSearches: [],
          executionTime: Date.now() - startTime
        };
      }

      // Build autocomplete query
      const esQuery = this.queryBuilder.buildAutocompleteQuery(query, language);

      // Execute search
      const indexName = this.buildIndexName('product');
      const response = await this.elasticsearchClient.search({
        index: indexName,
        body: esQuery
      });

      const executionTime = Date.now() - startTime;

      // Process results
      const products = this.processAutocompleteResults(response);

      // Get category suggestions
      const categories = await this.getCategorySuggestions(query, language);

      // Get brand suggestions
      const brands = await this.getBrandSuggestions(query, language);

      // Get popular searches
      const popularSearches = await this.getPopularSearches(5);

      loggerService.info('Autocomplete completed', {
        query,
        productsCount: products.length,
        executionTime
      });

      return {
        success: true,
        query,
        products,
        categories,
        brands,
        popularSearches,
        executionTime
      };
    } catch (error) {
      const executionTime = Date.now() - startTime;

      loggerService.error('Autocomplete failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        query,
        executionTime
      });

      return {
        success: false,
        query,
        executionTime,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get search suggestions
   */
  async getSuggestions(query) {
    const startTime = Date.now();

    try {
      if (!query || query.trim().length === 0) {
        return {
          success: true,
          query,
          suggestions: [],
          didYouMean: [],
          relatedSearches: [],
          executionTime: Date.now() - startTime
        };
      }

      // Build suggestion query
      const esQuery = this.queryBuilder.buildSuggestionQuery(query);

      // Execute search
      const indexName = this.buildIndexName('product');
      const response = await this.elasticsearchClient.search({
        index: indexName,
        body: esQuery
      });

      const executionTime = Date.now() - startTime;

      // Process results
      const suggestions = this.processSuggestionResults(response);

      // Get "did you mean" suggestions
      const didYouMean = await this.getDidYouMeanSuggestions(query);

      // Get related searches
      const relatedSearches = await this.getRelatedSearches(query);

      loggerService.info('Suggestions completed', {
        query,
        suggestionsCount: suggestions.length,
        executionTime
      });

      return {
        success: true,
        query,
        suggestions,
        didYouMean,
        relatedSearches,
        executionTime
      };
    } catch (error) {
      const executionTime = Date.now() - startTime;

      loggerService.error('Suggestions failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        query,
        executionTime
      });

      return {
        success: false,
        query,
        suggestions: [],
        executionTime,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get popular searches
   */
  async getPopularSearches(limit = 10) {
    try {
      const popularSearches = await this.prisma.search_logs.groupBy({
        by: ['query'],
        where: {
          timestamp: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
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

      return popularSearches.map(ps => ps.query);
    } catch (error) {
      loggerService.error('Failed to get popular searches', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return [];
    }
  }

  /**
   * Invalidate cache for a product
   */
  async invalidateProductCache(productId) {
    if (this.cacheService) {
      await this.cacheService.invalidateProduct(productId);
    }
  }

  /**
   * Invalidate cache for a category
   */
  async invalidateCategoryCache(categoryId) {
    if (this.cacheService) {
      await this.cacheService.invalidateCategory(categoryId);
    }
  }

  /**
   * Invalidate cache for a brand
   */
  async invalidateBrandCache(brandId) {
    if (this.cacheService) {
      await this.cacheService.invalidateBrand(brandId);
    }
  }

  /**
   * Invalidate all search cache
   */
  async invalidateAllCache() {
    if (this.cacheService) {
      return await this.cacheService.invalidateAll();
    }
    return 0;
  }

  /**
   * Get cache statistics
   */
  getCacheStatistics() {
    if (this.cacheService) {
      return this.cacheService.getStatistics();
    }
    return null;
  }

  /**
   * Process Elasticsearch search results
   */
  processSearchResults(response, query) {
    const hits = response.hits || {};
    const total = typeof hits.total === 'object' ? hits.total.value : hits.total || 0;

    return {
      success: true,
      total,
      results: (hits.hits || []).map((hit) => this.mapSearchHit(hit)),
      facets: this.processFacets(response.aggregations),
      page: query.page ?? this.config.defaultPage,
      pageSize: query.pageSize ?? this.config.defaultPageSize,
      totalPages: Math.ceil(total / (query.pageSize ?? this.config.defaultPageSize)),
      maxScore: hits.max_score,
      executionTime: 0
    };
  }

  /**
   * Map Elasticsearch hit to search result
   */
  mapSearchHit(hit) {
    const source = hit._source || {};

    return {
      id: hit._id,
      sku: source.sku,
      nameEn: source.name?.en || source.nameEn || '',
      nameBn: source.name?.bn || source.nameBn,
      slug: source.slug,
      shortDescription: source.shortDescription,
      description: source.description,
      regularPrice: source.price?.current || source.regularPrice,
      salePrice: source.price?.sale || source.salePrice,
      finalPrice: source.price?.sale || source.salePrice || source.price?.current || source.regularPrice,
      stockQuantity: source.inventory?.quantity || source.stockQuantity || 0,
      lowStockThreshold: source.inventory?.lowStockThreshold || source.lowStockThreshold || 10,
      status: source.status,
      isFeatured: source.flags?.featured || source.isFeatured || false,
      isNewArrival: source.flags?.newArrival || source.isNewArrival || false,
      isBestSeller: source.flags?.bestSeller || source.isBestSeller || false,
      brand: {
        id: source.brand?.id,
        name: source.brand?.name,
        slug: source.brand?.slug
      },
      categories: (source.categories || []).map((cat) => ({
        id: cat.id,
        name: cat.name,
        slug: cat.slug,
        parentId: cat.parentId,
        level: cat.level
      })),
      primaryImage: source.primaryImage || {
        url: source.images?.[0]?.url,
        thumbnailUrl: source.images?.[0]?.thumbnailUrl,
        altText: source.images?.[0]?.altText
      },
      averageRating: source.stats?.averageRating,
      reviewCount: source.stats?.reviewCount,
      _score: hit._score
    };
  }

  /**
   * Process facets from aggregations
   */
  processFacets(aggregations) {
    if (!aggregations) {
      return undefined;
    }

    const facets = {};

    // Process categories
    if (aggregations.categories) {
      facets.categories = aggregations.categories.buckets.map((bucket) => ({
        id: bucket.key,
        name: bucket.category_name?.buckets?.[0]?.key,
        slug: bucket.category_slug?.buckets?.[0]?.key,
        parentId: bucket.parent_id?.buckets?.[0]?.key,
        level: bucket.level?.buckets?.[0]?.key,
        count: bucket.doc_count
      }));
    }

    // Process brands
    if (aggregations.brands) {
      facets.brands = aggregations.brands.buckets.map((bucket) => ({
        id: bucket.key,
        name: bucket.brand_name?.buckets?.[0]?.key,
        slug: bucket.brand_slug?.buckets?.[0]?.key,
        isFeatured: bucket.is_featured?.buckets?.[0]?.key,
        count: bucket.doc_count
      }));
    }

    // Process price ranges
    if (aggregations.price_ranges) {
      facets.priceRanges = aggregations.price_ranges.buckets.map((bucket) => ({
        key: bucket.key,
        label: this.getPriceRangeLabel(bucket.key),
        min: bucket.from,
        max: bucket.to,
        count: bucket.doc_count
      }));
    }

    // Process ratings
    if (aggregations.ratings) {
      facets.ratings = aggregations.ratings.buckets.map((bucket) => ({
        minRating: bucket.from,
        maxRating: bucket.to,
        count: bucket.doc_count
      }));
    }

    // Process in stock
    if (aggregations.in_stock) {
      facets.inStock = {
        count: aggregations.in_stock.doc_count
      };
    }

    // Process specifications
    if (aggregations.specifications?.spec_names) {
      facets.specifications = aggregations.specifications.spec_names.buckets.map((specBucket) => ({
        name: specBucket.key,
        values: specBucket.spec_values.buckets.map((valueBucket) => ({
          value: valueBucket.key,
          count: valueBucket.doc_count
        }))
      }));
    }

    return facets;
  }

  /**
   * Get price range label
   */
  getPriceRangeLabel(key) {
    const labels = {
      'under_500': 'Under 500 BDT',
      '500_1000': '500 - 1,000 BDT',
      '1000_2000': '1,000 - 2,000 BDT',
      '2000_5000': '2,000 - 5,000 BDT',
      'over_5000': 'Over 5,000 BDT'
    };
    return labels[key] || key;
  }

  /**
   * Process autocomplete results
   */
  processAutocompleteResults(response) {
    return (response.hits?.hits || []).map((hit) => {
      const source = hit._source || {};
      return {
        id: hit._id,
        nameEn: source.name?.en || source.nameEn || '',
        nameBn: source.name?.bn || source.nameBn,
        slug: source.slug,
        image: source.primaryImage?.url || source.images?.[0]?.url,
        regularPrice: source.price?.current || source.regularPrice,
        salePrice: source.price?.sale || source.salePrice,
        category: {
          name: source.categories?.[0]?.name,
          slug: source.categories?.[0]?.slug
        },
        brand: {
          name: source.brand?.name,
          slug: source.brand?.slug
        },
        _score: hit._score
      };
    });
  }

  /**
   * Process suggestion results
   */
  processSuggestionResults(response) {
    const suggestions = new Set();

    (response.hits?.hits || []).forEach((hit) => {
      const source = hit._source || {};
      if (source.name?.en) {
        suggestions.add(source.name.en);
      }
      if (source.name?.bn) {
        suggestions.add(source.name.bn);
      }
      if (source.nameEn) {
        suggestions.add(source.nameEn);
      }
      if (source.nameBn) {
        suggestions.add(source.nameBn);
      }
    });

    return Array.from(suggestions).slice(0, 10);
  }

  /**
   * Get category suggestions
   */
  async getCategorySuggestions(query, language) {
    try {
      const indexName = this.buildIndexName('category');
      const response = await this.elasticsearchClient.search({
        index: indexName,
        body: {
          query: {
            multi_match: {
              query,
              fields: [`name.${language}^3.0`, `name.${language === 'en' ? 'bn' : 'en'}^2.0`],
              type: 'best_fields',
              fuzziness: 'AUTO',
              prefix_length: 2,
              operator: 'or'
            }
          },
          size: 5
        }
      });

      return (response.hits?.hits || []).map((hit) => ({
        id: hit._id,
        name: hit._source?.name?.[language] || hit._source?.nameEn,
        slug: hit._source?.slug,
        productCount: hit._source?.productCount,
        level: hit._source?.level
      }));
    } catch (error) {
      loggerService.error('Failed to get category suggestions', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return [];
    }
  }

  /**
   * Get brand suggestions
   */
  async getBrandSuggestions(query, language) {
    try {
      const indexName = this.buildIndexName('brand');
      const response = await this.elasticsearchClient.search({
        index: indexName,
        body: {
          query: {
            multi_match: {
              query,
              fields: [`name^3.0`],
              type: 'best_fields',
              fuzziness: 'AUTO',
              prefix_length: 2,
              operator: 'or'
            }
          },
          size: 5
        }
      });

      return (response.hits?.hits || []).map((hit) => ({
        id: hit._id,
        name: hit._source?.name,
        slug: hit._source?.slug,
        productCount: hit._source?.productCount,
        logoUrl: hit._source?.logoUrl
      }));
    } catch (error) {
      loggerService.error('Failed to get brand suggestions', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return [];
    }
  }

  /**
   * Get "did you mean" suggestions
   */
  async getDidYouMeanSuggestions(query) {
    try {
      // Use Elasticsearch's term suggester
      const indexName = this.buildIndexName('product');
      const response = await this.elasticsearchClient.search({
        index: indexName,
        body: {
          suggest: {
            'product-suggest': {
              text: query,
              term: {
                field: 'name.en',
                size: 3,
                sort: 'score'
              }
            }
          }
        }
      });

      const suggestions = response.suggest?.['product-suggest']?.[0]?.options || [];
      return suggestions.map((opt) => opt.text);
    } catch (error) {
      loggerService.error('Failed to get did you mean suggestions', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return [];
    }
  }

  /**
   * Get related searches
   */
  async getRelatedSearches(query) {
    try {
      // Find similar searches from analytics
      const similarSearches = await this.prisma.search_logs.findMany({
        where: {
          query: {
            contains: query.split(' ')[0]
          },
          timestamp: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
          }
        },
        orderBy: {
          timestamp: 'desc'
        },
        take: 10,
        distinct: ['query']
      });

      return similarSearches
        .filter(s => s.query !== query)
        .map(s => s.query)
        .slice(0, 5);
    } catch (error) {
      loggerService.error('Failed to get related searches', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return [];
    }
  }

  /**
   * Log search analytics
   */
  async logSearchAnalytics(analytics) {
    try {
      await this.prisma.search_logs.create({
        data: {
          query: analytics.query,
          userId: analytics.userId,
          resultsCount: analytics.resultsCount,
          executionTime: analytics.executionTime,
          filters: analytics.filters,
          ipAddress: analytics.ipAddress,
          userAgent: analytics.userAgent,
          timestamp: analytics.timestamp
        }
      });
    } catch (error) {
      loggerService.error('Failed to log search analytics', {
        error: error instanceof Error ? error.message : 'Unknown error',
        query: analytics.query
      });
    }
  }

  /**
   * Build index name with prefix
   */
  buildIndexName(type) {
    const prefix = process.env.ELASTICSEARCH_INDEX_PREFIX || 'smarttech_';
    return `${prefix}${type}s`;
  }

  /**
   * Get service status
   */
  getStatus() {
    return {
      initialized: this.isInitialized,
      caching: {
        enabled: this.config.enableCaching,
        available: this.cacheService !== null,
        statistics: this.getCacheStatistics()
      },
      analytics: {
        enabled: this.config.enableAnalytics
      },
      queryOptimization: {
        enabled: this.config.enableQueryOptimization
      }
    };
  }

  /**
   * Track a click on a search result
   * 
   * @param {string} searchAnalyticsId - ID of search analytics record
   * @param {string} productId - ID of clicked product
   * @param {number} position - Position of result (1-based)
   * @returns {Promise<object>} Created click tracking record
   */
  async trackClick(searchAnalyticsId, productId, position) {
    try {
      return await this.searchAnalyticsService.trackClick(searchAnalyticsId, productId, position);
    } catch (error) {
      loggerService.error('Failed to track click', {
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
   * @param {string} searchAnalyticsId - ID of search analytics record
   * @param {string} conversionType - Type of conversion (click, add_to_cart, purchase)
   * @param {string} productId - ID of product (optional)
   * @returns {Promise<object>} Updated search analytics record
   */
  async trackConversion(searchAnalyticsId, conversionType, productId = null) {
    try {
      return await this.searchAnalyticsService.trackConversion(searchAnalyticsId, conversionType, productId);
    } catch (error) {
      loggerService.error('Failed to track conversion', {
        error: error instanceof Error ? error.message : 'Unknown error',
        searchAnalyticsId,
        conversionType
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
      return await this.searchPersonalizationService.getPersonalizedResults(query, userId);
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
   * Get optimized search results with A/B testing support
   * 
   * @param {string} query - Search query
   * @param {object} filters - Search filters
   * @param {string} sortBy - Sort order
   * @param {string} userId - User ID
   * @param {string} experimentVariant - A/B test variant (optional)
   * @returns {Promise<object>} Optimized search results
   */
  async getOptimizedResults(query, filters = {}, sortBy = 'relevance', userId = null, experimentVariant = null) {
    try {
      return await this.searchOptimizationService.getOptimizedResults(query, filters, sortBy, userId, experimentVariant);
    } catch (error) {
      loggerService.error('Failed to get optimized results', {
        error: error instanceof Error ? error.message : 'Unknown error',
        query,
        userId
      });
      throw error;
    }
  }

  /**
   * Update dwell time for a click
   * 
   * @param {string} clickTrackingId - ID of click tracking record
   * @param {number} dwellTime - Time spent on product page in milliseconds
   * @returns {Promise<object>} Updated click tracking record
   */
  async updateDwellTime(clickTrackingId, dwellTime) {
    try {
      return await this.searchAnalyticsService.updateDwellTime(clickTrackingId, dwellTime);
    } catch (error) {
      loggerService.error('Failed to update dwell time', {
        error: error instanceof Error ? error.message : 'Unknown error',
        clickTrackingId
      });
      throw error;
    }
  }

  /**
   * Shutdown search service
   */
  async shutdown() {
    if (this.cacheService) {
      await this.cacheService.shutdown();
    }
    this.isInitialized = false;
    loggerService.info('Search service shut down');
  }
}

module.exports = { SearchService };
