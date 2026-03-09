/**
 * bKash Payment Gateway Service
 * 
 * This service handles all interactions with the bKash payment gateway
 * for mobile wallet payments in Bangladesh.
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
 * bKash Service Configuration
 */
export interface BkashConfig extends GatewayConfig {
  apiKey: string;
  apiSecret: string;
  username: string;
  password: string;
  baseUrl: string;
}

/**
 * bKash Token Response
 */
interface BkashTokenResponse {
  id_token?: string;
  token_type?: string;
  expires_in?: number;
  refresh_token?: string;
  statusCode?: string;
  statusMessage?: string;
}

/**
 * bKash Create Payment Response
 */
interface BkashCreatePaymentResponse {
  paymentID?: string;
  paymentCreateTime?: string;
  transactionStatus?: string;
  amount?: string;
  currency?: string;
  intent?: string;
  merchantInvoiceNumber?: string;
  statusCode?: string;
  statusMessage?: string;
}

/**
 * bKash Execute Payment Response
 */
interface BkashExecutePaymentResponse {
  paymentID?: string;
  transactionStatus?: string;
  amount?: string;
  currency?: string;
  merchantInvoiceNumber?: string;
  payerReference?: string;
  paymentTime?: string;
  customerMsisdn?: string;
  statusCode?: string;
  statusMessage?: string;
}

/**
 * bKash Query Payment Response
 */
interface BkashQueryPaymentResponse {
  paymentID?: string;
  transactionStatus?: string;
  amount?: string;
  currency?: string;
  intent?: string;
  merchantInvoiceNumber?: string;
  payerReference?: string;
  paymentCreateTime?: string;
  paymentExecuteTime?: string;
  customerMsisdn?: string;
  statusCode?: string;
  statusMessage?: string;
}

/**
 * bKash Refund Response
 */
interface BkashRefundResponse {
  transactionId?: string;
  amount?: string;
  currency?: string;
  transactionStatus?: string;
  refundTransactionId?: string;
  completedTime?: string;
  statusCode?: string;
  statusMessage?: string;
}

/**
 * bKash Service Class
 */
export class BkashService implements PaymentGateway {
  name = 'bKash';
  type = 'MOBILE_WALLET' as const;
  
  private apiClient: AxiosInstance;
  private config: BkashConfig;
  private accessToken: string | null = null;
  private tokenExpiry: number = 0;

  constructor(config: BkashConfig) {
    this.config = config;
    
    this.apiClient = axios.create({
      baseURL: config.baseUrl,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });
  }

