/**
 * Comprehensive SMS Service Test
 * 
 * This script tests all SMS-related services and provides detailed diagnostics
 */

require('dotenv').config();
const { smsService } = require('./services/smsService');
const { otpService } = require('./services/otpService');
const { phoneValidationService } = require('./services/phoneValidationService');
const { configService } = require('./services/config');

async function runComprehensiveTest() {
  console.log('========================================');
  console.log('Comprehensive SMS Service Test');
  console.log('========================================\n');

  let totalTests = 0;
  let passedTests = 0;
  let failedTests = 0;

  // Test 1: Configuration Service
  console.log('Test 1: Configuration Service');
  console.log('----------------------------------------');
  totalTests++;
  try {
    const smsConfig = configService.getSmsConfig();
    console.log('SMS Config:', JSON.stringify({
      apiKey: smsConfig.apiKey ? `${smsConfig.apiKey.substring(0, 8)}...` : null,
      apiSecret: smsConfig.apiSecret ? '***' : null,
      sender: smsConfig.sender
    }, null, 2));
    
    if (smsConfig.apiKey && smsConfig.apiSecret && smsConfig.sender) {
      console.log('✅ Configuration loaded successfully\n');
      passedTests++;
    } else {
      console.log('❌ Configuration incomplete\n');
      failedTests++;
    }
  } catch (error) {
    console.log('❌ Configuration test failed:', error.message, '\n');
    failedTests++;
  }

  // Test 2: SMS Service Status
  console.log('Test 2: SMS Service Status');
  console.log('----------------------------------------');
  totalTests++;
  try {
    const status = smsService.getServiceStatus();
    console.log('Service Status:', JSON.stringify(status, null, 2));
    
    if (status.isConfigured && status.isAvailable) {
      console.log('✅ SMS service is ready\n');
      passedTests++;
    } else {
      console.log('❌ SMS service not ready\n');
      failedTests++;
    }
  } catch (error) {
    console.log('❌ Service status test failed:', error.message, '\n');
    failedTests++;
  }

  // Test 3: Configuration Validation
  console.log('Test 3: Configuration Validation');
  console.log('----------------------------------------');
  totalTests++;
  try {
    const validation = smsService.validateConfig();
    console.log('Validation Result:', JSON.stringify(validation, null, 2));
    
    if (validation.isValid) {
      console.log('✅ Configuration is valid\n');
      passedTests++;
    } else {
      console.log('❌ Configuration validation failed');
      console.log('Errors:', validation.errors, '\n');
      failedTests++;
    }
  } catch (error) {
    console.log('❌ Validation test failed:', error.message, '\n');
    failedTests++;
  }

  // Test 4: Phone Validation Service
  console.log('Test 4: Phone Validation Service');
  console.log('----------------------------------------');
  totalTests++;
  try {
    const testPhones = [
      { phone: '+8801914287530', expected: true, operator: 'Banglalink' },
      { phone: '01914287530', expected: false, operator: null },
      { phone: '+8801712345678', expected: true, operator: 'Grameenphone' },
      { phone: '01712345678', expected: false, operator: null },
      { phone: '+19382228464', expected: false, operator: null }
    ];
    
    let phoneTestsPassed = 0;
    testPhones.forEach(({ phone, expected, operator }) => {
      const result = phoneValidationService.validateForUseCase(phone, 'sms');
      const passed = result.isValid === expected;
      
      console.log(`Phone: ${phone}`);
      console.log(`  Valid: ${result.isValid} (expected: ${expected}) ${passed ? '✅' : '❌'}`);
      console.log(`  Normalized: ${result.normalizedPhone || 'N/A'}`);
      console.log(`  Operator: ${result.operator || 'N/A'}`);
      
      if (passed) phoneTestsPassed++;
    });
    
    if (phoneTestsPassed === testPhones.length) {
      console.log('✅ Phone validation service working correctly\n');
      passedTests++;
    } else {
      console.log(`❌ Phone validation service: ${phoneTestsPassed}/${testPhones.length} tests passed\n`);
      failedTests++;
    }
  } catch (error) {
    console.log('❌ Phone validation test failed:', error.message, '\n');
    failedTests++;
  }

  // Test 5: OTP Template Generation
  console.log('Test 5: OTP Template Generation');
  console.log('----------------------------------------');
  totalTests++;
  try {
    const template = smsService.createOTPTemplate('123456', 'Test User');
    console.log('OTP Template:', JSON.stringify(template, null, 2));
    
    if (template.text && template.textEn && template.textBn) {
      console.log('✅ OTP template generated successfully\n');
      passedTests++;
    } else {
      console.log('❌ OTP template incomplete\n');
      failedTests++;
    }
  } catch (error) {
    console.log('❌ OTP template test failed:', error.message, '\n');
    failedTests++;
  }

  // Test 6: Operator Information
  console.log('Test 6: Operator Information');
  console.log('----------------------------------------');
  totalTests++;
  try {
    const operators = smsService.getSupportedOperators();
    console.log('Supported Operators:', JSON.stringify(operators, null, 2));
    
    const operatorInfo = smsService.getOperatorInfo('+8801914287530');
    console.log('Operator Info for +8801914287530:', JSON.stringify(operatorInfo, null, 2));
    
    if (operators.length > 0 && operatorInfo.operator) {
      console.log('✅ Operator information retrieved successfully\n');
      passedTests++;
    } else {
      console.log('❌ Operator information incomplete\n');
      failedTests++;
    }
  } catch (error) {
    console.log('❌ Operator information test failed:', error.message, '\n');
    failedTests++;
  }

  // Test 7: OTP Service
  console.log('Test 7: OTP Service');
  console.log('----------------------------------------');
  totalTests++;
  try {
    const testPhone = '+8801914287530';
    const otpResult = await otpService.generatePhoneOTP(testPhone);
    console.log('OTP Generation Result:', JSON.stringify({
      success: otpResult.success,
      phone: otpResult.phone,
      operator: otpResult.operator,
      expiresAt: otpResult.expiresAt,
      mock: otpResult.mock,
      error: otpResult.error
    }, null, 2));
    
    if (otpResult.success) {
      console.log('✅ OTP service working correctly\n');
      passedTests++;
    } else {
      console.log('❌ OTP service failed');
      console.log('Error:', otpResult.error, '\n');
      failedTests++;
    }
  } catch (error) {
    console.log('❌ OTP service test failed:', error.message, '\n');
    failedTests++;
  }

  // Test 8: SMS Sending (with Trial Account Warning)
  console.log('Test 8: SMS Sending');
  console.log('----------------------------------------');
  totalTests++;
  try {
    const testPhone = '+8801914287530';
    console.log('Attempting to send test SMS to:', testPhone);
    console.log('⚠️  Note: Trial accounts can only send to verified numbers');
    console.log('⚠️  Verify this number at: https://www.twilio.com/console/phone-numbers/verified\n');
    
    const smsResult = await smsService.testConfiguration(testPhone);
    console.log('SMS Result:', JSON.stringify({
      success: smsResult.success,
      messageId: smsResult.messageId,
      phone: smsResult.phone,
      operator: smsResult.operator,
      error: smsResult.error
    }, null, 2));
    
    if (smsResult.success) {
      console.log('✅ SMS sent successfully\n');
      passedTests++;
    } else {
      console.log('❌ SMS sending failed (expected for trial account with unverified number)');
      console.log('Error:', smsResult.error);
      console.log('Solution: Verify the phone number in Twilio console or upgrade to paid account\n');
      failedTests++;
    }
  } catch (error) {
    console.log('❌ SMS sending test failed:', error.message, '\n');
    failedTests++;
  }

  // Test Summary
  console.log('========================================');
  console.log('Test Summary');
  console.log('========================================');
  console.log(`Total Tests: ${totalTests}`);
  console.log(`Passed: ${passedTests} ✅`);
  console.log(`Failed: ${failedTests} ❌`);
  console.log(`Success Rate: ${((passedTests / totalTests) * 100).toFixed(2)}%`);
  console.log('========================================\n');

  // Trial Account Information
  console.log('========================================');
  console.log('Trial Account Information');
  console.log('========================================');
  console.log('⚠️  Your Twilio account is in TRIAL mode');
  console.log('⚠️  Trial account limitations:');
  console.log('   - Can only send SMS to verified phone numbers');
  console.log('   - Limited to 1 phone number');
  console.log('   - SMS delivery may be delayed');
  console.log('   - Cannot send to all countries');
  console.log('\n📋 To verify a phone number:');
  console.log('   1. Go to: https://www.twilio.com/console/phone-numbers/verified');
  console.log('   2. Click "Add a new Verified Caller ID"');
  console.log('   3. Enter the phone number: +8801914287530');
  console.log('   4. Verify via SMS or voice call');
  console.log('   5. After verification, SMS can be sent to this number');
  console.log('\n💡 To upgrade to paid account:');
  console.log('   1. Go to: https://www.twilio.com/console');
  console.log('   2. Click "Upgrade" in the billing section');
  console.log('   3. Add payment method');
  console.log('   4. Purchase additional phone numbers if needed');
  console.log('========================================\n');

  // Service Status
  console.log('========================================');
  console.log('Current Service Status');
  console.log('========================================');
  const status = smsService.getServiceStatus();
  console.log(`SMS Service: ${status.isConfigured ? '✅ Configured' : '❌ Not Configured'}`);
  console.log(`Twilio Client: ${status.isAvailable ? '✅ Available' : '❌ Not Available'}`);
  console.log(`Fallback Mode: ${status.fallbackMode ? '⚠️  Enabled' : '✅ Disabled'}`);
  console.log(`Configuration: ${status.configValidation.isValid ? '✅ Valid' : '❌ Invalid'}`);
  console.log('========================================\n');
}

// Run comprehensive test
runComprehensiveTest().catch(error => {
  console.error('Comprehensive test failed with error:', error);
  process.exit(1);
});
