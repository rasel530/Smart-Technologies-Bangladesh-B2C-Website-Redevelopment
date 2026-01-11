/**
 * Complete Login Flow Test Script
 * 
 * This script performs a comprehensive test of the entire login flow:
 * 1. Database connectivity check
 * 2. Demo users verification
 * 3. Backend health check
 * 4. Redis connectivity check
 * 5. Docker container status
 * 6. Login API testing (positive and negative cases)
 * 7. Session management verification
 * 8. Token validation
 * 
 * Usage: node complete-login-flow-test.js
 */

const { PrismaClient } = require('@prisma/client');
const axios = require('axios');
const { createClient } = require('redis');

const API_BASE_URL = 'http://localhost:3001/api/v1';
const DEMO_USERS = [
  {
    identifier: 'demo.user1@smarttech.bd',
    password: 'Demo123456',
    expectedName: 'Rahim Ahmed'
  },
  {
    identifier: 'demo.user2@smarttech.bd',
    password: 'Demo123456',
    expectedName: 'Fatima Begum'
  },
  {
    identifier: 'demo.user3@smarttech.bd',
    password: 'Demo123456',
    expectedName: 'Karim Hossain'
  }
];

// Color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
  console.log('\n' + '='.repeat(80));
  log(title, 'bright');
  console.log('='.repeat(80) + '\n');
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

function logInfo(message) {
  log(`ℹ️  ${message}`, 'cyan');
}

// Test results storage
const testResults = {
  database: { status: 'pending', details: [] },
  demoUsers: { status: 'pending', details: [] },
  backendHealth: { status: 'pending', details: [] },
  redis: { status: 'pending', details: [] },
  docker: { status: 'pending', details: [] },
  loginApi: { status: 'pending', details: [] },
  sessionManagement: { status: 'pending', details: [] },
  tokenValidation: { status: 'pending', details: [] }
};

// Step 1: Database Connectivity Check
async function testDatabaseConnectivity() {
  logSection('STEP 1: Database Connectivity Check');
  
  const prisma = new PrismaClient();
  
  try {
    logInfo('Testing database connection...');
    await prisma.$connect();
    logSuccess('Database connection successful');
    
    // Test query
    const result = await prisma.$queryRaw`SELECT 1 as test`;
    logSuccess('Database query execution successful');
    
    testResults.database.status = 'passed';
    testResults.database.details.push({
      test: 'Database Connection',
      status: 'passed',
      message: 'Successfully connected to PostgreSQL database'
    });
    
    return true;
  } catch (error) {
    logError(`Database connection failed: ${error.message}`);
    testResults.database.status = 'failed';
    testResults.database.details.push({
      test: 'Database Connection',
      status: 'failed',
      message: error.message
    });
    return false;
  } finally {
    await prisma.$disconnect();
  }
}

// Step 2: Demo Users Verification
async function testDemoUsers() {
  logSection('STEP 2: Demo Users Verification');
  
  const prisma = new PrismaClient();
  
  try {
    logInfo('Checking for demo users in database...');
    
    const demoUsers = await prisma.user.findMany({
      where: {
        email: {
          contains: 'demo.user'
        }
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        status: true
      }
    });
    
    if (demoUsers.length === 0) {
      logError('No demo users found in database');
      testResults.demoUsers.status = 'failed';
      testResults.demoUsers.details.push({
        test: 'Demo Users Exist',
        status: 'failed',
        message: 'No demo users found'
      });
      return false;
    }
    
    logSuccess(`Found ${demoUsers.length} demo users:`);
    demoUsers.forEach((user, index) => {
      logInfo(`  ${index + 1}. ${user.email} - ${user.firstName} ${user.lastName} (${user.status})`);
    });
    
    // Verify all demo users are active
    const inactiveUsers = demoUsers.filter(u => u.status !== 'ACTIVE');
    if (inactiveUsers.length > 0) {
      logWarning(`Found ${inactiveUsers.length} inactive demo users`);
      testResults.demoUsers.details.push({
        test: 'Demo Users Active Status',
        status: 'warning',
        message: `${inactiveUsers.length} users are inactive`
      });
    } else {
      logSuccess('All demo users are active');
    }
    
    testResults.demoUsers.status = 'passed';
    testResults.demoUsers.details.push({
      test: 'Demo Users Exist',
      status: 'passed',
      message: `Found ${demoUsers.length} demo users`
    });
    
    return true;
  } catch (error) {
    logError(`Demo users verification failed: ${error.message}`);
    testResults.demoUsers.status = 'failed';
    testResults.demoUsers.details.push({
      test: 'Demo Users Verification',
      status: 'failed',
      message: error.message
    });
    return false;
  } finally {
    await prisma.$disconnect();
  }
}

