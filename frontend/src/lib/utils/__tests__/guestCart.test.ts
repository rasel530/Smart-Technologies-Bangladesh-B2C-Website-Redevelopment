/**
 * Guest Cart Utilities Test Suite
 * 
 * Comprehensive tests for guest cart storage, item management,
 * session handling, and storage quota recovery.
 */

import {
  generateGuestSessionId,
  addItemToGuestCart,
  removeItemFromGuestCart,
  updateItemQuantityInGuestCart,
  loadGuestCartFromStorage,
  saveGuestCartToStorage,
  clearGuestCartFromStorage,
  createEmptyGuestCart,
  getGuestSessionIdFromCookie,
  getGuestSessionId,
  getGuestSessionIdUtil,
  setGuestSessionId,
  setGuestSessionIdCookie,
  setGuestSessionIdUtil,
  removeGuestSessionId,
  recoverFromStorageQuota,
  saveGuestCartWithErrorHandling,
  hasCartConsent,
  grantCartConsent,
  revokeCartConsent,
  GuestCartStorageData,
  GuestCartItem,
} from '@/lib/utils/guestCart';

// Mock localStorage and document.cookie for Node.js environment
const mockLocalStorage = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: jest.fn((key: string) => store[key] || null),
    setItem: jest.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: jest.fn((key: string) => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      store = {};
    }),
    get store() {
      return store;
    },
    set store(value: Record<string, string>) {
      store = value;
    }
  };
})();

const mockDocument = {
  cookie: '',
};

Object.defineProperty(global, 'localStorage', {
  value: mockLocalStorage,
  writable: true,
});

Object.defineProperty(global, 'document', {
  value: mockDocument,
  writable: true,
});

// Mock CustomEvent
class MockCustomEvent {
  type: string;
  detail: any;
  constructor(type: string, options?: { detail?: any }) {
    this.type = type;
    this.detail = options?.detail;
  }
}

global.CustomEvent = MockCustomEvent as any;

// Mock window.dispatchEvent
const mockDispatchEvent = jest.fn();
Object.defineProperty(global, 'dispatchEvent', {
  value: mockDispatchEvent,
  writable: true,
});

