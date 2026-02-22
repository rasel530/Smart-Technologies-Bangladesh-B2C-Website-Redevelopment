'use client';

import React from 'react';
import { DollarSign, Info, CheckCircle } from 'lucide-react';
import { CodFeeDisplayProps, COD_CONSTANTS } from '@/types/cod';
import { cn } from '@/lib/utils';

/**
 * CodFeeDisplay Component
 * Displays COD fee information for a given amount
 */
const CodFeeDisplay: React.FC<CodFeeDisplayProps> = ({
  amount,
  fee,
  freeAboveAmount = COD_CONSTANTS.DEFAULT_FREE_ABOVE,
  language = 'en',
  className,
  showBreakdown = false
}) => {
  const formatCurrency = (value: number): string => {
    return `৳${value.toLocaleString('en-BD', { minimumFractionDigits: 2 })}`;
  };

  const isFree = amount >= freeAboveAmount;
  const displayFee = fee !== undefined ? fee : (isFree ? 0 : COD_CONSTANTS.DEFAULT_FEE);

  return (
    <div className={cn('bg-white rounded-lg shadow-sm border border-gray-200', className)}>
      {/* Header */}
      <div className="flex items-center gap-2 p-4 border-b border-gray-200">
        <DollarSign className="w-5 h-5 text-blue-600" />
        <h2 className="text-lg font-semibold text-gray-900">
          {language === 'bn' ? 'ক্যাশ অন ডেলিভারি ফি' : 'COD Fee'}
        </h2>
      </div>

      {/* Fee Display */}
      <div className="p-4">
        {/* Main Fee Display */}
        <div className={cn(
          'rounded-lg p-4 mb-4',
          isFree ? 'bg-green-50 border border-green-200' : 'bg-blue-50 border border-blue-200'
        )}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {isFree ? (
                <CheckCircle className="w-8 h-8 text-green-600 flex-shrink-0" />
              ) : (
                <DollarSign className="w-8 h-8 text-blue-600 flex-shrink-0" />
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
            <Info className="w-5 h-5 text-gray-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm text-gray-700">
                {language === 'bn' 
                  ? `অর্ডার ${formatCurrency(freeAboveAmount)} বা তার বেশি হলে ক্যাশ অন ডেলিভারি ফি বিনামূল্যে।`
                  : `Free COD delivery for orders of ${formatCurrency(freeAboveAmount)} or above.`
                }
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
    </div>
  );
};

export default CodFeeDisplay;
