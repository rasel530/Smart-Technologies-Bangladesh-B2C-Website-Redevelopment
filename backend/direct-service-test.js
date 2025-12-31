require('dotenv').config();

console.log('🔍 DIRECT SERVICE TEST');
console.log('======================');

async function testServicesDirectly() {
  // Test database service directly
  console.log('\n1. Testing Database Service:');
  try {
    const { databaseService } = require('./services/database');
    console.log('  Database service loaded');
    
    await databaseService.connect();
    console.log('  ✅ Database service connected');
    
    const health = await databaseService.healthCheck();
    console.log('  ✅ Database health:', health.status);
    
    await databaseService.disconnect();
    console.log('  ✅ Database service disconnected');
  } catch (error) {
    console.error('  ❌ Database service failed:', error.message);
    console.error('  Stack:', error.stack);
  }

  // Test Redis service directly
  console.log('\n2. Testing Redis Service:');
  try {
    const Redis = require('redis');
    const redisUrl = process.env.REDIS_URL;
    console.log('  Redis URL:', redisUrl);
    
    const redis = Redis.createClient({ url: redisUrl });
    console.log('  Redis client created');
    
    redis.on('error', (err) => {
      console.error('  Redis error event:', err.message);
    });
    
    redis.on('connect', () => {
      console.log('  Redis connect event');
    });
    
    await redis.connect();
    console.log('  ✅ Redis connected');
    
    await redis.ping();
    console.log('  ✅ Redis ping successful');
    
    await redis.set('test_key', 'test_value', { EX: 60 });
    console.log('  ✅ Redis set operation successful');
    
    const value = await redis.get('test_key');
    console.log('  ✅ Redis get result:', value);
    
    await redis.quit();
    console.log('  ✅ Redis disconnected');
  } catch (error) {
    console.error('  ❌ Redis service failed:', error.message);
    console.error('  Stack:', error.stack);
  }

  // Test config service directly
  console.log('\n3. Testing Config Service:');
  try {
    const { configService } = require('./services/config');
    console.log('  Config service loaded');
    
    const jwtSecret = configService.get('JWT_SECRET');
    console.log('  JWT_SECRET exists:', !!jwtSecret);
    
    const dbUrl = configService.get('POSTGRES_DATABASE_URL');
    console.log('  Database URL exists:', !!dbUrl);
    
    const redisUrl = configService.get('REDIS_URL');
    console.log('  Redis URL exists:', !!redisUrl);
    
    console.log('  ✅ Config service working');
  } catch (error) {
    console.error('  ❌ Config service failed:', error.message);
    console.error('  Stack:', error.stack);
  }

  // Test logger service directly
  console.log('\n4. Testing Logger Service:');
  try {
    const { loggerService } = require('./services/logger');
    console.log('  Logger service loaded');
    
    loggerService.info('Test log message');
    console.log('  ✅ Logger service working');
  } catch (error) {
    console.error('  ❌ Logger service failed:', error.message);
    console.error('  Stack:', error.stack);
  }

  // Test auth service directly
  console.log('\n5. Testing Auth Service:');
  try {
    const { authMiddleware } = require('./middleware/auth');
    console.log('  Auth middleware loaded');
    
    // Test token generation
    const testPayload = { userId: 'test', role: 'USER' };
    const token = authMiddleware.generateToken(testPayload);
    console.log('  ✅ Token generated:', token.substring(0, 20) + '...');
    
    // Test token verification
    const decoded = authMiddleware.verifyToken(token);
    console.log('  ✅ Token verified:', decoded);
    
    console.log('  ✅ Auth service working');
  } catch (error) {
    console.error('  ❌ Auth service failed:', error.message);
    console.error('  Stack:', error.stack);
  }

  console.log('\n======================');
  console.log('🔍 DIRECT SERVICE TEST COMPLETE');
}

testServicesDirectly().catch(console.error);