  /**
   * Get OAuth access token
   * @returns Access token
   */
  async getAccessToken(): Promise<string> {
    try {
      // Check if token is still valid
      if (this.accessToken && Date.now() < this.tokenExpiry) {
        return this.accessToken;
      }

      // Generate app key and app secret
      const appKey = this.config.apiKey;
      const appSecret = this.config.apiSecret;
      const authString = Buffer.from(`${appKey}:${appSecret}`).toString('base64');

      // Request token
      const response = await this.apiClient.post<BkashTokenResponse>(
        '/tokenized/checkout/token/grant',
        {
          app_key: appKey,
          app_secret: appSecret
        },
        {
          headers: {
            'Authorization': `Basic ${authString}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.data.id_token) {
        throw new PaymentGatewayError(
          response.data.statusMessage || 'Failed to get access token',
          PaymentErrorType.AUTHENTICATION_FAILED,
          401,
          response.data
        );
      }

      // Store token and expiry
      this.accessToken = response.data.id_token;
      this.tokenExpiry = Date.now() + ((response.data.expires_in || 3600) * 1000);

      return this.accessToken;
    } catch (error) {
      if (error instanceof PaymentGatewayError) {
        throw error;
      }

      if (axios.isAxiosError(error)) {
        throw new PaymentGatewayError(
          'Network error while getting access token',
          PaymentErrorType.NETWORK_ERROR,
          503,
          error.response?.data
        );
      }

      throw new PaymentGatewayError(
        'Failed to get access token',
        PaymentErrorType.AUTHENTICATION_FAILED,
        500
      );
    }
  }

  /**
   * Create bKash payment
   * @param order - The order to process payment for
   * @returns Payment initiation result
   */
  async initiatePayment(order: Order): Promise<PaymentInitiationResult> {
    try {
      // Validate order
      this.validateOrder(order);

      // Get access token
      const token = await this.getAccessToken();

      // Generate transaction ID
      const transactionId = this.generateTransactionId(order);

      // Prepare payment request
      const paymentRequest = {
        mode: '0011',
        payerReference: this.getCustomerPhone(order),
        callbackURL: `${this.config.webhookUrl}/bkash/callback`,
        amount: order.total.toString(),
        currency: order.currency,
        intent: 'sale',
        merchantInvoiceNumber: order.orderNumber,
        merchantAssociationInfo: `Order_${order.id}`
      };

      // Make API request
      const response = await this.apiClient.post<BkashCreatePaymentResponse>(
        '/tokenized/checkout/create',
        paymentRequest,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'X-APP-Key': this.config.apiKey
          }
        }
      );

      if (!response.data.paymentID || response.data.transactionStatus === 'InitiationFailed') {
        throw new PaymentGatewayError(
          response.data.statusMessage || 'Payment creation failed',
          PaymentErrorType.INITIATION_FAILED,
          400,
          response.data
        );
      }

      return {
        success: true,
        transactionId: response.data.paymentID,
        paymentUrl: `bkash://payment?paymentID=${response.data.paymentID}`,
        gatewayResponse: response.data
      };
    } catch (error) {
      if (error instanceof PaymentGatewayError) {
        throw error;
      }

      if (axios.isAxiosError(error)) {
        throw new PaymentGatewayError(
          'Network error while creating payment',
          PaymentErrorType.NETWORK_ERROR,
          503,
          error.response?.data
        );
      }

      throw new PaymentGatewayError(
        'Failed to create payment',
        PaymentErrorType.INITIATION_FAILED,
        500
      );
    }
  }

  /**
   * Execute payment after user authorization
   * @param paymentId - The payment ID
   * @returns Payment execution result
   */
  async executePayment(paymentId: string): Promise<PaymentInitiationResult> {
    try {
      // Get access token
      const token = await this.getAccessToken();

      // Prepare execution request
      const executeRequest = {
        paymentID: paymentId,
        walletType: 'bKash'
      };

      // Make API request
      const response = await this.apiClient.post<BkashExecutePaymentResponse>(
        '/tokenized/checkout/execute',
        executeRequest,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'X-APP-Key': this.config.apiKey
          }
        }
      );

      if (response.data.transactionStatus === 'InitiationFailed' || 
          response.data.transactionStatus === 'TransactionFailed') {
        throw new PaymentGatewayError(
          response.data.statusMessage || 'Payment execution failed',
          PaymentErrorType.INITIATION_FAILED,
          400,
          response.data
        );
      }

      return {
        success: true,
        transactionId: paymentId,
        gatewayResponse: response.data
      };
    } catch (error) {
      if (error instanceof PaymentGatewayError) {
        throw error;
      }

      if (axios.isAxiosError(error)) {
        throw new PaymentGatewayError(
          'Network error while executing payment',
          PaymentErrorType.NETWORK_ERROR,
          503,
          error.response?.data
        );
      }

      throw new PaymentGatewayError(
        'Failed to execute payment',
        PaymentErrorType.INITIATION_FAILED,
        500
      );
    }
  }

  /**
   * Query payment status
   * @param paymentId - The payment ID
   * @returns Payment status
   */
  async queryPayment(paymentId: string): Promise<PaymentStatus> {
    try {
      // Get access token
      const token = await this.getAccessToken();

      // Prepare query request
      const queryRequest = {
        paymentID: paymentId
      };

      // Make API request
      const response = await this.apiClient.post<BkashQueryPaymentResponse>(
        '/tokenized/checkout/payment/status',
        queryRequest,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'X-APP-Key': this.config.apiKey
          }
        }
      );

