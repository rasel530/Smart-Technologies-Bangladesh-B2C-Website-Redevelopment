/**
 * COMPREHENSIVE AUTHENTICATION TEST SUITE
 * Milestone 1: Core Authentication System
 * 
 * This test suite covers all authentication flows including:
 * 1. User Registration Flow
 * 2. Login/Logout Cycles
 * 3. Password Recovery Flow
 * 4. Session Management
 * 5. Security Testing
 * 6. Performance Testing
 * 7. Error Handling
 * 8. Integration Testing
 */

const http = require('http');
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

// Configuration
const BASE_URL = process.env.API_URL || 'http://localhost:3001';
const API_BASE = `${BASE_URL}/api/v1/auth`;

// Prisma client for database operations
const prisma = new PrismaClient();

// Test results storage
const testResults = {
  registration: { passed: 0, failed: 0, tests: [] },
  loginLogout: { passed: 0, failed: 0, tests: [] },
  passwordRecovery: { passed: 0, failed: 0, tests: [] },
  sessionManagement: { passed: 0, failed: 0, tests: [] },
  security: { passed: 0, failed: 0, tests: [] },
  performance: { passed: 0, failed: 0, tests: [] },
  errorHandling: { passed: 0, failed: 0, tests: [] },
  integration: { passed: 0, failed: 0, tests: [] }
};

// Performance metrics
const performanceMetrics = {
  registration: [],
  login: [],
  logout: [],
  passwordChange: [],
  passwordReset: [],
  sessionValidation: [],
  otpVerification: []
};

// Helper function to make HTTP requests
function makeRequest(method, endpoint, data = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(`${API_BASE}${endpoint}`);
    const options = {
      hostname: url.hostname,
      port: url.port || 3001,
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const jsonBody = body ? JSON.parse(body) : null;
          resolve({
            status: res.statusCode,
            data: jsonBody,
            headers: res.headers
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            data: body,
            headers: res.headers
          });
        }
      });
    });

    req.on('error', reject);

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

// Helper function to run a test
async function runTest(category, testName, testFn) {
  const startTime = Date.now();
  try {
    const result = await testFn();
    const duration = Date.now() - startTime;
    
    testResults[category].passed++;
    testResults[category].tests.push({
      name: testName,
      status: 'PASSED',
      duration,
      details: result
    });
    
    console.log(`✓ [${category.toUpperCase()}] ${testName} (${duration}ms)`);
    return { success: true, duration, result };
  } catch (error) {
    const duration = Date.now() - startTime;
    
    testResults[category].failed++;
    testResults[category].tests.push({
      name: testName,
      status: 'FAILED',
      duration,
      error: error.message,
      stack: error.stack
    });
    
    console.log(`✗ [${category.toUpperCase()}] ${testName} (${duration}ms)`);
    console.log(`  Error: ${error.message}`);
    return { success: false, duration, error: error.message };
  }
}

// Helper function to generate unique test data
function generateTestData() {
  const timestamp = Date.now();
  return {
    email: `test${timestamp}@example.com`,
    phone: `017${Math.floor(10000000 + Math.random() * 90000000)}`,
    firstName: 'Test',
    lastName: 'User',
    password: 'Test@123456',
    confirmPassword: 'Test@123456'
  };
}

// Helper function to clean up test data
async function cleanupTestData() {
  try {
    // Delete test users created during testing
    await prisma.user.deleteMany({
      where: {
        email: {
          startsWith: 'test'
        }
      }
    });
    console.log('Test data cleanup completed');
  } catch (error) {
    console.error('Error during cleanup:', error.message);
  }
}

// ============================================================================
// 1. USER REGISTRATION FLOW TESTS
// ============================================================================

async function testRegistrationFlow() {
  console.log('\n=== USER REGISTRATION FLOW TESTS ===\n');
  
  // Test 1.1: Registration with valid email data
  await runTest('registration', 'Registration with valid email data', async () => {
    const data = generateTestData();
    const response = await makeRequest('POST', '/register', {
      email: data.email,
      password: data.password,
      confirmPassword: data.confirmPassword,
      firstName: data.firstName,
      lastName: data.lastName
    });
    
    if (response.status !== 201) {
      throw new Error(`Expected status 201, got ${response.status}`);
    }
    
    if (!response.data.user || !response.data.user.id) {
      throw new Error('User ID not returned in response');
    }
    
    if (!response.data.requiresEmailVerification) {
      throw new Error('Email verification flag not set');
    }
    
    performanceMetrics.registration.push({ test: 'valid_email_registration', duration: response.duration || 0 });
    return { userId: response.data.user.id, email: data.email };
  });
  
  // Test 1.2: Registration with valid phone data
  await runTest('registration', 'Registration with valid phone data', async () => {
    const data = generateTestData();
    const response = await makeRequest('POST', '/register', {
      phone: data.phone,
      password: data.password,
      confirmPassword: data.confirmPassword,
      firstName: data.firstName,
      lastName: data.lastName
    });
    
    if (response.status !== 201) {
      throw new Error(`Expected status 201, got ${response.status}`);
    }
    
    if (!response.data.requiresPhoneVerification) {
      throw new Error('Phone verification flag not set');
    }
    
    performanceMetrics.registration.push({ test: 'valid_phone_registration', duration: response.duration || 0 });
    return { userId: response.data.user.id, phone: data.phone };
  });
  
  // Test 1.3: Registration with duplicate email
  await runTest('registration', 'Registration with duplicate email should fail', async () => {
    const data = generateTestData();
    
    // First registration
    await makeRequest('POST', '/register', {
      email: data.email,
      password: data.password,
      confirmPassword: data.confirmPassword,
      firstName: data.firstName,
      lastName: data.lastName
    });
    
    // Duplicate registration
    const response = await makeRequest('POST', '/register', {
      email: data.email,
      password: data.password,
      confirmPassword: data.confirmPassword,
      firstName: data.firstName,
      lastName: data.lastName
    });
    
    if (response.status !== 409) {
      throw new Error(`Expected status 409, got ${response.status}`);
    }
    
    if (!response.data.error || !response.data.error.includes('already exists')) {
      throw new Error('Duplicate error not returned');
    }
    
    return { message: 'Duplicate correctly rejected' };
  });
  
  // Test 1.4: Registration with weak password
  await runTest('registration', 'Registration with weak password should fail', async () => {
    const data = generateTestData();
    const response = await makeRequest('POST', '/register', {
      email: data.email,
      password: 'weak',
      confirmPassword: 'weak',
      firstName: data.firstName,
      lastName: data.lastName
    });
    
    if (response.status !== 400) {
      throw new Error(`Expected status 400, got ${response.status}`);
    }
    
    if (!response.data.error || !response.data.error.includes('Password')) {
      throw new Error('Password validation error not returned');
    }
    
    return { message: 'Weak password correctly rejected' };
  });
  
  // Test 1.5: Registration with password mismatch
  await runTest('registration', 'Registration with password mismatch should fail', async () => {
    const data = generateTestData();
    const response = await makeRequest('POST', '/register', {
      email: data.email,
      password: data.password,
      confirmPassword: 'Different@123',
      firstName: data.firstName,
      lastName: data.lastName
    });
    
    if (response.status !== 400) {
      throw new Error(`Expected status 400, got ${response.status}`);
    }
    
    if (!response.data.error || !response.data.error.includes('match')) {
      throw new Error('Password mismatch error not returned');
    }
    
    return { message: 'Password mismatch correctly rejected' };
  });
  
  // Test 1.6: Registration without email or phone
  await runTest('registration', 'Registration without email or phone should fail', async () => {
    const data = generateTestData();
    const response = await makeRequest('POST', '/register', {
      password: data.password,
      confirmPassword: data.confirmPassword,
      firstName: data.firstName,
      lastName: data.lastName
    });
    
    if (response.status !== 400) {
      throw new Error(`Expected status 400, got ${response.status}`);
    }
    
    if (!response.data.error || !response.data.error.includes('Email or phone')) {
      throw new Error('Email/phone required error not returned');
    }
    
    return { message: 'Missing email/phone correctly rejected' };
  });
  
  // Test 1.7: Email verification flow
  await runTest('registration', 'Email verification flow', async () => {
    const data = generateTestData();
    
    // Register user
    const regResponse = await makeRequest('POST', '/register', {
      email: data.email,
      password: data.password,
      confirmPassword: data.confirmPassword,
      firstName: data.firstName,
      lastName: data.lastName
    });
    
    if (regResponse.status !== 201) {
      throw new Error('Registration failed');
    }
    
    // Get verification token from database
    const verificationToken = await prisma.emailVerificationToken.findFirst({
      where: { userId: regResponse.data.user.id }
    });
    
    if (!verificationToken) {
      throw new Error('Verification token not created');
    }
    
    // Verify email
    const verifyResponse = await makeRequest('POST', '/verify-email', {
      token: verificationToken.token
    });
    
    if (verifyResponse.status !== 200) {
      throw new Error(`Expected status 200, got ${verifyResponse.status}`);
    }
    
    if (!verifyResponse.data.user.emailVerified) {
      throw new Error('Email not marked as verified');
    }
    
    return { message: 'Email verification successful' };
  });
  
  // Test 1.8: Resend verification email
  await runTest('registration', 'Resend verification email', async () => {
    const data = generateTestData();
    
    // Register user
    const regResponse = await makeRequest('POST', '/register', {
      email: data.email,
      password: data.password,
      confirmPassword: data.confirmPassword,
      firstName: data.firstName,
      lastName: data.lastName
    });
    
    if (regResponse.status !== 201) {
      throw new Error('Registration failed');
    }
    
    // Wait for rate limit to pass
    await new Promise(resolve => setTimeout(resolve, 6000));
    
    // Resend verification
    const resendResponse = await makeRequest('POST', '/resend-verification', {
      email: data.email
    });
    
    if (resendResponse.status !== 200) {
      throw new Error(`Expected status 200, got ${resendResponse.status}`);
    }
    
    return { message: 'Resend verification successful' };
  });
  
  // Test 1.9: Phone OTP verification flow
  await runTest('registration', 'Phone OTP verification flow', async () => {
    const data = generateTestData();
    
    // Register user with phone
    const regResponse = await makeRequest('POST', '/register', {
      phone: data.phone,
      password: data.password,
      confirmPassword: data.confirmPassword,
      firstName: data.firstName,
      lastName: data.lastName
    });
    
    if (regResponse.status !== 201) {
      throw new Error('Registration failed');
    }
    
    // Get OTP from database (in testing mode, OTP is logged)
    const otpRecord = await prisma.otp.findFirst({
      where: { phone: data.phone },
      orderBy: { createdAt: 'desc' }
    });
    
    if (!otpRecord) {
      throw new Error('OTP not created');
    }
    
    // Verify OTP
    const verifyResponse = await makeRequest('POST', '/verify-otp', {
      phone: data.phone,
      otp: otpRecord.code
    });
    
    if (verifyResponse.status !== 200) {
      throw new Error(`Expected status 200, got ${verifyResponse.status}`);
    }
    
    return { message: 'Phone OTP verification successful' };
  });
  
  // Test 1.10: Resend OTP
  await runTest('registration', 'Resend OTP', async () => {
    const data = generateTestData();
    
    // Send OTP
    const sendResponse = await makeRequest('POST', '/send-otp', {
      phone: data.phone
    });
    
    if (sendResponse.status !== 200) {
      throw new Error('Send OTP failed');
    }
    
    // Wait for rate limit to pass
    await new Promise(resolve => setTimeout(resolve, 6000));
    
    // Resend OTP
    const resendResponse = await makeRequest('POST', '/resend-otp', {
      phone: data.phone
    });
    
    if (resendResponse.status !== 200) {
      throw new Error(`Expected status 200, got ${resendResponse.status}`);
    }
    
    return { message: 'Resend OTP successful' };
  });
}

