/**
 * Test script for Communication Preferences API
 * Run with: node test-communication-preferences.js
 */

const axios = require('axios');

const API_BASE_URL = 'http://localhost:3001/api/v1';

// Test credentials (use existing user)
const TEST_EMAIL = 'raselbepari88@gmail.com';
const TEST_PASSWORD = 'q~_^cpU472z_';

let authToken = '';

// Helper function to make authenticated requests
async function authenticatedRequest(method, endpoint, data = null) {
  try {
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

    const response = await axios(config);
    return response.data;
  } catch (error) {
    console.error(`Error in ${method} ${endpoint}:`, error.response?.data || error.message);
    throw error;
  }
}

// Test login
async function testLogin() {
  console.log('\n=== Testing Login ===');
  try {
    const response = await axios.post(`${API_BASE_URL}/auth/login`, {
      identifier: TEST_EMAIL,
      password: TEST_PASSWORD,
      rememberMe: false
    });
    if (response.data.token) {
      authToken = response.data.token;
      console.log('✓ Login successful');
      console.log('  Token:', authToken.substring(0, 20) + '...');
      return true;
    }
    console.log('✗ Login failed');
    return false;
  } catch (error) {
    console.log('✗ Login error:', error.response?.data || error.message);
    return false;
  }
}

// Test GET communication preferences
async function testGetCommunicationPreferences() {
  console.log('\n=== Testing GET Communication Preferences ===');
  try {
    const response = await authenticatedRequest('GET', '/user/communication-preferences');
    console.log('✓ GET communication preferences successful');
    console.log('  Response:', JSON.stringify(response, null, 2));
    return response;
  } catch (error) {
    console.log('✗ GET communication preferences failed');
    return null;
  }
}

// Test PUT communication preferences
async function testUpdateCommunicationPreferences() {
  console.log('\n=== Testing PUT Communication Preferences ===');
  const updateData = {
    preferredLanguage: 'bn',
    preferredTimezone: 'Asia/Dhaka',
    preferredContactMethod: 'both',
    marketingConsent: true,
    dataSharingConsent: false
  };

  try {
    const response = await authenticatedRequest('PUT', '/user/communication-preferences', updateData);
    console.log('✓ PUT communication preferences successful');
    console.log('  Response:', JSON.stringify(response, null, 2));
    return response;
  } catch (error) {
    console.log('✗ PUT communication preferences failed');
    console.log('  Error details:', error.response?.data || error.message);
    return null;
  }
}

// Test validation errors
async function testValidationErrors() {
  console.log('\n=== Testing Validation Errors ===');

  // Test invalid language
  console.log('\nTesting invalid language...');
  try {
    await authenticatedRequest('PUT', '/user/communication-preferences', {
      preferredLanguage: 'invalid'
    });
    console.log('✗ Should have failed with validation error');
  } catch (error) {
    if (error.response?.status === 400) {
      console.log('✓ Validation error caught correctly');
      console.log('  Error:', error.response.data);
    } else {
      console.log('✗ Unexpected error:', error.response?.data);
    }
  }

  // Test invalid timezone
  console.log('\nTesting invalid timezone...');
  try {
    await authenticatedRequest('PUT', '/user/communication-preferences', {
      preferredTimezone: 'invalid'
    });
    console.log('✗ Should have failed with validation error');
  } catch (error) {
    if (error.response?.status === 400) {
      console.log('✓ Validation error caught correctly');
      console.log('  Error:', error.response.data);
    } else {
      console.log('✗ Unexpected error:', error.response?.data);
    }
  }

  // Test invalid contact method
  console.log('\nTesting invalid contact method...');
  try {
    await authenticatedRequest('PUT', '/user/communication-preferences', {
      preferredContactMethod: 'invalid'
    });
    console.log('✗ Should have failed with validation error');
  } catch (error) {
    if (error.response?.status === 400) {
      console.log('✓ Validation error caught correctly');
      console.log('  Error:', error.response.data);
    } else {
      console.log('✗ Unexpected error:', error.response?.data);
    }
  }
}

// Test partial updates
async function testPartialUpdates() {
  console.log('\n=== Testing Partial Updates ===');

  // Update only language
  console.log('\nUpdating only language...');
  try {
    const response = await authenticatedRequest('PUT', '/user/communication-preferences', {
      preferredLanguage: 'en'
    });
    console.log('✓ Partial update successful');
    console.log('  Response:', JSON.stringify(response, null, 2));
  } catch (error) {
    console.log('✗ Partial update failed:', error.response?.data);
  }

  // Update only consents
  console.log('\nUpdating only consents...');
  try {
    const response = await authenticatedRequest('PUT', '/user/communication-preferences', {
      marketingConsent: false,
      dataSharingConsent: true
    });
    console.log('✓ Partial update successful');
    console.log('  Response:', JSON.stringify(response, null, 2));
  } catch (error) {
    console.log('✗ Partial update failed:', error.response?.data);
  }
}

// Main test runner
async function runTests() {
  console.log('========================================');
  console.log('Communication Preferences API Tests');
  console.log('========================================');

  // Login first
  const loggedIn = await testLogin();
  if (!loggedIn) {
    console.log('\n✗ Cannot proceed without authentication');
    console.log('Please update TEST_USER with valid credentials');
    return;
  }

  // Run tests
  await testGetCommunicationPreferences();
  await testUpdateCommunicationPreferences();
  await testValidationErrors();
  await testPartialUpdates();

  // Verify final state
  console.log('\n=== Verifying Final State ===');
  await testGetCommunicationPreferences();

  console.log('\n========================================');
  console.log('All tests completed!');
  console.log('========================================');
}

// Run tests
runTests().catch(console.error);
