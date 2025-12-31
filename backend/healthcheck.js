const http = require('http');
const { redisConnectionPool } = require('./services/redisConnectionPool');

async function checkRedisHealth() {
  try {
    // Try to get Redis client
    const redisClient = redisConnectionPool.getClient('healthcheck');
    
    if (!redisClient) {
      console.log('❌ Redis client not available');
      return false;
    }
    
    // Check if Redis is ready
    const isReady = await redisClient.isReady();
    if (!isReady) {
      console.log('❌ Redis not ready');
      return false;
    }
    
    // Test basic Redis operation
    await redisClient.ping();
    console.log('✅ Redis health check passed');
    return true;
    
  } catch (error) {
    console.log('❌ Redis health check failed:', error.message);
    return false;
  }
}

async function checkBackendHealth() {
  return new Promise((resolve) => {
    const options = {
      host: '0.0.0.0',
      port: process.env.PORT || 3000,
      path: '/health',
      timeout: 2000,
      family: 4
    };

    const request = http.request(options, (res) => {
      console.log(`Backend health check status: ${res.statusCode}`);
      resolve(res.statusCode === 200);
    });

    request.on('error', (err) => {
      console.log('Backend health check failed:', err.message);
      resolve(false);
    });

    request.end();
  });
}

async function main() {
  console.log('🔍 Starting comprehensive health check...');
  
  try {
    // Check Redis health first
    const redisHealthy = await checkRedisHealth();
    
    // Check backend health
    const backendHealthy = await checkBackendHealth();
    
    // Overall health check passes if both are healthy
    if (redisHealthy && backendHealthy) {
      console.log('✅ All health checks passed');
      process.exit(0);
    } else {
      console.log('❌ Health check failed');
      process.exit(1);
    }
    
  } catch (error) {
    console.log('❌ Health check error:', error.message);
    process.exit(1);
  }
}

// Run health check
main();