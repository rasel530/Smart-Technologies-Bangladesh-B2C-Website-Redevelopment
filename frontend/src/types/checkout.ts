/**
 * Checkout Entity Type Definitions
 *
 * This file contains all TypeScript interfaces and types related to Checkout entities
 * including checkout session, steps, progress, security, and abandonment recovery.
 */

/**
 * Checkout Step Type
 * Defines the 4-step checkout process
 */
export type CheckoutStep = 'address' | 'shipping' | 'payment' | 'review';

/**
 * Checkout Status Type
 */
export type CheckoutStatus = 'active' | 'abandoned' | 'completed' | 'expired' | 'failed';

/**
 * Checkout Session Type
 * Tracks the overall checkout session state
 */
export interface CheckoutSession {
  id: string;
  userId?: string | null;
  sessionId?: string;
  currentStep: CheckoutStep;
  status: CheckoutStatus;
  createdAt: string; // ISO 8601 timestamp
  updatedAt: string; // ISO 8601 timestamp
  expiresAt?: string; // ISO 8601 timestamp
  completedAt?: string; // ISO 8601 timestamp
  isGuest: boolean;
  data: CheckoutSessionData;
}

/**
 * Checkout Session Data
 * Stores all checkout-related data
 */
export interface CheckoutSessionData {
  address?: CheckoutAddressData;
  shipping?: CheckoutShippingData;
  payment?: CheckoutPaymentData;
  review?: CheckoutReviewData;
  metadata?: CheckoutMetadata;
}

/**
 * Checkout Address Data
 */
export interface CheckoutAddressData {
  shippingAddressId?: string | null;
  billingAddressId?: string | null;
  useSameAddress: boolean;
  shippingAddress?: {
    fullName: string;
    phone: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    district: string;
    postalCode: string;
  };
  billingAddress?: {
    fullName: string;
    phone: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    district: string;
    postalCode: string;
  };
  completed: boolean;
  completedAt?: string;
}

/**
 * Checkout Shipping Data
 */
export interface CheckoutShippingData {
  method: string;
  methodId?: string;
  cost: number;
  estimatedDays: number;
  completed: boolean;
  completedAt?: string;
}

/**
 * Checkout Payment Data
 */
export interface CheckoutPaymentData {
  method: string;
  methodId?: string;
  details?: {
    emiPlanId?: string;
    emiProviderId?: string;
    emiAmount?: number;
    emiDuration?: number;
    emiInterestRate?: number;
    totalPayable?: number;
    processingFee?: number;
    codFee?: number;
    paymentMethodCode?: string;
    phoneNumber?: string;
    paymentFee?: number;
    totalAmount?: number;
  };
  completed: boolean;
  completedAt?: string;
}

/**
 * Checkout Review Data
 */
export interface CheckoutReviewData {
  reviewed: boolean;
  reviewedAt?: string;
  confirmed: boolean;
  confirmedAt?: string;
}

/**
 * Checkout Metadata
 */
export interface CheckoutMetadata {
  platform: 'mobile' | 'desktop';
  userAgent?: string;
  ipAddress?: string;
  referrer?: string;
  source?: string;
  campaign?: string;
  language: 'en' | 'bn';
}

/**
 * Checkout Progress Type
 */
export interface CheckoutProgress {
  currentStep: CheckoutStep;
  completedSteps: CheckoutStep[];
  pendingSteps: CheckoutStep[];
  progressPercentage: number;
  canNavigateBack: boolean;
  canNavigateForward: boolean;
}

/**
 * Checkout Step Configuration
 */
export interface CheckoutStepConfig {
  step: CheckoutStep;
  label: string;
  labelBn: string;
  description: string;
  descriptionBn: string;
  icon: string;
  order: number;
  required: boolean;
  canSkip: boolean;
  validationRequired: boolean;
}

/**
 * Checkout Security Type
 */
export interface CheckoutSecurity {
  isSecure: boolean;
  isHttps: boolean;
  sslCertificate: {
    valid: boolean;
    issuer: string;
    expiresAt: string;
  };
  sessionTimeout: number; // in minutes
  sessionExpiresAt: string; // ISO 8601 timestamp
  warnings: SecurityWarning[];
  badges: SecurityBadge[];
  compliance: ComplianceInfo;
}

/**
 * Security Warning Type
 */
export interface SecurityWarning {
  type: 'session_timeout' | 'insecure_connection' | 'suspicious_activity' | 'other';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  messageBn: string;
  timestamp: string; // ISO 8601 timestamp
  dismissible: boolean;
  dismissed: boolean;
}

/**
 * Security Badge Type
 */
export interface SecurityBadge {
  type: 'ssl' | 'pci_dss' | 'data_protection' | 'payment_security' | 'trust';
  label: string;
  labelBn: string;
  icon: string;
  description: string;
  descriptionBn: string;
  verified: boolean;
  verifiedAt?: string;
}

/**
 * Compliance Information Type
 */
export interface ComplianceInfo {
  pciDss: {
    compliant: boolean;
    version: string;
    lastAudit: string;
  };
  gdpr: {
    compliant: boolean;
    consentRequired: boolean;
  };
  dataProtection: {
    compliant: boolean;
    encryptionLevel: string;
  };
}

/**
 * Checkout Abandonment Type
 */
export interface CheckoutAbandonment {
  sessionId: string;
  userId?: string | null;
  step: CheckoutStep;
  reason: AbandonmentReason;
  timestamp: string; // ISO 8601 timestamp
  dataSaved: boolean;
  recoveryToken?: string;
  recoveryEmailSent: boolean;
  recoveryEmailSentAt?: string;
  recovered: boolean;
  recoveredAt?: string;
}

