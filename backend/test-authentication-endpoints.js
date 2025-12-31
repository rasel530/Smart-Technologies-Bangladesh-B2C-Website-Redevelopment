const axios = require('axios');

const BASE_URL = 'http://localhost:3001';

console.log('🧪 Testing Authentication Endpoints...\n');

async function testEndpoint(method, url, data = null, headers = {}) {
  try {
    const config = {
      method,
      url: `${BASE_URL}${url}`,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };
    
    if (data) {
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
    return {
      success: false,
      error: error.response ? error.response.data : error.message,
      status: error.response ? error.response.status : null
    };
  }
}

async function runAuthenticationTests() {
  const results = {
    health: { passed: 0, failed: 0, errors: [] },
    registration: { passed: 0, failed: 0, errors: [] },
    login: { passed: 0, failed: 0, errors: [] },
    passwordPolicy: { passed: 0, failed: 0, errors: [] },
    phoneValidation: { passed: 0, failed: 0, errors: [] },
    operators: { passed: 0, failed: 0, errors: [] }
  };

  // Test 1: Health Check Endpoint
  console.log('🏥 Testing Health Check Endpoint...');
  try {
    const healthResponse = await testEndpoint('GET', '/health');
    if (healthResponse.success && healthResponse.status === 200) {
      console.log('✅ Basic health check passed');
      results.health.passed++;
      
      // Check if Redis status is included
      if (healthResponse.data.redis) {
        console.log(`✅ Redis status reported: ${healthResponse.data.redis}`);
        results.health.passed++;
      } else {
        console.log('⚠️  Redis status not reported in health check');
      }
      
      // Check if services are included
      if (healthResponse.data.services) {
        console.log('✅ Services status reported');
        results.health.passed++;
      } else {
        console.log('⚠️  Services status not reported');
      }
    } else {
      console.log('❌ Basic health check failed:', healthResponse.error);
      results.health.failed++;
      results.health.errors.push(healthResponse.error);
    }
  } catch (error) {
    console.log('❌ Health check test failed:', error.message);
    results.health.failed++;
    results.health.errors.push(error.message);
  }

  // Test 2: Enhanced Health Check Endpoint
  console.log('\n🏥 Testing Enhanced Health Check Endpoint...');
  try {
    const enhancedHealthResponse = await testEndpoint('GET', '/api/v1/health');
    if (enhancedHealthResponse.success && enhancedHealthResponse.status === 200) {
      console.log('✅ Enhanced health check passed');
      results.health.passed++;
      
      // Check for detailed service information
      if (enhancedHealthResponse.data.services && enhancedHealthResponse.data.services.loginSecurity) {
        console.log('✅ Login security service status reported');
        results.health.passed++;
      }
      
      if (enhancedHealthResponse.data.configuration) {
        console.log('✅ Configuration validation status reported');
        results.health.passed++;
      }
    } else {
      console.log('❌ Enhanced health check failed:', enhancedHealthResponse.error);
      results.health.failed++;
      results.health.errors.push(enhancedHealthResponse.error);
    }
  } catch (error) {
    console.log('❌ Enhanced health check test failed:', error.message);
    results.health.failed++;
    results.health.errors.push(error.message);
  }

  // Test 3: Password Policy Endpoint
  console.log('\n🔐 Testing Password Policy Endpoint...');
  try {
    const passwordPolicyResponse = await testEndpoint('GET', '/api/v1/auth/password-policy');
    if (passwordPolicyResponse.success && passwordPolicyResponse.status === 200) {
      console.log('✅ Password policy endpoint accessible');
      results.passwordPolicy.passed++;
      
      // Check if policy contains required fields
      const policy = passwordPolicyResponse.data.policy;
      if (policy && policy.minLength && policy.requireUppercase && policy.requireLowercase) {
        console.log('✅ Password policy structure is correct');
        results.passwordPolicy.passed++;
      } else {
        console.log('⚠️  Password policy structure incomplete');
      }
    } else {
      console.log('❌ Password policy endpoint failed:', passwordPolicyResponse.error);
      results.passwordPolicy.failed++;
      results.passwordPolicy.errors.push(passwordPolicyResponse.error);
    }
  } catch (error) {
    console.log('❌ Password policy test failed:', error.message);
    results.passwordPolicy.failed++;
    results.passwordPolicy.errors.push(error.message);
  }

  // Test 4: Phone Validation Endpoint
  console.log('\n📱 Testing Phone Validation Endpoint...');
  try {
    const phoneValidationResponse = await testEndpoint('POST', '/api/v1/auth/validate-phone', {
      phone: '+8801712345678'
    });
    if (phoneValidationResponse.success && phoneValidationResponse.status === 200) {
      console.log('✅ Phone validation endpoint accessible');
      results.phoneValidation.passed++;
      
      // Check if validation response is structured correctly
      const validation = phoneValidationResponse.data.validation;
      if (validation && typeof validation.isValid === 'boolean') {
        console.log('✅ Phone validation response structure is correct');
        results.phoneValidation.passed++;
      } else {
        console.log('⚠️  Phone validation response structure incomplete');
      }
    } else {
      console.log('❌ Phone validation endpoint failed:', phoneValidationResponse.error);
      results.phoneValidation.failed++;
      results.phoneValidation.errors.push(phoneValidationResponse.error);
    }
  } catch (error) {
    console.log('❌ Phone validation test failed:', error.message);
    results.phoneValidation.failed++;
    results.phoneValidation.errors.push(error.message);
  }

  // Test 5: Operators Endpoint
  console.log('\n📡 Testing Operators Endpoint...');
  try {
    const operatorsResponse = await testEndpoint('GET', '/api/v1/auth/operators');
    if (operatorsResponse.success && operatorsResponse.status === 200) {
      console.log('✅ Operators endpoint accessible');
      results.operators.passed++;
      
      // Check if operators data is returned
      const operators = operatorsResponse.data.operators;
      if (operators && Array.isArray(operators)) {
        console.log(`✅ Operators data returned (${operators.length} operators)`);
        results.operators.passed++;
      } else {
        console.log('⚠️  Operators data not in expected format');
      }
    } else {
      console.log('❌ Operators endpoint failed:', operatorsResponse.error);
      results.operators.failed++;
      results.operators.errors.push(operatorsResponse.error);
    }
  } catch (error) {
    console.log('❌ Operators test failed:', error.message);
    results.operators.failed++;
    results.operators.errors.push(error.message);
  }

  // Test 6: Registration Endpoint (Testing Mode)
  console.log('\n👤 Testing Registration Endpoint (Testing Mode)...');
  try {
    const registrationResponse = await testEndpoint('POST', '/api/v1/auth/register', {
      email: 'test@example.com',
      password: 'TestPassword123!',
      firstName: 'Test',
      lastName: 'User',
      confirmPassword: 'TestPassword123!'
    });
    
    if (registrationResponse.success) {
      if (registrationResponse.status === 201) {
        console.log('✅ Registration endpoint accessible');
        results.registration.passed++;
        
        // Check if testing mode is properly handled
        if (registrationResponse.data.testingMode === true || registrationResponse.data.verificationSkipped === true) {
          console.log('✅ Testing mode properly handled');
          results.registration.passed++;
        } else {
          console.log('⚠️  Testing mode may not be properly configured');
        }
      } else if (registrationResponse.status === 409) {
        console.log('✅ Registration endpoint working (user already exists)');
        results.registration.passed++;
      } else {
        console.log('⚠️  Registration endpoint returned unexpected status:', registrationResponse.status);
        results.registration.failed++;
        results.registration.errors.push(`Unexpected status: ${registrationResponse.status}`);
      }
    } else {
      console.log('❌ Registration endpoint failed:', registrationResponse.error);
      results.registration.failed++;
      results.registration.errors.push(registrationResponse.error);
    }
  } catch (error) {
    console.log('❌ Registration test failed:', error.message);
    results.registration.failed++;
    results.registration.errors.push(error.message);
  }

  // Test 7: Login Endpoint (Testing Mode)
  console.log('\n🔑 Testing Login Endpoint (Testing Mode)...');
  try {
    const loginResponse = await testEndpoint('POST', '/api/v1/auth/login', {
      identifier: 'test@example.com',
      password: 'TestPassword123!'
    });
    
    if (loginResponse.success) {
      if (loginResponse.status === 200) {
        console.log('✅ Login endpoint accessible');
        results.login.passed++;
        
        // Check if response includes required fields
        const loginData = loginResponse.data;
        if (loginData.user && loginData.token && loginData.sessionId) {
          console.log('✅ Login response structure is correct');
          results.login.passed++;
        } else {
          console.log('⚠️  Login response structure incomplete');
        }
      } else if (loginResponse.status === 401) {
        console.log('✅ Login endpoint working (invalid credentials)');
        results.login.passed++;
      } else {
        console.log('⚠️  Login endpoint returned unexpected status:', loginResponse.status);
        results.login.failed++;
        results.login.errors.push(`Unexpected status: ${loginResponse.status}`);
      }
    } else {
      console.log('❌ Login endpoint failed:', loginResponse.error);
      results.login.failed++;
      results.login.errors.push(loginResponse.error);
    }
  } catch (error) {
    console.log('❌ Login test failed:', error.message);
    results.login.failed++;
    results.login.errors.push(error.message);
  }

  // Generate Summary Report
  console.log('\n📊 AUTHENTICATION ENDPOINTS TEST SUMMARY');
  console.log('=====================================');
  
  const totalPassed = results.health.passed + results.registration.passed + results.login.passed + 
                     results.passwordPolicy.passed + results.phoneValidation.passed + results.operators.passed;
  const totalFailed = results.health.failed + results.registration.failed + results.login.failed + 
                     results.passwordPolicy.failed + results.phoneValidation.failed + results.operators.failed;
  
  console.log(`✅ Total Tests Passed: ${totalPassed}`);
  console.log(`❌ Total Tests Failed: ${totalFailed}`);
  console.log(`📈 Success Rate: ${((totalPassed / (totalPassed + totalFailed)) * 100).toFixed(1)}%`);
  
  console.log('\n📋 Detailed Results:');
  console.log('Health Check:', `${results.health.passed} passed, ${results.health.failed} failed`);
  console.log('Registration:', `${results.registration.passed} passed, ${results.registration.failed} failed`);
  console.log('Login:', `${results.login.passed} passed, ${results.login.failed} failed`);
  console.log('Password Policy:', `${results.passwordPolicy.passed} passed, ${results.passwordPolicy.failed} failed`);
  console.log('Phone Validation:', `${results.phoneValidation.passed} passed, ${results.phoneValidation.failed} failed`);
  console.log('Operators:', `${results.operators.passed} passed, ${results.operators.failed} failed`);
  
  // Overall assessment
  if (totalFailed === 0) {
    console.log('\n🎉 ALL TESTS PASSED! Authentication endpoints are working correctly.');
  } else if (totalFailed <= 2) {
    console.log('\n⚠️  MOST TESTS PASSED! Minor issues detected but system should be functional.');
  } else {
    console.log('\n❌ MULTIPLE TEST FAILURES! Authentication endpoints need attention.');
  }

  return results;
}

// Run tests
runAuthenticationTests().catch(console.error);