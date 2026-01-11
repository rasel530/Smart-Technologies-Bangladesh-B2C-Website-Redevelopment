/**
 * Test script for profile update functionality
 * Tests the standard API response format for profile updates
 */

const axios = require('axios');

// Configuration
const API_BASE_URL = 'http://localhost:3001/api/v1';

// Test user credentials
const TEST_USER = {
  email: 'test@example.com',
  password: 'Test123456'
};

let authToken = null;

// Color codes for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
  console.log('\n' + '='.repeat(60));
  log(title, 'blue');
  console.log('='.repeat(60));
}

function logTest(testName) {
  console.log(`\n${colors.yellow}Testing: ${testName}${colors.reset}`);
}

function logSuccess(message) {
  log(`✓ ${message}`, 'green');
}

function logError(message) {
  log(`✗ ${message}`, 'red');
}

// Helper function to login and get token
async function login() {
  try {
    logTest('Login to get authentication token');
    const response = await axios.post(`${API_BASE_URL}/auth/login`, TEST_USER);
    
    if (response.data.success && response.data.data.token) {
      authToken = response.data.data.token;
      logSuccess(`Login successful. Token: ${authToken.substring(0, 20)}...`);
      return true;
    } else {
      logError('Login failed: No token in response');
      return false;
    }
  } catch (error) {
    logError(`Login failed: ${error.response?.data?.message || error.message}`);
    return false;
  }
}

// Test 1: Get current profile
async function testGetProfile() {
  try {
    logTest('Get current user profile');
    const response = await axios.get(`${API_BASE_URL}/profile/me`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });

    if (response.data.success && response.data.data.user) {
      logSuccess('Profile retrieved successfully');
      logSuccess(`User: ${response.data.data.user.firstName} ${response.data.data.user.lastName}`);
      logSuccess(`Email: ${response.data.data.user.email}`);
      return response.data.data.user;
    } else {
      logError('Failed to get profile: Invalid response format');
      return null;
    }
  } catch (error) {
    logError(`Failed to get profile: ${error.response?.data?.message || error.message}`);
    return null;
  }
}

// Test 2: Update profile with valid data
async function testUpdateProfile() {
  try {
    logTest('Update user profile');
    
    const updateData = {
      firstName: 'John',
      lastName: 'Doe Updated',
      phone: '+8801712345678',
      dateOfBirth: '1990-01-01',
      gender: 'MALE'
    };

    const response = await axios.put(`${API_BASE_URL}/profile/me`, updateData, {
      headers: { Authorization: `Bearer ${authToken}` }
    });

    if (response.data.success && response.data.data.user) {
      logSuccess('Profile updated successfully');
      logSuccess(`Updated firstName: ${response.data.data.user.firstName}`);
      logSuccess(`Updated lastName: ${response.data.data.user.lastName}`);
      logSuccess(`Updated phone: ${response.data.data.user.phone}`);
      logSuccess(`Updated dateOfBirth: ${response.data.data.user.dateOfBirth}`);
      logSuccess(`Updated gender: ${response.data.data.user.gender}`);
      return true;
    } else {
      logError('Failed to update profile: Invalid response format');
      return false;
    }
  } catch (error) {
    logError(`Failed to update profile: ${error.response?.data?.message || error.message}`);
    return false;
  }
}

// Test 3: Update profile with partial data
async function testPartialUpdate() {
  try {
    logTest('Update profile with partial data (only firstName)');
    
    const updateData = {
      firstName: 'Jane'
    };

    const response = await axios.put(`${API_BASE_URL}/profile/me`, updateData, {
      headers: { Authorization: `Bearer ${authToken}` }
    });

    if (response.data.success && response.data.data.user) {
      logSuccess('Partial profile update successful');
      logSuccess(`Updated firstName: ${response.data.data.user.firstName}`);
      return true;
    } else {
      logError('Failed to update profile partially: Invalid response format');
      return false;
    }
  } catch (error) {
    logError(`Failed to update profile partially: ${error.response?.data?.message || error.message}`);
    return false;
  }
}

// Test 4: Update profile with invalid phone number
async function testInvalidPhone() {
  try {
    logTest('Update profile with invalid phone number (should fail)');
    
    const updateData = {
      phone: '12345' // Invalid phone
    };

    const response = await axios.put(`${API_BASE_URL}/profile/me`, updateData, {
      headers: { Authorization: `Bearer ${authToken}` }
    });

    logError('Expected validation error but request succeeded');
    return false;
  } catch (error) {
    if (error.response?.status === 400) {
      logSuccess('Validation error correctly returned for invalid phone');
      logSuccess(`Error message: ${error.response.data.message || error.response.data.error}`);
      return true;
    } else {
      logError(`Unexpected error: ${error.response?.data?.message || error.message}`);
      return false;
    }
  }
}

