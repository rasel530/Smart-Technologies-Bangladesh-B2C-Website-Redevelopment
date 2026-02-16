/**
 * Cart Merge Integration Tests
 * 
 * Comprehensive integration tests for cart merging functionality
 * including merge scenarios, stock conflicts, and concurrent operations
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

// Initialize Prisma Client
const prisma = new PrismaClient();

// Configuration
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

/**
 * Generate test JWT token
 */
function generateTestToken(userId, role = 'customer') {
  return jwt.sign(
    { userId, role },
    JWT_SECRET,
    { expiresIn: '1h' }
  );
}

/**
 * Create test product with stock
 */
async function createTestProduct(stockQuantity = 100, price = 99.99) {
  const timestamp = Date.now();
  const category = await prisma.category.create({
    data: {
      name: `Test Category ${timestamp}`,
      slug: `test-category-merge-${timestamp}`,
      isActive: true
    }
  });

  const brand = await prisma.brand.create({
    data: {
      name: `Test Brand ${timestamp}`,
      slug: `test-brand-merge-${timestamp}`,
      isActive: true
    }
  });

  return await prisma.product.create({
    data: {
      name: `Test Product ${timestamp}`,
      slug: `test-product-merge-${timestamp}`,
      description: 'Test product for cart merge tests',
      price,
      costPrice: price * 0.6,
      stockQuantity,
      lowStockThreshold: 10,
      isActive: true,
      categoryId: category.id,
      brandId: brand.id,
      images: {
        create: {
          url: 'https://example.com/images/test-product.jpg',
          altText: 'Test Product',
          isPrimary: true,
          position: 1
        }
      }
    },
    include: { category: true, brand: true }
  });
}

/**
 * Create test user
 */
async function createTestUser(email = null) {
  const timestamp = Date.now();
  return await prisma.user.create({
    data: {
      email: email || `test-merge-user-${timestamp}@example.com`,
      password: '$2b$10$test_hashed_password_placeholder',
      firstName: 'Test',
      lastName: 'User',
      role: 'customer',
      isActive: true,
      isEmailVerified: true
    }
  });
}

/**
 * Create guest cart for testing
 */
async function createGuestCart(sessionId, items = []) {
  return await prisma.guestCart.create({
    data: {
      sessionId,
      items: {
        create: items.map(item => ({
          productId: item.productId,
          quantity: item.quantity,
          price: item.price,
          variantId: item.variantId || null
        }))
      }
    },
    include: { items: true }
  });
}

/**
 * Cleanup helper
 */
async function cleanupTestData(userIds = [], sessionIds = [], productIds = []) {
  try {
    // Cleanup user carts
    for (const userId of userIds) {
      await prisma.cartItem.deleteMany({
        where: { cart: { userId } }
      });
      await prisma.cart.deleteMany({
        where: { userId }
      });
    }

    // Cleanup guest carts
    for (const sessionId of sessionIds) {
      await prisma.guestCartItem.deleteMany({
        where: { guestCart: { sessionId } }
      });
      await prisma.guestCart.deleteMany({
        where: { sessionId }
      });
    }

    // Cleanup products
    for (const productId of productIds) {
      try {
        await prisma.product.delete({ where: { id: productId } });
      } catch (e) {}
    }

    // Cleanup users
    for (const userId of userIds) {
      try {
        await prisma.user.delete({ where: { id: userId } });
      } catch (e) {}
    }

    // Cleanup categories and brands
    const categories = await prisma.category.findMany({
      where: { slug: { contains: 'test-category-merge' } }
    });
    const brands = await prisma.brand.findMany({
      where: { slug: { contains: 'test-brand-merge' } }
    });

    for (const cat of categories) {
      try { await prisma.category.delete({ where: { id: cat.id } }); } catch (e) {}
    }
    for (const brand of brands) {
      try { await prisma.brand.delete({ where: { id: brand.id } }); } catch (e) {}
    }
  } catch (error) {
    console.error('Cleanup error:', error);
  }
}

