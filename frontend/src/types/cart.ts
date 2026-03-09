/**
 * Cart Entity Type Definitions
 *
 * This file contains all TypeScript interfaces and types related to Cart entities
 * including Cart, CartItem, CartSummary, and related request/response types.
 */

import type { Product } from './product';

/**
 * Cart Status Type
 */
export type CartStatus = 'active' | 'abandoned' | 'converted' | 'expired';

/**
 * Cart Item Status Type
 */
export type CartItemStatus = 'active' | 'removed' | 'out_of_stock';

/**
 * Shipping Method Type
 * Updated to match backend: STANDARD, EXPRESS, INSIDE_DHAKA, OUTSIDE_DHAKA
 */
export type ShippingMethod = 'STANDARD' | 'EXPRESS' | 'INSIDE_DHAKA' | 'OUTSIDE_DHAKA';

/**
 * Cart Item Interface
 */
export interface CartItem {
  id: string;
  cartId: string;
  productId: string;
  quantity: number;
  price: number;
  subtotal: number;
  addedAt: string; // ISO 8601 timestamp
  status: CartItemStatus;
  variantId?: string | null;
  product?: {
    id: string;
    name: string;
    nameBn?: string;
    slug: string;
    images: string[];
    sku: string;
    regularPrice: number;
    salePrice?: number | null;
    stockQuantity: number;
    status: string;
  };
}

/**
 * Cart Summary Interface
 */
export interface CartSummary {
  itemCount: number;
  subtotal: number;
  tax: number;
  shippingCost: number;
  discount: number;
  total: number;
}

/**
 * Cart Interface
 */
export interface Cart {
  id: string;
  cartId?: string;  // Real database cart ID (for guest carts)
  userId?: string;
  sessionId?: string;
  items: CartItem[];
  subtotal: number;
  tax: number;
  shippingCost: number;
  discount: number;
  total: number;
  status: CartStatus;
  expiresAt?: string; // ISO 8601 timestamp
  createdAt: string;  // ISO 8601 timestamp
  updatedAt: string;  // ISO 8601 timestamp
}

/**
 * Add to Cart Request Interface
 */
export interface AddToCartRequest {
  cartId: string | null;
  productId: string;
  quantity: number;
  variantId?: string | null;
}

/**
 * Update Cart Item Request Interface
 */
export interface UpdateCartItemRequest {
  quantity?: number;
  variantId?: string | null;
}

/**
 * Update Cart Item Quantity Request Interface
 */
export interface UpdateCartItemQuantityRequest {
  quantity: number;
}

/**
 * Apply Discount Request Interface
 */
export interface ApplyDiscountRequest {
  code: string;
}

/**
 * Set Shipping Method Request Interface
 */
export interface SetShippingMethodRequest {
  method: ShippingMethod;
}

/**
 * Merge Guest Cart Request Interface
 * 
 * FIXED: Added idempotencyKey field for duplicate prevention
 */
export interface MergeGuestCartRequest {
  guestSessionId: string;
  items?: GuestCartItem[];
  idempotencyKey?: string;
}

// Note: MergeGuestCartResponse is defined at line 365

/**
 * Validate Cart Response Interface
 */
export interface ValidateCartResponse {
  isValid: boolean;
  invalidItems: Array<{
    itemId: string;
    productId: string;
    reason: string;
    availableStock?: number;
  }>;
  updatedPrices: Array<{
    itemId: string;
    oldPrice: number;
    newPrice: number;
  }>;
}

/**
 * Cart Context State Interface
 */
export interface CartContextState {
  items: CartItem[];
  itemCount: number;
  subtotal: number;
  tax: number;
  shippingCost: number;
  discount: number;
  total: number;
  isLoading: boolean;
  error: string | null;
  shippingMethod: ShippingMethod;
  discountCode: string | null;
  isGuest: boolean;
  sessionId: string | null;
  isInitializing: boolean;  // Track if cart is initializing
  cartId: string | null;  // Cart ID for checkout initialization
}

/**
 * Cart Context Actions Options Interface
 */
export interface CartContextActionOptions {
  onSuccess?: (cart?: Cart) => void;
  navigateToCart?: boolean;
}

/**
 * Cart Context Actions Interface
 */
export interface CartContextActions {
  addItem: (product: Product, quantity?: number, variantId?: string | null, options?: CartContextActionOptions) => Promise<void>;
  removeItem: (itemId: string, options?: CartContextActionOptions) => Promise<void>;
  updateQuantity: (itemId: string, quantity: number, options?: CartContextActionOptions) => Promise<void>;
  clearCart: (options?: CartContextActionOptions) => Promise<void>;
  applyDiscount: (code: string, options?: CartContextActionOptions) => Promise<void>;
  removeDiscount: (options?: CartContextActionOptions) => void;
  setShippingMethod: (method: string, cost: number) => void;
  loadCart: () => Promise<void>;
  mergeGuestCart: (sessionId: string) => Promise<void>;
  validateCart: () => Promise<ValidateCartResponse>;
  fetchCartCount: () => Promise<void>;
}

