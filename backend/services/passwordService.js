const zxcvbn = require('zxcvbn');
const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');
const { configService } = require('./config');

const prisma = new PrismaClient();

class PasswordService {
  constructor() {
    this.securityConfig = configService.getSecurityConfig();
    this.passwordPolicy = configService.getPasswordPolicyConfig();
  }

  /**
   * Validate password strength using zxcvbn and custom rules
   * @param {string} password - The password to validate
   * @param {Object} userInfo - User information for contextual validation
   * @returns {Object} Validation result with score and feedback
   */
  validatePasswordStrength(password, userInfo = {}) {
    const result = {
      isValid: false,
      score: 0,
      feedback: [],
      warnings: [],
      strength: 'very_weak',
      meetsRequirements: false
    };

    // Basic length validation
    if (password.length < this.passwordPolicy.minLength) {
      result.feedback.push(`Password must be at least ${this.passwordPolicy.minLength} characters long`);
    }

    if (password.length > this.passwordPolicy.maxLength) {
      result.feedback.push(`Password must not exceed ${this.passwordPolicy.maxLength} characters`);
    }

    // Use zxcvbn for comprehensive analysis
    const zxcvbnResult = zxcvbn(password, [
      userInfo.firstName,
      userInfo.lastName,
      userInfo.email,
      userInfo.phone
    ]);

    // Extract zxcvbn feedback
    result.score = zxcvbnResult.score;
    result.warnings = zxcvbnResult.feedback.warning ? [zxcvbnResult.feedback.warning] : [];
    result.suggestions = zxcvbnResult.feedback.suggestions || [];

    // Map score to strength levels
    const strengthLevels = ['very_weak', 'weak', 'fair', 'good', 'strong'];
    result.strength = strengthLevels[result.score] || 'very_weak';

    // Custom validation rules for Bangladesh context
    this.validateCustomRules(password, userInfo, result);

    // Check if meets minimum requirements
    result.meetsRequirements = this.checkMinimumRequirements(password, result);

    // Overall validation
    result.isValid = result.meetsRequirements && result.score >= this.passwordPolicy.minStrengthScore;

    return result;
  }

  /**
   * Validate custom password rules
   * @param {string} password - The password to validate
   * @param {Object} userInfo - User information
   * @param {Object} result - Validation result object to update
   */
  validateCustomRules(password, userInfo, result) {
    // Check for uppercase letters if required
    if (this.passwordPolicy.requireUppercase && !/[A-Z]/.test(password)) {
      result.feedback.push('Password must contain at least one uppercase letter');
    }

    // Check for lowercase letters if required
    if (this.passwordPolicy.requireLowercase && !/[a-z]/.test(password)) {
      result.feedback.push('Password must contain at least one lowercase letter');
    }

    // Check for numbers if required
    if (this.passwordPolicy.requireNumbers && !/\d/.test(password)) {
      result.feedback.push('Password must contain at least one number');
    }

    // Check for special characters if required
    if (this.passwordPolicy.requireSpecialChars && !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      result.feedback.push('Password must contain at least one special character');
    }

    // Check for sequential characters if prevention is enabled
    if (this.passwordPolicy.preventSequential && this.hasSequentialChars(password)) {
      result.feedback.push('Password cannot contain sequential characters (e.g., "123", "abc")');
    }

    // Check for repeated characters if prevention is enabled
    if (this.passwordPolicy.preventRepeated && this.hasRepeatedChars(password)) {
      result.feedback.push('Password cannot contain repeated characters (e.g., "aaa", "111")');
    }

    // Check for common Bangladeshi patterns if enabled
    if (this.passwordPolicy.bangladeshPatterns) {
      const bangladeshiPatterns = ['bangladesh', 'dhaka', 'taka', 'bdt', 'bd'];
      const lowerPassword = password.toLowerCase();
      for (const pattern of bangladeshiPatterns) {
        if (lowerPassword.includes(pattern)) {
          result.feedback.push(`Password cannot contain common Bangladeshi terms like "${pattern}"`);
          break;
        }
      }
    }

    // Check for personal information if prevention is enabled
    if (this.passwordPolicy.preventPersonalInfo) {
      if (userInfo.firstName && lowerPassword.includes(userInfo.firstName.toLowerCase())) {
        result.feedback.push('Password cannot contain your first name');
      }

      if (userInfo.lastName && lowerPassword.includes(userInfo.lastName.toLowerCase())) {
        result.feedback.push('Password cannot contain your last name');
      }

      if (userInfo.email && lowerPassword.includes(userInfo.email.split('@')[0].toLowerCase())) {
        result.feedback.push('Password cannot contain your email username');
      }

      if (userInfo.phone && lowerPassword.includes(userInfo.phone.replace(/\D/g, '').slice(-4))) {
        result.feedback.push('Password cannot contain parts of your phone number');
      }
    }
  }

