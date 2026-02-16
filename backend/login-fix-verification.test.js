/**
 * Comprehensive Login Fix Verification Test Script
 * 
 * This script tests the login functionality after the validation middleware fix
 * was applied in backend/routes/auth.js
 * 
 * Test Cases:
 * 1. Successful login with valid credentials
 * 2. Login with invalid credentials
 * 3. Login with missing fields
 * 4. Backend API direct test
 */

const http = require('http');

// Test configuration
const BACKEND_URL = 'http://localhost:3001';
const API_ENDPOINT = '/api/v1/auth/login';

// Test credentials
const VALID_EMAIL = 'test.superadmin@smarttech.com';
const VALID_PASSWORD = 'dpWcQf*YH2mwKSXd';
const INVALID_EMAIL = 'invalid@nonexistent.com';
const INVALID_PASSWORD = 'wrongpassword';

// Color codes for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

// Test results storage
const testResults = {
  total: 0,
  passed: 0,
  failed: 0,
  tests: []
};

/**
 * Make HTTP POST request to login endpoint
 */
function makeLoginRequest(data) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(data);
    
    const options = {
      hostname: 'localhost',
      port: 3001,
      path: API_ENDPOINT,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = http.request(options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        try {
          const parsedData = JSON.parse(responseData);
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            data: parsedData
          });
        } catch (error) {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            data: responseData
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
 * Log test result
 */
function logTestResult(testName, passed, message, details = {}) {
  testResults.total++;
  if (passed) {
    testResults.passed++;
    console.log(`${colors.green}✓ PASS${colors.reset} - ${testName}`);
  } else {
    testResults.failed++;
    console.log(`${colors.red}✗ FAIL${colors.reset} - ${testName}`);
  }
  
  if (message) {
    console.log(`  ${colors.cyan}Message:${colors.reset} ${message}`);
  }
  
  if (Object.keys(details).length > 0) {
    console.log(`  ${colors.cyan}Details:${colors.reset}`);
    Object.entries(details).forEach(([key, value]) => {
      console.log(`    ${key}: ${JSON.stringify(value)}`);
    });
  }
  
  testResults.tests.push({
    name: testName,
    passed,
    message,
    details
  });
}

/**
 * Test Case 1: Successful login with valid credentials
 */
async function testSuccessfulLogin() {
  console.log(`\n${colors.bright}${colors.blue}=== TEST CASE 1: Successful Login with Valid Credentials ===${colors.reset}\n`);
  
  try {
    const response = await makeLoginRequest({
      identifier: VALID_EMAIL,
      password: VALID_PASSWORD
    });
    
    console.log(`Response Status: ${response.statusCode}`);
    console.log(`Response Data:`, JSON.stringify(response.data, null, 2));
    
    // Check if login was successful
    const isSuccess = response.statusCode === 200;
    const hasToken = response.data.token !== undefined;
    const hasUser = response.data.user !== undefined;
    const hasSessionId = response.data.sessionId !== undefined;
    const hasNoError = !response.data.error;
    
    const allPassed = isSuccess && hasToken && hasUser && hasSessionId && hasNoError;
    
    logTestResult(
      'Login with valid credentials',
      allPassed,
      allPassed ? 'Login successful' : 'Login failed',
      {
        statusCode: response.statusCode,
        hasToken,
        hasUser,
        hasSessionId,
        hasError: response.data.error,
        errorMessage: response.data.error || null
      }
    );
    
    // Additional checks
    logTestResult(
      'Response status is 200 OK',
      isSuccess,
      isSuccess ? 'Status code is 200' : `Status code is ${response.statusCode}`
    );
    
    logTestResult(
      'No 401 CredentialsSignin error',
      hasNoError,
      hasNoError ? 'No error in response' : `Error: ${response.data.error}`
    );
    
    logTestResult(
      'Response contains JWT token',
      hasToken,
      hasToken ? 'Token present' : 'Token missing'
    );
    
    logTestResult(
      'Response contains user data',
      hasUser,
      hasUser ? 'User data present' : 'User data missing'
    );
    
    logTestResult(
      'Response contains session ID',
      hasSessionId,
      hasSessionId ? 'Session ID present' : 'Session ID missing'
    );
    
  } catch (error) {
    logTestResult(
      'Login with valid credentials',
      false,
      'Request failed',
      { error: error.message }
    );
  }
}

/**
 * Test Case 2: Login with invalid credentials
 */
async function testInvalidCredentials() {
  console.log(`\n${colors.bright}${colors.blue}=== TEST CASE 2: Login with Invalid Credentials ===${colors.reset}\n`);
  
  try {
    const response = await makeLoginRequest({
      identifier: INVALID_EMAIL,
      password: INVALID_PASSWORD
    });
    
    console.log(`Response Status: ${response.statusCode}`);
    console.log(`Response Data:`, JSON.stringify(response.data, null, 2));
    
    // Check if login failed appropriately
    const is401 = response.statusCode === 401;
    const hasError = response.data.error !== undefined;
    const hasMessage = response.data.message !== undefined;
    const isNot500 = response.statusCode !== 500;
    
    const allPassed = is401 && hasError && hasMessage && isNot500;
    
    logTestResult(
      'Login with invalid credentials fails appropriately',
      allPassed,
      allPassed ? 'Login failed as expected' : 'Unexpected response',
      {
        statusCode: response.statusCode,
        hasError,
        hasMessage,
        isNot500,
        error: response.data.error || null,
        message: response.data.message || null
      }
    );
    
    // Additional checks
    logTestResult(
      'Response status is 401 Unauthorized',
      is401,
      is401 ? 'Status code is 401' : `Status code is ${response.statusCode}`
    );
    
    logTestResult(
      'No 500 Internal Server Error',
      isNot500,
      isNot500 ? 'No 500 error' : '500 error occurred'
    );
    
    logTestResult(
      'Error message indicates invalid credentials',
      hasMessage && (response.data.message.toLowerCase().includes('invalid') || response.data.message.toLowerCase().includes('email') || response.data.message.toLowerCase().includes('password')),
      hasMessage ? 'Appropriate error message' : 'Missing or inappropriate error message'
    );
    
  } catch (error) {
    logTestResult(
      'Login with invalid credentials',
      false,
      'Request failed',
      { error: error.message }
    );
  }
}

/**
 * Test Case 3: Login with missing fields
 */
async function testMissingFields() {
  console.log(`\n${colors.bright}${colors.blue}=== TEST CASE 3: Login with Missing Fields ===${colors.reset}\n`);
  
  // Test 3a: Missing password
  console.log(`\n${colors.yellow}Test 3a: Missing password${colors.reset}`);
  try {
    const response = await makeLoginRequest({
      identifier: VALID_EMAIL
      // password is missing
    });
    
    console.log(`Response Status: ${response.statusCode}`);
    console.log(`Response Data:`, JSON.stringify(response.data, null, 2));
    
    const isNot500 = response.statusCode !== 500;
    const hasError = response.data.error !== undefined;
    
    logTestResult(
      'Login with missing password fails appropriately',
      isNot500 && hasError,
      isNot500 ? 'No 500 error' : '500 error occurred',
      {
        statusCode: response.statusCode,
        hasError,
        error: response.data.error || null
      }
    );
    
  } catch (error) {
    logTestResult(
      'Login with missing password',
      false,
      'Request failed',
      { error: error.message }
    );
  }
  
  // Test 3b: Missing identifier
  console.log(`\n${colors.yellow}Test 3b: Missing identifier${colors.reset}`);
  try {
    const response = await makeLoginRequest({
      password: VALID_PASSWORD
      // identifier is missing
    });
    
    console.log(`Response Status: ${response.statusCode}`);
    console.log(`Response Data:`, JSON.stringify(response.data, null, 2));
    
    const isNot500 = response.statusCode !== 500;
    const hasError = response.data.error !== undefined;
    
    logTestResult(
      'Login with missing identifier fails appropriately',
      isNot500 && hasError,
      isNot500 ? 'No 500 error' : '500 error occurred',
      {
        statusCode: response.statusCode,
        hasError,
        error: response.data.error || null
      }
    );
    
  } catch (error) {
    logTestResult(
      'Login with missing identifier',
      false,
      'Request failed',
      { error: error.message }
    );
  }
  
  // Test 3c: Both fields missing
  console.log(`\n${colors.yellow}Test 3c: Both fields missing${colors.reset}`);
  try {
    const response = await makeLoginRequest({});
    
    console.log(`Response Status: ${response.statusCode}`);
    console.log(`Response Data:`, JSON.stringify(response.data, null, 2));
    
    const isNot500 = response.statusCode !== 500;
    const hasError = response.data.error !== undefined;
    
    logTestResult(
      'Login with both fields missing fails appropriately',
      isNot500 && hasError,
      isNot500 ? 'No 500 error' : '500 error occurred',
      {
        statusCode: response.statusCode,
        hasError,
        error: response.data.error || null
      }
    );
    
  } catch (error) {
    logTestResult(
      'Login with both fields missing',
      false,
      'Request failed',
      { error: error.message }
    );
  }
}

/**
 * Test Case 4: Backend API direct test
 */
async function testBackendAPIDirect() {
  console.log(`\n${colors.bright}${colors.blue}=== TEST CASE 4: Backend API Direct Test ===${colors.reset}\n`);
  
  try {
    const response = await makeLoginRequest({
      identifier: VALID_EMAIL,
      password: VALID_PASSWORD
    });
    
    console.log(`Response Status: ${response.statusCode}`);
    console.log(`Response Headers:`, JSON.stringify(response.headers, null, 2));
    console.log(`Response Data:`, JSON.stringify(response.data, null, 2));
    
    // Check all expected response properties
    const is200 = response.statusCode === 200;
    const hasToken = response.data.token !== undefined;
    const hasUser = response.data.user !== undefined;
    const hasSessionId = response.data.sessionId !== undefined;
    const hasExpiresAt = response.data.expiresAt !== undefined;
    const hasLoginType = response.data.loginType !== undefined;
    const hasMessage = response.data.message !== undefined;
    const hasNoError = !response.data.error;
    
    const allPassed = is200 && hasToken && hasUser && hasSessionId && hasExpiresAt && hasLoginType && hasMessage && hasNoError;
    
    logTestResult(
      'Backend API returns correct response structure',
      allPassed,
      allPassed ? 'API response is correct' : 'API response is incorrect',
      {
        statusCode: response.statusCode,
        hasToken,
        hasUser,
        hasSessionId,
        hasExpiresAt,
        hasLoginType,
        hasMessage,
        hasNoError
      }
    );
    
    // Additional checks for response structure
    logTestResult(
      'API returns 200 OK status',
      is200,
      is200 ? 'Status is 200' : `Status is ${response.statusCode}`
    );
    
    logTestResult(
      'API returns JWT token',
      hasToken,
      hasToken ? 'Token present' : 'Token missing'
    );
    
    logTestResult(
      'API returns user data',
      hasUser,
      hasUser ? 'User data present' : 'User data missing'
    );
    
    logTestResult(
      'API returns session ID',
      hasSessionId,
      hasSessionId ? 'Session ID present' : 'Session ID missing'
    );
    
    logTestResult(
      'API returns expiresAt timestamp',
      hasExpiresAt,
      hasExpiresAt ? 'expiresAt present' : 'expiresAt missing'
    );
    
    logTestResult(
      'API returns loginType',
      hasLoginType,
      hasLoginType ? 'loginType present' : 'loginType missing'
    );
    
    logTestResult(
      'No 500 Internal Server Error',
      hasNoError,
      hasNoError ? 'No 500 error' : '500 error occurred'
    );
    
    logTestResult(
      'No "Invalid JSON" error',
      !response.data.error || !response.data.error.toLowerCase().includes('invalid json'),
      !response.data.error || !response.data.error.toLowerCase().includes('invalid json')
        ? 'No "Invalid JSON" error'
        : '"Invalid JSON" error present'
    );
    
  } catch (error) {
    logTestResult(
      'Backend API direct test',
      false,
      'Request failed',
      { error: error.message }
    );
  }
}

/**
 * Print test summary
 */
function printTestSummary() {
  console.log(`\n${colors.bright}${colors.blue}=== TEST SUMMARY ===${colors.reset}\n`);
  console.log(`Total Tests: ${testResults.total}`);
  console.log(`${colors.green}Passed: ${testResults.passed}${colors.reset}`);
  console.log(`${colors.red}Failed: ${testResults.failed}${colors.reset}`);
  console.log(`Success Rate: ${((testResults.passed / testResults.total) * 100).toFixed(2)}%`);
  
  if (testResults.failed > 0) {
    console.log(`\n${colors.red}Failed Tests:${colors.reset}`);
    testResults.tests.filter(t => !t.passed).forEach(test => {
      console.log(`  - ${test.name}`);
      if (test.message) {
        console.log(`    ${test.message}`);
      }
    });
  }
  
  // Verification checklist
  console.log(`\n${colors.bright}${colors.blue}=== VERIFICATION CHECKLIST ===${colors.reset}\n`);
  
  const checklist = [
    { name: 'Login succeeds with valid credentials', check: testResults.tests.some(t => t.name.includes('Login with valid credentials') && t.passed) },
    { name: 'No 401 CredentialsSignin error', check: testResults.tests.some(t => t.name.includes('No 401 CredentialsSignin error') && t.passed) },
    { name: 'No "Invalid JSON" error', check: testResults.tests.some(t => t.name.includes('No "Invalid JSON" error') && t.passed) },
    { name: 'Login fails appropriately with invalid credentials', check: testResults.tests.some(t => t.name.includes('Login with invalid credentials fails appropriately') && t.passed) },
    { name: 'Login fails appropriately with missing fields', check: testResults.tests.some(t => t.name.includes('Login with missing') && t.passed) },
    { name: 'Backend API endpoint returns correct responses', check: testResults.tests.some(t => t.name.includes('Backend API returns correct response structure') && t.passed) },
    { name: 'No 500 Internal Server Errors', check: testResults.tests.every(t => !t.name.includes('500') || t.passed) }
  ];
  
  checklist.forEach(item => {
    const status = item.check ? `${colors.green}✓${colors.reset}` : `${colors.red}✗${colors.reset}`;
    console.log(`${status} ${item.name}`);
  });
  
  // Overall result
  const allPassed = testResults.failed === 0;
  console.log(`\n${colors.bright}${allPassed ? colors.green : colors.red}=== ${allPassed ? 'ALL TESTS PASSED' : 'SOME TESTS FAILED'} ===${colors.reset}\n`);
  
  return allPassed;
}

/**
 * Main test execution
 */
async function runTests() {
  console.log(`${colors.bright}${colors.cyan}╔════════════════════════════════════════════════════════════╗${colors.reset}`);
  console.log(`${colors.bright}${colors.cyan}║  LOGIN FIX VERIFICATION TEST SUITE                    ║${colors.reset}`);
  console.log(`${colors.bright}${colors.cyan}║  Testing login functionality after validation fix        ║${colors.reset}`);
  console.log(`${colors.bright}${colors.cyan}╚════════════════════════════════════════════════════════════╝${colors.reset}`);
  
  console.log(`\n${colors.yellow}Configuration:${colors.reset}`);
  console.log(`  Backend URL: ${BACKEND_URL}`);
  console.log(`  API Endpoint: ${API_ENDPOINT}`);
  console.log(`  Test Email: ${VALID_EMAIL}`);
  
  console.log(`\n${colors.yellow}Waiting for backend server to be ready...${colors.reset}`);
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Run all test cases
  await testSuccessfulLogin();
  await testInvalidCredentials();
  await testMissingFields();
  await testBackendAPIDirect();
  
  // Print summary
  const allPassed = printTestSummary();
  
  // Exit with appropriate code
  process.exit(allPassed ? 0 : 1);
}

// Run tests
runTests().catch(error => {
  console.error(`${colors.red}Fatal error during test execution:${colors.reset}`, error);
  process.exit(1);
});
