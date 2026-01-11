'use client';

import React, { useState } from 'react';
import { Mail, Phone, Check, AlertCircle, ArrowRight } from 'lucide-react';
import { ProfileAPI } from '@/lib/api/profile';

interface EmailPhoneChangeProps {
  user: any;
  language: 'en' | 'bn';
  onUpdate: (user: any) => void;
}

const EmailPhoneChange: React.FC<EmailPhoneChangeProps> = ({ user, language, onUpdate }) => {
  const [activeTab, setActiveTab] = useState<'email' | 'phone'>('email');
  const [step, setStep] = useState<'request' | 'verify'>('request');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Email change state
  const [newEmail, setNewEmail] = useState('');
  const [emailToken, setEmailToken] = useState('');

  // Phone change state
  const [newPhone, setNewPhone] = useState('');
  const [phoneOtp, setPhoneOtp] = useState('');

  const handleEmailChangeRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const response = await ProfileAPI.requestEmailChange(newEmail);
      setStep('verify');
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to request email change');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailChangeConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const response = await ProfileAPI.confirmEmailChange(newEmail, emailToken);
      onUpdate(response.user);
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        setStep('request');
        setNewEmail('');
        setEmailToken('');
      }, 2000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to confirm email change');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePhoneChangeRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const response = await ProfileAPI.requestPhoneChange(newPhone);
      setStep('verify');
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to request phone change');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePhoneChangeConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const response = await ProfileAPI.confirmPhoneChange(newPhone, phoneOtp);
      onUpdate(response.user);
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        setStep('request');
        setNewPhone('');
        setPhoneOtp('');
      }, 2000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to confirm phone change');
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setStep('request');
    setNewEmail('');
    setEmailToken('');
    setNewPhone('');
    setPhoneOtp('');
    setError(null);
    setSuccess(false);
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-gray-900">
        {language === 'en' ? 'Change Email & Phone' : 'ইমেল ও ফোন পরিবর্তন'}
      </h2>

      {/* Tab Switcher */}
      <div className="flex space-x-2 border-b border-gray-200">
        <button
          onClick={() => {
            setActiveTab('email');
            resetForm();
          }}
          className={`flex items-center space-x-2 px-4 py-3 border-b-2 transition-colors ${
            activeTab === 'email'
              ? 'border-primary-600 text-primary-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <Mail className="h-5 w-5" />
          <span>{language === 'en' ? 'Email' : 'ইমেল'}</span>
        </button>
        <button
          onClick={() => {
            setActiveTab('phone');
            resetForm();
          }}
          className={`flex items-center space-x-2 px-4 py-3 border-b-2 transition-colors ${
            activeTab === 'phone'
              ? 'border-primary-600 text-primary-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <Phone className="h-5 w-5" />
          <span>{language === 'en' ? 'Phone' : 'ফোন'}</span>
        </button>
      </div>

      {/* Success Message */}
      {success && (
        <div className="flex items-center space-x-2 bg-green-50 border border-green-200 rounded-md p-4">
          <Check className="h-5 w-5 text-green-600" />
          <p className="text-sm text-green-800">
            {language === 'en' 
              ? 'Verification code sent successfully!' 
              : 'যাচাই কোড সফলভাবে পাঠানো হয়েছে!'}
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

      {/* Email Change Form */}
      {activeTab === 'email' && (
        <div className="space-y-4">
          <div className="p-4 bg-gray-50 rounded-md">
            <p className="text-sm text-gray-600 mb-2">
              {language === 'en' ? 'Current Email:' : 'বর্তমান ইমেল:'}
            </p>
            <div className="flex items-center space-x-2">
              <Mail className="h-4 w-4 text-gray-400" />
              <span className="font-medium">{user.email}</span>
              <span className={`ml-2 px-2 py-1 text-xs rounded ${
                user.emailVerified 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-yellow-100 text-yellow-800'
              }`}>
                {user.emailVerified 
                  ? (language === 'en' ? 'Verified' : 'যাচাইকৃত')
                  : (language === 'en' ? 'Not Verified' : 'যাচাইকৃত নয়')
                }
              </span>
            </div>
          </div>

          {step === 'request' ? (
            <form onSubmit={handleEmailChangeRequest} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {language === 'en' ? 'New Email Address' : 'নতুন ইমেল ঠিকানা'}
                </label>
                <input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder={language === 'en' ? 'Enter new email' : 'নতুন ইমেল লিখুন'}
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex items-center justify-center space-x-2 px-6 py-3 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    <span>{language === 'en' ? 'Sending...' : 'পাঠানো হচ্ছে...'}</span>
                  </>
                ) : (
                  <>
                    <ArrowRight className="h-5 w-5" />
                    <span>{language === 'en' ? 'Send Verification Code' : 'যাচাই কোড পাঠান'}</span>
                  </>
                )}
              </button>
            </form>
          ) : (
            <form onSubmit={handleEmailChangeConfirm} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {language === 'en' ? 'Verification Code' : 'যাচাই কোড'}
                </label>
                <input
                  type="text"
                  value={emailToken}
                  onChange={(e) => setEmailToken(e.target.value)}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder={language === 'en' ? 'Enter verification code' : 'যাচাই কোড লিখুন'}
                />
                <p className="mt-2 text-xs text-gray-500">
                  {language === 'en' 
                    ? 'Check your email for the verification code' 
                    : 'যাচাই কোডের জন্য আপনার ইমেল চেক করুন'}
                </p>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex items-center justify-center space-x-2 px-6 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    <span>{language === 'en' ? 'Confirming...' : 'নিশ্চিত করা হচ্ছে...'}</span>
                  </>
                ) : (
                  <>
                    <Check className="h-5 w-5" />
                    <span>{language === 'en' ? 'Confirm Email Change' : 'ইমেল পরিবর্তন নিশ্চিত করুন'}</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => setStep('request')}
                className="w-full px-6 py-3 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
              >
                {language === 'en' ? 'Back' : 'ফিরে যান'}
              </button>
            </form>
          )}
        </div>
      )}

      {/* Phone Change Form */}
      {activeTab === 'phone' && (
        <div className="space-y-4">
          <div className="p-4 bg-gray-50 rounded-md">
            <p className="text-sm text-gray-600 mb-2">
              {language === 'en' ? 'Current Phone:' : 'বর্তমান ফোন:'}
            </p>
            <div className="flex items-center space-x-2">
              <Phone className="h-4 w-4 text-gray-400" />
              <span className="font-medium">{user.phone || 'Not provided'}</span>
              {user.phone && (
                <span className={`ml-2 px-2 py-1 text-xs rounded ${
                  user.phoneVerified 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {user.phoneVerified 
                    ? (language === 'en' ? 'Verified' : 'যাচাইকৃত')
                    : (language === 'en' ? 'Not Verified' : 'যাচাইকৃত নয়')
                  }
                </span>
              )}
            </div>
          </div>

          {step === 'request' ? (
            <form onSubmit={handlePhoneChangeRequest} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {language === 'en' ? 'New Phone Number' : 'নতুন ফোন নম্বর'}
                </label>
                <input
                  type="tel"
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  required
                  pattern="^(\+880|01)(1[3-9]\d{8}|\d{9})$"
                  className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder={language === 'en' ? '+8801XXXXXXXXX' : '+8801XXXXXXXXX'}
                />
                <p className="mt-1 text-xs text-gray-500">
                  {language === 'en' ? 'Format: +8801XXXXXXXXX or 01XXXXXXXXX' : 'ফরম্যাট: +8801XXXXXXXXX বা 01XXXXXXXXX'}
                </p>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex items-center justify-center space-x-2 px-6 py-3 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    <span>{language === 'en' ? 'Sending OTP...' : 'OTP পাঠানো হচ্ছে...'}</span>
                  </>
                ) : (
                  <>
                    <ArrowRight className="h-5 w-5" />
                    <span>{language === 'en' ? 'Send OTP' : 'OTP পাঠান'}</span>
                  </>
                )}
              </button>
            </form>
          ) : (
            <form onSubmit={handlePhoneChangeConfirm} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {language === 'en' ? 'Enter OTP' : 'OTP লিখুন'}
                </label>
                <input
                  type="text"
                  value={phoneOtp}
                  onChange={(e) => setPhoneOtp(e.target.value)}
                  required
                  maxLength={6}
                  className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent text-center text-2xl tracking-widest"
                  placeholder="------"
                />
                <p className="mt-2 text-xs text-gray-500">
                  {language === 'en' 
                    ? 'Enter the 6-digit OTP sent to your phone' 
                    : 'আপনার ফোনে পাঠানো 6-সংখ্যার OTP লিখুন'}
                </p>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex items-center justify-center space-x-2 px-6 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    <span>{language === 'en' ? 'Confirming...' : 'নিশ্চিত করা হচ্ছে...'}</span>
                  </>
                ) : (
                  <>
                    <Check className="h-5 w-5" />
                    <span>{language === 'en' ? 'Confirm Phone Change' : 'ফোন পরিবর্তন নিশ্চিত করুন'}</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => setStep('request')}
                className="w-full px-6 py-3 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
              >
                {language === 'en' ? 'Back' : 'ফিরে যান'}
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  );
};

export default EmailPhoneChange;
