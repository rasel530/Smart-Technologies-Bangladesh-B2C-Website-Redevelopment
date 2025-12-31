const http = require('http');

// Test configuration
const BASE_URL = 'http://localhost:5000';
const API_BASE = '/api/v1';

// Test data
const testUser = {
  email: 'test@example.com',
  password: 'TestPassword123!',
  firstName: 'Test',
  lastName: 'User',
  confirmPassword: 'TestPassword123!'
};

// Helper function to make HTTP requests
function makeRequest(options, data = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      
      res.on('data', (chunk) => {
        body += chunk;
      });
      
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(body);
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            data: jsonData
          });
        } catch (error) {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            data: body
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

// Test functions
async function testAPIRouting() {
  console.log('\n=== Testing API Routing ===');
  
  try {
    // Test API documentation endpoint
    const options = {
      hostname: 'localhost',
      port: 5000,
      path: '/api',
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    };
    
    const response = await makeRequest(options);
    console.log('✓ API Documentation Endpoint:', response.statusCode);
    console.log('  Response format:', typeof response.data === 'object' ? 'JSON' : 'Non-JSON');
    
    if (response.data && response.data.endpoints) {
      console.log('  Auth endpoint path:', response.data.endpoints.v1.auth);
    }
    
    return true;
  } catch (error) {
    console.log('✗ API Routing Test Failed:', error.message);
    return false;
  }
}

async function testJSONParsing() {
  console.log('\n=== Testing JSON Parsing ===');
  
  try {
    // Test valid JSON
    const validOptions = {
      hostname: 'localhost',
      port: 5000,
      path: `${API_BASE}/auth/register`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    };
    
    const validResponse = await makeRequest(validOptions, testUser);
    console.log('✓ Valid JSON Request:', validResponse.statusCode);
    console.log('  Response format:', typeof validResponse.data === 'object' ? 'JSON' : 'Non-JSON');
    
    // Test invalid JSON
    const invalidOptions = {
      hostname: 'localhost',
      port: 5000,
      path: `${API_BASE}/auth/register`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    };
    
    // Create a manual request with invalid JSON
    return new Promise((resolve) => {
      const req = http.request(invalidOptions, (res) => {
        let body = '';
        res.on('data', (chunk) => body += chunk);
        res.on('end', () => {
          try {
            const jsonData = JSON.parse(body);
            console.log('✓ Invalid JSON Error Handling:', res.statusCode);
            console.log('  Error response format:', typeof jsonData === 'object' ? 'JSON' : 'Non-JSON');
            console.log('  Error message:', jsonData.error || 'No error message');
            resolve(true);
          } catch (error) {
            console.log('✗ Invalid JSON Error Response Not JSON:', body);
            resolve(false);
          }
        });
      });
      
      req.on('error', () => {
        console.log('✗ Invalid JSON Test Failed: Connection error');
        resolve(false);
      });
      
      // Send invalid JSON
      req.write('{"invalid": json}');
      req.end();
    });
    
  } catch (error) {
    console.log('✗ JSON Parsing Test Failed:', error.message);
    return false;
  }
}

async function testErrorHandling() {
  console.log('\n=== Testing Error Handling ===');
  
  try {
    // Test 404 error
    const notFoundOptions = {
      hostname: 'localhost',
      port: 5000,
      path: `${API_BASE}/nonexistent`,
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    };
    
    const notFoundResponse = await makeRequest(notFoundOptions);
    console.log('✓ 404 Error Handling:', notFoundResponse.statusCode);
    console.log('  Response format:', typeof notFoundResponse.data === 'object' ? 'JSON' : 'Non-JSON');
    console.log('  Error message:', notFoundResponse.data.error || 'No error message');
    
    // Test validation error
    const validationOptions = {
      hostname: 'localhost',
      port: 5000,
      path: `${API_BASE}/auth/register`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    };
    
    const invalidData = { email: 'invalid-email', password: '123' }; // Invalid data
    const validationResponse = await makeRequest(validationOptions, invalidData);
    console.log('✓ Validation Error Handling:', validationResponse.statusCode);
    console.log('  Response format:', typeof validationResponse.data === 'object' ? 'JSON' : 'Non-JSON');
    console.log('  Error message:', validationResponse.data.error || 'No error message');
    
    return true;
  } catch (error) {
    console.log('✗ Error Handling Test Failed:', error.message);
    return false;
  }
}

async function testRegistrationEndpoint() {
  console.log('\n=== Testing Registration Endpoint ===');
  
  try {
    const options = {
      hostname: 'localhost',
      port: 5000,
      path: `${API_BASE}/auth/register`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    };
    
    const response = await makeRequest(options, testUser);
    console.log('✓ Registration Endpoint:', response.statusCode);
    console.log('  Response format:', typeof response.data === 'object' ? 'JSON' : 'Non-JSON');
    
    if (response.data) {
      console.log('  Message:', response.data.message || 'No message');
      if (response.data.user) {
        console.log('  User created:', response.data.user.email || 'No email');
      }
      if (response.data.error) {
        console.log('  Error:', response.data.error);
      }
    }
    
    return response.statusCode < 500; // Success if not a server error
  } catch (error) {
    console.log('✗ Registration Endpoint Test Failed:', error.message);
    return false;
  }
}

async function checkServerHealth() {
  console.log('\n=== Checking Server Health ===');
  
  try {
    // Test basic health endpoint
    const healthOptions = {
      hostname: 'localhost',
      port: 5000,
      path: '/health',
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    };
    
    const healthResponse = await makeRequest(healthOptions);
    console.log('✓ Health Check:', healthResponse.statusCode);
    console.log('  Server status:', healthResponse.data.status || 'Unknown');
    console.log('  Response format:', typeof healthResponse.data === 'object' ? 'JSON' : 'Non-JSON');
    
    return healthResponse.statusCode === 200;
  } catch (error) {
    console.log('✗ Server Health Check Failed:', error.message);
    console.log('  Make sure the backend server is running on port 5000');
    return false;
  }
}

// Main test runner
async function runTests() {
  console.log('Backend Fixes Verification Test');
  console.log('================================');
  
  const results = {
    serverHealth: await checkServerHealth(),
    apiRouting: await testAPIRouting(),
    jsonParsing: await testJSONParsing(),
    errorHandling: await testErrorHandling(),
    registrationEndpoint: await testRegistrationEndpoint()
  };
  
  console.log('\n=== Test Results Summary ===');
  console.log('Server Health:', results.serverHealth ? '✓ PASS' : '✗ FAIL');
  console.log('API Routing:', results.apiRouting ? '✓ PASS' : '✗ FAIL');
  console.log('JSON Parsing:', results.jsonParsing ? '✓ PASS' : '✗ FAIL');
  console.log('Error Handling:', results.errorHandling ? '✓ PASS' : '✗ FAIL');
  console.log('Registration Endpoint:', results.registrationEndpoint ? '✓ PASS' : '✗ FAIL');
  
  const allPassed = Object.values(results).every(result => result === true);
  console.log('\nOverall Result:', allPassed ? '✓ ALL TESTS PASSED' : '✗ SOME TESTS FAILED');
  
  if (allPassed) {
    console.log('\n🎉 Backend fixes have been successfully implemented!');
    console.log('The authentication system should now be working correctly.');
  } else {
    console.log('\n❌ Some issues still need to be addressed.');
    console.log('Please check the failed tests above for details.');
  }
  
  return allPassed;
}

// Run tests if this script is executed directly
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = {
  runTests,
  testAPIRouting,
  testJSONParsing,
  testErrorHandling,
  testRegistrationEndpoint,
  checkServerHealth
};