/**
 * Comprehensive Authentication System Assessment Test
 * Tests all Milestone 1 authentication endpoints
 */

const axios = require('axios');
const crypto = require('crypto');

// Configuration
const BASE_URL = process.env.API_BASE_URL || 'http://localhost:3001';
const API_PREFIX = '/api/v1';
const TEST_USER_EMAIL = `test_${Date.now()}@example.com`;
const TEST_USER_PHONE = '+8801700000000';
const TEST_PASSWORD = 'Test@123456';

// Test results storage
const testResults = {
  passed: [],
  failed: [],
  warnings: [],
  info: []
};

// Helper function to log test results
function logTest(category, testName, status, message, details = {}) {
  const result = {
    category,
    testName,
    status,
    message,
    details,
    timestamp: new Date().toISOString()
  };

  if (status === 'PASS') {
    testResults.passed.push(result);
    console.log(`✅ PASS [${category}] ${testName}: ${message}`);
  } else if (status === 'FAIL') {
    testResults.failed.push(result);
    console.log(`❌ FAIL [${category}] ${testName}: ${message}`);
    if (Object.keys(details).length > 0) {
      console.log('   Details:', JSON.stringify(details, null, 2));
    }
  } else if (status === 'WARN') {
    testResults.warnings.push(result);
    console.log(`⚠️  WARN [${category}] ${testName}: ${message}`);
  } else {
    testResults.info.push(result);
    console.log(`ℹ️  INFO [${category}] ${testName}: ${message}`);
  }
}

// Helper function to make API requests
async function makeRequest(method, endpoint, data = {}, headers = {}) {
  try {
    const config = {
      method,
      url: `${BASE_URL}${API_PREFIX}${endpoint}`,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      },
      ...(method !== 'GET' && { data })
    };

    const response = await axios(config);
    return { success: true, data: response.data, status: response.status };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data || error.message,
      status: error.response?.status
    };
  }
}

/**
 * 1. USER REGISTRATION TESTS
 */
async function testRegistration() {
  console.log('\n=== TESTING USER REGISTRATION ===\n');

  // Test 1.1: Registration with valid email and password
  const regResult = await makeRequest('POST', '/auth/register', {
    email: TEST_USER_EMAIL,
    password: TEST_PASSWORD,
    confirmPassword: TEST_PASSWORD,
    firstName: 'Test',
    lastName: 'User'
  });

  if (regResult.success) {
    logTest('Registration', 'Valid Email Registration', 'PASS', 
      'User registered successfully with email verification');
  } else {
    logTest('Registration', 'Valid Email Registration', 'FAIL',
      regResult.error?.error || 'Registration failed', regResult.error);
  }

  // Test 1.2: Registration with weak password
  const weakPassResult = await makeRequest('POST', '/auth/register', {
    email: `weak_${Date.now()}@example.com`,
    password: '123456',
    confirmPassword: '123456',
    firstName: 'Weak',
    lastName: 'Password'
  });

  if (!weakPassResult.success && weakPassResult.error?.error === 'Password does not meet requirements') {
    logTest('Registration', 'Weak Password Rejection', 'PASS',
      'Weak password correctly rejected');
  } else {
    logTest('Registration', 'Weak Password Rejection', 'FAIL',
      'Weak password should be rejected', weakPassResult);
  }

  // Test 1.3: Registration with mismatched passwords
  const mismatchResult = await makeRequest('POST', '/auth/register', {
    email: `mismatch_${Date.now()}@example.com`,
    password: TEST_PASSWORD,
    confirmPassword: 'Different@123',
    firstName: 'Mismatch',
    lastName: 'Test'
  });

  if (!mismatchResult.success && mismatchResult.error?.error === 'Passwords do not match') {
    logTest('Registration', 'Password Mismatch Validation', 'PASS',
      'Password mismatch correctly detected');
  } else {
    logTest('Registration', 'Password Mismatch Validation', 'FAIL',
      'Password mismatch should be detected', mismatchResult);
  }

  // Test 1.4: Registration with phone number
  const phoneRegResult = await makeRequest('POST', '/auth/register', {
    phone: TEST_USER_PHONE,
    password: TEST_PASSWORD,
    confirmPassword: TEST_PASSWORD,
    firstName: 'Phone',
    lastName: 'User'
  });

  if (phoneRegResult.success) {
    logTest('Registration', 'Phone Registration', 'PASS',
      'User registered successfully with phone verification');
  } else {
    logTest('Registration', 'Phone Registration', 'FAIL',
      phoneRegResult.error?.error || 'Phone registration failed', phoneRegResult.error);
  }

  // Test 1.5: Registration with invalid email format
  const invalidEmailResult = await makeRequest('POST', '/auth/register', {
    email: 'invalid-email',
    password: TEST_PASSWORD,
    confirmPassword: TEST_PASSWORD,
    firstName: 'Invalid',
    lastName: 'Email'
  });

  if (!invalidEmailResult.success) {
    logTest('Registration', 'Invalid Email Format Rejection', 'PASS',
      'Invalid email format correctly rejected');
  } else {
    logTest('Registration', 'Invalid Email Format Rejection', 'FAIL',
      'Invalid email format should be rejected', invalidEmailResult);
  }

  // Test 1.6: Registration without email or phone
  const noContactResult = await makeRequest('POST', '/auth/register', {
    password: TEST_PASSWORD,
    confirmPassword: TEST_PASSWORD,
    firstName: 'No',
    lastName: 'Contact'
  });

  if (!noContactResult.success && noContactResult.error?.error === 'Email or phone required') {
    logTest('Registration', 'Missing Contact Info Validation', 'PASS',
      'Missing email/phone correctly detected');
  } else {
    logTest('Registration', 'Missing Contact Info Validation', 'FAIL',
      'Missing email/phone should be detected', noContactResult);
  }
}

