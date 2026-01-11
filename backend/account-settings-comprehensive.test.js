/**
 * Comprehensive Account Settings API Test Script
 * Tests all Account Settings endpoints with corrected routes and response formats
 * 
 * Tests the following fixes:
 * 1. Privacy settings response format - Changed from `data.privacySettings` to `data.settings`
 * 2. Privacy settings GET route path - Changed from `/preferences/privacy` to `/privacy`
 * 3. Privacy settings PUT route path - Changed from `/preferences/privacy` to `/privacy`
 * 4. Consolidated route mounts - Removed conflicting mounts, kept only `notificationPreferencesRoutes` under `/v1/profile/preferences`
 */

const http = require('http');

// Test configuration
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3001/api/v1';
const TEST_USER_EMAIL = 'test@example.com';
const TEST_USER_PASSWORD = 'Test@123456';
let TEST_USER_ID = null;
let AUTH_TOKEN = null;

// Test results storage
const testResults = {
  authentication: { passed: 0, failed: 0, tests: [] },
  notificationPreferences: { passed: 0, failed: 0, tests: [] },
  communicationPreferences: { passed: 0, failed: 0, tests: [] },
  privacySettings: { passed: 0, failed: 0, tests: [] },
  responseFormat: { passed: 0, failed: 0, tests: [] },
  security: { passed: 0, failed: 0, tests: [] }
};

// Color codes for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

// Helper function to log test results
function logTest(category, testName, passed, details = null, error = null) {
  const status = passed ? `${colors.green}✅ PASS${colors.reset}` : `${colors.red}❌ FAIL${colors.reset}`;
  console.log(`${status} [${category}] ${testName}`);
  
  if (details) {
    console.log(`   ${colors.cyan}Details:${colors.reset}`, details);
  }
  
  if (error) {
    console.log(`   ${colors.red}Error:${colors.reset}`, error);
    testResults[category].failed++;
    testResults[category].tests.push({ test: testName, passed: false, error: error.message || error });
  } else {
    testResults[category].passed++;
    testResults[category].tests.push({ test: testName, passed: true, details });
  }
}

// Helper function to make HTTP request
async function makeRequest(method, path, data = null, token = null) {
  const url = `${API_BASE_URL}${path}`;
  
  return new Promise((resolve) => {
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      }
    };

    const req = http.request(url, options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const data = body ? JSON.parse(body) : null;
          resolve({
            status: res.statusCode,
            data,
            headers: res.headers
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            data: body,
            headers: res.headers
          });
        }
      });
    });

    req.on('error', (error) => {
      resolve({
        status: 500,
        error: error.message,
        data: null
      });
    });

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

// ==================== AUTHENTICATION ====================

async function testAuthentication() {
  console.log(`\n${colors.blue}=== Testing Authentication ===${colors.reset}`);
  
  // Test 1: Login to get auth token
  console.log('\nTest 1: Login to get authentication token');
  const loginData = {
    email: TEST_USER_EMAIL,
    password: TEST_USER_PASSWORD
  };

  const loginResult = await makeRequest('POST', '/auth/login', loginData);
  
  if (loginResult.status === 200 || loginResult.status === 201) {
    const authData = loginResult.data;
    AUTH_TOKEN = authData.token || authData.accessToken || authData.data?.token;
    TEST_USER_ID = authData.user?.id || authData.data?.user?.id;
    
    if (AUTH_TOKEN) {
      logTest('authentication', 'Login successful', true, 
        `User ID: ${TEST_USER_ID}, Token: ${AUTH_TOKEN.substring(0, 20)}...`);
    } else {
      logTest('authentication', 'Login successful - no token found', false, 
        'Response:', JSON.stringify(loginResult.data, null, 2));
    }
  } else {
    logTest('authentication', 'Login failed', false, 
      `Status: ${loginResult.status}`, loginResult.error || loginResult.data);
    throw new Error('Authentication failed - cannot proceed with tests');
  }
}

// ==================== NOTIFICATION PREFERENCES ====================

