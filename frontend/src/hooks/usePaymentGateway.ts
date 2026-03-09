/**
 * Payment Gateway Hooks
 * Phase 7 Milestone 2: Payment Gateway Integration
 * Custom React hooks for payment gateway operations
 */

import { useState, useCallback } from 'react';
import { gatewayApi } from '@/services/gatewayApi';
import {
  CardData,
  BkashPaymentRequest,
  BkashExecuteRequest,
  NagadPaymentRequest,
  SSLCommerzInitiateResponse,
  BkashCreateResponse,
  BkashExecuteResponse,
  NagadInitializeResponse,
  NagadVerifyResponse,
  PaymentGatewayState,
} from '@/types/payment';

/**
 * SSLCommerz Payment Hook
 */
export const useSSLCommerzPayment = () => {
  const [state, setState] = useState<PaymentGatewayState>({
    isLoading: false,
    isProcessing: false,
    error: null,
    success: false,
    transactionId: null,
  });

  const initiatePayment = useCallback(async (orderId: string, cardData: CardData) => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null, success: false }));
      
      const result: SSLCommerzInitiateResponse = await gatewayApi.sslcommerz.initiatePayment(
        orderId,
        cardData
      );
      
      if (result.success && result.paymentUrl) {
        setState(prev => ({
          ...prev,
          isLoading: false,
          success: true,
          transactionId: result.gatewayTransactionId || null,
        }));
        return result;
      } else {
        throw new Error(result.error || 'Payment initiation failed');
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Payment initiation failed';
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));
      throw err;
    }
  }, []);

  const verifyPayment = useCallback(async (transactionId: string) => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      
      const result = await gatewayApi.sslcommerz.verifyPayment(transactionId);
      
      setState(prev => ({
        ...prev,
        isLoading: false,
        success: result.success,
      }));
      
      return result;
    } catch (err: any) {
      const errorMessage = err.message || 'Payment verification failed';
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));
      throw err;
    }
  }, []);

  const reset = useCallback(() => {
    setState({
      isLoading: false,
      isProcessing: false,
      error: null,
      success: false,
      transactionId: null,
    });
  }, []);

  return {
    ...state,
    initiatePayment,
    verifyPayment,
    reset,
  };
};

/**
 * bKash Payment Hook
 */
export const useBkashPayment = () => {
  const [state, setState] = useState<PaymentGatewayState>({
    isLoading: false,
    isProcessing: false,
    error: null,
    success: false,
    transactionId: null,
  });

  const createPayment = useCallback(async (request: BkashPaymentRequest) => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null, success: false }));
      
      const result: BkashCreateResponse = await gatewayApi.bkash.createPayment(request);
      
      if (result.success && result.bkashURL) {
        setState(prev => ({
          ...prev,
          isLoading: false,
          success: true,
          transactionId: result.paymentId || null,
        }));
        return result;
      } else {
        throw new Error(result.error || 'bKash payment creation failed');
      }
    } catch (err: any) {
      const errorMessage = err.message || 'bKash payment creation failed';
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));
      throw err;
    }
  }, []);

  const executePayment = useCallback(async (request: BkashExecuteRequest) => {
    try {
      setState(prev => ({ ...prev, isProcessing: true, error: null }));
      
      const result: BkashExecuteResponse = await gatewayApi.bkash.executePayment(request);
      
      setState(prev => ({
        ...prev,
        isProcessing: false,
        success: result.success,
        transactionId: result.transactionId || prev.transactionId,
      }));
      
      return result;
    } catch (err: any) {
      const errorMessage = err.message || 'bKash payment execution failed';
      setState(prev => ({
        ...prev,
        isProcessing: false,
        error: errorMessage,
      }));
      throw err;
    }
  }, []);

  const queryPayment = useCallback(async (paymentId: string) => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      
      const result = await gatewayApi.bkash.queryPayment(paymentId);
      
      setState(prev => ({
        ...prev,
        isLoading: false,
      }));
      
      return result;
    } catch (err: any) {
      const errorMessage = err.message || 'bKash payment query failed';
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));
      throw err;
    }
  }, []);

  const cancelPayment = useCallback(async (paymentId: string) => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      
      const result = await gatewayApi.bkash.cancelPayment(paymentId);
      
      setState(prev => ({
        ...prev,
        isLoading: false,
      }));
      
      return result;
    } catch (err: any) {
      const errorMessage = err.message || 'bKash payment cancellation failed';
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));
      throw err;
    }
  }, []);

  const reset = useCallback(() => {
    setState({
      isLoading: false,
      isProcessing: false,
      error: null,
      success: false,
      transactionId: null,
    });
  }, []);

  return {
    ...state,
    createPayment,
    executePayment,
    queryPayment,
    cancelPayment,
    reset,
  };
};

