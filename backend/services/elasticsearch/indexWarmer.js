/**
 * Elasticsearch Index Warmer Service
 * 
 * This module provides index warming for the Smart Tech B2C e-commerce platform,
 * including warm-up queries for common search patterns, pre-warm queries on index refresh,
 * segment optimization scheduling, and force merge for old segments.
 */

const { loggerService } = require('../logger');
const { INDEX_NAMES } = require('./indexManager');

/**
 * Index warmer configuration
 */
const WARMER_CONFIG = {
  // Number of warm-up queries to execute
  WARMUP_QUERY_COUNT: 100,
  
  // Warm-up query execution interval in milliseconds
  WARMUP_INTERVAL: 100,
  
  // Force merge configuration
  FORCE_MERGE_MAX_SEGMENTS: 1,
  FORCE_MERGE_SEGMENT_AGE_DAYS: 7,
  
  // Optimization schedule (cron-like format)
  OPTIMIZATION_SCHEDULE: {
    hour: 2, // 2 AM (low traffic)
    minute: 0
  },
  
  // Warm-up query patterns
  WARMUP_PATTERNS: [
    { type: 'search', query: '', filters: {} },
    { type: 'search', query: 'phone', filters: {} },
    { type: 'search', query: 'laptop', filters: {} },
    { type: 'search', query: 'watch', filters: {} },
    { type: 'search', query: 'headphone', filters: {} },
    { type: 'search', query: '', filters: { category: 'Electronics' } },
    { type: 'search', query: '', filters: { inStock: true } },
    { type: 'search', query: '', filters: { 'price.current': { min: 0, max: 1000 } } },
    { type: 'search', query: '', filters: { brand: 'Samsung' } },
    { type: 'search', query: '', filters: { brand: 'Apple' } },
    { type: 'search', query: '', filters: { brand: 'Xiaomi' } },
    { type: 'search', query: '', filters: { 'stats.averageRating': { min: 4 } } },
    { type: 'aggregation', aggregations: {} },
    { type: 'aggregation', aggregations: { categories: { terms: { field: 'category.name' } } } },
    { type: 'aggregation', aggregations: { brands: { terms: { field: 'brand.name' } } } },
    { type: 'aggregation', aggregations: { price_ranges: { range: { field: 'price.current' } } } }
  ],
  
  // Segment optimization settings
  SEGMENT_OPTIMIZATION: {
    enabled: true,
    checkInterval: 3600000, // 1 hour
    maxSegmentsPerTier: 3
  }
};

/**
 * Warm-up query definitions
 */