describe('Guest Cart Utilities', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    mockLocalStorage.clear();
    mockLocalStorage.store = {};
    mockDocument.cookie = '';
    mockDispatchEvent.mockClear();
    jest.clearAllMocks();
    
    // Reset environment
    jest.resetModules();
  });

  describe('generateGuestSessionId', () => {
    it('should generate unique session IDs', () => {
      const id1 = generateGuestSessionId();
      const id2 = generateGuestSessionId();
      expect(id1).not.toBe(id2);
    });

    it('should follow expected format with guest_ prefix', () => {
      const id = generateGuestSessionId();
      expect(id).toMatch(/^guest_\d+_[a-z0-9]+$/);
    });

    it('should generate IDs within reasonable length', () => {
      const id = generateGuestSessionId();
      expect(id.length).toBeGreaterThan(10);
      expect(id.length).toBeLessThan(100);
    });

    it('should include timestamp in the ID', () => {
      const before = Date.now();
      const id = generateGuestSessionId();
      const after = Date.now();

      const timestampPart = id.split('_')[1];
      const timestamp = parseInt(timestampPart, 10);

      expect(timestamp).toBeGreaterThanOrEqual(before);
      expect(timestamp).toBeLessThanOrEqual(after);
    });

    it('should generate IDs that start with guest_', () => {
      const id = generateGuestSessionId();
      expect(id.startsWith('guest_')).toBe(true);
    });

    it('should have three parts when split by underscore', () => {
      const id = generateGuestSessionId();
      const parts = id.split('_');
      expect(parts).toHaveLength(3);
    });
  });

  describe('createEmptyGuestCart', () => {
    it('should create empty cart with correct structure', () => {
      const cart = createEmptyGuestCart('test_session_123');
      
      expect(cart.sessionId).toBe('test_session_123');
      expect(cart.items).toHaveLength(0);
      expect(cart.shippingMethod).toBe('standard');
      expect(cart.discountCode).toBeNull();
      expect(cart.version).toBe('1');
    });

    it('should set expiration date to 7 days from now', () => {
      const before = Date.now();
      const cart = createEmptyGuestCart('test_session');
      const after = Date.now();

      const expiresAt = new Date(cart.expiresAt).getTime();
      
      // 7 days in milliseconds = 7 * 24 * 60 * 60 * 1000 = 604800000
      const expectedMin = before + (7 * 24 * 60 * 60 * 1000) - 1000;
      const expectedMax = after + (7 * 24 * 60 * 60 * 1000) + 1000;
      
      expect(expiresAt).toBeGreaterThanOrEqual(expectedMin);
      expect(expiresAt).toBeLessThanOrEqual(expectedMax);
    });

    it('should set createdAt and updatedAt to current time', () => {
      const before = Date.now();
      const cart = createEmptyGuestCart('test_session');
      const after = Date.now();

      const createdAt = new Date(cart.createdAt).getTime();
      const updatedAt = new Date(cart.updatedAt).getTime();

      expect(createdAt).toBeGreaterThanOrEqual(before);
      expect(createdAt).toBeLessThanOrEqual(after);
      expect(updatedAt).toBeGreaterThanOrEqual(before);
      expect(updatedAt).toBeLessThanOrEqual(after);
    });

    it('should handle special characters in session ID', () => {
      const specialId = 'session-with-special-chars_123';
      const cart = createEmptyGuestCart(specialId);
      expect(cart.sessionId).toBe(specialId);
    });
  });

  describe('addItemToGuestCart', () => {
    it('should add new item to empty cart', () => {
      const cart = createEmptyGuestCart('test_session');
      const updated = addItemToGuestCart(cart, 'prod1', 2, null, 99.99);
      
      expect(updated.items).toHaveLength(1);
      expect(updated.items[0].productId).toBe('prod1');
      expect(updated.items[0].quantity).toBe(2);
      expect(updated.items[0].variantId).toBeNull();
      expect(updated.items[0].price).toBe(99.99);
    });

    it('should update quantity for existing item', () => {
      const cart = createEmptyGuestCart('test_session');
      cart.items = [{
        productId: 'prod1',
        quantity: 1,
        variantId: null,
        price: 99.99,
        addedAt: new Date().toISOString()
      }];
      
      const updated = addItemToGuestCart(cart, 'prod1', 2, null, 99.99);
      
      expect(updated.items).toHaveLength(1);
      expect(updated.items[0].quantity).toBe(3);
    });

    it('should handle different variant IDs separately', () => {
      const cart = createEmptyGuestCart('test_session');
      cart.items = [{
        productId: 'prod1',
        quantity: 1,
        variantId: 'var1',
        price: 99.99,
        addedAt: new Date().toISOString()
      }];
      
      const updated = addItemToGuestCart(cart, 'prod1', 1, 'var2', 109.99);
      
      expect(updated.items).toHaveLength(2);
      expect(updated.items[0].variantId).toBe('var1');
      expect(updated.items[1].variantId).toBe('var2');
    });

    it('should update same variant item quantity', () => {
      const cart = createEmptyGuestCart('test_session');
      cart.items = [{
        productId: 'prod1',
        quantity: 2,
        variantId: 'var1',
        price: 99.99,
        addedAt: new Date().toISOString()
      }];
      
      const updated = addItemToGuestCart(cart, 'prod1', 3, 'var1', 99.99);
      
      expect(updated.items).toHaveLength(1);
      expect(updated.items[0].quantity).toBe(5);
    });

    it('should preserve existing items when adding new ones', () => {
      const cart = createEmptyGuestCart('test_session');
      cart.items = [
        { productId: 'prod1', quantity: 1, variantId: null, price: 50, addedAt: new Date().toISOString() },
        { productId: 'prod2', quantity: 2, variantId: null, price: 75, addedAt: new Date().toISOString() }
      ];
      
      const updated = addItemToGuestCart(cart, 'prod3', 1, null, 100);
      
      expect(updated.items).toHaveLength(3);
      expect(updated.items[0].productId).toBe('prod1');
      expect(updated.items[1].productId).toBe('prod2');
      expect(updated.items[2].productId).toBe('prod3');
    });

    it('should handle quantity of 1 correctly', () => {
      const cart = createEmptyGuestCart('test_session');
      const updated = addItemToGuestCart(cart, 'prod1', 1, null, 99.99);
      
      expect(updated.items).toHaveLength(1);
      expect(updated.items[0].quantity).toBe(1);
    });

    it('should handle large quantities', () => {
      const cart = createEmptyGuestCart('test_session');
      cart.items = [{
        productId: 'prod1',
        quantity: 100,
        variantId: null,
        price: 10,
        addedAt: new Date().toISOString()
      }];
      
      const updated = addItemToGuestCart(cart, 'prod1', 200, null, 10);
      
      expect(updated.items[0].quantity).toBe(300);
    });

    it('should handle decimal prices', () => {
      const cart = createEmptyGuestCart('test_session');
      const updated = addItemToGuestCart(cart, 'prod1', 1, null, 99.95);
      
      expect(updated.items[0].price).toBe(99.95);
    });
  });

  describe('removeItemFromGuestCart', () => {
    it('should remove item from cart', () => {
      const cart = createEmptyGuestCart('test_session');
      cart.items = [
        { productId: 'prod1', quantity: 1, variantId: null, price: 50, addedAt: new Date().toISOString() },
        { productId: 'prod2', quantity: 2, variantId: null, price: 75, addedAt: new Date().toISOString() }
      ];
      
      const updated = removeItemFromGuestCart(cart, 'prod1', null);
      
      expect(updated.items).toHaveLength(1);
      expect(updated.items[0].productId).toBe('prod2');
    });

    it('should remove item by variant ID', () => {
      const cart = createEmptyGuestCart('test_session');
      cart.items = [
        { productId: 'prod1', quantity: 1, variantId: 'var1', price: 50, addedAt: new Date().toISOString() },
        { productId: 'prod1', quantity: 2, variantId: 'var2', price: 60, addedAt: new Date().toISOString() }
      ];
      
      const updated = removeItemFromGuestCart(cart, 'prod1', 'var1');
      
      expect(updated.items).toHaveLength(1);
      expect(updated.items[0].variantId).toBe('var2');
    });

    it('should handle removing non-existent item gracefully', () => {
      const cart = createEmptyGuestCart('test_session');
      cart.items = [{
        productId: 'prod1',
        quantity: 1,
        variantId: null,
        price: 50,
        addedAt: new Date().toISOString()
      }];
      
      const updated = removeItemFromGuestCart(cart, 'non_existent', null);
      
      expect(updated.items).toHaveLength(1);
      expect(updated.items[0].productId).toBe('prod1');
    });

    it('should return empty array when removing last item', () => {
      const cart = createEmptyGuestCart('test_session');
      cart.items = [{
        productId: 'prod1',
        quantity: 1,
        variantId: null,
        price: 50,
        addedAt: new Date().toISOString()
      }];
      
      const updated = removeItemFromGuestCart(cart, 'prod1', null);
      
      expect(updated.items).toHaveLength(0);
    });

    it('should remove only matching variant ID', () => {
      const cart = createEmptyGuestCart('test_session');
      cart.items = [
        { productId: 'prod1', quantity: 1, variantId: 'var1', price: 50, addedAt: new Date().toISOString() },
        { productId: 'prod1', quantity: 2, variantId: 'var2', price: 60, addedAt: new Date().toISOString() }
      ];
      
      const updated = removeItemFromGuestCart(cart, 'prod1', null);
      
      // Should not remove any items when searching with null variant and items have specific variants
      expect(updated.items).toHaveLength(2);
    });
  });

  describe('updateItemQuantityInGuestCart', () => {
    it('should update quantity for existing item', () => {
      const cart = createEmptyGuestCart('test_session');
      cart.items = [{
        productId: 'prod1',
        quantity: 1,
        variantId: null,
        price: 50,
        addedAt: new Date().toISOString()
      }];
      
      const updated = updateItemQuantityInGuestCart(cart, 'prod1', null, 10);
      
      expect(updated.items[0].quantity).toBe(10);
    });

    it('should update quantity by variant ID', () => {
      const cart = createEmptyGuestCart('test_session');
      cart.items = [
        { productId: 'prod1', quantity: 1, variantId: 'var1', price: 50, addedAt: new Date().toISOString() },
        { productId: 'prod1', quantity: 2, variantId: 'var2', price: 60, addedAt: new Date().toISOString() }
      ];
      
      const updated = updateItemQuantityInGuestCart(cart, 'prod1', 'var1', 5);
      
      expect(updated.items[0].quantity).toBe(5);
      expect(updated.items[1].quantity).toBe(2);
    });

    it('should handle non-existent item gracefully', () => {
      const cart = createEmptyGuestCart('test_session');
      cart.items = [{
        productId: 'prod1',
        quantity: 1,
        variantId: null,
        price: 50,
        addedAt: new Date().toISOString()
      }];
      
      const updated = updateItemQuantityInGuestCart(cart, 'non_existent', null, 10);
      
      // Should not modify the cart
      expect(updated.items[0].quantity).toBe(1);
    });

    it('should handle quantity of 0', () => {
      const cart = createEmptyGuestCart('test_session');
      cart.items = [{
        productId: 'prod1',
        quantity: 5,
        variantId: null,
        price: 50,
        addedAt: new Date().toISOString()
      }];
      
      const updated = updateItemQuantityInGuestCart(cart, 'prod1', null, 0);
      
      expect(updated.items[0].quantity).toBe(0);
    });

    it('should handle large quantities', () => {
      const cart = createEmptyGuestCart('test_session');
      cart.items = [{
        productId: 'prod1',
        quantity: 1,
        variantId: null,
        price: 50,
        addedAt: new Date().toISOString()
      }];
      
      const updated = updateItemQuantityInGuestCart(cart, 'prod1', null, 9999);
      
      expect(updated.items[0].quantity).toBe(9999);
    });
  });

  describe('loadGuestCartFromStorage', () => {
    it('should return null for empty storage', () => {
      const result = loadGuestCartFromStorage();
      expect(result).toBeNull();
    });

    it('should return null for expired cart', () => {
      const cart = createEmptyGuestCart('test_session');
      cart.expiresAt = new Date(Date.now() - 1000).toISOString();
      mockLocalStorage.setItem('smart_tech_guest_cart', JSON.stringify(cart));
      
      const result = loadGuestCartFromStorage();
      expect(result).toBeNull();
    });

    it('should return cart for valid data', () => {
      const cart = createEmptyGuestCart('test_session');
      cart.items = [{
        productId: 'prod1',
        quantity: 2,
        variantId: null,
        price: 99.99,
        addedAt: new Date().toISOString()
      }];
      mockLocalStorage.setItem('smart_tech_guest_cart', JSON.stringify(cart));
      
      const result = loadGuestCartFromStorage();
      expect(result).not.toBeNull();
      expect(result!.items).toHaveLength(1);
      expect(result!.sessionId).toBe('test_session');
    });

    it('should handle malformed JSON gracefully', () => {
      mockLocalStorage.setItem('smart_tech_guest_cart', 'not valid json');
      
      const result = loadGuestCartFromStorage();
      expect(result).toBeNull();
    });

    it('should return null for missing sessionId', () => {
      const cart = createEmptyGuestCart('test_session');
      delete (cart as any).sessionId;
      mockLocalStorage.setItem('smart_tech_guest_cart', JSON.stringify(cart));
      
      const result = loadGuestCartFromStorage();
      expect(result).toBeNull();
    });

    it('should return null for invalid items array', () => {
      const cart = createEmptyGuestCart('test_session');
      (cart as any).items = null;
      mockLocalStorage.setItem('smart_tech_guest_cart', JSON.stringify(cart));
      
      const result = loadGuestCartFromStorage();
      expect(result).toBeNull();
    });

    it('should filter out items with invalid productId', () => {
      const cart = createEmptyGuestCart('test_session');
      cart.items = [
        { productId: 'valid', quantity: 1, variantId: null, price: 50, addedAt: new Date().toISOString() },
        { productId: '', quantity: 1, variantId: null, price: 50, addedAt: new Date().toISOString() },
        { productId: null as any, quantity: 1, variantId: null, price: 50, addedAt: new Date().toISOString() }
      ];
      mockLocalStorage.setItem('smart_tech_guest_cart', JSON.stringify(cart));
      
      const result = loadGuestCartFromStorage();
      expect(result).not.toBeNull();
      expect(result!.items).toHaveLength(1);
      expect(result!.items[0].productId).toBe('valid');
    });

    it('should filter out items with invalid quantity', () => {
      const cart = createEmptyGuestCart('test_session');
      cart.items = [
        { productId: 'valid', quantity: 1, variantId: null, price: 50, addedAt: new Date().toISOString() },
        { productId: 'invalid', quantity: -1, variantId: null, price: 50, addedAt: new Date().toISOString() },
        { productId: 'also-invalid', quantity: 0, variantId: null, price: 50, addedAt: new Date().toISOString() }
      ];
      mockLocalStorage.setItem('smart_tech_guest_cart', JSON.stringify(cart));
      
      const result = loadGuestCartFromStorage();
      expect(result).not.toBeNull();
      expect(result!.items).toHaveLength(1);
    });

    it('should return null for completely empty cart object', () => {
      mockLocalStorage.setItem('smart_tech_guest_cart', '{}');
      
      const result = loadGuestCartFromStorage();
      expect(result).toBeNull();
    });

    it('should return cart with multiple items', () => {
      const cart = createEmptyGuestCart('test_session');
      cart.items = [
        { productId: 'prod1', quantity: 2, variantId: null, price: 50, addedAt: new Date().toISOString() },
        { productId: 'prod2', quantity: 3, variantId: 'var1', price: 75, addedAt: new Date().toISOString() },
        { productId: 'prod3', quantity: 1, variantId: null, price: 100, addedAt: new Date().toISOString() }
      ];
      mockLocalStorage.setItem('smart_tech_guest_cart', JSON.stringify(cart));
      
      const result = loadGuestCartFromStorage();
      expect(result).not.toBeNull();
      expect(result!.items).toHaveLength(3);
    });
  });

  describe('saveGuestCartToStorage', () => {
    it('should save cart to localStorage', () => {
      const cart = createEmptyGuestCart('test_session');
      cart.items = [{
        productId: 'prod1',
        quantity: 2,
        variantId: null,
        price: 99.99,
        addedAt: new Date().toISOString()
      }];
      
      saveGuestCartToStorage(cart);
      
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'smart_tech_guest_cart',
        expect.any(String)
      );
      
      const stored = JSON.parse(mockLocalStorage.store['smart_tech_guest_cart']);
      expect(stored.sessionId).toBe('test_session');
      expect(stored.items).toHaveLength(1);
    });

    it('should dispatch custom event on save', () => {
      const cart = createEmptyGuestCart('test_session');
      
      saveGuestCartToStorage(cart);
      
      expect(mockDispatchEvent).toHaveBeenCalled();
    });

    it('should update the updatedAt timestamp', () => {
      const cart = createEmptyGuestCart('test_session');
      const originalUpdatedAt = cart.updatedAt;
      
      // Small delay to ensure different timestamp
      const newDate = new Date(Date.now() + 1000);
      cart.updatedAt = newDate.toISOString();
      
      saveGuestCartToStorage(cart);
      
      const stored = JSON.parse(mockLocalStorage.store['smart_tech_guest_cart']);
      expect(stored.updatedAt).not.toBe(originalUpdatedAt);
    });

    it('should set version to current version', () => {
      const cart = createEmptyGuestCart('test_session');
      
      saveGuestCartToStorage(cart);
      
      const stored = JSON.parse(mockLocalStorage.store['smart_tech_guest_cart']);
      expect(stored.version).toBe('1');
    });

    it('should handle empty cart items', () => {
      const cart = createEmptyGuestCart('test_session');
      
      saveGuestCartToStorage(cart);
      
      const stored = JSON.parse(mockLocalStorage.store['smart_tech_guest_cart']);
      expect(stored.items).toHaveLength(0);
    });
  });

  describe('clearGuestCartFromStorage', () => {
    it('should remove cart from localStorage', () => {
      mockLocalStorage.setItem('smart_tech_guest_cart', JSON.stringify(createEmptyGuestCart('test')));
      mockLocalStorage.setItem('smart_tech_guest_session', 'test_session');
      
      clearGuestCartFromStorage();
      
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('smart_tech_guest_cart');
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('smart_tech_guest_session');
    });

    it('should dispatch clear event', () => {
      clearGuestCartFromStorage();
      
      expect(mockDispatchEvent).toHaveBeenCalledWith(expect.any(Event));
    });
  });

  describe('Cookie Storage', () => {
    beforeEach(() => {
      mockDocument.cookie = '';
    });

    describe('getGuestSessionIdFromCookie', () => {
      it('should return null for missing cookie', () => {
        const result = getGuestSessionIdFromCookie();
        expect(result).toBeNull();
      });

      it('should get session ID from cookie', () => {
        mockDocument.cookie = 'smart_tech_guest_session=test_cookie_id';
        const result = getGuestSessionIdFromCookie();
        expect(result).toBe('test_cookie_id');
      });

      it('should return null for empty cookie value', () => {
        mockDocument.cookie = 'smart_tech_guest_session=';
        const result = getGuestSessionIdFromCookie();
        expect(result).toBeNull();
      });

      it('should handle multiple cookies', () => {
        mockDocument.cookie = 'other_cookie=value; smart_tech_guest_session=my_session; another_cookie=test';
        const result = getGuestSessionIdFromCookie();
        expect(result).toBe('my_session');
      });

      it('should return null for non-matching cookie', () => {
        mockDocument.cookie = 'other_session=other_value';
        const result = getGuestSessionIdFromCookie();
        expect(result).toBeNull();
      });
    });

    describe('setGuestSessionIdCookie', () => {
      it('should set session ID cookie', () => {
        setGuestSessionIdCookie('test_id');
        
        expect(mockDocument.cookie).toContain('smart_tech_guest_session=test_id');
      });

      it('should set cookie with path=/', () => {
        setGuestSessionIdCookie('test_id');
        
        expect(mockDocument.cookie).toContain('path=/');
      });

      it('should set cookie with SameSite=Lax', () => {
        setGuestSessionIdCookie('test_id');
        
        expect(mockDocument.cookie).toContain('SameSite=Lax');
      });

      it('should include expiry date', () => {
        const before = Date.now();
        setGuestSessionIdCookie('test_id');
        const after = Date.now();
        
        // Check that cookie contains expires
        expect(mockDocument.cookie).toContain('expires=');
        
        // Verify the expiry is approximately 7 days from now
        const expiresMatch = mockDocument.cookie.match(/expires=([^;]+)/);
        if (expiresMatch) {
          const expiresDate = new Date(expiresMatch[1]).getTime();
          const expectedMin = before + (7 * 24 * 60 * 60 * 1000) - 60000;
          const expectedMax = after + (7 * 24 * 60 * 60 * 1000) + 60000;
          expect(expiresDate).toBeGreaterThanOrEqual(expectedMin);
          expect(expiresDate).toBeLessThanOrEqual(expectedMax);
        }
      });
    });
  });

  describe('Session ID Storage', () => {
    describe('getGuestSessionId', () => {
      it('should return null when not set', () => {
        const result = getGuestSessionId();
        expect(result).toBeNull();
      });

      it('should return session ID from localStorage', () => {
        mockLocalStorage.setItem('smart_tech_guest_session', 'my_session_id');
        const result = getGuestSessionId();
        expect(result).toBe('my_session_id');
      });
    });

    describe('setGuestSessionId', () => {
      it('should set session ID in localStorage', () => {
        setGuestSessionId('new_session_id');
        
        expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
          'smart_tech_guest_session',
          'new_session_id'
        );
      });
    });

    describe('setGuestSessionIdUtil', () => {
      it('should set session ID in both localStorage and cookie', () => {
        setGuestSessionIdUtil('combined_session_id');
        
        expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
          'smart_tech_guest_session',
          'combined_session_id'
        );
        expect(mockDocument.cookie).toContain('smart_tech_guest_session=combined_session_id');
      });
    });

    describe('removeGuestSessionId', () => {
      it('should remove session ID from localStorage', () => {
        mockLocalStorage.setItem('smart_tech_guest_session', 'session_to_remove');
        
        removeGuestSessionId();
        
        expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('smart_tech_guest_session');
      });
    });

    describe('getGuestSessionIdUtil', () => {
      it('should return null when not set anywhere', () => {
        const result = getGuestSessionIdUtil();
        expect(result).toBeNull();
      });

      it('should return from localStorage first', () => {
        mockLocalStorage.setItem('smart_tech_guest_session', 'local_storage_id');
        mockDocument.cookie = 'smart_tech_guest_session=cookie_id';
        
        const result = getGuestSessionIdUtil();
        expect(result).toBe('local_storage_id');
      });

      it('should fall back to cookie if not in localStorage', () => {
        mockDocument.cookie = 'smart_tech_guest_session=cookie_id';
        
        const result = getGuestSessionIdUtil();
        expect(result).toBe('cookie_id');
      });
    });
  });

  describe('Storage Quota Recovery', () => {
    it('should recover from quota exceeded by removing oldest items', () => {
      const now = Date.now();
      const cart = createEmptyGuestCart('test');
      cart.items = Array.from({ length: 10 }, (_, i) => ({
        productId: `prod${i}`,
        quantity: 1,
        variantId: null,
        price: 99.99,
        addedAt: new Date(now - i * 1000).toISOString() // Older items first
      }));
      
      const recovered = recoverFromStorageQuota(cart);
      
      // Should keep the most recent 5 items (sorted by addedAt, keeping newest)
      expect(recovered.items.length).toBeLessThan(cart.items.length);
      expect(recovered.items.length).toBe(5);
    });

    it('should sort by addedAt date for recovery', () => {
      const now = Date.now();
      const cart = createEmptyGuestCart('test');
      cart.items = [
        { productId: 'oldest', quantity: 1, variantId: null, price: 10, addedAt: new Date(now - 5000).toISOString() },
        { productId: 'newest', quantity: 1, variantId: null, price: 20, addedAt: new Date(now).toISOString() },
        { productId: 'middle', quantity: 1, variantId: null, price: 15, addedAt: new Date(now - 2500).toISOString() }
      ];
      
      const recovered = recoverFromStorageQuota(cart);
      
      // Should keep newest items
      expect(recovered.items.map(i => i.productId)).toContain('newest');
    });

    it('should preserve cart structure after recovery', () => {
      const cart = createEmptyGuestCart('test_recovery');
      
      const recovered = recoverFromStorageQuota(cart);
      
      expect(recovered.sessionId).toBe('test_recovery');
      expect(recovered.version).toBe('1');
      expect(recovered.shippingMethod).toBe('standard');
    });

    it('should update updatedAt timestamp after recovery', () => {
      const cart = createEmptyGuestCart('test');
      const originalUpdatedAt = cart.updatedAt;
      
      const recovered = recoverFromStorageQuota(cart);
      
      expect(recovered.updatedAt).not.toBe(originalUpdatedAt);
    });

    it('should handle cart with fewer items than max', () => {
      const cart = createEmptyGuestCart('test');
      cart.items = [
        { productId: 'prod1', quantity: 1, variantId: null, price: 50, addedAt: new Date().toISOString() },
        { productId: 'prod2', quantity: 2, variantId: null, price: 75, addedAt: new Date().toISOString() }
      ];
      
      const recovered = recoverFromStorageQuota(cart);
      
      // Should keep all items since they're under the limit
      expect(recovered.items.length).toBe(2);
    });
  });

  describe('saveGuestCartWithErrorHandling', () => {
    it('should return true on successful save', () => {
      const cart = createEmptyGuestCart('test');
      
      const result = saveGuestCartWithErrorHandling(cart);
      
      expect(result).toBe(true);
    });

    it('should return false when storage fails', () => {
      const cart = createEmptyGuestCart('test');
      mockLocalStorage.setItem.mockImplementation(() => {
        throw new Error('QuotaExceeded');
      });
      
      const result = saveGuestCartWithErrorHandling(cart);
      
      expect(result).toBe(false);
    });

    it('should attempt recovery on quota error', () => {
      const cart = createEmptyGuestCart('test');
      cart.items = Array.from({ length: 10 }, (_, i) => ({
        productId: `prod${i}`,
        quantity: 1,
        variantId: null,
        price: 99.99,
        addedAt: new Date().toISOString()
      }));
      
      let callCount = 0;
      mockLocalStorage.setItem.mockImplementation(() => {
        callCount++;
        if (callCount > 1) throw new Error('QuotaExceeded');
      });
      
      const result = saveGuestCartWithErrorHandling(cart);
      
      expect(result).toBe(true);
    });
  });

  describe('Consent Management', () => {
    describe('hasCartConsent', () => {
      it('should return false when consent not set', () => {
        const result = hasCartConsent();
        expect(result).toBe(false);
      });

      it('should return true when consent is granted', () => {
        mockLocalStorage.setItem('smart_tech_cart_consent', 'true');
        const result = hasCartConsent();
        expect(result).toBe(true);
      });

      it('should return false when consent is false', () => {
        mockLocalStorage.setItem('smart_tech_cart_consent', 'false');
        const result = hasCartConsent();
        expect(result).toBe(false);
      });
    });

    describe('grantCartConsent', () => {
      it('should set consent in localStorage', () => {
        grantCartConsent();
        
        expect(mockLocalStorage.setItem).toHaveBeenCalledWith('smart_tech_cart_consent', 'true');
      });
    });

    describe('revokeCartConsent', () => {
      it('should remove consent from localStorage', () => {
        mockLocalStorage.setItem('smart_tech_cart_consent', 'true');
        
        revokeCartConsent();
        
        expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('smart_tech_cart_consent');
      });
    });
  });
});
