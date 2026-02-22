'use client';

import React, { useState, useEffect } from 'react';
import { Calculator, Info, AlertCircle, X } from 'lucide-react';
import { EmiCalculatorProps, EmiPlan, EmiCalculationResult, EMI_CONSTANTS } from '@/types/emi';
import { calculateEmi, getAvailableEmiPlans } from '@/lib/api/emi';
import { cn } from '@/lib/utils';

/**
 * EmiCalculator Component
 * Interactive EMI calculator for users
 */
const EmiCalculator: React.FC<EmiCalculatorProps> = ({
  amount: initialAmount = EMI_CONSTANTS.MIN_AMOUNT,
  onCalculate,
  language = 'en',
  className
}) => {
  const [amount, setAmount] = useState<number>(initialAmount);
  const [availablePlans, setAvailablePlans] = useState<EmiPlan[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [calculationResult, setCalculationResult] = useState<EmiCalculationResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch available plans when amount changes
  useEffect(() => {
    const fetchPlans = async () => {
      if (amount < EMI_CONSTANTS.MIN_AMOUNT) {
        setAvailablePlans([]);
        setCalculationResult(null);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);
        
        const response = await getAvailableEmiPlans(amount);
        
        if (response.success && response.data && response.data.plans) {
          setAvailablePlans(response.data.plans);
        } else {
          setError('Failed to load EMI plans');
        }
      } catch (err) {
        console.error('[EmiCalculator] Error fetching plans:', err);
        setError('Failed to load EMI plans');
      } finally {
        setIsLoading(false);
      }
    };

    fetchPlans();
  }, [amount]);

  // Calculate EMI when plan is selected
  useEffect(() => {
    if (selectedPlanId) {
      const calculate = async () => {
        try {
          setIsLoading(true);
          setError(null);
          
          const response = await calculateEmi(amount, selectedPlanId);
          
          if (response.success && response.data) {
            if ('emiAmount' in response.data) {
              setCalculationResult(response.data as EmiCalculationResult);
              onCalculate?.(response.data as EmiCalculationResult);
            }
          }
        } catch (err) {
          console.error('[EmiCalculator] Error calculating EMI:', err);
          setError('Failed to calculate EMI');
        } finally {
          setIsLoading(false);
        }
      };

      calculate();
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

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    if (!isNaN(value) && value >= 0) {
      setAmount(value);
      setSelectedPlanId(null);
      setCalculationResult(null);
    }
  };

  const handlePlanSelect = (planId: string) => {
    setSelectedPlanId(planId);
  };

  const isEligible = amount >= EMI_CONSTANTS.MIN_AMOUNT && amount <= EMI_CONSTANTS.MAX_AMOUNT;

  return (
    <div className={cn('bg-white rounded-lg shadow-sm border border-gray-200', className)}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <Calculator className="w-5 h-5 text-blue-600" />
          <h2 className="text-lg font-semibold text-gray-900">
            {language === 'bn' ? 'ইএমআই ক্যালকরণ' : 'EMI Calculator'}
          </h2>
        </div>
      </div>

      {/* Amount Input */}
      <div className="p-4 border-b border-gray-200">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {language === 'bn' ? 'পরিমাণ' : 'Amount'}
        </label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
            ৳
          </span>
          <input
            type="number"
            value={amount}
            onChange={handleAmountChange}
            min={EMI_CONSTANTS.MIN_AMOUNT}
            max={EMI_CONSTANTS.MAX_AMOUNT}
            step={1000}
            className={cn(
              'w-full pl-8 pr-4 py-2 border rounded-lg',
              'focus:outline-none focus:ring-2 focus:ring-blue-500',
              isEligible ? 'border-gray-300' : 'border-red-300'
            )}
            placeholder={language === 'bn' ? 'পরিমাণ লিখুন' : 'Enter amount'}
          />
        </div>
        {!isEligible && (
          <p className="text-xs text-red-600 mt-1">
            {language === 'bn' 
              ? `পরিমাণ BDT ${EMI_CONSTANTS.MIN_AMOUNT.toLocaleString('en-BD')} - ${EMI_CONSTANTS.MAX_AMOUNT.toLocaleString('en-BD')} মধ্যে হতে হবে`
              : `Amount must be between BDT ${EMI_CONSTANTS.MIN_AMOUNT.toLocaleString('en-BD')} and ${EMI_CONSTANTS.MAX_AMOUNT.toLocaleString('en-BD')}`}
          </p>
        )}
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-4 border-t-blue-600 border-t-transparent border-opacity-25"></div>
          <p className="text-sm text-gray-600 mt-2">
            {language === 'bn' ? 'গণনা চলছে...' : 'Calculating...'}
          </p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <p className="text-sm text-red-800">
              {language === 'bn' ? 'ত্রুটি' : 'Error'}
            </p>
          </div>
          <p className="text-sm text-red-700 mt-1">{error}</p>
        </div>
      )}

      {/* No Plans Available */}
      {!isLoading && !error && availablePlans.length === 0 && isEligible && (
        <div className="bg-gray-50 border border-gray-200 rounded-md p-6 mb-4">
          <div className="flex items-center gap-2">
            <Info className="w-5 h-5 text-blue-600" />
            <p className="text-sm text-gray-700">
              {language === 'bn' ? 'কোনো ইএমআই প্ল্যান পাওয়া যায়নি' : 'No EMI plans available'}
            </p>
          </div>
        </div>
      )}

      {/* Available Plans */}
      {!isLoading && !error && availablePlans.length > 0 && (
        <div className="p-4 space-y-3">
          <h3 className="text-sm font-medium text-gray-700">
            {language === 'bn' ? 'উপলব্ধ প্ল্যান' : 'Available Plans'}
          </h3>
          <div className="space-y-2">
            {availablePlans.map((plan) => (
              <button
                key={plan.id}
                onClick={() => handlePlanSelect(plan.id)}
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
                    <div className="font-medium text-gray-900">
                      {plan.name}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {formatDuration(plan.duration)}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold text-gray-900">
                      {plan.interestRate}%
                    </div>
                    <div className="text-xs text-gray-500">
                      {language === 'bn' ? 'বার্ষ' : 'interest'}
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Calculation Result */}
      {calculationResult && (
        <div className="p-4 bg-blue-50 border-t border-blue-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              {language === 'bn' ? 'গণনা ফলাফল' : 'Calculation Result'}
            </h3>
            <button
              onClick={() => {
                setCalculationResult(null);
                setSelectedPlanId(null);
              }}
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="bg-white rounded-lg p-4 space-y-3">
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-sm text-gray-600">
                {language === 'bn' ? 'মূল্য' : 'Principal'}
              </span>
              <span className="text-lg font-semibold text-gray-900">
                {formatCurrency(calculationResult.principal)}
              </span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-sm text-gray-600">
                {language === 'bn' ? 'বার্ষ' : 'Interest'}
              </span>
              <span className="text-lg font-semibold text-gray-900">
                {formatCurrency(calculationResult.totalInterest)}
              </span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-sm text-gray-600">
                {language === 'bn' ? 'প্রসিং ফি' : 'Processing Fee'}
              </span>
              <span className="text-lg font-semibold text-gray-900">
                {formatCurrency(calculationResult.processingFee)}
              </span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-sm text-gray-600">
                {language === 'bn' ? 'মোট পরিমাণ' : 'Total Payable'}
              </span>
              <span className="text-lg font-semibold text-green-600">
                {formatCurrency(calculationResult.totalPayable)}
              </span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-sm text-gray-600">
                {language === 'bn' ? 'মাসিক' : 'Monthly EMI'}
              </span>
              <span className="text-lg font-semibold text-blue-600">
                {formatCurrency(calculationResult.emiAmount)}
              </span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-sm text-gray-600">
                {language === 'bn' ? 'সময়' : 'Duration'}
              </span>
              <span className="text-lg font-semibold text-gray-900">
                {calculationResult.duration} {language === 'bn' ? ' মাস' : ' months'}
              </span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-sm text-gray-600">
                {language === 'bn' ? 'বার্ষ' : 'Interest Rate'}
              </span>
              <span className="text-lg font-semibold text-gray-900">
                {calculationResult.interestRate}% {language === 'bn' ? 'বার্ষ' : 'per annum'}
              </span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-sm text-gray-600">
                {language === 'bn' ? 'মোট পরিমাণ' : 'Total Amount'}
              </span>
              <span className="text-lg font-semibold text-green-600">
                {formatCurrency(calculationResult.totalAmount)}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmiCalculator;
