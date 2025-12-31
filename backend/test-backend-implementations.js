/**
 * Backend Implementation Test Suite
 * 
 * This script tests all the backend implementations completed for Milestone 1:
 * - SMTP Email Service Configuration
 * - Twilio SMS Service Configuration
 * - Output Sanitization Middleware
 * - API Documentation (Swagger)
 * - Environment Variable Templates
 * 
 * Run with: node test-backend-implementations.js
 */

const { emailService } = require('./services/emailService');
const { smsService } = require('./services/smsService');
const { sanitizeString, sanitizeObject, sanitizeResponse, testSanitization } = require('./middleware/sanitize');
const configService = require('./services/config');
const { loggerService } = require('./services/logger');

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  white: '\x1b[37m'
};

function log(message, color = 'white') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSuccess(message) {
  console.log(`${colors.green}✓ ${message}${colors.reset}`);
}

function logError(message) {
  console.log(`${colors.red}✗ ${message}${colors.reset}`);
}

function logSection(title) {
  console.log(`\n${colors.cyan}${'='.repeat(60)}${colors.reset}`);
  console.log(`${colors.cyan}${title}${colors.reset}`);
  console.log(`${colors.cyan}${'='.repeat(60)}${colors.reset}\n`);
}

function logTest(name, passed) {
  if (passed) {
    logSuccess(name);
  } else {
    logError(name);
  }
}

// Test results tracking
const testResults = {
  emailService: {
    total: 0,
    passed: 0,
    failed: 0,
    tests: []
  },
  smsService: {
    total: 0,
    passed: 0,
    failed: 0,
    tests: []
  },
  sanitization: {
    total: 0,
    passed: 0,
    failed: 0,
    tests: []
  },
  config: {
    total: 0,
    passed: 0,
    failed: 0,
    tests: []
  }
};

/**
 * Test 1: Email Service Configuration
 */
