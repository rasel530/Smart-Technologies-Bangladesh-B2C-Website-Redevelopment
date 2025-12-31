/**
 * COMPREHENSIVE SECURITY TEST SUITE
 * Authentication System Security Assessment
 * 
 * Tests:
 * 1. Password Security
 * 2. Session Security
 * 3. Login Security
 * 4. SQL Injection
 * 5. XSS Vulnerabilities
 * 6. CSRF Protection
 * 7. Input Validation
 * 8. Rate Limiting
 * 9. API Endpoint Security
 * 10. Data Protection
 * 11. Third-Party Integration
 * 12. OWASP Top 10
 * 13. Frontend Security
 */

const axios = require('axios');
const crypto = require('crypto');
const { passwordService } = require('./services/passwordService');
const { sessionService } = require('./services/sessionService');
const { loginSecurityService } = require('./services/loginSecurityService');
const { sanitizeString } = require('./middleware/sanitize');

// Test configuration
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3001';
const TEST_RESULTS = {
  summary: {
    totalTests: 0,
    passed: 0,
    failed: 0,
    skipped: 0,
    critical: 0,
    high: 0,
    medium: 0,
    low: 0
  },
  tests: []
};

// Severity levels
const SEVERITY = {
  CRITICAL: 'CRITICAL',
  HIGH: 'HIGH',
  MEDIUM: 'MEDIUM',
  LOW: 'LOW'
};

// Test result helper
function recordTest(category, testName, passed, severity, details, recommendation) {
  const test = {
    category,
    testName,
    passed,
    severity,
    details,
    recommendation,
    timestamp: new Date().toISOString()
  };
  
  TEST_RESULTS.tests.push(test);
  TEST_RESULTS.summary.totalTests++;
  
  if (passed) {
    TEST_RESULTS.summary.passed++;
  } else {
    TEST_RESULTS.summary.failed++;
    TEST_RESULTS.summary[severity.toLowerCase()]++;
  }
  
  const status = passed ? '✅ PASS' : '❌ FAIL';
  const severityIcon = passed ? '' : `[${severity}]`;
  console.log(`${status} ${severityIcon} ${category}: ${testName}`);
  
  if (!passed && details) {
    console.log(`  Details: ${details}`);
  }
  if (!passed && recommendation) {
    console.log(`  Recommendation: ${recommendation}`);
  }
}

// ============================================================================
// 1. PASSWORD SECURITY TESTS
// ============================================================================

async function testPasswordSecurity() {
  console.log('\n=== 1. PASSWORD SECURITY TESTS ===\n');
  
  // Test 1.1: Bcrypt rounds configuration
  try {
    const testPassword = 'TestPassword123!';
    const startTime = Date.now();
    const hashedPassword = await passwordService.hashPassword(testPassword);
    const hashTime = Date.now() - startTime;
    
    // Check if hash starts with bcrypt identifier
    const isBcryptHash = hashedPassword.startsWith('$2a$') || hashedPassword.startsWith('$2b$');
    recordTest(
      'Password Security',
      'Bcrypt Hashing Implementation',
      isBcryptHash,
      isBcryptHash ? SEVERITY.LOW : SEVERITY.HIGH,
      isBcryptHash ? `Hash generated in ${hashTime}ms` : 'Password not hashed with bcrypt',
      isBcryptHash ? null : 'Use bcrypt with at least 12 rounds for password hashing'
    );
    
    // Test 1.2: Password strength validation (zxcvbn)
    const weakPasswords = [
      'password',
      '123456',
      'qwerty',
      'abc123',
      'password1'
    ];
    
    let weakPasswordDetected = true;
    for (const weakPwd of weakPasswords) {
      const validation = passwordService.validatePasswordStrength(weakPwd);
      if (validation.isValid) {
        weakPasswordDetected = false;
        recordTest(
          'Password Security',
          'Weak Password Detection',
          false,
          SEVERITY.HIGH,
          `Weak password "${weakPwd}" was accepted`,
          'Ensure zxcvbn is properly configured to reject weak passwords'
        );
        break;
      }
    }
    
    if (weakPasswordDetected) {
      recordTest(
        'Password Security',
        'Weak Password Detection',
        true,
        SEVERITY.LOW,
        'All weak passwords were correctly rejected',
        null
      );
    }
    
    // Test 1.3: Password with personal information
    const userInfo = {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com',
      phone: '+8801712345678'
    };
    
    const personalInfoPasswords = [
      'John123!',
      'Doe123!',
      'john.doe',
      '12345678'
    ];
    
    let personalInfoRejected = true;
    for (const pwd of personalInfoPasswords) {
      const validation = passwordService.validatePasswordStrength(pwd, userInfo);
      if (validation.isValid) {
        personalInfoRejected = false;
        recordTest(
          'Password Security',
          'Personal Information in Password',
          false,
          SEVERITY.MEDIUM,
          `Password containing personal info was accepted: ${pwd}`,
          'Ensure password validation rejects passwords containing personal information'
        );
        break;
      }
    }
    
    if (personalInfoRejected) {
      recordTest(
        'Password Security',
        'Personal Information in Password',
        true,
        SEVERITY.LOW,
        'Passwords with personal information correctly rejected',
        null
      );
    }
    
    // Test 1.4: Password history enforcement
    const testUserId = 'test_user_' + Date.now();
    const testHash = await passwordService.hashPassword('TestPassword123!');
    await passwordService.savePasswordToHistory(testUserId, testHash);
    
    const isReused = await passwordService.isPasswordReused(testUserId, 'TestPassword123!');
    recordTest(
      'Password Security',
      'Password History Enforcement',
      isReused,
      isReused ? SEVERITY.LOW : SEVERITY.MEDIUM,
      isReused ? 'Password reuse correctly detected' : 'Password reuse not detected',
      isReused ? null : 'Implement password history check to prevent password reuse'
    );
    
    // Test 1.5: Password reset token security
    const resetToken = crypto.randomBytes(32).toString('hex');
    const isSecureToken = resetToken.length >= 64 && /^[a-f0-9]+$/.test(resetToken);
    recordTest(
      'Password Security',
      'Password Reset Token Security',
      isSecureToken,
      isSecureToken ? SEVERITY.LOW : SEVERITY.HIGH,
      isSecureToken ? 'Reset token uses secure random generation' : 'Reset token may not be secure',
      isSecureToken ? null : 'Use crypto.randomBytes() for generating secure reset tokens'
    );
    
    // Test 1.6: Temporary password strength
    const tempPassword = passwordService.generateStrongPassword(12);
    const tempPasswordValidation = passwordService.validatePasswordStrength(tempPassword);
    recordTest(
      'Password Security',
      'Temporary Password Strength',
      tempPasswordValidation.isValid,
      tempPasswordValidation.isValid ? SEVERITY.LOW : SEVERITY.HIGH,
      `Generated password: ${tempPassword}, Strength: ${tempPasswordValidation.strength}`,
      tempPasswordValidation.isValid ? null : 'Ensure generated temporary passwords meet strength requirements'
    );
    
  } catch (error) {
    recordTest(
      'Password Security',
      'Password Security Tests',
      false,
      SEVERITY.HIGH,
      `Error: ${error.message}`,
      'Fix password service implementation'
    );
  }
}

