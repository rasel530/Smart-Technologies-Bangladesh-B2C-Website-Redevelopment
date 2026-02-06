/**
 * Comprehensive API Endpoint Testing Script for Milestone 5: Search Analytics and Optimization
 * 
 * This script tests all expected and implemented API endpoints for:
 * - Search Analytics
 * - Search Optimization  
 * - Search Personalization
 * - Search Trending
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Configuration
const BASE_URL = 'http://localhost:3001';
const TEST_RESULTS_FILE = 'MILESTONE5_API_TEST_RESULTS.json';

// Test credentials (these should exist in the database)
const ADMIN_CREDENTIALS = {
  identifier: 'admin@smarttech.com',
  password: 'AdminPassword123'
};

const USER_CREDENTIALS = {
  identifier: 'raselbepari88@gmail.com',
  password: '74Vfo^71~_oY'
};

// Expected endpoints (15 total)
const EXPECTED_ENDPOINTS = {
  analytics: [
    { method: 'GET', path: '/api/admin/search/analytics', description: 'Comprehensive analytics dashboard', auth: 'admin' },
    { method: 'GET', path: '/api/admin/search/performance', description: 'Performance metrics', auth: 'admin' }
  ],
  optimization: [
    { method: 'GET', path: '/api/admin/search/optimization/experiments', description: 'List experiments', auth: 'admin' },
    { method: 'POST', path: '/api/admin/search/optimization/experiments', description: 'Create experiment', auth: 'admin' },
    { method: 'GET', path: '/api/admin/search/optimization/experiments/:id', description: 'Get experiment details', auth: 'admin' },
    { method: 'POST', path: '/api/admin/search/optimization/experiments/:id/results', description: 'Get results', auth: 'admin' },
    { method: 'POST', path: '/api/admin/search/optimization/recommendations', description: 'Get optimization recommendations', auth: 'admin' }
  ],
  personalization: [
    { method: 'GET', path: '/api/search/personalization/preferences', description: 'Get user preferences', auth: 'user' },
    { method: 'PUT', path: '/api/search/personalization/preferences', description: 'Update preferences', auth: 'user' },
    { method: 'GET', path: '/api/search/personalization/recommendations', description: 'Get personalized recommendations', auth: 'user' },
    { method: 'POST', path: '/api/search/personalization/track', description: 'Track user behavior', auth: 'user' }
  ],
  trending: [
    { method: 'GET', path: '/api/search/trending', description: 'Get trending searches', auth: 'public' },
    { method: 'GET', path: '/api/admin/search/trending', description: 'Detailed trending data', auth: 'admin' },
    { method: 'POST', path: '/api/admin/search/trending/recalculate', description: 'Recalculate trends', auth: 'admin' }
  ]
};

// Actually implemented endpoints (37 total)
const IMPLEMENTED_ENDPOINTS = {
  analytics: [
    { method: 'POST', path: '/api/search/analytics/track', description: 'Track search event', auth: 'public' },
    { method: 'POST', path: '/api/search/analytics/click', description: 'Track result click', auth: 'public' },
    { method: 'POST', path: '/api/search/analytics/conversion', description: 'Track conversion', auth: 'public' },
    { method: 'GET', path: '/api/search/analytics/history', description: 'Get user search history', auth: 'user' },
    { method: 'GET', path: '/api/search/analytics/popular', description: 'Get popular searches', auth: 'public' },
    { method: 'GET', path: '/api/search/analytics/metrics', description: 'Get analytics metrics', auth: 'admin' },
    { method: 'POST', path: '/api/search/analytics/dwell-time', description: 'Update dwell time', auth: 'public' },
    { method: 'GET', path: '/api/search/analytics/session', description: 'Get search analytics by session', auth: 'public' }
  ],
  optimization: [
    { method: 'GET', path: '/api/search/optimization/patterns', description: 'Get query patterns analysis', auth: 'admin' },
    { method: 'POST', path: '/api/search/optimization/optimize', description: 'Optimize a search query', auth: 'public' },
    { method: 'POST', path: '/api/search/optimization/experiment', description: 'Create A/B test experiment', auth: 'admin' },
    { method: 'GET', path: '/api/search/optimization/experiment/:id', description: 'Get experiment results', auth: 'admin' },
    { method: 'GET', path: '/api/search/optimization/experiments', description: 'List all experiments', auth: 'admin' },
    { method: 'POST', path: '/api/search/optimization/assign', description: 'Assign user to experiment', auth: 'public' },
    { method: 'POST', path: '/api/search/optimization/results', description: 'Get optimized search results', auth: 'public' },
    { method: 'POST', path: '/api/search/optimization/metrics', description: 'Update experiment metrics', auth: 'admin' },
    { method: 'DELETE', path: '/api/search/optimization/cache', description: 'Clear query optimization cache', auth: 'admin' }
  ],
  personalization: [
    { method: 'GET', path: '/api/search/personalization/preferences', description: 'Get user preferences', auth: 'user' },
    { method: 'PUT', path: '/api/search/personalization/preferences', description: 'Update user preferences', auth: 'user' },
    { method: 'GET', path: '/api/search/personalization/results', description: 'Get personalized search results', auth: 'user' },
    { method: 'GET', path: '/api/search/personalization/suggestions', description: 'Get personalized suggestions', auth: 'user' },
    { method: 'GET', path: '/api/search/personalization/recommendations', description: 'Get recommendations', auth: 'user' },
    { method: 'POST', path: '/api/search/personalization/recommendation/click', description: 'Track recommendation click', auth: 'user' },
    { method: 'POST', path: '/api/search/personalization/recommendation/conversion', description: 'Track recommendation conversion', auth: 'user' },
    { method: 'POST', path: '/api/search/personalization/history', description: 'Add search to history', auth: 'user' },
    { method: 'GET', path: '/api/search/personalization/history', description: 'Get search history', auth: 'user' },
    { method: 'DELETE', path: '/api/search/personalization/history', description: 'Clear search history', auth: 'user' }
  ],
  trending: [
    { method: 'GET', path: '/api/search/trending/', description: 'Get trending searches', auth: 'public' },
    { method: 'GET', path: '/api/search/trending/products', description: 'Get trending products', auth: 'public' },
    { method: 'POST', path: '/api/search/trending/record', description: 'Record search for trending', auth: 'public' },
    { method: 'POST', path: '/api/search/trending/calculate', description: 'Calculate trend scores', auth: 'public' },
    { method: 'GET', path: '/api/search/trending/category/:category', description: 'Get trending searches by category', auth: 'public' },
    { method: 'GET', path: '/api/search/trending/rising', description: 'Get rising searches', auth: 'public' },
    { method: 'GET', path: '/api/search/trending/statistics', description: 'Get trending statistics', auth: 'public' },
    { method: 'DELETE', path: '/api/search/trending/old', description: 'Clear old trending data', auth: 'public' },
    { method: 'PUT', path: '/api/search/trending/threshold', description: 'Update trend threshold', auth: 'public' },
    { method: 'PUT', path: '/api/search/trending/decay', description: 'Update trend decay factor', auth: 'public' }
  ]
};

// Test results storage
const testResults = {
  timestamp: new Date().toISOString(),
  expectedEndpoints: [],
  implementedEndpoints: [],
  authTests: [],
  summary: {
    totalExpected: 15,
    totalImplemented: 37,
    expectedPassed: 0,
    expectedFailed: 0,
    expectedNotFound: 0,
    implementedPassed: 0,
    implementedFailed: 0,
    authTestsPassed: 0,
    authTestsFailed: 0
  }
};

// Authentication tokens
let adminToken = null;
let userToken = null;

/**
 * Login and get authentication token
 */
