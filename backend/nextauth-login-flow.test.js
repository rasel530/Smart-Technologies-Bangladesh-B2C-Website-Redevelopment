/**
 * NextAuth Login Flow Test Script
 * 
 * This script tests the login flow to verify that the NextAuth.js routing error
 * has been fixed. It tests various login scenarios and checks for the
 * "Route not found: GET /api/auth/error" error.
 * 
 * Test Scenarios:
 * 1. Login with invalid credentials (wrong password)
 * 2. Login with invalid credentials (non-existent user)
 * 3. Login with valid credentials
 * 4. Logout functionality
 * 5. Verify no /api/auth/error routing errors
 */

const https = require('https');
const http = require('http');

// Configuration
const FRONTEND_URL = 'http://localhost:3000';
const BACKEND_URL = 'http://localhost:3001/api/v1';
const TEST_USER = {
  email: 'test@example.com',
  phone: '+8801700000000',
  password: 'TestPassword123!',
  firstName: 'Test',
  lastName: 'User'
};

// Test results storage
const testResults = {
  timestamp: new Date().toISOString(),
  tests: [],
  summary: {
    total: 0,
    passed: 0,
    failed: 0,
    errors: []
  }
};

/**
 * Make HTTP request
 */
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const protocol = urlObj.protocol === 'https:' ? https : http;
    
    const requestOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port || (urlObj.protocol === 'https:' ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: options.headers || {},
      ...options
    };

    const req = protocol.request(requestOptions, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const jsonData = data ? JSON.parse(data) : null;
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            data: jsonData,
            rawData: data
          });
        } catch (e) {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            data: null,
            rawData: data
          });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (options.body) {
      req.write(options.body);
    }

    req.end();
  });
}

/**
 * Record test result
 */
function recordTest(testName, passed, details, error = null) {
  const result = {
    name: testName,
    passed,
    details,
    error: error ? error.message : null,
    timestamp: new Date().toISOString()
  };
  
  testResults.tests.push(result);
  testResults.summary.total++;
  
  if (passed) {
    testResults.summary.passed++;
    console.log(`✅ PASS: ${testName}`);
  } else {
    testResults.summary.failed++;
    testResults.summary.errors.push({
      test: testName,
      error: error ? error.message : details
    });
    console.log(`❌ FAIL: ${testName}`);
    if (error) {
      console.log(`   Error: ${error.message}`);
    }
  }
  
  console.log(`   Details: ${details}\n`);
}

/**
 * Test 1: Login with wrong password
 */
async function testLoginWrongPassword() {
  console.log('\n=== Test 1: Login with Wrong Password ===\n');
  
  try {
    const response = await makeRequest(`${BACKEND_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        identifier: TEST_USER.email,
        password: 'WrongPassword123!',
        rememberMe: false
      })
    });

    const passed = response.statusCode === 401;
    const details = `Status: ${response.statusCode}, Expected: 401`;
    
    recordTest(
      'Login with wrong password',
      passed,
      details,
      passed ? null : new Error(`Expected 401, got ${response.statusCode}`)
    );

    // Check if response contains error message
    if (response.data && response.data.message) {
      console.log(`   Error message: ${response.data.message}`);
    }
  } catch (error) {
    recordTest(
      'Login with wrong password',
      false,
      'Request failed',
      error
    );
  }
}

/**
 * Test 2: Login with non-existent user
 */
async function testLoginNonExistentUser() {
  console.log('\n=== Test 2: Login with Non-existent User ===\n');
  
  try {
    const response = await makeRequest(`${BACKEND_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        identifier: 'nonexistent@example.com',
        password: 'SomePassword123!',
        rememberMe: false
      })
    });

    const passed = response.statusCode === 401;
    const details = `Status: ${response.statusCode}, Expected: 401`;
    
    recordTest(
      'Login with non-existent user',
      passed,
      details,
      passed ? null : new Error(`Expected 401, got ${response.statusCode}`)
    );

    // Check if response contains error message
    if (response.data && response.data.message) {
      console.log(`   Error message: ${response.data.message}`);
    }
  } catch (error) {
    recordTest(
      'Login with non-existent user',
      false,
      'Request failed',
      error
    );
  }
}

/**
 * Test 3: Login with valid credentials
 */