  /**
   * Check if password has sequential characters
   * @param {string} password - The password to check
   * @returns {boolean} True if sequential characters found
   */
  hasSequentialChars(password) {
    const lowerPassword = password.toLowerCase();
    
    // Check for sequential numbers (123, 234, etc.)
    for (let i = 0; i < lowerPassword.length - 2; i++) {
      const char1 = lowerPassword.charCodeAt(i);
      const char2 = lowerPassword.charCodeAt(i + 1);
      const char3 = lowerPassword.charCodeAt(i + 2);
      
      if (char2 === char1 + 1 && char3 === char2 + 1) {
        return true;
      }
      if (char2 === char1 - 1 && char3 === char2 - 1) {
        return true;
      }
    }
    
    return false;
  }

  /**
   * Check if password has repeated characters
   * @param {string} password - The password to check
   * @returns {boolean} True if repeated characters found
   */
  hasRepeatedChars(password) {
    for (let i = 0; i < password.length - 2; i++) {
      if (password[i] === password[i + 1] && password[i] === password[i + 2]) {
        return true;
      }
    }
    return false;
  }

  /**
   * Check if password meets minimum requirements
   * @param {string} password - The password to check
   * @param {Object} result - Validation result object
   * @returns {boolean} True if meets requirements
   */
  checkMinimumRequirements(password, result) {
    const hasMinLength = password.length >= this.passwordPolicy.passwordMinLength;
    const hasMaxLength = password.length <= this.passwordPolicy.passwordMaxLength;
    const hasUppercase = /[A-Z]/.test(password);
    const hasLowercase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChars = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);
    const noSequentialChars = !this.hasSequentialChars(password);
    const noRepeatedChars = !this.hasRepeatedChars(password);

