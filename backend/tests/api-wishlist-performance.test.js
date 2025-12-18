/**
 * Wishlist Performance Testing Suite
 * 
 * This test suite covers performance aspects of wishlist operations including:
 * - Large wishlist handling (1000+ items)
 * - Concurrent wishlist operations
 * - Notification system performance
 * - Sharing link generation and access
 * - Database query optimization
 * - Memory usage and response times
 * - Load testing scenarios
 * - Cache performance testing
 */

const request = require('supertest');
const { PrismaClient } = require('@prisma/client');
const { 
  generateTestToken, 
  createTestUser, 
  createTestProduct,
  createTestCategory,
  createTestBrand,
  cleanupTestData,
  makeAuthenticatedRequest,
  validateResponseStructure
} = require('./api-test-utils');
const {
  createBangladeshWishlistProducts,
  createBangladeshWishlistUser,
  createFestivalWishlist,
  BANGLADESH_WISHLIST_PRODUCTS
} = require('./bangladesh-wishlist-fixtures.test');

const app = require('../index');
const prisma = new PrismaClient();

// Performance monitoring utilities
const measureResponseTime = async (operation) => {
  const start = process.hrtime.bigint();
  const result = await operation();
  const end = process.hrtime.bigint();
  const responseTime = Number(end - start) / 1000000; // Convert to milliseconds
  return { result, responseTime };
};

const measureMemoryUsage = () => {
  const usage = process.memoryUsage();
  return {
    rss: Math.round(usage.rss / 1024 / 1024), // MB
    heapUsed: Math.round(usage.heapUsed / 1024 / 1024), // MB
    heapTotal: Math.round(usage.heapTotal / 1024 / 1024), // MB
    external: Math.round(usage.external / 1024 / 1024) // MB
  };
};

