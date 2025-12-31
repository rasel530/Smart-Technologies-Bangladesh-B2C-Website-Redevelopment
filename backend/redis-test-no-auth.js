const Redis = require('redis');

console.log('🧪 Testing Redis Connection WITHOUT Authentication');
console.log('============================================');

async function testRedisNoAuth() {
  try {
    console.log('📡 Testing Redis connection without auth...');
    
    // Test without authentication first
    const client = Redis.createClient({
      url: 'redis://localhost:6379',
      socket: {
        connectTimeout: 5000,
        lazyConnect: false
      }
    });

    client.on('error', (err) => {
      console.error('❌ Redis error:', err.message);
    });

    client.on('connect', () => {
      console.log('✅ Redis connected without auth');
    });

    client.on('ready', async () => {
      console.log('✅ Redis ready without auth');
      
      try {
        await client.set('test_no_auth', 'works');
        console.log('✅ SET operation successful');
        
        const value = await client.get('test_no_auth');
        console.log('✅ GET operation successful:', value);
        
        await client.quit();
        console.log('✅ Redis connection closed successfully');
        
      } catch (opErr) {
        console.error('❌ Redis operation failed:', opErr.message);
      }
    });

    await client.connect();
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testRedisNoAuth();