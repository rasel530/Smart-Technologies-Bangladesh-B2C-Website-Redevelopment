'use client';

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { ShoppingBag, ArrowRight, Loader2, Heart, Smartphone, Calculator, CreditCard, Truck, Info, ChevronDown, X } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import CartItem from './CartItem';
import CartSummary from './CartSummary';
import { BulkMoveToWishlist } from './BulkMoveToWishlist';
import { CartWishlistSyncIndicator } from '@/components/cartWishlist/CartWishlistSyncIndicator';
import { CartPageProps } from '@/types/cart';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCartWishlistStore } from '@/store/cartWishlistStore';
import cartWishlistApi from '@/lib/api/cartWishlistApi';
import { toast } from 'sonner';

// EMI Components
import EmiDisplay from './EmiDisplay';
import EmiSelector from './EmiSelector';
import EmiSummary from './EmiSummary';

// COD Components
import CodAvailabilityIndicator from './CodAvailabilityIndicator';
import CodFeeDisplay from './CodFeeDisplay';
import CodWarningBanner from './CodWarningBanner';

// Local Payment Components
import LocalPaymentMethodSelector from './LocalPaymentMethodSelector';
import LocalPaymentFeeDisplay from './LocalPaymentFeeDisplay';
import LocalPaymentInstructions from './LocalPaymentInstructions';

// UI Components
import Modal from '@/components/ui/Modal';
import Accordion from '@/components/ui/Accordion';
import Tabs from '@/components/ui/Tabs';

// Mobile Components
import MobileCartView from './MobileCartView';
import MobileCartItem from './MobileCartItem';
import MobileCartSummary from './MobileCartSummary';

// Offline Component
import OfflineCartIndicator from './OfflineCartIndicator';

