const { PrismaClient } = require('@prisma/client');
const Redis = require('redis');
require('dotenv').config();

console.log('🔍 SIMPLE CONNECTION TEST');
console.log('========================');

async function testConnections() {
  // Test basic environment
  console.log('\n1. Environment Check:');
  console.log('  NODE_ENV:', process.env.NODE_ENV || 'undefined');
  console.log('  POSTGRES_DATABASE_URL:', process.env.POSTGRES_DATABASE_URL ? 'SET' : 'MISSING');
  console.log('  REDIS_URL:', process.env.REDIS_URL ? 'SET' : 'MISSING');
  console.log('  JWT_SECRET:', process.env.JWT_SECRET ? 'SET' : 'MISSING');

  // Test PostgreSQL connection directly
  console.log('\n2. PostgreSQL Connection Test:');
  try {
    const prisma = new PrismaClient({
      datasources: {
        db: {
          url: process.env.POSTGRES_DATABASE_URL
        }
      }
    });
    
    await prisma.$connect();
    console.log('  ✅ PostgreSQL connected successfully');
    
    // Test a simple query
    const result = await prisma.$queryRaw`SELECT 1 as test`;
    console.log('  ✅ PostgreSQL query test passed');
    
    await prisma.$disconnect();
    console.log('  ✅ PostgreSQL disconnected cleanly');
  } catch (error) {
    console.log('  ❌ PostgreSQL connection failed:', error.message);
  }

  // Test Redis connection directly
  console.log('\n3. Redis Connection Test:');
  try {
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
    console.log('  Connecting to:', redisUrl);
    
    const redis = Redis.createClient({ url: redisUrl });
    
    redis.on('error', (err) => {
      console.log('  ❌ Redis error:', err.message);
    });
    
    redis.on('connect', () => {
      console.log('  ✅ Redis connected');
    });
    
    await redis.connect();
    await redis.ping();
    console.log('  ✅ Redis ping test passed');
    
    await redis.quit();
    console.log('  ✅ Redis disconnected cleanly');
  } catch (error) {
    console.log('  ❌ Redis connection failed:', error.message);
  }

  // Test basic Express app
  console.log('\n4. Express App Test:');
  try {
    const express = require('express');
    const app = express();
    
    // Test basic middleware
    app.use(express.json());
    
    // Test basic route
    app.get('/test', (req, res) => {
      res.json({ status: 'ok', timestamp: new Date().toISOString() });
    });
    
    console.log('  ✅ Express app created successfully');
    console.log('  ✅ Basic middleware configured');
    console.log('  ✅ Test route created');
    
    // Test if we can listen (without actually starting server)
    const server = app.listen(0); // Random port
    const port = server.address().port;
    console.log('  ✅ Express can listen on port:', port);
    server.close();
    console.log('  ✅ Express server closed cleanly');
  } catch (error) {
    console.log('  ❌ Express app failed:', error.message);
  }

  console.log('\n========================');
  console.log('🔍 SIMPLE TEST COMPLETE');
}

testConnections().catch(console.error);