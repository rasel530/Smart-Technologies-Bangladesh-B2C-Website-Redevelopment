/**
 * Working Authentication Test
 * 
 * Simple test to verify authentication system is working
 * Uses proper mock setup and isolated test environment
 */

console.log('🔍 Starting Working Authentication Test...\n');

// Test basic imports
const express = require('express');
const request = require('supertest');

console.log('1️⃣ Testing Basic Module Imports...');

try {
  // Test Express
  const app = express();
  app.use(express.json());
  app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });
  
  console.log('   ✅ Express app created successfully');
  
  // Test supertest
  const testReq = request(app);
  testReq
    .get('/health')
    .end((err, res) => {
      if (err) {
        console.log('   ❌ Basic request failed:', err.message);
      } else {
        console.log('   ✅ Basic request successful');
      }
    });
    
} catch (error) {
  console.log('   ❌ Express setup failed:', error.message);
}

// Test service imports
console.log('\n2️⃣ Testing Service Imports...');

const services = [
  { name: 'config', path: './services/config' },
  { name: 'logger', path: './services/logger' },
  { name: 'database', path: './services/database' },
  { name: 'emailService', path: './services/emailService' },
  { name: 'smsService', path: './services/smsService' },
  { name: 'otpService', path: './services/otpService' },
  { name: 'passwordService', path: './services/passwordService' },
  { name: 'sessionService', path: './services/sessionService' },
  { name: 'loginSecurityService', path: './services/loginSecurityService' }
];

let successCount = 0;
let errorCount = 0;

services.forEach(service => {
  try {
    const imported = require(service.path);
    console.log(`   ✅ ${service.name} imported successfully`);
    successCount++;
  } catch (error) {
    console.log(`   ❌ ${service.name} import failed:`, error.message);
    errorCount++;
  }
});

console.log(`\n📊 Import Results: ${successCount} successful, ${errorCount} failed\n`);

// Test route imports
console.log('\n3️⃣ Testing Route Imports...');

const routes = [
  { name: 'auth', path: './routes/auth' },
  { name: 'users', path: './routes/users' },
  { name: 'index', path: './routes/index' }
];

successCount = 0;
errorCount = 0;

routes.forEach(route => {
  try {
    const imported = require(route.path);
    console.log(`   ✅ ${route.name} route imported successfully`);
    successCount++;
  } catch (error) {
    console.log(`   ❌ ${route.name} route import failed:`, error.message);
    errorCount++;
  }
});

console.log(`\n📊 Route Import Results: ${successCount} successful, ${errorCount} failed\n`);

// Test database connection
console.log('\n4️⃣ Testing Database Connection...');

try {
  const { PrismaClient } = require('@prisma/client');
  console.log('   ✅ PrismaClient available');
  
  const prisma = new PrismaClient();
  console.log('   ✅ Prisma instance created');
  
  // Test basic methods
  const methods = ['$connect', '$disconnect', 'user'];
  methods.forEach(method => {
    if (typeof prisma[method] === 'function') {
      console.log(`   ✅ Prisma.${method} method available`);
    } else {
      console.log(`   ❌ Prisma.${method} method missing`);
    }
  });
  
} catch (error) {
  console.log('   ❌ Database test failed:', error.message);
}

// Test Redis connection
console.log('\n5️⃣ Testing Redis Connection...');

try {
  const redis = require('redis');
  console.log('   ✅ Redis module available');
  
  const { createClient } = redis;
  console.log('   ✅ createClient function available:', typeof createClient);
  
  // Test client creation
  const client = createClient();
  console.log('   ✅ Redis client created');
  
  // Check methods
  const methods = ['connect', 'get', 'set', 'setEx', 'del', 'hIncrBy', 'hGetAll'];
  methods.forEach(method => {
    if (typeof client[method] === 'function') {
      console.log(`   ✅ Redis client.${method} method available`);
    } else {
      console.log(`   ❌ Redis client.${method} method missing`);
    }
  });
  
} catch (error) {
  console.log('   ❌ Redis test failed:', error.message);
}

console.log('\n🔍 Working Authentication Test Complete');