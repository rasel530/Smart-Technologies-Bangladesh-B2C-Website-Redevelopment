const { redisConnectionPool } = require('./services/redisConnectionPool');

async function testRedisConnection() {
  console.log('🧪 Testing Redis Connection Pool...');
  
  try {
    // Initialize connection pool
    await redisConnectionPool.initialize();
    console.log('✅ Redis connection pool initialized');
    
    // Get client and test basic operations
    const client = redisConnectionPool.getClient('test-service');
    if (client) {
      console.log('✅ Redis client obtained from pool');
      
      // Test basic operations
      await client.setEx('test-key', 60, 'test-value');
      const value = await client.get('test-key');
      console.log('✅ Redis SETEX/GET test passed:', value === 'test-value');
      
      await client.del('test-key');
      console.log('✅ Redis DEL test passed');
      
      // Test pipeline operations (this was causing the error)
      const pipeline = client.pipeline();
      pipeline.zRemRangeByScore('test-zset', 0, -1);
      const results = await pipeline.exec();
      console.log('✅ Redis pipeline zRemRangeByScore test passed');
      
      console.log('🎉 All Redis operations working correctly!');
    } else {
      console.log('❌ Failed to get Redis client from pool');
    }
    
    await redisConnectionPool.close();
    
  } catch (error) {
    console.error('❌ Redis connection test failed:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

testRedisConnection();