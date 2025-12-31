const axios = require('axios');

async function debugDetailedError() {
  const baseURL = 'http://localhost:3001';
  
  console.log('🔍 Detailed debugging of registration endpoint...\n');
  
  try {
    console.log('Test: Simple registration with detailed error capture...');
    
    // Make request with more detailed error handling
    const response = await axios.post(`${baseURL}/auth/register`, {
      email: 'test@example.com',
      password: 'Password123!',
      confirmPassword: 'Password123!',
      firstName: 'Test',
      lastName: 'User'
    }, {
      headers: {
        'Content-Type': 'application/json'
      },
      // Validate status code
      validateStatus: function (status) {
        if (status < 200 || status >= 500) {
          throw new Error(`HTTP Error: ${status}`);
        }
        return status;
      }
    });
    
    console.log('Response status:', response.status);
    console.log('Response headers:', response.headers);
    console.log('Response data:', response.data);
    
    // If we get here, the request succeeded
    if (response.status === 201) {
      console.log('✅ Registration successful!');
    } else {
      console.log('❌ Registration failed with status:', response.status);
    }
    
  } catch (error) {
    console.log('Full error object:', error);
    console.log('Error message:', error.message);
    console.log('Error code:', error.code);
    console.log('Error stack:', error.stack);
    
    if (error.response) {
      console.log('Response status:', error.response.status);
      console.log('Response data:', error.response.data);
      console.log('Response headers:', error.response.headers);
    }
  }
}

debugDetailedError().catch(console.error);