/**
 * 2. EMAIL VERIFICATION TESTS
 */
async function testEmailVerification() {
  console.log('\n=== TESTING EMAIL VERIFICATION ===\n');

  // Test 2.1: Resend verification email
  const resendResult = await makeRequest('POST', '/auth/resend-verification', {
    email: TEST_USER_EMAIL
  });

  if (resendResult.success) {
    logTest('Email Verification', 'Resend Verification Email', 'PASS',
      'Verification email resent successfully');
  } else {
    logTest('Email Verification', 'Resend Verification Email', 'FAIL',
      resendResult.error?.error || 'Failed to resend verification', resendResult.error);
  }

  // Test 2.2: Verify with invalid token
  const invalidTokenResult = await makeRequest('POST', '/auth/verify-email', {
    token: 'invalid-token-12345'
  });

  if (!invalidTokenResult.success) {
    logTest('Email Verification', 'Invalid Token Rejection', 'PASS',
      'Invalid verification token correctly rejected');
  } else {
    logTest('Email Verification', 'Invalid Token Rejection', 'FAIL',
      'Invalid token should be rejected', invalidTokenResult);
  }
}

/**
 * 3. PHONE OTP VERIFICATION TESTS
 */
async function testPhoneOTPVerification() {
  console.log('\n=== TESTING PHONE OTP VERIFICATION ===\n');

  // Test 3.1: Send OTP
  const sendOtpResult = await makeRequest('POST', '/auth/send-otp', {
    phone: TEST_USER_PHONE
  });

  if (sendOtpResult.success) {
    logTest('Phone OTP', 'Send OTP', 'PASS',
      'OTP sent successfully', { mock: sendOtpResult.data?.mock });
  } else {
    logTest('Phone OTP', 'Send OTP', 'FAIL',
      sendOtpResult.error?.error || 'Failed to send OTP', sendOtpResult.error);
  }

  // Test 3.2: Verify with invalid OTP
  const invalidOtpResult = await makeRequest('POST', '/auth/verify-otp', {
    phone: TEST_USER_PHONE,
    otp: '000000'
  });

  if (!invalidOtpResult.success) {
    logTest('Phone OTP', 'Invalid OTP Rejection', 'PASS',
      'Invalid OTP correctly rejected');
  } else {
    logTest('Phone OTP', 'Invalid OTP Rejection', 'FAIL',
      'Invalid OTP should be rejected', invalidOtpResult);
  }

  // Test 3.3: Resend OTP
  const resendOtpResult = await makeRequest('POST', '/auth/resend-otp', {
    phone: TEST_USER_PHONE
  });

  if (resendOtpResult.success) {
    logTest('Phone OTP', 'Resend OTP', 'PASS',
      'OTP resent successfully');
  } else {
    logTest('Phone OTP', 'Resend OTP', 'FAIL',
      resendOtpResult.error?.error || 'Failed to resend OTP', resendOtpResult.error);
  }

  // Test 3.4: Validate phone number
  const validatePhoneResult = await makeRequest('POST', '/auth/validate-phone', {
    phone: TEST_USER_PHONE
  });

  if (validatePhoneResult.success) {
    logTest('Phone OTP', 'Phone Number Validation', 'PASS',
      'Phone number validated successfully');
  } else {
    logTest('Phone OTP', 'Phone Number Validation', 'FAIL',
      validatePhoneResult.error?.error || 'Phone validation failed', validatePhoneResult.error);
  }
}

