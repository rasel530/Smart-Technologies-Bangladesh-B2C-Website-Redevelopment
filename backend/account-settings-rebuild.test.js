/**
 * Account Settings API Endpoint Test Script
 * Tests all Account Settings endpoints after rebuild
 * 
 * Tests:
 * - GET/PUT /api/v1/profile/preferences/notifications
 * - GET/PUT /api/v1/profile/preferences/communication
 * - GET/PUT /api/v1/profile/preferences/privacy
 */

const http = require('http');

// Test configuration
const API_BASE_URL = 'http://localhost:3001/api/v1';
const TEST_USER_EMAIL = 'test@example.com';
const TEST_USER_PASSWORD = 'TestPassword123!';
let authToken = null;
let userId = null;

// Test results storage
const testResults = {
  authentication: { passed: 0, failed: 0, tests: [] },
  notificationPreferences: { passed: 0, failed: 0, tests: [] },
  communicationPreferences: { passed: 0, failed: 0, tests: [] },
  privacySettings: { passed: 0, failed: 0, tests: [] }
};

// Helper function to make HTTP request
function makeRequest(method, path, data = null, token = null) {
  return new Promise((resolve, reject) => {
    const url = `${API_BASE_URL}${path}`;
    const urlObj = new URL(url);
    
    const options = {
      method: method,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      }
    };

    const req = http.request(urlObj, options, (res) => {
      let body = '';
      
      res.on('data', (chunk) => {
        body += chunk;
      });
      
      res.on('end', () => {
        try {
          const data = body ? JSON.parse(body) : null;
          resolve({
            status: res.statusCode,
            data: data,
            headers: res.headers
          });
        } catch (error) {
          resolve({
            status: res.statusCode,
            data: null,
            error: error.message
          });
        }
      });
    });

    req.on('error', (error) => {
      resolve({
        status: 500,
        data: null,
        error: error.message
      });
    });

    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

// Helper function to log test results
function logTest(category, testName, passed, details = {}) {
  const status = passed ? '✅ PASS' : '❌ FAIL';
  console.log(`${status} [${category}] ${testName}`);
  
  testResults[category].tests.push({
    name: testName,
    passed: passed,
    ...details
  });
  
  if (passed) {
    testResults[category].passed++;
  } else {
    testResults[category].failed++;
  }
}

// Verify response format
function verifyNotificationFormat(response) {
  return response && 
         response.success === true && 
         response.data && 
         response.data.preferences !== undefined;
}

function verifyCommunicationFormat(response) {
  return response && 
         response.success === true && 
         response.data && 
         response.data.preferences !== undefined;
}

function verifyPrivacyFormat(response) {
  return response && 
         response.success === true && 
         response.data && 
         response.data.settings !== undefined;
}

// ==================== AUTHENTICATION ====================

async function testAuthentication() {
  console.log('\n=== Testing Authentication ===\n');
  
  // Test 1: Login
  console.log('Test 1: POST /auth/login');
  const loginData = {
    identifier: TEST_USER_EMAIL,
    password: TEST_USER_PASSWORD
  };
  
  const loginResult = await makeRequest('POST', '/auth/login', loginData);
  
  if (loginResult.status === 200 && loginResult.data) {
    authToken = loginResult.data.token || loginResult.data.accessToken;
    userId = loginResult.data.user?.id;
    
    logTest('authentication', 'POST /auth/login', true, {
      status: loginResult.status,
      hasToken: !!authToken,
      userId: userId
    });
    
    console.log(`   Status: ${loginResult.status}`);
    console.log(`   Token: ${authToken ? authToken.substring(0, 20) + '...' : 'N/A'}`);
    console.log(`   User ID: ${userId}`);
  } else {
    logTest('authentication', 'POST /auth/login', false, {
      status: loginResult.status,
      error: loginResult.error || loginResult.data?.error
    });
    console.log(`   Status: ${loginResult.status}`);
    console.log(`   Error: ${loginResult.error || JSON.stringify(loginResult.data)}`);
    throw new Error('Authentication failed');
  }
}

// ==================== NOTIFICATION PREFERENCES ====================

async function testNotificationPreferences() {
  console.log('\n=== Testing Notification Preferences ===\n');
  
  // Test 2: GET /api/v1/profile/preferences/notifications
  console.log('Test 2: GET /api/v1/profile/preferences/notifications');
  const getNotificationsResult = await makeRequest('GET', '/profile/preferences/notifications', null, authToken);
  
  const getNotificationsPassed = getNotificationsResult.status === 200 && 
                                  verifyNotificationFormat(getNotificationsResult.data);
  
  logTest('notificationPreferences', 'GET /profile/preferences/notifications', getNotificationsPassed, {
    status: getNotificationsResult.status,
    hasData: !!getNotificationsResult.data,
    formatCorrect: verifyNotificationFormat(getNotificationsResult.data),
    response: getNotificationsResult.data
  });
  
  console.log(`   Status: ${getNotificationsResult.status}`);
  console.log(`   Format Correct: ${verifyNotificationFormat(getNotificationsResult.data)}`);
  console.log(`   Response: ${JSON.stringify(getNotificationsResult.data, null, 2)}`);
  
  // Test 3: PUT /api/v1/profile/preferences/notifications
  console.log('\nTest 3: PUT /api/v1/profile/preferences/notifications');
  const notificationUpdateData = {
    email: false,
    sms: true,
    whatsapp: false,
    marketing: true,
    newsletter: false,
    frequency: 'daily'
  };
  
  const putNotificationsResult = await makeRequest('PUT', '/profile/preferences/notifications', notificationUpdateData, authToken);
  
  const putNotificationsPassed = putNotificationsResult.status === 200 && 
                                  verifyNotificationFormat(putNotificationsResult.data);
  
  logTest('notificationPreferences', 'PUT /profile/preferences/notifications', putNotificationsPassed, {
    status: putNotificationsResult.status,
    hasData: !!putNotificationsResult.data,
    formatCorrect: verifyNotificationFormat(putNotificationsResult.data),
    noExtraMessage: !putNotificationsResult.data?.message,
    response: putNotificationsResult.data
  });
  
  console.log(`   Status: ${putNotificationsResult.status}`);
  console.log(`   Format Correct: ${verifyNotificationFormat(putNotificationsResult.data)}`);
  console.log(`   No Extra Message: ${!putNotificationsResult.data?.message}`);
  console.log(`   Response: ${JSON.stringify(putNotificationsResult.data, null, 2)}`);
  
  // Verify the update was applied
  console.log('\nTest 4: Verify notification preferences update (GET)');
  const verifyNotificationsResult = await makeRequest('GET', '/profile/preferences/notifications', null, authToken);
  
  const updateVerified = verifyNotificationsResult.status === 200 &&
                         verifyNotificationsResult.data?.data?.preferences?.email === false &&
                         verifyNotificationsResult.data?.data?.preferences?.sms === true;
  
  logTest('notificationPreferences', 'Verify notification update', updateVerified, {
    status: verifyNotificationsResult.status,
    emailUpdated: verifyNotificationsResult.data?.data?.preferences?.email === false,
    smsUpdated: verifyNotificationsResult.data?.data?.preferences?.sms === true
  });
  
  console.log(`   Status: ${verifyNotificationsResult.status}`);
  console.log(`   Update Verified: ${updateVerified}`);
}

// ==================== COMMUNICATION PREFERENCES ====================

async function testCommunicationPreferences() {
  console.log('\n=== Testing Communication Preferences ===\n');
  
  // Test 5: GET /api/v1/profile/preferences/communication
  console.log('Test 5: GET /api/v1/profile/preferences/communication');
  const getCommunicationResult = await makeRequest('GET', '/profile/preferences/communication', null, authToken);
  
  const getCommunicationPassed = getCommunicationResult.status === 200 && 
                                  verifyCommunicationFormat(getCommunicationResult.data);
  
  logTest('communicationPreferences', 'GET /profile/preferences/communication', getCommunicationPassed, {
    status: getCommunicationResult.status,
    hasData: !!getCommunicationResult.data,
    formatCorrect: verifyCommunicationFormat(getCommunicationResult.data),
    response: getCommunicationResult.data
  });
  
  console.log(`   Status: ${getCommunicationResult.status}`);
  console.log(`   Format Correct: ${verifyCommunicationFormat(getCommunicationResult.data)}`);
  console.log(`   Response: ${JSON.stringify(getCommunicationResult.data, null, 2)}`);
  
  // Test 6: PUT /api/v1/profile/preferences/communication
  console.log('\nTest 6: PUT /api/v1/profile/preferences/communication');
  const communicationUpdateData = {
    email: true,
    sms: false,
    whatsapp: false,
    marketing: true,
    newsletter: true,
    frequency: 'weekly'
  };
  
  const putCommunicationResult = await makeRequest('PUT', '/profile/preferences/communication', communicationUpdateData, authToken);
  
  const putCommunicationPassed = putCommunicationResult.status === 200 && 
                                  verifyCommunicationFormat(putCommunicationResult.data);
  
  logTest('communicationPreferences', 'PUT /profile/preferences/communication', putCommunicationPassed, {
    status: putCommunicationResult.status,
    hasData: !!putCommunicationResult.data,
    formatCorrect: verifyCommunicationFormat(putCommunicationResult.data),
    noExtraMessage: !putCommunicationResult.data?.message,
    response: putCommunicationResult.data
  });
  
  console.log(`   Status: ${putCommunicationResult.status}`);
  console.log(`   Format Correct: ${verifyCommunicationFormat(putCommunicationResult.data)}`);
  console.log(`   No Extra Message: ${!putCommunicationResult.data?.message}`);
  console.log(`   Response: ${JSON.stringify(putCommunicationResult.data, null, 2)}`);
  
  // Verify the update was applied
  console.log('\nTest 7: Verify communication preferences update (GET)');
  const verifyCommunicationResult = await makeRequest('GET', '/profile/preferences/communication', null, authToken);
  
  const updateVerified = verifyCommunicationResult.status === 200 &&
                         verifyCommunicationResult.data?.data?.preferences?.email === true &&
                         verifyCommunicationResult.data?.data?.preferences?.newsletter === true;
  
  logTest('communicationPreferences', 'Verify communication update', updateVerified, {
    status: verifyCommunicationResult.status,
    emailUpdated: verifyCommunicationResult.data?.data?.preferences?.email === true,
    newsletterUpdated: verifyCommunicationResult.data?.data?.preferences?.newsletter === true
  });
  
  console.log(`   Status: ${verifyCommunicationResult.status}`);
  console.log(`   Update Verified: ${updateVerified}`);
}

// ==================== PRIVACY SETTINGS ====================

async function testPrivacySettings() {
  console.log('\n=== Testing Privacy Settings ===\n');
  
  // Test 8: GET /api/v1/profile/preferences/privacy
  console.log('Test 8: GET /api/v1/profile/preferences/privacy');
  const getPrivacyResult = await makeRequest('GET', '/profile/preferences/privacy', null, authToken);
  
  const getPrivacyPassed = getPrivacyResult.status === 200 && 
                           verifyPrivacyFormat(getPrivacyResult.data);
  
  logTest('privacySettings', 'GET /profile/preferences/privacy', getPrivacyPassed, {
    status: getPrivacyResult.status,
    hasData: !!getPrivacyResult.data,
    formatCorrect: verifyPrivacyFormat(getPrivacyResult.data),
    response: getPrivacyResult.data
  });
  
  console.log(`   Status: ${getPrivacyResult.status}`);
  console.log(`   Format Correct: ${verifyPrivacyFormat(getPrivacyResult.data)}`);
  console.log(`   Response: ${JSON.stringify(getPrivacyResult.data, null, 2)}`);
  
  // Test 9: PUT /api/v1/profile/preferences/privacy
  console.log('\nTest 9: PUT /api/v1/profile/preferences/privacy');
  const privacyUpdateData = {
    twoFactorEnabled: true,
    dataSharingEnabled: false,
    profileVisibility: 'PUBLIC'
  };
  
  const putPrivacyResult = await makeRequest('PUT', '/profile/preferences/privacy', privacyUpdateData, authToken);
  
  const putPrivacyPassed = putPrivacyResult.status === 200 && 
                           verifyPrivacyFormat(putPrivacyResult.data);
  
  logTest('privacySettings', 'PUT /profile/preferences/privacy', putPrivacyPassed, {
    status: putPrivacyResult.status,
    hasData: !!putPrivacyResult.data,
    formatCorrect: verifyPrivacyFormat(putPrivacyResult.data),
    noExtraMessage: !putPrivacyResult.data?.message,
    response: putPrivacyResult.data
  });
  
  console.log(`   Status: ${putPrivacyResult.status}`);
  console.log(`   Format Correct: ${verifyPrivacyFormat(putPrivacyResult.data)}`);
  console.log(`   No Extra Message: ${!putPrivacyResult.data?.message}`);
  console.log(`   Response: ${JSON.stringify(putPrivacyResult.data, null, 2)}`);
  
  // Verify the update was applied
  console.log('\nTest 10: Verify privacy settings update (GET)');
  const verifyPrivacyResult = await makeRequest('GET', '/profile/preferences/privacy', null, authToken);
  
  const updateVerified = verifyPrivacyResult.status === 200 &&
                         verifyPrivacyResult.data?.data?.settings?.twoFactorEnabled === true &&
                         verifyPrivacyResult.data?.data?.settings?.dataSharingEnabled === false;
  
  logTest('privacySettings', 'Verify privacy update', updateVerified, {
    status: verifyPrivacyResult.status,
    twoFactorUpdated: verifyPrivacyResult.data?.data?.settings?.twoFactorEnabled === true,
    dataSharingUpdated: verifyPrivacyResult.data?.data?.settings?.dataSharingEnabled === false
  });
  
  console.log(`   Status: ${verifyPrivacyResult.status}`);
  console.log(`   Update Verified: ${updateVerified}`);
}

// ==================== MAIN TEST RUNNER ====================

async function runAllTests() {
  console.log('\n' + '='.repeat(70));
  console.log('  ACCOUNT SETTINGS API ENDPOINT TEST - REBUILD VERIFICATION');
  console.log('  Testing all Account Settings endpoints after rebuild');
  console.log('  Backend URL: http://localhost:3001/api/v1');
  console.log('='.repeat(70));
  
  const startTime = Date.now();
  
  try {
    // Test authentication first
    await testAuthentication();
    
    // Test all preference endpoints
    await testNotificationPreferences();
    await testCommunicationPreferences();
    await testPrivacySettings();
    
    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);
    
    // Print summary
    console.log('\n' + '='.repeat(70));
    console.log('TEST SUMMARY');
    console.log('='.repeat(70));
    
    const totalPassed = Object.values(testResults).reduce((sum, cat) => sum + cat.passed, 0);
    const totalFailed = Object.values(testResults).reduce((sum, cat) => sum + cat.failed, 0);
    const totalTests = totalPassed + totalFailed;
    
    console.log(`\nTotal Tests: ${totalTests}`);
    console.log(`Passed: ${totalPassed} ✅`);
    console.log(`Failed: ${totalFailed} ❌`);
    console.log(`Success Rate: ${totalTests > 0 ? (totalPassed / totalTests * 100).toFixed(2) + '%' : '0%'}`);
    console.log(`Duration: ${duration}s`);
    
    console.log('\n--- Category Breakdown ---');
    for (const [category, results] of Object.entries(testResults)) {
      console.log(`\n${category}:`);
      console.log(`  Passed: ${results.passed}`);
      console.log(`  Failed: ${results.failed}`);
      
      if (results.failed > 0) {
        console.log(`  Failed Tests:`);
        results.tests.filter(t => !t.passed).forEach(test => {
          console.log(`    - ${test.name}`);
          if (test.error) {
            console.log(`      Error: ${test.error}`);
          }
        });
      }
    }
    
    // Save results to file
    const fs = require('fs');
    const reportData = {
      timestamp: new Date().toISOString(),
      duration: `${duration}s`,
      summary: {
        totalTests,
        passed: totalPassed,
        failed: totalFailed,
        successRate: totalTests > 0 ? (totalPassed / totalTests * 100).toFixed(2) + '%' : '0%'
      },
      results: testResults
    };
    
    const resultsPath = './ACCOUNT_SETTINGS_REBUILD_TEST_RESULTS.json';
    fs.writeFileSync(resultsPath, JSON.stringify(reportData, null, 2));
    console.log(`\n📄 Test results saved to: ${resultsPath}`);
    
    // Generate markdown report
    const markdownReport = generateMarkdownReport(reportData);
    const markdownPath = './ACCOUNT_SETTINGS_REBUILD_TEST_REPORT.md';
    fs.writeFileSync(markdownPath, markdownReport);
    console.log(`📄 Test report saved to: ${markdownPath}`);
    
    console.log('\n' + '='.repeat(70));
    
    if (totalFailed === 0) {
      console.log('✅ ALL TESTS PASSED! Account Settings rebuild is working correctly.');
    } else {
      console.log('❌ SOME TESTS FAILED! Please review the results above.');
    }
    
    console.log('='.repeat(70) + '\n');
    
  } catch (error) {
    console.error('\n❌ Fatal error during testing:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

function generateMarkdownReport(data) {
  let report = `# Account Settings API Rebuild Test Report\n\n`;
  report += `**Generated:** ${new Date().toLocaleString()}\n`;
  report += `**Duration:** ${data.duration}\n\n`;
  
  report += `## Summary\n\n`;
  report += `| Metric | Value |\n`;
  report += `|--------|-------|\n`;
  report += `| Total Tests | ${data.summary.totalTests} |\n`;
  report += `| Passed | ${data.summary.passed} ✅ |\n`;
  report += `| Failed | ${data.summary.failed} ❌ |\n`;
  report += `| Success Rate | ${data.summary.successRate} |\n\n`;
  
  report += `## Test Results by Category\n\n`;
  
  for (const [category, results] of Object.entries(data.results)) {
    report += `### ${category}\n\n`;
    report += `| Test Name | Status | Details |\n`;
    report += `|-----------|--------|---------|\n`;
    
    for (const test of results.tests) {
      const status = test.passed ? '✅ PASS' : '❌ FAIL';
      let details = '';
      
      if (test.status !== undefined) {
        details += `Status: ${test.status}`;
      }
      if (test.formatCorrect !== undefined) {
        details += (details ? ', ' : '') + `Format: ${test.formatCorrect ? '✅' : '❌'}`;
      }
      if (test.noExtraMessage !== undefined) {
        details += (details ? ', ' : '') + `No Extra Message: ${test.noExtraMessage ? '✅' : '❌'}`;
      }
      if (test.error) {
        details += (details ? ', ' : '') + `Error: ${test.error}`;
      }
      
      report += `| ${test.name} | ${status} | ${details} |\n`;
    }
    
    report += `\n**Category Summary:** ${results.passed} passed, ${results.failed} failed\n\n`;
  }
  
  report += `## Expected Response Formats\n\n`;
  report += `### Notification Preferences\n`;
  report += `\`\`\`json\n`;
  report += `{\n`;
  report += `  "success": true,\n`;
  report += `  "data": {\n`;
  report += `    "preferences": {\n`;
  report += `      "email": boolean,\n`;
  report += `      "sms": boolean,\n`;
  report += `      "whatsapp": boolean,\n`;
  report += `      "marketing": boolean,\n`;
  report += `      "newsletter": boolean,\n`;
  report += `      "frequency": string\n`;
  report += `    }\n`;
  report += `  }\n`;
  report += `}\n`;
  report += `\`\`\`\n\n`;
  
  report += `### Communication Preferences\n`;
  report += `\`\`\`json\n`;
  report += `{\n`;
  report += `  "success": true,\n`;
  report += `  "data": {\n`;
  report += `    "preferences": {\n`;
  report += `      "email": boolean,\n`;
  report += `      "sms": boolean,\n`;
  report += `      "whatsapp": boolean,\n`;
  report += `      "marketing": boolean,\n`;
  report += `      "newsletter": boolean,\n`;
  report += `      "frequency": string\n`;
  report += `    }\n`;
  report += `  }\n`;
  report += `}\n`;
  report += `\`\`\`\n\n`;
  
  report += `### Privacy Settings\n`;
  report += `\`\`\`json\n`;
  report += `{\n`;
  report += `  "success": true,\n`;
  report += `  "data": {\n`;
  report += `    "settings": {\n`;
  report += `      "twoFactorEnabled": boolean,\n`;
  report += `      "dataSharingEnabled": boolean,\n`;
  report += `      "profileVisibility": string\n`;
  report += `    }\n`;
  report += `  }\n`;
  report += `}\n`;
  report += `\`\`\`\n\n`;
  
  report += `## API Endpoints Tested\n\n`;
  report += `| Endpoint | Method | Purpose |\n`;
  report += `|----------|--------|---------|\n`;
  report += `| /api/v1/auth/login | POST | Authenticate user |\n`;
  report += `| /api/v1/profile/preferences/notifications | GET | Get notification preferences |\n`;
  report += `| /api/v1/profile/preferences/notifications | PUT | Update notification preferences |\n`;
  report += `| /api/v1/profile/preferences/communication | GET | Get communication preferences |\n`;
  report += `| /api/v1/profile/preferences/communication | PUT | Update communication preferences |\n`;
  report += `| /api/v1/profile/preferences/privacy | GET | Get privacy settings |\n`;
  report += `| /api/v1/profile/preferences/privacy | PUT | Update privacy settings |\n\n`;
  
  return report;
}

// Run tests
runAllTests();