// Step 3: Backend Health Check
async function testBackendHealth() {
  logSection('STEP 3: Backend Health Check');
  
  try {
    logInfo('Testing backend health endpoint...');
    
    const response = await axios.get(`${API_BASE_URL}/auth/password-policy`, {
      timeout: 5000
    });
    
    if (response.status === 200) {
      logSuccess('Backend is responding');
      logInfo(`Response time: ${response.headers['x-response-time'] || 'N/A'}`);
      
      testResults.backendHealth.status = 'passed';
      testResults.backendHealth.details.push({
        test: 'Backend Health',
        status: 'passed',
        message: 'Backend is responding correctly'
      });
      
      return true;
    } else {
      logError(`Backend returned unexpected status: ${response.status}`);
      testResults.backendHealth.status = 'failed';
      testResults.backendHealth.details.push({
        test: 'Backend Health',
        status: 'failed',
        message: `Unexpected status: ${response.status}`
      });
      return false;
    }
  } catch (error) {
    logError(`Backend health check failed: ${error.message}`);
    testResults.backendHealth.status = 'failed';
    testResults.backendHealth.details.push({
      test: 'Backend Health',
      status: 'failed',
      message: error.message
    });
    return false;
  }
}

// Step 4: Redis Connectivity Check
async function testRedisConnectivity() {
  logSection('STEP 4: Redis Connectivity Check');
  
  try {
    logInfo('Testing Redis connection...');
    
    const redisClient = createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379',
      socket: {
        connectTimeout: 5000
      }
    });
    
    await redisClient.connect();
    logSuccess('Redis connection successful');
    
    // Test ping
    const pong = await redisClient.ping();
    if (pong === 'PONG') {
      logSuccess('Redis ping successful');
    }
    
    // Test set/get
    await redisClient.set('test-key', 'test-value', { EX: 10 });
    const value = await redisClient.get('test-key');
    if (value === 'test-value') {
      logSuccess('Redis read/write operations successful');
    }
    
    await redisClient.quit();
    
    testResults.redis.status = 'passed';
    testResults.redis.details.push({
      test: 'Redis Connection',
      status: 'passed',
      message: 'Redis is responding correctly'
    });
    
    return true;
  } catch (error) {
    logError(`Redis connection failed: ${error.message}`);
    testResults.redis.status = 'failed';
    testResults.redis.details.push({
      test: 'Redis Connection',
      status: 'failed',
      message: error.message
    });
    return false;
  }
}

// Step 5: Docker Container Status
async function testDockerContainers() {
  logSection('STEP 5: Docker Container Status');
  
  try {
    logInfo('Checking Docker container status...');
    
    const { execSync } = require('child_process');
    const output = execSync('docker ps --format "{{.Names}}: {{.Status}}"', { encoding: 'utf-8' });
    
    const containers = output.trim().split('\n');
    const requiredContainers = ['smarttech_backend', 'smarttech_redis', 'smarttech_postgres', 'smarttech_frontend'];
    
    logInfo('Running containers:');
    containers.forEach(container => {
      logInfo(`  - ${container}`);
    });
    
    const missingContainers = requiredContainers.filter(
      name => !output.includes(name)
    );
    
    if (missingContainers.length > 0) {
      logWarning(`Missing containers: ${missingContainers.join(', ')}`);
      testResults.docker.status = 'warning';
      testResults.docker.details.push({
        test: 'Docker Containers',
        status: 'warning',
        message: `Missing containers: ${missingContainers.join(', ')}`
      });
    } else {
      logSuccess('All required containers are running');
      testResults.docker.status = 'passed';
      testResults.docker.details.push({
        test: 'Docker Containers',
        status: 'passed',
        message: 'All required containers are running'
      });
    }
    
    return missingContainers.length === 0;
  } catch (error) {
    logError(`Docker container check failed: ${error.message}`);
    testResults.docker.status = 'failed';
    testResults.docker.details.push({
      test: 'Docker Containers',
      status: 'failed',
      message: error.message
    });
    return false;
  }
}

