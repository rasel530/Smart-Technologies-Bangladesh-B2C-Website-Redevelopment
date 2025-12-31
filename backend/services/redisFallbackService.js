const { loggerService } = require('./logger');

class RedisFallbackService {
  constructor() {
    this.isRedisAvailable = false;
    this.memoryCache = new Map();
    this.fallbackMode = false;
  }

  // Initialize Redis with fallback
  async initialize(redisConnectionPool) {
    try {
      await redisConnectionPool.initialize();
      this.isRedisAvailable = true;
      this.fallbackMode = false;
      loggerService.info('Redis is available, using normal cache operations');
      return true;
    } catch (error) {
      this.isRedisAvailable = false;
      this.fallbackMode = true;
      loggerService.warn('Redis unavailable, switching to memory fallback mode', error);
      return false;
    }
  }

  // Get Redis client with fallback
  getClient(serviceName) {
    if (this.isRedisAvailable && !this.fallbackMode) {
      const { redisConnectionPool } = require('./redisConnectionPool');
      const client = redisConnectionPool.getClient(serviceName);
      if (client) {
        return this.wrapClientWithFallback(client, serviceName);
      }
    }

    // Return memory-based fallback client
    return this.getMemoryClient(serviceName);
  }

  // Wrap Redis client with fallback
  wrapClientWithFallback(redisClient, serviceName) {
    const fallbackService = this;
    
    return {
      serviceName,
      
      async setEx(key, ttl, value) {
        try {
          return await redisClient.setEx(key, ttl, value);
        } catch (error) {
          fallbackService.handleRedisError(error, serviceName, 'setEx', { key, ttl });
          return fallbackService.memorySetEx(key, ttl, value);
        }
      },

      async get(key) {
        try {
          return await redisClient.get(key);
        } catch (error) {
          fallbackService.handleRedisError(error, serviceName, 'get', { key });
          return fallbackService.memoryGet(key);
        }
      },

      async del(key) {
        try {
          return await redisClient.del(key);
        } catch (error) {
          fallbackService.handleRedisError(error, serviceName, 'del', { key });
          return fallbackService.memoryDel(key);
        }
      },

      async exists(key) {
        try {
          return await redisClient.exists(key);
        } catch (error) {
          fallbackService.handleRedisError(error, serviceName, 'exists', { key });
          return fallbackService.memoryExists(key);
        }
      },

      async expire(key, ttl) {
        try {
          return await redisClient.expire(key, ttl);
        } catch (error) {
          fallbackService.handleRedisError(error, serviceName, 'expire', { key, ttl });
          return fallbackService.memoryExpire(key, ttl);
        }
      },

      async ttl(key) {
        try {
          return await redisClient.ttl(key);
        } catch (error) {
          fallbackService.handleRedisError(error, serviceName, 'ttl', { key });
          return fallbackService.memoryTtl(key);
        }
      },

      async zAdd(key, members) {
        try {
          return await redisClient.zAdd(key, members);
        } catch (error) {
          fallbackService.handleRedisError(error, serviceName, 'zAdd', { key, members });
          return fallbackService.memoryZAdd(key, members);
        }
      },

      async zRange(key, start, stop) {
        try {
          return await redisClient.zRange(key, start, stop);
        } catch (error) {
          fallbackService.handleRedisError(error, serviceName, 'zRange', { key, start, stop });
          return fallbackService.memoryZRange(key, start, stop);
        }
      },

      async zRem(key, member) {
        try {
          return await redisClient.zRem(key, member);
        } catch (error) {
          fallbackService.handleRedisError(error, serviceName, 'zRem', { key, member });
          return fallbackService.memoryZRem(key, member);
        }
      },

      async zRemRangeByScore(key, min, max) {
        try {
          return await redisClient.zRemRangeByScore(key, min, max);
        } catch (error) {
          fallbackService.handleRedisError(error, serviceName, 'zRemRangeByScore', { key, min, max });
          return fallbackService.memoryZRemRangeByScore(key, min, max);
        }
      },

      async zCard(key) {
        try {
          return await redisClient.zCard(key);
        } catch (error) {
          fallbackService.handleRedisError(error, serviceName, 'zCard', { key });
          return fallbackService.memoryZCard(key);
        }
      },

      async hIncrBy(key, field, increment) {
        try {
          return await redisClient.hIncrBy(key, field, increment);
        } catch (error) {
          fallbackService.handleRedisError(error, serviceName, 'hIncrBy', { key, field, increment });
          return fallbackService.memoryHIncrBy(key, field, increment);
        }
      },

      async hGetAll(key) {
        try {
          return await redisClient.hGetAll(key);
        } catch (error) {
          fallbackService.handleRedisError(error, serviceName, 'hGetAll', { key });
          return fallbackService.memoryHGetAll(key);
        }
      },

      async keys(pattern) {
        try {
          return await redisClient.keys(pattern);
        } catch (error) {
          fallbackService.handleRedisError(error, serviceName, 'keys', { pattern });
          return fallbackService.memoryKeys(pattern);
        }
      },

      async ping() {
        try {
          return await redisClient.ping();
        } catch (error) {
          fallbackService.handleRedisError(error, serviceName, 'ping', {});
          return 'PONG'; // Memory fallback always responds with PONG
        }
      },

      pipeline() {
        try {
          return redisClient.pipeline();
        } catch (error) {
          fallbackService.handleRedisError(error, serviceName, 'pipeline', {});
          return fallbackService.getMemoryPipeline();
        }
      },

      async isReady() {
        if (fallbackService.fallbackMode) return true;
        try {
          return await redisClient.isReady();
        } catch (error) {
          fallbackService.handleRedisError(error, serviceName, 'isReady', {});
          return true; // Memory fallback is always ready
        }
      },

      getSharedClient() {
        return redisClient.getSharedClient();
      }
    };
  }

