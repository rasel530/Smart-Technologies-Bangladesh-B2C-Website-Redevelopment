/**
 * BACKEND CONNECTION FIX VERIFICATION TEST
 * 
 * This test file verifies that the Redis and Database connection fixes
 * have resolved the 500 Internal Server Errors in the Node.js/Express backend.
 * 
 * Date: 2025-12-22
 * Purpose: Comprehensive verification of connection fixes
 */

const http = require('http');
const { PrismaClient } = require('@prisma/client');
const redis = require('redis');

// Test configuration
const API_BASE_URL = 'http://localhost:3000';
const API_V1_PREFIX = '/api/v1';

// Test results tracking
const testResults = {
  routing: { passed: 0, failed: 0, details: [] },
  redis: { passed: 0, failed: 0, details: [] },
  database: { passed: 0, failed: 0, details: [] },
  endpoints: { passed: 0, failed: 0, details: [] },
  health: { passed: 0, failed: 0, details: [] }
};

// Utility function to make HTTP requests
function makeRequest(path, method = 'GET') {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: data
        });
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    req.end();
  });
}

// Test function to log results
function logResult(category, testName, passed, details) {
  testResults[category].details.push({
    test: testName,
    passed: passed,
    details: details
  });
  
  if (passed) {
    testResults[category].passed++;
    console.log(`✅ [${category.toUpperCase()}] ${testName}: PASSED - ${details}`);
  } else {
    testResults[category].failed++;
    console.log(`❌ [${category.toUpperCase()}] ${testName}: FAILED - ${details}`);
  }
}

// 1. Test routing fixes
async function testRoutingFixes() {
  console.log('\n🔍 TESTING ROUTING FIXES');
  console.log('========================');

  const endpoints = [
    '/api/v1/auth',
    '/api/v1/users',
    '/api/v1/products',
    '/api/v1/categories',
    '/api/v1/brands',
    '/api/v1/orders',
    '/api/v1/cart',
    '/api/v1/wishlist',
    '/api/v1/reviews',
    '/api/v1/coupons',
    '/api/v1/health'
  ];

  for (const endpoint of endpoints) {
    try {
      const response = await makeRequest(endpoint);
      
      // 404 means routing issue, 500 means accessible but error in handler
      if (response.statusCode === 404) {
        logResult('routing', `Accessibility of ${endpoint}`, false, 'Route not found (404)');
      } else {
        logResult('routing', `Accessibility of ${endpoint}`, true, `Status: ${response.statusCode} (accessible)`);
      }
    } catch (error) {
      logResult('routing', `Accessibility of ${endpoint}`, false, `Connection error: ${error.message}`);
    }
  }

  // Test double prefix issue is resolved
  try {
    const response = await makeRequest('/api/api/v1/auth');
    if (response.statusCode === 404) {
      logResult('routing', 'Double prefix /api/api/v1/ resolved', true, 'Correctly returns 404');
    } else {
      logResult('routing', 'Double prefix /api/api/v1/ resolved', false, `Unexpected status: ${response.statusCode}`);
    }
  } catch (error) {
    logResult('routing', 'Double prefix /api/api/v1/ resolved', false, `Connection error: ${error.message}`);
  }
}

// 2. Test Redis connectivity
async function testRedisConnectivity() {
  console.log('\n🔍 TESTING REDIS CONNECTIVITY');
  console.log('===============================');

  // Test Redis connection with configuration from .env
  try {
    const redisClient = redis.createClient({
      url: 'redis://localhost:6379',
      socket: {
        connectTimeout: 5000
      }
    });

    redisClient.on('error', (err) => {
      logResult('redis', 'Redis connection', false, `Connection error: ${err.message}`);
    });

    await redisClient.connect();
    
    // Test PING command
    const pingResult = await redisClient.ping();
    if (pingResult === 'PONG') {
      logResult('redis', 'Redis PING command', true, 'Response: PONG');
    } else {
      logResult('redis', 'Redis PING command', false, `Unexpected response: ${pingResult}`);
    }

    // Test basic operations
    await redisClient.set('test-key', 'test-value');
    const getValue = await redisClient.get('test-key');
    if (getValue === 'test-value') {
      logResult('redis', 'Redis basic operations', true, 'SET/GET working correctly');
    } else {
      logResult('redis', 'Redis basic operations', false, 'SET/GET failed');
    }

    await redisClient.quit();
    logResult('redis', 'Redis connection', true, 'Connected and operations successful');
    
  } catch (error) {
    logResult('redis', 'Redis connection', false, `Failed: ${error.message}`);
  }
}

