const { PrismaClient } = require('@prisma/client');
const { loggerService } = require('./logger');
const { passwordService } = require('./passwordService');
const crypto = require('crypto');

const prisma = new PrismaClient();

/**
 * Account Preferences Service
 * Handles all user preference operations including notification and privacy settings
 */
class AccountPreferencesService {
  constructor() {
    this.prisma = prisma;
    this.logger = loggerService;
    this.passwordService = passwordService;
  }

  /**
   * Get user preferences by user ID
   * @param {string} userId - User ID
   * @returns {Promise<Object>} User preferences
   */
  async getUserPreferences(userId) {
    try {
      // Get all preference types
      const notificationPrefs = await this.prisma.userNotificationPreferences.findUnique({
        where: { userId }
      });
      const communicationPrefs = await this.prisma.userCommunicationPreferences.findUnique({
        where: { userId }
      });
      const privacyPrefs = await this.prisma.userPrivacySettings.findUnique({
        where: { userId }
      });

      // If no preferences exist, create default preferences
      if (!notificationPrefs) {
        await this.initializeDefaultNotificationPreferences(userId);
      }
      if (!communicationPrefs) {
        await this.initializeDefaultCommunicationPreferences(userId);
      }
      if (!privacyPrefs) {
        await this.initializeDefaultPrivacySettings(userId);
      }

      return { notificationPrefs, communicationPrefs, privacyPrefs };
    } catch (error) {
      this.logger.error('Error getting user preferences', error);
      throw new Error('Failed to get user preferences');
    }
  }

  /**
   * Initialize default notification preferences for a new user
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Created default preferences
   */
  async initializeDefaultNotificationPreferences(userId) {
    try {
      const preferences = await this.prisma.userNotificationPreferences.create({
        data: {
          userId,
          emailNotifications: true,
          smsNotifications: false,
          whatsappNotifications: false,
          pushNotifications: true,
          orderUpdates: true,
          promotionalEmails: true,
          securityAlerts: true
        }
      });

      this.logger.info('Default notification preferences initialized', { userId });
      return preferences;
    } catch (error) {
      this.logger.error('Error initializing default notification preferences', error);
      throw new Error('Failed to initialize default notification preferences');
    }
  }

  /**
   * Initialize default communication preferences for a new user
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Created default preferences
   */
  async initializeDefaultCommunicationPreferences(userId) {
    try {
      const preferences = await this.prisma.userCommunicationPreferences.create({
        data: {
          userId,
          preferredLanguage: 'en',
          preferredTimezone: 'UTC',
          preferredContactMethod: 'email',
          marketingConsent: false,
          dataSharingConsent: false
        }
      });

      this.logger.info('Default communication preferences initialized', { userId });
      return preferences;
    } catch (error) {
      this.logger.error('Error initializing default communication preferences', error);
      throw new Error('Failed to initialize default communication preferences');
    }
  }

  /**
   * Initialize default privacy settings for a new user
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Created default preferences
   */
  async initializeDefaultPrivacySettings(userId) {
    try {
      const preferences = await this.prisma.userPrivacySettings.create({
        data: {
          userId,
          profileVisibility: 'PRIVATE',
          showEmail: false,
          showPhone: false,
          showAddress: false,
          allowSearchByEmail: false,
          allowSearchByPhone: false,
          twoFactorEnabled: false,
          twoFactorSecret: null,
          twoFactorMethod: null,
          dataSharingEnabled: true
        }
      });

      this.logger.info('Default privacy settings initialized', { userId });
      return preferences;
    } catch (error) {
      this.logger.error('Error initializing default privacy settings', error);
      throw new Error('Failed to initialize default privacy settings');
    }
  }

