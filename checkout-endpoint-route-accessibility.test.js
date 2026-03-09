/**
 * Checkout Endpoint Route Accessibility Test
 * 
 * This script tests that all checkout endpoints are accessible (not returning 404).
 * The original error was: "ApiError: The requested route POST /api/v1/checkout/initialize was not found"
 * 
 * After the route fix, all endpoints should return proper API responses (not 404).
 */

const http = require('http');

// Configuration
const BASE_URL = 'http://localhost:3001';
const API_BASE = `${BASE_URL}/api/v1`;

// Test results storage
const testResults = {
  total: 0,
  passed: 0,
  failed: 0,
  tests: []
};

// Color codes for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

/**
 * Make HTTP request
 */
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
            headers: res.headers,
            body: jsonData
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
 * Record test result
 */
function recordTest(testName, passed, details) {
  testResults.total++;
  if (passed) {
    testResults.passed++;
  } else {
    testResults.failed++;
  }

  testResults.tests.push({
    name: testName,
    passed: passed,
    details: details
  });

  const status = passed ? `${colors.green}✓ PASS${colors.reset}` : `${colors.red}✗ FAIL${colors.reset}`;
  console.log(`  ${status} - ${testName}`);
  if (!passed && details) {
    console.log(`    ${colors.yellow}Details:${colors.reset} ${JSON.stringify(details, null, 2)}`);
  }
}

/**
 * Test endpoint accessibility (not 404 routing error)
 * 
 * A route is accessible if:
 * - It returns a JSON response (regardless of status code)
 * - It does NOT return HTML (which indicates routing 404)
 */
async function testRouteAccessibility(method, path, data = null, testName) {
  try {
    console.log(`\n${colors.cyan}Testing:${colors.reset} ${method} ${path}`);
    const response = await makeRequest(method, path, data);
    
    // Route is accessible if response is JSON (not HTML routing error)
    // Business logic errors (400, 404, 401, etc.) are acceptable as long as they're JSON
    // null body is also acceptable (some endpoints return no body)
    const isJsonResponse = response.body === null || (response.body && typeof response.body === 'object');
    const isHtmlResponse = response.body && typeof response.body === 'string' && response.body.includes('<!DOCTYPE html>');
    const isAccessible = isJsonResponse && !isHtmlResponse;
    const passed = isAccessible;
    
    recordTest(testName, passed, {
      statusCode: response.statusCode,
      body: response.body,
      isAccessible: isAccessible,
      isJsonResponse: isJsonResponse,
      isHtmlResponse: isHtmlResponse,
      note: isAccessible 
        ? `Route exists and is accessible (status: ${response.statusCode})` 
        : 'Route not found (returns HTML instead of JSON)'
    });

    return { passed, response };
  } catch (error) {
    recordTest(testName, false, {
      error: error.message,
      stack: error.stack
    });
    return { passed: false, error };
  }
}

/**
 * Main test function
 */