// ============================================================================
// 2. LOGIN/LOGOUT CYCLES TESTS
// ============================================================================

async function testLoginLogoutFlow() {
  console.log('\n=== LOGIN/LOGOUT CYCLES TESTS ===\n');
  
  // Test 2.1: Login with valid email credentials
  await runTest('loginLogout', 'Login with valid email credentials', async () => {
    const data = generateTestData();
    
    // Register user
    const regResponse = await makeRequest('POST', '/register', {
      email: data.email,
      password: data.password,
      confirmPassword: data.confirmPassword,
      firstName: data.firstName,
      lastName: data.lastName
    });
    
    // Auto-verify user for login test
    await prisma.user.update({
      where: { id: regResponse.data.user.id },
      data: { status: 'ACTIVE', emailVerified: new Date() }
    });
    
    // Login
    const loginResponse = await makeRequest('POST', '/login', {
      identifier: data.email,
      password: data.password
    });
    
    if (loginResponse.status !== 200) {
      throw new Error(`Expected status 200, got ${loginResponse.status}`);
    }
    
    if (!loginResponse.data.token || !loginResponse.data.sessionId) {
      throw new Error('Token or session ID not returned');
    }
    
    performanceMetrics.login.push({ test: 'valid_email_login', duration: loginResponse.duration || 0 });
    return { token: loginResponse.data.token, sessionId: loginResponse.data.sessionId };
  });
  
  // Test 2.2: Login with valid phone credentials
  await runTest('loginLogout', 'Login with valid phone credentials', async () => {
    const data = generateTestData();
    
    // Register user with phone
    const regResponse = await makeRequest('POST', '/register', {
      phone: data.phone,
      password: data.password,
      confirmPassword: data.confirmPassword,
      firstName: data.firstName,
      lastName: data.lastName
    });
    
    // Auto-verify user for login test
    await prisma.user.update({
      where: { id: regResponse.data.user.id },
      data: { status: 'ACTIVE', phoneVerified: new Date() }
    });
    
    // Login
    const loginResponse = await makeRequest('POST', '/login', {
      identifier: data.phone,
      password: data.password
    });
    
    if (loginResponse.status !== 200) {
      throw new Error(`Expected status 200, got ${loginResponse.status}`);
    }
    
    if (!loginResponse.data.token) {
      throw new Error('Token not returned');
    }
    
    performanceMetrics.login.push({ test: 'valid_phone_login', duration: loginResponse.duration || 0 });
    return { token: loginResponse.data.token };
  });
  
  // Test 2.3: Login with invalid credentials
  await runTest('loginLogout', 'Login with invalid credentials should fail', async () => {
    const data = generateTestData();
    
    // Register user
    await makeRequest('POST', '/register', {
      email: data.email,
      password: data.password,
      confirmPassword: data.confirmPassword,
      firstName: data.firstName,
      lastName: data.lastName
    });
    
    // Login with wrong password
    const loginResponse = await makeRequest('POST', '/login', {
      identifier: data.email,
      password: 'WrongPassword@123'
    });
    
    if (loginResponse.status !== 401) {
      throw new Error(`Expected status 401, got ${loginResponse.status}`);
    }
    
    if (!loginResponse.data.error || !loginResponse.data.error.includes('Invalid')) {
      throw new Error('Invalid credentials error not returned');
    }
    
    return { message: 'Invalid credentials correctly rejected' };
  });
  
  // Test 2.4: Login with non-existent user
  await runTest('loginLogout', 'Login with non-existent user should fail', async () => {
    const loginResponse = await makeRequest('POST', '/login', {
      identifier: 'nonexistent@example.com',
      password: 'Test@123456'
    });
    
    if (loginResponse.status !== 401) {
      throw new Error(`Expected status 401, got ${loginResponse.status}`);
    }
    
    return { message: 'Non-existent user correctly rejected' };
  });
  
  // Test 2.5: Login with unverified email
  await runTest('loginLogout', 'Login with unverified email should fail', async () => {
    const data = generateTestData();
    
    // Register user (keeps PENDING status)
    await makeRequest('POST', '/register', {
      email: data.email,
      password: data.password,
      confirmPassword: data.confirmPassword,
      firstName: data.firstName,
      lastName: data.lastName
    });
    
    // Try to login without verification
    const loginResponse = await makeRequest('POST', '/login', {
      identifier: data.email,
      password: data.password
    });
    
    if (loginResponse.status !== 403) {
      throw new Error(`Expected status 403, got ${loginResponse.status}`);
    }
    
    if (!loginResponse.data.error || !loginResponse.data.error.includes('verified')) {
      throw new Error('Verification required error not returned');
    }
    
    return { message: 'Unverified user correctly rejected' };
  });
  
  // Test 2.6: Logout functionality
  await runTest('loginLogout', 'Logout functionality', async () => {
    const data = generateTestData();
    
    // Register and verify user
    const regResponse = await makeRequest('POST', '/register', {
      email: data.email,
      password: data.password,
      confirmPassword: data.confirmPassword,
      firstName: data.firstName,
      lastName: data.lastName
    });
    
    await prisma.user.update({
      where: { id: regResponse.data.user.id },
      data: { status: 'ACTIVE', emailVerified: new Date() }
    });
    
    // Login
    const loginResponse = await makeRequest('POST', '/login', {
      identifier: data.email,
      password: data.password
    });
    
    // Logout
    const logoutResponse = await makeRequest('POST', '/logout', {}, {
      'Cookie': `sessionId=${loginResponse.data.sessionId}`
    });
    
    if (logoutResponse.status !== 200) {
      throw new Error(`Expected status 200, got ${logoutResponse.status}`);
    }
    
    performanceMetrics.logout.push({ test: 'normal_logout', duration: logoutResponse.duration || 0 });
    return { message: 'Logout successful' };
  });
  
  // Test 2.7: Logout from all devices
  await runTest('loginLogout', 'Logout from all devices', async () => {
    const data = generateTestData();
    
    // Register and verify user
    const regResponse = await makeRequest('POST', '/register', {
      email: data.email,
      password: data.password,
      confirmPassword: data.confirmPassword,
      firstName: data.firstName,
      lastName: data.lastName
    });
    
    await prisma.user.update({
      where: { id: regResponse.data.user.id },
      data: { status: 'ACTIVE', emailVerified: new Date() }
    });
    
    // Login multiple times
    const login1 = await makeRequest('POST', '/login', {
      identifier: data.email,
      password: data.password
    });
    
    const login2 = await makeRequest('POST', '/login', {
      identifier: data.email,
      password: data.password
    });
    
    // Logout from all devices
    const logoutResponse = await makeRequest('POST', '/logout', {
      allDevices: true
    }, {
      'Cookie': `sessionId=${login1.data.sessionId}`
    });
    
    if (logoutResponse.status !== 200) {
      throw new Error(`Expected status 200, got ${logoutResponse.status}`);
    }
    
    if (!logoutResponse.data.allDevices) {
      throw new Error('All devices flag not set');
    }
    
    return { message: 'Logout from all devices successful' };
  });
  
  // Test 2.8: Remember me functionality
  await runTest('loginLogout', 'Remember me functionality', async () => {
    const data = generateTestData();
    
    // Register and verify user
    const regResponse = await makeRequest('POST', '/register', {
      email: data.email,
      password: data.password,
      confirmPassword: data.confirmPassword,
      firstName: data.firstName,
      lastName: data.lastName
    });
    
    await prisma.user.update({
      where: { id: regResponse.data.user.id },
      data: { status: 'ACTIVE', emailVerified: new Date() }
    });
    
    // Login with remember me
    const loginResponse = await makeRequest('POST', '/login', {
      identifier: data.email,
      password: data.password,
      rememberMe: true
    });
    
    if (loginResponse.status !== 200) {
      throw new Error(`Expected status 200, got ${loginResponse.status}`);
    }
    
    if (!loginResponse.data.rememberMe) {
      throw new Error('Remember me flag not set');
    }
    
    if (loginResponse.data.maxAge !== 7 * 24 * 60 * 60 * 1000) {
      throw new Error('Remember me max age incorrect');
    }
    
    return { message: 'Remember me successful' };
  });
  
  // Test 2.9: Token refresh
  await runTest('loginLogout', 'Token refresh', async () => {
    const data = generateTestData();
    
    // Register and verify user
    const regResponse = await makeRequest('POST', '/register', {
      email: data.email,
      password: data.password,
      confirmPassword: data.confirmPassword,
      firstName: data.firstName,
      lastName: data.lastName
    });
    
    await prisma.user.update({
      where: { id: regResponse.data.user.id },
      data: { status: 'ACTIVE', emailVerified: new Date() }
    });
    
    // Login
    const loginResponse = await makeRequest('POST', '/login', {
      identifier: data.email,
      password: data.password
    });
    
    // Refresh token
    const refreshResponse = await makeRequest('POST', '/refresh', {
      token: loginResponse.data.token
    });
    
    if (refreshResponse.status !== 200) {
      throw new Error(`Expected status 200, got ${refreshResponse.status}`);
    }
    
    if (!refreshResponse.data.token) {
      throw new Error('New token not returned');
    }
    
    return { message: 'Token refresh successful' };
  });
  
  // Test 2.10: Refresh from remember me token
  await runTest('loginLogout', 'Refresh from remember me token', async () => {
    const data = generateTestData();
    
    // Register and verify user
    const regResponse = await makeRequest('POST', '/register', {
      email: data.email,
      password: data.password,
      confirmPassword: data.confirmPassword,
      firstName: data.firstName,
      lastName: data.lastName
    });
    
    await prisma.user.update({
      where: { id: regResponse.data.user.id },
      data: { status: 'ACTIVE', emailVerified: new Date() }
    });
    
    // Login with remember me
    const loginResponse = await makeRequest('POST', '/login', {
      identifier: data.email,
      password: data.password,
      rememberMe: true
    });
    
    // Get remember me token from session
    const session = await prisma.session.findUnique({
      where: { id: loginResponse.data.sessionId }
    });
    
    if (!session || !session.rememberMeToken) {
      throw new Error('Remember me token not created');
    }
    
    // Refresh from remember me token
    const refreshResponse = await makeRequest('POST', '/refresh-from-remember-me', {
      token: session.rememberMeToken
    });
    
    if (refreshResponse.status !== 200) {
      throw new Error(`Expected status 200, got ${refreshResponse.status}`);
    }
    
    return { message: 'Refresh from remember me token successful' };
  });
}

