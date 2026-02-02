/**
 * Elasticsearch Cache Service
 * 
 * This module provides search result caching using Redis for the Smart Tech B2C e-commerce platform.
 * Implements cache key generation, TTL configuration, and cache invalidation strategies.
 */

const crypto = require('crypto');
const { loggerService } = require('../logger');

/**
 * Cache configuration
 */
const CACHE_CONFIG = {
  // Cache TTL in seconds
  SEARCH_TTL: 300, // 5 minutes for search results
  FILTER_TTL: 600, // 10 minutes for filter results
  AGGREGATION_TTL: 900, // 15 minutes for aggregations
  
  // Cache key prefixes
  PREFIXES: {
    SEARCH: 'search',
    FILTER: 'filter',
    AGGREGATION: 'aggregation',
    PRODUCT: 'product',
    CATEGORY: 'category',
    BRAND: 'brand'
  },
  
  // Cache statistics
  STATS: {
    HITS: 'cache_hits',
    MISSES: 'cache_misses',
    SETS: 'cache_sets',
    DELETES: 'cache_deletes'
  }
};

/**
 * Generate cache key from query parameters
 * @param {string} prefix - Cache key prefix
 * @param {Object} params - Query parameters
 * @returns {string} Cache key
 */
function generateCacheKey(prefix, params) {
  try {
    // Sort parameters for consistent hashing
    const sortedParams = Object.keys(params)
      .sort()
      .reduce((result, key) => {
        result[key] = params[key];
        return result;
      }, {});
    
    // Create hash of parameters
    const hash = crypto
      .createHash('sha256')
      .update(JSON.stringify(sortedParams))
      .digest('hex')
      .substring(0, 16);
    
    return `${prefix}:${hash}`;
  } catch (error) {
    loggerService.error('Failed to generate cache key', {
      error: error.message,
      stack: error.stack
    });
    return `${prefix}:${Date.now()}`;
  }
}

/**
 * Generate search cache key
 * @param {string} query - Search query
 * @param {Object} filters - Search filters
 * @param {Object} options - Search options (pagination, sorting, etc.)
 * @returns {string} Cache key
 */
function generateSearchCacheKey(query, filters = {}, options = {}) {
  const params = {
    query,
    filters,
    options
  };
  return generateCacheKey(CACHE_CONFIG.PREFIXES.SEARCH, params);
}

/**
 * Generate filter cache key
 * @param {string} indexName - Index name
 * @param {Object} filters - Filter parameters
 * @returns {string} Cache key
 */
function generateFilterCacheKey(indexName, filters = {}) {
  const params = {
    indexName,
    filters
  };
  return generateCacheKey(CACHE_CONFIG.PREFIXES.FILTER, params);
}

/**
 * Generate aggregation cache key
 * @param {string} indexName - Index name
 * @param {Object} aggregations - Aggregation parameters
 * @returns {string} Cache key
 */
function generateAggregationCacheKey(indexName, aggregations = {}) {
  const params = {
    indexName,
    aggregations
  };
  return generateCacheKey(CACHE_CONFIG.PREFIXES.AGGREGATION, params);
}

/**
 * Generate product cache key
 * @param {string} productId - Product ID
 * @returns {string} Cache key
 */
function generateProductCacheKey(productId) {
  return `${CACHE_CONFIG.PREFIXES.PRODUCT}:${productId}`;
}

/**
 * Generate category cache key
 * @param {string} categoryId - Category ID
 * @returns {string} Cache key
 */
function generateCategoryCacheKey(categoryId) {
  return `${CACHE_CONFIG.PREFIXES.CATEGORY}:${categoryId}`;
}

/**
 * Generate brand cache key
 * @param {string} brandId - Brand ID
 * @returns {string} Cache key
 */
function generateBrandCacheKey(brandId) {
  return `${CACHE_CONFIG.PREFIXES.BRAND}:${brandId}`;
}

/**
 * Cache Service class
 */