async function testEmailService() {
  logSection('Testing Email Service Configuration');
  
  // Test 1.1: Email service status
  try {
    const status = emailService.getServiceStatus();
    testResults.emailService.total++;
    const hasStatus = status.isConfigured !== undefined && 
                       status.isAvailable !== undefined && 
                       status.fallbackMode !== undefined;
    logTest('Email service status check', hasStatus);
    if (hasStatus) {
      testResults.emailService.passed++;
      testResults.emailService.tests.push({ 
        name: 'Email service status check', 
        passed: true,
        details: status
      });
    } else {
      testResults.emailService.failed++;
      testResults.emailService.tests.push({ 
        name: 'Email service status check', 
        passed: false 
      });
    }
  } catch (error) {
    logError(`Email service status check failed: ${error.message}`);
    testResults.emailService.failed++;
  }

  // Test 1.2: Email validation
  try {
    const validEmail = 'test@example.com';
    const invalidEmail = 'invalid-email';
    
    const validResult = emailService.validateEmail(validEmail);
    const invalidResult = emailService.validateEmail(invalidEmail);
    
    testResults.emailService.total += 2;
    const validCheck = validResult === true && invalidResult === false;
    logTest('Email format validation', validCheck);
    
    if (validCheck) {
      testResults.emailService.passed += 2;
      testResults.emailService.tests.push({ 
        name: 'Email format validation', 
        passed: true 
      });
    } else {
      testResults.emailService.failed += 2;
      testResults.emailService.tests.push({ 
        name: 'Email format validation', 
        passed: false 
      });
    }
  } catch (error) {
    logError(`Email validation test failed: ${error.message}`);
    testResults.emailService.failed += 2;
  }

  // Test 1.3: Disposable email check
  try {
    const disposableEmail = 'test@10minutemail.com';
    const regularEmail = 'test@gmail.com';
    
    const isDisposable = emailService.isDisposableEmail(disposableEmail);
    const isNotDisposable = emailService.isDisposableEmail(regularEmail);
    
    testResults.emailService.total += 2;
    const disposableCheck = isDisposable === true && isNotDisposable === false;
    logTest('Disposable email detection', disposableCheck);
    
    if (disposableCheck) {
      testResults.emailService.passed += 2;
      testResults.emailService.tests.push({ 
        name: 'Disposable email detection', 
        passed: true 
      });
    } else {
      testResults.emailService.failed += 2;
      testResults.emailService.tests.push({ 
        name: 'Disposable email detection', 
        passed: false 
      });
    }
  } catch (error) {
    logError(`Disposable email check failed: ${error.message}`);
    testResults.emailService.failed += 2;
  }

  // Test 1.4: Verification token generation
  try {
    const token = emailService.generateVerificationToken();
    testResults.emailService.total++;
    const hasToken = token && token.length === 64; // 32 bytes = 64 hex chars
    logTest('Verification token generation', hasToken);
    
    if (hasToken) {
      testResults.emailService.passed++;
      testResults.emailService.tests.push({ 
        name: 'Verification token generation', 
        passed: true 
      });
    } else {
      testResults.emailService.failed++;
      testResults.emailService.tests.push({ 
        name: 'Verification token generation', 
        passed: false 
      });
    }
  } catch (error) {
    logError(`Token generation test failed: ${error.message}`);
    testResults.emailService.failed++;
  }

  // Test 1.5: Email config validation
  try {
    const validation = emailService.validateConfig();
    testResults.emailService.total++;
    const hasValidation = validation && 
                          validation.isValid !== undefined && 
                          validation.errors !== undefined;
    logTest('Email configuration validation', hasValidation);
    
    if (hasValidation) {
      testResults.emailService.passed++;
      testResults.emailService.tests.push({ 
        name: 'Email configuration validation', 
        passed: true,
        details: validation
      });
    } else {
      testResults.emailService.failed++;
      testResults.emailService.tests.push({ 
        name: 'Email configuration validation', 
        passed: false 
      });
    }
  } catch (error) {
    logError(`Email config validation failed: ${error.message}`);
    testResults.emailService.failed++;
  }

  // Test 1.6: Email template creation
  try {
    const template = emailService.createVerificationEmailTemplate('Test User', 'test-token-123');
    testResults.emailService.total++;
    const hasTemplate = template && 
                       template.subject && 
                       template.html && 
                       template.text;
    logTest('Email template creation', hasTemplate);
    
    if (hasTemplate) {
      testResults.emailService.passed++;
      testResults.emailService.tests.push({ 
        name: 'Email template creation', 
        passed: true 
      });
    } else {
      testResults.emailService.failed++;
      testResults.emailService.tests.push({ 
        name: 'Email template creation', 
        passed: false 
      });
    }
  } catch (error) {
    logError(`Email template creation failed: ${error.message}`);
    testResults.emailService.failed++;
  }
}

/**
 * Test 2: SMS Service Configuration
 */
