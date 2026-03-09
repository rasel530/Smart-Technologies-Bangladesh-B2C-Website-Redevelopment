/**
 * Payment Gateway Interface
 * 
 * This file defines the common interface that all payment gateway services must implement.
 * It provides a unified API for interacting with different payment providers.
 */

import { PaymentMethod, PaymentStatus } from '@prisma/client';

/**
 * Order Interface
 */
export interface Order {
  id: string;
  orderNumber: string;
  total: number;
  currency: string;
  userId?: string;
  addressId: string;
  shippingMethod?: string;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  notes?: string;
  internalNotes?: string;
  paymentDetails?: any;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Payment Gateway Type
 */
export type GatewayType = 'CARD' | 'MOBILE_WALLET' | 'COD' | 'BANK_TRANSFER';

/**
 * Payment Gateway Interface
 */
export interface PaymentGateway {
  name: string;
  type: GatewayType;
  
  /**
   * Initiate a payment
   * @param order - The order to process payment for
   * @returns Payment initiation result with transaction ID and payment URL
   */
  initiatePayment(order: Order): Promise<PaymentInitiationResult>;
  
  /**
   * Verify a payment
   * @param transactionId - The transaction ID to verify
   * @returns Payment verification result
   */
  verifyPayment(transactionId: string): Promise<PaymentVerificationResult>;
  
  /**
   * Process a refund
   * @param transactionId - The transaction ID to refund
   * @param amount - The amount to refund
   * @returns Refund result
   */
  refundPayment(transactionId: string, amount: number): Promise<RefundResult>;
  