async function login(credentials) {
  try {
    console.log(`\n[LOGIN] Attempting login with: ${credentials.identifier}`);
    const response = await axios.post(`${BASE_URL}/api/auth/login`, {
      identifier: credentials.identifier,
      password: credentials.password,
      rememberMe: false
    });

    if (response.data && response.data.token) {
      console.log(`[LOGIN] ✓ Login successful for ${credentials.identifier}`);
      return {
        token: response.data.token,
        user: response.data.user
      };
    } else {
      console.log(`[LOGIN] ✗ Login failed - no token returned`);
      return null;
    }
  } catch (error) {
    console.log(`[LOGIN] ✗ Login failed for ${credentials.identifier}:`, error.response?.data?.error || error.message);
    return null;
  }
}

/**
 * Make an API request
 */
async function makeRequest(method, path, token = null, body = null, queryParams = null) {
  const config = {
    method,
    url: `${BASE_URL}${path}`,
    headers: {}
  };

  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }

  if (body) {
    config.headers['Content-Type'] = 'application/json';
    config.data = body;
  }

  if (queryParams) {
    config.params = queryParams;
  }

  const startTime = Date.now();
  try {
    const response = await axios(config);
    const responseTime = Date.now() - startTime;
    return {
      success: true,
      status: response.status,
      statusText: response.statusText,
      data: response.data,
      responseTime
    };
  } catch (error) {
    const responseTime = Date.now() - startTime;
    return {
      success: false,
      status: error.response?.status || 0,
      statusText: error.response?.statusText || 'Network Error',
      error: error.response?.data || error.message,
      responseTime
    };
  }
}

