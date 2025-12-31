// Login Implementation Diagnosis Script
// This script validates our assumptions about Redis and JWT issues

const { configService } = require('./services/config');
const { sessionService } = require('./services/sessionService');
const { loginSecurityService } = require('./services/loginSecurityService');
const { loggerService } = require('./services/logger');

async function diagnoseLoginImplementation() {
  console.log('=== LOGIN IMPLEMENTATION DIAGNOSIS ===');
  console.log('Timestamp:', new Date().toISOString());
  console.log('');

  // 1. Check Redis Connection Status
  console.log('1. REDIS CONNECTION STATUS');
  console.log('--------------------------');
  
  try {
    // Check session service Redis
    console.log('Session Service Redis Status:', sessionService.redis ? 'Connected' : 'Not Connected');
    if (sessionService.redis) {
      try {
        await sessionService.redis.ping();
        console.log('Session Service Redis Ping: SUCCESS');
      } catch (pingError) {
        console.log('Session Service Redis Ping: FAILED -', pingError.message);
      }
    }
    
    // Check login security service Redis
    console.log('Login Security Redis Status:', loginSecurityService.redis ? 'Connected' : 'Not Connected');
    if (loginSecurityService.redis) {
      try {
        await loginSecurityService.redis.ping();
        console.log('Login Security Redis Ping: SUCCESS');
      } catch (pingError) {
        console.log('Login Security Redis Ping: FAILED -', pingError.message);
      }
    }
  } catch (error) {
    console.log('Redis Connection Check Error:', error.message);
  }
  
  console.log('');

  // 2. Check JWT Configuration
  console.log('2. JWT CONFIGURATION');
  console.log('--------------------');
  
  const jwtSecret = configService.get('JWT_SECRET');
  const jwtExpiryEnv = configService.get('JWT_EXPIRES_IN');
  const jwtExpiryAuth = configService.get('JWT_EXPIRY');
  
  console.log('JWT_SECRET:', jwtSecret ? 'CONFIGURED' : 'MISSING');
  console.log('JWT_EXPIRES_IN (from .env):', jwtExpiryEnv || 'NOT SET');
  console.log('JWT_EXPIRY (from config):', jwtExpiryAuth || 'NOT SET');
  
  // Check for inconsistency
  if (jwtExpiryEnv && jwtExpiryAuth) {
    const envMinutes = parseTimeToMinutes(jwtExpiryEnv);
    const authMinutes = parseTimeToMinutes(jwtExpiryAuth);
    console.log('JWT_EXPIRES_IN in minutes:', envMinutes);
    console.log('JWT_EXPIRY in minutes:', authMinutes);
    
    if (envMinutes !== authMinutes) {
      console.log('⚠️  JWT CONFIGURATION INCONSISTENCY DETECTED!');
    } else {
      console.log('✅ JWT Configuration is consistent');
    }
  }
  
  console.log('');

  // 3. Check Environment Configuration
  console.log('3. ENVIRONMENT CONFIGURATION');
  console.log('----------------------------');
  
  const redisUrl = configService.get('REDIS_URL');
  const nodeEnv = configService.get('NODE_ENV');
  const disableLoginSecurity = configService.get('DISABLE_LOGIN_SECURITY');
  
  console.log('REDIS_URL:', redisUrl ? 'CONFIGURED' : 'MISSING');
  console.log('NODE_ENV:', nodeEnv || 'NOT SET');
  console.log('DISABLE_LOGIN_SECURITY:', disableLoginSecurity || 'NOT SET');
  
  console.log('');

  // 4. Test Session Creation
  console.log('4. SESSION CREATION TEST');
  console.log('------------------------');
  
  try {
    const testUserId = 'test-user-id';
    const testReq = {
      ip: '127.0.0.1',
      get: (header) => {
        const headers = {
          'User-Agent': 'Login-Diagnosis-Script/1.0',
          'Accept-Language': 'en-US,en;q=0.9',
          'Accept-Encoding': 'gzip, deflate, br'
        };
        return headers[header];
      }
    };
    
    const sessionResult = await sessionService.createSession(testUserId, testReq, {
      loginType: 'test',
      rememberMe: false,
      maxAge: 5 * 60 * 1000 // 5 minutes for testing
    });
    
    if (sessionResult.sessionId) {
      console.log('✅ Session Creation: SUCCESS');
      console.log('Session ID:', sessionResult.sessionId);
      console.log('Expires At:', sessionResult.expiresAt);
      
      // Test session validation
      const validation = await sessionService.validateSession(sessionResult.sessionId, testReq);
      console.log('Session Validation:', validation.valid ? 'SUCCESS' : 'FAILED');
      if (!validation.valid) {
        console.log('Validation Reason:', validation.reason);
      }
      
      // Clean up test session
      await sessionService.destroySession(sessionResult.sessionId, 'diagnosis_cleanup');
      console.log('✅ Session Cleanup: SUCCESS');
    } else {
      console.log('❌ Session Creation: FAILED');
    }
  } catch (error) {
    console.log('❌ Session Test Error:', error.message);
  }
  
  console.log('');

  // 5. Check Login Security Configuration
  console.log('5. LOGIN SECURITY CONFIGURATION');
  console.log('--------------------------------');
  
  const securityConfig = loginSecurityService.getSecurityConfig();
  console.log('Max Login Attempts:', securityConfig.maxAttempts);
  console.log('Attempt Window:', securityConfig.attemptWindow + 'ms');
  console.log('Lockout Duration:', securityConfig.lockoutDuration + 'ms');
  console.log('IP Max Attempts:', securityConfig.ipMaxAttempts);
  console.log('IP Block Duration:', securityConfig.ipBlockDuration + 'ms');
  console.log('Progressive Delay Enabled:', securityConfig.delayEnabled);
  console.log('Captcha Enabled:', securityConfig.captchaEnabled);
  
  console.log('');

  // 6. Summary
  console.log('6. DIAGNOSIS SUMMARY');
  console.log('--------------------');
  
  const redisConnected = sessionService.redis && loginSecurityService.redis;
  const jwtConfigured = jwtSecret && jwtExpiryEnv;
  
  if (!redisConnected) {
    console.log('❌ CRITICAL: Redis connection issues detected');
    console.log('   - Session service and login security will fall back to database');
    console.log('   - Rate limiting and security features will be degraded');
  }
  
  if (!jwtConfigured) {
    console.log('❌ CRITICAL: JWT configuration issues detected');
    console.log('   - Token generation and validation will fail');
  }
  
  if (redisConnected && jwtConfigured) {
    console.log('✅ Core authentication components are properly configured');
  }
  
  console.log('');
  console.log('=== END DIAGNOSIS ===');
}

// Helper function to parse time strings to minutes
function parseTimeToMinutes(timeString) {
  if (!timeString) return 0;
  
  const unit = timeString.slice(-1);
  const value = parseInt(timeString.slice(0, -1));
  
  switch (unit) {
    case 's': return value / 60;
    case 'm': return value;
    case 'h': return value * 60;
    case 'd': return value * 60 * 24;
    default: return 0;
  }
}

// Run diagnosis
if (require.main === module) {
  diagnoseLoginImplementation().catch(console.error);
}

module.exports = { diagnoseLoginImplementation };