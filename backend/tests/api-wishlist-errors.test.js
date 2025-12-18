/**
 * Wishlist Error Handling and Edge Cases Test Suite
 * 
 * This test suite covers comprehensive error scenarios including:
 * - Invalid product IDs in wishlist
 * - Unauthorized access to private wishlists
 * - Wishlist size limits and performance
 * - Broken sharing links
 * - Notification delivery failures
 * - Database constraint violations
 * - Network timeout scenarios
 * - Malformed request data
 * - Concurrent access conflicts
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

// Mock error scenarios
jest.mock('../services/redis-service', () => ({
  get: jest.fn().mockRejectedValue(new Error('Redis connection failed')),
  set: jest.fn().mockRejectedValue(new Error('Redis connection failed')),
  del: jest.fn().mockRejectedValue(new Error('Redis connection failed'))
}));

jest.mock('../services/email-service', () => ({
  sendWishlistShareEmail: jest.fn().mockRejectedValue(new Error('Email service unavailable')),
  sendPriceDropNotification: jest.fn().mockRejectedValue(new Error('SMTP server down'))
}));

jest.mock('../services/notification-service', () => ({
  sendPushNotification: jest.fn().mockRejectedValue(new Error('Push notification service down'))
}));

describe('Wishlist Error Handling and Edge Cases', () => {
  let testUser, testToken, testProduct, testCategory, testBrand;
  let wishlistId, wishlistItemId;
  let unauthorizedUser, unauthorizedToken;

  /**
   * Test setup - Create test data before each test
   */
  beforeEach(async () => {
    // Create main test user
    const userResult = await createTestUser({
      email: 'wishlist.errors@example.com',
      firstName: 'Error',
      lastName: 'Test'
    });
    testUser = userResult.user;
    testToken = userResult.token;

    // Create unauthorized user for access tests
    const unauthorizedResult = await createTestUser({
      email: 'unauthorized@example.com',
      firstName: 'Unauthorized',
      lastName: 'User'
    });
    unauthorizedUser = unauthorizedResult.user;
    unauthorizedToken = unauthorizedResult.token;

    // Create test category and brand
    testCategory = await createTestCategory({
      name: 'Error Test Electronics',
      slug: 'error-test-electronics'
    });
    testBrand = await createTestBrand({
      name: 'Error Test Brand',
      slug: 'error-test-brand'
    });

    // Create test product
    testProduct = await createTestProduct({
      name: 'Error Test Smartphone',
      categoryId: testCategory.id,
      brandId: testBrand.id,
      regularPrice: 15000,
      salePrice: 12000
    });
  });

  /**
   * Test cleanup - Remove test data after each test
   */
  afterEach(async () => {
    await cleanupTestData(['wishlist', 'wishlistItem', 'product', 'category', 'brand', 'user']);
  });

  /**
   * Test invalid product ID scenarios
   */
  describe('Invalid Product ID Handling', () => {
    it('should handle non-existent product ID gracefully', async () => {
      const fakeProductId = '550e8400-e29b-41d4-a716-446655440000';
      
      const response = await makeAuthenticatedRequest(
        app, 
        'post', 
        `/api/v1/wishlist/${wishlistId}/items`, 
        { productId: fakeProductId }, 
        testToken
      );

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error', 'Product not found');
      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('timestamp');
    });

    it('should handle malformed product UUID format', async () => {
      const malformedProductId = 'not-a-valid-uuid';
      
      const response = await makeAuthenticatedRequest(
        app, 
        'post', 
        `/api/v1/wishlist/${wishlistId}/items`, 
        { productId: malformedProductId }, 
        testToken
      );

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'Validation failed');
      expect(response.body.details).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            msg: 'Invalid UUID',
            param: 'productId'
          })
        ])
      );
    });

    it('should handle empty product ID', async () => {
      const response = await makeAuthenticatedRequest(
        app, 
        'post', 
        `/api/v1/wishlist/${wishlistId}/items`, 
        { productId: '' }, 
        testToken
      );

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'Validation failed');
    });

    it('should handle null product ID', async () => {
      const response = await makeAuthenticatedRequest(
        app, 
        'post', 
        `/api/v1/wishlist/${wishlistId}/items`, 
        { productId: null }, 
        testToken
      );

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'Validation failed');
    });
  });

  /**
   * Test unauthorized access scenarios
   */
  describe('Unauthorized Access Handling', () => {
    beforeEach(async () => {
      // Create a private wishlist
      const wishlistResponse = await makeAuthenticatedRequest(
        app, 
        'post', 
        '/api/v1/wishlist', 
        { name: 'Private Wishlist', isPrivate: true }, 
        testToken
      );
      wishlistId = wishlistResponse.body.wishlist.id;

      // Add item to wishlist
      const itemResponse = await makeAuthenticatedRequest(
        app, 
        'post', 
        `/api/v1/wishlist/${wishlistId}/items`, 
        { productId: testProduct.id }, 
        testToken
      );
      wishlistItemId = itemResponse.body.item.id;
    });

    it('should prevent unauthorized access to private wishlist', async () => {
      const response = await makeAuthenticatedRequest(
        app, 
        'get', 
        `/api/v1/wishlist/${wishlistId}`, 
        {}, 
        unauthorizedToken
      );

      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('error', 'Access denied');
      expect(response.body).toHaveProperty('message', 'You can only access your own wishlists');
    });

    it('should prevent unauthorized item removal from private wishlist', async () => {
      const response = await makeAuthenticatedRequest(
        app, 
        'delete', 
        `/api/v1/wishlist/${wishlistId}/items/${wishlistItemId}`, 
        {}, 
        unauthorizedToken
      );

      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('error', 'Access denied');
    });

    it('should prevent unauthorized wishlist modification', async () => {
      const response = await makeAuthenticatedRequest(
        app, 
        'put', 
        `/api/v1/wishlist/${wishlistId}`, 
        { name: 'Hacked Wishlist' }, 
        unauthorizedToken
      );

      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('error', 'Access denied');
    });

    it('should handle access with invalid token', async () => {
      const invalidToken = 'invalid.jwt.token';
      
      const response = await request(app)
        .get(`/api/v1/wishlist/${wishlistId}`)
        .set('Authorization', `Bearer ${invalidToken}`);

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error', 'Invalid token');
    });

    it('should handle access with expired token', async () => {
      const expiredToken = generateTestToken(testUser, '-1h'); // Expired token
      
      const response = await request(app)
        .get(`/api/v1/wishlist/${wishlistId}`)
        .set('Authorization', `Bearer ${expiredToken}`);

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error', 'Token expired');
    });
  });

  /**
   * Test wishlist size limits and performance
   */
  describe('Wishlist Size Limits', () => {
    it('should handle wishlist size limit gracefully', async () => {
      // Create wishlist
      const wishlistResponse = await makeAuthenticatedRequest(
        app, 
        'post', 
        '/api/v1/wishlist', 
        { name: 'Large Wishlist' }, 
        testToken
      );
      const largeWishlistId = wishlistResponse.body.wishlist.id;

      // Try to add many items (simulate hitting limit)
      const promises = [];
      for (let i = 0; i < 150; i++) { // Assuming limit is 100
        const product = await createTestProduct({
          name: `Product ${i}`,
          categoryId: testCategory.id,
          brandId: testBrand.id,
          regularPrice: 1000 + i
        });
        
        promises.push(
          makeAuthenticatedRequest(
            app, 
            'post', 
            `/api/v1/wishlist/${largeWishlistId}/items`, 
            { productId: product.id }, 
            testToken
          )
        );
      }

      const results = await Promise.allSettled(promises);
      const failedRequests = results.filter(r => r.status === 'rejected' || r.value.status >= 400);
      
      expect(failedRequests.length).toBeGreaterThan(0);
      
      // Check that some requests failed due to size limit
      const sizeLimitErrors = failedRequests.filter(r => 
        r.status === 'rejected' || 
        (r.value && r.value.body && r.value.body.error && 
         r.value.body.error.includes('Wishlist size limit'))
      );
      expect(sizeLimitErrors.length).toBeGreaterThan(0);
    });

    it('should handle large wishlist retrieval efficiently', async () => {
      // Create wishlist with many items
      const wishlistResponse = await makeAuthenticatedRequest(
        app, 
        'post', 
        '/api/v1/wishlist', 
        { name: 'Performance Test Wishlist' }, 
        testToken
      );
      const perfWishlistId = wishlistResponse.body.wishlist.id;

      // Add 50 items
      for (let i = 0; i < 50; i++) {
        const product = await createTestProduct({
          name: `Perf Product ${i}`,
          categoryId: testCategory.id,
          brandId: testBrand.id,
          regularPrice: 1000 + i
        });
        
        await makeAuthenticatedRequest(
          app, 
          'post', 
          `/api/v1/wishlist/${perfWishlistId}/items`, 
          { productId: product.id }, 
          testToken
        );
      }

      // Measure retrieval time
      const startTime = Date.now();
      const response = await makeAuthenticatedRequest(
        app, 
        'get', 
        `/api/v1/wishlist/${perfWishlistId}`, 
        {}, 
        testToken
      );
      const endTime = Date.now();
      const responseTime = endTime - startTime;

      expect(response.status).toBe(200);
      expect(responseTime).toBeLessThan(5000); // Should respond within 5 seconds
      expect(response.body.wishlist.items).toHaveLength(50);
    });
  });

  /**
   * Test broken sharing links
   */
  describe('Broken Sharing Links', () => {
    it('should handle expired sharing links', async () => {
      const expiredShareToken = 'expired-share-token-12345';
      
      const response = await request(app)
        .get(`/api/v1/wishlist/shared/${expiredShareToken}`)
        .expect(410); // Gone

      expect(response.body).toHaveProperty('error', 'Sharing link expired');
      expect(response.body).toHaveProperty('message');
    });

    it('should handle invalid sharing links', async () => {
      const invalidShareToken = 'invalid-share-token';
      
      const response = await request(app)
        .get(`/api/v1/wishlist/shared/${invalidShareToken}`)
        .expect(404);

      expect(response.body).toHaveProperty('error', 'Invalid sharing link');
    });

    it('should handle sharing links with invalid format', async () => {
      const malformedToken = 'not-a-valid-share-token-format';
      
      const response = await request(app)
        .get(`/api/v1/wishlist/shared/${malformedToken}`)
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Invalid sharing link format');
    });

    it('should handle sharing links for deleted wishlists', async () => {
      // Create wishlist and generate share link
      const wishlistResponse = await makeAuthenticatedRequest(
        app, 
        'post', 
        '/api/v1/wishlist', 
        { name: 'To Be Deleted' }, 
        testToken
      );
      const tempWishlistId = wishlistResponse.body.wishlist.id;

      const shareResponse = await makeAuthenticatedRequest(
        app, 
        'post', 
        `/api/v1/wishlist/${tempWishlistId}/share`, 
        { type: 'public' }, 
        testToken
      );
      const shareToken = shareResponse.body.shareToken;

      // Delete the wishlist
      await makeAuthenticatedRequest(
        app, 
        'delete', 
        `/api/v1/wishlist/${tempWishlistId}`, 
        {}, 
        testToken
      );

      // Try to access deleted wishlist via share link
      const response = await request(app)
        .get(`/api/v1/wishlist/shared/${shareToken}`)
        .expect(404);

      expect(response.body).toHaveProperty('error', 'Wishlist not found');
    });
  });

  /**
   * Test notification delivery failures
   */
  describe('Notification Delivery Failures', () => {
    beforeEach(async () => {
      // Create wishlist for notification tests
      const wishlistResponse = await makeAuthenticatedRequest(
        app, 
        'post', 
        '/api/v1/wishlist', 
        { name: 'Notification Test Wishlist' }, 
        testToken
      );
      wishlistId = wishlistResponse.body.wishlist.id;

      await makeAuthenticatedRequest(
        app, 
        'post', 
        `/api/v1/wishlist/${wishlistId}/items`, 
        { productId: testProduct.id }, 
        testToken
      );
    });

    it('should handle email service failure gracefully', async () => {
      const response = await makeAuthenticatedRequest(
        app, 
        'post', 
        `/api/v1/wishlist/${wishlistId}/share/email`, 
        { 
          emails: ['test@example.com'],
          message: 'Test email notification'
        }, 
        testToken
      );

      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('error', 'Email service unavailable');
      expect(response.body).toHaveProperty('retryable', true);
    });

    it('should handle push notification service failure', async () => {
      const response = await makeAuthenticatedRequest(
        app, 
        'post', 
        `/api/v1/wishlist/${wishlistId}/notifications/push`, 
        { 
          message: 'Test push notification',
          userId: testUser.id
        }, 
        testToken
      );

      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('error', 'Push notification service down');
    });

    it('should handle SMS service failure', async () => {
      const response = await makeAuthenticatedRequest(
        app, 
        'post', 
        `/api/v1/wishlist/${wishlistId}/notifications/sms`, 
        { 
          phoneNumber: '+8801234567890',
          message: 'Test SMS notification'
        }, 
        testToken
      );

      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('error', 'SMS service unavailable');
    });
  });

  /**
   * Test database constraint violations
   */
  describe('Database Constraint Violations', () => {
    it('should handle duplicate wishlist item constraint', async () => {
      // Create wishlist
      const wishlistResponse = await makeAuthenticatedRequest(
        app, 
        'post', 
        '/api/v1/wishlist', 
        { name: 'Duplicate Test Wishlist' }, 
        testToken
      );
      const dupWishlistId = wishlistResponse.body.wishlist.id;

      // Add product first time
      await makeAuthenticatedRequest(
        app, 
        'post', 
        `/api/v1/wishlist/${dupWishlistId}/items`, 
        { productId: testProduct.id }, 
        testToken
      );

      // Try to add same product again
      const response = await makeAuthenticatedRequest(
        app, 
        'post', 
        `/api/v1/wishlist/${dupWishlistId}/items`, 
        { productId: testProduct.id }, 
        testToken
      );

      expect(response.status).toBe(409);
      expect(response.body).toHaveProperty('error', 'Product already in wishlist');
    });

    it('should handle foreign key constraint violation', async () => {
      const fakeProductId = '550e8400-e29b-41d4-a716-446655440000';
      
      const response = await makeAuthenticatedRequest(
        app, 
        'post', 
        `/api/v1/wishlist/${wishlistId}/items`, 
        { productId: fakeProductId }, 
        testToken
      );

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error', 'Product not found');
    });

    it('should handle unique constraint violation for user wishlist', async () => {
      // This would depend on the schema - if only one wishlist per user is allowed
      const response = await makeAuthenticatedRequest(
        app, 
        'post', 
        '/api/v1/wishlist', 
        { name: 'Second Wishlist' }, 
        testToken
      );

      // This test would need to be adjusted based on actual schema constraints
      expect([200, 409]).toContain(response.status);
    });
  });

  /**
   * Test network timeout scenarios
   */
  describe('Network Timeout Scenarios', () => {
    it('should handle database connection timeout', async () => {
      // Mock database timeout
      const originalFindMany = prisma.wishlist.findMany;
      prisma.wishlist.findMany = jest.fn().mockRejectedValue(
        new Error('Connection timeout')
      );

      const response = await makeAuthenticatedRequest(
        app, 
        'get', 
        `/api/v1/wishlist/user/${testUser.id}`, 
        {}, 
        testToken
      );

      expect(response.status).toBe(503);
      expect(response.body).toHaveProperty('error', 'Service temporarily unavailable');
      expect(response.body).toHaveProperty('retryable', true);

      // Restore original method
      prisma.wishlist.findMany = originalFindMany;
    });

    it('should handle Redis connection failure', async () => {
      const response = await makeAuthenticatedRequest(
        app, 
        'post', 
        `/api/v1/wishlist/${wishlistId}/cache`, 
        { action: 'refresh' }, 
        testToken
      );

      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('error', 'Cache service unavailable');
    });
  });

  /**
   * Test malformed request data
   */
  describe('Malformed Request Data', () => {
    it('should handle invalid JSON in request body', async () => {
      const response = await request(app)
        .post('/api/v1/wishlist')
        .set('Authorization', `Bearer ${testToken}`)
        .set('Content-Type', 'application/json')
        .send('{"name": "Invalid JSON",}')
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Invalid JSON');
    });

    it('should handle missing required fields', async () => {
      const response = await makeAuthenticatedRequest(
        app, 
        'post', 
        '/api/v1/wishlist', 
        {}, // Missing all required fields
        testToken
      );

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'Validation failed');
    });

    it('should handle invalid data types', async () => {
      const response = await makeAuthenticatedRequest(
        app, 
        'post', 
        '/api/v1/wishlist', 
        { 
          name: 123, // Should be string
          isPrivate: 'yes' // Should be boolean
        }, 
        testToken
      );

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'Validation failed');
      expect(response.body.details).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            param: 'name',
            msg: 'Invalid value'
          })
        ])
      );
    });

    it('should handle excessively long field values', async () => {
      const longName = 'a'.repeat(300); // Exceeds typical length limit
      
      const response = await makeAuthenticatedRequest(
        app, 
        'post', 
        '/api/v1/wishlist', 
        { 
          name: longName,
          isPrivate: false
        }, 
        testToken
      );

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'Validation failed');
    });
  });

  /**
   * Test concurrent access conflicts
   */
  describe('Concurrent Access Conflicts', () => {
    it('should handle concurrent item additions', async () => {
      // Create wishlist
      const wishlistResponse = await makeAuthenticatedRequest(
        app, 
        'post', 
        '/api/v1/wishlist', 
        { name: 'Concurrent Test Wishlist' }, 
        testToken
      );
      const concurrentWishlistId = wishlistResponse.body.wishlist.id;

      // Create multiple products
      const products = [];
      for (let i = 0; i < 5; i++) {
        products.push(await createTestProduct({
          name: `Concurrent Product ${i}`,
          categoryId: testCategory.id,
          brandId: testBrand.id,
          regularPrice: 1000 + i
        }));
      }

      // Try to add all products concurrently
      const promises = products.map(product =>
        makeAuthenticatedRequest(
          app, 
          'post', 
          `/api/v1/wishlist/${concurrentWishlistId}/items`, 
          { productId: product.id }, 
          testToken
        )
      );

      const results = await Promise.allSettled(promises);
      const successful = results.filter(r => r.status === 'fulfilled' && r.value.status === 201);
      const failed = results.filter(r => r.status === 'rejected' || r.value.status >= 400);

      expect(successful.length + failed.length).toBe(5);
      // At least some should succeed
      expect(successful.length).toBeGreaterThan(0);
    });

    it('should handle concurrent wishlist modifications', async () => {
      // Create wishlist
      const wishlistResponse = await makeAuthenticatedRequest(
        app, 
        'post', 
        '/api/v1/wishlist', 
        { name: 'Original Name' }, 
        testToken
      );
      const concurrentWishlistId = wishlistResponse.body.wishlist.id;

      // Try to modify wishlist concurrently
      const promises = [
        makeAuthenticatedRequest(
          app, 
          'put', 
          `/api/v1/wishlist/${concurrentWishlistId}`, 
          { name: 'Name 1' }, 
          testToken
        ),
        makeAuthenticatedRequest(
          app, 
          'put', 
          `/api/v1/wishlist/${concurrentWishlistId}`, 
          { name: 'Name 2' }, 
          testToken
        ),
        makeAuthenticatedRequest(
          app, 
          'put', 
          `/api/v1/wishlist/${concurrentWishlistId}`, 
          { name: 'Name 3' }, 
          testToken
        )
      ];

      const results = await Promise.allSettled(promises);
      const successful = results.filter(r => r.status === 'fulfilled' && r.value.status === 200);
      
      // At least one should succeed, but conflicts may occur
      expect(successful.length).toBeGreaterThanOrEqual(1);
    });
  });

  /**
   * Test Bangladesh-specific error scenarios
   */
  describe('Bangladesh-Specific Error Scenarios', () => {
    let bdUser, bdToken, bdProducts;

    beforeEach(async () => {
      bdUser = await createBangladeshWishlistUser('urbanProfessional');
      bdToken = generateTestToken(bdUser);
      bdProducts = await createBangladeshWishlistProducts();
    });

    it('should handle invalid Bangladesh division codes', async () => {
      const response = await makeAuthenticatedRequest(
        app, 
        'post', 
        '/api/v1/shipping/calculate', 
        { 
          division: 'INVALID_DIVISION',
          district: 'Dhaka',
          weight: 2.5
        }, 
        bdToken
      );

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'Invalid division code');
      expect(response.body).toHaveProperty('validDivisions');
      expect(Array.isArray(response.body.validDivisions)).toBe(true);
    });

    it('should handle invalid Bangladeshi phone numbers', async () => {
      const response = await makeAuthenticatedRequest(
        app, 
        'post', 
        '/api/v1/wishlist/purchase-setup', 
        { 
          paymentMethod: 'BKASH',
          phoneNumber: '1234567890' // Invalid format
        }, 
        bdToken
      );

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'Invalid phone number format');
      expect(response.body).toHaveProperty('expectedFormat', '+8801xxxxxxxxx');
    });

    it('should handle currency conversion errors', async () => {
      const response = await makeAuthenticatedRequest(
        app, 
        'get', 
        `/api/v1/wishlist/value-calculation`, 
        { 
          currency: 'INVALID_CURRENCY',
          includeTax: true
        }, 
        bdToken
      );

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'Unsupported currency');
      expect(response.body).toHaveProperty('supportedCurrencies');
      expect(response.body.supportedCurrencies).toContain('BDT');
    });

    it('should handle festival date validation errors', async () => {
      const response = await makeAuthenticatedRequest(
        app, 
        'post', 
        '/api/v1/wishlist/festival', 
        { 
          festival: 'eid-ul-fitr',
          festivalDate: '2024-02-30', // Invalid date
          name: 'Eid Wishlist'
        }, 
        bdToken
      );

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'Invalid festival date');
    });

    it('should handle cultural context validation errors', async () => {
      const response = await makeAuthenticatedRequest(
        app, 
        'post', 
        '/api/v1/wishlist/cultural-gifts', 
        { 
          occasion: 'invalid-occasion',
          culturalContext: 'invalid-context'
        }, 
        bdToken
      );

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'Invalid cultural context');
      expect(response.body).toHaveProperty('validOccasions');
    });
  });

  /**
   * Test rate limiting and throttling
   */
  describe('Rate Limiting and Throttling', () => {
    it('should handle excessive API requests', async () => {
      // Make many rapid requests
      const promises = [];
      for (let i = 0; i < 100; i++) {
        promises.push(
          makeAuthenticatedRequest(
            app, 
            'get', 
            `/api/v1/wishlist/user/${testUser.id}`, 
            {}, 
            testToken
          )
        );
      }

      const results = await Promise.allSettled(promises);
      const rateLimited = results.filter(r => 
        r.status === 'fulfilled' && r.value.status === 429
      );

      expect(rateLimited.length).toBeGreaterThan(0);
      
      if (rateLimited.length > 0) {
        const rateLimitResponse = rateLimited[0].value;
        expect(rateLimitResponse.body).toHaveProperty('error', 'Too many requests');
        expect(rateLimitResponse.body).toHaveProperty('retryAfter');
      }
    });

    it('should handle sharing rate limits', async () => {
      // Create wishlist
      const wishlistResponse = await makeAuthenticatedRequest(
        app, 
        'post', 
        '/api/v1/wishlist', 
        { name: 'Rate Limit Test' }, 
        testToken
      );
      const rateLimitWishlistId = wishlistResponse.body.wishlist.id;

      // Try to share many times rapidly
      const promises = [];
      for (let i = 0; i < 20; i++) {
        promises.push(
          makeAuthenticatedRequest(
            app, 
            'post', 
            `/api/v1/wishlist/${rateLimitWishlistId}/share/email`, 
            { 
              emails: [`test${i}@example.com`],
              message: `Test message ${i}`
            }, 
            testToken
          )
        );
      }

      const results = await Promise.allSettled(promises);
      const rateLimited = results.filter(r => 
        r.status === 'fulfilled' && r.value.status === 429
      );

      expect(rateLimited.length).toBeGreaterThan(0);
    });
  });
});