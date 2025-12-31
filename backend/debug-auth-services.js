const { passwordService } = require('./services/passwordService');
const { phoneValidationService } = require('./services/phoneValidationService');
const { configService } = require('./services/config');

console.log('=== DIAGNOSING AUTHENTICATION SERVICES ===');

// Test password service configuration
console.log('\n1. Testing Password Service Configuration:');
try {
  const passwordPolicy = configService.getPasswordPolicyConfig();
  console.log('Password Policy Config:', JSON.stringify(passwordPolicy, null, 2));
  
  // Test password validation with a simple valid password
  const testPassword = 'TestPass123!';
  const testUserInfo = { firstName: 'Test', lastName: 'User', email: 'test@example.com', phone: '+8801712345678' };
  
  console.log('\nTesting password validation with:', testPassword);
  const validationResult = passwordService.validatePasswordStrength(testPassword, testUserInfo);
  console.log('Password validation result:', JSON.stringify(validationResult, null, 2));
  
} catch (error) {
  console.error('Password Service Error:', error.message);
  console.error('Stack:', error.stack);
}

// Test phone validation service
console.log('\n2. Testing Phone Validation Service:');
try {
  const testPhone = '+8801712345678';
  console.log('Testing phone validation with:', testPhone);
  
  const phoneValidation = phoneValidationService.validateForUseCase(testPhone, 'registration');
  console.log('Phone validation result:', JSON.stringify(phoneValidation, null, 2));
  
} catch (error) {
  console.error('Phone Validation Service Error:', error.message);
  console.error('Stack:', error.stack);
}

// Test config service
console.log('\n3. Testing Config Service:');
try {
  const securityConfig = configService.getSecurityConfig();
  console.log('Security Config:', JSON.stringify(securityConfig, null, 2));
  
  const jwtConfig = configService.getJWTConfig();
  console.log('JWT Config:', JSON.stringify(jwtConfig, null, 2));
  
} catch (error) {
  console.error('Config Service Error:', error.message);
  console.error('Stack:', error.stack);
}

console.log('\n=== DIAGNOSIS COMPLETE ===');