describe('Cart Merge Integration Tests', () => {
  let testUser;
  let authToken;
  let testProducts = [];
  let createdUserIds = [];
  let createdSessionIds = [];
  let createdProductIds = [];

  beforeAll(async () => {
    // Create test user
    testUser = await createTestUser();
    createdUserIds.push(testUser.id);
    authToken = generateTestToken(testUser.id, 'customer');

    // Create test products
    const product1 = await createTestProduct(100, 99.99);
    const product2 = await createTestProduct(50, 149.99);
    const product3 = await createTestProduct(200, 49.99);
    testProducts = [product1, product2, product3];
    createdProductIds.push(product1.id, product2.id, product3.id);

    // Connect Redis
    if (redis && typeof redis.connect === 'function') {
      await redis.connect();
    }
  }, 30000);

  afterAll(async () => {
    await cleanupTestData(createdUserIds, createdSessionIds, createdProductIds);
    
    if (redis && typeof redis.disconnect === 'function') {
      await redis.disconnect();
    }
    
    await prisma.$disconnect();
  }, 30000);

  beforeEach(async () => {
    // Clear user cart
    const cart = await prisma.cart.findUnique({
      where: { userId: testUser.id }
    });
    if (cart) {
      await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
    }

    // Reset product stock
    for (const product of testProducts) {
      await prisma.product.update({
        where: { id: product.id },
        data: { stockQuantity: product.stockQuantity }
      });
    }

    // Clear guest carts
    createdSessionIds = createdSessionIds.filter(sessionId => {
      // Keep session IDs that might be used in tests
      return true;
    });
  });

  // ============================================
  // Basic Merge Scenarios
  // ============================================
  describe('Merge Scenarios', () => {
    it('should merge guest cart with empty user cart', async () => {
      const sessionId = `test_guest_empty_${Date.now()}`;
      createdSessionIds.push(sessionId);

      // Create guest cart with one item
      await createGuestCart(sessionId, [
        { productId: testProducts[0].id, quantity: 2, price: testProducts[0].price }
      ]);

      // Merge guest cart
      const response = await request(app)
        .post('/api/v1/cart/merge')
        .set('Authorization', `Bearer ${authToken}`)
        .set('x-session-id', sessionId)
        .send({});

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.mergedItems).toBe(2);
      expect(response.body.data.conflicts).toHaveLength(0);

      // Verify user cart
      const userCart = await prisma.cart.findUnique({
        where: { userId: testUser.id },
        include: { items: true }
      });

      expect(userCart).not.toBeNull();
      expect(userCart.items).toHaveLength(1);
      expect(userCart.items[0].quantity).toBe(2);
      expect(userCart.items[0].productId).toBe(testProducts[0].id);
    });

    it('should merge quantities for duplicate items', async () => {
      const sessionId = `test_guest_dup_${Date.now()}`;
      createdSessionIds.push(sessionId);

      // User has 1 item in cart
      const userCart = await prisma.cart.upsert({
        where: { userId: testUser.id },
        create: { userId: testUser.id },
        update: {}
      });

      await prisma.cartItem.create({
        data: {
          cartId: userCart.id,
          productId: testProducts[0].id,
          quantity: 1,
          price: testProducts[0].price,
          variantId: null
        }
      });

      // Guest has 3 of same item
      await createGuestCart(sessionId, [
        { productId: testProducts[0].id, quantity: 3, price: testProducts[0].price }
      ]);

      // Merge
      const response = await request(app)
        .post('/api/v1/cart/merge')
        .set('Authorization', `Bearer ${authToken}`)
        .set('x-session-id', sessionId)
        .send({});

      expect(response.status).toBe(200);
      expect(response.body.data.mergedItems).toBe(3); // Total after merge
      expect(response.body.data.addedItems).toBe(0); // No new items

      // Verify combined quantity
      const updatedCart = await prisma.cart.findUnique({
        where: { userId: testUser.id },
        include: { items: true }
      });

      expect(updatedCart.items[0].quantity).toBe(4); // 1 + 3
    });

    it('should merge different products separately', async () => {
      const sessionId = `test_guest_diff_${Date.now()}`;
      createdSessionIds.push(sessionId);

      // User has product A
      const userCart = await prisma.cart.upsert({
        where: { userId: testUser.id },
        create: { userId: testUser.id },
        update: {}
      });

      await prisma.cartItem.create({
        data: {
          cartId: userCart.id,
          productId: testProducts[0].id,
          quantity: 1,
          price: testProducts[0].price,
          variantId: null
        }
      });

      // Guest has product B
      await createGuestCart(sessionId, [
        { productId: testProducts[1].id, quantity: 2, price: testProducts[1].price }
      ]);

      // Merge
      const response = await request(app)
        .post('/api/v1/cart/merge')
        .set('Authorization', `Bearer ${authToken}`)
        .set('x-session-id', sessionId)
        .send({});

      expect(response.status).toBe(200);
      expect(response.body.data.mergedItems).toBe(3); // 1 + 2
      expect(response.body.data.addedItems).toBe(1); // 1 new product added

      // Verify user cart has both products
      const updatedCart = await prisma.cart.findUnique({
        where: { userId: testUser.id },
        include: { items: true }
      });

      expect(updatedCart.items).toHaveLength(2);
    });

    it('should handle merge with empty guest cart', async () => {
      const sessionId = `test_guest_empty_cart_${Date.now()}`;
      createdSessionIds.push(sessionId);

      // Create empty guest cart
      await prisma.guestCart.create({
        data: { sessionId, items: { create: [] } }
      });

      // Merge
      const response = await request(app)
        .post('/api/v1/cart/merge')
        .set('Authorization', `Bearer ${authToken}`)
        .set('x-session-id', sessionId)
        .send({});

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.mergedItems).toBe(0);
    });

    it('should handle merge with no guest cart existing', async () => {
      const sessionId = `test_guest_nonexistent_${Date.now()}`;
      createdSessionIds.push(sessionId);

      // Merge without creating guest cart first
      const response = await request(app)
        .post('/api/v1/cart/merge')
        .set('Authorization', `Bearer ${authToken}`)
        .set('x-session-id', sessionId)
        .send({});

      expect(response.status).toBe(200);
      expect(response.body.data.mergedItems).toBe(0);
    });

    it('should merge multiple items from guest cart', async () => {
      const sessionId = `test_guest_multi_${Date.now()}`;
      createdSessionIds.push(sessionId);

      // Create guest cart with multiple items
      await createGuestCart(sessionId, [
        { productId: testProducts[0].id, quantity: 2, price: testProducts[0].price },
        { productId: testProducts[1].id, quantity: 3, price: testProducts[1].price },
        { productId: testProducts[2].id, quantity: 1, price: testProducts[2].price }
      ]);

      // Merge
      const response = await request(app)
        .post('/api/v1/cart/merge')
        .set('Authorization', `Bearer ${authToken}`)
        .set('x-session-id', sessionId)
        .send({});

      expect(response.status).toBe(200);
      expect(response.body.data.mergedItems).toBe(6); // 2 + 3 + 1
      expect(response.body.data.addedItems).toBe(3);
    });
  });

  // ============================================
  // Stock Conflict Handling
  // ============================================
  describe('Stock Conflict Handling', () => {
    it('should handle merge with insufficient stock', async () => {
      const sessionId = `test_guest_stock_${Date.now()}`;
      createdSessionIds.push(sessionId);

      // User has 2 items
      const userCart = await prisma.cart.upsert({
        where: { userId: testUser.id },
        create: { userId: testUser.id },
        update: {}
      });

      await prisma.cartItem.create({
        data: {
          cartId: userCart.id,
          productId: testProducts[0].id,
          quantity: 2,
          price: testProducts[0].price,
          variantId: null
        }
      });

      // Guest has 10 of same item
      await createGuestCart(sessionId, [
        { productId: testProducts[0].id, quantity: 10, price: testProducts[0].price }
      ]);

      // Stock is only 5
      await prisma.product.update({
        where: { id: testProducts[0].id },
        data: { stockQuantity: 5 }
      });

      // Merge should handle conflict
      const response = await request(app)
        .post('/api/v1/cart/merge')
        .set('Authorization', `Bearer ${authToken}`)
        .set('x-session-id', sessionId)
        .send({});

      expect(response.status).toBe(200);
      expect(response.body.data.stockAdjustments).toHaveLength(1);
      expect(response.body.data.stockAdjustments[0].requested).toBe(10);
      expect(response.body.data.stockAdjustments[0].actual).toBe(3); // 5 - 2
    });

    it('should reject merge when all items out of stock', async () => {
      const sessionId = `test_guest_outofstock_${Date.now()}`;
      createdSessionIds.push(sessionId);

      // Set stock to 0
      await prisma.product.update({
        where: { id: testProducts[0].id },
        data: { stockQuantity: 0 }
      });

      // Guest cart has the out-of-stock item
      await createGuestCart(sessionId, [
        { productId: testProducts[0].id, quantity: 1, price: testProducts[0].price }
      ]);

      // Merge should fail or skip the item
      const response = await request(app)
        .post('/api/v1/cart/merge')
        .set('Authorization', `Bearer ${authToken}`)
        .set('x-session-id', sessionId)
        .send({});

      expect(response.status).toBe(200);
      expect(response.body.data.skippedItems).toContain(testProducts[0].id);
    });

    it('should handle stock validation with multiple products', async () => {
      const sessionId = `test_guest_multi_stock_${Date.now()}`;
      createdSessionIds.push(sessionId);

      // Set different stock levels
      await prisma.product.update({
        where: { id: testProducts[0].id },
        data: { stockQuantity: 3 }
      });
      await prisma.product.update({
        where: { id: testProducts[1].id },
        data: { stockQuantity: 10 }
      });

      // Guest cart has items
      await createGuestCart(sessionId, [
        { productId: testProducts[0].id, quantity: 5, price: testProducts[0].price },
        { productId: testProducts[1].id, quantity: 8, price: testProducts[1].price }
      ]);

      const response = await request(app)
        .post('/api/v1/cart/merge')
        .set('Authorization', `Bearer ${authToken}`)
        .set('x-session-id', sessionId)
        .send({});

      expect(response.status).toBe(200);
      expect(response.body.data.stockAdjustments.length).toBeGreaterThan(0);
    });

    it('should prioritize existing cart items in stock allocation', async () => {
      const sessionId = `test_guest_priority_${Date.now()}`;
      createdSessionIds.push(sessionId);

      // User has 3 items in cart
      const userCart = await prisma.cart.upsert({
        where: { userId: testUser.id },
        create: { userId: testUser.id },
        update: {}
      });

      await prisma.cartItem.create({
        data: {
          cartId: userCart.id,
          productId: testProducts[0].id,
          quantity: 3,
          price: testProducts[0].price,
          variantId: null
        }
      });

      // Stock is 5
      await prisma.product.update({
        where: { id: testProducts[0].id },
        data: { stockQuantity: 5 }
      });

      // Guest has 5 more
      await createGuestCart(sessionId, [
        { productId: testProducts[0].id, quantity: 5, price: testProducts[0].price }
      ]);

      const response = await request(app)
        .post('/api/v1/cart/merge')
        .set('Authorization', `Bearer ${authToken}`)
        .set('x-session-id', sessionId)
        .send({});

      expect(response.status).toBe(200);
      
      // Guest should only get 2 (5 - 3)
      expect(response.body.data.stockAdjustments[0].actual).toBe(2);
    });
  });

  // ============================================
  // Concurrent Merge Handling
  // ============================================
  describe('Concurrent Merge Handling', () => {
    it('should handle concurrent merge requests from same user', async () => {
      const session1 = `test_guest_concurrent1_${Date.now()}`;
      const session2 = `test_guest_concurrent2_${Date.now()}`;
      createdSessionIds.push(session1, session2);

      // Create two guest carts
      await createGuestCart(session1, [
        { productId: testProducts[0].id, quantity: 2, price: testProducts[0].price }
      ]);
      await createGuestCart(session2, [
        { productId: testProducts[1].id, quantity: 3, price: testProducts[1].price }
      ]);

      // Attempt concurrent merges
      const responses = await Promise.all([
        request(app)
          .post('/api/v1/cart/merge')
          .set('Authorization', `Bearer ${authToken}`)
          .set('x-session-id', session1)
          .send({}),
        request(app)
          .post('/api/v1/cart/merge')
          .set('Authorization', `Bearer ${authToken}`)
          .set('x-session-id', session2)
          .send({})
      ]);

      // Both should succeed (first wins for each session)
      const successCount = responses.filter(r => r.status === 200).length;
      expect(successCount).toBe(2);

      // Verify final cart
      const finalCart = await prisma.cart.findUnique({
        where: { userId: testUser.id },
        include: { items: true }
      });

      expect(finalCart.items).toHaveLength(2);
    });

    it('should handle same session concurrent merge attempts', async () => {
      const sessionId = `test_guest_same_concurrent_${Date.now()}`;
      createdSessionIds.push(sessionId);

      await createGuestCart(sessionId, [
        { productId: testProducts[0].id, quantity: 2, price: testProducts[0].price }
      ]);

      // Send concurrent merge requests for same session
      const responses = await Promise.all([
        request(app)
          .post('/api/v1/cart/merge')
          .set('Authorization', `Bearer ${authToken}`)
          .set('x-session-id', sessionId)
          .send({}),
        request(app)
          .post('/api/v1/cart/merge')
          .set('Authorization', `Bearer ${authToken}`)
          .set('x-session-id', sessionId)
          .send({}),
        request(app)
          .post('/api/v1/cart/merge')
          .set('Authorization', `Bearer ${authToken}`)
          .set('x-session-id', sessionId)
          .send({})
      ]);

      // One should succeed, others should fail with already processed
      const successCount = responses.filter(r => r.status === 200).length;
      const conflictCount = responses.filter(r => r.status === 409).length;

      expect(successCount).toBe(1);
      expect(conflictCount).toBe(2);
    });

    it('should handle rapid sequential merges', async () => {
      const sessionIds = [];
      for (let i = 0; i < 5; i++) {
        const sessionId = `test_guest_rapid_${Date.now()}_${i}`;
        sessionIds.push(sessionId);
        createdSessionIds.push(sessionId);

        await createGuestCart(sessionId, [
          { productId: testProducts[i % testProducts.length].id, quantity: i + 1, price: testProducts[i % testProducts.length].price }
        ]);
      }

      // Sequential merges
      for (const sessionId of sessionIds) {
        const response = await request(app)
          .post('/api/v1/cart/merge')
          .set('Authorization', `Bearer ${authToken}`)
          .set('x-session-id', sessionId)
          .send({});

        expect(response.status).toBe(200);
      }

      // Verify final cart has all items
      const finalCart = await prisma.cart.findUnique({
        where: { userId: testUser.id },
        include: { items: true }
      });

      // Should have items from all sessions (some might be same product merged)
      expect(finalCart.items.length).toBeGreaterThan(0);
    });
  });

  // ============================================
  // Merge Validation
  // ============================================
  describe('Merge Validation', () => {
    it('should return 401 for unauthenticated merge request', async () => {
      const sessionId = `test_guest_unauth_${Date.now()}`;
      createdSessionIds.push(sessionId);

      await createGuestCart(sessionId, [
        { productId: testProducts[0].id, quantity: 2, price: testProducts[0].price }
      ]);

      const response = await request(app)
        .post('/api/v1/cart/merge')
        .set('x-session-id', sessionId)
        .send({});

      expect(response.status).toBe(401);
    });

    it('should return 400 for missing session header', async () => {
      const response = await request(app)
        .post('/api/v1/cart/merge')
        .set('Authorization', `Bearer ${authToken}`)
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('MISSING_SESSION_ID');
    });

    it('should validate merged cart totals', async () => {
      const sessionId = `test_guest_totals_${Date.now()}`;
      createdSessionIds.push(sessionId);

      // User cart with one item
      const userCart = await prisma.cart.upsert({
        where: { userId: testUser.id },
        create: { userId: testUser.id },
        update: {}
      });

      await prisma.cartItem.create({
        data: {
          cartId: userCart.id,
          productId: testProducts[0].id,
          quantity: 2,
          price: testProducts[0].price,
          variantId: null
        }
      });

      // Guest cart with different item
      await createGuestCart(sessionId, [
        { productId: testProducts[1].id, quantity: 3, price: testProducts[1].price }
      ]);

      const response = await request(app)
        .post('/api/v1/cart/merge')
        .set('Authorization', `Bearer ${authToken}`)
        .set('x-session-id', sessionId)
        .send({});

      expect(response.status).toBe(200);
      expect(response.body.data.subtotal).toBeGreaterThan(0);
    });

    it('should handle merge with variant items', async () => {
      const sessionId = `test_guest_variant_${Date.now()}`;
      createdSessionIds.push(sessionId);

      // Create variant items
      await createGuestCart(sessionId, [
        { productId: testProducts[0].id, quantity: 2, price: testProducts[0].price, variantId: 'red' },
        { productId: testProducts[0].id, quantity: 3, price: testProducts[0].price, variantId: 'blue' }
      ]);

      const response = await request(app)
        .post('/api/v1/cart/merge')
        .set('Authorization', `Bearer ${authToken}`)
        .set('x-session-id', sessionId)
        .send({});

      expect(response.status).toBe(200);
      expect(response.body.data.mergedItems).toBe(5);
    });

    it('should maintain item prices from guest cart during merge', async () => {
      const sessionId = `test_guest_prices_${Date.now()}`;
      createdSessionIds.push(sessionId);

      const originalPrice = 79.99;
      
      // Update product price
      await prisma.product.update({
        where: { id: testProducts[0].id },
        data: { price: 99.99 }
      });

      // Create guest cart with original price
      await createGuestCart(sessionId, [
        { productId: testProducts[0].id, quantity: 2, price: originalPrice }
      ]);

      const response = await request(app)
        .post('/api/v1/cart/merge')
        .set('Authorization', `Bearer ${authToken}`)
        .set('x-session-id', sessionId)
        .send({});

      expect(response.status).toBe(200);
      
      // Verify merged cart uses guest cart price
      const mergedCart = await prisma.cart.findUnique({
        where: { userId: testUser.id },
        include: { items: true }
      });

      expect(mergedCart.items[0].price).toBe(originalPrice);
    });
  });

  // ============================================
  // Merge Cleanup and Session Management
  // ============================================
  describe('Merge Cleanup and Session Management', () => {
    it('should clear guest cart after successful merge', async () => {
      const sessionId = `test_guest_clear_${Date.now()}`;
      createdSessionIds.push(sessionId);

      const guestCart = await createGuestCart(sessionId, [
        { productId: testProducts[0].id, quantity: 2, price: testProducts[0].price }
      ]);

      // Merge
      await request(app)
        .post('/api/v1/cart/merge')
        .set('Authorization', `Bearer ${authToken}`)
        .set('x-session-id', sessionId)
        .send({});

      // Verify guest cart items are cleared
      const clearedGuestCart = await prisma.guestCart.findUnique({
        where: { sessionId },
        include: { items: true }
      });

      expect(clearedGuestCart.items).toHaveLength(0);
    });

    it('should mark session as processed', async () => {
      const sessionId = `test_guest_processed_${Date.now()}`;
      createdSessionIds.push(sessionId);

      await createGuestCart(sessionId, [
        { productId: testProducts[0].id, quantity: 2, price: testProducts[0].price }
      ]);

      // First merge
      await request(app)
        .post('/api/v1/cart/merge')
        .set('Authorization', `Bearer ${authToken}`)
        .set('x-session-id', sessionId)
        .send({});

      // Second merge should fail
      const response = await request(app)
        .post('/api/v1/cart/merge')
        .set('Authorization', `Bearer ${authToken}`)
        .set('x-session-id', sessionId)
        .send({});

      expect(response.status).toBe(409);
      expect(response.body.error.code).toBe('MERGE_ALREADY_PROCESSED');
    });

    it('should handle merge failure gracefully', async () => {
      const sessionId = `test_guest_fail_${Date.now()}`;
      createdSessionIds.push(sessionId);

      // Create guest cart
      await createGuestCart(sessionId, [
        { productId: testProducts[0].id, quantity: 2, price: testProducts[0].price }
      ]);

      // Mock database failure by deleting product
      await prisma.product.delete({ where: { id: testProducts[0].id } });
      createdProductIds = createdProductIds.filter(id => id !== testProducts[0].id);

      const response = await request(app)
api/v1/c        .post('/art/merge')
        .set('Authorization', `Bearer ${authToken}`)
        .set('x-session-id', sessionId)
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('MERGE_FAILED');
    });

    it('should clean up invalid session data', async () => {
      const sessionId = `test_guest_invalid_${Date.now()}`;
      createdSessionIds.push(sessionId);

      // Create guest cart with invalid product
      await prisma.guestCart.create({
        data: {
          sessionId,
          items: {
            create: {
              productId: 'invalid-product-id',
              quantity: 1,
              price: 99.99
            }
          }
        }
      });

      const response = await request(app)
        .post('/api/v1/cart/merge')
        .set('Authorization', `Bearer ${authToken}`)
        .set('x-session-id', sessionId)
        .send({});

      expect(response.status).toBe(200);
      expect(response.body.data.invalidItems).toHaveLength(1);
    });
  });

  // ============================================
  // Complex Merge Scenarios
  // ============================================
  describe('Complex Merge Scenarios', () => {
    it('should merge cart with mixed existing and new items with conflicts', async () => {
      const sessionId = `test_guest_complex_${Date.now()}`;
      createdSessionIds.push(sessionId);

      // User has 2 of product 0 and 1 of product 1
      const userCart = await prisma.cart.upsert({
        where: { userId: testUser.id },
        create: { userId: testUser.id },
        update: {}
      });

      await prisma.cartItem.create({
        data: {
          cartId: userCart.id,
          productId: testProducts[0].id,
          quantity: 2,
          price: testProducts[0].price,
          variantId: null
        }
      });

      await prisma.cartItem.create({
        data: {
          cartId: userCart.id,
          productId: testProducts[1].id,
          quantity: 1,
          price: testProducts[1].price,
          variantId: null
        }
      });

      // Guest has: 3 of product 0 (conflict), 2 of product 1 (no conflict), 5 of product 2 (new)
      await createGuestCart(sessionId, [
        { productId: testProducts[0].id, quantity: 3, price: testProducts[0].price },
        { productId: testProducts[1].id, quantity: 2, price: testProducts[1].price },
        { productId: testProducts[2].id, quantity: 5, price: testProducts[2].price }
      ]);

      // Set low stock for product 0
      await prisma.product.update({
        where: { id: testProducts[0].id },
        data: { stockQuantity: 3 }
      });

      const response = await request(app)
        .post('/api/v1/cart/merge')
        .set('Authorization', `Bearer ${authToken}`)
        .set('x-session-id', sessionId)
        .send({});

      expect(response.status).toBe(200);
      expect(response.body.data.stockAdjustments.length).toBeGreaterThan(0);
      expect(response.body.data.addedItems).toBe(1); // Product 2 is new
    });

    it('should preserve user preference items during merge', async () => {
      const sessionId = `test_guest_pref_${Date.now()}`;
      createdSessionIds.push(sessionId);

      // User has item from sale
      const userCart = await prisma.cart.upsert({
        where: { userId: testUser.id },
        create: { userId: testUser.id },
        update: {}
      });

      const salePrice = 79.99;
      await prisma.cartItem.create({
        data: {
          cartId: userCart.id,
          productId: testProducts[0].id,
          quantity: 1,
          price: salePrice,
          variantId: null
        }
      });

      // Guest has same product at higher price
      await createGuestCart(sessionId, [
        { productId: testProducts[0].id, quantity: 1, price: testProducts[0].price }
      ]);

      const response = await request(app)
        .post('/api/v1/cart/merge')
        .set('Authorization', `Bearer ${authToken}`)
        .set('x-session-id', sessionId)
        .send({});

      expect(response.status).toBe(200);
      
      // Verify user's original price is preserved
      const mergedCart = await prisma.cart.findUnique({
        where: { userId: testUser.id },
        include: { items: true }
      });

      // Should have only one item with user's original price
      expect(mergedCart.items).toHaveLength(1);
      expect(mergedCart.items[0].price).toBe(salePrice);
    });

    it('should handle merge with expired product', async () => {
      const sessionId = `test_guest_expired_${Date.now()}`;
      createdSessionIds.push(sessionId);

      // Create expired product
      const expiredProduct = await prisma.product.create({
        data: {
          name: `Expired Product ${Date.now()}`,
          slug: `expired-product-${Date.now()}`,
          price: 49.99,
          stockQuantity: 10,
          isActive: true,
          isArchived: true, // Mark as archived/expired
          categoryId: testProducts[0].categoryId,
          brandId: testProducts[0].brandId
        }
      });
      createdProductIds.push(expiredProduct.id);

      await createGuestCart(sessionId, [
        { productId: expiredProduct.id, quantity: 2, price: 49.99 }
      ]);

      const response = await request(app)
        .post('/api/v1/cart/merge')
        .set('Authorization', `Bearer ${authToken}`)
        .set('x-session-id', sessionId)
        .send({});

      expect(response.status).toBe(200);
      expect(response.body.data.skippedItems).toContain(expiredProduct.id);
    });

    it('should merge cart and calculate correct final total', async () => {
      const sessionId = `test_guest_total_${Date.now()}`;
      createdSessionIds.push(sessionId);

      // User has items
      const userCart = await prisma.cart.upsert({
        where: { userId: testUser.id },
        create: { userId: testUser.id },
        update: {}
      });

      await prisma.cartItem.create({
        data: {
          cartId: userCart.id,
          productId: testProducts[0].id,
          quantity: 2,
          price: testProducts[0].price,
          variantId: null
        }
      });

      await prisma.cartItem.create({
        data: {
          cartId: userCart.id,
          productId: testProducts[1].id,
          quantity: 1,
          price: testProducts[1].price,
          variantId: null
        }
      });

      // Guest has more items
      await createGuestCart(sessionId, [
        { productId: testProducts[2].id, quantity: 3, price: testProducts[2].price }
      ]);

      const response = await request(app)
        .post('/api/v1/cart/merge')
        .set('Authorization', `Bearer ${authToken}`)
        .set('x-session-id', sessionId)
        .send({});

      expect(response.status).toBe(200);
      
      // Get final cart
      const finalCart = await prisma.cart.findUnique({
        where: { userId: testUser.id },
        include: { items: true }
      });

      // Calculate expected subtotal
      const expectedSubtotal = 
        (testProducts[0].price * 2) + 
        (testProducts[1].price * 1) + 
        (testProducts[2].price * 3);

      const actualSubtotal = finalCart.items.reduce(
        (sum, item) => sum + (item.price * item.quantity), 
        0
      );

      expect(actualSubtotal).toBeCloseTo(expectedSubtotal, 2);
    });
  });

  // ============================================
  // Edge Cases
  // ============================================
  describe('Merge Edge Cases', () => {
    it('should handle very large quantity merges', async () => {
      const sessionId = `test_guest_large_${Date.now()}`;
      createdSessionIds.push(sessionId);

      // Set high stock
      await prisma.product.update({
        where: { id: testProducts[0].id },
        data: { stockQuantity: 10000 }
      });

      await createGuestCart(sessionId, [
        { productId: testProducts[0].id, quantity: 5000, price: testProducts[0].price }
      ]);

      const response = await request(app)
        .post('/api/v1/cart/merge')
        .set('Authorization', `Bearer ${authToken}`)
        .set('x-session-id', sessionId)
        .send({});

      expect(response.status).toBe(200);
      expect(response.body.data.mergedItems).toBe(5000);
    });

    it('should handle merge with duplicate product different variants', async () => {
      const sessionId = `test_guest_dup_variant_${Date.now()}`;
      createdSessionIds.push(sessionId);

      // User has red variant
      const userCart = await prisma.cart.upsert({
        where: { userId: testUser.id },
        create: { userId: testUser.id },
        update: {}
      });

      await prisma.cartItem.create({
        data: {
          cartId: userCart.id,
          productId: testProducts[0].id,
          quantity: 1,
          price: testProducts[0].price,
          variantId: 'red'
        }
      });

      // Guest has blue variant
      await createGuestCart(sessionId, [
        { productId: testProducts[0].id, quantity: 2, price: testProducts[0].price, variantId: 'blue' }
      ]);

      const response = await request(app)
        .post('/api/v1/cart/merge')
        .set('Authorization', `Bearer ${authToken}`)
        .set('x-session-id', sessionId)
        .send({});

      expect(response.status).toBe(200);
      expect(response.body.data.mergedItems).toBe(3);
      
      // Verify both variants exist
      const mergedCart = await prisma.cart.findUnique({
        where: { userId: testUser.id },
        include: { items: true }
      });

      expect(mergedCart.items).toHaveLength(2);
    });

    it('should handle simultaneous merges from different users', async () => {
      // Create another user
      const otherUser = await createTestUser();
      createdUserIds.push(otherUser.id);
      const otherToken = generateTestToken(otherUser.id);

      const session1 = `test_guest_user1_${Date.now()}`;
      const session2 = `test_guest_user2_${Date.now()}`;
      createdSessionIds.push(session1, session2);

      // Different guest carts for each user
      await createGuestCart(session1, [
        { productId: testProducts[0].id, quantity: 2, price: testProducts[0].price }
      ]);
      await createGuestCart(session2, [
        { productId: testProducts[1].id, quantity: 3, price: testProducts[1].price }
      ]);

      // Concurrent merges
      const [response1, response2] = await Promise.all([
        request(app)
          .post('/api/v1/cart/merge')
          .set('Authorization', `Bearer ${authToken}`)
          .set('x-session-id', session1)
          .send({}),
        request(app)
          .post('/api/v1/cart/merge')
          .set('Authorization', `Bearer ${otherToken}`)
          .set('x-session-id', session2)
          .send({})
      ]);

      // Both should succeed
      expect(response1.status).toBe(200);
      expect(response2.status).toBe(200);

      // Verify separate carts
      const cart1 = await prisma.cart.findUnique({
        where: { userId: testUser.id },
        include: { items: true }
      });
      const cart2 = await prisma.cart.findUnique({
        where: { userId: otherUser.id },
        include: { items: true }
      });

      expect(cart1.items[0].productId).toBe(testProducts[0].id);
      expect(cart2.items[0].productId).toBe(testProducts[1].id);
    });
  });
});
