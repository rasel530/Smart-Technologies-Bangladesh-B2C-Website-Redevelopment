const axios = require('axios');

async function debugRegistration() {
  const baseURL = 'http://localhost:3001';
  
  console.log('🔍 Debugging registration endpoint...\n');
  
  // Test 1: Simple registration with minimal data
  try {
    console.log('Test 1: Simple registration...');
    const response1 = await axios.post(`${baseURL}/auth/register`, {
      email: 'test@example.com',
      password: 'Password123!',
      confirmPassword: 'Password123!',
      firstName: 'Test',
      lastName: 'User'
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Response status:', response1.status);
    console.log('Response data:', response1.data);
  } catch (error) {
    console.log('Error 1:', error.response?.status || error.message);
    console.log('Error data 1:', error.response?.data);
  }
  
  // Test 2: Registration with phone only
  try {
    console.log('\nTest 2: Registration with phone only...');
    const response2 = await axios.post(`${baseURL}/auth/register`, {
      phone: '01712345678',
      password: 'Password123!',
      confirmPassword: 'Password123!',
      firstName: 'Test',
      lastName: 'User'
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Response status:', response2.status);
    console.log('Response data:', response2.data);
  } catch (error) {
    console.log('Error 2:', error.response?.status || error.message);
    console.log('Error data 2:', error.response?.data);
  }
}

debugRegistration().catch(console.error);