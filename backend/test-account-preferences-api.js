/**
 * Comprehensive Account Preferences API Endpoint Test Script
 * Tests all Account Preferences endpoints
 */

const http = require('http');

// Test configuration
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3001/api/v1';
const TEST_USER_EMAIL = 'test@example.com';
const TEST_USER_PASSWORD = 'Test@123456';
const TEST_USER_ID = null; // Will be set after login

// Test results storage
const testResults = {
  notificationPreferences: { passed: 0, failed: 0, errors: [] },
  communicationPreferences: { passed: 0, failed: 0, errors: [] },
  privacySettings: { passed: 0, failed: 0, errors: [] },
  passwordChange: { passed: 0, failed: 0, errors: [] },
  twoFactor: { passed: 0, failed: 0, errors: [] },
  accountDeletion: { passed: 0, failed: 0, errors: [] },
  dataExport: { passed: 0, failed: 0, errors: [] },
  security: { passed: 0, failed: 0, errors: [] }
};

// Helper function to log test results
function logTest(category, testName, passed, error = null) {
  const status = passed ? '✅ PASS' : '❌ FAIL';
  console.log(`${status} [${category}] ${testName}`);
  if (error) {
    testResults[category].failed++;
    testResults[category].errors.push({ test: testName, error: error.message || error });
  } else {
    testResults[category].passed++;
  }
}

// Helper function to make HTTP request
async function makeRequest(method, path, data = null, token = null) {
  const url = `${API_BASE_URL}${path}`;
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    }
  };

  if (data) {
    options.body = JSON.stringify(data);
  }

  try {
    const response = await http.request(url, options);
    return {
      status: response.statusCode,
      data: response.statusCode === 204 ? null : JSON.parse(response.body),
      headers: response.headers
    };
  } catch (error) {
    return {
      status: 500,
      error: error.message,
      data: null
    };
  }
}

// Helper function to register test user
async function registerTestUser() {
  console.log('\n=== Registering test user ===');
  
  const registerData = {
    email: TEST_USER_EMAIL,
    password: TEST_USER_PASSWORD,
    firstName: 'Test',
    lastName: 'User',
    phone: '+8801234567'
  };

  const result = await makeRequest('POST', '/auth/register', registerData);
  
  if (result.status === 201 || result.status === 200) {
    const userData = result.data.user || result.data;
    TEST_USER_ID = userData.id;
    console.log(`✅ Test user registered: ${TEST_USER_EMAIL}`);
    console.log(`   User ID: ${TEST_USER_ID}`);
    return userData;
  } else {
    console.error(`❌ Failed to register test user: ${result.status}`);
    console.error(`   Error: ${result.error}`);
    throw new Error(`Failed to register test user: ${result.status}`);
  }
}

// Helper function to login test user
async function loginTestUser() {
  console.log('\n=== Logging in test user ===');
  
  const loginData = {
    email: TEST_USER_EMAIL,
    password: TEST_USER_PASSWORD
  };

  const result = await makeRequest('POST', '/auth/login', loginData);
  
  if (result.status === 200 || result.status === 201) {
    const authData = result.data;
    const token = authData.token || authData.accessToken;
    TEST_USER_ID = authData.user?.id;
    console.log(`✅ Test user logged in: ${TEST_USER_EMAIL}`);
    console.log(`   User ID: ${TEST_USER_ID}`);
    console.log(`   Token: ${token.substring(0, 20)}...`);
    return token;
  } else {
    console.error(`❌ Failed to login test user: ${result.status}`);
    console.error(`   Error: ${result.error}`);
    throw new Error(`Failed to login test user: ${result.status}`);
  }
}

// ==================== NOTIFICATION PREFERENCES ====================

async function testNotificationPreferences() {
  console.log('\n=== Testing Notification Preferences ===');
  
  // Test GET /api/user/preferences/notifications
  console.log('Test 1: GET /api/user/preferences/notifications');
  const getResult = await makeRequest('GET', '/user/preferences/notifications', null, TEST_USER_ID);
  
  if (getResult.status === 200) {
    logTest('notificationPreferences', 'GET /api/user/preferences/notifications', true);
    console.log('   Response:', JSON.stringify(getResult.data, null, 2));
  } else {
    logTest('notificationPreferences', 'GET /api/user/preferences/notifications', false, getResult.error);
  }

  // Test PUT /api/user/preferences/notifications
  const updateData = {
    email: false,
    sms: true,
    whatsapp: false,
    marketing: true,
    newsletter: false,
    frequency: 'daily'
  };
  
  console.log('Test 2: PUT /api/user/preferences/notifications');
  const putResult = await makeRequest('PUT', '/user/preferences/notifications', updateData, TEST_USER_ID);
  
  if (putResult.status === 200) {
    logTest('notificationPreferences', 'PUT /api/user/preferences/notifications', true);
    console.log('   Response:', JSON.stringify(putResult.data, null, 2));
  } else {
    logTest('notificationPreferences', 'PUT /api/user/preferences/notifications', false, putResult.error);
  }
}

