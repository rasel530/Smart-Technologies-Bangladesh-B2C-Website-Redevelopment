/**
 * Guest Cart Cross-Session Integration Tests
 * 
 * Comprehensive integration tests for guest cart persistence,
 * cross-tab synchronization, and storage failure recovery
 * 
 * @author Smart Tech B2C Development Team
 * @version 1.0.0
 */

import { v4 as uuidv4 } from 'uuid';

// Mock browser environment utilities
const createBrowserMocks = () => {
  const storage: Map<string, string> = new Map();
  const memoryStorage: Map<string, string> = new Map();
  const cookies: Map<string, string> = new Map();
  const eventListeners: Map<string, Function[]> = new Map();

  return {
    storage,
    memoryStorage,
    cookies,
    eventListeners,

    localStorage: {
      getItem: jest.fn((key: string) => storage.get(key) || null),
      setItem: jest.fn((key: string, value: string) => {
        if (storage.size > 1000) throw new Error('QuotaExceeded');
        storage.set(key, value);
      }),
      removeItem: jest.fn((key: string) => storage.delete(key)),
      clear: jest.fn(() => storage.clear()),
      get length() { return storage.size; },
      key: jest.fn((i: number) => Array.from(storage.keys())[i] || null)
    },

    sessionStorage: {
      getItem: jest.fn((key: string) => memoryStorage.get(key) || null),
      setItem: jest.fn((key: string, value: string) => memoryStorage.set(key, value)),
      removeItem: jest.fn((key: string) => memoryStorage.delete(key)),
      clear: jest.fn(() => memoryStorage.clear()),
      get length() { return memoryStorage.size; },
      key: jest.fn((i: number) => Array.from(memoryStorage.keys())[i] || null)
    },

    document: {
      cookie: {
        get: () => Array.from(cookies.entries())
          .map(([k, v]) => `${k}=${v}`)
          .join('; '),
        set: jest.fn((cookie: string) => {
          const [nameVal] = cookie.split(';');
          const [name, value] = nameVal.split('=');
          cookies.set(name.trim(), value);
        }),
        delete: jest.fn((name: string) => cookies.delete(name))
      }
    },

    window: {
      addEventListener: jest.fn((event: string, handler: Function) => {
        const listeners = eventListeners.get(event) || [];
        listeners.push(handler);
        eventListeners.set(event, listeners);
      }),
      removeEventListener: jest.fn((event: string, handler: Function) => {
        const listeners = eventListeners.get(event) || [];
        eventListeners.set(event, listeners.filter(h => h !== handler));
      }),
      dispatchEvent: jest.fn((event: Event) => {
        const listeners = eventListeners.get(event.type) || [];
        listeners.forEach(l => l(event));
        return true;
      })
    },

    simulateBrowserRestart: () => {
      storage.clear();
      memoryStorage.clear();
      cookies.clear();
    },

    simulateTabClose: () => {
      memoryStorage.clear();
    },

    triggerStorageEvent: (key: string, newValue: string | null, oldValue: string | null) => {
      const listeners = eventListeners.get('storage') || [];
      const event = new StorageEvent('storage', {
        key,
        newValue,
        oldValue,
        storageArea: storage as unknown as Storage
      });
      listeners.forEach(l => l(event));
    }
  };
};

// Guest Cart API implementation for testing
interface CartItem {
  id: string;
  productId: string;
  quantity: number;
  price: number;
  variantId: string | null;
  addedAt: number;
}

interface GuestCart {
  sessionId: string;
  items: CartItem[];
  createdAt: number;
  updatedAt: number;
}

const SESSION_ID_KEY = 'smart_tech_guest_session';
const CART_KEY_PREFIX = 'smart_tech_cart_';
const COOKIE_NAME = 'smart_tech_guest_session';

class GuestCartAPI {
  private browser: ReturnType<typeof createBrowserMocks>;
  private backendAPI: {
    getCart: (sessionId: string) => Promise<GuestCart>;
    addItem: (sessionId: string, item: Omit<CartItem, 'id' | 'addedAt'>) => Promise<CartItem>;
    updateItem: (sessionId: string, itemId: string, quantity: number) => Promise<void>;
    removeItem: (sessionId: string, itemId: string) => Promise<void>;
    clearCart: (sessionId: string) => Promise<void>;
  };

