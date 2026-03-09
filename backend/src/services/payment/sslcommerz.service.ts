/**
 * SSLCommerz Payment Gateway Service
 * 
 * This service handles all interactions with the SSLCommerz payment gateway
 * for card payments in Bangladesh.
 */

import axios, { AxiosInstance } from 'axios';
import crypto from 'crypto';
import { PaymentStatus } from '@prisma/client';
import {
  PaymentGateway,
  Order,
  PaymentInitiationResult,
  PaymentVerificationResult,
  RefundResult,
  CallbackResult,
  CallbackResponse,
  GatewayConfig,
  PaymentErrorType,
  PaymentGatewayError,
  PaymentEventType
} from './payment-gateway.interface';

/**
 * SSLCommerz Service Configuration
 */
export interface SSLCommerzConfig extends GatewayConfig {
  storeId: string;
  storePassword: string;
  isLive: boolean;
}

/**
 * SSLCommerz API Response
 */
interface SSLCommerzApiResponse {
  status?: string;
  sessionkey?: string;
  GatewayPageURL?: string;
  failedreason?: string;
  tran_id?: string;
  val_id?: string;
  amount?: string;
  currency?: string;
  card_type?: string;
  card_no?: string;
  bank_tran_id?: string;
  tran_date?: string;
  error?: string;
}

/**
 * SSLCommerz Service Class
 */
export class SSLCommerzService implements PaymentGateway {
  name = 'SSLCommerz';
  type = 'CARD' as const;
  
  private apiClient: AxiosInstance;
  private config: SSLCommerzConfig;
  private baseUrl: string;

  constructor(config: SSLCommerzConfig) {
    this.config = config;
    this.baseUrl = config.isLive 
      ? 'https://securepay.sslcommerz.com' 
      : 'https://sandbox.sslcommerz.com';
    
    this.apiClient = axios.create({
      baseURL: this.baseUrl,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });
  }

  /**
   * Initialize SSLCommerz payment
   * @param order - The order to process payment for
   * @returns Payment initiation result
   */
  async initiatePayment(order: Order): Promise<PaymentInitiationResult> {
    try {
      // Validate order
      this.validateOrder(order);

      // Generate transaction ID
      const transactionId = this.generateTransactionId(order);

      // Prepare payment request
      const paymentRequest = {
        store_id: this.config.storeId,
        store_passwd: this.config.storePassword,
        total_amount: order.total.toString(),
        currency: order.currency,
        tran_id: transactionId,
        success_url: `${this.config.returnUrl}/sslcommerz/success`,
        fail_url: `${this.config.returnUrl}/sslcommerz/fail`,
        cancel_url: `${this.config.returnUrl}/sslcommerz/cancel`,
        ipn_url: `${this.config.webhookUrl}/sslcommerz/ipn`,
        cus_name: this.getCustomerName(order),
        cus_email: this.getCustomerEmail(order),
        cus_phone: this.getCustomerPhone(order),
        cus_add1: this.getCustomerAddress(order),
        cus_city: this.getCustomerCity(order),
        cus_country: 'Bangladesh',
        shipping_method: 'NO',
        product_name: `Order ${order.orderNumber}`,
        product_category: 'E-commerce',
        product_profile: 'general',
        multi_card_name: '',
        value_a: order.id,
        value_b: order.orderNumber,
        value_c: order.userId || 'guest',
        value_d: order.addressId
      };

      // Make API request
      const response = await this.apiClient.post<SSLCommerzApiResponse>(
        '/gwprocess/v4/api.php',
        new URLSearchParams(paymentRequest as any).toString()
      );

      // Handle response
      if (response.data.status === 'FAILED' || response.data.failedreason) {
        throw new PaymentGatewayError(
          response.data.failedreason || 'Payment initiation failed',
          PaymentErrorType.INITIATION_FAILED,
          400,
          response.data
        );
      }

      if (!response.data.GatewayPageURL) {
        throw new PaymentGatewayError(
          'Payment URL not received from gateway',
          PaymentErrorType.GATEWAY_ERROR,
          500,
          response.data
        );
      }

      return {
        success: true,
        transactionId,
        paymentUrl: response.data.GatewayPageURL,
        gatewayResponse: response.data
      };
    } catch (error) {
      if (error instanceof PaymentGatewayError) {
        throw error;
      }

      if (axios.isAxiosError(error)) {
        throw new PaymentGatewayError(
          'Network error while initiating payment',
          PaymentErrorType.NETWORK_ERROR,
          503,
          error.response?.data
        );
      }

      throw new PaymentGatewayError(
        'Failed to initiate payment',
        PaymentErrorType.INITIATION_FAILED,
        500
      );
    }
  }

