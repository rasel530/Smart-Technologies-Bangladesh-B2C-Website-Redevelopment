/**
 * Comprehensive Test Suite for Admin Mobile API Routes
 * 
 * Tests for:
 * - GET /api/v1/admin/mobile/analytics
 * - GET /api/v1/admin/mobile/performance
 * - GET /api/v1/admin/mobile/analytics/export
 * 
 * Test Coverage:
 * - Authentication requirements
 * - Different period parameters (24h, 7d, 30d, 90d)
 * - Response data structure validation
 * - Error handling
 */

const http = require('http');

// Test configuration
const API_BASE_URL = 'http://localhost:3001';
const API_PREFIX = '/api/v1/admin/mobile';

// Test results storage
const testResults = {
  total: 0,
  passed: 0,
  failed: 0,
  skipped: 0,
  tests: []
};

// Test data
let authToken = null;
let testUserId = null;

// Color codes for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[36m',
  gray: '\x1b[90m'
};

/**
 * Helper function to make HTTP requests
 */
function makeRequest(method, path, headers = {}, body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, API_BASE_URL);
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
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const parsedData = data ? JSON.parse(data) : null;
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            data: parsedData
          });
        } catch (e) {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            data: data
          });
        }
      });
    });

    req.on('error', reject);

    if (body) {
      req.write(JSON.stringify(body));
    }

    req.end();
  });
}

/**
 * Helper function to log test results
 */
function logTest(testName, status, message, details = {}) {
  testResults.total++;
  
  const result = {
    name: testName,
    status,
    message,
    details,
    timestamp: new Date().toISOString()
  };

  if (status === 'PASS') {
    testResults.passed++;
    console.log(`${colors.green}✓ PASS${colors.reset} - ${testName}`);
  } else if (status === 'FAIL') {
    testResults.failed++;
    console.log(`${colors.red}✗ FAIL${colors.reset} - ${testName}`);
    console.log(`  ${colors.gray}Message: ${message}${colors.reset}`);
    if (Object.keys(details).length > 0) {
      console.log(`  ${colors.gray}Details: ${JSON.stringify(details, null, 2)}${colors.reset}`);
    }
  } else {
    testResults.skipped++;
    console.log(`${colors.yellow}○ SKIP${colors.reset} - ${testName} - ${message}`);
  }

  testResults.tests.push(result);
}

/**
 * Helper function to assert conditions
 */
function assert(condition, testName, message, details = {}) {
  if (condition) {
    logTest(testName, 'PASS', message, details);
    return true;
  } else {
    logTest(testName, 'FAIL', message, details);
    return false;
  }
}

/**
 * Helper function to check if backend is running
 */
async function checkBackendHealth() {
  try {
    const response = await makeRequest('GET', '/api/v1/health');
    return response.statusCode < 500;
  } catch (error) {
    return false;
  }
}

/**
 * Step 1: Create or find admin user and get auth token
 */
