/**
 * Cancel Button Verification Test
 * 
 * This test verifies that the Cancel button fix in the checkout sessions page is working correctly.
 * It tests the backend API endpoint for cancelling checkout sessions with timeout handling.
 */

const http = require('http');

// Test configuration
const BACKEND_URL = 'http://localhost:3001';
const ADMIN_EMAIL = 'admin@smarttech.com';
const ADMIN_PASSWORD = 'AdminPassword123';

// Color codes for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

// Test results tracking
const testResults = {
  passed: 0,
  failed: 0,
  total: 0
};

// Helper function to make HTTP requests
function makeRequest(options, data = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(options.path || '', BACKEND_URL);
    
    const requestOptions = {
      hostname: url.hostname,
      port: url.port || 3001,
      path: url.pathname + url.search,
      method: options.method || 'GET',
      headers: options.headers || {}
    };

    const req = http.request(requestOptions, (res) => {
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
            body: body
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
function logTest(name, passed, message, details = null) {
  testResults.total++;
  if (passed) {
    testResults.passed++;
    console.log(`${colors.green}✓ PASS${colors.reset} - ${name}`);
  } else {
    testResults.failed++;
    console.log(`${colors.red}✗ FAIL${colors.reset} - ${name}`);
  }
  if (message) {
    console.log(`  ${colors.cyan}${message}${colors.reset}`);
  }
  if (details) {
    console.log(`  ${colors.yellow}Details:${colors.reset}`, JSON.stringify(details, null, 2));
  }
  console.log('');
}

// Helper function to measure execution time
async function measureTime(fn) {
  const start = Date.now();
  try {
    const result = await fn();
    const elapsed = Date.now() - start;
    return { result, elapsed };
  } catch (error) {
    const elapsed = Date.now() - start;
    return { error, elapsed };
  }
}

// Test 1: Check Backend Server Health
async function testBackendHealth() {
  console.log(`${colors.blue}=== Test 1: Backend Server Health ===${colors.reset}\n`);
  
  try {
    const { result, elapsed } = await measureTime(async () => {
      return await makeRequest({
        method: 'GET',
        path: '/health',
        headers: {
          'Content-Type': 'application/json'
        }
      });
    });

    const isHealthy = result.statusCode === 200;
    logTest(
      'Backend server is accessible',
      isHealthy,
      isHealthy 
        ? `Server responded in ${elapsed}ms` 
        : `Server returned status ${result.statusCode}`,
      result
    );
    
    return isHealthy;
  } catch (error) {
    logTest(
      'Backend server is accessible',
      false,
      `Connection error: ${error.message}`,
      { error: error.message }
    );
    return false;
  }
}

// Test 2: Admin Login
async function testAdminLogin() {
  console.log(`${colors.blue}=== Test 2: Admin Login ===${colors.reset}\n`);
  
  try {
    const { result, elapsed } = await measureTime(async () => {
      return await makeRequest({
        method: 'POST',
        path: '/api/v1/auth/login',
        headers: {
          'Content-Type': 'application/json'
        }
      }, {
        identifier: ADMIN_EMAIL,
        password: ADMIN_PASSWORD
      });
    });

    const isLoggedIn = result.statusCode === 200 && result.body && result.body.token;
    logTest(
      'Admin login successful',
      isLoggedIn,
      isLoggedIn 
        ? `Login completed in ${elapsed}ms` 
        : `Login failed with status ${result.statusCode}`,
      result.body
    );
    
    return isLoggedIn ? result.body.token : null;
  } catch (error) {
    logTest(
      'Admin login successful',
      false,
      `Login error: ${error.message}`,
      { error: error.message }
    );
    return null;
  }
}

// Test 3: Get Checkout Sessions
async function testGetCheckoutSessions(authToken) {
  console.log(`${colors.blue}=== Test 3: Get Checkout Sessions ===${colors.reset}\n`);
  
  try {
    const { result, elapsed } = await measureTime(async () => {
      return await makeRequest({
        method: 'GET',
        path: '/api/v1/admin/checkout/sessions?limit=20&offset=0',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        }
      });
    });

    const hasSessions = result.statusCode === 200 && result.body && result.body.success;
    const activeSessions = hasSessions 
      ? result.body.data.filter(s => s.status === 'active') 
      : [];
    
    logTest(
      'Checkout sessions retrieved',
      hasSessions,
      hasSessions 
        ? `Retrieved ${result.body.data.length} sessions (${activeSessions.length} active) in ${elapsed}ms` 
        : `Failed with status ${result.statusCode}`,
      hasSessions ? { total: result.body.data.length, active: activeSessions.length } : result.body
    );
    
    return activeSessions;
  } catch (error) {
    logTest(
      'Checkout sessions retrieved',
      false,
      `Error: ${error.message}`,
      { error: error.message }
    );
    return [];
  }
}

// Test 4: Cancel Active Checkout Session
async function testCancelCheckoutSession(authToken, activeSessions) {
  console.log(`${colors.blue}=== Test 4: Cancel Checkout Session ===${colors.reset}\n`);
  
  if (activeSessions.length === 0) {
    console.log(`${colors.yellow}No active sessions found to cancel. Creating a test session...${colors.reset}\n`);
    
    // Try to create a test session
    try {
      const createResult = await makeRequest({
        method: 'POST',
        path: '/api/v1/checkout/initiate',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        }
      }, {
        cartId: null, // Will create new cart
        userType: 'authenticated'
      });
      
      if (createResult.statusCode === 200 && createResult.body && createResult.body.sessionId) {
        activeSessions = [{ sessionId: createResult.body.sessionId, status: 'active' }];
        console.log(`${colors.green}Created test session: ${createResult.body.sessionId}${colors.reset}\n`);
      } else {
        logTest(
          'Cancel checkout session',
          false,
          'Could not create test session and no active sessions found',
          createResult.body
        );
        return false;
      }
    } catch (error) {
      logTest(
        'Cancel checkout session',
        false,
        `Failed to create test session: ${error.message}`,
        { error: error.message }
      );
      return false;
    }
  }
  
  const sessionToCancel = activeSessions[0];
  const sessionId = sessionToCancel.sessionId || sessionToCancel.id;
  
  console.log(`${colors.cyan}Cancelling session: ${sessionId}${colors.reset}\n`);
  
  try {
    const { result, elapsed } = await measureTime(async () => {
      return await makeRequest({
        method: 'DELETE',
        path: `/api/v1/admin/checkout/sessions/${sessionId}`,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        }
      }, {
        reason: 'Test cancellation'
      });
    });

    // Check if response is successful and completed within timeout
    const isCancelled = result.statusCode === 200 && result.body && result.body.success;
    const withinTimeout = elapsed < 30000; // 30 second timeout
    
    logTest(
      'Cancel request completed successfully',
      isCancelled,
      isCancelled 
        ? `Session cancelled in ${elapsed}ms` 
        : `Failed with status ${result.statusCode}`,
      result.body
    );
    
    logTest(
      'Cancel request completed within timeout',
      withinTimeout,
      withinTimeout 
        ? `Request completed in ${elapsed}ms (timeout: 30000ms)` 
        : `Request timed out after ${elapsed}ms`,
      { elapsed, timeout: 30000 }
    );
    
    // Verify session status changed
    if (isCancelled) {
      const { result: verifyResult } = await measureTime(async () => {
        return await makeRequest({
          method: 'GET',
          path: `/api/v1/admin/checkout/sessions/${sessionId}`,
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
          }
        });
      });
      
      const statusChanged = verifyResult.statusCode === 200 && 
                           verifyResult.body && 
                           verifyResult.body.data && 
                           verifyResult.body.data.status === 'abandoned';
      
      logTest(
        'Session status changed to abandoned',
        statusChanged,
        statusChanged 
          ? `Session status successfully updated to 'abandoned'` 
          : `Session status is: ${verifyResult.body?.data?.status}`,
        verifyResult.body?.data
      );
      
      return isCancelled && withinTimeout && statusChanged;
    }
    
    return false;
  } catch (error) {
    logTest(
      'Cancel checkout session',
      false,
      `Error: ${error.message}`,
      { error: error.message }
    );
    return false;
  }
}

