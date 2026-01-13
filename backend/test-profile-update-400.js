/**
 * Test script to diagnose 400 Bad Request error on profile update
 */

const axios = require('axios');

const API_BASE_URL = 'http://localhost:3000/api/v1';

// Test user credentials
const DEMO_USER = {
  identifier: 'raselbepari88@gmail.com',
  password: '54Vfo^71~_oP'
};

async function login() {
  try {
    console.log('🔐 Logging in...');
    const response = await axios.post(`${API_BASE_URL}/auth/login`, DEMO_USER);
    console.log('✅ Login successful');
    console.log('Full response:', JSON.stringify(response.data, null, 2));
    const token = response.data.token || response.data.data?.token;
    console.log('Token:', token.substring(0, 20) + '...');
    return token;
  } catch (error) {
    console.error('❌ Login failed:', error.response?.data || error.message);
    throw error;
  }
}

async function testProfileUpdateWithBearerToken(token) {
  try {
    console.log('\n📝 Testing profile update with Bearer token...');
    console.log('Endpoint:', `${API_BASE_URL}/profile/me`);
    console.log('Method: PUT');
    console.log('Headers:', {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token.substring(0, 20)}...`
    });

    const updateData = {
      firstName: 'Test',
      lastName: 'User'
    };

    console.log('Request body:', JSON.stringify(updateData, null, 2));

    const response = await axios.put(`${API_BASE_URL}/profile/me`, updateData, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    console.log('✅ Profile update successful');
    console.log('Response:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Profile update failed');
    console.error('Status:', error.response?.status);
    console.error('Status Text:', error.response?.statusText);
    console.error('Error Data:', JSON.stringify(error.response?.data, null, 2));
    console.error('Headers:', JSON.stringify(error.response?.config?.headers, null, 2));
    throw error;
  }
}

async function testProfileUpdateWithEmptyBody(token) {
  try {
    console.log('\n📝 Testing profile update with empty body...');
    const response = await axios.put(`${API_BASE_URL}/profile/me`, {}, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    console.log('✅ Profile update successful with empty body');
    console.log('Response:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Profile update failed with empty body');
    console.error('Status:', error.response?.status);
    console.error('Error Data:', JSON.stringify(error.response?.data, null, 2));
    throw error;
  }
}

async function testProfileUpdateWithInvalidData(token) {
  try {
    console.log('\n📝 Testing profile update with invalid data...');
    const response = await axios.put(`${API_BASE_URL}/profile/me`, {
      firstName: 'A', // Too short (min 2 chars)
      phone: 'invalid' // Invalid format
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    console.log('✅ Profile update successful (unexpected)');
    return response.data;
  } catch (error) {
    console.error('❌ Profile update failed (expected)');
    console.error('Status:', error.response?.status);
    console.error('Error Data:', JSON.stringify(error.response?.data, null, 2));
    return error.response?.data;
  }
}

async function testProfileUpdateWithMalformedJSON(token) {
  try {
    console.log('\n📝 Testing profile update with malformed JSON...');
    const response = await axios.put(`${API_BASE_URL}/profile/me`, 'invalid json', {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    console.log('✅ Profile update successful (unexpected)');
    return response.data;
  } catch (error) {
    console.error('❌ Profile update failed (expected)');
    console.error('Status:', error.response?.status);
    console.error('Error Data:', JSON.stringify(error.response?.data, null, 2));
    return error.response?.data;
  }
}

async function testGetProfile(token) {
  try {
    console.log('\n📄 Testing GET profile...');
    const response = await axios.get(`${API_BASE_URL}/profile/me`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    console.log('✅ GET profile successful');
    console.log('User:', {
      id: response.data.data.user.id,
      email: response.data.data.user.email,
      firstName: response.data.data.user.firstName,
      lastName: response.data.data.user.lastName
    });
    return response.data.data.user;
  } catch (error) {
    console.error('❌ GET profile failed');
    console.error('Status:', error.response?.status);
    console.error('Error Data:', JSON.stringify(error.response?.data, null, 2));
    throw error;
  }
}

async function main() {
  console.log('========================================');
  console.log('Profile Update 400 Error Diagnostic');
  console.log('========================================\n');

  try {
    // Login to get token
    const token = await login();

    // Get current profile
    const currentUser = await testGetProfile(token);

    // Test 1: Valid update
    await testProfileUpdateWithBearerToken(token);

    // Test 2: Empty body
    await testProfileUpdateWithEmptyBody(token);

    // Test 3: Invalid data (validation error)
    await testProfileUpdateWithInvalidData(token);

    // Test 4: Malformed JSON
    await testProfileUpdateWithMalformedJSON(token);

    console.log('\n========================================');
    console.log('✅ All tests completed');
    console.log('========================================');

  } catch (error) {
    console.error('\n========================================');
    console.log('❌ Test suite failed');
    console.log('========================================');
    process.exit(1);
  }
}

main();
