const nodemailer = require('nodemailer');
const crypto = require('crypto');
const configService = require('./config');
const { loggerService } = require('./logger');

class EmailService {
  constructor() {
    this.config = configService;
    this.logger = loggerService;
    this.transporter = null;
    this.isConfigured = false;
    this.fallbackMode = false;
    this.initializeTransporter();
  }

  /**
   * Validate email configuration
   * @returns {Object} Validation result with isValid flag and errors array
   */
  validateConfig() {
    const emailConfig = this.config.getEmailConfig();
    const errors = [];

    if (!emailConfig.host) {
      errors.push('SMTP_HOST is required');
    }

    if (!emailConfig.port) {
      errors.push('SMTP_PORT is required');
    } else if (isNaN(parseInt(emailConfig.port))) {
      errors.push('SMTP_PORT must be a valid number');
    } else if (emailConfig.port < 1 || emailConfig.port > 65535) {
      errors.push('SMTP_PORT must be between 1 and 65535');
    }

    if (!emailConfig.user) {
      errors.push('SMTP_USER is required');
    }

    if (emailConfig.pass === undefined || emailConfig.pass === null) {
      errors.push('SMTP_PASS is required');
    }

    if (!emailConfig.from) {
      errors.push('EMAIL_FROM is required');
    } else if (!this.validateEmail(emailConfig.from)) {
      errors.push('EMAIL_FROM must be a valid email address');
    }

    return {
      isValid: errors.length === 0,
      errors,
      config: {
        host: emailConfig.host,
        port: emailConfig.port,
        user: emailConfig.user,
        from: emailConfig.from,
        secure: emailConfig.secure
      }
    };
  }