async function setupAuthentication() {
  console.log(`\n${colors.blue}=== Step 1: Setting up authentication ===${colors.reset}\n`);

  try {
    // Try to login with existing admin credentials
    const loginResponse = await makeRequest('POST', '/api/v1/auth/login', {}, {
      identifier: 'admin@smarttech.com',
      password: 'AdminPassword123'
    });

    console.log(`Login response status: ${loginResponse.statusCode}`);
    console.log(`Login response data:`, JSON.stringify(loginResponse.data, null, 2));

    if (loginResponse.statusCode === 200 && loginResponse.data?.token) {
      authToken = loginResponse.data.token;
      testUserId = loginResponse.data.user?.id;
      console.log(`${colors.green}✓${colors.reset} Successfully authenticated with existing admin user`);
      console.log(`  User ID: ${testUserId}`);
      console.log(`  Token: ${authToken.substring(0, 20)}...`);
      return true;
    }

    // If login fails, try to create an admin user
    console.log(`${colors.yellow}Login failed (status: ${loginResponse.statusCode}), attempting to create admin user...${colors.reset}`);
    
    const registerResponse = await makeRequest('POST', '/api/v1/auth/register', {}, {
      email: `testadmin${Date.now()}@smarttechnologies-bd.com`,
      password: 'TestAdmin123!',
      firstName: 'Test',
      lastName: 'Admin',
      phone: '+8801700000000',
      role: 'ADMIN'
    });

    if (registerResponse.statusCode === 201 && registerResponse.data?.data?.token) {
      authToken = registerResponse.data.data.token;
      testUserId = registerResponse.data.data.user?.id;
      console.log(`${colors.green}✓${colors.reset} Successfully created and authenticated new admin user`);
      console.log(`  User ID: ${testUserId}`);
      return true;
    }

    console.log(`${colors.red}✗${colors.reset} Failed to set up authentication`);
    return false;

  } catch (error) {
    console.log(`${colors.red}✗${colors.reset} Authentication setup error: ${error.message}`);
    return false;
  }
}

/**
 * Step 2: Test GET /api/v1/admin/mobile/analytics
 */
async function testGetAnalytics() {
  console.log(`\n${colors.blue}=== Step 2: Testing GET /api/v1/admin/mobile/analytics ===${colors.reset}\n`);

  const testCases = [
    { name: 'Without authentication', headers: {}, shouldFail: true },
    { name: 'With authentication (no filters)', headers: { 'Authorization': `Bearer ${authToken}` }, shouldFail: false },
    { name: 'With platform filter (mobile)', headers: { 'Authorization': `Bearer ${authToken}` }, query: { platform: 'mobile' }, shouldFail: false },
    { name: 'With platform filter (desktop)', headers: { 'Authorization': `Bearer ${authToken}` }, query: { platform: 'desktop' }, shouldFail: false },
    { name: 'With action filter (view)', headers: { 'Authorization': `Bearer ${authToken}` }, query: { action: 'view' }, shouldFail: false },
    { name: 'With action filter (checkout)', headers: { 'Authorization': `Bearer ${authToken}` }, query: { action: 'checkout' }, shouldFail: false },
    { name: 'With period 24h', headers: { 'Authorization': `Bearer ${authToken}` }, period: '24h', shouldFail: false },
    { name: 'With period 7d', headers: { 'Authorization': `Bearer ${authToken}` }, period: '7d', shouldFail: false },
    { name: 'With period 30d', headers: { 'Authorization': `Bearer ${authToken}` }, period: '30d', shouldFail: false },
    { name: 'With period 90d', headers: { 'Authorization': `Bearer ${authToken}` }, period: '90d', shouldFail: false },
  ];

  for (const testCase of testCases) {
    try {
      let path = `${API_PREFIX}/analytics`;
      
      // Add query parameters
      const queryParams = [];
      if (testCase.query) {
        Object.entries(testCase.query).forEach(([key, value]) => {
          queryParams.push(`${key}=${value}`);
        });
      }
      
      // Add period-based date filters
      if (testCase.period) {
        const endDate = new Date();
        let startDate = new Date();
        
        switch (testCase.period) {
          case '24h':
            startDate.setHours(startDate.getHours() - 24);
            break;
          case '7d':
            startDate.setDate(startDate.getDate() - 7);
            break;
          case '30d':
            startDate.setDate(startDate.getDate() - 30);
            break;
          case '90d':
            startDate.setDate(startDate.getDate() - 90);
            break;
        }
        
        queryParams.push(`startDate=${startDate.toISOString()}`);
        queryParams.push(`endDate=${endDate.toISOString()}`);
      }
      
      if (queryParams.length > 0) {
        path += '?' + queryParams.join('&');
      }

      const response = await makeRequest('GET', path, testCase.headers);

      // Test authentication
      if (testCase.shouldFail) {
        assert(
          response.statusCode === 401 || response.statusCode === 403,
          `Analytics - ${testCase.name} - Authentication required`,
          'Endpoint should require authentication',
          { statusCode: response.statusCode, data: response.data }
        );
      } else {
        assert(
          response.statusCode === 200,
          `Analytics - ${testCase.name} - Status code`,
          'Should return 200 OK',
          { statusCode: response.statusCode }
        );

        if (response.statusCode === 200) {
          // Validate response structure
          assert(
            response.data !== null && typeof response.data === 'object',
            `Analytics - ${testCase.name} - Response is object`,
            'Response should be an object',
            { dataType: typeof response.data }
          );

          assert(
            response.data.success === true,
            `Analytics - ${testCase.name} - Success flag`,
          'Response should have success: true',
            { success: response.data.success }
          );

          assert(
            Array.isArray(response.data.data),
            `Analytics - ${testCase.name} - Data is array`,
            'Response data should be an array',
            { dataType: typeof response.data.data }
          );

          assert(
            typeof response.data.count === 'number',
            `Analytics - ${testCase.name} - Count field`,
            'Response should have a count field',
            { count: response.data.count, countType: typeof response.data.count }
          );

          // Validate data structure if not empty
          if (response.data.data.length > 0) {
            const firstItem = response.data.data[0];
            assert(
              firstItem.id !== undefined,
              `Analytics - ${testCase.name} - Item has ID`,
              'Analytics items should have an ID field',
              { hasId: firstItem.id !== undefined }
            );

            assert(
              firstItem.action !== undefined,
              `Analytics - ${testCase.name} - Item has action`,
              'Analytics items should have an action field',
              { hasAction: firstItem.action !== undefined }
            );

            assert(
              firstItem.platform !== undefined,
              `Analytics - ${testCase.name} - Item has platform`,
              'Analytics items should have a platform field',
              { hasPlatform: firstItem.platform !== undefined }
            );

            assert(
              firstItem.createdAt !== undefined,
              `Analytics - ${testCase.name} - Item has createdAt`,
              'Analytics items should have a createdAt field',
              { hasCreatedAt: firstItem.createdAt !== undefined }
            );
          } else {
            console.log(`  ${colors.gray}Note: No analytics data found for ${testCase.name}${colors.reset}`);
          }
        }
      }
    } catch (error) {
      logTest(
        `Analytics - ${testCase.name}`,
        'FAIL',
        `Request failed: ${error.message}`,
        { error: error.message }
      );
    }
  }
}

