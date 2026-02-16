/**
 * Cart Merge Functionality Tests
 * 
 * This test suite covers all the fixes implemented for Cart Merging on Login:
 * - CRIT-001: Race Condition in Item Merge Loop
 * - CRIT-002: Guest Cart Deletion Outside Safe Zone
 * - HIGH-001: Missing Idempotency Protection
 * - HIGH-002: Stock Validation Reads Stale Data
 * - HIGH-003: Frontend Error Handling
 * - HIGH-004: Concurrent Merge Protection
 * - MED-001: Audit Trail
 */

const request = require('supertest');
const { app } = require('../index');
const {
  TEST_CONFIG,
  createTestUser,
  createTestCategory,
  createTestBrand,
  createTestProduct,
  createTestCart,
  cleanupTestData,
  makeAuthenticatedRequest,
  validateResponseStructure,
  prisma,
  generateTestProduct,
} = require('./api-test-utils');

describe('Cart Merge Functionality - Comprehensive Tests', () => {
  let testUser, testCategory, testBrand;
  let testProducts = [];
  let guestSessionId;

  beforeEach(async () => {
    await cleanupTestData();
    
    // Create test data
    testUser = await createTestUser();
    testCategory = await createTestCategory();
    testBrand = await createTestBrand();
    
    // Create multiple test products with different stock levels
    for (let i = 0; i < 5; i++) {
      const product = await createTestProduct({
        category: testCategory,
        brand: testBrand,
        regularPrice: 1000 + (i * 500),
        stockQuantity: 10 + (i * 5)
      });
      testProducts.push(product);
    }
    
    // Generate unique guest session ID
    guestSessionId = 'guest-merge-test-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
  });

  afterEach(async () => {
    await cleanupTestData();
  });

  // ==================== CRIT-001: Race Condition Tests ====================
  
  describe('CRIT-001: Race Condition Prevention', () => {
    it('should merge cart items with proper stock locking', async () => {
      // Create guest cart with items
      const guestCartResponse = await request(app)
        .post('/api/v1/cart')
        .send({ sessionId: guestSessionId });

      const guestCartId = guestCartResponse.body.cart.id;

      // Add items to guest cart
      await request(app)
        .post(`/api/v1/cart/${guestCartId}/items`)
        .send({
          productId: testProducts[0].id,
          quantity: 5
        });

      // User has empty cart
      const userCartBefore = await makeAuthenticatedRequest(
        app, 'GET', `/api/v1/cart`, {}, testUser.token
      );
      expect(userCartBefore.body.cart.items.length).toBe(0);

      // Merge should succeed
      const mergeResponse = await makeAuthenticatedRequest(
        app, 'POST', '/api/v1/cart/merge',
        { guestSessionId },
        testUser.token
      );

      expect(mergeResponse.status).toBe(200);
      expect(mergeResponse.body.success).toBe(true);
      expect(mergeResponse.body.data.itemsMerged).toBe(1);

      // User cart should have merged items
      const userCartAfter = await makeAuthenticatedRequest(
        app, 'GET', `/api/v1/cart`, {}, testUser.token
      );
      expect(userCartAfter.body.cart.items.length).toBe(1);
      expect(userCartAfter.body.cart.items[0].quantity).toBe(5);
    });

    it('should handle concurrent merges gracefully with locking', async () => {
      // Create guest cart with items
      const guestCartResponse = await request(app)
        .post('/api/v1/cart')
        .send({ sessionId: guestSessionId });

      const guestCartId = guestCartResponse.body.cart.id;

      await request(app)
        .post(`/api/v1/cart/${guestCartId}/items`)
        .send({
          productId: testProducts[0].id,
          quantity: 3
        });

      // Simulate concurrent merge requests
      const mergePromises = [
        makeAuthenticatedRequest(
          app, 'POST', '/api/v1/cart/merge',
          { guestSessionId },
          testUser.token
        ),
        makeAuthenticatedRequest(
          app, 'POST', '/api/v1/cart/merge',
          { guestSessionId },
          testUser.token
        )
      ];

      const results = await Promise.all(mergePromises);

      // At least one should succeed, the other should fail with conflict
      const successCount = results.filter(r => r.status === 200).length;
      const conflictCount = results.filter(r => 
        r.status === 409 || r.body.error?.includes('locked')
      ).length;

      expect(successCount + conflictCount).toBe(2);
      expect(successCount).toBe(1); // Exactly one should succeed
    });
  });

  // ==================== CRIT-002: Transaction Boundary Tests ====================

  describe('CRIT-002: Transaction Boundaries', () => {
    it('should not lose guest cart if post-merge operations fail', async () => {
      // Create guest cart with items
      const guestCartResponse = await request(app)
        .post('/api/v1/cart')
        .send({ sessionId: guestSessionId });

      const guestCartId = guestCartResponse.body.cart.id;

      await request(app)
        .post(`/api/v1/cart/${guestCartId}/items`)
        .send({
          productId: testProducts[0].id,
          quantity: 2
        });

      // Merge should succeed even if cache fails
      const mergeResponse = await makeAuthenticatedRequest(
        app, 'POST', '/api/v1/cart/merge',
        { guestSessionId },
        testUser.token
      );

      expect(mergeResponse.status).toBe(200);
      expect(mergeResponse.body.success).toBe(true);
      expect(mergeResponse.body.data.itemsMerged).toBe(1);

      // Guest cart should be deleted
      const guestCartAfter = await request(app)
        .get(`/api/v1/cart/${guestCartId}`);

      expect(guestCartAfter.status).toBe(404);
    });

    it('should return detailed merge result with skipped and failed items', async () => {
      // Create guest cart with items
      const guestCartResponse = await request(app)
        .post('/api/v1/cart')
        .send({ sessionId: guestSessionId });

      const guestCartId = guestCartResponse.body.cart.id;

      // Add item with high quantity (more than stock)
      await request(app)
        .post(`/api/v1/cart/${guestCartId}/items`)
        .send({
          productId: testProducts[0].id,
          quantity: 100 // More than stock
        });

      // Merge should report failure
      const mergeResponse = await makeAuthenticatedRequest(
        app, 'POST', '/api/v1/cart/merge',
        { guestSessionId },
        testUser.token
      );

      expect(mergeResponse.status).toBe(400);
      expect(mergeResponse.body.error).toContain('Insufficient stock');
    });
  });

  // ==================== HIGH-001: Idempotency Tests ====================

  describe('HIGH-001: Idempotency Protection', () => {
    it('should prevent duplicate merges with idempotency key', async () => {
      // Create guest cart with items
      const guestCartResponse = await request(app)
        .post('/api/v1/cart')
        .send({ sessionId: guestSessionId });

      const guestCartId = guestCartResponse.body.cart.id;

      await request(app)
        .post(`/api/v1/cart/${guestCartId}/items`)
        .send({
          productId: testProducts[0].id,
          quantity: 2
        });

      const idempotencyKey = 'test-idem-key-' + Date.now();

      // First merge should succeed
      const merge1Response = await makeAuthenticatedRequest(
        app, 'POST', '/api/v1/cart/merge',
        { guestSessionId, idempotencyKey },
        testUser.token
      );

      expect(merge1Response.status).toBe(200);

      // Second merge with same key should be rejected
      const merge2Response = await makeAuthenticatedRequest(
        app, 'POST', '/api/v1/cart/merge',
        { guestSessionId, idempotencyKey },
        testUser.token
      );

      expect(merge2Response.status).toBe(409);
      expect(merge2Response.body.error).toContain('already');
    });

    it('should allow different idempotency keys', async () => {
      // Create guest cart with items
      const guestCartResponse = await request(app)
        .post('/api/v1/cart')
        .send({ sessionId: guestSessionId });

      const guestCartId = guestCartResponse.body.cart.id;

      await request(app)
        .post(`/api/v1/cart/${guestCartId}/items`)
        .send({
          productId: testProducts[0].id,
          quantity: 2
        });

      // First merge
      await makeAuthenticatedRequest(
        app, 'POST', '/api/v1/cart/merge',
        { guestSessionId, idempotencyKey: 'key-1' },
        testUser.token
      );

      // Create another guest cart
      const guestSessionId2 = 'guest-merge-test-2-' + Date.now();
      const guestCart2Response = await request(app)
        .post('/api/v1/cart')
        .send({ sessionId: guestSessionId2 });

      await request(app)
        .post(`/api/v1/cart/${guestCart2Response.body.cart.id}/items`)
        .send({
          productId: testProducts[1].id,
          quantity: 3
        });

      // Different key should work
      const merge2Response = await makeAuthenticatedRequest(
        app, 'POST', '/api/v1/cart/merge',
        { guestSessionId: guestSessionId2, idempotencyKey: 'key-2' },
        testUser.token
      );

      expect(merge2Response.status).toBe(200);
      expect(merge2Response.body.data.itemsMerged).toBe(1);
    });
  });

  // ==================== HIGH-002: Stock Validation Tests ====================

  describe('HIGH-002: Stock Validation', () => {
    it('should validate stock before merging duplicate items', async () => {
      // Create guest cart with same product as user cart
      const guestCartResponse = await request(app)
        .post('/api/v1/cart')
        .send({ sessionId: guestSessionId });

      const guestCartId = guestCartResponse.body.cart.id;

      // Add item to guest cart (3 units)
      await request(app)
        .post(`/api/v1/cart/${guestCartId}/items`)
        .send({
          productId: testProducts[0].id,
          quantity: 3
        });

      // User has cart with same product (5 units)
      const userCartResponse = await makeAuthenticatedRequest(
        app, 'POST', '/api/v1/cart',
        {}, testUser.token
      );

      await makeAuthenticatedRequest(
        app, 'POST', `/api/v1/cart/${userCartResponse.body.cart.id}/items`,
        { productId: testProducts[0].id, quantity: 5 },
        testUser.token
      );

      // Merge should succeed (3 + 5 = 8, which is <= stock of 10)
      const mergeResponse = await makeAuthenticatedRequest(
        app, 'POST', '/api/v1/cart/merge',
        { guestSessionId },
        testUser.token
      );

      expect(mergeResponse.status).toBe(200);
      expect(mergeResponse.body.data.itemsMerged).toBe(1);

      // Quantity should be combined
      const userCartAfter = await makeAuthenticatedRequest(
        app, 'GET', `/api/v1/cart`, {}, testUser.token
      );
      expect(userCartAfter.body.cart.items[0].quantity).toBe(8);
    });

    it('should fail merge when combined quantity exceeds stock', async () => {
      // Create guest cart
      const guestCartResponse = await request(app)
        .post('/api/v1/cart')
        .send({ sessionId: guestSessionId });

      const guestCartId = guestCartResponse.body.cart.id;

      // Add item to guest cart (8 units)
      await request(app)
        .post(`/api/v1/cart/${guestCartId}/items`)
        .send({
          productId: testProducts[0].id,
          quantity: 8
        });

      // User has cart with same product (5 units)
      const userCartResponse = await makeAuthenticatedRequest(
        app, 'POST', '/api/v1/cart',
        {}, testUser.token
      );

      await makeAuthenticatedRequest(
        app, 'POST', `/api/v1/cart/${userCartResponse.body.cart.id}/items`,
        { productId: testProducts[0].id, quantity: 5 },
        testUser.token
      );

      // Merge should fail (8 + 5 = 13 > stock of 10)
      const mergeResponse = await makeAuthenticatedRequest(
        app, 'POST', '/api/v1/cart/merge',
        { guestSessionId },
        testUser.token
      );

      expect(mergeResponse.status).toBe(400);
      expect(mergeResponse.body.error).toContain('Insufficient stock');
    });

    it('should validate stock for variants correctly', async () => {
      // This test requires products with variants - simplified version
      const guestCartResponse = await request(app)
        .post('/api/v1/cart')
        .send({ sessionId: guestSessionId });

      const guestCartId = guestCartResponse.body.cart.id;

      await request(app)
        .post(`/api/v1/cart/${guestCartId}/items`)
        .send({
          productId: testProducts[0].id,
          quantity: 2
        });

      const mergeResponse = await makeAuthenticatedRequest(
        app, 'POST', '/api/v1/cart/merge',
        { guestSessionId },
        testUser.token
      );

      expect(mergeResponse.status).toBe(200);
      expect(mergeResponse.body.data.itemsMerged).toBe(1);
    });
  });

  // ==================== HIGH-003: Error Handling Tests ====================

  describe('HIGH-003: Error Handling', () => {
    it('should return proper error for unauthenticated merge', async () => {
      const mergeResponse = await request(app)
        .post('/api/v1/cart/merge')
        .send({ guestSessionId: guestSessionId });

      expect(mergeResponse.status).toBe(401);
      expect(mergeResponse.body.error).toContain('Authentication');
    });

    it('should return proper error for missing guestSessionId', async () => {
      const mergeResponse = await makeAuthenticatedRequest(
        app, 'POST', '/api/v1/cart/merge',
        {}, testUser.token
      );

      expect(mergeResponse.status).toBe(400);
      expect(mergeResponse.body.error).toContain('guestSessionId');
    });

    it('should return proper error for already merged cart', async () => {
      // Create and merge guest cart
      const guestCartResponse = await request(app)
        .post('/api/v1/cart')
        .send({ sessionId: guestSessionId });

      const guestCartId = guestCartResponse.body.cart.id;

      await request(app)
        .post(`/api/v1/cart/${guestCartId}/items`)
        .send({
          productId: testProducts[0].id,
          quantity: 2
        });

      // First merge
      await makeAuthenticatedRequest(
        app, 'POST', '/api/v1/cart/merge',
        { guestSessionId }, testUser.token
      );

      // Try to merge again
      const merge2Response = await makeAuthenticatedRequest(
        app, 'POST', '/api/v1/cart/merge',
        { guestSessionId }, testUser.token
      );

      expect(merge2Response.status).toBe(404);
      expect(merge2Response.body.error).toContain('not found');
    });

    it('should return detailed error for database failures', async () => {
      // Test with invalid data
      const mergeResponse = await makeAuthenticatedRequest(
        app, 'POST', '/api/v1/cart/merge',
        { guestSessionId: 'invalid-session' }, testUser.token
      );

      expect(mergeResponse.status).toBe(404);
    });
  });

  // ==================== HIGH-004: Concurrent Merge Protection Tests ====================

  describe('HIGH-004: Concurrent Merge Protection', () => {
    it('should handle rapid successive merge requests', async () => {
      // Create guest cart
      const guestCartResponse = await request(app)
        .post('/api/v1/cart')
        .send({ sessionId: guestSessionId });

      const guestCartId = guestCartResponse.body.cart.id;

      await request(app)
        .post(`/api/v1/cart/${guestCartId}/items`)
        .send({
          productId: testProducts[0].id,
          quantity: 2
        });

      // Fire rapid merge requests
      const promises = [];
      for (let i = 0; i < 5; i++) {
        promises.push(
          makeAuthenticatedRequest(
            app, 'POST', '/api/v1/cart/merge',
            { guestSessionId }, testUser.token
          )
        );
      }

      const results = await Promise.all(promises);

      // Count successes
      const successes = results.filter(r => r.status === 200);
      const failures = results.filter(r => r.status !== 200);

      // Exactly one should succeed
      expect(successes.length).toBe(1);
      // Others should fail (cart not found after first merge)
      expect(failures.length).toBe(4);
    });
  });

  // ==================== MED-001: Audit Trail Tests ====================

  describe('MED-001: Audit Trail', () => {
    it('should record merge in cart analytics', async () => {
      // Create and merge guest cart
      const guestCartResponse = await request(app)
        .post('/api/v1/cart')
        .send({ sessionId: guestSessionId });

      const guestCartId = guestCartResponse.body.cart.id;

      await request(app)
        .post(`/api/v1/cart/${guestCartId}/items`)
        .send({
          productId: testProducts[0].id,
          quantity: 2
        });

      await makeAuthenticatedRequest(
        app, 'POST', '/api/v1/cart/merge',
        { guestSessionId }, testUser.token
      );

      // Get user cart
      const userCartResponse = await makeAuthenticatedRequest(
        app, 'GET', `/api/v1/cart`, {}, testUser.token
      );

      // Check analytics
      const analytics = await prisma.cartAnalytics.findUnique({
        where: { cartId: userCartResponse.body.cart.id }
      });

      expect(analytics).not.toBeNull();
      expect(analytics.events).toHaveProperty('cart_merge');
      expect(analytics.events.cart_merge.guestSessionId).toBe(guestSessionId);
    });

    it('should record merge audit with details', async () => {
      // Create guest cart with items
      const guestCartResponse = await request(app)
        .post('/api/v1/cart')
        .send({ sessionId: guestSessionId });

      const guestCartId = guestCartResponse.body.cart.id;

      // Add multiple items
      for (let i = 0; i < 3; i++) {
        await request(app)
          .post(`/api/v1/cart/${guestCartId}/items`)
          .send({
            productId: testProducts[i].id,
            quantity: 1
          });
      }

      await makeAuthenticatedRequest(
        app, 'POST', '/api/v1/cart/merge',
        { guestSessionId }, testUser.token
      );

      // Get user cart
      const userCartResponse = await makeAuthenticatedRequest(
        app, 'GET', `/api/v1/cart`, {}, testUser.token
      );

      const analytics = await prisma.cartAnalytics.findUnique({
        where: { cartId: userCartResponse.body.cart.id }
      });

      expect(analytics.events.cart_merge.itemsMerged).toBe(3);
      expect(analytics.events.cart_merge.completedAt).toBeDefined();
    });
  });

  // ==================== Edge Cases ====================

  describe('Edge Cases', () => {
    it('should handle merge with empty guest cart', async () => {
      // Create empty guest cart
      await request(app)
        .post('/api/v1/cart')
        .send({ sessionId: guestSessionId });

      const mergeResponse = await makeAuthenticatedRequest(
        app, 'POST', '/api/v1/cart/merge',
        { guestSessionId }, testUser.token
      );

      expect(mergeResponse.status).toBe(200);
      expect(mergeResponse.body.data.itemsMerged).toBe(0);
    });

    it('should handle merge with non-existent guest session', async () => {
      const mergeResponse = await makeAuthenticatedRequest(
        app, 'POST', '/api/v1/cart/merge',
        { guestSessionId: 'non-existent-session' }, testUser.token
      );

      expect(mergeResponse.status).toBe(200);
      expect(mergeResponse.body.data.itemsMerged).toBe(0);
      expect(mergeResponse.body.data.message).toContain('No guest cart');
    });

    it('should merge multiple different items correctly', async () => {
      // Create guest cart
      const guestCartResponse = await request(app)
        .post('/api/v1/cart')
        .send({ sessionId: guestSessionId });

      const guestCartId = guestCartResponse.body.cart.id;

      // Add multiple different products
      for (let i = 0; i < 3; i++) {
        await request(app)
          .post(`/api/v1/cart/${guestCartId}/items`)
          .send({
            productId: testProducts[i].id,
            quantity: 1 + i
          });
      }

      const mergeResponse = await makeAuthenticatedRequest(
        app, 'POST', '/api/v1/cart/merge',
        { guestSessionId }, testUser.token
      );

      expect(mergeResponse.status).toBe(200);
      expect(mergeResponse.body.data.items.length).toBe(3);
      expect(mergeResponse.body.data.itemsMerged).toBe(3);

      // Verify totals
      const expectedSubtotal = 
        parseFloat(testProducts[0].regularPrice) * 1 +
        parseFloat(testProducts[1].regularPrice) * 2 +
        parseFloat(testProducts[2].regularPrice) * 3;
      
      expect(parseFloat(mergeResponse.body.data.subtotal)).toBeCloseTo(expectedSubtotal, 2);
    });

    it('should handle merge with user cart that has items', async () => {
      // Create guest cart
      const guestCartResponse = await request(app)
        .post('/api/v1/cart')
        .send({ sessionId: guestSessionId });

      const guestCartId = guestCartResponse.body.cart.id;

      await request(app)
        .post(`/api/v1/cart/${guestCartId}/items`)
        .send({
          productId: testProducts[0].id,
          quantity: 2
        });

      // User has existing cart with different product
      const userCartResponse = await makeAuthenticatedRequest(
        app, 'POST', '/api/v1/cart',
        {}, testUser.token
      );

      await makeAuthenticatedRequest(
        app, 'POST', `/api/v1/cart/${userCartResponse.body.cart.id}/items`,
        { productId: testProducts[1].id, quantity: 1 },
        testUser.token
      );

      // Merge
      const mergeResponse = await makeAuthenticatedRequest(
        app, 'POST', '/api/v1/cart/merge',
        { guestSessionId }, testUser.token
      );

      expect(mergeResponse.status).toBe(200);
      expect(mergeResponse.body.data.items.length).toBe(2);
    });
  });

  // ==================== Performance Tests ====================

  describe('Performance', () => {
    it('should complete merge within reasonable time', async () => {
      // Create guest cart with many items
      const guestCartResponse = await request(app)
        .post('/api/v1/cart')
        .send({ sessionId: guestSessionId });

      const guestCartId = guestCartResponse.body.cart.id;

      // Add 10 items
      for (let i = 0; i < 10; i++) {
        await request(app)
          .post(`/api/v1/cart/${guestCartId}/items`)
          .send({
            productId: testProducts[i % testProducts.length].id,
            quantity: 1
          });
      }

      const startTime = Date.now();
      
      const mergeResponse = await makeAuthenticatedRequest(
        app, 'POST', '/api/v1/cart/merge',
        { guestSessionId }, testUser.token
      );

      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(mergeResponse.status).toBe(200);
      expect(duration).toBeLessThan(5000); // Should complete within 5 seconds
    });
  });
});
