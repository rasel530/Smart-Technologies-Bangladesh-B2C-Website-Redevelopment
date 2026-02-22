/**
 * Fix4: Connection Health Middleware
 * 
 * This middleware checks database and Redis health before cart operations
 * Returns appropriate error responses if connections are unhealthy
 * 
 * @module middleware/connectionHealthCheck
 */

const { loggerService } = require('../services/logger');
const { cartService } = require('../services/cartService');

/**
 * Middleware to check database and Redis health before cart operations
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Next middleware function
 */
const connectionHealthCheck = async (req, res, next) => {
  try {
    // Check database health
    const isDatabaseHealthy = await cartService.checkDatabaseConnection();
    
    // Check Redis health
    const isRedisHealthy = await cartService.checkRedisConnection();
    
    // Check if Redis circuit breaker is open
    const isRedisCircuitBreakerOpen = cartService.isRedisCircuitBreakerOpen();
    
    // Log health check results
    loggerService.info('[connectionHealthCheck] Connection health check', {
      userId: req.user?.id,
      sessionId: req.headers['x-session-id'],
      databaseHealthy: isDatabaseHealthy,
      redisHealthy: isRedisHealthy,
      redisCircuitBreakerOpen: isRedisCircuitBreakerOpen,
      timestamp: new Date().toISOString()
    });
    
    // If database is not healthy, return 503 error
    if (!isDatabaseHealthy) {
      loggerService.warn('[connectionHealthCheck] Database connection check failed, returning 503');
      return res.status(503).json({
        success: false,
        error: 'Database service unavailable',
        message: 'Database connection failed. Please try again later.',
        messageBn: 'ডাটাবেসংযোগ ক্ররতুল হয়ে',
        details: {
          databaseHealthy: false,
          redisHealthy: isRedisHealthy,
          redisCircuitBreakerOpen: isRedisCircuitBreakerOpen
        }
      });
    }
    
    // If Redis is not healthy but circuit breaker is not open, return 503 error
    if (!isRedisHealthy && !isRedisCircuitBreakerOpen) {
      loggerService.warn('[connectionHealthCheck] Redis connection check failed, returning 503');
      return res.status(503).json({
        success: false,
        error: 'Cache service unavailable',
        message: 'Cache service unavailable. Please try again later.',
        messageBn: 'ক্যাশ সার্ভিস অনুপলব্য়ে',
        details: {
          databaseHealthy: isDatabaseHealthy,
          redisHealthy: isRedisHealthy,
          redisCircuitBreakerOpen: isRedisCircuitBreakerOpen
        }
      });
    }
    
    // If Redis circuit breaker is open, return 503 error
    if (isRedisCircuitBreakerOpen) {
      loggerService.warn('[connectionHealthCheck] Redis circuit breaker is open, returning 503');
      return res.status(503).json({
        success: false,
        error: 'Cache service temporarily disabled due to repeated failures',
        message: 'Cache service temporarily disabled due to repeated failures. Please try again later.',
        messageBn: 'ক্যাশ সার্ভিস অনুপলব্য়ে',
        details: {
          databaseHealthy: isDatabaseHealthy,
          redisHealthy: isRedisHealthy,
          redisCircuitBreakerOpen: isRedisCircuitBreakerOpen
        }
      });
    }
    
    // All checks passed, proceed to next middleware
    loggerService.info('[connectionHealthCheck] All connection health checks passed');
    next();
  } catch (error) {
    loggerService.error('[connectionHealthCheck] Connection health check error', {
      error: error.message,
      stack: error.stack
    });
    
    // On error, return 503 but proceed anyway (graceful degradation)
    loggerService.warn('[connectionHealthCheck] Connection health check failed, proceeding with request (graceful degradation)', {
      userId: req.user?.id,
      sessionId: req.headers['x-session-id'],
      error: error.message
    });
    
    next();
  }
};

module.exports = {
  connectionHealthCheck
};
