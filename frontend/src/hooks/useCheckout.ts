/**
 * useCheckout Hook
 *
 * Custom hook for managing checkout state, session, progress tracking,
 * security measures, and abandonment recovery.
 *
 * @example
 * ```tsx
 * const {
 *   session,
 *   progress,
 *   security,
 *   initializeSession,
 *   updateStep,
 *   saveProgress,
 *   validateStep,
 *   completeCheckout,
 *   abandonCheckout,
 *   recoverCheckout,
 *   extendSession,
 * } = useCheckout();
 * ```
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { apiClient } from '@/lib/api/client';
import type {
  CheckoutSession,
  CheckoutStep,
  CheckoutProgress,
  CheckoutSecurity,
  CheckoutAbandonment,
  CheckoutRecovery,
  CheckoutSessionData,
  CheckoutValidationResult,
  SecurityWarning,
  AbandonmentReason,
  InitializeCheckoutRequest,
  UpdateCheckoutStepRequest,
  ValidateCheckoutStepRequest,
  CompleteCheckoutRequest,
  AbandonCheckoutRequest,
  RecoverCheckoutRequest,
} from '@/types/checkout';

// Checkout step order for progress calculation
const CHECKOUT_STEPS: CheckoutStep[] = ['address', 'shipping', 'payment', 'review'];

// Default session timeout in minutes
const DEFAULT_SESSION_TIMEOUT = 30;

// Default abandonment detection delay in milliseconds (5 seconds)
const ABANDONMENT_DETECTION_DELAY = 5000;

/**
 * useCheckout Hook
 *
 * Manages checkout session, progress, security, and abandonment recovery
 */