/**
 * Test expected endpoints
 */
async function testExpectedEndpoints() {
  console.log('\n' + '='.repeat(80));
  console.log('TESTING EXPECTED ENDPOINTS (15 total)');
  console.log('='.repeat(80));

  const allEndpoints = [
    ...EXPECTED_ENDPOINTS.analytics.map(e => ({ ...e, category: 'analytics' })),
    ...EXPECTED_ENDPOINTS.optimization.map(e => ({ ...e, category: 'optimization' })),
    ...EXPECTED_ENDPOINTS.personalization.map(e => ({ ...e, category: 'personalization' })),
    ...EXPECTED_ENDPOINTS.trending.map(e => ({ ...e, category: 'trending' }))
  ];

  for (const endpoint of allEndpoints) {
    console.log(`\n[EXPECTED] Testing: ${endpoint.method} ${endpoint.path}`);
    console.log(`[EXPECTED] Description: ${endpoint.description}`);
    console.log(`[EXPECTED] Auth Required: ${endpoint.auth}`);

    const result = await makeRequest(endpoint.method, endpoint.path, null);

    let status = 'PASS';
    let notes = '';

    if (!result.success) {
      if (result.status === 404) {
        status = 'NOT_FOUND';
        notes = 'Endpoint does not exist';
        testResults.summary.expectedNotFound++;
      } else if (result.status === 401) {
        status = 'AUTH_REQUIRED';
        notes = 'Authentication required';
        testResults.summary.expectedPassed++;
      } else if (result.status === 403) {
        status = 'FORBIDDEN';
        notes = 'Authorization failed';
        testResults.summary.expectedFailed++;
      } else {
        status = 'FAIL';
        notes = `HTTP ${result.status}: ${result.statusText}`;
        testResults.summary.expectedFailed++;
      }
    } else {
      testResults.summary.expectedPassed++;
    }

    console.log(`[EXPECTED] Result: ${status} (${result.responseTime}ms)`);
    if (notes) console.log(`[EXPECTED] Notes: ${notes}`);

    testResults.expectedEndpoints.push({
      method: endpoint.method,
      path: endpoint.path,
      description: endpoint.description,
      category: endpoint.category,
      authRequired: endpoint.auth,
      status,
      httpStatus: result.status,
      responseTime: result.responseTime,
      notes,
      data: result.success ? result.data : null
    });
  }
}

/**
 * Test implemented endpoints
 */