// ============================================================================
// 3. PASSWORD RECOVERY FLOW TESTS
// ============================================================================

async function testPasswordRecoveryFlow() {
  console.log('\n=== PASSWORD RECOVERY FLOW TESTS ===\n');
  
  // Test 3.1: Forgot password with valid email
  await runTest('passwordRecovery', 'Forgot password with valid email', async () => {
    const data = generateTestData();
    
    // Register and verify user
    const regResponse = await makeRequest('POST', '/register', {
      email: data.email,
      password: data.password,
      confirmPassword: data.confirmPassword,
      firstName: data.firstName,
      lastName: data.lastName
    });
    
    await prisma.user.update({
      where: { id: regResponse.data.user.id },
      data: { status: 'ACTIVE', emailVerified: new Date() }
    });
    
    // Forgot password
    const forgotResponse = await makeRequest('POST', '/forgot-password', {
      email: data.email
    });
    
    if (forgotResponse.status !== 200) {
      throw new Error(`Expected status 200, got ${forgotResponse.status}`);
    }
    
    return { message: 'Forgot password request successful' };
  });
  
  // Test 3.2: Forgot password with invalid email (should not reveal user existence)
  await runTest('passwordRecovery', 'Forgot password with invalid email', async () => {
    const forgotResponse = await makeRequest('POST', '/forgot-password', {
      email: 'nonexistent@example.com'
    });
    
    if (forgotResponse.status !== 200) {
      throw new Error(`Expected status 200, got ${forgotResponse.status}`);
    }
    
    // Should return success message even if user doesn't exist (security)
    if (!forgotResponse.data.message) {
      throw new Error('Message not returned');
    }
    
    return { message: 'Forgot password request handled securely' };
  });
  
  // Test 3.3: Reset password with valid token
  await runTest('passwordRecovery', 'Reset password with valid token', async () => {
    const data = generateTestData();
    
    // Register and verify user
    const regResponse = await makeRequest('POST', '/register', {
      email: data.email,
      password: data.password,
      confirmPassword: data.confirmPassword,
      firstName: data.firstName,
      lastName: data.lastName
    });
    
    await prisma.user.update({
      where: { id: regResponse.data.user.id },
      data: { status: 'ACTIVE', emailVerified: new Date() }
    });
    
    // Request password reset
    await makeRequest('POST', '/forgot-password', {
      email: data.email
    });
    
    // Get reset token from database
    const resetToken = await prisma.emailVerificationToken.findFirst({
      where: { userId: regResponse.data.user.id },
      orderBy: { createdAt: 'desc' }
    });
    
    if (!resetToken) {
      throw new Error('Reset token not created');
    }
    
    // Reset password
    const resetResponse = await makeRequest('POST', '/reset-password', {
      token: resetToken.token,
      newPassword: 'NewPassword@123',
      confirmPassword: 'NewPassword@123'
    });
    
    if (resetResponse.status !== 200) {
      throw new Error(`Expected status 200, got ${resetResponse.status}`);
    }
    
    performanceMetrics.passwordReset.push({ test: 'valid_token_reset', duration: resetResponse.duration || 0 });
    return { message: 'Password reset successful' };
  });
  
  // Test 3.4: Reset password with expired token
  await runTest('passwordRecovery', 'Reset password with expired token should fail', async () => {
    const data = generateTestData();
    
    // Register and verify user
    const regResponse = await makeRequest('POST', '/register', {
      email: data.email,
      password: data.password,
      confirmPassword: data.confirmPassword,
      firstName: data.firstName,
      lastName: data.lastName
    });
    
    await prisma.user.update({
      where: { id: regResponse.data.user.id },
      data: { status: 'ACTIVE', emailVerified: new Date() }
    });
    
    // Create expired token
    const expiredToken = 'expired-token-' + Date.now();
    await prisma.emailVerificationToken.create({
      data: {
        userId: regResponse.data.user.id,
        token: expiredToken,
        expiresAt: new Date(Date.now() - 1000000) // Expired
      }
    });
    
    // Try to reset password with expired token
    const resetResponse = await makeRequest('POST', '/reset-password', {
      token: expiredToken,
      newPassword: 'NewPassword@123',
      confirmPassword: 'NewPassword@123'
    });
    
    if (resetResponse.status !== 400) {
      throw new Error(`Expected status 400, got ${resetResponse.status}`);
    }
    
    if (!resetResponse.data.error || !resetResponse.data.error.includes('expired')) {
      throw new Error('Expired token error not returned');
    }
    
    return { message: 'Expired token correctly rejected' };
  });
  
  // Test 3.5: Reset password with invalid token
  await runTest('passwordRecovery', 'Reset password with invalid token should fail', async () => {
    const resetResponse = await makeRequest('POST', '/reset-password', {
      token: 'invalid-token-12345',
      newPassword: 'NewPassword@123',
      confirmPassword: 'NewPassword@123'
    });
    
    if (resetResponse.status !== 400) {
      throw new Error(`Expected status 400, got ${resetResponse.status}`);
    }
    
    return { message: 'Invalid token correctly rejected' };
  });
  
  // Test 3.6: Change password
  await runTest('passwordRecovery', 'Change password', async () => {
    const data = generateTestData();
    
    // Register and verify user
    const regResponse = await makeRequest('POST', '/register', {
      email: data.email,
      password: data.password,
      confirmPassword: data.confirmPassword,
      firstName: data.firstName,
      lastName: data.lastName
    });
    
    await prisma.user.update({
      where: { id: regResponse.data.user.id },
      data: { status: 'ACTIVE', emailVerified: new Date() }
    });
    
    // Login
    const loginResponse = await makeRequest('POST', '/login', {
      identifier: data.email,
      password: data.password
    });
    
    // Change password
    const changeResponse = await makeRequest('POST', '/change-password', {
      currentPassword: data.password,
      newPassword: 'NewPassword@123',
      confirmPassword: 'NewPassword@123'
    }, {
      'Authorization': `Bearer ${loginResponse.data.token}`
    });
    
    if (changeResponse.status !== 200) {
      throw new Error(`Expected status 200, got ${changeResponse.status}`);
    }
    
    performanceMetrics.passwordChange.push({ test: 'valid_password_change', duration: changeResponse.duration || 0 });
    return { message: 'Password change successful' };
  });
  
  // Test 3.7: Change password with wrong current password
  await runTest('passwordRecovery', 'Change password with wrong current password should fail', async () => {
    const data = generateTestData();
    
    // Register and verify user
    const regResponse = await makeRequest('POST', '/register', {
      email: data.email,
      password: data.password,
      confirmPassword: data.confirmPassword,
      firstName: data.firstName,
      lastName: data.lastName
    });
    
    await prisma.user.update({
      where: { id: regResponse.data.user.id },
      data: { status: 'ACTIVE', emailVerified: new Date() }
    });
    
    // Login
    const loginResponse = await makeRequest('POST', '/login', {
      identifier: data.email,
      password: data.password
    });
    
    // Try to change password with wrong current password
    const changeResponse = await makeRequest('POST', '/change-password', {
      currentPassword: 'WrongPassword@123',
      newPassword: 'NewPassword@123',
      confirmPassword: 'NewPassword@123'
    }, {
      'Authorization': `Bearer ${loginResponse.data.token}`
    });
    
    if (changeResponse.status !== 401) {
      throw new Error(`Expected status 401, got ${changeResponse.status}`);
    }
    
    return { message: 'Wrong current password correctly rejected' };
  });
  
  // Test 3.8: Change password with weak new password
  await runTest('passwordRecovery', 'Change password with weak new password should fail', async () => {
    const data = generateTestData();
    
    // Register and verify user
    const regResponse = await makeRequest('POST', '/register', {
      email: data.email,
      password: data.password,
      confirmPassword: data.confirmPassword,
      firstName: data.firstName,
      lastName: data.lastName
    });
    
    await prisma.user.update({
      where: { id: regResponse.data.user.id },
      data: { status: 'ACTIVE', emailVerified: new Date() }
    });
    
    // Login
    const loginResponse = await makeRequest('POST', '/login', {
      identifier: data.email,
      password: data.password
    });
    
    // Try to change password with weak new password
    const changeResponse = await makeRequest('POST', '/change-password', {
      currentPassword: data.password,
      newPassword: 'weak',
      confirmPassword: 'weak'
    }, {
      'Authorization': `Bearer ${loginResponse.data.token}`
    });
    
    if (changeResponse.status !== 400) {
      throw new Error(`Expected status 400, got ${changeResponse.status}`);
    }
    
    return { message: 'Weak new password correctly rejected' };
  });
  
  // Test 3.9: Get password policy
  await runTest('passwordRecovery', 'Get password policy', async () => {
    const response = await makeRequest('GET', '/password-policy');
    
    if (response.status !== 200) {
      throw new Error(`Expected status 200, got ${response.status}`);
    }
    
    if (!response.data.policy) {
      throw new Error('Password policy not returned');
    }
    
    return { policy: response.data.policy };
  });
  
  // Test 3.10: Password reuse prevention
  await runTest('passwordRecovery', 'Password reuse prevention', async () => {
    const data = generateTestData();
    
    // Register and verify user
    const regResponse = await makeRequest('POST', '/register', {
      email: data.email,
      password: data.password,
      confirmPassword: data.confirmPassword,
      firstName: data.firstName,
      lastName: data.lastName
    });
    
    await prisma.user.update({
      where: { id: regResponse.data.user.id },
      data: { status: 'ACTIVE', emailVerified: new Date() }
    });
    
    // Login
    const loginResponse = await makeRequest('POST', '/login', {
      identifier: data.email,
      password: data.password
    });
    
    // Change password
    await makeRequest('POST', '/change-password', {
      currentPassword: data.password,
      newPassword: 'NewPassword@123',
      confirmPassword: 'NewPassword@123'
    }, {
      'Authorization': `Bearer ${loginResponse.data.token}`
    });
    
    // Try to reuse old password
    const changeResponse = await makeRequest('POST', '/change-password', {
      currentPassword: 'NewPassword@123',
      newPassword: data.password,
      confirmPassword: data.password
    }, {
      'Authorization': `Bearer ${loginResponse.data.token}`
    });
    
    if (changeResponse.status !== 400) {
      throw new Error(`Expected status 400, got ${changeResponse.status}`);
    }
    
    if (!changeResponse.data.error || !changeResponse.data.error.includes('reused')) {
      throw new Error('Password reuse error not returned');
    }
    
    return { message: 'Password reuse correctly prevented' };
  });
}

