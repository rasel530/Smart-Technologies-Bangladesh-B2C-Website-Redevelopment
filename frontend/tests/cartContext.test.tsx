/**
 * CartContext Integration Tests
 * 
 * Comprehensive tests for CartContext state management and operations.
 * Tests cover: cart initialization, item operations, user/guest differentiation, and merge behavior.
 */

import React from 'react';
import { render, renderHook, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CartProvider, useCart } from '@/contexts/CartContext';

// Mock dependencies
const mockUseAuth = {
  user: null,
};

jest.mock('@/contexts/AuthContext', () => ({
  useAuth: jest.fn(() => mockUseAuth),
}));

const mockCartApi = {
  getCart: jest.fn(),
  addToCart: jest.fn(),
  removeCartItem: jest.fn(),
  updateCartItemQuantity: jest.fn(),
  clearCart: jest.fn(),
  applyDiscount: jest.fn(),
  removeDiscount: jest.fn(),
  mergeGuestCart: jest.fn(),
  validateCart: jest.fn(),
  getCartSummary: jest.fn(),
  setShippingMethod: jest.fn(),
};

jest.mock('@/lib/api/cart', () => ({
  __esModule: true,
  default: mockCartApi,
}));

const mockGuestCartUtils = {
  loadGuestCartFromStorage: jest.fn(),
  saveGuestCartToStorage: jest.fn(),
  clearGuestCartFromStorage: jest.fn(),
  getGuestSessionId: jest.fn(),
  setGuestSessionId: jest.fn(),
  removeGuestSessionId: jest.fn(),
  generateGuestSessionId: jest.fn(),
  createEmptyGuestCart: jest.fn(),
  addItemToGuestCart: jest.fn(),
  removeItemFromGuestCart: jest.fn(),
  updateItemQuantityInGuestCart: jest.fn(),
  listenForGuestCartUpdates: jest.fn(),
  listenForGuestCartClear: jest.fn(),
};

jest.mock('@/lib/utils/guestCart', () => mockGuestCartUtils);

// Test component to access cart context
const TestCartComponent = () => {
  const cart = useCart();
  return (
    <div>
      <div data-testid="item-count">{cart.itemCount}</div>
      <div data-testid="total">{cart.total}</div>
      <div data-testid="is-loading">{cart.isLoading.toString()}</div>
      <div data-testid="is-guest">{cart.isGuest.toString()}</div>
      <div data-testid="error">{cart.error || 'no-error'}</div>
      <button 
        data-testid="add-item"
        onClick={() => cart.addItem({ 
          id: 'product-1', 
          name: 'Test Product', 
          slug: 'test-product',
          images: [],
          sku: 'TEST-001',
          regularPrice: 99.99,
          stockQuantity: 100,
          status: 'active'
        } as any, 1, null)}
      >
        Add Item
      </button>
      <button 
        data-testid="clear-cart"
        onClick={() => cart.clearCart()}
      >
        Clear Cart
      </button>
    </div>
  );
};

