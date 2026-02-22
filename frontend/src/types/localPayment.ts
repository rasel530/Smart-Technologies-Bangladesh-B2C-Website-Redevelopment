/**
 * Local Payment Entity Type Definitions
 *
 * This file contains all TypeScript interfaces and types related to Bangladesh-specific
 * local payment methods (bKash, Nagad, Rocket, SureCash) and SMS subscriptions.
 */

/**
 * Local Payment Method Interface
 */
export interface LocalPaymentMethod {
  id: string;
  name: string;
  code: string; // e.g., 'bkash', 'nagad', 'rocket', 'surecash'
  displayName: string; // Display name in Bengali/English
  logoUrl?: string | null;
  isActive: boolean;
  minAmount: number;
  maxAmount: number;
  processingFee: number;
  processingFeePercent: number;
  requiresPhone: boolean;
  requiresPin: boolean;
  description?: string | null;
  instructions?: string | null; // JSON array of instructions
  supportedNetworks: string[]; // Mobile networks: GP, Robi, Banglalink, Teletalk
  createdAt: string; // ISO 8601 timestamp
  updatedAt: string; // ISO 8601 timestamp
}

/**
 * Payment Instruction Interface (for instructions JSON)
 */
export interface PaymentInstruction {
  step: number;
  title_en: string;
  title_bn: string;
  description_en: string;
  description_bn: string;
}

/**
 * Payment Fee Result Interface
 */
export interface PaymentFeeResult {
  amount: number;
  processingFee: number;
  processingFeePercent: number;
  percentageFee: number;
  totalFee: number;
  totalAmount: number;
  paymentMethod: {
    code: string;
    name: string;
    displayName: string;
  };
}

/**
 * Payment Validation Result Interface
 */
export interface PaymentValidationResult {
  valid: boolean;
  reason?: string | null;
  paymentMethod: {
    code: string;
    name: string;
    displayName: string;
    minAmount: number;
    maxAmount: number;
    requiresPhone: boolean;
    requiresPin: boolean;
    supportedNetworks: string[];
  };
}

/**
 * Payment Processing Result Interface
 */
export interface PaymentProcessingResult {
  success: boolean;
  transactionId: string;
  paymentMethod: {
    code: string;
    name: string;
    displayName: string;
  };
  amount: number;
  fee: number;
  totalAmount: number;
  status: string;
  userId: string;
  orderId?: string;
  phoneNumber?: string;
  processedAt: string; // ISO 8601 timestamp
}

/**
 * SMS Subscription Interface
 */
export interface SmsSubscription {
  id: string;
  userId: string;
  phoneNumber: string;
  paymentMethod: string;
  isSubscribed: boolean;
  transactionId?: string | null;
  lastPaymentAt?: string | null; // ISO 8601 timestamp
  nextPaymentAt?: string | null; // ISO 8601 timestamp
  amount: number;
  status: string; // active, inactive, cancelled, expired
  createdAt: string; // ISO 8601 timestamp
  updatedAt: string; // ISO 8601 timestamp
}

/**
 * Local Payment Configuration Interface
 */
export interface LocalPaymentConfiguration {
  smsSubscriptionAmount: number;
  smsSubscriptionDuration: number;
  paymentMethods: Array<{
    id: string;
    name: string;
    code: string;
    displayName: string;
    logoUrl?: string | null;
    minAmount: number;
    maxAmount: number;
    processingFee: number;
    processingFeePercent: number;
    requiresPhone: boolean;
    requiresPin: boolean;
    description?: string | null;
    supportedNetworks: string[];
  }>;
}

/**
 * Get Local Payment Methods Response Interface
 */
export interface GetLocalPaymentMethodsResponse {
  success: boolean;
  message: string;
  messageBn?: string;
  data: LocalPaymentMethod[];
}

/**
 * Get Payment Method By Code Response Interface
 */
export interface GetPaymentMethodByCodeResponse {
  success: boolean;
  message: string;
  messageBn?: string;
  data: LocalPaymentMethod;
}

/**
 * Calculate Payment Fee Response Interface
 */
export interface CalculatePaymentFeeResponse {
  success: boolean;
  message: string;
  messageBn?: string;
  data: PaymentFeeResult;
}

/**
 * Validate Payment Method Response Interface
 */
export interface ValidatePaymentMethodResponse {
  success: boolean;
  message: string;
  messageBn?: string;
  data: PaymentValidationResult;
}

/**
 * Process Local Payment Response Interface
 */
export interface ProcessLocalPaymentResponse {
  success: boolean;
  message: string;
  messageBn?: string;
  data: PaymentProcessingResult;
}

/**
 * Get Payment Instructions Response Interface
 */
export interface GetPaymentInstructionsResponse {
  success: boolean;
  message: string;
  messageBn?: string;
  data: {
    paymentMethod: {
      code: string;
      name: string;
      displayName: string;
    };
    instructions: Array<{
      step: number;
      title: string;
      description: string;
    }>;
  };
}

/**
 * Get SMS Subscription Response Interface
 */
export interface GetSmsSubscriptionResponse {
  success: boolean;
  message: string;
  messageBn?: string;
  data: SmsSubscription | null;
}

/**
 * Create SMS Subscription Response Interface
 */
export interface CreateSmsSubscriptionResponse {
  success: boolean;
  message: string;
  messageBn?: string;
  data: SmsSubscription;
}

/**
 * Update SMS Subscription Response Interface
 */
export interface UpdateSmsSubscriptionResponse {
  success: boolean;
  message: string;
  messageBn?: string;
  data: SmsSubscription;
}

/**
 * Cancel SMS Subscription Response Interface
 */
export interface CancelSmsSubscriptionResponse {
  success: boolean;
  message: string;
  messageBn?: string;
  data: SmsSubscription;
}

