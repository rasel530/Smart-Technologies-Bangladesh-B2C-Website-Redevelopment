/**
 * Payment Cache Service
 * 
 * This service manages payment response caching with TTL-based expiration,
 * cache invalidation, and cache statistics tracking.
 */

import { payment_cache } from '@prisma/client';
import { randomUUID } from 'crypto';
import { logger } from '../../utils/logger';
import { databaseService } from '../database.service';

const prisma = databaseService.getClient();

/**
 * Payment Response Interface
 */
export interface PaymentResponse {
  success: boolean;
  transactionId?: string;
  gatewayResponse?: any;
  error?: string;
  timestamp: number;
}

/**
 * Cache Statistics Interface
 */
export interface CacheStatistics {
  totalEntries: number;
  activeEntries: number;
  expiredEntries: number;
  hitRate: number;
  missRate: number;
  averageTTL: number;
  memoryUsage: number;
}

/**
 * Payment Cache Service Class
 */
export class PaymentCacheService {
  private readonly DEFAULT_TTL = 600000; // 10 minutes in milliseconds
  private readonly GATEWAY_CONFIG_TTL = 3600000; // 1 hour in milliseconds
  private readonly USER_PAYMENT_METHODS_TTL = 1800000; // 30 minutes in milliseconds
  private readonly PAYMENT_METHOD_AVAILABILITY_TTL = 300000; // 5 minutes in milliseconds
  private readonly FREQUENTLY_ACCESSED_TTL = 600000; // 10 minutes in milliseconds
  private readonly PAYMENT_RESPONSE_TTL = 60000; // 1 minute in milliseconds

  private cacheHits = 0;
  private cacheMisses = 0;

  /**
   * Cache payment response
   * @param cacheKey - The cache key
   * @param response - Payment response to cache
   * @param ttl - Time to live in milliseconds
   * @returns Created cache entry
   */
  async cachePaymentResponse(
    cacheKey: string,
    response: PaymentResponse,
    ttl?: number
  ): Promise<payment_cache> {
    try {
      const expiresAt = new Date(Date.now() + (ttl || this.DEFAULT_TTL));

      // Delete existing cache entry if exists
      await prisma.payment_cache.deleteMany({
        where: { cache_key: cacheKey }
      });

      // Create new cache entry
      const cacheEntry = await prisma.payment_cache.create({
        data: {
          id: randomUUID(),
          cache_key: cacheKey,
          cached_response: response as any,
          expires_at: expiresAt,
          created_at: new Date()
        }
      });

      logger.info('Payment response cached successfully', {
        cacheKey,
        ttl: ttl || this.DEFAULT_TTL,
        expiresAt
      });

      return cacheEntry;
    } catch (error) {
      logger.error('Error caching payment response', {
        error: error instanceof Error ? error.message : 'Unknown error',
        cacheKey
      });
      throw error;
    }
  }

  /**
   * Get cached payment response
   * @param cacheKey - The cache key
   * @returns Cached payment response or null if not found/expired
   */
  async getCachedResponse(cacheKey: string): Promise<PaymentResponse | null> {
    try {
      const cacheEntry = await prisma.payment_cache.findUnique({
        where: { cache_key: cacheKey }
      });

      if (!cacheEntry) {
        this.cacheMisses++;
        logger.debug('Cache miss', { cacheKey });
        return null;
      }

      // Check if cache entry is expired
      if (new Date() > cacheEntry.expires_at) {
        this.cacheMisses++;
        logger.debug('Cache entry expired', {
          cacheKey,
          expiresAt: cacheEntry.expires_at
        });
        // Delete expired entry
        await prisma.payment_cache.delete({
          where: { cache_key: cacheKey }
        });
        return null;
      }

      this.cacheHits++;
      logger.debug('Cache hit', { cacheKey });
      return cacheEntry.cached_response as unknown as PaymentResponse;
    } catch (error) {
      logger.error('Error getting cached response', {
        error: error instanceof Error ? error.message : 'Unknown error',
        cacheKey
      });
      throw error;
    }
  }

  /**
   * Invalidate cache entry
   * @param cacheKey - The cache key to invalidate
   */
  async invalidateCache(cacheKey: string): Promise<void> {
    try {
      await prisma.payment_cache.deleteMany({
        where: { cache_key: cacheKey }
      });

      logger.info('Cache entry invalidated', { cacheKey });
    } catch (error) {
      logger.error('Error invalidating cache', {
        error: error instanceof Error ? error.message : 'Unknown error',
        cacheKey
      });
      throw error;
    }
  }

