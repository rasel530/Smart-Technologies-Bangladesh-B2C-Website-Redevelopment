/**
 * Account Preferences Type Definitions
 * TypeScript interfaces for account preferences functionality
 */

export interface NotificationPreferences {
  email: boolean;
  sms: boolean;
  whatsapp: boolean;
  marketing: boolean;
  newsletter: boolean;
  frequency?: 'immediate' | 'daily' | 'weekly' | 'monthly';
}

export interface CommunicationPreferences {
  preferredLanguage?: string;
  preferredTimezone?: string;
  preferredContactMethod?: 'email' | 'phone' | 'both';
  marketingConsent?: boolean;
  dataSharingConsent?: boolean;
}

export interface PrivacySettings {
  twoFactorEnabled: boolean;
  dataSharingEnabled: boolean;
  profileVisibility: 'public' | 'private' | 'friends_only';
}

export interface AccountDeletionStatus {
  status: 'none' | 'pending' | 'confirmed' | 'cancelled' | 'completed';
  requestedAt?: string;
  expiresAt?: string;
  scheduledDeletionDate?: string;
}

export interface DataExport {
  exportId: string;
  dataTypes: string[];
  format: 'json' | 'csv';
  status: 'processing' | 'ready' | 'expired';
  downloadUrl?: string;
  requestedAt: string;
  expiresAt: string;
}

export interface PasswordChangeData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface TwoFactorSetupData {
  method: 'sms' | 'authenticator_app';
  phoneNumber?: string;
  verificationCode?: string;
}

export interface AccountDeletionRequestData {
  reason?: string;
  confirmation: string;
}

export interface DataExportRequestData {
  dataTypes: string[];
  format: 'json' | 'csv';
}