export const useCheckout = () => {
  const router = useRouter();
  
  // State
  const [session, setSession] = useState<CheckoutSession | null>(null);
  const [progress, setProgress] = useState<CheckoutProgress>({
    currentStep: 'address',
    completedSteps: [],
    pendingSteps: CHECKOUT_STEPS,
    progressPercentage: 0,
    canNavigateBack: false,
    canNavigateForward: false,
  });
  const [security, setSecurity] = useState<CheckoutSecurity>({
    isSecure: true,
    isHttps: typeof window !== 'undefined' && window.location.protocol === 'https:',
    sslCertificate: {
      valid: true,
      issuer: 'Let\'s Encrypt',
      expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
    },
    sessionTimeout: DEFAULT_SESSION_TIMEOUT,
    sessionExpiresAt: new Date(Date.now() + DEFAULT_SESSION_TIMEOUT * 60 * 1000).toISOString(),
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
      {
        type: 'data_protection',
        label: 'Data Protected',
        labelBn: 'তথ্য সুরক্ষিত',
        icon: 'shield-check',
        description: 'Your data is protected',
        descriptionBn: 'আপনার তথ্য সুরক্ষিত',
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
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAbandoned, setIsAbandoned] = useState(false);
  const [abandonmentReason, setAbandonmentReason] = useState<AbandonmentReason | null>(null);
  const [recovery, setRecovery] = useState<CheckoutRecovery | null>(null);

  // Refs for abandonment detection
  const abandonmentTimerRef = useRef<NodeJS.Timeout | null>(null);
  const sessionTimeoutTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastActivityRef = useRef(Date.now());

  /**
   * Calculate progress percentage based on current step
   */
  const calculateProgress = useCallback((currentStep: CheckoutStep, sessionData?: CheckoutSessionData): CheckoutProgress => {
    const stepIndex = CHECKOUT_STEPS.indexOf(currentStep);
    const progressPercentage = Math.round((stepIndex / (CHECKOUT_STEPS.length - 1)) * 100);
    
    // Build completedSteps array from session data completion statuses
    const completedSteps: CheckoutStep[] = [];
    if (sessionData?.address?.completed) {
      completedSteps.push('address');
    }
    if (sessionData?.shipping?.completed) {
      completedSteps.push('shipping');
    }
    if (sessionData?.payment?.completed) {
      completedSteps.push('payment');
    }
    if (sessionData?.review?.confirmed) {
      completedSteps.push('review');
    }
    
    const pendingSteps = CHECKOUT_STEPS.filter(step => 
      step !== currentStep && !completedSteps.includes(step)
    );

    return {
      currentStep,
      completedSteps,
      pendingSteps,
      progressPercentage,
      canNavigateBack: stepIndex > 0,
      canNavigateForward: stepIndex < CHECKOUT_STEPS.length - 1,
    };
  }, []);

  // Helper to map backend stepData to frontend data format
  const mapStepDataToSessionData = useCallback((response: any) => {
    // Create a copy of the response
    const mapped = { ...response };
    
    // Map stepData to data if stepData exists and data doesn't
    if (mapped.stepData && !mapped.data) {
      mapped.data = mapped.stepData;
    }
    
    // Also handle the case where both might exist (prefer data)
    if (!mapped.data) {
      mapped.data = {};
    }
    
    return mapped;
  }, []);

  /**
   * Initialize checkout session
   */
  const initializeSession = useCallback(async (userId?: string | null, sessionId?: string, cartId?: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const request: InitializeCheckoutRequest = {
        userId,
        sessionId,
        cartId: cartId || '', // Pass cartId from cart context
        platform: typeof window !== 'undefined' && window.innerWidth < 768 ? 'mobile' : 'desktop',
        language: 'en', // Will be fetched from language context
      };

      const response = await apiClient.post<CheckoutSession>('/checkout/initialize', request);
      
      // Map stepData to data format expected by frontend
      const mappedResponse = mapStepDataToSessionData(response);
      setSession(mappedResponse);
      setProgress(calculateProgress(mappedResponse.currentStep, mappedResponse.data));
      
      // Set session expiration
      const expiresAt = new Date(Date.now() + DEFAULT_SESSION_TIMEOUT * 60 * 1000).toISOString();
      setSecurity(prev => ({
        ...prev,
        sessionExpiresAt: expiresAt,
      }));

      // Start session timeout timer
      startSessionTimeoutTimer();

      // Start abandonment detection
      startAbandonmentDetection();

      return response;
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to initialize checkout session';
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [calculateProgress]);

  /**
   * Update checkout step
   */
  const updateStep = useCallback(async (step: CheckoutStep) => {
    if (!session) {
      throw new Error('No active checkout session');
    }

    setIsLoading(true);
    setError(null);

    try {
      const request: UpdateCheckoutStepRequest = {
        sessionId: session.id,
        step,
      };

      const response = await apiClient.post<CheckoutSession>('/checkout/step', request);
      
      // Map stepData to data format expected by frontend
      const mappedResponse = mapStepDataToSessionData(response);
      setSession(mappedResponse);
      setProgress(calculateProgress(step, mappedResponse.data));
      
      // Update last activity
      lastActivityRef.current = Date.now();
      
      return response;
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to update checkout step';
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [session, calculateProgress]);

  /**
   * Save checkout progress
   */
  const saveProgress = useCallback(async (data: Partial<CheckoutSessionData>) => {
    if (!session) {
      throw new Error('No active checkout session');
    }

    setIsLoading(true);
    setError(null);

    try {
      const request: UpdateCheckoutStepRequest = {
        sessionId: session.id,
        step: session.currentStep,
        data,
      };

      const response = await apiClient.post<CheckoutSession>('/checkout/save', request);
      
      // Map stepData to data format expected by frontend
      const mappedResponse = mapStepDataToSessionData(response);
      setSession(mappedResponse);
      setProgress(calculateProgress(mappedResponse.currentStep, mappedResponse.data));
      
      // Update last activity
      lastActivityRef.current = Date.now();
      
      return response;
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to save checkout progress';
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [session, calculateProgress]);

  /**
   * Validate checkout step
   */
  const validateStep = useCallback(async (step: CheckoutStep): Promise<CheckoutValidationResult> => {
    if (!session) {
      throw new Error('No active checkout session');
    }

    setIsLoading(true);
    setError(null);

    try {
      const request: ValidateCheckoutStepRequest = {
        sessionId: session.id,
        step,
        data: session.data,
      };

      const response = await apiClient.post<CheckoutValidationResult>('/checkout/validate', request);
      
      return response;
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to validate checkout step';
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
   * Complete checkout
   */
  const completeCheckout = useCallback(async () => {
    if (!session) {
      throw new Error('No active checkout session');
    }

    setIsLoading(true);
    setError(null);

    try {
      // DIAGNOSTIC: Log session state before building request
      console.log('[completeCheckout] Session state:', {
        sessionId: session.id,
        sessionData: session.data,
        sessionDataKeys: session.data ? Object.keys(session.data) : [],
        hasAddress: !!session.data?.address,
        hasShipping: !!session.data?.shipping,
        hasPayment: !!session.data?.payment,
        addressData: session.data?.address,
        shippingData: session.data?.shipping,
        paymentData: session.data?.payment
      });

      // Prepare address data from session state to ensure it's included in the request
      // The backend expects address data in data.address or in the top-level address field
      const addressData = session.stepData?.address || session.data?.address;
      const shippingData = session.stepData?.shipping;  // ← Use stepData directly
      const paymentData = session.stepData?.payment;    // ← Use stepData directly
      
      // DIAGNOSTIC: Log extracted data
      console.log('[completeCheckout] Extracted data:', {
        hasAddressData: !!addressData,
        hasShippingData: !!shippingData,
        hasPaymentData: !!paymentData,
        addressDataDetails: addressData,
        shippingDataDetails: shippingData,
        paymentDataDetails: paymentData
      });

      // Handle case where session.data might still be undefined
      if (!addressData && !shippingData && !paymentData) {
        console.error('[completeCheckout] ERROR: No checkout data found in session!');
        console.error('[completeCheckout] Session:', JSON.stringify(session, null, 2));
        throw new Error('Checkout data is missing. Please complete all checkout steps before placing your order.');
      }
      
      // Convert address fields from frontend format to backend format
      // Frontend uses: fullName, addressLine1, addressLine2
      // Backend expects: firstName, lastName, address, addressLine2
      const convertToBackendAddressFormat = (addr: any) => {
        if (!addr) return undefined;
        
        const nameParts = (addr.fullName || addr.name || '').trim().split(/\s+/);
        const firstName = nameParts[0] || '';
        const lastName = nameParts.slice(1).join(' ') || '';
        
        return {
          firstName,
          lastName,
          phone: addr.phone || '',
          address: addr.addressLine1 || addr.address || '',
          addressLine2: addr.addressLine2 || '',
          city: addr.city || '',
          district: addr.district || '',
          division: addr.division || 'dhaka',
          postalCode: addr.postalCode || '',
        };
      };
      
      // Build comprehensive request with all checkout data
      // Use type assertion to handle the format conversion
      const requestData = {
        ...session.data,
        // Ensure address, shipping, and payment are properly structured
        address: addressData ? {
          ...addressData,
          shippingAddress: addressData.shippingAddress ? convertToBackendAddressFormat(addressData.shippingAddress) : undefined,
          billingAddress: addressData.billingAddress ? convertToBackendAddressFormat(addressData.billingAddress) : undefined,
        } : undefined,
        shipping: shippingData,
        payment: paymentData
      };
      
      const requestAddress = addressData ? {
        shippingAddress: (addressData.address?.shippingAddress || addressData.shippingAddress) ? convertToBackendAddressFormat(addressData.address?.shippingAddress || addressData.shippingAddress) : undefined,
        billingAddress: (addressData.address?.billingAddress || addressData.billingAddress) ? convertToBackendAddressFormat(addressData.address?.billingAddress || addressData.billingAddress) : undefined,
        useSameAddress: addressData.useSameAddress ?? addressData.address?.useSameAddress
      } : undefined;

      // DIAGNOSTIC: Log the final request being sent
      console.log('[completeCheckout] Request payload:', {
        sessionId: session.id,
        requestData: JSON.stringify(requestData),
        requestDataSize: JSON.stringify(requestData).length,
        requestAddress: JSON.stringify(requestAddress),
        requestAddressSize: JSON.stringify(requestAddress).length,
        addressData_converted: requestAddress?.shippingAddress,
        hasAddressData: !!requestAddress?.shippingAddress
      });

      const request: CompleteCheckoutRequest = {
        sessionId: session.id,
        data: requestData as any,
        address: requestAddress as any
      };

      // DIAGNOSTIC: Log final request structure
      console.log('[completeCheckout] Final request:', JSON.stringify(request, null, 2));

      const response = await apiClient.post<{ orderId: string }>('/checkout/complete', request);
      
      // Clear session
      clearSession();
      
      toast.success('Order placed successfully!');
      
      return response;
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to complete checkout';
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [session]);

  /**
   * Abandon checkout
   */
  const abandonCheckout = useCallback(async (reason: AbandonmentReason, saveData: boolean = true) => {
    if (!session) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const request: AbandonCheckoutRequest = {
        sessionId: session.id,
        reason,
        saveData,
      };

      const response = await apiClient.post<{ recoveryToken?: string }>('/checkout/abandon', request);
      
      setIsAbandoned(true);
      setAbandonmentReason(reason);
      
      if (response.recoveryToken) {
        toast.success('Your checkout progress has been saved. You can resume later.');
      }
      
      // Clear timers
      clearTimers();
      
      return response;
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to abandon checkout';
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [session]);

  /**
   * Recover checkout
   */
  const recoverCheckout = useCallback(async (recoveryToken: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const request: RecoverCheckoutRequest = {
        recoveryToken,
      };

      const response = await apiClient.post<{ session: CheckoutSession; recovery: CheckoutRecovery }>('/checkout/recover', request);
      
      // Map stepData to data format expected by frontend
      const mappedSession = mapStepDataToSessionData(response.session);
      setSession(mappedSession);
      setRecovery(response.recovery);
      setProgress(calculateProgress(mappedSession.currentStep, mappedSession.data));
      
      // Set session expiration
      const expiresAt = new Date(Date.now() + DEFAULT_SESSION_TIMEOUT * 60 * 1000).toISOString();
      setSecurity(prev => ({
        ...prev,
        sessionExpiresAt: expiresAt,
      }));

      // Start session timeout timer
      startSessionTimeoutTimer();

      // Start abandonment detection
      startAbandonmentDetection();

      toast.success('Checkout recovered successfully!');
      
      return response;
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to recover checkout';
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [calculateProgress]);

  /**
   * Extend checkout session
   */
  const extendSession = useCallback(async () => {
    if (!session) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await apiClient.post<{ expiresAt: string }>('/checkout/extend', { sessionId: session.id });
      
      // Update session expiration
      setSecurity(prev => ({
        ...prev,
        sessionExpiresAt: response.expiresAt,
      }));

      // Update last activity
      lastActivityRef.current = Date.now();
      
      // Restart session timeout timer
      startSessionTimeoutTimer();
      
      toast.success('Session extended');
      
      return response;
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to extend session';
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [session]);

  /**
   * Clear checkout session
   */
  const clearSession = useCallback(() => {
    setSession(null);
    setProgress({
      currentStep: 'address',
      completedSteps: [],
      pendingSteps: CHECKOUT_STEPS,
      progressPercentage: 0,
      canNavigateBack: false,
      canNavigateForward: false,
    });
    setIsAbandoned(false);
    setAbandonmentReason(null);
    setRecovery(null);
    setError(null);
    
    // Clear timers
    clearTimers();
  }, []);

  /**
   * Set security warning
   */
  const setSecurityWarning = useCallback((warning: SecurityWarning) => {
    setSecurity(prev => ({
      ...prev,
      warnings: [...prev.warnings, warning],
    }));
  }, []);

  /**
   * Dismiss security warning
   */
  const dismissSecurityWarning = useCallback((warningId: string) => {
    setSecurity(prev => ({
      ...prev,
      warnings: prev.warnings.filter(w => w.type !== warningId),
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

    // Calculate time until expiration
    const expiresAt = new Date(security.sessionExpiresAt).getTime();
    const now = Date.now();
    const timeUntilExpiration = expiresAt - now;

    // Set timer for session timeout warning
    if (timeUntilExpiration > 0) {
      sessionTimeoutTimerRef.current = setTimeout(() => {
        setSecurityWarning({
          type: 'session_timeout',
          severity: 'high',
          message: 'Your session will expire soon. Please extend your session to continue.',
          messageBn: 'আপনার সেশন শীঘ্রই মেয়াদ শেষ হবে। অনুগ্রহ করে চালিয়ে যেতে আপনার সেশন প্রসারিত করুন।',
          timestamp: new Date().toISOString(),
          dismissible: true,
          dismissed: false,
        });
      }, timeUntilExpiration - 5 * 60 * 1000); // Warn 5 minutes before expiration
    }
  }, [security.sessionExpiresAt, setSecurityWarning]);

  /**
   * Start abandonment detection
   */
  const startAbandonmentDetection = useCallback(() => {
    // Clear existing timer
    if (abandonmentTimerRef.current) {
      clearTimeout(abandonmentTimerRef.current);
    }

    // Set timer for abandonment detection
    abandonmentTimerRef.current = setTimeout(() => {
      const timeSinceLastActivity = Date.now() - lastActivityRef.current;
      
      if (timeSinceLastActivity >= ABANDONMENT_DETECTION_DELAY) {
        setIsAbandoned(true);
        setAbandonmentReason('session_timeout');
      }
    }, ABANDONMENT_DETECTION_DELAY);
  }, []);

  /**
   * Clear all timers
   */
  const clearTimers = useCallback(() => {
    if (sessionTimeoutTimerRef.current) {
      clearTimeout(sessionTimeoutTimerRef.current);
      sessionTimeoutTimerRef.current = null;
    }
    if (abandonmentTimerRef.current) {
      clearTimeout(abandonmentTimerRef.current);
      abandonmentTimerRef.current = null;
    }
  }, []);

  /**
   * Handle page visibility change for abandonment detection
   */
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Page is hidden, start abandonment detection
        startAbandonmentDetection();
      } else {
        // Page is visible again, clear abandonment timer
        if (abandonmentTimerRef.current) {
          clearTimeout(abandonmentTimerRef.current);
          abandonmentTimerRef.current = null;
        }
        lastActivityRef.current = Date.now();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [startAbandonmentDetection]);

  /**
   * Handle beforeunload event for abandonment detection
   */
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (session && !isAbandoned) {
        // Prevent page unload and show confirmation dialog
        e.preventDefault();
        e.returnValue = '';
        
        // Attempt to save progress before leaving
        abandonCheckout('navigation_away', true);
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [session, isAbandoned, abandonCheckout]);

  /**
   * Cleanup timers on unmount
   */
  useEffect(() => {
    return () => {
      clearTimers();
    };
  }, [clearTimers]);

  return {
    // State
    session,
    progress,
    security,
    isLoading,
    error,
    isAbandoned,
    abandonmentReason,
    recovery,
    
    // Actions
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
  };
};

export default useCheckout;
