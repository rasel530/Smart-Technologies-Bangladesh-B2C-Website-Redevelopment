/**
 * OrderCancellationRequest Component
 * 
 * Modal/dialog for requesting order cancellation with cancellation type and reason.
 */

'use client';

import React, { useState } from 'react';
import { CancellationType, CreateCancellationRequest } from '@/lib/api/orderManagement';
import { useOrderManagement } from '@/hooks/useOrderManagement';

interface OrderCancellationRequestProps {
  orderId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  language?: 'en' | 'bn';
  orderStatus?: string;
  orderTotal?: number;
}

const OrderCancellationRequest: React.FC<OrderCancellationRequestProps> = ({
  orderId,
  isOpen,
  onClose,
  onSuccess,
  language = 'en',
  orderStatus,
  orderTotal,
}) => {
  const { requestCancellation, isLoading, error, clearError } = useOrderManagement();

  const [cancellationType, setCancellationType] = useState<CancellationType>('customer_request');
  const [reason, setReason] = useState('');
  const [refundPreference, setRefundPreference] = useState<'original' | 'wallet'>('original');
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [acknowledged, setAcknowledged] = useState(false);

  const resetForm = () => {
    setCancellationType('customer_request');
    setReason('');
    setRefundPreference('original');
    setValidationErrors({});
    setAcknowledged(false);
    clearError();
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!reason.trim()) {
      errors.reason = language === 'bn' ? 'কারণ প্রদান করা আবশ্যক' : 'Reason is required';
    }

    if (reason.length < 10) {
      errors.reason = language === 'bn' ? 'কারণ অবশ্যই কমপক্ষে ১০ অক্ষরের হতে হবে' : 'Reason must be at least 10 characters';
    }

    if (!acknowledged) {
      errors.acknowledged = language === 'bn' ? 'অনুগ্রহ করে বাতিলকরণ নীতি স্বীকার করুন' : 'Please acknowledge the cancellation policy';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    const requestData: CreateCancellationRequest = {
      type: cancellationType,
      reason,
    };

    const result = await requestCancellation(orderId, requestData);

    if (result) {
      handleClose();
      onSuccess?.();
    }
  };

  const cancellationTypeLabels: Record<CancellationType, { en: string; bn: string; description: { en: string; bn: string } }> = {
    customer_request: {
      en: 'Customer Request',
      bn: 'গ্রাহকের অনুরোধ',
      description: {
        en: 'I no longer want this order',
        bn: 'আমি এই অর্ডারটি আর চাই না'
      }
    },
    fraud: {
      en: 'Fraudulent Order',
      bn: 'প্রতারণামূলক অর্ডার',
      description: {
        en: 'This order was placed fraudulently',
        bn: 'এই অর্ডারটি প্রতারণামূলকভাবে করা হয়েছে'
      }
    },
    out_of_stock: {
      en: 'Out of Stock',
      bn: 'স্টক নেই',
      description: {
        en: 'Items are out of stock',
        bn: 'আইটেমগুলি স্টকে নেই'
      }
    },
    payment_failed: {
      en: 'Payment Failed',
      bn: 'পেমেন্ট ব্যর্থ হয়েছে',
      description: {
        en: 'Payment could not be processed',
        bn: 'পেমেন্ট প্রক্রিয়া করা যায়নি'
      }
    },
    duplicate: {
      en: 'Duplicate Order',
      bn: 'ডুপ্লিকেট অর্ডার',
      description: {
        en: 'This is a duplicate order',
        bn: 'এটি একটি ডুপ্লিকেট অর্ডার'
      }
    },
    other: {
      en: 'Other',
      bn: 'অন্যান্য',
      description: {
        en: 'Other reason not listed above',
        bn: 'উপরে তালিকাভুক্ত অন্য কোনো কারণ'
      }
    },
  };

  const canCancel = orderStatus !== 'cancelled' && orderStatus !== 'delivered' && orderStatus !== 'refunded';

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            {language === 'bn' ? 'অর্ডার বাতিলের অনুরোধ' : 'Order Cancellation Request'}
          </h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            aria-label={language === 'bn' ? 'বন্ধ করুন' : 'Close'}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Warning */}
          {!canCancel && (
            <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <div className="flex items-start gap-3">
                <span className="text-2xl">⚠️</span>
                <div>
                  <h4 className="font-semibold text-red-800 dark:text-red-200">
                    {language === 'bn' ? 'অর্ডার বাতিল করা যাবে না' : 'Order Cannot Be Cancelled'}
                  </h4>
                  <p className="text-sm text-red-600 dark:text-red-300 mt-1">
                    {language === 'bn'
                      ? `এই অর্ডারটির বর্তমান স্ট্যাটাস "${orderStatus}" এবং এটি আর বাতিল করা যাবে না।`
                      : `This order is currently "${orderStatus}" and cannot be cancelled.`}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Order Info */}
          {canCancel && orderTotal && (
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                {language === 'bn'
                  ? `অর্ডার মোট: ৳${orderTotal} - রিফান্ড প্রক্রিয়া শুরু হলে আপনার অরিজিনাল পেমেন্ট পদ্ধতিতে ফেরত দেওয়া হবে।`
                  : `Order Total: ৳${orderTotal} - Refund will be processed to your original payment method.`}
              </p>
            </div>
          )}

          {/* Error message */}
          {error && (
            <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          {/* Cancellation Type */}
          {canCancel && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {language === 'bn' ? 'বাতিলকরণের কারণ:' : 'Cancellation Reason:'}
              </label>
              <div className="space-y-2">
                {Object.entries(cancellationTypeLabels).map(([key, label]) => (
                  <label
                    key={key}
                    className={`flex items-start gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                      cancellationType === key
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                    }`}
                  >
                    <input
                      type="radio"
                      name="cancellationType"
                      value={key}
                      checked={cancellationType === key}
                      onChange={(e) => setCancellationType(e.target.value as CancellationType)}
                      className="mt-1 w-4 h-4 text-blue-500"
                    />
                    <div>
                      <p className="font-medium text-gray-900 dark:text-gray-100">
                        {language === 'bn' ? label.bn : label.en}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {language === 'bn' ? label.description.bn : label.description.en}
                      </p>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Refund Preference */}
          {canCancel && orderTotal && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {language === 'bn' ? 'রিফান্ড পছন্দ:' : 'Refund Preference:'}
              </label>
              <div className="space-y-2">
                <label className="flex items-center gap-3 p-3 border border-gray-200 dark:border-gray-700 rounded-lg cursor-pointer hover:border-gray-300 dark:hover:border-gray-600">
                  <input
                    type="radio"
                    name="refundPreference"
                    value="original"
                    checked={refundPreference === 'original'}
                    onChange={(e) => setRefundPreference(e.target.value as 'original' | 'wallet')}
                    className="w-4 h-4 text-blue-500"
                  />
                  <div>
                    <p className="font-medium text-gray-900 dark:text-gray-100">
                      {language === 'bn' ? 'অরিজিনাল পেমেন্ট পদ্ধতি' : 'Original Payment Method'}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {language === 'bn' ? 'রিফান্ড আপনার অরিজিনাল পেমেন্ট পদ্ধতিতে প্রক্রিয়া করা হবে' : 'Refund will be processed to your original payment method'}
                    </p>
                  </div>
                </label>
                <label className="flex items-center gap-3 p-3 border border-gray-200 dark:border-gray-700 rounded-lg cursor-pointer hover:border-gray-300 dark:hover:border-gray-600">
                  <input
                    type="radio"
                    name="refundPreference"
                    value="wallet"
                    checked={refundPreference === 'wallet'}
                    onChange={(e) => setRefundPreference(e.target.value as 'original' | 'wallet')}
                    className="w-4 h-4 text-blue-500"
                  />
                  <div>
                    <p className="font-medium text-gray-900 dark:text-gray-100">
                      {language === 'bn' ? 'ওয়ালেট ব্যালেন্স' : 'Wallet Balance'}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {language === 'bn' ? 'রিফান্ড আপনার ওয়ালেট ব্যালেন্সে যোগ করা হবে' : 'Refund will be added to your wallet balance'}
                    </p>
                  </div>
                </label>
              </div>
            </div>
          )}

          {/* Reason */}
          {canCancel && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {language === 'bn' ? 'বিস্তারিত কারণ:' : 'Detailed Reason:'}
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder={language === 'bn' ? 'অনুগ্রহ করে বাতিলকরণের বিস্তারিত কারণ ব্যাখ্যা করুন...' : 'Please explain in detail why you want to cancel...'}
                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 resize-none"
                rows={4}
              />
              {validationErrors.reason && (
                <p className="text-sm text-red-600 dark:text-red-400 mt-1">{validationErrors.reason}</p>
              )}
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {language === 'bn' ? 'সর্বনিম্ন ১০ অক্ষর' : 'Minimum 10 characters'}
              </p>
            </div>
          )}

          {/* Cancellation Policy Acknowledgment */}
          {canCancel && (
            <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={acknowledged}
                  onChange={(e) => setAcknowledged(e.target.checked)}
                  className="mt-1 w-4 h-4 text-yellow-500 rounded"
                />
                <div>
                  <p className="text-sm text-yellow-800 dark:text-yellow-200">
                    {language === 'bn'
                      ? 'আমি বুঝতে পারছি যে এই অর্ডারটি বাতিল করার পরে রিফান্ড প্রক্রিয়া করতে ৩-৭ কার্যদিবস সময় লাগতে পারে।'
                      : 'I understand that after cancelling this order, the refund process may take 3-7 business days.'}
                  </p>
                  <p className="text-sm text-yellow-800 dark:text-yellow-200 mt-1">
                    {language === 'bn'
                      ? 'অর্ডার যদি ইতিমধ্যে প্রেরিত হয়ে থাকে, তবে রিফান্ড প্রক্রিয়া করতে আরও বেশি সময় লাগতে পারে।'
                      : 'If the order has already been shipped, the refund process may take longer.'}
                  </p>
                </div>
              </label>
              {validationErrors.acknowledged && (
                <p className="text-sm text-red-600 dark:text-red-400 mt-2">{validationErrors.acknowledged}</p>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={handleClose}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500"
          >
            {language === 'bn' ? 'বাতিল' : 'Cancel'}
          </button>
          {canCancel && (
            <button
              onClick={handleSubmit}
              disabled={isLoading}
              className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading
                ? language === 'bn'
                  ? 'জমা দেওয়া হচ্ছে...'
                  : 'Submitting...'
                : language === 'bn'
                ? 'অর্ডার বাতিল করুন'
                : 'Cancel Order'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default OrderCancellationRequest;
