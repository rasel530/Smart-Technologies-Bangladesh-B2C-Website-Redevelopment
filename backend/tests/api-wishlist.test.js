/**
 * Basic Wishlist Operations Test Suite
 * 
 * This test suite covers fundamental wishlist functionality including:
 * - Creating wishlists
 * - Adding items to wishlists
 * - Viewing wishlist contents
 * - Removing items from wishlists
 * - Updating wishlist items
 * - Deleting wishlists
 * - Multiple wishlist management
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

describe('Wishlist Basic Operations', () => {
  let testUser, testToken, testProduct, testCategory, testBrand;
  let wishlistId, wishlistItemId;

  /**
   * Test setup - Create test data before each test
   */
  beforeEach(async () => {
    // Create test user
    const userResult = await createTestUser({
      email: 'wishlist.test@example.com',
      firstName: 'Wishlist',
      lastName: 'Test'
    });
    testUser = userResult.user;
    testToken = userResult.token;

    // Create test category and brand
    testCategory = await createTestCategory({
      name: 'Test Electronics',
      slug: 'test-electronics'
    });
    testBrand = await createTestBrand({
      name: 'Test Brand',
      slug: 'test-brand'
    });

    // Create test product
    testProduct = await createTestProduct({
      name: 'Test Smartphone',
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
   * Test creating a new wishlist
   */
  describe('POST /api/v1/wishlist', () => {
    it('should create a new wishlist with default name', async () => {
      const response = await makeAuthenticatedRequest(
        app, 
        'post', 
        '/api/v1/wishlist', 
        {}, 
        testToken
      );

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('message', 'Wishlist created successfully');
      expect(response.body).toHaveProperty('wishlist');
      expect(response.body.wishlist.name).toBe('My Wishlist');
      expect(response.body.wishlist.isPrivate).toBe(false);
      expect(response.body.wishlist.userId).toBe(testUser.id);

      wishlistId = response.body.wishlist.id;
    });

    it('should create a new wishlist with custom name and privacy settings', async () => {
      const wishlistData = {
        name: 'Eid Gifts 2024',
        isPrivate: true
      };

      const response = await makeAuthenticatedRequest(
        app, 
        'post', 
        '/api/v1/wishlist', 
        wishlistData, 
        testToken
      );

      expect(response.status).toBe(201);
      expect(response.body.wishlist.name).toBe('Eid Gifts 2024');
      expect(response.body.wishlist.isPrivate).toBe(true);
    });

    it('should return 400 for invalid wishlist data', async () => {
      const invalidData = {
        name: '', // Empty name
        isPrivate: 'not-a-boolean'
      };

      const response = await makeAuthenticatedRequest(
        app, 
        'post', 
        '/api/v1/wishlist', 
        invalidData, 
        testToken
      );

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'Validation failed');
    });

    it('should return 401 for unauthenticated request', async () => {
      const response = await request(app)
        .post('/api/v1/wishlist')
        .send({ name: 'Test Wishlist' });

      expect(response.status).toBe(401);
    });
  });

  /**
   * Test adding items to wishlist
   */
  describe('POST /api/v1/wishlist/:id/items', () => {
    beforeEach(async () => {
      // Create a wishlist for item tests
      const wishlistResponse = await makeAuthenticatedRequest(
        app, 
        'post', 
        '/api/v1/wishlist', 
        { name: 'Test Wishlist' }, 
        testToken
      );
      wishlistId = wishlistResponse.body.wishlist.id;
    });

    it('should add item to wishlist successfully', async () => {
      const response = await makeAuthenticatedRequest(
        app, 
        'post', 
        `/api/v1/wishlist/${wishlistId}/items`, 
        { productId: testProduct.id }, 
        testToken
      );

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('message', 'Item added to wishlist');
      expect(response.body).toHaveProperty('item');
      expect(response.body.item.productId).toBe(testProduct.id);
      expect(response.body.item.wishlistId).toBe(wishlistId);

      wishlistItemId = response.body.item.id;
    });

    it('should return 404 for non-existent wishlist', async () => {
      const fakeWishlistId = '550e8400-e29b-41d4-a716-446655440000';
      
      const response = await makeAuthenticatedRequest(
        app, 
        'post', 
        `/api/v1/wishlist/${fakeWishlistId}/items`, 
        { productId: testProduct.id }, 
        testToken
      );

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error', 'Wishlist not found');
    });

    it('should return 404 for non-existent product', async () => {
      const fakeProductId = '550e8400-e29b-41d4-a716-446655440001';
      
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

    it('should return 409 for duplicate item in wishlist', async () => {
      // Add item first time
      await makeAuthenticatedRequest(
        app, 
        'post', 
        `/api/v1/wishlist/${wishlistId}/items`, 
        { productId: testProduct.id }, 
        testToken
      );

      // Try to add same item again
      const response = await makeAuthenticatedRequest(
        app, 
        'post', 
        `/api/v1/wishlist/${wishlistId}/items`, 
        { productId: testProduct.id }, 
        testToken
      );

      expect(response.status).toBe(409);
      expect(response.body).toHaveProperty('error', 'Product already in wishlist');
    });
  });

  /**
   * Test retrieving user's wishlists
   */
  describe('GET /api/v1/wishlist/user/:userId', () => {
    beforeEach(async () => {
      // Create multiple wishlists for testing
      await makeAuthenticatedRequest(
        app, 
        'post', 
        '/api/v1/wishlist', 
        { name: 'Eid Gifts' }, 
        testToken
      );
      await makeAuthenticatedRequest(
        app, 
        'post', 
        '/api/v1/wishlist', 
        { name: 'Birthday Ideas' }, 
        testToken
      );
    });

    it('should retrieve user\'s wishlists successfully', async () => {
      const response = await makeAuthenticatedRequest(
        app, 
        'get', 
        `/api/v1/wishlist/user/${testUser.id}`, 
        {}, 
        testToken
      );

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('wishlists');
      expect(Array.isArray(response.body.wishlists)).toBe(true);
      expect(response.body.wishlists.length).toBeGreaterThan(0);
      
      // Check wishlist structure
      const wishlist = response.body.wishlists[0];
      expect(wishlist).toHaveProperty('id');
      expect(wishlist).toHaveProperty('name');
      expect(wishlist).toHaveProperty('isPrivate');
      expect(wishlist).toHaveProperty('createdAt');
      expect(wishlist).toHaveProperty('_count');
      expect(wishlist._count).toHaveProperty('items');
    });

    it('should return empty array for user with no wishlists', async () => {
      // Create another user with no wishlists
      const newUserResult = await createTestUser({
        email: 'new.user@example.com'
      });

      const response = await makeAuthenticatedRequest(
        app, 
        'get', 
        `/api/v1/wishlist/user/${newUserResult.user.id}`, 
        {}, 
        newUserResult.token
      );

      expect(response.status).toBe(200);
      expect(response.body.wishlists).toEqual([]);
    });

    it('should return 403 for unauthorized access to other user\'s wishlists', async () => {
      const otherUserResult = await createTestUser({
        email: 'other.user@example.com'
      });

      const response = await makeAuthenticatedRequest(
        app, 
        'get', 
        `/api/v1/wishlist/user/${otherUserResult.user.id}`, 
        {}, 
        testToken
      );

      expect(response.status).toBe(403);
    });
  });

  /**
   * Test retrieving specific wishlist by ID
   */
  describe('GET /api/v1/wishlist/:id', () => {
    beforeEach(async () => {
      // Create wishlist with items
      const wishlistResponse = await makeAuthenticatedRequest(
        app, 
        'post', 
        '/api/v1/wishlist', 
        { name: 'Test Wishlist with Items' }, 
        testToken
      );
      wishlistId = wishlistResponse.body.wishlist.id;

      // Add item to wishlist
      await makeAuthenticatedRequest(
        app, 
        'post', 
        `/api/v1/wishlist/${wishlistId}/items`, 
        { productId: testProduct.id }, 
        testToken
      );
    });

    it('should retrieve specific wishlist with items', async () => {
      const response = await makeAuthenticatedRequest(
        app, 
        'get', 
        `/api/v1/wishlist/${wishlistId}`, 
        {}, 
        testToken
      );

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('wishlist');
      expect(response.body.wishlist.id).toBe(wishlistId);
      expect(response.body.wishlist.name).toBe('Test Wishlist with Items');
      expect(response.body.wishlist.items).toBeDefined();
      expect(Array.isArray(response.body.wishlist.items)).toBe(true);
      expect(response.body.wishlist.items.length).toBe(1);
      
      // Check item structure
      const item = response.body.wishlist.items[0];
      expect(item).toHaveProperty('id');
      expect(item).toHaveProperty('productId');
      expect(item).toHaveProperty('addedAt');
      expect(item).toHaveProperty('product');
      expect(item.product.id).toBe(testProduct.id);
    });

    it('should return 404 for non-existent wishlist', async () => {
      const fakeWishlistId = '550e8400-e29b-41d4-a716-446655440000';
      
      const response = await makeAuthenticatedRequest(
        app, 
        'get', 
        `/api/v1/wishlist/${fakeWishlistId}`, 
        {}, 
        testToken
      );

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error', 'Wishlist not found');
    });
  });

  /**
   * Test removing items from wishlist
   */
  describe('DELETE /api/v1/wishlist/:wishlistId/items/:itemId', () => {
    beforeEach(async () => {
      // Create wishlist and add item
      const wishlistResponse = await makeAuthenticatedRequest(
        app, 
        'post', 
        '/api/v1/wishlist', 
        { name: 'Test Wishlist' }, 
        testToken
      );
      wishlistId = wishlistResponse.body.wishlist.id;

      const itemResponse = await makeAuthenticatedRequest(
        app, 
        'post', 
        `/api/v1/wishlist/${wishlistId}/items`, 
        { productId: testProduct.id }, 
        testToken
      );
      wishlistItemId = itemResponse.body.item.id;
    });

    it('should remove item from wishlist successfully', async () => {
      const response = await makeAuthenticatedRequest(
        app, 
        'delete', 
        `/api/v1/wishlist/${wishlistId}/items/${wishlistItemId}`, 
        {}, 
        testToken
      );

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message', 'Item removed from wishlist');

      // Verify item is removed
      const wishlistResponse = await makeAuthenticatedRequest(
        app, 
        'get', 
        `/api/v1/wishlist/${wishlistId}`, 
        {}, 
        testToken
      );
      expect(wishlistResponse.body.wishlist.items).toHaveLength(0);
    });

    it('should return 404 for non-existent wishlist item', async () => {
      const fakeItemId = '550e8400-e29b-41d4-a716-446655440000';
      
      const response = await makeAuthenticatedRequest(
        app, 
        'delete', 
        `/api/v1/wishlist/${wishlistId}/items/${fakeItemId}`, 
        {}, 
        testToken
      );

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error', 'Wishlist item not found');
    });
  });

  /**
   * Test deleting entire wishlist
   */
  describe('DELETE /api/v1/wishlist/:id', () => {
    beforeEach(async () => {
      // Create wishlist with items
      const wishlistResponse = await makeAuthenticatedRequest(
        app, 
        'post', 
        '/api/v1/wishlist', 
        { name: 'Test Wishlist to Delete' }, 
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

    it('should delete wishlist successfully', async () => {
      const response = await makeAuthenticatedRequest(
        app, 
        'delete', 
        `/api/v1/wishlist/${wishlistId}`, 
        {}, 
        testToken
      );

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message', 'Wishlist deleted successfully');

      // Verify wishlist is deleted
      const getResponse = await makeAuthenticatedRequest(
        app, 
        'get', 
        `/api/v1/wishlist/${wishlistId}`, 
        {}, 
        testToken
      );
      expect(getResponse.status).toBe(404);
    });

    it('should return 404 for non-existent wishlist', async () => {
      const fakeWishlistId = '550e8400-e29b-41d4-a716-446655440000';
      
      const response = await makeAuthenticatedRequest(
        app, 
        'delete', 
        `/api/v1/wishlist/${fakeWishlistId}`, 
        {}, 
        testToken
      );

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error', 'Wishlist not found');
    });
  });

  /**
   * Test multiple wishlist management
   */
  describe('Multiple Wishlist Management', () => {
    let eidWishlistId, birthdayWishlistId;

    beforeEach(async () => {
      // Create multiple wishlists
      const eidResponse = await makeAuthenticatedRequest(
        app, 
        'post', 
        '/api/v1/wishlist', 
        { name: 'Eid Gifts 2024' }, 
        testToken
      );
      eidWishlistId = eidResponse.body.wishlist.id;

      const birthdayResponse = await makeAuthenticatedRequest(
        app, 
        'post', 
        '/api/v1/wishlist', 
        { name: 'Birthday Ideas' }, 
        testToken
      );
      birthdayWishlistId = birthdayResponse.body.wishlist.id;

      // Create additional products
      const laptopProduct = await createTestProduct({
        name: 'Test Laptop',
        categoryId: testCategory.id,
        brandId: testBrand.id,
        regularPrice: 45000
      });

      // Add different items to different wishlists
      await makeAuthenticatedRequest(
        app, 
        'post', 
        `/api/v1/wishlist/${eidWishlistId}/items`, 
        { productId: testProduct.id }, 
        testToken
      );
      await makeAuthenticatedRequest(
        app, 
        'post', 
        `/api/v1/wishlist/${birthdayWishlistId}/items`, 
        { productId: laptopProduct.id }, 
        testToken
      );
    });

    it('should manage multiple wishlists independently', async () => {
      // Get all user wishlists
      const userWishlistsResponse = await makeAuthenticatedRequest(
        app, 
        'get', 
        `/api/v1/wishlist/user/${testUser.id}`, 
        {}, 
        testToken
      );

      expect(userWishlistsResponse.body.wishlists).toHaveLength(2);

      // Check Eid wishlist
      const eidWishlistResponse = await makeAuthenticatedRequest(
        app, 
        'get', 
        `/api/v1/wishlist/${eidWishlistId}`, 
        {}, 
        testToken
      );
      expect(eidWishlistResponse.body.wishlist.name).toBe('Eid Gifts 2024');
      expect(eidWishlistResponse.body.wishlist.items).toHaveLength(1);

      // Check Birthday wishlist
      const birthdayWishlistResponse = await makeAuthenticatedRequest(
        app, 
        'get', 
        `/api/v1/wishlist/${birthdayWishlistId}`, 
        {}, 
        testToken
      );
      expect(birthdayWishlistResponse.body.wishlist.name).toBe('Birthday Ideas');
      expect(birthdayWishlistResponse.body.wishlist.items).toHaveLength(1);

      // Verify items are different
      const eidItem = eidWishlistResponse.body.wishlist.items[0];
      const birthdayItem = birthdayWishlistResponse.body.wishlist.items[0];
      expect(eidItem.productId).not.toBe(birthdayItem.productId);
    });
  });

  /**
   * Test Bangladesh-specific wishlist operations
   */
  describe('Bangladesh-Specific Wishlist Operations', () => {
    let bdProducts, bdUser;

    beforeEach(async () => {
      // Create Bangladesh-specific products
      bdProducts = await createBangladeshWishlistProducts();
      
      // Create Bangladesh user
      bdUser = await createBangladeshWishlistUser('urbanProfessional');
      const bdToken = generateTestToken(bdUser);
      testToken = bdToken;
      testUser = bdUser;
    });

    it('should create festival-based wishlist with Bangladesh products', async () => {
      const festivalWishlist = await createFestivalWishlist(
        bdUser.id, 
        'eidUlFitr', 
        bdProducts.slice(0, 3)
      );

      expect(festivalWishlist.name).toBe('Eid-ul-Fitr Gifts');
      expect(festivalWishlist.items).toHaveLength(3);
      
      // Verify Bangladesh-specific products are included
      const productNames = festivalWishlist.items.map(item => item.product.name);
      expect(productNames).toContain('Samsung Galaxy A54 5G');
      expect(productNames).toContain('Handloom Jamdani Saree');
    });

    it('should handle BDT pricing correctly in wishlist operations', async () => {
      const highValueProduct = bdProducts.find(p => p.name === '22K Gold Necklace');
      
      const wishlistResponse = await makeAuthenticatedRequest(
        app, 
        'post', 
        '/api/v1/wishlist', 
        { name: 'Luxury Gifts' }, 
        testToken
      );
      
      await makeAuthenticatedRequest(
        app, 
        'post', 
        `/api/v1/wishlist/${wishlistResponse.body.wishlist.id}/items`, 
        { productId: highValueProduct.id }, 
        testToken
      );

      const wishlistWithItems = await makeAuthenticatedRequest(
        app, 
        'get', 
        `/api/v1/wishlist/${wishlistResponse.body.wishlist.id}`, 
        {}, 
        testToken
      );

      const item = wishlistWithItems.body.wishlist.items[0];
      expect(parseFloat(item.product.regularPrice)).toBe(85000); // BDT
    });
  });
});