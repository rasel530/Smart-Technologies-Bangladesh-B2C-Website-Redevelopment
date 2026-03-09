'use client';

import React, { useEffect, useState, ReactNode, useCallback } from 'react';
import { create } from 'zustand';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useAuth } from './AuthContext';
import {
  Cart,
  CartItem,
  CartSummary,
  CartContextType,
  CartContextState,
  CartStorageData,
  ShippingMethod,
  ValidateCartResponse,
  GuestCartItem,
  GuestCartItemWithProduct,
  GuestCartStorageData,
  InvalidItem,
} from '@/types/cart';
import { Product } from '@/types/product';
import cartApi, { getCartCount, validateGuestCartStock, createOrUpdateGuestCartBackend, getGuestCartProducts } from '@/lib/api/cart';
import { getProductPrice, hasValidDiscount } from '@/lib/utils/price';
import {
  loadGuestCartFromStorage as loadGuestCartFromStorageUtil,
  saveGuestCartToStorage as saveGuestCartToStorageUtil,
  saveGuestCartWithErrorHandling,
  clearGuestCartFromStorage as clearGuestCartFromStorageUtil,
  getGuestSessionId as getGuestSessionIdUtil,
  setGuestSessionId as setGuestSessionIdUtil,
  removeGuestSessionId as removeGuestSessionIdUtil,
  generateGuestSessionId as generateGuestSessionIdUtil,
  createEmptyGuestCart as createEmptyGuestCartUtil,
  addItemToGuestCart as addItemToGuestCartUtil,
  removeItemFromGuestCart as removeItemFromGuestCartUtil,
  updateItemQuantityInGuestCart as updateItemQuantityInGuestCartUtil,
  listenForGuestCartUpdates,
  listenForGuestCartClear,
  hasCartConsent,
  grantCartConsent,
  setToastErrorCallback,
} from '@/lib/utils/guestCart';

// Note: Guest cart utilities are now imported from '@/lib/utils/guestCart'

// Track previous user to detect logout/login
let previousUserId: string | null = null;

/**
 * Custom logger for cart operations
 */
const cartLogger = {
  info: (message: string, data?: Record<string, unknown>) => {
    console.log(`[CartContext] ${message}`, data || '');
  },
  warn: (message: string, data?: Record<string, unknown>) => {
    console.warn(`[CartContext] ${message}`, data || '');
  },
  error: (message: string, data?: Record<string, unknown>) => {
    console.error(`[CartContext] ${message}`, data || '');
  }
};

/**
 * Validate if a string is a valid UUID
 */
const isValidUUID = (str: string | null | undefined): boolean => {
  if (!str) return false;
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
};

/**
 * Zustand Store for Cart State Management
 * 
 * This store manages all cart-related state including:
 * - Cart items and summary
 * - Loading and error states
 * - Guest session management
 * - Shipping and discount information
 */
interface CartStore extends CartContextState {
  // Additional state
  cart: Cart | null;
  isMerging: boolean;
    
  // Actions
  setCart: (cart: Cart | null) => void;
  setIsLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  setShippingMethod: (method: string, cost: number) => void;
  setDiscountCode: (code: string | null) => void;
  setSessionId: (sessionId: string | null) => void;
  setIsGuest: (isGuest: boolean) => void;
  setIsMerging: (isMerging: boolean) => void;
  setIsInitializing: (isInitializing: boolean) => void;
  setCartId: (cartId: string | null) => void;
    
  // Cart actions (user is passed from the provider)
  addItem: (product: Product, quantity?: number, variantId?: string | null, user?: any, options?: { onSuccess?: (cart: Cart) => void; navigateToCart?: boolean }) => Promise<void>;
  removeItem: (itemId: string, user?: any, options?: { onSuccess?: (cart: Cart) => void }) => Promise<void>;
  updateQuantity: (itemId: string, quantity: number, user?: any, options?: { onSuccess?: (cart: Cart) => void }) => Promise<void>;
  clearCart: (user?: any, options?: { onSuccess?: () => void }) => Promise<void>;
  applyDiscount: (code: string, user?: any, options?: { onSuccess?: (cart: Cart) => void }) => Promise<void>;
  removeDiscount: (user?: any, options?: { onSuccess?: (cart: Cart) => void }) => void;
  loadCart: (user?: any) => Promise<void>;
  mergeGuestCart: (sessionId: string) => Promise<void>;
  validateCart: () => Promise<ValidateCartResponse>;
  fetchCartCount: () => Promise<void>;
    
  // Initialize cart
  initializeCart: (user: any) => Promise<void>;
}

// Initial state
const initialState: CartContextState = {
  items: [],
  itemCount: 0,
  subtotal: 0,
  tax: 0,
  shippingCost: 0,
  discount: 0,
  total: 0,
  isLoading: false,
  error: null,
  shippingMethod: 'STANDARD',
  discountCode: null,
  isGuest: true,
  sessionId: null,
  isInitializing: true,  // Start as initializing
  cartId: null,  // Cart ID for checkout initialization
};

