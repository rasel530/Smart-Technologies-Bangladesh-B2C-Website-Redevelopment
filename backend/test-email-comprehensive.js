/**
 * Comprehensive Email Functionality Test
 * 
 * Tests email service, registration flow, and password reset flow
 */

const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '.env') });

const nodemailer = require('nodemailer');
const crypto = require('crypto');

console.log('========================================');
console.log('📧 Comprehensive Email Functionality Test');
console.log('========================================\n');

// Test results tracking
const testResults = {
  emailConfiguration: { passed: false, details: '' },
  emailConnection: { passed: false, details: '' },
  sendTestEmail: { passed: false, details: '' },
  registrationFlow: { passed: false, details: '' },
  passwordResetFlow: { passed: false, details: '' }
};

// Main test function
async function runTests() {
  // Create transporter
  let transporter;
  try {
    console.log('📋 Step 1: Creating email transporter...');
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      },
      tls: {
        rejectUnauthorized: false
      }
    });
    console.log('✅ Email transporter created\n');
    testResults.emailConfiguration.passed = true;
    testResults.emailConfiguration.details = 'Transporter created successfully';
  } catch (error) {
    console.error('❌ Failed to create transporter:', error.message);
    testResults.emailConfiguration.details = `Error: ${error.message}`;
    process.exit(1);
  }

  // Verify connection
  try {
    console.log('📋 Step 2: Verifying email connection...');
    await transporter.verify();
    console.log('✅ Email connection verified\n');
    testResults.emailConnection.passed = true;
    testResults.emailConnection.details = 'Connection successful';
  } catch (error) {
    console.error('❌ Connection verification failed:', error.message);
    testResults.emailConnection.details = `Error: ${error.message}`;
    process.exit(1);
  }

  // Test 1: Send simple test email
  try {
    console.log('📋 Step 3: Sending test email...');
    const testEmail = 'test@example.com';
    const result = await transporter.sendMail({
      from: `"Smart Tech Test" <${process.env.EMAIL_FROM}>`,
      to: testEmail,
      subject: 'Mailtrap Configuration Test',
      text: 'This is a test email from Smart Technologies Bangladesh',
      html: `
        <h2>Mailtrap Configuration Test</h2>
        <p>This is a test email from Smart Technologies Bangladesh</p>
        <p><strong>Test Time:</strong> ${new Date().toISOString()}</p>
        <p>If you receive this email, your Mailtrap configuration is working correctly!</p>
      `
    });
    
    console.log('✅ Test email sent successfully');
    console.log('   Message ID:', result.messageId);
    console.log();
    testResults.sendTestEmail.passed = true;
    testResults.sendTestEmail.details = `Message ID: ${result.messageId}`;
  } catch (error) {
    console.error('❌ Failed to send test email:', error.message);
    testResults.sendTestEmail.details = `Error: ${error.message}`;
  }

  // Test 2: Registration flow (verification email)
  try {
    console.log('📋 Step 4: Testing registration flow (verification email)...');
    const userEmail = 'newuser@example.com';
    const userName = 'New User';
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify-email?token=${verificationToken}`;
    
    const result = await transporter.sendMail({
      from: `"Smart Technologies Bangladesh" <${process.env.EMAIL_FROM}>`,
      to: userEmail,
      subject: 'Verify Your Email Address - Smart Technologies Bangladesh',
      text: `
        Welcome to Smart Technologies Bangladesh!
        
        Hello ${userName},
        
        Thank you for registering with us. Please verify your email address by visiting:
        ${verificationUrl}
        
        This link will expire in 24 hours.
        
        If you didn't create an account, please ignore this email.
        
        Smart Technologies Bangladesh
      `,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Email Verification</title>
            <style>
              body {
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
                background-color: #f4f4f4;
              }
              .container {
                background-color: #ffffff;
                padding: 30px;
                border-radius: 10px;
                box-shadow: 0 2px 10px rgba(0,0,0,0.1);
              }
              .header {
                text-align: center;
                margin-bottom: 30px;
              }
              .logo {
                color: #2c3e50;
                font-size: 24px;
                font-weight: bold;
                margin-bottom: 10px;
              }
              .content {
                margin-bottom: 30px;
              }
              .button {
                display: inline-block;
                background-color: #3498db;
                color: white;
                padding: 12px 30px;
                text-decoration: none;
                border-radius: 5px;
                font-weight: bold;
                margin: 20px 0;
              }
              .button:hover {
                background-color: #2980b9;
              }
              .footer {
                text-align: center;
                margin-top: 30px;
                padding-top: 20px;
                border-top: 1px solid #eee;
                font-size: 12px;
                color: #666;
              }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <div class="logo">Smart Technologies Bangladesh</div>
              </div>
              
              <div class="content">
                <h2>Welcome, ${userName}!</h2>
                <p>Thank you for registering with Smart Technologies Bangladesh. To complete your registration and activate your account, please verify your email address by clicking the button below.</p>
                
                <p><strong>Important:</strong> This verification link will expire in 24 hours for security reasons.</p>
                
                <div style="text-align: center;">
                  <a href="${verificationUrl}" class="button">Verify Email Address</a>
                </div>
                
                <p>If the button above doesn't work, you can copy and paste this link into your browser:</p>
                <p style="word-break: break-all; color: #666; font-size: 12px;">${verificationUrl}</p>
              </div>
              
              <div class="footer">
                <p>This is an automated message from Smart Technologies Bangladesh.</p>
                <p>If you didn't create an account, please ignore this email.</p>
                <p>&copy; 2024 Smart Technologies Bangladesh. All rights reserved.</p>
              </div>
            </div>
          </body>
        </html>
      `
    });
    
    console.log('✅ Registration verification email sent successfully');
    console.log('   To:', userEmail);
    console.log('   Message ID:', result.messageId);
    console.log('   Token:', verificationToken.substring(0, 20) + '...');
    console.log();
    testResults.registrationFlow.passed = true;
    testResults.registrationFlow.details = `Message ID: ${result.messageId}, Token: ${verificationToken.substring(0, 20)}...`;
  } catch (error) {
    console.error('❌ Failed to send verification email:', error.message);
    testResults.registrationFlow.details = `Error: ${error.message}`;
  }

  // Test 3: Password reset flow
  try {
    console.log('📋 Step 5: Testing password reset flow...');
    const userEmail = 'user@example.com';
    const userName = 'Test User';
    const temporaryPassword = 'TempPass123!';
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;
    
    const result = await transporter.sendMail({
      from: `"Smart Technologies Bangladesh" <${process.env.EMAIL_FROM}>`,
      to: userEmail,
      subject: 'Password Reset - Smart Technologies Bangladesh',
      text: `
        Password Reset - Smart Technologies Bangladesh
        
        Hello ${userName},
        
        We received a request to reset your password for your Smart Technologies Bangladesh account. A temporary password has been generated for you.
        
        Temporary Password: ${temporaryPassword}
        
        ⚠️ IMPORTANT: You must change this password immediately after logging in for security reasons.
        
        You can also reset your password using this link: ${resetUrl}
        
        This link will expire in 1 hour.
        
        If you didn't request this password reset, please contact our support team immediately.
        
        Smart Technologies Bangladesh
      `,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Password Reset</title>
            <style>
              body {
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
                background-color: #f4f4f4;
              }
              .container {
                background-color: #ffffff;
                padding: 30px;
                border-radius: 10px;
                box-shadow: 0 2px 10px rgba(0,0,0,0.1);
              }
              .header {
                text-align: center;
                margin-bottom: 30px;
              }
              .logo {
                color: #2c3e50;
                font-size: 24px;
                font-weight: bold;
                margin-bottom: 10px;
              }
              .content {
                margin-bottom: 30px;
              }
              .temp-password {
                background-color: #fff3cd;
                border: 1px solid #ffeaa7;
                padding: 15px;
                border-radius: 5px;
                margin: 20px 0;
                font-family: monospace;
                font-size: 16px;
                text-align: center;
              }
              .button {
                display: inline-block;
                background-color: #e74c3c;
                color: white;
                padding: 12px 30px;
                text-decoration: none;
                border-radius: 5px;
                font-weight: bold;
                margin: 20px 0;
              }
              .button:hover {
                background-color: #c0392b;
              }
              .warning {
                background-color: #f8d7da;
                color: #721c24;
                padding: 15px;
                border-radius: 5px;
                margin: 20px 0;
                border: 1px solid #f5c6cb;
              }
              .footer {
                text-align: center;
                margin-top: 30px;
                padding-top: 20px;
                border-top: 1px solid #eee;
                font-size: 12px;
                color: #666;
              }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <div class="logo">Smart Technologies Bangladesh</div>
              </div>
              
              <div class="content">
                <h2>Password Reset Request</h2>
                <p>Hello ${userName},</p>
                <p>We received a request to reset your password for your Smart Technologies Bangladesh account. A temporary password has been generated for you.</p>
                
                <div class="temp-password">
                  <strong>Temporary Password:</strong><br>
                  ${temporaryPassword}
                </div>
                
                <div class="warning">
                  <strong>⚠️ Important Security Notice:</strong><br>
                    This temporary password will allow you to log in, but you must change it immediately after logging in for security reasons.
                </div>
                
                <p>You can also use the link below to reset your password manually:</p>
                
                <div style="text-align: center;">
                  <a href="${resetUrl}" class="button">Reset Password</a>
                </div>
                
                <p>If the button above doesn't work, you can copy and paste this link into your browser:</p>
                <p style="word-break: break-all; color: #666; font-size: 12px;">${resetUrl}</p>
              </div>
              
              <div class="footer">
                <p><strong>Important:</strong> This reset link will expire in 1 hour for security reasons.</p>
              </div>
            </div>
          </body>
        </html>
      `
    });
    
    console.log('✅ Password reset email sent successfully');
    console.log('   To:', userEmail);
    console.log('   Message ID:', result.messageId);
    console.log('   Temporary Password:', temporaryPassword);
    console.log('   Reset Token:', resetToken.substring(0, 20) + '...');
    console.log();
    testResults.passwordResetFlow.passed = true;
    testResults.passwordResetFlow.details = `Message ID: ${result.messageId}, Token: ${resetToken.substring(0, 20)}...`;
  } catch (error) {
    console.error('❌ Failed to send password reset email:', error.message);
    testResults.passwordResetFlow.details = `Error: ${error.message}`;
  }

  // Generate report
  console.log('========================================');
  console.log('📊 TEST RESULTS REPORT');
  console.log('========================================\n');

  const totalTests = Object.keys(testResults).length;
  const passedTests = Object.values(testResults).filter(r => r.passed).length;
  const failedTests = totalTests - passedTests;

  console.log('Summary:');
  console.log(`   Total Tests: ${totalTests}`);
  console.log(`   Passed: ${passedTests}`);
  console.log(`   Failed: ${failedTests}`);
  console.log(`   Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);
  console.log();

  console.log('Detailed Results:\n');

  Object.entries(testResults).forEach(([testName, result]) => {
    const status = result.passed ? '✅ PASSED' : '❌ FAILED';
    const displayName = testName.replace(/([A-Z])/g, ' $1').trim();
    console.log(`${status} - ${displayName}`);
    console.log(`   ${result.details}\n`);
  });

  console.log('========================================');
  console.log('📬 MAILTRAP INBOX');
  console.log('========================================\n');

  console.log('View all sent emails at:');
  console.log('   https://mailtrap.io/inboxes\n');

  console.log('You should see 3 emails:');
  console.log('   1. Mailtrap Configuration Test');
  console.log('   2. Verify Your Email Address (Registration)');
  console.log('   3. Password Reset Request');
  console.log('   4. (Optional) Welcome Email (after verification)\n');

  console.log('========================================');
  console.log('🎉 TEST COMPLETED');
  console.log('========================================\n');

  // Exit with appropriate code
  process.exit(failedTests > 0 ? 1 : 0);
}

// Run tests
runTests().catch(error => {
  console.error('❌ Test execution failed:', error);
  process.exit(1);
});
