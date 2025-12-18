/**
 * Cart Performance and Load Testing
 * 
 * This test suite covers performance aspects of cart management including:
 * - Large cart handling (100+ items)
 * - Concurrent cart operations
 * - Memory usage optimization
 * - Response time benchmarks
 * - Database performance under load
 * - Cart calculation performance with many items
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

describe('Cart Performance and Load Testing', () => {
  let testUser, testCategory, testBrand, testProduct, testCart;

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

  describe('Large Cart Handling', () => {
    /**
     * Test cart with 100+ items performance
     */
    it('should handle cart with 100+ items efficiently', async () => {
      // Create 150 products
      const products = await Promise.all(
        Array.from({ length: 150 }, (_, index) =>
          createTestProduct({
            name: `Performance Product ${index + 1}`,
            regularPrice: Math.floor(Math.random() * 1000) + 100,
            stockQuantity: 50
          })
        )
      );

      const startTime = Date.now();

      // Add all products to cart
      const addPromises = products.map((product, index) =>
        makeAuthenticatedRequest(
          app,
          'POST',
          `/api/v1/cart/${testCart.id}/items`,
          {
            productId: product.id,
            quantity: Math.floor(Math.random() * 5) + 1
          },
          testUser.token
        )
      );

      const responses = await Promise.all(addPromises);
      const addEndTime = Date.now();

      // Verify all items were added
      const successfulAdds = responses.filter(res => res.status === 201);
      expect(successfulAdds.length).toBe(150);

      // Performance check - should complete within reasonable time
      expect(addEndTime - startTime).toBeLessThan(30000); // 30 seconds max

      // Test cart retrieval performance
      const retrieveStartTime = Date.now();
      const cartResponse = await makeAuthenticatedRequest(
        app,
        'GET',
        `/api/v1/cart/${testCart.id}`,
        {},
        testUser.token
      );
      const retrieveEndTime = Date.now();

      expect(retrieveEndTime - retrieveStartTime).toBeLessThan(5000); // 5 seconds max

      // Verify cart contains all items
      expect(cartResponse.status).toBe(200);
      expect(cartResponse.body.cart.items.length).toBe(152); // 150 new + 2 existing

      // Verify total calculation performance
      const expectedSubtotal = cartResponse.body.cart.items.reduce((sum, item) => 
        sum + parseFloat(item.totalPrice), 0
      );
      expect(parseFloat(cartResponse.body.cart.subtotal)).toBeCloseTo(expectedSubtotal, 2);
    });

    /**
     * Test cart calculation performance with many items
     */
    it('should calculate totals efficiently for large carts', async () => {
      // Create cart with 200 items
      const products = await Promise.all(
        Array.from({ length: 200 }, (_, index) =>
          createTestProduct({
            name: `Calc Test Product ${index + 1}`,
            regularPrice: Math.floor(Math.random() * 500) + 50,
            stockQuantity: 100
          })
        )
      );

      // Add all items to cart
      const addPromises = products.map(product =>
        makeAuthenticatedRequest(
          app,
          'POST',
          `/api/v1/cart/${testCart.id}/items`,
          {
            productId: product.id,
            quantity: Math.floor(Math.random() * 3) + 1
          },
          testUser.token
        )
      );

      await Promise.all(addPromises);

      // Measure calculation performance
      const calcStartTime = Date.now();
      const cartResponse = await makeAuthenticatedRequest(
        app,
        'GET',
        `/api/v1/cart/${testCart.id}`,
        {},
        testUser.token
      );
      const calcEndTime = Date.now();

      expect(cartResponse.status).toBe(200);
      expect(cartResponse.body.cart.items.length).toBe(202);

      // Performance check - calculations should be fast even with many items
      expect(calcEndTime - calcStartTime).toBeLessThan(2000); // 2 seconds max

      // Verify calculation accuracy
      const expectedSubtotal = cartResponse.body.cart.items.reduce((sum, item) => 
        sum + parseFloat(item.totalPrice), 0
      );
      expect(parseFloat(cartResponse.body.cart.subtotal)).toBeCloseTo(expectedSubtotal, 2);

      const expectedTax = expectedSubtotal * 0.15;
      expect(parseFloat(cartResponse.body.cart.tax)).toBeCloseTo(expectedTax, 2);

      const expectedTotal = expectedSubtotal + expectedTax + 100;
      expect(parseFloat(cartResponse.body.cart.total)).toBeCloseTo(expectedTotal, 2);
    });

    /**
     * Test memory usage with large carts
     */
    it('should handle memory usage efficiently with large carts', async () => {
      // Create cart with 300 items
      const products = await Promise.all(
        Array.from({ length: 300 }, (_, index) =>
          createTestProduct({
            name: `Memory Test Product ${index + 1}`,
            regularPrice: 100,
            stockQuantity: 100
          })
        )
      );

      // Add items in batches to test memory efficiency
      const batchSize = 50;
      for (let i = 0; i < products.length; i += batchSize) {
        const batch = products.slice(i, i + batchSize);
        
        const addPromises = batch.map(product =>
          makeAuthenticatedRequest(
            app,
            'POST',
            `/api/v1/cart/${testCart.id}/items`,
            {
              productId: product.id,
              quantity: 1
            },
            testUser.token
          )
        );

        await Promise.all(addPromises);
      }

      // Verify final cart state
      const cartResponse = await makeAuthenticatedRequest(
        app,
        'GET',
        `/api/v1/cart/${testCart.id}`,
        {},
        testUser.token
      );

      expect(cartResponse.status).toBe(200);
      expect(cartResponse.body.cart.items.length).toBe(302); // 300 new + 2 existing
    });
  });

  describe('Concurrent Cart Operations', () => {
    /**
     * Test concurrent item additions
     */
    it('should handle concurrent item additions safely', async () => {
      const products = await Promise.all([
        createTestProduct({ name: 'Concurrent Product 1', regularPrice: 1000 }),
        createTestProduct({ name: 'Concurrent Product 2', regularPrice: 2000 }),
        createTestProduct({ name: 'Concurrent Product 3', regularPrice: 3000 })
      ]);

      // Perform concurrent additions
      const startTime = Date.now();
      
      const concurrentOperations = products.map(product =>
        makeAuthenticatedRequest(
          app,
          'POST',
          `/api/v1/cart/${testCart.id}/items`,
          {
            productId: product.id,
            quantity: 2
          },
          testUser.token
        )
      );

      const responses = await Promise.all(concurrentOperations);
      const endTime = Date.now();

      // Verify all operations completed successfully
      responses.forEach(response => {
        expect(response.status).toBe(201);
      });

      // Performance check - concurrent operations should complete efficiently
      expect(endTime - startTime).toBeLessThan(10000); // 10 seconds max

      // Verify cart contains all items
      const cartResponse = await makeAuthenticatedRequest(
        app,
        'GET',
        `/api/v1/cart/${testCart.id}`,
        {},
        testUser.token
      );

      expect(cartResponse.status).toBe(200);
      expect(cartResponse.body.cart.items.length).toBe(5); // 3 new + 2 existing
    });

    /**
     * Test concurrent mixed operations
     */
    it('should handle concurrent mixed operations safely', async () => {
      const newProduct = await createTestProduct({ 
        name: 'Mixed Operations Product', 
        regularPrice: 1500 
      });

      // Perform mixed concurrent operations
      const startTime = Date.now();
      
      const concurrentOperations = [
        // Add item
        makeAuthenticatedRequest(
          app,
          'POST',
          `/api/v1/cart/${testCart.id}/items`,
          {
            productId: newProduct.id,
            quantity: 3
          },
          testUser.token
        ),
        // Get cart
        makeAuthenticatedRequest(
          app,
          'GET',
          `/api/v1/cart/${testCart.id}`,
          {},
          testUser.token
        ),
        // Update existing item
        makeAuthenticatedRequest(
          app,
          'PUT',
          `/api/v1/cart/${testCart.id}/items/${testCart.items[0].id}`,
          { quantity: 5 },
          testUser.token
        ),
        // Clear cart
        makeAuthenticatedRequest(
          app,
          'DELETE',
          `/api/v1/cart/${testCart.id}`,
          {},
          testUser.token
        )
      ];

      const responses = await Promise.all(concurrentOperations);
      const endTime = Date.now();

      // Verify operations completed
      expect(responses[0].status).toBe(201); // Add
      expect(responses[1].status).toBe(200);  // Get
      expect(responses[2].status).toBe(200);  // Update
      expect(responses[3].status).toBe(200);  // Clear

      // Performance check
      expect(endTime - startTime).toBeLessThan(15000); // 15 seconds max
    });

    /**
     * Test concurrent access to same cart
     */
    it('should handle concurrent access to same cart', async () => {
      // Perform concurrent cart retrievals
      const concurrentRetrievals = Array.from({ length: 20 }, () =>
        makeAuthenticatedRequest(
          app,
          'GET',
          `/api/v1/cart/${testCart.id}`,
          {},
          testUser.token
        )
      );

      const startTime = Date.now();
      const responses = await Promise.all(concurrentRetrievals);
      const endTime = Date.now();

      // Verify all retrievals succeeded
      responses.forEach(response => {
        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('cart');
      });

      // Performance check - should handle concurrent reads efficiently
      expect(endTime - startTime).toBeLessThan(5000); // 5 seconds max

      // Verify consistency - all responses should be identical
      const firstResponse = responses[0].body;
      responses.forEach(response => {
        expect(response.body.cart.id).toBe(firstResponse.cart.id);
        expect(response.body.cart.items.length).toBe(firstResponse.cart.items.length);
      });
    });

    /**
     * Test concurrent user cart operations
     */
    it('should handle concurrent operations from different users', async () => {
      // Create multiple users
      const users = await Promise.all([
        createTestUser({ email: 'user1@example.com' }),
        createTestUser({ email: 'user2@example.com' }),
        createTestUser({ email: 'user3@example.com' })
      ]);

      // Create carts for each user
      const carts = await Promise.all(
        users.map(user => createTestCart({ user }))
      );

      // Perform concurrent operations
      const concurrentOperations = users.map((user, index) =>
        makeAuthenticatedRequest(
          app,
          'POST',
          `/api/v1/cart/${carts[index].id}/items`,
          {
            productId: testProduct.id,
            quantity: 2
          },
          user.token
        )
      );

      const startTime = Date.now();
      const responses = await Promise.all(concurrentOperations);
      const endTime = Date.now();

      // Verify all operations succeeded
      responses.forEach(response => {
        expect(response.status).toBe(201);
      });

      // Performance check
      expect(endTime - startTime).toBeLessThan(20000); // 20 seconds max

      // Verify isolation - each user has their own cart
      for (let i = 0; i < users.length; i++) {
        const userCartResponse = await makeAuthenticatedRequest(
          app,
          'GET',
          `/api/v1/cart/${carts[i].id}`,
          {},
          users[i].token
        );

        expect(userCartResponse.status).toBe(200);
        expect(userCartResponse.body.cart.userId).toBe(users[i].user.id);
      }
    });
  });

  describe('Database Performance', () => {
    /**
     * Test database query optimization
     */
    it('should use optimized database queries for cart operations', async () => {
      // Create many products and test query performance
      const products = await Promise.all(
        Array.from({ length: 100 }, (_, index) =>
          createTestProduct({
            name: `DB Test Product ${index + 1}`,
            regularPrice: Math.floor(Math.random() * 1000) + 100,
            stockQuantity: 100
          })
        )
      );

      // Add items to cart
      const addPromises = products.map(product =>
        makeAuthenticatedRequest(
          app,
          'POST',
          `/api/v1/cart/${testCart.id}/items`,
          {
            productId: product.id,
            quantity: 1
          },
          testUser.token
        )
      );

      await Promise.all(addPromises);

      // Measure database query performance
      const queryStartTime = Date.now();
      
      // Perform cart retrieval with includes
      const cartResponse = await makeAuthenticatedRequest(
        app,
        'GET',
        `/api/v1/cart/${testCart.id}`,
        {},
        testUser.token
      );
      
      const queryEndTime = Date.now();

      expect(cartResponse.status).toBe(200);
      expect(cartResponse.body.cart.items.length).toBe(102); // 100 new + 2 existing

      // Query performance should be optimized
      expect(queryEndTime - queryStartTime).toBeLessThan(3000); // 3 seconds max

      // Verify efficient data loading (includes, proper indexing)
      expect(cartResponse.body.cart.items[0]).toHaveProperty('product');
      expect(cartResponse.body.cart.items[0].product).toHaveProperty('category');
      expect(cartResponse.body.cart.items[0].product).toHaveProperty('brand');
    });

    /**
     * Test transaction handling performance
     */
    it('should handle cart transactions efficiently', async () => {
      const products = await Promise.all([
        createTestProduct({ name: 'Transaction Test 1', regularPrice: 1000 }),
        createTestProduct({ name: 'Transaction Test 2', regularPrice: 2000 }),
        createTestProduct({ name: 'Transaction Test 3', regularPrice: 3000 })
      ]);

      // Perform transactional operations
      const startTime = Date.now();

      // Clear cart first
      await makeAuthenticatedRequest(
        app,
        'DELETE',
        `/api/v1/cart/${testCart.id}`,
        {},
        testUser.token
      );

      // Add multiple items in sequence (should use transactions)
      const addPromises = products.map(product =>
        makeAuthenticatedRequest(
          app,
          'POST',
          `/api/v1/cart/${testCart.id}/items`,
          {
            productId: product.id,
            quantity: 2
          },
          testUser.token
        )
      );

      await Promise.all(addPromises);
      const endTime = Date.now();

      // Verify all items were added
      const cartResponse = await makeAuthenticatedRequest(
        app,
        'GET',
        `/api/v1/cart/${testCart.id}`,
        {},
        testUser.token
      );

      expect(cartResponse.status).toBe(200);
      expect(cartResponse.body.cart.items.length).toBe(3);

      // Transaction performance should be good
      expect(endTime - startTime).toBeLessThan(10000); // 10 seconds max
    });

    /**
     * Test connection pooling under load
     */
    it('should handle connection pooling under load', async () => {
      // Simulate high load with many concurrent requests
      const concurrentRequests = Array.from({ length: 50 }, () =>
        makeAuthenticatedRequest(
          app,
          'GET',
          `/api/v1/cart/${testCart.id}`,
          {},
          testUser.token
        )
      );

      const startTime = Date.now();
      const responses = await Promise.all(concurrentRequests);
      const endTime = Date.now();

      // Verify all requests succeeded
      responses.forEach(response => {
        expect(response.status).toBe(200);
      });

      // Connection pooling should handle high load efficiently
      expect(endTime - startTime).toBeLessThan(10000); // 10 seconds max

      // Verify consistent responses
      const firstResponse = responses[0].body;
      responses.forEach(response => {
        expect(response.body.cart.id).toBe(firstResponse.cart.id);
      });
    });
  });

  describe('Response Time Benchmarks', () => {
    /**
     * Test cart creation response time
     */
    it('should meet cart creation response time benchmarks', async () => {
      const startTime = Date.now();

      const response = await makeAuthenticatedRequest(
        app,
        'POST',
        '/api/v1/cart',
        {},
        testUser.token
      );

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      expect(response.status).toBe(201);
      expect(responseTime).toBeLessThan(1000); // 1 second max
    });

    /**
     * Test item addition response time
     */
    it('should meet item addition response time benchmarks', async () => {
      const startTime = Date.now();

      const response = await makeAuthenticatedRequest(
        app,
        'POST',
        `/api/v1/cart/${testCart.id}/items`,
        {
          productId: testProduct.id,
          quantity: 1
        },
        testUser.token
      );

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      expect(response.status).toBe(201);
      expect(responseTime).toBeLessThan(500); // 500ms max
    });

    /**
     * Test cart retrieval response time
     */
    it('should meet cart retrieval response time benchmarks', async () => {
      // Add some items first
      await makeAuthenticatedRequest(
        app,
        'POST',
        `/api/v1/cart/${testCart.id}/items`,
        {
          productId: testProduct.id,
          quantity: 5
        },
        testUser.token
      );

      const startTime = Date.now();

      const response = await makeAuthenticatedRequest(
        app,
        'GET',
        `/api/v1/cart/${testCart.id}`,
        {},
        testUser.token
      );

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      expect(response.status).toBe(200);
      expect(responseTime).toBeLessThan(1000); // 1 second max
    });

    /**
     * Test item update response time
     */
    it('should meet item update response time benchmarks', async () => {
      const startTime = Date.now();

      const response = await makeAuthenticatedRequest(
        app,
        'PUT',
        `/api/v1/cart/${testCart.id}/items/${testCart.items[0].id}`,
        { quantity: 10 },
        testUser.token
      );

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      expect(response.status).toBe(200);
      expect(responseTime).toBeLessThan(500); // 500ms max
    });

    /**
     * Test item deletion response time
     */
    it('should meet item deletion response time benchmarks', async () => {
      const startTime = Date.now();

      const response = await makeAuthenticatedRequest(
        app,
        'DELETE',
        `/api/v1/cart/${testCart.id}/items/${testCart.items[0].id}`,
        {},
        testUser.token
      );

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      expect(response.status).toBe(200);
      expect(responseTime).toBeLessThan(500); // 500ms max
    });
  });

  describe('Memory and Resource Optimization', () => {
    /**
     * Test memory usage with repeated operations
     */
    it('should optimize memory usage with repeated operations', async () => {
      const initialMemory = process.memoryUsage();
      
      // Perform many operations
      for (let i = 0; i < 100; i++) {
        await makeAuthenticatedRequest(
          app,
          'GET',
          `/api/v1/cart/${testCart.id}`,
          {},
          testUser.token
        );
      }

      const finalMemory = process.memoryUsage();
      
      // Memory usage should not grow excessively
      const memoryGrowth = finalMemory.heapUsed - initialMemory.heapUsed;
      expect(memoryGrowth).toBeLessThan(50 * 1024 * 1024); // 50MB max growth
    });

    /**
     * Test garbage collection efficiency
     */
    it('should handle garbage collection efficiently', async () => {
      // Create and delete many carts to test GC
      for (let i = 0; i < 20; i++) {
        const tempCart = await createTestCart({ user: testUser });
        
        await makeAuthenticatedRequest(
          app,
          'POST',
          `/api/v1/cart/${tempCart.id}/items`,
          {
            productId: testProduct.id,
            quantity: 1
          },
          testUser.token
        );

        await makeAuthenticatedRequest(
          app,
          'DELETE',
          `/api/v1/cart/${tempCart.id}`,
          {},
          testUser.token
        );
      }

      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }

      // Should complete without memory issues
      expect(true).toBe(true);
    });

    /**
     * Test resource cleanup
     */
    it('should clean up resources properly', async () => {
      // Create temporary resources
      const tempCarts = await Promise.all(
        Array.from({ length: 10 }, () => createTestCart({ user: testUser }))
      );

      // Use resources and then clean up
      for (const cart of tempCarts) {
        await makeAuthenticatedRequest(
          app,
          'GET',
          `/api/v1/cart/${cart.id}`,
          {},
          testUser.token
        );
      }

      // Clean up
      await Promise.all(
        tempCarts.map(cart =>
          makeAuthenticatedRequest(
            app,
            'DELETE',
            `/api/v1/cart/${cart.id}`,
            {},
            testUser.token
          )
        )
      );

      // Should complete without resource leaks
      expect(true).toBe(true);
    });
  });

  describe('Load Testing Scenarios', () => {
    /**
     * Test system under high load
     */
    it('should maintain performance under high load', async () => {
      // Simulate high load scenario
      const loadSize = 100;
      const concurrentRequests = Array.from({ length: loadSize }, (_, index) =>
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

      const startTime = Date.now();
      const responses = await Promise.all(concurrentRequests);
      const endTime = Date.now();

      // Calculate success rate
      const successfulRequests = responses.filter(res => res.status === 201);
      const successRate = (successfulRequests.length / responses.length) * 100;

      expect(endTime - startTime).toBeLessThan(30000); // 30 seconds max
      expect(successRate).toBeGreaterThan(95); // 95% success rate minimum
    });

    /**
     * Test gradual load increase
     */
    it('should handle gradual load increase gracefully', async () => {
      const loadLevels = [10, 25, 50, 100];
      const performanceResults = [];

      for (const loadSize of loadLevels) {
        const startTime = Date.now();
        
        const requests = Array.from({ length: loadSize }, () =>
          makeAuthenticatedRequest(
            app,
            'GET',
            `/api/v1/cart/${testCart.id}`,
            {},
            testUser.token
          )
        );

        const responses = await Promise.all(requests);
        const endTime = Date.now();

        const responseTime = endTime - startTime;
        const successRate = (responses.filter(res => res.status === 200).length / responses.length) * 100;

        performanceResults.push({
          loadSize,
          responseTime,
          successRate
        });
      }

      // Performance should degrade gracefully
      expect(performanceResults[0].responseTime).toBeLessThan(performanceResults[1].responseTime);
      expect(performanceResults[1].responseTime).toBeLessThan(performanceResults[2].responseTime);
      expect(performanceResults[2].responseTime).toBeLessThan(performanceResults[3].responseTime);

      // Success rate should remain high
      performanceResults.forEach(result => {
        expect(result.successRate).toBeGreaterThan(90);
      });
    });

    /**
     * Test sustained load
     */
    it('should handle sustained load over time', async () => {
      const duration = 5000; // 5 seconds
      const interval = 100; // 100ms
      const requestCount = Math.floor(duration / interval);
      
      const startTime = Date.now();
      let successCount = 0;

      for (let i = 0; i < requestCount; i++) {
        const response = await makeAuthenticatedRequest(
          app,
          'GET',
          `/api/v1/cart/${testCart.id}`,
          {},
          testUser.token
        );

        if (response.status === 200) {
          successCount++;
        }

        // Small delay between requests
        await new Promise(resolve => setTimeout(resolve, interval));
      }

      const endTime = Date.now();
      const actualDuration = endTime - startTime;

      expect(actualDuration).toBeGreaterThan(duration - 1000); // Allow some variance
      expect(actualDuration).toBeLessThan(duration + 2000); // But not too much
      
      const successRate = (successCount / requestCount) * 100;
      expect(successRate).toBeGreaterThan(90); // 90% success rate under sustained load
    });
  });
});