/**
 * 4. USER LOGIN TESTS
 */
let authToken = null;
let sessionId = null;

async function testLogin() {
  console.log('\n=== TESTING USER LOGIN ===\n');

  // Test 4.1: Login with valid email credentials
  const loginResult = await makeRequest('POST', '/auth/login', {
    identifier: TEST_USER_EMAIL,
    password: TEST_PASSWORD
  });

  if (loginResult.success) {
    authToken = loginResult.data.token;
    sessionId = loginResult.data.sessionId;
    logTest('Login', 'Valid Email Login', 'PASS',
      'User logged in successfully with email', { hasToken: !!authToken, hasSessionId: !!sessionId });
  } else {
    logTest('Login', 'Valid Email Login', 'FAIL',
      loginResult.error?.error || 'Login failed', loginResult.error);
  }

  // Test 4.2: Login with invalid credentials
  const invalidLoginResult = await makeRequest('POST', '/auth/login', {
    identifier: TEST_USER_EMAIL,
    password: 'WrongPassword123!'
  });

  if (!invalidLoginResult.success) {
    logTest('Login', 'Invalid Credentials Rejection', 'PASS',
      'Invalid credentials correctly rejected');
  } else {
    logTest('Login', 'Invalid Credentials Rejection', 'FAIL',
      'Invalid credentials should be rejected', invalidLoginResult);
  }

  // Test 4.3: Login with phone number
  const phoneLoginResult = await makeRequest('POST', '/auth/login', {
    identifier: TEST_USER_PHONE,
    password: TEST_PASSWORD
  });

  if (phoneLoginResult.success) {
    logTest('Login', 'Phone Login', 'PASS',
      'User logged in successfully with phone');
  } else {
    logTest('Login', 'Phone Login', 'FAIL',
      phoneLoginResult.error?.error || 'Phone login failed', phoneLoginResult.error);
  }

  // Test 4.4: Login with missing identifier
  const missingIdResult = await makeRequest('POST', '/auth/login', {
    password: TEST_PASSWORD
  });

  if (!missingIdResult.success) {
    logTest('Login', 'Missing Identifier Validation', 'PASS',
      'Missing identifier correctly detected');
  } else {
    logTest('Login', 'Missing Identifier Validation', 'FAIL',
      'Missing identifier should be detected', missingIdResult);
  }

  // Test 4.5: Remember me functionality
  const rememberMeResult = await makeRequest('POST', '/auth/login', {
    identifier: TEST_USER_EMAIL,
    password: TEST_PASSWORD,
    rememberMe: true
  });

  if (rememberMeResult.success && rememberMeResult.data.rememberMe === true) {
    logTest('Login', 'Remember Me Functionality', 'PASS',
      'Remember me option accepted');
  } else {
    logTest('Login', 'Remember Me Functionality', 'WARN',
      'Remember me option may not be working correctly', rememberMeResult);
  }
}

/**
 * 5. SESSION MANAGEMENT TESTS
 */
