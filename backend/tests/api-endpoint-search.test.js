/**
 * Comprehensive API Endpoint Test Script for Phase 5 Milestone 2 Search Functionality
 * 
 * This script tests all 7 API endpoints (4 public, 3 admin) for search functionality
 * and generates a detailed report with response times and status codes.
 */

const http = require('http');

// Configuration
const BASE_URL = 'localhost';
const PORT = 3001;
const BASE_API_URL = `http://${BASE_URL}:${PORT}`;

// Test results storage
const testResults = {
  publicEndpoints: [],
  adminEndpoints: [],
  summary: {
    totalTests: 0,
    passed: 0,
    failed: 0,
    successRate: 0
  }
};

// Helper function to make HTTP requests
function makeRequest(method, path, headers = {}, body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_API_URL);
    const options = {
      hostname: url.hostname,
      port: url.port || PORT,
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };

    const req = http.request(options, (res) => {
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
            body: jsonData,
            rawBody: data
          });
        } catch (error) {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: null,
            rawBody: data,
            parseError: error.message
          });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (body) {
      req.write(JSON.stringify(body));
    }

    req.end();
  });
}

// Helper function to measure response time
async function measureRequest(method, path, headers = {}, body = null, testName) {
  const startTime = Date.now();
  try {
    const response = await makeRequest(method, path, headers, body);
    const endTime = Date.now();
    const responseTime = endTime - startTime;

    return {
      testName,
      method,
      path,
      statusCode: response.statusCode,
      responseTime,
      success: response.statusCode >= 200 && response.statusCode < 300,
      body: response.body,
      rawBody: response.rawBody
    };
  } catch (error) {
    const endTime = Date.now();
    const responseTime = endTime - startTime;

    return {
      testName,
      method,
      path,
      statusCode: 0,
      responseTime,
      success: false,
      error: error.message
    };
  }
}

// Helper function to print test result
function printTestResult(result) {
  const status = result.success ? '✓ PASS' : '✗ FAIL';
  const statusColor = result.success ? '\x1b[32m' : '\x1b[31m';
  const resetColor = '\x1b[0m';
  
  console.log(`${statusColor}${status}${resetColor} - ${result.testName}`);
  console.log(`  Method: ${result.method}`);
  console.log(`  Path: ${result.path}`);
  console.log(`  Status Code: ${result.statusCode}`);
  console.log(`  Response Time: ${result.responseTime}ms`);
  
  if (!result.success) {
    console.log(`  Error: ${result.error || 'Request failed'}`);
    if (result.rawBody) {
      console.log(`  Response Body: ${result.rawBody.substring(0, 200)}...`);
    }
  }
  
  console.log('');
}

// ============================================
// PUBLIC SEARCH ENDPOINTS TESTS
// ============================================

