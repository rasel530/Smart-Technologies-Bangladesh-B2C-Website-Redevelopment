const Redis = require('redis');

console.log('🧪 Testing Redis Connection with ACL Authentication');
console.log('===============================================');

async function testRedisACLAuth() {
  try {
    console.log('📡 Testing Redis connection with ACL auth...');
    
    // Test with username and password (ACL style)
    const client = Redis.createClient({
      url: 'redis://default:redis_smarttech_2024@localhost:6379',
      socket: {
        connectTimeout: 5000,
        lazyConnect: false
      }
    });

    client.on('error', (err) => {
      console.error('❌ Redis error:', err.message);
    });

    client.on('connect', () => {
      console.log('✅ Redis connected with ACL auth');
    });

    client.on('ready', async () => {
      console.log('✅ Redis ready with ACL auth');
      
      try {
        await client.set('test_acl_auth', 'works');
        console.log('✅ SET operation successful');
        
        const value = await client.get('test_acl_auth');
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

testRedisACLAuth();