async function testSessionManagement() {
  console.log('\n=== TESTING SESSION MANAGEMENT ===\n');

  if (!authToken) {
    logTest('Session Management', 'Session Tests', 'WARN',
      'Skipping session tests - no auth token available');
    return;
  }

  // Test 5.1: Refresh token
  const refreshResult = await makeRequest('POST', '/auth/refresh', {
    token: authToken
  });

  if (refreshResult.success) {
    authToken = refreshResult.data.token;
    logTest('Session Management', 'Token Refresh', 'PASS',
      'Token refreshed successfully');
  } else {
    logTest('Session Management', 'Token Refresh', 'FAIL',
      refreshResult.error?.error || 'Token refresh failed', refreshResult.error);
  }

  // Test 5.2: Logout
  const logoutResult = await makeRequest('POST', '/auth/logout', {}, {
    'Authorization': `Bearer ${authToken}`
  });

  if (logoutResult.success) {
    logTest('Session Management', 'Logout', 'PASS',
      'User logged out successfully');
  } else {
    logTest('Session Management', 'Logout', 'FAIL',
      logoutResult.error?.error || 'Logout failed', logoutResult.error);
  }

  // Test 5.3: Logout from all devices
  const loginAgainResult = await makeRequest('POST', '/auth/login', {
    identifier: TEST_USER_EMAIL,
    password: TEST_PASSWORD,
    rememberMe: true
  });

  if (loginAgainResult.success) {
    authToken = loginAgainResult.data.token;
    sessionId = loginAgainResult.data.sessionId;

    const logoutAllResult = await makeRequest('POST', '/auth/logout', {
      allDevices: true
    }, {
      'Authorization': `Bearer ${authToken}`
    });

    if (logoutAllResult.success) {
      logTest('Session Management', 'Logout All Devices', 'PASS',
        'Logged out from all devices successfully');
    } else {
      logTest('Session Management', 'Logout All Devices', 'FAIL',
        logoutAllResult.error?.error || 'Logout all devices failed', logoutAllResult.error);
    }
  }

  // Test 5.4: Validate remember me token
  const validateRememberResult = await makeRequest('POST', '/auth/validate-remember-me', {
    token: sessionId || 'test-token'
  });

  if (!validateRememberResult.success) {
    logTest('Session Management', 'Remember Me Token Validation', 'PASS',
      'Invalid remember me token correctly rejected');
  } else {
    logTest('Session Management', 'Remember Me Token Validation', 'WARN',
      'Remember me token validation behavior needs review', validateRememberResult);
  }
}

/**
 * 6. PASSWORD MANAGEMENT TESTS
 */
async function testPasswordManagement() {
  console.log('\n=== TESTING PASSWORD MANAGEMENT ===\n');

  // Login first to get auth token
  const loginResult = await makeRequest('POST', '/auth/login', {
    identifier: TEST_USER_EMAIL,
    password: TEST_PASSWORD
  });

  if (!loginResult.success) {
    logTest('Password Management', 'Password Tests', 'WARN',
      'Skipping password tests - login failed');
    return;
  }

  authToken = loginResult.data.token;

  // Test 6.1: Get password policy
  const policyResult = await makeRequest('GET', '/auth/password-policy');

  if (policyResult.success) {
    logTest('Password Management', 'Get Password Policy', 'PASS',
      'Password policy retrieved successfully', policyResult.data);
  } else {
    logTest('Password Management', 'Get Password Policy', 'FAIL',
      policyResult.error?.error || 'Failed to get password policy', policyResult.error);
  }

  // Test 6.2: Change password
  const newPassword = 'NewTest@789';
  const changePasswordResult = await makeRequest('POST', '/auth/change-password', {
    currentPassword: TEST_PASSWORD,
    newPassword: newPassword,
    confirmPassword: newPassword
  }, {
    'Authorization': `Bearer ${authToken}`
  });

  if (changePasswordResult.success) {
    logTest('Password Management', 'Change Password', 'PASS',
      'Password changed successfully');
    TEST_PASSWORD = newPassword; // Update for subsequent tests
  } else {
    logTest('Password Management', 'Change Password', 'FAIL',
      changePasswordResult.error?.error || 'Password change failed', changePasswordResult.error);
  }

  // Test 6.3: Forgot password
  const forgotPasswordResult = await makeRequest('POST', '/auth/forgot-password', {
    email: TEST_USER_EMAIL
  });

  if (forgotPasswordResult.success) {
    logTest('Password Management', 'Forgot Password', 'PASS',
      'Password reset email sent');
  } else {
    logTest('Password Management', 'Forgot Password', 'FAIL',
      forgotPasswordResult.error?.error || 'Forgot password failed', forgotPasswordResult.error);
  }

  // Test 6.4: Reset password with invalid token
  const resetPasswordResult = await makeRequest('POST', '/auth/reset-password', {
    token: 'invalid-reset-token',
    newPassword: 'ResetTest@123',
    confirmPassword: 'ResetTest@123'
  });

  if (!resetPasswordResult.success) {
    logTest('Password Management', 'Invalid Reset Token Rejection', 'PASS',
      'Invalid reset token correctly rejected');
  } else {
    logTest('Password Management', 'Invalid Reset Token Rejection', 'FAIL',
      'Invalid reset token should be rejected', resetPasswordResult);
  }
}