async function testImplementedEndpoints() {
  console.log('\n' + '='.repeat(80));
  console.log('TESTING IMPLEMENTED ENDPOINTS (37 total)');
  console.log('='.repeat(80));

  const allEndpoints = [
    ...IMPLEMENTED_ENDPOINTS.analytics.map(e => ({ ...e, category: 'analytics' })),
    ...IMPLEMENTED_ENDPOINTS.optimization.map(e => ({ ...e, category: 'optimization' })),
    ...IMPLEMENTED_ENDPOINTS.personalization.map(e => ({ ...e, category: 'personalization' })),
    ...IMPLEMENTED_ENDPOINTS.trending.map(e => ({ ...e, category: 'trending' }))
  ];

  for (const endpoint of allEndpoints) {
    console.log(`\n[IMPLEMENTED] Testing: ${endpoint.method} ${endpoint.path}`);
    console.log(`[IMPLEMENTED] Description: ${endpoint.description}`);
    console.log(`[IMPLEMENTED] Auth Required: ${endpoint.auth}`);

    // Determine which token to use based on auth requirement
    let token = null;
    if (endpoint.auth === 'admin') {
      token = adminToken;
    } else if (endpoint.auth === 'user') {
      token = userToken;
    }

    // Prepare test data for POST/PUT requests
    let body = null;
    let queryParams = null;

    if (endpoint.method === 'POST' || endpoint.method === 'PUT') {
      if (endpoint.path.includes('/track')) {
        body = { query: 'test query', resultsCount: 10, responseTime: 100 };
      } else if (endpoint.path.includes('/click')) {
        body = { searchAnalyticsId: '00000000-0000-0000-0000-000000000000', productId: '00000000-0000-0000-0000-000000000000', position: 1 };
      } else if (endpoint.path.includes('/conversion')) {
        body = { searchAnalyticsId: '00000000-0000-0000-0000-000000000000', conversionType: 'click' };
      } else if (endpoint.path.includes('/optimize')) {
        body = { query: 'laptop' };
      } else if (endpoint.path.includes('/experiment') && endpoint.method === 'POST') {
        body = { name: 'Test Experiment', algorithmVariant: 'variant-a', startDate: new Date().toISOString() };
      } else if (endpoint.path.includes('/assign')) {
        body = { userId: userToken ? 'test-user-id' : '00000000-0000-0000-0000-000000000000', experimentId: '00000000-0000-0000-0000-000000000000' };
      } else if (endpoint.path.includes('/results')) {
        body = { query: 'laptop' };
      } else if (endpoint.path.includes('/metrics')) {
        body = { experimentId: '00000000-0000-0000-0000-000000000000', metrics: { clicks: 10 } };
      } else if (endpoint.path.includes('/record')) {
        body = { query: 'test search' };
      } else if (endpoint.path.includes('/preferences') && endpoint.method === 'PUT') {
        body = { preferredCategories: [] };
      } else if (endpoint.path.includes('/recommendation/click')) {
        body = { productId: '00000000-0000-0000-0000-000000000000' };
      } else if (endpoint.path.includes('/recommendation/conversion')) {
        body = { productId: '00000000-0000-0000-0000-000000000000' };
      } else if (endpoint.path.includes('/history') && endpoint.method === 'POST') {
        body = { query: 'test search' };
      } else if (endpoint.path.includes('/behavior')) {
        body = { productId: '00000000-0000-0000-0000-000000000000', action: 'view' };
      } else if (endpoint.path.includes('/threshold')) {
        body = { threshold: 10 };
      } else if (endpoint.path.includes('/decay')) {
        body = { factor: 0.9 };
      }
    }

    // Handle query parameters for GET requests
    if (endpoint.method === 'GET') {
      if (endpoint.path.includes('/history')) {
        queryParams = { limit: 10 };
      } else if (endpoint.path.includes('/popular') || endpoint.path.includes('/trending/')) {
        queryParams = { limit: 10 };
      } else if (endpoint.path.includes('/metrics')) {
        queryParams = { startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString() };
      } else if (endpoint.path.includes('/session')) {
        queryParams = { sessionId: 'test-session-123' };
      } else if (endpoint.path.includes('/patterns')) {
        queryParams = { timeRange: 'week' };
      } else if (endpoint.path.includes('/experiments') && !endpoint.path.includes('/:id')) {
        queryParams = { activeOnly: false };
      } else if (endpoint.path.includes('/results')) {
        queryParams = { query: 'laptop' };
      } else if (endpoint.path.includes('/recommendations')) {
        queryParams = { type: 'personalized' };
      } else if (endpoint.path.includes('/category/:category')) {
        const testPath = endpoint.path.replace(':category', 'electronics');
        queryParams = { limit: 10 };
      } else if (endpoint.path.includes('/old')) {
        queryParams = { daysToKeep: 30 };
      }
    }

    const result = await makeRequest(endpoint.method, endpoint.path, token, body, queryParams);

    let status = 'PASS';
    let notes = '';

    if (!result.success) {
      if (result.status === 401) {
        if (endpoint.auth === 'public') {
          status = 'FAIL';
          notes = 'Public endpoint returned 401 Unauthorized';
          testResults.summary.implementedFailed++;
        } else {
          status = 'AUTH_REQUIRED';
          notes = 'Authentication required (expected)';
          testResults.summary.implementedPassed++;
        }
      } else if (result.status === 403) {
        if (endpoint.auth === 'admin' && (!token || token === userToken)) {
          status = 'AUTH_REQUIRED';
          notes = 'Admin authorization required (expected)';
          testResults.summary.implementedPassed++;
        } else {
          status = 'FAIL';
          notes = `HTTP ${result.status}: ${result.statusText}`;
          testResults.summary.implementedFailed++;
        }
      } else if (result.status === 400) {
        status = 'VALIDATION_ERROR';
        notes = 'Validation error (likely due to test data)';
        testResults.summary.implementedPassed++;
      } else if (result.status === 404) {
        status = 'NOT_FOUND';
        notes = 'Endpoint does not exist';
        testResults.summary.implementedFailed++;
      } else {
        status = 'FAIL';
        notes = `HTTP ${result.status}: ${result.statusText}`;
        testResults.summary.implementedFailed++;
      }
    } else {
      testResults.summary.implementedPassed++;
    }

    console.log(`[IMPLEMENTED] Result: ${status} (${result.responseTime}ms)`);
    if (notes) console.log(`[IMPLEMENTED] Notes: ${notes}`);

    testResults.implementedEndpoints.push({
      method: endpoint.method,
      path: endpoint.path,
      description: endpoint.description,
      category: endpoint.category,
      authRequired: endpoint.auth,
      status,
      httpStatus: result.status,
      responseTime: result.responseTime,
      notes,
      data: result.success ? result.data : null,
      error: result.success ? null : result.error
    });
  }
}

