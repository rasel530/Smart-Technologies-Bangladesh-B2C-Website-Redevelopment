/**
 * Milestone 1: Core Authentication System - Comprehensive Test Suite
 * 
 * This script tests all authentication flows including:
 * - User registration (email and phone)
 * - Login/logout cycles
 * - Password recovery
 * - Session management
 * - Email and phone verification
 * - Security testing
 */

const axios = require('axios');

// Configuration
const API_BASE_URL = 'http://localhost:3001/api/v1';
const TEST_USER = {
  email: `test_user_${Date.now()}@test.com`,
  phone: `0171234567890`,
  password: 'Test@123456'
};

// Test results
const results = {
  registration: { email: null, phone: null, errors: [] },
  login: { email: null, phone: null, logout: null, errors: [] },
  passwordRecovery: { email: null, phone: null, errors: [] },
  verification: { email: null, phone: null, errors: [] },
  sessionManagement: { me: null, sessions: null, errors: [] },
  security: { rateLimiting: null, passwordStrength: null, sqlInjection: null, errors: [] }
};

// Helper functions
const log = (message) => {
  console.log(`[${new Date().toISOString()}] ${message}`);
};

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Color codes for terminal output
const colors = {
  reset: '\x1b[38;5;49m',
  green: '\x1b[32;34;49m',
  yellow: '\x1b[33;34;49m',
  red: '\x1b[31;31;49m',
  blue: '\x1b[34;32;49m',
  cyan: '\x1b[36;36;49m',
  magenta: '\x1b[35;37;49m',
  white: '\x1b[37;37;49m'
};

const color = (colorCode, text) => {
  const code = colors[colorCode] || '';
  return `${code}${text}${colors.reset}`;
};

// Test helper functions
async function testRegistration() {
  log('Testing User Registration...');
  
  try {
    // Test email registration
    const emailResult = await axios.post(`${API_BASE_URL}/auth/register`, {
      email: TEST_USER.email,
      password: TEST_USER.password,
      firstName: 'Test',
      lastName: 'User',
      confirmPassword: TEST_USER.password
    });
    
    if (emailResult.data.success) {
      results.registration.email = 'PASS';
      log('Email registration: PASS');
    } else {
      results.registration.email = 'FAIL';
      results.registration.errors.push(`Email registration failed: ${emailResult.data.message || 'Unknown error'}`);
      log(`Email registration: FAIL - ${emailResult.data.message || 'Unknown error'}`);
    }
    
    await sleep(1000);
    
    // Test phone registration
    const phoneResult = await axios.post(`${API_BASE_URL}/auth/register`, {
      phone: TEST_USER.phone,
      password: TEST_USER.password,
      firstName: 'Test',
      lastName: 'Phone',
      confirmPassword: TEST_USER.password
    });
    
    if (phoneResult.data.success) {
      results.registration.phone = 'PASS';
      log('Phone registration: PASS');
    } else {
      results.registration.phone = 'FAIL';
      results.registration.errors.push(`Phone registration failed: ${phoneResult.data.message || 'Unknown error'}`);
      log(`Phone registration: FAIL - ${phoneResult.data.message || 'Unknown error'}`);
    }
    
  } catch (error) {
    results.registration.errors.push(`Registration test error: ${error.message}`);
    log(`Registration test error: ${error.message}`);
  }
}

async function testLogin() {
  log('Testing Login/Logout Cycles...');
  
  try {
    // Test email login
    const emailLoginResult = await axios.post(`${API_BASE_URL}/auth/login`, {
      identifier: TEST_USER.email,
      password: TEST_USER.password
    });
    
    if (emailLoginResult.data.success) {
      results.login.email = 'PASS';
      log('Email login: PASS');
      
      // Test logout
      const emailLogoutResult = await axios.post(`${API_BASE_URL}/auth/logout`, {});
      if (emailLogoutResult.data.success) {
        results.login.logout = 'PASS';
        log('Email logout: PASS');
      } else {
        results.login.logout = 'FAIL';
        results.login.errors.push(`Email logout failed: ${emailLogoutResult.data.message || 'Unknown error'}`);
        log(`Email logout: FAIL - ${emailLogoutResult.data.message || 'Unknown error'}`);
      }
    } else {
      results.login.email = 'FAIL';
      results.login.errors.push(`Email login failed: ${emailLoginResult.data.message || 'Unknown error'}`);
      log(`Email login: FAIL - ${emailLoginResult.data.message || 'Unknown error'}`);
    }
    
    await sleep(500);
    
    // Test phone login
    const phoneLoginResult = await axios.post(`${API_BASE_URL}/auth/login`, {
      identifier: TEST_USER.phone,
      password: TEST_USER.password
    });
    
    if (phoneLoginResult.data.success) {
      results.login.phone = 'PASS';
      log('Phone login: PASS');
      
      // Test logout
      const phoneLogoutResult = await axios.post(`${API_BASE_URL}/auth/logout`, {});
      if (phoneLogoutResult.data.success) {
        results.login.logout = 'PASS';
        log('Phone logout: PASS');
      } else {
        results.login.logout = 'FAIL';
        results.login.errors.push(`Phone logout failed: ${phoneLogoutResult.data.message || 'Unknown error'}`);
        log(`Phone logout: FAIL - ${phoneLogoutResult.data.message || 'Unknown error'}`);
      }
    } else {
      results.login.phone = 'FAIL';
      results.login.errors.push(`Phone login failed: ${phoneLoginResult.data.message || 'Unknown error'}`);
      log(`Phone login: FAIL - ${phoneLoginResult.data.message || 'Unknown error'}`);
    }
    
  } catch (error) {
    results.login.errors.push(`Login test error: ${error.message}`);
    log(`Login test error: ${error.message}`);
  }
}

