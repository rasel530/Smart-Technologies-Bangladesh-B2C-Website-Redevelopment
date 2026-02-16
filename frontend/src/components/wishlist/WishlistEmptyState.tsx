/**
 * WishlistEmptyState Component
 *
 * Visually engaging empty state display for wishlist with minimalist iconography
 */

'use client';

import React from 'react';
import { wishlistMessages } from '@/types/wishlist';
import type { WishlistEmptyStateProps } from '@/types/wishlist';

export const WishlistEmptyState: React.FC<WishlistEmptyStateProps> = ({
  hasFilters,
  onClearFilters,
  language = 'en',
}) => {
  const messages = wishlistMessages[language];
  
  return (
    <div className="wishlist-empty-state" role="status" aria-live="polite">
      <div className="empty-state-content">
        {/* Minimalist Heart Icon */}
        <div className="empty-icon-wrapper" aria-hidden="true">
          <svg
            className="empty-icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            aria-hidden="true"
          >
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
          </svg>
        </div>
        
        <h2 className="empty-title" id="empty-state-title">
          {hasFilters ? messages.emptyWithFilters : messages.emptyTitle}
        </h2>
        
        {!hasFilters && (
          <p className="empty-description" id="empty-state-description">
            {messages.emptyDescription}
          </p>
        )}
        
        {hasFilters ? (
          <button
            onClick={onClearFilters}
            className="clear-filters-button"
            aria-label={messages.clearFilters}
            type="button"
          >
            {messages.clearFilters}
          </button>
        ) : (
          <a
            href="/products"
            className="start-shopping-button"
            aria-label="Browse products and start shopping"
            role="link"
          >
            <span className="button-text">Start Shopping</span>
            <svg
              className="arrow-icon"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden="true"
            >
              <line x1="5" y1="12" x2="19" y2="12" />
              <polyline points="12 5 19 12 12 19" />
            </svg>
          </a>
        )}
      </div>
    </div>
  );
};

export default WishlistEmptyState;
