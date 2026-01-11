/**
 * Test Login Without Demo Data
 * Tests complete login flow with real user registration and authentication
 */

const axios = require('axios');
const { PrismaClient } = require('@prisma/client');

const API_BASE_URL = 'http://localhost:3001/api/v1';
const prisma = new PrismaClient();

// Test user credentials
const TEST_USER = {
  email: `testuser${Date.now()}@smarttech.bd`,
  password: 'SecureP@ssw0rd!2026',
  confirmPassword: 'SecureP@ssw0rd!2026',
  firstName: 'Test',
  lastName: 'User',
  phone: '+8801712345679'
};

async function cleanupTestUser(email) {
  try {
    await prisma.user.delete({
      where: { email }
    });
    console.log('✅ Cleaned up test user');
  } catch (error) {
    // User doesn't exist, that's fine
  }
}

async function testRegistration() {
  console.log('\n═══════════════════════════════════════════');
  console.log('STEP 1: Testing User Registration');
  console.log('═══════════════════════════════════════════\n');

  try {
    const response = await axios.post(`${API_BASE_URL}/auth/register`, TEST_USER);
    
    console.log('✅ Registration successful');
    console.log('   User ID:', response.data.user.id);
    console.log('   Email:', response.data.user.email);
    console.log('   Status:', response.data.user.status);
    console.log('   Testing Mode:', response.data.testingMode || false);
    
    return response.data.user;
  } catch (error) {
    console.log('❌ Registration failed:', error.response?.data?.error || error.message);
    if (error.response?.data) {
      console.log('   Details:', JSON.stringify(error.response.data, null, 2));
    }
    throw error;
  }
}

async function testLogin(identifier, password) {
  console.log('\n═══════════════════════════════════════════');
  console.log('STEP 2: Testing Login');
  console.log('═══════════════════════════════════════════\n');

  const startTime = Date.now();

  try {
    console.log('Attempting login with:', { identifier, password: '***' });
    
    const response = await axios.post(`${API_BASE_URL}/auth/login`, {
      identifier,
      password
    }, {
      timeout: 30000 // 30 second timeout
    });

    const duration = Date.now() - startTime;
    
    console.log('✅ Login successful');
    console.log('   Duration:', duration + 'ms');
    console.log('   User ID:', response.data.user.id);
    console.log('   User Email:', response.data.user.email);
    console.log('   User Name:', `${response.data.user.firstName} ${response.data.user.lastName}`);
    console.log('   User Status:', response.data.user.status);
    console.log('   Session ID:', response.data.sessionId);
    console.log('   Token:', response.data.token ? 'Present' : 'Missing');
    console.log('   Expires At:', response.data.expiresAt);
    console.log('   Max Age:', response.data.maxAge);
    console.log('   Login Type:', response.data.loginType);
    console.log('   Remember Me:', response.data.rememberMe);

    if (!response.data.user?.id || !response.data.token || !response.data.sessionId) {
      console.log('\n❌ Login response incomplete');
      console.log('   Missing required fields:', {
        user: !!response.data.user,
        token: !!response.data.token,
        sessionId: !!response.data.sessionId
      });
      return null;
    }

    return response.data;
  } catch (error) {
    const duration = Date.now() - startTime;
    console.log('❌ Login failed after', duration + 'ms');
    
    if (error.code === 'ECONNABORTED') {
      console.log('   Error: Request timeout (30s)');
      console.log('   This indicates the server is not responding');
    } else if (error.response) {
      console.log('   Status:', error.response.status);
      console.log('   Error:', error.response.data?.error || 'Unknown error');
      console.log('   Message:', error.response.data?.message || 'No message');
      console.log('   MessageBn:', error.response.data?.messageBn || 'N/A');
    } else {
      console.log('   Error:', error.message);
    }
    
    return null;
  }
}

