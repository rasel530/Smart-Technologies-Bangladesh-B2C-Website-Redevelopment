/**
 * Redis Configuration Module
 * 
 * This module provides a centralized Redis client configuration and initialization.
 * It uses the Redis connection pool for efficient connection management.
 */

const { redisConnectionPool } = require('../services/redisConnectionPool');
const { loggerService } = require('../services/logger');

/**
 * Get Redis client instance from connection pool
 * This returns the shared client directly, which will be initialized when needed
 * @returns {Object|null} Redis client or null if not initialized
 */
function getRedisClient() {
  try {
    // Get the shared Redis client from connection pool
    const client = redisConnectionPool.getSharedClient();
    return client;
  } catch (error) {
    loggerService.error('Failed to get Redis client', {
      error: error.message,
      stack: error.stack
    });
    return null;
  }
}

/**
 * Initialize Redis client from connection pool
 * @returns {Promise<Object>} Redis client instance
 */
async function initializeRedis() {
  try {
    // Initialize the connection pool if not already initialized
    await redisConnectionPool.initialize();
    
    // Get the shared Redis client
    const client = redisConnectionPool.getSharedClient();
    
    if (client) {
      loggerService.info('Redis client initialized successfully from connection pool');
    } else {
      loggerService.warn('Redis client not available from connection pool');
    }
    
    return client;
  } catch (error) {
    loggerService.error('Failed to initialize Redis client', {
      error: error.message,
      stack: error.stack
    });
    return null;
  }
}

/**
 * Export the redisClient directly for backward compatibility
 * This allows existing code to use: require('../../config/redis').redisClient
 * Note: This returns a getter function to ensure the client is always current
 */
module.exports = {
  get redisClient() {
    return getRedisClient();
  },
  initializeRedis,
  getRedisClient,
  redisConnectionPool
};
