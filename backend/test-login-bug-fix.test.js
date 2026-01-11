/**
 * Comprehensive Login Bug Fix Test Script
 * 
 * This script tests the login endpoint to verify that TESTING_MODE=false
 * is correctly rejecting invalid credentials with 401 status codes.
 * 
 * Test Scenarios:
 * 1. Login with incorrect email and correct password
 * 2. Login with correct email and incorrect password
 * 3. Login with incorrect phone and correct password
 * 4. Login with correct phone and incorrect password
 * 5. Login with non-existent email
 * 6. Login with non-existent phone
 */

const http = require('http');

// Configuration
const API_BASE_URL = 'http://localhost:3001';
const LOGIN_ENDPOINT = '/api/v1/auth/login';

// Test credentials
const VALID_EMAIL = 'test@example.com';
const VALID_PASSWORD = 'TestPassword123!';
const VALID_PHONE = '+8801712345678'; // Will be updated after checking test user

// Test results storage
const testResults = [];

/**
 * Make HTTP request to login endpoint
 */
function makeLoginRequest(credentials) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(credentials);
    
    const options = {
      hostname: 'localhost',
      port: 3001,
      path: LOGIN_ENDPOINT,
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
          const parsedData = data ? JSON.parse(data) : {};
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            data: parsedData
          });
        } catch (error) {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            data: null,
            raw: data
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
 * Validate login response
 */
function validateLoginResponse(response, testName) {
  const result = {
    testName,
    passed: true,
    checks: []
  };
  
  // Check 1: Status code should be 401
  const statusCheck = {
    name: 'HTTP Status Code',
    expected: 401,
    actual: response.statusCode,
    passed: response.statusCode === 401
  };
  result.checks.push(statusCheck);
  if (!statusCheck.passed) result.passed = false;
  
  // Check 2: Response should contain error message
  const errorCheck = {
    name: 'Error Message Present',
    expected: true,
    actual: response.data && (response.data.error || response.data.message),
    passed: response.data && (response.data.error || response.data.message)
  };
  result.checks.push(errorCheck);
  if (!errorCheck.passed) result.passed = false;
  
  // Check 3: Response should NOT contain token
  const tokenCheck = {
    name: 'No Token in Response',
    expected: false,
    actual: response.data && response.data.token,
    passed: !(response.data && response.data.token)
  };
  result.checks.push(tokenCheck);
  if (!tokenCheck.passed) result.passed = false;
  
  // Check 4: Response should NOT contain user data
  const userCheck = {
    name: 'No User Data in Response',
    expected: false,
    actual: response.data && response.data.user,
    passed: !(response.data && response.data.user)
  };
  result.checks.push(userCheck);
  if (!userCheck.passed) result.passed = false;
  
  return result;
}

/**
 * Run a single test case
 */
async function runTest(testName, credentials) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`TEST: ${testName}`);
  console.log('='.repeat(60));
  console.log('Credentials:', JSON.stringify(credentials, null, 2));
  console.log('Sending request...');
  
  try {
    const response = await makeLoginRequest(credentials);
    
    console.log(`\nResponse Status: ${response.statusCode}`);
    console.log('Response Data:', JSON.stringify(response.data, null, 2));
    
    const result = validateLoginResponse(response, testName);
    testResults.push(result);
    
    console.log('\nValidation Checks:');
    result.checks.forEach(check => {
      const status = check.passed ? '✓ PASS' : '✗ FAIL';
      console.log(`  ${status} - ${check.name}`);
      console.log(`      Expected: ${check.expected}, Actual: ${check.actual}`);
    });
    
    console.log(`\nOverall Result: ${result.passed ? '✓ PASSED' : '✗ FAILED'}`);
    
    return result.passed;
  } catch (error) {
    console.error(`\n✗ ERROR: ${error.message}`);
    const errorResult = {
      testName,
      passed: false,
      error: error.message,
      checks: []
    };
    testResults.push(errorResult);
    return false;
  }
}

/**
 * Generate test report
 */
