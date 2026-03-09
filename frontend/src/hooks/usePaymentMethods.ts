/**
 * Payment Methods Hook
 * Phase 7 Milestone 2: Payment Gateway Integration
 * Custom hook for fetching and managing payment methods
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { paymentApi } from '@/services/paymentApi';
import { PaymentMethodOption } from '@/types/payment';

interface UsePaymentMethodsReturn {
  methods: PaymentMethodOption[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  getMethodByType: (method: string) => PaymentMethodOption | undefined;
  isMethodAvailable: (method: string) => boolean;
}

/**
 * Custom hook to fetch and manage payment methods
 * @returns Object containing payment methods, loading state, error state, and utility functions
 */
export const usePaymentMethods = (): UsePaymentMethodsReturn => {
  const [methods, setMethods] = useState<PaymentMethodOption[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetch available payment methods from API
   */
  const fetchPaymentMethods = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      console.log('[usePaymentMethods] Fetching available payment methods...');
      const response = await paymentApi.getAvailablePaymentMethods();
      
      console.log('[usePaymentMethods] Payment methods response:', response);
      setMethods(response.methods || []);
      setError(null);
    } catch (err: any) {
      console.error('[usePaymentMethods] Error fetching payment methods:', err);
      const errorMessage = err.message || err.data?.message || 'Failed to load payment methods';
      setError(errorMessage);
      
      // Set empty array on error to prevent undefined issues
      setMethods([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Get payment method by type
   * @param method - The payment method type to find
   * @returns The payment method option or undefined if not found
   */
  const getMethodByType = useCallback(
    (method: string): PaymentMethodOption | undefined => {
      return methods.find((m) => m.method === method);
    },
    [methods]
  );

  /**
   * Check if a payment method is available
   * @param method - The payment method type to check
   * @returns True if the method is available, false otherwise
   */
  const isMethodAvailable = useCallback(
    (method: string): boolean => {
      const methodOption = getMethodByType(method);
      return methodOption?.isAvailable ?? false;
    },
    [getMethodByType]
  );

  // Fetch payment methods on mount
  useEffect(() => {
    fetchPaymentMethods();
  }, [fetchPaymentMethods]);

  return {
    methods,
    isLoading,
    error,
    refetch: fetchPaymentMethods,
    getMethodByType,
    isMethodAvailable,
  };
};

/**
 * Hook to get payment methods for a specific order
 * @param orderId - The order ID to get payment methods for
 * @returns Object containing payment methods, loading state, error state, and refetch function
 */
export const useOrderPaymentMethods = (orderId: string) => {
  const [methods, setMethods] = useState<PaymentMethodOption[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOrderPaymentMethods = useCallback(async () => {
    if (!orderId) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      console.log('[useOrderPaymentMethods] Fetching payment methods for order:', orderId);
      const response = await paymentApi.getOrderPaymentMethods(orderId);
      
      console.log('[useOrderPaymentMethods] Order payment methods response:', response);
      setMethods(response || []);
      setError(null);
    } catch (err: any) {
      console.error('[useOrderPaymentMethods] Error fetching order payment methods:', err);
      const errorMessage = err.message || err.data?.message || 'Failed to load payment methods';
      setError(errorMessage);
      setMethods([]);
    } finally {
      setIsLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    fetchOrderPaymentMethods();
  }, [fetchOrderPaymentMethods]);

  return {
    methods,
    isLoading,
    error,
    refetch: fetchOrderPaymentMethods,
  };
};

/**
 * Hook to get payment status for an order
 * @param orderId - The order ID to check payment status for
 * @param autoRefresh - Whether to auto-refresh the status (default: false)
 * @param refreshInterval - Refresh interval in milliseconds (default: 5000)
 * @returns Object containing payment status, loading state, error state, and refetch function
 */
export const usePaymentStatus = (
  orderId: string,
  autoRefresh: boolean = false,
  refreshInterval: number = 5000
) => {
  const [status, setStatus] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPaymentStatus = useCallback(async () => {
    if (!orderId) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      console.log('[usePaymentStatus] Fetching payment status for order:', orderId);
      const response = await paymentApi.getPaymentStatus(orderId);
      
      console.log('[usePaymentStatus] Payment status response:', response);
      setStatus(response);
      setError(null);
    } catch (err: any) {
      console.error('[usePaymentStatus] Error fetching payment status:', err);
      const errorMessage = err.message || err.data?.message || 'Failed to load payment status';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [orderId]);

  // Auto-refresh if enabled
  useEffect(() => {
    fetchPaymentStatus();

    if (autoRefresh) {
      const interval = setInterval(fetchPaymentStatus, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [fetchPaymentStatus, autoRefresh, refreshInterval]);

  return {
    status,
    isLoading,
    error,
    refetch: fetchPaymentStatus,
  };
};

export default usePaymentMethods;