  /**
   * Validate payment via IPN
   * @param valId - The validation ID from SSLCommerz
   * @returns Payment status
   */
  async validatePayment(valId: string): Promise<PaymentStatus> {
    try {
      const validationRequest = {
        store_id: this.config.storeId,
        store_passwd: this.config.storePassword,
        val_id: valId,
        format: 'json'
      };

      const response = await this.apiClient.post<SSLCommerzApiResponse>(
        '/gwprocess/v4/api.php',
        new URLSearchParams(validationRequest as any).toString()
      );

      if (!response.data || response.data.status === 'FAILED') {
        throw new PaymentGatewayError(
          response.data?.failedreason || 'Payment validation failed',
          PaymentErrorType.VERIFICATION_FAILED,
          400,
          response.data
        );
      }

      return this.mapGatewayStatus(response.data.status || 'PENDING');
    } catch (error) {
      if (error instanceof PaymentGatewayError) {
        throw error;
      }

      if (axios.isAxiosError(error)) {
        throw new PaymentGatewayError(
          'Network error while validating payment',
          PaymentErrorType.NETWORK_ERROR,
          503,
          error.response?.data
        );
      }

      throw new PaymentGatewayError(
        'Failed to validate payment',
        PaymentErrorType.VERIFICATION_FAILED,
        500
      );
    }
  }

  /**
   * Verify a payment
   * @param transactionId - The transaction ID to verify
   * @returns Payment verification result
   */
  async verifyPayment(transactionId: string): Promise<PaymentVerificationResult> {
    try {
      const validationRequest = {
        store_id: this.config.storeId,
        store_passwd: this.config.storePassword,
        tran_id: transactionId,
        format: 'json'
      };

      const response = await this.apiClient.post<SSLCommerzApiResponse>(
        '/gwprocess/v4/api.php',
        new URLSearchParams(validationRequest as any).toString()
      );

      if (!response.data || response.data.status === 'FAILED') {
        return {
          success: false,
          status: 'failed',
          amount: 0,
          currency: 'BDT',
          gatewayResponse: response.data
        };
      }

      return {
        success: true,
        status: this.mapGatewayStatus(response.data.status || 'PENDING'),
        amount: parseFloat(response.data.amount || '0'),
        currency: response.data.currency || 'BDT',
        customerInfo: {
          name: this.getCustomerNameFromResponse(response.data),
          email: this.getCustomerEmailFromResponse(response.data),
          phone: this.getCustomerPhoneFromResponse(response.data)
        },
        gatewayResponse: response.data
      };
    } catch (error) {
      if (error instanceof PaymentGatewayError) {
        throw error;
      }

      if (axios.isAxiosError(error)) {
        throw new PaymentGatewayError(
          'Network error while verifying payment',
          PaymentErrorType.NETWORK_ERROR,
          503,
          error.response?.data
        );
      }

      throw new PaymentGatewayError(
        'Failed to verify payment',
        PaymentErrorType.VERIFICATION_FAILED,
        500
      );
    }
  }

  /**
   * Process refund
   * @param transactionId - The transaction ID to refund
   * @param amount - The amount to refund
   * @returns Refund result
   */
  async refundPayment(transactionId: string, amount: number): Promise<RefundResult> {
    try {
      if (amount <= 0) {
        throw new PaymentGatewayError(
          'Refund amount must be greater than 0',
          PaymentErrorType.INVALID_REQUEST,
          400
        );
      }

      const refundRequest = {
        store_id: this.config.storeId,
        store_passwd: this.config.storePassword,
        refund_amount: amount.toString(),
        refund_remarks: `Refund for transaction ${transactionId}`,
        tran_id: transactionId,
        bank_tran_id: '',
        refund_reason: 'Customer request'
      };

      const response = await this.apiClient.post<SSLCommerzApiResponse>(
        '/gwprocess/v4/api.php',
        new URLSearchParams(refundRequest as any).toString()
      );

      if (response.data.status === 'FAILED') {
        throw new PaymentGatewayError(
          response.data.failedreason || 'Refund failed',
          PaymentErrorType.REFUND_FAILED,
          400,
          response.data
        );
      }

      return {
        success: true,
        refundId: response.data.tran_id,
        amount,
        currency: 'BDT',
        gatewayResponse: response.data
      };
    } catch (error) {
      if (error instanceof PaymentGatewayError) {
        throw error;
      }

      if (axios.isAxiosError(error)) {
        throw new PaymentGatewayError(
          'Network error while processing refund',
          PaymentErrorType.NETWORK_ERROR,
          503,
          error.response?.data
        );
      }

      throw new PaymentGatewayError(
        'Failed to process refund',
        PaymentErrorType.REFUND_FAILED,
        500
      );
    }
  }

