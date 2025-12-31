const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Import all authentication services for testing
const { emailService } = require('./services/emailService');
const { smsService } = require('./services/smsService');
const { otpService } = require('./services/otpService');
const { sessionService } = require('./services/sessionService');
const { loginSecurityService } = require('./services/loginSecurityService');
const { passwordService } = require('./services/passwordService');
const { phoneValidationService } = require('./services/phoneValidationService');
const { configService } = require('./services/config');
const { loggerService } = require('./services/logger');

class ComprehensiveAuthDiagnosis {
  constructor() {
    this.prisma = new PrismaClient();
    this.config = configService;
    this.logger = loggerService;
    this.testResults = {
      redis: { status: 'pending', issues: [] },
      propertyNames: { status: 'pending', issues: [] },
      jwtConfig: { status: 'pending', issues: [] },
      missingUI: { status: 'pending', issues: [] },
      apiEndpoints: { status: 'pending', issues: [] },
      security: { status: 'pending', issues: [] },
      integration: { status: 'pending', issues: [] }
    };
  }

  async runComprehensiveDiagnosis() {
    console.log('🔍 Starting Comprehensive Authentication System Diagnosis...\n');
    
    try {
      // Test 1: Redis Connection Stability
      await this.testRedisConnectionStability();
      
      // Test 2: Property Name Consistency
      await this.testPropertyNameConsistency();
      
      // Test 3: JWT Token Configuration
      await this.testJWTConfiguration();
      
      // Test 4: Missing Frontend Components
      await this.testMissingFrontendComponents();
      
      // Test 5: API Endpoint Functionality
      await this.testAPIEndpointFunctionality();
      
      // Test 6: Security Implementation
      await this.testSecurityImplementation();
      
      // Test 7: Integration Testing
      await this.testIntegrationScenarios();
      
      // Generate comprehensive report
      this.generateDiagnosisReport();
      
    } catch (error) {
      console.error('❌ Diagnosis failed:', error);
      this.testResults.global = { status: 'error', error: error.message };
    }
  }

  async testRedisConnectionStability() {
    console.log('📡 Testing Redis Connection Stability...');
    
    let connectionIssues = [];
    let testResults = { passed: 0, failed: 0, issues: [] };
    
    try {
      // Test multiple rapid connections
      const connectionPromises = [];
      for (let i = 0; i < 5; i++) {
        connectionPromises.push(this.testRedisConnection());
      }
      
      const results = await Promise.allSettled(connectionPromises);
      
      results.forEach((result, index) => {
        if (result.status === 'error') {
          testResults.failed++;
          connectionIssues.push(`Connection attempt ${index + 1}: ${result.error}`);
        } else {
          testResults.passed++;
        }
      });
      
      // Test connection resilience
      const resilienceTest = await this.testRedisResilience();
      if (!resilienceTest.passed) {
        connectionIssues.push(`Resilience test failed: ${resilienceTest.error}`);
        testResults.failed++;
      } else {
        testResults.passed++;
      }
      
      this.testResults.redis = {
        status: connectionIssues.length > 0 ? 'failed' : 'passed',
        details: {
          passed: testResults.passed,
          failed: testResults.failed,
          total: testResults.passed + testResults.failed,
          issues: connectionIssues
        }
      };
      
      console.log('✅ Redis Connection Stability Test completed');
      
    } catch (error) {
      this.testResults.redis = {
        status: 'error',
        error: error.message,
        issues: [`Redis stability test error: ${error.message}`]
      };
    }
  }

  async testRedisConnection() {
    try {
      const startTime = Date.now();
      await sessionService.initializeRedis();
      const connectionTime = Date.now() - startTime;
      
      // Test basic Redis operation
      const testKey = `test_${Date.now()}`;
      await sessionService.redis.setEx(testKey, 60, 'test_value');
      const getValue = await sessionService.redis.get(testKey);
      
      await sessionService.redis.del(testKey);
      
      return {
        status: getValue === 'test_value' ? 'passed' : 'failed',
        connectionTime,
        operation: 'basic_set_get'
      };
    } catch (error) {
      return { status: 'error', error: error.message };
    }
  }

