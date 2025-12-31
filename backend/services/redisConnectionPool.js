const Redis = require('redis');
const { getRedisConfig, configService } = require('./config');
const { loggerService } = require('./logger');

class RedisConnectionPool {
  constructor() {
    this.connections = new Map();
    this.logger = loggerService;
    this.isInitialized = false;
    this.retryAttempts = 0;
    this.maxRetryAttempts = 10;
    this.baseRetryDelay = 1000; // 1 second base delay
    this.maxRetryDelay = 30000; // 30 seconds max delay
    this.isReconnecting = false;
    this.connectionLock = false; // CRITICAL: Prevent concurrent connections
  }

  // Calculate exponential backoff delay
  calculateRetryDelay(attempt) {
    const delay = Math.min(this.baseRetryDelay * Math.pow(2, attempt), this.maxRetryDelay);
    // Add jitter to prevent thundering herd
    return delay + Math.random() * 1000;
  }

  async initialize() {
    // CRITICAL FIX: Prevent concurrent initialization
    if (this.connectionLock) {
      this.logger?.info('Redis initialization already in progress, waiting...');
      // Wait for initialization to complete
      while (this.connectionLock) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      return;
    }

    if (this.isInitialized && !this.isReconnecting) {
      return;
    }

    this.connectionLock = true;

    try {
      // Get Redis configuration with environment-aware logic
      let redisConfig;
      try {
        // Use new environment-aware configuration method
        if (configService && typeof configService.getRedisConfigWithEnvironment === 'function') {
          redisConfig = configService.getRedisConfigWithEnvironment();
          console.log('🔧 Using environment-aware Redis configuration');
        } else {
          redisConfig = getRedisConfig();
          console.log('🔧 Using standard Redis configuration');
        }
      } catch (error) {
        // Fallback to configService if direct function fails
        if (configService && typeof configService.getRedisConfig === 'function') {
          redisConfig = configService.getRedisConfig();
          console.log('🔧 Using fallback Redis configuration');
        } else {
          throw error;
        }
      }

      if (!redisConfig) {
        this.logger?.warn('Redis configuration not available, Redis features will be disabled');
        this.connectionLock = false;
        return;
      }

      // Enhanced Redis configuration with retry strategy
      // Handle empty password properly
      const redisUrl = redisConfig.password
        ? `redis://:${redisConfig.password}@${redisConfig.host}:${redisConfig.port}`
        : `redis://${redisConfig.host}:${redisConfig.port}`;
      
      // CRITICAL FIX: Enhanced socket configuration to prevent "Socket closed unexpectedly"
      this.enhancedConfig = {
        // Use URL format for Redis client
        url: redisUrl,
        socket: {
          connectTimeout: 15000, // Increased from 10000 to 15000
          lazyConnect: true,
          // CRITICAL FIX: Enhanced keepalive settings
          keepAlive: true,
          keepAliveInitialDelay: 1000, // Add initial delay
          noDelay: true, // Disable Nagle's algorithm
          family: 4, // Force IPv4
          // CRITICAL FIX: Disable automatic reconnect to handle manually
          reconnectStrategy: false // Disable auto-reconnect, handle manually
        },
        // Additional client-level configuration
        commandTimeout: 10000, // Increased from default
        maxRetriesPerRequest: 3,
        retryDelayOnFailover: 100
      };

      // CRITICAL FIX: Clean up existing connection if any
      if (this.sharedClient) {
        try {
          await this.sharedClient.quit();
        } catch (error) {
          this.logger?.warn('Error cleaning up existing Redis connection', {
            error: error.message
          });
        }
        this.sharedClient = null;
      }

      // Create a single shared Redis connection with enhanced configuration
      this.sharedClient = Redis.createClient(this.enhancedConfig);
      
      // Enhanced event handling with better error recovery
      this.sharedClient.on('error', (err) => {
        this.logger?.error('Redis connection error', {
          error: err.message,
          code: err.code,
          timestamp: new Date().toISOString()
        });
        
        // Mark as not initialized on error
        if (this.isInitialized) {
          this.isInitialized = false;
          this.logger?.warn('Redis marked as unavailable due to connection error');
        }

        // CRITICAL FIX: Manual reconnection handling
        if (!this.isReconnecting) {
          this.scheduleReconnection();
        }
      });

      this.sharedClient.on('connect', () => {
        this.logger?.info('Redis connected successfully', {
          timestamp: new Date().toISOString()
        });
      });

      this.sharedClient.on('ready', () => {
        this.logger?.info('Redis ready for operations', {
          timestamp: new Date().toISOString()
        });
        this.isInitialized = true;
        this.isReconnecting = false;
        this.retryAttempts = 0;
      });

      this.sharedClient.on('reconnecting', () => {
        this.logger?.info('Redis reconnecting', {
          timestamp: new Date().toISOString()
        });
        this.isReconnecting = true;
      });

      this.sharedClient.on('end', () => {
        this.logger?.warn('Redis connection ended', {
          timestamp: new Date().toISOString()
        });
        this.isInitialized = false;
        
        // CRITICAL FIX: Schedule reconnection on connection end
        if (!this.isReconnecting) {
          this.scheduleReconnection();
        }
      });

      // Attempt connection with retry logic
      await this.connectWithRetry();

      this.logger?.info('Redis connection pool initialized successfully');

    } catch (error) {
      this.logger?.error('Failed to initialize Redis connection pool', {
        error: error.message,
        stack: error.stack
      });
      this.sharedClient = null;
      this.isInitialized = false;
    } finally {
      this.connectionLock = false;
    }
  }

