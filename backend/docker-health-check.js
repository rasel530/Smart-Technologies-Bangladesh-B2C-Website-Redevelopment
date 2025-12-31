#!/usr/bin/env node

/**
 * Docker Health Check Script
 * 
 * This script validates Redis connectivity in Docker environment
 * and is used by Docker Compose for health checks.
 */

const Redis = require('redis');
const { configService } = require('./services/config');

console.log('🏥 Docker Health Check - Redis Connectivity');
console.log('==========================================');

async function healthCheck() {
  try {
    // Get Redis configuration
    const redisConfig = configService.getRedisConfigWithEnvironment();
    
    if (!redisConfig || !redisConfig.host || !redisConfig.port) {
      console.error('❌ Invalid Redis configuration');
      process.exit(1);
    }
    
    // Create Redis client
    const redisUrl = redisConfig.password
      ? `redis://:${redisConfig.password}@${redisConfig.host}:${redisConfig.port}`
      : `redis://${redisConfig.host}:${redisConfig.port}`;
    
    const client = Redis.createClient({
      url: redisUrl,
      socket: {
        connectTimeout: 5000,
        lazyConnect: true
      }
    });
    
    // Set timeout
    const timeout = setTimeout(() => {
      console.error('❌ Health check timeout');
      process.exit(1);
    }, 10000);
    
    try {
      await client.connect();
      const result = await client.ping();
      
      clearTimeout(timeout);
      
      if (result === 'PONG') {
        console.log('✅ Redis health check passed');
        console.log(`Connected to: ${redisConfig.host}:${redisConfig.port}`);
        await client.quit();
        process.exit(0);
      } else {
        console.error(`❌ Redis health check failed: Expected PONG, got ${result}`);
        process.exit(1);
      }
    } catch (error) {
      clearTimeout(timeout);
      console.error('❌ Redis health check failed:', error.message);
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Health check error:', error.message);
    process.exit(1);
  }
}

// Run health check
healthCheck();