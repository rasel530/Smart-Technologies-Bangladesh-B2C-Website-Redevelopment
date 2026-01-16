/**
 * Diagnostic script to test role creation API
 * This will help identify the exact validation error
 */

const axios = require('axios');

const API_BASE_URL = 'http://localhost:3001/api';

// Test cases with different role names
const testCases = [
  {
    name: 'Test Case 1: Valid role name (ADMIN)',
    data: {
      name: 'ADMIN',
      description: 'Test admin role',
      hierarchy_level: 90
    }
  },
  {
    name: 'Test Case 2: Invalid role name (custom_role)',
    data: {
      name: 'custom_role',
      description: 'Test custom role',
      hierarchy_level: 50
    }
  },
  {
    name: 'Test Case 3: Invalid role name (test_role)',
    data: {
      name: 'test_role',
      description: 'Test role',
      hierarchy_level: 10
    }
  },
  {
    name: 'Test Case 4: Valid role name (SUPPORT)',
    data: {
      name: 'SUPPORT',
      description: 'Test support role',
      hierarchy_level: 30
    }
  }
];

async function testRoleCreation() {
  console.log('='.repeat(80));
  console.log('ROLE CREATION API DIAGNOSTIC');
  console.log('='.repeat(80));
  console.log();

  // First, try to get an auth token
  let authToken = null;
  try {
    console.log('Step 1: Attempting to authenticate...');
    const loginResponse = await axios.post(`${API_BASE_URL}/v1/auth/login`, {
      email: 'admin@smarttech.com',
      password: 'Admin123!'
    });

    if (loginResponse.data && loginResponse.data.token) {
      authToken = loginResponse.data.token;
      console.log('✓ Authentication successful');
      console.log(`  Token: ${authToken.substring(0, 20)}...`);
      console.log();
    } else {
      console.log('✗ Authentication failed - no token in response');
      console.log('  Response:', JSON.stringify(loginResponse.data, null, 2));
      console.log();
      console.log('Note: Testing without authentication token...');
    }
  } catch (error) {
    console.log('✗ Authentication failed');
    console.log('  Error:', error.response?.data || error.message);
    console.log();
    console.log('Note: Testing without authentication token...');
  }

  // Test each case
  for (let i = 0; i < testCases.length; i++) {
    const testCase = testCases[i];
    console.log('='.repeat(80));
    console.log(`TEST ${i + 1}: ${testCase.name}`);
    console.log('='.repeat(80));
    console.log();
    console.log('Request Payload:');
    console.log(JSON.stringify(testCase.data, null, 2));
    console.log();
    console.log(`Payload Size: ${JSON.stringify(testCase.data).length} bytes`);
    console.log();

    try {
      const headers = {
        'Content-Type': 'application/json'
      };

      if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
      }

      console.log('Sending POST request to /api/rbac/roles...');
      const response = await axios.post(`${API_BASE_URL}/rbac/roles`, testCase.data, {
        headers,
        validateStatus: () => true // Don't throw on any status code
      });

      console.log(`Response Status: ${response.status} ${response.statusText}`);
      console.log();

      if (response.status >= 200 && response.status < 300) {
        console.log('✓ SUCCESS');
        console.log('Response:', JSON.stringify(response.data, null, 2));
      } else {
        console.log('✗ FAILED');
        console.log('Error Response:', JSON.stringify(response.data, null, 2));
      }
    } catch (error) {
      console.log('✗ ERROR');
      console.log('Error:', error.message);
      if (error.response) {
        console.log('Status:', error.response.status);
        console.log('Response:', JSON.stringify(error.response.data, null, 2));
      }
    }

    console.log();
    console.log();
  }

  console.log('='.repeat(80));
  console.log('DIAGNOSTIC COMPLETE');
  console.log('='.repeat(80));
}

// Run the diagnostic
testRoleCreation().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
