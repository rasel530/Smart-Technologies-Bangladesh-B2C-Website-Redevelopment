/**
 * Comprehensive Account Deletion Test Script
 * 
 * This script tests account deletion request endpoint to verify
 * that 500 Internal Server Error has been resolved.
 * 
 * Tests:
 * 1. Login to get authentication token
 * 2. Test account deletion request with valid token
 * 3. Test rate limiting functionality
 * 4. Test edge cases (invalid confirmation, no auth, expired token)
 * 5. Verify database operations
 */

const http = require('http');

// Configuration
const BASE_URL = 'localhost:3001';
const TEST_USER = {
  email: 'raselbepari88@gmail.com',
  password: 'TestPassword123!'
};

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

// Test results tracking
const testResults = {
  total: 0,
  passed: 0,
  failed: 0,
  tests: []
};

/**
 * Helper function to make HTTP requests
 */
function makeRequest(method, path, data = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, `http://${BASE_URL}`);
    
    const options = {
      hostname: url.hostname,
      port: url.port || 3001,
      path: url.pathname + url.search,
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
        } catch (e) {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: body
          });
        }
      });
    });

    req.on('error', reject);

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

/**
 * Helper function to log test results
 */
function logTest(testName, passed, message, details = null) {
  testResults.total++;
  if (passed) {
    testResults.passed++;
    console.log(`${colors.green}✓ PASS${colors.reset} - ${testName}`);
  } else {
    testResults.failed++;
    console.log(`${colors.red}✗ FAIL${colors.reset} - ${testName}`);
    console.log(`  ${colors.yellow}Message:${colors.reset} ${message}`);
    if (details) {
      console.log(`  ${colors.cyan}Details:${colors.reset}`, JSON.stringify(details, null, 2));
    }
  }
  
  testResults.tests.push({
    name: testName,
    passed,
    message,
    details
  });
}

/**
 * Helper function to log section headers
 */
function logSection(title) {
  console.log(`\n${colors.bright}${colors.blue}═══ ${title} ═══${colors.reset}\n`);
}

/**
 * Test 1: Login to get authentication token
 */
async function testLogin() {
  logSection('TEST 1: Login to Get Authentication Token');
  
  try {
    const response = await makeRequest('POST', '/api/v1/auth/login', {
      identifier: TEST_USER.email,
      password: TEST_USER.password
    });

    if (response.statusCode === 200 && response.body && response.body.token) {
      logTest('Login successful', true, 'User logged in and received token');
      return response.body.token;
    } else if (response.statusCode === 401) {
      logTest('Login failed - invalid credentials', false, 'Test user credentials are invalid');
      return null;
    } else {
      logTest('Login failed', false, `Unexpected status code: ${response.statusCode}`, response.body);
      return null;
    }
  } catch (error) {
    logTest('Login failed with error', false, error.message);
    return null;
  }
}

/**
 * Test 2: Account Deletion Request with Valid Token
 */
async function testAccountDeletionRequest(token) {
  logSection('TEST 2: Account Deletion Request with Valid Token');
  
  if (!token) {
    logTest('Skipped - No token available', false, 'Cannot test without authentication token');
    return null;
  }

  try {
    const response = await makeRequest(
      'POST',
      '/api/v1/profile/account/deletion/request',
      { confirmation: 'DELETE', reason: 'Testing account deletion' },
      { 'Authorization': `Bearer ${token}` }
    );

    // Check if we got a 500 error (the original issue)
    if (response.statusCode === 500) {
      logTest(
        'Account deletion request',
        false,
        'Received 500 Internal Server Error - Original issue NOT fixed',
        response.body
      );
      return null;
    }

    // Check for successful response
    if (response.statusCode === 200 && response.body && response.body.success) {
      logTest(
        'Account deletion request',
        true,
        'Successfully submitted deletion request',
        {
          deletionToken: response.body.data?.deletionToken,
          expiresAt: response.body.data?.expiresAt,
          scheduledDeletionDate: response.body.data?.scheduledDeletionDate
        }
      );
      return response.body.data;
    }

    // Check for rate limit (429)
    if (response.statusCode === 429) {
      logTest(
        'Account deletion request - Rate limited',
        true,
        'Rate limiting is working correctly',
        response.body
      );
      return null;
    }

    // Check for validation error (400)
    if (response.statusCode === 400) {
      logTest(
        'Account deletion request - Validation error',
        false,
        'Received validation error',
        response.body
      );
      return null;
    }

    // Unexpected status code
    logTest(
      'Account deletion request',
      false,
      `Unexpected status code: ${response.statusCode}`,
      response.body
    );
    return null;

  } catch (error) {
    logTest('Account deletion request failed with error', false, error.message);
    return null;
  }
}