// Step 6: Login API Testing
async function testLoginApi() {
  logSection('STEP 6: Login API Testing');
  
  let passedTests = 0;
  let totalTests = 0;
  
  // Test positive cases
  logInfo('Testing valid login attempts...\n');
  
  for (const user of DEMO_USERS) {
    totalTests++;
    try {
      logInfo(`Testing login for ${user.identifier}...`);
      
      const response = await axios.post(`${API_BASE_URL}/auth/login`, {
        identifier: user.identifier,
        password: user.password
      }, {
        timeout: 15000
      });
      
      if (response.status === 200 && response.data?.user?.id && response.data?.token) {
        logSuccess(`Login successful for ${user.identifier}`);
        logInfo(`  User ID: ${response.data.user.id}`);
        logInfo(`  Token: ${response.data.token.substring(0, 30)}...`);
        
        // Verify user name
        const fullName = `${response.data.user.firstName} ${response.data.user.lastName}`;
        if (fullName === user.expectedName) {
          logSuccess(`User name matches expected: ${user.expectedName}`);
        } else {
          logWarning(`User name mismatch. Expected: ${user.expectedName}, Got: ${fullName}`);
        }
        
        testResults.loginApi.details.push({
          test: `Login - ${user.identifier}`,
          status: 'passed',
          message: 'Login successful'
        });
        
        passedTests++;
      } else {
        logError(`Invalid response structure for ${user.identifier}`);
        testResults.loginApi.details.push({
          test: `Login - ${user.identifier}`,
          status: 'failed',
          message: 'Invalid response structure'
        });
      }
    } catch (error) {
      logError(`Login failed for ${user.identifier}: ${error.message}`);
      testResults.loginApi.details.push({
        test: `Login - ${user.identifier}`,
        status: 'failed',
        message: error.message
      });
    }
  }
  
  // Test negative cases
  logInfo('\nTesting invalid login attempts...\n');
  
  const negativeTests = [
    {
      name: 'Invalid email',
      identifier: 'nonexistent@smarttech.bd',
      password: 'Demo123456',
      expectedStatus: 401
    },
    {
      name: 'Invalid password',
      identifier: 'demo.user1@smarttech.bd',
      password: 'WrongPassword123',
      expectedStatus: 401
    },
    {
      name: 'Missing identifier',
      identifier: '',
      password: 'Demo123456',
      expectedStatus: 400
    },
    {
      name: 'Missing password',
      identifier: 'demo.user1@smarttech.bd',
      password: '',
      expectedStatus: 400
    }
  ];
  
  for (const testCase of negativeTests) {
    totalTests++;
    try {
      logInfo(`Testing: ${testCase.name}...`);
      
      const response = await axios.post(`${API_BASE_URL}/auth/login`, {
        identifier: testCase.identifier,
        password: testCase.password
      }, {
        timeout: 5000,
        validateStatus: () => true // Don't throw on error status
      });
      
      if (response.status === testCase.expectedStatus) {
        logSuccess(`${testCase.name} returned expected status ${response.status}`);
        testResults.loginApi.details.push({
          test: `Login - ${testCase.name}`,
          status: 'passed',
          message: `Returned expected status ${response.status}`
        });
        passedTests++;
      } else {
        logError(`${testCase.name} returned unexpected status ${response.status} (expected ${testCase.expectedStatus})`);
        testResults.loginApi.details.push({
          test: `Login - ${testCase.name}`,
          status: 'failed',
          message: `Unexpected status: ${response.status}`
        });
      }
    } catch (error) {
      logError(`${testCase.name} test failed: ${error.message}`);
      testResults.loginApi.details.push({
        test: `Login - ${testCase.name}`,
        status: 'failed',
        message: error.message
      });
    }
  }
  
  const successRate = (passedTests / totalTests * 100).toFixed(1);
  logInfo(`\nLogin API Tests: ${passedTests}/${totalTests} passed (${successRate}%)`);
  
  testResults.loginApi.status = passedTests === totalTests ? 'passed' : 'partial';
  
  return passedTests === totalTests;
}