/**
 * Abandonment Reason Type
 */
export type AbandonmentReason = 
  | 'navigation_away'
  | 'page_close'
  | 'session_timeout'
  | 'error'
  | 'manual_save'
  | 'other';

/**
 * Abandonment Recovery Type
 */
export interface CheckoutRecovery {
  sessionId: string;
  recoveryToken: string;
  userId?: string | null;
  step: CheckoutStep;
  data: CheckoutSessionData;
  expiresAt: string; // ISO 8601 timestamp
  createdAt: string; // ISO 8601 timestamp
  lastAccessedAt: string; // ISO 8601 timestamp
  recoveryCount: number;
  maxRecoveries: number;
}

/**
 * Checkout Validation Error Type
 */
export interface CheckoutValidationError {
  step: CheckoutStep;
  field: string;
  message: string;
  messageBn: string;
  code: string;
  severity: 'error' | 'warning' | 'info';
}

/**
 * Checkout Validation Result Type
 */
export interface CheckoutValidationResult {
  isValid: boolean;
  step: CheckoutStep;
  errors: CheckoutValidationError[];
  warnings: CheckoutValidationError[];
  canProceed: boolean;
}

/**
 * Checkout Context State Interface
 */
export interface CheckoutContextState {
  session: CheckoutSession | null;
  progress: CheckoutProgress;
  security: CheckoutSecurity;
  isLoading: boolean;
  error: string | null;
  isAbandoned: boolean;
  abandonmentReason: AbandonmentReason | null;
  recovery: CheckoutRecovery | null;
}

/**
 * Checkout Context Actions Interface
 */
export interface CheckoutContextActions {
  initializeSession: (userId?: string | null, sessionId?: string) => Promise<void>;
  updateStep: (step: CheckoutStep) => Promise<void>;
  saveProgress: (data: Partial<CheckoutSessionData>) => Promise<void>;
  validateStep: (step: CheckoutStep) => Promise<CheckoutValidationResult>;
  completeCheckout: () => Promise<void>;
  abandonCheckout: (reason: AbandonmentReason) => Promise<void>;
  recoverCheckout: (recoveryToken: string) => Promise<void>;
  extendSession: () => Promise<void>;
  clearSession: () => void;
  setSecurityWarning: (warning: SecurityWarning) => void;
  dismissSecurityWarning: (warningId: string) => void;
}

/**
 * Checkout Context Type
 */
export type CheckoutContextType = CheckoutContextState & CheckoutContextActions;

/**
 * Checkout Progress Component Props
 */
export interface CheckoutProgressProps {
  currentStep: CheckoutStep;
  completedSteps: CheckoutStep[];
  onStepClick?: (step: CheckoutStep) => void;
  language?: 'en' | 'bn';
  className?: string;
  showLabels?: boolean;
  showDescriptions?: boolean;
  clickable?: boolean;
}

/**
 * Checkout Step Container Props
 */
export interface CheckoutStepContainerProps {
  step: CheckoutStep;
  isActive: boolean;
  isCompleted: boolean;
  isValid: boolean;
  errors: CheckoutValidationError[];
  onBack?: () => void;
  onNext?: () => void;
  onSubmit?: () => void;
  language?: 'en' | 'bn';
  className?: string;
  children: React.ReactNode;
}

/**
 * Checkout Security Badge Props
 */
export interface CheckoutSecurityBadgeProps {
  security: CheckoutSecurity;
  language?: 'en' | 'bn';
  className?: string;
  showWarnings?: boolean;
  onWarningDismiss?: (warningId: string) => void;
}

/**
 * Checkout Abandonment Warning Props
 */
export interface CheckoutAbandonmentWarningProps {
  isOpen: boolean;
  onSave: () => void;
  onContinue: () => void;
  onLeave: () => void;
  language?: 'en' | 'bn';
  className?: string;
}

/**
 * Checkout API Request Types
 */
export interface InitializeCheckoutRequest {
  userId?: string | null;
  sessionId?: string;
  cartId: string;
  platform: 'mobile' | 'desktop';
  language: 'en' | 'bn';
}

export interface UpdateCheckoutStepRequest {
  sessionId: string;
  step: CheckoutStep;
  data?: Partial<CheckoutSessionData>;
}

export interface ValidateCheckoutStepRequest {
  sessionId: string;
  step: CheckoutStep;
  data?: Partial<CheckoutSessionData>;
}

export interface CompleteCheckoutRequest {
  sessionId: string;
  data: CheckoutSessionData;
}

export interface AbandonCheckoutRequest {
  sessionId: string;
  reason: AbandonmentReason;
  saveData: boolean;
}

export interface RecoverCheckoutRequest {
  recoveryToken: string;
  sessionId?: string;
}

/**
 * Checkout API Response Types
 */
export interface InitializeCheckoutResponse {
  success: boolean;
  session: CheckoutSession;
  message: string;
  messageBn: string;
}

export interface UpdateCheckoutStepResponse {
  success: boolean;
  session: CheckoutSession;
  progress: CheckoutProgress;
  message: string;
  messageBn: string;
}

export interface ValidateCheckoutStepResponse {
  success: boolean;
  validation: CheckoutValidationResult;
  message: string;
  messageBn: string;
}

export interface CompleteCheckoutResponse {
  success: boolean;
  orderId: string;
  message: string;
  messageBn: string;
}

export interface AbandonCheckoutResponse {
  success: boolean;
  recoveryToken?: string;
  message: string;
  messageBn: string;
}

export interface RecoverCheckoutResponse {
  success: boolean;
  session: CheckoutSession;
  recovery: CheckoutRecovery;
  message: string;
  messageBn: string;
}
