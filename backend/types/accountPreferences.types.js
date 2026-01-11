/**
 * Account Preferences Type Definitions
 * 
 * This file contains TypeScript-like type definitions for Account Preferences API.
 * Used as documentation and reference for JavaScript implementation.
 */

/**
 * Notification Preferences Interface
 */
const NotificationPreferences = {
  email: Boolean,
  sms: Boolean,
  whatsapp: Boolean,
  marketing: Boolean,
  newsletter: Boolean,
  frequency: String // 'immediate' | 'daily' | 'weekly' | 'monthly'
};

/**
 * Update Notification Preferences DTO
 */
const UpdateNotificationPreferencesDTO = {
  email: Boolean,
  sms: Boolean,
  whatsapp: Boolean,
  marketing: Boolean,
  newsletter: Boolean,
  frequency: String // 'immediate' | 'daily' | 'weekly' | 'monthly'
};

/**
 * Notification Preferences Response
 */
const NotificationPreferencesResponse = {
  success: Boolean,
  data: {
    message: String,
    preferences: Object
  }
};

/**
 * Privacy Settings Response
 */
const PrivacySettingsResponse = {
  success: Boolean,
  data: {
    twoFactorEnabled: Boolean,
    dataSharingEnabled: Boolean,
    profileVisibility: String // 'public' | 'private' | 'friends_only'
  }
};

/**
 * Update Privacy Settings DTO
 */
const UpdatePrivacySettingsDTO = {
  twoFactorEnabled: Boolean,
  dataSharingEnabled: Boolean,
  profileVisibility: String // 'public' | 'private' | 'friends_only'
};

/**
 * Change Password DTO
 */
const ChangePasswordDTO = {
  currentPassword: String,
  newPassword: String,
  confirmPassword: String
};

/**
 * Enable 2FA DTO
 */
const Enable2FADTO = {
  method: String, // 'sms' | 'authenticator_app'
  phoneNumber: String
};

/**
 * Account Deletion Request DTO
 */
const AccountDeletionRequestDTO = {
  reason: String,
  confirmation: String // User must type "DELETE"
};

/**
 * Account Deletion Response
 */
const AccountDeletionResponse = {
  success: Boolean,
  data: {
    deletionToken: String,
    expiresAt: Date,
    scheduledDeletionDate: Date
  }
};

/**
 * Confirm Deletion DTO
 */
const ConfirmDeletionDTO = {
  deletionToken: String
};

/**
 * Data Export Request DTO
 */
const DataExportRequestDTO = {
  dataTypes: Array, // ['profile', 'orders', 'addresses', 'wishlist']
  format: String // 'json' | 'csv'
};

/**
 * Data Export Response
 */
const DataExportResponse = {
  success: Boolean,
  data: {
    exportId: String,
    downloadUrl: String,
    expiresAt: Date
  }
};

/**
 * Validation constants
 */
const VALID_NOTIFICATION_FREQUENCIES = ['immediate', 'daily', 'weekly', 'monthly'];
const VALID_PROFILE_VISIBILITY = ['public', 'private', 'friends_only'];
const VALID_2FA_METHODS = ['sms', 'authenticator_app'];
const VALID_EXPORT_FORMATS = ['json', 'csv'];
const VALID_DATA_TYPES = ['profile', 'orders', 'addresses', 'wishlist'];

module.exports = {
  NotificationPreferences,
  UpdateNotificationPreferencesDTO,
  NotificationPreferencesResponse,
  PrivacySettingsResponse,
  UpdatePrivacySettingsDTO,
  ChangePasswordDTO,
  Enable2FADTO,
  AccountDeletionRequestDTO,
  AccountDeletionResponse,
  ConfirmDeletionDTO,
  DataExportRequestDTO,
  DataExportResponse,
  VALID_NOTIFICATION_FREQUENCIES,
  VALID_PROFILE_VISIBILITY,
  VALID_2FA_METHODS,
  VALID_EXPORT_FORMATS,
  VALID_DATA_TYPES
};