/**
 * Nagad Payment Hook
 */
export const useNagadPayment = () => {
  const [state, setState] = useState<PaymentGatewayState>({
    isLoading: false,
    isProcessing: false,
    error: null,
    success: false,
    transactionId: null,
  });

  const initializePayment = useCallback(async (request: NagadPaymentRequest) => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null, success: false }));
      
      const result: NagadInitializeResponse = await gatewayApi.nagad.initializePayment(request);
      
      if (result.success && result.nagadURL) {
        setState(prev => ({
          ...prev,
          isLoading: false,
          success: true,
          transactionId: result.paymentRefId || null,
        }));
        return result;
      } else {
        throw new Error(result.error || 'Nagad payment initialization failed');
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Nagad payment initialization failed';
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));
      throw err;
    }
  }, []);

  const verifyPayment = useCallback(async (paymentRefId: string) => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      
      const result: NagadVerifyResponse = await gatewayApi.nagad.verifyPayment(paymentRefId);
      
      setState(prev => ({
        ...prev,
        isLoading: false,
        success: result.success,
      }));
      
      return result;
    } catch (err: any) {
      const errorMessage = err.message || 'Nagad payment verification failed';
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));
      throw err;
    }
  }, []);

  const queryPayment = useCallback(async (paymentRefId: string) => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      
      const result = await gatewayApi.nagad.queryPayment(paymentRefId);
      
      setState(prev => ({
        ...prev,
        isLoading: false,
      }));
      
      return result;
    } catch (err: any) {
      const errorMessage = err.message || 'Nagad payment query failed';
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));
      throw err;
    }
  }, []);

  const cancelPayment = useCallback(async (paymentRefId: string) => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      
      const result = await gatewayApi.nagad.cancelPayment(paymentRefId);
      
      setState(prev => ({
        ...prev,
        isLoading: false,
      }));
      
      return result;
    } catch (err: any) {
      const errorMessage = err.message || 'Nagad payment cancellation failed';
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));
      throw err;
    }
  }, []);

  const reset = useCallback(() => {
    setState({
      isLoading: false,
      isProcessing: false,
      error: null,
      success: false,
      transactionId: null,
    });
  }, []);

  return {
    ...state,
    initializePayment,
    verifyPayment,
    queryPayment,
    cancelPayment,
    reset,
  };
};

/**
 * Common Payment Gateway Hook
 */
export const usePaymentGateway = (gateway: 'sslcommerz' | 'bkash' | 'nagad') => {
  const sslcommerzHook = useSSLCommerzPayment();
  const bkashHook = useBkashPayment();
  const nagadHook = useNagadPayment();

  switch (gateway) {
    case 'sslcommerz':
      return sslcommerzHook;
    case 'bkash':
      return bkashHook;
    case 'nagad':
      return nagadHook;
    default:
      return sslcommerzHook;
  }
};

/**
 * Payment Status Polling Hook
 */
export const usePaymentStatusPolling = (
  orderId: string,
  interval: number = 3000,
  maxAttempts: number = 20
) => {
  const [state, setState] = useState<PaymentGatewayState>({
    isLoading: false,
    isProcessing: false,
    error: null,
    success: false,
    transactionId: null,
  });

  const pollStatus = useCallback(async () => {
    let attempts = 0;
    
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    const poll = async (): Promise<void> => {
      try {
        attempts++;
        
        if (attempts > maxAttempts) {
          throw new Error('Payment status polling timeout');
        }

        const result = await gatewayApi.common.getPaymentStatus(orderId);
        
        if (result.success && result.data?.status === 'COMPLETED') {
          setState(prev => ({
            ...prev,
            isLoading: false,
            success: true,
            transactionId: result.data?.transactionId || null,
          }));
          return;
        }
        
        if (result.data?.status === 'FAILED' || result.data?.status === 'CANCELLED') {
          throw new Error(result.data?.error || 'Payment failed or cancelled');
        }
        
        // Continue polling
        await new Promise(resolve => setTimeout(resolve, interval));
        await poll();
      } catch (err: any) {
        const errorMessage = err.message || 'Payment status check failed';
        setState(prev => ({
          ...prev,
          isLoading: false,
          error: errorMessage,
        }));
        throw err;
      }
    };

    await poll();
  }, [orderId, interval, maxAttempts]);

  const reset = useCallback(() => {
    setState({
      isLoading: false,
      isProcessing: false,
      error: null,
      success: false,
      transactionId: null,
    });
  }, []);

  return {
    ...state,
    pollStatus,
    reset,
  };
};

export default {
  useSSLCommerzPayment,
  useBkashPayment,
  useNagadPayment,
  usePaymentGateway,
  usePaymentStatusPolling,
};
