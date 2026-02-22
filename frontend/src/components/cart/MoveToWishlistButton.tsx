/**
 * MoveToWishlistButton Component
 *
 * Button to move a single cart item to wishlist
 * Following Phase 6 Milestone 3 specifications
 */

'use client';

import React, { useState } from 'react';
import { Heart, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import cartWishlistApi from '@/lib/api/cartWishlistApi';
import { useCartWishlistStore } from '@/store/cartWishlistStore';
import { isOnline } from '@/utils/cartWishlistUtils';

// ============================================================================
// Types
// ============================================================================

export interface MoveToWishlistButtonProps {
  itemId: string;
  productId: string;
  variantId?: string;
  quantity: number;
  onSuccess?: () => void;
  onError?: (error: Error) => void;
  language?: 'en' | 'bn';
  className?: string;
  showLabel?: boolean;
  disabled?: boolean;
}

// ============================================================================
// Component
// ============================================================================

export const MoveToWishlistButton: React.FC<MoveToWishlistButtonProps> = ({
  itemId,
  productId,
  variantId,
  quantity,
  onSuccess,
  onError,
  language = 'en',
  className = '',
  showLabel = true,
  disabled = false,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [showWishlistModal, setShowWishlistModal] = useState(false);
  const [selectedWishlist, setSelectedWishlist] = useState<string | null>(null);
  
  const { addToOfflineQueue } = useCartWishlistStore();
  
  // Translations
  const translations = {
    en: {
      moveToWishlist: 'Move to Wishlist',
      moving: 'Moving...',
      success: 'Item moved to wishlist',
      error: 'Failed to move to wishlist',
      confirmMove: 'Move this item to wishlist?',
      selectWishlist: 'Select Wishlist',
      cancel: 'Cancel',
      confirm: 'Confirm',
      offline: 'Offline - will sync when online',
    },
    bn: {
      moveToWishlist: 'উইশলিস্টে সরান',
      moving: 'সরানো হচ্ছে...',
      success: 'আইটেম উইশলিস্টে সরানো হয়েছে',
      error: 'উইশলিস্টে সরাতে ব্যর্থ হয়েছে',
      confirmMove: 'আপনি কি এই আইটেমটি উইশলিস্টে সরাতে চান?',
      selectWishlist: 'উইশলিস্ট নির্বাচন করুন',
      cancel: 'বাতিল',
      confirm: 'নিশ্চিত করুন',
      offline: 'অফলাইন - অনলাইন হলে সিঙ্ক হবে',
    },
  };
  
  const t = translations[language];
  
  const handleMoveToWishlist = async (wishlistId?: string) => {
    setIsLoading(true);
    
    try {
      // Check if online
      if (!isOnline()) {
        // Add to offline queue
        addToOfflineQueue({
          id: `move_${itemId}_${Date.now()}`,
          type: 'move_to_wishlist',
          data: {
            itemId,
            productId,
            variantId,
            quantity,
            wishlistId,
          },
          timestamp: new Date().toISOString(),
          status: 'pending',
        });
        
        setIsLoading(false);
        toast.success(t.offline);
        onSuccess?.();
        return;
      }
      
      // Move to wishlist
      await cartWishlistApi.moveCartItemToWishlist(itemId, wishlistId);
      
      setIsLoading(false);
      setShowWishlistModal(false);
      toast.success(t.success);
      onSuccess?.();
    } catch (error) {
      setIsLoading(false);
      const errorObj = error instanceof Error ? error : new Error(t.error);
      toast.error(errorObj.message || t.error);
      onError?.(errorObj);
    }
  };
  
  const handleClick = () => {
    // Direct move without wishlist selection for now
    // Can be enhanced to show wishlist selection modal
    handleMoveToWishlist();
  };
  
  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        disabled={isLoading || disabled}
        className={cn(
          'flex items-center gap-2 px-3 py-2 rounded-md transition-colors',
          'text-sm font-medium',
          'bg-purple-50 text-purple-700 hover:bg-purple-100',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          'focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-1',
          className
        )}
        aria-label={t.moveToWishlist}
        aria-busy={isLoading}
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
        ) : (
          <Heart className="w-4 h-4" aria-hidden="true" />
        )}
        {showLabel && (
          <span>
            {isLoading ? t.moving : t.moveToWishlist}
          </span>
        )}
      </button>
      
      {/* Wishlist Selection Modal (can be enhanced later) */}
      {showWishlistModal && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          role="dialog"
          aria-modal="true"
          aria-labelledby="wishlist-modal-title"
        >
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
            <h2
              id="wishlist-modal-title"
              className="text-lg font-semibold text-gray-900 mb-4"
            >
              {t.selectWishlist}
            </h2>
            
            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={() => setShowWishlistModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
              >
                {t.cancel}
              </button>
              <button
                type="button"
                onClick={() => handleMoveToWishlist(selectedWishlist || undefined)}
                className="px-4 py-2 text-sm font-medium bg-purple-600 text-white hover:bg-purple-700 rounded-md transition-colors"
              >
                {t.confirm}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default MoveToWishlistButton;
