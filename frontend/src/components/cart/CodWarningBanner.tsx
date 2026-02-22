'use client';

import React, { useState, useEffect } from 'react';
import { AlertTriangle, AlertCircle, Info, X, CreditCard, Wallet } from 'lucide-react';
import { COD_CONSTANTS, CodValidationResult, CodAddress } from '@/types/cod';
import { validateCodOrder } from '@/lib/api/cod';
import { cn } from '@/lib/utils';

/**
 * CodWarningBanner Component
 * Warning for high-value COD orders
 * Features:
 * - Show warning for high-value COD orders
 * - Display order limit information
 * - Suggest alternative payment methods
 */
interface CodWarningBannerProps {
  amount: number;
  userId?: string;
  address?: CodAddress;
  language?: 'en' | 'bn';
  className?: string;
  showAlternatives?: boolean;
  autoCheck?: boolean;
  onWarningDismissed?: () => void;
}

const CodWarningBanner: React.FC<CodWarningBannerProps> = ({
  amount,
  userId,
  address,
  language = 'en',
  className,
  showAlternatives = true,
  autoCheck = true,
  onWarningDismissed
}) => {
  const [validation, setValidation] = useState<CodValidationResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDismissed, setIsDismissed] = useState(false);

  // Check COD validation when amount or address changes
  useEffect(() => {
    if (!autoCheck || isDismissed) return;

    const checkValidation = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const response = await validateCodOrder(userId, address, amount);
        
        if (response.success && response.data) {
          setValidation(response.data);
        } else {
          setError('Failed to validate COD order');
        }
      } catch (err) {
        console.error('[CodWarningBanner] Error validating COD order:', err);
        setError('Failed to validate COD order');
      } finally {
        setIsLoading(false);
      }
    };

    checkValidation();
  }, [amount, address, userId, autoCheck, isDismissed]);

  const formatCurrency = (value: number): string => {
    return `৳${value.toLocaleString('en-BD', { minimumFractionDigits: 2 })}`;
  };

  const isHighValue = amount >= 50000; // BDT 50,000 threshold
  const hasWarnings = validation?.warnings && validation.warnings.length > 0;
  const shouldShowWarning = isHighValue || hasWarnings || !validation?.valid;

  const handleDismiss = () => {
    setIsDismissed(true);
    onWarningDismissed?.();
  };

  const handleRetry = () => {
    setIsDismissed(false);
    const checkValidation = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const response = await validateCodOrder(userId, address, amount);
        
        if (response.success && response.data) {
          setValidation(response.data);
        } else {
          setError('Failed to validate COD order');
        }
      } catch (err) {
        console.error('[CodWarningBanner] Error validating COD order:', err);
        setError('Failed to validate COD order');
      } finally {
        setIsLoading(false);
      }
    };

    checkValidation();
  };

  // Alternative payment methods
  const alternativeMethods = [
    { name: language === 'bn' ? 'বিকাশ' : 'bKash', icon: '💰' },
    { name: language === 'bn' ? 'নগদ' : 'Nagad', icon: '💵' },
    { name: language === 'bn' ? 'রকেট' : 'Rocket', icon: '🚀' },
    { name: language === 'bn' ? 'ব্যাংক ট্রান্সফার' : 'Bank Transfer', icon: '🏦' },
    { name: language === 'bn' ? 'কার্ড পেমেন্ট' : 'Card Payment', icon: '💳' }
  ];

  if (isDismissed || !shouldShowWarning) {
    return null;
  }

  return (
    <div className={cn('bg-white rounded-lg shadow-sm border border-gray-200', className)}>
      {/* Header */}
      <div className="flex items-center gap-2 p-4 border-b border-gray-200">
        <AlertTriangle className="w-5 h-5 text-orange-600" aria-hidden="true" />
        <h2 className="text-lg font-semibold text-gray-900">
          {language === 'bn' ? 'ক্যাশ অন ডেলিভারি সতর্কতা' : 'COD Warning'}
        </h2>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-8" role="status" aria-live="polite">
          <div className="animate-spin rounded-full h-8 w-8 border-4 border-t-orange-600 border-t-transparent border-opacity-25" aria-hidden="true"></div>
          <p className="text-sm text-gray-600 mt-2">
            {language === 'bn' ? 'যাচাই করা হচ্ছে...' : 'Validating...'}
          </p>
        </div>
      )}

      {/* Error State */}
      {error && !isLoading && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4 m-4" role="alert">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle className="w-5 h-5 text-red-600" aria-hidden="true" />
            <p className="text-sm text-red-800 font-medium">
              {language === 'bn' ? 'ত্রুটি' : 'Error'}
            </p>
          </div>
          <p className="text-sm text-red-700 mb-3">{error}</p>
          <button
            onClick={handleRetry}
            className="text-sm text-red-700 hover:text-red-900 font-medium underline focus:outline-none focus:ring-2 focus:ring-red-500"
          >
            {language === 'bn' ? 'পুনরায় চেষ্টা করুন' : 'Try Again'}
          </button>
        </div>
      )}

      {/* Warnings */}
      {!isLoading && !error && (
        <div className="p-4 space-y-4">
          {/* High Value Warning */}
          {isHighValue && (
            <div className="bg-orange-50 border border-orange-200 rounded-md p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-6 h-6 text-orange-600 flex-shrink-0 mt-0.5" aria-hidden="true" />
                <div className="flex-1">
                  <h3 className="font-semibold text-orange-900 mb-2">
                    {language === 'bn' ? 'উচ্চ মূল্যের অর্ডার সতর্কতা' : 'High Value Order Warning'}
                  </h3>
                  <p className="text-sm text-orange-800 mb-2">
                    {language === 'bn' 
                      ? `আপনার অর্ডার পরিমাণ ${formatCurrency(amount)} যা উচ্চ মূল্যের ক্যাশ অন ডেলিভারি সীমার কাছাকাছি।`
                      : `Your order amount of ${formatCurrency(amount)} is near the high-value COD limit.`
                    }
                  </p>
                  <p className="text-sm text-orange-700">
                    {language === 'bn' 
                      ? `ক্যাশ অন ডেলিভারি সর্বোচ্চ সীমা ${formatCurrency(COD_CONSTANTS.MAX_AMOUNT)}।`
                      : `Maximum COD limit is ${formatCurrency(COD_CONSTANTS.MAX_AMOUNT)}.`
                    }
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Validation Warnings */}
          {hasWarnings && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-0.5" aria-hidden="true" />
                <div className="flex-1">
                  <h3 className="font-semibold text-yellow-900 mb-2">
                    {language === 'bn' ? 'সতর্কতা' : 'Warnings'}
                  </h3>
                  <ul className="space-y-2">
                    {validation?.warnings.map((warning, index) => (
                      <li key={index} className="text-sm text-yellow-800 flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-yellow-600 flex-shrink-0 mt-2" aria-hidden="true"></span>
                        <span>{warning}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Validation Failed */}
          {validation && !validation.valid && validation.reason && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" aria-hidden="true" />
                <div className="flex-1">
                  <h3 className="font-semibold text-red-900 mb-2">
                    {language === 'bn' ? 'ক্যাশ অন ডেলিভারি অনুমোদিত নয়' : 'COD Not Allowed'}
                  </h3>
                  <p className="text-sm text-red-800">
                    {validation.reason}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Verification Requirements */}
          {validation && (validation.requiresVerification.phone || validation.requiresVerification.address) && (
            <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
              <div className="flex items-start gap-3">
                <Info className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" aria-hidden="true" />
                <div className="flex-1">
                  <h3 className="font-semibold text-blue-900 mb-2">
                    {language === 'bn' ? 'যাচাইকরণ প্রয়োজন' : 'Verification Required'}
                  </h3>
                  <ul className="space-y-2">
                    {validation.requiresVerification.phone && (
                      <li className="text-sm text-blue-800 flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-600 flex-shrink-0 mt-2" aria-hidden="true"></span>
                        <span>{language === 'bn' ? 'ফোন নম্বর যাচাই প্রয়োজন' : 'Phone number verification required'}</span>
                      </li>
                    )}
                    {validation.requiresVerification.address && (
                      <li className="text-sm text-blue-800 flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-600 flex-shrink-0 mt-2" aria-hidden="true"></span>
                        <span>{language === 'bn' ? 'ঠিকানা যাচাই প্রয়োজন' : 'Address verification required'}</span>
                      </li>
                    )}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Alternative Payment Methods */}
          {showAlternatives && (isHighValue || (validation && !validation.valid)) && (
            <div className="bg-gray-50 border border-gray-200 rounded-md p-4">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Wallet className="w-5 h-5 text-gray-600" aria-hidden="true" />
                {language === 'bn' ? 'বিকল্প পেমেন্ট পদ্ধতি' : 'Alternative Payment Methods'}
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {alternativeMethods.map((method, index) => (
                  <button
                    key={index}
                    className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
                    aria-label={`Select ${method.name} payment method`}
                  >
                    <span className="text-lg" aria-hidden="true">{method.icon}</span>
                    <span className="text-sm font-medium text-gray-900">{method.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Info Note */}
          <div className="bg-gray-50 border border-gray-200 rounded-md p-4">
            <div className="flex items-start gap-2">
              <Info className="w-4 h-4 text-gray-600 flex-shrink-0 mt-0.5" aria-hidden="true" />
              <p className="text-xs text-gray-700">
                {language === 'bn' 
                  ? 'উচ্চ মূল্যের অর্ডারের জন্য বিকল্প পেমেন্ট পদ্ধতি ব্যবহার করা নিরাপদ এবং দ্রুত।'
                  : 'Using alternative payment methods for high-value orders is safer and faster.'
                }
              </p>
            </div>
          </div>

          {/* Dismiss Button */}
          <div className="flex justify-end">
            <button
              onClick={handleDismiss}
              className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500"
              aria-label={language === 'bn' ? 'সতর্কতা বাতিল করুন' : 'Dismiss warning'}
            >
              <X className="w-4 h-4" aria-hidden="true" />
              {language === 'bn' ? 'বাতিল করুন' : 'Dismiss'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CodWarningBanner;
