/**
 * Simple health check for backend
 */

const axios = require('axios');

const API_BASE_URL = 'http://localhost:3001/api/v1';

async function testHealth() {
  try {
    console.log('Testing backend health...');
    console.log('URL:', API_BASE_URL);
    
    // Test a simple endpoint
    const response = await axios.get(`${API_BASE_URL}/auth/password-policy`);
    
    console.log('\n=== RESPONSE ===');
    console.log('Status:', response.status);
    console.log('Data:', JSON.stringify(response.data, null, 2));
    console.log('\n✅ Backend is responding!');
    
  } catch (error) {
    console.log('\n=== ERROR ===');
    console.log('Error:', error.message);
    if (error.response) {
      console.log('Status:', error.response.status);
      console.log('Data:', JSON.stringify(error.response.data, null, 2));
    }
    console.log('\n❌ Backend is not responding properly!');
  }
}

testHealth();
