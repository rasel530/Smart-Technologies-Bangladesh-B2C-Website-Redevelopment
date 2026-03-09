'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, CreditCard, Truck, MapPin, CheckCircle, Shield, AlertCircle, Loader2, ShoppingBag, UserPlus, ChevronRight, ChevronLeft, Smartphone } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { useGuestCheckout } from '@/hooks/useGuestCheckout';
import GuestInfoForm from '@/components/checkout/GuestInfoForm';
import CheckoutSecurityBadge from '@/components/checkout/CheckoutSecurityBadge';
import CheckoutAbandonmentWarning from '@/components/checkout/CheckoutAbandonmentWarning';
import CheckoutProgress from '@/components/checkout/CheckoutProgress';
import EmiSelector from '@/components/cart/EmiSelector';
import EmiSummary from '@/components/cart/EmiSummary';
import CodFeeDisplay from '@/components/cart/CodFeeDisplay';
import LocalPaymentMethodSelector from '@/components/cart/LocalPaymentMethodSelector';
import LocalPaymentFeeDisplay from '@/components/cart/LocalPaymentFeeDisplay';
import LocalPaymentInstructions from '@/components/cart/LocalPaymentInstructions';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { districts } from '@/data/bangladesh-data';
import type { GuestCheckoutStep } from '@/types/guestCheckout';
import type { EmiPlan, EmiDetails } from '@/types/emi';
import type { LocalPaymentMethod } from '@/types/localPayment';
import { apiClient } from '@/lib/api/client';
import { validateCodOrder, getCodFee } from '@/lib/api/cod';
import { getAvailableEmiPlans, calculateEmi } from '@/lib/api/emi';

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

// Helper function to get shipping method details
const getShippingMethodDetails = (method: string, language: 'en' | 'bn') => {
  const methods: { [key: string]: { name: string; nameBn: string; days: string; daysBn: string } } = {
    STANDARD: {
      name: 'Standard Delivery',
      nameBn: 'স্ট্যান্ডার্ড ডেলিভারি',
      days: '3-5 business days',
      daysBn: '৩-৫ ব্যবসায়িক দিন',
    },
    EXPRESS: {
      name: 'Express Delivery',
      nameBn: 'এক্সপ্রেস ডেলিভারি',
      days: '1-2 business days',
      daysBn: '১-২ ব্যবসায়িক দিন',
    },
    INSIDE_DHAKA: {
      name: 'Inside Dhaka',
      nameBn: 'ঢাকার ভেতরে',
      days: '1-2 business days',
      daysBn: '১-২ ব্যবসায়িক দিন',
    },
    OUTSIDE_DHAKA: {
      name: 'Outside Dhaka',
      nameBn: 'ঢাকার বাইরে',
      days: '3-5 business days',
      daysBn: '৩-৫ ব্যবসায়িক দিন',
    },
  };
  return methods[method] || methods.STANDARD;
};

// Map frontend payment method IDs to backend payment method names (lowercase for backend API)
const mapPaymentMethodToBackend = (methodId: string): string => {
  const paymentMethodMap: { [key: string]: string } = {
    'cod': 'cash_on_delivery',
    'card': 'credit_card',
    'emi': 'emi',
    'bkash': 'bkash',
    'nagad': 'nagad',
    'rocket': 'rocket',
    'mcash': 'mcash',
  };
  return paymentMethodMap[methodId] || methodId;
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
  {
    id: 'mcash',
    name: 'MCash',
    nameBn: 'এমক্যাশ',
    icon: <CreditCard className="w-5 h-5" />,
  },
];

const districtNames = districts.map(d => d.name);

