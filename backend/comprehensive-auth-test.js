const axios = require('axios');
const crypto = require('crypto');

// Test configuration
const BASE_URL = 'http://localhost:3001/api/v1';
let testResults = [];
let testCounter = 0;

// Test data
const testUsers = {
  emailUser: {
    email: 'testuser@example.com',
    password: 'TestPass123!@#',
    firstName: 'Test',
    lastName: 'User',
    phone: '+8801712345678'
  },
  phoneUser: {
    phone: '+8801712345679',
    password: 'PhonePass456!@#',
    firstName: 'Phone',
    lastName: 'User',
    email: 'phoneuser@example.com'
  }
};

// Utility functions
function logTest(testName, status, details = '', error = null) {
  testCounter++;
  const result = {
    testNumber: testCounter,
    testName,
    status,
    details,
    error: error ? error.message : null,
    timestamp: new Date().toISOString()
  };
  testResults.push(result);
  
  const statusIcon = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : '⚠️';
  console.log(`${statusIcon} Test ${testCounter}: ${testName} - ${status}`);
  if (details) console.log(`   Details: ${details}`);
  if (error) console.log(`   Error: ${error.message}`);
}

async function makeRequest(method, endpoint, data = null, headers = {}) {
  try {
    const config = {
      method,
      url: `${BASE_URL}${endpoint}`,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };
    
    if (data) {
      config.data = data;
    }
    
    const response = await axios(config);
    return { success: true, data: response.data, status: response.status, headers: response.headers };
  } catch (error) {
    return { 
      success: false, 
      error: error.response ? error.response.data : error, 
      status: error.response ? error.response.status : null 
    };
  }
}

// Test functions
async function testServerHealth() {
  console.log('\n🔍 Testing Server Health...');
  const result = await makeRequest('GET', '/health');
  if (result.success && result.status === 200) {
    logTest('Server Health Check', 'PASS', 'Server is responding');
  } else {
    logTest('Server Health Check', 'FAIL', 'Server not responding', result.error);
  }
}

async function testEmailRegistration() {
  console.log('\n📧 Testing Email Registration...');
  const result = await makeRequest('POST', '/auth/register', testUsers.emailUser);
  
  if (result.success) {
    if (result.status === 201) {
      logTest('Email Registration', 'PASS', 'User created successfully', null);
      return result.data;
    } else if (result.status === 400) {
      logTest('Email Registration', 'PARTIAL', 'Validation error - expected in testing mode', result.error);
    } else {
      logTest('Email Registration', 'FAIL', `Unexpected status: ${result.status}`, result.error);
    }
  } else {
    logTest('Email Registration', 'FAIL', 'Request failed', result.error);
  }
  return null;
}

async function testPhoneRegistration() {
  console.log('\n📱 Testing Phone Registration...');
  const result = await makeRequest('POST', '/auth/register', testUsers.phoneUser);
  
  if (result.success) {
    if (result.status === 201) {
      logTest('Phone Registration', 'PASS', 'User created successfully', null);
      return result.data;
    } else if (result.status === 400) {
      logTest('Phone Registration', 'PARTIAL', 'Validation error - expected in testing mode', result.error);
    } else {
      logTest('Phone Registration', 'FAIL', `Unexpected status: ${result.status}`, result.error);
    }
  } else {
    logTest('Phone Registration', 'FAIL', 'Request failed', result.error);
  }
  return null;
}

async function testEmailLogin(userData) {
  console.log('\n🔐 Testing Email Login...');
  const result = await makeRequest('POST', '/auth/login', {
    identifier: userData.email,
    password: userData.password,
    rememberMe: false
  });
  
  if (result.success) {
    if (result.status === 200) {
      logTest('Email Login', 'PASS', 'Login successful', null);
      return result.data;
    } else if (result.status === 401) {
      logTest('Email Login', 'PARTIAL', 'Invalid credentials - expected for testing', result.error);
    } else if (result.status === 403) {
      logTest('Email Login', 'PARTIAL', 'Account not verified - expected in testing', result.error);
    } else {
      logTest('Email Login', 'FAIL', `Unexpected status: ${result.status}`, result.error);
    }
  } else {
    logTest('Email Login', 'FAIL', 'Request failed', result.error);
  }
  return null;
}

