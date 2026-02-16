'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { ShoppingCart, X } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { CartIconProps } from '@/types/cart';
import { cn } from '@/lib/utils';

const CartIcon: React.FC<CartIconProps> = ({
  itemCount,
  onClick,
  showPreview = false,
  language = 'en',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      setIsOpen(!isOpen);
    }
  };

  const cartLabel = language === 'bn' ? 'কার্ট' : 'Cart';
  const emptyCartMessage = language === 'bn'
    ? 'আপনার কার্ট খালি'
    : 'Your cart is empty';
  const viewCartText = language === 'bn' ? 'কার্ট দেখুন' : 'View Cart';

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Cart Icon Button */}
      <button
        type="button"
        onClick={handleClick}
        className={cn(
          "relative p-2 rounded-md transition-colors",
          "hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1",
          "text-gray-700 hover:text-blue-600"
        )}
        aria-label={`${cartLabel} (${itemCount} ${language === 'bn' ? 'আইটেম' : 'items'})`}
      >
        <ShoppingCart className="w-6 h-6" />
        
        {/* Badge */}
        {itemCount > 0 && (
          <span
            className={cn(
              "absolute -top-1 -right-1",
              "flex items-center justify-center",
              "min-w-[20px] h-5 px-1",
              "bg-blue-600 text-white text-xs font-semibold rounded-full",
              "animate-in zoom-in-95 duration-200"
            )}
          >
            {itemCount > 99 ? '99+' : itemCount}
          </span>
        )}
      </button>

      {/* Dropdown Preview */}
      {showPreview && isOpen && (
        <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-white rounded-lg shadow-xl border border-gray-200 z-50">
          {/* Dropdown Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
            <h3 className="font-semibold text-gray-900">
              {cartLabel}
            </h3>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="p-1 text-gray-500 hover:text-gray-700 transition-colors"
              aria-label={language === 'bn' ? 'বন্ধ করুন' : 'Close'}
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Dropdown Content */}
          <div className="p-4 max-h-96 overflow-y-auto">
            {itemCount > 0 ? (
              <div className="space-y-4">
                {/* Cart Preview Items */}
                <div className="text-sm text-gray-600">
                  {language === 'bn'
                    ? `${itemCount} আইটেম আপনার কার্টে`
                    : `${itemCount} ${itemCount === 1 ? 'item' : 'items'} in your cart`
                  }
                </div>

                {/* View Cart Button */}
                <Link
                  href="/cart"
                  onClick={() => setIsOpen(false)}
                  className={cn(
                    "w-full inline-flex items-center justify-center gap-2",
                    "px-4 py-2 bg-blue-600 text-white font-medium rounded-md",
                    "hover:bg-blue-700 transition-colors",
                    "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
                  )}
                >
                  <ShoppingCart className="w-4 h-4" />
                  {viewCartText}
                </Link>
              </div>
            ) : (
              /* Empty Cart State */
              <div className="text-center py-8">
                <ShoppingCart className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-sm text-gray-600">{emptyCartMessage}</p>
              </div>
            )}
          </div>

          {/* Dropdown Footer */}
          <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 rounded-b-lg">
            <Link
              href="/cart"
              onClick={() => setIsOpen(false)}
              className="block text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors"
            >
              {viewCartText}
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default CartIcon;
