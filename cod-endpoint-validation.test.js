/**
 * COD Endpoint Validation Test Script
 * Tests the COD validation endpoint fix to verify it resolves the 404 error
 */

const http = require('http');
const fs = require('fs');

// Test configuration
const BASE_URL = 'http://localhost:3001';
const TEST_RESULTS = [];

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function makeRequest(url, testName, expectedStatus = 200, expectedValid = null) {
  return new Promise((resolve) => {
    log(`\n[TEST] ${testName}`, 'cyan');
    log(`URL: ${url}`, 'blue');

    const options = {
      method: 'GET',
      timeout: 10000
    };

    const req = http.request(url, options, (res) => {
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

          // Check expected valid field if specified
          if (expectedValid !== null && data.data && data.data.valid !== undefined) {
            if (data.data.valid !== expectedValid) {
              passed = false;
              log(`Expected valid: ${expectedValid}, got: ${data.data.valid}`, 'red');
            }
          }

          log(`Result: ${passed ? 'PASSED' : 'FAILED'}`, passed ? 'green' : 'red');

          TEST_RESULTS.push({
            testName,
            url,
            expectedStatus,
            actualStatus: statusCode,
            expectedValid,
            actualValid: data.data?.valid,
            response: data,
            passed
          });

          resolve();
        } catch (error) {
          log(`Error parsing response: ${error.message}`, 'red');
          log(`Raw response: ${body}`, 'yellow');

          TEST_RESULTS.push({
            testName,
            url,
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
        url,
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
        url,
        expectedStatus,
        error: 'Timeout',
        passed: false
      });

      resolve();
    });

    req.end();
  });
}

async function runTests() {
  log('\n========================================', 'cyan');
  log('COD ENDPOINT VALIDATION TEST SUITE', 'cyan');
  log('========================================\n', 'cyan');

  // Test Case 1: Basic COD Validation
  await makeRequest(
    `${BASE_URL}/api/v1/cod/validate?division=dhaka&amount=75950`,
    'Test Case 1: Basic COD Validation (division=dhaka, amount=75950)',
    200
  );

  // Test Case 2: COD Validation with User ID
  await makeRequest(
    `${BASE_URL}/api/v1/cod/validate?userId=2bdca14e-ac33-43ca-b98a-5117c8ecdeb9&division=dhaka&amount=75950`,
    'Test Case 2: COD Validation with User ID',
    200
  );

  // Test Case 3: Invalid Division
  await makeRequest(
    `${BASE_URL}/api/v1/cod/validate?division=invalid&amount=75950`,
    'Test Case 3: Invalid Division',
    200,
    false
  );

  // Test Case 4: Amount Below Minimum
  await makeRequest(
    `${BASE_URL}/api/v1/cod/validate?division=dhaka&amount=-100`,
    'Test Case 4: Amount Below Minimum (negative amount)',
    400
  );

  // Test Case 5: Amount Above Maximum
  await makeRequest(
    `${BASE_URL}/api/v1/cod/validate?division=dhaka&amount=1000000`,
    'Test Case 5: Amount Above Maximum',
    200,
    false
  );

  // Test other COD endpoints
  log('\n========================================', 'cyan');
  log('OTHER COD ENDPOINTS', 'cyan');
  log('========================================\n', 'cyan');

  await makeRequest(
    `${BASE_URL}/api/v1/cod/settings`,
    'GET /api/v1/cod/settings',
    200
  );

  await makeRequest(
    `${BASE_URL}/api/v1/cod/configuration`,
    'GET /api/v1/cod/configuration',
    200
  );

  await makeRequest(
    `${BASE_URL}/api/v1/cod/availability`,
    'GET /api/v1/cod/availability',
    200
  );

  await makeRequest(
    `${BASE_URL}/api/v1/cod/fee/75950`,
    'GET /api/v1/cod/fee/75950',
    200
  );

  await makeRequest(
    `${BASE_URL}/api/v1/cod/limit/2bdca14e-ac33-43ca-b98a-5117c8ecdeb9`,
    'GET /api/v1/cod/limit/{userId}',
    200
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

    if (result.expectedValid !== undefined && result.actualValid !== undefined) {
      const validMatch = result.actualValid === result.expectedValid;
      log(`   Valid: ${result.actualValid} (expected: ${result.expectedValid})`, validMatch ? 'green' : 'yellow');
    }

    if (result.error) {
      log(`   Error: ${result.error}`, 'red');
    }

    if (result.response) {
      log(`   Response: ${JSON.stringify(result.response)}`, 'blue');
    }
  });

  // Save results to JSON file
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `cod-endpoint-test-results-${timestamp}.json`;

  fs.writeFileSync(filename, JSON.stringify({
    timestamp: new Date().toISOString(),
    totalTests,
    passedTests,
    failedTests,
    successRate: ((passedTests / totalTests) * 100).toFixed(2),
    results: TEST_RESULTS
  }, null, 2));

  log(`\n\nDetailed results saved to: ${filename}`, 'green');

  // Overall assessment
  log('\n========================================', 'cyan');
  log('OVERALL ASSESSMENT', 'cyan');
  log('========================================\n', 'cyan');

  if (failedTests === 0) {
    log('✓ ALL TESTS PASSED', 'green');
    log('The COD endpoint fix is successful. All endpoints are accessible and responding correctly.', 'green');
    log('The 404 Not Found error has been resolved.', 'green');
  } else {
    log(`✗ ${failedTests} TEST(S) FAILED`, 'red');
    log('Please review the failed tests above for details.', 'yellow');
  }

  log('\n========================================\n', 'cyan');
}

// Run the tests
runTests().catch(error => {
  log(`\nTest suite failed with error: ${error.message}`, 'red');
  console.error(error);
  process.exit(1);
});
