const express = require('express');
const { redisFallbackService } = require('./services/redisFallbackService');
const { databaseService } = require('./services/database');
const { configService } = require('./services/config');

const app = express();
app.use(express.json());

// Test endpoint
app.get('/test-api', async (req, res) => {
  try {
    console.log('🧪 Testing API endpoint...');
    
    // Test database connection
    const dbHealth = await databaseService.healthCheck();
    console.log('📊 Database health:', dbHealth.status);
    
    // Test Redis connection
    const redisClient = redisFallbackService.getClient('api-test');
    const redisStatus = redisFallbackService.getStatus();
    console.log('🔴 Redis status:', redisStatus);
    
    // Test Redis operations
    const testKey = 'api-test-' + Date.now();
    await redisClient.setEx(testKey, 60, 'test-value');
    const retrievedValue = await redisClient.get(testKey);
    await redisClient.del(testKey);
    
    console.log('✅ Redis operations completed successfully');
    
    res.json({
      status: 'success',
      message: 'API is unblocked and working',
      timestamp: new Date().toISOString(),
      services: {
        database: {
          status: dbHealth.status,
          responseTime: dbHealth.responseTime
        },
        redis: {
          available: redisStatus.isRedisAvailable,
          fallbackMode: redisStatus.fallbackMode,
          operationsWork: retrievedValue === 'test-value'
        }
      },
      endpoints: {
        health: '/health',
        dbStatus: '/api/db-status',
        docs: '/api-docs'
      }
    });
    
  } catch (error) {
    console.error('❌ API test failed:', error);
    res.status(500).json({
      status: 'error',
      message: 'API test failed',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Health check endpoint
app.get('/test-health', async (req, res) => {
  try {
    const dbHealth = await databaseService.healthCheck();
    const redisStatus = redisFallbackService.getStatus();
    
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        database: dbHealth.status,
        redis: redisStatus.isRedisAvailable ? 'connected' : 'fallback-mode'
      }
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

const PORT = process.env.TEST_API_PORT || 3002;

app.listen(PORT, '0.0.0.0', async () => {
  console.log(`🚀 API Test Server started on port ${PORT}`);
  console.log(`📝 Test endpoints:`);
  console.log(`   GET http://localhost:${PORT}/test-api`);
  console.log(`   GET http://localhost:${PORT}/test-health`);
  
  // Initialize services
  try {
    await databaseService.connect();
    console.log('✅ Database connected');
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
  }
  
  try {
    await redisFallbackService.initialize(require('./services/redisConnectionPool'));
    console.log('✅ Redis fallback service initialized');
  } catch (error) {
    console.warn('⚠️ Redis initialization failed, using fallback:', error.message);
  }
});

module.exports = app;