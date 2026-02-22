'use client';

import React from 'react';
import { CreditCard, TrendingUp, Calendar, DollarSign, Info } from 'lucide-react';
import { EmiSummaryProps, EmiDetails } from '@/types/emi';
import { cn } from '@/lib/utils';

/**
 * EmiSummary Component
 * Display selected EMI plan summary
 * Features:
 * - Display selected EMI plan summary
 * - Show monthly EMI amount
 * - Show total payable amount
 * - Show interest rate and duration
 */
const EmiSummary: React.FC<EmiSummaryProps> = ({
  emiDetails,
  language = 'en',
  className,
  showBreakdown = true
}) => {
  const formatCurrency = (value: number): string => {
    return `৳${value.toLocaleString('en-BD', { minimumFractionDigits: 2 })}`;
  };

  const formatDuration = (months: number): string => {
    return language === 'bn' 
      ? `${months} মাস`
      : `${months} months`;
  };

  const calculateEffectiveRate = (): string => {
    const effectiveRate = ((emiDetails.totalInterest + emiDetails.processingFee) / emiDetails.principal) * 100;
    return effectiveRate.toFixed(2);
  };

  return (
    <div className={cn('bg-white rounded-lg shadow-sm border border-gray-200', className)}>
      {/* Header */}
      <div className="flex items-center gap-2 p-4 border-b border-gray-200">
        <CreditCard className="w-5 h-5 text-blue-600" aria-hidden="true" />
        <h2 className="text-lg font-semibold text-gray-900">
          {language === 'bn' ? 'ইএমআই সারাংশ' : 'EMI Summary'}
        </h2>
      </div>

      {/* Main Summary */}
      <div className="p-4">
        {/* Provider Info */}
        <div className="flex items-center gap-3 mb-4 p-3 bg-gray-50 rounded-lg">
          {emiDetails.provider.logoUrl && (
            <img
              src={emiDetails.provider.logoUrl}
              alt={`${emiDetails.provider.name} logo`}
              className="w-10 h-10 object-contain rounded"
            />
          )}
          <div className="flex-1">
            <div className="font-semibold text-gray-900">
              {emiDetails.provider.name}
            </div>
            <div className="text-sm text-gray-500">
              {emiDetails.planName}
            </div>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          {/* Monthly EMI */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <Calendar className="w-4 h-4 text-blue-600" aria-hidden="true" />
              <span className="text-xs text-blue-700 font-medium">
                {language === 'bn' ? 'মাসিক ইএমআই' : 'Monthly EMI'}
              </span>
            </div>
            <div className="text-xl font-bold text-blue-900">
              {formatCurrency(emiDetails.emiAmount)}
            </div>
          </div>

          {/* Total Payable */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <DollarSign className="w-4 h-4 text-green-600" aria-hidden="true" />
              <span className="text-xs text-green-700 font-medium">
                {language === 'bn' ? 'মোট পরিমাণ' : 'Total Payable'}
              </span>
            </div>
            <div className="text-xl font-bold text-green-900">
              {formatCurrency(emiDetails.totalPayable)}
            </div>
          </div>
        </div>

        {/* Duration and Interest Rate */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          {/* Duration */}
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <Calendar className="w-4 h-4 text-purple-600" aria-hidden="true" />
              <span className="text-xs text-purple-700 font-medium">
                {language === 'bn' ? 'সময়কাল' : 'Duration'}
              </span>
            </div>
            <div className="text-lg font-bold text-purple-900">
              {formatDuration(emiDetails.duration)}
            </div>
          </div>

          {/* Interest Rate */}
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="w-4 h-4 text-orange-600" aria-hidden="true" />
              <span className="text-xs text-orange-700 font-medium">
                {language === 'bn' ? 'সুদ হার' : 'Interest Rate'}
              </span>
            </div>
            <div className="text-lg font-bold text-orange-900">
              {emiDetails.interestRate}%
            </div>
          </div>
        </div>

        {/* Detailed Breakdown */}
        {showBreakdown && (
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
              <h3 className="text-sm font-semibold text-gray-900">
                {language === 'bn' ? 'বিস্তারিত ব্রেকডাউন' : 'Detailed Breakdown'}
              </h3>
            </div>
            <div className="p-4 space-y-3">
              {/* Principal */}
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-sm text-gray-600">
                  {language === 'bn' ? 'মূল্য' : 'Principal'}
                </span>
                <span className="text-sm font-semibold text-gray-900">
                  {formatCurrency(emiDetails.principal)}
                </span>
              </div>

              {/* Interest */}
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-sm text-gray-600">
                  {language === 'bn' ? 'মোট সুদ' : 'Total Interest'}
                </span>
                <span className="text-sm font-semibold text-red-600">
                  +{formatCurrency(emiDetails.totalInterest)}
                </span>
              </div>

              {/* Processing Fee */}
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-sm text-gray-600">
                  {language === 'bn' ? 'প্রসেসিং ফি' : 'Processing Fee'}
                </span>
                <span className="text-sm font-semibold text-red-600">
                  {emiDetails.processingFee > 0 ? `+${formatCurrency(emiDetails.processingFee)}` : formatCurrency(emiDetails.processingFee)}
                </span>
              </div>

              {/* Total Amount */}
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-sm text-gray-600">
                  {language === 'bn' ? 'মোট পরিমাণ' : 'Total Amount'}
                </span>
                <span className="text-sm font-semibold text-gray-900">
                  {formatCurrency(emiDetails.totalAmount)}
                </span>
              </div>

              {/* Effective Rate */}
              <div className="flex justify-between items-center py-2">
                <span className="text-sm text-gray-600">
                  {language === 'bn' ? 'কার্যকর হার' : 'Effective Rate'}
                </span>
                <span className="text-sm font-semibold text-blue-600">
                  {calculateEffectiveRate()}%
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
                ? `ইএমআই পরিমাণ আনুমানিক এবং ব্যাংকের শর্তাবলী অনুযায়ী পরিবর্তিত হতে পারে। চূড়ান্ত ইএমআই ব্যাংক দ্বারা নিশ্চিত করা হবে।`
                : `EMI amount is approximate and may vary based on bank terms and conditions. Final EMI will be confirmed by the bank.`
              }
            </p>
          </div>
        </div>

        {/* Payment Schedule Preview */}
        {showBreakdown && (
          <div className="mt-4 border border-gray-200 rounded-lg overflow-hidden">
            <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
              <h3 className="text-sm font-semibold text-gray-900">
                {language === 'bn' ? 'পেমেন্ট সময়সূচী প্রিভিউ' : 'Payment Schedule Preview'}
              </h3>
            </div>
            <div className="p-4">
              <div className="space-y-2">
                {/* First Payment */}
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-600">
                    {language === 'bn' ? 'প্রথম পেমেন্ট' : 'First Payment'}
                  </span>
                  <span className="font-semibold text-gray-900">
                    {formatCurrency(emiDetails.emiAmount)}
                  </span>
                </div>
                {/* Last Payment */}
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-600">
                    {language === 'bn' ? 'শেষ পেমেন্ট' : 'Last Payment'}
                  </span>
                  <span className="font-semibold text-gray-900">
                    {formatCurrency(emiDetails.emiAmount)}
                  </span>
                </div>
                {/* Number of Payments */}
                <div className="flex justify-between items-center text-sm pt-2 border-t border-gray-100">
                  <span className="text-gray-600">
                    {language === 'bn' ? 'মোট পেমেন্ট' : 'Total Payments'}
                  </span>
                  <span className="font-semibold text-blue-600">
                    {emiDetails.duration}x
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EmiSummary;