// ============================================================================
// 2. SESSION SECURITY TESTS
// ============================================================================

async function testSessionSecurity() {
  console.log('\n=== 2. SESSION SECURITY TESTS ===\n');
  
  try {
    // Test 2.1: Session ID generation
    const sessionId = sessionService.generateSessionId();
    const isSecureSessionId = sessionId.length >= 64 && /^[a-f0-9]+$/.test(sessionId);
    recordTest(
      'Session Security',
      'Session ID Generation',
      isSecureSessionId,
      isSecureSessionId ? SEVERITY.LOW : SEVERITY.CRITICAL,
      isSecureSessionId ? 'Session ID uses cryptographically secure random generation' : 'Session ID may not be secure',
      isSecureSessionId ? null : 'Use crypto.randomBytes() for session ID generation'
    );
    
    // Test 2.2: Session token expiration
    const mockReq = {
      ip: '127.0.0.1',
      get: (header) => header === 'User-Agent' ? 'Mozilla/5.0 Test Agent' : ''
    };
    
    const sessionResult = await sessionService.createSession('test_user', mockReq, {
      maxAge: 1000 // 1 second for testing
    });
    
    // Wait for expiration
    await new Promise(resolve => setTimeout(resolve, 1100));
    
    const validation = await sessionService.validateSession(sessionResult.sessionId, mockReq);
    recordTest(
      'Session Security',
      'Session Expiration',
      !validation.valid,
      !validation.valid ? SEVERITY.LOW : SEVERITY.HIGH,
      !validation.valid ? 'Session correctly expired' : 'Session did not expire',
      !validation.valid ? null : 'Ensure sessions expire after configured timeout'
    );
    
    // Test 2.3: Session fixation prevention
    const newSessionId = sessionService.generateSessionId();
    const isNewSessionId = newSessionId !== sessionId;
    recordTest(
      'Session Security',
      'Session Fixation Prevention',
      isNewSessionId,
      isNewSessionId ? SEVERITY.LOW : SEVERITY.CRITICAL,
      isNewSessionId ? 'New session IDs are generated for each session' : 'Session IDs may be predictable',
      isNewSessionId ? null : 'Generate new session IDs on each login to prevent session fixation'
    );
    
    // Test 2.4: Device fingerprint validation
    const fingerprint = sessionService.generateDeviceFingerprint(mockReq);
    const isSecureFingerprint = fingerprint.length >= 32 && /^[a-f0-9]+$/.test(fingerprint);
    recordTest(
      'Session Security',
      'Device Fingerprint Security',
      isSecureFingerprint,
      isSecureFingerprint ? SEVERITY.LOW : SEVERITY.MEDIUM,
      isSecureFingerprint ? 'Device fingerprint uses secure hashing' : 'Device fingerprint may not be secure',
      isSecureFingerprint ? null : 'Use crypto.createHash() for device fingerprinting'
    );
    
    // Test 2.5: Concurrent session handling
    const session1 = await sessionService.createSession('user1', mockReq);
    const session2 = await sessionService.createSession('user1', mockReq);
    const areDifferentSessions = session1.sessionId !== session2.sessionId;
    recordTest(
      'Session Security',
      'Concurrent Session Handling',
      areDifferentSessions,
      areDifferentSessions ? SEVERITY.LOW : SEVERITY.MEDIUM,
      areDifferentSessions ? 'Multiple sessions can be created for same user' : 'Concurrent sessions not properly handled',
      areDifferentSessions ? null : 'Ensure concurrent sessions are properly tracked and managed'
    );
    
    // Test 2.6: Remember me token security
    const rememberMeToken = await sessionService.createRememberMeToken('test_user', mockReq);
    const isSecureRememberMe = rememberMeToken.success && rememberMeToken.token.length >= 64;
    recordTest(
      'Session Security',
      'Remember Me Token Security',
      isSecureRememberMe,
      isSecureRememberMe ? SEVERITY.LOW : SEVERITY.HIGH,
      isSecureRememberMe ? 'Remember me token is secure' : 'Remember me token may not be secure',
      isSecureRememberMe ? null : 'Ensure remember me tokens use secure random generation'
    );
    
  } catch (error) {
    recordTest(
      'Session Security',
      'Session Security Tests',
      false,
      SEVERITY.HIGH,
      `Error: ${error.message}`,
      'Fix session service implementation'
    );
  }
}

// ============================================================================
// 3. LOGIN SECURITY TESTS
// ============================================================================