  // CRITICAL FIX: Manual reconnection scheduling
  scheduleReconnection() {
    if (this.isReconnecting) return;
    
    this.isReconnecting = true;
    const delay = this.calculateRetryDelay(this.retryAttempts);
    this.retryAttempts++;
    
    this.logger?.info(`Scheduling Redis reconnection in ${Math.round(delay)}ms (attempt ${this.retryAttempts})`);
    
    setTimeout(async () => {
      if (this.retryAttempts <= this.maxRetryAttempts) {
        try {
          await this.connectWithRetry();
        } catch (error) {
          this.logger?.error('Reconnection failed', {
            error: error.message,
            attempt: this.retryAttempts
          });
          this.scheduleReconnection();
        }
      } else {
        this.logger?.error('Redis max reconnection attempts reached, giving up');
        this.isReconnecting = false;
        this.retryAttempts = 0;
      }
    }, delay);
  }

  // Enhanced connection method with retry logic
  async connectWithRetry() {
    try {
      this.logger?.info(`🔄 Attempting Redis connection (attempt ${this.retryAttempts + 1}/${this.maxRetryAttempts})`);
      this.logger?.info(`📍 Redis connection details:`, {
        url: this.enhancedConfig.url.replace(/:([^:@]+)@/, ':***@'), // Hide password in logs
        connectTimeout: this.enhancedConfig.socket?.connectTimeout || 'unknown'
      });
      
      await this.sharedClient.connect();
      
      // Test connection
      const pong = await this.sharedClient.ping();
      if (pong !== 'PONG') {
        throw new Error(`Redis ping test failed. Expected: PONG, Got: ${pong}`);
      }
      
      this.logger?.info('✅ Redis connection established successfully');
      return;
    } catch (error) {
      this.logger?.error(`❌ Redis connection attempt ${this.retryAttempts + 1} failed`, {
        error: error.message,
        code: error.code,
        stack: error.stack
      });
      throw error;
    }
  }

  // Get shared Redis client for a service with connection validation
  getClient(serviceName) {
    if (!this.sharedClient) {
      this.logger?.warn(`Redis client requested for ${serviceName} but Redis is not available`);
      return null;
    }

    // CRITICAL FIX: Ensure connection is initialized
    if (!this.isInitialized && !this.isReconnecting && !this.connectionLock) {
      this.logger?.warn(`Redis not ready for ${serviceName}, attempting reconnection...`);
      this.initialize().catch(err => {
        this.logger?.error(`Failed to reconnect Redis for ${serviceName}`, {
          error: err.message
        });
      });
    }

    // Return a fallback client that handles Redis unavailability gracefully
    const wrappedClient = this.createWrappedClient(serviceName, this.sharedClient);
    return wrappedClient;
  }