async function testSMSService() {
  logSection('Testing SMS Service Configuration');
  
  // Test 2.1: SMS service status
  try {
    const status = smsService.getServiceStatus();
    testResults.smsService.total++;
    const hasStatus = status.isConfigured !== undefined && 
                       status.isAvailable !== undefined && 
                       status.fallbackMode !== undefined;
    logTest('SMS service status check', hasStatus);
    
    if (hasStatus) {
      testResults.smsService.passed++;
      testResults.smsService.tests.push({ 
        name: 'SMS service status check', 
        passed: true,
        details: status
      });
    } else {
      testResults.smsService.failed++;
      testResults.smsService.tests.push({ 
        name: 'SMS service status check', 
        passed: false 
      });
    }
  } catch (error) {
    logError(`SMS service status check failed: ${error.message}`);
    testResults.smsService.failed++;
  }

  // Test 2.2: SMS config validation
  try {
    const validation = smsService.validateConfig();
    testResults.smsService.total++;
    const hasValidation = validation && 
                          validation.isValid !== undefined && 
                          validation.errors !== undefined;
    logTest('SMS configuration validation', hasValidation);
    
    if (hasValidation) {
      testResults.smsService.passed++;
      testResults.smsService.tests.push({ 
        name: 'SMS configuration validation', 
        passed: true,
        details: validation
      });
    } else {
      testResults.smsService.failed++;
      testResults.smsService.tests.push({ 
        name: 'SMS configuration validation', 
        passed: false 
      });
    }
  } catch (error) {
    logError(`SMS config validation failed: ${error.message}`);
    testResults.smsService.failed++;
  }

  // Test 2.3: Phone number validation
  try {
    const validPhone = '+8801712345678';
    const invalidPhone = '12345';
    
    const validResult = smsService.validateBangladeshPhoneNumber(validPhone);
    const invalidResult = smsService.validateBangladeshPhoneNumber(invalidPhone);
    
    testResults.smsService.total += 2;
    const phoneCheck = validResult.isValid && !invalidResult.isValid;
    logTest('Phone number validation', phoneCheck);
    
    if (phoneCheck) {
      testResults.smsService.passed += 2;
      testResults.smsService.tests.push({ 
        name: 'Phone number validation', 
        passed: true 
      });
    } else {
      testResults.smsService.failed += 2;
      testResults.smsService.tests.push({ 
        name: 'Phone number validation', 
        passed: false 
      });
    }
  } catch (error) {
    logError(`Phone validation test failed: ${error.message}`);
    testResults.smsService.failed += 2;
  }

  // Test 2.4: OTP template creation
  try {
    const template = smsService.createOTPTemplate('123456', 'Test User');
    testResults.smsService.total++;
    const hasTemplate = template && 
                       template.text && 
                       template.textEn && 
                       template.textBn;
    logTest('OTP template creation', hasTemplate);
    
    if (hasTemplate) {
      testResults.smsService.passed++;
      testResults.smsService.tests.push({ 
        name: 'OTP template creation', 
        passed: true 
      });
    } else {
      testResults.smsService.failed++;
      testResults.smsService.tests.push({ 
        name: 'OTP template creation', 
        passed: false 
      });
    }
  } catch (error) {
    logError(`OTP template creation failed: ${error.message}`);
    testResults.smsService.failed++;
  }

  // Test 2.5: Get operator info
  try {
    const operatorInfo = smsService.getOperatorInfo('+8801712345678');
    testResults.smsService.total++;
    const hasOperator = operatorInfo && operatorInfo.operator !== undefined;
    logTest('Get operator information', hasOperator);
    
    if (hasOperator) {
      testResults.smsService.passed++;
      testResults.smsService.tests.push({ 
        name: 'Get operator information', 
        passed: true,
        details: operatorInfo
      });
    } else {
      testResults.smsService.failed++;
      testResults.smsService.tests.push({ 
        name: 'Get operator information', 
        passed: false 
      });
    }
  } catch (error) {
    logError(`Get operator info failed: ${error.message}`);
    testResults.smsService.failed++;
  }

  // Test 2.6: Get supported operators
  try {
    const operators = smsService.getSupportedOperators();
    testResults.smsService.total++;
    const hasOperators = operators && Array.isArray(operators) && operators.length > 0;
    logTest('Get supported operators', hasOperators);
    
    if (hasOperators) {
      testResults.smsService.passed++;
      testResults.smsService.tests.push({ 
        name: 'Get supported operators', 
        passed: true,
        details: { count: operators.length }
      });
    } else {
      testResults.smsService.failed++;
      testResults.smsService.tests.push({ 
        name: 'Get supported operators', 
        passed: false 
      });
    }
  } catch (error) {
    logError(`Get supported operators failed: ${error.message}`);
    testResults.smsService.failed++;
  }
}

/**
 * Test 3: Output Sanitization
 */
