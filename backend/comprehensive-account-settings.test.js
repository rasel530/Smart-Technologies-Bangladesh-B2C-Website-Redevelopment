/**
 * Comprehensive Account Settings API Endpoint Test Script
 * Tests all 11 Account Settings endpoints after fixes
 * 
 * Endpoints to test:
 * 1. GET /api/v1/profile/preferences/notifications
 * 2. PUT /api/v1/profile/preferences/notifications
 * 3. GET /api/v1/profile/preferences/communication
 * 4. PUT /api/v1/profile/preferences/communication
 * 5. GET /api/v1/profile/preferences/privacy
 * 6. PUT /api/v1/profile/preferences/privacy
 * 7. GET /api/v1/profile/data/export
 * 8. GET /api/v1/profile/account/deletion/status
 * 9. POST /api/v1/profile/2fa/enable
 * 10. POST /api/v1/profile/2fa/disable
 * 11. GET /api/v1/profile/2fa/status
 */

const http = require('http');

// Test configuration
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3001/api/v1';
const TEST_USER_EMAIL = 'testuser@example.com';
const TEST_USER_PASSWORD = 'K7#mP$2xQw9!vR';
let authToken = null;
let userId = null;

// Test results storage
const testResults = {
  total: 0,
  passed: 0,
  failed: 0,
  tests: []
};

// Helper function to log test results
function logTest(category, testName, passed, response = null, error = null) {
  const status = passed ? '✅ PASS' : '❌ FAIL';
  console.log(`${status} [${category}] ${testName}`);
  
  testResults.total++;
  if (passed) {
    testResults.passed++;
  } else {
    testResults.failed++;
  }
  
  testResults.tests.push({
    category,
    testName,
    passed,
    status: passed ? 'PASS' : 'FAIL',
    response: response ? {
      status: response.status,
      data: response.data
    } : null,
    error: error ? error.message || error : null
  });
}

