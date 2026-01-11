/**
 * Focused Test Script for Email vs Phone Specific Error Messages
 * 
 * This script tests the specific error messages returned by the backend
 * based on login type (email vs phone) to verify:
 * - Correct English message based on identifier type
 * - Correct Bengali translation based on identifier type
 * - HTTP status 401 for invalid credentials
 * - Appropriate error field
 * 
 * Test Scenarios:
 * 1. Login with non-existent email - should return "Invalid email or password"
 * 2. Login with non-existent phone - should return "Invalid phone number or password"
 * 3. Login with correct email but wrong password - should return "Invalid email or password"
 * 4. Login with correct phone but wrong password - should return "Invalid phone number or password"
 */

const http = require('http');
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const API_BASE_URL = 'localhost';
const API_PORT = 3001;
const API_PATH = '/api/v1/auth/login';

const prisma = new PrismaClient();

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
  cyan: '\x1b[36m',
  magenta: '\x1b[35m'
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
 * Setup test users if they don't exist
 */
async function setupTestUsers() {
  console.log(`${colors.cyan}Setting up test users...${colors.reset}\n`);

  const password = 'TestPassword123!';
  const hashedPassword = await bcrypt.hash(password, 10);

  // Create/Update verified email user
  const emailUser = await prisma.user.upsert({
    where: { email: 'testemail@example.com' },
    update: {
      password: hashedPassword,
      status: 'ACTIVE',
      emailVerified: new Date()
    },
    create: {
      email: 'testemail@example.com',
      password: hashedPassword,
      firstName: 'Test',
      lastName: 'EmailUser',
      role: 'CUSTOMER',
      status: 'ACTIVE',
      emailVerified: new Date()
    }
  });
  console.log(`${colors.green}✓${colors.reset} Verified email user: ${emailUser.email}`);

  // Create/Update verified phone user
  const phoneUser = await prisma.user.upsert({
    where: { email: 'testphone@example.com' },
    update: {
      phone: '01712345678',
      password: hashedPassword,
      status: 'ACTIVE',
      phoneVerified: new Date()
    },
    create: {
      email: 'testphone@example.com',
      phone: '01712345678',
      password: hashedPassword,
      firstName: 'Test',
      lastName: 'PhoneUser',
      role: 'CUSTOMER',
      status: 'ACTIVE',
      phoneVerified: new Date()
    }
  });
  console.log(`${colors.green}✓${colors.reset} Verified phone user: ${phoneUser.phone}`);

  console.log(`\n${colors.blue}Test credentials:${colors.reset}`);
  console.log(`  Email: testemail@example.com / ${password}`);
  console.log(`  Phone: 01712345678 / ${password}\n`);
}

/**
 * Verify error response for specific message tests
 */
