/**
 * Comprehensive Authentication System Test
 * Tests Email Functionality, Registration, and Password Reset
 */

const axios = require('axios');
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');

const prisma = new PrismaClient();

// Test configuration
const API_BASE = 'http://localhost:3001/api/v1';
const TEST_RESULTS = {
  email: { passed: 0, failed: 0, tests: [] },
  registration: { passed: 0, failed: 0, tests: [] },
  passwordReset: { passed: 0, failed: 0, tests: [] },
  summary: { total: 0, passed: 0, failed: 0, startTime: new Date().toISOString() }
};

// Test data
const generateTestEmail = () => `test${Date.now()}@example.com`;
const generateTestPhone = () => `+88017${Math.floor(Math.random() * 100000000).toString().padStart(8, '0')}`;
const generateStrongPassword = () => `Str0ngP@ss!${Date.now().toString().slice(-4)}`;

// Utility functions
const logTest = (category, testName, status, details = {}) => {
  const timestamp = new Date().toISOString();
  const result = { testName, status, timestamp, ...details };
  
  TEST_RESULTS[category].tests.push(result);
  TEST_RESULTS[category].total = TEST_RESULTS[category].tests.length;
  TEST_RESULTS.summary.total++;
  
  if (status === 'PASS') {
    TEST_RESULTS[category].passed++;
    TEST_RESULTS.summary.passed++;
    console.log(`✅ PASS [${category.toUpperCase()}]: ${testName}`);
  } else {
    TEST_RESULTS[category].failed++;
    TEST_RESULTS.summary.failed++;
    console.log(`❌ FAIL [${category.toUpperCase()}]: ${testName}`);
    if (details.error) console.log(`   Error: ${details.error}`);
  }
  
  return result;
};

const makeRequest = async (method, endpoint, data = {}, headers = {}) => {
  try {
    const config = {
      method,
      url: `${API_BASE}${endpoint}`,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };
    
    if (method.toLowerCase() !== 'get' && Object.keys(data).length > 0) {
      config.data = data;
    }
    
    const response = await axios(config);
    return {
      success: true,
      status: response.status,
      data: response.data,
      headers: response.headers
    };
  } catch (error) {
    if (error.response) {
      return {
        success: false,
        status: error.response.status,
        data: error.response.data,
        headers: error.response.headers
      };
    }
    throw error;
  }
};

// Email Tests
const testEmailServiceStatus = async () => {
  console.log('\n=== Testing Email Service Status ===');
  
  try {
    const result = await makeRequest('GET', '/auth/email-status');
    
    if (result.success && result.data) {
      logTest('email', 'Email service status check', 'PASS', {
        isConfigured: result.data.isConfigured,
        isAvailable: result.data.isAvailable,
        provider: result.data.provider,
        fallbackMode: result.data.fallbackMode
      });
    } else {
      logTest('email', 'Email service status check', 'FAIL', {
        error: result.data?.error || 'Unknown error'
      });
    }
  } catch (error) {
    logTest('email', 'Email service status check', 'FAIL', {
      error: error.message
    });
  }
};

// Registration Tests
const testEmailRegistration = async () => {
  console.log('\n=== Testing Email Registration ===');
  
  const email = generateTestEmail();
  const password = generateStrongPassword();
  
  try {
    const result = await makeRequest('POST', '/auth/register', {
      email,
      password,
      confirmPassword: password,
      firstName: 'Test',
      lastName: 'User'
    });
    
    if (result.success && result.status === 201) {
      logTest('registration', 'Email-based registration', 'PASS', {
        email,
        userId: result.data.user?.id,
        requiresEmailVerification: result.data.requiresEmailVerification
      });
      
      // Verify user in database
      try {
        const dbUser = await prisma.user.findUnique({ where: { email } });
        if (dbUser) {
          logTest('registration', 'Email user database verification', 'PASS', {
            userId: dbUser.id,
            email: dbUser.email,
            status: dbUser.status
          });
        } else {
          logTest('registration', 'Email user database verification', 'FAIL', {
            error: 'User not found in database'
          });
        }
      } catch (dbError) {
        logTest('registration', 'Email user database verification', 'FAIL', {
          error: dbError.message
        });
      }
      
      return { success: true, userId: result.data.user?.id, email };
    } else {
      logTest('registration', 'Email-based registration', 'FAIL', {
        status: result.status,
        error: result.data?.error || 'Unknown error'
      });
      return { success: false };
    }
  } catch (error) {
    logTest('registration', 'Email-based registration', 'FAIL', {
      error: error.message
    });
    return { success: false };
  }
};

