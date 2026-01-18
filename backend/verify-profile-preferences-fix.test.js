/**
 * Final Verification Script for Profile Preferences Endpoints
 * Tests both notification preferences and privacy settings endpoints
 * to confirm 500 Internal Server Errors are permanently fixed
 */

const http = require('http');

// Configuration
const BASE_URL = 'localhost';
const PORT = 3001;
const NOTIFICATION_ENDPOINT = '/api/v1/profile/preferences/notifications';
const PRIVACY_ENDPOINT = '/api/v1/profile/preferences/privacy';

// Test user credentials (you may need to adjust these)
const TEST_USER = {
  email: 'test@example.com',
  password: 'Test123!'
};

// Store auth token
let authToken = null;

/**
 * Make HTTP request
 */
function makeRequest(method, path, data = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: BASE_URL,
      port: PORT,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: body ? JSON.parse(body) : null
          });
        } catch (e) {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: body
          });
        }
      });
    });

    req.on('error', reject);

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

/**
 * Login to get auth token
 */
async function login() {
  console.log('\n=== Step 1: Login ===');
  try {
    const response = await makeRequest('POST', '/api/v1/auth/login', TEST_USER);
    
    if (response.statusCode === 200 || response.statusCode === 201) {
      authToken = response.body.token || response.body.data?.token;
      console.log('✓ Login successful');
      console.log(`  Status: ${response.statusCode}`);
      console.log(`  Token: ${authToken ? 'Obtained' : 'Not found'}`);
      return true;
    } else {
      console.log('✗ Login failed');
      console.log(`  Status: ${response.statusCode}`);
      console.log(`  Response:`, response.body);
      return false;
    }
  } catch (error) {
    console.log('✗ Login error:', error.message);
    return false;
  }
}

/**
 * Test Notification Preferences Endpoint
 */