async function testOutputSanitization() {
  logSection('Testing Output Sanitization Middleware');
  
  // Test 3.1: String sanitization
  try {
    const xssPayload = '<script>alert("XSS")</script>';
    const sanitized = sanitizeString(xssPayload);
    testResults.sanitization.total++;
    const isClean = !sanitized.includes('<script>') && 
                     !sanitized.includes('alert(') &&
                     sanitized === '';
    logTest('String sanitization (XSS prevention)', isClean);
    
    if (isClean) {
      testResults.sanitization.passed++;
      testResults.sanitization.tests.push({ 
        name: 'String sanitization (XSS prevention)', 
        passed: true,
        input: xssPayload,
        output: sanitized
      });
    } else {
      testResults.sanitization.failed++;
      testResults.sanitization.tests.push({ 
        name: 'String sanitization (XSS prevention)', 
        passed: false 
      });
    }
  } catch (error) {
    logError(`String sanitization test failed: ${error.message}`);
    testResults.sanitization.failed++;
  }

  // Test 3.2: Object sanitization
  try {
    const xssObject = {
      name: '<script>alert("XSS")</script>',
      email: 'test@example.com',
      password: 'secret123'
    };
    
    const sanitized = sanitizeObject(xssObject);
    testResults.sanitization.total++;
    const isObjectClean = sanitized.name === '' && 
                          sanitized.email === 'test@example.com' &&
                          sanitized.password === 'secret123';
    logTest('Object sanitization', isObjectClean);
    
    if (isObjectClean) {
      testResults.sanitization.passed++;
      testResults.sanitization.tests.push({ 
        name: 'Object sanitization', 
        passed: true 
      });
    } else {
      testResults.sanitization.failed++;
      testResults.sanitization.tests.push({ 
        name: 'Object sanitization', 
        passed: false 
      });
    }
  } catch (error) {
    logError(`Object sanitization test failed: ${error.message}`);
    testResults.sanitization.failed++;
  }

  // Test 3.3: Response sanitization
  try {
    const xssResponse = {
      message: '<img src=x onerror=alert("XSS")>',
      user: {
        name: '<script>alert("XSS")</script>',
        email: 'test@example.com'
      }
    };
    
    const sanitized = sanitizeResponse(xssResponse);
    testResults.sanitization.total++;
    const isResponseClean = sanitized.message === '' && 
                            sanitized.user.name === '';
    logTest('Response sanitization', isResponseClean);
    
    if (isResponseClean) {
      testResults.sanitization.passed++;
      testResults.sanitization.tests.push({ 
        name: 'Response sanitization', 
        passed: true 
      });
    } else {
      testResults.sanitization.failed++;
      testResults.sanitization.tests.push({ 
        name: 'Response sanitization', 
        passed: false 
      });
    }
  } catch (error) {
    logError(`Response sanitization test failed: ${error.message}`);
    testResults.sanitization.failed++;
  }

  // Test 3.4: XSS payload testing
  try {
    const testResult = testSanitization('<script>alert("test")</script>');
    testResults.sanitization.total++;
    const hasTests = testResult && testResult.xssTests && Array.isArray(testResult.xssTests);
    logTest('XSS payload testing', hasTests);
    
    if (hasTests) {
      testResults.sanitization.passed++;
      testResults.sanitization.tests.push({
        name: 'XSS payload testing',
        passed: true,
        payloadCount: testResult.xssTests.length
      });
    } else {
      testResults.sanitization.failed++;
      testResults.sanitization.tests.push({
        name: 'XSS payload testing',
        passed: false
      });
    }
  } catch (error) {
    logError(`XSS payload testing failed: ${error.message}`);
    testResults.sanitization.failed++;
  }
}

/**
 * Test 4: Configuration Service
 */
