'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Trash2, Plus, Minus, ImageOff, Heart } from 'lucide-react';
import { toast } from 'sonner';
import { CartItem as CartItemType, CartItemProps } from '@/types/cart';
import { cn } from '@/lib/utils';
import { getProductPrice, hasValidDiscount } from '@/lib/utils/price';
import { MoveToWishlistButton } from './MoveToWishlistButton';

const CDN_URL = process.env.NEXT_PUBLIC_CDN_URL || '';

const formatCurrency = (amount: any): string => {
  const num = typeof amount === 'number' ? amount : parseFloat(amount || '0');
  return `৳${isNaN(num) ? '0.00' : num.toFixed(2)}`;
};

const CartItem: React.FC<CartItemProps> = ({
  item,
  onUpdateQuantity,
  onRemove,
  onLoadCart,
  language = 'en',
  showTax = false,
  taxRate = 0,
  isInWishlist = false,
}) => {
  const [quantity, setQuantity] = useState(item.quantity);
  const [isUpdating, setIsUpdating] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [isImageLoading, setIsImageLoading] = useState(true);

  const productName = language === 'bn' && item.product?.nameBn
    ? item.product.nameBn
    : item.product?.name || 'Unknown Product';

  // Fix 1: Product Images - Improved CDN URL handling with proper null checks and debugging
  const getProductImage = (): string => {
    let imageUrl = '/placeholder-product.png';
    if (item.product?.images && item.product.images.length > 0) {
      const firstImage = item.product.images[0];
      // Handle both string URLs and image objects
      if (typeof firstImage === 'string') {
        imageUrl = firstImage;
      } else if (typeof firstImage === 'object' && firstImage !== null) {
        const imageObj = firstImage as any;
        imageUrl = imageObj.originalUrl || imageObj.optimizedUrl || imageObj.thumbnailUrl || imageObj.url || '/placeholder-product.png';
      }
    }
    
    // Debug logging for troubleshooting
    console.log('[CartItem] Image debug:', {
      productId: item.product?.id,
      productName: item.product?.name || 'Unknown',
      images: item.product?.images,
      firstImage: item.product?.images?.[0],
      imageUrl,
      CDN_URL,
    });
    
    // If image is already a full URL (http/https), use it directly
    if (typeof imageUrl === 'string' && (imageUrl.startsWith('http://') || imageUrl.startsWith('https://'))) {
      return imageUrl;
    }
    
    // If image starts with /, prepend CDN_URL only if it's valid and doesn't already start with /
    if (typeof imageUrl === 'string' && imageUrl.startsWith('/')) {
      if (CDN_URL && CDN_URL.length > 0) {
        // Remove trailing slash from CDN_URL if present, then concatenate
        const normalizedCdnUrl = CDN_URL.replace(/\/$/, '');
        return `${normalizedCdnUrl}${imageUrl}`;
      }
      return imageUrl;
    }
    
    // For relative paths (without leading /), prepend CDN_URL with /
    if (typeof imageUrl === 'string' && imageUrl.length > 0) {
      if (CDN_URL && CDN_URL.length > 0) {
        const normalizedCdnUrl = CDN_URL.replace(/\/$/, '');
        return `${normalizedCdnUrl}/${imageUrl}`;
      }
      return `/${imageUrl}`;
    }
    
    // Final fallback
    return '/placeholder-product.png';
  };

  const handleQuantityChange = async (newQuantity: number) => {
    if (newQuantity < 1 || newQuantity > 99) return;
    if (newQuantity === quantity) return;

    // Optimistic UI update
    const previousQuantity = quantity;
    setQuantity(newQuantity);
    setIsUpdating(true);

    try {
      await onUpdateQuantity(item.id, newQuantity);
    } catch (error) {
      // Revert quantity on error
      console.error('Error updating quantity:', error);
      setQuantity(previousQuantity);
      // Error toast is shown by the context
    } finally {
      setIsUpdating(false);
    }
  };

  const handleRemove = async () => {
    // BUG-FIX: Prevent rapid successive removals by checking if already updating
    if (isUpdating) {
      console.warn('[CartItem] Removal already in progress, skipping');
      return;
    }
    
    if (window.confirm(language === 'bn' ? 'আপনি কি এই আইটেমটি সরাতে চান?' : 'Are you sure you want to remove this item?')) {
      setIsUpdating(true);
      try {
        // BUG-FIX: Set a timeout to ensure loading state is cleared even if something goes wrong
        const timeoutId = setTimeout(() => {
          setIsUpdating(false);
        }, 5000); // 5 second safety timeout
        
        await onRemove(item.id);
        
        // Clear the safety timeout if successful
        clearTimeout(timeoutId);
      } catch (error) {
        console.error('Error removing item:', error);
        // BUG-FIX: Show user-friendly error message
        toast.error(language === 'bn'
          ? 'আইটেম সরাতে ব্যর্থ হয়েছে'
          : 'Failed to remove item');
      } finally {
        // BUG-FIX: Always clear updating state
        setIsUpdating(false);
      }
    }
  };

  const incrementQuantity = () => {
    handleQuantityChange(quantity + 1);
  };

  const decrementQuantity = () => {
    handleQuantityChange(quantity - 1);
  };

  // Fix 2: Discount Display - Calculate and show savings
  const hasDiscount = item.product?.salePrice && Number(item.product.salePrice) > 0 && Number(item.product.salePrice) < Number(item.product?.regularPrice);
  const regularPrice = Number(item.product?.regularPrice || item.price);
  const salePrice = hasDiscount ? Number(item.product.salePrice) : regularPrice;
  const savings = hasDiscount ? regularPrice - salePrice : 0;
  const savingsPercent = hasDiscount ? Math.round((savings / regularPrice) * 100) : 0;
  
  // Debug logging for price data
  console.log('[CartItem] Price debug:', {
    productId: item.product?.id,
    productName: item.product?.name,
    regularPrice: item.product?.regularPrice,
    salePrice: item.product?.salePrice,
    itemPrice: item.price,
    itemSubtotal: item.subtotal,
    hasDiscount,
    finalPrice: salePrice,
    calculatedSubtotal: salePrice * item.quantity,
    // DIAGNOSTIC: Check what price should be used for display
    displayPrice: hasDiscount ? salePrice : item.price,
  });

  return (
    <div className="relative border-b border-gray-200 py-4 last:border-b-0">
      {/* Product content wrapper */}
      <div className="flex gap-4">
        {/* Product Image */}
        <div className="relative w-24 h-24 flex-shrink-0 sm:w-32 sm:h-32">
          <Link href={`/products/${item.product?.slug || ''}`}>
            {imageError ? (
              // Fallback placeholder when image fails
              <div className="w-full h-full bg-gray-100 rounded-md flex items-center justify-center">
                <ImageOff className="w-8 h-8 text-gray-400" />
              </div>
            ) : (
              <Image
                src={getProductImage()}
                alt={productName}
                fill
                unoptimized={true}
                className={cn(
                  "object-cover rounded-md transition-opacity duration-300",
                  isImageLoading ? "opacity-0" : "opacity-100"
                )}
                sizes="(max-width: 640px) 96px, 128px"
                onLoad={() => setIsImageLoading(false)}
                onError={() => {
                  setImageError(true);
                  setIsImageLoading(false);
                }}
              />
            )}
          </Link>
          {/* Loading overlay for image */}
          {isImageLoading && !imageError && (
            <div className="absolute inset-0 bg-gray-100 rounded-md animate-pulse" />
          )}
        </div>

        {/* Product Details */}
        <div className="flex-1 min-w-0">
          {/* Product Name */}
          <Link
            href={`/products/${item.product?.slug || ''}`}
            className="text-sm sm:text-base font-semibold text-gray-900 hover:text-blue-600 transition-colors line-clamp-2"
          >
            {productName}
          </Link>

          {/* SKU */}
          {item.product?.sku && (
            <p className="text-xs text-gray-500 mt-1">
              {language === 'bn' ? 'এসকেউ' : 'SKU'}: {item.product.sku}
            </p>
          )}

          {/* Price */}
          <div className="mt-2">
            {/* Show discount/sale price with original crossed out */}
            {hasDiscount ? (
              <div className="flex flex-col gap-1">
                <div className="flex items-baseline gap-2 flex-wrap">
                  {/* Original price with line-through */}
                  <p className="text-sm sm:text-base font-semibold text-gray-500 line-through">
                    {formatCurrency(regularPrice)}
                  </p>
                  {/* Discounted price */}
                  <p className="text-sm sm:text-base font-bold text-red-600">
                    {formatCurrency(salePrice)}
                  </p>
                  <span className="text-xs font-semibold text-green-600 bg-green-50 px-2 py-0.5 rounded">
                    -{savingsPercent}%
                  </span>
                </div>
                <p className="text-xs text-green-600 font-medium">
                  {language === 'bn' ? `(৳${savings.toLocaleString()} সাশ্রয়)` : `(Save ৳${savings.toLocaleString()})`}
                </p>
              </div>
            ) : (
              <p className="text-sm sm:text-base font-semibold text-gray-900">
                {formatCurrency(item.price)}
              </p>
            )}
          </div>

          {/* Quantity Controls */}
          <div className="mt-3 flex items-center gap-3">
            <div className="flex items-center border border-gray-300 rounded-md">
              <button
                type="button"
                onClick={decrementQuantity}
                disabled={quantity <= 1 || isUpdating}
                aria-label={language === 'bn' ? 'পরিমাণ কমান' : 'Decrease quantity'}
                className={cn(
                  "p-3 sm:p-2 hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed",
                  "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
                )}
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="w-10 text-center text-sm font-medium">
                {quantity}
              </span>
              <button
                type="button"
                onClick={incrementQuantity}
                disabled={quantity >= 99 || isUpdating}
                aria-label={language === 'bn' ? 'পরিমাণ বাড়ান' : 'Increase quantity'}
                className={cn(
                  "p-3 sm:p-2 hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed",
                  "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
                )}
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            {/* Subtotal - calculated using discounted price */}
            <div className="ml-auto text-right">
              <p className="text-sm font-semibold text-gray-900">
                {language === 'bn' ? 'উপমোট' : 'Subtotal'}: {language === 'bn' ? '৳' : '৳'}{Number(salePrice * quantity).toFixed(2)}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-3 flex items-center gap-2">
            {/* Move to Wishlist Button */}
            <MoveToWishlistButton
              itemId={item.id}
              productId={item.productId}
              variantId={item.variantId}
              quantity={item.quantity}
              onSuccess={() => {
                // Trigger cart reload after successful move
                onLoadCart?.();
              }}
              onError={(error) => console.error('Move to wishlist error:', error)}
              language={language}
              showLabel={true}
              disabled={isUpdating}
            />
            
            {/* Remove Button */}
            <button
              type="button"
              onClick={handleRemove}
              disabled={isUpdating}
              aria-label={language === 'bn' ? 'আইটেম সরান' : 'Remove item'}
              className={cn(
                "flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:text-red-700",
                "transition-colors disabled:opacity-50 disabled:cursor-not-allowed",
                "focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1 rounded"
              )}
            >
              <Trash2 className="w-4 h-4" />
              <span>{language === 'bn' ? 'সরান' : 'Remove'}</span>
            </button>
          </div>
          
          {/* Wishlist Indicator */}
          {isInWishlist && (
            <div className="mt-2 flex items-center gap-1 text-xs text-purple-600">
              <Heart className="w-3 h-3" aria-hidden="true" />
              <span>{language === 'bn' ? 'উইশলিস্টে আছে' : 'In wishlist'}</span>
            </div>
          )}
        </div>
      </div>

      {/* Loading Overlay - MED-005: Fixed positioning with relative parent */}
      {isUpdating && (
        <div className="absolute inset-0 bg-white/70 flex items-center justify-center z-10">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        </div>
      )}
    </div>
  );
};

export default CartItem;
