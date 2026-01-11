/**
 * Account Deletion API Test Script
 * Tests the account deletion functionality
 */

const axios = require('axios');

const API_BASE_URL = 'http://localhost:3001/api/v1';

// Test configuration
const TEST_CONFIG = {
  testUser: {
    email: 'test_deletion@example.com',
    password: 'TestPass123!',
    firstName: 'Test',
    lastName: 'Deletion'
  }
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

function logSection(title) {
  console.log('\n' + '='.repeat(60));
  log(title, 'cyan');
  console.log('='.repeat(60) + '\n');
}

function logTest(testName, passed) {
  const status = passed ? '✓ PASSED' : '✗ FAILED';
  const color = passed ? 'green' : 'red';
  log(`${status}: ${testName}`, color);
}

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Test 1: Register a test user
async function testRegisterUser() {
  logSection('Test 1: Register Test User');
  
  try {
    const response = await axios.post(`${API_BASE_URL}/auth/register`, TEST_CONFIG.testUser);
    
    if (response.data.success && response.data.user) {
      userId = response.data.user.id;
      authToken = response.data.token;
      logTest('User registration successful', true);
      log(`User ID: ${userId}`, 'blue');
      log(`Email: ${TEST_CONFIG.testUser.email}`, 'blue');
      return true;
    } else {
      logTest('User registration failed - unexpected response', false);
      log(JSON.stringify(response.data), 'yellow');
      return false;
    }
  } catch (error) {
    // User might already exist, try to login
    log('User might already exist, attempting login...', 'yellow');
    return await testLoginUser();
  }
}

// Test 2: Login with test user
async function testLoginUser() {
  logSection('Test 2: Login Test User');
  
  try {
    const response = await axios.post(`${API_BASE_URL}/auth/login`, {
      email: TEST_CONFIG.testUser.email,
      password: TEST_CONFIG.testUser.password
    });
    
    if (response.data.success && response.data.user) {
      userId = response.data.user.id;
      authToken = response.data.token;
      logTest('User login successful', true);
      log(`User ID: ${userId}`, 'blue');
      return true;
    } else {
      logTest('User login failed - unexpected response', false);
      return false;
    }
  } catch (error) {
    logTest('User login failed', false);
    log(error.response?.data?.message || error.message, 'red');
    return false;
  }
}

// Test 3: Get deletion status
async function testGetDeletionStatus() {
  logSection('Test 3: Get Account Deletion Status');
  
  try {
    const response = await axios.get(`${API_BASE_URL}/user/account/deletion-status`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    if (response.data.success && response.data.data) {
      const status = response.data.data;
      logTest('Get deletion status successful', true);
      log(`Is Deleted: ${status.isDeleted}`, 'blue');
      log(`Has Active Orders: ${status.hasActiveOrders}`, 'blue');
      log(`Active Orders Count: ${status.activeOrdersCount}`, 'blue');
      return true;
    } else {
      logTest('Get deletion status failed - unexpected response', false);
      return false;
    }
  } catch (error) {
    logTest('Get deletion status failed', false);
    log(error.response?.data?.error || error.message, 'red');
    return false;
  }
}

// Test 4: Attempt deletion without password (should fail)
async function testDeletionWithoutPassword() {
  logSection('Test 4: Attempt Deletion Without Password (Should Fail)');
  
  try {
    const response = await axios.delete(`${API_BASE_URL}/user/account`, {
      headers: { Authorization: `Bearer ${authToken}` },
      data: {}
    });
    
    logTest('Deletion without password should have failed', false);
    log('Expected validation error but request succeeded', 'red');
    return false;
  } catch (error) {
    if (error.response?.status === 400) {
      logTest('Deletion without password correctly rejected', true);
      log(error.response.data.error || 'Validation error', 'yellow');
      return true;
    } else {
      logTest('Deletion without password failed with unexpected error', false);
      log(error.response?.data?.error || error.message, 'red');
      return false;
    }
  }
}

// Test 5: Attempt deletion with wrong password (should fail)
async function testDeletionWithWrongPassword() {
  logSection('Test 5: Attempt Deletion With Wrong Password (Should Fail)');
  
  try {
    const response = await axios.delete(`${API_BASE_URL}/user/account`, {
      headers: { Authorization: `Bearer ${authToken}` },
      data: { password: 'WrongPassword123!' }
    });
    
    logTest('Deletion with wrong password should have failed', false);
    log('Expected authentication error but request succeeded', 'red');
    return false;
  } catch (error) {
    if (error.response?.status === 401) {
      logTest('Deletion with wrong password correctly rejected', true);
      log(error.response.data.error || 'Authentication error', 'yellow');
      return true;
    } else {
      logTest('Deletion with wrong password failed with unexpected error', false);
      log(error.response?.data?.error || error.message, 'red');
      return false;
    }
  }
}

// Test 6: Successful account deletion
async function testSuccessfulDeletion() {
  logSection('Test 6: Successful Account Deletion');
  
  try {
    const response = await axios.delete(`${API_BASE_URL}/user/account`, {
      headers: { Authorization: `Bearer ${authToken}` },
      data: { password: TEST_CONFIG.testUser.password }
    });
    
    if (response.data.success) {
      logTest('Account deletion successful', true);
      log(`Deletion Time: ${response.data.data.deletedAt}`, 'blue');
      return true;
    } else {
      logTest('Account deletion failed - unexpected response', false);
      return false;
    }
  } catch (error) {
    logTest('Account deletion failed', false);
    log(error.response?.data?.error || error.message, 'red');
    return false;
  }
}

// Test 7: Verify deletion status after deletion
async function testVerifyDeletionStatus() {
  logSection('Test 7: Verify Deletion Status After Deletion');
  
  try {
    const response = await axios.get(`${API_BASE_URL}/user/account/deletion-status`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    if (response.data.success && response.data.data) {
      const status = response.data.data;
      logTest('Get deletion status after deletion successful', true);
      log(`Is Deleted: ${status.isDeleted}`, 'blue');
      
      if (status.isDeleted) {
        logTest('Account correctly marked as deleted', true);
        return true;
      } else {
        logTest('Account not marked as deleted', false);
        return false;
      }
    } else {
      logTest('Get deletion status failed - unexpected response', false);
      return false;
    }
  } catch (error) {
    // Token might be invalidated after deletion, which is expected
    if (error.response?.status === 401) {
      logTest('Token correctly invalidated after deletion', true);
      log('Authentication token is no longer valid (expected behavior)', 'yellow');
      return true;
    } else {
      logTest('Verify deletion status failed', false);
      log(error.response?.data?.error || error.message, 'red');
      return false;
    }
  }
}

// Test 8: Attempt to login with deleted account (should fail)
async function testLoginWithDeletedAccount() {
  logSection('Test 8: Attempt Login With Deleted Account (Should Fail)');
  
  try {
    const response = await axios.post(`${API_BASE_URL}/auth/login`, {
      email: TEST_CONFIG.testUser.email,
      password: TEST_CONFIG.testUser.password
    });
    
    logTest('Login with deleted account should have failed', false);
    log('Expected authentication error but login succeeded', 'red');
    return false;
  } catch (error) {
    if (error.response?.status === 401) {
      logTest('Login with deleted account correctly rejected', true);
      log(error.response.data.error || 'Authentication error', 'yellow');
      return true;
    } else {
      logTest('Login with deleted account failed with unexpected error', false);
      log(error.response?.data?.error || error.message, 'red');
      return false;
    }
  }
}

// Main test execution
async function runTests() {
  logSection('Account Deletion API Tests');
  log('Starting comprehensive account deletion tests...\n', 'cyan');
  
  const results = [];
  
  // Run tests in sequence
  results.push(await testRegisterUser());
  await delay(500);
  
  results.push(await testLoginUser());
  await delay(500);
  
  results.push(await testGetDeletionStatus());
  await delay(500);
  
  results.push(await testDeletionWithoutPassword());
  await delay(500);
  
  results.push(await testDeletionWithWrongPassword());
  await delay(500);
  
  results.push(await testSuccessfulDeletion());
  await delay(500);
  
  results.push(await testVerifyDeletionStatus());
  await delay(500);
  
  results.push(await testLoginWithDeletedAccount());
  
  // Summary
  logSection('Test Summary');
  const passed = results.filter(r => r).length;
  const total = results.length;
  const percentage = Math.round((passed / total) * 100);
  
  log(`Total Tests: ${total}`, 'blue');
  log(`Passed: ${passed}`, 'green');
  log(`Failed: ${total - passed}`, 'red');
  log(`Success Rate: ${percentage}%`, percentage === 100 ? 'green' : 'yellow');
  
  if (percentage === 100) {
    log('\n🎉 All tests passed! Account deletion functionality is working correctly.', 'green');
  } else {
    log('\n⚠️  Some tests failed. Please review the errors above.', 'yellow');
  }
  
  console.log('\n');
}

// Run the tests
runTests().catch(error => {
  log('\n❌ Fatal error during test execution:', 'red');
  log(error.message, 'red');
  console.error(error);
  process.exit(1);
});
