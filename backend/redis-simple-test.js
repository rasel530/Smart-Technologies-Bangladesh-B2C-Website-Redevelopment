const Redis = require('redis');

console.log('🧪 Simple Redis Connection Test');
console.log('================================');

async function testRedisConnection() {
  try {
    console.log('📡 Testing Redis connection...');
    
    // Test 1: Basic connection with localhost
    const client = Redis.createClient({
      url: 'redis://redis_smarttech_2024@localhost:6379',
      socket: {
        connectTimeout: 5000,
        lazyConnect: false
      }
    });

    client.on('error', (err) => {
      console.error('❌ Redis error:', err.message);
      console.error('❌ Full error object:', err);
    });

    client.on('connect', () => {
      console.log('✅ Redis connected');
    });

    client.on('ready', async () => {
      console.log('✅ Redis ready');
      
      try {
        // Test basic operations
        await client.set('test_key', 'test_value');
        console.log('✅ SET operation successful');
        
        const value = await client.get('test_key');
        console.log('✅ GET operation successful:', value);
        
        await client.del('test_key');
        console.log('✅ DEL operation successful');
        
        await client.quit();
        console.log('✅ Redis connection closed successfully');
        
      } catch (opErr) {
        console.error('❌ Redis operation failed:', opErr.message);
      }
    });

    await client.connect();
    console.log('✅ Connection initiated');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('❌ Full error:', error);
  }
}

testRedisConnection();