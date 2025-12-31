#!/usr/bin/env node

/**
 * Redis Docker Connectivity Test
 * 
 * This script tests Redis connectivity in Docker environment
 * to verify that the configuration fixes are working properly.
 */

const Redis = require('redis');
const { configService } = require('./services/config');
const { redisConnectionPool } = require('./services/redisConnectionPool');
const { redisStartupValidator } = require('./services/redisStartupValidator');

console.log('🔍 Redis Docker Connectivity Test');
console.log('================================');

async function testRedisConnectivity() {
  try {
    // 1. Environment Detection
    console.log('\n📋 Step 1: Environment Detection');
    console.log('-----------------------------------');
    
    const isDocker = configService.isDocker();
    const nodeEnv = process.env.NODE_ENV;
    const redisHost = process.env.REDIS_HOST;
    const redisPort = process.env.REDIS_PORT;
    const redisPassword = process.env.REDIS_PASSWORD;
    const redisUrl = process.env.REDIS_URL;
    
    console.log(`Environment: ${nodeEnv}`);
    console.log(`Is Docker: ${isDocker}`);
    console.log(`Redis Host: ${redisHost}`);
    console.log(`Redis Port: ${redisPort}`);
    console.log(`Redis Password: ${redisPassword ? '***' : 'none'}`);
    console.log(`Redis URL: ${redisUrl ? redisUrl.replace(/:([^:@]+)@/, ':***@') : 'none'}`);
    
    // 2. Configuration Validation
    console.log('\n📋 Step 2: Configuration Validation');
    console.log('--------------------------------------');
    
    const configValidation = configService.validateRedisConfig();
    if (configValidation.isValid) {
      console.log('✅ Redis configuration is valid');
      console.log(`Host: ${configValidation.config.host}`);
      console.log(`Port: ${configValidation.config.port}`);
      console.log(`Has Password: ${configValidation.config.hasPassword}`);
      console.log(`Environment: ${configValidation.config.environment}`);
      console.log(`Is Docker: ${configValidation.config.isDocker}`);
    } else {
      console.log('❌ Redis configuration validation failed');
      console.log('Errors:', configValidation.errors);
      return false;
    }
    
    // 3. Direct Redis Connection Test
    console.log('\n📋 Step 3: Direct Redis Connection Test');
    console.log('----------------------------------------');
    
    let directClient;
    try {
      const redisConfig = configService.getRedisConfigWithEnvironment();
      const redisUrl = redisConfig.password
        ? `redis://:${redisConfig.password}@${redisConfig.host}:${redisConfig.port}`
        : `redis://${redisConfig.host}:${redisConfig.port}`;
      
      console.log(`Attempting connection to: ${redisUrl.replace(/:([^:@]+)@/, ':***@')}`);
      
      directClient = Redis.createClient({
        url: redisUrl,
        socket: {
          connectTimeout: 15000,
          lazyConnect: true
        }
      });
      
      directClient.on('error', (err) => {
        console.error('❌ Direct Redis client error:', err.message);
      });
      
      directClient.on('connect', () => {
        console.log('✅ Direct Redis client connected');
      });
      
      directClient.on('ready', () => {
        console.log('✅ Direct Redis client ready');
      });
      
      await directClient.connect();
      
      // Test basic operations
      const pingResult = await directClient.ping();
      console.log(`🏓 PING result: ${pingResult}`);
      
      if (pingResult === 'PONG') {
        console.log('✅ Direct Redis connection successful');
        
        // Test basic operations
        const testKey = `docker-test-${Date.now()}`;
        const testValue = 'docker-connectivity-test';
        
        await directClient.setEx(testKey, 60, testValue);
        console.log('✅ Redis SET operation successful');
        
        const getValue = await directClient.get(testKey);
        console.log(`📖 Redis GET result: ${getValue}`);
        
        if (getValue === testValue) {
          console.log('✅ Redis GET operation successful');
        } else {
          console.log('❌ Redis GET operation failed');
        }
        
        await directClient.del(testKey);
        console.log('✅ Redis DEL operation successful');
        
      } else {
        console.log('❌ Redis PING test failed');
        return false;
      }
      
    } catch (error) {
      console.error('❌ Direct Redis connection failed:', error.message);
      console.error('Error code:', error.code);
      return false;
    } finally {
      if (directClient) {
        try {
          await directClient.quit();
        } catch (error) {
          console.warn('Warning: Error closing direct Redis client:', error.message);
        }
      }
    }
    
    // 4. Redis Connection Pool Test
    console.log('\n📋 Step 4: Redis Connection Pool Test');
    console.log('---------------------------------------');
    
    try {
      // Initialize connection pool
      await redisConnectionPool.initialize();
      
      // Get client from pool
      const poolClient = redisConnectionPool.getClient('docker-test');
      if (!poolClient) {
        console.log('❌ Failed to get Redis client from pool');
        return false;
      }
      
      // Test pool client
      const poolPingResult = await poolClient.ping();
      console.log(`🏓 Pool PING result: ${poolPingResult}`);
      
      if (poolPingResult === 'PONG') {
        console.log('✅ Redis connection pool test successful');
      } else {
        console.log('❌ Redis connection pool PING test failed');
        return false;
      }
      
      // Test basic operations through pool
      const poolTestKey = `docker-pool-test-${Date.now()}`;
      const poolTestValue = 'docker-pool-connectivity-test';
      
      const poolSetResult = await poolClient.setEx(poolTestKey, 60, poolTestValue);
      console.log(`📝 Pool SET result: ${poolSetResult}`);
      
      const poolGetValue = await poolClient.get(poolTestKey);
      console.log(`📖 Pool GET result: ${poolGetValue}`);
      
      if (poolGetValue === poolTestValue) {
        console.log('✅ Redis connection pool operations successful');
      } else {
        console.log('❌ Redis connection pool operations failed');
        return false;
      }
      
      const poolDelResult = await poolClient.del(poolTestKey);
      console.log(`🗑️ Pool DEL result: ${poolDelResult}`);
      
    } catch (error) {
      console.error('❌ Redis connection pool test failed:', error.message);
      console.error('Error code:', error.code);
      return false;
    }
    
    // 5. Redis Startup Validator Test
    console.log('\n📋 Step 5: Redis Startup Validator Test');
    console.log('------------------------------------------');
    
    try {
      const validationResult = await redisStartupValidator.validateRedisStartup();
      if (validationResult) {
        console.log('✅ Redis startup validator test successful');
      } else {
        console.log('❌ Redis startup validator test failed');
        return false;
      }
    } catch (error) {
      console.error('❌ Redis startup validator test error:', error.message);
      return false;
    }
    
    // 6. Connection Pool Status
    console.log('\n📋 Step 6: Connection Pool Status');
    console.log('---------------------------------');
    
    const poolStatus = redisConnectionPool.getStatus();
    console.log('Pool Status:', JSON.stringify(poolStatus, null, 2));
    
    const poolStats = redisConnectionPool.getStats();
    console.log('Pool Stats:', JSON.stringify(poolStats, null, 2));
    
    console.log('\n🎉 All Redis connectivity tests passed!');
    console.log('=====================================');
    return true;
    
  } catch (error) {
    console.error('\n❌ Redis connectivity test failed:', error.message);
    console.error('Stack trace:', error.stack);
    return false;
  }
}

// Run the test
if (require.main === module) {
  testRedisConnectivity()
    .then((success) => {
      process.exit(success ? 0 : 1);
    })
    .catch((error) => {
      console.error('Test execution failed:', error);
      process.exit(1);
    });
}

module.exports = { testRedisConnectivity };