const Redis = require('redis');
require('dotenv').config();

console.log('=== Redis Connection Diagnosis ===');
console.log('REDIS_URL:', process.env.REDIS_URL);
console.log('NODE_ENV:', process.env.NODE_ENV);

async function testRedisConnection() {
  try {
    console.log('\n1. Testing Redis connection with current configuration...');
    
    const redisUrl = process.env.REDIS_URL;
    if (!redisUrl) {
      console.error('❌ REDIS_URL not found in environment variables');
      return;
    }
    
    console.log('2. Creating Redis client...');
    const client = Redis.createClient({
      url: redisUrl,
      socket: {
        connectTimeout: 5000,
        lazyConnect: true
      }
    });
    
    console.log('3. Setting up event handlers...');
    client.on('error', (err) => {
      console.error('❌ Redis error:', err.message);
      console.error('Error code:', err.code);
    });
    
    client.on('connect', () => {
      console.log('✅ Redis connected');
    });
    
    client.on('ready', () => {
      console.log('✅ Redis ready for operations');
    });
    
    client.on('reconnecting', () => {
      console.log('🔄 Redis reconnecting...');
    });
    
    client.on('end', () => {
      console.log('⚠️ Redis connection ended');
    });
    
    console.log('4. Attempting to connect...');
    await client.connect();
    
    console.log('5. Testing ping command...');
    const pong = await client.ping();
    console.log('✅ PING response:', pong);
    
    console.log('6. Testing set/get operations...');
    await client.set('test-key', 'test-value', { EX: 10 });
    const value = await client.get('test-key');
    console.log('✅ SET/GET test:', value);
    
    console.log('7. Testing connection info...');
    const info = await client.info();
    console.log('Redis server info:', info.split('\n').slice(0, 5).join('\n'));
    
    console.log('\n✅ All Redis tests passed!');
    
  } catch (error) {
    console.error('❌ Redis connection test failed:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    try {
      if (client && client.isOpen) {
        await client.quit();
        console.log('🔌 Redis client disconnected');
      }
    } catch (err) {
      console.error('Error disconnecting:', err.message);
    }
  }
}

testRedisConnection();