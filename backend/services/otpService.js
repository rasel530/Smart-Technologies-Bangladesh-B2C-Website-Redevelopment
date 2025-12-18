const speakeasy = require('speakeasy');
const crypto = require('crypto');
const { PrismaClient } = require('@prisma/client');
const { smsService } = require('./smsService');
const configService = require('./config');
const loggerService = require('./logger');
const { phoneValidationService } = require('./phoneValidationService');

class OTPService {
  constructor() {
    this.config = configService;
    this.logger = loggerService;
    this.prisma = new PrismaClient();
    this.OTP_LENGTH = 6;
    this.OTP_EXPIRY_MINUTES = 5;
    this.MAX_ATTEMPTS_PER_HOUR = 3;
    this.MAX_VERIFICATION_ATTEMPTS = 3;
  }

  // Generate secure 6-digit OTP
  generateOTP() {
    return speakeasy.totp({
      secret: crypto.randomBytes(32).toString('hex'),
      encoding: 'base32',
      digits: this.OTP_LENGTH,
      time: Math.floor(Date.now() / 1000)
    });
  }

  // Generate OTP for phone number
  async generatePhoneOTP(phone, userId = null) {
    try {
      // Validate phone number with enhanced service
      const phoneValidation = phoneValidationService.validateForUseCase(phone, 'otp');
      if (!phoneValidation.isValid) {
        return {
          success: false,
          error: phoneValidation.error,
          errorBn: phoneValidation.errorBn,
          code: phoneValidation.code || 'INVALID_PHONE'
        };
      }

      const normalizedPhone = phoneValidation.normalizedPhone;

      // Check rate limiting - max 3 OTPs per hour per phone
      const recentOTPs = await this.prisma.phoneOTP.findMany({
        where: {
          phone: normalizedPhone,
          createdAt: {
            gte: new Date(Date.now() - 60 * 60 * 1000) // Last hour
          }
        }
      });

      if (recentOTPs.length >= this.MAX_ATTEMPTS_PER_HOUR) {
        this.logger.logSecurity('OTP Rate Limit Exceeded', userId || 'anonymous', {
          phone: normalizedPhone,
          attemptCount: recentOTPs.length,
          timeWindow: '1 hour'
        });

        return {
          success: false,
          error: 'Too many OTP requests. Please try again later.',
          errorBn: 'অত্যাধিক OTP অনুরোধ। অনুগ্রহ পরে চেষ্টা করুন।',
          code: 'RATE_LIMIT_EXCEEDED',
          retryAfter: 60 * 60 // seconds
        };
      }

      // Delete any existing unverified OTPs for this phone
      await this.prisma.phoneOTP.deleteMany({
        where: {
          phone: normalizedPhone,
          verifiedAt: null,
          expiresAt: {
            gt: new Date()
          }
        }
      });

      // Generate new OTP
      const otp = this.generateOTP();
      const expiresAt = new Date(Date.now() + this.OTP_EXPIRY_MINUTES * 60 * 1000);

      // Save OTP to database
      const phoneOTP = await this.prisma.phoneOTP.create({
        data: {
          userId,
          phone: normalizedPhone,
          otp,
          expiresAt
        }
      });

      // Send OTP via SMS
      const smsResult = await smsService.sendOTP(normalizedPhone, otp);

      if (!smsResult.success) {
        // Delete OTP if SMS failed
        await this.prisma.phoneOTP.delete({
          where: { id: phoneOTP.id }
        });

        return {
          success: false,
          error: 'Failed to send OTP via SMS',
          errorBn: 'SMS এর মাধ্যমে OTP পাঠানো ব্যর্থ হয়েছে',
          details: smsResult.error,
          code: 'SMS_SEND_FAILED'
        };
      }

      this.logger.info('OTP generated and sent successfully', {
        phoneOTPId: phoneOTP.id,
        phone: normalizedPhone,
        operator: phoneValidation.operator,
        operatorDetails: phoneValidation.operatorDetails,
        messageId: smsResult.messageId,
        expiresAt,
        userId
      });

      return {
        success: true,
        phoneOTPId: phoneOTP.id,
        phone: normalizedPhone,
        operator: phoneValidation.operator,
        operatorDetails: phoneValidation.operatorDetails,
        expiresAt,
        message: 'OTP sent successfully',
        messageBn: 'OTP সফলভভাবে পাঠানো হয়েছে',
        mock: smsResult.mock || false
      };

    } catch (error) {
      this.logger.error('Failed to generate phone OTP', error.message, {
        phone,
        userId
      });

      return {
        success: false,
        error: 'Failed to generate OTP',
        errorBn: 'OTP জেনারেট করতে ব্যর্থ হয়েছে',
        code: 'GENERATION_FAILED'
      };
    }
  }

