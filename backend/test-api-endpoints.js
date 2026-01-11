/**
 * Comprehensive Account Preferences API Test Script
 * Phase 3, Milestone 3, Task 3
 * 
 * Tests all 16 Account Preferences API endpoints
 */

const http = require('http');

// Configuration
const API_BASE_URL = 'http://localhost:3001/api/v1';
const API_BASE_PATH = '/api/v1';
const TEST_USER = {
  email: 'test@example.com',
  password: 'TestPassword123!',
  firstName: 'Test',
  lastName: 'User'
};

// Test results storage
const testResults = {
  totalTests: 0,
  passed: 0,
  failed: 0,
  endpoints: {}
};

// Helper function to log test results
function logTest(endpoint, method, status, statusCode, responseTime, error = null) {
  testResults.totalTests++;
  
  if (status === 'PASS') {
    testResults.passed++;
    console.log(`✅ PASS [${endpoint}] ${method} - Status: ${statusCode} (${responseTime}ms)`);
  } else {
    testResults.failed++;
    console.log(`❌ FAIL [${endpoint}] ${method} - Status: ${statusCode} (${responseTime}ms) - ${error || 'Unknown error'}`);
  }
  
  testResults.endpoints[endpoint] = {
    method,
    status,
    statusCode,
    responseTime,
    error
  };
}