describe('CartContext Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Default mock implementations
    mockCartApi.getCart.mockResolvedValue({
      id: 'cart-1',
      items: [],
      subtotal: 0,
      tax: 0,
      shippingCost: 0,
      discount: 0,
      total: 0,
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    
    mockCartApi.addToCart.mockResolvedValue({
      id: 'cart-1',
      items: [{
        id: 'item-1',
        cartId: 'cart-1',
        productId: 'product-1',
        quantity: 1,
        price: 99.99,
        subtotal: 99.99,
        addedAt: new Date(),
        status: 'active',
        variantId: null,
      }],
      subtotal: 99.99,
      tax: 0,
      shippingCost: 0,
      discount: 0,
      total: 99.99,
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    
    mockGuestCartUtils.loadGuestCartFromStorage.mockReturnValue(null);
    mockGuestCartUtils.saveGuestCartToStorage.mockImplementation(() => {});
    mockGuestCartUtils.clearGuestCartFromStorage.mockImplementation(() => {});
    mockGuestCartUtils.generateGuestSessionId.mockReturnValue('guest-session-123');
    mockGuestCartUtils.setGuestSessionId.mockImplementation(() => {});
    mockGuestCartUtils.removeGuestSessionId.mockImplementation(() => {});
    mockGuestCartUtils.createEmptyGuestCart.mockImplementation((sessionId: string) => ({
      sessionId,
      items: [],
      shippingMethod: 'standard',
      discountCode: null,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      version: '1',
    }));
    mockGuestCartUtils.addItemToGuestCart.mockImplementation((cart: any, productId: string, qty: number, variantId: string | null, price: number) => ({
      ...cart,
      items: [...(cart.items || []), { productId, quantity: qty, variantId, price, addedAt: new Date().toISOString() }],
    }));
    mockGuestCartUtils.listenForGuestCartUpdates.mockReturnValue(() => {});
    mockGuestCartUtils.listenForGuestCartClear.mockReturnValue(() => {});
  });

  describe('Cart Initialization', () => {
    it('should initialize cart for guest user', async () => {
      mockUseAuth.user = null;
      
      const { result } = renderHook(() => useCart(), {
        wrapper: ({ children }) => <CartProvider>{children}</CartProvider>,
      });
      
      await waitFor(() => {
        expect(result.current.isGuest).toBe(true);
      });
    });

    it('should load cart from storage for returning guest', async () => {
      mockUseAuth.user = null;
      mockGuestCartUtils.loadGuestCartFromStorage.mockReturnValue({
        sessionId: 'existing-session',
        items: [{
          productId: 'product-1',
          quantity: 2,
          variantId: null,
          price: 99.99,
          addedAt: new Date().toISOString(),
        }],
        shippingMethod: 'standard',
        discountCode: null,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        version: '1',
      });
      
      const { result } = renderHook(() => useCart(), {
        wrapper: ({ children }) => <CartProvider>{children}</CartProvider>,
      });
      
      await waitFor(() => {
        expect(result.current.sessionId).toBe('existing-session');
      });
    });

    it('should fetch cart from API for authenticated user', async () => {
      mockUseAuth.user = { id: 'user-1', email: 'test@example.com' };
      mockCartApi.getCart.mockResolvedValue({
        id: 'user-cart-1',
        userId: 'user-1',
        items: [{
          id: 'item-1',
          cartId: 'user-cart-1',
          productId: 'product-1',
          quantity: 1,
          price: 99.99,
          subtotal: 99.99,
          addedAt: new Date(),
          status: 'active',
          variantId: null,
        }],
        subtotal: 99.99,
        tax: 0,
        shippingCost: 0,
        discount: 0,
        total: 99.99,
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      
      const { result } = renderHook(() => useCart(), {
        wrapper: ({ children }) => <CartProvider>{children}</CartProvider>,
      });
      
      await waitFor(() => {
        expect(result.current.isGuest).toBe(false);
        expect(mockCartApi.getCart).toHaveBeenCalled();
      });
    });
  });

  describe('Add Item Operations', () => {
    it('should add item to cart for guest user (localStorage)', async () => {
      mockUseAuth.user = null;
      
      render(
        <CartProvider>
          <TestCartComponent />
        </CartProvider>
      );
      
      await act(async () => {
        userEvent.click(screen.getByTestId('add-item'));
        await new Promise(resolve => setTimeout(resolve, 100));
      });
      
      expect(mockGuestCartUtils.addItemToGuestCart).toHaveBeenCalled();
      expect(mockGuestCartUtils.saveGuestCartToStorage).toHaveBeenCalled();
    });

    it('should add item to cart for authenticated user (API)', async () => {
      mockUseAuth.user = { id: 'user-1' };
      
      render(
        <CartProvider>
          <TestCartComponent />
        </CartProvider>
      );
      
      await act(async () => {
        userEvent.click(screen.getByTestId('add-item'));
        await new Promise(resolve => setTimeout(resolve, 100));
      });
      
      expect(mockCartApi.addToCart).toHaveBeenCalled();
      expect(mockCartApi.getCart).toHaveBeenCalled();
    });

    it('should include variantId in add to cart request', async () => {
      mockUseAuth.user = { id: 'user-1' };
      const variantId = 'variant-123';
      
      const TestComponentWithVariant = () => {
        const cart = useCart();
        return (
          <button 
            data-testid="add-with-variant"
            onClick={() => cart.addItem({ 
              id: 'product-1', 
              name: 'Test Product', 
              slug: 'test-product',
              images: [],
              sku: 'TEST-001',
              regularPrice: 99.99,
              stockQuantity: 100,
              status: 'active'
            } as any, 1, variantId)}
          >
            Add with Variant
          </button>
        );
      };
      
      render(
        <CartProvider>
          <TestComponentWithVariant />
        </CartProvider>
      );
      
      await act(async () => {
        userEvent.click(screen.getByTestId('add-with-variant'));
        await new Promise(resolve => setTimeout(resolve, 100));
      });
      
      expect(mockCartApi.addToCart).toHaveBeenCalledWith(
        expect.any(String), // cartId
        'product-1', // productId
        1, // quantity
        variantId // variantId
      );
    });
  });

  describe('Clear Cart', () => {
    it('should clear cart for guest user', async () => {
      mockUseAuth.user = null;
      
      render(
        <CartProvider>
          <TestCartComponent />
        </CartProvider>
      );
      
      await act(async () => {
        userEvent.click(screen.getByTestId('clear-cart'));
        await new Promise(resolve => setTimeout(resolve, 100));
      });
      
      expect(mockGuestCartUtils.clearGuestCartFromStorage).toHaveBeenCalled();
    });

    it('should clear cart for authenticated user (API)', async () => {
      mockUseAuth.user = { id: 'user-1' };
      mockCartApi.clearCart.mockResolvedValue({
        id: 'cart-1',
        items: [],
        subtotal: 0,
        tax: 0,
        shippingCost: 0,
        discount: 0,
        total: 0,
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      
      render(
        <CartProvider>
          <TestCartComponent />
        </CartProvider>
      );
      
      await act(async () => {
        userEvent.click(screen.getByTestId('clear-cart'));
        await new Promise(resolve => setTimeout(resolve, 100));
      });
      
      expect(mockCartApi.clearCart).toHaveBeenCalled();
    });
  });

  describe('Cart Merge on Login', () => {
    it('should merge guest cart when user logs in', async () => {
      // Initial guest cart
      const guestCart = {
        sessionId: 'guest-session',
        items: [{
          productId: 'product-1',
          quantity: 2,
          variantId: null,
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
      mockGuestCartUtils.loadGuestCartFromStorage.mockReturnValue(guestCart);
      mockCartApi.mergeGuestCart.mockResolvedValue({
        id: 'user-cart-1',
        items: [{
          id: 'merged-item-1',
          cartId: 'user-cart-1',
          productId: 'product-1',
          quantity: 2,
          price: 99.99,
          subtotal: 199.98,
          addedAt: new Date(),
          status: 'active',
          variantId: null,
        }],
        subtotal: 199.98,
        tax: 0,
        shippingCost: 0,
        discount: 0,
        total: 199.98,
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      
      // First render as guest
      const { result, rerender } = renderHook(() => useCart(), {
        wrapper: ({ children }) => <CartProvider>{children}</CartProvider>,
      });
      
      await waitFor(() => {
        expect(result.current.isGuest).toBe(true);
        expect(result.current.sessionId).toBe('guest-session');
      });
      
      // Simulate login - user becomes authenticated
      mockUseAuth.user = { id: 'user-1', email: 'test@example.com' };
      
      // Re-render to trigger login effect
      rerender({});
      
      await waitFor(() => {
        expect(mockCartApi.mergeGuestCart).toHaveBeenCalledWith('guest-session', expect.any(Array));
      });
      
      expect(mockGuestCartUtils.clearGuestCartFromStorage).toHaveBeenCalled();
      expect(mockGuestCartUtils.removeGuestSessionId).toHaveBeenCalled();
    });

    it('should handle merge errors gracefully', async () => {
      const guestCart = {
        sessionId: 'guest-session',
        items: [{
          productId: 'product-1',
          quantity: 2,
          variantId: null,
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
      mockGuestCartUtils.loadGuestCartFromStorage.mockReturnValue(guestCart);
      mockCartApi.mergeGuestCart.mockRejectedValue(new Error('Merge failed'));
      
      const { result, rerender } = renderHook(() => useCart(), {
        wrapper: ({ children }) => <CartProvider>{children}</CartProvider>,
      });
      
      // Simulate login
      mockUseAuth.user = { id: 'user-1' };
      rerender({});
      
      await waitFor(() => {
        expect(result.current.error).toBe('Merge failed');
      });
    });
  });

  describe('Loading State', () => {
    it('should show loading state during cart operations', async () => {
      mockUseAuth.user = { id: 'user-1' };
      
      // Make addToCart slow
      mockCartApi.addToCart.mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve({
          id: 'cart-1',
          items: [],
          subtotal: 0,
          tax: 0,
          shippingCost: 0,
          discount: 0,
          total: 0,
          status: 'active',
          createdAt: new Date(),
          updatedAt: new Date(),
        }), 500))
      );
      
      render(
        <CartProvider>
          <TestCartComponent />
        </CartProvider>
      );
      
      // Click add button
      await act(async () => {
        userEvent.click(screen.getByTestId('add-item'));
      });
      
      // Loading state should be true during operation
      expect(screen.getByTestId('is-loading')).toHaveTextContent('true');
    });
  });

  describe('Error Handling', () => {
    it('should handle API errors gracefully', async () => {
      mockUseAuth.user = { id: 'user-1' };
      mockCartApi.getCart.mockRejectedValue(new Error('Network error'));
      
      const { result } = renderHook(() => useCart(), {
        wrapper: ({ children }) => <CartProvider>{children}</CartProvider>,
      });
      
      await waitFor(() => {
        expect(result.current.error).toBe('Network error');
      });
    });
  });

  describe('Cart ID Handling', () => {
    it('should fetch cartId when not available for authenticated user', async () => {
      mockUseAuth.user = { id: 'user-1' };
      
      // First getCart returns cart with ID, then addToCart is called
      mockCartApi.getCart
        .mockResolvedValueOnce({
          id: 'new-cart-id',
          items: [],
          subtotal: 0,
          tax: 0,
          shippingCost: 0,
          discount: 0,
          total: 0,
          status: 'active',
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .mockResolvedValueOnce({
          id: 'new-cart-id',
          items: [{
            id: 'item-1',
            cartId: 'new-cart-id',
            productId: 'product-1',
            quantity: 1,
            price: 99.99,
            subtotal: 99.99,
            addedAt: new Date(),
            status: 'active',
            variantId: null,
          }],
          subtotal: 99.99,
          tax: 0,
          shippingCost: 0,
          discount: 0,
          total: 99.99,
          status: 'active',
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      
      render(
        <CartProvider>
          <TestCartComponent />
        </CartProvider>
      );
      
      await act(async () => {
        userEvent.click(screen.getByTestId('add-item'));
        await new Promise(resolve => setTimeout(resolve, 100));
      });
      
      // First getCart should be called to get cartId
      expect(mockCartApi.getCart).toHaveBeenCalled();
      
      // addToCart should use the fetched cartId
      expect(mockCartApi.addToCart).toHaveBeenCalledWith(
        'new-cart-id', // This is the fetched cartId
        'product-1',
        1,
        null
      );
    });
  });
});
