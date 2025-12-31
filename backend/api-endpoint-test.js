const express = require('express');
const cors = require('cors');
require('dotenv').config();

console.log('🔍 API ENDPOINT TEST');
console.log('===================');

async function testAPIEndpoints() {
  try {
    // Create Express app
    const app = express();
    app.use(cors());
    app.use(express.json());
    
    // Test basic health endpoint
    app.get('/health', (req, res) => {
      res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        services: {
          database: 'unknown',
          redis: 'unknown'
        }
      });
    });
    
    // Test database endpoint
    app.get('/test-db', async (req, res) => {
      try {
        const { PrismaClient } = require('@prisma/client');
        const prisma = new PrismaClient();
        
        await prisma.$connect();
        const result = await prisma.$queryRaw`SELECT NOW() as current_time`;
        await prisma.$disconnect();
        
        res.json({
          status: 'success',
          database: 'connected',
          currentTime: result[0].current_time
        });
      } catch (error) {
        res.status(500).json({
          status: 'error',
          database: 'failed',
          error: error.message
        });
      }
    });
    
    // Test Redis endpoint
    app.get('/test-redis', async (req, res) => {
      try {
        const Redis = require('redis');
        const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
        const redis = Redis.createClient({ url: redisUrl });
        
        await redis.connect();
        await redis.set('test_key', 'test_value', { EX: 60 });
        const value = await redis.get('test_key');
        await redis.quit();
        
        res.json({
          status: 'success',
          redis: 'connected',
          testValue: value
        });
      } catch (error) {
        res.status(500).json({
          status: 'error',
          redis: 'failed',
          error: error.message
        });
      }
    });
    
    // Test auth service endpoint
    app.get('/test-auth', async (req, res) => {
      try {
        const jwt = require('jsonwebtoken');
        const secret = process.env.JWT_SECRET || 'fallback_secret';
        
        if (!process.env.JWT_SECRET) {
          return res.status(500).json({
            status: 'error',
            auth: 'failed',
            error: 'JWT_SECRET not configured'
          });
        }
        
        const testToken = jwt.sign({ test: 'data' }, secret, { expiresIn: '1h' });
        const decoded = jwt.verify(testToken, secret);
        
        res.json({
          status: 'success',
          auth: 'working',
          tokenGenerated: true,
          tokenVerified: true,
          testData: decoded
        });
      } catch (error) {
        res.status(500).json({
          status: 'error',
          auth: 'failed',
          error: error.message
        });
      }
    });
    
    // Start server
    const PORT = process.env.PORT || 3001;
    const server = app.listen(PORT, () => {
      console.log(`\n✅ Test server started on http://localhost:${PORT}`);
      console.log('\n📋 Available endpoints:');
      console.log('  GET /health - Basic health check');
      console.log('  GET /test-db - Database connection test');
      console.log('  GET /test-redis - Redis connection test');
      console.log('  GET /test-auth - JWT authentication test');
      console.log('\n🧪 Testing endpoints...');
      
      // Test endpoints
      testEndpoints(PORT);
    });
    
    // Close server after testing
    setTimeout(() => {
      server.close(() => {
        console.log('\n✅ Test server closed');
        console.log('===================');
        console.log('🔍 API TEST COMPLETE');
      });
    }, 5000);
    
  } catch (error) {
    console.error('❌ Failed to start test server:', error.message);
  }
}

async function testEndpoints(port) {
  const http = require('http');
  
  const endpoints = [
    '/health',
    '/test-db',
    '/test-redis',
    '/test-auth'
  ];
  
  for (const endpoint of endpoints) {
    try {
      const options = {
        hostname: 'localhost',
        port: port,
        path: endpoint,
        method: 'GET'
      };
      
      const req = http.request(options, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            const response = JSON.parse(data);
            console.log(`  ✅ ${endpoint}: ${response.status}`);
            if (response.error) {
              console.log(`    Error: ${response.error}`);
            }
          } catch (e) {
            console.log(`  ⚠️  ${endpoint}: Invalid JSON response`);
          }
        });
      });
      
      req.on('error', (err) => {
        console.log(`  ❌ ${endpoint}: ${err.message}`);
      });
      
      req.end();
      
      // Wait between requests
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (error) {
      console.log(`  ❌ ${endpoint}: ${error.message}`);
    }
  }
}

testAPIEndpoints().catch(console.error);