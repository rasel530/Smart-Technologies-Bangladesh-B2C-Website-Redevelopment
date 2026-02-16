'use client';

/**
 * Admin Wishlist Settings Page
 *
 * Page for configuring wishlist settings including:
 * - Maximum wishlists per user
 * - Maximum items per wishlist
 * - Default privacy setting
 * - Share token expiration
 * - Enable/disable sharing and export
 * - Analytics retention period
 */

import React, { useState, useEffect } from 'react';
import { withAuth } from '@/components/auth/withAuth';
import {
  RefreshCw,
  Save,
  Settings,
  Heart,
  ShoppingBag,
  Lock,
  Share2,
  Download,
  Database,
  CheckCircle
} from 'lucide-react';
import {
  getWishlistSettings,
  updateWishlistSettings,
  type WishlistSettings
} from '@/lib/api/adminWishlist';
import { cn } from '@/lib/utils';

function AdminWishlistSettingsPage() {
  const [settings, setSettings] = useState<WishlistSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [formData, setFormData] = useState<Partial<WishlistSettings>>({});

  /**
   * Load settings
   */
  const loadSettings = async () => {
    setIsLoading(true);
    try {
      const data = await getWishlistSettings();
      setSettings(data);
      setFormData(data);
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  /**
   * Handle form change
   */
  const handleFormChange = (field: keyof WishlistSettings, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setSaveSuccess(false);
  };

  /**
   * Handle save settings
   */
  const handleSaveSettings = async () => {
    setIsSaving(true);
    try {
      const updated = await updateWishlistSettings(formData);
      setSettings(updated);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      console.error('Error saving settings:', error);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-t-2 border-pink-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Wishlist Settings
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Configure wishlist behavior and limits
          </p>
        </div>
        <div className="flex items-center gap-2">
          {saveSuccess && (
            <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
              <CheckCircle className="w-5 h-5" />
              <span className="text-sm font-medium">Settings saved!</span>
            </div>
          )}
          <button
            type="button"
            onClick={loadSettings}
            disabled={isLoading}
            className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <RefreshCw className={cn('w-4 h-4', isLoading && 'animate-spin')} />
            Reset
          </button>
          <button
            type="button"
            onClick={handleSaveSettings}
            disabled={isSaving}
            className="inline-flex items-center gap-2 px-4 py-2 bg-pink-600 text-white rounded-md hover:bg-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Save className={cn('w-4 h-4', isSaving && 'animate-spin')} />
            {isSaving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>

      {/* Settings Form */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Wishlist Limits */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2">
              <Heart className="w-5 h-5 text-pink-600" />
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Wishlist Limits
              </h2>
            </div>
          </div>
          <div className="p-6 space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Maximum Wishlists Per User
              </label>
              <input
                type="number"
                min="1"
                max="100"
                value={formData.maxWishlistsPerUser || ''}
                onChange={(e) => handleFormChange('maxWishlistsPerUser', parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-pink-500"
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Maximum number of wishlists a user can create
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Maximum Items Per Wishlist
              </label>
              <input
                type="number"
                min="1"
                max="1000"
                value={formData.maxItemsPerWishlist || ''}
                onChange={(e) => handleFormChange('maxItemsPerWishlist', parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-pink-500"
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Maximum number of items a wishlist can contain
              </p>
            </div>
          </div>
        </div>

        {/* Privacy Settings */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2">
              <Lock className="w-5 h-5 text-pink-600" />
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Privacy Settings
              </h2>
            </div>
          </div>
          <div className="p-6 space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Default Privacy Setting
              </label>
              <select
                value={formData.defaultPrivacy || 'private'}
                onChange={(e) => handleFormChange('defaultPrivacy', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-pink-500"
              >
                <option value="private">Private</option>
                <option value="public">Public</option>
              </select>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Default privacy setting for new wishlists
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Share Token Expiration (Days)
              </label>
              <input
                type="number"
                min="1"
                max="365"
                value={formData.shareTokenExpirationDays || ''}
                onChange={(e) => handleFormChange('shareTokenExpirationDays', parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-pink-500"
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Number of days before share tokens expire
              </p>
            </div>
          </div>
        </div>

        {/* Feature Toggles */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2">
              <Settings className="w-5 h-5 text-pink-600" />
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Feature Toggles
              </h2>
            </div>
          </div>
          <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Enable Wishlist Sharing
                </label>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Allow users to share their wishlists
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleFormChange('enableSharing', !formData.enableSharing)}
                className={cn(
                  'relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-pink-500',
                  formData.enableSharing ? 'bg-pink-600' : 'bg-gray-200 dark:bg-gray-700'
                )}
              >
                <span
                  className={cn(
                    'pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition duration-200 ease-in-out',
                    formData.enableSharing ? 'translate-x-5' : 'translate-x-0'
                  )}
                />
              </button>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Enable Wishlist Export
                </label>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Allow users to export their wishlists
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleFormChange('enableExport', !formData.enableExport)}
                className={cn(
                  'relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-pink-500',
                  formData.enableExport ? 'bg-pink-600' : 'bg-gray-200 dark:bg-gray-700'
                )}
              >
                <span
                  className={cn(
                    'pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition duration-200 ease-in-out',
                    formData.enableExport ? 'translate-x-5' : 'translate-x-0'
                  )}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Data Retention */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2">
              <Database className="w-5 h-5 text-pink-600" />
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Data Retention
              </h2>
            </div>
          </div>
          <div className="p-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Analytics Retention Period (Days)
              </label>
              <input
                type="number"
                min="7"
                max="365"
                value={formData.analyticsRetentionDays || ''}
                onChange={(e) => handleFormChange('analyticsRetentionDays', parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-pink-500"
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Number of days to retain wishlist analytics data
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default withAuth(AdminWishlistSettingsPage, {
  requiredRole: ['admin', 'super_admin'],
  redirectTo: '/login',
  unauthorizedRedirectTo: '/403'
});
