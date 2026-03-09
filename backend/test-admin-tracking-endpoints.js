/**
 * Test Script for Admin Tracking Analytics Endpoint
 * 
 * This script tests all 5 newly created admin tracking endpoints:
 * 1. GET /api/v1/admin/tracking/analytics
 * 2. GET /api/v1/admin/tracking/issues
 * 3. GET /api/v1/admin/tracking/performance
 * 4. POST /api/v1/admin/tracking/sync-all
 * 5. POST /api/v1/admin/tracking/bulk-update
 */

const http = require('http');

// Configuration
const BASE_URL = 'http://localhost:3001';
const ENDPOINTS = {
  analytics: '/api/v1/admin/tracking/analytics',
  issues: '/api/v1/admin/tracking/issues',
  performance: '/api/v1/admin/tracking/performance',
  syncAll: '/api/v1/admin/tracking/sync-all',
  bulkUpdate: '/api/v1/admin/tracking/bulk-update'
};

// Test results storage
const testResults = {
  analytics: [],
  issues: [],
  performance: [],
  syncAll: [],
  bulkUpdate: []
};

// Helper function to make HTTP requests
function makeRequest(method, path, data = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
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
          const jsonData = body ? JSON.parse(body) : null;
          resolve({
            statusCode: res.statusCode,
            statusMessage: res.statusMessage,
            headers: res.headers,
            data: jsonData
          });
        } catch (error) {
          resolve({
            statusCode: res.statusCode,
            statusMessage: res.statusMessage,
            headers: res.headers,
            data: body,
            parseError: error.message
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

// Test 1: Test endpoint accessibility (no authentication)
async function testEndpointAccessibility() {
  console.log('\n=== Test 1: Endpoint Accessibility (No Authentication) ===\n');
  
  const endpoints = [
    { name: 'analytics', path: ENDPOINTS.analytics },
    { name: 'issues', path: ENDPOINTS.issues },
    { name: 'performance', path: ENDPOINTS.performance },
    { name: 'syncAll', path: ENDPOINTS.syncAll, method: 'POST' },
    { name: 'bulkUpdate', path: ENDPOINTS.bulkUpdate, method: 'POST' }
  ];

  for (const endpoint of endpoints) {
    const method = endpoint.method || 'GET';
    try {
      const response = await makeRequest(method, endpoint.path);
      testResults[endpoint.name].push({
        test: 'Accessibility (No Auth)',
        method,
        url: BASE_URL + endpoint.path,
        statusCode: response.statusCode,
        success: response.statusCode !== 404,
        data: response.data
      });
      
      console.log(`✓ ${endpoint.name.toUpperCase()} (${method})`);
      console.log(`  URL: ${BASE_URL}${endpoint.path}`);
      console.log(`  Status: ${response.statusCode} ${response.statusMessage}`);
      console.log(`  Accessible: ${response.statusCode !== 404 ? 'YES' : 'NO (404)'}`);
      
      if (response.statusCode === 404) {
        console.log(`  Available endpoints in response:`, response.data?.availableEndpoints?.tracking || 'N/A');
      } else if (response.statusCode === 401 || response.statusCode === 403) {
        console.log(`  Auth Required: YES (Expected)`);
      }
      console.log('');
    } catch (error) {
      testResults[endpoint.name].push({
        test: 'Accessibility (No Auth)',
        method,
        url: BASE_URL + endpoint.path,
        statusCode: 'ERROR',
        success: false,
        error: error.message
      });
      console.log(`✗ ${endpoint.name.toUpperCase()} (${method})`);
      console.log(`  Error: ${error.message}`);
      console.log('');
    }
  }
}

// Test 2: Test with query parameters
async function testQueryParameters() {
  console.log('\n=== Test 2: Query Parameters (No Auth) ===\n');
  
  const testCases = [
    {
      endpoint: 'analytics',
      path: ENDPOINTS.analytics,
      params: '?startDate=2025-01-01&endDate=2025-12-31'
    },
    {
      endpoint: 'analytics',
      path: ENDPOINTS.analytics,
      params: '?startDate=2025-01-01'
    },
    {
      endpoint: 'issues',
      path: ENDPOINTS.issues,
      params: '?status=pending&startDate=2025-01-01'
    },
    {
      endpoint: 'performance',
      path: ENDPOINTS.performance,
      params: '?startDate=2025-01-01&endDate=2025-12-31'
    }
  ];

  for (const testCase of testCases) {
    try {
      const response = await makeRequest('GET', testCase.path + testCase.params);
      testResults[testCase.endpoint].push({
        test: 'Query Parameters',
        url: BASE_URL + testCase.path + testCase.params,
        statusCode: response.statusCode,
        success: response.statusCode !== 404,
        data: response.data
      });
      
      console.log(`✓ ${testCase.endpoint.toUpperCase()} with params`);
      console.log(`  URL: ${BASE_URL}${testCase.path}${testCase.params}`);
      console.log(`  Status: ${response.statusCode} ${response.statusMessage}`);
      console.log(`  Accessible: ${response.statusCode !== 404 ? 'YES' : 'NO (404)'}`);
      console.log('');
    } catch (error) {
      testResults[testCase.endpoint].push({
        test: 'Query Parameters',
        url: BASE_URL + testCase.path + testCase.params,
        statusCode: 'ERROR',
        success: false,
        error: error.message
      });
      console.log(`✗ ${testCase.endpoint.toUpperCase()} with params`);
      console.log(`  Error: ${error.message}`);
      console.log('');
    }
  }
}

// Test 3: Test POST endpoints with data
async function testPostEndpoints() {
  console.log('\n=== Test 3: POST Endpoints (No Auth) ===\n');
  
  // Test sync-all endpoint
  try {
    const response = await makeRequest('POST', ENDPOINTS.syncAll, {});
    testResults.syncAll.push({
      test: 'POST with empty body',
      url: BASE_URL + ENDPOINTS.syncAll,
      statusCode: response.statusCode,
      success: response.statusCode !== 404,
      data: response.data
    });
    
    console.log('✓ SYNC-ALL (POST)');
    console.log(`  URL: ${BASE_URL}${ENDPOINTS.syncAll}`);
    console.log(`  Status: ${response.statusCode} ${response.statusMessage}`);
    console.log(`  Accessible: ${response.statusCode !== 404 ? 'YES' : 'NO (404)'}`);
    console.log('');
  } catch (error) {
    testResults.syncAll.push({
      test: 'POST with empty body',
      url: BASE_URL + ENDPOINTS.syncAll,
      statusCode: 'ERROR',
      success: false,
      error: error.message
    });
    console.log('✗ SYNC-ALL (POST)');
    console.log(`  Error: ${error.message}`);
    console.log('');
  }

  // Test sync-all with courierServiceId
  try {
    const response = await makeRequest('POST', ENDPOINTS.syncAll, {
      courierServiceId: '00000000-0000-0000-0000-000000000000'
    });
    testResults.syncAll.push({
      test: 'POST with courierServiceId',
      url: BASE_URL + ENDPOINTS.syncAll,
      statusCode: response.statusCode,
      success: response.statusCode !== 404,
      data: response.data
    });
    
    console.log('✓ SYNC-ALL with courierServiceId (POST)');
    console.log(`  URL: ${BASE_URL}${ENDPOINTS.syncAll}`);
    console.log(`  Status: ${response.statusCode} ${response.statusMessage}`);
    console.log(`  Accessible: ${response.statusCode !== 404 ? 'YES' : 'NO (404)'}`);
    console.log('');
  } catch (error) {
    testResults.syncAll.push({
      test: 'POST with courierServiceId',
      url: BASE_URL + ENDPOINTS.syncAll,
      statusCode: 'ERROR',
      success: false,
      error: error.message
    });
    console.log('✗ SYNC-ALL with courierServiceId (POST)');
    console.log(`  Error: ${error.message}`);
    console.log('');
  }

  // Test bulk-update endpoint
  try {
    const response = await makeRequest('POST', ENDPOINTS.bulkUpdate, {
      orderIds: ['00000000-0000-0000-0000-000000000001'],
      trackingNumbers: [
        {
          trackingNumber: 'TEST123456',
          courierServiceId: '00000000-0000-0000-0000-000000000000'
        }
      ]
    });
    testResults.bulkUpdate.push({
      test: 'POST with order data',
      url: BASE_URL + ENDPOINTS.bulkUpdate,
      statusCode: response.statusCode,
      success: response.statusCode !== 404,
      data: response.data
    });
    
    console.log('✓ BULK-UPDATE (POST)');
    console.log(`  URL: ${BASE_URL}${ENDPOINTS.bulkUpdate}`);
    console.log(`  Status: ${response.statusCode} ${response.statusMessage}`);
    console.log(`  Accessible: ${response.statusCode !== 404 ? 'YES' : 'NO (404)'}`);
    console.log('');
  } catch (error) {
    testResults.bulkUpdate.push({
      test: 'POST with order data',
      url: BASE_URL + ENDPOINTS.bulkUpdate,
      statusCode: 'ERROR',
      success: false,
      error: error.message
    });
    console.log('✗ BULK-UPDATE (POST)');
    console.log(`  Error: ${error.message}`);
    console.log('');
  }
}

// Test 4: Test with authentication (if token is available)
async function testWithAuthentication(authToken) {
  console.log('\n=== Test 4: With Authentication ===\n');
  
  if (!authToken) {
    console.log('⚠ No authentication token provided. Skipping authenticated tests.');
    console.log('To test with authentication, run this script with: node test-admin-tracking-endpoints.js <token>');
    return;
  }

  const endpoints = [
    { name: 'analytics', path: ENDPOINTS.analytics },
    { name: 'issues', path: ENDPOINTS.issues },
    { name: 'performance', path: ENDPOINTS.performance }
  ];

  for (const endpoint of endpoints) {
    try {
      const response = await makeRequest('GET', endpoint.path, null, {
        'Authorization': `Bearer ${authToken}`
      });
      testResults[endpoint.name].push({
        test: 'With Authentication',
        url: BASE_URL + endpoint.path,
        statusCode: response.statusCode,
        success: response.statusCode === 200,
        data: response.data
      });
      
      console.log(`✓ ${endpoint.name.toUpperCase()} (GET) - Authenticated`);
      console.log(`  URL: ${BASE_URL}${endpoint.path}`);
      console.log(`  Status: ${response.statusCode} ${response.statusMessage}`);
      console.log(`  Success: ${response.statusCode === 200 ? 'YES' : 'NO'}`);
      if (response.data) {
        console.log(`  Response:`, JSON.stringify(response.data, null, 2).substring(0, 200) + '...');
      }
      console.log('');
    } catch (error) {
      testResults[endpoint.name].push({
        test: 'With Authentication',
        url: BASE_URL + endpoint.path,
        statusCode: 'ERROR',
        success: false,
        error: error.message
      });
      console.log(`✗ ${endpoint.name.toUpperCase()} (GET) - Authenticated`);
      console.log(`  Error: ${error.message}`);
      console.log('');
    }
  }
}

// Generate test report
function generateTestReport() {
  console.log('\n=== TEST REPORT SUMMARY ===\n');
  
  const endpoints = ['analytics', 'issues', 'performance', 'syncAll', 'bulkUpdate'];
  let totalTests = 0;
  let passedTests = 0;
  let failedTests = 0;
  
  for (const endpoint of endpoints) {
    const results = testResults[endpoint];
    if (results.length === 0) continue;
    
    console.log(`\n--- ${endpoint.toUpperCase()} ENDPOINT ---`);
    console.log(`Base URL: ${BASE_URL}${ENDPOINTS[endpoint]}\n`);
    
    for (const result of results) {
      totalTests++;
      const status = result.statusCode === 'ERROR' ? 'ERROR' : result.statusCode;
      const isAccessible = result.success;
      
      if (isAccessible) {
        passedTests++;
        console.log(`✓ Test: ${result.test}`);
        console.log(`  Status: ${status}`);
        console.log(`  Accessible: YES`);
      } else {
        failedTests++;
        console.log(`✗ Test: ${result.test}`);
        console.log(`  Status: ${status}`);
        console.log(`  Accessible: NO`);
      }
      
      if (result.error) {
        console.log(`  Error: ${result.error}`);
      }
      
      if (result.data && typeof result.data === 'object') {
        console.log(`  Response: ${JSON.stringify(result.data).substring(0, 150)}...`);
      }
      console.log('');
    }
  }
  
  console.log('\n=== OVERALL SUMMARY ===\n');
  console.log(`Total Tests: ${totalTests}`);
  console.log(`Passed: ${passedTests}`);
  console.log(`Failed: ${failedTests}`);
  console.log(`Success Rate: ${totalTests > 0 ? ((passedTests / totalTests) * 100).toFixed(2) : 0}%`);
  
  // Check 404 status
  const has404 = Object.values(testResults).flat().some(r => r.statusCode === 404);
  console.log(`\n404 Error Status: ${has404 ? 'STILL PRESENT' : 'RESOLVED'}`);
  
  // Save results to file
  const timestamp = new Date().getTime();
  const filename = `admin-tracking-test-results-${timestamp}.json`;
  const fs = require('fs');
  fs.writeFileSync(filename, JSON.stringify({
    timestamp: new Date().toISOString(),
    baseUrl: BASE_URL,
    endpoints: ENDPOINTS,
    results: testResults,
    summary: {
      totalTests,
      passedTests,
      failedTests,
      successRate: totalTests > 0 ? ((passedTests / totalTests) * 100).toFixed(2) : 0,
      has404Error: has404
    }
  }, null, 2));
  
  console.log(`\nDetailed results saved to: ${filename}`);
}

// Main test execution
async function runTests() {
  const authToken = process.argv[2];
  
  console.log('========================================');
  console.log('  ADMIN TRACKING ENDPOINTS TEST SUITE');
  console.log('========================================');
  console.log(`Base URL: ${BASE_URL}`);
  console.log(`Timestamp: ${new Date().toISOString()}`);
  console.log(`Auth Token: ${authToken ? 'Provided' : 'Not provided'}`);
  
  try {
    // Test 1: Endpoint accessibility
    await testEndpointAccessibility();
    
    // Test 2: Query parameters
    await testQueryParameters();
    
    // Test 3: POST endpoints
    await testPostEndpoints();
    
    // Test 4: With authentication (if token provided)
    await testWithAuthentication(authToken);
    
    // Generate report
    generateTestReport();
    
  } catch (error) {
    console.error('\n❌ Test suite execution failed:', error);
    process.exit(1);
  }
}

// Run tests
runTests();