  async testRedisResilience() {
    try {
      // Test Redis behavior under load
      const operations = [];
      for (let i = 0; i < 10; i++) {
        operations.push(
          sessionService.redis.setEx(`load_test_${i}`, 60, `value_${i}`)
        );
      }
      
      await Promise.all(operations);
      
      // Verify all operations completed
      for (let i = 0; i < 10; i++) {
        const value = await sessionService.redis.get(`load_test_${i}`);
        if (value !== `value_${i}`) {
          return { passed: false, error: `Load test failed for key ${i}` };
        }
      }
      
      return { passed: true };
    } catch (error) {
      return { passed: false, error: error.message };
    }
  }

  async testPropertyNameConsistency() {
    console.log('🏷️ Testing Property Name Consistency...');
    
    // Property names are now standardized across frontend and backend
    // Both use: firstName, lastName, phone
    const propertyMappings = {
      frontendToBackend: {
        'phone': 'phone',
        'firstName': 'firstName',
        'lastName': 'lastName'
      },
      backendToFrontend: {
        'phone': 'phone',
        'firstName': 'firstName',
        'lastName': 'lastName'
      }
    };
    
    let issues = [];
    let testResults = { passed: 0, failed: 0, details: [] };
    
    // Check registration endpoint property handling
    try {
      const mockRegistrationData = {
        phone: '+8801234567',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        password: 'SecurePass123!',
        confirmPassword: 'SecurePass123!'
      };
      
      // Test the registration endpoint directly
      const response = await this.makeAPIRequest('POST', '/api/v1/auth/register', mockRegistrationData);
      
      if (response.status === 400) {
        // Check if it's a property name mismatch error
        const errorBody = response.data;
        if (errorBody && errorBody.error && errorBody.error.includes('phoneNumber')) {
          issues.push('Registration endpoint expects "phoneNumber" but frontend sends "phone"');
          testResults.failed++;
        } else {
          testResults.passed++;
        }
      } else {
        testResults.passed++;
      }
      
    } catch (error) {
      issues.push(`Property consistency test error: ${error.message}`);
      testResults.failed++;
    }
    
    this.testResults.propertyNames = {
      status: issues.length > 0 ? 'failed' : 'passed',
      details: {
        mappings: propertyMappings,
        issues,
        testResults
      }
    };
    
    console.log('✅ Property Name Consistency Test completed');
  }

  async testJWTConfiguration() {
    console.log('🔐 Testing JWT Token Configuration...');
    
    let issues = [];
    let testResults = { passed: 0, failed: 0, details: [] };
    
    try {
      const jwtSecret = process.env.JWT_SECRET;
      const jwtExpiry = process.env.JWT_EXPIRY || '24h';
      
      // Check JWT secret
      if (!jwtSecret) {
        issues.push('JWT_SECRET environment variable not configured');
        testResults.failed++;
      } else {
        testResults.passed++;
      }
      
      // Check JWT expiry time
      const expectedExpiry = 15 * 60 * 1000; // 15 minutes in ms
      const actualExpiryMs = this.parseTimeToMs(jwtExpiry);
      
      if (actualExpiryMs > expectedExpiry) {
        issues.push(`JWT expiry set to ${jwtExpiry} (${actualExpiryMs}ms) instead of required 15 minutes (${expectedExpiry}ms)`);
        testResults.failed++;
      } else {
        testResults.passed++;
      }
      
      // Test JWT token generation
      const testPayload = { userId: 'test-user-id', email: 'test@example.com' };
      const token = jwt.sign(testPayload, jwtSecret, { expiresIn: jwtExpiry });
      
      if (!token) {
        issues.push('JWT token generation failed');
        testResults.failed++;
      } else {
        testResults.passed++;
      }
      
      // Test JWT token verification
      const decoded = jwt.verify(token, jwtSecret);
      if (!decoded || decoded.userId !== 'test-user-id') {
        issues.push('JWT token verification failed');
        testResults.failed++;
      } else {
        testResults.passed++;
      }
      
      this.testResults.jwtConfig = {
        status: issues.length > 0 ? 'failed' : 'passed',
        details: {
          configured: !!jwtSecret,
          expiry: jwtExpiry,
          actualExpiryMs,
          expectedExpiryMs,
          issues,
          testResults
        }
      };
      
      console.log('✅ JWT Configuration Test completed');
      
    } catch (error) {
      issues.push(`JWT configuration test error: ${error.message}`);
      testResults.failed++;
    }
  }

