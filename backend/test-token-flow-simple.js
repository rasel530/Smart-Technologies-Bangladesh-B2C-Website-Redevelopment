/**
 * Comprehensive Test for Profile Update Token Flow
 * This test verifies:
 * 1. Login and token generation
 * 2. Token storage and retrieval
 * 3. Token transmission in API requests
 * 4. Backend token verification
 * 5. Profile update with authentication
 */

const axios = require('axios');

const API_BASE_URL = 'http://localhost:3001/api/v1';

// Test user credentials (using demo users from database)
const testUser = {
  email: 'customer@example.com',
  password: 'customer123'
};

// Store token for subsequent requests
let authToken = null;

// Test 1: Login and receive token
async function testLogin() {
  console.log('\n=== TEST 1: Login and Receive Token ===');
  
  try {
    const response = await axios.post(`${API_BASE_URL}/auth/login`, {
      identifier: testUser.email,
      password: testUser.password,
      rememberMe: false
    });

    console.log('✓ Login successful');
    console.log('Response status:', response.status);
    console.log('Response data keys:', Object.keys(response.data));
    
    if (response.data.token) {
      authToken = response.data.token;
      console.log('✓ Token received:', authToken.substring(0, 20) + '...');
      console.log('Token length:', authToken.length);
      return true;
    } else {
      console.log('✗ No token in response');
      console.log('Full response:', JSON.stringify(response.data, null, 2));
      return false;
    }
  } catch (error) {
    console.log('✗ Login failed');
    console.log('Error:', error.response?.data || error.message);
    return false;
  }
}

// Test 2: Get profile without token (should fail)
async function testGetProfileWithoutToken() {
  console.log('\n=== TEST 2: Get Profile Without Token (Should Fail) ===');
  
  try {
    const response = await axios.get(`${API_BASE_URL}/profile/me`);
    
    console.log('✗ Request succeeded unexpectedly');
    console.log('Response:', response.data);
    return false;
  } catch (error) {
    if (error.response?.status === 401) {
      console.log('✓ Correctly rejected without token');
      console.log('Error message:', error.response.data.error);
      return true;
    } else {
      console.log('✗ Unexpected error');
      console.log('Error:', error.response?.data || error.message);
      return false;
    }
  }
}

// Test 3: Get profile with token (should succeed)
async function testGetProfileWithToken() {
  console.log('\n=== TEST 3: Get Profile With Token (Should Succeed) ===');
  
  try {
    const response = await axios.get(`${API_BASE_URL}/profile/me`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });

    console.log('✓ Profile retrieved successfully');
    console.log('Response status:', response.status);
    console.log('User email:', response.data.data?.user?.email);
    return true;
  } catch (error) {
    console.log('✗ Failed to get profile with token');
    console.log('Error:', error.response?.data || error.message);
    return false;
  }
}

// Test 4: Update profile with token (should succeed)
async function testUpdateProfileWithToken() {
  console.log('\n=== TEST 4: Update Profile With Token (Should Succeed) ===');
  
  try {
    const response = await axios.put(`${API_BASE_URL}/profile/me`, {
      firstName: 'Test',
      lastName: 'User Updated'
    }, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('✓ Profile updated successfully');
    console.log('Response status:', response.status);
    console.log('Updated user:', response.data.data?.user);
    return true;
  } catch (error) {
    console.log('✗ Failed to update profile with token');
    console.log('Error:', error.response?.data || error.message);
    return false;
  }
}

// Test 5: Update profile without token (should fail)
async function testUpdateProfileWithoutToken() {
  console.log('\n=== TEST 5: Update Profile Without Token (Should Fail) ===');
  
  try {
    const response = await axios.put(`${API_BASE_URL}/profile/me`, {
      firstName: 'Test',
      lastName: 'User'
    });

    console.log('✗ Request succeeded unexpectedly');
    console.log('Response:', response.data);
    return false;
  } catch (error) {
    if (error.response?.status === 401) {
      console.log('✓ Correctly rejected without token');
      console.log('Error message:', error.response.data.error);
      return true;
    } else {
      console.log('✗ Unexpected error');
      console.log('Error:', error.response?.data || error.message);
      return false;
    }
  }
}

// Test 6: Test with malformed token
async function testMalformedToken() {
  console.log('\n=== TEST 6: Test With Malformed Token (Should Fail) ===');
  
  try {
    const response = await axios.get(`${API_BASE_URL}/profile/me`, {
      headers: {
        'Authorization': 'Bearer invalid_token_here'
      }
    });

    console.log('✗ Request succeeded unexpectedly');
    console.log('Response:', response.data);
    return false;
  } catch (error) {
    if (error.response?.status === 401) {
      console.log('✓ Correctly rejected with malformed token');
      console.log('Error message:', error.response.data.error);
      return true;
    } else {
      console.log('✗ Unexpected error');
      console.log('Error:', error.response?.data || error.message);
      return false;
    }
  }
}

// Test 7: Test with wrong header format
async function testWrongHeaderFormat() {
  console.log('\n=== TEST 7: Test With Wrong Header Format (Should Fail) ===');
  
  try {
    const response = await axios.get(`${API_BASE_URL}/profile/me`, {
      headers: {
        'Authorization': authToken // Missing "Bearer " prefix
      }
    });

    console.log('✗ Request succeeded unexpectedly');
    console.log('Response:', response.data);
    return false;
  } catch (error) {
    if (error.response?.status === 401) {
      console.log('✓ Correctly rejected with wrong header format');
      console.log('Error message:', error.response.data.error);
      return true;
    } else {
      console.log('✗ Unexpected error');
      console.log('Error:', error.response?.data || error.message);
      return false;
    }
  }
}

// Run all tests
async function runAllTests() {
  console.log('╔══════════════════════════════════════════════════════════╗');
  console.log('║     PROFILE UPDATE TOKEN FLOW COMPREHENSIVE TEST          ║');
  console.log('╚════════════════════════════════════════════════════════╝');

  const results = [];

  // Test 1: Login
  results.push(await testLogin());
  
  if (!authToken) {
    console.log('\n✗ Cannot continue tests - no token received from login');
    return;
  }

  // Test 2: Get profile without token
  results.push(await testGetProfileWithoutToken());

  // Test 3: Get profile with token
  results.push(await testGetProfileWithToken());

  // Test 4: Update profile with token
  results.push(await testUpdateProfileWithToken());

  // Test 5: Update profile without token
  results.push(await testUpdateProfileWithoutToken());

  // Test 6: Malformed token
  results.push(await testMalformedToken());

  // Test 7: Wrong header format
  results.push(await testWrongHeaderFormat());

  // Summary
  console.log('\n╔══════════════════════════════════════════════════════════╗');
  console.log('║                     TEST SUMMARY                           ║');
  console.log('╚══════════════════════════════════════════════════════════╝');
  
  const passed = results.filter(r => r).length;
  const total = results.length;
  
  console.log(`\nTotal Tests: ${total}`);
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${total - passed}`);
  console.log(`Success Rate: ${((passed / total) * 100).toFixed(1)}%`);
  
  if (passed === total) {
    console.log('\n✓ All tests passed! Token flow is working correctly.');
  } else {
    console.log('\n✗ Some tests failed. Please review errors above.');
  }
}

// Run tests
runAllTests().catch(error => {
  console.error('Test suite failed:', error);
  process.exit(1);
});
