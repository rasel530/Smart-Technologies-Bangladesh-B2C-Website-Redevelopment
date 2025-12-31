'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Mail, Phone, ArrowLeft, CheckCircle, AlertCircle } from 'lucide-react';
import { FormInput } from '@/components/ui/FormInput';
import { PhoneInput } from '@/components/ui/PhoneInput';
import { cn } from '@/lib/utils';

export default function ForgotPasswordPage() {
  const [identifier, setIdentifier] = useState('');
  const [method, setMethod] = useState<'email' | 'phone'>('email');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);
  const [language, setLanguage] = useState<'en' | 'bn'>('en');

  const router = useRouter();

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!identifier.trim()) {
      setError(language === 'bn' ? 'ইমেল বা ফোন নম্বর লিখুন' : 'Please enter email or phone number');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/v1/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          method,
          identifier: identifier.trim()
        }),
      }).then(res => res.json());

      if (response.success) {
        setSubmitStatus('success');
        setTimeout(() => {
          router.push('/login');
        }, 3000);
      } else {
        setSubmitStatus('error');
        setError(response.message || (language === 'bn' ? 'পাসওয়ার্ড রিসেট ব্যর্থ হয়েছে' : 'Failed to send reset link'));
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

  const isEmail = (value: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(value);
  };

  const isPhone = (value: string): boolean => {
    // Simple check for Bangladesh phone numbers (starts with +880 or 01, and has 10-11 digits)
    const phoneRegex = /^(\+880|01)?[1-9]\d{8,9}$/;
    return phoneRegex.test(value);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <Mail className="h-12 w-12 text-blue-600" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900">
            {language === 'bn' ? 'পাসওয়ার্ড ভুলে গেছেন?' : 'Forgot Password?'}
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            {language === 'bn' 
              ? 'আপনার ইমেল বা ফোন নম্বর লিখুন এবং আপনার পাসওয়ার্ড রিসেট লিংক পাঠানো হবে'
              : 'Enter your email or phone number and we\'ll send you a password reset link'
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
            {/* Method Selection */}
            <div className="flex space-x-4 mb-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="method"
                  value="email"
                  checked={method === 'email'}
                  onChange={(e) => setMethod(e.target.value as 'email' | 'phone')}
                  className="mr-2"
                />
                <span className="text-sm text-gray-700">
                  {language === 'bn' ? 'ইমেল' : 'Email'}
                </span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="method"
                  value="phone"
                  checked={method === 'phone'}
                  onChange={(e) => setMethod(e.target.value as 'email' | 'phone')}
                  className="mr-2"
                />
                <span className="text-sm text-gray-700">
                  {language === 'bn' ? 'ফোন' : 'Phone'}
                </span>
              </label>
            </div>

            {/* Identifier Input */}
            {method === 'email' ? (
              <FormInput
                type="email"
                label={language === 'bn' ? 'ইমেল ঠিকানা' : 'Email Address'}
                labelBn="ইমেল ঠিকানা"
                placeholder={language === 'bn' ? 'আপনার ইমেল ঠিকানা লিখুন' : 'Enter your email address'}
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                error={error || undefined}
                errorBn={error || undefined}
                required
                language={language}
                className="w-full"
                autoComplete="email"
              />
            ) : (
              <PhoneInput
                label={language === 'bn' ? 'ফোন নম্বর' : 'Phone Number'}
                labelBn="ফোন নম্বর"
                placeholder={language === 'bn' ? 'আপনার ফোন নম্বর লিখুন' : 'Enter your phone number'}
                value={identifier}
                onChange={(value) => setIdentifier(value)}
                error={error || undefined}
                errorBn={error || undefined}
                required
                language={language}
                className="w-full"
              />
            )}

            {/* Validation Helper */}
            {identifier && (
              <div className="text-xs text-gray-500 mt-1">
                {method === 'email' && !isEmail(identifier) && (
                  <p>
                    {language === 'bn' ? 'অবৈধ ইমেল ফরম্যাট' : 'Invalid email format'}
                  </p>
                )}
                {method === 'phone' && !isPhone(identifier) && (
                  <p>
                    {language === 'bn' ? 'অবৈধ বাংলাদেশ ফোন নম্বর' : 'Invalid Bangladesh phone number'}
                  </p>
                )}
                </div>
            )}
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
                    {language === 'bn' ? 'রিসেট লিংক পাঠানো হয়েছে' : 'Reset Link Sent'}
                  </span>
                </div>
              ) : isSubmitting ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-t-2 border-blue-600"></div>
                  <span className="ml-2">
                    {language === 'bn' ? 'পাঠানো হচ্ছে...' : 'Sending...'}
                  </span>
                </div>
              ) : (
                <div className="flex items-center">
                  {method === 'email' ? (
                    <Mail className="h-4 w-4 mr-2" />
                  ) : (
                    <Phone className="h-4 w-4 mr-2" />
                  )}
                  <span>
                    {language === 'bn' ? 'রিসেট লিংক পাঠান' : 'Send Reset Link'}
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
                    {language === 'bn' ? 'রিসেট লিংক সফলত্যব' : 'Reset Link Sent'}
                  </h3>
                  <p className="text-sm text-green-700 mt-1">
                    {language === 'bn' 
                      ? 'আপনার ইমেল/ফোনে পাসওয়ার্ড রিসেট লিংক পাঠানো হয়েছে। অনুগ্রয় ইমেল চেক করুন এবং নির্দেশিষ্ট অনুযায় পদক্ষা অনুসরণ করুন।'
                      : 'We have sent a password reset link to your email/phone. Please check your inbox/messages and follow the instructions to reset your password.'
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
                    {error || (language === 'bn' ? 'পাসওয়ার্ড রিসেট করতে ব্যর্থ হয়েছে' : 'Failed to send reset link. Please try again.')}
                  </p>
                </div>
              </div>
            </div>
          )}
        </form>

        {/* Back to Login */}
        <div className="text-center mt-6">
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
};