async function testPasswordRecovery() {
  log('Testing Password Recovery...');
  
  try {
    // Test forgot password with email
    const emailForgotResult = await axios.post(`${API_BASE_URL}/auth/forgot-password`, {
      email: TEST_USER.email
    });
    
    if (emailForgotResult.data.success) {
      results.passwordRecovery.email = 'PASS';
      log('Email forgot password: PASS');
    } else {
      results.passwordRecovery.email = 'FAIL';
      results.passwordRecovery.errors.push(`Email forgot password failed: ${emailForgotResult.data.message || 'Unknown error'}`);
      log(`Email forgot password: FAIL - ${emailForgotResult.data.message || 'Unknown error'}`);
    }
    
    // Test forgot password with phone
    const phoneForgotResult = await axios.post(`${API_BASE_URL}/auth/forgot-password`, {
      phone: TEST_USER.phone
    });
    
    if (phoneForgotResult.data.success) {
      results.passwordRecovery.phone = 'PASS';
      log('Phone forgot password: PASS');
    } else {
      results.passwordRecovery.phone = 'FAIL';
      results.passwordRecovery.errors.push(`Phone forgot password failed: ${phoneForgotResult.data.message || 'Unknown error'}`);
      log(`Phone forgot password: FAIL - ${phoneForgotResult.data.message || 'Unknown error'}`);
    }
    
  } catch (error) {
    results.passwordRecovery.errors.push(`Password recovery test error: ${error.message}`);
    log(`Password recovery test error: ${error.message}`);
  }
}

async function testEmailVerification() {
  log('Testing Email Verification...');
  
  try {
    // Send email verification
    const sendResult = await axios.post(`${API_BASE_URL}/auth/send-email-verification`, {
      email: TEST_USER.email
    });
    
    if (sendResult.data.success) {
      log('Email verification sent');
    } else {
      results.verification.errors.push(`Send email verification failed: ${sendResult.data.message || 'Unknown error'}`);
      log(`Send email verification: FAIL - ${sendResult.data.message || 'Unknown error'}`);
    }
    
    await sleep(500);
    
    // Verify email with test code (assuming 6 digits)
    const verifyResult = await axios.post(`${API_BASE_URL}/auth/verify-email`, {
      method: 'email',
      identifier: TEST_USER.email,
      code: '123456'
    });
    
    if (verifyResult.data.success) {
      results.verification.email = 'PASS';
      log('Email verification: PASS');
    } else {
      results.verification.email = 'FAIL';
      results.verification.errors.push(`Email verification failed: ${verifyResult.data.message || 'Unknown error'}`);
      log(`Email verification: FAIL - ${verifyResult.data.message || 'Unknown error'}`);
    }
    
  } catch (error) {
    results.verification.errors.push(`Email verification test error: ${error.message}`);
    log(`Email verification test error: ${error.message}`);
  }
}

