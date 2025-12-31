/**
 * Simple Authentication Test to Validate Core Issues
 * Tests basic Express setup, service imports, and mock configuration
 */

console.log('🔍 Starting Simple Authentication Diagnostic...\n');

// Test 1: Basic Express setup for supertest
console.log('1️⃣ Testing Express App Setup...');
try {
  const express = require('express');
  const app = express();
  app.use(express.json());
  
  // Add a simple test route
  app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });
  
  console.log('   ✅ Express app created with address function:', typeof app.address);
  console.log('   ✅ Express app has listen method:', typeof app.listen);
  
  // Test with supertest
  const request = require('supertest');
  const testReq = request(app);
  console.log('   ✅ Supertest request object created:', typeof testReq);
  
  // Make a simple test request
  testReq
    .get('/health')
    .end((err, res) => {
      if (err) {
        console.log('   ❌ Health check failed:', err.message);
      } else {
        console.log('   ✅ Health check successful:', res.body);
      }
    });
    
} catch (error) {
  console.log('   ❌ Express setup failed:', error.message);
}

// Test 2: Service imports
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

services.forEach(service => {
  try {
    const imported = require(service.path);
    console.log(`   ✅ ${service.name} imported successfully`);
    
    // Test basic methods exist
    if (service.name === 'config') {
      const methods = ['get', 'getJWTConfig', 'getSecurityConfig', 'isProduction'];
      methods.forEach(method => {
        if (typeof imported[method] === 'function') {
          console.log(`      ✅ ${service.name}.${method} method exists`);
        } else {
          console.log(`      ❌ ${service.name}.${method} method missing`);
        }
      });
    }
  } catch (error) {
    console.log(`   ❌ ${service.name} import failed:`, error.message);
  }
});

// Test 3: Route imports
console.log('\n3️⃣ Testing Route Imports...');
const routes = [
  { name: 'auth', path: './routes/auth' },
  { name: 'users', path: './routes/users' },
  { name: 'index', path: './routes/index' }
];

routes.forEach(route => {
  try {
    const imported = require(route.path);
    console.log(`   ✅ ${route.name} route imported successfully`);
    
    // Check if it's a router
    if (typeof imported === 'function' || (typeof imported === 'object' && imported.router)) {
      console.log(`      ✅ ${route.name} appears to be a valid router`);
    } else {
      console.log(`      ⚠️  ${route.name} may not be a proper router`);
    }
  } catch (error) {
    console.log(`   ❌ ${route.name} route import failed:`, error.message);
  }
});

// Test 4: Redis availability
console.log('\n4️⃣ Testing Redis Availability...');
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
      console.log(`      ✅ Redis client.${method} method available`);
    } else {
      console.log(`      ❌ Redis client.${method} method missing`);
    }
  });
  
} catch (error) {
  console.log('   ❌ Redis test failed:', error.message);
}

// Test 5: Database availability
console.log('\n5️⃣ Testing Database Availability...');
try {
  const { PrismaClient } = require('@prisma/client');
  console.log('   ✅ PrismaClient available');
  
  const prisma = new PrismaClient();
  console.log('   ✅ Prisma instance created');
  
  // Check methods
  const methods = ['$connect', '$disconnect', 'user', 'findMany', 'findUnique', 'findFirst', 'create', 'update', 'delete'];
  methods.forEach(method => {
    if (typeof prisma[method] === 'function') {
      console.log(`      ✅ Prisma.${method} method available`);
    } else {
      console.log(`      ❌ Prisma.${method} method missing`);
    }
  });
  
} catch (error) {
  console.log('   ❌ Database test failed:', error.message);
}

console.log('\n🔍 Simple Authentication Diagnostic Complete');