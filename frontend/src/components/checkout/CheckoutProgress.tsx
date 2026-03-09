'use client';

import React from 'react';
import { CheckCircle, Circle, Lock, ChevronRight, UserPlus } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { CheckoutStep, CheckoutProgressProps } from '@/types/checkout';
import type { GuestCheckoutStep } from '@/types/guestCheckout';

/**
 * Checkout Progress Component
 *
 * Displays a visual progress indicator for 4-step checkout process (logged-in) or 5-step process (guest).
 * Features:
 * - Visual progress bar with step indicators
 * - Step labels with bilingual support
 * - Step completion indicators (checkmarks)
 * - Current step highlight
 * - Mobile-friendly responsive design
 * - Clickable steps (when allowed)
 * - Progress percentage display
 *
 * @example
 * ```tsx
 * <CheckoutProgress
 *   currentStep="shipping"
 *   completedSteps={['address']}
 *   onStepClick={(step) => console.log('Step clicked:', step)}
 *   language="en"
 *   clickable={true}
 * />
 * ```
 */

const CHECKOUT_STEPS: Array<{
  step: CheckoutStep;
  label: string;
  labelBn: string;
  icon: React.ReactNode;
}> = [
  {
    step: 'address',
    label: 'Address',
    labelBn: 'ঠিকানা',
    icon: <Lock className="w-5 h-5" />,
  },
  {
    step: 'shipping',
    label: 'Shipping',
    labelBn: 'শিপিং',
    icon: <Lock className="w-5 h-5" />,
  },
  {
    step: 'payment',
    label: 'Payment',
    labelBn: 'পেমেন্ট',
    icon: <Lock className="w-5 h-5" />,
  },
  {
    step: 'review',
    label: 'Review',
    labelBn: 'পর্যালোচনা',
    icon: <CheckCircle className="w-5 h-5" />,
  },
];

const GUEST_CHECKOUT_STEPS: Array<{
  step: GuestCheckoutStep;
  label: string;
  labelBn: string;
  icon: React.ReactNode;
}> = [
  {
    step: 'info',
    label: 'Info',
    labelBn: 'তথ্য',
    icon: <UserPlus className="w-5 h-5" />,
  },
  {
    step: 'address',
    label: 'Address',
    labelBn: 'ঠিকানা',
    icon: <Lock className="w-5 h-5" />,
  },
  {
    step: 'shipping',
    label: 'Shipping',
    labelBn: 'শিপিং',
    icon: <Lock className="w-5 h-5" />,
  },
  {
    step: 'payment',
    label: 'Payment',
    labelBn: 'পেমেন্ট',
    icon: <Lock className="w-5 h-5" />,
  },
  {
    step: 'review',
    label: 'Review',
    labelBn: 'পর্যালোচনা',
    icon: <CheckCircle className="w-5 h-5" />,
  },
];

interface ExtendedCheckoutProgressProps extends CheckoutProgressProps {
  isGuest?: boolean;
}

