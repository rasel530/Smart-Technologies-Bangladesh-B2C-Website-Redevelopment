/**
 * Elasticsearch Search Service
 * 
 * This module provides comprehensive search functionality for the Smart Tech B2C e-commerce platform,
 * integrating caching, query optimization, and monitoring for optimal performance.
 */

const { loggerService } = require('../logger');
const { INDEX_NAMES, getIndexName } = require('./indexManager');
const { CacheService, generateSearchCacheKey, generateFilterCacheKey, generateAggregationCacheKey } = require('./cache');
const { QueryOptimizerService, QUERY_CONFIG, QUERY_TEMPLATES, AGGREGATION_TEMPLATES, SORT_OPTIONS } = require('./queryOptimizer');
const { IndexWarmerService } = require('./indexWarmer');
const { PerformanceMonitorService } = require('./performanceMonitor');

/**
 * Search service configuration
 */
const SEARCH_CONFIG = {
  // Default pagination
  DEFAULT_PAGE: 1,
  DEFAULT_SIZE: 20,
  MAX_SIZE: 100,
  
  // Performance settings
  ENABLE_CACHING: true,
  ENABLE_MONITORING: true,
  ENABLE_QUERY_OPTIMIZATION: true,
  
  // Search behavior
  MIN_SCORE: 0.1,
  TRACK_TOTAL_HITS: true,
  TRACK_SCORES: true,
  
  // Facet settings
  FACET_SIZE: 20,
  ENABLE_FACETS: true
};

/**
 * Search Service class
 */
class SearchService {
  constructor(elasticsearchClient, indexManager, redisClient = null) {
    this.client = elasticsearchClient;
    this.indexManager = indexManager;
    
    // Initialize services
    this.cacheService = redisClient ? new CacheService(redisClient) : null;
    this.queryOptimizer = new QueryOptimizerService();
    this.indexWarmer = new IndexWarmerService(elasticsearchClient, indexManager);
    this.performanceMonitor = new PerformanceMonitorService(
      elasticsearchClient,
      indexManager,
      this.cacheService
    );
    
    this.config = SEARCH_CONFIG;
    this.isInitialized = false;
  }

