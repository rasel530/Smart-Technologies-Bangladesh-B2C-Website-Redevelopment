/**
 * Elasticsearch Query Optimizer Service
 * 
 * This module provides query optimization for the Smart Tech B2C e-commerce platform,
 * including query templates, DSL building, fuzzy matching, multi-field search with boosting,
 * and query profiling for performance analysis.
 */

const { loggerService } = require('../logger');

/**
 * Query optimizer configuration
 */
const QUERY_CONFIG = {
  // Query timeout in milliseconds
  TIMEOUT: 2000,
  
  // Fuzzy matching configuration
  FUZZINESS: 'AUTO',
  FUZZY_PREFIX_LENGTH: 2,
  FUZZY_MAX_EXPANSIONS: 50,
  
  // Multi-field boosting
  FIELD_BOOSTS: {
    'name.english': 3,
    'name.bengali': 2,
    'name.keyword': 2.5,
    'description.english': 1.5,
    'description.bengali': 1.2,
    'brand.name': 2,
    'category.name': 1.5,
    'sku': 3,
    'tags': 1.5
  },
  
  // Pagination defaults
  DEFAULT_PAGE: 1,
  DEFAULT_SIZE: 20,
  MAX_SIZE: 100,
  
  // Minimum score threshold
  MIN_SCORE: 0.1,
  
  // Query profiling
  ENABLE_PROFILING: true,
  
  // Caching
  REQUEST_CACHE: true
};

/**
 * Query templates for common search patterns
 */
const QUERY_TEMPLATES = {
  /**
   * Full-text search template
   */
  fullTextSearch: (query, fields = []) => ({
    query: {
      bool: {
        should: fields.map(field => ({
          match: {
            [field]: {
              query,
              fuzziness: QUERY_CONFIG.FUZZINESS,
              prefix_length: QUERY_CONFIG.FUZZY_PREFIX_LENGTH,
              max_expansions: QUERY_CONFIG.FUZZY_MAX_EXPANSIONS
            }
          }
        })),
        minimum_should_match: 1
      }
    }
  }),

  /**
   * Multi-match with boosting template
   */
  multiMatchBoost: (query, boosts = QUERY_CONFIG.FIELD_BOOSTS) => {
    const fields = Object.entries(boosts).map(([field, boost]) => `${field}^${boost}`);
    return {
      query: {
        multi_match: {
          query,
          fields,
          type: 'best_fields',
          fuzziness: QUERY_CONFIG.FUZZINESS,
          prefix_length: QUERY_CONFIG.FUZZY_PREFIX_LENGTH,
          operator: 'or'
        }
      }
    };
  },

  /**
   * Filtered search template
   */
  filteredSearch: (query, filters = {}) => {
    const mustClauses = [];
    
    // Add text search if query is provided
    if (query) {
      mustClauses.push({
        multi_match: {
          query,
          fields: Object.keys(QUERY_CONFIG.FIELD_BOOSTS).map(f => `${f}^${QUERY_CONFIG.FIELD_BOOSTS[f]}`),
          type: 'best_fields',
          fuzziness: QUERY_CONFIG.FUZZINESS,
          operator: 'or'
        }
      });
    }
    
    // Add filter clauses
    const filterClauses = Object.entries(filters).map(([field, value]) => {
      if (Array.isArray(value)) {
        return { terms: { [field]: value } };
      } else if (typeof value === 'object' && value.min !== undefined && value.max !== undefined) {
        return { range: { [field]: { gte: value.min, lte: value.max } } };
      } else {
        return { term: { [field]: value } };
      }
    });
    
    return {
      query: {
        bool: {
          must: mustClauses.length > 0 ? mustClauses : undefined,
          filter: filterClauses.length > 0 ? filterClauses : undefined
        }
      }
    };
  },

  /**
   * Exact match template
   */
  exactMatch: (field, value) => ({
    query: {
      term: {
        [field]: value
      }
    }
  }),

  /**
   * Prefix search template
   */
  prefixSearch: (field, value) => ({
    query: {
      prefix: {
        [field]: {
          value,
          case_insensitive: true
        }
      }
    }
  }),

  /**
   * Wildcard search template
   */
  wildcardSearch: (field, pattern) => ({
    query: {
      wildcard: {
        [field]: {
          value: pattern,
          case_insensitive: true
        }
      }
    }
  }),

  /**
   * Range query template
   */
  rangeQuery: (field, range) => ({
    query: {
      range: {
        [field]: range
      }
    }
  }),

  /**
   * Nested query template
   */
  nestedQuery: (path, query) => ({
    query: {
      nested: {
        path,
        query
      }
    }
  }),

  /**
   * Function score template for custom scoring
   */
  functionScore: (query, functions = []) => ({
    query: {
      function_score: {
        query,
        functions,
        score_mode: 'sum',
        boost_mode: 'sum',
        min_score: QUERY_CONFIG.MIN_SCORE
      }
    }
  }),

  /**
   * More like this template
   */
  moreLikeThis: (fields, likeText, minTermFreq = 1, minDocFreq = 1) => ({
    query: {
      more_like_this: {
        fields,
        like: likeText,
        min_term_freq: minTermFreq,
        min_doc_freq: minDocFreq,
        max_query_terms: 25
      }
    }
  })
};

