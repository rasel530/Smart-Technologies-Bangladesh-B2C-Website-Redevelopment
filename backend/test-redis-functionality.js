const { sessionService } = require('./services/sessionService');
const { loginSecurityService } = require('./services/loginSecurityService');

console.log('🧪 Testing Redis Functionality After Fix');
console.log('==========================================');

async function testSessionService() {
  console.log('\n🔍 Testing Session Service Redis Operations:');
  
  try {
    // Test 1: Create session
    console.log('   Creating test session...');
    const sessionResult = await sessionService.createSession(1, {
      ip: '127.0.0.1',
      get: (header) => header['user-agent'] || 'test-agent'
    }, {
      loginType: 'test',
      rememberMe: false,
      securityLevel: 'test'
    });

    if (sessionResult.sessionId) {
      console.log('   ✅ Session created successfully:', sessionResult.sessionId);
      
      // Test 2: Validate session
      console.log('   Validating session...');
      const validation = await sessionService.validateSession(sessionResult.sessionId, {
        ip: '127.0.0.1',
        get: (header) => header['user-agent'] || 'test-agent'
      });

      if (validation.valid) {
        console.log('   ✅ Session validated successfully');
        
        // Test 3: Store data in session
        console.log('   Storing test data in session...');
        await sessionService.redis.set(`test_data:${sessionResult.sessionId}`, JSON.stringify({
          testData: 'success',
          timestamp: new Date().toISOString()
        }));
        
        // Test 4: Retrieve session data
        console.log('   Retrieving session data...');
        const sessionData = await sessionService.redis.get(`test_data:${sessionResult.sessionId}`);
        
        if (sessionData) {
          console.log('   ✅ Session data retrieved successfully:', JSON.parse(sessionData));
        } else {
          console.log('   ❌ Failed to retrieve session data');
        }
        
        // Test 5: Destroy session
        console.log('   Destroying session...');
        const destroyResult = await sessionService.destroySession(sessionResult.sessionId, 'test_complete');
        
        if (destroyResult.success) {
          console.log('   ✅ Session destroyed successfully');
        } else {
          console.log('   ❌ Failed to destroy session:', destroyResult.reason);
        }
      } else {
        console.log('   ❌ Session validation failed:', validation.reason);
      }
    } else {
      console.log('   ❌ Failed to create session');
    }
    
    // Test 6: Get session statistics
    console.log('   Getting session statistics...');
    const stats = await sessionService.getSessionStats();
    
    if (stats.success) {
      console.log('   ✅ Session stats retrieved:', stats.stats);
    } else {
      console.log('   ❌ Failed to get session stats:', stats.reason);
    }
    
  } catch (error) {
    console.error('   ❌ Session service test failed:', error.message);
  }
}

async function testLoginSecurityService() {
  console.log('\n🔍 Testing Login Security Service Redis Operations:');
  
  try {
    // Test 1: Record failed attempt
    console.log('   Recording failed login attempt...');
    await loginSecurityService.recordFailedAttempt('test@example.com', '127.0.0.1', 'test-agent', 'invalid_password');
    
    // Test 2: Check lockout status
    console.log('   Checking lockout status...');
    const lockoutStatus = await loginSecurityService.isUserLockedOut('test@example.com');
    
    if (lockoutStatus.isLocked) {
      console.log('   ✅ User locked out successfully');
    } else {
      console.log('   ✅ User not locked out');
    }
    
    // Test 3: Get login attempt stats
    console.log('   Getting login attempt statistics...');
    const stats = await loginSecurityService.getLoginAttemptStats('test@example.com', '127.0.0.1');
    
    console.log('   ✅ Login attempt stats:', {
      userAttempts: stats.userAttempts,
      ipAttempts: stats.ipAttempts,
      isUserLocked: stats.isUserLocked,
      isIPBlocked: stats.isIPBlocked,
      captchaRequired: stats.captchaRequired,
      progressiveDelay: stats.progressiveDelay
    });
    
    // Test 4: Clear failed attempts
    console.log('   Clearing failed attempts...');
    await loginSecurityService.clearFailedAttempts('test@example.com', '127.0.0.1');
    console.log('   ✅ Failed attempts cleared');
    
  } catch (error) {
    console.error('   ❌ Login security service test failed:', error.message);
  }
}

async function testRedisHealth() {
  console.log('\n🔍 Testing Redis Health and Connectivity:');
  
  try {
    // Test basic Redis operations
    const testKey = 'health_check_' + Date.now();
    const testValue = 'redis_is_working_' + Date.now();
    
    // Set test value
    await sessionService.redis.set(testKey, testValue);
    console.log('   ✅ Set test value in Redis');
    
    // Get test value
    const retrievedValue = await sessionService.redis.get(testKey);
    console.log('   ✅ Retrieved test value:', retrievedValue);
    
    // Verify value matches
    if (retrievedValue === testValue) {
      console.log('   ✅ Redis read/write test passed');
    } else {
      console.log('   ❌ Redis read/write test failed');
    }
    
    // Test expiration
    await sessionService.redis.setEx('expire_test', 'will_expire', 5);
    console.log('   ✅ Set value with 5 second expiration');
    
    // Test connection status
    const pingResult = await sessionService.redis.ping();
    console.log('   ✅ Redis ping successful:', pingResult);
    
  } catch (error) {
    console.error('   ❌ Redis health test failed:', error.message);
  }
}

// Run all tests
async function runAllTests() {
  console.log('\n🚀 Starting Comprehensive Redis Functionality Tests');
  console.log('================================================');
  
  await testSessionService();
  await testLoginSecurityService();
  await testRedisHealth();
  
  console.log('\n🎉 All Redis Functionality Tests Completed!');
  console.log('================================================');
}

// Execute tests
runAllTests().then(() => {
  console.log('\n✅ Redis functionality verification completed successfully');
  process.exit(0);
}).catch(error => {
  console.error('\n❌ Redis functionality verification failed:', error.message);
  process.exit(1);
});