/**
 * UnifiedCartWishlistView Component
 *
 * Combined view of cart and wishlist items
 * Following Phase 6 Milestone 3 specifications
 */

'use client';

import React, { useState } from 'react';
import { ShoppingCart, Heart, RefreshCw, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCartWishlistStore } from '@/store/cartWishlistStore';
import { checkItemInWishlist, checkItemInCart } from '@/utils/cartWishlistUtils';

// ============================================================================
// Types
// ============================================================================

export interface UnifiedViewProps {
  userId?: string;
  language?: 'en' | 'bn';
  className?: string;
}

export interface CartItem {
  id: string;
  productId: string;
  variantId?: string;
  quantity: number;
  product?: {
    id: string;
    name?: string;
    nameBn?: string;
    images?: any[];
    price?: number;
    regularPrice?: number;
    salePrice?: number;
  };
}

export interface WishlistItem {
  id: string;
  productId: string;
  wishlistId: string;
  product?: {
    id: string;
    name?: string;
    nameBn?: string;
    images?: any[];
    price?: number;
    regularPrice?: number;
    salePrice?: number;
  };
}

// ============================================================================
// Component
// ============================================================================

export const UnifiedCartWishlistView: React.FC<UnifiedViewProps> = ({
  userId,
  language = 'en',
  className = '',
}) => {
  const [activeTab, setActiveTab] = useState<'cart' | 'wishlist'>('cart');
  const [selectedCartItems, setSelectedCartItems] = useState<string[]>([]);
  const [selectedWishlistItems, setSelectedWishlistItems] = useState<string[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [draggedItem, setDraggedItem] = useState<any>(null);
  
  const { syncStatus } = useCartWishlistStore();
  
  // Translations
  const translations = {
    en: {
      cart: 'Cart',
      wishlist: 'Wishlist',
      cartItems: 'Cart Items',
      wishlistItems: 'Wishlist Items',
      emptyCart: 'Your cart is empty',
      emptyWishlist: 'Your wishlist is empty',
      selectAll: 'Select All',
      clearSelection: 'Clear Selection',
      moveToWishlist: 'Move to Wishlist',
      moveToCart: 'Move to Cart',
      price: 'Price',
      quantity: 'Quantity',
      subtotal: 'Subtotal',
      remove: 'Remove',
    },
    bn: {
      cart: 'কার্ট',
      wishlist: 'উইশলিস্ট',
      cartItems: 'কার্ট আইটেম',
      wishlistItems: 'উইশলিস্ট আইটেম',
      emptyCart: 'আপনার কার্ট খালি',
      emptyWishlist: 'আপনার উইশলিস্ট খালি',
      selectAll: 'সব নির্বাচন করুন',
      clearSelection: 'নির্বাচন সাফ করুন',
      moveToWishlist: 'উইশলিস্টে সরান',
      moveToCart: 'কার্টে সরান',
      price: 'মূল্য',
      quantity: 'পরিমাণ',
      subtotal: 'উপমোট',
      remove: 'সরান',
    },
  };
  
  const t = translations[language];
  
  // Mock data for demonstration
  const mockCartItems: CartItem[] = [];
  const mockWishlistItems: WishlistItem[] = [];
  
  const handleTabChange = (tab: 'cart' | 'wishlist') => {
    setActiveTab(tab);
    setSelectedCartItems([]);
    setSelectedWishlistItems([]);
  };
  
  const handleCartItemSelect = (itemId: string) => {
    setSelectedCartItems((prev) =>
      prev.includes(itemId)
        ? prev.filter((id) => id !== itemId)
        : [...prev, itemId]
    );
  };
  
  const handleWishlistItemSelect = (itemId: string) => {
    setSelectedWishlistItems((prev) =>
      prev.includes(itemId)
        ? prev.filter((id) => id !== itemId)
        : [...prev, itemId]
    );
  };
  
  const handleSelectAllCart = () => {
    setSelectedCartItems(mockCartItems.map((item) => item.id));
  };
  
  const handleSelectAllWishlist = () => {
    setSelectedWishlistItems(mockWishlistItems.map((item) => item.id));
  };
  
  const handleClearSelection = () => {
    setSelectedCartItems([]);
    setSelectedWishlistItems([]);
  };
  
  const handleDragStart = (e: React.DragEvent, item: any) => {
    setIsDragging(true);
    setDraggedItem(item);
    if (e.dataTransfer) {
      e.dataTransfer.effectAllowed = 'move';
    }
  };
  
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer!.dropEffect = 'move';
  };
  
  const handleDrop = (e: React.DragEvent, targetTab: 'cart' | 'wishlist') => {
    e.preventDefault();
    setIsDragging(false);
    
    if (draggedItem && targetTab !== activeTab) {
      // Move item to the other tab
      // This would trigger the appropriate API call
      console.log('Move item:', draggedItem, 'to:', targetTab);
    }
    
    setDraggedItem(null);
  };
  
  const handleDragEnd = () => {
    setIsDragging(false);
    setDraggedItem(null);
  };
  
  const formatPrice = (price: number | undefined): string => {
    if (price === undefined) return '৳0.00';
    return `৳${price.toFixed(2)}`;
  };
  
  const getProductName = (product: any): string => {
    if (language === 'bn' && product.nameBn) {
      return product.nameBn;
    }
    return product.name || 'Unknown Product';
  };
  
  return (
    <div className={cn('w-full', className)}>
      {/* Tabs */}
      <div className="flex border-b border-gray-200 mb-4">
        <button
          type="button"
          onClick={() => handleTabChange('cart')}
          className={cn(
            'flex items-center gap-2 px-6 py-3 text-sm font-medium transition-colors',
            activeTab === 'cart'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-500 border-b-2 border-transparent hover:text-gray-700'
          )}
        >
          <ShoppingCart className="w-4 h-4" aria-hidden="true" />
          <span>{t.cart}</span>
          {mockCartItems.length > 0 && (
            <span className="ml-1 bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full text-xs">
              {mockCartItems.length}
            </span>
          )}
        </button>
        
        <button
          type="button"
          onClick={() => handleTabChange('wishlist')}
          className={cn(
            'flex items-center gap-2 px-6 py-3 text-sm font-medium transition-colors',
            activeTab === 'wishlist'
              ? 'text-purple-600 border-b-2 border-purple-600'
              : 'text-gray-500 border-b-2 border-transparent hover:text-gray-700'
          )}
        >
          <Heart className="w-4 h-4" aria-hidden="true" />
          <span>{t.wishlist}</span>
          {mockWishlistItems.length > 0 && (
            <span className="ml-1 bg-purple-100 text-purple-800 px-2 py-0.5 rounded-full text-xs">
              {mockWishlistItems.length}
            </span>
          )}
        </button>
      </div>
      
      {/* Sync Status Indicator */}
      <div className="flex items-center justify-between mb-4 px-4 py-2 bg-gray-50 rounded-lg">
        <div className="flex items-center gap-2">
          <RefreshCw className={cn(
            'w-4 h-4',
            syncStatus.status === 'syncing' && 'animate-spin'
          )} aria-hidden="true" />
          <span className="text-sm text-gray-600">
            {syncStatus.status === 'syncing' ? 'Syncing...' : `Last sync: ${new Date(syncStatus.lastSyncAt).toLocaleString()}`}
          </span>
        </div>
        {syncStatus.pendingOperations > 0 && (
          <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">
            {syncStatus.pendingOperations} pending
          </span>
        )}
      </div>
      
      {/* Toolbar */}
      <div className="flex items-center justify-between mb-4 px-4">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={activeTab === 'cart' ? handleSelectAllCart : handleSelectAllWishlist}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            {t.selectAll}
          </button>
          <button
            type="button"
            onClick={handleClearSelection}
            className="text-sm text-gray-600 hover:text-gray-700 font-medium"
          >
            {t.clearSelection}
          </button>
        </div>
        
        {/* Bulk Actions */}
        {activeTab === 'cart' && selectedCartItems.length > 0 && (
          <button
            type="button"
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium bg-purple-50 text-purple-700 hover:bg-purple-100 rounded-md transition-colors"
          >
            <Heart className="w-4 h-4" aria-hidden="true" />
            <span>{t.moveToWishlist}</span>
          </button>
        )}
        
        {activeTab === 'wishlist' && selectedWishlistItems.length > 0 && (
          <button
            type="button"
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-md transition-colors"
          >
            <ShoppingCart className="w-4 h-4" aria-hidden="true" />
            <span>{t.moveToCart}</span>
          </button>
        )}
      </div>
      
      {/* Content Area */}
      <div className="px-4">
        {/* Cart Tab Content */}
        {activeTab === 'cart' && (
          <div className="space-y-4">
            {mockCartItems.length === 0 ? (
              <div className="text-center py-12">
                <ShoppingCart className="w-16 h-16 text-gray-300 mx-auto mb-4" aria-hidden="true" />
                <p className="text-gray-500">{t.emptyCart}</p>
              </div>
            ) : (
              mockCartItems.map((item) => (
                <div
                  key={item.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, item)}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, 'wishlist')}
                  onDragEnd={handleDragEnd}
                  className={cn(
                    'flex items-center gap-4 p-4 border rounded-lg transition-all',
                    selectedCartItems.includes(item.id)
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300 bg-white'
                  )}
                >
                  {/* Checkbox */}
                  <input
                    type="checkbox"
                    checked={selectedCartItems.includes(item.id)}
                    onChange={() => handleCartItemSelect(item.id)}
                    className="w-4 h-4 rounded"
                    aria-label={`Select ${getProductName(item.product)}`}
                  />
                  
                  {/* Product Image */}
                  <div className="w-16 h-16 bg-gray-100 rounded-md flex-shrink-0" />
                  
                  {/* Product Details */}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-medium text-gray-900 mb-1">
                      {getProductName(item.product)}
                    </h3>
                    <div className="flex items-center gap-4">
                      <span className="text-sm text-gray-600">
                        {t.price}:
                      </span>
                      <span className="text-sm font-medium text-gray-900">
                        {formatPrice(item.product?.price)}
                      </span>
                      <span className="text-sm text-gray-600">
                        {t.quantity}:
                      </span>
                      <span className="text-sm font-medium text-gray-900">
                        {item.quantity}
                      </span>
                    </div>
                  </div>
                  
                  {/* Remove Button */}
                  <button
                    type="button"
                    className="p-2 hover:bg-red-50 rounded-md transition-colors"
                    aria-label={`Remove ${getProductName(item.product)}`}
                  >
                    <X className="w-4 h-4 text-red-600" aria-hidden="true" />
                  </button>
                </div>
              ))
            )}
          </div>
        )}
        
        {/* Wishlist Tab Content */}
        {activeTab === 'wishlist' && (
          <div className="space-y-4">
            {mockWishlistItems.length === 0 ? (
              <div className="text-center py-12">
                <Heart className="w-16 h-16 text-gray-300 mx-auto mb-4" aria-hidden="true" />
                <p className="text-gray-500">{t.emptyWishlist}</p>
              </div>
            ) : (
              mockWishlistItems.map((item) => (
                <div
                  key={item.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, item)}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, 'cart')}
                  onDragEnd={handleDragEnd}
                  className={cn(
                    'flex items-center gap-4 p-4 border rounded-lg transition-all',
                    selectedWishlistItems.includes(item.id)
                      ? 'border-purple-500 bg-purple-50'
                      : 'border-gray-200 hover:border-gray-300 bg-white'
                  )}
                >
                  {/* Checkbox */}
                  <input
                    type="checkbox"
                    checked={selectedWishlistItems.includes(item.id)}
                    onChange={() => handleWishlistItemSelect(item.id)}
                    className="w-4 h-4 rounded"
                    aria-label={`Select ${getProductName(item.product)}`}
                  />
                  
                  {/* Product Image */}
                  <div className="w-16 h-16 bg-gray-100 rounded-md flex-shrink-0" />
                  
                  {/* Product Details */}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-medium text-gray-900 mb-1">
                      {getProductName(item.product)}
                    </h3>
                    <div className="flex items-center gap-4">
                      <span className="text-sm text-gray-600">
                        {t.price}:
                      </span>
                      <span className="text-sm font-medium text-gray-900">
                        {formatPrice(item.product?.price)}
                      </span>
                    </div>
                  </div>
                  
                  {/* Move to Cart Button */}
                  <button
                    type="button"
                    className="p-2 hover:bg-blue-50 rounded-md transition-colors"
                    aria-label={`Move ${getProductName(item.product)} to cart`}
                  >
                    <ShoppingCart className="w-4 h-4 text-blue-600" aria-hidden="true" />
                  </button>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default UnifiedCartWishlistView;