// Test 5: Update profile with invalid gender
async function testInvalidGender() {
  try {
    logTest('Update profile with invalid gender (should fail)');
    
    const updateData = {
      gender: 'INVALID'
    };

    const response = await axios.put(`${API_BASE_URL}/profile/me`, updateData, {
      headers: { Authorization: `Bearer ${authToken}` }
    });

    logError('Expected validation error but request succeeded');
    return false;
  } catch (error) {
    if (error.response?.status === 400) {
      logSuccess('Validation error correctly returned for invalid gender');
      logSuccess(`Error message: ${error.response.data.message || error.response.data.error}`);
      return true;
    } else {
      logError(`Unexpected error: ${error.response?.data?.message || error.message}`);
      return false;
    }
  }
}

// Test 6: Update profile without authentication
async function testUpdateWithoutAuth() {
  try {
    logTest('Update profile without authentication (should fail)');
    
    const updateData = {
      firstName: 'Unauthorized'
    };

    const response = await axios.put(`${API_BASE_URL}/profile/me`, updateData);

    logError('Expected 401 error but request succeeded');
    return false;
  } catch (error) {
    if (error.response?.status === 401) {
      logSuccess('Authentication error correctly returned');
      return true;
    } else {
      logError(`Unexpected error: ${error.response?.data?.message || error.message}`);
      return false;
    }
  }
}

// Test 7: Verify profile was actually updated
async function testVerifyUpdate() {
  try {
    logTest('Verify profile was actually updated in database');
    
    const response = await axios.get(`${API_BASE_URL}/profile/me`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });

    if (response.data.success && response.data.data.user) {
      const user = response.data.data.user;
      logSuccess('Profile verification successful');
      logSuccess(`Current firstName: ${user.firstName}`);
      logSuccess(`Current lastName: ${user.lastName}`);
      logSuccess(`Current phone: ${user.phone}`);
      logSuccess(`Current dateOfBirth: ${user.dateOfBirth}`);
      logSuccess(`Current gender: ${user.gender}`);
      return true;
    } else {
      logError('Failed to verify profile: Invalid response format');
      return false;
    }
  } catch (error) {
    logError(`Failed to verify profile: ${error.response?.data?.message || error.message}`);
    return false;
  }
}

// Main test execution
async function runTests() {
  logSection('PROFILE UPDATE API TEST SUITE');
  
  const results = {
    total: 0,
    passed: 0,
    failed: 0
  };

  // Login first
  const loginSuccess = await login();
  if (!loginSuccess) {
    logError('Cannot proceed with tests - login failed');
    return;
  }

  // Run tests
  const tests = [
    { name: 'Get Profile', fn: testGetProfile },
    { name: 'Update Profile', fn: testUpdateProfile },
    { name: 'Partial Update', fn: testPartialUpdate },
    { name: 'Invalid Phone', fn: testInvalidPhone },
    { name: 'Invalid Gender', fn: testInvalidGender },
    { name: 'Update Without Auth', fn: testUpdateWithoutAuth },
    { name: 'Verify Update', fn: testVerifyUpdate }
  ];

  for (const test of tests) {
    results.total++;
    try {
      const passed = await test.fn();
      if (passed) {
        results.passed++;
      } else {
        results.failed++;
      }
    } catch (error) {
      results.failed++;
      logError(`Test crashed: ${error.message}`);
    }
  }

  // Print summary
  logSection('TEST SUMMARY');
  log(`Total Tests: ${results.total}`, 'reset');
  log(`Passed: ${results.passed}`, 'green');
  log(`Failed: ${results.failed}`, 'red');
  log(`Success Rate: ${((results.passed / results.total) * 100).toFixed(2)}%`, 
    results.passed === results.total ? 'green' : 'yellow');

  if (results.passed === results.total) {
    log('\n✓ All tests passed! Profile update API is working correctly.', 'green');
  } else {
    log('\n✗ Some tests failed. Please review the errors above.', 'red');
  }
}

// Run the tests
runTests().catch(error => {
  logError(`Test suite crashed: ${error.message}`);
  console.error(error);
  process.exit(1);
});
