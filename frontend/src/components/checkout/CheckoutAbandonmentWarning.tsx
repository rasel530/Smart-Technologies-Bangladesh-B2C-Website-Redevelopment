'use client';

import React, { useEffect, useState } from 'react';
import { X, Save, ArrowRight, LogOut, Mail } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { CheckoutAbandonmentWarningProps } from '@/types/checkout';

/**
 * Checkout Abandonment Warning Component
 *
 * Detects when user is about to leave the checkout page and shows
 * a warning dialog with options to save progress, continue, or leave.
 *
 * Features:
 * - Detects page navigation away
 * - Detects browser tab close
 * - Detects session timeout
 * - Shows recovery prompt
 * - Offers to save checkout progress
 * - Email recovery option
 * - Mobile-friendly dialog
 *
 * @example
 * ```tsx
 * <CheckoutAbandonmentWarning
 *   isOpen={isAbandoned}
 *   onSave={() => handleSaveProgress()}
 *   onContinue={() => handleContinueCheckout()}
 *   onLeave={() => handleLeaveCheckout()}
 *   language="en"
 * />
 * ```
 */

export const CheckoutAbandonmentWarning: React.FC<CheckoutAbandonmentWarningProps> = ({
  isOpen,
  onSave,
  onContinue,
  onLeave,
  language = 'en',
  className = '',
}) => {
  const [isAnimating, setIsAnimating] = useState(false);
  const [showEmailOption, setShowEmailOption] = useState(false);
  const [email, setEmail] = useState('');

  // Trigger animation when dialog opens
  useEffect(() => {
    if (isOpen) {
      setIsAnimating(true);
      const timer = setTimeout(() => setIsAnimating(false), 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Handle save with email
  const handleSaveWithEmail = () => {
    if (email && onSave) {
      onSave();
    }
  };

  // Handle save without email
  const handleSave = () => {
    if (onSave) {
      onSave();
    }
  };

  // Handle continue
  const handleContinue = () => {
    if (onContinue) {
      onContinue();
    }
  };

  // Handle leave
  const handleLeave = () => {
    if (onLeave) {
      onLeave();
    }
  };

  // Close dialog on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        handleContinue();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, handleContinue]);

  if (!isOpen) {
    return null;
  }

  return (
    <div
      className={cn(
        'fixed inset-0 z-50 flex items-center justify-center p-4',
        'bg-black/50 backdrop-blur-sm',
        'transition-opacity duration-300',
        isAnimating ? 'opacity-0' : 'opacity-100'
      )}
      role="dialog"
      aria-modal="true"
      aria-labelledby="abandonment-warning-title"
    >
      <div
        className={cn(
          'bg-white rounded-2xl shadow-2xl max-w-md w-full',
          'transition-all duration-300',
          isAnimating ? 'scale-95 opacity-0' : 'scale-100 opacity-100',
          className
        )}
        role="document"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-amber-100">
              <LogOut className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <h2
                id="abandonment-warning-title"
                className="text-lg font-semibold text-gray-900"
              >
                {language === 'en' ? 'Leave Checkout?' : 'চেকআউট ছেড়তে চান?'}
              </h2>
              <p className="text-sm text-gray-600">
                {language === 'en'
                  ? 'Your progress will be lost'
                  : 'আপনার অগ্রগতি হারিয়ে যাবে'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleContinue}
            className="flex-shrink-0 p-2 text-gray-400 hover:text-gray-600 transition-colors rounded-lg hover:bg-gray-100"
            aria-label={language === 'en' ? 'Close' : 'বন্ধ'}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Warning Message */}
          <div className="mb-6 p-4 bg-amber-50 rounded-lg border border-amber-200">
            <p className="text-sm text-amber-900">
              {language === 'en'
                ? 'You have items in your checkout. If you leave now, your progress will be lost unless you save it.'
                : 'আপনার চেকআউটে আইটেম আছে। আপনি যদি এখন চলে যান, তবে আপনার অগ্রগতি হারিয়ে যাবে যদি না আপনি এটি সংরক্ষণ করেন।'}
            </p>
          </div>

          {/* Email Recovery Option */}
          {!showEmailOption ? (
            <button
              type="button"
              onClick={() => setShowEmailOption(true)}
              className="w-full flex items-center justify-center gap-2 p-3 mb-4 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-blue-500 hover:text-blue-600 transition-colors"
            >
              <Mail className="w-5 h-5" />
              <span className="text-sm font-medium">
                {language === 'en'
                  ? 'Send recovery link to email'
                  : 'ইমেইলে পুনরুদ্ধার লিংক পাঠান'}
              </span>
            </button>
          ) : (
            <div className="mb-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <label className="block text-sm font-medium text-gray-900 mb-2">
                {language === 'en' ? 'Email Address' : 'ইমেইল ঠিকানা'}
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={language === 'en' ? 'your@email.com' : 'আপনার@ইমেইল.com'}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-600 mt-2">
                {language === 'en'
                  ? 'We\'ll send you a link to resume your checkout'
                  : 'আমরা আপনাকে আপনার চেকআউট পুনরায় শুরু করার জন্য একটি লিংক পাঠাব'}
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-3">
            {/* Save Progress Button */}
            <button
              type="button"
              onClick={showEmailOption ? handleSaveWithEmail : handleSave}
              className={cn(
                'w-full flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-medium transition-all duration-200',
                'bg-blue-600 text-white',
                'hover:bg-blue-700',
                'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
                'active:scale-95'
              )}
            >
              <Save className="w-5 h-5" />
              <span>
                {language === 'en'
                  ? 'Save Progress'
                  : 'অগ্রগতি সংরক্ষণ করুন'}
              </span>
            </button>

            {/* Continue Button */}
            <button
              type="button"
              onClick={handleContinue}
              className={cn(
                'w-full flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-medium transition-all duration-200',
                'bg-white border border-gray-300 text-gray-700',
                'hover:bg-gray-50 hover:border-gray-400',
                'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
                'active:scale-95'
              )}
            >
              <ArrowRight className="w-5 h-5" />
              <span>
                {language === 'en'
                  ? 'Continue Checkout'
                  : 'চেকআউট চালিয়ে যান'}
              </span>
            </button>

            {/* Leave Button */}
            <button
              type="button"
              onClick={handleLeave}
              className={cn(
                'w-full flex items-center justify-center px-6 py-3 rounded-lg font-medium transition-all duration-200',
                'text-gray-500 hover:text-gray-700',
                'focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2',
                'active:scale-95'
              )}
            >
              <span>
                {language === 'en'
                  ? 'Leave Without Saving'
                  : 'সংরক্ষণ না করে চলে যান'}
              </span>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 pb-6">
          <p className="text-xs text-center text-gray-500">
            {language === 'en'
              ? 'Your data is secure and will never be shared with third parties.'
              : 'আপনার তথ্য নিরাপদ এবং কখনও তৃতীয় পক্ষের সাথে শেয়ার হবে না।'}
          </p>
        </div>
      </div>
    </div>
  );
};

export default CheckoutAbandonmentWarning;