const WARMUP_QUERIES = {
  /**
   * General search warm-up queries
   */
  searchQueries: [
    {
      name: 'empty_search',
      query: {
        query: { match_all: {} },
        size: 10
      }
    },
    {
      name: 'popular_terms',
      query: {
        query: {
          bool: {
            should: [
              { match: { name: 'phone' } },
              { match: { name: 'laptop' } },
              { match: { name: 'watch' } },
              { match: { name: 'headphone' } },
              { match: { name: 'camera' } }
            ],
            minimum_should_match: 1
          }
        },
        size: 10
      }
    },
    {
      name: 'fuzzy_search',
      query: {
        query: {
          multi_match: {
            query: 'samsung',
            fields: ['name^3', 'description'],
            fuzziness: 'AUTO'
          }
        },
        size: 10
      }
    }
  ],

  /**
   * Filter warm-up queries
   */
  filterQueries: [
    {
      name: 'category_filter',
      query: {
        query: {
          bool: {
            filter: [
              { term: { 'category.name': 'Electronics' } }
            ]
          }
        },
        size: 10
      }
    },
    {
      name: 'price_range_filter',
      query: {
        query: {
          bool: {
            filter: [
              { range: { 'price.current': { gte: 0, lte: 5000 } } }
            ]
          }
        },
        size: 10
      }
    },
    {
      name: 'brand_filter',
      query: {
        query: {
          bool: {
            filter: [
              { term: { 'brand.name': 'Samsung' } }
            ]
          }
        },
        size: 10
      }
    },
    {
      name: 'stock_filter',
      query: {
        query: {
          bool: {
            filter: [
              { term: { 'inventory.inStock': true } }
            ]
          }
        },
        size: 10
      }
    },
    {
      name: 'rating_filter',
      query: {
        query: {
          bool: {
            filter: [
              { range: { 'stats.averageRating': { gte: 4 } } }
            ]
          }
        },
        size: 10
      }
    }
  ],

  /**
   * Aggregation warm-up queries
   */
  aggregationQueries: [
    {
      name: 'category_aggregation',
      query: {
        size: 0,
        aggs: {
          categories: {
            terms: { field: 'category.name', size: 20 }
          }
        }
      }
    },
    {
      name: 'brand_aggregation',
      query: {
        size: 0,
        aggs: {
          brands: {
            terms: { field: 'brand.name', size: 20 }
          }
        }
      }
    },
    {
      name: 'price_range_aggregation',
      query: {
        size: 0,
        aggs: {
          price_ranges: {
            range: {
              field: 'price.current',
              ranges: [
                { to: 500, key: 'under_500' },
                { from: 500, to: 1000, key: '500_1000' },
                { from: 1000, to: 2000, key: '1000_2000' },
                { from: 2000, to: 5000, key: '2000_5000' },
                { from: 5000, key: 'over_5000' }
              ]
            }
          }
        }
      }
    },
    {
      name: 'rating_aggregation',
      query: {
        size: 0,
        aggs: {
          ratings: {
            range: {
              field: 'stats.averageRating',
              ranges: [
                { from: 4, key: '4_and_up' },
                { from: 3, to: 4, key: '3_to_4' },
                { from: 2, to: 3, key: '2_to_3' },
                { from: 1, to: 2, key: '1_to_2' }
              ]
            }
          }
        }
      }
    },
    {
      name: 'combined_facets',
      query: {
        size: 0,
        aggs: {
          categories: {
            terms: { field: 'category.name', size: 20 }
          },
          brands: {
            terms: { field: 'brand.name', size: 20 }
          },
          price_ranges: {
            range: {
              field: 'price.current',
              ranges: [
                { to: 500, key: 'under_500' },
                { from: 500, to: 1000, key: '500_1000' },
                { from: 1000, to: 2000, key: '1000_2000' },
                { from: 2000, to: 5000, key: '2000_5000' },
                { from: 5000, key: 'over_5000' }
              ]
            }
          },
          in_stock: {
            filter: { term: { 'inventory.inStock': true } }
          }
        }
      }
    }
  ],

  /**
   * Sort warm-up queries
   */
  sortQueries: [
    {
      name: 'sort_by_price_asc',
      query: {
        query: { match_all: {} },
        size: 10,
        sort: [{ 'price.current': 'asc' }]
      }
    },
    {
      name: 'sort_by_price_desc',
      query: {
        query: { match_all: {} },
        size: 10,
        sort: [{ 'price.current': 'desc' }]
      }
    },
    {
      name: 'sort_by_name_asc',
      query: {
        query: { match_all: {} },
        size: 10,
        sort: [{ 'name.keyword': 'asc' }]
      }
    },
    {
      name: 'sort_by_newest',
      query: {
        query: { match_all: {} },
        size: 10,
        sort: [{ createdAt: 'desc' }]
      }
    },
    {
      name: 'sort_by_popularity',
      query: {
        query: { match_all: {} },
        size: 10,
        sort: [{ 'stats.viewCount': 'desc' }]
      }
    }
  ]
};

/**
 * Index Warmer Service class
 */
class IndexWarmerService {
  constructor(elasticsearchClient, indexManager) {
    this.client = elasticsearchClient;
    this.indexManager = indexManager;
    this.config = WARMER_CONFIG;
    this.warmupInterval = null;
    this.optimizationInterval = null;
    this.isWarming = false;
  }

