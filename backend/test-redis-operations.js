const { configService } = require('./services/config');
const { sessionService } = require('./services/sessionService');
const { loginSecurityService } = require('./services/loginSecurityService');

console.log('Testing Redis operations through services...');

async function testRedisOperations() {
  try {
    console.log('1. Loading Redis URL from config...');
    const redisUrl = configService.get('REDIS_URL');
    console.log('Redis URL:', redisUrl);
    
    // Test session service operations
    console.log('2. Testing sessionService operations...');
    const testSessionId = 'test-session-' + Date.now();
    
    // Store a session
    const mockReq = {
      ip: '127.0.0.1',
      get: (header) => header === 'User-Agent' ? 'Mozilla/5.0 Test Agent' : null
    };
    
    await sessionService.createSession('test-user-123', mockReq, {
      rememberMe: false,
      loginType: 'password'
    });
    console.log('✅ Session created successfully');
    
    // Retrieve the session
    const validation = await sessionService.validateSession(testSessionId, mockReq);
    if (validation.valid && validation.session && validation.session.userId === 'test-user-123') {
      console.log('✅ Session retrieved successfully');
    } else {
      console.log('❌ Session retrieval failed:', validation.reason);
    }
    
    // Test login security service operations
    console.log('3. Testing loginSecurityService operations...');
    const testIp = '192.168.1.100';
    
    // Record a failed login attempt
    await loginSecurityService.recordFailedAttempt('test@example.com', testIp, 'Mozilla/5.0 Test Agent');
    console.log('✅ Failed login attempt recorded successfully');
    
    // Check if user is locked out
    const lockoutStatus = await loginSecurityService.isUserLockedOut('test@example.com');
    console.log('User lockout status:', lockoutStatus);
    
    // Check login attempt statistics
    const stats = await loginSecurityService.getLoginAttemptStats('test@example.com', testIp);
    console.log('Login attempt stats:', stats);
    
    // Clean up test data
    await sessionService.destroySession(testSessionId);
    await loginSecurityService.clearFailedAttempts('test@example.com', testIp);
    console.log('✅ Test data cleaned up');
    
    console.log('✅ All Redis operations working successfully!');
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error testing Redis operations:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

testRedisOperations();