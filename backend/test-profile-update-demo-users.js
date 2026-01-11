/**
 * Final Comprehensive Test: Profile Update with Demo Users
 * 
 * This test verifies profile updates work correctly with all demo users
 * from the database to ensure the fix is complete and permanent.
 */

const axios = require('axios');

const API_BASE_URL = 'http://localhost:3001/api/v1';

// Demo users from database
const demoUsers = [
  {
    email: 'customer@example.com',
    password: 'customer123',
    role: 'CUSTOMER',
    description: 'Regular customer user'
  },
  {
    email: 'admin@smarttech.com',
    password: 'admin123',
    role: 'ADMIN',
    description: 'Administrator user'
  },
  {
    email: 'manager@smarttech.com',
    password: 'manager123',
    role: 'MANAGER',
    description: 'Manager user'
  }
];

// Test results tracking
const testResults = {
  total: 0,
  passed: 0,
  failed: 0,
  details: []
};

console.log('╔══════════════════════════════════════════════════════════╗');
console.log('║     FINAL TEST: PROFILE UPDATE WITH DEMO USERS              ║');
console.log('╚══════════════════════════════════════════════════════════╝\n');

// Test login for a user
async function testLogin(user) {
  console.log(`\n=== Testing Login: ${user.email} ===`);
  
  try {
    const response = await axios.post(`${API_BASE_URL}/auth/login`, {
      identifier: user.email,
      password: user.password,
      rememberMe: false
    });

    console.log(`✓ Login successful for ${user.email}`);
    console.log(`  Role: ${user.role}`);
    console.log(`  Token length: ${response.data.token.length}`);
    console.log(`  Token preview: ${response.data.token.substring(0, 30)}...`);
    
    return {
      success: true,
      token: response.data.token,
      user: response.data.user
    };
  } catch (error) {
    console.log(`✗ Login failed for ${user.email}`);
    console.log(`  Error: ${error.response?.data?.message || error.message}`);
    return { success: false };
  }
}

