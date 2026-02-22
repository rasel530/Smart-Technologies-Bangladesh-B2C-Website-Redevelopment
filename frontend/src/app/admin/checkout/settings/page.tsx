'use client';

import React, { useState, useEffect } from 'react';
import { withAuth } from '@/components/auth/withAuth';
import { apiClient } from '@/lib/api/client';
import { 
  Settings, 
  Loader2, 
  Save, 
  RefreshCw, 
  Clock,
  Mail,
  Shield,
  Smartphone,
  CheckCircle,
  X
} from 'lucide-react';

// Types
interface CheckoutSettings {
  sessionTimeout: number;
  abandonmentDetection: {
    enabled: boolean;
    timeoutMinutes: number;
    checkIntervalMinutes: number;
  };
  recoveryEmail: {
    enabled: boolean;
    sendAfterMinutes: number;
    maxAttempts: number;
  };
  guestCheckout: {
    enabled: boolean;
    requireEmail: boolean;
    requirePhone: boolean;
    maxSessionDuration: number;
    allowAccountCreation: boolean;
  };
  security: {
    requireAuthForHighValue: boolean;
    highValueThreshold: number;
    enableFraudDetection: boolean;
  };
  mobile: {
    enabled: boolean;
    optimizeForMobile: boolean;
    showMobileOptimizedUI: boolean;
  };
  steps: {
    cart: { enabled: boolean; required: boolean };
    shipping: { enabled: boolean; required: boolean };
    billing: { enabled: boolean; required: boolean };
    payment: { enabled: boolean; required: boolean };
    review: { enabled: boolean; required: boolean };
    confirmation: { enabled: boolean; required: boolean };
  };
}

interface SettingsResponse {
  success: boolean;
  data: CheckoutSettings;
}

/**
 * Admin Checkout Settings Page
 * 
 * This page provides a comprehensive interface for configuring checkout settings.
 * Admins can customize session timeout, abandonment detection, recovery emails,
 * guest checkout options, security settings, mobile settings, and checkout steps.
 * 
 * Features:
 * - Configure session timeout duration
 * - Enable/disable abandonment detection
 * - Set abandonment timeout and check interval
 * - Configure recovery email settings
 * - Set recovery email timing and max attempts
 * - Configure guest checkout options
 * - Set guest session requirements and duration
 * - Configure security settings
 * - Set high-value order thresholds
 * - Enable/disable fraud detection
 * - Configure mobile checkout settings
 * - Enable/disable checkout steps
 * - Mobile-responsive design
 */
