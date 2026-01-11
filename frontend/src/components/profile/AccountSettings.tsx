'use client';

import React, { useState, useEffect } from 'react';
import { Shield, Globe, Download, Save, Check, AlertCircle } from 'lucide-react';
import { ProfileAPI, type AccountSettings as AccountSettingsType } from '@/lib/api/profile';
import NotificationPreferences from './NotificationPreferences';
import CommunicationPreferences from './CommunicationPreferences';
import PrivacySettings from './PrivacySettings';
import AccountDeletion from './AccountDeletion';

interface AccountSettingsProps {
  language: 'en' | 'bn';
}

const AccountSettings: React.FC<AccountSettingsProps> = ({ language }) => {
  const [settings, setSettings] = useState<AccountSettingsType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await ProfileAPI.getSettings();
      setSettings(response.settings);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load settings');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    if (!settings) return;

    setIsSaving(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await ProfileAPI.updateSettings(settings);
      setSettings(response.settings);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">
          {language === 'en' ? 'Failed to load settings' : 'সেটিংস লোড করতে ব্যর্থ হয়েছে'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-gray-900">
        {language === 'en' ? 'Account Settings' : 'অ্যাকাউন্ট সেটিংস'}
      </h2>

      {/* Success Message */}
      {success && (
        <div className="flex items-center space-x-2 bg-green-50 border border-green-200 rounded-md p-4">
          <Check className="h-5 w-5 text-green-600" />
          <p className="text-sm text-green-800">
            {language === 'en' ? 'Settings saved successfully!' : 'সেটিংস সফলভাবে সংরক্ষিত হয়েছে!'}
          </p>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="flex items-start space-x-2 bg-red-50 border border-red-200 rounded-md p-4">
          <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {/* Notification Preferences */}
      <NotificationPreferences language={language} />

      {/* Communication Preferences */}
      <CommunicationPreferences language={language} />

      {/* Privacy Settings */}
      <PrivacySettings language={language} />

      {/* Account Deletion */}
      <AccountDeletion language={language} />

      {/* Preferences */}
      <div className="space-y-4">
        <h3 className="flex items-center space-x-2 text-lg font-semibold text-gray-900">
          <Globe className="h-5 w-5" />
          <span>{language === 'en' ? 'Preferences' : 'পছন্দ'}</span>
        </h3>

        <div className="space-y-4 p-4 bg-gray-50 rounded-md">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {language === 'en' ? 'Language' : 'ভাষা'}
            </label>
            <select
              value={settings.preferences.language}
              onChange={(e) => setSettings({
                ...settings,
                preferences: {
                  ...settings.preferences,
                  language: e.target.value
                }
              })}
              className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="en">English</option>
              <option value="bn">বাংলা</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {language === 'en' ? 'Currency' : 'মুদ্রা'}
            </label>
            <select
              value={settings.preferences.currency}
              onChange={(e) => setSettings({
                ...settings,
                preferences: {
                  ...settings.preferences,
                  currency: e.target.value
                }
              })}
              className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="BDT">BDT - Bangladeshi Taka</option>
              <option value="USD">USD - US Dollar</option>
            </select>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end pt-6 border-t border-gray-200">
        <button
          onClick={handleSaveSettings}
          disabled={isSaving}
          className="flex items-center space-x-2 px-6 py-3 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSaving ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              <span>{language === 'en' ? 'Saving...' : 'সংরক্ষণ হচ্ছে...'}</span>
            </>
          ) : (
            <>
              <Save className="h-5 w-5" />
              <span>{language === 'en' ? 'Save Settings' : 'সেটিংস সংরক্ষণ করুন'}</span>
            </>
          )}
        </button>
      </div>

      {/* Data Management */}
      <div className="space-y-4 pt-6 border-t border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">
          {language === 'en' ? 'Data Management' : 'ডাটা ম্যানেজমেন্ট'}
        </h3>

        <div className="space-y-3">
          <button className="flex items-center space-x-3 w-full text-left p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            <Download className="h-5 w-5 text-gray-600" />
            <div>
              <p className="font-medium text-gray-900">
                {language === 'en' ? 'Download my data' : 'আমার ডাটা ডাউনলোড করুন'}
              </p>
              <p className="text-sm text-gray-600">
                {language === 'en'
                  ? 'Get a copy of all your data'
                  : 'আপনার সব ডাটার একটি কপি পান'}
              </p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};

export default AccountSettings;
