#!/usr/bin/env node

/**
 * Comprehensive Redis Fixes Test Script
 * 
 * This script tests all the Redis connectivity fixes that were implemented
 * to ensure the Redis connectivity issues are resolved.
 */

const { redisConnectionPool } = require('./services/redisConnectionPool');
const { verifyRedisConnection, checkRedisEnvironment } = require('./verify-redis-connectivity');

async function testRedisConnectionPool() {
  console.log('🧪 Testing Redis Connection Pool...');
  
  try {
    // Initialize the connection pool
    await redisConnectionPool.initialize();
    
    // Get a client for testing
    const testClient = redisConnectionPool.getClient('test-service');
    
    if (!testClient) {
      console.log('❌ Failed to get Redis client from connection pool');
      return false;
    }
    
    // Test basic operations
    console.log('🔄 Testing basic Redis operations...');
    
    // Test ping
    const pong = await testClient.ping();
    if (pong !== 'PONG') {
      console.log('❌ Redis ping test failed');
      return false;
    }
    console.log('✅ Redis ping test passed');
    
    // Test set/get operations
    const testKey = `test-redis-fixes-${Date.now()}`;
    const testValue = 'Redis connectivity test successful';
    
    await testClient.setEx(testKey, 60, testValue);
    const retrievedValue = await testClient.get(testKey);
    
    if (retrievedValue !== testValue) {
      console.log('❌ Redis set/get test failed');
      return false;
    }
    console.log('✅ Redis set/get test passed');
    
    // Test TTL
    const ttl = await testClient.ttl(testKey);
    if (ttl <= 0) {
      console.log('❌ Redis TTL test failed');
      return false;
    }
    console.log('✅ Redis TTL test passed');
    
    // Test existence
    const exists = await testClient.exists(testKey);
    if (!exists) {
      console.log('❌ Redis EXISTS test failed');
      return false;
    }
    console.log('✅ Redis EXISTS test passed');
    
    // Cleanup
    await testClient.del(testKey);
    const existsAfterDelete = await testClient.exists(testKey);
    if (existsAfterDelete) {
      console.log('❌ Redis DEL test failed');
      return false;
    }
    console.log('✅ Redis DEL test passed');
    
    console.log('✅ All Redis connection pool tests passed');
    return true;
    
  } catch (error) {
    console.log('❌ Redis connection pool test failed:', error.message);
    return false;
  }
}

async function testRedisStatus() {
  console.log('📊 Checking Redis connection status...');
  
  const status = redisConnectionPool.getStatus();
  console.log('Redis Status:', JSON.stringify(status, null, 2));
  
  if (!status.isInitialized) {
    console.log('❌ Redis connection pool not initialized');
    return false;
  }
  
  if (!status.hasClient) {
    console.log('❌ Redis client not available');
    return false;
  }
  
  if (status.isReconnecting) {
    console.log('⚠️ Redis is currently reconnecting');
    return false;
  }
  
  console.log('✅ Redis status check passed');
  return true;
}

async function testRateLimitingScenario() {
  console.log('🚦 Testing rate limiting scenario...');
  
  try {
    const rateLimitClient = redisConnectionPool.getClient('rate-limiting');
    
    if (!rateLimitClient) {
      console.log('❌ Failed to get Redis client for rate limiting');
      return false;
    }
    
    // Simulate rate limiting operations
    const clientId = 'test-client-' + Date.now();
    const windowKey = `rate_limit:${clientId}`;
    const now = Math.floor(Date.now() / 1000);
    const windowSize = 60; // 1 minute window
    const maxRequests = 10;
    
    // Clear any existing data
    await rateLimitClient.del(windowKey);
    
    // Add some requests to the sliding window
    for (let i = 0; i < 5; i++) {
      await rateLimitClient.zAdd(windowKey, [
        { score: now - i, value: `request-${i}` }
      ]);
    }
    
    // Count requests in the window
    const minScore = now - windowSize;
    await rateLimitClient.zRemRangeByScore(windowKey, '-inf', minScore);
    const requestCount = await rateLimitClient.zCard(windowKey);
    
    if (requestCount !== 5) {
      console.log(`❌ Rate limiting test failed: expected 5 requests, got ${requestCount}`);
      return false;
    }
    
    // Test if rate limit would be exceeded
    const wouldExceed = requestCount >= maxRequests;
    if (wouldExceed) {
      console.log('❌ Rate limiting test incorrectly triggered limit');
      return false;
    }
    
    // Set expiration for the key
    await rateLimitClient.expire(windowKey, windowSize);
    
    // Test TTL
    const ttl = await rateLimitClient.ttl(windowKey);
    if (ttl <= 0) {
      console.log('❌ Rate limiting key TTL test failed');
      return false;
    }
    
    // Cleanup
    await rateLimitClient.del(windowKey);
    
    console.log('✅ Rate limiting scenario test passed');
    return true;
    
  } catch (error) {
    console.log('❌ Rate limiting scenario test failed:', error.message);
    return false;
  }
}

async function testReconnectionLogic() {
  console.log('🔄 Testing reconnection logic...');
  
  try {
    // Force a reconnection
    await redisConnectionPool.forceReconnect();
    
    // Wait a bit for reconnection to complete
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Check if reconnected successfully
    const status = redisConnectionPool.getStatus();
    
    if (!status.isInitialized) {
      console.log('❌ Redis not reconnected properly');
      return false;
    }
    
    // Test basic operation after reconnection
    const testClient = redisConnectionPool.getClient('reconnect-test');
    if (!testClient) {
      console.log('❌ Failed to get client after reconnection');
      return false;
    }
    
    await testClient.ping();
    
    console.log('✅ Reconnection logic test passed');
    return true;
    
  } catch (error) {
    console.log('❌ Reconnection logic test failed:', error.message);
    return false;
  }
}

async function main() {
  console.log('🚀 Redis Fixes Comprehensive Test');
  console.log('==================================');
  
  const tests = [
    { name: 'Environment Configuration', fn: checkRedisEnvironment },
    { name: 'Redis Connection', fn: verifyRedisConnection },
    { name: 'Connection Pool', fn: testRedisConnectionPool },
    { name: 'Redis Status', fn: testRedisStatus },
    { name: 'Rate Limiting Scenario', fn: testRateLimitingScenario },
    { name: 'Reconnection Logic', fn: testReconnectionLogic }
  ];
  
  let passedTests = 0;
  let totalTests = tests.length;
  
  for (const test of tests) {
    console.log(`\n🧪 Running ${test.name} Test...`);
    console.log('-----------------------------------');
    
    try {
      const result = await test.fn();
      if (result) {
        console.log(`✅ ${test.name} test PASSED`);
        passedTests++;
      } else {
        console.log(`❌ ${test.name} test FAILED`);
      }
    } catch (error) {
      console.log(`❌ ${test.name} test ERROR:`, error.message);
    }
  }
  
  console.log('\n📊 Test Results Summary');
  console.log('=======================');
  console.log(`Passed: ${passedTests}/${totalTests}`);
  
  if (passedTests === totalTests) {
    console.log('🎉 ALL TESTS PASSED! Redis connectivity issues have been resolved.');
  } else {
    console.log('⚠️ Some tests failed. Redis connectivity issues may still exist.');
  }
  
  // Clean up
  await redisConnectionPool.close();
  
  process.exit(passedTests === totalTests ? 0 : 1);
}

// Run tests if this script is executed directly
if (require.main === module) {
  main().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

module.exports = {
  testRedisConnectionPool,
  testRedisStatus,
  testRateLimitingScenario,
  testReconnectionLogic
};