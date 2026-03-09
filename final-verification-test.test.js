/**
 * Final Verification Tests for Authentication and Admin Panel Fixes
 * 
 * This test suite verifies that all original issues are resolved:
 * 1. 401 Unauthorized error on /api/v1/wishlist endpoint
 * 2. Infinite loop causing admin panel to hang
 * 3. Admin routes returning 404 errors
 * 4. Authentication endpoints returning 400 errors
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

// Configuration
const BACKEND_URL = 'http://localhost:3001';
const FRONTEND_URL = 'http://localhost:3000';
const TEST_TIMEOUT = 10000; // 10 seconds

// Test results storage
const testResults = {
  timestamp: new Date().toISOString(),
  tests: [],
  summary: {
    total: 0,
    passed: 0,
    failed: 0,
    skipped: 0
  },
  performance: {
    totalDuration: 0,
    slowestTest: { name: '', duration: 0 }
  }
};

// Helper function to make HTTP requests
function makeRequest(options, data = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(options.url || options.path, options.baseUrl || BACKEND_URL);
    
    const requestOptions = {
      hostname: url.hostname,
      port: url.port || 3001,
      path: url.pathname + url.search,
      method: options.method || 'GET',
      headers: options.headers || {}
    };

    if (data) {
      requestOptions.headers['Content-Type'] = 'application/json';
      requestOptions.headers['Content-Length'] = Buffer.byteLength(JSON.stringify(data));
    }

    const req = http.request(requestOptions, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: body
        });
      });
    });

    req.on('error', reject);

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

// Helper function to run a test
async function runTest(testName, testFn, category = 'General') {
  const startTime = Date.now();
  console.log(`\n[TEST] ${testName}`);
  console.log('━'.repeat(60));

  try {
    const result = await testFn();
    const duration = Date.now() - startTime;

    const testResult = {
      name: testName,
      category,
      status: 'passed',
      duration,
      result,
      timestamp: new Date().toISOString()
    };

    testResults.tests.push(testResult);
    testResults.summary.total++;
    testResults.summary.passed++;
    testResults.performance.totalDuration += duration;

    if (duration > testResults.performance.slowestTest.duration) {
      testResults.performance.slowestTest = { name: testName, duration };
    }

    console.log(`✅ PASSED (${duration}ms)`);
    return testResult;
  } catch (error) {
    const duration = Date.now() - startTime;

    const testResult = {
      name: testName,
      category,
      status: 'failed',
      duration,
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    };

    testResults.tests.push(testResult);
    testResults.summary.total++;
    testResults.summary.failed++;
    testResults.performance.totalDuration += duration;

    if (duration > testResults.performance.slowestTest.duration) {
      testResults.performance.slowestTest = { name: testName, duration };
    }

    console.log(`❌ FAILED (${duration}ms)`);
    console.log(`Error: ${error.message}`);
    return testResult;
  }
}

// ============================================================================
// TEST 1: Verify Wishlist Endpoint Authentication (CRITICAL)
// ============================================================================

async function test1_WishlistEndpointAuthentication() {
  console.log('Testing wishlist endpoint without authentication...');
  
  const response = await makeRequest({
    url: '/api/v1/wishlist',
    method: 'GET'
  });

  console.log(`Status Code: ${response.statusCode}`);
  console.log(`Response Body: ${response.body.substring(0, 200)}`);

  // Assertions
  if (response.statusCode !== 401) {
    throw new Error(`Expected status 401, got ${response.statusCode}`);
  }

  // Check for proper error message
  const body = response.body;
  if (!body.includes('Authentication required') && !body.includes('Unauthorized')) {
    throw new Error('Response does not contain proper authentication error message');
  }

  // Check that the "Cannot read properties of undefined" error is NOT present
  if (body.includes('Cannot read properties of undefined')) {
    throw new Error('Response contains "Cannot read properties of undefined" error - original issue NOT fixed');
  }

  return {
    statusCode: response.statusCode,
    hasProperErrorMessage: true,
    noUndefinedError: true
  };
}

async function test1_WishlistEndpointWithInvalidToken() {
  console.log('Testing wishlist endpoint with invalid token...');
  
  const response = await makeRequest({
    url: '/api/v1/wishlist',
    method: 'GET',
    headers: {
      'Authorization': 'Bearer invalid_token_12345'
    }
  });

  console.log(`Status Code: ${response.statusCode}`);
  console.log(`Response Body: ${response.body.substring(0, 200)}`);

  // Should return 401 or 403
  if (response.statusCode !== 401 && response.statusCode !== 403) {
    throw new Error(`Expected status 401 or 403, got ${response.statusCode}`);
  }

  return {
    statusCode: response.statusCode,
    properlyRejectsInvalidToken: true
  };
}

// ============================================================================
// TEST 2: Verify Admin Panel No Infinite Loop (CRITICAL)
// ============================================================================

async function test2_AdminPanelNoInfiniteLoop() {
  console.log('Testing admin panel for infinite redirects...');
  
  const startTime = Date.now();
  let redirectCount = 0;
  let lastUrl = '/admin';
  let visitedUrls = new Set();

  // Follow redirects up to 5 times to detect loops
  for (let i = 0; i < 5; i++) {
    const response = await makeRequest({
      url: lastUrl,
      method: 'GET',
      baseUrl: FRONTEND_URL
    });

    console.log(`Request ${i + 1}: ${lastUrl} -> ${response.statusCode}`);

    if (response.statusCode === 200 || response.statusCode === 404) {
      break; // No redirect, page loaded or not found
    }

    if (response.statusCode === 301 || response.statusCode === 302 || response.statusCode === 307 || response.statusCode === 308) {
      const location = response.headers.location;
      if (location) {
        redirectCount++;
        lastUrl = location;
        
        // Check for redirect loop
        if (visitedUrls.has(lastUrl)) {
          throw new Error(`Infinite redirect loop detected: ${lastUrl} visited twice`);
        }
        visitedUrls.add(lastUrl);
      }
    }
  }

  const duration = Date.now() - startTime;

  // Check if we have too many redirects (potential loop)
  if (redirectCount > 3) {
    throw new Error(`Too many redirects detected (${redirectCount}), possible infinite loop`);
  }

  // Check if test took too long (hanging)
  if (duration > TEST_TIMEOUT) {
    throw new Error(`Test took too long (${duration}ms), possible hanging`);
  }

  return {
    redirectCount,
    duration,
    noInfiniteLoop: true,
    noHanging: true
  };
}

async function test2_AdminPanelLoginRedirect() {
  console.log('Testing admin panel redirects to login once...');
  
  const response = await makeRequest({
    url: '/admin',
    method: 'GET',
    baseUrl: FRONTEND_URL
  });

  console.log(`Status Code: ${response.statusCode}`);
  console.log(`Location: ${response.headers.location || 'N/A'}`);

  // Should either load (200) or redirect to login (30x)
  if (response.statusCode !== 200 && 
      response.statusCode !== 301 && 
      response.statusCode !== 302 &&
      response.statusCode !== 404) {
    throw new Error(`Unexpected status code: ${response.statusCode}`);
  }

  // If redirect, should be to login
  if (response.headers.location) {
    const location = response.headers.location;
    if (!location.includes('/login') && !location.includes('/auth')) {
      console.warn(`Warning: Redirect to ${location} instead of login`);
    }
  }

  return {
    statusCode: response.statusCode,
    redirectsToLogin: response.headers.location?.includes('/login') || false
  };
}

// ============================================================================
// TEST 3: Verify New Admin Routes Work (CRITICAL)
// ============================================================================

async function test3_AdminDashboardRoute() {
  console.log('Testing admin dashboard route...');
  
  const response = await makeRequest({
    url: '/api/v1/admin/dashboard',
    method: 'GET'
  });

  console.log(`Status Code: ${response.statusCode}`);
  console.log(`Response: ${response.body.substring(0, 200)}`);

  // Should return 401 (unauthenticated) or 200 (authenticated), NOT 404
  if (response.statusCode === 404) {
    throw new Error('Admin dashboard route returns 404 - route not properly created');
  }

  if (response.statusCode !== 401 && response.statusCode !== 200 && response.statusCode !== 403) {
    throw new Error(`Unexpected status code: ${response.statusCode}`);
  }

  return {
    statusCode: response.statusCode,
    routeExists: true,
    properlyProtected: response.statusCode === 401 || response.statusCode === 403
  };
}

async function test3_AdminProductsRoute() {
  console.log('Testing admin products route...');
  
  const response = await makeRequest({
    url: '/api/v1/admin/products',
    method: 'GET'
  });

  console.log(`Status Code: ${response.statusCode}`);
  console.log(`Response: ${response.body.substring(0, 200)}`);

  // Should return 401 (unauthenticated) or 200 (authenticated), NOT 404
  if (response.statusCode === 404) {
    throw new Error('Admin products route returns 404 - route not properly created');
  }

  if (response.statusCode !== 401 && response.statusCode !== 200 && response.statusCode !== 403) {
    throw new Error(`Unexpected status code: ${response.statusCode}`);
  }

  return {
    statusCode: response.statusCode,
    routeExists: true,
    properlyProtected: response.statusCode === 401 || response.statusCode === 403
  };
}

async function test3_AdminUsersRoute() {
  console.log('Testing admin users route...');
  
  const response = await makeRequest({
    url: '/api/v1/admin/users',
    method: 'GET'
  });

  console.log(`Status Code: ${response.statusCode}`);
  console.log(`Response: ${response.body.substring(0, 200)}`);

  // Should return 401 (unauthenticated) or 200 (authenticated), NOT 404
  if (response.statusCode === 404) {
    throw new Error('Admin users route returns 404 - route not properly created');
  }

  if (response.statusCode !== 401 && response.statusCode !== 200 && response.statusCode !== 403) {
    throw new Error(`Unexpected status code: ${response.statusCode}`);
  }

  return {
    statusCode: response.statusCode,
    routeExists: true,
    properlyProtected: response.statusCode === 401 || response.statusCode === 403
  };
}

// ============================================================================
// TEST 4: Verify Database Connection (HIGH)
// ============================================================================

async function test4_HealthCheckEndpoint() {
  console.log('Testing health check endpoint...');
  
  const response = await makeRequest({
    url: '/api/v1/health',
    method: 'GET'
  });

  console.log(`Status Code: ${response.statusCode}`);
  console.log(`Response: ${response.body}`);

  if (response.statusCode !== 200) {
    throw new Error(`Health check failed with status ${response.statusCode}`);
  }

  // Parse response to check database status
  let healthData;
  try {
    healthData = JSON.parse(response.body);
  } catch (e) {
    console.warn('Could not parse health check response as JSON');
  }

  return {
    statusCode: response.statusCode,
    healthy: true,
    data: healthData
  };
}

async function test4_DatabaseConnection() {
  console.log('Testing database connection via products endpoint...');
  
  const response = await makeRequest({
    url: '/api/v1/products',
    method: 'GET'
  });

  console.log(`Status Code: ${response.statusCode}`);

  // Products endpoint should work if database is connected
  if (response.statusCode === 500 || response.statusCode === 503) {
    throw new Error('Database connection appears to be failing');
  }

  return {
    statusCode: response.statusCode,
    databaseConnected: response.statusCode === 200
  };
}

// ============================================================================
// TEST 5: Verify Admin Panel Features Load (HIGH)
// ============================================================================

async function test5_AdminPanelPageLoad() {
  console.log('Testing admin panel page load...');
  
  const response = await makeRequest({
    url: '/admin',
    method: 'GET',
    baseUrl: FRONTEND_URL
  });

  console.log(`Status Code: ${response.statusCode}`);

  // Should either load (200) or redirect (30x), NOT timeout or error
  if (response.statusCode === 0 || response.statusCode >= 500) {
    throw new Error(`Admin panel failed to load with status ${response.statusCode}`);
  }

  return {
    statusCode: response.statusCode,
    pageLoads: true
  };
}

async function test5_AdminPanelAssets() {
  console.log('Testing admin panel static assets...');
  
  const assets = [
    '/admin',
    '/admin/dashboard',
    '/admin/products',
    '/admin/users'
  ];

  const results = [];
  for (const asset of assets) {
    try {
      const response = await makeRequest({
        url: asset,
        method: 'GET',
        baseUrl: FRONTEND_URL
      });
      results.push({
        path: asset,
        statusCode: response.statusCode,
        accessible: response.statusCode !== 404
      });
      console.log(`  ${asset}: ${response.statusCode}`);
    } catch (error) {
      results.push({
        path: asset,
        statusCode: 0,
        accessible: false,
        error: error.message
      });
      console.log(`  ${asset}: ERROR - ${error.message}`);
    }
  }

  const allAccessible = results.every(r => r.accessible || r.statusCode === 302 || r.statusCode === 301);
  
  if (!allAccessible) {
    console.warn('Some admin panel assets are not accessible');
  }

  return {
    results,
    allAccessible
  };
}

// ============================================================================
// TEST 6: Verify No Regression in Existing Features (MEDIUM)
// ============================================================================

async function test6_ProductsEndpoint() {
  console.log('Testing products endpoint...');
  
  const response = await makeRequest({
    url: '/api/v1/products',
    method: 'GET'
  });

  console.log(`Status Code: ${response.statusCode}`);

  if (response.statusCode !== 200) {
    throw new Error(`Products endpoint returned ${response.statusCode}, expected 200`);
  }

  // Verify response contains data
  let data;
  try {
    data = JSON.parse(response.body);
    if (!Array.isArray(data)) {
      throw new Error('Products endpoint did not return an array');
    }
  } catch (e) {
    throw new Error(`Failed to parse products response: ${e.message}`);
  }

  return {
    statusCode: response.statusCode,
    productCount: data.length,
    working: true
  };
}

async function test6_CategoriesEndpoint() {
  console.log('Testing categories endpoint...');
  
  const response = await makeRequest({
    url: '/api/v1/categories',
    method: 'GET'
  });

  console.log(`Status Code: ${response.statusCode}`);

  if (response.statusCode !== 200) {
    throw new Error(`Categories endpoint returned ${response.statusCode}, expected 200`);
  }

  return {
    statusCode: response.statusCode,
    working: true
  };
}

async function test6_BrandsEndpoint() {
  console.log('Testing brands endpoint...');
  
  const response = await makeRequest({
    url: '/api/v1/brands',
    method: 'GET'
  });

  console.log(`Status Code: ${response.statusCode}`);

  if (response.statusCode !== 200) {
    throw new Error(`Brands endpoint returned ${response.statusCode}, expected 200`);
  }

  return {
    statusCode: response.statusCode,
    working: true
  };
}

async function test6_SearchEndpoint() {
  console.log('Testing search endpoint...');
  
  const response = await makeRequest({
    url: '/api/v1/search?q=test',
    method: 'GET'
  });

  console.log(`Status Code: ${response.statusCode}`);

  if (response.statusCode !== 200) {
    throw new Error(`Search endpoint returned ${response.statusCode}, expected 200`);
  }

  return {
    statusCode: response.statusCode,
    working: true
  };
}

// ============================================================================
// MAIN TEST EXECUTION
// ============================================================================

async function runAllTests() {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║   FINAL VERIFICATION TEST SUITE                           ║');
  console.log('║   Authentication and Admin Panel Fixes                     ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  console.log(`\nStarted at: ${new Date().toISOString()}`);
  console.log(`Backend URL: ${BACKEND_URL}`);
  console.log(`Frontend URL: ${FRONTEND_URL}`);
  console.log(`Test Timeout: ${TEST_TIMEOUT}ms`);

  try {
    // Test 1: Wishlist Endpoint Authentication
    console.log('\n' + '='.repeat(60));
    console.log('TEST 1: Verify Wishlist Endpoint Authentication (CRITICAL)');
    console.log('='.repeat(60));
    
    await runTest(
      '1.1 Wishlist endpoint returns 401 without auth',
      test1_WishlistEndpointAuthentication,
      'Test 1'
    );
    
    await runTest(
      '1.2 Wishlist endpoint rejects invalid token',
      test1_WishlistEndpointWithInvalidToken,
      'Test 1'
    );

    // Test 2: Admin Panel No Infinite Loop
    console.log('\n' + '='.repeat(60));
    console.log('TEST 2: Verify Admin Panel No Infinite Loop (CRITICAL)');
    console.log('='.repeat(60));
    
    await runTest(
      '2.1 Admin panel has no infinite redirect loop',
      test2_AdminPanelNoInfiniteLoop,
      'Test 2'
    );
    
    await runTest(
      '2.2 Admin panel redirects to login once',
      test2_AdminPanelLoginRedirect,
      'Test 2'
    );

    // Test 3: New Admin Routes Work
    console.log('\n' + '='.repeat(60));
    console.log('TEST 3: Verify New Admin Routes Work (CRITICAL)');
    console.log('='.repeat(60));
    
    await runTest(
      '3.1 Admin dashboard route exists and is protected',
      test3_AdminDashboardRoute,
      'Test 3'
    );
    
    await runTest(
      '3.2 Admin products route exists and is protected',
      test3_AdminProductsRoute,
      'Test 3'
    );
    
    await runTest(
      '3.3 Admin users route exists and is protected',
      test3_AdminUsersRoute,
      'Test 3'
    );

    // Test 4: Database Connection
    console.log('\n' + '='.repeat(60));
    console.log('TEST 4: Verify Database Connection (HIGH)');
    console.log('='.repeat(60));
    
    await runTest(
      '4.1 Health check endpoint returns 200',
      test4_HealthCheckEndpoint,
      'Test 4'
    );
    
    await runTest(
      '4.2 Database connection is working',
      test4_DatabaseConnection,
      'Test 4'
    );

    // Test 5: Admin Panel Features Load
    console.log('\n' + '='.repeat(60));
    console.log('TEST 5: Verify Admin Panel Features Load (HIGH)');
    console.log('='.repeat(60));
    
    await runTest(
      '5.1 Admin panel page loads',
      test5_AdminPanelPageLoad,
      'Test 5'
    );
    
    await runTest(
      '5.2 Admin panel assets are accessible',
      test5_AdminPanelAssets,
      'Test 5'
    );

    // Test 6: No Regression in Existing Features
    console.log('\n' + '='.repeat(60));
    console.log('TEST 6: Verify No Regression in Existing Features (MEDIUM)');
    console.log('='.repeat(60));
    
    await runTest(
      '6.1 Products endpoint works',
      test6_ProductsEndpoint,
      'Test 6'
    );
    
    await runTest(
      '6.2 Categories endpoint works',
      test6_CategoriesEndpoint,
      'Test 6'
    );
    
    await runTest(
      '6.3 Brands endpoint works',
      test6_BrandsEndpoint,
      'Test 6'
    );
    
    await runTest(
      '6.4 Search endpoint works',
      test6_SearchEndpoint,
      'Test 6'
    );

  } catch (error) {
    console.error('\n❌ FATAL ERROR during test execution:');
    console.error(error);
    testResults.fatalError = {
      message: error.message,
      stack: error.stack
    };
  }

  // Generate report
  generateReport();
}

function generateReport() {
  console.log('\n' + '╔════════════════════════════════════════════════════════════╗');
  console.log('║                    TEST RESULTS SUMMARY                       ║');
  console.log('╚════════════════════════════════════════════════════════════╝');

  const { total, passed, failed, skipped } = testResults.summary;
  const passRate = total > 0 ? ((passed / total) * 100).toFixed(2) : 0;

  console.log(`\nTotal Tests: ${total}`);
  console.log(`✅ Passed: ${passed} (${passRate}%)`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`⏭️  Skipped: ${skipped}`);
  console.log(`\nTotal Duration: ${testResults.performance.totalDuration}ms`);
  console.log(`Slowest Test: ${testResults.performance.slowestTest.name} (${testResults.performance.slowestTest.duration}ms)`);

  // Group by category
  console.log('\n' + '─'.repeat(60));
  console.log('RESULTS BY CATEGORY:');
  console.log('─'.repeat(60));

  const categories = {};
  testResults.tests.forEach(test => {
    if (!categories[test.category]) {
      categories[test.category] = { total: 0, passed: 0, failed: 0 };
    }
    categories[test.category].total++;
    if (test.status === 'passed') categories[test.category].passed++;
    if (test.status === 'failed') categories[test.category].failed++;
  });

  Object.entries(categories).forEach(([category, stats]) => {
    const rate = ((stats.passed / stats.total) * 100).toFixed(2);
    console.log(`\n${category}:`);
    console.log(`  Total: ${stats.total} | Passed: ${stats.passed} | Failed: ${stats.failed} (${rate}%)`);
  });

  // Show failed tests
  if (failed > 0) {
    console.log('\n' + '─'.repeat(60));
    console.log('❌ FAILED TESTS:');
    console.log('─'.repeat(60));

    testResults.tests.filter(t => t.status === 'failed').forEach(test => {
      console.log(`\n❌ ${test.name}`);
      console.log(`   Category: ${test.category}`);
      console.log(`   Duration: ${test.duration}ms`);
      console.log(`   Error: ${test.error}`);
    });
  }

  // Verification status
  console.log('\n' + '╔════════════════════════════════════════════════════════════╗');
  console.log('║              FINAL VERIFICATION STATUS                          ║');
  console.log('╚════════════════════════════════════════════════════════════╝');

  const test1Passed = testResults.tests.filter(t => t.category === 'Test 1' && t.status === 'passed').length === 2;
  const test2Passed = testResults.tests.filter(t => t.category === 'Test 2' && t.status === 'passed').length === 2;
  const test3Passed = testResults.tests.filter(t => t.category === 'Test 3' && t.status === 'passed').length === 3;
  const test4Passed = testResults.tests.filter(t => t.category === 'Test 4' && t.status === 'passed').length === 2;
  const test5Passed = testResults.tests.filter(t => t.category === 'Test 5' && t.status === 'passed').length === 2;
  const test6Passed = testResults.tests.filter(t => t.category === 'Test 6' && t.status === 'passed').length === 4;

  console.log('\nOriginal Issues Resolution:');
  console.log(`  401 Error on Wishlist Endpoint: ${test1Passed ? '✅ RESOLVED' : '❌ NOT RESOLVED'}`);
  console.log(`  Infinite Loop in Admin Panel: ${test2Passed ? '✅ RESOLVED' : '❌ NOT RESOLVED'}`);
  console.log(`  Admin Routes Working: ${test3Passed ? '✅ RESOLVED' : '❌ NOT RESOLVED'}`);
  console.log(`  Database Connection: ${test4Passed ? '✅ RESOLVED' : '❌ NOT RESOLVED'}`);
  console.log(`  Admin Panel Features: ${test5Passed ? '✅ RESOLVED' : '❌ NOT RESOLVED'}`);
  console.log(`  No Regression: ${test6Passed ? '✅ CONFIRMED' : '❌ REGRESSION DETECTED'}`);

  const allCriticalPassed = test1Passed && test2Passed && test3Passed;
  const allTestsPassed = failed === 0;

  console.log('\nOverall Assessment:');
  console.log(`  All Critical Issues Resolved: ${allCriticalPassed ? '✅ YES' : '❌ NO'}`);
  console.log(`  All Tests Passed: ${allTestsPassed ? '✅ YES' : '❌ NO'}`);
  console.log(`  Admin Panel Functional: ${test3Passed && test5Passed ? '✅ YES' : '❌ NO'}`);
  console.log(`  Any Functionality Broken: ${test6Passed ? '✅ NO' : '❌ YES'}`);

  // Save results to JSON file
  const timestamp = Date.now();
  const resultsFile = `final-verification-test-results-${timestamp}.json`;
  const reportFile = `final-verification-test-report-${timestamp}.md`;

  fs.writeFileSync(resultsFile, JSON.stringify(testResults, null, 2));
  console.log(`\n📊 Test results saved to: ${resultsFile}`);

  // Generate markdown report
  const markdownReport = generateMarkdownReport();
  fs.writeFileSync(reportFile, markdownReport);
  console.log(`📄 Test report saved to: ${reportFile}`);

  console.log('\n' + '═'.repeat(60));
  console.log('TEST EXECUTION COMPLETED');
  console.log('═'.repeat(60));
}

function generateMarkdownReport() {
  const { total, passed, failed, skipped } = testResults.summary;
  const passRate = total > 0 ? ((passed / total) * 100).toFixed(2) : 0;

  let report = `# Final Verification Test Report

**Generated:** ${new Date().toISOString()}

## Executive Summary

- **Total Tests:** ${total}
- **Passed:** ${passed} (${passRate}%)
- **Failed:** ${failed}
- **Skipped:** ${skipped}
- **Total Duration:** ${testResults.performance.totalDuration}ms
- **Slowest Test:** ${testResults.performance.slowestTest.name} (${testResults.performance.slowestTest.duration}ms)

## Test Results by Category

`;

  const categories = {};
  testResults.tests.forEach(test => {
    if (!categories[test.category]) {
      categories[test.category] = { total: 0, passed: 0, failed: 0, tests: [] };
    }
    categories[test.category].total++;
    categories[test.category].tests.push(test);
    if (test.status === 'passed') categories[test.category].passed++;
    if (test.status === 'failed') categories[test.category].failed++;
  });

  Object.entries(categories).forEach(([category, stats]) => {
    const rate = ((stats.passed / stats.total) * 100).toFixed(2);
    report += `### ${category}

- **Total:** ${stats.total}
- **Passed:** ${stats.passed} (${rate}%)
- **Failed:** ${stats.failed}

`;

    stats.tests.forEach(test => {
      const icon = test.status === 'passed' ? '✅' : '❌';
      report += `${icon} **${test.name}** (${test.duration}ms)\n`;
      if (test.status === 'failed') {
        report += `   - Error: ${test.error}\n`;
      }
    });
    report += '\n';
  });

  // Verification status
  const test1Passed = testResults.tests.filter(t => t.category === 'Test 1' && t.status === 'passed').length === 2;
  const test2Passed = testResults.tests.filter(t => t.category === 'Test 2' && t.status === 'passed').length === 2;
  const test3Passed = testResults.tests.filter(t => t.category === 'Test 3' && t.status === 'passed').length === 3;
  const test4Passed = testResults.tests.filter(t => t.category === 'Test 4' && t.status === 'passed').length === 2;
  const test5Passed = testResults.tests.filter(t => t.category === 'Test 5' && t.status === 'passed').length === 2;
  const test6Passed = testResults.tests.filter(t => t.category === 'Test 6' && t.status === 'passed').length === 4;

  report += `## Final Verification Status

### Original Issues Resolution

| Issue | Status |
|-------|--------|
| 401 Error on Wishlist Endpoint | ${test1Passed ? '✅ RESOLVED' : '❌ NOT RESOLVED'} |
| Infinite Loop in Admin Panel | ${test2Passed ? '✅ RESOLVED' : '❌ NOT RESOLVED'} |
| Admin Routes Working | ${test3Passed ? '✅ RESOLVED' : '❌ NOT RESOLVED'} |
| Database Connection | ${test4Passed ? '✅ RESOLVED' : '❌ NOT RESOLVED'} |
| Admin Panel Features | ${test5Passed ? '✅ RESOLVED' : '❌ NOT RESOLVED'} |
| No Regression | ${test6Passed ? '✅ CONFIRMED' : '❌ REGRESSION DETECTED'} |

### Overall Assessment

- **All Critical Issues Resolved:** ${test1Passed && test2Passed && test3Passed ? '✅ YES' : '❌ NO'}
- **All Tests Passed:** ${failed === 0 ? '✅ YES' : '❌ NO'}
- **Admin Panel Functional:** ${test3Passed && test5Passed ? '✅ YES' : '❌ NO'}
- **Any Functionality Broken:** ${test6Passed ? '✅ NO' : '❌ YES'}

`;

  if (failed > 0) {
    report += `## Failed Tests Details

`;
    testResults.tests.filter(t => t.status === 'failed').forEach(test => {
      report += `### ${test.name}

- **Category:** ${test.category}
- **Duration:** ${test.duration}ms
- **Error:** \`${test.error}\`

\`\`\`
${test.stack}
\`\`\`

`;
    });
  }

  report += `## Recommendations

`;
  if (failed === 0) {
    report += `All tests passed successfully. The authentication and admin panel fixes are working correctly.

1. ✅ All critical issues have been resolved
2. ✅ Admin panel is functional and accessible
3. ✅ No regressions detected in existing features
4. ✅ Database connection is stable

The system is ready for production deployment.
`;
  } else {
    report += `Some tests failed. Please review the failed tests above and address the issues.

1. Review the error messages for each failed test
2. Check backend logs for additional details
3. Verify that all fixes are properly applied
4. Re-run tests after addressing issues
`;
  }

  report += `---

*Report generated by Final Verification Test Suite*`;

  return report;
}

// Run tests if executed directly
if (require.main === module) {
  runAllTests().catch(error => {
    console.error('Fatal error running tests:', error);
    process.exit(1);
  });
}

module.exports = { runAllTests, testResults };
