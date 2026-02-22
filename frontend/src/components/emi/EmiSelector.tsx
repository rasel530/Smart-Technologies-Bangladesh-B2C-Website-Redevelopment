'use client';

import React from 'react';
import { CheckCircle, CreditCard } from 'lucide-react';
import { EmiSelectorProps, EmiPlan } from '@/types/emi';
import { cn } from '@/lib/utils';

/**
 * EmiSelector Component
 * EMI plan selector for choosing from available plans
 */
const EmiSelector: React.FC<EmiSelectorProps> = ({
  availablePlans,
  selectedPlanId,
  onPlanSelect,
  language = 'en',
  className
}) => {
  const formatCurrency = (value: number): string => {
    return `৳${value.toLocaleString('en-BD', { minimumFractionDigits: 2 })}`;
  };

  const formatDuration = (months: number): string => {
    return language === 'bn' 
      ? `${months} মাস`
      : `${months} Months`;
  };

  const getInterestRateColor = (rate: number): string => {
    if (rate === 0) return 'text-green-600';
    if (rate < 5) return 'text-green-600';
    if (rate < 10) return 'text-yellow-600';
    return 'text-orange-600';
  };

  const getInterestRateBadge = (rate: number): string => {
    if (rate === 0) return 'bg-green-100 text-green-800';
    if (rate < 5) return 'bg-green-100 text-green-800';
    if (rate < 10) return 'bg-yellow-100 text-yellow-800';
    return 'bg-orange-100 text-orange-800';
  };

  // Group plans by provider
  const groupedPlans = availablePlans.reduce((acc: any[], plan: EmiPlan) => {
    const provider = plan.provider;
    if (!acc.find((p: any) => p.provider.id === provider.id)) {
      acc.push({
        provider,
        plans: []
      });
    }
    acc.find((p: any) => p.provider.id === provider.id)?.plans.push(plan);
    return acc;
  }, []);

  if (availablePlans.length === 0) {
    return (
      <div className={cn('bg-white rounded-lg shadow-sm border border-gray-200', className)}>
        <div className="p-6 text-center">
          <CreditCard className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-sm text-gray-600">
            {language === 'bn' ? 'কোনো ইএমআই প্ল্যান পাওয়া যায়নি' : 'No EMI plans available'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('bg-white rounded-lg shadow-sm border border-gray-200', className)}>
      {/* Header */}
      <div className="flex items-center gap-2 p-4 border-b border-gray-200">
        <CreditCard className="w-5 h-5 text-blue-600" />
        <h2 className="text-lg font-semibold text-gray-900">
          {language === 'bn' ? 'ইএমআই প্ল্যান নির্বাচন' : 'Select EMI Plan'}
        </h2>
      </div>

      <div className="p-4 space-y-4">
        {groupedPlans.map((group, index) => (
          <div key={index} className="space-y-3">
            {/* Provider Header */}
            <div className="flex items-center gap-3">
              {group.provider.logoUrl && (
                <img
                  src={group.provider.logoUrl}
                  alt={group.provider.name}
                  className="w-8 h-8 object-contain rounded"
                />
              )}
              <div className="flex-1">
                <h3 className="text-base font-semibold text-gray-900">
                  {group.provider.name}
                </h3>
                {group.provider.website && (
                  <a
                    href={group.provider.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-600 hover:underline"
                  >
                    {language === 'bn' ? 'ওয়বাইট' : 'Visit Website'}
                  </a>
                )}
              </div>
            </div>

            {/* Plans */}
            <div className="space-y-2">
              {group.plans.map((plan: EmiPlan) => (
                <button
                  key={plan.id}
                  onClick={() => onPlanSelect?.(plan.id, plan)}
                  className={cn(
                    'w-full text-left p-4 rounded-lg border transition-all duration-200',
                    selectedPlanId === plan.id
                      ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-500'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50',
                    'cursor-pointer'
                  )}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-medium text-gray-900">
                          {plan.name}
                        </span>
                        <span className={cn('px-2 py-0.5 text-xs font-medium rounded-full', getInterestRateBadge(plan.interestRate))}>
                          {plan.interestRate}% {language === 'bn' ? 'বার্ষ' : 'interest'}
                        </span>
                      </div>
                      <div className="text-xs text-gray-500">
                        {formatDuration(plan.duration)}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {language === 'bn' 
                          ? `পরিমাণ: ${formatCurrency(plan.minAmount)} - ${formatCurrency(plan.maxAmount)}`
                          : `Amount: ${formatCurrency(plan.minAmount)} - ${formatCurrency(plan.maxAmount)}`}
                      </div>
                      {plan.processingFee > 0 && (
                        <div className="text-xs text-gray-500 mt-1">
                          {language === 'bn' 
                            ? `প্রসিং ফি: ${formatCurrency(plan.processingFee)}`
                            : `Processing Fee: ${formatCurrency(plan.processingFee)}`}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {selectedPlanId === plan.id && (
                        <CheckCircle className="w-5 h-5 text-blue-600" />
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default EmiSelector;