const testPhoneRegistration = async () => {
  console.log('\n=== Testing Phone Registration ===');
  
  const phone = generateTestPhone();
  const password = generateStrongPassword();
  
  try {
    const result = await makeRequest('POST', '/auth/register', {
      phone,
      password,
      confirmPassword: password,
      firstName: 'Test',
      lastName: 'User'
    });
    
    if (result.success && result.status === 201) {
      logTest('registration', 'Phone-based registration', 'PASS', {
        phone,
        userId: result.data.user?.id,
        requiresPhoneVerification: result.data.requiresPhoneVerification,
        operator: result.data.operator
      });
      
      return { success: true, userId: result.data.user?.id, phone };
    } else {
      logTest('registration', 'Phone-based registration', 'FAIL', {
        status: result.status,
        error: result.data?.error || 'Unknown error'
      });
      return { success: false };
    }
  } catch (error) {
    logTest('registration', 'Phone-based registration', 'FAIL', {
      error: error.message
    });
    return { success: false };
  }
};

const testInvalidRegistration = async () => {
  console.log('\n=== Testing Invalid Registration Scenarios ===');
  
  // Test weak password
  try {
    const result = await makeRequest('POST', '/auth/register', {
      email: generateTestEmail(),
      password: 'weak123',
      confirmPassword: 'weak123',
      firstName: 'Test',
      lastName: 'User'
    });
    
    if (!result.success && result.status === 400) {
      logTest('registration', 'Weak password rejection', 'PASS', {
        error: result.data?.error
      });
    } else {
      logTest('registration', 'Weak password rejection', 'FAIL', {
        error: 'Should reject weak password'
      });
    }
  } catch (error) {
    logTest('registration', 'Weak password rejection', 'FAIL', {
      error: error.message
    });
  }
  
  // Test invalid email
  try {
    const result = await makeRequest('POST', '/auth/register', {
      email: 'invalid-email',
      password: generateStrongPassword(),
      confirmPassword: generateStrongPassword(),
      firstName: 'Test',
      lastName: 'User'
    });
    
    if (!result.success && result.status === 400) {
      logTest('registration', 'Invalid email rejection', 'PASS', {
        error: result.data?.error
      });
    } else {
      logTest('registration', 'Invalid email rejection', 'FAIL', {
        error: 'Should reject invalid email'
      });
    }
  } catch (error) {
    logTest('registration', 'Invalid email rejection', 'FAIL', {
      error: error.message
    });
  }
};

// Password Reset Tests
const testPasswordResetFlow = async (email, userId) => {
  console.log('\n=== Testing Password Reset Flow ===');
  
  if (!email || !userId) {
    logTest('passwordReset', 'Password reset flow', 'SKIP', {
      error: 'No valid user available for testing'
    });
    return;
  }
  
  // Test forgot password
  try {
    const forgotResult = await makeRequest('POST', '/auth/forgot-password', {
      email
    });
    
    if (forgotResult.success) {
      logTest('passwordReset', 'Forgot password request', 'PASS', {
        email,
        message: forgotResult.data?.message
      });
    } else {
      logTest('passwordReset', 'Forgot password request', 'FAIL', {
        error: forgotResult.data?.error || 'Unknown error'
      });
      return;
    }
  } catch (error) {
    logTest('passwordReset', 'Forgot password request', 'FAIL', {
      error: error.message
    });
    return;
  }
  
  // Wait for email processing
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Get reset token from database
  try {
    const resetToken = await prisma.emailVerificationToken.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    });
    
    if (!resetToken) {
      logTest('passwordReset', 'Reset token generation', 'FAIL', {
        error: 'Reset token not found in database'
      });
      return;
    }
    
    logTest('passwordReset', 'Reset token generation', 'PASS', {
      tokenId: resetToken.id,
      expiresAt: resetToken.expiresAt
    });
    
    // Test password reset with invalid token
    try {
      const invalidResult = await makeRequest('POST', '/auth/reset-password', {
        token: 'invalid-token',
        newPassword: generateStrongPassword(),
        confirmPassword: generateStrongPassword()
      });
      
      if (!invalidResult.success && invalidResult.status === 400) {
        logTest('passwordReset', 'Invalid token rejection', 'PASS', {
          error: invalidResult.data?.error
        });
      } else {
        logTest('passwordReset', 'Invalid token rejection', 'FAIL', {
          error: 'Should reject invalid token'
        });
      }
    } catch (error) {
      logTest('passwordReset', 'Invalid token rejection', 'FAIL', {
        error: error.message
      });
    }
    
    // Test successful password reset
    const newPassword = generateStrongPassword();
    try {
      const resetResult = await makeRequest('POST', '/auth/reset-password', {
        token: resetToken.token,
        newPassword,
        confirmPassword: newPassword
      });
      
      if (resetResult.success) {
        logTest('passwordReset', 'Password reset execution', 'PASS', {
          message: resetResult.data?.message
        });
        
        // Test login with new password
        try {
          const loginResult = await makeRequest('POST', '/auth/login', {
            identifier: email,
            password: newPassword
          });
          
          if (loginResult.success) {
            logTest('passwordReset', 'Login with new password', 'PASS', {
              userId: loginResult.data.user?.id
            });
          } else {
            logTest('passwordReset', 'Login with new password', 'FAIL', {
              error: loginResult.data?.error || 'Unknown error'
            });
          }
        } catch (error) {
          logTest('passwordReset', 'Login with new password', 'FAIL', {
            error: error.message
          });
        }
      } else {
        logTest('passwordReset', 'Password reset execution', 'FAIL', {
          error: resetResult.data?.error || 'Unknown error'
        });
      }
    } catch (error) {
      logTest('passwordReset', 'Password reset execution', 'FAIL', {
        error: error.message
      });
    }
  } catch (error) {
    logTest('passwordReset', 'Reset token retrieval', 'FAIL', {
      error: error.message
    });
  }
};