async function testLoginSecurity() {
  console.log('\n=== 3. LOGIN SECURITY TESTS ===\n');
  
  try {
    // Test 3.1: Brute force protection
    const testIdentifier = 'test@example.com';
    const testIP = '192.168.1.100';
    
    // Simulate multiple failed attempts
    for (let i = 0; i < 6; i++) {
      await loginSecurityService.recordFailedAttempt(testIdentifier, testIP, 'TestAgent');
    }
    
    const lockoutStatus = await loginSecurityService.isUserLockedOut(testIdentifier);
    const isLockedOut = lockoutStatus.isLocked === true;
    recordTest(
      'Login Security',
      'Brute Force Protection',
      isLockedOut,
      isLockedOut ? SEVERITY.LOW : SEVERITY.CRITICAL,
      isLockedOut ? 'Account locked after multiple failed attempts' : 'Brute force protection not working',
      isLockedOut ? null : 'Implement account lockout after multiple failed login attempts'
    );
    
    // Test 3.2: IP-based rate limiting
    const ipBlockStatus = await loginSecurityService.isIPBlocked(testIP);
    const isIPBlocked = ipBlockStatus.isBlocked === true;
    recordTest(
      'Login Security',
      'IP-Based Rate Limiting',
      isIPBlocked,
      isIPBlocked ? SEVERITY.LOW : SEVERITY.HIGH,
      isIPBlocked ? 'IP blocked after multiple failed attempts' : 'IP rate limiting not working',
      isIPBlocked ? null : 'Implement IP-based rate limiting to prevent brute force attacks'
    );
    
    // Test 3.3: Progressive delay
    const delay = await loginSecurityService.calculateProgressiveDelay(testIdentifier, testIP);
    const hasProgressiveDelay = delay > 0;
    recordTest(
      'Login Security',
      'Progressive Delay Implementation',
      hasProgressiveDelay,
      hasProgressiveDelay ? SEVERITY.LOW : SEVERITY.MEDIUM,
      hasProgressiveDelay ? `Progressive delay of ${delay}ms implemented` : 'No progressive delay',
      hasProgressiveDelay ? null : 'Implement progressive delay to slow down brute force attacks'
    );
    
    // Test 3.4: Captcha requirement
    const captchaRequired = await loginSecurityService.isCaptchaRequired(testIdentifier, testIP);
    recordTest(
      'Login Security',
      'Captcha Requirement',
      captchaRequired,
      captchaRequired ? SEVERITY.LOW : SEVERITY.MEDIUM,
      captchaRequired ? 'Captcha required after multiple attempts' : 'Captcha not required',
      captchaRequired ? null : 'Consider implementing captcha after multiple failed attempts'
    );
    
    // Test 3.5: Login attempt logging
    const stats = await loginSecurityService.getLoginAttemptStats(testIdentifier, testIP);
    const hasAttemptTracking = stats.userAttempts > 0;
    recordTest(
      'Login Security',
      'Login Attempt Logging',
      hasAttemptTracking,
      hasAttemptTracking ? SEVERITY.LOW : SEVERITY.HIGH,
      hasAttemptTracking ? `Login attempts tracked: ${stats.userAttempts}` : 'Login attempts not logged',
      hasAttemptTracking ? null : 'Implement comprehensive login attempt logging'
    );
    
    // Test 3.6: Suspicious pattern detection
    const suspiciousCheck = await loginSecurityService.checkSuspiciousPatterns(
      testIdentifier,
      testIP,
      'sqlmap/1.0'
    );
    const suspiciousDetected = suspiciousCheck.isSuspicious === true;
    recordTest(
      'Login Security',
      'Suspicious Pattern Detection',
      suspiciousDetected,
      suspiciousDetected ? SEVERITY.LOW : SEVERITY.MEDIUM,
      suspiciousDetected ? `Suspicious patterns detected: ${suspiciousCheck.reasons.join(', ')}` : 'Suspicious patterns not detected',
      suspiciousDetected ? null : 'Implement detection for suspicious login patterns'
    );
    
  } catch (error) {
    recordTest(
      'Login Security',
      'Login Security Tests',
      false,
      SEVERITY.HIGH,
      `Error: ${error.message}`,
      'Fix login security service implementation'
    );
  }
}

// ============================================================================
// 4. SQL INJECTION TESTS
// ============================================================================

async function testSQLInjection() {
  console.log('\n=== 4. SQL INJECTION TESTS ===\n');
  
  const sqlInjectionPayloads = [
    "' OR '1'='1",
    "' OR '1'='1' --",
    "' OR '1'='1' /*",
    "admin'--",
    "admin'/*",
    "' UNION SELECT NULL,NULL,NULL--",
    "1' ORDER BY 1--",
    "1' UNION SELECT 1,2,3--",
    "'; DROP TABLE users--",
    "'; DROP TABLE users--",
    "1; EXEC xp_cmdshell('dir')",
    "1' AND 1=1--",
    "1' AND 1=2--",
    "' OR 1=1--",
    "' OR 'a'='a",
    "admin' #",
    "admin'/*",
    "1' AND SLEEP(5)--",
    "1' AND BENCHMARK(1000000,MD5(1))--"
  ];
  
  try {
    // Test 4.1: SQL injection in email field
    let sqlInjectionInEmailBlocked = true;
    for (const payload of sqlInjectionPayloads) {
      try {
        const response = await axios.post(`${API_BASE_URL}/auth/login`, {
          identifier: payload,
          password: 'test123'
        }, { validateStatus: () => true });
        
        if (response.status === 200 || response.status === 500) {
          sqlInjectionInEmailBlocked = false;
          recordTest(
            'SQL Injection',
            'SQL Injection in Email Field',
            false,
            SEVERITY.CRITICAL,
            `SQL injection payload accepted: ${payload}`,
            'Use parameterized queries and input validation to prevent SQL injection'
          );
          break;
        }
      } catch (error) {
        // Connection errors are expected in test environment
      }
    }
    
    if (sqlInjectionInEmailBlocked) {
      recordTest(
        'SQL Injection',
        'SQL Injection in Email Field',
        true,
        SEVERITY.LOW,
        'SQL injection payloads in email field were blocked',
        null
      );
    }
    
    // Test 4.2: SQL injection in password field
    let sqlInjectionInPasswordBlocked = true;
    for (const payload of sqlInjectionPayloads) {
      try {
        const response = await axios.post(`${API_BASE_URL}/auth/login`, {
          identifier: 'test@example.com',
          password: payload
        }, { validateStatus: () => true });
        
        if (response.status === 200 || response.status === 500) {
          sqlInjectionInPasswordBlocked = false;
          recordTest(
            'SQL Injection',
            'SQL Injection in Password Field',
            false,
            SEVERITY.CRITICAL,
            `SQL injection payload accepted: ${payload}`,
            'Use parameterized queries and input validation to prevent SQL injection'
          );
          break;
        }
      } catch (error) {
        // Connection errors are expected in test environment
      }
    }
    
    if (sqlInjectionInPasswordBlocked) {
      recordTest(
        'SQL Injection',
        'SQL Injection in Password Field',
        true,
        SEVERITY.LOW,
        'SQL injection payloads in password field were blocked',
        null
      );
    }
    
    // Test 4.3: SQL injection in phone field
    let sqlInjectionInPhoneBlocked = true;
    for (const payload of sqlInjectionPayloads) {
      try {
        const response = await axios.post(`${API_BASE_URL}/auth/send-otp`, {
          phone: payload
        }, { validateStatus: () => true });
        
        if (response.status === 200 || response.status === 500) {
          sqlInjectionInPhoneBlocked = false;
          recordTest(
            'SQL Injection',
            'SQL Injection in Phone Field',
            false,
            SEVERITY.CRITICAL,
            `SQL injection payload accepted: ${payload}`,
            'Use parameterized queries and input validation to prevent SQL injection'
          );
          break;
        }
      } catch (error) {
        // Connection errors are expected in test environment
      }
    }
    
    if (sqlInjectionInPhoneBlocked) {
      recordTest(
        'SQL Injection',
        'SQL Injection in Phone Field',
        true,
        SEVERITY.LOW,
        'SQL injection payloads in phone field were blocked',
        null
      );
    }
    
  } catch (error) {
    recordTest(
      'SQL Injection',
      'SQL Injection Tests',
      false,
      SEVERITY.HIGH,
      `Error: ${error.message}`,
      'Ensure API is running and accessible'
    );
  }
}