/**
 * 7. SECURITY TESTS
 */
async function testSecurity() {
  console.log('\n=== TESTING SECURITY FEATURES ===\n');

  // Test 7.1: Rate limiting - multiple rapid login attempts
  const attempts = [];
  for (let i = 0; i < 5; i++) {
    attempts.push(makeRequest('POST', '/auth/login', {
      identifier: TEST_USER_EMAIL,
      password: 'WrongPassword123!'
    }));
  }

  await Promise.all(attempts);
  
  const lastAttempt = await makeRequest('POST', '/auth/login', {
    identifier: TEST_USER_EMAIL,
    password: 'WrongPassword123!'
  });

  if (!lastAttempt.success && (lastAttempt.status === 429 || lastAttempt.status === 423)) {
    logTest('Security', 'Rate Limiting', 'PASS',
      'Rate limiting is working correctly', { status: lastAttempt.status });
  } else {
    logTest('Security', 'Rate Limiting', 'WARN',
      'Rate limiting may not be properly configured', lastAttempt);
  }

  // Test 7.2: SQL injection attempt
  const sqlInjectionResult = await makeRequest('POST', '/auth/login', {
    identifier: "admin' OR '1'='1",
    password: 'password'
  });

  if (!sqlInjectionResult.success) {
    logTest('Security', 'SQL Injection Protection', 'PASS',
      'SQL injection attempt blocked');
  } else {
    logTest('Security', 'SQL Injection Protection', 'FAIL',
      'SQL injection protection may be insufficient', sqlInjectionResult);
  }

  // Test 7.3: XSS attempt
  const xssResult = await makeRequest('POST', '/auth/register', {
    email: `xss_${Date.now()}@example.com`,
    password: TEST_PASSWORD,
    confirmPassword: TEST_PASSWORD,
    firstName: '<script>alert("XSS")</script>',
    lastName: 'Test'
  });

  if (xssResult.success) {
    logTest('Security', 'XSS Protection', 'WARN',
      'XSS protection should be reviewed - input may not be sanitized');
  } else {
    logTest('Security', 'XSS Protection', 'PASS',
      'XSS attempt appears to be handled');
  }
}

/**
 * 8. API ENDPOINT AVAILABILITY TESTS
 */
