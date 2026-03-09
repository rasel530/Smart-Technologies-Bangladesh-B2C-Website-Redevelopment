/**
 * Guest Cart Storage Utilities
 *
 * This module provides utilities for managing guest cart data in localStorage.
 * It handles loading, saving, validating, and clearing guest cart data.
 */

// localStorage keys
const GUEST_CART_KEY = 'smart_tech_guest_cart';
const GUEST_SESSION_KEY = 'smart_tech_guest_session';
const GUEST_CART_VERSION = '1';

// LOW-001: Environment-aware logging
const isDevelopment = process.env.NODE_ENV === 'development';

function debugLog(...args: any[]): void {
  if (isDevelopment) {
    console.log('[GuestCart]', ...args);
  }
}

function debugWarn(...args: any[]): void {
  if (isDevelopment) {
    console.warn('[GuestCart]', ...args);
  }
}

function debugError(...args: any[]): void {
  if (isDevelopment) {
    console.error('[GuestCart]', ...args);
  }
}

/**
 * Guest cart item with minimal data
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
 * Updated ShippingMethod to match backend: STANDARD, EXPRESS, INSIDE_DHAKA, OUTSIDE_DHAKA
 */
export interface GuestCartStorageData {
  cartId?: string;  // Real database cart ID (returned by backend)
  sessionId: string;
  items: GuestCartItem[];
  shippingMethod: 'STANDARD' | 'EXPRESS' | 'INSIDE_DHAKA' | 'OUTSIDE_DHAKA';
  discountCode: string | null;
  expiresAt: string; // ISO 8601 timestamp
  createdAt: string;
  updatedAt: string;
  version: string;
  priceValidatedAt?: string;  // NEW: When prices were last validated
  priceValidFor?: number;    // NEW: How long price is valid (seconds)
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
 * Helper function to validate if a string is a valid UUID
 * FIX 2: Validate cartId is a real database UUID, not a temporary sessionId
 */
function isValidUUID(id: string | undefined): boolean {
  if (!id) return false;
  // UUID v4 format: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(id);
}

/**
 * Load guest cart from localStorage with validation
 * FIX 2: Add validation to ensure cartId is a valid UUID
 * @returns Guest cart data or null if not found, expired, or invalid
 */
export function loadGuestCartFromStorage(): GuestCartStorageData | null {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const data = localStorage.getItem(GUEST_CART_KEY);
    if (!data) {
      debugLog('No guest cart found in localStorage');
      return null;
    }

    const cart = JSON.parse(data) as GuestCartStorageData;

    // Check version - migrate if needed
    if (cart.version !== GUEST_CART_VERSION) {
      debugLog('Cart version mismatch, migrating...');
      migrateGuestCart(cart);
      return loadGuestCartFromStorage(); // Reload after migration
    }

    // Validate expiration
    if (new Date(cart.expiresAt) < new Date()) {
      debugLog('Cart expired, clearing');
      clearGuestCartFromStorage();
      return null;
    }

    // Validate structure
    if (!cart.sessionId || !Array.isArray(cart.items)) {
      debugError('Invalid cart structure, clearing');
      clearGuestCartFromStorage();
      return null;
    }

    // FIX 2: Validate cartId if present - ensure it's a valid UUID
    if (cart.cartId && !isValidUUID(cart.cartId)) {
      debugWarn('Invalid cartId format (not a UUID):', cart.cartId);
      // Remove invalid cartId to prevent using it
      delete cart.cartId;
      saveGuestCartToStorage(cart);
      debugLog('Removed invalid cartId from storage');
    }

    // FIX 2: Log cartId status for debugging
    if (cart.cartId) {
      debugLog('Valid cartId found in storage:', cart.cartId);
    } else {
      debugLog('No cartId in storage (only sessionId available):', cart.sessionId);
    }

    // Validate items
    const validItems = cart.items.filter(item => {
      return item.productId && typeof item.quantity === 'number' && item.quantity > 0;
    });

    if (validItems.length !== cart.items.length) {
      debugWarn('Removed invalid items from cart');
      cart.items = validItems;
      saveGuestCartToStorage(cart);
    }

    return cart;
  } catch (error) {
    debugError('Error loading from storage:', error);
    clearGuestCartFromStorage();
    return null;
  }
}