// ==================== COMMUNICATION PREFERENCES ====================

async function testCommunicationPreferences() {
  console.log('\n=== Testing Communication Preferences ===');
  
  // Test GET /api/user/preferences/communication
  console.log('Test 3: GET /api/user/preferences/communication');
  const getResult = await makeRequest('GET', '/user/preferences/communication', null, TEST_USER_ID);
  
  if (getResult.status === 200) {
    logTest('communicationPreferences', 'GET /api/user/preferences/communication', true);
    console.log('   Response:', JSON.stringify(getResult.data, null, 2));
  } else {
    logTest('communicationPreferences', 'GET /api/user/preferences/communication', false, getResult.error);
  }

  // Test PUT /api/user/preferences/communication
  const updateData = {
    email: true,
    sms: false,
    whatsapp: false,
    marketing: true,
    newsletter: true,
    frequency: 'weekly'
  };
  
  console.log('Test 4: PUT /api/user/preferences/communication');
  const putResult = await makeRequest('PUT', '/user/preferences/communication', updateData, TEST_USER_ID);
  
  if (putResult.status === 200) {
    logTest('communicationPreferences', 'PUT /api/user/preferences/communication', true);
    console.log('   Response:', JSON.stringify(putResult.data, null, 2));
  } else {
    logTest('communicationPreferences', 'PUT /api/user/preferences/communication', false, putResult.error);
  }
}

// ==================== PRIVACY SETTINGS ====================

async function testPrivacySettings() {
  console.log('\n=== Testing Privacy Settings ===');
  
  // Test GET /api/user/preferences/privacy
  console.log('Test 5: GET /api/user/preferences/privacy');
  const getResult = await makeRequest('GET', '/user/preferences/privacy', null, TEST_USER_ID);
  
  if (getResult.status === 200) {
    logTest('privacySettings', 'GET /api/user/preferences/privacy', true);
    console.log('   Response:', JSON.stringify(getResult.data, null, 2));
  } else {
    logTest('privacySettings', 'GET /api/user/preferences/privacy', false, getResult.error);
  }

  // Test PUT /api/user/preferences/privacy
  const updateData = {
    twoFactorEnabled: true,
    dataSharingEnabled: false,
    profileVisibility: 'public'
  };
  
  console.log('Test 6: PUT /api/user/preferences/privacy');
  const putResult = await makeRequest('PUT', '/user/preferences/privacy', updateData, TEST_USER_ID);
  
  if (putResult.status === 200) {
    logTest('privacySettings', 'PUT /api/user/preferences/privacy', true);
    console.log('   Response:', JSON.stringify(putResult.data, null, 2));
  } else {
    logTest('privacySettings', 'PUT /api/user/preferences/privacy', false, putResult.error);
  }
}

// ==================== PASSWORD CHANGE ====================

async function testPasswordChange() {
  console.log('\n=== Testing Password Change ===');
  
  // Test POST /api/user/password/change
  const passwordData = {
    currentPassword: TEST_USER_PASSWORD,
    newPassword: 'NewSecure@123',
    confirmPassword: 'NewSecure@123'
  };
  
  console.log('Test 7: POST /api/user/password/change (valid)');
  const validResult = await makeRequest('POST', '/user/password/change', passwordData, TEST_USER_ID);
  
  if (validResult.status === 200) {
    logTest('passwordChange', 'POST /api/user/password/change (valid)', true);
    console.log('   Response:', JSON.stringify(validResult.data, null, 2));
  } else {
    logTest('passwordChange', 'POST /api/user/password/change (valid)', false, validResult.error);
  }

  // Test POST /api/user/password/change (invalid current password)
  const invalidPasswordData = {
    currentPassword: 'WrongPassword',
    newPassword: 'NewSecure@123',
    confirmPassword: 'NewSecure@123'
  };
  
  console.log('Test 8: POST /api/user/password/change (invalid current password)');
  const invalidResult = await makeRequest('POST', '/user/password/change', invalidPasswordData, TEST_USER_ID);
  
  if (invalidResult.status === 400) {
    logTest('passwordChange', 'POST /api/user/password/change (invalid current password)', true);
    console.log('   Response:', JSON.stringify(invalidResult.data, null, 2));
  } else {
    logTest('passwordChange', 'POST /api/user/password/change (invalid current password)', false, invalidResult.error);
  }

  // Test POST /api/user/password/change (password mismatch)
  const mismatchData = {
    currentPassword: TEST_USER_PASSWORD,
    newPassword: 'Different@123',
    confirmPassword: 'Different@123'
  };
  
  console.log('Test 9: POST /api/user/password/change (password mismatch)');
  const mismatchResult = await makeRequest('POST', '/user/password/change', mismatchData, TEST_USER_ID);
  
  if (mismatchResult.status === 400) {
    logTest('passwordChange', 'POST /api/user/password/change (password mismatch)', true);
    console.log('   Response:', JSON.stringify(mismatchResult.data, null, 2));
  } else {
    logTest('passwordChange', 'POST /api/user/password/change (password mismatch)', false, mismatchResult.error);
  }
}