export const CheckoutProgress: React.FC<ExtendedCheckoutProgressProps> = ({
  currentStep,
  completedSteps,
  onStepClick,
  language = 'en',
  className = '',
  showLabels = true,
  showDescriptions = false,
  clickable = false,
  isGuest = false,
}) => {
  // Use guest checkout steps if isGuest is true, otherwise use logged-in checkout steps
  const stepsToUse = isGuest ? GUEST_CHECKOUT_STEPS : CHECKOUT_STEPS;
  const currentStepTyped = isGuest ? (currentStep as GuestCheckoutStep) : (currentStep as CheckoutStep);
  const completedStepsTyped = completedSteps as (CheckoutStep | GuestCheckoutStep)[];

  const getStepStatus = (step: CheckoutStep | GuestCheckoutStep): 'completed' | 'current' | 'pending' => {
    if (completedStepsTyped.includes(step)) return 'completed';
    if (step === currentStepTyped) return 'current';
    return 'pending';
  };

  const getStepIndex = (step: CheckoutStep | GuestCheckoutStep): number => {
    return stepsToUse.findIndex(s => s.step === step);
  };

  const canClickStep = (step: CheckoutStep | GuestCheckoutStep): boolean => {
    if (!clickable || !onStepClick) return false;
    
    const stepIndex = getStepIndex(step);
    const currentIndex = getStepIndex(currentStepTyped);
    
    // Can only click completed steps or current step
    return stepIndex <= currentIndex;
  };

  const handleStepClick = (step: CheckoutStep | GuestCheckoutStep) => {
    if (canClickStep(step) && onStepClick) {
      onStepClick(step as CheckoutStep);
    }
  };

  const currentStepIndex = getStepIndex(currentStepTyped);
  const progressPercentage = Math.round((currentStepIndex / (stepsToUse.length - 1)) * 100);

  return (
    <div className={cn('checkout-progress', className)}>
      {/* Progress Bar */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">
            {language === 'en' ? 'Checkout Progress' : 'চেকআউট অগ্রগতি'}
          </span>
          <span className="text-sm font-semibold text-blue-600">
            {progressPercentage}%
          </span>
        </div>
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-500 ease-out"
            style={{ width: `${progressPercentage}%` }}
            role="progressbar"
            aria-valuenow={progressPercentage}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`${language === 'en' ? 'Checkout progress' : 'চেকআউট অগ্রগতি'} ${progressPercentage}%`}
          />
        </div>
      </div>

      {/* Desktop Progress Steps */}
      <div className="hidden md:flex items-center justify-between">
        {stepsToUse.map((stepConfig, index) => {
          const status = getStepStatus(stepConfig.step);
          const isClickable = canClickStep(stepConfig.step);
          
          return (
            <React.Fragment key={stepConfig.step}>
              {/* Step Circle */}
              <div className="flex flex-col items-center flex-1">
                <button
                  type="button"
                  onClick={() => handleStepClick(stepConfig.step)}
                  disabled={!isClickable}
                  className={cn(
                    'relative flex items-center justify-center w-12 h-12 rounded-full transition-all duration-300',
                    status === 'completed' && 'bg-green-500 text-white',
                    status === 'current' && 'bg-blue-600 text-white ring-4 ring-blue-100',
                    status === 'pending' && 'bg-gray-200 text-gray-500',
                    isClickable && 'cursor-pointer hover:scale-105',
                    !isClickable && 'cursor-default'
                  )}
                  aria-label={`${language === 'en' ? 'Step' : 'ধাপ'} ${index + 1}: ${language === 'en' ? stepConfig.label : stepConfig.labelBn}`}
                  aria-current={status === 'current' ? 'step' : undefined}
                >
                  {status === 'completed' ? (
                    <CheckCircle className="w-6 h-6" />
                  ) : status === 'current' ? (
                    <span className="text-lg font-semibold">{index + 1}</span>
                  ) : (
                    <Circle className="w-6 h-6" />
                  )}
                </button>

                {/* Step Label */}
                {showLabels && (
                  <div className="mt-2 text-center">
                    <span
                      className={cn(
                        'text-sm font-medium transition-colors',
                        status === 'completed' && 'text-green-600',
                        status === 'current' && 'text-blue-600',
                        status === 'pending' && 'text-gray-500'
                      )}
                    >
                      {language === 'en' ? stepConfig.label : stepConfig.labelBn}
                    </span>
                  </div>
                )}

                {/* Step Description */}
                {showDescriptions && (
                  <div className="mt-1 text-center">
                    <span className="text-xs text-gray-500">
                      {status === 'completed' && (language === 'en' ? 'Completed' : 'সম্পন্ন')}
                      {status === 'current' && (language === 'en' ? 'In Progress' : 'চলমান')}
                      {status === 'pending' && (language === 'en' ? 'Pending' : 'মুলতুবি')}
                    </span>
                  </div>
                )}
              </div>

              {/* Connector Line */}
              {index < stepsToUse.length - 1 && (
                <div className="flex-1 h-0.5 mx-2">
                  <div
                    className={cn(
                      'h-full transition-all duration-500 ease-out',
                      status === 'completed' || (index < currentStepIndex) ? 'bg-green-500' : 'bg-gray-300'
                    )}
                  />
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Mobile Progress Steps */}
      <div className="md:hidden">
        {/* Compact Progress Bar */}
        <div className="flex items-center gap-2 mb-4">
          {stepsToUse.map((stepConfig, index) => {
            const status = getStepStatus(stepConfig.step);
            const isClickable = canClickStep(stepConfig.step);
            
            return (
              <React.Fragment key={stepConfig.step}>
                <button
                  type="button"
                  onClick={() => handleStepClick(stepConfig.step)}
                  disabled={!isClickable}
                  className={cn(
                    'flex items-center justify-center w-8 h-8 rounded-full transition-all duration-300',
                    status === 'completed' && 'bg-green-500 text-white',
                    status === 'current' && 'bg-blue-600 text-white',
                    status === 'pending' && 'bg-gray-200 text-gray-500',
                    isClickable && 'cursor-pointer',
                    !isClickable && 'cursor-default'
                  )}
                  aria-label={`${language === 'en' ? 'Step' : 'ধাপ'} ${index + 1}: ${language === 'en' ? stepConfig.label : stepConfig.labelBn}`}
                >
                  {status === 'completed' ? (
                    <CheckCircle className="w-4 h-4" />
                  ) : (
                    <span className="text-sm font-semibold">{index + 1}</span>
                  )}
                </button>

                {index < stepsToUse.length - 1 && (
                  <div
                    className={cn(
                      'flex-1 h-0.5 transition-all duration-500 ease-out',
                      status === 'completed' || (index < currentStepIndex) ? 'bg-green-500' : 'bg-gray-300'
                    )}
                  />
                )}
              </React.Fragment>
            );
          })}
        </div>

        {/* Current Step Label */}
        <div className="text-center">
          <span className="text-sm font-medium text-gray-700">
            {language === 'en' ? 'Current Step' : 'বর্তমান ধাপ'}:
          </span>
          <span className="ml-2 text-sm font-semibold text-blue-600">
            {language === 'en' ? stepsToUse[currentStepIndex].label : stepsToUse[currentStepIndex].labelBn}
          </span>
        </div>

        {/* Step Navigation Buttons */}
        {clickable && onStepClick && (
          <div className="flex items-center justify-between mt-4">
            {currentStepIndex > 0 && (
              <button
                type="button"
                onClick={() => handleStepClick(stepsToUse[currentStepIndex - 1].step)}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
              >
                <ChevronRight className="w-4 h-4 rotate-180" />
                <span>{language === 'en' ? 'Previous' : 'আগে'}</span>
              </button>
            )}

            {currentStepIndex < stepsToUse.length - 1 && (
              <button
                type="button"
                onClick={() => handleStepClick(stepsToUse[currentStepIndex + 1].step)}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors ml-auto"
              >
                <span>{language === 'en' ? 'Next' : 'পরবর্তী'}</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default CheckoutProgress;