/**
 * Test 3: Rate Limiting Functionality
 */
async function testRateLimiting(token) {
  logSection('TEST 3: Rate Limiting Functionality');
  
  if (!token) {
    logTest('Skipped - No token available', false, 'Cannot test without authentication token');
    return;
  }

  try {
    // First request should succeed
    console.log('Making first request...');
    const firstResponse = await makeRequest(
      'POST',
      '/api/v1/profile/account/deletion/request',
      { confirmation: 'DELETE', reason: 'First request' },
      { 'Authorization': `Bearer ${token}` }
    );

    if (firstResponse.statusCode === 200) {
      logTest('First request - Success', true, 'First request succeeded');
    } else if (firstResponse.statusCode === 429) {
      logTest('First request - Rate limited', false, 'First request was rate limited unexpectedly');
    } else {
      logTest('First request', false, `Unexpected status: ${firstResponse.statusCode}`, firstResponse.body);
    }

    // Wait a moment
    await new Promise(resolve => setTimeout(resolve, 100));

    // Second request should be rate limited
    console.log('Making second request (should be rate limited)...');
    const secondResponse = await makeRequest(
      'POST',
      '/api/v1/profile/account/deletion/request',
      { confirmation: 'DELETE', reason: 'Second request' },
      { 'Authorization': `Bearer ${token}` }
    );

    if (secondResponse.statusCode === 429) {
      logTest(
        'Second request - Rate limited',
        true,
        'Rate limiting is working correctly',
        {
          error: secondResponse.body.error,
          message: secondResponse.body.message,
          messageBn: secondResponse.body.messageBn
        }
      );
    } else if (secondResponse.statusCode === 200) {
      logTest('Second request - Not rate limited', false, 'Rate limiting is not working');
    } else {
      logTest('Second request', false, `Unexpected status: ${secondResponse.statusCode}`, secondResponse.body);
    }

  } catch (error) {
    logTest('Rate limiting test failed with error', false, error.message);
  }
}

/**
 * Test 4: Edge Cases
 */
async function testEdgeCases(token) {
  logSection('TEST 4: Edge Cases');

  // Test 4.1: Invalid confirmation value
  console.log('Testing invalid confirmation value...');
  try {
    const response = await makeRequest(
      'POST',
      '/api/v1/profile/account/deletion/request',
      { confirmation: 'INVALID', reason: 'Testing invalid confirmation' },
      token ? { 'Authorization': `Bearer ${token}` } : {}
    );

    if (response.statusCode === 400) {
      logTest(
        'Invalid confirmation value',
        true,
        'Correctly rejected invalid confirmation',
        response.body
      );
    } else if (response.statusCode === 500) {
      logTest(
        'Invalid confirmation value',
        false,
        'Received 500 error - Should return 400 for validation error',
        response.body
      );
    } else {
      logTest(
        'Invalid confirmation value',
        false,
        `Unexpected status code: ${response.statusCode}`,
        response.body
      );
    }
  } catch (error) {
    logTest('Invalid confirmation value test failed', false, error.message);
  }

  // Test 4.2: No authentication token
  console.log('Testing without authentication token...');
  try {
    const response = await makeRequest(
      'POST',
      '/api/v1/profile/account/deletion/request',
      { confirmation: 'DELETE', reason: 'Testing no auth' }
    );

    if (response.statusCode === 401) {
      logTest(
        'No authentication token',
        true,
        'Correctly rejected unauthenticated request',
        response.body
      );
    } else if (response.statusCode === 500) {
      logTest(
        'No authentication token',
        false,
        'Received 500 error - Should return 401 for unauthenticated request',
        response.body
      );
    } else {
      logTest(
        'No authentication token',
        false,
        `Unexpected status code: ${response.statusCode}`,
        response.body
      );
    }
  } catch (error) {
    logTest('No authentication token test failed', false, error.message);
  }

  // Test 4.3: Invalid token
  console.log('Testing with invalid token...');
  try {
    const response = await makeRequest(
      'POST',
      '/api/v1/profile/account/deletion/request',
      { confirmation: 'DELETE', reason: 'Testing invalid token' },
      { 'Authorization': 'Bearer invalid_token_12345' }
    );

    if (response.statusCode === 401) {
      logTest(
        'Invalid token',
        true,
        'Correctly rejected invalid token',
        response.body
      );
    } else if (response.statusCode === 500) {
      logTest(
        'Invalid token',
        false,
        'Received 500 error - Should return 401 for invalid token',
        response.body
      );
    } else {
      logTest(
        'Invalid token',
        false,
        `Unexpected status code: ${response.statusCode}`,
        response.body
      );
    }
  } catch (error) {
    logTest('Invalid token test failed', false, error.message);
  }
}

