const { redisFallbackService } = require('./redisFallbackService');
const { loggerService } = require('./logger');

class RateLimitService {
  constructor() {
    this.memoryStore = new Map();
    this.redisClient = null;
    this.isRedisAvailable = false;
    this.initializeRedis();
  }

  async initializeRedis() {
    try {
      // Initialize Redis fallback service which will handle Redis connection
      await redisFallbackService.initialize(require('./redisConnectionPool').redisConnectionPool);
      this.redisClient = redisFallbackService.getClient('rate-limit');
      this.isRedisAvailable = true;
      loggerService.info('Rate limiting service initialized with Redis');
    } catch (error) {
      this.isRedisAvailable = false;
      this.redisClient = null;
      loggerService.warn('Rate limiting service initialized with memory fallback', error);
    }
  }

  // Rate limiting middleware factory
  createRateLimit(options = {}) {
    const config = {
      windowMs: options.windowMs || 15 * 60 * 1000, // 15 minutes
      maxRequests: options.maxRequests || 100,
      keyGenerator: options.keyGenerator || this.defaultKeyGenerator,
      message: options.message || 'Too many requests, please try again later',
      skipSuccessfulRequests: options.skipSuccessfulRequests || false,
      skipFailedRequests: options.skipFailedRequests || false,
      ...options
    };

    return async (req, res, next) => {
      try {
        const key = config.keyGenerator(req);
        const now = Date.now();
        const windowStart = now - config.windowMs;

        // Check if we should skip this request
        if (this.shouldSkipRequest(req, res, config)) {
          return next();
        }

        // Try Redis first, fallback to memory
        let requestData;
        if (this.isRedisAvailable && this.redisClient) {
          requestData = await this.handleRedisRateLimit(key, windowStart, now, config);
        } else {
          requestData = this.handleMemoryRateLimit(key, windowStart, now, config);
        }

        // Set rate limit headers
        this.setRateLimitHeaders(res, requestData);

        if (requestData.exceeded) {
          return res.status(429).json({
            error: 'Rate limit exceeded',
            message: config.message,
            retryAfter: Math.ceil(config.windowMs / 1000),
            limit: config.maxRequests,
            remaining: Math.max(0, config.maxRequests - requestData.count),
            reset: new Date(requestData.resetTime).toISOString()
          });
        }

        // Track request completion for skip options
        if (!config.skipSuccessfulRequests || !config.skipFailedRequests) {
          this.trackRequestCompletion(req, res, key, now, config);
        }

        next();
      } catch (error) {
        loggerService.error('Rate limiting error', {
          error: error.message,
          stack: error.stack,
          url: req.originalUrl,
          method: req.method,
          ip: req.ip
        });
        
        // If rate limiting fails, allow the request but log the error
        next();
      }
    };
  }

  // Default key generator
  defaultKeyGenerator(req) {
    return `rate_limit:${req.ip}${req.user ? `:user:${req.user.id}` : ''}`;
  }

  // Handle rate limiting with Redis
  async handleRedisRateLimit(key, windowStart, now, config) {
    try {
      // Use Redis sorted set for efficient sliding window
      const pipeline = this.redisClient.pipeline();
      
      // Remove old entries outside the window
      pipeline.zRemRangeByScore(key, 0, windowStart);
      
      // Add current request
      pipeline.zAdd(key, [{ score: now, value: `${now}-${Math.random()}` }]);
      
      // Set expiration
      pipeline.expire(key, Math.ceil(config.windowMs / 1000));
      
      // Count current requests
      pipeline.zCard(key);
      
      // Get oldest request timestamp for reset time
      pipeline.zRange(key, 0, 0);
      
      const results = await pipeline.exec();
      const count = results[2][1] || 0;
      const oldestRequest = results[3][1] || [];
      
      const exceeded = count > config.maxRequests;
      const resetTime = oldestRequest.length > 0 
        ? parseInt(oldestRequest[0]) + config.windowMs 
        : now + config.windowMs;

      return {
        count,
        exceeded,
        resetTime,
        windowStart,
        windowEnd: now + config.windowMs
      };
    } catch (error) {
      loggerService.error('Redis rate limiting error, falling back to memory', error);
      this.isRedisAvailable = false;
      return this.handleMemoryRateLimit(key, windowStart, now, config);
    }
  }

  // Handle rate limiting with memory
  handleMemoryRateLimit(key, windowStart, now, config) {
    if (!this.memoryStore.has(key)) {
      this.memoryStore.set(key, []);
    }

    const requests = this.memoryStore.get(key);
    
    // Remove old requests outside the window
    const validRequests = requests.filter(timestamp => timestamp > windowStart);
    
    // Add current request
    validRequests.push(now);
    
    // Update memory store
    this.memoryStore.set(key, validRequests);
    
    const count = validRequests.length;
    const exceeded = count > config.maxRequests;
    const resetTime = validRequests.length > 0 
      ? Math.min(...validRequests) + config.windowMs 
      : now + config.windowMs;

    return {
      count,
      exceeded,
      resetTime,
      windowStart,
      windowEnd: now + config.windowMs
    };
  }

