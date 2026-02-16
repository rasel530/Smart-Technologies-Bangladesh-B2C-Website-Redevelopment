/**
 * Cart API Client
 *
 * This file provides methods for interacting with the cart API endpoints.
 * It follows the existing API client pattern and supports both logged-in users and guest carts.
 */

import { apiClient } from './client';
import {
  Cart,
  CartItem,
  CartSummary,
  AddToCartRequest,
  UpdateCartItemRequest,
  UpdateCartItemQuantityRequest,
  ApplyDiscountRequest,
  SetShippingMethodRequest,
  MergeGuestCartRequest,
  ValidateCartResponse,
  GuestCartItem,
} from '@/types/cart';

// Get API URL from environment or use default (backend runs on port 3001)
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

/**
 * Get user/guest cart
 * @returns Promise<Cart> The cart data
 */
export const getCart = async (): Promise<Cart> => {
  try {
    const response = await apiClient.get<Cart>('/cart');
    return response;
  } catch (error) {
    console.error('[Cart API] Error getting cart:', error);
    throw error;
  }
};

/**
 * Add item to cart
 * @param cartId - The cart ID
 * @param productId - The product ID
 * @param quantity - The quantity to add
 * @param variantId - Optional variant ID
 * @returns Promise<Cart> The updated cart
 */
export const addToCart = async (
  cartId: string,
  productId: string,
  quantity: number,
  variantId?: string | null
): Promise<Cart> => {
  try {
    const request: AddToCartRequest = {
      cartId,
      productId,
      quantity,
    };
    // Only include variantId if it has a valid value (not null or undefined)
    if (variantId) {
      request.variantId = variantId;
    }
    const response = await apiClient.post<Cart>('/cart/items', request);
    return response;
  } catch (error) {
    console.error('[Cart API] Error adding to cart:', error);
    throw error;
  }
};

/**
 * Update cart item
 * @param itemId - The cart item ID
 * @param data - The update data
 * @returns Promise<Cart> The updated cart
 */
export const updateCartItem = async (
  itemId: string,
  data: UpdateCartItemRequest
): Promise<Cart> => {
  try {
    const response = await apiClient.patch<Cart>(`/cart/items/${itemId}`, data);
    return response;
  } catch (error) {
    console.error('[Cart API] Error updating cart item:', error);
    throw error;
  }
};

/**
 * Remove cart item
 * @param itemId - The cart item ID
 * @returns Promise<Cart> The updated cart
 */
export const removeCartItem = async (itemId: string): Promise<Cart> => {
  try {
    const response = await apiClient.delete<Cart>(`/cart/items/${itemId}`);
    return response;
  } catch (error) {
    console.error('[Cart API] Error removing cart item:', error);
    throw error;
  }
};

/**
 * Update cart item quantity
 * @param itemId - The cart item ID
 * @param quantity - The new quantity
 * @returns Promise<Cart> The updated cart
 */
export const updateCartItemQuantity = async (
  itemId: string,
  quantity: number
): Promise<Cart> => {
  try {
    const request: UpdateCartItemQuantityRequest = { quantity };
    const response = await apiClient.patch<Cart>(`/cart/items/${itemId}/quantity`, request);
    return response;
  } catch (error) {
    console.error('[Cart API] Error updating cart item quantity:', error);
    throw error;
  }
};

/**
 * Get cart summary
 * @returns Promise<CartSummary> The cart summary
 */
export const getCartSummary = async (): Promise<CartSummary> => {
  try {
    const response = await apiClient.get<CartSummary>('/cart/summary');
    return response;
  } catch (error) {
    console.error('[Cart API] Error getting cart summary:', error);
    throw error;
  }
};

/**
 * Merge guest cart on login
 * @param sessionId - The guest session ID
 * @param items - Guest cart items to merge
 * @param idempotencyKey - Optional idempotency key to prevent duplicate merges
 * @returns Promise<Cart> The merged cart
 *
 * FIXED: Added idempotency key support to prevent duplicate merges
 */