  /**
   * Update notification preferences
   * @param {string} userId - User ID
   * @param {Object} updates - Preference updates
   * @returns {Promise<Object>} Updated preferences
   */
  async updateNotificationPreferences(userId, preferences) {
    try {
      // Check if preferences exist
      let existingPrefs = await this.prisma.userNotificationPreferences.findUnique({
        where: { userId }
      });

      // Map frontend field names to backend field names
      const updateData = {};
      if (preferences.emailNotifications !== undefined || preferences.email !== undefined) {
        updateData.emailNotifications = preferences.emailNotifications ?? preferences.email;
      }
      if (preferences.smsNotifications !== undefined || preferences.sms !== undefined) {
        updateData.smsNotifications = preferences.smsNotifications ?? preferences.sms;
      }
      if (preferences.whatsappNotifications !== undefined || preferences.whatsapp !== undefined) {
        updateData.whatsappNotifications = preferences.whatsappNotifications ?? preferences.whatsapp;
      }
      if (preferences.marketingCommunications !== undefined || preferences.marketing !== undefined) {
        updateData.marketingCommunications = preferences.marketingCommunications ?? preferences.marketing;
      }
      if (preferences.newsletterSubscription !== undefined || preferences.newsletter !== undefined) {
        updateData.newsletterSubscription = preferences.newsletterSubscription ?? preferences.newsletter;
      }
      if (preferences.notificationFrequency !== undefined || preferences.frequency !== undefined) {
        updateData.notificationFrequency = preferences.notificationFrequency ?? preferences.frequency;
      }
      if (preferences.orderUpdates !== undefined) {
        updateData.orderUpdates = preferences.orderUpdates;
      }
      if (preferences.securityAlerts !== undefined) {
        updateData.securityAlerts = preferences.securityAlerts;
      }
      if (preferences.pushNotifications !== undefined || preferences.push !== undefined) {
        updateData.pushNotifications = preferences.pushNotifications ?? preferences.push;
      }

      let result;
      if (existingPrefs) {
        // Update existing preferences
        result = await this.prisma.userNotificationPreferences.update({
          where: { userId },
          data: updateData
        });
      } else {
        // Create new preferences with provided values and defaults for missing ones
        result = await this.prisma.userNotificationPreferences.create({
          data: {
            userId,
            emailNotifications: preferences.emailNotifications ?? preferences.email ?? true,
            smsNotifications: preferences.smsNotifications ?? preferences.sms ?? false,
            whatsappNotifications: preferences.whatsappNotifications ?? preferences.whatsapp ?? false,
            pushNotifications: preferences.pushNotifications ?? preferences.push ?? true,
            orderUpdates: preferences.orderUpdates ?? true,
            marketingCommunications: preferences.marketingCommunications ?? preferences.marketing ?? true,
            newsletterSubscription: preferences.newsletterSubscription ?? preferences.newsletter ?? true,
            securityAlerts: preferences.securityAlerts ?? true
          }
        });
      }

      // Log preference change for audit
      this.logger.info('Notification preferences updated', {
        userId,
        changes: updateData,
        timestamp: new Date().toISOString()
      });

      return result;
    } catch (error) {
      this.logger.error('Error updating notification preferences', error);
      throw new Error('Failed to update notification preferences');
    }
  }

  /**
   * Update privacy settings
   * @param {string} userId - User ID
   * @param {Object} updates - Privacy settings updates
   * @returns {Promise<Object>} Updated settings
   */
  async updatePrivacySettings(userId, updates) {
    try {
      // Check if preferences exist
      let preferences = await this.prisma.userPrivacySettings.findUnique({
        where: { userId }
      });

      // Build update data object with only provided fields
      const updateData = {};
      if (updates.twoFactorEnabled !== undefined) updateData.twoFactorEnabled = updates.twoFactorEnabled;
      if (updates.dataSharingEnabled !== undefined) updateData.dataSharingEnabled = updates.dataSharingEnabled;
      if (updates.profileVisibility !== undefined) {
        // Validate visibility
        const validVisibilities = ['PUBLIC', 'PRIVATE'];
        if (!validVisibilities.includes(updates.profileVisibility)) {
          throw new Error('Invalid profile visibility');
        }
        updateData.profileVisibility = updates.profileVisibility;
      }
      if (updates.showEmail !== undefined) updateData.showEmail = updates.showEmail;
      if (updates.showPhone !== undefined) updateData.showPhone = updates.showPhone;
      if (updates.showAddress !== undefined) updateData.showAddress = updates.showAddress;
      if (updates.allowSearchByEmail !== undefined) updateData.allowSearchByEmail = updates.allowSearchByEmail;
      if (updates.allowSearchByPhone !== undefined) updateData.allowSearchByPhone = updates.allowSearchByPhone;
      if (updates.twoFactorMethod !== undefined) {
        const validMethods = ['sms', 'authenticator_app'];
        if (!validMethods.includes(updates.twoFactorMethod)) {
          throw new Error('Invalid 2FA method');
        }
        updateData.twoFactorMethod = updates.twoFactorMethod;
      }
      if (updates.twoFactorSecret !== undefined) updateData.twoFactorSecret = updates.twoFactorSecret;

      let result;
      if (preferences) {
        // Update existing preferences
        result = await this.prisma.userPrivacySettings.update({
          where: { userId },
          data: updateData
        });
      } else {
        // Create new preferences with provided values and defaults for missing ones
        result = await this.prisma.userPrivacySettings.create({
          data: {
            userId,
            profileVisibility: updates.profileVisibility !== undefined ? updates.profileVisibility : 'PRIVATE',
            showEmail: updates.showEmail !== undefined ? updates.showEmail : false,
            showPhone: updates.showPhone !== undefined ? updates.showPhone : false,
            showAddress: updates.showAddress !== undefined ? updates.showAddress : false,
            allowSearchByEmail: updates.allowSearchByEmail !== undefined ? updates.allowSearchByEmail : false,
            allowSearchByPhone: updates.allowSearchByPhone !== undefined ? updates.allowSearchByPhone : false,
            twoFactorEnabled: updates.twoFactorEnabled !== undefined ? updates.twoFactorEnabled : false,
            twoFactorMethod: updates.twoFactorMethod !== undefined ? updates.twoFactorMethod : null,
            twoFactorSecret: updates.twoFactorSecret !== undefined ? updates.twoFactorSecret : null,
            dataSharingEnabled: updates.dataSharingEnabled !== undefined ? updates.dataSharingEnabled : true
          }
        });
      }

      // Log privacy settings change for audit
      this.logger.info('Privacy settings updated', {
        userId,
        changes: updateData,
        timestamp: new Date().toISOString()
      });

      return result;
    } catch (error) {
      this.logger.error('Error updating privacy settings', error);
      throw new Error('Failed to update privacy settings');
    }
  }

