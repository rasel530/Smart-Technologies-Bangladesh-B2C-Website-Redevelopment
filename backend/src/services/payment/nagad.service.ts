/**
 * Nagad Payment Gateway Service
 * 
 * This service handles all interactions with the Nagad payment gateway
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
 * Nagad Service Configuration
 */
export interface NagadConfig extends GatewayConfig {
  apiKey: string;
  apiSecret: string;
  merchantId: string;
  publicKey: string;
  privateKey: string;
  baseUrl: string;
}

/**
 * Nagad Create Payment Response
 */
interface NagadCreatePaymentResponse {
  paymentRefId?: string;
  url?: string;
  status?: string;
  message?: string;
  statusCode?: string;
}

/**
 * Nagad Verify Payment Response
 */
interface NagadVerifyPaymentResponse {
  paymentRefId?: string;
  orderNo?: string;
  amount?: string;
  currency?: string;
  status?: string;
  paymentTime?: string;
  issuerPaymentRefNo?: string;
  merchantRefNo?: string;
  statusCode?: string;
  message?: string;
}

/**
 * Nagad Refund Response
 */
interface NagadRefundResponse {
  refundRefId?: string;
  paymentRefId?: string;
  amount?: string;
  currency?: string;
  status?: string;
  refundTime?: string;
  statusCode?: string;
  message?: string;
}

/**
 * Nagad Service Class
 */
export class NagadService implements PaymentGateway {
  name = 'Nagad';
  type = 'MOBILE_WALLET' as const;
  
  private apiClient: AxiosInstance;
  private config: NagadConfig;

