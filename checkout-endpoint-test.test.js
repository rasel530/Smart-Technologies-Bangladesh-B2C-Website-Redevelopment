/**
 * Comprehensive Checkout Endpoint Test Script
 * 
 * This script tests all checkout endpoints after the route fix:
 * - POST /api/v1/checkout/initialize
 * - POST /api/v1/guest/checkout/initialize
 * - GET /api/v1/checkout/session/:sessionId
 * - PUT /api/v1/checkout/session/:sessionId/step
 * - POST /api/v1/checkout/session/:sessionId/address
 * - POST /api/v1/checkout/session/:sessionId/shipping
 * - POST /api/v1/checkout/session/:sessionId/payment
 * - POST /api/v1/checkout/session/:sessionId/complete
 * - DELETE /api/v1/checkout/session/:sessionId
 * - GET /api/v1/checkout/shipping-methods
 * - GET /api/v1/checkout/payment-methods
 * - POST /api/v1/checkout/validate-address
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
      port: url.port || 3000,
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
 * Test endpoint accessibility (not 404)
 */
async function testEndpointAccessibility(method, path, testName, expectedStatus = 200) {
  try {
    console.log(`\n${colors.cyan}Testing:${colors.reset} ${method} ${path}`);
    const response = await makeRequest(method, path);
    
    const isAccessible = response.statusCode !== 404;
    const isExpectedStatus = response.statusCode === expectedStatus;
    const passed = isAccessible && isExpectedStatus;
    
    recordTest(testName, passed, {
      statusCode: response.statusCode,
      body: response.body,
      isAccessible: isAccessible,
      isExpectedStatus: isExpectedStatus
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
 * Test with request body
 */
async function testEndpointWithBody(method, path, body, testName, expectedStatus = 200) {
  try {
    console.log(`\n${colors.cyan}Testing:${colors.reset} ${method} ${path}`);
    const response = await makeRequest(method, path, body);
    
    const isAccessible = response.statusCode !== 404;
    const isExpectedStatus = response.statusCode === expectedStatus;
    const passed = isAccessible && isExpectedStatus;
    
    recordTest(testName, passed, {
      statusCode: response.statusCode,
      body: response.body,
      isAccessible: isAccessible,
      isExpectedStatus: isExpectedStatus
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
  console.log(`${colors.blue}Checkout Endpoint Test Suite${colors.reset}`);
  console.log(`${colors.blue}========================================${colors.reset}`);
  console.log(`\n${colors.cyan}Base URL:${colors.reset} ${BASE_URL}`);
  console.log(`${colors.cyan}API Base:${colors.reset} ${API_BASE}`);
  console.log(`${colors.cyan}Timestamp:${colors.reset} ${new Date().toISOString()}`);

  // Test data
  const testCartId = '00000000-0000-0000-0000-000000000000';
  const testSessionId = '00000000-0000-0000-0000-000000000001';
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
  await testEndpointWithBody(
    'POST',
    '/api/v1/checkout/initialize',
    { cartId: testCartId },
    'POST /api/v1/checkout/initialize - Route Accessibility',
    401 // Expected 401 (unauthorized) or 400 (validation error) but NOT 404
  );

  // Test 2: POST /api/v1/guest/checkout/initialize
  await testEndpointWithBody(
    'POST',
    '/api/v1/guest/checkout/initialize',
    { cartId: testCartId },
    'POST /api/v1/guest/checkout/initialize - Route Accessibility',
    400 // Expected 400 (validation error) but NOT 404
  );

  console.log(`\n${colors.yellow}=== Phase 2: Checkout Session Endpoints ===${colors.reset}`);

  // Test 3: GET /api/v1/checkout/session/:sessionId
  await testEndpointAccessibility(
    'GET',
    `/api/v1/checkout/session/${testSessionId}`,
    'GET /api/v1/checkout/session/:sessionId - Route Accessibility',
    404 // Session not found is expected, but route should exist
  );

  // Test 4: PUT /api/v1/checkout/session/:sessionId/step
  await testEndpointWithBody(
    'PUT',
    `/api/v1/checkout/session/${testSessionId}/step`,
    { step: 'address', data: {} },
    'PUT /api/v1/checkout/session/:sessionId/step - Route Accessibility',
    404 // Session not found is expected, but route should exist
  );

  // Test 5: POST /api/v1/checkout/session/:sessionId/address
  await testEndpointWithBody(
    'POST',
    `/api/v1/checkout/session/${testSessionId}/address`,
    { shippingAddress: testAddress },
    'POST /api/v1/checkout/session/:sessionId/address - Route Accessibility',
    404 // Session not found is expected, but route should exist
  );

  // Test 6: POST /api/v1/checkout/session/:sessionId/shipping
  await testEndpointWithBody(
    'POST',
    `/api/v1/checkout/session/${testSessionId}/shipping`,
    { method: 'standard' },
    'POST /api/v1/checkout/session/:sessionId/shipping - Route Accessibility',
    404 // Session not found is expected, but route should exist
  );

  // Test 7: POST /api/v1/checkout/session/:sessionId/payment
  await testEndpointWithBody(
    'POST',
    `/api/v1/checkout/session/${testSessionId}/payment`,
    { method: 'CASH_ON_DELIVERY', details: {} },
    'POST /api/v1/checkout/session/:sessionId/payment - Route Accessibility',
    404 // Session not found is expected, but route should exist
  );

  // Test 8: POST /api/v1/checkout/session/:sessionId/complete
  await testEndpointWithBody(
    'POST',
    `/api/v1/checkout/session/${testSessionId}/complete`,
    {},
    'POST /api/v1/checkout/session/:sessionId/complete - Route Accessibility',
    404 // Session not found is expected, but route should exist
  );

  // Test 9: DELETE /api/v1/checkout/session/:sessionId
  await testEndpointWithBody(
    'DELETE',
    `/api/v1/checkout/session/${testSessionId}`,
    { reason: 'test' },
    'DELETE /api/v1/checkout/session/:sessionId - Route Accessibility',
    404 // Session not found is expected, but route should exist
  );

  console.log(`\n${colors.yellow}=== Phase 3: Utility Endpoints ===${colors.reset}`);

  // Test 10: GET /api/v1/checkout/shipping-methods
  await testEndpointAccessibility(
    'GET',
    '/api/v1/checkout/shipping-methods',
    'GET /api/v1/checkout/shipping-methods - Route Accessibility',
    200
  );

  // Test 11: GET /api/v1/checkout/payment-methods
  await testEndpointAccessibility(
    'GET',
    '/api/v1/checkout/payment-methods',
    'GET /api/v1/checkout/payment-methods - Route Accessibility',
    200
  );

  // Test 12: POST /api/v1/checkout/validate-address
  await testEndpointWithBody(
    'POST',
    '/api/v1/checkout/validate-address',
    { address: testAddress },
    'POST /api/v1/checkout/validate-address - Route Accessibility',
    200
  );

  console.log(`\n${colors.yellow}=== Phase 4: Guest Checkout Endpoints ===${colors.reset}`);

  // Test 13: GET /api/v1/guest/checkout/session/:sessionId
  await testEndpointAccessibility(
    'GET',
    `/api/v1/guest/checkout/session/${testSessionId}`,
    'GET /api/v1/guest/checkout/session/:sessionId - Route Accessibility',
    404 // Session not found is expected, but route should exist
  );

  // Test 14: POST /api/v1/guest/checkout/session/:sessionId/info
  await testEndpointWithBody(
    'POST',
    `/api/v1/guest/checkout/session/${testSessionId}/info`,
    { firstName: 'Test', lastName: 'User', email: 'test@example.com', phone: '+8801700000000' },
    'POST /api/v1/guest/checkout/session/:sessionId/info - Route Accessibility',
    404 // Session not found is expected, but route should exist
  );

  // Test 15: POST /api/v1/guest/checkout/session/:sessionId/complete
  await testEndpointWithBody(
    'POST',
    `/api/v1/guest/checkout/session/${testSessionId}/complete`,
    { 
      shippingAddress: testAddress,
      billingAddress: testAddress,
      paymentMethod: 'CASH_ON_DELIVERY'
    },
    'POST /api/v1/guest/checkout/session/:sessionId/complete - Route Accessibility',
    404 // Session not found is expected, but route should exist
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
  const resultsFilename = `checkout-endpoint-test-results-${timestamp}.json`;
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
    console.log(`\n${colors.green}✓ Original Error RESOLVED:${colors.reset} The route POST /api/v1/checkout/initialize is now accessible`);
  } else if (initializeTest && !initializeTest.passed) {
    if (initializeTest.details && initializeTest.details.statusCode === 404) {
      console.log(`\n${colors.red}✗ Original Error NOT RESOLVED:${colors.reset} The route POST /api/v1/checkout/initialize still returns 404`);
    } else {
      console.log(`\n${colors.yellow}⚠ Route exists but returns different status:${colors.reset} ${initializeTest.details.statusCode}`);
    }
  }

  process.exit(testResults.failed > 0 ? 1 : 0);
}

// Run tests
runTests().catch(error => {
  console.error(`${colors.red}Error running tests:${colors.reset}`, error);
  process.exit(1);
});
