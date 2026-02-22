'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, CreditCard, Truck, MapPin, CheckCircle, Shield, AlertCircle, Loader2, ShoppingBag, UserPlus, ChevronRight, ChevronLeft } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { useGuestCheckout } from '@/hooks/useGuestCheckout';
import GuestInfoForm from '@/components/checkout/GuestInfoForm';
import CheckoutSecurityBadge from '@/components/checkout/CheckoutSecurityBadge';
import CheckoutAbandonmentWarning from '@/components/checkout/CheckoutAbandonmentWarning';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { districts } from '@/data/bangladesh-data';
import type { GuestCheckoutStep } from '@/types/guestCheckout';

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
    id: 'emi',
    name: 'EMI (Installments)',
    nameBn: 'ইএমআই (কিস্তি)',
    icon: <CreditCard className="w-5 h-5" />,
  },
  {
    id: 'bkash',
    name: 'bKash',
    nameBn: 'বিকাশ',
    icon: <CreditCard className="w-5 h-5" />,
  },
  {
    id: 'nagad',
    name: 'Nagad',
    nameBn: 'নগদ',
    icon: <CreditCard className="w-5 h-5" />,
  },
  {
    id: 'rocket',
    name: 'Rocket',
    nameBn: 'রকেট',
    icon: <CreditCard className="w-5 h-5" />,
  },
];

const districtNames = districts.map(d => d.name);

