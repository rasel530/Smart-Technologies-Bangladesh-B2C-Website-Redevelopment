/**
 * Comprehensive API Test for Account Preferences
 * Tests all 16 API endpoints
 */

require('dotenv').config();
const axios = require('axios');

const BASE_URL = 'http://localhost:3001/api/v1';

// Test configuration
const TEST_USER = {
  identifier: 'test@example.com',
  password: 'Test123456'
};

let authToken = null;
let testUserId = null;

// Test results
const results = {
  passed: 0,
  failed: 0,
  tests: []
};

async function login() {
  console.log('\n' + '='.repeat(70));
  console.log('AUTHENTICATION');
  console.log('='.repeat(70));

  try {
    const response = await axios.post(`${BASE_URL}/auth/login`, TEST_USER);
    
    if (response.data.success && response.data.data.token) {
      authToken = response.data.data.token;
      testUserId = response.data.data.user.id;
      console.log(`\n✅ Login successful`);
      console.log(`   User ID: ${testUserId}`);
      console.log(`   Token: ${authToken.substring(0, 20)}...`);
      return true;
    } else {
      console.log('\n❌ Login failed - Invalid response format');
      console.log(`   Response: ${JSON.stringify(response.data)}`);
      return false;
    }
  } catch (error) {
    console.log(`\n❌ Login failed: ${error.message}`);
    if (error.response) {
      console.log(`   Status: ${error.response.status}`);
      console.log(`   Data: ${JSON.stringify(error.response.data)}`);
    }
    return false;
  }
}

async function testEndpoint(name, method, endpoint, data = null, expectedStatus = 200) {
  const testId = results.tests.length + 1;
  const startTime = Date.now();
  
  try {
    const config = {
      method,
      url: `${BASE_URL}${endpoint}`,
      headers: authToken ? { Authorization: `Bearer ${authToken}` } : {}
    };
    
    if (data) {
      config.data = data;
    }

    const response = await axios(config);
    const duration = Date.now() - startTime;

    const success = response.status === expectedStatus;
    
    if (success) {
      results.passed++;
      console.log(`\n[Test ${testId}] ✅ ${name}`);
      console.log(`   Method: ${method.toUpperCase()}`);
      console.log(`   Endpoint: ${endpoint}`);
      console.log(`   Status: ${response.status}`);
      console.log(`   Duration: ${duration}ms`);
      
      if (response.data) {
        console.log(`   Response: ${JSON.stringify(response.data).substring(0, 100)}...`);
      }
    } else {
      results.failed++;
      console.log(`\n[Test ${testId}] ❌ ${name}`);
      console.log(`   Method: ${method.toUpperCase()}`);
      console.log(`   Endpoint: ${endpoint}`);
      console.log(`   Expected Status: ${expectedStatus}`);
      console.log(`   Actual Status: ${response.status}`);
      console.log(`   Duration: ${duration}ms`);
    }

    results.tests.push({
      id: testId,
      name,
      method,
      endpoint,
      expectedStatus,
      actualStatus: response.status,
      success,
      duration,
      error: null
    });

    return success;
  } catch (error) {
    const duration = Date.now() - startTime;
    results.failed++;
    
    console.log(`\n[Test ${testId}] ❌ ${name}`);
    console.log(`   Method: ${method.toUpperCase()}`);
    console.log(`   Endpoint: ${endpoint}`);
    console.log(`   Expected Status: ${expectedStatus}`);
    console.log(`   Error: ${error.message}`);
    console.log(`   Duration: ${duration}ms`);
    
    if (error.response) {
      console.log(`   Response Status: ${error.response.status}`);
      console.log(`   Response Data: ${JSON.stringify(error.response.data)}`);
    }

    results.tests.push({
      id: testId,
      name,
      method,
      endpoint,
      expectedStatus,
      actualStatus: error.response?.status || 0,
      success: false,
      duration,
      error: error.message
    });

    return false;
  }
}