  parseTimeToMs(timeString) {
    const timeValue = parseInt(timeString) || 0;
    const unit = timeString.slice(-1).toLowerCase();
    
    if (unit === 's') return timeValue * 1000;
    if (unit === 'm') return timeValue * 60 * 1000;
    if (unit === 'h') return timeValue * 60 * 60 * 1000;
    if (unit === 'd') return timeValue * 24 * 60 * 60 * 1000;
    return timeValue * 1000; // Default to seconds
  }

  async testMissingFrontendComponents() {
    console.log('🎨 Testing Missing Frontend Components...');
    
    let issues = [];
    let testResults = { passed: 0, failed: 0, details: [] };
    
    try {
      // Check for login form component
      const loginFormExists = await this.checkFileExists('frontend/src/components/auth/LoginForm.tsx');
      if (!loginFormExists) {
        issues.push('Login form component missing: frontend/src/components/auth/LoginForm.tsx');
        testResults.failed++;
      } else {
        testResults.passed++;
      }
      
      // Check for email verification component
      const emailVerificationExists = await this.checkFileExists('frontend/src/components/auth/EmailVerification.tsx');
      if (!emailVerificationExists) {
        issues.push('Email verification component missing: frontend/src/components/auth/EmailVerification.tsx');
        testResults.failed++;
      } else {
        testResults.passed++;
      }
      
      // Check for OTP verification component
      const otpVerificationExists = await this.checkFileExists('frontend/src/components/auth/OTPVerification.tsx');
      if (!otpVerificationExists) {
        issues.push('OTP verification component missing: frontend/src/components/auth/OTPVerification.tsx');
        testResults.failed++;
      } else {
        testResults.passed++;
      }
      
      // Check for password reset component
      const passwordResetExists = await this.checkFileExists('frontend/src/components/auth/PasswordReset.tsx');
      if (!passwordResetExists) {
        issues.push('Password reset component missing: frontend/src/components/auth/PasswordReset.tsx');
        testResults.failed++;
      } else {
        testResults.passed++;
      }
      
      // Check for user dashboard component
      const userDashboardExists = await this.checkFileExists('frontend/src/components/auth/UserDashboard.tsx');
      if (!userDashboardExists) {
        issues.push('User dashboard component missing: frontend/src/components/auth/UserDashboard.tsx');
        testResults.failed++;
      } else {
        testResults.passed++;
      }
      
      this.testResults.missingUI = {
        status: issues.length > 0 ? 'failed' : 'passed',
        details: {
          missingComponents: [
            'LoginForm.tsx',
            'EmailVerification.tsx', 
            'OTPVerification.tsx',
            'PasswordReset.tsx',
            'UserDashboard.tsx'
          ].filter(comp => !issues.includes(comp)),
          issues,
          testResults
        }
      };
      
      console.log('✅ Missing Frontend Components Test completed');
      
    } catch (error) {
      issues.push(`Frontend components test error: ${error.message}`);
      testResults.failed++;
    }
  }

  async checkFileExists(filePath) {
    try {
      const fs = require('fs').promises;
      await fs.access(filePath);
      return true;
    } catch (error) {
      return false;
    }
  }

  async testAPIEndpointFunctionality() {
    console.log('🌐 Testing API Endpoint Functionality...');
    
    let issues = [];
    let testResults = { passed: 0, failed: 0, details: [] };
    
    const endpoints = [
      { method: 'POST', path: '/api/v1/auth/register', name: 'Registration' },
      { method: 'POST', path: '/api/v1/auth/login', name: 'Login' },
      { method: 'POST', path: '/api/v1/auth/logout', name: 'Logout' },
      { method: 'POST', path: '/api/v1/auth/verify-email', name: 'Email Verification' },
      { method: 'POST', path: '/api/v1/auth/send-otp', name: 'Send OTP' },
      { method: 'POST', path: '/api/v1/auth/verify-otp', name: 'Verify OTP' },
      { method: 'POST', path: '/api/v1/auth/forgot-password', name: 'Forgot Password' },
      { method: 'POST', path: '/api/v1/auth/reset-password', name: 'Reset Password' }
    ];
    
    for (const endpoint of endpoints) {
      try {
        const result = await this.testEndpoint(endpoint.method, endpoint.path, endpoint.name);
        if (!result.passed) {
          issues.push(`${endpoint.name} endpoint test failed: ${result.error}`);
          testResults.failed++;
        } else {
          testResults.passed++;
        }
      } catch (error) {
        issues.push(`${endpoint.name} endpoint test error: ${error.message}`);
        testResults.failed++;
      }
    }
    
    this.testResults.apiEndpoints = {
      status: issues.length > 0 ? 'failed' : 'passed',
      details: {
        endpoints,
        issues,
        testResults
      }
    };
    
    console.log('✅ API Endpoint Functionality Test completed');
  }

