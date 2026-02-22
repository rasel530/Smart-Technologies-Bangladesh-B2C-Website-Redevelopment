/**
 * Cart Cache Middleware
 * 
 * Middleware for cart response caching with:
 * - ETag generation for cart responses
 * - Cache-Control headers
 * - Conditional GET support (304 Not Modified)
 * - Cache invalidation on modifications
 * 
 * @module middleware/cartCache
 */

const crypto = require('crypto');
const { cartCacheService } = require('../services/cartCacheService');
const { loggerService } = require('../services/logger');

const logger = loggerService;

/**
 * Generate ETag for cart data
 */
function generateETag(data) {
  const hash = crypto.createHash('md5');
  hash.update(JSON.stringify(data));
  return `"${hash.digest('hex')}"`;
}

/**
 * Generate cache key for request
 */
function generateCacheKey(req) {
  const userId = req.user?.id;
  const sessionId = req.session?.id || req.headers['x-session-id'];
  return userId ? `cart:user:${userId}` : `cart:session:${sessionId}`;
}

/**
 * Cart cache middleware - adds caching headers to cart responses
 */
function cartCacheMiddleware(options = {}) {
  const {
    ttl = 60, // 1 minute default for cart data
    staleWhileRevalidate = 300, // 5 minutes
  } = options;

  return async (req, res, next) => {
    // Skip for non-GET methods
    if (req.method !== 'GET') {
      return next();
    }

    // Store original json method
    const originalJson = res.json.bind(res);

    // Override json method to add caching headers
    res.json = function(data) {
      try {
        // Only cache successful responses with cart data
        if (res.statusCode === 200 && data) {
          // Generate ETag
          const etag = generateETag(data);
          
          // Check If-None-Match header
          const ifNoneMatch = req.headers['if-none-match'];
          
          if (ifNoneMatch && ifNoneMatch === etag) {
            // Return 304 Not Modified
            return res.status(304).end();
          }
          
          // Set ETag header
          res.set('ETag', etag);
          
          // Set Cache-Control headers
          // Private cache because cart data is user-specific
          res.set('Cache-Control', `private, max-age=${ttl}, stale-while-revalidate=${staleWhileRevalidate}`);
          
          // Set Vary header to ensure proper caching based on auth
          res.set('Vary', 'Authorization, Cookie, Accept-Encoding');
          
          // Set Last-Modified header
          if (data.updatedAt) {
            res.set('Last-Modified', new Date(data.updatedAt).toUTCString());
          }
        }
      } catch (error) {
        logger.error('Error in cart cache middleware', { error: error.message });
      }

      // Call original json method
      return originalJson(data);
    };

    next();
  };
}

/**
 * Cart cache invalidation middleware
 * Invalidates cache after cart modifications
 */
function cartCacheInvalidationMiddleware() {
  return async (req, res, next) => {
    // Only process modification methods
    if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
      return next();
    }

    // Store original json method
    const originalJson = res.json.bind(res);
    const originalSend = res.send.bind(res);
    const originalEnd = res.end.bind(res);

    // Track if response has been sent
    let responseSent = false;

    // Helper to invalidate cache
    const invalidateCache = async () => {
      if (responseSent) return;
      responseSent = true;

      try {
        // Get cart ID from various sources
        const cartId = req.params.cartId || req.params.id || req.body.cartId;
        const userId = req.user?.id;

        if (cartId) {
          // Invalidate specific cart
          await cartCacheService.invalidateCart(cartId);
          logger.debug('Cart cache invalidated', { cartId, reason: 'modification' });
        }

        if (userId) {
          // Invalidate all user carts
          await cartCacheService.invalidateUserCarts(userId);
          logger.debug('User cart caches invalidated', { userId, reason: 'modification' });
        }
      } catch (error) {
        logger.error('Error invalidating cart cache', { error: error.message });
      }
    };

    // Override response methods
    res.json = function(...args) {
      invalidateCache();
      return originalJson(...args);
    };

    res.send = function(...args) {
      invalidateCache();
      return originalSend(...args);
    };

    res.end = function(...args) {
      invalidateCache();
      return originalEnd(...args);
    };

    // Also listen for finish event as a fallback
    res.on('finish', invalidateCache);

    next();
  };
}

/**
 * Lightweight cart count cache middleware
 * Caches cart count responses for short periods
 */
