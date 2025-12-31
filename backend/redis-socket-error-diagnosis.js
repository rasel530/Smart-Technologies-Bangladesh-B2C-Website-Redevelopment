const Redis = require('redis');
require('dotenv').config();

console.log('=== Redis Socket Closed Unexpectedly Error Diagnosis ===');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('REDIS_URL:', process.env.REDIS_URL);
console.log('REDIS_HOST:', process.env.REDIS_HOST);
console.log('REDIS_PORT:', process.env.REDIS_PORT);

async function diagnoseRedisSocketError() {
  let client;
  try {
    console.log('\n1. Creating Redis client with current configuration...');
    
    // Test 1: Using localhost configuration (current .env setup)
    console.log('\n--- Test 1: localhost configuration ---');
    client = Redis.createClient({
      url: process.env.REDIS_URL,
      socket: {
        connectTimeout: 5000,
        lazyConnect: true,
        keepAlive: true,
        reconnectStrategy: (retries) => {
          console.log(`Reconnection attempt ${retries + 1}`);
          if (retries > 3) return false;
          return Math.min(1000 * Math.pow(2, retries), 3000);
        }
      }
    });

    // Enhanced error tracking
    let connectionState = 'disconnected';
    let errorCount = 0;
    const errors = [];

    client.on('error', (err) => {
      errorCount++;
      const errorInfo = {
        count: errorCount,
        message: err.message,
        code: err.code,
        stack: err.stack,
        timestamp: new Date().toISOString(),
        connectionState
      };
      errors.push(errorInfo);
      
      console.error(`❌ Redis error #${errorCount}:`, err.message);
      console.error(`   Code: ${err.code}`);
      console.error(`   Connection state: ${connectionState}`);
      console.error(`   Timestamp: ${errorInfo.timestamp}`);
      
      if (err.message.includes('Socket closed unexpectedly')) {
        console.error('🚨 TARGET ERROR DETECTED: "Socket closed unexpectedly"');
      }
    });

    client.on('connect', () => {
      connectionState = 'connected';
      console.log('✅ Redis connected');
    });

    client.on('ready', () => {
      connectionState = 'ready';
      console.log('✅ Redis ready for operations');
    });

    client.on('reconnecting', () => {
      connectionState = 'reconnecting';
      console.log('🔄 Redis reconnecting...');
    });

    client.on('end', () => {
      connectionState = 'ended';
      console.log('⚠️ Redis connection ended');
    });

    console.log('\n2. Attempting to connect...');
    await client.connect();
    
    console.log('\n3. Testing basic operations...');
    const pong = await client.ping();
    console.log('✅ PING response:', pong);
    
    console.log('\n4. Testing set/get operations...');
    await client.set('test-key', 'test-value', { EX: 10 });
    const value = await client.get('test-key');
    console.log('✅ SET/GET test:', value);
    
    console.log('\n5. Testing pipeline operations (potential trigger)...');
    const pipeline = client.multi();
    pipeline.set('pipeline-test', 'pipeline-value', { EX: 10 });
    pipeline.get('pipeline-test');
    const pipelineResults = await pipeline.exec();
    console.log('✅ Pipeline test results:', pipelineResults);
    
    console.log('\n6. Testing rapid operations (stress test)...');
    for (let i = 0; i < 10; i++) {
      await client.set(`stress-test-${i}`, `value-${i}`, { EX: 5 });
      const val = await client.get(`stress-test-${i}`);
      if (val !== `value-${i}`) {
        console.error(`❌ Stress test failed at iteration ${i}`);
        break;
      }
    }
    console.log('✅ Stress test completed');
    
    console.log('\n7. Waiting to observe connection stability...');
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    console.log('\n8. Final connection check...');
    const finalPing = await client.ping();
    console.log('✅ Final PING response:', finalPing);
    
    console.log('\n=== Test Results Summary ===');
    console.log(`Total errors encountered: ${errorCount}`);
    if (errors.length > 0) {
      console.log('\nError details:');
      errors.forEach((err, index) => {
        console.log(`${index + 1}. ${err.timestamp} - ${err.message}`);
        console.log(`   State: ${err.connectionState}, Code: ${err.code}`);
      });
    }
    
    // Test 2: Try Docker service name
    console.log('\n--- Test 2: Docker service name (redis) ---');
    try {
      const dockerClient = Redis.createClient({
        url: 'redis://:redis_smarttech_2024@redis:6379',
        socket: {
          connectTimeout: 3000,
          lazyConnect: true
        }
      });
      
      await dockerClient.connect();
      await dockerClient.ping();
      console.log('✅ Docker service name connection successful');
      await dockerClient.quit();
    } catch (error) {
      console.log('❌ Docker service name connection failed:', error.message);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    if (client && client.isOpen) {
      try {
        await client.quit();
        console.log('🔌 Redis client disconnected');
      } catch (err) {
        console.error('Error disconnecting:', err.message);
      }
    }
  }
}

// Run the diagnosis
diagnoseRedisSocketError().catch(console.error);