/**
 * Step 3: Test GET /api/v1/admin/mobile/performance
 */
async function testGetPerformance() {
  console.log(`\n${colors.blue}=== Step 3: Testing GET /api/v1/admin/mobile/performance ===${colors.reset}\n`);

  const testCases = [
    { name: 'Without authentication', headers: {}, shouldFail: true },
    { name: 'With authentication', headers: { 'Authorization': `Bearer ${authToken}` }, shouldFail: false },
  ];

  for (const testCase of testCases) {
    try {
      const path = `${API_PREFIX}/performance`;
      const response = await makeRequest('GET', path, testCase.headers);

      if (testCase.shouldFail) {
        assert(
          response.statusCode === 401 || response.statusCode === 403,
          `Performance - ${testCase.name} - Authentication required`,
          'Endpoint should require authentication',
          { statusCode: response.statusCode, data: response.data }
        );
      } else {
        assert(
          response.statusCode === 200,
          `Performance - ${testCase.name} - Status code`,
          'Should return 200 OK',
          { statusCode: response.statusCode }
        );

        if (response.statusCode === 200) {
          // Validate response structure
          assert(
            response.data !== null && typeof response.data === 'object',
            `Performance - ${testCase.name} - Response is object`,
            'Response should be an object',
            { dataType: typeof response.data }
          );

          assert(
            response.data.success === true,
            `Performance - ${testCase.name} - Success flag`,
            'Response should have success: true',
            { success: response.data.success }
          );

          assert(
            typeof response.data.data === 'object' && response.data.data !== null,
            `Performance - ${testCase.name} - Data is object`,
            'Response data should be an object',
            { dataType: typeof response.data.data }
          );

          // Validate performance metrics structure
          const metrics = response.data.data;
          assert(
            typeof metrics.totalEvents === 'number',
            `Performance - ${testCase.name} - Total events`,
            'Metrics should have totalEvents field',
            { totalEvents: metrics.totalEvents }
          );

          assert(
            typeof metrics.platformBreakdown === 'object',
            `Performance - ${testCase.name} - Platform breakdown`,
            'Metrics should have platformBreakdown object',
            { platformBreakdown: metrics.platformBreakdown }
          );

          assert(
            typeof metrics.actionBreakdown === 'object',
            `Performance - ${testCase.name} - Action breakdown`,
            'Metrics should have actionBreakdown object',
            { actionBreakdown: metrics.actionBreakdown }
          );

          assert(
            typeof metrics.averageMetrics === 'object',
            `Performance - ${testCase.name} - Average metrics`,
            'Metrics should have averageMetrics object',
            { averageMetrics: metrics.averageMetrics }
          );

          assert(
            typeof metrics.period === 'object',
            `Performance - ${testCase.name} - Period`,
            'Metrics should have period object',
            { period: metrics.period }
          );

          // Validate platform breakdown structure
          if (metrics.platformBreakdown) {
            assert(
              typeof metrics.platformBreakdown.mobile === 'number',
              `Performance - ${testCase.name} - Mobile events`,
              'Platform breakdown should have mobile count',
              { mobile: metrics.platformBreakdown.mobile }
            );

            assert(
              typeof metrics.platformBreakdown.desktop === 'number',
              `Performance - ${testCase.name} - Desktop events`,
              'Platform breakdown should have desktop count',
              { desktop: metrics.platformBreakdown.desktop }
            );

            assert(
              typeof metrics.platformBreakdown.tablet === 'number',
              `Performance - ${testCase.name} - Tablet events`,
              'Platform breakdown should have tablet count',
              { tablet: metrics.platformBreakdown.tablet }
            );
          }

          // Validate average metrics structure
          if (metrics.averageMetrics) {
            assert(
              typeof metrics.averageMetrics.duration === 'number',
              `Performance - ${testCase.name} - Average duration`,
              'Average metrics should have duration',
              { duration: metrics.averageMetrics.duration }
            );

            assert(
              typeof metrics.averageMetrics.touchCount === 'number',
              `Performance - ${testCase.name} - Average touch count`,
              'Average metrics should have touchCount',
              { touchCount: metrics.averageMetrics.touchCount }
            );
          }
        }
      }
    } catch (error) {
      logTest(
        `Performance - ${testCase.name}`,
        'FAIL',
        `Request failed: ${error.message}`,
        { error: error.message }
      );
    }
  }
}