async function testNotificationPreferences() {
  console.log(`\n${colors.blue}=== Testing Notification Preferences ===${colors.reset}`);
  
  // Test 2: GET /api/v1/profile/preferences/notifications
  console.log('\nTest 2: GET /api/v1/profile/preferences/notifications');
  const getResult = await makeRequest('GET', '/profile/preferences/notifications', null, AUTH_TOKEN);
  
  if (getResult.status === 200) {
    const hasSuccess = getResult.data.success === true;
    const hasData = getResult.data.data !== undefined;
    const hasPreferences = hasData && getResult.data.data.preferences !== undefined;
    
    logTest('notificationPreferences', 'GET notifications endpoint', true,
      `Status: ${getResult.status}, Success: ${hasSuccess}, Has preferences: ${hasPreferences}`);
    
    // Test response format
    logTest('responseFormat', 'Notifications GET response format', hasSuccess && hasPreferences,
      `Expected: { success: true, data: { preferences: {...} } }`,
      !hasSuccess || !hasPreferences ? 'Invalid response format' : null);
    
    // Store preferences for update test
    if (hasPreferences) {
      const prefs = getResult.data.data.preferences;
      console.log(`   ${colors.cyan}Current preferences:${colors.reset}`, JSON.stringify(prefs, null, 2));
    }
  } else {
    logTest('notificationPreferences', 'GET notifications endpoint', false,
      `Status: ${getResult.status}`, getResult.error || getResult.data);
  }

  // Test 3: PUT /api/v1/profile/preferences/notifications
  const updateData = {
    email: false,
    sms: true,
    whatsapp: false,
    marketing: true,
    newsletter: false,
    frequency: 'daily'
  };
  
  console.log('\nTest 3: PUT /api/v1/profile/preferences/notifications');
  const putResult = await makeRequest('PUT', '/profile/preferences/notifications', updateData, AUTH_TOKEN);
  
  if (putResult.status === 200) {
    const hasSuccess = putResult.data.success === true;
    const hasData = putResult.data.data !== undefined;
    const hasPreferences = hasData && putResult.data.data.preferences !== undefined;
    
    logTest('notificationPreferences', 'PUT notifications endpoint', true,
      `Status: ${putResult.status}, Success: ${hasSuccess}, Has preferences: ${hasPreferences}`);
    
    // Test response format
    logTest('responseFormat', 'Notifications PUT response format', hasSuccess && hasPreferences,
      `Expected: { success: true, data: { preferences: {...} } }`,
      !hasSuccess || !hasPreferences ? 'Invalid response format' : null);
    
    if (hasPreferences) {
      console.log(`   ${colors.cyan}Updated preferences:${colors.reset}`, JSON.stringify(putResult.data.data.preferences, null, 2));
    }
  } else {
    logTest('notificationPreferences', 'PUT notifications endpoint', false,
      `Status: ${putResult.status}`, putResult.error || putResult.data);
  }
}

// ==================== COMMUNICATION PREFERENCES ====================

async function testCommunicationPreferences() {
  console.log(`\n${colors.blue}=== Testing Communication Preferences ===${colors.reset}`);
  
  // Test 4: GET /api/v1/profile/preferences/communication
  console.log('\nTest 4: GET /api/v1/profile/preferences/communication');
  const getResult = await makeRequest('GET', '/profile/preferences/communication', null, AUTH_TOKEN);
  
  if (getResult.status === 200) {
    const hasSuccess = getResult.data.success === true;
    const hasData = getResult.data.data !== undefined;
    const hasPreferences = hasData && getResult.data.data.preferences !== undefined;
    
    logTest('communicationPreferences', 'GET communication endpoint', true,
      `Status: ${getResult.status}, Success: ${hasSuccess}, Has preferences: ${hasPreferences}`);
    
    // Test response format
    logTest('responseFormat', 'Communication GET response format', hasSuccess && hasPreferences,
      `Expected: { success: true, data: { preferences: {...} } }`,
      !hasSuccess || !hasPreferences ? 'Invalid response format' : null);
    
    if (hasPreferences) {
      console.log(`   ${colors.cyan}Current preferences:${colors.reset}`, JSON.stringify(getResult.data.data.preferences, null, 2));
    }
  } else {
    logTest('communicationPreferences', 'GET communication endpoint', false,
      `Status: ${getResult.status}`, getResult.error || getResult.data);
  }

  // Test 5: PUT /api/v1/profile/preferences/communication
  const updateData = {
    email: true,
    sms: false,
    whatsapp: false,
    marketing: true,
    newsletter: true,
    frequency: 'weekly'
  };
  
  console.log('\nTest 5: PUT /api/v1/profile/preferences/communication');
  const putResult = await makeRequest('PUT', '/profile/preferences/communication', updateData, AUTH_TOKEN);
  
  if (putResult.status === 200) {
    const hasSuccess = putResult.data.success === true;
    const hasData = putResult.data.data !== undefined;
    const hasPreferences = hasData && putResult.data.data.preferences !== undefined;
    
    logTest('communicationPreferences', 'PUT communication endpoint', true,
      `Status: ${putResult.status}, Success: ${hasSuccess}, Has preferences: ${hasPreferences}`);
    
    // Test response format
    logTest('responseFormat', 'Communication PUT response format', hasSuccess && hasPreferences,
      `Expected: { success: true, data: { preferences: {...} } }`,
      !hasSuccess || !hasPreferences ? 'Invalid response format' : null);
    
    if (hasPreferences) {
      console.log(`   ${colors.cyan}Updated preferences:${colors.reset}`, JSON.stringify(putResult.data.data.preferences, null, 2));
    }
  } else {
    logTest('communicationPreferences', 'PUT communication endpoint', false,
      `Status: ${putResult.status}`, putResult.error || putResult.data);
  }
}

