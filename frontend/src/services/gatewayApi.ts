/**
 * Payment Gateway API Service
 * Phase 7 Milestone 2: Payment Gateway Integration
 * Handles all gateway-specific payment API calls
 */

import apiClient from '@/lib/api/client';
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
  GatewayApiResponse,
} from '@/types/payment';

/**
 * Payment Gateway API Service
 */
export const gatewayApi = {
  /**
   * SSLCommerz Gateway API
   */
  sslcommerz: {
    /**
     * Initiate SSLCommerz card payment
     * @param orderId - The order ID
     * @param cardData - Card payment data
     * @returns Promise with SSLCommerz initiation response
     */
    initiatePayment: async (
      orderId: string,
      cardData: CardData
    ): Promise<SSLCommerzInitiateResponse> => {
      try {
        console.log('[GatewayAPI] Initiating SSLCommerz payment:', { orderId });
        
        const response = await apiClient.post<SSLCommerzInitiateResponse>(
          '/api/v1/payments/sslcommerz/initiate',
          {
            orderId,
            cardData,
          }
        );
        
        console.log('[GatewayAPI] SSLCommerz payment initiated:', response);
        return response;
      } catch (error) {
        console.error('[GatewayAPI] Error initiating SSLCommerz payment:', error);
        throw error;
      }
    },

    /**
     * Verify SSLCommerz payment
     * @param transactionId - The transaction ID
     * @returns Promise with verification result
     */
    verifyPayment: async (transactionId: string): Promise<GatewayApiResponse> => {
      try {
        console.log('[GatewayAPI] Verifying SSLCommerz payment:', { transactionId });
        
        const response = await apiClient.post<GatewayApiResponse>(
          '/api/v1/payments/sslcommerz/verify',
          { transactionId }
        );
        
        console.log('[GatewayAPI] SSLCommerz payment verified:', response);
        return response;
      } catch (error) {
        console.error('[GatewayAPI] Error verifying SSLCommerz payment:', error);
        throw error;
      }
    },
  },

  /**
   * bKash Gateway API
   */
  bkash: {
    /**
     * Create bKash payment
     * @param request - bKash payment request
     * @returns Promise with bKash creation response
     */
    createPayment: async (request: BkashPaymentRequest): Promise<BkashCreateResponse> => {
      try {
        console.log('[GatewayAPI] Creating bKash payment:', { orderId: request.orderId });
        
        const response = await apiClient.post<BkashCreateResponse>(
          '/api/v1/payments/bkash/create',
          request
        );
        
        console.log('[GatewayAPI] bKash payment created:', response);
        return response;
      } catch (error) {
        console.error('[GatewayAPI] Error creating bKash payment:', error);
        throw error;
      }
    },

    /**
     * Execute bKash payment with PIN
     * @param request - bKash execute request
     * @returns Promise with bKash execution response
     */
    executePayment: async (request: BkashExecuteRequest): Promise<BkashExecuteResponse> => {
      try {
        console.log('[GatewayAPI] Executing bKash payment:', { paymentId: request.paymentId });
        
        const response = await apiClient.post<BkashExecuteResponse>(
          '/api/v1/payments/bkash/execute',
          request
        );
        
        console.log('[GatewayAPI] bKash payment executed:', response);
        return response;
      } catch (error) {
        console.error('[GatewayAPI] Error executing bKash payment:', error);
        throw error;
      }
    },

    /**
     * Query bKash payment status
     * @param paymentId - The payment ID
     * @returns Promise with payment status
     */
    queryPayment: async (paymentId: string): Promise<GatewayApiResponse> => {
      try {
        console.log('[GatewayAPI] Querying bKash payment:', { paymentId });
        
        const response = await apiClient.get<GatewayApiResponse>(
          `/api/v1/payments/bkash/query/${paymentId}`
        );
        
        console.log('[GatewayAPI] bKash payment queried:', response);
        return response;
      } catch (error) {
        console.error('[GatewayAPI] Error querying bKash payment:', error);
        throw error;
      }
    },

    /**
     * Cancel bKash payment
     * @param paymentId - The payment ID
     * @returns Promise with cancellation result
     */
    cancelPayment: async (paymentId: string): Promise<GatewayApiResponse> => {
      try {
        console.log('[GatewayAPI] Cancelling bKash payment:', { paymentId });
        
        const response = await apiClient.post<GatewayApiResponse>(
          '/api/v1/payments/bkash/cancel',
          { paymentId }
        );
        
        console.log('[GatewayAPI] bKash payment cancelled:', response);
        return response;
      } catch (error) {
        console.error('[GatewayAPI] Error cancelling bKash payment:', error);
        throw error;
      }
    },
  },

  /**
   * Nagad Gateway API
   */
  nagad: {
    /**
     * Initialize Nagad payment
     * @param request - Nagad payment request
     * @returns Promise with Nagad initialization response
     */
    initializePayment: async (request: NagadPaymentRequest): Promise<NagadInitializeResponse> => {
      try {
        console.log('[GatewayAPI] Initializing Nagad payment:', { orderId: request.orderId });
        
        const response = await apiClient.post<NagadInitializeResponse>(
          '/api/v1/payments/nagad/initialize',
          request
        );
        
        console.log('[GatewayAPI] Nagad payment initialized:', response);
        return response;
      } catch (error) {
        console.error('[GatewayAPI] Error initializing Nagad payment:', error);
        throw error;
      }
    },

    /**
     * Verify Nagad payment
     * @param paymentRefId - The payment reference ID
     * @returns Promise with verification result
     */
    verifyPayment: async (paymentRefId: string): Promise<NagadVerifyResponse> => {
      try {
        console.log('[GatewayAPI] Verifying Nagad payment:', { paymentRefId });
        
        const response = await apiClient.post<NagadVerifyResponse>(
          '/api/v1/payments/nagad/verify',
          { paymentRefId }
        );
        
        console.log('[GatewayAPI] Nagad payment verified:', response);
        return response;
      } catch (error) {
        console.error('[GatewayAPI] Error verifying Nagad payment:', error);
        throw error;
      }
    },

    /**
     * Query Nagad payment status
     * @param paymentRefId - The payment reference ID
     * @returns Promise with payment status
     */
    queryPayment: async (paymentRefId: string): Promise<GatewayApiResponse> => {
      try {
        console.log('[GatewayAPI] Querying Nagad payment:', { paymentRefId });
        
        const response = await apiClient.get<GatewayApiResponse>(
          `/api/v1/payments/nagad/query/${paymentRefId}`
        );
        
        console.log('[GatewayAPI] Nagad payment queried:', response);
        return response;
      } catch (error) {
        console.error('[GatewayAPI] Error querying Nagad payment:', error);
        throw error;
      }
    },

    /**
     * Cancel Nagad payment
     * @param paymentRefId - The payment reference ID
     * @returns Promise with cancellation result
     */
    cancelPayment: async (paymentRefId: string): Promise<GatewayApiResponse> => {
      try {
        console.log('[GatewayAPI] Cancelling Nagad payment:', { paymentRefId });
        
        const response = await apiClient.post<GatewayApiResponse>(
          '/api/v1/payments/nagad/cancel',
          { paymentRefId }
        );
        
        console.log('[GatewayAPI] Nagad payment cancelled:', response);
        return response;
      } catch (error) {
        console.error('[GatewayAPI] Error cancelling Nagad payment:', error);
        throw error;
      }
    },
  },

  /**
   * Common Gateway API
   */
  common: {
    /**
     * Get payment status for any gateway
     * @param orderId - The order ID
     * @returns Promise with payment status
     */
    getPaymentStatus: async (orderId: string): Promise<GatewayApiResponse> => {
      try {
        console.log('[GatewayAPI] Getting payment status:', { orderId });
        
        const response = await apiClient.get<GatewayApiResponse>(
          `/api/v1/payments/status/${orderId}`
        );
        
        console.log('[GatewayAPI] Payment status retrieved:', response);
        return response;
      } catch (error) {
        console.error('[GatewayAPI] Error getting payment status:', error);
        throw error;
      }
    },

    /**
     * Get transaction details
     * @param transactionId - The transaction ID
     * @returns Promise with transaction details
     */
    getTransactionDetails: async (transactionId: string): Promise<GatewayApiResponse> => {
      try {
        console.log('[GatewayAPI] Getting transaction details:', { transactionId });
        
        const response = await apiClient.get<GatewayApiResponse>(
          `/api/v1/payments/transactions/${transactionId}`
        );
        
        console.log('[GatewayAPI] Transaction details retrieved:', response);
        return response;
      } catch (error) {
        console.error('[GatewayAPI] Error getting transaction details:', error);
        throw error;
      }
    },

    /**
     * Handle payment callback from gateway
     * @param gateway - The payment gateway
     * @param callbackData - Callback data from gateway
     * @returns Promise with callback handling result
     */
    handleCallback: async (
      gateway: string,
      callbackData: Record<string, any>
    ): Promise<GatewayApiResponse> => {
      try {
        console.log('[GatewayAPI] Handling payment callback:', { gateway });
        
        const response = await apiClient.post<GatewayApiResponse>(
          '/api/v1/payments/callback',
          {
            gateway,
            callbackData,
          }
        );
        
        console.log('[GatewayAPI] Payment callback handled:', response);
        return response;
      } catch (error) {
        console.error('[GatewayAPI] Error handling payment callback:', error);
        throw error;
      }
    },

    /**
     * Cancel payment for any gateway
     * @param orderId - The order ID
     * @returns Promise with cancellation result
     */
    cancelPayment: async (orderId: string): Promise<GatewayApiResponse> => {
      try {
        console.log('[GatewayAPI] Cancelling payment:', { orderId });
        
        const response = await apiClient.post<GatewayApiResponse>(
          `/api/v1/payments/${orderId}/cancel`
        );
        
        console.log('[GatewayAPI] Payment cancelled:', response);
        return response;
      } catch (error) {
        console.error('[GatewayAPI] Error cancelling payment:', error);
        throw error;
      }
    },
  },
};

export default gatewayApi;