  /**
   * Get privacy settings for user
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Privacy settings
   */
  async getPrivacySettings(userId) {
    try {
      const preferences = await this.getUserPreferences(userId);
      
      return {
        twoFactorEnabled: preferences.privacyPrefs.twoFactorEnabled,
        twoFactorMethod: preferences.privacyPrefs.twoFactorMethod,
        dataSharingEnabled: preferences.privacyPrefs.dataSharingEnabled,
        profileVisibility: preferences.privacyPrefs.profileVisibility
      };
    } catch (error) {
      this.logger.error('Error getting privacy settings', error);
      throw new Error('Failed to get privacy settings');
    }
  }

  /**
   * Get notification preferences for user
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Notification preferences
   */
  async getNotificationPreferences(userId) {
    try {
      const preferences = await this.getUserPreferences(userId);
      
      return {
        email: preferences.notificationPrefs.emailNotifications,
        sms: preferences.notificationPrefs.smsNotifications,
        whatsapp: preferences.notificationPrefs.whatsappNotifications,
        marketing: preferences.notificationPrefs.promotionalEmails,
        newsletter: preferences.notificationPrefs.newsletter,
        push: preferences.notificationPrefs.pushNotifications,
        orderUpdates: preferences.notificationPrefs.orderUpdates,
        securityAlerts: preferences.notificationPrefs.securityAlerts
      };
    } catch (error) {
      this.logger.error('Error getting notification preferences', error);
      throw new Error('Failed to get notification preferences');
    }
  }

  /**
   * Get communication preferences for user
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Communication preferences
   */
  async getCommunicationPreferences(userId) {
    try {
      const preferences = await this.getUserPreferences(userId);
      
      return {
        email: preferences.communicationPrefs.preferredContactMethod === 'email',
        sms: preferences.communicationPrefs.preferredContactMethod === 'sms',
        whatsapp: preferences.communicationPrefs.preferredContactMethod === 'whatsapp',
        marketing: preferences.communicationPrefs.marketingConsent,
        newsletter: preferences.communicationPrefs.dataSharingConsent,
        frequency: 'immediate',
        language: preferences.communicationPrefs.preferredLanguage,
        timezone: preferences.communicationPrefs.preferredTimezone
      };
    } catch (error) {
      this.logger.error('Error getting communication preferences', error);
      throw new Error('Failed to get communication preferences');
    }
  }

