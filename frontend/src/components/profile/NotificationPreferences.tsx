'use client';

import React, { useState, useEffect } from 'react';
import { Bell, Mail, MessageSquare, Smartphone, Save, Check, AlertCircle, Loader2 } from 'lucide-react';
import { NotificationPreferencesAPI, NotificationPreferences as NotificationPreferencesType, UpdateNotificationPreferencesData } from '@/lib/api/profile';

interface NotificationPreferencesProps {
  language: 'en' | 'bn';
}

const NotificationPreferences: React.FC<NotificationPreferencesProps> = ({ language }) => {
  const [preferences, setPreferences] = useState<NotificationPreferencesType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await NotificationPreferencesAPI.getPreferences();
      setPreferences(response.preferences);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load notification preferences');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSavePreferences = async () => {
    if (!preferences) return;

    setIsSaving(true);
    setError(null);
    setSuccess(false);

    try {
      const updateData: UpdateNotificationPreferencesData = {
        emailNotifications: preferences.emailNotifications,
        smsNotifications: preferences.smsNotifications,
        pushNotifications: preferences.pushNotifications,
        orderUpdates: preferences.orderUpdates,
        promotionalEmails: preferences.promotionalEmails,
        securityAlerts: preferences.securityAlerts
      };

      const response = await NotificationPreferencesAPI.updatePreferences(updateData);
      setPreferences(response.preferences);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to save notification preferences');
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggle = (field: keyof NotificationPreferencesType) => {
    if (!preferences) return;
    setPreferences({
      ...preferences,
      [field]: !preferences[field]
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
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900">
          {language === 'en' ? 'Notification Preferences' : 'নোটিফিকেশন পছন্দ'}
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

      {/* Success Message */}
      {success && (
        <div className="flex items-center space-x-2 bg-green-50 border border-green-200 rounded-md p-4">
          <Check className="h-5 w-5 text-green-600" />
          <p className="text-sm text-green-800">
            {language === 'en' ? 'Notification preferences saved successfully!' : 'নোটিফিকেশন পছন্দ সফলভাবে সংরক্ষিত হয়েছে!'}
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
            <button
              onClick={() => handleToggle('emailNotifications')}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                preferences.emailNotifications ? 'bg-primary-600' : 'bg-gray-200'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  preferences.emailNotifications ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
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
            <button
              onClick={() => handleToggle('smsNotifications')}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                preferences.smsNotifications ? 'bg-primary-600' : 'bg-gray-200'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  preferences.smsNotifications ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Push Notifications */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <MessageSquare className="h-5 w-5 text-gray-600" />
              <div>
                <p className="font-medium text-gray-900">
                  {language === 'en' ? 'Push Notifications' : 'পুশ নোটিফিকেশন'}
                </p>
                <p className="text-sm text-gray-600">
                  {language === 'en' ? 'Receive browser push notifications' : 'ব্রাউজার পুশ নোটিফিকেশন পান'}
                </p>
              </div>
            </div>
            <button
              onClick={() => handleToggle('pushNotifications')}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                preferences.pushNotifications ? 'bg-primary-600' : 'bg-gray-200'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  preferences.pushNotifications ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Notification Types */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">
          {language === 'en' ? 'Notification Types' : 'নোটিফিকেশন ধরন'}
        </h3>

        <div className="space-y-4 p-4 bg-gray-50 rounded-md">
          {/* Order Updates */}
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900">
                {language === 'en' ? 'Order Updates' : 'অর্ডার আপডেট'}
              </p>
              <p className="text-sm text-gray-600">
                {language === 'en' 
                  ? 'Get notified about order status changes' 
                  : 'অর্ডার স্ট্যাটাস পরিবর্তন সম্পর্কে জানুন'}
              </p>
            </div>
            <button
              onClick={() => handleToggle('orderUpdates')}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                preferences.orderUpdates ? 'bg-primary-600' : 'bg-gray-200'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  preferences.orderUpdates ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Promotional Emails */}
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900">
                {language === 'en' ? 'Promotional Emails' : 'প্রমোশনাল ইমেল'}
              </p>
              <p className="text-sm text-gray-600">
                {language === 'en' 
                  ? 'Receive special offers and discounts' 
                  : 'বিশেষ অফার এবং ডিসকাউন্ট পান'}
              </p>
            </div>
            <button
              onClick={() => handleToggle('promotionalEmails')}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                preferences.promotionalEmails ? 'bg-primary-600' : 'bg-gray-200'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  preferences.promotionalEmails ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Security Alerts */}
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900">
                {language === 'en' ? 'Security Alerts' : 'নিরাপত্তা সতর্কতা'}
              </p>
              <p className="text-sm text-gray-600">
                {language === 'en' 
                  ? 'Get notified about security events' 
                  : 'নিরাপত্তা ইভেন্ট সম্পর্কে জানুন'}
              </p>
            </div>
            <button
              onClick={() => handleToggle('securityAlerts')}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                preferences.securityAlerts ? 'bg-primary-600' : 'bg-gray-200'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  preferences.securityAlerts ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationPreferences;