async function runAllTests() {
  console.log('='.repeat(70));
  console.log('ACCOUNT PREFERENCES API TEST SUITE');
  console.log('='.repeat(70));
  console.log(`Base URL: ${BASE_URL}`);
  console.log(`Test User: ${TEST_USER.email}`);
  console.log('='.repeat(70));

  // Step 1: Login
  const loginSuccess = await login();
  if (!loginSuccess) {
    console.log('\n' + '='.repeat(70));
    console.log('❌ CANNOT PROCEED - LOGIN FAILED');
    console.log('='.repeat(70));
    printSummary();
    return;
  }

  // Step 2: Test Notification Preferences
  console.log('\n' + '='.repeat(70));
  console.log('NOTIFICATION PREFERENCES');
  console.log('='.repeat(70));

  await testEndpoint(
    'Get Notification Preferences',
    'get',
    '/profile/preferences/notifications'
  );

  await testEndpoint(
    'Update Notification Preferences',
    'put',
    '/profile/preferences/notifications',
    {
      emailNotifications: true,
      smsNotifications: true,
      whatsappNotifications: false,
      pushNotifications: true,
      orderUpdates: true,
      promotionalEmails: true,
      securityAlerts: true,
      newsletterSubscription: true,
      notificationFrequency: 'immediate'
    }
  );

  // Step 3: Test Communication Preferences
  console.log('\n' + '='.repeat(70));
  console.log('COMMUNICATION PREFERENCES');
  console.log('='.repeat(70));

  await testEndpoint(
    'Get Communication Preferences',
    'get',
    '/profile/preferences/communication'
  );

  await testEndpoint(
    'Update Communication Preferences',
    'put',
    '/profile/preferences/communication',
    {
      preferredLanguage: 'en',
      preferredTimezone: 'UTC',
      preferredContactMethod: 'email',
      marketingConsent: false,
      dataSharingConsent: false
    }
  );

  // Step 4: Test Privacy Settings
  console.log('\n' + '='.repeat(70));
  console.log('PRIVACY SETTINGS');
  console.log('='.repeat(70));

  await testEndpoint(
    'Get Privacy Settings',
    'get',
    '/profile/preferences/privacy'
  );

  await testEndpoint(
    'Update Privacy Settings',
    'put',
    '/profile/preferences/privacy',
    {
      profileVisibility: 'private',
      showEmail: false,
      showPhone: false,
      showAddress: false,
      allowSearchByEmail: false,
      allowSearchByPhone: false,
      twoFactorEnabled: false,
      dataSharingEnabled: true
    }
  );

  // Step 5: Test Password Management
  console.log('\n' + '='.repeat(70));
  console.log('PASSWORD MANAGEMENT');
  console.log('='.repeat(70));

  await testEndpoint(
    'Change Password',
    'post',
    '/profile/password/change',
    {
      currentPassword: TEST_USER.password,
      newPassword: 'NewTest123456',
      confirmPassword: 'NewTest123456'
    }
  );

  // Step 6: Test Two-Factor Authentication
  console.log('\n' + '='.repeat(70));
  console.log('TWO-FACTOR AUTHENTICATION');
  console.log('='.repeat(70));

  await testEndpoint(
    'Enable 2FA (SMS)',
    'post',
    '/profile/2fa/enable',
    {
      method: 'sms',
      phoneNumber: '+8801234567890'
    }
  );

  await testEndpoint(
    'Disable 2FA',
    'post',
    '/profile/2fa/disable'
  );

  // Step 7: Test Account Deletion
  console.log('\n' + '='.repeat(70));
  console.log('ACCOUNT DELETION');
  console.log('='.repeat(70));

  await testEndpoint(
    'Request Account Deletion',
    'post',
    '/profile/account/deletion/request',
    {
      reason: 'Testing deletion feature',
      confirmation: 'DELETE'
    }
  );

  await testEndpoint(
    'Get Deletion Status',
    'get',
    '/profile/account/deletion/status'
  );

  await testEndpoint(
    'Cancel Account Deletion',
    'post',
    '/profile/account/deletion/cancel'
  );

  // Step 8: Test Data Export
  console.log('\n' + '='.repeat(70));
  console.log('DATA EXPORT');
  console.log('='.repeat(70));

  await testEndpoint(
    'Get Export History',
    'get',
    '/profile/data/export'
  );

  await testEndpoint(
    'Generate Data Export',
    'post',
    '/profile/data/export/generate',
    {
      dataTypes: ['profile', 'orders', 'addresses'],
      format: 'json'
    }
  );

  // Print summary
  printSummary();
}

function printSummary() {
  console.log('\n' + '='.repeat(70));
  console.log('TEST SUMMARY');
  console.log('='.repeat(70));
  console.log(`Total Tests: ${results.tests.length}`);
  console.log(`Passed: ${results.passed} ✅`);
  console.log(`Failed: ${results.failed} ❌`);
  console.log(`Success Rate: ${((results.passed / results.tests.length) * 100).toFixed(2)}%`);
  console.log('='.repeat(70));

  if (results.failed > 0) {
    console.log('\n❌ FAILED TESTS:');
    results.tests
      .filter(test => !test.success)
      .forEach(test => {
        console.log(`\n  [${test.id}] ${test.name}`);
        console.log(`      Endpoint: ${test.method.toUpperCase()} ${test.endpoint}`);
        console.log(`      Error: ${test.error}`);
      });
  }

  console.log('\n' + '='.repeat(70));
  
  if (results.failed === 0) {
    console.log('✅ ALL TESTS PASSED!');
  } else {
    console.log('❌ SOME TESTS FAILED');
  }
  console.log('='.repeat(70) + '\n');
}

// Run tests
runAllTests()
  .then(() => process.exit(results.failed === 0 ? 0 : 1))
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
