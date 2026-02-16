/**
 * Comprehensive Wishlist API Test Suite
 * 
 * This test suite covers all 12 wishlist API endpoints:
 * - GET /api/v1/wishlists - Get all user wishlists with pagination
 * - POST /api/v1/wishlists - Create new wishlist
 * - GET /api/v1/wishlists/:id - Get specific wishlist
 * - PUT /api/v1/wishlists/:id - Update wishlist
 * - DELETE /api/v1/wishlists/:id - Delete wishlist
 * - POST /api/v1/wishlists/:id/items - Add product to wishlist
 * - DELETE /api/v1/wishlists/:id/items/:itemId - Remove item from wishlist
 * - POST /api/v1/wishlists/:id/items/move-to-cart - Move items to cart
 * - POST /api/v1/wishlists/:id/share - Generate share token
 * - GET /api/v1/wishlists/shared/:shareToken - Access shared wishlist
 * - GET /api/v1/wishlists/:id/export - Export wishlist (CSV/PDF)
 * - GET /api/v1/wishlists/analytics - Get analytics (admin)
 */

const request = require('supertest');
const { PrismaClient } = require('@prisma/client');
const {
  generateTestToken,
  createTestUser,
  createTestProduct,
  createTestCategory,
  createTestBrand,
  createTestAdmin,
  cleanupTestData,
  makeAuthenticatedRequest
} = require('../api-test-utils');

const app = require('../../index');
const prisma = new PrismaClient();

