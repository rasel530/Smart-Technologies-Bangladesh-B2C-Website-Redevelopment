const axios = require('axios');

const API_BASE_URL = 'http://localhost:3001/api/v1';

async function testDeletionStatus() {
  console.log('=== Testing Account Deletion Status Endpoint ===\n');

  const testEmail = `testuser${Date.now()}@example.com`;
  const testPassword = 'Xk9#mP$2xQw9!vR';

  try {
    // Step 1: Register new user
    console.log('Step 1: Registering new user...');
    console.log(`Email: ${testEmail}`);
    
    const registerResponse = await axios.post(`${API_BASE_URL}/auth/register`, {
      email: testEmail,
      password: testPassword,
      confirmPassword: testPassword,
      firstName: 'Test',
      lastName: 'User',
      phone: `+880${Math.floor(Math.random() * 9000000000 + 100000000)}`
    });

    if (registerResponse.status === 201 || registerResponse.status === 200) {
      console.log('✓ User registered successfully\n');
    } else {
      console.log('✗ Registration failed:', registerResponse.data);
      return;
    }

    // Step 2: Login
    console.log('Step 2: Logging in...');
    const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
      identifier: testEmail,
      password: testPassword
    });

    if (loginResponse.data.success) {
      const authToken = loginResponse.data.data.token;
      console.log('✓ Login successful');
      console.log(`Token: ${authToken.substring(0, 30)}...\n`);

      // Step 3: Call deletion status endpoint
      console.log('Step 3: Calling GET /api/v1/profile/account/deletion/status');
      
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
    console.log('✗ Error:', error.response?.data || error.message);
    if (error.response) {
      console.log('Error Status:', error.response.status);
      console.log('Error Data:', JSON.stringify(error.response.data, null, 2));
    }
  }

  console.log('\n=== Test Complete ===');
}

testDeletionStatus().catch(console.error);
