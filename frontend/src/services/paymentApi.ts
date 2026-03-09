/**
 * Payment API Service
 * Phase 7 Milestone 2: Payment Gateway Integration
 * Handles all payment-related API calls
 */

import apiClient from '@/lib/api/client';
import {
  PaymentMethod,
  PaymentMethodOption,
  PaymentInitiationRequest,
  PaymentInitiationResponse,
  PaymentStatusResponse,
  AvailablePaymentMethodsResponse,
} from '@/types/payment';

export const paymentApi = {
  /**
   * Get available payment methods
   * @returns Promise with available payment methods
   */
  getAvailablePaymentMethods: async (): Promise<AvailablePaymentMethodsResponse> => {
    try {
      const response = await apiClient.get<AvailablePaymentMethodsResponse>('/checkout/payment-methods');
      return response;
    } catch (error: any) {
      console.error('[PaymentAPI] Error fetching available payment methods:', error);
      
      // Enhanced error handling with user-friendly messages
      const errorMessage = error?.response?.data?.error || 
                       error?.response?.data?.message || 
                       error?.message || 
                       'Failed to fetch payment methods. Please try again later.';
      
      throw new Error(errorMessage);
    }
  },

  /**
   * Initiate payment for an order
   * @param orderId - The order ID to initiate payment for
   * @param paymentMethod - The selected payment method
   * @param returnUrl - Optional return URL after payment
   * @param cancelUrl - Optional cancel URL if payment is cancelled
   * @returns Promise with payment initiation response
   */
  initiatePayment: async (
    orderId: string,
    paymentMethod: PaymentMethod,
    returnUrl?: string,
    cancelUrl?: string
  ): Promise<PaymentInitiationResponse> => {
    try {
      const requestBody: PaymentInitiationRequest = {
        orderId,
        paymentMethod,
        returnUrl,
        cancelUrl,
      };

      const response = await apiClient.post<PaymentInitiationResponse>(
        '/payments/initiate',
        requestBody
      );
      return response;
    } catch (error: any) {
      console.error('[PaymentAPI] Error initiating payment:', error);
      
      // Enhanced error handling with user-friendly messages
      const errorMessage = error?.response?.data?.error || 
                       error?.response?.data?.message || 
                       error?.message || 
                       'Failed to initiate payment. Please try again.';
      
      throw new Error(errorMessage);
    }
  },

  /**
   * Get payment status for an order
   * @param orderId - The order ID to check payment status for
   * @returns Promise with payment status response
   */
  getPaymentStatus: async (orderId: string): Promise<PaymentStatusResponse> => {
    try {
      const response = await apiClient.get<PaymentStatusResponse>(`/payments/${orderId}/status`);
      return response;
    } catch (error) {
      console.error('[PaymentAPI] Error fetching payment status:', error);
      throw error;
    }
  },

  /**
   * Verify payment callback from gateway
   * @param transactionId - The transaction ID to verify
   * @returns Promise with verification result
   */
  verifyPayment: async (transactionId: string): Promise<any> => {
    try {
      const response = await apiClient.post<any>('/payments/verify', { transactionId });
      return response;
    } catch (error) {
      console.error('[PaymentAPI] Error verifying payment:', error);
      throw error;
    }
  },

  /**
   * Cancel an ongoing payment
   * @param orderId - The order ID to cancel payment for
   * @returns Promise with cancellation result
   */
  cancelPayment: async (orderId: string): Promise<any> => {
    try {
      const response = await apiClient.post<any>(`/payments/${orderId}/cancel`);
      return response;
    } catch (error) {
      console.error('[PaymentAPI] Error cancelling payment:', error);
      throw error;
    }
  },

  /**
   * Get payment transaction details
   * @param transactionId - The transaction ID to fetch details for
   * @returns Promise with transaction details
   */
  getTransactionDetails: async (transactionId: string): Promise<any> => {
    try {
      const response = await apiClient.get<any>(`/payments/transactions/${transactionId}`);
      return response;
    } catch (error) {
      console.error('[PaymentAPI] Error fetching transaction details:', error);
      throw error;
    }
  },

  /**
   * Get payment methods for a specific order
   * @param orderId - The order ID to get payment methods for
   * @returns Promise with available payment methods for the order
   */
  getOrderPaymentMethods: async (orderId: string): Promise<PaymentMethodOption[]> => {
    try {
      const response = await apiClient.get<PaymentMethodOption[]>(`/payments/orders/${orderId}/methods`);
      return response;
    } catch (error) {
      console.error('[PaymentAPI] Error fetching order payment methods:', error);
      throw error;
    }
  },

  /**
   * Validate payment method availability
   * @param paymentMethod - The payment method to validate
   * @returns Promise with validation result
   */
  validatePaymentMethod: async (paymentMethod: PaymentMethod): Promise<{ valid: boolean; message?: string }> => {
    try {
      const response = await apiClient.post<{ valid: boolean; message?: string }>('/payments/validate', {
        paymentMethod,
      });
      return response;
    } catch (error) {
      console.error('[PaymentAPI] Error validating payment method:', error);
      throw error;
    }
  },
};

export default paymentApi;