describe('Wishlist Performance Testing', () => {
  let testUser, testToken, testCategory, testBrand;
  let performanceWishlistId, largeWishlistId;
  let products = [];

  /**
   * Test setup - Create performance test data
   */
  beforeAll(async () => {
    // Create test user
    const userResult = await createTestUser({
      email: 'performance.test@example.com',
      firstName: 'Performance',
      lastName: 'Test'
    });
    testUser = userResult.user;
    testToken = userResult.token;

    // Create test category and brand
    testCategory = await createTestCategory({
      name: 'Performance Test Electronics',
      slug: 'performance-test-electronics'
    });
    testBrand = await createTestBrand({
      name: 'Performance Test Brand',
      slug: 'performance-test-brand'
    });

    // Create many products for testing
    for (let i = 0; i < 1500; i++) {
      products.push(await createTestProduct({
        name: `Performance Product ${i}`,
        categoryId: testCategory.id,
        brandId: testBrand.id,
        regularPrice: 1000 + (i * 10),
        salePrice: i % 3 === 0 ? 900 + (i * 8) : null,
        stockQuantity: 100 - (i % 50)
      }));
    }
  });

  /**
   * Test cleanup - Remove test data after all tests
   */
  afterAll(async () => {
    await cleanupTestData(['wishlist', 'wishlistItem', 'product', 'category', 'brand', 'user']);
  });

  /**
   * Test large wishlist handling
   */
  describe('Large Wishlist Handling', () => {
    it('should handle creating wishlist with 1000+ items efficiently', async () => {
      const { result, responseTime } = await measureResponseTime(async () => {
        return await makeAuthenticatedRequest(
          app, 
          'post', 
          '/api/v1/wishlist', 
          { name: 'Large Performance Wishlist' }, 
          testToken
        );
      });

      expect(result.status).toBe(201);
      expect(responseTime).toBeLessThan(1000); // Should create within 1 second
      
      largeWishlistId = result.body.wishlist.id;
    });

    it('should handle adding 1000 items to wishlist efficiently', async () => {
      const batchSize = 50;
      const batches = Math.ceil(1000 / batchSize);
      const totalTimes = [];

      for (let i = 0; i < batches; i++) {
        const batch = products.slice(i * batchSize, (i + 1) * batchSize);
        const batchPromises = batch.map(product =>
          makeAuthenticatedRequest(
            app, 
            'post', 
            `/api/v1/wishlist/${largeWishlistId}/items`, 
            { productId: product.id }, 
            testToken
          )
        );

        const { responseTime } = await measureResponseTime(async () => {
          return await Promise.all(batchPromises);
        });
        
        totalTimes.push(responseTime);
        
        // Allow some time between batches to prevent overwhelming
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      const averageBatchTime = totalTimes.reduce((a, b) => a + b, 0) / totalTimes.length;
      expect(averageBatchTime).toBeLessThan(5000); // Average batch should be under 5 seconds
      
      // Verify final count
      const { result: finalResult } = await measureResponseTime(async () => {
        return await makeAuthenticatedRequest(
          app, 
          'get', 
          `/api/v1/wishlist/${largeWishlistId}`, 
          {}, 
          testToken
        );
      });
      
      expect(finalResult.status).toBe(200);
      expect(finalResult.body.wishlist.items.length).toBeGreaterThanOrEqual(950); // Allow for some failures
    });

    it('should handle retrieving large wishlist efficiently', async () => {
      const { result, responseTime } = await measureResponseTime(async () => {
        return await makeAuthenticatedRequest(
          app, 
          'get', 
          `/api/v1/wishlist/${largeWishlistId}`, 
          { 
            includeItems: true,
            pageSize: 100,
            page: 1
          }, 
          testToken
        );
      });

      expect(result.status).toBe(200);
      expect(responseTime).toBeLessThan(3000); // Should retrieve within 3 seconds
      expect(result.body.wishlist.items.length).toBeGreaterThan(0);
      
      // Test pagination performance
      const { result: paginatedResult, responseTime: paginatedTime } = await measureResponseTime(async () => {
        return await makeAuthenticatedRequest(
          app, 
          'get', 
          `/api/v1/wishlist/${largeWishlistId}`, 
          { 
            includeItems: true,
            pageSize: 50,
            page: 5
          }, 
          testToken
        );
      });

      expect(paginatedResult.status).toBe(200);
      expect(paginatedTime).toBeLessThan(2000); // Paginated should be faster
    });

    it('should handle memory usage efficiently with large wishlists', async () => {
      const initialMemory = measureMemoryUsage();
      
      // Retrieve large wishlist multiple times
      for (let i = 0; i < 10; i++) {
        await makeAuthenticatedRequest(
          app, 
          'get', 
          `/api/v1/wishlist/${largeWishlistId}`, 
          { pageSize: 100 }, 
          testToken
        );
      }
      
      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }
      
      const finalMemory = measureMemoryUsage();
      const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed;
      
      // Memory increase should be reasonable (less than 100MB)
      expect(memoryIncrease).toBeLessThan(100);
    });
  });

  /**
   * Test concurrent wishlist operations
   */
  describe('Concurrent Wishlist Operations', () => {
    it('should handle concurrent wishlist creation efficiently', async () => {
      const concurrentRequests = 50;
      const promises = [];

      for (let i = 0; i < concurrentRequests; i++) {
        promises.push(
          makeAuthenticatedRequest(
            app, 
            'post', 
            '/api/v1/wishlist', 
            { name: `Concurrent Wishlist ${i}` }, 
            testToken
          )
        );
      }

      const { result, responseTime } = await measureResponseTime(async () => {
        return await Promise.allSettled(promises);
      });

      const successful = result.filter(r => r.status === 'fulfilled' && r.value.status === 201);
      const failed = result.filter(r => r.status === 'rejected' || r.value.status >= 400);

      expect(successful.length).toBeGreaterThan(concurrentRequests * 0.8); // At least 80% success
      expect(responseTime).toBeLessThan(30000); // Should complete within 30 seconds
    });

    it('should handle concurrent item additions efficiently', async () => {
      // Create multiple wishlists for concurrent testing
      const wishlistPromises = [];
      for (let i = 0; i < 10; i++) {
        wishlistPromises.push(
          makeAuthenticatedRequest(
            app, 
            'post', 
            '/api/v1/wishlist', 
            { name: `Concurrent Test Wishlist ${i}` }, 
            testToken
          )
        );
      }
      
      const wishlistResults = await Promise.all(wishlistPromises);
      const wishlistIds = wishlistResults.map(r => r.body.wishlist.id);

      // Add items concurrently to all wishlists
      const itemPromises = [];
      for (let i = 0; i < wishlistIds.length; i++) {
        for (let j = 0; j < 20; j++) {
          itemPromises.push(
            makeAuthenticatedRequest(
              app, 
              'post', 
              `/api/v1/wishlist/${wishlistIds[i]}/items`, 
              { productId: products[i * 20 + j].id }, 
              testToken
            )
          );
        }
      }

      const { result, responseTime } = await measureResponseTime(async () => {
        return await Promise.allSettled(itemPromises);
      });

      const successfulItems = result.filter(r => r.status === 'fulfilled' && r.value.status === 201);
      expect(successfulItems.length).toBeGreaterThan(itemPromises.length * 0.7); // At least 70% success
      expect(responseTime).toBeLessThan(45000); // Should complete within 45 seconds
    });

    it('should handle concurrent wishlist retrievals efficiently', async () => {
      const concurrentRetrievals = 100;
      const promises = [];

      for (let i = 0; i < concurrentRetrievals; i++) {
        promises.push(
          makeAuthenticatedRequest(
            app, 
            'get', 
            `/api/v1/wishlist/${largeWishlistId}`, 
            { pageSize: 20 }, 
            testToken
          )
        );
      }

      const { result, responseTime } = await measureResponseTime(async () => {
        return await Promise.allSettled(promises);
      });

      const successful = result.filter(r => r.status === 'fulfilled' && r.value.status === 200);
      expect(successful.length).toBeGreaterThan(concurrentRetrievals * 0.9); // At least 90% success
      expect(responseTime).toBeLessThan(60000); // Should complete within 60 seconds
    });
  });

  /**
   * Test notification system performance
   */
  describe('Notification System Performance', () => {
    let notificationWishlistId;

    beforeEach(async () => {
      const wishlistResponse = await makeAuthenticatedRequest(
        app, 
        'post', 
        '/api/v1/wishlist', 
        { name: 'Notification Performance Test' }, 
        testToken
      );
      notificationWishlistId = wishlistResponse.body.wishlist.id;

      // Add some items
      for (let i = 0; i < 50; i++) {
        await makeAuthenticatedRequest(
          app, 
          'post', 
          `/api/v1/wishlist/${notificationWishlistId}/items`, 
          { productId: products[i].id }, 
          testToken
        );
      }
    });

    it('should handle bulk price drop notifications efficiently', async () => {
      // Simulate price drops for multiple items
      const updatePromises = [];
      for (let i = 0; i < 50; i++) {
        updatePromises.push(
          prisma.product.update({
            where: { id: products[i].id },
            data: { 
              regularPrice: parseFloat(products[i].regularPrice),
              salePrice: parseFloat(products[i].regularPrice) * 0.8 // 20% drop
            }
          })
        );
      }

      await Promise.all(updatePromises);

      const { result, responseTime } = await measureResponseTime(async () => {
        return await makeAuthenticatedRequest(
          app, 
          'post', 
          `/api/v1/wishlist/${notificationWishlistId}/check-price-drops`, 
          { 
            sendNotifications: false,
            batchSize: 50
          }, 
          testToken
        );
      });

      expect(result.status).toBe(200);
      expect(result.body.priceDrops.length).toBeGreaterThan(40); // Most items should have price drops
      expect(responseTime).toBeLessThan(10000); // Should complete within 10 seconds
    });

    it('should handle bulk notification sending efficiently', async () => {
      const { result, responseTime } = await measureResponseTime(async () => {
        return await makeAuthenticatedRequest(
          app, 
          'post', 
          `/api/v1/wishlist/${notificationWishlistId}/send-bulk-notifications`, 
          { 
            type: 'price-drop',
            channels: ['email', 'push'],
            batchSize: 25
          }, 
          testToken
        );
      });

      expect(result.status).toBe(200);
      expect(result.body).toHaveProperty('notificationsSent');
      expect(responseTime).toBeLessThan(15000); // Should complete within 15 seconds
    });
  });

  /**
   * Test sharing link performance
   */
  describe('Sharing Link Performance', () => {
    let sharingWishlistId;

    beforeEach(async () => {
      const wishlistResponse = await makeAuthenticatedRequest(
        app, 
        'post', 
        '/api/v1/wishlist', 
        { name: 'Sharing Performance Test' }, 
        testToken
      );
      sharingWishlistId = wishlistResponse.body.wishlist.id;

      // Add items
      for (let i = 0; i < 100; i++) {
        await makeAuthenticatedRequest(
          app, 
          'post', 
          `/api/v1/wishlist/${sharingWishlistId}/items`, 
          { productId: products[i].id }, 
          testToken
        );
      }
    });

    it('should generate sharing links efficiently', async () => {
      const { result, responseTime } = await measureResponseTime(async () => {
        return await makeAuthenticatedRequest(
          app, 
          'post', 
          `/api/v1/wishlist/${sharingWishlistId}/share`, 
          { 
            type: 'public',
            includeAnalytics: true,
            expiresIn: '30d'
          }, 
          testToken
        );
      });

      expect(result.status).toBe(200);
      expect(result.body).toHaveProperty('shareableLink');
      expect(responseTime).toBeLessThan(2000); // Should generate within 2 seconds
    });

    it('should handle concurrent sharing link generation', async () => {
      const concurrentShares = 20;
      const promises = [];

      for (let i = 0; i < concurrentShares; i++) {
        promises.push(
          makeAuthenticatedRequest(
            app, 
            'post', 
            `/api/v1/wishlist/${sharingWishlistId}/share`, 
            { 
              type: 'temporary',
              expiresIn: '7d',
              maxViews: 10
            }, 
            testToken
          )
        );
      }

      const { result, responseTime } = await measureResponseTime(async () => {
        return await Promise.allSettled(promises);
      });

      const successful = result.filter(r => r.status === 'fulfilled' && r.value.status === 200);
      expect(successful.length).toBeGreaterThan(concurrentShares * 0.9); // At least 90% success
      expect(responseTime).toBeLessThan(20000); // Should complete within 20 seconds
    });

    it('should handle shared wishlist access efficiently', async () => {
      // Generate share link first
      const shareResponse = await makeAuthenticatedRequest(
        app, 
        'post', 
        `/api/v1/wishlist/${sharingWishlistId}/share`, 
        { type: 'public' }, 
        testToken
      );
      const shareToken = shareResponse.body.shareToken;

      // Test concurrent access to shared wishlist
      const concurrentAccess = 50;
      const promises = [];

      for (let i = 0; i < concurrentAccess; i++) {
        promises.push(
          request(app)
            .get(`/api/v1/wishlist/shared/${shareToken}`)
            .expect(200)
        );
      }

      const { result, responseTime } = await measureResponseTime(async () => {
        return await Promise.allSettled(promises);
      });

      const successful = result.filter(r => r.status === 'fulfilled' && r.value.status === 200);
      expect(successful.length).toBeGreaterThan(concurrentAccess * 0.9); // At least 90% success
      expect(responseTime).toBeLessThan(30000); // Should complete within 30 seconds
    });
  });

  /**
   * Test database query optimization
   */
  describe('Database Query Optimization', () => {
    it('should use efficient queries for wishlist retrieval', async () => {
      // Create wishlist with many items
      const wishlistResponse = await makeAuthenticatedRequest(
        app, 
        'post', 
        '/api/v1/wishlist', 
        { name: 'Query Optimization Test' }, 
        testToken
      );
      const queryWishlistId = wishlistResponse.body.wishlist.id;

      // Add many items
      for (let i = 0; i < 500; i++) {
        await makeAuthenticatedRequest(
          app, 
          'post', 
          `/api/v1/wishlist/${queryWishlistId}/items`, 
          { productId: products[i].id }, 
          testToken
        );
      }

      // Test different query scenarios
      const queries = [
        // Basic retrieval
        makeAuthenticatedRequest(
          app, 
          'get', 
          `/api/v1/wishlist/${queryWishlistId}`, 
          {}, 
          testToken
        ),
        // With pagination
        makeAuthenticatedRequest(
          app, 
          'get', 
          `/api/v1/wishlist/${queryWishlistId}`, 
          { pageSize: 50, page: 1 }, 
          testToken
        ),
        // With sorting
        makeAuthenticatedRequest(
          app, 
          'get', 
          `/api/v1/wishlist/${queryWishlistId}`, 
          { sortBy: 'price', sortOrder: 'asc' }, 
          testToken
        ),
        // With filtering
        makeAuthenticatedRequest(
          app, 
          'get', 
          `/api/v1/wishlist/${queryWishlistId}`, 
          { priceRange: { min: 1000, max: 5000 } }, 
          testToken
        )
      ];

      const queryTimes = [];
      for (const query of queries) {
        const { responseTime } = await measureResponseTime(async () => {
          return await query;
        });
        queryTimes.push(responseTime);
      }

      // All queries should complete efficiently
      queryTimes.forEach(time => {
        expect(time).toBeLessThan(5000); // Each query under 5 seconds
      });

      const averageQueryTime = queryTimes.reduce((a, b) => a + b, 0) / queryTimes.length;
      expect(averageQueryTime).toBeLessThan(3000); // Average under 3 seconds
    });

    it('should handle complex search queries efficiently', async () => {
      const searchQueries = [
        { query: 'Product', category: 'electronics' },
        { query: 'Performance', priceRange: { min: 1000, max: 10000 } },
        { query: 'Test', sortBy: 'name', sortOrder: 'desc' },
        { query: 'Product 1', includeOutOfStock: true },
        { query: 'Product', page: 1, pageSize: 20 }
      ];

      const searchTimes = [];
      for (const searchQuery of searchQueries) {
        const { responseTime } = await measureResponseTime(async () => {
          return await makeAuthenticatedRequest(
            app, 
            'post', 
            `/api/v1/wishlist/search`, 
            searchQuery, 
            testToken
          );
        });
        searchTimes.push(responseTime);
      }

      searchTimes.forEach(time => {
        expect(time).toBeLessThan(3000); // Each search under 3 seconds
      });

      const averageSearchTime = searchTimes.reduce((a, b) => a + b, 0) / searchTimes.length;
      expect(averageSearchTime).toBeLessThan(2000); // Average under 2 seconds
    });
  });

  /**
   * Test cache performance
   */
  describe('Cache Performance Testing', () => {
    let cacheWishlistId;

    beforeEach(async () => {
      const wishlistResponse = await makeAuthenticatedRequest(
        app, 
        'post', 
        '/api/v1/wishlist', 
        { name: 'Cache Performance Test' }, 
        testToken
      );
      cacheWishlistId = wishlistResponse.body.wishlist.id;

      // Add items
      for (let i = 0; i < 100; i++) {
        await makeAuthenticatedRequest(
          app, 
          'post', 
          `/api/v1/wishlist/${cacheWishlistId}/items`, 
          { productId: products[i].id }, 
          testToken
        );
      }
    });

    it('should cache wishlist retrievals efficiently', async () => {
      // First retrieval (cache miss)
      const { result: firstResult, responseTime: firstTime } = await measureResponseTime(async () => {
        return await makeAuthenticatedRequest(
          app, 
          'get', 
          `/api/v1/wishlist/${cacheWishlistId}`, 
          {}, 
          testToken
        );
      });

      expect(firstResult.status).toBe(200);

      // Second retrieval (cache hit)
      const { result: secondResult, responseTime: secondTime } = await measureResponseTime(async () => {
        return await makeAuthenticatedRequest(
          app, 
          'get', 
          `/api/v1/wishlist/${cacheWishlistId}`, 
          {}, 
          testToken
        );
      });

      expect(secondResult.status).toBe(200);
      
      // Cached retrieval should be significantly faster
      expect(secondTime).toBeLessThan(firstTime * 0.5); // At least 50% faster
    });

    it('should handle cache invalidation efficiently', async () => {
      // Populate cache
      await makeAuthenticatedRequest(
        app, 
        'get', 
        `/api/v1/wishlist/${cacheWishlistId}`, 
        {}, 
        testToken
      );

      // Modify wishlist (should invalidate cache)
      const { responseTime: updateTime } = await measureResponseTime(async () => {
        return await makeAuthenticatedRequest(
          app, 
          'put', 
          `/api/v1/wishlist/${cacheWishlistId}`, 
          { name: 'Updated Cache Wishlist' }, 
          testToken
        );
      });

      expect(updateTime).toBeLessThan(2000); // Update should be fast

      // Next retrieval should reflect changes
      const { result: retrieveResult, responseTime: retrieveTime } = await measureResponseTime(async () => {
        return await makeAuthenticatedRequest(
          app, 
          'get', 
          `/api/v1/wishlist/${cacheWishlistId}`, 
          {}, 
          testToken
        );
      });

      expect(retrieveResult.status).toBe(200);
      expect(retrieveResult.body.wishlist.name).toBe('Updated Cache Wishlist');
      expect(retrieveTime).toBeLessThan(3000); // Should still be reasonable
    });
  });

  /**
   * Test Bangladesh-specific performance scenarios
   */
  describe('Bangladesh-Specific Performance', () => {
    let bdUser, bdToken, bdProducts, bdWishlistId;

    beforeEach(async () => {
      bdUser = await createBangladeshWishlistUser('urbanProfessional');
      bdToken = generateTestToken(bdUser);
      bdProducts = await createBangladeshWishlistProducts();

      const wishlistResponse = await makeAuthenticatedRequest(
        app, 
        'post', 
        '/api/v1/wishlist', 
        { name: 'Bangladesh Performance Test' }, 
        bdToken
      );
      bdWishlistId = wishlistResponse.body.wishlist.id;
    });

    it('should handle BDT price calculations efficiently', async () => {
      // Add Bangladesh products
      for (const product of bdProducts) {
        await makeAuthenticatedRequest(
          app, 
          'post', 
          `/api/v1/wishlist/${bdWishlistId}/items`, 
          { productId: product.id }, 
          bdToken
        );
      }

      const { result, responseTime } = await measureResponseTime(async () => {
        return await makeAuthenticatedRequest(
          app, 
          'get', 
          `/api/v1/wishlist/${bdWishlistId}/value-calculation`, 
          { 
            currency: 'BDT',
            includeTax: true,
            taxRate: 0.15,
            includeBDTFormatting: true
          }, 
          bdToken
        );
      });

      expect(result.status).toBe(200);
      expect(result.body).toHaveProperty('totalValue');
      expect(result.body).toHaveProperty('formattedValue');
      expect(responseTime).toBeLessThan(2000); // Should complete within 2 seconds
    });

    it('should handle regional shipping calculations efficiently', async () => {
      const regions = ['DHAKA', 'CHITTAGONG', 'SYLHET', 'RAJSHAHI'];
      const shippingTimes = [];

      for (const region of regions) {
        const { responseTime } = await measureResponseTime(async () => {
          return await makeAuthenticatedRequest(
            app, 
            'post', 
            '/api/v1/shipping/calculate-bulk', 
            { 
              division: region,
              productIds: bdProducts.slice(0, 10).map(p => p.id),
              includeVAT: true
            }, 
            bdToken
          );
        });
        shippingTimes.push(responseTime);
      }

      shippingTimes.forEach(time => {
        expect(time).toBeLessThan(3000); // Each calculation under 3 seconds
      });

      const averageShippingTime = shippingTimes.reduce((a, b) => a + b, 0) / shippingTimes.length;
      expect(averageShippingTime).toBeLessThan(2000); // Average under 2 seconds
    });

    it('should handle Bengali language processing efficiently', async () => {
      const { result, responseTime } = await measureResponseTime(async () => {
        return await makeAuthenticatedRequest(
          app, 
          'post', 
          `/api/v1/wishlist/${bdWishlistId}/localize`, 
          { 
            language: 'bn',
            includeCulturalContext: true,
            formatPrices: true,
            useBengaliNumerals: true
          }, 
          bdToken
        );
      });

      expect(result.status).toBe(200);
      expect(result.body).toHaveProperty('localizedContent');
      expect(responseTime).toBeLessThan(5000); // Should complete within 5 seconds
    });
  });

  /**
   * Test load scenarios
   */
  describe('Load Testing Scenarios', () => {
    it('should handle high user load efficiently', async () => {
      const userCount = 20;
      const users = [];
      const userPromises = [];

      // Create multiple users
      for (let i = 0; i < userCount; i++) {
        userPromises.push(
          createTestUser({
            email: `loadtest.user${i}@example.com`,
            firstName: `LoadTest${i}`,
            lastName: 'User'
          })
        );
      }

      const userResults = await Promise.all(userPromises);
      users = userResults.map(r => ({ user: r.user, token: r.token }));

      // Each user creates and manages wishlists
      const operationPromises = [];
      for (const { user, token } of users) {
        // Create wishlist
        operationPromises.push(
          makeAuthenticatedRequest(
            app, 
            'post', 
            '/api/v1/wishlist', 
            { name: `${user.firstName}'s Load Test Wishlist` }, 
            token
          )
        );

        // Add items (use first 10 products)
        for (let j = 0; j < 10; j++) {
          operationPromises.push(
            makeAuthenticatedRequest(
              app, 
              'post', 
              `/api/v1/wishlist/${user.id}/items`, 
              { productId: products[j].id }, 
              token
            )
          );
        }
      }

      const { result, responseTime } = await measureResponseTime(async () => {
        return await Promise.allSettled(operationPromises);
      });

      const successful = result.filter(r => r.status === 'fulfilled' && r.value.status < 400);
      const successRate = successful.length / operationPromises.length;
      
      expect(successRate).toBeGreaterThan(0.8); // At least 80% success rate
      expect(responseTime).toBeLessThan(120000); // Should complete within 2 minutes
    });

    it('should maintain performance under sustained load', async () => {
      const duration = 10000; // 10 seconds
      const startTime = Date.now();
      const operations = [];
      let operationCount = 0;

      // Continuous operations for specified duration
      while (Date.now() - startTime < duration) {
        const operation = makeAuthenticatedRequest(
          app, 
          'get', 
          `/api/v1/wishlist/${largeWishlistId}`, 
          { pageSize: 20 }, 
          testToken
        );
        operations.push(operation);
        operationCount++;
        
        // Small delay between operations
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      const { result, responseTime } = await measureResponseTime(async () => {
        return await Promise.allSettled(operations);
      });

      const successful = result.filter(r => r.status === 'fulfilled' && r.value.status === 200);
      const successRate = successful.length / operations.length;
      
      expect(successRate).toBeGreaterThan(0.9); // At least 90% success rate
      expect(operationCount).toBeGreaterThan(50); // Should complete reasonable number of operations
    });
  });
});