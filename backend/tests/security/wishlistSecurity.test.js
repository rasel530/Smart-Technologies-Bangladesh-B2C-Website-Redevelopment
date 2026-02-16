/**
 * Wishlist Security Test Suite
 * 
 * This test suite covers security aspects of wishlist functionality:
 * - SQL injection prevention
 * - XSS protection
 * - CSRF protection
 * - Rate limiting
 * - Authorization bypass prevention
 * - Input validation and sanitization
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
} = require('../api-test-utils');

const app = require('../../index');
const prisma = new PrismaClient();

describe('Wishlist Security Tests', () => {
  let testUser, testToken, testProduct, testCategory, testBrand;
  let otherUser, otherToken;

  beforeEach(async () => {
    // Create test user
    const userResult = await createTestUser({
      email: 'security.test@example.com',
      firstName: 'Security',
      lastName: 'Test'
    });
    testUser = userResult.user;
    testToken = userResult.token;

    // Create another user
    const otherResult = await createTestUser({
      email: 'other.security@test.com',
      firstName: 'Other',
      lastName: 'User'
    });
    otherUser = otherResult.user;
    otherToken = otherResult.token;

    // Create test category and brand
    testCategory = await createTestCategory({
      name: 'Security Test Category',
      slug: 'security-test-category'
    });
    testBrand = await createTestBrand({
      name: 'Security Test Brand',
      slug: 'security-test-brand'
    });

    // Create test product
    testProduct = await createTestProduct({
      name: 'Security Test Product',
      categoryId: testCategory.id,
      brandId: testBrand.id,
      regularPrice: 1000
    });
  });

  afterEach(async () => {
    await cleanupTestData(['wishlist', 'wishlistItem', 'product', 'category', 'brand', 'user']);
  });

  /**
   * Test SQL Injection Prevention
   */
  describe('SQL Injection Prevention', () => {
    it('should prevent SQL injection in wishlist ID parameter', async () => {
      const maliciousInput = "'; DROP TABLE wishlists; --";

      const response = await makeAuthenticatedRequest(
        app, 'get', `/api/v1/wishlists/${maliciousInput}`,
        {}, testToken
      );

      // Should return 400 or 404, not execute the injection
      expect([400, 404, 500]).toContain(response.status);

      // Verify table still exists
      const tableCheck = await prisma.$queryRaw`
        SELECT EXISTS (
          SELECT FROM information_schema.tables
          WHERE table_name = 'wishlists'
        ) as exists
      `;
      expect(tableCheck[0].exists).toBe(true);
    });

    it('should prevent SQL injection in product ID parameter', async () => {
      const maliciousInput = "'; DELETE FROM wishlist_items; --";

      // First create a wishlist
      const createResponse = await makeAuthenticatedRequest(
        app, 'post', '/api/v1/wishlists',
        { name: 'SQL Injection Test' },
        testToken
      );
      const wishlistId = createResponse.body.wishlist.id;

      const response = await makeAuthenticatedRequest(
        app, 'post', `/api/v1/wishlists/${wishlistId}/items`,
        { productId: maliciousInput },
        testToken
      );

      // Should return validation error
      expect(response.status).toBe(400);
    });

    it('should prevent SQL injection in search parameters', async () => {
      const maliciousSearch = "'; SELECT * FROM users; --";

      const response = await makeAuthenticatedRequest(
        app, 'get', `/api/v1/wishlists?search=${encodeURIComponent(maliciousSearch)}`,
        {}, testToken
      );

      // Should return 400 or empty results, not execute injection
      expect([400, 200]).toContain(response.status);
    });

    it('should escape special characters in wishlist names', async () => {
      const maliciousName = "Test'; DROP TABLE wishlists; --";

      const response = await makeAuthenticatedRequest(
        app, 'post', '/api/v1/wishlists',
        { name: maliciousName },
        testToken
      );

      // Should either create successfully or reject
      if (response.status === 201) {
        // Verify wishlist was created safely
        const wishlist = await prisma.wishlist.findUnique({
          where: { id: response.body.wishlist.id }
        });
        expect(wishlist).toBeDefined();
      } else {
        expect(response.status).toBe(400);
      }
    });
  });

  /**
   * Test XSS Protection
   */
  describe('XSS Protection', () => {
    it('should sanitize wishlist names containing XSS payloads', async () => {
      const xssPayload = '<script>alert("XSS")</script>';

      const response = await makeAuthenticatedRequest(
        app, 'post', '/api/v1/wishlists',
        { name: xssPayload },
        testToken
      );

      if (response.status === 201) {
        // The XSS should be escaped in responses
        const getResponse = await makeAuthenticatedRequest(
          app, 'get', `/api/v1/wishlists/${response.body.wishlist.id}`,
          {}, testToken
        );

        // Response should not contain unescaped script tags
        expect(getResponse.body.wishlist.name).not.toContain('<script>');
        expect(getResponse.body.wishlist.name).not.toContain('alert(');
      } else {
        // Or be rejected
        expect(response.status).toBe(400);
      }
    });

    it('should sanitize product names in wishlist items', async () => {
      const xssPayload = '<img src=x onerror=alert("XSS")>';

      const response = await makeAuthenticatedRequest(
        app, 'post', '/api/v1/wishlists',
        { name: 'XSS Test' },
        testToken
      );
      const wishlistId = response.body.wishlist.id;

      // Create product with XSS in name (if allowed) or verify sanitization
      const xssProduct = await createTestProduct({
        name: xssPayload,
        categoryId: testCategory.id,
        brandId: testBrand.id,
        regularPrice: 100
      });

      const addResponse = await makeAuthenticatedRequest(
        app, 'post', `/api/v1/wishlists/${wishlistId}/items`,
        { productId: xssProduct.id },
        testToken
      );

      if (addResponse.status === 201) {
        const getResponse = await makeAuthenticatedRequest(
          app, 'get', `/api/v1/wishlists/${wishlistId}`,
          {}, testToken
        );

        // XSS should be escaped
        const item = getResponse.body.wishlist.items[0];
        expect(item.product.name).not.toContain('<img src=');
        expect(item.product.name).not.toContain('onerror=');
      }
    });

    it('should not execute JavaScript in share token', async () => {
      const jsPayload = '"><script>alert(1)</script>';

      const response = await makeAuthenticatedRequest(
        app, 'post', '/api/v1/wishlists',
        { name: 'Share Test' },
        testToken
      );
      const wishlistId = response.body.wishlist.id;

      const shareResponse = await makeAuthenticatedRequest(
        app, 'post', `/api/v1/wishlists/${wishlistId}/share`,
        {}, testToken
      );

      if (shareResponse.status === 200) {
        const shareToken = shareResponse.body.shareToken;

        // Access shared wishlist
        const publicResponse = await request(app)
          .get(`/api/v1/wishlists/shared/${shareToken}`);

        // Should not execute XSS
        expect(publicResponse.text).not.toContain('<script>');
      }
    });
  });

  /**
   * Test Authorization Bypass Prevention
   */
  describe('Authorization Bypass Prevention', () => {
    let targetWishlistId;

    beforeEach(async () => {
      const response = await makeAuthenticatedRequest(
        app, 'post', '/api/v1/wishlists',
        { name: 'Target Wishlist' },
        testToken
      );
      targetWishlistId = response.body.wishlist.id;
    });

    it('should prevent access to other user\'s wishlists', async () => {
      const response = await makeAuthenticatedRequest(
        app, 'get', `/api/v1/wishlists/${targetWishlistId}`,
        {}, otherToken
      );

      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('error', 'Access denied');
    });

    it('should prevent modification of other user\'s wishlists', async () => {
      const response = await makeAuthenticatedRequest(
        app, 'put', `/api/v1/wishlists/${targetWishlistId}`,
        { name: 'Hacked Name' },
        otherToken
      );

      expect(response.status).toBe(403);
    });

    it('should prevent deletion of other user\'s wishlists', async () => {
      const response = await makeAuthenticatedRequest(
        app, 'delete', `/api/v1/wishlists/${targetWishlistId}`,
        {}, otherToken
      );

      expect(response.status).toBe(403);

      // Verify wishlist still exists
      const wishlist = await prisma.wishlist.findUnique({
        where: { id: targetWishlistId }
      });
      expect(wishlist).not.toBeNull();
    });

    it('should prevent adding items to other user\'s wishlists', async () => {
      const response = await makeAuthenticatedRequest(
        app, 'post', `/api/v1/wishlists/${targetWishlistId}/items`,
        { productId: testProduct.id },
        otherToken
      );

      expect(response.status).toBe(403);
    });

    it('should prevent removing items from other user\'s wishlists', async () => {
      // First add an item
      const addResponse = await makeAuthenticatedRequest(
        app, 'post', `/api/v1/wishlists/${targetWishlistId}/items`,
        { productId: testProduct.id },
        testToken
      );
      const itemId = addResponse.body.item.id;

      // Try to remove with other user
      const response = await makeAuthenticatedRequest(
        app, 'delete', `/api/v1/wishlists/${targetWishlistId}/items/${itemId}`,
        {}, otherToken
      );

      expect(response.status).toBe(403);
    });

    it('should prevent sharing other user\'s wishlists', async () => {
      const response = await makeAuthenticatedRequest(
        app, 'post', `/api/v1/wishlists/${targetWishlistId}/share`,
        {}, otherToken
      );

      expect(response.status).toBe(403);
    });

    it('should prevent exporting other user\'s wishlists', async () => {
      const response = await makeAuthenticatedRequest(
        app, 'get', `/api/v1/wishlists/${targetWishlistId}/export`,
        { format: 'csv' },
        otherToken
      );

      expect(response.status).toBe(403);
    });

    it('should handle IDOR attempts with different UUID formats', async () => {
      const idorAttempts = [
        targetWishlistId.substring(0, 8), // Truncated
        targetWishlistId.toUpperCase(), // Uppercase
        targetWishlistId.replace(/-/g, ''), // No dashes
      ];

      for (const attempt of idorAttempts) {
        const response = await makeAuthenticatedRequest(
          app, 'get', `/api/v1/wishlists/${attempt}`,
          {}, otherToken
        );

        // Should not expose information
        if (response.status === 404) {
          // Valid - resource not found
        } else if (response.status === 403) {
          // Valid - access denied
        } else if (response.status === 400) {
          // Valid - invalid format
        } else {
          // Should not expose resource
          expect(response.body).not.toHaveProperty('wishlist');
        }
      }
    });
  });

  /**
   * Test Rate Limiting
   */
  describe('Rate Limiting', () => {
    it('should limit excessive wishlist creation requests', async () => {
      const requests = [];
      for (let i = 0; i < 50; i++) {
        requests.push(
          makeAuthenticatedRequest(
            app, 'post', '/api/v1/wishlists',
            { name: `Rate Test ${i}` },
            testToken
          )
        );
      }

      const results = await Promise.allSettled(requests);

      // Some should be rate limited (429)
      const rateLimited = results.filter(
        r => r.status === 'fulfilled' && r.value.status === 429
      );

      expect(rateLimited.length).toBeGreaterThan(0);
    });

    it('should limit excessive share requests', async () => {
      // Create a wishlist
      const createResponse = await makeAuthenticatedRequest(
        app, 'post', '/api/v1/wishlists',
        { name: 'Rate Share Test' },
        testToken
      );
      const wishlistId = createResponse.body.wishlist.id;

      const requests = [];
      for (let i = 0; i < 30; i++) {
        requests.push(
          makeAuthenticatedRequest(
            app, 'post', `/api/v1/wishlists/${wishlistId}/share`,
            {}, testToken
          )
        );
      }

      const results = await Promise.allSettled(requests);

      const rateLimited = results.filter(
        r => r.status === 'fulfilled' && r.value.status === 429
      );

      expect(rateLimited.length).toBeGreaterThan(0);
    });

    it('should limit public share token access', async () => {
      // Create and share wishlist
      const createResponse = await makeAuthenticatedRequest(
        app, 'post', '/api/v1/wishlists',
        { name: 'Public Rate Test', isPublic: true },
        testToken
      );
      const wishlistId = createResponse.body.wishlist.id;

      const shareResponse = await makeAuthenticatedRequest(
        app, 'post', `/api/v1/wishlists/${wishlistId}/share`,
        {}, testToken
      );
      const shareToken = shareResponse.body.shareToken;

      // Rapid public requests
      const requests = [];
      for (let i = 0; i < 100; i++) {
        requests.push(
          request(app).get(`/api/v1/wishlists/shared/${shareToken}`)
        );
      }

      const results = await Promise.allSettled(requests);

      const rateLimited = results.filter(
        r => r.status === 'fulfilled' && r.value.status === 429
      );

      expect(rateLimited.length).toBeGreaterThan(0);
    });
  });

  /**
   * Test Input Validation and Sanitization
   */
  describe('Input Validation', () => {
    it('should reject invalid UUID formats', async () => {
      const invalidIds = [
        'not-a-uuid',
        '12345',
        '550e8400-e29b-41d4-a716', // Incomplete
        '550e8400e29b41d4a716446655440000', // No dashes
      ];

      for (const invalidId of invalidIds) {
        const response = await makeAuthenticatedRequest(
          app, 'get', `/api/v1/wishlists/${invalidId}`,
          {}, testToken
        );

        expect(response.status).toBe(400);
      }
    });

    it('should validate required fields', async () => {
      const response = await makeAuthenticatedRequest(
        app, 'post', '/api/v1/wishlists',
        {}, // Missing all fields
        testToken
      );

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'Validation failed');
    });

    it('should validate field types', async () => {
      const response = await makeAuthenticatedRequest(
        app, 'post', '/api/v1/wishlists',
        {
          name: 12345, // Should be string
          isPrivate: 'yes', // Should be boolean
          isDefault: 'no' // Should be boolean
        },
        testToken
      );

      expect(response.status).toBe(400);
    });

    it('should validate field lengths', async () => {
      const response = await makeAuthenticatedRequest(
        app, 'post', '/api/v1/wishlists',
        { name: 'a'.repeat(101) }, // Exceeds 100 char limit
        testToken
      );

      expect(response.status).toBe(400);
    });

    it('should sanitize whitespace in inputs', async () => {
      const response = await makeAuthenticatedRequest(
        app, 'post', '/api/v1/wishlists',
        { name: '  Test Name  ' },
        testToken
      );

      if (response.status === 201) {
        const getResponse = await makeAuthenticatedRequest(
          app, 'get', `/api/v1/wishlists/${response.body.wishlist.id}`,
          {}, testToken
        );

        // Name should be trimmed
        expect(getResponse.body.wishlist.name).not.toStartWith(' ');
        expect(getResponse.body.wishlist.name).not.toEndWith(' ');
      }
    });

    it('should reject empty strings for required fields', async () => {
      const response = await makeAuthenticatedRequest(
        app, 'post', '/api/v1/wishlists',
        { name: '' },
        testToken
      );

      expect(response.status).toBe(400);
    });
  });

  /**
   * Test CSRF Protection
   */
  describe('CSRF Protection', () => {
    it('should reject requests without proper content type', async () => {
      const response = await request(app)
        .post('/api/v1/wishlists')
        .set('Authorization', `Bearer ${testToken}`)
        .set('Content-Type', 'text/plain')
        .send('name=Test');

      // Should reject invalid content type
      expect([400, 415, 406]).toContain(response.status);
    });

    it('should accept only valid content types', async () => {
      const response = await request(app)
        .post('/api/v1/wishlists')
        .set('Authorization', `Bearer ${testToken}`)
        .set('Content-Type', 'application/json')
        .send(JSON.stringify({ name: 'CSRF Test' }));

      expect([200, 201, 400, 401, 403]).toContain(response.status);
    });
  });

  /**
   * Test Authentication Security
   */
  describe('Authentication Security', () => {
    it('should reject requests with malformed tokens', async () => {
      const malformedTokens = [
        'not-a-jwt',
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9', // Incomplete
        'Bearer',
        'Bearer token',
        '',
      ];

      for (const token of malformedTokens) {
        const response = await request(app)
          .get('/api/v1/wishlists')
          .set('Authorization', token);

        expect(response.status).toBe(401);
      }
    });

    it('should reject expired tokens', async () => {
      const expiredToken = generateTestToken(testUser, '-1h');

      const response = await makeAuthenticatedRequest(
        app, 'get', '/api/v1/wishlists',
        {}, expiredToken
      );

      expect(response.status).toBe(401);
      expect(response.body.error).toContain('expired');
    });

    it('should reject tokens with invalid signatures', async () => {
      const fakeToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIxMjM0NTY3ODkwIiwiaWF0IjoxNTE2MjM5MDIyfQ.invalid-signature';

      const response = await request(app)
        .get('/api/v1/wishlists')
        .set('Authorization', `Bearer ${fakeToken}`);

      expect(response.status).toBe(401);
    });
  });

  /**
   * Test Privilege Escalation Prevention
   */
  describe('Privilege Escalation Prevention', () => {
    it('should not allow regular users to access admin endpoints', async () => {
      const response = await makeAuthenticatedRequest(
        app, 'get', '/api/v1/wishlists/analytics',
        {}, testToken
      );

      expect(response.status).toBe(403);
    });

    it('should not allow users to modify isAdmin field', async () => {
      const response = await makeAuthenticatedRequest(
        app, 'post', '/api/v1/wishlists',
        { name: 'Test', isAdmin: true }, // This field should be ignored
        testToken
      );

      // Even if created, isAdmin should not be set
      if (response.status === 201) {
        expect(response.body.wishlist.isAdmin).toBeUndefined();
      }
    });
  });
});