  // Check if request should be skipped
  shouldSkipRequest(req, res, config) {
    // Skip successful requests if configured
    if (config.skipSuccessfulRequests) {
      const originalSend = res.send;
      res.send = function(data) {
        res.send = originalSend;
        if (res.statusCode < 400) {
          req.skipRateLimit = true;
        }
        return originalSend.call(this, data);
      };
    }

    // Skip failed requests if configured
    if (config.skipFailedRequests) {
      const originalSend = res.send;
      res.send = function(data) {
        res.send = originalSend;
        if (res.statusCode >= 400) {
          req.skipRateLimit = true;
        }
        return originalSend.call(this, data);
      };
    }

    return req.skipRateLimit === true;
  }

  // Track request completion for skip options
  trackRequestCompletion(req, res, key, now, config) {
    const originalSend = res.send;
    res.send = function(data) {
      res.send = originalSend;
      
      // Only track if not skipped
      if (!req.skipRateLimit) {
        // This is handled in the main rate limit logic
        // For memory fallback, the request is already tracked
      }
      
      return originalSend.call(this, data);
    };
  }

  // Set rate limit headers
  setRateLimitHeaders(res, requestData) {
    const { count, resetTime, windowEnd } = requestData;
    
    res.setHeader('X-RateLimit-Limit', requestData.maxRequests || 100);
    res.setHeader('X-RateLimit-Remaining', Math.max(0, (requestData.maxRequests || 100) - count));
    res.setHeader('X-RateLimit-Reset', new Date(resetTime).toISOString());
    res.setHeader('X-RateLimit-Window-End', new Date(windowEnd).toISOString());
  }

  // Check Redis status
  async checkRedisStatus() {
    try {
      if (this.redisClient && await this.redisClient.ping()) {
        this.isRedisAvailable = true;
        return true;
      }
    } catch (error) {
      this.isRedisAvailable = false;
    }
    return false;
  }

  // Get service status
  getStatus() {
    return {
      isRedisAvailable: this.isRedisAvailable,
      memoryStoreSize: this.memoryStore.size,
      timestamp: new Date().toISOString()
    };
  }

  // Reset rate limit for a specific key
  async resetKey(key) {
    try {
      if (this.isRedisAvailable && this.redisClient) {
        await this.redisClient.del(key);
      } else {
        this.memoryStore.delete(key);
      }
      return true;
    } catch (error) {
      loggerService.error('Failed to reset rate limit key', { key, error: error.message });
      return false;
    }
  }

  // Get current rate limit info for a key
  async getKeyInfo(key, config) {
    try {
      const now = Date.now();
      const windowStart = now - (config.windowMs || 15 * 60 * 1000);

      if (this.isRedisAvailable && this.redisClient) {
        const pipeline = this.redisClient.pipeline();
        pipeline.zRemRangeByScore(key, 0, windowStart);
        pipeline.zCard(key);
        pipeline.zRange(key, 0, 0);
        
        const results = await pipeline.exec();
        const count = results[1][1] || 0;
        const oldestRequest = results[2][1] || [];
        
        return {
          count,
          resetTime: oldestRequest.length > 0 
            ? parseInt(oldestRequest[0]) + (config.windowMs || 15 * 60 * 1000)
            : now + (config.windowMs || 15 * 60 * 1000),
          isRedisAvailable: true
        };
      } else {
        const requests = this.memoryStore.get(key) || [];
        const validRequests = requests.filter(timestamp => timestamp > windowStart);
        const count = validRequests.length;
        
        return {
          count,
          resetTime: validRequests.length > 0 
            ? Math.min(...validRequests) + (config.windowMs || 15 * 60 * 1000)
            : now + (config.windowMs || 15 * 60 * 1000),
          isRedisAvailable: false
        };
      }
    } catch (error) {
      loggerService.error('Failed to get rate limit key info', { key, error: error.message });
      return null;
    }
  }

  // Cleanup expired entries in memory store
  cleanupMemoryStore() {
    const now = Date.now();
    const defaultWindowMs = 15 * 60 * 1000; // 15 minutes
    
    for (const [key, requests] of this.memoryStore.entries()) {
      const windowStart = now - defaultWindowMs;
      const validRequests = requests.filter(timestamp => timestamp > windowStart);
      
      if (validRequests.length === 0) {
        this.memoryStore.delete(key);
      } else {
        this.memoryStore.set(key, validRequests);
      }
    }
  }
}

// Singleton instance
const rateLimitService = new RateLimitService();

// Schedule cleanup every 5 minutes
setInterval(() => {
  rateLimitService.cleanupMemoryStore();
}, 5 * 60 * 1000);

module.exports = {
  RateLimitService,
  rateLimitService
};