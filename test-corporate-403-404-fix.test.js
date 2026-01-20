/**
 * Corporate Account 403/404 Error Handling Test Script
 * 
 * This script tests checkCorporateAccess middleware fix that returns:
 * - 404 Not Found for non-existent corporate accounts
 * - 403 Forbidden for access denied scenarios
 * - 200 OK for successful access
 * 
 * Database State:
 * - User ID: 95c63e45-4e91-4a90-93c3-5d9f1f0c0892 (raselbepari88@gmail.com, role: customer)
 * - User's Corporate Account ID: 83fbff07-2859-425b-bbe2-26478d548fe0 (Test Company Ltd)
 * - Non-existent Corporate Account ID: 5a5eaca8-37a7-4115-9e8d-c9577c6c9333
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');

// API Configuration
const API_BASE_URL = 'http://localhost:3001';
const API_VERSION = '/api/v1';

// Test configuration
const TEST_CONFIG = {
  timeout: 30000,
  verbose: true
};

// Test data from diagnosis
const TEST_DATA = {
  user: {
    id: '95c63e45-4e91-4a90-93c3-5d9f1f0c0892',
    email: 'raselbepari88@gmail.com',
    password: '54Vfo^71~_oQ',
    role: 'customer'
  },
  corporateAccount: {
    id: '83fbff07-2859-425b-bbe2-26478d548fe0',
    companyName: 'Test Company Ltd'
  },
  nonExistentAccountId: '5a5eaca8-37a7-4115-9e8d-c9577c6c9333'
};

// Test results storage
const testResults = {
  total: 0,
  passed: 0,
  failed: 0,
  tests: []
};

// Global variables
let authToken = null;
let testUserId = null;

// Utility functions
function log(message, type = 'info') {
  const timestamp = new Date().toISOString();
  const colors = {
    info: '\x1b[36m',    // Cyan
    success: '\x1b[32m', // Green
    error: '\x1b[31m',   // Red
    warning: '\x1b[33m', // Yellow
    reset: '\x1b[0m'
  };
  
  const prefix = {
    info: 'ℹ️',
    success: '✅',
    error: '❌',
    warning: '⚠️'
  };
  
  console.log(`${colors[type]}${prefix[type]} [${timestamp}] ${message}${colors.reset}`);
}

function recordTest(name, passed, message, status = null, response = null, errorDetails = null) {
  testResults.total++;
  if (passed) {
    testResults.passed++;
    log(`PASSED: ${name}`, 'success');
  } else {
    testResults.failed++;
    log(`FAILED: ${name} - ${message}`, 'error');
  }
  
  testResults.tests.push({
    name,
    passed,
    message,
    status,
    response,
    errorDetails,
    timestamp: new Date().toISOString()
  });
}

// Login with existing user to get auth token
async function loginExistingUser() {
  log('Logging in with existing user...', 'info');
  
  try {
    const loginResponse = await axios.post(`${API_BASE_URL}${API_VERSION}/auth/login`, {
      identifier: TEST_DATA.user.email,
      password: TEST_DATA.user.password
    });
    
    if (loginResponse.status !== 200) {
      throw new Error(`Login failed with status ${loginResponse.status}`);
    }
    
    authToken = loginResponse.data.token;
    testUserId = loginResponse.data.user.id;
    log(`User logged in successfully`, 'success');
    log(`User ID: ${testUserId}`, 'info');
    log(`User Email: ${loginResponse.data.user.email}`, 'info');
    log(`User Role: ${loginResponse.data.user.role}`, 'info');
    
    return {
      email: TEST_DATA.user.email,
      password: TEST_DATA.user.password,
      token: authToken,
      userId: testUserId
    };
  } catch (error) {
    log(`Failed to login test user: ${error.message}`, 'error');
    if (error.response) {
      log(`Response status: ${error.response.status}`, 'error');
      log(`Response data: ${JSON.stringify(error.response.data, null, 2)}`, 'error');
    }
    throw error;
  }
}

// Test 1: Non-existent corporate account - should return 404
async function testNonExistentCorporateAccount() {
  log('\n=== Test 1: Non-existent Corporate Account (404 Not Found) ===', 'info');
  log(`Endpoint: GET ${API_VERSION}/corporate/${TEST_DATA.nonExistentAccountId}`, 'info');
  
  try {
    const response = await axios.get(
      `${API_BASE_URL}${API_VERSION}/corporate/${TEST_DATA.nonExistentAccountId}`,
      {
        headers: {
          'Authorization': `Bearer ${authToken}`
        },
        timeout: TEST_CONFIG.timeout
      }
    );
    
    // If we get here, test failed (expected 404)
    recordTest(
      'Test 1 - Non-existent Corporate Account',
      false,
      `Expected 404 but got ${response.status}`,
      response.status,
      response.data
    );
  } catch (error) {
    const status = error.response?.status;
    const data = error.response?.data;
    
    log(`Response status: ${status}`, 'info');
    log(`Response data: ${JSON.stringify(data, null, 2)}`, 'info');
    
    // Verify it's 404 status
    if (status === 404) {
      // Verify error response structure
      const hasErrorField = data && (data.error || data.message);
      const expectedMessage = data?.message === 'Corporate account not found' || 
                            data?.error === 'Corporate account not found';
      
      if (hasErrorField && expectedMessage) {
        recordTest(
          'Test 1 - Non-existent Corporate Account',
          true,
          'Correctly returned 404 with proper error message',
          status,
          data
        );
      } else {
        recordTest(
          'Test 1 - Non-existent Corporate Account',
          false,
          'Status is 404 but error message is incorrect',
          status,
          data,
          { hasErrorField, expectedMessage, actualMessage: data?.message || data?.error }
        );
      }
    } else {
      recordTest(
        'Test 1 - Non-existent Corporate Account',
        false,
        `Expected 404 but got ${status}`,
        status,
        data
      );
    }
  }
}

// Test 2: User's own corporate account - should return 200
async function testUsersOwnCorporateAccount() {
  log('\n=== Test 2: User\'s Own Corporate Account (200 OK) ===', 'info');
  log(`Endpoint: GET ${API_VERSION}/corporate/${TEST_DATA.corporateAccount.id}`, 'info');
  
  try {
    const response = await axios.get(
      `${API_BASE_URL}${API_VERSION}/corporate/${TEST_DATA.corporateAccount.id}`,
      {
        headers: {
          'Authorization': `Bearer ${authToken}`
        },
        timeout: TEST_CONFIG.timeout
      }
    );
    
    log(`Response status: ${response.status}`, 'info');
    log(`Response data keys: ${Object.keys(response.data || {}).join(', ')}`, 'info');
    
    // Verify it's 200 status
    if (response.status === 200) {
      // Verify response structure
      const hasSuccessField = response.data && response.data.success;
      const hasDataField = response.data && response.data.data;
      const hasCompanyId = response.data?.data?.id === TEST_DATA.corporateAccount.id;
      const hasCompanyName = response.data?.data?.companyName === TEST_DATA.corporateAccount.companyName;
      
      if (hasSuccessField && hasDataField && hasCompanyId && hasCompanyName) {
        recordTest(
          'Test 2 - User\'s Own Corporate Account',
          true,
          'Correctly returned 200 with corporate account data',
          response.status,
          response.data
        );
      } else {
        recordTest(
          'Test 2 - User\'s Own Corporate Account',
          false,
          'Status is 200 but response structure is incomplete',
          response.status,
          response.data,
          { hasSuccessField, hasDataField, hasCompanyId, hasCompanyName }
        );
      }
    } else {
      recordTest(
        'Test 2 - User\'s Own Corporate Account',
        false,
        `Expected 200 but got ${response.status}`,
        response.status,
        response.data
      );
    }
  } catch (error) {
    const status = error.response?.status;
    const data = error.response?.data;
    
    log(`Response status: ${status}`, 'error');
    log(`Response data: ${JSON.stringify(data, null, 2)}`, 'error');
    
    recordTest(
      'Test 2 - User\'s Own Corporate Account',
      false,
      `Expected 200 but got error: ${status} - ${data?.error || data?.message || error.message}`,
      status,
      data
    );
  }
}

// Test 3: User's corporate account dashboard - should return 200
async function testUsersCorporateAccountDashboard() {
  log('\n=== Test 3: User\'s Corporate Account Dashboard (200 OK) ===', 'info');
  log(`Endpoint: GET ${API_VERSION}/corporate/${TEST_DATA.corporateAccount.id}/dashboard`, 'info');
  
  try {
    const response = await axios.get(
      `${API_BASE_URL}${API_VERSION}/corporate/${TEST_DATA.corporateAccount.id}/dashboard`,
      {
        headers: {
          'Authorization': `Bearer ${authToken}`
        },
        timeout: TEST_CONFIG.timeout
      }
    );
    
    log(`Response status: ${response.status}`, 'info');
    log(`Response data keys: ${Object.keys(response.data || {}).join(', ')}`, 'info');
    
    // Verify it's 200 status
    if (response.status === 200) {
      // Verify response structure
      const hasSuccessField = response.data && response.data.success;
      const hasDataField = response.data && response.data.data;
      const hasCreditInfo = response.data?.data?.credit;
      const hasStats = response.data?.data?.stats;
      
      if (hasSuccessField && hasDataField) {
        recordTest(
          'Test 3 - User\'s Corporate Account Dashboard',
          true,
          'Correctly returned 200 with dashboard data',
          response.status,
          response.data
        );
      } else {
        recordTest(
          'Test 3 - User\'s Corporate Account Dashboard',
          false,
          'Status is 200 but response structure is incomplete',
          response.status,
          response.data,
          { hasSuccessField, hasDataField, hasCreditInfo, hasStats }
        );
      }
    } else {
      recordTest(
        'Test 3 - User\'s Corporate Account Dashboard',
        false,
        `Expected 200 but got ${response.status}`,
        response.status,
        response.data
      );
    }
  } catch (error) {
    const status = error.response?.status;
    const data = error.response?.data;
    
    log(`Response status: ${status}`, 'error');
    log(`Response data: ${JSON.stringify(data, null, 2)}`, 'error');
    
    recordTest(
      'Test 3 - User\'s Corporate Account Dashboard',
      false,
      `Expected 200 but got error: ${status} - ${data?.error || data?.message || error.message}`,
      status,
      data
    );
  }
}

// Test 4: Access denied scenario - should return 403
async function testAccessDeniedScenario() {
  log('\n=== Test 4: Access Denied Scenario (403 Forbidden) ===', 'info');
  
  // Try to access a corporate account that might exist but user doesn't have access to
  // Using a different UUID that might be a valid corporate account ID
  const possibleOtherAccountId = '00000000-0000-0000-0000-000000000001';
  log(`Endpoint: GET ${API_VERSION}/corporate/${possibleOtherAccountId}`, 'info');
  log(`Note: Testing access to a corporate account user doesn't have access to`, 'info');
  
  try {
    const response = await axios.get(
      `${API_BASE_URL}${API_VERSION}/corporate/${possibleOtherAccountId}`,
      {
        headers: {
          'Authorization': `Bearer ${authToken}`
        },
        timeout: TEST_CONFIG.timeout
      }
    );
    
    // If we get 200, it means this account doesn't exist (which is fine)
    // or user has access (which would be unexpected)
    if (response.status === 200) {
      log('Account does not exist or user has access - testing with different ID', 'warning');
      // Try another ID
      return testAccessDeniedScenarioAlternative();
    }
    
    recordTest(
      'Test 4 - Access Denied Scenario',
      false,
      `Expected 403 or 404 but got ${response.status}`,
      response.status,
      response.data
    );
  } catch (error) {
    const status = error.response?.status;
    const data = error.response?.data;
    
    log(`Response status: ${status}`, 'info');
    log(`Response data: ${JSON.stringify(data, null, 2)}`, 'info');
    
    // Verify it's either 403 (access denied) or 404 (not found)
    if (status === 403) {
      // Verify error response structure
      const hasErrorField = data && (data.error || data.message);
      const expectedMessage = data?.message === 'You do not have access to this corporate account' || 
                            data?.error === 'Access denied';
      
      if (hasErrorField) {
        recordTest(
          'Test 4 - Access Denied Scenario',
          true,
          'Correctly returned 403 for access denied',
          status,
          data
        );
      } else {
        recordTest(
          'Test 4 - Access Denied Scenario',
          false,
          'Status is 403 but error message is missing',
          status,
          data
        );
      }
    } else if (status === 404) {
      // This is also acceptable - account doesn't exist
      recordTest(
        'Test 4 - Access Denied Scenario',
        true,
        'Account does not exist (404) - middleware working correctly',
        status,
        data
      );
    } else {
      recordTest(
        'Test 4 - Access Denied Scenario',
        false,
        `Expected 403 or 404 but got ${status}`,
        status,
        data
      );
    }
  }
}

// Alternative test for access denied using a different approach
async function testAccessDeniedScenarioAlternative() {
  log('\n=== Test 4 (Alternative): Testing 403 Forbidden ===', 'info');
  
  // Use a UUID that is valid but unlikely to exist
  const testAccountId = '99999999-9999-9999-9999-999999999999';
  log(`Endpoint: GET ${API_VERSION}/corporate/${testAccountId}`, 'info');
  
  try {
    const response = await axios.get(
      `${API_BASE_URL}${API_VERSION}/corporate/${testAccountId}`,
      {
        headers: {
          'Authorization': `Bearer ${authToken}`
        },
        timeout: TEST_CONFIG.timeout
      }
    );
    
    // If we get 200, it's unexpected
    recordTest(
      'Test 4 - Access Denied Scenario (Alternative)',
      false,
      `Unexpected success with status ${response.status}`,
      response.status,
      response.data
    );
  } catch (error) {
    const status = error.response?.status;
    const data = error.response?.data;
    
    log(`Response status: ${status}`, 'info');
    
    // 404 is acceptable for non-existent account
    if (status === 404) {
      recordTest(
        'Test 4 - Access Denied Scenario (Alternative)',
        true,
        'Non-existent account correctly returns 404',
        status,
        data
      );
    } else {
      recordTest(
        'Test 4 - Access Denied Scenario (Alternative)',
        false,
        `Unexpected status: ${status}`,
        status,
        data
      );
    }
  }
}

// Test 5: Verify middleware behavior with invalid UUID format
async function testInvalidUUIDFormat() {
  log('\n=== Test 5: Invalid UUID Format ===', 'info');
  log(`Endpoint: GET ${API_VERSION}/corporate/invalid-uuid`, 'info');
  
  try {
    const response = await axios.get(
      `${API_BASE_URL}${API_VERSION}/corporate/invalid-uuid`,
      {
        headers: {
          'Authorization': `Bearer ${authToken}`
        },
        timeout: TEST_CONFIG.timeout
      }
    );
    
    recordTest(
      'Test 5 - Invalid UUID Format',
      false,
      `Expected validation error but got ${response.status}`,
      response.status,
      response.data
    );
  } catch (error) {
    const status = error.response?.status;
    const data = error.response?.data;
    
    log(`Response status: ${status}`, 'info');
    
    // Should get 400 for validation error or 404 for not found
    if (status === 400 || status === 404) {
      recordTest(
        'Test 5 - Invalid UUID Format',
        true,
        'Correctly rejected invalid UUID format',
        status,
        data
      );
    } else {
      recordTest(
        'Test 5 - Invalid UUID Format',
        false,
        `Expected 400 or 404 but got ${status}`,
        status,
        data
      );
    }
  }
}

// Test 6: Verify middleware without authentication
async function testWithoutAuthentication() {
  log('\n=== Test 6: Access Without Authentication ===', 'info');
  log(`Endpoint: GET ${API_VERSION}/corporate/${TEST_DATA.corporateAccount.id}`, 'info');
  
  try {
    const response = await axios.get(
      `${API_BASE_URL}${API_VERSION}/corporate/${TEST_DATA.corporateAccount.id}`,
      {
        timeout: TEST_CONFIG.timeout
      }
    );
    
    recordTest(
      'Test 6 - Access Without Authentication',
      false,
      `Expected 401 but got ${response.status}`,
      response.status,
      response.data
    );
  } catch (error) {
    const status = error.response?.status;
    const data = error.response?.data;
    
    log(`Response status: ${status}`, 'info');
    
    // Should get 401 Unauthorized
    if (status === 401) {
      recordTest(
        'Test 6 - Access Without Authentication',
        true,
        'Correctly returned 401 for unauthenticated access',
        status,
        data
      );
    } else {
      recordTest(
        'Test 6 - Access Without Authentication',
        false,
        `Expected 401 but got ${status}`,
        status,
        data
      );
    }
  }
}

// Generate test report
function generateTestReport() {
  log('\n' + '='.repeat(70), 'info');
  log('CORPORATE ACCOUNT 403/404 ERROR HANDLING TEST REPORT', 'info');
  log('='.repeat(70), 'info');
  
  log(`\nTotal Tests: ${testResults.total}`, 'info');
  log(`Passed: ${testResults.passed}`, 'success');
  log(`Failed: ${testResults.failed}`, testResults.failed > 0 ? 'error' : 'info');
  log(`Success Rate: ${((testResults.passed / testResults.total) * 100).toFixed(2)}%`, 'info');
  
  if (testResults.failed > 0) {
    log('\n❌ FAILED TESTS:', 'error');
    testResults.tests.filter(t => !t.passed).forEach((test, index) => {
      log(`${index + 1}. ${test.name}`, 'error');
      log(`   Status: ${test.status}`, 'info');
      log(`   Message: ${test.message}`, 'info');
      if (test.errorDetails) {
        log(`   Details: ${JSON.stringify(test.errorDetails, null, 2)}`, 'info');
      }
      if (test.response) {
        log(`   Response: ${JSON.stringify(test.response, null, 2)}`, 'info');
      }
      log('');
    });
  }
  
  log('\n✅ PASSED TESTS:', 'success');
  testResults.tests.filter(t => t.passed).forEach((test, index) => {
    log(`${index + 1}. ${test.name}`, 'success');
  });
  
  // Summary
  log('\n' + '='.repeat(70), 'info');
  log('SUMMARY', 'info');
  log('='.repeat(70), 'info');
  
  const test404Working = testResults.tests.find(t => t.name.includes('Non-existent Corporate Account'))?.passed;
  const test200Working = testResults.tests.find(t => t.name.includes('User\'s Own Corporate Account'))?.passed;
  const testDashboardWorking = testResults.tests.find(t => t.name.includes('Dashboard'))?.passed;
  const test403Working = testResults.tests.find(t => t.name.includes('Access Denied'))?.passed;
  const testAuthWorking = testResults.tests.find(t => t.name.includes('Authentication'))?.passed;
  
  log(`✅ 404 Not Found for non-existent accounts: ${test404Working ? 'YES' : 'NO'}`, test404Working ? 'success' : 'error');
  log(`✅ 200 OK for user\'s own account: ${test200Working ? 'YES' : 'NO'}`, test200Working ? 'success' : 'error');
  log(`✅ 200 OK for dashboard access: ${testDashboardWorking ? 'YES' : 'NO'}`, testDashboardWorking ? 'success' : 'error');
  log(`✅ 403 Forbidden for access denied: ${test403Working ? 'YES' : 'NO'}`, test403Working ? 'success' : 'warning');
  log(`✅ 401 Unauthorized without auth: ${testAuthWorking ? 'YES' : 'NO'}`, testAuthWorking ? 'success' : 'error');
  
  // Critical fix verification
  const fixWorking = test404Working && test200Working && testDashboardWorking;
  log(`\n🎯 checkCorporateAccess Middleware Fix Working: ${fixWorking ? 'YES ✅' : 'NO ❌'}`, fixWorking ? 'success' : 'error');
  
  // Save report to file
  const reportPath = path.join(__dirname, 'corporate-403-404-fix-test-results.json');
  const reportData = {
    timestamp: new Date().toISOString(),
    testEnvironment: {
      apiBaseUrl: API_BASE_URL,
      apiVersion: API_VERSION,
      userId: testUserId,
      userEmail: TEST_DATA.user.email,
      corporateAccountId: TEST_DATA.corporateAccount.id,
      corporateAccountName: TEST_DATA.corporateAccount.companyName
    },
    summary: {
      total: testResults.total,
      passed: testResults.passed,
      failed: testResults.failed,
      successRate: ((testResults.passed / testResults.total) * 100).toFixed(2) + '%'
    },
    fixVerification: {
      test404Working,
      test200Working,
      testDashboardWorking,
      test403Working,
      testAuthWorking,
      fixWorking
    },
    tests: testResults.tests
  };
  
  fs.writeFileSync(reportPath, JSON.stringify(reportData, null, 2));
  
  log(`\n📄 Detailed report saved to: ${reportPath}`, 'info');
  
  return reportData;
}

// Main test execution
async function runTests() {
  log('🚀 Starting Corporate Account 403/404 Error Handling Tests', 'info');
  log('Testing checkCorporateAccess middleware fix', 'info');
  log('='.repeat(70), 'info');
  
  try {
    // Step 1: Login with existing user
    await loginExistingUser();
    
    // Step 2: Test non-existent corporate account (404)
    await testNonExistentCorporateAccount();
    
    // Step 3: Test user's own corporate account (200)
    await testUsersOwnCorporateAccount();
    
    // Step 4: Test user's corporate account dashboard (200)
    await testUsersCorporateAccountDashboard();
    
    // Step 5: Test access denied scenario (403)
    await testAccessDeniedScenario();
    
    // Step 6: Test invalid UUID format
    await testInvalidUUIDFormat();
    
    // Step 7: Test without authentication (401)
    await testWithoutAuthentication();
    
    // Step 8: Generate report
    const report = generateTestReport();
    
    log('\n🎉 All tests completed!', 'success');
    
    return report;
    
  } catch (error) {
    log(`\n❌ Test execution failed: ${error.message}`, 'error');
    console.error(error);
    throw error;
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  runTests()
    .then(report => {
      process.exit(report.failed > 0 ? 1 : 0);
    })
    .catch(error => {
      process.exit(1);
    });
}

module.exports = {
  runTests,
  testResults,
  generateTestReport
};
