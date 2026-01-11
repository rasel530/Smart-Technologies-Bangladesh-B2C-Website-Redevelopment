'use client';

import React, { useState, useEffect } from 'react';
import { Shield, Eye, Mail, Phone, MapPin, Search, Lock, Save, Check, AlertCircle, Loader2, AlertTriangle } from 'lucide-react';
import { PrivacySettingsAPI, PrivacySettings as PrivacySettingsType, UpdatePrivacySettingsData } from '@/lib/api/profile';

interface PrivacySettingsProps {
  language: 'en' | 'bn';
}

const PrivacySettings: React.FC<PrivacySettingsProps> = ({ language }) => {
  const [settings, setSettings] = useState<PrivacySettingsType | null>(null);
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
      const response = await PrivacySettingsAPI.getPreferences();
      setSettings(response.preferences);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load privacy settings');
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
      const updateData: UpdatePrivacySettingsData = {
        profileVisibility: settings.profileVisibility,
        showEmail: settings.showEmail,
        showPhone: settings.showPhone,
        showAddress: settings.showAddress,
        allowSearchByEmail: settings.allowSearchByEmail,
        allowSearchByPhone: settings.allowSearchByPhone,
        twoFactorEnabled: settings.twoFactorEnabled
      };

      const response = await PrivacySettingsAPI.updatePreferences(updateData);
      setSettings(response.preferences);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to save privacy settings');
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggle = (field: keyof PrivacySettingsType) => {
    if (!settings) return;
    setSettings({
      ...settings,
      [field]: !settings[field]
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

      {/* Success Message */}
      {success && (
        <div className="flex items-center space-x-2 bg-green-50 border border-green-200 rounded-md p-4">
          <Check className="h-5 w-5 text-green-600" />
          <p className="text-sm text-green-800">
            {language === 'en' ? 'Privacy settings saved successfully!' : 'গোপনীয়তা সেটিংস সফলভাবে সংরক্ষিত হয়েছে!'}
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
              onChange={(e) => setSettings({ ...settings, profileVisibility: e.target.value as 'PUBLIC' | 'PRIVATE' })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="PRIVATE">
                {language === 'en' ? 'Private - Only you can see your profile' : 'ব্যক্তিগত - শুধুমাত্র আপনি আপনার প্রোফাইল দেখতে পারেন'}
              </option>
              <option value="PUBLIC">
                {language === 'en' ? 'Public - Anyone can see your profile' : 'পাবলিক - যে কেউ আপনার প্রোফাইল দেখতে পারে'}
              </option>
            </select>
            {settings.profileVisibility === 'PUBLIC' && (
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

      {/* Personal Information Display */}
      <div className="space-y-4">
        <h3 className="flex items-center space-x-2 text-lg font-semibold text-gray-900">
          <Shield className="h-5 w-5" />
          <span>{language === 'en' ? 'Personal Information Display' : 'ব্যক্তিগত তথ্য প্রদর্শন'}</span>
        </h3>

        <div className="space-y-4 p-4 bg-gray-50 rounded-md">
          {/* Show Email */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Mail className="h-5 w-5 text-gray-600" />
              <div>
                <p className="font-medium text-gray-900">
                  {language === 'en' ? 'Show Email' : 'ইমেল দেখান'}
                </p>
                <p className="text-sm text-gray-600">
                  {language === 'en' ? 'Display email address on your profile' : 'আপনার প্রোফাইলে ইমেল ঠিকানা প্রদর্শন করুন'}
                </p>
              </div>
            </div>
            <button
              onClick={() => handleToggle('showEmail')}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                settings.showEmail ? 'bg-primary-600' : 'bg-gray-200'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  settings.showEmail ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Show Phone */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Phone className="h-5 w-5 text-gray-600" />
              <div>
                <p className="font-medium text-gray-900">
                  {language === 'en' ? 'Show Phone' : 'ফোন দেখান'}
                </p>
                <p className="text-sm text-gray-600">
                  {language === 'en' ? 'Display phone number on your profile' : 'আপনার প্রোফাইলে ফোন নম্বর প্রদর্শন করুন'}
                </p>
              </div>
            </div>
            <button
              onClick={() => handleToggle('showPhone')}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                settings.showPhone ? 'bg-primary-600' : 'bg-gray-200'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  settings.showPhone ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Show Address */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <MapPin className="h-5 w-5 text-gray-600" />
              <div>
                <p className="font-medium text-gray-900">
                  {language === 'en' ? 'Show Address' : 'ঠিকানা দেখান'}
                </p>
                <p className="text-sm text-gray-600">
                  {language === 'en' ? 'Display address on your profile' : 'আপনার প্রোফাইলে ঠিকানা প্রদর্শন করুন'}
                </p>
              </div>
            </div>
            <button
              onClick={() => handleToggle('showAddress')}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                settings.showAddress ? 'bg-primary-600' : 'bg-gray-200'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  settings.showAddress ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>

        {(settings.showEmail || settings.showPhone || settings.showAddress) && (
          <div className="flex items-start space-x-2 bg-yellow-50 border border-yellow-200 rounded-md p-3">
            <AlertTriangle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-yellow-800">
              {language === 'en'
                ? 'Warning: Displaying personal information on your profile may expose you to unwanted contact. Enable only if you are comfortable with this risk.'
                : 'সতর্কতা: আপনার প্রোফাইলে ব্যক্তিগত তথ্য প্রদর্শন করা আপনাকে অপ্রত্যাশিত যোগাযোগের ঝুঁকিতে ফেলতে পারে। শুধুমাত্র যদি আপনি এই ঝুঁকির সাথে স্বাচ্ছন্দ্য বোধ করেন তবেই সক্ষম করুন।'}
            </p>
          </div>
        )}
      </div>

      {/* Searchability Settings */}
      <div className="space-y-4">
        <h3 className="flex items-center space-x-2 text-lg font-semibold text-gray-900">
          <Search className="h-5 w-5" />
          <span>{language === 'en' ? 'Searchability' : 'অনুসন্ধানযোগ্যতা'}</span>
        </h3>

        <div className="space-y-4 p-4 bg-gray-50 rounded-md">
          {/* Allow Search by Email */}
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900">
                {language === 'en' ? 'Allow Search by Email' : 'ইমেল দ্বারা অনুসন্ধান অনুমতি দিন'}
              </p>
              <p className="text-sm text-gray-600">
                {language === 'en' ? 'Let others find you by your email address' : 'অন্যদের আপনার ইমেল ঠিকানা দিয়ে খুঁজে পেতে দিন'}
              </p>
            </div>
            <button
              onClick={() => handleToggle('allowSearchByEmail')}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                settings.allowSearchByEmail ? 'bg-primary-600' : 'bg-gray-200'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  settings.allowSearchByEmail ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Allow Search by Phone */}
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900">
                {language === 'en' ? 'Allow Search by Phone' : 'ফোন দ্বারা অনুসন্ধান অনুমতি দিন'}
              </p>
              <p className="text-sm text-gray-600">
                {language === 'en' ? 'Let others find you by your phone number' : 'অন্যদের আপনার ফোন নম্বর দিয়ে খুঁজে পেতে দিন'}
              </p>
            </div>
            <button
              onClick={() => handleToggle('allowSearchByPhone')}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                settings.allowSearchByPhone ? 'bg-primary-600' : 'bg-gray-200'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  settings.allowSearchByPhone ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>

        {(settings.allowSearchByEmail || settings.allowSearchByPhone) && (
          <div className="flex items-start space-x-2 bg-yellow-50 border border-yellow-200 rounded-md p-3">
            <AlertTriangle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-yellow-800">
              {language === 'en'
                ? 'Warning: Enabling search by email or phone allows others to find your profile. This may increase unwanted contact or privacy concerns.'
                : 'সতর্কতা: ইমেল বা ফোন দ্বারা অনুসন্ধান সক্ষম করা অন্যদের আপনার প্রোফাইল খুঁজে পেতে দেয়। এটি অপ্রত্যাশিত যোগাযোগ বা গোপনীয়তা সমস্যা বাড়িয়ে দিতে পারে।'}
            </p>
          </div>
        )}
      </div>

      {/* Security Settings */}
      <div className="space-y-4">
        <h3 className="flex items-center space-x-2 text-lg font-semibold text-gray-900">
          <Lock className="h-5 w-5" />
          <span>{language === 'en' ? 'Security' : 'নিরাপত্তা'}</span>
        </h3>

        <div className="space-y-4 p-4 bg-gray-50 rounded-md">
          {/* Two-Factor Authentication */}
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900">
                {language === 'en' ? 'Two-Factor Authentication' : 'দ্বি-ফ্যাক্টর প্রমাণীকরণ'}
              </p>
              <p className="text-sm text-gray-600">
                {language === 'en' ? 'Add an extra layer of security to your account' : 'আপনার অ্যাকাউন্টে অতিরিক্ত নিরাপত্তা স্তর যোগ করুন'}
              </p>
            </div>
            <button
              onClick={() => handleToggle('twoFactorEnabled')}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                settings.twoFactorEnabled ? 'bg-primary-600' : 'bg-gray-200'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  settings.twoFactorEnabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
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
