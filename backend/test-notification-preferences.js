// Test script for notification preferences API
const axios = require('axios');

const API_BASE_URL = 'http://localhost:3001/api/v1';

// Test credentials (use existing user)
const TEST_EMAIL = 'raselbepari88@gmail.com';
const TEST_PASSWORD = 'q~_^cpU472z_';

async function testNotificationPreferences() {
  try {
    console.log('=== Testing Notification Preferences API ===\n');

    // Step 1: Login to get token
    console.log('Step 1: Logging in...');
    const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
      identifier: TEST_EMAIL,
      password: TEST_PASSWORD,
      rememberMe: false
    });

    const token = loginResponse.data.token;
    console.log('✓ Login successful, token received');
    console.log(`Token: ${token.substring(0, 30)}...\n`);

    // Configure axios with auth header
    const authAxios = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    // Step 2: Get notification preferences (should create default if not exists)
    console.log('Step 2: Getting notification preferences...');
    const getResponse = await authAxios.get('/user/notification-preferences');
    console.log('✓ Get preferences successful');
    console.log('Response:', JSON.stringify(getResponse.data, null, 2));
    console.log('Preferences:', JSON.stringify(getResponse.data.data.preferences, null, 2));

    // Step 3: Update notification preferences
    console.log('\nStep 3: Updating notification preferences...');
    const updateData = {
      emailNotifications: true,
      smsNotifications: false,
      pushNotifications: true,
      orderUpdates: true,
      promotionalEmails: true,
      securityAlerts: true
    };

    const updateResponse = await authAxios.put('/user/notification-preferences', updateData);
    console.log('✓ Update preferences successful');
    console.log('Response:', JSON.stringify(updateResponse.data, null, 2));
    console.log('Updated preferences:', JSON.stringify(updateResponse.data.data.preferences, null, 2));

    // Step 4: Verify updated preferences
    console.log('\nStep 4: Verifying updated preferences...');
    const verifyResponse = await authAxios.get('/user/notification-preferences');
    console.log('✓ Verification successful');
    console.log('Final preferences:', JSON.stringify(verifyResponse.data.data.preferences, null, 2));

    console.log('\n=== All tests passed successfully! ===');

  } catch (error) {
    console.error('\n❌ Test failed:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    } else {
      console.error('Error:', error.message);
    }
  }
}

// Run the test
testNotificationPreferences();
