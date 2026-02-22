'use client';

import React, { useState, useEffect } from 'react';
import { DollarSign, Info, CheckCircle, AlertCircle, Loader2, Percent } from 'lucide-react';
import { PaymentFeeResult, LOCAL_PAYMENT_CONSTANTS } from '@/types/localPayment';
import { calculatePaymentFee } from '@/lib/api/localPayment';
import { cn } from '@/lib/utils';

/**
 * LocalPaymentFeeDisplay Component
 * Display payment fee for local payment methods
 * Features:
 * - Calculate and display payment fee
 * - Show fee breakdown (fixed + percentage)
 * - Display total amount
 */
interface LocalPaymentFeeDisplayProps {
  amount: number;
  methodCode: string;
  feeResult?: PaymentFeeResult;
  language?: 'en' | 'bn';
  className?: string;
  showBreakdown?: boolean;
  autoCalculate?: boolean;
}

const LocalPaymentFeeDisplay: React.FC<LocalPaymentFeeDisplayProps> = ({
  amount,
  methodCode,
  feeResult: propFeeResult,
  language = 'en',
  className,
  showBreakdown = true,
  autoCalculate = true
}) => {
  const [calculatedFeeResult, setCalculatedFeeResult] = useState<PaymentFeeResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Calculate fee when amount or method code changes
  useEffect(() => {
    if (!autoCalculate || propFeeResult !== undefined) return;

    const fetchFee = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const response = await calculatePaymentFee(amount, methodCode);
        
        if (response.success && response.data) {
          setCalculatedFeeResult(response.data);
        } else {
          setError('Failed to calculate payment fee');
        }
      } catch (err) {
        console.error('[LocalPaymentFeeDisplay] Error calculating payment fee:', err);
        setError('Failed to calculate payment fee');
      } finally {
        setIsLoading(false);
      }
    };

    fetchFee();
  }, [amount, methodCode, autoCalculate, propFeeResult]);

  const formatCurrency = (value: number): string => {
    return `৳${value.toLocaleString('en-BD', { minimumFractionDigits: 2 })}`;
  };

  const formatPercent = (value: number): string => {
    return `${value.toFixed(2)}%`;
  };

  const feeResult = propFeeResult !== undefined ? propFeeResult : calculatedFeeResult;
  const hasFee = feeResult && feeResult.totalFee > 0;

  const handleRetry = () => {
    if (autoCalculate && propFeeResult === undefined) {
      const fetchFee = async () => {
        try {
          setIsLoading(true);
          setError(null);
          
          const response = await calculatePaymentFee(amount, methodCode);
          
          if (response.success && response.data) {
            setCalculatedFeeResult(response.data);
          } else {
            setError('Failed to calculate payment fee');
          }
        } catch (err) {
          console.error('[LocalPaymentFeeDisplay] Error calculating payment fee:', err);
          setError('Failed to calculate payment fee');
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
          {language === 'bn' ? 'পেমেন্ট ফি' : 'Payment Fee'}
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
      {!isLoading && !error && feeResult && (
        <div className="p-4">
          {/* Main Fee Display */}
          <div className={cn(
            'rounded-lg p-4 mb-4',
            hasFee ? 'bg-blue-50 border border-blue-200' : 'bg-green-50 border border-green-200'
          )}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {hasFee ? (
                  <DollarSign className="w-8 h-8 text-blue-600 flex-shrink-0" aria-hidden="true" />
                ) : (
                  <CheckCircle className="w-8 h-8 text-green-600 flex-shrink-0" aria-hidden="true" />
                )}
                <div>
                  <p className="text-sm text-gray-600">
                    {language === 'bn' ? 'পেমেন্ট ফি' : 'Payment Fee'}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {language === 'bn' ? `পেমেন্ট পদ্ধতি: ${feeResult.paymentMethod.displayName}` : `Payment Method: ${feeResult.paymentMethod.displayName}`}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className={cn(
                  'text-2xl font-bold',
                  hasFee ? 'text-blue-600' : 'text-green-600'
                )}>
                  {hasFee 
                    ? formatCurrency(feeResult.totalFee)
                    : (language === 'bn' ? 'বিনামূল্যে' : 'FREE')
                  }
                </p>
                {!hasFee && (
                  <p className="text-xs text-gray-500 mt-1">
                    {language === 'bn' ? 'কোনো ফি নেই' : 'No fee'}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Total Amount */}
          <div className="bg-gray-50 border border-gray-200 rounded-md p-4 mb-4">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-700">
                {language === 'bn' ? 'মোট পরিমাণ' : 'Total Amount'}
              </span>
              <span className="text-lg font-bold text-gray-900">
                {formatCurrency(feeResult.totalAmount)}
              </span>
            </div>
          </div>

          {/* Breakdown */}
          {showBreakdown && hasFee && (
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
                <h3 className="font-semibold text-gray-900">
                  {language === 'bn' ? 'ফি ব্রেকডাউন' : 'Fee Breakdown'}
                </h3>
              </div>
              <div className="p-4 space-y-3">
                {/* Base Amount */}
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-sm text-gray-600">
                    {language === 'bn' ? 'মূল পরিমাণ' : 'Base Amount'}
                  </span>
                  <span className="text-sm font-semibold text-gray-900">
                    {formatCurrency(feeResult.amount)}
                  </span>
                </div>

                {/* Fixed Fee */}
                {feeResult.processingFee > 0 && (
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-sm text-gray-600">
                      {language === 'bn' ? 'নির্দিষ্ট ফি' : 'Fixed Fee'}
                    </span>
                    <span className="text-sm font-semibold text-gray-900">
                      {formatCurrency(feeResult.processingFee)}
                    </span>
                  </div>
                )}

                {/* Percentage Fee */}
                {feeResult.processingFeePercent > 0 && feeResult.percentageFee > 0 && (
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <div className="flex items-center gap-2">
                      <Percent className="w-4 h-4 text-gray-600" aria-hidden="true" />
                      <span className="text-sm text-gray-600">
                        {language === 'bn' ? 'শতাংশ ফি' : 'Percentage Fee'}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-semibold text-gray-900">
                        {formatCurrency(feeResult.percentageFee)}
                      </span>
                      <span className="text-xs text-gray-500 ml-1">
                        ({formatPercent(feeResult.processingFeePercent)})
                      </span>
                    </div>
                  </div>
                )}

                {/* Total Fee */}
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-sm text-gray-600">
                    {language === 'bn' ? 'মোট ফি' : 'Total Fee'}
                  </span>
                  <span className="text-sm font-semibold text-red-600">
                    +{formatCurrency(feeResult.totalFee)}
                  </span>
                </div>

                {/* Total Payable */}
                <div className="flex justify-between items-center py-2">
                  <span className="text-sm font-medium text-gray-900">
                    {language === 'bn' ? 'মোট পরিশোধযোগ্য' : 'Total Payable'}
                  </span>
                  <span className="text-lg font-bold text-blue-600">
                    {formatCurrency(feeResult.totalAmount)}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Info Note */}
          <div className="mt-4 bg-blue-50 border border-blue-200 rounded-md p-3">
            <div className="flex items-start gap-2">
              <Info className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" aria-hidden="true" />
              <p className="text-xs text-blue-800">
                {language === 'bn' 
                  ? 'পেমেন্ট ফি পেমেন্ট পদ্ধতি এবং পরিমাণের উপর নির্ভর করে। ফি প্রদর্শিত আনুমানিক এবং পরিবর্তিত হতে পারে।'
                  : 'Payment fee depends on the payment method and amount. The fee displayed is approximate and may vary.'
                }
              </p>
            </div>
          </div>
        </div>
      )}

      {/* No Data */}
      {!isLoading && !error && !feeResult && !autoCalculate && (
        <div className="flex items-center justify-center py-8">
          <p className="text-sm text-gray-500">
            {language === 'bn' ? 'ফি দেখতে পেমেন্ট পদ্ধতি নির্বাচন করুন' : 'Select a payment method to view fee'}
          </p>
        </div>
      )}
    </div>
  );
};

export default LocalPaymentFeeDisplay;
