'use client';

import React, { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { CheckoutStep, CheckoutValidationError, CheckoutStepContainerProps } from '@/types/checkout';

/**
 * Checkout Step Container Component
 *
 * Provides a consistent container for each checkout step with:
 * - Step transition animations
 * - Validation indicators
 * - Error display
 * - Mobile-optimized layout
 * - Navigation buttons
 * - Loading states
 *
 * @example
 * ```tsx
 * <CheckoutStepContainer
 *   step="address"
 *   isActive={true}
 *   isCompleted={false}
 *   isValid={true}
 *   errors={[]}
 *   onBack={() => console.log('Back')}
 *   onNext={() => console.log('Next')}
 *   language="en"
 * >
 *   <AddressForm />
 * </CheckoutStepContainer>
 * ```
 */

const STEP_TITLES: Record<CheckoutStep, { en: string; bn: string }> = {
  address: { en: 'Address', bn: 'ঠিকানা' },
  shipping: { en: 'Shipping', bn: 'শিপিং' },
  payment: { en: 'Payment', bn: 'পেমেন্ট' },
  review: { en: 'Review', bn: 'পর্যালোচনা' },
};

const STEP_DESCRIPTIONS: Record<CheckoutStep, { en: string; bn: string }> = {
  address: {
    en: 'Enter your shipping and billing address',
    bn: 'আপনার শিপিং এবং বিলিং ঠিকানা লিখুন',
  },
  shipping: {
    en: 'Select your preferred shipping method',
    bn: 'আপনার পছন্দের শিপিং পদ্ধতি নির্বাচন করুন',
  },
  payment: {
    en: 'Choose your payment method and enter details',
    bn: 'আপনার পেমেন্ট পদ্ধতি নির্বাচন করুন এবং বিস্তারিত লিখুন',
  },
  review: {
    en: 'Review your order before placing it',
    bn: 'অর্ডার করার আগে আপনার অর্ডার পর্যালোচনা করুন',
  },
};

export const CheckoutStepContainer: React.FC<CheckoutStepContainerProps> = ({
  step,
  isActive,
  isCompleted,
  isValid,
  errors,
  onBack,
  onNext,
  onSubmit,
  language = 'en',
  className = '',
  children,
}) => {
  const [isAnimating, setIsAnimating] = useState(false);
  const [showErrors, setShowErrors] = useState(false);

  // Trigger animation when step becomes active
  useEffect(() => {
    if (isActive) {
      setIsAnimating(true);
      const timer = setTimeout(() => setIsAnimating(false), 300);
      return () => clearTimeout(timer);
    }
  }, [isActive]);

  // Show errors when errors prop changes
  useEffect(() => {
    if (errors.length > 0) {
      setShowErrors(true);
      // Scroll to first error
      const firstError = document.querySelector('[data-error="true"]');
      if (firstError) {
        firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [errors]);

  const hasErrors = errors.length > 0;
  const hasCriticalErrors = errors.some(e => e.severity === 'error');
  const hasWarnings = errors.some(e => e.severity === 'warning');

  const stepTitle = STEP_TITLES[step][language];
  const stepDescription = STEP_DESCRIPTIONS[step][language];

  const handleNext = () => {
    if (onNext) {
      onNext();
    }
  };

  const handleBack = () => {
    if (onBack) {
      onBack();
    }
  };

  const handleSubmit = () => {
    if (onSubmit) {
      onSubmit();
    }
  };

  return (
    <div
      className={cn(
        'checkout-step-container',
        'bg-white rounded-lg shadow-sm border border-gray-200',
        'transition-all duration-300 ease-in-out',
        isActive ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none',
        isAnimating && 'animate-in fade-in slide-in-from-bottom-4',
        className
      )}
      role="region"
      aria-labelledby={`step-title-${step}`}
      aria-hidden={!isActive}
    >
      {/* Step Header */}
      <div className="border-b border-gray-200 p-6">
        <div className="flex items-start gap-4">
          {/* Status Icon */}
          <div
            className={cn(
              'flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center',
              isCompleted && 'bg-green-100',
              isActive && !isCompleted && 'bg-blue-100',
              !isActive && !isCompleted && 'bg-gray-100'
            )}
          >
            {isCompleted ? (
              <CheckCircle className="w-6 h-6 text-green-600" />
            ) : hasCriticalErrors ? (
              <AlertCircle className="w-6 h-6 text-red-600" />
            ) : hasWarnings ? (
              <AlertCircle className="w-6 h-6 text-yellow-600" />
            ) : (
              <div className="w-3 h-3 rounded-full bg-blue-600" />
            )}
          </div>

          {/* Step Title and Description */}
          <div className="flex-1">
            <h2
              id={`step-title-${step}`}
              className="text-xl font-semibold text-gray-900"
            >
              {stepTitle}
            </h2>
            <p className="text-sm text-gray-600 mt-1">{stepDescription}</p>
          </div>

          {/* Validation Status Badge */}
          {isActive && (
            <div
              className={cn(
                'flex-shrink-0 px-3 py-1 rounded-full text-xs font-medium',
                isValid && 'bg-green-100 text-green-800',
                !isValid && hasCriticalErrors && 'bg-red-100 text-red-800',
                !isValid && hasWarnings && 'bg-yellow-100 text-yellow-800'
              )}
            >
              {isValid
                ? (language === 'en' ? 'Valid' : 'বৈধ')
                : hasCriticalErrors
                ? (language === 'en' ? 'Errors' : 'ত্রুটি')
                : (language === 'en' ? 'Warnings' : 'সতর্কতা')}
            </div>
          )}
        </div>
      </div>

      {/* Errors Display */}
      {showErrors && hasErrors && (
        <div
          className={cn(
            'border-b border-gray-200 p-4',
            hasCriticalErrors && 'bg-red-50 border-red-200',
            !hasCriticalErrors && hasWarnings && 'bg-yellow-50 border-yellow-200'
          )}
          role="alert"
          aria-live="polite"
        >
          <div className="flex items-start gap-3">
            <AlertCircle
              className={cn(
                'w-5 h-5 flex-shrink-0 mt-0.5',
                hasCriticalErrors && 'text-red-600',
                !hasCriticalErrors && hasWarnings && 'text-yellow-600'
              )}
            />
            <div className="flex-1">
              <h3
                className={cn(
                  'text-sm font-semibold',
                  hasCriticalErrors && 'text-red-800',
                  !hasCriticalErrors && hasWarnings && 'text-yellow-800'
                )}
              >
                {hasCriticalErrors
                  ? (language === 'en' ? 'Please fix the following errors' : 'অনুগ্রহ করে নিচের ত্রুটিগুলি সংশোধন করুন')
                  : (language === 'en' ? 'Please review the following warnings' : 'অনুগ্রহ করে নিচের সতর্কতাগুলি পর্যালোচনা করুন')}
              </h3>
              <ul className="mt-2 space-y-1">
                {errors.map((error, index) => (
                  <li
                    key={index}
                    className={cn(
                      'text-sm',
                      hasCriticalErrors && 'text-red-700',
                      !hasCriticalErrors && hasWarnings && 'text-yellow-700'
                    )}
                  >
                    • {language === 'en' ? error.message : error.messageBn}
                  </li>
                ))}
              </ul>
            </div>
            <button
              type="button"
              onClick={() => setShowErrors(false)}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              aria-label={language === 'en' ? 'Dismiss' : 'বাতিল'}
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Step Content */}
      <div className="p-6">
        {children}
      </div>

      {/* Navigation Buttons */}
      <div className="border-t border-gray-200 p-6">
        <div className="flex items-center justify-between gap-4">
          {/* Back Button */}
          {onBack && (
            <button
              type="button"
              onClick={handleBack}
              className={cn(
                'flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all duration-200',
                'border border-gray-300 text-gray-700',
                'hover:bg-gray-50 hover:border-gray-400',
                'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
                'active:scale-95'
              )}
              aria-label={language === 'en' ? 'Go to previous step' : 'আগের ধাপে যান'}
            >
              <ChevronLeft className="w-5 h-5" />
              <span className="hidden sm:inline">
                {language === 'en' ? 'Back' : 'আগে'}
              </span>
            </button>
          )}

          {/* Spacer */}
          <div className="flex-1" />

          {/* Next/Submit Button */}
          {onNext && !onSubmit && (
            <button
              type="button"
              onClick={handleNext}
              disabled={!isValid || hasCriticalErrors}
              className={cn(
                'flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all duration-200',
                'bg-blue-600 text-white',
                'hover:bg-blue-700',
                'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
                'disabled:opacity-50 disabled:cursor-not-allowed',
                'active:scale-95'
              )}
              aria-label={language === 'en' ? 'Continue to next step' : 'পরবর্তী ধাপে চালিয়ে যান'}
            >
              <span className="hidden sm:inline">
                {language === 'en' ? 'Continue' : 'চালিয়ে যান'}
              </span>
              <ChevronRight className="w-5 h-5" />
            </button>
          )}

          {onSubmit && (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!isValid || hasCriticalErrors}
              className={cn(
                'flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all duration-200',
                'bg-green-600 text-white',
                'hover:bg-green-700',
                'focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2',
                'disabled:opacity-50 disabled:cursor-not-allowed',
                'active:scale-95'
              )}
              aria-label={language === 'en' ? 'Submit order' : 'অর্ডার জমা দিন'}
            >
              {step === 'review' ? (
                <>
                  <span className="hidden sm:inline">
                    {language === 'en' ? 'Place Order' : 'অর্ডার করুন'}
                  </span>
                  <CheckCircle className="w-5 h-5" />
                </>
              ) : (
                <>
                  <span className="hidden sm:inline">
                    {language === 'en' ? 'Continue' : 'চালিয়ে যান'}
                  </span>
                  <ChevronRight className="w-5 h-5" />
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default CheckoutStepContainer;