export const mergeGuestCart = async (
  sessionId: string,
  items?: GuestCartItem[],
  idempotencyKey?: string
): Promise<Cart> => {
  try {
    // Backend expects 'guestSessionId' field, not 'sessionId'
    const request: MergeGuestCartRequest & { idempotencyKey?: string } = {
      guestSessionId: sessionId,
      items: items || []
    };
    
    // Add idempotency key if provided
    if (idempotencyKey) {
      request.idempotencyKey = idempotencyKey;
    }
    
    const response = await apiClient.post<Cart>('/cart/merge', request);
    return response;
  } catch (error) {
    console.error('[Cart API] Error merging guest cart:', error);
    throw error;
  }
};

/**
 * Clear cart
 * @returns Promise<Cart> The cleared cart
 */
export const clearCart = async (): Promise<Cart> => {
  try {
    const response = await apiClient.delete<Cart>('/cart');
    return response;
  } catch (error) {
    console.error('[Cart API] Error clearing cart:', error);
    throw error;
  }
};

/**
 * Validate cart stock
 * @returns Promise<ValidateCartResponse> The validation response
 */
export const validateCart = async (): Promise<ValidateCartResponse> => {
  try {
    const response = await apiClient.get<ValidateCartResponse>('/cart/validate');
    return response;
  } catch (error) {
    console.error('[Cart API] Error validating cart:', error);
    throw error;
  }
};

/**
 * Apply discount code to cart
 * @param code - The discount code
 * @returns Promise<Cart> The updated cart
 */
export const applyDiscount = async (code: string): Promise<Cart> => {
  try {
    const request: ApplyDiscountRequest = { code };
    const response = await apiClient.post<Cart>('/cart/discount', request);
    return response;
  } catch (error) {
    console.error('[Cart API] Error applying discount:', error);
    throw error;
  }
};

/**
 * Remove discount from cart
 * @returns Promise<Cart> The updated cart
 */
export const removeDiscount = async (): Promise<Cart> => {
  try {
    const response = await apiClient.delete<Cart>('/cart/discount');
    return response;
  } catch (error) {
    console.error('[Cart API] Error removing discount:', error);
    throw error;
  }
};

/**
 * Set shipping method
 * @param method - The shipping method
 * @returns Promise<Cart> The updated cart
 */
export const setShippingMethod = async (method: string): Promise<Cart> => {
  try {
    const request: SetShippingMethodRequest = { method: method as any };
    const response = await apiClient.post<Cart>('/cart/shipping', request);
    return response;
  } catch (error) {
    console.error('[Cart API] Error setting shipping method:', error);
    throw error;
  }
};

/**
 * Get guest cart products
 * @param productIds - Array of product IDs
 * @returns Promise<Product[]> The products with details
 */
export const getGuestCartProducts = async (productIds: string[]): Promise<any> => {
  try {
    const response = await apiClient.post('/cart/guest/products', { productIds });
    return response;
  } catch (error) {
    console.error('[Cart API] Error getting guest cart products:', error);
    throw error;
  }
};

/**
 * Validate guest cart
 * @param items - Guest cart items to validate
 * @returns Promise<ValidateCartResponse> The validation result
 */
export const validateGuestCart = async (items: GuestCartItem[]): Promise<ValidateCartResponse> => {
  try {
    const response = await apiClient.post<ValidateCartResponse>('/cart/guest/validate', { items });
    return response;
  } catch (error) {
    console.error('[Cart API] Error validating guest cart:', error);
    throw error;
  }
};

/**
 * Get cart item count
 * @returns Promise<number> The total number of items in the cart
 */
export const getCartCount = async (): Promise<number> => {
  try {
    const response = await apiClient.request<{ itemCount: number }>(
      '/cart/count',
      {
        method: 'GET'
      }
    );
    
    if (typeof response.itemCount === 'number') {
      return response.itemCount;
    }
    return 0;
  } catch (error) {
    console.error('[Cart API] Error fetching cart count:', error);
    return 0;
  }
};

/**
 * Validate stock for guest cart item before adding
 * @param productId - The product ID
 * @param quantity - The quantity to validate
 * @param variantId - Optional variant ID
 * @returns Promise<boolean> True if stock is available
 */
export async function validateGuestCartStock(
  productId: string,
  quantity: number,
  variantId?: string
): Promise<boolean> {
  try {
    const response = await apiClient.request<{ available: boolean }>(
      '/cart/guest/validate-stock',
      {
        method: 'POST',
        body: {
          items: [{ productId, quantity, variantId }]
        }
      }
    );
    
    return response.available ?? true;
  } catch (error) {
    console.error('[Cart API] Stock validation failed:', error);
    return true; // Allow on error to avoid blocking
  }
}

