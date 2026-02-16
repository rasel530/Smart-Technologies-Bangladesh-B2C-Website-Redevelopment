/**
 * Wishlist Integration Test Suite
 * 
 * This test suite covers end-to-end wishlist workflows:
 * - Create wishlist → Add items → Move to cart
 * - Create wishlist → Share → Access shared wishlist
 * - Export workflows
 * - Cascade delete behavior
 * - Default wishlist management
 * - Analytics tracking
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

describe('Wishlist Integration Tests', () => {
  let testUser, testToken, testProducts = [];
  let testCategory, testBrand;
  let wishlistId;

  beforeAll(async () => {
    // Create test user
    const userResult = await createTestUser({
      email: 'wishlist.integration@test.com',
      firstName: 'Integration',
      lastName: 'Test'
    });
    testUser = userResult.user;
    testToken = userResult.token;

    // Create test category and brand
    testCategory = await createTestCategory({
      name: 'Integration Test Electronics',
      slug: 'integration-test-electronics'
    });
    testBrand = await createTestBrand({
      name: 'Integration Test Brand',
      slug: 'integration-test-brand'
    });

    // Create test products
    for (let i = 0; i < 5; i++) {
      const product = await createTestProduct({
        name: `Integration Test Product ${i}`,
        categoryId: testCategory.id,
        brandId: testBrand.id,
        regularPrice: 10000 + (i * 1000),
        stockQuantity: 50 - i
      });
      testProducts.push(product);
    }
  });

  afterAll(async () => {
    await cleanupTestData(['wishlist', 'wishlistItem', 'wishlistAnalytics', 'product', 'category', 'brand', 'user', 'cart', 'cartItem']);
  });

  /**
   * Test: Create wishlist → Add items → Move to cart
   */
  describe('Wishlist to Cart Workflow', () => {
    it('should create wishlist, add items, and move to cart', async () => {
      // Step 1: Create wishlist
      const createResponse = await makeAuthenticatedRequest(
        app, 'post', '/api/v1/wishlist',
        { name: 'Integration Test Wishlist' },
        testToken
      );

      expect(createResponse.status).toBe(201);
      wishlistId = createResponse.body.wishlist.id;

      // Step 2: Add products to wishlist
      const itemIds = [];
      for (const product of testProducts) {
        const addResponse = await makeAuthenticatedRequest(
          app, 'post', `/api/v1/wishlist/${wishlistId}/items`,
          { productId: product.id },
          testToken
        );

        expect(addResponse.status).toBe(201);
        itemIds.push(addResponse.body.item.id);
      }

      // Verify items added
      const wishlistResponse = await makeAuthenticatedRequest(
        app, 'get', `/api/v1/wishlist/${wishlistId}`,
        {}, testToken
      );

      expect(wishlistResponse.body.wishlist.items.length).toBe(5);

      // Step 3: Move items to cart
      const cartResponse = await makeAuthenticatedRequest(
        app, 'post', `/api/v1/wishlist/${wishlistId}/items/move-to-cart`,
        { itemIds: [itemIds[0], itemIds[1]] },
        testToken
      );

      expect(cartResponse.status).toBe(200);
      expect(cartResponse.body.cart.items.length).toBe(2);

      // Step 4: Verify items removed from wishlist
      const updatedWishlistResponse = await makeAuthenticatedRequest(
        app, 'get', `/api/v1/wishlist/${wishlistId}`,
        {}, testToken
      );

      expect(updatedWishlistResponse.body.wishlist.items.length).toBe(3);

      // Step 5: Verify cart has correct items
      const cartItems = await prisma.cartItem.findMany({
        where: { cart: { userId: testUser.id } }
      });

      expect(cartItems.length).toBe(2);
    });
  });

  /**
   * Test: Create wishlist → Share → Access shared wishlist
   */
  describe('Wishlist Sharing Workflow', () => {
    it('should create wishlist, generate share token, and allow read-only access', async () => {
      // Step 1: Create wishlist
      const createResponse = await makeAuthenticatedRequest(
        app, 'post', '/api/v1/wishlist',
        { name: 'Share Test Wishlist', isPublic: true },
        testToken
      );

      expect(createResponse.status).toBe(201);
      const shareWishlistId = createResponse.body.wishlist.id;

      // Step 2: Add items
      await makeAuthenticatedRequest(
        app, 'post', `/api/v1/wishlist/${shareWishlistId}/items`,
        { productId: testProducts[0].id },
        testToken
      );

      // Step 3: Generate share token
      const shareResponse = await makeAuthenticatedRequest(
        app, 'post', `/api/v1/wishlist/${shareWishlistId}/share`,
        {}, testToken
      );

      expect(shareResponse.status).toBe(200);
      const shareToken = shareResponse.body.shareToken;

      // Step 4: Access shared wishlist (no auth required)
      const sharedResponse = await request(app)
        .get(`/api/v1/wishlist/shared/${shareToken}`);

      expect(sharedResponse.status).toBe(200);
      expect(sharedResponse.body.wishlist.id).toBe(shareWishlistId);
      expect(sharedResponse.body.wishlist.items.length).toBe(1);

      // Step 5: Verify read-only access (cannot modify)
      const modifyResponse = await request(app)
        .post(`/api/v1/wishlist/shared/${shareToken}/items`)
        .send({ productId: testProducts[1].id });

      expect([401, 403, 405]).toContain(modifyResponse.status);

      // Step 6: Analytics should track share event
      const analytics = await prisma.wishlistAnalytics.findMany({
        where: { wishlistId: shareWishlistId, eventType: 'share' }
      });

      expect(analytics.length).toBeGreaterThan(0);
    });
  });

  /**
   * Test: Export wishlist as CSV/PDF
   */
  describe('Wishlist Export Workflow', () => {
    beforeEach(async () => {
      const createResponse = await makeAuthenticatedRequest(
        app, 'post', '/api/v1/wishlist',
        { name: 'Export Test Wishlist' },
        testToken
      );
      wishlistId = createResponse.body.wishlist.id;

      for (const product of testProducts.slice(0, 3)) {
        await makeAuthenticatedRequest(
          app, 'post', `/api/v1/wishlist/${wishlistId}/items`,
          { productId: product.id },
          testToken
        );
      }
    });

    it('should export wishlist as CSV with correct format', async () => {
      const response = await makeAuthenticatedRequest(
        app, 'get', `/api/v1/wishlist/${wishlistId}/export`,
        { format: 'csv' },
        testToken
      );

      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toContain('text/csv');

      // Verify CSV content
      const lines = response.text.trim().split('\n');
      expect(lines.length).toBeGreaterThan(1); // Header + data rows

      expect(lines[0]).toContain('Product Name');
      expect(lines[0]).toContain('Price');
      expect(lines[0]).toContain('Quantity');

      // Analytics should track export event
      const analytics = await prisma.wishlistAnalytics.findMany({
        where: { wishlistId, eventType: 'export' }
      });

      expect(analytics.length).toBeGreaterThan(0);
    });

    it('should export wishlist as PDF', async () => {
      const response = await makeAuthenticatedRequest(
        app, 'get', `/api/v1/wishlist/${wishlistId}/export`,
        { format: 'pdf' },
        testToken
      );

      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toContain('application/pdf');
    });
  });

  /**
   * Test: Cascade delete behavior
   */
  describe('Cascade Delete Behavior', () => {
    it('should delete wishlist and cascade delete items', async () => {
      // Create wishlist with items
      const createResponse = await makeAuthenticatedRequest(
        app, 'post', '/api/v1/wishlist',
        { name: 'Cascade Delete Test' },
        testToken
      );
      const deleteWishlistId = createResponse.body.wishlist.id;

      // Add items
      for (const product of testProducts.slice(0, 2)) {
        await makeAuthenticatedRequest(
          app, 'post', `/api/v1/wishlist/${deleteWishlistId}/items`,
          { productId: product.id },
          testToken
        );
      }

      // Add analytics
      await prisma.wishlistAnalytics.create({
        data: {
          wishlistId: deleteWishlistId,
          eventType: 'view',
          userId: testUser.id
        }
      });

      // Verify data exists
      let items = await prisma.wishlistItem.findMany({
        where: { wishlistId: deleteWishlistId }
      });
      expect(items.length).toBe(2);

      let analytics = await prisma.wishlistAnalytics.findMany({
        where: { wishlistId: deleteWishlistId }
      });
      expect(analytics.length).toBe(1);

      // Delete wishlist
      const deleteResponse = await makeAuthenticatedRequest(
        app, 'delete', `/api/v1/wishlist/${deleteWishlistId}`,
        {}, testToken
      );
      expect(deleteResponse.status).toBe(200);

      // Verify cascade delete
      const wishlist = await prisma.wishlist.findUnique({
        where: { id: deleteWishlistId }
      });
      expect(wishlist).toBeNull();

      items = await prisma.wishlistItem.findMany({
        where: { wishlistId: deleteWishlistId }
      });
      expect(items.length).toBe(0);

      analytics = await prisma.wishlistAnalytics.findMany({
        where: { wishlistId: deleteWishlistId }
      });
      expect(analytics.length).toBe(0);
    });
  });

  /**
   * Test: Default wishlist management
   */
  describe('Default Wishlist Management', () => {
    it('should manage default wishlist per user', async () => {
      // Create first wishlist (not default)
      const wishlist1 = await makeAuthenticatedRequest(
        app, 'post', '/api/v1/wishlist',
        { name: 'First Wishlist', isDefault: false },
        testToken
      );

      // Create second wishlist as default
      const wishlist2 = await makeAuthenticatedRequest(
        app, 'post', '/api/v1/wishlist',
        { name: 'Default Wishlist', isDefault: true },
        testToken
      );

      // Verify only one default
      const defaults = await prisma.wishlist.findMany({
        where: { userId: testUser.id, isDefault: true }
      });
      expect(defaults.length).toBe(1);
      expect(defaults[0].id).toBe(wishlist2.body.wishlist.id);

      // Make first wishlist default (should unset previous)
      const updateResponse = await makeAuthenticatedRequest(
        app, 'put', `/api/v1/wishlist/${wishlist1.body.wishlist.id}`,
        { isDefault: true },
        testToken
      );

      expect(updateResponse.status).toBe(200);
      expect(updateResponse.body.wishlist.isDefault).toBe(true);

      // Verify only one default still
      const updatedDefaults = await prisma.wishlist.findMany({
        where: { userId: testUser.id, isDefault: true }
      });
      expect(updatedDefaults.length).toBe(1);
      expect(updatedDefaults[0].id).toBe(wishlist1.body.wishlist.id);
    });
  });

  /**
   * Test: Add to wishlist from product page
   */
  describe('Add to Wishlist from Product Page', () => {
    it('should add product to default wishlist', async () => {
      // Create default wishlist
      const defaultWishlist = await makeAuthenticatedRequest(
        app, 'post', '/api/v1/wishlist',
        { name: 'Default', isDefault: true },
        testToken
      );

      const defaultId = defaultWishlist.body.wishlist.id;

      // Add product to wishlist
      const addResponse = await makeAuthenticatedRequest(
        app, 'post', `/api/v1/wishlist/${defaultId}/items`,
        { productId: testProducts[2].id },
        testToken
      );

      expect(addResponse.status).toBe(201);

      // Verify product added to default
      const wishlistResponse = await makeAuthenticatedRequest(
        app, 'get', `/api/v1/wishlist/${defaultId}`,
        {}, testToken
      );

      const productIds = wishlistResponse.body.wishlist.items.map(i => i.productId);
      expect(productIds).toContain(testProducts[2].id);
    });

    it('should prevent duplicate products in same wishlist', async () => {
      // Create wishlist
      const createResponse = await makeAuthenticatedRequest(
        app, 'post', '/api/v1/wishlist',
        { name: 'Duplicate Test' },
        testToken
      );
      const wishlistId = createResponse.body.wishlist.id;

      // Add product first time
      await makeAuthenticatedRequest(
        app, 'post', `/api/v1/wishlist/${wishlistId}/items`,
        { productId: testProducts[3].id },
        testToken
      );

      // Try to add same product again
      const duplicateResponse = await makeAuthenticatedRequest(
        app, 'post', `/api/v1/wishlist/${wishlistId}/items`,
        { productId: testProducts[3].id },
        testToken
      );

      expect(duplicateResponse.status).toBe(409);
      expect(duplicateResponse.body.error).toContain('already in wishlist');
    });
  });

  /**
   * Test: Analytics tracking
   */
  describe('Analytics Tracking', () => {
    it('should track view events', async () => {
      // Create wishlist
      const createResponse = await makeAuthenticatedRequest(
        app, 'post', '/api/v1/wishlist',
        { name: 'Analytics Test' },
        testToken
      );
      const analyticsWishlistId = createResponse.body.wishlist.id;

      // View wishlist
      await makeAuthenticatedRequest(
        app, 'get', `/api/v1/wishlist/${analyticsWishlistId}`,
        {}, testToken
      );

      // Verify analytics recorded
      const analytics = await prisma.wishlistAnalytics.findMany({
        where: {
          wishlistId: analyticsWishlistId,
          eventType: 'view'
        }
      });

      expect(analytics.length).toBeGreaterThan(0);
    });

    it('should track add_item events', async () => {
      // Create wishlist
      const createResponse = await makeAuthenticatedRequest(
        app, 'post', '/api/v1/wishlist',
        { name: 'Add Analytics Test' },
        testToken
      );
      const wishlistId = createResponse.body.wishlist.id;

      // Add item
      await makeAuthenticatedRequest(
        app, 'post', `/api/v1/wishlist/${wishlistId}/items`,
        { productId: testProducts[4].id },
        testToken
      );

      // Verify add_item analytics
      const analytics = await prisma.wishlistAnalytics.findMany({
        where: {
          wishlistId,
          eventType: 'add_item'
        }
      });

      expect(analytics.length).toBeGreaterThan(0);
    });

    it('should track remove_item events', async () => {
      // Create wishlist with item
      const createResponse = await makeAuthenticatedRequest(
        app, 'post', '/api/v1/wishlist',
        { name: 'Remove Analytics Test' },
        testToken
      );
      const wishlistId = createResponse.body.wishlist.id;

      const itemResponse = await makeAuthenticatedRequest(
        app, 'post', `/api/v1/wishlist/${wishlistId}/items`,
        { productId: testProducts[0].id },
        testToken
      );
      const itemId = itemResponse.body.item.id;

      // Remove item
      await makeAuthenticatedRequest(
        app, 'delete', `/api/v1/wishlist/${wishlistId}/items/${itemId}`,
        {}, testToken
      );

      // Verify remove_item analytics
      const analytics = await prisma.wishlistAnalytics.findMany({
        where: {
          wishlistId,
          eventType: 'remove_item'
        }
      });

      expect(analytics.length).toBeGreaterThan(0);
    });
  });

  /**
   * Test: Public wishlist sharing
   */
  describe('Public Wishlist Sharing', () => {
    it('should generate public share token', async () => {
      // Create public wishlist
      const createResponse = await makeAuthenticatedRequest(
        app, 'post', '/api/v1/wishlist',
        { name: 'Public Share Test', isPublic: true },
        testToken
      );
      const publicWishlistId = createResponse.body.wishlist.id;

      // Add items
      await makeAuthenticatedRequest(
        app, 'post', `/api/v1/wishlist/${publicWishlistId}/items`,
        { productId: testProducts[0].id },
        testToken
      );

      // Generate share token
      const shareResponse = await makeAuthenticatedRequest(
        app, 'post', `/api/v1/wishlist/${publicWishlistId}/share`,
        {}, testToken
      );

      expect(shareResponse.status).toBe(200);
      expect(shareResponse.body.shareToken).toBeDefined();

      // Verify public access works
      const publicResponse = await request(app)
        .get(`/api/v1/wishlist/shared/${shareResponse.body.shareToken}`);

      expect(publicResponse.status).toBe(200);
      expect(publicResponse.body.wishlist.isPublic).toBe(true);
    });

    it('should track public view count', async () => {
      // Create and share wishlist
      const createResponse = await makeAuthenticatedRequest(
        app, 'post', '/api/v1/wishlist',
        { name: 'View Count Test', isPublic: true },
        testToken
      );
      const wishlistId = createResponse.body.wishlist.id;

      const shareResponse = await makeAuthenticatedRequest(
        app, 'post', `/api/v1/wishlist/${wishlistId}/share`,
        {}, testToken
      );

      // Multiple public accesses
      for (let i = 0; i < 3; i++) {
        await request(app)
          .get(`/api/v1/wishlist/shared/${shareResponse.body.shareToken}`);
      }

      // Verify view analytics
      const viewAnalytics = await prisma.wishlistAnalytics.findMany({
        where: { wishlistId, eventType: 'view' }
      });

      expect(viewAnalytics.length).toBeGreaterThanOrEqual(3);
    });
  });
});