function AdminCheckoutSettingsPage() {
  const [settings, setSettings] = useState<CheckoutSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    setError(null);

    try {
      const response: SettingsResponse = await apiClient.get('/admin/checkout/settings');
      setSettings(response.data);
    } catch (err: any) {
      console.error('Error fetching checkout settings:', err);
      setError(err.message || 'Failed to load checkout settings. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    if (!settings) return;

    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      await apiClient.put('/admin/checkout/settings', settings);
      setSuccess(true);
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      console.error('Error saving checkout settings:', err);
      setError(err.message || 'Failed to save checkout settings. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (section: keyof CheckoutSettings, field: string, value: any) => {
    if (!settings) return;

    setSettings({
      ...settings,
      [section]: {
        ...(settings[section] as any),
        [field]: value
      }
    } as CheckoutSettings);
  };

  const handleStepChange = (step: string, field: 'enabled' | 'required', value: boolean) => {
    if (!settings) return;

    setSettings({
      ...settings,
      steps: {
        ...settings.steps,
        [step]: {
          ...settings.steps[step as keyof typeof settings.steps],
          [field]: value
        }
      }
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading checkout settings...</p>
        </div>
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded">
        <p className="text-red-700">Failed to load checkout settings.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-blue-100 rounded-lg">
            <Settings className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Checkout Settings</h1>
            <p className="text-gray-600 mt-1">
              Configure checkout behavior and options
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={fetchSettings}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
          <button
            onClick={handleSaveSettings}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Save Settings
              </>
            )}
          </button>
        </div>
      </div>

      {/* Success Message */}
      {success && (
        <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded">
          <div className="flex">
            <div className="flex-shrink-0">
              <CheckCircle className="h-5 w-5 text-green-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-green-700">Checkout settings saved successfully!</p>
            </div>
            <div className="flex-shrink-0">
              <button
                onClick={() => setSuccess(false)}
                className="text-green-600 hover:text-green-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded">
          <div className="flex">
            <div className="flex-shrink-0">
              <X className="h-5 w-5 text-red-400" />
            </div>
            <div className="ml-3 flex-1">
              <p className="text-sm text-red-700">{error}</p>
            </div>
            <div className="flex-shrink-0">
              <button
                onClick={() => setError(null)}
                className="text-red-600 hover:text-red-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Session Settings */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center gap-2 mb-4">
          <Clock className="w-5 h-5 text-gray-600" />
          <h2 className="text-lg font-semibold text-gray-900">Session Settings</h2>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Session Timeout (seconds)
            </label>
            <input
              type="number"
              value={settings.sessionTimeout}
              onChange={(e) => handleInputChange('sessionTimeout', 'sessionTimeout', parseInt(e.target.value))}
              className="w-full max-w-xs border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <p className="text-xs text-gray-500 mt-1">How long a checkout session remains active (default: 1800 seconds = 30 minutes)</p>
          </div>
        </div>
      </div>

      {/* Abandonment Detection Settings */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center gap-2 mb-4">
          <Clock className="w-5 h-5 text-gray-600" />
          <h2 className="text-lg font-semibold text-gray-900">Abandonment Detection</h2>
        </div>
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="abandonmentEnabled"
              checked={settings.abandonmentDetection.enabled}
              onChange={(e) => handleInputChange('abandonmentDetection', 'enabled', e.target.checked)}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label htmlFor="abandonmentEnabled" className="text-sm font-medium text-gray-700">
              Enable Abandonment Detection
            </label>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Timeout (minutes)
            </label>
            <input
              type="number"
              value={settings.abandonmentDetection.timeoutMinutes}
              onChange={(e) => handleInputChange('abandonmentDetection', 'timeoutMinutes', parseInt(e.target.value))}
              className="w-full max-w-xs border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <p className="text-xs text-gray-500 mt-1">Minutes of inactivity before marking as abandoned</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Check Interval (minutes)
            </label>
            <input
              type="number"
              value={settings.abandonmentDetection.checkIntervalMinutes}
              onChange={(e) => handleInputChange('abandonmentDetection', 'checkIntervalMinutes', parseInt(e.target.value))}
              className="w-full max-w-xs border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <p className="text-xs text-gray-500 mt-1">How often to check for abandoned sessions</p>
          </div>
        </div>
      </div>

      {/* Recovery Email Settings */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center gap-2 mb-4">
          <Mail className="w-5 h-5 text-gray-600" />
          <h2 className="text-lg font-semibold text-gray-900">Recovery Email</h2>
        </div>
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="recoveryEmailEnabled"
              checked={settings.recoveryEmail.enabled}
              onChange={(e) => handleInputChange('recoveryEmail', 'enabled', e.target.checked)}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label htmlFor="recoveryEmailEnabled" className="text-sm font-medium text-gray-700">
              Enable Recovery Emails
            </label>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Send After (minutes)
            </label>
            <input
              type="number"
              value={settings.recoveryEmail.sendAfterMinutes}
              onChange={(e) => handleInputChange('recoveryEmail', 'sendAfterMinutes', parseInt(e.target.value))}
              className="w-full max-w-xs border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <p className="text-xs text-gray-500 mt-1">Minutes after abandonment to send recovery email</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Maximum Attempts
            </label>
            <input
              type="number"
              value={settings.recoveryEmail.maxAttempts}
              onChange={(e) => handleInputChange('recoveryEmail', 'maxAttempts', parseInt(e.target.value))}
              className="w-full max-w-xs border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <p className="text-xs text-gray-500 mt-1">Maximum number of recovery emails to send</p>
          </div>
        </div>
      </div>

      {/* Guest Checkout Settings */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center gap-2 mb-4">
          <Users className="w-5 h-5 text-gray-600" />
          <h2 className="text-lg font-semibold text-gray-900">Guest Checkout</h2>
        </div>
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="guestCheckoutEnabled"
              checked={settings.guestCheckout.enabled}
              onChange={(e) => handleInputChange('guestCheckout', 'enabled', e.target.checked)}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label htmlFor="guestCheckoutEnabled" className="text-sm font-medium text-gray-700">
              Enable Guest Checkout
            </label>
          </div>
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="requireEmail"
              checked={settings.guestCheckout.requireEmail}
              onChange={(e) => handleInputChange('guestCheckout', 'requireEmail', e.target.checked)}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label htmlFor="requireEmail" className="text-sm font-medium text-gray-700">
              Require Email
            </label>
          </div>
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="requirePhone"
              checked={settings.guestCheckout.requirePhone}
              onChange={(e) => handleInputChange('guestCheckout', 'requirePhone', e.target.checked)}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label htmlFor="requirePhone" className="text-sm font-medium text-gray-700">
              Require Phone
            </label>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Max Session Duration (seconds)
            </label>
            <input
              type="number"
              value={settings.guestCheckout.maxSessionDuration}
              onChange={(e) => handleInputChange('guestCheckout', 'maxSessionDuration', parseInt(e.target.value))}
              className="w-full max-w-xs border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <p className="text-xs text-gray-500 mt-1">Maximum duration for guest sessions</p>
          </div>
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="allowAccountCreation"
              checked={settings.guestCheckout.allowAccountCreation}
              onChange={(e) => handleInputChange('guestCheckout', 'allowAccountCreation', e.target.checked)}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label htmlFor="allowAccountCreation" className="text-sm font-medium text-gray-700">
              Allow Account Creation After Checkout
            </label>
          </div>
        </div>
      </div>

      {/* Security Settings */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center gap-2 mb-4">
          <Shield className="w-5 h-5 text-gray-600" />
          <h2 className="text-lg font-semibold text-gray-900">Security Settings</h2>
        </div>
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="requireAuthForHighValue"
              checked={settings.security.requireAuthForHighValue}
              onChange={(e) => handleInputChange('security', 'requireAuthForHighValue', e.target.checked)}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label htmlFor="requireAuthForHighValue" className="text-sm font-medium text-gray-700">
              Require Authentication for High-Value Orders
            </label>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              High-Value Threshold
            </label>
            <input
              type="number"
              value={settings.security.highValueThreshold}
              onChange={(e) => handleInputChange('security', 'highValueThreshold', parseFloat(e.target.value))}
              className="w-full max-w-xs border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <p className="text-xs text-gray-500 mt-1">Order value threshold for requiring authentication</p>
          </div>
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="enableFraudDetection"
              checked={settings.security.enableFraudDetection}
              onChange={(e) => handleInputChange('security', 'enableFraudDetection', e.target.checked)}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label htmlFor="enableFraudDetection" className="text-sm font-medium text-gray-700">
              Enable Fraud Detection
            </label>
          </div>
        </div>
      </div>

      {/* Mobile Settings */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center gap-2 mb-4">
          <Smartphone className="w-5 h-5 text-gray-600" />
          <h2 className="text-lg font-semibold text-gray-900">Mobile Settings</h2>
        </div>
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="mobileEnabled"
              checked={settings.mobile.enabled}
              onChange={(e) => handleInputChange('mobile', 'enabled', e.target.checked)}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label htmlFor="mobileEnabled" className="text-sm font-medium text-gray-700">
              Enable Mobile Checkout
            </label>
          </div>
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="optimizeForMobile"
              checked={settings.mobile.optimizeForMobile}
              onChange={(e) => handleInputChange('mobile', 'optimizeForMobile', e.target.checked)}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label htmlFor="optimizeForMobile" className="text-sm font-medium text-gray-700">
              Optimize for Mobile
            </label>
          </div>
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="showMobileOptimizedUI"
              checked={settings.mobile.showMobileOptimizedUI}
              onChange={(e) => handleInputChange('mobile', 'showMobileOptimizedUI', e.target.checked)}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label htmlFor="showMobileOptimizedUI" className="text-sm font-medium text-gray-700">
              Show Mobile Optimized UI
            </label>
          </div>
        </div>
      </div>

      {/* Checkout Steps */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center gap-2 mb-4">
          <Settings className="w-5 h-5 text-gray-600" />
          <h2 className="text-lg font-semibold text-gray-900">Checkout Steps</h2>
        </div>
        <div className="space-y-4">
          {Object.entries(settings.steps).map(([step, config]) => (
            <div key={step} className="flex items-center gap-6 p-4 bg-gray-50 rounded-lg">
              <span className="font-medium text-gray-900 capitalize w-32">{step}</span>
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id={`${step}-enabled`}
                  checked={config.enabled}
                  onChange={(e) => handleStepChange(step, 'enabled', e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor={`${step}-enabled`} className="text-sm text-gray-700">
                  Enabled
                </label>
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id={`${step}-required`}
                  checked={config.required}
                  onChange={(e) => handleStepChange(step, 'required', e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor={`${step}-required`} className="text-sm text-gray-700">
                  Required
                </label>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Import Users icon
import { Users } from 'lucide-react';

// Wrap with authentication HOC
export default withAuth(AdminCheckoutSettingsPage, {
  requiredRole: ['admin', 'super_admin'],
  redirectTo: '/login',
  unauthorizedRedirectTo: '/403'
});
