/**
 * Test script to verify profile update fix
 * Tests that the endpoint handles undefined req.body gracefully
 */

const axios = require('axios');

const API_BASE_URL = 'http://localhost:3000/api/v1';
const DEMO_USER = {
  identifier: 'raselbepari88@gmail.com',
  password: '54Vfo^71~_oP'
};

async function login() {
  console.log('\n🔐 Logging in...');
  try {
    const response = await axios.post(`${API_BASE_URL}/auth/login`, DEMO_USER);
    console.log('✅ Login successful');
    console.log('   Token:', response.data.token.substring(0, 20) + '...');
    return response.data.token;
  } catch (error) {
    console.error('❌ Login failed:', error.response?.data?.message || error.message);
    return null;
  }
}

async function testProfileUpdateWithValidData(token) {
  console.log('\n📝 Test 1: Update profile with valid data');
  try {
    const response = await axios.put(`${API_BASE_URL}/profile/me`, {
      firstName: 'Test',
      lastName: 'User'
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('✅ Profile update successful');
    console.log('   Status:', response.status);
    console.log('   User:', response.data.data.user.firstName, response.data.data.user.lastName);
    return true;
  } catch (error) {
    console.error('❌ Profile update failed');
    console.error('   Status:', error.response?.status);
    console.error('   Error:', error.response?.data?.error || error.message);
    return false;
  }
}

async function testProfileUpdateWithEmptyBody(token) {
  console.log('\n📝 Test 2: Update profile with empty body (should return 400, not 500)');
  try {
    const response = await axios.put(`${API_BASE_URL}/profile/me`, {}, {
      headers: { 
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    console.log('⚠️  Unexpected success (should have failed validation)');
    console.log('   Status:', response.status);
    return false;
  } catch (error) {
    if (error.response?.status === 400) {
      console.log('✅ Correctly returned 400 for empty body');
      console.log('   Error:', error.response?.data?.error);
      return true;
    } else if (error.response?.status === 500) {
      console.log('❌ Still returning 500 (fix not working)');
      console.log('   Error:', error.response?.data?.error || error.message);
      return false;
    } else {
      console.log('⚠️  Unexpected status code:', error.response?.status);
      console.log('   Error:', error.response?.data?.error || error.message);
      return false;
    }
  }
}

async function testProfileUpdateWithPartialData(token) {
  console.log('\n📝 Test 3: Update profile with partial data (only firstName)');
  try {
    const response = await axios.put(`${API_BASE_URL}/profile/me`, {
      firstName: 'Updated'
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('✅ Partial profile update successful');
    console.log('   Status:', response.status);
    console.log('   User:', response.data.data.user.firstName);
    return true;
  } catch (error) {
    console.error('❌ Partial profile update failed');
    console.error('   Status:', error.response?.status);
    console.error('   Error:', error.response?.data?.error || error.message);
    return false;
  }
}

async function main() {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('Profile Update Fix Verification Test');
  console.log('═══════════════════════════════════════════════════════════════');

  const token = await login();
  if (!token) {
    console.error('\n❌ Cannot proceed without authentication token');
    process.exit(1);
  }

  const test1 = await testProfileUpdateWithValidData(token);
  const test2 = await testProfileUpdateWithEmptyBody(token);
  const test3 = await testProfileUpdateWithPartialData(token);

  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('Test Results Summary:');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log(`Test 1 (Valid data): ${test1 ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Test 2 (Empty body): ${test2 ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Test 3 (Partial data): ${test3 ? '✅ PASS' : '❌ FAIL'}`);
  console.log('═══════════════════════════════════════════════════════════════');

  if (test1 && test2 && test3) {
    console.log('\n✅ All tests passed! Profile update fix is working correctly.');
    process.exit(0);
  } else {
    console.log('\n❌ Some tests failed. Please review the results above.');
    process.exit(1);
  }
}

main();
