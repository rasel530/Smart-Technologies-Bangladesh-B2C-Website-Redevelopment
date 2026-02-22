'use client';

import React from 'react';
import { DollarSign, Truck, Shield, ChevronRight, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * MobileCartSummary Component
 * Lightweight cart summary for mobile
 * Features:
 * - Lightweight cart summary
 * - Show totals and fees
 * - Compact payment options
 * - Quick checkout button
 */
interface MobileCartSummaryProps {
  subtotal: number;
  shippingFee?: number;
  codFee?: number;
  tax?: number;
  discount?: number;
  total: number;
  onCheckout?: () => void;
  onEditShipping?: () => void;
  onEditPayment?: () => void;
  language?: 'en' | 'bn';
  className?: string;
  showPaymentOptions?: boolean;
  showShippingInfo?: boolean;
}

const MobileCartSummary: React.FC<MobileCartSummaryProps> = ({
  subtotal,
  shippingFee = 0,
  codFee = 0,
  tax = 0,
  discount = 0,
  total,
  onCheckout,
  onEditShipping,
  onEditPayment,
  language = 'en',
  className,
  showPaymentOptions = true,
  showShippingInfo = true
}) => {
  const formatCurrency = (value: number): string => {
    return `৳${value.toLocaleString('en-BD', { minimumFractionDigits: 2 })}`;
  };

  const hasDiscount = discount > 0;
  const hasAdditionalFees = shippingFee > 0 || codFee > 0 || tax > 0;

  return (
    <div className={cn('bg-white rounded-t-2xl shadow-lg border-t border-gray-200', className)}>
      {/* Summary Header */}
      <div className="px-4 py-3 border-b border-gray-200">
        <h2 className="text-base font-semibold text-gray-900">
          {language === 'bn' ? 'অর্ডার সারাংশ' : 'Order Summary'}
        </h2>
      </div>

      {/* Summary Details */}
      <div className="px-4 py-3 space-y-3">
        {/* Subtotal */}
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">
            {language === 'bn' ? 'সাবটোটাল' : 'Subtotal'}
          </span>
          <span className="text-sm font-medium text-gray-900">
            {formatCurrency(subtotal)}
          </span>
        </div>

        {/* Discount */}
        {hasDiscount && (
          <div className="flex justify-between items-center">
            <span className="text-sm text-green-600">
              {language === 'bn' ? 'ছাড়' : 'Discount'}
            </span>
            <span className="text-sm font-medium text-green-600">
              -{formatCurrency(discount)}
            </span>
          </div>
        )}

        {/* Shipping Fee */}
        {shippingFee > 0 && (
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">
              {language === 'bn' ? 'শিপিং ফি' : 'Shipping Fee'}
            </span>
            <span className="text-sm font-medium text-gray-900">
              {formatCurrency(shippingFee)}
            </span>
          </div>
        )}

        {/* COD Fee */}
        {codFee > 0 && (
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">
              {language === 'bn' ? 'ক্যাশ অন ডেলিভারি ফি' : 'COD Fee'}
            </span>
            <span className="text-sm font-medium text-gray-900">
              {formatCurrency(codFee)}
            </span>
          </div>
        )}

        {/* Tax */}
        {tax > 0 && (
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">
              {language === 'bn' ? 'ট্যাক্স' : 'Tax'}
            </span>
            <span className="text-sm font-medium text-gray-900">
              {formatCurrency(tax)}
            </span>
          </div>
        )}

        {/* Total */}
        <div className="flex justify-between items-center pt-3 border-t border-gray-200">
          <span className="text-base font-semibold text-gray-900">
            {language === 'bn' ? 'মোট পরিমাণ' : 'Total Amount'}
          </span>
          <span className="text-lg font-bold text-blue-600">
            {formatCurrency(total)}
          </span>
        </div>
      </div>

      {/* Shipping Info */}
      {showShippingInfo && (
        <div className="px-4 py-3 border-t border-gray-100">
          <button
            onClick={onEditShipping}
            className="w-full flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label={language === 'bn' ? 'শিপিং ঠিকানা সম্পাদনা করুন' : 'Edit shipping address'}
          >
            <div className="flex items-center gap-3">
              <Truck className="w-5 h-5 text-gray-600" aria-hidden="true" />
              <div className="text-left">
                <p className="text-sm font-medium text-gray-900">
                  {language === 'bn' ? 'শিপিং ঠিকানা' : 'Shipping Address'}
                </p>
                <p className="text-xs text-gray-500">
                  {language === 'bn' ? 'ঠিকানা যোগ করুন' : 'Add address'}
                </p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400" aria-hidden="true" />
          </button>
        </div>
      )}

      {/* Payment Options */}
      {showPaymentOptions && (
        <div className="px-4 py-3 border-t border-gray-100">
          <button
            onClick={onEditPayment}
            className="w-full flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label={language === 'bn' ? 'পেমেন্ট পদ্ধতি সম্পাদনা করুন' : 'Edit payment method'}
          >
            <div className="flex items-center gap-3">
              <DollarSign className="w-5 h-5 text-gray-600" aria-hidden="true" />
              <div className="text-left">
                <p className="text-sm font-medium text-gray-900">
                  {language === 'bn' ? 'পেমেন্ট পদ্ধতি' : 'Payment Method'}
                </p>
                <p className="text-xs text-gray-500">
                  {language === 'bn' ? 'পেমেন্ট পদ্ধতি নির্বাচন করুন' : 'Select payment method'}
                </p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400" aria-hidden="true" />
          </button>
        </div>
      )}

      {/* Security Note */}
      <div className="px-4 py-3 border-t border-gray-100">
        <div className="flex items-start gap-2 p-3 bg-blue-50 rounded-lg">
          <Shield className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" aria-hidden="true" />
          <div className="flex-1">
            <p className="text-xs text-blue-800">
              {language === 'bn' 
                ? 'আপনার পেমেন্ট নিরাপদ এবং সুরক্ষিত। আমরা SSL এনক্রিপশন ব্যবহার করি।'
                : 'Your payment is safe and secure. We use SSL encryption.'
              }
            </p>
          </div>
        </div>
      </div>

      {/* Checkout Button */}
      <div className="px-4 py-3">
        <button
          onClick={onCheckout}
          className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 active:scale-[0.98] flex items-center justify-center gap-2"
          aria-label={language === 'bn' ? 'চেকআউট করুন' : 'Proceed to checkout'}
        >
          <DollarSign className="w-5 h-5" aria-hidden="true" />
          <span>
            {language === 'bn' ? `চেকআউট - ${formatCurrency(total)}` : `Checkout - ${formatCurrency(total)}`}
          </span>
        </button>
      </div>

      {/* Info Note */}
      <div className="px-4 pb-4">
        <div className="flex items-start gap-2">
          <Info className="w-4 h-4 text-gray-500 flex-shrink-0 mt-0.5" aria-hidden="true" />
          <p className="text-xs text-gray-500">
            {language === 'bn' 
              ? 'চেকআউট করার সময় আপনার পেমেন্ট বিবরণ নিশ্চিত করুন।'
              : 'Please verify your payment details before checkout.'
            }
          </p>
        </div>
      </div>
    </div>
  );
};

export default MobileCartSummary;