  // Create a wrapped client with fallback handling
  createWrappedClient(serviceName, sharedClient) {

    // Store references to avoid 'this' context issues
    const logger = this.logger;

    // Create a wrapped client with service-specific logging and fallback handling
    const wrappedClient = {
      serviceName,

      // Override methods to add service-specific logging
      async setEx(key, ttl, value) {
        try {
          return await sharedClient.setEx(key, ttl, value);
        } catch (error) {
          logger?.error(`Redis SETEX error in ${serviceName}`, {
            key,
            error: error.message
          });
          // Return fallback response instead of throwing
          return null;
        }
      },

      async get(key) {
        try {
          return await sharedClient.get(key);
        } catch (error) {
          logger?.error(`Redis GET error in ${serviceName}`, {
            key,
            error: error.message
          });
          // Return fallback response instead of throwing
          return null;
        }
      },

      async del(key) {
        try {
          return await sharedClient.del(key);
        } catch (error) {
          logger?.error(`Redis DEL error in ${serviceName}`, {
            key,
            error: error.message
          });
          // Return fallback response instead of throwing
          return 0;
        }
      },

      async exists(key) {
        try {
          return await sharedClient.exists(key);
        } catch (error) {
          logger?.error(`Redis EXISTS error in ${serviceName}`, {
            key,
            error: error.message
          });
          // Return fallback response instead of throwing
          return 0;
        }
      },

      async expire(key, ttl) {
        try {
          return await sharedClient.expire(key, ttl);
        } catch (error) {
          logger?.error(`Redis EXPIRE error in ${serviceName}`, {
            key,
            error: error.message
          });
          // Return fallback response instead of throwing
          return 0;
        }
      },

      async ttl(key) {
        try {
          return await sharedClient.ttl(key);
        } catch (error) {
          logger?.error(`Redis TTL error in ${serviceName}`, {
            key,
            error: error.message
          });
          // Return fallback response instead of throwing
          return -1;
        }
      },

      async zAdd(key, members) {
        try {
          return await sharedClient.zAdd(key, members);
        } catch (error) {
          logger?.error(`Redis ZADD error in ${serviceName}`, {
            key,
            error: error.message
          });
          // Return fallback response instead of throwing
          return 0;
        }
      },

      async zRange(key, start, stop) {
        try {
          return await sharedClient.zRange(key, start, stop);
        } catch (error) {
          logger?.error(`Redis ZRANGE error in ${serviceName}`, {
            key,
            error: error.message
          });
          // Return fallback response instead of throwing
          return [];
        }
      },

      async zRem(key, member) {
        try {
          return await sharedClient.zRem(key, member);
        } catch (error) {
          logger?.error(`Redis ZREM error in ${serviceName}`, {
            key,
            error: error.message
          });
          // Return fallback response instead of throwing
          return 0;
        }
      },

      async zRemRangeByScore(key, min, max) {
        try {
          return await sharedClient.zRemRangeByScore(key, min, max);
        } catch (error) {
          logger?.error(`Redis ZREMRANGEBYSCORE error in ${serviceName}`, {
            key,
            error: error.message
          });
          // Return fallback response instead of throwing
          return 0;
        }
      },

      async zCard(key) {
        try {
          return await sharedClient.zCard(key);
        } catch (error) {
          logger?.error(`Redis ZCARD error in ${serviceName}`, {
            key,
            error: error.message
          });
          // Return fallback response instead of throwing
          return 0;
        }
      },

      async hIncrBy(key, field, increment) {
        try {
          return await sharedClient.hIncrBy(key, field, increment);
        } catch (error) {
          logger?.error(`Redis HINCRBY error in ${serviceName}`, {
            key,
            field,
            error: error.message
          });
          // Return fallback response instead of throwing
          return 0;
        }
      },

      async hGetAll(key) {
        try {
          return await sharedClient.hGetAll(key);
        } catch (error) {
          logger?.error(`Redis HGETALL error in ${serviceName}`, {
            key,
            error: error.message
          });
          // Return fallback response instead of throwing
          return {};
        }
      },

      async keys(pattern) {
        try {
          return await sharedClient.keys(pattern);
        } catch (error) {
          logger?.error(`Redis KEYS error in ${serviceName}`, {
            pattern,
            error: error.message
          });
          // Return fallback response instead of throwing
          return [];
        }
      },

      async ping() {
        try {
          return await sharedClient.ping();
        } catch (error) {
          logger?.error(`Redis PING error in ${serviceName}`, {
            error: error.message
          });
          // Return fallback response instead of throwing
          return null;
        }
      },

      // Pipeline support
      pipeline() {
        try {
          const pipeline = sharedClient.multi();
          const originalExec = pipeline.exec.bind(pipeline);

          pipeline.exec = async () => {
            try {
              return await originalExec();
            } catch (error) {
              logger?.error(`Redis Pipeline error in ${serviceName}`, {
                error: error.message
              });
              // Return fallback response instead of throwing
              return [];
            }
          };

          return pipeline;
        } catch (error) {
          logger?.error(`Redis Pipeline creation error in ${serviceName}`, {
            error: error.message
          });
          // Return fallback pipeline that does nothing
          return {
            exec: async () => [],
            multi: () => this.pipeline()
          };
        }
      },

      // Enhanced connection status with automatic recovery
      async isReady() {
        if (!sharedClient) return false;
        try {
          const result = await sharedClient.ping();
          return result === 'PONG';
        } catch (error) {
          logger?.warn(`Redis readiness check failed`, {
            error: error.message
          });
          
          // If not initialized and not reconnecting, try to reconnect
          if (!this.isInitialized && !this.isReconnecting && !this.connectionLock) {
            logger?.info('Attempting to recover Redis connection...');
            this.initialize().catch(err => {
              logger?.error('Redis recovery failed', {
                error: err.message
              });
            });
          }
          
          return false;
        }
      },

      // Expose original client for direct access if needed
      getSharedClient() {
        return sharedClient;
      }
    };

    this.connections.set(serviceName, wrappedClient);
    return wrappedClient;
  }