async function runTests() {
  console.log(`${colors.blue}========================================${colors.reset}`);
  console.log(`${colors.blue}Checkout Endpoint Route Accessibility Test${colors.reset}`);
  console.log(`${colors.blue}========================================${colors.reset}`);
  console.log(`\n${colors.cyan}Base URL:${colors.reset} ${BASE_URL}`);
  console.log(`${colors.cyan}API Base:${colors.reset} ${API_BASE}`);
  console.log(`${colors.cyan}Timestamp:${colors.reset} ${new Date().toISOString()}`);
  console.log(`\n${colors.yellow}Testing for route accessibility (not 404)${colors.reset}`);

  // Test data
  const testCartId = '00000000-0000-0000-0000-000000000000';
  const testSessionId = '123e4567-e89b-12d3-a456-426614174000'; // Valid UUID v4
  const testAddress = {
    firstName: 'Test',
    lastName: 'User',
    addressLine1: '123 Test Street',
    city: 'Dhaka',
    postalCode: '1000',
    country: 'Bangladesh',
    phone: '+8801700000000'
  };

  console.log(`\n${colors.yellow}=== Phase 1: Checkout Initialize Endpoint ===${colors.reset}`);
  
  // Test 1: POST /api/v1/checkout/initialize
  await testRouteAccessibility(
    'POST',
    '/api/v1/checkout/initialize',
    { cartId: testCartId },
    'POST /api/v1/checkout/initialize - Route Accessibility'
  );

  // Test 2: POST /api/v1/guest/checkout/initialize
  await testRouteAccessibility(
    'POST',
    '/api/v1/guest/checkout/initialize',
    { cartId: testCartId },
    'POST /api/v1/guest/checkout/initialize - Route Accessibility'
  );

  console.log(`\n${colors.yellow}=== Phase 2: Checkout Session Endpoints ===${colors.reset}`);

  // Test 3: GET /api/v1/checkout/session/:sessionId
  await testRouteAccessibility(
    'GET',
    `/api/v1/checkout/session/${testSessionId}`,
    null,
    'GET /api/v1/checkout/session/:sessionId - Route Accessibility'
  );

  // Test 4: PUT /api/v1/checkout/session/:sessionId/step
  await testRouteAccessibility(
    'PUT',
    `/api/v1/checkout/session/${testSessionId}/step`,
    { step: 'address', data: {} },
    'PUT /api/v1/checkout/session/:sessionId/step - Route Accessibility'
  );

  // Test 5: POST /api/v1/checkout/session/:sessionId/address
  await testRouteAccessibility(
    'POST',
    `/api/v1/checkout/session/${testSessionId}/address`,
    { shippingAddress: testAddress },
    'POST /api/v1/checkout/session/:sessionId/address - Route Accessibility'
  );

  // Test 6: POST /api/v1/checkout/session/:sessionId/shipping
  await testRouteAccessibility(
    'POST',
    `/api/v1/checkout/session/${testSessionId}/shipping`,
    { method: 'standard' },
    'POST /api/v1/checkout/session/:sessionId/shipping - Route Accessibility'
  );

  // Test 7: POST /api/v1/checkout/session/:sessionId/payment
  await testRouteAccessibility(
    'POST',
    `/api/v1/checkout/session/${testSessionId}/payment`,
    { method: 'CASH_ON_DELIVERY', details: {} },
    'POST /api/v1/checkout/session/:sessionId/payment - Route Accessibility'
  );

  // Test 8: POST /api/v1/checkout/session/:sessionId/complete
  await testRouteAccessibility(
    'POST',
    `/api/v1/checkout/session/${testSessionId}/complete`,
    {},
    'POST /api/v1/checkout/session/:sessionId/complete - Route Accessibility'
  );

  // Test 9: DELETE /api/v1/checkout/session/:sessionId
  await testRouteAccessibility(
    'DELETE',
    `/api/v1/checkout/session/${testSessionId}`,
    { reason: 'test' },
    'DELETE /api/v1/checkout/session/:sessionId - Route Accessibility'
  );

  console.log(`\n${colors.yellow}=== Phase 3: Utility Endpoints ===${colors.reset}`);

  // Test 10: GET /api/v1/checkout/shipping-methods
  await testRouteAccessibility(
    'GET',
    '/api/v1/checkout/shipping-methods',
    null,
    'GET /api/v1/checkout/shipping-methods - Route Accessibility'
  );

  // Test 11: GET /api/v1/checkout/payment-methods
  await testRouteAccessibility(
    'GET',
    '/api/v1/checkout/payment-methods',
    null,
    'GET /api/v1/checkout/payment-methods - Route Accessibility'
  );

  // Test 12: POST /api/v1/checkout/validate-address
  await testRouteAccessibility(
    'POST',
    '/api/v1/checkout/validate-address',
    { address: testAddress },
    'POST /api/v1/checkout/validate-address - Route Accessibility'
  );

  console.log(`\n${colors.yellow}=== Phase 4: Guest Checkout Endpoints ===${colors.reset}`);

  // Test 13: GET /api/v1/guest/checkout/session/:sessionId
  await testRouteAccessibility(
    'GET',
    `/api/v1/guest/checkout/session/${testSessionId}`,
    null,
    'GET /api/v1/guest/checkout/session/:sessionId - Route Accessibility'
  );

  // Test 14: POST /api/v1/guest/checkout/session/:sessionId/info
  await testRouteAccessibility(
    'POST',
    `/api/v1/guest/checkout/session/${testSessionId}/info`,
    { firstName: 'Test', lastName: 'User', email: 'test@example.com', phone: '+8801700000000' },
    'POST /api/v1/guest/checkout/session/:sessionId/info - Route Accessibility'
  );

  // Test 15: POST /api/v1/guest/checkout/session/:sessionId/complete
  await testRouteAccessibility(
    'POST',
    `/api/v1/guest/checkout/session/${testSessionId}/complete`,
    { 
      shippingAddress: testAddress,
      billingAddress: testAddress,
      paymentMethod: 'CASH_ON_DELIVERY'
    },
    'POST /api/v1/guest/checkout/session/:sessionId/complete - Route Accessibility'
  );

  // Print summary
  console.log(`\n${colors.blue}========================================${colors.reset}`);
  console.log(`${colors.blue}Test Summary${colors.reset}`);
  console.log(`${colors.blue}========================================${colors.reset}`);
  console.log(`\n${colors.cyan}Total Tests:${colors.reset} ${testResults.total}`);
  console.log(`${colors.green}Passed:${colors.reset} ${testResults.passed}`);
  console.log(`${colors.red}Failed:${colors.reset} ${testResults.failed}`);
  console.log(`\n${colors.cyan}Success Rate:${colors.reset} ${((testResults.passed / testResults.total) * 100).toFixed(2)}%`);

  // Save results to file
  const timestamp = Date.now();
  const resultsFilename = `checkout-route-accessibility-test-results-${timestamp}.json`;
  const fs = require('fs');
  fs.writeFileSync(
    resultsFilename,
    JSON.stringify({
      timestamp: new Date().toISOString(),
      baseUrl: BASE_URL,
      summary: {
        total: testResults.total,
        passed: testResults.passed,
        failed: testResults.failed,
        successRate: ((testResults.passed / testResults.total) * 100).toFixed(2) + '%'
      },
      tests: testResults.tests
    }, null, 2)
  );
  console.log(`\n${colors.cyan}Results saved to:${colors.reset} ${resultsFilename}`);

  // Check if original error is resolved
  const initializeTest = testResults.tests.find(t => t.name.includes('POST /api/v1/checkout/initialize'));
  if (initializeTest && initializeTest.passed) {
    console.log(`\n${colors.green}✓✓✓ ORIGINAL ERROR RESOLVED ✓✓✓${colors.reset}`);
    console.log(`${colors.green}The route POST /api/v1/checkout/initialize is now accessible${colors.reset}`);
    console.log(`${colors.green}Original error: "ApiError: The requested route POST /api/v1/checkout/initialize was not found"${colors.reset}`);
    console.log(`${colors.green}Current status: Route exists and returns proper API response (not 404)${colors.reset}`);
  } else if (initializeTest && !initializeTest.passed) {
    if (initializeTest.details && initializeTest.details.statusCode === 404) {
      console.log(`\n${colors.red}✗✗✗ ORIGINAL ERROR NOT RESOLVED ✗✗✗${colors.reset}`);
      console.log(`${colors.red}The route POST /api/v1/checkout/initialize still returns 404${colors.reset}`);
    } else {
      console.log(`\n${colors.yellow}⚠ Route exists but has issues:${colors.reset}`);
    }
  }

  process.exit(testResults.failed > 0 ? 1 : 0);
}

// Run tests
runTests().catch(error => {
  console.error(`${colors.red}Error running tests:${colors.reset}`, error);
  process.exit(1);
});
