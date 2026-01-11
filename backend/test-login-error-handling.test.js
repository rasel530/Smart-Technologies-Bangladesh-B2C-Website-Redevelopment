/**
 * Comprehensive Test Script for Login Error Handling with Bilingual Messages
 * 
 * This script tests all error scenarios in the login endpoint to verify:
 * - Proper bilingual error messages (English and Bengali)
 * - Correct HTTP status codes
 * - Complete response structure with all required fields
 * 
 * Test Scenarios:
 * 1. Invalid email format
 * 2. Invalid phone format
 * 3. Non-existent email (invalid credentials)
 * 4. Non-existent phone (invalid credentials)
 * 5. Wrong password for existing user (email)
 * 6. Wrong password for existing user (phone)
 * 7. Account not verified (email)
 * 8. Account not verified (phone)
 */

const http = require('http');

const API_BASE_URL = 'localhost';
const API_PORT = 3001;
const API_PATH = '/api/v1/auth/login';

// Test results tracking
const testResults = {
  passed: 0,
  failed: 0,
  total: 0,
  details: []
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
 * Make HTTP POST request to login endpoint
 */
function makeLoginRequest(loginData) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(loginData);

    const options = {
      hostname: API_BASE_URL,
      port: API_PORT,
      path: API_PATH,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = http.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: parsed
          });
        } catch (e) {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: data
          });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.write(postData);
    req.end();
  });
}

/**
 * Verify error response structure
 */
function verifyErrorResponse(response, expectedStatus, testName) {
  const result = {
    testName,
    passed: true,
    expectedStatus,
    actualStatus: response.statusCode,
    checks: []
  };

  // Check status code
  const statusCheck = {
    name: `Status Code is ${expectedStatus}`,
    passed: response.statusCode === expectedStatus,
    expected: expectedStatus,
    actual: response.statusCode
  };
  result.checks.push(statusCheck);

  if (!statusCheck.passed) {
    result.passed = false;
  }

  // Check if response is JSON
  const isJson = typeof response.body === 'object';
  const jsonCheck = {
    name: 'Response is JSON',
    passed: isJson,
    expected: true,
    actual: isJson
  };
  result.checks.push(jsonCheck);

  if (!isJson) {
    result.passed = false;
    return result;
  }

  // Check for error field
  const errorCheck = {
    name: 'Response has "error" field',
    passed: 'error' in response.body,
    expected: true,
    actual: 'error' in response.body
  };
  result.checks.push(errorCheck);

  if (!errorCheck.passed) {
    result.passed = false;
  }

  // Check for message field
  const messageCheck = {
    name: 'Response has "message" field (English)',
    passed: 'message' in response.body,
    expected: true,
    actual: 'message' in response.body
  };
  result.checks.push(messageCheck);

  if (!messageCheck.passed) {
    result.passed = false;
  }

  // Check for messageBn field
  const messageBnCheck = {
    name: 'Response has "messageBn" field (Bengali)',
    passed: 'messageBn' in response.body,
    expected: true,
    actual: 'messageBn' in response.body
  };
  result.checks.push(messageBnCheck);

  if (!messageBnCheck.passed) {
    result.passed = false;
  }

  // Check that messageBn is not empty
  if (messageBnCheck.passed) {
    const messageBnNotEmpty = {
      name: 'messageBn is not empty',
      passed: response.body.messageBn && response.body.messageBn.length > 0,
      expected: true,
      actual: response.body.messageBn && response.body.messageBn.length > 0
    };
    result.checks.push(messageBnNotEmpty);

    if (!messageBnNotEmpty.passed) {
      result.passed = false;
    }
  }

  // Check for code field (phone validation errors should have this)
  const codeCheck = {
    name: 'Response has "code" field (for phone validation)',
    passed: 'code' in response.body,
    expected: testName.includes('phone format'),
    actual: 'code' in response.body
  };
  result.checks.push(codeCheck);

  // Check for requiresVerification field (verification errors should have this)
  const verificationCheck = {
    name: 'Response has "requiresVerification" field',
    passed: 'requiresVerification' in response.body,
    expected: testName.includes('not verified'),
    actual: 'requiresVerification' in response.body
  };
  result.checks.push(verificationCheck);

  // Check for verificationType field (verification errors should have this)
  const verificationTypeCheck = {
    name: 'Response has "verificationType" field',
    passed: 'verificationType' in response.body,
    expected: testName.includes('not verified'),
    actual: 'verificationType' in response.body
  };
  result.checks.push(verificationTypeCheck);

  return result;
}

/**
 * Print test result
 */
function printTestResult(result) {
  console.log(`\n${colors.cyan}========================================${colors.reset}`);
  console.log(`${colors.cyan}Test: ${result.testName}${colors.reset}`);
  console.log(`${colors.cyan}========================================${colors.reset}`);

  const statusColor = result.passed ? colors.green : colors.red;
  const statusText = result.passed ? '✓ PASSED' : '✗ FAILED';
  console.log(`\n${statusColor}${statusText}${colors.reset}`);

  console.log(`\n${colors.yellow}Expected Status: ${result.expectedStatus}${colors.reset}`);
  console.log(`${colors.yellow}Actual Status: ${result.actualStatus}${colors.reset}`);

  console.log(`\n${colors.blue}Checks:${colors.reset}`);
  result.checks.forEach((check, index) => {
    const checkColor = check.passed ? colors.green : colors.red;
    const checkSymbol = check.passed ? '✓' : '✗';
    console.log(`  ${checkColor}${checkSymbol} ${check.name}${colors.reset}`);
    if (!check.passed) {
      console.log(`    ${colors.red}Expected: ${check.expected}, Actual: ${check.actual}${colors.reset}`);
    }
  });

  return result.passed;
}

