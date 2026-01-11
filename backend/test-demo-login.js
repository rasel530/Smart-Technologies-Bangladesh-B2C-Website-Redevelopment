/**
 * Simple Demo Login Test
 * Tests login with existing demo users
 */

const axios = require('axios');

const API_BASE_URL = 'http://localhost:3001/api/v1';

// Demo user credentials
const DEMO_USERS = [
  { 
    email: 'demo.user1@smarttech.bd', 
    password: 'Demo123456',
    name: 'Rahim Ahmed'
  },
  { 
    email: 'demo.user2@smarttech.bd', 
    password: 'Demo123456',
    name: 'Fatima Begum'
  },
  { 
    email: 'demo.user3@smarttech.bd', 
    password: 'Demo123456',
    name: 'Karim Hossain'
  }
];

async function testLogin(user) {
  console.log(`\nTesting login for: ${user.name}`);
  console.log(`Email: ${user.email}`);
  console.log(`Password: ${user.password.replace(/./g, '*')}`);

  const startTime = Date.now();

  try {
    const response = await axios.post(`${API_BASE_URL}/auth/login`, {
      identifier: user.email,
      password: user.password
    }, {
      timeout: 30000 // 30 second timeout
    });

    const duration = Date.now() - startTime;
    
    console.log(`\n✅ Login SUCCESSFUL!`);
    console.log(`   Duration: ${duration}ms`);
    console.log(`   Status: ${response.status}`);
    console.log(`   User ID: ${response.data.user.id}`);
    console.log(`   User Email: ${response.data.user.email}`);
    console.log(`   User Name: ${response.data.user.firstName} ${response.data.user.lastName}`);
    console.log(`   User Status: ${response.data.user.status}`);
    console.log(`   Session ID: ${response.data.sessionId}`);
    console.log(`   Token: ${response.data.token ? 'Present ✓' : 'Missing ✗'}`);
    console.log(`   Expires At: ${response.data.expiresAt}`);
    console.log(`   Login Type: ${response.data.loginType}`);

    if (!response.data.user?.id || !response.data.token || !response.data.sessionId) {
      console.log('\n⚠️  WARNING: Login response incomplete!');
      console.log('   Missing fields:', {
        user: !!response.data.user,
        token: !!response.data.token,
        sessionId: !!response.data.sessionId
      });
      return false;
    }

    return true;
  } catch (error) {
    const duration = Date.now() - startTime;
    console.log(`\n❌ Login FAILED after ${duration}ms`);
    
    if (error.code === 'ECONNABORTED') {
      console.log('   Error: Request timeout (30s)');
      console.log('   This indicates the server is not responding');
    } else if (error.response) {
      console.log(`   Status: ${error.response.status}`);
      console.log(`   Error: ${error.response.data?.error || 'Unknown error'}`);
      console.log(`   Message: ${error.response.data?.message || 'No message'}`);
      console.log(`   MessageBn: ${error.response.data?.messageBn || 'N/A'}`);
    } else {
      console.log(`   Error: ${error.message}`);
      console.log(`   Code: ${error.code}`);
    }
    
    return false;
  }
}

async function runTests() {
  console.log('╔═══════════════════════════════════════════════╗');
  console.log('║       DEMO USER LOGIN TEST                      ║');
  console.log('╚═════════════════════════════════════════════════╝');

  let successCount = 0;
  let failCount = 0;

  for (const user of DEMO_USERS) {
    const success = await testLogin(user);
    if (success) {
      successCount++;
    } else {
      failCount++;
    }
    
    // Wait a bit between tests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  // Print summary
  console.log('\n╔═══════════════════════════════════════════════════╗');
  console.log('║                    TEST SUMMARY                    ║');
  console.log('╚═════════════════════════════════════════════════════╝\n');

  console.log(`Total Tests: ${DEMO_USERS.length}`);
  console.log(`✅ Successful: ${successCount}`);
  console.log(`❌ Failed: ${failCount}`);
  console.log(`Success Rate: ${((successCount / DEMO_USERS.length) * 100).toFixed(1)}%`);

  if (successCount === DEMO_USERS.length) {
    console.log('\n🎉 ALL TESTS PASSED! Login is working correctly.');
  } else {
    console.log('\n⚠️  SOME TESTS FAILED. Check backend logs for details.');
  }
}

// Run tests
runTests()
  .then(() => {
    console.log('\n✅ Test suite completed');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  });
