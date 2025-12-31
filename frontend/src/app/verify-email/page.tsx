'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Mail, CheckCircle, AlertCircle, ArrowLeft } from 'lucide-react';
import { FormInput } from '@/components/ui/FormInput';
import { VerificationData, VerificationResponse } from '@/types/auth';
import { cn } from '@/lib/utils';

export default function EmailVerificationPage() {
  const [code, setCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState<string>('');
  const [language, setLanguage] = useState<'en' | 'bn'>('en');
  const [timeLeft, setTimeLeft] = useState<number>(600); // 10 minutes in seconds
  const [isResending, setIsResending] = useState(false);

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
    const emailParam = searchParams.get('email');
    if (emailParam) {
      setEmail(emailParam);
    }
  }, [searchParams]);

  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [timeLeft]);

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!code.trim()) {
      setError(language === 'bn' ? 'ভেরিফিকেশন কোড লিখুন' : 'Please enter verification code');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const response: VerificationResponse = await fetch('/api/v1/auth/verify-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          method: 'email',
          identifier: email,
          code: code.trim()
        } as VerificationData),
      }).then(res => res.json());

      if (response.success) {
        setVerificationStatus('success');
        setTimeout(() => {
          router.push('/login');
        }, 2000);
      } else {
        setVerificationStatus('error');
        setError(response.message || (language === 'bn' ? 'ভেরিফিকেশন ব্যর্থ হয়েছে' : 'Verification failed'));
      }
    } catch (err: any) {
      setVerificationStatus('error');
      setError(err.message || (language === 'bn' ? 'একটি ত্রুটি হয়েছে' : 'An error occurred'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResendCode = async () => {
    setIsResending(true);
    setError(null);

    try {
      const response = await fetch('/api/v1/auth/send-email-verification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      }).then(res => res.json());

      if (response.success) {
        setTimeLeft(600); // Reset timer to 10 minutes
        setError(language === 'bn' ? 'ভেরিফিকেশন কোড পুনরায় পাঠানো হয়েছে' : 'Verification code has been resent');
      } else {
        setError(response.message || (language === 'bn' ? 'কোড পাঠানো ব্যর্থ হয়েছে' : 'Failed to resend code'));
      }
    } catch (err: any) {
      setError(err.message || (language === 'bn' ? 'একটি ত্রুটি হয়েছে' : 'An error occurred'));
    } finally {
      setIsResending(false);
    }
  };

  const handleBackToLogin = () => {
    router.push('/login');
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
            {language === 'bn' ? 'ইমেল ভেরিফিকেশন' : 'Email Verification'}
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            {language === 'bn' 
              ? `আপনার ইমেল (${email}) এ পাঠানো ভেরিফিকেশন কোডটি লিখুন`
              : `Enter the verification code sent to ${email}`
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

        {/* Verification Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            {/* Verification Code Input */}
            <FormInput
              type="text"
              label={language === 'bn' ? 'ভেরিফিকেশন কোড' : 'Verification Code'}
              labelBn="ভেরিফিকেশন কোড"
              placeholder={language === 'bn' ? '৬ সংখ্যার কোড' : '6-digit code'}
              value={code}
              onChange={(e) => setCode(e.target.value)}
              error={error || undefined}
              errorBn={error || undefined}
              required
              language={language}
              maxLength={6}
              className="w-full text-center text-lg tracking-widest"
              autoComplete="one-time-code"
            />

            {/* Timer */}
            {timeLeft > 0 && (
              <div className="text-center">
                <p className="text-sm text-gray-600">
                  {language === 'bn' ? 'কোডের মেয়াদ সময়:' : 'Code expires in:'}{' '}
                  <span className="font-mono font-semibold text-blue-600">
                    {formatTime(timeLeft)}
                  </span>
                </p>
              </div>
            )}

            {/* Resend Code */}
            {timeLeft === 0 && (
              <div className="text-center">
                <button
                  type="button"
                  onClick={handleResendCode}
                  disabled={isResending}
                  className="text-sm text-blue-600 hover:text-blue-500 font-medium disabled:text-gray-400 disabled:cursor-not-allowed"
                >
                  {isResending ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-t-2 border-blue-600 mr-2"></div>
                      {language === 'bn' ? 'পাঠানো হচ্ছে...' : 'Sending...'}
                    </div>
                  ) : (
                    language === 'bn' ? 'কোড পুনরায় পাঠান' : 'Resend Code'
                  )}
                </button>
              </div>
            )}
          </div>

          {/* Submit Button */}
          <div>
            <button
              type="submit"
              disabled={isSubmitting || verificationStatus === 'success'}
              className={cn(
                'w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium',
                {
                  'bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500': !isSubmitting && verificationStatus !== 'success',
                  'bg-blue-400 text-gray-300 cursor-not-allowed': isSubmitting,
                  'bg-green-600 text-white': verificationStatus === 'success'
                }
              )}
            >
              {verificationStatus === 'success' ? (
                <div className="flex items-center">
                  <CheckCircle className="h-4 w-4 mr-2" />
                  <span>
                    {language === 'bn' ? 'ভেরিফিকেশন সম্পন্ন' : 'Verified Successfully'}
                  </span>
                </div>
              ) : isSubmitting ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-t-2 border-blue-600"></div>
                  <span className="ml-2">
                    {language === 'bn' ? 'ভেরিফিকেশন হচ্ছে...' : 'Verifying...'}
                  </span>
                </div>
              ) : (
                <span>
                  {language === 'bn' ? 'ভেরিফিকেশন করুন' : 'Verify Email'}
                </span>
              )}
            </button>
          </div>

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
        </form>
      </div>
    </div>
  );
}