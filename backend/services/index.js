/**
 * Services Index
 * 
 * Centralized exports for all cart-related services with performance optimizations.
 * 
 * @module services/index
 */

const { CartService, cartService } = require('./cartService');
const { cartCacheService } = require('./cartCacheService');
const { cartQueueService } = require('./cartQueueService');
const { cartPerformanceService } = require('./cartPerformanceService');
const { redisConnectionPool } = require('./redisConnectionPool');
const { loggerService } = require('./logger');
const { stockValidationService, BACKORDER_CONFIG } = require('./stockValidationService');

module.exports = {
  // Core cart service
  CartService,
  cartService,
  
  // Performance optimization services
  cartCacheService,
  cartQueueService,
  cartPerformanceService,
  
  // Infrastructure services
  redisConnectionPool,
  loggerService,
  stockValidationService,
  BACKORDER_CONFIG
};