async function testProtectedAPI(token, sessionId) {
  console.log('\n═══════════════════════════════════════════');
  console.log('STEP 3: Testing Protected API Access');
  console.log('═══════════════════════════════════════════\n');

  try {
    // Test with Bearer token
    const profileResponse = await axios.get(`${API_BASE_URL}/profile/me`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    console.log('✅ Protected API access successful (Bearer token)');
    console.log('   Profile:', `${profileResponse.data.user.firstName} ${profileResponse.data.user.lastName}`);
    console.log('   Email:', profileResponse.data.user.email);

    // Test with session cookie
    const sessionResponse = await axios.get(`${API_BASE_URL}/profile/me`, {
      headers: {
        'Cookie': `sessionId=${sessionId}`
      }
    });

    console.log('✅ Protected API access successful (Session cookie)');
    console.log('   Profile:', `${sessionResponse.data.user.firstName} ${sessionResponse.data.user.lastName}`);

    return true;
  } catch (error) {
    console.log('❌ Protected API access failed');
    console.log('   Error:', error.response?.data?.error || error.message);
    return false;
  }
}

async function testLogout(token, sessionId) {
  console.log('\n═══════════════════════════════════════════');
  console.log('STEP 4: Testing Logout');
  console.log('═══════════════════════════════════════════\n');

  try {
    const response = await axios.post(`${API_BASE_URL}/auth/logout`, {}, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    console.log('✅ Logout successful');
    console.log('   Message:', response.data.message);
    console.log('   MessageBn:', response.data.messageBn);

    // Verify token is invalid after logout
    try {
      await axios.get(`${API_BASE_URL}/profile/me`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      console.log('⚠️  Warning: Token still valid after logout');
      return false;
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('✅ Token correctly invalidated after logout');
        return true;
      }
    }
  } catch (error) {
    console.log('❌ Logout failed');
    console.log('   Error:', error.response?.data?.error || error.message);
    return false;
  }
}

async function testInvalidLogin(identifier, password) {
  console.log('\n═══════════════════════════════════════════');
  console.log('STEP 5: Testing Invalid Login (Security Check)');
  console.log('═══════════════════════════════════════════\n');

  try {
    const response = await axios.post(`${API_BASE_URL}/auth/login`, {
      identifier,
      password
    });

    console.log('❌ Security check failed - Invalid credentials accepted');
    return false;
  } catch (error) {
    if (error.response?.status === 401) {
      console.log('✅ Security check passed - Invalid credentials rejected');
      console.log('   Error:', error.response.data.error);
      console.log('   Message:', error.response.data.message);
      console.log('   MessageBn:', error.response.data.messageBn);
      return true;
    } else {
      console.log('❌ Unexpected error:', error.response?.data?.error || error.message);
      return false;
    }
  }
}

async function runCompleteTest() {
  console.log('\n╔══════════════════════════════════════════════╗');
  console.log('║  COMPLETE LOGIN FLOW TEST (WITHOUT DEMO DATA)   ║');
  console.log('╚══════════════════════════════════════════════╝');

  let testResults = {
    registration: false,
    login: false,
    protectedAPI: false,
    logout: false,
    invalidLogin: false
  };

  try {
    // Step 1: Register new user
    const user = await testRegistration();
    if (user) {
      testResults.registration = true;

      // Step 2: Login with registered user
      const loginData = await testLogin(TEST_USER.email, TEST_USER.password);
      if (loginData) {
        testResults.login = true;

        // Step 3: Test protected API access
        const apiSuccess = await testProtectedAPI(loginData.token, loginData.sessionId);
        if (apiSuccess) {
          testResults.protectedAPI = true;

          // Step 4: Test logout
          const logoutSuccess = await testLogout(loginData.token, loginData.sessionId);
          if (logoutSuccess) {
            testResults.logout = true;
          }
        }
      }
    }

    // Step 5: Test invalid login (security check)
    const invalidLoginSuccess = await testInvalidLogin('wrong@email.com', 'wrongpassword');
    if (invalidLoginSuccess) {
      testResults.invalidLogin = true;
    }

  } catch (error) {
    console.log('\n❌ Test suite failed with error:', error.message);
  } finally {
    // Cleanup test user
    await cleanupTestUser(TEST_USER.email);
    await prisma.$disconnect();
  }

  // Print summary
  console.log('\n═══════════════════════════════════════════');
  console.log('TEST SUMMARY');
  console.log('═══════════════════════════════════════════\n');

  const results = [
    { name: 'User Registration', passed: testResults.registration },
    { name: 'User Login', passed: testResults.login },
    { name: 'Protected API Access', passed: testResults.protectedAPI },
    { name: 'User Logout', passed: testResults.logout },
    { name: 'Invalid Login Rejection', passed: testResults.invalidLogin }
  ];

  results.forEach(result => {
    const status = result.passed ? '✅ PASS' : '❌ FAIL';
    console.log(`${status} - ${result.name}`);
  });

  const allPassed = results.every(r => r.passed);
  console.log('\n' + (allPassed ? '✅' : '❌') + ' Overall Result:', allPassed ? 'ALL TESTS PASSED' : 'SOME TESTS FAILED');
  console.log('\n═══════════════════════════════════════════\n');

  return allPassed;
}

// Run the test
runCompleteTest()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