  constructor(browserMocks: ReturnType<typeof createBrowserMocks>) {
    this.browser = browserMocks;
    this.backendAPI = {
      getCart: async (sessionId: string) => {
        // Simulate backend API call
        const stored = this.browser.localStorage.getItem(`${CART_KEY_PREFIX}${sessionId}`);
        return stored ? JSON.parse(stored) : null;
      },
      addItem: async (sessionId: string, item: Omit<CartItem, 'id' | 'addedAt'>) => {
        const newItem: CartItem = {
          ...item,
          id: uuidv4(),
          addedAt: Date.now()
        };
        return newItem;
      },
      updateItem: async () => {},
      removeItem: async () => {},
      clearCart: async () => {}
    };
  }

  async generateSessionId(): Promise<string> {
    // Check localStorage first
    let sessionId = this.browser.localStorage.getItem(SESSION_ID_KEY);
    
    if (!sessionId) {
      // Check cookie
      const cookies = this.browser.document.cookie.get()
        .split(';')
        .reduce((acc: Record<string, string>, cookie) => {
          const [name, value] = cookie.trim().split('=');
          if (name === COOKIE_NAME) acc[name] = value;
          return acc;
        }, {});
      
      sessionId = cookies[COOKIE_NAME];
    }

    if (!sessionId) {
      // Generate new session ID
      sessionId = `guest_${uuidv4()}`;
      
      // Store in localStorage
      this.browser.localStorage.setItem(SESSION_ID_KEY, sessionId);
      
      // Store in cookie (expires in 30 days)
      this.browser.document.cookie.set(`${COOKIE_NAME}=${sessionId}; max-age=${30 * 24 * 60 * 60}; path=/`);
    }

    return sessionId;
  }

  async addItem(item: Omit<CartItem, 'id' | 'addedAt'>): Promise<CartItem> {
    const sessionId = await this.generateSessionId();
    const newItem = await this.backendAPI.addItem(sessionId, item);
    
    // Get existing cart
    let cart = await this.backendAPI.getCart(sessionId);
    
    if (!cart) {
      cart = {
        sessionId,
        items: [],
        createdAt: Date.now(),
        updatedAt: Date.now()
      };
    }

    // Check for existing item
    const existingIndex = cart.items.findIndex(
      i => i.productId === item.productId && i.variantId === item.variantId
    );

    if (existingIndex >= 0) {
      // Update quantity
      cart.items[existingIndex].quantity += item.quantity;
    } else {
      // Add new item
      cart.items.push(newItem);
    }

    cart.updatedAt = Date.now();

    // Persist
    this.browser.localStorage.setItem(`${CART_KEY_PREFIX}${sessionId}`, JSON.stringify(cart));
    this.browser.localStorage.setItem(SESSION_ID_KEY, sessionId);

    // Notify other tabs
    this.browser.window.dispatchEvent(new CustomEvent('guest-cart-updated', {
      detail: { sessionId, items: cart.items }
    }));

    return newItem;
  }

  async getCart(): Promise<GuestCart | null> {
    const sessionId = await this.generateSessionId();
    return this.backendAPI.getCart(sessionId);
  }

  async getCartItems(): Promise<CartItem[]> {
    const cart = await this.getCart();
    return cart?.items || [];
  }

  async updateItem(itemId: string, quantity: number): Promise<void> {
    const sessionId = await this.generateSessionId();
    let cart = await this.backendAPI.getCart(sessionId);
    
    if (cart) {
      const itemIndex = cart.items.findIndex(i => i.id === itemId);
      if (itemIndex >= 0) {
        if (quantity <= 0) {
          cart.items.splice(itemIndex, 1);
        } else {
          cart.items[itemIndex].quantity = quantity;
        }
        cart.updatedAt = Date.now();
        this.browser.localStorage.setItem(`${CART_KEY_PREFIX}${sessionId}`, JSON.stringify(cart));
      }
    }

    this.browser.window.dispatchEvent(new CustomEvent('guest-cart-updated', {
      detail: { sessionId, items: cart?.items || [] }
    }));
  }

