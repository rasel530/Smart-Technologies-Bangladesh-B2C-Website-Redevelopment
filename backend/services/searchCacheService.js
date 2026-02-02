/**
 * Search Cache Service (JavaScript version)
 * 
 * This module provides Redis-based caching for search results with intelligent cache key generation,
 * cache warming, smart pagination caching, and cache invalidation strategies for Smart Tech
 * B2C e-commerce platform.
 */

const { loggerService } = require('./logger');

/**
 * Cache configuration
 */
const CACHE_CONFIG = {
  /** Default cache TTL in seconds (5 minutes) */
  DEFAULT_TTL: 300,
  /** Cache key prefix */
  KEY_PREFIX: 'search:',
  /** Cache key separator */
  KEY_SEPARATOR: ':',
  /** Maximum cache key length */
  MAX_KEY_LENGTH: 250,
  /** Enable cache statistics */
  ENABLE_STATS: true,
  /** Cache warming interval in seconds */
  WARMING_INTERVAL: 3600,
  /** Popular queries threshold */
  POPULAR_QUERY_THRESHOLD: 10,
  /** Metadata cache TTL in seconds */
  METADATA_TTL: 600
};

/**
 * Search Cache Service class
 */
class SearchCacheService {
  constructor(redisClient) {
    this.redisClient = redisClient;
    this.stats = {
      hits: 0,
      misses: 0,
      hitRate: 0,
      totalItems: 0,
      cacheSize: 0,
      averageItemSize: 0
    };
    this.isInitialized = false;
    this.warmingInterval = null;
  }