// ==================== PRIVACY SETTINGS ====================

async function testPrivacySettings() {
  console.log(`\n${colors.blue}=== Testing Privacy Settings ===${colors.reset}`);
  
  // Test 6: GET /api/v1/profile/preferences/privacy
  console.log('\nTest 6: GET /api/v1/profile/preferences/privacy');
  const getResult = await makeRequest('GET', '/profile/preferences/privacy', null, AUTH_TOKEN);
  
  if (getResult.status === 200) {
    const hasSuccess = getResult.data.success === true;
    const hasData = getResult.data.data !== undefined;
    const hasSettings = hasData && getResult.data.data.settings !== undefined;
    const hasOldFormat = hasData && getResult.data.data.privacySettings !== undefined;
    
    logTest('privacySettings', 'GET privacy endpoint', true,
      `Status: ${getResult.status}, Success: ${hasSuccess}, Has settings: ${hasSettings}`);
    
    // Test response format - should use 'settings' not 'privacySettings'
    if (hasSettings && !hasOldFormat) {
      logTest('responseFormat', 'Privacy GET uses correct format (data.settings)', true,
        'Response uses data.settings format');
    } else if (hasOldFormat) {
      logTest('responseFormat', 'Privacy GET uses correct format (data.settings)', false,
        'Response still uses old format (data.privacySettings)', 
        'Backend fix not applied - still returning data.privacySettings');
    } else {
      logTest('responseFormat', 'Privacy GET uses correct format (data.settings)', false,
        'Neither data.settings nor data.privacySettings found',
        'Invalid response format');
    }
    
    if (hasSettings) {
      console.log(`   ${colors.cyan}Current settings:${colors.reset}`, JSON.stringify(getResult.data.data.settings, null, 2));
    } else if (hasOldFormat) {
      console.log(`   ${colors.yellow}Old format settings:${colors.reset}`, JSON.stringify(getResult.data.data.privacySettings, null, 2));
    }
  } else {
    logTest('privacySettings', 'GET privacy endpoint', false,
      `Status: ${getResult.status}`, getResult.error || getResult.data);
  }

  // Test 7: PUT /api/v1/profile/preferences/privacy
  const updateData = {
    twoFactorEnabled: true,
    dataSharingEnabled: false,
    profileVisibility: 'public'
  };
  
  console.log('\nTest 7: PUT /api/v1/profile/preferences/privacy');
  const putResult = await makeRequest('PUT', '/profile/preferences/privacy', updateData, AUTH_TOKEN);
  
  if (putResult.status === 200) {
    const hasSuccess = putResult.data.success === true;
    const hasData = putResult.data.data !== undefined;
    const hasSettings = hasData && putResult.data.data.settings !== undefined;
    const hasOldFormat = hasData && putResult.data.data.privacySettings !== undefined;
    
    logTest('privacySettings', 'PUT privacy endpoint', true,
      `Status: ${putResult.status}, Success: ${hasSuccess}, Has settings: ${hasSettings}`);
    
    // Test response format - should use 'settings' not 'privacySettings'
    if (hasSettings && !hasOldFormat) {
      logTest('responseFormat', 'Privacy PUT uses correct format (data.settings)', true,
        'Response uses data.settings format');
    } else if (hasOldFormat) {
      logTest('responseFormat', 'Privacy PUT uses correct format (data.settings)', false,
        'Response still uses old format (data.privacySettings)',
        'Backend fix not applied - still returning data.privacySettings');
    } else {
      logTest('responseFormat', 'Privacy PUT uses correct format (data.settings)', false,
        'Neither data.settings nor data.privacySettings found',
        'Invalid response format');
    }
    
    if (hasSettings) {
      console.log(`   ${colors.cyan}Updated settings:${colors.reset}`, JSON.stringify(putResult.data.data.settings, null, 2));
    } else if (hasOldFormat) {
      console.log(`   ${colors.yellow}Old format settings:${colors.reset}`, JSON.stringify(putResult.data.data.privacySettings, null, 2));
    }
  } else {
    logTest('privacySettings', 'PUT privacy endpoint', false,
      `Status: ${putResult.status}`, putResult.error || putResult.data);
  }
}