function generateTestReport() {
  console.log('\n\n');
  console.log('='.repeat(80));
  console.log('COMPREHENSIVE LOGIN BUG FIX TEST REPORT');
  console.log('='.repeat(80));
  console.log(`Date: ${new Date().toISOString()}`);
  console.log(`API Base URL: ${API_BASE_URL}`);
  console.log(`Login Endpoint: ${LOGIN_ENDPOINT}`);
  console.log('\n');
  
  // Summary
  const totalTests = testResults.length;
  const passedTests = testResults.filter(r => r.passed).length;
  const failedTests = totalTests - passedTests;
  
  console.log('TEST SUMMARY');
  console.log('-'.repeat(80));
  console.log(`Total Tests: ${totalTests}`);
  console.log(`Passed: ${passedTests}`);
  console.log(`Failed: ${failedTests}`);
  console.log(`Success Rate: ${((passedTests / totalTests) * 100).toFixed(2)}%`);
  console.log('\n');
  
  // Detailed Results
  console.log('DETAILED TEST RESULTS');
  console.log('-'.repeat(80));
  
  testResults.forEach((result, index) => {
    console.log(`\n${index + 1}. ${result.testName}`);
    console.log(`   Status: ${result.passed ? '✓ PASSED' : '✗ FAILED'}`);
    
    if (result.error) {
      console.log(`   Error: ${result.error}`);
    } else {
      result.checks.forEach(check => {
        console.log(`   - ${check.name}: ${check.passed ? '✓' : '✗'}`);
        console.log(`     Expected: ${check.expected}, Actual: ${check.actual}`);
      });
    }
  });
  
  // Overall Assessment
  console.log('\n\n');
  console.log('OVERALL ASSESSMENT');
  console.log('-'.repeat(80));
  
  if (failedTests === 0) {
    console.log('✓ ALL TESTS PASSED');
    console.log('\nThe login bug fix is working correctly:');
    console.log('- TESTING_MODE=false is properly configured');
    console.log('- Invalid credentials are rejected with 401 status');
    console.log('- Error messages are returned for invalid attempts');
    console.log('- No tokens or user data are leaked in error responses');
    console.log('\nThe issue has been successfully resolved.');
  } else {
    console.log(`✗ ${failedTests} TEST(S) FAILED`);
    console.log('\nIssues detected:');
    console.log('- Some invalid login attempts are not being properly rejected');
    console.log('- This may indicate TESTING_MODE is still enabled or');
    console.log('  there are issues with the authentication logic');
    console.log('\nRecommendation: Review the failed tests and fix the underlying issues.');
  }
  
  console.log('\n');
  console.log('='.repeat(80));
  console.log('END OF REPORT');
  console.log('='.repeat(80));
}

/**
 * Main test execution
 */
async function main() {
  console.log('\n');
  console.log('='.repeat(80));
  console.log('LOGIN BUG FIX VERIFICATION TEST SUITE');
  console.log('='.repeat(80));
  console.log(`Started at: ${new Date().toISOString()}`);
  console.log(`Testing API: ${API_BASE_URL}${LOGIN_ENDPOINT}`);
  console.log(`Valid Email: ${VALID_EMAIL}`);
  console.log(`Valid Password: ${VALID_PASSWORD}`);
  
  // Test 1: Incorrect email, correct password
  await runTest(
    'Incorrect Email with Correct Password',
    { identifier: 'wrong@example.com', password: VALID_PASSWORD }
  );
  
  // Test 2: Correct email, incorrect password
  await runTest(
    'Correct Email with Incorrect Password',
    { identifier: VALID_EMAIL, password: 'WrongPassword123!' }
  );
  
  // Test 3: Incorrect phone, correct password
  await runTest(
    'Incorrect Phone with Correct Password',
    { identifier: '+8801999999999', password: VALID_PASSWORD }
  );
  
  // Test 4: Correct phone, incorrect password
  await runTest(
    'Correct Phone with Incorrect Password',
    { identifier: VALID_PHONE, password: 'WrongPassword123!' }
  );
  
  // Test 5: Non-existent email
  await runTest(
    'Non-existent Email',
    { identifier: 'nonexistent@example.com', password: VALID_PASSWORD }
  );
  
  // Test 6: Non-existent phone
  await runTest(
    'Non-existent Phone',
    { identifier: '+8801888888888', password: VALID_PASSWORD }
  );
  
  // Generate and display report
  generateTestReport();
  
  // Exit with appropriate code
  const allPassed = testResults.every(r => r.passed);
  process.exit(allPassed ? 0 : 1);
}

// Run the tests
main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