  /**
   * Initialize search service
   * @returns {Promise<Object>} Result of initialization
   */
  async initialize() {
    try {
      loggerService.info('Initializing Elasticsearch Search Service');

      // Initialize cache service
      if (this.cacheService) {
        await this.cacheService.initialize();
      }

      // Initialize index warmer
      await this.indexWarmer.initialize();

      // Initialize performance monitor
      if (this.config.ENABLE_MONITORING) {
        await this.performanceMonitor.initialize();
      }

      this.isInitialized = true;

      loggerService.info('Search Service initialized successfully');

      return {
        success: true,
        message: 'Search Service initialized successfully'
      };
    } catch (error) {
      loggerService.error('Failed to initialize Search Service', {
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
   * Search products
   * @param {Object} params - Search parameters
   * @returns {Promise<Object>} Search results
   */
  async searchProducts(params = {}) {
    const startTime = Date.now();
    const indexName = getIndexName('product');
    
    try {
      // Extract parameters
      const {
        query = '',
        filters = {},
        page = this.config.DEFAULT_PAGE,
        size = this.config.DEFAULT_SIZE,
        sort = 'relevance',
        aggregations = null,
        minScore = this.config.MIN_SCORE,
        useCache = this.config.ENABLE_CACHING
      } = params;

      // Check cache if enabled
      let cachedResult = null;
      if (useCache && this.cacheService) {
        cachedResult = await this.cacheService.getSearchResults(query, filters, { page, size, sort });
        
        if (cachedResult) {
          const duration = Date.now() - startTime;
          
          // Track performance
          if (this.config.ENABLE_MONITORING) {
            this.performanceMonitor.trackQuery(
              'search',
              indexName,
              { query, filters, page, size, sort },
              duration,
              true
            );
          }
          
          loggerService.info('Search results retrieved from cache', {
            query,
            duration,
            cacheHit: true
          });
          
          return {
            success: true,
            ...cachedResult,
            cached: true,
            duration
          };
        }
      }

      // Optimize query if enabled
      let optimizedParams = params;
      if (this.config.ENABLE_QUERY_OPTIMIZATION) {
        optimizedParams = this.queryOptimizer.optimizeQuery(params);
      }

      // Build search query
      const searchBody = this.queryOptimizer.buildSearchQuery({
        query: optimizedParams.query,
        filters: optimizedParams.filters,
        page: optimizedParams.page,
        size: Math.min(optimizedParams.size, this.config.MAX_SIZE),
        sort: optimizedParams.sort,
        aggregations: aggregations || this.queryOptimizer.buildProductFacets(),
        minScore: optimizedParams.minScore || minScore
      });

      // Execute search
      const result = await this.client.search({
        index: indexName,
        body: searchBody,
        track_total_hits: this.config.TRACK_TOTAL_HITS
      });

      const duration = Date.now() - startTime;

      // Process results
      const processedResult = this.processSearchResult(result, aggregations);

      // Cache results if enabled
      if (useCache && this.cacheService) {
        await this.cacheService.cacheSearchResults(
          query,
          filters,
          { page, size, sort },
          processedResult
        );
      }

      // Track performance
      if (this.config.ENABLE_MONITORING) {
        this.performanceMonitor.trackQuery(
          'search',
          indexName,
          { query, filters, page, size, sort },
          duration,
          false,
          result.profile
        );
      }

      loggerService.info('Product search completed', {
        query,
        totalHits: processedResult.total,
        duration,
        cacheHit: false
      });

      return {
        success: true,
        ...processedResult,
        cached: false,
        duration
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      
      // Track error
      if (this.config.ENABLE_MONITORING) {
        this.performanceMonitor.metrics.addErrorMetric('search');
      }
      
      loggerService.error('Product search failed', {
        error: error.message,
        stack: error.stack,
        params,
        duration
      });

      return {
        success: false,
        error: error.message,
        duration
      };
    }
  }

  /**
   * Search categories
   * @param {Object} params - Search parameters
   * @returns {Promise<Object>} Search results
   */
  async searchCategories(params = {}) {
    const startTime = Date.now();
    const indexName = getIndexName('category');
    
    try {
      const {
        query = '',
        filters = {},
        page = this.config.DEFAULT_PAGE,
        size = this.config.DEFAULT_SIZE,
        sort = 'relevance',
        useCache = this.config.ENABLE_CACHING
      } = params;

      // Check cache
      if (useCache && this.cacheService) {
        const cachedResult = await this.cacheService.getSearchResults(query, filters, { page, size, sort });
        
        if (cachedResult) {
          const duration = Date.now() - startTime;
          
          if (this.config.ENABLE_MONITORING) {
            this.performanceMonitor.trackQuery('search', indexName, params, duration, true);
          }
          
          return { success: true, ...cachedResult, cached: true, duration };
        }
      }

      // Build search query
      const searchBody = this.queryOptimizer.buildSearchQuery({
        query,
        filters,
        page,
        size: Math.min(size, this.config.MAX_SIZE),
        sort
      });

      // Execute search
      const result = await this.client.search({
        index: indexName,
        body: searchBody
      });

      const duration = Date.now() - startTime;
      const processedResult = this.processSearchResult(result);

      // Cache results
      if (useCache && this.cacheService) {
        await this.cacheService.cacheSearchResults(query, filters, { page, size, sort }, processedResult);
      }

      // Track performance
      if (this.config.ENABLE_MONITORING) {
        this.performanceMonitor.trackQuery('search', indexName, params, duration, false);
      }

      return {
        success: true,
        ...processedResult,
        cached: false,
        duration
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      
      if (this.config.ENABLE_MONITORING) {
        this.performanceMonitor.metrics.addErrorMetric('search');
      }
      
      loggerService.error('Category search failed', {
        error: error.message,
        stack: error.stack,
        params,
        duration
      });

      return {
        success: false,
        error: error.message,
        duration
      };
    }
  }

  /**
   * Search brands
   * @param {Object} params - Search parameters
   * @returns {Promise<Object>} Search results
   */
  async searchBrands(params = {}) {
    const startTime = Date.now();
    const indexName = getIndexName('brand');
    
    try {
      const {
        query = '',
        filters = {},
        page = this.config.DEFAULT_PAGE,
        size = this.config.DEFAULT_SIZE,
        sort = 'relevance',
        useCache = this.config.ENABLE_CACHING
      } = params;

      // Check cache
      if (useCache && this.cacheService) {
        const cachedResult = await this.cacheService.getSearchResults(query, filters, { page, size, sort });
        
        if (cachedResult) {
          const duration = Date.now() - startTime;
          
          if (this.config.ENABLE_MONITORING) {
            this.performanceMonitor.trackQuery('search', indexName, params, duration, true);
          }
          
          return { success: true, ...cachedResult, cached: true, duration };
        }
      }

      // Build search query
      const searchBody = this.queryOptimizer.buildSearchQuery({
        query,
        filters,
        page,
        size: Math.min(size, this.config.MAX_SIZE),
        sort
      });

      // Execute search
      const result = await this.client.search({
        index: indexName,
        body: searchBody
      });

      const duration = Date.now() - startTime;
      const processedResult = this.processSearchResult(result);

      // Cache results
      if (useCache && this.cacheService) {
        await this.cacheService.cacheSearchResults(query, filters, { page, size, sort }, processedResult);
      }

      // Track performance
      if (this.config.ENABLE_MONITORING) {
        this.performanceMonitor.trackQuery('search', indexName, params, duration, false);
      }

      return {
        success: true,
        ...processedResult,
        cached: false,
        duration
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      
      if (this.config.ENABLE_MONITORING) {
        this.performanceMonitor.metrics.addErrorMetric('search');
      }
      
      loggerService.error('Brand search failed', {
        error: error.message,
        stack: error.stack,
        params,
        duration
      });

      return {
        success: false,
        error: error.message,
        duration
      };
    }
  }

  /**
   * Get product facets/aggregations
   * @param {Object} params - Aggregation parameters
   * @returns {Promise<Object>} Aggregation results
   */
  async getProductFacets(params = {}) {
    const startTime = Date.now();
    const indexName = getIndexName('product');
    
    try {
      const {
        filters = {},
        aggregations = null,
        useCache = this.config.ENABLE_CACHING
      } = params;

      // Check cache
      if (useCache && this.cacheService) {
        const cachedResult = await this.cacheService.getAggregationResults(indexName, aggregations || {});
        
        if (cachedResult) {
          const duration = Date.now() - startTime;
          
          if (this.config.ENABLE_MONITORING) {
            this.performanceMonitor.trackQuery('aggregation', indexName, params, duration, true);
          }
          
          return { success: true, ...cachedResult, cached: true, duration };
        }
      }

      // Build aggregation query
      const aggBody = this.queryOptimizer.buildAggregationQuery({
        filters,
        aggregations: aggregations || this.queryOptimizer.buildProductFacets()
      });

      // Execute aggregation
      const result = await this.client.search({
        index: indexName,
        body: aggBody
      });

      const duration = Date.now() - startTime;
      const processedResult = this.processAggregationResult(result);

      // Cache results
      if (useCache && this.cacheService) {
        await this.cacheService.cacheAggregationResults(
          indexName,
          aggregations || {},
          processedResult
        );
      }

      // Track performance
      if (this.config.ENABLE_MONITORING) {
        this.performanceMonitor.trackQuery('aggregation', indexName, params, duration, false);
      }

      return {
        success: true,
        ...processedResult,
        cached: false,
        duration
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      
      if (this.config.ENABLE_MONITORING) {
        this.performanceMonitor.metrics.addErrorMetric('aggregation');
      }
      
      loggerService.error('Product facets failed', {
        error: error.message,
        stack: error.stack,
        params,
        duration
      });

      return {
        success: false,
        error: error.message,
        duration
      };
    }
  }

  /**
   * Get product by ID
   * @param {string} productId - Product ID
   * @returns {Promise<Object>} Product details
   */
  async getProductById(productId) {
    const startTime = Date.now();
    const indexName = getIndexName('product');
    
    try {
      // Check cache
      if (this.cacheService) {
        const cachedResult = await this.cacheService.get(`product:${productId}`);
        
        if (cachedResult) {
          const duration = Date.now() - startTime;
          
          if (this.config.ENABLE_MONITORING) {
            this.performanceMonitor.trackQuery('get', indexName, { productId }, duration, true);
          }
          
          return { success: true, ...cachedResult, cached: true, duration };
        }
      }

      // Execute get
      const result = await this.client.get({
        index: indexName,
        id: productId
      });

      const duration = Date.now() - startTime;
      const product = result._source;
      product._id = result._id;

      // Cache result
      if (this.cacheService) {
        await this.cacheService.set(`product:${productId}`, product);
      }

      // Track performance
      if (this.config.ENABLE_MONITORING) {
        this.performanceMonitor.trackQuery('get', indexName, { productId }, duration, false);
      }

      return {
        success: true,
        product,
        cached: false,
        duration
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      
      if (this.config.ENABLE_MONITORING) {
        this.performanceMonitor.metrics.addErrorMetric('get');
      }
      
      loggerService.error('Get product by ID failed', {
        error: error.message,
        stack: error.stack,
        productId,
        duration
      });

      return {
        success: false,
        error: error.message,
        duration
      };
    }
  }

  /**
   * Get multiple products by IDs
   * @param {string[]} productIds - Array of product IDs
   * @returns {Promise<Object>} Products
   */
  async getProductsByIds(productIds) {
    const startTime = Date.now();
    const indexName = getIndexName('product');
    
    try {
      const result = await this.client.mget({
        index: indexName,
        ids: productIds
      });

      const duration = Date.now() - startTime;
      const products = result.docs.map(doc => ({
        ...doc._source,
        _id: doc._id,
        found: doc.found
      }));

      // Track performance
      if (this.config.ENABLE_MONITORING) {
        this.performanceMonitor.trackQuery('mget', indexName, { count: productIds.length }, duration, false);
      }

      return {
        success: true,
        products,
        duration
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      
      if (this.config.ENABLE_MONITORING) {
        this.performanceMonitor.metrics.addErrorMetric('mget');
      }
      
      loggerService.error('Get products by IDs failed', {
        error: error.message,
        stack: error.stack,
        count: productIds.length,
        duration
      });

      return {
        success: false,
        error: error.message,
        duration
      };
    }
  }

  /**
   * Invalidate cache for a product
   * @param {string} productId - Product ID
   * @returns {Promise<boolean>} Success status
   */
  async invalidateProductCache(productId) {
    if (!this.cacheService) {
      return true;
    }

    return await this.cacheService.invalidateProduct(productId);
  }

  /**
   * Invalidate all search cache
   * @returns {Promise<number>} Number of deleted keys
   */
  async invalidateAllSearchCache() {
    if (!this.cacheService) {
      return 0;
    }

    return await this.cacheService.invalidateAllSearchCache();
  }

  /**
   * Process search result
   * @param {Object} result - Elasticsearch search result
   * @param {Object} aggregations - Aggregations requested
   * @returns {Object} Processed result
   */
  processSearchResult(result, aggregations = null) {
    const hits = result.hits || {};
    const total = hits.total || {};
    
    return {
      total: typeof total === 'object' ? total.value : total,
      hits: (hits.hits || []).map(hit => ({
        ...hit._source,
        _id: hit._id,
        _score: hit._score
      })),
      aggregations: aggregations ? this.processAggregations(result.aggregations) : null,
      maxScore: hits.max_score,
      timedOut: result.timed_out || false
    };
  }

  /**
   * Process aggregation result
   * @param {Object} result - Elasticsearch aggregation result
   * @returns {Object} Processed aggregations
   */
  processAggregationResult(result) {
    return {
      aggregations: this.processAggregations(result.aggregations),
      total: result.hits?.total?.value || 0
    };
  }

  /**
   * Process aggregations
   * @param {Object} aggregations - Elasticsearch aggregations
   * @returns {Object} Processed aggregations
   */
  processAggregations(aggregations = {}) {
    const processed = {};

    for (const [key, agg] of Object.entries(aggregations)) {
      if (agg.buckets) {
        processed[key] = agg.buckets.map(bucket => ({
          key: bucket.key,
          docCount: bucket.doc_count,
          ...bucket
        }));
      } else if (agg.value !== undefined) {
        processed[key] = agg.value;
      } else if (agg.values) {
        processed[key] = agg.values;
      } else {
        processed[key] = agg;
      }
    }

    return processed;
  }

  /**
   * Get performance report
   * @returns {Object} Performance report
   */
  getPerformanceReport() {
    if (!this.config.ENABLE_MONITORING) {
      return {
        success: false,
        message: 'Monitoring is disabled'
      };
    }

    return this.performanceMonitor.getPerformanceReport();
  }

  /**
   * Get cache statistics
   * @returns {Object} Cache statistics
   */
  getCacheStats() {
    if (!this.cacheService) {
      return {
        success: false,
        message: 'Caching is disabled'
      };
    }

    return this.cacheService.getStats();
  }

  /**
   * Warm up indices
   * @returns {Promise<Object>} Warm-up results
   */
  async warmUpIndices() {
    return await this.indexWarmer.warmAllIndices();
  }

  /**
   * Get service status
   * @returns {Object} Service status
   */
  getStatus() {
    return {
      initialized: this.isInitialized,
      caching: {
        enabled: this.config.ENABLE_CACHING,
        available: this.cacheService !== null
      },
      monitoring: {
        enabled: this.config.ENABLE_MONITORING,
        status: this.performanceMonitor.getStatus()
      },
      queryOptimization: {
        enabled: this.config.ENABLE_QUERY_OPTIMIZATION
      },
      indexWarmer: {
        status: this.indexWarmer.getStatus()
      }
    };
  }

  /**
   * Shutdown search service
   * @returns {Promise<Object>} Result of shutdown
   */
  async shutdown() {
    try {
      loggerService.info('Shutting down Search Service');

      // Shutdown performance monitor
      if (this.config.ENABLE_MONITORING) {
        await this.performanceMonitor.shutdown();
      }

      // Shutdown index warmer
      await this.indexWarmer.shutdown();

      this.isInitialized = false;

      loggerService.info('Search Service shut down successfully');

      return {
        success: true,
        message: 'Search Service shut down successfully'
      };
    } catch (error) {
      loggerService.error('Failed to shut down Search Service', {
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
  SearchService,
  SEARCH_CONFIG,
  SORT_OPTIONS
};
