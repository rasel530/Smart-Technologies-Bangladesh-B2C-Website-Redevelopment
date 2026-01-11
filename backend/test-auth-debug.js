/**
 * Debug authentication issue
 */

const axios = require('axios');

const API_BASE_URL = 'http://localhost:3001/api/v1';

async function testAuth() {
  console.log('Testing authentication...\n');

  // Step 1: Login
  console.log('STEP 1: Login');
  try {
    const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
      identifier: 'admin@smarttech.com',
      password: 'Admin123456'
    });

    console.log('✅ Login successful');
    console.log('Token:', loginResponse.data.token.substring(0, 50) + '...');
    console.log('User:', JSON.stringify(loginResponse.data.user, null, 2));

    const token = loginResponse.data.token;

    // Step 2: Try to create category with detailed headers
    console.log('\nSTEP 2: Create Category');
    console.log('Authorization header:', `Bearer ${token.substring(0, 30)}...`);

    try {
      const categoryResponse = await axios.post(`${API_BASE_URL}/categories`, {
        name: 'Test Category',
        slug: 'test-category-debug',
        description: 'Test description',
        sortOrder: 1
      }, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        timeout: 30000
      });

      console.log('✅ Category created:', categoryResponse.status);
      console.log('Response:', JSON.stringify(categoryResponse.data, null, 2));

    } catch (error) {
      console.log('❌ Category creation failed');
      console.log('Status:', error.response?.status);
      console.log('Error:', error.response?.data);
      console.log('Request headers sent:', error.config?.headers);
    }

    // Step 3: Try GET categories (no auth required)
    console.log('\nSTEP 3: GET Categories (no auth)');
    try {
      const getResponse = await axios.get(`${API_BASE_URL}/categories`);
      console.log('✅ GET categories successful');
      console.log('Total categories:', getResponse.data.categories.length);
    } catch (error) {
      console.log('❌ GET categories failed:', error.message);
    }

  } catch (error) {
    console.log('❌ Login failed:', error.response?.data || error.message);
  }
}

testAuth();
