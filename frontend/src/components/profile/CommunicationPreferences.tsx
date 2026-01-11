'use client';

import React, { useState, useEffect } from 'react';
import { Globe, Clock, Mail, Phone, Save, Check, AlertCircle, Loader2 } from 'lucide-react';
import { CommunicationPreferencesAPI, CommunicationPreferences as CommunicationPreferencesType, UpdateCommunicationPreferencesData } from '@/lib/api/profile';

interface CommunicationPreferencesProps {
  language: 'en' | 'bn';
}

const CommunicationPreferences: React.FC<CommunicationPreferencesProps> = ({ language }) => {
  const [preferences, setPreferences] = useState<CommunicationPreferencesType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Available languages
  const languages = [
    { code: 'en', name: language === 'en' ? 'English' : 'ইংরেজি' },
    { code: 'bn', name: language === 'en' ? 'Bangla' : 'বাংলা' }
  ];

  // Available timezones
  const timezones = [
    { value: 'UTC', label: 'UTC (Coordinated Universal Time)' },
    { value: 'Asia/Dhaka', label: 'Asia/Dhaka (Bangladesh Standard Time)' },
    { value: 'Asia/Kolkata', label: 'Asia/Kolkata (India Standard Time)' },
    { value: 'America/New_York', label: 'America/New_York (Eastern Time)' },
    { value: 'America/Los_Angeles', label: 'America/Los_Angeles (Pacific Time)' },
    { value: 'Europe/London', label: 'Europe/London (Greenwich Mean Time)' },
    { value: 'Europe/Paris', label: 'Europe/Paris (Central European Time)' },
    { value: 'Asia/Tokyo', label: 'Asia/Tokyo (Japan Standard Time)' },
    { value: 'Australia/Sydney', label: 'Australia/Sydney (Australian Eastern Time)' }
  ];

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await CommunicationPreferencesAPI.getPreferences();
      setPreferences(response.preferences);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load communication preferences');
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
      const updateData: UpdateCommunicationPreferencesData = {
        preferredLanguage: preferences.preferredLanguage,
        preferredTimezone: preferences.preferredTimezone,
        preferredContactMethod: preferences.preferredContactMethod,
        marketingConsent: preferences.marketingConsent,
        dataSharingConsent: preferences.dataSharingConsent
      };

      const response = await CommunicationPreferencesAPI.updatePreferences(updateData);
      setPreferences(response.preferences);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to save communication preferences');
    } finally {
      setIsSaving(false);
    }
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
          {language === 'en' ? 'Failed to load communication preferences' : 'যোগাযোগ পছন্দ লোড করতে ব্যর্থ হয়েছে'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900">
          {language === 'en' ? 'Communication Preferences' : 'যোগাযোগ পছন্দ'}
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
            {language === 'en' ? 'Communication preferences saved successfully!' : 'যোগাযোগ পছন্দ সফলভাবে সংরক্ষিত হয়েছে!'}
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

      {/* Language & Timezone */}
      <div className="space-y-4">
        <h3 className="flex items-center space-x-2 text-lg font-semibold text-gray-900">
          <Globe className="h-5 w-5" />
          <span>{language === 'en' ? 'Language & Timezone' : 'ভাষা এবং সময় অঞ্চল'}</span>
        </h3>

        <div className="space-y-4 p-4 bg-gray-50 rounded-md">
          {/* Language Selector */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {language === 'en' ? 'Preferred Language' : 'পছন্দের ভাষা'}
            </label>
            <select
              value={preferences.preferredLanguage}
              onChange={(e) => setPreferences({ ...preferences, preferredLanguage: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              {languages.map((lang) => (
                <option key={lang.code} value={lang.code}>
                  {lang.name}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-gray-500">
              {language === 'en' ? 'Choose your preferred language for the interface' : 'ইন্টারফেসের জন্য আপনার পছন্দের ভাষা নির্বাচন করুন'}
            </p>
          </div>

          {/* Timezone Selector */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {language === 'en' ? 'Preferred Timezone' : 'পছন্দের সময় অঞ্চল'}
            </label>
            <select
              value={preferences.preferredTimezone}
              onChange={(e) => setPreferences({ ...preferences, preferredTimezone: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              {timezones.map((tz) => (
                <option key={tz.value} value={tz.value}>
                  {tz.label}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-gray-500">
              {language === 'en' ? 'Select your timezone for accurate time display' : 'সঠিক সময় প্রদর্শনের জন্য আপনার সময় অঞ্চল নির্বাচন করুন'}
            </p>
          </div>
        </div>
      </div>

      {/* Contact Method */}
      <div className="space-y-4">
        <h3 className="flex items-center space-x-2 text-lg font-semibold text-gray-900">
          <Clock className="h-5 w-5" />
          <span>{language === 'en' ? 'Contact Method' : 'যোগাযোগ পদ্ধতি'}</span>
        </h3>

        <div className="space-y-4 p-4 bg-gray-50 rounded-md">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {language === 'en' ? 'How would you like us to contact you?' : 'আপনি কিভাবে আমাদের সাথে যোগাযোগ করতে চান?'}
          </label>

          <div className="space-y-3">
            {/* Email Only */}
            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="radio"
                name="contactMethod"
                value="email"
                checked={preferences.preferredContactMethod === 'email'}
                onChange={(e) => setPreferences({ ...preferences, preferredContactMethod: e.target.value as 'email' | 'phone' | 'both' })}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
              />
              <Mail className="h-5 w-5 text-gray-600" />
              <div>
                <p className="font-medium text-gray-900">
                  {language === 'en' ? 'Email only' : 'শুধুমাত্র ইমেল'}
                </p>
                <p className="text-sm text-gray-600">
                  {language === 'en' ? 'Receive communications via email only' : 'শুধুমাত্র ইমেলের মাধ্যমে যোগাযোগ পান'}
                </p>
              </div>
            </label>

            {/* Phone Only */}
            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="radio"
                name="contactMethod"
                value="phone"
                checked={preferences.preferredContactMethod === 'phone'}
                onChange={(e) => setPreferences({ ...preferences, preferredContactMethod: e.target.value as 'email' | 'phone' | 'both' })}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
              />
              <Phone className="h-5 w-5 text-gray-600" />
              <div>
                <p className="font-medium text-gray-900">
                  {language === 'en' ? 'Phone only' : 'শুধুমাত্র ফোন'}
                </p>
                <p className="text-sm text-gray-600">
                  {language === 'en' ? 'Receive communications via phone/SMS only' : 'শুধুমাত্র ফোন/SMS এর মাধ্যমে যোগাযোগ পান'}
                </p>
              </div>
            </label>

            {/* Both Email and Phone */}
            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="radio"
                name="contactMethod"
                value="both"
                checked={preferences.preferredContactMethod === 'both'}
                onChange={(e) => setPreferences({ ...preferences, preferredContactMethod: e.target.value as 'email' | 'phone' | 'both' })}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
              />
              <div className="flex items-center space-x-2">
                <Mail className="h-5 w-5 text-gray-600" />
                <Phone className="h-5 w-5 text-gray-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">
                  {language === 'en' ? 'Both Email and Phone' : 'ইমেল এবং ফোন উভয়ই'}
                </p>
                <p className="text-sm text-gray-600">
                  {language === 'en' ? 'Receive communications via both email and phone' : 'ইমেল এবং ফোন উভয়ের মাধ্যমে যোগাযোগ পান'}
                </p>
              </div>
            </label>
          </div>
        </div>
      </div>

      {/* Consents */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">
          {language === 'en' ? 'Consents' : 'সম্মতি'}
        </h3>

        <div className="space-y-4 p-4 bg-gray-50 rounded-md">
          {/* Marketing Consent */}
          <label className="flex items-start space-x-3 cursor-pointer">
            <input
              type="checkbox"
              checked={preferences.marketingConsent}
              onChange={(e) => setPreferences({ ...preferences, marketingConsent: e.target.checked })}
              className="h-4 w-4 mt-1 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
            />
            <div>
              <p className="font-medium text-gray-900">
                {language === 'en' ? 'Marketing Communications' : 'মার্কেটিং যোগাযোগ'}
              </p>
              <p className="text-sm text-gray-600">
                {language === 'en'
                  ? 'I agree to receive marketing communications, promotional offers, and product updates via my preferred contact method.'
                  : 'আমি আমার পছন্দের যোগাযোগ পদ্ধতির মাধ্যমে মার্কেটিং যোগাযোগ, প্রমোশনাল অফার এবং পণ্য আপডেট পেতে সম্মতি জানাচ্ছি।'}
              </p>
            </div>
          </label>

          {/* Data Sharing Consent */}
          <label className="flex items-start space-x-3 cursor-pointer">
            <input
              type="checkbox"
              checked={preferences.dataSharingConsent}
              onChange={(e) => setPreferences({ ...preferences, dataSharingConsent: e.target.checked })}
              className="h-4 w-4 mt-1 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
            />
            <div>
              <p className="font-medium text-gray-900">
                {language === 'en' ? 'Data Sharing' : 'ডেটা শেয়ারিং'}
              </p>
              <p className="text-sm text-gray-600">
                {language === 'en'
                  ? 'I consent to sharing my data with trusted partners for improved service and personalized recommendations.'
                  : 'উন্নত সেবা এবং ব্যক্তিগতকৃত সুপারিশের জন্য আমি বিশ্বস্ত অংশীদারদের সাথে আমার ডেটা শেয়ার করতে সম্মতি জানাচ্ছি।'}
              </p>
            </div>
          </label>
        </div>
      </div>
    </div>
  );
};

export default CommunicationPreferences;
