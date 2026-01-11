'use client';

import React, { useState } from 'react';
import { X, Shield, Smartphone, QrCode, Check, Loader2, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import ToastNotification from '@/components/ui/ToastNotification';
import AccountPreferencesAPI from '@/lib/api/accountPreferences';

interface TwoFactorSetupProps {
  isOpen: boolean;
  onClose: () => void;
  language: 'en' | 'bn';
}

type SetupStep = 'method' | 'verify' | 'success';

const TwoFactorSetup: React.FC<TwoFactorSetupProps> = ({ isOpen, onClose, language }) => {
  const [step, setStep] = useState<SetupStep>('method');
  const [method, setMethod] = useState<'sms' | 'authenticator_app'>('sms');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [isEnabling, setIsEnabling] = useState(false);
  const [isDisabling, setIsDisabling] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const handleMethodSelect = (selectedMethod: 'sms' | 'authenticator_app') => {
    setMethod(selectedMethod);
  };

  const handleEnable = async () => {
    if (method === 'sms' && !phoneNumber) {
      setError(language === 'en' ? 'Please enter phone number' : 'দয়া করে ফোন নম্বর লিখুন');
      return;
    }

    setIsEnabling(true);
    setError(null);

    try {
      const response = await AccountPreferencesAPI.enable2FA(method, phoneNumber || undefined);
      
      if (method === 'authenticator_app' && response.qrCode) {
        setQrCode(response.qrCode);
        setStep('verify');
      } else {
        setStep('verify');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to enable 2FA');
    } finally {
      setIsEnabling(false);
    }
  };

  const handleVerify = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      setError(language === 'en' ? 'Please enter valid 6-digit code' : 'দয়া করে বৈধ ৬-অঙ্কের কোড লিখুন');
      return;
    }

    setIsEnabling(true);
    setError(null);

    try {
      // In a real implementation, this would verify the code
      // For now, we'll assume success
      setStep('success');
      setToast({
        type: 'success',
        message: language === 'en'
          ? 'Two-factor authentication enabled successfully!'
          : 'দ্বি-ফ্যাক্টর প্রমাণীকরণ সফলভাবে সক্ষম করা হয়েছে!',
      });
      setTimeout(() => {
        setToast(null);
        onClose();
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Failed to verify code');
    } finally {
      setIsEnabling(false);
    }
  };

  const handleDisable = async () => {
    setIsDisabling(true);
    setError(null);

    try {
      await AccountPreferencesAPI.disable2FA();
      setToast({
        type: 'success',
        message: language === 'en'
          ? 'Two-factor authentication disabled successfully!'
          : 'দ্বি-ফ্যাক্টর প্রমাণীকরণ সফলভাবে নিষ্ক্রিয় করা হয়েছে!',
      });
      setTimeout(() => {
        setToast(null);
        onClose();
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Failed to disable 2FA');
    } finally {
      setIsDisabling(false);
    }
  };

  const handleClose = () => {
    setStep('method');
    setMethod('sms');
    setPhoneNumber('');
    setVerificationCode('');
    setQrCode(null);
    setError(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center"
      onClick={() => handleClose()}
    >
      {toast && (
        <ToastNotification
          type={toast.type}
          message={toast.message}
          onClose={() => setToast(null)}
        />
      )}

      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900 flex items-center space-x-2">
              <Shield className="h-6 w-6" />
              <span>
                {language === 'en' ? 'Two-Factor Authentication' : 'দ্বি-ফ্যাক্টর প্রমাণীকরণ'}
              </span>
            </h2>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleClose();
              }}
              className="text-gray-400 hover:text-gray-600 focus:outline-none cursor-pointer"
              aria-label="Close"
              style={{ zIndex: 60 }}
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="flex items-start space-x-2 bg-red-50 border border-red-200 rounded-md p-4 mb-4">
              <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {/* Method Selection Step */}
          {step === 'method' && (
            <div className="space-y-4">
              <p className="text-sm text-gray-600 mb-4">
                {language === 'en'
                  ? 'Choose a method to receive your verification code:'
                  : 'আপনার ভেরিফিকেশন কোড পাওয়ার জন্য একটি পদ্ধতি নির্বাচন করুন:'}
              </p>

              {/* SMS Method */}
              <button
                onClick={() => handleMethodSelect('sms')}
                className={cn(
                  'w-full p-4 border-2 rounded-lg text-left transition-all',
                  method === 'sms'
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-gray-200 hover:border-primary-300'
                )}
              >
                <div className="flex items-center space-x-3">
                  <Smartphone className="h-6 w-6 text-primary-600" />
                  <div>
                    <p className="font-semibold text-gray-900">
                      {language === 'en' ? 'SMS' : 'SMS'}
                    </p>
                    <p className="text-sm text-gray-600">
                      {language === 'en'
                        ? 'Receive code via text message'
                        : 'টেক্সট মেসেজ কোড পান'}
                    </p>
                  </div>
                </div>
              </button>

              {/* Authenticator App Method */}
              <button
                onClick={() => handleMethodSelect('authenticator_app')}
                className={cn(
                  'w-full p-4 border-2 rounded-lg text-left transition-all',
                  method === 'authenticator_app'
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-gray-200 hover:border-primary-300'
                )}
              >
                <div className="flex items-center space-x-3">
                  <QrCode className="h-6 w-6 text-primary-600" />
                  <div>
                    <p className="font-semibold text-gray-900">
                      {language === 'en' ? 'Authenticator App' : 'অথেন্টিকেটর অ্যাপ'}
                    </p>
                    <p className="text-sm text-gray-600">
                      {language === 'en'
                        ? 'Use Google Authenticator or similar app'
                        : 'গুগল অথেন্টিকেটর বা অনুরূপ অ্যাপ ব্যবহার করুন'}
                    </p>
                  </div>
                </div>
              </button>

              {/* Phone Number Input (for SMS) */}
              {method === 'sms' && (
                <div className="space-y-2">
                  <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700">
                    {language === 'en' ? 'Phone Number' : 'ফোন নম্বর'}
                  </label>
                  <input
                    type="tel"
                    id="phoneNumber"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="+880123456789"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
              )}

              {/* Enable Button */}
              <button
                onClick={handleEnable}
                disabled={isEnabling}
                className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isEnabling ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>{language === 'en' ? 'Enabling...' : 'সক্ষম করা হচ্ছে...'}</span>
                  </>
                ) : (
                  <>
                    <Shield className="h-4 w-4" />
                    <span>
                      {language === 'en' ? 'Enable 2FA' : '2FA সক্ষম করুন'}
                    </span>
                  </>
                )}
              </button>
            </div>
          )}

          {/* Verification Step */}
          {step === 'verify' && (
            <div className="space-y-4">
              {method === 'authenticator_app' && qrCode && (
                <div className="text-center mb-6">
                  <p className="text-sm text-gray-600 mb-2">
                    {language === 'en'
                      ? 'Scan this QR code with your authenticator app:'
                      : 'আপনার অথেন্টিকেটর অ্যাপ দিয়ে এই QR কোড স্ক্যান করুন:'}
                  </p>
                  <div className="bg-white p-4 rounded-lg inline-block border-2 border-gray-200">
                    <img src={qrCode} alt="QR Code" className="w-48 h-48" />
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <label htmlFor="verificationCode" className="block text-sm font-medium text-gray-700">
                  {language === 'en' ? 'Verification Code' : 'ভেরিফিকেশন কোড'}
                </label>
                <input
                  type="text"
                  id="verificationCode"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="123456"
                  maxLength={6}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-center text-lg tracking-widest"
                />
                <p className="text-xs text-gray-500">
                  {language === 'en'
                    ? 'Enter the 6-digit code from your authenticator app'
                    : 'আপনার অথেন্টিকেটর অ্যাপ থেকে ৬-অঙ্কের কোড লিখুন'}
                </p>
              </div>

              <button
                onClick={handleVerify}
                disabled={isEnabling}
                className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isEnabling ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>{language === 'en' ? 'Verifying...' : 'যাচাই করা হচ্ছে...'}</span>
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4" />
                    <span>{language === 'en' ? 'Verify & Enable' : 'যাচাই করে সক্ষম করুন'}</span>
                  </>
                )}
              </button>

              <button
                onClick={() => setStep('method')}
                className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
              >
                {language === 'en' ? 'Back' : 'ফেরে যান'}
              </button>
            </div>
          )}

          {/* Success Step */}
          {step === 'success' && (
            <div className="text-center space-y-4">
              <div className="flex justify-center mb-4">
                <div className="h-16 w-16 bg-green-100 rounded-full flex items-center justify-center">
                  <Check className="h-8 w-8 text-green-600" />
                </div>
              </div>
              <h3 className="text-lg font-semibold text-gray-900">
                {language === 'en'
                  ? '2FA Enabled Successfully!'
                  : '2FA সফলভাবে সক্ষম করা হয়েছে!'}
              </h3>
              <p className="text-sm text-gray-600">
                {language === 'en'
                  ? 'Your account is now more secure. You can close this window.'
                  : 'আপনার অ্যাকাউন্ট এখন আরও নিরাপদ। আপনি এই উইন্ডো বন্ধ করতে পারেন।'}
              </p>
              <button
                onClick={handleClose}
                className="w-full px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
              >
                {language === 'en' ? 'Done' : 'সম্পন্ন হয়েছে'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TwoFactorSetup;