/**
 * Save guest cart to localStorage
 * FIX 2: Validate cartId before saving and add detailed logging
 * @param data - Guest cart data to save
 */
export function saveGuestCartToStorage(data: GuestCartStorageData): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    // FIX 2: Validate cartId if present - ensure it's a valid UUID
    if (data.cartId && !isValidUUID(data.cartId)) {
      debugError('Attempted to save invalid cartId:', data.cartId);
      // Remove invalid cartId to prevent using it
      delete data.cartId;
      debugLog('Removed invalid cartId before saving');
    }

    // Update timestamp
    data.updatedAt = new Date().toISOString();
    data.version = GUEST_CART_VERSION;

    const jsonString = JSON.stringify(data);
    localStorage.setItem(GUEST_CART_KEY, jsonString);

    // Dispatch custom event for cross-tab sync
    window.dispatchEvent(new CustomEvent('guest-cart-updated', {
      detail: { items: data.items, sessionId: data.sessionId }
    }));

    // FIX 2: Add detailed logging including cartId status
    debugLog('Cart saved successfully', {
      itemCount: data.items.length,
      sessionId: data.sessionId,
      hasCartId: !!data.cartId,
      cartId: data.cartId || 'none'
    });
  } catch (error: any) {
    debugError('Error saving to storage:', error);

    // Handle quota exceeded
    if (error.name === 'QuotaExceededError' || error.code === 22) {
      debugWarn('Storage quota exceeded, attempting to recover');
      handleQuotaExceeded(data);
    }
  }
}

/**
 * Clear guest cart from localStorage
 */
export function clearGuestCartFromStorage(): void {
  if (typeof window === 'undefined') {
    return;
  }

  localStorage.removeItem(GUEST_CART_KEY);
  localStorage.removeItem(GUEST_SESSION_KEY);

  window.dispatchEvent(new Event('guest-cart-cleared'));

  debugLog('Cart cleared from storage');
}

/**
 * Get guest session ID from cookie
 * @returns Guest session ID or null if not found
 */
export function getGuestSessionIdFromCookie(): string | null {
  if (typeof window === 'undefined') {
    return null;
  }

  const match = document.cookie.match(/smart_tech_guest_session=([^;]+)/);
  return match ? match[1] : null;
}

/**
 * Get guest session ID from localStorage
 * @returns Guest session ID or null if not found
 */
export function getGuestSessionId(): string | null {
  if (typeof window === 'undefined') {
    return null;
  }

  return localStorage.getItem(GUEST_SESSION_KEY);
}

/**
 * Get guest session ID from both localStorage and cookies
 * Tries localStorage first, falls back to cookie
 * @returns Guest session ID or null if not found
 */
export function getGuestSessionIdUtil(): string | null {
  if (typeof window === 'undefined') {
    return null;
  }

  // Try localStorage first
  const localStorageId = localStorage.getItem(GUEST_SESSION_KEY);
  if (localStorageId) return localStorageId;

  // Fallback to cookie
  return getGuestSessionIdFromCookie();
}

/**
 * Set guest session ID in localStorage
 * @param sessionId - Guest session ID to store
 */
export function setGuestSessionId(sessionId: string): void {
  if (typeof window === 'undefined') {
    return;
  }

  localStorage.setItem(GUEST_SESSION_KEY, sessionId);
  debugLog('Session ID stored:', sessionId);
}

/**
 * Set guest session ID in cookie
 * @param sessionId - Guest session ID to store
 */
