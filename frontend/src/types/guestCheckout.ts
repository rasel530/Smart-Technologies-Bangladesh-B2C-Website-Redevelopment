/**
 * Guest Checkout Entity Type Definitions
 *
 * This file contains all TypeScript interfaces and types related to Guest Checkout entities
 * including guest session, information, order tracking, cart merging, and account creation.
 */

/**
 * Guest Session Type
 * Tracks guest checkout session state
 */
export interface GuestSession {
  id: string;
  sessionId: string;
  guestId: string;
  email?: string | null;
  phone?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  createdAt: string; // ISO 8601 timestamp
  updatedAt: string; // ISO 8601 timestamp
  expiresAt?: string; // ISO 8601 timestamp
  cartId?: string | null;
  status: 'active' | 'abandoned' | 'completed' | 'expired';
}

/**
 * Guest Information Type
 * Stores guest checkout information
 */
export interface GuestInfo {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  createAccount?: boolean;
  password?: string;
  confirmPassword?: string;
  agreeToTerms?: boolean;
  agreeToPrivacy?: boolean;
}

/**
 * Guest Checkout Data Type
 * Stores all guest checkout-related data
 */
export interface GuestCheckoutData {
  guestInfo: GuestInfo;
  shippingAddress: GuestShippingAddress;
  billingAddress: GuestBillingAddress;
  paymentMethod: string;
  paymentDetails?: GuestPaymentDetails;
  notes?: string;
}

/**
 * Guest Shipping Address Type
 */
export interface GuestShippingAddress {
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  district: string;
  postalCode: string;
}

/**
 * Guest Billing Address Type
 */
export interface GuestBillingAddress {
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  district: string;
  postalCode: string;
}

/**
 * Guest Payment Details Type
 */
export interface GuestPaymentDetails {
  method: string;
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
}

/**
 * Guest Order Type
 */
export interface GuestOrder {
  id: string;
  orderNumber: string;
  guestId: string;
  email?: string | null;
  phone?: string | null;
  status: string;
  subtotal: number;
  shippingCost: number;
  tax: number;
  discount: number;
  total: number;
  paymentMethod: string;
  paymentStatus: string;
  shippingAddress: GuestShippingAddress;
  billingAddress: GuestBillingAddress;
  items: GuestOrderItem[];
  createdAt: string; // ISO 8601 timestamp
  updatedAt: string; // ISO 8601 timestamp
}

/**
 * Guest Order Item Type
 */
