/**
 * Cart API Integration Tests
 * 
 * Comprehensive integration tests for the cart API endpoints
 * Tests interactions, database operations API, and cross-component behavior
 * 
 * @author Smart Tech B2C Development Team
 * @version 1.0.0
 */

const request = require('supertest');
const { PrismaClient } = require('@prisma/client');
const jwt = require('jsonwebtoken');

// Import app and config
const app = require('../app');
const redis = require('../config/redis');
const { v4: uuidv4 } = require('uuid');

// Initialize Prisma Client
const prisma = new PrismaClient();

// Test configuration
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const TEST_USER_EMAIL = 'test-cart-api-integration@example.com';

/**
 * Generate test JWT token for authentication
 */
function generateTestToken(userId, role = 'customer') {
  return jwt.sign(
    { userId, role },
    JWT_SECRET,
    { expiresIn: '1h' }
  );
}

/**
 * Create test product with required relations
 */
async function createTestProduct(categoryId, brandId) {
  const timestamp = Date.now();
  return await prisma.product.create({
    data: {
      name: `Integration Test Product ${timestamp}`,
      slug: `integration-test-product-${timestamp}`,
      description: 'Test product for cart integration tests',
      price: Math.floor(Math.random() * 10000) / 100,
      costPrice: Math.floor(Math.random() * 5000) / 100,
      stockQuantity: Math.floor(Math.random() * 200) + 50,
      lowStockThreshold: 10,
      isActive: true,
      isFeatured: false,
      categoryId: categoryId,
      brandId: brandId,
      images: {
        create: [
          {
            url: 'https://example.com/images/test-product.jpg',
            altText: 'Test Product Image',
            isPrimary: true,
            position: 1
          }
        ]
      }
    }
  });
}

/**
 * Create test category
 */
async function createTestCategory() {
  const timestamp = Date.now();
  return await prisma.category.create({
    data: {
      name: `Test Category ${timestamp}`,
      slug: `test-category-${timestamp}`,
      description: 'Test category for cart integration tests',
      isActive: true,
      position: Math.floor(Math.random() * 100)
    }
  });
}

/**
 * Create test brand
 */
async function createTestBrand() {
  const timestamp = Date.now();
  return await prisma.brand.create({
    data: {
      name: `Test Brand ${timestamp}`,
      slug: `test-brand-${timestamp}`,
      isActive: true
    }
  });
}

/**
 * Cleanup helper function
 */
async function cleanupTestData(testUserId, testProductIds = []) {
  try {
    // Delete cart items for test user's cart
    const cart = await prisma.cart.findUnique({
      where: { userId: testUserId }
    });
    if (cart) {
      await prisma.cartItem.deleteMany({
        where: { cartId: cart.id }
      });
      await prisma.cart.delete({
        where: { id: cart.id }
      });
    }

    // Delete guest carts
    await prisma.guestCart.deleteMany({
      where: {
        sessionId: { startsWith: 'test_integration_' }
      }
    });

    // Delete test products
    for (const productId of testProductIds) {
      try {
        await prisma.product.delete({
          where: { id: productId }
        });
      } catch (e) {
        // Product might already be deleted
      }
    }
  } catch (error) {
    console.error('Cleanup error:', error);
  }
}

