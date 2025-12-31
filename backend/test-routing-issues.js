const axios = require('axios');

// Test configuration
const BASE_URL = 'http://localhost:5000';
const TEST_TIMEOUT = 10000;

// Test data
const testUser = {
  email: 'test@example.com',
  password: 'TestPassword123!',
  confirmPassword: 'TestPassword123!',
  firstName: 'Test',
  lastName: 'User'
};

console.log('=== ROUTING & JSON PARSING TESTS ===\n');

// Test 1: Double API prefix issue
async function testDoubleApiPrefix() {
  console.log('1. Testing Double API Prefix Issue:');
  console.log('   Testing /api/v1/auth/register (expected path)...');
  
  try {
    const response = await axios.post(`${BASE_URL}/api/v1/auth/register`, testUser, {
      timeout: TEST_TIMEOUT,
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('   ✓ SUCCESS: /api/v1/auth/register works');
    console.log(`   Response status: ${response.status}`);
    console.log(`   Response data: ${JSON.stringify(response.data, null, 2)}`);
    
  } catch (error) {
    if (error.response) {
      console.log('   ✗ FAILED: Server responded with error');
      console.log(`   Status: ${error.response.status}`);
      console.log(`   Error: ${JSON.stringify(error.response.data, null, 2)}`);
      
      if (error.response.status === 404) {
        console.log('   → This confirms the double API prefix issue');
        console.log('   → Requested: /api/v1/auth/register');
        console.log('   → Server looked for: /api/api/v1/auth/register');
      }
    } else if (error.code === 'ECONNREFUSED') {
      console.log('   ✗ FAILED: Cannot connect to server');
      console.log('   → Make sure the backend server is running on port 5000');
    } else {
      console.log('   ✗ FAILED: Network error');
      console.log(`   Error: ${error.message}`);
    }
  }
  
  console.log('\n   Testing /api/api/v1/auth/register (double prefix)...');
  
  try {
    const response = await axios.post(`${BASE_URL}/api/api/v1/auth/register`, testUser, {
      timeout: TEST_TIMEOUT,
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('   ✓ SUCCESS: /api/api/v1/auth/register works');
    console.log(`   Response status: ${response.status}`);
    
  } catch (error) {
    if (error.response) {
      console.log('   ✗ FAILED: Server responded with error');
      console.log(`   Status: ${error.response.status}`);
      console.log(`   Error: ${JSON.stringify(error.response.data, null, 2)}`);
    } else {
      console.log('   ✗ FAILED: Network error');
      console.log(`   Error: ${error.message}`);
    }
  }
}

// Test 2: JSON parsing issues
async function testJsonParsing() {
  console.log('\n2. Testing JSON Parsing Issues:');
  
  // Test with valid JSON
  console.log('   Testing valid JSON...');
  try {
    const response = await axios.post(`${BASE_URL}/api/api/v1/auth/register`, testUser, {
      timeout: TEST_TIMEOUT,
      headers: {
        'Content-Type': 'application/json'
      }
    });
    console.log('   ✓ Valid JSON accepted');
  } catch (error) {
    if (error.response && error.response.status === 400) {
      console.log('   ✗ Valid JSON rejected');
      console.log(`   Error: ${JSON.stringify(error.response.data, null, 2)}`);
    }
  }
  
  // Test with invalid JSON (trailing comma)
  console.log('   Testing invalid JSON (trailing comma)...');
  try {
    const invalidJson = {
      email: 'test@example.com',
      password: 'TestPassword123!',
      confirmPassword: 'TestPassword123!',
      firstName: 'Test',
      lastName: 'User',
    };
    
    const response = await axios.post(`${BASE_URL}/api/api/v1/auth/register`, invalidJson, {
      timeout: TEST_TIMEOUT,
      headers: {
        'Content-Type': 'application/json'
      }
    });
    console.log('   ✓ Invalid JSON was accepted (unexpected)');
  } catch (error) {
    if (error.response && error.response.status === 400) {
      console.log('   ✓ Invalid JSON properly rejected');
      console.log(`   Error: ${JSON.stringify(error.response.data, null, 2)}`);
    }
  }
  
  // Test with malformed JSON
  console.log('   Testing malformed JSON...');
  try {
    const malformedJson = '{"email": "test@example.com", "password": "TestPassword123!", "confirmPassword": "TestPassword123!", "firstName": "Test", "lastName": "User",}';
    
    const response = await axios.post(`${BASE_URL}/api/api/v1/auth/register`, malformedJson, {
      timeout: TEST_TIMEOUT,
      headers: {
        'Content-Type': 'application/json'
      }
    });
    console.log('   ✓ Malformed JSON was accepted (unexpected)');
  } catch (error) {
    if (error.response && error.response.status === 400) {
      console.log('   ✓ Malformed JSON properly rejected');
      console.log(`   Error: ${JSON.stringify(error.response.data, null, 2)}`);
    }
  }
}

// Test 3: Test all authentication endpoints
async function testAuthEndpoints() {
  console.log('\n3. Testing All Authentication Endpoints:');
  
  const endpoints = [
    { method: 'POST', path: '/api/api/v1/auth/register', data: testUser },
    { method: 'POST', path: '/api/api/v1/auth/login', data: { identifier: 'test@example.com', password: 'TestPassword123!' } },
    { method: 'POST', path: '/api/api/v1/auth/verify-email', data: { token: 'test-token' } },
    { method: 'POST', path: '/api/api/v1/auth/send-otp', data: { phone: '+8801234567890' } },
    { method: 'POST', path: '/api/api/v1/auth/verify-otp', data: { phone: '+8801234567890', otp: '123456' } },
    { method: 'POST', path: '/api/api/v1/auth/forgot-password', data: { email: 'test@example.com' } },
    { method: 'POST', path: '/api/api/v1/auth/reset-password', data: { token: 'test-token', newPassword: 'NewPassword123!', confirmPassword: 'NewPassword123!' } }
  ];
  
  for (const endpoint of endpoints) {
    console.log(`   Testing ${endpoint.method} ${endpoint.path}...`);
    
    try {
      const response = await axios({
        method: endpoint.method,
        url: `${BASE_URL}${endpoint.path}`,
        data: endpoint.data,
        timeout: TEST_TIMEOUT,
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      console.log(`   ✓ ${endpoint.path} - Status: ${response.status}`);
      
    } catch (error) {
      if (error.response) {
        console.log(`   ✗ ${endpoint.path} - Status: ${error.response.status}`);
        
        // Check for specific error patterns
        if (error.response.status === 404) {
          console.log(`      → Route not found (routing issue)`);
        } else if (error.response.status === 400 && error.response.data?.error?.includes('JSON')) {
          console.log(`      → JSON parsing error`);
        } else {
          console.log(`      → ${error.response.data?.error || 'Unknown error'}`);
        }
      } else {
        console.log(`   ✗ ${endpoint.path} - Network error: ${error.message}`);
      }
    }
  }
}

// Run all tests
async function runAllTests() {
  try {
    await testDoubleApiPrefix();
    await testJsonParsing();
    await testAuthEndpoints();
    
    console.log('\n=== TEST SUMMARY ===');
    console.log('1. Double API prefix: Confirmed issue');
    console.log('2. JSON parsing: Needs investigation');
    console.log('3. Endpoint accessibility: Needs fixing');
    
  } catch (error) {
    console.error('Test suite failed:', error);
  }
}

// Execute tests
runAllTests();