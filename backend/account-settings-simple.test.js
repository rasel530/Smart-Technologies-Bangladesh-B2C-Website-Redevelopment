/**
 * Simple Account Settings Test
 * Tests all Account Settings endpoints with corrected routes and response formats
 */

const http = require('http');
const fs = require('fs');

// Test configuration
const API_BASE_URL = 'http://localhost:3001/api/v1';
const TEST_USER_EMAIL = 'testuser' + Date.now() + '@example.com';
const TEST_USER_PASSWORD = 'SecurePass@2024!';
let AUTH_TOKEN = null;
let TEST_USER_ID = null;

// Test results
const results = [];

function logResult(testName, passed, details, error = null) {
  const result = { test: testName, passed, details, error, timestamp: new Date().toISOString() };
  results.push(result);
  const status = passed ? '✅ PASS' : '❌ FAIL';
  console.log(`${status} ${testName}`);
  if (details) console.log(`   Details: ${details}`);
  if (error) console.log(`   Error: ${error}`);
  return passed;
}

async function makeRequest(method, path, data = null, token = null) {
  return new Promise((resolve) => {
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      }
    };

    const req = http.request(`${API_BASE_URL}${path}`, options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: body ? JSON.parse(body) : null });
        } catch (e) {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });

    req.on('error', (error) => resolve({ status: 500, error: error.message }));
    if (data) req.write(JSON.stringify(data));
    req.end();
  });
}

