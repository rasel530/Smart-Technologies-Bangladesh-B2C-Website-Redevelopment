'use client';

import React from 'react';
import { Info, CreditCard, X } from 'lucide-react';
import { EmiDetailsProps, type EmiDetails as EmiDetailsType } from '@/types/emi';
import { cn } from '@/lib/utils';

/**
 * EmiDetails Component
 * Displays detailed EMI breakdown
 */
const EmiDetails: React.FC<EmiDetailsProps> = ({
  emiDetails,
  language = 'en',
  className,
  showProviderInfo = true
}: EmiDetailsProps) => {
  const formatCurrency = (value: number): string => {
    return `৳${value.toLocaleString('en-BD', { minimumFractionDigits: 2 })}`;
  };

  const formatDuration = (months: number): string => {
    return language === 'bn' 
      ? `${months} মাস`
      : `${months} Months`;
  };

  return (
    <div className={cn('bg-white rounded-lg shadow-sm border border-gray-200', className)}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <CreditCard className="w-5 h-5 text-blue-600" />
          <h2 className="text-lg font-semibold text-gray-900">
            {language === 'bn' ? 'ইএমআই বিস্তালিং' : 'EMI Details'}
          </h2>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Provider Info */}
        {showProviderInfo && (
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            {emiDetails.provider.logoUrl && (
              <img
                src={emiDetails.provider.logoUrl}
                alt={emiDetails.provider.name}
                className="w-12 h-12 object-contain rounded"
              />
            )}
            <div className="flex-1">
              <div className="font-semibold text-gray-900">
                {emiDetails.provider.name}
              </div>
              <div className="text-sm text-gray-500">
                {emiDetails.planName}
              </div>
              {emiDetails.provider.website && (
                <a
                  href={emiDetails.provider.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-blue-600 hover:underline"
                >
                  {language === 'bn' ? 'ওয়বাইট' : 'Visit Website'}
                </a>
              )}
            </div>
          </div>
        )}

        {/* Plan Summary */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 bg-blue-50 rounded-lg">
            <div className="text-xs text-gray-600 mb-1">
              {language === 'bn' ? 'সময়' : 'Duration'}
            </div>
            <div className="text-lg font-semibold text-gray-900">
              {formatDuration(emiDetails.duration)}
            </div>
          </div>
          <div className="p-3 bg-blue-50 rounded-lg">
            <div className="text-xs text-gray-600 mb-1">
              {language === 'bn' ? 'বার্ষ' : 'Interest Rate'}
            </div>
            <div className="text-lg font-semibold text-gray-900">
              {emiDetails.interestRate}%
            </div>
          </div>
        </div>

        {/* EMI Breakdown */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-gray-700">
            {language === 'bn' ? 'ইএমআই ব্রেকডাউন' : 'EMI Breakdown'}
          </h3>
          <div className="bg-gray-50 rounded-lg p-4 space-y-3">
            <div className="flex justify-between items-center py-2 border-b border-gray-200">
              <span className="text-sm text-gray-600">
                {language === 'bn' ? 'মূল্য' : 'Principal'}
              </span>
              <span className="text-base font-semibold text-gray-900">
                {formatCurrency(emiDetails.principal)}
              </span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-200">
              <span className="text-sm text-gray-600">
                {language === 'bn' ? 'বার্ষ' : 'Interest'}
              </span>
              <span className="text-base font-semibold text-gray-900">
                {formatCurrency(emiDetails.totalInterest)}
              </span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-200">
              <span className="text-sm text-gray-600">
                {language === 'bn' ? 'প্রসিং ফি' : 'Processing Fee'}
              </span>
              <span className="text-base font-semibold text-gray-900">
                {emiDetails.processingFee > 0 ? `+${formatCurrency(emiDetails.processingFee)}` : formatCurrency(emiDetails.processingFee)}
              </span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-200">
              <span className="text-sm text-gray-600">
                {language === 'bn' ? 'মোট পরিমাণ' : 'Total Payable'}
              </span>
              <span className="text-base font-semibold text-green-600">
                {formatCurrency(emiDetails.totalPayable)}
              </span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-200">
              <span className="text-sm text-gray-600">
                {language === 'bn' ? 'মোট পরিমাণ' : 'Total Amount'}
              </span>
              <span className="text-base font-semibold text-green-600">
                {formatCurrency(emiDetails.totalAmount)}
              </span>
            </div>
          </div>
        </div>

        {/* Monthly EMI */}
        <div className="p-4 bg-blue-600 rounded-lg">
          <div className="text-center">
            <div className="text-sm text-blue-100 mb-1">
              {language === 'bn' ? 'মাসিক ইএমআই' : 'Monthly EMI'}
            </div>
            <div className="text-2xl font-bold text-white">
              {formatCurrency(emiDetails.emiAmount)}
            </div>
            <div className="text-xs text-blue-100 mt-1">
              {language === 'bn' ? 'প্রতি মাসে' : 'per month'}
            </div>
          </div>
        </div>

        {/* Additional Info */}
        <div className="flex items-start gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <Info className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
          <div className="text-xs text-gray-700">
            {language === 'bn' 
              ? 'এই ইএমআই গণনা আনুমানিক। আসল ইএমআই ব্যাংকের নীতি এবং শর্তাবলীর ওপর নির্ভর করে পরিবর্তিত হতে পারে।'
              : 'This EMI calculation is approximate. Actual EMI may vary based on bank policies and terms.'}
          </div>
        </div>

        {/* Down Payment Info */}
        {emiDetails.downPayment > 0 && (
          <div className="flex items-start gap-2 p-3 bg-purple-50 border border-purple-200 rounded-lg">
            <Info className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
            <div className="text-xs text-gray-700">
              {language === 'bn' 
                ? `ডাউন পেমেন্ট: ${formatCurrency(emiDetails.downPayment)}`
                : `Down Payment: ${formatCurrency(emiDetails.downPayment)}`}
            </div>
          </div>
        )}

        {/* Amount Range */}
        <div className="flex justify-between items-center py-2 border-t border-gray-200">
          <span className="text-xs text-gray-500">
            {language === 'bn' ? 'ন্যূনতম পরিমাণ' : 'Min Amount'}
          </span>
          <span className="text-xs font-medium text-gray-900">
            {formatCurrency(emiDetails.minAmount)}
          </span>
        </div>
        <div className="flex justify-between items-center py-2 border-t border-gray-200">
          <span className="text-xs text-gray-500">
            {language === 'bn' ? 'সর্বোচ্চ পরিমাণ' : 'Max Amount'}
          </span>
          <span className="text-xs font-medium text-gray-900">
            {formatCurrency(emiDetails.maxAmount)}
          </span>
        </div>
      </div>
    </div>
  );
};

export default EmiDetails;