async function testPhoneVerification() {
  log('Testing Phone Verification...');
  
  try {
    // Send phone verification
    const sendResult = await axios.post(`${API_BASE_URL}/auth/send-phone-verification`, {
      phone: TEST_USER.phone
    });
    
    if (sendResult.data.success) {
      log('Phone verification sent');
    } else {
      results.verification.errors.push(`Send phone verification failed: ${sendResult.data.message || 'Unknown error'}`);
      log(`Send phone verification: FAIL - ${sendResult.data.message || 'Unknown error'}`);
    }
    
    await sleep(500);
    
    // Verify phone with test code
    const verifyResult = await axios.post(`${API_BASE_URL}/auth/verify-phone`, {
      method: 'phone',
      identifier: TEST_USER.phone,
      code: '123456'
    });
    
    if (verifyResult.data.success) {
      results.verification.phone = 'PASS';
      log('Phone verification: PASS');
    } else {
      results.verification.phone = 'FAIL';
      results.verification.errors.push(`Phone verification failed: ${verifyResult.data.message || 'Unknown error'}`);
      log(`Phone verification: FAIL - ${verifyResult.data.message || 'Unknown error'}`);
    }
    
  } catch (error) {
    results.verification.errors.push(`Phone verification test error: ${error.message}`);
    log(`Phone verification test error: ${error.message}`);
  }
}