  /**
   * Change user password
   * @param {string} userId - User ID
   * @param {string} currentPassword - Current password
   * @param {string} newPassword - New password
   * @returns {Promise<boolean>} Success status
   */
  async changePassword(userId, currentPassword, newPassword) {
    try {
      // Get user with current password
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          phone: true,
          password: true
        }
      });

      if (!user) {
        throw new Error('User not found');
      }

      // Verify current password
      const isCurrentPasswordValid = await this.passwordService.verifyPassword(currentPassword, user.password);
      if (!isCurrentPasswordValid) {
        throw new Error('Invalid current password');
      }

      // Check if new password is same as current password
      const isSameAsCurrent = await this.passwordService.verifyPassword(newPassword, user.password);
      if (isSameAsCurrent) {
        throw new Error('New password must be different from current password');
      }

      // Validate new password strength
      const userInfo = {
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone
      };
      const passwordValidation = this.passwordService.validatePasswordStrength(newPassword, userInfo);
      
      if (!passwordValidation.isValid) {
        throw new Error('Password does not meet requirements');
      }

      // Check if password has been used before
      const isPasswordReused = await this.passwordService.isPasswordReused(userId, newPassword);
      if (isPasswordReused) {
        throw new Error('Password already used in last 5 changes');
      }

      // Hash new password
      const hashedNewPassword = await this.passwordService.hashPassword(newPassword);

      // Update user password
      await this.prisma.user.update({
        where: { id: userId },
        data: { password: hashedNewPassword }
      });

      // Save new password to history
      await this.passwordService.savePasswordToHistory(userId, hashedNewPassword);

      // Log password change for audit
      this.logger.info('Password changed', {
        userId,
        timestamp: new Date().toISOString()
      });

      return true;
    } catch (error) {
      this.logger.error('Error changing password', error);
      throw error;
    }
  }

  /**
   * Enable 2FA for user
   * @param {string} userId - User ID
   * @param {string} method - 2FA method ('sms' or 'authenticator_app')
   * @param {string} phoneNumber - Phone number (required for SMS method)
   * @returns {Promise<Object>} Setup details
   */
  async enableTwoFactor(userId, method, phoneNumber = null) {
    try {
      // Validate method
      if (!['sms', 'authenticator_app'].includes(method)) {
        throw new Error('Invalid 2FA method');
      }

      // For SMS method, phone number is required
      if (method === 'sms' && !phoneNumber) {
        throw new Error('Phone number is required for SMS 2FA');
      }

      // Get user privacy settings
      let privacyPrefs = await this.prisma.userPrivacySettings.findUnique({
        where: { userId }
      });

      if (!privacyPrefs) {
        privacyPrefs = await this.initializeDefaultPrivacySettings(userId);
      }

      // Generate 2FA secret for authenticator app
      let twoFactorSecret = null;
      if (method === 'authenticator_app') {
        twoFactorSecret = crypto.randomBytes(32).toString('hex');
      }

      // Update privacy settings
      const updatedPreferences = await this.prisma.userPrivacySettings.update({
        where: { userId },
        data: {
          twoFactorEnabled: true,
          twoFactorMethod: method,
          twoFactorSecret: twoFactorSecret
        }
      });

      // Log 2FA enablement for audit
      this.logger.info('2FA enabled', {
        userId,
        method,
        timestamp: new Date().toISOString()
      });

      return {
        twoFactorEnabled: true,
        twoFactorMethod: method,
        twoFactorSecret: twoFactorSecret,
        phoneNumber: method === 'sms' ? phoneNumber : null
      };
    } catch (error) {
      this.logger.error('Error enabling 2FA', error);
      throw new Error('Failed to enable 2FA');
    }
  }

  /**
   * Disable 2FA for user
   * @param {string} userId - User ID
   * @returns {Promise<boolean>} Success status
   */
  async disableTwoFactor(userId) {
    try {
      await this.prisma.userPrivacySettings.update({
        where: { userId },
        data: {
          twoFactorEnabled: false,
          twoFactorMethod: null,
          twoFactorSecret: null
        }
      });

      // Log 2FA disablement for audit
      this.logger.info('2FA disabled', {
        userId,
        timestamp: new Date().toISOString()
      });

      return true;
    } catch (error) {
      this.logger.error('Error disabling 2FA', error);
      throw new Error('Failed to disable 2FA');
    }
  }

  /**
   * Verify 2FA token
   * @param {string} userId - User ID
   * @param {string} token - 2FA token to verify
   * @returns {Promise<boolean>} Success status
   */
  async verifyTwoFactorToken(userId, token) {
    try {
      const privacyPrefs = await this.prisma.userPrivacySettings.findUnique({
        where: { userId }
      });

      if (!privacyPrefs || !privacyPrefs.twoFactorEnabled) {
        throw new Error('2FA is not enabled for this user');
      }

      // For SMS method, verify against OTP
      if (privacyPrefs.twoFactorMethod === 'sms') {
        // This would integrate with existing OTP service
        // For now, return a placeholder response
        return true;
      }

      // For authenticator app, verify against TOTP
      if (privacyPrefs.twoFactorMethod === 'authenticator_app') {
        // This would integrate with a TOTP library like speakeasy
        // For now, return a placeholder response
        return true;
      }

      return false;
    } catch (error) {
      this.logger.error('Error verifying 2FA token', error);
      throw new Error('Failed to verify 2FA token');
    }
  }
}

// Singleton instance
const accountPreferencesService = new AccountPreferencesService();

module.exports = {
  AccountPreferencesService,
  accountPreferencesService
};