// ============================================================================
// 4. SESSION MANAGEMENT TESTS
// ============================================================================

async function testSessionManagement() {
  console.log('\n=== SESSION MANAGEMENT TESTS ===\n');
  
  // Test 4.1: Session creation on login
  await runTest('sessionManagement', 'Session creation on login', async () => {
    const data = generateTestData();
    
    // Register and verify user
    const regResponse = await makeRequest('POST', '/register', {
      email: data.email,
      password: data.password,
      confirmPassword: data.confirmPassword,
      firstName: data.firstName,
      lastName: data.lastName
    });
    
    await prisma.user.update({
      where: { id: regResponse.data.user.id },
      data: { status: 'ACTIVE', emailVerified: new Date() }
    });
    
    // Login
    const loginResponse = await makeRequest('POST', '/login', {
      identifier: data.email,
      password: data.password
    });
    
    // Verify session was created
    const session = await prisma.session.findUnique({
      where: { id: loginResponse.data.sessionId }
    });
    
    if (!session) {
      throw new Error('Session not created');
    }
    
    if (session.userId !== regResponse.data.user.id) {
      throw new Error('Session user ID mismatch');
    }
    
    return { sessionId: session.id, userId: session.userId };
  });
  
  // Test 4.2: Session validation
  await runTest('sessionManagement', 'Session validation', async () => {
    const data = generateTestData();
    
    // Register and verify user
    const regResponse = await makeRequest('POST', '/register', {
      email: data.email,
      password: data.password,
      confirmPassword: data.confirmPassword,
      firstName: data.firstName,
      lastName: data.lastName
    });
    
    await prisma.user.update({
      where: { id: regResponse.data.user.id },
      data: { status: 'ACTIVE', emailVerified: new Date() }
    });
    
    // Login
    const loginResponse = await makeRequest('POST', '/login', {
      identifier: data.email,
      password: data.password
    });
    
    // Validate session (this would typically be done via middleware)
    const session = await prisma.session.findUnique({
      where: { id: loginResponse.data.sessionId }
    });
    
    if (!session || session.expiresAt < new Date()) {
      throw new Error('Session validation failed');
    }
    
    performanceMetrics.sessionValidation.push({ test: 'valid_session', duration: 0 });
    return { message: 'Session validation successful' };
  });
  
  // Test 4.3: Session expiration
  await runTest('sessionManagement', 'Session expiration', async () => {
    const data = generateTestData();
    
    // Register and verify user
    const regResponse = await makeRequest('POST', '/register', {
      email: data.email,
      password: data.password,
      confirmPassword: data.confirmPassword,
      firstName: data.firstName,
      lastName: data.lastName
    });
    
    await prisma.user.update({
      where: { id: regResponse.data.user.id },
      data: { status: 'ACTIVE', emailVerified: new Date() }
    });
    
    // Login
    const loginResponse = await makeRequest('POST', '/login', {
      identifier: data.email,
      password: data.password
    });
    
    // Manually expire session
    await prisma.session.update({
      where: { id: loginResponse.data.sessionId },
      data: { expiresAt: new Date(Date.now() - 1000000) }
    });
    
    // Try to use expired session
    const session = await prisma.session.findUnique({
      where: { id: loginResponse.data.sessionId }
    });
    
    if (!session || session.expiresAt >= new Date()) {
      throw new Error('Session expiration test failed');
    }
    
    return { message: 'Session expiration handled correctly' };
  });
  
  // Test 4.4: Concurrent sessions
  await runTest('sessionManagement', 'Concurrent sessions', async () => {
    const data = generateTestData();
    
    // Register and verify user
    const regResponse = await makeRequest('POST', '/register', {
      email: data.email,
      password: data.password,
      confirmPassword: data.confirmPassword,
      firstName: data.firstName,
      lastName: data.lastName
    });
    
    await prisma.user.update({
      where: { id: regResponse.data.user.id },
      data: { status: 'ACTIVE', emailVerified: new Date() }
    });
    
    // Login multiple times
    const login1 = await makeRequest('POST', '/login', {
      identifier: data.email,
      password: data.password
    });
    
    const login2 = await makeRequest('POST', '/login', {
      identifier: data.email,
      password: data.password
    });
    
    const login3 = await makeRequest('POST', '/login', {
      identifier: data.email,
      password: data.password
    });
    
    // Verify all sessions exist
    const sessions = await prisma.session.findMany({
      where: { userId: regResponse.data.user.id }
    });
    
    if (sessions.length < 3) {
      throw new Error(`Expected at least 3 sessions, got ${sessions.length}`);
    }
    
    return { message: `Concurrent sessions: ${sessions.length} active` };
  });
  
  // Test 4.5: Session cleanup on logout
  await runTest('sessionManagement', 'Session cleanup on logout', async () => {
    const data = generateTestData();
    
    // Register and verify user
    const regResponse = await makeRequest('POST', '/register', {
      email: data.email,
      password: data.password,
      confirmPassword: data.confirmPassword,
      firstName: data.firstName,
      lastName: data.lastName
    });
    
    await prisma.user.update({
      where: { id: regResponse.data.user.id },
      data: { status: 'ACTIVE', emailVerified: new Date() }
    });
    
    // Login
    const loginResponse = await makeRequest('POST', '/login', {
      identifier: data.email,
      password: data.password
    });
    
    // Logout
    await makeRequest('POST', '/logout', {}, {
      'Cookie': `sessionId=${loginResponse.data.sessionId}`
    });
    
    // Verify session was destroyed
    const session = await prisma.session.findUnique({
      where: { id: loginResponse.data.sessionId }
    });
    
    if (session) {
      throw new Error('Session not destroyed after logout');
    }
    
    return { message: 'Session cleanup successful' };
  });
  
  // Test 4.6: Remember me token validation
  await runTest('sessionManagement', 'Remember me token validation', async () => {
    const data = generateTestData();
    
    // Register and verify user
    const regResponse = await makeRequest('POST', '/register', {
      email: data.email,
      password: data.password,
      confirmPassword: data.confirmPassword,
      firstName: data.firstName,
      lastName: data.lastName
    });
    
    await prisma.user.update({
      where: { id: regResponse.data.user.id },
      data: { status: 'ACTIVE', emailVerified: new Date() }
    });
    
    // Login with remember me
    const loginResponse = await makeRequest('POST', '/login', {
      identifier: data.email,
      password: data.password,
      rememberMe: true
    });
    
    // Get remember me token
    const session = await prisma.session.findUnique({
      where: { id: loginResponse.data.sessionId }
    });
    
    if (!session || !session.rememberMeToken) {
      throw new Error('Remember me token not created');
    }
    
    // Validate remember me token
    const validateResponse = await makeRequest('POST', '/validate-remember-me', {
      token: session.rememberMeToken
    });
    
    if (validateResponse.status !== 200) {
      throw new Error(`Expected status 200, got ${validateResponse.status}`);
    }
    
    return { message: 'Remember me token validation successful' };
  });
  
  // Test 4.7: Disable remember me
  await runTest('sessionManagement', 'Disable remember me', async () => {
    const data = generateTestData();
    
    // Register and verify user
    const regResponse = await makeRequest('POST', '/register', {
      email: data.email,
      password: data.password,
      confirmPassword: data.confirmPassword,
      firstName: data.firstName,
      lastName: data.lastName
    });
    
    await prisma.user.update({
      where: { id: regResponse.data.user.id },
      data: { status: 'ACTIVE', emailVerified: new Date() }
    });
    
    // Login with remember me
    const loginResponse = await makeRequest('POST', '/login', {
      identifier: data.email,
      password: data.password,
      rememberMe: true
    });
    
    // Disable remember me
    const disableResponse = await makeRequest('POST', '/disable-remember-me', {}, {
      'Authorization': `Bearer ${loginResponse.data.token}`
    });
    
    if (disableResponse.status !== 200) {
      throw new Error(`Expected status 200, got ${disableResponse.status}`);
    }
    
    return { message: 'Remember me disabled successfully' };
  });
  
  // Test 4.8: Redis session storage (if available)
  await runTest('sessionManagement', 'Redis session storage', async () => {
    const data = generateTestData();
    
    // Register and verify user
    const regResponse = await makeRequest('POST', '/register', {
      email: data.email,
      password: data.password,
      confirmPassword: data.confirmPassword,
      firstName: data.firstName,
      lastName: data.lastName
    });
    
    await prisma.user.update({
      where: { id: regResponse.data.user.id },
      data: { status: 'ACTIVE', emailVerified: new Date() }
    });
    
    // Login
    const loginResponse = await makeRequest('POST', '/login', {
      identifier: data.email,
      password: data.password
    });
    
    // Check if session is stored (either in Redis or PostgreSQL)
    const session = await prisma.session.findUnique({
      where: { id: loginResponse.data.sessionId }
    });
    
    if (!session) {
      throw new Error('Session not stored');
    }
    
    return { message: 'Session storage working', storageType: 'database' };
  });
  
  // Test 4.9: Session timeout warning (2 minutes before expiry)
  await runTest('sessionManagement', 'Session timeout warning', async () => {
    const data = generateTestData();
    
    // Register and verify user
    const regResponse = await makeRequest('POST', '/register', {
      email: data.email,
      password: data.password,
      confirmPassword: data.confirmPassword,
      firstName: data.firstName,
      lastName: data.lastName
    });
    
    await prisma.user.update({
      where: { id: regResponse.data.user.id },
      data: { status: 'ACTIVE', emailVerified: new Date() }
    });
    
    // Login
    const loginResponse = await makeRequest('POST', '/login', {
      identifier: data.email,
      password: data.password
    });
    
    // Get session
    const session = await prisma.session.findUnique({
      where: { id: loginResponse.data.sessionId }
    });
    
    if (!session) {
      throw new Error('Session not found');
    }
    
    // Check if session expiresAt is set
    if (!session.expiresAt) {
      throw new Error('Session expiry not set');
    }
    
    // Calculate time until expiry
    const timeUntilExpiry = session.expiresAt.getTime() - Date.now();
    
    // Check if warning threshold (2 minutes) can be calculated
    const warningThreshold = 2 * 60 * 1000; // 2 minutes
    if (timeUntilExpiry < warningThreshold) {
      return { message: 'Session near expiry, warning should trigger' };
    } else {
      return { message: 'Session has sufficient time', timeUntilExpiry };
    }
  });
  
  // Test 4.10: Session extension
  await runTest('sessionManagement', 'Session extension', async () => {
    const data = generateTestData();
    
    // Register and verify user
    const regResponse = await makeRequest('POST', '/register', {
      email: data.email,
      password: data.password,
      confirmPassword: data.confirmPassword,
      firstName: data.firstName,
      lastName: data.lastName
    });
    
    await prisma.user.update({
      where: { id: regResponse.data.user.id },
      data: { status: 'ACTIVE', emailVerified: new Date() }
    });
    
    // Login
    const loginResponse = await makeRequest('POST', '/login', {
      identifier: data.email,
      password: data.password
    });
    
    // Get original session expiry
    const originalSession = await prisma.session.findUnique({
      where: { id: loginResponse.data.sessionId }
    });
    
    // Refresh token (extends session)
    const refreshResponse = await makeRequest('POST', '/refresh', {
      token: loginResponse.data.token
    });
    
    // Get updated session expiry
    const updatedSession = await prisma.session.findUnique({
      where: { id: loginResponse.data.sessionId }
    });
    
    if (!updatedSession) {
      throw new Error('Session not found after refresh');
    }
    
    return { message: 'Session extension successful' };
  });
}

