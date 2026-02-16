'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, CreditCard, Truck, MapPin, CheckCircle, Shield, AlertCircle, Loader2 } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { useCheckoutAddresses } from '@/hooks/useCheckoutAddresses';
import { User } from '@/types/auth';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { addressToShippingAddress, ShippingAddress } from '@/lib/utils/address';
import { apiClient } from '@/lib/api/client';
import SavedAddressesSelector from '@/components/checkout/SavedAddressesSelector';
import BillingAddressToggle from '@/components/checkout/BillingAddressToggle';
import { districts } from '@/data/bangladesh-data';

const CDN_URL = process.env.NEXT_PUBLIC_CDN_URL || '';

interface PaymentMethod {
  id: string;
  name: string;
  nameBn: string;
  icon: React.ReactNode;
}

const formatCurrency = (amount: number): string => {
  return `৳${amount.toLocaleString('en-BD', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const paymentMethods: PaymentMethod[] = [
  {
    id: 'cod',
    name: 'Cash on Delivery',
    nameBn: 'নগদ প্রদান',
    icon: <CreditCard className="w-5 h-5" />,
  },
  {
    id: 'card',
    name: 'Credit/Debit Card',
    nameBn: 'ক্রেডিট/ডেবিট কার্ড',
    icon: <CreditCard className="w-5 h-5" />,
  },
  {
    id: 'bkash',
    name: 'bKash',
    nameBn: 'বিকাশ',
    icon: <CreditCard className="w-5 h-5" />,
  },
];

const districtNames = districts.map(d => d.name);

export default function CheckoutPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const isAuthenticated = !!user;
  const { items, subtotal, tax, shippingCost, discount, total, isLoading, isInitializing, setShippingMethod, clearCart } = useCart();

  // Helper function to get product image URL with proper CDN/backend URL handling
  const getProductImage = (imageUrl?: string | null | any): string => {
    // Handle null/undefined
    if (!imageUrl) {
      return '/images/placeholder-product.jpg';
    }

    // Extract URL from ProductImage object if needed
    let urlString = imageUrl;
    if (typeof imageUrl === 'object' && imageUrl !== null) {
      urlString = imageUrl.originalUrl || imageUrl.optimizedUrl || imageUrl.thumbnailUrl || imageUrl.url || '';
    }

    // Ensure we have a string
    if (typeof urlString !== 'string') {
      return '/images/placeholder-product.jpg';
    }

    // If already an absolute URL, return as-is
    if (urlString.startsWith('http://') || urlString.startsWith('https://')) {
      return urlString;
    }

    // If CDN URL is configured, use it
    if (CDN_URL && CDN_URL.length > 0) {
      const normalizedCdnUrl = CDN_URL.replace(/\/$/, '');
      if (urlString.startsWith('/')) {
        return `${normalizedCdnUrl}${urlString}`;
      }
      return `${normalizedCdnUrl}/${urlString}`;
    }

    // Otherwise, return as-is for relative paths
    return urlString;
  };
  const {
    shippingAddresses,
    billingAddresses,
    selectedShippingAddressId,
    selectedBillingAddressId,
    isLoading: isLoadingAddresses,
    error: addressesError,
    fetchAddresses,
    selectShippingAddress,
    selectBillingAddress,
    clearShippingSelection,
    clearBillingSelection,
    setManuallyEdited,
    setUseSameAddress,
    useSameAddress,
    getSelectedShippingAddressAsShippingAddress,
  } = useCheckoutAddresses();
  const [step, setStep] = useState<'shipping' | 'payment' | 'review'>('shipping');
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<string>('cod');
  const [hasAutoSelectedDefault, setHasAutoSelectedDefault] = useState(false);
  const [isPopulatingAddress, setIsPopulatingAddress] = useState(false);

  const [shippingAddress, setShippingAddress] = useState<ShippingAddress>({
    fullName: user ? `${user.firstName} ${user.lastName}` : '',
    phone: user?.phone || '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    district: 'Dhaka',
    postalCode: '',
  });

  const [billingAddress, setBillingAddress] = useState<ShippingAddress>({
    fullName: user ? `${user.firstName} ${user.lastName}` : '',
    phone: user?.phone || '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    district: 'Dhaka',
    postalCode: '',
  });

  const [errors, setErrors] = useState<Partial<ShippingAddress>>({});
  const [paymentErrors, setPaymentErrors] = useState<string>('');

  // Redirect if not authenticated
  // Wait for session to fully stabilize before redirecting to prevent race condition
  useEffect(() => {
    // Only redirect when authLoading is complete AND user is definitely not authenticated
    // This prevents the race condition where authLoading is false but session is still loading
    if (!authLoading && !isAuthenticated) {
      // Add a small delay to ensure session is fully stabilized
      const timer = setTimeout(() => {
        // Double-check authentication after delay to confirm
        if (!isAuthenticated) {
          toast.error('Please login to continue');
          router.push('/login?redirect=/checkout');
        }
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [authLoading, isAuthenticated, router]);

  // Redirect if cart is empty (only after initialization completes)
  useEffect(() => {
    if (!isInitializing && items.length === 0 && !isLoading) {
      toast.error('Your cart is empty');
      router.push('/cart');
    }
  }, [items.length, isLoading, isInitializing, router]);

  // Fetch saved addresses on mount
  useEffect(() => {
    if (user?.id) {
      fetchAddresses(user.id);
    }
  }, [user?.id, fetchAddresses]);

  // Auto-select default address when addresses are loaded
  useEffect(() => {
    if (shippingAddresses.length > 0 && !selectedShippingAddressId && !hasAutoSelectedDefault) {
      const defaultAddress = shippingAddresses.find(addr => addr.isDefault);
      if (defaultAddress) {
        handleAddressSelect(defaultAddress);
        setHasAutoSelectedDefault(true);
      }
    }
  }, [shippingAddresses, selectedShippingAddressId, hasAutoSelectedDefault]);

  // Sync billing address with shipping address when useSameAddress is enabled
  useEffect(() => {
    if (useSameAddress) {
      setBillingAddress(shippingAddress);
    }
  }, [useSameAddress, shippingAddress]);

  // Handle billing address selection
  const handleBillingAddressSelect = (address: any) => {
    selectBillingAddress(address.id);
    const checkoutAddress = addressToShippingAddress(address);
    setBillingAddress(checkoutAddress);
    setErrors({});
  };

  // Handle billing address field changes
  const handleBillingFieldChange = (field: keyof ShippingAddress, value: string) => {
    setBillingAddress({ ...billingAddress, [field]: value });
    
    // If user manually edits a field after selecting a saved address,
    // clear the selected address ID and mark as manually edited
    if (selectedBillingAddressId) {
      clearBillingSelection();
      setManuallyEdited('billing', true);
    }
  };

  // Handle address selection and pre-fill form
  const handleAddressSelect = (address: any) => {
    setIsPopulatingAddress(true);
    
    try {
      selectShippingAddress(address.id);
      const checkoutAddress = addressToShippingAddress(address);
      setShippingAddress(checkoutAddress);
      setErrors({});
    } finally {
      setIsPopulatingAddress(false);
    }
  };

  // Handle manual form field changes
  const handleFieldChange = (field: keyof ShippingAddress, value: string) => {
    setShippingAddress({ ...shippingAddress, [field]: value });

    // If user manually edits a field after selecting a saved address,
    // clear the selected address ID and mark as manually edited
    if (selectedShippingAddressId) {
      clearShippingSelection();
      setManuallyEdited('shipping', true);
    }
  };
  
  const validateShipping = (): boolean => {
    const newErrors: Partial<ShippingAddress> = {};
    
    if (!shippingAddress.fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    }
    
    if (!shippingAddress.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!/^01[3-9]\d{8}$/.test(shippingAddress.phone)) {
      newErrors.phone = 'Invalid phone number format. Must be 11 digits starting with 01';
    }
    
    if (!shippingAddress.addressLine1.trim()) {
      newErrors.addressLine1 = 'Address is required';
    }
    
    if (!shippingAddress.city.trim()) {
      newErrors.city = 'City is required';
    }
    
    if (!shippingAddress.district.trim()) {
      newErrors.district = 'District is required';
    } else if (!districtNames.includes(shippingAddress.district)) {
      newErrors.district = 'Please select a valid district';
    }
    
    if (!shippingAddress.postalCode.trim()) {
      newErrors.postalCode = 'Postal code is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateBilling = (): boolean => {
    // If useSameAddress is true, billing validation is not needed
    if (useSameAddress) {
      return true;
    }

    const newErrors: Partial<ShippingAddress> = {};
    
    if (!billingAddress.fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    }
    
    if (!billingAddress.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!/^01[3-9]\d{8}$/.test(billingAddress.phone)) {
      newErrors.phone = 'Invalid phone number format. Must be 11 digits starting with 01';
    }
    
    if (!billingAddress.addressLine1.trim()) {
      newErrors.addressLine1 = 'Address is required';
    }
    
    if (!billingAddress.city.trim()) {
      newErrors.city = 'City is required';
    }
    
    if (!billingAddress.district.trim()) {
      newErrors.district = 'District is required';
    } else if (!districtNames.includes(billingAddress.district)) {
      newErrors.district = 'Please select a valid district';
    }
    
    if (!billingAddress.postalCode.trim()) {
      newErrors.postalCode = 'Postal code is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleShippingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateShipping() && validateBilling()) {
      setStep('payment');
    }
  };
  
  const handlePaymentSubmit = () => {
    setStep('review');
  };
  
  const handlePlaceOrder = async () => {
    setIsPlacingOrder(true);
    setPaymentErrors('');
    
    try {
      // Build order items from cart
      const orderItems = items.map(item => ({
        productId: item.product.id,
        variantId: item.variantId || null,
        quantity: item.quantity,
        unitPrice: item.price  // Send the actual price from cart (may include discounts)
      }));
      
      // Determine payment method enum value
      const paymentMethodMap = {
        'cod': 'CASH_ON_DELIVERY',
        'card': 'CREDIT_CARD',
        'bkash': 'BKASH'
      };
      
      // Call the backend API to create an order
      const response = await apiClient.post('/orders', {
        addressId: selectedShippingAddressId,
        items: orderItems,
        paymentMethod: paymentMethodMap[selectedPayment] || 'CASH_ON_DELIVERY',
        notes: ''
      });
      
      toast.success('Order placed successfully!');
      
      // Clear cart after successful order placement
      await clearCart();
      
      // Redirect with real order ID
      router.push(`/order-confirmation?orderId=${response.order.id}`);
    } catch (error: any) {
      console.error('Order placement error:', error);
      setPaymentErrors(error.message || 'Failed to place order');
      toast.error('Failed to place order');
    } finally {
      setIsPlacingOrder(false);
    }
  };
  
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }
  
  if (!isAuthenticated) {
    return null;
  }
  
  // Show loading indicator during cart initialization
  if (isInitializing) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">Loading checkout...</span>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/cart" className="flex items-center gap-2 text-gray-600 hover:text-gray-900">
              <ArrowLeft className="w-5 h-5" />
              <span>Back to Cart</span>
            </Link>
            <h1 className="text-xl font-bold text-gray-900">Checkout</h1>
            <div className="w-24"></div>
          </div>
        </div>
      </header>
      
      {/* Progress Steps */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-center gap-4">
            <div className={cn(
              "flex items-center gap-2",
              step === 'shipping' ? "text-blue-600" : "text-green-600"
            )}>
              <div className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center",
                step === 'shipping' ? "bg-blue-600 text-white" : "bg-green-600 text-white"
              )}>
                {step === 'shipping' ? '1' : <CheckCircle className="w-5 h-5" />}
              </div>
              <span className="font-medium">Shipping</span>
            </div>
            <div className="w-16 h-0.5 bg-gray-300"></div>
            <div className={cn(
              "flex items-center gap-2",
              step === 'payment' ? "text-blue-600" : step === 'review' ? "text-green-600" : "text-gray-400"
            )}>
              <div className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center",
                step === 'payment' ? "bg-blue-600 text-white" : step === 'review' ? "bg-green-600 text-white" : "bg-gray-300 text-gray-600"
              )}>
                {step === 'review' ? <CheckCircle className="w-5 h-5" /> : '2'}
              </div>
              <span className="font-medium">Payment</span>
            </div>
            <div className="w-16 h-0.5 bg-gray-300"></div>
            <div className={cn(
              "flex items-center gap-2",
              step === 'review' ? "text-blue-600" : "text-gray-400"
            )}>
              <div className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center",
                step === 'review' ? "bg-blue-600 text-white" : "bg-gray-300 text-gray-600"
              )}>
                '3'
              </div>
              <span className="font-medium">Review</span>
            </div>
          </div>
        </div>
      </div>
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Shipping Address Form */}
            {step === 'shipping' && (
              <div className="space-y-6">
                {/* Saved Addresses Selector */}
                <SavedAddressesSelector
                  addresses={shippingAddresses}
                  selectedAddressId={selectedShippingAddressId}
                  onSelect={handleAddressSelect}
                  onAddNew={() => router.push('/account?tab=addresses')}
                  language="en"
                  addressType="SHIPPING"
                  isLoading={isLoadingAddresses}
                  error={addressesError}
                  maxVisible={3}
                  showActions={false}
                />
                
                {/* Loading indicator during address population */}
                {isPopulatingAddress && (
                  <div className="flex items-center gap-2 p-4 bg-blue-50 rounded-lg mb-4">
                    <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
                    <span className="text-sm text-blue-600">Populating address...</span>
                  </div>
                )}
                
                {/* Shipping Address Form */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center gap-3 mb-6">
                    <MapPin className="w-6 h-6 text-blue-600" />
                    <h2 className="text-lg font-semibold text-gray-900">Shipping Address</h2>
                  </div>
                  
                  <form onSubmit={handleShippingSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Full Name *
                        </label>
                        <input
                          type="text"
                          value={shippingAddress.fullName}
                          onChange={(e) => handleFieldChange('fullName', e.target.value)}
                          className={cn(
                            "w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500",
                            errors.fullName ? "border-red-500" : "border-gray-300"
                          )}
                          placeholder="Enter your full name"
                        />
                        {errors.fullName && (
                          <p className="mt-1 text-sm text-red-600">{errors.fullName}</p>
                        )}
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Phone Number *
                        </label>
                        <input
                          type="tel"
                          value={shippingAddress.phone}
                          onChange={(e) => handleFieldChange('phone', e.target.value)}
                          className={cn(
                            "w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500",
                            errors.phone ? "border-red-500" : "border-gray-300"
                          )}
                          placeholder="01XXXXXXXXX"
                        />
                        {errors.phone && (
                          <p className="mt-1 text-sm text-red-600">{errors.phone}</p>
                        )}
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Address Line 1 *
                      </label>
                      <input
                        type="text"
                        value={shippingAddress.addressLine1}
                        onChange={(e) => handleFieldChange('addressLine1', e.target.value)}
                        className={cn(
                          "w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500",
                          errors.addressLine1 ? "border-red-500" : "border-gray-300"
                        )}
                        placeholder="Street address, house number"
                      />
                      {errors.addressLine1 && (
                        <p className="mt-1 text-sm text-red-600">{errors.addressLine1}</p>
                        )}
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Address Line 2 (Optional)
                      </label>
                      <input
                        type="text"
                        value={shippingAddress.addressLine2}
                        onChange={(e) => handleFieldChange('addressLine2', e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Apartment, suite, unit, etc."
                      />
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          City *
                        </label>
                        <input
                          type="text"
                          value={shippingAddress.city}
                          onChange={(e) => handleFieldChange('city', e.target.value)}
                          className={cn(
                            "w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500",
                            errors.city ? "border-red-500" : "border-gray-300"
                          )}
                          placeholder="City"
                        />
                        {errors.city && (
                          <p className="mt-1 text-sm text-red-600">{errors.city}</p>
                        )}
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          District *
                        </label>
                        <select
                          value={shippingAddress.district}
                          onChange={(e) => handleFieldChange('district', e.target.value)}
                          className={cn(
                            "w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500",
                            errors.district ? "border-red-500" : "border-gray-300"
                          )}
                        >
                          <option value="">Select District</option>
                          {districtNames.map((district) => (
                            <option key={district} value={district}>{district}</option>
                          ))}
                        </select>
                        {errors.district && (
                          <p className="mt-1 text-sm text-red-600">{errors.district}</p>
                        )}
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Postal Code *
                        </label>
                        <input
                          type="text"
                          value={shippingAddress.postalCode}
                          onChange={(e) => handleFieldChange('postalCode', e.target.value)}
                          className={cn(
                            "w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500",
                            errors.postalCode ? "border-red-500" : "border-gray-300"
                          )}
                          placeholder="Postal code"
                        />
                        {errors.postalCode && (
                          <p className="mt-1 text-sm text-red-600">{errors.postalCode}</p>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex justify-end pt-4">
                      <button
                        type="submit"
                        className="px-6 py-3 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                      >
                        Continue to Payment
                      </button>
                    </div>
                  </form>
                </div>

                {/* Billing Address Toggle */}
                <BillingAddressToggle
                  isSameAsShipping={useSameAddress}
                  onToggle={setUseSameAddress}
                  shippingAddress={shippingAddress}
                  language="en"
                />

                {/* Billing Address Form - Only shown when useSameAddress is false */}
                {!useSameAddress && (
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center gap-3 mb-6">
                      <CreditCard className="w-6 h-6 text-purple-600" />
                      <h2 className="text-lg font-semibold text-gray-900">Billing Address</h2>
                    </div>

                    {/* Saved Billing Addresses Selector */}
                    <SavedAddressesSelector
                      addresses={billingAddresses}
                      selectedAddressId={selectedBillingAddressId}
                      onSelect={handleBillingAddressSelect}
                      onAddNew={() => router.push('/account?tab=addresses')}
                      language="en"
                      addressType="BILLING"
                      isLoading={isLoadingAddresses}
                      error={addressesError}
                      maxVisible={3}
                      showActions={false}
                    />

                    {/* Billing Address Form */}
                    <form className="space-y-4 mt-6">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Full Name
                          </label>
                          <input
                            type="text"
                            value={billingAddress.fullName}
                            onChange={(e) => handleBillingFieldChange('fullName', e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Enter your full name"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Phone Number
                          </label>
                          <input
                            type="tel"
                            value={billingAddress.phone}
                            onChange={(e) => handleBillingFieldChange('phone', e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="01XXXXXXXXX"
                          />
                        </div>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Address Line 1
                        </label>
                        <input
                          type="text"
                          value={billingAddress.addressLine1}
                          onChange={(e) => handleBillingFieldChange('addressLine1', e.target.value)}
                          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Street address, house number"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Address Line 2 (Optional)
                        </label>
                        <input
                          type="text"
                          value={billingAddress.addressLine2}
                          onChange={(e) => handleBillingFieldChange('addressLine2', e.target.value)}
                          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Apartment, suite, unit, etc."
                        />
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            City
                          </label>
                          <input
                            type="text"
                            value={billingAddress.city}
                            onChange={(e) => handleBillingFieldChange('city', e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="City"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            District
                          </label>
                          <select
                            value={billingAddress.district}
                            onChange={(e) => handleBillingFieldChange('district', e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="">Select District</option>
                            {districtNames.map((district) => (
                              <option key={district} value={district}>{district}</option>
                            ))}
                          </select>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Postal Code
                          </label>
                          <input
                            type="text"
                            value={billingAddress.postalCode}
                            onChange={(e) => handleBillingFieldChange('postalCode', e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Postal code"
                          />
                        </div>
                      </div>
                    </form>
                  </div>
                )}
              </div>
            )}
            
            {/* Payment Method Selection */}
            {step === 'payment' && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center gap-3 mb-6">
                  <CreditCard className="w-6 h-6 text-blue-600" />
                  <h2 className="text-lg font-semibold text-gray-900">Payment Method</h2>
                </div>
                
                <div className="space-y-3">
                  {paymentMethods.map((method) => (
                    <button
                      key={method.id}
                      type="button"
                      onClick={() => setSelectedPayment(method.id)}
                      className={cn(
                        "w-full flex items-center gap-4 p-4 border rounded-lg transition-colors",
                        selectedPayment === method.id
                          ? "border-blue-500 bg-blue-50"
                          : "border-gray-200 hover:border-gray-300"
                      )}
                    >
                      <div className={cn(
                        "w-5 h-5 rounded-full border-2 flex items-center justify-center",
                        selectedPayment === method.id ? "border-blue-600" : "border-gray-300"
                      )}>
                        {selectedPayment === method.id && (
                          <div className="w-2.5 h-2.5 rounded-full bg-blue-600" />
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        {method.icon}
                        <span className="font-medium text-gray-900">{method.name}</span>
                      </div>
                    </button>
                  ))}
                </div>
                
                {paymentErrors && (
                  <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
                    <p className="text-sm text-red-600 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4" />
                      {paymentErrors}
                    </p>
                  </div>
                )}
                
                <div className="flex justify-between pt-6">
                  <button
                    type="button"
                    onClick={() => setStep('shipping')}
                    className="px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-md hover:bg-gray-50 transition-colors"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={handlePaymentSubmit}
                    className="px-6 py-3 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  >
                    Continue to Review
                  </button>
                </div>
              </div>
            )}
            
            {/* Order Review */}
            {step === 'review' && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center gap-3 mb-6">
                  <CheckCircle className="w-6 h-6 text-blue-600" />
                  <h2 className="text-lg font-semibold text-gray-900">Order Review</h2>
                </div>
                
                {/* Shipping Address Summary */}
                <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                  <h3 className="font-medium text-gray-900 mb-2">Shipping To:</h3>
                  <p className="text-gray-600">{shippingAddress.fullName}</p>
                  <p className="text-gray-600">{shippingAddress.addressLine1}</p>
                  {shippingAddress.addressLine2 && <p className="text-gray-600">{shippingAddress.addressLine2}</p>}
                  <p className="text-gray-600">{shippingAddress.city}, {shippingAddress.district} {shippingAddress.postalCode}</p>
                  <p className="text-gray-600">{shippingAddress.phone}</p>
                </div>

                {/* Billing Address Summary */}
                <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                  <h3 className="font-medium text-gray-900 mb-2">
                    {useSameAddress ? 'Billing To (Same as Shipping):' : 'Billing To:'}
                  </h3>
                  {useSameAddress ? (
                    <p className="text-gray-600 italic">Same as shipping address</p>
                  ) : (
                    <>
                      <p className="text-gray-600">{billingAddress.fullName}</p>
                      <p className="text-gray-600">{billingAddress.addressLine1}</p>
                      {billingAddress.addressLine2 && <p className="text-gray-600">{billingAddress.addressLine2}</p>}
                      <p className="text-gray-600">{billingAddress.city}, {billingAddress.district} {billingAddress.postalCode}</p>
                      <p className="text-gray-600">{billingAddress.phone}</p>
                    </>
                  )}
                </div>
                
                {/* Payment Method Summary */}
                <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                  <h3 className="font-medium text-gray-900 mb-2">Payment Method:</h3>
                  <p className="text-gray-600">
                    {paymentMethods.find(m => m.id === selectedPayment)?.name}
                  </p>
                </div>
                
                {paymentErrors && (
                  <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-md">
                    <p className="text-sm text-red-600 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4" />
                      {paymentErrors}
                    </p>
                  </div>
                )}
                
                <div className="flex justify-between pt-4">
                  <button
                    type="button"
                    onClick={() => setStep('payment')}
                    disabled={isPlacingOrder}
                    className="px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-md hover:bg-gray-50 transition-colors disabled:opacity-50"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={handlePlaceOrder}
                    disabled={isPlacingOrder}
                    className="px-6 py-3 bg-green-600 text-white font-medium rounded-md hover:bg-green-700 transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50"
                  >
                    {isPlacingOrder ? (
                      <span className="flex items-center gap-2">
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Placing Order...
                      </span>
                    ) : (
                      'Place Order'
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
          
          {/* Order Summary Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 sticky top-24">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Order Summary</h2>
              
              {/* Cart Items */}
              <div className="space-y-4 mb-6">
                {items.map((item) => (
                  <div key={item.id} className="flex gap-3">
                    <div className="relative w-16 h-16 flex-shrink-0 bg-gray-100 rounded-md overflow-hidden">
                      {item.product?.images?.[0] && (
                        <Image
                          src={getProductImage(item.product.images[0])}
                          alt={item.product?.name || 'Product'}
                          fill
                          className="object-cover"
                          onError={(e) => {
                            // Fallback to placeholder on error
                            const target = e.target as HTMLImageElement;
                            target.src = '/images/placeholder-product.jpg';
                          }}
                        />
                      )}
                      <div className="absolute -top-1 -right-1 w-5 h-5 bg-gray-600 text-white text-xs rounded-full flex items-center justify-center">
                        {item.quantity}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {item.product?.name || 'Unknown Product'}
                      </p>
                      <p className="text-sm text-gray-500">
                        {formatCurrency(item.price)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Price Breakdown */}
              <div className="space-y-3 border-t border-gray-200 pt-4">
                <div className="flex items-center justify-between text-sm text-gray-600">
                  <span>Subtotal</span>
                  <span className="font-medium">{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex items-center justify-between text-sm text-gray-600">
                  <span>Shipping</span>
                  <span className="font-medium">
                    {shippingCost === 0 ? 'Free' : formatCurrency(shippingCost)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm text-gray-600">
                  <span>Tax</span>
                  <span className="font-medium">{formatCurrency(tax)}</span>
                </div>
                {discount > 0 && (
                  <div className="flex items-center justify-between text-sm text-green-600">
                    <span>Discount</span>
                    <span className="font-medium">-{formatCurrency(discount)}</span>
                  </div>
                )}
                <div className="flex items-center justify-between border-t border-gray-200 pt-3">
                  <span className="text-base font-semibold text-gray-900">Total</span>
                  <span className="text-xl font-bold text-gray-900">{formatCurrency(total)}</span>
                </div>
              </div>
              
              {/* Security Notice */}
              <div className="mt-6 flex items-center gap-2 text-xs text-gray-500">
                <Shield className="w-4 h-4" />
                <span>Secure checkout - Your information is protected</span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