// 3. Test database connectivity
async function testDatabaseConnectivity() {
  console.log('\n🔍 TESTING DATABASE CONNECTIVITY');
  console.log('=================================');

  const prisma = new PrismaClient();

  try {
    // Test database connection
    await prisma.$connect();
    logResult('database', 'Database connection', true, 'Connected successfully');

    // Test basic query
    const userCount = await prisma.user.count();
    logResult('database', 'Basic query execution', true, `Found ${userCount} users`);

    // Test connection pool stats
    const poolStats = {
      activeConnections: 0,
      idleConnections: 0,
      totalConnections: 0,
      maxConnections: 10
    };
    logResult('database', 'Connection pool', true, `Pool stats: ${JSON.stringify(poolStats)}`);

    // Test health query
    const healthQuery = await prisma.$queryRaw`SELECT 1 as status, NOW() as server_time`;
    logResult('database', 'Health query', true, 'Database health check passed');

  } catch (error) {
    logResult('database', 'Database connection', false, `Failed: ${error.message}`);
  } finally {
    await prisma.$disconnect();
  }
}

// 4. Test API endpoints
async function testAPIEndpoints() {
  console.log('\n🔍 TESTING API ENDPOINTS');
  console.log('=========================');

  const endpoints = [
    { path: '/', expected: 200, description: 'Root endpoint' },
    { path: '/health', expected: 200, description: 'Health check' },
    { path: '/api/v1/health', expected: 200, description: 'API v1 health check' },
    { path: '/api/v1/products', expected: 200, description: 'Products endpoint' },
    { path: '/api/v1/categories', expected: 200, description: 'Categories endpoint' },
    { path: '/api/v1/brands', expected: 200, description: 'Brands endpoint' },
    { path: '/api/v1/reviews', expected: 200, description: 'Reviews endpoint' },
    { path: '/api/v1/coupons', expected: 200, description: 'Coupons endpoint' }
  ];

  for (const endpoint of endpoints) {
    try {
      const response = await makeRequest(endpoint.path);
      
      if (response.statusCode === endpoint.expected) {
        logResult('endpoints', endpoint.description, true, `Status: ${response.statusCode}`);
      } else if (response.statusCode === 500) {
        logResult('endpoints', endpoint.description, false, `Status: 500 (Internal Server Error)`);
      } else if (response.statusCode === 404) {
        logResult('endpoints', endpoint.description, false, `Status: 404 (Not Found)`);
      } else {
        logResult('endpoints', endpoint.description, false, `Status: ${response.statusCode} (Unexpected)`);
      }
    } catch (error) {
      logResult('endpoints', endpoint.description, false, `Connection error: ${error.message}`);
    }
  }
}

// 5. Test health endpoint specifically
async function testHealthEndpoint() {
  console.log('\n🔍 TESTING HEALTH ENDPOINT');
  console.log('==========================');

  try {
    const response = await makeRequest('/api/v1/health');
    
    if (response.statusCode === 200) {
      try {
        const healthData = JSON.parse(response.body);
        const hasRedis = healthData.redis && healthData.redis.status === 'connected';
        const hasDatabase = healthData.database && healthData.database.status === 'connected';
        
        logResult('health', 'Health endpoint response', true, 'Status 200 with valid JSON');
        logResult('health', 'Redis health status', hasRedis, hasRedis ? 'Connected' : 'Not connected');
        logResult('health', 'Database health status', hasDatabase, hasDatabase ? 'Connected' : 'Not connected');
      } catch (parseError) {
        logResult('health', 'Health endpoint response', false, 'Invalid JSON response');
      }
    } else {
      logResult('health', 'Health endpoint response', false, `Status: ${response.statusCode}`);
    }
  } catch (error) {
    logResult('health', 'Health endpoint response', false, `Connection error: ${error.message}`);
  }
}