async function testPublicSearchEndpoints() {
  console.log('\n========================================');
  console.log('TESTING PUBLIC SEARCH ENDPOINTS (4)');
  console.log('========================================\n');

  // Test 1: GET /api/search/products - Basic search
  console.log('Test 1: GET /api/search/products - Basic search with query');
  const result1 = await measureRequest(
    'GET',
    '/api/search/products?query=phone',
    {},
    null,
    'Products search with query "phone"'
  );
  testResults.publicEndpoints.push(result1);
  printTestResult(result1);

  // Test 2: GET /api/search/products - Empty results
  console.log('Test 2: GET /api/search/products - Search with no results');
  const result2 = await measureRequest(
    'GET',
    '/api/search/products?query=xyznonexistentproduct123',
    {},
    null,
    'Products search with no results'
  );
  testResults.publicEndpoints.push(result2);
  printTestResult(result2);

  // Test 3: GET /api/search/products - With filters
  console.log('Test 3: GET /api/search/products - Search with filters');
  const result3 = await measureRequest(
    'GET',
    '/api/search/products?query=phone&inStock=true&sort[field]=price&sort[order]=asc&page=1&perPage=10',
    {},
    null,
    'Products search with filters'
  );
  testResults.publicEndpoints.push(result3);
  printTestResult(result3);

  // Test 4: GET /api/search/products - With facets
  console.log('Test 4: GET /api/search/products - Search with facets');
  const result4 = await measureRequest(
    'GET',
    '/api/search/products?query=phone&facets[]=categories&facets[]=brands',
    {},
    null,
    'Products search with facets'
  );
  testResults.publicEndpoints.push(result4);
  printTestResult(result4);

  // Test 5: GET /api/search/autocomplete - Valid query
  console.log('Test 5: GET /api/search/autocomplete - Autocomplete with valid query');
  const result5 = await measureRequest(
    'GET',
    '/api/search/autocomplete?query=ph&limit=10&language=en',
    {},
    null,
    'Autocomplete with query "ph"'
  );
  testResults.publicEndpoints.push(result5);
  printTestResult(result5);

  // Test 6: GET /api/search/autocomplete - Empty query (should fail validation)
  console.log('Test 6: GET /api/search/autocomplete - Empty query (should fail validation)');
  const result6 = await measureRequest(
    'GET',
    '/api/search/autocomplete?query=',
    {},
    null,
    'Autocomplete with empty query (should fail)'
  );
  testResults.publicEndpoints.push(result6);
  printTestResult(result6);

  // Test 7: GET /api/search/suggestions - Valid query
  console.log('Test 7: GET /api/search/suggestions - Search suggestions with valid query');
  const result7 = await measureRequest(
    'GET',
    '/api/search/suggestions?query=phone',
    {},
    null,
    'Search suggestions with query "phone"'
  );
  testResults.publicEndpoints.push(result7);
  printTestResult(result7);

  // Test 8: GET /api/search/suggestions - Empty query (should fail validation)
  console.log('Test 8: GET /api/search/suggestions - Empty query (should fail validation)');
  const result8 = await measureRequest(
    'GET',
    '/api/search/suggestions?query=',
    {},
    null,
    'Search suggestions with empty query (should fail)'
  );
  testResults.publicEndpoints.push(result8);
  printTestResult(result8);

  // Test 9: GET /api/search/popular - Without parameters
  console.log('Test 9: GET /api/search/popular - Popular searches without parameters');
  const result9 = await measureRequest(
    'GET',
    '/api/search/popular',
    {},
    null,
    'Popular searches without parameters'
  );
  testResults.publicEndpoints.push(result9);
  printTestResult(result9);

  // Test 10: GET /api/search/popular - With limit and period
  console.log('Test 10: GET /api/search/popular - Popular searches with limit and period');
  const result10 = await measureRequest(
    'GET',
    '/api/search/popular?limit=5&period=week',
    {},
    null,
    'Popular searches with limit=5, period=week'
  );
  testResults.publicEndpoints.push(result10);
  printTestResult(result10);

  // Test 11: GET /api/search/popular - With period=all
  console.log('Test 11: GET /api/search/popular - Popular searches with period=all');
  const result11 = await measureRequest(
    'GET',
    '/api/search/popular?limit=10&period=all',
    {},
    null,
    'Popular searches with period=all'
  );
  testResults.publicEndpoints.push(result11);
  printTestResult(result11);
}

// ============================================
// ADMIN SEARCH ENDPOINTS TESTS
// ============================================