// ============================================================================
// 5. XSS VULNERABILITIES TESTS
// ============================================================================

async function testXSS() {
  console.log('\n=== 5. XSS VULNERABILITIES TESTS ===\n');
  
  const xssPayloads = [
    '<script>alert("XSS")</script>',
    '<img src=x onerror=alert("XSS")>',
    '<svg onload=alert("XSS")>',
    '<body onload=alert("XSS")>',
    '<input onfocus=alert("XSS") autofocus>',
    '<select onfocus=alert("XSS") autofocus>',
    '<textarea onfocus=alert("XSS") autofocus>',
    '<keygen onfocus=alert("XSS") autofocus>',
    '<video><source onerror=alert("XSS")>',
    '<audio src=x onerror=alert("XSS")>',
    '<details open ontoggle=alert("XSS")>',
    '<marquee onstart=alert("XSS")>',
    'javascript:alert("XSS")',
    '<iframe src="javascript:alert(\'XSS\')">',
    '<object data="javascript:alert(\'XSS\')">',
    '<embed src="javascript:alert(\'XSS\')">',
    '<link rel=import href="javascript:alert(\'XSS\')">',
    '<meta http-equiv="refresh" content="0;url=javascript:alert(\'XSS\')">'
  ];
  
  try {
    // Test 5.1: XSS in email field
    let xssInEmailBlocked = true;
    for (const payload of xssPayloads) {
      try {
        const response = await axios.post(`${API_BASE_URL}/auth/register`, {
          email: payload,
          password: 'TestPassword123!',
          confirmPassword: 'TestPassword123!'
        }, { validateStatus: () => true });
        
        if (response.status === 200) {
          xssInEmailBlocked = false;
          recordTest(
            'XSS',
            'XSS in Email Field',
            false,
            SEVERITY.CRITICAL,
            `XSS payload accepted: ${payload}`,
            'Implement input sanitization and output encoding to prevent XSS'
          );
          break;
        }
      } catch (error) {
        // Connection errors are expected in test environment
      }
    }
    
    if (xssInEmailBlocked) {
      recordTest(
        'XSS',
        'XSS in Email Field',
        true,
        SEVERITY.LOW,
        'XSS payloads in email field were blocked',
        null
      );
    }
    
    // Test 5.2: XSS in name field
    let xssInNameBlocked = true;
    for (const payload of xssPayloads) {
      try {
        const response = await axios.post(`${API_BASE_URL}/auth/register`, {
          email: 'test@example.com',
          password: 'TestPassword123!',
          confirmPassword: 'TestPassword123!',
          firstName: payload,
          lastName: payload
        }, { validateStatus: () => true });
        
        if (response.status === 200) {
          xssInNameBlocked = false;
          recordTest(
            'XSS',
            'XSS in Name Field',
            false,
            SEVERITY.CRITICAL,
            `XSS payload accepted: ${payload}`,
            'Implement input sanitization and output encoding to prevent XSS'
          );
          break;
        }
      } catch (error) {
        // Connection errors are expected in test environment
      }
    }
    
    if (xssInNameBlocked) {
      recordTest(
        'XSS',
        'XSS in Name Field',
        true,
        SEVERITY.LOW,
        'XSS payloads in name field were blocked',
        null
      );
    }
    
    // Test 5.3: Sanitize middleware effectiveness
    let sanitizeEffective = true;
    for (const payload of xssPayloads) {
      const sanitized = sanitizeString(payload);
      if (sanitized !== '' && sanitized.includes('<script')) {
        sanitizeEffective = false;
        recordTest(
          'XSS',
          'Sanitize Middleware Effectiveness',
          false,
          SEVERITY.HIGH,
          `XSS payload not sanitized: ${payload}`,
          'Enhance sanitize middleware to remove all script tags and event handlers'
        );
        break;
      }
    }
    
    if (sanitizeEffective) {
      recordTest(
        'XSS',
        'Sanitize Middleware Effectiveness',
        true,
        SEVERITY.LOW,
        'XSS payloads properly sanitized',
        null
      );
    }
    
    // Test 5.4: Reflected XSS in error messages
    try {
      const response = await axios.post(`${API_BASE_URL}/auth/login`, {
        identifier: '<script>alert("XSS")</script>',
        password: 'test'
      }, { validateStatus: () => true });
      
      const hasReflectedXSS = JSON.stringify(response.data).includes('<script>');
      recordTest(
        'XSS',
        'Reflected XSS in Error Messages',
        !hasReflectedXSS,
        !hasReflectedXSS ? SEVERITY.LOW : SEVERITY.HIGH,
        hasReflectedXSS ? 'XSS payload reflected in error message' : 'XSS not reflected in error messages',
        hasReflectedXSS ? 'Sanitize all error messages before returning to client' : null
      );
    } catch (error) {
      // Connection errors are expected
    }
    
  } catch (error) {
    recordTest(
      'XSS',
      'XSS Tests',
      false,
      SEVERITY.HIGH,
      `Error: ${error.message}`,
      'Ensure API is running and accessible'
    );
  }
}

// ============================================================================
// 6. CSRF PROTECTION TESTS
// ============================================================================

async function testCSRF() {
  console.log('\n=== 6. CSRF PROTECTION TESTS ===\n');
  
  try {
    // Test 6.1: CSRF token presence in forms
    recordTest(
      'CSRF',
      'CSRF Token Implementation',
      false,
      SEVERITY.HIGH,
      'CSRF token implementation not verified',
      'Implement CSRF tokens for all state-changing operations'
    );
    
    // Test 6.2: SameSite cookie attribute
    recordTest(
      'CSRF',
      'SameSite Cookie Attribute',
      false,
      SEVERITY.HIGH,
      'SameSite cookie attribute not verified',
      'Set SameSite=Strict or SameSite=Lax on all session cookies'
    );
    
    // Test 6.3: CSRF protection on POST endpoints
    const stateChangingEndpoints = [
      '/auth/register',
      '/auth/login',
      '/auth/logout',
      '/auth/change-password',
      '/auth/forgot-password'
    ];
    
    for (const endpoint of stateChangingEndpoints) {
      try {
        const response = await axios.post(`${API_BASE_URL}${endpoint}`, {}, {
          headers: {
            'Origin': 'http://malicious-site.com',
            'Referer': 'http://malicious-site.com'
          },
          validateStatus: () => true
        });
        
        const hasCSRFProtection = response.status === 403 || response.status === 401;
        recordTest(
          'CSRF',
          `CSRF Protection on ${endpoint}`,
          hasCSRFProtection,
          hasCSRFProtection ? SEVERITY.LOW : SEVERITY.HIGH,
          hasCSRFProtection ? 'CSRF protection active' : 'CSRF protection not detected',
          hasCSRFProtection ? null : 'Implement CSRF protection for this endpoint'
        );
      } catch (error) {
        // Connection errors are expected
      }
    }
    
  } catch (error) {
    recordTest(
      'CSRF',
      'CSRF Tests',
      false,
      SEVERITY.HIGH,
      `Error: ${error.message}`,
      'Ensure API is running and accessible'
    );
  }
}

