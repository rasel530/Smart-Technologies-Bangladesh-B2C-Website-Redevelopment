const axios = require('axios');

async function testLogin() {
  try {
    console.log('Testing login with test.customer@smarttech.com...');
    const response = await axios.post('http://localhost:3001/api/v1/auth/login', {
      email: 'test.customer@smarttech.com',
      password: 'TestCustomer123!'
    });
    
    console.log('Login successful!');
    console.log('Response:', JSON.stringify(response.data, null, 2));
    console.log('Token:', response.data.token ? 'Present' : 'Missing');
  } catch (error) {
    console.error('Login failed!');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Response:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.error('Error:', error.message);
    }
  }
}

testLogin();
