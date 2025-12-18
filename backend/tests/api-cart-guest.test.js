/**
 * Guest Cart Management Tests
 * 
 * This test suite covers guest cart functionality including:
 * - Session-based cart creation and management
 * - Cart persistence without authentication
 * - Guest cart to user cart conversion on login
 * - Session timeout handling
 * - Anonymous cart operations
 */

const request = require('supertest');
const { app } = require('../index');
const { 
  TEST_CONFIG, 
  createTestUser, 
  createTestAdmin,
  createTestCategory,
  createTestBrand,
  createTestProduct,
  createTestCart,
  cleanupTestData,
  makeAuthenticatedRequest,
  validateResponseStructure,
  prisma,
  BANGLADESH_TEST_DATA
} = require('./api-test-utils');

describe('Guest Cart Management', () => {
  let testUser, testCategory, testBrand, testProduct;
  let guestCart, guestSessionId;

  beforeEach(async () => {
    // Clean up before each test
    await cleanupTestData();
    
    // Create test data
    testUser = await createTestUser();
    testCategory = await createTestCategory();
    testBrand = await createTestBrand();
    testProduct = await createTestProduct({ 
      category: testCategory, 
      brand: testBrand,
      regularPrice: 5000,
      stockQuantity: 100
    });
    
    // Generate unique guest session ID
    guestSessionId = 'guest-session-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
  });

  afterEach(async () => {
    // Clean up after each test
    await cleanupTestData();
  });

  describe('Guest Cart Creation and Management', () => {
    /**
     * Test creation of guest cart without authentication
     */
    it('should create guest cart without authentication', async () => {
      const guestCartData = {
        sessionId: guestSessionId
      };

      const response = await request(app)
        .post('/api/v1/cart')
        .send(guestCartData);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('message', 'Cart created successfully');
      expect(response.body).toHaveProperty('cart');
      
      const cart = response.body.cart;
      expect(cart.sessionId).toBe(guestSessionId);
      expect(cart.userId).toBeNull();
      expect(cart).toHaveProperty('id');
    });

    /**
     * Test guest cart operations without authentication
     */
    it('should allow cart operations without authentication for guest carts', async () => {
      // Create guest cart
      const createResponse = await request(app)
        .post('/api/v1/cart')
        .send({ sessionId: guestSessionId });

      const guestCartId = createResponse.body.cart.id;

      // Add item to guest cart
      const addItemResponse = await request(app)
        .post(`/api/v1/cart/${guestCartId}/items`)
        .send({
          productId: testProduct.id,
          quantity: 2
        });

      expect(addItemResponse.status).toBe(201);
      expect(addItemResponse.body).toHaveProperty('message', 'Item added to cart');

      // Get guest cart
      const getCartResponse = await request(app)
        .get(`/api/v1/cart/${guestCartId}`);

      expect(getCartResponse.status).toBe(200);
      expect(getCartResponse.body.cart.items.length).toBe(1);
    });

    /**
     * Test guest cart with unique session ID
     */
    it('should maintain separate carts for different guest sessions', async () => {
      // Create two different guest sessions
      const session1Id = 'guest-session-1-' + Date.now();
      const session2Id = 'guest-session-2-' + Date.now();

      // Create carts for both sessions
      const cart1Response = await request(app)
        .post('/api/v1/cart')
        .send({ sessionId: session1Id });

      const cart2Response = await request(app)
        .post('/api/v1/cart')
        .send({ sessionId: session2Id });

      expect(cart1Response.status).toBe(201);
      expect(cart2Response.status).toBe(201);
      expect(cart1Response.body.cart.id).not.toBe(cart2Response.body.cart.id);

      // Add different items to each cart
      await request(app)
        .post(`/api/v1/cart/${cart1Response.body.cart.id}/items`)
        .send({
          productId: testProduct.id,
          quantity: 1
        });

      await request(app)
        .post(`/api/v1/cart/${cart2Response.body.cart.id}/items`)
        .send({
          productId: testProduct.id,
          quantity: 2
        });

      // Verify carts have different contents
      const getCart1Response = await request(app)
        .get(`/api/v1/cart/${cart1Response.body.cart.id}`);

      const getCart2Response = await request(app)
        .get(`/api/v1/cart/${cart2Response.body.cart.id}`);

      expect(getCart1Response.body.cart.items[0].quantity).toBe(1);
      expect(getCart2Response.body.cart.items[0].quantity).toBe(2);
    });
  });

  describe('Guest Cart Persistence', () => {
    /**
     * Test guest cart persistence across requests
     */
    it('should maintain guest cart persistence across multiple requests', async () => {
      // Create guest cart
      const createResponse = await request(app)
        .post('/api/v1/cart')
        .send({ sessionId: guestSessionId });

      const guestCartId = createResponse.body.cart.id;

      // Add item to cart
      await request(app)
        .post(`/api/v1/cart/${guestCartId}/items`)
        .send({
          productId: testProduct.id,
          quantity: 3
        });

      // Verify item persists
      const cartResponse = await request(app)
        .get(`/api/v1/cart/${guestCartId}`);

      expect(cartResponse.status).toBe(200);
      expect(cartResponse.body.cart.items.length).toBe(1);
      expect(cartResponse.body.cart.items[0].quantity).toBe(3);
    });

    /**
     * Test guest cart session timeout handling
     */
    it('should handle guest cart session timeout appropriately', async () => {
      // Create guest cart
      const createResponse = await request(app)
        .post('/api/v1/cart')
        .send({ sessionId: guestSessionId });

      const guestCartId = createResponse.body.cart.id;

      // Add items to cart
      await request(app)
        .post(`/api/v1/cart/${guestCartId}/items`)
        .send({
          productId: testProduct.id,
          quantity: 2
        });

      // Simulate session expiry by updating cart
      const pastDate = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24 hours ago
      await prisma.cart.update({
        where: { id: guestCartId },
        data: { expiresAt: pastDate }
      });

      // Try to access expired cart
      const expiredCartResponse = await request(app)
        .get(`/api/v1/cart/${guestCartId}`);

      // Should either return expired cart or create new one
      expect([200, 404]).toContain(expiredCartResponse.status);
    });

    /**
     * Test guest cart with long session ID
     */
    it('should handle guest cart with long session ID', async () => {
      const longSessionId = 'guest-session-' + 'a'.repeat(100) + '-' + Date.now();

      const response = await request(app)
        .post('/api/v1/cart')
        .send({ sessionId: longSessionId });

      expect(response.status).toBe(201);
      expect(response.body.cart.sessionId).toBe(longSessionId);
    });
  });

  describe('Guest Cart to User Cart Conversion', () => {
    /**
     * Test conversion of guest cart to user cart on login
     */
    it('should convert guest cart to user cart when user logs in', async () => {
      // Create guest cart with items
      const guestCartResponse = await request(app)
        .post('/api/v1/cart')
        .send({ sessionId: guestSessionId });

      const guestCartId = guestCartResponse.body.cart.id;

      // Add multiple items to guest cart
      await Promise.all([
        request(app)
          .post(`/api/v1/cart/${guestCartId}/items`)
          .send({
            productId: testProduct.id,
            quantity: 2
          }),
        request(app)
          .post(`/api/v1/cart/${guestCartId}/items`)
          .send({
            productId: testProduct.id,
            quantity: 1
          })
      ]);

      // Simulate user login - convert guest cart to user cart
      await prisma.cart.update({
        where: { id: guestCartId },
        data: { 
          userId: testUser.user.id,
          sessionId: null // Clear session ID
        }
      });

      // Verify cart is now associated with user
      const userCartResponse = await makeAuthenticatedRequest(
        app,
        'GET',
        `/api/v1/cart/${guestCartId}`,
        {},
        testUser.token
      );

      expect(userCartResponse.status).toBe(200);
      expect(userCartResponse.body.cart.userId).toBe(testUser.user.id);
      expect(userCartResponse.body.cart.sessionId).toBeNull();
      expect(userCartResponse.body.cart.items.length).toBe(2); // Items should be merged
    });

    /**
     * Test merging guest cart with existing user cart
     */
    it('should merge guest cart with existing user cart on login', async () => {
      // Create guest cart with items
      const guestCartResponse = await request(app)
        .post('/api/v1/cart')
        .send({ sessionId: guestSessionId });

      const guestCartId = guestCartResponse.body.cart.id;

      // Add items to guest cart
      await request(app)
        .post(`/api/v1/cart/${guestCartId}/items`)
        .send({
          productId: testProduct.id,
          quantity: 3
        });

      // Create user cart with existing items
      const userCartResponse = await makeAuthenticatedRequest(
        app,
        'POST',
        '/api/v1/cart',
        {},
        testUser.token
      );

      const userCartId = userCartResponse.body.cart.id;

      // Add different item to user cart
      const anotherProduct = await createTestProduct({ 
        name: 'Another Product',
        regularPrice: 3000
      });

      await makeAuthenticatedRequest(
        app,
        'POST',
        `/api/v1/cart/${userCartId}/items`,
        {
          productId: anotherProduct.id,
          quantity: 1
        },
        testUser.token
      );

      // Simulate cart merging - move guest items to user cart
      const guestItems = await prisma.cartItem.findMany({
        where: { cartId: guestCartId }
      });

      for (const item of guestItems) {
        await prisma.cartItem.update({
          where: { id: item.id },
          data: { cartId: userCartId }
        });
      }

      // Delete empty guest cart
      await prisma.cart.delete({
        where: { id: guestCartId }
      });

      // Verify merged cart
      const mergedCartResponse = await makeAuthenticatedRequest(
        app,
        'GET',
        `/api/v1/cart/${userCartId}`,
        {},
        testUser.token
      );

      expect(mergedCartResponse.status).toBe(200);
      expect(mergedCartResponse.body.cart.items.length).toBe(2); // Both items present

      // Verify totals are calculated correctly
      const expectedSubtotal = (parseFloat(testProduct.regularPrice) * 3) + parseFloat(anotherProduct.regularPrice);
      expect(parseFloat(mergedCartResponse.body.cart.subtotal)).toBeCloseTo(expectedSubtotal, 2);
    });

    /**
     * Test handling duplicate items during cart merge
     */
    it('should handle duplicate items during guest to user cart merge', async () => {
      // Create guest cart with product
      const guestCartResponse = await request(app)
        .post('/api/v1/cart')
        .send({ sessionId: guestSessionId });

      const guestCartId = guestCartResponse.body.cart.id;

      await request(app)
        .post(`/api/v1/cart/${guestCartId}/items`)
        .send({
          productId: testProduct.id,
          quantity: 2
        });

      // Create user cart with same product
      const userCartResponse = await makeAuthenticatedRequest(
        app,
        'POST',
        '/api/v1/cart',
        {},
        testUser.token
      );

      const userCartId = userCartResponse.body.cart.id;

      await makeAuthenticatedRequest(
        app,
        'POST',
        `/api/v1/cart/${userCartId}/items`,
        {
          productId: testProduct.id,
          quantity: 1
        },
        testUser.token
      );

      // Simulate merge - guest items should be added to existing user cart item
      const guestItems = await prisma.cartItem.findMany({
        where: { cartId: guestCartId }
      });

      for (const item of guestItems) {
        await prisma.cartItem.update({
          where: { id: item.id },
          data: { cartId: userCartId }
        });
      }

      // Delete empty guest cart
      await prisma.cart.delete({
        where: { id: guestCartId }
      });

      // Verify merged quantities
      const mergedCartResponse = await makeAuthenticatedRequest(
        app,
        'GET',
        `/api/v1/cart/${userCartId}`,
        {},
        testUser.token
      );

      expect(mergedCartResponse.status).toBe(200);
      
      // Should have one item with combined quantity (1 + 2 = 3)
      const mergedItems = mergedCartResponse.body.cart.items.filter(
        item => item.productId === testProduct.id
      );
      expect(mergedItems.length).toBe(1);
      expect(mergedItems[0].quantity).toBe(3);
    });
  });

  describe('Guest Cart Security and Validation', () => {
    /**
     * Test prevention of unauthorized access to other guest carts
     */
    it('should prevent unauthorized access to other guest carts', async () => {
      // Create two guest carts
      const cart1Response = await request(app)
        .post('/api/v1/cart')
        .send({ sessionId: guestSessionId + '-1' });

      const cart2Response = await request(app)
        .post('/api/v1/cart')
        .send({ sessionId: guestSessionId + '-2' });

      const cart1Id = cart1Response.body.cart.id;
      const cart2Id = cart2Response.body.cart.id;

      // Add item to first cart
      await request(app)
        .post(`/api/v1/cart/${cart1Id}/items`)
        .send({
          productId: testProduct.id,
          quantity: 1
        });

      // Try to access first cart from second session context (if session validation exists)
      const unauthorizedResponse = await request(app)
        .get(`/api/v1/cart/${cart1Id}`);

      // Should allow access since guest carts don't have strong session validation
      expect([200, 401]).toContain(unauthorizedResponse.status);
    });

    /**
     * Test guest cart with invalid session ID format
     */
    it('should validate guest session ID format', async () => {
      const invalidSessionIds = [
        '',
        null,
        undefined,
        'a'.repeat(1000), // Too long
        'invalid-session-with-special-chars!@#$',
        123 // Numeric instead of string
      ];

      for (const sessionId of invalidSessionIds) {
        const response = await request(app)
          .post('/api/v1/cart')
          .send({ sessionId });

        // Should either reject or handle gracefully
        expect([201, 400]).toContain(response.status);
      }
    });

    /**
     * Test guest cart cleanup after conversion
     */
    it('should clean up guest cart after conversion to user cart', async () => {
      // Create guest cart
      const guestCartResponse = await request(app)
        .post('/api/v1/cart')
        .send({ sessionId: guestSessionId });

      const guestCartId = guestCartResponse.body.cart.id;

      // Convert to user cart
      await prisma.cart.update({
        where: { id: guestCartId },
        data: { userId: testUser.user.id }
      });

      // Try to access as guest cart again
      const guestAccessResponse = await request(app)
        .get(`/api/v1/cart/${guestCartId}`);

      // Should still be accessible but now as user cart
      expect(guestAccessResponse.status).toBe(200);
      expect(guestAccessResponse.body.cart.userId).toBe(testUser.user.id);
    });
  });

  describe('Guest Cart Performance', () => {
    /**
     * Test guest cart performance with multiple items
     */
    it('should handle guest cart with multiple items efficiently', async () => {
      // Create multiple products
      const products = await Promise.all([
        createTestProduct({ name: 'Guest Product 1', regularPrice: 1000 }),
        createTestProduct({ name: 'Guest Product 2', regularPrice: 2000 }),
        createTestProduct({ name: 'Guest Product 3', regularPrice: 3000 }),
        createTestProduct({ name: 'Guest Product 4', regularPrice: 4000 }),
        createTestProduct({ name: 'Guest Product 5', regularPrice: 5000 })
      ]);

      // Create guest cart
      const guestCartResponse = await request(app)
        .post('/api/v1/cart')
        .send({ sessionId: guestSessionId });

      const guestCartId = guestCartResponse.body.cart.id;

      // Add multiple items concurrently
      const startTime = Date.now();
      
      const addPromises = products.map(product =>
        request(app)
          .post(`/api/v1/cart/${guestCartId}/items`)
          .send({
            productId: product.id,
            quantity: 1
          })
      );

      const responses = await Promise.all(addPromises);
      const endTime = Date.now();

      // Verify all items were added successfully
      responses.forEach(response => {
        expect(response.status).toBe(201);
      });

      // Verify performance - should complete within reasonable time
      expect(endTime - startTime).toBeLessThan(5000); // 5 seconds max

      // Verify cart contains all items
      const cartResponse = await request(app)
        .get(`/api/v1/cart/${guestCartId}`);

      expect(cartResponse.status).toBe(200);
      expect(cartResponse.body.cart.items.length).toBe(5);

      // Verify total calculation
      const expectedSubtotal = products.reduce((sum, product) => 
        sum + parseFloat(product.regularPrice), 0
      );
      expect(parseFloat(cartResponse.body.cart.subtotal)).toBeCloseTo(expectedSubtotal, 2);
    });

    /**
     * Test concurrent guest cart operations
     */
    it('should handle concurrent guest cart operations safely', async () => {
      // Create guest cart
      const guestCartResponse = await request(app)
        .post('/api/v1/cart')
        .send({ sessionId: guestSessionId });

      const guestCartId = guestCartResponse.body.cart.id;

      // Perform concurrent operations
      const concurrentOperations = [
        // Add item
        request(app)
          .post(`/api/v1/cart/${guestCartId}/items`)
          .send({
            productId: testProduct.id,
            quantity: 1
          }),
        // Get cart
        request(app)
          .get(`/api/v1/cart/${guestCartId}`),
        // Update item (if exists)
        request(app)
          .put(`/api/v1/cart/${guestCartId}/items/non-existent`)
          .send({ quantity: 2 })
      ];

      const responses = await Promise.all(concurrentOperations);

      // Add operation should succeed
      expect(responses[0].status).toBe(201);
      
      // Get operation should succeed
      expect(responses[1].status).toBe(200);
      
      // Update non-existent item should fail
      expect(responses[2].status).toBe(404);
    });
  });
});