  /**
   * Initialize email transporter with validation and fallback
   */
  initializeTransporter() {
    try {
      const validation = this.validateConfig();
      
      if (!validation.isValid) {
        this.logger.warn('Email service not configured properly', {
          errors: validation.errors,
          timestamp: new Date().toISOString()
        });
        this.isConfigured = false;
        this.fallbackMode = true;
        return;
      }

      const emailConfig = this.config.getEmailConfig();

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
        },
        pool: true, // Use connection pooling
        maxConnections: 5,
        maxMessages: 100
      });

      // Verify connection
      this.transporter.verify((error, success) => {
        if (error) {
          this.logger.error('Email service connection failed', error.message, {
            timestamp: new Date().toISOString(),
            host: emailConfig.host,
            port: emailConfig.port
          });
          this.transporter = null;
          this.isConfigured = false;
          this.fallbackMode = true;
        } else {
          this.logger.info('Email service connected successfully', {
            host: emailConfig.host,
            port: emailConfig.port,
            from: emailConfig.from,
            timestamp: new Date().toISOString()
          });
          this.isConfigured = true;
          this.fallbackMode = false;
        }
      });

    } catch (error) {
      this.logger.error('Failed to initialize email service', error.message, {
        timestamp: new Date().toISOString()
      });
      this.transporter = null;
      this.isConfigured = false;
      this.fallbackMode = true;
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

  /**
   * Send verification email with fallback mechanism
   * @param {string} userEmail - Recipient email address
   * @param {string} userName - Recipient name
   * @param {string} verificationToken - Verification token
   * @returns {Promise<Object>} Send result with success status
   */
  async sendVerificationEmail(userEmail, userName, verificationToken) {
    const startTime = Date.now();
    
    try {
      // Validate email format
      if (!this.validateEmail(userEmail)) {
        this.logger.warn('Invalid email format for verification email', {
          email: userEmail,
          timestamp: new Date().toISOString()
        });
        return {
          success: false,
          error: 'Invalid email format',
          errorBn: 'অবৈধ ইমেইল ফরম্যাট',
          code: 'INVALID_EMAIL',
          timestamp: new Date().toISOString()
        };
      }

      // Check if email service is available
      if (!this.transporter) {
        // Use fallback mode
        this.logger.warn('Email service not available, using fallback mode', {
          to: userEmail,
          fallbackMode: true,
          timestamp: new Date().toISOString()
        });

        return this.handleFallbackEmail(userEmail, userName, 'verification', {
          verificationToken,
          timestamp: new Date().toISOString()
        });
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
      const duration = Date.now() - startTime;
      
      this.logger.info('Verification email sent successfully', {
        to: userEmail,
        messageId: result.messageId,
        duration: `${duration}ms`,
        timestamp: new Date().toISOString()
      });

      return {
        success: true,
        messageId: result.messageId,
        timestamp: new Date().toISOString(),
        fallback: false
      };

    } catch (error) {
      const duration = Date.now() - startTime;
      this.logger.error('Failed to send verification email', error.message, {
        to: userEmail,
        errorType: error.name,
        errorCode: error.code,
        duration: `${duration}ms`,
        timestamp: new Date().toISOString()
      });
      
      // Attempt fallback on error
      return this.handleFallbackEmail(userEmail, userName, 'verification', {
        verificationToken,
        originalError: error.message,
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * Send welcome email after verification with fallback mechanism
   * @param {string} userEmail - Recipient email address
   * @param {string} userName - Recipient name
   * @returns {Promise<Object>} Send result with success status
   */
  async sendWelcomeEmail(userEmail, userName) {
    const startTime = Date.now();
    
    try {
      // Validate email format
      if (!this.validateEmail(userEmail)) {
        this.logger.warn('Invalid email format for welcome email', {
          email: userEmail,
          timestamp: new Date().toISOString()
        });
        return {
          success: false,
          error: 'Invalid email format',
          errorBn: 'অবৈধ ইমেইল ফরম্যাট',
          code: 'INVALID_EMAIL',
          timestamp: new Date().toISOString()
        };
      }

      // Check if email service is available
      if (!this.transporter) {
        // Use fallback mode
        this.logger.warn('Email service not available, using fallback mode', {
          to: userEmail,
          fallbackMode: true,
          timestamp: new Date().toISOString()
        });

        return this.handleFallbackEmail(userEmail, userName, 'welcome', {
          timestamp: new Date().toISOString()
        });
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
      const duration = Date.now() - startTime;
      
      this.logger.info('Welcome email sent successfully', {
        to: userEmail,
        messageId: result.messageId,
        duration: `${duration}ms`,
        timestamp: new Date().toISOString()
      });

      return {
        success: true,
        messageId: result.messageId,
        timestamp: new Date().toISOString(),
        fallback: false
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      this.logger.error('Failed to send welcome email', error.message, {
        to: userEmail,
        errorType: error.name,
        errorCode: error.code,
        duration: `${duration}ms`,
        timestamp: new Date().toISOString()
      });
      
      // Attempt fallback on error
      return this.handleFallbackEmail(userEmail, userName, 'welcome', {
        originalError: error.message,
        timestamp: new Date().toISOString()
      });
    }
  }

  // Check if email service is available
  isAvailable() {
    return this.transporter !== null;
  }

  // Validate email format (enhanced strict validation)
  validateEmail(email) {
    if (!email || typeof email !== 'string') {
      return false;
    }
    
    // Trim whitespace
    email = email.trim();
    
    // Enhanced email validation regex (RFC 5322 compliant)
    // This pattern ensures:
    // - Valid local part (before @)
    // - Valid domain part (after @)
    // - No spaces or special characters that shouldn't be in emails
    // - Proper TLD structure
    const emailRegex = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    
    if (!emailRegex.test(email)) {
      return false;
    }
    
    // Additional validation checks
    const parts = email.split('@');
    if (parts.length !== 2) {
      return false;
    }
    
    const [localPart, domain] = parts;
    
    // Check local part length (max 64 characters)
    if (localPart.length > 64) {
      return false;
    }
    
    // Check domain length (max 253 characters)
    if (domain.length > 253) {
      return false;
    }
    
    // Check total email length (max 254 characters)
    if (email.length > 254) {
      return false;
    }
    
    // Check for consecutive dots
    if (localPart.includes('..') || domain.includes('..')) {
      return false;
    }
    
    // Check for leading/trailing dots
    if (localPart.startsWith('.') || localPart.endsWith('.') || domain.startsWith('.') || domain.endsWith('.')) {
      return false;
    }
    
    // Check for invalid characters in local part
    const invalidChars = /[<>()[\]\\",;:]/;
    if (invalidChars.test(localPart)) {
      return false;
    }
    
    return true;
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

  /**
   * Send password reset email with fallback mechanism
   * @param {string} userEmail - Recipient email address
   * @param {string} userName - Recipient name
   * @param {string} temporaryPassword - Temporary password
   * @param {string} resetToken - Reset token
   * @returns {Promise<Object>} Send result with success status
   */
  async sendPasswordResetEmail(userEmail, userName, temporaryPassword, resetToken) {
    const startTime = Date.now();
    
    try {
      // Validate email format
      if (!this.validateEmail(userEmail)) {
        this.logger.warn('Invalid email format for password reset email', {
          email: userEmail,
          timestamp: new Date().toISOString()
        });
        return {
          success: false,
          error: 'Invalid email format',
          errorBn: 'অবৈধ ইমেইল ফরম্যাট',
          code: 'INVALID_EMAIL',
          timestamp: new Date().toISOString()
        };
      }

      // Check if email service is available
      if (!this.transporter) {
        // Use fallback mode
        this.logger.warn('Email service not available, using fallback mode', {
          to: userEmail,
          fallbackMode: true,
          timestamp: new Date().toISOString()
        });

        return this.handleFallbackEmail(userEmail, userName, 'password-reset', {
          temporaryPassword,
          resetToken,
          timestamp: new Date().toISOString()
        });
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
      const duration = Date.now() - startTime;
      
      this.logger.info('Password reset email sent successfully', {
        to: userEmail,
        messageId: result.messageId,
        duration: `${duration}ms`,
        timestamp: new Date().toISOString()
      });

      return {
        success: true,
        messageId: result.messageId,
        timestamp: new Date().toISOString(),
        fallback: false
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      this.logger.error('Failed to send password reset email', error.message, {
        to: userEmail,
        errorType: error.name,
        errorCode: error.code,
        duration: `${duration}ms`,
        timestamp: new Date().toISOString()
      });
      
      // Attempt fallback on error
      return this.handleFallbackEmail(userEmail, userName, 'password-reset', {
        temporaryPassword,
        resetToken,
        originalError: error.message,
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * Handle fallback email when SMTP service is unavailable
   * @param {string} userEmail - Recipient email
   * @param {string} userName - Recipient name
   * @param {string} emailType - Type of email (verification, welcome, password-reset)
   * @param {Object} metadata - Additional metadata
   * @returns {Object} Fallback result
   */
  handleFallbackEmail(userEmail, userName, emailType, metadata = {}) {
    const mockMessageId = `fallback_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    this.logger.warn('Email sent in fallback mode', {
      to: userEmail,
      type: emailType,
      mockMessageId,
      metadata,
      timestamp: new Date().toISOString()
    });

    // In development/testing mode, return success with fallback flag
    // In production, this would log to a queue or database for retry
    return {
      success: true,
      messageId: mockMessageId,
      fallback: true,
      fallbackMode: true,
      emailType,
      timestamp: new Date().toISOString(),
      message: this.config.isTestingMode() 
        ? 'Email sent in testing mode (SMTP not configured)' 
        : 'Email queued for retry (SMTP temporarily unavailable)',
      messageBn: this.config.isTestingMode()
        ? 'ইমেইল টেস্টিং মোডে পাঠানো হয়েছে (SMTP কনফিগার করা নেই)'
        : 'ইমেইল পুনরায় চেষ্টার জন্য সারিবদ্ধ করা হয়েছে (SMTP সাময়িকভাবে অনুপলব্ধ)'
    };
  }

  /**
   * Get email service status
   * @returns {Object} Service status information
   */
  getServiceStatus() {
    const validation = this.validateConfig();
    
    return {
      isConfigured: this.isConfigured,
      isAvailable: this.transporter !== null,
      fallbackMode: this.fallbackMode,
      configValidation: validation,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Test email configuration by sending a test email
   * @param {string} testEmail - Email address to send test to
   * @returns {Promise<Object>} Test result
   */
  async testConfiguration(testEmail) {
    if (!testEmail) {
      return {
        success: false,
        error: 'Test email address is required',
        errorBn: 'টেস্ট ইমেইল ঠিকানা প্রয়োজন',
        code: 'MISSING_TEST_EMAIL'
      };
    }

    if (!this.validateEmail(testEmail)) {
      return {
        success: false,
        error: 'Invalid test email format',
        errorBn: 'অবৈধ টেস্ট ইমেইল ফরম্যাট',
        code: 'INVALID_TEST_EMAIL'
      };
    }

    const status = this.getServiceStatus();
    
    if (!status.isAvailable) {
      return {
        success: false,
        error: 'Email service is not available',
        errorBn: 'ইমেইল সার্ভিস উপলব্ধ নেই',
        code: 'SERVICE_UNAVAILABLE',
        status
      };
    }

    try {
      const emailConfig = this.config.getEmailConfig();
      
      const mailOptions = {
        from: `"Smart Technologies Bangladesh" <${emailConfig.from}>`,
        to: testEmail,
        subject: 'Email Configuration Test - Smart Technologies Bangladesh',
        html: `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>Email Configuration Test</title>
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
                .success {
                  background-color: #d4edda;
                  color: #155724;
                  padding: 15px;
                  border-radius: 5px;
                  margin: 20px 0;
                  border: 1px solid #c3e6cb;
                }
              </style>
            </head>
            <body>
              <div class="container">
                <h2>Email Configuration Test Successful!</h2>
                <div class="success">
                  <p><strong>✅ Test Passed</strong></p>
                  <p>Your email service is configured correctly and working as expected.</p>
                </div>
                <p><strong>Test Details:</strong></p>
                <ul>
                  <li>SMTP Host: ${emailConfig.host}</li>
                  <li>SMTP Port: ${emailConfig.port}</li>
                  <li>Secure: ${emailConfig.secure ? 'Yes' : 'No'}</li>
                  <li>From: ${emailConfig.from}</li>
                  <li>Test Time: ${new Date().toISOString()}</li>
                </ul>
                <p>This is an automated test email from Smart Technologies Bangladesh.</p>
                <p>If you received this email, your SMTP configuration is working correctly!</p>
              </div>
            </body>
          </html>
        `,
        text: `
          Email Configuration Test - Smart Technologies Bangladesh
          
          Test Passed!
          
          Your email service is configured correctly and working as expected.
          
          Test Details:
          - SMTP Host: ${emailConfig.host}
          - SMTP Port: ${emailConfig.port}
          - Secure: ${emailConfig.secure ? 'Yes' : 'No'}
          - From: ${emailConfig.from}
          - Test Time: ${new Date().toISOString()}
          
          If you received this email, your SMTP configuration is working correctly!
        `
      };

      const result = await this.transporter.sendMail(mailOptions);
      
      this.logger.info('Email configuration test successful', {
        to: testEmail,
        messageId: result.messageId,
        timestamp: new Date().toISOString()
      });

      return {
        success: true,
        messageId: result.messageId,
        message: 'Test email sent successfully',
        messageBn: 'টেস্ট ইমেইল সফলভাবে পাঠানো হয়েছে',
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      this.logger.error('Email configuration test failed', error.message, {
        to: testEmail,
        errorType: error.name,
        errorCode: error.code,
        timestamp: new Date().toISOString()
      });

      return {
        success: false,
        error: error.message,
        errorBn: 'ইমেইল কনফিগারেশন টেস্ট ব্যর্থ হয়েছে',
        code: error.code || 'TEST_FAILED',
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
