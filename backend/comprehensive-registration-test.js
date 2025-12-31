
const axios = require('axios');
const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');

// Test configuration
const API_BASE_URL = 'http://localhost:3001/api';
const TEST_RESULTS = {
  passed: 0,
  failed: 0,
  total: 0,
  details: [],
  performance: [],
  security: [],
  integration: []
};

// Test data generators
const generateTestEmail = () => `test${Date.now()}@example.com`;
const generateTestPhone = () => `+88017${Math.floor(Math.random() * 100000000).toString().padStart(8, '0')}`;
const generateWeakPassword = () => 'password123';
const generateStrongPassword = () => `Str0ngP@ss!${Date.now().toString().slice(-4)}`;

// Initialize Prisma client for database verification
const prisma = new PrismaClient();

// Utility functions
const logTest = (testName, status, details = {}) => {
  const timestamp = new Date().toISOString();
  const result = {
    testName,
    status,
    timestamp,
    ...details
  };
  
  TEST_RESULTS.details.push(result);
  TEST_RESULTS.total++;
  
  if (status === 'PASS') {
    TEST_RESULTS.passed++;
    console.log(`✅ PASS: ${testName}`);
  } else {
    TEST_RESULTS.failed++;
    console.log(`❌ FAIL: ${testName}`);
    if (details.error) console.log(`   Error: ${details.error}`);
  }
  
  return result;
};

const measureResponseTime = async (testFunction) => {
  const startTime = Date.now();
  try {
    const result = await testFunction();
    const endTime = Date.now();
    const responseTime = endTime - startTime;
    
    TEST_RESULTS.performance.push({
      testName: testFunction.name || 'Anonymous Test',
      responseTime,
      timestamp: new Date().toISOString()
    });
    
    return { ...result, responseTime };
  } catch (error) {
    const endTime = Date.now();
    const responseTime = endTime - startTime;
    
    TEST_RESULTS.performance.push({
      testName: testFunction.name || 'Anonymous Test',
      responseTime,
      error: error.message,
      timestamp: new Date().toISOString()
    });
    
    throw error;
  }
};

