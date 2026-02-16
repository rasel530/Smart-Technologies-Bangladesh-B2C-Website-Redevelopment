'use client';

import React from 'react';
import { ShoppingBag, ArrowRight, Loader2 } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import CartItem from './CartItem';
import CartSummary from './CartSummary';
import { CartPageProps } from '@/types/cart';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const CartPage: React.FC<CartPageProps> = ({ language = 'en' }) => {
  const router = useRouter();
  const {
    items,
    itemCount,
    subtotal,
    tax,
    shippingCost,
    discount,
    total,
    isLoading,
    error,
    shippingMethod,
    discountCode,
    updateQuantity,
    removeItem,
    applyDiscount,
    removeDiscount,
    setShippingMethod,
  } = useCart();

  // Calculate tax rate as percentage
  const taxRate = subtotal > 0 ? (tax / subtotal) * 100 : 0;

  const handleCheckout = () => {
    router.push('/checkout');
  };

  const handleContinueShopping = () => {
    router.push('/products');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">
            {language === 'bn' ? 'কার্ট লোড হচ্ছে...' : 'Loading cart...'}
          </p>
        </div>
      </div>
    );
  }

  // Empty Cart State - Only show when genuinely empty and not loading
  if (items.length === 0 && !isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 sm:py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center py-16">
            <ShoppingBag className="w-24 h-24 text-gray-300 mx-auto mb-6" />
            <h1 className="text-2xl sm:text-3xl font-semibold text-gray-900 mb-2">
              {language === 'bn' ? 'আপনার কার্ট খালি' : 'Your cart is empty'}
            </h1>
            <p className="text-gray-600 mb-8 max-w-md mx-auto">
              {language === 'bn'
                ? 'আপনি এখনো কোনো আইটেম আপনার কার্টে যোগ করেননি। আমাদের পণ্যসমূহ দেখুন এবং কিছু খুঁজুন!'
                : 'You haven\'t added any items to your cart yet. Browse our products and find something you like!'}
            </p>
            <Link
              href="/products"
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
            >
              {language === 'bn' ? 'কেনাকাটা শুরু করুন' : 'Start Shopping'}
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 sm:py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-semibold text-gray-900 mb-2">
            {language === 'bn' ? 'শপিং কার্ট' : 'Shopping Cart'}
          </h1>
          <p className="text-gray-600">
            {language === 'bn' ? `${itemCount} আইটেম` : `${itemCount} ${itemCount === 1 ? 'item' : 'items'}`}
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {/* Cart Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              {items.map((item) => (
                <CartItem
                  key={item.id}
                  item={item}
                  onUpdateQuantity={updateQuantity}
                  onRemove={removeItem}
                  language={language}
                  showTax={tax > 0}
                  taxRate={taxRate}
                />
              ))}
            </div>

            {/* Continue Shopping Button */}
            <div className="mt-6">
              <button
                type="button"
                onClick={handleContinueShopping}
                className={cn(
                  "inline-flex items-center gap-2 px-6 py-3 border border-gray-300",
                  "text-gray-700 font-medium rounded-md",
                  "hover:bg-gray-50 transition-colors",
                  "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
                )}
              >
                <ArrowRight className="w-4 h-4 rotate-180" />
                {language === 'bn' ? 'কেনাকাটা চালিয়ে যান' : 'Continue Shopping'}
              </button>
            </div>
          </div>

          {/* Cart Summary */}
          <div className="lg:col-span-1">
            <div className="sticky top-[140px] sm:top-4">
              <CartSummary
                subtotal={subtotal}
                tax={tax}
                shippingCost={shippingCost}
                discount={discount}
                total={total}
                itemCount={itemCount}
                shippingMethod={shippingMethod}
                discountCode={discountCode}
                onApplyDiscount={applyDiscount}
                onRemoveDiscount={removeDiscount}
                onSetShippingMethod={setShippingMethod}
                onCheckout={handleCheckout}
                language={language}
                isLoading={isLoading}
              />
            </div>
          </div>
        </div>

        {/* Trust Badges */}
        <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="flex items-center gap-3 p-4 bg-white rounded-lg border border-gray-200">
            <div className="flex-shrink-0">
              <svg className="w-8 h-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900">
                {language === 'bn' ? 'নিরাপদ পেমেন্ট' : 'Secure Payment'}
              </h3>
              <p className="text-xs text-gray-600">
                {language === 'bn' ? '100% নিরাপদ' : '100% secure'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-4 bg-white rounded-lg border border-gray-200">
            <div className="flex-shrink-0">
              <svg className="w-8 h-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900">
                {language === 'bn' ? 'দ্রুত ডেলিভারি' : 'Fast Delivery'}
              </h3>
              <p className="text-xs text-gray-600">
                {language === 'bn' ? '3-5 কার্যদিবস' : '3-5 business days'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-4 bg-white rounded-lg border border-gray-200">
            <div className="flex-shrink-0">
              <svg className="w-8 h-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900">
                {language === 'bn' ? 'সহজ রিটার্ন' : 'Easy Returns'}
              </h3>
              <p className="text-xs text-gray-600">
                {language === 'bn' ? '7 দিনের রিটার্ন পলিসি' : '7 days return policy'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-4 bg-white rounded-lg border border-gray-200">
            <div className="flex-shrink-0">
              <svg className="w-8 h-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900">
                {language === 'bn' ? '24/7 সাপোর্ট' : '24/7 Support'}
              </h3>
              <p className="text-xs text-gray-600">
                {language === 'bn' ? 'সর্বদা আপনার পাশে' : 'Always here to help'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartPage;