  // Memory-based fallback client
  getMemoryClient(serviceName) {
    const fallbackService = this;
    const serviceCache = new Map();
    
    return {
      serviceName,

      async setEx(key, ttl, value) {
        return fallbackService.memorySetEx(key, ttl, value, serviceCache);
      },

      async get(key) {
        return fallbackService.memoryGet(key, serviceCache);
      },

      async del(key) {
        return fallbackService.memoryDel(key, serviceCache);
      },

      async exists(key) {
        return fallbackService.memoryExists(key, serviceCache);
      },

      async expire(key, ttl) {
        return fallbackService.memoryExpire(key, ttl, serviceCache);
      },

      async ttl(key) {
        return fallbackService.memoryTtl(key, serviceCache);
      },

      async zAdd(key, members) {
        return fallbackService.memoryZAdd(key, members, serviceCache);
      },

      async zRange(key, start, stop) {
        return fallbackService.memoryZRange(key, start, stop, serviceCache);
      },

      async zRem(key, member) {
        return fallbackService.memoryZRem(key, member, serviceCache);
      },

      async zRemRangeByScore(key, min, max) {
        return fallbackService.memoryZRemRangeByScore(key, min, max, serviceCache);
      },

      async zCard(key) {
        return fallbackService.memoryZCard(key, serviceCache);
      },

      async hIncrBy(key, field, increment) {
        return fallbackService.memoryHIncrBy(key, field, increment, serviceCache);
      },

      async hGetAll(key) {
        return fallbackService.memoryHGetAll(key, serviceCache);
      },

      async keys(pattern) {
        return fallbackService.memoryKeys(pattern, serviceCache);
      },

      async ping() {
        return 'PONG';
      },

      pipeline() {
        return fallbackService.getMemoryPipeline(serviceCache);
      },

      async isReady() {
        return true;
      },

      getSharedClient() {
        return null;
      }
    };
  }

  // Handle Redis errors and potentially switch to fallback mode
  handleRedisError(error, serviceName, operation, params = {}) {
    loggerService.error(`Redis ${operation} error in ${serviceName}`, {
      error: error.message,
      operation,
      params,
      timestamp: new Date().toISOString()
    });

    // If it's a connection error, switch to fallback mode
    if (error.message.includes('Socket closed') || 
        error.message.includes('ECONNREFUSED') || 
        error.message.includes('timeout')) {
      this.fallbackMode = true;
      loggerService.warn(`Switching to memory fallback mode due to Redis connection issues`);
    }
  }

  // Memory fallback implementations
  memorySetEx(key, ttl, value, cache = this.memoryCache) {
    const expiryTime = Date.now() + (ttl * 1000);
    cache.set(key, { value, expiryTime });
    return 'OK';
  }

  memoryGet(key, cache = this.memoryCache) {
    const item = cache.get(key);
    if (!item) return null;
    
    if (Date.now() > item.expiryTime) {
      cache.delete(key);
      return null;
    }
    
    return item.value;
  }

  memoryDel(key, cache = this.memoryCache) {
    const deleted = cache.has(key);
    cache.delete(key);
    return deleted ? 1 : 0;
  }

  memoryExists(key, cache = this.memoryCache) {
    const item = cache.get(key);
    if (!item) return 0;
    
    if (Date.now() > item.expiryTime) {
      cache.delete(key);
      return 0;
    }
    
    return 1;
  }

  memoryExpire(key, ttl, cache = this.memoryCache) {
    const item = cache.get(key);
    if (!item) return 0;
    
    item.expiryTime = Date.now() + (ttl * 1000);
    return 1;
  }