  async testEndpoint(method, path, name) {
    try {
      let testData = {};
      let expectedStatus = 200;
      
      switch (name) {
        case 'Registration':
          testData = {
            email: 'test@example.com',
            password: 'SecurePass123!',
            firstName: 'Test',
            lastName: 'User',
            phone: '+8801234567'
          };
          break;
          
        case 'Login':
          testData = {
            identifier: 'test@example.com',
            password: 'SecurePass123!'
          };
          expectedStatus = 200;
          break;
          
        case 'Logout':
          expectedStatus = 200;
          break;
          
        case 'Email Verification':
          testData = { token: 'test-token-123' };
          expectedStatus = 400; // Should fail with invalid token
          break;
          
        case 'Send OTP':
          testData = { phone: '+8801234567' };
          expectedStatus = 200;
          break;
          
        case 'Verify OTP':
          testData = { phone: '+8801234567', otp: '123456' };
          expectedStatus = 200;
          break;
          
        case 'Forgot Password':
          testData = { email: 'test@example.com' };
          expectedStatus = 200;
          break;
          
        case 'Reset Password':
          testData = { token: 'test-token-123', newPassword: 'NewSecurePass456!' };
          expectedStatus = 200;
          break;
          
        default:
          return { passed: false, error: `Unknown endpoint: ${name}` };
      }
      
      const response = await this.makeAPIRequest(method, path, testData);
      
      if (response.status === expectedStatus) {
        return { passed: true };
      } else {
        return { 
          passed: false, 
          error: `Expected status ${expectedStatus}, got ${response.status}`,
          details: response.data
        };
      }
      
    } catch (error) {
      return { passed: false, error: error.message };
    }
  }

  async testSecurityImplementation() {
    console.log('🛡️ Testing Security Implementation...');
    
    let issues = [];
    let testResults = { passed: 0, failed: 0, details: [] };
    
    try {
      // Test password hashing
      const passwordTest = await this.testPasswordHashing();
      if (!passwordTest.passed) {
        issues.push(`Password hashing test failed: ${passwordTest.error}`);
        testResults.failed++;
      } else {
        testResults.passed++;
      }
      
      // Test rate limiting
      const rateLimitTest = await this.testRateLimiting();
      if (!rateLimitTest.passed) {
        issues.push(`Rate limiting test failed: ${rateLimitTest.error}`);
        testResults.failed++;
      } else {
        testResults.passed++;
      }
      
      // Test session security
      const sessionSecurityTest = await this.testSessionSecurity();
      if (!sessionSecurityTest.passed) {
        issues.push(`Session security test failed: ${sessionSecurityTest.error}`);
        testResults.failed++;
      } else {
        testResults.passed++;
      }
      
      // Test input validation
      const inputValidationTest = await this.testInputValidation();
      if (!inputValidationTest.passed) {
        issues.push(`Input validation test failed: ${inputValidationTest.error}`);
        testResults.failed++;
      } else {
        testResults.passed++;
      }
      
      this.testResults.security = {
        status: issues.length > 0 ? 'failed' : 'passed',
        details: {
          passwordHashing: passwordTest,
          rateLimiting: rateLimitTest,
          sessionSecurity: sessionSecurityTest,
          inputValidation: inputValidationTest,
          issues,
          testResults
        }
      };
      
      console.log('✅ Security Implementation Test completed');
      
    } catch (error) {
      issues.push(`Security implementation test error: ${error.message}`);
      testResults.failed++;
    }
  }

  async testPasswordHashing() {
    try {
      const testPassword = 'TestPassword123!';
      const hashedPassword = await passwordService.hashPassword(testPassword);
      const isValid = await passwordService.verifyPassword(testPassword, hashedPassword);
      
      return { passed: isValid, hash: hashedPassword };
    } catch (error) {
      return { passed: false, error: error.message };
    }
  }