/**
 * Create or update guest cart on backend
 * @param items - Guest cart items
 * @param sessionId - Guest session ID
 * @returns Promise<Cart> The created/updated cart
 */
export async function createOrUpdateGuestCartBackend(
  items: GuestCartItem[],
  sessionId: string
): Promise<Cart> {
  try {
    const response = await apiClient.request<Cart>(
      '/cart/guest',
      {
        method: 'POST',
        body: { items, sessionId }
      }
    );
    
    return response;
  } catch (error) {
    console.error('[Cart API] Failed to sync guest cart:', error);
    throw error;
  }
}

/**
 * Get guest session ID from both localStorage and cookies
 * @returns Guest session ID or null if not found
 */
export function getGuestSessionIdUtil(): string | null {
  if (typeof window === 'undefined') {
    return null;
  }
  
  // Try localStorage first
  const localStorageId = localStorage.getItem('smart_tech_guest_session');
  if (localStorageId) return localStorageId;
  
  // Fallback to cookie
  const match = document.cookie.match(/smart_tech_guest_session=([^;]+)/);
  return match ? match[1] : null;
}

/**
 * Set guest session ID in both localStorage and cookies
 * @param sessionId - Guest session ID to store
 */
export function setGuestSessionIdCookie(sessionId: string): void {
  if (typeof window === 'undefined') {
    return;
  }
  
  const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
  document.cookie = `smart_tech_guest_session=${sessionId};expires=${expires.toUTCString()};path=/;SameSite=Lax`;
}

export default {
  getCart,
  addToCart,
  updateCartItem,
  removeCartItem,
  updateCartItemQuantity,
  getCartSummary,
  mergeGuestCart,
  clearCart,
  validateCart,
  applyDiscount,
  removeDiscount,
  setShippingMethod,
  getGuestCartProducts,
  validateGuestCart,
  getCartCount,
  validateGuestCartStock,
  createOrUpdateGuestCartBackend,
  getGuestSessionIdUtil,
  setGuestSessionIdCookie,
  // Stock validation APIs
  checkStockAvailability,
  reserveStock,
  releaseStock,
  validateCartStock,
  getProductStockStatus,
  getBackorderConfig,
  checkBackorderEligibility,
  extendCartReservations,
};

// ============================================================================
// Stock Validation APIs (STOCK-001)
// ============================================================================

/**
 * Check stock availability for a product
 */
export async function checkStockAvailability(
  productId: string,
  quantity: number,
  variantId?: string | null,
  cartId?: string
): Promise<{
  available: boolean;
  currentStock: number;
  availableForSale: number;
  backorderAllowed: boolean;
  backorderQuantity: number;
  error?: string;
}> {
  try {
    const response = await apiClient.request<{
      available: boolean;
      currentStock: number;
      availableForSale: number;
      backorderAllowed: boolean;
      backorderQuantity: number;
      error?: string;
    }>(
      '/cart/stock/check',
      {
        method: 'POST',
        body: { productId, quantity, variantId, cartId }
      }
    );
    
    return response;
  } catch (error) {
    console.error('[Cart API] Stock availability check failed:', error);
    throw error;
  }
}

/**
 * Reserve stock for a cart item
 */
export async function reserveStock(
  productId: string,
  quantity: number,
  cartId: string,
  variantId?: string | null
): Promise<{
  success: boolean;
  reservationId?: string;
  expiresAt?: string;
  error?: string;
}> {
  try {
    const response = await apiClient.request<{
      success: boolean;
      reservationId?: string;
      expiresAt?: string;
    }>(
      '/cart/stock/reserve',
      {
        method: 'POST',
        body: { productId, quantity, cartId, variantId }
      }
    );
    
    return {
      success: response.success,
      reservationId: response.reservationId,
      expiresAt: response.expiresAt,
    };
  } catch (error: any) {
    console.error('[Cart API] Stock reservation failed:', error);
    return { success: false, error: String(error) };
  }
}

/**
 * Release a stock reservation
 */