  /**
   * Handle callback from payment gateway
   * @param data - Callback data from the gateway
   * @returns Callback handling result
   */
  handleCallback(data: any): Promise<CallbackResult>;
}

/**
 * Payment Initiation Result
 */
export interface PaymentInitiationResult {
  success: boolean;
  transactionId: string;
  paymentUrl?: string;
  gatewayResponse: any;
  error?: string;
}

/**
 * Payment Verification Result
 */
export interface PaymentVerificationResult {
  success: boolean;
  status: PaymentStatus;
  amount: number;
  currency: string;
  customerInfo?: any;
  gatewayResponse: any;
}

/**
 * Refund Result
 */
export interface RefundResult {
  success: boolean;
  refundId?: string;
  amount: number;
  currency: string;
  gatewayResponse: any;
  error?: string;
}

/**
 * Callback Result
 */
export interface CallbackResult {
  success: boolean;
  transactionId: string;
  status: PaymentStatus;
  gatewayResponse: any;
  error?: string;
}

/**
 * Payment Status from Gateway
 */
export interface GatewayPaymentStatus {
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'CANCELLED' | 'REFUNDED';
  transactionId?: string;
  amount?: number;
  currency?: string;
  timestamp?: string;
}

/**
 * Customer Info
 */
export interface CustomerInfo {
  name: string;
  email?: string;
  phone?: string;
  address?: string;
}

/**
 * Payment Gateway Configuration
 */
export interface GatewayConfig {
  isActive: boolean;
  isTestMode: boolean;
  merchantId?: string;
  storeId?: string;
  apiKey?: string;
  apiSecret?: string;
  publicKey?: string;
  privateKey?: string;
  webhookUrl?: string;
  returnUrl?: string;
  config?: Record<string, any>;
}

/**
 * Payment Error Types
 */
export enum PaymentErrorType {
  INITIATION_FAILED = 'INITIATION_FAILED',
  VERIFICATION_FAILED = 'VERIFICATION_FAILED',
  REFUND_FAILED = 'REFUND_FAILED',
  CALLBACK_FAILED = 'CALLBACK_FAILED',
  NETWORK_ERROR = 'NETWORK_ERROR',
  INVALID_REQUEST = 'INVALID_REQUEST',
  GATEWAY_ERROR = 'GATEWAY_ERROR',
  AUTHENTICATION_FAILED = 'AUTHENTICATION_FAILED',
  INSUFFICIENT_FUNDS = 'INSUFFICIENT_FUNDS',
  TRANSACTION_NOT_FOUND = 'TRANSACTION_NOT_FOUND',
  FRAUD_DETECTION_FAILED = 'FRAUD_DETECTION_FAILED',
  BLOCK_USER_FAILED = 'BLOCK_USER_FAILED',
  UNBLOCK_USER_FAILED = 'UNBLOCK_USER_FAILED',
  ENCRYPTION_FAILED = 'ENCRYPTION_FAILED',
  DECRYPTION_FAILED = 'DECRYPTION_FAILED',
  TOKENIZATION_DISABLED = 'TOKENIZATION_DISABLED',
  TOKENIZATION_FAILED = 'TOKENIZATION_FAILED',
  INVALID_TOKEN = 'INVALID_TOKEN',
  DETOKENIZATION_FAILED = 'DETOKENIZATION_FAILED',
  TOKEN_GENERATION_FAILED = 'TOKEN_GENERATION_FAILED',
  HASHING_FAILED = 'HASHING_FAILED',
  INVALID_CARD_NUMBER = 'INVALID_CARD_NUMBER',
  INVALID_EXPIRY_DATE = 'INVALID_EXPIRY_DATE',
  CARD_EXPIRED = 'CARD_EXPIRED',
  INVALID_CVV = 'INVALID_CVV',
  SIGNATURE_GENERATION_FAILED = 'SIGNATURE_GENERATION_FAILED',
  RANDOM_GENERATION_FAILED = 'RANDOM_GENERATION_FAILED'
}

/**
 * Payment Error
 */
export class PaymentGatewayError extends Error {
  constructor(
    message: string,
    public type: PaymentErrorType,
    public statusCode: number = 500,
    public gatewayResponse?: any
  ) {
    super(message);
    this.name = 'PaymentGatewayError';
  }
}

/**
 * Callback Response Interface
 */
export interface CallbackResponse {
  transactionId?: string;
  paymentId?: string;
  status?: string;
  amount?: number;
  currency?: string;
  gatewayTransactionId?: string;
  merchantInvoiceNumber?: string;
  customerMsisdn?: string;
  failureReason?: string;
  [key: string]: any;
}

/**
 * Payment Event Types for Logging
 */
export enum PaymentEventType {
  INITIATION = 'PAYMENT_INITIATION',
  VERIFICATION = 'PAYMENT_VERIFICATION',
  CALLBACK = 'PAYMENT_CALLBACK',
  REFUND = 'PAYMENT_REFUND',
  SUCCESS = 'PAYMENT_SUCCESS',
  FAILURE = 'PAYMENT_FAILURE',
  CANCEL = 'PAYMENT_CANCEL'
}

/**
 * Security Event Types for Logging
 */
export enum SecurityEventType {
  FRAUD_DETECTED = 'FRAUD_DETECTED',
  HIGH_RISK_TRANSACTION = 'HIGH_RISK_TRANSACTION',
  VELOCITY_LIMIT_EXCEEDED = 'VELOCITY_LIMIT_EXCEEDED',
  SUSPICIOUS_IP = 'SUSPICIOUS_IP',
  SUSPICIOUS_AMOUNT = 'SUSPICIOUS_AMOUNT',
  SUSPICIOUS_TIME = 'SUSPICIOUS_TIME',
  BLOCKED_USER = 'BLOCKED_USER',
  UNBLOCKED_USER = 'UNBLOCKED_USER',
  WEBHOOK_SIGNATURE_INVALID = 'WEBHOOK_SIGNATURE_INVALID',
  PCI_DSS_VIOLATION = 'PCI_DSS_VIOLATION',
  ENCRYPTION_FAILED = 'ENCRYPTION_FAILED',
  DECRYPTION_FAILED = 'DECRYPTION_FAILED',
  TOKENIZATION_FAILED = 'TOKENIZATION_FAILED',
  SANITIZATION_ERROR = 'SANITIZATION_ERROR'
}
