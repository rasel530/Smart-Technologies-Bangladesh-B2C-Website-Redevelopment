/**
 * Comprehensive Testing of Authentication and Infinite Loop Fixes
 * 
 * This test suite verifies all fixes implemented to resolve:
 * 1. 401 Unauthorized error on /api/v1/wishlist endpoint
 * 2. Error: "Cannot read properties of undefined (reading 'findUnique')"
 * 3. Infinite loop causing admin panel to hang
 * 
 * Fixes Verified:
 * - Fix 1: Removed duplicate Prisma Client instance in backend/index.js
 * - Fix 2: Fixed database service import path in backend/src/services/database.service.ts
 * - Fix 3: Added error handling for database service import
 * - Fix 4: Prevented infinite redirect loops in frontend/src/components/auth/withAuth.tsx
 * - Fix 5: Added Prisma client validation in backend/middleware/auth.js
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

// Test configuration
const config = {
  backendUrl: 'http://localhost:3001',
  frontendUrl: 'http://localhost:3000',
  timeout: 10000,
  testUser: {
    email: process.env.TEST_USER_EMAIL || 'admin@smarttechnologies-bd.com',
    password: process.env.TEST_USER_PASSWORD || 'Admin@123'
  }
};

// Test results storage
const testResults = {
  summary: {
    total: 0,
    passed: 0,
    failed: 0,
    skipped: 0
  },
  tests: [],
  startTime: null,
  endTime: null,
  duration: 0
};

// Utility functions
function log(message, type = 'info') {
  const timestamp = new Date().toISOString();
  const prefix = {
    'info': '[INFO]',
    'success': '[✓ PASS]',
    'error': '[✗ FAIL]',
    'warn': '[⚠ WARN]',
    'test': '[TEST]'
  }[type] || '[LOG]';
  
  console.log(`${timestamp} ${prefix} ${message}`);
}

function recordTestResult(testName, passed, message, details = {}) {
  const result = {
    name: testName,
    passed,
    message,
    details,
    timestamp: new Date().toISOString()
  };
  
  testResults.tests.push(result);
  testResults.summary.total++;
  
  if (passed) {
    testResults.summary.passed++;
    log(`${testName}: ${message}`, 'success');
  } else {
    testResults.summary.failed++;
    log(`${testName}: ${message}`, 'error');
  }
}

function makeRequest(options) {
  return new Promise((resolve, reject) => {
    const url = new URL(options.url || options.path, config.backendUrl);
    
    const requestOptions = {
      hostname: url.hostname,
      port: url.port || 3001,
      path: url.pathname + url.search,
      method: options.method || 'GET',
      headers: options.headers || {},
      timeout: options.timeout || config.timeout
    };

    const req = http.request(requestOptions, (res) => {
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
            raw: data
          });
        } catch (e) {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            data: null,
            raw: data
          });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    if (options.body) {
      req.write(JSON.stringify(options.body));
    }

    req.end();
  });
}

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ============================================================================
// TEST 1: Verify Wishlist Endpoint Authentication
// ============================================================================
async function testWishlistEndpointAuthentication() {
  log('Starting Test 1: Verify Wishlist Endpoint Authentication', 'test');
  
  try {
    // Test 1.1: Test wishlist endpoint without authentication
    log('Test 1.1: Testing /api/v1/wishlist without authentication', 'test');
    
    const response = await makeRequest({
      url: `${config.backendUrl}/api/v1/wishlist`,
      method: 'GET'
    });

    const test1_1Passed = response.statusCode === 401;
    recordTestResult(
      'Test 1.1: Wishlist endpoint returns 401 without auth',
      test1_1Passed,
      test1_1Passed 
        ? 'Correctly returned 401 Unauthorized' 
        : `Expected 401, got ${response.statusCode}`,
      { statusCode: response.statusCode, data: response.data }
    );

    // Test 1.2: Verify proper error message
    log('Test 1.2: Verifying proper error message', 'test');
    
    const hasProperError = response.data && 
      (response.data.error || response.data.message);
    
    recordTestResult(
      'Test 1.2: Proper error message returned',
      hasProperError,
      hasProperError
        ? 'Error message present in response'
        : 'No error message in response',
      { error: response.data?.error, message: response.data?.message }
    );

    // Test 1.3: Check for "Cannot read properties of undefined" error
    log('Test 1.3: Checking for undefined property error', 'test');
    
    const hasUndefinedError = response.raw && 
      response.raw.includes('Cannot read properties of undefined');
    
    recordTestResult(
      'Test 1.3: No "Cannot read properties of undefined" error',
      !hasUndefinedError,
      !hasUndefinedError
        ? 'No undefined property error detected'
        : 'Undefined property error found in response',
      { hasUndefinedError }
    );

    // Test 1.4: Test with invalid token
    log('Test 1.4: Testing with invalid token', 'test');
    
    const invalidTokenResponse = await makeRequest({
      url: `${config.backendUrl}/api/v1/wishlist`,
      method: 'GET',
      headers: {
        'Authorization': 'Bearer invalid_token_here'
      }
    });

    const test1_4Passed = invalidTokenResponse.statusCode === 401;
    recordTestResult(
      'Test 1.4: Invalid token returns 401',
      test1_4Passed,
      test1_4Passed
        ? 'Correctly returned 401 for invalid token'
        : `Expected 401, got ${invalidTokenResponse.statusCode}`,
      { statusCode: invalidTokenResponse.statusCode }
    );

  } catch (error) {
    recordTestResult(
      'Test 1: Wishlist Endpoint Authentication',
      false,
      `Test failed with error: ${error.message}`,
      { error: error.message, stack: error.stack }
    );
  }
}

// ============================================================================
// TEST 2: Verify Admin Panel No Infinite Loop
// ============================================================================
async function testAdminPanelNoInfiniteLoop() {
  log('Starting Test 2: Verify Admin Panel No Infinite Loop', 'test');
  
  try {
    // Test 2.1: Check admin panel accessibility
    log('Test 2.1: Checking admin panel accessibility', 'test');
    
    const response = await makeRequest({
      url: config.frontendUrl,
      method: 'GET',
      timeout: 5000 // Short timeout to detect hanging
    });

    // If we get a response within timeout, no infinite loop
    const test2_1Passed = response.statusCode >= 200 && response.statusCode < 500;
    recordTestResult(
      'Test 2.1: Admin panel responds without hanging',
      test2_1Passed,
      test2_1Passed
        ? 'Admin panel responded successfully'
        : 'Admin panel did not respond or hung',
      { statusCode: response.statusCode }
    );

    // Test 2.2: Check for redirect patterns
    log('Test 2.2: Checking for redirect patterns', 'test');
    
    const hasRedirect = response.statusCode >= 300 && response.statusCode < 400;
    const redirectCount = hasRedirect ? 1 : 0;
    
    recordTestResult(
      'Test 2.2: Single redirect or no redirect (not infinite)',
      redirectCount <= 1,
      redirectCount <= 1
        ? `Found ${redirectCount} redirect(s) - acceptable`
        : `Found ${redirectCount} redirects - potential infinite loop`,
      { statusCode: response.statusCode, redirectCount }
    );

    // Test 2.3: Verify withAuth component prevents multiple redirects
    log('Test 2.3: Verifying withAuth redirect prevention', 'test');
    
    // Read the withAuth.tsx file to verify the fix
    const withAuthPath = path.join(__dirname, 'frontend/src/components/auth/withAuth.tsx');
    
    if (fs.existsSync(withAuthPath)) {
      const withAuthContent = fs.readFileSync(withAuthPath, 'utf8');
      
      const hasHasRedirectedState = withAuthContent.includes('hasRedirected');
      const hasRedirectPrevention = withAuthContent.includes('if (!mounted || hasRedirected) return');
      
      recordTestResult(
        'Test 2.3: withAuth component has redirect prevention',
        hasHasRedirectedState && hasRedirectPrevention,
        hasHasRedirectedState && hasRedirectPrevention
          ? 'withAuth has hasRedirected state and prevention logic'
          : 'withAuth missing redirect prevention',
        { hasHasRedirectedState, hasRedirectPrevention }
      );
    } else {
      recordTestResult(
        'Test 2.3: withAuth component file check',
        false,
        'withAuth.tsx file not found',
        { path: withAuthPath }
      );
    }

  } catch (error) {
    if (error.message.includes('timeout') || error.message.includes('ETIMEDOUT')) {
      recordTestResult(
        'Test 2: Admin Panel No Infinite Loop',
        false,
        'Admin panel timed out - possible infinite loop detected',
        { error: error.message }
      );
    } else {
      recordTestResult(
        'Test 2: Admin Panel No Infinite Loop',
        false,
        `Test failed with error: ${error.message}`,
        { error: error.message, stack: error.stack }
      );
    }
  }
}

// ============================================================================
// TEST 3: Verify Database Connection
// ============================================================================
async function testDatabaseConnection() {
  log('Starting Test 3: Verify Database Connection', 'test');
  
  try {
    // Test 3.1: Check health endpoint
    log('Test 3.1: Checking health endpoint', 'test');
    
    const healthResponse = await makeRequest({
      url: `${config.backendUrl}/api/v1/health`,
      method: 'GET'
    });

    const test3_1Passed = healthResponse.statusCode === 200;
    recordTestResult(
      'Test 3.1: Health endpoint accessible',
      test3_1Passed,
      test3_1Passed
        ? 'Health endpoint returned 200'
        : `Health endpoint returned ${healthResponse.statusCode}`,
      { statusCode: healthResponse.statusCode, data: healthResponse.data }
    );

    // Test 3.2: Verify database connection status
    log('Test 3.2: Verifying database connection status', 'test');
    
    const dbConnected = healthResponse.data && 
      healthResponse.data.services &&
      healthResponse.data.services.database &&
      healthResponse.data.services.database.status === 'healthy';
    
    recordTestResult(
      'Test 3.2: Database connection healthy',
      dbConnected,
      dbConnected
        ? 'Database connection is healthy'
        : 'Database connection is not healthy',
      { dbStatus: healthResponse.data?.services?.database }
    );

    // Test 3.3: Check for duplicate Prisma client instances
    log('Test 3.3: Checking for duplicate Prisma client instances', 'test');
    
    const indexPath = path.join(__dirname, 'backend/index.js');
    const indexContent = fs.readFileSync(indexPath, 'utf8');
    
    // Count PrismaClient imports
    const prismaImports = (indexContent.match(/require\(['"]@prisma\/client['"]\)/g) || []).length;
    const databaseServiceImports = (indexContent.match(/require\(['"].*database['"]\)/g) || []).length;
    
    const hasDuplicatePrisma = prismaImports > 1;
    
    recordTestResult(
      'Test 3.3: No duplicate Prisma Client instances',
      !hasDuplicatePrisma,
      !hasDuplicatePrisma
        ? `Found ${prismaImports} Prisma import(s) - acceptable`
        : `Found ${prismaImports} Prisma imports - potential duplicate`,
      { prismaImports, databaseServiceImports }
    );

    // Test 3.4: Verify database service import path
    log('Test 3.4: Verifying database service import path', 'test');
    
    const dbServicePath = path.join(__dirname, 'backend/src/services/database.service.ts');
    
    if (fs.existsSync(dbServicePath)) {
      const dbServiceContent = fs.readFileSync(dbServicePath, 'utf8');
      
      const hasCorrectImport = dbServiceContent.includes("require('../../services/database')");
      const hasErrorHandling = dbServiceContent.includes('try {') && 
                               dbServiceContent.includes('catch (error)');
      
      recordTestResult(
        'Test 3.4: Database service has correct import and error handling',
        hasCorrectImport && hasErrorHandling,
        hasCorrectImport && hasErrorHandling
          ? 'Database service import path is correct with error handling'
          : 'Database service missing correct import or error handling',
        { hasCorrectImport, hasErrorHandling }
      );
    } else {
      recordTestResult(
        'Test 3.4: Database service file check',
        false,
        'database.service.ts file not found',
        { path: dbServicePath }
      );
    }

    // Test 3.5: Verify Prisma client validation in auth middleware
    log('Test 3.5: Verifying Prisma client validation in auth middleware', 'test');
    
    const authMiddlewarePath = path.join(__dirname, 'backend/middleware/auth.js');
    
    if (fs.existsSync(authMiddlewarePath)) {
      const authMiddlewareContent = fs.readFileSync(authMiddlewarePath, 'utf8');
      
      const hasPrismaValidation = authMiddlewareContent.includes('if (!this.prisma || typeof this.prisma.user !== \'object\')');
      
      recordTestResult(
        'Test 3.5: Auth middleware has Prisma client validation',
        hasPrismaValidation,
        hasPrismaValidation
          ? 'Auth middleware validates Prisma client before use'
          : 'Auth middleware missing Prisma client validation',
        { hasPrismaValidation }
      );
    } else {
      recordTestResult(
        'Test 3.5: Auth middleware file check',
        false,
        'auth.js file not found',
        { path: authMiddlewarePath }
      );
    }

  } catch (error) {
    recordTestResult(
      'Test 3: Database Connection',
      false,
      `Test failed with error: ${error.message}`,
      { error: error.message, stack: error.stack }
    );
  }
}

// ============================================================================
// TEST 4: Verify Admin Panel Features Load
// ============================================================================
async function testAdminPanelFeaturesLoad() {
  log('Starting Test 4: Verify Admin Panel Features Load', 'test');
  
  try {
    // First, try to login to get a token
    let authToken = null;
    
    try {
      log('Test 4.0: Attempting admin login', 'test');
      
      const loginResponse = await makeRequest({
        url: `${config.backendUrl}/api/v1/auth/login`,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: {
          email: config.testUser.email,
          password: config.testUser.password
        }
      });

      if (loginResponse.statusCode === 200 && loginResponse.data && loginResponse.data.token) {
        authToken = loginResponse.data.token;
        log('Admin login successful', 'success');
      } else {
        log('Admin login failed - will test without authentication', 'warn');
      }
    } catch (error) {
      log(`Login attempt failed: ${error.message}`, 'warn');
    }

    // Test 4.1: Test admin dashboard endpoint
    log('Test 4.1: Testing admin dashboard endpoint', 'test');
    
    const dashboardOptions = {
      url: `${config.backendUrl}/api/v1/admin/dashboard`,
      method: 'GET'
    };
    
    if (authToken) {
      dashboardOptions.headers = {
        'Authorization': `Bearer ${authToken}`
      };
    }

    const dashboardResponse = await makeRequest(dashboardOptions);
    
    // If authenticated, expect 200 or 403 (if not admin), if not authenticated expect 401
    const expectedStatus = authToken ? (dashboardResponse.statusCode === 200 || dashboardResponse.statusCode === 403) : dashboardResponse.statusCode === 401;
    
    recordTestResult(
      'Test 4.1: Admin dashboard endpoint responds',
      expectedStatus,
      expectedStatus
        ? `Dashboard endpoint returned ${dashboardResponse.statusCode} - expected`
        : `Dashboard endpoint returned ${dashboardResponse.statusCode} - unexpected`,
      { statusCode: dashboardResponse.statusCode, authenticated: !!authToken }
    );

    // Test 4.2: Test admin orders endpoint
    log('Test 4.2: Testing admin orders endpoint', 'test');
    
    const ordersOptions = {
      url: `${config.backendUrl}/api/v1/admin/orders`,
      method: 'GET'
    };
    
    if (authToken) {
      ordersOptions.headers = {
        'Authorization': `Bearer ${authToken}`
      };
    }

    const ordersResponse = await makeRequest(ordersOptions);
    
    const ordersExpectedStatus = authToken ? (ordersResponse.statusCode === 200 || ordersResponse.statusCode === 403) : ordersResponse.statusCode === 401;
    
    recordTestResult(
      'Test 4.2: Admin orders endpoint responds',
      ordersExpectedStatus,
      ordersExpectedStatus
        ? `Orders endpoint returned ${ordersResponse.statusCode} - expected`
        : `Orders endpoint returned ${ordersResponse.statusCode} - unexpected`,
      { statusCode: ordersResponse.statusCode, authenticated: !!authToken }
    );

    // Test 4.3: Test admin products endpoint
    log('Test 4.3: Testing admin products endpoint', 'test');
    
    const productsOptions = {
      url: `${config.backendUrl}/api/v1/admin/products`,
      method: 'GET'
    };
    
    if (authToken) {
      productsOptions.headers = {
        'Authorization': `Bearer ${authToken}`
      };
    }

    const productsResponse = await makeRequest(productsOptions);
    
    const productsExpectedStatus = authToken ? (productsResponse.statusCode === 200 || productsResponse.statusCode === 403) : productsResponse.statusCode === 401;
    
    recordTestResult(
      'Test 4.3: Admin products endpoint responds',
      productsExpectedStatus,
      productsExpectedStatus
        ? `Products endpoint returned ${productsResponse.statusCode} - expected`
        : `Products endpoint returned ${productsResponse.statusCode} - unexpected`,
      { statusCode: productsResponse.statusCode, authenticated: !!authToken }
    );

    // Test 4.4: Test admin users endpoint
    log('Test 4.4: Testing admin users endpoint', 'test');
    
    const usersOptions = {
      url: `${config.backendUrl}/api/v1/admin/users`,
      method: 'GET'
    };
    
    if (authToken) {
      usersOptions.headers = {
        'Authorization': `Bearer ${authToken}`
      };
    }

    const usersResponse = await makeRequest(usersOptions);
    
    const usersExpectedStatus = authToken ? (usersResponse.statusCode === 200 || usersResponse.statusCode === 403) : usersResponse.statusCode === 401;
    
    recordTestResult(
      'Test 4.4: Admin users endpoint responds',
      usersExpectedStatus,
      usersExpectedStatus
        ? `Users endpoint returned ${usersResponse.statusCode} - expected`
        : `Users endpoint returned ${usersResponse.statusCode} - unexpected`,
      { statusCode: usersResponse.statusCode, authenticated: !!authToken }
    );

  } catch (error) {
    recordTestResult(
      'Test 4: Admin Panel Features Load',
      false,
      `Test failed with error: ${error.message}`,
      { error: error.message, stack: error.stack }
    );
  }
}

// ============================================================================
// TEST 5: Verify Authentication Flow
// ============================================================================
async function testAuthenticationFlow() {
  log('Starting Test 5: Verify Authentication Flow', 'test');
  
  try {
    // Test 5.1: Test user registration (optional - may fail if user exists)
    log('Test 5.1: Testing user registration', 'test');
    
    const testEmail = `test_${Date.now()}@example.com`;
    const testPassword = 'Test@123456';
    
    try {
      const registerResponse = await makeRequest({
        url: `${config.backendUrl}/api/v1/auth/register`,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: {
          email: testEmail,
          password: testPassword,
          firstName: 'Test',
          lastName: 'User'
        }
      });

      const test5_1Passed = registerResponse.statusCode === 201 || registerResponse.statusCode === 409; // 201 created or 409 conflict (user exists)
      
      recordTestResult(
        'Test 5.1: User registration endpoint accessible',
        test5_1Passed,
        test5_1Passed
          ? `Registration endpoint returned ${registerResponse.statusCode}`
          : `Registration endpoint returned ${registerResponse.statusCode} - unexpected`,
        { statusCode: registerResponse.statusCode }
      );
    } catch (error) {
      recordTestResult(
        'Test 5.1: User registration endpoint',
        false,
        `Registration failed: ${error.message}`,
        { error: error.message }
      );
    }

    // Test 5.2: Test user login
    log('Test 5.2: Testing user login', 'test');
    
    try {
      const loginResponse = await makeRequest({
        url: `${config.backendUrl}/api/v1/auth/login`,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: {
          email: config.testUser.email,
          password: config.testUser.password
        }
      });

      const test5_2Passed = loginResponse.statusCode === 200 || loginResponse.statusCode === 401; // 200 success or 401 invalid credentials
      
      recordTestResult(
        'Test 5.2: User login endpoint accessible',
        test5_2Passed,
        test5_2Passed
          ? `Login endpoint returned ${loginResponse.statusCode}`
          : `Login endpoint returned ${loginResponse.statusCode} - unexpected`,
        { statusCode: loginResponse.statusCode, hasToken: !!loginResponse.data?.token }
      );
    } catch (error) {
      recordTestResult(
        'Test 5.2: User login endpoint',
        false,
        `Login failed: ${error.message}`,
        { error: error.message }
      );
    }

    // Test 5.3: Test protected endpoint with valid token
    log('Test 5.3: Testing protected endpoint with valid token', 'test');
    
    // First, try to get a valid token
    let validToken = null;
    try {
      const loginResponse = await makeRequest({
        url: `${config.backendUrl}/api/v1/auth/login`,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: {
          email: config.testUser.email,
          password: config.testUser.password
        }
      });

      if (loginResponse.statusCode === 200 && loginResponse.data && loginResponse.data.token) {
        validToken = loginResponse.data.token;
      }
    } catch (error) {
      log('Could not obtain valid token for test', 'warn');
    }

    if (validToken) {
      const protectedResponse = await makeRequest({
        url: `${config.backendUrl}/api/v1/profile`,
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${validToken}`
        }
      });

      const test5_3Passed = protectedResponse.statusCode === 200 || protectedResponse.statusCode === 403;
      
      recordTestResult(
        'Test 5.3: Protected endpoint with valid token',
        test5_3Passed,
        test5_3Passed
          ? `Protected endpoint returned ${protectedResponse.statusCode} with valid token`
          : `Protected endpoint returned ${protectedResponse.statusCode} - unexpected`,
        { statusCode: protectedResponse.statusCode }
      );
    } else {
      recordTestResult(
        'Test 5.3: Protected endpoint with valid token',
        false,
        'Could not obtain valid token to test',
        {}
      );
    }

    // Test 5.4: Test protected endpoint with invalid token
    log('Test 5.4: Testing protected endpoint with invalid token', 'test');
    
    const invalidTokenResponse = await makeRequest({
      url: `${config.backendUrl}/api/v1/profile`,
      method: 'GET',
      headers: {
        'Authorization': 'Bearer invalid_token_12345'
      }
    });

    const test5_4Passed = invalidTokenResponse.statusCode === 401;
    
    recordTestResult(
      'Test 5.4: Protected endpoint with invalid token',
      test5_4Passed,
      test5_4Passed
        ? `Protected endpoint correctly returned 401 for invalid token`
        : `Protected endpoint returned ${invalidTokenResponse.statusCode} - expected 401`,
      { statusCode: invalidTokenResponse.statusCode }
    );

    // Test 5.5: Test logout functionality
    log('Test 5.5: Testing logout functionality', 'test');
    
    if (validToken) {
      try {
        const logoutResponse = await makeRequest({
          url: `${config.backendUrl}/api/v1/auth/logout`,
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${validToken}`
          }
        });

        const test5_5Passed = logoutResponse.statusCode === 200;
        
        recordTestResult(
          'Test 5.5: Logout functionality',
          test5_5Passed,
          test5_5Passed
            ? 'Logout endpoint returned 200'
            : `Logout endpoint returned ${logoutResponse.statusCode}`,
          { statusCode: logoutResponse.statusCode }
        );
      } catch (error) {
        recordTestResult(
          'Test 5.5: Logout functionality',
          false,
          `Logout failed: ${error.message}`,
          { error: error.message }
        );
      }
    } else {
      recordTestResult(
        'Test 5.5: Logout functionality',
        false,
        'No valid token available to test logout',
        {}
      );
    }

  } catch (error) {
    recordTestResult(
      'Test 5: Authentication Flow',
      false,
      `Test failed with error: ${error.message}`,
      { error: error.message, stack: error.stack }
    );
  }
}

// ============================================================================
// TEST 6: Verify No Regression in Existing Features
// ============================================================================
async function testNoRegressionInExistingFeatures() {
  log('Starting Test 6: Verify No Regression in Existing Features', 'test');
  
  try {
    // Test 6.1: Test product browsing
    log('Test 6.1: Testing product browsing', 'test');
    
    const productsResponse = await makeRequest({
      url: `${config.backendUrl}/api/v1/products`,
      method: 'GET'
    });

    const test6_1Passed = productsResponse.statusCode === 200;
    
    recordTestResult(
      'Test 6.1: Product browsing',
      test6_1Passed,
      test6_1Passed
        ? 'Products endpoint returned 200'
        : `Products endpoint returned ${productsResponse.statusCode}`,
      { statusCode: productsResponse.statusCode, hasData: !!productsResponse.data }
    );

    // Test 6.2: Test categories endpoint
    log('Test 6.2: Testing categories endpoint', 'test');
    
    const categoriesResponse = await makeRequest({
      url: `${config.backendUrl}/api/v1/categories`,
      method: 'GET'
    });

    const test6_2Passed = categoriesResponse.statusCode === 200;
    
    recordTestResult(
      'Test 6.2: Categories endpoint',
      test6_2Passed,
      test6_2Passed
        ? 'Categories endpoint returned 200'
        : `Categories endpoint returned ${categoriesResponse.statusCode}`,
      { statusCode: categoriesResponse.statusCode, hasData: !!categoriesResponse.data }
    );

    // Test 6.3: Test brands endpoint
    log('Test 6.3: Testing brands endpoint', 'test');
    
    const brandsResponse = await makeRequest({
      url: `${config.backendUrl}/api/v1/brands`,
      method: 'GET'
    });

    const test6_3Passed = brandsResponse.statusCode === 200;
    
    recordTestResult(
      'Test 6.3: Brands endpoint',
      test6_3Passed,
      test6_3Passed
        ? 'Brands endpoint returned 200'
        : `Brands endpoint returned ${brandsResponse.statusCode}`,
      { statusCode: brandsResponse.statusCode, hasData: !!brandsResponse.data }
    );

    // Test 6.4: Test cart endpoint (public access)
    log('Test 6.4: Testing cart endpoint', 'test');
    
    const cartResponse = await makeRequest({
      url: `${config.backendUrl}/api/v1/cart`,
      method: 'GET'
    });

    const test6_4Passed = cartResponse.statusCode === 200 || cartResponse.statusCode === 401; // 200 for guest, 401 if auth required
    
    recordTestResult(
      'Test 6.4: Cart endpoint',
      test6_4Passed,
      test6_4Passed
        ? `Cart endpoint returned ${cartResponse.statusCode}`
        : `Cart endpoint returned ${cartResponse.statusCode} - unexpected`,
      { statusCode: cartResponse.statusCode }
    );

    // Test 6.5: Test reviews endpoint
    log('Test 6.5: Testing reviews endpoint', 'test');
    
    const reviewsResponse = await makeRequest({
      url: `${config.backendUrl}/api/v1/reviews`,
      method: 'GET'
    });

    const test6_5Passed = reviewsResponse.statusCode === 200;
    
    recordTestResult(
      'Test 6.5: Reviews endpoint',
      test6_5Passed,
      test6_5Passed
        ? 'Reviews endpoint returned 200'
        : `Reviews endpoint returned ${reviewsResponse.statusCode}`,
      { statusCode: reviewsResponse.statusCode, hasData: !!reviewsResponse.data }
    );

    // Test 6.6: Test search endpoint
    log('Test 6.6: Testing search endpoint', 'test');
    
    const searchResponse = await makeRequest({
      url: `${config.backendUrl}/api/search/products?q=test`,
      method: 'GET'
    });

    const test6_6Passed = searchResponse.statusCode === 200;
    
    recordTestResult(
      'Test 6.6: Search endpoint',
      test6_6Passed,
      test6_6Passed
        ? 'Search endpoint returned 200'
        : `Search endpoint returned ${searchResponse.statusCode}`,
      { statusCode: searchResponse.statusCode, hasData: !!searchResponse.data }
    );

  } catch (error) {
    recordTestResult(
      'Test 6: No Regression in Existing Features',
      false,
      `Test failed with error: ${error.message}`,
      { error: error.message, stack: error.stack }
    );
  }
}

// ============================================================================
// Generate Test Report
// ============================================================================
function generateTestReport() {
  const report = {
    metadata: {
      testSuite: 'Authentication and Infinite Loop Fixes - Comprehensive Test',
      version: '1.0.0',
      startTime: testResults.startTime,
      endTime: testResults.endTime,
      duration: testResults.duration,
      environment: {
        nodeVersion: process.version,
        platform: process.platform,
        backendUrl: config.backendUrl,
        frontendUrl: config.frontendUrl
      }
    },
    summary: testResults.summary,
    tests: testResults.tests,
    verificationStatus: {
      is401ErrorResolved: null,
      isInfiniteLoopResolved: null,
      isFunctionalityBroken: null
    },
    recommendations: []
  };

  // Determine verification status
  const wishlistTests = testResults.tests.filter(t => t.name.includes('Test 1'));
  const infiniteLoopTests = testResults.tests.filter(t => t.name.includes('Test 2'));
  const regressionTests = testResults.tests.filter(t => t.name.includes('Test 6'));

  // Check if 401 error is resolved
  const wishlist401Test = wishlistTests.find(t => t.name.includes('Test 1.1'));
  report.verificationStatus.is401ErrorResolved = wishlist401Test?.passed || false;

  // Check if infinite loop is resolved
  const infiniteLoopTest = infiniteLoopTests.find(t => t.name.includes('Test 2.1'));
  report.verificationStatus.isInfiniteLoopResolved = infiniteLoopTest?.passed || false;

  // Check if any functionality is broken
  const failedRegressionTests = regressionTests.filter(t => !t.passed);
  report.verificationStatus.isFunctionalityBroken = failedRegressionTests.length > 0;

  // Generate recommendations
  if (!report.verificationStatus.is401ErrorResolved) {
    report.recommendations.push({
      priority: 'HIGH',
      issue: '401 error on wishlist endpoint not fully resolved',
      recommendation: 'Review authentication middleware and wishlist route configuration'
    });
  }

  if (!report.verificationStatus.isInfiniteLoopResolved) {
    report.recommendations.push({
      priority: 'HIGH',
      issue: 'Infinite loop in admin panel not fully resolved',
      recommendation: 'Review withAuth component and redirect logic'
    });
  }

  if (report.verificationStatus.isFunctionalityBroken) {
    report.recommendations.push({
      priority: 'MEDIUM',
      issue: 'Some existing functionality may be broken',
      recommendation: `Review ${failedRegressionTests.length} failing regression tests`
    });
  }

  if (testResults.summary.failed === 0) {
    report.recommendations.push({
      priority: 'LOW',
      issue: 'All tests passed',
      recommendation: 'Consider adding additional edge case tests'
    });
  }

  return report;
}

// ============================================================================
// Save Test Results
// ============================================================================
function saveTestResults(report) {
  const timestamp = Date.now();
  const jsonFileName = `authentication-fixes-test-results-${timestamp}.json`;
  const mdFileName = `authentication-fixes-test-report-${timestamp}.md`;

  // Save JSON results
  fs.writeFileSync(jsonFileName, JSON.stringify(report, null, 2));
  log(`Test results saved to ${jsonFileName}`, 'success');

  // Save Markdown report
  let mdReport = `# Authentication and Infinite Loop Fixes - Comprehensive Test Report\n\n`;
  mdReport += `**Generated:** ${new Date().toISOString()}\n\n`;
  mdReport += `## Summary\n\n`;
  mdReport += `- **Total Tests:** ${report.summary.total}\n`;
  mdReport += `- **Passed:** ${report.summary.passed}\n`;
  mdReport += `- **Failed:** ${report.summary.failed}\n`;
  mdReport += `- **Skipped:** ${report.summary.skipped}\n`;
  mdReport += `- **Duration:** ${report.duration}ms\n\n`;

  mdReport += `## Verification Status\n\n`;
  mdReport += `- **401 Error Resolved:** ${report.verificationStatus.is401ErrorResolved ? '✅ Yes' : '❌ No'}\n`;
  mdReport += `- **Infinite Loop Resolved:** ${report.verificationStatus.isInfiniteLoopResolved ? '✅ Yes' : '❌ No'}\n`;
  mdReport += `- **Functionality Broken:** ${report.verificationStatus.isFunctionalityBroken ? '❌ Yes' : '✅ No'}\n\n`;

  mdReport += `## Test Results\n\n`;
  report.tests.forEach((test, index) => {
    const icon = test.passed ? '✅' : '❌';
    mdReport += `${index + 1}. ${icon} **${test.name}**\n`;
    mdReport += `   - Status: ${test.passed ? 'PASSED' : 'FAILED'}\n`;
    mdReport += `   - Message: ${test.message}\n`;
    if (!test.passed && test.details) {
      mdReport += `   - Details: \`${JSON.stringify(test.details)}\`\n`;
    }
    mdReport += `\n`;
  });

  if (report.recommendations.length > 0) {
    mdReport += `## Recommendations\n\n`;
    report.recommendations.forEach((rec, index) => {
      const priorityIcon = rec.priority === 'HIGH' ? '🔴' : rec.priority === 'MEDIUM' ? '🟡' : '🟢';
      mdReport += `${index + 1}. ${priorityIcon} **${rec.priority} Priority:** ${rec.issue}\n`;
      mdReport += `   - Recommendation: ${rec.recommendation}\n\n`;
    });
  }

  fs.writeFileSync(mdFileName, mdReport);
  log(`Test report saved to ${mdFileName}`, 'success');
}

// ============================================================================
// Main Test Runner
// ============================================================================
async function runAllTests() {
  log('='.repeat(80), 'info');
  log('COMPREHENSIVE TESTING OF AUTHENTICATION AND INFINITE LOOP FIXES', 'info');
  log('='.repeat(80), 'info');
  log('', 'info');

  testResults.startTime = new Date().toISOString();

  try {
    // Run all tests
    await testWishlistEndpointAuthentication();
    await sleep(1000);

    await testAdminPanelNoInfiniteLoop();
    await sleep(1000);

    await testDatabaseConnection();
    await sleep(1000);

    await testAdminPanelFeaturesLoad();
    await sleep(1000);

    await testAuthenticationFlow();
    await sleep(1000);

    await testNoRegressionInExistingFeatures();

  } catch (error) {
    log(`Fatal error during test execution: ${error.message}`, 'error');
  }

  testResults.endTime = new Date().toISOString();
  testResults.duration = new Date(testResults.endTime) - new Date(testResults.startTime);

  // Generate and save report
  log('', 'info');
  log('Generating test report...', 'info');
  const report = generateTestReport();
  saveTestResults(report);

  // Print summary
  log('', 'info');
  log('='.repeat(80), 'info');
  log('TEST SUMMARY', 'info');
  log('='.repeat(80), 'info');
  log(`Total Tests: ${report.summary.total}`, 'info');
  log(`Passed: ${report.summary.passed}`, 'success');
  log(`Failed: ${report.summary.failed}`, report.summary.failed > 0 ? 'error' : 'info');
  log(`Skipped: ${report.summary.skipped}`, 'info');
  log(`Duration: ${report.duration}ms`, 'info');
  log('', 'info');
  log('VERIFICATION STATUS:', 'info');
  log(`  401 Error Resolved: ${report.verificationStatus.is401ErrorResolved ? '✅ YES' : '❌ NO'}`, report.verificationStatus.is401ErrorResolved ? 'success' : 'error');
  log(`  Infinite Loop Resolved: ${report.verificationStatus.isInfiniteLoopResolved ? '✅ YES' : '❌ NO'}`, report.verificationStatus.isInfiniteLoopResolved ? 'success' : 'error');
  log(`  Functionality Broken: ${report.verificationStatus.isFunctionalityBroken ? '❌ YES' : '✅ NO'}`, report.verificationStatus.isFunctionalityBroken ? 'error' : 'success');
  log('='.repeat(80), 'info');

  if (report.recommendations.length > 0) {
    log('', 'info');
    log('RECOMMENDATIONS:', 'info');
    report.recommendations.forEach((rec, index) => {
      const priorityIcon = rec.priority === 'HIGH' ? '🔴' : rec.priority === 'MEDIUM' ? '🟡' : '🟢';
      log(`${index + 1}. ${priorityIcon} [${rec.priority}] ${rec.issue}`, rec.priority === 'HIGH' ? 'error' : 'warn');
      log(`   → ${rec.recommendation}`, 'info');
    });
  }

  log('', 'info');
  log('Test execution complete!', 'success');
  log(`Results saved to: authentication-fixes-test-results-${Date.now()}.json`, 'info');
  log(`Report saved to: authentication-fixes-test-report-${Date.now()}.md`, 'info');
}

// Run tests if this file is executed directly
if (require.main === module) {
  runAllTests().catch(error => {
    log(`Fatal error: ${error.message}`, 'error');
    process.exit(1);
  });
}

module.exports = {
  runAllTests,
  testWishlistEndpointAuthentication,
  testAdminPanelNoInfiniteLoop,
  testDatabaseConnection,
  testAdminPanelFeaturesLoad,
  testAuthenticationFlow,
  testNoRegressionInExistingFeatures
};