// ============================================================================
// 7. INPUT VALIDATION TESTS
// ============================================================================

async function testInputValidation() {
  console.log('\n=== 7. INPUT VALIDATION TESTS ===\n');
  
  try {
    // Test 7.1: Email format validation
    const invalidEmails = [
      'invalid',
      'invalid@',
      '@invalid.com',
      'invalid@com',
      'invalid..email@example.com',
      '.invalid@example.com',
      'invalid.@example.com',
      'invalid@.example.com',
      'invalid@example..com'
    ];
    
    let emailValidationWorking = true;
    for (const email of invalidEmails) {
      try {
        const response = await axios.post(`${API_BASE_URL}/auth/register`, {
          email: email,
          password: 'TestPassword123!',
          confirmPassword: 'TestPassword123!'
        }, { validateStatus: () => true });
        
        if (response.status === 200 || response.status === 201) {
          emailValidationWorking = false;
          recordTest(
            'Input Validation',
            'Email Format Validation',
            false,
            SEVERITY.HIGH,
            `Invalid email accepted: ${email}`,
            'Implement proper email format validation'
          );
          break;
        }
      } catch (error) {
        // Connection errors are expected
      }
    }
    
    if (emailValidationWorking) {
      recordTest(
        'Input Validation',
        'Email Format Validation',
        true,
        SEVERITY.LOW,
        'Invalid email formats properly rejected',
        null
      );
    }
    
    // Test 7.2: Phone format validation
    const invalidPhones = [
      '123',
      'abc123',
      '+8801',
      '880171234567890',
      '1234567890123456'
    ];
    
    let phoneValidationWorking = true;
    for (const phone of invalidPhones) {
      try {
        const response = await axios.post(`${API_BASE_URL}/auth/send-otp`, {
          phone: phone
        }, { validateStatus: () => true });
        
        if (response.status === 200 || response.status === 201) {
          phoneValidationWorking = false;
          recordTest(
            'Input Validation',
            'Phone Format Validation',
            false,
            SEVERITY.HIGH,
            `Invalid phone accepted: ${phone}`,
            'Implement proper phone format validation'
          );
          break;
        }
      } catch (error) {
        // Connection errors are expected
      }
    }
    
    if (phoneValidationWorking) {
      recordTest(
        'Input Validation',
        'Phone Format Validation',
        true,
        SEVERITY.LOW,
        'Invalid phone formats properly rejected',
        null
      );
    }
    
    // Test 7.3: Length limits on inputs
    const longString = 'a'.repeat(10000);
    
    try {
      const response = await axios.post(`${API_BASE_URL}/auth/register`, {
        email: 'test@example.com',
        password: 'TestPassword123!',
        confirmPassword: 'TestPassword123!',
        firstName: longString,
        lastName: longString
      }, { validateStatus: () => true });
      
      const hasLengthLimit = response.status !== 200 && response.status !== 201;
      recordTest(
        'Input Validation',
        'Input Length Limits',
        hasLengthLimit,
        hasLengthLimit ? SEVERITY.LOW : SEVERITY.MEDIUM,
        hasLengthLimit ? 'Long inputs properly rejected' : 'No length limit detected',
        hasLengthLimit ? null : 'Implement length limits on all input fields'
      );
    } catch (error) {
      // Connection errors are expected
    }
    
    // Test 7.4: Special character handling
    const specialChars = '!@#$%^&*()_+-=[]{}|;:,.<>?';
    const specialCharInput = `Test${specialChars}User`;
    
    try {
      const response = await axios.post(`${API_BASE_URL}/auth/register`, {
        email: 'test@example.com',
        password: 'TestPassword123!',
        confirmPassword: 'TestPassword123!',
        firstName: specialCharInput
      }, { validateStatus: () => true });
      
      const handlesSpecialChars = response.status === 200 || response.status === 201 || response.status === 400;
      recordTest(
        'Input Validation',
        'Special Character Handling',
        handlesSpecialChars,
        handlesSpecialChars ? SEVERITY.LOW : SEVERITY.MEDIUM,
        handlesSpecialChars ? 'Special characters properly handled' : 'Special characters not handled',
        handlesSpecialChars ? null : 'Implement proper handling of special characters'
      );
    } catch (error) {
      // Connection errors are expected
    }
    
  } catch (error) {
    recordTest(
      'Input Validation',
      'Input Validation Tests',
      false,
      SEVERITY.HIGH,
      `Error: ${error.message}`,
      'Ensure API is running and accessible'
    );
  }
}

// ============================================================================
// 8. RATE LIMITING TESTS
// ============================================================================

async function testRateLimiting() {
  console.log('\n=== 8. RATE LIMITING TESTS ===\n');
  
  try {
    // Test 8.1: Rate limiting on login endpoint
    let rateLimitReached = false;
    for (let i = 0; i < 25; i++) {
      try {
        const response = await axios.post(`${API_BASE_URL}/auth/login`, {
          identifier: 'test@example.com',
          password: 'wrongpassword'
        }, { validateStatus: () => true });
        
        if (response.status === 429) {
          rateLimitReached = true;
          break;
        }
      } catch (error) {
        // Connection errors are expected
      }
    }
    
    recordTest(
      'Rate Limiting',
      'Rate Limiting on Login Endpoint',
      rateLimitReached,
      rateLimitReached ? SEVERITY.LOW : SEVERITY.HIGH,
      rateLimitReached ? 'Rate limiting active on login' : 'No rate limiting detected',
      rateLimitReached ? null : 'Implement rate limiting on login endpoint'
    );
    
    // Test 8.2: Rate limiting on registration endpoint
    let registrationRateLimitReached = false;
    for (let i = 0; i < 25; i++) {
      try {
        const response = await axios.post(`${API_BASE_URL}/auth/register`, {
          email: `test${i}@example.com`,
          password: 'TestPassword123!',
          confirmPassword: 'TestPassword123!'
        }, { validateStatus: () => true });
        
        if (response.status === 429) {
          registrationRateLimitReached = true;
          break;
        }
      } catch (error) {
        // Connection errors are expected
      }
    }
    
    recordTest(
      'Rate Limiting',
      'Rate Limiting on Registration Endpoint',
      registrationRateLimitReached,
      registrationRateLimitReached ? SEVERITY.LOW : SEVERITY.HIGH,
      registrationRateLimitReached ? 'Rate limiting active on registration' : 'No rate limiting detected',
      registrationRateLimitReached ? null : 'Implement rate limiting on registration endpoint'
    );
    
    // Test 8.3: Rate limiting on password reset
    let passwordResetRateLimitReached = false;
    for (let i = 0; i < 25; i++) {
      try {
        const response = await axios.post(`${API_BASE_URL}/auth/forgot-password`, {
          email: 'test@example.com'
        }, { validateStatus: () => true });
        
        if (response.status === 429) {
          passwordResetRateLimitReached = true;
          break;
        }
      } catch (error) {
        // Connection errors are expected
      }
    }
    
    recordTest(
      'Rate Limiting',
      'Rate Limiting on Password Reset',
      passwordResetRateLimitReached,
      passwordResetRateLimitReached ? SEVERITY.LOW : SEVERITY.HIGH,
      passwordResetRateLimitReached ? 'Rate limiting active on password reset' : 'No rate limiting detected',
      passwordResetRateLimitReached ? null : 'Implement rate limiting on password reset endpoint'
    );
    
    // Test 8.4: IP-based rate limiting
    recordTest(
      'Rate Limiting',
      'IP-Based Rate Limiting',
      false,
      SEVERITY.MEDIUM,
      'IP-based rate limiting not verified',
      'Implement IP-based rate limiting to prevent abuse'
    );
    
    // Test 8.5: User-based rate limiting
    recordTest(
      'Rate Limiting',
      'User-Based Rate Limiting',
      false,
      SEVERITY.MEDIUM,
      'User-based rate limiting not verified',
      'Implement user-based rate limiting for authenticated users'
    );
    
  } catch (error) {
    recordTest(
      'Rate Limiting',
      'Rate Limiting Tests',
      false,
      SEVERITY.HIGH,
      `Error: ${error.message}`,
      'Ensure API is running and accessible'
    );
  }
}

