/**
 * Test script to diagnose authentication status issue
 * This will test login and then make an authenticated API call
 * to see what status value is being returned from the database
 */

const axios = require('axios');

const API_BASE_URL = 'http://localhost:3001/api/v1';

// Test users
const testUsers = [
  {
    email: 'test.customer@smarttech.com',
    password: 'TestCustomer123!',
    role: 'customer'
  },
  {
    email: 'test.admin@smarttech.com',
    password: 'TestAdmin123!',
    role: 'admin'
  },
  {
    email: 'test.superadmin@smarttech.com',
    password: 'TestSuperAdmin123!',
    role: 'super_admin'
  }
];

async function testUserAuthentication(user) {
  console.log(`\n${'='.repeat(80)}`);
  console.log(`Testing authentication for: ${user.email}`);
  console.log(`Expected role: ${user.role}`);
  console.log(`${'='.repeat(80)}\n`);

  try {
    // Step 1: Login to get token
    console.log('Step 1: Attempting login...');
    const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
      identifier: user.email,
      password: user.password
    });

    console.log('✓ Login successful!');
    console.log(`  Response:`, JSON.stringify(loginResponse.data, null, 2));

    const token = loginResponse.data.token;
    if (!token) {
      console.error('✗ No token received from login');
      return;
    }

    // Step 2: Make authenticated API call
    console.log('\nStep 2: Making authenticated API call...');
    console.log('  Endpoint: GET /api/auth/me');
    console.log('  Token:', token.substring(0, 50) + '...');

    const apiResponse = await axios.get(`${API_BASE_URL}/auth/me`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    console.log('✓ Authenticated API call successful!');
    console.log(`  Response:`, JSON.stringify(apiResponse.data, null, 2));

    // Step 3: Check user status in response
    if (apiResponse.data.user) {
      console.log('\nStep 3: Checking user status...');
      console.log(`  User ID: ${apiResponse.data.user.id}`);
      console.log(`  Email: ${apiResponse.data.user.email}`);
      console.log(`  Status: "${apiResponse.data.user.status}"`);
      console.log(`  Status Type: ${typeof apiResponse.data.user.status}`);
      console.log(`  Comparison with 'ACTIVE': ${apiResponse.data.user.status === 'ACTIVE'}`);
      console.log(`  Comparison with 'active': ${apiResponse.data.user.status === 'active'}`);
    }

  } catch (error) {
    console.error('✗ Error occurred:');
    if (error.response) {
      console.error(`  Status: ${error.response.status}`);
      console.error(`  Error:`, JSON.stringify(error.response.data, null, 2));
    } else if (error.request) {
      console.error('  No response received:', error.message);
    } else {
      console.error('  Request setup error:', error.message);
    }
  }
}

async function main() {
  console.log('\n' + '='.repeat(80));
  console.log('AUTHENTICATION STATUS DIAGNOSTIC TEST');
  console.log('This test will verify the status value being returned from database');
  console.log('and confirm why active users are being rejected');
  console.log('='.repeat(80));

  for (const user of testUsers) {
    await testUserAuthentication(user);
    // Add delay between tests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  console.log('\n' + '='.repeat(80));
  console.log('DIAGNOSTIC TEST COMPLETE');
  console.log('Check the backend logs for detailed status information');
  console.log('='.repeat(80) + '\n');
}

// Run the test
main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