// ==================== 2FA ====================

async function testTwoFactor() {
  console.log('\n=== Testing 2FA ===');
  
  // Test POST /api/user/2fa/enable (SMS method)
  console.log('Test 10: POST /api/user/2fa/enable (SMS method)');
  const enableSmsData = {
    method: 'sms',
    phoneNumber: '+8801234567'
  };
  
  const enableSmsResult = await makeRequest('POST', '/user/2fa/enable', enableSmsData, TEST_USER_ID);
  
  if (enableSmsResult.status === 200) {
    logTest('twoFactor', 'POST /api/user/2fa/enable (SMS)', true);
    console.log('   Response:', JSON.stringify(enableSmsResult.data, null, 2));
  } else {
    logTest('twoFactor', 'POST /api/user/2fa/enable (SMS)', false, enableSmsResult.error);
  }

  // Test POST /api/user/2fa/enable (Authenticator App method)
  console.log('Test 11: POST /api/user/2fa/enable (Authenticator App method)');
  const enableAuthData = {
    method: 'authenticator_app'
  };
  
  const enableAuthResult = await makeRequest('POST', '/user/2fa/enable', enableAuthData, TEST_USER_ID);
  
  if (enableAuthResult.status === 200) {
    logTest('twoFactor', 'POST /api/user/2fa/enable (Authenticator App)', true);
    console.log('   Response:', JSON.stringify(enableAuthResult.data, null, 2));
  } else {
    logTest('twoFactor', 'POST /api/user/2fa/enable (Authenticator App)', false, enableAuthResult.error);
  }

  // Test POST /api/user/2fa/disable
  console.log('Test 12: POST /api/user/2fa/disable');
  const disableResult = await makeRequest('POST', '/user/2fa/disable', null, TEST_USER_ID);
  
  if (disableResult.status === 200) {
    logTest('twoFactor', 'POST /api/user/2fa/disable', true);
    console.log('   Response:', JSON.stringify(disableResult.data, null, 2));
  } else {
    logTest('twoFactor', 'POST /api/user/2fa/disable', false, disableResult.error);
  }
}

// ==================== ACCOUNT DELETION ====================

async function testAccountDeletion() {
  console.log('\n=== Testing Account Deletion ===');
  
  // Test POST /api/user/account/deletion/request
  console.log('Test 13: POST /api/user/account/deletion/request');
  const requestDeletionData = {
    reason: 'Testing account deletion',
    confirmation: 'DELETE'
  };
  
  const requestResult = await makeRequest('POST', '/user/account/deletion/request', requestDeletionData, TEST_USER_ID);
  
  if (requestResult.status === 200) {
    logTest('accountDeletion', 'POST /api/user/account/deletion/request', true);
    console.log('   Response:', JSON.stringify(requestResult.data, null, 2));
  } else {
    logTest('accountDeletion', 'POST /api/user/account/deletion/request', false, requestResult.error);
  }

  // Test GET /api/user/account/deletion/status
  console.log('Test 14: GET /api/user/account/deletion/status');
  const statusResult = await makeRequest('GET', '/user/account/deletion/status', null, TEST_USER_ID);
  
  if (statusResult.status === 200) {
    logTest('accountDeletion', 'GET /api/user/account/deletion/status', true);
    console.log('   Response:', JSON.stringify(statusResult.data, null, 2));
  } else {
    logTest('accountDeletion', 'GET /api/user/account/deletion/status', false, statusResult.error);
  }

  // Test POST /api/user/account/deletion/cancel
  console.log('Test 15: POST /api/user/account/deletion/cancel');
  const cancelResult = await makeRequest('POST', '/user/account/deletion/cancel', null, TEST_USER_ID);
  
  if (cancelResult.status === 200) {
    logTest('accountDeletion', 'POST /api/user/account/deletion/cancel', true);
    console.log('   Response:', JSON.stringify(cancelResult.data, null, 2));
  } else {
    logTest('accountDeletion', 'POST /api/user/account/deletion/cancel', false, cancelResult.error);
  }
}

