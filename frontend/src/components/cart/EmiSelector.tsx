'use client';

import React, { useState, useEffect } from 'react';
import { CreditCard, Check, AlertCircle, Info, ChevronDown, ChevronUp } from 'lucide-react';
import { EmiSelectorProps, EmiPlan, EmiDetails, EMI_CONSTANTS } from '@/types/emi';
import { calculateEmi } from '@/lib/api/emi';
import { cn } from '@/lib/utils';

/**
 * EmiSelector Component
 * Select EMI plan from available options
 * Features:
 * - List available EMI plans
 * - Allow user to select a plan
 * - Show selected plan details
 * - Handle plan selection changes
 */
const EmiSelector: React.FC<EmiSelectorProps> = ({
  availablePlans,
  selectedPlanId,
  onPlanSelect,
  language = 'en',
  className
}) => {
  const [emiDetails, setEmiDetails] = useState<EmiDetails | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedPlans, setExpandedPlans] = useState<Set<string>>(new Set());
  const [amount, setAmount] = useState<number>(EMI_CONSTANTS.MIN_AMOUNT);

  // Calculate EMI details when plan is selected
  useEffect(() => {
    if (selectedPlanId) {
      const calculate = async () => {
        try {
          setIsLoading(true);
          setError(null);
          
          const response = await calculateEmi(amount, selectedPlanId);
          
          if (response.success && response.data) {
            if ('planId' in response.data) {
              setEmiDetails(response.data as EmiDetails);
            }
          }
        } catch (err) {
          console.error('[EmiSelector] Error calculating EMI:', err);
          setError('Failed to calculate EMI');
        } finally {
          setIsLoading(false);
        }
      };

      calculate();
    } else {
      setEmiDetails(null);
    }
  }, [selectedPlanId, amount]);

  const formatCurrency = (value: number): string => {
    return `৳${value.toLocaleString('en-BD', { minimumFractionDigits: 2 })}`;
  };

  const formatDuration = (months: number): string => {
    return language === 'bn' 
      ? `${months} মাস`
      : `${months} Months`;
  };

  const handlePlanSelect = (plan: EmiPlan) => {
    onPlanSelect?.(plan.id, plan);
  };

  const toggleExpand = (planId: string) => {
    setExpandedPlans(prev => {
      const newSet = new Set(prev);
      if (newSet.has(planId)) {
        newSet.delete(planId);
      } else {
        newSet.add(planId);
      }
      return newSet;
    });
  };

  const isExpanded = (planId: string) => expandedPlans.has(planId);

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

  return (
    <div className={cn('bg-white rounded-lg shadow-sm border border-gray-200', className)}>
      {/* Header */}
      <div className="flex items-center gap-2 p-4 border-b border-gray-200">
        <CreditCard className="w-5 h-5 text-blue-600" aria-hidden="true" />
        <h2 className="text-lg font-semibold text-gray-900">
          {language === 'bn' ? 'ইএমআই প্ল্যান নির্বাচন' : 'Select EMI Plan'}
        </h2>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-8" role="status" aria-live="polite">
          <div className="animate-spin rounded-full h-8 w-8 border-4 border-t-blue-600 border-t-transparent border-opacity-25" aria-hidden="true"></div>
          <p className="text-sm text-gray-600 mt-2">
            {language === 'bn' ? 'গণনা চলছে...' : 'Calculating...'}
          </p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4 m-4" role="alert">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-600" aria-hidden="true" />
            <p className="text-sm text-red-800">
              {language === 'bn' ? 'ত্রুটি' : 'Error'}
            </p>
          </div>
          <p className="text-sm text-red-700 mt-1">{error}</p>
        </div>
      )}

      {/* No Plans Available */}
      {!isLoading && !error && availablePlans.length === 0 && (
        <div className="bg-gray-50 border border-gray-200 rounded-md p-6 m-4">
          <div className="flex items-center gap-2">
            <Info className="w-5 h-5 text-blue-600" aria-hidden="true" />
            <p className="text-sm text-gray-700">
              {language === 'bn' ? 'কোনো ইএমআই প্ল্যান উপলব্ধ নেই' : 'No EMI plans available'}
            </p>
          </div>
        </div>
      )}

      {/* Available Plans */}
      {!isLoading && !error && groupedPlans.length > 0 && (
        <div className="space-y-4 p-4">
          {groupedPlans.map((group, index) => (
            <div key={index} className="border border-gray-200 rounded-lg overflow-hidden">
              {/* Provider Header */}
              <div className="bg-gray-50 p-3 border-b border-gray-200">
                <div className="flex items-center gap-3">
                  {group.provider.logoUrl && (
                    <img
                      src={group.provider.logoUrl}
                      alt={`${group.provider.name} logo`}
                      className="w-8 h-8 object-contain rounded"
                    />
                  )}
                  <div className="flex-1">
                    <h3 className="text-base font-semibold text-gray-900">
                      {group.provider.name}
                    </h3>
                  </div>
                </div>
              </div>

              {/* Plans */}
              <div className="divide-y divide-gray-100">
                {group.plans.map((plan: EmiPlan) => (
                  <div key={plan.id} className="border-b border-gray-100 last:border-b-0">
                    {/* Plan Summary */}
                    <button
                      onClick={() => handlePlanSelect(plan)}
                      className={cn(
                        'w-full text-left p-4 transition-all duration-200',
                        selectedPlanId === plan.id
                          ? 'bg-blue-50 border-l-4 border-l-blue-600'
                          : 'hover:bg-gray-50',
                        'focus:outline-none focus:ring-2 focus:ring-blue-500'
                      )}
                      aria-pressed={selectedPlanId === plan.id}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 flex-1">
                          {/* Radio Button */}
                          <div className={cn(
                            'w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0',
                            selectedPlanId === plan.id
                              ? 'border-blue-600 bg-blue-600'
                              : 'border-gray-300'
                          )}>
                            {selectedPlanId === plan.id && (
                              <Check className="w-3 h-3 text-white" aria-hidden="true" />
                            )}
                          </div>
                          
                          {/* Plan Info */}
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-gray-900">
                                {plan.name}
                              </span>
                              <span className="text-xs text-gray-500">
                                ({formatDuration(plan.duration)})
                              </span>
                            </div>
                            <div className="flex items-center gap-4 mt-1 text-sm">
                              <span className="text-gray-600">
                                {language === 'bn' ? 'সুদ:' : 'Interest:'} {plan.interestRate}%
                              </span>
                              <span className="text-gray-600">
                                {language === 'bn' ? 'মূল্য:' : 'Principal:'} {formatCurrency(plan.minAmount)} - {formatCurrency(plan.maxAmount)}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Expand/Collapse Button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleExpand(plan.id);
                          }}
                          className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
                          aria-label={isExpanded(plan.id) 
                            ? (language === 'bn' ? 'বিস্তারিত সংকুচিত করুন' : 'Collapse details')
                            : (language === 'bn' ? 'বিস্তারিত প্রসারিত করুন' : 'Expand details')
                          }
                          aria-expanded={isExpanded(plan.id)}
                        >
                          {isExpanded(plan.id) ? (
                            <ChevronUp className="w-4 h-4" aria-hidden="true" />
                          ) : (
                            <ChevronDown className="w-4 h-4" aria-hidden="true" />
                          )}
                        </button>
                      </div>
                    </button>

                    {/* Expanded Details */}
                    {isExpanded(plan.id) && (
                      <div className="px-4 pb-4 bg-gray-50">
                        <div className="border-t border-gray-200 pt-3 mt-3">
                          <h4 className="text-sm font-medium text-gray-900 mb-2">
                            {language === 'bn' ? 'প্ল্যান বিস্তালিং' : 'Plan Details'}
                          </h4>
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-gray-600">{language === 'bn' ? 'সময়কাল:' : 'Duration:'}</span>
                              <span className="font-medium">{plan.duration} {language === 'bn' ? 'মাস' : 'months'}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">{language === 'bn' ? 'সুদ হার:' : 'Interest Rate:'}</span>
                              <span className="font-medium">{plan.interestRate}%</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">{language === 'bn' ? 'সর্বনিম্ন:' : 'Minimum:'}</span>
                              <span className="font-medium">{formatCurrency(plan.minAmount)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">{language === 'bn' ? 'সর্বোচ্চ:' : 'Maximum:'}</span>
                              <span className="font-medium">{formatCurrency(plan.maxAmount)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">{language === 'bn' ? 'প্রসেসিং ফি:' : 'Processing Fee:'}</span>
                              <span className="font-medium">{formatCurrency(plan.processingFee)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">{language === 'bn' ? 'ডাউন পেমেন্ট:' : 'Down Payment:'}</span>
                              <span className="font-medium">{formatCurrency(plan.downPayment)}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Selected Plan Details */}
      {emiDetails && selectedPlanId && (
        <div className="p-4 bg-blue-50 border-t border-blue-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            {language === 'bn' ? 'নির্বাচিত প্ল্যান বিস্তালিং' : 'Selected Plan Details'}
          </h3>
          
          <div className="bg-white rounded-lg p-4 space-y-3">
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-sm text-gray-600">
                {language === 'bn' ? 'মাসিক ইএমআই' : 'Monthly EMI'}
              </span>
              <span className="text-lg font-semibold text-blue-600">
                {formatCurrency(emiDetails.emiAmount)}
              </span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-sm text-gray-600">
                {language === 'bn' ? 'মোট পরিমাণ' : 'Total Payable'}
              </span>
              <span className="text-lg font-semibold text-green-600">
                {formatCurrency(emiDetails.totalPayable)}
              </span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-sm text-gray-600">
                {language === 'bn' ? 'মোট সুদ' : 'Total Interest'}
              </span>
              <span className="text-sm font-semibold text-gray-900">
                {formatCurrency(emiDetails.totalInterest)}
              </span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-sm text-gray-600">
                {language === 'bn' ? 'প্রসেসিং ফি' : 'Processing Fee'}
              </span>
              <span className="text-sm font-semibold text-gray-900">
                {formatCurrency(emiDetails.processingFee)}
              </span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-sm text-gray-600">
                {language === 'bn' ? 'সময়কাল' : 'Duration'}
              </span>
              <span className="text-sm font-semibold text-gray-900">
                {emiDetails.duration} {language === 'bn' ? 'মাস' : 'months'}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmiSelector;