async function testAdminSearchEndpoints(adminToken) {
  console.log('\n========================================');
  console.log('TESTING ADMIN SEARCH ENDPOINTS (3)');
  console.log('========================================\n');

  // Test 12: GET /api/admin/search/analytics - Without authentication (should fail)
  console.log('Test 12: GET /api/admin/search/analytics - Without authentication (should fail)');
  const result12 = await measureRequest(
    'GET',
    '/api/admin/search/analytics',
    {},
    null,
    'Admin analytics without authentication (should fail)'
  );
  testResults.adminEndpoints.push(result12);
  printTestResult(result12);

  // Test 13: GET /api/admin/search/analytics - With authentication
  if (adminToken) {
    console.log('Test 13: GET /api/admin/search/analytics - With authentication');
    const result13 = await measureRequest(
      'GET',
      '/api/admin/search/analytics',
      { 'Authorization': `Bearer ${adminToken}` },
      null,
      'Admin analytics with authentication'
    );
    testResults.adminEndpoints.push(result13);
    printTestResult(result13);

    // Test 14: GET /api/admin/search/analytics - With date range and grouping
    console.log('Test 14: GET /api/admin/search/analytics - With date range and grouping');
    const startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const endDate = new Date().toISOString();
    const result14 = await measureRequest(
      'GET',
      `/api/admin/search/analytics?startDate=${startDate}&endDate=${endDate}&groupBy=day`,
      { 'Authorization': `Bearer ${adminToken}` },
      null,
      'Admin analytics with date range and grouping'
    );
    testResults.adminEndpoints.push(result14);
    printTestResult(result14);
  } else {
    console.log('\n⚠ WARNING: No admin token available. Skipping authenticated admin tests.\n');
  }

  // Test 15: GET /api/admin/search/popular - Without authentication (should fail)
  console.log('Test 15: GET /api/admin/search/popular - Without authentication (should fail)');
  const result15 = await measureRequest(
    'GET',
    '/api/admin/search/popular',
    {},
    null,
    'Admin popular searches without authentication (should fail)'
  );
  testResults.adminEndpoints.push(result15);
  printTestResult(result15);

  // Test 16: GET /api/admin/search/popular - With authentication
  if (adminToken) {
    console.log('Test 16: GET /api/admin/search/popular - With authentication');
    const result16 = await measureRequest(
      'GET',
      '/api/admin/search/popular?limit=20&period=month',
      { 'Authorization': `Bearer ${adminToken}` },
      null,
      'Admin popular searches with authentication'
    );
    testResults.adminEndpoints.push(result16);
    printTestResult(result16);
  }

  // Test 17: GET /api/admin/search/performance - Without authentication (should fail)
  console.log('Test 17: GET /api/admin/search/performance - Without authentication (should fail)');
  const result17 = await measureRequest(
    'GET',
    '/api/admin/search/performance',
    {},
    null,
    'Admin performance metrics without authentication (should fail)'
  );
  testResults.adminEndpoints.push(result17);
  printTestResult(result17);

  // Test 18: GET /api/admin/search/performance - With authentication
  if (adminToken) {
    console.log('Test 18: GET /api/admin/search/performance - With authentication');
    const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const endDate = new Date().toISOString();
    const result18 = await measureRequest(
      'GET',
      `/api/admin/search/performance?startDate=${startDate}&endDate=${endDate}`,
      { 'Authorization': `Bearer ${adminToken}` },
      null,
      'Admin performance metrics with authentication'
    );
    testResults.adminEndpoints.push(result18);
    printTestResult(result18);
  }
}

// ============================================
// HELPER FUNCTIONS
// ============================================

// Function to get admin token
async function getAdminToken() {
  console.log('\n========================================');
  console.log('GETTING ADMIN TOKEN');
  console.log('========================================\n');

  try {
    // Try to login with admin credentials
    const loginResponse = await makeRequest(
      'POST',
      '/api/v1/auth/login',
      {},
      {
        email: 'admin@smarttechnologies-bd.com',
        password: 'admin123456'
      }
    );

    if (loginResponse.statusCode === 200 && loginResponse.body && loginResponse.body.token) {
      console.log('✓ Admin login successful');
      console.log(`  Token: ${loginResponse.body.token.substring(0, 50)}...\n`);
      return loginResponse.body.token;
    } else {
      console.log('✗ Admin login failed');
      console.log(`  Status: ${loginResponse.statusCode}`);
      console.log(`  Response: ${JSON.stringify(loginResponse.body, null, 2)}\n`);
      return null;
    }
  } catch (error) {
    console.log('✗ Admin login error:', error.message);
    console.log('⚠ Continuing with unauthenticated admin tests...\n');
    return null;
  }
}

// Function to calculate summary
function calculateSummary() {
  const allResults = [...testResults.publicEndpoints, ...testResults.adminEndpoints];
  
  testResults.summary.totalTests = allResults.length;
  testResults.summary.passed = allResults.filter(r => r.success).length;
  testResults.summary.failed = allResults.filter(r => !r.success).length;
  testResults.summary.successRate = (testResults.summary.passed / testResults.summary.totalTests * 100).toFixed(2);
}

