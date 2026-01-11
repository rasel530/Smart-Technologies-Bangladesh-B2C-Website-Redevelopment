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
    return response.data.preferences;
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
    return response.data.preferences;
  }

  /**
   * Get communication preferences
   */
  static async getCommunicationPreferences(): Promise<CommunicationPreferences> {
    const response = await apiClient.get<{ preferences: CommunicationPreferences }>(
      `${this.BASE_PATH}/communication`
    );
    return response.data.preferences;
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
    return response.data.preferences;
  }

  // ==================== Privacy Settings ====================

  /**
   * Get privacy settings
   */
  static async getPrivacySettings(): Promise<PrivacySettings> {
    const response = await apiClient.get<{ settings: PrivacySettings }>(
      `${this.BASE_PATH}/privacy`
    );
    return response.data.settings;
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
    return response.data.settings;
  }

  // ==================== Password Management ====================

  /**
   * Change password
   */
  static async changePassword(data: PasswordChangeData): Promise<void> {
    await apiClient.post<{ message: string }>('/profile/me/password/change', data);
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
    return response.data;
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
    return response.data;
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
    return response.data.status;
  }

  // ==================== Data Export ====================

  /**
   * Get all data exports
   */
  static async getDataExports(): Promise<DataExport[]> {
    const response = await apiClient.get<{ exports: DataExport[] }>(
      '/profile/data/export'
    );
    return response.data.exports;
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
    return response.data.export;
  }

  /**
   * Download data export
   */
  static async downloadDataExport(exportId: string): Promise<Blob> {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1'}/profile/data/export/${exportId}`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error('Failed to download export');
    }

    return response.blob();
  }
}

export default AccountPreferencesAPI;
