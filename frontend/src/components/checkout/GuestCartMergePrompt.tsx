'use client';

import React, { useState } from 'react';
import { ShoppingCart, User, AlertTriangle, Info, CheckCircle, X, ChevronRight, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import Image from 'next/image';
import type { GuestCart, UserCart, CartMergeOption, GuestCartMergePromptProps } from '@/types/guestCheckout';

/**
 * Guest Cart Merge Prompt Component
 *
 * Provides cart merging interface for guest users logging in including:
 * - Show guest cart items
 * - Show user cart items
 * - Merge options (keep user, keep guest, merge)
 * - Confirmation dialog
 * - Mobile-friendly display
 *
 * @example
 * ```tsx
 * <GuestCartMergePrompt
 *   guestCart={guestCartData}
 *   userCart={userCartData}
 *   onMerge={(option) => console.log('Merge:', option)}
 *   onSkip={() => console.log('Skip')}
 *   language="en"
 * />
 * ```
 */

export const GuestCartMergePrompt: React.FC<GuestCartMergePromptProps> = ({
  guestCart,
  userCart,
  onMerge,
  onSkip,
  isLoading = false,
  language = 'en',
  className = '',
}) => {
  const [selectedOption, setSelectedOption] = useState<CartMergeOption>('merge');
  const [showGuestDetails, setShowGuestDetails] = useState(false);
  const [showUserDetails, setShowUserDetails] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);

  /**
   * Format currency
   */
  const formatCurrency = (amount: number): string => {
    return `৳${amount.toLocaleString('en-BD', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  /**
   * Get product image URL
   */
  const getProductImage = (item: any): string => {
    if (!item.product?.images || item.product.images.length === 0) {
      return '/images/placeholder-product.jpg';
    }
    
    const image = item.product.images[0];
    return image.originalUrl || image.optimizedUrl || image.thumbnailUrl || image.url || '/images/placeholder-product.jpg';
  };

  /**
   * Handle merge option selection
   */
  const handleOptionSelect = (option: CartMergeOption) => {
    setSelectedOption(option);
  };

  /**
   * Handle merge confirmation
   */
  const handleMergeConfirm = async () => {
    setIsConfirming(true);

    try {
      await onMerge(selectedOption);
      toast.success(language === 'bn' ? 'কার্ট মার্জ সফল' : 'Cart merged successfully');
    } catch (error) {
      console.error('Cart merge error:', error);
      toast.error(language === 'bn' ? 'কার্ট মার্জ ব্যর্থ' : 'Failed to merge cart');
    } finally {
      setIsConfirming(false);
    }
  };

  /**
   * Handle skip
   */
  const handleSkip = () => {
    onSkip();
    toast.info(language === 'bn' ? 'কার্ট মার্জ বাদ দেওয়া হয়েছে' : 'Cart merge skipped');
  };

  /**
   * Calculate merged cart totals
   */
  const calculateMergedTotals = () => {
    const mergedItems = [...guestCart.items];
    
    userCart.items.forEach(userItem => {
      const existingItem = mergedItems.find(
        guestItem => guestItem.productId === userItem.productId && 
                     guestItem.variantId === userItem.variantId
      );
      
      if (existingItem) {
        existingItem.quantity += userItem.quantity;
      } else {
        mergedItems.push({ ...userItem });
      }
    });

    const subtotal = mergedItems.reduce((sum, item) => sum + (item.quantity * item.price), 0);
    const shippingCost = Math.max(guestCart.shippingCost, userCart.shippingCost);
    const tax = subtotal * 0.15; // Assuming 15% tax
    const total = subtotal + shippingCost + tax;

    return {
      items: mergedItems,
      subtotal,
      shippingCost,
      tax,
      total,
    };
  };

  const mergedTotals = calculateMergedTotals();

  return (
    <div className={cn('guest-cart-merge-prompt', className)}>
      {/* Header */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-blue-900 mb-1">
              {language === 'bn' ? 'কার্ট মার্জ করুন' : 'Merge Your Carts'}
            </h3>
            <p className="text-sm text-blue-700">
              {language === 'bn' 
                ? 'আপনার গেস্ট কার্ট এবং ব্যবহারকারী কার্ট উভয়ই রয়েছে। কীভাবে এগুলি মার্জ করতে চান?' 
                : 'You have both a guest cart and a user cart. How would you like to merge them?'}
            </p>
          </div>
        </div>
      </div>

      {/* Cart Comparison */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Guest Cart */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="bg-purple-50 border-b border-purple-200 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-purple-600" />
                <h4 className="font-semibold text-purple-900">
                  {language === 'bn' ? 'গেস্ট কার্ট' : 'Guest Cart'}
                </h4>
              </div>
              <span className="text-sm font-medium text-purple-700">
                {guestCart.items.length} {language === 'bn' ? 'আইটেম' : 'items'}
              </span>
            </div>
          </div>
          
          {/* Guest Cart Items */}
          <div className="p-4 space-y-3 max-h-64 overflow-y-auto">
            {guestCart.items.slice(0, showGuestDetails ? undefined : 3).map((item) => (
              <div key={item.id} className="flex gap-3 p-2 bg-gray-50 rounded-lg">
                <div className="relative w-12 h-12 flex-shrink-0 bg-gray-100 rounded-md overflow-hidden">
                  <Image
                    src={getProductImage(item)}
                    alt={item.product?.name || 'Product'}
                    fill
                    className="object-cover"
                  />
                  <div className="absolute -top-1 -right-1 w-5 h-5 bg-purple-600 text-white text-xs rounded-full flex items-center justify-center">
                    {item.quantity}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {item.product?.name || 'Unknown Product'}
                  </p>
                  <p className="text-xs text-gray-500">
                    {formatCurrency(item.quantity * item.price)}
                  </p>
                </div>
              </div>
            ))}
            
            {guestCart.items.length > 3 && !showGuestDetails && (
              <button
                type="button"
                onClick={() => setShowGuestDetails(true)}
                className="w-full text-center text-sm text-purple-600 hover:text-purple-700 font-medium"
              >
                {language === 'bn' ? `আরও ${guestCart.items.length - 3} আইটেম দেখুন` : `View ${guestCart.items.length - 3} more items`}
                <ChevronDown className="inline w-4 h-4 ml-1" />
              </button>
            )}
          </div>

          {/* Guest Cart Total */}
          <div className="bg-purple-50 border-t border-purple-200 p-4">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-purple-700">
                {language === 'bn' ? 'মোট:' : 'Total:'}
              </span>
              <span className="text-lg font-bold text-purple-900">
                {formatCurrency(guestCart.total)}
              </span>
            </div>
          </div>
        </div>

        {/* User Cart */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="bg-green-50 border-b border-green-200 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <User className="w-5 h-5 text-green-600" />
                <h4 className="font-semibold text-green-900">
                  {language === 'bn' ? 'ব্যবহারকারী কার্ট' : 'Your Cart'}
                </h4>
              </div>
              <span className="text-sm font-medium text-green-700">
                {userCart.items.length} {language === 'bn' ? 'আইটেম' : 'items'}
              </span>
            </div>
          </div>
          
          {/* User Cart Items */}
          <div className="p-4 space-y-3 max-h-64 overflow-y-auto">
            {userCart.items.slice(0, showUserDetails ? undefined : 3).map((item) => (
              <div key={item.id} className="flex gap-3 p-2 bg-gray-50 rounded-lg">
                <div className="relative w-12 h-12 flex-shrink-0 bg-gray-100 rounded-md overflow-hidden">
                  <Image
                    src={getProductImage(item)}
                    alt={item.product?.name || 'Product'}
                    fill
                    className="object-cover"
                  />
                  <div className="absolute -top-1 -right-1 w-5 h-5 bg-green-600 text-white text-xs rounded-full flex items-center justify-center">
                    {item.quantity}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {item.product?.name || 'Unknown Product'}
                  </p>
                  <p className="text-xs text-gray-500">
                    {formatCurrency(item.quantity * item.price)}
                  </p>
                </div>
              </div>
            ))}
            
            {userCart.items.length > 3 && !showUserDetails && (
              <button
                type="button"
                onClick={() => setShowUserDetails(true)}
                className="w-full text-center text-sm text-green-600 hover:text-green-700 font-medium"
              >
                {language === 'bn' ? `আরও ${userCart.items.length - 3} আইটেম দেখুন` : `View ${userCart.items.length - 3} more items`}
                <ChevronDown className="inline w-4 h-4 ml-1" />
              </button>
            )}
          </div>

          {/* User Cart Total */}
          <div className="bg-green-50 border-t border-green-200 p-4">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-green-700">
                {language === 'bn' ? 'মোট:' : 'Total:'}
              </span>
              <span className="text-lg font-bold text-green-900">
                {formatCurrency(userCart.total)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Merge Options */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          {language === 'bn' ? 'মার্জ অপশন নির্বাচন করুন' : 'Select Merge Option'}
        </h3>

        <div className="space-y-3">
          {/* Merge Option */}
          <label className={cn(
            'flex items-start gap-3 p-4 border rounded-lg cursor-pointer transition-all',
            selectedOption === 'merge' 
              ? 'border-blue-500 bg-blue-50' 
              : 'border-gray-200 hover:border-gray-300'
          )}>
            <input
              type="radio"
              name="mergeOption"
              value="merge"
              checked={selectedOption === 'merge'}
              onChange={() => handleOptionSelect('merge')}
              className="mt-1 h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
              disabled={isLoading || isConfirming}
            />
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <CheckCircle className="w-5 h-5 text-blue-600" />
                <span className="font-medium text-gray-900">
                  {language === 'bn' ? 'মার্জ করুন (প্রস্তাবিত)' : 'Merge (Recommended)'}
                </span>
              </div>
              <p className="text-sm text-gray-600">
                {language === 'bn' 
                  ? 'গেস্ট কার্ট এবং ব্যবহারকারী কার্ট একত্রিত করুন। দ্বন্দ্বমূলক আইটেমগুলির পরিমাণ যোগ করা হবে।' 
                  : 'Combine both carts together. Quantities for duplicate items will be added.'}
              </p>
              <div className="mt-2 p-2 bg-blue-100 rounded-md">
                <div className="flex items-center gap-2 text-sm">
                  <Info className="w-4 h-4 text-blue-600" />
                  <span className="text-blue-900">
                    {language === 'bn' 
                      ? `মোট: ${formatCurrency(mergedTotals.total)} (${mergedTotals.items.length} আইটেম)` 
                      : `Total: ${formatCurrency(mergedTotals.total)} (${mergedTotals.items.length} items)`}
                  </span>
                </div>
              </div>
            </div>
          </label>

          {/* Keep User Option */}
          <label className={cn(
            'flex items-start gap-3 p-4 border rounded-lg cursor-pointer transition-all',
            selectedOption === 'keep_user' 
              ? 'border-green-500 bg-green-50' 
              : 'border-gray-200 hover:border-gray-300'
          )}>
            <input
              type="radio"
              name="mergeOption"
              value="keep_user"
              checked={selectedOption === 'keep_user'}
              onChange={() => handleOptionSelect('keep_user')}
              className="mt-1 h-4 w-4 text-green-600 border-gray-300 focus:ring-green-500"
              disabled={isLoading || isConfirming}
            />
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <User className="w-5 h-5 text-green-600" />
                <span className="font-medium text-gray-900">
                  {language === 'bn' ? 'ব্যবহারকারী কার্ট রাখুন' : 'Keep Your Cart'}
                </span>
              </div>
              <p className="text-sm text-gray-600">
                {language === 'bn' 
                  ? 'শুধুমাত্র আপনার ব্যবহারকারী কার্ট রাখুন এবং গেস্ট কার্ট বাতিল করুন।' 
                  : 'Keep only your user cart and discard the guest cart.'}
              </p>
              <div className="mt-2 p-2 bg-green-100 rounded-md">
                <div className="flex items-center gap-2 text-sm">
                  <Info className="w-4 h-4 text-green-600" />
                  <span className="text-green-900">
                    {language === 'bn' 
                      ? `মোট: ${formatCurrency(userCart.total)} (${userCart.items.length} আইটেম)` 
                      : `Total: ${formatCurrency(userCart.total)} (${userCart.items.length} items)`}
                  </span>
                </div>
              </div>
            </div>
          </label>

          {/* Keep Guest Option */}
          <label className={cn(
            'flex items-start gap-3 p-4 border rounded-lg cursor-pointer transition-all',
            selectedOption === 'keep_guest' 
              ? 'border-purple-500 bg-purple-50' 
              : 'border-gray-200 hover:border-gray-300'
          )}>
            <input
              type="radio"
              name="mergeOption"
              value="keep_guest"
              checked={selectedOption === 'keep_guest'}
              onChange={() => handleOptionSelect('keep_guest')}
              className="mt-1 h-4 w-4 text-purple-600 border-gray-300 focus:ring-purple-500"
              disabled={isLoading || isConfirming}
            />
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <ShoppingCart className="w-5 h-5 text-purple-600" />
                <span className="font-medium text-gray-900">
                  {language === 'bn' ? 'গেস্ট কার্ট রাখুন' : 'Keep Guest Cart'}
                </span>
              </div>
              <p className="text-sm text-gray-600">
                {language === 'bn' 
                  ? 'শুধুমাত্র গেস্ট কার্ট রাখুন এবং ব্যবহারকারী কার্ট বাতিল করুন।' 
                  : 'Keep only the guest cart and discard your user cart.'}
              </p>
              <div className="mt-2 p-2 bg-purple-100 rounded-md">
                <div className="flex items-center gap-2 text-sm">
                  <Info className="w-4 h-4 text-purple-600" />
                  <span className="text-purple-900">
                    {language === 'bn' 
                      ? `মোট: ${formatCurrency(guestCart.total)} (${guestCart.items.length} আইটেম)` 
                      : `Total: ${formatCurrency(guestCart.total)} (${guestCart.items.length} items)`}
                  </span>
                </div>
              </div>
            </div>
          </label>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3">
        <button
          type="button"
          onClick={handleSkip}
          disabled={isLoading || isConfirming}
          className="flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-medium transition-all duration-200 border border-gray-300 text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <X className="w-5 h-5" />
          <span>
            {language === 'bn' ? 'বাদ দিন' : 'Skip'}
          </span>
        </button>
        
        <button
          type="button"
          onClick={handleMergeConfirm}
          disabled={isLoading || isConfirming}
          className="flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-medium transition-all duration-200 bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isConfirming ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-t-2 border-white"></div>
              <span>
                {language === 'bn' ? 'মার্জ হচ্ছে...' : 'Merging...'}
              </span>
            </>
          ) : (
            <>
              <CheckCircle className="w-5 h-5" />
              <span>
                {language === 'bn' ? 'মার্জ করুন' : 'Merge'}
              </span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default GuestCartMergePrompt;