    return hasMinLength && hasMaxLength && hasUppercase && hasLowercase && 
           hasNumbers && hasSpecialChars && noSequentialChars && noRepeatedChars;
  }

  /**
   * Hash password using bcrypt
   * @param {string} password - The password to hash
   * @returns {Promise<string>} Hashed password
   */
  async hashPassword(password) {
    return await bcrypt.hash(password, this.passwordPolicy.bcryptRounds);
  }

  /**
   * Verify password against hash
   * @param {string} password - The password to verify
   * @param {string} hash - The hash to verify against
   * @returns {Promise<boolean>} True if password matches
   */
  async verifyPassword(password, hash) {
    return await bcrypt.compare(password, hash);
  }

  /**
   * Save password to history
   * @param {string} userId - User ID
   * @param {string} passwordHash - Hashed password
   * @returns {Promise<Object>} Created password history record
   */
  async savePasswordToHistory(userId, passwordHash) {
    try {
      // Clean up old password history (keep only last 5)
      await this.cleanupOldPasswordHistory(userId);

      const passwordHistory = await prisma.passwordHistory.create({
        data: {
          userId,
          passwordHash
        }
      });

      return passwordHistory;
    } catch (error) {
      console.error('Error saving password to history:', error);
      throw new Error('Failed to save password to history');
    }
  }

  /**
   * Check if password has been used before
   * @param {string} userId - User ID
   * @param {string} newPassword - New password to check
   * @returns {Promise<boolean>} True if password has been used before
   */
  async isPasswordReused(userId, newPassword) {
    try {
      const passwordHistory = await prisma.passwordHistory.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 5 // Check last 5 passwords
      });

      for (const historyEntry of passwordHistory) {
        const isMatch = await this.verifyPassword(newPassword, historyEntry.passwordHash);
        if (isMatch) {
          return true;
        }
      }

      return false;
    } catch (error) {
      console.error('Error checking password reuse:', error);
      throw new Error('Failed to check password reuse');
    }
  }

  /**
   * Clean up old password history
   * @param {string} userId - User ID
   * @returns {Promise<void>}
   */
  async cleanupOldPasswordHistory(userId) {
    try {
      // Get all password history for user, ordered by creation date
      const allHistory = await prisma.passwordHistory.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' }
      });

      // If more than 5, delete the oldest ones
      if (allHistory.length > 5) {
        const toDelete = allHistory.slice(5);
        const idsToDelete = toDelete.map(entry => entry.id);

        await prisma.passwordHistory.deleteMany({
          where: {
            id: { in: idsToDelete }
          }
        });
      }
    } catch (error) {
      console.error('Error cleaning up password history:', error);
      // Don't throw error here, as this is not critical
    }
  }

  /**
   * Generate strong temporary password
   * @param {number} length - Password length (default 12)
   * @returns {string} Generated password
   */
  generateStrongPassword(length = 12) {
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const numbers = '0123456789';
    const specialChars = '!@#$%^&*()_+-=[]{}|;:,.<>?';
    
    const allChars = uppercase + lowercase + numbers + specialChars;
    let password = '';

    // Ensure at least one of each type
    password += uppercase[Math.floor(Math.random() * uppercase.length)];
    password += lowercase[Math.floor(Math.random() * lowercase.length)];
    password += numbers[Math.floor(Math.random() * numbers.length)];
    password += specialChars[Math.floor(Math.random() * specialChars.length)];

    // Fill the rest with random characters
    for (let i = 4; i < length; i++) {
      password += allChars[Math.floor(Math.random() * allChars.length)];
    }

    // Shuffle the password
    return password.split('').sort(() => Math.random() - 0.5).join('');
  }

  /**
   * Get password policy configuration
   * @returns {Object} Password policy configuration
   */
  getPasswordPolicy() {
    return {
      minLength: this.passwordPolicy.passwordMinLength,
      maxLength: this.passwordPolicy.passwordMaxLength,
      requireUppercase: true,
      requireLowercase: true,
      requireNumbers: true,
      requireSpecialChars: true,
      preventSequential: true,
      preventRepeated: true,
      preventPersonalInfo: true,
      preventCommonPatterns: true,
      minStrengthScore: 2,
      historyLimit: 5
    };
  }

  /**
   * Get password strength feedback in Bengali
   * @param {Object} validationResult - Password validation result
   * @returns {Object} Localized feedback
   */
  getLocalizedFeedback(validationResult) {
    const bengaliStrength = {
      very_weak: 'অত্যন্ত দুর্বল',
      weak: 'দুর্বল',
      fair: 'মোটামুটি',
      good: 'ভালো',
      strong: 'শক্তি'
    };

    const bengaliFeedback = {
      'Password must be at least': 'পাসওয়ার্ড অবশ্যই',
      'Password must not exceed': 'পাসওয়ার্ড',
      'Password must contain at least one uppercase letter': 'পাসওয়ার্ডে অবশ্যই একটি বড় হাতের অক্ষর থাকতে হবে',
      'Password must contain at least one lowercase letter': 'পাসওয়ার্ডে অবশ্যই একটি ছোট হাতের অক্ষর থাকতে হবে',
      'Password must contain at least one number': 'পাসওয়ার্ডে অবশ্যই একটি সংখ্যা থাকতে হবে',
      'Password must contain at least one special character': 'পাসওয়ার্ডে অবশ্যই একটি বিশেষ অক্ষর থাকতে হবে',
      'Password cannot contain sequential characters': 'পাসওয়ার্ডে ক্রমিক অক্ষর থাকতে পারে না',
      'Password cannot contain repeated characters': 'পাসওয়ার্ডে পুনরাবৃত্তি অক্ষর থাকতে পারে না',
      'Password cannot contain your first name': 'পাসওয়ার্ডে আপনার প্রথম নাম থাকতে পারে না',
      'Password cannot contain your last name': 'পাসওয়ার্ডে আপনার শেষ নাম থাকতে পারে না',
      'Password cannot contain your email username': 'পাসওয়ার্ডে আপনার ইমেল ব্যবহারকারী নাম থাকতে পারে না',
      'Password cannot contain parts of your phone number': 'পাসওয়ার্ডে আপনার ফোন নম্বরের অংশ থাকতে পারে না',
      'Password cannot contain common Bangladeshi terms': 'পাসওয়ার্ডে সাধারণ বাংলাদেশী শব্দ থাকতে পারে না'
    };

    return {
      ...validationResult,
      strength: bengaliStrength[validationResult.strength] || validationResult.strength,
      feedback: validationResult.feedback.map(msg => {
        for (const [english, bengali] of Object.entries(bengaliFeedback)) {
          if (msg.includes(english)) {
            return msg.replace(english, bengali);
          }
        }
        return msg;
      })
    };
  }
}

// Singleton instance
const passwordService = new PasswordService();

module.exports = {
  PasswordService,
  passwordService
};