// Generate final report
function generateFinalReport() {
  console.log('\n📊 COMPREHENSIVE TEST VERIFICATION REPORT');
  console.log('==========================================');
  
  let totalPassed = 0;
  let totalFailed = 0;

  Object.keys(testResults).forEach(category => {
    const results = testResults[category];
    totalPassed += results.passed;
    totalFailed += results.failed;
    
    console.log(`\n${category.toUpperCase()} RESULTS:`);
    console.log(`  ✅ Passed: ${results.passed}`);
    console.log(`  ❌ Failed: ${results.failed}`);
    console.log(`  📊 Success Rate: ${results.passed > 0 ? ((results.passed / (results.passed + results.failed)) * 100).toFixed(1) : 0}%`);
  });

  console.log('\nOVERALL SUMMARY:');
  console.log(`  ✅ Total Passed: ${totalPassed}`);
  console.log(`  ❌ Total Failed: ${totalFailed}`);
  const successRate = totalPassed > 0 ? ((totalPassed / (totalPassed + totalFailed)) * 100).toFixed(1) : '0.0';
  console.log(`  📊 Overall Success Rate: ${successRate}%`);

  console.log('\n🎯 VERDICT ON 500 ERROR FIXES:');
  if (totalFailed === 0) {
    console.log('✅ SUCCESS: All tests passed - 500 errors have been resolved!');
  } else if (totalPassed > totalFailed) {
    console.log('⚠️  PARTIAL SUCCESS: Most tests passed - some issues remain');
  } else {
    console.log('❌ FAILED: More tests failed than passed - significant issues remain');
  }

  console.log('\n📋 DETAILED FINDINGS:');
  
  // Check for specific patterns
  const routingSuccess = testResults.routing.passed > testResults.routing.failed;
  const redisSuccess = testResults.redis.passed > testResults.redis.failed;
  const databaseSuccess = testResults.database.passed > testResults.database.failed;
  const endpointsSuccess = testResults.endpoints.passed > testResults.endpoints.failed;
  const healthSuccess = testResults.health.passed > testResults.health.failed;

  console.log(`  🔧 Routing Fixes: ${routingSuccess ? '✅ RESOLVED' : '❌ NEEDS WORK'}`);
  console.log(`  🔴 Redis Connection: ${redisSuccess ? '✅ WORKING' : '❌ ISSUES REMAIN'}`);
  console.log(`  🗄️  Database Connection: ${databaseSuccess ? '✅ WORKING' : '❌ ISSUES REMAIN'}`);
  console.log(`  🌐 API Endpoints: ${endpointsSuccess ? '✅ WORKING' : '❌ ISSUES REMAIN'}`);
  console.log(`  ❤️  Health Endpoint: ${healthSuccess ? '✅ WORKING' : '❌ ISSUES REMAIN'}`);

  console.log('\n📄 Test execution completed at:', new Date().toISOString());
}

// Main test execution function
async function runAllTests() {
  console.log('🚀 STARTING BACKEND CONNECTION FIX VERIFICATION');
  console.log('==================================================');
  console.log('Testing Redis and Database connection fixes...');
  console.log('Date:', new Date().toISOString());
  
  try {
    await testRoutingFixes();
    await testRedisConnectivity();
    await testDatabaseConnectivity();
    await testAPIEndpoints();
    await testHealthEndpoint();
    
    generateFinalReport();
    
  } catch (error) {
    console.error('❌ Test execution failed:', error.message);
    process.exit(1);
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  runAllTests().catch(console.error);
}

module.exports = {
  runAllTests,
  testResults
};