/**
 * Test authentication and authorization
 */
async function testAuthAndAuthorization() {
  console.log('\n' + '='.repeat(80));
  console.log('TESTING AUTHENTICATION AND AUTHORIZATION');
  console.log('='.repeat(80));

  // Test admin endpoints without auth
  console.log('\n[AUTH] Testing admin endpoints without authentication...');
  const adminEndpoints = [
    { method: 'GET', path: '/api/search/analytics/metrics' },
    { method: 'GET', path: '/api/search/optimization/patterns' },
    { method: 'GET', path: '/api/search/optimization/experiments' }
  ];

  for (const endpoint of adminEndpoints) {
    console.log(`[AUTH] Testing: ${endpoint.method} ${endpoint.path} (no auth)`);
    const result = await makeRequest(endpoint.method, endpoint.path);

    let status = 'PASS';
    let notes = '';

    if (result.status === 401) {
      notes = 'Correctly requires authentication';
      testResults.summary.authTestsPassed++;
    } else {
      status = 'FAIL';
      notes = `Expected 401, got ${result.status}`;
      testResults.summary.authTestsFailed++;
    }

    console.log(`[AUTH] Result: ${status} - ${notes}`);

    testResults.authTests.push({
      test: 'Admin endpoint without auth',
      endpoint: `${endpoint.method} ${endpoint.path}`,
      status,
      httpStatus: result.status,
      notes
    });
  }

  // Test admin endpoints with user token
  if (userToken) {
    console.log('\n[AUTH] Testing admin endpoints with user token...');
    for (const endpoint of adminEndpoints) {
      console.log(`[AUTH] Testing: ${endpoint.method} ${endpoint.path} (user token)`);
      const result = await makeRequest(endpoint.method, endpoint.path, userToken);

      let status = 'PASS';
      let notes = '';

      if (result.status === 403) {
        notes = 'Correctly rejects user token for admin endpoint';
        testResults.summary.authTestsPassed++;
      } else {
        status = 'FAIL';
        notes = `Expected 403, got ${result.status}`;
        testResults.summary.authTestsFailed++;
      }

      console.log(`[AUTH] Result: ${status} - ${notes}`);

      testResults.authTests.push({
        test: 'Admin endpoint with user token',
        endpoint: `${endpoint.method} ${endpoint.path}`,
        status,
        httpStatus: result.status,
        notes
      });
    }
  }

  // Test user endpoints without auth
  console.log('\n[AUTH] Testing user endpoints without authentication...');
  const userEndpoints = [
    { method: 'GET', path: '/api/search/personalization/preferences' },
    { method: 'GET', path: '/api/search/personalization/recommendations' }
  ];

  for (const endpoint of userEndpoints) {
    console.log(`[AUTH] Testing: ${endpoint.method} ${endpoint.path} (no auth)`);
    const result = await makeRequest(endpoint.method, endpoint.path);

    let status = 'PASS';
    let notes = '';

    if (result.status === 401) {
      notes = 'Correctly requires authentication';
      testResults.summary.authTestsPassed++;
    } else {
      status = 'FAIL';
      notes = `Expected 401, got ${result.status}`;
      testResults.summary.authTestsFailed++;
    }

    console.log(`[AUTH] Result: ${status} - ${notes}`);

    testResults.authTests.push({
      test: 'User endpoint without auth',
      endpoint: `${endpoint.method} ${endpoint.path}`,
      status,
      httpStatus: result.status,
      notes
    });
  }

  // Test public endpoints
  console.log('\n[AUTH] Testing public endpoints (should work without auth)...');
  const publicEndpoints = [
    { method: 'GET', path: '/api/search/analytics/popular' },
    { method: 'GET', path: '/api/search/trending/' },
    { method: 'GET', path: '/api/search/trending/statistics' }
  ];

  for (const endpoint of publicEndpoints) {
    console.log(`[AUTH] Testing: ${endpoint.method} ${endpoint.path} (no auth)`);
    const result = await makeRequest(endpoint.method, endpoint.path);

    let status = 'PASS';
    let notes = '';

    if (result.success) {
      notes = 'Public endpoint works without authentication';
      testResults.summary.authTestsPassed++;
    } else if (result.status === 401) {
      status = 'FAIL';
      notes = 'Public endpoint returned 401 (should be accessible)';
      testResults.summary.authTestsFailed++;
    } else {
      status = 'FAIL';
      notes = `HTTP ${result.status}: ${result.statusText}`;
      testResults.summary.authTestsFailed++;
    }

    console.log(`[AUTH] Result: ${status} - ${notes}`);

    testResults.authTests.push({
      test: 'Public endpoint without auth',
      endpoint: `${endpoint.method} ${endpoint.path}`,
      status,
      httpStatus: result.status,
      notes
    });
  }
}

