/**
 * Debug script to check login response structure
 */

const axios = require('axios');

const API_BASE_URL = 'http://localhost:3001/api/v1';
const DEMO_USER = {
  identifier: 'demo.user1@smarttech.bd',
  password: 'Demo123456'
};

async function testLogin() {
  try {
    console.log('Testing login...');
    console.log('URL:', `${API_BASE_URL}/auth/login`);
    console.log('Payload:', DEMO_USER);
    
    const response = await axios.post(`${API_BASE_URL}/auth/login`, DEMO_USER);
    
    console.log('\n=== RESPONSE STATUS ===');
    console.log('Status:', response.status);
    console.log('Status Text:', response.statusText);
    
    console.log('\n=== RESPONSE HEADERS ===');
    console.log('Content-Type:', response.headers['content-type']);
    
    console.log('\n=== RESPONSE DATA ===');
    console.log('Full response.data:', JSON.stringify(response.data, null, 2));
    
    console.log('\n=== CHECKING EXPECTED FIELDS ===');
    console.log('Has user:', !!response.data?.user);
    console.log('Has user.id:', !!response.data?.user?.id);
    console.log('Has token:', !!response.data?.token);
    console.log('Has sessionId:', !!response.data?.sessionId);
    
    if (response.data?.user?.id && response.data?.token) {
      console.log('\n✅ Login response structure is correct!');
      console.log('User ID:', response.data.user.id);
      console.log('Token:', response.data.token.substring(0, 20) + '...');
    } else {
      console.log('\n❌ Login response structure is incorrect!');
    }
    
  } catch (error) {
    console.log('\n=== ERROR ===');
    console.log('Error:', error.message);
    
    if (error.response) {
      console.log('Status:', error.response.status);
      console.log('Response Data:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

testLogin();