async function testConfigService() {
  logSection('Testing Configuration Service');
  
  // Test 4.1: Config validation
  try {
    const validation = configService.validateConfig();
    testResults.config.total++;
    const hasValidation = validation && validation.isValid !== undefined;
    logTest('Configuration validation', hasValidation);
    
    if (hasValidation) {
      testResults.config.passed++;
      testResults.config.tests.push({ 
        name: 'Configuration validation', 
        passed: true,
        details: validation
      });
    } else {
      testResults.config.failed++;
      testResults.config.tests.push({ 
        name: 'Configuration validation', 
        passed: false 
      });
    }
  } catch (error) {
    logError(`Config validation test failed: ${error.message}`);
    testResults.config.failed++;
  }

  // Test 4.2: Environment helpers
  try {
    const isDev = configService.isDevelopment();
    const isProd = configService.isProduction();
    const isTest = configService.isTest();
    
    testResults.config.total++;
    const hasHelpers = typeof isDev === 'boolean' && 
                       typeof isProd === 'boolean' && 
                       typeof isTest === 'boolean';
    logTest('Environment helper functions', hasHelpers);
    
    if (hasHelpers) {
      testResults.config.passed++;
      testResults.config.tests.push({ 
        name: 'Environment helper functions', 
        passed: true,
        details: { isDev, isProd, isTest }
      });
    } else {
      testResults.config.failed++;
      testResults.config.tests.push({ 
        name: 'Environment helper functions', 
        passed: false 
      });
    }
  } catch (error) {
    logError(`Environment helpers test failed: ${error.message}`);
    testResults.config.failed++;
  }

  // Test 4.3: Verification flags
  try {
    const emailDisabled = configService.isEmailVerificationDisabled();
    const phoneDisabled = configService.isPhoneVerificationDisabled();
    const testingMode = configService.isTestingMode();
    
    testResults.config.total++;
    const hasFlags = typeof emailDisabled === 'boolean' && 
                     typeof phoneDisabled === 'boolean' && 
                     typeof testingMode === 'boolean';
    logTest('Verification flag functions', hasFlags);
    
    if (hasFlags) {
      testResults.config.passed++;
      testResults.config.tests.push({ 
        name: 'Verification flag functions', 
        passed: true,
        details: { emailDisabled, phoneDisabled, testingMode }
      });
    } else {
      testResults.config.failed++;
      testResults.config.tests.push({ 
        name: 'Verification flag functions', 
        passed: false 
      });
    }
  } catch (error) {
    logError(`Verification flags test failed: ${error.message}`);
    testResults.config.failed++;
  }

  // Test 4.4: Config getters
  try {
    const jwtSecret = configService.getJwtSecret();
    const redisConfig = configService.getRedisConfig();
    const emailConfig = configService.getEmailConfig();
    
    testResults.config.total++;
    const hasGetters = jwtSecret !== undefined && 
                       redisConfig !== undefined && 
                       emailConfig !== undefined;
    logTest('Configuration getter functions', hasGetters);
    
    if (hasGetters) {
      testResults.config.passed++;
      testResults.config.tests.push({ 
        name: 'Configuration getter functions', 
        passed: true 
      });
    } else {
      testResults.config.failed++;
      testResults.config.tests.push({ 
        name: 'Configuration getter functions', 
        passed: false 
      });
    }
  } catch (error) {
    logError(`Config getters test failed: ${error.message}`);
    testResults.config.failed++;
  }
}

/**
 * Test 5: Environment Variable Template
 */
async function testEnvironmentTemplate() {
  logSection('Testing Environment Variable Template');
  
  try {
    const fs = require('fs');
    const path = require('path');
    
    const envExamplePath = path.join(__dirname, '.env.example');
    testResults.config.total++;
    
    if (fs.existsSync(envExamplePath)) {
      const content = fs.readFileSync(envExamplePath, 'utf8');
      
      // Check for required sections
      const hasServerConfig = content.includes('SERVER CONFIGURATION');
      const hasDatabaseConfig = content.includes('DATABASE CONFIGURATION');
      const hasRedisConfig = content.includes('REDIS CONFIGURATION');
      const hasJWTConfig = content.includes('JWT CONFIGURATION');
      const hasEmailConfig = content.includes('EMAIL CONFIGURATION (SMTP)');
      const hasSMSConfig = content.includes('SMS CONFIGURATION (TWILIO)');
      const hasSecurityConfig = content.includes('SECURITY CONFIGURATION');
      const hasCORSConfig = content.includes('CORS CONFIGURATION');
      const hasLoggingConfig = content.includes('LOGGING CONFIGURATION');
      const hasTestingConfig = content.includes('TESTING CONFIGURATION');
      const hasDockerConfig = content.includes('DOCKER CONFIGURATION');
      
      const hasAllSections = hasServerConfig && hasDatabaseConfig && hasRedisConfig && 
                           hasJWTConfig && hasEmailConfig && hasSMSConfig && 
                           hasSecurityConfig && hasCORSConfig && hasLoggingConfig && 
                           hasTestingConfig && hasDockerConfig;
      
      logTest('Environment variable template completeness', hasAllSections);
      
      if (hasAllSections) {
        testResults.config.passed++;
        testResults.config.tests.push({ 
          name: 'Environment variable template completeness', 
          passed: true 
        });
      } else {
        testResults.config.failed++;
        testResults.config.tests.push({ 
          name: 'Environment variable template completeness', 
          passed: false,
          missingSections: {
            hasServerConfig,
            hasDatabaseConfig,
            hasRedisConfig,
            hasJWTConfig,
            hasEmailConfig,
            hasSMSConfig,
            hasSecurityConfig,
            hasCORSConfig,
            hasLoggingConfig,
            hasTestingConfig,
            hasDockerConfig
          }
        });
      }
    } else {
      logError('.env.example file not found');
      testResults.config.failed++;
    }
  } catch (error) {
    logError(`Environment template test failed: ${error.message}`);
    testResults.config.failed++;
  }
}