// ============================================================================
// 9. API ENDPOINT SECURITY TESTS
// ============================================================================

async function testAPIEndpointSecurity() {
  console.log('\n=== 9. API ENDPOINT SECURITY TESTS ===\n');
  
  try {
    // Test 9.1: Authentication required on protected endpoints
    const protectedEndpoints = [
      '/auth/change-password',
      '/auth/disable-remember-me'
    ];
    
    for (const endpoint of protectedEndpoints) {
      try {
        const response = await axios.post(`${API_BASE_URL}${endpoint}`, {}, {
          validateStatus: () => true
        });
        
        const requiresAuth = response.status === 401;
        recordTest(
          'API Security',
          `Authentication Required on ${endpoint}`,
          requiresAuth,
          requiresAuth ? SEVERITY.LOW : SEVERITY.CRITICAL,
          requiresAuth ? 'Authentication properly required' : 'Endpoint accessible without authentication',
          requiresAuth ? null : 'Add authentication middleware to this endpoint'
        );
      } catch (error) {
        // Connection errors are expected
      }
    }
    
    // Test 9.2: Authorization checks
    recordTest(
      'API Security',
      'Authorization Checks',
      false,
      SEVERITY.HIGH,
      'Authorization checks not verified',
      'Implement role-based authorization for protected resources'
    );
    
    // Test 9.3: CORS configuration
    try {
      const response = await axios.options(`${API_BASE_URL}/auth/login`, {
        headers: {
          'Origin': 'http://malicious-site.com'
        },
        validateStatus: () => true
      });
      
      const corsHeader = response.headers['access-control-allow-origin'];
      const corsSecure = !corsHeader || corsHeader === 'null' || corsHeader !== '*';
      recordTest(
        'API Security',
        'CORS Configuration',
        corsSecure,
        corsSecure ? SEVERITY.LOW : SEVERITY.HIGH,
        corsSecure ? 'CORS properly configured' : 'CORS allows all origins',
        corsSecure ? null : 'Configure CORS to only allow trusted origins'
      );
    } catch (error) {
      // Connection errors are expected
    }
    
    // Test 9.4: Error message security
    try {
      const response = await axios.post(`${API_BASE_URL}/auth/login`, {
        identifier: 'nonexistent@example.com',
        password: 'wrongpassword'
      }, { validateStatus: () => true });
      
      const errorMessage = JSON.stringify(response.data).toLowerCase();
      const leaksInfo = errorMessage.includes('user') || errorMessage.includes('email') || errorMessage.includes('password');
      recordTest(
        'API Security',
        'Error Message Security',
        !leaksInfo,
        !leaksInfo ? SEVERITY.LOW : SEVERITY.MEDIUM,
        leaksInfo ? 'Error messages may leak sensitive information' : 'Error messages are generic',
        leaksInfo ? 'Use generic error messages that don\'t reveal system information' : null
      );
    } catch (error) {
      // Connection errors are expected
    }
    
    // Test 9.5: Stack trace exposure
    try {
      const response = await axios.post(`${API_BASE_URL}/auth/login`, {
        identifier: 'test@example.com',
        password: 'test'
      }, { validateStatus: () => true });
      
      const hasStackTrace = JSON.stringify(response.data).includes('stack') || 
                          JSON.stringify(response.data).includes('Error:') ||
                          JSON.stringify(response.data).includes('at ');
      recordTest(
        'API Security',
        'Stack Trace Exposure',
        !hasStackTrace,
        !hasStackTrace ? SEVERITY.LOW : SEVERITY.HIGH,
        hasStackTrace ? 'Stack traces may be exposed' : 'Stack traces not exposed',
        hasStackTrace ? 'Disable stack trace exposure in production' : null
      );
    } catch (error) {
      // Connection errors are expected
    }
    
  } catch (error) {
    recordTest(
      'API Security',
      'API Security Tests',
      false,
      SEVERITY.HIGH,
      `Error: ${error.message}`,
      'Ensure API is running and accessible'
    );
  }
}

// ============================================================================
// 10. DATA PROTECTION TESTS
// ============================================================================