// Create Zustand store
export const useCartStore = create<CartStore>((set, get) => ({
  ...initialState,
  cart: null,
  isMerging: false,
  
  // Setters
  setCart: (cart) => {
    // Ensure all numeric values are converted to numbers to prevent toFixed() errors
    set({
      cart: cart,  // CRITICAL: Set the cart property itself
      cartId: cart?.id || null,  // Set cartId from cart object
      items: cart?.items || [],
      itemCount: (cart?.items || []).reduce((sum, item) => sum + item.quantity, 0) || 0,
      subtotal: Number(cart?.subtotal) || 0,
      tax: Number(cart?.tax) || 0,
      shippingCost: Number(cart?.shippingCost) || 0,
      discount: Number(cart?.discount) || 0,
      total: Number(cart?.total) || 0,
      isInitializing: false,  // Cart is no longer initializing when set
    });
  },
  
  setIsLoading: (isLoading) => set({ isLoading }),
  
  setError: (error) => set({ error }),
  
  setShippingMethod: (method, cost) => {
    set({ shippingMethod: method as ShippingMethod });
    // Update shipping cost in cart
    const { total, subtotal, tax, discount } = get();
    set({
      shippingCost: cost,
      total: subtotal + tax + cost - discount,
    });
  },
  
  setDiscountCode: (code) => set({ discountCode: code }),
  
  setSessionId: (sessionId) => set({ sessionId }),
  
  setIsGuest: (isGuest) => set({ isGuest }),
  
  setIsMerging: (isMerging) => set({ isMerging }),
  
  setIsInitializing: (isInitializing) => set({ isInitializing }),
  
  setCartId: (cartId) => set({ cartId }),
    
  // Add item to cart
  // CRIT-001: Added authentication check and CRIT-003: Fixed null cart handling
  addItem: async (product, quantity = 1, variantId = null, user, options = {}) => {
    const { sessionId, cart } = get();
    const { onSuccess, navigateToCart } = options || {};

    console.log('[CartContext] addItem called:', {
      product,
      productId: product?.id,
      productIdType: typeof product?.id,
      productIdLength: product?.id?.length,
      productName: product?.name,
      quantity,
      variantId,
      user,
      sessionId,
      cartId: cart?.id
    });

    try {
      set({ isLoading: true, error: null });

      let updatedCart: Cart;

      if (user) {
        // CRIT-001: Authentication required for adding items to logged-in cart
        // Get cartId from current cart or fetch it
        let cartId = cart?.id;

        // FIX: If cartId is invalid (e.g., "guest" from guest cart), fetch a new cart from backend
        if (!cartId || !isValidUUID(cartId)) {
          console.log('[CartContext] Invalid or missing cartId, fetching cart from backend:', cartId);
          // CRIT-003: Add null check when fetching cart
          const fetchedCart = await cartApi.getCart();
          if (!fetchedCart) {
            // Create new cart if none exists - use existing cart API
            const newCart = await cartApi.getCart();
            if (!newCart) {
              throw new Error('Unable to create or retrieve cart');
            }
            get().setCart(newCart);
            cartId = newCart.id;
          } else {
            get().setCart(fetchedCart);
            cartId = fetchedCart.id;
          }
        }

        console.log('[CartContext] About to call cartApi.addToCart with:', {
          cartId,
          productId: product?.id,
          productIdType: typeof product?.id,
          productIdLength: product?.id?.length,
          productName: product?.name,
          quantity,
          variantId
        });

        // Add to cart with cartId and variantId
        updatedCart = await cartApi.addToCart(cartId, product.id, quantity, variantId);
        get().setCart(updatedCart);
        
        // Dispatch cart-updated event so Header and other components can update
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new Event('cart-updated'));
        }
      } else {
        // FIX 1: Auto-grant cart consent on first product add
        if (!hasCartConsent()) {
          grantCartConsent();
          // After granting consent, ensure the session is initialized
          const guestSessionId = initializeGuestSession();
          if (guestSessionId) {
            set({ sessionId: guestSessionId });
          }
        }

        // For guest users, update local storage using utility functions
        // CRIT-004: Validate stock with backend before adding
        const stockValid = await validateGuestCartStock(product.id, quantity, variantId || undefined);
        if (!stockValid) {
          set({ isLoading: false, error: 'Sorry, this item is out of stock' });
          toast.error('Sorry, this item is out of stock');
          return;
        }

        const storageData = loadGuestCartFromStorageUtil();
        if (storageData) {
          const hasValidSalePrice = product.salePrice && Number(product.salePrice) > 0 && Number(product.salePrice) < Number(product.regularPrice);
          const guestCartUpdated = addItemToGuestCartUtil(
            storageData,
            product.id,
            quantity,
            variantId || null,
            hasValidSalePrice ? Number(product.salePrice) : Number(product.regularPrice)
          );
          
          // CRIT-002: CRIT-004: Sync guest cart to backend with await
          try {
            const backendCart = await createOrUpdateGuestCartBackend(guestCartUpdated.items, guestCartUpdated.sessionId);
            // Store the real database cartId
            if (backendCart && backendCart.id) {
              guestCartUpdated.cartId = backendCart.id;
            }
          } catch (error) {
            console.error('[CartContext] Failed to sync guest cart to backend:', error);
            // Continue with localStorage cart even if backend fails
          }
          
          saveGuestCartToStorageUtil(guestCartUpdated);

          // BUG-FIX: Use the already-modified guestCartUpdated instead of reloading from localStorage.
          // Reloading was causing race conditions where storage access could fail or return stale data.
          const cartWithSession = await getCartFromStorageData(guestCartUpdated);
          get().setCart(cartWithSession);
          updatedCart = cartWithSession;
          
          // Dispatch cart-updated event so Header and other components can update
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new Event('cart-updated'));
          }
        } else {
          // No existing cart - create new cart with the item
          const newCartData = createEmptyGuestCartUtil(sessionId || 'guest');
          const hasValidSalePrice = product.salePrice && Number(product.salePrice) > 0 &&
            Number(product.salePrice) < Number(product.regularPrice);
          const guestCartWithItem = addItemToGuestCartUtil(
            newCartData,
            product.id,
            quantity,
            variantId || null,
            hasValidSalePrice ? Number(product.salePrice) : Number(product.regularPrice)
          );
          
          // Save and sync to backend
          saveGuestCartToStorageUtil(guestCartWithItem);
          try {
            const backendCart = await createOrUpdateGuestCartBackend(guestCartWithItem.items, guestCartWithItem.sessionId);
            // Store the real database cartId
            if (backendCart && backendCart.id) {
              guestCartWithItem.cartId = backendCart.id;
              saveGuestCartToStorageUtil(guestCartWithItem);  // Save again with cartId
            }
          } catch (error) {
            console.error('[CartContext] Failed to sync new guest cart to backend:', error);
          }
          
          // Use the already-modified cart data directly
          const cartWithSession = await getCartFromStorageData(guestCartWithItem);
          get().setCart(cartWithSession);
          updatedCart = cartWithSession;
          
          // Dispatch cart-updated event so Header and other components can update
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new Event('cart-updated'));
          }
        }
      }

      set({ isLoading: false, error: null });

      // Show success toast
      toast.success(`${product.name} added to cart`);

      // Call success callback if provided
      if (onSuccess) {
        onSuccess(updatedCart);
      }

      // Navigate to cart if requested
      if (navigateToCart) {
        // We can't use useRouter directly in the store, so we'll need to handle this differently
        // The component using this store should handle the navigation
      }
    } catch (error: any) {
      console.error('[CartContext] Error adding item to cart:', error);
      set({ isLoading: false, error: error.message || 'Failed to add item' });
      toast.error(error.message || 'Failed to add item to cart');
      throw error;
    }
  },

  // Remove item from cart
  // BUG-FIX: Comprehensive fix for state desynchronization after product removal
  removeItem: async (itemId, user, options = {}) => {
    const { sessionId, cart } = get();
    const { onSuccess } = options || {};

    // Prevent concurrent removal operations
    if (get().isLoading) {
      console.warn('[CartContext] Removal already in progress, skipping');
      return;
    }

    try {
      set({ isLoading: true, error: null });

      let updatedCart: Cart | null = null;

      if (user) {
        // AUTHENTICATED USER: Remove from cart via backend
        // BUG-FIX: Backend now returns full updated cart instead of just { success: true }
        // API client automatically unwraps { success: true, data: cart } to cart
        updatedCart = await cartApi.removeCartItem(itemId);
        
        // BUG-FIX: Add null check to prevent error if backend returns null
        if (!updatedCart) {
          throw new Error('Failed to remove item: Server returned null cart');
        }
        
        if (!updatedCart.items) {
          throw new Error('Invalid cart response from server');
        }
        
        // BUG-FIX: Set cart BEFORE turning off loading to prevent "empty cart" flash
        get().setCart(updatedCart);
        
        // Dispatch cart-updated event so Header and other components can update
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('cart-updated', {
            detail: { itemCount: updatedCart.items.length }
          }));
        }
      } else {
        // GUEST USER: Update local storage using utility functions
        const storageData = loadGuestCartFromStorageUtil();
        if (storageData && cart) {
          const item = (cart.items || []).find(i => i.id === itemId);
          if (item) {
            // BUG-FIX: Remove item and save to storage BEFORE any async operations
            removeItemFromGuestCartUtil(
              storageData,
              item.productId,
              item.variantId
            );
            saveGuestCartToStorageUtil(storageData);
            
            // CRIT-002: Sync to backend with await (non-blocking for UI)
            createOrUpdateGuestCartBackend(storageData.items, storageData.sessionId)
              .then((backendCart) => {
                // Store the real database cartId
                if (backendCart && backendCart.id) {
                  storageData.cartId = backendCart.id;
                  saveGuestCartToStorageUtil(storageData);  // Save again with cartId
                }
              })
              .catch((error) => {
                console.error('[CartContext] Failed to sync guest cart after remove:', error);
              });
          }
        }

        // BUG-FIX: Use the already-modified storageData instead of reloading from localStorage.
        // Reloading was causing race conditions where storage access could fail or return stale data,
        // resulting in incorrectly showing "empty cart" when items still existed.
        if (storageData) {
          // BUG-FIX: Set cart immediately with local data for instant UI update
          const cartWithSession = await getCartFromStorageData(storageData);
          updatedCart = cartWithSession;
          
          // Set cart BEFORE turning off loading
          get().setCart(updatedCart);
          
          // Dispatch cart-updated event so Header and other components can update
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('cart-updated', {
              detail: { itemCount: updatedCart.items.length }
            }));
          }
        } else {
          // Only create empty cart if there truly was no storage data to begin with
          updatedCart = getEmptyCart(sessionId || 'guest');
          get().setCart(updatedCart);
          
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('cart-updated', {
              detail: { itemCount: 0 }
            }));
          }
        }
      }

      // BUG-FIX: Only turn off loading AFTER cart state is fully updated
      set({ isLoading: false, error: null });

      // Show success toast
      toast.success('Item removed from cart');

      // Call success callback if provided
      if (onSuccess && updatedCart) {
        onSuccess(updatedCart);
      }
    } catch (error: any) {
      console.error('[CartContext] Error removing item from cart:', error);
      set({ isLoading: false, error: error.message || 'Failed to remove item' });
      toast.error(error.message || 'Failed to remove item from cart');
      throw error;
    }
  },

  // Update item quantity
  // BUG-FIX: Comprehensive fix for state desynchronization after quantity update
  // CRIT-006: Added stock validation for guest users
  updateQuantity: async (itemId, quantity, user, options = {}) => {
    const { sessionId, cart } = get();
    const { onSuccess } = options || {};

    // Prevent concurrent update operations
    if (get().isLoading) {
      console.warn('[CartContext] Update already in progress, skipping');
      return;
    }

    try {
      set({ isLoading: true, error: null });

      let updatedCart: Cart | null = null;

      if (user) {
        // AUTHENTICATED USER: Update quantity via backend
        updatedCart = await cartApi.updateCartItemQuantity(itemId, quantity);
        
        // BUG-FIX: Add null check to prevent error if backend returns null
        if (!updatedCart) {
          throw new Error('Failed to update quantity: Server returned null cart');
        }
        
        // BUG-FIX: Set cart BEFORE turning off loading to prevent UI flicker
        get().setCart(updatedCart);
        
        // Dispatch cart-updated event so Header and other components can update
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('cart-updated', {
            detail: { itemCount: updatedCart.items?.length || 0 }
          }));
        }
      } else {
        // GUEST USER: Update local storage using utility functions
        // CRIT-006: Validate stock for guest users before updating quantity
        const item = cart?.items?.find(i => i.id === itemId);
        if (item) {
          const stockValid = await validateGuestCartStock(item.productId, quantity, item.variantId || undefined);
          if (!stockValid) {
            set({ isLoading: false, error: 'Insufficient stock' });
            throw new Error('Insufficient stock');
          }
        }
        
        // For guest users, update local storage using utility functions
        const storageData = loadGuestCartFromStorageUtil();
        if (storageData && cart) {
          const item = (cart.items || []).find(i => i.id === itemId);
          if (item) {
            // BUG-FIX: Update quantity and save to storage BEFORE any async operations
            updateItemQuantityInGuestCartUtil(
              storageData,
              item.productId,
              item.variantId,
              quantity
            );
            saveGuestCartToStorageUtil(storageData);
            
            // CRIT-002: Sync to backend (non-blocking for UI)
            createOrUpdateGuestCartBackend(storageData.items, storageData.sessionId)
              .then((backendCart) => {
                // Store the real database cartId
                if (backendCart && backendCart.id) {
                  storageData.cartId = backendCart.id;
                  saveGuestCartToStorageUtil(storageData);  // Save again with cartId
                }
              })
              .catch((error) => {
                console.error('[CartContext] Failed to sync guest cart after quantity update:', error);
              });
          }
        }

        // BUG-FIX: Use the already-modified storageData instead of reloading from localStorage.
        // Reloading was causing race conditions where storage access could fail or return stale data.
        if (storageData) {
          const cartWithSession = await getCartFromStorageData(storageData);
          updatedCart = cartWithSession;
          
          // BUG-FIX: Set cart BEFORE turning off loading
          get().setCart(updatedCart);
          
          // Dispatch cart-updated event so Header and other components can update
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('cart-updated', {
              detail: { itemCount: updatedCart.items?.length || 0 }
            }));
          }
        } else {
          // Only create empty cart if there truly was no storage data to begin with
          updatedCart = getEmptyCart(sessionId || 'guest');
          get().setCart(updatedCart);
          
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('cart-updated', {
              detail: { itemCount: 0 }
            }));
          }
        }
      }

      // BUG-FIX: Only turn off loading AFTER cart state is fully updated
      set({ isLoading: false, error: null });

      // Show success toast
      toast.success('Quantity updated');

      // Call success callback if provided
      if (onSuccess && updatedCart) {
        onSuccess(updatedCart);
      }
    } catch (error: any) {
      console.error('[CartContext] Error updating item quantity:', error);
      set({ isLoading: false, error: error.message || 'Failed to update quantity' });
      toast.error(error.message || 'Failed to update quantity');
      throw error;
    }
  },

  // Clear cart
  clearCart: async (user, options = {}) => {
    const { sessionId } = get();
    const { onSuccess } = options || {};

    try {
      set({ isLoading: true, error: null });

      if (user) {
        // Clear cart via backend for logged-in user
        const clearedCart = await cartApi.clearCart();
        get().setCart(clearedCart);
        
        // Dispatch cart-updated event so Header and other components can update
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new Event('cart-updated'));
        }
      } else {
        // For guest users, clear local storage using utility functions
        clearGuestCartFromStorageUtil();

        // Create empty cart
        const emptyCart = getEmptyCart(sessionId || 'guest');
        get().setCart(emptyCart);
        
        // Dispatch cart-updated event so Header and other components can update
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new Event('cart-updated'));
        }
      }

      set({ isLoading: false, error: null });
      
      // Show success toast
      toast.success('Cart cleared');
      
      // Call success callback if provided
      if (onSuccess) {
        onSuccess();
      }
    } catch (error: any) {
      console.error('[CartContext] Error clearing cart:', error);
      set({ isLoading: false, error: error.message || 'Failed to clear cart' });
      toast.error(error.message || 'Failed to clear cart');
      throw error;
    }
  },

  // Apply discount
  applyDiscount: async (code, user, options = {}) => {
    const { cart } = get();
    const { onSuccess } = options || {};

    try {
      set({ isLoading: true, error: null });

      let updatedCart: Cart | null = null;

      if (user) {
        // Apply discount via backend for logged-in user
        updatedCart = await cartApi.applyDiscount(code);
        get().setCart(updatedCart);
        
        // Dispatch cart-updated event so Header and other components can update
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new Event('cart-updated'));
        }
      } else {
        // For guest users, store discount code locally using utility functions
        const storageData = loadGuestCartFromStorageUtil();
        if (storageData) {
          storageData.discountCode = code;
          saveGuestCartToStorageUtil(storageData);
        }
        if (cart) {
          get().setCart(cart);
        }
        updatedCart = cart;
      }

      set({ discountCode: code, isLoading: false, error: null });
      
      // Show success toast
      toast.success('Discount code applied');
      
      // Call success callback if provided
      if (onSuccess && updatedCart) {
        onSuccess(updatedCart);
      }
    } catch (error: any) {
      console.error('[CartContext] Error applying discount:', error);
      set({ isLoading: false, error: error.message || 'Failed to apply discount' });
      toast.error(error.message || 'Failed to apply discount');
      throw error;
    }
  },

  // Remove discount
  removeDiscount: (user, options = {}) => {
    const { cart } = get();
    const { onSuccess } = options || {};

    if (user) {
      // Remove discount via backend for logged-in user
      cartApi.removeDiscount()
        .then(updatedCart => {
          get().setCart(updatedCart);
          set({ discountCode: null, error: null });
          
          // Dispatch cart-updated event so Header and other components can update
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new Event('cart-updated'));
          }
          
          // Show success toast
          toast.success('Discount removed');
          
          // Call success callback if provided
          if (onSuccess) {
            onSuccess(updatedCart);
          }
        })
        .catch(error => {
          console.error('[CartContext] Error removing discount:', error);
          set({ error: (error as any).message || 'Failed to remove discount' });
          toast.error((error as any).message || 'Failed to remove discount');
        });
    } else {
      // For guest users, remove discount code locally using utility functions
      const storageData = loadGuestCartFromStorageUtil();
      if (storageData) {
        storageData.discountCode = null;
        saveGuestCartToStorageUtil(storageData);
      }
      set({ discountCode: null, error: null });
      if (cart) {
        get().setCart(cart);
      }
      
      // Show success toast
      toast.success('Discount removed');
      
      // Call success callback if provided
      if (onSuccess && cart) {
        onSuccess(cart);
      }
    }
  },

  // Load cart (reload from backend)
  loadCart: async (user) => {
    const { sessionId } = get();
    
    try {
      set({ isLoading: true, error: null });

      if (user) {
        const cart = await cartApi.getCart();
        get().setCart(cart);
        set({ isLoading: false, error: null });
      } else {
        // For guest users, reload from storage using utility functions
        const storageData = loadGuestCartFromStorageUtil();
        if (storageData && sessionId) {
          const guestCart = getEmptyCart(sessionId);
          get().setCart(guestCart);
        }
        set({ isLoading: false, error: null });
      }
    } catch (error: any) {
      console.error('[CartContext] Error loading cart:', error);
      set({ isLoading: false, error: error.message || 'Failed to load cart' });
    }
  },

  // Merge guest cart (called on login) - FIXED: Added idempotency and better error handling
  mergeGuestCart: async (sessionId) => {
    try {
      set({ isMerging: true, error: null });
      
      // HIGH-001: Generate idempotency key to prevent duplicate merges
      const idempotencyKey = `merge_${sessionId}_${Date.now()}`;
      
      // Store in localStorage for retry protection
      if (typeof window !== 'undefined') {
        const lastMergeAttempt = localStorage.getItem('last_merge_attempt');
        if (lastMergeAttempt) {
          try {
            const attemptData = JSON.parse(lastMergeAttempt);
            // Check if we attempted this merge recently (within 5 seconds)
            if (attemptData.sessionId === sessionId && 
                Date.now() - attemptData.timestamp < 5000) {
              cartLogger.info('Skipping duplicate merge attempt', { sessionId });
              // Still try to get the current cart state
              const cart = await cartApi.getCart();
              set({ cart });
              set({ isMerging: false, isGuest: false, error: null });
              return;
            }
          } catch (e) {
            // Invalid JSON, proceed with merge
          }
        }
        localStorage.setItem('last_merge_attempt', JSON.stringify({
          sessionId,
          timestamp: Date.now(),
          key: idempotencyKey
        }));
      }
      
      const storageData = loadGuestCartFromStorageUtil();
      const items = storageData?.items || [];
      
      // HIGH-003: Better error handling - pass idempotency key
      const mergedCart = await cartApi.mergeGuestCart(sessionId, items, idempotencyKey);
      
      get().setCart(mergedCart);
      clearGuestCartFromStorageUtil();
      set({ isMerging: false, isGuest: false, error: null });
      
      // Clear merge attempt marker on success
      if (typeof window !== 'undefined') {
        localStorage.removeItem('last_merge_attempt');
      }
    } catch (error: any) {
      cartLogger.error('Error merging guest cart', { error: error?.message });
      
      // HIGH-003: Better error differentiation
      let errorMessage = error?.message || 'Failed to merge cart';
      
      // Parse error response for specific error codes
      if (error?.response?.data?.error) {
        const backendError = error.response.data.error;
        if (backendError.includes('already merged') || backendError.includes('already processed')) {
          errorMessage = 'Cart was already merged';
        } else if (backendError.includes('Concurrent') || backendError.includes('locked')) {
          errorMessage = 'Another merge is in progress. Please try again.';
        } else if (backendError.includes('Insufficient stock')) {
          errorMessage = 'Some items are out of stock';
        }
      }
      
      set({ 
        isMerging: false, 
        error: errorMessage
      });
      
      // HIGH-003: Try to recover cart state
      try {
        const cart = await cartApi.getCart();
        get().setCart(cart);
      } catch (recoveryError) {
        cartLogger.error('Failed to recover cart state', { error: recoveryError });
      }
      
      // Don't throw - allow UI to handle gracefully
      throw { 
        message: errorMessage,
        recoverable: true 
      };
    }
  },

  // Validate cart
  validateCart: async () => {
    try {
      set({ isLoading: true, error: null });
      const validation = await cartApi.validateCart();
      set({ isLoading: false, error: null });
      return validation;
    } catch (error: any) {
      console.error('[CartContext] Error validating cart:', error);
      set({ isLoading: false, error: error.message || 'Failed to validate cart' });
      throw error;
    }
  },

  // Fetch cart count from API
  fetchCartCount: async () => {
    try {
      const count = await getCartCount();
      set({ itemCount: count });
      // Dispatch cart-updated event so Header and other components can update
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('cart-updated'));
      }
    } catch (error) {
      console.error('[CartContext] Error fetching cart count:', error);
    }
  },

  // Initialize cart
  initializeCart: async (user) => {
    const { sessionId } = get();
    const currentUserId = user?.id || null;

    try {
      set({ isLoading: true, isInitializing: true, error: null });

      // Check if user has changed (logout/login scenario)
      if (previousUserId !== currentUserId) {
        cartLogger.info('User changed, updating previous user ID', {
          previousUserId,
          currentUserId
        });

        // FIX: Don't clear cart state when user logs in - let existing cart persist
        // until backend cart is fetched. Only update previousUserId.
        // This prevents "No token provided" error when fetching cart from backend.
        previousUserId = currentUserId;
      }

      if (user) {
        // Load cart from backend for logged-in user
        // FIX: Add retry mechanism to handle race condition where token is not yet available
        let cart = null;
        let retryCount = 0;
        const maxRetries = 3;

        while (!cart && retryCount < maxRetries) {
          try {
            cart = await cartApi.getCart();
            if (cart) {
              break;
            }
          } catch (error) {
            console.warn(`[CartContext] Cart fetch attempt ${retryCount + 1} failed:`, error.message);
            if (retryCount < maxRetries - 1) {
              // Wait 500ms before retrying to allow token to become available
              await new Promise(resolve => setTimeout(resolve, 500));
            }
          }
          retryCount++;
        }

        // FIX: Verify that the returned cart has a valid UUID ID
        if (cart && cart.id && isValidUUID(cart.id)) {
          get().setCart(cart);
        } else {
          // If backend returns invalid cart ID, create a new cart
          console.warn('[CartContext] Backend returned invalid cart ID, creating new cart');
          const newCart = await cartApi.getCart();
          get().setCart(newCart);
        }
        set({ isGuest: false, sessionId: null, isLoading: false, isInitializing: false, error: null });
        removeGuestSessionIdUtil();
        clearGuestCartFromStorageUtil();
      } else {
        // For guest users, initialize session using utility functions
        let guestSessionId = sessionId;
        if (!guestSessionId) {
          guestSessionId = generateGuestSessionIdUtil();
          // CRIT-003: Store in both localStorage and cookies for better persistence
          setGuestSessionIdUtil(guestSessionId);
        }
        set({ sessionId: guestSessionId, isGuest: true });

        // Create a minimal cart from storage
        const storageData = loadGuestCartFromStorageUtil();
        if (storageData && guestSessionId) {
          const guestCart = await getCartFromStorageData(storageData);  // Load items from storage
          get().setCart(guestCart);
        } else {
          const emptyCart = getEmptyCart(guestSessionId || 'guest');
          get().setCart(emptyCart);
        }

        set({ isLoading: false, isInitializing: false, error: null });
      }
    } catch (error: any) {
      console.error('[CartContext] Error initializing cart:', error);
      set({ isLoading: false, isInitializing: false, error: error.message || 'Failed to initialize cart' });
    }
  },
}));