// Test profile retrieval
async function testGetProfile(token, userEmail) {
  console.log(`\n  → Testing Profile Retrieval for ${userEmail}`);
  
  try {
    const response = await axios.get(`${API_BASE_URL}/profile/me`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    console.log(`  ✓ Profile retrieved successfully`);
    console.log(`    User ID: ${response.data.data.user.id}`);
    console.log(`    Email: ${response.data.data.user.email}`);
    console.log(`    First Name: ${response.data.data.user.firstName}`);
    console.log(`    Last Name: ${response.data.data.user.lastName}`);
    
    return {
      success: true,
      profile: response.data.data.user
    };
  } catch (error) {
    console.log(`  ✗ Failed to retrieve profile`);
    console.log(`    Error: ${error.response?.data?.message || error.message}`);
    return { success: false };
  }
}

// Test profile update
async function testUpdateProfile(token, userEmail, updateData) {
  console.log(`\n  → Testing Profile Update for ${userEmail}`);
  console.log(`    Update data: ${JSON.stringify(updateData)}`);
  
  try {
    const response = await axios.put(`${API_BASE_URL}/profile/me`, updateData, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    console.log(`  ✓ Profile updated successfully`);
    console.log(`    Updated First Name: ${response.data.data.user.firstName}`);
    console.log(`    Updated Last Name: ${response.data.data.user.lastName}`);
    console.log(`    Updated At: ${response.data.data.user.updatedAt}`);
    
    return {
      success: true,
      updatedUser: response.data.data.user
    };
  } catch (error) {
    console.log(`  ✗ Failed to update profile`);
    console.log(`    Error: ${error.response?.data?.message || error.message}`);
    if (error.response?.data?.error) {
      console.log(`    Error Type: ${error.response.data.error}`);
    }
    return { success: false };
  }
}

// Test profile update without token (should fail)
async function testUpdateProfileWithoutToken() {
  console.log(`\n=== Testing Profile Update Without Token (Should Fail) ===`);
  
  try {
    const response = await axios.put(`${API_BASE_URL}/profile/me`, {
      firstName: 'Test',
      lastName: 'User'
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    console.log(`✗ Profile updated without token (should have failed)`);
    return { success: false };
  } catch (error) {
    console.log(`✓ Correctly rejected without token`);
    console.log(`  Error: ${error.response?.data?.message || error.message}`);
    return { success: true };
  }
}

// Test profile update with invalid token (should fail)
async function testUpdateProfileWithInvalidToken() {
  console.log(`\n=== Testing Profile Update With Invalid Token (Should Fail) ===`);
  
  try {
    const response = await axios.put(`${API_BASE_URL}/profile/me`, {
      firstName: 'Test',
      lastName: 'User'
    }, {
      headers: {
        'Authorization': 'Bearer invalid_token_here',
        'Content-Type': 'application/json'
      }
    });

    console.log(`✗ Profile updated with invalid token (should have failed)`);
    return { success: false };
  } catch (error) {
    console.log(`✓ Correctly rejected with invalid token`);
    console.log(`  Error: ${error.response?.data?.message || error.message}`);
    return { success: true };
  }
}

// Main test function
async function runTests() {
  console.log('Starting comprehensive profile update tests with demo users...\n');
  
  // Test each demo user
  for (const demoUser of demoUsers) {
    console.log(`\n${'='.repeat(70)}`);
    console.log(`TESTING: ${demoUser.description} (${demoUser.role})`);
    console.log('='.repeat(70));
    
    // Test 1: Login
    testResults.total++;
    const loginResult = await testLogin(demoUser);
    if (loginResult.success) {
      testResults.passed++;
      testResults.details.push({
        test: `Login - ${demoUser.email}`,
        status: 'PASS',
        details: `Token length: ${loginResult.token.length}`
      });
      
      // Test 2: Get Profile
      testResults.total++;
      const profileResult = await testGetProfile(loginResult.token, demoUser.email);
      if (profileResult.success) {
        testResults.passed++;
        testResults.details.push({
          test: `Get Profile - ${demoUser.email}`,
          status: 'PASS',
          details: `User ID: ${profileResult.profile.id}`
        });
        
        // Test 3: Update Profile
        testResults.total++;
        const updateResult = await testUpdateProfile(
          loginResult.token,
          demoUser.email,
          {
            firstName: `Updated ${demoUser.role}`,
            lastName: `Test User ${Date.now()}`
          }
        );
        
        if (updateResult.success) {
          testResults.passed++;
          testResults.details.push({
            test: `Update Profile - ${demoUser.email}`,
            status: 'PASS',
            details: `Updated at: ${updateResult.updatedUser.updatedAt}`
          });
        } else {
          testResults.failed++;
          testResults.details.push({
            test: `Update Profile - ${demoUser.email}`,
            status: 'FAIL',
            details: 'Profile update failed'
          });
        }
      } else {
        testResults.failed++;
        testResults.details.push({
          test: `Get Profile - ${demoUser.email}`,
          status: 'FAIL',
          details: 'Profile retrieval failed'
        });
      }
    } else {
      testResults.failed++;
      testResults.details.push({
        test: `Login - ${demoUser.email}`,
        status: 'FAIL',
        details: 'Login failed'
      });
    }
  }
  
  // Test 4: Update without token (should fail)
  testResults.total++;
  const noTokenResult = await testUpdateProfileWithoutToken();
  if (noTokenResult.success) {
    testResults.passed++;
    testResults.details.push({
      test: 'Update Without Token',
      status: 'PASS',
      details: 'Correctly rejected'
    });
  } else {
    testResults.failed++;
    testResults.details.push({
      test: 'Update Without Token',
      status: 'FAIL',
      details: 'Should have been rejected'
    });
  }
  
  // Test 5: Update with invalid token (should fail)
  testResults.total++;
  const invalidTokenResult = await testUpdateProfileWithInvalidToken();
  if (invalidTokenResult.success) {
    testResults.passed++;
    testResults.details.push({
      test: 'Update With Invalid Token',
      status: 'PASS',
      details: 'Correctly rejected'
    });
  } else {
    testResults.failed++;
    testResults.details.push({
      test: 'Update With Invalid Token',
      status: 'FAIL',
      details: 'Should have been rejected'
    });
  }
  
  // Print summary
  console.log('\n\n');
  console.log('╔══════════════════════════════════════════════════════════╗');
  console.log('║                     TEST SUMMARY                              ║');
  console.log('╚══════════════════════════════════════════════════════════╝\n');
  
  console.log(`Total Tests: ${testResults.total}`);
  console.log(`Passed: ${testResults.passed}`);
  console.log(`Failed: ${testResults.failed}`);
  console.log(`Success Rate: ${((testResults.passed / testResults.total) * 100).toFixed(1)}%\n`);
  
  console.log('Test Details:');
  console.log('-'.repeat(70));
  testResults.details.forEach((detail, index) => {
    const statusIcon = detail.status === 'PASS' ? '✓' : '✗';
    console.log(`${index + 1}. ${statusIcon} ${detail.test}`);
    console.log(`   Status: ${detail.status}`);
    console.log(`   Details: ${detail.details}`);
    console.log('');
  });
  
  console.log('='.repeat(70));
  
  if (testResults.failed === 0) {
    console.log('\n✓ ALL TESTS PASSED! Profile update is working correctly.\n');
    console.log('✓ No "No token provided" errors');
    console.log('✓ No "Invalid token" errors');
    console.log('✓ Profile updates work for all demo users');
    console.log('✓ Security checks working (rejects invalid tokens)\n');
  } else {
    console.log('\n✗ SOME TESTS FAILED. Please review errors above.\n');
  }
  
  console.log('='.repeat(70));
  console.log('\n');
}

// Run tests
runTests().catch(error => {
  console.error('Test execution failed:', error);
  process.exit(1);
});