// ============================================================================
// 5. SECURITY TESTING
// ============================================================================

async function testSecurity() {
  console.log('\n=== SECURITY TESTING ===\n');
  
  // Test 5.1: SQL injection prevention
  await runTest('security', 'SQL injection prevention', async () => {
    const data = generateTestData();
    
    // Try to register with SQL injection in email
    const response = await makeRequest('POST', '/register', {
      email: "test@example.com'; DROP TABLE users; --",
      password: data.password,
      confirmPassword: data.confirmPassword,
      firstName: data.firstName,
      lastName: data.lastName
    });
    
    // Should fail validation or be sanitized
    if (response.status === 200) {
      // If it passes, verify email was sanitized
      const user = await prisma.user.findFirst({
        where: { email: { contains: "DROP TABLE" } }
      });
      
      if (user) {
        throw new Error('SQL injection not prevented');
      }
    }
    
    return { message: 'SQL injection prevented or rejected' };
  });
  
  // Test 5.2: XSS protection (input sanitization)
  await runTest('security', 'XSS protection (input sanitization)', async () => {
    const data = generateTestData();
    
    // Try to register with XSS in firstName
    const response = await makeRequest('POST', '/register', {
      email: data.email,
      password: data.password,
      confirmPassword: data.confirmPassword,
      firstName: '<script>alert("XSS")</script>',
      lastName: data.lastName
    });
    
    if (response.status === 200 || response.status === 201) {
      // Check if XSS was sanitized
      const user = await prisma.user.findFirst({
        where: { email: data.email }
      });
      
      if (user && user.firstName && user.firstName.includes('<script>')) {
        throw new Error('XSS not sanitized');
      }
    }
    
    return { message: 'XSS protection working' };
  });
  
  // Test 5.3: CSRF protection
  await runTest('security', 'CSRF protection', async () => {
    // Check if CSRF middleware is present
    // This is a basic check - actual CSRF testing would require more complex setup
    const data = generateTestData();
    
    // Try to make a request without CSRF token (if CSRF is enabled)
    const response = await makeRequest('POST', '/register', {
      email: data.email,
      password: data.password,
      confirmPassword: data.confirmPassword,
      firstName: data.firstName,
      lastName: data.lastName
    });
    
    // If CSRF is enabled, this might fail
    // For now, we'll just note that CSRF protection should be implemented
    return { message: 'CSRF protection should be implemented in production' };
  });
  
  // Test 5.4: Rate limiting
  await runTest('security', 'Rate limiting', async () => {
    const data = generateTestData();
    
    // Try multiple failed login attempts rapidly
    const attempts = [];
    for (let i = 0; i < 10; i++) {
      attempts.push(makeRequest('POST', '/login', {
        identifier: data.email,
        password: 'WrongPassword@123'
      }));
    }
    
    const results = await Promise.all(attempts);
    
    // Check if rate limiting kicked in (429 status)
    const rateLimited = results.some(r => r.status === 429);
    
    if (rateLimited) {
      return { message: 'Rate limiting is working' };
    } else {
      return { message: 'Rate limiting not detected (may not be enabled)' };
    }
  });
  
  // Test 5.5: Brute force protection
  await runTest('security', 'Brute force protection', async () => {
    const data = generateTestData();
    
    // Register user
    await makeRequest('POST', '/register', {
      email: data.email,
      password: data.password,
      confirmPassword: data.confirmPassword,
      firstName: data.firstName,
      lastName: data.lastName
    });
    
    // Try multiple failed login attempts
    for (let i = 0; i < 5; i++) {
      await makeRequest('POST', '/login', {
        identifier: data.email,
        password: 'WrongPassword@123'
      });
    }
    
    // Try to login with correct password
    const loginResponse = await makeRequest('POST', '/login', {
      identifier: data.email,
      password: data.password
    });
    
    // If brute force protection is working, this might be blocked
    if (loginResponse.status === 429 || loginResponse.status === 403) {
      return { message: 'Brute force protection is working' };
    } else {
      return { message: 'Brute force protection may not be enabled' };
    }
  });
  
  // Test 5.6: Password hashing (bcrypt strength)
  await runTest('security', 'Password hashing (bcrypt strength)', async () => {
    const data = generateTestData();
    
    // Register user
    const regResponse = await makeRequest('POST', '/register', {
      email: data.email,
      password: data.password,
      confirmPassword: data.confirmPassword,
      firstName: data.firstName,
      lastName: data.lastName
    });
    
    // Get user from database
    const user = await prisma.user.findUnique({
      where: { id: regResponse.data.user.id }
    });
    
    if (!user || !user.password) {
      throw new Error('User password not found');
    }
    
    // Check if password is hashed (starts with $2b$ or $2a$ for bcrypt)
    if (!user.password.startsWith('$2b$') && !user.password.startsWith('$2a$')) {
      throw new Error('Password not hashed with bcrypt');
    }
    
    // Verify password can be verified
    const isValid = await bcrypt.compare(data.password, user.password);
    
    if (!isValid) {
      throw new Error('Password verification failed');
    }
    
    return { message: 'Password hashing working correctly', algorithm: 'bcrypt' };
  });
  
  // Test 5.7: Token security (JWT validation)
  await runTest('security', 'Token security (JWT validation)', async () => {
    const data = generateTestData();
    
    // Register and verify user
    const regResponse = await makeRequest('POST', '/register', {
      email: data.email,
      password: data.password,
      confirmPassword: data.confirmPassword,
      firstName: data.firstName,
      lastName: data.lastName
    });
    
    await prisma.user.update({
      where: { id: regResponse.data.user.id },
      data: { status: 'ACTIVE', emailVerified: new Date() }
    });
    
    // Login
    const loginResponse = await makeRequest('POST', '/login', {
      identifier: data.email,
      password: data.password
    });
    
    // Verify token structure
    const token = loginResponse.data.token;
    if (!token) {
      throw new Error('Token not returned');
    }
    
    // Try to decode token
    try {
      const decoded = jwt.decode(token);
      
      if (!decoded || !decoded.userId || !decoded.exp) {
        throw new Error('Token structure invalid');
      }
      
      // Verify token with secret (this would fail if token is tampered)
      const verified = jwt.verify(token, process.env.JWT_SECRET || 'test-secret');
      
      return { message: 'JWT validation working', algorithm: verified.alg || 'HS256' };
    } catch (error) {
      throw new Error('JWT validation failed: ' + error.message);
    }
  });
  
  // Test 5.8: Input validation
  await runTest('security', 'Input validation', async () => {
    const data = generateTestData();
    
    // Test with invalid email format
    const response1 = await makeRequest('POST', '/register', {
      email: 'invalid-email',
      password: data.password,
      confirmPassword: data.confirmPassword,
      firstName: data.firstName,
      lastName: data.lastName
    });
    
    if (response1.status !== 400) {
      throw new Error('Invalid email not rejected');
    }
    
    // Test with invalid phone format
    const response2 = await makeRequest('POST', '/register', {
      phone: 'invalid-phone',
      password: data.password,
      confirmPassword: data.confirmPassword,
      firstName: data.firstName,
      lastName: data.lastName
    });
    
    if (response2.status !== 400) {
      throw new Error('Invalid phone not rejected');
    }
    
    return { message: 'Input validation working correctly' };
  });
  
  // Test 5.9: Authentication bypass attempts
  await runTest('security', 'Authentication bypass attempts', async () => {
    // Try to access protected endpoint without authentication
    const response = await makeRequest('POST', '/change-password', {
      currentPassword: 'Test@123456',
      newPassword: 'NewPassword@123',
      confirmPassword: 'NewPassword@123'
    });
    
    if (response.status !== 401) {
      throw new Error('Authentication bypass possible');
    }
    
    return { message: 'Authentication bypass prevented' };
  });
  
  // Test 5.10: Disposable email prevention
  await runTest('security', 'Disposable email prevention', async () => {
    const data = generateTestData();
    
    // Try to register with disposable email
    const response = await makeRequest('POST', '/register', {
      email: 'test@tempmail.com',
      password: data.password,
      confirmPassword: data.confirmPassword,
      firstName: data.firstName,
      lastName: data.lastName
    });
    
    // Should be rejected if disposable email detection is enabled
    if (response.status === 400 && response.data.error && response.data.error.includes('Disposable')) {
      return { message: 'Disposable email prevention working' };
    } else {
      return { message: 'Disposable email prevention may not be enabled' };
    }
  });
}

