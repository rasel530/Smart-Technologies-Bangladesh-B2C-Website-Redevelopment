'use client';

import React, { useState, useEffect } from 'react';
import { Bell, Mail, MessageSquare, Smartphone, Save, Check, AlertCircle, Loader2 } from 'lucide-react';
import ToggleSwitch from '@/components/ui/ToggleSwitch';
import ToastNotification from '@/components/ui/ToastNotification';
import AccountPreferencesAPI from '@/lib/api/accountPreferences';
import { NotificationPreferences as NotificationPreferencesType } from '@/types/accountPreferences';

interface NotificationSettingsProps {
  language: 'en' | 'bn';
}

const NotificationSettings: React.FC<NotificationSettingsProps> = ({ language }) => {
  const [preferences, setPreferences] = useState<NotificationPreferencesType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
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
  };

  const handleSavePreferences = async () => {
    if (!preferences) return;

    setIsSaving(true);
    setError(null);

    try {
      await AccountPreferencesAPI.updateNotificationPreferences(preferences);
      setToast({ type: 'success', message: language === 'en' ? 'Notification preferences saved successfully!' : 'নোটিফিকেশন পছন্দ সফলভাবে সংরক্ষিত হয়েছে!' });
      setTimeout(() => setToast(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to save notification preferences');
      setToast({ type: 'error', message: language === 'en' ? 'Failed to save preferences' : 'পছন্দ সংরক্ষণ করতে ব্যর্থ হয়েছে' });
      setTimeout(() => setToast(null), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggle = (field: keyof NotificationPreferencesType) => {
    if (!preferences) return;
    setPreferences({
      ...preferences,
      [field]: !preferences[field as any],
    });
  };

  const handleFrequencyChange = (frequency: 'immediate' | 'daily' | 'weekly' | 'monthly') => {
    if (!preferences) return;
    setPreferences({
      ...preferences,
      frequency,
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-12 w-12 animate-spin text-primary-600" />
      </div>
    );
  }

  if (!preferences) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">
          {language === 'en' ? 'Failed to load notification preferences' : 'নোটিফিকেশন পছন্দ লোড করতে ব্যর্থ হয়েছে'}
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
          {language === 'en' ? 'Notification Settings' : 'নোটিফিকেশন সেটিংস'}
        </h2>
        <button
          onClick={handleSavePreferences}
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

      {/* Notification Channels */}
      <div className="space-y-4">
        <h3 className="flex items-center space-x-2 text-lg font-semibold text-gray-900">
          <Bell className="h-5 w-5" />
          <span>{language === 'en' ? 'Notification Channels' : 'নোটিফিকেশন চ্যানেল'}</span>
        </h3>

        <div className="space-y-4 p-4 bg-gray-50 rounded-md">
          {/* Email Notifications */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Mail className="h-5 w-5 text-gray-600" />
              <div>
                <p className="font-medium text-gray-900">
                  {language === 'en' ? 'Email Notifications' : 'ইমেল নোটিফিকেশন'}
                </p>
                <p className="text-sm text-gray-600">
                  {language === 'en' ? 'Receive updates via email' : 'ইমেলের মাধ্যমে আপডেট পান'}
                </p>
              </div>
            </div>
            <ToggleSwitch
              checked={preferences.email}
              onChange={(checked) => handleToggle('email')}
              label=""
            />
          </div>

          {/* SMS Notifications */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Smartphone className="h-5 w-5 text-gray-600" />
              <div>
                <p className="font-medium text-gray-900">
                  {language === 'en' ? 'SMS Notifications' : 'SMS নোটিফিকেশন'}
                </p>
                <p className="text-sm text-gray-600">
                  {language === 'en' ? 'Receive updates via SMS' : 'SMS এর মাধ্যমে আপডেট পান'}
                </p>
              </div>
            </div>
            <ToggleSwitch
              checked={preferences.sms}
              onChange={(checked) => handleToggle('sms')}
              label=""
            />
          </div>

          {/* WhatsApp Notifications */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <MessageSquare className="h-5 w-5 text-gray-600" />
              <div>
                <p className="font-medium text-gray-900">
                  {language === 'en' ? 'WhatsApp Notifications' : 'হোয়াটসঅ্যাপ নোটিফিকেশন'}
                </p>
                <p className="text-sm text-gray-600">
                  {language === 'en' ? 'Receive updates via WhatsApp' : 'হোয়াটসঅ্যাপের মাধ্যমে আপডেট পান'}
                </p>
              </div>
            </div>
            <ToggleSwitch
              checked={preferences.whatsapp}
              onChange={(checked) => handleToggle('whatsapp')}
              label=""
            />
          </div>
        </div>
      </div>

      {/* Notification Types */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">
          {language === 'en' ? 'Notification Types' : 'নোটিফিকেশন ধরন'}
        </h3>

        <div className="space-y-4 p-4 bg-gray-50 rounded-md">
          {/* Marketing */}
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900">
                {language === 'en' ? 'Marketing' : 'মার্কেটিং'}
              </p>
              <p className="text-sm text-gray-600">
                {language === 'en'
                  ? 'Receive promotional offers and discounts'
                  : 'প্রমোশনাল অফার এবং ডিসকাউন্ট পান'}
              </p>
            </div>
            <ToggleSwitch
              checked={preferences.marketing}
              onChange={(checked) => handleToggle('marketing')}
              label=""
            />
          </div>

          {/* Newsletter */}
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900">
                {language === 'en' ? 'Newsletter' : 'নিউজলেটার'}
              </p>
              <p className="text-sm text-gray-600">
                {language === 'en'
                  ? 'Receive news and updates'
                  : 'খবর এবং আপডেট পান'}
              </p>
            </div>
            <ToggleSwitch
              checked={preferences.newsletter}
              onChange={(checked) => handleToggle('newsletter')}
              label=""
            />
          </div>

          {/* Frequency */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              {language === 'en' ? 'Notification Frequency' : 'নোটিফিকেশন ফ্রিকোয়েন্সি'}
            </label>
            <select
              value={preferences.frequency || 'immediate'}
              onChange={(e) => handleFrequencyChange(e.target.value as any)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="immediate">
                {language === 'en' ? 'Immediate' : 'তাৎক্ষণিক'}
              </option>
              <option value="daily">
                {language === 'en' ? 'Daily' : 'দৈনিক'}
              </option>
              <option value="weekly">
                {language === 'en' ? 'Weekly' : 'সাপ্তাহিক'}
              </option>
              <option value="monthly">
                {language === 'en' ? 'Monthly' : 'মাসিক'}
              </option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationSettings;
