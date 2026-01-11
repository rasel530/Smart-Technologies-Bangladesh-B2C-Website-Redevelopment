const axios = require('axios');

// Test login with the fixed code
async function testLogin() {
  const API_BASE_URL = 'http://localhost:3001/api/v1';
  
  console.log('Testing login with demo.user1@smarttech.bd...');
  
  try {
    const response = await axios.post(`${API_BASE_URL}/auth/login`, {
      identifier: 'demo.user1@smarttech.bd',
      password: 'Demo123456',
      timeout: 30000 // 30 seconds
    });
    
    console.log('Response status:', response.status);
    console.log('Response headers:', response.headers);
    console.log('Response data:', JSON.stringify(response.data, null, 2));
    
    if (response.status === 200 && response.data) {
      console.log('✅ Login successful!');
      console.log('User ID:', response.data.user?.id);
      console.log('Token:', response.data.token ? 'Present' : 'Missing');
      console.log('Session ID:', response.data.sessionId);
    } else {
      console.log('❌ Login failed!');
    }
  } catch (error) {
    console.error('❌ Login error:', error.message);
    if (error.code === 'ECONNREFUSED') {
      console.error('Connection refused - backend may not be running');
    } else if (error.code === 'ETIMEDOUT') {
      console.error('Request timeout - backend may be hanging');
    }
  }
}

testLogin();