export function setGuestSessionIdCookie(sessionId: string): void {
  if (typeof window === 'undefined') {
    return;
  }

  const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
  document.cookie = `smart_tech_guest_session=${sessionId};expires=${expires.toUTCString()};path=/;SameSite=Lax`;
  debugLog('Session ID cookie set:', sessionId);
}

/**
 * Set guest session ID in both localStorage and cookies
 * @param sessionId - Guest session ID to store
 */
export function setGuestSessionIdUtil(sessionId: string): void {
  setGuestSessionId(sessionId);
  setGuestSessionIdCookie(sessionId);
}

/**
 * Remove guest session ID from localStorage
 */
export function removeGuestSessionId(): void {
  if (typeof window === 'undefined') {
    return;
  }

  localStorage.removeItem(GUEST_SESSION_KEY);
  debugLog('Session ID removed');
}

/**
 * Generate guest session ID
 * FIX 2: Generate proper UUID format to match backend validation
 * @returns Unique guest session ID in UUID format
 */
export function generateGuestSessionId(): string {
  // FIX 2: Use crypto.randomUUID() for modern browsers
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback for older browsers
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

/**
 * Create empty guest cart data structure
 * @param sessionId - Guest session ID
 * @returns Empty guest cart data
 */
export function createEmptyGuestCart(sessionId: string): GuestCartStorageData {
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days

  return {
    sessionId,
    items: [],
    shippingMethod: 'STANDARD',
    discountCode: null,
    expiresAt: expiresAt.toISOString(),
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
    version: GUEST_CART_VERSION
  };
}

/**
 * Add item to guest cart
 * @param cart - Current guest cart data
 * @param productId - Product ID
 * @param quantity - Quantity to add
 * @param variantId - Optional variant ID
 * @param price - Product price
 * @returns Updated guest cart data
 */
export function addItemToGuestCart(
  cart: GuestCartStorageData,
  productId: string,
  quantity: number,
  variantId: string | null,
  price: number
): GuestCartStorageData {
  const existingItem = cart.items.find(
    item => item.productId === productId && item.variantId === variantId
  );

  if (existingItem) {
    // Update existing item quantity
    existingItem.quantity += quantity;
  } else {
    // Add new item
    cart.items.push({
      productId,
      quantity,
      variantId,
      price,
      addedAt: new Date().toISOString()
    });
  }

  return cart;
}

/**
 * Remove item from guest cart
 * @param cart - Current guest cart data
 * @param productId - Product ID
 * @param variantId - Optional variant ID
 * @returns Updated guest cart data
 */
export function removeItemFromGuestCart(
  cart: GuestCartStorageData,
  productId: string,
  variantId: string | null
): GuestCartStorageData {
  cart.items = cart.items.filter(
    item => !(item.productId === productId && item.variantId === variantId)
  );

  return cart;
}

/**
 * Update item quantity in guest cart
 * @param cart - Current guest cart data
 * @param productId - Product ID
 * @param variantId - Optional variant ID
 * @param quantity - New quantity
 * @returns Updated guest cart data
 */
export function updateItemQuantityInGuestCart(
  cart: GuestCartStorageData,
  productId: string,
  variantId: string | null,
  quantity: number
): GuestCartStorageData {
  const item = cart.items.find(
    item => item.productId === productId && item.variantId === variantId
  );

  if (item) {
    item.quantity = quantity;
  }

  return cart;
}

/**
 * Handle localStorage quota exceeded error
 * @param data - Cart data that failed to save
 */
function handleQuotaExceeded(data: GuestCartStorageData): void {
  try {
    // If still failing, remove oldest items
    if (data.items.length > 5) {
      const reducedData = {
        ...data,
        items: data.items.slice(0, 5)
      };

      localStorage.setItem(GUEST_CART_KEY, JSON.stringify(reducedData));
      debugWarn('Saved reduced cart (removed oldest items)');
    } else {
      debugError('Cannot save cart even with minimal data');
      clearGuestCartFromStorage();
    }
  } catch (error) {
    debugError('Error handling quota exceeded:', error);
    clearGuestCartFromStorage();
  }
}

/**
 * Migrate legacy guest cart format to new format
 * @param legacyData - Legacy cart data
 */
function migrateGuestCart(legacyData: any): void {
  debugLog('Migrating guest cart from legacy format');

  try {
    const newFormat: GuestCartStorageData = {
      sessionId: legacyData.sessionId || generateGuestSessionId(),
      items: legacyData.items || [],
      shippingMethod: legacyData.shippingMethod || 'STANDARD',
      discountCode: legacyData.discountCode || null,
      expiresAt: legacyData.expiresAt || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      createdAt: legacyData.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      version: GUEST_CART_VERSION
    };

    saveGuestCartToStorage(newFormat);
    debugLog('Migration completed successfully');
  } catch (error) {
    debugError('Migration failed:', error);
    clearGuestCartFromStorage();
  }
}

/**
 * Listen for guest cart updates from other tabs
 * @param callback - Callback function to execute on update
 * @returns Cleanup function
 */
export function listenForGuestCartUpdates(
  callback: (data: { items: GuestCartItem[]; sessionId: string }) => void
): () => void {
  const handler = (event: Event) => {
    const customEvent = event as CustomEvent;
    callback(customEvent.detail);
  };

  window.addEventListener('guest-cart-updated', handler);

  return () => {
    window.removeEventListener('guest-cart-updated', handler);
  };
}

/**
 * Listen for guest cart clear events from other tabs
 * @param callback - Callback function to execute on clear
 * @returns Cleanup function
 */
export function listenForGuestCartClear(callback: () => void): () => void {
  const handler = () => {
    callback();
  };

  window.addEventListener('guest-cart-cleared', handler);

  return () => {
    window.removeEventListener('guest-cart-cleared', handler);
  };
}

// API base URL from environment variable - CRIT-005: Standardized to match cart.ts (backend runs on port 3001)
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

/**
 * Get auth headers for API requests
 */
function getAuthHeaders(): HeadersInit {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  
  // Add auth token if available
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('auth_token');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }
  
  return headers;
}

