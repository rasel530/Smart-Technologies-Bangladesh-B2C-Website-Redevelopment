'use client';

import React, { useState, useEffect } from 'react';
import { DollarSign, Info, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { COD_CONSTANTS } from '@/types/cod';
import { calculateCodFee } from '@/lib/api/cod';
import { cn } from '@/lib/utils';

/**
 * CodFeeDisplay Component
 * Display COD fee for cart
 * Features:
 * - Calculate and display COD fee
 * - Show free threshold
 * - Display fee breakdown
 */
interface CodFeeDisplayProps {
  amount: number;
  fee?: number;
  freeAboveAmount?: number;
  language?: 'en' | 'bn';
  className?: string;
  showBreakdown?: boolean;
  autoCalculate?: boolean;
}

const CodFeeDisplay: React.FC<CodFeeDisplayProps> = ({
  amount,
  fee: propFee,
  freeAboveAmount = COD_CONSTANTS.DEFAULT_FREE_ABOVE,
  language = 'en',
  className,
  showBreakdown = false,
  autoCalculate = true
}) => {
  const [calculatedFee, setCalculatedFee] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Calculate COD fee when amount changes
  useEffect(() => {
    if (!autoCalculate || propFee !== undefined) return;

    const fetchFee = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const response = await calculateCodFee(amount);
        
        if (response.success && response.data) {
          setCalculatedFee(response.data.fee);
        } else {
          setError('Failed to calculate COD fee');
        }
      } catch (err) {
        console.error('[CodFeeDisplay] Error calculating COD fee:', err);
        setError('Failed to calculate COD fee');
      } finally {
        setIsLoading(false);
      }
    };

    fetchFee();
  }, [amount, autoCalculate, propFee]);

  const formatCurrency = (value: number): string => {
    return `৳${value.toLocaleString('en-BD', { minimumFractionDigits: 2 })}`;
  };

  const fee = propFee !== undefined ? propFee : calculatedFee;
  const isFree = amount >= freeAboveAmount;
  const displayFee = fee !== null ? (isFree ? 0 : fee) : (isFree ? 0 : COD_CONSTANTS.DEFAULT_FEE);

  const handleRetry = () => {
    if (autoCalculate && propFee === undefined) {
      const fetchFee = async () => {
        try {
          setIsLoading(true);
          setError(null);
          
          const response = await calculateCodFee(amount);
          
          if (response.success && response.data) {
            setCalculatedFee(response.data.fee);
          } else {
            setError('Failed to calculate COD fee');
          }
        } catch (err) {
          console.error('[CodFeeDisplay] Error calculating COD fee:', err);
          setError('Failed to calculate COD fee');
        } finally {
          setIsLoading(false);
        }
      };

      fetchFee();
    }
  };

  return (
    <div className={cn('bg-white rounded-lg shadow-sm border border-gray-200', className)}>
      {/* Header */}
      <div className="flex items-center gap-2 p-4 border-b border-gray-200">
        <DollarSign className="w-5 h-5 text-blue-600" aria-hidden="true" />
        <h2 className="text-lg font-semibold text-gray-900">
          {language === 'bn' ? 'ক্যাশ অন ডেলিভারি ফি' : 'COD Fee'}
        </h2>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-8" role="status" aria-live="polite">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin" aria-hidden="true" />
          <p className="text-sm text-gray-600 mt-2 ml-2">
            {language === 'bn' ? 'ফি গণনা করা হচ্ছে...' : 'Calculating fee...'}
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

      {/* Fee Display */}
      {!isLoading && !error && fee !== null && (
        <div className="p-4">
          {/* Main Fee Display */}
          <div className={cn(
            'rounded-lg p-4 mb-4',
            isFree ? 'bg-green-50 border border-green-200' : 'bg-blue-50 border border-blue-200'
          )}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {isFree ? (
                  <CheckCircle className="w-8 h-8 text-green-600 flex-shrink-0" aria-hidden="true" />
                ) : (
                  <DollarSign className="w-8 h-8 text-blue-600 flex-shrink-0" aria-hidden="true" />
                )}
                <div>
                  <p className="text-sm text-gray-600">
                    {language === 'bn' ? 'ক্যাশ অন ডেলিভারি ফি' : 'COD Fee'}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {language === 'bn' ? `অর্ডার পরিমাণ: ${formatCurrency(amount)}` : `Order Amount: ${formatCurrency(amount)}`}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className={cn(
                  'text-2xl font-bold',
                  isFree ? 'text-green-600' : 'text-blue-600'
                )}>
                  {isFree 
                    ? (language === 'bn' ? 'বিনামূল্যে' : 'FREE')
                    : formatCurrency(displayFee)
                  }
                </p>
                {!isFree && (
                  <p className="text-xs text-gray-500 mt-1">
                    {language === 'bn' ? 'প্রয়োজিত' : 'Required'}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Free Threshold Info */}
          <div className="bg-gray-50 border border-gray-200 rounded-md p-4 mb-4">
            <div className="flex items-start gap-2">
              <Info className="w-5 h-5 text-gray-600 flex-shrink-0 mt-0.5" aria-hidden="true" />
              <div className="flex-1">
                <p className="text-sm text-gray-700">
                  {language === 'bn' 
                    ? `অর্ডার ${formatCurrency(freeAboveAmount)} বা তার বেশি হলে ক্যাশ অন ডেলিভারি ফি বিনামূল্যে।`
                    : `Free COD delivery for orders of ${formatCurrency(freeAboveAmount)} or above.`}
                </p>
                {amount < freeAboveAmount && (
                  <p className="text-xs text-gray-500 mt-2">
                    {language === 'bn' 
                      ? `আরও ${formatCurrency(freeAboveAmount - amount)} যোগ করুন বিনামূল্যে পেতে।`
                      : `Add ${formatCurrency(freeAboveAmount - amount)} more to get free delivery.`
                    }
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Breakdown */}
          {showBreakdown && (
            <div className="border border-gray-200 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-3">
                {language === 'bn' ? 'বিস্তারিত ব্রেকডাউন' : 'Detailed Breakdown'}
              </h3>
              <div className="space-y-2">
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-sm text-gray-600">
                    {language === 'bn' ? 'অর্ডার পরিমাণ' : 'Order Amount'}
                  </span>
                  <span className="text-sm font-semibold text-gray-900">
                    {formatCurrency(amount)}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-sm text-gray-600">
                    {language === 'bn' ? 'ক্যাশ অন ডেলিভারি ফি' : 'COD Fee'}
                  </span>
                  <span className={cn(
                    'text-sm font-semibold',
                    isFree ? 'text-green-600' : 'text-gray-900'
                  )}>
                    {isFree ? formatCurrency(0) : formatCurrency(displayFee)}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-sm text-gray-600">
                    {language === 'bn' ? 'মোট পরিমাণ' : 'Total Amount'}
                  </span>
                  <span className="text-lg font-semibold text-blue-600">
                    {formatCurrency(amount + displayFee)}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Default State (no fee provided, not calculating) */}
      {!isLoading && !error && fee === null && !autoCalculate && (
        <div className="flex items-center justify-center py-8">
          <p className="text-sm text-gray-500">
            {language === 'bn' ? 'ফি গণনা করতে অর্ডার পরিমাণ নির্ধারণ করুন' : 'Set order amount to calculate fee'}
          </p>
        </div>
      )}
    </div>
  );
};

export default CodFeeDisplay;