/**
 * Print test summary
 */
function printTestSummary() {
  console.log(`\n\n${colors.cyan}========================================${colors.reset}`);
  console.log(`${colors.cyan}TEST SUMMARY${colors.reset}`);
  console.log(`${colors.cyan}========================================${colors.reset}`);
  console.log(`\n${colors.blue}Total Tests: ${testResults.total}${colors.reset}`);
  console.log(`${colors.green}Passed: ${testResults.passed}${colors.reset}`);
  console.log(`${colors.red}Failed: ${testResults.failed}${colors.reset}`);
  console.log(`\n${colors.blue}Success Rate: ${((testResults.passed / testResults.total) * 100).toFixed(2)}%${colors.reset}`);

  if (testResults.failed > 0) {
    console.log(`\n${colors.red}Failed Tests:${colors.reset}`);
    testResults.details.filter(r => !r.passed).forEach(detail => {
      console.log(`  ${colors.red}✗ ${detail.testName}${colors.reset}`);
    });
  }

  console.log(`\n${colors.cyan}========================================${colors.reset}\n`);
}

/**
 * Run all test scenarios
 */
async function runTests() {
  console.log(`\n${colors.cyan}========================================${colors.reset}`);
  console.log(`${colors.cyan}LOGIN ERROR HANDLING TEST SUITE${colors.reset}`);
  console.log(`${colors.cyan}========================================${colors.reset}`);
  console.log(`\n${colors.blue}Testing login endpoint: http://${API_BASE_URL}:${API_PORT}${API_PATH}${colors.reset}`);
  console.log(`${colors.blue}Start Time: ${new Date().toISOString()}${colors.reset}\n`);

  const testScenarios = [
    {
      name: 'Invalid email format',
      data: {
        identifier: 'invalid-email',
        password: 'TestPassword123!'
      },
      expectedStatus: 400
    },
    {
      name: 'Invalid phone format - too short',
      data: {
        identifier: '0123',
        password: 'TestPassword123!'
      },
      expectedStatus: 400
    },
    {
      name: 'Invalid phone format - invalid prefix',
      data: {
        identifier: '01234567890',
        password: 'TestPassword123!'
      },
      expectedStatus: 400
    },
    {
      name: 'Non-existent email (invalid credentials)',
      data: {
        identifier: 'nonexistent@example.com',
        password: 'TestPassword123!'
      },
      expectedStatus: 401
    },
    {
      name: 'Non-existent phone (invalid credentials)',
      data: {
        identifier: '01912345678',
        password: 'TestPassword123!'
      },
      expectedStatus: 401
    },
    {
      name: 'Wrong password for existing user (email)',
      data: {
        identifier: 'test@example.com',
        password: 'WrongPassword123!'
      },
      expectedStatus: 401
    },
    {
      name: 'Wrong password for existing user (phone)',
      data: {
        identifier: '01712345678',
        password: 'WrongPassword123!'
      },
      expectedStatus: 401
    },
    {
      name: 'Account not verified (email)',
      data: {
        identifier: 'pending@example.com',
        password: 'TestPassword123!'
      },
      expectedStatus: 403
    },
    {
      name: 'Account not verified (phone)',
      data: {
        identifier: '01812345678',
        password: 'TestPassword123!'
      },
      expectedStatus: 403
    }
  ];

  for (const scenario of testScenarios) {
    testResults.total++;

    console.log(`\n${colors.yellow}Running: ${scenario.name}${colors.reset}`);
    console.log(`${colors.blue}Request: ${JSON.stringify(scenario.data, null, 2)}${colors.reset}`);

    try {
      const response = await makeLoginRequest(scenario.data);
      
      console.log(`${colors.blue}Response Status: ${response.statusCode}${colors.reset}`);
      console.log(`${colors.blue}Response Body:${colors.reset}`);
      console.log(JSON.stringify(response.body, null, 2));

      const verificationResult = verifyErrorResponse(response, scenario.expectedStatus, scenario.name);
      testResults.details.push(verificationResult);

      if (printTestResult(verificationResult)) {
        testResults.passed++;
      } else {
        testResults.failed++;
      }

    } catch (error) {
      console.log(`${colors.red}Error: ${error.message}${colors.reset}`);
      
      const failedResult = {
        testName: scenario.name,
        passed: false,
        expectedStatus: scenario.expectedStatus,
        actualStatus: 'ERROR',
        checks: [{
          name: 'Request completed without error',
          passed: false,
          expected: true,
          actual: false
        }]
      };
      testResults.details.push(failedResult);
      testResults.failed++;
      printTestResult(failedResult);
    }

    // Small delay between tests
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  printTestSummary();

  // Exit with appropriate code
  process.exit(testResults.failed > 0 ? 1 : 0);
}

// Run the tests
console.log('Starting login error handling tests...\n');
runTests().catch(error => {
  console.error(`${colors.red}Fatal error running tests:${colors.reset}`, error);
  process.exit(1);
});
