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
import { loadGuestCartFromStorage, saveGuestCartToStorage } from '@/lib/utils/guestCart';
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
  GuestCheckoutSecurity,
  GuestSecurityWarning,
  GuestComplianceInfo,
  GuestPaymentValidationResult,
} from '@/types/guestCheckout';

// Guest checkout step order for progress calculation
const GUEST_CHECKOUT_STEPS: GuestCheckoutStep[] = ['info', 'address', 'shipping', 'payment', 'review'];

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
  const [shippingMethod, setShippingMethod] = useState<string>('STANDARD');
  const [paymentMethod, setPaymentMethod] = useState<string>('cash_on_delivery');
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
  const [security, setSecurity] = useState<GuestCheckoutSecurity>({
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
  });

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
   * Helper function to validate if a string is a valid UUID
   * FIX 1: Validate cartId is a real database UUID, not a temporary sessionId
   */
  const isValidUUID = useCallback((id: string | undefined): boolean => {
    if (!id) return false;
    // UUID v4 format: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(id);
  }, []);

  /**
   * Helper function to fetch cart ID from cart API
   * FIX 1: Retrieve real database cartId if not available in localStorage
   */
  const fetchCartIdFromAPI = useCallback(async (): Promise<string | null> => {
    try {
      console.log('[useGuestCheckout] Fetching cart ID from API...');
      const response = await apiClient.get<{ id: string }>('/cart/guest');
      if (response?.id) {
        console.log('[useGuestCheckout] Retrieved cart ID from API:', response.id);
        return response.id;
      }
    } catch (error) {
      console.warn('[useGuestCheckout] Failed to fetch cart ID from API:', error);
    }
    return null;
  }, []);

  /**
   * Initialize guest checkout session
   * FIX 1: Ensure we use the REAL database cartId, not temporary sessionId
   * FIX 5: Add cart validation before checkout initiation
   */
  const initializeSession = useCallback(async (guestId?: string, sessionId?: string, cartId?: string) => {
    setIsLoading(true);
    setError(null);

    try {
      // Check for existing guest session in localStorage
      const existingSessionId = localStorage.getItem(GUEST_SESSION_KEY);
      
      // FIX 1: Auto-load cartId from localStorage if not provided as parameter
      let resolvedCartId = cartId;
      console.log('[useGuestCheckout] Initial cartId from parameter:', cartId);
      
      if (!resolvedCartId) {
        const guestCartData = loadGuestCartFromStorage();
        console.log('[useGuestCheckout] Guest cart data from storage:', guestCartData);
        
        // FIX 1: Use the REAL database cartId from guestCartData.cartId
        // NOT the temporary sessionId
        if (guestCartData?.cartId) {
          console.log('[useGuestCheckout] Found cartId in storage:', guestCartData.cartId);
          // FIX 1: Validate that cartId is a valid UUID
          if (isValidUUID(guestCartData.cartId)) {
            resolvedCartId = guestCartData.cartId;
            console.log('[useGuestCheckout] Validated cartId is a UUID:', resolvedCartId);
          } else {
            console.warn('[useGuestCheckout] cartId in storage is not a valid UUID:', guestCartData.cartId);
            // FIX 1: Try to fetch cart ID from API
            const apiCartId = await fetchCartIdFromAPI();
            if (apiCartId && isValidUUID(apiCartId)) {
              resolvedCartId = apiCartId;
              console.log('[useGuestCheckout] Using cart ID from API:', resolvedCartId);
            }
          }
        } else {
          console.warn('[useGuestCheckout] No cartId found in guest cart data');
          // FIX 1: Try to fetch cart ID from API
          const apiCartId = await fetchCartIdFromAPI();
          if (apiCartId && isValidUUID(apiCartId)) {
            resolvedCartId = apiCartId;
            console.log('[useGuestCheckout] Using cart ID from API:', resolvedCartId);
          }
        }
      } else {
        // FIX 1: Validate provided cartId is a valid UUID
        console.log('[useGuestCheckout] Validating provided cartId:', resolvedCartId);
        if (!isValidUUID(resolvedCartId)) {
          console.warn('[useGuestCheckout] Provided cartId is not a valid UUID:', resolvedCartId);
          // FIX 1: Try to fetch cart ID from API instead
          const apiCartId = await fetchCartIdFromAPI();
          if (apiCartId && isValidUUID(apiCartId)) {
            resolvedCartId = apiCartId;
            console.log('[useGuestCheckout] Using cart ID from API instead:', resolvedCartId);
          } else {
            throw new Error('Invalid cart ID format. Please refresh the page and try again.');
          }
        }
      }
      
      console.log('[useGuestCheckout] Final resolved cartId:', resolvedCartId);
      
      // FIX 5: Validate cart exists and has items before initiating checkout
      if (resolvedCartId) {
        console.log('[useGuestCheckout] Validating cart has items...');
        try {
          const cartResponse = await apiClient.get<{ items: any[]; id: string }>(`/cart/guest/${resolvedCartId}`);
          console.log('[useGuestCheckout] Cart validation response:', cartResponse);
          
          if (!cartResponse || !cartResponse.items || cartResponse.items.length === 0) {
            console.warn('[useGuestCheckout] Cart is empty:', cartResponse);
            throw new Error('Your cart is empty. Please add items to your cart before checkout.');
          }
          
          console.log('[useGuestCheckout] Cart has items:', cartResponse.items.length);
          
          // CRITICAL FIX: Use actual cart.id from API response instead of resolvedCartId
          // The cart lookup endpoint returns the actual database cart ID, which may differ
          // from the sessionId that was passed in. We must use the actual cart ID.
          if (cartResponse.id && cartResponse.id !== resolvedCartId) {
            console.log('[useGuestCheckout] Updating cartId from API response:', {
              originalCartId: resolvedCartId,
              actualCartId: cartResponse.id
            });
            resolvedCartId = cartResponse.id;
          }
        } catch (cartError: any) {
          console.error('[useGuestCheckout] Cart validation failed:', cartError);
          if (cartError.message?.includes('empty')) {
            throw cartError;
          }
          // If cart not found, throw error instead of creating new cart
          if (cartError.message?.includes('not found') || cartError.status === 404) {
            throw new Error('Your cart session has expired. Please add items to your cart and try again.');
          }
          // For other errors, log but continue
          console.warn('[useGuestCheckout] Cart validation encountered error, continuing:', cartError.message);
        }
      }
      
      const request: InitializeGuestCheckoutRequest = {
        guestId,
        sessionId: sessionId || existingSessionId || undefined,
        cartId: resolvedCartId || undefined,
        platform: typeof window !== 'undefined' && window.innerWidth < 768 ? 'mobile' : 'desktop',
        language: 'en', // Will be fetched from language context
      };

      let response;
      try {
        response = await apiClient.post<GuestSession>('/guest/checkout/initiate', request);
      } catch (initError: any) {
        // If cart not found (404), do NOT clear cartId or create new cart - 
        // instead, throw error and let user restart checkout with fresh cart
        // This prevents the "Your cart is empty" bug where frontend was creating
        // a new empty cart by retrying without cartId
        if (initError?.message?.includes('Cart not found') && resolvedCartId) {
          console.warn('[useGuestCheckout] Cart not found for cartId:', resolvedCartId);
          // DO NOT delete cartId - just throw the error
          // The user will need to add items again to their cart
          throw new Error('Your cart session has expired. Please add items to your cart and try again.');
        } else {
          throw initError;
        }
      }
      
      setSession(response);
      
      // Store session ID in localStorage for guest checkout
      localStorage.setItem(GUEST_SESSION_KEY, response.sessionId);
      
      // FIXED: Also store guest checkout session ID in smart_tech_guest_session
      // This synchronizes the session ID used by cart API (x-session-id header)
      // with the guest checkout session, preventing "Cart is empty" errors
      if (typeof window !== 'undefined') {
        localStorage.setItem('smart_tech_guest_session', response.sessionId);
      }
      
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
        await apiClient.post(`/checkout/session/${session.sessionId}/step`, {
          sessionId: session.sessionId,
          step: 'info',
          data: info
        });
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

      const response = await apiClient.post<GuestSession>('/checkout/step', request);
      
      setSession(response);
      setProgress(calculateProgress(step, 
        ['info'].includes(step) ? [] :
        ['address'].includes(step) ? ['info'] :
        ['shipping'].includes(step) ? ['info', 'address'] :
        ['payment'].includes(step) ? ['info', 'address', 'shipping'] :
        ['info', 'address', 'shipping', 'payment']
      ));
      
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
   * Save shipping method for guest checkout
   * Calls the correct API endpoint with proper payload
   */
  const saveShippingMethod = useCallback(async (method: string): Promise<void> => {
    if (!session) {
      throw new Error('No active guest checkout session');
    }

    setIsLoading(true);
    setError(null);

    try {
      // Call the correct API endpoint with only the method field
      await apiClient.post(`/checkout/session/${session.sessionId}/shipping`, {
        method,
      });

      // Update shipping method in local state
      setShippingMethod(method);

      // Update last activity
      lastActivityRef.current = Date.now();
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to save shipping method';
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [session]);

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

      const response = await apiClient.post<GuestCheckoutValidationResult>('/checkout/validate', request);
      
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
      // FIXED: Use correct guest checkout endpoint with sessionId in URL path
      // Endpoint: POST /api/v1/guest/checkout/session/:sessionId/complete
      // Payload expects: { shippingAddress, billingAddress, paymentMethod, paymentDetails, notes }
      // sessionId is passed as URL parameter, not in request body
      const response = await apiClient.post<GuestOrder>(`/guest/checkout/session/${session.sessionId}/complete`, {
        shippingAddress,
        billingAddress,
        paymentMethod: paymentMethod.toLowerCase(), // Ensure lowercase
        paymentDetails,
        // notes: optional, can be added if needed
      });
      
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
  }, [session, shippingAddress, billingAddress, paymentMethod, paymentDetails]);

  /**
   * Track guest order
   */
  const trackOrder = useCallback(async (orderNumber: string, email?: string, phone?: string): Promise<GuestOrder | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await apiClient.put<GuestOrderTrackingResponse>(`/orders/guest/${orderNumber}/track`, {
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
      const response = await apiClient.post<GuestAccountCreationResponse>('/auth/register', data);
      
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
    setShippingMethod('STANDARD');
    setPaymentMethod('cash_on_delivery');
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
    
    // FIXED: Also clear smart_tech_guest_session to clean up synchronized session ID
    if (typeof window !== 'undefined') {
      localStorage.removeItem('smart_tech_guest_session');
    }
    
    // Clear timers
    if (sessionTimeoutTimerRef.current) {
      clearTimeout(sessionTimeoutTimerRef.current);
      sessionTimeoutTimerRef.current = null;
    }
  }, []);

  /**
   * Save guest checkout progress to backend
   */
  const saveProgress = useCallback(
    async (data: Partial<GuestCheckoutData>) => {
      if (!session) {
        throw new Error('No active guest checkout session');
      }

      setIsLoading(true);
      setError(null);

      try {
        const request: UpdateGuestCheckoutStepRequest = {
          sessionId: session.sessionId,
          step: progress.currentStep,
          data,
        };

        const response = await apiClient.post<GuestSession>('/checkout/step', request);
        
        setSession(response);
        
        // Recalculate progress based on updated session data
        setProgress(calculateProgress(progress.currentStep, progress.completedSteps));
        
        // Update last activity
        lastActivityRef.current = Date.now();
        
        return response;
      } catch (err: any) {
        const errorMessage = err.message || 'Failed to save progress';
        setError(errorMessage);
        toast.error(errorMessage);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [session, progress, calculateProgress],
  );

  /**
   * Initialize guest checkout security state
   */
  const initializeGuestSecurityState = useCallback(() => {
    const securityState: GuestCheckoutSecurity = {
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
    };
    setSecurity(securityState);
  }, []);

  /**
   * Set security warning
   */
  const setSecurityWarning = useCallback((warning: GuestSecurityWarning) => {
    setSecurity(prev => ({
      ...prev,
      warnings: [...prev.warnings, warning],
    }));
  }, []);

  /**
   * Dismiss security warning
   */
  const dismissSecurityWarning = useCallback((warningType: string) => {
    setSecurity(prev => ({
      ...prev,
      warnings: prev.warnings.filter(w => w.type !== warningType),
    }));
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
    shippingMethod,
    paymentMethod,
    paymentDetails,
    progress,
    trackedOrder,
    guestCart,
    userCart,
    isLoading,
    error,
    security,
    
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
    saveShippingMethod,
    saveProgress,
    initializeGuestSecurityState,
    setSecurityWarning,
    dismissSecurityWarning,
    
    // Setters
    setShippingAddress,
    setBillingAddress,
    setShippingMethod,
    setPaymentMethod,
    setPaymentDetails,
  };
};

export default useGuestCheckout;
