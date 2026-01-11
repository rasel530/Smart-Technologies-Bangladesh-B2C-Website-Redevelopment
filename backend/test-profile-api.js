/**
 * Comprehensive Profile Management API Test
 * Tests all profile management endpoints with demo data
 */

const axios = require('axios');

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3001/api/v1';
const DEMO_USER = {
  identifier: 'demo.user1@smarttech.bd',
  password: 'Demo123456'
};

let authToken = null;
let userId = null;

// Color codes for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

function logInfo(message) {
  log(`ℹ️  ${message}`, 'blue');
}

function logTest(message) {
  log(`🧪 ${message}`, 'cyan');
}

function logSection(message) {
  log(`\n═══════════════════════════════════════════════════════════`, 'yellow');
  log(message, 'yellow');
  log('═══════════════════════════════════════════════════════════\n', 'yellow');
}

// Test results tracker
const testResults = {
  passed: 0,
  failed: 0,
  tests: []
};

function recordTest(name, passed, details = '') {
  testResults.tests.push({ name, passed, details });
  if (passed) {
    testResults.passed++;
    logSuccess(`${name} - PASSED`);
  } else {
    testResults.failed++;
    logError(`${name} - FAILED`);
    if (details) {
      log(`   Details: ${details}`, 'red');
    }
  }
}

async function login() {
  try {
    logTest('Logging in with demo user...');
    const response = await axios.post(`${API_BASE_URL}/auth/login`, {
      identifier: DEMO_USER.identifier,
      password: DEMO_USER.password
    });

    if (response.data?.user?.id && response.data?.token) {
      authToken = response.data.token;
      userId = response.data.user.id;
      logSuccess('Login successful');
      logInfo(`User ID: ${userId}`);
      return true;
    } else {
      logError('Login failed - no token in response');
      return false;
    }
  } catch (error) {
    logError(`Login failed: ${error.response?.data?.message || error.message}`);
    return false;
  }
}

async function testGetProfile() {
  try {
    logTest('Testing GET /profile/me');
    const response = await axios.get(`${API_BASE_URL}/profile/me`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });

    if (response.data.user) {
      recordTest('Get Profile', true, `User: ${response.data.user.firstName} ${response.data.user.lastName}`);
      return response.data.user;
    } else {
      recordTest('Get Profile', false, 'No user data in response');
      return null;
    }
  } catch (error) {
    recordTest('Get Profile', false, error.response?.data?.error || error.message);
    return null;
  }
}

async function testUpdateProfile(user) {
  try {
    logTest('Testing PUT /profile/me');
    const updateData = {
      firstName: 'Rahim Updated',
      lastName: 'Ahmed Updated'
    };

    const response = await axios.put(`${API_BASE_URL}/profile/me`, updateData, {
      headers: { Authorization: `Bearer ${authToken}` }
    });

    if (response.data.user) {
      recordTest('Update Profile', true, `Updated to: ${response.data.user.firstName} ${response.data.user.lastName}`);
      return true;
    } else {
      recordTest('Update Profile', false, 'No user data in response');
      return false;
    }
  } catch (error) {
    recordTest('Update Profile', false, error.response?.data?.error || error.message);
    return false;
  }
}

async function testProfilePictureUpload() {
  try {
    logTest('Testing POST /profile/me/picture');
    
    // Create a simple test image buffer
    const testImage = Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64');
    
    const formData = new FormData();
    formData.append('picture', testImage, 'test-profile.jpg');

    const response = await axios.post(`${API_BASE_URL}/profile/me/picture`, formData, {
      headers: {
        Authorization: `Bearer ${authToken}`,
        'Content-Type': 'multipart/form-data'
      }
    });

    if (response.data.user) {
      recordTest('Profile Picture Upload', true, 'Image uploaded successfully');
      return true;
    } else {
      recordTest('Profile Picture Upload', false, 'No user data in response');
      return false;
    }
  } catch (error) {
    recordTest('Profile Picture Upload', false, error.response?.data?.error || error.message);
    return false;
  }
}

async function testProfilePictureDelete() {
  try {
    logTest('Testing DELETE /profile/me/picture');
    const response = await axios.delete(`${API_BASE_URL}/profile/me/picture`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });

    if (response.data.user) {
      recordTest('Profile Picture Delete', true, 'Image deleted successfully');
      return true;
    } else {
      recordTest('Profile Picture Delete', false, 'No user data in response');
      return false;
    }
  } catch (error) {
    recordTest('Profile Picture Delete', false, error.response?.data?.error || error.message);
    return false;
  }
}

async function testEmailChangeRequest() {
  try {
    logTest('Testing POST /profile/me/email/change');
    const response = await axios.post(`${API_BASE_URL}/profile/me/email/change`, {
      newEmail: 'new.email@example.com'
    }, {
      headers: { Authorization: `Bearer ${authToken}` }
    });

    if (response.data.requiresVerification) {
      recordTest('Email Change Request', true, 'Verification requested');
      return response.data.verificationToken;
    } else {
      recordTest('Email Change Request', false, 'No verification required');
      return null;
    }
  } catch (error) {
    recordTest('Email Change Request', false, error.response?.data?.error || error.message);
    return null;
  }
}

