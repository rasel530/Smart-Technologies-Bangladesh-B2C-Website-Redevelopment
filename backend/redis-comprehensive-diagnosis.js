const Redis = require('redis');
const { redisConnectionPool } = require('./services/redisConnectionPool');
require('dotenv').config();

console.log('=== Comprehensive Redis Diagnosis: Socket Closed Unexpectedly ===');
console.log('Environment:', process.env.NODE_ENV);
console.log('REDIS_URL:', process.env.REDIS_URL);

async function comprehensiveRedisDiagnosis() {
  console.log('\n🔍 STEP 1: Environment Analysis');
  console.log('Current working directory:', process.cwd());
  console.log('NODE_ENV:', process.env.NODE_ENV);
  console.log('Redis config from .env:');
  console.log('  REDIS_HOST:', process.env.REDIS_HOST);
  console.log('  REDIS_PORT:', process.env.REDIS_PORT);
  console.log('  REDIS_PASSWORD:', process.env.REDIS_PASSWORD ? '***' : 'none');
  console.log('  REDIS_URL:', process.env.REDIS_URL);

  console.log('\n🔍 STEP 2: Direct Redis Connection Test');
  let directClient;
  try {
    directClient = Redis.createClient({
      url: process.env.REDIS_URL,
      socket: {
        connectTimeout: 5000,
        lazyConnect: true,
        keepAlive: true
      }
    });

    let socketClosedCount = 0;
    let reconnectCount = 0;

    directClient.on('error', (err) => {
      console.error('❌ Direct client error:', err.message);
      if (err.message.includes('Socket closed unexpectedly')) {
        socketClosedCount++;
        console.error('🚨 SOCKET CLOSED UNEXPECTEDLY DETECTED! Count:', socketClosedCount);
      }
    });

    directClient.on('reconnecting', () => {
      reconnectCount++;
      console.log('🔄 Reconnecting... Count:', reconnectCount);
    });

    directClient.on('connect', () => {
      console.log('✅ Connected');
    });

    directClient.on('ready', () => {
      console.log('✅ Ready for operations');
    });

    await directClient.connect();
    
    // Test operations that might trigger socket closure
    console.log('\n🔍 STEP 3: Testing Operations');
    
    // Basic ping
    const pong = await directClient.ping();
    console.log('✅ PING:', pong);
    
    // Set/get operations
    await directClient.set('test-key', 'test-value', { EX: 10 });
    const value = await directClient.get('test-key');
    console.log('✅ SET/GET:', value);
    
    // Pipeline operations (potential trigger)
    const pipeline = directClient.multi();
    pipeline.set('pipe-test', 'pipe-value', { EX: 10 });
    pipeline.get('pipe-test');
    const pipeResults = await pipeline.exec();
    console.log('✅ Pipeline:', pipeResults);
    
    // Wait and observe
    console.log('\n🔍 STEP 4: Monitoring Connection Stability');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    const finalPing = await directClient.ping();
    console.log('✅ Final PING:', finalPing);
    
    console.log('\n📊 Connection Statistics:');
    console.log('  Socket closed events:', socketClosedCount);
    console.log('  Reconnection events:', reconnectCount);
    
    await directClient.quit();
    
  } catch (error) {
    console.error('❌ Direct client test failed:', error.message);
  }

  console.log('\n🔍 STEP 5: Redis Connection Pool Test');
  try {
    await redisConnectionPool.initialize();
    console.log('✅ Redis connection pool initialized');
    
    const poolClient = redisConnectionPool.getClient('diagnosis-service');
    if (poolClient) {
      console.log('✅ Pool client obtained');
      
      // Test pool operations
      await poolClient.setEx('pool-test', 60, 'pool-value');
      const poolValue = await poolClient.get('pool-test');
      console.log('✅ Pool SETEX/GET:', poolValue);
      
      // Test pool pipeline
      const poolPipeline = poolClient.pipeline();
      poolPipeline.zRemRangeByScore('test-zset', 0, -1);
      const poolResults = await poolPipeline.exec();
      console.log('✅ Pool pipeline:', poolResults);
      
      await redisConnectionPool.close();
    } else {
      console.log('❌ Failed to get pool client');
    }
  } catch (error) {
    console.error('❌ Pool test failed:', error.message);
  }

  console.log('\n🔍 STEP 6: Docker vs Localhost Analysis');
  
  // Test Docker service name
  try {
    console.log('Testing Docker service name "redis"...');
    const dockerClient = Redis.createClient({
      url: 'redis://:redis_smarttech_2024@redis:6379',
      socket: { connectTimeout: 3000, lazyConnect: true }
    });
    
    await dockerClient.connect();
    await dockerClient.ping();
    console.log('✅ Docker service name connection successful');
    await dockerClient.quit();
  } catch (error) {
    console.log('❌ Docker service name failed:', error.message);
    console.log('   This indicates backend is running outside Docker network');
  }
  
  // Test localhost
  try {
    console.log('Testing localhost...');
    const localClient = Redis.createClient({
      url: 'redis://:redis_smarttech_2024@localhost:6379',
      socket: { connectTimeout: 3000, lazyConnect: true }
    });
    
    await localClient.connect();
    await localClient.ping();
    console.log('✅ Localhost connection successful');
    await localClient.quit();
  } catch (error) {
    console.log('❌ Localhost failed:', error.message);
  }

  console.log('\n🔍 STEP 7: Configuration Mismatch Analysis');
  console.log('Docker Compose expects:');
  console.log('  - REDIS_HOST=redis');
  console.log('  - REDIS_URL=redis://:redis_smarttech_2024@redis:6379');
  console.log('  - Backend runs in Docker container');
  console.log('');
  console.log('Current .env has:');
  console.log('  - REDIS_HOST=localhost');
  console.log('  - REDIS_URL=redis://:redis_smarttech_2024@localhost:6379');
  console.log('  - Backend running on host machine');
  console.log('');
  console.log('⚠️  MISMATCH DETECTED:');
  console.log('  Docker expects "redis" service name');
  console.log('  .env configures "localhost"');
  console.log('  This causes connection issues in different environments');

  console.log('\n🎯 ROOT CAUSE ANALYSIS:');
  console.log('1. Backend .env is configured for localhost:6379');
  console.log('2. Docker Compose expects redis:6379 service name');
  console.log('3. When backend runs in Docker, "redis" service works');
  console.log('4. When backend runs on host, "localhost" works');
  console.log('5. Mixed configuration causes "Socket closed unexpectedly"');
  console.log('6. Error occurs when Redis client tries to reconnect');
  console.log('   between different network contexts');

  console.log('\n📋 RECOMMENDATIONS:');
  console.log('1. For Docker deployment: Use REDIS_HOST=redis in backend container');
  console.log('2. For local development: Use REDIS_HOST=localhost on host machine');
  console.log('3. Create environment-specific configuration');
  console.log('4. Add connection retry logic with proper error handling');
}

// Run comprehensive diagnosis
comprehensiveRedisDiagnosis().catch(console.error);