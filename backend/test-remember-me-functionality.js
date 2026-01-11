/**
 * Test Script for "Remember Me" Functionality
 * 
 * This script tests the complete flow of the remember me feature:
 * 1. Login with rememberMe: true
 * 2. Verify rememberToken is returned
 * 3. Test session refresh using remember me token
 * 4. Verify persistent session behavior
 */

// Use built-in fetch for Node 18+, otherwise require node-fetch
const fetch = globalThis.fetch || (function() {
  try {
    return require('node-fetch');
  } catch (e) {
    console.error('Please install node-fetch: npm install node-fetch');
    process.exit(1);
  }
})();

// Configuration
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3001/api/v1';
const TEST_USER = {
  email: process.env.TEST_EMAIL || 'test@example.com',
  password: process.env.TEST_PASSWORD || 'TestPassword123!'
};

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logStep(step, message) {
  log(`\n${'='.repeat(60)}`, 'blue');
  log(`STEP ${step}: ${message}`, 'blue');
  log('='.repeat(60), 'blue');
}

function logSuccess(message) {
  log(`✓ ${message}`, 'green');
}

function logError(message) {
  log(`✗ ${message}`, 'red');
}

function logWarning(message) {
  log(`⚠ ${message}`, 'yellow');
}

// Test variables
let authToken = null;
let rememberToken = null;
let sessionId = null;

/**
 * Test 1: Login with Remember Me enabled
 */
async function testLoginWithRememberMe() {
  logStep(1, 'Login with Remember Me enabled');
  
  try {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        identifier: TEST_USER.email,
        password: TEST_USER.password,
        rememberMe: true
      })
    });

    const data = await response.json();
    
    if (!response.ok) {
      logError(`Login failed: ${data.error || data.message}`);
      return false;
    }

    // Verify response structure
    if (!data.token) {
      logError('No token in response');
      return false;
    }
    logSuccess('Token received');

    if (!data.sessionId) {
      logError('No sessionId in response');
      return false;
    }
    logSuccess('Session ID received');
    sessionId = data.sessionId;

    if (!data.rememberToken) {
      logError('No rememberToken in response - THIS IS THE BUG!');
      return false;
    }
    logSuccess('Remember token received');
    rememberToken = data.rememberToken;

    if (!data.rememberMe) {
      logError('rememberMe flag not set to true');
      return false;
    }
    logSuccess('Remember Me flag is true');

    if (!data.user) {
      logError('No user data in response');
      return false;
    }
    logSuccess(`User data received: ${data.user.email}`);

    authToken = data.token;
    
    // Verify session expiry is 7 days
    const expectedMaxAge = 7 * 24 * 60 * 60 * 1000; // 7 days
    if (data.maxAge !== expectedMaxAge) {
      logWarning(`Session maxAge is ${data.maxAge}ms, expected ${expectedMaxAge}ms`);
    } else {
      logSuccess(`Session expiry set to 7 days (${data.maxAge}ms)`);
    }

    logSuccess('Login with Remember Me: PASSED');
    return true;

  } catch (error) {
    logError(`Login request failed: ${error.message}`);
    return false;
  }
}

/**
 * Test 2: Validate Remember Me Token
 */
async function testValidateRememberMeToken() {
  logStep(2, 'Validate Remember Me Token');
  
  try {
    const response = await fetch(`${API_BASE_URL}/auth/validate-remember-me`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        token: rememberToken
      })
    });

    const data = await response.json();
    
    if (!response.ok) {
      logError(`Validation failed: ${data.error || data.message}`);
      return false;
    }

    if (!data.tokenValid) {
      logError('Token not valid');
      return false;
    }
    logSuccess('Remember me token is valid');

    if (!data.user) {
      logError('No user data in validation response');
      return false;
    }
    logSuccess(`User validated: ${data.user.email}`);

    logSuccess('Remember Me Token Validation: PASSED');
    return true;

  } catch (error) {
    logError(`Validation request failed: ${error.message}`);
    return false;
  }
}

/**
 * Test 3: Refresh Session using Remember Me Token
 */
async function testRefreshFromRememberMe() {
  logStep(3, 'Refresh Session using Remember Me Token');
  
  try {
    const response = await fetch(`${API_BASE_URL}/auth/refresh-from-remember-me`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        token: rememberToken
      })
    });

    const data = await response.json();
    
    if (!response.ok) {
      logError(`Refresh failed: ${data.error || data.message}`);
      return false;
    }

    if (!data.token) {
      logError('No new token in refresh response');
      return false;
    }
    logSuccess('New token received');
    authToken = data.token;

    if (!data.sessionId) {
      logError('No sessionId in refresh response');
      return false;
    }
    logSuccess('New session ID received');
    sessionId = data.sessionId;

    if (!data.refreshedFrom || data.refreshedFrom !== 'remember_me_token') {
      logError('Session not refreshed from remember me token');
      return false;
    }
    logSuccess('Session refreshed from remember me token');

    if (!data.rememberMe) {
      logError('Remember Me flag not preserved');
      return false;
    }
    logSuccess('Remember Me flag preserved');

    logSuccess('Session Refresh from Remember Me: PASSED');
    return true;

  } catch (error) {
    logError(`Refresh request failed: ${error.message}`);
    return false;
  }
}

