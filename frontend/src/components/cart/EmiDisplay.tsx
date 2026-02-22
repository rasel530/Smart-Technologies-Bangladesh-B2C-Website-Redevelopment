'use client';

import React, { useState, useEffect } from 'react';
import { Calculator, Info, AlertCircle, X } from 'lucide-react';
import { EmiDisplayProps, EmiPlan, EmiDetails, EMI_CONSTANTS } from '@/types/emi';
import { calculateEmi, getAvailableEmiPlans } from '@/lib/api/emi';
import { cn } from '@/lib/utils';

/**
 * EmiDisplay Component
 * Displays EMI options available for a given cart amount
 * This is a user-facing component for the cart/checkout area
 */
const EmiDisplay: React.FC<EmiDisplayProps> = ({
  amount,
  onPlanSelect,
  language = 'en',
  className,
  showCalculator = true
}) => {
  const [availablePlans, setAvailablePlans] = useState<EmiPlan[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [emiDetails, setEmiDetails] = useState<EmiDetails | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch available EMI plans on mount
  useEffect(() => {
    const fetchAvailablePlans = async () => {
      try {
        console.log('[EmiDisplay] Fetching EMI plans for amount:', amount);
        setIsLoading(true);
        setError(null);
        
        // Check if amount is eligible for EMI
        if (amount < EMI_CONSTANTS.MIN_AMOUNT) {
          console.log('[EmiDisplay] Amount below minimum (', EMI_CONSTANTS.MIN_AMOUNT, '), skipping EMI fetch');
          return;
        }
        
        // Get available plans for the amount
        const response = await getAvailableEmiPlans(amount);
        
        console.log('[EmiDisplay] EMI API response:', JSON.stringify(response, null, 2));
        
        if (response.success && response.data && response.data.plans) {
          console.log('[EmiDisplay] EMI plans loaded successfully, count:', response.data.plans.length);
          setAvailablePlans(response.data.plans);
        } else {
          console.error('[EmiDisplay] Invalid EMI API response:', response);
          setError('Failed to load EMI options');
        }
      } catch (err) {
        console.error('[EmiDisplay] Error fetching EMI plans:', err);
        setError('Failed to load EMI options');
      } finally {
        setIsLoading(false);
      }
    };

    fetchAvailablePlans();
  }, [amount]);

  // Handle plan selection
  const handlePlanSelect = async (planId: string, plan: EmiPlan) => {
    try {
      setSelectedPlanId(planId);
      
      // Calculate EMI details for selected plan
      const response = await calculateEmi(amount, planId);
      
      if (response.success && response.data) {
        // Check if response.data is EmiDetails
        if ('planId' in response.data) {
          setEmiDetails(response.data as EmiDetails);
          onPlanSelect?.(planId, response.data as EmiDetails);
        }
      }
    } catch (err) {
      console.error('[EmiDisplay] Error calculating EMI:', err);
      setError('Failed to calculate EMI');
    }
  };

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
          <Calculator className="w-5 h-5 text-blue-600" aria-hidden="true" />
          <h2 className="text-lg font-semibold text-gray-900">
            {language === 'bn' ? 'ইএমআই অপশন' : 'EMI Options'}
          </h2>
        </div>
        {showCalculator && (
          <button
            onClick={() => {/* TODO: Open calculator modal */}}
            className="text-sm text-blue-600 hover:text-blue-700 transition-colors"
            aria-label={language === 'bn' ? 'ইএমআই ক্যালকরণ খুলুন' : 'Open EMI Calculator'}
          >
            {language === 'bn' ? 'ক্যালকরণ' : 'Calculator'}
          </button>
        )}
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-8" role="status" aria-live="polite">
          <div className="animate-spin rounded-full h-8 w-8 border-4 border-t-blue-600 border-t-transparent border-opacity-25" aria-hidden="true"></div>
          <p className="text-sm text-gray-600 mt-2">
            {language === 'bn' ? 'লোড আপশন...' : 'Loading EMI options...'}
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

      {/* No EMI Available */}
      {!isLoading && !error && availablePlans.length === 0 && (
        <div className="bg-gray-50 border border-gray-200 rounded-md p-6 m-4">
          <div className="flex items-center gap-3 mb-4">
            <Info className="w-8 h-8 text-blue-600" aria-hidden="true" />
            <div>
              <p className="text-sm text-gray-700 mb-2">
                {language === 'bn' 
                  ? `আপনার পরিমাণ BDT ${formatCurrency(amount)}-এর নিচ ইএমআই অপশন।`
                  : `No EMI options available for orders under BDT ${formatCurrency(amount)}.`
                }
              </p>
              <p className="text-xs text-gray-500">
                {language === 'bn' 
                  ? `ইএমআই সুবিধার BDT ${EMI_CONSTANTS.MIN_AMOUNT.toLocaleString('en-BD')} বা বেশি থেকে ইএমআই প্ল্যান পাওয়।`
                  : `EMI is available for orders of BDT ${EMI_CONSTANTS.MIN_AMOUNT.toLocaleString('en-BD')} and above.`}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* EMI Options */}
      {!isLoading && !error && availablePlans.length > 0 && (
        <div className="space-y-4 p-4">
          {availablePlans.reduce((acc: any[], plan: EmiPlan) => {
            const provider = plan.provider;
            if (!acc.find((p: any) => p.provider.id === provider.id)) {
              acc.push({
                provider,
                plans: []
              });
            }
            acc.find((p: any) => p.provider.id === provider.id)?.plans.push(plan);
            return acc;
          }, []).map((group, index) => (
            <div key={index} className="border border-gray-200 rounded-lg p-4">
              {/* Provider Header */}
              <div className="flex items-center gap-3 mb-3">
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
                  {group.provider.website && (
                    <a
                      href={group.provider.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-blue-600 hover:underline"
                      aria-label={`Visit ${group.provider.name} website`}
                    >
                      {language === 'bn' ? 'ওয়েবসাইট' : 'Visit Website'}
                    </a>
                  )}
                </div>
              </div>

              {/* Plans */}
              <div className="space-y-2">
                {group.plans.map((plan: EmiPlan) => (
                  <button
                    key={plan.id}
                    onClick={() => handlePlanSelect(plan.id, plan)}
                    className={cn(
                      'w-full text-left p-3 rounded-lg border transition-all duration-200',
                      selectedPlanId === plan.id
                        ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-500'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50',
                      'cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500'
                    )}
                    aria-pressed={selectedPlanId === plan.id}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">
                          {plan.name}
                        </div>
                        <div className="text-xs text-gray-500">
                          {formatDuration(plan.duration)}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-semibold text-gray-900">
                          {plan.interestRate}% {language === 'bn' ? 'বার্ষ' : 'interest'}
                        </div>
                        <div className="text-xs text-gray-500">
                          {language === 'bn' ? 'বার্ষ' : 'per annum'}
                        </div>
                      </div>
                    </div>
                    <div className="mt-2 text-sm text-gray-600">
                      {language === 'bn' 
                        ? `মূল্য ${formatCurrency(plan.minAmount)} - ${formatCurrency(plan.maxAmount)}`
                        : `Principal: ${formatCurrency(plan.minAmount)} - ${formatCurrency(plan.maxAmount)}`}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* EMI Details */}
      {emiDetails && (
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg m-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              {language === 'bn' ? 'ইএমআই বিস্তালিং' : 'EMI Details'}
            </h3>
            <button
              onClick={() => setEmiDetails(null)}
              className="text-gray-500 hover:text-gray-700"
              aria-label={language === 'bn' ? 'বিস্তালিং বন্ধ করুন' : 'Close details'}
            >
              <X className="w-5 h-5" aria-hidden="true" />
            </button>
          </div>

          <div className="space-y-4">
            {/* Plan Info */}
            <div className="flex items-center gap-3 mb-4">
              {emiDetails.provider.logoUrl && (
                <img
                  src={emiDetails.provider.logoUrl}
                  alt={`${emiDetails.provider.name} logo`}
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
              </div>
            </div>

            {/* EMI Breakdown */}
            <div className="bg-white rounded-lg p-4 space-y-3">
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-sm text-gray-600">
                  {language === 'bn' ? 'মূল্য' : 'Principal'}
                </span>
                <span className="text-lg font-semibold text-gray-900">
                  {formatCurrency(emiDetails.principal)}
                </span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-sm text-gray-600">
                  {language === 'bn' ? 'বার্ষ' : 'Interest'}
                </span>
                <span className="text-lg font-semibold text-gray-900">
                  {emiDetails.totalInterest.toLocaleString('en-BD', { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-sm text-gray-600">
                  {language === 'bn' ? 'প্রসিং ফি' : 'Processing Fee'}
                </span>
                <span className="text-lg font-semibold text-gray-900">
                  {emiDetails.processingFee > 0 ? `+${formatCurrency(emiDetails.processingFee)}` : formatCurrency(emiDetails.processingFee)}
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
                  {language === 'bn' ? 'মাসিক' : 'Monthly EMI'}
                </span>
                <span className="text-lg font-semibold text-blue-600">
                  {formatCurrency(emiDetails.emiAmount)}
                </span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-sm text-gray-600">
                  {language === 'bn' ? 'সময়' : 'Duration'}
                </span>
                <span className="text-lg font-semibold text-gray-900">
                  {emiDetails.duration} {language === 'bn' ? ' মাস' : ' months'}
                </span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-sm text-gray-600">
                  {language === 'bn' ? 'বার্ষ' : 'Interest Rate'}
                </span>
                <span className="text-lg font-semibold text-gray-900">
                  {emiDetails.interestRate}% {language === 'bn' ? 'বার্ষ' : 'per annum'}
                </span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-sm text-gray-600">
                  {language === 'bn' ? 'মোট পরিমাণ' : 'Total Amount'}
                </span>
                <span className="text-lg font-semibold text-green-600">
                  {formatCurrency(emiDetails.totalAmount)}
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setEmiDetails(null)}
                className="flex-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500"
              >
                {language === 'bn' ? 'বাতিল' : 'Cancel'}
              </button>
              <button
                onClick={() => {/* TODO: Proceed to checkout with selected EMI */}
                }
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {language === 'bn' ? 'এগির সাথে চাল' : 'Proceed with EMI'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmiDisplay;
