/**
 * Account Preferences API Client
 * API functions for account preferences functionality
 */

import { apiClient } from './client';
import {
  NotificationPreferences,
  CommunicationPreferences,
  PrivacySettings,
  AccountDeletionStatus,
  DataExport,
  PasswordChangeData,
  TwoFactorSetupData,
  AccountDeletionRequestData,
  DataExportRequestData,
} from '@/types/accountPreferences';

/**
 * Account Preferences API class
 * Handles all account preferences related API calls
 */
export class AccountPreferencesAPI {
  private static readonly BASE_PATH = '/profile/preferences';

  // ==================== Notification Preferences ====================

  /**
   * Get notification preferences
   */
  static async getNotificationPreferences(): Promise<NotificationPreferences> {
    const response = await apiClient.get<{ preferences: NotificationPreferences }>(
      `${this.BASE_PATH}/notifications`
    );
    return response.preferences;
  }

  /**
   * Update notification preferences
   */
  static async updateNotificationPreferences(
    preferences: Partial<NotificationPreferences>
  ): Promise<NotificationPreferences> {
    const response = await apiClient.put<{ preferences: NotificationPreferences }>(
      `${this.BASE_PATH}/notifications`,
      preferences
    );
    return response.preferences;
  }

  /**
   * Get communication preferences
   */
  static async getCommunicationPreferences(): Promise<CommunicationPreferences> {
    const response = await apiClient.get<{ preferences: CommunicationPreferences }>(
      `${this.BASE_PATH}/communication`
    );
    return response.preferences;
  }

  /**
   * Update communication preferences
   */
  static async updateCommunicationPreferences(
    preferences: Partial<CommunicationPreferences>
  ): Promise<CommunicationPreferences> {
    const response = await apiClient.put<{ preferences: CommunicationPreferences }>(
      `${this.BASE_PATH}/communication`,
      preferences
    );
    return response.preferences;
  }

  // ==================== Privacy Settings ====================

  /**
   * Get privacy settings
   */
  static async getPrivacySettings(): Promise<PrivacySettings> {
    const response = await apiClient.get<{ settings: PrivacySettings }>(
      `${this.BASE_PATH}/privacy`
    );
    return response.settings;
  }

  /**
   * Update privacy settings
   */
  static async updatePrivacySettings(
    settings: Partial<PrivacySettings>
  ): Promise<PrivacySettings> {
    const response = await apiClient.put<{ settings: PrivacySettings }>(
      `${this.BASE_PATH}/privacy`,
      settings
    );
    return response.settings;
  }

  // ==================== Password Management ====================

  /**
   * Change password
   */
  static async changePassword(data: PasswordChangeData): Promise<void> {
    await apiClient.post<{ message: string }>('/profile/account/password/change', data);
  }

  // ==================== 2FA ====================

  /**
   * Enable 2FA
   */
  static async enable2FA(
    method: 'sms' | 'authenticator_app',
    phoneNumber?: string
  ): Promise<{ qrCode?: string; secret?: string }> {
    const response = await apiClient.post<{ qrCode?: string; secret?: string }>(
      '/profile/account/2fa/enable',
      { method, phoneNumber }
    );
    return response;
  }

  /**
   * Disable 2FA
   */
  static async disable2FA(): Promise<void> {
    await apiClient.post<{ message: string }>('/profile/account/2fa/disable');
  }

  // ==================== Account Deletion ====================

  /**
   * Request account deletion
   */
  static async requestAccountDeletion(
    data: AccountDeletionRequestData
  ): Promise<{ deletionToken: string; expiresAt: string; scheduledDeletionDate: string }> {
    const response = await apiClient.post<{
      deletionToken: string;
      expiresAt: string;
      scheduledDeletionDate: string;
    }>('/profile/account/deletion/request', data);
    return response;
  }

  /**
   * Confirm account deletion
   */
  static async confirmAccountDeletion(deletionToken: string): Promise<void> {
    await apiClient.post<{ message: string }>('/profile/account/deletion/confirm', {
      deletionToken,
    });
  }

  /**
   * Cancel account deletion
   */
  static async cancelAccountDeletion(): Promise<void> {
    await apiClient.post<{ message: string }>('/profile/account/deletion/cancel');
  }

  /**
   * Get account deletion status
   */
  static async getAccountDeletionStatus(): Promise<AccountDeletionStatus> {
    const response = await apiClient.get<{ status: AccountDeletionStatus }>(
      '/profile/account/deletion/status'
    );
    return response.status;
  }

  // ==================== Data Export ====================

  /**
   * Get all data exports
   */
  static async getDataExports(): Promise<DataExport[]> {
    const response = await apiClient.get<{ exports: DataExport[] }>(
      '/profile/data/export'
    );
    console.log('[AccountPreferencesAPI] getDataExports response:', response);
    console.log('[AccountPreferencesAPI] exports array:', response.exports);
    if (response.exports && response.exports.length > 0) {
      console.log('[AccountPreferencesAPI] First export:', response.exports[0]);
      console.log('[AccountPreferencesAPI] First export keys:', Object.keys(response.exports[0]));
    }
    return response.exports;
  }

  /**
   * Generate new data export
   */
  static async generateDataExport(
    data: DataExportRequestData
  ): Promise<DataExport> {
    const response = await apiClient.post<{ export: DataExport }>(
      '/profile/data/export/generate',
      data
    );
    console.log('[AccountPreferencesAPI] generateDataExport response:', response);
    return response.export;
  }

  /**
   * Download data export
   */
  static async downloadDataExport(exportId: string): Promise<Blob> {
    const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
    
    const response = await fetch(
      `${API_BASE_URL}/profile/data/export/${exportId}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[AccountPreferencesAPI] Download failed:', response.status, errorText);
      throw new Error(`Failed to download export: ${response.status}`);
    }

    return response.blob();
  }
}

export default AccountPreferencesAPI;
