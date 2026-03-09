'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, CreditCard, Truck, MapPin, CheckCircle, Shield, AlertCircle, Loader2, Info, Smartphone, Wifi, User as UserIcon } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { useCheckoutAddresses } from '@/hooks/useCheckoutAddresses';
import { useCheckout } from '@/hooks/useCheckout';
import { User } from '@/types/auth';
import type { CheckoutStep, CheckoutValidationError } from '@/types/checkout';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { addressToShippingAddress, ShippingAddress } from '@/lib/utils/address';
import { apiClient } from '@/lib/api/client';
import { validateCodOrder, getCodFee } from '@/lib/api/cod';
import SavedAddressesSelector from '@/components/checkout/SavedAddressesSelector';
import BillingAddressToggle from '@/components/checkout/BillingAddressToggle';
import CheckoutProgress from '@/components/checkout/CheckoutProgress';
import CheckoutStepContainer from '@/components/checkout/CheckoutStepContainer';
import CheckoutSecurityBadge from '@/components/checkout/CheckoutSecurityBadge';
import CheckoutAbandonmentWarning from '@/components/checkout/CheckoutAbandonmentWarning';
import { districts } from '@/data/bangladesh-data';
import { CodValidationResult } from '@/types/cod';
import { EmiDetails, EmiPlan } from '@/types/emi';
import { LocalPaymentMethod, PaymentFeeResult } from '@/types/localPayment';
import EmiDisplay from '@/components/cart/EmiDisplay';
import EmiSelector from '@/components/cart/EmiSelector';
import EmiSummary from '@/components/cart/EmiSummary';
import CodAvailabilityIndicator from '@/components/cart/CodAvailabilityIndicator';
import CodFeeDisplay from '@/components/cart/CodFeeDisplay';
import CodWarningBanner from '@/components/cart/CodWarningBanner';
import LocalPaymentMethodSelector from '@/components/cart/LocalPaymentMethodSelector';
import LocalPaymentFeeDisplay from '@/components/cart/LocalPaymentFeeDisplay';
import LocalPaymentInstructions from '@/components/cart/LocalPaymentInstructions';
import OfflineCartIndicator from '@/components/cart/OfflineCartIndicator';

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