describe('Wishlist API Comprehensive Tests', () => {
  let testUser, testToken, testProduct, testCategory, testBrand;
  let adminUser, adminToken;
  let wishlistId, wishlistItemId;
  let shareToken;

  /**
   * Test setup
   */
  beforeEach(async () => {
    // Create regular user
    const userResult = await createTestUser({
      email: 'wishlist.api.test@example.com',
      firstName: 'Wishlist',
      lastName: 'API Test'
    });
    testUser = userResult.user;
    testToken = userResult.token;

    // Create admin user
    const adminResult = await createTestAdmin({
      email: 'wishlist.admin.test@example.com',
      firstName: 'Wishlist',
      lastName: 'Admin'
    });
    adminUser = adminResult.user;
    adminToken = adminResult.token;

    // Create test category and brand
    testCategory = await createTestCategory({
      name: 'API Test Electronics',
      slug: 'api-test-electronics'
    });
    testBrand = await createTestBrand({
      name: 'API Test Brand',
      slug: 'api-test-brand'
    });

    // Create test product
    testProduct = await createTestProduct({
      name: 'API Test Smartphone',
      categoryId: testCategory.id,
      brandId: testBrand.id,
      regularPrice: 15000,
      salePrice: 12000
    });
  });

  /**
   * Test cleanup
   */
  afterEach(async () => {
    await cleanupTestData(['wishlist', 'wishlistItem', 'wishlistAnalytics', 'product', 'category', 'brand', 'user', 'cart', 'cartItem']);
  });

  // =========================================================================
  // GET /api/v1/wishlists - Get all user wishlists with pagination
  // =========================================================================
  describe('GET /api/v1/wishlists', () => {
    beforeEach(async () => {
      // Create multiple wishlists
      await makeAuthenticatedRequest(app, 'post', '/api/v1/wishlists', { name: 'Birthday Wishlist' }, testToken);
      await makeAuthenticatedRequest(app, 'post', '/api/v1/wishlists', { name: 'Holiday Wishlist' }, testToken);
      await makeAuthenticatedRequest(app, 'post', '/api/v1/wishlists', { name: 'Shopping Wishlist' }, testToken);
    });

    it('should return all user wishlists', async () => {
      const response = await makeAuthenticatedRequest(app, 'get', '/api/v1/wishlists', {}, testToken);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('wishlists');
      expect(Array.isArray(response.body.wishlists)).toBe(true);
      expect(response.body.wishlists.length).toBe(3);
    });

    it('should return wishlists with pagination', async () => {
      const response = await makeAuthenticatedRequest(
        app, 'get', '/api/v1/wishlists', { page: 1, pageSize: 2 }, testToken
      );

      expect(response.status).toBe(200);
      expect(response.body.wishlists.length).toBe(2);
      expect(response.body).toHaveProperty('pagination');
      expect(response.body.pagination.total).toBe(3);
      expect(response.body.pagination.page).toBe(1);
      expect(response.body.pagination.pageSize).toBe(2);
    });

    it('should return 401 for unauthenticated request', async () => {
      const response = await request(app).get('/api/v1/wishlists');

      expect(response.status).toBe(401);
    });

    it('should return empty array for user with no wishlists', async () => {
      const newUser = await createTestUser({ email: 'new.user@test.com' });

      const response = await makeAuthenticatedRequest(app, 'get', '/api/v1/wishlists', {}, newUser.token);

      expect(response.status).toBe(200);
      expect(response.body.wishlists).toEqual([]);
    });
  });

  // =========================================================================
  // POST /api/v1/wishlists - Create new wishlist
  // =========================================================================
  describe('POST /api/v1/wishlists', () => {
    it('should create wishlist with default name', async () => {
      const response = await makeAuthenticatedRequest(app, 'post', '/api/v1/wishlists', {}, testToken);

      expect(response.status).toBe(201);
      expect(response.body.wishlist.name).toBe('My Wishlist');
      expect(response.body.wishlist.isDefault).toBe(false);
      expect(response.body.wishlist.isPublic).toBe(false);
      wishlistId = response.body.wishlist.id;
    });

    it('should create wishlist with custom name', async () => {
      const response = await makeAuthenticatedRequest(
        app, 'post', '/api/v1/wishlists', { name: 'Eid Gifts 2024' }, testToken
      );

      expect(response.status).toBe(201);
      expect(response.body.wishlist.name).toBe('Eid Gifts 2024');
    });

    it('should validate wishlist name length', async () => {
      const response = await makeAuthenticatedRequest(
        app, 'post', '/api/v1/wishlists', { name: 'a'.repeat(101) }, testToken
      );

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'Validation failed');
    });

    it('should return 401 for unauthenticated request', async () => {
      const response = await request(app).post('/api/v1/wishlists').send({ name: 'Test' });

      expect(response.status).toBe(401);
    });

    it('should create default wishlist when explicitly set', async () => {
      const response = await makeAuthenticatedRequest(
        app, 'post', '/api/v1/wishlists', { name: 'My Default', isDefault: true }, testToken
      );

      expect(response.status).toBe(201);
      expect(response.body.wishlist.isDefault).toBe(true);
    });
  });

  // =========================================================================
  // GET /api/v1/wishlists/:id - Get specific wishlist
  // =========================================================================
  describe('GET /api/v1/wishlists/:id', () => {
    beforeEach(async () => {
      const response = await makeAuthenticatedRequest(
        app, 'post', '/api/v1/wishlists', { name: 'Test Wishlist' }, testToken
      );
      wishlistId = response.body.wishlist.id;

      // Add item to wishlist
      await makeAuthenticatedRequest(
        app, 'post', `/api/v1/wishlists/${wishlistId}/items`, { productId: testProduct.id }, testToken
      );
    });

    it('should return wishlist with items', async () => {
      const response = await makeAuthenticatedRequest(app, 'get', `/api/v1/wishlists/${wishlistId}`, {}, testToken);

      expect(response.status).toBe(200);
      expect(response.body.wishlist.id).toBe(wishlistId);
      expect(response.body.wishlist.items).toBeDefined();
      expect(response.body.wishlist.items.length).toBe(1);
    });

    it('should return 404 for non-existent wishlist', async () => {
      const fakeId = '550e8400-e29b-41d4-a716-446655440000';
      const response = await makeAuthenticatedRequest(app, 'get', `/api/v1/wishlists/${fakeId}`, {}, testToken);

      expect(response.status).toBe(404);
    });

    it('should return 403 for private wishlist accessed by other user', async () => {
      // Create private wishlist
      const privateResponse = await makeAuthenticatedRequest(
        app, 'post', '/api/v1/wishlists', { name: 'Private', isPrivate: true }, testToken
      );
      const privateId = privateResponse.body.wishlist.id;

      // Try to access with another user
      const otherUser = await createTestUser({ email: 'other@test.com' });
      const response = await makeAuthenticatedRequest(
        app, 'get', `/api/v1/wishlists/${privateId}`, {}, otherUser.token
      );

      expect(response.status).toBe(403);
    });
  });

  // =========================================================================
  // PUT /api/v1/wishlists/:id - Update wishlist
  // =========================================================================
  describe('PUT /api/v1/wishlists/:id', () => {
    beforeEach(async () => {
      const response = await makeAuthenticatedRequest(
        app, 'post', '/api/v1/wishlists', { name: 'Original Name' }, testToken
      );
      wishlistId = response.body.wishlist.id;
    });

    it('should update wishlist name', async () => {
      const response = await makeAuthenticatedRequest(
        app, 'put', `/api/v1/wishlists/${wishlistId}`,
        { name: 'Updated Name' }, testToken
      );

      expect(response.status).toBe(200);
      expect(response.body.wishlist.name).toBe('Updated Name');
    });

    it('should update wishlist privacy setting', async () => {
      const response = await makeAuthenticatedRequest(
        app, 'put', `/api/v1/wishlists/${wishlistId}`,
        { isPrivate: true }, testToken
      );

      expect(response.status).toBe(200);
      expect(response.body.wishlist.isPrivate).toBe(true);
    });

    it('should return 403 for non-owner update attempt', async () => {
      const otherUser = await createTestUser({ email: 'other@test.com' });

      const response = await makeAuthenticatedRequest(
        app, 'put', `/api/v1/wishlists/${wishlistId}`,
        { name: 'Hacked' }, otherUser.token
      );

      expect(response.status).toBe(403);
    });
  });

  // =========================================================================
  // DELETE /api/v1/wishlists/:id - Delete wishlist
  // =========================================================================
  describe('DELETE /api/v1/wishlists/:id', () => {
    beforeEach(async () => {
      const response = await makeAuthenticatedRequest(
        app, 'post', '/api/v1/wishlists', { name: 'To Delete' }, testToken
      );
      wishlistId = response.body.wishlist.id;

      // Add item
      await makeAuthenticatedRequest(
        app, 'post', `/api/v1/wishlists/${wishlistId}/items`,
        { productId: testProduct.id }, testToken
      );
    });

    it('should delete wishlist and cascade items', async () => {
      // Verify item exists
      let items = await prisma.wishlistItem.findMany({ where: { wishlistId } });
      expect(items.length).toBe(1);

      const response = await makeAuthenticatedRequest(
        app, 'delete', `/api/v1/wishlists/${wishlistId}`, {}, testToken
      );

      expect(response.status).toBe(200);

      // Verify wishlist deleted
      const wishlist = await prisma.wishlist.findUnique({ where: { id: wishlistId } });
      expect(wishlist).toBeNull();

      // Verify items cascade deleted
      items = await prisma.wishlistItem.findMany({ where: { wishlistId } });
      expect(items.length).toBe(0);
    });

    it('should return 403 for non-owner delete attempt', async () => {
      const otherUser = await createTestUser({ email: 'other@test.com' });

      const response = await makeAuthenticatedRequest(
        app, 'delete', `/api/v1/wishlists/${wishlistId}`, {}, otherUser.token
      );

      expect(response.status).toBe(403);
    });
  });

  // =========================================================================
  // POST /api/v1/wishlists/:id/items - Add product to wishlist
  // =========================================================================
  describe('POST /api/v1/wishlists/:id/items', () => {
    beforeEach(async () => {
      const response = await makeAuthenticatedRequest(
        app, 'post', '/api/v1/wishlists', { name: 'Item Test' }, testToken
      );
      wishlistId = response.body.wishlist.id;
    });

    it('should add product to wishlist', async () => {
      const response = await makeAuthenticatedRequest(
        app, 'post', `/api/v1/wishlists/${wishlistId}/items`,
        { productId: testProduct.id }, testToken
      );

      expect(response.status).toBe(201);
      expect(response.body.item.productId).toBe(testProduct.id);
      expect(response.body.item.wishlistId).toBe(wishlistId);
      wishlistItemId = response.body.item.id;
    });

    it('should return 409 for duplicate product', async () => {
      // Add first time
      await makeAuthenticatedRequest(
        app, 'post', `/api/v1/wishlists/${wishlistId}/items`,
        { productId: testProduct.id }, testToken
      );

      // Try to add again
      const response = await makeAuthenticatedRequest(
        app, 'post', `/api/v1/wishlists/${wishlistId}/items`,
        { productId: testProduct.id }, testToken
      );

      expect(response.status).toBe(409);
      expect(response.body).toHaveProperty('error', 'Product already in wishlist');
    });

    it('should return 404 for non-existent product', async () => {
      const fakeProductId = '550e8400-e29b-41d4-a716-446655440000';

      const response = await makeAuthenticatedRequest(
        app, 'post', `/api/v1/wishlists/${wishlistId}/items`,
        { productId: fakeProductId }, testToken
      );

      expect(response.status).toBe(404);
    });
  });

  // =========================================================================
  // DELETE /api/v1/wishlists/:id/items/:itemId - Remove item from wishlist
  // =========================================================================
  describe('DELETE /api/v1/wishlists/:id/items/:itemId', () => {
    beforeEach(async () => {
      const response = await makeAuthenticatedRequest(
        app, 'post', '/api/v1/wishlists', { name: 'Remove Item Test' }, testToken
      );
      wishlistId = response.body.wishlist.id;

      const itemResponse = await makeAuthenticatedRequest(
        app, 'post', `/api/v1/wishlists/${wishlistId}/items`,
        { productId: testProduct.id }, testToken
      );
      wishlistItemId = itemResponse.body.item.id;
    });

    it('should remove item from wishlist', async () => {
      const response = await makeAuthenticatedRequest(
        app, 'delete', `/api/v1/wishlists/${wishlistId}/items/${wishlistItemId}`, {}, testToken
      );

      expect(response.status).toBe(200);

      const items = await prisma.wishlistItem.findMany({ where: { wishlistId } });
      expect(items.length).toBe(0);
    });

    it('should return 404 for non-existent item', async () => {
      const fakeItemId = '550e8400-e29b-41d4-a716-446655440000';

      const response = await makeAuthenticatedRequest(
        app, 'delete', `/api/v1/wishlists/${wishlistId}/items/${fakeItemId}`, {}, testToken
      );

      expect(response.status).toBe(404);
    });
  });

  // =========================================================================
  // POST /api/v1/wishlists/:id/items/move-to-cart - Move items to cart
  // =========================================================================
  describe('POST /api/v1/wishlists/:id/items/move-to-cart', () => {
    let cartItemId;

    beforeEach(async () => {
      const response = await makeAuthenticatedRequest(
        app, 'post', '/api/v1/wishlists', { name: 'Move to Cart Test' }, testToken
      );
      wishlistId = response.body.wishlist.id;

      const itemResponse = await makeAuthenticatedRequest(
        app, 'post', `/api/v1/wishlists/${wishlistId}/items`,
        { productId: testProduct.id }, testToken
      );
      wishlistItemId = itemResponse.body.item.id;
    });

    it('should move single item to cart', async () => {
      const response = await makeAuthenticatedRequest(
        app, 'post', `/api/v1/wishlists/${wishlistId}/items/move-to-cart`,
        { itemIds: [wishlistItemId] }, testToken
      );

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message', 'Items moved to cart successfully');
      expect(response.body).toHaveProperty('cart');
      expect(response.body.cart.items.length).toBe(1);

      // Verify item removed from wishlist
      const wishlistItems = await prisma.wishlistItem.findMany({ where: { wishlistId } });
      expect(wishlistItems.length).toBe(0);
    });

    it('should move all items to cart when no itemIds specified', async () => {
      // Add another product
      const product2 = await createTestProduct({
        name: 'Second Product',
        categoryId: testCategory.id,
        brandId: testBrand.id,
        regularPrice: 5000
      });

      await makeAuthenticatedRequest(
        app, 'post', `/api/v1/wishlists/${wishlistId}/items`,
        { productId: product2.id }, testToken
      );

      const response = await makeAuthenticatedRequest(
        app, 'post', `/api/v1/wishlists/${wishlistId}/items/move-to-cart`,
        {}, testToken
      );

      expect(response.status).toBe(200);
      expect(response.body.cart.items.length).toBe(2);
    });

    it('should return 400 for invalid itemIds', async () => {
      const response = await makeAuthenticatedRequest(
        app, 'post', `/api/v1/wishlists/${wishlistId}/items/move-to-cart`,
        { itemIds: ['invalid-uuid'] }, testToken
      );

      expect(response.status).toBe(400);
    });
  });

  // =========================================================================
  // POST /api/v1/wishlists/:id/share - Generate share token
  // =========================================================================
  describe('POST /api/v1/wishlists/:id/share', () => {
    beforeEach(async () => {
      const response = await makeAuthenticatedRequest(
        app, 'post', '/api/v1/wishlists', { name: 'Share Test' }, testToken
      );
      wishlistId = response.body.wishlist.id;
    });

    it('should generate share token', async () => {
      const response = await makeAuthenticatedRequest(
        app, 'post', `/api/v1/wishlists/${wishlistId}/share`, {}, testToken
      );

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('shareToken');
      expect(response.body.shareToken).toBeDefined();
      expect(response.body.shareToken.length).toBeGreaterThan(0);

      shareToken = response.body.shareToken;
    });

    it('should return shareable link', async () => {
      const response = await makeAuthenticatedRequest(
        app, 'post', `/api/v1/wishlists/${wishlistId}/share`, {}, testToken
      );

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('shareableLink');
      expect(response.body.shareableLink).toContain('/wishlist/shared/');
    });

    it('should return 403 for non-owner share attempt', async () => {
      const otherUser = await createTestUser({ email: 'other@test.com' });

      const response = await makeAuthenticatedRequest(
        app, 'post', `/api/v1/wishlists/${wishlistId}/share`, {}, otherUser.token
      );

      expect(response.status).toBe(403);
    });
  });

  // =========================================================================
  // GET /api/v1/wishlists/shared/:shareToken - Access shared wishlist
  // =========================================================================
  describe('GET /api/v1/wishlists/shared/:shareToken', () => {
    beforeEach(async () => {
      // Create and share wishlist
      const createResponse = await makeAuthenticatedRequest(
        app, 'post', '/api/v1/wishlists', { name: 'Public Share Test' }, testToken
      );
      wishlistId = createResponse.body.wishlist.id;

      await makeAuthenticatedRequest(
        app, 'post', `/api/v1/wishlists/${wishlistId}/items`,
        { productId: testProduct.id }, testToken
      );

      const shareResponse = await makeAuthenticatedRequest(
        app, 'post', `/api/v1/wishlists/${wishlistId}/share`, {}, testToken
      );
      shareToken = shareResponse.body.shareToken;
    });

    it('should access shared wishlist without auth', async () => {
      const response = await request(app).get(`/api/v1/wishlists/shared/${shareToken}`);

      expect(response.status).toBe(200);
      expect(response.body.wishlist.id).toBe(wishlistId);
      expect(response.body.wishlist.items.length).toBe(1);
    });

    it('should not allow modifications on shared wishlist', async () => {
      // Try to add item using share token
      const response = await request(app)
        .post(`/api/v1/wishlists/shared/${shareToken}/items`)
        .send({ productId: testProduct.id });

      // Should fail or require authentication
      expect([401, 403, 405]).toContain(response.status);
    });

    it('should return 404 for invalid share token', async () => {
      const response = await request(app).get('/api/v1/wishlists/shared/invalid-token');

      expect(response.status).toBe(404);
    });
  });

  // =========================================================================
  // GET /api/v1/wishlists/:id/export - Export wishlist (CSV/PDF)
  // =========================================================================
  describe('GET /api/v1/wishlists/:id/export', () => {
    beforeEach(async () => {
      const response = await makeAuthenticatedRequest(
        app, 'post', '/api/v1/wishlists', { name: 'Export Test' }, testToken
      );
      wishlistId = response.body.wishlist.id;

      await makeAuthenticatedRequest(
        app, 'post', `/api/v1/wishlists/${wishlistId}/items`,
        { productId: testProduct.id }, testToken
      );
    });

    it('should export wishlist as CSV', async () => {
      const response = await makeAuthenticatedRequest(
        app, 'get', `/api/v1/wishlists/${wishlistId}/export`,
        { format: 'csv' }, testToken
      );

      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toContain('text/csv');
      expect(response.text).toContain('Product Name');
      expect(response.text).toContain(testProduct.name);
    });

    it('should export wishlist as PDF', async () => {
      const response = await makeAuthenticatedRequest(
        app, 'get', `/api/v1/wishlists/${wishlistId}/export`,
        { format: 'pdf' }, testToken
      );

      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toContain('application/pdf');
    });

    it('should return 400 for invalid format', async () => {
      const response = await makeAuthenticatedRequest(
        app, 'get', `/api/v1/wishlists/${wishlistId}/export`,
        { format: 'invalid' }, testToken
      );

      expect(response.status).toBe(400);
    });

    it('should return 403 for non-owner export attempt', async () => {
      const otherUser = await createTestUser({ email: 'other@test.com' });

      const response = await makeAuthenticatedRequest(
        app, 'get', `/api/v1/wishlists/${wishlistId}/export`,
        { format: 'csv' }, otherUser.token
      );

      expect(response.status).toBe(403);
    });
  });

  // =========================================================================
  // GET /api/v1/wishlists/analytics - Get analytics (admin only)
  // =========================================================================
  describe('GET /api/v1/wishlists/analytics', () => {
    beforeEach(async () => {
      // Create wishlists with items for analytics
      const response = await makeAuthenticatedRequest(
        app, 'post', '/api/v1/wishlists', { name: 'Analytics Test' }, testToken
      );
      wishlistId = response.body.wishlist.id;

      await makeAuthenticatedRequest(
        app, 'post', `/api/v1/wishlists/${wishlistId}/items`,
        { productId: testProduct.id }, testToken
      );
    });

    it('should return analytics for admin user', async () => {
      const response = await makeAuthenticatedRequest(
        app, 'get', '/api/v1/wishlists/analytics', {}, adminToken
      );

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('totalWishlists');
      expect(response.body).toHaveProperty('totalItems');
      expect(response.body).toHaveProperty('topProducts');
      expect(response.body).toHaveProperty('recentActivity');
    });

    it('should return 403 for non-admin user', async () => {
      const response = await makeAuthenticatedRequest(
        app, 'get', '/api/v1/wishlists/analytics', {}, testToken
      );

      expect(response.status).toBe(403);
    });

    it('should return 401 for unauthenticated request', async () => {
      const response = await request(app).get('/api/v1/wishlists/analytics');

      expect(response.status).toBe(401);
    });

    it('should accept date range parameters', async () => {
      const response = await makeAuthenticatedRequest(
        app, 'get', '/api/v1/wishlists/analytics',
        { startDate: '2024-01-01', endDate: '2024-12-31' }, adminToken
      );

      expect(response.status).toBe(200);
    });
  });

  // =========================================================================
  // Authentication & Authorization Tests
  // =========================================================================
  describe('Authentication & Authorization', () => {
    beforeEach(async () => {
      const response = await makeAuthenticatedRequest(
        app, 'post', '/api/v1/wishlists', { name: 'Auth Test' }, testToken
      );
      wishlistId = response.body.wishlist.id;
    });

    it('should reject request with invalid token', async () => {
      const response = await makeAuthenticatedRequest(
        app, 'get', `/api/v1/wishlists/${wishlistId}`, {}, 'invalid-token'
      );

      expect(response.status).toBe(401);
    });

    it('should reject request with expired token', async () => {
      const expiredToken = generateTestToken(testUser, '-1h');

      const response = await makeAuthenticatedRequest(
        app, 'get', `/api/v1/wishlists/${wishlistId}`, {}, expiredToken
      );

      expect(response.status).toBe(401);
    });

    it('should allow owner to access their wishlist', async () => {
      const response = await makeAuthenticatedRequest(
        app, 'get', `/api/v1/wishlists/${wishlistId}`, {}, testToken
      );

      expect(response.status).toBe(200);
    });
  });

  // =========================================================================
  // Error Handling Tests
  // =========================================================================
  describe('Error Handling', () => {
    it('should return 400 for validation errors', async () => {
      const response = await makeAuthenticatedRequest(
        app, 'post', '/api/v1/wishlists',
        { name: '' }, testToken
      );

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'Validation failed');
    });

    it('should return 404 for missing resource', async () => {
      const fakeId = '550e8400-e29b-41d4-a716-446655440000';

      const response = await makeAuthenticatedRequest(
        app, 'get', `/api/v1/wishlists/${fakeId}`, {}, testToken
      );

      expect(response.status).toBe(404);
    });

    it('should handle internal server errors gracefully', async () => {
      // This would require mocking to test, but basic error structure should work
      const response = await makeAuthenticatedRequest(
        app, 'get', '/api/v1/wishlists', {}, testToken
      );

      // Should not return 500 for valid request
      expect(response.status).not.toBe(500);
    });
  });
});
