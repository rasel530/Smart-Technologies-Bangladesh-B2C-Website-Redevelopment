/**
 * useGuestCheckout Hook
 *
 * Custom hook for managing guest checkout state, session, progress tracking,
 * order tracking, cart merging, and account creation.
 *
 * @example
 * ```tsx
 * const {
 *   session,
 *   guestInfo,
 *   progress,
 *   isLoading,
 *   error,
 *   initializeSession,
 *   updateGuestInfo,
 *   updateStep,
 *   validateStep,
 *   completeCheckout,
 *   trackOrder,
 *   mergeCart,
 *   createAccount,
 * } = useGuestCheckout();
 * ```
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { apiClient } from '@/lib/api/client';
import type {
  GuestSession,
  GuestCheckoutStep,
  GuestCheckoutProgress,
  GuestCheckoutData,
  GuestInfo,
  GuestShippingAddress,
  GuestBillingAddress,
  GuestPaymentDetails,
  GuestOrder,
  GuestOrderTrackingResponse,
  GuestCart,
  UserCart,
  CartMergeOption,
  CartMergeResponse,
  GuestAccountCreationRequest,
  GuestAccountCreationResponse,
  GuestCheckoutValidationResult,
  GuestCheckoutValidationError,
  InitializeGuestCheckoutRequest,
  UpdateGuestCheckoutStepRequest,
  ValidateGuestCheckoutStepRequest,
  CompleteGuestCheckoutRequest,
  CreateGuestOrderRequest,
} from '@/types/guestCheckout';

// Guest checkout step order for progress calculation
const GUEST_CHECKOUT_STEPS: GuestCheckoutStep[] = ['info', 'address', 'payment', 'review'];

// Default session timeout in minutes
const DEFAULT_SESSION_TIMEOUT = 30;

// Guest session storage key
const GUEST_SESSION_KEY = 'guest_session_id';

/**
 * useGuestCheckout Hook
 *
 * Manages guest checkout session, progress, order tracking, cart merging, and account creation
 */