export default function GuestCheckoutPage() {
  const router = useRouter();
  const { items, subtotal, tax, shippingCost, discount, total, isLoading, isInitializing, clearCart, cartId, setShippingMethod: setCartShippingMethod, shippingMethod: cartShippingMethod } = useCart();
  
  const {
    session,
    guestInfo,
    shippingAddress,
    billingAddress,
    shippingMethod,
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
    saveShippingMethod,
    setShippingAddress,
    setBillingAddress,
    setShippingMethod,
    setPaymentMethod,
    setPaymentDetails,
  } = useGuestCheckout();

  const [step, setStep] = useState<GuestCheckoutStep>('info');
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [selectedShippingMethod, setSelectedShippingMethod] = useState<string>('STANDARD');
  const [selectedPayment, setSelectedPayment] = useState<string>('cod');
  const [useSameAddress, setUseSameAddress] = useState(true);
  const [showAbandonmentWarning, setShowAbandonmentWarning] = useState(false);
  const [language, setLanguage] = useState<'en' | 'bn'>('en');
  const [errors, setErrors] = useState<Partial<Record<string, string>>>({});
  const [paymentErrors, setPaymentErrors] = useState<string>('');

  // EMI state
  const [emiAvailable, setEmiAvailable] = useState(false);
  const [emiPlans, setEmiPlans] = useState<EmiPlan[]>([]);
  const [selectedEmiPlanId, setSelectedEmiPlanId] = useState<string | null>(null);
  const [selectedEmiPlan, setSelectedEmiPlan] = useState<EmiPlan | null>(null);
  const [emiDetails, setEmiDetails] = useState<EmiDetails | null>(null);
  const [isLoadingEmi, setIsLoadingEmi] = useState(false);

  // COD state
  const [codValidation, setCodValidation] = useState<any>(null);
  const [codFee, setCodFee] = useState<number>(0);
  const [isValidatingCod, setIsValidatingCod] = useState(false);

  // Local payment state
  const [localPaymentMethods, setLocalPaymentMethods] = useState<LocalPaymentMethod[]>([]);
  const [selectedLocalPaymentMethod, setSelectedLocalPaymentMethod] = useState<LocalPaymentMethod | null>(null);
  const [localPaymentFee, setLocalPaymentFee] = useState<any>(null);
  const [localPaymentPhone, setLocalPaymentPhone] = useState('');
  const [localPaymentPin, setLocalPaymentPin] = useState('');
  const [isLoadingLocalPayment, setIsLoadingLocalPayment] = useState(false);

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
    // Add a small delay to allow cart to load from localStorage
    const timer = setTimeout(() => {
      if (!isInitializing && items.length === 0 && !isLoading) {
        toast.error('Your cart is empty');
        router.push('/cart');
      }
    }, 500); // 500ms delay to allow cart initialization to complete

    return () => clearTimeout(timer);
  }, [items.length, isLoading, isInitializing, router]);

  // Initialize guest checkout session on mount
  useEffect(() => {
    if (!isInitializing && items.length > 0) {
      initializeSession(undefined, undefined, cartId || undefined);
    }
  }, [isInitializing, items.length, initializeSession, cartId]);

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
      setStep('shipping');
      updateStep('shipping');
    }
  };

  // Handle shipping method submission
  const handleShippingMethodSubmit = async () => {
    try {
      // Get shipping method details - Note: Free shipping is applied at order completion, not at selection time
      const shippingMethodDetails: { cost: number; estimatedDays: number } = (() => {
        switch (selectedShippingMethod) {
          case 'STANDARD':
            return { cost: 100, estimatedDays: 3 };
          case 'EXPRESS':
            return { cost: 200, estimatedDays: 1 };
          case 'INSIDE_DHAKA':
            return { cost: 60, estimatedDays: 2 };
          case 'OUTSIDE_DHAKA':
            return { cost: 120, estimatedDays: 4 };
          default:
            return { cost: 100, estimatedDays: 3 };
        }
      })();

      // Update shipping method in hook
      setShippingMethod(selectedShippingMethod);

      // Update cart shipping method and cost in CartContext
      setCartShippingMethod(selectedShippingMethod, shippingMethodDetails.cost);

      // Save shipping method to backend using the hook's function
      // This calls the correct API endpoint: /guest/checkout/session/:sessionId/shipping
      await saveShippingMethod(selectedShippingMethod);

      // Update step to payment
      setStep('payment');
      updateStep('payment');
    } catch (error) {
      console.error('Error saving shipping method:', error);
      toast.error('Failed to save shipping method');
    }
  };

  // Handle payment submission
  const handlePaymentSubmit = () => {
    setStep('review');
    updateStep('review');
  };

  // Load EMI plans when total >= 5000
  useEffect(() => {
    const loadEmiPlans = async () => {
      try {
        setIsLoadingEmi(true);
        const response = await getAvailableEmiPlans(total);

        if (response.success && response.data) {
          setEmiPlans(response.data.plans);
          setEmiAvailable(response.data.plans.length > 0);
        }
      } catch (error) {
        console.error('Error loading EMI plans:', error);
        setEmiAvailable(false);
      } finally {
        setIsLoadingEmi(false);
      }
    };

    if (total >= 5000) {
      loadEmiPlans();
    } else {
      setEmiAvailable(false);
    }
  }, [total]);

  // Handle EMI plan selection
  const handleGuestEmiPlanSelect = async (planId: string, plan: EmiPlan) => {
    try {
      setSelectedEmiPlanId(planId);
      setSelectedEmiPlan(plan);

      const response = await calculateEmi(total, planId);

      if (response.success && response.data) {
        const emiData = response.data as any;
        setEmiDetails({
          ...emiData,
          planId,
          planName: plan.name,
          provider: {
            id: plan.providerId,
            name: plan.provider?.name || 'Unknown',
            logoUrl: plan.provider?.logoUrl || null,
            website: plan.provider?.website || null,
          },
        });
        setPaymentDetails({
          method: mapPaymentMethodToBackend('emi'),
          emiPlanId: planId,
          emiProviderId: plan.providerId,
          emiAmount: emiData.emiAmount || 0,
          emiDuration: emiData.duration || 0,
          emiInterestRate: emiData.interestRate || 0,
          totalPayable: emiData.totalPayable || 0,
          processingFee: emiData.processingFee || 0,
        });
      }
    } catch (error) {
      console.error('Error selecting EMI plan:', error);
      toast.error('Failed to select EMI plan');
      setSelectedEmiPlanId(null);
      setSelectedEmiPlan(null);
      setEmiDetails(null);
    }
  };

  // Validate COD availability
  const validateGuestCod = async () => {
    if (selectedPayment !== 'cod' || !shippingAddress.district) {
      return;
    }

    setIsValidatingCod(true);
    try {
      const validation = await validateCodOrder(
        null, // guest user
        {
          division: getDivisionFromDistrict(shippingAddress.district),
          district: shippingAddress.district,
          city: shippingAddress.city,
          address: shippingAddress.addressLine1
        },
        total
      );
      setCodValidation(validation.data);

      // Calculate COD fee
      const feeResponse = await getCodFee(total);
      setCodFee(feeResponse);

      setPaymentDetails({
        method: mapPaymentMethodToBackend('cod'),
        codFee: feeResponse,
      });
    } catch (error) {
      console.error('Error validating COD:', error);
      setCodValidation(null);
      setCodFee(0);
    } finally {
      setIsValidatingCod(false);
    }
  };

  // Validate COD when payment method or address changes
  useEffect(() => {
    if (selectedPayment === 'cod' && shippingAddress.district) {
      validateGuestCod();
    } else {
      setCodValidation(null);
      setCodFee(0);
    }
  }, [selectedPayment, shippingAddress.district, shippingAddress.city, total]);

  // Handle local payment method selection
  const handleGuestLocalPaymentMethodSelect = async (method: LocalPaymentMethod, feeResult?: any) => {
    setSelectedLocalPaymentMethod(method);
    setLocalPaymentFee(feeResult || null);

    setPaymentDetails({
      method: mapPaymentMethodToBackend(method.code),
      paymentMethodCode: method.code,
      paymentFee: feeResult?.totalFee || 0,
      totalAmount: feeResult?.totalAmount || total,
    });
  };

  // Handle local payment phone change
  const handleLocalPaymentPhoneChange = (value: string) => {
    setLocalPaymentPhone(value);
  };

  // Handle local payment PIN change
  const handleLocalPaymentPinChange = (value: string) => {
    setLocalPaymentPin(value);
  };

  // Auto-select first available local payment method
  useEffect(() => {
    if (['bkash', 'nagad', 'rocket', 'mcash'].includes(selectedPayment) &&
        localPaymentMethods.length > 0 &&
        !selectedLocalPaymentMethod) {
      const firstMethod = localPaymentMethods[0];
      handleGuestLocalPaymentMethodSelect(firstMethod);
    }
  }, [selectedPayment, localPaymentMethods, selectedLocalPaymentMethod]);

  // Helper function to get division from district
  const getDivisionFromDistrict = (district: string): string => {
    const districtData = districts.find(d => d.name === district);
    return (districtData as any)?.divisionId || 'Dhaka';
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
          <CheckoutProgress
            currentStep={step as any}
            completedSteps={progress.completedSteps as any}
            onStepClick={(step) => {
              if (progress.canNavigateBack || progress.canNavigateForward) {
                setStep(step as GuestCheckoutStep);
                updateStep(step as GuestCheckoutStep);
              }
            }}
            language={language}
            clickable={progress.canNavigateBack || progress.canNavigateForward}
            isGuest={true}
          />
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
                        {language === 'bn' ? 'শিপিং এ যান' : 'Continue to Shipping'}
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
            
            {/* Shipping Method Step */}
            {step === 'shipping' && (
              <div className="space-y-6">
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center gap-3 mb-6">
                    <Truck className="w-6 h-6 text-blue-600" />
                    <h2 className="text-lg font-semibold text-gray-900">
                      {language === 'bn' ? 'শিপিং পদ্ধতি' : 'Shipping Method'}
                    </h2>
                  </div>

                  <div className="space-y-3">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedShippingMethod('STANDARD');
                        setCartShippingMethod('STANDARD', 100);
                      }}
                      className={cn(
                        "w-full flex items-center justify-between p-4 border rounded-lg transition-colors",
                        selectedShippingMethod === 'STANDARD'
                          ? "border-blue-500 bg-blue-50"
                          : "border-gray-200 hover:border-gray-300"
                      )}
                    >
                      <div className="flex items-center gap-4">
                        <div className={cn(
                          "w-5 h-5 rounded-full border-2 flex items-center justify-center",
                          selectedShippingMethod === 'STANDARD' ? "border-blue-600" : "border-gray-300"
                        )}>
                          {selectedShippingMethod === 'STANDARD' && (
                            <div className="w-2.5 h-2.5 rounded-full bg-blue-600" />
                          )}
                        </div>
                        <div className="text-left">
                          <p className="font-medium text-gray-900">
                            {language === 'en' ? 'Standard Delivery' : 'স্ট্যান্ডার্ড ডেলিভারি'}
                          </p>
                          <p className="text-sm text-gray-600">
                            {language === 'en' ? '3-5 business days' : '৩-৫ ব্যবসায়িক দিন'}
                          </p>
                        </div>
                      </div>
                      <span className="font-semibold text-gray-900">৳100</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setSelectedShippingMethod('EXPRESS');
                        setCartShippingMethod('EXPRESS', 200);
                      }}
                      className={cn(
                        "w-full flex items-center justify-between p-4 border rounded-lg transition-colors",
                        selectedShippingMethod === 'EXPRESS'
                          ? "border-blue-500 bg-blue-50"
                          : "border-gray-200 hover:border-gray-300"
                      )}
                    >
                      <div className="flex items-center gap-4">
                        <div className={cn(
                          "w-5 h-5 rounded-full border-2 flex items-center justify-center",
                          selectedShippingMethod === 'EXPRESS' ? "border-blue-600" : "border-gray-300"
                        )}>
                          {selectedShippingMethod === 'EXPRESS' && (
                            <div className="w-2.5 h-2.5 rounded-full bg-blue-600" />
                          )}
                        </div>
                        <div className="text-left">
                          <p className="font-medium text-gray-900">
                            {language === 'en' ? 'Express Delivery' : 'এক্সপ্রেস ডেলিভারি'}
                          </p>
                          <p className="text-sm text-gray-600">
                            {language === 'en' ? '1-2 business days' : '১-২ ব্যবসায়িক দিন'}
                          </p>
                        </div>
                      </div>
                      <span className="font-semibold text-gray-900">৳200</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setSelectedShippingMethod('INSIDE_DHAKA');
                        setCartShippingMethod('INSIDE_DHAKA', 60);
                      }}
                      className={cn(
                        "w-full flex items-center justify-between p-4 border rounded-lg transition-colors",
                        selectedShippingMethod === 'INSIDE_DHAKA'
                          ? "border-blue-500 bg-blue-50"
                          : "border-gray-200 hover:border-gray-300"
                      )}
                    >
                      <div className="flex items-center gap-4">
                        <div className={cn(
                          "w-5 h-5 rounded-full border-2 flex items-center justify-center",
                          selectedShippingMethod === 'INSIDE_DHAKA' ? "border-blue-600" : "border-gray-300"
                        )}>
                          {selectedShippingMethod === 'INSIDE_DHAKA' && (
                            <div className="w-2.5 h-2.5 rounded-full bg-blue-600" />
                          )}
                        </div>
                        <div className="text-left">
                          <p className="font-medium text-gray-900">
                            {language === 'en' ? 'Inside Dhaka' : 'ঢাকার ভেতরে'}
                          </p>
                          <p className="text-sm text-gray-600">
                            {language === 'en' ? '1-2 business days' : '১-২ ব্যবসায়িক দিন'}
                          </p>
                        </div>
                      </div>
                      <span className="font-semibold text-gray-900">৳60</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setSelectedShippingMethod('OUTSIDE_DHAKA');
                        setCartShippingMethod('OUTSIDE_DHAKA', 120);
                      }}
                      className={cn(
                        "w-full flex items-center justify-between p-4 border rounded-lg transition-colors",
                        selectedShippingMethod === 'OUTSIDE_DHAKA'
                          ? "border-blue-500 bg-blue-50"
                          : "border-gray-200 hover:border-gray-300"
                      )}
                    >
                      <div className="flex items-center gap-4">
                        <div className={cn(
                          "w-5 h-5 rounded-full border-2 flex items-center justify-center",
                          selectedShippingMethod === 'OUTSIDE_DHAKA' ? "border-blue-600" : "border-gray-300"
                        )}>
                          {selectedShippingMethod === 'OUTSIDE_DHAKA' && (
                            <div className="w-2.5 h-2.5 rounded-full bg-blue-600" />
                          )}
                        </div>
                        <div className="text-left">
                          <p className="font-medium text-gray-900">
                            {language === 'en' ? 'Outside Dhaka' : 'ঢাকার বাইরে'}
                          </p>
                          <p className="text-sm text-gray-600">
                            {language === 'en' ? '3-5 business days' : '৩-৫ ব্যবসায়িক দিন'}
                          </p>
                        </div>
                      </div>
                      <span className="font-semibold text-gray-900">৳120</span>
                    </button>
                  </div>
                </div>

                <div className="flex justify-between pt-6">
                  <button
                    type="button"
                    onClick={() => setStep('address')}
                    className="px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-md hover:bg-gray-50 transition-colors"
                  >
                    {language === 'bn' ? 'ফিরে যান' : 'Back'}
                  </button>
                  <button
                    type="button"
                    onClick={handleShippingMethodSubmit}
                    className="px-6 py-3 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  >
                    {language === 'bn' ? 'পেমেন্টে যান' : 'Continue to Payment'}
                  </button>
                </div>
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
                          // Use the mapped backend value for paymentMethod (e.g., 'cash_on_delivery')
                          setPaymentMethod(mapPaymentMethodToBackend(method.id));
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

                {/* EMI Options */}
                {selectedPayment === 'emi' && (
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center gap-3 mb-6">
                      <CreditCard className="w-6 h-6 text-purple-600" />
                      <h2 className="text-lg font-semibold text-gray-900">
                        {language === 'bn' ? 'ইএমআই অপশনস' : 'EMI Options'}
                      </h2>
                    </div>

                    {isLoadingEmi ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                        <span className="ml-3 text-gray-600">
                          {language === 'bn' ? 'ইএমআই অপশনস লোড হচ্ছে...' : 'Loading EMI options...'}
                        </span>
                      </div>
                    ) : emiAvailable ? (
                      <>
                        <EmiSelector
                          availablePlans={emiPlans}
                          selectedPlanId={selectedEmiPlanId || undefined}
                          onPlanSelect={handleGuestEmiPlanSelect}
                          language={language}
                        />

                        {emiDetails && (
                          <div className="mt-6">
                            <EmiSummary
                              emiDetails={emiDetails}
                              language={language}
                              showBreakdown={true}
                            />
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="bg-gray-50 border border-gray-200 rounded-md p-6">
                        <p className="text-sm text-gray-700">
                          {language === 'bn' 
                            ? 'ইএমআই ৳৫,০০০ বা তার উপরের অর্ডারের জন্য পাওয়া যায়।'
                            : 'EMI is available for orders of ৳5,000 and above.'}
                        </p>
                        <p className="text-sm text-gray-600 mt-2">
                          {language === 'bn' 
                            ? `বর্তমান অর্ডার মোট: ৳${total.toLocaleString('en-BD', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                            : `Current order total: ৳${total.toLocaleString('en-BD', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* COD Validation */}
                {selectedPayment === 'cod' && (
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center gap-3 mb-6">
                      <Truck className="w-6 h-6 text-blue-600" />
                      <h2 className="text-lg font-semibold text-gray-900">
                        {language === 'bn' ? 'সিওডি বিকশুলতা' : 'COD Availability'}
                      </h2>
                    </div>

                    {isValidatingCod && (
                      <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-md">
                        <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />
                        <span className="text-sm text-blue-600">
                          {language === 'bn' ? 'সিওডি বিকশুলতা যাচাই করা হচ্ছে...' : 'Validating COD availability...'}
                        </span>
                      </div>
                    )}

                    {!isValidatingCod && codValidation && (
                      <>
                        {codValidation.valid ? (
                          <div className="p-3 bg-green-50 border border-green-200 rounded-md">
                            <div className="flex items-start gap-2">
                              <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
                              <div className="flex-1">
                                <p className="text-sm text-green-800 font-medium">
                                  {language === 'bn' ? 'সিওডি বিকশুলতা আছে' : 'COD is available'}
                                </p>
                                {codFee > 0 && (
                                  <p className="text-sm text-green-700 mt-1">
                                    {language === 'bn' 
                                      ? `অতিরিত সিওডি ফি: ৳${codFee.toFixed(0)}`
                                      : `Additional COD fee: ৳${codFee.toFixed(0)}`}
                                  </p>
                                )}
                                <p className="text-sm text-green-700 mt-1">
                                  {language === 'bn' 
                                    ? `আনুমান ডেলিভারি: ${codValidation.deliveryDays} দিন`
                                      : `Estimated delivery: ${codValidation.deliveryDays} days`}
                                  </p>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                            <div className="flex items-start gap-2">
                              <AlertCircle className="w-4 h-4 text-red-600 mt-0.5" />
                              <div className="flex-1">
                                <p className="text-sm text-red-800 font-medium">
                                  {language === 'bn' ? 'সিওডি বিকশুলতা নেই' : 'COD is not available'}
                                </p>
                                <p className="text-sm text-red-700 mt-1">
                                  {language === 'bn' 
                                    ? codValidation.reason 
                                    : codValidation.reason}
                                </p>
                              </div>
                            </div>
                          </div>
                        )}
                      </>
                    )}

                    {/* COD Fee Display */}
                    <div className="mt-4">
                      <CodFeeDisplay
                        amount={total}
                        fee={codFee}
                        language={language}
                        showBreakdown={true}
                      />
                    </div>
                  </div>
                )}

                {/* Local Payment Options */}
                {['bkash', 'nagad', 'rocket', 'mcash'].includes(selectedPayment) && (
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center gap-3 mb-6">
                      <Smartphone className="w-6 h-6 text-blue-600" />
                      <h2 className="text-lg font-semibold text-gray-900">
                        {language === 'bn' ? 'মোবাইল পেমেন্ট' : 'Mobile Payment'}
                      </h2>
                    </div>

                    {/* Selection Required Indicator */}
                    {!selectedLocalPaymentMethod && (
                      <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-md">
                        <div className="flex items-start gap-2">
                          <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" aria-hidden="true" />
                          <p className="text-sm text-amber-800">
                            {language === 'bn' 
                              ? 'অনুবার থেকে পেমেন্ট পদ্ধতি নির্বাচন করুন'
                              : 'Please select a payment method from options below to continue'}
                          </p>
                        </div>
                      </div>
                    )}

                    <LocalPaymentMethodSelector
                      amount={total}
                      selectedMethodCode={selectedPayment}
                      onMethodSelect={handleGuestLocalPaymentMethodSelect}
                      language={language}
                      showFee={true}
                    />

                    {/* Local Payment Fee Display */}
                    {localPaymentFee && (
                      <div className="mt-4">
                        <LocalPaymentFeeDisplay
                          amount={total}
                          methodCode={selectedPayment}
                          language={language}
                        />
                      </div>
                    )}

                    {/* Local Payment Instructions */}
                    <div className="mt-4">
                      <LocalPaymentInstructions
                        methodCode={selectedPayment}
                        language={language}
                      />
                    </div>

                    {/* Phone and PIN Input */}
                    {selectedLocalPaymentMethod && (
                      <div className="mt-4 space-y-4">
                        {selectedLocalPaymentMethod.requiresPhone && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              {language === 'bn' ? 'ফোন নম্বর *' : 'Phone Number *'}
                            </label>
                            <input
                              type="tel"
                              value={localPaymentPhone}
                              onChange={(e) => handleLocalPaymentPhoneChange(e.target.value)}
                              placeholder="01XXXXXXXXX"
                              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                        )}

                        {selectedLocalPaymentMethod.requiresPin && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              {language === 'bn' ? 'পিন *' : 'PIN *'}
                            </label>
                            <input
                              type="password"
                              value={localPaymentPin}
                              onChange={(e) => handleLocalPaymentPinChange(e.target.value)}
                              placeholder={language === 'bn' ? 'আপনার পিন লিখুন' : 'Enter your PIN'}
                              maxLength={5}
                              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

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

                  {/* EMI Details */}
                  {selectedPayment === 'emi' && emiDetails && (
                    <div className="mt-3 space-y-2">
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-600">
                          {language === 'bn' ? 'প্রোভাইডার:' : 'Provider:'}
                        </span>
                        <span className="font-medium text-gray-900">{emiDetails.provider.name}</span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-600">
                          {language === 'bn' ? 'প্ল্যান:' : 'Plan:'}
                        </span>
                        <span className="font-medium text-gray-900">{emiDetails.planName}</span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-600">
                          {language === 'bn' ? 'মাসিক ইএমআই:' : 'Monthly EMI:'}
                        </span>
                        <span className="font-medium text-blue-600">
                          ৳{emiDetails.emiAmount.toLocaleString('en-BD', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-600">
                          {language === 'bn' ? 'মেয়াদ:' : 'Duration:'}
                        </span>
                        <span className="font-medium text-gray-900">{emiDetails.duration} {language === 'bn' ? 'মাস' : 'months'}</span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-600">
                          {language === 'bn' ? 'মোট পরিশোধ্য সমষি:' : 'Total Payable:'}
                        </span>
                        <span className="font-medium text-green-600">
                          ৳{emiDetails.totalPayable.toLocaleString('en-BD', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* COD Details */}
                  {selectedPayment === 'cod' && codValidation && (
                    <div className="mt-3 space-y-2">
                      {codFee > 0 && (
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-gray-600">
                            {language === 'bn' ? 'সিওডি ফি:' : 'COD Fee:'}
                          </span>
                          <span className="font-medium text-gray-900">
                            ৳{codFee.toFixed(0)}
                          </span>
                        </div>
                      )}
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-600">
                          {language === 'bn' ? 'ডেলিভারি:' : 'Delivery:'}
                        </span>
                        <span className="font-medium text-gray-900">
                          {codValidation.deliveryDays} {language === 'bn' ? 'দিন' : 'days'}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Local Payment Details */}
                  {['bkash', 'nagad', 'rocket', 'mcash'].includes(selectedPayment) && selectedLocalPaymentMethod && (
                    <div className="mt-3 space-y-2">
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-600">
                          {language === 'bn' ? 'পদ্ধতি:' : 'Method:'}
                        </span>
                        <span className="font-medium text-gray-900">{selectedLocalPaymentMethod.displayName}</span>
                      </div>
                      {localPaymentFee && localPaymentFee.totalFee > 0 && (
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-gray-600">
                            {language === 'bn' ? 'পেমেন্ট ফি:' : 'Payment Fee:'}
                          </span>
                          <span className="font-medium text-red-600">
                            +৳{localPaymentFee.totalFee.toFixed(2)}
                          </span>
                        </div>
                      )}
                      {localPaymentFee && (
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-gray-600">
                            {language === 'bn' ? 'মোট সমষি:' : 'Total Amount:'}
                          </span>
                          <span className="font-medium text-blue-600">
                            ৳{localPaymentFee.totalAmount.toLocaleString('en-BD', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                        </div>
                      )}
                      {localPaymentPhone && (
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-gray-600">
                            {language === 'bn' ? 'ফোন:' : 'Phone:'}
                          </span>
                          <span className="font-medium text-gray-900">{localPaymentPhone}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                
                {/* Shipping Method Summary */}
                <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                  <h3 className="font-medium text-gray-900 mb-2">
                    {language === 'bn' ? 'শিপিং পদ্ধতি:' : 'Shipping Method:'}
                  </h3>
                  <p className="text-gray-600">
                    {selectedShippingMethod === 'STANDARD' && (language === 'en' ? 'Standard Delivery (3-5 days)' : 'স্ট্যান্ডার্ড ডেলিভারি (৩-৫ দিন)')}
                    {selectedShippingMethod === 'EXPRESS' && (language === 'en' ? 'Express Delivery (1-2 days)' : 'এক্সপ্রেস ডেলিভারি (১-২ দিন)')}
                    {selectedShippingMethod === 'INSIDE_DHAKA' && (language === 'en' ? 'Inside Dhaka (1-2 days)' : 'ঢাকার ভেতরে (১-২ দিন)')}
                    {selectedShippingMethod === 'OUTSIDE_DHAKA' && (language === 'en' ? 'Outside Dhaka (3-5 days)' : 'ঢাকার বাইরে (৩-৫ দিন)')}
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
                {/* Shipping cost and method details are shown after user has selected a shipping method (on 'shipping', 'payment', and 'review' steps) */}
                {step !== 'address' && step !== 'info' && (
                  <>
                    <div className="flex items-start justify-between text-sm text-gray-600">
                      <div className="flex-1">
                        <span className="block">{language === 'bn' ? 'শিপিং:' : 'Shipping'}</span>
                        {cartShippingMethod && (
                          <span className="block text-xs text-gray-500 mt-1">
                            {getShippingMethodDetails(cartShippingMethod, language).name}
                            {language === 'en' ? ` (${getShippingMethodDetails(cartShippingMethod, language).days})` : ` (${getShippingMethodDetails(cartShippingMethod, language).daysBn})`}
                          </span>
                        )}
                      </div>
                      <span className="font-medium">
                        {shippingCost === 0 
                          ? (language === 'bn' ? 'বিনামূল্যে' : 'Free') 
                          : formatCurrency(shippingCost)}
                      </span>
                    </div>
                  </>
                )}
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
                
                {/* Payment Fees */}
                {(selectedPayment === 'cod' && codFee > 0) && (
                  <div className="flex items-center justify-between text-sm text-gray-600">
                    <span>{language === 'bn' ? 'সিওডি ফি:' : 'COD Fee'}</span>
                    <span className="font-medium">{formatCurrency(codFee)}</span>
                  </div>
                )}
                {selectedPayment === 'emi' && emiDetails && emiDetails.processingFee > 0 && (
                  <div className="flex items-center justify-between text-sm text-gray-600">
                    <span>{language === 'bn' ? 'ইএমআই প্রসেসিং ফি:' : 'EMI Processing Fee'}</span>
                    <span className="font-medium">{formatCurrency(emiDetails.processingFee)}</span>
                  </div>
                )}
                {['bkash', 'nagad', 'rocket', 'mcash'].includes(selectedPayment) && localPaymentFee && localPaymentFee.totalFee > 0 && (
                  <div className="flex items-center justify-between text-sm text-gray-600">
                    <span>{language === 'bn' ? 'পেমেন্ট ফি:' : 'Payment Fee'}</span>
                    <span className="font-medium">{formatCurrency(localPaymentFee.totalFee)}</span>
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