async function testEndpointAvailability() {
  console.log('\n=== TESTING API ENDPOINT AVAILABILITY ===\n');

  const endpoints = [
    { method: 'POST', path: '/auth/register', name: 'Register' },
    { method: 'POST', path: '/auth/login', name: 'Login' },
    { method: 'POST', path: '/auth/logout', name: 'Logout' },
    { method: 'POST', path: '/auth/refresh', name: 'Refresh Token' },
    { method: 'POST', path: '/auth/verify-email', name: 'Verify Email' },
    { method: 'POST', path: '/auth/resend-verification', name: 'Resend Verification' },
    { method: 'POST', path: '/auth/send-otp', name: 'Send OTP' },
    { method: 'POST', path: '/auth/verify-otp', name: 'Verify OTP' },
    { method: 'POST', path: '/auth/resend-otp', name: 'Resend OTP' },
    { method: 'POST', path: '/auth/change-password', name: 'Change Password' },
    { method: 'POST', path: '/auth/forgot-password', name: 'Forgot Password' },
    { method: 'POST', path: '/auth/reset-password', name: 'Reset Password' },
    { method: 'GET', path: '/auth/password-policy', name: 'Get Password Policy' },
    { method: 'POST', path: '/auth/validate-phone', name: 'Validate Phone' },
    { method: 'GET', path: '/auth/operators', name: 'Get Operators' },
    { method: 'POST', path: '/auth/validate-remember-me', name: 'Validate Remember Me' },
    { method: 'POST', path: '/auth/refresh-from-remember-me', name: 'Refresh from Remember Me' },
    { method: 'POST', path: '/auth/disable-remember-me', name: 'Disable Remember Me' }
  ];

  for (const endpoint of endpoints) {
    const result = await makeRequest(endpoint.method, endpoint.path, {});
    
    if (result.status === 404) {
      logTest('Endpoint Availability', endpoint.name, 'FAIL',
        `Endpoint ${endpoint.method} ${endpoint.path} not found (404)`);
    } else if (result.status === 500) {
      logTest('Endpoint Availability', endpoint.name, 'WARN',
        `Endpoint ${endpoint.method} ${endpoint.path} returned server error (500)`);
    } else {
      logTest('Endpoint Availability', endpoint.name, 'PASS',
        `Endpoint ${endpoint.method} ${endpoint.path} is available (${result.status || 'OK'})`);
    }
  }
}

/**
 * MAIN TEST EXECUTION
 */
async function runAllTests() {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║   COMPREHENSIVE AUTHENTICATION SYSTEM ASSESSMENT TEST       ║');
  console.log('║   Milestone 1: Core Authentication System                  ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  console.log(`\nBase URL: ${BASE_URL}`);
  console.log(`Test Email: ${TEST_USER_EMAIL}`);
  console.log(`Test Phone: ${TEST_USER_PHONE}`);
  console.log(`Test Password: ${TEST_PASSWORD}\n`);

  try {
    await testEndpointAvailability();
    await testRegistration();
    await testEmailVerification();
    await testPhoneOTPVerification();
    await testLogin();
    await testSessionManagement();
    await testPasswordManagement();
    await testSecurity();

    // Generate summary report
    console.log('\n╔════════════════════════════════════════════════════════════╗');
    console.log('║                    TEST SUMMARY                                ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');

    console.log(`✅ Passed: ${testResults.passed.length}`);
    console.log(`❌ Failed: ${testResults.failed.length}`);
    console.log(`⚠️  Warnings: ${testResults.warnings.length}`);
    console.log(`ℹ️  Info: ${testResults.info.length}`);
    console.log(`\nTotal Tests: ${testResults.passed.length + testResults.failed.length + testResults.warnings.length + testResults.info.length}`);

    // Calculate success rate
    const totalTests = testResults.passed.length + testResults.failed.length;
    const successRate = totalTests > 0 ? ((testResults.passed.length / totalTests) * 100).toFixed(2) : 0;
    console.log(`\nSuccess Rate: ${successRate}%`);

    // Save results to file
    const fs = require('fs');
    const path = require('path');
    const reportPath = path.join(__dirname, `auth-assessment-report-${Date.now()}.json`);
    fs.writeFileSync(reportPath, JSON.stringify(testResults, null, 2));
    console.log(`\n📄 Detailed report saved to: ${reportPath}`);

  } catch (error) {
    console.error('\n❌ Test execution failed:', error.message);
    console.error(error.stack);
  }
}

// Run tests if executed directly
if (require.main === module) {
  runAllTests().catch(console.error);
}

module.exports = {
  runAllTests,
  testResults,
  logTest
};
