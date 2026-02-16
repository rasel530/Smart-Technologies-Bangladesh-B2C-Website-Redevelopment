/**
 * Cart API Unit Tests
 * 
 * Tests for cart API client functions.
 * Verifies correct API calls, request payloads, and error handling.
 */

import cartApi, { getCart, addToCart, mergeGuestCart, clearCart } from '@/lib/api/cart';
import { apiClient } from '@/lib/api/client';

// Mock the API client
jest.mock('@/lib/api/client', () => ({
  apiClient: {
    get: jest.fn(),
    post: jest.fn(),
    patch: jest.fn(),
    delete: jest.fn(),
  },
}));

describe('Cart API Tests', () => {
  let mockApiClient: jest.Mocked<typeof apiClient>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockApiClient = apiClient as jest.Mocked<typeof apiClient>;
  });

  describe('getCart', () => {
    it('should fetch cart from /cart endpoint', async () => {
      const mockCart = {
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
      };
      
      mockApiClient.get.mockResolvedValue(mockCart);

      const result = await getCart();

      expect(mockApiClient.get).toHaveBeenCalledWith('/cart');
      expect(result).toEqual(mockCart);
    });

    it('should throw error on API failure', async () => {
      mockApiClient.get.mockRejectedValue(new Error('Network error'));

      await expect(getCart()).rejects.toThrow('Network error');
    });
  });

  describe('addToCart', () => {
    it('should add item to cart with correct request payload', async () => {
      const mockCart = {
        id: 'cart-1',
        items: [{
          id: 'item-1',
          cartId: 'cart-1',
          productId: 'product-1',
          quantity: 2,
          price: 99.99,
          subtotal: 199.98,
          addedAt: new Date(),
          status: 'active',
          variantId: 'variant-1',
        }],
        subtotal: 199.98,
        tax: 0,
        shippingCost: 0,
        discount: 0,
        total: 199.98,
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      mockApiClient.post.mockResolvedValue(mockCart);

      const result = await addToCart('cart-1', 'product-1', 2, 'variant-1');

      expect(mockApiClient.post).toHaveBeenCalledWith('/cart/items', {
        cartId: 'cart-1',
        productId: 'product-1',
        quantity: 2,
        variantId: 'variant-1',
      });
      expect(result).toEqual(mockCart);
    });

    it('should include null variantId when not provided', async () => {
      const mockCart = {
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
      };
      
      mockApiClient.post.mockResolvedValue(mockCart);

      await addToCart('cart-1', 'product-1', 1, null);

      expect(mockApiClient.post).toHaveBeenCalledWith('/cart/items', {
        cartId: 'cart-1',
        productId: 'product-1',
        quantity: 1,
        variantId: null,
      });
    });

    it('should handle undefined variantId correctly', async () => {
      const mockCart = {
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
      };
      
      mockApiClient.post.mockResolvedValue(mockCart);

      await addToCart('cart-1', 'product-1', 1, undefined);

      expect(mockApiClient.post).toHaveBeenCalledWith('/cart/items', {
        cartId: 'cart-1',
        productId: 'product-1',
        quantity: 1,
        variantId: null,
      });
    });

    it('should throw error on add failure', async () => {
      mockApiClient.post.mockRejectedValue(new Error('Add failed'));

      await expect(addToCart('cart-1', 'product-1', 1, null))
        .rejects.toThrow('Add failed');
    });
  });

  describe('mergeGuestCart', () => {
    it('should merge guest cart with correct request format', async () => {
      const mockCart = {
        id: 'user-cart-1',
        items: [],
        subtotal: 0,
        tax: 0,
        shippingCost: 0,
        discount: 0,
        total: 0,
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      mockApiClient.post.mockResolvedValue(mockCart);

      const guestItems = [
        { productId: 'product-1', quantity: 2, variantId: null, price: 99.99, addedAt: '2024-01-01T00:00:00Z' },
      ];

      const result = await mergeGuestCart('guest-session-123', guestItems);

      expect(mockApiClient.post).toHaveBeenCalledWith('/cart/merge', {
        guestSessionId: 'guest-session-123',
        items: guestItems,
      });
      expect(result).toEqual(mockCart);
    });

    it('should use empty array when items not provided', async () => {
      const mockCart = {
        id: 'user-cart-1',
        items: [],
        subtotal: 0,
        tax: 0,
        shippingCost: 0,
        discount: 0,
        total: 0,
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      mockApiClient.post.mockResolvedValue(mockCart);

      await mergeGuestCart('guest-session-123');

      expect(mockApiClient.post).toHaveBeenCalledWith('/cart/merge', {
        guestSessionId: 'guest-session-123',
        items: [],
      });
    });

    it('should throw error on merge failure', async () => {
      mockApiClient.post.mockRejectedValue(new Error('Merge failed'));

      await expect(mergeGuestCart('guest-session-123'))
        .rejects.toThrow('Merge failed');
    });
  });

  describe('clearCart', () => {
    it('should clear cart via DELETE /cart', async () => {
      const mockCart = {
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
      };
      
      mockApiClient.delete.mockResolvedValue(mockCart);

      const result = await clearCart();

      expect(mockApiClient.delete).toHaveBeenCalledWith('/cart');
      expect(result).toEqual(mockCart);
    });

    it('should throw error on clear failure', async () => {
      mockApiClient.delete.mockRejectedValue(new Error('Clear failed'));

      await expect(clearCart()).rejects.toThrow('Clear failed');
    });
  });

  describe('updateCartItemQuantity', () => {
    it('should update item quantity with PATCH /items/:id/quantity', async () => {
      const mockCart = {
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
      };
      
      mockApiClient.patch.mockResolvedValue(mockCart);

      await cartApi.updateCartItemQuantity('item-1', 5);

      expect(mockApiClient.patch).toHaveBeenCalledWith('/cart/items/item-1/quantity', {
        quantity: 5,
      });
    });
  });

  describe('removeCartItem', () => {
    it('should remove item with DELETE /items/:id', async () => {
      const mockCart = {
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
      };
      
      mockApiClient.delete.mockResolvedValue(mockCart);

      await cartApi.removeCartItem('item-1');

      expect(mockApiClient.delete).toHaveBeenCalledWith('/cart/items/item-1');
    });
  });

  describe('applyDiscount', () => {
    it('should apply discount with POST /discount', async () => {
      const mockCart = {
        id: 'cart-1',
        items: [],
        subtotal: 100,
        tax: 0,
        shippingCost: 0,
        discount: 10,
        total: 90,
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      mockApiClient.post.mockResolvedValue(mockCart);

      await cartApi.applyDiscount('SAVE10');

      expect(mockApiClient.post).toHaveBeenCalledWith('/cart/discount', {
        code: 'SAVE10',
      });
    });
  });

  describe('setShippingMethod', () => {
    it('should set shipping method with POST /shipping', async () => {
      const mockCart = {
        id: 'cart-1',
        items: [],
        subtotal: 100,
        tax: 0,
        shippingCost: 15,
        discount: 0,
        total: 115,
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      mockApiClient.post.mockResolvedValue(mockCart);

      await cartApi.setShippingMethod('express');

      expect(mockApiClient.post).toHaveBeenCalledWith('/cart/shipping', {
        method: 'express',
      });
    });
  });

  describe('validateCart', () => {
    it('should validate cart and return validation results', async () => {
      const mockValidation = {
        isValid: true,
        invalidItems: [],
        updatedPrices: [],
      };
      
      mockApiClient.get.mockResolvedValue(mockValidation);

      const result = await cartApi.validateCart();

      expect(mockApiClient.get).toHaveBeenCalledWith('/cart/validate');
      expect(result).toEqual(mockValidation);
    });
  });

  describe('getCartSummary', () => {
    it('should fetch cart summary', async () => {
      const mockSummary = {
        itemCount: 5,
        subtotal: 500,
        tax: 50,
        shippingCost: 25,
        discount: 0,
        total: 575,
      };
      
      mockApiClient.get.mockResolvedValue(mockSummary);

      const result = await cartApi.getCartSummary();

      expect(mockApiClient.get).toHaveBeenCalledWith('/cart/summary');
      expect(result).toEqual(mockSummary);
    });
  });

  describe('API Error Handling', () => {
    it('should handle 400 Bad Request errors', async () => {
      const error = new Error('Bad Request') as any;
      error.response = { status: 400 };
      mockApiClient.post.mockRejectedValue(error);

      await expect(addToCart('cart-1', 'product-1', 1, null))
        .rejects.toThrow();
    });

    it('should handle 404 Not Found errors', async () => {
      const error = new Error('Not Found') as any;
      error.response = { status: 404 };
      mockApiClient.get.mockRejectedValue(error);

      await expect(getCart()).rejects.toThrow();
    });

    it('should handle 500 Server errors', async () => {
      const error = new Error('Internal Server Error') as any;
      error.response = { status: 500 };
      mockApiClient.get.mockRejectedValue(error);

      await expect(getCart()).rejects.toThrow();
    });
  });
});
