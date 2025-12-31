const Redis = require('redis');

console.log('Testing Redis connection to localhost:6379...');

async function testRedis() {
  try {
    const client = Redis.createClient({
      url: 'redis://redis_smarttech_2024@localhost:6379'
    });

    console.log('Attempting to connect...');
    await client.connect();
    console.log('✅ Redis connected successfully');
    
    const pong = await client.ping();
    console.log('✅ Redis PING response:', pong);
    
    await client.disconnect();
    console.log('✅ Redis disconnected');
  } catch (error) {
    console.error('❌ Redis connection failed:', error.message);
    console.error('Full error:', error);
  }
}

testRedis();