/**
 * COD Entity Type Definitions
 *
 * This file contains all TypeScript interfaces and types related to COD (Cash on Delivery)
 * including CodSettings, CodAvailabilityResult, CodFeeResult, and related request/response types.
 */

/**
 * COD Settings Interface
 */
export interface CodSettings {
  id: string;
  isEnabled: boolean;
  minAmount: number;
  maxAmount: number;
  availableDivisions: string[];
  unavailableDivisions: string[];
  additionalFee: number;
  freeAboveAmount: number;
  requirePhoneVerification: boolean;
  requireAddressVerification: boolean;
  maxDailyOrders: number;
  maxWeeklyOrders: number;
  deliveryDays: number;
  notes?: string | null;
  createdAt: string; // ISO 8601 timestamp
  updatedAt: string; // ISO 8601 timestamp
}

/**
 * COD Availability Result Interface
 */
export interface CodAvailabilityResult {
  available: boolean;
  reason?: string | null;
  fee: number;
  deliveryDays: number;
  requiresVerification: {
    phone: boolean;
    address: boolean;
  };
}

/**
 * COD Fee Result Interface
 */
export interface CodFeeResult {
  amount: number;
  fee: number;
}

/**
 * COD Validation Result Interface
 */
export interface CodValidationResult {
  valid: boolean;
  reason?: string | null;
  fee: number;
  deliveryDays: number;
  requiresVerification: {
    phone: boolean;
    address: boolean;
  };
  warnings: string[];
}

/**
 * COD Limit Check Result Interface
 */
export interface CodLimitCheckResult {
  withinLimit: boolean;
  reason?: string | null;
  dailyOrders: number;
  weeklyOrders: number;
  dailyLimit: number;
  weeklyLimit: number;
  warnings: string[];
}

/**
 * COD Configuration Interface
 */
export interface CodConfiguration {
  isEnabled: boolean;
  minAmount: number;
  maxAmount: number;
  availableDivisions: string[];
  unavailableDivisions: string[];
  additionalFee: number;
  freeAboveAmount: number;
  requirePhoneVerification: boolean;
  requireAddressVerification: boolean;
  maxDailyOrders: number;
  maxWeeklyOrders: number;
  deliveryDays: number;
  notes?: string | null;
  divisions: Array<{
    value: string;
    label: string;
    available: boolean;
  }>;
}

/**
 * Address Interface for COD check
 */
export interface CodAddress {
  division: string;
  district?: string;
  city?: string;
  address?: string;
}

/**
 * Get COD Settings Response Interface
 */
export interface GetCodSettingsResponse {
  success: boolean;
  message: string;
  messageBn?: string;
  data: CodSettings;
}

/**
 * Get COD Configuration Response Interface
 */
export interface GetCodConfigurationResponse {
  success: boolean;
  message: string;
  messageBn?: string;
  data: CodConfiguration;
}

/**
 * Check COD Availability Request Interface
 */
export interface CheckCodAvailabilityRequest {
  division?: string;
  amount: number;
}

/**
 * Check COD Availability Response Interface
 */
export interface CheckCodAvailabilityResponse {
  success: boolean;
  message: string;
  messageBn?: string;
  data: CodAvailabilityResult;
}

/**
 * Validate COD Order Request Interface
 */
export interface ValidateCodOrderRequest {
  userId?: string;
  division?: string;
  amount: number;
}

/**
 * Validate COD Order Response Interface
 */
export interface ValidateCodOrderResponse {
  success: boolean;
  message: string;
  messageBn?: string;
  data: CodValidationResult;
}

/**
 * Calculate COD Fee Response Interface
 */
export interface CalculateCodFeeResponse {
  success: boolean;
  message: string;
  messageBn?: string;
  data: CodFeeResult;
}

/**
 * Check COD Limit Response Interface
 */
export interface CheckCodLimitResponse {
  success: boolean;
  message: string;
  messageBn?: string;
  data: CodLimitCheckResult;
}

/**
 * COD Availability Component Props Interface
 */
export interface CodAvailabilityProps {
  address?: CodAddress;
  amount: number;
  onAvailabilityChange?: (result: CodAvailabilityResult) => void;
  language?: 'en' | 'bn';
  className?: string;
  showDeliveryInfo?: boolean;
}

/**
 * COD Fee Display Component Props Interface
 */
export interface CodFeeDisplayProps {
  amount: number;
  fee?: number;
  freeAboveAmount?: number;
  language?: 'en' | 'bn';
  className?: string;
  showBreakdown?: boolean;
}

/**
 * COD Terms Component Props Interface
 */
export interface CodTermsProps {
  settings?: CodSettings;
  language?: 'en' | 'bn';
  className?: string;
  showDeliveryInfo?: boolean;
  showLimitInfo?: boolean;
}