const makeRequest = async (method, endpoint, data = {}, headers = {}) => {
  try {
    const config = {
      method,
      url: `${API_BASE_URL}${endpoint}`,
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

// Test suites
const testValidRegistrationScenarios = async () => {
  console.log('\n=== Testing Valid Registration Scenarios ===');
  
  // Test 1: Email-based registration with valid data
  try {
    const email = generateTestEmail();
    const password = generateStrongPassword();
    const result = await measureResponseTime(async () => {
      return await makeRequest('POST', '/auth/register', {
        email,
        password,
        confirmPassword: password,
        firstName: 'Test',
        lastName: 'User'
      });
    });
    
    if (result.success && result.status === 201) {
      logTest('Email-based registration with valid data', 'PASS', {
        email,
        responseTime: result.responseTime,
        userId: result.data.user?.id,
        requiresEmailVerification: result.data.requiresEmailVerification
      });
      
      // Verify user was created in database
      try {
        const dbUser = await prisma.user.findUnique({
          where: { email }
        });
        
        if (dbUser) {
          TEST_RESULTS.integration.push({
            test: 'Email user creation in database',
            status: 'PASS',
            userId: dbUser.id,
            email: dbUser.email,
            status: dbUser.status
          });
        } else {
          TEST_RESULTS.integration.push({
            test: 'Email user creation in database',
            status: 'FAIL',
            error: 'User not found in database'
          });
        }
      } catch (dbError) {
        TEST_RESULTS.integration.push({
          test: 'Email user creation in database',
          status: 'FAIL',
          error: dbError.message
        });
      }
    } else {
      logTest('Email-based registration with valid data', 'FAIL', {
        email,
        status: result.status,
        error: result.data?.error || 'Unknown error',
        responseTime: result.responseTime
      });
    }
  } catch (error) {
    logTest('Email-based registration with valid data', 'FAIL', {
      error: error.message
    });
  }
  
  // Test 2: Phone-based registration with valid data
  try {
    const phone = generateTestPhone();
    const password = generateStrongPassword();
    const result = await measureResponseTime(async () => {
      return await makeRequest('POST', '/auth/register', {
        phone,
        password,
        confirmPassword: password,
        firstName: 'Test',
        lastName: 'User'
      });
    });
    
    if (result.success && result.status === 201) {
      logTest('Phone-based registration with valid data', 'PASS', {
        phone,
        responseTime: result.responseTime,
        userId: result.data.user?.id,
        requiresPhoneVerification: result.data.requiresPhoneVerification,
        operator: result.data.operator
      });
      
      // Verify user was created in database
      try {
        const dbUser = await prisma.user.findUnique({
          where: { phone }
        });
        
        if (dbUser) {
          TEST_RESULTS.integration.push({
            test: 'Phone user creation in database',
            status: 'PASS',
            userId: dbUser.id,
            phone: dbUser.phone,
            status: dbUser.status
          });
        } else {
          TEST_RESULTS.integration.push({
            test: 'Phone user creation in database',
            status: 'FAIL',
            error: 'User not found in database'
          });
        }
      } catch (dbError) {
        TEST_RESULTS.integration.push({
          test: 'Phone user creation in database',
          status: 'FAIL',
          error: dbError.message
        });
      }
    } else {
      logTest('Phone-based registration with valid data', 'FAIL', {
        phone,
        status: result.status,
        error: result.data?.error || 'Unknown error',
        responseTime: result.responseTime
      });
    }
  } catch (error) {
    logTest('Phone-based registration with valid data', 'FAIL', {
      error: error.message
    });
  }
  
  // Test 3: Property name consistency (using standard firstName/lastName)
  try {
    const email = generateTestEmail();
    const password = generateStrongPassword();
    const result = await measureResponseTime(async () => {
      return await makeRequest('POST', '/auth/register', {
        email,
        password,
        confirmPassword: password,
        firstName: 'Test',
        lastName: 'User'
      });
    });
    
    if (result.success && result.status === 201) {
      logTest('Property name consistency (firstName/lastName)', 'PASS', {
        email,
        responseTime: result.responseTime,
        userId: result.data.user?.id
      });
    } else {
      logTest('Property name consistency (firstName/lastName)', 'FAIL', {
        email,
        status: result.status,
        error: result.data?.error || 'Unknown error',
        responseTime: result.responseTime
      });
    }
  } catch (error) {
    logTest('Property name consistency (firstName/lastName)', 'FAIL', {
      error: error.message
    });
  }
};

const testInvalidDataScenarios = async () => {
  console.log('\n=== Testing Invalid Data Scenarios ===');
  
  // Test 4: Invalid email formats
  const invalidEmails = [
    'invalid-email',
    '@invalid.com',
    'invalid@',
    'invalid..email@example.com',
    'invalid@.com'
  ];
  
  for (const invalidEmail of invalidEmails) {
    try {
      const result = await measureResponseTime(async () => {
        return await makeRequest('POST', '/auth/register', {
          email: invalidEmail,
          password: generateStrongPassword(),
          confirmPassword: generateStrongPassword(),
          firstName: 'Test',
          lastName: 'User'
        });
      });
      
      if (!result.success && result.status === 400) {
        logTest(`Invalid email format: ${invalidEmail}`, 'PASS', {
          expectedStatus: 400,
          actualStatus: result.status,
          error: result.data?.error
        });
      } else {
        logTest(`Invalid email format: ${invalidEmail}`, 'FAIL', {
          expectedStatus: 400,
          actualStatus: result.status,
          error: 'Should reject invalid email format'
        });
      }
    } catch (error) {
      logTest(`Invalid email format: ${invalidEmail}`, 'FAIL', {
        error: error.message
      });
    }
  }
  
  // Test 5: Invalid phone numbers (including non-Bangladesh numbers)
  const invalidPhones = [
    '1234567890', // Invalid format
    '+8801234567890', // Invalid prefix
    '+441234567890', // UK number
    '+11234567890', // US number
    '0171234567', // Too short
    '017123456789' // Too long
  ];
  
  for (const invalidPhone of invalidPhones) {
    try {
      const result = await measureResponseTime(async () => {
        return await makeRequest('POST', '/auth/register', {
          phone: invalidPhone,
          password: generateStrongPassword(),
          confirmPassword: generateStrongPassword(),
          firstName: 'Test',
          lastName: 'User'
        });
      });
      
      if (!result.success && result.status === 400) {
        logTest(`Invalid phone format: ${invalidPhone}`, 'PASS', {
          expectedStatus: 400,
          actualStatus: result.status,
          error: result.data?.error
        });
      } else {
        logTest(`Invalid phone format: ${invalidPhone}`, 'FAIL', {
          expectedStatus: 400,
          actualStatus: result.status,
          error: 'Should reject invalid phone format'
        });
      }
    } catch (error) {
      logTest(`Invalid phone format: ${invalidPhone}`, 'FAIL', {
        error: error.message
      });
    }
  }
  
  // Test 6: Weak passwords
  const weakPasswords = [
    'password',
    '123456',
    'qwerty',
    'abc123',
    'password123',
    '12345678',
    'admin',
    'letmein'
  ];
  
  for (const weakPassword of weakPasswords) {
    try {
      const result = await measureResponseTime(async () => {
        return await makeRequest('POST', '/auth/register', {
          email: generateTestEmail(),
          password: weakPassword,
          confirmPassword: weakPassword,
          firstName: 'Test',
          lastName: 'User'
        });
      });
      
      if (!result.success && result.status === 400) {
        logTest(`Weak password rejection: ${weakPassword}`, 'PASS', {
          expectedStatus: 400,
          actualStatus: result.status,
          error: result.data?.error
        });
      } else {
        logTest(`Weak password rejection: ${weakPassword}`, 'FAIL', {
          expectedStatus: 400,
          actualStatus: result.status,
          error: 'Should reject weak password'
        });
      }
    } catch (error) {
      logTest(`Weak password rejection: ${weakPassword}`, 'FAIL', {
        error: error.message
      });
    }
  }
  
  // Test 7: Missing required fields
  const requiredFields = ['email', 'password', 'confirmPassword', 'firstName', 'lastName'];
  
  for (const field of requiredFields) {
    try {
      const testData = {
        email: generateTestEmail(),
        password: generateStrongPassword(),
        confirmPassword: generateStrongPassword(),
        firstName: 'Test',
        lastName: 'User'
      };
      
      delete testData[field];
      
      const result = await measureResponseTime(async () => {
        return await makeRequest('POST', '/auth/register', testData);
      });
      
      if (!result.success && result.status === 400) {
        logTest(`Missing required field: ${field}`, 'PASS', {
          expectedStatus: 400,
          actualStatus: result.status,
          error: result.data?.error
        });
      } else {
        logTest(`Missing required field: ${field}`, 'FAIL', {
          expectedStatus: 400,
          actualStatus: result.status,
          error: 'Should reject missing required field'
        });
      }
    } catch (error) {
      logTest(`Missing required field: ${field}`, 'FAIL', {
        error: error.message
      });
    }
  }
};

const testBangladeshSpecificFeatures = async () => {
  console.log('\n=== Testing Bangladesh-Specific Features ===');
  
  // Test 8: Bangladesh phone number validation
  const bangladeshPhones = [
    '+8801712345678', // Grameenphone
    '+8801812345678', // Robi
    '+8801912345678', // Banglalink
    '+8801612345678', // Airtel
    '+8801312345678', // Teletalk
    '01712345678', // Local format
    '01812345678'  // Local format
  ];
  
  for (const phone of bangladeshPhones) {
    try {
      const result = await measureResponseTime(async () => {
        return await makeRequest('POST', '/auth/register', {
          phone,
          password: generateStrongPassword(),
          confirmPassword: generateStrongPassword(),
          firstName: 'Test',
          lastName: 'User'
        });
      });
      
      if (result.success && result.status === 201) {
        logTest(`Bangladesh phone validation: ${phone}`, 'PASS', {
          phone,
          responseTime: result.responseTime,
          operator: result.data.operator,
          operatorDetails: result.data.operatorDetails
        });
      } else {
        logTest(`Bangladesh phone validation: ${phone}`, 'FAIL', {
          phone,
          status: result.status,
          error: result.data?.error || 'Unknown error'
        });
      }
    } catch (error) {
      logTest(`Bangladesh phone validation: ${phone}`, 'FAIL', {
        error: error.message
      });
    }
  }
  
  // Test 9: Local operator detection
  try {
    const phone = '+8801712345678'; // Grameenphone
    const result = await measureResponseTime(async () => {
      return await makeRequest('POST', '/auth/register', {
        phone,
        password: generateStrongPassword(),
        confirmPassword: generateStrongPassword(),
        firstName: 'Test',
        lastName: 'User'
      });
    });
    
    if (result.success && result.status === 201) {
      const expectedOperator = 'Grameenphone';
      if (result.data.operator === expectedOperator) {
        logTest('Local operator detection', 'PASS', {
          phone,
          detectedOperator: result.data.operator,
          expectedOperator,
          network: result.data.operatorDetails?.network
        });
      } else {
        logTest('Local operator detection', 'FAIL', {
          phone,
          detectedOperator: result.data.operator,
          expectedOperator,
          error: 'Operator detection failed'
        });
      }
    } else {
      logTest('Local operator detection', 'FAIL', {
        phone,
        status: result.status,
        error: result.data?.error || 'Unknown error'
      });
    }
  } catch (error) {
    logTest('Local operator detection', 'FAIL', {
      error: error.message
    });
  }
  
  // Test 10: Bilingual error messages
  try {
    const invalidPhone = '1234567890';
    const result = await makeRequest('POST', '/auth/register', {
      phone: invalidPhone,
      password: generateStrongPassword(),
      confirmPassword: generateStrongPassword(),
      firstName: 'Test',
      lastName: 'User'
    });
    
    if (!result.success && result.status === 400) {
      const hasBengaliMessage = result.data.messageBn && result.data.messageBn.length > 0;
      if (hasBengaliMessage) {
        logTest('Bilingual error messages', 'PASS', {
          englishMessage: result.data.message,
          bengaliMessage: result.data.messageBn
        });
      } else {
        logTest('Bilingual error messages', 'FAIL', {
          error: 'Bengali error message not provided'
        });
      }
    } else {
      logTest('Bilingual error messages', 'FAIL', {
        error: 'Expected validation error for bilingual message test'
      });
    }
  } catch (error) {
    logTest('Bilingual error messages', 'FAIL', {
      error: error.message
    });
  }
};

const testSecurityFeatures = async () => {
  console.log('\n=== Testing Security Features ===');
  
  // Test 11: Input validation and sanitization
  const xssAttempts = [
    '<script>alert("xss")</script>',
    'javascript:alert("xss")',
    '<img src="x" onerror="alert(1)">',
    '"><script>alert("xss")</script>',
    '\"><script>alert(document.cookie)</script>'
  ];
  
  for (const xssAttempt of xssAttempts) {
    try {
      const result = await measureResponseTime(async () => {
        return await makeRequest('POST', '/auth/register', {
          email: generateTestEmail(),
          password: generateStrongPassword(),
          confirmPassword: generateStrongPassword(),
          firstName: xssAttempt,
          lastName: 'User'
        });
      });
      
      // Check if XSS was sanitized (either accepted with sanitized data or rejected)
      if (result.success && result.status === 201) {
        const sanitizedFirstName = result.data.user?.firstName;
        if (sanitizedFirstName && !sanitizedFirstName.includes('<script>') && !sanitizedFirstName.includes('javascript:')) {
          logTest(`XSS sanitization: ${xssAttempt}`, 'PASS', {
            original: xssAttempt,
            sanitized: sanitizedFirstName
          });
        } else {
          logTest(`XSS sanitization: ${xssAttempt}`, 'FAIL', {
            original: xssAttempt,
            sanitized: sanitizedFirstName,
            error: 'XSS not properly sanitized'
          });
          
          TEST_RESULTS.security.push({
            test: 'XSS Prevention',
            status: 'FAIL',
            payload: xssAttempt,
            result: sanitizedFirstName
          });
        }
      } else {
        // Rejection is also acceptable for security
        logTest(`XSS sanitization: ${xssAttempt}`, 'PASS', {
          original: xssAttempt,
          status: result.status,
          error: result.data?.error,
          note: 'XSS attempt rejected'
        });
      }
    } catch (error) {
      logTest(`XSS sanitization: ${xssAttempt}`, 'FAIL', {
        error: error.message
      });
    }
  }
  
  // Test 12: Rate limiting
  const email = generateTestEmail();
  const rapidRequests = [];
  
  for (let i = 0; i < 10; i++) {
    try {
      const result = await measureResponseTime(async () => {
        return await makeRequest('POST', '/auth/register', {
          email,
          password: generateStrongPassword(),
          confirmPassword: generateStrongPassword(),
          firstName: `Test${i}`,
          lastName: 'User'
        });
      });
      
      rapidRequests.push({
        attempt: i + 1,
        status: result.status,
        success: result.success,
        error: result.data?.error
      });
    } catch (error) {
      rapidRequests.push({
        attempt: i + 1,
        error: error.message
      });
    }
  }
  
  // Check if rate limiting kicked in (should see some 429 responses)
  const rateLimitedRequests = rapidRequests.filter(req => req.status === 429);
  if (rateLimitedRequests.length > 0) {
    logTest('Rate limiting', 'PASS', {
      totalRequests: rapidRequests.length,
      rateLimitedRequests: rateLimitedRequests.length,
      note: 'Rate limiting is working'
    });
  } else {
    logTest('Rate limiting', 'FAIL', {
      totalRequests: rapidRequests.length,
      rateLimitedRequests: rateLimitedRequests.length,
      error: 'Rate limiting not detected'
    });
  }
  
  TEST_RESULTS.security.push({
    test: 'Rate Limiting',
    status: rateLimitedRequests.length > 0 ? 'PASS' : 'FAIL',
    totalRequests: rapidRequests.length,
    rateLimitedRequests: rateLimitedRequests.length
  });
  
  // Test 13: Password strength requirements
  const weakPasswordAttempts = [
    '123', // Too short
    'password', // No numbers, no special chars
    '12345678', // No letters, no special chars
    'PASSWORD', // No numbers, no special chars, no lowercase
    'password123', // No special chars, no uppercase
    'PASSWORD123', // No special chars, no lowercase
    'Pass123', // Too short, no special chars
    'Password!', // No numbers
    'Password123' // No special chars
  ];
  
  for (const weakPassword of weakPasswordAttempts) {
    try {
      const result = await measureResponseTime(async () => {
        return await makeRequest('POST', '/auth/register', {
          email: generateTestEmail(),
          password: weakPassword,
          confirmPassword: weakPassword,
          firstName: 'Test',
          lastName: 'User'
        });
      });
      
      if (!result.success && result.status === 400) {
        logTest(`Password strength validation: ${weakPassword}`, 'PASS', {
          password: weakPassword,
          expectedStatus: 400,
          actualStatus: result.status,
          error: result.data?.error
        });
      } else {
        logTest(`Password strength validation: ${weakPassword}`, 'FAIL', {
          password: weakPassword,
          expectedStatus: 400,
          actualStatus: result.status,
          error: 'Weak password should be rejected'
        });
      }
    } catch (error) {
      logTest(`Password strength validation: ${weakPassword}`, 'FAIL', {
        error: error.message
      });
    }
  }
};

const testVerificationWorkflows = async () => {
  console.log('\n=== Testing Verification Workflows ===');
  
  // Test 14: Email verification token generation
  try {
    const email = generateTestEmail();
    const password = generateStrongPassword();
    const registerResult = await makeRequest('POST', '/auth/register', {
      email,
      password,
      confirmPassword: password,
      firstName: 'Test',
      lastName: 'User'
    });
    
    if (registerResult.success && registerResult.status === 201) {
      // Check if verification token was created
      try {
        const verificationToken = await prisma.emailVerificationToken.findFirst({
          where: {
            userId: registerResult.data.user.id
          },
          orderBy: {
            createdAt: 'desc'
          }
        });
        
        if (verificationToken) {
          logTest('Email verification token generation', 'PASS', {
            email,
            userId: registerResult.data.user.id,
            tokenId: verificationToken.id,
            expiresAt: verificationToken.expiresAt
          });
        } else {
          logTest('Email verification token generation', 'FAIL', {
            email,
            userId: registerResult.data.user.id,
            error: 'Verification token not found in database'
          });
        }
      } catch (dbError) {
        logTest('Email verification token generation', 'FAIL', {
          email,
          error: dbError.message
        });
      }
    } else {
      logTest('Email verification token generation', 'FAIL', {
        email,
        status: registerResult.status,
        error: registerResult.data?.error || 'Registration failed'
      });
    }
  } catch (error) {
    logTest('Email verification token generation', 'FAIL', {
      error: error.message
    });
  }
  
  // Test 15: OTP generation for phone verification
  try {
    const phone = generateTestPhone();
    const password = generateStrongPassword();
    const registerResult = await makeRequest('POST', '/auth/register', {
      phone,
      password,
      confirmPassword: password,
      firstName: 'Test',
      lastName: 'User'
    });
    
    if (registerResult.success && registerResult.status === 201) {
      // Check if OTP was created
      try {
        const phoneOTP = await prisma.phoneOTP.findFirst({
          where: {
            userId: registerResult.data.user.id
          },
          orderBy: {
            createdAt: 'desc'
          }
        });
        
        if (phoneOTP) {
          logTest('OTP generation for phone verification', 'PASS', {
            phone,
            userId: registerResult.data.user.id,
            otpId: phoneOTP.id,
            expiresAt: phoneOTP.expiresAt
          });
        } else {
          logTest('OTP generation for phone verification', 'FAIL', {
            phone,
            userId: registerResult.data.user.id,
            error: 'OTP not found in database'
          });
        }
      } catch (dbError) {
        logTest('OTP generation for phone verification', 'FAIL', {
          phone,
          error: dbError.message
        });
      }
    } else {
      logTest('OTP generation for phone verification', 'FAIL', {
        phone,
        status: registerResult.status,
        error: registerResult.data?.error || 'Registration failed'
      });
    }
  } catch (error) {
    logTest('OTP generation for phone verification', 'FAIL', {
      error: error.message
    });
  }
  
  // Test 16: Verification endpoint functionality
  try {
    // First register a user
    const email = generateTestEmail();
    const password = generateStrongPassword();
    const registerResult = await makeRequest('POST', '/auth/register', {
      email,
      password,
      confirmPassword: password,
      firstName: 'Test',
      lastName: 'User'
    });
    
    if (registerResult.success && registerResult.status === 201) {
      // Get the verification token
      const verificationToken = await prisma.emailVerificationToken.findFirst({
        where: {
          userId: registerResult.data.user.id
        },
        orderBy: {
          createdAt: 'desc'
        }
      });
      
      if (verificationToken) {
        // Test verification endpoint
        const verifyResult = await measureResponseTime(async () => {
          return await makeRequest('POST', '/auth/verify-email', {
            token: verificationToken.token
          });
        });
        
        if (verifyResult.success && verifyResult.status === 200) {
          logTest('Email verification endpoint functionality', 'PASS', {
            email,
            userId: registerResult.data.user.id,
            responseTime: verifyResult.responseTime
          });
        } else {
          logTest('Email verification endpoint functionality', 'FAIL', {
            email,
            status: verifyResult.status,
            error: verifyResult.data?.error || 'Unknown error'
          });
        }
      } else {
        logTest('Email verification endpoint functionality', 'FAIL', {
          email,
          error: 'Verification token not found'
        });
      }
    } else {
      logTest('Email verification endpoint functionality', 'FAIL', {
        email,
        status: registerResult.status,
        error: registerResult.data?.error || 'Registration failed'
      });
    }
  } catch (error) {
    logTest('Email verification endpoint functionality', 'FAIL', {
      error: error.message
    });
  }
};

const testDatabaseIntegration = async () => {
  console.log('\n=== Testing Database Integration ===');
  
  // Test 17: User creation in database
  try {
    const email = generateTestEmail();
    const password = generateStrongPassword();
    const registerResult = await makeRequest('POST', '/auth/register', {
      email,
      password,
      confirmPassword: password,
      firstName: 'Test',
      lastName: 'User'
    });
    
    if (registerResult.success && registerResult.status === 201) {
      // Verify user was created with correct data
      try {
        const dbUser = await prisma.user.findUnique({
          where: { email }
        });
        
        if (dbUser) {
          const dataIntegrity = {
            emailMatch: dbUser.email === email,
            firstNameMatch: dbUser.firstName === 'Test',
            lastNameMatch: dbUser.lastName === 'User',
            roleMatch: dbUser.role === 'CUSTOMER',
            statusMatch: dbUser.status === 'PENDING' || dbUser.status === 'ACTIVE',
            hasPassword: !!dbUser.password,
            hasId: !!dbUser.id
          };
          
          const allChecksPass = Object.values(dataIntegrity).every(check => check === true);
          
          if (allChecksPass) {
            logTest('User creation in database', 'PASS', {
              email,
              userId: dbUser.id,
              dataIntegrity
            });
          } else {
            logTest('User creation in database', 'FAIL', {
              email,
              userId: dbUser.id,
              dataIntegrity,
              error: 'Data integrity check failed'
            });
          }
        } else {
          logTest('User creation in database', 'FAIL', {
            email,
            error: 'User not found in database'
          });
        }
      } catch (dbError) {
        logTest('User creation in database', 'FAIL', {
          email,
          error: dbError.message
        });
      }
    } else {
      logTest('User creation in database', 'FAIL', {
        email,
        status: registerResult.status,
        error: registerResult.data?.error || 'Registration failed'
      });
    }
  } catch (error) {
    logTest('User creation in database', 'FAIL', {
      error: error.message
    });
  }
  
  // Test 18: Proper data storage
  try {
    const phone = generateTestPhone();
    const password = generateStrongPassword();
    const registerResult = await makeRequest('POST', '/auth/register', {
      phone,
      password,
      confirmPassword: password,
      firstName: 'Test',
      lastName: 'User'
    });
    
    if (registerResult.success && registerResult.status === 201) {
      // Verify phone was stored in normalized format
      try {
        const dbUser = await prisma.user.findUnique({
          where: { phone }
        });
        
        if (dbUser) {
          const phoneNormalization = {
            phoneStored: !!dbUser.phone,
            phoneNormalized: dbUser.phone.startsWith('+880'),
            phoneMatch: dbUser.phone === phone
          };
          
          if (phoneNormalization.phoneStored && phoneNormalization.phoneNormalized) {
            logTest('Proper phone data storage', 'PASS', {
              originalPhone: phone,
              storedPhone: dbUser.phone,
              phoneNormalization
            });
          } else {
            logTest('Proper phone data storage', 'FAIL', {
              originalPhone: phone,
              storedPhone: dbUser.phone,
              phoneNormalization,
              error: 'Phone not properly normalized'
            });
          }
        } else {
          logTest('Proper phone data storage', 'FAIL', {
            phone,
            error: 'User not found in database'
          });
        }
      } catch (dbError) {
        logTest('Proper phone data storage', 'FAIL', {
          phone,
          error: dbError.message
        });
      }
    } else {
      logTest('Proper phone data storage', 'FAIL', {
        phone,
        status: registerResult.status,
        error: registerResult.data?.error || 'Registration failed'
      });
    }
  } catch (error) {
    logTest('Proper phone data storage', 'FAIL', {
      error: error.message
    });
  }
  
  // Test 19: Relationship integrity
  try {
    const email = generateTestEmail();
    const password = generateStrongPassword();
    const registerResult = await makeRequest('POST', '/auth/register', {
      email,
      password,
      confirmPassword: password,
      firstName: 'Test',
      lastName: 'User'
    });
    
    if (registerResult.success && registerResult.status === 201) {
      // Check if related records were created properly
      try {
        const userId = registerResult.data.user.id;
        
        const [emailToken, passwordHistory] = await Promise.all([
          prisma.emailVerificationToken.findFirst({
            where: { userId }
          }),
          prisma.passwordHistory.findFirst({
            where: { userId }
          })
        ]);
        
        const relationshipIntegrity = {
          userCreated: !!userId,
          emailTokenCreated: !!emailToken,
          passwordHistoryCreated: !!passwordHistory,
          correctUserReference: emailToken?.userId === userId && passwordHistory?.userId === userId
        };
        
        const allChecksPass = Object.values(relationshipIntegrity).every(check => check === true);
        
        if (allChecksPass) {
          logTest('Relationship integrity', 'PASS', {
            userId,
            relationshipIntegrity
          });
        } else {
          logTest('Relationship integrity', 'FAIL', {
            userId,
            relationshipIntegrity,
            error: 'Relationship integrity check failed'
          });
        }
      } catch (dbError) {
        logTest('Relationship integrity', 'FAIL', {
          error: dbError.message
        });
      }
    } else {
      logTest('Relationship integrity', 'FAIL', {
        status: registerResult.status,
        error: registerResult.data?.error || 'Registration failed'
      });
    }
  } catch (error) {
    logTest('Relationship integrity', 'FAIL', {
      error: error.message
    });
  }
};

const testErrorHandling = async () => {
  console.log('\n=== Testing Error Handling ===');
  
  // Test 20: Proper error responses
  try {
    const result = await measureResponseTime(async () => {
      return await makeRequest('POST', '/auth/register', {
        email: 'invalid-email',
        password: generateStrongPassword(),
        confirmPassword: generateStrongPassword(),
        firstName: 'Test',
        lastName: 'User'
      });
    });
    
    if (!result.success && result.status === 400) {
      const hasProperErrorResponse = 
        result.data &&
        typeof result.data.error === 'string' &&
        result.data.error.length > 0;
      
      if (hasProperErrorResponse) {
        logTest('Proper error responses', 'PASS', {
          status: result.status,
          error: result.data.error,
          message: result.data.message,
          messageBn: result.data.messageBn
        });
      } else {
        logTest('Proper error responses', 'FAIL', {
          status: result.status,
          error: 'Invalid error response format'
        });
      }
    } else {
      logTest('Proper error responses', 'FAIL', {
        status: result.status,
        error: 'Expected 400 status for invalid data'
      });
    }
  } catch (error) {
    logTest('Proper error responses', 'FAIL', {
      error: error.message
    });
  }
  
  // Test 21: Appropriate HTTP status codes
  const testCases = [
    {
      name: 'Invalid email format',
      data: { email: 'invalid-email' },
      expectedStatus: 400
    },
    {
      name: 'Missing required field',
      data: { email: 'test@example.com' },
      expectedStatus: 400
    },
    {
      name: 'Password mismatch',
      data: {
        email: 'test@example.com',
        password: 'password123',
        confirmPassword: 'different123',
        firstName: 'Test',
        lastName: 'User'
      },
      expectedStatus: 400
    },
    {
      name: 'Duplicate email',
      data: {
        email: 'duplicate@test.com',
        password: 'password123',
        confirmPassword: 'password123',
        firstName: 'Test',
        lastName: 'User'
      },
      expectedStatus: 409
    }
  ];
  
  for (const testCase of testCases) {
    try {
      const result = await measureResponseTime(async () => {
        return await makeRequest('POST', '/auth/register', {
          password: generateStrongPassword(),
          confirmPassword: generateStrongPassword(),
          firstName: 'Test',
          lastName: 'User',
          ...testCase.data
        });
      });
      
      if (result.status === testCase.expectedStatus) {
        logTest(`HTTP status code: ${testCase.name}`, 'PASS', {
          expected: testCase.expectedStatus,
          actual: result.status,
          error: result.data?.error
        });
      } else {
        logTest(`HTTP status code: ${testCase.name}`, 'FAIL', {
          expected: testCase.expectedStatus,
          actual: result.status,
          error: result.data?.error || 'Unknown error'
        });
      }
    } catch (error) {
      logTest(`HTTP status code: ${testCase.name}`, 'FAIL', {
        error: error.message
      });
    }
  }
  
  // Test 22: Error message clarity
  try {
    const result = await makeRequest('POST', '/auth/register', {
      email: 'invalid-email-format',
      password: generateStrongPassword(),
      confirmPassword: generateStrongPassword(),
      firstName: 'Test',
      lastName: 'User'
    });
    
    if (!result.success && result.status === 400) {
      const hasClearMessage = 
        result.data &&
        result.data.error &&
        result.data.error.toLowerCase().includes('email');
      
      if (hasClearMessage) {
        logTest('Error message clarity', 'PASS', {
          error: result.data.error,
          message: result.data.message,
          messageBn: result.data.messageBn
        });
      } else {
        logTest('Error message clarity', 'FAIL', {
          error: result.data.error,
          expected: 'Clear error message about email format'
        });
      }
    } else {
      logTest('Error message clarity', 'FAIL', {
        error: 'Expected validation error for clarity test'
      });
    }
  } catch (error) {
    logTest('Error message clarity', 'FAIL', {
      error: error.message
    });
  }
};

const testDuplicateRegistration = async () => {
  console.log('\n=== Testing Duplicate Registration Prevention ===');
  
  // Test 23: Duplicate email registration attempts
  try {
    const email = generateTestEmail();
    const password = generateStrongPassword();
    
    // First registration
    const firstResult = await makeRequest('POST', '/auth/register', {
      email,
      password,
      confirmPassword: password,
      firstName: 'Test',
      lastName: 'User'
    });
    
    if (firstResult.success && firstResult.status === 201) {
      // Second registration with same email
      const secondResult = await measureResponseTime(async () => {
        return await makeRequest('POST', '/auth/register', {
          email,
          password: generateStrongPassword(),
          confirmPassword: generateStrongPassword(),
          firstName: 'Test2',
          lastName: 'User2'
        });
      });
      
      if (!secondResult.success && secondResult.status === 409) {
        logTest('Duplicate email registration prevention', 'PASS', {
          email,
          firstStatus: firstResult.status,
          secondStatus: secondResult.status,
          error: secondResult.data?.error
        });
      } else {
        logTest('Duplicate email registration prevention', 'FAIL', {
          email,
          firstStatus: firstResult.status,
          secondStatus: secondResult.status,
          error: 'Should prevent duplicate email registration'
        });
      }
    } else {
      logTest('Duplicate email registration prevention', 'FAIL', {
        email,
        status: firstResult.status,
        error: 'First registration failed'
      });
    }
  } catch (error) {
    logTest('Duplicate email registration prevention', 'FAIL', {
      error: error.message
    });
  }
  
  // Test 24: Duplicate phone registration attempts
  try {
    const phone = generateTestPhone();
    const password = generateStrongPassword();
    
    // First registration
    const firstResult = await makeRequest('POST', '/auth/register', {
      phone,
      password,
      confirmPassword: password,
      firstName: 'Test',
      lastName: 'User'
    });
    
    if (firstResult.success && firstResult.status === 201) {
      // Second registration with same phone
      const secondResult = await measureResponseTime(async () => {
        return await makeRequest('POST', '/auth/register', {
          phone,
          password: generateStrongPassword(),
          confirmPassword: generateStrongPassword(),
          firstName: 'Test2',
          lastName: 'User2'
        });
      });
      
      if (!secondResult.success && secondResult.status === 409) {
        logTest('Duplicate phone registration prevention', 'PASS', {
          phone,
          firstStatus: firstResult.status,
          secondStatus: secondResult.status,
          error: secondResult.data?.error
        });
      } else {
        logTest('Duplicate phone registration prevention', 'FAIL', {
          phone,
          firstStatus: firstResult.status,
          secondStatus: secondResult.status,
          error: 'Should prevent duplicate phone registration'
        });
      }
    } else {
      logTest('Duplicate phone registration prevention', 'FAIL', {
        phone,
        status: firstResult.status,
        error: 'First registration failed'
      });
    }
  } catch (error) {
    logTest('Duplicate phone registration prevention', 'FAIL', {
      error: error.message
    });
  }
};

// Generate comprehensive test report
const generateTestReport = () => {
  const report = {
    summary: {
      total: TEST_RESULTS.total,
      passed: TEST_RESULTS.passed,
      failed: TEST_RESULTS.failed,
      passRate: `${((TEST_RESULTS.passed / TEST_RESULTS.total) * 100).toFixed(2)}%`
    },
    performance: {
      averageResponseTime: TEST_RESULTS.performance.length > 0 
        ? Math.round(TEST_RESULTS.performance.reduce((sum, test) => sum + test.responseTime, 0) / TEST_RESULTS.performance.length)
        : 0,
      slowestTest: TEST_RESULTS.performance.length > 0
        ? Math.max(...TEST_RESULTS.performance.map(test => test.responseTime))
        : 0,
      fastestTest: TEST_RESULTS.performance.length > 0
        ? Math.min(...TEST_RESULTS.performance.map(test => test.responseTime))
        : 0
    },
    security: TEST_RESULTS.security,
    integration: TEST_RESULTS.integration,
    detailedResults: TEST_RESULTS.details,
    timestamp: new Date().toISOString()
  };
  
  return report;
};

// Main test execution function
const runComprehensiveTests = async () => {
  console.log('🚀 Starting Comprehensive Registration API Tests');
  console.log('================================================');
  
  try {
    await testValidRegistrationScenarios();
    await testInvalidDataScenarios();
    await testBangladeshSpecificFeatures();
    await testSecurityFeatures();
    await testVerificationWorkflows();
    await testDatabaseIntegration();
    await testErrorHandling();
    await testDuplicateRegistration();
    
    const report = generateTestReport();
    
    console.log('\n================================================');
    console.log('📊 COMPREHENSIVE TEST REPORT');
    console.log('================================================');
    console.log(`Total Tests: ${report.summary.total}`);
    console.log(`Passed: ${report.summary.passed}`);
    console.log(`Failed: ${report.summary.failed}`);
    console.log(`Pass Rate: ${report.summary.passRate}`);
    console.log(`Average Response Time: ${report.performance.averageResponseTime}ms`);
    console.log(`Slowest Test: ${report.performance.slowestTest}ms`);
    console.log(`Fastest Test: ${report.performance.fastestTest}ms`);
    
    // Write detailed report to file
    const reportFileName = `registration-test-report-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
    require('fs').writeFileSync(reportFileName, JSON.stringify(report, null, 2));
    console.log(`\n📄 Detailed report saved to: ${reportFileName}`);
    
    return report;
  } catch (error) {
    console.error('Test execution failed:', error);