async function testPhoneLogin(userData) {
  console.log('\n📱🔐 Testing Phone Login...');
  const result = await makeRequest('POST', '/auth/login', {
    identifier: userData.phone,
    password: userData.password,
    rememberMe: false
  });
  
  if (result.success) {
    if (result.status === 200) {
      logTest('Phone Login', 'PASS', 'Login successful', null);
      return result.data;
    } else if (result.status === 401) {
      logTest('Phone Login', 'PARTIAL', 'Invalid credentials - expected for testing', result.error);
    } else if (result.status === 403) {
      logTest('Phone Login', 'PARTIAL', 'Account not verified - expected in testing', result.error);
    } else {
      logTest('Phone Login', 'FAIL', `Unexpected status: ${result.status}`, result.error);
    }
  } else {
    logTest('Phone Login', 'FAIL', 'Request failed', result.error);
  }
  return null;
}

async function testPasswordPolicy() {
  console.log('\n🔒 Testing Password Policy...');
  const result = await makeRequest('GET', '/auth/password-policy');
  
  if (result.success && result.status === 200) {
    logTest('Password Policy', 'PASS', 'Password policy retrieved successfully');
    return result.data;
  } else {
    logTest('Password Policy', 'FAIL', 'Failed to get password policy', result.error);
  }
  return null;
}

async function testPhoneValidation() {
  console.log('\n📱 Testing Phone Validation...');
  const result = await makeRequest('POST', '/auth/validate-phone', {
    phone: '+8801712345678'
  });
  
  if (result.success && result.status === 200) {
    logTest('Phone Validation', 'PASS', 'Phone validation working');
    return result.data;
  } else {
    logTest('Phone Validation', 'FAIL', 'Phone validation failed', result.error);
  }
  return null;
}

async function testGetOperators() {
  console.log('\n📡 Testing Get Operators...');
  const result = await makeRequest('GET', '/auth/operators');
  
  if (result.success && result.status === 200) {
    logTest('Get Operators', 'PASS', 'Operators retrieved successfully');
    return result.data;
  } else {
    logTest('Get Operators', 'FAIL', 'Failed to get operators', result.error);
  }
  return null;
}

async function testLogout(sessionId) {
  console.log('\n🚪 Testing Logout...');
  const result = await makeRequest('POST', '/auth/logout', {}, {
    'Cookie': `sessionId=${sessionId}`
  });
  
  if (result.success) {
    if (result.status === 200) {
      logTest('Logout', 'PASS', 'Logout successful');
    } else {
      logTest('Logout', 'FAIL', `Unexpected status: ${result.status}`, result.error);
    }
  } else {
    logTest('Logout', 'FAIL', 'Request failed', result.error);
  }
}

async function testInvalidCredentials() {
  console.log('\n🚫 Testing Invalid Credentials...');
  const result = await makeRequest('POST', '/auth/login', {
    identifier: 'invalid@example.com',
    password: 'wrongpassword'
  });
  
  if (result.success) {
    if (result.status === 401) {
      logTest('Invalid Credentials', 'PASS', 'Properly rejected invalid credentials');
    } else {
      logTest('Invalid Credentials', 'FAIL', 'Should have rejected invalid credentials', result.error);
    }
  } else {
    logTest('Invalid Credentials', 'FAIL', 'Request failed', result.error);
  }
}

async function testWeakPassword() {
  console.log('\n🔓 Testing Weak Password...');
  const result = await makeRequest('POST', '/auth/register', {
    email: 'weak@example.com',
    password: '123',
    firstName: 'Weak',
    lastName: 'Password',
    phone: '+8801712345670'
  });
  
  if (result.success) {
    if (result.status === 400) {
      logTest('Weak Password', 'PASS', 'Properly rejected weak password');
    } else {
      logTest('Weak Password', 'FAIL', 'Should have rejected weak password', result.error);
    }
  } else {
    logTest('Weak Password', 'FAIL', 'Request failed', result.error);
  }
}