/**
 * COD Verification Component Props Interface
 */
export interface CodVerificationProps {
  requiresPhoneVerification: boolean;
  requiresAddressVerification: boolean;
  amount: number;
  onPhoneVerified?: (verified: boolean) => void;
  onAddressVerified?: (verified: boolean) => void;
  language?: 'en' | 'bn';
  className?: string;
}

/**
 * COD Limit Warning Component Props Interface
 */
export interface CodLimitWarningProps {
  userId?: string;
  language?: 'en' | 'bn';
  className?: string;
  showDailyLimit?: boolean;
  showWeeklyLimit?: boolean;
}

/**
 * COD Cart Integration Props Interface
 */
export interface CodCartIntegrationProps {
  cartTotal: number;
  address?: CodAddress;
  userId?: string;
  onCodSelect?: (validation: CodValidationResult) => void;
  language?: 'en' | 'bn';
  className?: string;
}

/**
 * COD Options State Interface
 */
export interface CodOptionsState {
  isAvailable: boolean;
  isValid: boolean;
  fee: number;
  deliveryDays: number;
  requiresVerification: {
    phone: boolean;
    address: boolean;
  };
  warnings: string[];
  isLoading: boolean;
  error: string | null;
}

/**
 * COD Verification State Interface
 */
export interface CodVerificationState {
  phoneVerified: boolean;
  addressVerified: boolean;
  isVerifyingPhone: boolean;
  isVerifyingAddress: boolean;
  phoneError: string | null;
  addressError: string | null;
}

/**
 * COD Configuration Constants
 */
export const COD_CONSTANTS = {
  MIN_AMOUNT: 0, // BDT 0
  MAX_AMOUNT: 100000, // BDT 100,000
  DEFAULT_FEE: 50, // BDT 50
  DEFAULT_FREE_ABOVE: 1000, // BDT 1,000
  DEFAULT_DAILY_ORDERS: 5,
  DEFAULT_WEEKLY_ORDERS: 10,
  DEFAULT_DELIVERY_DAYS: 3,
  DIVISIONS: [
    'dhaka',
    'chittagong',
    'khulna',
    'rajshahi',
    'sylhet',
    'barishal',
    'rangpur',
    'mymensingh'
  ],
  DIVISION_NAMES: {
    dhaka: 'Dhaka',
    chittagong: 'Chittagong',
    khulna: 'Khulna',
    rajshahi: 'Rajshahi',
    sylhet: 'Sylhet',
    barishal: 'Barishal',
    rangpur: 'Rangpur',
    mymensingh: 'Mymensingh'
  },
  DIVISION_NAMES_BN: {
    dhaka: 'ঢাকা',
    chittagong: 'চট্টগ্রাম',
    khulna: 'খুলনা',
    rajshahi: 'রাজশাহী',
    sylhet: 'সিলেট',
    barishal: 'বরিশাল',
    rangpur: 'রংপুর',
    mymensingh: 'ময়মনসিংহ'
  },
  DEFAULT_CURRENCY: 'BDT'
} as const;

/**
 * COD Error Types
 */
export type CodErrorType = 
  | 'COD_DISABLED'
  | 'AMOUNT_TOO_LOW'
  | 'AMOUNT_TOO_HIGH'
  | 'DIVISION_NOT_AVAILABLE'
  | 'DAILY_LIMIT_REACHED'
  | 'WEEKLY_LIMIT_REACHED'
  | 'VERIFICATION_REQUIRED'
  | 'NETWORK_ERROR'
  | 'UNKNOWN_ERROR';

/**
 * COD Error Interface
 */
export interface CodError {
  type: CodErrorType;
  message: string;
  messageBn?: string;
  details?: Record<string, any>;
}

/**
 * COD Success Type
 */
export type CodSuccessType = 
  | 'AVAILABILITY_CHECKED'
  | 'FEE_CALCULATED'
  | 'ORDER_VALIDATED'
  | 'LIMIT_CHECKED'
  | 'VERIFICATION_COMPLETED'
  | 'SETTINGS_LOADED';

/**
 * COD Success Interface
 */
export interface CodSuccess {
  type: CodSuccessType;
  message: string;
  messageBn?: string;
  data?: any;
}

/**
 * COD Terms Text Interface
 */
export interface CodTermsText {
  title: string;
  titleBn: string;
  description: string;
  descriptionBn: string;
  points: Array<{
    text: string;
    textBn: string;
  }>;
}

/**
 * COD Delivery Info Interface
 */
export interface CodDeliveryInfo {
  estimatedDays: number;
  minDays: number;
  maxDays: number;
  note: string;
  noteBn: string;
}