// Helper function to create empty cart
// LOW-002: Use ISO string format for dates (consistent with backend)
const getEmptyCart = (sessionId: string): Cart => {
  const now = new Date().toISOString();
  return {
    id: sessionId,
    cartId: undefined,  // Will be set when backend returns real cartId
    sessionId,
    items: [],
    subtotal: 0,
    tax: 0,
    shippingCost: 0,
    discount: 0,
    total: 0,
    status: 'active',
    createdAt: now,
    updatedAt: now,
  };
};

// Helper function to create cart from storage data with actual items
// This fixes Issues 1, 3, and 4 - the state management bugs in the shopping cart
const getCartFromStorageData = async (storageData: GuestCartStorageData): Promise<Cart> => {
  const now = new Date().toISOString();
  const guestItems = storageData.items || [];
  
  // Fetch product details for all items in the cart
  const productIds = guestItems.map(item => item.productId);
  const productsMap = new Map<string, any>();
  
  if (productIds.length > 0) {
    try {
      const response = await getGuestCartProducts(productIds);
      const products = response || [];  // API response is already unwrapped
      
      // Debug logging
      console.log('[CartContext] API Response:', response);
      
      products.forEach((product: any) => {
        productsMap.set(product.id, product);
      });
      
      // Debug logging
      console.log('[CartContext] Products Map:', productsMap);
    } catch (error) {
      console.error('[CartContext] Failed to fetch product details:', error);
    }
  }
  
  // Convert GuestCartItem[] to CartItem[] by adding missing properties
  const items: CartItem[] = guestItems.map((item, index) => {
    const product = productsMap.get(item.productId);
    // Always use the stored price from cart item to preserve price at time of addition
    const price = Number(item.price);
    
    // DEBUG: Log price calculation for each item
    console.log('[CartContext] getCartFromStorageData - Price calculation:', {
      productId: item.productId,
      productSalePrice: product?.salePrice,
      productRegularPrice: product?.regularPrice,
      storedPrice: item.price,
      finalPrice: price,
      quantity: item.quantity,
      subtotal: price * item.quantity
    });
    
    // Transform ProductImage[] to string[] for compatibility with CartItem type
    const productImages = product?.images ? 
      product.images.map((img: any) => {
        // Handle both string URLs and ProductImage objects
        if (typeof img === 'string') {
          return img;
        } else if (img && typeof img === 'object') {
          // Extract URL from ProductImage object with fallback priority
          return img.originalUrl || img.optimizedUrl || img.thumbnailUrl || img.url || '';
        }
        return '';
      }).filter((url: string) => url && url.length > 0) : [];
    
    const cartItem: CartItem = {
      id: `${storageData.sessionId}-${item.productId}-${item.variantId || 'default'}-${index}`,
      cartId: storageData.sessionId,
      productId: item.productId,
      quantity: item.quantity,
      price: price,
      subtotal: price * item.quantity,
      addedAt: item.addedAt,
      status: 'active',
      variantId: item.variantId,
      product: product ? {
        id: product.id,
        name: product.name,
        nameBn: product.nameBn || undefined,
        slug: product.slug,
        images: productImages,  // Use transformed string[] array
        sku: product.sku,
        regularPrice: product.regularPrice,
        salePrice: product.salePrice,
        stockQuantity: product.stockQuantity,
        status: product.status,
      } : undefined,
    };
    
    // DIAGNOSTIC: Log the final cart item structure
    console.log('[CartContext] getCartFromStorageData - CartItem created:', {
      id: cartItem.id,
      productId: cartItem.productId,
      price: cartItem.price,
      subtotal: cartItem.subtotal,
      product: cartItem.product ? {
        id: cartItem.product.id,
        name: cartItem.product.name,
        regularPrice: cartItem.product.regularPrice,
        salePrice: cartItem.product.salePrice,
      } : null,
    });
    
    return cartItem;
  });
  
  // Debug logging
  console.log('[CartContext] Final Cart Items:', items);
  
  const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0);
  
  return {
    id: storageData.cartId || storageData.sessionId,  // Use real cartId if available
    cartId: storageData.cartId,  // Store cartId separately
    sessionId: storageData.sessionId,
    items,
    subtotal,
    tax: 0,
    shippingCost: 0,
    discount: 0,
    total: subtotal,
    status: 'active',
    createdAt: storageData.createdAt || now,
    updatedAt: now,
  };
};