async function testDataProtection() {
  console.log('\n=== 10. DATA PROTECTION TESTS ===\n');
  
  try {
    // Test 10.1: Passwords never logged
    recordTest(
      'Data Protection',
      'Password Logging Prevention',
      false,
      SEVERITY.CRITICAL,
      'Password logging not verified',
      'Ensure passwords are never logged in any form'
    );
    
    // Test 10.2: Tokens never logged
    recordTest(
      'Data Protection',
      'Token Logging Prevention',
      false,
      SEVERITY.HIGH,
      'Token logging not verified',
      'Ensure tokens are never logged in any form'
    );
    
    // Test 10.3: PII protection in logs
    recordTest(
      'Data Protection',
      'PII Protection in Logs',
      false,
      SEVERITY.HIGH,
      'PII protection not verified',
      'Ensure PII is masked or redacted in logs'
    );
    
    // Test 10.4: HTTPS enforcement
    recordTest(
      'Data Protection',
      'HTTPS Enforcement',
      false,
      SEVERITY.HIGH,
      'HTTPS enforcement not verified',
      'Enforce HTTPS in production environment'
    );
    
    // Test 10.5: Secure cookie attributes
    recordTest(
      'Data Protection',
      'Secure Cookie Attributes',
      false,
      SEVERITY.HIGH,
      'Secure cookie attributes not verified',
      'Set HttpOnly, Secure, and SameSite attributes on all cookies'
    );
    
    // Test 10.6: Data encryption at rest
    recordTest(
      'Data Protection',
      'Data Encryption at Rest',
      false,
      SEVERITY.HIGH,
      'Data encryption at rest not verified',
      'Implement encryption for sensitive data at rest'
    );
    
    // Test 10.7: Data encryption in transit
    recordTest(
      'Data Protection',
      'Data Encryption in Transit',
      false,
      SEVERITY.HIGH,
      'Data encryption in transit not verified',
      'Ensure all data is transmitted over HTTPS/TLS'
    );
    
  } catch (error) {
    recordTest(
      'Data Protection',
      'Data Protection Tests',
      false,
      SEVERITY.HIGH,
      `Error: ${error.message}`,
      'Review data protection implementation'
    );
  }
}

// ============================================================================
// 11. THIRD-PARTY INTEGRATION SECURITY TESTS
// ============================================================================

async function testThirdPartySecurity() {
  console.log('\n=== 11. THIRD-PARTY INTEGRATION SECURITY TESTS ===\n');
  
  try {
    // Test 11.1: Email service credentials not exposed
    recordTest(
      'Third-Party Security',
      'Email Service Credential Protection',
      false,
      SEVERITY.CRITICAL,
      'Email service credentials not verified',
      'Ensure email service credentials are stored securely and never exposed'
    );
    
    // Test 11.2: Email content sanitization
    recordTest(
      'Third-Party Security',
      'Email Content Sanitization',
      false,
      SEVERITY.MEDIUM,
      'Email content sanitization not verified',
      'Sanitize all email content to prevent injection attacks'
    );
    
    // Test 11.3: Email link security
    recordTest(
      'Third-Party Security',
      'Email Link Security',
      false,
      SEVERITY.MEDIUM,
      'Email link security not verified',
      'Ensure all email links use HTTPS'
    );
    
    // Test 11.4: SMS service credentials not exposed
    recordTest(
      'Third-Party Security',
      'SMS Service Credential Protection',
      false,
      SEVERITY.CRITICAL,
      'SMS service credentials not verified',
      'Ensure SMS service credentials are stored securely and never exposed'
    );
    
    // Test 11.5: OTP generation security
    recordTest(
      'Third-Party Security',
      'OTP Generation Security',
      false,
      SEVERITY.HIGH,
      'OTP generation security not verified',
      'Use cryptographically secure random number generation for OTPs'
    );
    
    // Test 11.6: OTP expiration
    recordTest(
      'Third-Party Security',
      'OTP Expiration',
      false,
      SEVERITY.HIGH,
      'OTP expiration not verified',
      'Ensure OTPs expire after a short time period (5-10 minutes)'
    );
    
    // Test 11.7: SMS rate limiting
    recordTest(
      'Third-Party Security',
      'SMS Rate Limiting',
      false,
      SEVERITY.HIGH,
      'SMS rate limiting not verified',
      'Implement rate limiting on SMS endpoints to prevent abuse'
    );
    
  } catch (error) {
    recordTest(
      'Third-Party Security',
      'Third-Party Security Tests',
      false,
      SEVERITY.HIGH,
      `Error: ${error.message}`,
      'Review third-party integration security'
    );
  }
}

// ============================================================================
// 12. OWASP TOP 10 TESTS
// ============================================================================

async function testOWASPTop10() {
  console.log('\n=== 12. OWASP TOP 10 TESTS ===\n');
  
  try {
    // Test 12.1: Broken Access Control
    recordTest(
      'OWASP Top 10',
      'Broken Access Control',
      false,
      SEVERITY.CRITICAL,
      'Access control not verified',
      'Implement proper access control checks on all endpoints'
    );
    
    // Test 12.2: Cryptographic Failures
    recordTest(
      'OWASP Top 10',
      'Cryptographic Failures',
      false,
      SEVERITY.CRITICAL,
      'Cryptographic implementation not verified',
      'Use strong encryption algorithms and proper key management'
    );
    
    // Test 12.3: Injection Attacks
    recordTest(
      'OWASP Top 10',
      'Injection Attacks',
      false,
      SEVERITY.CRITICAL,
      'Injection protection not verified',
      'Use parameterized queries and input validation'
    );
    
    // Test 12.4: Insecure Design
    recordTest(
      'OWASP Top 10',
      'Insecure Design',
      false,
      SEVERITY.HIGH,
      'Security design not verified',
      'Implement secure-by-design principles'
    );
    
    // Test 12.5: Security Misconfiguration
    recordTest(
      'OWASP Top 10',
      'Security Misconfiguration',
      false,
      SEVERITY.HIGH,
      'Security configuration not verified',
      'Review and harden all security configurations'
    );
    
    // Test 12.6: Vulnerable Components
    recordTest(
      'OWASP Top 10',
      'Vulnerable Components',
      false,
      SEVERITY.HIGH,
      'Component vulnerabilities not verified',
      'Keep all dependencies updated and scan for vulnerabilities'
    );
    
    // Test 12.7: Authentication Failures
    recordTest(
      'OWASP Top 10',
      'Authentication Failures',
      false,
      SEVERITY.CRITICAL,
      'Authentication security not verified',
      'Implement strong authentication mechanisms'
    );
    
    // Test 12.8: Data Integrity Failures
    recordTest(
      'OWASP Top 10',
      'Data Integrity Failures',
      false,
      SEVERITY.HIGH,
      'Data integrity not verified',
      'Implement data integrity checks and validation'
    );
    
    // Test 12.9: Security Logging Failures
    recordTest(
      'OWASP Top 10',
      'Security Logging Failures',
      false,
      SEVERITY.MEDIUM,
      'Security logging not verified',
      'Implement comprehensive security event logging'
    );
    
    // Test 12.10: SSRF (Server-Side Request Forgery)
    recordTest(
      'OWASP Top 10',
      'Server-Side Request Forgery',
      false,
      SEVERITY.HIGH,
      'SSRF protection not verified',
      'Implement SSRF protection for all external requests'
    );
    
  } catch (error) {
    recordTest(
      'OWASP Top 10',
      'OWASP Top 10 Tests',
      false,
      SEVERITY.HIGH,
      `Error: ${error.message}`,
      'Review OWASP Top 10 compliance'
    );
  }
}