// Test 5: Test Timeout Handling (simulate slow operation)
async function testTimeoutHandling(authToken) {
  console.log(`${colors.blue}=== Test 5: Timeout Handling ===${colors.reset}\n`);
  
  // Test with a non-existent session to ensure timeout doesn't hang
  const fakeSessionId = 'non-existent-session-id-' + Date.now();
  
  try {
    const { result, elapsed } = await measureTime(async () => {
      return await makeRequest({
        method: 'DELETE',
        path: `/api/v1/admin/checkout/sessions/${fakeSessionId}`,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        }
      });
    });

    // Should fail gracefully with 404 or error, not hang
    const handledGracefully = result.statusCode === 404 || result.statusCode === 500;
    const withinTimeout = elapsed < 35000; // Allow some buffer
    
    logTest(
      'Non-existent session handled gracefully',
      handledGracefully,
      handledGracefully 
        ? `Request handled in ${elapsed}ms with status ${result.statusCode}` 
        : `Unexpected response`,
      result.body
    );
    
    logTest(
      'Request did not hang (completed within timeout)',
      withinTimeout,
      withinTimeout 
        ? `Request completed in ${elapsed}ms` 
        : `Request took too long: ${elapsed}ms`,
      { elapsed }
    );
    
    return handledGracefully && withinTimeout;
  } catch (error) {
    logTest(
      'Timeout handling',
      false,
      `Error: ${error.message}`,
      { error: error.message }
    );
    return false;
  }
}