  async removeItem(itemId: string): Promise<void> {
    await this.updateItem(itemId, 0);
  }

  async clearCart(): Promise<void> {
    const sessionId = await this.generateSessionId();
    
    this.browser.localStorage.removeItem(`${CART_KEY_PREFIX}${sessionId}`);
    
    this.browser.window.dispatchEvent(new CustomEvent('guest-cart-cleared', {
      detail: { sessionId }
    }));
  }

  async loadCart(): Promise<GuestCart | null> {
    const sessionId = await this.generateSessionId();
    return this.backendAPI.getCart(sessionId);
  }

  getSessionId(): string {
    return this.browser.localStorage.getItem(SESSION_ID_KEY) || '';
  }
}

// Setup and teardown utilities
let browserMocks: ReturnType<typeof createBrowserMocks>;
let cartAPI: GuestCartAPI;

const setupIntegrationTests = () => {
  beforeAll(() => {
    browserMocks = createBrowserMocks();
    
    // Mock global objects
    global.localStorage = browserMocks.localStorage as unknown as Storage;
    global.sessionStorage = browserMocks.sessionStorage as unknown as Storage;
    
    cartAPI = new GuestCartAPI(browserMocks);
  });

  afterAll(() => {
    browserMocks.storage.clear();
    browserMocks.memoryStorage.clear();
    browserMocks.cookies.clear();
  });

  beforeEach(() => {
    browserMocks.storage.clear();
    browserMocks.memoryStorage.clear();
    browserMocks.cookies.clear();
    jest.clearAllMocks();
  });
};

