/**
 * Cart Error Handling and Edge Cases Tests
 * 
 * This test suite covers comprehensive error scenarios including:
 * - Invalid input validation
 * - Resource not found errors
 * - Authorization and permission errors
 * - Business logic validation
 * - Edge cases and boundary conditions
 * - Concurrent operation conflicts
 * - Database constraint violations
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

describe('Cart Error Handling and Edge Cases', () => {
  let testUser, adminUser, testCategory, testBrand, testProduct, testCart;

  beforeEach(async () => {
    // Clean up before each test
    await cleanupTestData();
    
    // Create test data
    testUser = await createTestUser();
    adminUser = await createTestAdmin();
    testCategory = await createTestCategory();
    testBrand = await createTestBrand();
    testProduct = await createTestProduct({ 
      category: testCategory, 
      brand: testBrand,
      regularPrice: 5000,
      stockQuantity: 100
    });
    
    testCart = await createTestCart({ 
      user: testUser, 
      product: testProduct,
      quantity: 2
    });
  });

  afterEach(async () => {
    // Clean up after each test
    await cleanupTestData();
  });

  describe('Input Validation Errors', () => {
    /**
     * Test invalid cart ID format
     */
    it('should reject invalid cart ID formats', async () => {
      const invalidCartIds = [
        'invalid-uuid',
        '123-456-789',
        'not-a-uuid-at-all',
        '',
        null,
        undefined,
        '550e8400-e29b-41d4-a716', // Too short
        '550e8400-e29b-41d4-a716-446655440000-0000' // Too long
      ];

      for (const cartId of invalidCartIds) {
        const response = await makeAuthenticatedRequest(
          app,
          'GET',
          `/api/v1/cart/${cartId}`,
          {},
          testUser.token
        );

        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty('error', 'Validation failed');
      }
    });

    /**
     * Test invalid product ID format
     */
    it('should reject invalid product ID formats', async () => {
      const invalidProductIds = [
        'invalid-product-id',
        '123-456',
        '',
        null,
        undefined,
        'not-a-uuid'
      ];

      for (const productId of invalidProductIds) {
        const response = await makeAuthenticatedRequest(
          app,
          'POST',
          `/api/v1/cart/${testCart.id}/items`,
          {
            productId: productId,
            quantity: 1
          },
          testUser.token
        );

        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty('error', 'Validation failed');
      }
    });

    /**
     * Test invalid quantity values
     */
    it('should reject invalid quantity values', async () => {
      const invalidQuantities = [
        0, // Zero quantity
        -1, // Negative quantity
        -5, // Large negative
        999999, // Unrealistically large
        'not-a-number', // String instead of number
        null, // Null quantity
        undefined, // Undefined quantity
        1.5, // Decimal quantity (should be integer)
        Number.MAX_SAFE_INTEGER // Maximum safe integer
      ];

      for (const quantity of invalidQuantities) {
        const response = await makeAuthenticatedRequest(
          app,
          'POST',
          `/api/v1/cart/${testCart.id}/items`,
          {
            productId: testProduct.id,
            quantity: quantity
          },
          testUser.token
        );

        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty('error', 'Validation failed');
      }
    });

    /**
     * Test invalid item ID format
     */
    it('should reject invalid item ID formats', async () => {
      const invalidItemIds = [
        'invalid-item-id',
        '123-456',
        '',
        null,
        undefined
      ];

      for (const itemId of invalidItemIds) {
        const response = await makeAuthenticatedRequest(
          app,
          'PUT',
          `/api/v1/cart/${testCart.id}/items/${itemId}`,
          { quantity: 2 },
          testUser.token
        );

        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty('error', 'Validation failed');
      }
    });

    /**
     * Test missing required fields
     */
    it('should reject requests with missing required fields', async () => {
      const missingFields = [
        { productId: testProduct.id }, // Missing quantity
        { quantity: 2 }, // Missing productId
        {}, // Missing both
        { productId: null, quantity: 2 }, // Null productId
        { productId: testProduct.id, quantity: null }, // Null quantity
        { productId: undefined, quantity: 2 }, // Undefined productId
        { productId: testProduct.id, quantity: undefined } // Undefined quantity
      ];

      for (const data of missingFields) {
        const response = await makeAuthenticatedRequest(
          app,
          'POST',
          `/api/v1/cart/${testCart.id}/items`,
          data,
          testUser.token
        );

        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty('error', 'Validation failed');
      }
    });

    /**
     * Test field length validation
     */
    it('should reject fields with invalid lengths', async () => {
      // Test extremely long field values
      const longString = 'a'.repeat(10000);
      
      const response = await makeAuthenticatedRequest(
        app,
        'POST',
        `/api/v1/cart/${testCart.id}/items`,
        {
          productId: testProduct.id,
          quantity: 1,
          notes: longString // If notes field exists
        },
        testUser.token
      );

      // Should either accept or reject based on field limits
      expect([201, 400]).toContain(response.status);
      
      if (response.status === 400) {
        expect(response.body).toHaveProperty('error', 'Validation failed');
      }
    });
  });

  describe('Resource Not Found Errors', () => {
    /**
     * Test non-existent cart retrieval
     */
    it('should return 404 for non-existent cart', async () => {
      const fakeCartId = '550e8400-e29b-41d4-a716-446655440000';
      
      const response = await makeAuthenticatedRequest(
        app,
        'GET',
        `/api/v1/cart/${fakeCartId}`,
        {},
        testUser.token
      );

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error', 'Cart not found');
    });

    /**
     * Test non-existent product addition
     */
    it('should return 404 for non-existent product', async () => {
      const fakeProductId = '550e8400-e29b-41d4-a716-446655440000';
      
      const response = await makeAuthenticatedRequest(
        app,
        'POST',
        `/api/v1/cart/${testCart.id}/items`,
        {
          productId: fakeProductId,
          quantity: 1
        },
        testUser.token
      );

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error', 'Product not found');
    });

    /**
     * Test non-existent cart item operations
     */
    it('should return 404 for non-existent cart item', async () => {
      const fakeItemId = '550e8400-e29b-41d4-a716-446655440000';
      
      // Test update
      const updateResponse = await makeAuthenticatedRequest(
        app,
        'PUT',
        `/api/v1/cart/${testCart.id}/items/${fakeItemId}`,
        { quantity: 2 },
        testUser.token
      );

      expect(updateResponse.status).toBe(404);
      expect(updateResponse.body).toHaveProperty('error', 'Cart item not found');

      // Test delete
      const deleteResponse = await makeAuthenticatedRequest(
        app,
        'DELETE',
        `/api/v1/cart/${testCart.id}/items/${fakeItemId}`,
        {},
        testUser.token
      );

      expect(deleteResponse.status).toBe(404);
      expect(deleteResponse.body).toHaveProperty('error', 'Cart item not found');
    });

    /**
     * Test operations on deleted cart
     */
    it('should handle operations on deleted cart', async () => {
      // Create and immediately delete cart
      const tempCart = await createTestCart({ user: testUser });
      await prisma.cart.delete({ where: { id: tempCart.id } });

      // Try to add item to deleted cart
      const response = await makeAuthenticatedRequest(
        app,
        'POST',
        `/api/v1/cart/${tempCart.id}/items`,
        {
          productId: testProduct.id,
          quantity: 1
        },
        testUser.token
      );

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error', 'Cart not found');
    });
  });

  describe('Authorization and Permission Errors', () => {
    /**
     * Test unauthorized access to user cart
     */
    it('should deny unauthorized access to user cart', async () => {
      const response = await request(app)
        .get(`/api/v1/cart/${testCart.id}`);

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error', 'Access token required');
    });

    /**
     * Test unauthorized item operations
     */
    it('should deny unauthorized item operations', async () => {
      // Test POST
      const postResponse = await request(app)
        .post(`/api/v1/cart/${testCart.id}/items`)
        .send({
          productId: testProduct.id,
          quantity: 1
        });

      expect(postResponse.status).toBe(401);
      expect(postResponse.body).toHaveProperty('error', 'Access token required');

      // Test PUT
      const putResponse = await request(app)
        .put(`/api/v1/cart/${testCart.id}/items/some-item-id`)
        .send({ quantity: 2 });

      expect(putResponse.status).toBe(401);
      expect(putResponse.body).toHaveProperty('error', 'Access token required');

      // Test DELETE
      const deleteResponse = await request(app)
        .delete(`/api/v1/cart/${testCart.id}/items/some-item-id`);

      expect(deleteResponse.status).toBe(401);
      expect(deleteResponse.body).toHaveProperty('error', 'Access token required');
    });

    /**
     * Test access to other user's cart
     */
    it('should prevent access to other user\'s cart', async () => {
      // Create another user and their cart
      const anotherUser = await createTestUser({ email: 'another@example.com' });
      const anotherCart = await createTestCart({ user: anotherUser });

      // Try to access another user's cart
      const response = await makeAuthenticatedRequest(
        app,
        'GET',
        `/api/v1/cart/${anotherCart.id}`,
        {},
        testUser.token
      );

      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('error', 'Access denied');
    });

    /**
     * Test modification of other user's cart items
     */
    it('should prevent modification of other user\'s cart items', async () => {
      // Create another user and their cart with items
      const anotherUser = await createTestUser({ email: 'another@example.com' });
      const anotherCart = await createTestCart({ user: anotherUser });
      
      const cartItem = await prisma.cartItem.create({
        data: {
          cartId: anotherCart.id,
          productId: testProduct.id,
          quantity: 2,
          unitPrice: parseFloat(testProduct.regularPrice),
          totalPrice: parseFloat(testProduct.regularPrice) * 2
        }
      });

      // Try to modify another user's cart item
      const response = await makeAuthenticatedRequest(
        app,
        'PUT',
        `/api/v1/cart/${anotherCart.id}/items/${cartItem.id}`,
        { quantity: 5 },
        testUser.token
      );

      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('error', 'Access denied');
    });

    /**
     * Test invalid/expired tokens
     */
    it('should reject invalid or expired tokens', async () => {
      const invalidTokens = [
        'invalid-token',
        'expired.jwt.token',
        'malformed.token',
        '',
        null,
        undefined
      ];

      for (const token of invalidTokens) {
        const response = await request(app)
          .get(`/api/v1/cart/${testCart.id}`)
          .set('Authorization', `Bearer ${token}`);

        expect([401, 403]).toContain(response.status);
      }
    });
  });

  describe('Business Logic Validation Errors', () => {
    /**
     * Test insufficient stock scenarios
     */
    it('should handle insufficient stock scenarios', async () => {
      // Create product with limited stock
      const limitedStockProduct = await createTestProduct({
        name: 'Limited Stock Product',
        stockQuantity: 5
      });

      // Try to add more than available stock
      const response = await makeAuthenticatedRequest(
        app,
        'POST',
        `/api/v1/cart/${testCart.id}/items`,
        {
          productId: limitedStockProduct.id,
          quantity: 10 // More than available
        },
        testUser.token
      );

      // Should either accept and handle later, or reject now
      expect([201, 400]).toContain(response.status);

      if (response.status === 400) {
        expect(response.body).toHaveProperty('error');
        // Should indicate insufficient stock
        expect(response.body.error).toContain('stock');
      }
    });

    /**
     * Test cart size limits
     */
    it('should enforce cart size limits', async () => {
      // Try to add many items to cart
      const promises = [];
      for (let i = 0; i < 200; i++) { // Try to add 200 items
        promises.push(
          makeAuthenticatedRequest(
            app,
            'POST',
            `/api/v1/cart/${testCart.id}/items`,
            {
              productId: testProduct.id,
              quantity: 1
            },
            testUser.token
          )
        );
      }

      const responses = await Promise.all(promises);
      
      // Some requests should fail if there's a cart limit
      const failedResponses = responses.filter(res => res.status !== 201);
      
      if (failedResponses.length > 0) {
        expect(failedResponses[0].status).toBe(400);
        expect(failedResponses[0].body).toHaveProperty('error');
        expect(failedResponses[0].body.error).toContain('limit');
      }
    });

    /**
     * Test price validation
     */
    it('should validate product prices', async () => {
      // Create product with zero price
      const zeroPriceProduct = await createTestProduct({
        name: 'Zero Price Product',
        regularPrice: 0,
        stockQuantity: 10
      });

      const response = await makeAuthenticatedRequest(
        app,
        'POST',
        `/api/v1/cart/${testCart.id}/items`,
        {
          productId: zeroPriceProduct.id,
          quantity: 1
        },
        testUser.token
      );

      // Should either accept zero price or reject it
      expect([201, 400]).toContain(response.status);

      if (response.status === 400) {
        expect(response.body).toHaveProperty('error');
        expect(response.body.error).toContain('price');
      }
    });

    /**
     * Test inactive product handling
     */
    it('should prevent adding inactive products to cart', async () => {
      // Create inactive product
      const inactiveProduct = await createTestProduct({
        name: 'Inactive Product',
        status: 'INACTIVE',
        stockQuantity: 10
      });

      const response = await makeAuthenticatedRequest(
        app,
        'POST',
        `/api/v1/cart/${testCart.id}/items`,
        {
          productId: inactiveProduct.id,
          quantity: 1
        },
        testUser.token
      );

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('inactive');
    });

    /**
     * Test discontinued product handling
     */
    it('should prevent adding discontinued products to cart', async () => {
      // Create discontinued product
      const discontinuedProduct = await createTestProduct({
        name: 'Discontinued Product',
        status: 'DISCONTINUED',
        stockQuantity: 10
      });

      const response = await makeAuthenticatedRequest(
        app,
        'POST',
        `/api/v1/cart/${testCart.id}/items`,
        {
          productId: discontinuedProduct.id,
          quantity: 1
        },
        testUser.token
      );

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('discontinued');
    });
  });

  describe('Edge Cases and Boundary Conditions', () => {
    /**
     * Test maximum quantity limits
     */
    it('should handle maximum quantity limits', async () => {
      const maxQuantities = [
        999, // High but reasonable
        1000, // Very high
        Number.MAX_SAFE_INTEGER, // Maximum safe integer
        Number.MAX_VALUE // Maximum number (will be unsafe)
      ];

      for (const quantity of maxQuantities) {
        const response = await makeAuthenticatedRequest(
          app,
          'POST',
          `/api/v1/cart/${testCart.id}/items`,
          {
            productId: testProduct.id,
            quantity: quantity
          },
          testUser.token
        );

        // Should either accept or reject based on business rules
        expect([201, 400]).toContain(response.status);
      }
    });

    /**
     * Test zero quantity handling
     */
    it('should handle zero quantity edge case', async () => {
      const response = await makeAuthenticatedRequest(
        app,
        'PUT',
        `/api/v1/cart/${testCart.id}/items/some-item-id`,
        { quantity: 0 },
        testUser.token
      );

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'Validation failed');
    });

    /**
     * Test decimal quantity handling
     */
    it('should handle decimal quantity edge case', async () => {
      const response = await makeAuthenticatedRequest(
        app,
        'POST',
        `/api/v1/cart/${testCart.id}/items`,
        {
          productId: testProduct.id,
          quantity: 1.5 // Decimal quantity
        },
        testUser.token
      );

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'Validation failed');
    });

    /**
     * Test very large cart totals
     */
    it('should handle very large cart totals', async () => {
      // Create expensive product
      const expensiveProduct = await createTestProduct({
        name: 'Very Expensive Product',
        regularPrice: 1000000, // 10 lakh BDT
        stockQuantity: 100
      });

      // Add maximum quantity
      const response = await makeAuthenticatedRequest(
        app,
        'POST',
        `/api/v1/cart/${testCart.id}/items`,
        {
          productId: expensiveProduct.id,
          quantity: 100 // Maximum quantity
        },
        testUser.token
      );

      // Should handle large numbers without overflow
      expect([201, 400]).toContain(response.status);

      if (response.status === 201) {
        const cartResponse = await makeAuthenticatedRequest(
          app,
          'GET',
          `/api/v1/cart/${testCart.id}`,
          {},
          testUser.token
        );

        expect(cartResponse.status).toBe(200);
        
        // Verify large number calculations
        const expectedSubtotal = 1000000 * 100; // 100 crore BDT
        expect(parseFloat(cartResponse.body.cart.subtotal)).toBeCloseTo(expectedSubtotal, 2);
        
        const expectedTax = expectedSubtotal * 0.15; // 15 crore BDT
        expect(parseFloat(cartResponse.body.cart.tax)).toBeCloseTo(expectedTax, 2);
      }
    });

    /**
     * Test concurrent operations on same item
     */
    it('should handle concurrent operations on same cart item', async () => {
      // Add item to cart
      const addResponse = await makeAuthenticatedRequest(
        app,
        'POST',
        `/api/v1/cart/${testCart.id}/items`,
        {
          productId: testProduct.id,
          quantity: 2
        },
        testUser.token
      );

      const itemId = addResponse.body.item.id;

      // Perform concurrent operations
      const concurrentOperations = [
        // Update quantity
        makeAuthenticatedRequest(
          app,
          'PUT',
          `/api/v1/cart/${testCart.id}/items/${itemId}`,
          { quantity: 5 },
          testUser.token
        ),
        // Update quantity again
        makeAuthenticatedRequest(
          app,
          'PUT',
          `/api/v1/cart/${testCart.id}/items/${itemId}`,
          { quantity: 3 },
          testUser.token
        ),
        // Delete item
        makeAuthenticatedRequest(
          app,
          'DELETE',
          `/api/v1/cart/${testCart.id}/items/${itemId}`,
          {},
          testUser.token
        )
      ];

      const responses = await Promise.all(concurrentOperations);

      // At least one operation should succeed
      const successfulOperations = responses.filter(res => 
        [200, 201].includes(res.status)
      );

      expect(successfulOperations.length).toBeGreaterThan(0);
    });

    /**
     * Test cart with mixed user and guest access
     */
    it('should handle mixed user and guest access patterns', async () => {
      // Create guest cart
      const guestCartResponse = await request(app)
        .post('/api/v1/cart')
        .send({ sessionId: 'guest-session-mixed' });

      const guestCartId = guestCartResponse.body.cart.id;

      // Add item as guest
      await request(app)
        .post(`/api/v1/cart/${guestCartId}/items`)
        .send({
          productId: testProduct.id,
          quantity: 1
        });

      // Try to access as user without proper conversion
      const response = await makeAuthenticatedRequest(
        app,
        'GET',
        `/api/v1/cart/${guestCartId}`,
        {},
        testUser.token
      );

      // Should either allow access or require proper conversion
      expect([200, 403, 404]).toContain(response.status);
    });
  });

  describe('Database Constraint Violations', () => {
    /**
     * Test foreign key constraint violations
     */
    it('should handle foreign key constraint violations', async () => {
      const fakeProductId = '550e8400-e29b-41d4-a716-446655440000';
      
      const response = await makeAuthenticatedRequest(
        app,
        'POST',
        `/api/v1/cart/${testCart.id}/items`,
        {
          productId: fakeProductId, // Non-existent product
          quantity: 1
        },
        testUser.token
      );

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error', 'Product not found');
    });

    /**
     * Test unique constraint violations
     */
    it('should handle unique constraint violations appropriately', async () => {
      // This would be tested by trying to create duplicate carts
      // But since we're using existing cart, this is more about item operations
      
      // Try to add item with duplicate constraints
      const response = await makeAuthenticatedRequest(
        app,
        'POST',
        `/api/v1/cart/${testCart.id}/items`,
        {
          productId: testProduct.id,
          quantity: 1,
          variantId: 'non-existent-variant-id'
        },
        testUser.token
      );

      // Should handle non-existent variant
      expect([404, 400]).toContain(response.status);
    });

    /**
     * Test data type constraint violations
     */
    it('should handle data type constraint violations', async () => {
      const invalidDataTypes = [
        { productId: testProduct.id, quantity: 'not-a-number' },
        { productId: 'not-a-uuid', quantity: 1 },
        { productId: testProduct.id, quantity: null },
        { productId: null, quantity: 1 }
      ];

      for (const data of invalidDataTypes) {
        const response = await makeAuthenticatedRequest(
          app,
          'POST',
          `/api/v1/cart/${testCart.id}/items`,
          data,
          testUser.token
        );

        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty('error', 'Validation failed');
      }
    });
  });

  describe('Rate Limiting and Security', () => {
    /**
     * Test rate limiting on cart operations
     */
    it('should implement rate limiting on cart operations', async () => {
      // Make many rapid requests
      const promises = [];
      for (let i = 0; i < 50; i++) {
        promises.push(
          makeAuthenticatedRequest(
            app,
            'POST',
            `/api/v1/cart/${testCart.id}/items`,
            {
              productId: testProduct.id,
              quantity: 1
            },
            testUser.token
          )
        );
      }

      const responses = await Promise.all(promises);
      
      // At least some requests should be rate limited
      const rateLimitedResponses = responses.filter(res => res.status === 429);
      
      expect(rateLimitedResponses.length).toBeGreaterThan(0);
      rateLimitedResponses.forEach(response => {
        expect(response.body).toHaveProperty('error', 'Too many requests');
      });
    });

    /**
     * Test SQL injection protection
     */
    it('should protect against SQL injection in cart operations', async () => {
      const maliciousPayloads = [
        "'; DROP TABLE cart_items; --",
        "' OR '1'='1",
        "1'; UPDATE carts SET userId='attacker'; --",
        "'; INSERT INTO cart_items VALUES ('malicious'); --"
      ];

      for (const payload of maliciousPayloads) {
        const response = await makeAuthenticatedRequest(
          app,
          'POST',
          `/api/v1/cart/${testCart.id}/items`,
          {
            productId: payload,
            quantity: 1
          },
          testUser.token
        );

        // Should reject malicious input
        expect([400, 422]).toContain(response.status);
      }
    });

    /**
     * Test XSS protection
     */
    it('should protect against XSS in cart operations', async () => {
      const xssPayloads = [
        '<script>alert("xss")</script>',
        'javascript:alert("xss")',
        '<img src="x" onerror="alert(1)">',
        '"><script>alert("xss")</script>',
        '\"><script>alert("xss")</script>'
      ];

      for (const payload of xssPayloads) {
        const response = await makeAuthenticatedRequest(
          app,
          'POST',
          `/api/v1/cart/${testCart.id}/items`,
          {
            productId: testProduct.id,
            quantity: 1,
            notes: payload // If notes field exists
          },
          testUser.token
        );

        // Should sanitize or reject XSS
        expect([201, 400]).toContain(response.status);

        if (response.status === 201) {
          // If accepted, payload should be sanitized
          expect(response.body.item.notes).not.toContain('<script>');
          expect(response.body.item.notes).not.toContain('javascript:');
        }
      }
    });
  });
});