// Function to print summary
function printSummary() {
  console.log('\n========================================');
  console.log('TEST SUMMARY');
  console.log('========================================\n');
  console.log(`Total Tests: ${testResults.summary.totalTests}`);
  console.log(`Passed: ${testResults.summary.passed}`);
  console.log(`Failed: ${testResults.summary.failed}`);
  console.log(`Success Rate: ${testResults.summary.successRate}%`);
  console.log('');

  // Print endpoint breakdown
  console.log('Public Endpoints:');
  testResults.publicEndpoints.forEach((result, index) => {
    const status = result.success ? '✓' : '✗';
    console.log(`  ${status} ${result.testName} (${result.responseTime}ms)`);
  });

  console.log('\nAdmin Endpoints:');
  testResults.adminEndpoints.forEach((result, index) => {
    const status = result.success ? '✓' : '✗';
    console.log(`  ${status} ${result.testName} (${result.responseTime}ms)`);
  });

  console.log('');

  // Check response time requirements
  console.log('Response Time Analysis:');
  const productsSearch = testResults.publicEndpoints.filter(r => r.path.includes('/api/search/products'));
  const autocomplete = testResults.publicEndpoints.filter(r => r.path.includes('/api/search/autocomplete'));
  const suggestions = testResults.publicEndpoints.filter(r => r.path.includes('/api/search/suggestions'));
  const popular = testResults.publicEndpoints.filter(r => r.path.includes('/api/search/popular'));
  const adminEndpoints = testResults.adminEndpoints;

  const avgProductsTime = productsSearch.length > 0 
    ? (productsSearch.reduce((sum, r) => sum + r.responseTime, 0) / productsSearch.length).toFixed(2) 
    : 'N/A';
  const avgAutocompleteTime = autocomplete.length > 0 
    ? (autocomplete.reduce((sum, r) => sum + r.responseTime, 0) / autocomplete.length).toFixed(2) 
    : 'N/A';
  const avgSuggestionsTime = suggestions.length > 0 
    ? (suggestions.reduce((sum, r) => sum + r.responseTime, 0) / suggestions.length).toFixed(2) 
    : 'N/A';
  const avgPopularTime = popular.length > 0 
    ? (popular.reduce((sum, r) => sum + r.responseTime, 0) / popular.length).toFixed(2) 
    : 'N/A';
  const avgAdminTime = adminEndpoints.length > 0 
    ? (adminEndpoints.reduce((sum, r) => sum + r.responseTime, 0) / adminEndpoints.length).toFixed(2) 
    : 'N/A';

  console.log(`  Products Search: ${avgProductsTime}ms (requirement: <300ms)`);
  console.log(`  Autocomplete: ${avgAutocompleteTime}ms (requirement: <100ms)`);
  console.log(`  Suggestions: ${avgSuggestionsTime}ms (requirement: <300ms)`);
  console.log(`  Popular Searches: ${avgPopularTime}ms (requirement: <300ms)`);
  console.log(`  Admin Endpoints: ${avgAdminTime}ms (requirement: <300ms)`);
  console.log('');
}

// Function to save results to file
function saveResultsToFile() {
  const fs = require('fs');
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `backend/api-endpoint-test-results-${timestamp}.json`;

  const results = {
    timestamp: new Date().toISOString(),
    summary: testResults.summary,
    publicEndpoints: testResults.publicEndpoints,
    adminEndpoints: testResults.adminEndpoints
  };

  fs.writeFileSync(filename, JSON.stringify(results, null, 2));
  console.log(`\n✓ Test results saved to: ${filename}\n`);
}

// ============================================
// MAIN EXECUTION
// ============================================

async function main() {
  console.log('\n╔════════════════════════════════════════════════════════════════╗');
  console.log('║  API ENDPOINT TEST - PHASE 5 MILESTONE 2 SEARCH FUNCTIONALITY  ║');
  console.log('╚════════════════════════════════════════════════════════════════╝\n');
  console.log(`Base URL: ${BASE_API_URL}`);
  console.log(`Started at: ${new Date().toISOString()}\n`);

  try {
    // Test public endpoints
    await testPublicSearchEndpoints();

    // Get admin token
    const adminToken = await getAdminToken();

    // Test admin endpoints
    await testAdminSearchEndpoints(adminToken);

    // Calculate summary
    calculateSummary();

    // Print summary
    printSummary();

    // Save results to file
    saveResultsToFile();

    // Exit with appropriate code
    process.exit(testResults.summary.failed > 0 ? 1 : 0);

  } catch (error) {
    console.error('\n✗ Fatal error during testing:', error);
    process.exit(1);
  }
}

// Run tests
main();