// Step 7: Session Management Verification
async function testSessionManagement() {
  logSection('STEP 7: Session Management Verification');
  
  try {
    logInfo('Testing session creation and retrieval...');
    
    // Login to get session
    const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
      identifier: 'demo.user1@smarttech.bd',
      password: 'Demo123456'
    }, {
      timeout: 15000
    });
    
    if (!loginResponse.data?.sessionId) {
      logError('No session ID returned from login');
      testResults.sessionManagement.status = 'failed';
      testResults.sessionManagement.details.push({
        test: 'Session Creation',
        status: 'failed',
        message: 'No session ID returned'
      });
      return false;
    }
    
    const sessionId = loginResponse.data.sessionId;
    const token = loginResponse.data.token;
    
    logSuccess(`Session created: ${sessionId.substring(0, 20)}...`);
    
    // Test session validation
    try {
      const meResponse = await axios.get(`${API_BASE_URL}/auth/me`, {
        headers: {
          'Authorization': `Bearer ${token}`
        },
        timeout: 5000
      });
      
      if (meResponse.status === 200 && meResponse.data?.user) {
        logSuccess('Session validation successful');
        logInfo(`User: ${meResponse.data.user.email}`);
        
        testResults.sessionManagement.status = 'passed';
        testResults.sessionManagement.details.push({
          test: 'Session Creation',
          status: 'passed',
          message: 'Session created and validated successfully'
        });
        
        return true;
      } else {
        logError('Session validation failed');
        testResults.sessionManagement.status = 'failed';
        testResults.sessionManagement.details.push({
          test: 'Session Validation',
          status: 'failed',
          message: 'Invalid response from /auth/me'
        });
        return false;
      }
    } catch (error) {
      logError(`Session validation failed: ${error.message}`);
      testResults.sessionManagement.status = 'failed';
      testResults.sessionManagement.details.push({
        test: 'Session Validation',
        status: 'failed',
        message: error.message
      });
      return false;
    }
  } catch (error) {
    logError(`Session management test failed: ${error.message}`);
    testResults.sessionManagement.status = 'failed';
    testResults.sessionManagement.details.push({
      test: 'Session Management',
      status: 'failed',
      message: error.message
    });
    return false;
  }
}

// Step 8: Token Validation
async function testTokenValidation() {
  logSection('STEP 8: Token Validation');
  
  try {
    logInfo('Testing token generation and validation...');
    
    // Login to get token
    const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
      identifier: 'demo.user1@smarttech.bd',
      password: 'Demo123456'
    }, {
      timeout: 15000
    });
    
    if (!loginResponse.data?.token) {
      logError('No token returned from login');
      testResults.tokenValidation.status = 'failed';
      testResults.tokenValidation.details.push({
        test: 'Token Generation',
        status: 'failed',
        message: 'No token returned'
      });
      return false;
    }
    
    const token = loginResponse.data.token;
    logSuccess(`Token generated: ${token.substring(0, 30)}...`);
    
    // Test token structure
    const parts = token.split('.');
    if (parts.length !== 3) {
      logError('Invalid token structure (should have 3 parts)');
      testResults.tokenValidation.status = 'failed';
      testResults.tokenValidation.details.push({
        test: 'Token Structure',
        status: 'failed',
        message: 'Invalid token structure'
      });
      return false;
    }
    
    logSuccess('Token structure is valid (header.payload.signature)');
    
    // Test token usage
    try {
      const meResponse = await axios.get(`${API_BASE_URL}/auth/me`, {
        headers: {
          'Authorization': `Bearer ${token}`
        },
        timeout: 5000
      });
      
      if (meResponse.status === 200) {
        logSuccess('Token validation successful');
        
        testResults.tokenValidation.status = 'passed';
        testResults.tokenValidation.details.push({
          test: 'Token Generation',
          status: 'passed',
          message: 'Token generated and validated successfully'
        });
        
        return true;
      } else {
        logError('Token validation failed');
        testResults.tokenValidation.status = 'failed';
        testResults.tokenValidation.details.push({
          test: 'Token Validation',
          status: 'failed',
          message: 'Invalid response from /auth/me'
        });
        return false;
      }
    } catch (error) {
      logError(`Token validation failed: ${error.message}`);
      testResults.tokenValidation.status = 'failed';
      testResults.tokenValidation.details.push({
        test: 'Token Validation',
        status: 'failed',
        message: error.message
      });
      return false;
    }
  } catch (error) {
    logError(`Token validation test failed: ${error.message}`);
    testResults.tokenValidation.status = 'failed';
    testResults.tokenValidation.details.push({
      test: 'Token Validation',
      status: 'failed',
      message: error.message
    });
    return false;
  }
}