function cartCountCacheMiddleware(options = {}) {
  const {
    ttl = 30, // 30 seconds for count (frequently changing)
  } = options;

  return async (req, res, next) => {
    // Skip for non-GET methods
    if (req.method !== 'GET') {
      return next();
    }

    // Store original json method
    const originalJson = res.json.bind(res);

    res.json = function(data) {
      try {
        if (res.statusCode === 200 && data) {
          // Cache count for short time
          res.set('Cache-Control', `private, max-age=${ttl}`);
          res.set('Vary', 'Authorization, Cookie');
        }
      } catch (error) {
        logger.error('Error in cart count cache middleware', { error: error.message });
      }

      return originalJson(data);
    };

    next();
  };
}

/**
 * Cart summary cache middleware
 * Caches cart summary responses
 */
function cartSummaryCacheMiddleware(options = {}) {
  const {
    ttl = 60, // 1 minute for summary
  } = options;

  return async (req, res, next) => {
    // Skip for non-GET methods
    if (req.method !== 'GET') {
      return next();
    }

    // Store original json method
    const originalJson = res.json.bind(res);

    res.json = function(data) {
      try {
        if (res.statusCode === 200 && data) {
          // Generate ETag for summary
          const etag = generateETag(data);
          
          // Check If-None-Match header
          const ifNoneMatch = req.headers['if-none-match'];
          
          if (ifNoneMatch && ifNoneMatch === etag) {
            return res.status(304).end();
          }
          
          res.set('ETag', etag);
          res.set('Cache-Control', `private, max-age=${ttl}`);
          res.set('Vary', 'Authorization, Cookie, Accept-Encoding');
        }
      } catch (error) {
        logger.error('Error in cart summary cache middleware', { error: error.message });
      }

      return originalJson(data);
    };

    next();
  };
}

/**
 * Conditional GET middleware
 * Supports If-Modified-Since header
 */
function conditionalGetMiddleware() {
  return async (req, res, next) => {
    const ifModifiedSince = req.headers['if-modified-since'];
    
    if (ifModifiedSince && req.method === 'GET') {
      // Store original json method
      const originalJson = res.json.bind(res);

      res.json = function(data) {
        try {
          if (res.statusCode === 200 && data && data.updatedAt) {
            const lastModified = new Date(data.updatedAt);
            const ifModifiedDate = new Date(ifModifiedSince);
            
            if (lastModified <= ifModifiedDate) {
              return res.status(304).end();
            }
          }
        } catch (error) {
          logger.error('Error in conditional GET middleware', { error: error.message });
        }

        return originalJson(data);
      };
    }

    next();
  };
}

/**
 * Pagination middleware for cart items
 * Adds pagination support to cart responses
 */
function cartPaginationMiddleware(options = {}) {
  const {
    defaultLimit = 20,
    maxLimit = 100,
  } = options;

  return async (req, res, next) => {
    // Parse pagination parameters
    let limit = parseInt(req.query.limit) || defaultLimit;
    let offset = parseInt(req.query.offset) || 0;

    // Enforce limits
    limit = Math.min(Math.max(limit, 1), maxLimit);
    offset = Math.max(offset, 0);

    // Attach pagination to request
    req.pagination = {
      limit,
      offset,
      page: Math.floor(offset / limit) + 1,
    };

    // Store original json method
    const originalJson = res.json.bind(res);

    res.json = function(data) {
      try {
        if (res.statusCode === 200 && data && data.items) {
          // Add pagination metadata
          const totalItems = data.items.length;
          const paginatedItems = data.items.slice(offset, offset + limit);
          const totalPages = Math.ceil(totalItems / limit);

          const responseWithPagination = {
            ...data,
            items: paginatedItems,
            pagination: {
              total: totalItems,
              limit,
              offset,
              page: Math.floor(offset / limit) + 1,
              totalPages,
              hasMore: offset + limit < totalItems,
            },
          };

          return originalJson(responseWithPagination);
        }
      } catch (error) {
        logger.error('Error in cart pagination middleware', { error: error.message });
      }

      return originalJson(data);
    };

    next();
  };
}

module.exports = {
  cartCacheMiddleware,
  cartCacheInvalidationMiddleware,
  cartCountCacheMiddleware,
  cartSummaryCacheMiddleware,
  conditionalGetMiddleware,
  cartPaginationMiddleware,
  generateETag,
};