      return this.mapGatewayStatus(response.data.transactionStatus || 'Initiated');
    } catch (error) {
      if (error instanceof PaymentGatewayError) {
        throw error;
      }

      if (axios.isAxiosError(error)) {
        throw new PaymentGatewayError(
          'Network error while querying payment',
          PaymentErrorType.NETWORK_ERROR,
          503,
          error.response?.data
        );
      }

      throw new PaymentGatewayError(
        'Failed to query payment',
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
      // Get access token
      const token = await this.getAccessToken();

      // Prepare query request
      const queryRequest = {
        paymentID: transactionId
      };

      // Make API request
      const response = await this.apiClient.post<BkashQueryPaymentResponse>(
        '/tokenized/checkout/payment/status',
        queryRequest,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'X-APP-Key': this.config.apiKey
          }
        }
      );

      const status = this.mapGatewayStatus(response.data.transactionStatus || 'Initiated');

      return {
        success: status === 'completed',
        status,
        amount: parseFloat(response.data.amount || '0'),
        currency: response.data.currency || 'BDT',
        customerInfo: {
          name: 'bKash User',
          phone: response.data.customerMsisdn
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

      // Get access token
      const token = await this.getAccessToken();

      // Prepare refund request
      const refundRequest = {
        paymentID: transactionId,
        amount: amount.toString(),
        currency: 'BDT',
        reason: 'Customer request',
        sku: 'refund'
      };

      // Make API request
      const response = await this.apiClient.post<BkashRefundResponse>(
        '/tokenized/checkout/refund',
        refundRequest,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'X-APP-Key': this.config.apiKey
          }
        }
      );

      if (response.data.transactionStatus === 'RefundFailed') {
        throw new PaymentGatewayError(
          response.data.statusMessage || 'Refund failed',
          PaymentErrorType.REFUND_FAILED,
          400,
          response.data
        );
      }

      return {
        success: true,
        refundId: response.data.refundTransactionId,
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
   * Handle callback from bKash
   * @param response - Callback response from bKash
   * @returns Callback handling result
   */
  async handleCallback(response: CallbackResponse): Promise<CallbackResult> {
    try {
      // Validate callback
      if (!response.paymentID) {
        throw new PaymentGatewayError(
          'Invalid callback data: missing payment ID',
          PaymentErrorType.CALLBACK_FAILED,
          400
        );
      }

      // Query payment status
      const status = await this.queryPayment(response.paymentID);

      return {
        success: status === 'completed',
        transactionId: response.paymentID,
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
    return `BKASH_${order.orderNumber}_${timestamp}_${random}`;
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
   * Get customer phone from order
   * @param order - The order
   * @returns Customer phone
   */
  private getCustomerPhone(order: Order): string {
    // This would typically come from the order's address
    return '01700000000'; // Placeholder
  }

  /**
   * Map gateway status to PaymentStatus enum
   * @param gatewayStatus - bKash status
   * @returns PaymentStatus
   */
  private mapGatewayStatus(gatewayStatus: string): PaymentStatus {
    const statusMap: Record<string, PaymentStatus> = {
      'Completed': 'completed',
      'Authorized': 'processing',
      'Pending': 'pending',
      'Initiated': 'pending',
      'InitiationFailed': 'failed',
      'TransactionFailed': 'failed',
      'Cancelled': 'cancelled',
      'Refunded': 'refunded'
    };

    return statusMap[gatewayStatus] || 'pending';
  }

  /**
   * Verify callback signature
   * @param data - Callback data
   * @returns Whether signature is valid
   */
  private verifyCallbackSignature(data: any): boolean {
    // Implement signature verification if required by bKash
    // This would verify that the callback is actually from bKash
    return true;
  }
}

/**
 * Create bKash service instance
 * @param config - bKash configuration
 * @returns bKash service instance
 */
export function createBkashService(config: BkashConfig): BkashService {
  return new BkashService(config);
}
