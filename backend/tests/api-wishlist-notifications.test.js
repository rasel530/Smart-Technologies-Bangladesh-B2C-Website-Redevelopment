/**
 * Wishlist Notification Features Test Suite
 * 
 * This test suite covers wishlist notification functionality including:
 * - Price drop notifications
 * - Stock availability alerts
 * - New similar product recommendations
 * - Wishlist item reminders
 * - Email and in-app notification preferences
 * - Notification frequency controls
 * - Bangladesh-specific seasonal notifications
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

// Mock notification services
jest.mock('../services/email-service', () => ({
  sendPriceDropNotification: jest.fn().mockResolvedValue({ success: true }),
  sendStockAlertNotification: jest.fn().mockResolvedValue({ success: true }),
  sendWishlistReminderNotification: jest.fn().mockResolvedValue({ success: true }),
  sendProductRecommendationNotification: jest.fn().mockResolvedValue({ success: true })
}));

jest.mock('../services/push-notification-service', () => ({
  sendPushNotification: jest.fn().mockResolvedValue({ success: true }),
  sendInAppNotification: jest.fn().mockResolvedValue({ success: true })
}));

jest.mock('../services/sms-service', () => ({
  sendSMSNotification: jest.fn().mockResolvedValue({ success: true })
}));

describe('Wishlist Notification Features', () => {
  let testUser, testToken, testProduct, testCategory, testBrand;
  let wishlistId, wishlistItemId;
  let notificationSettings;

  /**
   * Test setup - Create test data before each test
   */
  beforeEach(async () => {
    // Create test user
    const userResult = await createTestUser({
      email: 'notification.user@example.com',
      firstName: 'Notification',
      lastName: 'User'
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

    // Create test product with initial price
    testProduct = await createTestProduct({
      name: 'Test Smartphone',
      categoryId: testCategory.id,
      brandId: testBrand.id,
      regularPrice: 15000,
      salePrice: 12000,
      stockQuantity: 50
    });

    // Create wishlist and add item
    const wishlistResponse = await makeAuthenticatedRequest(
      app, 
      'post', 
      '/api/v1/wishlist', 
      { name: 'Notification Test Wishlist' }, 
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

    // Set up default notification preferences
    notificationSettings = {
      priceDrops: true,
      stockAlerts: true,
      newRecommendations: true,
      wishlistReminders: true,
      emailNotifications: true,
      pushNotifications: true,
      smsNotifications: false,
      frequency: 'immediate' // immediate, daily, weekly
    };
  });

  /**
   * Test cleanup - Remove test data after each test
   */
  afterEach(async () => {
    await cleanupTestData(['wishlist', 'wishlistItem', 'product', 'category', 'brand', 'user', 'notification']);
  });

  /**
   * Test notification preferences management
   */
  describe('Notification Preferences Management', () => {
    it('should set user notification preferences', async () => {
      const response = await makeAuthenticatedRequest(
        app, 
        'post', 
        '/api/v1/notifications/preferences', 
        notificationSettings, 
        testToken
      );

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message', 'Notification preferences updated successfully');
      expect(response.body.preferences).toMatchObject(notificationSettings);
    });

    it('should retrieve current notification preferences', async () => {
      // Set preferences first
      await makeAuthenticatedRequest(
        app, 
        'post', 
        '/api/v1/notifications/preferences', 
        notificationSettings, 
        testToken
      );

      // Retrieve preferences
      const response = await makeAuthenticatedRequest(
        app, 
        'get', 
        '/api/v1/notifications/preferences', 
        {}, 
        testToken
      );

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('preferences');
      expect(response.body.preferences.priceDrops).toBe(true);
      expect(response.body.preferences.frequency).toBe('immediate');
    });

    it('should validate notification preference data', async () => {
      const invalidPreferences = {
        priceDrops: 'not-a-boolean',
        frequency: 'invalid-frequency'
      };

      const response = await makeAuthenticatedRequest(
        app, 
        'post', 
        '/api/v1/notifications/preferences', 
        invalidPreferences, 
        testToken
      );

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'Validation failed');
    });
  });

  /**
   * Test price drop notifications
   */
  describe('Price Drop Notifications', () => {
    it('should trigger price drop notification when product price decreases', async () => {
      // Update product price to trigger notification
      await prisma.product.update({
        where: { id: testProduct.id },
        data: { 
          regularPrice: 15000,
          salePrice: 8000 // Significant price drop
        }
      });

      // Trigger price drop check
      const response = await makeAuthenticatedRequest(
        app, 
        'post', 
        `/api/v1/wishlist/${wishlistId}/check-price-drops`, 
        {}, 
        testToken
      );

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('priceDrops');
      expect(response.body.priceDrops).toHaveLength(1);
      
      const priceDrop = response.body.priceDrops[0];
      expect(priceDrop.productId).toBe(testProduct.id);
      expect(priceDrop.oldPrice).toBe('12000');
      expect(priceDrop.newPrice).toBe('8000');
      expect(priceDrop.percentageDrop).toBeGreaterThan(30);
    });

    it('should not trigger notification for minor price changes', async () => {
      // Small price change (less than 5%)
      await prisma.product.update({
        where: { id: testProduct.id },
        data: { 
          regularPrice: 15000,
          salePrice: 11500 // Small drop
        }
      });

      const response = await makeAuthenticatedRequest(
        app, 
        'post', 
        `/api/v1/wishlist/${wishlistId}/check-price-drops`, 
        {}, 
        testToken
      );

      expect(response.status).toBe(200);
      expect(response.body.priceDrops).toHaveLength(0);
    });

    it('should send email notification for significant price drops', async () => {
      // Set up email preferences
      await makeAuthenticatedRequest(
        app, 
        'post', 
        '/api/v1/notifications/preferences', 
        { 
          ...notificationSettings,
          emailNotifications: true,
          priceDropThreshold: 20 // 20% threshold
        }, 
        testToken
      );

      // Update price significantly
      await prisma.product.update({
        where: { id: testProduct.id },
        data: { 
          regularPrice: 15000,
          salePrice: 9000 // 40% drop
        }
      });

      const response = await makeAuthenticatedRequest(
        app, 
        'post', 
        `/api/v1/wishlist/${wishlistId}/check-price-drops`, 
        { sendNotifications: true }, 
        testToken
      );

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('notificationsSent');
      expect(response.body.notificationsSent.email).toBe(true);
    });
  });

  /**
   * Test stock availability alerts
   */
  describe('Stock Availability Alerts', () => {
    it('should notify when out-of-stock product becomes available', async () => {
      // First, make product out of stock
      await prisma.product.update({
        where: { id: testProduct.id },
        data: { stockQuantity: 0, status: 'OUT_OF_STOCK' }
      });

      // Then make it available again
      await prisma.product.update({
        where: { id: testProduct.id },
        data: { stockQuantity: 25, status: 'ACTIVE' }
      });

      const response = await makeAuthenticatedRequest(
        app, 
        'post', 
        `/api/v1/wishlist/${wishlistId}/check-stock-alerts`, 
        {}, 
        testToken
      );

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('stockAlerts');
      expect(response.body.stockAlerts).toHaveLength(1);
      
      const stockAlert = response.body.stockAlerts[0];
      expect(stockAlert.productId).toBe(testProduct.id);
      expect(stockAlert.previousStock).toBe(0);
      expect(stockAlert.currentStock).toBe(25);
      expect(stockAlert.status).toBe('NOW_AVAILABLE');
    });

    it('should notify when low stock items are restocked', async () => {
      // Set low stock
      await prisma.product.update({
        where: { id: testProduct.id },
        data: { stockQuantity: 2 }
      });

      // Restock to normal level
      await prisma.product.update({
        where: { id: testProduct.id },
        data: { stockQuantity: 50 }
      });

      const response = await makeAuthenticatedRequest(
        app, 
        'post', 
        `/api/v1/wishlist/${wishlistId}/check-stock-alerts`, 
        {}, 
        testToken
      );

      expect(response.status).toBe(200);
      expect(response.body.stockAlerts).toHaveLength(1);
      
      const stockAlert = response.body.stockAlerts[0];
      expect(stockAlert.status).toBe('RESTOCKED');
    });

    it('should send SMS notification for urgent stock alerts', async () => {
      // Enable SMS notifications
      await makeAuthenticatedRequest(
        app, 
        'post', 
        '/api/v1/notifications/preferences', 
        { 
          ...notificationSettings,
          smsNotifications: true,
          urgentStockAlerts: true
        }, 
        testToken
      );

      // Make product available after being out of stock
      await prisma.product.update({
        where: { id: testProduct.id },
        data: { stockQuantity: 5, status: 'ACTIVE' }
      });

      const response = await makeAuthenticatedRequest(
        app, 
        'post', 
        `/api/v1/wishlist/${wishlistId}/check-stock-alerts`, 
        { sendNotifications: true, priority: 'urgent' }, 
        testToken
      );

      expect(response.status).toBe(200);
      expect(response.body.notificationsSent.sms).toBe(true);
    });
  });

  /**
   * Test product recommendations
   */
  describe('Product Recommendations', () => {
    it('should generate similar product recommendations', async () => {
      // Create similar products
      const similarProduct1 = await createTestProduct({
        name: 'Similar Smartphone Pro',
        categoryId: testCategory.id,
        brandId: testBrand.id,
        regularPrice: 16000,
        salePrice: 13000
      });

      const similarProduct2 = await createTestProduct({
        name: 'Similar Smartphone Lite',
        categoryId: testCategory.id,
        brandId: testBrand.id,
        regularPrice: 12000,
        salePrice: 10000
      });

      const response = await makeAuthenticatedRequest(
        app, 
        'post', 
        `/api/v1/wishlist/${wishlistId}/recommendations`, 
        { 
          type: 'similar',
          maxResults: 5,
          includePriceComparison: true
        }, 
        testToken
      );

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('recommendations');
      expect(Array.isArray(response.body.recommendations)).toBe(true);
      expect(response.body.recommendations.length).toBeGreaterThan(0);

      const recommendation = response.body.recommendations[0];
      expect(recommendation).toHaveProperty('product');
      expect(recommendation).toHaveProperty('similarityScore');
      expect(recommendation).toHaveProperty('priceComparison');
    });

    it('should generate category-based recommendations', async () => {
      const response = await makeAuthenticatedRequest(
        app, 
        'post', 
        `/api/v1/wishlist/${wishlistId}/recommendations`, 
        { 
          type: 'category',
          categories: ['electronics'],
          priceRange: { min: 10000, max: 20000 },
          includeRatings: true
        }, 
        testToken
      );

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('recommendations');
      expect(response.body).toHaveProperty('metadata');
      expect(response.body.metadata.category).toBe('electronics');
    });

    it('should send recommendation notifications based on user preferences', async () => {
      // Enable recommendation notifications
      await makeAuthenticatedRequest(
        app, 
        'post', 
        '/api/v1/notifications/preferences', 
        { 
          ...notificationSettings,
          newRecommendations: true,
          recommendationFrequency: 'weekly'
        }, 
        testToken
      );

      const response = await makeAuthenticatedRequest(
        app, 
        'post', 
        `/api/v1/wishlist/${wishlistId}/recommendations`, 
        { 
          type: 'trending',
          sendNotifications: true
        }, 
        testToken
      );

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('notificationsSent');
      expect(response.body.notificationsSent.email).toBe(true);
    });
  });

  /**
   * Test wishlist item reminders
   */
  describe('Wishlist Item Reminders', () => {
    it('should send reminder for items added long ago', async () => {
      // Manually update the addedAt date to simulate old item
      await prisma.wishlistItem.update({
        where: { id: wishlistItemId },
        data: { 
          addedAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000) // 45 days ago
        }
      });

      const response = await makeAuthenticatedRequest(
        app, 
        'post', 
        `/api/v1/wishlist/${wishlistId}/check-reminders`, 
        { 
          reminderType: 'long-term',
          daysThreshold: 30
        }, 
        testToken
      );

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('reminders');
      expect(response.body.reminders).toHaveLength(1);
      
      const reminder = response.body.reminders[0];
      expect(reminder.productId).toBe(testProduct.id);
      expect(reminder.daysInWishlist).toBeGreaterThan(30);
      expect(reminder.reminderType).toBe('LONG_TERM_ITEM');
    });

    it('should send seasonal reminders for festival wishlists', async () => {
      // Create festival-specific wishlist
      const bdUser = await createBangladeshWishlistUser('urbanProfessional');
      const bdToken = generateTestToken(bdUser);
      const bdProducts = await createBangladeshWishlistProducts();
      
      const eidWishlist = await createFestivalWishlist(
        bdUser.id, 
        'eidUlFitr', 
        bdProducts.slice(0, 3)
      );

      const response = await makeAuthenticatedRequest(
        app, 
        'post', 
        `/api/v1/wishlist/${eidWishlist.id}/check-reminders`, 
        { 
          reminderType: 'seasonal',
          festival: 'eid-ul-fitr',
          daysBeforeFestival: 30
        }, 
        bdToken
      );

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('reminders');
      expect(response.body).toHaveProperty('festivalContext');
      expect(response.body.festivalContext.name).toBe('Eid-ul-Fitr');
    });
  });

  /**
   * Test notification frequency controls
   */
  describe('Notification Frequency Controls', () => {
    it('should batch notifications for daily frequency', async () => {
      // Set daily frequency
      await makeAuthenticatedRequest(
        app, 
        'post', 
        '/api/v1/notifications/preferences', 
        { 
          ...notificationSettings,
          frequency: 'daily'
        }, 
        testToken
      );

      // Trigger multiple notifications
      await prisma.product.update({
        where: { id: testProduct.id },
        data: { salePrice: 8000 }
      });

      const response = await makeAuthenticatedRequest(
        app, 
        'post', 
        `/api/v1/wishlist/${wishlistId}/check-all-notifications`, 
        { 
          batchMode: true,
          frequency: 'daily'
        }, 
        testToken
      );

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('batchedNotifications');
      expect(response.body).toHaveProperty('scheduledFor');
      expect(response.body.batchedNotifications.length).toBeGreaterThan(0);
    });

    it('should send immediate notifications for urgent alerts', async () => {
      // Set weekly frequency but enable urgent overrides
      await makeAuthenticatedRequest(
        app, 
        'post', 
        '/api/v1/notifications/preferences', 
        { 
          ...notificationSettings,
          frequency: 'weekly',
          urgentOverrides: true
        }, 
        testToken
      );

      // Trigger urgent stock alert
      await prisma.product.update({
        where: { id: testProduct.id },
        data: { stockQuantity: 1, status: 'ACTIVE' }
      });

      const response = await makeAuthenticatedRequest(
        app, 
        'post', 
        `/api/v1/wishlist/${wishlistId}/check-urgent-notifications`, 
        {}, 
        testToken
      );

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('urgentNotifications');
      expect(response.body.urgentNotifications.length).toBeGreaterThan(0);
    });
  });

  /**
   * Test Bangladesh-specific notifications
   */
  describe('Bangladesh-Specific Notifications', () => {
    let bdUser, bdToken, bdProducts;

    beforeEach(async () => {
      bdUser = await createBangladeshWishlistUser('homemaker');
      bdToken = generateTestToken(bdUser);
      bdProducts = await createBangladeshWishlistProducts();
    });

    it('should send festival-based notifications for Eid', async () => {
      const eidWishlist = await createFestivalWishlist(
        bdUser.id, 
        'eidUlFitr', 
        bdProducts.filter(p => p.category === 'clothing' || p.category === 'jewelry')
      );

      const response = await makeAuthenticatedRequest(
        app, 
        'post', 
        `/api/v1/wishlist/${eidWishlist.id}/check-festival-notifications`, 
        { 
          festival: 'eid-ul-fitr',
          daysBefore: 15,
          includeCulturalContext: true,
          language: 'bn'
        }, 
        bdToken
      );

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('festivalNotifications');
      expect(response.body).toHaveProperty('culturalContext');
      expect(response.body.culturalContext.language).toBe('bn');
      expect(response.body.culturalContext.festival).toBe('Eid-ul-Fitr');
    });

    it('should send price drop notifications with BDT formatting', async () => {
      const goldNecklace = bdProducts.find(p => p.name === '22K Gold Necklace');
      
      const wishlistResponse = await makeAuthenticatedRequest(
        app, 
        'post', 
        '/api/v1/wishlist', 
        { name: 'Luxury Items' }, 
        bdToken
      );
      const wishlistId = wishlistResponse.body.wishlist.id;

      await makeAuthenticatedRequest(
        app, 
        'post', 
        `/api/v1/wishlist/${wishlistId}/items`, 
        { productId: goldNecklace.id }, 
        bdToken
      );

      // Simulate price drop
      await prisma.product.update({
        where: { id: goldNecklace.id },
        data: { 
          regularPrice: 85000,
          salePrice: 75000 // 10,000 BDT drop
        }
      });

      const response = await makeAuthenticatedRequest(
        app, 
        'post', 
        `/api/v1/wishlist/${wishlistId}/check-price-drops`, 
        { 
          currency: 'BDT',
          language: 'bn',
          sendNotifications: true
        }, 
        bdToken
      );

      expect(response.status).toBe(200);
      expect(response.body.priceDrops).toHaveLength(1);
      expect(response.body.priceDrops[0].currency).toBe('BDT');
      expect(response.body.priceDrops[0].formattedPriceDrop).toContain('৳');
    });

    it('should send seasonal reminders for Pohela Boishakh', async () => {
      const boishakhWishlist = await createFestivalWishlist(
        bdUser.id, 
        'pohelaBoishakh', 
        bdProducts.filter(p => p.category === 'clothing' || p.category === 'books')
      );

      const response = await makeAuthenticatedRequest(
        app, 
        'post', 
        `/api/v1/wishlist/${boishakhWishlist.id}/check-seasonal-reminders`, 
        { 
          season: 'spring',
          festival: 'pohela-boishakh',
          culturalElements: ['traditional-clothing', 'bengali-literature'],
          messageLanguage: 'bn'
        }, 
        bdToken
      );

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('seasonalReminders');
      expect(response.body).toHaveProperty('culturalElements');
      expect(response.body.culturalElements).toContain('traditional-clothing');
    });

    it('should handle wedding season notifications with Bangladeshi customs', async () => {
      const weddingWishlist = await createFestivalWishlist(
        bdUser.id, 
        'winterWedding', 
        bdProducts.filter(p => p.category === 'jewelry' || p.category === 'home-appliances')
      );

      const response = await makeAuthenticatedRequest(
        app, 
        'post', 
        `/api/v1/wishlist/${weddingWishlist.id}/check-wedding-notifications`, 
        { 
          weddingSeason: 'winter',
          culturalCustoms: ['gold-jewelry', 'traditional-gifts', 'family-items'],
          includeVenueSuggestions: true,
          region: 'dhaka'
        }, 
        bdToken
      );

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('weddingNotifications');
      expect(response.body).toHaveProperty('culturalCustoms');
      expect(response.body.culturalCustoms).toContain('gold-jewelry');
      expect(response.body).toHaveProperty('regionalContext');
      expect(response.body.regionalContext.region).toBe('dhaka');
    });
  });

  /**
   * Test notification analytics and tracking
   */
  describe('Notification Analytics and Tracking', () => {
    it('should track notification delivery and engagement', async () => {
      // Send test notification
      const response = await makeAuthenticatedRequest(
        app, 
        'post', 
        `/api/v1/wishlist/${wishlistId}/send-test-notification`, 
        { 
          type: 'price-drop',
          channels: ['email', 'push']
        }, 
        testToken
      );

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('notificationId');
      expect(response.body).toHaveProperty('deliveryStatus');

      // Track analytics
      const analyticsResponse = await makeAuthenticatedRequest(
        app, 
        'get', 
        `/api/v1/notifications/analytics`, 
        { 
          wishlistId,
          dateRange: 'last-30-days'
        }, 
        testToken
      );

      expect(analyticsResponse.status).toBe(200);
      expect(analyticsResponse.body).toHaveProperty('deliveryMetrics');
      expect(analyticsResponse.body).toHaveProperty('engagementMetrics');
      expect(analyticsResponse.body).toHaveProperty('channelPerformance');
    });

    it('should generate notification performance reports', async () => {
      const response = await makeAuthenticatedRequest(
        app, 
        'post', 
        '/api/v1/notifications/performance-report', 
        { 
          reportType: 'monthly',
          includeMetrics: ['delivery', 'engagement', 'conversion'],
          format: 'json'
        }, 
        testToken
      );

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('report');
      expect(response.body.report).toHaveProperty('summary');
      expect(response.body.report).toHaveProperty('detailedMetrics');
      expect(response.body.report).toHaveProperty('recommendations');
    });
  });
});