  // Verify OTP
  async verifyPhoneOTP(phone, otp, userId = null) {
    try {
      // Validate phone number with enhanced service
      const phoneValidation = phoneValidationService.validateForUseCase(phone, 'otp');
      if (!phoneValidation.isValid) {
        return {
          success: false,
          error: phoneValidation.error,
          errorBn: phoneValidation.errorBn,
          code: phoneValidation.code || 'INVALID_PHONE'
        };
      }

      const normalizedPhone = phoneValidation.normalizedPhone;

      // Find valid OTP
      const phoneOTP = await this.prisma.phoneOTP.findFirst({
        where: {
          phone: normalizedPhone,
          otp,
          verifiedAt: null,
          expiresAt: {
            gt: new Date()
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      });

      if (!phoneOTP) {
        this.logger.logSecurity('Invalid OTP Verification Attempt', userId || 'anonymous', {
          phone: normalizedPhone,
          providedOTP: otp,
          timestamp: new Date().toISOString()
        });

        return {
          success: false,
          error: 'Invalid or expired OTP',
          errorBn: 'অবৈধ বা মেয়ে উত্তীর্ণ OTP',
          code: 'INVALID_OTP'
        };
      }

      // Check verification attempts
      if (phoneOTP.attempts && phoneOTP.attempts >= this.MAX_VERIFICATION_ATTEMPTS) {
        this.logger.logSecurity('OTP Max Attempts Exceeded', userId || 'anonymous', {
          phoneOTPId: phoneOTP.id,
          phone: normalizedPhone,
          attempts: phoneOTP.attempts
        });

        return {
          success: false,
          error: 'Maximum verification attempts exceeded. Please request a new OTP.',
          errorBn: 'সর্বাধিক যাচাই প্রচেষ্টা অতিক্রম। অনুগ্রহ নতুন OTP অনুরোধ করুন।',
          code: 'MAX_ATTEMPTS_EXCEEDED'
        };
      }

      // Increment attempt counter
      await this.prisma.phoneOTP.update({
        where: { id: phoneOTP.id },
        data: {
          attempts: (phoneOTP.attempts || 0) + 1
        }
      });

      // Mark OTP as verified
      await this.prisma.phoneOTP.update({
        where: { id: phoneOTP.id },
        data: {
          verifiedAt: new Date()
        }
      });

      // Update user phone verification status if userId is provided
      if (phoneOTP.userId) {
        await this.prisma.user.update({
          where: { id: phoneOTP.userId },
          data: {
            phoneVerified: new Date(),
            status: 'ACTIVE'
          }
        });
      }

      this.logger.info('OTP verified successfully', {
        phoneOTPId: phoneOTP.id,
        phone: normalizedPhone,
        userId: phoneOTP.userId,
        verifiedAt: new Date().toISOString()
      });

      return {
        success: true,
        message: 'OTP verified successfully',
        messageBn: 'OTP সফলভভাবে যাচাই হয়েছে',
        phone: normalizedPhone,
        userId: phoneOTP.userId,
        verifiedAt: new Date()
      };

    } catch (error) {
      this.logger.error('Failed to verify phone OTP', error.message, {
        phone,
        otp,
        userId
      });

      return {
        success: false,
        error: 'Failed to verify OTP',
        errorBn: 'OTP যাচাই করতে ব্যর্থ হয়েছে',
        code: 'VERIFICATION_FAILED'
      };
    }
  }

  // Resend OTP
  async resendPhoneOTP(phone, userId = null) {
    try {
      // Validate phone number with enhanced service
      const phoneValidation = phoneValidationService.validateForUseCase(phone, 'otp');
      if (!phoneValidation.isValid) {
        return {
          success: false,
          error: phoneValidation.error,
          errorBn: phoneValidation.errorBn,
          code: phoneValidation.code || 'INVALID_PHONE'
        };
      }

      const normalizedPhone = phoneValidation.normalizedPhone;

      // Check for recent OTP (within 2 minutes)
      const recentOTP = await this.prisma.phoneOTP.findFirst({
        where: {
          phone: normalizedPhone,
          verifiedAt: null,
          expiresAt: {
            gt: new Date()
          },
          createdAt: {
            gte: new Date(Date.now() - 2 * 60 * 1000) // Last 2 minutes
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      });

      if (recentOTP) {
        const timeSinceLastOTP = Date.now() - recentOTP.createdAt.getTime();
        const waitTime = Math.ceil((2 * 60 * 1000 - timeSinceLastOTP) / 1000);

        return {
          success: false,
          error: `Please wait ${waitTime} seconds before requesting another OTP`,
          errorBn: `অন্য OTP অনুরোধ করার জন্য ${waitTime} সেকেন্ড অপেক্ষা করুন`,
          code: 'RESEND_TOO_SOON',
          waitTime
        };
      }

      // Generate new OTP
      return await this.generatePhoneOTP(normalizedPhone, userId);

    } catch (error) {
      this.logger.error('Failed to resend phone OTP', error.message, {
        phone,
        userId
      });

      return {
        success: false,
        error: 'Failed to resend OTP',
        errorBn: 'OTP পুনরায় পাঠানো ব্যর্থ হয়েছে',
        code: 'RESEND_FAILED'
      };
    }
  }

  // Clean up expired OTPs
  async cleanupExpiredOTPs() {
    try {
      const deletedCount = await this.prisma.phoneOTP.deleteMany({
        where: {
          expiresAt: {
            lt: new Date()
          }
        }
      });

      if (deletedCount.count > 0) {
        this.logger.info('Cleaned up expired OTPs', {
          deletedCount: deletedCount.count
        });
      }

      return deletedCount.count;

    } catch (error) {
      this.logger.error('Failed to cleanup expired OTPs', error.message);
      return 0;
    }
  }

  // Get OTP statistics
  async getOTPStats(phone, timeRange = '24h') {
    try {
      const phoneValidation = phoneValidationService.validateForUseCase(phone, 'otp');
      if (!phoneValidation.isValid) {
        return null;
      }

      const normalizedPhone = phoneValidation.normalizedPhone;
      let timeFilter;

      switch (timeRange) {
        case '1h':
          timeFilter = new Date(Date.now() - 60 * 60 * 1000);
          break;
        case '24h':
          timeFilter = new Date(Date.now() - 24 * 60 * 60 * 1000);
          break;
        case '7d':
          timeFilter = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
          break;
        default:
          timeFilter = new Date(Date.now() - 24 * 60 * 60 * 1000);
      }

      const stats = await this.prisma.phoneOTP.groupBy({
        by: ['verifiedAt'],
        where: {
          phone: normalizedPhone,
          createdAt: {
            gte: timeFilter
          }
        },
        _count: {
          id: true
        }
      });

      return {
        phone: normalizedPhone,
        timeRange,
        totalOTPs: stats.reduce((sum, stat) => sum + stat._count.id, 0),
        verifiedOTPs: stats.filter(stat => stat.verifiedAt !== null).length,
        unverifiedOTPs: stats.filter(stat => stat.verifiedAt === null).length
      };

    } catch (error) {
      this.logger.error('Failed to get OTP stats', error.message, {
        phone,
        timeRange
      });
      return null;
    }
  }

  // Check if phone is already verified
  async isPhoneVerified(phone) {
    try {
      const phoneValidation = phoneValidationService.validateForUseCase(phone, 'verification');
      if (!phoneValidation.isValid) {
        return false;
      }

      const user = await this.prisma.user.findFirst({
        where: {
          phone: phoneValidation.normalizedPhone,
          phoneVerified: {
            not: null
          }
        }
      });

      return !!user;

    } catch (error) {
      this.logger.error('Failed to check phone verification status', error.message, {
        phone
      });
      return false;
    }
  }

  // Get phone validation info
  getPhoneValidationInfo(phone) {
    return phoneValidationService.validateBangladeshPhoneNumber(phone);
  }

  // Format phone number for display
  formatPhoneNumber(phone, format = 'display') {
    return phoneValidationService.formatPhoneNumber(phone, format);
  }
}

// Singleton instance
const otpService = new OTPService();

module.exports = {
  OTPService,
  otpService
};