// Generate report
const generateReport = () => {
  const report = {
    timestamp: new Date().toISOString(),
    testSuite: 'Comprehensive Authentication System Test',
    summary: {
      totalTests: TEST_RESULTS.summary.total,
      passed: TEST_RESULTS.summary.passed,
      failed: TEST_RESULTS.summary.failed,
      passRate: `${((TEST_RESULTS.summary.passed / TEST_RESULTS.summary.total) * 100).toFixed(2)}%`
    },
    emailTests: {
      total: TEST_RESULTS.email.tests.length,
      passed: TEST_RESULTS.email.passed,
      failed: TEST_RESULTS.email.failed,
      tests: TEST_RESULTS.email.tests
    },
    registrationTests: {
      total: TEST_RESULTS.registration.tests.length,
      passed: TEST_RESULTS.registration.passed,
      failed: TEST_RESULTS.registration.failed,
      tests: TEST_RESULTS.registration.tests
    },
    passwordResetTests: {
      total: TEST_RESULTS.passwordReset.tests.length,
      passed: TEST_RESULTS.passwordReset.passed,
      failed: TEST_RESULTS.passwordReset.failed,
      tests: TEST_RESULTS.passwordReset.tests
    },
    recommendations: []
  };
  
  // Add recommendations based on test results
  if (TEST_RESULTS.email.failed > 0) {
    report.recommendations.push('Review email service configuration and credentials');
  }
  if (TEST_RESULTS.registration.failed > 0) {
    report.recommendations.push('Review registration validation logic and error handling');
  }
  if (TEST_RESULTS.passwordReset.failed > 0) {
    report.recommendations.push('Review password reset flow and token generation');
  }
  
  return report;
};

// Main test execution
const runTests = async () => {
  console.log('🚀 Starting Comprehensive Authentication System Test');
  console.log('====================================================\n');
  
  try {
    // Test email service
    await testEmailServiceStatus();
    
    // Test registration
    const emailRegResult = await testEmailRegistration();
    await testPhoneRegistration();
    await testInvalidRegistration();
    
    // Test password reset
    if (emailRegResult.success) {
      await testPasswordResetFlow(emailRegResult.email, emailRegResult.userId);
    }
    
    // Generate and save report
    const report = generateReport();
    
    console.log('\n====================================================');
    console.log('📊 COMPREHENSIVE TEST REPORT');
    console.log('====================================================');
    console.log(`Total Tests: ${report.summary.totalTests}`);
    console.log(`Passed: ${report.summary.passed}`);
    console.log(`Failed: ${report.summary.failed}`);
    console.log(`Pass Rate: ${report.summary.passRate}\n`);
    
    console.log('📧 Email Tests:');
    console.log(`   Total: ${report.emailTests.total}`);
    console.log(`   Passed: ${report.emailTests.passed}`);
    console.log(`   Failed: ${report.emailTests.failed}\n`);
    
    console.log('📝 Registration Tests:');
    console.log(`   Total: ${report.registrationTests.total}`);
    console.log(`   Passed: ${report.registrationTests.passed}`);
    console.log(`   Failed: ${report.registrationTests.failed}\n`);
    
    console.log('🔐 Password Reset Tests:');
    console.log(`   Total: ${report.passwordResetTests.total}`);
    console.log(`   Passed: ${report.passwordResetTests.passed}`);
    console.log(`   Failed: ${report.passwordResetTests.failed}\n`);
    
    if (report.recommendations.length > 0) {
      console.log('💡 Recommendations:');
      report.recommendations.forEach((rec, i) => {
        console.log(`   ${i + 1}. ${rec}`);
      });
      console.log();
    }
    
    // Save detailed report
    const reportFileName = `backend/comprehensive-auth-test-report-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
    fs.writeFileSync(reportFileName, JSON.stringify(report, null, 2));
    console.log(`📄 Detailed report saved to: ${reportFileName}`);
    
    return report;
  } catch (error) {
    console.error('❌ Test execution failed:', error.message);
    console.error('Stack trace:', error.stack);
    throw error;
  }
};

// Run tests
runTests()
  .then(report => {
    if (report.summary.failed === 0) {
      console.log('\n🎉 ALL TESTS PASSED!');
      process.exit(0);
    } else {
      console.log('\n⚠️  Some tests failed. Please review the report.');
      process.exit(1);
    }
  })
  .catch(error => {
    console.error('\n❌ Test suite error:', error);
    process.exit(1);
  });