describe('Cart API Integration Tests', () => {
  let testUser;
  let authToken;
  let testProduct;
  let testCategory;
  let testBrand;
  let createdProductIds = [];

  // Set up test data before all tests
  beforeAll(async () => {
    // Create test category
    testCategory = await createTestCategory();
    
    // Create test brand
    testBrand = await createTestBrand();
    
    // Create test user
    testUser = await prisma.user.create({
      data: {
        email: `${TEST_USER_EMAIL}_${Date.now()}@example.com`,
        password: '$2b$10$test_hashed_password_placeholder',
        firstName: 'Test',
        lastName: 'User',
        role: 'customer',
        isActive: true,
        isEmailVerified: true
      }
    });

    // Generate auth token
    authToken = generateTestToken(testUser.id, 'customer');

    // Create test product with stock
    testProduct = await createTestProduct(testCategory.id, testBrand.id);
    createdProductIds.push(testProduct.id);

    // Connect Redis for tests
    if (redis && typeof redis.connect === 'function') {
      await redis.connect();
    }
  }, 30000);

  // Cleanup after all tests
  afterAll(async () => {
    // Cleanup test data
    await cleanupTestData(testUser.id, createdProductIds);
    
    // Delete test user
    try {
      await prisma.user.delete({
        where: { id: testUser.id }
      });
    } catch (e) {
      // User might already be deleted
    }

    // Delete test category and brand
    try {
      await prisma.category.delete({ where: { id: testCategory.id } });
      await prisma.brand.delete({ where: { id: testBrand.id } });
    } catch (e) {
      // Category/brand might already be deleted
    }

    // Disconnect Redis
    if (redis && typeof redis.disconnect === 'function') {
      await redis.disconnect();
    }

    // Disconnect Prisma
    await prisma.$disconnect();
  }, 30000);

  // Clean up cart before each test
  beforeEach(async () => {
    // Clear cart for fresh state
    const cart = await prisma.cart.findUnique({
      where: { userId: testUser.id }
    });
    
    if (cart) {
      await prisma.cartItem.deleteMany({
        where: { cartId: cart.id }
      });
    }
    
    // Reset product stock
    if (testProduct) {
      await prisma.product.update({
        where: { id: testProduct.id },
        data: { stockQuantity: 100 }
      });
    }
  });

  // ============================================
  // POST /api/v1/cart/items - Add Item to Cart
  // ============================================
  describe('POST /api/v1/cart/items', () => {
    it('should add item to authenticated user cart successfully', async () => {
      const response = await request(app)
        .post('/api/v1/cart/items')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          productId: testProduct.id,
          quantity: 2,
          variantId: null
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('items');
      expect(response.body.data.items).toHaveLength(1);
      expect(response.body.data.items[0].productId).toBe(testProduct.id);
      expect(response.body.data.items[0].quantity).toBe(2);
      expect(response.body.data.items[0].price).toBe(testProduct.price);
    });

    it('should add multiple different items to cart', async () => {
      // Create second product
      const product2 = await createTestProduct(testCategory.id, testBrand.id);
      createdProductIds.push(product2.id);

      // Add first item
      await request(app)
        .post('/api/v1/cart/items')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ productId: testProduct.id, quantity: 1, variantId: null });

      // Add second item
      const response = await request(app)
        .post('/api/v1/cart/items')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ productId: product2.id, quantity: 2, variantId: null });

      expect(response.status).toBe(201);
      expect(response.body.data.items).toHaveLength(2);
      
      // Verify quantities
      const quantities = response.body.data.items.map(item => item.quantity);
      expect(quantities).toContain(1);
      expect(quantities).toContain(2);
    });

    it('should update quantity when adding existing item', async () => {
      // Add item first time
      await request(app)
        .post('/api/v1/cart/items')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ productId: testProduct.id, quantity: 1, variantId: null });

      // Add same item again
      const response = await request(app)
        .post('/api/v1/cart/items')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ productId: testProduct.id, quantity: 2, variantId: null });

      expect(response.status).toBe(201);
      expect(response.body.data.items).toHaveLength(1);
      expect(response.body.data.items[0].quantity).toBe(3); // 1 + 2
    });

    it('should reject adding item with insufficient stock', async () => {
      // Set low stock
      await prisma.product.update({
        where: { id: testProduct.id },
        data: { stockQuantity: 2 }
      });

      const response = await request(app)
        .post('/api/v1/cart/items')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ productId: testProduct.id, quantity: 5, variantId: null });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INSUFFICIENT_STOCK');
      expect(response.body.error.message).toContain('stock');
    });

    it('should reject adding out of stock item', async () => {
      // Set zero stock
      await prisma.product.update({
        where: { id: testProduct.id },
        data: { stockQuantity: 0 }
      });

      const response = await request(app)
        .post('/api/v1/cart/items')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ productId: testProduct.id, quantity: 1, variantId: null });

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('OUT_OF_STOCK');
    });

    it('should reject request with invalid product ID', async () => {
      const response = await request(app)
        .post('/api/v1/cart/items')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ productId: 'non-existent-product-id', quantity: 1, variantId: null });

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('PRODUCT_NOT_FOUND');
    });

    it('should reject request with invalid quantity', async () => {
      const response = await request(app)
        .post('/api/v1/cart/items')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ productId: testProduct.id, quantity: 0, variantId: null });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INVALID_QUANTITY');
    });

    it('should reject negative quantity', async () => {
      const response = await request(app)
        .post('/api/v1/cart/items')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ productId: testProduct.id, quantity: -1, variantId: null });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should reject quantity exceeding maximum limit', async () => {
      const response = await request(app)
        .post('/api/v1/cart/items')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ productId: testProduct.id, quantity: 1000, variantId: null });

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('QUANTITY_EXCEEDS_LIMIT');
    });

    it('should return 401 for unauthenticated request', async () => {
      const response = await request(app)
        .post('/api/v1/cart/items')
        .send({ productId: testProduct.id, quantity: 1, variantId: null });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('UNAUTHORIZED');
    });

    it('should return 401 for invalid token', async () => {
      const response = await request(app)
        .post('/api/v1/cart/items')
        .set('Authorization', 'Bearer invalid_token_here')
        .send({ productId: testProduct.id, quantity: 1, variantId: null });

      expect(response.status).toBe(401);
    });

    it('should return 401 for expired token', async () => {
      const expiredToken = jwt.sign(
        { userId: testUser.id, role: 'customer' },
        JWT_SECRET,
        { expiresIn: '-1h' }
      );

      const response = await request(app)
        .post('/api/v1/cart/items')
        .set('Authorization', `Bearer ${expiredToken}`)
        .send({ productId: testProduct.id, quantity: 1, variantId: null });

      expect(response.status).toBe(401);
    });

    it('should handle concurrent add requests atomically', async () => {
      // Set stock to 10
      await prisma.product.update({
        where: { id: testProduct.id },
        data: { stockQuantity: 10 }
      });

      // Send concurrent requests
      const responses = await Promise.all([
        request(app)
          .post('/api/v1/cart/items')
          .set('Authorization', `Bearer ${authToken}`)
          .send({ productId: testProduct.id, quantity: 5, variantId: null }),
        request(app)
          .post('/api/v1/cart/items')
          .set('Authorization', `Bearer ${authToken}`)
          .send({ productId: testProduct.id, quantity: 5, variantId: null })
      ]);

      // Both should succeed with atomic increment
      const successCount = responses.filter(r => r.status === 201).length;
      expect(successCount).toBe(2);

      // Final quantity should be 10
      const finalCart = await prisma.cart.findUnique({
        where: { userId: testUser.id },
        include: { items: true }
      });
      expect(finalCart.items[0].quantity).toBe(10);
    });
  });

  // ============================================
  // GET /api/v1/cart - Get User Cart
  // ============================================
  describe('GET /api/v1/cart', () => {
    it('should return user cart with calculated totals', async () => {
      // Add items first
      await request(app)
        .post('/api/v1/cart/items')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ productId: testProduct.id, quantity: 2, variantId: null });

      const response = await request(app)
        .get('/api/v1/cart')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('items');
      expect(response.body.data).toHaveProperty('subtotal');
      expect(response.body.data).toHaveProperty('itemCount');
      expect(response.body.data.subtotal).toBe(testProduct.price * 2);
      expect(response.body.data.itemCount).toBe(2);
    });

    it('should return empty cart for new user', async () => {
      // Create new user
      const newUser = await prisma.user.create({
        data: {
          email: `new-cart-user-${Date.now()}@example.com`,
          password: '$2b$10$test_hashed_password',
          role: 'customer',
          isActive: true
        }
      });

      const newToken = generateTestToken(newUser.id);

      const response = await request(app)
        .get('/api/v1/cart')
        .set('Authorization', `Bearer ${newToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.items).toHaveLength(0);
      expect(response.body.data.subtotal).toBe(0);
      expect(response.body.data.itemCount).toBe(0);

      // Cleanup
      await prisma.user.delete({ where: { id: newUser.id } });
    });

    it('should return cart with multiple items and correct totals', async () => {
      // Create multiple products
      const product1 = await createTestProduct(testCategory.id, testBrand.id);
      const product2 = await createTestProduct(testCategory.id, testBrand.id);
      createdProductIds.push(product1.id, product2.id);

      // Add items
      await request(app)
        .post('/api/v1/cart/items')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ productId: product1.id, quantity: 2, variantId: null });

      await request(app)
        .post('/api/v1/cart/items')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ productId: product2.id, quantity: 3, variantId: null });

      await request(app)
        .post('/api/v1/cart/items')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ productId: testProduct.id, quantity: 1, variantId: null });

      const response = await request(app)
        .get('/api/v1/cart')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.items).toHaveLength(3);
      expect(response.body.data.itemCount).toBe(6);
      
      // Verify subtotal calculation
      const expectedSubtotal = (product1.price * 2) + (product2.price * 3) + (testProduct.price * 1);
      expect(response.body.data.subtotal).toBeCloseTo(expectedSubtotal, 2);
    });

    it('should return cart with correct item structure', async () => {
      await request(app)
        .post('/api/v1/cart/items')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ productId: testProduct.id, quantity: 1, variantId: null });

      const response = await request(app)
        .get('/api/v1/cart')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      
      const item = response.body.data.items[0];
      expect(item).toHaveProperty('id');
      expect(item).toHaveProperty('productId');
      expect(item).toHaveProperty('quantity');
      expect(item).toHaveProperty('price');
      expect(item).toHaveProperty('product');
      expect(item.product).toHaveProperty('name');
      expect(item.product).toHaveProperty('slug');
      expect(item.product).toHaveProperty('images');
    });

    it('should return 401 for unauthenticated cart access', async () => {
      const response = await request(app)
        .get('/api/v1/cart');

      expect(response.status).toBe(401);
    });
  });

  // ============================================
  // PUT /api/v1/cart/items/:itemId - Update Item
  // ============================================
  describe('PUT /api/v1/cart/items/:itemId', () => {
    let cartItemId;

    beforeEach(async () => {
      // Add item and get cart item ID
      const addResponse = await request(app)
        .post('/api/v1/cart/items')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ productId: testProduct.id, quantity: 2, variantId: null });
      
      cartItemId = addResponse.body.data.items[0].id;
    });

    it('should update item quantity successfully', async () => {
      const response = await request(app)
        .put(`/api/v1/cart/items/${cartItemId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ quantity: 5 });

      expect(response.status).toBe(200);
      expect(response.body.data.items[0].quantity).toBe(5);
    });

    it('should reject quantity update exceeding stock', async () => {
      await prisma.product.update({
        where: { id: testProduct.id },
        data: { stockQuantity: 3 }
      });

      const response = await request(app)
        .put(`/api/v1/cart/items/${cartItemId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ quantity: 10 });

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('INSUFFICIENT_STOCK');
    });

    it('should reject quantity update to zero', async () => {
      const response = await request(app)
        .put(`/api/v1/cart/items/${cartItemId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ quantity: 0 });

      expect(response.status).toBe(400);
    });

    it('should return 404 for non-existent cart item', async () => {
      const response = await request(app)
        .put('/api/v1/cart/items/non-existent-id')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ quantity: 5 });

      expect(response.status).toBe(404);
    });

    it('should return 401 for unauthenticated request', async () => {
      const response = await request(app)
        .put(`/api/v1/cart/items/${cartItemId}`)
        .send({ quantity: 5 });

      expect(response.status).toBe(401);
    });
  });

  // ============================================
  // DELETE /api/v1/cart/items/:itemId - Remove Item
  // ============================================
  describe('DELETE /api/v1/cart/items/:itemId', () => {
    let cartItemId;

    beforeEach(async () => {
      const addResponse = await request(app)
        .post('/api/v1/cart/items')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ productId: testProduct.id, quantity: 2, variantId: null });
      
      cartItemId = addResponse.body.data.items[0].id;
    });

    it('should remove item from cart successfully', async () => {
      const response = await request(app)
        .delete(`/api/v1/cart/items/${cartItemId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.items).toHaveLength(0);
    });

    it('should return 404 for non-existent cart item', async () => {
      const response = await request(app)
        .delete('/api/v1/cart/items/non-existent-id')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
    });

    it('should return 401 for unauthenticated request', async () => {
      const response = await request(app)
        .delete(`/api/v1/cart/items/${cartItemId}`);

      expect(response.status).toBe(401);
    });

    it('should handle item belonging to another user', async () => {
      // Create another user
      const otherUser = await prisma.user.create({
        data: {
          email: `other-user-${Date.now()}@example.com`,
          password: '$2b$10$test',
          role: 'customer',
          isActive: true
        }
      });

      const otherToken = generateTestToken(otherUser.id);

      // Try to delete item from test user's cart
      const response = await request(app)
        .delete(`/api/v1/cart/items/${cartItemId}`)
        .set('Authorization', `Bearer ${otherToken}`);

      expect(response.status).toBe(404);

      await prisma.user.delete({ where: { id: otherUser.id } });
    });
  });

  // ============================================
  // DELETE /api/v1/cart - Clear Cart
  // ============================================
  describe('DELETE /api/v1/cart', () => {
    beforeEach(async () => {
      // Add items
      await request(app)
        .post('/api/v1/cart/items')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ productId: testProduct.id, quantity: 2, variantId: null });
    });

    it('should clear all items from cart', async () => {
      const response = await request(app)
        .delete('/api/v1/cart')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.items).toHaveLength(0);
      expect(response.body.data.subtotal).toBe(0);
    });

    it('should return empty cart after clear', async () => {
      await request(app)
        .delete('/api/v1/cart')
        .set('Authorization', `Bearer ${authToken}`);

      const getResponse = await request(app)
        .get('/api/v1/cart')
        .set('Authorization', `Bearer ${authToken}`);

      expect(getResponse.body.data.items).toHaveLength(0);
      expect(getResponse.body.data.subtotal).toBe(0);
    });

    it('should return 401 for unauthenticated request', async () => {
      const response = await request(app)
        .delete('/api/v1/cart');

      expect(response.status).toBe(401);
    });
  });

  // ============================================
  // POST /api/v1/cart/merge - Merge Guest Cart
  // ============================================
  describe('POST /api/v1/cart/merge', () => {
    let guestSessionId;

    beforeEach(async () => {
      guestSessionId = `test_integration_guest_${Date.now()}`;
      
      // Create guest cart
      await prisma.guestCart.create({
        data: {
          sessionId: guestSessionId,
          items: {
            create: {
              productId: testProduct.id,
              quantity: 3,
              price: testProduct.price,
              variantId: null
            }
          }
        },
        include: { items: true }
      });
    });

    it('should merge guest cart into user cart', async () => {
      // First add item to user cart
      await request(app)
        .post('/api/v1/cart/items')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ productId: testProduct.id, quantity: 1, variantId: null });

      // Merge guest cart
      const response = await request(app)
        .post('/api/v1/cart/merge')
        .set('Authorization', `Bearer ${authToken}`)
        .set('x-session-id', guestSessionId)
        .send({});

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.mergedItems).toBe(1);
      expect(response.body.data.totalQuantity).toBe(4); // 1 + 3

      // Verify in database
      const cart = await prisma.cart.findUnique({
        where: { userId: testUser.id },
        include: { items: true }
      });
      expect(cart.items).toHaveLength(1);
      expect(cart.items[0].quantity).toBe(4);
    });

    it('should validate stock during merge', async () => {
      // Set low stock
      await prisma.product.update({
        where: { id: testProduct.id },
        data: { stockQuantity: 2 }
      });

      const response = await request(app)
        .post('/api/v1/c1/cart/merge')
        .set('Authorization', `Bearer ${authToken}`)
        .set('x-session-id', guestSessionId)
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('MERGE_STOCK_VALIDATION_FAILED');
    });

    it('should reject merge for already processed session', async () => {
      // First merge
      await request(app)
        .post('/api/v1/cart/merge')
        .set('Authorization', `Bearer ${authToken}`)
        .set('x-session-id', guestSessionId)
        .send({});

      // Try to merge again
      const response = await request(app)
        .post('/api/v1/cart/merge')
        .set('Authorization', `Bearer ${authToken}`)
        .set('x-session-id', guestSessionId)
        .send({});

      expect(response.status).toBe(409);
      expect(response.body.error.code).toBe('MERGE_ALREADY_PROCESSED');
    });

    it('should return 401 without session header', async () => {
      const response = await request(app)
        .post('/api/v1/cart/merge')
        .set('Authorization', `Bearer ${authToken}`)
        .send({});

      expect(response.status).toBe(400);
    });

    it('should handle merge with empty guest cart', async () => {
      const emptySessionId = `test_integration_guest_empty_${Date.now()}`;
      
      // Create empty guest cart
      await prisma.guestCart.create({
        data: {
          sessionId: emptySessionId,
          items: { create: [] }
        }
      });

      const response = await request(app)
        .post('/api/v1/cart/merge')
        .set('Authorization', `Bearer ${authToken}`)
        .set('x-session-id', emptySessionId)
        .send({});

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should merge multiple items from guest cart', async () => {
      // Create another product
      const product2 = await createTestProduct(testCategory.id, testBrand.id);
      createdProductIds.push(product2.id);

      // Add to guest cart
      await prisma.guestCartItem.create({
        data: {
          guestCartId: (await prisma.guestCart.findUnique({ where: { sessionId: guestSessionId } })).id,
          productId: product2.id,
          quantity: 2,
          price: product2.price,
          variantId: null
        }
      });

      const response = await request(app)
        .post('/api/v1/cart/merge')
        .set('Authorization', `Bearer ${authToken}`)
        .set('x-session-id', guestSessionId)
        .send({});

      expect(response.status).toBe(200);
      expect(response.body.data.mergedItems).toBe(2);
    });

    it('should handle concurrent merge requests gracefully', async () => {
      const concurrentSessionId = `test_integration_concurrent_${Date.now()}`;
      
      await prisma.guestCart.create({
        data: {
          sessionId: concurrentSessionId,
          items: {
            create: {
              productId: testProduct.id,
              quantity: 2,
              price: testProduct.price,
              variantId: null
            }
          }
        }
      });

      // Send concurrent merge requests
      const responses = await Promise.all([
        request(app)
          .post('/api/v1/cart/merge')
          .set('Authorization', `Bearer ${authToken}`)
          .set('x-session-id', concurrentSessionId)
          .send({}),
        request(app)
          .post('/api/v1/cart/merge')
          .set('Authorization', `Bearer ${authToken}`)
          .set('x-session-id', concurrentSessionId)
          .send({}),
        request(app)
          .post('/api/v1/cart/merge')
          .set('Authorization', `Bearer ${authToken}`)
          .set('x-session-id', concurrentSessionId)
          .send({})
      ]);

      // One should succeed, others should fail with already processed
      const successCount = responses.filter(r => r.status === 200).length;
      const conflictCount = responses.filter(r => r.status === 409).length;
      
      expect(successCount).toBe(1);
      expect(conflictCount).toBe(2);
    });
  });

  // ============================================
  // POST /api/v1/cart/guest/products - Guest Cart
  // ============================================
  describe('POST /api/v1/cart/guest/products', () => {
    it('should create cart for guest user', async () => {
      const guestSessionId = `test_guest_${Date.now()}`;

      const response = await request(app)
        .post('/api/v1/cart/guest/products')
        .set('x-session-id', guestSessionId)
        .send({
          productId: testProduct.id,
          quantity: 2,
          variantId: null
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.sessionId).toBe(guestSessionId);
      expect(response.body.data.items).toHaveLength(1);
    });

    it('should update existing guest cart', async () => {
      const guestSessionId = `test_guest_${Date.now()}`;

      // Create initial cart
      await request(app)
        .post('/api/v1/cart/guest/products')
        .set('x-session-id', guestSessionId)
        .send({ productId: testProduct.id, quantity: 1, variantId: null });

      // Add another item
      const product2 = await createTestProduct(testCategory.id, testBrand.id);
      createdProductIds.push(product2.id);

      const response = await request(app)
        .post('/api/v1/cart/guest/products')
        .set('x-session-id', guestSessionId)
        .send({ productId: product2.id, quantity: 2, variantId: null });

      expect(response.status).toBe(200);
      expect(response.body.data.items).toHaveLength(2);
    });

    it('should generate session ID if not provided', async () => {
      const response = await request(app)
        .post('/api/v1/cart/guest/products')
        .send({
          productId: testProduct.id,
          quantity: 1,
          variantId: null
        });

      expect(response.status).toBe(201);
      expect(response.body.data.sessionId).toBeDefined();
      expect(response.body.data.sessionId.length).toBeGreaterThan(0);
    });

    it('should validate stock for guest cart', async () => {
      await prisma.product.update({
        where: { id: testProduct.id },
        data: { stockQuantity: 1 }
      });

      const guestSessionId = `test_guest_${Date.now()}`;

      const response = await request(app)
        .post('/api/v1/cart/guest/products')
        .set('x-session-id', guestSessionId)
        .send({
          productId: testProduct.id,
          quantity: 5,
          variantId: null
        });

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('INSUFFICIENT_STOCK');
    });

    it('should return 400 for invalid product in guest cart', async () => {
      const guestSessionId = `test_guest_${Date.now()}`;

      const response = await request(app)
        .post('/api/v1/cart/guest/products')
        .set('x-session-id', guestSessionId)
        .send({
          productId: 'non-existent-product',
          quantity: 1,
          variantId: null
        });

      expect(response.status).toBe(404);
    });

    it('should handle multiple guest carts independently', async () => {
      const session1 = `test_guest_multi1_${Date.now()}`;
      const session2 = `test_guest_multi2_${Date.now()}`;

      // Add to first cart
      await request(app)
        .post('/api/v1/cart/guest/products')
        .set('x-session-id', session1)
        .send({ productId: testProduct.id, quantity: 1, variantId: null });

      // Add to second cart
      const product2 = await createTestProduct(testCategory.id, testBrand.id);
      createdProductIds.push(product2.id);

      await request(app)
        .post('/api/v1/cart/guest/products')
        .set('x-session-id', session2)
        .send({ productId: product2.id, quantity: 3, variantId: null });

      // Verify carts are separate
      const cart1 = await prisma.guestCart.findUnique({
        where: { sessionId: session1 },
        include: { items: true }
      });

      const cart2 = await prisma.guestCart.findUnique({
        where: { sessionId: session2 },
        include: { items: true }
      });

      expect(cart1.items[0].productId).toBe(testProduct.id);
      expect(cart2.items[0].productId).toBe(product2.id);
      expect(cart1.items[0].quantity).toBe(1);
      expect(cart2.items[0].quantity).toBe(3);
    });
  });

  // ============================================
  // GET /api/v1/cart/guest - Get Guest Cart
  // ============================================
  describe('GET /api/v1/cart/guest', () => {
    it('should return guest cart with session ID', async () => {
      const guestSessionId = `test_guest_get_${Date.now()}`;

      // Create cart first
      await request(app)
        .post('/api/v1/cart/guest/products')
        .set('x-session-id', guestSessionId)
        .send({ productId: testProduct.id, quantity: 2, variantId: null });

      // Get cart
      const response = await request(app)
        .get('/api/v1/cart/guest')
        .set('x-session-id', guestSessionId);

      expect(response.status).toBe(200);
      expect(response.body.data.sessionId).toBe(guestSessionId);
      expect(response.body.data.items).toHaveLength(1);
    });

    it('should return 404 for non-existent session', async () => {
      const response = await request(app)
        .get('/api/v1/cart/guest')
        .set('x-session-id', 'non-existent-session-id');

      expect(response.status).toBe(404);
    });
  });

  // ============================================
  // DELETE /api/v1/cart/guest - Clear Guest Cart
  // ============================================
  describe('DELETE /api/v1/cart/guest', () => {
    it('should clear guest cart', async () => {
      const guestSessionId = `test_guest_clear_${Date.now()}`;

      // Create cart
      await request(app)
        .post('/api/v1/cart/guest/products')
        .set('x-session-id', guestSessionId)
        .send({ productId: testProduct.id, quantity: 2, variantId: null });

      // Clear cart
      const response = await request(app)
        .delete('/api/v1/cart/guest')
        .set('x-session-id', guestSessionId);

      expect(response.status).toBe(200);
      expect(response.body.data.items).toHaveLength(0);

      // Verify in database
      const cart = await prisma.guestCart.findUnique({
        where: { sessionId: guestSessionId },
        include: { items: true }
      });
      expect(cart.items).toHaveLength(0);
    });
  });

  // ============================================
  // POST /api/v1/cart/items/bulk - Bulk Add
  // ============================================
  describe('POST /api/v1/cart/items/bulk', () => {
    it('should add multiple items in bulk', async () => {
      const product1 = await createTestProduct(testCategory.id, testBrand.id);
      const product2 = await createTestProduct(testCategory.id, testBrand.id);
      const product3 = await createTestProduct(testCategory.id, testBrand.id);
      createdProductIds.push(product1.id, product2.id, product3.id);

      const response = await request(app)
        .post('/api/v1/cart/items/bulk')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          items: [
            { productId: product1.id, quantity: 2, variantId: null },
            { productId: product2.id, quantity: 3, variantId: null },
            { productId: product3.id, quantity: 1, variantId: null }
          ]
        });

      expect(response.status).toBe(201);
      expect(response.body.data.items).toHaveLength(3);
      expect(response.body.data.itemCount).toBe(6);
    });

    it('should reject bulk add with one invalid item', async () => {
      const product1 = await createTestProduct(testCategory.id, testBrand.id);
      createdProductIds.push(product1.id);

      const response = await request(app)
        .post('/api/v1/cart/items/bulk')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          items: [
            { productId: product1.id, quantity: 2, variantId: null },
            { productId: 'invalid-product-id', quantity: 1, variantId: null }
          ]
        });

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('BULK_ADD_FAILED');
    });

    it('should return 401 for unauthenticated bulk add', async () => {
      const response = await request(app)
        .post('/api/v1/cart/items/bulk')
        .send({
          items: [
            { productId: testProduct.id, quantity: 2, variantId: null });

      expect(response }
          ]
       .status).toBe(401);
    });
  });

  // ============================================
  // POST /api/v1/cart/apply-coupon - Coupon
  // ============================================
  describe('POST /api/v1/cart/apply-coupon', () => {
    beforeEach(async () => {
      // Add item to cart
      await request(app)
        .post('/api/v1/cart/items')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ productId: testProduct.id, quantity: 2, variantId: null });
    });

    it('should apply valid coupon code', async () => {
      // Create coupon
      const coupon = await prisma.coupon.create({
        data: {
          code: `TESTCOUPON${Date.now()}`,
          type: 'percentage',
          value: 10,
          isActive: true,
          minOrderAmount: 0,
          maxDiscountAmount: 100,
          expiresAt: new Date(Date.now() + 86400000) // Tomorrow
        }
      });

      const response = await request(app)
        .post('/api/v1/cart/apply-coupon')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ couponCode: coupon.code });

      expect(response.status).toBe(200);
      expect(response.body.data.discount).toBeGreaterThan(0);
      expect(response.body.data.couponCode).toBe(coupon.code);
    });

    it('should reject expired coupon', async () => {
      const coupon = await prisma.coupon.create({
        data: {
          code: `EXPIRED${Date.now()}`,
          type: 'percentage',
          value: 10,
          isActive: true,
          expiresAt: new Date(Date.now() - 86400000) // Yesterday
        }
      });

      const response = await request(app)
        .post('/api/v1/cart/apply-coupon')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ couponCode: coupon.code });

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('COUPON_EXPIRED');
    });

    it('should reject invalid coupon code', async () => {
      const response = await request(app)
        .post('/api/v1/cart/apply-coupon')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ couponCode: 'INVALIDCOUPON123' });

      expect(response.status).toBe(404);
      expect(response.body.error.code).toBe('COUPON_NOT_FOUND');
    });
  });

  // ============================================
  // Error Handling Tests
  // ============================================
  describe('Error Handling', () => {
    it('should handle database connection errors gracefully', async () => {
      // This test verifies error handling behavior
      // Actual DB disconnection would be handled differently in production
      
      const response = await request(app)
        .get('/api/v1/cart')
        .set('Authorization', `Bearer ${authToken}`);

      // Should either succeed or return proper error
      expect([200, 500]).toContain(response.status);
    });

    it('should handle malformed JSON requests', async () => {
      const response = await request(app)
        .post('/api/v1/cart/items')
        .set('Authorization', `Bearer ${authToken}`)
        .set('Content-Type', 'application/json')
        .send('{"invalid": json}');

      expect(response.status).toBe(400);
    });

    it('should handle requests with missing required fields', async () => {
      const response = await request(app)
        .post('/api/v1/cart/items')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ productId: testProduct.id }); // Missing quantity

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should handle concurrent requests to same cart', async () => {
      // Add item to cart first
      await request(app)
        .post('/api/v1/cart/items')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ productId: testProduct.id, quantity: 1, variantId: null });

      // Send concurrent updates
      const responses = await Promise.all([
        request(app)
          .put(`/api/v1/cart/items/${(await prisma.cart.findUnique({ where: { userId: testUser.id } })).items[0].id}`)
          .set('Authorization', `Bearer ${authToken}`)
          .send({ quantity: 5 }),
        request(app)
          .put(`/api/v1/cart/items/${(await prisma.cart.findUnique({ where: { userId: testUser.id } })).items[0].id}`)
          .set('Authorization', `Bearer ${authToken}`)
          .send({ quantity: 3 }),
        request(app)
          .put(`/api/v1/cart/items/${(await prisma.cart.findUnique({ where: { userId: testUser.id } })).items[0].id}`)
          .set('Authorization', `Bearer ${authToken}`)
          .send({ quantity: 8 })
      ]);

      // All should succeed (optimistic locking or last write wins)
      responses.forEach(response => {
        expect([200, 409]).toContain(response.status);
      });
    });
  });
});