async function testLoginValidCredentials() {
  console.log('\n=== Test 3: Login with Valid Credentials ===\n');
  
  try {
    const response = await makeRequest(`${BACKEND_URL}/auth/login`, {
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

    const passed = response.statusCode === 200 && response.data && response.data.token;
    const details = `Status: ${response.statusCode}, Has token: ${!!(response.data && response.data.token)}`;
    
    recordTest(
      'Login with valid credentials',
      passed,
      details,
      passed ? null : new Error(`Login failed or no token returned`)
    );

    if (passed) {
      console.log(`   User ID: ${response.data.user?.id}`);
      console.log(`   User email: ${response.data.user?.email}`);
      console.log(`   Token: ${response.data.token?.substring(0, 20)}...`);
      
      // Return token for logout test
      return response.data.token;
    }
  } catch (error) {
    recordTest(
      'Login with valid credentials',
      false,
      'Request failed',
      error
    );
  }
  
  return null;
}

/**
 * Test 4: Check NextAuth error route
 */
async function testNextAuthErrorRoute() {
  console.log('\n=== Test 4: Check NextAuth Error Route ===\n');
  
  try {
    // Try to access the error route directly
    const response = await makeRequest(`${FRONTEND_URL}/api/auth/error`);
    
    // The route should either:
    // 1. Return a proper error page (not 404)
    // 2. Redirect to login page
    // 3. Handle the error gracefully
    
    const isNot404 = response.statusCode !== 404;
    const details = `Status: ${response.statusCode}, Not 404: ${isNot404}`;
    
    recordTest(
      'NextAuth error route not returning 404',
      isNot404,
      details,
      isNot404 ? null : new Error('Error route returns 404 - routing error still present')
    );

    console.log(`   Response status: ${response.statusCode}`);
    console.log(`   Response headers: ${JSON.stringify(response.headers, null, 2)}`);
    
    if (response.rawData) {
      console.log(`   Response data: ${response.rawData.substring(0, 200)}...`);
    }
  } catch (error) {
    // Connection error might mean the route doesn't exist at all
    recordTest(
      'NextAuth error route accessible',
      false,
      'Route not accessible',
      error
    );
  }
}

/**
 * Test 5: Test NextAuth sign-in endpoint
 */
async function testNextAuthSignIn() {
  console.log('\n=== Test 5: Test NextAuth Sign-in Endpoint ===\n');
  
  try {
    // Try to access NextAuth sign-in endpoint
    const response = await makeRequest(`${FRONTEND_URL}/api/auth/signin`);
    
    const isNot404 = response.statusCode !== 404;
    const details = `Status: ${response.statusCode}, Not 404: ${isNot404}`;
    
    recordTest(
      'NextAuth sign-in endpoint accessible',
      isNot404,
      details,
      isNot404 ? null : new Error('Sign-in endpoint returns 404')
    );

    console.log(`   Response status: ${response.statusCode}`);
  } catch (error) {
    recordTest(
      'NextAuth sign-in endpoint accessible',
      false,
      'Request failed',
      error
    );
  }
}

/**
 * Test 6: Test NextAuth credentials sign-in
 */
async function testNextAuthCredentialsSignIn() {
  console.log('\n=== Test 6: Test NextAuth Credentials Sign-in ===\n');
  
  try {
    // Try to sign in via NextAuth credentials provider
    const response = await makeRequest(`${FRONTEND_URL}/api/auth/callback/credentials`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        identifier: TEST_USER.email,
        password: TEST_USER.password,
        rememberMe: false,
        csrfToken: 'test-csrf-token'
      })
    });

    const isNot404 = response.statusCode !== 404;
    const details = `Status: ${response.statusCode}, Not 404: ${isNot404}`;
    
    recordTest(
      'NextAuth credentials callback not returning 404',
      isNot404,
      details,
      isNot404 ? null : new Error('Credentials callback returns 404 - routing error')
    );

    console.log(`   Response status: ${response.statusCode}`);
    if (response.rawData) {
      console.log(`   Response: ${response.rawData.substring(0, 200)}...`);
    }
  } catch (error) {
    recordTest(
      'NextAuth credentials callback accessible',
      false,
      'Request failed',
      error
    );
  }
}

/**
 * Test 7: Test logout functionality
 */
