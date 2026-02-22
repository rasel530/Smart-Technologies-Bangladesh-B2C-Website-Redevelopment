/**
 * Local Payment API Client
 *
 * This file provides methods for interacting with Bangladesh-specific local payment
 * API endpoints (bKash, Nagad, Rocket, SureCash) and SMS subscription management.
 * It follows existing API client pattern and supports local payment operations.
 */

import { apiClient } from './client';
import {
  LocalPaymentMethod,
  PaymentFeeResult,
  PaymentValidationResult,
  PaymentProcessingResult,
  SmsSubscription,
  LocalPaymentConfiguration,
  GetLocalPaymentMethodsResponse,
  GetPaymentMethodByCodeResponse,
  CalculatePaymentFeeResponse,
  ValidatePaymentMethodResponse,
  ProcessLocalPaymentResponse,
  GetPaymentInstructionsResponse,
  GetSmsSubscriptionResponse,
  CreateSmsSubscriptionResponse,
  UpdateSmsSubscriptionResponse,
  CancelSmsSubscriptionResponse,
  GetLocalPaymentConfigurationResponse,
  ProcessLocalPaymentRequest,
  CreateSmsSubscriptionRequest,
  UpdateSmsSubscriptionRequest
} from '@/types/localPayment';

// Get API URL from environment or use default (backend runs on port 3001)
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

/**
 * Get all active local payment methods
 * @returns Promise<GetLocalPaymentMethodsResponse> List of local payment methods
 */
export const getLocalPaymentMethods = async (): Promise<GetLocalPaymentMethodsResponse> => {
  try {
    const response = await apiClient.get<GetLocalPaymentMethodsResponse>('/local-payment/methods', { unwrapResponse: false });
    return response;
  } catch (error) {
    console.error('[Local Payment API] Error getting local payment methods:', error);
    throw error;
  }
};

/**
 * Get payment method by code
 * @param code - The payment method code (e.g., 'bkash', 'nagad')
 * @returns Promise<GetPaymentMethodByCodeResponse> Payment method details
 */
export const getPaymentMethodByCode = async (code: string): Promise<GetPaymentMethodByCodeResponse> => {
  try {
    const response = await apiClient.get<GetPaymentMethodByCodeResponse>(
      `/local-payment/methods/${code}`,
      { timeout: 5000, unwrapResponse: false }  // 5-second timeout for local payment API calls
    );
    return response;
  } catch (error) {
    console.error('[Local Payment API] Error getting payment method:', error);
    throw error;
  }
};

/**
 * Calculate payment fee for a given amount and method
 * @param amount - The payment amount
 * @param methodCode - The payment method code
 * @returns Promise<CalculatePaymentFeeResponse> Fee calculation result
 */
export const calculatePaymentFee = async (
  amount: number,
  methodCode: string
): Promise<CalculatePaymentFeeResponse> => {
  try {
    const response = await apiClient.get<CalculatePaymentFeeResponse>(
      `/local-payment/fee/${amount}/${methodCode}`,
      { unwrapResponse: false }
    );
    return response;
  } catch (error) {
    console.error('[Local Payment API] Error calculating payment fee:', error);
    throw error;
  }
};

/**
 * Validate payment method for a given amount
 * @param methodCode - The payment method code
 * @param amount - The payment amount
 * @returns Promise<ValidatePaymentMethodResponse> Validation result
 */
export const validatePaymentMethod = async (
  methodCode: string,
  amount: number
): Promise<ValidatePaymentMethodResponse> => {
  try {
    const response = await apiClient.get<ValidatePaymentMethodResponse>(
      `/local-payment/validate/${methodCode}/${amount}`,
      { unwrapResponse: false }
    );
    return response;
  } catch (error) {
    console.error('[Local Payment API] Error validating payment method:', error);
    throw error;
  }
};

/**
 * Process local payment
 * @param paymentData - Payment data including userId, methodCode, amount, etc.
 * @returns Promise<ProcessLocalPaymentResponse> Payment processing result
 */
export const processLocalPayment = async (
  paymentData: ProcessLocalPaymentRequest
): Promise<ProcessLocalPaymentResponse> => {
  try {
    const response = await apiClient.post<ProcessLocalPaymentResponse>(
      '/local-payment/process',
      paymentData,
      { unwrapResponse: false }
    );
    return response;
  } catch (error) {
    console.error('[Local Payment API] Error processing local payment:', error);
    throw error;
  }
};

/**
 * Get payment instructions for a method
 * @param methodCode - The payment method code
 * @param language - Language preference ('en' or 'bn')
 * @returns Promise<GetPaymentInstructionsResponse> Payment instructions
 */
export const getPaymentInstructions = async (
  methodCode: string,
  language: 'en' | 'bn' = 'en'
): Promise<GetPaymentInstructionsResponse> => {
  try {
    const response = await apiClient.get<GetPaymentInstructionsResponse>(
      `/local-payment/instructions/${methodCode}?language=${language}`,
      { unwrapResponse: false }
    );
    return response;
  } catch (error) {
    console.error('[Local Payment API] Error getting payment instructions:', error);
    throw error;
  }
};

/**
 * Get SMS subscription for a user
 * @param userId - The user ID
 * @returns Promise<GetSmsSubscriptionResponse> SMS subscription details
 */
export const getSmsSubscription = async (userId: string): Promise<GetSmsSubscriptionResponse> => {
  try {
    const response = await apiClient.get<GetSmsSubscriptionResponse>(
      `/local-payment/sms-subscription/${userId}`,
      { unwrapResponse: false }
    );
    return response;
  } catch (error) {
    console.error('[Local Payment API] Error getting SMS subscription:', error);
    throw error;
  }
};