  /**
   * Initialize index warmer service
   * @returns {Promise<Object>} Result of initialization
   */
  async initialize() {
    try {
      loggerService.info('Initializing Elasticsearch Index Warmer Service');

      // Start segment optimization check
      if (this.config.SEGMENT_OPTIMIZATION.enabled) {
        this.startSegmentOptimization();
      }

      loggerService.info('Index Warmer Service initialized successfully');

      return {
        success: true,
        message: 'Index Warmer Service initialized successfully'
      };
    } catch (error) {
      loggerService.error('Failed to initialize Index Warmer Service', {
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
   * Warm up index on refresh
   * @param {string} indexName - Index name
   * @returns {Promise<Object>} Result of warm-up
   */
  async warmIndex(indexName) {
    try {
      if (this.isWarming) {
        loggerService.warn('Index warming already in progress', { indexName });
        return {
          success: false,
          message: 'Warming already in progress'
        };
      }

      this.isWarming = true;
      loggerService.info('Starting index warm-up', { indexName });

      const results = {
        searchQueries: 0,
        filterQueries: 0,
        aggregationQueries: 0,
        sortQueries: 0,
        totalQueries: 0,
        errors: []
      };

      // Warm up search queries
      const searchResults = await this.executeWarmupQueries(
        indexName,
        WARMUP_QUERIES.searchQueries
      );
      results.searchQueries = searchResults.successful;
      results.errors.push(...searchResults.errors);

      // Warm up filter queries
      const filterResults = await this.executeWarmupQueries(
        indexName,
        WARMUP_QUERIES.filterQueries
      );
      results.filterQueries = filterResults.successful;
      results.errors.push(...filterResults.errors);

      // Warm up aggregation queries
      const aggResults = await this.executeWarmupQueries(
        indexName,
        WARMUP_QUERIES.aggregationQueries
      );
      results.aggregationQueries = aggResults.successful;
      results.errors.push(...aggResults.errors);

      // Warm up sort queries
      const sortResults = await this.executeWarmupQueries(
        indexName,
        WARMUP_QUERIES.sortQueries
      );
      results.sortQueries = sortResults.successful;
      results.errors.push(...sortResults.errors);

      results.totalQueries =
        results.searchQueries +
        results.filterQueries +
        results.aggregationQueries +
        results.sortQueries;

      this.isWarming = false;

      loggerService.info('Index warm-up completed', {
        indexName,
        results
      });

      return {
        success: true,
        indexName,
        results
      };
    } catch (error) {
      this.isWarming = false;
      loggerService.error('Failed to warm index', {
        indexName,
        error: error.message,
        stack: error.stack
      });

      return {
        success: false,
        error: error.message,
        indexName
      };
    }
  }

  /**
   * Execute warm-up queries
   * @param {string} indexName - Index name
   * @param {Array} queries - Array of warm-up queries
   * @returns {Promise<Object>} Execution results
   */
  async executeWarmupQueries(indexName, queries) {
    const results = {
      successful: 0,
      failed: 0,
      errors: []
    };

    for (const warmupQuery of queries) {
      try {
        await this.client.search({
          index: indexName,
          body: warmupQuery.query,
          request_cache: false, // Don't cache warm-up queries
          preference: '_local' // Execute locally for warming
        });

        results.successful++;

        // Add small delay between queries
        await new Promise(resolve =>
          setTimeout(resolve, this.config.WARMUP_INTERVAL)
        );
      } catch (error) {
        results.failed++;
        results.errors.push({
          queryName: warmupQuery.name,
          error: error.message
        });

        loggerService.warn('Warm-up query failed', {
          indexName,
          queryName: warmupQuery.name,
          error: error.message
        });
      }
    }

    return results;
  }

  /**
   * Warm up all indices
   * @returns {Promise<Object>} Result of warm-up
   */
  async warmAllIndices() {
    try {
      loggerService.info('Starting warm-up for all indices');

      const results = {
        products: await this.warmIndex(INDEX_NAMES.products),
        categories: await this.warmIndex(INDEX_NAMES.categories),
        brands: await this.warmIndex(INDEX_NAMES.brands)
      };

      const allSuccessful = Object.values(results).every(r => r.success);

      loggerService.info('All indices warm-up completed', { results });

      return {
        success: allSuccessful,
        results
      };
    } catch (error) {
      loggerService.error('Failed to warm all indices', {
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
   * Force merge old segments
   * @param {string} indexName - Index name
   * @param {number} maxNumSegments - Maximum number of segments
   * @returns {Promise<Object>} Result of force merge
   */
  async forceMerge(indexName, maxNumSegments = this.config.FORCE_MERGE_MAX_SEGMENTS) {
    try {
      loggerService.info('Starting force merge', { indexName, maxNumSegments });

      const result = await this.client.indices.forcemerge({
        index: indexName,
        max_num_segments: maxNumSegments,
        wait_for_merge: false // Don't wait for merge to complete
      });

      loggerService.info('Force merge initiated', {
        indexName,
        acknowledged: result.acknowledged
      });

      return {
        success: true,
        indexName,
        acknowledged: result.acknowledged
      };
    } catch (error) {
      loggerService.error('Failed to force merge index', {
        indexName,
        error: error.message,
        stack: error.stack
      });

      return {
        success: false,
        error: error.message,
        indexName
      };
    }
  }

  /**
   * Force merge old segments for all indices
   * @returns {Promise<Object>} Result of force merge
   */
  async forceMergeAllIndices() {
    try {
      loggerService.info('Starting force merge for all indices');

      const results = {
        products: await this.forceMerge(INDEX_NAMES.products),
        categories: await this.forceMerge(INDEX_NAMES.categories),
        brands: await this.forceMerge(INDEX_NAMES.brands)
      };

      const allSuccessful = Object.values(results).every(r => r.success);

      loggerService.info('All indices force merge completed', { results });

      return {
        success: allSuccessful,
        results
      };
    } catch (error) {
      loggerService.error('Failed to force merge all indices', {
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
   * Check if index needs force merge
   * @param {string} indexName - Index name
   * @returns {Promise<boolean>} True if force merge is needed
   */
  async needsForceMerge(indexName) {
    try {
      const statsResult = await this.indexManager.getIndexStats(indexName);

      if (!statsResult.success) {
        return false;
      }

      const segments = statsResult.stats.segments;

      // Check if there are too many segments
      if (segments.count > this.config.SEGMENT_OPTIMIZATION.maxSegmentsPerTier) {
        return true;
      }

      // Check segment age
      const now = Date.now();
      const maxAge = this.config.FORCE_MERGE_SEGMENT_AGE_DAYS * 24 * 60 * 60 * 1000;

      for (const segment of segments.segments || []) {
        if (segment.generation) {
          const segmentAge = now - segment.generation;
          if (segmentAge > maxAge) {
            return true;
          }
        }
      }

      return false;
    } catch (error) {
      loggerService.error('Failed to check if index needs force merge', {
        indexName,
        error: error.message,
        stack: error.stack
      });
      return false;
    }
  }

  /**
   * Optimize segments for all indices
   * @returns {Promise<Object>} Result of optimization
   */
  async optimizeSegments() {
    try {
      loggerService.info('Starting segment optimization');

      const results = {};

      for (const [key, indexName] of Object.entries(INDEX_NAMES)) {
        if (key.includes('Alias')) continue;

        const needsMerge = await this.needsForceMerge(indexName);

        if (needsMerge) {
          loggerService.info('Force merge needed', { indexName });
          results[key] = await this.forceMerge(indexName);
        } else {
          loggerService.debug('No force merge needed', { indexName });
          results[key] = {
            success: true,
            message: 'No optimization needed'
          };
        }
      }

      loggerService.info('Segment optimization completed', { results });

      return {
        success: true,
        results
      };
    } catch (error) {
      loggerService.error('Failed to optimize segments', {
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
   * Start segment optimization schedule
   */
  startSegmentOptimization() {
    if (this.optimizationInterval) {
      loggerService.warn('Segment optimization already scheduled');
      return;
    }

    loggerService.info('Starting segment optimization schedule', {
      interval: `${this.config.SEGMENT_OPTIMIZATION.checkInterval}ms`
    });

    this.optimizationInterval = setInterval(async () => {
      try {
        await this.optimizeSegments();
      } catch (error) {
        loggerService.error('Segment optimization failed', {
          error: error.message,
          stack: error.stack
        });
      }
    }, this.config.SEGMENT_OPTIMIZATION.checkInterval);
  }

  /**
   * Stop segment optimization schedule
   */
  stopSegmentOptimization() {
    if (!this.optimizationInterval) {
      loggerService.warn('Segment optimization not running');
      return;
    }

    clearInterval(this.optimizationInterval);
    this.optimizationInterval = null;

    loggerService.info('Segment optimization stopped');
  }

  /**
   * Get warmer status
   * @returns {Object} Warmer status
   */
  getStatus() {
    return {
      isWarming: this.isWarming,
      optimizationScheduled: this.optimizationInterval !== null,
      config: this.config
    };
  }

  /**
   * Shutdown index warmer service
   * @returns {Promise<Object>} Result of shutdown
   */
  async shutdown() {
    try {
      loggerService.info('Shutting down Index Warmer Service');

      // Stop optimization
      this.stopSegmentOptimization();

      loggerService.info('Index Warmer Service shut down successfully');

      return {
        success: true,
        message: 'Index Warmer Service shut down successfully'
      };
    } catch (error) {
      loggerService.error('Failed to shut down Index Warmer Service', {
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
  IndexWarmerService,
  WARMER_CONFIG,
  WARMUP_QUERIES
};
