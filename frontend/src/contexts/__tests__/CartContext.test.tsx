/**
 * CartContext Test Suite
 * 
 * Comprehensive tests for CartContext state management,
 * cart operations, and persistence.
 */

import React, { ReactNode } from 'react';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useCart } from '@/contexts/CartContext';
import { CartProvider } from '@/contexts/CartContext';
import * as guestCartUtils from '@/lib/utils/guestCart';
import * as cartApi from '@/lib/api/cart';
import { Product } from '@/types/product';

// Mock dependencies
jest.mock('@/lib/utils/guestCart', () => ({
  loadGuestCartFromStorage: jest.fn(),
  saveGuestCartToStorage: jest.fn(),
  saveGuestCartWithErrorHandling: jest.fn(() => true),
  clearGuestCartFromStorage: jest.fn(),
  getGuestSessionId: jest.fn(() => 'test_session_123'),
  setGuestSessionId: jest.fn(),
  removeGuestSessionId: jest.fn(),
  generateGuestSessionId: jest.fn(() => 'generated_session_123'),
  createEmptyGuestCart: jest.fn((sessionId) => ({
    sessionId,
    items: [],
    shippingMethod: 'standard',
    discountCode: null,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    version: '1'
  })),
  addItemToGuestCart: jest.fn((cart, productId, quantity, variantId, price) => ({
    ...cart,
    items: [...cart.items, { productId, quantity, variantId, price, addedAt: new Date().toISOString() }]
  })),
  removeItemFromGuestCart: jest.fn((cart, productId, variantId) => ({
    ...cart,
    items: cart.items.filter(item => !(item.productId === productId && item.variantId === variantId))
  })),
  updateItemQuantityInGuestCart: jest.fn((cart, productId, variantId, quantity) => ({
    ...cart,
    items: cart.items.map(item => 
      item.productId === productId && item.variantId === variantId 
        ? { ...item, quantity } 
        : item
    )
  })),
  listenForGuestCartUpdates: jest.fn(() => () => {}),
  listenForGuestCartClear: jest.fn(() => () => {}),
  hasCartConsent: jest.fn(() => true),
  grantCartConsent: jest.fn(),
  setToastErrorCallback: jest.fn(),
}));

jest.mock('@/lib/api/cart', () => ({
  getCart: jest.fn(),
  addToCart: jest.fn(),
  removeCartItem: jest.fn(),
  updateCartItemQuantity: jest.fn(),
  clearCart: jest.fn(),
  applyDiscount: jest.fn(),
  removeDiscount: jest.fn(),
  validateCart: jest.fn(),
  mergeGuestCart: jest.fn(),
  getCartCount: jest.fn(() => Promise.resolve(0)),
  validateGuestCartStock: jest.fn(() => Promise.resolve(true)),
  createOrUpdateGuestCartBackend: jest.fn(() => Promise.resolve({})),
}));

// Mock AuthContext
const mockUseAuth = {
  user: null,
  isLoading: false,
};

jest.mock('@/contexts/AuthContext', () => ({
  useAuth: () => mockUseAuth,
}));

// Mock localStorage
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

Object.defineProperty(global, 'localStorage', {
  value: mockLocalStorage,
  writable: true,
});

// Mock window events
const mockDispatchEvent = jest.fn();
Object.defineProperty(global, 'dispatchEvent', {
  value: mockDispatchEvent,
  writable: true,
});

