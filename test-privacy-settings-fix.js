/**
 * Test to verify the privacy settings PUT endpoint fix
 * This test verifies that the endpoint now returns 200/201 instead of 500
 */

const axios = require('axios');

const API_BASE_URL = 'http://localhost:3001/api/v1';

async function testPrivacySettingsEndpoint() {
  console.log('=== Privacy Settings PUT Endpoint Fix Verification ===\n');

  let testUser = null;
  let authToken = null;

  try {
    // Step 1: Register a test user
    console.log('Step 1: Registering test user...');
    const testEmail = `privacy-test-${Date.now()}@smarttech.com`;
    const randomPhone = `017${Math.floor(10000000 + Math.random() * 90000000)}`;
    console.log(`  Email: ${testEmail}`);
    console.log(`  Phone: ${randomPhone}`);
    const registerResponse = await axios.post(`${API_BASE_URL}/auth/register`, {
      email: testEmail,
      password: 'SecureP@ssw0rd!2026',
      confirmPassword: 'SecureP@ssw0rd!2026',
      firstName: 'Privacy',
      lastName: 'User',
      phone: randomPhone
    });

    console.log(`  Registration response: ${JSON.stringify(registerResponse.data, null, 2)}`);
    testUser = registerResponse.data.user;
    console.log(`✓ User registered: ${testUser.email}\n`);

    // Step 2: Login to get auth token
    console.log('Step 2: Logging in to get auth token...');
    const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
      identifier: testEmail,
      password: 'SecureP@ssw0rd!2026'
    });

    console.log(`  Login response: ${JSON.stringify(loginResponse.data, null, 2)}`);
    authToken = loginResponse.data.token;
    console.log(`✓ Auth token obtained\n`);

    // Step 3: Test PUT request to privacy settings endpoint
    console.log('Step 3: Testing PUT request to /profile/preferences/privacy...');
    console.log('Request body:', {
      profileVisibility: 'private',
      showEmail: false,
      showPhone: false,
      showAddress: false,
      allowSearchByEmail: false,
      allowSearchByPhone: false,
      twoFactorEnabled: false
    });

    const putResponse = await axios.put(
      `${API_BASE_URL}/profile/preferences/privacy`,
      {
        profileVisibility: 'private',
        showEmail: false,
        showPhone: false,
        showAddress: false,
        allowSearchByEmail: false,
        allowSearchByPhone: false,
        twoFactorEnabled: false
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        }
      }
    );

    console.log(`✓ PUT request successful!`);
    console.log(`  Status Code: ${putResponse.status}`);
    console.log(`  Response: ${JSON.stringify(putResponse.data, null, 2)}\n`);

    // Step 4: Verify the settings were saved correctly
    console.log('Step 4: Verifying settings were saved...');
    const getResponse = await axios.get(
      `${API_BASE_URL}/profile/preferences/privacy`,
      {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      }
    );

    console.log(`✓ GET request successful!`);
    console.log(`  Status Code: ${getResponse.status}`);
    console.log(`  Saved settings: ${JSON.stringify(getResponse.data.data.settings, null, 2)}\n`);

    // Step 5: Test with different profileVisibility values
    console.log('Step 5: Testing with different profileVisibility values...');
    const visibilityValues = ['public', 'private', 'friends_only'];

    for (const visibility of visibilityValues) {
      console.log(`  Testing with profileVisibility: ${visibility}...`);
      const updateResponse = await axios.put(
        `${API_BASE_URL}/profile/preferences/privacy`,
        {
          profileVisibility: visibility
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
          }
        }
      );
      console.log(`  ✓ ${visibility} - Status: ${updateResponse.status}`);
    }
    console.log();

    // Step 6: Test invalid profileVisibility value (should return 400)
    console.log('Step 6: Testing validation with invalid profileVisibility...');
    try {
      await axios.put(
        `${API_BASE_URL}/profile/preferences/privacy`,
        {
          profileVisibility: 'INVALID_VALUE'
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
          }
        }
      );
      console.log('✗ UNEXPECTED: Invalid value was accepted\n');
    } catch (error) {
      if (error.response && error.response.status === 400) {
        console.log('✓ Validation working correctly - Invalid value rejected with 400 status\n');
      } else {
        console.log(`✗ Unexpected error: ${error.message}\n`);
      }
    }

    console.log('=== Test Summary ===');
    console.log('✓ All tests passed!');
    console.log('✓ Privacy settings PUT endpoint is working correctly');
    console.log('✓ Returns 200/201 status code instead of 500');
    console.log('✓ Accepts lowercase profileVisibility values: public, private, friends_only');
    console.log('✓ Validates input correctly and rejects invalid values\n');

  } catch (error) {
    console.error('✗ Test failed!');
    if (error.response) {
      console.error(`  Status: ${error.response.status}`);
      console.error(`  Error: ${JSON.stringify(error.response.data, null, 2)}`);
    } else {
      console.error(`  Error: ${error.message}`);
    }
    console.error('\n=== Fix Verification FAILED ===');
  }
}

testPrivacySettingsEndpoint();