// Helper function to make HTTP request
function makeRequest(method, endpoint, data = null, token = null) {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    const fullPath = endpoint.startsWith('/') ? endpoint : '/' + endpoint;
    const url = API_BASE_PATH + fullPath;
    const options = {
      hostname: 'localhost',
      port: 3001,
      path: url,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` })
      }
    };

    console.log(`[DEBUG] Making ${method} request to: ${url}`);
    if (data) console.log(`[DEBUG] Request body:`, JSON.stringify(data));

    const req = http.request(options, (res) => {
      let body = '';
        
      res.on('data', (chunk) => {
        body += chunk;
      });
        
      res.on('end', () => {
        const responseTime = Date.now() - startTime;
        console.log(`[DEBUG] Response status: ${res.statusCode}, time: ${responseTime}ms`);
        console.log(`[DEBUG] Response body:`, body.substring(0, 200));
        
        try {
          const parsedBody = JSON.parse(body);
          resolve({
            statusCode: res.statusCode,
            data: parsedBody,
            responseTime
          });
        } catch (e) {
          console.log(`[DEBUG] JSON parse error:`, e.message);
          reject({
            statusCode: res.statusCode,
            error: e.message,
            responseTime
          });
        }
      });
    });

    req.on('error', (err) => {
      console.log(`[DEBUG] Request error:`, err.message, err.code);
      reject({
        statusCode: err.code || 'UNKNOWN',
        error: err.message,
        responseTime: Date.now() - startTime
      });
    });

    // Write request body if data is provided
    if (data) {
      req.write(JSON.stringify(data));
    }

    // End request to send it
    req.end();
  });
}

// Helper function to sleep
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Main test function
async function runTests() {
  console.log('\n' + '='.repeat(60));
  console.log('  ACCOUNT PREFERENCES API COMPREHENSIVE TEST');
  console.log('  Phase 3, Milestone 3, Task 3');
  console.log('='.repeat(60) + '\n');

  let authToken = null;

  // ==================== STEP 1: LOGIN ====================
  console.log('\n📝 STEP 1: LOGIN TO GET JWT TOKEN');
  console.log('-'.repeat(60));
  
  try {
    const loginResult = await makeRequest('POST', '/auth/login', {
      identifier: TEST_USER.email,
      password: TEST_USER.password
    });

    if (loginResult.statusCode === 200 && loginResult.data.token) {
      authToken = loginResult.data.token;
      logTest('POST /api/v1/auth/login', 'Login', 200, loginResult.responseTime);
      console.log(`   Token: ${authToken.substring(0, 20)}...`);
    } else {
      logTest('POST /api/v1/auth/login', 'Login', loginResult.statusCode, loginResult.responseTime, 'Login failed');
      console.log(`   Error: ${JSON.stringify(loginResult.data)}`);
      return;
    }
  } catch (error) {
    logTest('POST /api/v1/auth/login', 'Login', error.statusCode, error.responseTime, error.message);
    return;
  }

  await sleep(1000);

  // ==================== STEP 2: NOTIFICATION PREFERENCES ====================
  console.log('\n📝 STEP 2: TEST NOTIFICATION PREFERENCES ENDPOINTS');
  console.log('-'.repeat(60));

  // Test 2.1: GET /api/user/preferences/notifications
  try {
    const result = await makeRequest('GET', '/user/preferences/notifications', null, authToken);
    logTest('GET /api/v1/user/preferences/notifications', 'GET', result.statusCode, result.responseTime);
    
    if (result.statusCode === 200 && result.data.success) {
      console.log('   Response structure:', JSON.stringify(result.data, null, 2));
    }
  } catch (error) {
    logTest('GET /api/v1/user/preferences/notifications', 'GET', error.statusCode, error.responseTime, error.message);
  }

  await sleep(500);

  // Test 2.2: PUT /api/user/preferences/notifications
  try {
    const result = await makeRequest('PUT', '/user/preferences/notifications', {
      email: false,
      sms: true,
      whatsapp: true,
      marketing: false,
      newsletter: true,
      frequency: 'daily'
    }, authToken);
    logTest('PUT /api/v1/user/preferences/notifications', 'PUT', result.statusCode, result.responseTime);
    
    if (result.statusCode === 200 && result.data.success) {
      console.log('   Updated preferences:', JSON.stringify(result.data.data, null, 2));
    }
  } catch (error) {
    logTest('PUT /api/v1/user/preferences/notifications', 'PUT', error.statusCode, error.responseTime, error.message);
  }

  await sleep(500);

  // Test 2.3: GET /api/user/preferences/communication
  try {
    const result = await makeRequest('GET', '/user/preferences/communication', null, authToken);
    logTest('GET /api/v1/user/preferences/communication', 'GET', result.statusCode, result.responseTime);
  } catch (error) {
    logTest('GET /api/v1/user/preferences/communication', 'GET', error.statusCode, error.responseTime, error.message);
  }

  await sleep(500);

  // Test 2.4: PUT /api/user/preferences/communication
  try {
    const result = await makeRequest('PUT', '/user/preferences/communication', {
      email: false,
      sms: true,
      whatsapp: true,
      marketing: false,
      newsletter: true,
      frequency: 'weekly'
    }, authToken);
    logTest('PUT /api/v1/user/preferences/communication', 'PUT', result.statusCode, result.responseTime);
  } catch (error) {
    logTest('PUT /api/v1/user/preferences/communication', 'PUT', error.statusCode, error.responseTime, error.message);
  }

  await sleep(500);

  // ==================== STEP 3: PRIVACY SETTINGS ====================
  console.log('\n📝 STEP 3: TEST PRIVACY SETTINGS ENDPOINTS');
  console.log('-'.repeat(60));

  // Test 3.1: GET /api/user/preferences/privacy
  try {
    const result = await makeRequest('GET', '/user/preferences/privacy', null, authToken);
    logTest('GET /api/v1/user/preferences/privacy', 'GET', result.statusCode, result.responseTime);
  } catch (error) {
    logTest('GET /api/v1/user/preferences/privacy', 'GET', error.statusCode, error.responseTime, error.message);
  }

  await sleep(500);

  // Test 3.2: PUT /api/user/preferences/privacy
  try {
    const result = await makeRequest('PUT', '/user/preferences/privacy', {
      twoFactorEnabled: true,
      dataSharingEnabled: false,
      profileVisibility: 'public'
    }, authToken);
    logTest('PUT /api/v1/user/preferences/privacy', 'PUT', result.statusCode, result.responseTime);
    
    if (result.statusCode === 200 && result.data.success) {
      console.log('   Updated preferences:', JSON.stringify(result.data.data, null, 2));
    }
  } catch (error) {
    logTest('PUT /api/v1/user/preferences/privacy', 'PUT', error.statusCode, error.responseTime, error.message);
  }

  await sleep(500);

  // ==================== STEP 4: PASSWORD MANAGEMENT ====================
  console.log('\n📝 STEP 4: TEST PASSWORD MANAGEMENT ENDPOINT');
  console.log('-'.repeat(60));

  // Test 4.1: POST /api/user/password/change - Valid password
  try {
    const result = await makeRequest('POST', '/user/password/change', {
      currentPassword: TEST_USER.password,
      newPassword: 'NewTest@1234',
      confirmPassword: 'NewTest@1234'
    }, authToken);
    logTest('POST /api/v1/user/password/change', 'POST', result.statusCode, result.responseTime);
  } catch (error) {
    logTest('POST /api/v1/user/password/change', 'POST', error.statusCode, error.responseTime, error.message);
  }

  await sleep(500);

  // Test 4.2: POST /api/user/password/change - Invalid current password
  try {
    const result = await makeRequest('POST', '/user/password/change', {
      currentPassword: 'WrongPassword',
      newPassword: 'NewTest@1234',
      confirmPassword: 'NewTest@1234'
    }, authToken);
    logTest('POST /api/v1/user/password/change', 'POST', result.statusCode, result.responseTime);
    
    if (result.statusCode === 400 || result.statusCode === 401) {
      console.log('   Expected: Invalid current password');
    }
  } catch (error) {
    logTest('POST /api/v1/user/password/change', 'POST', error.statusCode, error.responseTime, error.message);
  }

  await sleep(500);

  // Test 4.3: POST /api/user/password/change - Weak password
  try {
    const result = await makeRequest('POST', '/user/password/change', {
      currentPassword: TEST_USER.password,
      newPassword: 'weak',
      confirmPassword: 'weak'
    }, authToken);
    logTest('POST /api/v1/user/password/change', 'POST', result.statusCode, result.responseTime);
    
    if (result.statusCode === 400) {
      console.log('   Expected: Password too weak');
    }
  } catch (error) {
    logTest('POST /api/v1/user/password/change', 'POST', error.statusCode, error.responseTime, error.message);
  }

  await sleep(500);

  // Test 4.4: POST /api/user/password/change - Mismatched passwords
  try {
    const result = await makeRequest('POST', '/user/password/change', {
      currentPassword: TEST_USER.password,
      newPassword: 'NewTest@1234',
      confirmPassword: 'DifferentTest@1234'
    }, authToken);
    logTest('POST /api/v1/user/password/change', 'POST', result.statusCode, result.responseTime);
    
    if (result.statusCode === 400) {
      console.log('   Expected: Passwords do not match');
    }
  } catch (error) {
    logTest('POST /api/v1/user/password/change', 'POST', error.statusCode, error.responseTime, error.message);
  }

  await sleep(500);

  // ==================== STEP 5: TWO FACTOR AUTHENTICATION ====================
  console.log('\n📝 STEP 5: TEST 2FA ENDPOINTS');
  console.log('-'.repeat(60));

  // Test 5.1: POST /api/user/2fa/enable - SMS method
  try {
    const result = await makeRequest('POST', '/user/2fa/enable', {
      method: 'sms',
      phoneNumber: '+8801234567'
    }, authToken);
    logTest('POST /api/v1/user/2fa/enable', 'POST', result.statusCode, result.responseTime);
  } catch (error) {
    logTest('POST /api/v1/user/2fa/enable', 'POST', error.statusCode, error.responseTime, error.message);
  }

  await sleep(500);

  // Test 5.2: POST /api/user/2fa/enable - Authenticator app method
  try {
    const result = await makeRequest('POST', '/user/2fa/enable', {
      method: 'authenticator_app'
    }, authToken);
    logTest('POST /api/v1/user/2fa/enable', 'POST', result.statusCode, result.responseTime);
  } catch (error) {
    logTest('POST /api/v1/user/2fa/enable', 'POST', error.statusCode, error.responseTime, error.message);
  }

  await sleep(500);

  // Test 5.3: POST /api/user/2fa/disable
  try {
    const result = await makeRequest('POST', '/user/2fa/disable', null, authToken);
    logTest('POST /api/v1/user/2fa/disable', 'POST', result.statusCode, result.responseTime);
  } catch (error) {
    logTest('POST /api/v1/user/2fa/disable', 'POST', error.statusCode, error.responseTime, error.message);
  }

  await sleep(500);

  // ==================== STEP 6: ACCOUNT DELETION ====================
  console.log('\n📝 STEP 6: TEST ACCOUNT DELETION ENDPOINTS');
  console.log('-'.repeat(60));

  // Test 6.1: POST /api/user/account/deletion/request - Valid request
  try {
    const result = await makeRequest('POST', '/user/account/deletion/request', {
      confirmation: 'DELETE',
      reason: 'Testing account deletion'
    }, authToken);
    logTest('POST /api/v1/user/account/deletion/request', 'POST', result.statusCode, result.responseTime);
  } catch (error) {
    logTest('POST /api/v1/user/account/deletion/request', 'POST', error.statusCode, error.responseTime, error.message);
  }

  await sleep(500);

  // Test 6.2: POST /api/user/account/deletion/request - Invalid confirmation
  try {
    const result = await makeRequest('POST', '/user/account/deletion/request', {
      confirmation: 'INVALID',
      reason: 'Testing'
    }, authToken);
    logTest('POST /api/v1/user/account/deletion/request', 'POST', result.statusCode, result.responseTime);
    
    if (result.statusCode === 400) {
      console.log('   Expected: Invalid confirmation');
    }
  } catch (error) {
    logTest('POST /api/v1/user/account/deletion/request', 'POST', error.statusCode, error.responseTime, error.message);
  }

  await sleep(500);

  // Test 6.3: GET /api/user/account/deletion/status
  try {
    const result = await makeRequest('GET', '/user/account/deletion/status', null, authToken);
    logTest('GET /api/v1/user/account/deletion/status', 'GET', result.statusCode, result.responseTime);
  } catch (error) {
    logTest('GET /api/v1/user/account/deletion/status', 'GET', error.statusCode, error.responseTime, error.message);
  }

  await sleep(500);

  // Test 6.4: POST /api/user/account/deletion/cancel
  try {
    const result = await makeRequest('POST', '/user/account/deletion/cancel', null, authToken);
    logTest('POST /api/v1/user/account/deletion/cancel', 'POST', result.statusCode, result.responseTime);
  } catch (error) {
    logTest('POST /api/v1/user/account/deletion/cancel', 'POST', error.statusCode, error.responseTime, error.message);
  }

  await sleep(2000);

  // ==================== STEP 7: DATA EXPORT ====================
  console.log('\n📝 STEP 7: TEST DATA EXPORT ENDPOINTS');
  console.log('-'.repeat(60));

  // Test 7.1: GET /api/user/data/export
  try {
    const result = await makeRequest('GET', '/user/data/export', null, authToken);
    logTest('GET /api/v1/user/data/export', 'GET', result.statusCode, result.responseTime);
  } catch (error) {
    logTest('GET /api/v1/user/data/export', 'GET', error.statusCode, error.responseTime, error.message);
  }

  await sleep(500);

  // Test 7.2: POST /api/user/data/export/generate
  try {
    const result = await makeRequest('POST', '/user/data/export/generate', {
      dataTypes: ['profile', 'orders'],
      format: 'json'
    }, authToken);
    logTest('POST /api/v1/user/data/export/generate', 'POST', result.statusCode, result.responseTime);
  } catch (error) {
    logTest('POST /api/v1/user/data/export/generate', 'POST', error.statusCode, error.responseTime, error.message);
  }

  await sleep(2000);

  // Test 7.3: GET /api/user/data/export/:exportId
  try {
    const result = await makeRequest('GET', '/user/data/export/test-export-id', null, authToken);
    logTest('GET /api/v1/user/data/export/:exportId', 'GET', result.statusCode, result.responseTime);
  } catch (error) {
    logTest('GET /api/v1/user/data/export/:exportId', 'GET', error.statusCode, error.responseTime, error.message);
  }

  await sleep(2000);

  // ==================== STEP 8: ERROR HANDLING ====================
  console.log('\n📝 STEP 8: TEST ERROR HANDLING');
  console.log('-'.repeat(60));

  // Test 8.1: Unauthenticated request
  try {
    const result = await makeRequest('GET', '/user/preferences/notifications', null, null);
    logTest('GET /user/preferences/notifications (No Auth)', 'GET', result.statusCode, result.responseTime);
    
    if (result.statusCode === 401) {
      console.log('   Expected: 401 Unauthorized');
    }
  } catch (error) {
    logTest('GET /user/preferences/notifications (No Auth)', 'GET', error.statusCode, error.responseTime, error.message);
  }

  await sleep(500);

  // Test 8.2: Invalid JWT token
  try {
    const result = await makeRequest('GET', '/user/preferences/notifications', null, 'invalid.jwt.token');
    logTest('GET /user/preferences/notifications (Invalid Token)', 'GET', result.statusCode, result.responseTime);
    
    if (result.statusCode === 401) {
      console.log('   Expected: 401 Unauthorized');
    }
  } catch (error) {
    logTest('GET /user/preferences/notifications (Invalid Token)', 'GET', error.statusCode, error.responseTime, error.message);
  }

  // ==================== TEST SUMMARY ====================
  console.log('\n' + '='.repeat(60));
  console.log('  TEST SUMMARY');
  console.log('='.repeat(60) + '\n');

  console.log(`Total Tests: ${testResults.totalTests}`);
  console.log(`Passed: ${testResults.passed}`);
  console.log(`Failed: ${testResults.failed}`);
  console.log(`Success Rate: ${((testResults.passed / testResults.totalTests) * 100).toFixed(2)}%`);

  // Print detailed results
  console.log('\nEndpoint Details:');
  console.log('-'.repeat(60));
  
  Object.keys(testResults.endpoints).forEach(endpoint => {
    const test = testResults.endpoints[endpoint];
    const statusIcon = test.status === 'PASS' ? '✅' : '❌';
    console.log(`${statusIcon} ${endpoint} - ${test.method} - Status: ${test.statusCode} (${test.responseTime}ms)`);
    if (test.error) {
      console.log(`   Error: ${test.error}`);
    }
  });

  // Save results to file
  const fs = require('fs');
  const resultsPath = './api-test-results.json';
  fs.writeFileSync(resultsPath, JSON.stringify(testResults, null, 2));
  console.log(`\n📄 Results saved to: ${resultsPath}`);
}

// Run tests
runTests().catch(error => {
  console.error('Fatal error running tests:', error);
  process.exit(1);
});
