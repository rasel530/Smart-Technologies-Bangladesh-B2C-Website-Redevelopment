'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Lock, CheckCircle, AlertCircle, ArrowLeft, Eye, EyeOff } from 'lucide-react';
import { FormInput } from '@/components/ui/FormInput';
import { cn } from '@/lib/utils';

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);
  const [token, setToken] = useState<string>('');
  const [language, setLanguage] = useState<'en' | 'bn'>('en');

  const router = useRouter();
  const searchParams = useSearchParams();

  // Load language preference from localStorage on mount
  useEffect(() => {
    const savedLanguage = localStorage.getItem('preferredLanguage');
    if (savedLanguage && ['en', 'bn'].includes(savedLanguage)) {
      setLanguage(savedLanguage as 'en' | 'bn');
    }
  }, []);

  const handleLanguageChange = (newLanguage: 'en' | 'bn') => {
    setLanguage(newLanguage);
    localStorage.setItem('preferredLanguage', newLanguage);
  };
  
  useEffect(() => {
    const tokenParam = searchParams.get('token');
    if (tokenParam) {
      setToken(tokenParam);
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!password.trim()) {
      setError(language === 'bn' ? 'পাসওয়ার্ড লিখুন' : 'Please enter a new password');
      return;
    }

    if (password !== confirmPassword) {
      setError(language === 'bn' ? 'পাসওয়ার্ড মিলে যায়' : 'Passwords do not match');
      return;
    }

    if (password.length < 8) {
      setError(language === 'bn' ? 'পাসওয়ার্ড অন্তত ৮ অক্ষরের হওয়া উচিত' : 'Password must be at least 8 characters long');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/v1/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token,
          password: password.trim(),
          confirmPassword: confirmPassword.trim()
        }),
      }).then(res => res.json());

      if (response.success) {
        setSubmitStatus('success');
        setTimeout(() => {
          router.push('/login');
        }, 3000);
      } else {
        setSubmitStatus('error');
        setError(response.message || (language === 'bn' ? 'পাসওয়ার্ড রিসেট ব্যর্থ হয়েছে' : 'Failed to reset password'));
      }
    } catch (err: any) {
      setSubmitStatus('error');
      setError(err.message || (language === 'bn' ? 'একটি ত্রুটি হয়েছে' : 'An error occurred'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBackToLogin = () => {
    router.push('/login');
  };

  const getPasswordStrengthColor = (password: string): string => {
    if (password.length < 8) return 'text-red-500';
    if (password.length < 12) return 'text-yellow-500';
    if (/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/.test(password)) {
      return 'text-green-500';
    }
    return 'text-yellow-500';
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <Lock className="h-12 w-12 text-blue-600" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900">
            {language === 'bn' ? 'পাসওয়ার্ড রিসেট করুন' : 'Reset Password'}
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            {language === 'bn' 
              ? 'আপনার নতুন পাসওয়ার্ড সেট করতে পারবতন করুন'
              : 'Enter your new password to complete the reset process'
            }
          </p>
        </div>

        {/* Language Toggle */}
        <div className="flex justify-center mb-6">
          <div className="bg-white rounded-lg shadow-sm p-1 flex items-center space-x-2">
            <span className="text-sm text-gray-600 mr-2">
              {language === 'bn' ? 'ভাষা:' : 'Language:'}
            </span>
            <button
              type="button"
              onClick={() => handleLanguageChange('en')}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-colors duration-200 ${
                language === 'en'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
              aria-label="Switch to English"
            >
              English
            </button>
            <button
              type="button"
              onClick={() => handleLanguageChange('bn')}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-colors duration-200 ${
                language === 'bn'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
              aria-label="Switch to Bengali"
            >
              বাংলা
            </button>
          </div>
        </div>

        {/* Reset Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            {/* Password Field */}
            <div className="relative">
              <FormInput
                type={showPassword ? 'text' : 'password'}
                label={language === 'bn' ? 'নতুন পাসওয়ার্ড' : 'New Password'}
                labelBn="নতুন পাসওয়ার্ড"
                placeholder={language === 'bn' ? 'নতুন পাসওয়ার্ড লিখুন' : 'Enter your new password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                error={error || undefined}
                errorBn={error || undefined}
                required
                language={language}
                className="w-full pr-10"
                autoComplete="new-password"
              />
              
              {/* Password Visibility Toggle */}
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4 text-gray-400" />
                ) : (
                  <Eye className="h-4 w-4 text-gray-400" />
                )}
              </button>
            </div>

            {/* Password Strength Indicator */}
            {password && (
              <div className="mt-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">
                    {language === 'bn' ? 'পাসওয়ার্ড শক্ষর:' : 'Password Strength:'}
                  </span>
                  <div className="flex space-x-1">
                    <div className={cn('h-2 w-8 rounded-full', getPasswordStrengthColor(password))}></div>
                    <div className={cn('h-2 w-8 rounded-full', getPasswordStrengthColor(password))}></div>
                    <div className={cn('h-2 w-8 rounded-full', getPasswordStrengthColor(password))}></div>
                    <div className={cn('h-2 w-8 rounded-full', getPasswordStrengthColor(password))}></div>
                  </div>
                </div>
              </div>
            )}

            {/* Confirm Password Field */}
            <div className="relative">
              <FormInput
                type={showConfirmPassword ? 'text' : 'password'}
                label={language === 'bn' ? 'পাসওয়ার্ড নিশিচ করুন' : 'Confirm New Password'}
                labelBn="পাসওয়ার্ড নিশিচ করুন"
                placeholder={language === 'bn' ? 'পাসওয়ার্ড আবার লিখুন' : 'Confirm your new password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                error={error || undefined}
                errorBn={error || undefined}
                required
                language={language}
                className="w-full pr-10"
                autoComplete="new-password"
              />
              
              {/* Confirm Password Visibility Toggle */}
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
              >
                {showConfirmPassword ? (
                  <EyeOff className="h-4 w-4 text-gray-400" />
                ) : (
                  <Eye className="h-4 w-4 text-gray-400" />
                )}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <div>
            <button
              type="submit"
              disabled={isSubmitting || submitStatus === 'success'}
              className={cn(
                'w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium',
                {
                  'bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500': !isSubmitting && submitStatus !== 'success',
                  'bg-blue-400 text-gray-300 cursor-not-allowed': isSubmitting,
                  'bg-green-600 text-white': submitStatus === 'success'
                }
              )}
            >
              {submitStatus === 'success' ? (
                <div className="flex items-center">
                  <CheckCircle className="h-4 w-4 mr-2" />
                  <span>
                    {language === 'bn' ? 'পাসওয়ার্ড রিসেট সফলত্যব' : 'Password Reset Successfully'}
                  </span>
                </div>
              ) : isSubmitting ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-t-2 border-blue-600"></div>
                  <span className="ml-2">
                    {language === 'bn' ? 'পাসওয়ার্ড রিসেট হচ্ছে...' : 'Resetting...'}
                  </span>
                </div>
              ) : (
                <div className="flex items-center">
                  <Lock className="h-4 w-4 mr-2" />
                  <span>
                    {language === 'bn' ? 'পাসওয়ার্ড রিসেট করুন' : 'Reset Password'}
                  </span>
                </div>
              )}
            </button>
          </div>

          {/* Success Message */}
          {submitStatus === 'success' && (
            <div className="rounded-md bg-green-50 border border-green-200 p-4">
              <div className="flex">
                <CheckCircle className="h-5 w-5 text-green-400" />
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-green-800">
                    {language === 'bn' ? 'পাসওয়ার্ড রিসেট সফলত্যব' : 'Password Reset Successfully'}
                  </h3>
                  <p className="text-sm text-green-700 mt-1">
                    {language === 'bn' 
                      ? 'আপনার পাসওয়ার্ড রিসেট সফলত্যব হয়েছে। অনুগ্রয় ইমেল চেক করুন এবং নির্দেশিষ্ট অনুযায় পদক্ষা অনুসরণ করুন।'
                      : 'Your password has been reset successfully. You can now login with your new password.'
                    }
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Error Message */}
          {submitStatus === 'error' && (
            <div className="rounded-md bg-red-50 border border-red-200 p-4">
              <div className="flex">
                <AlertCircle className="h-5 w-5 text-red-400" />
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">
                    {language === 'bn' ? 'ব্যর্থ হয়েছে' : 'Error'}
                  </h3>
                  <p className="text-sm text-red-700 mt-1">
                    {error || (language === 'bn' ? 'পাসওয়ার্ড রিসেট ব্যর্থ হয়েছে' : 'Failed to reset password. Please try again.')}
                  </p>
                </div>
              </div>
            </div>
          )}
        </form>

        {/* Back to Login */}
        <div className="text-center">
          <button
              type="button"
              onClick={handleBackToLogin}
              className="flex items-center justify-center text-sm text-gray-600 hover:text-gray-500 font-medium"
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              {language === 'bn' ? 'লগইন পাতায় ফিরে যান' : 'Back to Login'}
            </button>
          </div>
      </div>
    </div>
  );
}