const express = require('express');
const cors = require('cors');
require('dotenv').config();

console.log('🔍 DETAILED API TEST');
console.log('====================');

async function testAPIEndpoints() {
  try {
    // Create Express app
    const app = express();
    app.use(cors());
    app.use(express.json());
    
    // Error handling middleware
    app.use((err, req, res, next) => {
      console.error('Express error:', err);
      res.status(500).json({
        status: 'error',
        error: err.message,
        stack: err.stack
      });
    });
    
    // Test database endpoint with detailed error logging
    app.get('/test-db', async (req, res) => {
      console.log('Testing database connection...');
      try {
        const { PrismaClient } = require('@prisma/client');
        console.log('Prisma imported successfully');
        
        const prisma = new PrismaClient();
        console.log('Prisma client created');
        
        await prisma.$connect();
        console.log('Prisma connected');
        
        const result = await prisma.$queryRaw`SELECT NOW() as current_time`;
        console.log('Query executed:', result);
        
        await prisma.$disconnect();
        console.log('Prisma disconnected');
        
        res.json({
          status: 'success',
          database: 'connected',
          currentTime: result[0].current_time
        });
      } catch (error) {
        console.error('Database test error:', error);
        res.status(500).json({
          status: 'error',
          database: 'failed',
          error: error.message,
          stack: error.stack
        });
      }
    });
    
    // Test Redis endpoint with detailed error logging
    app.get('/test-redis', async (req, res) => {
      console.log('Testing Redis connection...');
      try {
        const Redis = require('redis');
        console.log('Redis imported successfully');
        
        const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
        console.log('Redis URL:', redisUrl);
        
        const redis = Redis.createClient({ url: redisUrl });
        console.log('Redis client created');
        
        redis.on('error', (err) => {
          console.error('Redis client error:', err);
        });
        
        await redis.connect();
        console.log('Redis connected');
        
        await redis.set('test_key', 'test_value', { EX: 60 });
        console.log('Redis set operation completed');
        
        const value = await redis.get('test_key');
        console.log('Redis get result:', value);
        
        await redis.quit();
        console.log('Redis disconnected');
        
        res.json({
          status: 'success',
          redis: 'connected',
          testValue: value
        });
      } catch (error) {
        console.error('Redis test error:', error);
        res.status(500).json({
          status: 'error',
          redis: 'failed',
          error: error.message,
          stack: error.stack
        });
      }
    });
    
    // Test auth service endpoint with detailed error logging
    app.get('/test-auth', async (req, res) => {
      console.log('Testing JWT authentication...');
      try {
        const jwt = require('jsonwebtoken');
        console.log('JWT imported successfully');
        
        const secret = process.env.JWT_SECRET || 'fallback_secret';
        console.log('JWT secret exists:', !!process.env.JWT_SECRET);
        
        if (!process.env.JWT_SECRET) {
          console.log('JWT_SECRET missing from environment');
          return res.status(500).json({
            status: 'error',
            auth: 'failed',
            error: 'JWT_SECRET not configured'
          });
        }
        
        const testToken = jwt.sign({ test: 'data' }, secret, { expiresIn: '1h' });
        console.log('JWT token generated');
        
        const decoded = jwt.verify(testToken, secret);
        console.log('JWT token verified:', decoded);
        
        res.json({
          status: 'success',
          auth: 'working',
          tokenGenerated: true,
          tokenVerified: true,
          testData: decoded
        });
      } catch (error) {
        console.error('Auth test error:', error);
        res.status(500).json({
          status: 'error',
          auth: 'failed',
          error: error.message,
          stack: error.stack
        });
      }
    });
    
    // Start server
    const PORT = process.env.PORT || 3001;
    const server = app.listen(PORT, () => {
      console.log(`\n✅ Test server started on http://localhost:${PORT}`);
      console.log('\n🧪 Testing endpoints manually...');
      
      // Test endpoints manually
      setTimeout(async () => {
        await testEndpointsManually();
        server.close();
      }, 1000);
    });
    
  } catch (error) {
    console.error('❌ Failed to start test server:', error.message);
  }
}

async function testEndpointsManually() {
  const http = require('http');
  
  const endpoints = [
    '/test-db',
    '/test-redis',
    '/test-auth'
  ];
  
  for (const endpoint of endpoints) {
    try {
      console.log(`\n🔍 Testing ${endpoint}...`);
      
      const options = {
        hostname: 'localhost',
        port: 3001,
        path: endpoint,
        method: 'GET'
      };
      
      const req = http.request(options, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          console.log(`Response status: ${res.statusCode}`);
          console.log(`Response body:`, data);
          
          try {
            const response = JSON.parse(data);
            if (response.status === 'success') {
              console.log(`✅ ${endpoint}: SUCCESS`);
            } else {
              console.log(`❌ ${endpoint}: FAILED - ${response.error}`);
            }
          } catch (e) {
            console.log(`⚠️  ${endpoint}: Invalid JSON response`);
          }
        });
      });
      
      req.on('error', (err) => {
        console.log(`❌ ${endpoint}: Request failed - ${err.message}`);
      });
      
      req.end();
      
      // Wait between requests
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      console.log(`❌ ${endpoint}: ${error.message}`);
    }
  }
  
  console.log('\n====================');
  console.log('🔍 DETAILED TEST COMPLETE');
}

testAPIEndpoints().catch(console.error);