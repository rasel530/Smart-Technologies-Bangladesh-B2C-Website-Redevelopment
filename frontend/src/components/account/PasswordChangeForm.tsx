'use client';

import React, { useState } from 'react';
import { Lock, Save, Loader2, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { cn } from '@/lib/utils';
import PasswordStrengthMeter from '@/components/ui/PasswordStrengthMeter';
import ToastNotification from '@/components/ui/ToastNotification';
import AccountPreferencesAPI from '@/lib/api/accountPreferences';
import { PasswordChangeData } from '@/types/accountPreferences';

interface PasswordChangeFormProps {
  language: 'en' | 'bn';
}

const PasswordChangeForm: React.FC<PasswordChangeFormProps> = ({ language }) => {
  const [formData, setFormData] = useState<PasswordChangeData>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.currentPassword) {
      errors.currentPassword = language === 'en'
        ? 'Current password is required'
        : 'বর্তমান পাসওয়ার্ড প্রয়োজন';
    }

    if (!formData.newPassword) {
      errors.newPassword = language === 'en'
        ? 'New password is required'
        : 'নতুন পাসওয়ার্ড প্রয়োজন';
    } else if (formData.newPassword.length < 8) {
      errors.newPassword = language === 'en'
        ? 'Password must be at least 8 characters'
        : 'পাসওয়ার্ড অন্তত ৮ অক্ষরের হওয়া উচিত';
    }

    if (!formData.confirmPassword) {
      errors.confirmPassword = language === 'en'
        ? 'Please confirm your password'
        : 'দয়া করে আপনার পাসওয়ার্ড নিশ্চিত করুন';
    } else if (formData.newPassword !== formData.confirmPassword) {
      errors.confirmPassword = language === 'en'
        ? 'Passwords do not match'
        : 'পাসওয়ার্ডগুলি মিলছে না';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      await AccountPreferencesAPI.changePassword({
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword,
        confirmPassword: formData.confirmPassword
      });
      setToast({
        type: 'success',
        message: language === 'en'
          ? 'Password changed successfully!'
          : 'পাসওয়ার্ড সফলভাবে পরিবর্তন হয়েছে!',
      });
      setFormData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
      setValidationErrors({});
      setTimeout(() => setToast(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to change password');
      setToast({
        type: 'error',
        message: language === 'en'
          ? 'Failed to change password'
          : 'পাসওয়ার্ড পরিবর্তন করতে ব্যর্থ হয়েছে',
      });
      setTimeout(() => setToast(null), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  const handleChange = (field: keyof PasswordChangeData, value: string) => {
    setFormData({ ...formData, [field]: value });
    // Clear validation error for this field when user starts typing
    if (validationErrors[field]) {
      setValidationErrors({ ...validationErrors, [field]: '' });
    }
  };

  return (
    <div className="space-y-6">
      {toast && (
        <ToastNotification
          type={toast.type}
          message={toast.message}
          onClose={() => setToast(null)}
        />
      )}

      <h2 className="text-xl font-bold text-gray-900">
        {language === 'en' ? 'Change Password' : 'পাসওয়ার্ড পরিবর্তন করুন'}
      </h2>

      {/* Error Message */}
      {error && (
        <div className="flex items-start space-x-2 bg-red-50 border border-red-200 rounded-md p-4">
          <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Current Password */}
        <div className="space-y-2">
          <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700">
            {language === 'en' ? 'Current Password' : 'বর্তমান পাসওয়ার্ড'}
          </label>
          <div className="relative">
            <input
              type={showCurrentPassword ? 'text' : 'password'}
              id="currentPassword"
              value={formData.currentPassword}
              onChange={(e) => handleChange('currentPassword', e.target.value)}
              className={cn(
                'w-full px-3 py-2 pr-10 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent',
                validationErrors.currentPassword
                  ? 'border-red-300 focus:ring-red-500'
                  : 'border-gray-300'
              )}
              placeholder={language === 'en' ? 'Enter current password' : 'বর্তমান পাসওয়ার্ড লিখুন'}
              aria-describedby={validationErrors.currentPassword ? 'currentPassword-error' : undefined}
            />
            <button
              type="button"
              onClick={() => setShowCurrentPassword(!showCurrentPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
              aria-label={showCurrentPassword ? 'Hide password' : 'Show password'}
            >
              {showCurrentPassword ? (
                <EyeOff className="h-5 w-5" />
              ) : (
                <Eye className="h-5 w-5" />
              )}
            </button>
          </div>
          {validationErrors.currentPassword && (
            <p id="currentPassword-error" className="text-sm text-red-600">
              {validationErrors.currentPassword}
            </p>
          )}
        </div>

        {/* New Password */}
        <div className="space-y-2">
          <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700">
            {language === 'en' ? 'New Password' : 'নতুন পাসওয়ার্ড'}
          </label>
          <div className="relative">
            <input
              type={showNewPassword ? 'text' : 'password'}
              id="newPassword"
              value={formData.newPassword}
              onChange={(e) => handleChange('newPassword', e.target.value)}
              className={cn(
                'w-full px-3 py-2 pr-10 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent',
                validationErrors.newPassword
                  ? 'border-red-300 focus:ring-red-500'
                  : 'border-gray-300'
              )}
              placeholder={language === 'en' ? 'Enter new password' : 'নতুন পাসওয়ার্ড লিখুন'}
              aria-describedby={validationErrors.newPassword ? 'newPassword-error' : undefined}
            />
            <button
              type="button"
              onClick={() => setShowNewPassword(!showNewPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
              aria-label={showNewPassword ? 'Hide password' : 'Show password'}
            >
              {showNewPassword ? (
                <EyeOff className="h-5 w-5" />
              ) : (
                <Eye className="h-5 w-5" />
              )}
            </button>
          </div>
          {validationErrors.newPassword && (
            <p id="newPassword-error" className="text-sm text-red-600">
              {validationErrors.newPassword}
            </p>
          )}

          {/* Password Strength Meter */}
          {formData.newPassword && (
            <PasswordStrengthMeter
              password={formData.newPassword}
              language={language}
              className="mt-2"
            />
          )}
        </div>

        {/* Confirm Password */}
        <div className="space-y-2">
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
            {language === 'en' ? 'Confirm New Password' : 'নতুন পাসওয়ার্ড নিশ্চিত করুন'}
          </label>
          <div className="relative">
            <input
              type={showConfirmPassword ? 'text' : 'password'}
              id="confirmPassword"
              value={formData.confirmPassword}
              onChange={(e) => handleChange('confirmPassword', e.target.value)}
              className={cn(
                'w-full px-3 py-2 pr-10 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent',
                validationErrors.confirmPassword
                  ? 'border-red-300 focus:ring-red-500'
                  : 'border-gray-300'
              )}
              placeholder={language === 'en' ? 'Confirm new password' : 'নতুন পাসওয়ার্ড নিশ্চিত করুন'}
              aria-describedby={validationErrors.confirmPassword ? 'confirmPassword-error' : undefined}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
              aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
            >
              {showConfirmPassword ? (
                <EyeOff className="h-5 w-5" />
              ) : (
                <Eye className="h-5 w-5" />
              )}
            </button>
          </div>
          {validationErrors.confirmPassword && (
            <p id="confirmPassword-error" className="text-sm text-red-600">
              {validationErrors.confirmPassword}
            </p>
          )}
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSaving}
          className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSaving ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>{language === 'en' ? 'Changing...' : 'পরিবর্তন হচ্ছে...'}</span>
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              <span>{language === 'en' ? 'Change Password' : 'পাসওয়ার্ড পরিবর্তন করুন'}</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
};

export default PasswordChangeForm;
