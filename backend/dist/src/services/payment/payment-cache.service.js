"use strict";
/**
 * Payment Cache Service
 *
 * This service manages payment response caching with TTL-based expiration,
 * cache invalidation, and cache statistics tracking.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.paymentCacheService = exports.PaymentCacheService = void 0;
const crypto_1 = require("crypto");
const logger_1 = require("../../utils/logger");
const database_service_1 = require("../database.service");
const prisma = database_service_1.databaseService.getClient();
/**
 * Payment Cache Service Class
 */
class PaymentCacheService {
    constructor() {
        this.DEFAULT_TTL = 600000; // 10 minutes in milliseconds
        this.GATEWAY_CONFIG_TTL = 3600000; // 1 hour in milliseconds
        this.USER_PAYMENT_METHODS_TTL = 1800000; // 30 minutes in milliseconds
        this.PAYMENT_METHOD_AVAILABILITY_TTL = 300000; // 5 minutes in milliseconds
        this.FREQUENTLY_ACCESSED_TTL = 600000; // 10 minutes in milliseconds
        this.PAYMENT_RESPONSE_TTL = 60000; // 1 minute in milliseconds
        this.cacheHits = 0;
        this.cacheMisses = 0;
    }
    /**
     * Cache payment response
     * @param cacheKey - The cache key
     * @param response - Payment response to cache
     * @param ttl - Time to live in milliseconds
     * @returns Created cache entry
     */
    async cachePaymentResponse(cacheKey, response, ttl) {
        try {
            const expiresAt = new Date(Date.now() + (ttl || this.DEFAULT_TTL));
            // Delete existing cache entry if exists
            await prisma.payment_cache.deleteMany({
                where: { cache_key: cacheKey }
            });
            // Create new cache entry
            const cacheEntry = await prisma.payment_cache.create({
                data: {
                    id: (0, crypto_1.randomUUID)(),
                    cache_key: cacheKey,
                    cached_response: response,
                    expires_at: expiresAt,
                    created_at: new Date()
                }
            });
            logger_1.logger.info('Payment response cached successfully', {
                cacheKey,
                ttl: ttl || this.DEFAULT_TTL,
                expiresAt
            });
            return cacheEntry;
        }
        catch (error) {
            logger_1.logger.error('Error caching payment response', {
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
    async getCachedResponse(cacheKey) {
        try {
            const cacheEntry = await prisma.payment_cache.findUnique({
                where: { cache_key: cacheKey }
            });
            if (!cacheEntry) {
                this.cacheMisses++;
                logger_1.logger.debug('Cache miss', { cacheKey });
                return null;
            }
            // Check if cache entry is expired
            if (new Date() > cacheEntry.expires_at) {
                this.cacheMisses++;
                logger_1.logger.debug('Cache entry expired', {
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
            logger_1.logger.debug('Cache hit', { cacheKey });
            return cacheEntry.cached_response;
        }
        catch (error) {
            logger_1.logger.error('Error getting cached response', {
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
    async invalidateCache(cacheKey) {
        try {
            await prisma.payment_cache.deleteMany({
                where: { cache_key: cacheKey }
            });
            logger_1.logger.info('Cache entry invalidated', { cacheKey });
        }
        catch (error) {
            logger_1.logger.error('Error invalidating cache', {
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
    async invalidateCacheByPattern(pattern) {
        try {
            // Get all cache entries
            const allEntries = await prisma.payment_cache.findMany();
            // Match pattern (simple contains check)
            const matchingEntries = allEntries.filter(entry => entry.cache_key.includes(pattern));
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
            logger_1.logger.info('Cache entries invalidated by pattern', {
                pattern,
                count: result.count
            });
            return result.count;
        }
        catch (error) {
            logger_1.logger.error('Error invalidating cache by pattern', {
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
    async clearExpiredCache() {
        try {
            const result = await prisma.payment_cache.deleteMany({
                where: {
                    expires_at: { lt: new Date() }
                }
            });
            logger_1.logger.info('Expired cache entries cleared', {
                count: result.count
            });
            return result.count;
        }
        catch (error) {
            logger_1.logger.error('Error clearing expired cache', {
                error: error instanceof Error ? error.message : 'Unknown error'
            });
            throw error;
        }
    }
    /**
     * Get cache statistics
     * @returns Cache statistics
     */
    async getCacheStatistics() {
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
                const size = JSON.stringify(entry.cached_response).length;
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
        }
        catch (error) {
            logger_1.logger.error('Error getting cache statistics', {
                error: error instanceof Error ? error.message : 'Unknown error'
            });
            throw error;
        }
    }
    /**
     * Warm cache with frequently accessed data
     * @param keys - Array of cache keys to warm
     */
    async warmCache(keys) {
        try {
            logger_1.logger.info('Warming cache', { keysCount: keys.length });
            // In a real implementation, this would fetch data from source
            // and populate the cache. For now, we'll just log the operation.
            for (const key of keys) {
                // Check if cache entry exists
                const existing = await prisma.payment_cache.findUnique({
                    where: { cache_key: key }
                });
                if (!existing) {
                    // Cache entry doesn't exist, could be warmed with default data
                    logger_1.logger.debug('Cache entry not found for warming', { key });
                }
            }
            logger_1.logger.info('Cache warming completed', {
                keysCount: keys.length
            });
        }
        catch (error) {
            logger_1.logger.error('Error warming cache', {
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
    async getCacheHitRate() {
        try {
            const totalRequests = this.cacheHits + this.cacheMisses;
            if (totalRequests === 0) {
                return 0;
            }
            return (this.cacheHits / totalRequests) * 100;
        }
        catch (error) {
            logger_1.logger.error('Error getting cache hit rate', {
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
    async cacheGatewayConfig(gateway, config) {
        try {
            const cacheKey = `gateway_config:${gateway}`;
            await this.cachePaymentResponse(cacheKey, {
                success: true,
                gatewayResponse: config,
                timestamp: Date.now()
            }, this.GATEWAY_CONFIG_TTL);
        }
        catch (error) {
            logger_1.logger.error('Error caching gateway config', {
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
    async getCachedGatewayConfig(gateway) {
        try {
            const cacheKey = `gateway_config:${gateway}`;
            const cached = await this.getCachedResponse(cacheKey);
            return cached?.gatewayResponse || null;
        }
        catch (error) {
            logger_1.logger.error('Error getting cached gateway config', {
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
    async cacheUserPaymentMethods(userId, paymentMethods) {
        try {
            const cacheKey = `user_payment_methods:${userId}`;
            await this.cachePaymentResponse(cacheKey, {
                success: true,
                gatewayResponse: paymentMethods,
                timestamp: Date.now()
            }, this.USER_PAYMENT_METHODS_TTL);
        }
        catch (error) {
            logger_1.logger.error('Error caching user payment methods', {
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
    async getCachedUserPaymentMethods(userId) {
        try {
            const cacheKey = `user_payment_methods:${userId}`;
            const cached = await this.getCachedResponse(cacheKey);
            return cached?.gatewayResponse || null;
        }
        catch (error) {
            logger_1.logger.error('Error getting cached user payment methods', {
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
    async cachePaymentMethodAvailability(method, availability) {
        try {
            const cacheKey = `payment_method_availability:${method}`;
            await this.cachePaymentResponse(cacheKey, {
                success: true,
                gatewayResponse: { available: availability },
                timestamp: Date.now()
            }, this.PAYMENT_METHOD_AVAILABILITY_TTL);
        }
        catch (error) {
            logger_1.logger.error('Error caching payment method availability', {
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
    async getCachedPaymentMethodAvailability(method) {
        try {
            const cacheKey = `payment_method_availability:${method}`;
            const cached = await this.getCachedResponse(cacheKey);
            return cached?.gatewayResponse?.available ?? null;
        }
        catch (error) {
            logger_1.logger.error('Error getting cached payment method availability', {
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
    async invalidateUserCache(userId) {
        try {
            const pattern = `user_payment_methods:${userId}`;
            return await this.invalidateCacheByPattern(pattern);
        }
        catch (error) {
            logger_1.logger.error('Error invalidating user cache', {
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
    async invalidateGatewayCache(gateway) {
        try {
            const pattern = `gateway_config:${gateway}`;
            return await this.invalidateCacheByPattern(pattern);
        }
        catch (error) {
            logger_1.logger.error('Error invalidating gateway cache', {
                error: error instanceof Error ? error.message : 'Unknown error',
                gateway
            });
            throw error;
        }
    }
    /**
     * Reset cache statistics
     */
    resetCacheStatistics() {
        this.cacheHits = 0;
        this.cacheMisses = 0;
        logger_1.logger.info('Cache statistics reset');
    }
}
exports.PaymentCacheService = PaymentCacheService;
// Export singleton instance
exports.paymentCacheService = new PaymentCacheService();
