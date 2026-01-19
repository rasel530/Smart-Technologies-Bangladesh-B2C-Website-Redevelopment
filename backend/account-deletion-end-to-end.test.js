/**
 * Account Deletion End-to-End Test Script
 * Tests the account deletion functionality to verify the 500 Internal Server Error fix
 */

const http = require('http');

// Configuration
const BASE_URL = 'http://localhost:3001';
const API_ENDPOINT = '/api/v1/profile/account/deletion/request';
const STATUS_ENDPOINT = '/api/v1/profile/account/deletion/status';

// Use the token from the logs
const AUTH_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIyNTJhOTJiOS0yNWJlLTRmMDctOWMzMi1kYjIxNzcyN2MxNmYiLCJlbWFpbCI6InJhc2VsYmVwYXJpODhAZ21haWwuY29tIiwicm9sZSI6ImN1c3RvbWVyIiwiaWF0IjoxNzY4ODQzNDg4LCJleHAiOjE3Njk0Mzk0ODh9.5Xj3k9k8k8k8k8k8k8k8k8k8k8k8k8k8k8k8k8k8k';

// Test results tracking
const testResults = {
  total: 0,
  passed: 0,
  failed: 0,
  tests: []
};

// Helper function to make HTTP requests
function makeRequest(method, endpoint, data = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(endpoint, BASE_URL);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        ...headers
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
            body: parsedBody
          });
        } catch (error) {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: body,
            parseError: true
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

// Helper function to log test results
function logTest(testName, passed, details) {
  testResults.total++;
  if (passed) {
    testResults.passed++;
    console.log(`✅ PASS: ${testName}`);
  } else {
    testResults.failed++;
    console.log(`❌ FAIL: ${testName}`);
  }
  
  testResults.tests.push({
    name: testName,
    passed: passed,
    details: details
  });
  
  if (details) {
    console.log(`   Details: ${JSON.stringify(details, null, 2)}`);
  }
  console.log('');
}

// Test 1: Account Deletion Request with valid token and confirmation
async function test1_AccountDeletionRequest() {
  console.log('\n=== TEST 1: Account Deletion Request Endpoint ===');
  
  try {
    const response = await makeRequest(
      'POST',
      API_ENDPOINT,
      { confirmation: 'DELETE' },
      { 'Authorization': `Bearer ${AUTH_TOKEN}` }
    );
    
    console.log('Response Status:', response.statusCode);
    console.log('Response Body:', response.body);
    
    // Check if response is NOT 500
    const not500 = response.statusCode !== 500;
    logTest('Response is NOT 500 Internal Server Error', not500, {
      statusCode: response.statusCode
    });
    
    // Check if response is valid JSON
    const validJson = !response.parseError;
    logTest('Response is valid JSON', validJson, {
      parseError: response.parseError
    });
    
    // Check expected status codes (200, 429, or 400)
    const validStatus = [200, 429, 400].includes(response.statusCode);
    logTest('Response status is 200, 429, or 400', validStatus, {
      statusCode: response.statusCode
    });
    
    // Check for proper error message if 500 occurs
    if (response.statusCode === 500) {
      logTest('500 error has proper error message', 
        response.body && (response.body.error || response.body.message), 
        { body: response.body }
      );
    }
    
  } catch (error) {
    logTest('Account Deletion Request', false, {
      error: error.message
    });
  }
}

// Test 2: Rate Limiting - Multiple rapid requests
async function test2_RateLimiting() {
  console.log('\n=== TEST 2: Rate Limiting ===');
  
  const requests = [];
  const numRequests = 3;
  
  for (let i = 0; i < numRequests; i++) {
    requests.push(
      makeRequest(
        'POST',
        API_ENDPOINT,
        { confirmation: 'DELETE' },
        { 'Authorization': `Bearer ${AUTH_TOKEN}` }
      )
    );
    
    // Small delay between requests
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  try {
    const responses = await Promise.all(requests);
    
    console.log('All responses received:', responses.map(r => r.statusCode));
    
    // Check if at least one request succeeded (not 500)
    const atLeastOneSuccess = responses.some(r => r.statusCode !== 500);
    logTest('At least one request did not return 500', atLeastOneSuccess, {
      statusCodes: responses.map(r => r.statusCode)
    });
    
    // Check if rate limiting is working (429 responses)
    const has429 = responses.some(r => r.statusCode === 429);
    logTest('Rate limiting triggered (429 response)', has429, {
      statusCodes: responses.map(r => r.statusCode)
    });
    
    // Check if 429 responses have proper error messages
    const responses429 = responses.filter(r => r.statusCode === 429);
    if (responses429.length > 0) {
      const hasProperError = responses429.every(r => 
        r.body && (r.body.error || r.body.message)
      );
      logTest('429 responses have proper error messages', hasProperError, {
        responses: responses429.map(r => r.body)
      });
      
      // Check for bilingual error messages (English and Bengali)
      const hasBilingual = responses429.some(r => 
        r.body && (r.body.error_en || r.body.message_en) && 
                 (r.body.error_bn || r.body.message_bn)
      );
      logTest('429 responses have bilingual error messages (EN/BN)', hasBilingual, {
        responses: responses429.map(r => r.body)
      });
    }
    
  } catch (error) {
    logTest('Rate Limiting Test', false, {
      error: error.message
    });
  }
}

// Test 3: Check Deletion Status
async function test3_DeletionStatus() {
  console.log('\n=== TEST 3: Account Deletion Status ===');
  
  try {
    const response = await makeRequest(
      'GET',
      STATUS_ENDPOINT,
      null,
      { 'Authorization': `Bearer ${AUTH_TOKEN}` }
    );
    
    console.log('Response Status:', response.statusCode);
    console.log('Response Body:', response.body);
    
    // Check if status endpoint works (not 500)
    const not500 = response.statusCode !== 500;
    logTest('Status endpoint is NOT 500', not500, {
      statusCode: response.statusCode
    });
    
    // Check if response has expected fields
    const hasExpectedFields = response.body && 
      typeof response.body.accountStatus === 'string' &&
      typeof response.body.hasPendingDeletion === 'boolean';
    logTest('Status response has expected fields', hasExpectedFields, {
      fields: response.body ? Object.keys(response.body) : []
    });
    
  } catch (error) {
    logTest('Deletion Status Test', false, {
      error: error.message
    });
  }
}

// Test 4: Edge Cases
async function test4_EdgeCases() {
  console.log('\n=== TEST 4: Edge Cases ===');
  
  // Test 4a: Invalid confirmation value
  try {
    const response = await makeRequest(
      'POST',
      API_ENDPOINT,
      { confirmation: 'INVALID' },
      { 'Authorization': `Bearer ${AUTH_TOKEN}` }
    );
    
    console.log('Invalid Confirmation - Response Status:', response.statusCode);
    console.log('Invalid Confirmation - Response Body:', response.body);
    
    const is400or422 = [400, 422].includes(response.statusCode);
    logTest('Invalid confirmation returns 400 or 422', is400or422, {
      statusCode: response.statusCode
    });
    
  } catch (error) {
    logTest('Invalid Confirmation Test', false, {
      error: error.message
    });
  }
  
  // Test 4b: No authentication token
  try {
    const response = await makeRequest(
      'POST',
      API_ENDPOINT,
      { confirmation: 'DELETE' },
      {}
    );
    
    console.log('No Auth Token - Response Status:', response.statusCode);
    console.log('No Auth Token - Response Body:', response.body);
    
    const is401or403 = [401, 403].includes(response.statusCode);
    logTest('No auth token returns 401 or 403', is401or403, {
      statusCode: response.statusCode
    });
    
  } catch (error) {
    logTest('No Auth Token Test', false, {
      error: error.message
    });
  }
  
  // Test 4c: Invalid/expired token
  try {
    const response = await makeRequest(
      'POST',
      API_ENDPOINT,
      { confirmation: 'DELETE' },
      { 'Authorization': 'Bearer invalid_token_12345' }
    );
    
    console.log('Invalid Token - Response Status:', response.statusCode);
    console.log('Invalid Token - Response Body:', response.body);
    
    const is401or403 = [401, 403].includes(response.statusCode);
    logTest('Invalid token returns 401 or 403', is401or403, {
      statusCode: response.statusCode
    });
    
  } catch (error) {
    logTest('Invalid Token Test', false, {
      error: error.message
    });
  }
  
  // Test 4d: Missing confirmation field
  try {
    const response = await makeRequest(
      'POST',
      API_ENDPOINT,
      {},
      { 'Authorization': `Bearer ${AUTH_TOKEN}` }
    );
    
    console.log('Missing Confirmation - Response Status:', response.statusCode);
    console.log('Missing Confirmation - Response Body:', response.body);
    
    const is400or422 = [400, 422].includes(response.statusCode);
    logTest('Missing confirmation returns 400 or 422', is400or422, {
      statusCode: response.statusCode
    });
    
  } catch (error) {
    logTest('Missing Confirmation Test', false, {
      error: error.message
    });
  }
}

// Main test execution
async function runTests() {
  console.log('========================================');
  console.log('Account Deletion End-to-End Test Suite');
  console.log('========================================');
  console.log(`Base URL: ${BASE_URL}`);
  console.log(`API Endpoint: ${API_ENDPOINT}`);
  console.log(`Auth Token: ${AUTH_TOKEN.substring(0, 20)}...`);
  console.log('');
  
  await test1_AccountDeletionRequest();
  await test2_RateLimiting();
  await test3_DeletionStatus();
  await test4_EdgeCases();
  
  // Print summary
  console.log('\n========================================');
  console.log('TEST SUMMARY');
  console.log('========================================');
  console.log(`Total Tests: ${testResults.total}`);
  console.log(`Passed: ${testResults.passed}`);
  console.log(`Failed: ${testResults.failed}`);
  console.log(`Success Rate: ${((testResults.passed / testResults.total) * 100).toFixed(2)}%`);
  console.log('');
  
  // Print detailed results
  console.log('DETAILED RESULTS:');
  testResults.tests.forEach(test => {
    console.log(`\n${test.passed ? '✅' : '❌'} ${test.name}`);
    if (test.details) {
      console.log(`   ${JSON.stringify(test.details, null, 2)}`);
    }
  });
  
  // Save results to file
  const fs = require('fs');
  const reportPath = './backend/ACCOUNT_DELETION_TEST_RESULTS.json';
  fs.writeFileSync(reportPath, JSON.stringify(testResults, null, 2));
  console.log(`\nTest results saved to: ${reportPath}`);
}

// Run the tests
runTests().catch(error => {
  console.error('Test execution failed:', error);
  process.exit(1);
});