async function runTests() {
  console.log('\n========================================');
  console.log('  ACCOUNT SETTINGS API TEST');
  console.log('========================================\n');

  // 1. Register test user
  console.log('1. Registering test user...');
  const registerData = {
    email: TEST_USER_EMAIL,
    password: TEST_USER_PASSWORD,
    confirmPassword: TEST_USER_PASSWORD,
    firstName: 'Test',
    lastName: 'User',
    phone: '018' + Math.floor(Math.random() * 100000000).toString().padStart(8, '0')
  };
  const registerResult = await makeRequest('POST', '/auth/register', registerData);
  const registerPassed = registerResult.status === 201 || registerResult.status === 200;
  logResult('Register test user', registerPassed, `Status: ${registerResult.status}`, !registerPassed ? JSON.stringify(registerResult.data) : null);
  TEST_USER_ID = registerResult.data?.user?.id || registerResult.data?.data?.user?.id;

  // 2. Login
  console.log('\n2. Logging in...');
  const loginData = { identifier: TEST_USER_EMAIL, password: TEST_USER_PASSWORD };
  const loginResult = await makeRequest('POST', '/auth/login', loginData);
  const loginPassed = loginResult.status === 200 || loginResult.status === 201;
  logResult('Login', loginPassed, `Status: ${loginResult.status}`, !loginPassed ? JSON.stringify(loginResult.data) : null);
  AUTH_TOKEN = loginResult.data?.token || loginResult.data?.data?.token;

  if (!AUTH_TOKEN) {
    console.log('\n❌ Cannot proceed without auth token');
    return;
  }

  // 3. GET notifications
  console.log('\n3. Testing GET /profile/preferences/notifications...');
  const getNotif = await makeRequest('GET', '/profile/preferences/notifications', null, AUTH_TOKEN);
  const getNotifPassed = getNotif.status === 200;
  const hasNotifPrefs = getNotif.data?.data?.preferences !== undefined;
  logResult('GET notifications', getNotifPassed && hasNotifPrefs, 
    `Status: ${getNotif.status}, Has preferences: ${hasNotifPrefs}`, 
    !getNotifPassed ? JSON.stringify(getNotif.data) : null);

  // 4. PUT notifications
  console.log('\n4. Testing PUT /profile/preferences/notifications...');
  const putNotifData = {
    emailNotifications: true,
    smsNotifications: false,
    whatsappNotifications: true,
    marketingCommunications: true,
    newsletterSubscription: false,
    notificationFrequency: 'daily'
  };
  const putNotif = await makeRequest('PUT', '/profile/preferences/notifications', putNotifData, AUTH_TOKEN);
  const putNotifPassed = putNotif.status === 200;
  const hasPutNotifPrefs = putNotif.data?.data?.preferences !== undefined;
  const hasExtraMsgNotif = putNotif.data?.message !== undefined;
  logResult('PUT notifications', putNotifPassed && hasPutNotifPrefs && !hasExtraMsgNotif,
    `Status: ${putNotif.status}, Has preferences: ${hasPutNotifPrefs}, No extra message: ${!hasExtraMsgNotif}`,
    !putNotifPassed ? JSON.stringify(putNotif.data) : null);

  // 5. GET communication
  console.log('\n5. Testing GET /profile/preferences/communication...');
  const getComm = await makeRequest('GET', '/profile/preferences/communication', null, AUTH_TOKEN);
  const getCommPassed = getComm.status === 200;
  const hasCommPrefs = getComm.data?.data?.preferences !== undefined;
  logResult('GET communication', getCommPassed && hasCommPrefs,
    `Status: ${getComm.status}, Has preferences: ${hasCommPrefs}`,
    !getCommPassed ? JSON.stringify(getComm.data) : null);

  // 6. PUT communication
  console.log('\n6. Testing PUT /profile/preferences/communication...');
  const putCommData = {
    preferredLanguage: 'en',
    preferredTimezone: 'Asia/Dhaka',
    preferredContactMethod: 'email',
    marketingConsent: true,
    dataSharingConsent: false
  };
  const putComm = await makeRequest('PUT', '/profile/preferences/communication', putCommData, AUTH_TOKEN);
  const putCommPassed = putComm.status === 200;
  const hasPutCommPrefs = putComm.data?.data?.preferences !== undefined;
  const hasExtraMsgComm = putComm.data?.message !== undefined;
  logResult('PUT communication', putCommPassed && hasPutCommPrefs && !hasExtraMsgComm,
    `Status: ${putComm.status}, Has preferences: ${hasPutCommPrefs}, No extra message: ${!hasExtraMsgComm}`,
    !putCommPassed ? JSON.stringify(putComm.data) : null);

  // 7. GET privacy
  console.log('\n7. Testing GET /profile/preferences/privacy...');
  const getPrivacy = await makeRequest('GET', '/profile/preferences/privacy', null, AUTH_TOKEN);
  const getPrivacyPassed = getPrivacy.status === 200;
  const hasSettings = getPrivacy.data?.data?.settings !== undefined;
  const hasOldFormat = getPrivacy.data?.data?.privacySettings !== undefined;
  logResult('GET privacy', getPrivacyPassed && hasSettings && !hasOldFormat,
    `Status: ${getPrivacy.status}, Has settings: ${hasSettings}, Uses correct format: ${!hasOldFormat}`,
    !getPrivacyPassed ? JSON.stringify(getPrivacy.data) : null);

  // 8. PUT privacy
  console.log('\n8. Testing PUT /profile/preferences/privacy...');
  const putPrivacyData = {
    profileVisibility: 'PUBLIC',
    showEmail: false,
    showPhone: false,
    showAddress: false,
    allowSearchByEmail: false,
    allowSearchByPhone: false,
    twoFactorEnabled: false
  };
  const putPrivacy = await makeRequest('PUT', '/profile/preferences/privacy', putPrivacyData, AUTH_TOKEN);
  const putPrivacyPassed = putPrivacy.status === 200;
  const hasPutSettings = putPrivacy.data?.data?.settings !== undefined;
  const hasPutOldFormat = putPrivacy.data?.data?.privacySettings !== undefined;
  logResult('PUT privacy', putPrivacyPassed && hasPutSettings && !hasPutOldFormat,
    `Status: ${putPrivacy.status}, Has settings: ${hasPutSettings}, Uses correct format: ${!hasPutOldFormat}`,
    !putPrivacyPassed ? JSON.stringify(putPrivacy.data) : null);

  // 9. Test old route (should 404)
  console.log('\n9. Testing old route /preferences/privacy (should 404)...');
  const oldRoute = await makeRequest('GET', '/preferences/privacy', null, AUTH_TOKEN);
  logResult('Old privacy route returns 404', oldRoute.status === 404,
    `Status: ${oldRoute.status}`, null);

  // 10. Test authentication required
  console.log('\n10. Testing authentication requirement...');
  const unauth = await makeRequest('GET', '/profile/preferences/notifications', null, null);
  logResult('Authentication required (401/403)', unauth.status === 401 || unauth.status === 403,
    `Status: ${unauth.status}`, null);

  // Summary
  console.log('\n========================================');
  console.log('  TEST SUMMARY');
  console.log('========================================\n');
  
  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;
  const total = results.length;
  const rate = ((passed / total) * 100).toFixed(2);
  
  console.log(`Total Tests: ${total}`);
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed}`);
  console.log(`Success Rate: ${rate}%\n`);

  if (failed > 0) {
    console.log('Failed Tests:');
    results.filter(r => !r.passed).forEach(r => {
      console.log(`  - ${r.test}`);
      if (r.error) console.log(`    Error: ${r.error}`);
    });
  }

  // Save results
  fs.writeFileSync('./account-settings-simple-results.json', JSON.stringify(results, null, 2));
  console.log('\n📄 Results saved to account-settings-simple-results.json');
}

runTests().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
