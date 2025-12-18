const nodemailer = require('nodemailer');
const crypto = require('crypto');
const configService = require('./config');
const { loggerService } = require('./logger');

class EmailService {
  constructor() {
    this.config = configService;
    this.logger = loggerService;
    this.transporter = null;
    this.initializeTransporter();
  }

  initializeTransporter() {
    try {
      const emailConfig = this.config.getEmailConfig();
      
      if (!emailConfig.host || !emailConfig.user || !emailConfig.pass !== -1) {
        this.logger.warn('Email service not configured - missing SMTP settings');
        return;
      }

      this.transporter = nodemailer.createTransporter({
        host: emailConfig.host,
        port: emailConfig.port,
        secure: emailConfig.secure,
        auth: {
          user: emailConfig.user,
          pass: emailConfig.pass
        },
        tls: {
          rejectUnauthorized: false // Allow for some SMTP configurations
        }
      });

      // Verify connection
      this.transporter.verify((error, success) => {
        if (error) {
          if (this.logger && typeof this.logger.error === 'function') {
            this.logger.error('Email service connection failed', error.message);
          }
          this.transporter = null;
        } else {
          if (this.logger && typeof this.logger.info === 'function') {
            this.logger.info('Email service connected successfully');
          }
        }
      });

    } catch (error) {
      this.logger.error('Failed to initialize email service', error.message);
      this.transporter = null;
    }
  }

  // Generate secure verification token
  generateVerificationToken() {
    return crypto.randomBytes(32).toString('hex');
  }