export interface GuestOrderItem {
  id: string;
  productId: string;
  variantId?: string | null;
  productName: string;
  productImage?: string | null;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

/**
 * Guest Order Tracking Request Type
 */
export interface GuestOrderTrackingRequest {
  orderNumber: string;
  email?: string;
  phone?: string;
}

/**
 * Guest Order Tracking Response Type
 */
export interface GuestOrderTrackingResponse {
  success: boolean;
  order?: GuestOrder;
  message: string;
  messageBn: string;
}

/**
 * Guest Cart Item Type
 */
export interface GuestCartItem {
  id: string;
  productId: string;
  variantId?: string | null;
  quantity: number;
  price: number;
  product?: {
    id: string;
    name: string;
    nameBn?: string;
    images?: Array<{
      originalUrl?: string;
      optimizedUrl?: string;
      thumbnailUrl?: string;
      url?: string;
    }>;
  };
}

/**
 * Guest Cart Type
 */
export interface GuestCart {
  id: string;
  guestId: string;
  items: GuestCartItem[];
  subtotal: number;
  shippingCost: number;
  tax: number;
  discount: number;
  total: number;
  createdAt: string; // ISO 8601 timestamp
  updatedAt: string; // ISO 8601 timestamp
}

/**
 * User Cart Item Type
 */
export interface UserCartItem {
  id: string;
  userId: string;
  productId: string;
  variantId?: string | null;
  quantity: number;
  price: number;
  product?: {
    id: string;
    name: string;
    nameBn?: string;
    images?: Array<{
      originalUrl?: string;
      optimizedUrl?: string;
      thumbnailUrl?: string;
      url?: string;
    }>;
  };
}

/**
 * User Cart Type
 */
export interface UserCart {
  id: string;
  userId: string;
  items: UserCartItem[];
  subtotal: number;
  shippingCost: number;
  tax: number;
  discount: number;
  total: number;
  createdAt: string; // ISO 8601 timestamp
  updatedAt: string; // ISO 8601 timestamp
}

/**
 * Cart Merge Options Type
 */
export type CartMergeOption = 'keep_user' | 'keep_guest' | 'merge';

/**
 * Cart Merge Request Type
 */
export interface CartMergeRequest {
  guestCartId: string;
  userCartId: string;
  mergeOption: CartMergeOption;
}

/**
 * Cart Merge Response Type
 */
export interface CartMergeResponse {
  success: boolean;
  mergedCart: UserCart;
  message: string;
  messageBn: string;
}

/**
 * Cart Conflict Type
 */
export interface CartConflict {
  productId: string;
  variantId?: string | null;
  productName: string;
  guestQuantity: number;
  userQuantity: number;
  conflictType: 'duplicate' | 'different_price' | 'different_variant';
}

/**
 * Guest Account Creation Request Type
 */
export interface GuestAccountCreationRequest {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
  agreeToTerms: boolean;
  agreeToPrivacy: boolean;
  guestId?: string;
  guestCartId?: string;
  mergeCart?: boolean;
}

/**
 * Guest Account Creation Response Type
 */
export interface GuestAccountCreationResponse {
  success: boolean;
  user?: {
    id: string;
    email: string;
    phone: string;
    firstName: string;
    lastName: string;
    role: string;
  };
  message: string;
  messageBn: string;
  requiresEmailVerification?: boolean;
  requiresPhoneVerification?: boolean;
}

/**
 * Guest Checkout Step Type
 * Defines 4-step guest checkout process
 */
export type GuestCheckoutStep = 'info' | 'address' | 'payment' | 'review';

/**
 * Guest Checkout Progress Type
 */
export interface GuestCheckoutProgress {
  currentStep: GuestCheckoutStep;
  completedSteps: GuestCheckoutStep[];
  pendingSteps: GuestCheckoutStep[];
  progressPercentage: number;
  canNavigateBack: boolean;
  canNavigateForward: boolean;
}

/**
 * Guest Checkout Validation Error Type
 */
export interface GuestCheckoutValidationError {
  step: GuestCheckoutStep;
  field: string;
  message: string;
  messageBn: string;
  code: string;
  severity: 'error' | 'warning' | 'info';
}

/**
 * Guest Checkout Validation Result Type
 */
export interface GuestCheckoutValidationResult {
  isValid: boolean;
  step: GuestCheckoutStep;
  errors: GuestCheckoutValidationError[];
  warnings: GuestCheckoutValidationError[];
  canProceed: boolean;
}

/**
 * Guest Checkout API Request Types
 */
export interface InitializeGuestCheckoutRequest {
  guestId?: string;
  sessionId?: string;
  cartId?: string;
  platform: 'mobile' | 'desktop';
  language: 'en' | 'bn';
}

export interface UpdateGuestCheckoutStepRequest {
  sessionId: string;
  step: GuestCheckoutStep;
  data?: Partial<GuestCheckoutData>;
}

export interface ValidateGuestCheckoutStepRequest {
  sessionId: string;
  step: GuestCheckoutStep;
  data?: Partial<GuestCheckoutData>;
}

export interface CompleteGuestCheckoutRequest {
  sessionId: string;
  data: GuestCheckoutData;
}

export interface CreateGuestOrderRequest {
  guestInfo: GuestInfo;
  shippingAddress: GuestShippingAddress;
  billingAddress: GuestBillingAddress;
  items: Array<{
    productId: string;
    variantId?: string | null;
    quantity: number;
    unitPrice: number;
  }>;
  paymentMethod: string;
  paymentDetails?: GuestPaymentDetails;
  notes?: string;
  createAccount?: boolean;
  password?: string;
}

/**
 * Guest Checkout API Response Types
 */
export interface InitializeGuestCheckoutResponse {
  success: boolean;
  session: GuestSession;
  message: string;
  messageBn: string;
}

export interface UpdateGuestCheckoutStepResponse {
  success: boolean;
  session: GuestSession;
  progress: GuestCheckoutProgress;
  message: string;
  messageBn: string;
}

export interface ValidateGuestCheckoutStepResponse {
  success: boolean;
  validation: GuestCheckoutValidationResult;
  message: string;
  messageBn: string;
}

export interface CompleteGuestCheckoutResponse {
  success: boolean;
  order: GuestOrder;
  message: string;
  messageBn: string;
}

export interface CreateGuestOrderResponse {
  success: boolean;
  order: GuestOrder;
  message: string;
  messageBn: string;
  user?: {
    id: string;
    email: string;
    phone: string;
  };
}

/**
 * Guest Info Form Props Type
 */
export interface GuestInfoFormProps {
  onSubmit: (data: GuestInfo) => void | Promise<void>;
  initialData?: Partial<GuestInfo>;
  isLoading?: boolean;
  language?: 'en' | 'bn';
  className?: string;
  showAccountCreation?: boolean;
}

/**
 * Guest Order Tracking Props Type
 */
export interface GuestOrderTrackingProps {
  onTrackOrder: (orderNumber: string, email?: string, phone?: string) => void | Promise<void>;
  isLoading?: boolean;
  language?: 'en' | 'bn';
  className?: string;
}

/**
 * Guest Cart Merge Prompt Props Type
 */
export interface GuestCartMergePromptProps {
  guestCart: GuestCart;
  userCart: UserCart;
  onMerge: (option: CartMergeOption) => void | Promise<void>;
  onSkip: () => void;
  isLoading?: boolean;
  language?: 'en' | 'bn';
  className?: string;
}

/**
 * Guest Account Creation Props Type
 */
export interface GuestAccountCreationProps {
  onSubmit: (data: GuestAccountCreationRequest) => void | Promise<void>;
  initialData?: Partial<GuestAccountCreationRequest>;
  isLoading?: boolean;
  language?: 'en' | 'bn';
  className?: string;
  guestId?: string;
  guestCartId?: string;
}
