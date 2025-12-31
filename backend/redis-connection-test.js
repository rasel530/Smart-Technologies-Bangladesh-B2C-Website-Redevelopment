const Redis = require('redis');
const { configService } = require('./services/config');

async function testRedisConnections() {
  console.log('🔍 Testing Redis Connection Diagnosis');
  console.log('==========================================');

  // Test 1: Check configuration
  console.log('\n1. Configuration Check:');
  const redisUrl = configService.get('REDIS_URL');
  console.log('   REDIS_URL from config:', redisUrl);

  // Test 2: Test different connection methods
  console.log('\n2. Testing Connection Methods:');

  // Method 1: Using URL from config
  console.log('\n   Method 1: Using config REDIS_URL');
  try {
    const client1 = Redis.createClient({
      url: redisUrl,
      retry_delay_on_failover: 100,
      max_retries_per_request: 3,
      connectTimeout: 5000,
      lazyConnect: true
    });

    client1.on('error', (err) => {
      console.error('   ❌ Error (URL method):', err.message);
    });

    client1.on('connect', () => {
      console.log('   ✅ Connected (URL method)');
    });

    await client1.connect();
    await client1.ping();
    console.log('   ✅ Ping successful (URL method)');
    await client1.quit();
  } catch (error) {
    console.error('   ❌ Failed (URL method):', error.message);
  }

  // Method 2: Using individual parameters
  console.log('\n   Method 2: Using individual parameters');
  try {
    const client2 = Redis.createClient({
      host: 'redis',
      port: 6379,
      password: 'redis_smarttech_2024',
      retry_delay_on_failover: 100,
      max_retries_per_request: 3,
      connectTimeout: 5000,
      lazyConnect: true
    });

    client2.on('error', (err) => {
      console.error('   ❌ Error (params method):', err.message);
    });

    client2.on('connect', () => {
      console.log('   ✅ Connected (params method)');
    });

    await client2.connect();
    await client2.ping();
    console.log('   ✅ Ping successful (params method)');
    await client2.quit();
  } catch (error) {
    console.error('   ❌ Failed (params method):', error.message);
  }

  // Method 3: Using localhost (for non-Docker)
  console.log('\n   Method 3: Using localhost');
  try {
    const client3 = Redis.createClient({
      host: 'localhost',
      port: 6379,
      password: 'redis_smarttech_2024',
      retry_delay_on_failover: 100,
      max_retries_per_request: 3,
      connectTimeout: 5000,
      lazyConnect: true
    });

    client3.on('error', (err) => {
      console.error('   ❌ Error (localhost method):', err.message);
    });

    client3.on('connect', () => {
      console.log('   ✅ Connected (localhost method)');
    });

    await client3.connect();
    await client3.ping();
    console.log('   ✅ Ping successful (localhost method)');
    await client3.quit();
  } catch (error) {
    console.error('   ❌ Failed (localhost method):', error.message);
  }

  // Test 3: Check environment
  console.log('\n3. Environment Check:');
  console.log('   NODE_ENV:', process.env.NODE_ENV);
  console.log('   REDIS_URL from env:', process.env.REDIS_URL);
  console.log('   REDIS_HOST from env:', process.env.REDIS_HOST);
  console.log('   REDIS_PORT from env:', process.env.REDIS_PORT);
  console.log('   REDIS_PASSWORD from env:', process.env.REDIS_PASSWORD);

  // Test 4: Network connectivity test
  console.log('\n4. Network Connectivity Test:');
  const net = require('net');

  function testConnection(host, port) {
    return new Promise((resolve) => {
      const socket = new net.Socket();
      
      socket.setTimeout(5000);
      
      socket.on('connect', () => {
        console.log(`   ✅ Can connect to ${host}:${port}`);
        socket.destroy();
        resolve(true);
      });
      
      socket.on('timeout', () => {
        console.log(`   ❌ Timeout connecting to ${host}:${port}`);
        socket.destroy();
        resolve(false);
      });
      
      socket.on('error', (err) => {
        console.log(`   ❌ Error connecting to ${host}:${port}: ${err.message}`);
        socket.destroy();
        resolve(false);
      });
      
      socket.connect(port, host);
    });
  }

  await testConnection('redis', 6379);
  await testConnection('localhost', 6379);
  await testConnection('127.0.0.1', 6379);

  console.log('\n==========================================');
  console.log('🔍 Redis Connection Diagnosis Complete');
}

// Run the tests
testRedisConnections().catch(console.error);