// MED-004: Initialize guest session only after consent
const initializeGuestSession = (): string | null => {
  // Check if user has consented to cart tracking
  if (!hasCartConsent()) {
    // Don't generate session yet - user must consent first
    return null;
  }
  
  let sessionId = getGuestSessionIdUtil();
  if (!sessionId) {
    sessionId = generateGuestSessionIdUtil();
    setGuestSessionIdUtil(sessionId);
  }
  return sessionId;
};

// MED-004: Grant cart consent and sync existing cart
export const grantCartConsentAndSync = (): void => {
  grantCartConsent();
  
  // Generate session after consent
  const sessionId = generateGuestSessionIdUtil();
  setGuestSessionIdUtil(sessionId);
  
  // Sync any existing cart to backend with new session
  const existingCart = loadGuestCartFromStorageUtil();
  if (existingCart) {
    // CreateOrUpdateGuestCartBackend should be called here if needed
    // This is handled in the addItem function when items are added
  }
};

// Cart provider component
interface CartProviderProps {
  children: ReactNode;
}

export const CartProvider: React.FC<CartProviderProps> = ({ children }) => {
  const { user } = useAuth();
  const [isMounted, setIsMounted] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [authReady, setAuthReady] = useState(false);
  const initializeCart = useCartStore(state => state.initializeCart);
  const mergeGuestCart = useCartStore(state => state.mergeGuestCart);
  const isGuest = useCartStore(state => state.isGuest);
  const sessionId = useCartStore(state => state.sessionId);
  const setCart = useCartStore(state => state.setCart);

  // Set up toast error callback for storage errors
  useEffect(() => {
    setToastErrorCallback((message: string) => {
      toast.error(message);
    });
  }, []);

  // Set mounted state after first render to prevent hydration issues
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // PRIORITY 3 & 4: Removed artificial delay and defer cart initialization
  // Use requestIdleCallback to initialize cart in background after initial paint
  useEffect(() => {
    let isMounted = true;

    const initializeCartAsync = async () => {
      if (!isMounted) return;
      
      setIsInitializing(true);
      
      try {
        if (!isMounted) return;
        
        if (user) {
          await initializeCart(user);
        } else {
          // FIX 3: Ensure cart loads on page refresh - check for existing cart data
          const existingCart = loadGuestCartFromStorageUtil();
          
          if (existingCart && existingCart.items.length > 0) {
            // If there's existing cart data with items, grant consent automatically and load it
            if (!hasCartConsent()) {
              grantCartConsent();
            }
            // Generate session ID if needed
            let guestSessionId = existingCart.sessionId;
            if (!guestSessionId || !isValidUUID(guestSessionId)) {
              guestSessionId = generateGuestSessionIdUtil();
              setGuestSessionIdUtil(guestSessionId);
              existingCart.sessionId = guestSessionId;
              saveGuestCartToStorageUtil(existingCart);
            }
            // Set session ID and guest flag using store methods
            const setSessionId = useCartStore.getState().setSessionId;
            const setIsGuest = useCartStore.getState().setIsGuest;
            setSessionId(guestSessionId);
            setIsGuest(true);
            // Load the existing cart with items
            const guestCart = await getCartFromStorageData(existingCart);
            setCart(guestCart);
          } else {
            // MED-004: Only initialize guest session if user has consented
            const guestSessionId = initializeGuestSession();
            if (guestSessionId) {
              await initializeCart(null);
            } else {
              // User hasn't consented yet - create empty cart without session
              const emptyCart = getEmptyCart('guest');
              setCart(emptyCart);
            }
          }
        }
      } catch (error) {
        console.error('[CartContext] Cart initialization failed:', error);
      } finally {
        if (isMounted) {
          setIsInitializing(false);
        }
      }
    };

    // PRIORITY 4: Defer cart initialization using requestIdleCallback
    // This allows initial paint to complete before cart initialization starts
    const scheduleInitialization = () => {
      if (typeof requestIdleCallback !== 'undefined') {
        requestIdleCallback(() => {
          if (isMounted) {
            initializeCartAsync();
          }
        }, { timeout: 2000 }); // Fallback timeout if idle callback never fires
      } else {
        // Fallback for browsers without requestIdleCallback
        setTimeout(() => {
          if (isMounted) {
            initializeCartAsync();
          }
        }, 100);
      }
    };

    if (isMounted) {
      scheduleInitialization();
    }

    return () => {
      isMounted = false;
    };
  }, [user, initializeCart, setCart]);

  // Merge guest cart on login
  useEffect(() => {
    if (!isMounted) return;

    if (user && sessionId && isGuest) {
      mergeGuestCart(sessionId);
    }
  }, [user, sessionId, isGuest, isMounted, mergeGuestCart]);

  // MED-003: Cross-tab synchronization for guest carts
  useEffect(() => {
    if (!isMounted || user) return; // Only for guests

    // Set up cross-tab synchronization
    const unsubscribeUpdates = listenForGuestCartUpdates(async (data) => {
      // Update cart state when guest cart changes in another tab
      const storageData = loadGuestCartFromStorageUtil();
      if (storageData) {
        const mappedCart = await getCartFromStorageData(storageData);  // Load items from storage
        setCart(mappedCart);
      }
    });
    
    const unsubscribeClear = listenForGuestCartClear(() => {
      // Clear cart when guest cart is cleared in another tab
      const guestSessionId = getGuestSessionIdUtil();
      setCart(getEmptyCart(guestSessionId || 'guest'));
    });
    
    return () => {
      unsubscribeUpdates();
      unsubscribeClear();
    };
  }, [user, isMounted, setCart]);

  return <>{children}</>;
};