/**
 * Aggregation templates for faceted search
 */
const AGGREGATION_TEMPLATES = {
  /**
   * Terms aggregation
   */
  terms: (field, size = 10) => ({
    [`${field}_agg`]: {
      terms: {
        field,
        size
      }
    }
  }),

  /**
   * Range aggregation
   */
  range: (field, ranges) => ({
    [`${field}_agg`]: {
      range: {
        field,
        ranges
      }
    }
  }),

  /**
   * Histogram aggregation
   */
  histogram: (field, interval) => ({
    [`${field}_agg`]: {
      histogram: {
        field,
        interval
      }
    }
  }),

  /**
   * Stats aggregation
   */
  stats: (field) => ({
    [`${field}_stats`]: {
      stats: {
        field
      }
    }
  }),

  /**
   * Nested aggregation
   */
  nested: (path, aggs) => ({
    [`${path}_nested_agg`]: {
      nested: {
        path
      },
      aggs
    }
  }),

  /**
   * Filter aggregation
   */
  filter: (filter, aggs) => ({
    filtered_agg: {
      filter,
      aggs
    }
  }),

  /**
   * Cardinality aggregation (unique count)
   */
  cardinality: (field) => ({
    [`${field}_count`]: {
      cardinality: {
        field
      }
    }
  })
};

/**
 * Sort options
 */
const SORT_OPTIONS = {
  relevance: ['_score', { _doc: 'desc' }],
  price_asc: [{ 'price.current': 'asc' }],
  price_desc: [{ 'price.current': 'desc' }],
  name_asc: [{ 'name.keyword': 'asc' }],
  name_desc: [{ 'name.keyword': 'desc' }],
  newest: [{ createdAt: 'desc' }],
  popularity: [{ 'stats.viewCount': 'desc' }],
  rating: [{ 'stats.averageRating': 'desc' }]
};

/**
 * Query Optimizer Service class
 */
class QueryOptimizerService {
  constructor() {
    this.config = QUERY_CONFIG;
    this.queryHistory = [];
    this.maxHistorySize = 1000;
  }

  /**
   * Build optimized search query
   * @param {Object} params - Search parameters
   * @returns {Object} Optimized Elasticsearch query
   */
  buildSearchQuery(params) {
    try {
      const {
        query,
        filters = {},
        page = QUERY_CONFIG.DEFAULT_PAGE,
        size = QUERY_CONFIG.DEFAULT_SIZE,
        sort = 'relevance',
        aggregations = {},
        minScore = QUERY_CONFIG.MIN_SCORE
      } = params;

      // Build base query
      const searchBody = QUERY_TEMPLATES.filteredSearch(query, filters);

      // Add minimum score
      if (minScore > 0) {
        searchBody.query.bool.min_score = minScore;
      }

      // Add pagination
      const from = (page - 1) * size;
      searchBody.from = from;
      searchBody.size = Math.min(size, QUERY_CONFIG.MAX_SIZE);

      // Add sorting
      const sortOption = SORT_OPTIONS[sort] || SORT_OPTIONS.relevance;
      searchBody.sort = sortOption;

      // Add aggregations
      if (Object.keys(aggregations).length > 0) {
        searchBody.aggs = aggregations;
      }

      // Add timeout
      searchBody.timeout = `${QUERY_CONFIG.TIMEOUT}ms`;

      // Enable request cache
      searchBody.request_cache = QUERY_CONFIG.REQUEST_CACHE;

      // Add profiling if enabled
      if (QUERY_CONFIG.ENABLE_PROFILING) {
        searchBody.profile = true;
      }

      // Track query history
      this.trackQuery(params);

      loggerService.debug('Built optimized search query', {
        query,
        filters,
        page,
        size,
        sort
      });

      return searchBody;
    } catch (error) {
      loggerService.error('Failed to build search query', {
        error: error.message,
        stack: error.stack,
        params
      });
      throw error;
    }
  }

