const twilio = require('twilio');
const configService = require('./config');
const { loggerService } = require('./logger');
const { phoneValidationService } = require('./phoneValidationService');

class SMSService {
  constructor() {
    this.config = configService;
    this.logger = loggerService;
    this.twilioClient = null;
    this.initializeTwilio();
  }

  initializeTwilio() {
    try {
      const smsConfig = this.config.getSMSConfig();
      
      if (!smsConfig.twilioAccountSid || !smsConfig.twilioAuthToken || !smsConfig.twilioPhoneNumber) {
        this.logger.warn('Twilio SMS service not configured - missing credentials');
        return;
      }

      this.twilioClient = twilio(smsConfig.twilioAccountSid, smsConfig.twilioAuthToken);
      this.logger.info('Twilio SMS service initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize Twilio SMS service', error.message);
      this.twilioClient = null;
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

  // Send OTP via SMS
  async sendOTP(phone, otp, userName = '') {
    try {
      const validation = this.validateBangladeshPhoneNumber(phone);
      if (!validation.isValid) {
        return {
          success: false,
          error: validation.error,
          errorBn: validation.errorBn,
          code: validation.code || 'INVALID_PHONE'
        };
      }

      if (!this.twilioClient) {
        // Fallback to mock SMS for development
        this.logger.warn('SMS service not available, using mock SMS', {
          phone: validation.normalizedPhone,
          otp,
          timestamp: new Date().toISOString()
        });

        return {
          success: true,
          messageId: `mock_${Date.now()}`,
          phone: validation.normalizedPhone,
          operator: validation.operator,
          mock: true,
          timestamp: new Date().toISOString()
        };
      }

      const smsConfig = this.config.getSMSConfig();
      const template = this.createOTPTemplate(otp, userName);

      const message = await this.twilioClient.messages.create({
        body: template.text,
        from: smsConfig.twilioPhoneNumber,
        to: validation.normalizedPhone
      });

      this.logger.info('OTP SMS sent successfully', {
        to: validation.normalizedPhone,
        messageId: message.sid,
        operator: validation.operator,
        timestamp: new Date().toISOString()
      });

      return {
        success: true,
        messageId: message.sid,
        phone: validation.normalizedPhone,
        operator: validation.operator,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      this.logger.error('Failed to send OTP SMS', error.message, {
        phone,
        errorType: error.name,
        errorCode: error.code
      });

      return {
        success: false,
        error: error.message,
        code: error.code || 'SMS_SEND_FAILED'
      };
    }
  }

  // Send general SMS
  async sendSMS(phone, message, options = {}) {
    try {
      const validation = this.validateBangladeshPhoneNumber(phone);
      if (!validation.isValid) {
        return {
          success: false,
          error: validation.error,
          errorBn: validation.errorBn,
          code: validation.code || 'INVALID_PHONE'
        };
      }

      if (!this.twilioClient) {
        // Fallback to mock SMS for development
        this.logger.warn('SMS service not available, using mock SMS', {
          phone: validation.normalizedPhone,
          message: message.substring(0, 100) + '...',
          timestamp: new Date().toISOString()
        });

        return {
          success: true,
          messageId: `mock_${Date.now()}`,
          phone: validation.normalizedPhone,
          operator: validation.operator,
          mock: true,
          timestamp: new Date().toISOString()
        };
      }

      const smsConfig = this.config.getSMSConfig();

      const twilioMessage = await this.twilioClient.messages.create({
        body: message,
        from: smsConfig.twilioPhoneNumber,
        to: validation.normalizedPhone,
        ...options
      });

      this.logger.info('SMS sent successfully', {
        to: validation.normalizedPhone,
        messageId: twilioMessage.sid,
        operator: validation.operator,
        timestamp: new Date().toISOString()
      });

      return {
        success: true,
        messageId: twilioMessage.sid,
        phone: validation.normalizedPhone,
        operator: validation.operator,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      this.logger.error('Failed to send SMS', error.message, {
        phone,
        errorType: error.name,
        errorCode: error.code
      });

      return {
        success: false,
        error: error.message,
        code: error.code || 'SMS_SEND_FAILED'
      };
    }
  }

  // Check SMS delivery status
  async getDeliveryStatus(messageId) {
    try {
      if (!this.twilioClient || !messageId) {
        return {
          success: false,
          error: 'SMS service not available or message ID missing'
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
        dateUpdated: message.dateUpdated
      };

    } catch (error) {
      this.logger.error('Failed to get SMS delivery status', error.message, {
        messageId
      });

      return {
        success: false,
        error: error.message
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