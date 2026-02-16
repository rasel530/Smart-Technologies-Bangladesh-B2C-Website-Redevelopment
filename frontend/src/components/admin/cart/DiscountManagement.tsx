'use client';

import React, { useState } from 'react';
import {
  Tag,
  Plus,
  X,
  CheckCircle,
  AlertCircle,
  Trash2,
  Percent,
  DollarSign,
  Gift
} from 'lucide-react';
import adminDiscountApi, {
  CartWithDiscount,
  DiscountBreakdownItem
} from '@/lib/api/admin/discount';

interface DiscountManagementProps {
  cartId: string;
  language?: 'en' | 'bn';
  onDiscountChange?: () => void;
}

const DiscountManagement: React.FC<DiscountManagementProps> = ({
  cartId,
  language = 'en',
  onDiscountChange
}) => {
  const [cart, setCart] = useState<CartWithDiscount | undefined>();
  const [showApplyDialog, setShowApplyDialog] = useState(false);
  const [showItemsDialog, setShowItemsDialog] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Apply discount form state
  const [discountCode, setDiscountCode] = useState('');
  const [validatingCode, setValidatingCode] = useState(false);
  const [codeValidation, setCodeValidation] = useState<{
    valid: boolean;
    message?: string;
    discount?: {
      id: string;
      code: string;
      type: string;
      value: number;
      description?: string;
    };
  } | null>(null);

  // Apply to items form state
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [itemDiscountType, setItemDiscountType] = useState<'PERCENTAGE' | 'FIXED' | 'PROMOTIONAL'>('PERCENTAGE');
  const [itemDiscountValue, setItemDiscountValue] = useState<string>('');

  const translations = {
    en: {
      applyDiscount: 'Apply Discount',
      removeDiscount: 'Remove Discount',
      discountCode: 'Discount Code',
      enterCode: 'Enter discount code',
      apply: 'Apply',
      cancel: 'Cancel',
      validating: 'Validating...',
      valid: 'Valid discount code',
      invalid: 'Invalid code',
      discountApplied: 'Discount applied successfully',
      discountRemoved: 'Discount removed successfully',
      error: 'Error',
      success: 'Success',
      applyToItems: 'Apply to Specific Items',
      selectItems: 'Select Items',
      discountType: 'Discount Type',
      discountValue: 'Discount Value',
      percentage: 'Percentage',
      fixed: 'Fixed Amount',
      promotional: 'Promotional',
      originalPrice: 'Original Price',
      discount: 'Discount',
      finalPrice: 'Final Price',
      reason: 'Reason',
      noDiscount: 'No discount applied',
      itemDiscountApplied: 'Item discount applied successfully',
      confirmRemove: 'Are you sure you want to remove the discount?',
      removeReason: 'Reason for removal',
    },
    bn: {
      applyDiscount: 'ডিসকাউন্ট প্রয়োগ করুন',
      removeDiscount: 'ডিসকাউন্ট সরান',
      discountCode: 'ডিসকাউন্ট কোড',
      enterCode: 'ডিসকাউন্ট কোড লিখুন',
      apply: 'প্রয়োগ করুন',
      cancel: 'বাতিল',
      validating: 'যাচাই করা হচ্ছে...',
      valid: 'বৈধ ডিসকাউন্ট কোড',
      invalid: 'অবৈধ কোড',
      discountApplied: 'ডিসকাউন্ট সফলভাবে প্রয়োগ করা হয়েছে',
      discountRemoved: 'ডিসকাউন্ট সফলভাবে সরানো হয়েছে',
      error: 'ত্রুটি',
      success: 'সফল',
      applyToItems: 'নির্দিষ্ট আইটেমে প্রয়োগ করুন',
      selectItems: 'আইটেম নির্বাচন করুন',
      discountType: 'ডিসকাউন্ট ধরন',
      discountValue: 'ডিসকাউন্ট মান',
      percentage: 'শতাংশ',
      fixed: 'স্থির পরিমাণ',
      promotional: 'প্রমোশনাল',
      originalPrice: 'মূল দাম',
      discount: 'ডিসকাউন্ট',
      finalPrice: 'চূড়ান্ত দাম',
      reason: 'কারণ',
      noDiscount: 'কোনো ডিসকাউন্ট প্রয়োগ করা হয়নি',
      itemDiscountApplied: 'আইটেম ডিসকাউন্ট সফলভাবে প্রয়োগ করা হয়েছে',
      confirmRemove: 'আপনি কি নিশ্চিত যে আপনি ডিসকাউন্ট সরাতে চান?',
      removeReason: 'সরানোর কারণ',
    }
  };

  const t = translations[language];

  // Fetch cart data
  const fetchCart = async () => {
    try {
      const cartData = await adminDiscountApi.getCartWithDiscount(cartId);
      setCart(cartData);
      onDiscountChange?.();
    } catch (err: any) {
      console.error('Error fetching cart:', err);
    }
  };

  // Validate discount code
  const validateCode = async (code: string) => {
    if (!code.trim()) {
      setCodeValidation(null);
      return;
    }

    setValidatingCode(true);
    try {
      const result = await adminDiscountApi.validateDiscount(code);
      setCodeValidation(result);
    } catch (err: any) {
      setCodeValidation({
        valid: false,
        message: err.message || t.invalid
      });
    } finally {
      setValidatingCode(false);
    }
  };

  // Handle code input change
  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const code = e.target.value.toUpperCase();
    setDiscountCode(code);
    setCodeValidation(null);

    // Debounce validation
    if (code.length >= 3) {
      const timeout = setTimeout(() => validateCode(code), 500);
      return () => clearTimeout(timeout);
    }
  };

  // Apply discount to entire cart
  const handleApplyDiscount = async () => {
    if (!codeValidation?.valid) {
      setError(t.invalid);
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      await adminDiscountApi.applyDiscount(cartId, {
        discountCode
      });
      await fetchCart();
      setShowApplyDialog(false);
      setDiscountCode('');
      setCodeValidation(null);
      setSuccess(t.discountApplied);
    } catch (err: any) {
      setError(err.message || t.error);
    } finally {
      setLoading(false);
    }
  };

  // Remove discount from cart
  const handleRemoveDiscount = async () => {
    if (!confirm(t.confirmRemove)) return;

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      await adminDiscountApi.removeDiscount(cartId, 'Manual removal', undefined);
      await fetchCart();
      setSuccess(t.discountRemoved);
    } catch (err: any) {
      setError(err.message || t.error);
    } finally {
      setLoading(false);
    }
  };

  // Apply discount to specific items
  const handleApplyToItems = async () => {
    if (selectedItems.length === 0) {
      setError('Please select at least one item');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      await adminDiscountApi.applyDiscountToItems(cartId, {
        itemIds: selectedItems,
        discountType: itemDiscountType,
        discountValue: parseFloat(itemDiscountValue)
      });
      await fetchCart();
      setShowItemsDialog(false);
      setSelectedItems([]);
      setItemDiscountValue('');
      setSuccess(t.itemDiscountApplied);
    } catch (err: any) {
      setError(err.message || t.error);
    } finally {
      setLoading(false);
    }
  };

  // Toggle item selection
  const toggleItemSelection = (itemId: string) => {
    setSelectedItems(prev =>
      prev.includes(itemId)
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };

  // Format price
  const formatPrice = (price: number): string => {
    return `৳${price.toFixed(2)}`;
  };

  const hasDiscount = cart?.discountBreakdown && cart.discountBreakdown.length > 0;

  return (
    <div className="space-y-4">
      {/* Error/Success Messages */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-red-500" />
          <span className="text-red-700">{error}</span>
          <button
            onClick={() => setError(null)}
            className="ml-auto text-red-500 hover:text-red-700"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-green-500" />
          <span className="text-green-700">{success}</span>
          <button
            onClick={() => setSuccess(null)}
            className="ml-auto text-green-500 hover:text-green-700"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Current Discount Status */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Tag className="w-5 h-5 text-gray-500" />
            <h3 className="text-lg font-semibold text-gray-900">
              {hasDiscount ? t.success : t.noDiscount}
            </h3>
          </div>
          <div className="flex items-center gap-2">
            {hasDiscount ? (
              <button
                onClick={handleRemoveDiscount}
                disabled={loading}
                className="flex items-center gap-2 px-3 py-1.5 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors disabled:opacity-50"
              >
                <Trash2 className="w-4 h-4" />
                {t.removeDiscount}
              </button>
            ) : (
              <>
                <button
                  onClick={() => setShowItemsDialog(true)}
                  className="flex items-center gap-2 px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                >
                  <Percent className="w-4 h-4" />
                  {t.applyToItems}
                </button>
                <button
                  onClick={() => setShowApplyDialog(true)}
                  className="flex items-center gap-2 px-3 py-1.5 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors"
                >
                  <Tag className="w-4 h-4" />
                  {t.applyDiscount}
                </button>
              </>
            )}
          </div>
        </div>

        {/* Discount Breakdown */}
        {hasDiscount && cart?.discountBreakdown && (
          <div className="border-t border-gray-200 pt-4">
            <h4 className="text-sm font-medium text-gray-700 mb-3">Discount Breakdown</h4>
            <div className="space-y-2">
              {cart.discountBreakdown.map((item: DiscountBreakdownItem) => (
                <div
                  key={item.itemId}
                  className="flex items-center justify-between text-sm bg-gray-50 rounded-lg p-3"
                >
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{item.productName}</p>
                    <p className="text-gray-500 text-xs">
                      {formatPrice(item.originalPrice)} → {formatPrice(item.finalPrice)}
                    </p>
                    {item.discountReason && (
                      <p className="text-blue-600 text-xs mt-1">{item.discountReason}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-red-600 font-medium">
                      -{formatPrice(item.appliedDiscount)}
                    </p>
                    {item.discountType && (
                      <span className="text-xs text-gray-500">
                        {item.discountType === 'PERCENTAGE' && '%'}
                        {item.discountType === 'FIXED' && '৳'}
                        {item.discountType === 'PROMOTIONAL' && '🎁'}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <div className="border-t border-gray-200 mt-4 pt-3 flex justify-between items-center">
              <span className="font-semibold text-gray-900">Total Discount</span>
              <span className="text-xl font-bold text-red-600">
                -{formatPrice(cart.totalDiscount)}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Apply Discount Dialog */}
      {showApplyDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-semibold">{t.applyDiscount}</h3>
              <button
                onClick={() => {
                  setShowApplyDialog(false);
                  setDiscountCode('');
                  setCodeValidation(null);
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t.discountCode}
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={discountCode}
                    onChange={handleCodeChange}
                    placeholder={t.enterCode}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 uppercase"
                  />
                  {validatingCode && (
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                      {t.validating}
                    </span>
                  )}
                </div>
                {codeValidation && (
                  <div className={`mt-2 flex items-center gap-2 text-sm ${
                    codeValidation.valid ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {codeValidation.valid ? (
                      <CheckCircle className="w-4 h-4" />
                    ) : (
                      <AlertCircle className="w-4 h-4" />
                    )}
                    <span>{codeValidation.message}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 p-4 border-t bg-gray-50">
              <button
                onClick={() => {
                  setShowApplyDialog(false);
                  setDiscountCode('');
                  setCodeValidation(null);
                }}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                {t.cancel}
              </button>
              <button
                onClick={handleApplyDiscount}
                disabled={loading || !codeValidation?.valid}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {loading ? t.validating : t.apply}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Apply to Items Dialog */}
      {showItemsDialog && cart && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-auto">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-semibold">{t.applyToItems}</h3>
              <button
                onClick={() => {
                  setShowItemsDialog(false);
                  setSelectedItems([]);
                  setItemDiscountValue('');
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 space-y-4">
              {/* Select Items */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t.selectItems}
                </label>
                <div className="space-y-2 max-h-48 overflow-auto">
                  {cart.items.map((item) => (
                    <label
                      key={item.id}
                      className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                        selectedItems.includes(item.id)
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedItems.includes(item.id)}
                        onChange={() => toggleItemSelection(item.id)}
                        className="w-4 h-4 text-blue-600"
                      />
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">
                          {item.product?.name || 'Unknown Product'}
                        </p>
                        <p className="text-sm text-gray-500">
                          {formatPrice(parseFloat(item.subtotal.toString()))} × {item.quantity}
                        </p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Discount Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t.discountType}
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { value: 'PERCENTAGE', label: t.percentage, icon: Percent },
                    { value: 'FIXED', label: t.fixed, icon: DollarSign },
                    { value: 'PROMOTIONAL', label: t.promotional, icon: Gift }
                  ].map(({ value, label, icon: Icon }) => (
                    <button
                      key={value}
                      onClick={() => setItemDiscountType(value as any)}
                      className={`flex items-center justify-center gap-2 p-3 rounded-lg border transition-colors ${
                        itemDiscountType === value
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span className="text-sm">{label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Discount Value */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t.discountValue}
                </label>
                <input
                  type="number"
                  value={itemDiscountValue}
                  onChange={(e) => setItemDiscountValue(e.target.value)}
                  min={0}
                  step={itemDiscountType === 'PERCENTAGE' ? 1 : 0.01}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder={itemDiscountType === 'PERCENTAGE' ? '10' : '100.00'}
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 p-4 border-t bg-gray-50">
              <button
                onClick={() => {
                  setShowItemsDialog(false);
                  setSelectedItems([]);
                  setItemDiscountValue('');
                }}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                {t.cancel}
              </button>
              <button
                onClick={handleApplyToItems}
                disabled={loading || selectedItems.length === 0 || !itemDiscountValue}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? t.validating : t.apply}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DiscountManagement;
