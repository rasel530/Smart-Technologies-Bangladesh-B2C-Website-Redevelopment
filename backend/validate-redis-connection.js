const Redis = require('redis');
require('dotenv').config();

console.log('🔍 VALIDATING REDIS CONNECTION...\n');

const redisUrl = process.env.REDIS_URL;
console.log('📋 Redis URL:', redisUrl);

// Test Redis connection
async function testRedisConnection() {
  try {
    console.log('🔄 Attempting Redis connection...');
    
    const redis = Redis.createClient({
      url: redisUrl,
      retry_delay_on_failover: 100,
      max_retries_per_request: 3
    });
    
    redis.on('error', (err) => {
      console.log('❌ Redis connection error:', err.message);
    });
    
    redis.on('connect', () => {
      console.log('✅ Redis connected successfully');
    });
    
    await redis.connect();
    
    // Test basic operation
    await redis.set('test_key', 'test_value');
    const value = await redis.get('test_key');
    
    if (value === 'test_value') {
      console.log('✅ Redis read/write test passed');
    } else {
      console.log('❌ Redis read/write test failed');
    }
    
    await redis.quit();
    console.log('✅ Redis connection test completed successfully');
    
  } catch (error) {
    console.log('❌ Redis connection failed:', error.message);
    console.log('📍 Error details:', {
      code: error.code,
      errno: error.errno,
      syscall: error.syscall
    });
    
    // Provide specific recommendations
    if (error.code === 'ECONNREFUSED') {
      console.log('\n💡 RECOMMENDATION: Redis server is not running');
      console.log('   - Start Redis service');
      console.log('   - Check if Redis is running on port 6379');
    } else if (error.code === 'ENOTFOUND') {
      console.log('\n💡 RECOMMENDATION: Redis hostname not found');
      console.log('   - Check Redis server configuration');
      console.log('   - Verify DNS resolution');
    } else {
      console.log('\n💡 RECOMMENDATION: Check Redis configuration');
      console.log('   - Verify Redis URL format');
      console.log('   - Check authentication credentials');
    }
  }
}

testRedisConnection();