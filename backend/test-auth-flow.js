/**
 * Test script to verify authentication flow for admin Local Payment Methods
 * This script tests:
 * 1. API endpoint without authentication
 * 2. API endpoint with invalid authentication
 * 3. API endpoint with valid authentication (if token provided)
 */

const http = require('http');

// Configuration
const config = {
  host: 'localhost',
  port: 3001,
  path: '/api/v1/admin/local-payment/methods',
  method: 'GET'
};

// Test functions
function makeRequest(options, token = null) {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    
    const headers = {
      'Content-Type': 'application/json',
      'User-Agent': 'auth-flow-test/1.0'
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const req = http.request({
      ...options,
      headers
    }, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        const duration = Date.now() - startTime;
        try {
          const parsedData = JSON.parse(data);
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            data: parsedData,
            duration
          });
        } catch (e) {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            data: data,
            duration
          });
        }
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    // Set timeout to 10 seconds
    req.setTimeout(10000, () => {
      req.destroy();
      reject(new Error('Request timeout after 10 seconds'));
    });
    
    req.end();
  });
}

async function testNoAuthentication() {
  console.log('\n' + '='.repeat(80));
  console.log('TEST 1: Request WITHOUT authentication token');
  console.log('='.repeat(80));
  
  try {
    const result = await makeRequest(config);
    
    console.log('Status Code:', result.statusCode);
    console.log('Duration:', result.duration, 'ms');
    console.log('Response:', JSON.stringify(result.data, null, 2));
    
    if (result.statusCode === 401) {
      console.log('✓ Correctly returned 401 Unauthorized');
    } else if (result.statusCode === 408 || result.statusCode === 504) {
      console.log('✗ Request timed out - this indicates middleware hanging');
    } else {
      console.log('✗ Unexpected status code:', result.statusCode);
    }
  } catch (error) {
    console.error('✗ Request failed:', error.message);
  }
}

async function testInvalidAuthentication() {
  console.log('\n' + '='.repeat(80));
  console.log('TEST 2: Request WITH INVALID authentication token');
  console.log('='.repeat(80));
  
  try {
    const result = await makeRequest(config, 'invalid_token_12345');
    
    console.log('Status Code:', result.statusCode);
    console.log('Duration:', result.duration, 'ms');
    console.log('Response:', JSON.stringify(result.data, null, 2));
    
    if (result.statusCode === 401) {
      console.log('✓ Correctly returned 401 Unauthorized');
    } else if (result.statusCode === 408 || result.statusCode === 504) {
      console.log('✗ Request timed out - this indicates middleware hanging');
    } else {
      console.log('✗ Unexpected status code:', result.statusCode);
    }
  } catch (error) {
    console.error('✗ Request failed:', error.message);
  }
}

async function testValidAuthentication(token) {
  console.log('\n' + '='.repeat(80));
  console.log('TEST 3: Request WITH VALID authentication token');
  console.log('='.repeat(80));
  
  if (!token) {
    console.log('⚠ No token provided, skipping this test');
    console.log('To test with valid token, pass it as argument:');
    console.log('  node backend/test-auth-flow.js <valid_jwt_token>');
    return;
  }
  
  try {
    const result = await makeRequest(config, token);
    
    console.log('Status Code:', result.statusCode);
    console.log('Duration:', result.duration, 'ms');
    
    if (result.statusCode === 200) {
      console.log('✓ Successfully authenticated and retrieved data');
      console.log('Methods count:', result.data.data?.length || 0);
      console.log('Response preview:', JSON.stringify(result.data, null, 2).substring(0, 500) + '...');
    } else if (result.statusCode === 401) {
      console.log('✗ Token rejected (401 Unauthorized)');
      console.log('Response:', JSON.stringify(result.data, null, 2));
    } else if (result.statusCode === 403) {
      console.log('✗ User authenticated but lacks permissions (403 Forbidden)');
      console.log('Response:', JSON.stringify(result.data, null, 2));
    } else if (result.statusCode === 408 || result.statusCode === 504) {
      console.log('✗ Request timed out - this indicates middleware hanging');
    } else {
      console.log('✗ Unexpected status code:', result.statusCode);
      console.log('Response:', JSON.stringify(result.data, null, 2));
    }
  } catch (error) {
    console.error('✗ Request failed:', error.message);
  }
}

async function testHealthEndpoint() {
  console.log('\n' + '='.repeat(80));
  console.log('TEST 0: Health endpoint check (no auth required)');
  console.log('='.repeat(80));
  
  try {
    const result = await makeRequest({
      host: config.host,
      port: config.port,
      path: '/api/v1/health',
      method: 'GET'
    });
    
    console.log('Status Code:', result.statusCode);
    console.log('Duration:', result.duration, 'ms');
    
    if (result.statusCode === 200) {
      console.log('✓ Backend server is healthy and responding');
    } else {
      console.log('✗ Backend server returned unexpected status:', result.statusCode);
    }
  } catch (error) {
    console.error('✗ Health check failed:', error.message);
  }
}

// Main test runner
async function runTests() {
  console.log('\n' + '='.repeat(80));
  console.log('AUTHENTICATION FLOW DIAGNOSTIC TEST');
  console.log('Testing: GET /api/v1/admin/local-payment/methods');
  console.log('='.repeat(80));
  
  // Test 0: Health check
  await testHealthEndpoint();
  
  // Test 1: No authentication
  await testNoAuthentication();
  
  // Test 2: Invalid authentication
  await testInvalidAuthentication();
  
  // Test 3: Valid authentication (if token provided)
  const token = process.argv[2];
  await testValidAuthentication(token);
  
  console.log('\n' + '='.repeat(80));
  console.log('TESTS COMPLETED');
  console.log('='.repeat(80));
  console.log('\nDIAGNOSTIC SUMMARY:');
  console.log('1. If Test 1 times out → Authentication middleware is hanging');
  console.log('2. If Test 2 times out → Token verification is hanging');
  console.log('3. If Test 3 times out → RBAC role fetching or Redis is hanging');
  console.log('4. Check backend logs for detailed error messages');
  console.log('='.repeat(80) + '\n');
}

// Run tests
runTests().catch(error => {
  console.error('Test suite failed:', error);
  process.exit(1);
});
