/**
 * Middleware Index
 * 
 * Centralized exports for all cart-related middleware with performance optimizations.
 * 
 * @module middleware/index
 */

const { compressionMiddleware } = require('./compression');
const { cartCacheMiddleware, generateETag } = require('./cartCache');

module.exports = {
  // Compression middleware for response optimization
  compressionMiddleware,
  
  // Cart caching middleware with ETag support
  cartCacheMiddleware,
  generateETag
};
