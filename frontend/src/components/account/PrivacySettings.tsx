'use client';

import React, { useState, useEffect } from 'react';
import { Shield, Eye, Save, Check, AlertCircle, Loader2, AlertTriangle } from 'lucide-react';
import ToggleSwitch from '@/components/ui/ToggleSwitch';
import ToastNotification from '@/components/ui/ToastNotification';
import AccountPreferencesAPI from '@/lib/api/accountPreferences';
import { PrivacySettings as PrivacySettingsType } from '@/types/accountPreferences';

interface PrivacySettingsProps {
  language: 'en' | 'bn';
}

const PrivacySettings: React.FC<PrivacySettingsProps> = ({ language }) => {
  const [settings, setSettings] = useState<PrivacySettingsType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await AccountPreferencesAPI.getPrivacySettings();
      setSettings(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load privacy settings');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    if (!settings) return;

    setIsSaving(true);
    setError(null);

    try {
      await AccountPreferencesAPI.updatePrivacySettings(settings);
      setToast({ type: 'success', message: language === 'en' ? 'Privacy settings saved successfully!' : 'গোপনীয়তা সেটিংস সফলভাবে সংরক্ষিত হয়েছে!' });
      setTimeout(() => setToast(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to save privacy settings');
      setToast({ type: 'error', message: language === 'en' ? 'Failed to save settings' : 'সেটিংস সংরক্ষণ করতে ব্যর্থ হয়েছে' });
      setTimeout(() => setToast(null), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggle = (field: keyof PrivacySettingsType) => {
    if (!settings) return;
    setSettings({
      ...settings,
      [field]: !settings[field as any],
    });
  };

  const handleVisibilityChange = (visibility: 'public' | 'private' | 'friends_only') => {
    if (!settings) return;
    setSettings({
      ...settings,
      profileVisibility: visibility,
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-12 w-12 animate-spin text-primary-600" />
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">
          {language === 'en' ? 'Failed to load privacy settings' : 'গোপনীয়তা সেটিংস লোড করতে ব্যর্থ হয়েছে'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {toast && (
        <ToastNotification
          type={toast.type}
          message={toast.message}
          onClose={() => setToast(null)}
        />
      )}

      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900">
          {language === 'en' ? 'Privacy Settings' : 'গোপনীয়তা সেটিংস'}
        </h2>
        <button
          onClick={handleSaveSettings}
          disabled={isSaving}
          className="flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSaving ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>{language === 'en' ? 'Saving...' : 'সংরক্ষণ হচ্ছে...'}</span>
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              <span>{language === 'en' ? 'Save' : 'সংরক্ষণ করুন'}</span>
            </>
          )}
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="flex items-start space-x-2 bg-red-50 border border-red-200 rounded-md p-4">
          <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {/* Profile Visibility */}
      <div className="space-y-4">
        <h3 className="flex items-center space-x-2 text-lg font-semibold text-gray-900">
          <Eye className="h-5 w-5" />
          <span>{language === 'en' ? 'Profile Visibility' : 'প্রোফাইল দৃশ্যমানতা'}</span>
        </h3>

        <div className="space-y-4 p-4 bg-gray-50 rounded-md">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {language === 'en' ? 'Who can see your profile?' : 'আপনার প্রোফাইল কে দেখতে পারে?'}
            </label>
            <select
              value={settings.profileVisibility}
              onChange={(e) => handleVisibilityChange(e.target.value as any)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="private">
                {language === 'en' ? 'Private - Only you can see your profile' : 'ব্যক্তিগত - শুধুমাত্র আপনি আপনার প্রোফাইল দেখতে পারেন'}
              </option>
              <option value="friends_only">
                {language === 'en' ? 'Friends Only' : 'শুধুমাত্র বন্ধুরা'}
              </option>
              <option value="public">
                {language === 'en' ? 'Public - Anyone can see your profile' : 'পাবলিক - যে কেউ আপনার প্রোফাইল দেখতে পারে'}
              </option>
            </select>
            {settings.profileVisibility === 'public' && (
              <div className="mt-2 flex items-start space-x-2 bg-yellow-50 border border-yellow-200 rounded-md p-3">
                <AlertTriangle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-yellow-800">
                  {language === 'en'
                    ? 'Warning: Making your profile public means anyone can see your profile information. Consider this carefully before enabling.'
                    : 'সতর্কতা: আপনার প্রোফাইল পাবলিক করা মানে যে কেউ আপনার প্রোফাইল তথ্য দেখতে পারবে। সক্ষম করার আগে সাবধানে বিবেচনা করুন।'}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Data Sharing */}
      <div className="space-y-4">
        <h3 className="flex items-center space-x-2 text-lg font-semibold text-gray-900">
          <Shield className="h-5 w-5" />
          <span>{language === 'en' ? 'Data Sharing' : 'ডেটা শেয়ারিং'}</span>
        </h3>

        <div className="space-y-4 p-4 bg-gray-50 rounded-md">
          {/* Data Sharing Enabled */}
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900">
                {language === 'en' ? 'Data Sharing' : 'ডেটা শেয়ারিং'}
              </p>
              <p className="text-sm text-gray-600">
                {language === 'en'
                  ? 'Allow sharing of your data with trusted partners'
                  : 'বিশ্বস্ত অংশর সাথে আপনার ডেটা শেয়ার করার অনুমতি দিন'}
              </p>
            </div>
            <ToggleSwitch
              checked={settings.dataSharingEnabled}
              onChange={(checked) => handleToggle('dataSharingEnabled')}
              label=""
            />
          </div>

          {settings.dataSharingEnabled && (
            <div className="flex items-start space-x-2 bg-yellow-50 border border-yellow-200 rounded-md p-3">
              <AlertTriangle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-yellow-800">
                {language === 'en'
                  ? 'Warning: Enabling data sharing allows certain trusted partners to access your data. You can disable this at any time.'
                  : 'সতর্কতা: ডেটা শেয়ারিং সক্ষম করা নির্দিষ্ট বিশ্বস্ত অংশরকে আপনার ডেটা অ্যাক্সেস করতে দেয়। আপনি যেকোনো সময় এটি নিষ্ক্রিয় করতে পারেন।'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Two-Factor Authentication */}
      <div className="space-y-4">
        <h3 className="flex items-center space-x-2 text-lg font-semibold text-gray-900">
          <Shield className="h-5 w-5" />
          <span>{language === 'en' ? 'Two-Factor Authentication' : 'দ্বি-ফ্যাক্টর প্রমাণীকরণ'}</span>
        </h3>

        <div className="space-y-4 p-4 bg-gray-50 rounded-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900">
                {language === 'en' ? 'Enable 2FA' : '2FA সক্ষম করুন'}
              </p>
              <p className="text-sm text-gray-600">
                {language === 'en'
                  ? 'Add an extra layer of security to your account'
                  : 'আপনার অ্যাকাউন্টে অতিরিক্ত নিরাপত্তা স্তর যোগ করুন'}
              </p>
            </div>
            <ToggleSwitch
              checked={settings.twoFactorEnabled}
              onChange={(checked) => handleToggle('twoFactorEnabled')}
              label=""
            />
          </div>
        </div>

        {settings.twoFactorEnabled && (
          <div className="flex items-start space-x-2 bg-green-50 border border-green-200 rounded-md p-3">
            <Check className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-green-800">
              {language === 'en'
                ? 'Two-factor authentication is enabled. Your account is now more secure.'
                : 'দ্বি-ফ্যাক্টর প্রমাণীকরণ সক্ষম করা হয়েছে। আপনার অ্যাকাউন্ট এখন আরও নিরাপদ।'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PrivacySettings;
