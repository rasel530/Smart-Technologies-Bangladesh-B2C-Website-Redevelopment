#!/usr/bin/env node

/**
 * Redis Connectivity Verification Script
 * 
 * This script verifies that Redis is properly configured and accessible
 * before the backend application starts completely.
 */

const Redis = require('redis');
const { loggerService } = require('./services/logger');

// Redis configuration from environment
const redisConfig = {
  url: process.env.REDIS_URL || 'redis://:redis_smarttech_2024@redis:6379',
  socket: {
    connectTimeout: 10000,
    lazyConnect: true
  }
};

async function verifyRedisConnection() {
  console.log('🔍 Starting Redis connectivity verification...');
  
  let client;
  let attempts = 0;
  const maxAttempts = 10;
  const baseDelay = 2000; // 2 seconds

  try {
    // Create Redis client
    client = Redis.createClient(redisConfig);

    // Set up event handlers
    client.on('error', (err) => {
      console.error(`❌ Redis connection error: ${err.message}`);
    });

    client.on('connect', () => {
      console.log('✅ Redis connected successfully');
    });

    client.on('ready', () => {
      console.log('✅ Redis ready for operations');
    });

    // Attempt connection with retry logic
    for (attempts = 0; attempts < maxAttempts; attempts++) {
      try {
        console.log(`🔄 Attempting Redis connection (${attempts + 1}/${maxAttempts})...`);
        
        await client.connect();
        
        // Test basic operations
        const pong = await client.ping();
        if (pong !== 'PONG') {
          throw new Error('Redis ping test failed');
        }
        
        // Test set/get operations
        const testKey = 'redis-connectivity-test';
        const testValue = `test-${Date.now()}`;
        
        await client.setEx(testKey, 60, testValue);
        const retrievedValue = await client.get(testKey);
        
        if (retrievedValue !== testValue) {
          throw new Error('Redis set/get test failed');
        }
        
        // Clean up test key
        await client.del(testKey);
        
        console.log('✅ Redis operations test passed');
        console.log('✅ Redis connectivity verification completed successfully');
        
        await client.quit();
        return true;
        
      } catch (error) {
        console.error(`❌ Redis connection attempt ${attempts + 1} failed: ${error.message}`);
        
        if (attempts < maxAttempts - 1) {
          const delay = baseDelay * Math.pow(2, attempts);
          console.log(`⏳ Waiting ${Math.round(delay)}ms before next attempt...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    throw new Error(`Failed to connect to Redis after ${maxAttempts} attempts`);
    
  } catch (error) {
    console.error('❌ Redis connectivity verification failed:', error.message);
    
    if (client) {
      try {
        await client.quit();
      } catch (quitError) {
        console.error('Error closing Redis client:', quitError.message);
      }
    }
    
    return false;
  }
}

async function checkRedisEnvironment() {
  console.log('🔍 Checking Redis environment configuration...');
  
  const requiredEnvVars = [
    'REDIS_HOST',
    'REDIS_PORT',
    'REDIS_PASSWORD',
    'REDIS_URL'
  ];
  
  let missingVars = [];
  let configIssues = [];
  
  requiredEnvVars.forEach(varName => {
    if (!process.env[varName]) {
      missingVars.push(varName);
    }
  });
  
  if (missingVars.length > 0) {
    configIssues.push(`Missing environment variables: ${missingVars.join(', ')}`);
  }
  
  // Check Redis URL format
  const redisUrl = process.env.REDIS_URL;
  if (redisUrl && !redisUrl.startsWith('redis://')) {
    configIssues.push(`Invalid REDIS_URL format: ${redisUrl}`);
  }
  
  if (configIssues.length > 0) {
    console.error('❌ Redis configuration issues found:');
    configIssues.forEach(issue => console.error(`  - ${issue}`));
    return false;
  }
  
  console.log('✅ Redis environment configuration is valid');
  console.log(`   REDIS_HOST: ${process.env.REDIS_HOST}`);
  console.log(`   REDIS_PORT: ${process.env.REDIS_PORT}`);
  console.log(`   REDIS_URL: ${process.env.REDIS_URL ? '[configured]' : '[not set]'}`);
  
  return true;
}

async function main() {
  console.log('🚀 Redis Connectivity Verification Script');
  console.log('=====================================');
  
  try {
    // Check environment configuration
    const envValid = await checkRedisEnvironment();
    if (!envValid) {
      console.error('❌ Environment validation failed');
      process.exit(1);
    }
    
    // Verify Redis connection
    const connected = await verifyRedisConnection();
    if (!connected) {
      console.error('❌ Redis connection verification failed');
      process.exit(1);
    }
    
    console.log('✅ All Redis connectivity checks passed');
    console.log('🎉 Backend can safely start with Redis support');
    
  } catch (error) {
    console.error('❌ Unexpected error during verification:', error.message);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  }
}

// Run verification if this script is executed directly
if (require.main === module) {
  main().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

module.exports = {
  verifyRedisConnection,
  checkRedisEnvironment
};