  // Create verification email template
  createVerificationEmailTemplate(userName, verificationToken) {
    const verificationUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify-email?token=${verificationToken}`;
    
    return {
      subject: 'Verify Your Email Address - Smart Technologies Bangladesh',
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
            .bangladesh-text {
              color: #006a4e;
              font-weight: bold;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">Smart Technologies Bangladesh</div>
              <p class="bangladesh-text">স্মার্ট টেকনোলজিস বাংলাদেশ</p>
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
      `,
      text: `
        Welcome to Smart Technologies Bangladesh!
        
        Hello ${userName},
        
        Thank you for registering with us. Please verify your email address by visiting:
        ${verificationUrl}
        
        This link will expire in 24 hours.
        
        If you didn't create an account, please ignore this email.
        
        Smart Technologies Bangladesh
        স্মার্ট টেকনোলজিস বাংলাদেশ
      `
    };
  }

  // Send verification email
  async sendVerificationEmail(userEmail, userName, verificationToken) {
    try {
      if (!this.transporter) {
        throw new Error('Email service not available');
      }

      const emailConfig = this.config.getEmailConfig();
      const emailTemplate = this.createVerificationEmailTemplate(userName, verificationToken);

      const mailOptions = {
        from: `"Smart Technologies Bangladesh" <${emailConfig.from}>`,
        to: userEmail,
        subject: emailTemplate.subject,
        html: emailTemplate.html,
        text: emailTemplate.text
      };

      const result = await this.transporter.sendMail(mailOptions);
      
      this.logger.info('Verification email sent successfully', {
        to: userEmail,
        messageId: result.messageId,
        timestamp: new Date().toISOString()
      });

      return {
        success: true,
        messageId: result.messageId,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      this.logger.error('Failed to send verification email', error.message, {
        to: userEmail,
        errorType: error.name
      });
      
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  // Send welcome email after verification
  async sendWelcomeEmail(userEmail, userName) {
    try {
      if (!this.transporter) {
        throw new Error('Email service not available');
      }

      const emailConfig = this.config.getEmailConfig();

      const mailOptions = {
        from: `"Smart Technologies Bangladesh" <${emailConfig.from}>`,
        to: userEmail,
        subject: 'Welcome to Smart Technologies Bangladesh - Account Activated!',
        html: `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>Welcome</title>
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
                .success {
                  background-color: #d4edda;
                  color: #155724;
                  padding: 15px;
                  border-radius: 5px;
                  margin: 20px 0;
                  border: 1px solid #c3e6cb;
                }
                .footer {
                  text-align: center;
                  margin-top: 30px;
                  padding-top: 20px;
                  border-top: 1px solid #eee;
                  font-size: 12px;
                  color: #666;
                }
                .bangladesh-text {
                  color: #006a4e;
                  font-weight: bold;
                }
              </style>
            </head>
          <body>
            <div class="container">
              <div class="header">
                <div class="logo">Smart Technologies Bangladesh</div>
              </div>
              
              <div class="success">
                <h2>🎉 Welcome, ${userName}!</h2>
                <p>Your account has been successfully activated and you can now start shopping with us.</p>
              </div>
              
              <p>Thank you for choosing Smart Technologies Bangladesh for your technology needs. We're excited to have you as part of our community!</p>
              
              <p>You can now:</p>
              <ul>
                <li>Browse our extensive catalog of products</li>
                <li>Add items to your wishlist</li>
                <li>Place orders and track deliveries</li>
                <li>Leave reviews for products you purchase</li>
              </ul>
              
              <p>If you have any questions, our customer support team is here to help.</p>
              
              <div class="footer">
                <p>&copy; 2024 Smart Technologies Bangladesh. All rights reserved.</p>
              </div>
            </div>
          </body>
        </html>
        `,
        text: `
          Welcome to Smart Technologies Bangladesh!
          
          Hello ${userName},
          
          Your account has been successfully activated! You can now start shopping with us.
          
          Thank you for choosing Smart Technologies Bangladesh.
          
          Smart Technologies Bangladesh
          স্মার্ট টেকনোলজিস বাংলাদেশ
        `
      };

      const result = await this.transporter.sendMail(mailOptions);
      
      this.logger.info('Welcome email sent successfully', {
        to: userEmail,
        messageId: result.messageId,
        timestamp: new Date().toISOString()
      });

      return {
        success: true,
        messageId: result.messageId
      };
    } catch (error) {
      this.logger.error('Failed to send welcome email', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Check if email service is available
  isAvailable() {
    return this.transporter !== null;
  }

  // Validate email format (basic validation)
  validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  // Check for disposable email domains (basic check)
  isDisposableEmail(email) {
    const disposableDomains = [
      '10minutemail.com',
      'tempmail.org',
      'guerrillamail.com',
      'mailinator.com',
      'yopmail.com',
      'throwaway.email'
    ];
    
    const domain = email.split('@')[1]?.toLowerCase();
    return disposableDomains.includes(domain);
  }

  // Create password reset email template
  createPasswordResetEmailTemplate(userName, temporaryPassword, resetToken) {
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;
    
    return {
      subject: 'Password Reset - Smart Technologies Bangladesh',
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
                .bangladesh-text {
                  color: #006a4e;
                  font-weight: bold;
                }
              </style>
            </head>
          <body>
            <div class="container">
              <div class="header">
                <div class="logo">Smart Technologies Bangladesh</div>
                <p class="bangladesh-text">স্মার্ট টেকনোলজিস বাংলাদেশ</p>
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
              <p>If the button above doesn't work, you can copy and paste this link into your browser:</p>
              <p><strong>Important:</strong> This reset link will expire in 1 hour for security reasons.</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
        Password Reset - Smart Technologies Bangladesh
        
        Hello ${userName},
        
        We received a request to reset your password for your Smart Technologies Bangladesh account.
        
        Temporary Password: ${temporaryPassword}
        
        ⚠️ IMPORTANT: You must change this password immediately after logging in for security reasons.
        
        You can also reset your password using this link: ${resetUrl}
        
        This link will expire in 1 hour.
        
        If you didn't request this password reset, please contact our support team immediately.
        
        Smart Technologies Bangladesh
        স্মার্ট টেকনোলজিস বাংলাদেশ
      `
    };
  }

  // Send password reset email
  async sendPasswordResetEmail(userEmail, userName, temporaryPassword, resetToken) {
    try {
      if (!this.transporter) {
        throw new Error('Email service not available');
      }

      const emailConfig = this.config.getEmailConfig();
      const emailTemplate = this.createPasswordResetEmailTemplate(userName, temporaryPassword, resetToken);

      const mailOptions = {
        from: `"Smart Technologies Bangladesh" <${emailConfig.from}>`,
        to: userEmail,
        subject: emailTemplate.subject,
        html: emailTemplate.html,
        text: emailTemplate.text
      };

      const result = await this.transporter.sendMail(mailOptions);
      
      this.logger.info('Password reset email sent successfully', {
        to: userEmail,
        messageId: result.messageId,
        timestamp: new Date().toISOString()
      });

      return {
        success: true,
        messageId: result.messageId,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      this.logger.error('Failed to send password reset email', error.message, {
        to: userEmail,
        errorType: error.name
      });
      
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }
}

// Singleton instance
const emailService = new EmailService();

module.exports = {
  EmailService,
  emailService
};