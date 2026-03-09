/**
 * Payment Method Types for Checkout Flow
 * Phase 7 Milestone 2: Payment Gateway Integration
 */

export enum PaymentMethod {
  CREDIT_CARD = 'CREDIT_CARD',
  BKASH = 'BKASH',
  NAGAD = 'NAGAD',
  ROCKET = 'ROCKET',
  CASH_ON_DELIVERY = 'CASH_ON_DELIVERY',
  BANK_TRANSFER = 'BANK_TRANSFER',
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
  REFUNDED = 'REFUNDED',
}

export enum PaymentGateway {
  SSLCOMMERZ = 'SSLCOMMERZ',
  BKASH = 'BKASH',
  NAGAD = 'NAGAD',
  ROCKET = 'ROCKET',
}

export interface PaymentMethodOption {
  method: PaymentMethod;
  name: string;
  description: string;
  icon: string;
  isActive: boolean;
  isAvailable: boolean;
  fee?: number;
  processingTime?: string;
  features?: string[];
}

export interface PaymentMethodSelectionProps {
  orderId: string;
  amount: number;
  onMethodSelect: (method: PaymentMethod) => void;
  selectedMethod?: PaymentMethod;
}

export interface PaymentInitiationRequest {
  orderId: string;
  paymentMethod: PaymentMethod;
  amount?: number;
  currency?: string;
  returnUrl?: string;
  cancelUrl?: string;
  ipnUrl?: string;
}

export interface PaymentInitiationResponse {
  success: boolean;
  paymentUrl?: string;
  transactionId?: string;
  gatewayTransactionId?: string;
  message?: string;
  error?: string;
}

export interface PaymentStatusResponse {
  orderId: string;
  transactionId: string;
  status: PaymentStatus;
  amount: number;
  currency: string;
  paymentMethod: PaymentMethod;
  gateway: PaymentGateway;
  gatewayTransactionId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PaymentMethodCardProps {
  method: PaymentMethodOption;
  isSelected: boolean;
  onSelect: () => void;
  disabled?: boolean;
  loading?: boolean;
  error?: string;
}

export interface PaymentContextType {
  selectedMethod: PaymentMethod | null;
  setSelectedMethod: (method: PaymentMethod | null) => void;
  orderId: string | null;
  setOrderId: (orderId: string | null) => void;
  amount: number;
  setAmount: (amount: number) => void;
  initiatePayment: () => Promise<void>;
  isLoading: boolean;
  error: string | null;
  clearError: () => void;
}

export interface AvailablePaymentMethodsResponse {
  methods: PaymentMethodOption[];
  defaultMethod?: PaymentMethod;
  currency: string;
}

/**
 * Gateway-Specific Payment Types
 * Phase 7 Milestone 2: Payment Gateway Integration
 */

/**
 * Card Payment Types for SSLCommerz
 */
export interface CardData {
  cardNumber: string;
  expiryDate: string;
  cvv: string;
  cardholderName: string;
}

export interface CardType {
  type: 'visa' | 'mastercard' | 'amex' | 'unknown';
  icon: string;
  name: string;
}

export interface CardValidationError {
  field: 'cardNumber' | 'expiryDate' | 'cvv' | 'cardholderName';
  message: string;
  isValid: boolean;
}

/**
 * bKash Payment Types
 */
export interface BkashPaymentData {
  walletNumber: string;
  amount: number;
}

export interface BkashPaymentRequest {
  orderId: string;
  walletNumber: string;
  amount: number;
  returnUrl?: string;
  cancelUrl?: string;
}

export interface BkashExecuteRequest {
  paymentId: string;
  pin: string;
}

/**
 * Nagad Payment Types
 */
export interface NagadPaymentData {
  walletNumber: string;
  amount: number;
}

export interface NagadPaymentRequest {
  orderId: string;
  walletNumber: string;
  amount: number;
  returnUrl?: string;
  cancelUrl?: string;
}

/**
 * Payment Gateway Props
 */
export interface PaymentGatewayProps {
  orderId: string;
  amount: number;
  onPaymentSuccess: (transactionId: string) => void;
  onPaymentError: (error: string) => void;
  onCancel: () => void;
  currency?: string;
}

/**
 * Payment Gateway State
 */
export interface PaymentGatewayState {
  isLoading: boolean;
  isProcessing: boolean;
  error: string | null;
  success: boolean;
  transactionId: string | null;
}

/**
 * SSLCommerz Payment Response
 */
export interface SSLCommerzInitiateResponse {
  success: boolean;
  paymentUrl?: string;
  gatewayTransactionId?: string;
  sessionkey?: string;
  message?: string;
  error?: string;
}

/**
 * bKash Payment Response
 */
export interface BkashCreateResponse {
  success: boolean;
  paymentId?: string;
  bkashURL?: string;
  callbackURL?: string;
  message?: string;
  error?: string;
}

export interface BkashExecuteResponse {
  success: boolean;
  transactionId?: string;
  amount?: number;
  currency?: string;
  message?: string;
  error?: string;
}

/**
 * Nagad Payment Response
 */
export interface NagadInitializeResponse {
  success: boolean;
  paymentRefId?: string;
  nagadURL?: string;
  callbackURL?: string;
  message?: string;
  error?: string;
}

export interface NagadVerifyResponse {
  success: boolean;
  transactionId?: string;
  status?: PaymentStatus;
  amount?: number;
  message?: string;
  error?: string;
}

/**
 * Payment Gateway API Response Types
 */
export interface GatewayApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  timestamp?: string;
}

/**
 * Payment Transaction Details
 */
export interface PaymentTransactionDetails {
  transactionId: string;
  orderId: string;
  gateway: PaymentGateway;
  amount: number;
  currency: string;
  status: PaymentStatus;
  gatewayTransactionId?: string;
  paymentMethod: PaymentMethod;
  createdAt: string;
  updatedAt: string;
  metadata?: Record<string, any>;
}