function verifySpecificErrorMessage(response, expectedMessage, expectedMessageBn, testName) {
  const result = {
    testName,
    passed: true,
    expectedMessage,
    expectedMessageBn,
    actualMessage: null,
    actualMessageBn: null,
    checks: []
  };

  // Check status code is 401
  const statusCheck = {
    name: 'HTTP Status is 401',
    passed: response.statusCode === 401,
    expected: 401,
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

  // Check error field value
  if (errorCheck.passed) {
    const errorValueCheck = {
      name: 'Error field is "Invalid credentials"',
      passed: response.body.error === 'Invalid credentials',
      expected: 'Invalid credentials',
      actual: response.body.error
    };
    result.checks.push(errorValueCheck);

    if (!errorValueCheck.passed) {
      result.passed = false;
    }
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

  // Check message content
  if (messageCheck.passed) {
    result.actualMessage = response.body.message;
    const messageContentCheck = {
      name: `Message is "${expectedMessage}"`,
      passed: response.body.message === expectedMessage,
      expected: expectedMessage,
      actual: response.body.message
    };
    result.checks.push(messageContentCheck);

    if (!messageContentCheck.passed) {
      result.passed = false;
    }
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

  // Check messageBn content
  if (messageBnCheck.passed) {
    result.actualMessageBn = response.body.messageBn;
    const messageBnContentCheck = {
      name: `MessageBn is "${expectedMessageBn}"`,
      passed: response.body.messageBn === expectedMessageBn,
      expected: expectedMessageBn,
      actual: response.body.messageBn
    };
    result.checks.push(messageBnContentCheck);

    if (!messageBnContentCheck.passed) {
      result.passed = false;
    }
  }

  return result;
}

/**
 * Print test result with detailed information
 */
function printTestResult(result) {
  console.log(`\n${colors.cyan}========================================${colors.reset}`);
  console.log(`${colors.cyan}Test: ${result.testName}${colors.reset}`);
  console.log(`${colors.cyan}========================================${colors.reset}`);

  const statusColor = result.passed ? colors.green : colors.red;
  const statusText = result.passed ? '✓ PASSED' : '✗ FAILED';
  console.log(`\n${statusColor}${statusText}${colors.reset}`);

  console.log(`\n${colors.yellow}Expected Message (EN): ${result.expectedMessage}${colors.reset}`);
  console.log(`${colors.yellow}Expected Message (BN): ${result.expectedMessageBn}${colors.reset}`);
  
  if (result.actualMessage) {
    const messageColor = result.actualMessage === result.expectedMessage ? colors.green : colors.red;
    console.log(`\n${colors.blue}Actual Message (EN): ${messageColor}${result.actualMessage}${colors.reset}`);
  }
  
  if (result.actualMessageBn) {
    const messageBnColor = result.actualMessageBn === result.expectedMessageBn ? colors.green : colors.red;
    console.log(`${colors.blue}Actual Message (BN): ${messageBnColor}${result.actualMessageBn}${colors.reset}`);
  }

  console.log(`\n${colors.blue}Verification Checks:${colors.reset}`);
  result.checks.forEach((check, index) => {
    const checkColor = check.passed ? colors.green : colors.red;
    const checkSymbol = check.passed ? '✓' : '✗';
    console.log(`  ${checkColor}${checkSymbol} ${check.name}${colors.reset}`);
    if (!check.passed) {
      console.log(`    ${colors.red}Expected: ${check.expected}${colors.reset}`);
      console.log(`    ${colors.red}Actual: ${check.actual}${colors.reset}`);
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
  console.log(`${colors.cyan}EMAIL VS PHONE SPECIFIC ERROR MESSAGE TEST SUITE${colors.reset}`);
  console.log(`${colors.cyan}========================================${colors.reset}`);
  console.log(`\n${colors.blue}Testing login endpoint: http://${API_BASE_URL}:${API_PORT}${API_PATH}${colors.reset}`);
  console.log(`${colors.blue}Start Time: ${new Date().toISOString()}${colors.reset}\n`);

  // Setup test users
  try {
    await setupTestUsers();
  } catch (error) {
    console.error(`${colors.red}Failed to setup test users:${colors.reset}`, error);
    await prisma.$disconnect();
    process.exit(1);
  }

  const testScenarios = [
    {
      name: 'Non-existent email login',
      description: 'Login with email that does not exist in database',
      data: {
        identifier: 'nonexistent@example.com',
        password: 'TestPassword123!'
      },
      expectedMessage: 'Invalid email or password',
      expectedMessageBn: 'অবৈধ ইমেল বা পাসওয়ার্ড'
    },
    {
      name: 'Non-existent phone login',
      description: 'Login with phone number that does not exist in database',
      data: {
        identifier: '01999999999',
        password: 'TestPassword123!'
      },
      expectedMessage: 'Invalid phone number or password',
      expectedMessageBn: 'অবৈধ ফোন নম্বর বা পাসওয়ার্ড'
    },
    {
      name: 'Correct email with wrong password',
      description: 'Login with valid email but incorrect password',
      data: {
        identifier: 'testemail@example.com',
        password: 'WrongPassword123!'
      },
      expectedMessage: 'Invalid email or password',
      expectedMessageBn: 'অবৈধ ইমেল বা পাসওয়ার্ড'
    },
    {
      name: 'Correct phone with wrong password',
      description: 'Login with valid phone number but incorrect password',
      data: {
        identifier: '01712345678',
        password: 'WrongPassword123!'
      },
      expectedMessage: 'Invalid phone number or password',
      expectedMessageBn: 'অবৈধ ফোন নম্বর বা পাসওয়ার্ড'
    }
  ];

  for (const scenario of testScenarios) {
    testResults.total++;

    console.log(`\n${colors.magenta}Test ${testResults.total}: ${scenario.name}${colors.reset}`);
    console.log(`${colors.blue}Description: ${scenario.description}${colors.reset}`);
    console.log(`${colors.blue}Request: ${JSON.stringify(scenario.data, null, 2)}${colors.reset}`);

    try {
      const response = await makeLoginRequest(scenario.data);
      
      console.log(`${colors.blue}Response Status: ${response.statusCode}${colors.reset}`);
      console.log(`${colors.blue}Response Body:${colors.reset}`);
      console.log(JSON.stringify(response.body, null, 2));

      const verificationResult = verifySpecificErrorMessage(
        response,
        scenario.expectedMessage,
        scenario.expectedMessageBn,
        scenario.name
      );
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
        expectedMessage: scenario.expectedMessage,
        expectedMessageBn: scenario.expectedMessageBn,
        actualMessage: 'ERROR',
        actualMessageBn: 'ERROR',
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

  // Disconnect from database
  await prisma.$disconnect();

  // Exit with appropriate code
  process.exit(testResults.failed > 0 ? 1 : 0);
}

// Run tests
console.log('Starting email vs phone specific error message tests...\n');
runTests().catch(error => {
  console.error(`${colors.red}Fatal error running tests:${colors.reset}`, error);
  process.exit(1);
});
