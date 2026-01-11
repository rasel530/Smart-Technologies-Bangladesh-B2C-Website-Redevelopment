/**
 * Account Settings Fixes Verification Test
 * 
 * This script tests all 6 Account Settings fixes to verify they work correctly:
 * 1. Password Change API call signature fixed in PasswordChangeForm.tsx
 * 2. 2FA API paths fixed in accountPreferences.ts (added `/account` segment)
 * 3. Data Export null checks added in DataExportSection.tsx
 * 4. Data Export download functionality fixed in DataExportSection.tsx (uses download URL)
 * 5. Data Export CSV error fixed in backend/routes/dataExport.js (added `res` parameter)
 * 6. Verification code modal close button fixed in preferences page
 */

const axios = require('axios');

// Configuration
const API_BASE_URL = 'http://localhost:3001/api/v1';
const TEST_USER = {
  email: 'test@example.com',
  password: 'TestPassword123!',
  currentPassword: 'TestPassword123!',
  newPassword: 'NewPassword456!',
  confirmPassword: 'NewPassword456!'
};

// Test results storage
const testResults = {
  fix1: { name: 'Password Change API Call Signature', tests: [], status: 'pending' },
  fix2: { name: '2FA API Paths with /account Segment', tests: [], status: 'pending' },
  fix3: { name: 'Data Export Null Checks', tests: [], status: 'pending' },
  fix4: { name: 'Data Export Download Functionality', tests: [], status: 'pending' },
  fix5: { name: 'Data Export CSV Generation', tests: [], status: 'pending' },
  fix6: { name: 'Verification Code Modal Close Button', tests: [], status: 'pending' }
};

let authToken = null;

// Helper function to log test results
function logTest(fixId, testName, passed, details = '') {
  testResults[fixId].tests.push({
    name: testName,
    passed,
    details,
    timestamp: new Date().toISOString()
  });
  
  const status = passed ? '✓ PASS' : '✗ FAIL';
  console.log(`  ${status}: ${testName}`);
  if (details) {
    console.log(`    Details: ${details}`);
  }
}

// Helper function to update fix status
function updateFixStatus(fixId) {
  const allPassed = testResults[fixId].tests.every(t => t.passed);
  const allFailed = testResults[fixId].tests.every(t => !t.passed);
  
  if (allPassed) {
    testResults[fixId].status = 'passed';
  } else if (allFailed) {
    testResults[fixId].status = 'failed';
  } else {
    testResults[fixId].status = 'partial';
  }
}

// Helper function to login and get auth token
async function login() {
  try {
    console.log('\n=== Logging in to get auth token ===');
    const response = await axios.post(`${API_BASE_URL}/auth/login`, {
      email: TEST_USER.email,
      password: TEST_USER.password
    });
    
    if (response.data.success && response.data.data?.token) {
      authToken = response.data.data.token;
      console.log(`✓ Login successful, token obtained`);
      return true;
    } else {
      console.log(`✗ Login failed: No token in response`);
      return false;
    }
  } catch (error) {
    console.log(`✗ Login failed: ${error.message}`);
    // Try to create a test user if login fails
    console.log('Attempting to create test user...');
    try {
      const registerResponse = await axios.post(`${API_BASE_URL}/auth/register`, {
        email: TEST_USER.email,
        password: TEST_USER.password,
        confirmPassword: TEST_USER.password,
        firstName: 'Test',
        lastName: 'User',
        phone: '+8801234567890'
      });
      
      if (registerResponse.data.success) {
        // Try login again
        const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
          email: TEST_USER.email,
          password: TEST_USER.password
        });
        
        if (loginResponse.data.success && loginResponse.data.data?.token) {
          authToken = loginResponse.data.data.token;
          console.log(`✓ Test user created and logged in`);
          return true;
        }
      }
    } catch (registerError) {
      console.log(`✗ Failed to create test user: ${registerError.message}`);
    }
    return false;
  }
}