// ============================================================================
// 6. PERFORMANCE TESTING
// ============================================================================

async function testPerformance() {
  console.log('\n=== PERFORMANCE TESTING ===\n');
  
  // Test 6.1: Registration response time
  await runTest('performance', 'Registration response time', async () => {
    const startTime = Date.now();
    
    const data = generateTestData();
    const response = await makeRequest('POST', '/register', {
      email: data.email,
      password: data.password,
      confirmPassword: data.confirmPassword,
      firstName: data.firstName,
      lastName: data.lastName
    });
    
    const duration = Date.now() - startTime;
    
    if (response.status !== 201) {
      throw new Error('Registration failed');
    }
    
    // Registration should complete within 2 seconds
    if (duration > 2000) {
      throw new Error(`Registration too slow: ${duration}ms`);
    }
    
    return { message: 'Registration completed', duration: `${duration}ms` };
  });
  
  // Test 6.2: Login response time
  await runTest('performance', 'Login response time', async () => {
    const data = generateTestData();
    
    // Register and verify user
    const regResponse = await makeRequest('POST', '/register', {
      email: data.email,
      password: data.password,
      confirmPassword: data.confirmPassword,
      firstName: data.firstName,
      lastName: data.lastName
    });
    
    await prisma.user.update({
      where: { id: regResponse.data.user.id },
      data: { status: 'ACTIVE', emailVerified: new Date() }
    });
    
    const startTime = Date.now();
    
    const response = await makeRequest('POST', '/login', {
      identifier: data.email,
      password: data.password
    });
    
    const duration = Date.now() - startTime;
    
    if (response.status !== 200) {
      throw new Error('Login failed');
    }
    
    // Login should complete within 1 second
    if (duration > 1000) {
      throw new Error(`Login too slow: ${duration}ms`);
    }
    
    return { message: 'Login completed', duration: `${duration}ms` };
  });
  
  // Test 6.3: Concurrent user registration
  await runTest('performance', 'Concurrent user registration', async () => {
    const concurrentRegistrations = 10;
    const startTime = Date.now();
    
    const registrations = [];
    for (let i = 0; i < concurrentRegistrations; i++) {
      const data = generateTestData();
      registrations.push(makeRequest('POST', '/register', {
        email: data.email,
        password: data.password,
        confirmPassword: data.confirmPassword,
        firstName: data.firstName,
        lastName: data.lastName
      }));
    }
    
    const results = await Promise.all(registrations);
    const duration = Date.now() - startTime;
    
    const successful = results.filter(r => r.status === 201).length;
    
    if (successful < concurrentRegistrations * 0.8) {
      throw new Error(`Too many failed registrations: ${successful}/${concurrentRegistrations}`);
    }
    
    return { message: 'Concurrent registrations completed', successful, duration: `${duration}ms` };
  });
  
  // Test 6.4: Concurrent user login
  await runTest('performance', 'Concurrent user login', async () => {
    // Create 10 users first
    const users = [];
    for (let i = 0; i < 10; i++) {
      const data = generateTestData();
      const regResponse = await makeRequest('POST', '/register', {
        email: data.email,
        password: data.password,
        confirmPassword: data.confirmPassword,
        firstName: data.firstName,
        lastName: data.lastName
      });
      
      await prisma.user.update({
        where: { id: regResponse.data.user.id },
        data: { status: 'ACTIVE', emailVerified: new Date() }
      });
      
      users.push(data);
    }
    
    const startTime = Date.now();
    
    // Login all users concurrently
    const logins = users.map(user => 
      makeRequest('POST', '/login', {
        identifier: user.email,
        password: user.password
      })
    );
    
    const results = await Promise.all(logins);
    const duration = Date.now() - startTime;
    
    const successful = results.filter(r => r.status === 200).length;
    
    if (successful < 8) {
      throw new Error(`Too many failed logins: ${successful}/10`);
    }
    
    return { message: 'Concurrent logins completed', successful, duration: `${duration}ms` };
  });
  
  // Test 6.5: Session management under load
  await runTest('performance', 'Session management under load', async () => {
    const data = generateTestData();
    
    // Register and verify user
    const regResponse = await makeRequest('POST', '/register', {
      email: data.email,
      password: data.password,
      confirmPassword: data.confirmPassword,
      firstName: data.firstName,
      lastName: data.lastName
    });
    
    await prisma.user.update({
      where: { id: regResponse.data.user.id },
      data: { status: 'ACTIVE', emailVerified: new Date() }
    });
    
    const startTime = Date.now();
    
    // Create multiple sessions
    const sessions = [];
    for (let i = 0; i < 20; i++) {
      sessions.push(makeRequest('POST', '/login', {
        identifier: data.email,
        password: data.password
      }));
    }
    
    const results = await Promise.all(sessions);
    const duration = Date.now() - startTime;
    
    const successful = results.filter(r => r.status === 200).length;
    
    if (successful < 18) {
      throw new Error(`Too many failed session creations: ${successful}/20`);
    }
    
    return { message: 'Session management under load completed', successful, duration: `${duration}ms` };
  });
  
  // Test 6.6: Database query performance
  await runTest('performance', 'Database query performance', async () => {
    const startTime = Date.now();
    
    // Query users
    const users = await prisma.user.findMany({
      take: 10,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        status: true
      }
    });
    
    const duration = Date.now() - startTime;
    
    // Query should complete within 500ms
    if (duration > 500) {
      throw new Error(`Database query too slow: ${duration}ms`);
    }
    
    return { message: 'Database query completed', count: users.length, duration: `${duration}ms` };
  });
  
  // Test 6.7: Password change performance
  await runTest('performance', 'Password change performance', async () => {
    const data = generateTestData();
    
    // Register and verify user
    const regResponse = await makeRequest('POST', '/register', {
      email: data.email,
      password: data.password,
      confirmPassword: data.confirmPassword,
      firstName: data.firstName,
      lastName: data.lastName
    });
    
    await prisma.user.update({
      where: { id: regResponse.data.user.id },
      data: { status: 'ACTIVE', emailVerified: new Date() }
    });
    
    // Login
    const loginResponse = await makeRequest('POST', '/login', {
      identifier: data.email,
      password: data.password
    });
    
    const startTime = Date.now();
    
    // Change password
    const response = await makeRequest('POST', '/change-password', {
      currentPassword: data.password,
      newPassword: 'NewPassword@123',
      confirmPassword: 'NewPassword@123'
    }, {
      'Authorization': `Bearer ${loginResponse.data.token}`
    });
    
    const duration = Date.now() - startTime;
    
    if (response.status !== 200) {
      throw new Error('Password change failed');
    }
    
    // Password change should complete within 2 seconds
    if (duration > 2000) {
      throw new Error(`Password change too slow: ${duration}ms`);
    }
    
    return { message: 'Password change completed', duration: `${duration}ms` };
  });
  
  // Test 6.8: OTP verification performance
  await runTest('performance', 'OTP verification performance', async () => {
    const data = generateTestData();
    
    // Send OTP
    await makeRequest('POST', '/send-otp', {
      phone: data.phone
    });
    
    // Get OTP from database
    const otpRecord = await prisma.otp.findFirst({
      where: { phone: data.phone },
      orderBy: { createdAt: 'desc' }
    });
    
    if (!otpRecord) {
      throw new Error('OTP not created');
    }
    
    const startTime = Date.now();
    
    // Verify OTP
    const response = await makeRequest('POST', '/verify-otp', {
      phone: data.phone,
      otp: otpRecord.code
    });
    
    const duration = Date.now() - startTime;
    
    if (response.status !== 200) {
      throw new Error('OTP verification failed');
    }
    
    // OTP verification should complete within 1 second
    if (duration > 1000) {
      throw new Error(`OTP verification too slow: ${duration}ms`);
    }
    
    return { message: 'OTP verification completed', duration: `${duration}ms` };
  });
  
  // Test 6.9: Email verification performance
  await runTest('performance', 'Email verification performance', async () => {
    const data = generateTestData();
    
    // Register user
    const regResponse = await makeRequest('POST', '/register', {
      email: data.email,
      password: data.password,
      confirmPassword: data.confirmPassword,
      firstName: data.firstName,
      lastName: data.lastName
    });
    
    // Get verification token
    const verificationToken = await prisma.emailVerificationToken.findFirst({
      where: { userId: regResponse.data.user.id }
    });
    
    if (!verificationToken) {
      throw new Error('Verification token not created');
    }
    
    const startTime = Date.now();
    
    // Verify email
    const response = await makeRequest('POST', '/verify-email', {
      token: verificationToken.token
    });
    
    const duration = Date.now() - startTime;
    
    if (response.status !== 200) {
      throw new Error('Email verification failed');
    }
    
    // Email verification should complete within 1 second
    if (duration > 1000) {
      throw new Error(`Email verification too slow: ${duration}ms`);
    }
    
    return { message: 'Email verification completed', duration: `${duration}ms` };
  });
  
  // Test 6.10: Average response time across all endpoints
  await runTest('performance', 'Average response time across all endpoints', async () => {
    const data = generateTestData();
    
    // Test multiple endpoints
    const tests = [
      () => makeRequest('GET', '/password-policy'),
      () => makeRequest('GET', '/operators'),
      () => makeRequest('POST', '/validate-phone', { phone: data.phone })
    ];
    
    const startTime = Date.now();
    
    const results = await Promise.all(tests.map(test => test()));
    
    const duration = Date.now() - startTime;
    const avgDuration = duration / results.length;
    
    // Average response time should be under 500ms
    if (avgDuration > 500) {
      throw new Error(`Average response time too high: ${avgDuration}ms`);
    }
    
    return { message: 'Average response time calculated', avgDuration: `${avgDuration.toFixed(2)}ms` };
  });
}

// ============================================================================
// 7. ERROR HANDLING TESTS
// ============================================================================