export default function GuestCheckoutPage() {
  const router = useRouter();
  const { items, subtotal, tax, shippingCost, discount, total, isLoading, isInitializing, clearCart } = useCart();
  
  const {
    session,
    guestInfo,
    shippingAddress,
    billingAddress,
    paymentMethod,
    paymentDetails,
    progress,
    isLoading: isCheckoutLoading,
    error: checkoutError,
    initializeSession,
    updateGuestInfo,
    updateStep,
    validateStep,
    completeCheckout,
    clearSession,
    setShippingAddress,
    setBillingAddress,
    setPaymentMethod,
    setPaymentDetails,
  } = useGuestCheckout();

  const [step, setStep] = useState<GuestCheckoutStep>('info');
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<string>('cod');
  const [useSameAddress, setUseSameAddress] = useState(true);
  const [showAbandonmentWarning, setShowAbandonmentWarning] = useState(false);
  const [language, setLanguage] = useState<'en' | 'bn'>('en');
  const [errors, setErrors] = useState<Partial<Record<string, string>>>({});
  const [paymentErrors, setPaymentErrors] = useState<string>('');

  // Helper function to get product image URL
  const getProductImage = (imageUrl?: string | null | any): string => {
    if (!imageUrl) {
      return '/images/placeholder-product.jpg';
    }

    let urlString = imageUrl;
    if (typeof imageUrl === 'object' && imageUrl !== null) {
      urlString = imageUrl.originalUrl || imageUrl.optimizedUrl || imageUrl.thumbnailUrl || imageUrl.url || '';
    }

    if (typeof urlString !== 'string') {
      return '/images/placeholder-product.jpg';
    }

    if (urlString.startsWith('http://') || urlString.startsWith('https://')) {
      return urlString;
    }

    if (CDN_URL && CDN_URL.length > 0) {
      const normalizedCdnUrl = CDN_URL.replace(/\/$/, '');
      if (urlString.startsWith('/')) {
        return `${normalizedCdnUrl}${urlString}`;
      }
      return `${normalizedCdnUrl}/${urlString}`;
    }

    return urlString;
  };

  // Redirect if cart is empty
  useEffect(() => {
    if (!isInitializing && items.length === 0 && !isLoading) {
      toast.error('Your cart is empty');
      router.push('/cart');
    }
  }, [items.length, isLoading, isInitializing, router]);

  // Initialize guest checkout session on mount
  useEffect(() => {
    if (!isInitializing && items.length > 0) {
      initializeSession();
    }
  }, [isInitializing, items.length, initializeSession]);

  // Sync billing address with shipping address when useSameAddress is enabled
  useEffect(() => {
    if (useSameAddress) {
      setBillingAddress(shippingAddress);
    }
  }, [useSameAddress, shippingAddress, setBillingAddress]);

  // Handle step changes
  useEffect(() => {
    if (progress) {
      setStep(progress.currentStep);
    }
  }, [progress]);

  // Handle guest info form submission
  const handleGuestInfoSubmit = async (data: any) => {
    try {
      await updateGuestInfo(data);
      await updateStep('address');
    } catch (error) {
      console.error('Guest info submission error:', error);
      toast.error('Failed to save guest information');
    }
  };

  // Handle shipping field changes
  const handleShippingFieldChange = (field: keyof typeof shippingAddress, value: string) => {
    setShippingAddress({ ...shippingAddress, [field]: value });
    
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  // Handle billing field changes
  const handleBillingFieldChange = (field: keyof typeof billingAddress, value: string) => {
    setBillingAddress({ ...billingAddress, [field]: value });
    
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  // Validate shipping address
  const validateShipping = (): boolean => {
    const newErrors: Partial<Record<string, string>> = {};
    
    if (!shippingAddress.fullName.trim()) {
      newErrors.shippingFullName = 'Full name is required';
    }
    
    if (!shippingAddress.phone.trim()) {
      newErrors.shippingPhone = 'Phone number is required';
    } else if (!/^01[3-9]\d{8}$/.test(shippingAddress.phone)) {
      newErrors.shippingPhone = 'Invalid phone number format. Must be 11 digits starting with 01';
    }
    
    if (!shippingAddress.addressLine1.trim()) {
      newErrors.shippingAddressLine1 = 'Address is required';
    }
    
    if (!shippingAddress.city.trim()) {
      newErrors.shippingCity = 'City is required';
    }
    
    if (!shippingAddress.district.trim()) {
      newErrors.shippingDistrict = 'District is required';
    } else if (!districtNames.includes(shippingAddress.district)) {
      newErrors.shippingDistrict = 'Please select a valid district';
    }
    
    if (!shippingAddress.postalCode.trim()) {
      newErrors.shippingPostalCode = 'Postal code is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Validate billing address
  const validateBilling = (): boolean => {
    if (useSameAddress) {
      return true;
    }

    const newErrors: Partial<Record<string, string>> = {};
    
    if (!billingAddress.fullName.trim()) {
      newErrors.billingFullName = 'Full name is required';
    }
    
    if (!billingAddress.phone.trim()) {
      newErrors.billingPhone = 'Phone number is required';
    } else if (!/^01[3-9]\d{8}$/.test(billingAddress.phone)) {
      newErrors.billingPhone = 'Invalid phone number format. Must be 11 digits starting with 01';
    }
    
    if (!billingAddress.addressLine1.trim()) {
      newErrors.billingAddressLine1 = 'Address is required';
    }
    
    if (!billingAddress.city.trim()) {
      newErrors.billingCity = 'City is required';
    }
    
    if (!billingAddress.district.trim()) {
      newErrors.billingDistrict = 'District is required';
    } else if (!districtNames.includes(billingAddress.district)) {
      newErrors.billingDistrict = 'Please select a valid district';
    }
    
    if (!billingAddress.postalCode.trim()) {
      newErrors.billingPostalCode = 'Postal code is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle shipping address submission
  const handleShippingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateShipping() && validateBilling()) {
      setStep('payment');
      updateStep('payment');
    }
  };

  // Handle payment submission
  const handlePaymentSubmit = () => {
    setStep('review');
    updateStep('review');
  };

  // Handle order placement
  const handlePlaceOrder = async () => {
    setIsPlacingOrder(true);
    setPaymentErrors('');
    
    try {
      const order = await completeCheckout();
      
      // Clear cart after successful order placement
      await clearCart();
      
      // Redirect to order confirmation
      router.push(`/order-confirmation?orderId=${order.id}`);
    } catch (error: any) {
      console.error('Order placement error:', error);
      setPaymentErrors(error.message || 'Failed to place order');
      toast.error('Failed to place order');
    } finally {
      setIsPlacingOrder(false);
    }
  };

  // Handle navigation away
  const handleNavigationAway = () => {
    setShowAbandonmentWarning(true);
  };

  // Handle abandonment warning response
  const handleAbandonmentResponse = (saveData: boolean) => {
    if (saveData) {
      // Save progress and navigate away
      clearSession();
    }
    setShowAbandonmentWarning(false);
    router.push('/cart');
  };

  // Show loading indicator during initialization
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
            <h1 className="text-xl font-bold text-gray-900">
              {language === 'bn' ? 'গেস্ট চেকআউট' : 'Guest Checkout'}
            </h1>
            <div className="w-24"></div>
          </div>
        </div>
      </header>
      
      {/* Progress Steps */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">
                {language === 'en' ? 'Checkout Progress' : 'চেকআউট অগ্রগতি'}
              </span>
              <span className="text-sm font-semibold text-blue-600">
                {progress.progressPercentage}%
              </span>
            </div>
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-500 ease-out"
                style={{ width: `${progress.progressPercentage}%` }}
                role="progressbar"
                aria-valuenow={progress.progressPercentage}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={`${language === 'en' ? 'Checkout progress' : 'চেকআউট অগ্রগতি'} ${progress.progressPercentage}%`}
              />
            </div>
          </div>

          {/* Desktop Progress Steps */}
          <div className="hidden md:flex items-center justify-between">
            {['info', 'address', 'payment', 'review'].map((stepKey, index) => {
              const isActive = step === stepKey;
              const isCompleted = progress.completedSteps.includes(stepKey as any);
              const stepConfig = {
                info: { label: 'Info', labelBn: 'তথ্য', icon: <UserPlus className="w-5 h-5" /> },
                address: { label: 'Address', labelBn: 'ঠিকানা', icon: <MapPin className="w-5 h-5" /> },
                payment: { label: 'Payment', labelBn: 'পেমেন্ট', icon: <CreditCard className="w-5 h-5" /> },
                review: { label: 'Review', labelBn: 'পর্যালোচনা', icon: <CheckCircle className="w-5 h-5" /> },
              }[stepKey as keyof typeof stepConfig];
              
              return (
                <React.Fragment key={stepKey}>
                  {/* Step Circle */}
                  <div className="flex flex-col items-center flex-1">
                    <button
                      type="button"
                      onClick={() => {
                        if (progress.canNavigateBack || progress.canNavigateForward) {
                          setStep(stepKey as GuestCheckoutStep);
                          updateStep(stepKey as GuestCheckoutStep);
                        }
                      }}
                      disabled={!progress.canNavigateBack && !progress.canNavigateForward}
                      className={cn(
                        'relative flex items-center justify-center w-12 h-12 rounded-full transition-all duration-300',
                        isCompleted && 'bg-green-500 text-white',
                        isActive && !isCompleted && 'bg-blue-600 text-white ring-4 ring-blue-100',
                        !isActive && !isCompleted && 'bg-gray-200 text-gray-500',
                        (progress.canNavigateBack || progress.canNavigateForward) && 'cursor-pointer hover:scale-105',
                        !(progress.canNavigateBack || progress.canNavigateForward) && 'cursor-default'
                      )}
                      aria-label={`${language === 'en' ? 'Step' : 'ধাপ'} ${index + 1}: ${language === 'en' ? stepConfig.label : stepConfig.labelBn}`}
                      aria-current={isActive ? 'step' : undefined}
                    >
                      {isCompleted ? (
                        <CheckCircle className="w-6 h-6" />
                      ) : isActive ? (
                        <span className="text-lg font-semibold">{index + 1}</span>
                      ) : (
                        <div className="w-3 h-3 rounded-full bg-gray-400" />
                      )}
                    </button>

                    {/* Step Label */}
                    <span
                      className={cn(
                        'mt-2 text-center text-sm font-medium transition-colors',
                        isCompleted && 'text-green-600',
                        isActive && !isCompleted && 'text-blue-600',
                        !isActive && !isCompleted && 'text-gray-500'
                      )}
                    >
                      {language === 'en' ? stepConfig.label : stepConfig.labelBn}
                    </span>
                  </div>

                  {/* Connector Line */}
                  {index < 3 && (
                    <div className="flex-1 h-0.5 mx-2">
                      <div
                        className={cn(
                          'h-full transition-all duration-500 ease-out',
                          isCompleted || index < ['info', 'address', 'payment', 'review'].indexOf(step) ? 'bg-green-500' : 'bg-gray-300'
                        )}
                      />
                    </div>
                  )}
                </React.Fragment>
              );
            })}
          </div>

          {/* Mobile Progress Steps */}
          <div className="md:hidden">
            {/* Compact Progress Bar */}
            <div className="flex items-center gap-2 mb-4">
              {['info', 'address', 'payment', 'review'].map((stepKey, index) => {
                const isActive = step === stepKey;
                const isCompleted = progress.completedSteps.includes(stepKey as any);
                
                return (
                  <React.Fragment key={stepKey}>
                    <button
                      type="button"
                      onClick={() => {
                        if (progress.canNavigateBack || progress.canNavigateForward) {
                          setStep(stepKey as GuestCheckoutStep);
                          updateStep(stepKey as GuestCheckoutStep);
                        }
                      }}
                      disabled={!progress.canNavigateBack && !progress.canNavigateForward}
                      className={cn(
                        'flex items-center justify-center w-8 h-8 rounded-full transition-all duration-300',
                        isCompleted && 'bg-green-500 text-white',
                        isActive && !isCompleted && 'bg-blue-600 text-white',
                        !isActive && !isCompleted && 'bg-gray-200 text-gray-500',
                        (progress.canNavigateBack || progress.canNavigateForward) && 'cursor-pointer',
                        !(progress.canNavigateBack || progress.canNavigateForward) && 'cursor-default'
                      )}
                      aria-label={`${language === 'en' ? 'Step' : 'ধাপ'} ${index + 1}: ${stepKey}`}
                    >
                      {isCompleted ? (
                        <CheckCircle className="w-4 h-4" />
                      ) : (
                        <span className="text-sm font-semibold">{index + 1}</span>
                      )}
                    </button>

                    {index < 3 && (
                      <div
                        className={cn(
                          'flex-1 h-0.5 transition-all duration-500 ease-out',
                          isCompleted || index < ['info', 'address', 'payment', 'review'].indexOf(step) ? 'bg-green-500' : 'bg-gray-300'
                        )}
                      />
                    )}
                  </React.Fragment>
                );
              })}
            </div>

            {/* Current Step Label */}
            <div className="text-center">
              <span className="text-sm font-medium text-gray-700">
                {language === 'en' ? 'Current Step' : 'বর্তমান ধাপ'}:
              </span>
              <span className="ml-2 text-sm font-semibold text-blue-600">
                {step === 'info' && (language === 'en' ? 'Info' : 'তথ্য')}
                {step === 'address' && (language === 'en' ? 'Address' : 'ঠিকানা')}
                {step === 'payment' && (language === 'en' ? 'Payment' : 'পেমেন্ট')}
                {step === 'review' && (language === 'en' ? 'Review' : 'পর্যালোচনা')}
              </span>
            </div>

            {/* Step Navigation Buttons */}
            {progress.canNavigateBack || progress.canNavigateForward && (
              <div className="flex items-center justify-between mt-4">
                {step !== 'info' && (
                  <button
                    type="button"
                    onClick={() => {
                      const stepIndex = ['info', 'address', 'payment', 'review'].indexOf(step);
                      if (stepIndex > 0) {
                        const prevStep = ['info', 'address', 'payment', 'review'][stepIndex - 1];
                        setStep(prevStep as GuestCheckoutStep);
                        updateStep(prevStep as GuestCheckoutStep);
                      }
                    }}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span>{language === 'en' ? 'Previous' : 'আগে'}</span>
                  </button>
                )}

                {step !== 'review' && (
                  <button
                    type="button"
                    onClick={() => {
                      const stepIndex = ['info', 'address', 'payment', 'review'].indexOf(step);
                      if (stepIndex < 3) {
                        const nextStep = ['info', 'address', 'payment', 'review'][stepIndex + 1];
                        setStep(nextStep as GuestCheckoutStep);
                        updateStep(nextStep as GuestCheckoutStep);
                      }
                    }}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors ml-auto"
                  >
                    <span>{language === 'en' ? 'Next' : 'পরবর্তী'}</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Guest Info Step */}
            {step === 'info' && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center gap-3 mb-6">
                  <UserPlus className="w-6 h-6 text-blue-600" />
                  <h2 className="text-lg font-semibold text-gray-900">
                    {language === 'bn' ? 'আপনার তথ্য' : 'Your Information'}
                  </h2>
                </div>
                
                <GuestInfoForm
                  onSubmit={handleGuestInfoSubmit}
                  initialData={guestInfo}
                  isLoading={isCheckoutLoading}
                  language={language}
                  showAccountCreation={true}
                />
              </div>
            )}
            
            {/* Address Step */}
            {step === 'address' && (
              <div className="space-y-6">
                {/* Shipping Address Form */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center gap-3 mb-6">
                    <MapPin className="w-6 h-6 text-blue-600" />
                    <h2 className="text-lg font-semibold text-gray-900">
                      {language === 'bn' ? 'শিপিং ঠিকানা' : 'Shipping Address'}
                    </h2>
                  </div>
                  
                  <form onSubmit={handleShippingSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          {language === 'bn' ? 'পূর্ণ নাম' : 'Full Name'} *
                        </label>
                        <input
                          type="text"
                          value={shippingAddress.fullName}
                          onChange={(e) => handleShippingFieldChange('fullName', e.target.value)}
                          className={cn(
                            "w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500",
                            errors.shippingFullName ? "border-red-500" : "border-gray-300"
                          )}
                          placeholder={language === 'bn' ? 'পূর্ণ নাম লিখুন' : 'Enter your full name'}
                        />
                        {errors.shippingFullName && (
                          <p className="mt-1 text-sm text-red-600">{errors.shippingFullName}</p>
                        )}
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          {language === 'bn' ? 'ফোন নম্বর' : 'Phone Number'} *
                        </label>
                        <input
                          type="tel"
                          value={shippingAddress.phone}
                          onChange={(e) => handleShippingFieldChange('phone', e.target.value)}
                          className={cn(
                            "w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500",
                            errors.shippingPhone ? "border-red-500" : "border-gray-300"
                          )}
                          placeholder="01XXXXXXXXX"
                        />
                        {errors.shippingPhone && (
                          <p className="mt-1 text-sm text-red-600">{errors.shippingPhone}</p>
                        )}
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {language === 'bn' ? 'ঠিকানা 1' : 'Address Line 1'} *
                      </label>
                      <input
                        type="text"
                        value={shippingAddress.addressLine1}
                        onChange={(e) => handleShippingFieldChange('addressLine1', e.target.value)}
                        className={cn(
                          "w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500",
                          errors.shippingAddressLine1 ? "border-red-500" : "border-gray-300"
                        )}
                        placeholder={language === 'bn' ? 'রাস্তা, বাড়ি নম্বর' : 'Street address, house number'}
                      />
                      {errors.shippingAddressLine1 && (
                        <p className="mt-1 text-sm text-red-600">{errors.shippingAddressLine1}</p>
                      )}
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {language === 'bn' ? 'ঠিকানা 2 (ঐচ্ছিক)' : 'Address Line 2 (Optional)'}
                      </label>
                      <input
                        type="text"
                        value={shippingAddress.addressLine2}
                        onChange={(e) => handleShippingFieldChange('addressLine2', e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder={language === 'bn' ? 'অ্যাপার্টমেন্ট, স্যুট, ইউনিট' : 'Apartment, suite, unit, etc.'}
                      />
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          {language === 'bn' ? 'শহর' : 'City'} *
                        </label>
                        <input
                          type="text"
                          value={shippingAddress.city}
                          onChange={(e) => handleShippingFieldChange('city', e.target.value)}
                          className={cn(
                            "w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500",
                            errors.shippingCity ? "border-red-500" : "border-gray-300"
                          )}
                          placeholder={language === 'bn' ? 'শহর' : 'City'}
                        />
                        {errors.shippingCity && (
                          <p className="mt-1 text-sm text-red-600">{errors.shippingCity}</p>
                        )}
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          {language === 'bn' ? 'জেলা' : 'District'} *
                        </label>
                        <select
                          value={shippingAddress.district}
                          onChange={(e) => handleShippingFieldChange('district', e.target.value)}
                          className={cn(
                            "w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500",
                            errors.shippingDistrict ? "border-red-500" : "border-gray-300"
                          )}
                        >
                          <option value="">{language === 'bn' ? 'জেলা নির্বাচন করুন' : 'Select District'}</option>
                          {districtNames.map((district) => (
                            <option key={district} value={district}>{district}</option>
                          ))}
                        </select>
                        {errors.shippingDistrict && (
                          <p className="mt-1 text-sm text-red-600">{errors.shippingDistrict}</p>
                        )}
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          {language === 'bn' ? 'পোস্টাল কোড' : 'Postal Code'} *
                        </label>
                        <input
                          type="text"
                          value={shippingAddress.postalCode}
                          onChange={(e) => handleShippingFieldChange('postalCode', e.target.value)}
                          className={cn(
                            "w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500",
                            errors.shippingPostalCode ? "border-red-500" : "border-gray-300"
                          )}
                          placeholder={language === 'bn' ? 'পোস্টাল কোড' : 'Postal code'}
                        />
                        {errors.shippingPostalCode && (
                          <p className="mt-1 text-sm text-red-600">{errors.shippingPostalCode}</p>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 mb-4">
                      <input
                        type="checkbox"
                        id="useSameAddress"
                        checked={useSameAddress}
                        onChange={(e) => setUseSameAddress(e.target.checked)}
                        className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 focus:border-transparent"
                      />
                      <label 
                        htmlFor="useSameAddress" 
                        className="text-sm text-gray-700 cursor-pointer"
                      >
                        {language === 'bn' ? 'বিলিং ঠিকানা শিপিং ঠিকানার মতো' : 'Billing address same as shipping address'}
                      </label>
                    </div>
                    
                    <div className="flex justify-end pt-4">
                      <button
                        type="submit"
                        className="px-6 py-3 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                      >
                        {language === 'bn' ? 'পেমেন্টে যান' : 'Continue to Payment'}
                      </button>
                    </div>
                  </form>
                </div>

                {/* Billing Address Form - Only shown when useSameAddress is false */}
                {!useSameAddress && (
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center gap-3 mb-6">
                      <CreditCard className="w-6 h-6 text-purple-600" />
                      <h2 className="text-lg font-semibold text-gray-900">
                        {language === 'bn' ? 'বিলিং ঠিকানা' : 'Billing Address'}
                      </h2>
                    </div>

                    <form className="space-y-4 mt-6">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            {language === 'bn' ? 'পূর্ণ নাম' : 'Full Name'}
                          </label>
                          <input
                            type="text"
                            value={billingAddress.fullName}
                            onChange={(e) => handleBillingFieldChange('fullName', e.target.value)}
                            className={cn(
                              "w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500",
                              errors.billingFullName ? "border-red-500" : "border-gray-300"
                            )}
                            placeholder={language === 'bn' ? 'পূর্ণ নাম লিখুন' : 'Enter your full name'}
                          />
                          {errors.billingFullName && (
                            <p className="mt-1 text-sm text-red-600">{errors.billingFullName}</p>
                          )}
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            {language === 'bn' ? 'ফোন নম্বর' : 'Phone Number'}
                          </label>
                          <input
                            type="tel"
                            value={billingAddress.phone}
                            onChange={(e) => handleBillingFieldChange('phone', e.target.value)}
                            className={cn(
                              "w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500",
                              errors.billingPhone ? "border-red-500" : "border-gray-300"
                            )}
                            placeholder="01XXXXXXXXX"
                          />
                          {errors.billingPhone && (
                            <p className="mt-1 text-sm text-red-600">{errors.billingPhone}</p>
                          )}
                        </div>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          {language === 'bn' ? 'ঠিকানা 1' : 'Address Line 1'}
                        </label>
                        <input
                          type="text"
                          value={billingAddress.addressLine1}
                          onChange={(e) => handleBillingFieldChange('addressLine1', e.target.value)}
                          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder={language === 'bn' ? 'রাস্তা, বাড়ি নম্বর' : 'Street address, house number'}
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          {language === 'bn' ? 'ঠিকানা 2 (ঐচ্ছিক)' : 'Address Line 2 (Optional)'}
                        </label>
                        <input
                          type="text"
                          value={billingAddress.addressLine2}
                          onChange={(e) => handleBillingFieldChange('addressLine2', e.target.value)}
                          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder={language === 'bn' ? 'অ্যাপার্টমেন্ট, স্যুট, ইউনিট' : 'Apartment, suite, unit, etc.'}
                        />
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            {language === 'bn' ? 'শহর' : 'City'}
                          </label>
                          <input
                            type="text"
                            value={billingAddress.city}
                            onChange={(e) => handleBillingFieldChange('city', e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder={language === 'bn' ? 'শহর' : 'City'}
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            {language === 'bn' ? 'জেলা' : 'District'}
                          </label>
                          <select
                            value={billingAddress.district}
                            onChange={(e) => handleBillingFieldChange('district', e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="">{language === 'bn' ? 'জেলা নির্বাচন করুন' : 'Select District'}</option>
                            {districtNames.map((district) => (
                              <option key={district} value={district}>{district}</option>
                            ))}
                          </select>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            {language === 'bn' ? 'পোস্টাল কোড' : 'Postal Code'}
                          </label>
                          <input
                            type="text"
                            value={billingAddress.postalCode}
                            onChange={(e) => handleBillingFieldChange('postalCode', e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder={language === 'bn' ? 'পোস্টাল কোড' : 'Postal code'}
                          />
                        </div>
                      </div>
                    </form>
                  </div>
                )}
              </div>
            )}
            
            {/* Payment Step */}
            {step === 'payment' && (
              <div className="space-y-6">
                {/* Payment Method Selection */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center gap-3 mb-6">
                    <CreditCard className="w-6 h-6 text-blue-600" />
                    <h2 className="text-lg font-semibold text-gray-900">
                      {language === 'bn' ? 'পেমেন্ট পদ্ধতি' : 'Payment Method'}
                    </h2>
                  </div>

                  <div className="space-y-3">
                    {paymentMethods.map((method) => (
                      <button
                        key={method.id}
                        type="button"
                        onClick={() => {
                          setSelectedPayment(method.id);
                          setPaymentMethod(method.id);
                        }}
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
                </div>

                {paymentErrors && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                    <p className="text-sm text-red-600 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4" />
                      {paymentErrors}
                    </p>
                  </div>
                )}
                
                <div className="flex justify-end pt-6">
                  <button
                    type="button"
                    onClick={handlePaymentSubmit}
                    className="px-6 py-3 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  >
                    {language === 'bn' ? 'পর্যালোচনা চালিয়ে যান' : 'Continue to Review'}
                  </button>
                </div>
              </div>
            )}
            
            {/* Review Step */}
            {step === 'review' && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center gap-3 mb-6">
                  <CheckCircle className="w-6 h-6 text-blue-600" />
                  <h2 className="text-lg font-semibold text-gray-900">
                    {language === 'bn' ? 'অর্ডার পর্যালোচনা' : 'Order Review'}
                  </h2>
                </div>
                
                {/* Shipping Address Summary */}
                <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                  <h3 className="font-medium text-gray-900 mb-2">
                    {language === 'bn' ? 'শিপিং ঠিকানা:' : 'Shipping To:'}
                  </h3>
                  <p className="text-gray-600">{shippingAddress.fullName}</p>
                  <p className="text-gray-600">{shippingAddress.addressLine1}</p>
                  {shippingAddress.addressLine2 && <p className="text-gray-600">{shippingAddress.addressLine2}</p>}
                  <p className="text-gray-600">{shippingAddress.city}, {shippingAddress.district} {shippingAddress.postalCode}</p>
                  <p className="text-gray-600">{shippingAddress.phone}</p>
                </div>

                {/* Billing Address Summary */}
                <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                  <h3 className="font-medium text-gray-900 mb-2">
                    {useSameAddress 
                      ? (language === 'bn' ? 'বিলিং ঠিকানা (শিপিং ঠিকানার মতো):' : 'Billing To (Same as Shipping):')
                      : (language === 'bn' ? 'বিলিং ঠিকানা:' : 'Billing To:')}
                  </h3>
                  {useSameAddress ? (
                    <p className="text-gray-600 italic">
                      {language === 'bn' ? 'শিপিং ঠিকানার মতো' : 'Same as shipping address'}
                    </p>
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
                  <h3 className="font-medium text-gray-900 mb-2">
                    {language === 'bn' ? 'পেমেন্ট পদ্ধতি:' : 'Payment Method:'}
                  </h3>
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
                
                <div className="flex justify-end pt-4">
                  <button
                    type="button"
                    onClick={handlePlaceOrder}
                    disabled={isPlacingOrder}
                    className="px-6 py-3 bg-green-600 text-white font-medium rounded-md hover:bg-green-700 transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50"
                  >
                    {isPlacingOrder ? (
                      <span className="flex items-center gap-2">
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>
                          {language === 'bn' ? 'অর্ডার করা হচ্ছে...' : 'Placing Order...'}
                        </span>
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <CheckCircle className="w-5 h-5" />
                        <span>
                          {language === 'bn' ? 'অর্ডার করুন' : 'Place Order'}
                        </span>
                      </span>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
          
          {/* Order Summary Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 sticky top-24">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                {language === 'bn' ? 'অর্ডার সারাংশ' : 'Order Summary'}
              </h2>
              
              {/* Cart Items */}
              <div className="space-y-4 mb-6 max-h-64 overflow-y-auto">
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
                  <span>{language === 'bn' ? 'উপমোট:' : 'Subtotal'}</span>
                  <span className="font-medium">{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex items-center justify-between text-sm text-gray-600">
                  <span>{language === 'bn' ? 'শিপিং:' : 'Shipping'}</span>
                  <span className="font-medium">
                    {shippingCost === 0 
                      ? (language === 'bn' ? 'বিনামূল্যে' : 'Free') 
                      : formatCurrency(shippingCost)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm text-gray-600">
                  <span>{language === 'bn' ? 'কর:' : 'Tax'}</span>
                  <span className="font-medium">{formatCurrency(tax)}</span>
                </div>
                {discount > 0 && (
                  <div className="flex items-center justify-between text-sm text-green-600">
                    <span>{language === 'bn' ? 'ছাড়:' : 'Discount'}</span>
                    <span className="font-medium">-{formatCurrency(discount)}</span>
                  </div>
                )}
                <div className="flex items-center justify-between border-t border-gray-200 pt-3">
                  <span className="text-base font-semibold text-gray-900">
                    {language === 'bn' ? 'মোট:' : 'Total'}
                  </span>
                  <span className="text-xl font-bold text-gray-900">
                    {formatCurrency(total)}
                  </span>
                </div>
              </div>
              
              {/* Security Badge */}
              <CheckoutSecurityBadge
                security={{
                  isSecure: true,
                  isHttps: typeof window !== 'undefined' && window.location.protocol === 'https:',
                  sslCertificate: {
                    valid: true,
                    issuer: "Let's Encrypt",
                    expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
                  },
                  sessionTimeout: 30,
                  sessionExpiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
                  warnings: [],
                  badges: [
                    {
                      type: 'ssl',
                      label: 'SSL Secured',
                      labelBn: 'SSL সুরক্ষিত',
                      icon: 'lock',
                      description: 'Your connection is encrypted',
                      descriptionBn: 'আপনার সংযোগ এনক্রিপ্ট করা হয়েছে',
                      verified: true,
                      verifiedAt: new Date().toISOString(),
                    },
                    {
                      type: 'pci_dss',
                      label: 'PCI DSS Compliant',
                      labelBn: 'PCI DSS সম্মত',
                      icon: 'shield',
                      description: 'Payment card industry compliant',
                      descriptionBn: 'পেমেন্ট কার্ড শিল্প সম্মত',
                      verified: true,
                      verifiedAt: new Date().toISOString(),
                    },
                  ],
                  compliance: {
                    pciDss: {
                      compliant: true,
                      version: '3.2.1',
                      lastAudit: new Date().toISOString(),
                    },
                    gdpr: {
                      compliant: true,
                      consentRequired: true,
                    },
                    dataProtection: {
                      compliant: true,
                      encryptionLevel: 'AES-256',
                    },
                  },
                }}
                language={language}
                showWarnings={true}
                onWarningDismiss={() => {}}
                className="mb-4"
              />
              
              {/* Security Notice */}
              <div className="mt-6 flex items-center gap-2 text-xs text-gray-500">
                <Shield className="w-4 h-4" />
                <span>
                  {language === 'bn' 
                    ? 'নিরাপদ চেকআউট - আপনার তথ্য সুরক্ষিত' 
                    : 'Secure checkout - Your information is protected'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </main>
      
      {/* Checkout Abandonment Warning */}
      <CheckoutAbandonmentWarning
        isOpen={showAbandonmentWarning}
        onSave={() => handleAbandonmentResponse(true)}
        onContinue={() => handleAbandonmentResponse(false)}
        onLeave={() => {
          clearSession();
          setShowAbandonmentWarning(false);
          router.push('/cart');
        }}
        language={language}
      />
    </div>
  );
}