/**
 * Validate guest cart prices against backend
 * @param items - Cart items to validate
 * @returns Validation result with updated items and warnings
 */
export async function validateGuestCartPrices(
  items: GuestCartItem[]
): Promise<{ valid: boolean; updatedItems?: GuestCartItem[]; warnings?: string[] }> {
  try {
    const response = await fetch(`${API_BASE_URL}/cart/guest/validate-prices`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ items }),
    });
    
    if (!response.ok) {
      return { valid: false };
    }
    
    const data = await response.json();
    return {
      valid: true,
      updatedItems: data.data.updatedItems,
      warnings: data.data.warnings
    };
  } catch (error) {
    debugError('Price validation failed:', error);
    return { valid: true }; // Allow on error
  }
}

/**
 * Generate guest session ID with retry mechanism
 * @param maxRetries - Maximum number of retry attempts
 * @returns Guest session ID
 */
export async function generateGuestSessionIdWithRetry(
  maxRetries: number = 3
): Promise<string> {
  let lastError: Error | null = null;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      // Try localStorage first
      let sessionId = localStorage.getItem('smart_tech_guest_session');
      if (sessionId) return sessionId;
      
      // Generate new ID
      sessionId = generateGuestSessionId();
      
      // Test write
      localStorage.setItem('test_write', sessionId);
      const testRead = localStorage.getItem('test_write');
      localStorage.removeItem('test_write');
      
      if (testRead === sessionId) {
        // Success - save and return
        setGuestSessionIdUtil(sessionId);
        return sessionId;
      }
      
      throw new Error('Storage write verification failed');
    } catch (error) {
      lastError = error as Error;
      debugWarn(`Session generation attempt ${attempt} failed:`, error);
      
      if (attempt < maxRetries) {
        // Exponential backoff: 100ms, 200ms, 400ms
        await new Promise(resolve => 
          setTimeout(resolve, Math.pow(2, attempt - 1) * 100)
        );
      }
    }
  }
  
  // Fallback: use sessionStorage as last resort
  try {
    let sessionId = sessionStorage.getItem('smart_tech_guest_session');
    if (!sessionId) {
      sessionId = generateGuestSessionId();
      sessionStorage.setItem('smart_tech_guest_session', sessionId);
    }
    return sessionId;
  } catch (e) {
    // Final fallback: generate in-memory only
    debugWarn('All storage mechanisms failed, using in-memory session');
    return generateGuestSessionId();
  }
}