  async testRateLimiting() {
    try {
      // Test rate limiting functionality
      const testIP = '192.168.1.100';
      const testUser = 'test@example.com';
      
      // Record some failed attempts
      for (let i = 0; i < 3; i++) {
        await loginSecurityService.recordFailedAttempt(testUser, testIP, 'test-agent', 'test_failed');
      }
      
      // Check if rate limiting is working
      const isBlocked = await loginSecurityService.isIPBlocked(testIP);
      const isUserLockedOut = await loginSecurityService.isUserLockedOut(testUser);
      const stats = await loginSecurityService.getLoginAttemptStats(testUser, testIP);
      
      return { 
        passed: !isBlocked && !isUserLockedOut && stats.userAttempts >= 3,
        details: { isBlocked, isUserLockedOut, stats }
      };
    } catch (error) {
      return { passed: false, error: error.message };
    }
  }

  async testSessionSecurity() {
    try {
      // Test session creation and validation
      const mockUser = { id: 'test-user-id', email: 'test@example.com' };
      const mockReq = {
        ip: '192.168.1.100',
        userAgent: 'test-agent',
        get: (header) => header === 'user-agent' ? 'test-user-agent' : undefined
      };
      
      const sessionResult = await sessionService.createSession(mockUser.id, mockReq, { loginType: 'password' });
      if (!sessionResult.sessionId) {
        return { passed: false, error: 'Session creation failed' };
      }
      
      const validation = await sessionService.validateSession(sessionResult.sessionId, mockReq);
      if (!validation.valid) {
        return { passed: false, error: 'Session validation failed' };
      }
      
      return { passed: true };
    } catch (error) {
      return { passed: false, error: error.message };
    }
  }

  async testInputValidation() {
    try {
      // Test email validation
      const validEmail = emailService.validateEmail('test@example.com');
      const invalidEmail = emailService.validateEmail('invalid-email');
      
      // Test phone validation
      const validPhone = phoneValidationService.validateForUseCase('+8801234567', 'registration');
      
      return {
        passed: validEmail.isValid && !invalidEmail.isValid && validPhone.isValid,
        details: { emailValidation: { valid: validEmail.isValid, invalid: invalidEmail.isValid }, phoneValidation: validPhone }
      };
    } catch (error) {
      return { passed: false, error: error.message };
    }
  }

  async testIntegrationScenarios() {
    console.log('🔗 Testing Integration Scenarios...');
    
    let issues = [];
    let testResults = { passed: 0, failed: 0, details: [] };
    
    try {
      // Test complete registration flow
      const registrationFlow = await this.testCompleteRegistrationFlow();
      if (!registrationFlow.passed) {
        issues.push(`Complete registration flow failed: ${registrationFlow.error}`);
        testResults.failed++;
      } else {
        testResults.passed++;
      }
      
      // Test complete login flow
      const loginFlow = await this.testCompleteLoginFlow();
      if (!loginFlow.passed) {
        issues.push(`Complete login flow failed: ${loginFlow.error}`);
        testResults.failed++;
      } else {
        testResults.passed++;
      }
      
      this.testResults.integration = {
        status: issues.length > 0 ? 'failed' : 'passed',
        details: {
          registrationFlow,
          loginFlow,
          issues,
          testResults
        }
      };
      
      console.log('✅ Integration Scenarios Test completed');
      
    } catch (error) {
      issues.push(`Integration test error: ${error.message}`);
      testResults.failed++;
    }
  }