/**
 * Test 5: Get Deletion Status
 */
async function testGetDeletionStatus(token) {
  logSection('TEST 5: Get Deletion Status');
  
  if (!token) {
    logTest('Skipped - No token available', false, 'Cannot test without authentication token');
    return;
  }

  try {
    const response = await makeRequest(
      'GET',
      '/api/v1/profile/account/deletion/status',
      null,
      { 'Authorization': `Bearer ${token}` }
    );

    if (response.statusCode === 200 && response.body && response.body.success) {
      logTest(
        'Get deletion status',
        true,
        'Successfully retrieved deletion status',
        response.body.data
      );
    } else if (response.statusCode === 500) {
      logTest(
        'Get deletion status',
        false,
        'Received 500 Internal Server Error',
        response.body
      );
    } else {
      logTest(
        'Get deletion status',
        false,
        `Unexpected status code: ${response.statusCode}`,
        response.body
      );
    }
  } catch (error) {
    logTest('Get deletion status failed with error', false, error.message);
  }
}

/**
 * Main test execution
 */
async function runTests() {
  console.log(`\n${colors.bright}${colors.cyan}╔════════════════════════════════════════════════════════════╗${colors.reset}`);
  console.log(`${colors.bright}${colors.cyan}║   ACCOUNT DELETION FUNCTIONALITY COMPREHENSIVE TEST    ║${colors.reset}`);
  console.log(`${colors.bright}${colors.cyan}╚════════════════════════════════════════════════════════════╝${colors.reset}\n`);
  
  console.log(`${colors.cyan}Testing endpoint:${colors.reset} http://${BASE_URL}/api/v1/profile/account/deletion/request`);
  console.log(`${colors.cyan}Test user:${colors.reset} ${TEST_USER.email}\n`);

  // Test 1: Login
  const token = await testLogin();

  // Test 2: Account deletion request
  const deletionData = await testAccountDeletionRequest(token);

  // Test 3: Rate limiting
  await testRateLimiting(token);

  // Test 4: Edge cases
  await testEdgeCases(token);

  // Test 5: Get deletion status
  await testGetDeletionStatus(token);

  // Print summary
  logSection('TEST SUMMARY');
  
  console.log(`Total Tests: ${testResults.total}`);
  console.log(`${colors.green}Passed: ${testResults.passed}${colors.reset}`);
  console.log(`${colors.red}Failed: ${testResults.failed}${colors.reset}`);
  
  const passRate = ((testResults.passed / testResults.total) * 100).toFixed(2);
  console.log(`\nPass Rate: ${passRate}%`);

  // Check if main issue (500 error) is resolved
  const has500Error = testResults.tests.some(
    test => test.name.includes('Account deletion request') && 
           !test.passed && 
           test.message.includes('500 Internal Server Error')
  );

  console.log(`\n${colors.bright}═══ VERIFICATION RESULT ═══${colors.reset}`);
  
  if (has500Error) {
    console.log(`${colors.red}✗ FAIL${colors.reset} - The 500 Internal Server Error is ${colors.red}NOT${colors.reset} resolved`);
    console.log(`${colors.red}The account deletion endpoint is still returning 500 errors${colors.reset}`);
  } else {
    console.log(`${colors.green}✓ PASS${colors.reset} - The 500 Internal Server Error is ${colors.green}RESOLVED${colors.reset}`);
    console.log(`${colors.green}The account deletion endpoint is working correctly${colors.reset}`);
  }

  console.log(`\n${colors.bright}═══ DETAILED TEST RESULTS ═══${colors.reset}\n`);
  
  testResults.tests.forEach((test, index) => {
    const status = test.passed ? `${colors.green}✓ PASS${colors.reset}` : `${colors.red}✗ FAIL${colors.reset}`;
    console.log(`${index + 1}. ${status} - ${test.name}`);
    if (!test.passed) {
      console.log(`   ${colors.yellow}Message:${colors.reset} ${test.message}`);
    }
  });

  console.log(`\n${colors.bright}═══ END OF TEST ═══${colors.reset}\n`);

  // Exit with appropriate code
  process.exit(testResults.failed > 0 ? 1 : 0);
}

// Run tests
runTests().catch(error => {
  console.error(`${colors.red}Fatal error running tests:${colors.reset}`, error);
  process.exit(1);
});
