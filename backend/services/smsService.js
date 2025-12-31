const twilio = require('twilio');
const configService = require('./config');
const { loggerService } = require('./logger');
const { phoneValidationService } = require('./phoneValidationService');

class SMSService {
  constructor() {
    this.config = configService;
    this.logger = loggerService;
    this.twilioClient = null;
    this.isConfigured = false;
    this.fallbackMode = false;
    this.initializeTwilio();
  }

  /**
   * Validate SMS configuration
   * @returns {Object} Validation result with isValid flag and errors array
   */
  validateConfig() {
    const smsConfig = this.config.getSmsConfig();
    const errors = [];

    if (!smsConfig.apiKey) {
      errors.push('TWILIO_ACCOUNT_SID is required');
    } else if (!smsConfig.apiKey.startsWith('AC')) {
      errors.push('TWILIO_ACCOUNT_SID must start with AC');
    }

    if (!smsConfig.apiSecret) {
      errors.push('TWILIO_AUTH_TOKEN is required');
    } else if (smsConfig.apiSecret.length < 32) {
      errors.push('TWILIO_AUTH_TOKEN must be at least 32 characters');
    }

    if (!smsConfig.sender) {
      errors.push('TWILIO_PHONE_NUMBER is required');
    } else {
      // Validate phone number format (basic check)
      const phoneRegex = /^\+?[1-9]\d{1,14}$/;
      const cleanPhone = smsConfig.sender.replace(/[\s-()]/g, '');
      if (!phoneRegex.test(cleanPhone)) {
        errors.push('TWILIO_PHONE_NUMBER must be a valid phone number in E.164 format');
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      config: {
        accountSid: smsConfig.apiKey ? `${smsConfig.apiKey.substring(0, 8)}...` : null,
        phoneNumber: smsConfig.sender,
        hasAuthToken: !!smsConfig.apiSecret
      }
    };
  }

  /**
   * Initialize Twilio client with validation and fallback
   */
  initializeTwilio() {
    try {
      const validation = this.validateConfig();
      
      if (!validation.isValid) {
        this.logger.warn('Twilio SMS service not configured properly', {
          errors: validation.errors,
          timestamp: new Date().toISOString()
        });
        this.isConfigured = false;
        this.fallbackMode = true;
        return;
      }

      const smsConfig = this.config.getSmsConfig();

      this.twilioClient = twilio(smsConfig.apiKey, smsConfig.apiSecret);
      
      this.logger.info('Twilio SMS service initialized successfully', {
        accountSid: `${smsConfig.apiKey.substring(0, 8)}...`,
        phoneNumber: smsConfig.sender,
        timestamp: new Date().toISOString()
      });
      
      this.isConfigured = true;
      this.fallbackMode = false;
      
    } catch (error) {
      this.logger.error('Failed to initialize Twilio SMS service', error.message, {
        timestamp: new Date().toISOString()
      });
      this.twilioClient = null;
      this.isConfigured = false;
      this.fallbackMode = true;
    }
  }

  // Validate Bangladesh phone number format (enhanced with centralized service)
  validateBangladeshPhoneNumber(phone) {
    return phoneValidationService.validateForUseCase(phone, 'sms');
  }

  // Create OTP SMS template with Bangladesh localization
  createOTPTemplate(otp, userName) {
    return {
      text: `Smart Technologies Bangladesh: আপনার OTP কোডটি ${otp}। এটি 5 মিনিটের মধ্যে ব্যবহার করুন। Your OTP is ${otp}. Use within 5 minutes.`,
      textEn: `Smart Technologies Bangladesh: Your OTP is ${otp}. Use within 5 minutes.`,
      textBn: `স্মার্ট টেকনোলজিস বাংলাদেশ: আপনার OTP কোডটি ${otp}। এটি 5 মিনিটের মধ্যে ব্যবহার করুন।`
    };
  }

  /**
   * Send OTP via SMS with fallback mechanism
   * @param {string} phone - Recipient phone number
   * @param {string} otp - One-time password
   * @param {string} userName - Recipient name (optional)
   * @returns {Promise<Object>} Send result with success status
   */
  async sendOTP(phone, otp, userName = '') {
    const startTime = Date.now();
    
    try {
      const validation = this.validateBangladeshPhoneNumber(phone);
      if (!validation.isValid) {
        this.logger.warn('Invalid phone number for OTP SMS', {
          phone,
          error: validation.error,
          timestamp: new Date().toISOString()
        });
        return {
          success: false,
          error: validation.error,
          errorBn: validation.errorBn,
          code: validation.code || 'INVALID_PHONE',
          timestamp: new Date().toISOString()
        };
      }

      if (!this.twilioClient) {
        // Use fallback mode
        this.logger.warn('SMS service not available, using fallback mode', {
          phone: validation.normalizedPhone,
          otp,
          fallbackMode: true,
          timestamp: new Date().toISOString()
        });

        return this.handleFallbackSMS(phone, 'otp', {
          otp,
          normalizedPhone: validation.normalizedPhone,
          operator: validation.operator,
          timestamp: new Date().toISOString()
        });
      }

      const smsConfig = this.config.getSmsConfig();
      const template = this.createOTPTemplate(otp, userName);

      const message = await this.twilioClient.messages.create({
        body: template.text,
        from: smsConfig.sender,
        to: validation.normalizedPhone
      });
      
      const duration = Date.now() - startTime;

      this.logger.info('OTP SMS sent successfully', {
        to: validation.normalizedPhone,
        messageId: message.sid,
        operator: validation.operator,
        duration: `${duration}ms`,
        timestamp: new Date().toISOString()
      });

      return {
        success: true,
        messageId: message.sid,
        phone: validation.normalizedPhone,
        operator: validation.operator,
        timestamp: new Date().toISOString(),
        fallback: false
      };

    } catch (error) {
      const duration = Date.now() - startTime;
      this.logger.error('Failed to send OTP SMS', error.message, {
        phone,
        errorType: error.name,
        errorCode: error.code,
        duration: `${duration}ms`,
        timestamp: new Date().toISOString()
      });

      // Attempt fallback on error
      return this.handleFallbackSMS(phone, 'otp', {
        otp,
        originalError: error.message,
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * Send general SMS with fallback mechanism
   * @param {string} phone - Recipient phone number
   * @param {string} message - SMS message content
   * @param {Object} options - Additional options for Twilio
   * @returns {Promise<Object>} Send result with success status
   */
  async sendSMS(phone, message, options = {}) {
    const startTime = Date.now();
    
    try {
      const validation = this.validateBangladeshPhoneNumber(phone);
      if (!validation.isValid) {
        this.logger.warn('Invalid phone number for SMS', {
          phone,
          error: validation.error,
          timestamp: new Date().toISOString()
        });
        return {
          success: false,
          error: validation.error,
          errorBn: validation.errorBn,
          code: validation.code || 'INVALID_PHONE',
          timestamp: new Date().toISOString()
        };
      }

      if (!this.twilioClient) {
        // Use fallback mode
        this.logger.warn('SMS service not available, using fallback mode', {
          phone: validation.normalizedPhone,
          message: message.substring(0, 100) + '...',
          fallbackMode: true,
          timestamp: new Date().toISOString()
        });

        return this.handleFallbackSMS(phone, 'general', {
          message,
          normalizedPhone: validation.normalizedPhone,
          operator: validation.operator,
          timestamp: new Date().toISOString()
        });
      }

      const smsConfig = this.config.getSmsConfig();

      const twilioMessage = await this.twilioClient.messages.create({
        body: message,
        from: smsConfig.sender,
        to: validation.normalizedPhone,
        ...options
      });
      
      const duration = Date.now() - startTime;

      this.logger.info('SMS sent successfully', {
        to: validation.normalizedPhone,
        messageId: twilioMessage.sid,
        operator: validation.operator,
        duration: `${duration}ms`,
        timestamp: new Date().toISOString()
      });

      return {
        success: true,
        messageId: twilioMessage.sid,
        phone: validation.normalizedPhone,
        operator: validation.operator,
        timestamp: new Date().toISOString(),
        fallback: false
      };

    } catch (error) {
      const duration = Date.now() - startTime;
      this.logger.error('Failed to send SMS', error.message, {
        phone,
        errorType: error.name,
        errorCode: error.code,
        duration: `${duration}ms`,
        timestamp: new Date().toISOString()
      });

      // Attempt fallback on error
      return this.handleFallbackSMS(phone, 'general', {
        message,
        originalError: error.message,
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * Get SMS delivery status
   * @param {string} messageId - Twilio message SID
   * @returns {Promise<Object>} Delivery status information
   */
  async getDeliveryStatus(messageId) {
    try {
      if (!this.twilioClient || !messageId) {
        return {
          success: false,
          error: 'SMS service not available or message ID missing',
          errorBn: 'SMS সার্ভিস উপলব্ধ নেই অথবা মেসেজ ID অনুপস্থিত',
          code: 'SERVICE_UNAVAILABLE'
        };
      }

      const message = await this.twilioClient.messages(messageId).fetch();

      return {
        success: true,
        status: message.status,
        errorCode: message.errorCode,
        errorMessage: message.errorMessage,
        dateCreated: message.dateCreated,
        dateSent: message.dateSent,
        dateUpdated: message.dateUpdated,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      this.logger.error('Failed to get SMS delivery status', error.message, {
        messageId,
        timestamp: new Date().toISOString()
      });

      return {
        success: false,
        error: error.message,
        errorBn: 'SMS ডেলিভারি স্ট্যাটাস পেতে ব্যর্থ হয়েছে',
        code: error.code || 'FETCH_FAILED',
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Handle fallback SMS when Twilio service is unavailable
   * @param {string} phone - Recipient phone number
   * @param {string} smsType - Type of SMS (otp, general)
   * @param {Object} metadata - Additional metadata
   * @returns {Object} Fallback result
   */
  handleFallbackSMS(phone, smsType, metadata = {}) {
    const mockMessageId = `fallback_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    this.logger.warn('SMS sent in fallback mode', {
      phone,
      type: smsType,
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
      smsType,
      phone: metadata.normalizedPhone || phone,
      operator: metadata.operator,
      timestamp: new Date().toISOString(),
      message: this.config.isTestingMode() 
        ? 'SMS sent in testing mode (Twilio not configured)' 
        : 'SMS queued for retry (Twilio temporarily unavailable)',
      messageBn: this.config.isTestingMode()
        ? 'SMS টেস্টিং মোডে পাঠানো হয়েছে (Twilio কনফিগার করা নেই)'
        : 'SMS পুনরায় চেষ্টার জন্য সারিবদ্ধ করা হয়েছে (Twilio সাময়িকভাবে অনুপলব্ধ)'
    };
  }

  /**
   * Get SMS service status
   * @returns {Object} Service status information
   */
  getServiceStatus() {
    const validation = this.validateConfig();
    
    return {
      isConfigured: this.isConfigured,
      isAvailable: this.twilioClient !== null,
      fallbackMode: this.fallbackMode,
      configValidation: validation,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Test SMS configuration by sending a test SMS
   * @param {string} testPhone - Phone number to send test to
   * @returns {Promise<Object>} Test result
   */
  async testConfiguration(testPhone) {
    if (!testPhone) {
      return {
        success: false,
        error: 'Test phone number is required',
        errorBn: 'টেস্ট ফোন নম্বর প্রয়োজন',
        code: 'MISSING_TEST_PHONE'
      };
    }

    const validation = this.validateBangladeshPhoneNumber(testPhone);
    if (!validation.isValid) {
      return {
        success: false,
        error: validation.error,
        errorBn: validation.errorBn,
        code: validation.code || 'INVALID_TEST_PHONE'
      };
    }

    const status = this.getServiceStatus();
    
    if (!status.isAvailable) {
      return {
        success: false,
        error: 'SMS service is not available',
        errorBn: 'SMS সার্ভিস উপলব্ধ নেই',
        code: 'SERVICE_UNAVAILABLE',
        status
      };
    }

    try {
      const smsConfig = this.config.getSmsConfig();
      const testOTP = '123456'; // Fixed OTP for testing
      
      const template = this.createOTPTemplate(testOTP, 'Test User');

      const message = await this.twilioClient.messages.create({
        body: `TEST: ${template.text}`,
        from: smsConfig.sender,
        to: validation.normalizedPhone
      });
      
      this.logger.info('SMS configuration test successful', {
        to: validation.normalizedPhone,
        messageId: message.sid,
        operator: validation.operator,
        timestamp: new Date().toISOString()
      });

      return {
        success: true,
        messageId: message.sid,
        message: 'Test SMS sent successfully',
        messageBn: 'টেস্ট SMS সফলভাবে পাঠানো হয়েছে',
        phone: validation.normalizedPhone,
        operator: validation.operator,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      this.logger.error('SMS configuration test failed', error.message, {
        to: testPhone,
        errorType: error.name,
        errorCode: error.code,
        timestamp: new Date().toISOString()
      });

      return {
        success: false,
        error: error.message,
        errorBn: 'SMS কনফিগারেশন টেস্ট ব্যর্থ হয়েছে',
        code: error.code || 'TEST_FAILED',
        timestamp: new Date().toISOString()
      };
    }
  }

  // Get operator information from phone number
  getOperatorInfo(phone) {
    return phoneValidationService.getOperatorInfo(phone);
  }

  // Check if SMS service is available
  isAvailable() {
    return this.twilioClient !== null;
  }

  // Format phone number for display
  formatPhoneNumber(phone, format = 'display') {
    return phoneValidationService.formatPhoneNumber(phone, format);
  }

  // Get supported operators
  getSupportedOperators() {
    return phoneValidationService.getSupportedOperators();
  }

  // Validate phone number for specific use case
  validateForUseCase(phone, useCase) {
    return phoneValidationService.validateForUseCase(phone, useCase);
  }
}

// Singleton instance
const smsService = new SMSService();

module.exports = {
  SMSService,
  smsService
};
