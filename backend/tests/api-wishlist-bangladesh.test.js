/**
 * Bangladesh-Specific Wishlist Features Test Suite
 * 
 * This test suite covers Bangladesh-specific wishlist functionality including:
 * - Local festival-based wishlist recommendations
 * - Regional product preferences and availability
 * - Currency formatting and price comparisons
 * - Local shipping and delivery notifications
 * - Cultural gift-giving scenarios
 * - Bengali language support
 * - Regional payment method integration
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
  calculateWishlistMetrics,
  formatBDTPrice,
  BANGLADESH_WISHLIST_PRODUCTS,
  BANGLADESH_FESTIVAL_WISHLISTS,
  BANGLADESH_WISHLIST_USERS,
  BANGLADESH_WISHLIST_SCENARIOS
} = require('./bangladesh-wishlist-fixtures.test');

const app = require('../index');
const prisma = new PrismaClient();

// Mock Bangladesh-specific services
jest.mock('../services/bangladesh-shipping-service', () => ({
  calculateRegionalShipping: jest.fn().mockImplementation((division, weight) => {
    const shippingRates = {
      'DHAKA': { regular: 100, express: 200 },
      'CHITTAGONG': { regular: 150, express: 250 },
      'SYLHET': { regular: 130, express: 230 }
    };
    return shippingRates[division] || { regular: 200, express: 300 };
  }),
  getDeliveryTimeEstimate: jest.fn().mockReturnValue({ days: 2-3, reliable: true })
}));

jest.mock('../services/cultural-context-service', () => ({
  getFestivalRecommendations: jest.fn().mockImplementation((festival) => {
    return {
      'eid-ul-fitr': ['clothing', 'electronics', 'sweets'],
      'pohela-boishakh': ['traditional-clothing', 'books', 'decorations'],
      'durga-puja': ['traditional-clothing', 'sweets', 'decorations']
    }[festival] || [];
  }),
  getCulturalGiftSuggestions: jest.fn().mockReturnValue([
    { category: 'gold-jewelry', significance: 'traditional-wedding-gift' },
    { category: 'traditional-clothing', significance: 'festival-essential' },
    { category: 'sweets', significance: 'cultural-celebration' }
  ])
}));

describe('Bangladesh-Specific Wishlist Features', () => {
  let bdUser, bdToken, bdProducts;
  let eidWishlist, boishakhWishlist, weddingWishlist;

  /**
   * Test setup - Create Bangladesh-specific test data
   */
  beforeEach(async () => {
    // Create Bangladesh user and products
    bdUser = await createBangladeshWishlistUser('urbanProfessional');
    bdToken = generateTestToken(bdUser);
    bdProducts = await createBangladeshWishlistProducts();
  });

  /**
   * Test cleanup - Remove test data after each test
   */
  afterEach(async () => {
    await cleanupTestData(['wishlist', 'wishlistItem', 'product', 'category', 'brand', 'user']);
  });

  /**
   * Test festival-based wishlist creation and management
   */
  describe('Festival-Based Wishlist Management', () => {
    it('should create Eid-ul-Fitr wishlist with cultural recommendations', async () => {
      const response = await makeAuthenticatedRequest(
        app, 
        'post', 
        '/api/v1/wishlist/festival', 
        { 
          festival: 'eid-ul-fitr',
          name: 'Eid-ul-Fitr 2024',
          includeCulturalContext: true,
          targetAudience: 'family',
          budgetRange: { min: 1000, max: 10000 }
        }, 
        bdToken
      );

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('wishlist');
      expect(response.body).toHaveProperty('culturalContext');
      expect(response.body).toHaveProperty('recommendations');
      
      expect(response.body.wishlist.name).toBe('Eid-ul-Fitr 2024');
      expect(response.body.culturalContext.festival).toBe('Eid-ul-Fitr');
      expect(response.body.recommendations.length).toBeGreaterThan(0);
      
      eidWishlist = response.body.wishlist;
    });

    it('should create Pohela Boishakh wishlist with Bengali cultural elements', async () => {
      const response = await makeAuthenticatedRequest(
        app, 
        'post', 
        '/api/v1/wishlist/festival', 
        { 
          festival: 'pohela-boishakh',
          name: 'পহেলা বৈশাখ ১৪৩১',
          language: 'bn',
          includeTraditionalElements: true,
          colorScheme: 'red-white'
        }, 
        bdToken
      );

      expect(response.status).toBe(201);
      expect(response.body.wishlist.name).toBe('পহেলা বৈশাখ ১৪৩১');
      expect(response.body.culturalContext.language).toBe('bn');
      expect(response.body.culturalContext.traditionalElements).toContain('traditional-clothing');
      
      boishakhWishlist = response.body.wishlist;
    });

    it('should generate festival-specific product recommendations', async () => {
      const response = await makeAuthenticatedRequest(
        app, 
        'post', 
        `/api/v1/wishlist/${eidWishlist.id}/festival-recommendations`, 
        { 
          festival: 'eid-ul-fitr',
          userPreferences: {
            ageGroup: 'adult',
            gender: 'mixed',
            budgetLevel: 'medium'
          },
          culturalContext: {
            familySize: 'medium',
            traditionalValues: true
          }
        }, 
        bdToken
      );

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('recommendations');
      expect(response.body).toHaveProperty('culturalRelevance');
      
      const recommendations = response.body.recommendations;
      expect(recommendations.some(r => r.category === 'clothing')).toBe(true);
      expect(recommendations.some(r => r.category === 'electronics')).toBe(true);
      
      // Check cultural relevance scores
      recommendations.forEach(rec => {
        expect(rec).toHaveProperty('culturalRelevanceScore');
        expect(rec.culturalRelevanceScore).toBeGreaterThan(0);
      });
    });
  });

  /**
   * Test regional product preferences and availability
   */
  describe('Regional Product Preferences', () => {
    it('should show region-specific product availability', async () => {
      const response = await makeAuthenticatedRequest(
        app, 
        'post', 
        '/api/v1/wishlist/regional-preferences', 
        { 
          division: 'DHAKA',
          district: 'Dhaka',
          preferences: {
            localProducts: true,
            seasonalItems: true,
            priceRange: 'medium'
          }
        }, 
        bdToken
      );

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('regionalAvailability');
      expect(response.body).toHaveProperty('localRecommendations');
      expect(response.body).toHaveProperty('shippingInfo');
      
      expect(response.body.regionalAvailability.division).toBe('DHAKA');
      expect(response.body.shippingInfo.baseRate).toBeDefined();
    });

    it('should adapt recommendations based on regional preferences', async () => {
      // Create wishlist for Sylhet region
      const sylhetUser = await createBangladeshWishlistUser('homemaker');
      sylhetUser.location = 'Sylhet';
      const sylhetToken = generateTestToken(sylhetUser);

      const response = await makeAuthenticatedRequest(
        app, 
        'post', 
        '/api/v1/wishlist/regional-recommendations', 
        { 
          division: 'SYLHET',
          climate: 'humid',
          localTraditions: ['tea-gardens', 'traditional-crafts'],
          economicFactors: 'agricultural-based'
        }, 
        sylhetToken
      );

      expect(response.status).toBe(200);
      expect(response.body.recommendations).toBeDefined();
      
      // Should include region-specific items
      const categories = response.body.recommendations.map(r => r.category);
      expect(categories).toContain('traditional-clothing');
      expect(categories).toContain('local-handicrafts');
    });

    it('should handle regional stock variations', async () => {
      // Create products with different regional availability
      const smartphone = bdProducts.find(p => p.name === 'Samsung Galaxy A54 5G');
      const jamdaniSaree = bdProducts.find(p => p.name === 'Handloom Jamdani Saree');

      // Update regional stock
      await prisma.product.update({
        where: { id: smartphone.id },
        data: { 
          regionalStock: {
            'DHAKA': 50,
            'CHITTAGONG': 30,
            'SYLHET': 10,
            'RAJSHAHI': 20
          }
        }
      });

      const response = await makeAuthenticatedRequest(
        app, 
        'get', 
        `/api/v1/products/${smartphone.id}/regional-stock`, 
        { division: 'SYLHET' }, 
        bdToken
      );

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('regionalAvailability');
      expect(response.body.regionalAvailability.SYLHET).toBe(10);
    });
  });

  /**
   * Test currency formatting and price comparisons
   */
  describe('Currency and Pricing', () => {
    it('should format prices in BDT with Bengali numerals', async () => {
      const goldNecklace = bdProducts.find(p => p.name === '22K Gold Necklace');
      
      const response = await makeAuthenticatedRequest(
        app, 
        'post', 
        '/api/v1/wishlist', 
        { name: 'Luxury Items' }, 
        bdToken
      );
      
      await makeAuthenticatedRequest(
        app, 
        'post', 
        `/api/v1/wishlist/${response.body.wishlist.id}/items`, 
        { productId: goldNecklace.id }, 
        bdToken
      );

      const wishlistResponse = await makeAuthenticatedRequest(
        app, 
        'get', 
        `/api/v1/wishlist/${response.body.wishlist.id}`, 
        { 
          currency: 'BDT',
          language: 'bn',
          useBengaliNumerals: true
        }, 
        bdToken
      );

      expect(response.status).toBe(200);
      const item = wishlistResponse.body.wishlist.items[0];
      expect(item.formattedPrice).toContain('৳');
      expect(item.formattedPrice).toMatch(/[০-৯]/); // Bengali numerals
    });

    it('should provide price comparisons with local market rates', async () => {
      const laptop = bdProducts.find(p => p.name === 'Walton Prelude Pro');
      
      const response = await makeAuthenticatedRequest(
        app, 
        'get', 
        `/api/v1/products/${laptop.id}/price-comparison`, 
        { 
          includeLocalMarkets: true,
          regions: ['dhaka', 'chittagong', 'online'],
          currency: 'BDT'
        }, 
        bdToken
      );

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('priceComparison');
      expect(response.body).toHaveProperty('localMarketRates');
      expect(response.body.priceComparison.ourPrice).toBeDefined();
      expect(response.body.localMarketRates).toBeDefined();
    });

    it('should calculate wishlist value in BDT with tax', async () => {
      const wishlistResponse = await makeAuthenticatedRequest(
        app, 
        'post', 
        '/api/v1/wishlist', 
        { name: 'Mixed Price Wishlist' }, 
        bdToken
      );

      // Add items with different prices
      await makeAuthenticatedRequest(
        app, 
        'post', 
        `/api/v1/wishlist/${wishlistResponse.body.wishlist.id}/items`, 
        { productId: bdProducts[0].id }, 
        bdToken
      );
      await makeAuthenticatedRequest(
        app, 
        'post', 
        `/api/v1/wishlist/${wishlistResponse.body.wishlist.id}/items`, 
        { productId: bdProducts[1].id }, 
        bdToken
      );

      const response = await makeAuthenticatedRequest(
        app, 
        'get', 
        `/api/v1/wishlist/${wishlistResponse.body.wishlist.id}/value-calculation`, 
        { 
          currency: 'BDT',
          includeTax: true,
          taxRate: 0.15
        }, 
        bdToken
      );

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('totalValue');
      expect(response.body).toHaveProperty('taxAmount');
      expect(response.body).toHaveProperty('formattedValue');
      expect(response.body.formattedValue).toContain('৳');
    });
  });

  /**
   * Test local shipping and delivery notifications
   */
  describe('Local Shipping and Delivery', () => {
    it('should calculate regional shipping costs', async () => {
      const response = await makeAuthenticatedRequest(
        app, 
        'post', 
        '/api/v1/shipping/calculate', 
        { 
          division: 'DHAKA',
          district: 'Dhaka',
          weight: 2.5,
          shippingType: 'regular',
          includeVAT: true
        }, 
        bdToken
      );

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('shippingCost');
      expect(response.body).toHaveProperty('deliveryTime');
      expect(response.body).toHaveProperty('regionalBreakdown');
      expect(response.body.shippingCost).toBeGreaterThan(0);
    });

    it('should provide delivery estimates for different regions', async () => {
      const regions = ['DHAKA', 'CHITTAGONG', 'SYLHET', 'RAJSHAHI'];
      
      for (const region of regions) {
        const response = await makeAuthenticatedRequest(
          app, 
          'post', 
          '/api/v1/shipping/delivery-estimate', 
          { 
            division: region,
            productIds: [bdProducts[0].id, bdProducts[1].id],
            shippingType: 'express'
          }, 
          bdToken
        );

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('estimatedDays');
        expect(response.body).toHaveProperty('reliability');
        expect(response.body).toHaveProperty('cost');
        expect(response.body.estimatedDays).toBeGreaterThan(0);
      }
    });

    it('should send delivery notifications in Bengali', async () => {
      const response = await makeAuthenticatedRequest(
        app, 
        'post', 
        '/api/v1/notifications/delivery-setup', 
        { 
          language: 'bn',
          regions: ['DHAKA'],
          notificationTypes: ['out-for-delivery', 'delivered', 'delayed'],
          includeTimeEstimates: true
        }, 
        bdToken
      );

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('deliveryNotifications');
      expect(response.body).toHaveProperty('language');
      expect(response.body.language).toBe('bn');
    });
  });

  /**
   * Test cultural gift-giving scenarios
   */
  describe('Cultural Gift-Giving Scenarios', () => {
    it('should provide wedding gift recommendations with Bangladeshi customs', async () => {
      const response = await makeAuthenticatedRequest(
        app, 
        'post', 
        '/api/v1/wishlist/wedding-gifts', 
        { 
          relationship: 'close-family',
          weddingType: 'traditional',
          region: 'dhaka',
          budgetLevel: 'high',
          includeCulturalItems: true
        }, 
        bdToken
      );

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('giftRecommendations');
      expect(response.body).toHaveProperty('culturalContext');
      
      const recommendations = response.body.giftRecommendations;
      expect(recommendations.some(r => r.category === 'gold-jewelry')).toBe(true);
      expect(recommendations.some(r => r.category === 'traditional-clothing')).toBe(true);
      
      // Check cultural significance
      recommendations.forEach(rec => {
        expect(rec).toHaveProperty('culturalSignificance');
        expect(rec).toHaveProperty('appropriatenessScore');
      });
    });

    it('should handle Eid gift-giving for different family members', async () => {
      const familyMembers = [
        { relation: 'parent', age: '50+', gender: 'mixed' },
        { relation: 'sibling', age: '25-35', gender: 'mixed' },
        { relation: 'child', age: '5-15', gender: 'mixed' }
      ];

      for (const member of familyMembers) {
        const response = await makeAuthenticatedRequest(
          app, 
          'post', 
          '/api/v1/wishlist/eid-gifts', 
          { 
            familyMember: member,
            budgetRange: { min: 500, max: 5000 },
            includeTraditionalItems: true,
            educationalValue: member.relation === 'child'
          }, 
          bdToken
        );

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('giftSuggestions');
        expect(response.body.giftSuggestions.length).toBeGreaterThan(0);
        
        // Check age-appropriateness
        response.body.giftSuggestions.forEach(suggestion => {
          expect(suggestion).toHaveProperty('ageAppropriate');
          expect(suggestion).toHaveProperty('culturalRelevance');
        });
      }
    });

    it('should provide Pohela Boishakh cultural gift suggestions', async () => {
      const response = await makeAuthenticatedRequest(
        app, 
        'post', 
        '/api/v1/wishlist/pohela-boishakh-gifts', 
        { 
          recipientType: 'family-friends',
          includeTraditionalElements: true,
          colorPreferences: ['red', 'white'],
          budgetLevel: 'medium'
        }, 
        bdToken
      );

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('boishakhGifts');
      expect(response.body).toHaveProperty('culturalElements');
      
      const gifts = response.body.boishakhGifts;
      expect(gifts.some(g => g.category === 'traditional-clothing')).toBe(true);
      expect(gifts.some(g => g.category === 'books')).toBe(true);
      expect(gifts.some(g => g.category === 'decorations')).toBe(true);
    });
  });

  /**
   * Test Bengali language support
   */
  describe('Bengali Language Support', () => {
    it('should display wishlist interface in Bengali', async () => {
      const response = await makeAuthenticatedRequest(
        app, 
        'get', 
        '/api/v1/wishlist/interface', 
        { 
          language: 'bn',
          includeCulturalContext: true
        }, 
        bdToken
      );

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('interfaceText');
      expect(response.body).toHaveProperty('culturalTerms');
      
      const interfaceText = response.body.interfaceText;
      expect(interfaceText.wishlist).toBe('ইচ্ছাতালিকা');
      expect(interfaceText.add_to_wishlist).toBe('ইচ্ছাতালিকায় যোগ করুন');
      expect(interfaceText.share_wishlist).toBe('ইচ্ছাতালিকা শেয়ার করুন');
    });

    it('should handle Bengali product names and descriptions', async () => {
      const response = await makeAuthenticatedRequest(
        app, 
        'post', 
        '/api/v1/wishlist', 
        { 
          name: 'ঈদের উপহার',
          description: 'ঈদ উৎসবের জন্য বিশেষ উপহার',
          language: 'bn'
        }, 
        bdToken
      );

      expect(response.status).toBe(201);
      expect(response.body.wishlist.name).toBe('ঈদের উপহার');
      expect(response.body.wishlist.description).toBe('ঈদ উৎসবের জন্য বিশেষ উপহার');
    });

    it('should provide search functionality in Bengali', async () => {
      const response = await makeAuthenticatedRequest(
        app, 
        'post', 
        '/api/v1/wishlist/search', 
        { 
          query: 'শাড়ি',
          language: 'bn',
          includeSynonyms: true,
          category: 'clothing'
        }, 
        bdToken
      );

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('searchResults');
      expect(response.body).toHaveProperty('searchMetadata');
      
      // Should find Bengali products
      const results = response.body.searchResults;
      expect(results.length).toBeGreaterThan(0);
      expect(results.some(r => r.nameBn && r.nameBn.includes('শাড়ি'))).toBe(true);
    });
  });

  /**
   * Test regional payment method integration
   */
  describe('Regional Payment Methods', () => {
    it('should integrate bKash for wishlist purchases', async () => {
      const response = await makeAuthenticatedRequest(
        app, 
        'post', 
        '/api/v1/wishlist/purchase-setup', 
        { 
          wishlistId: eidWishlist?.id,
          paymentMethod: 'BKASH',
          phoneNumber: '+8801712345678',
          includeProcessingFee: true
        }, 
        bdToken
      );

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('paymentSetup');
      expect(response.body.paymentSetup.method).toBe('BKASH');
      expect(response.body.paymentSetup.processingFee).toBeDefined();
      expect(response.body.paymentSetup.totalAmount).toBeDefined();
    });

    it('should support Nagad for rural areas', async () => {
      const ruralUser = await createBangladeshWishlistUser('homemaker');
      ruralUser.location = 'Rural Bangladesh';
      const ruralToken = generateTestToken(ruralUser);

      const response = await makeAuthenticatedRequest(
        app, 
        'post', 
        '/api/v1/wishlist/payment-options', 
        { 
          region: 'rural',
          includeMobileFinancialServices: true,
          preferredLanguage: 'bn'
        }, 
        ruralToken
      );

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('availableMethods');
      expect(response.body.availableMethods).toContain('NAGAD');
      expect(response.body.availableMethods).toContain('ROCKET');
    });

    it('should calculate cash on delivery availability', async () => {
      const response = await makeAuthenticatedRequest(
        app, 
        'post', 
        '/api/v1/wishlist/cod-availability', 
        { 
          division: 'DHAKA',
          district: 'Dhaka',
          orderValue: 5000,
          includeVerification: true
        }, 
        bdToken
      );

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('codAvailable');
      expect(response.body).toHaveProperty('verificationRequired');
      expect(response.body).toHaveProperty('deliveryInstructions');
    });
  });

  /**
   * Test seasonal shopping patterns
   */
  describe('Seasonal Shopping Patterns', () => {
    it('should adapt recommendations based on shopping season', async () => {
      const seasons = ['winter', 'summer', 'monsoon', 'autumn'];
      
      for (const season of seasons) {
        const response = await makeAuthenticatedRequest(
          app, 
          'post', 
          '/api/v1/wishlist/seasonal-recommendations', 
          { 
            season,
            userLocation: 'dhaka',
            lifestyle: 'urban-professional',
            familySize: 'medium'
          }, 
          bdToken
        );

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('seasonalRecommendations');
        expect(response.body).toHaveProperty('seasonalContext');
        expect(response.body.seasonalContext.season).toBe(season);
      }
    });

    it('should handle back-to-school season for Bangladeshi students', async () => {
      const studentUser = await createBangladeshWishlistUser('student');
      const studentToken = generateTestToken(studentUser);

      const response = await makeAuthenticatedRequest(
        app, 
        'post', 
        '/api/v1/wishlist/back-to-school', 
        { 
          educationLevel: 'university',
          fieldOfStudy: 'engineering',
          budgetRange: { min: 5000, max: 25000 },
          includeLocalBrands: true
        }, 
        studentToken
      );

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('schoolRecommendations');
      expect(response.body).toHaveProperty('educationalContext');
      
      const recommendations = response.body.schoolRecommendations;
      expect(recommendations.some(r => r.category === 'electronics')).toBe(true);
      expect(recommendations.some(r => r.category === 'books')).toBe(true);
    });

    it('should provide winter preparation recommendations', async () => {
      const response = await makeAuthenticatedRequest(
        app, 
        'post', 
        '/api/v1/wishlist/winter-preparation', 
        { 
          region: 'north-bangladesh',
          houseType: 'apartment',
          familyMembers: 4,
          budgetLevel: 'medium'
        }, 
        bdToken
      );

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('winterRecommendations');
      expect(response.body).toHaveProperty('seasonalTips');
      
      const recommendations = response.body.winterRecommendations;
      expect(recommendations.some(r => r.category === 'home-appliances')).toBe(true);
      expect(recommendations.some(r => r.category === 'clothing')).toBe(true);
    });
  });
});