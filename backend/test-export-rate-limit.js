/**
 * Test Data Export Rate Limiting (5 minutes)
 * This test verifies that the export rate limiting has been changed from 60 minutes to 5 minutes
 */

const axios = require('axios');

const BACKEND_URL = 'http://localhost:3001/api/v1';

// Test credentials (update with valid credentials)
const TEST_USER = {
  email: 'customer@example.com',
  password: 'password123'
};

let authToken = '';

/**
 * Login to get auth token
 */
async function login() {
  try {
    console.log('🔐 Logging in...');
    const response = await axios.post(`${BACKEND_URL}/auth/login`, TEST_USER);
    
    if (response.data.success && response.data.data.token) {
      authToken = response.data.data.token;
      console.log('✅ Login successful');
      return true;
    } else {
      console.error('❌ Login failed:', response.data);
      return false;
    }
  } catch (error) {
    console.error('❌ Login error:', error.response?.data || error.message);
    return false;
  }
}

/**
 * Test 1: First export request should succeed
 */
async function testFirstExport() {
  try {
    console.log('\n📊 Test 1: First export request...');
    
    const response = await axios.post(
      `${BACKEND_URL}/profile/data/export/generate`,
      {
        dataTypes: ['profile', 'orders', 'addresses', 'wishlist'],
        format: 'json'
      },
      {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (response.data.success) {
      console.log('✅ First export request successful');
      console.log('   Export ID:', response.data.data.export.exportId);
      console.log('   Status:', response.data.data.export.status);
      return true;
    } else {
      console.error('❌ First export request failed:', response.data);
      return false;
    }
  } catch (error) {
    console.error('❌ First export request error:', error.response?.data || error.message);
    return false;
  }
}

/**
 * Test 2: Second export request should be rate limited (5 minutes)
 */
async function testRateLimit() {
  try {
    console.log('\n⏱️  Test 2: Rate limiting (should show 5 minute wait)...');
    
    const response = await axios.post(
      `${BACKEND_URL}/profile/data/export/generate`,
      {
        dataTypes: ['profile', 'orders', 'addresses', 'wishlist'],
        format: 'json'
      },
      {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('❌ Rate limiting not working - second request succeeded');
    return false;
  } catch (error) {
    if (error.response?.status === 429) {
      const message = error.response.data.message;
      console.log('✅ Rate limiting is working!');
      console.log('   Error:', error.response.data.error);
      console.log('   Message:', message);
      
      // Extract the wait time from the message
      const match = message.match(/Please wait (\d+) minutes/);
      if (match) {
        const waitTime = parseInt(match[1]);
        console.log('   Wait time:', waitTime, 'minutes');
        
        if (waitTime <= 5) {
          console.log('✅ Wait time is correctly set to 5 minutes or less');
          return true;
        } else {
          console.log('❌ Wait time is still', waitTime, 'minutes (should be 5 or less)');
          return false;
        }
      }
      return true;
    } else {
      console.error('❌ Unexpected error:', error.response?.data || error.message);
      return false;
    }
  }
}

/**
 * Run all tests
 */
async function runTests() {
  console.log('='.repeat(60));
  console.log('🧪 Data Export Rate Limiting Test (5 minutes)');
  console.log('='.repeat(60));

  // Login
  const loginSuccess = await login();
  if (!loginSuccess) {
    console.log('\n❌ Cannot proceed without authentication');
    process.exit(1);
  }

  // Test 1: First export
  const test1Success = await testFirstExport();

  // Test 2: Rate limiting
  const test2Success = await testRateLimit();

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 Test Summary');
  console.log('='.repeat(60));
  console.log('Test 1 (First Export):', test1Success ? '✅ PASS' : '❌ FAIL');
  console.log('Test 2 (Rate Limit):', test2Success ? '✅ PASS' : '❌ FAIL');
  console.log('='.repeat(60));

  if (test1Success && test2Success) {
    console.log('\n✅ All tests passed! Rate limiting is set to 5 minutes.');
    process.exit(0);
  } else {
    console.log('\n❌ Some tests failed.');
    process.exit(1);
  }
}

// Run tests
runTests().catch(error => {
  console.error('❌ Test execution error:', error);
  process.exit(1);
});