// Map frontend payment method IDs to backend payment method names
const mapPaymentMethodToBackend = (methodId: string): string => {
  const paymentMethodMap: { [key: string]: string } = {
    'cod': 'CASH_ON_DELIVERY',
    'card': 'CREDIT_CARD',
    'emi': 'EMI',
    'bkash': 'BKASH',
    'nagad': 'NAGAD',
    'rocket': 'ROCKET',
    'mcash': 'MCASH',
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

export default function CheckoutPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const isAuthenticated = !!user;
  const { items, subtotal, tax, shippingCost, discount, total, isLoading, isInitializing, setShippingMethod, clearCart, cartId } = useCart();
  
  // Use new checkout hook
  const {
    session,
    progress,
    security,
    isLoading: isCheckoutLoading,
    error: checkoutError,
    isAbandoned,
    abandonmentReason,
    initializeSession,
    updateStep,
    saveProgress,
    validateStep,
    completeCheckout,
    abandonCheckout,
    recoverCheckout,
    extendSession,
    clearSession,
    setSecurityWarning,
    dismissSecurityWarning,
  } = useCheckout();

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
  // Update to 4-step checkout process
  const [step, setStep] = useState<CheckoutStep>('address');
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<string>('cod');
  const [selectedShippingMethod, setSelectedShippingMethod] = useState<string>('STANDARD');
  const [hasAutoSelectedDefault, setHasAutoSelectedDefault] = useState(false);
  const [isPopulatingAddress, setIsPopulatingAddress] = useState(false);
  const [codValidation, setCodValidation] = useState<CodValidationResult | null>(null);
  const [codFee, setCodFee] = useState<number>(0);
  const [isValidatingCod, setIsValidatingCod] = useState(false);
  const [stepErrors, setStepErrors] = useState<CheckoutValidationError[]>([]);
  const [showAbandonmentWarning, setShowAbandonmentWarning] = useState(false);
  
  // EMI State
  const [emiAvailable, setEmiAvailable] = useState(false);
  const [emiPlans, setEmiPlans] = useState<EmiPlan[]>([]);
  const [selectedEmiPlanId, setSelectedEmiPlanId] = useState<string | null>(null);
  const [selectedEmiPlan, setSelectedEmiPlan] = useState<EmiPlan | null>(null);
  const [emiDetails, setEmiDetails] = useState<EmiDetails | null>(null);
  const [isLoadingEmi, setIsLoadingEmi] = useState(false);
  
  // Local Payment State
  const [localPaymentMethods, setLocalPaymentMethods] = useState<LocalPaymentMethod[]>([]);
  const [selectedLocalPaymentMethod, setSelectedLocalPaymentMethod] = useState<LocalPaymentMethod | null>(null);
  const [localPaymentFee, setLocalPaymentFee] = useState<PaymentFeeResult | null>(null);
  const [localPaymentPhone, setLocalPaymentPhone] = useState('');
  const [localPaymentPin, setLocalPaymentPin] = useState('');
  const [isLoadingLocalPayment, setIsLoadingLocalPayment] = useState(false);
  
  // Mobile/Offline State
  const [isMobile, setIsMobile] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);
  const [language, setLanguage] = useState<'en' | 'bn'>('en');

  // Guest checkout state
  const [showGuestCheckoutOption, setShowGuestCheckoutOption] = useState(false);

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
    if (!authLoading && !isAuthenticated && !showGuestCheckoutOption) {
      // Add a small delay to ensure session is fully stabilized
      const timer = setTimeout(() => {
        // Double-check authentication after delay to confirm
        if (!isAuthenticated) {
          setShowGuestCheckoutOption(true);
        }
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [authLoading, isAuthenticated, router, showGuestCheckoutOption]);

  // Redirect if cart is empty (only after initialization completes)
  useEffect(() => {
    if (!isInitializing && items.length === 0 && !isLoading) {
      toast.error('Your cart is empty');
      router.push('/cart');
    }
  }, [items.length, isLoading, isInitializing, router]);

  // Initialize checkout session when component mounts
  useEffect(() => {
    if (!authLoading && isAuthenticated && !isInitializing && items.length > 0) {
      initializeSession(user?.id || null, undefined, cartId);
    }
  }, [authLoading, isAuthenticated, isInitializing, items.length, user?.id, initializeSession, cartId]);

  // Handle abandonment warning
  useEffect(() => {
    if (isAbandoned && abandonmentReason) {
      setShowAbandonmentWarning(true);
    }
  }, [isAbandoned, abandonmentReason]);

  // Handle step changes
  useEffect(() => {
    if (session) {
      setStep(session.currentStep);
    }
  }, [session]);

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

  // Validate COD when payment method or address changes
  useEffect(() => {
    const validateCOD = async () => {
      if (selectedPayment === 'cod' && shippingAddress.district) {
        setIsValidatingCod(true);
        try {
          const validation = await validateCodOrder(
            user?.id,
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
        } catch (error) {
          console.error('Error validating COD:', error);
          setCodValidation(null);
          setCodFee(0);
        } finally {
          setIsValidatingCod(false);
        }
      } else {
        setCodValidation(null);
        setCodFee(0);
      }
    };

    validateCOD();
  }, [selectedPayment, shippingAddress.district, shippingAddress.city, total, user?.id]);

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
        setIsLoadingEmi(true);
        const { getAvailableEmiPlans } = await import('@/lib/api/emi');
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

    if (total >= 5000) { // EMI minimum amount
      loadEmiPlans();
    } else {
      setEmiAvailable(false);
      setEmiPlans([]);
    }
  }, [total]);

  // Helper function to get division from district
  const getDivisionFromDistrict = (district: string): string => {
    const divisionMap: { [key: string]: string } = {
      'Dhaka': 'dhaka',
      'Faridpur': 'dhaka',
      'Gazipur': 'dhaka',
      'Gopalganj': 'dhaka',
      'Jamalpur': 'dhaka',
      'Kishoreganj': 'dhaka',
      'Madaripur': 'dhaka',
      'Manikganj': 'dhaka',
      'Munshiganj': 'dhaka',
      'Mymensingh': 'mymensingh',
      'Netrokona': 'mymensingh',
      'Sherpur': 'mymensingh',
      'Chittagong': 'chittagong',
      'Brahmanbaria': 'chittagong',
      'Chandpur': 'chittagong',
      'Comilla': 'chittagong',
      'Coxs Bazar': 'chittagong',
      'Feni': 'chittagong',
      'Khagrachhari': 'chittagong',
      'Lakshmipur': 'chittagong',
      'Noakhali': 'chittagong',
      'Rangamati': 'chittagong',
      'Rajshahi': 'rajshahi',
      'Bogra': 'rajshahi',
      'Joypurhat': 'rajshahi',
      'Naogaon': 'rajshahi',
      'Natore': 'rajshahi',
      'Nawabganj': 'rajshahi',
      'Pabna': 'rajshahi',
      'Sirajganj': 'rajshahi',
      'Dinajpur': 'rangpur',
      'Gaibandha': 'rangpur',
      'Kurigram': 'rangpur',
      'Lalmonirhat': 'rangpur',
      'Nilphamari': 'rangpur',
      'Panchagarh': 'rangpur',
      'Rangpur': 'rangpur',
      'Thakurgaon': 'rangpur',
      'Khulna': 'khulna',
      'Bagerhat': 'khulna',
      'Chuadanga': 'khulna',
      'Jessore': 'khulna',
      'Jhenaidah': 'khulna',
      'Kushtia': 'khulna',
      'Magura': 'khulna',
      'Meherpur': 'khulna',
      'Narail': 'khulna',
      'Satkhira': 'khulna',
      'Barishal': 'barishal',
      'Barguna': 'barishal',
      'Bhola': 'barishal',
      'Jhalokati': 'barishal',
      'Patuakhali': 'barishal',
      'Pirojpur': 'barishal',
      'Sylhet': 'sylhet',
      'Habiganj': 'sylhet',
      'Moulvibazar': 'sylhet',
      'Sunamganj': 'sylhet'
    };
    return divisionMap[district] || 'dhaka';
  };

  // Handle billing address selection
  const handleBillingAddressSelect = (address: any) => {
    selectBillingAddress(address.id);
    const checkoutAddress = addressToShippingAddress(address);
    setBillingAddress(checkoutAddress);
    setErrors({});
  };

  // EMI Handler
  const handleEmiPlanSelect = async (planId: string, plan: EmiPlan) => {
    try {
      setSelectedEmiPlanId(planId);
      setSelectedEmiPlan(plan);
      
      // Calculate EMI details
      const { calculateEmi } = await import('@/lib/api/emi');
      const response = await calculateEmi(total, planId);
      
      if (response.success && response.data && 'planId' in response.data) {
        setEmiDetails(response.data as EmiDetails);
      }
    } catch (error) {
      console.error('Error calculating EMI:', error);
      toast.error('Failed to calculate EMI');
    }
  };

  // Local Payment Handlers
  const handleLocalPaymentMethodSelect = async (method: LocalPaymentMethod, feeResult?: PaymentFeeResult) => {
    setSelectedLocalPaymentMethod(method);
    setLocalPaymentFee(feeResult || null);
  };

  // Auto-select first available local payment method when methods are loaded
  useEffect(() => {
    if (['bkash', 'nagad', 'rocket'].includes(selectedPayment) && 
        localPaymentMethods.length > 0 && 
        !selectedLocalPaymentMethod) {
      // Auto-select the first available method
      const firstMethod = localPaymentMethods[0];
      handleLocalPaymentMethodSelect(firstMethod);
    }
  }, [selectedPayment, localPaymentMethods, selectedLocalPaymentMethod]);

  const handleLocalPaymentPhoneChange = (value: string) => {
    setLocalPaymentPhone(value);
  };

  const handleLocalPaymentPinChange = (value: string) => {
    setLocalPaymentPin(value);
  };

  // Mobile/Offline Handlers
  const handleSync = async () => {
    setIsSyncing(true);
    try {
      // Simulate sync process
      await new Promise(resolve => setTimeout(resolve, 2000));
      setLastSyncTime(new Date().toISOString());
      toast.success('Cart synced successfully');
    } catch (error) {
      console.error('Error syncing cart:', error);
      toast.error('Failed to sync cart');
    } finally {
      setIsSyncing(false);
    }
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

  // Validate EMI selection
  const validateEmi = (): boolean => {
    if (selectedPayment === 'emi') {
      if (!selectedEmiPlanId || !emiDetails) {
        toast.error('Please select an EMI plan');
        return false;
      }
    }
    return true;
  };

  // Validate Local Payment
  const validateLocalPayment = (): boolean => {
    if (['bkash', 'nagad', 'rocket'].includes(selectedPayment)) {
      if (!selectedLocalPaymentMethod) {
        const paymentName = selectedPayment.charAt(0).toUpperCase() + selectedPayment.slice(1);
        toast.error(`Please select a ${paymentName} payment method from the options below`);
        return false;
      }
      
      if (selectedLocalPaymentMethod.requiresPhone && !localPaymentPhone.trim()) {
        toast.error('Phone number is required for this payment method');
        return false;
      }
      
      if (selectedLocalPaymentMethod.requiresPhone && !/^01[3-9]\d{8}$/.test(localPaymentPhone)) {
        toast.error('Invalid phone number format. Must be 11 digits starting with 01');
        return false;
      }
      
      if (selectedLocalPaymentMethod.requiresPin && !localPaymentPin.trim()) {
        toast.error('PIN is required for this payment method');
        return false;
      }
    }
    return true;
  };
  
  const handleShippingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (validateShipping() && validateBilling()) {
      try {
        // Save address to checkout session
        await saveProgress({ 
          address: { 
            shippingAddress: shippingAddress,
            billingAddress: useSameAddress ? shippingAddress : billingAddress,
            useSameAddress,
            completed: true 
          } 
        });
        
        // Update step in backend
        await updateStep('shipping');
        
        // Move to shipping step
        setStep('shipping');
      } catch (error) {
        console.error('Error saving address:', error);
        toast.error('Failed to save address');
      }
    }
  };

  const handleShippingMethodSubmit = async () => {
    try {
      // Get shipping method details - Updated costs to match backend
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

      // Update cart shipping method and cost in CartContext
      setShippingMethod(selectedShippingMethod, shippingMethodDetails.cost);

      // Save shipping method selection to checkout session
      await saveProgress({ 
        shipping: { 
          method: selectedShippingMethod,
          cost: shippingMethodDetails.cost,
          estimatedDays: shippingMethodDetails.estimatedDays,
          completed: true 
        } 
      });
      
      // Update step in backend
      await updateStep('payment');
      
      // Move to payment step
      setStep('payment');
    } catch (error) {
      console.error('Error saving shipping method:', error);
      toast.error('Failed to save shipping method');
    }
  };
  
  const handlePaymentSubmit = async () => {
    // Validate that a payment method is selected
    if (!selectedPayment) {
      toast.error('Please select a payment method');
      return;
    }

    // Validate COD before proceeding to review
    if (selectedPayment === 'cod') {
      if (!codValidation || !codValidation.valid) {
        toast.error(codValidation?.reason || 'COD is not available for this order');
        return;
      }
    }

    // Validate EMI selection
    if (!validateEmi()) {
      return;
    }

    // Validate Local Payment
    if (!validateLocalPayment()) {
      return;
    }

    try {
      // Save payment details to checkout session
      // Map frontend payment method to backend format
      const backendPaymentMethod = mapPaymentMethodToBackend(selectedPayment);
      const paymentDetails: any = {
        method: backendPaymentMethod,
        originalMethod: selectedPayment, // Keep original for reference
        completed: true
      };

      // Add EMI details if selected
      if (selectedPayment === 'emi' && emiDetails && selectedEmiPlan) {
        paymentDetails.details = {
          emiPlanId: selectedEmiPlan.id,
          emiProviderId: emiDetails.provider.id,
          emiAmount: emiDetails.emiAmount,
          emiDuration: emiDetails.duration,
          emiInterestRate: emiDetails.interestRate,
          totalPayable: emiDetails.totalPayable,
          processingFee: emiDetails.processingFee
        };
      }

      // Add COD details if selected
      if (selectedPayment === 'cod' && codValidation) {
        paymentDetails.details = {
          codFee: codFee,
          deliveryDays: codValidation.deliveryDays,
          requiresPhoneVerification: codValidation.requiresVerification.phone,
          requiresAddressVerification: codValidation.requiresVerification.address
        };
      }

      // Add local payment details if selected
      if (['bkash', 'nagad', 'rocket'].includes(selectedPayment) && selectedLocalPaymentMethod) {
        paymentDetails.details = {
          paymentMethodCode: selectedLocalPaymentMethod.code,
          phoneNumber: localPaymentPhone,
          paymentFee: localPaymentFee?.totalFee || 0,
          totalAmount: localPaymentFee?.totalAmount || total
        };
      }

      await saveProgress({ payment: paymentDetails });
      
      // Update step in backend
      await updateStep('review');
      
      // Move to review step
      setStep('review');
    } catch (error) {
      console.error('Error saving payment details:', error);
      toast.error('Failed to save payment details');
    }
  };
  
  const handlePlaceOrder = async () => {
    setIsPlacingOrder(true);
    setPaymentErrors('');
    
    try {
      // Save review data to checkout session
      await saveProgress({ 
        review: { 
          reviewed: true,
          confirmed: true,
          reviewedAt: new Date().toISOString(),
          confirmedAt: new Date().toISOString()
        } 
      });
      
      // Complete checkout using checkout API
      const response = await completeCheckout();
      
      toast.success('Order placed successfully!');
      
      // Clear cart after successful order placement
      await clearCart();
      
      // Redirect with real order ID
      router.push(`/order-confirmation?orderId=${response.orderId}`);
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

        {/* Guest Checkout Option */}
        <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
            <div className="text-center mb-8">
              <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                <UserIcon className="w-8 h-8 text-blue-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Continue Your Checkout
              </h2>
              <p className="text-gray-600">
                Choose how you'd like to proceed with your order
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Login Option */}
              <Link
                href="/login?redirect=/checkout"
                className="group relative flex flex-col items-center p-6 border-2 border-gray-200 rounded-lg hover:border-blue-500 transition-all duration-200"
              >
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4 group-hover:bg-blue-200 transition-colors">
                  <UserIcon className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Login to Your Account
                </h3>
                <p className="text-sm text-gray-600 text-center mb-4">
                  Access your saved addresses, order history, and more
                </p>
                <div className="mt-auto w-full">
                  <button className="w-full px-4 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 transition-colors">
                    Login
                  </button>
                </div>
              </Link>

              {/* Guest Checkout Option */}
              <Link
                href="/checkout/guest"
                className="group relative flex flex-col items-center p-6 border-2 border-gray-200 rounded-lg hover:border-green-500 transition-all duration-200"
              >
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4 group-hover:bg-green-200 transition-colors">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Continue as Guest
                </h3>
                <p className="text-sm text-gray-600 text-center mb-4">
                  Complete your order quickly without creating an account
                </p>
                <div className="mt-auto w-full">
                  <button className="w-full px-4 py-2 bg-green-600 text-white font-medium rounded-md hover:bg-green-700 transition-colors">
                    Continue as Guest
                  </button>
                </div>
              </Link>
            </div>

            {/* Benefits Section */}
            <div className="mt-8 pt-8 border-t border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 text-center">
                Why Create an Account?
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <Truck className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 text-sm">Track Orders</h4>
                    <p className="text-xs text-gray-600 mt-1">
                      View order history and status
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 text-sm">Save Addresses</h4>
                    <p className="text-xs text-gray-600 mt-1">
                      Quick checkout with saved addresses
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <Shield className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 text-sm">Exclusive Offers</h4>
                    <p className="text-xs text-gray-600 mt-1">
                      Get special discounts and promotions
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
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
      
      {/* Progress Steps - Using new CheckoutProgress component */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <CheckoutProgress
            currentStep={step}
            completedSteps={progress.completedSteps}
            onStepClick={async (newStep) => {
              if (progress.canNavigateBack || progress.canNavigateForward) {
                setStep(newStep);
                await updateStep(newStep);
              }
            }}
            language={language}
            showLabels={true}
            showDescriptions={false}
            clickable={progress.canNavigateBack || progress.canNavigateForward}
          />
        </div>
      </div>
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Address Form */}
            {step === 'address' && (
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
                
                {/* Address Form */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center gap-3 mb-6">
                    <MapPin className="w-6 h-6 text-blue-600" />
                    <h2 className="text-lg font-semibold text-gray-900">Address</h2>
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
                  onToggle={async (useSame: boolean) => {
                    setUseSameAddress(useSame);
                    try {
                      // Save billing address preference to checkout session
                      await saveProgress({ 
                        address: { 
                          ...session?.data?.address,
                          useSameAddress: useSame,
                          billingAddress: useSame ? shippingAddress : billingAddress,
                          completed: session?.data?.address?.completed || false
                        } 
                      });
                    } catch (error) {
                      console.error('Error saving billing address preference:', error);
                      toast.error('Failed to save billing address preference');
                    }
                  }}
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
            
            {/* Shipping Method Selection */}
            {step === 'shipping' && (
              <div className="space-y-6">
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center gap-3 mb-6">
                    <Truck className="w-6 h-6 text-blue-600" />
                    <h2 className="text-lg font-semibold text-gray-900">Shipping Method</h2>
                  </div>

                  <div className="space-y-3">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedShippingMethod('STANDARD');
                        setShippingMethod('STANDARD', 100);
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
                          <p className="font-medium text-gray-900">Standard Delivery</p>
                          <p className="text-sm text-gray-600">3-5 business days</p>
                        </div>
                      </div>
                      <span className="font-semibold text-gray-900">৳100</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setSelectedShippingMethod('EXPRESS');
                        setShippingMethod('EXPRESS', 200);
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
                          <p className="font-medium text-gray-900">Express Delivery</p>
                          <p className="text-sm text-gray-600">1-2 business days</p>
                        </div>
                      </div>
                      <span className="font-semibold text-gray-900">৳200</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setSelectedShippingMethod('INSIDE_DHAKA');
                        setShippingMethod('INSIDE_DHAKA', 60);
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
                          <p className="font-medium text-gray-900">Inside Dhaka</p>
                          <p className="text-sm text-gray-600">2-3 business days</p>
                        </div>
                      </div>
                      <span className="font-semibold text-gray-900">৳60</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setSelectedShippingMethod('OUTSIDE_DHAKA');
                        setShippingMethod('OUTSIDE_DHAKA', 120);
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
                          <p className="font-medium text-gray-900">Outside Dhaka</p>
                          <p className="text-sm text-gray-600">4-6 business days</p>
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
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={handleShippingMethodSubmit}
                    className="px-6 py-3 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  >
                    Continue to Payment
                  </button>
                </div>
              </div>
            )}
            
            {/* Payment Method Selection */}
            {step === 'payment' && (
              <div className="space-y-6">
                {/* Offline Cart Indicator */}
                {!isOnline && (
                  <OfflineCartIndicator
                    isOnline={isOnline}
                    lastSyncTime={lastSyncTime}
                    isSyncing={isSyncing}
                    onSync={handleSync}
                    language={language}
                    className="mb-4"
                  />
                )}

                {/* Basic Payment Methods */}
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
                        disabled={method.id === 'cod' && isValidatingCod}
                        className={cn(
                          "w-full flex items-center gap-4 p-4 border rounded-lg transition-colors",
                          selectedPayment === method.id
                            ? "border-blue-500 bg-blue-50"
                            : "border-gray-200 hover:border-gray-300",
                          method.id === 'cod' && !codValidation?.valid && codValidation !== null
                            ? "border-red-300 bg-red-50"
                            : ""
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
                        {method.id === 'cod' && codFee > 0 && (
                          <span className="text-sm text-gray-600">(+৳{codFee.toFixed(0)})</span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* EMI Section */}
                {selectedPayment === 'emi' && (
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center gap-3 mb-6">
                      <CreditCard className="w-6 h-6 text-purple-600" />
                      <h2 className="text-lg font-semibold text-gray-900">EMI Options</h2>
                    </div>
                    
                    {isLoadingEmi ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                        <span className="ml-3 text-gray-600">Loading EMI options...</span>
                      </div>
                    ) : emiAvailable ? (
                      <>
                        <EmiSelector
                          availablePlans={emiPlans}
                          selectedPlanId={selectedEmiPlanId || undefined}
                          onPlanSelect={handleEmiPlanSelect}
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
                          EMI is available for orders of ৳5,000 and above.
                        </p>
                        <p className="text-sm text-gray-600 mt-2">
                          Current order total: ৳{total.toLocaleString('en-BD', { minimumFractionDigits: 2 })}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* COD Validation Status */}
                {selectedPayment === 'cod' && (
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center gap-3 mb-6">
                      <Truck className="w-6 h-6 text-blue-600" />
                      <h2 className="text-lg font-semibold text-gray-900">COD Availability</h2>
                    </div>
                    
                    {isValidatingCod && (
                      <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-md">
                        <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />
                        <span className="text-sm text-blue-600">Validating COD availability...</span>
                      </div>
                    )}

                    {!isValidatingCod && codValidation && (
                      <>
                        {codValidation.valid ? (
                          <div className="p-3 bg-green-50 border border-green-200 rounded-md">
                            <div className="flex items-start gap-2">
                              <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
                              <div className="flex-1">
                                <p className="text-sm text-green-800 font-medium">COD is available</p>
                                {codFee > 0 && (
                                  <p className="text-sm text-green-700 mt-1">Additional COD fee: ৳{codFee.toFixed(0)}</p>
                                )}
                                <p className="text-sm text-green-700 mt-1">Estimated delivery: {codValidation.deliveryDays} days</p>
                                {codValidation.warnings.length > 0 && (
                                  <div className="mt-2">
                                    {codValidation.warnings.map((warning, index) => (
                                      <p key={index} className="text-xs text-green-600 flex items-center gap-1">
                                        <Info className="w-3 h-3" />
                                        {warning}
                                      </p>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                            <div className="flex items-start gap-2">
                              <AlertCircle className="w-4 h-4 text-red-600 mt-0.5" />
                              <div className="flex-1">
                                <p className="text-sm text-red-800 font-medium">COD is not available</p>
                                <p className="text-sm text-red-700 mt-1">{codValidation.reason}</p>
                                {codValidation.warnings.length > 0 && (
                                  <div className="mt-2">
                                    {codValidation.warnings.map((warning, index) => (
                                      <p key={index} className="text-xs text-red-600 flex items-center gap-1">
                                        <Info className="w-3 h-3" />
                                        {warning}
                                      </p>
                                    ))}
                                  </div>
                                )}
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

                {/* Local Payment Section */}
                {['bkash', 'nagad', 'rocket'].includes(selectedPayment) && (
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center gap-3 mb-6">
                      <Smartphone className="w-6 h-6 text-blue-600" />
                      <h2 className="text-lg font-semibold text-gray-900">Mobile Payment</h2>
                    </div>

                    {/* Selection Required Indicator */}
                    {!selectedLocalPaymentMethod && (
                      <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-md">
                        <div className="flex items-start gap-2">
                          <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" aria-hidden="true" />
                          <p className="text-sm text-amber-800">
                            Please select a payment method from the options below to continue
                          </p>
                        </div>
                      </div>
                    )}

                    <LocalPaymentMethodSelector
                      amount={total}
                      selectedMethodCode={selectedPayment}
                      onMethodSelect={handleLocalPaymentMethodSelect}
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
                              Phone Number *
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
                              PIN *
                            </label>
                            <input
                              type="password"
                              value={localPaymentPin}
                              onChange={(e) => handleLocalPaymentPinChange(e.target.value)}
                              placeholder="Enter your PIN"
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
                  
                  {/* EMI Details */}
                  {selectedPayment === 'emi' && emiDetails && (
                    <div className="mt-3 space-y-2">
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-600">Provider:</span>
                        <span className="font-medium text-gray-900">{emiDetails.provider.name}</span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-600">Plan:</span>
                        <span className="font-medium text-gray-900">{emiDetails.planName}</span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-600">Monthly EMI:</span>
                        <span className="font-medium text-blue-600">
                          ৳{emiDetails.emiAmount.toLocaleString('en-BD', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-600">Duration:</span>
                        <span className="font-medium text-gray-900">{emiDetails.duration} months</span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-600">Total Payable:</span>
                        <span className="font-medium text-green-600">
                          ৳{emiDetails.totalPayable.toLocaleString('en-BD', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    </div>
                  )}
                  
                  {/* COD Details */}
                  {selectedPayment === 'cod' && codValidation && (
                    <div className="mt-3 space-y-2">
                      {codFee > 0 && (
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-gray-600">COD Fee:</span>
                          <span className="font-medium text-gray-900">
                            ৳{codFee.toFixed(0)}
                          </span>
                        </div>
                      )}
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-600">Delivery:</span>
                        <span className="font-medium text-gray-900">
                          {codValidation.deliveryDays} days
                        </span>
                      </div>
                      {codValidation.requiresVerification.phone && (
                        <div className="text-sm text-yellow-700">
                          • Phone verification required
                        </div>
                      )}
                      {codValidation.requiresVerification.address && (
                        <div className="text-sm text-yellow-700">
                          • Address verification required
                        </div>
                      )}
                    </div>
                  )}
                  
                  {/* Local Payment Details */}
                  {['bkash', 'nagad', 'rocket'].includes(selectedPayment) && selectedLocalPaymentMethod && (
                    <div className="mt-3 space-y-2">
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-600">Method:</span>
                        <span className="font-medium text-gray-900">{selectedLocalPaymentMethod.displayName}</span>
                      </div>
                      {localPaymentFee && localPaymentFee.totalFee > 0 && (
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-gray-600">Payment Fee:</span>
                          <span className="font-medium text-red-600">
                            +৳{localPaymentFee.totalFee.toFixed(2)}
                          </span>
                        </div>
                      )}
                      {localPaymentFee && (
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-gray-600">Total Amount:</span>
                          <span className="font-medium text-blue-600">
                            ৳{localPaymentFee.totalAmount.toLocaleString('en-BD', { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                      )}
                      {localPaymentPhone && (
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-gray-600">Phone:</span>
                          <span className="font-medium text-gray-900">{localPaymentPhone}</span>
                        </div>
                      )}
                    </div>
                  )}
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
                {/* Shipping cost is only shown after user has selected a shipping method (on 'shipping', 'payment', and 'review' steps) */}
                {step !== 'address' && (
                  <div className="flex items-center justify-between text-sm text-gray-600">
                    <span>Shipping</span>
                    <span className="font-medium">
                      {shippingCost === 0 ? 'Free' : formatCurrency(shippingCost)}
                    </span>
                  </div>
                )}
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
                {selectedPayment === 'cod' && codFee > 0 && (
                  <div className="flex items-center justify-between text-sm text-gray-600">
                    <span>COD Fee</span>
                    <span className="font-medium">{formatCurrency(codFee)}</span>
                  </div>
                )}
                {selectedPayment === 'emi' && emiDetails && (
                  <div className="flex items-center justify-between text-sm text-gray-600">
                    <span>Processing Fee</span>
                    <span className="font-medium">{formatCurrency(emiDetails.processingFee)}</span>
                  </div>
                )}
                {localPaymentFee && localPaymentFee.totalFee > 0 && (
                  <div className="flex items-center justify-between text-sm text-gray-600">
                    <span>Payment Fee</span>
                    <span className="font-medium">{formatCurrency(localPaymentFee.totalFee)}</span>
                  </div>
                )}
                <div className="flex items-center justify-between border-t border-gray-200 pt-3">
                  <span className="text-base font-semibold text-gray-900">Total</span>
                  <span className="text-xl font-bold text-gray-900">
                    {formatCurrency(
                      (step === 'address' ? subtotal + tax - discount : total) +
                      (selectedPayment === 'cod' ? codFee : 0) +
                      (selectedPayment === 'emi' && emiDetails ? emiDetails.processingFee : 0) +
                      (localPaymentFee ? localPaymentFee.totalFee : 0)
                    )}
                  </span>
                </div>
              </div>
              
              {/* Security Badge */}
              <CheckoutSecurityBadge
                security={security}
                language={language}
                showWarnings={true}
                onWarningDismiss={dismissSecurityWarning}
                className="mb-4"
              />
              
              {/* Security Notice */}
              <div className="mt-6 flex items-center gap-2 text-xs text-gray-500">
                <Shield className="w-4 h-4" />
                <span>Secure checkout - Your information is protected</span>
              </div>
            </div>
          </div>
        </div>
      </main>
      
      {/* Checkout Abandonment Warning */}
      <CheckoutAbandonmentWarning
        isOpen={showAbandonmentWarning}
        onSave={async () => {
          await abandonCheckout('navigation_away', true);
          setShowAbandonmentWarning(false);
        }}
        onContinue={() => {
          setShowAbandonmentWarning(false);
        }}
        onLeave={() => {
          abandonCheckout('navigation_away', false);
          setShowAbandonmentWarning(false);
          router.push('/cart');
        }}
        language={language}
      />
    </div>
  );
}
