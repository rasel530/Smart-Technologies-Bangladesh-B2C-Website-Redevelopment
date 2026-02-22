'use client';

import React, { useState } from 'react';
import { Trash2, Plus, Minus, Image as ImageIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * MobileCartItem Component
 * Compact cart item component for mobile
 * Features:
 * - Compact cart item display
 * - Show essential information only
 * - Quick quantity adjustment
 * - Swipe to delete
 */
interface MobileCartItemProps {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image?: string | null;
  variant?: string;
  onQuantityChange?: (id: string, quantity: number) => void;
  onRemove?: (id: string) => void;
  language?: 'en' | 'bn';
  className?: string;
  swipeToDelete?: boolean;
}

const MobileCartItem: React.FC<MobileCartItemProps> = ({
  id,
  name,
  price,
  quantity,
  image,
  variant,
  onQuantityChange,
  onRemove,
  language = 'en',
  className,
  swipeToDelete = true
}) => {
  const [swipeProgress, setSwipeProgress] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);

  const formatCurrency = (value: number): string => {
    return `৳${value.toLocaleString('en-BD', { minimumFractionDigits: 2 })}`;
  };

  const handleQuantityChange = (newQuantity: number) => {
    if (newQuantity > 0 && newQuantity !== quantity) {
      onQuantityChange?.(id, newQuantity);
    }
  };

  const handleRemove = () => {
    onRemove?.(id);
  };

  // Touch/Swipe handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    if (!swipeToDelete) return;
    setIsDragging(true);
    setStartX(e.touches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!swipeToDelete || !isDragging) return;
    
    const currentX = e.touches[0].clientX;
    const diff = startX - currentX;
    
    // Only allow swipe to the left
    if (diff > 0) {
      const progress = Math.min(diff / 100, 1);
      setSwipeProgress(progress);
    }
  };

  const handleTouchEnd = () => {
    if (!swipeToDelete || !isDragging) return;
    setIsDragging(false);
    
    // If swiped more than 50%, remove item
    if (swipeProgress > 0.5) {
      handleRemove();
    }
    
    setSwipeProgress(0);
  };

  // Mouse handlers for desktop testing
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!swipeToDelete) return;
    setIsDragging(true);
    setStartX(e.clientX);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!swipeToDelete || !isDragging) return;
    
    const currentX = e.clientX;
    const diff = startX - currentX;
    
    if (diff > 0) {
      const progress = Math.min(diff / 100, 1);
      setSwipeProgress(progress);
    }
  };

  const handleMouseUp = () => {
    if (!swipeToDelete || !isDragging) return;
    setIsDragging(false);
    
    if (swipeProgress > 0.5) {
      handleRemove();
    }
    
    setSwipeProgress(0);
  };

  return (
    <div
      className={cn('relative overflow-hidden bg-white rounded-lg shadow-sm border border-gray-200', className)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {/* Delete Action (Revealed on swipe) */}
      <div
        className="absolute inset-y-0 right-0 bg-red-500 flex items-center justify-end transition-transform duration-200"
        style={{ transform: `translateX(${swipeProgress * 100}%)` }}
      >
        <div className="flex items-center gap-2 px-4 text-white">
          <Trash2 className="w-5 h-5" aria-hidden="true" />
          <span className="font-medium">
            {language === 'bn' ? 'মুছে ফেলুন' : 'Delete'}
          </span>
        </div>
      </div>

      {/* Cart Item Content */}
      <div
        className="flex items-center gap-3 p-3 transition-transform duration-200"
        style={{ transform: `translateX(-${swipeProgress * 100}%)` }}
      >
        {/* Product Image */}
        <div className="flex-shrink-0 w-20 h-20 bg-gray-100 rounded-lg overflow-hidden">
          {image ? (
            <img
              src={image}
              alt={name}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <ImageIcon className="w-8 h-8 text-gray-400" aria-hidden="true" />
            </div>
          )}
        </div>

        {/* Product Details */}
        <div className="flex-1 min-w-0">
          {/* Product Name */}
          <h3 className="text-sm font-medium text-gray-900 truncate mb-1">
            {name}
          </h3>

          {/* Variant */}
          {variant && (
            <p className="text-xs text-gray-500 truncate mb-2">
              {variant}
            </p>
          )}

          {/* Price and Quantity */}
          <div className="flex items-center justify-between">
            {/* Price */}
            <span className="text-sm font-semibold text-gray-900">
              {formatCurrency(price)}
            </span>

            {/* Quantity Controls */}
            <div className="flex items-center gap-1">
              {/* Decrease Button */}
              <button
                onClick={() => handleQuantityChange(quantity - 1)}
                disabled={quantity <= 1}
                className={cn(
                  'w-8 h-8 rounded-lg flex items-center justify-center transition-colors',
                  quantity <= 1
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 active:bg-gray-300'
                )}
                aria-label={language === 'bn' ? 'পরিমাণ কমান' : 'Decrease quantity'}
              >
                <Minus className="w-4 h-4" aria-hidden="true" />
              </button>

              {/* Quantity Display */}
              <span className="w-10 text-center text-sm font-medium text-gray-900">
                {quantity}
              </span>

              {/* Increase Button */}
              <button
                onClick={() => handleQuantityChange(quantity + 1)}
                className="w-8 h-8 bg-gray-100 text-gray-700 rounded-lg flex items-center justify-center hover:bg-gray-200 active:bg-gray-300 transition-colors"
                aria-label={language === 'bn' ? 'পরিমাণ বাড়ান' : 'Increase quantity'}
              >
                <Plus className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>
          </div>
        </div>

        {/* Total Price */}
        <div className="flex-shrink-0 text-right">
          <span className="text-sm font-semibold text-blue-600">
            {formatCurrency(price * quantity)}
          </span>
        </div>
      </div>

      {/* Swipe Hint */}
      {swipeToDelete && swipeProgress === 0 && (
        <div className="absolute bottom-1 right-3 flex items-center gap-1">
          <div className="flex gap-0.5">
            <div className="w-1 h-1 bg-gray-300 rounded-full" aria-hidden="true"></div>
            <div className="w-1 h-1 bg-gray-300 rounded-full" aria-hidden="true"></div>
            <div className="w-1 h-1 bg-gray-300 rounded-full" aria-hidden="true"></div>
          </div>
          <span className="text-xs text-gray-400">
            {language === 'bn' ? 'সোয়াইপ' : 'swipe'}
          </span>
        </div>
      )}
    </div>
  );
};

export default MobileCartItem;
