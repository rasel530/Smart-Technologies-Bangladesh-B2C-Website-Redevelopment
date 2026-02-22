/**
 * Cart Cache
 * 
 * Frontend caching layer for cart data with:
 * - LocalStorage cache for persistent cart data
 * - SessionStorage for temporary data
 * - Cache invalidation strategies
 * - Optimistic updates with rollback
 * 
 * @module lib/cache/cartCache
 */

import { Cart, CartItem, CartSummary } from '@/types/cart';

// Cache configuration
const CACHE_CONFIG = {
  // Storage keys
  CART_DATA_KEY: 'cart_cache_data',
  CART_TIMESTAMP_KEY: 'cart_cache_timestamp',
  CART_VERSION_KEY: 'cart_cache_version',
  CART_PENDING_OPS_KEY: 'cart_pending_operations',
  
  // TTL settings (in milliseconds)
  CART_DATA_TTL: 5 * 60 * 1000, // 5 minutes
  CART_SUMMARY_TTL: 60 * 1000, // 1 minute
  
  // Optimistic update settings
  OPTIMISTIC_UPDATE_TIMEOUT: 5000, // 5 seconds
  
  // Cache version (bump when structure changes)
  CACHE_VERSION: '1.0',
};

// Types
interface CachedCartData {
  cart: Cart;
  timestamp: number;
  version: string;
}

interface PendingOperation {
  id: string;
  type: 'add' | 'update' | 'remove' | 'clear';
  data: unknown;
  timestamp: number;
  retryCount: number;
}

interface OptimisticUpdateState {
  id: string;
  originalState: Cart | null;
  updatedState: Cart;
  timestamp: number;
  timeoutId: ReturnType<typeof setTimeout>;
}

/**
 * Check if localStorage is available
 */
function isLocalStorageAvailable(): boolean {
  try {
    const test = '__storage_test__';
    localStorage.setItem(test, test);
    localStorage.removeItem(test);
    return true;
  } catch (e) {
    return false;
  }
}

/**
 * Check if sessionStorage is available
 */
function isSessionStorageAvailable(): boolean {
  try {
    const test = '__storage_test__';
    sessionStorage.setItem(test, test);
    sessionStorage.removeItem(test);
    return true;
  } catch (e) {
    return false;
  }
}

// Storage availability
const hasLocalStorage = isLocalStorageAvailable();
const hasSessionStorage = isSessionStorageAvailable();

// In-memory fallback when storage is not available
const memoryCache: Map<string, unknown> = new Map();

/**
 * Get item from storage (with memory fallback)
 */
function getStorageItem(key: string, storage: 'local' | 'session' = 'local'): string | null {
  if (storage === 'local' && hasLocalStorage) {
    return localStorage.getItem(key);
  } else if (storage === 'session' && hasSessionStorage) {
    return sessionStorage.getItem(key);
  }
  return (memoryCache.get(key) as string) || null;
}

/**
 * Set item in storage (with memory fallback)
 */
function setStorageItem(key: string, value: string, storage: 'local' | 'session' = 'local'): void {
  if (storage === 'local' && hasLocalStorage) {
    localStorage.setItem(key, value);
  } else if (storage === 'session' && hasSessionStorage) {
    sessionStorage.setItem(key, value);
  } else {
    memoryCache.set(key, value);
  }
}

/**
 * Remove item from storage (with memory fallback)
 */
function removeStorageItem(key: string, storage: 'local' | 'session' = 'local'): void {
  if (storage === 'local' && hasLocalStorage) {
    localStorage.removeItem(key);
  } else if (storage === 'session' && hasSessionStorage) {
    sessionStorage.removeItem(key);
  } else {
    memoryCache.delete(key);
  }
}

/**
 * Cart Cache class
 */
class CartCache {
  private optimisticUpdates: Map<string, OptimisticUpdateState> = new Map();
  private pendingOperations: PendingOperation[] = [];
  private listeners: Set<(cart: Cart | null) => void> = new Set();

  /**
   * Get cached cart data
   */
  getCart(): Cart | null {
    try {
      const cached = getStorageItem(CACHE_CONFIG.CART_DATA_KEY);
      
      if (!cached) return null;
      
      const parsed: CachedCartData = JSON.parse(cached);
      
      // Check version
      if (parsed.version !== CACHE_CONFIG.CACHE_VERSION) {
        this.clearCache();
        return null;
      }
      
      // Check TTL
      const age = Date.now() - parsed.timestamp;
      if (age > CACHE_CONFIG.CART_DATA_TTL) {
        this.clearCache();
        return null;
      }
      
      return parsed.cart;
    } catch (error) {
      console.error('[CartCache] Error getting cart from cache:', error);
      return null;
    }
  }