// Test 6: Verify Multiple Sequential Cancels
async function testMultipleSequentialCancels(authToken, activeSessions) {
  console.log(`${colors.blue}=== Test 6: Multiple Sequential Cancels ===${colors.reset}\n`);
  
  if (activeSessions.length < 2) {
    console.log(`${colors.yellow}Not enough active sessions for multiple cancel test${colors.reset}\n`);
    return true;
  }
  
  const sessionsToCancel = activeSessions.slice(0, 2);
  const results = [];
  
  for (const session of sessionsToCancel) {
    try {
      const sessionId = session.sessionId || session.id;
      const { result, elapsed } = await measureTime(async () => {
        return await makeRequest({
          method: 'DELETE',
          path: `/api/v1/admin/checkout/sessions/${sessionId}`,
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
          }
        });
      });
      
      results.push({
        sessionId: sessionId,
        success: result.statusCode === 200 && result.body && result.body.success,
        elapsed
      });
    } catch (error) {
      results.push({
        sessionId: sessionId,
        success: false,
        error: error.message
      });
    }
  }
  
  const allSuccessful = results.every(r => r.success);
  const allWithinTimeout = results.every(r => r.elapsed < 30000);
  
  logTest(
    'Multiple sequential cancels successful',
    allSuccessful,
    allSuccessful 
      ? `All ${results.length} sessions cancelled successfully` 
      : `${results.filter(r => r.success).length}/${results.length} succeeded`,
    results
  );
  
  logTest(
    'All sequential cancels completed within timeout',
    allWithinTimeout,
    allWithinTimeout 
      ? `All requests completed within 30s timeout` 
      : `Some requests exceeded timeout`,
    results
  );
  
  return allSuccessful && allWithinTimeout;
}

// Main test execution
async function runTests() {
  console.log(`\n${colors.cyan}╔══════════════════════════════════════════════════════════╗${colors.reset}`);
  console.log(`${colors.cyan}║  Cancel Button Verification Test Suite                    ║${colors.reset}`);
  console.log(`${colors.cyan}╚══════════════════════════════════════════════════════════╝${colors.reset}\n`);
  
  console.log(`${colors.yellow}Test Configuration:${colors.reset}`);
  console.log(`  Backend URL: ${BACKEND_URL}`);
  console.log(`  Admin Email: ${ADMIN_EMAIL}`);
  console.log(`  Timeout: 30 seconds\n`);
  console.log(`${colors.yellow}══════════════════════════════════════════════════════════${colors.reset}\n`);
  
  // Run tests
  const backendHealthy = await testBackendHealth();
  
  if (!backendHealthy) {
    console.log(`${colors.red}Backend server is not accessible. Aborting tests.${colors.reset}\n`);
    return;
  }
  
  const authToken = await testAdminLogin();
  
  if (!authToken) {
    console.log(`${colors.red}Admin login failed. Aborting tests.${colors.reset}\n`);
    return;
  }
  
  const activeSessions = await testGetCheckoutSessions(authToken);
  
  await testCancelCheckoutSession(authToken, activeSessions);
  await testTimeoutHandling(authToken);
  await testMultipleSequentialCancels(authToken, activeSessions);
  
  // Print summary
  console.log(`${colors.cyan}══════════════════════════════════════════════════════════${colors.reset}\n`);
  console.log(`${colors.cyan}Test Summary:${colors.reset}\n`);
  console.log(`  Total Tests: ${testResults.total}`);
  console.log(`  ${colors.green}Passed: ${testResults.passed}${colors.reset}`);
  console.log(`  ${colors.red}Failed: ${testResults.failed}${colors.reset}`);
  console.log(`  Success Rate: ${((testResults.passed / testResults.total) * 100).toFixed(1)}%\n`);
  
  if (testResults.failed === 0) {
    console.log(`${colors.green}✓ All tests passed! The Cancel button fix is working correctly.${colors.reset}\n`);
  } else {
    console.log(`${colors.red}✗ Some tests failed. Please review the results above.${colors.reset}\n`);
  }
  
  console.log(`${colors.cyan}══════════════════════════════════════════════════════════${colors.reset}\n`);
}

// Run the tests
runTests().catch(error => {
  console.error(`${colors.red}Test execution error:${colors.reset}`, error);
  process.exit(1);
});