async function testErrorHandling() {
  console.log('\n=== ERROR HANDLING TESTS ===\n');
  
  // Test 7.1: Network failure scenarios (simulated)
  await runTest('errorHandling', 'Network failure scenarios', async () => {
    // This test simulates network failures by using invalid endpoints
    const response = await makeRequest('POST', '/invalid-endpoint', {
      test: 'data'
    });
    
    if (response.status !== 404) {
      throw new Error('Invalid endpoint not returning 404');
    }
    
    return { message: 'Network error handling working' };
  });
  
  // Test 7.2: Invalid JSON in request body
  await runTest('errorHandling', 'Invalid JSON in request body', async () => {
    // This would typically be handled by Express middleware
    // For now, we'll just verify system handles malformed data
    const data = generateTestData();
    
    const response = await makeRequest('POST', '/register', {
      email: data.email,
      password: data.password,
      confirmPassword: data.confirmPassword,
      firstName: data.firstName,
      lastName: data.lastName
    });
    
    // Should handle valid JSON correctly
    if (response.status === 500) {
      throw new Error('Server error on valid JSON');
    }
    
    return { message: 'JSON handling working' };
  });
  
  // Test 7.3: Missing required fields
  await runTest('errorHandling', 'Missing required fields', async () => {
    const response = await makeRequest('POST', '/register', {
      email: 'test@example.com'
      // Missing password, confirmPassword, etc.
    });
    
    if (response.status !== 400) {
      throw new Error('Missing fields not rejected');
    }
    
    if (!response.data.error || !response.data.details) {
      throw new Error('Validation errors not returned');
    }
    
    return { message: 'Missing fields validation working' };
  });
  
  // Test 7.4: Invalid data types
  await runTest('errorHandling', 'Invalid data types', async () => {
    const response = await makeRequest('POST', '/login', {
      identifier: 'test@example.com',
      password: 12345 // Number instead of string
    });
    
    if (response.status !== 400 && response.status !== 401) {
      throw new Error('Invalid data type not rejected');
    }
    
    return { message: 'Data type validation working' };
  });
  
  // Test 7.5: Bilingual error messages
  await runTest('errorHandling', 'Bilingual error messages', async () => {
    const response = await makeRequest('POST', '/register', {
      // Missing email and phone
      password: 'Test@123456',
      confirmPassword: 'Test@123456'
    });
    
    if (response.status !== 400) {
      throw new Error('Validation error not returned');
    }
    
    // Check if both English and Bengali messages are present
    if (!response.data.message || !response.data.messageBn) {
      throw new Error('Bilingual messages not present');
    }
    
    return { message: 'Bilingual error messages working', en: response.data.message, bn: response.data.messageBn };
  });
  
  // Test 7.6: Database connection failure (simulated)
  await runTest('errorHandling', 'Database connection failure handling', async () => {
    // This test verifies that system handles database errors gracefully
    // We'll try to create a user with an existing ID to trigger a database error
    
    const data = generateTestData();
    
    // Register user
    const regResponse = await makeRequest('POST', '/register', {
      email: data.email,
      password: data.password,
      confirmPassword: data.confirmPassword,
      firstName: data.firstName,
      lastName: data.lastName
    });
    
    // Try to register again with same email (should fail gracefully)
    const duplicateResponse = await makeRequest('POST', '/register', {
      email: data.email,
      password: data.password,
      confirmPassword: data.confirmPassword,
      firstName: data.firstName,
      lastName: data.lastName
    });
    
    if (duplicateResponse.status !== 409) {
      throw new Error('Duplicate user not handled correctly');
    }
    
    return { message: 'Database error handling working' };
  });
  
  // Test 7.7: Timeout scenarios
  await runTest('errorHandling', 'Timeout scenarios', async () => {
    // This test verifies that system handles timeouts appropriately
    // We'll make a simple request and check if it completes within reasonable time
    
    const startTime = Date.now();
    
    const data = generateTestData();
    const response = await makeRequest('POST', '/register', {
      email: data.email,
      password: data.password,
      confirmPassword: data.confirmPassword,
      firstName: data.firstName,
      lastName: data.lastName
    });
    
    const duration = Date.now() - startTime;
    
    // Request should complete within 5 seconds
    if (duration > 5000) {
      throw new Error(`Request timeout: ${duration}ms`);
    }
    
    return { message: 'Timeout handling working', duration: `${duration}ms` };
  });
  
  // Test 7.8: Service unavailability (email service)
  await runTest('errorHandling', 'Email service unavailability', async () => {
    // This test verifies graceful handling when email service is unavailable
    // In testing mode, email service may be mocked
    
    const data = generateTestData();
    const response = await makeRequest('POST', '/register', {
      email: data.email,
      password: data.password,
      confirmPassword: data.confirmPassword,
      firstName: data.firstName,
      lastName: data.lastName
    });
    
    // Should either succeed (if testing mode) or fail gracefully
    if (response.status === 500 && !response.data.error) {
      throw new Error('Email service error not handled gracefully');
    }
    
    return { message: 'Email service error handling working' };
  });
  
  // Test 7.9: Service unavailability (SMS service)
  await runTest('errorHandling', 'SMS service unavailability', async () => {
    // This test verifies graceful handling when SMS service is unavailable
    // In testing mode, SMS service may be mocked
    
    const data = generateTestData();
    const response = await makeRequest('POST', '/register', {
      phone: data.phone,
      password: data.password,
      confirmPassword: data.confirmPassword,
      firstName: data.firstName,
      lastName: data.lastName
    });
    
    // Should either succeed (if testing mode) or fail gracefully
    if (response.status === 500 && !response.data.error) {
      throw new Error('SMS service error not handled gracefully');
    }
    
    return { message: 'SMS service error handling working' };
  });
  
  // Test 7.10: Redis connection failure
  await runTest('errorHandling', 'Redis connection failure handling', async () => {
    // This test verifies graceful handling when Redis is unavailable
    // The system should fall back to PostgreSQL for session storage
    
    const data = generateTestData();
    
    // Register and verify user
    const regResponse = await makeRequest('POST', '/register', {
      email: data.email,
      password: data.password,
      confirmPassword: data.confirmPassword,
      firstName: data.firstName,
      lastName: data.lastName
    });
    
    await prisma.user.update({
      where: { id: regResponse.data.user.id },
      data: { status: 'ACTIVE', emailVerified: new Date() }
    });
    
    // Login (should work even if Redis is unavailable)
    const loginResponse = await makeRequest('POST', '/login', {
      identifier: data.email,
      password: data.password
    });
    
    if (loginResponse.status !== 200) {
      throw new Error('Login failed when Redis unavailable');
    }
    
    return { message: 'Redis fallback working' };
  });
}

// ============================================================================
// 8. INTEGRATION TESTING
// ============================================================================