// MED-001: Handle storage error with toast notification
// Note: Toast import is done in CartContext to avoid circular dependencies
let toastErrorCallback: ((message: string) => void) | null = null;

export function setToastErrorCallback(callback: (message: string) => void): void {
  toastErrorCallback = callback;
}

export function handleStorageError(error: Error, operation: string): void {
  debugError(`localStorage ${operation} failed:`, error);
  
  // Show toast notification
  if (toastErrorCallback) {
    toastErrorCallback(`Failed to save cart: ${operation} failed. Please try again.`);
  }
}

// MED-001: Recover from storage quota by removing oldest items
export function recoverFromStorageQuota(data: GuestCartStorageData): GuestCartStorageData {
  // Sort items by addedAt (oldest first) and keep only the most recent ones
  const sortedItems = [...data.items].sort((a, b) => {
    const dateA = new Date(a.addedAt).getTime();
    const dateB = new Date(b.addedAt).getTime();
    return dateA - dateB;
  });
  
  // Keep at most 5 items (adjust based on typical product data size)
  const maxItems = 5;
  const recoveredItems = sortedItems.slice(-maxItems);
  
  return {
    ...data,
    items: recoveredItems,
    updatedAt: new Date().toISOString()
  };
}

// MED-001: Save guest cart with error handling and recovery
export function saveGuestCartWithErrorHandling(
  data: GuestCartStorageData
): boolean {
  try {
    saveGuestCartToStorage(data);
    return true;
  } catch (error) {
    handleStorageError(error as Error, 'save');
    
    // Try to recover by clearing oldest items
    try {
      const recovered = recoverFromStorageQuota(data);
      saveGuestCartToStorage(recovered);
      debugLog('Cart recovered by removing old items');
      return true;
    } catch {
      debugError('Unable to save cart. Cart may be cleared on page refresh.');
      return false;
    }
  }
}

// MED-002: Validate item for addition to cart (product availability check)
export interface ValidationResult {
  valid: boolean;
  message?: string;
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
  variant?: {
    id: string;
    name: string;
    price: number;
    stock: number;
  };
}

export async function validateItemForAddition(
  productId: string,
  quantity: number,
  variantId?: string
): Promise<ValidationResult> {
  try {
    const response = await fetch(`${API_BASE_URL}/products/${productId}/availability`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ quantity, variantId }),
    });
    
    if (!response.ok) {
      const error = await response.json();
      return { valid: false, message: error.message || 'Product unavailable' };
    }
    
    const data = await response.json();
    return { valid: true, product: data.data };
  } catch (error) {
    debugError('Item validation failed:', error);
    return { valid: true }; // Allow on error (fail open)
  }
}

// MED-004: Consent management for guest cart tracking
const CART_CONSENT_KEY = 'smart_tech_cart_consent';

export function hasCartConsent(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }
  return localStorage.getItem(CART_CONSENT_KEY) === 'true';
}

export function grantCartConsent(): void {
  if (typeof window === 'undefined') {
    return;
  }
  localStorage.setItem(CART_CONSENT_KEY, 'true');
  debugLog('Cart consent granted');
}

export function revokeCartConsent(): void {
  if (typeof window === 'undefined') {
    return;
  }
  localStorage.removeItem(CART_CONSENT_KEY);
  debugLog('Cart consent revoked');
}