  /**
   * Set cart data in cache
   */
  setCart(cart: Cart): void {
    try {
      const data: CachedCartData = {
        cart,
        timestamp: Date.now(),
        version: CACHE_CONFIG.CACHE_VERSION,
      };
      
      setStorageItem(CACHE_CONFIG.CART_DATA_KEY, JSON.stringify(data));
      this.notifyListeners(cart);
    } catch (error) {
      console.error('[CartCache] Error setting cart cache:', error);
    }
  }

  /**
   * Clear cart cache
   */
  clearCache(): void {
    removeStorageItem(CACHE_CONFIG.CART_DATA_KEY);
    removeStorageItem(CACHE_CONFIG.CART_TIMESTAMP_KEY);
    this.notifyListeners(null);
  }

  /**
   * Check if cache is valid
   */
  isCacheValid(): boolean {
    const cached = this.getCart();
    return cached !== null;
  }

  /**
   * Get cache age in milliseconds
   */
  getCacheAge(): number {
    try {
      const cached = getStorageItem(CACHE_CONFIG.CART_DATA_KEY);
      if (!cached) return Infinity;
      
      const parsed: CachedCartData = JSON.parse(cached);
      return Date.now() - parsed.timestamp;
    } catch {
      return Infinity;
    }
  }

  /**
   * Get cart summary from cache
   */
  getCartSummary(): CartSummary | null {
    const cart = this.getCart();
    if (!cart) return null;
    
    return {
      itemCount: cart.items?.length || 0,
      subtotal: cart.subtotal || 0,
      tax: cart.tax || 0,
      shippingCost: cart.shippingCost || 0,
      discount: cart.discount || 0,
      total: cart.total || 0,
    };
  }

  /**
   * Get cart item count
   */
  getItemCount(): number {
    const cart = this.getCart();
    return cart?.items?.length || 0;
  }

  /**
   * Get total items (sum of quantities)
   */
  getTotalItems(): number {
    const cart = this.getCart();
    return cart?.items?.reduce((sum, item) => sum + item.quantity, 0) || 0;
  }

  /**
   * Add pending operation
   */
  addPendingOperation(operation: Omit<PendingOperation, 'id' | 'timestamp' | 'retryCount'>): string {
    const id = `op_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const pendingOp: PendingOperation = {
      ...operation,
      id,
      timestamp: Date.now(),
      retryCount: 0,
    };
    
    this.pendingOperations.push(pendingOp);
    this.savePendingOperations();
    
    return id;
  }

  /**
   * Remove pending operation
   */
  removePendingOperation(id: string): void {
    this.pendingOperations = this.pendingOperations.filter(op => op.id !== id);
    this.savePendingOperations();
  }

  /**
   * Get pending operations
   */
  getPendingOperations(): PendingOperation[] {
    return [...this.pendingOperations];
  }

  /**
   * Clear pending operations
   */
  clearPendingOperations(): void {
    this.pendingOperations = [];
    removeStorageItem(CACHE_CONFIG.CART_PENDING_OPS_KEY, 'session');
  }

  /**
   * Save pending operations to session storage
   */
  private savePendingOperations(): void {
    try {
      setStorageItem(
        CACHE_CONFIG.CART_PENDING_OPS_KEY,
        JSON.stringify(this.pendingOperations),
        'session'
      );
    } catch (error) {
      console.error('[CartCache] Error saving pending operations:', error);
    }
  }

  /**
   * Load pending operations from session storage
   */
  loadPendingOperations(): void {
    try {
      const stored = getStorageItem(CACHE_CONFIG.CART_PENDING_OPS_KEY, 'session');
      if (stored) {
        this.pendingOperations = JSON.parse(stored);
      }
    } catch (error) {
      console.error('[CartCache] Error loading pending operations:', error);
      this.pendingOperations = [];
    }
  }

  /**
   * Perform optimistic update
   */
  optimisticUpdate(
    updateFn: (cart: Cart | null) => Cart,
    onRollback?: () => void
  ): { id: string; updatedCart: Cart } {
    const id = `opt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const originalCart = this.getCart();
    const updatedCart = updateFn(originalCart);
    
    // Apply update immediately
    this.setCart(updatedCart);
    
    // Set up rollback timeout
    const timeoutId = setTimeout(() => {
      this.rollbackOptimisticUpdate(id);
      if (onRollback) onRollback();
    }, CACHE_CONFIG.OPTIMISTIC_UPDATE_TIMEOUT);
    
    // Store optimistic update state
    const state: OptimisticUpdateState = {
      id,
      originalState: originalCart,
      updatedState: updatedCart,
      timestamp: Date.now(),
      timeoutId,
    };
    
    this.optimisticUpdates.set(id, state);
    
    return { id, updatedCart };
  }

