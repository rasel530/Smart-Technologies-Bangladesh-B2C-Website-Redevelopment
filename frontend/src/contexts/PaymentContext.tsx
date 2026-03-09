/**
 * Payment Context Provider
 * Phase 7 Milestone 2: Payment Gateway Integration
 * Manages payment state across the checkout flow
 */

'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { PaymentMethod, PaymentContextType } from '@/types/payment';
import { paymentApi } from '@/services/paymentApi';
import { useRouter } from 'next/navigation';

const PaymentContext = createContext<PaymentContextType | undefined>(undefined);

interface PaymentProviderProps {
  children: React.ReactNode;
}

export const PaymentProvider: React.FC<PaymentProviderProps> = ({ children }) => {
  const router = useRouter();
  
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [amount, setAmount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Clear error message
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  /**
   * Initiate payment with selected method
   * Redirects to payment gateway URL if successful
   */
  const initiatePayment = useCallback(async () => {
    if (!orderId) {
      setError('No order ID provided. Please start the checkout process again.');
      return;
    }

    if (!selectedMethod) {
      setError('Please select a payment method before proceeding.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      console.log('[PaymentContext] Initiating payment:', {
        orderId,
        paymentMethod: selectedMethod,
        amount,
      });

      // Get current URL for return and cancel URLs
      const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
      const returnUrl = `${baseUrl}/checkout/payment/success`;
      const cancelUrl = `${baseUrl}/checkout/payment/cancel`;

      const response = await paymentApi.initiatePayment(
        orderId,
        selectedMethod,
        returnUrl,
        cancelUrl
      );

      console.log('[PaymentContext] Payment initiation response:', response);

      if (response.success && response.paymentUrl) {
        // For card payments, navigate to card payment page which will handle the redirect
        if (selectedMethod === 'CREDIT_CARD') {
          console.log('[PaymentContext] Navigating to card payment page');
          // Store payment URL in session storage for the card page to use
          sessionStorage.setItem('payment_paymentUrl', response.paymentUrl);
          sessionStorage.setItem('payment_transactionId', response.transactionId || '');
          // Navigate to card payment page with order details
          router.push(`/checkout/payment/card?orderId=${orderId}&amount=${amount}`);
        } else {
          // For other payment methods, redirect directly to payment gateway
          console.log('[PaymentContext] Redirecting to payment gateway:', response.paymentUrl);
          window.location.href = response.paymentUrl;
        }
      } else {
        setError(response.error || response.message || 'Failed to initiate payment. Please try again.');
      }
    } catch (err: any) {
      console.error('[PaymentContext] Payment initiation error:', err);
      
      // Enhanced error handling with user-friendly messages
      let errorMessage = 'Failed to initiate payment. Please try again.';
      
      if (err?.response?.data?.error) {
        errorMessage = err.response.data.error;
      } else if (err?.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err?.message) {
        errorMessage = err.message;
      } else if (err?.data?.message) {
        errorMessage = err.data.message;
      }
      
      // Specific error handling for common payment issues
      if (errorMessage.toLowerCase().includes('network') || errorMessage.toLowerCase().includes('timeout')) {
        errorMessage = 'Network error. Please check your internet connection and try again.';
      } else if (errorMessage.toLowerCase().includes('invalid') && errorMessage.toLowerCase().includes('order')) {
        errorMessage = 'Invalid order. Please start the checkout process again.';
      } else if (errorMessage.toLowerCase().includes('payment') && errorMessage.toLowerCase().includes('method')) {
        errorMessage = 'Payment method error. Please select a different payment method.';
      }
      
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [orderId, selectedMethod, amount]);

  /**
   * Reset payment state
   */
  const resetPayment = useCallback(() => {
    setSelectedMethod(null);
    setOrderId(null);
    setAmount(0);
    setIsLoading(false);
    setError(null);
  }, []);

  /**
   * Load payment state from localStorage (for persistence across page reloads)
   */
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const savedState = localStorage.getItem('payment_state');
        if (savedState) {
          const parsed = JSON.parse(savedState);
          if (parsed.orderId) setOrderId(parsed.orderId);
          if (parsed.amount) setAmount(parsed.amount);
          if (parsed.selectedMethod) setSelectedMethod(parsed.selectedMethod);
        }
      } catch (err) {
        console.warn('[PaymentContext] Failed to load saved state:', err);
      }
    }
  }, []);

  /**
   * Save payment state to localStorage
   */
  useEffect(() => {
    if (typeof window !== 'undefined' && (orderId || amount || selectedMethod)) {
      try {
        const stateToSave = {
          orderId,
          amount,
          selectedMethod,
        };
        localStorage.setItem('payment_state', JSON.stringify(stateToSave));
      } catch (err) {
        console.warn('[PaymentContext] Failed to save state:', err);
      }
    }
  }, [orderId, amount, selectedMethod]);

  const value: PaymentContextType = {
    selectedMethod,
    setSelectedMethod,
    orderId,
    setOrderId,
    amount,
    setAmount,
    initiatePayment,
    isLoading,
    error,
    clearError,
  };

  return <PaymentContext.Provider value={value}>{children}</PaymentContext.Provider>;
};

/**
 * Custom hook to use payment context
 * @throws Error if used outside PaymentProvider
 */
export const usePayment = (): PaymentContextType => {
  const context = useContext(PaymentContext);
  if (!context) {
    throw new Error('usePayment must be used within a PaymentProvider');
  }
  return context;
};

export default PaymentContext;
