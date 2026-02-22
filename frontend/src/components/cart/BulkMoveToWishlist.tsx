/**
 * BulkMoveToWishlist Component
 *
 * Bulk action component to move selected cart items to wishlist
 * Following Phase 6 Milestone 3 specifications
 */

'use client';

import React, { useState } from 'react';
import { Heart, Loader2, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import cartWishlistApi from '@/lib/api/cartWishlistApi';
import { useCartWishlistStore } from '@/store/cartWishlistStore';
import { isOnline } from '@/utils/cartWishlistUtils';

// ============================================================================
// Types
// ============================================================================

export interface BulkMoveToWishlistProps {
  selectedItems: string[];
  onSuccess?: (moved: number) => void;
  onError?: (error: Error) => void;
  onClearSelection?: () => void;
  language?: 'en' | 'bn';
  className?: string;
  disabled?: boolean;
}

// ============================================================================
// Component
// ============================================================================

export const BulkMoveToWishlist: React.FC<BulkMoveToWishlistProps> = ({
  selectedItems,
  onSuccess,
  onError,
  onClearSelection,
  language = 'en',
  className = '',
  disabled = false,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [progress, setProgress] = useState(0);
  
  const { addToOfflineQueue } = useCartWishlistStore();
  
  // Translations
  const translations = {
    en: {
      moveToWishlist: 'Move to Wishlist',
      moveSelected: 'Move Selected to Wishlist',
      moving: 'Moving...',
      confirmTitle: 'Move Items to Wishlist',
      confirmMessage: `Are you sure you want to move ${selectedItems.length} item(s) to wishlist?`,
      cancel: 'Cancel',
      confirm: 'Move',
      success: 'Items moved to wishlist',
      error: 'Failed to move items to wishlist',
      offline: 'Offline - will sync when online',
      noItemsSelected: 'No items selected',
    },
    bn: {
      moveToWishlist: 'উইশলিস্টে সরান',
      moveSelected: 'নির্বাচিত আইটেমগুলি উইশলিস্টে সরান',
      moving: 'সরানো হচ্ছে...',
      confirmTitle: 'আইটেমগুলি উইশলিস্টে সরান',
      confirmMessage: `আপনি কি ${selectedItems.length}টি আইটেম উইশলিস্টে সরাতে চান?`,
      cancel: 'বাতিল',
      confirm: 'সরান',
      success: 'আইটেমগুলি উইশলিস্টে সরানো হয়েছে',
      error: 'আইটেমগুলি উইশলিস্টে সরাতে ব্যর্থ হয়েছে',
      offline: 'অফলাইন - অনলাইন হলে সিঙ্ক হবে',
      noItemsSelected: 'কোনো আইটেম নির্বাচিত হয়নি',
    },
  };
  
  const t = translations[language];
  
  const isDisabled = disabled || selectedItems.length === 0 || isLoading;
  
  const handleMoveToWishlist = async () => {
    setIsLoading(true);
    setProgress(0);
    
    try {
      // Check if online
      if (!isOnline()) {
        // Add all items to offline queue
        selectedItems.forEach((itemId, index) => {
          addToOfflineQueue({
            id: `bulk_move_${itemId}_${Date.now()}`,
            type: 'bulk_move_to_wishlist',
            data: { itemId },
            timestamp: new Date().toISOString(),
            status: 'pending',
          });
          
          setProgress(Math.round(((index + 1) / selectedItems.length) * 100));
        });
        
        setIsLoading(false);
        setShowConfirmDialog(false);
        onSuccess?.(selectedItems.length);
        onClearSelection?.();
        return;
      }
      
      // Bulk move to wishlist
      const response = await cartWishlistApi.bulkMoveCartItemsToWishlist(selectedItems);
      
      setProgress(100);
      setIsLoading(false);
      setShowConfirmDialog(false);
      
      if (response.success) {
        onSuccess?.(response.moved);
        onClearSelection?.();
      }
    } catch (error) {
      setIsLoading(false);
      setProgress(0);
      const errorObj = error instanceof Error ? error : new Error(t.error);
      onError?.(errorObj);
    }
  };
  
  const handleClick = () => {
    if (selectedItems.length === 0) {
      return;
    }
    setShowConfirmDialog(true);
  };
  
  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        disabled={isDisabled}
        className={cn(
          'flex items-center gap-2 px-4 py-2 rounded-md transition-colors',
          'text-sm font-medium',
          'bg-purple-50 text-purple-700 hover:bg-purple-100',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          'focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-1',
          className
        )}
        aria-label={t.moveSelected}
        aria-busy={isLoading}
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
        ) : (
          <Heart className="w-4 h-4" aria-hidden="true" />
        )}
        <span>
          {isLoading ? t.moving : t.moveToWishlist}
        </span>
        {selectedItems.length > 0 && (
          <span className="ml-1 bg-purple-200 text-purple-800 px-2 py-0.5 rounded-full text-xs">
            {selectedItems.length}
          </span>
        )}
      </button>
      
      {/* Confirmation Dialog */}
      {showConfirmDialog && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          role="dialog"
          aria-modal="true"
          aria-labelledby="confirm-dialog-title"
        >
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
            <div className="flex items-start gap-3 mb-4">
              <div className="flex-shrink-0 p-2 bg-yellow-100 rounded-full">
                <AlertCircle className="w-6 h-6 text-yellow-600" aria-hidden="true" />
              </div>
              <div className="flex-1">
                <h3
                  id="confirm-dialog-title"
                  className="text-lg font-semibold text-gray-900"
                >
                  {t.confirmTitle}
                </h3>
                <p className="mt-2 text-sm text-gray-600">
                  {t.confirmMessage}
                </p>
              </div>
            </div>
            
            {/* Progress Indicator */}
            {isLoading && progress > 0 && (
              <div className="mb-4">
                <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
                  <span>{t.moving}</span>
                  <span>{progress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                    role="progressbar"
                    aria-valuenow={progress}
                    aria-valuemin={0}
                    aria-valuemax={100}
                  />
                </div>
              </div>
            )}
            
            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={() => {
                  setShowConfirmDialog(false);
                  setProgress(0);
                }}
                disabled={isLoading}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {t.cancel}
              </button>
              <button
                type="button"
                onClick={handleMoveToWishlist}
                disabled={isLoading}
                className="px-4 py-2 text-sm font-medium bg-purple-600 text-white hover:bg-purple-700 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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

export default BulkMoveToWishlist;