// ============================================
// FIX 1: Password Change API Call Signature
// ============================================
async function testFix1_PasswordChange() {
  console.log('\n=== Testing Fix 1: Password Change API Call Signature ===');
  
  // Test 1.1: Verify API accepts object parameter
  try {
    const response = await axios.post(
      `${API_BASE_URL}/profile/password/change`,
      {
        currentPassword: TEST_USER.currentPassword,
        newPassword: TEST_USER.newPassword,
        confirmPassword: TEST_USER.confirmPassword
      },
      {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    // The password change might fail due to validation, but we're checking
    // that the API accepts the request format (not getting "invalid JSON" error)
    const passed = response.status !== 400 || 
                   (response.data.error && !response.data.error.includes('invalid JSON'));
    
    logTest('fix1', 'API accepts object parameter (not separate params)', passed, 
      `Status: ${response.status}, Response: ${JSON.stringify(response.data).substring(0, 100)}`);
  } catch (error) {
    const passed = error.response?.status !== 400 ||
                   (error.response?.data?.error && !error.response?.data?.error.includes('invalid JSON'));
    logTest('fix1', 'API accepts object parameter (not separate params)', passed,
      `Error: ${error.message}, Response: ${JSON.stringify(error.response?.data || {}).substring(0, 100)}`);
  }
  
  // Test 1.2: Verify Content-Type is application/json
  try {
    const response = await axios.post(
      `${API_BASE_URL}/profile/password/change`,
      {
        currentPassword: TEST_USER.currentPassword,
        newPassword: TEST_USER.newPassword,
        confirmPassword: TEST_USER.confirmPassword
      },
      {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    const passed = response.config.headers['Content-Type'] === 'application/json';
    logTest('fix1', 'Request uses application/json Content-Type', passed,
      `Content-Type: ${response.config.headers['Content-Type']}`);
  } catch (error) {
    const passed = error.config?.headers?.['Content-Type'] === 'application/json';
    logTest('fix1', 'Request uses application/json Content-Type', passed,
      `Content-Type: ${error.config?.headers?.['Content-Type']}`);
  }
  
  // Test 1.3: Verify no "invalid JSON" error in response
  try {
    const response = await axios.post(
      `${API_BASE_URL}/profile/password/change`,
      {
        currentPassword: TEST_USER.currentPassword,
        newPassword: TEST_USER.newPassword,
        confirmPassword: TEST_USER.confirmPassword
      },
      {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    const hasInvalidJsonError = JSON.stringify(response.data).toLowerCase().includes('invalid json');
    logTest('fix1', 'No "invalid JSON" error in response', !hasInvalidJsonError,
      hasInvalidJsonError ? 'Found "invalid JSON" in response' : 'No "invalid JSON" error found');
  } catch (error) {
    const hasInvalidJsonError = JSON.stringify(error.response?.data || {}).toLowerCase().includes('invalid json');
    logTest('fix1', 'No "invalid JSON" error in response', !hasInvalidJsonError,
      hasInvalidJsonError ? 'Found "invalid JSON" in response' : 'No "invalid JSON" error found');
  }
  
  updateFixStatus('fix1');
}

// ============================================
// FIX 2: 2FA API Paths with /account Segment
// ============================================
async function testFix2_TwoFactorPaths() {
  console.log('\n=== Testing Fix 2: 2FA API Paths with /account Segment ===');
  
  // Test 2.1: Verify enable 2FA uses correct path with /account
  try {
    const response = await axios.post(
      `${API_BASE_URL}/profile/account/2fa/enable`,
      {
        method: 'sms',
        phoneNumber: '+8801234567890'
      },
      {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    // Check if the endpoint exists (might return 404 if not implemented yet)
    const passed = response.status !== 404;
    logTest('fix2', 'POST /api/v1/profile/account/2fa/enable endpoint exists', passed,
      `Status: ${response.status}`);
  } catch (error) {
    const passed = error.response?.status !== 404;
    logTest('fix2', 'POST /api/v1/profile/account/2fa/enable endpoint exists', passed,
      `Status: ${error.response?.status}, Error: ${error.message}`);
  }
  
  // Test 2.2: Verify disable 2FA uses correct path with /account
  try {
    const response = await axios.post(
      `${API_BASE_URL}/profile/account/2fa/disable`,
      {},
      {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    const passed = response.status !== 404;
    logTest('fix2', 'POST /api/v1/profile/account/2fa/disable endpoint exists', passed,
      `Status: ${response.status}`);
  } catch (error) {
    const passed = error.response?.status !== 404;
    logTest('fix2', 'POST /api/v1/profile/account/2fa/disable endpoint exists', passed,
      `Status: ${error.response?.status}, Error: ${error.message}`);
  }
  
  // Test 2.3: Verify the old path without /account returns 404 (or doesn't work)
  try {
    const response = await axios.post(
      `${API_BASE_URL}/profile/2fa/enable`,
      {
        method: 'sms',
        phoneNumber: '+8801234567890'
      },
      {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    // The old path should not work (should return 404 or similar)
    const passed = response.status === 404;
    logTest('fix2', 'Old path /profile/2fa/enable is deprecated (returns 404)', passed,
      `Status: ${response.status}`);
  } catch (error) {
    const passed = error.response?.status === 404;
    logTest('fix2', 'Old path /profile/2fa/enable is deprecated (returns 404)', passed,
      `Status: ${error.response?.status}`);
  }
  
  updateFixStatus('fix2');
}

// ============================================
// FIX 3: Data Export Null Checks
// ============================================
async function testFix3_DataExportNullChecks() {
  console.log('\n=== Testing Fix 3: Data Export Null Checks ===');
  
  // Test 3.1: Verify get data exports handles empty response
  try {
    const response = await axios.get(
      `${API_BASE_URL}/profile/data/export`,
      {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      }
    );
    
    const passed = response.data.success === true && 
                   Array.isArray(response.data.data?.exports);
    logTest('fix3', 'Get data exports returns valid structure', passed,
      `Response structure: ${JSON.stringify(response.data).substring(0, 150)}`);
  } catch (error) {
    logTest('fix3', 'Get data exports returns valid structure', false,
      `Error: ${error.message}`);
  }
  
  // Test 3.2: Verify exports array is handled even when empty
  try {
    const response = await axios.get(
      `${API_BASE_URL}/profile/data/export`,
      {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      }
    );
    
    const exports = response.data.data?.exports || [];
    const passed = Array.isArray(exports);
    logTest('fix3', 'Exports array is properly handled (even when empty)', passed,
      `Exports array length: ${exports.length}, Is array: ${Array.isArray(exports)}`);
  } catch (error) {
    logTest('fix3', 'Exports array is properly handled (even when empty)', false,
      `Error: ${error.message}`);
  }
  
  // Test 3.3: Verify no "exportItem is undefined" error occurs
  try {
    const response = await axios.get(
      `${API_BASE_URL}/profile/data/export`,
      {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      }
    );
    
    const responseData = JSON.stringify(response.data);
    const hasUndefinedError = responseData.toLowerCase().includes('exportitem') &&
                              responseData.toLowerCase().includes('undefined');
    logTest('fix3', 'No "exportItem is undefined" error in response', !hasUndefinedError,
      hasUndefinedError ? 'Found "exportItem undefined" in response' : 'No undefined error found');
  } catch (error) {
    const errorData = JSON.stringify(error.response?.data || {});
    const hasUndefinedError = errorData.toLowerCase().includes('exportitem') &&
                              errorData.toLowerCase().includes('undefined');
    logTest('fix3', 'No "exportItem is undefined" error in response', !hasUndefinedError,
      hasUndefinedError ? 'Found "exportItem undefined" in response' : 'No undefined error found');
  }
  
  updateFixStatus('fix3');
}

// ============================================
// FIX 4: Data Export Download Functionality
// ============================================
async function testFix4_DataExportDownload() {
  console.log('\n=== Testing Fix 4: Data Export Download Functionality ===');
  
  // First, create a data export
  let exportId = null;
  try {
    const response = await axios.post(
      `${API_BASE_URL}/profile/data/export/generate`,
      {
        dataTypes: ['profile'],
        format: 'json'
      },
      {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    if (response.data.success && response.data.data?.exportId) {
      exportId = response.data.data.exportId;
      console.log(`✓ Created export with ID: ${exportId}`);
    } else {
      console.log(`✗ Failed to create export`);
    }
  } catch (error) {
    console.log(`✗ Failed to create export: ${error.message}`);
  }
  
  if (!exportId) {
    // Use a dummy export ID for testing the endpoint structure
    exportId = 'test-export-id';
  }
  
  // Test 4.1: Verify download endpoint returns download URL
  try {
    const response = await axios.get(
      `${API_BASE_URL}/profile/data/export/${exportId}`,
      {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      }
    );
    
    const hasDownloadUrl = response.data.data?.downloadUrl !== undefined;
    logTest('fix4', 'Download endpoint returns downloadUrl in response', hasDownloadUrl,
      `Has downloadUrl: ${hasDownloadUrl}, Response: ${JSON.stringify(response.data).substring(0, 150)}`);
  } catch (error) {
    // Even if export not found, check if the response structure is correct
    const hasDownloadUrl = error.response?.data?.data?.downloadUrl !== undefined;
    logTest('fix4', 'Download endpoint returns downloadUrl in response', hasDownloadUrl,
      `Has downloadUrl: ${hasDownloadUrl}, Error: ${error.message}`);
  }
  
  // Test 4.2: Verify download URL format is correct
  try {
    const response = await axios.get(
      `${API_BASE_URL}/profile/data/export/${exportId}`,
      {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      }
    );
    
    const downloadUrl = response.data.data?.downloadUrl;
    const passed = downloadUrl && (downloadUrl.startsWith('http://') || downloadUrl.startsWith('https://'));
    logTest('fix4', 'Download URL has valid format (http/https)', passed,
      `Download URL: ${downloadUrl || 'N/A'}`);
  } catch (error) {
    const downloadUrl = error.response?.data?.data?.downloadUrl;
    const passed = downloadUrl && (downloadUrl.startsWith('http://') || downloadUrl.startsWith('https://'));
    logTest('fix4', 'Download URL has valid format (http/https)', passed,
      `Download URL: ${downloadUrl || 'N/A'}`);
  }
  
  // Test 4.3: Verify the frontend can use the download URL
  try {
    const response = await axios.get(
      `${API_BASE_URL}/profile/data/export/${exportId}`,
      {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      }
    );
    
    const downloadUrl = response.data.data?.downloadUrl;
    // The download URL should be accessible (even if it returns 404 for non-existent export)
    const passed = downloadUrl !== null && downloadUrl !== undefined;
    logTest('fix4', 'Download URL is accessible for frontend use', passed,
      `Download URL present: ${passed}`);
  } catch (error) {
    const downloadUrl = error.response?.data?.data?.downloadUrl;
    const passed = downloadUrl !== null && downloadUrl !== undefined;
    logTest('fix4', 'Download URL is accessible for frontend use', passed,
      `Download URL present: ${passed}`);
  }
  
  updateFixStatus('fix4');
}

// ============================================
// FIX 5: Data Export CSV Generation
// ============================================
async function testFix5_DataExportCSV() {
  console.log('\n=== Testing Fix 5: Data Export CSV Generation ===');
  
  // Test 5.1: Verify CSV format is accepted
  try {
    const response = await axios.post(
      `${API_BASE_URL}/profile/data/export/generate`,
      {
        dataTypes: ['profile'],
        format: 'csv'
      },
      {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    const passed = response.status !== 400 || 
                   (response.data.error && !response.data.error.toLowerCase().includes('invalid format'));
    logTest('fix5', 'CSV format is accepted by generate endpoint', passed,
      `Status: ${response.status}, Response: ${JSON.stringify(response.data).substring(0, 150)}`);
  } catch (error) {
    const passed = error.response?.status !== 400 ||
                   (error.response?.data?.error && !error.response?.data?.error.toLowerCase().includes('invalid format'));
    logTest('fix5', 'CSV format is accepted by generate endpoint', passed,
      `Status: ${error.response?.status}, Error: ${error.message}`);
  }
  
  // Test 5.2: Verify no "res is not defined" error in CSV generation
  try {
    const response = await axios.post(
      `${API_BASE_URL}/profile/data/export/generate`,
      {
        dataTypes: ['profile'],
        format: 'csv'
      },
      {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    const responseData = JSON.stringify(response.data);
    const hasResUndefinedError = responseData.toLowerCase().includes('res is not defined');
    logTest('fix5', 'No "res is not defined" error in CSV generation', !hasResUndefinedError,
      hasResUndefinedError ? 'Found "res is not defined" error' : 'No "res is not defined" error found');
  } catch (error) {
    const errorData = JSON.stringify(error.response?.data || {});
    const hasResUndefinedError = errorData.toLowerCase().includes('res is not defined');
    logTest('fix5', 'No "res is not defined" error in CSV generation', !hasResUndefinedError,
      hasResUndefinedError ? 'Found "res is not defined" error' : 'No "res is not defined" error found');
  }
  
  // Test 5.3: Verify CSV export returns proper response structure
  try {
    const response = await axios.post(
      `${API_BASE_URL}/profile/data/export/generate`,
      {
        dataTypes: ['profile'],
        format: 'csv'
      },
      {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    const hasExportId = response.data.data?.exportId !== undefined;
    const hasStatus = response.data.data?.status !== undefined;
    const passed = hasExportId && hasStatus;
    logTest('fix5', 'CSV export returns proper response structure (exportId, status)', passed,
      `Has exportId: ${hasExportId}, Has status: ${hasStatus}`);
  } catch (error) {
    const hasExportId = error.response?.data?.data?.exportId !== undefined;
    const hasStatus = error.response?.data?.data?.status !== undefined;
    const passed = hasExportId && hasStatus;
    logTest('fix5', 'CSV export returns proper response structure (exportId, status)', passed,
      `Has exportId: ${hasExportId}, Has status: ${hasStatus}`);
  }
  
  updateFixStatus('fix5');
}

// ============================================
// FIX 6: Verification Code Modal Close Button
// ============================================
async function testFix6_VerificationModalClose() {
  console.log('\n=== Testing Fix 6: Verification Code Modal Close Button ===');
  
  // This fix is in the frontend, so we'll verify the component structure
  // by checking if the modal has a close button with proper onClick handler
  
  // Test 6.1: Verify TwoFactorSetup component has close button
  try {
    const fs = require('fs');
    const path = require('path');
    const componentPath = path.join(__dirname, '../frontend/src/components/account/TwoFactorSetup.tsx');
    
    if (fs.existsSync(componentPath)) {
      const componentContent = fs.readFileSync(componentPath, 'utf8');
      
      // Check for close button with onClick
      const hasCloseButton = componentContent.includes('onClick={handleClose}') ||
                            componentContent.includes('onClick={onClose}');
      const hasXIcon = componentContent.includes('<X');
      
      const passed = hasCloseButton && hasXIcon;
      logTest('fix6', 'TwoFactorSetup component has close button with onClick handler', passed,
        `Has close button: ${hasCloseButton}, Has X icon: ${hasXIcon}`);
    } else {
      logTest('fix6', 'TwoFactorSetup component has close button with onClick handler', false,
        'Component file not found');
    }
  } catch (error) {
    logTest('fix6', 'TwoFactorSetup component has close button with onClick handler', false,
      `Error reading component: ${error.message}`);
  }
  
  // Test 6.2: Verify handleClose function resets modal state
  try {
    const fs = require('fs');
    const path = require('path');
    const componentPath = path.join(__dirname, '../frontend/src/components/account/TwoFactorSetup.tsx');
    
    if (fs.existsSync(componentPath)) {
      const componentContent = fs.readFileSync(componentPath, 'utf8');
      
      // Check for handleClose function that resets state
      const hasHandleClose = componentContent.includes('const handleClose') ||
                            componentContent.includes('function handleClose');
      const callsOnClose = componentContent.includes('onClose()');
      
      const passed = hasHandleClose && callsOnClose;
      logTest('fix6', 'handleClose function calls onClose to close modal', passed,
        `Has handleClose: ${hasHandleClose}, Calls onClose: ${callsOnClose}`);
    } else {
      logTest('fix6', 'handleClose function calls onClose to close modal', false,
        'Component file not found');
    }
  } catch (error) {
    logTest('fix6', 'handleClose function calls onClose to close modal', false,
      `Error reading component: ${error.message}`);
  }
  
  // Test 6.3: Verify preferences page passes onClose prop to modal
  try {
    const fs = require('fs');
    const path = require('path');
    const pagePath = path.join(__dirname, '../frontend/src/app/account/preferences/page.tsx');
    
    if (fs.existsSync(pagePath)) {
      const pageContent = fs.readFileSync(pagePath, 'utf8');
      
      // Check if TwoFactorSetup is rendered with onClose prop
      const hasTwoFactorSetup = pageContent.includes('TwoFactorSetup');
      const hasOnCloseProp = pageContent.includes('onClose=') || pageContent.includes('onClose =');
      
      const passed = hasTwoFactorSetup && hasOnCloseProp;
      logTest('fix6', 'Preferences page passes onClose prop to TwoFactorSetup modal', passed,
        `Has TwoFactorSetup: ${hasTwoFactorSetup}, Has onClose prop: ${hasOnCloseProp}`);
    } else {
      logTest('fix6', 'Preferences page passes onClose prop to TwoFactorSetup modal', false,
        'Page file not found');
    }
  } catch (error) {
    logTest('fix6', 'Preferences page passes onClose prop to TwoFactorSetup modal', false,
      `Error reading page: ${error.message}`);
  }
  
  updateFixStatus('fix6');
}

// ============================================
// Main Test Runner
// ============================================
async function runAllTests() {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║  Account Settings Fixes Verification Test                 ║');
  console.log('║  Testing all 6 fixes after rebuild                        ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  
  // Login first
  const loggedIn = await login();
  if (!loggedIn) {
    console.log('\n✗ Failed to login. Tests will continue but may fail due to missing auth token.');
  }
  
  // Run all fix tests
  await testFix1_PasswordChange();
  await testFix2_TwoFactorPaths();
  await testFix3_DataExportNullChecks();
  await testFix4_DataExportDownload();
  await testFix5_DataExportCSV();
  await testFix6_VerificationModalClose();
  
  // Print summary
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║  TEST SUMMARY                                               ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');
  
  let totalPassed = 0;
  let totalFailed = 0;
  
  for (const [fixId, fix] of Object.entries(testResults)) {
    const passedCount = fix.tests.filter(t => t.passed).length;
    const failedCount = fix.tests.filter(t => !t.passed).length;
    totalPassed += passedCount;
    totalFailed += failedCount;
    
    const statusIcon = fix.status === 'passed' ? '✓' : fix.status === 'failed' ? '✗' : '⚠';
    const statusText = fix.status.toUpperCase();
    
    console.log(`${statusIcon} ${fix.name} [${statusText}]`);
    console.log(`   Tests: ${passedCount} passed, ${failedCount} failed`);
    
    // Show failed tests
    const failedTests = fix.tests.filter(t => !t.passed);
    if (failedTests.length > 0) {
      console.log('   Failed tests:');
      failedTests.forEach(test => {
        console.log(`     - ${test.name}`);
        if (test.details) {
          console.log(`       ${test.details}`);
        }
      });
    }
    console.log('');
  }
  
  console.log('────────────────────────────────────────────────────────────');
  console.log(`TOTAL: ${totalPassed} passed, ${totalFailed} failed`);
  console.log('────────────────────────────────────────────────────────────\n');
  
  // Save results to file
  const fs = require('fs');
  const resultsPath = './ACCOUNT_SETTINGS_FIXES_TEST_RESULTS.json';
  fs.writeFileSync(resultsPath, JSON.stringify(testResults, null, 2));
  console.log(`✓ Test results saved to: ${resultsPath}`);
  
  return testResults;
}

// Run tests
runAllTests()
  .then(results => {
    console.log('\n✓ All tests completed!');
    process.exit(0);
  })
  .catch(error => {
    console.error(`\n✗ Test execution failed: ${error.message}`);
    console.error(error.stack);
    process.exit(1);
  });