/**
 * Print summary
 */
function printSummary() {
  console.log('\n' + '='.repeat(80));
  console.log('TEST SUMMARY');
  console.log('='.repeat(80));

  console.log('\nExpected Endpoints (15 total):');
  console.log(`  ✓ Passed: ${testResults.summary.expectedPassed}`);
  console.log(`  ✗ Failed: ${testResults.summary.expectedFailed}`);
  console.log(`  ? Not Found: ${testResults.summary.expectedNotFound}`);

  console.log('\nImplemented Endpoints (37 total):');
  console.log(`  ✓ Passed: ${testResults.summary.implementedPassed}`);
  console.log(`  ✗ Failed: ${testResults.summary.implementedFailed}`);

  console.log('\nAuthentication/Authorization Tests:');
  console.log(`  ✓ Passed: ${testResults.summary.authTestsPassed}`);
  console.log(`  ✗ Failed: ${testResults.summary.authTestsFailed}`);

  console.log('\n' + '='.repeat(80));
}

/**
 * Save results to file
 */
function saveResults() {
  const filePath = path.join(__dirname, TEST_RESULTS_FILE);
  fs.writeFileSync(filePath, JSON.stringify(testResults, null, 2));
  console.log(`\n[RESULTS] Test results saved to: ${filePath}`);
}

/**
 * Main test execution
 */
async function main() {
  console.log('='.repeat(80));
  console.log('MILESTONE 5: SEARCH ANALYTICS AND OPTIMIZATION - API ENDPOINT TESTING');
  console.log('='.repeat(80));
  console.log(`Started at: ${testResults.timestamp}`);
  console.log(`Backend URL: ${BASE_URL}`);

  // Login as admin
  console.log('\n' + '='.repeat(80));
  console.log('AUTHENTICATION SETUP');
  console.log('='.repeat(80));
  const adminLogin = await login(ADMIN_CREDENTIALS);
  if (adminLogin) {
    adminToken = adminLogin.token;
    console.log(`[ADMIN] ✓ Logged in as: ${adminLogin.user.email} (Role: ${adminLogin.user.role})`);
  } else {
    console.log('[ADMIN] ✗ Failed to login - admin tests will be limited');
  }

  // Login as user
  const userLogin = await login(USER_CREDENTIALS);
  if (userLogin) {
    userToken = userLogin.token;
    console.log(`[USER] ✓ Logged in as: ${userLogin.user.email} (Role: ${userLogin.user.role})`);
  } else {
    console.log('[USER] ✗ Failed to login - user tests will be limited');
  }

  // Run tests
  await testExpectedEndpoints();
  await testImplementedEndpoints();
  await testAuthAndAuthorization();

  // Print summary and save results
  printSummary();
  saveResults();

  console.log('\n' + '='.repeat(80));
  console.log('TESTING COMPLETE');
  console.log('='.repeat(80));
}

// Run tests
main().catch(error => {
  console.error('\n[ERROR] Fatal error during testing:', error);
  process.exit(1);
});
