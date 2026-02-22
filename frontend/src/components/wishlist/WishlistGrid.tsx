/**
 * WishlistGrid Component
 *
 * Responsive grid layout for displaying wishlist items
 * Features: shimmering skeleton loaders, responsive breakpoints
 */

'use client';

import React from 'react';
import { WishlistItemCard } from './WishlistItemCard';
import type { WishlistGridProps } from '@/types/wishlist';

export const WishlistGrid: React.FC<WishlistGridProps> = ({
  items,
  selectedItems,
  onSelectItem,
  onRemoveItem,
  onMoveToCart,
  onViewProduct,
  isLoading,
  language = 'en',
}) => {
  if (isLoading) {
    return (
      <div className="wishlist-grid loading">
        {Array.from({ length: 8 }).map((_, index) => (
          <div key={index} className="wishlist-item-card skeleton">
            {/* Skeleton Checkbox */}
            <div className="item-checkbox">
              <div className="skeleton-box" />
            </div>
            
            {/* Skeleton Image */}
            <div className="item-image-container">
              <div className="skeleton-image" />
            </div>
            
            {/* Skeleton Details */}
            <div className="item-details">
              <div className="skeleton-text skeleton-title" />
              <div className="skeleton-text skeleton-sku" />
              <div className="skeleton-text skeleton-category" />
              <div className="skeleton-price">
                <div className="skeleton-text skeleton-price-current" />
              </div>
              <div className="skeleton-button" />
            </div>
          </div>
        ))}
      </div>
    );
  }
  
  if (items.length === 0) {
    return null;
  }
  
  return (
    <div className="wishlist-grid" role="list" aria-label="Wishlist items">
      {items.map((item) => (
        <WishlistItemCard
          key={item.id}
          item={item}
          isSelected={selectedItems.includes(item.id)}
          onSelect={() => onSelectItem(item.id)}
          onRemove={() => onRemoveItem(item.id)}
          onMoveToCart={() => onMoveToCart(item.id)}
          onViewProduct={() => onViewProduct(item.product.slug)}
          language={language}
        />
      ))}
    </div>
  );
};

export default WishlistGrid;
