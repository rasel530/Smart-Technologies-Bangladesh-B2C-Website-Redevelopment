'use client';

import React, { useState, useEffect } from 'react';
import { Bell, Shield, Lock, FileText, AlertTriangle, Menu } from 'lucide-react';
import { cn } from '@/lib/utils';
import NotificationSettings from '@/components/account/NotificationSettings';
import PrivacySettings from '@/components/account/PrivacySettings';
import PasswordChangeForm from '@/components/account/PasswordChangeForm';
import TwoFactorSetup from '@/components/account/TwoFactorSetup';
import DataExportSection from '@/components/account/DataExportSection';
import AccountDeletionSection from '@/components/account/AccountDeletionSection';
import { useAccountPreferences } from '@/hooks/useAccountPreferences';

type TabType = 'notifications' | 'privacy' | 'password' | '2fa' | 'export' | 'deletion';

const TABS: { id: TabType; label: { en: string; bn: string } }[] = [
  { id: 'notifications', label: { en: 'Notification Settings', bn: 'নোটিফিকেশন সেটিংস' } },
  { id: 'privacy', label: { en: 'Privacy Settings', bn: 'গোপনীয়তা সেটিংস' } },
  { id: 'password', label: { en: 'Password & Security', bn: 'পাসওয়ার্ড এবং নিরাপত্তা' } },
  { id: '2fa', label: { en: 'Two-Factor Auth', bn: 'দ্বি-ফ্যাক্টর প্রমাণীকরণ' } },
  { id: 'export', label: { en: 'Data Export', bn: 'ডেটা রপ্তানি' } },
  { id: 'deletion', label: { en: 'Account Deletion', bn: 'অ্যাকাউন্ট রপ্তানি মুছে ফেলা' } },
];

export default function AccountPreferencesPage() {
  const [activeTab, setActiveTab] = useState<TabType>('notifications');
  const [language, setLanguage] = useState<'en' | 'bn'>('en');
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const {
    preferences,
    privacySettings,
    deletionStatus,
    exports,
    isLoading,
    isSaving,
    error,
    loadNotificationPreferences,
    loadPrivacySettings,
    loadDeletionStatus,
    loadDataExports,
    clearError,
  } = useAccountPreferences();

  useEffect(() => {
    // Load all data on mount
    loadNotificationPreferences();
    loadPrivacySettings();
    loadDeletionStatus();
    loadDataExports();
  }, [loadNotificationPreferences, loadPrivacySettings, loadDeletionStatus, loadDataExports]);

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
  };

  const renderTab = () => {
    switch (activeTab) {
      case 'notifications':
        return <NotificationSettings language={language} />;
      case 'privacy':
        return <PrivacySettings language={language} />;
      case 'password':
        return (
          <div>
            <PasswordChangeForm language={language} />
            <TwoFactorSetup
              isOpen={showVerificationModal}
              onClose={() => setShowVerificationModal(false)}
              language={language}
            />
          </div>
        );
      case '2fa':
        return (
          <TwoFactorSetup
            isOpen={true}
            onClose={() => setShowVerificationModal(false)}
            language={language}
          />
        );
      case 'export':
        return <DataExportSection language={language} />;
      case 'deletion':
        return <AccountDeletionSection language={language} />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {language === 'en' ? 'Account Preferences' : 'অ্যাকাউন্ট পছন্দ'}
          </h1>
          <p className="text-gray-600">
            {language === 'en'
              ? 'Manage your account settings and preferences'
              : 'আপনার অ্যাকাউন্ট পছন্দ এবং পছন্দ করুন'}
          </p>
        </div>

        {/* Language Toggle */}
        <div className="mb-6 flex items-center justify-end space-x-4">
          <span className="text-sm text-gray-600">
            {language === 'en' ? 'Language:' : 'ভাষা:'}
          </span>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setLanguage('en')}
              className={cn(
                'px-3 py-1 rounded-md transition-colors',
                language === 'en'
                  ? 'bg-primary-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              )}
            >
              English
            </button>
            <button
              onClick={() => setLanguage('bn')}
              className={cn(
                'px-3 py-1 rounded-md transition-colors',
                language === 'bn'
                  ? 'bg-primary-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              )}
            >
              বাংলা
            </button>
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <div className="h-12 w-12 border-4 border-t-2 border-gray-200 rounded-full animate-spin" />
          </div>
        )}

        {/* Error State */}
        {error && !isLoading && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex items-start space-x-2">
              <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-semibold text-red-900 mb-1">
                  {language === 'en' ? 'Error' : 'ত্রুটি'}
                </h3>
                <p className="text-sm text-red-800">{error}</p>
                <button
                  onClick={clearError}
                  className="mt-3 px-3 py-1 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                >
                  {language === 'en' ? 'Dismiss' : 'বাতিল'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="mb-6">
          {/* Mobile: Horizontal scrollable tabs */}
          <div className="sm:hidden">
            <div className="flex overflow-x-auto space-x-1 border-b border-gray-200">
              {TABS.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  className={cn(
                    'flex-1 whitespace-nowrap px-4 py-3 text-sm font-medium transition-colors border-b-2',
                    activeTab === tab.id
                      ? 'border-primary-600 text-primary-600'
                      : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
                  )}
                >
                  {language === 'en' ? tab.label.en : tab.label.bn}
                </button>
              ))}
            </div>
          </div>

          {/* Desktop: Vertical tabs */}
          <div className="hidden sm:block">
            <div className="flex space-x-1 border-b border-gray-200">
              {TABS.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  className={cn(
                    'flex-1 px-4 py-3 text-sm font-medium transition-colors border-b-2',
                    activeTab === tab.id
                      ? 'border-primary-600 text-primary-600'
                      : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
                  )}
                >
                  <div className="flex items-center space-x-2">
                    {tab.id === 'notifications' && <Bell className="h-4 w-4" />}
                    {tab.id === 'privacy' && <Shield className="h-4 w-4" />}
                    {tab.id === 'password' && <Lock className="h-4 w-4" />}
                    {tab.id === '2fa' && <Shield className="h-4 w-4" />}
                    {tab.id === 'export' && <FileText className="h-4 w-4" />}
                    {tab.id === 'deletion' && <AlertTriangle className="h-4 w-4" />}
                    <span>{language === 'en' ? tab.label.en : tab.label.bn}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          {renderTab()}
        </div>

        {/* Saving Indicator */}
        {isSaving && (
          <div className="fixed bottom-0 left-0 right-0 z-50">
            <div className="flex items-center justify-center h-16 px-6 bg-black bg-opacity-50">
              <div className="h-8 w-8 border-4 border-t-2 border-white rounded-full animate-spin" />
              <span className="ml-3 text-white text-sm">
                {language === 'en' ? 'Saving...' : 'সংরক্ষণ হচ্ছে...'}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
