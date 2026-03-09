'use client';

import React, { useState } from 'react';
import { X, Tag, Truck, CheckCircle, AlertCircle } from 'lucide-react';
import { CartSummaryProps, ShippingMethod } from '@/types/cart';
import { cn } from '@/lib/utils';

// Safe toFixed wrapper to handle non-number values from API
const safeToFixed = (value: any, decimals: number = 2): string => {
  const num = typeof value === 'number' ? value : parseFloat(value || '0');
  return isNaN(num) ? '0.00' : num.toFixed(decimals);
};

const CartSummary: React.FC<CartSummaryProps> = ({
  subtotal,
  tax,
  shippingCost,
  discount,
  total,
  itemCount,
  shippingMethod,
  discountCode,
  onApplyDiscount,
  onRemoveDiscount,
  onSetShippingMethod,
  onCheckout,
  language = 'en',
  isLoading = false,
}) => {
  const [discountInput, setDiscountInput] = useState('');
  const [isApplyingDiscount, setIsApplyingDiscount] = useState(false);
  const [discountError, setDiscountError] = useState('');

  const handleApplyDiscount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!discountInput.trim()) return;

    setIsApplyingDiscount(true);
    setDiscountError('');

    try {
      await onApplyDiscount(discountInput.trim());
      setDiscountInput('');
    } catch (error: any) {
      setDiscountError(error.message || (language === 'bn' ? 'অবৈধ ডিসকাউন্ট কোড' : 'Invalid discount code'));
    } finally {
      setIsApplyingDiscount(false);
    }
  };

  const handleRemoveDiscount = () => {
    onRemoveDiscount();
  };

  const handleShippingMethodChange = (method: ShippingMethod) => {
    try {
      // Get the cost for the selected shipping method
      const selectedMethod = shippingMethods.find(m => m.value === method);
      // CALC-001: Use parseFloat instead of parseInt for decimal values
      // FIX: Added null check to prevent "can't access property 'replace', y is undefined" error
      const cost = selectedMethod?.cost 
        ? (selectedMethod.cost === 'Free' ? 0 : parseFloat(selectedMethod.cost.replace(/[৳\s]/g, '') || '0'))
        : 0;
      onSetShippingMethod(method, cost);
    } catch (error) {
      console.error('Error setting shipping method:', error);
    }
  };

  const shippingMethods: Array<{ value: ShippingMethod; label: string; labelBn: string; cost: string; costBn: string }> = [
    {
      value: 'STANDARD',
      label: 'Standard Delivery',
      labelBn: 'স্ট্যান্ডার্ড ডেলিভারি',
      cost: '৳100.00',
      costBn: '৳100.00',
    },
    {
      value: 'EXPRESS',
      label: 'Express Delivery',
      labelBn: 'এক্সপ্রেস ডেলিভারি',
      cost: '৳200.00',
      costBn: '৳200.00',
    },
    {
      value: 'INSIDE_DHAKA',
      label: 'Inside Dhaka',
      labelBn: 'ঢাকার ভিতরে',
      cost: '৳60.00',
      costBn: '৳60.00',
    },
    {
      value: 'OUTSIDE_DHAKA',
      label: 'Outside Dhaka',
      labelBn: 'ঢাকার বাইরে',
      cost: '৳120.00',
      costBn: '৳120.00',
    },
  ];

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">
        {language === 'bn' ? 'অর্ডার সারাংশ' : 'Order Summary'}
      </h2>

      {/* Cart Items Count */}
      <div className="flex items-center justify-between text-sm text-gray-600 mb-4 pb-4 border-b border-gray-200">
        <span>
          {language === 'bn' ? 'আইটেম' : 'Items'} ({itemCount})
        </span>
        <span className="font-medium">{language === 'bn' ? '৳' : '৳'}{safeToFixed(subtotal)}</span>
      </div>

      {/* Discount Code Input */}
      {!discountCode && (
        <form onSubmit={handleApplyDiscount} className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {language === 'bn' ? 'ডিসকাউন্ট কোড' : 'Discount Code'}
          </label>
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={discountInput}
                onChange={(e) => setDiscountInput(e.target.value.toUpperCase())}
                placeholder={language === 'bn' ? 'কোড লিখুন' : 'Enter code'}
                className={cn(
                  "w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md",
                  "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent",
                  "placeholder:text-gray-400 text-sm"
                )}
                disabled={isApplyingDiscount || isLoading}
              />
            </div>
            <button
              type="submit"
              disabled={isApplyingDiscount || isLoading || !discountInput.trim()}
              className={cn(
                "px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md",
                "hover:bg-blue-700 transition-colors",
                "disabled:opacity-50 disabled:cursor-not-allowed",
                "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
              )}
            >
              {isApplyingDiscount
                ? (language === 'bn' ? 'প্রয়োগ হচ্ছে...' : 'Applying...')
                : (language === 'bn' ? 'প্রয়োগ' : 'Apply')}
            </button>
          </div>
          {discountError && (
            <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
              <AlertCircle className="w-4 h-4" />
              {discountError}
            </p>
          )}
        </form>
      )}

      {/* Applied Discount */}
      {discountCode && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span className="text-sm font-medium text-green-800">
                {language === 'bn' ? 'ডিসকাউন্ট কোড প্রয়োগ হয়েছে' : 'Discount Applied'}
              </span>
            </div>
            <button
              type="button"
              onClick={handleRemoveDiscount}
              className="text-gray-500 hover:text-gray-700 transition-colors"
              aria-label={language === 'bn' ? 'ডিসকাউন্ট সরান' : 'Remove discount'}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <p className="text-xs text-green-700 mt-1">{discountCode}</p>
        </div>
      )}

      {/*
        HIDDEN: Shipping method selection moved to checkout page (2026-02-23)
        Reason: Shipping method should only be selected at checkout to ensure proper cost calculation
        with address-based shipping zones.
        To restore: Remove the `{false && (` wrapper and the closing `)}` below
      */}
      {false && (
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {language === 'bn' ? 'শিপিং পদ্ধতি' : 'Shipping Method'}
          </label>
          <div className="flex flex-wrap gap-2">
            {shippingMethods.map((method) => (
              <button
                key={method.value}
                type="button"
                onClick={() => handleShippingMethodChange(method.value)}
                disabled={isLoading}
                className={cn(
                  "w-full flex items-center justify-between p-3 border rounded-md transition-colors",
                  shippingMethod === method.value
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-200 hover:border-gray-300",
                  "disabled:opacity-50 disabled:cursor-not-allowed",
                  "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1",
                  "truncate"
                )}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Truck className="w-5 h-5 text-gray-600 flex-shrink-0" />
                  <div className="text-left min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {language === 'bn' ? method.labelBn : method.label}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      {language === 'bn' ? '3-5 কার্যদিবস' : '3-5 business days'}
                    </p>
                  </div>
                </div>
                <span className="text-sm font-semibold text-gray-900 flex-shrink-0 ml-2">
                  {language === 'bn' ? method.costBn : method.cost}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Price Breakdown */}
      <div className="space-y-3 pb-4 border-b border-gray-200">
        <div className="flex items-center justify-between text-sm text-gray-600">
          <span>{language === 'bn' ? 'উপমোট' : 'Subtotal'}</span>
          <span className="font-medium">{language === 'bn' ? '৳' : '৳'}{safeToFixed(subtotal)}</span>
        </div>

      {/*
        HIDDEN: Shipping cost will be calculated on checkout page (2026-02-23)
        Reason: Shipping cost calculation is now done on the checkout page after address selection.
        The cart page should only show the subtotal, and shipping will be added at checkout.
        To restore: Remove the `{false && (` wrapper and the closing `)}` below
      */}
      {false && (
        <div className="flex items-center justify-between text-sm text-gray-600">
          <span>{language === 'bn' ? 'শিপিং' : 'Shipping'}</span>
          <span className="font-medium">
            {shippingCost === 0
              ? (language === 'bn' ? 'বিনামূল্যে' : 'Free')
              : `${language === 'bn' ? '৳' : '৳'}${safeToFixed(shippingCost)}`
            }
          </span>
        </div>
      )}

        <div className="flex items-center justify-between text-sm text-gray-600">
          <span>{language === 'bn' ? 'কর' : 'Tax'}</span>
          <span className="font-medium">{language === 'bn' ? '৳' : '৳'}{safeToFixed(tax)}</span>
        </div>

        {discount > 0 && (
          <div className="flex items-center justify-between text-sm text-green-600">
            <span>{language === 'bn' ? 'ডিসকাউন্ট' : 'Discount'}</span>
            <span className="font-medium">
              -{language === 'bn' ? '৳' : '৳'}{safeToFixed(discount)}
            </span>
          </div>
        )}
      </div>

      {/* Total */}
      <div className="flex items-center justify-between py-4 border-b border-gray-200">
        <span className="text-base font-semibold text-gray-900">
          {language === 'bn' ? 'মোট' : 'Total'}
        </span>
        <span className="text-xl font-bold text-gray-900">
          {language === 'bn' ? '৳' : '৳'}{safeToFixed(subtotal + tax - discount)}
        </span>
      </div>

      {/* Checkout Button */}
      <button
        type="button"
        onClick={onCheckout}
        disabled={itemCount === 0 || isLoading}
        className={cn(
          "w-full mt-4 px-6 py-3 bg-blue-600 text-white text-base font-semibold rounded-md",
          "hover:bg-blue-700 transition-colors",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
        )}
      >
        {isLoading
          ? (language === 'bn' ? 'লোড হচ্ছে...' : 'Loading...')
          : language === 'bn'
            ? 'চেকআউট করুন'
            : 'Proceed to Checkout'
        }
      </button>

      {/* Security Notice */}
      <div className="mt-4 flex items-center justify-center gap-2 text-xs text-gray-500">
        <CheckCircle className="w-4 h-4" />
        <span>{language === 'bn' ? 'নিরাপদ চেকআউট' : 'Secure checkout'}</span>
      </div>
    </div>
  );
};

export default CartSummary;
