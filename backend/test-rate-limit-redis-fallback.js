const express = require('express');
const { rateLimitService } = require('./services/rateLimitService');
const { redisFallbackService } = require('./services/redisFallbackService');
const { redisConnectionPool } = require('./services/redisConnectionPool');

const app = express();
const PORT = process.env.PORT || 3001;

// Test middleware
app.use(express.json());

// Test rate limiting with different configurations
app.use('/test-strict', rateLimitService.createRateLimit({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 5,
  message: 'Strict rate limit exceeded (5 requests per minute)'
}));

app.use('/test-lenient', rateLimitService.createRateLimit({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 100,
  message: 'Lenient rate limit exceeded (100 requests per minute)'
}));

// Test endpoints
app.get('/test-rate-limit', async (req, res) => {
  const key = `test:${req.ip}`;
  const config = {
    windowMs: 60 * 1000,
    maxRequests: 10
  };
  
  const info = await rateLimitService.getKeyInfo(key, config);
  
  res.json({
    message: 'Rate limit test endpoint',
    key,
    config,
    current: info,
    redisStatus: rateLimitService.getStatus(),
    redisFallbackStatus: redisFallbackService.getStatus()
  });
});

app.get('/test-redis-toggle', async (req, res) => {
  const { action } = req.query;
  
  if (action === 'disable') {
    // Simulate Redis failure
    rateLimitService.isRedisAvailable = false;
    rateLimitService.redisClient = null;
    
    res.json({
      message: 'Redis disabled - rate limiting will use memory fallback',
      redisAvailable: false,
      action: 'disabled'
    });
  } else if (action === 'enable') {
    // Re-enable Redis
    await rateLimitService.initializeRedis();
    
    res.json({
      message: 'Redis enabled - rate limiting will use Redis',
      redisAvailable: true,
      action: 'enabled'
    });
  } else {
    res.status(400).json({
      error: 'Invalid action',
      message: 'Use ?action=enable or ?action=disable'
    });
  }
});

app.get('/test-reset-key', async (req, res) => {
  const { key } = req.query;
  
  if (!key) {
    return res.status(400).json({
      error: 'Key required',
      message: 'Please provide a key to reset'
    });
  }
  
  const success = await rateLimitService.resetKey(key);
  
  res.json({
    message: success ? 'Rate limit key reset successfully' : 'Failed to reset rate limit key',
    key,
    success
  });
});

app.get('/test-health', async (req, res) => {
  const rateLimitStatus = rateLimitService.getStatus();
  const redisStatus = await redisFallbackService.checkRedisStatus();
  
  res.json({
    message: 'Rate limiting service health check',
    rateLimit: rateLimitStatus,
    redis: redisStatus,
    timestamp: new Date().toISOString()
  });
});

// Start test server
app.listen(PORT, () => {
  console.log(`Rate limit test server running on port ${PORT}`);
  console.log('Available endpoints:');
  console.log('  GET /test-rate-limit - Test current rate limit status');
  console.log('  GET /test-redis-toggle?action=enable|disable - Toggle Redis availability');
  console.log('  GET /test-reset-key?key=<key> - Reset rate limit for specific key');
  console.log('  GET /test-health - Check service health');
  console.log('');
  console.log('Test endpoints:');
  console.log('  GET /test-strict - Apply strict rate limiting (5 req/min)');
  console.log('  GET /test-lenient - Apply lenient rate limiting (100 req/min)');
});