// ==================== SECURITY TESTS ====================

async function testSecurity() {
  console.log(`\n${colors.blue}=== Testing Security ===${colors.reset}`);
  
  // Test 8: Authentication requirement
  console.log('\nTest 8: Authentication requirement for notifications endpoint');
  const unauthResult = await makeRequest('GET', '/profile/preferences/notifications', null, null);
  
  if (unauthResult.status === 401 || unauthResult.status === 403) {
    logTest('security', 'Authentication required (401/403)', true,
      `Status: ${unauthResult.status} - correctly requires authentication`);
  } else {
    logTest('security', 'Authentication required (401/403)', false,
      `Status: ${unauthResult.status} - should return 401 or 403`,
      'Endpoint not properly protected');
  }

  // Test 9: Test old privacy route (should not work)
  console.log('\nTest 9: Old privacy route should not exist');
  const oldRouteResult = await makeRequest('GET', '/preferences/privacy', null, AUTH_TOKEN);
  
  if (oldRouteResult.status === 404) {
    logTest('security', 'Old privacy route removed (404)', true,
      'Old /preferences/privacy route correctly returns 404');
  } else if (oldRouteResult.status === 200) {
    logTest('security', 'Old privacy route removed (404)', false,
      `Status: ${oldRouteResult.status} - old route still exists`,
      'Conflicting route mount not removed');
  } else {
    logTest('security', 'Old privacy route removed (404)', false,
      `Status: ${oldRouteResult.status} - unexpected response`);
  }
}

// ==================== FRONTEND COMPATIBILITY ====================

async function testFrontendCompatibility() {
  console.log(`\n${colors.blue}=== Testing Frontend Compatibility ===${colors.reset}`);
  
  // Test 10: Verify frontend can extract data from responses
  console.log('\nTest 10: Frontend NotificationSettings component compatibility');
  
  const notifResult = await makeRequest('GET', '/profile/preferences/notifications', null, AUTH_TOKEN);
  if (notifResult.status === 200) {
    const canExtract = notifResult.data?.data?.preferences !== undefined;
    logTest('responseFormat', 'NotificationSettings can extract preferences', canExtract,
      `response.data.preferences exists: ${canExtract}`,
      canExtract ? null : 'Frontend will fail to load preferences');
  }

  console.log('\nTest 11: Frontend PrivacySettings component compatibility');
  
  const privacyResult = await makeRequest('GET', '/profile/preferences/privacy', null, AUTH_TOKEN);
  if (privacyResult.status === 200) {
    const canExtract = privacyResult.data?.data?.settings !== undefined;
    logTest('responseFormat', 'PrivacySettings can extract settings', canExtract,
      `response.data.settings exists: ${canExtract}`,
      canExtract ? null : 'Frontend will fail to load settings - expects data.settings');
  }
}

// ==================== MAIN TEST RUNNER ====================

