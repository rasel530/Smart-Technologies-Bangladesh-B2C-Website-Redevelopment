/**
 * AddToWishlistButton Component
 *
 * Button component to add products to wishlist
 */

'use client';

import React, { useState, useCallback } from 'react';
import { useWishlistContext } from '@/contexts/WishlistContext';
import { wishlistMessages } from '@/types/wishlist';
import type { AddToWishlistButtonProps } from '@/types/wishlist';

export const AddToWishlistButton: React.FC<AddToWishlistButtonProps> = ({
  productId,
  wishlistId,
  variant,
  language = 'en',
  className = '',
}) => {
  const { addToWishlist, isInWishlist } = useWishlistContext();
  const [isLoading, setIsLoading] = useState(false);
  
  const messages = wishlistMessages[language];
  
  const inWishlist = isInWishlist(productId, wishlistId);
  
  const handleClick = useCallback(async () => {
    try {
      setIsLoading(true);
      await addToWishlist(productId, wishlistId);
      variant?.onSuccess?.();
    } catch (error) {
      variant?.onError?.(error as Error);
    } finally {
      setIsLoading(false);
    }
  }, [productId, wishlistId, addToWishlist, variant]);
  
  return (
    <button
      onClick={handleClick}
      disabled={isLoading}
      className={`add-to-wishlist-button ${inWishlist ? 'in-wishlist' : ''} ${className}`}
      aria-label={inWishlist ? messages.removeFromWishlist : messages.addToWishlist}
      title={inWishlist ? messages.removeFromWishlist : messages.addToWishlist}
    >
      {isLoading ? (
        <span className="loading-spinner" />
      ) : inWishlist ? (
        <span className="wishlist-icon filled">♥</span>
      ) : (
        <span className="wishlist-icon">♡</span>
      )}
      <span className="button-text">
        {inWishlist ? messages.removeFromWishlist : messages.addToWishlist}
      </span>
    </button>
  );
};

export default AddToWishlistButton;