/**
 * Test 4: Verify Protected Route Access with New Token
 */
async function testProtectedRouteAccess() {
  logStep(4, 'Access Protected Route with New Token');
  
  try {
    const response = await fetch(`${API_BASE_URL}/auth/me`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });

    const data = await response.json();
    
    if (!response.ok) {
      logError(`Protected route access failed: ${data.error || data.message}`);
      return false;
    }

    if (!data.success || !data.data) {
      logError('Invalid response from protected route');
      return false;
    }
    logSuccess('Protected route accessed successfully');
    logSuccess(`User data: ${data.data.email}`);

    logSuccess('Protected Route Access: PASSED');
    return true;

  } catch (error) {
    logError(`Protected route request failed: ${error.message}`);
    return false;
  }
}

/**
 * Test 5: Login without Remember Me (for comparison)
 */
async function testLoginWithoutRememberMe() {
  logStep(5, 'Login without Remember Me (for comparison)');
  
  try {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        identifier: TEST_USER.email,
        password: TEST_USER.password,
        rememberMe: false
      })
    });

    const data = await response.json();
    
    if (!response.ok) {
      logError(`Login failed: ${data.error || data.message}`);
      return false;
    }

    // Verify no remember token is returned
    if (data.rememberToken) {
      logError('Remember token should not be returned when rememberMe is false');
      return false;
    }
    logSuccess('No remember token returned (as expected)');

    if (data.rememberMe) {
      logError('Remember Me flag should be false');
      return false;
    }
    logSuccess('Remember Me flag is false');

    // Verify session expiry is 24 hours
    const expectedMaxAge = 24 * 60 * 60 * 1000; // 24 hours
    if (data.maxAge !== expectedMaxAge) {
      logWarning(`Session maxAge is ${data.maxAge}ms, expected ${expectedMaxAge}ms`);
    } else {
      logSuccess(`Session expiry set to 24 hours (${data.maxAge}ms)`);
    }

    logSuccess('Login without Remember Me: PASSED');
    return true;

  } catch (error) {
    logError(`Login request failed: ${error.message}`);
    return false;
  }
}

/**
 * Main test execution
 */
async function runTests() {
  log('\n' + '='.repeat(60), 'blue');
  log('REMEMBER ME FUNCTIONALITY TEST SUITE', 'blue');
  log('='.repeat(60), 'blue');
  log(`\nAPI Base URL: ${API_BASE_URL}`);
  log(`Test User: ${TEST_USER.email}`);

  const results = {
    loginWithRememberMe: false,
    validateToken: false,
    refreshSession: false,
    protectedAccess: false,
    loginWithoutRememberMe: false
  };

  // Run all tests
  results.loginWithRememberMe = await testLoginWithRememberMe();
  
  if (results.loginWithRememberMe) {
    results.validateToken = await testValidateRememberMeToken();
    
    if (results.validateToken) {
      results.refreshSession = await testRefreshFromRememberMe();
      
      if (results.refreshSession) {
        results.protectedAccess = await testProtectedRouteAccess();
      }
    }
  }
  
  results.loginWithoutRememberMe = await testLoginWithoutRememberMe();

  // Print summary
  log('\n' + '='.repeat(60), 'blue');
  log('TEST SUMMARY', 'blue');
  log('='.repeat(60), 'blue');
  
  const totalTests = Object.keys(results).length;
  const passedTests = Object.values(results).filter(r => r).length;
  const failedTests = totalTests - passedTests;

  log(`\nTotal Tests: ${totalTests}`);
  log(`Passed: ${passedTests}`, 'green');
  log(`Failed: ${failedTests}`, failedTests > 0 ? 'red' : 'green');

  log('\nDetailed Results:');
  log(`  1. Login with Remember Me: ${results.loginWithRememberMe ? 'PASSED' : 'FAILED'}`, 
        results.loginWithRememberMe ? 'green' : 'red');
  log(`  2. Validate Remember Me Token: ${results.validateToken ? 'PASSED' : 'FAILED'}`, 
        results.validateToken ? 'green' : 'red');
  log(`  3. Refresh from Remember Me: ${results.refreshSession ? 'PASSED' : 'FAILED'}`, 
        results.refreshSession ? 'green' : 'red');
  log(`  4. Protected Route Access: ${results.protectedAccess ? 'PASSED' : 'FAILED'}`, 
        results.protectedAccess ? 'green' : 'red');
  log(`  5. Login without Remember Me: ${results.loginWithoutRememberMe ? 'PASSED' : 'FAILED'}`, 
        results.loginWithoutRememberMe ? 'green' : 'red');

  log('\n' + '='.repeat(60), 'blue');
  
  if (failedTests === 0) {
    log('ALL TESTS PASSED! ✓', 'green');
  } else {
    log(`SOME TESTS FAILED! ${failedTests} test(s) need attention.`, 'red');
  }
  log('='.repeat(60), 'blue');

  // Exit with appropriate code
  process.exit(failedTests === 0 ? 0 : 1);
}

// Run tests
runTests().catch(error => {
  logError(`Test suite failed: ${error.message}`);
  console.error(error);
  process.exit(1);
});