async function runAllTests() {
  console.log(`\n${'='.repeat(70)}`);
  console.log(`  ${colors.cyan}ACCOUNT SETTINGS COMPREHENSIVE API TEST${colors.reset}`);
  console.log(`  ${colors.yellow}Verifying Backend Fixes for Account Settings${colors.reset}`);
  console.log(`  ${colors.blue}Phase 3, Milestone 3, Task 3: Account Preferences${colors.reset}`);
  console.log(`${'='.repeat(70)}\n`);
  
  console.log(`${colors.cyan}Test Configuration:${colors.reset}`);
  console.log(`  API Base URL: ${API_BASE_URL}`);
  console.log(`  Test User: ${TEST_USER_EMAIL}`);
  console.log(`  Expected Endpoints:`);
  console.log(`    - GET  /api/v1/profile/preferences/notifications`);
  console.log(`    - PUT  /api/v1/profile/preferences/notifications`);
  console.log(`    - GET  /api/v1/profile/preferences/communication`);
  console.log(`    - PUT  /api/v1/profile/preferences/communication`);
  console.log(`    - GET  /api/v1/profile/preferences/privacy`);
  console.log(`    - PUT  /api/v1/profile/preferences/privacy`);
  console.log(`  Expected Response Formats:`);
  console.log(`    - Notification/Communication: { success: true, data: { preferences: {...} } }`);
  console.log(`    - Privacy: { success: true, data: { settings: {...} } }`);
  
  try {
    // Run authentication first
    await testAuthentication();
    
    // Run all endpoint tests
    await testNotificationPreferences();
    await testCommunicationPreferences();
    await testPrivacySettings();
    await testSecurity();
    await testFrontendCompatibility();
    
    // Print summary
    console.log(`\n${'='.repeat(70)}`);
    console.log(`  ${colors.cyan}TEST SUMMARY${colors.reset}`);
    console.log(`${'='.repeat(70)}\n`);
    
    let totalTests = 0;
    let totalPassed = 0;
    let totalFailed = 0;
    
    for (const [category, results] of Object.entries(testResults)) {
      const categoryTotal = results.passed + results.failed;
      totalTests += categoryTotal;
      totalPassed += results.passed;
      totalFailed += results.failed;
      
      if (categoryTotal > 0) {
        console.log(`${colors.blue}${category}:${colors.reset}`);
        console.log(`  Total: ${categoryTotal} | ${colors.green}Passed: ${results.passed}${colors.reset} | ${colors.red}Failed: ${results.failed}${colors.reset}`);
        
        if (results.failed > 0) {
          console.log(`  ${colors.yellow}Failed tests:${colors.reset}`);
          results.tests.filter(t => !t.passed).forEach(t => {
            console.log(`    - ${t.test}`);
            if (t.error) {
              console.log(`      ${colors.red}Error: ${t.error}${colors.reset}`);
            }
          });
        }
        console.log('');
      }
    }
    
    const successRate = totalTests > 0 ? (totalPassed / totalTests * 100).toFixed(2) : '0';
    console.log(`${'='.repeat(70)}`);
    console.log(`  ${colors.cyan}OVERALL RESULTS:${colors.reset}`);
    console.log(`  Total Tests: ${totalTests}`);
    console.log(`  ${colors.green}Passed: ${totalPassed}${colors.reset}`);
    console.log(`  ${colors.red}Failed: ${totalFailed}${colors.reset}`);
    console.log(`  Success Rate: ${successRate}%`);
    console.log(`${'='.repeat(70)}\n`);
    
    // Save results
    const fs = require('fs');
    const resultsPath = './account-settings-test-results.json';
    fs.writeFileSync(resultsPath, JSON.stringify(testResults, null, 2));
    console.log(`${colors.cyan}📄 Test results saved to: ${resultsPath}${colors.reset}\n`);
    
    // Print recommendations
    if (totalFailed > 0) {
      console.log(`${colors.yellow}=== RECOMMENDATIONS ===${colors.reset}\n`);
      
      const privacyFormatFailed = testResults.responseFormat.tests.some(
        t => t.test.includes('Privacy') && !t.passed
      );
      
      if (privacyFormatFailed) {
        console.log(`${colors.red}⚠️  Privacy Settings Response Format Issue:${colors.reset}`);
        console.log(`   The backend is still returning data.privacySettings instead of data.settings`);
        console.log(`   This will cause the PrivacySettings component to fail loading data.`);
        console.log(`   ${colors.cyan}Fix:${colors.reset} Update backend privacy controller to return data.settings`);
        console.log('');
      }
      
      const oldRouteExists = testResults.security.tests.some(
        t => t.test.includes('Old privacy route') && !t.passed
      );
      
      if (oldRouteExists) {
        console.log(`${colors.red}⚠️  Conflicting Route Mount Issue:${colors.reset}`);
        console.log(`   The old /preferences/privacy route still exists.`);
        console.log(`   This may cause routing conflicts.`);
        console.log(`   ${colors.cyan}Fix:${colors.reset} Remove conflicting route mounts in routes/index.js`);
        console.log('');
      }
    } else {
      console.log(`${colors.green}✅ All tests passed! The backend fixes are working correctly.${colors.reset}\n`);
    }
    
  } catch (error) {
    console.error(`\n${colors.red}❌ Fatal error during testing:${colors.reset}`, error.message);
    process.exit(1);
  }
}

// Run tests
runAllTests();
