/**
 * OTPVerification Component
 * 
 * Modal/dialog for OTP verification with countdown timer,
 * resend OTP functionality, and validation.
 */

'use client';

import React, { useState, useEffect, useRef } from 'react';

interface OTPVerificationProps {
  isOpen: boolean;
  onClose: () => void;
  onVerify: (otp: string) => Promise<void>;
  onResendOTP?: () => Promise<void>;
  language?: 'en' | 'bn';
  loading?: boolean;
  expiryTime?: number; // OTP expiry time in seconds
}

const OTPVerification: React.FC<OTPVerificationProps> = ({
  isOpen,
  onClose,
  onVerify,
  onResendOTP,
  language = 'en',
  loading = false,
  expiryTime = 300, // 5 minutes default
}) => {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [timeLeft, setTimeLeft] = useState(expiryTime);
  const [canResend, setCanResend] = useState(false);
  const [error, setError] = useState('');
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Countdown timer
  useEffect(() => {
    if (!isOpen) {
      setTimeLeft(expiryTime);
      setCanResend(false);
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setCanResend(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen, expiryTime]);

  // Auto-focus first input when modal opens
  useEffect(() => {
    if (isOpen && inputRefs.current[0]) {
      inputRefs.current[0]?.focus();
    }
  }, [isOpen]);

  // Handle OTP input change
  const handleInputChange = (index: number, value: string) => {
    // Only allow numbers
    const numericValue = value.replace(/[^0-9]/g, '');
    
    const newOtp = [...otp];
    newOtp[index] = numericValue.slice(-1); // Only take last character
    setOtp(newOtp);
    setError('');

    // Auto-focus next input
    if (numericValue && index < 5 && inputRefs.current[index + 1]) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  // Handle key press
  const handleKeyDown = (index: number, event: React.KeyboardEvent) => {
    // Handle backspace
    if (event.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  // Handle paste
  const handlePaste = (event: React.ClipboardEvent) => {
    event.preventDefault();
    const pastedData = event.clipboardData.getData('text').replace(/[^0-9]/g, '').slice(0, 6);
    
    if (pastedData.length > 0) {
      const newOtp = [...otp];
      for (let i = 0; i < pastedData.length && i < 6; i++) {
        newOtp[i] = pastedData[i];
      }
      setOtp(newOtp);
      
      // Focus the next empty input or the last one
      const nextEmptyIndex = newOtp.findIndex((digit) => digit === '');
      const focusIndex = nextEmptyIndex === -1 ? 5 : nextEmptyIndex;
      inputRefs.current[focusIndex]?.focus();
    }
  };

  // Handle form submission
  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    
    const otpValue = otp.join('');
    
    // Validate OTP
    if (otpValue.length !== 6) {
      setError(language === 'bn' ? 'সঠিক 6 ডিজিট OTP প্রবেশ করুন' : 'Please enter a valid 6-digit OTP');
      return;
    }

    try {
      await onVerify(otpValue);
    } catch (err: any) {
      setError(err?.message || (language === 'bn' ? 'অবৈধ OTP' : 'Invalid OTP'));
    }
  };

  // Handle resend OTP
  const handleResendOTP = async () => {
    if (!onResendOTP || !canResend) return;

    try {
      await onResendOTP();
      // Reset timer
      setTimeLeft(expiryTime);
      setCanResend(false);
      setOtp(['', '', '', '', '', '']);
      setError('');
      // Focus first input
      inputRefs.current[0]?.focus();
    } catch (err: any) {
      setError(err?.message || (language === 'bn' ? 'OTP পুনরায় পাঠাতে ব্যর্থ হয়েছে' : 'Failed to resend OTP'));
    }
  };

  // Format time
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            {language === 'bn' ? 'OTP যাচাইকরণ' : 'OTP Verification'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            aria-label={language === 'bn' ? 'বন্ধ করুন' : 'Close'}
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Description */}
          <div className="text-center mb-6">
            <div className="w-16 h-16 mx-auto mb-4 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <p className="text-gray-700 dark:text-gray-300 mb-2">
              {language === 'bn'
                ? 'আপনার ফোনে পাঠানো 6 ডিজিট OTP প্রবেশ করুন'
                : 'Enter the 6-digit OTP sent to your phone'}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {language === 'bn'
                ? 'OTP শীঘ্রই মেয়াদ উত্তীর্ণ হবে'
                : 'OTP will expire soon'}
            </p>
          </div>

          {/* Countdown Timer */}
          <div className="flex items-center justify-center mb-6">
            <div className={`px-4 py-2 rounded-full ${
              timeLeft <= 60
                ? 'bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-400'
                : 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400'
            }`}>
              <span className="text-sm font-medium">
                {language === 'bn' ? 'সময় বাকি:' : 'Time left:'} {formatTime(timeLeft)}
              </span>
            </div>
          </div>

          {/* OTP Input */}
          <form onSubmit={handleSubmit}>
            <div className="flex justify-center gap-2 mb-6">
              {otp.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => {
                    inputRefs.current[index] = el;
                  }}
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleInputChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  onPaste={handlePaste}
                  className="w-12 h-14 text-center text-2xl font-bold border-2 border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  aria-label={`OTP digit ${index + 1}`}
                />
              ))}
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-4 p-3 bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-sm text-red-600 dark:text-red-400 text-center">{error}</p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="space-y-3">
              <button
                type="submit"
                disabled={loading || otp.join('').length !== 6}
                className="w-full px-4 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
              >
                {loading
                  ? language === 'bn'
                    ? 'যাচাই করা হচ্ছে...'
                    : 'Verifying...'
                  : language === 'bn'
                  ? 'যাচাই করুন'
                  : 'Verify OTP'}
              </button>

              {/* Resend OTP */}
              {canResend && onResendOTP ? (
                <button
                  type="button"
                  onClick={handleResendOTP}
                  disabled={loading}
                  className="w-full px-4 py-3 border border-blue-500 text-blue-500 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                >
                  {language === 'bn' ? 'OTP পুনরায় পাঠান' : 'Resend OTP'}
                </button>
              ) : (
                <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
                  {language === 'bn'
                    ? `${formatTime(timeLeft)} পরে OTP পুনরায় পাঠাতে পারবেন`
                    : `You can resend OTP in ${formatTime(timeLeft)}`}
                </p>
              )}
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 dark:bg-gray-700 border-t border-gray-200 dark:border-gray-600 rounded-b-lg">
          <p className="text-xs text-center text-gray-500 dark:text-gray-400">
            {language === 'bn'
              ? 'OTP পাননি? আপনার ফোন নম্বর চেক করুন এবং আবার চেষ্টা করুন'
              : "Didn't receive OTP? Check your phone number and try again"}
          </p>
        </div>
      </div>
    </div>
  );
};

export default OTPVerification;