  /**
   * Confirm optimistic update
   */
  confirmOptimisticUpdate(id: string): void {
    const state = this.optimisticUpdates.get(id);
    
    if (state) {
      // Clear timeout
      clearTimeout(state.timeoutId);
      
      // Remove from tracking
      this.optimisticUpdates.delete(id);
    }
  }

  /**
   * Rollback optimistic update
   */
  rollbackOptimisticUpdate(id: string): void {
    const state = this.optimisticUpdates.get(id);
    
    if (state) {
      // Clear timeout
      clearTimeout(state.timeoutId);
      
      // Restore original state
      if (state.originalState) {
        this.setCart(state.originalState);
      } else {
        this.clearCache();
      }
      
      // Remove from tracking
      this.optimisticUpdates.delete(id);
    }
  }

  /**
   * Rollback all optimistic updates
   */
  rollbackAllOptimisticUpdates(): void {
    this.optimisticUpdates.forEach((_, id) => {
      this.rollbackOptimisticUpdate(id);
    });
  }

  /**
   * Subscribe to cache changes
   */
  subscribe(listener: (cart: Cart | null) => void): () => void {
    this.listeners.add(listener);
    
    // Return unsubscribe function
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Notify listeners of cache changes
   */
  private notifyListeners(cart: Cart | null): void {
    this.listeners.forEach(listener => {
      try {
        listener(cart);
      } catch (error) {
        console.error('[CartCache] Error notifying listener:', error);
      }
    });
  }

  /**
   * Merge cart data (for cart merge operations)
   */
  mergeCartData(serverCart: Cart): void {
    // Clear any optimistic updates
    this.rollbackAllOptimisticUpdates();
    
    // Set server cart
    this.setCart(serverCart);
  }

  /**
   * Update cart item locally
   */
  updateItemLocally(itemId: string, updates: Partial<CartItem>): void {
    const cart = this.getCart();
    if (!cart || !cart.items) return;
    
    const updatedItems = cart.items.map(item =>
      item.id === itemId ? { ...item, ...updates } : item
    );
    
    this.setCart({
      ...cart,
      items: updatedItems,
    });
  }

  /**
   * Remove item locally
   */
  removeItemLocally(itemId: string): void {
    const cart = this.getCart();
    if (!cart || !cart.items) return;
    
    const updatedItems = cart.items.filter(item => item.id !== itemId);
    
    this.setCart({
      ...cart,
      items: updatedItems,
    });
  }

  /**
   * Add item locally
   */
  addItemLocally(item: CartItem): void {
    const cart = this.getCart();
    
    if (cart && cart.items) {
      // Check if item already exists
      const existingIndex = cart.items.findIndex(
        i => i.productId === item.productId && i.variantId === item.variantId
      );
      
      if (existingIndex >= 0) {
        // Update quantity
        const updatedItems = [...cart.items];
        updatedItems[existingIndex] = {
          ...updatedItems[existingIndex],
          quantity: updatedItems[existingIndex].quantity + item.quantity,
        };
        
        this.setCart({
          ...cart,
          items: updatedItems,
        });
      } else {
        // Add new item
        this.setCart({
          ...cart,
          items: [...cart.items, item],
        });
      }
    }
  }

  /**
   * Get cache statistics
   */
  getStats(): {
    hasLocalStorage: boolean;
    hasSessionStorage: boolean;
    isCacheValid: boolean;
    cacheAge: number;
    pendingOperations: number;
    optimisticUpdates: number;
    listeners: number;
  } {
    return {
      hasLocalStorage,
      hasSessionStorage,
      isCacheValid: this.isCacheValid(),
      cacheAge: this.getCacheAge(),
      pendingOperations: this.pendingOperations.length,
      optimisticUpdates: this.optimisticUpdates.size,
      listeners: this.listeners.size,
    };
  }

  /**
   * Clear all data
   */
  clearAll(): void {
    this.clearCache();
    this.clearPendingOperations();
    this.rollbackAllOptimisticUpdates();
  }
}

// Export singleton instance
export const cartCache = new CartCache();

// Export class for testing
export { CartCache };

// Export types
export type { CachedCartData, PendingOperation, OptimisticUpdateState };