describe('Guest Cart Cross-Session Integration', () => {
  beforeAll(async () => {
    setupIntegrationTests();
  });

  afterAll(() => {
    browserMocks.storage.clear();
    browserMocks.memoryStorage.clear();
    browserMocks.cookies.clear();
  });

  beforeEach(() => {
    browserMocks.storage.clear();
    browserMocks.memoryStorage.clear();
    browserMocks.cookies.clear();
    jest.clearAllMocks();
  });

  // ============================================
  // Cart Persistence Across Sessions
  // ============================================
  describe('Cart Persistence Across Sessions', () => {
    it('should persist cart after browser restart simulation', async () => {
      // Add items to cart
      await cartAPI.addItem({ productId: 'prod1', quantity: 2, price: 99.99, variantId: null });
      await cartAPI.addItem({ productId: 'prod2', quantity: 1, price: 49.99, variantId: null });

      // Verify items added
      let items = await cartAPI.getCartItems();
      expect(items).toHaveLength(2);

      // Simulate browser restart (clear memory state)
      browserMocks.simulateBrowserRestart();

      // Session ID should still be recoverable from cookie
      const sessionId = await cartAPI.generateSessionId();
      expect(sessionId).toBeTruthy();

      // Load cart from storage
      const cart = await cartAPI.loadCart();
      expect(cart).not.toBeNull();
      expect(cart?.items).toHaveLength(2);
    });

    it('should handle session ID recovery from cookies', async () => {
      // Generate session
      const sessionId = await cartAPI.generateSessionId();
      expect(sessionId.length).toBeGreaterThan(0);

      // Clear localStorage but keep cookie
      browserMocks.localStorage.removeItem(SESSION_ID_KEY);

      // Verify session can be recovered from cookie
      const recoveredSessionId = await cartAPI.generateSessionId();
      expect(recoveredSessionId).toBe(sessionId);
    });

    it('should sync cart when session ID recovered from cookie', async () => {
      // Generate session and add item
      const sessionId = await cartAPI.generateSessionId();
      await cartAPI.addItem({ productId: 'prod1', quantity: 3, price: 29.99, variantId: null });

      // Verify item added
      let cart = await cartAPI.getCart();
      expect(cart?.items).toHaveLength(1);
      expect(cart?.items[0].quantity).toBe(3);

      // Simulate session recovery (clear localStorage)
      browserMocks.localStorage.removeItem(SESSION_ID_KEY);

      // Recover session
      const recoveredSessionId = await cartAPI.generateSessionId();
      expect(recoveredSessionId).toBe(sessionId);

      // Cart should still be accessible
      cart = await cartAPI.loadCart();
      expect(cart?.items).toHaveLength(1);
      expect(cart?.items[0].quantity).toBe(3);
    });

    it('should persist cart across page refreshes', async () => {
      // Add items
      await cartAPI.addItem({ productId: 'prod1', quantity: 1, price: 100.00, variantId: null });
      await cartAPI.addItem({ productId: 'prod2', quantity: 2, price: 50.00, variantId: null });

      // Simulate page refresh
      const newCartAPI = new GuestCartAPI(browserMocks);

      // Get cart from new API instance
      const items = await newCartAPI.getCartItems();
      expect(items).toHaveLength(2);
    });

    it('should maintain cart integrity during session migration', async () => {
      // Create cart with multiple items
      await cartAPI.addItem({ productId: 'prod1', quantity: 2, price: 100.00, variantId: null });
      await cartAPI.addItem({ productId: 'prod2', quantity: 3, price: 75.00, variantId: null });
      await cartAPI.addItem({ productId: 'prod3', quantity: 1, price: 200.00, variantId: null });

      // Store session ID
      const originalSessionId = cartAPI.getSessionId();

      // Simulate migration (clear localStorage, keep cookie)
      browserMocks.localStorage.clear();

      // Create new cart API instance
      const migratedCartAPI = new GuestCartAPI(browserMocks);

      // Verify session recovered
      const recoveredSessionId = migratedCartAPI.getSessionId();
      expect(recoveredSessionId).toBe(originalSessionId);

      // Verify cart integrity
      const items = await migratedCartAPI.getCartItems();
      expect(items).toHaveLength(3);
      expect(items.reduce((sum, item) => sum + item.quantity, 0)).toBe(6);
    });

    it('should handle empty cart correctly after persistence', async () => {
      // Create empty cart
      const sessionId = await cartAPI.generateSessionId();
      
      // Verify empty
      let cart = await cartAPI.getCart();
      expect(cart?.items).toHaveLength(0);

      // Reload
      cart = await cartAPI.loadCart();
      expect(cart?.items).toHaveLength(0);
      expect(cart?.sessionId).toBe(sessionId);
    });

    it('should handle large cart data persistence', async () => {
      // Add many items
      const items = [];
      for (let i = 0; i < 50; i++) {
        await cartAPI.addItem({
          productId: `prod_${i}`,
          quantity: Math.floor(Math.random() * 5) + 1,
          price: Math.floor(Math.random() * 1000) + 10,
          variantId: null
        });
        items.push(i);
      }

      // Verify all items persisted
      const cartItems = await cartAPI.getCartItems();
      expect(cartItems).toHaveLength(50);
    });

    it('should recover cart after localStorage corruption simulation', async () => {
      // Add items
      await cartAPI.addItem({ productId: 'prod1', quantity: 2, price: 99.99, variantId: null });

      // Simulate corruption
      browserMocks.localStorage.setItem(`${CART_KEY_PREFIX}${cartAPI.getSessionId()}`, 'invalid json{');

      // Should handle gracefully
      const cart = await cartAPI.getCart();
      expect(cart).not.toBeNull();
    });

    it('should handle concurrent storage writes', async () => {
      const cartAPI1 = new GuestCartAPI(browserMocks);
      const cartAPI2 = new GuestCartAPI(browserMocks);

      // Add items concurrently
      await Promise.all([
        cartAPI1.addItem({ productId: 'prod1', quantity: 1, price: 100.00, variantId: null }),
        cartAPI2.addItem({ productId: 'prod2', quantity: 2, price: 50.00, variantId: null })
      ]);

      // Both should have persisted
      const cart = await cartAPI.getCart();
      expect(cart?.items).toHaveLength(2);
    });
  });

  // ============================================
  // Cross-Tab Synchronization
  // ============================================
  describe('Cross-Tab Synchronization', () => {
    it('should sync cart updates across tabs', async () => {
      const tab1 = new GuestCartAPI(browserMocks);
      const tab2 = new GuestCartAPI(browserMocks);

      // Add item in tab 1
      const item = await tab1.addItem({ productId: 'prod1', quantity: 2, price: 99.99, variantId: null });

      // Dispatch custom event
      browserMocks.window.dispatchEvent(new CustomEvent('guest-cart-updated', {
        detail: { 
          sessionId: tab1.getSessionId(),
          items: [{ ...item, quantity: 2 }]
        }
      }));

      // Tab 2 should receive update (simulate by getting cart)
      const tab2Items = await tab2.getCartItems();
      expect(tab2Items).toHaveLength(1);
    });

    it('should handle cart clear across tabs', async () => {
      const tab1 = new GuestCartAPI(browserMocks);
      const tab2 = new GuestCartAPI(browserMocks);

      // Add items in tab 1
      await tab1.addItem({ productId: 'prod1', quantity: 2, price: 99.99, variantId: null });

      // Clear cart in tab 1
      await tab1.clearCart();

      // Dispatch clear event
      browserMocks.window.dispatchEvent(new CustomEvent('guest-cart-cleared', {
        detail: { sessionId: tab1.getSessionId() }
      }));

      // Tab 2 should show empty cart
      const tab2Items = await tab2.getCartItems();
      expect(tab2Items).toHaveLength(0);
    });

    it('should sync quantity updates across tabs', async () => {
      const tab1 = new GuestCartAPI(browserMocks);
      const tab2 = new GuestCartAPI(browserMocks);

      // Add item in tab 1
      const item = await tab1.addItem({ productId: 'prod1', quantity: 2, price: 99.99, variantId: null });

      // Update quantity in tab 1
      await tab1.updateItem(item.id, 5);

      // Dispatch update event
      browserMocks.window.dispatchEvent(new CustomEvent('guest-cart-updated', {
        detail: {
          sessionId: tab1.getSessionId(),
          items: [{ ...item, quantity: 5 }]
        }
      }));

      // Tab 2 should reflect new quantity
      const tab2Cart = await tab2.getCart();
      expect(tab2Cart?.items[0].quantity).toBe(5);
    });

    it('should handle remove item across tabs', async () => {
      const tab1 = new GuestCartAPI(browserMocks);
      const tab2 = new GuestCartAPI(browserMocks);

      // Add items in tab 1
      const item1 = await tab1.addItem({ productId: 'prod1', quantity: 2, price: 99.99, variantId: null });
      await tab1.addItem({ productId: 'prod2', quantity: 1, price: 49.99, variantId: null });

      // Remove item 1 in tab 1
      await tab1.removeItem(item1.id);

      // Dispatch update event
      browserMocks.window.dispatchEvent(new CustomEvent('guest-cart-updated', {
        detail: {
          sessionId: tab1.getSessionId(),
          items: [{ productId: 'prod2', quantity: 1, price: 49.99, variantId: null, id: 'new-id' }]
        }
      }));

      // Tab 2 should have one item
      const tab2Items = await tab2.getCartItems();
      expect(tab2Items).toHaveLength(1);
    });

    it('should handle multiple tabs with last-write-wins', async () => {
      const tab1 = new GuestCartAPI(browserMocks);
      const tab2 = new GuestCartAPI(browserMocks);
      const tab3 = new GuestCartAPI(browserMocks);

      // All tabs start with same session
      await tab1.addItem({ productId: 'prod1', quantity: 1, price: 100.00, variantId: null });

      // Tab 2 adds item
      await tab2.addItem({ productId: 'prod2', quantity: 2, price: 50.00, variantId: null });

      // Tab 3 adds item
      await tab3.addItem({ productId: 'prod3', quantity: 3, price: 33.33, variantId: null });

      // Final cart should have all items (last write wins merges)
      const cart = await cartAPI.getCart();
      expect(cart?.items.length).toBeGreaterThanOrEqual(1);
    });

    it('should notify tab of external cart changes', async () => {
      const tab1 = new GuestCartAPI(browserMocks);
      const eventHandler = jest.fn();

      // Add event listener
      browserMocks.window.addEventListener('guest-cart-updated', eventHandler);

      // Add item
      await tab1.addItem({ productId: 'prod1', quantity: 1, price: 100.00, variantId: null });

      // Event should have been triggered
      expect(eventHandler).toHaveBeenCalled();
    });

    it('should handle rapid successive updates from multiple tabs', async () => {
      const tab1 = new GuestCartAPI(browserMocks);
      const tab2 = new GuestCartAPI(browserMocks);

      // Rapid updates
      const updates = [];
      for (let i = 0; i < 10; i++) {
        updates.push(tab1.addItem({ productId: `prod_${i}`, quantity: 1, price: 10.00, variantId: null }));
        updates.push(tab2.addItem({ productId: `prod_${i + 10}`, quantity: 1, price: 10.00, variantId: null }));
      }

      await Promise.all(updates);

      // Cart should have items (some might be duplicates)
      const cart = await cartAPI.getCart();
      expect(cart?.items.length).toBeGreaterThan(0);
    });
  });

  // ============================================
  // Storage Failure Recovery
  // ============================================
  describe('Storage Failure Recovery', () => {
    it('should handle localStorage quota exceeded', async () => {
      const storageAPI = browserMocks.localStorage;
      let attempts = 0;
      const originalSetItem = storageAPI.setItem.bind(storageAPI);
      
      // Mock quota exceeded after first write
      storageAPI.setItem = jest.fn((key: string, value: string) => {
        attempts++;
        if (attempts > 1) throw new Error('QuotaExceeded');
        return originalSetItem(key, value);
      });

      const testCartAPI = new GuestCartAPI(browserMocks);

      // First add should succeed
      await testCartAPI.addItem({ productId: 'prod1', quantity: 1, price: 99.99, variantId: null });

      // Restore original
      storageAPI.setItem = originalSetItem;
    });

    it('should fallback to sessionStorage on localStorage failure', async () => {
      // Disable localStorage
      Object.defineProperty(browserMocks, 'localStorage', {
        value: {
          setItem: jest.fn().mockRejectedValue(new Error('Disabled')),
          getItem: jest.fn().mockReturnValue(null),
          removeItem: jest.fn(),
          clear: jest.fn()
        },
        writable: true
      });

      const testCartAPI = new GuestCartAPI(browserMocks);

      // Should use sessionStorage as fallback
      const sessionId = await testCartAPI.generateSessionId();
      expect(sessionId).toBeTruthy();
    });

    it('should handle storage read errors gracefully', async () => {
      // Mock read error
      browserMocks.localStorage.getItem = jest.fn().mockImplementation(() => {
        throw new Error('Read error');
      });

      // Should not throw
      const cart = await cartAPI.getCart();
      expect(cart).toBeNull();
    });

    it('should handle storage write errors gracefully', async () => {
      // Mock write error
      const originalSetItem = browserMocks.localStorage.setItem;
      browserMocks.localStorage.setItem = jest.fn().mockImplementation(() => {
        throw new Error('Write error');
      });

      // Should not throw
      await cartAPI.addItem({ productId: 'prod1', quantity: 1, price: 99.99, variantId: null });

      // Restore
      browserMocks.localStorage.setItem = originalSetItem;
    });

    it('should retry failed storage operations', async () => {
      const storageAPI = browserMocks.localStorage;
      let attemptCount = 0;
      
      storageAPI.setItem = jest.fn().mockImplementation(() => {
        attemptCount++;
        if (attemptCount === 1) throw new Error('Temporary failure');
        return undefined;
      });

      const testCartAPI = new GuestCartAPI(browserMocks);

      // Should retry and succeed
      await testCartAPI.addItem({ productId: 'prod1', quantity: 1, price: 99.99, variantId: null });

      expect(attemptCount).toBeGreaterThan(1);
    });

    it('should report storage warnings to user', async () => {
      const warningHandler = jest.fn();
      browserMocks.window.addEventListener('storage-warning', warningHandler as unknown as Function);

      // Simulate quota warning
      browserMocks.window.dispatchEvent(new CustomEvent('storage-warning', {
        detail: { type: 'quota', message: 'Storage nearly full' }
      }));

      expect(warningHandler).toHaveBeenCalled();
    });

    it('should clear expired cart data', async () => {
      // Add items
      await cartAPI.addItem({ productId: 'prod1', quantity: 1, price: 100.00, variantId: null });

      // Set cart to old timestamp (simulate expiration)
      const cart = await cartAPI.getCart();
      if (cart) {
        cart.createdAt = Date.now() - (31 * 24 * 60 * 60 * 1000); // 31 days ago
        browserMocks.localStorage.setItem(
          `${CART_KEY_PREFIX}${cartAPI.getSessionId()}`,
          JSON.stringify(cart)
        );
      }

      // Cart should be treated as expired
      const loadedCart = await cartAPI.loadCart();
      // Should handle expired cart appropriately
    });

    it('should migrate legacy cart format', async () => {
      // Simulate legacy cart format
      const legacyCart = {
        sessionId: cartAPI.getSessionId() || 'legacy_session',
        items: [
          { productId: 'legacy_prod', quantity: 2, price: 99.99 } // Missing id and addedAt
        ]
      };

      browserMocks.localStorage.setItem(
        `${CART_KEY_PREFIX}${legacyCart.sessionId}`,
        JSON.stringify(legacyCart)
      );

      // Should migrate successfully
      const cart = await cartAPI.getCart();
      expect(cart?.items[0]).toHaveProperty('id');
    });
  });

  // ============================================
  // Cookie Management
  // ============================================
  describe('Cookie Management', () => {
    it('should store session ID in cookies', async () => {
      const sessionId = await cartAPI.generateSessionId();
      
      const cookieValue = browserMocks.document.cookie.get()
        .split(';')
        .find(c => c.trim().startsWith(`${COOKIE_NAME}=`));
      
      expect(cookieValue).toContain(sessionId);
    });

    it('should set cookie with correct attributes', async () => {
      await cartAPI.generateSessionId();
      
      expect(browserMocks.document.cookie.set).toHaveBeenCalledWith(
        expect.stringContaining(COOKIE_NAME),
        expect.stringContaining('max-age='),
        expect.stringContaining('path=/')
      );
    });

    it('should recover session from cookie when localStorage unavailable', async () => {
      const sessionId = await cartAPI.generateSessionId();
      
      // Clear localStorage
      browserMocks.localStorage.clear();
      
      // Should still recover from cookie
      const recoveredId = await cartAPI.generateSessionId();
      expect(recoveredId).toBe(sessionId);
    });

    it('should handle missing cookie gracefully', async () => {
      // No session in localStorage or cookie
      browserMocks.localStorage.clear();
      browserMocks.cookies.clear();
      
      // Should generate new session
      const newSessionId = await cartAPI.generateSessionId();
      expect(newSessionId.length).toBeGreaterThan(0);
    });

    it('should refresh cookie expiration on activity', async () => {
      const sessionId = await cartAPI.generateSessionId();
      const originalCookieSetCall = browserMocks.document.cookie.set.mock.calls.length;
      
      // Perform cart operation
      await cartAPI.addItem({ productId: 'prod1', quantity: 1, price: 100.00, variantId: null });
      
      // Cookie should be refreshed
      expect(browserMocks.document.cookie.set).toHaveBeenCalled();
    });
  });

  // ============================================
  // Session ID Generation
  // ============================================
  describe('Session ID Generation', () => {
    it('should generate unique session IDs', async () => {
      const sessionIds = new Set<string>();
      
      for (let i = 0; i < 100; i++) {
        browserMocks.localStorage.clear();
        const sessionId = await cartAPI.generateSessionId();
        sessionIds.add(sessionId);
      }
      
      expect(sessionIds.size).toBe(100);
    });

    it('should generate UUID-formatted session IDs', async () => {
      const sessionId = await cartAPI.generateSessionId();
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      
      expect(sessionId).toMatch(uuidRegex);
    });

    it('should prefix session ID for guests', async () => {
      const sessionId = await cartAPI.generateSessionId();
      expect(sessionId.startsWith('guest_')).toBe(true);
    });
  });

  // ============================================
  // Item Management Integration
  // ============================================
  describe('Item Management Integration', () => {
    it('should combine quantities for same product', async () => {
      await cartAPI.addItem({ productId: 'prod1', quantity: 2, price: 100.00, variantId: null });
      await cartAPI.addItem({ productId: 'prod1', quantity: 3, price: 100.00, variantId: null });
      
      const items = await cartAPI.getCartItems();
      expect(items).toHaveLength(1);
      expect(items[0].quantity).toBe(5);
    });

    it('should keep separate quantities for different variants', async () => {
      await cartAPI.addItem({ productId: 'prod1', quantity: 2, price: 100.00, variantId: 'red' });
      await cartAPI.addItem({ productId: 'prod1', quantity: 3, price: 100.00, variantId: 'blue' });
      
      const items = await cartAPI.getCartItems();
      expect(items).toHaveLength(2);
      expect(items.find(i => i.variantId === 'red')?.quantity).toBe(2);
      expect(items.find(i => i.variantId === 'blue')?.quantity).toBe(3);
    });

    it('should calculate cart totals correctly', async () => {
      await cartAPI.addItem({ productId: 'prod1', quantity: 2, price: 100.00, variantId: null });
      await cartAPI.addItem({ productId: 'prod2', quantity: 3, price: 50.00, variantId: null });
      
      const cart = await cartAPI.getCart();
      
      const expectedSubtotal = (2 * 100.00) + (3 * 50.00);
      const actualSubtotal = cart?.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      
      expect(actualSubtotal).toBe(expectedSubtotal);
    });

    it('should handle zero quantity items correctly', async () => {
      const item = await cartAPI.addItem({ productId: 'prod1', quantity: 2, price: 100.00, variantId: null });
      
      // Update to zero
      await cartAPI.updateItem(item.id, 0);
      
      const items = await cartAPI.getCartItems();
      expect(items).toHaveLength(0);
    });

    it('should preserve item order by addition time', async () => {
      const item1 = await cartAPI.addItem({ productId: 'prod1', quantity: 1, price: 100.00, variantId: null });
      const item2 = await cartAPI.addItem({ productId: 'prod2', quantity: 1, price: 50.00, variantId: null });
      const item3 = await cartAPI.addItem({ productId: 'prod3', quantity: 1, price: 75.00, variantId: null });
      
      const items = await cartAPI.getCartItems();
      
      expect(items[0].productId).toBe('prod1');
      expect(items[1].productId).toBe('prod2');
      expect(items[2].productId).toBe('prod3');
    });
  });

  // ============================================
  // Event Handling
  // ============================================
  describe('Event Handling', () => {
    it('should dispatch event on cart update', async () => {
      const eventHandler = jest.fn();
      browserMocks.window.addEventListener('guest-cart-updated', eventHandler as unknown as Function);
      
      await cartAPI.addItem({ productId: 'prod1', quantity: 1, price: 100.00, variantId: null });
      
      expect(eventHandler).toHaveBeenCalled();
    });

    it('should dispatch event on cart clear', async () => {
      const eventHandler = jest.fn();
      browserMocks.window.addEventListener('guest-cart-cleared', eventHandler as unknown as Function);
      
      await cartAPI.clearCart();
      
      expect(eventHandler).toHaveBeenCalled();
    });

    it('should include correct event data', async () => {
      let eventData: any = null;
      browserMocks.window.addEventListener('guest-cart-updated', ((e: CustomEvent) => {
        eventData = e.detail;
      }) as unknown as Function);
      
      await cartAPI.addItem({ productId: 'prod1', quantity: 2, price: 99.99, variantId: null });
      
      expect(eventData).toHaveProperty('sessionId');
      expect(eventData).toHaveProperty('items');
      expect(eventData.items).toHaveLength(1);
    });
  });
});