  constructor(config: NagadConfig) {
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
   * Create Nagad payment
   * @param order - The order to process payment for
   * @returns Payment initiation result
   */
  async initiatePayment(order: Order): Promise<PaymentInitiationResult> {
    try {
      // Validate order
      this.validateOrder(order);

      // Generate payment reference ID
      const paymentRefId = this.generatePaymentRefId(order);

      // Generate merchant invoice number
      const merchantInvoiceNumber = order.orderNumber;

      // Prepare payment request
      const paymentRequest = {
        merchantId: this.config.merchantId,
        merchantOrderId: order.id,
        dateTime: this.getCurrentDateTime(),
        amount: order.total.toString(),
        currency: order.currency,
        invoiceNo: merchantInvoiceNumber,
        paymentRefId: paymentRefId,
        merchantCallbackURL: `${this.config.webhookUrl}/nagad/callback`,
        additionalMerchantInfo: {
          orderInfo: `Order ${order.orderNumber}`,
          customerInfo: this.getCustomerInfo(order)
        }
      };

      // Sign the request
      const signature = this.signRequest(paymentRequest);

      // Make API request
      const response = await this.apiClient.post<NagadCreatePaymentResponse>(
        '/api/checkout/create',
        paymentRequest,
        {
          headers: {
            'X-KM-IPN-Verification': signature,
            'X-KM-Api-Version': 'v-4.0'
          }
        }
      );

      if (!response.data.url || response.data.status === 'FAILED') {
        throw new PaymentGatewayError(
          response.data.message || 'Payment creation failed',
          PaymentErrorType.INITIATION_FAILED,
          400,
          response.data
        );
      }

      return {
        success: true,
        transactionId: paymentRefId,
        paymentUrl: response.data.url,
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
   * Verify payment completion
   * @param paymentRefId - The payment reference ID
   * @returns Payment status
   */
  async verifyPayment(paymentRefId: string): Promise<PaymentVerificationResult> {
    try {
      // Prepare verification request
      const verifyRequest = {
        paymentRefId: paymentRefId,
        merchantId: this.config.merchantId
      };

      // Sign the request
      const signature = this.signRequest(verifyRequest);

      // Make API request
      const response = await this.apiClient.post<NagadVerifyPaymentResponse>(
        '/api/checkout/verify',
        verifyRequest,
        {
          headers: {
            'X-KM-IPN-Verification': signature,
            'X-KM-Api-Version': 'v-4.0'
          }
        }
      );

      const status = this.mapGatewayStatus(response.data.status || 'PENDING');

      return {
        success: status === 'completed',
        status,
        amount: parseFloat(response.data.amount || '0'),
        currency: response.data.currency || 'BDT',
        customerInfo: {
          name: 'Nagad User',
          phone: response.data.issuerPaymentRefNo
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

      // Generate refund reference ID
      const refundRefId = this.generateRefundRefId(transactionId);

      // Prepare refund request
      const refundRequest = {
        paymentRefId: transactionId,
        refundRefId: refundRefId,
        amount: amount.toString(),
        currency: 'BDT',
        reason: 'Customer request',
        merchantId: this.config.merchantId,
        dateTime: this.getCurrentDateTime()
      };

      // Sign the request
      const signature = this.signRequest(refundRequest);

      // Make API request
      const response = await this.apiClient.post<NagadRefundResponse>(
        '/api/checkout/refund',
        refundRequest,
        {
          headers: {
            'X-KM-IPN-Verification': signature,
            'X-KM-Api-Version': 'v-4.0'
          }
        }
      );

      if (response.data.status === 'FAILED') {
        throw new PaymentGatewayError(
          response.data.message || 'Refund failed',
          PaymentErrorType.REFUND_FAILED,
          400,
          response.data
        );
      }

      return {
        success: true,
        refundId: refundRefId,
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
   * Handle callback from Nagad
   * @param response - Callback response from Nagad
   * @returns Callback handling result
   */
  async handleCallback(response: CallbackResponse): Promise<CallbackResult> {
    try {
      // Validate callback
      if (!response.paymentRefId) {
        throw new PaymentGatewayError(
          'Invalid callback data: missing payment reference ID',
          PaymentErrorType.CALLBACK_FAILED,
          400
        );
      }

      // Verify payment status
      const verificationResult = await this.verifyPayment(response.paymentRefId);

      return {
        success: verificationResult.success,
        transactionId: response.paymentRefId,
        status: verificationResult.status,
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
   * Generate payment reference ID
   * @param order - The order
   * @returns Payment reference ID
   */
  private generatePaymentRefId(order: Order): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    return `NAGAD_${order.orderNumber}_${timestamp}_${random}`;
  }

  /**
   * Generate refund reference ID
   * @param transactionId - The transaction ID
   * @returns Refund reference ID
   */
  private generateRefundRefId(transactionId: string): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    return `REFUND_${transactionId}_${timestamp}_${random}`;
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
   * Get customer info from order
   * @param order - The order
   * @returns Customer info
   */
  private getCustomerInfo(order: Order): any {
    // This would typically come from the order's user or address
    return {
      name: 'Customer',
      phone: '01800000000',
      email: 'customer@example.com'
    };
  }

  /**
   * Get current date time in Nagad format
   * @returns Date time string
   */
  private getCurrentDateTime(): string {
    const now = new Date();
    return now.toISOString().replace('T', ' ').substring(0, 19);
  }

  /**
   * Sign request with private key
   * @param data - Request data
   * @returns Signature
   */
  private signRequest(data: any): string {
    try {
      // Convert data to string
      const dataString = JSON.stringify(data);

      // Create signature using private key
      const sign = crypto.createSign('SHA256');
      sign.update(dataString);
      sign.end();

      const signature = sign.sign(this.config.privateKey, 'base64');

      return signature;
    } catch (error) {
      throw new PaymentGatewayError(
        'Failed to sign request',
        PaymentErrorType.AUTHENTICATION_FAILED,
        500
      );
    }
  }

  /**
   * Verify callback signature
   * @param data - Callback data
   * @param signature - Signature to verify
   * @returns Whether signature is valid
   */
  private verifyCallbackSignature(data: any, signature: string): boolean {
    try {
      // Convert data to string
      const dataString = JSON.stringify(data);

      // Verify signature using public key
      const verify = crypto.createVerify('SHA256');
      verify.update(dataString);
      verify.end();

      const isValid = verify.verify(this.config.publicKey, signature, 'base64');

      return isValid;
    } catch (error) {
      return false;
    }
  }

  /**
   * Map gateway status to PaymentStatus enum
   * @param gatewayStatus - Nagad status
   * @returns PaymentStatus
   */
  private mapGatewayStatus(gatewayStatus: string): PaymentStatus {
    const statusMap: Record<string, PaymentStatus> = {
      'SUCCESS': 'completed',
      'COMPLETED': 'completed',
      'PENDING': 'pending',
      'PROCESSING': 'processing',
      'FAILED': 'failed',
      'CANCELLED': 'cancelled',
      'REFUNDED': 'refunded'
    };

    return statusMap[gatewayStatus] || 'pending';
  }
}

/**
 * Create Nagad service instance
 * @param config - Nagad configuration
 * @returns Nagad service instance
 */
export function createNagadService(config: NagadConfig): NagadService {
  return new NagadService(config);
}