/**
 * Step 4: Test GET /api/v1/admin/mobile/analytics/export
 */
async function testGetAnalyticsExport() {
  console.log(`\n${colors.blue}=== Step 4: Testing GET /api/v1/admin/mobile/analytics/export ===${colors.reset}\n`);

  const testCases = [
    { name: 'Without authentication', headers: {}, shouldFail: true },
    { name: 'With authentication (no filters)', headers: { 'Authorization': `Bearer ${authToken}` }, shouldFail: false },
    { name: 'With period 7d', headers: { 'Authorization': `Bearer ${authToken}` }, period: '7d', shouldFail: false },
    { name: 'With period 30d', headers: { 'Authorization': `Bearer ${authToken}` }, period: '30d', shouldFail: false },
  ];

  for (const testCase of testCases) {
    try {
      let path = `${API_PREFIX}/analytics/export`;
      
      // Add period-based date filters
      if (testCase.period) {
        const endDate = new Date();
        let startDate = new Date();
        
        switch (testCase.period) {
          case '7d':
            startDate.setDate(startDate.getDate() - 7);
            break;
          case '30d':
            startDate.setDate(startDate.getDate() - 30);
            break;
          case '90d':
            startDate.setDate(startDate.getDate() - 90);
            break;
        }
        
        path += `?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`;
      }

      const response = await makeRequest('GET', path, testCase.headers);

      if (testCase.shouldFail) {
        assert(
          response.statusCode === 401 || response.statusCode === 403,
          `Export - ${testCase.name} - Authentication required`,
          'Endpoint should require authentication',
          { statusCode: response.statusCode, data: response.data }
        );
      } else {
        assert(
          response.statusCode === 200,
          `Export - ${testCase.name} - Status code`,
          'Should return 200 OK',
          { statusCode: response.statusCode }
        );

        if (response.statusCode === 200) {
          // Check Content-Type header
          const contentType = response.headers['content-type'] || response.headers['Content-Type'];
          assert(
            contentType && contentType.includes('application/json'),
            `Export - ${testCase.name} - Content-Type header`,
            'Response should have Content-Type: application/json',
            { contentType }
          );

          // Check Content-Disposition header
          const contentDisposition = response.headers['content-disposition'] || response.headers['Content-Disposition'];
          assert(
            contentDisposition && contentDisposition.includes('attachment'),
            `Export - ${testCase.name} - Content-Disposition header`,
            'Response should have Content-Disposition with attachment',
            { contentDisposition }
          );

          // Validate response data is JSON array
          let exportData;
          try {
            if (typeof response.data === 'string') {
              exportData = JSON.parse(response.data);
            } else {
              exportData = response.data;
            }
          } catch (e) {
            exportData = null;
          }

          assert(
            Array.isArray(exportData),
            `Export - ${testCase.name} - Data is array`,
            'Export data should be a JSON array',
            { dataType: typeof exportData }
          );

          // Validate array structure if not empty
          if (exportData && exportData.length > 0) {
            const firstItem = exportData[0];
            assert(
              firstItem.id !== undefined,
              `Export - ${testCase.name} - Item has ID`,
              'Export items should have an ID field',
              { hasId: firstItem.id !== undefined }
            );

            assert(
              firstItem.action !== undefined,
              `Export - ${testCase.name} - Item has action`,
              'Export items should have an action field',
              { hasAction: firstItem.action !== undefined }
            );

            assert(
              firstItem.platform !== undefined,
              `Export - ${testCase.name} - Item has platform`,
              'Export items should have a platform field',
              { hasPlatform: firstItem.platform !== undefined }
            );
          } else {
            console.log(`  ${colors.gray}Note: No analytics data to export for ${testCase.name}${colors.reset}`);
          }
        }
      }
    } catch (error) {
      logTest(
        `Export - ${testCase.name}`,
        'FAIL',
        `Request failed: ${error.message}`,
        { error: error.message }
      );
    }
  }
}

