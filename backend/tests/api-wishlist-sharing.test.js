/**
 * Wishlist Sharing Functionality Test Suite
 * 
 * This test suite covers wishlist sharing features including:
 * - Creating public and private wishlists
 * - Generating shareable links
 * - Email sharing functionality
 * - Social media sharing
 * - Collaborative wishlists
 * - Access controls and permissions
 * - Privacy settings management
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
  BANGLADESH_WISHLIST_PRODUCTS,
  BANGLADESH_FESTIVAL_WISHLISTS
} = require('./bangladesh-wishlist-fixtures.test');

const app = require('../index');
const prisma = new PrismaClient();

// Mock email service
jest.mock('../services/email-service', () => ({
  sendWishlistShareEmail: jest.fn().mockResolvedValue({ success: true }),
  sendCollaborationInvite: jest.fn().mockResolvedValue({ success: true })
}));

// Mock social media sharing
jest.mock('../services/social-service', () => ({
  generateFacebookShareLink: jest.fn().mockReturnValue('https://facebook.com/share/test'),
  generateTwitterShareLink: jest.fn().mockReturnValue('https://twitter.com/intent/tweet/test'),
  generateWhatsAppShareLink: jest.fn().mockReturnValue('https://wa.me/share/test')
}));

describe('Wishlist Sharing Functionality', () => {
  let testUser, testToken, testProduct, testCategory, testBrand;
  let publicWishlistId, privateWishlistId, sharedWishlistId;
  let collaboratorUser, collaboratorToken;

  /**
   * Test setup - Create test data before each test
   */
  beforeEach(async () => {
    // Create main test user
    const userResult = await createTestUser({
      email: 'wishlist.owner@example.com',
      firstName: 'Wishlist',
      lastName: 'Owner'
    });
    testUser = userResult.user;
    testToken = userResult.token;

    // Create collaborator user
    const collaboratorResult = await createTestUser({
      email: 'collaborator@example.com',
      firstName: 'Collaborator',
      lastName: 'User'
    });
    collaboratorUser = collaboratorResult.user;
    collaboratorToken = collaboratorResult.token;

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
   * Test creating public wishlists
   */
  describe('Public Wishlist Creation', () => {
    it('should create a public wishlist successfully', async () => {
      const wishlistData = {
        name: 'Public Eid Gifts',
        isPrivate: false
      };

      const response = await makeAuthenticatedRequest(
        app, 
        'post', 
        '/api/v1/wishlist', 
        wishlistData, 
        testToken
      );

      expect(response.status).toBe(201);
      expect(response.body.wishlist.isPrivate).toBe(false);
      expect(response.body.wishlist.name).toBe('Public Eid Gifts');
      
      publicWishlistId = response.body.wishlist.id;
    });

    it('should generate shareable link for public wishlist', async () => {
      // Create public wishlist first
      const wishlistResponse = await makeAuthenticatedRequest(
        app, 
        'post', 
        '/api/v1/wishlist', 
        { name: 'Shareable Wishlist', isPrivate: false }, 
        testToken
      );
      const wishlistId = wishlistResponse.body.wishlist.id;

      // Add item to wishlist
      await makeAuthenticatedRequest(
        app, 
        'post', 
        `/api/v1/wishlist/${wishlistId}/items`, 
        { productId: testProduct.id }, 
        testToken
      );

      // Generate shareable link
      const response = await makeAuthenticatedRequest(
        app, 
        'post', 
        `/api/v1/wishlist/${wishlistId}/share`, 
        { type: 'public' }, 
        testToken
      );

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('shareableLink');
      expect(response.body).toHaveProperty('shareToken');
      expect(response.body.shareableLink).toContain('/wishlist/shared/');
    });
  });

  /**
   * Test creating private wishlists
   */
  describe('Private Wishlist Creation', () => {
    it('should create a private wishlist successfully', async () => {
      const wishlistData = {
        name: 'Private Birthday Ideas',
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
      expect(response.body.wishlist.isPrivate).toBe(true);
      expect(response.body.wishlist.name).toBe('Private Birthday Ideas');
      
      privateWishlistId = response.body.wishlist.id;
    });

    it('should restrict access to private wishlist for non-owners', async () => {
      // Create private wishlist
      const wishlistResponse = await makeAuthenticatedRequest(
        app, 
        'post', 
        '/api/v1/wishlist', 
        { name: 'Secret Wishlist', isPrivate: true }, 
        testToken
      );
      const privateWishlistId = wishlistResponse.body.wishlist.id;

      // Try to access with collaborator token
      const response = await makeAuthenticatedRequest(
        app, 
        'get', 
        `/api/v1/wishlist/${privateWishlistId}`, 
        {}, 
        collaboratorToken
      );

      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('error', 'Access denied');
    });
  });

  /**
   * Test email sharing functionality
   */
  describe('Email Sharing', () => {
    beforeEach(async () => {
      // Create a wishlist for sharing tests
      const wishlistResponse = await makeAuthenticatedRequest(
        app, 
        'post', 
        '/api/v1/wishlist', 
        { name: 'Wishlist to Share', isPrivate: false }, 
        testToken
      );
      sharedWishlistId = wishlistResponse.body.wishlist.id;

      // Add item to wishlist
      await makeAuthenticatedRequest(
        app, 
        'post', 
        `/api/v1/wishlist/${sharedWishlistId}/items`, 
        { productId: testProduct.id }, 
        testToken
      );
    });

    it('should share wishlist via email successfully', async () => {
      const shareData = {
        emails: ['friend1@example.com', 'friend2@example.com'],
        message: 'Check out my Eid wishlist!',
        includePrices: true
      };

      const response = await makeAuthenticatedRequest(
        app, 
        'post', 
        `/api/v1/wishlist/${sharedWishlistId}/share/email`, 
        shareData, 
        testToken
      );

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message', 'Wishlist shared successfully via email');
      expect(response.body).toHaveProperty('recipients');
      expect(response.body.recipients).toHaveLength(2);
    });

    it('should validate email addresses before sharing', async () => {
      const shareData = {
        emails: ['invalid-email', 'valid@example.com'],
        message: 'Test message'
      };

      const response = await makeAuthenticatedRequest(
        app, 
        'post', 
        `/api/v1/wishlist/${sharedWishlistId}/share/email`, 
        shareData, 
        testToken
      );

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'Validation failed');
    });

    it('should limit number of email recipients', async () => {
      const emails = Array(15).fill().map((_, i) => `friend${i}@example.com`);
      const shareData = {
        emails,
        message: 'Test message'
      };

      const response = await makeAuthenticatedRequest(
        app, 
        'post', 
        `/api/v1/wishlist/${sharedWishlistId}/share/email`, 
        shareData, 
        testToken
      );

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Too many recipients');
    });
  });

  /**
   * Test social media sharing
   */
  describe('Social Media Sharing', () => {
    beforeEach(async () => {
      // Create a wishlist for social sharing tests
      const wishlistResponse = await makeAuthenticatedRequest(
        app, 
        'post', 
        '/api/v1/wishlist', 
        { name: 'Eid Festival Wishlist', isPrivate: false }, 
        testToken
      );
      sharedWishlistId = wishlistResponse.body.wishlist.id;

      // Add items
      await makeAuthenticatedRequest(
        app, 
        'post', 
        `/api/v1/wishlist/${sharedWishlistId}/items`, 
        { productId: testProduct.id }, 
        testToken
      );
    });

    it('should generate Facebook share link', async () => {
      const response = await makeAuthenticatedRequest(
        app, 
        'post', 
        `/api/v1/wishlist/${sharedWishlistId}/share/facebook`, 
        { 
          title: 'My Eid Wishlist',
          description: 'Check out these amazing gift ideas!',
          imageUrl: 'https://example.com/image.jpg'
        }, 
        testToken
      );

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('shareLink');
      expect(response.body.shareLink).toContain('facebook.com');
    });

    it('should generate Twitter share link with character limits', async () => {
      const response = await makeAuthenticatedRequest(
        app, 
        'post', 
        `/api/v1/wishlist/${sharedWishlistId}/share/twitter`, 
        { 
          text: 'Check out my Eid wishlist! Amazing gift ideas for everyone 🎁',
          hashtags: ['Eid2024', 'GiftIdeas', 'Bangladesh']
        }, 
        testToken
      );

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('shareLink');
      expect(response.body.shareLink).toContain('twitter.com');
      expect(response.body).toHaveProperty('characterCount');
      expect(response.body.characterCount).toBeLessThanOrEqual(280);
    });

    it('should generate WhatsApp share link', async () => {
      const response = await makeAuthenticatedRequest(
        app, 
        'post', 
        `/api/v1/wishlist/${sharedWishlistId}/share/whatsapp`, 
        { 
          message: 'Check out my Eid wishlist! Perfect gifts for the whole family 🎁'
        }, 
        testToken
      );

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('shareLink');
      expect(response.body.shareLink).toContain('wa.me');
    });
  });

  /**
   * Test collaborative wishlists
   */
  describe('Collaborative Wishlists', () => {
    let collaborativeWishlistId;

    beforeEach(async () => {
      // Create collaborative wishlist
      const wishlistResponse = await makeAuthenticatedRequest(
        app, 
        'post', 
        '/api/v1/wishlist', 
        { 
          name: 'Family Eid Gifts',
          isPrivate: false,
          isCollaborative: true
        }, 
        testToken
      );
      collaborativeWishlistId = wishlistResponse.body.wishlist.id;

      // Add initial items
      await makeAuthenticatedRequest(
        app, 
        'post', 
        `/api/v1/wishlist/${collaborativeWishlistId}/items`, 
        { productId: testProduct.id }, 
        testToken
      );
    });

    it('should invite collaborators to wishlist', async () => {
      const inviteData = {
        emails: ['collaborator@example.com'],
        message: 'Please help me choose Eid gifts for the family!',
        permission: 'edit' // Can be 'view' or 'edit'
      };

      const response = await makeAuthenticatedRequest(
        app, 
        'post', 
        `/api/v1/wishlist/${collaborativeWishlistId}/collaborate/invite`, 
        inviteData, 
        testToken
      );

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message', 'Collaboration invite sent successfully');
      expect(response.body).toHaveProperty('inviteToken');
    });

    it('should accept collaboration invitation', async () => {
      // Send invitation first
      const inviteResponse = await makeAuthenticatedRequest(
        app, 
        'post', 
        `/api/v1/wishlist/${collaborativeWishlistId}/collaborate/invite`, 
        { 
          emails: ['collaborator@example.com'],
          permission: 'edit'
        }, 
        testToken
      );
      const inviteToken = inviteResponse.body.inviteToken;

      // Accept invitation with collaborator token
      const response = await makeAuthenticatedRequest(
        app, 
        'post', 
        `/api/v1/wishlist/${collaborativeWishlistId}/collaborate/accept`, 
        { inviteToken }, 
        collaboratorToken
      );

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message', 'Collaboration invitation accepted');
    });

    it('should allow collaborators to add items', async () => {
      // Accept collaboration first
      const inviteResponse = await makeAuthenticatedRequest(
        app, 
        'post', 
        `/api/v1/wishlist/${collaborativeWishlistId}/collaborate/invite`, 
        { 
          emails: ['collaborator@example.com'],
          permission: 'edit'
        }, 
        testToken
      );
      const inviteToken = inviteResponse.body.inviteToken;

      await makeAuthenticatedRequest(
        app, 
        'post', 
        `/api/v1/wishlist/${collaborativeWishlistId}/collaborate/accept`, 
        { inviteToken }, 
        collaboratorToken
      );

      // Create another product for collaborator to add
      const collaboratorProduct = await createTestProduct({
        name: 'Collaborator Product',
        categoryId: testCategory.id,
        brandId: testBrand.id,
        regularPrice: 8000
      });

      // Collaborator adds item
      const response = await makeAuthenticatedRequest(
        app, 
        'post', 
        `/api/v1/wishlist/${collaborativeWishlistId}/items`, 
        { productId: collaboratorProduct.id }, 
        collaboratorToken
      );

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('message', 'Item added to wishlist');

      // Verify item was added
      const wishlistResponse = await makeAuthenticatedRequest(
        app, 
        'get', 
        `/api/v1/wishlist/${collaborativeWishlistId}`, 
        {}, 
        testToken
      );
      expect(wishlistResponse.body.wishlist.items).toHaveLength(2);
    });

    it('should restrict view-only collaborators from editing', async () => {
      // Send view-only invitation
      const inviteResponse = await makeAuthenticatedRequest(
        app, 
        'post', 
        `/api/v1/wishlist/${collaborativeWishlistId}/collaborate/invite`, 
        { 
          emails: ['collaborator@example.com'],
          permission: 'view'
        }, 
        testToken
      );
      const inviteToken = inviteResponse.body.inviteToken;

      await makeAuthenticatedRequest(
        app, 
        'post', 
        `/api/v1/wishlist/${collaborativeWishlistId}/collaborate/accept`, 
        { inviteToken }, 
        collaboratorToken
      );

      // Try to add item as view-only collaborator
      const collaboratorProduct = await createTestProduct({
        name: 'Unauthorized Product',
        categoryId: testCategory.id,
        brandId: testBrand.id,
        regularPrice: 5000
      });

      const response = await makeAuthenticatedRequest(
        app, 
        'post', 
        `/api/v1/wishlist/${collaborativeWishlistId}/items`, 
        { productId: collaboratorProduct.id }, 
        collaboratorToken
      );

      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('error', 'Insufficient permissions');
    });
  });

  /**
   * Test access controls and permissions
   */
  describe('Access Controls and Permissions', () => {
    it('should allow owner to change privacy settings', async () => {
      // Create wishlist
      const wishlistResponse = await makeAuthenticatedRequest(
        app, 
        'post', 
        '/api/v1/wishlist', 
        { name: 'Test Wishlist', isPrivate: false }, 
        testToken
      );
      const wishlistId = wishlistResponse.body.wishlist.id;

      // Change to private
      const response = await makeAuthenticatedRequest(
        app, 
        'put', 
        `/api/v1/wishlist/${wishlistId}/privacy`, 
        { isPrivate: true }, 
        testToken
      );

      expect(response.status).toBe(200);
      expect(response.body.wishlist.isPrivate).toBe(true);
    });

    it('should prevent non-owners from changing privacy settings', async () => {
      // Create wishlist with owner
      const wishlistResponse = await makeAuthenticatedRequest(
        app, 
        'post', 
        '/api/v1/wishlist', 
        { name: 'Owner Wishlist', isPrivate: false }, 
        testToken
      );
      const wishlistId = wishlistResponse.body.wishlist.id;

      // Try to change privacy with collaborator token
      const response = await makeAuthenticatedRequest(
        app, 
        'put', 
        `/api/v1/wishlist/${wishlistId}/privacy`, 
        { isPrivate: true }, 
        collaboratorToken
      );

      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('error', 'Access denied');
    });

    it('should generate temporary share links with expiration', async () => {
      // Create wishlist
      const wishlistResponse = await makeAuthenticatedRequest(
        app, 
        'post', 
        '/api/v1/wishlist', 
        { name: 'Temporary Share Wishlist', isPrivate: false }, 
        testToken
      );
      const wishlistId = wishlistResponse.body.wishlist.id;

      // Generate temporary link
      const response = await makeAuthenticatedRequest(
        app, 
        'post', 
        `/api/v1/wishlist/${wishlistId}/share/temporary`, 
        { 
          expiresIn: '7d', // 7 days
          maxViews: 10
        }, 
        testToken
      );

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('shareableLink');
      expect(response.body).toHaveProperty('expiresAt');
      expect(response.body).toHaveProperty('maxViews');
      expect(response.body.maxViews).toBe(10);
    });
  });

  /**
   * Test Bangladesh-specific sharing scenarios
   */
  describe('Bangladesh-Specific Sharing Scenarios', () => {
    let bdProducts, bdUser, bdToken;

    beforeEach(async () => {
      // Create Bangladesh-specific products
      bdProducts = await createBangladeshWishlistProducts();
      
      // Create Bangladesh user
      bdUser = await createBangladeshWishlistUser('urbanProfessional');
      bdToken = generateTestToken(bdUser);
    });

    it('should share Eid festival wishlist with cultural context', async () => {
      // Create Eid wishlist
      const eidWishlist = await createFestivalWishlist(
        bdUser.id, 
        'eidUlFitr', 
        bdProducts.slice(0, 4)
      );

      // Share with cultural message
      const shareData = {
        emails: ['family@example.com', 'friends@example.com'],
        message: 'ঈদ মোবারক! Check out my Eid wishlist with traditional Bangladeshi gifts',
        includeCulturalContext: true,
        language: 'bn'
      };

      const response = await makeAuthenticatedRequest(
        app, 
        'post', 
        `/api/v1/wishlist/${eidWishlist.id}/share/email`, 
        shareData, 
        bdToken
      );

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('culturalContext');
      expect(response.body.culturalContext).toContain('Eid');
      expect(response.body).toHaveProperty('localization');
      expect(response.body.localization.language).toBe('bn');
    });

    it('should generate WhatsApp share links with Bangladeshi formatting', async () => {
      // Create Pohela Boishakh wishlist
      const boishakhWishlist = await createFestivalWishlist(
        bdUser.id, 
        'pohelaBoishakh', 
        bdProducts.filter(p => p.category === 'clothing' || p.category === 'books')
      );

      const response = await makeAuthenticatedRequest(
        app, 
        'post', 
        `/api/v1/wishlist/${boishakhWishlist.id}/share/whatsapp`, 
        { 
          message: 'পহেলা বৈশাখের শুভেচ্ছা! Check out my Bengali New Year wishlist 🌺',
          includePrices: true,
          currency: 'BDT',
          language: 'bn'
        }, 
        bdToken
      );

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('shareLink');
      expect(response.body).toHaveProperty('formattedMessage');
      expect(response.body.formattedMessage).toContain('৳'); // BDT symbol
      expect(response.body.formattedMessage).toContain('পহেলা বৈশাখ');
    });

    it('should handle wedding gift registry sharing with Bangladeshi customs', async () => {
      // Create wedding wishlist
      const weddingWishlist = await createFestivalWishlist(
        bdUser.id, 
        'winterWedding', 
        bdProducts.filter(p => p.category === 'jewelry' || p.category === 'home-appliances')
      );

      const shareData = {
        emails: ['wedding.guests@example.com'],
        message: 'বিবাহের শুভেচ্ছা! We\'ve created a wedding registry with traditional gifts',
        includeGiftRegistry: true,
        culturalCustoms: ['gold-jewelry', 'home-appliances', 'traditional-items'],
        weddingDate: '2024-12-25',
        venue: 'Dhaka, Bangladesh'
      };

      const response = await makeAuthenticatedRequest(
        app, 
        'post', 
        `/api/v1/wishlist/${weddingWishlist.id}/share/email`, 
        shareData, 
        bdToken
      );

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('giftRegistry');
      expect(response.body.giftRegistry).toHaveProperty('culturalCustoms');
      expect(response.body.giftRegistry.culturalCustoms).toContain('gold-jewelry');
      expect(response.body).toHaveProperty('weddingDetails');
      expect(response.body.weddingDetails.venue).toBe('Dhaka, Bangladesh');
    });
  });

  /**
   * Test sharing analytics and tracking
   */
  describe('Sharing Analytics and Tracking', () => {
    it('should track wishlist share views and interactions', async () => {
      // Create wishlist
      const wishlistResponse = await makeAuthenticatedRequest(
        app, 
        'post', 
        '/api/v1/wishlist', 
        { name: 'Tracked Wishlist', isPrivate: false }, 
        testToken
      );
      const wishlistId = wishlistResponse.body.wishlist.id;

      // Generate shareable link
      const shareResponse = await makeAuthenticatedRequest(
        app, 
        'post', 
        `/api/v1/wishlist/${wishlistId}/share`, 
        { type: 'public', trackViews: true }, 
        testToken
      );
      const shareToken = shareResponse.body.shareToken;

      // Simulate view (this would normally be done by tracking service)
      const response = await request(app)
        .get(`/api/v1/wishlist/shared/${shareToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('wishlist');
      expect(response.body).toHaveProperty('analytics');

      // Check analytics
      const analyticsResponse = await makeAuthenticatedRequest(
        app, 
        'get', 
        `/api/v1/wishlist/${wishlistId}/analytics`, 
        {}, 
        testToken
      );

      expect(analyticsResponse.status).toBe(200);
      expect(analyticsResponse.body).toHaveProperty('views');
      expect(analyticsResponse.body).toHaveProperty('shares');
      expect(analyticsResponse.body).toHaveProperty('clicks');
    });
  });
});