// Generate Summary Report
function generateSummaryReport() {
  logSection('COMPREHENSIVE LOGIN FLOW TEST SUMMARY');
  
  logInfo(`Test Date: ${new Date().toISOString()}`);
  logInfo(`API Base URL: ${API_BASE_URL}\n`);
  
  // Calculate overall status
  const tests = Object.values(testResults);
  const passed = tests.filter(t => t.status === 'passed').length;
  const failed = tests.filter(t => t.status === 'failed').length;
  const partial = tests.filter(t => t.status === 'partial').length;
  const warning = tests.filter(t => t.status === 'warning').length;
  
  // Display results for each test
  Object.entries(testResults).forEach(([name, result]) => {
    const statusColor = result.status === 'passed' ? 'green' : 
                       result.status === 'failed' ? 'red' : 
                       result.status === 'partial' ? 'yellow' : 'yellow';
    
    log(`${name.padEnd(20)}: ${result.status.toUpperCase()}`, statusColor);
  });
  
  console.log('\n' + '='.repeat(80));
  
  const totalTests = passed + failed + partial + warning;
  const successRate = ((passed / totalTests) * 100).toFixed(1);
  
  log(`\n📊 Overall Results:`, 'bright');
  log(`   ✅ Passed: ${passed}/${totalTests}`, 'green');
  log(`   ⚠️  Partial: ${partial}/${totalTests}`, 'yellow');
  log(`   ⚠️  Warnings: ${warning}/${totalTests}`, 'yellow');
  log(`   ❌ Failed: ${failed}/${totalTests}`, 'red');
  log(`   📈 Success Rate: ${successRate}%\n`, 'bright');
  
  if (failed === 0 && partial === 0) {
    log('🎉 ALL TESTS PASSED! Login flow is working correctly.\n', 'green');
  } else if (failed === 0) {
    log('✅ All critical tests passed. Some tests have partial results.\n', 'yellow');
  } else {
    log('⚠️  SOME TESTS FAILED! Please review the results above.\n', 'red');
  }
  
  // Provide recommendations
  if (failed > 0 || partial > 0) {
    log('📋 Recommendations:', 'bright');
    
    if (testResults.database.status === 'failed') {
      log('   - Check database connection and credentials', 'yellow');
    }
    if (testResults.demoUsers.status === 'failed') {
      log('   - Run: node test-profile-management.js to create demo users', 'yellow');
    }
    if (testResults.backendHealth.status === 'failed') {
      log('   - Check backend server logs: docker logs smarttech_backend', 'yellow');
    }
    if (testResults.redis.status === 'failed') {
      log('   - Check Redis container: docker logs smarttech_redis', 'yellow');
    }
    if (testResults.loginApi.status === 'failed' || testResults.loginApi.status === 'partial') {
      log('   - Review login security middleware for errors', 'yellow');
      log('   - Check backend logs for "Login security middleware error"', 'yellow');
    }
    if (testResults.sessionManagement.status === 'failed') {
      log('   - Verify session creation in Redis', 'yellow');
    }
    if (testResults.tokenValidation.status === 'failed') {
      log('   - Check JWT token generation and validation', 'yellow');
    }
    
    console.log();
  }
  
  log('For detailed troubleshooting, see: backend/LOGIN_ISSUES_AND_SOLUTIONS.md\n', 'cyan');
  console.log('='.repeat(80) + '\n');
}

// Main execution function
async function runCompleteTest() {
  console.log('\n' + '='.repeat(80));
  log('COMPLETE LOGIN FLOW TEST SUITE', 'bright');
  console.log('='.repeat(80));
  
  try {
    // Run all tests
    await testDatabaseConnectivity();
    await testDemoUsers();
    await testBackendHealth();
    await testRedisConnectivity();
    await testDockerContainers();
    await testLoginApi();
    await testSessionManagement();
    await testTokenValidation();
    
    // Generate summary report
    generateSummaryReport();
    
  } catch (error) {
    logError(`Test suite execution failed: ${error.message}`);
    console.error(error);
  }
}

// Run the test suite
runCompleteTest().catch(console.error);