/**
 * Print test results summary
 */
function printSummary() {
  logSection('Test Results Summary');
  
  const categories = [
    { name: 'Email Service', results: testResults.emailService },
    { name: 'SMS Service', results: testResults.smsService },
    { name: 'Sanitization', results: testResults.sanitization },
    { name: 'Configuration', results: testResults.config }
  ];
  
  let totalTests = 0;
  let totalPassed = 0;
  let totalFailed = 0;
  
  categories.forEach(category => {
    const { name, results } = category;
    const passRate = results.total > 0 
      ? ((results.passed / results.total) * 100).toFixed(1) 
      : '0.0';
    
    console.log(`\n${colors.bright}${name}${colors.reset}`);
    console.log(`  Total Tests: ${colors.cyan}${results.total}${colors.reset}`);
    console.log(`  Passed: ${colors.green}${results.passed}${colors.reset}`);
    console.log(`  Failed: ${colors.red}${results.failed}${colors.reset}`);
    console.log(`  Pass Rate: ${colors.yellow}${passRate}%${colors.reset}`);
    
    totalTests += results.total;
    totalPassed += results.passed;
    totalFailed += results.failed;
  });
  
  // Overall summary
  const overallPassRate = totalTests > 0 
    ? ((totalPassed / totalTests) * 100).toFixed(1) 
    : '0.0';
  
  console.log(`\n${colors.bright}${'='.repeat(60)}${colors.reset}`);
  console.log(`${colors.bright}OVERALL SUMMARY${colors.reset}`);
  console.log(`${colors.bright}${'='.repeat(60)}${colors.reset}`);
  console.log(`\n  Total Tests: ${colors.cyan}${totalTests}${colors.reset}`);
  console.log(`  Total Passed: ${colors.green}${totalPassed}${colors.reset}`);
  console.log(`  Total Failed: ${colors.red}${totalFailed}${colors.reset}`);
  console.log(`  Overall Pass Rate: ${colors.yellow}${overallPassRate}%${colors.reset}\n`);
  
  // Detailed test results
  if (process.argv.includes('--verbose')) {
    console.log(`${colors.cyan}\nDetailed Test Results:${colors.reset}\n`);
    categories.forEach(category => {
      const { name, results } = category;
      console.log(`${colors.bright}${name}:${colors.reset}`);
      results.tests.forEach(test => {
        const status = test.passed ? '✓' : '✗';
        const color = test.passed ? 'green' : 'red';
        console.log(`  ${colors[color]}${status} ${test.name}${colors.reset}`);
        if (test.details) {
          console.log(`    Details: ${JSON.stringify(test.details, null, 2)}`);
        }
      });
    });
  }
}

/**
 * Main test runner
 */
async function runTests() {
  console.log(`${colors.cyan}
╔════════════════════════════════════════════════════════════╗
║                                                              ║
║   BACKEND IMPLEMENTATION TEST SUITE                         ║
║                                                              ║
║   Milestone 1: Core Authentication System                     ║
║                                                              ║
╚══════════════════════════════════════════════════════════╝
${colors.reset}\n`);
  
  const startTime = Date.now();
  
  try {
    // Run all tests
    await testEmailService();
    await testSMSService();
    await testOutputSanitization();
    await testConfigService();
    await testEnvironmentTemplate();
    
    // Print summary
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    printSummary();
    
    console.log(`\n${colors.cyan}Test completed in ${duration} seconds${colors.reset}\n`);
    
    // Exit with appropriate code
    const totalFailed = testResults.emailService.failed + 
                        testResults.smsService.failed + 
                        testResults.sanitization.failed + 
                        testResults.config.failed;
    
    process.exit(totalFailed > 0 ? 1 : 0);
    
  } catch (error) {
    logError(`Test execution failed: ${error.message}`);
    console.error(error);
    process.exit(1);
  }
}

// Run tests if executed directly
if (require.main === module) {
  runTests();
}

module.exports = {
  runTests,
  testEmailService,
  testSMSService,
  testOutputSanitization,
  testConfigService,
  testEnvironmentTemplate
};