  async testCompleteRegistrationFlow() {
    try {
      // 1. Register user
      const registrationData = {
        email: 'integration.test@example.com',
        password: 'IntegrationTestPass123!',
        firstName: 'Integration',
        lastName: 'Test',
        phone: '+8801234567'
      };
      
      const registerResponse = await this.makeAPIRequest('POST', '/api/v1/auth/register', registrationData);
      
      if (registerResponse.status !== 201) {
        return { passed: false, error: 'Registration failed' };
      }
      
      const user = registerResponse.data.user;
      
      // 2. Get verification token
      let verificationToken = null;
      if (user.requiresVerification && user.requiresVerification.includes('email')) {
        const emailTokens = await this.prisma.emailVerificationToken.findMany({
          where: { userId: user.id }
        });
        
        if (emailTokens.length > 0) {
          verificationToken = emailTokens[0].token;
        }
      }
      
      // 3. Verify email (if needed)
      if (verificationToken) {
        const verifyResponse = await this.makeAPIRequest('POST', '/api/v1/auth/verify-email', { token: verificationToken });
        
        if (verifyResponse.status !== 200) {
          return { passed: false, error: 'Email verification failed' };
        }
        
        // Update user status after verification
        await this.prisma.user.update({
          where: { id: user.id },
          data: { status: 'ACTIVE' }
        });
      }
      
      // 4. Attempt login
      const loginResponse = await this.makeAPIRequest('POST', '/api/v1/auth/login', {
        identifier: user.email,
        password: 'IntegrationTestPass123!'
      });
      
      if (loginResponse.status !== 200) {
        return { passed: false, error: 'Login failed' };
      }
      
      // 5. Verify session
      const sessionId = loginResponse.data.sessionId;
      const mockReq = {
        ip: '192.168.1.100',
        userAgent: 'integration-test-agent',
        get: (header) => header === 'user-agent' ? 'integration-test-user-agent' : undefined
      };
      
      const sessionValidation = await sessionService.validateSession(sessionId, mockReq);
      if (!sessionValidation.valid) {
        return { passed: false, error: 'Session validation failed' };
      }
      
      return { passed: true };
      
    } catch (error) {
      return { passed: false, error: error.message };
    }
  }

  async testCompleteLoginFlow() {
    try {
      // 1. Login with valid credentials
      const loginResponse = await this.makeAPIRequest('POST', '/api/v1/auth/login', {
        identifier: 'integration.test@example.com',
        password: 'IntegrationTestPass123!',
        rememberMe: true
      });
      
      if (loginResponse.status !== 200) {
        return { passed: false, error: 'Login failed' };
      }
      
      // 2. Verify session creation
      const sessionId = loginResponse.data.sessionId;
      const mockReq = {
        ip: '192.168.1.100',
        userAgent: 'integration-test-agent',
        get: (header) => header === 'user-agent' ? 'integration-test-user-agent' : undefined
      };
      
      const sessionValidation = await sessionService.validateSession(sessionId, mockReq);
      if (!sessionValidation.valid) {
        return { passed: false, error: 'Session validation failed' };
      }
      
      // 3. Test session refresh
      const refreshResponse = await this.makeAPIRequest('POST', '/api/v1/sessions/refresh', {
        sessionId: sessionId
      });
      
      if (refreshResponse.status !== 200) {
        return { passed: false, error: 'Session refresh failed' };
      }
      
      // 4. Test logout
      const logoutResponse = await this.makeAPIRequest('POST', '/api/v1/auth/logout', {
        sessionId: sessionId
      });
      
      if (logoutResponse.status !== 200) {
        return { passed: false, error: 'Logout failed' };
      }
      
      return { passed: true };
      
    } catch (error) {
      return { passed: false, error: error.message };
    }
  }