/**
 * Create SMS subscription for premium features
 * @param userId - The user ID
 * @param phoneNumber - Phone number
 * @param paymentMethod - Payment method code
 * @returns Promise<CreateSmsSubscriptionResponse> Created subscription details
 */
export const createSmsSubscription = async (
  userId: string,
  phoneNumber: string,
  paymentMethod: string
): Promise<CreateSmsSubscriptionResponse> => {
  try {
    const response = await apiClient.post<CreateSmsSubscriptionResponse>(
      '/local-payment/sms-subscription',
      { userId, phoneNumber, paymentMethod },
      { unwrapResponse: false }
    );
    return response;
  } catch (error) {
    console.error('[Local Payment API] Error creating SMS subscription:', error);
    throw error;
  }
};

/**
 * Update SMS subscription
 * @param subscriptionId - The subscription ID
 * @param data - Update data
 * @returns Promise<UpdateSmsSubscriptionResponse> Updated subscription details
 */
export const updateSmsSubscription = async (
  subscriptionId: string,
  data: UpdateSmsSubscriptionRequest
): Promise<UpdateSmsSubscriptionResponse> => {
  try {
    const response = await apiClient.put<UpdateSmsSubscriptionResponse>(
      `/local-payment/sms-subscription/${subscriptionId}`,
      data,
      { unwrapResponse: false }
    );
    return response;
  } catch (error) {
    console.error('[Local Payment API] Error updating SMS subscription:', error);
    throw error;
  }
};

/**
 * Cancel SMS subscription
 * @param subscriptionId - The subscription ID
 * @returns Promise<CancelSmsSubscriptionResponse> Cancelled subscription details
 */
export const cancelSmsSubscription = async (
  subscriptionId: string
): Promise<CancelSmsSubscriptionResponse> => {
  try {
    const response = await apiClient.delete<CancelSmsSubscriptionResponse>(
      `/local-payment/sms-subscription/${subscriptionId}`,
      { unwrapResponse: false }
    );
    return response;
  } catch (error) {
    console.error('[Local Payment API] Error cancelling SMS subscription:', error);
    throw error;
  }
};

/**
 * Get local payment configuration (for frontend display)
 * @returns Promise<GetLocalPaymentConfigurationResponse> Local payment configuration
 */
export const getLocalPaymentConfiguration = async (): Promise<GetLocalPaymentConfigurationResponse> => {
  try {
    const response = await apiClient.get<GetLocalPaymentConfigurationResponse>(
      '/local-payment/configuration',
      { unwrapResponse: false }
    );
    return response;
  } catch (error) {
    console.error('[Local Payment API] Error getting local payment configuration:', error);
    throw error;
  }
};

/**
 * Get available payment methods for a given amount
 * @param amount - The amount to check
 * @returns Promise<LocalPaymentMethod[]> List of eligible payment methods
 */
export const getAvailablePaymentMethods = async (
  amount: number
): Promise<LocalPaymentMethod[]> => {
  try {
    const methodsResponse = await getLocalPaymentMethods();
    const methods = methodsResponse.data;

    // Filter methods that support the amount
    const availableMethods = methods.filter(method => 
      amount >= method.minAmount && amount <= method.maxAmount && method.isActive
    );

    return availableMethods;
  } catch (error) {
    console.error('[Local Payment API] Error getting available payment methods:', error);
    throw error;
  }
};

/**
 * Calculate total payment amount including fee
 * @param amount - The base amount
 * @param methodCode - The payment method code
 * @returns Promise<number> Total amount including fee
 */
export const calculateTotalPayment = async (
  amount: number,
  methodCode: string
): Promise<number> => {
  try {
    const feeResponse = await calculatePaymentFee(amount, methodCode);
    return feeResponse.data.totalAmount;
  } catch (error) {
    console.error('[Local Payment API] Error calculating total payment:', error);
    throw error;
  }
};

/**
 * Check if amount is eligible for local payment
 * @param amount - The amount to check
 * @param methodCode - Optional payment method code
 * @returns Promise<PaymentValidationResult> Validation result
 */
export const checkPaymentEligibility = async (
  amount: number,
  methodCode?: string
): Promise<PaymentValidationResult> => {
  try {
    if (methodCode) {
      const response = await validatePaymentMethod(methodCode, amount);
      return response.data;
    }

    // Check against all methods if no specific method provided
    const methods = await getAvailablePaymentMethods(amount);
    return {
      valid: methods.length > 0,
      reason: methods.length === 0 ? 'No payment methods available for this amount' : null,
      paymentMethod: methods.length > 0 ? {
        code: methods[0].code,
        name: methods[0].name,
        displayName: methods[0].displayName,
        minAmount: methods[0].minAmount,
        maxAmount: methods[0].maxAmount,
        requiresPhone: methods[0].requiresPhone,
        requiresPin: methods[0].requiresPin,
        supportedNetworks: methods[0].supportedNetworks
      } : {
        code: '',
        name: '',
        displayName: '',
        minAmount: 0,
        maxAmount: 0,
        requiresPhone: false,
        requiresPin: false,
        supportedNetworks: []
      }
    };
  } catch (error) {
    console.error('[Local Payment API] Error checking payment eligibility:', error);
    throw error;
  }
};

export default {
  getLocalPaymentMethods,
  getPaymentMethodByCode,
  calculatePaymentFee,
  validatePaymentMethod,
  processLocalPayment,
  getPaymentInstructions,
  getSmsSubscription,
  createSmsSubscription,
  updateSmsSubscription,
  cancelSmsSubscription,
  getLocalPaymentConfiguration,
  getAvailablePaymentMethods,
  calculateTotalPayment,
  checkPaymentEligibility
};