  /**
   * Build aggregation query
   * @param {Object} params - Aggregation parameters
   * @returns {Object} Elasticsearch aggregation query
   */
  buildAggregationQuery(params) {
    try {
      const {
        filters = {},
        aggregations = {}
      } = params;

      const queryBody = {
        size: 0, // Only return aggregations
        timeout: `${QUERY_CONFIG.TIMEOUT}ms`,
        request_cache: QUERY_CONFIG.REQUEST_CACHE
      };

      // Add filters if provided
      if (Object.keys(filters).length > 0) {
        const filterClauses = Object.entries(filters).map(([field, value]) => {
          if (Array.isArray(value)) {
            return { terms: { [field]: value } };
          } else if (typeof value === 'object' && value.min !== undefined && value.max !== undefined) {
            return { range: { [field]: { gte: value.min, lte: value.max } } };
          } else {
            return { term: { [field]: value } };
          }
        });

        queryBody.query = {
          bool: {
            filter: filterClauses
          }
        };
      }

      // Add aggregations
      queryBody.aggs = aggregations;

      loggerService.debug('Built aggregation query', {
        filters,
        aggregationCount: Object.keys(aggregations).length
      });

      return queryBody;
    } catch (error) {
      loggerService.error('Failed to build aggregation query', {
        error: error.message,
        stack: error.stack,
        params
      });
      throw error;
    }
  }

  /**
   * Build product facet aggregations
   * @returns {Object} Facet aggregations
   */
  buildProductFacets() {
    return {
      categories: AGGREGATION_TEMPLATES.terms('category.name', 20),
      brands: AGGREGATION_TEMPLATES.terms('brand.name', 20),
      price_ranges: AGGREGATION_TEMPLATES.range('price.current', [
        { to: 500, key: 'under_500' },
        { from: 500, to: 1000, key: '500_1000' },
        { from: 1000, to: 2000, key: '1000_2000' },
        { from: 2000, to: 5000, key: '2000_5000' },
        { from: 5000, key: 'over_5000' }
      ]),
      ratings: AGGREGATION_TEMPLATES.range('stats.averageRating', [
        { from: 4, key: '4_and_up' },
        { from: 3, to: 4, key: '3_to_4' },
        { from: 2, to: 3, key: '2_to_3' },
        { from: 1, to: 2, key: '1_to_2' }
      ]),
      in_stock: {
        filter: { term: { 'inventory.inStock': true } }
      },
      availability: {
        filter: {
          range: {
            'inventory.quantity': { gt: 0 }
          }
        }
      }
    };
  }

  /**
   * Build category aggregations
   * @returns {Object} Category aggregations
   */
  buildCategoryAggregations() {
    return {
      parent_categories: AGGREGATION_TEMPLATES.terms('parentId', 20),
      product_count: AGGREGATION_TEMPLATES.cardity('id')
    };
  }

  /**
   * Build brand aggregations
   * @returns {Object} Brand aggregations
   */
  buildBrandAggregations() {
    return {
      product_count: AGGREGATION_TEMPLATES.cardinality('id'),
      price_stats: AGGREGATION_TEMPLATES.stats('price.current')
    };
  }

  /**
   * Optimize query based on query history
   * @param {Object} params - Query parameters
   * @returns {Object} Optimized query parameters
   */
  optimizeQuery(params) {
    try {
      // Analyze query history for common patterns
      const commonPatterns = this.analyzeQueryHistory();

      // Apply optimizations based on patterns
      const optimizedParams = { ...params };

      // If query is short, enable fuzzy matching
      if (params.query && params.query.length < 5) {
        optimizedParams.enableFuzzy = true;
      }

      // If no filters are specified, suggest popular filters
      if (!params.filters || Object.keys(params.filters).length === 0) {
        optimizedParams.suggestedFilters = commonPatterns.topFilters;
      }

      // If no sort is specified, use relevance
      if (!params.sort) {
        optimizedParams.sort = 'relevance';
      }

      loggerService.debug('Query optimized', {
        originalParams: params,
        optimizedParams
      });

      return optimizedParams;
    } catch (error) {
      loggerService.error('Failed to optimize query', {
        error: error.message,
        stack: error.stack,
        params
      });
      return params;
    }
  }

