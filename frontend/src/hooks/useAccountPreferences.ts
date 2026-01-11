/**
 * Account Preferences Hook
 * Custom hook for managing account preferences state and operations
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import AccountPreferencesAPI from '@/lib/api/accountPreferences';
import {
  NotificationPreferences,
  CommunicationPreferences,
  PrivacySettings,
  AccountDeletionStatus,
  DataExport,
} from '@/types/accountPreferences';

export function useAccountPreferences() {
  // Notification Preferences
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
  const [communicationPrefs, setCommunicationPrefs] = useState<CommunicationPreferences | null>(null);

  // Privacy Settings
  const [privacySettings, setPrivacySettings] = useState<PrivacySettings | null>(null);

  // Account Deletion
  const [deletionStatus, setDeletionStatus] = useState<AccountDeletionStatus | null>(null);

  // Data Exports
  const [exports, setExports] = useState<DataExport[]>([]);

  // Loading states
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Error state
  const [error, setError] = useState<string | null>(null);

  // Load notification preferences
  const loadNotificationPreferences = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await AccountPreferencesAPI.getNotificationPreferences();
      setPreferences(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load notification preferences');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Load communication preferences
  const loadCommunicationPreferences = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await AccountPreferencesAPI.getCommunicationPreferences();
      setCommunicationPrefs(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load communication preferences');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Load privacy settings
  const loadPrivacySettings = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await AccountPreferencesAPI.getPrivacySettings();
      setPrivacySettings(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load privacy settings');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Load account deletion status
  const loadDeletionStatus = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await AccountPreferencesAPI.getAccountDeletionStatus();
      setDeletionStatus(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load deletion status');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Load data exports
  const loadDataExports = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await AccountPreferencesAPI.getDataExports();
      setExports(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load data exports');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Update notification preferences
  const updateNotificationPreferences = useCallback(async (data: Partial<NotificationPreferences>) => {
    setIsSaving(true);
    setError(null);

    try {
      const result = await AccountPreferencesAPI.updateNotificationPreferences(data);
      setPreferences(result);
      return result;
    } catch (err: any) {
      setError(err.message || 'Failed to update notification preferences');
      throw err;
    } finally {
      setIsSaving(false);
    }
  }, []);

  // Update communication preferences
  const updateCommunicationPreferences = useCallback(async (data: Partial<CommunicationPreferences>) => {
    setIsSaving(true);
    setError(null);

    try {
      const result = await AccountPreferencesAPI.updateCommunicationPreferences(data);
      setCommunicationPrefs(result);
      return result;
    } catch (err: any) {
      setError(err.message || 'Failed to update communication preferences');
      throw err;
    } finally {
      setIsSaving(false);
    }
  }, []);

  // Update privacy settings
  const updatePrivacySettings = useCallback(async (data: Partial<PrivacySettings>) => {
    setIsSaving(true);
    setError(null);

    try {
      const result = await AccountPreferencesAPI.updatePrivacySettings(data);
      setPrivacySettings(result);
      return result;
    } catch (err: any) {
      setError(err.message || 'Failed to update privacy settings');
      throw err;
    } finally {
      setIsSaving(false);
    }
  }, []);

  // Change password
  const changePassword = useCallback(async (currentPassword: string, newPassword: string, confirmPassword: string) => {
    setIsSaving(true);
    setError(null);

    try {
      await AccountPreferencesAPI.changePassword(currentPassword, newPassword, confirmPassword);
    } catch (err: any) {
      setError(err.message || 'Failed to change password');
      throw err;
    } finally {
      setIsSaving(false);
    }
  }, []);

  // Enable 2FA
  const enable2FA = useCallback(async (method: 'sms' | 'authenticator_app', phoneNumber?: string) => {
    setIsSaving(true);
    setError(null);

    try {
      const result = await AccountPreferencesAPI.enable2FA(method, phoneNumber);
      // Update privacy settings to reflect 2FA status
      if (privacySettings) {
        setPrivacySettings({ ...privacySettings, twoFactorEnabled: true });
      }
      return result;
    } catch (err: any) {
      setError(err.message || 'Failed to enable 2FA');
      throw err;
    } finally {
      setIsSaving(false);
    }
  }, [privacySettings]);

  // Disable 2FA
  const disable2FA = useCallback(async () => {
    setIsSaving(true);
    setError(null);

    try {
      await AccountPreferencesAPI.disable2FA();
      // Update privacy settings to reflect 2FA status
      if (privacySettings) {
        setPrivacySettings({ ...privacySettings, twoFactorEnabled: false });
      }
    } catch (err: any) {
      setError(err.message || 'Failed to disable 2FA');
      throw err;
    } finally {
      setIsSaving(false);
    }
  }, [privacySettings]);

  // Request account deletion
  const requestAccountDeletion = useCallback(async (reason?: string, confirmation: string) => {
    setIsSaving(true);
    setError(null);

    try {
      const result = await AccountPreferencesAPI.requestAccountDeletion({ reason, confirmation });
      setDeletionStatus(result);
      return result;
    } catch (err: any) {
      setError(err.message || 'Failed to request account deletion');
      throw err;
    } finally {
      setIsSaving(false);
    }
  }, []);

  // Confirm account deletion
  const confirmAccountDeletion = useCallback(async (deletionToken: string) => {
    setIsSaving(true);
    setError(null);

    try {
      await AccountPreferencesAPI.confirmAccountDeletion(deletionToken);
      setDeletionStatus({ status: 'confirmed' });
    } catch (err: any) {
      setError(err.message || 'Failed to confirm account deletion');
      throw err;
    } finally {
      setIsSaving(false);
    }
  }, []);

  // Cancel account deletion
  const cancelAccountDeletion = useCallback(async () => {
    setIsSaving(true);
    setError(null);

    try {
      await AccountPreferencesAPI.cancelAccountDeletion();
      setDeletionStatus({ status: 'cancelled' });
    } catch (err: any) {
      setError(err.message || 'Failed to cancel account deletion');
      throw err;
    } finally {
      setIsSaving(false);
    }
  }, []);

  // Generate data export
  const generateDataExport = useCallback(async (dataTypes: string[], format: 'json' | 'csv') => {
    setIsSaving(true);
    setError(null);

    try {
      const newExport = await AccountPreferencesAPI.generateDataExport({ dataTypes, format });
      setExports(prev => [newExport, ...prev]);
      return newExport;
    } catch (err: any) {
      setError(err.message || 'Failed to generate data export');
      throw err;
    } finally {
      setIsSaving(false);
    }
  }, []);

  // Download data export
  const downloadDataExport = useCallback(async (exportId: string) => {
    try {
      await AccountPreferencesAPI.downloadDataExport(exportId);
    } catch (err: any) {
      setError(err.message || 'Failed to download data export');
      throw err;
    }
  }, []);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    // State
    preferences,
    communicationPrefs,
    privacySettings,
    deletionStatus,
    exports,
    isLoading,
    isSaving,
    error,

    // Actions
    loadNotificationPreferences,
    loadCommunicationPreferences,
    loadPrivacySettings,
    loadDeletionStatus,
    loadDataExports,

    updateNotificationPreferences,
    updateCommunicationPreferences,
    updatePrivacySettings,
    changePassword,
    enable2FA,
    disable2FA,
    requestAccountDeletion,
    confirmAccountDeletion,
    cancelAccountDeletion,
    generateDataExport,
    downloadDataExport,
    clearError,
  };
}
