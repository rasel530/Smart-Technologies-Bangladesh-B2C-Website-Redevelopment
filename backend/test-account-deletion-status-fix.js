const axios = require('axios');

const API_BASE_URL = 'http://localhost:3001/api/v1';

// Test user credentials
const TEST_USER = {
  email: 'raselbepari88@gmail.com',
  password: '54Vfo^71~_oQ' // Correct password from user
};

// Color codes for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
  console.log('\n' + '='.repeat(60));
  log(title, 'cyan');
  console.log('='.repeat(60) + '\n');
}

function logTest(testName, passed, details = '') {
  const status = passed ? '✓ PASS' : '✗ FAIL';
  const color = passed ? 'green' : 'red';
  log(`${status}: ${testName}`, color);
  if (details) {
    console.log(`  ${details}`);
  }
  console.log('');
}

async function testAccountDeletionStatus() {
  logSection('Testing Account Deletion Status Endpoint Fix');
  
  const testResults = {
    login: false,
    authenticatedRequest: false,
    responseStructure: false,
    unauthenticatedRequest: false,
    no500Error: false
  };
  
  let token = null;
  let statusResponse = null;
  
  try {
    // Test 1: Login with existing user
    log('Test 1: Login to get authentication token...', 'blue');
    
    try {
      const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
        identifier: TEST_USER.email,
        password: TEST_USER.password
      }, {
        timeout: 10000
      });
      
      // Handle different response structures
      if (loginResponse.data.token) {
        // Response has token at root level
        token = loginResponse.data.token;
        logTest('Login successful', true, `Token obtained: ${token.substring(0, 20)}...`);
        testResults.login = true;
      } else if (loginResponse.data.success && loginResponse.data.data && loginResponse.data.data.token) {
        // Response has token nested under data
        token = loginResponse.data.data.token;
        logTest('Login successful', true, `Token obtained: ${token.substring(0, 20)}...`);
        testResults.login = true;
      } else {
        logTest('Login failed - invalid response structure', false, JSON.stringify(loginResponse.data));
      }
    } catch (error) {
      if (error.response) {
        logTest('Login failed', false, `Status: ${error.response.status}, Error: ${JSON.stringify(error.response.data)}`);
      } else {
        logTest('Login failed', false, `Error: ${error.message}`);
      }
      
      // If login fails, try to create a test user
      log('Attempting to create a test user...', 'yellow');
      try {
        const registerResponse = await axios.post(`${API_BASE_URL}/auth/register`, {
          email: 'testuser@smarttech.com',
          password: 'Test@123456',
          phone: '+8801700000001',
          firstName: 'Test',
          lastName: 'User'
        }, {
          timeout: 10000
        });
        
        if (registerResponse.data.success) {
          logTest('Test user created successfully', true);
          
          // Now login with the test user
          const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
            identifier: 'testuser@smarttech.com',
            password: 'Test@123456'
          }, {
            timeout: 10000
          });
          
          // Handle different response structures
          if (loginResponse.data.token) {
            token = loginResponse.data.token;
            logTest('Login with test user successful', true, `Token obtained: ${token.substring(0, 20)}...`);
            testResults.login = true;
          } else if (loginResponse.data.success && loginResponse.data.data && loginResponse.data.data.token) {
            token = loginResponse.data.data.token;
            logTest('Login with test user successful', true, `Token obtained: ${token.substring(0, 20)}...`);
            testResults.login = true;
          }
        }
      } catch (registerError) {
        logTest('Failed to create test user', false, registerError.message);
        log('Continuing with existing tests...', 'yellow');
      }
    }
    
    if (!token) {
      log('Cannot proceed without authentication token. Please check user credentials.', 'red');
      return testResults;
    }
    
    // Test 2: Call account deletion status endpoint with authentication
    logSection('Test 2: Calling Account Deletion Status Endpoint');
    log('Request: GET /api/v1/profile/account/deletion/status', 'blue');
    log('Headers: Authorization: Bearer <token>', 'blue');
    
    try {
      statusResponse = await axios.get(`${API_BASE_URL}/profile/account/deletion/status`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        timeout: 10000
      });
      
      logTest('Request completed successfully', true, `Status: ${statusResponse.status}`);
      testResults.authenticatedRequest = true;
      
      // Check for 500 error
      if (statusResponse.status === 500) {
        logTest('CRITICAL: 500 Internal Server Error still present!', false);
        testResults.no500Error = false;
      } else {
        logTest('No 500 error', true, `Status: ${statusResponse.status}`);
        testResults.no500Error = true;
      }
      
      // Verify response structure
      log('\nResponse Data:', 'blue');
      console.log(JSON.stringify(statusResponse.data, null, 2));
      console.log('');
      
      if (statusResponse.data.success && typeof statusResponse.data.data === 'object') {
        logTest('Response structure is correct', true, 'Has success: true and data object');
        testResults.responseStructure = true;
      } else {
        logTest('Response structure is incorrect', false, 'Expected success: true and data object');
      }
      
    } catch (error) {
      if (error.response) {
        logTest('Request failed', false, `Status: ${error.response.status}`);
        
        if (error.response.status === 500) {
          logTest('CRITICAL: 500 Internal Server Error still present!', false);
          testResults.no500Error = false;
          log('\nError Response Data:', 'red');
          console.log(JSON.stringify(error.response.data, null, 2));
        } else {
          logTest('Unexpected error status', false, `Expected 200, got ${error.response.status}`);
        }
      } else {
        logTest('Request failed', false, `Error: ${error.message}`);
      }
    }
    
    // Test 3: Call without authentication
    logSection('Test 3: Testing Without Authentication');
    log('Request: GET /api/v1/profile/account/deletion/status', 'blue');
    log('Headers: No Authorization header', 'blue');
    
    try {
      await axios.get(`${API_BASE_URL}/profile/account/deletion/status`, {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 10000
      });
      logTest('Should have returned 401 Unauthorized', false, 'Request succeeded when it should have failed');
    } catch (error) {
      if (error.response && error.response.status === 401) {
        logTest('Correctly returned 401 Unauthorized', true, 'Authentication is working properly');
        testResults.unauthenticatedRequest = true;
      } else if (error.response) {
        logTest('Unexpected error status', false, `Expected 401, got ${error.response.status}`);
      } else {
        logTest('Request failed', false, `Error: ${error.message}`);
      }
    }
    
  } catch (error) {
    log('\nUnexpected error during testing:', 'red');
    console.error(error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', JSON.stringify(error.response.data, null, 2));
    }
  }
  
  // Summary
  logSection('Test Summary');
  
  const totalTests = Object.keys(testResults).length;
  const passedTests = Object.values(testResults).filter(v => v).length;
  
  console.log(`Total Tests: ${totalTests}`);
  console.log(`Passed: ${passedTests}`);
  console.log(`Failed: ${totalTests - passedTests}\n`);
  
  log('Individual Test Results:', 'blue');
  logTest('Login', testResults.login);
  logTest('Authenticated Request', testResults.authenticatedRequest);
  logTest('No 500 Error', testResults.no500Error);
  logTest('Response Structure', testResults.responseStructure);
  logTest('Unauthenticated Request', testResults.unauthenticatedRequest);
  
  logSection('Overall Result');
  
  if (testResults.no500Error && testResults.authenticatedRequest && testResults.responseStructure) {
    log('✓✓✓ FIX SUCCESSFUL! The 500 error has been resolved. ✓✓✓', 'green');
    log('\nThe account deletion status endpoint is now working correctly.', 'green');
  } else {
    log('✗✗✗ FIX INCOMPLETE! Issues remain. ✗✗✗', 'red');
    
    if (!testResults.no500Error) {
      log('\n⚠ CRITICAL: The 500 Internal Server Error is still present!', 'red');
      log('Please check backend logs for detailed error information.', 'yellow');
    }
    if (!testResults.login) {
      log('\n⚠ Login failed - check user credentials or create a test user', 'yellow');
    }
  }
  
  console.log('\n' + '='.repeat(60) + '\n');
  
  return testResults;
}

// Run the tests
testAccountDeletionStatus()
  .then(results => {
    process.exit(results.no500Error && results.authenticatedRequest ? 0 : 1);
  })
  .catch(error => {
    console.error('Test execution failed:', error);
    process.exit(1);
  });