async function testLogout(token) {
  console.log('\n=== Test 7: Test Logout Functionality ===\n');
  
  if (!token) {
    recordTest(
      'Logout functionality',
      false,
      'No token available for logout test',
      new Error('No token from previous login test')
    );
    return;
  }
  
  try {
    const response = await makeRequest(`${BACKEND_URL}/auth/logout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    const passed = response.statusCode === 200;
    const details = `Status: ${response.statusCode}, Expected: 200`;
    
    recordTest(
      'Logout functionality',
      passed,
      details,
      passed ? null : new Error(`Expected 200, got ${response.statusCode}`)
    );

    if (response.data && response.data.message) {
      console.log(`   Logout message: ${response.data.message}`);
    }
  } catch (error) {
    recordTest(
      'Logout functionality',
      false,
      'Request failed',
      error
    );
  }
}

/**
 * Test 8: Check frontend login page accessibility
 */
async function testFrontendLoginPage() {
  console.log('\n=== Test 8: Check Frontend Login Page ===\n');
  
  try {
    const response = await makeRequest(`${FRONTEND_URL}/login`);
    
    const isNot404 = response.statusCode !== 404;
    const details = `Status: ${response.statusCode}, Not 404: ${isNot404}`;
    
    recordTest(
      'Frontend login page accessible',
      isNot404,
      details,
      isNot404 ? null : new Error('Login page returns 404')
    );

    console.log(`   Response status: ${response.statusCode}`);
    
    // Check if page contains login form elements
    if (response.rawData) {
      const hasLoginForm = response.rawData.includes('login') || 
                          response.rawData.includes('Login') ||
                          response.rawData.includes('email') ||
                          response.rawData.includes('password');
      
      console.log(`   Contains login form elements: ${hasLoginForm}`);
    }
  } catch (error) {
    recordTest(
      'Frontend login page accessible',
      false,
      'Request failed',
      error
    );
  }
}

/**
 * Test 9: Verify NextAuth configuration pages
 */
async function testNextAuthPagesConfig() {
  console.log('\n=== Test 9: Verify NextAuth Pages Configuration ===\n');
  
  const pages = ['/login', '/register'];
  let allPassed = true;
  
  for (const page of pages) {
    try {
      const response = await makeRequest(`${FRONTEND_URL}${page}`);
      const isNot404 = response.statusCode !== 404;
      
      console.log(`   ${page}: Status ${response.statusCode} ${isNot404 ? '✓' : '✗'}`);
      
      if (!isNot404) {
        allPassed = false;
      }
    } catch (error) {
      console.log(`   ${page}: Error - ${error.message}`);
      allPassed = false;
    }
  }
  
  recordTest(
    'NextAuth configured pages accessible',
    allPassed,
    'All configured pages should be accessible',
    allPassed ? null : new Error('Some configured pages are not accessible')
  );
}

/**
 * Test 10: Test login with phone number
 */
async function testLoginWithPhone() {
  console.log('\n=== Test 10: Test Login with Phone Number ===\n');
  
  try {
    const response = await makeRequest(`${BACKEND_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        identifier: TEST_USER.phone,
        password: TEST_USER.password,
        rememberMe: false
      })
    });

    const passed = response.statusCode === 200 && response.data && response.data.token;
    const details = `Status: ${response.statusCode}, Has token: ${!!(response.data && response.data.token)}`;
    
    recordTest(
      'Login with phone number',
      passed,
      details,
      passed ? null : new Error(`Login with phone failed or no token returned`)
    );

    if (passed) {
      console.log(`   User ID: ${response.data.user?.id}`);
      console.log(`   User phone: ${response.data.user?.phone}`);
    }
  } catch (error) {
    recordTest(
      'Login with phone number',
      false,
      'Request failed',
      error
    );
  }
}

/**
 * Print test summary
 */
function printSummary() {
  console.log('\n' + '='.repeat(60));
  console.log('TEST SUMMARY');
  console.log('='.repeat(60));
  console.log(`Total Tests: ${testResults.summary.total}`);
  console.log(`Passed: ${testResults.summary.passed} ✅`);
  console.log(`Failed: ${testResults.summary.failed} ❌`);
  console.log(`Success Rate: ${((testResults.summary.passed / testResults.summary.total) * 100).toFixed(2)}%`);
  
  if (testResults.summary.errors.length > 0) {
    console.log('\n' + '='.repeat(60));
    console.log('FAILED TESTS:');
    console.log('='.repeat(60));
    testResults.summary.errors.forEach((err, index) => {
      console.log(`${index + 1}. ${err.test}`);
      console.log(`   Error: ${err.error}`);
    });
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('NEXTAUTH ROUTING ERROR VERIFICATION');
  console.log('='.repeat(60));
  
  const routingErrorTests = testResults.tests.filter(t => 
    t.name.includes('NextAuth') && t.name.includes('404')
  );
  
  const hasRoutingError = routingErrorTests.some(t => !t.passed);
  
  if (hasRoutingError) {
    console.log('❌ ROUTING ERROR STILL PRESENT');
    console.log('The "Route not found: GET /api/auth/error" error is still occurring.');
  } else {
    console.log('✅ NO ROUTING ERRORS DETECTED');
    console.log('The NextAuth routing error has been successfully fixed.');
  }
  
  console.log('\n' + '='.repeat(60));
}

/**
 * Save test results to file
 */
function saveResults() {
  const fs = require('fs');
  const filename = `nextauth-login-test-results-${Date.now()}.json`;
  
  fs.writeFileSync(filename, JSON.stringify(testResults, null, 2));
  console.log(`\nTest results saved to: ${filename}`);
}

/**
 * Main test execution
 */
async function runTests() {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║     NEXTAUTH LOGIN FLOW TEST SUITE                          ║');
  console.log('║     Testing NextAuth.js routing error fix                   ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  console.log(`\nFrontend URL: ${FRONTEND_URL}`);
  console.log(`Backend URL: ${BACKEND_URL}`);
  console.log(`Test started at: ${testResults.timestamp}`);
  
  // Run all tests
  await testFrontendLoginPage();
  await testNextAuthPagesConfig();
  await testNextAuthErrorRoute();
  await testNextAuthSignIn();
  await testNextAuthCredentialsSignIn();
  await testLoginWrongPassword();
  await testLoginNonExistentUser();
  const token = await testLoginValidCredentials();
  await testLoginWithPhone();
  await testLogout(token);
  
  // Print summary and save results
  printSummary();
  saveResults();
  
  // Exit with appropriate code
  process.exit(testResults.summary.failed > 0 ? 1 : 0);
}

// Run tests
runTests().catch(error => {
  console.error('Fatal error running tests:', error);
  process.exit(1);
});
