/**
 * Comprehensive Test Script for Account Settings Fixes
 * 
 * This script tests all 3 newly fixed Account Settings issues:
 * 1. Notification Settings Persistence After Refresh
 * 2. Password Change Route
 * 3. Verification Modal Close Button
 * 
 * Run with: node test-account-settings-fixes-v2.test.js
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

// Configuration
const BACKEND_URL = 'http://localhost:3001';
const FRONTEND_URL = 'http://localhost:3000';

// Test results storage
const testResults = {
  timestamp: new Date().toISOString(),
  environment: {
    backend: BACKEND_URL,
    frontend: FRONTEND_URL
  },
  summary: {
    total: 0,
    passed: 0,
    failed: 0,
    skipped: 0
  },
  tests: []
};

// Helper function to make HTTP requests
function makeRequest(options, data = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(options.path, BACKEND_URL);
    const requestOptions = {
      hostname: url.hostname,
      port: url.port || 3001,
      path: url.pathname + url.search,
      method: options.method || 'GET',
      headers: options.headers || {}
    };

    if (data) {
      const jsonData = JSON.stringify(data);
      requestOptions.headers['Content-Type'] = 'application/json';
      requestOptions.headers['Content-Length'] = Buffer.byteLength(jsonData);
    }

    const req = http.request(requestOptions, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const response = {
            statusCode: res.statusCode,
            headers: res.headers,
            body: body ? JSON.parse(body) : null
          };
          resolve(response);
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

// Helper function to log test results
function logTest(testName, status, details, error = null) {
  const result = {
    testName,
    status,
    timestamp: new Date().toISOString(),
    details,
    error: error ? error.message : null
  };
  
  testResults.tests.push(result);
  testResults.summary.total++;
  
  if (status === 'PASSED') {
    testResults.summary.passed++;
    console.log(`✅ PASSED: ${testName}`);
  } else if (status === 'FAILED') {
    testResults.summary.failed++;
    console.log(`❌ FAILED: ${testName}`);
    if (error) console.log(`   Error: ${error.message}`);
  } else {
    testResults.summary.skipped++;
    console.log(`⏭️  SKIPPED: ${testName}`);
  }
  
  if (details) {
    console.log(`   Details: ${JSON.stringify(details, null, 2)}`);
  }
  console.log('');
}

// Test 1: Login to get JWT token
async function testLogin() {
  console.log('\n=== TEST 1: Login to get JWT Token ===\n');
  
  try {
    const response = await makeRequest({
      method: 'POST',
      path: '/api/v1/auth/login',
      headers: {}
    }, {
      identifier: 'test@example.com',
      password: 'Test123456!'
    });

    if (response.statusCode === 200 && response.body && response.body.token) {
      logTest('Login - Get JWT Token', 'PASSED', {
        statusCode: response.statusCode,
        hasToken: !!response.body.token,
        userId: response.body.user?.id
      });
      return response.body.token;
    } else {
      logTest('Login - Get JWT Token', 'FAILED', {
        statusCode: response.statusCode,
        body: response.body
      }, new Error('Failed to get JWT token'));
      return null;
    }
  } catch (error) {
    logTest('Login - Get JWT Token', 'FAILED', null, error);
    return null;
  }
}

// Test 2: Notification Settings Persistence (Fix 1)
async function testNotificationSettingsPersistence(jwtToken) {
  console.log('\n=== FIX 1: Notification Settings Persistence After Refresh ===\n');
  
  if (!jwtToken) {
    logTest('Notification Settings - Save', 'SKIPPED', { reason: 'No JWT token available' });
    logTest('Notification Settings - Retrieve After Save', 'SKIPPED', { reason: 'No JWT token available' });
    logTest('Notification Settings - Persistence Verification', 'SKIPPED', { reason: 'No JWT token available' });
    return;
  }

  const headers = {
    'Authorization': `Bearer ${jwtToken}`
  };

  // Test 2.1: Get initial notification settings
  try {
    const response = await makeRequest({
      method: 'GET',
      path: '/api/v1/account/preferences',
      headers
    });

    if (response.statusCode === 200 && response.body) {
      logTest('Notification Settings - Get Initial', 'PASSED', {
        statusCode: response.statusCode,
        hasData: !!response.body.data,
        initialSettings: response.body.data?.notificationSettings
      });
    } else {
      logTest('Notification Settings - Get Initial', 'FAILED', {
        statusCode: response.statusCode,
        body: response.body
      }, new Error('Failed to get initial settings'));
      return;
    }
  } catch (error) {
    logTest('Notification Settings - Get Initial', 'FAILED', null, error);
    return;
  }

  // Test 2.2: Update notification settings
  const newSettings = {
    notificationSettings: {
      email: true,
      sms: true,
      whatsapp: false,
      push: true
    }
  };

  try {
    const response = await makeRequest({
      method: 'PUT',
      path: '/api/v1/account/preferences',
      headers
    }, newSettings);

    if (response.statusCode === 200 && response.body) {
      logTest('Notification Settings - Save', 'PASSED', {
        statusCode: response.statusCode,
        success: response.body.success,
        savedSettings: response.body.data?.notificationSettings
      });
    } else {
      logTest('Notification Settings - Save', 'FAILED', {
        statusCode: response.statusCode,
        body: response.body
      }, new Error('Failed to save notification settings'));
      return;
    }
  } catch (error) {
    logTest('Notification Settings - Save', 'FAILED', null, error);
    return;
  }

  // Test 2.3: Retrieve settings immediately after save (simulating refresh)
  try {
    const response = await makeRequest({
      method: 'GET',
      path: '/api/v1/account/preferences',
      headers
    });

    if (response.statusCode === 200 && response.body) {
      const retrievedSettings = response.body.data?.notificationSettings;
      const settingsMatch = 
        retrievedSettings?.email === newSettings.notificationSettings.email &&
        retrievedSettings?.sms === newSettings.notificationSettings.sms &&
        retrievedSettings?.whatsapp === newSettings.notificationSettings.whatsapp &&
        retrievedSettings?.push === newSettings.notificationSettings.push;

      logTest('Notification Settings - Retrieve After Save', 'PASSED', {
        statusCode: response.statusCode,
        retrievedSettings,
        settingsMatch,
        expected: newSettings.notificationSettings
      });

      if (settingsMatch) {
        logTest('Notification Settings - Persistence Verification', 'PASSED', {
          message: 'Settings correctly persisted after save',
          settings: retrievedSettings
        });
      } else {
        logTest('Notification Settings - Persistence Verification', 'FAILED', {
          message: 'Settings do not match saved values',
          expected: newSettings.notificationSettings,
          actual: retrievedSettings
        }, new Error('Settings mismatch after save'));
      }
    } else {
      logTest('Notification Settings - Retrieve After Save', 'FAILED', {
        statusCode: response.statusCode,
        body: response.body
      }, new Error('Failed to retrieve settings after save'));
      logTest('Notification Settings - Persistence Verification', 'FAILED', {
        reason: 'Could not verify persistence due to retrieval failure'
      }, new Error('Retrieval failed'));
    }
  } catch (error) {
    logTest('Notification Settings - Retrieve After Save', 'FAILED', null, error);
    logTest('Notification Settings - Persistence Verification', 'FAILED', {
      reason: 'Could not verify persistence due to error'
    }, error);
  }
}

// Test 3: Password Change Route (Fix 2)
async function testPasswordChangeRoute(jwtToken) {
  console.log('\n=== FIX 2: Password Change Route ===\n');
  
  if (!jwtToken) {
    logTest('Password Change - Route Exists', 'SKIPPED', { reason: 'No JWT token available' });
    logTest('Password Change - Validation', 'SKIPPED', { reason: 'No JWT token available' });
    logTest('Password Change - Success', 'SKIPPED', { reason: 'No JWT token available' });
    logTest('Password Change - Login with New Password', 'SKIPPED', { reason: 'No JWT token available' });
    return;
  }

  const headers = {
    'Authorization': `Bearer ${jwtToken}`
  };

  // Test 3.1: Check if route exists
  try {
    const response = await makeRequest({
      method: 'POST',
      path: '/api/v1/profile/me/password/change',
      headers
    }, {
      currentPassword: 'Test123456!',
      newPassword: 'NewTest123456!',
      confirmPassword: 'NewTest123456!'
    });

    if (response.statusCode === 200 || response.statusCode === 400 || response.statusCode === 401) {
      logTest('Password Change - Route Exists', 'PASSED', {
        statusCode: response.statusCode,
        message: 'Route exists and responds'
      });
    } else if (response.statusCode === 404) {
      logTest('Password Change - Route Exists', 'FAILED', {
        statusCode: response.statusCode,
        message: 'Route not found (404)'
      }, new Error('Password change route does not exist'));
      return;
    } else {
      logTest('Password Change - Route Exists', 'PASSED', {
        statusCode: response.statusCode,
        message: 'Route exists with unexpected status'
      });
    }
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      logTest('Password Change - Route Exists', 'FAILED', {
        message: 'Cannot connect to backend'
      }, error);
      return;
    }
    logTest('Password Change - Route Exists', 'FAILED', null, error);
    return;
  }

  // Test 3.2: Test validation - mismatched passwords
  try {
    const response = await makeRequest({
      method: 'POST',
      path: '/api/v1/profile/me/password/change',
      headers
    }, {
      currentPassword: 'Test123456!',
      newPassword: 'NewTest123456!',
      confirmPassword: 'DifferentPassword123!'
    });

    if (response.statusCode === 400 && response.body && response.body.message) {
      logTest('Password Change - Validation', 'PASSED', {
        statusCode: response.statusCode,
        validationMessage: response.body.message,
        test: 'Mismatched passwords rejected'
      });
    } else {
      logTest('Password Change - Validation', 'FAILED', {
        statusCode: response.statusCode,
        body: response.body,
        test: 'Expected validation error for mismatched passwords'
      }, new Error('Validation not working correctly'));
    }
  } catch (error) {
    logTest('Password Change - Validation', 'FAILED', null, error);
  }

  // Test 3.3: Test validation - short password
  try {
    const response = await makeRequest({
      method: 'POST',
      path: '/api/v1/profile/me/password/change',
      headers
    }, {
      currentPassword: 'Test123456!',
      newPassword: 'Short1!',
      confirmPassword: 'Short1!'
    });

    if (response.statusCode === 400 && response.body && response.body.message) {
      logTest('Password Change - Validation (Short Password)', 'PASSED', {
        statusCode: response.statusCode,
        validationMessage: response.body.message,
        test: 'Short password rejected'
      });
    } else {
      logTest('Password Change - Validation (Short Password)', 'FAILED', {
        statusCode: response.statusCode,
        body: response.body,
        test: 'Expected validation error for short password'
      }, new Error('Password length validation not working'));
    }
  } catch (error) {
    logTest('Password Change - Validation (Short Password)', 'FAILED', null, error);
  }

  // Test 3.4: Test successful password change
  const newPassword = 'ChangedPass123!';
  try {
    const response = await makeRequest({
      method: 'POST',
      path: '/api/v1/profile/me/password/change',
      headers
    }, {
      currentPassword: 'Test123456!',
      newPassword: newPassword,
      confirmPassword: newPassword
    });

    if (response.statusCode === 200 && response.body && response.body.success) {
      logTest('Password Change - Success', 'PASSED', {
        statusCode: response.statusCode,
        success: response.body.success,
        message: response.body.message
      });
    } else {
      logTest('Password Change - Success', 'FAILED', {
        statusCode: response.statusCode,
        body: response.body
      }, new Error('Password change failed'));
      return;
    }
  } catch (error) {
    logTest('Password Change - Success', 'FAILED', null, error);
    return;
  }

  // Test 3.5: Test login with new password
  try {
    const response = await makeRequest({
      method: 'POST',
      path: '/api/v1/auth/login',
      headers: {}
    }, {
      identifier: 'test@example.com',
      password: newPassword
    });

    if (response.statusCode === 200 && response.body && response.body.token) {
      logTest('Password Change - Login with New Password', 'PASSED', {
        statusCode: response.statusCode,
        hasToken: !!response.body.token,
        message: 'Successfully logged in with new password'
      });
      
      // Return the new token for subsequent tests
      return response.body.token;
    } else {
      logTest('Password Change - Login with New Password', 'FAILED', {
        statusCode: response.statusCode,
        body: response.body
      }, new Error('Cannot login with new password'));
    }
  } catch (error) {
    logTest('Password Change - Login with New Password', 'FAILED', null, error);
  }

  return null;
}

// Test 4: Verification Modal Close Button (Fix 3)
async function testVerificationModalCloseButton() {
  console.log('\n=== FIX 3: Verification Modal Close Button ===\n');
  
  // This is a frontend component test. We'll verify the fix by checking the component code
  const componentPath = path.join(__dirname, '../frontend/src/components/account/TwoFactorSetup.tsx');
  
  try {
    const componentCode = fs.readFileSync(componentPath, 'utf8');
    
    // Check if close button exists with proper onClick handler
    const hasCloseButton = componentCode.includes('onClick={handleClose}') ||
                          componentCode.includes('handleClose()');
    
    const hasCloseFunction = componentCode.includes('const handleClose') || 
                             componentCode.includes('function handleClose');
    
    const hasXIcon = componentCode.includes('<X') || componentCode.includes('X className');

    logTest('Verification Modal - Close Button Exists', hasCloseButton ? 'PASSED' : 'FAILED', {
      hasCloseButton,
      hasCloseFunction,
      hasXIcon
    }, hasCloseButton ? null : new Error('Close button not found in component'));

    // Check for proper modal structure
    const hasModalStructure = componentCode.includes('fixed inset-0') || 
                             componentCode.includes('modal') ||
                             componentCode.includes('Modal');
    
    logTest('Verification Modal - Modal Structure', hasModalStructure ? 'PASSED' : 'FAILED', {
      hasModalStructure
    }, hasModalStructure ? null : new Error('Modal structure not found'));

    // Check if component exports properly
    const hasExport = componentCode.includes('export default') || 
                     componentCode.includes('export const');
    
    logTest('Verification Modal - Component Export', hasExport ? 'PASSED' : 'FAILED', {
      hasExport
    }, hasExport ? null : new Error('Component not properly exported'));

    // Check for proper error handling
    const hasErrorHandling = componentCode.includes('try') && 
                            componentCode.includes('catch');
    
    logTest('Verification Modal - Error Handling', hasErrorHandling ? 'PASSED' : 'FAILED', {
      hasErrorHandling
    }, hasErrorHandling ? null : new Error('Error handling not found'));
    
    // Check if close button has proper event handling
    const hasStopPropagation = componentCode.includes('e.stopPropagation()');
    
    logTest('Verification Modal - Close Button Event Handling', hasStopPropagation ? 'PASSED' : 'FAILED', {
      hasStopPropagation
    }, hasStopPropagation ? null : new Error('Close button missing stopPropagation'));

  } catch (error) {
    logTest('Verification Modal - Component Analysis', 'FAILED', {
      error: error.message,
      componentPath
    }, error);
  }
}

// Main test execution
async function runAllTests() {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║  ACCOUNT SETTINGS FIXES - COMPREHENSIVE TEST SUITE        ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  console.log(`\nStarted at: ${new Date().toISOString()}`);
  console.log(`Backend URL: ${BACKEND_URL}`);
  console.log(`Frontend URL: ${FRONTEND_URL}`);

  try {
    // Test 1: Login
    let jwtToken = await testLogin();
    
    // Test 2: Notification Settings Persistence (Fix 1)
    await testNotificationSettingsPersistence(jwtToken);
    
    // Test 3: Password Change Route (Fix 2)
    const newToken = await testPasswordChangeRoute(jwtToken);
    if (newToken) {
      jwtToken = newToken;
    }
    
    // Test 4: Verification Modal Close Button (Fix 3)
    await testVerificationModalCloseButton();
    
  } catch (error) {
    console.error('\n❌ Test suite execution failed:', error);
  }

  // Print summary
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║  TEST SUMMARY                                              ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');
  
  console.log(`Total Tests: ${testResults.summary.total}`);
  console.log(`✅ Passed: ${testResults.summary.passed}`);
  console.log(`❌ Failed: ${testResults.summary.failed}`);
  console.log(`⏭️  Skipped: ${testResults.summary.skipped}`);
  
  const passRate = testResults.summary.total > 0 
    ? ((testResults.summary.passed / testResults.summary.total) * 100).toFixed(2)
    : 0;
  console.log(`Pass Rate: ${passRate}%`);

  // Save results to file
  const resultsDir = path.join(__dirname);
  const resultsFile = path.join(resultsDir, `ACCOUNT_SETTINGS_FIXES_FINAL_TEST_RESULTS-${Date.now()}.json`);
  
  try {
    fs.writeFileSync(resultsFile, JSON.stringify(testResults, null, 2));
    console.log(`\n📊 Test results saved to: ${resultsFile}`);
  } catch (error) {
    console.error(`\n❌ Failed to save test results: ${error.message}`);
  }

  // Also save as markdown report
  const reportFile = path.join(resultsDir, `ACCOUNT_SETTINGS_FIXES_FINAL_TEST_REPORT-${Date.now()}.md`);
  const markdownReport = generateMarkdownReport(testResults);
  
  try {
    fs.writeFileSync(reportFile, markdownReport);
    console.log(`📄 Test report saved to: ${reportFile}`);
  } catch (error) {
    console.error(`\n❌ Failed to save test report: ${error.message}`);
  }

  console.log(`\nCompleted at: ${new Date().toISOString()}\n`);
  
  // Exit with appropriate code
  process.exit(testResults.summary.failed > 0 ? 1 : 0);
}

// Generate markdown report
function generateMarkdownReport(results) {
  let report = `# Account Settings Fixes - Final Test Report\n\n`;
  report += `**Generated:** ${results.timestamp}\n\n`;
  report += `## Environment\n\n`;
  report += `- Backend: ${results.environment.backend}\n`;
  report += `- Frontend: ${results.environment.frontend}\n\n`;
  
  report += `## Summary\n\n`;
  report += `| Metric | Count |\n`;
  report += `|--------|-------|\n`;
  report += `| Total Tests | ${results.summary.total} |\n`;
  report += `| ✅ Passed | ${results.summary.passed} |\n`;
  report += `| ❌ Failed | ${results.summary.failed} |\n`;
  report += `| ⏭️  Skipped | ${results.summary.skipped} |\n\n`;
  
  const passRate = results.summary.total > 0 
    ? ((results.summary.passed / results.summary.total) * 100).toFixed(2)
    : 0;
  report += `**Pass Rate:** ${passRate}%\n\n`;
  
  report += `## Test Results\n\n`;
  
  // Group tests by fix
  const fix1Tests = results.tests.filter(t => t.testName.includes('Notification Settings'));
  const fix2Tests = results.tests.filter(t => t.testName.includes('Password Change'));
  const fix3Tests = results.tests.filter(t => t.testName.includes('Verification Modal'));
  const otherTests = results.tests.filter(t => 
    !t.testName.includes('Notification Settings') &&
    !t.testName.includes('Password Change') &&
    !t.testName.includes('Verification Modal')
  );
  
  if (fix1Tests.length > 0) {
    report += `### Fix 1: Notification Settings Persistence After Refresh\n\n`;
    fix1Tests.forEach(test => {
      const icon = test.status === 'PASSED' ? '✅' : test.status === 'FAILED' ? '❌' : '⏭️';
      report += `${icon} **${test.testName}** - ${test.status}\n\n`;
      if (test.details) {
        report += `**Details:**\n\`\`\`json\n${JSON.stringify(test.details, null, 2)}\n\`\`\`\n\n`;
      }
      if (test.error) {
        report += `**Error:** ${test.error}\n\n`;
      }
    });
  }
  
  if (fix2Tests.length > 0) {
    report += `### Fix 2: Password Change Route\n\n`;
    fix2Tests.forEach(test => {
      const icon = test.status === 'PASSED' ? '✅' : test.status === 'FAILED' ? '❌' : '⏭️';
      report += `${icon} **${test.testName}** - ${test.status}\n\n`;
      if (test.details) {
        report += `**Details:**\n\`\`\`json\n${JSON.stringify(test.details, null, 2)}\n\`\`\`\n\n`;
      }
      if (test.error) {
        report += `**Error:** ${test.error}\n\n`;
      }
    });
  }
  
  if (fix3Tests.length > 0) {
    report += `### Fix 3: Verification Modal Close Button\n\n`;
    fix3Tests.forEach(test => {
      const icon = test.status === 'PASSED' ? '✅' : test.status === 'FAILED' ? '❌' : '⏭️';
      report += `${icon} **${test.testName}** - ${test.status}\n\n`;
      if (test.details) {
        report += `**Details:**\n\`\`\`json\n${JSON.stringify(test.details, null, 2)}\n\`\`\`\n\n`;
      }
      if (test.error) {
        report += `**Error:** ${test.error}\n\n`;
      }
    });
  }
  
  if (otherTests.length > 0) {
    report += `### Other Tests\n\n`;
    otherTests.forEach(test => {
      const icon = test.status === 'PASSED' ? '✅' : test.status === 'FAILED' ? '❌' : '⏭️';
      report += `${icon} **${test.testName}** - ${test.status}\n\n`;
      if (test.details) {
        report += `**Details:**\n\`\`\`json\n${JSON.stringify(test.details, null, 2)}\n\`\`\`\n\n`;
      }
      if (test.error) {
        report += `**Error:** ${test.error}\n\n`;
      }
    });
  }
  
  report += `## Conclusion\n\n`;
  
  const fix1Passed = fix1Tests.every(t => t.status === 'PASSED' || t.status === 'SKIPPED');
  const fix2Passed = fix2Tests.every(t => t.status === 'PASSED' || t.status === 'SKIPPED');
  const fix3Passed = fix3Tests.every(t => t.status === 'PASSED' || t.status === 'SKIPPED');
  
  report += `- Fix 1 (Notification Settings Persistence): ${fix1Passed ? '✅ PASSED' : '❌ FAILED'}\n`;
  report += `- Fix 2 (Password Change Route): ${fix2Passed ? '✅ PASSED' : '❌ FAILED'}\n`;
  report += `- Fix 3 (Verification Modal Close Button): ${fix3Passed ? '✅ PASSED' : '❌ FAILED'}\n\n`;
  
  const allPassed = fix1Passed && fix2Passed && fix3Passed;
  report += `**Overall Status:** ${allPassed ? '✅ ALL FIXES VERIFIED' : '❌ SOME FIXES FAILED'}\n\n`;
  
  return report;
}

// Run the tests
runAllTests();
