const Redis = require('redis');

async function testRedisIntegration() {
  console.log('🔄 Testing Redis integration...');
  
  try {
    // Create Redis client with updated configuration
    const redisClient = Redis.createClient({
      host: 'redis',
      port: 6379,
      password: 'redis_smarttech_2024',
      connectTimeout: 10000,
      lazyConnect: true
    });

    // Test connection
    await redisClient.connect();
    console.log('✅ Redis connected successfully');

    // Test basic operations
    await redisClient.set('test:key', 'Redis integration test value');
    const value = await redisClient.get('test:key');
    console.log('✅ Redis SET/GET test passed:', value);

    // Test list operations
    await redisClient.lPush('test:list', 'item1');
    await redisClient.lPush('test:list', 'item2');
    const listLength = await redisClient.lLen('test:list');
    console.log('✅ Redis LIST test passed, length:', listLength);

    // Test hash operations
    await redisClient.hSet('test:hash', 'field1', 'value1');
    const hashValue = await redisClient.hGet('test:hash', 'field1');
    console.log('✅ Redis HASH test passed:', hashValue);

    // Clear test data
    await redisClient.del('test:key');
    await redisClient.del('test:list');
    await redisClient.del('test:hash');
    console.log('🧹 Test data cleared');

    // Close connection
    await redisClient.quit();
    console.log('✅ Redis integration test completed successfully');
    
    return true;
  } catch (error) {
    console.error('❌ Redis integration test failed:', error.message);
    return false;
  }
}

// Run the test
testRedisIntegration().then(success => {
  if (success) {
    console.log('🎉 All Redis integration tests passed!');
    process.exit(0);
  } else {
    console.log('💥 Redis integration tests failed!');
    process.exit(1);
  }
}).catch(error => {
  console.error('💥 Unexpected error during Redis test:', error);
  process.exit(1);
});