async function testNotificationPreferences() {
  console.log('\n=== Step 2: Test Notification Preferences Endpoint ===');
  console.log(`Endpoint: PUT ${NOTIFICATION_ENDPOINT}`);

  const testData = {
    emailNotifications: true,
    smsNotifications: false,
    pushNotifications: true,
    orderUpdates: true,
    securityAlerts: true,
    marketingEmails: false
  };

  try {
    const headers = authToken ? { 'Authorization': `Bearer ${authToken}` } : {};
    const response = await makeRequest('PUT', NOTIFICATION_ENDPOINT, testData, headers);

    console.log(`Status Code: ${response.statusCode}`);
    
    if (response.statusCode === 200 || response.statusCode === 201) {
      console.log('✓ Notification Preferences Update Successful');
      console.log('  Response Data:', JSON.stringify(response.body, null, 2));
      
      // Verify the three new fields are present
      const data = response.body.data || response.body;
      const newFields = ['pushNotifications', 'orderUpdates', 'securityAlerts'];
      const missingFields = newFields.filter(field => !(field in data));
      
      if (missingFields.length === 0) {
        console.log('✓ All three new fields present in response:', newFields.join(', '));
      } else {
        console.log('✗ Missing fields:', missingFields.join(', '));
      }
      
      return {
        success: true,
        statusCode: response.statusCode,
        data: response.body,
        missingFields: missingFields
      };
    } else {
      console.log('✗ Notification Preferences Update Failed');
      console.log('  Response:', JSON.stringify(response.body, null, 2));
      return {
        success: false,
        statusCode: response.statusCode,
        error: response.body
      };
    }
  } catch (error) {
    console.log('✗ Notification Preferences Error:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Test Privacy Settings Endpoint
 */
async function testPrivacySettings() {
  console.log('\n=== Step 3: Test Privacy Settings Endpoint ===');
  console.log(`Endpoint: PUT ${PRIVACY_ENDPOINT}`);

  const testData = {
    profileVisibility: 'private',
    showEmail: false,
    showPhone: false,
    allowMessages: true
  };

  try {
    const headers = authToken ? { 'Authorization': `Bearer ${authToken}` } : {};
    const response = await makeRequest('PUT', PRIVACY_ENDPOINT, testData, headers);

    console.log(`Status Code: ${response.statusCode}`);
    
    if (response.statusCode === 200 || response.statusCode === 201) {
      console.log('✓ Privacy Settings Update Successful');
      console.log('  Response Data:', JSON.stringify(response.body, null, 2));
      
      // Verify lowercase enum values
      const data = response.body.data || response.body;
      if (data.profileVisibility) {
        const isValidEnum = ['public', 'private', 'friends_only'].includes(data.profileVisibility);
        if (isValidEnum) {
          console.log(`✓ profileVisibility uses lowercase enum value: "${data.profileVisibility}"`);
        } else {
          console.log(`✗ profileVisibility has invalid value: "${data.profileVisibility}"`);
        }
      }
      
      return {
        success: true,
        statusCode: response.statusCode,
        data: response.body
      };
    } else {
      console.log('✗ Privacy Settings Update Failed');
      console.log('  Response:', JSON.stringify(response.body, null, 2));
      return {
        success: false,
        statusCode: response.statusCode,
        error: response.body
      };
    }
  } catch (error) {
    console.log('✗ Privacy Settings Error:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Get Notification Preferences (GET)
 */
async function getNotificationPreferences() {
  console.log('\n=== Step 4: Get Notification Preferences ===');
  console.log(`Endpoint: GET ${NOTIFICATION_ENDPOINT}`);

  try {
    const headers = authToken ? { 'Authorization': `Bearer ${authToken}` } : {};
    const response = await makeRequest('GET', NOTIFICATION_ENDPOINT, null, headers);

    console.log(`Status Code: ${response.statusCode}`);
    
    if (response.statusCode === 200) {
      console.log('✓ Get Notification Preferences Successful');
      console.log('  Response Data:', JSON.stringify(response.body, null, 2));
      
      // Verify the three new fields are present
      const data = response.body.data || response.body;
      const newFields = ['pushNotifications', 'orderUpdates', 'securityAlerts'];
      const missingFields = newFields.filter(field => !(field in data));
      
      if (missingFields.length === 0) {
        console.log('✓ All three new fields present:', newFields.join(', '));
      } else {
        console.log('✗ Missing fields:', missingFields.join(', '));
      }
      
      return {
        success: true,
        statusCode: response.statusCode,
        data: response.body,
        missingFields: missingFields
      };
    } else {
      console.log('✗ Get Notification Preferences Failed');
      console.log('  Response:', JSON.stringify(response.body, null, 2));
      return {
        success: false,
        statusCode: response.statusCode,
        error: response.body
      };
    }
  } catch (error) {
    console.log('✗ Get Notification Preferences Error:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Main execution
 */
async function main() {
  console.log('='.repeat(70));
  console.log('PROFILE PREFERENCES ENDPOINTS FINAL VERIFICATION');
  console.log('='.repeat(70));
  console.log(`Testing: ${BASE_URL}:${PORT}`);
  console.log('Date:', new Date().toISOString());

  const results = {
    login: null,
    notificationPut: null,
    notificationGet: null,
    privacyPut: null
  };

  // Step 1: Login
  results.login = await login();
  
  if (!results.login) {
    console.log('\n⚠ WARNING: Login failed. Proceeding without authentication...');
    console.log('  Some endpoints may require authentication.');
  }

  // Step 2: Test Notification Preferences PUT
  results.notificationPut = await testNotificationPreferences();

  // Step 3: Test Privacy Settings PUT
  results.privacyPut = await testPrivacySettings();

  // Step 4: Get Notification Preferences to verify persistence
  results.notificationGet = await getNotificationPreferences();

  // Summary
  console.log('\n' + '='.repeat(70));
  console.log('VERIFICATION SUMMARY');
  console.log('='.repeat(70));

  const tests = [
    { name: 'Login', result: results.login },
    { name: 'PUT Notification Preferences', result: results.notificationPut },
    { name: 'PUT Privacy Settings', result: results.privacyPut },
    { name: 'GET Notification Preferences', result: results.notificationGet }
  ];

  let passed = 0;
  let failed = 0;

  tests.forEach(test => {
    const status = test.result && test.result.success ? '✓ PASS' : '✗ FAIL';
    console.log(`${status} - ${test.name}`);
    if (test.result && test.result.success) {
      passed++;
    } else {
      failed++;
    }
  });

  console.log('\n' + '-'.repeat(70));
  console.log(`Total: ${tests.length} tests`);
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed}`);
  console.log('-'.repeat(70));

  // Check for 500 errors
  const has500Errors = tests.some(test => 
    test.result && test.result.statusCode === 500
  );

  if (has500Errors) {
    console.log('\n✗ CRITICAL: 500 Internal Server Errors detected!');
    console.log('  The fix has NOT been successful.');
  } else {
    console.log('\n✓ SUCCESS: No 500 Internal Server Errors detected!');
    console.log('  The fix appears to be working correctly.');
  }

  // Check for missing fields
  const missingFields = results.notificationPut?.missingFields?.length || 0;
  if (missingFields > 0) {
    console.log(`\n⚠ WARNING: ${missingFields} new field(s) missing from response`);
  } else {
    console.log('\n✓ All three new notification fields present in responses');
  }

  console.log('\n' + '='.repeat(70));
  console.log('VERIFICATION COMPLETE');
  console.log('='.repeat(70));

  // Exit with appropriate code
  process.exit(failed > 0 ? 1 : 0);
}

// Run the verification
main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