// Helper function to make HTTP request
async function makeRequest(method, path, data = null, token = null) {
  const url = `${API_BASE_URL}${path}`;
  
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || 3001,
      path: urlObj.pathname + urlObj.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      }
    };

    const req = http.request(options, (res) => {
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
            data: body,
            error: error.message
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

// Helper function to register test user
async function registerTestUser() {
  console.log('\n=== Registering test user ===');
  
  const registerData = {
    email: TEST_USER_EMAIL,
    password: TEST_USER_PASSWORD,
    confirmPassword: TEST_USER_PASSWORD,
    firstName: 'Test',
    lastName: 'User',
    phone: '+8801712345678'
  };

  const result = await makeRequest('POST', '/auth/register', registerData);
  
  if (result.status === 201 || result.status === 200) {
    userId = result.data.user?.id || result.data.id;
    console.log(`✅ Test user registered: ${TEST_USER_EMAIL}`);
    console.log(`   User ID: ${userId}`);
    return result.data;
  } else if (result.status === 409) {
    console.log(`ℹ️  Test user already exists: ${TEST_USER_EMAIL}`);
    return null;
  } else {
    console.error(`❌ Failed to register test user: ${result.status}`);
    console.error(`   Error: ${JSON.stringify(result.data || result.error)}`);
    throw new Error(`Failed to register test user: ${result.status}`);
  }
}

// Helper function to login test user
async function loginTestUser() {
  console.log('\n=== Logging in test user ===');
  
  const loginData = {
    identifier: TEST_USER_EMAIL,
    password: TEST_USER_PASSWORD
  };

  const result = await makeRequest('POST', '/auth/login', loginData);
  
  if (result.status === 200 || result.status === 201) {
    const authData = result.data;
    authToken = authData.token || authData.accessToken || authData.data?.token;
    userId = authData.user?.id || authData.data?.user?.id || userId;
    console.log(`✅ Test user logged in: ${TEST_USER_EMAIL}`);
    console.log(`   User ID: ${userId}`);
    console.log(`   Token: ${authToken ? authToken.substring(0, 20) + '...' : 'N/A'}`);
    return authToken;
  } else {
    console.error(`❌ Failed to login test user: ${result.status}`);
    console.error(`   Error: ${JSON.stringify(result.data || result.error)}`);
    throw new Error(`Failed to login test user: ${result.status}`);
  }
}

// ==================== PREFERENCE ROUTES (6 endpoints) ====================

async function testNotificationPreferences() {
  console.log('\n=== Testing Notification Preferences ===');
  
  // Test 1: GET /api/v1/profile/preferences/notifications
  console.log('\nTest 1: GET /api/v1/profile/preferences/notifications');
  const getResult = await makeRequest('GET', '/profile/preferences/notifications', null, authToken);
  
  if (getResult.status === 200) {
    // Verify response format: should have data.preferences (not data.settings)
    const hasCorrectFormat = getResult.data &&
                            (getResult.data.preferences !== undefined ||
                             getResult.data.data?.preferences !== undefined);
    
    if (hasCorrectFormat) {
      logTest('Notification Preferences', 'GET /api/v1/profile/preferences/notifications', true, getResult);
      console.log('   Response format: ✅ Correct (data.preferences)');
      console.log('   Response:', JSON.stringify(getResult.data, null, 2));
    } else {
      logTest('Notification Preferences', 'GET /api/v1/profile/preferences/notifications', false, getResult, new Error('Incorrect response format - expected data.preferences'));
      console.log('   Response format: ❌ Incorrect');
      console.log('   Response:', JSON.stringify(getResult.data, null, 2));
    }
  } else {
    logTest('Notification Preferences', 'GET /api/v1/profile/preferences/notifications', false, getResult, new Error(`Status ${getResult.status}`));
    console.log('   Error:', JSON.stringify(getResult.data || getResult.error));
  }

  // Test 2: PUT /api/v1/profile/preferences/notifications
  const updateData = {
    email: false,
    sms: true,
    whatsapp: false,
    marketing: true,
    newsletter: false,
    frequency: 'daily'
  };
  
  console.log('\nTest 2: PUT /api/v1/profile/preferences/notifications');
  const putResult = await makeRequest('PUT', '/profile/preferences/notifications', updateData, authToken);
  
  if (putResult.status === 200) {
    // Verify response format: should have data.preferences (not data.settings)
    const hasCorrectFormat = putResult.data &&
                            (putResult.data.preferences !== undefined ||
                             putResult.data.data?.preferences !== undefined);
    
    if (hasCorrectFormat) {
      logTest('Notification Preferences', 'PUT /api/v1/profile/preferences/notifications', true, putResult);
      console.log('   Response format: ✅ Correct (data.preferences)');
      console.log('   Response:', JSON.stringify(putResult.data, null, 2));
    } else {
      logTest('Notification Preferences', 'PUT /api/v1/profile/preferences/notifications', false, putResult, new Error('Incorrect response format - expected data.preferences'));
      console.log('   Response format: ❌ Incorrect');
      console.log('   Response:', JSON.stringify(putResult.data, null, 2));
    }
  } else {
    logTest('Notification Preferences', 'PUT /api/v1/profile/preferences/notifications', false, putResult, new Error(`Status ${putResult.status}`));
    console.log('   Error:', JSON.stringify(putResult.data || putResult.error));
  }
}

async function testCommunicationPreferences() {
  console.log('\n=== Testing Communication Preferences ===');
  
  // Test 3: GET /api/v1/profile/preferences/communication
  console.log('\nTest 3: GET /api/v1/profile/preferences/communication');
  const getResult = await makeRequest('GET', '/profile/preferences/communication', null, authToken);
  
  if (getResult.status === 200) {
    // Verify response format: should have data.preferences (not data.settings)
    const hasCorrectFormat = getResult.data &&
                            (getResult.data.preferences !== undefined ||
                             getResult.data.data?.preferences !== undefined);
    
    if (hasCorrectFormat) {
      logTest('Communication Preferences', 'GET /api/v1/profile/preferences/communication', true, getResult);
      console.log('   Response format: ✅ Correct (data.preferences)');
      console.log('   Response:', JSON.stringify(getResult.data, null, 2));
    } else {
      logTest('Communication Preferences', 'GET /api/v1/profile/preferences/communication', false, getResult, new Error('Incorrect response format - expected data.preferences'));
      console.log('   Response format: ❌ Incorrect');
      console.log('   Response:', JSON.stringify(getResult.data, null, 2));
    }
  } else {
    logTest('Communication Preferences', 'GET /api/v1/profile/preferences/communication', false, getResult, new Error(`Status ${getResult.status}`));
    console.log('   Error:', JSON.stringify(getResult.data || getResult.error));
  }

  // Test 4: PUT /api/v1/profile/preferences/communication
  const updateData = {
    email: true,
    sms: false,
    whatsapp: false,
    marketing: true,
    newsletter: true,
    frequency: 'weekly'
  };
  
  console.log('\nTest 4: PUT /api/v1/profile/preferences/communication');
  const putResult = await makeRequest('PUT', '/profile/preferences/communication', updateData, authToken);
  
  if (putResult.status === 200) {
    // Verify response format: should have data.preferences (not data.settings)
    const hasCorrectFormat = putResult.data &&
                            (putResult.data.preferences !== undefined ||
                             putResult.data.data?.preferences !== undefined);
    
    if (hasCorrectFormat) {
      logTest('Communication Preferences', 'PUT /api/v1/profile/preferences/communication', true, putResult);
      console.log('   Response format: ✅ Correct (data.preferences)');
      console.log('   Response:', JSON.stringify(putResult.data, null, 2));
    } else {
      logTest('Communication Preferences', 'PUT /api/v1/profile/preferences/communication', false, putResult, new Error('Incorrect response format - expected data.preferences'));
      console.log('   Response format: ❌ Incorrect');
      console.log('   Response:', JSON.stringify(putResult.data, null, 2));
    }
  } else {
    logTest('Communication Preferences', 'PUT /api/v1/profile/preferences/communication', false, putResult, new Error(`Status ${putResult.status}`));
    console.log('   Error:', JSON.stringify(putResult.data || putResult.error));
  }
}

async function testPrivacySettings() {
  console.log('\n=== Testing Privacy Settings ===');
  
  // Test 5: GET /api/v1/profile/preferences/privacy
  console.log('\nTest 5: GET /api/v1/profile/preferences/privacy');
  const getResult = await makeRequest('GET', '/profile/preferences/privacy', null, authToken);
  
  if (getResult.status === 200) {
    // Verify response format: should have data.settings
    const hasCorrectFormat = getResult.data && 
                            (getResult.data.settings !== undefined || 
                             getResult.data.data?.settings !== undefined);
    
    if (hasCorrectFormat) {
      logTest('Privacy Settings', 'GET /api/v1/profile/preferences/privacy', true, getResult);
      console.log('   Response format: ✅ Correct (data.settings)');
      console.log('   Response:', JSON.stringify(getResult.data, null, 2));
    } else {
      logTest('Privacy Settings', 'GET /api/v1/profile/preferences/privacy', false, getResult, new Error('Incorrect response format - expected data.settings'));
      console.log('   Response format: ❌ Incorrect');
      console.log('   Response:', JSON.stringify(getResult.data, null, 2));
    }
  } else {
    logTest('Privacy Settings', 'GET /api/v1/profile/preferences/privacy', false, getResult, new Error(`Status ${getResult.status}`));
    console.log('   Error:', JSON.stringify(getResult.data || getResult.error));
  }

  // Test 6: PUT /api/v1/profile/preferences/privacy
  const updateData = {
    twoFactorEnabled: true,
    dataSharingEnabled: false,
    profileVisibility: 'PUBLIC' // Must be uppercase as per validation
  };
  
  console.log('\nTest 6: PUT /api/v1/profile/preferences/privacy');
  const putResult = await makeRequest('PUT', '/profile/preferences/privacy', updateData, authToken);
  
  if (putResult.status === 200) {
    // Verify response format: should have data.settings
    const hasCorrectFormat = putResult.data && 
                            (putResult.data.settings !== undefined || 
                             putResult.data.data?.settings !== undefined);
    
    if (hasCorrectFormat) {
      logTest('Privacy Settings', 'PUT /api/v1/profile/preferences/privacy', true, putResult);
      console.log('   Response format: ✅ Correct (data.settings)');
      console.log('   Response:', JSON.stringify(putResult.data, null, 2));
    } else {
      logTest('Privacy Settings', 'PUT /api/v1/profile/preferences/privacy', false, putResult, new Error('Incorrect response format - expected data.settings'));
      console.log('   Response format: ❌ Incorrect');
      console.log('   Response:', JSON.stringify(putResult.data, null, 2));
    }
  } else {
    logTest('Privacy Settings', 'PUT /api/v1/profile/preferences/privacy', false, putResult, new Error(`Status ${putResult.status}`));
    console.log('   Error:', JSON.stringify(putResult.data || putResult.error));
  }
}

// ==================== DATA EXPORT ROUTES (1 endpoint) ====================

async function testDataExport() {
  console.log('\n=== Testing Data Export ===');
  
  // Test 7: GET /api/v1/profile/data/export
  console.log('\nTest 7: GET /api/v1/profile/data/export');
  const getResult = await makeRequest('GET', '/profile/data/export', null, authToken);
  
  if (getResult.status === 200) {
    logTest('Data Export', 'GET /api/v1/profile/data/export', true, getResult);
    console.log('   Response:', JSON.stringify(getResult.data, null, 2));
  } else {
    logTest('Data Export', 'GET /api/v1/profile/data/export', false, getResult, new Error(`Status ${getResult.status}`));
    console.log('   Error:', JSON.stringify(getResult.data || getResult.error));
  }
}

// ==================== ACCOUNT MANAGEMENT ROUTES (1 endpoint) ====================

async function testAccountDeletionStatus() {
  console.log('\n=== Testing Account Deletion Status ===');
  
  // Test 8: GET /api/v1/profile/account/deletion/status
  console.log('\nTest 8: GET /api/v1/profile/account/deletion/status');
  const getResult = await makeRequest('GET', '/profile/account/deletion/status', null, authToken);
  
  if (getResult.status === 200) {
    logTest('Account Management', 'GET /api/v1/profile/account/deletion/status', true, getResult);
    console.log('   Response:', JSON.stringify(getResult.data, null, 2));
  } else {
    logTest('Account Management', 'GET /api/v1/profile/account/deletion/status', false, getResult, new Error(`Status ${getResult.status}`));
    console.log('   Error:', JSON.stringify(getResult.data || getResult.error));
  }
}

// ==================== 2FA ROUTES (3 endpoints) ====================

async function testTwoFactorAuth() {
  console.log('\n=== Testing Two-Factor Authentication ===');
  
  // Test 9: POST /api/v1/profile/account/2fa/enable
  console.log('\nTest 9: POST /api/v1/profile/account/2fa/enable');
  const enableResult = await makeRequest('POST', '/profile/account/2fa/enable', null, authToken);
  
  if (enableResult.status === 200) {
    logTest('2FA', 'POST /api/v1/profile/account/2fa/enable', true, enableResult);
    console.log('   Response:', JSON.stringify(enableResult.data, null, 2));
  } else {
    logTest('2FA', 'POST /api/v1/profile/account/2fa/enable', false, enableResult, new Error(`Status ${enableResult.status}`));
    console.log('   Error:', JSON.stringify(enableResult.data || enableResult.error));
  }

  // Test 10: GET /api/v1/profile/account/2fa/status
  console.log('\nTest 10: GET /api/v1/profile/account/2fa/status');
  const statusResult = await makeRequest('GET', '/profile/account/2fa/status', null, authToken);
  
  if (statusResult.status === 200) {
    logTest('2FA', 'GET /api/v1/profile/account/2fa/status', true, statusResult);
    console.log('   Response:', JSON.stringify(statusResult.data, null, 2));
  } else {
    logTest('2FA', 'GET /api/v1/profile/account/2fa/status', false, statusResult, new Error(`Status ${statusResult.status}`));
    console.log('   Error:', JSON.stringify(statusResult.data || statusResult.error));
  }

  // Test 11: POST /api/v1/profile/account/2fa/disable
  console.log('\nTest 11: POST /api/v1/profile/account/2fa/disable');
  const disableResult = await makeRequest('POST', '/profile/account/2fa/disable', null, authToken);
  
  if (disableResult.status === 200) {
    logTest('2FA', 'POST /api/v1/profile/account/2fa/disable', true, disableResult);
    console.log('   Response:', JSON.stringify(disableResult.data, null, 2));
  } else {
    logTest('2FA', 'POST /api/v1/profile/account/2fa/disable', false, disableResult, new Error(`Status ${disableResult.status}`));
    console.log('   Error:', JSON.stringify(disableResult.data || disableResult.error));
  }
}

// ==================== MAIN TEST RUNNER ====================

async function runAllTests() {
  console.log('\n' + '='.repeat(70));
  console.log('  COMPREHENSIVE ACCOUNT SETTINGS API TEST');
  console.log('  Testing all 11 Account Settings endpoints after fixes');
  console.log('='.repeat(70));
  console.log(`\nAPI Base URL: ${API_BASE_URL}`);
  console.log(`Test User: ${TEST_USER_EMAIL}`);
  
  try {
    // Register test user (may already exist)
    await registerTestUser();
    
    // Login test user
    await loginTestUser();
    
    if (!authToken) {
      throw new Error('Failed to obtain authentication token');
    }
    
    // Run all tests
    console.log('\n' + '='.repeat(70));
    console.log('  RUNNING TESTS');
    console.log('='.repeat(70));
    
    await testNotificationPreferences();
    await testCommunicationPreferences();
    await testPrivacySettings();
    await testDataExport();
    await testAccountDeletionStatus();
    await testTwoFactorAuth();
    
    // Print summary
    console.log('\n' + '='.repeat(70));
    console.log('  TEST SUMMARY');
    console.log('='.repeat(70));
    console.log(`Total Tests: ${testResults.total}`);
    console.log(`Passed: ${testResults.passed} ✅`);
    console.log(`Failed: ${testResults.failed} ❌`);
    console.log(`Success Rate: ${testResults.total > 0 ? (testResults.passed / testResults.total * 100).toFixed(2) + '%' : '0%'}`);
    
    // Print detailed results by category
    console.log('\n' + '='.repeat(70));
    console.log('  DETAILED RESULTS BY CATEGORY');
    console.log('='.repeat(70));
    
    const categories = {};
    testResults.tests.forEach(test => {
      if (!categories[test.category]) {
        categories[test.category] = { passed: 0, failed: 0, tests: [] };
      }
      if (test.passed) {
        categories[test.category].passed++;
      } else {
        categories[test.category].failed++;
      }
      categories[test.category].tests.push(test);
    });
    
    Object.keys(categories).forEach(category => {
      console.log(`\n${category}:`);
      console.log(`  Passed: ${categories[category].passed}/${categories[category].tests.length}`);
      categories[category].tests.forEach(test => {
        const status = test.passed ? '✅' : '❌';
        console.log(`  ${status} ${test.testName}`);
        if (!test.passed && test.error) {
          console.log(`     Error: ${test.error}`);
        }
      });
    });
    
    // Save results to JSON file
    const fs = require('fs');
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const resultsPath = `./account-settings-comprehensive-test-results-${timestamp}.json`;
    fs.writeFileSync(resultsPath, JSON.stringify({
      summary: {
        total: testResults.total,
        passed: testResults.passed,
        failed: testResults.failed,
        successRate: testResults.total > 0 ? (testResults.passed / testResults.total * 100).toFixed(2) + '%' : '0%'
      },
      tests: testResults.tests
    }, null, 2));
    console.log(`\n📄 Test results saved to: ${resultsPath}`);
    
    // Generate markdown report
    const reportPath = `./ACCOUNT_SETTINGS_COMPREHENSIVE_TEST_REPORT-${timestamp}.md`;
    const reportContent = generateMarkdownReport(testResults, categories);
    fs.writeFileSync(reportPath, reportContent);
    console.log(`📄 Test report saved to: ${reportPath}`);
    
    // Exit with appropriate code
    if (testResults.failed > 0) {
      console.log('\n⚠️  Some tests failed. Please review the results above.');
      process.exit(1);
    } else {
      console.log('\n✅ All tests passed successfully!');
      process.exit(0);
    }
    
  } catch (error) {
    console.error('\n❌ Fatal error during testing:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

function generateMarkdownReport(results, categories) {
  const timestamp = new Date().toISOString();
  
  let report = `# Account Settings Comprehensive Test Report\n\n`;
  report += `**Generated:** ${timestamp}\n\n`;
  report += `## Test Summary\n\n`;
  report += `- **Total Tests:** ${results.total}\n`;
  report += `- **Passed:** ${results.passed} ✅\n`;
  report += `- **Failed:** ${results.failed} ❌\n`;
  report += `- **Success Rate:** ${results.total > 0 ? (results.passed / results.total * 100).toFixed(2) + '%' : '0%'}\n\n`;
  
  report += `## Endpoints Tested\n\n`;
  report += `### Preference Routes (6 endpoints)\n`;
  report += `1. GET /api/v1/profile/preferences/notifications\n`;
  report += `2. PUT /api/v1/profile/preferences/notifications\n`;
  report += `3. GET /api/v1/profile/preferences/communication\n`;
  report += `4. PUT /api/v1/profile/preferences/communication\n`;
  report += `5. GET /api/v1/profile/preferences/privacy\n`;
  report += `6. PUT /api/v1/profile/preferences/privacy\n\n`;
  
  report += `### Data Export Routes (1 endpoint)\n`;
  report += `7. GET /api/v1/profile/data/export\n\n`;
  
  report += `### Account Management Routes (1 endpoint)\n`;
  report += `8. GET /api/v1/profile/account/deletion/status\n\n`;
  
  report += `### 2FA Routes (3 endpoints)\n`;
  report += `9. POST /api/v1/profile/account/2fa/enable\n`;
  report += `10. GET /api/v1/profile/account/2fa/status\n`;
  report += `11. POST /api/v1/profile/account/2fa/disable\n\n`;
  
  report += `## Detailed Results\n\n`;
  
  Object.keys(categories).forEach(category => {
    report += `### ${category}\n\n`;
    report += `| Test Name | Status | Details |\n`;
    report += `|-----------|--------|---------|\n`;
    
    categories[category].tests.forEach(test => {
      const status = test.passed ? '✅ PASS' : '❌ FAIL';
      let details = '';
      if (test.response) {
        details = `Status: ${test.response.status}`;
        if (test.response.data) {
          details += ` | Data: ${JSON.stringify(test.response.data).substring(0, 100)}...`;
        }
      }
      if (test.error) {
        details += ` | Error: ${test.error}`;
      }
      report += `| ${test.testName} | ${status} | ${details} |\n`;
    });
    
    report += `\n`;
  });
  
  if (results.failed > 0) {
    report += `## Issues Found\n\n`;
    results.tests.filter(t => !t.passed).forEach(test => {
      report += `### ${test.testName}\n`;
      report += `- **Category:** ${test.category}\n`;
      report += `- **Error:** ${test.error}\n`;
      if (test.response) {
        report += `- **Response Status:** ${test.response.status}\n`;
        if (test.response.data) {
          report += `- **Response Data:** \`${JSON.stringify(test.response.data)}\`\n`;
        }
      }
      report += `\n`;
    });
  } else {
    report += `## ✅ All Tests Passed\n\n`;
    report += `All 11 Account Settings endpoints are working correctly with proper response formats.\n\n`;
  }
  
  return report;
}

// Run tests
runAllTests();
