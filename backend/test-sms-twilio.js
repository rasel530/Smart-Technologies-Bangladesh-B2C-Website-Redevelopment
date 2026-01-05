/**
 * Twilio SMS Configuration Test
 * 
 * This script tests the Twilio SMS configuration and sends a test SMS
 */

require('dotenv').config();
const { smsService } = require('./services/smsService');

async function testTwilioSMS() {
  console.log('========================================');
  console.log('Twilio SMS Configuration Test');
  console.log('========================================\n');

  // Test 1: Check service status
  console.log('Test 1: Checking SMS service status...');
  const status = smsService.getServiceStatus();
  console.log('Service Status:', JSON.stringify(status, null, 2));
  
  if (!status.isConfigured) {
    console.log('\n❌ SMS service is not properly configured');
    console.log('Configuration errors:', status.configValidation.errors);
    return;
  }
  
  console.log('\n✅ SMS service is configured\n');

  // Test 2: Validate configuration
  console.log('Test 2: Validating SMS configuration...');
  const validation = smsService.validateConfig();
  console.log('Validation Result:', JSON.stringify(validation, null, 2));
  
  if (!validation.isValid) {
    console.log('\n❌ SMS configuration validation failed');
    console.log('Errors:', validation.errors);
    return;
  }
  
  console.log('\n✅ SMS configuration is valid\n');

  // Test 3: Create OTP template
  console.log('Test 3: Creating OTP template...');
  const template = smsService.createOTPTemplate('123456', 'Test User');
  console.log('OTP Template:', JSON.stringify(template, null, 2));
  console.log('\n✅ OTP template created successfully\n');

  // Test 4: Validate phone number
  console.log('Test 4: Validating phone numbers...');
  const testPhones = [
    '+8801712345678',
    '01712345678',
    '+19382228464'
  ];
  
  testPhones.forEach(phone => {
    const result = smsService.validateBangladeshPhoneNumber(phone);
    console.log(`Phone: ${phone}`);
    console.log(`  Valid: ${result.isValid}`);
    console.log(`  Normalized: ${result.normalizedPhone || 'N/A'}`);
    console.log(`  Operator: ${result.operator || 'N/A'}`);
  });
  console.log('\n✅ Phone validation completed\n');

  // Test 5: Send test SMS (optional - requires a valid phone number)
  console.log('Test 5: Send test SMS (optional)...');
  console.log('To send a test SMS, provide a phone number as a command line argument');
  console.log('Example: node test-sms-twilio.js +8801712345678');
  
  const testPhone = process.argv[2];
  
  if (testPhone) {
    console.log(`\nSending test SMS to: ${testPhone}`);
    const testResult = await smsService.testConfiguration(testPhone);
    console.log('Test SMS Result:', JSON.stringify(testResult, null, 2));
    
    if (testResult.success) {
      console.log('\n✅ Test SMS sent successfully');
      console.log(`Message ID: ${testResult.messageId}`);
      console.log(`Phone: ${testResult.phone}`);
      console.log(`Operator: ${testResult.operator}`);
    } else {
      console.log('\n❌ Test SMS failed');
      console.log(`Error: ${testResult.error}`);
    }
  } else {
    console.log('\n⚠️  No phone number provided, skipping test SMS');
  }

  console.log('\n========================================');
  console.log('Test Summary');
  console.log('========================================');
  console.log('✅ SMS Service Status:', status.isConfigured ? 'Configured' : 'Not Configured');
  console.log('✅ Configuration Validation:', validation.isValid ? 'Valid' : 'Invalid');
  console.log('✅ Twilio Client:', status.isAvailable ? 'Available' : 'Not Available');
  console.log('✅ Fallback Mode:', status.fallbackMode ? 'Enabled' : 'Disabled');
  console.log('========================================\n');
}

// Run the test
testTwilioSMS().catch(error => {
  console.error('Test failed with error:', error);
  process.exit(1);
});
