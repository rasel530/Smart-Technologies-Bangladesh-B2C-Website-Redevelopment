/**
 * Redis Stability Test
 * Tests Redis connection stability and reconnection behavior
 */

const { configService } = require('./services/config');
const Redis = require('redis');

async function testRedisStability() {
  console.log('🔍 Testing Redis stability...\n');
  
  const redisConfig = configService.getRedisConfig();
  console.log('📋 Redis configuration:', {
    host: redisConfig.host,
    port: redisConfig.port,
    hasPassword: !!redisConfig.password,
    connectTimeout: redisConfig.socket?.connectTimeout,
    commandTimeout: redisConfig.socket?.commandTimeout
  });
  
  let redis = null;
  const results = {
    connectionAttempts: [],
    operations: [],
    errors: []
  };
  
  try {
    // Test 1: Initial connection
    console.log('\n--- Test 1: Initial Connection ---');
    const startTime1 = Date.now();
    redis = new Redis(redisConfig);
    
    await new Promise((resolve, reject) => {
      redis.on('connect', () => {
        const duration = Date.now() - startTime1;
        console.log(`✅ Initial connection successful (${duration}ms)`);
        results.connectionAttempts.push({
          attempt: 1,
          success: true,
          duration
        });
        resolve();
      });
      
      redis.on('error', (error) => {
        const duration = Date.now() - startTime1;
        console.error(`❌ Initial connection failed (${duration}ms):`, error.message);
        results.errors.push({
          test: 'initial_connection',
          error: error.message,
          duration
        });
        reject(error);
      });
      
      // Set timeout
      setTimeout(() => {
        if (!redis.status || redis.status !== 'ready') {
          reject(new Error('Connection timeout'));
        }
      }, redisConfig.socket?.connectTimeout || 15000);
    });
    
    // Test 2: Basic operations
    console.log('\n--- Test 2: Basic Operations ---');
    const operations = [
      { name: 'SET', fn: () => redis.set('test_key', 'test_value') },
      { name: 'GET', fn: () => redis.get('test_key') },
      { name: 'DEL', fn: () => redis.del('test_key') },
      { name: 'EXISTS', fn: () => redis.exists('test_key') },
      { name: 'PING', fn: () => redis.ping() }
    ];
    
    for (const op of operations) {
      const startTime = Date.now();
      try {
        const result = await op.fn();
        const duration = Date.now() - startTime;
        console.log(`✅ ${op.name} successful (${duration}ms)`);
        results.operations.push({
          operation: op.name,
          success: true,
          duration
        });
      } catch (error) {
        const duration = Date.now() - startTime;
        console.error(`❌ ${op.name} failed (${duration}ms):`, error.message);
        results.operations.push({
          operation: op.name,
          success: false,
          error: error.message,
          duration
        });
      }
    }
    
    // Test 3: Connection resilience (disconnect and reconnect)
    console.log('\n--- Test 3: Connection Resilience ---');
    console.log('Testing disconnect and reconnect behavior...');
    
    await redis.quit();
    console.log('✅ Disconnected successfully');
    
    // Wait before reconnect
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Reconnect
    const startTime2 = Date.now();
    redis = new Redis(redisConfig);
    
    await new Promise((resolve, reject) => {
      redis.on('connect', () => {
        const duration = Date.now() - startTime2;
        console.log(`✅ Reconnection successful (${duration}ms)`);
        results.connectionAttempts.push({
          attempt: 2,
          success: true,
          duration
        });
        resolve();
      });
      
      redis.on('error', (error) => {
        const duration = Date.now() - startTime2;
        console.error(`❌ Reconnection failed (${duration}ms):`, error.message);
        results.errors.push({
          test: 'reconnection',
          error: error.message,
          duration
        });
        reject(error);
      });
      
      setTimeout(() => {
        if (!redis.status || redis.status !== 'ready') {
          reject(new Error('Reconnection timeout'));
        }
      }, redisConfig.socket?.connectTimeout || 15000);
    });
    
    // Test 4: Multiple rapid operations
    console.log('\n--- Test 4: Multiple Rapid Operations ---');
    const rapidOps = [];
    for (let i = 0; i < 10; i++) {
      const startTime = Date.now();
      try {
        await redis.set(`rapid_test_${i}`, `value_${i}`);
        await redis.get(`rapid_test_${i}`);
        const duration = Date.now() - startTime;
        rapidOps.push({ index: i, success: true, duration });
      } catch (error) {
        const duration = Date.now() - startTime;
        rapidOps.push({ index: i, success: false, error: error.message, duration });
      }
    }
    
    const successfulRapidOps = rapidOps.filter(op => op.success).length;
    const avgRapidOpDuration = rapidOps.reduce((sum, op) => sum + op.duration, 0) / rapidOps.length;
    console.log(`✅ Rapid operations: ${successfulRapidOps}/10 successful`);
    console.log(`✅ Average rapid operation duration: ${avgRapidOpDuration.toFixed(2)}ms`);
    
    // Cleanup
    await redis.quit();
    console.log('\n✅ All tests completed');
    
    return {
      success: true,
      message: 'Redis stability test passed',
      results: {
        connectionAttempts: results.connectionAttempts,
        operations: results.operations,
        rapidOperations: {
          total: 10,
          successful: successfulRapidOps,
          averageDuration: avgRapidOpDuration
        },
        errors: results.errors
      }
    };
    
  } catch (error) {
    console.error('❌ Redis stability test failed:', error.message);
    
    if (redis) {
      try {
        await redis.quit();
      } catch (quitError) {
        console.error('❌ Failed to quit Redis:', quitError.message);
      }
    }
    
    return {
      success: false,
      error: error.message,
      results
    };
  }
}

// Run test
testRedisStability()
  .then(result => {
    console.log('\n=== TEST RESULT ===');
    console.log(JSON.stringify(result, null, 2));
    process.exit(result.success ? 0 : 1);
  })
  .catch(error => {
    console.error('❌ Test execution failed:', error);
    process.exit(1);
  });