/**
 * Cart Context Type
 */
export type CartContextType = CartContextState & CartContextActions;

/**
 * Cart Storage Data Interface (for localStorage)
 */
export interface CartStorageData {
  sessionId: string;
  items: Array<{
    productId: string;
    quantity: number;
    variantId?: string | null;
    addedAt: string;
  }>;
  shippingMethod: ShippingMethod;
  discountCode: string | null;
  expiresAt: string;
}

/**
 * Cart Item Component Props Interface
 */
export interface CartItemProps {
  item: CartItem;
  onUpdateQuantity: (itemId: string, quantity: number) => Promise<void>;
  onRemove: (itemId: string) => Promise<void>;
  onLoadCart?: () => Promise<void>;
  language?: 'en' | 'bn';
  showTax?: boolean;
  taxRate?: number;
  onMoveToWishlist?: (itemId: string) => void;
  isInWishlist?: boolean;
}

/**
 * Cart Summary Component Props Interface
 */
export interface CartSummaryProps {
  subtotal: number;
  tax: number;
  shippingCost: number;
  discount: number;
  total: number;
  itemCount: number;
  shippingMethod: ShippingMethod;
  discountCode: string | null;
  onApplyDiscount: (code: string) => Promise<void>;
  onRemoveDiscount: () => void;
  onSetShippingMethod: (method: string, cost: number) => void;
  onCheckout: () => void;
  language?: 'en' | 'bn';
  isLoading?: boolean;
}

/**
 * Cart Page Component Props Interface
 */
export interface CartPageProps {
  language?: 'en' | 'bn';
}

/**
 * Add to Cart Button Component Props Interface
 */
export interface AddToCartButtonProps {
  product: Product;
  variantId?: string | null;
  availableStock?: number;
  disabled?: boolean;
  className?: string;
  language?: 'en' | 'bn';
  quantity?: number;
  showQuantitySelector?: boolean;
  navigateToCart?: boolean;
}

/**
 * Enhanced Add to Cart Button Props Interface
 */
export interface EnhancedAddToCartButtonProps extends AddToCartButtonProps {
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

/**
 * Cart Icon Component Props Interface
 */
export interface CartIconProps {
  itemCount: number;
  onClick?: () => void;
  showPreview?: boolean;
  language?: 'en' | 'bn';
}

/**
 * Guest cart item with minimal data (for localStorage)
 */
export interface GuestCartItem {
  productId: string;
  quantity: number;
  variantId: string | null;
  price: number; // Stored price at time of add
  addedAt: string;
}

/**
 * Extended cart item with full product details (fetched from API)
 */
export interface GuestCartItemWithProduct extends GuestCartItem {
  product: {
    id: string;
    name: string;
    nameBn?: string;
    slug: string;
    images: string[];
    sku: string;
    regularPrice: number;
    salePrice?: number | null;
    stockQuantity: number;
    status: string;
  };
  variant?: {
    id: string;
    name: string;
    price: number;
    stock: number;
  };
}

/**
 * Complete guest cart data structure for localStorage
 */
export interface GuestCartStorageData {
  cartId?: string;  // Real database cart ID (returned by backend)
  sessionId: string;
  items: GuestCartItem[];
  shippingMethod: ShippingMethod;
  discountCode: string | null;
  expiresAt: string; // ISO 8601 timestamp
  createdAt: string;
  updatedAt: string;
  version: string;
}

/**
 * Validation error for cart items
 */
export interface CartValidationError {
  productId: string;
  variantId: string | null;
  reason: string;
  availableStock?: number;
}

/**
 * Invalid item information
 */
export interface InvalidItem {
  productId: string;
  variantId: string | null;
  reason: string;
  productName?: string;
}

/**
 * Merge guest cart response interface
 * 
 * FIXED: Added failedItems and updated fields
 */
export interface MergeGuestCartResponse {
  success: boolean;
  cartId: string;
  items: CartItem[];
  itemsMerged: number;
  skippedItems: Array<{
    productId: string;
    variantId?: string;
    reason: string;
  }>;
  failedItems: Array<{
    productId: string;
    variantId?: string;
    reason: string;
    availableStock?: number;
    requestedQuantity?: number;
  }>;
  subtotal: number;
  tax: number;
  shippingCost: number;
  discount: number;
  total: number;
  message?: string;
}

/**
 * Merge guest cart response interface
 * 
 * FIXED: Merged duplicate interface with complete fields including both skippedItems and failedItems
 */
export interface MergeGuestCartResponse {
  success: boolean;
  cartId: string;
  items: CartItem[];
  itemsMerged: number;
  // Combined items tracking from both definitions
  skippedItems: Array<{
    productId: string;
    variantId?: string;
    reason: string;
  }>;
  failedItems: Array<{
    productId: string;
    variantId?: string;
    reason: string;
    availableStock?: number;
    requestedQuantity?: number;
  }>;
  subtotal: number;
  tax: number;
  shippingCost: number;
  discount: number;
  total: number;
  message?: string;
}