  memoryTtl(key, cache = this.memoryCache) {
    const item = cache.get(key);
    if (!item) return -2;
    
    if (Date.now() > item.expiryTime) {
      cache.delete(key);
      return -2;
    }
    
    return Math.floor((item.expiryTime - Date.now()) / 1000);
  }

  memoryZAdd(key, members, cache = this.memoryCache) {
    const zset = cache.get(key) || { members: new Map(), type: 'zset' };
    let added = 0;
    
    for (const member of members) {
      if (typeof member === 'object' && member.score !== undefined && member.value !== undefined) {
        zset.members.set(member.value, member.score);
        added++;
      }
    }
    
    cache.set(key, zset);
    return added;
  }

  memoryZRange(key, start, stop, cache = this.memoryCache) {
    const zset = cache.get(key);
    if (!zset || zset.type !== 'zset') return [];
    
    const sorted = Array.from(zset.members.entries())
      .sort((a, b) => a[1] - b[1])
      .slice(start, stop === -1 ? undefined : stop + 1)
      .map(entry => entry[0]);
    
    return sorted;
  }

  memoryZRem(key, member, cache = this.memoryCache) {
    const zset = cache.get(key);
    if (!zset || zset.type !== 'zset') return 0;
    
    const deleted = zset.members.has(member) ? 1 : 0;
    zset.members.delete(member);
    
    if (zset.members.size === 0) {
      cache.delete(key);
    }
    
    return deleted;
  }

  memoryZRemRangeByScore(key, min, max, cache = this.memoryCache) {
    const zset = cache.get(key);
    if (!zset || zset.type !== 'zset') return 0;
    
    let deleted = 0;
    for (const [member, score] of zset.members.entries()) {
      if (score >= min && score <= max) {
        zset.members.delete(member);
        deleted++;
      }
    }
    
    if (zset.members.size === 0) {
      cache.delete(key);
    }
    
    return deleted;
  }

  memoryZCard(key, cache = this.memoryCache) {
    const zset = cache.get(key);
    if (!zset || zset.type !== 'zset') return 0;
    return zset.members.size;
  }

  memoryHIncrBy(key, field, increment, cache = this.memoryCache) {
    const hash = cache.get(key) || { fields: new Map(), type: 'hash' };
    const current = hash.fields.get(field) || 0;
    const newValue = current + increment;
    hash.fields.set(field, newValue);
    cache.set(key, hash);
    return newValue;
  }

  memoryHGetAll(key, cache = this.memoryCache) {
    const hash = cache.get(key);
    if (!hash || hash.type !== 'hash') return {};
    
    const result = {};
    for (const [field, value] of hash.fields.entries()) {
      result[field] = value;
    }
    
    return result;
  }

  memoryKeys(pattern, cache = this.memoryCache) {
    const regex = new RegExp(pattern.replace(/\*/g, '.*'));
    const keys = [];
    
    for (const key of cache.keys()) {
      if (regex.test(key)) {
        keys.push(key);
      }
    }
    
    return keys;
  }

  getMemoryPipeline(cache = this.memoryCache) {
    return {
      operations: [],
      cache,
      
      exec: async () => {
        const results = [];
        for (const operation of this.operations) {
          try {
            // Execute operation based on type
            if (operation.command === 'setEx') {
              results.push(this.memorySetEx(operation.args[0], operation.args[1], operation.args[2], cache));
            } else if (operation.command === 'get') {
              results.push(this.memoryGet(operation.args[0], cache));
            } else if (operation.command === 'del') {
              results.push(this.memoryDel(operation.args[0], cache));
            }
            // Add more operations as needed
          } catch (error) {
            results.push({ error: error.message });
          }
        }
        this.operations = [];
        return results;
      }
    };
  }

  // Check Redis status
  async checkRedisStatus() {
    try {
      const { redisConnectionPool } = require('./redisConnectionPool');
      const client = redisConnectionPool.getClient('health-check');
      if (client && await client.ping()) {
        this.isRedisAvailable = true;
        this.fallbackMode = false;
        return true;
      }
    } catch (error) {
      this.isRedisAvailable = false;
      this.fallbackMode = true;
    }
    return false;
  }

  // Get status
  getStatus() {
    return {
      isRedisAvailable: this.isRedisAvailable,
      fallbackMode: this.fallbackMode,
      memoryCacheSize: this.memoryCache.size,
      timestamp: new Date().toISOString()
    };
  }
}

// Singleton instance
const redisFallbackService = new RedisFallbackService();

module.exports = {
  RedisFallbackService,
  redisFallbackService
};