  // Enhanced close method with proper cleanup
  async close() {
    if (this.sharedClient) {
      try {
        // Stop reconnection attempts
        this.isReconnecting = false;
        this.retryAttempts = 0;
        this.connectionLock = false;
        
        await this.sharedClient.quit();
        this.logger?.info('Redis connection pool closed');
        this.isInitialized = false;
      } catch (error) {
        this.logger?.error('Error closing Redis connection pool', {
          error: error.message,
          stack: error.stack
        });
      }
    }
  }

  // Force reconnection
  async forceReconnect() {
    this.logger?.info('Forcing Redis reconnection...');
    this.isReconnecting = false;
    this.retryAttempts = 0;
    this.connectionLock = false;
    
    if (this.sharedClient) {
      try {
        await this.sharedClient.quit();
      } catch (error) {
        this.logger?.warn('Error during Redis disconnect for forced reconnect', {
          error: error.message
        });
      }
    }
    
    await this.initialize();
  }

  // Get connection status
  getStatus() {
    return {
      isInitialized: this.isInitialized,
      hasClient: !!this.sharedClient,
      isReconnecting: this.isReconnecting,
      retryAttempts: this.retryAttempts,
      maxRetryAttempts: this.maxRetryAttempts,
      activeConnections: this.connections.size,
      connectionNames: Array.from(this.connections.keys()),
      connectionLock: this.connectionLock
    };
  }

  // NEW: Get connection pool statistics
  getStats() {
    return {
      ...this.getStatus(),
      uptime: process.uptime(),
      memoryUsage: process.memoryUsage(),
      timestamp: new Date().toISOString()
    };
  }

  // NEW: Get pool size (for compatibility)
  getPoolSize() {
    return this.connections.size;
  }
}

// Singleton instance
const redisConnectionPool = new RedisConnectionPool();

module.exports = {
  RedisConnectionPool,
  redisConnectionPool
};