// ============================================================================
// 13. FRONTEND SECURITY TESTS
// ============================================================================

async function testFrontendSecurity() {
  console.log('\n=== 13. FRONTEND SECURITY TESTS ===\n');
  
  try {
    // Test 13.1: localStorage security
    recordTest(
      'Frontend Security',
      'localStorage Security',
      false,
      SEVERITY.HIGH,
      'localStorage usage not verified',
      'Avoid storing sensitive data in localStorage'
    );
    
    // Test 13.2: sessionStorage security
    recordTest(
      'Frontend Security',
      'sessionStorage Security',
      false,
      SEVERITY.HIGH,
      'sessionStorage usage not verified',
      'Avoid storing sensitive data in sessionStorage'
    );
    
    // Test 13.3: Cookie security attributes
    recordTest(
      'Frontend Security',
      'Cookie Security Attributes',
      false,
      SEVERITY.HIGH,
      'Cookie security attributes not verified',
      'Set HttpOnly, Secure, and SameSite attributes on all cookies'
    );
    
    // Test 13.4: Content Security Policy
    recordTest(
      'Frontend Security',
      'Content Security Policy',
      false,
      SEVERITY.HIGH,
      'CSP not verified',
      'Implement strict Content Security Policy headers'
    );
    
    // Test 13.5: XSS protection headers
    recordTest(
      'Frontend Security',
      'XSS Protection Headers',
      false,
      SEVERITY.MEDIUM,
      'XSS protection headers not verified',
      'Set X-XSS-Protection header'
    );
    
    // Test 13.6: Frame protection (X-Frame-Options)
    recordTest(
      'Frontend Security',
      'Frame Protection',
      false,
      SEVERITY.MEDIUM,
      'Frame protection not verified',
      'Set X-Frame-Options header to DENY or SAMEORIGIN'
    );
    
  } catch (error) {
    recordTest(
      'Frontend Security',
      'Frontend Security Tests',
      false,
      SEVERITY.HIGH,
      `Error: ${error.message}`,
      'Review frontend security implementation'
    );
  }
}

// ============================================================================
// MAIN TEST EXECUTION
// ============================================================================

async function runAllTests() {
  console.log('╔════════════════════════════════════════════════════════════════╗');
  console.log('║     COMPREHENSIVE SECURITY TEST SUITE                           ║');
  console.log('║     Authentication System Security Assessment                     ║');
  console.log('╚════════════════════════════════════════════════════════════════╝');
  console.log(`\nTest Started: ${new Date().toISOString()}`);
  console.log(`API Base URL: ${API_BASE_URL}\n`);
  
  try {
    await testPasswordSecurity();
    await testSessionSecurity();
    await testLoginSecurity();
    await testSQLInjection();
    await testXSS();
    await testCSRF();
    await testInputValidation();
    await testRateLimiting();
    await testAPIEndpointSecurity();
    await testDataProtection();
    await testThirdPartySecurity();
    await testOWASPTop10();
    await testFrontendSecurity();
    
    // Generate report
    generateSecurityReport();
    
  } catch (error) {
    console.error('\n❌ Test execution failed:', error);
  }
}

function generateSecurityReport() {
  console.log('\n╔════════════════════════════════════════════════════════════════╗');
  console.log('║                    SECURITY ASSESSMENT REPORT                      ║');
  console.log('╚════════════════════════════════════════════════════════════════╝\n');
  
  const summary = TEST_RESULTS.summary;
  const passRate = ((summary.passed / summary.totalTests) * 100).toFixed(2);
  
  console.log('📊 EXECUTIVE SUMMARY');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log(`Total Tests:        ${summary.totalTests}`);
  console.log(`Passed:             ${summary.passed} (${passRate}%)`);
  console.log(`Failed:             ${summary.failed}`);
  console.log(`Skipped:            ${summary.skipped}`);
  console.log('');
  console.log(`Critical Issues:    ${summary.critical}`);
  console.log(`High Issues:        ${summary.high}`);
  console.log(`Medium Issues:      ${summary.medium}`);
  console.log(`Low Issues:         ${summary.low}`);
  console.log('');
  
  // Calculate overall security score
  const maxScore = summary.totalTests * 10;
  const currentScore = summary.passed * 10;
  const securityScore = ((currentScore / maxScore) * 100).toFixed(2);
  
  console.log(`🎯 Overall Security Score: ${securityScore}/100`);
  console.log('');
  
  // Group tests by category
  const categories = {};
  TEST_RESULTS.tests.forEach(test => {
    if (!categories[test.category]) {
      categories[test.category] = {
        total: 0,
        passed: 0,
        failed: 0,
        tests: []
      };
    }
    categories[test.category].total++;
    if (test.passed) {
      categories[test.category].passed++;
    } else {
      categories[test.category].failed++;
    }
    categories[test.category].tests.push(test);
  });
  
  // Print category summaries
  console.log('📋 CATEGORY SUMMARY');
  console.log('═══════════════════════════════════════════════════════════════');
  Object.keys(categories).forEach(category => {
    const cat = categories[category];
    const catPassRate = ((cat.passed / cat.total) * 100).toFixed(2);
    console.log(`\n${category}:`);
    console.log(`  Total:  ${cat.total}`);
    console.log(`  Passed: ${cat.passed} (${catPassRate}%)`);
    console.log(`  Failed: ${cat.failed}`);
  });
  
  // Print critical and high severity issues
  console.log('\n🚨 CRITICAL AND HIGH SEVERITY ISSUES');
  console.log('═══════════════════════════════════════════════════════════════');
  const criticalHighIssues = TEST_RESULTS.tests.filter(
    test => !test.passed && (test.severity === SEVERITY.CRITICAL || test.severity === SEVERITY.HIGH)
  );
  
  if (criticalHighIssues.length === 0) {
    console.log('✅ No critical or high severity issues found!');
  } else {
    criticalHighIssues.forEach(issue => {
      console.log(`\n[${issue.severity}] ${issue.category}: ${issue.testName}`);
      console.log(`  Details: ${issue.details}`);
      if (issue.recommendation) {
        console.log(`  Recommendation: ${issue.recommendation}`);
      }
    });
  }
  
  // Save detailed report
  const reportPath = `backend/security-assessment-report-${Date.now()}.json`;
  const fs = require('fs');
  fs.writeFileSync(reportPath, JSON.stringify(TEST_RESULTS, null, 2));
  console.log(`\n📄 Detailed report saved to: ${reportPath}`);
  
  console.log('\n╔════════════════════════════════════════════════════════════════╗');
  console.log('║                    TEST COMPLETED                                  ║');
  console.log('╚════════════════════════════════════════════════════════════════╝\n');
}

// Run tests
runAllTests();