/**
 * Get Local Payment Configuration Response Interface
 */
export interface GetLocalPaymentConfigurationResponse {
  success: boolean;
  message: string;
  messageBn?: string;
  data: LocalPaymentConfiguration;
}

/**
 * Process Local Payment Request Interface
 */
export interface ProcessLocalPaymentRequest {
  userId: string;
  methodCode: string;
  amount: number;
  phoneNumber?: string;
  pin?: string;
  orderId?: string;
}

/**
 * Create SMS Subscription Request Interface
 */
export interface CreateSmsSubscriptionRequest {
  userId: string;
  phoneNumber: string;
  paymentMethod: string;
}

/**
 * Update SMS Subscription Request Interface
 */
export interface UpdateSmsSubscriptionRequest {
  isSubscribed?: boolean;
  phoneNumber?: string;
  paymentMethod?: string;
  transactionId?: string;
  lastPaymentAt?: string;
  nextPaymentAt?: string;
  amount?: number;
  status?: string;
}

/**
 * Local Payment Methods Component Props Interface
 */
export interface LocalPaymentMethodsProps {
  amount?: number;
  selectedMethodCode?: string;
  onMethodSelect?: (method: LocalPaymentMethod) => void;
  language?: 'en' | 'bn';
  className?: string;
  showFee?: boolean;
}

/**
 * Payment Method Card Component Props Interface
 */
export interface PaymentMethodCardProps {
  method: LocalPaymentMethod;
  amount?: number;
  isSelected?: boolean;
  onSelect?: (method: LocalPaymentMethod) => void;
  language?: 'en' | 'bn';
  className?: string;
  showFee?: boolean;
}

/**
 * Payment Instructions Component Props Interface
 */
export interface PaymentInstructionsProps {
  methodCode: string;
  language?: 'en' | 'bn';
  className?: string;
}

/**
 * SMS Subscription Form Component Props Interface
 */
export interface SmsSubscriptionFormProps {
  userId?: string;
  existingSubscription?: SmsSubscription | null;
  onSubmit?: (subscription: SmsSubscription) => void;
  onCancel?: () => void;
  language?: 'en' | 'bn';
  className?: string;
}

/**
 * Payment Fee Display Component Props Interface
 */
export interface PaymentFeeDisplayProps {
  amount: number;
  methodCode: string;
  language?: 'en' | 'bn';
  className?: string;
}

/**
 * Local Payment Options State Interface
 */
export interface LocalPaymentOptionsState {
  availableMethods: LocalPaymentMethod[];
  selectedMethodCode: string | null;
  selectedMethod: LocalPaymentMethod | null;
  feeCalculation: PaymentFeeResult | null;
  validation: PaymentValidationResult | null;
  isLoading: boolean;
  error: string | null;
}

/**
 * SMS Subscription State Interface
 */
export interface SmsSubscriptionState {
  subscription: SmsSubscription | null;
  isSubscribed: boolean;
  isLoading: boolean;
  error: string | null;
}

/**
 * Local Payment Configuration Constants
 */
export const LOCAL_PAYMENT_CONSTANTS = {
  SMS_SUBSCRIPTION_AMOUNT: 30, // BDT 30/month
  SMS_SUBSCRIPTION_DURATION: 30, // 30 days
  DEFAULT_METHODS: ['bkash', 'nagad', 'rocket', 'surecash'],
  SUPPORTED_NETWORKS: ['GP', 'Robi', 'Banglalink', 'Teletalk'],
  DEFAULT_CURRENCY: 'BDT'
} as const;

/**
 * Local Payment Error Types
 */
export type LocalPaymentErrorType = 
  | 'METHOD_NOT_FOUND'
  | 'METHOD_NOT_ACTIVE'
  | 'AMOUNT_OUT_OF_RANGE'
  | 'AMOUNT_TOO_LOW'
  | 'AMOUNT_TOO_HIGH'
  | 'PAYMENT_FAILED'
  | 'SUBSCRIPTION_EXISTS'
  | 'SUBSCRIPTION_NOT_FOUND'
  | 'INVALID_PHONE'
  | 'INVALID_PIN'
  | 'NETWORK_ERROR'
  | 'UNKNOWN_ERROR';

/**
 * Local Payment Error Interface
 */
export interface LocalPaymentError {
  type: LocalPaymentErrorType;
  message: string;
  messageBn?: string;
  details?: Record<string, any>;
}

/**
 * Local Payment Success Type
 */
export type LocalPaymentSuccessType = 
  | 'METHOD_SELECTED'
  | 'PAYMENT_PROCESSED'
  | 'FEE_CALCULATED'
  | 'VALIDATION_PASSED'
  | 'SUBSCRIPTION_CREATED'
  | 'SUBSCRIPTION_UPDATED'
  | 'SUBSCRIPTION_CANCELLED'
  | 'METHODS_LOADED'
  | 'CONFIGURATION_LOADED';

/**
 * Local Payment Success Interface
 */
export interface LocalPaymentSuccess {
  type: LocalPaymentSuccessType;
  message: string;
  messageBn?: string;
  data?: any;
}

/**
 * Payment Method Status Type
 */
export type PaymentMethodStatus = 'active' | 'inactive';

/**
 * SMS Subscription Status Type
 */
export type SmsSubscriptionStatus = 'active' | 'inactive' | 'cancelled' | 'expired';

/**
 * Payment Method Code Type
 */
export type PaymentMethodCode = 'bkash' | 'nagad' | 'rocket' | 'surecash';

/**
 * Mobile Network Type
 */
export type MobileNetwork = 'GP' | 'Robi' | 'Banglalink' | 'Teletalk';

/**
 * Payment Processing Status Type
 */
export type PaymentProcessingStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled' | 'refunded';