export const useGuestCheckout = () => {
  const router = useRouter();
  
  // State
  const [session, setSession] = useState<GuestSession | null>(null);
  const [guestInfo, setGuestInfo] = useState<GuestInfo>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    createAccount: false,
    password: '',
    confirmPassword: '',
    agreeToTerms: false,
    agreeToPrivacy: false,
  });
  const [shippingAddress, setShippingAddress] = useState<GuestShippingAddress>({
    fullName: '',
    phone: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    district: 'Dhaka',
    postalCode: '',
  });
  const [billingAddress, setBillingAddress] = useState<GuestBillingAddress>({
    fullName: '',
    phone: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    district: 'Dhaka',
    postalCode: '',
  });
  const [paymentMethod, setPaymentMethod] = useState<string>('cod');
  const [paymentDetails, setPaymentDetails] = useState<GuestPaymentDetails | undefined>(undefined);
  const [progress, setProgress] = useState<GuestCheckoutProgress>({
    currentStep: 'info',
    completedSteps: [],
    pendingSteps: GUEST_CHECKOUT_STEPS,
    progressPercentage: 0,
    canNavigateBack: false,
    canNavigateForward: false,
  });
  const [trackedOrder, setTrackedOrder] = useState<GuestOrder | null>(null);
  const [guestCart, setGuestCart] = useState<GuestCart | null>(null);
  const [userCart, setUserCart] = useState<UserCart | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Refs for session management
  const sessionTimeoutTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastActivityRef = useRef(Date.now());

  /**
   * Calculate progress percentage based on current step
   */
  const calculateProgress = useCallback((currentStep: GuestCheckoutStep, completedSteps: GuestCheckoutStep[]): GuestCheckoutProgress => {
    const stepIndex = GUEST_CHECKOUT_STEPS.indexOf(currentStep);
    const progressPercentage = Math.round((stepIndex / (GUEST_CHECKOUT_STEPS.length - 1)) * 100);
    
    const pendingSteps = GUEST_CHECKOUT_STEPS.filter(step => 
      step !== currentStep && !completedSteps.includes(step)
    );

    return {
      currentStep,
      completedSteps,
      pendingSteps,
      progressPercentage,
      canNavigateBack: stepIndex > 0,
      canNavigateForward: stepIndex < GUEST_CHECKOUT_STEPS.length - 1,
    };
  }, []);

  /**
   * Initialize guest checkout session
   */
  const initializeSession = useCallback(async (guestId?: string, sessionId?: string) => {
    setIsLoading(true);
    setError(null);

    try {
      // Check for existing guest session in localStorage
      const existingSessionId = localStorage.getItem(GUEST_SESSION_KEY);
      
      const request: InitializeGuestCheckoutRequest = {
        guestId,
        sessionId: sessionId || existingSessionId || undefined,
        cartId: '', // Will be fetched from cart context
        platform: typeof window !== 'undefined' && window.innerWidth < 768 ? 'mobile' : 'desktop',
        language: 'en', // Will be fetched from language context
      };

      const response = await apiClient.post<GuestSession>('/guest/checkout/initialize', request);
      
      setSession(response);
      
      // Store session ID in localStorage
      localStorage.setItem(GUEST_SESSION_KEY, response.sessionId);
      
      setProgress(calculateProgress('info', []));
      
      // Start session timeout timer
      startSessionTimeoutTimer();

      return response;
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to initialize guest checkout session';
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [calculateProgress]);

  /**
   * Update guest information
   */
  const updateGuestInfo = useCallback(async (info: Partial<GuestInfo>) => {
    setGuestInfo(prev => ({ ...prev, ...info }));
    
    // Update session if available
    if (session) {
      try {
        await apiClient.post(`/guest/checkout/${session.sessionId}/guest-info`, info);
      } catch (err: any) {
        console.error('Failed to update guest info:', err);
      }
    }
  }, [session]);

  /**
   * Update guest checkout step
   */
  const updateStep = useCallback(async (step: GuestCheckoutStep) => {
    if (!session) {
      throw new Error('No active guest checkout session');
    }

    setIsLoading(true);
    setError(null);

    try {
      const request: UpdateGuestCheckoutStepRequest = {
        sessionId: session.sessionId,
        step,
      };

      const response = await apiClient.post<GuestSession>('/guest/checkout/step', request);
      
      setSession(response);
      setProgress(calculateProgress(step, ['info', 'address'].includes(step) ? ['info'] : ['info', 'address']));
      
      // Update last activity
      lastActivityRef.current = Date.now();
      
      return response;
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to update guest checkout step';
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [session, calculateProgress]);

  /**
   * Validate guest checkout step
   */
  const validateStep = useCallback(async (step: GuestCheckoutStep): Promise<GuestCheckoutValidationResult> => {
    if (!session) {
      throw new Error('No active guest checkout session');
    }

    setIsLoading(true);
    setError(null);

    try {
      const request: ValidateGuestCheckoutStepRequest = {
        sessionId: session.sessionId,
        step,
      };

      const response = await apiClient.post<GuestCheckoutValidationResult>('/guest/checkout/validate', request);
      
      return response;
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to validate guest checkout step';
      setError(errorMessage);
      toast.error(errorMessage);
      
      // Return validation error result
      return {
        isValid: false,
        step,
        errors: [],
        warnings: [],
        canProceed: false,
      };
    } finally {
      setIsLoading(false);
    }
  }, [session]);

  /**
   * Complete guest checkout
   */
  const completeCheckout = useCallback(async (): Promise<GuestOrder> => {
    if (!session) {
      throw new Error('No active guest checkout session');
    }

    setIsLoading(true);
    setError(null);

    try {
      const request: CompleteGuestCheckoutRequest = {
        sessionId: session.sessionId,
        data: {
          guestInfo,
          shippingAddress,
          billingAddress,
          paymentMethod,
          paymentDetails,
        },
      };

      const response = await apiClient.post<GuestOrder>('/guest/checkout/complete', request);
      
      // Clear session
      clearSession();
      
      toast.success('Order placed successfully!');
      
      return response;
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to complete guest checkout';
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [session, guestInfo, shippingAddress, billingAddress, paymentMethod, paymentDetails]);

  /**
   * Track guest order
   */
  const trackOrder = useCallback(async (orderNumber: string, email?: string, phone?: string): Promise<GuestOrder | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await apiClient.post<GuestOrderTrackingResponse>('/guest/orders/track', {
        orderNumber,
        email,
        phone,
      });
      
      if (response.success && response.order) {
        setTrackedOrder(response.order);
        toast.success('Order found!');
        return response.order;
      } else {
        toast.error(response.message);
        return null;
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to track order';
      setError(errorMessage);
      toast.error(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Load guest cart
   */
  const loadGuestCart = useCallback(async (): Promise<GuestCart | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await apiClient.get<GuestCart>('/cart/guest');
      setGuestCart(response);
      return response;
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to load guest cart';
      setError(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Load user cart
   */
  const loadUserCart = useCallback(async (): Promise<UserCart | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await apiClient.get<UserCart>('/cart');
      setUserCart(response);
      return response;
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to load user cart';
      setError(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Merge guest cart with user cart
   */
  const mergeCart = useCallback(async (mergeOption: CartMergeOption): Promise<UserCart | null> => {
    if (!guestCart || !userCart) {
      throw new Error('Both guest cart and user cart are required for merging');
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await apiClient.post<CartMergeResponse>('/cart/merge', {
        guestCartId: guestCart.id,
        userCartId: userCart.id,
        mergeOption,
      });
      
      if (response.success) {
        setUserCart(response.mergedCart);
        setGuestCart(null);
        toast.success('Carts merged successfully!');
        return response.mergedCart;
      } else {
        toast.error(response.message);
        return null;
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to merge carts';
      setError(errorMessage);
      toast.error(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [guestCart, userCart]);

  /**
   * Create account from guest data
   */
  const createAccount = useCallback(async (data: GuestAccountCreationRequest): Promise<GuestAccountCreationResponse | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await apiClient.post<GuestAccountCreationResponse>('/guest/account/create', data);
      
      if (response.success) {
        toast.success('Account created successfully!');
        
        // Clear guest session
        clearSession();
        
        return response;
      } else {
        toast.error(response.message);
        return null;
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to create account';
      setError(errorMessage);
      toast.error(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Clear guest checkout session
   */
  const clearSession = useCallback(() => {
    setSession(null);
    setGuestInfo({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      createAccount: false,
      password: '',
      confirmPassword: '',
      agreeToTerms: false,
      agreeToPrivacy: false,
    });
    setShippingAddress({
      fullName: '',
      phone: '',
      addressLine1: '',
      addressLine2: '',
      city: '',
      district: 'Dhaka',
      postalCode: '',
    });
    setBillingAddress({
      fullName: '',
      phone: '',
      addressLine1: '',
      addressLine2: '',
      city: '',
      district: 'Dhaka',
      postalCode: '',
    });
    setPaymentMethod('cod');
    setPaymentDetails(undefined);
    setProgress({
      currentStep: 'info',
      completedSteps: [],
      pendingSteps: GUEST_CHECKOUT_STEPS,
      progressPercentage: 0,
      canNavigateBack: false,
      canNavigateForward: false,
    });
    setTrackedOrder(null);
    setError(null);
    
    // Clear localStorage
    localStorage.removeItem(GUEST_SESSION_KEY);
    
    // Clear timers
    if (sessionTimeoutTimerRef.current) {
      clearTimeout(sessionTimeoutTimerRef.current);
      sessionTimeoutTimerRef.current = null;
    }
  }, []);

  /**
   * Start session timeout timer
   */
  const startSessionTimeoutTimer = useCallback(() => {
    // Clear existing timer
    if (sessionTimeoutTimerRef.current) {
      clearTimeout(sessionTimeoutTimerRef.current);
    }

    // Set timer for session expiration (30 minutes)
    const timeoutMs = DEFAULT_SESSION_TIMEOUT * 60 * 1000;
    
    sessionTimeoutTimerRef.current = setTimeout(() => {
      toast.warning('Your guest checkout session has expired. Please start over.');
      clearSession();
      router.push('/cart');
    }, timeoutMs);
  }, [clearSession, router]);

  /**
   * Load existing guest session on mount
   */
  useEffect(() => {
    const existingSessionId = localStorage.getItem(GUEST_SESSION_KEY);
    if (existingSessionId) {
      // Try to restore session from backend
      initializeSession(undefined, existingSessionId).catch(() => {
        // Session expired or invalid, clear it
        localStorage.removeItem(GUEST_SESSION_KEY);
      });
    }
  }, [initializeSession]);

  /**
   * Cleanup timers on unmount
   */
  useEffect(() => {
    return () => {
      if (sessionTimeoutTimerRef.current) {
        clearTimeout(sessionTimeoutTimerRef.current);
        sessionTimeoutTimerRef.current = null;
      }
    };
  }, []);

  return {
    // State
    session,
    guestInfo,
    shippingAddress,
    billingAddress,
    paymentMethod,
    paymentDetails,
    progress,
    trackedOrder,
    guestCart,
    userCart,
    isLoading,
    error,
    
    // Actions
    initializeSession,
    updateGuestInfo,
    updateStep,
    validateStep,
    completeCheckout,
    trackOrder,
    loadGuestCart,
    loadUserCart,
    mergeCart,
    createAccount,
    clearSession,
    
    // Setters
    setShippingAddress,
    setBillingAddress,
    setPaymentMethod,
    setPaymentDetails,
  };
};

export default useGuestCheckout;
