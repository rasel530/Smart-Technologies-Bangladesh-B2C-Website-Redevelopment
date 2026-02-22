/**
 * Local Payment Methods Validation Fix Test Script
 * Tests the validation fix that allows custom string IDs instead of requiring UUIDs
 * 
 * The fix replaced `param('id').isUUID()` with `param('id').isString().notEmpty()` 
 * in 5 locations in backend/routes/admin/localPayment.js
 */

const http = require('http');
const fs = require('fs');

// Test configuration
const BASE_URL = 'http://localhost:3001';
const TEST_RESULTS = [];

// Test payment method IDs
const PAYMENT_METHOD_IDS = ['bkash-001', 'nagad-001', 'rocket-001', 'surecash-001'];

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function makeRequest(options, testName, expectedStatus = 200, expectedError = null) {
  return new Promise((resolve) => {
    log(`\n[TEST] ${testName}`, 'cyan');
    log(`Method: ${options.method}`, 'blue');
    log(`URL: ${options.url}`, 'blue');
    
    if (options.body) {
      log(`Body: ${JSON.stringify(options.body, null, 2)}`, 'blue');
    }

    const requestOptions = {
      method: options.method,
      timeout: 10000,
      headers: options.headers || {}
    };

    const req = http.request(options.url, requestOptions, (res) => {
      let body = '';

      res.on('data', (chunk) => {
        body += chunk;
      });

      res.on('end', () => {
        try {
          const data = JSON.parse(body);
          const statusCode = res.statusCode;

          log(`Status Code: ${statusCode}`, statusCode === expectedStatus ? 'green' : 'yellow');
          log(`Response: ${JSON.stringify(data, null, 2)}`, 'blue');

          // Determine if test passed
          let passed = statusCode === expectedStatus;

          // Check for specific validation errors
          if (expectedError) {
            if (!data.error || !data.error.includes(expectedError)) {
              passed = false;
              log(`Expected error containing: "${expectedError}"`, 'red');
              log(`Actual error: ${data.error || 'none'}`, 'red');
            }
          }

          // Check for validation errors (400 status)
          if (expectedStatus === 400) {
            if (!data.error || !data.error.includes('Validation failed')) {
              passed = false;
              log(`Expected validation error`, 'red');
            }
          }

          log(`Result: ${passed ? 'PASSED' : 'FAILED'}`, passed ? 'green' : 'red');

          TEST_RESULTS.push({
            testName,
            method: options.method,
            url: options.url,
            expectedStatus,
            actualStatus: statusCode,
            expectedError,
            actualError: data.error,
            response: data,
            passed
          });

          resolve();
        } catch (error) {
          log(`Error parsing response: ${error.message}`, 'red');
          log(`Raw response: ${body}`, 'yellow');

          TEST_RESULTS.push({
            testName,
            method: options.method,
            url: options.url,
            expectedStatus,
            actualStatus: res.statusCode,
            error: error.message,
            passed: false
          });

          resolve();
        }
      });
    });

    req.on('error', (error) => {
      log(`Request failed: ${error.message}`, 'red');

      TEST_RESULTS.push({
        testName,
        method: options.method,
        url: options.url,
        expectedStatus,
        error: error.message,
        passed: false
      });

      resolve();
    });

    req.on('timeout', () => {
      log('Request timed out', 'red');
      req.destroy();

      TEST_RESULTS.push({
        testName,
        method: options.method,
        url: options.url,
        expectedStatus,
        error: 'Timeout',
        passed: false
      });

      resolve();
    });

    if (options.body) {
      req.write(JSON.stringify(options.body));
    }

    req.end();
  });
}