// ==================== DATA EXPORT ====================

async function testDataExport() {
  console.log('\n=== Testing Data Export ===');
  
  // Test GET /api/user/data/export
  console.log('Test 16: GET /api/user/data/export');
  const getExportsResult = await makeRequest('GET', '/user/data/export', null, TEST_USER_ID);
  
  if (getExportsResult.status === 200) {
    logTest('dataExport', 'GET /api/user/data/export', true);
    console.log('   Response:', JSON.stringify(getExportsResult.data, null, 2));
  } else {
    logTest('dataExport', 'GET /api/user/data/export', false, getExportsResult.error);
  }

  // Test POST /api/user/data/export/generate
  console.log('Test 17: POST /api/user/data/export/generate');
  const generateData = {
    dataTypes: ['profile'],
    format: 'json'
  };
  
  const generateResult = await makeRequest('POST', '/user/data/export/generate', generateData, TEST_USER_ID);
  
  if (generateResult.status === 200) {
    logTest('dataExport', 'POST /api/user/data/export/generate', true);
    console.log('   Response:', JSON.stringify(generateResult.data, null, 2));
  } else {
    logTest('dataExport', 'POST /api/user/data/export/generate', false, generateResult.error);
  }
}

// ==================== SECURITY TESTS ====================

async function testSecurity() {
  console.log('\n=== Testing Security ===');
  
  // Test authentication requirement
  console.log('Test 18: Testing authentication requirement');
  const unauthResult = await makeRequest('GET', '/user/preferences/notifications', null);
  
  if (unauthResult.status === 401) {
    logTest('security', 'Authentication required (401)', true);
    console.log('   Response:', JSON.stringify(unauthResult.data, null, 2));
  } else {
    logTest('security', 'Authentication required (401)', false, unauthResult.error);
  }

  // Test rate limiting
  console.log('Test 19: Testing rate limiting on deletion endpoint');
  const rateLimitTest1 = await makeRequest('POST', '/user/account/deletion/request', { reason: 'Test', confirmation: 'DELETE' }, TEST_USER_ID);
  const rateLimitTest2 = await makeRequest('POST', '/user/account/deletion/request', { reason: 'Test2', confirmation: 'DELETE' }, TEST_USER_ID);
  
  if (rateLimitTest1.status === 429 && rateLimitTest2.status === 429) {
    logTest('security', 'Rate limiting (429)', true);
  } else {
    logTest('security', 'Rate limiting (429)', false, rateLimitTest1.error || rateLimitTest2.error);
  }
}

// ==================== MAIN TEST RUNNER ====================

async function runAllTests() {
  console.log('\n' + '='.repeat(60));
  console.log('  ACCOUNT PREFERENCES COMPREHENSIVE API TEST');
  console.log('  Phase 3, Milestone 3, Task 3: Account Preferences');
  console.log('='.repeat(60) + '\n');
  
  try {
    // Register test user
    await registerTestUser();
    console.log('');
    
    // Login test user
    const token = await loginTestUser();
    console.log('');
    
    // Run all tests
    await testNotificationPreferences();
    await testCommunicationPreferences();
    await testPrivacySettings();
    await testPasswordChange();
    await testTwoFactor();
    await testAccountDeletion();
    await testDataExport();
    await testSecurity();
    
    // Print summary
    console.log('\n' + '='.repeat(60));
    console.log('TEST SUMMARY');
    console.log('='.repeat(60));
    
    const totalTests = Object.values(testResults).reduce((sum, cat) => sum + cat.passed, 0);
    const totalPassed = Object.values(testResults).reduce((sum, cat) => sum + cat.passed, 0);
    const totalFailed = Object.values(testResults).reduce((sum, cat) => sum + cat.failed, 0);
    
    console.log(`Total Tests: ${totalTests}`);
    console.log(`Passed: ${totalPassed}`);
    console.log(`Failed: ${totalFailed}`);
    console.log(`Success Rate: ${totalTests > 0 ? (totalPassed / totalTests * 100).toFixed(2) + '%' : '0%'}`);
    
    // Save results
    const fs = require('fs');
    const resultsPath = './account-preferences-api-test-results.json';
    fs.writeFileSync(resultsPath, JSON.stringify(testResults, null, 2));
    console.log(`\n📄 Test results saved to: ${resultsPath}`);
    
  } catch (error) {
    console.error('\n❌ Fatal error during testing:', error.message);
    process.exit(1);
  }
}

// Run tests
runAllTests();