  /**
   * Handle callback from SSLCommerz
   * @param response - Callback response from SSLCommerz
   * @returns Callback handling result
   */
  async handleCallback(response: CallbackResponse): Promise<CallbackResult> {
    try {
      // Validate callback
      if (!response.val_id || !response.tran_id) {
        throw new PaymentGatewayError(
          'Invalid callback data',
          PaymentErrorType.CALLBACK_FAILED,
          400
        );
      }

      // Verify payment status
      const status = await this.validatePayment(response.val_id);

      return {
        success: status === 'completed',
        transactionId: response.tran_id,
        status,
        gatewayResponse: response
      };
    } catch (error) {
      if (error instanceof PaymentGatewayError) {
        throw error;
      }

      throw new PaymentGatewayError(
        'Failed to handle callback',
        PaymentErrorType.CALLBACK_FAILED,
        500
      );
    }
  }

  /**
   * Generate transaction ID
   * @param order - The order
   * @returns Transaction ID
   */
  private generateTransactionId(order: Order): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    return `SSL_${order.orderNumber}_${timestamp}_${random}`;
  }

  /**
   * Validate order
   * @param order - The order to validate
   * @throws PaymentGatewayError if validation fails
   */
  private validateOrder(order: Order): void {
    if (!order.id || !order.orderNumber) {
      throw new PaymentGatewayError(
        'Invalid order: missing ID or order number',
        PaymentErrorType.INVALID_REQUEST,
        400
      );
    }

    if (order.total <= 0) {
      throw new PaymentGatewayError(
        'Invalid order: total amount must be greater than 0',
        PaymentErrorType.INVALID_REQUEST,
        400
      );
    }

    if (!order.currency) {
      throw new PaymentGatewayError(
        'Invalid order: currency is required',
        PaymentErrorType.INVALID_REQUEST,
        400
      );
    }
  }

  /**
   * Get customer name from order
   * @param order - The order
   * @returns Customer name
   */
  private getCustomerName(order: Order): string {
    // This would typically come from the order's user or address
    return 'Customer'; // Placeholder - should be implemented based on actual order structure
  }

  /**
   * Get customer email from order
   * @param order - The order
   * @returns Customer email
   */
  private getCustomerEmail(order: Order): string {
    // This would typically come from the order's user
    return 'customer@example.com'; // Placeholder
  }

  /**
   * Get customer phone from order
   * @param order - The order
   * @returns Customer phone
   */
  private getCustomerPhone(order: Order): string {
    // This would typically come from the order's address
    return '01700000000'; // Placeholder
  }

  /**
   * Get customer address from order
   * @param order - The order
   * @returns Customer address
   */
  private getCustomerAddress(order: Order): string {
    // This would typically come from the order's address
    return 'Dhaka, Bangladesh'; // Placeholder
  }

  /**
   * Get customer city from order
   * @param order - The order
   * @returns Customer city
   */
  private getCustomerCity(order: Order): string {
    // This would typically come from the order's address
    return 'Dhaka'; // Placeholder
  }

  /**
   * Get customer name from SSLCommerz response
   * @param response - SSLCommerz API response
   * @returns Customer name
   */
  private getCustomerNameFromResponse(response: SSLCommerzApiResponse): string {
    return 'Customer'; // Would be extracted from response if available
  }

  /**
   * Get customer email from SSLCommerz response
   * @param response - SSLCommerz API response
   * @returns Customer email
   */
  private getCustomerEmailFromResponse(response: SSLCommerzApiResponse): string {
    return ''; // Would be extracted from response if available
  }

  /**
   * Get customer phone from SSLCommerz response
   * @param response - SSLCommerz API response
   * @returns Customer phone
   */
  private getCustomerPhoneFromResponse(response: SSLCommerzApiResponse): string {
    return ''; // Would be extracted from response if available
  }

  /**
   * Map gateway status to PaymentStatus enum
   * @param gatewayStatus - SSLCommerz status
   * @returns PaymentStatus
   */
  private mapGatewayStatus(gatewayStatus: string): PaymentStatus {
    const statusMap: Record<string, PaymentStatus> = {
      'VALID': 'completed',
      'VALIDATED': 'completed',
      'PENDING': 'pending',
      'FAILED': 'failed',
      'CANCELLED': 'cancelled'
    };

    return statusMap[gatewayStatus] || 'pending';
  }

  /**
   * Verify IPN signature
   * @param data - IPN data
   * @returns Whether signature is valid
   */
  private verifyIPNSignature(data: any): boolean {
    // Implement signature verification if required by SSLCommerz
    // This would verify that the IPN is actually from SSLCommerz
    return true;
  }
}

/**
 * Create SSLCommerz service instance
 * @param config - SSLCommerz configuration
 * @returns SSLCommerz service instance
 */
export function createSSLCommerzService(config: SSLCommerzConfig): SSLCommerzService {
  return new SSLCommerzService(config);
}
