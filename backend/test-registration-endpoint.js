/**
 * Test script to diagnose registration endpoint issues
 * This script tests the registration endpoint directly to identify the root cause of "Failed to fetch" error
 */

const http = require('http');

// Test configuration
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3001';
const API_ENDPOINT = '/api/v1/auth/register';

// Test user data
const testUserData = {
  email: `test_${Date.now()}@example.com`,
  password: 'TestPassword123!',
  confirmPassword: 'TestPassword123!',
  firstName: 'Test',
  lastName: 'User'
};

console.log('='.repeat(80));
console.log('REGISTRATION ENDPOINT DIAGNOSTIC TEST');
console.log('='.repeat(80));
console.log(`Backend URL: ${BACKEND_URL}`);
console.log(`API Endpoint: ${API_ENDPOINT}`);
console.log(`Test Data:`, JSON.stringify(testUserData, null, 2));
console.log('='.repeat(80));

// Function to make HTTP request
function makeRequest(url, method, data) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || (urlObj.protocol === 'https:' ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
      });
      res.on('end', () => {
        try {
          const parsedBody = body ? JSON.parse(body) : null;
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: parsedBody,
            rawBody: body
          });
        } catch (e) {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: null,
            rawBody: body
          });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

// Test 1: Check if backend server is running
async function testServerHealth() {
  console.log('\n[TEST 1] Checking if backend server is running...');
  try {
    const response = await makeRequest(`${BACKEND_URL}/health`, 'GET');
    console.log(`✅ Server is running`);
    console.log(`   Status Code: ${response.statusCode}`);
    console.log(`   Response:`, JSON.stringify(response.body, null, 2));
    return true;
  } catch (error) {
    console.log(`❌ Server is not accessible`);
    console.log(`   Error: ${error.message}`);
    return false;
  }
}

// Test 2: Check API v1 health endpoint
async function testApiV1Health() {
  console.log('\n[TEST 2] Checking API v1 health endpoint...');
  try {
    const response = await makeRequest(`${BACKEND_URL}/api/v1/health`, 'GET');
    console.log(`✅ API v1 endpoint is accessible`);
    console.log(`   Status Code: ${response.statusCode}`);
    console.log(`   Response:`, JSON.stringify(response.body, null, 2));
    return true;
  } catch (error) {
    console.log(`❌ API v1 endpoint is not accessible`);
    console.log(`   Error: ${error.message}`);
    return false;
  }
}

// Test 3: Check registration endpoint with OPTIONS (CORS preflight)
async function testCorsPreflight() {
  console.log('\n[TEST 3] Testing CORS preflight request...');
  try {
    const urlObj = new URL(`${BACKEND_URL}${API_ENDPOINT}`);
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || (urlObj.protocol === 'https:' ? 443 : 80),
      path: urlObj.pathname,
      method: 'OPTIONS',
      headers: {
        'Origin': 'http://localhost:3000',
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'Content-Type'
      }
    };

    const response = await new Promise((resolve, reject) => {
      const req = http.request(options, (res) => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers
        });
      });
      req.on('error', reject);
      req.end();
    });

    console.log(`✅ CORS preflight request completed`);
    console.log(`   Status Code: ${response.statusCode}`);
    console.log(`   CORS Headers:`, {
      'Access-Control-Allow-Origin': response.headers['access-control-allow-origin'],
      'Access-Control-Allow-Methods': response.headers['access-control-allow-methods'],
      'Access-Control-Allow-Headers': response.headers['access-control-allow-headers']
    });
    return true;
  } catch (error) {
    console.log(`❌ CORS preflight request failed`);
    console.log(`   Error: ${error.message}`);
    return false;
  }
}

// Test 4: Test registration endpoint with POST request
async function testRegistrationEndpoint() {
  console.log('\n[TEST 4] Testing registration endpoint with POST request...');
  try {
    const response = await makeRequest(
      `${BACKEND_URL}${API_ENDPOINT}`,
      'POST',
      testUserData
    );

    console.log(`✅ Registration endpoint responded`);
    console.log(`   Status Code: ${response.statusCode}`);
    console.log(`   Response Headers:`, {
      'Content-Type': response.headers['content-type'],
      'Access-Control-Allow-Origin': response.headers['access-control-allow-origin']
    });
    
    if (response.body) {
      console.log(`   Response Body:`, JSON.stringify(response.body, null, 2));
    } else {
      console.log(`   Raw Response:`, response.rawBody);
    }

    if (response.statusCode >= 200 && response.statusCode < 300) {
      console.log(`   ✅ Registration request was successful`);
      return true;
    } else {
      console.log(`   ⚠️  Registration request returned status ${response.statusCode}`);
      return false;
    }
  } catch (error) {
    console.log(`❌ Registration endpoint request failed`);
    console.log(`   Error: ${error.message}`);
    console.log(`   Error Code: ${error.code}`);
    console.log(`   Error Stack:`, error.stack);
    return false;
  }
}

// Test 5: Test with invalid endpoint to verify routing
async function testInvalidEndpoint() {
  console.log('\n[TEST 5] Testing invalid endpoint to verify routing...');
  try {
    const response = await makeRequest(
      `${BACKEND_URL}/api/v1/auth/nonexistent`,
      'POST',
      {}
    );

    console.log(`✅ Invalid endpoint test completed`);
    console.log(`   Status Code: ${response.statusCode}`);
    console.log(`   Response:`, JSON.stringify(response.body, null, 2));
    return true;
  } catch (error) {
    console.log(`❌ Invalid endpoint test failed`);
    console.log(`   Error: ${error.message}`);
    return false;
  }
}

// Main test execution
async function runTests() {
  const results = {
    serverHealth: await testServerHealth(),
    apiV1Health: await testApiV1Health(),
    corsPreflight: await testCorsPreflight(),
    registrationEndpoint: await testRegistrationEndpoint(),
    invalidEndpoint: await testInvalidEndpoint()
  };

  console.log('\n' + '='.repeat(80));
  console.log('TEST SUMMARY');
  console.log('='.repeat(80));
  console.log(`Server Health: ${results.serverHealth ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`API v1 Health: ${results.apiV1Health ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`CORS Preflight: ${results.corsPreflight ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Registration Endpoint: ${results.registrationEndpoint ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Invalid Endpoint: ${results.invalidEndpoint ? '✅ PASS' : '❌ FAIL'}`);
  console.log('='.repeat(80));

  // Diagnosis
  console.log('\nDIAGNOSIS:');
  if (!results.serverHealth) {
    console.log('❌ Backend server is not running or not accessible');
    console.log('   Solution: Start the backend server with `npm start` or `node index.js`');
  } else if (!results.apiV1Health) {
    console.log('❌ API v1 routes are not properly mounted');
    console.log('   Solution: Check backend/routes/index.js and backend/index.js routing configuration');
  } else if (!results.corsPreflight) {
    console.log('❌ CORS configuration may be blocking requests');
    console.log('   Solution: Check CORS configuration in backend/index.js');
  } else if (!results.registrationEndpoint) {
    console.log('❌ Registration endpoint is not responding correctly');
    console.log('   Solution: Check backend/routes/auth.js for registration route implementation');
  } else {
    console.log('✅ All tests passed - the backend is working correctly');
    console.log('   The issue may be in the frontend code or network configuration');
  }

  process.exit(results.registrationEndpoint ? 0 : 1);
}

// Run the tests
runTests().catch((error) => {
  console.error('\nFATAL ERROR:', error);
  process.exit(1);
});