  /**
   * Initialize cache service
   */
  async initialize() {
    try {
      if (!this.redisClient) {
        throw new Error('Redis client not provided');
      }

      // Test Redis connection
      await this.redisClient.ping();
      
      this.isInitialized = true;
      loggerService.info('Search cache service initialized successfully');
    } catch (error) {
      loggerService.error('Failed to initialize search cache service', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  /**
   * Get search results from cache
   * @param cacheKey - Cache key
   * @returns Cached search results or null
   */
  async get(cacheKey) {
    if (!this.isInitialized) {
      return null;
    }

    try {
      const fullKey = `${CACHE_CONFIG.KEY_PREFIX}${cacheKey}`;
      const cached = await this.redisClient.get(fullKey);

      if (cached) {
        this.stats.hits++;
        this.updateHitRate();

        const result = JSON.parse(cached);
        loggerService.debug('Search cache hit', { cacheKey });

        return result;
      } else {
        this.stats.misses++;
        this.updateHitRate();

        loggerService.debug('Search cache miss', { cacheKey });
        return null;
      }
    } catch (error) {
      loggerService.error('Failed to get from search cache', {
        error: error instanceof Error ? error.message : 'Unknown error',
        cacheKey
      });
      this.stats.misses++;
      this.updateHitRate();
      return null;
    }
  }

  /**
   * Set search results in cache
   * @param cacheKey - Cache key
   * @param result - Search result to cache
   * @param ttl - Time to live in seconds (default: 300)
   */
  async set(cacheKey, result, ttl = CACHE_CONFIG.DEFAULT_TTL) {
    if (!this.isInitialized) {
      return;
    }

    try {
      const fullKey = `${CACHE_CONFIG.KEY_PREFIX}${cacheKey}`;
      const serialized = JSON.stringify(result);

      await this.redisClient.setex(fullKey, ttl, serialized);

      // Update statistics
      this.stats.totalItems++;
      this.stats.cacheSize += Buffer.byteLength(serialized, 'utf8');
      this.stats.averageItemSize = this.stats.cacheSize / this.stats.totalItems;

      loggerService.debug('Search result cached', { 
        cacheKey, 
        ttl,
        size: Buffer.byteLength(serialized, 'utf8')
      });
    } catch (error) {
      loggerService.error('Failed to set search cache', {
        error: error instanceof Error ? error.message : 'Unknown error',
        cacheKey
      });
    }
  }

  /**
   * Get metadata from cache (total count, facets)
   * @param cacheKey - Cache key
   * @returns Cached metadata or null
   */
  async getMetadata(cacheKey) {
    if (!this.isInitialized) {
      return null;
    }

    try {
      const fullKey = `${CACHE_CONFIG.KEY_PREFIX}metadata:${cacheKey}`;
      const cached = await this.redisClient.get(fullKey);

      if (cached) {
        this.stats.hits++;
        this.updateHitRate();

        const metadata = JSON.parse(cached);
        loggerService.debug('Search metadata cache hit', { cacheKey });

        return metadata;
      } else {
        this.stats.misses++;
        this.updateHitRate();
        return null;
      }
    } catch (error) {
      loggerService.error('Failed to get metadata from cache', {
        error: error instanceof Error ? error.message : 'Unknown error',
        cacheKey
      });
      this.stats.misses++;
      this.updateHitRate();
      return null;
    }
  }

  /**
   * Set metadata in cache
   * @param cacheKey - Cache key
   * @param metadata - Metadata to cache
   */
  async setMetadata(cacheKey, metadata) {
    if (!this.isInitialized) {
      return;
    }

    try {
      const fullKey = `${CACHE_CONFIG.KEY_PREFIX}metadata:${cacheKey}`;
      const serialized = JSON.stringify(metadata);

      await this.redisClient.setex(fullKey, CACHE_CONFIG.METADATA_TTL, serialized);

      loggerService.debug('Search metadata cached', { cacheKey });
    } catch (error) {
      loggerService.error('Failed to set metadata cache', {
        error: error instanceof Error ? error.message : 'Unknown error',
        cacheKey
      });
    }
  }

  /**
   * Generate cache key from search parameters
   * @param params - Search cache key parameters
   * @returns Generated cache key
   */
  generateCacheKey(params) {
    const {
      query,
      categoryIds,
      brandIds,
      priceRange,
      specifications,
      inStockOnly,
      featuredOnly,
      sort,
      page,
      pageSize,
      language
    } = params;

    // Build key parts
    const parts = [];

    // Add query (normalized)
    if (query) {
      parts.push(`q:${this.normalizeForCacheKey(query)}`);
    }

    // Add categories
    if (categoryIds && categoryIds.length > 0) {
      parts.push(`cat:${categoryIds.sort().join(',')}`);
    }

    // Add brands
    if (brandIds && brandIds.length > 0) {
      parts.push(`br:${brandIds.sort().join(',')}`);
    }

    // Add price range
    if (priceRange) {
      const min = priceRange.min ?? '*';
      const max = priceRange.max ?? '*';
      parts.push(`pr:${min}-${max}`);
    }

    // Add specifications
    if (specifications && specifications.length > 0) {
      const specs = specifications
        .map(s => `${s.name}:${s.values.sort().join(',')}`)
        .sort()
        .join('|');
      parts.push(`spec:${specs}`);
    }

    // Add filters
    if (inStockOnly) {
      parts.push('stock:1');
    }
    if (featuredOnly) {
      parts.push('feat:1');
    }

    // Add sort
    if (sort) {
      parts.push(`sort:${sort}`);
    }

    // Add pagination
    const pg = page ?? 1;
    const ps = pageSize ?? 20;
    parts.push(`pg:${pg}:${ps}`);

    // Add language
    if (language) {
      parts.push(`lang:${language}`);
    }

    // Join parts
    let cacheKey = parts.join(CACHE_CONFIG.KEY_SEPARATOR);

    // Truncate if too long
    if (cacheKey.length > CACHE_CONFIG.MAX_KEY_LENGTH) {
      const hash = this.hashString(cacheKey);
      cacheKey = cacheKey.substring(0, CACHE_CONFIG.MAX_KEY_LENGTH - 33) + ':' + hash;
    }

    return cacheKey;
  }

  /**
   * Generate metadata cache key
   * @param params - Search cache key parameters (without pagination)
   * @returns Generated metadata cache key
   */
  generateMetadataKey(params) {
    return this.generateCacheKey(params);
  }

  /**
   * Invalidate cache for a specific product
   * @param productId - Product ID to invalidate
   */
  async invalidateProduct(productId) {
    if (!this.isInitialized) {
      return;
    }

    try {
      // Get all search keys
      const pattern = `${CACHE_CONFIG.KEY_PREFIX}*`;
      const keys = await this.redisClient.keys(pattern);

      if (keys.length === 0) {
        return;
      }

      // For each key, check if it contains the product ID
      // This is a simplified approach - in production, you might want to maintain
      // a separate index of which queries contain which products
      const pipeline = this.redisClient.pipeline();
      let deletedCount = 0;

      for (const key of keys) {
        const value = await this.redisClient.get(key);
        if (value) {
          try {
            const result = JSON.parse(value);
            const containsProduct = result.results.some(r => r.id === productId);

            if (containsProduct) {
              pipeline.del(key);
              deletedCount++;
            }
          } catch (parseError) {
            // Skip invalid entries
            continue;
          }
        }
      }

      if (deletedCount > 0) {
        await pipeline.exec();
        loggerService.info('Invalidated cache for product', { 
          productId, 
          deletedCount 
        });
      }
    } catch (error) {
      loggerService.error('Failed to invalidate product cache', {
        error: error instanceof Error ? error.message : 'Unknown error',
        productId
      });
    }
  }

  /**
   * Invalidate cache for a category
   * @param categoryId - Category ID to invalidate
   */
  async invalidateCategory(categoryId) {
    if (!this.isInitialized) {
      return;
    }

    try {
      const pattern = `${CACHE_CONFIG.KEY_PREFIX}*cat:*${categoryId}*`;
      const keys = await this.redisClient.keys(pattern);

      if (keys.length > 0) {
        await this.redisClient.del(...keys);
        loggerService.info('Invalidated cache for category', { 
          categoryId, 
          deletedCount: keys.length 
        });
      }
    } catch (error) {
      loggerService.error('Failed to invalidate category cache', {
        error: error instanceof Error ? error.message : 'Unknown error',
        categoryId
      });
    }
  }

  /**
   * Invalidate cache for a brand
   * @param brandId - Brand ID to invalidate
   */
  async invalidateBrand(brandId) {
    if (!this.isInitialized) {
      return;
    }

    try {
      const pattern = `${CACHE_CONFIG.KEY_PREFIX}*br:*${brandId}*`;
      const keys = await this.redisClient.keys(pattern);

      if (keys.length > 0) {
        await this.redisClient.del(...keys);
        loggerService.info('Invalidated cache for brand', { 
          brandId, 
          deletedCount: keys.length 
        });
      }
    } catch (error) {
      loggerService.error('Failed to invalidate brand cache', {
        error: error instanceof Error ? error.message : 'Unknown error',
        brandId
      });
    }
  }

  /**
   * Invalidate all search cache
   */
  async invalidateAll() {
    if (!this.isInitialized) {
      return 0;
    }

    try {
      const pattern = `${CACHE_CONFIG.KEY_PREFIX}*`;
      const keys = await this.redisClient.keys(pattern);

      if (keys.length === 0) {
        return 0;
      }

      await this.redisClient.del(...keys);

      // Reset statistics
      this.stats = {
        hits: 0,
        misses: 0,
        hitRate: 0,
        totalItems: 0,
        cacheSize: 0,
        averageItemSize: 0
      };

      loggerService.info('Invalidated all search cache', { deletedCount: keys.length });

      return keys.length;
    } catch (error) {
      loggerService.error('Failed to invalidate all cache', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return 0;
    }
  }

  /**
   * Warm cache with popular queries
   * @param popularQueries - Array of popular search queries
   * @param searchFunction - Function to execute search for warming
   */
  async warmCache(popularQueries, searchFunction) {
    if (!this.isInitialized) {
      return;
    }

    try {
      loggerService.info('Starting cache warming', { queryCount: popularQueries.length });

      let warmedCount = 0;
      for (const { query, count } of popularQueries) {
        // Only warm popular queries
        if (count >= CACHE_CONFIG.POPULAR_QUERY_THRESHOLD) {
          try {
            const result = await searchFunction(query);
            const cacheKey = this.generateCacheKey({ query });
            await this.set(cacheKey, result);
            warmedCount++;
          } catch (error) {
            loggerService.warn('Failed to warm cache for query', {
              query,
              error: error instanceof Error ? error.message : 'Unknown error'
            });
          }
        }
      }

      loggerService.info('Cache warming completed', { warmedCount });
    } catch (error) {
      loggerService.error('Failed to warm cache', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Start automatic cache warming
   * @param popularQueries - Array of popular search queries
   * @param searchFunction - Function to execute search for warming
   */
  startCacheWarming(popularQueries, searchFunction) {
    if (this.warmingInterval) {
      clearInterval(this.warmingInterval);
    }

    this.warmingInterval = setInterval(() => {
      this.warmCache(popularQueries, searchFunction);
    }, CACHE_CONFIG.WARMING_INTERVAL * 1000);

    loggerService.info('Started automatic cache warming', {
      interval: CACHE_CONFIG.WARMING_INTERVAL
    });
  }

  /**
   * Stop automatic cache warming
   */
  stopCacheWarming() {
    if (this.warmingInterval) {
      clearInterval(this.warmingInterval);
      this.warmingInterval = null;
      loggerService.info('Stopped automatic cache warming');
    }
  }

  /**
   * Get cache statistics
   * @returns Cache statistics
   */
  getStatistics() {
    return { ...this.stats };
  }

  /**
   * Reset cache statistics
   */
  resetStatistics() {
    this.stats = {
      hits: 0,
      misses: 0,
      hitRate: 0,
      totalItems: 0,
      cacheSize: 0,
      averageItemSize: 0
    };
    loggerService.info('Cache statistics reset');
  }

  /**
   * Update hit rate
   */
  updateHitRate() {
    const total = this.stats.hits + this.stats.misses;
    if (total > 0) {
      this.stats.hitRate = this.stats.hits / total;
    }
  }

  /**
   * Normalize string for cache key
   * @param str - String to normalize
   * @returns Normalized string
   */
  normalizeForCacheKey(str) {
    return str
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^\w\-]/g, '')
      .substring(0, 50);
  }

  /**
   * Hash string using simple hash function
   * @param str - String to hash
   * @returns Hashed string
   */
  hashString(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash).toString(16);
  }

  /**
   * Shutdown cache service
   */
  async shutdown() {
    this.stopCacheWarming();
    this.isInitialized = false;
    loggerService.info('Search cache service shut down');
  }
}

module.exports = { SearchCacheService };