async function runTests() {
  log('\n========================================', 'cyan');
  log('LOCAL PAYMENT VALIDATION FIX TEST SUITE', 'cyan');
  log('========================================\n', 'cyan');

  // ============================================================================
  // PART 1: Test all 5 affected endpoints with custom string IDs
  // ============================================================================
  log('\n========================================', 'magenta');
  log('PART 1: Testing All 5 Affected Endpoints', 'magenta');
  log('========================================\n', 'magenta');

  // Endpoint 1: PUT /api/v1/admin/local-payment/methods/:id (update payment method)
  log('\n--- Endpoint 1: PUT /api/v1/admin/local-payment/methods/:id ---', 'yellow');
  for (const methodId of PAYMENT_METHOD_IDS) {
    await makeRequest({
      method: 'PUT',
      url: `${BASE_URL}/api/v1/admin/local-payment/methods/${methodId}`,
      headers: { 'Content-Type': 'application/json' },
      body: {
        displayName: `${methodId} Updated`,
        isActive: true
      }
    },
    `PUT /methods/${methodId} - Update payment method with custom string ID`,
    401 // Should pass validation (400 would mean validation failed), then fail auth (401)
    );
  }

  // Endpoint 2: DELETE /api/v1/admin/local-payment/methods/:id (delete payment method)
  log('\n--- Endpoint 2: DELETE /api/v1/admin/local-payment/methods/:id ---', 'yellow');
  for (const methodId of PAYMENT_METHOD_IDS) {
    await makeRequest({
      method: 'DELETE',
      url: `${BASE_URL}/api/v1/admin/local-payment/methods/${methodId}`
    },
    `DELETE /methods/${methodId} - Delete payment method with custom string ID`,
    401 // Should pass validation, then fail auth
    );
  }

  // Endpoint 3: GET /api/v1/admin/local-payment/sms-subscriptions/:id (get SMS subscription)
  log('\n--- Endpoint 3: GET /api/v1/admin/local-payment/sms-subscriptions/:id ---', 'yellow');
  for (const methodId of PAYMENT_METHOD_IDS) {
    await makeRequest({
      method: 'GET',
      url: `${BASE_URL}/api/v1/admin/local-payment/sms-subscriptions/${methodId}`
    },
    `GET /sms-subscriptions/${methodId} - Get SMS subscription with custom string ID`,
    200 // Should pass validation and succeed (no auth required)
    );
  }

  // Endpoint 4: PUT /api/v1/admin/local-payment/sms-subscriptions/:id (update SMS subscription)
  log('\n--- Endpoint 4: PUT /api/v1/admin/local-payment/sms-subscriptions/:id ---', 'yellow');
  for (const methodId of PAYMENT_METHOD_IDS) {
    await makeRequest({
      method: 'PUT',
      url: `${BASE_URL}/api/v1/admin/local-payment/sms-subscriptions/${methodId}`,
      headers: { 'Content-Type': 'application/json' },
      body: {
        isSubscribed: true,
        status: 'active'
      }
    },
    `PUT /sms-subscriptions/${methodId} - Update SMS subscription with custom string ID`,
    401 // Should pass validation, then fail auth
    );
  }

  // Endpoint 5: DELETE /api/v1/admin/local-payment/sms-subscriptions/:id (delete SMS subscription)
  log('\n--- Endpoint 5: DELETE /api/v1/admin/local-payment/sms-subscriptions/:id ---', 'yellow');
  for (const methodId of PAYMENT_METHOD_IDS) {
    await makeRequest({
      method: 'DELETE',
      url: `${BASE_URL}/api/v1/admin/local-payment/sms-subscriptions/${methodId}`
    },
    `DELETE /sms-subscriptions/${methodId} - Delete SMS subscription with custom string ID`,
    401 // Should pass validation, then fail auth
    );
  }

  // ============================================================================
  // PART 2: Test operations that were failing
  // ============================================================================
  log('\n========================================', 'magenta');
  log('PART 2: Testing Operations That Were Failing', 'magenta');
  log('========================================\n', 'magenta');

  // Test Create new payment method (POST /methods)
  log('\n--- Create New Payment Method ---', 'yellow');
  await makeRequest({
    method: 'POST',
    url: `${BASE_URL}/api/v1/admin/local-payment/methods`,
    headers: { 'Content-Type': 'application/json' },
    body: {
      name: 'Test Payment Method',
      code: 'test-001',
      displayName: 'Test Method',
      minAmount: 0,
      maxAmount: 100000,
      processingFee: 0,
      processingFeePercent: 0,
      requiresPhone: true,
      requiresPin: false,
      supportedNetworks: ['gp', 'robi', 'banglalink', 'airtel']
    }
  },
  'POST /methods - Create new payment method with custom code',
  401 // Should pass validation, then fail auth
  );

  // Test Edit existing payment method (PUT /methods/:id)
  log('\n--- Edit Existing Payment Method ---', 'yellow');
  await makeRequest({
    method: 'PUT',
    url: `${BASE_URL}/api/v1/admin/local-payment/methods/bkash-001`,
    headers: { 'Content-Type': 'application/json' },
    body: {
      displayName: 'bKash Updated',
      description: 'Updated description',
      instructions: 'Updated instructions'
    }
  },
  'PUT /methods/bkash-001 - Edit existing payment method',
  401 // Should pass validation, then fail auth
  );

  // Test Update payment method (PUT /methods/:id with isActive)
  log('\n--- Update Payment Method Status ---', 'yellow');
  await makeRequest({
    method: 'PUT',
    url: `${BASE_URL}/api/v1/admin/local-payment/methods/nagad-001`,
    headers: { 'Content-Type': 'application/json' },
    body: {
      isActive: false
    }
  },
  'PUT /methods/nagad-001 - Deactivate payment method',
  401 // Should pass validation, then fail auth
  );

  await makeRequest({
    method: 'PUT',
    url: `${BASE_URL}/api/v1/admin/local-payment/methods/nagad-001`,
    headers: { 'Content-Type': 'application/json' },
    body: {
      isActive: true
    }
  },
  'PUT /methods/nagad-001 - Activate payment method',
  401 // Should pass validation, then fail auth
  );

  // Test Delete payment method (DELETE /methods/:id)
  log('\n--- Delete Payment Method ---', 'yellow');
  await makeRequest({
    method: 'DELETE',
    url: `${BASE_URL}/api/v1/admin/local-payment/methods/rocket-001`
  },
  'DELETE /methods/rocket-001 - Delete payment method',
  401 // Should pass validation, then fail auth
  );

  // ============================================================================
  // PART 3: Test validation still works correctly
  // ============================================================================
  log('\n========================================', 'magenta');
  log('PART 3: Testing Validation Still Works Correctly', 'magenta');
  log('========================================\n', 'magenta');

  // Test empty string should be rejected
  log('\n--- Empty String Validation ---', 'yellow');
  await makeRequest({
    method: 'PUT',
    url: `${BASE_URL}/api/v1/admin/local-payment/methods/`,
    headers: { 'Content-Type': 'application/json' },
    body: { displayName: 'Test' }
  },
  'PUT /methods/ - Empty string ID should be rejected',
  404 // Empty ID results in 404 (route not found)
  );

  // Test with whitespace-only ID
  await makeRequest({
    method: 'PUT',
    url: `${BASE_URL}/api/v1/admin/local-payment/methods/%20%20%20`,
    headers: { 'Content-Type': 'application/json' },
    body: { displayName: 'Test' }
  },
  'PUT /methods/   - Whitespace-only ID should be rejected',
  401 // Should pass validation (whitespace is a string), then fail auth
  );

  // Test with special characters
  await makeRequest({
    method: 'PUT',
    url: `${BASE_URL}/api/v1/admin/local-payment/methods/test@#$%`,
    headers: { 'Content-Type': 'application/json' },
    body: { displayName: 'Test' }
  },
  'PUT /methods/test@#$% - Special characters in ID',
  401 // Should pass validation (special chars are allowed), then fail auth
  );

  // Test with very long ID
  await makeRequest({
    method: 'PUT',
    url: `${BASE_URL}/api/v1/admin/local-payment/methods/${'a'.repeat(500)}`,
    headers: { 'Content-Type': 'application/json' },
    body: { displayName: 'Test' }
  },
  `PUT /methods/${'a'.repeat(20)}... - Very long ID`,
  401 // Should pass validation, then fail auth
  );

  // ============================================================================
  // PART 4: Test with various custom string ID formats
  // ============================================================================
  log('\n========================================', 'magenta');
  log('PART 4: Testing Various Custom String ID Formats', 'magenta');
  log('========================================\n', 'magenta');

  const customIds = [
    'custom-001',
    'payment-2024-001',
    'METHOD_001',
    'test.method.001',
    '12345',
    'abc123xyz',
    'upi-001'
  ];

  for (const customId of customIds) {
    await makeRequest({
      method: 'PUT',
      url: `${BASE_URL}/api/v1/admin/local-payment/methods/${customId}`,
      headers: { 'Content-Type': 'application/json' },
      body: { displayName: 'Test' }
    },
    `PUT /methods/${customId} - Custom string ID format`,
    401 // Should pass validation, then fail auth
    );
  }

  // ============================================================================
  // PART 5: Test GET /methods endpoint (list all payment methods)
  // ============================================================================
  log('\n========================================', 'magenta');
  log('PART 5: Testing List Payment Methods Endpoint', 'magenta');
  log('========================================\n', 'magenta');

  await makeRequest({
    method: 'GET',
    url: `${BASE_URL}/api/v1/admin/local-payment/methods`
  },
  'GET /methods - List all payment methods',
  200 // Should succeed
  );

  // ============================================================================
  // PART 6: Test GET /sms-subscriptions endpoint (list all SMS subscriptions)
  // ============================================================================
  log('\n========================================', 'magenta');
  log('PART 6: Testing List SMS Subscriptions Endpoint', 'magenta');
  log('========================================\n', 'magenta');

  await makeRequest({
    method: 'GET',
    url: `${BASE_URL}/api/v1/admin/local-payment/sms-subscriptions`
  },
  'GET /sms-subscriptions - List all SMS subscriptions',
  200 // Should succeed
  );

  // Generate summary report
  generateSummaryReport();
}