  /**
   * Invalidate cache entries by pattern
   * @param pattern - The pattern to match
   * @returns Number of entries invalidated
   */
  async invalidateCacheByPattern(pattern: string): Promise<number> {
    try {
      // Get all cache entries
      const allEntries = await prisma.payment_cache.findMany();

      // Match pattern (simple contains check)
      const matchingEntries = allEntries.filter(entry =>
        entry.cache_key.includes(pattern)
      );

      if (matchingEntries.length === 0) {
        return 0;
      }

      // Delete matching entries
      const result = await prisma.payment_cache.deleteMany({
        where: {
          id: {
            in: matchingEntries.map(entry => entry.id)
          }
        }
      });

      logger.info('Cache entries invalidated by pattern', {
        pattern,
        count: result.count
      });

      return result.count;
    } catch (error) {
      logger.error('Error invalidating cache by pattern', {
        error: error instanceof Error ? error.message : 'Unknown error',
        pattern
      });
      throw error;
    }
  }

  /**
   * Clear expired cache entries
   * @returns Number of entries cleared
   */
  async clearExpiredCache(): Promise<number> {
    try {
      const result = await prisma.payment_cache.deleteMany({
        where: {
          expires_at: { lt: new Date() }
        }
      });

      logger.info('Expired cache entries cleared', {
        count: result.count
      });

      return result.count;
    } catch (error) {
      logger.error('Error clearing expired cache', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  /**
   * Get cache statistics
   * @returns Cache statistics
   */
  async getCacheStatistics(): Promise<CacheStatistics> {
    try {
      const totalEntries = await prisma.payment_cache.count();
      const expiredEntries = await prisma.payment_cache.count({
        where: {
          expires_at: { lt: new Date() }
        }
      });
      const activeEntries = totalEntries - expiredEntries;

      // Calculate hit rate
      const totalRequests = this.cacheHits + this.cacheMisses;
      const hitRate = totalRequests > 0 ? (this.cacheHits / totalRequests) * 100 : 0;
      const missRate = 100 - hitRate;

      // Calculate average TTL
      const allEntries = await prisma.payment_cache.findMany({
        select: {
          created_at: true,
          expires_at: true
        }
      });

      const averageTTL = allEntries.length > 0
        ? allEntries.reduce((sum, entry) => {
            const ttl = entry.expires_at.getTime() - entry.created_at.getTime();
            return sum + ttl;
          }, 0) / allEntries.length
        : 0;

      // Calculate memory usage (approximate based on JSON size)
      const memoryUsage = allEntries.reduce((sum, entry) => {
        const size = JSON.stringify((entry as any).cached_response).length;
        return sum + size;
      }, 0);

      return {
        totalEntries,
        activeEntries,
        expiredEntries,
        hitRate,
        missRate,
        averageTTL,
        memoryUsage
      };
    } catch (error) {
      logger.error('Error getting cache statistics', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  /**
   * Warm cache with frequently accessed data
   * @param keys - Array of cache keys to warm
   */
  async warmCache(keys: string[]): Promise<void> {
    try {
      logger.info('Warming cache', { keysCount: keys.length });

      // In a real implementation, this would fetch data from source
      // and populate the cache. For now, we'll just log the operation.

      for (const key of keys) {
        // Check if cache entry exists
        const existing = await prisma.payment_cache.findUnique({
          where: { cache_key: key }
        });

        if (!existing) {
          // Cache entry doesn't exist, could be warmed with default data
          logger.debug('Cache entry not found for warming', { key });
        }
      }

      logger.info('Cache warming completed', {
        keysCount: keys.length
      });
    } catch (error) {
      logger.error('Error warming cache', {
        error: error instanceof Error ? error.message : 'Unknown error',
        keysCount: keys.length
      });
      throw error;
    }
  }

  /**
   * Get cache hit rate
   * @returns Cache hit rate percentage
   */
  async getCacheHitRate(): Promise<number> {
    try {
      const totalRequests = this.cacheHits + this.cacheMisses;
      if (totalRequests === 0) {
        return 0;
      }

      return (this.cacheHits / totalRequests) * 100;
    } catch (error) {
      logger.error('Error getting cache hit rate', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  /**
   * Cache gateway configuration
   * @param gateway - Gateway name
   * @param config - Gateway configuration
   */
  async cacheGatewayConfig(gateway: string, config: any): Promise<void> {
    try {
      const cacheKey = `gateway_config:${gateway}`;
      await this.cachePaymentResponse(
        cacheKey,
        {
          success: true,
          gatewayResponse: config,
          timestamp: Date.now()
        },
        this.GATEWAY_CONFIG_TTL
      );
    } catch (error) {
      logger.error('Error caching gateway config', {
        error: error instanceof Error ? error.message : 'Unknown error',
        gateway
      });
      throw error;
    }
  }

  /**
   * Get cached gateway configuration
   * @param gateway - Gateway name
   * @returns Gateway configuration or null
   */
  async getCachedGatewayConfig(gateway: string): Promise<any | null> {
    try {
      const cacheKey = `gateway_config:${gateway}`;
      const cached = await this.getCachedResponse(cacheKey);
      return cached?.gatewayResponse || null;
    } catch (error) {
      logger.error('Error getting cached gateway config', {
        error: error instanceof Error ? error.message : 'Unknown error',
        gateway
      });
      throw error;
    }
  }

  /**
   * Cache user payment methods
   * @param userId - User ID
   * @param paymentMethods - Payment methods
   */
  async cacheUserPaymentMethods(userId: string, paymentMethods: any[]): Promise<void> {
    try {
      const cacheKey = `user_payment_methods:${userId}`;
      await this.cachePaymentResponse(
        cacheKey,
        {
          success: true,
          gatewayResponse: paymentMethods,
          timestamp: Date.now()
        },
        this.USER_PAYMENT_METHODS_TTL
      );
    } catch (error) {
      logger.error('Error caching user payment methods', {
        error: error instanceof Error ? error.message : 'Unknown error',
        userId
      });
      throw error;
    }
  }

  /**
   * Get cached user payment methods
   * @param userId - User ID
   * @returns Payment methods or null
   */
  async getCachedUserPaymentMethods(userId: string): Promise<any[] | null> {
    try {
      const cacheKey = `user_payment_methods:${userId}`;
      const cached = await this.getCachedResponse(cacheKey);
      return cached?.gatewayResponse || null;
    } catch (error) {
      logger.error('Error getting cached user payment methods', {
        error: error instanceof Error ? error.message : 'Unknown error',
        userId
      });
      throw error;
    }
  }

  /**
   * Cache payment method availability
   * @param method - Payment method
   * @param availability - Availability status
   */
  async cachePaymentMethodAvailability(method: string, availability: boolean): Promise<void> {
    try {
      const cacheKey = `payment_method_availability:${method}`;
      await this.cachePaymentResponse(
        cacheKey,
        {
          success: true,
          gatewayResponse: { available: availability },
          timestamp: Date.now()
        },
        this.PAYMENT_METHOD_AVAILABILITY_TTL
      );
    } catch (error) {
      logger.error('Error caching payment method availability', {
        error: error instanceof Error ? error.message : 'Unknown error',
        method
      });
      throw error;
    }
  }

  /**
   * Get cached payment method availability
   * @param method - Payment method
   * @returns Availability status or null
   */
  async getCachedPaymentMethodAvailability(method: string): Promise<boolean | null> {
    try {
      const cacheKey = `payment_method_availability:${method}`;
      const cached = await this.getCachedResponse(cacheKey);
      return cached?.gatewayResponse?.available ?? null;
    } catch (error) {
      logger.error('Error getting cached payment method availability', {
        error: error instanceof Error ? error.message : 'Unknown error',
        method
      });
      throw error;
    }
  }

  /**
   * Invalidate all cache entries for a user
   * @param userId - User ID
   */
  async invalidateUserCache(userId: string): Promise<number> {
    try {
      const pattern = `user_payment_methods:${userId}`;
      return await this.invalidateCacheByPattern(pattern);
    } catch (error) {
      logger.error('Error invalidating user cache', {
        error: error instanceof Error ? error.message : 'Unknown error',
        userId
      });
      throw error;
    }
  }

  /**
   * Invalidate all cache entries for a gateway
   * @param gateway - Gateway name
   */
  async invalidateGatewayCache(gateway: string): Promise<number> {
    try {
      const pattern = `gateway_config:${gateway}`;
      return await this.invalidateCacheByPattern(pattern);
    } catch (error) {
      logger.error('Error invalidating gateway cache', {
        error: error instanceof Error ? error.message : 'Unknown error',
        gateway
      });
      throw error;
    }
  }

  /**
   * Reset cache statistics
   */
  resetCacheStatistics(): void {
    this.cacheHits = 0;
    this.cacheMisses = 0;
    logger.info('Cache statistics reset');
  }
}

// Export singleton instance
export const paymentCacheService = new PaymentCacheService();