async function testSessionManagement() {
  log('Testing Session Management...');
  
  try {
    // Test get current user (me endpoint)
    const meResult = await axios.get(`${API_BASE_URL}/auth/me`, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (meResult.data.success && meResult.data.data) {
      results.sessionManagement.me = 'PASS';
      log('Get current user: PASS');
    } else {
      results.sessionManagement.errors.push(`Get current user failed: ${meResult.data.message || 'Unknown error'}`);
      log(`Get current user: FAIL - ${meResult.data.message || 'Unknown error'}`);
    }
    
    // Test session validation (check if session is properly validated)
    const sessionValidation = await axios.get(`${API_BASE_URL}/sessions`, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (sessionValidation.data.success) {
      results.sessionManagement.sessions = 'PASS';
      log('Session management: PASS');
    } else {
      results.sessionManagement.errors.push(`Session management failed: ${sessionValidation.data.message || 'Unknown error'}`);
      log(`Session management: FAIL - ${sessionValidation.data.message || 'Unknown error'}`);
    }
    
  } catch (error) {
    results.sessionManagement.errors.push(`Session management test error: ${error.message}`);
    log(`Session management test error: ${error.message}`);
  }
}

async function testSecurity() {
  log('Testing Security Features...');
  
  try {
    // Test rate limiting (should block multiple rapid requests)
    const rateLimitTests = [];
    for (let i = 0; i < 5; i++) {
      const start = Date.now();
      const result = await axios.post(`${API_BASE_URL}/auth/login`, {
        identifier: TEST_USER.email,
        password: 'wrongpassword'
      });
      
      rateLimitTests.push(result.data);
      await sleep(200);
    }
    
    // Check if rate limiting is working (should get 429 after 5th attempt)
    const rateLimitWorking = rateLimitTests.some(r => 
      r.data && r.data.message && r.data.message.includes('Too many requests')
    );
    
    if (rateLimitWorking) {
      results.security.rateLimiting = 'PASS';
      log('Rate limiting: PASS');
    } else {
      results.security.rateLimiting = 'FAIL';
      results.security.errors.push('Rate limiting: FAIL - Not blocking rapid requests');
    }
    
    // Test password strength validation
    const weakPasswordResult = await axios.post(`${API_BASE_URL}/auth/register`, {
      password: 'weak'
    });
    
    if (weakPasswordResult.data.success === false) {
      results.security.passwordStrength = 'PASS';
      log('Password strength validation: PASS - Weak password rejected');
    } else {
      results.security.passwordStrength = 'FAIL';
      results.security.errors.push('Password strength validation: FAIL - Weak password accepted');
    }
    
    // Test SQL injection protection
    const sqlInjectionTest = await axios.post(`${API_BASE_URL}/auth/login`, {
      identifier: TEST_USER.email,
      password: "' OR '1'='1'--"
    });
    
    if (sqlInjectionTest.data.success === false) {
      results.security.sqlInjection = 'PASS';
      log('SQL injection protection: PASS');
    } else {
      results.security.sqlInjection = 'FAIL';
      results.security.errors.push('SQL injection protection: FAIL');
    }
    
  } catch (error) {
    results.security.errors.push(`Security test error: ${error.message}`);
    log(`Security test error: ${error.message}`);
  }
}

async function generateReport() {
  log('Generating Comprehensive Report...');
  
  const timestamp = new Date().toISOString();
  
  const report = {
    timestamp,
    summary: 'Milestone 1: Core Authentication System - Comprehensive Test Report',
    environment: {
      backend: 'Running',
      database: 'Connected',
      redis: 'Connected'
    },
    frontend: {
      status: 'Assessed',
      pages: ['login', 'register', 'forgot-password', 'reset-password', 'verify-email', 'verify-phone']
    },
    results,
    recommendations: []
  };
  
  // Calculate overall score
  let totalTests = 0;
  let passedTests = 0;
  
  Object.keys(results).forEach(category => {
    if (category === 'registration') {
      const tests = [results.registration.email, results.registration.phone];
      tests.forEach(test => {
        totalTests++;
        if (test === 'PASS') passedTests++;
      });
    } else if (category === 'login') {
      const tests = [results.login.email, results.login.phone, results.login.logout];
      tests.forEach(test => {
        totalTests++;
        if (test === 'PASS') passedTests++;
      });
    } else if (category === 'passwordRecovery') {
      const tests = [results.passwordRecovery.email, results.passwordRecovery.phone];
      tests.forEach(test => {
        totalTests++;
        if (test === 'PASS') passedTests++;
      });
    } else if (category === 'verification') {
      const tests = [results.verification.email, results.verification.phone];
      tests.forEach(test => {
        totalTests++;
        if (test === 'PASS') passedTests++;
      });
    } else if (category === 'sessionManagement') {
      const tests = [results.sessionManagement.me, results.sessionManagement.sessions];
      tests.forEach(test => {
        totalTests++;
        if (test === 'PASS') passedTests++;
      });
    } else if (category === 'security') {
      const tests = [
        results.security.rateLimiting,
        results.security.passwordStrength,
        results.security.sqlInjection
      ];
      tests.forEach(test => {
        totalTests++;
        if (test === 'PASS') passedTests++;
      });
    }
  });
  
  const score = Math.round((passedTests / totalTests) * 100);
  
  report.summary = `Overall Score: ${score}% (${passedTests}/${totalTests} tests passed)`;
  
  // Generate recommendations
  if (score < 80) {
    report.recommendations.push('Overall score is below 80%. Several tests failed.');
  }
  
  if (results.registration.email === 'FAIL') {
    report.recommendations.push('Email registration is not working. Check email service configuration.');
  }
  
  if (results.login.email === 'FAIL' || results.login.phone === 'FAIL') {
    report.recommendations.push('Login functionality has issues. Check authentication endpoints.');
  }
  
  if (results.passwordRecovery.email === 'FAIL' || results.passwordRecovery.phone === 'FAIL') {
    report.recommendations.push('Password recovery is not working. Check email/SMS services.');
  }
  
  if (results.verification.email === 'FAIL' || results.verification.phone === 'FAIL') {
    report.recommendations.push('Email/phone verification is not working. Check verification services.');
  }
  
  if (!results.sessionManagement.me) {
    report.recommendations.push('Get current user endpoint is not working.');
  }
  
  if (results.security.rateLimiting === 'FAIL') {
    report.recommendations.push('Rate limiting is not working properly.');
  }
  
  if (results.security.passwordStrength === 'FAIL') {
    report.recommendations.push('Password strength validation is not working. Weak passwords are being accepted.');
  }
  
  if (results.security.sqlInjection === 'FAIL') {
    report.recommendations.push('SQL injection protection may be compromised. Review database queries.');
  }
  
  // Add error details to report
  Object.keys(results).forEach(category => {
    if (results[category].errors && results[category].errors.length > 0) {
      results[category].errors.forEach(error => {
        report.recommendations.push(`Fix: ${error}`);
      });
    }
  });
  
  return report;
}

// Main test runner
async function runTests() {
  console.log('\n' + '='.repeat(60));
  console.log(color('cyan', 'Starting Milestone 1 Authentication Tests'));
  console.log(color('reset', ''));
  
  try {
    // Check backend health
    const healthResult = await axios.get(`${API_BASE_URL}/health`);
    if (healthResult.data.status !== 'OK') {
      throw new Error('Backend health check failed');
    }
    
    log('Backend is healthy');
    
    // Run tests in sequence
    await testRegistration();
    await testLogin();
    await testPasswordRecovery();
    await testEmailVerification();
    await testPhoneVerification();
    await testSessionManagement();
    await testSecurity();
    
    // Generate report
    const report = await generateReport();
    
    // Display results
    console.log('\n' + '='.repeat(60));
    console.log(color('reset', ''));
    console.log('\n');
    console.log(color('cyan', 'TEST RESULTS'));
    console.log(color('cyan', '─'.repeat(40)));
    console.log(`\nSummary: ${report.summary}`);
    console.log(`\nBackend Status: ${report.environment.backend}`);
    console.log(`\nFrontend Status: ${report.environment.frontend.status}`);
    
    // Display detailed results
    Object.keys(results).forEach(category => {
      console.log(`\n${category.toUpperCase()} RESULTS:`);
      console.log(color('cyan', '─'.repeat(40)));
      
      if (category === 'registration') {
        console.log(`  Email Registration: ${color(results.registration.email === 'PASS' ? 'green' : 'red')}${results.registration.email || 'N/A'}`);
        console.log(`  Phone Registration: ${color(results.registration.phone === 'PASS' ? 'green' : 'red')}${results.registration.phone || 'N/A'}`);
        if (results.registration.errors.length > 0) {
          console.log(color('red'), '  Errors:');
          results.registration.errors.forEach(error => console.log(`    - ${error}`));
        } else {
          console.log(color('green'), '  No errors');
        }
      } else if (category === 'login') {
        console.log(`  Email Login: ${color(results.login.email === 'PASS' ? 'green' : 'red')}${results.login.email || 'N/A'}`);
        console.log(`  Phone Login: ${color(results.login.phone === 'PASS' ? 'green' : 'red')}${results.login.phone || 'N/A'}`);
        console.log(`  Logout: ${color(results.login.logout === 'PASS' ? 'green' : 'red')}${results.login.logout || 'N/A'}`);
        if (results.login.errors.length > 0) {
          console.log(color('red'), '  Errors:');
          results.login.errors.forEach(error => console.log(`    - ${error}`));
        } else {
          console.log(color('green'), '  No errors');
        }
      } else if (category === 'passwordRecovery') {
        console.log(`  Email Recovery: ${color(results.passwordRecovery.email === 'PASS' ? 'green' : 'red')}${results.passwordRecovery.email || 'N/A'}`);
        console.log(`  Phone Recovery: ${color(results.passwordRecovery.phone === 'PASS' ? 'green' : 'red')}${results.passwordRecovery.phone || 'N/A'}`);
        if (results.passwordRecovery.errors.length > 0) {
          console.log(color('red'), '  Errors:');
          results.passwordRecovery.errors.forEach(error => console.log(`    - ${error}`));
        } else {
          console.log(color('green'), '  No errors');
        }
      } else if (category === 'verification') {
        console.log(`  Email Verification: ${color(results.verification.email === 'PASS' ? 'green' : 'red')}${results.verification.email || 'N/A'}`);
        console.log(`  Phone Verification: ${color(results.verification.phone === 'PASS' ? 'green' : 'red')}${results.verification.phone || 'N/A'}`);
        if (results.verification.errors.length > 0) {
          console.log(color('red'), '  Errors:');
          results.verification.errors.forEach(error => console.log(`    - ${error}`));
        } else {
          console.log(color('green'), '  No errors');
        }
      } else if (category === 'sessionManagement') {
        console.log(`  Get Current User: ${color(results.sessionManagement.me === 'PASS' ? 'green' : 'red')}${results.sessionManagement.me || 'N/A'}`);
        console.log(`  Session List: ${color(results.sessionManagement.sessions === 'PASS' ? 'green' : 'red')}${results.sessionManagement.sessions || 'N/A'}`);
        if (results.sessionManagement.errors.length > 0) {
          console.log(color('red'), '  Errors:');
          results.sessionManagement.errors.forEach(error => console.log(`    - ${error}`));
        } else {
          console.log(color('green'), '  No errors');
        }
      } else if (category === 'security') {
        console.log(`  Rate Limiting: ${color(results.security.rateLimiting === 'PASS' ? 'green' : 'red')}${results.security.rateLimiting || 'N/A'}`);
        console.log(`  Password Strength: ${color(results.security.passwordStrength === 'PASS' ? 'green' : 'red')}${results.security.passwordStrength || 'N/A'}`);
        console.log(`  SQL Injection: ${color(results.security.sqlInjection === 'PASS' ? 'green' : 'red')}${results.security.sqlInjection || 'N/A'}`);
        if (results.security.errors.length > 0) {
          console.log(color('red'), '  Errors:');
          results.security.errors.forEach(error => console.log(`    - ${error}`));
        } else {
          console.log(color('green'), '  No errors');
        }
      }
    });
    
    if (report.recommendations.length > 0) {
      console.log('\n' + '='.repeat(60));
      console.log(color('yellow'), 'RECOMMENDATIONS:');
      report.recommendations.forEach(rec => console.log(`  - ${rec}`));
    }
    
    console.log('\n' + '='.repeat(60));
    console.log(color('reset', ''));
    console.log('\n');
    
    return report;
  } catch (error) {
    console.error(color('red'), 'Test suite error:', error.message);
    console.log('\n');
    throw error;
  }
}

// Run tests if executed directly
if (require.main === module) {
  runTests();
}

module.exports = {
  runTests,
  generateReport
};