export async function releaseStock(reservationId: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const response = await apiClient.request<{ success: boolean }>(
      `/cart/stock/release/${reservationId}`,
      {
        method: 'POST'
      }
    );
    
    return { success: response.success };
  } catch (error: any) {
    console.error('[Cart API] Release stock failed:', error);
    return { success: false, error: String(error) };
  }
}

/**
 * Validate entire cart stock
 */
export async function validateCartStock(): Promise<{
  isValid: boolean;
  validationResults: Array<{
    cartItemId: string;
    productId: string;
    variantId?: string;
    requestedQuantity: number;
    availableStock: number;
    isAvailable: boolean;
    error?: string;
  }>;
}> {
  try {
    const response = await apiClient.request<{
      isValid: boolean;
      validationResults: Array<{
        cartItemId: string;
        productId: string;
        variantId?: string;
        requestedQuantity: number;
        availableStock: number;
        isAvailable: boolean;
        error?: string;
      }>;
    }>(
      '/cart/stock/validate',
      {
        method: 'POST'
      }
    );
    
    return response;
  } catch (error) {
    console.error('[Cart API] Cart stock validation failed:', error);
    throw error;
  }
}

/**
 * Get product stock status for display
 */
export async function getProductStockStatus(
  productId: string,
  variantId?: string | null
): Promise<{
  status: 'in_stock' | 'low_stock' | 'out_of_stock' | 'backorder';
  statusText: string;
  statusColor: 'green' | 'orange' | 'red';
  quantity: number;
  maxQuantity: number;
  allowBackorder: boolean;
  currentStock: number;
}> {
  try {
    const endpoint = variantId
      ? `/cart/stock/status/${productId}?variantId=${variantId}`
      : `/cart/stock/status/${productId}`;
    
    const response = await apiClient.request<{
      status: 'in_stock' | 'low_stock' | 'out_of_stock' | 'backorder';
      statusText: string;
      statusColor: 'green' | 'orange' | 'red';
      quantity: number;
      maxQuantity: number;
      allowBackorder: boolean;
      currentStock: number;
    }>(
      endpoint,
      {
        method: 'GET'
      }
    );
    
    return response;
  } catch (error) {
    console.error('[Cart API] Get stock status failed:', error);
    throw error;
  }
}

// ============================================================================
// Backorder Configuration APIs (STOCK-002)
// ============================================================================

/**
 * Get backorder configuration
 */
export async function getBackorderConfig(): Promise<{
  enabled: boolean;
  maxQuantity: number;
  reservationExpiry: number;
}> {
  try {
    const response = await apiClient.request<{
      enabled: boolean;
      maxQuantity: number;
      reservationExpiry: number;
    }>(
      '/cart/backorder/config',
      {
        method: 'GET'
      }
    );
    
    return response;
  } catch (error) {
    console.error('[Cart API] Get backorder config failed:', error);
    throw error;
  }
}

/**
 * Check backorder eligibility for a product
 */
export async function checkBackorderEligibility(
  productId: string,
  variantId?: string | null
): Promise<{
  allowed: boolean;
  configured: boolean;
  productAllowsBackorder: boolean;
  maxBackorderQuantity: number;
}> {
  try {
    const endpoint = variantId
      ? `/cart/backorder/eligibility/${productId}?variantId=${variantId}`
      : `/cart/backorder/eligibility/${productId}`;
    
    const response = await apiClient.request<{
      allowed: boolean;
      configured: boolean;
      productAllowsBackorder: boolean;
      maxBackorderQuantity: number;
    }>(
      endpoint,
      {
        method: 'GET'
      }
    );
    
    return response;
  } catch (error) {
    console.error('[Cart API] Check backorder eligibility failed:', error);
    throw error;
  }
}

/**
 * Extend cart stock reservations (called on cart activity)
 */
export async function extendCartReservations(): Promise<{
  success: boolean;
  extendedCount: number;
  newExpiry: string;
}> {
  try {
    const response = await apiClient.request<{
      success: boolean;
      extendedCount: number;
      newExpiry: string;
    }>(
      '/cart/stock/extend',
      {
        method: 'POST'
      }
    );
    
    return response;
  } catch (error) {
    console.error('[Cart API] Extend reservations failed:', error);
    throw error;
  }
}