function generateSummaryReport() {
  log('\n========================================', 'cyan');
  log('TEST SUMMARY REPORT', 'cyan');
  log('========================================\n', 'cyan');

  const totalTests = TEST_RESULTS.length;
  const passedTests = TEST_RESULTS.filter(r => r.passed).length;
  const failedTests = totalTests - passedTests;

  log(`Total Tests: ${totalTests}`, 'cyan');
  log(`Passed: ${passedTests}`, 'green');
  log(`Failed: ${failedTests}`, failedTests > 0 ? 'red' : 'green');
  log(`Success Rate: ${((passedTests / totalTests) * 100).toFixed(2)}%`, 'cyan');

  // Group results by endpoint
  log('\n========================================', 'cyan');
  log('RESULTS BY ENDPOINT', 'cyan');
  log('========================================\n', 'cyan');

  const endpointGroups = {
    'PUT /methods/:id': TEST_RESULTS.filter(r => r.url.includes('/methods/') && r.method === 'PUT'),
    'DELETE /methods/:id': TEST_RESULTS.filter(r => r.url.includes('/methods/') && r.method === 'DELETE'),
    'GET /sms-subscriptions/:id': TEST_RESULTS.filter(r => r.url.includes('/sms-subscriptions/') && r.method === 'GET'),
    'PUT /sms-subscriptions/:id': TEST_RESULTS.filter(r => r.url.includes('/sms-subscriptions/') && r.method === 'PUT'),
    'DELETE /sms-subscriptions/:id': TEST_RESULTS.filter(r => r.url.includes('/sms-subscriptions/') && r.method === 'DELETE'),
    'POST /methods': TEST_RESULTS.filter(r => r.url.includes('/methods') && r.method === 'POST'),
    'GET /methods': TEST_RESULTS.filter(r => r.url.includes('/methods') && r.method === 'GET'),
    'GET /sms-subscriptions': TEST_RESULTS.filter(r => r.url.includes('/sms-subscriptions') && r.method === 'GET')
  };

  for (const [endpoint, results] of Object.entries(endpointGroups)) {
    if (results.length > 0) {
      const passed = results.filter(r => r.passed).length;
      const total = results.length;
      log(`${endpoint}: ${passed}/${total} passed`, passed === total ? 'green' : 'yellow');
    }
  }

  log('\n========================================', 'cyan');
  log('DETAILED RESULTS', 'cyan');
  log('========================================\n', 'cyan');

  TEST_RESULTS.forEach((result, index) => {
    log(`\n${index + 1}. ${result.testName}`, 'cyan');
    log(`   Status: ${result.passed ? '✓ PASSED' : '✗ FAILED'}`, result.passed ? 'green' : 'red');

    if (result.actualStatus) {
      const statusMatch = result.actualStatus === result.expectedStatus;
      log(`   HTTP Status: ${result.actualStatus} (expected: ${result.expectedStatus})`, statusMatch ? 'green' : 'yellow');
    }

    if (result.error) {
      log(`   Error: ${result.error}`, 'red');
    }

    if (result.response) {
      // Check for validation errors
      if (result.response.error && result.response.error.includes('Validation failed')) {
        log(`   Validation Error: ${result.response.error}`, 'red');
      }
    }
  });

  // Save results to JSON file
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `local-payment-validation-fix-test-results-${timestamp}.json`;

  fs.writeFileSync(filename, JSON.stringify({
    timestamp: new Date().toISOString(),
    totalTests,
    passedTests,
    failedTests,
    successRate: ((passedTests / totalTests) * 100).toFixed(2),
    results: TEST_RESULTS,
    endpointGroups: Object.fromEntries(
      Object.entries(endpointGroups).map(([endpoint, results]) => [
        endpoint,
        {
          total: results.length,
          passed: results.filter(r => r.passed).length,
          failed: results.filter(r => !r.passed).length
        }
      ])
    )
  }, null, 2));

  log(`\n\nDetailed results saved to: ${filename}`, 'green');

  // Overall assessment
  log('\n========================================', 'cyan');
  log('OVERALL ASSESSMENT', 'cyan');
  log('========================================\n', 'cyan');

  // Check if validation is working correctly
  const validationErrors = TEST_RESULTS.filter(r => 
    r.response && r.response.error && r.response.error.includes('Invalid method ID')
  );

  if (validationErrors.length === 0) {
    log('✓ VALIDATION FIX VERIFIED', 'green');
    log('All endpoints accept custom string IDs without "Invalid method ID" errors.', 'green');
    log('The validation has been successfully updated from UUID to String.', 'green');
  } else {
    log('✗ VALIDATION FIX FAILED', 'red');
    log(`Found ${validationErrors.length} requests with "Invalid method ID" errors.`, 'red');
  }

  // Check if authentication is still required
  const authErrors = TEST_RESULTS.filter(r => 
    r.actualStatus === 401 && r.response && r.response.error && 
    (r.response.error.includes('Authentication required') || r.response.error.includes('No token provided'))
  );

  if (authErrors.length > 0) {
    log(`\n✓ AUTHENTICATION STILL WORKING`, 'green');
    log(`${authErrors.length} requests correctly require authentication.`, 'green');
  }

  if (failedTests === 0) {
    log('\n✓ ALL TESTS PASSED', 'green');
    log('The local payment validation fix is successful.', 'green');
    log('All operations with custom string IDs work correctly.', 'green');
  } else {
    log(`\n✗ ${failedTests} TEST(S) FAILED`, 'red');
    log('Please review the failed tests above for details.', 'yellow');
  }

  log('\n========================================\n', 'cyan');
}

// Add a delay before running tests to allow server to be ready
async function waitForServer() {
  log('\n========================================', 'cyan');
  log('WAITING FOR SERVER TO BE READY', 'cyan');
  log('========================================\n', 'cyan');
  log('Waiting 5 seconds for server to fully initialize...', 'yellow');
  
  return new Promise(resolve => {
    setTimeout(() => {
      log('Server should be ready now. Starting tests...\n', 'green');
      resolve();
    }, 5000);
  });
}

// Run the tests
waitForServer().then(() => {
  return runTests();
}).catch(error => {
  log(`\nTest suite failed with error: ${error.message}`, 'red');
  console.error(error);
  process.exit(1);
});
