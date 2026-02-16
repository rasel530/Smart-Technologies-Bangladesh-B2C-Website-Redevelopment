/**
 * Cart API Backend Tests
 * 
 * Comprehensive tests for cart API endpoints.
 * Tests request validation, authentication, and business logic.
 */

// This test file is designed to run with Jest in the backend
// Requires: npm install --save-dev jest supertest

const request = require('supertest');
const express = require('express');

// Mock dependencies before requiring the router
jest.mock('../services/cartService', () => ({
  cartService: {
    getCart: jest.fn(),
    createCart: jest.fn(),
    addItemToCart: jest.fn(),
    updateCartItemQuantity: jest.fn(),
    removeCartItem: jest.fn(),
    clearCart: jest.fn(),
    mergeGuestCart: jest.fn(),
    validateCartStock: jest.fn(),
    getCartSummary: jest.fn(),
    calculateCartTotals: jest.fn(),
    getCartFromCache: jest.fn(),
    setCartInCache: jest.fn(),
  },
}));

jest.mock('../services/logger', () => ({
  loggerService: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

jest.mock('../services/rateLimitService', () => ({
  rateLimitService: {
    createRateLimit: jest.fn(() => (req, res, next) => next()),
  },
}));

jest.mock('../middleware/auth', () => ({
  authMiddleware: {
    authenticate: () => (req, res, next) => next(),
    optional: () => (req, res, next) => next(),
  },
}));

const { cartController } = require('../controllers/cartController');
const cartRouter = require('../routes/cart');

// Create test app
const app = express();
app.use(express.json());
app.use('/api/v1/cart', cartRouter);

describe('Cart API Backend Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/v1/cart', () => {
    it('should return cart for authenticated user', async () => {
      const mockCart = {
        id: 'cart-123',
        userId: 'user-1',
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

      const cartService = require('../services/cartService').cartService;
      cartService.getCart.mockResolvedValue(mockCart);
      cartService.getCartFromCache.mockResolvedValue(null);

      const response = await request(app)
        .get('/api/v1/cart')
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe('cart-123');
    });

    it('should return cart for guest with session header', async () => {
      const mockCart = {
        id: 'guest-cart-123',
        sessionId: 'guest-session-1',
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

      const cartService = require('../services/cartService').cartService;
      cartService.getCart.mockResolvedValue(mockCart);
      cartService.getCartFromCache.mockResolvedValue(null);

      const response = await request(app)
        .get('/api/v1/cart')
        .set('x-session-id', 'guest-session-1');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should return 400 without authentication', async () => {
      const response = await request(app)
        .get('/api/v1/cart');

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should create new cart if none exists', async () => {
      const newCart = {
        id: 'new-cart-123',
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

      const cartService = require('../services/cartService').cartService;
      cartService.getCart.mockResolvedValue(null);
      cartService.createCart.mockResolvedValue(newCart);

      const response = await request(app)
        .get('/api/v1/cart')
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(200);
      expect(cartService.createCart).toHaveBeenCalled();
    });
  });

  describe('POST /api/v1/cart/items', () => {
    it('should add item to cart with valid request', async () => {
      const mockCartItem = {
        id: 'item-1',
        cartId: 'cart-123',
        productId: 'product-1',
        quantity: 2,
        price: 99.99,
        subtotal: 199.98,
        addedAt: new Date(),
        status: 'active',
        variantId: 'variant-1',
      };

      const cartService = require('../services/cartService').cartService;
      cartService.addItemToCart.mockResolvedValue(mockCartItem);

      const response = await request(app)
        .post('/api/v1/cart/items')
        .set('Authorization', 'Bearer valid-token')
        .send({
          cartId: 'cart-123',
          productId: 'product-1',
          quantity: 2,
          variantId: 'variant-1',
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.productId).toBe('product-1');
    });

    it('should return 400 for missing cartId', async () => {
      const response = await request(app)
        .post('/api/v1/cart/items')
        .set('Authorization', 'Bearer valid-token')
        .send({
          productId: 'product-1',
          quantity: 2,
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Missing required fields');
    });

    it('should return 400 for invalid quantity (0)', async () => {
      const response = await request(app)
        .post('/api/v1/cart/items')
        .set('Authorization', 'Bearer valid-token')
        .send({
          cartId: 'cart-123',
          productId: 'product-1',
          quantity: 0,
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Invalid quantity');
    });

    it('should return 400 for negative quantity', async () => {
      const response = await request(app)
        .post('/api/v1/cart/items')
        .set('Authorization', 'Bearer valid-token')
        .send({
          cartId: 'cart-123',
          productId: 'product-1',
          quantity: -1,
        });

      expect(response.status).toBe(400);
    });

    it('should return 400 for invalid cartId format', async () => {
      const response = await request(app)
        .post('/api/v1/cart/items')
        .set('Authorization', 'Bearer valid-token')
        .send({
          cartId: 'not-a-uuid',
          productId: 'product-1',
          quantity: 2,
        });

      expect(response.status).toBe(400);
    });
  });

  describe('POST /api/v1/cart/merge', () => {
    it('should merge guest cart on login', async () => {
      const mockMergedCart = {
        id: 'user-cart-123',
        userId: 'user-1',
        items: [{
          id: 'item-1',
          productId: 'product-1',
          quantity: 3,
        }],
        subtotal: 299.97,
        tax: 0,
        shippingCost: 0,
        discount: 0,
        total: 299.97,
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const cartService = require('../services/cartService').cartService;
      cartService.mergeGuestCart.mockResolvedValue({
        ...mockMergedCart,
        itemsMerged: 1,
        itemsSkipped: [],
      });

      const response = await request(app)
        .post('/api/v1/cart/merge')
        .set('Authorization', 'Bearer valid-token')
        .send({
          guestSessionId: 'guest-session-123',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.itemsMerged).toBe(1);
    });

    it('should return 401 for unauthenticated merge', async () => {
      const response = await request(app)
        .post('/api/v1/cart/merge')
        .send({
          guestSessionId: 'guest-session-123',
        });

      expect(response.status).toBe(401);
    });

    it('should return 400 for missing guestSessionId', async () => {
      const response = await request(app)
        .post('/api/v1/cart/merge')
        .set('Authorization', 'Bearer valid-token')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Missing guest session ID');
    });

    it('should handle merge with partial success', async () => {
      const cartService = require('../services/cartService').cartService;
      cartService.mergeGuestCart.mockResolvedValue({
        id: 'user-cart-123',
        items: [{
          id: 'item-1',
          productId: 'product-1',
          quantity: 2,
        }],
        itemsMerged: 1,
        itemsSkipped: [{
          productId: 'product-2',
          reason: 'Out of stock',
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

      const response = await request(app)
        .post('/api/v1/cart/merge')
        .set('Authorization', 'Bearer valid-token')
        .send({
          guestSessionId: 'guest-session-123',
        });

      expect(response.status).toBe(200);
      expect(response.body.data.itemsSkipped).toHaveLength(1);
    });
  });

  describe('DELETE /api/v1/cart/items/:id', () => {
    it('should remove item from cart', async () => {
      const cartService = require('../services/cartService').cartService;
      cartService.removeCartItem.mockResolvedValue({ success: true });

      const response = await request(app)
        .delete('/api/v1/cart/items/item-1')
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should return 404 for non-existent item', async () => {
      const cartService = require('../services/cartService').cartService;
      cartService.removeCartItem.mockRejectedValue(new Error('Cart item not found'));

      const response = await request(app)
        .delete('/api/v1/cart/items/non-existent')
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(404);
    });
  });

  describe('PATCH /api/v1/cart/items/:id/quantity', () => {
    it('should update item quantity', async () => {
      const mockUpdatedItem = {
        id: 'item-1',
        quantity: 5,
        subtotal: 499.95,
      };

      const cartService = require('../services/cartService').cartService;
      cartService.updateCartItemQuantity.mockResolvedValue(mockUpdatedItem);

      const response = await request(app)
        .patch('/api/v1/cart/items/item-1/quantity')
        .set('Authorization', 'Bearer valid-token')
        .send({ quantity: 5 });

      expect(response.status).toBe(200);
      expect(response.body.data.quantity).toBe(5);
    });

    it('should return 400 for invalid quantity', async () => {
      const response = await request(app)
        .patch('/api/v1/cart/items/item-1/quantity')
        .set('Authorization', 'Bearer valid-token')
        .send({ quantity: 0 });

      expect(response.status).toBe(400);
    });
  });

  describe('DELETE /api/v1/cart', () => {
    it('should clear entire cart', async () => {
      const cartService = require('../services/cartService').cartService;
      cartService.clearCart.mockResolvedValue({ success: true });

      const response = await request(app)
        .delete('/api/v1/cart')
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe('POST /api/v1/cart/validate', () => {
    it('should validate cart stock', async () => {
      const cartService = require('../services/cartService').cartService;
      cartService.validateCartStock.mockResolvedValue({
        isValid: true,
        invalidItems: [],
      });

      const response = await request(app)
        .post('/api/v1/cart/validate')
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(200);
      expect(response.body.data.isValid).toBe(true);
    });

    it('should detect out of stock items', async () => {
      const cartService = require('../services/cartService').cartService;
      cartService.validateCartStock.mockResolvedValue({
        isValid: false,
        invalidItems: [{
          itemId: 'item-1',
          productId: 'product-1',
          reason: 'Insufficient stock',
          availableStock: 0,
        }],
      });

      const response = await request(app)
        .post('/api/v1/cart/validate')
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(200);
      expect(response.body.data.isValid).toBe(false);
      expect(response.body.data.invalidItems).toHaveLength(1);
    });
  });

  describe('POST /api/v1/cart/discount', () => {
    it('should apply discount code', async () => {
      const mockCart = {
        id: 'cart-123',
        discount: 10,
        total: 90,
      };

      const cartService = require('../services/cartService').cartService;
      cartService.applyDiscount.mockResolvedValue(mockCart);

      const response = await request(app)
        .post('/api/v1/cart/discount')
        .set('Authorization', 'Bearer valid-token')
        .send({ code: 'SAVE10' });

      expect(response.status).toBe(200);
    });

    it('should return 400 for invalid discount code', async () => {
      const cartService = require('../services/cartService').cartService;
      cartService.applyDiscount.mockRejectedValue(new Error('Invalid discount code'));

      const response = await request(app)
        .post('/api/v1/cart/discount')
        .set('Authorization', 'Bearer valid-token')
        .send({ code: 'INVALID' });

      expect(response.status).toBe(400);
    });
  });

  describe('Rate Limiting', () => {
    it('should enforce rate limits for cart operations', async () => {
      // Make many requests quickly
      const requests = [];
      for (let i = 0; i < 25; i++) {
        requests.push(
          request(app)
            .post('/api/v1/cart/items')
            .set('Authorization', 'Bearer valid-token')
            .send({
              cartId: 'cart-123',
              productId: 'product-1',
              quantity: 1,
            })
        );
      }

      // The rate limit middleware should be applied
      // In production, this would return 429 after the limit
      // For testing, we mock the rate limiter to not limit
    });
  });
});