class CacheService {
  constructor(redisClient) {
    this.redis = redisClient;
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0
    };
  }

  /**
   * Initialize cache service
   * @returns {Promise<Object>} Result of initialization
   */
  async initialize() {
    try {
      loggerService.info('Initializing Elasticsearch Cache Service');

      // Test Redis connection
      await this.redis.ping();

      loggerService.info('Elasticsearch Cache Service initialized successfully');

      return {
        success: true,
        message: 'Cache Service initialized successfully'
      };
    } catch (error) {
      loggerService.error('Failed to initialize Cache Service', {
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
   * Get value from cache
   * @param {string} key - Cache key
   * @returns {Promise<Object|null>} Cached value or null if not found
   */
  async get(key) {
    try {
      const value = await this.redis.get(key);

      if (value) {
        this.stats.hits++;
        loggerService.debug('Cache hit', { key });
        return JSON.parse(value);
      } else {
        this.stats.misses++;
        loggerService.debug('Cache miss', { key });
        return null;
      }
    } catch (error) {
      loggerService.error('Failed to get value from cache', {
        key,
        error: error.message,
        stack: error.stack
      });
      return null;
    }
  }

  /**
   * Set value in cache with TTL
   * @param {string} key - Cache key
   * @param {*} value - Value to cache
   * @param {number} ttl - Time to live in seconds
   * @returns {Promise<boolean>} Success status
   */
  async set(key, value, ttl = CACHE_CONFIG.SEARCH_TTL) {
    try {
      const serialized = JSON.stringify(value);
      await this.redis.setex(key, ttl, serialized);
      this.stats.sets++;
      loggerService.debug('Value cached', { key, ttl });
      return true;
    } catch (error) {
      loggerService.error('Failed to set value in cache', {
        key,
        error: error.message,
        stack: error.stack
      });
      return false;
    }
  }

  /**
   * Delete value from cache
   * @param {string} key - Cache key
   * @returns {Promise<boolean>} Success status
   */
  async delete(key) {
    try {
      await this.redis.del(key);
      this.stats.deletes++;
      loggerService.debug('Value deleted from cache', { key });
      return true;
    } catch (error) {
      loggerService.error('Failed to delete value from cache', {
        key,
        error: error.message,
        stack: error.stack
      });
      return false;
    }
  }

  /**
   * Delete multiple keys from cache
   * @param {string[]} keys - Array of cache keys
   * @returns {Promise<boolean>} Success status
   */
  async deleteMultiple(keys) {
    try {
      if (keys.length === 0) {
        return true;
      }
      await this.redis.del(...keys);
      this.stats.deletes += keys.length;
      loggerService.debug('Multiple values deleted from cache', { count: keys.length });
      return true;
    } catch (error) {
      loggerService.error('Failed to delete multiple values from cache', {
        error: error.message,
        stack: error.stack
      });
      return false;
    }
  }

  /**
   * Delete all keys matching a pattern
   * @param {string} pattern - Key pattern (e.g., "search:*")
   * @returns {Promise<number>} Number of deleted keys
   */
  async deletePattern(pattern) {
    try {
      const keys = await this.redis.keys(pattern);
      
      if (keys.length === 0) {
        return 0;
      }
      
      await this.redis.del(...keys);
      this.stats.deletes += keys.length;
      
      loggerService.info('Deleted keys matching pattern', {
        pattern,
        count: keys.length
      });
      
      return keys.length;
    } catch (error) {
      loggerService.error('Failed to delete keys matching pattern', {
        pattern,
        error: error.message,
        stack: error.stack
      });
      return 0;
    }
  }

  /**
   * Check if key exists in cache
   * @param {string} key - Cache key
   * @returns {Promise<boolean>} True if key exists
   */
  async exists(key) {
    try {
      const exists = await this.redis.exists(key);
      return exists === 1;
    } catch (error) {
      loggerService.error('Failed to check if key exists', {
        key,
        error: error.message,
        stack: error.stack
      });
      return false;
    }
  }

  /**
   * Get TTL for a key
   * @param {string} key - Cache key
   * @returns {Promise<number|null>} TTL in seconds or null if key doesn't exist
   */
  async getTTL(key) {
    try {
      const ttl = await this.redis.ttl(key);
      return ttl >= 0 ? ttl : null;
    } catch (error) {
      loggerService.error('Failed to get TTL for key', {
        key,
        error: error.message,
        stack: error.stack
      });
      return null;
    }
  }

  /**
   * Get search results from cache
   * @param {string} query - Search query
   * @param {Object} filters - Search filters
   * @param {Object} options - Search options
   * @returns {Promise<Object|null>} Cached search results or null
   */
  async getSearchResults(query, filters = {}, options = {}) {
    const key = generateSearchCacheKey(query, filters, options);
    return await this.get(key);
  }

  /**
   * Cache search results
   * @param {string} query - Search query
   * @param {Object} filters - Search filters
   * @param {Object} options - Search options
   * @param {Object} results - Search results to cache
   * @param {number} ttl - Time to live in seconds
   * @returns {Promise<boolean>} Success status
   */
  async cacheSearchResults(query, filters, options, results, ttl = CACHE_CONFIG.SEARCH_TTL) {
    const key = generateSearchCacheKey(query, filters, options);
    return await this.set(key, results, ttl);
  }

  /**
   * Get filter results from cache
   * @param {string} indexName - Index name
   * @param {Object} filters - Filter parameters
   * @returns {Promise<Object|null>} Cached filter results or null
   */
  async getFilterResults(indexName, filters = {}) {
    const key = generateFilterCacheKey(indexName, filters);
    return await this.get(key);
  }

  /**
   * Cache filter results
   * @param {string} indexName - Index name
   * @param {Object} filters - Filter parameters
   * @param {Object} results - Filter results to cache
   * @param {number} ttl - Time to live in seconds
   * @returns {Promise<boolean>} Success status
   */
  async cacheFilterResults(indexName, filters, results, ttl = CACHE_CONFIG.FILTER_TTL) {
    const key = generateFilterCacheKey(indexName, filters);
    return await this.set(key, results, ttl);
  }

  /**
   * Get aggregation results from cache
   * @param {string} indexName - Index name
   * @param {Object} aggregations - Aggregation parameters
   * @returns {Promise<Object|null>} Cached aggregation results or null
   */
  async getAggregationResults(indexName, aggregations = {}) {
    const key = generateAggregationCacheKey(indexName, aggregations);
    return await this.get(key);
  }

  /**
   * Cache aggregation results
   * @param {string} indexName - Index name
   * @param {Object} aggregations - Aggregation parameters
   * @param {Object} results - Aggregation results to cache
   * @param {number} ttl - Time to live in seconds
   * @returns {Promise<boolean>} Success status
   */
  async cacheAggregationResults(indexName, aggregations, results, ttl = CACHE_CONFIG.AGGREGATION_TTL) {
    const key = generateAggregationCacheKey(indexName, aggregations);
    return await this.set(key, results, ttl);
  }

  /**
   * Invalidate cache for a product
   * @param {string} productId - Product ID
   * @returns {Promise<boolean>} Success status
   */
  async invalidateProduct(productId) {
    const key = generateProductCacheKey(productId);
    return await this.delete(key);
  }

  /**
   * Invalidate cache for a category
   * @param {string} categoryId - Category ID
   * @returns {Promise<boolean>} Success status
   */
  async invalidateCategory(categoryId) {
    const key = generateCategoryCacheKey(categoryId);
    return await this.delete(key);
  }

  /**
   * Invalidate cache for a brand
   * @param {string} brandId - Brand ID
   * @returns {Promise<boolean>} Success status
   */
  async invalidateBrand(brandId) {
    const key = generateBrandCacheKey(brandId);
    return await this.delete(key);
  }

  /**
   * Invalidate all search cache
   * @returns {Promise<number>} Number of deleted keys
   */
  async invalidateAllSearchCache() {
    return await this.deletePattern(`${CACHE_CONFIG.PREFIXES.SEARCH}:*`);
  }

  /**
   * Invalidate all filter cache
   * @returns {Promise<number>} Number of deleted keys
   */
  async invalidateAllFilterCache() {
    return await this.deletePattern(`${CACHE_CONFIG.PREFIXES.FILTER}:*`);
  }

  /**
   * Invalidate all aggregation cache
   * @returns {Promise<number>} Number of deleted keys
   */
  async invalidateAllAggregationCache() {
    return await this.deletePattern(`${CACHE_CONFIG.PREFIXES.AGGREGATION}:*`);
  }

  /**
   * Invalidate all cache
   * @returns {Promise<number>} Number of deleted keys
   */
  async invalidateAllCache() {
    const patterns = [
      `${CACHE_CONFIG.PREFIXES.SEARCH}:*`,
      `${CACHE_CONFIG.PREFIXES.FILTER}:*`,
      `${CACHE_CONFIG.PREFIXES.AGGREGATION}:*`,
      `${CACHE_CONFIG.PREFIXES.PRODUCT}:*`,
      `${CACHE_CONFIG.PREFIXES.CATEGORY}:*`,
      `${CACHE_CONFIG.PREFIXES.BRAND}:*`
    ];

    let totalDeleted = 0;
    for (const pattern of patterns) {
      totalDeleted += await this.deletePattern(pattern);
    }

    return totalDeleted;
  }

  /**
   * Get cache statistics
   * @returns {Object} Cache statistics
   */
  getStats() {
    const total = this.stats.hits + this.stats.misses;
    const hitRate = total > 0 ? (this.stats.hits / total * 100).toFixed(2) : 0;

    return {
      hits: this.stats.hits,
      misses: this.stats.misses,
      sets: this.stats.sets,
      deletes: this.stats.deletes,
      total,
      hitRate: `${hitRate}%`
    };
  }

  /**
   * Reset cache statistics
   */
  resetStats() {
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0
    };
    loggerService.info('Cache statistics reset');
  }

  /**
   * Get cache info from Redis
   * @returns {Promise<Object>} Redis cache information
   */
  async getCacheInfo() {
    try {
      const info = await this.redis.info('stats');
      const keyspace = await this.redis.info('keyspace');
      
      return {
        success: true,
        stats: info,
        keyspace,
        serviceStats: this.getStats()
      };
    } catch (error) {
      loggerService.error('Failed to get cache info', {
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
   * Flush all cache
   * @returns {Promise<boolean>} Success status
   */
  async flushAll() {
    try {
      await this.redis.flushdb();
      loggerService.info('Cache flushed');
      return true;
    } catch (error) {
      loggerService.error('Failed to flush cache', {
        error: error.message,
        stack: error.stack
      });
      return false;
    }
  }
}

module.exports = {
  CacheService,
  CACHE_CONFIG,
  generateCacheKey,
  generateSearchCacheKey,
  generateFilterCacheKey,
  generateAggregationCacheKey,
  generateProductCacheKey,
  generateCategoryCacheKey,
  generateBrandCacheKey
};
