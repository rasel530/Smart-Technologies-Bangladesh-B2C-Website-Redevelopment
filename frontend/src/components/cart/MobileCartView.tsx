'use client';

import React, { useState } from 'react';
import { ShoppingBag, ChevronRight, X, Filter, Search } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * MobileCartView Component
 * Mobile-optimized cart interface
 * Features:
 * - Mobile-optimized cart layout
 * - Compact design for small screens
 * - Touch-friendly interface
 * - Swipe gestures for item actions
 */
interface MobileCartViewProps {
  itemCount?: number;
  totalAmount?: number;
  onCheckout?: () => void;
  onFilter?: () => void;
  onSearch?: () => void;
  language?: 'en' | 'bn';
  className?: string;
  children?: React.ReactNode;
}

const MobileCartView: React.FC<MobileCartViewProps> = ({
  itemCount = 0,
  totalAmount = 0,
  onCheckout,
  onFilter,
  onSearch,
  language = 'en',
  className,
  children
}) => {
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const formatCurrency = (value: number): string => {
    return `৳${value.toLocaleString('en-BD', { minimumFractionDigits: 2 })}`;
  };

  const handleFilterToggle = () => {
    setIsFilterOpen(!isFilterOpen);
    onFilter?.();
  };

  const handleSearchToggle = () => {
    setIsSearchOpen(!isSearchOpen);
    onSearch?.();
  };

  return (
    <div className={cn('min-h-screen bg-gray-50', className)}>
      {/* Mobile Header */}
      <div className="sticky top-0 z-50 bg-white shadow-sm border-b border-gray-200">
        <div className="flex items-center justify-between px-4 py-3">
          {/* Back Button */}
          <button
            className="p-2 -ml-2 text-gray-600 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label={language === 'bn' ? 'ফিরে যান' : 'Go back'}
          >
            <ChevronRight className="w-5 h-5 rotate-180" aria-hidden="true" />
          </button>

          {/* Title */}
          <h1 className="text-lg font-semibold text-gray-900">
            {language === 'bn' ? 'শপিং কার্ট' : 'Shopping Cart'}
          </h1>

          {/* Cart Icon */}
          <div className="relative p-2 -mr-2">
            <ShoppingBag className="w-5 h-5 text-gray-600" aria-hidden="true" />
            {itemCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-blue-600 text-white text-xs font-bold rounded-full flex items-center justify-center">
                {itemCount}
              </span>
            )}
          </div>
        </div>

        {/* Search Bar (Collapsible) */}
        {isSearchOpen && (
          <div className="px-4 pb-3 border-t border-gray-100">
            <div className="relative">
              <input
                type="text"
                placeholder={language === 'bn' ? 'কার্টে অনুসন্ধান করুন...' : 'Search in cart...'}
                className="w-full pl-10 pr-4 py-2 bg-gray-100 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                aria-label={language === 'bn' ? 'কার্টে অনুসন্ধান করুন' : 'Search in cart'}
              />
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" aria-hidden="true" />
              <button
                onClick={handleSearchToggle}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                aria-label={language === 'bn' ? 'অনুসন্ধান বন্ধ করুন' : 'Close search'}
              >
                <X className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>
          </div>
        )}

        {/* Action Bar */}
        <div className="flex items-center justify-between px-4 py-2 border-t border-gray-100">
          <div className="flex items-center gap-2">
            {/* Filter Button */}
            <button
              onClick={handleFilterToggle}
              className={cn(
                'flex items-center gap-1 px-3 py-1.5 rounded-full text-sm transition-colors',
                isFilterOpen 
                  ? 'bg-blue-100 text-blue-700' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              )}
              aria-label={language === 'bn' ? 'ফিল্টার' : 'Filter'}
              aria-pressed={isFilterOpen}
            >
              <Filter className="w-4 h-4" aria-hidden="true" />
              <span>{language === 'bn' ? 'ফিল্টার' : 'Filter'}</span>
            </button>

            {/* Search Button */}
            <button
              onClick={handleSearchToggle}
              className={cn(
                'flex items-center gap-1 px-3 py-1.5 rounded-full text-sm transition-colors',
                isSearchOpen 
                  ? 'bg-blue-100 text-blue-700' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              )}
              aria-label={language === 'bn' ? 'অনুসন্ধান' : 'Search'}
              aria-pressed={isSearchOpen}
            >
              <Search className="w-4 h-4" aria-hidden="true" />
              <span>{language === 'bn' ? 'অনুসন্ধান' : 'Search'}</span>
            </button>
          </div>

          {/* Item Count */}
          <span className="text-sm text-gray-600">
            {itemCount} {itemCount === 1 
              ? (language === 'bn' ? 'আইটেম' : 'item') 
              : (language === 'bn' ? 'আইটেম' : 'items')
            }
          </span>
        </div>
      </div>

      {/* Cart Content */}
      <div className="pb-24">
        {/* Empty State */}
        {itemCount === 0 && (
          <div className="flex flex-col items-center justify-center py-16 px-4">
            <ShoppingBag className="w-16 h-16 text-gray-300 mb-4" aria-hidden="true" />
            <h2 className="text-lg font-semibold text-gray-900 mb-2">
              {language === 'bn' ? 'আপনার কার্ট খালি' : 'Your cart is empty'}
            </h2>
            <p className="text-sm text-gray-600 text-center mb-4">
              {language === 'bn' 
                ? 'কেনাকারী শুরু করতে কিছু পণ্য যোগ করুন।'
                : 'Add some items to start shopping.'
              }
            </p>
            <button
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-full text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label={language === 'bn' ? 'কেনাকারী শুরু করুন' : 'Start shopping'}
            >
              {language === 'bn' ? 'কেনাকারী শুরু করুন' : 'Start Shopping'}
            </button>
          </div>
        )}

        {/* Cart Items */}
        {itemCount > 0 && (
          <div className="px-4 py-4 space-y-3">
            {children}
          </div>
        )}
      </div>

      {/* Bottom Checkout Bar */}
      {itemCount > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-50">
          <div className="px-4 py-3">
            {/* Total Amount */}
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-gray-600">
                {language === 'bn' ? 'মোট পরিমাণ' : 'Total Amount'}
              </span>
              <span className="text-xl font-bold text-gray-900">
                {formatCurrency(totalAmount)}
              </span>
            </div>

            {/* Checkout Button */}
            <button
              onClick={onCheckout}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 active:scale-[0.98]"
              aria-label={language === 'bn' ? 'চেকআউট করুন' : 'Proceed to checkout'}
            >
              {language === 'bn' ? 'চেকআউট করুন' : 'Proceed to Checkout'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MobileCartView;