/**
 * Step 5: Test data structure validation
 */
async function testDataStructureValidation() {
  console.log(`\n${colors.blue}=== Step 5: Testing Data Structure Validation ===${colors.reset}\n`);

  try {
    // Get analytics data
    const analyticsResponse = await makeRequest(
      'GET',
      `${API_PREFIX}/analytics`,
      { 'Authorization': `Bearer ${authToken}` }
    );

    if (analyticsResponse.statusCode === 200 && analyticsResponse.data?.data?.length > 0) {
      const analyticsItem = analyticsResponse.data.data[0];

      // Validate analytics item structure
      const expectedFields = [
        'id', 'action', 'platform', 'createdAt'
      ];

      const optionalFields = [
        'userId', 'sessionId', 'deviceId', 'deviceType', 'browser',
        'networkType', 'networkSpeed', 'screenResolution', 'cartId',
        'productId', 'paymentMethod', 'emiPlanId', 'duration',
        'pageCount', 'touchCount', 'scrollDepth', 'metadata', 'updatedAt'
      ];

      for (const field of expectedFields) {
        assert(
          analyticsItem[field] !== undefined,
          `Data Structure - Analytics has ${field} field`,
          `Analytics item should have ${field} field`,
          { field, value: analyticsItem[field] }
        );
      }

      // Validate field types
      assert(
        typeof analyticsItem.id === 'string',
        'Data Structure - Analytics ID type',
        'ID should be a string',
        { id: analyticsItem.id, idType: typeof analyticsItem.id }
      );

      assert(
        typeof analyticsItem.action === 'string',
        'Data Structure - Analytics action type',
        'Action should be a string',
        { action: analyticsItem.action, actionType: typeof analyticsItem.action }
      );

      assert(
        typeof analyticsItem.platform === 'string',
        'Data Structure - Analytics platform type',
        'Platform should be a string',
        { platform: analyticsItem.platform, platformType: typeof analyticsItem.platform }
      );

      assert(
        !isNaN(Date.parse(analyticsItem.createdAt)),
        'Data Structure - Analytics createdAt type',
        'CreatedAt should be a valid date string',
        { createdAt: analyticsItem.createdAt }
      );
    }

    // Get performance metrics
    const performanceResponse = await makeRequest(
      'GET',
      `${API_PREFIX}/performance`,
      { 'Authorization': `Bearer ${authToken}` }
    );

    if (performanceResponse.statusCode === 200 && performanceResponse.data?.data) {
      const metrics = performanceResponse.data.data;

      // Validate performance metrics structure
      const expectedMetricFields = [
        'totalEvents', 'platformBreakdown', 'actionBreakdown',
        'averageMetrics', 'period'
      ];

      for (const field of expectedMetricFields) {
        assert(
          metrics[field] !== undefined,
          `Data Structure - Performance has ${field} field`,
          `Performance metrics should have ${field} field`,
          { field, value: metrics[field] }
        );
      }
    }

  } catch (error) {
    logTest(
      'Data Structure Validation',
      'FAIL',
      `Validation failed: ${error.message}`,
      { error: error.message }
    );
  }
}

