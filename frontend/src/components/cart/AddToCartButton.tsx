'use client';

import React, { useState, useCallback } from 'react';
import { ShoppingCart, Check, Loader2, AlertCircle, Minus, Plus } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Product } from '@/types/product';
import { AddToCartButtonProps } from '@/types/cart';
import { cn } from '@/lib/utils';

/**
 * Enhanced AddToCartButton Component
 * 
 * Provides a complete "Add to Cart" user experience with:
 * - Click event handling with loading state prevention
 * - Product data validation
 * - User authentication check
 * - API request with proper error handling
 * - Loading, success, and error states with user feedback
 * - Automatic navigation to cart on success
 * - Cart count update after successful add
 */
const AddToCartButton: React.FC<AddToCartButtonProps> = ({
  product,
  variantId = null,
  availableStock,
  disabled = false,
  className,
  language = 'en',
  quantity: initialQuantity = 1,
  showQuantitySelector = false,
  navigateToCart = true,
}) => {
  const { addItem, fetchCartCount } = useCart();
  const { data: session } = useSession();
  const router = useRouter();

  // Local state
  const [isAdding, setIsAdding] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(initialQuantity);

  // Determine stock from product or prop
  const stockQuantity = availableStock ?? product.stockQuantity ?? 0;
  const isOutOfStock = stockQuantity === 0;
  const isLowStock = stockQuantity > 0 && stockQuantity <= 5;
  const maxQuantity = Math.min(stockQuantity, 10); // Cap at 10 for UX

  /**
   * Get localized text based on language
   */
  const getText = useCallback((en: string, bn: string) => {
    return language === 'bn' ? bn : en;
  }, [language]);

  /**
   * Validate product data before adding to cart
   */
  const validateProduct = useCallback((): string | null => {
    if (!product) {
      return getText('Invalid product', 'অবৈধ পণ্য');
    }
    if (!product.id) {
      return getText('Product information is missing', 'পণ্যের তথ্য অনুপস্থিত');
    }
    if (product.regularPrice === undefined || product.regularPrice === null) {
      return getText('Product price is invalid', 'পণ্যের দাম অবৈধ');
    }
    return null;
  }, [product, getText]);

  /**
   * Validate quantity
   */
  const validateQuantity = useCallback((qty: number): string | null => {
    if (qty < 1) {
      return getText('Please select a valid quantity', 'অনুগ্রহ করে একটি বৈধ পরিমাণ নির্বাচন করুন');
    }
    if (qty > maxQuantity) {
      return getText(`Maximum ${maxQuantity} items available`, `সর্বোচ্চ ${maxQuantity}টি আইটেম পাওয়া যাচ্ছে`);
    }
    return null;
  }, [getText, maxQuantity]);

  /**
   * Handle quantity change
   */
  const handleQuantityChange = useCallback((newQuantity: number) => {
    if (newQuantity < 1) {
      setQuantity(1);
    } else if (newQuantity > maxQuantity) {
      setQuantity(maxQuantity);
    } else {
      setQuantity(newQuantity);
    }
    setError(null);
  }, [maxQuantity]);

  /**
   * Increment quantity
   */
  const handleIncrement = useCallback(() => {
    handleQuantityChange(quantity + 1);
  }, [quantity, handleQuantityChange]);

  /**
   * Decrement quantity
   */
  const handleDecrement = useCallback(() => {
    handleQuantityChange(quantity - 1);
  }, [quantity, handleQuantityChange]);

  /**
   * Main add to cart handler
   */
  const handleAddToCart = useCallback(async () => {
    // Prevent multiple clicks during loading
    if (disabled || isAdding || isOutOfStock) return;

    // Reset states
    setError(null);
    setShowSuccess(false);

    // Validate authentication
    if (!session) {
      toast.error(getText('Please log in to add items to your cart', 'আইটেম কার্টে যোগ করতে লগইন করুন'));
      // Optionally redirect to login
      router.push(`/login?callbackUrl=${window.location.pathname}`);
      return;
    }

    // Validate product data
    const productValidationError = validateProduct();
    if (productValidationError) {
      setError(productValidationError);
      toast.error(productValidationError);
      return;
    }

    // Validate quantity
    const quantityValidationError = validateQuantity(quantity);
    if (quantityValidationError) {
      setError(quantityValidationError);
      toast.error(quantityValidationError);
      return;
    }

    // Check stock
    if (isOutOfStock) {
      const outOfStockMessage = getText('Sorry, this item is out of stock', 'দুঃখিত, এই আইটেম স্টকে নেই');
      setError(outOfStockMessage);
      toast.error(outOfStockMessage);
      return;
    }

    setIsAdding(true);

    try {
      // Call addItem from CartContext with proper options
      await addItem(product, quantity, variantId, {
        onSuccess: async () => {
          // Update cart count
          await fetchCartCount();
          
          // Show success toast
          toast.success(
            getText(`${product.name} added to cart`, `${product.name} কার্টে যোগ হয়েছে`)
          );
          
          // Show success state
          setShowSuccess(true);
          setIsAdding(false);
          
          // Navigate to cart if requested
          if (navigateToCart) {
            setTimeout(() => {
              router.push('/cart');
            }, 1000);
          }
        },
        navigateToCart: navigateToCart,
      });

      // Reset success state after delay (if not navigating)
      if (!navigateToCart) {
        setTimeout(() => {
          setShowSuccess(false);
        }, 2000);
      }
    } catch (err: any) {
      console.error('[AddToCartButton] Error adding to cart:', err);
      
      setIsAdding(false);
      setShowSuccess(false);

      // Handle specific error types
      let errorMessage: string;

      if (err.message?.includes('Network') || err.message?.includes('fetch')) {
        errorMessage = getText(
          'Unable to connect. Please check your internet connection.',
          'সংযোগ করতে অক্ষত। অনুগ্রহ করে আপনার ইন্টারনেট সংযোগ পরীক্ষা করুন।'
        );
      } else if (err.message?.includes('stock') || err.message?.includes('out of stock')) {
        errorMessage = getText('Sorry, this item is out of stock', 'দুঃখিত, এই আইটেম স্টকে নেই');
      } else if (err.message?.includes('quantity') || err.message?.includes('valid quantity')) {
        errorMessage = getText('Please select a valid quantity', 'অনুগ্রহ করে একটি বৈধ পরিমাণ নির্বাচন করুন');
      } else if (err.status === 400 || err.status === 500) {
        // Use API error message if available
        errorMessage = err.message || getText('Failed to add item to cart', 'কার্টে আইটেম যোগ করতে ব্যর্থ হয়েছে');
      } else if (err.status === 401 || err.status === 403) {
        errorMessage = getText('Please log in to add items to your cart', 'আইটেম কার্টে যোগ করতে লগইন করুন');
        router.push(`/login?callbackUrl=${window.location.pathname}`);
      } else {
        errorMessage = err.message || getText('Failed to add item to cart', 'কার্টে আইটেম যোগ করতে ব্যর্থ হয়েছে');
      }

      setError(errorMessage);
      toast.error(errorMessage);
    }
  }, [
    disabled,
    isAdding,
    isOutOfStock,
    session,
    product,
    quantity,
    variantId,
    validateProduct,
    validateQuantity,
    getText,
    addItem,
    fetchCartCount,
    navigateToCart,
    router,
  ]);

  /**
   * Get button text based on state
   */
  const getButtonText = (): string => {
    if (isAdding) {
      return getText('Adding...', 'যোগ হচ্ছে...');
    }
    if (showSuccess) {
      return getText('Added!', 'যোগ হয়েছে!');
    }
    if (isOutOfStock) {
      return getText('Out of Stock', 'স্টক নেই');
    }
    return getText('Add to Cart', 'কার্টে যোগ করুন');
  };

  return (
    <div className="flex flex-col gap-3">
      {/* Quantity Selector */}
      {showQuantitySelector && !isOutOfStock && (
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {getText('Quantity:', 'পরিমাণ:')}
          </span>
          <div className="flex items-center border border-gray-300 dark:border-gray-600 rounded-md">
            <button
              type="button"
              onClick={handleDecrement}
              disabled={quantity <= 1 || isAdding}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              aria-label={getText('Decrease quantity', 'পরিমাণ কমান')}
            >
              <Minus className="w-4 h-4" />
            </button>
            <input
              type="number"
              value={quantity}
              onChange={(e) => handleQuantityChange(parseInt(e.target.value) || 1)}
              min={1}
              max={maxQuantity}
              disabled={isAdding}
              className="w-16 text-center border-none focus:outline-none focus:ring-0 bg-transparent py-2"
              aria-label={getText('Quantity', 'পরিমাণ')}
            />
            <button
              type="button"
              onClick={handleIncrement}
              disabled={quantity >= maxQuantity || isAdding}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              aria-label={getText('Increase quantity', 'পরিমাণ বাড়ান')}
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Add to Cart Button */}
      <button
        type="button"
        onClick={handleAddToCart}
        disabled={disabled || isOutOfStock || isAdding}
        className={cn(
          "inline-flex items-center justify-center gap-2 px-6 py-3",
          "text-base font-semibold rounded-md transition-all duration-200",
          "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          className,
          // Button styles based on state
          isOutOfStock
            ? "bg-gray-300 text-gray-600 cursor-not-allowed dark:bg-gray-700 dark:text-gray-400"
            : showSuccess
            ? "bg-green-600 text-white hover:bg-green-700 focus:ring-green-500"
            : "bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800 focus:ring-blue-500"
        )}
        aria-label={
          product
            ? `${getText('Add to cart', 'কার্টে যোগ করুন')}: ${product.name}`
            : getText('Add to cart', 'কার্টে যোগ করুন')
        }
      >
        {isAdding ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : showSuccess ? (
          <Check className="w-5 h-5" />
        ) : (
          <ShoppingCart className="w-5 h-5" />
        )}
        <span>{getButtonText()}</span>
      </button>

      {/* Stock Status Indicator */}
      {isLowStock && !isOutOfStock && !showSuccess && (
        <div className="flex items-center gap-2 text-sm text-orange-600 dark:text-orange-400">
          <AlertCircle className="w-4 h-4" />
          <span>
            {language === 'bn'
              ? `মাত্র ${stockQuantity} টি বাকি আছে`
              : `Only ${stockQuantity} left in stock`}
          </span>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400">
          <AlertCircle className="w-4 h-4" />
          <span>{error}</span>
        </div>
      )}

      {/* Success Message */}
      {showSuccess && (
        <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
          <Check className="w-4 h-4" />
          <span>
            {getText('Item added to cart', 'আইটেম কার্টে যোগ করা হয়েছে')}
            {navigateToCart && ` (${getText('Redirecting...', 'পুনঃনির্দেশিত হচ্ছে...')})`}
          </span>
        </div>
      )}
    </div>
  );
};

export default AddToCartButton;