  /**
   * Analyze query history for patterns
   * @returns {Object} Query patterns
   */
  analyzeQueryHistory() {
    try {
      const patterns = {
        topQueries: {},
        topFilters: {},
        topSorts: {},
        totalQueries: this.queryHistory.length
      };

      // Analyze queries
      this.queryHistory.forEach(entry => {
        // Track query terms
        if (entry.query) {
          patterns.topQueries[entry.query] = (patterns.topQueries[entry.query] || 0) + 1;
        }

        // Track filters
        if (entry.filters) {
          Object.keys(entry.filters).forEach(filter => {
            patterns.topFilters[filter] = (patterns.topFilters[filter] || 0) + 1;
          });
        }

        // Track sorts
        if (entry.sort) {
          patterns.topSorts[entry.sort] = (patterns.topSorts[entry.sort] || 0) + 1;
        }
      });

      // Sort and limit results
      patterns.topQueries = this.sortObjectByValue(patterns.topQueries).slice(0, 10);
      patterns.topFilters = this.sortObjectByValue(patterns.topFilters).slice(0, 10);
      patterns.topSorts = this.sortObjectByValue(patterns.topSorts).slice(0, 5);

      return patterns;
    } catch (error) {
      loggerService.error('Failed to analyze query history', {
        error: error.message,
        stack: error.stack
      });
      return {
        topQueries: {},
        topFilters: {},
        topSorts: {},
        totalQueries: 0
      };
    }
  }

  /**
   * Track query in history
   * @param {Object} params - Query parameters
   */
  trackQuery(params) {
    try {
      this.queryHistory.push({
        ...params,
        timestamp: Date.now()
      });

      // Limit history size
      if (this.queryHistory.length > this.maxHistorySize) {
        this.queryHistory.shift();
      }
    } catch (error) {
      loggerService.error('Failed to track query', {
        error: error.message,
        stack: error.stack
      });
    }
  }

  /**
   * Sort object by value (descending)
   * @param {Object} obj - Object to sort
   * @returns {Array} Sorted array of key-value pairs
   */
  sortObjectByValue(obj) {
    return Object.entries(obj)
      .sort((a, b) => b[1] - a[1])
      .map(([key, value]) => ({ key, value }));
  }

  /**
   * Analyze query profile from Elasticsearch
   * @param {Object} profile - Query profile from Elasticsearch
   * @returns {Object} Analysis results
   */
  analyzeProfile(profile) {
    try {
      const analysis = {
        totalQueryTime: 0,
        breakdown: [],
        slowQueries: [],
        recommendations: []
      };

      // Analyze profile structure
      if (profile && profile.shards) {
        profile.shards.forEach(shard => {
          if (shard.searches) {
            shard.searches.forEach(search => {
              if (search.query) {
                const queryTime = search.query.time_in_nanos / 1000000; // Convert to ms
                analysis.totalQueryTime += queryTime;

                analysis.breakdown.push({
                  type: search.query.type,
                  time: queryTime,
                  description: search.query.description
                });

                // Identify slow queries (> 100ms)
                if (queryTime > 100) {
                  analysis.slowQueries.push({
                    type: search.query.type,
                    time: queryTime,
                    description: search.query.description
                  });
                }
              }
            });
          }
        });
      }

      // Generate recommendations
      if (analysis.slowQueries.length > 0) {
        analysis.recommendations.push('Consider adding more specific filters to reduce result set');
        analysis.recommendations.push('Review index mappings for optimization opportunities');
      }

      if (analysis.totalQueryTime > 300) {
        analysis.recommendations.push('Query exceeds performance target of 300ms');
        analysis.recommendations.push('Consider using caching for this query pattern');
      }

      return analysis;
    } catch (error) {
      loggerService.error('Failed to analyze query profile', {
        error: error.message,
        stack: error.stack
      });
      return {
        totalQueryTime: 0,
        breakdown: [],
        slowQueries: [],
        recommendations: []
      };
    }
  }

  /**
   * Get query history statistics
   * @returns {Object} Query history statistics
   */
  getQueryHistoryStats() {
    const patterns = this.analyzeQueryHistory();

    return {
      totalQueries: patterns.totalQueries,
      topQueries: patterns.topQueries,
      topFilters: patterns.topFilters,
      topSorts: patterns.topSorts,
      historySize: this.queryHistory.length
    };
  }

  /**
   * Clear query history
   */
  clearQueryHistory() {
    this.queryHistory = [];
    loggerService.info('Query history cleared');
  }

  /**
   * Get configuration
   * @returns {Object} Query optimizer configuration
   */
  getConfig() {
    return { ...this.config };
  }

  /**
   * Update configuration
   * @param {Object} updates - Configuration updates
   */
  updateConfig(updates) {
    this.config = { ...this.config, ...updates };
    loggerService.info('Query optimizer configuration updated', { updates });
  }
}

module.exports = {
  QueryOptimizerService,
  QUERY_CONFIG,
  QUERY_TEMPLATES,
  AGGREGATION_TEMPLATES,
  SORT_OPTIONS
};