// Custom hook to use cart store
export const useCart = (): CartContextType => {
  const store = useCartStore();
  const { user } = useAuth();
  
  return {
    items: store.items,
    itemCount: store.itemCount,
    subtotal: store.subtotal,
    tax: store.tax,
    shippingCost: store.shippingCost,
    discount: store.discount,
    total: store.total,
    isLoading: store.isLoading || store.isMerging,
    error: store.error,
    shippingMethod: store.shippingMethod,
    discountCode: store.discountCode,
    isGuest: store.isGuest,
    sessionId: store.sessionId,
    isInitializing: store.isInitializing,
    cartId: store.cart?.id || null,  // Expose cartId from store
    addItem: (product, quantity, variantId, options) => store.addItem(product, quantity, variantId, user, options),
    removeItem: (itemId, options) => store.removeItem(itemId, user, options),
    updateQuantity: (itemId, quantity, options) => store.updateQuantity(itemId, quantity, user, options),
    clearCart: (options) => store.clearCart(user, options),
    applyDiscount: (code, options) => store.applyDiscount(code, user, options),
    removeDiscount: (options) => store.removeDiscount(user, options),
    setShippingMethod: store.setShippingMethod,
    loadCart: () => store.loadCart(user),
    mergeGuestCart: store.mergeGuestCart,
    validateCart: store.validateCart,
    fetchCartCount: store.fetchCartCount,
  };
};

export default useCart;