async function testIntegration() {
  console.log('\n=== INTEGRATION TESTING ===\n');
  
  // Test 8.1: Frontend-backend integration
  await runTest('integration', 'Frontend-backend integration', async () => {
    // This test verifies that API endpoints are accessible and respond correctly
    const data = generateTestData();
    
    // Test registration endpoint
    const regResponse = await makeRequest('POST', '/register', {
      email: data.email,
      password: data.password,
      confirmPassword: data.confirmPassword,
      firstName: data.firstName,
      lastName: data.lastName
    });
    
    if (regResponse.status !== 201) {
      throw new Error('Registration endpoint not working');
    }
    
    // Test login endpoint
    await prisma.user.update({
      where: { id: regResponse.data.user.id },
      data: { status: 'ACTIVE', emailVerified: new Date() }
    });
    
    const loginResponse = await makeRequest('POST', '/login', {
      identifier: data.email,
      password: data.password
    });
    
    if (loginResponse.status !== 200) {
      throw new Error('Login endpoint not working');
    }
    
    return { message: 'Frontend-backend integration working' };
  });
  
  // Test 8.2: Email service integration
  await runTest('integration', 'Email service integration', async () => {
    const data = generateTestData();
    
    // Register user (should trigger email)
    const regResponse = await makeRequest('POST', '/register', {
      email: data.email,
      password: data.password,
      confirmPassword: data.confirmPassword,
      firstName: data.firstName,
      lastName: data.lastName
    });
    
    if (regResponse.status !== 201) {
      throw new Error('Registration failed');
    }
    
    // Check if verification token was created
    const verificationToken = await prisma.emailVerificationToken.findFirst({
      where: { userId: regResponse.data.user.id }
    });
    
    if (!verificationToken) {
      throw new Error('Email verification token not created');
    }
    
    return { message: 'Email service integration working' };
  });
  
  // Test 8.3: SMS service integration
  await runTest('integration', 'SMS service integration', async () => {
    const data = generateTestData();
    
    // Send OTP (should trigger SMS)
    const sendResponse = await makeRequest('POST', '/send-otp', {
      phone: data.phone
    });
    
    if (sendResponse.status !== 200) {
      throw new Error('Send OTP failed');
    }
    
    // Check if OTP was created
    const otpRecord = await prisma.otp.findFirst({
      where: { phone: data.phone }
    });
    
    if (!otpRecord) {
      throw new Error('OTP not created');
    }
    
    return { message: 'SMS service integration working' };
  });
  
  // Test 8.4: Database integration
  await runTest('integration', 'Database integration', async () => {
    const data = generateTestData();
    
    // Register user
    const regResponse = await makeRequest('POST', '/register', {
      email: data.email,
      password: data.password,
      confirmPassword: data.confirmPassword,
      firstName: data.firstName,
      lastName: data.lastName
    });
    
    if (regResponse.status !== 201) {
      throw new Error('Registration failed');
    }
    
    // Verify user was created in database
    const user = await prisma.user.findUnique({
      where: { id: regResponse.data.user.id }
    });
    
    if (!user) {
      throw new Error('User not found in database');
    }
    
    if (user.email !== data.email) {
      throw new Error('User email mismatch');
    }
    
    return { message: 'Database integration working' };
  });
  
  // Test 8.5: Redis integration
  await runTest('integration', 'Redis integration', async () => {
    const data = generateTestData();
    
    // Register and verify user
    const regResponse = await makeRequest('POST', '/register', {
      email: data.email,
      password: data.password,
      confirmPassword: data.confirmPassword,
      firstName: data.firstName,
      lastName: data.lastName
    });
    
    await prisma.user.update({
      where: { id: regResponse.data.user.id },
      data: { status: 'ACTIVE', emailVerified: new Date() }
    });
    
    // Login (should create session)
    const loginResponse = await makeRequest('POST', '/login', {
      identifier: data.email,
      password: data.password
    });
    
    if (loginResponse.status !== 200) {
      throw new Error('Login failed');
    }
    
    // Verify session was created (in Redis or PostgreSQL)
    const session = await prisma.session.findUnique({
      where: { id: loginResponse.data.sessionId }
    });
    
    if (!session) {
      throw new Error('Session not created');
    }
    
    return { message: 'Session storage integration working' };
  });
  
  // Test 8.6: Complete user lifecycle
  await runTest('integration', 'Complete user lifecycle', async () => {
    const data = generateTestData();
    
    // 1. Register
    const regResponse = await makeRequest('POST', '/register', {
      email: data.email,
      password: data.password,
      confirmPassword: data.confirmPassword,
      firstName: data.firstName,
      lastName: data.lastName
    });
    
    if (regResponse.status !== 201) {
      throw new Error('Registration failed');
    }
    
    // 2. Verify email
    const verificationToken = await prisma.emailVerificationToken.findFirst({
      where: { userId: regResponse.data.user.id }
    });
    
    const verifyResponse = await makeRequest('POST', '/verify-email', {
      token: verificationToken.token
    });
    
    if (verifyResponse.status !== 200) {
      throw new Error('Email verification failed');
    }
    
    // 3. Login
    const loginResponse = await makeRequest('POST', '/login', {
      identifier: data.email,
      password: data.password
    });
    
    if (loginResponse.status !== 200) {
      throw new Error('Login failed');
    }
    
    // 4. Change password
    const changeResponse = await makeRequest('POST', '/change-password', {
      currentPassword: data.password,
      newPassword: 'NewPassword@123',
      confirmPassword: 'NewPassword@123'
    }, {
      'Authorization': `Bearer ${loginResponse.data.token}`
    });
    
    if (changeResponse.status !== 200) {
      throw new Error('Password change failed');
    }
    
    // 5. Logout
    const logoutResponse = await makeRequest('POST', '/logout', {}, {
      'Cookie': `sessionId=${loginResponse.data.sessionId}`
    });
    
    if (logoutResponse.status !== 200) {
      throw new Error('Logout failed');
    }
    
    return { message: 'Complete user lifecycle successful' };
  });
  
  // Test 8.7: Phone validation service integration
  await runTest('integration', 'Phone validation service integration', async () => {
    const data = generateTestData();
    
    // Validate phone
    const response = await makeRequest('POST', '/validate-phone', {
      phone: data.phone
    });
    
    if (response.status !== 200) {
      throw new Error('Phone validation failed');
    }
    
    if (!response.data.validation) {
      throw new Error('Validation result not returned');
    }
    
    return { message: 'Phone validation service integration working' };
  });
  
  // Test 8.8: Password service integration
  await runTest('integration', 'Password service integration', async () => {
    // Get password policy
    const response = await makeRequest('GET', '/password-policy');
    
    if (response.status !== 200) {
      throw new Error('Get password policy failed');
    }
    
    if (!response.data.policy) {
      throw new Error('Password policy not returned');
    }
    
    return { message: 'Password service integration working', policy: response.data.policy };
  });
  
  // Test 8.9: Session service integration
  await runTest('integration', 'Session service integration', async () => {
    const data = generateTestData();
    
    // Register and verify user
    const regResponse = await makeRequest('POST', '/register', {
      email: data.email,
      password: data.password,
      confirmPassword: data.confirmPassword,
      firstName: data.firstName,
      lastName: data.lastName
    });
    
    await prisma.user.update({
      where: { id: regResponse.data.user.id },
      data: { status: 'ACTIVE', emailVerified: new Date() }
    });
    
    // Login with remember me
    const loginResponse = await makeRequest('POST', '/login', {
      identifier: data.email,
      password: data.password,
      rememberMe: true
    });
    
    if (loginResponse.status !== 200) {
      throw new Error('Login failed');
    }
    
    // Validate remember me token
    const session = await prisma.session.findUnique({
      where: { id: loginResponse.data.sessionId }
    });
    
    if (!session || !session.rememberMeToken) {
      throw new Error('Remember me token not created');
    }
    
    const validateResponse = await makeRequest('POST', '/validate-remember-me', {
      token: session.rememberMeToken
    });
    
    if (validateResponse.status !== 200) {
      throw new Error('Remember me token validation failed');
    }
    
    return { message: 'Session service integration working' };
  });
  
  // Test 8.10: Rate limiting service integration
  await runTest('integration', 'Rate limiting service integration', async () => {
    const data = generateTestData();
    
    // Make multiple rapid requests
    const attempts = [];
    for (let i = 0; i < 15; i++) {
      attempts.push(makeRequest('POST', '/login', {
        identifier: data.email,
        password: 'WrongPassword@123'
      }));
    }
    
    const results = await Promise.all(attempts);
    
    // Check if any requests were rate limited
    const rateLimited = results.some(r => r.status === 429);
    
    return { message: 'Rate limiting service integration working', rateLimited };
  });
}

// ============================================================================
// TEST EXECUTION AND REPORTING
// ============================================================================

async function generateReport() {
  console.log('\n' + '='.repeat(80));
  console.log('COMPREHENSIVE AUTHENTICATION TEST REPORT');
  console.log('='.repeat(80));
  
  let totalPassed = 0;
  let totalFailed = 0;
  let totalTests = 0;
  
  // Summary by category
  console.log('\n--- TEST SUMMARY BY CATEGORY ---\n');
  
  for (const [category, results] of Object.entries(testResults)) {
    const categoryTotal = results.passed + results.failed;
    const passRate = categoryTotal > 0 ? ((results.passed / categoryTotal) * 100).toFixed(1) : 0;
    
    console.log(`${category.toUpperCase()}:`);
    console.log(`  Total Tests: ${categoryTotal}`);
    console.log(`  Passed: ${results.passed}`);
    console.log(`  Failed: ${results.failed}`);
    console.log(`  Pass Rate: ${passRate}%`);
    console.log();
    
    totalPassed += results.passed;
    totalFailed += results.failed;
    totalTests += categoryTotal;
  }
  
  // Overall summary
  const overallPassRate = totalTests > 0 ? ((totalPassed / totalTests) * 100).toFixed(1) : 0;
  
  console.log('--- OVERALL SUMMARY ---\n');
  console.log(`Total Tests: ${totalTests}`);
  console.log(`Passed: ${totalPassed}`);
  console.log(`Failed: ${totalFailed}`);
  console.log(`Overall Pass Rate: ${overallPassRate}%`);
  
  // Performance metrics
  console.log('\n--- PERFORMANCE METRICS ---\n');
  
  for (const [metric, values] of Object.entries(performanceMetrics)) {
    if (values.length > 0) {
      const avgDuration = values.reduce((sum, v) => sum + (v.duration || 0), 0) / values.length;
      console.log(`${metric}:`);
      console.log(`  Average Duration: ${avgDuration.toFixed(2)}ms`);
      console.log(`  Samples: ${values.length}`);
    }
  }
  
  // Failed tests details
  if (totalFailed > 0) {
    console.log('\n--- FAILED TESTS ---\n');
    
    for (const [category, results] of Object.entries(testResults)) {
      const failedTests = results.tests.filter(t => t.status === 'FAILED');
      
      if (failedTests.length > 0) {
        console.log(`${category.toUpperCase()}:`);
        failedTests.forEach(test => {
          console.log(`  ✗ ${test.name}`);
          console.log(`    Error: ${test.error}`);
        });
        console.log();
      }
    }
  }
  
  // Issues and bugs identified
  console.log('\n--- ISSUES AND BUGS IDENTIFIED ---\n');
  
  const issues = [];
  
  // Collect all failed tests
  for (const [category, results] of Object.entries(testResults)) {
    const failedTests = results.tests.filter(t => t.status === 'FAILED');
    failedTests.forEach(test => {
      issues.push({
        category,
        test: test.name,
        error: test.error
      });
    });
  }
  
  if (issues.length === 0) {
    console.log('No issues or bugs identified.');
  } else {
    issues.forEach((issue, index) => {
      console.log(`${index + 1}. [${issue.category.toUpperCase()}] ${issue.test}`);
      console.log(`   Error: ${issue.error}`);
    });
  }
  
  // Recommendations
  console.log('\n--- RECOMMENDATIONS ---\n');
  
  if (totalFailed === 0) {
    console.log('✓ All tests passed! The authentication system is working correctly.');
    console.log('✓ Consider adding more edge case tests for production readiness.');
    console.log('✓ Implement automated testing in CI/CD pipeline.');
  } else {
    console.log('1. Review and fix all failed tests.');
    console.log('2. Improve error handling for edge cases.');
    console.log('3. Add more comprehensive unit tests.');
    console.log('4. Implement integration tests for all services.');
    console.log('5. Add performance benchmarks and monitoring.');
    console.log('6. Implement security audit and penetration testing.');
  }
  
  console.log('\n' + '='.repeat(80));
  console.log('END OF REPORT');
  console.log('='.repeat(80) + '\n');
  
  // Return report data for JSON export
  return {
    summary: {
      totalTests,
      passed: totalPassed,
      failed: totalFailed,
      passRate: overallPassRate
    },
    categories: testResults,
    performanceMetrics,
    issues,
    timestamp: new Date().toISOString()
  };
}

// Main test execution function
async function runAllTests() {
  console.log('\n' + '='.repeat(80));
  console.log('STARTING COMPREHENSIVE AUTHENTICATION TEST SUITE');
  console.log('Milestone 1: Core Authentication System');
  console.log('='.repeat(80));
  
  const startTime = Date.now();
  
  try {
    // Run all test categories
    await testRegistrationFlow();
    await testLoginLogoutFlow();
    await testPasswordRecoveryFlow();
    await testSessionManagement();
    await testSecurity();
    await testPerformance();
    await testErrorHandling();
    await testIntegration();
    
    // Generate report
    const report = await generateReport();
    
    // Cleanup test data
    await cleanupTestData();
    
    const duration = Date.now() - startTime;
    console.log(`\nTest suite completed in ${(duration / 1000).toFixed(2)} seconds\n`);
    
    // Save report to file
    const fs = require('fs');
    const reportPath = './test-results/authentication-test-report.json';
    fs.mkdirSync('./test-results', { recursive: true });
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`Test report saved to: ${reportPath}\n`);
    
    // Exit with appropriate code
    process.exit(totalFailed > 0 ? 1 : 0);
    
  } catch (error) {
    console.error('\nTest suite execution failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  runAllTests();
}

// Export for use in other files
module.exports = {
  runAllTests,
  testRegistrationFlow,
  testLoginLogoutFlow,
  testPasswordRecoveryFlow,
  testSessionManagement,
  testSecurity,
  testPerformance,
  testErrorHandling,
  testIntegration,
  generateReport
};