  async makeAPIRequest(method, path, data) {
    const baseUrl = process.env.API_BASE_URL || 'http://localhost:3001';
    const url = `${baseUrl}${path}`;
    
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'auth-diagnostic-test-agent'
      }
    };
    
    if (method !== 'GET') {
      options.body = JSON.stringify(data);
    }
    
    const response = await fetch(url, options);
    
    return {
      status: response.status,
      data: await response.json()
    };
  }

  generateDiagnosisReport() {
    console.log('\n📋 COMPREHENSIVE DIAGNOSIS REPORT\n');
    console.log('====================================');
    
    // Overall status
    const overallStatus = this.calculateOverallStatus();
    
    console.log(`🎯 Overall Status: ${overallStatus.status.toUpperCase()}`);
    console.log(`📊 Score: ${overallStatus.score}/10`);
    
    // Detailed results
    console.log('\n📊 DETAILED RESULTS:');
    console.log('====================================');
    
    Object.entries(this.testResults).forEach(([category, result]) => {
      if (result.status === 'pending') return;
      
      console.log(`\n🔍 ${category.toUpperCase()}:`);
      console.log(`   Status: ${result.status.toUpperCase()}`);
      
      if (result.issues && result.issues.length > 0) {
        console.log(`   ❌ Issues Found:`);
        result.issues.forEach((issue, index) => {
          console.log(`     ${index + 1}. ${issue}`);
        });
      }
      
      if (result.details) {
        Object.entries(result.details).forEach(([key, value]) => {
          if (typeof value === 'object') {
            console.log(`   ✅ ${key}:`);
            Object.entries(value).forEach(([subKey, subValue]) => {
              console.log(`     - ${subKey}: ${subValue}`);
            });
          } else {
            console.log(`   ✅ ${key}: ${value}`);
          }
        });
      }
      
      console.log('');
    });
    
    // Recommendations
    console.log('\n💡 RECOMMENDATIONS:');
    console.log('====================================');
    
    const recommendations = this.generateRecommendations();
    recommendations.forEach((rec, index) => {
      console.log(`${index + 1}. ${rec}`);
    });
    
    // Save report to file
    this.saveReportToFile();
  }

  calculateOverallStatus() {
    const results = this.testResults;
    let score = 10;
    let status = 'excellent';
    
    Object.entries(results).forEach(([category, result]) => {
      if (result.status === 'failed') {
        score -= 2;
        status = 'critical';
      } else if (result.status === 'pending') {
        score -= 1;
        if (status === 'good') status = 'good';
        if (status === 'fair') status = 'fair';
      }
    });
    
    return { status, score };
  }

  generateRecommendations() {
    const recommendations = [];
    
    // Redis recommendations
    if (this.testResults.redis && this.testResults.redis.status === 'failed') {
      recommendations.push('Fix Redis connection configuration - check Redis server status and network connectivity');
      recommendations.push('Implement Redis connection pooling and retry logic with exponential backoff');
    }
    
    // Property name recommendations
    if (this.testResults.propertyNames && this.testResults.propertyNames.status === 'failed') {
      recommendations.push('Standardize property names between frontend and backend APIs');
      recommendations.push('Update frontend to use "phoneNumber" or backend to accept "phone"');
      recommendations.push('Create API contract documentation for consistent naming');
    }
    
    // JWT configuration recommendations
    if (this.testResults.jwtConfig && this.testResults.jwtConfig.status === 'failed') {
      recommendations.push('Set JWT_EXPIRY environment variable to "15m" instead of "24h"');
      recommendations.push('Implement proper token refresh mechanism with shorter-lived access tokens');
    }
    
    // Missing UI recommendations
    if (this.testResults.missingUI && this.testResults.missingUI.status === 'failed') {
      recommendations.push('Create LoginForm.tsx component with email/phone login fields');
      recommendations.push('Implement EmailVerification.tsx component for email verification workflow');
      recommendations.push('Implement OTPVerification.tsx component for phone verification');
      recommendations.push('Create PasswordReset.tsx component for password reset functionality');
      recommendations.push('Create UserDashboard.tsx component for authenticated user interface');
    }
    
    // API endpoints recommendations
    if (this.testResults.apiEndpoints && this.testResults.apiEndpoints.status === 'failed') {
      recommendations.push('Fix failing API endpoints and ensure proper error handling');
      recommendations.push('Implement comprehensive API testing with automated test suites');
    }
    
    // Security recommendations
    if (this.testResults.security && this.testResults.security.status === 'failed') {
      recommendations.push('Strengthen password hashing algorithms and policies');
      recommendations.push('Implement comprehensive input validation and sanitization');
      recommendations.push('Add rate limiting and brute force protection');
      recommendations.push('Enhance session security with device fingerprinting');
    }
    
    // Integration recommendations
    if (this.testResults.integration && this.testResults.integration.status === 'failed') {
      recommendations.push('Fix integration issues between frontend and backend systems');
      recommendations.push('Implement end-to-end testing for all authentication workflows');
      recommendations.push('Add proper error handling and user feedback mechanisms');
    }
    
    return recommendations;
  }

  saveReportToFile() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `auth-diagnosis-report-${timestamp}.json`;
    
    const report = {
      timestamp,
      overallStatus: this.calculateOverallStatus(),
      testResults: this.testResults,
      recommendations: this.generateRecommendations()
    };
    
    try {
      const fs = require('fs').promises;
      fs.writeFileSync(filename, JSON.stringify(report, null, 2));
      console.log(`📄 Report saved to: ${filename}`);
    } catch (error) {
      console.error('Failed to save report:', error);
    }
  }
}

// Run comprehensive diagnosis
const diagnosis = new ComprehensiveAuthDiagnosis();
diagnosis.runComprehensiveDiagnosis().then(() => {
  console.log('\n🎯 Diagnosis completed. Check the generated report file for detailed results.');
}).catch((error) => {
  console.error('\n❌ Diagnosis failed:', error);
});

module.exports = {
  ComprehensiveAuthDiagnosis
};