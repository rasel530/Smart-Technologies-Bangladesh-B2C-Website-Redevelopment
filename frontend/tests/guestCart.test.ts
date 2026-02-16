/**
 * Guest Cart Utilities Unit Tests
 * 
 * Comprehensive tests for guest cart storage and management utilities.
 * Tests cover: session management, cart operations, persistence, and cross-tab sync.
 */

import {
  loadGuestCartFromStorage,
  saveGuestCartToStorage,
  clearGuestCartFromStorage,
  getGuestSessionId,
  setGuestSessionId,
  removeGuestSessionId,
  generateGuestSessionId,
  createEmptyGuestCart,
  addItemToGuestCart,
  removeItemFromGuestCart,
  updateItemQuantityInGuestCart,
  listenForGuestCartUpdates,
  listenForGuestCartClear,
  GuestCartStorageData,
  GuestCartItem,
} from '@/lib/utils/guestCart';

// Helper to set localStorage values
const setLocalStorageItem = (key: string, value: string) => {
  localStorage.setItem(key, value);
};

// Helper to clear localStorage
const clearLocalStorage = () => {
  localStorage.clear();
};

// Helper to get localStorage values
const getLocalStorageItem = (key: string): string | null => {
  return localStorage.getItem(key);
};

describe('Guest Cart Utilities', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    clearLocalStorage();
    jest.clearAllMocks();
  });

  afterEach(() => {
    // Clean up localStorage after each test
    clearLocalStorage();
  });

  describe('generateGuestSessionId', () => {
    it('should generate a unique session ID', () => {
      const sessionId1 = generateGuestSessionId();
      const sessionId2 = generateGuestSessionId();

      expect(sessionId1).not.toBe(sessionId2);
    });

    it('should include guest_ prefix', () => {
      const sessionId = generateGuestSessionId();

      expect(sessionId.startsWith('guest_')).toBe(true);
    });

    it('should include timestamp', () => {
      const before = Date.now();
      const sessionId = generateGuestSessionId();
      const after = Date.now();

      const timestampPart = sessionId.split('_')[1];
      const timestamp = parseInt(timestampPart, 10);

      expect(timestamp).toBeGreaterThanOrEqual(before);
      expect(timestamp).toBeLessThanOrEqual(after);
    });
  });

  describe('createEmptyGuestCart', () => {
    it('should create empty cart with valid structure', () => {
      const sessionId = 'test-session-123';
      const cart = createEmptyGuestCart(sessionId);

      expect(cart.sessionId).toBe(sessionId);
      expect(cart.items).toEqual([]);
      expect(cart.shippingMethod).toBe('standard');
      expect(cart.discountCode).toBeNull();
      expect(cart.version).toBe('1');
    });

    it('should set expiration date to 7 days from now', () => {
      const now = new Date();
      const cart = createEmptyGuestCart('test-session');

      const expiresAt = new Date(cart.expiresAt);
      const sevenDaysLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

      // Allow 1 second tolerance
      expect(Math.abs(expiresAt.getTime() - sevenDaysLater.getTime())).toBeLessThan(1000);
    });
  });

  describe('addItemToGuestCart', () => {
    it('should add new item to empty cart', () => {
      const cart = createEmptyGuestCart('test-session');
      const updatedCart = addItemToGuestCart(cart, 'product-1', 2, 'variant-1', 99.99);

      expect(updatedCart.items).toHaveLength(1);
      expect(updatedCart.items[0].productId).toBe('product-1');
      expect(updatedCart.items[0].quantity).toBe(2);
      expect(updatedCart.items[0].variantId).toBe('variant-1');
      expect(updatedCart.items[0].price).toBe(99.99);
    });

    it('should increment quantity for existing item', () => {
      const cart = createEmptyGuestCart('test-session');
      addItemToGuestCart(cart, 'product-1', 1, 'variant-1', 99.99);
      
      const updatedCart = addItemToGuestCart(cart, 'product-1', 2, 'variant-1', 99.99);

      expect(updatedCart.items).toHaveLength(1);
      expect(updatedCart.items[0].quantity).toBe(3);
    });

    it('should add new item when product ID differs', () => {
      const cart = createEmptyGuestCart('test-session');
      addItemToGuestCart(cart, 'product-1', 1, 'variant-1', 99.99);
      
      const updatedCart = addItemToGuestCart(cart, 'product-2', 1, 'variant-1', 149.99);

      expect(updatedCart.items).toHaveLength(2);
    });

    it('should add new item when variant ID differs for same product', () => {
      const cart = createEmptyGuestCart('test-session');
      addItemToGuestCart(cart, 'product-1', 1, 'variant-1', 99.99);
      
      const updatedCart = addItemToGuestCart(cart, 'product-1', 1, 'variant-2', 109.99);

      expect(updatedCart.items).toHaveLength(2);
    });

    it('should handle null variantId', () => {
      const cart = createEmptyGuestCart('test-session');
      const updatedCart = addItemToGuestCart(cart, 'product-1', 1, null, 99.99);

      expect(updatedCart.items[0].variantId).toBeNull();
    });
  });

  describe('removeItemFromGuestCart', () => {
    it('should remove item from cart', () => {
      const cart = createEmptyGuestCart('test-session');
      addItemToGuestCart(cart, 'product-1', 1, 'variant-1', 99.99);
      addItemToGuestCart(cart, 'product-2', 1, 'variant-1', 149.99);
      
      const updatedCart = removeItemFromGuestCart(cart, 'product-1', 'variant-1');

      expect(updatedCart.items).toHaveLength(1);
      expect(updatedCart.items[0].productId).toBe('product-2');
    });

    it('should not modify cart if item not found', () => {
      const cart = createEmptyGuestCart('test-session');
      addItemToGuestCart(cart, 'product-1', 1, 'variant-1', 99.99);
      
      const updatedCart = removeItemFromGuestCart(cart, 'non-existent', 'variant-1');

      expect(updatedCart.items).toHaveLength(1);
    });
  });

  describe('updateItemQuantityInGuestCart', () => {
    it('should update quantity for existing item', () => {
      const cart = createEmptyGuestCart('test-session');
      addItemToGuestCart(cart, 'product-1', 1, 'variant-1', 99.99);
      
      const updatedCart = updateItemQuantityInGuestCart(cart, 'product-1', 'variant-1', 5);

      expect(updatedCart.items[0].quantity).toBe(5);
    });

    it('should not modify cart if item not found', () => {
      const cart = createEmptyGuestCart('test-session');
      addItemToGuestCart(cart, 'product-1', 1, 'variant-1', 99.99);
      
      const updatedCart = updateItemQuantityInGuestCart(cart, 'non-existent', 'variant-1', 5);

      expect(updatedCart.items[0].quantity).toBe(1);
    });
  });

  describe('loadGuestCartFromStorage', () => {
    it('should return null when no cart in storage', () => {
      const cart = loadGuestCartFromStorage();

      expect(cart).toBeNull();
    });

    it('should return null when cart is expired', () => {
      const expiredCart: GuestCartStorageData = {
        sessionId: 'test-session',
        items: [],
        shippingMethod: 'standard',
        discountCode: null,
        expiresAt: new Date(Date.now() - 1000).toISOString(), // Expired 1 second ago
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        version: '1',
      };
      
      setLocalStorageItem('smart_tech_guest_cart', JSON.stringify(expiredCart));
      
      const cart = loadGuestCartFromStorage();

      expect(cart).toBeNull();
    });

    it('should return cart when valid', () => {
      const validCart: GuestCartStorageData = {
        sessionId: 'test-session',
        items: [{
          productId: 'product-1',
          quantity: 2,
          variantId: 'variant-1',
          price: 99.99,
          addedAt: new Date().toISOString(),
        }],
        shippingMethod: 'standard',
        discountCode: null,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        version: '1',
      };
      
      setLocalStorageItem('smart_tech_guest_cart', JSON.stringify(validCart));
      
      const cart = loadGuestCartFromStorage();

      expect(cart).not.toBeNull();
      expect(cart!.sessionId).toBe('test-session');
      expect(cart!.items).toHaveLength(1);
    });

    it('should return cart after migration when sessionId is missing in older version', () => {
      // Create cart with older version (no version field) - will trigger migration
      const legacyCart = {
        items: [],
        // No sessionId - legacy format
        // No version - will trigger migration
      };
      
      setLocalStorageItem('smart_tech_guest_cart', JSON.stringify(legacyCart));
      
      const cart = loadGuestCartFromStorage();

      // After migration, cart should have sessionId
      expect(cart).not.toBeNull();
      expect(cart!.sessionId).toBeDefined();
      expect(cart!.version).toBe('1');
    });

    it('should filter out invalid items', () => {
      const cartWithInvalidItems: GuestCartStorageData = {
        sessionId: 'test-session',
        items: [
          { productId: 'product-1', quantity: 2, variantId: null, price: 99.99, addedAt: new Date().toISOString() },
          { productId: null, quantity: 1, variantId: null, price: 0, addedAt: new Date().toISOString() }, // Invalid - no productId
          { productId: 'product-2', quantity: 0, variantId: null, price: 49.99, addedAt: new Date().toISOString() }, // Invalid - zero quantity
        ],
        shippingMethod: 'standard',
        discountCode: null,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        version: '1',
      };
      
      setLocalStorageItem('smart_tech_guest_cart', JSON.stringify(cartWithInvalidItems));
      
      const cart = loadGuestCartFromStorage();

      expect(cart).not.toBeNull();
      expect(cart!.items).toHaveLength(1);
      expect(cart!.items[0].productId).toBe('product-1');
    });
  });

  describe('saveGuestCartToStorage', () => {
    it('should save cart to localStorage', () => {
      const cart = createEmptyGuestCart('test-session');
      addItemToGuestCart(cart, 'product-1', 2, 'variant-1', 99.99);

      saveGuestCartToStorage(cart);

      const savedData = getLocalStorageItem('smart_tech_guest_cart');
      expect(savedData).toBeDefined();
      
      const parsed = JSON.parse(savedData!);
      expect(parsed.sessionId).toBe('test-session');
      expect(parsed.items).toHaveLength(1);
    });

    it('should dispatch custom event on save', () => {
      const cart = createEmptyGuestCart('test-session');
      const eventSpy = jest.spyOn(window, 'dispatchEvent');

      saveGuestCartToStorage(cart);

      expect(eventSpy).toHaveBeenCalled();
      const event = eventSpy.mock.calls[0][0] as CustomEvent;
      expect(event.type).toBe('guest-cart-updated');
      eventSpy.mockRestore();
    });
  });

  describe('clearGuestCartFromStorage', () => {
    it('should remove cart and session from localStorage', () => {
      setLocalStorageItem('smart_tech_guest_cart', JSON.stringify(createEmptyGuestCart('test')));
      setLocalStorageItem('smart_tech_guest_session', 'test-session');

      clearGuestCartFromStorage();

      expect(getLocalStorageItem('smart_tech_guest_cart')).toBeNull();
      expect(getLocalStorageItem('smart_tech_guest_session')).toBeNull();
    });

    it('should dispatch clear event', () => {
      const eventSpy = jest.spyOn(window, 'dispatchEvent');

      clearGuestCartFromStorage();

      expect(eventSpy).toHaveBeenCalled();
      expect(eventSpy.mock.calls[0][0].type).toBe('guest-cart-cleared');
      eventSpy.mockRestore();
    });
  });

  describe('Session ID Management', () => {
    it('should get session ID from storage', () => {
      setLocalStorageItem('smart_tech_guest_session', 'test-session-123');

      const sessionId = getGuestSessionId();

      expect(sessionId).toBe('test-session-123');
    });

    it('should return null when no session ID', () => {
      const sessionId = getGuestSessionId();

      expect(sessionId).toBeNull();
    });

    it('should set session ID in storage', () => {
      setGuestSessionId('new-session-456');

      expect(getLocalStorageItem('smart_tech_guest_session')).toBe('new-session-456');
    });

    it('should remove session ID from storage', () => {
      setLocalStorageItem('smart_tech_guest_session', 'test-session');

      removeGuestSessionId();

      expect(getLocalStorageItem('smart_tech_guest_session')).toBeNull();
    });
  });

  describe('Event Listeners', () => {
    it('should set up and clean up guest cart update listener', () => {
      const callback = jest.fn();
      const removeListener = listenForGuestCartUpdates(callback);

      // Trigger the event
      const event = new CustomEvent('guest-cart-updated', {
        detail: { items: [], sessionId: 'test' }
      });
      window.dispatchEvent(event);

      expect(callback).toHaveBeenCalledWith({ items: [], sessionId: 'test' });

      // Clean up
      removeListener();
      
      // Event should not trigger after cleanup
      const event2 = new CustomEvent('guest-cart-updated', {
        detail: { items: [], sessionId: 'test' }
      });
      window.dispatchEvent(event2);
      
      expect(callback).toHaveBeenCalledTimes(1);
    });

    it('should set up and clean up guest cart clear listener', () => {
      const callback = jest.fn();
      const removeListener = listenForGuestCartClear(callback);

      // Trigger the event
      window.dispatchEvent(new Event('guest-cart-cleared'));

      expect(callback).toHaveBeenCalled();

      // Clean up
      removeListener();
      
      // Event should not trigger after cleanup
      window.dispatchEvent(new Event('guest-cart-cleared'));
      
      expect(callback).toHaveBeenCalledTimes(1);
    });
  });

  describe('Server-Side Rendering Safety', () => {
    it('loadGuestCartFromStorage should return null on server', () => {
      // Save original value
      const originalWindow = global.window;
      
      // Simulate server environment
      delete (global as any).window;

      const cart = loadGuestCartFromStorage();
      expect(cart).toBeNull();

      // Restore window
      global.window = originalWindow;
    });

    it('saveGuestCartToStorage should not throw on server', () => {
      const originalWindow = global.window;
      delete (global as any).window;

      expect(() => {
        saveGuestCartToStorage(createEmptyGuestCart('test'));
      }).not.toThrow();

      global.window = originalWindow;
    });

    it('clearGuestCartFromStorage should not throw on server', () => {
      const originalWindow = global.window;
      delete (global as any).window;

      expect(() => {
        clearGuestCartFromStorage();
      }).not.toThrow();

      global.window = originalWindow;
    });

    it('generateGuestSessionId should work on server', () => {
      const originalWindow = global.window;
      delete (global as any).window;

      const sessionId = generateGuestSessionId();
      expect(sessionId.startsWith('guest_')).toBe(true);

      global.window = originalWindow;
    });
  });
});
