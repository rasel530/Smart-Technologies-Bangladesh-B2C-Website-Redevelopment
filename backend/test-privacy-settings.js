/**
 * Test script for Privacy Settings API
 * This script tests the privacy settings endpoints
 */

const axios = require('axios');

const API_BASE_URL = 'http://localhost:3001/api/v1';

// Test user credentials
const testUser = {
  identifier: 'raselbepari88@gmail.com',
  password: 'q~_^cpU472z_'
};

let authToken = '';

// Helper function to make authenticated requests
async function authenticatedRequest(method, endpoint, data = null) {
  const config = {
    method,
    url: `${API_BASE_URL}${endpoint}`,
    headers: {
      'Authorization': `Bearer ${authToken}`,
      'Content-Type': 'application/json'
    }
  };

  if (data) {
    config.data = data;
  }

  return axios(config);
}

// Test functions
async function testLogin() {
  console.log('\n=== Testing Login ===');
  try {
    const response = await axios.post(`${API_BASE_URL}/auth/login`, {
      ...testUser,
      rememberMe: false
    });
    authToken = response.data.token;
    console.log('✅ Login successful');
    console.log('Token:', authToken.substring(0, 20) + '...');
    return true;
  } catch (error) {
    console.error('❌ Login failed:', error.response?.data || error.message);
    return false;
  }
}

async function testGetPrivacySettings() {
  console.log('\n=== Testing GET /user/privacy-settings ===');
  try {
    const response = await authenticatedRequest('GET', '/user/privacy-settings');
    console.log('✅ Get privacy settings successful');
    console.log('Response:', JSON.stringify(response.data, null, 2));
    return response.data;
  } catch (error) {
    console.error('❌ Get privacy settings failed:', error.response?.data || error.message);
    return null;
  }
}

async function testUpdatePrivacySettings() {
  console.log('\n=== Testing PUT /user/privacy-settings ===');
  const updateData = {
    profileVisibility: 'PRIVATE',
    showEmail: false,
    showPhone: false,
    showAddress: false,
    allowSearchByEmail: false,
    allowSearchByPhone: false,
    twoFactorEnabled: false
  };

  try {
    const response = await authenticatedRequest('PUT', '/user/privacy-settings', updateData);
    console.log('✅ Update privacy settings successful');
    console.log('Response:', JSON.stringify(response.data, null, 2));
    return response.data;
  } catch (error) {
    console.error('❌ Update privacy settings failed:', error.response?.data || error.message);
    return null;
  }
}

async function testUpdatePrivacySettingsPublic() {
  console.log('\n=== Testing PUT /user/privacy-settings (Public Profile) ===');
  const updateData = {
    profileVisibility: 'PUBLIC',
    showEmail: true,
    showPhone: true,
    showAddress: false,
    allowSearchByEmail: true,
    allowSearchByPhone: false,
    twoFactorEnabled: false
  };

  try {
    const response = await authenticatedRequest('PUT', '/user/privacy-settings', updateData);
    console.log('✅ Update privacy settings (public) successful');
    console.log('Response:', JSON.stringify(response.data, null, 2));
    return response.data;
  } catch (error) {
    console.error('❌ Update privacy settings (public) failed:', error.response?.data || error.message);
    return null;
  }
}

async function testUpdatePrivacySettingsWith2FA() {
  console.log('\n=== Testing PUT /user/privacy-settings (Enable 2FA) ===');
  const updateData = {
    twoFactorEnabled: true
  };

  try {
    const response = await authenticatedRequest('PUT', '/user/privacy-settings', updateData);
    console.log('✅ Update privacy settings (2FA enabled) successful');
    console.log('Response:', JSON.stringify(response.data, null, 2));
    return response.data;
  } catch (error) {
    console.error('❌ Update privacy settings (2FA enabled) failed:', error.response?.data || error.message);
    return null;
  }
}

async function testValidation() {
  console.log('\n=== Testing Validation ===');
  const invalidData = {
    profileVisibility: 'INVALID_VALUE',
    showEmail: 'not-a-boolean'
  };

  try {
    const response = await authenticatedRequest('PUT', '/user/privacy-settings', invalidData);
    console.error('❌ Validation test failed - should have rejected invalid data');
    return false;
  } catch (error) {
    if (error.response?.status === 400) {
      console.log('✅ Validation working correctly');
      console.log('Validation errors:', JSON.stringify(error.response.data, null, 2));
      return true;
    } else {
      console.error('❌ Validation test failed with unexpected error:', error.response?.data || error.message);
      return false;
    }
  }
}

// Main test execution
async function runTests() {
  console.log('========================================');
  console.log('Privacy Settings API Test Suite');
  console.log('========================================');

  // Login first to get auth token
  const loginSuccess = await testLogin();
  if (!loginSuccess) {
    console.error('\n❌ Cannot proceed without authentication');
    process.exit(1);
  }

  // Run tests
  const results = {
    getPrivacySettings: await testGetPrivacySettings(),
    updatePrivacySettings: await testUpdatePrivacySettings(),
    updatePrivacySettingsPublic: await testUpdatePrivacySettingsPublic(),
    updatePrivacySettingsWith2FA: await testUpdatePrivacySettingsWith2FA(),
    validation: await testValidation()
  };

  // Summary
  console.log('\n========================================');
  console.log('Test Summary');
  console.log('========================================');
  console.log('Get Privacy Settings:', results.getPrivacySettings ? '✅ PASSED' : '❌ FAILED');
  console.log('Update Privacy Settings:', results.updatePrivacySettings ? '✅ PASSED' : '❌ FAILED');
  console.log('Update Privacy Settings (Public):', results.updatePrivacySettingsPublic ? '✅ PASSED' : '❌ FAILED');
  console.log('Update Privacy Settings (2FA):', results.updatePrivacySettingsWith2FA ? '✅ PASSED' : '❌ FAILED');
  console.log('Validation:', results.validation ? '✅ PASSED' : '❌ FAILED');

  const allPassed = Object.values(results).every(result => result !== null && result !== false);
  console.log('\n========================================');
  if (allPassed) {
    console.log('✅ All tests passed!');
  } else {
    console.log('❌ Some tests failed');
  }
  console.log('========================================');

  process.exit(allPassed ? 0 : 1);
}

// Run the tests
runTests().catch(error => {
  console.error('Test suite error:', error);
  process.exit(1);
});