describe('CartContext', () => {
  const mockProduct: Product = {
    id: 'prod1',
    name: 'Test Product',
    slug: 'test-product',
    description: 'A test product',
    regularPrice: 99.99,
    salePrice: null,
    stockQuantity: 100,
    sku: 'TEST-001',
    images: ['/test.jpg'],
    status: 'active',
    categoryId: 'cat1',
    brandId: 'brand1',
    specifications: {},
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const mockCart: any = {
    id: 'cart123',
    items: [],
    subtotal: 0,
    tax: 0,
    shippingCost: 0,
    discount: 0,
    total: 0,
    status: 'active' as const,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    mockLocalStorage.clear();
    mockLocalStorage.store = {};
    mockDispatchEvent.mockClear();
    jest.clearAllMocks();
    mockUseAuth.user = null;
    
    // Reset mocks to default behavior
    (guestCartUtils.loadGuestCartFromStorage as jest.Mock).mockReturnValue(null);
    (guestCartUtils.createEmptyGuestCart as jest.Mock).mockImplementation((sessionId) => ({
      sessionId,
      items: [],
      shippingMethod: 'standard',
      discountCode: null,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      version: '1'
    }));
    (cartApi.getCart as jest.Mock).mockResolvedValue(mockCart);
    (cartApi.validateGuestCartStock as jest.Mock).mockResolvedValue(true);
  });

  describe('Initial State', () => {
    it('should initialize with empty cart for guest user', async () => {
      const { result } = renderHook(() => useCart(), {
        wrapper: ({ children }: { children: ReactNode }) => (
          <CartProvider>{children}</CartProvider>
        ),
      });

      await waitFor(() => {
        expect(result.current.items).toEqual([]);
        expect(result.current.isGuest).toBe(true);
        expect(result.current.sessionId).toBe('test_session_123');
      });
    });

    it('should initialize with item count of 0', async () => {
      const { result } = renderHook(() => useCart(), {
        wrapper: ({ children }: { children: ReactNode }) => (
          <CartProvider>{children}</CartProvider>
        ),
      });

      await waitFor(() => {
        expect(result.current.itemCount).toBe(0);
      });
    });

    it('should initialize with zero totals', async () => {
      const { result } = renderHook(() => useCart(), {
        wrapper: ({ children }: { children: ReactNode }) => (
          <CartProvider>{children}</CartProvider>
        ),
      });

      await waitFor(() => {
        expect(result.current.subtotal).toBe(0);
        expect(result.current.total).toBe(0);
        expect(result.current.tax).toBe(0);
        expect(result.current.shippingCost).toBe(0);
        expect(result.current.discount).toBe(0);
      });
    });

    it('should have isLoading false after initialization', async () => {
      const { result } = renderHook(() => useCart(), {
        wrapper: ({ children }: { children: ReactNode }) => (
          <CartProvider>{children}</CartProvider>
        ),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
    });

    it('should have null error after initialization', async () => {
      const { result } = renderHook(() => useCart(), {
        wrapper: ({ children }: { children: ReactNode }) => (
          <CartProvider>{children}</CartProvider>
        ),
      });

      await waitFor(() => {
        expect(result.current.error).toBeNull();
      });
    });
  });

  describe('addItem', () => {
    it('should add item to guest cart', async () => {
      const { result } = renderHook(() => useCart(), {
        wrapper: ({ children }: { children: ReactNode }) => (
          <CartProvider>{children}</CartProvider>
        ),
      });

      await act(async () => {
        await result.current.addItem(mockProduct, 2, null);
      });

      expect(result.current.items).toHaveLength(1);
      expect(result.current.items[0].productId).toBe('prod1');
      expect(result.current.itemCount).toBe(2);
    });

    it('should update quantity when adding existing item', async () => {
      (guestCartUtils.loadGuestCartFromStorage as jest.Mock).mockReturnValue({
        sessionId: 'test_session_123',
        items: [{
          productId: 'prod1',
          quantity: 1,
          variantId: null,
          price: 99.99,
          addedAt: new Date().toISOString()
        }],
        shippingMethod: 'standard',
        discountCode: null,
        expiresAt: new Date(Date.now() + 86400000).toISOString(),
        createdAt: new Date(),
        updatedAt: new Date(),
        version: '1'
      });

      const { result } = renderHook(() => useCart(), {
        wrapper: ({ children }: { children: ReactNode }) => (
          <CartProvider>{children}</CartProvider>
        ),
      });

      await act(async () => {
        await result.current.addItem(mockProduct, 3, null, undefined);
      });

      expect(result.current.items).toHaveLength(1);
      expect(result.current.itemCount).toBe(3);
    });

    it('should handle different variants separately', async () => {
      (guestCartUtils.loadGuestCartFromStorage as jest.Mock).mockReturnValue({
        sessionId: 'test_session_123',
        items: [{
          productId: 'prod1',
          quantity: 1,
          variantId: 'var1',
          price: 99.99,
          addedAt: new Date().toISOString()
        }],
        shippingMethod: 'standard',
        discountCode: null,
        expiresAt: new Date(Date.now() + 86400000).toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        version: '1'
      });

      const { result } = renderHook(() => useCart(), {
        wrapper: ({ children }: { children: ReactNode }) => (
          <CartProvider>{children}</CartProvider>
        ),
      });

      await act(async () => {
        await result.current.addItem(mockProduct, 1, 'var2', undefined);
      });

      expect(result.current.items).toHaveLength(2);
    });

    it('should not add item when stock validation fails', async () => {
      (cartApi.validateGuestCartStock as jest.Mock).mockResolvedValue(false);

      const { result } = renderHook(() => useCart(), {
        wrapper: ({ children }: { children: ReactNode }) => (
          <CartProvider>{children}</CartProvider>
        ),
      });

      await act(async () => {
        await result.current.addItem(mockProduct, 1, null, undefined);
      });

      expect(result.current.items).toHaveLength(0);
    });

    it('should set error when stock validation fails', async () => {
      (cartApi.validateGuestCartStock as jest.Mock).mockResolvedValue(false);

      const { result } = renderHook(() => useCart(), {
        wrapper: ({ children }: { children: ReactNode }) => (
          <CartProvider>{children}</CartProvider>
        ),
      });

      await act(async () => {
        await result.current.addItem(mockProduct, 1, null, undefined);
      });

      expect(result.current.error).toContain('out of stock');
    });

    it('should call saveGuestCartToStorage after adding item', async () => {
      const { result } = renderHook(() => useCart(), {
        wrapper: ({ children }: { children: ReactNode }) => (
          <CartProvider>{children}</CartProvider>
        ),
      });

      await act(async () => {
        await result.current.addItem(mockProduct, 1, null, undefined);
      });

      expect(guestCartUtils.saveGuestCartToStorage).toHaveBeenCalled();
    });

    it('should sync guest cart to backend', async () => {
      const { result } = renderHook(() => useCart(), {
        wrapper: ({ children }: { children: ReactNode }) => (
          <CartProvider>{children}</CartProvider>
        ),
      });

      await act(async () => {
        await result.current.addItem(mockProduct, 1, null, undefined);
      });

      expect(cartApi.createOrUpdateGuestCartBackend).toHaveBeenCalled();
    });

    it('should handle adding multiple items', async () => {
      const product2: Product = {
        ...mockProduct,
        id: 'prod2',
        name: 'Another Product',
      };

      const { result } = renderHook(() => useCart(), {
        wrapper: ({ children }: { children: ReactNode }) => (
          <CartProvider>{children}</CartProvider>
        ),
      });

      await act(async () => {
        await result.current.addItem(mockProduct, 1, null, undefined);
        await result.current.addItem(product2, 2, null, undefined);
      });

      expect(result.current.items).toHaveLength(2);
      expect(result.current.itemCount).toBe(3);
    });

    it('should calculate correct subtotal after adding items', async () => {
      const { result } = renderHook(() => useCart(), {
        wrapper: ({ children }: { children: ReactNode }) => (
          <CartProvider>{children}</CartProvider>
        ),
      });

      await act(async () => {
        await result.current.addItem(mockProduct, 2, null, undefined);
      });

      expect(result.current.subtotal).toBeCloseTo(199.98, 2);
    });
  });

  describe('removeItem', () => {
    it('should remove item from cart', async () => {
      // First add an item
      (guestCartUtils.loadGuestCartFromStorage as jest.Mock).mockReturnValue({
        sessionId: 'test_session_123',
        items: [{
          id: 'item1',
          productId: 'prod1',
          quantity: 2,
          variantId: null,
          price: 99.99,
          addedAt: new Date().toISOString()
        }],
        shippingMethod: 'standard',
        discountCode: null,
        expiresAt: new Date(Date.now() + 86400000),
        createdAt: new Date(),
        updatedAt: new Date(),
        version: '1'
      });

      const { result } = renderHook(() => useCart(), {
        wrapper: ({ children }: { children: ReactNode }) => (
          <CartProvider>{children}</CartProvider>
        ),
      });

      await waitFor(() => {
        expect(result.current.items).toHaveLength(1);
      });

      await act(async () => {
        await result.current.removeItem('item1');
      });

      expect(result.current.items).toHaveLength(0);
      expect(result.current.itemCount).toBe(0);
    });

    it('should update item count correctly after removal', async () => {
      (guestCartUtils.loadGuestCartFromStorage as jest.Mock).mockReturnValue({
        sessionId: 'test_session_123',
        items: [
          {
            id: 'item1',
            productId: 'prod1',
            quantity: 2,
            variantId: null,
            price: 99.99,
            addedAt: new Date().toISOString()
          },
          {
            id: 'item2',
            productId: 'prod2',
            quantity: 3,
            variantId: null,
            price: 49.99,
            addedAt: new Date().toISOString()
          }
        ],
        shippingMethod: 'standard',
        discountCode: null,
        expiresAt: new Date(Date.now() + 86400000),
        createdAt: new Date(),
        updatedAt: new Date(),
        version: '1'
      });

      const { result } = renderHook(() => useCart(), {
        wrapper: ({ children }: { children: ReactNode }) => (
          <CartProvider>{children}</CartProvider>
        ),
      });

      await waitFor(() => {
        expect(result.current.itemCount).toBe(5);
      });

      await act(async () => {
        await result.current.removeItem('item1');
      });

      expect(result.current.itemCount).toBe(3);
    });

    it('should call removeItemFromGuestCart utility', async () => {
      (guestCartUtils.loadGuestCartFromStorage as jest.Mock).mockReturnValue({
        sessionId: 'test_session_123',
        items: [{
          id: 'item1',
          productId: 'prod1',
          quantity: 1,
          variantId: null,
          price: 99.99,
          addedAt: new Date().toISOString()
        }],
        shippingMethod: 'standard',
        discountCode: null,
        expiresAt: new Date(Date.now() + 86400000).toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        version: '1'
      });

      const { result } = renderHook(() => useCart(), {
        wrapper: ({ children }: { children: ReactNode }) => (
          <CartProvider>{children}</CartProvider>
        ),
      });

      await waitFor(() => {
        expect(result.current.items).toHaveLength(1);
      });

      await act(async () => {
        await result.current.removeItem('item1');
      });

      expect(guestCartUtils.removeItemFromGuestCart).toHaveBeenCalled();
    });

    it('should save to storage after removal', async () => {
      (guestCartUtils.loadGuestCartFromStorage as jest.Mock).mockReturnValue({
        sessionId: 'test_session_123',
        items: [{
          id: 'item1',
          productId: 'prod1',
          quantity: 1,
          variantId: null,
          price: 99.99,
          addedAt: new Date().toISOString()
        }],
        shippingMethod: 'standard',
        discountCode: null,
        expiresAt: new Date(Date.now() + 86400000).toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        version: '1'
      });

      const { result } = renderHook(() => useCart(), {
        wrapper: ({ children }: { children: ReactNode }) => (
          <CartProvider>{children}</CartProvider>
        ),
      });

      await waitFor(() => {
        expect(result.current.items).toHaveLength(1);
      });

      await act(async () => {
        await result.current.removeItem('item1');
      });

      expect(guestCartUtils.saveGuestCartToStorage).toHaveBeenCalled();
    });
  });

  describe('updateQuantity', () => {
    it('should update quantity for existing item', async () => {
      (guestCartUtils.loadGuestCartFromStorage as jest.Mock).mockReturnValue({
        sessionId: 'test_session_123',
        items: [{
          id: 'item1',
          productId: 'prod1',
          quantity: 1,
          variantId: null,
          price: 99.99,
          addedAt: new Date().toISOString()
        }],
        shippingMethod: 'standard',
        discountCode: null,
        expiresAt: new Date(Date.now() + 86400000).toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        version: '1'
      });

      const { result } = renderHook(() => useCart(), {
        wrapper: ({ children }: { children: ReactNode }) => (
          <CartProvider>{children}</CartProvider>
        ),
      });

      await waitFor(() => {
        expect(result.current.items).toHaveLength(1);
      });

      await act(async () => {
        await result.current.updateQuantity('item1', 5);
      });

      expect(result.current.items[0].quantity).toBe(5);
    });

    it('should update item count when quantity changes', async () => {
      (guestCartUtils.loadGuestCartFromStorage as jest.Mock).mockReturnValue({
        sessionId: 'test_session_123',
        items: [{
          id: 'item1',
          productId: 'prod1',
          quantity: 2,
          variantId: null,
          price: 99.99,
          addedAt: new Date().toISOString()
        }],
        shippingMethod: 'standard',
        discountCode: null,
        expiresAt: new Date(Date.now() + 86400000).toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        version: '1'
      });

      const { result } = renderHook(() => useCart(), {
        wrapper: ({ children }: { children: ReactNode }) => (
          <CartProvider>{children}</CartProvider>
        ),
      });

      await waitFor(() => {
        expect(result.current.itemCount).toBe(2);
      });

      await act(async () => {
        await result.current.updateQuantity('item1', 10);
      });

      expect(result.current.itemCount).toBe(10);
    });

    it('should call updateItemQuantityInGuestCart utility', async () => {
      (guestCartUtils.loadGuestCartFromStorage as jest.Mock).mockReturnValue({
        sessionId: 'test_session_123',
        items: [{
          id: 'item1',
          productId: 'prod1',
          quantity: 1,
          variantId: null,
          price: 99.99,
          addedAt: new Date().toISOString()
        }],
        shippingMethod: 'standard',
        discountCode: null,
        expiresAt: new Date(Date.now() + 86400000).toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        version: '1'
      });

      const { result } = renderHook(() => useCart(), {
        wrapper: ({ children }: { children: ReactNode }) => (
          <CartProvider>{children}</CartProvider>
        ),
      });

      await waitFor(() => {
        expect(result.current.items).toHaveLength(1);
      });

      await act(async () => {
        await result.current.updateQuantity('item1', 5);
      });

      expect(guestCartUtils.updateItemQuantityInGuestCart).toHaveBeenCalled();
    });
  });

  describe('clearCart', () => {
    it('should clear all items from cart', async () => {
      (guestCartUtils.loadGuestCartFromStorage as jest.Mock).mockReturnValue({
        sessionId: 'test_session_123',
        items: [
          { id: 'item1', productId: 'prod1', quantity: 1, variantId: null, price: 99.99, addedAt: new Date().toISOString() },
          { id: 'item2', productId: 'prod2', quantity: 2, variantId: null, price: 49.99, addedAt: new Date().toISOString() }
        ],
        shippingMethod: 'standard',
        discountCode: null,
        expiresAt: new Date(Date.now() + 86400000).toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        version: '1'
      });

      const { result } = renderHook(() => useCart(), {
        wrapper: ({ children }: { children: ReactNode }) => (
          <CartProvider>{children}</CartProvider>
        ),
      });

      await waitFor(() => {
        expect(result.current.items).toHaveLength(2);
      });

      await act(async () => {
        await result.current.clearCart();
      });

      expect(result.current.items).toHaveLength(0);
      expect(result.current.itemCount).toBe(0);
    });

    it('should call clearGuestCartFromStorage utility', async () => {
      const { result } = renderHook(() => useCart(), {
        wrapper: ({ children }: { children: ReactNode }) => (
          <CartProvider>{children}</CartProvider>
        ),
      });

      await act(async () => {
        await result.current.clearCart();
      });

      expect(guestCartUtils.clearGuestCartFromStorage).toHaveBeenCalled();
    });

    it('should reset all totals to zero', async () => {
      (guestCartUtils.loadGuestCartFromStorage as jest.Mock).mockReturnValue({
        sessionId: 'test_session_123',
        items: [{
          id: 'item1',
          productId: 'prod1',
          quantity: 2,
          variantId: null,
          price: 99.99,
          addedAt: new Date().toISOString()
        }],
        shippingMethod: 'standard',
        discountCode: null,
        expiresAt: new Date(Date.now() + 86400000).toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        version: '1'
      });

      const { result } = renderHook(() => useCart(), {
        wrapper: ({ children }: { children: ReactNode }) => (
          <CartProvider>{children}</CartProvider>
        ),
      });

      await waitFor(() => {
        expect(result.current.subtotal).toBeGreaterThan(0);
      });

      await act(async () => {
        await result.current.clearCart();
      });

      expect(result.current.subtotal).toBe(0);
      expect(result.current.total).toBe(0);
      expect(result.current.discount).toBe(0);
    });
  });

  describe('applyDiscount', () => {
    it('should apply discount code for guest user', async () => {
      const { result } = renderHook(() => useCart(), {
        wrapper: ({ children }: { children: ReactNode }) => (
          <CartProvider>{children}</CartProvider>
        ),
      });

      await act(async () => {
        await result.current.applyDiscount('SAVE20');
      });

      expect(result.current.discountCode).toBe('SAVE20');
    });

    it('should store discount code in storage', async () => {
      (guestCartUtils.loadGuestCartFromStorage as jest.Mock).mockReturnValue({
        sessionId: 'test_session_123',
        items: [],
        shippingMethod: 'standard',
        discountCode: null,
        expiresAt: new Date(Date.now() + 86400000).toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        version: '1'
      });

      const { result } = renderHook(() => useCart(), {
        wrapper: ({ children }: { children: ReactNode }) => (
          <CartProvider>{children}</CartProvider>
        ),
      });

      await act(async () => {
        await result.current.applyDiscount('SAVE20');
      });

      expect(guestCartUtils.saveGuestCartToStorage).toHaveBeenCalled();
    });
  });

  describe('removeDiscount', () => {
    it('should remove discount code', async () => {
      (guestCartUtils.loadGuestCartFromStorage as jest.Mock).mockReturnValue({
        sessionId: 'test_session_123',
        items: [],
        shippingMethod: 'standard',
        discountCode: 'SAVE20',
        expiresAt: new Date(Date.now() + 86400000).toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        version: '1'
      });

      const { result } = renderHook(() => useCart(), {
        wrapper: ({ children }: { children: ReactNode }) => (
          <CartProvider>{children}</CartProvider>
        ),
      });

      await waitFor(() => {
        expect(result.current.discountCode).toBe('SAVE20');
      });

      act(() => {
        result.current.removeDiscount();
      });

      expect(result.current.discountCode).toBeNull();
    });
  });

  describe('setShippingMethod', () => {
    it('should update shipping method', async () => {
      const { result } = renderHook(() => useCart(), {
        wrapper: ({ children }: { children: ReactNode }) => (
          <CartProvider>{children}</CartProvider>
        ),
      });

      act(() => {
        result.current.setShippingMethod('express', 100);
      });

      expect(result.current.shippingMethod).toBe('express');
      expect(result.current.shippingCost).toBe(100);
    });

    it('should update total when shipping cost changes', async () => {
      (guestCartUtils.loadGuestCartFromStorage as jest.Mock).mockReturnValue({
        sessionId: 'test_session_123',
        items: [{
          id: 'item1',
          productId: 'prod1',
          quantity: 2,
          variantId: null,
          price: 100,
          addedAt: new Date().toISOString()
        }],
        shippingMethod: 'standard',
        discountCode: null,
        expiresAt: new Date(Date.now() + 86400000).toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        version: '1'
      });

      const { result } = renderHook(() => useCart(), {
        wrapper: ({ children }: { children: ReactNode }) => (
          <CartProvider>{children}</CartProvider>
        ),
      });

      await waitFor(() => {
        expect(result.current.subtotal).toBe(200);
      });

      act(() => {
        result.current.setShippingMethod('overnight', 200);
      });

      // subtotal (200) + shipping (200) - discount (0) = total (400)
      expect(result.current.total).toBe(400);
    });
  });

  describe('Guest Cart Persistence', () => {
    it('should persist cart to localStorage', async () => {
      const { result } = renderHook(() => useCart(), {
        wrapper: ({ children }: { children: ReactNode }) => (
          <CartProvider>{children}</CartProvider>
        ),
      });

      await act(async () => {
        await result.current.addItem(mockProduct, 2, null, undefined);
      });

      expect(guestCartUtils.saveGuestCartToStorage).toHaveBeenCalled();
    });

    it('should load cart from localStorage on init', async () => {
      (guestCartUtils.loadGuestCartFromStorage as jest.Mock).mockReturnValue({
        sessionId: 'test_session_123',
        items: [{
          id: 'existing',
          productId: 'existing',
          quantity: 3,
          variantId: null,
          price: 50,
          addedAt: new Date().toISOString()
        }],
        shippingMethod: 'standard',
        discountCode: null,
        expiresAt: new Date(Date.now() + 86400000).toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        version: '1'
      });

      const { result } = renderHook(() => useCart(), {
        wrapper: ({ children }: { children: ReactNode }) => (
          <CartProvider>{children}</CartProvider>
        ),
      });

      await waitFor(() => {
        expect(result.current.items).toHaveLength(1);
        expect(result.current.items[0].productId).toBe('existing');
      });
    });

    it('should handle empty localStorage gracefully', async () => {
      (guestCartUtils.loadGuestCartFromStorage as jest.Mock).mockReturnValue(null);

      const { result } = renderHook(() => useCart(), {
        wrapper: ({ children }: { children: ReactNode }) => (
          <CartProvider>{children}</CartProvider>
        ),
      });

      await waitFor(() => {
        expect(result.current.items).toEqual([]);
      });
    });

    it('should handle corrupted localStorage data', async () => {
      (guestCartUtils.loadGuestCartFromStorage as jest.Mock).mockReturnValue(null);

      const { result } = renderHook(() => useCart(), {
        wrapper: ({ children }: { children: ReactNode }) => (
          <CartProvider>{children}</CartProvider>
        ),
      });

      await waitFor(() => {
        expect(result.current.items).toEqual([]);
        expect(result.current.error).toBeNull();
      });
    });
  });

  describe('Session Management', () => {
    it('should generate session ID for new guest', async () => {
      (guestCartUtils.getGuestSessionId as jest.Mock).mockReturnValue(null);

      const { result } = renderHook(() => useCart(), {
        wrapper: ({ children }: { children: ReactNode }) => (
          <CartProvider>{children}</CartProvider>
        ),
      });

      await waitFor(() => {
        expect(guestCartUtils.generateGuestSessionId).toHaveBeenCalled();
      });
    });

    it('should use existing session ID', async () => {
      (guestCartUtils.getGuestSessionId as jest.Mock).mockReturnValue('existing_session');

      const { result } = renderHook(() => useCart(), {
        wrapper: ({ children }: { children: ReactNode }) => (
          <CartProvider>{children}</CartProvider>
        ),
      });

      await waitFor(() => {
        expect(result.current.sessionId).toBe('existing_session');
      });
    });

    it('should store session ID in localStorage', async () => {
      const { result } = renderHook(() => useCart(), {
        wrapper: ({ children }: { children: ReactNode }) => (
          <CartProvider>{children}</CartProvider>
        ),
      });

      await waitFor(() => {
        expect(guestCartUtils.setGuestSessionId).toHaveBeenCalled();
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle API errors gracefully', async () => {
      (cartApi.getCart as jest.Mock).mockRejectedValue(new Error('API Error'));

      const { result } = renderHook(() => useCart(), {
        wrapper: ({ children }: { children: ReactNode }) => (
          <CartProvider>{children}</CartProvider>
        ),
      });

      await waitFor(() => {
        expect(result.current.error).not.toBeNull();
      });
    });

    it('should reset error on successful operation', async () => {
      (cartApi.getCart as jest.Mock).mockRejectedValueOnce(new Error('API Error'));
      (cartApi.getCart as jest.Mock).mockResolvedValueOnce(mockCart);

      const { result } = renderHook(() => useCart(), {
        wrapper: ({ children }: { children: ReactNode }) => (
          <CartProvider>{children}</CartProvider>
        ),
      });

      await waitFor(() => {
        expect(result.current.error).not.toBeNull();
      });

      // Re-render should clear error
      await waitFor(() => {
        expect(result.current.error).toBeNull();
      });
    });
  });

  describe('Loading States', () => {
    it('should set isLoading during async operations', async () => {
      let resolveAdd: (value?: any) => void;
      (cartApi.createOrUpdateGuestCartBackend as jest.Mock).mockImplementation(() => 
        new Promise(resolve => { resolveAdd = resolve; })
      );

      const { result } = renderHook(() => useCart(), {
        wrapper: ({ children }: { children: ReactNode }) => (
          <CartProvider>{children}</CartProvider>
        ),
      });

      const addPromise = result.current.addItem(mockProduct, 1, null, undefined);

      // Loading should be true during operation
      expect(result.current.isLoading).toBe(true);

      await addPromise;

      // Loading should be false after operation
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
    });
  });
});
