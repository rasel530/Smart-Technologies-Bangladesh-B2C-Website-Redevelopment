const axios = require('axios');

const BASE_URL = 'http://localhost:3001';

async function testSimpleEndpoint() {
  try {
    console.log('Testing simple endpoint without validation...');
    
    // Test with minimal data that should pass validation
    const response = await axios.post(`${BASE_URL}/api/auth/register`, {
      email: 'simple@test.com',
      password: 'TestPassword123!',
      confirmPassword: 'TestPassword123!',
      firstName: 'Test',
      lastName: 'User'
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Success:', response.status);
    console.log('Response:', JSON.stringify(response.data, null, 2));
    return response.data;
  } catch (error) {
    console.log('❌ Error:', error.response?.status || 'No status');
    if (error.response?.data) {
      console.log('Error response:', JSON.stringify(error.response.data, null, 2));
    } else if (error.message) {
      console.log('Error message:', error.message);
    }
    if (error.stack) {
      console.log('Error stack:', error.stack);
    }
    throw error;
  }
}

// Test with a delay to allow server to start
setTimeout(async () => {
  try {
    await testSimpleEndpoint();
  } catch (error) {
    console.error('Test failed:', error.message);
  }
}, 2000);