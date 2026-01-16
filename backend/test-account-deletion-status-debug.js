const axios = require('axios');

const API_BASE_URL = 'http://localhost:3001/api/v1';

async function testAccountDeletionStatus() {
  console.log('=== Testing Account Deletion Status Endpoint ===\n');

  // Step 0: Register test user if needed
  console.log('Step 0: Registering test user...');
  try {
    const registerResponse = await axios.post(`${API_BASE_URL}/auth/register`, {
      email: 'testuser@example.com',
      password: 'K7#mP$2xQw9!vR',
      confirmPassword: 'K7#mP$2xQw9!vR',
      firstName: 'Test',
      lastName: 'User',
      phone: '+8801712345678'
    });

    if (registerResponse.status === 201 || registerResponse.status === 200) {
      console.log('✓ User registered successfully\n');
    } else if (registerResponse.status === 409) {
      console.log('✓ User already exists, proceeding to login\n');
    } else {
      console.log('✗ Registration failed:', registerResponse.data);
    }
  } catch (error) {
    if (error.response?.status === 409) {
      console.log('✓ User already exists, proceeding to login\n');
    } else {
      console.log('✗ Registration error:', error.response?.data || error.message);
    }
  }

  // Step 1: Login to get auth token
  console.log('Step 1: Logging in...');
  try {
    const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
      identifier: 'raselbepari88@gmail.com',
      password: '54Vfo^71~_oP'
    });

    if (loginResponse.data.success) {
      const authToken = loginResponse.data.data.token;
      console.log('✓ Login successful');
      console.log('Token:', authToken.substring(0, 50) + '...\n');

      // Step 2: Call account deletion status endpoint
      console.log('Step 2: Calling GET /api/v1/profile/account/deletion/status');
      console.log('Headers:', {
        'Authorization': `Bearer ${authToken.substring(0, 50)}...`,
        'Content-Type': 'application/json'
      });

      try {
        const statusResponse = await axios.get(`${API_BASE_URL}/profile/account/deletion/status`, {
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json'
          }
        });

        console.log('\n✓ Deletion status endpoint successful!');
        console.log('Status:', statusResponse.status);
        console.log('Response:', JSON.stringify(statusResponse.data, null, 2));
      } catch (error) {
        console.log('\n✗ Deletion status endpoint failed!');
        console.log('Error Status:', error.response?.status);
        console.log('Error Data:', JSON.stringify(error.response?.data, null, 2));
        console.log('Error Message:', error.message);
        if (error.response?.data) {
          console.log('Full Error Response:', error.response.data);
        }
      }
    } else {
      console.log('✗ Login failed:', loginResponse.data);
    }
  } catch (error) {
    console.log('✗ Login error:', error.response?.data || error.message);
    if (error.response) {
      console.log('Login Error Status:', error.response.status);
      console.log('Login Error Data:', JSON.stringify(error.response.data, null, 2));
    }
  }

  console.log('\n=== Test Complete ===');
}

// Run the test
testAccountDeletionStatus().catch(console.error);