async function testInvalidEmail() {
  console.log('\n📧 Testing Invalid Email...');
  const result = await makeRequest('POST', '/auth/register', {
    email: 'invalid-email',
    password: 'ValidPass123!@#',
    firstName: 'Invalid',
    lastName: 'Email',
    phone: '+8801712345671'
  });
  
  if (result.success) {
    if (result.status === 400) {
      logTest('Invalid Email', 'PASS', 'Properly rejected invalid email');
    } else {
      logTest('Invalid Email', 'FAIL', 'Should have rejected invalid email', result.error);
    }
  } else {
    logTest('Invalid Email', 'FAIL', 'Request failed', result.error);
  }
}

async function testInvalidPhone() {
  console.log('\n📱 Testing Invalid Phone...');
  const result = await makeRequest('POST', '/auth/register', {
    email: 'invalidphone@example.com',
    password: 'ValidPass123!@#',
    firstName: 'Invalid',
    lastName: 'Phone',
    phone: '123'
  });
  
  if (result.success) {
    if (result.status === 400) {
      logTest('Invalid Phone', 'PASS', 'Properly rejected invalid phone');
    } else {
      logTest('Invalid Phone', 'FAIL', 'Should have rejected invalid phone', result.error);
    }
  } else {
    logTest('Invalid Phone', 'FAIL', 'Request failed', result.error);
  }
}

// Main test execution
async function runTests() {
  console.log('🚀 Starting Comprehensive Authentication Tests\n');
  console.log('=====================================');
  
  try {
    // Basic connectivity test
    await testServerHealth();
    
    // Test password policy first
    const passwordPolicy = await testPasswordPolicy();
    
    // Test phone validation
    const phoneValidation = await testPhoneValidation();
    
    // Test operators endpoint
    const operators = await testGetOperators();
    
    // Test registration
    const emailRegResult = await testEmailRegistration();
    const phoneRegResult = await testPhoneRegistration();
    
    // Test login with registered users
    if (emailRegResult && emailRegResult.user) {
      await testEmailLogin(emailRegResult.user);
    }
    
    if (phoneRegResult && phoneRegResult.user) {
      await testPhoneLogin(phoneRegResult.user);
    }
    
    // Test security features
    await testInvalidCredentials();
    await testWeakPassword();
    await testInvalidEmail();
    await testInvalidPhone();
    
  } catch (error) {
    console.error('Test execution error:', error);
    logTest('Test Execution', 'FAIL', 'Unexpected error during testing', error);
  }
  
  // Generate report
  generateReport();
}

function generateReport() {
  console.log('\n📊 TEST REPORT');
  console.log('================');
  
  const passed = testResults.filter(r => r.status === 'PASS').length;
  const failed = testResults.filter(r => r.status === 'FAIL').length;
  const partial = testResults.filter(r => r.status === 'PARTIAL').length;
  
  console.log(`Total Tests: ${testResults.length}`);
  console.log(`✅ Passed: ${passed}`);
  console.log(`⚠️  Partial: ${partial}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`Success Rate: ${((passed / testResults.length) * 100).toFixed(1)}%`);
  
  // Categorize issues
  const criticalIssues = testResults.filter(r => r.status === 'FAIL' && 
    (r.testName.includes('Server') || r.testName.includes('Registration'))
  );
  
  const majorIssues = testResults.filter(r => r.status === 'FAIL' && 
    (r.testName.includes('Login') || r.testName.includes('Password'))
  );
  
  const minorIssues = testResults.filter(r => r.status === 'FAIL' && 
    (r.testName.includes('Validation') || r.testName.includes('Invalid'))
  );
  
  console.log('\n📋 ISSUE CATEGORIZATION:');
  console.log(`🔴 Critical Issues: ${criticalIssues.length}`);
  console.log(`🟡 Major Issues: ${majorIssues.length}`);
  console.log(`🟡 Minor Issues: ${minorIssues.length}`);
  
  // Save detailed report
  const report = {
    summary: {
      total: testResults.length,
      passed,
      failed,
      partial,
      successRate: ((passed / testResults.length) * 100).toFixed(1)
    },
    categories: {
      critical: criticalIssues.length,
      major: majorIssues.length,
      minor: minorIssues.length
    },
    details: testResults,
    timestamp: new Date().toISOString()
  };
  
  require('fs').writeFileSync(
    './auth-test-results.json', 
    JSON.stringify(report, null, 2)
  );
  
  console.log('\n💾 Detailed report saved to auth-test-results.json');
}

// Run tests
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = {
  runTests,
  testResults
};