/**
 * Step 6: Test error handling
 */
async function testErrorHandling() {
  console.log(`\n${colors.blue}=== Step 6: Testing Error Handling ===${colors.reset}\n`);

  const errorTestCases = [
    {
      name: 'Invalid platform filter',
      path: `${API_PREFIX}/analytics?platform=invalid`,
      headers: { 'Authorization': `Bearer ${authToken}` },
      expectedStatus: 400
    },
    {
      name: 'Invalid action filter',
      path: `${API_PREFIX}/analytics?action=invalid`,
      headers: { 'Authorization': `Bearer ${authToken}` },
      expectedStatus: 400
    },
    {
      name: 'Invalid date format',
      path: `${API_PREFIX}/analytics?startDate=invalid-date`,
      headers: { 'Authorization': `Bearer ${authToken}` },
      expectedStatus: 400
    },
    {
      name: 'Invalid auth token',
      path: `${API_PREFIX}/analytics`,
      headers: { 'Authorization': 'Bearer invalid-token-12345' },
      expectedStatus: 401
    },
    {
      name: 'Missing auth header',
      path: `${API_PREFIX}/analytics`,
      headers: {},
      expectedStatus: 401
    }
  ];

  for (const testCase of errorTestCases) {
    try {
      const response = await makeRequest('GET', testCase.path, testCase.headers);

      assert(
        response.statusCode === testCase.expectedStatus,
        `Error Handling - ${testCase.name}`,
        `Should return ${testCase.expectedStatus} for ${testCase.name}`,
        { statusCode: response.statusCode, expectedStatus: testCase.expectedStatus }
      );

      if (response.statusCode >= 400) {
        assert(
          response.data !== null && typeof response.data === 'object',
          `Error Handling - ${testCase.name} - Error response`,
          'Error response should be an object',
          { dataType: typeof response.data }
        );

        assert(
          response.data.error !== undefined || response.data.message !== undefined,
          `Error Handling - ${testCase.name} - Error message`,
          'Error response should have error or message field',
          { error: response.data.error, message: response.data.message }
        );
      }
    } catch (error) {
      logTest(
        `Error Handling - ${testCase.name}`,
        'FAIL',
        `Test failed: ${error.message}`,
        { error: error.message }
      );
    }
  }
}

