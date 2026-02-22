'use client';

import React, { useState } from 'react';
import { Phone, MapPin, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { CodVerificationProps, CodVerificationState } from '@/types/cod';
import { cn } from '@/lib/utils';

/**
 * CodVerification Component
 * COD verification form for phone and address verification
 */
const CodVerification: React.FC<CodVerificationProps> = ({
  requiresPhoneVerification,
  requiresAddressVerification,
  amount,
  onPhoneVerified,
  onAddressVerified,
  language = 'en',
  className
}) => {
  const [verificationState, setVerificationState] = useState<CodVerificationState>({
    phoneVerified: false,
    addressVerified: false,
    isVerifyingPhone: false,
    isVerifyingAddress: false,
    phoneError: null,
    addressError: null
  });

  const [phoneNumber, setPhoneNumber] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [otpSent, setOtpSent] = useState(false);

  const formatCurrency = (value: number): string => {
    return `৳${value.toLocaleString('en-BD', { minimumFractionDigits: 2 })}`;
  };

  const handleSendOtp = async () => {
    try {
      setVerificationState(prev => ({ ...prev, isVerifyingPhone: true, phoneError: null }));
      
      // TODO: Call API to send OTP
      // await sendOtpApi(phoneNumber);
      
      setOtpSent(true);
      setVerificationState(prev => ({ ...prev, isVerifyingPhone: false }));
    } catch (error) {
      console.error('[CodVerification] Error sending OTP:', error);
      setVerificationState(prev => ({ 
        ...prev, 
        isVerifyingPhone: false,
        phoneError: language === 'bn' ? 'OTP পাঠাতে ব্যর্থ হয়েছে' : 'Failed to send OTP'
      }));
    }
  };

  const handleVerifyOtp = async () => {
    try {
      setVerificationState(prev => ({ ...prev, isVerifyingPhone: true, phoneError: null }));
      
      // TODO: Call API to verify OTP
      // await verifyOtpApi(phoneNumber, otpCode);
      
      setVerificationState(prev => ({ 
        ...prev, 
        phoneVerified: true,
        isVerifyingPhone: false 
      }));
      
      onPhoneVerified?.(true);
    } catch (error) {
      console.error('[CodVerification] Error verifying OTP:', error);
      setVerificationState(prev => ({ 
        ...prev, 
        isVerifyingPhone: false,
        phoneError: language === 'bn' ? 'OTP যাচাই করতে ব্যর্থ হয়েছে' : 'Failed to verify OTP'
      }));
    }
  };

  const handleVerifyAddress = async () => {
    try {
      setVerificationState(prev => ({ ...prev, isVerifyingAddress: true, addressError: null }));
      
      // TODO: Call API to verify address
      // await verifyAddressApi();
      
      setVerificationState(prev => ({ 
        ...prev, 
        addressVerified: true,
        isVerifyingAddress: false 
      }));
      
      onAddressVerified?.(true);
    } catch (error) {
      console.error('[CodVerification] Error verifying address:', error);
      setVerificationState(prev => ({ 
        ...prev, 
        isVerifyingAddress: false,
        addressError: language === 'bn' ? 'ঠিকানা যাচাই করতে ব্যর্থ হয়েছে' : 'Failed to verify address'
      }));
    }
  };

  return (
    <div className={cn('bg-white rounded-lg shadow-sm border border-gray-200', className)}>
      {/* Header */}
      <div className="flex items-center gap-2 p-4 border-b border-gray-200">
        <CheckCircle className="w-5 h-5 text-blue-600" />
        <h2 className="text-lg font-semibold text-gray-900">
          {language === 'bn' ? 'ক্যাশ অন ডেলিভারি যাচাইকরণ' : 'COD Verification'}
        </h2>
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Order Amount Info */}
        <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-4">
          <p className="text-sm text-blue-900">
            {language === 'bn' 
              ? `অর্ডার পরিমাণ: ${formatCurrency(amount)}`
              : `Order Amount: ${formatCurrency(amount)}`
            }
          </p>
          <p className="text-xs text-blue-700 mt-1">
            {language === 'bn' 
              ? 'এই অর্ডারের জন্য যাচাইকরণ প্রয়োজন।'
              : 'Verification required for this order.'
            }
          </p>
        </div>

        {/* Phone Verification */}
        {requiresPhoneVerification && (
          <div className={cn(
            'border rounded-md p-4 mb-4',
            verificationState.phoneVerified 
              ? 'border-green-200 bg-green-50' 
              : 'border-gray-200 bg-white'
          )}>
            <div className="flex items-center gap-2 mb-3">
              {verificationState.phoneVerified ? (
                <CheckCircle className="w-5 h-5 text-green-600" />
              ) : (
                <Phone className="w-5 h-5 text-blue-600" />
              )}
              <h3 className="font-semibold text-gray-900">
                {language === 'bn' ? 'ফোন নম্বর যাচাইকরণ' : 'Phone Verification'}
              </h3>
              {verificationState.phoneVerified && (
                <span className="ml-auto text-sm text-green-600">
                  {language === 'bn' ? 'যাচাইকৃত' : 'Verified'}
                </span>
              )}
            </div>

            {!verificationState.phoneVerified && (
              <div className="space-y-3">
                {!otpSent ? (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {language === 'bn' ? 'ফোন নম্বর' : 'Phone Number'}
                    </label>
                    <input
                      type="tel"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      placeholder={language === 'bn' ? '017XXXXXXXXX' : '017XXXXXXXXX'}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <button
                      onClick={handleSendOtp}
                      disabled={verificationState.isVerifyingPhone || !phoneNumber}
                      className="mt-2 w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
                    >
                      {verificationState.isVerifyingPhone ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          {language === 'bn' ? 'পাঠাতে হচ্ছে...' : 'Sending...'}
                        </>
                      ) : (
                        language === 'bn' ? 'OTP পাঠান' : 'Send OTP'
                      )}
                    </button>
                  </div>
                ) : (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {language === 'bn' ? 'OTP কোড' : 'OTP Code'}
                    </label>
                    <input
                      type="text"
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value)}
                      placeholder={language === 'bn' ? 'XXXXXX' : 'XXXXXX'}
                      maxLength={6}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center tracking-widest"
                    />
                    <button
                      onClick={handleVerifyOtp}
                      disabled={verificationState.isVerifyingPhone || !otpCode}
                      className="mt-2 w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
                    >
                      {verificationState.isVerifyingPhone ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          {language === 'bn' ? 'যাচাই করা হচ্ছে...' : 'Verifying...'}
                        </>
                      ) : (
                        language === 'bn' ? 'যাচাই করুন' : 'Verify'
                      )}
                    </button>
                    <button
                      onClick={() => {
                        setOtpSent(false);
                        setOtpCode('');
                      }}
                      className="mt-2 w-full text-sm text-blue-600 hover:text-blue-700"
                    >
                      {language === 'bn' ? 'অন্য ফোন নম্বর ব্যবহার করুন' : 'Use different phone number'}
                    </button>
                  </div>
                )}

                {verificationState.phoneError && (
                  <div className="bg-red-50 border border-red-200 rounded-md p-3">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-red-600" />
                      <p className="text-sm text-red-800">
                        {verificationState.phoneError}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Address Verification */}
        {requiresAddressVerification && (
          <div className={cn(
            'border rounded-md p-4 mb-4',
            verificationState.addressVerified 
              ? 'border-green-200 bg-green-50' 
              : 'border-gray-200 bg-white'
          )}>
            <div className="flex items-center gap-2 mb-3">
              {verificationState.addressVerified ? (
                <CheckCircle className="w-5 h-5 text-green-600" />
              ) : (
                <MapPin className="w-5 h-5 text-blue-600" />
              )}
              <h3 className="font-semibold text-gray-900">
                {language === 'bn' ? 'ঠিকানা যাচাইকরণ' : 'Address Verification'}
              </h3>
              {verificationState.addressVerified && (
                <span className="ml-auto text-sm text-green-600">
                  {language === 'bn' ? 'যাচাইকৃত' : 'Verified'}
                </span>
              )}
            </div>

            {!verificationState.addressVerified && (
              <div className="space-y-3">
                <p className="text-sm text-gray-700">
                  {language === 'bn' 
                    ? 'আপনার ডেলিভারি ঠিকানা যাচাই করতে নিচের বাটনে ক্লিক করুন।'
                    : 'Click the button below to verify your delivery address.'
                  }
                </p>
                <button
                  onClick={handleVerifyAddress}
                  disabled={verificationState.isVerifyingAddress}
                  className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  {verificationState.isVerifyingAddress ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      {language === 'bn' ? 'যাচাই করা হচ্ছে...' : 'Verifying...'}
                    </>
                  ) : (
                    language === 'bn' ? 'ঠিকানা যাচাই করুন' : 'Verify Address'
                  )}
                </button>

                {verificationState.addressError && (
                  <div className="bg-red-50 border border-red-200 rounded-md p-3">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-red-600" />
                      <p className="text-sm text-red-800">
                        {verificationState.addressError}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Success Message */}
        {(verificationState.phoneVerified || verificationState.addressVerified) && (
          <div className="bg-green-50 border border-green-200 rounded-md p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <p className="text-sm text-green-900">
                {language === 'bn' 
                  ? 'যাচাইকরণ সফলভাবে সম্পন্ন হয়েছে। আপনি ক্যাশ অন ডেলিভারি পেমেন্ট ব্যবহার করতে পারবেন।'
                  : 'Verification completed successfully. You can now proceed with Cash on Delivery payment.'
                }
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CodVerification;
