/**
 * Email Service Test Script for Mailtrap Configuration
 * 
 * This script tests the email service configuration with Mailtrap
 * to ensure emails are being sent correctly during development.
 */

const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '.env') });

const { emailService } = require('./services/emailService');
const { loggerService } = require('./services/logger');

async function testEmailConfiguration() {
  console.log('========================================');
  console.log('📧 Mailtrap Email Configuration Test');
  console.log('========================================\n');

  // Wait for email service initialization to complete
  console.log('⏳ Waiting for email service to initialize...');
  if (emailService.initializationPromise) {
    await emailService.initializationPromise;
  }
  
  // Additional wait for connection to establish
  await new Promise(resolve => setTimeout(resolve, 1000));

  if (emailService.isConfigured && emailService.isAvailable()) {
    console.log('✅ Email service initialized successfully!\n');
  } else {
    console.log('⚠️  Email service is in fallback mode\n');
    console.log('This is normal if SMTP credentials are not configured correctly.');
    console.log('The test will continue with fallback mode enabled.\n');
  }

  try {
    // 1. Check email service status
    console.log('📋 Step 1: Checking email service status...');
    const serviceStatus = emailService.getServiceStatus();
    console.log('Service Status:', JSON.stringify(serviceStatus, null, 2));
    console.log();

    // 2. Validate configuration
    console.log('📋 Step 2: Validating email configuration...');
    const validation = emailService.validateConfig();
    console.log('Configuration Validation:', JSON.stringify(validation, null, 2));
    console.log();

    if (!validation.isValid) {
      console.error('❌ Email configuration is invalid!');
      console.error('Errors:', validation.errors);
      process.exit(1);
    }

    // 3. Test email connection
    console.log('📋 Step 3: Testing email connection...');
    if (!emailService.isAvailable()) {
      console.error('❌ Email service is not available!');
      console.error('Please check your SMTP configuration in .env file');
      process.exit(1);
    }
    console.log('✅ Email service is available and connected\n');

    // 4. Send test email
    console.log('📋 Step 4: Sending test email...');
    const testEmail = process.env.TEST_EMAIL || 'test@example.com';
    
    console.log(`Sending test email to: ${testEmail}`);
    console.log('Note: With Mailtrap, you can view emails in your Mailtrap inbox\n');
    
    const testResult = await emailService.testConfiguration(testEmail);
    
    if (testResult.success) {
      console.log('✅ Test email sent successfully!');
      console.log('Message ID:', testResult.messageId);
      console.log('Timestamp:', testResult.timestamp);
      console.log();
      console.log('📬 Check your Mailtrap inbox to view the test email:');
      console.log('   https://mailtrap.io/inboxes\n');
    } else {
      console.error('❌ Failed to send test email!');
      console.error('Error:', testResult.error);
      console.error('Code:', testResult.code);
      process.exit(1);
    }

    // 5. Test verification email
    console.log('📋 Step 5: Testing verification email...');
    const testUserName = 'Test User';
    const testUserEmail = testEmail;
    const verificationToken = emailService.generateVerificationToken();
    
    console.log(`Sending verification email to: ${testUserEmail}`);
    
    const verificationResult = await emailService.sendVerificationEmail(
      testUserEmail,
      testUserName,
      verificationToken
    );
    
    if (verificationResult.success) {
      console.log('✅ Verification email sent successfully!');
      console.log('Message ID:', verificationResult.messageId);
      console.log('Fallback Mode:', verificationResult.fallback ? 'Yes' : 'No');
      console.log('Timestamp:', verificationResult.timestamp);
      console.log();
    } else {
      console.error('❌ Failed to send verification email!');
      console.error('Error:', verificationResult.error);
      console.error('Code:', verificationResult.code);
      process.exit(1);
    }

    // 6. Test welcome email
    console.log('📋 Step 6: Testing welcome email...');
    const welcomeResult = await emailService.sendWelcomeEmail(
      testUserEmail,
      testUserName
    );
    
    if (welcomeResult.success) {
      console.log('✅ Welcome email sent successfully!');
      console.log('Message ID:', welcomeResult.messageId);
      console.log('Fallback Mode:', welcomeResult.fallback ? 'Yes' : 'No');
      console.log('Timestamp:', welcomeResult.timestamp);
      console.log();
    } else {
      console.error('❌ Failed to send welcome email!');
      console.error('Error:', welcomeResult.error);
      console.error('Code:', welcomeResult.code);
      process.exit(1);
    }

    // 7. Test password reset email
    console.log('📋 Step 7: Testing password reset email...');
    const tempPassword = 'TempPass123!';
    const resetToken = emailService.generateVerificationToken();
    
    const passwordResetResult = await emailService.sendPasswordResetEmail(
      testUserEmail,
      testUserName,
      tempPassword,
      resetToken
    );
    
    if (passwordResetResult.success) {
      console.log('✅ Password reset email sent successfully!');
      console.log('Message ID:', passwordResetResult.messageId);
      console.log('Fallback Mode:', passwordResetResult.fallback ? 'Yes' : 'No');
      console.log('Timestamp:', passwordResetResult.timestamp);
      console.log();
    } else {
      console.error('❌ Failed to send password reset email!');
      console.error('Error:', passwordResetResult.error);
      console.error('Code:', passwordResetResult.code);
      process.exit(1);
    }

    console.log('========================================');
    console.log('✅ All email tests passed successfully!');
    console.log('========================================\n');
    
    console.log('📝 Summary:');
    console.log('   - Email service: Connected');
    console.log('   - Configuration: Valid');
    console.log('   - Test email: Sent');
    console.log('   - Verification email: Sent');
    console.log('   - Welcome email: Sent');
    console.log('   - Password reset email: Sent');
    console.log();
    console.log('🎉 Your Mailtrap email configuration is working correctly!');
    console.log();

  } catch (error) {
    console.error('❌ Email test failed with error:', error.message);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  }
}

// Run the test
testEmailConfiguration()
  .then(() => {
    console.log('✅ Email configuration test completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Email configuration test failed:', error);
    process.exit(1);
  });