/**
 * Generate test report
 */
function generateTestReport() {
  console.log(`\n${colors.blue}${'='.repeat(60)}${colors.reset}`);
  console.log(`${colors.blue}TEST SUMMARY REPORT${colors.reset}`);
  console.log(`${colors.blue}${'='.repeat(60)}${colors.reset}\n`);

  console.log(`Total Tests: ${testResults.total}`);
  console.log(`${colors.green}Passed: ${testResults.passed}${colors.reset}`);
  console.log(`${colors.red}Failed: ${testResults.failed}${colors.reset}`);
  console.log(`${colors.yellow}Skipped: ${testResults.skipped}${colors.reset}`);

  const passRate = testResults.total > 0 
    ? ((testResults.passed / testResults.total) * 100).toFixed(2) 
    : 0;
  console.log(`\nPass Rate: ${passRate}%`);

  if (testResults.failed > 0) {
    console.log(`\n${colors.red}Failed Tests:${colors.reset}`);
    testResults.tests
      .filter(t => t.status === 'FAIL')
      .forEach(t => {
        console.log(`  - ${t.name}`);
        console.log(`    ${t.message}`);
      });
  }

  console.log(`\n${colors.blue}${'='.repeat(60)}${colors.reset}\n`);

  // Save results to JSON file
  const resultsFilename = `admin-mobile-routes-test-results-${Date.now()}.json`;
  const fs = require('fs');
  fs.writeFileSync(
    resultsFilename,
    JSON.stringify(testResults, null, 2)
  );
  console.log(`Test results saved to: ${resultsFilename}\n`);

  return testResults;
}

/**
 * Main test execution
 */
async function runTests() {
  console.log(`${colors.blue}${'='.repeat(60)}${colors.reset}`);
  console.log(`${colors.blue}ADMIN MOBILE API ROUTES TEST SUITE${colors.reset}`);
  console.log(`${colors.blue}${'='.repeat(60)}${colors.reset}\n`);

  console.log(`API Base URL: ${API_BASE_URL}`);
  console.log(`API Prefix: ${API_PREFIX}`);
  console.log(`Start Time: ${new Date().toISOString()}\n`);

  // Check if backend is running
  const isBackendRunning = await checkBackendHealth();
  if (!isBackendRunning) {
    console.log(`${colors.red}✗${colors.reset} Backend is not running or not accessible`);
    console.log(`Please ensure the backend server is running on port 3001`);
    process.exit(1);
  }

  console.log(`${colors.green}✓${colors.reset} Backend is running\n`);

  // Setup authentication
  const authSetupSuccess = await setupAuthentication();
  if (!authSetupSuccess) {
    console.log(`${colors.red}✗${colors.reset} Failed to set up authentication`);
    console.log(`Tests requiring authentication will be skipped\n`);
  }

  // Run all test suites
  if (authToken) {
    await testGetAnalytics();
    await testGetPerformance();
    await testGetAnalyticsExport();
    await testDataStructureValidation();
    await testErrorHandling();
  } else {
    console.log(`${colors.yellow}Skipping all tests due to authentication failure${colors.reset}\n`);
  }

  // Generate and display report
  const results = generateTestReport();

  console.log(`End Time: ${new Date().toISOString()}\n`);

  // Exit with appropriate code
  process.exit(results.failed > 0 ? 1 : 0);
}

// Run tests
runTests().catch(error => {
  console.error(`${colors.red}Fatal error:${colors.reset}`, error);
  process.exit(1);
});
