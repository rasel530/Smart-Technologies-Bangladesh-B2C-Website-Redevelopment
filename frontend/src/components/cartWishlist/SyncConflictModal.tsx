/**
 * SyncConflictModal Component
 *
 * Modal for resolving sync conflicts
 * Following Phase 6 Milestone 3 specifications
 */

'use client';

import React from 'react';
import { AlertTriangle, ShoppingCart, Heart, GitMerge, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCartWishlistStore } from '@/store/cartWishlistStore';
import { formatConflictType } from '@/utils/cartWishlistUtils';

// ============================================================================
// Types
// ============================================================================

export interface SyncConflictModalProps {
  conflict: {
    id: string;
    type: string;
    data: any;
    timestamp: string;
  };
  open: boolean;
  onClose: () => void;
  onResolve: (resolution: 'keep_cart' | 'keep_wishlist' | 'merge') => void;
  language?: 'en' | 'bn';
}

// ============================================================================
// Component
// ============================================================================

export const SyncConflictModal: React.FC<SyncConflictModalProps> = ({
  conflict,
  open,
  onClose,
  onResolve,
  language = 'en',
}) => {
  const { resolveConflict } = useCartWishlistStore();
  
  // Translations
  const translations = {
    en: {
      title: 'Sync Conflict',
      conflictType: 'Conflict Type',
      cartVersion: 'Cart Version',
      wishlistVersion: 'Wishlist Version',
      keepCart: 'Keep Cart',
      keepWishlist: 'Keep Wishlist',
      merge: 'Merge Both',
      resolve: 'Resolve',
      cancel: 'Cancel',
      preview: 'Preview Result',
      description: 'A conflict was detected between your cart and wishlist. Please choose how to resolve it.',
    },
    bn: {
      title: 'সিঙ্ক কনফ্লিক্ট',
      conflictType: 'কনফ্লিক্টের ধরন',
      cartVersion: 'কার্ট সংস্করণ',
      wishlistVersion: 'উইশলিস্ট সংস্করণ',
      keepCart: 'কার্ট রাখুন',
      keepWishlist: 'উইশলিস্ট রাখুন',
      merge: 'উভয় করুন',
      resolve: 'সমাধান করুন',
      cancel: 'বাতিল',
      preview: 'ফলাফত ফলাফত',
      description: 'আপনার কার্ট এবং উইশলিস্টের মধ্যে একটি কনফ্লিক্ট সনাক্ত হয়েছে। দয়া করবেন কিভাবে এটি সমাধান করবেন।',
    },
  };
  
  const t = translations[language];
  
  const handleResolve = async (resolution: 'keep_cart' | 'keep_wishlist' | 'merge') => {
    await resolveConflict(conflict.id, resolution);
    onResolve(resolution);
  };
  
  if (!open) {
    return null;
  }
  
  const conflictTypeLabel = formatConflictType(conflict.type);
  const cartData = conflict.data?.cart || {};
  const wishlistData = conflict.data?.wishlist || {};
  
  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      role="dialog"
      aria-modal="true"
      aria-labelledby="conflict-modal-title"
    >
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-100 rounded-full">
              <AlertTriangle className="w-6 h-6 text-yellow-600" aria-hidden="true" />
            </div>
            <h2
              id="conflict-modal-title"
              className="text-lg font-semibold text-gray-900"
            >
              {t.title}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-gray-400"
            aria-label={t.cancel}
          >
            <X className="w-5 h-5 text-gray-500" aria-hidden="true" />
          </button>
        </div>
        
        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Description */}
          <p className="text-sm text-gray-600 mb-6">
            {t.description}
          </p>
          
          {/* Conflict Details */}
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm font-medium text-gray-700">
                {t.conflictType}:
              </span>
              <span className="text-sm text-gray-900">
                {conflictTypeLabel}
              </span>
            </div>
            
            {/* Version Comparison */}
            <div className="grid grid-cols-2 gap-4">
              {/* Cart Version */}
              <div className="border border-blue-200 rounded-lg p-4 bg-blue-50">
                <div className="flex items-center gap-2 mb-3">
                  <ShoppingCart className="w-5 h-5 text-blue-600" aria-hidden="true" />
                  <h3 className="text-sm font-semibold text-blue-900">
                    {t.cartVersion}
                  </h3>
                </div>
                
                {/* Cart Data */}
                <div className="space-y-2 text-sm">
                  {cartData.quantity && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Quantity:</span>
                      <span className="font-medium text-gray-900">
                        {cartData.quantity}
                      </span>
                    </div>
                  )}
                  {cartData.price && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Price:</span>
                      <span className="font-medium text-gray-900">
                        ৳{Number(cartData.price).toFixed(2)}
                      </span>
                    </div>
                  )}
                  {cartData.variant && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Variant:</span>
                      <span className="font-medium text-gray-900">
                        {cartData.variant}
                      </span>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Wishlist Version */}
              <div className="border border-purple-200 rounded-lg p-4 bg-purple-50">
                <div className="flex items-center gap-2 mb-3">
                  <Heart className="w-5 h-5 text-purple-600" aria-hidden="true" />
                  <h3 className="text-sm font-semibold text-purple-900">
                    {t.wishlistVersion}
                  </h3>
                </div>
                
                {/* Wishlist Data */}
                <div className="space-y-2 text-sm">
                  {wishlistData.quantity && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Quantity:</span>
                      <span className="font-medium text-gray-900">
                        {wishlistData.quantity}
                      </span>
                    </div>
                  )}
                  {wishlistData.price && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Price:</span>
                      <span className="font-medium text-gray-900">
                        ৳{Number(wishlistData.price).toFixed(2)}
                      </span>
                    </div>
                  )}
                  {wishlistData.variant && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Variant:</span>
                      <span className="font-medium text-gray-900">
                        {wishlistData.variant}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          {/* Preview Result */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="flex items-center gap-2 mb-2">
              <GitMerge className="w-4 h-4 text-gray-600" aria-hidden="true" />
              <h3 className="text-sm font-semibold text-gray-900">
                {t.preview}
              </h3>
            </div>
            <p className="text-xs text-gray-600">
              {conflict.type === 'quantity_mismatch' && 'Merged quantity will be the sum of both versions.'}
              {conflict.type === 'price_mismatch' && 'Merged price will use the latest updated price.'}
              {conflict.type === 'variant_mismatch' && 'Merged variant will be selected from the most recent update.'}
              {conflict.type === 'duplicate_item' && 'Duplicate items will be merged into a single entry.'}
            </p>
          </div>
        </div>
        
        {/* Footer - Resolution Options */}
        <div className="p-6 border-t border-gray-200">
          <div className="grid grid-cols-3 gap-3">
            {/* Keep Cart */}
            <button
              type="button"
              onClick={() => handleResolve('keep_cart')}
              className={cn(
                'flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all',
                'border-blue-200 hover:border-blue-400 hover:bg-blue-50',
                'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1'
              )}
            >
              <ShoppingCart className="w-6 h-6 text-blue-600" aria-hidden="true" />
              <span className="text-sm font-medium text-blue-900">
                {t.keepCart}
              </span>
            </button>
            
            {/* Keep Wishlist */}
            <button
              type="button"
              onClick={() => handleResolve('keep_wishlist')}
              className={cn(
                'flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all',
                'border-purple-200 hover:border-purple-400 hover:bg-purple-50',
                'focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-1'
              )}
            >
              <Heart className="w-6 h-6 text-purple-600" aria-hidden="true" />
              <span className="text-sm font-medium text-purple-900">
                {t.keepWishlist}
              </span>
            </button>
            
            {/* Merge */}
            <button
              type="button"
              onClick={() => handleResolve('merge')}
              className={cn(
                'flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all',
                'border-green-200 hover:border-green-400 hover:bg-green-50',
                'focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-1'
              )}
            >
              <GitMerge className="w-6 h-6 text-green-600" aria-hidden="true" />
              <span className="text-sm font-medium text-green-900">
                {t.merge}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SyncConflictModal;