// Types
import { EmiPlan, EmiDetails } from '@/types/emi';
import { LocalPaymentMethod, PaymentFeeResult } from '@/types/localPayment';

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
    loadCart,
  } = useCart();

  // Cart-wishlist integration state
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [showSyncQueue, setShowSyncQueue] = useState(false);
  
  // Get sync status from store
  const storeSyncStatus = useCartWishlistStore((state) => state.syncStatus);
  const offlineQueue = useCartWishlistStore((state) => state.offlineQueue);

  // Mobile/Offline State
  const [isMobile, setIsMobile] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);

  // EMI State
  const [emiAvailable, setEmiAvailable] = useState<boolean | null>(null);
  const [emiPlans, setEmiPlans] = useState<EmiPlan[]>([]);
  const [selectedEmiPlanId, setSelectedEmiPlanId] = useState<string | null>(null);
  const [emiDetails, setEmiDetails] = useState<EmiDetails | null>(null);

  // COD State
  const [codFee, setCodFee] = useState<number>(0);

  // Local Payment State
  const [selectedLocalPaymentMethod, setSelectedLocalPaymentMethod] = useState<LocalPaymentMethod | null>(null);
  const [localPaymentFee, setLocalPaymentFee] = useState<PaymentFeeResult | null>(null);
  const [showLocalPaymentInstructions, setShowLocalPaymentInstructions] = useState(false);

  // Tabs State
  const [activeTab, setActiveTab] = useState('payment');

  // Check if device is mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Check online/offline status
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setLastSyncTime(new Date().toISOString());
    };
    
    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Set initial online status
    setIsOnline(navigator.onLine);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Load EMI plans when total changes
  useEffect(() => {
    const loadEmiPlans = async () => {
      try {
        console.log('[CartPage] Loading EMI plans for amount:', total);
        const { getAvailableEmiPlans } = await import('@/lib/api/emi');
        const response = await getAvailableEmiPlans(total);
        
        console.log('[CartPage] EMI API response:', JSON.stringify(response, null, 2));
        
        if (response.success && response.data) {
          console.log('[CartPage] EMI plans found:', response.data.plans?.length || 0);
          setEmiPlans(response.data.plans);
          setEmiAvailable(response.data.plans.length > 0);
        } else {
          console.error('[CartPage] EMI API response invalid:', response);
          setEmiAvailable(false);
        }
      } catch (error) {
        console.error('[CartPage] Error loading EMI plans:', error);
        setEmiAvailable(false);
      }
    };

    console.log('[CartPage] EMI useEffect triggered - total:', total, 'emiAvailable:', emiAvailable);
    if (total >= 5000) { // EMI minimum amount
      loadEmiPlans();
    } else {
      console.log('[CartPage] Total below EMI minimum (5000), setting emiAvailable to false');
      setEmiAvailable(false);
      setEmiPlans([]);
    }
  }, [total]);

  // Calculate COD fee when total changes
  useEffect(() => {
    const calculateCodFee = async () => {
      try {
        const { getCodFee } = await import('@/lib/api/cod');
        const fee = await getCodFee(total);
        setCodFee(fee);
      } catch (error) {
        console.error('Error calculating COD fee:', error);
        setCodFee(0);
      }
    };

    calculateCodFee();
  }, [total]);

  // Calculate tax rate as percentage
  const taxRate = subtotal > 0 ? (tax / subtotal) * 100 : 0;

  // Check if all items are selected
  const isAllSelected = useMemo(() => {
    return items.length > 0 && selectedItems.length === items.length;
  }, [items.length, selectedItems.length]);

  // Handle checkout
  const handleCheckout = () => {
    router.push('/checkout');
  };

  // Handle continue shopping
  const handleContinueShopping = () => {
    router.push('/products');
  };

  // Handle item selection
  const handleSelectItem = useCallback((itemId: string) => {
    setSelectedItems((prev) =>
      prev.includes(itemId) ? prev.filter((id) => id !== itemId) : [...prev, itemId]
    );
  }, []);

  // Handle select all
  const handleSelectAll = () => {
    if (isAllSelected) {
      setSelectedItems([]);
    } else {
      setSelectedItems(items.map((item) => item.id));
    }
  };

  // Handle clear selection
  const handleClearSelection = () => {
    setSelectedItems([]);
  };

  // Helper function to get product image URL
  const getProductImageUrl = (item: any): string | null => {
    if (!item.product?.images || !item.product.images[0]) return null;
    const img = item.product.images[0];
    if (typeof img === 'string') return img;
    if (typeof img === 'object' && img !== null) {
      return (img as any).url || (img as any).originalUrl || null;
    }
    return null;
  };

  // EMI Handlers
  const handleEmiPlanSelect = async (planId: string, emiDetails: EmiDetails) => {
    try {
      console.log('[CartPage] EMI plan selected:', planId, emiDetails);
      setSelectedEmiPlanId(planId);
      setEmiDetails(emiDetails);
    } catch (error) {
      console.error('[CartPage] Error handling EMI plan selection:', error);
      toast.error('Failed to select EMI plan');
    }
  };

  // Local Payment Handlers
  const handleLocalPaymentMethodSelect = async (method: LocalPaymentMethod, feeResult?: PaymentFeeResult) => {
    console.log('[CartPage] Local payment method selected:', method, 'feeResult:', feeResult);
    setSelectedLocalPaymentMethod(method);
    setLocalPaymentFee(feeResult || null);
    if (feeResult) {
      setShowLocalPaymentInstructions(true);
    }
  };

  // Mobile/Offline Handlers
  const handleSync = async () => {
    setIsSyncing(true);
    try {
      // Simulate sync process - in real implementation this would sync offline queue
      await new Promise(resolve => setTimeout(resolve, 2000));
      setLastSyncTime(new Date().toISOString());
      toast.success(language === 'bn' ? 'কার্ট সিঙ্ক হয়েছে' : 'Cart synced successfully');
    } catch (error) {
      console.error('Error syncing cart:', error);
      toast.error(language === 'bn' ? 'কার্ট সিঙ্ক করতে ব্যর্থ হয়েছে' : 'Failed to sync cart');
    } finally {
      setIsSyncing(false);
    }
  };

  // Loading state
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

  // Mobile View
  if (isMobile) {
    return (
      <MobileCartView
        itemCount={itemCount}
        totalAmount={total}
        onCheckout={handleCheckout}
        language={language}
      >
        {/* Mobile Cart Items */}
        {items.length > 0 && (
          <div className="space-y-3">
            {items.map((item) => (
              <MobileCartItem
                    key={item.id}
                    id={item.id}
                    name={item.product?.name || 'Unknown Product'}
                    price={item.price}
                    quantity={item.quantity}
                    image={getProductImageUrl(item)}
                    variant={item.variantId || undefined}
                    onQuantityChange={(id, qty) => updateQuantity(id, qty)}
                    onRemove={(id) => removeItem(id)}
                    language={language}
                    swipeToDelete={true}
                  />
            ))}
          </div>
        )}

        {/* Mobile Cart Summary */}
        {items.length > 0 && (
          <div className="mt-4">
            <MobileCartSummary
              subtotal={subtotal}
              shippingFee={shippingCost}
              codFee={codFee}
              tax={tax}
              discount={discount}
              total={total}
              onCheckout={handleCheckout}
              language={language}
              showPaymentOptions={true}
              showShippingInfo={false}
            />
          </div>
        )}

        {/* Mobile Offline Indicator */}
        {!isOnline && (
          <div className="mt-4">
            <OfflineCartIndicator
              isOnline={isOnline}
              lastSyncTime={lastSyncTime}
              isSyncing={isSyncing}
              onSync={handleSync}
              language={language}
            />
          </div>
        )}
      </MobileCartView>
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
        {/* Page Header with Sync Indicator */}
        <div className="mb-8 flex items-start justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-semibold text-gray-900 mb-2">
              {language === 'bn' ? 'শপিং কার্ট' : 'Shopping Cart'}
            </h1>
            <p className="text-gray-600">
              {language === 'bn' ? `${itemCount} আইটেম` : `${itemCount} ${itemCount === 1 ? 'item' : 'items'}`}
            </p>
          </div>

          {/* Sync Status Indicator */}
          <CartWishlistSyncIndicator language={language} />
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {/* Offline Cart Indicator - Replaces basic offline queue warning */}
        {!isOnline || offlineQueue.length > 0 && (
          <div className="mb-6">
            <OfflineCartIndicator
                  isOnline={isOnline}
                  lastSyncTime={lastSyncTime}
                  isSyncing={isSyncing}
                  onSync={handleSync}
                  language={language}
                  showSyncProgress={isSyncing}
                  syncProgress={isSyncing ? 50 : 0}
                />
          </div>
        )}

        {/* Cart Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2">
            {/* Bulk Actions Bar */}
            {items.length > 0 && (
              <div className="mb-4 bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                <div className="flex items-center justify-between flex-wrap gap-4">
                  {/* Select All Checkbox */}
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isAllSelected}
                      onChange={handleSelectAll}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      aria-label={
                        language === 'bn'
                          ? 'সব নির্বাচন করুন'
                          : 'Select all items'
                      }
                    />
                    <span className="text-sm text-gray-700">
                      {language === 'bn' ? 'সব নির্বাচন করুন' : 'Select All'}
                    </span>
                  </label>

                  {/* Selected Items Count */}
                  {selectedItems.length > 0 && (
                    <span className="text-sm text-gray-600">
                      {language === 'bn'
                        ? `${selectedItems.length}টি নির্বাচিত`
                        : `${selectedItems.length} selected`}
                    </span>
                  )}

                  {/* Bulk Actions */}
                  {selectedItems.length > 0 && (
                    <div className="flex items-center gap-2">
                      <BulkMoveToWishlist
                        selectedItems={selectedItems}
                        onSuccess={() => {
                          handleClearSelection();
                          loadCart();
                        }}
                        onClearSelection={handleClearSelection}
                        language={language}
                      />
                      <button
                        onClick={handleClearSelection}
                        className="text-sm text-gray-600 hover:text-gray-800 px-3 py-1.5 rounded hover:bg-gray-100 transition-colors"
                      >
                        {language === 'bn' ? 'বাতিল করুন' : 'Clear'}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Cart Items List */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              {items.map((item) => (
                <div key={item.id} className="border-b border-gray-200 last:border-b-0">
                  <div className="flex items-center p-4">
                    {/* Checkbox for bulk selection */}
                    <input
                      type="checkbox"
                      checked={selectedItems.includes(item.id)}
                      onChange={() => handleSelectItem(item.id)}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 mr-4 flex-shrink-0"
                      aria-label={
                        language === 'bn'
                          ? `${item.product?.name || 'আইটেম'} নির্বাচন করুন`
                          : `Select ${item.product?.name || 'item'}`
                      }
                    />
                    <div className="flex-1">
                      <CartItem
                        item={item}
                        onUpdateQuantity={updateQuantity}
                        onRemove={removeItem}
                        onLoadCart={() => loadCart()}
                        language={language}
                        showTax={tax > 0}
                        taxRate={taxRate}
                      />
                    </div>
                  </div>
                </div>
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
              
              {/* Quick Wishlist Access */}
              <div className="mt-4 bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                <Link
                  href="/wishlist"
                  className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-pink-50 text-pink-700 font-medium rounded-md hover:bg-pink-100 transition-colors focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-offset-1"
                >
                  <Heart className="w-4 h-4" />
                  {language === 'bn' ? 'উইশলিস্ট দেখুন' : 'View Wishlist'}
                </Link>
              </div>

              {/* EMI Display - Full component with providers */}
              <EmiDisplay
                amount={total}
                onPlanSelect={handleEmiPlanSelect}
                language={language}
                showCalculator={true}
              />

              {/* EMI Summary */}
              {emiDetails && (
                <div className="mt-4">
                  <EmiSummary
                        emiDetails={emiDetails}
                        language={language}
                        showBreakdown={true}
                      />
                </div>
              )}

              {/* COD Availability - Collapsible */}
              <Accordion
                title={
                  <div className="flex items-center gap-2">
                    <Truck className="w-4 h-4 text-gray-600" />
                    {language === 'bn' ? 'ক্যাশ অন ডেলিভারি' : 'Cash on Delivery'}
                  </div>
                }
                defaultOpen={false}
              >
                <div className="space-y-3">
                  <CodAvailabilityIndicator
                    amount={total}
                    onAvailabilityChange={() => {}}
                    language={language}
                    showDeliveryInfo={true}
                    autoCheck={true}
                  />
                  {codFee > 0 && (
                    <CodFeeDisplay
                      amount={total}
                      fee={codFee}
                      language={language}
                      showBreakdown={true}
                    />
                  )}
                  <CodWarningBanner
                    amount={total}
                    language={language}
                    showAlternatives={true}
                    autoCheck={true}
                  />
                </div>
              </Accordion>

              {/* Local Payment Method Selector - Collapsible */}
              <Accordion
                title={
                  <div className="flex items-center gap-2">
                    <Smartphone className="w-4 h-4 text-gray-600" />
                    {language === 'bn' ? 'লোকাল পেমেন্ট' : 'Local Payment'}
                  </div>
                }
                defaultOpen={false}
              >
                <LocalPaymentMethodSelector
                  amount={total}
                  selectedMethodCode={selectedLocalPaymentMethod?.code || undefined}
                  onMethodSelect={handleLocalPaymentMethodSelect}
                  language={language}
                  showFee={true}
                />
                {localPaymentFee && (
                  <div className="mt-3">
                    <LocalPaymentFeeDisplay
                      amount={total}
                      methodCode={selectedLocalPaymentMethod?.code || ''}
                      feeResult={localPaymentFee}
                      language={language}
                      showBreakdown={true}
                    />
                  </div>
                )}
                {showLocalPaymentInstructions && selectedLocalPaymentMethod && (
                  <div className="mt-3">
                    <LocalPaymentInstructions
                      methodCode={selectedLocalPaymentMethod.code}
                      language={language}
                    />
                  </div>
                )}
              </Accordion>
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
