'use client';

import React, { useState, useEffect } from 'react';
import { CreditCard, Check, AlertCircle, Info, Loader2, Wallet } from 'lucide-react';
import { LocalPaymentMethod, PaymentFeeResult, LOCAL_PAYMENT_CONSTANTS } from '@/types/localPayment';
import { getLocalPaymentMethods, calculatePaymentFee } from '@/lib/api/localPayment';
import { cn } from '@/lib/utils';

/**
 * LocalPaymentMethodSelector Component
 * Select local payment method (bKash, Nagad, Rocket, SureCash)
 * Features:
 * - Display available local payment methods
 * - Show method logos and names
 * - Allow user to select payment method
 * - Display payment fees
 */
interface LocalPaymentMethodSelectorProps {
  amount: number;
  selectedMethodCode?: string;
  onMethodSelect?: (method: LocalPaymentMethod, feeResult?: PaymentFeeResult) => void;
  language?: 'en' | 'bn';
  className?: string;
  showFee?: boolean;
  autoLoad?: boolean;
}

const LocalPaymentMethodSelector: React.FC<LocalPaymentMethodSelectorProps> = ({
  amount,
  selectedMethodCode,
  onMethodSelect,
  language = 'en',
  className,
  showFee = true,
  autoLoad = true
}) => {
  const [methods, setMethods] = useState<LocalPaymentMethod[]>([]);
  const [feeResults, setFeeResults] = useState<Map<string, PaymentFeeResult>>(new Map());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch available payment methods
  useEffect(() => {
    if (!autoLoad) return;
    
    const fetchMethods = async () => {
      try {
        console.log('[LocalPaymentMethodSelector] Fetching payment methods for amount:', amount);
        setIsLoading(true);
        setError(null);
        
        const response = await getLocalPaymentMethods();
        
        console.log('[LocalPaymentMethodSelector] Payment methods API response:', JSON.stringify(response, null, 2));
        
        if (response.success && response.data) {
          // Filter active methods
          const activeMethods = response.data.filter(method =>
            method.isActive &&
            amount >= method.minAmount &&
            amount <= method.maxAmount
          );
          console.log('[LocalPaymentMethodSelector] Active payment methods after filtering:', activeMethods.length);
          setMethods(activeMethods);
          
          // Calculate fees for all methods
          if (showFee && activeMethods.length > 0) {
            const feeMap = new Map<string, PaymentFeeResult>();
            await Promise.all(
              activeMethods.map(async (method) => {
                try {
                  const feeResponse = await calculatePaymentFee(amount, method.code);
                  if (feeResponse.success && feeResponse.data) {
                    feeMap.set(method.code, feeResponse.data);
                  }
                } catch (err) {
                  console.error('[LocalPaymentMethodSelector] Error calculating fee:', err);
                }
              })
            );
            console.log('[LocalPaymentMethodSelector] Fee results calculated:', feeMap);
            setFeeResults(feeMap);
          }
        } else {
          console.error('[LocalPaymentMethodSelector] Invalid payment methods API response:', response);
          setError('Failed to load payment methods');
        }
      } catch (err) {
        console.error('[LocalPaymentMethodSelector] Error fetching payment methods:', err);
        setError('Failed to load payment methods');
      } finally {
        setIsLoading(false);
      }
    };

    fetchMethods();
  }, [amount, showFee, autoLoad]);

  const formatCurrency = (value: number): string => {
    return `৳${value.toLocaleString('en-BD', { minimumFractionDigits: 2 })}`;
  };

  const getMethodIcon = (code: string): string => {
    const icons: Record<string, string> = {
      bkash: '💰',
      nagad: '💵',
      rocket: '🚀',
      surecash: '💳'
    };
    return icons[code] || '💳';
  };

  const getMethodColor = (code: string): string => {
    const colors: Record<string, string> = {
      bkash: 'bg-pink-50 border-pink-200 hover:bg-pink-100',
      nagad: 'bg-orange-50 border-orange-200 hover:bg-orange-100',
      rocket: 'bg-purple-50 border-purple-200 hover:bg-purple-100',
      surecash: 'bg-blue-50 border-blue-200 hover:bg-blue-100'
    };
    return colors[code] || 'bg-gray-50 border-gray-200 hover:bg-gray-100';
  };

  const getSelectedMethodColor = (code: string): string => {
    const colors: Record<string, string> = {
      bkash: 'bg-pink-100 border-pink-400 ring-2 ring-pink-400',
      nagad: 'bg-orange-100 border-orange-400 ring-2 ring-orange-400',
      rocket: 'bg-purple-100 border-purple-400 ring-2 ring-purple-400',
      surecash: 'bg-blue-100 border-blue-400 ring-2 ring-blue-400'
    };
    return colors[code] || 'bg-blue-100 border-blue-400 ring-2 ring-blue-400';
  };

  const handleMethodSelect = async (method: LocalPaymentMethod) => {
    onMethodSelect?.(method, feeResults.get(method.code));
  };

  const handleRetry = () => {
    const fetchMethods = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const response = await getLocalPaymentMethods();
        
        if (response.success && response.data) {
          const activeMethods = response.data.filter(method => 
            method.isActive && 
            amount >= method.minAmount && 
            amount <= method.maxAmount
          );
          setMethods(activeMethods);
          
          if (showFee && activeMethods.length > 0) {
            const feeMap = new Map<string, PaymentFeeResult>();
            await Promise.all(
              activeMethods.map(async (method) => {
                try {
                  const feeResponse = await calculatePaymentFee(amount, method.code);
                  if (feeResponse.success && feeResponse.data) {
                    feeMap.set(method.code, feeResponse.data);
                  }
                } catch (err) {
                  console.error('[LocalPaymentMethodSelector] Error calculating fee:', err);
                }
              })
            );
            setFeeResults(feeMap);
          }
        } else {
          setError('Failed to load payment methods');
        }
      } catch (err) {
        console.error('[LocalPaymentMethodSelector] Error fetching payment methods:', err);
        setError('Failed to load payment methods');
      } finally {
        setIsLoading(false);
      }
    };

    fetchMethods();
  };

  return (
    <div className={cn('bg-white rounded-lg shadow-sm border border-gray-200', className)}>
      {/* Header */}
      <div className="flex items-center gap-2 p-4 border-b border-gray-200">
        <Wallet className="w-5 h-5 text-blue-600" aria-hidden="true" />
        <h2 className="text-lg font-semibold text-gray-900">
          {language === 'bn' ? 'পেমেন্ট পদ্ধতি নির্বাচন' : 'Select Payment Method'}
        </h2>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-8" role="status" aria-live="polite">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin" aria-hidden="true" />
          <p className="text-sm text-gray-600 mt-2 ml-2">
            {language === 'bn' ? 'লোড হচ্ছে...' : 'Loading...'}
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

      {/* No Methods Available */}
      {!isLoading && !error && methods.length === 0 && (
        <div className="bg-gray-50 border border-gray-200 rounded-md p-6 m-4">
          <div className="flex items-center gap-2">
            <Info className="w-5 h-5 text-blue-600" aria-hidden="true" />
            <p className="text-sm text-gray-700">
              {language === 'bn' 
                ? `পরিমাণ ${formatCurrency(amount)}-এর জন্য কোনো পেমেন্ট পদ্ধতি উপলব্ধ নেই।`
                : `No payment methods available for amount ${formatCurrency(amount)}.`
              }
            </p>
          </div>
        </div>
      )}

      {/* Payment Methods */}
      {!isLoading && !error && methods.length > 0 && (
        <div className="p-4 space-y-3">
          <h3 className="text-sm font-medium text-gray-700 mb-3">
            {language === 'bn' ? 'উপলব্ধ পেমেন্ট পদ্ধতি' : 'Available Payment Methods'}
          </h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {methods.map((method) => {
              const feeResult = feeResults.get(method.code);
              const isSelected = selectedMethodCode === method.code;
              
              return (
                <button
                  key={method.id}
                  onClick={() => handleMethodSelect(method)}
                  className={cn(
                    'relative p-4 rounded-lg border-2 transition-all duration-200 text-left',
                    isSelected 
                      ? getSelectedMethodColor(method.code)
                      : getMethodColor(method.code),
                    'focus:outline-none focus:ring-2 focus:ring-blue-500'
                  )}
                  aria-pressed={isSelected}
                >
                  {/* Selected Indicator */}
                  {isSelected && (
                    <div className="absolute top-2 right-2 w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
                      <Check className="w-4 h-4 text-white" aria-hidden="true" />
                    </div>
                  )}

                  {/* Method Logo and Name */}
                  <div className="flex items-center gap-3 mb-3">
                    {method.logoUrl ? (
                      <img
                        src={method.logoUrl}
                        alt={`${method.name} logo`}
                        className="w-10 h-10 object-contain rounded"
                      />
                    ) : (
                      <span className="text-2xl" aria-hidden="true">
                        {getMethodIcon(method.code)}
                      </span>
                    )}
                    <div className="flex-1">
                      <div className="font-semibold text-gray-900">
                        {method.displayName || method.name}
                      </div>
                      <div className="text-xs text-gray-500">
                        {method.name}
                      </div>
                    </div>
                  </div>

                  {/* Method Details */}
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">
                        {language === 'bn' ? 'সীমা:' : 'Limit:'}
                      </span>
                      <span className="font-medium text-gray-900">
                        {formatCurrency(method.minAmount)} - {formatCurrency(method.maxAmount)}
                      </span>
                    </div>
                    
                    {showFee && feeResult && (
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">
                          {language === 'bn' ? 'ফি:' : 'Fee:'}
                        </span>
                        <span className={cn(
                          'font-medium',
                          feeResult.totalFee > 0 ? 'text-red-600' : 'text-green-600'
                        )}>
                          {feeResult.totalFee > 0 
                            ? `+${formatCurrency(feeResult.totalFee)}`
                            : (language === 'bn' ? 'বিনামূল্যে' : 'FREE')
                          }
                        </span>
                      </div>
                    )}
                    
                    {feeResult && feeResult.totalFee > 0 && (
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">
                          {language === 'bn' ? 'মোট:' : 'Total:'}
                        </span>
                        <span className="font-medium text-blue-600">
                          {formatCurrency(feeResult.totalAmount)}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Requirements */}
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <div className="flex flex-wrap gap-2">
                      {method.requiresPhone && (
                        <span className="inline-flex items-center px-2 py-1 bg-gray-100 rounded text-xs text-gray-700">
                          {language === 'bn' ? 'ফোন প্রয়োজন' : 'Phone Required'}
                        </span>
                      )}
                      {method.requiresPin && (
                        <span className="inline-flex items-center px-2 py-1 bg-gray-100 rounded text-xs text-gray-700">
                          {language === 'bn' ? 'PIN প্রয়োজন' : 'PIN Required'}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Info Note */}
          <div className="mt-4 bg-blue-50 border border-blue-200 rounded-md p-3">
            <div className="flex items-start gap-2">
              <Info className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" aria-hidden="true" />
              <p className="text-xs text-blue-800">
                {language === 'bn' 
                  ? 'পেমেন্ট প্রক্রিয়া সম্পন্ন হওয়ার পর আপনাকে পেমেন্ট নির্দেশাবলী প্রদান করা হবে।'
                  : 'Payment instructions will be provided after payment processing is complete.'
                }
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LocalPaymentMethodSelector;