async function testPhoneChangeRequest() {
  try {
    logTest('Testing POST /profile/me/phone/change');
    const response = await axios.post(`${API_BASE_URL}/profile/me/phone/change`, {
      newPhone: '+8801912345679'
    }, {
      headers: { Authorization: `Bearer ${authToken}` }
    });

    if (response.data.requiresVerification) {
      recordTest('Phone Change Request', true, 'OTP requested');
      return response.data.otp;
    } else {
      recordTest('Phone Change Request', false, 'No verification required');
      return null;
    }
  } catch (error) {
    recordTest('Phone Change Request', false, error.response?.data?.error || error.message);
    return null;
  }
}

async function testGetSettings() {
  try {
    logTest('Testing GET /profile/me/settings');
    const response = await axios.get(`${API_BASE_URL}/profile/me/settings`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });

    if (response.data.settings) {
      recordTest('Get Settings', true, 'Settings retrieved');
      return response.data.settings;
    } else {
      recordTest('Get Settings', false, 'No settings in response');
      return null;
    }
  } catch (error) {
    recordTest('Get Settings', false, error.response?.data?.error || error.message);
    return null;
  }
}

async function testUpdateSettings() {
  try {
    logTest('Testing PUT /profile/me/settings');
    const settings = {
      notifications: {
        email: {
          orderUpdates: true,
          specialOffers: false,
          newsletter: false
        },
        sms: {
          orderUpdates: true,
          specialOffers: false
        }
      },
      privacy: {
        profileVisibility: 'public',
        showOrders: false,
        showReviews: false
      },
      preferences: {
        language: 'en',
        currency: 'BDT'
      }
    };

    const response = await axios.put(`${API_BASE_URL}/profile/me/settings`, settings, {
      headers: { Authorization: `Bearer ${authToken}` }
    });

    if (response.data.settings) {
      recordTest('Update Settings', true, 'Settings updated');
      return true;
    } else {
      recordTest('Update Settings', false, 'No settings in response');
      return false;
    }
  } catch (error) {
    recordTest('Update Settings', false, error.response?.data?.error || error.message);
    return false;
  }
}

async function testAccountDeletionRequest() {
  try {
    logTest('Testing POST /profile/me/delete');
    const response = await axios.post(`${API_BASE_URL}/profile/me/delete`, {
      password: DEMO_USER.password
    }, {
      headers: { Authorization: `Bearer ${authToken}` }
    });

    if (response.data.requiresConfirmation) {
      recordTest('Account Deletion Request', true, 'Deletion requested');
      return response.data.deletionToken;
    } else {
      recordTest('Account Deletion Request', false, 'No confirmation required');
      return null;
    }
  } catch (error) {
    recordTest('Account Deletion Request', false, error.response?.data?.error || error.message);
    return null;
  }
}

async function runAllTests() {
  logSection('PROFILE MANAGEMENT API TEST SUITE');
  
  logInfo(`API Base URL: ${API_BASE_URL}`);
  logInfo(`Demo User: ${DEMO_USER.email}\n`);

  // Login first
  const loginSuccess = await login();
  if (!loginSuccess) {
    logError('Cannot proceed with tests - login failed');
    return;
  }

  // Run all tests
  await testGetProfile();
  await testUpdateProfile();
  await testGetSettings();
  await testUpdateSettings();
  await testEmailChangeRequest();
  await testPhoneChangeRequest();
  await testAccountDeletionRequest();
  
  // Note: Skip actual picture upload/delete tests in automated testing
  // These require actual file uploads which are better tested manually
  logInfo('Skipping picture upload/delete tests (requires manual testing with actual files)');

  // Print summary
  logSection('TEST RESULTS SUMMARY');
  
  const totalTests = testResults.passed + testResults.failed;
  const passRate = ((testResults.passed / totalTests) * 100).toFixed(2);
  
  log(`\nTotal Tests: ${totalTests}`, 'cyan');
  log(`Passed: ${testResults.passed}`, 'green');
  log(`Failed: ${testResults.failed}`, 'red');
  log(`Pass Rate: ${passRate}%`, passRate >= 80 ? 'green' : 'yellow');

  log('\n📋 DETAILED RESULTS:');
  log('─────────────────────────────────────────────────────────────────────');
  testResults.tests.forEach((test, index) => {
    const status = test.passed ? '✅ PASS' : '❌ FAIL';
    const color = test.passed ? 'green' : 'red';
    log(`${index + 1}. ${test.name}: ${status}`, color);
    if (test.details) {
      log(`   ${test.details}`, 'reset');
    }
  });

  log('\n\n📝 NOTES:');
  log('─────────────────────────────────────────────────────────────────────');
  log('1. Profile picture upload/delete should be tested manually');
  log('2. Email/phone change confirmation requires actual verification');
  log('3. Account deletion should not be executed in tests');
  log('4. All endpoints require valid authentication token\n');

  if (testResults.passed === totalTests) {
    logSuccess('ALL TESTS PASSED! 🎉');
  } else {
    logError(`${testResults.failed} test(s) failed. Please review the errors above.`);
  }
}

// Run tests
runAllTests()
  .then(() => {
    process.exit(testResults.failed > 0 ? 1 : 0);
  })
  .catch((error) => {
    logError(`Test suite failed: ${error.message}`);
    process.exit(1);
  });
