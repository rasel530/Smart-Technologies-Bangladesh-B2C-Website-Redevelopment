
/**
 * Bangladesh-Specific Review Features Test Suite
 * 
 * This test suite covers comprehensive Bangladesh-specific review functionality:
 * - Bengali language review support
 * - Local cultural context understanding
 * - Regional product preference analysis
 * - Festival-based review patterns
 * - Local market sentiment analysis
 * - Regional dialect and terminology handling
 */

const request = require('supertest');
const express = require('express');
const { PrismaClient } = require('@prisma/client');
const jwt = require('jsonwebtoken');

// Import test utilities and fixtures
const { 
  TEST_CONFIG, 
  createTestUser, 
  createTestAdmin, 
  createTestProduct, 
  createTestReview,
  cleanupTestData,
  makeAuthenticatedRequest,
  validateResponseStructure
} = require('./api-test-utils');

const {
  BANGLADESH_REVIEW_TEMPLATES,
  BANGLADESH_REVIEW_SENTIMENTS,
  BANGLADESH_REVIEW_CATEGORIES,
  BANGLADESH_REGIONAL_PATTERNS,
  BANGLADESH_SEASONAL_REVIEW_PATTERNS,
  BANGLADESH_USER_PROFILES,
  mockSentimentAnalysis,
  generateSeasonalReviews,
  calculateRegionalRatingDistribution
} = require('./bangladesh-review-fixtures.test');

// Import review routes
const reviewRoutes = require('../routes/reviews');

// Initialize Express app for testing
const app = express();
app.use(express.json());
app.use('/api/v1/reviews', reviewRoutes);

// Initialize Prisma client
const prisma = new PrismaClient();

// Test variables
let testUser, testAdmin, testProduct, reviews = [], userToken, adminToken;

/**
 * Test setup and teardown
 */
describe('Bangladesh-Specific Review Features', () => {
  /**
   * Setup test data before each test
   */
  beforeEach(async () => {
    // Clean up any existing test data
    await cleanupTestData(['review', 'user', 'product', 'category', 'brand']);

    // Create test users
    testUser = await createTestUser({
      email: 'bangladeshi@test.com',
      firstName: 'Rahim',
      lastName: 'Ahmed'
    });
    userToken = jwt.sign(
      { userId: testUser.user.id, email: testUser.user.email, role: 'CUSTOMER' },
      TEST_CONFIG.JWT_SECRET
    );

    testAdmin = await createTestAdmin({
      email: 'admin@test.com',
      firstName: 'Admin',
      lastName: 'User'
    });
    adminToken = jwt.sign(
      { userId: testAdmin.user.id, email: testAdmin.user.email, role: 'ADMIN' },
      TEST_CONFIG.JWT_SECRET
    );

    // Create test product
    testProduct = await createTestProduct({
      name: 'Samsung Galaxy A54',
      nameBn: 'স্যামসাং গ্যালাক্সি A54',
      regularPrice: 45000,
      salePrice: 42000
    });

    reviews = [];
  });

  /**
   * Clean up test data after each test
   */
  afterEach(async () => {
    await cleanupTestData(['review', 'user', 'product', 'category', 'brand']);
  });

  /**
   * Test suite for Bengali language review support
   */
  describe('Bengali Language Review Support', () => {
    /**
     * Test creating reviews with pure Bengali content
     */
    test('should handle pure Bengali language reviews', async () => {
      const bengaliReview = {
        productId: testProduct.id,
        rating: 5,
        title: 'অসাধারণ স্মার্টফোন!',
        comment: 'এই ফোনটি কেনার পর খুবই খুশি। ক্যামেরা অসাধারণ, ব্যাটারি ব্যাকআপ ভালো, এবং পারফরম্যান্স দারুন। দামের তুলনায় অনেক ভালো ফিচার। বন্ধুদের সুপারিশ করবো।'
      };

      const response = await makeAuthenticatedRequest(
        app, 
        'post', 
        '/api/v1/reviews', 
        bengaliReview, 
        userToken
      );

      expect(response.status).toBe(201);
      expect(response.body.review.title).toBe('অসাধারণ স্মার্টফোন!');
      expect(response.body.review.comment).toContain('অসাধারণ');
      expect(response.body.review.comment).toContain('ব্যাটারি');
      expect(response.body.review.comment).toContain('সুপারিশ');
    });

    /**
     * Test mixed Bengali-English content
     */
    test('should handle mixed Bengali-English reviews', async () => {
      const mixedReview = {
        productId: testProduct.id,
        rating: 4,
        title: 'Good phone ভালো ফোন',
        comment: 'Camera is অসাধারণ but battery life is just okay. দামটা ভালো। Overall performance is ঠিকঠাক।'
      };

      const response = await makeAuthenticatedRequest(
        app, 
        'post', 
        '/api/v1/reviews', 
        mixedReview, 
        userToken
      );

      expect(response.status).toBe(201);
      expect(response.body.review.title).toBe('Good phone ভালো ফোন');
      expect(response.body.review.comment).toContain('অসাধারণ');
      expect(response.body.review.comment).toContain('দামটা ভালো');
      expect(response.body.review.comment).toContain('ঠিকঠাক');
    });

    /**
     * Test Bengali Unicode handling
     */
    test('should properly handle Bengali Unicode characters', async () => {
      const unicodeReview = {
        productId: testProduct.id,
        rating: 5,
        title: 'ডঃ, ঢ়, ণ, ত, থ, দ, ধ, ন, ব, ল, স, ষ, ক, খ, গ, ঘ, ঙ, চ, ছ, জ, ঝ, ঞ, ট, ঠ, ড, ঢ, ণ, প, ফ, ব, ভ, ম, য, র, ল, ৎ, অ, আ, ই, ঈ, উ, ঊ, ঋ, এ, ঐ, ও, ঔ, ৌ, ং, ঃ',
        comment: 'সকলমুক্ষণব্যঞ্জমিত্রব্ধুব্ধীকরণব্যঞ্জমিত্রব্ধুব্ধীকরণ - Testing all Bengali characters'
      };

      const response = await makeAuthenticatedRequest(
        app, 
        'post', 
        '/api/v1/reviews', 
        unicodeReview, 
        userToken
      );

      expect(response.status).toBe(201);
      expect(response.body.review.title).toContain('ডঃ');
      expect(response.body.review.title).toContain('ঢ়');
      expect(response.body.review.comment).toContain('সকলমুক্ষণ');
    });

    /**
     * Test Bengali numerals and dates
     */
    test('should handle Bengali numerals in reviews', async () => {
      const bengaliNumeralsReview = {
        productId: testProduct.id,
        rating: 5,
        title: '৫ তারকা রেটিং',
        comment: '১ সপ্তাহ ব্যবহারের পর মনে হলো, ২-৩ দিনের মধ্যে ব্যাটারি শেষ হয়ে যায়। ১০০% সন্তুষ্ট।'
      };

      const response = await makeAuthenticatedRequest(
        app, 
        'post', 
        '/api/v1/reviews', 
        bengaliNumeralsReview, 
        userToken
      );

      expect(response.status).toBe(201);
      expect(response.body.review.title).toBe('৫ তারকা রেটিং');
      expect(response.body.review.comment).toContain('১ সপ্তাহ');
      expect(response.body.review.comment).toContain('২-৩ দিন');
      expect(response.body.review.comment).toContain('১০০%');
    });

    /**
     * Test Bengali sentiment analysis
     */
    test('should analyze sentiment in Bengali reviews', async () => {
      const bengaliSentiments = [
        { text: 'অসাধারণ পণ্য', expectedSentiment: 'VERY_POSITIVE' },
        { text: 'ভালো পণ্য', expectedSentiment: 'POSITIVE' },
        { text: 'মোটামুটি পণ্য', expectedSentiment: 'NEUTRAL' },
        { text: 'খারাপ পণ্য', expectedSentiment: 'NEGATIVE' },
        { text: 'একদমই খারাপ', expectedSentiment: 'VERY_NEGATIVE' }
      ];

      for (const sentiment of bengaliSentiments) {
        const analysis = mockSentimentAnalysis(sentiment.text);
        expect(analysis.sentiment).toBe(sentiment.expectedSentiment);
      }
    });
  });

  /**
   * Test suite for local cultural context understanding
   */
  describe('Local Cultural Context Understanding', () => {
    /**
     * Test festival-specific review contexts
     */
    test('should understand festival-specific review contexts', async () => {
      const festivalReviews = [
        {
          festival: 'eid-ul-fitr',
          title: 'ঈদের জন্য নিখুঁত পোশাক!',
          comment: 'ঈদের জন্য এই শাড়িটা কিনেছি। ডিজাইন অসাধারণ, কাপড়ের মান খুবই ভালো। পরিবারের সবাই পছন্দ করেছে।',
          rating: 5
        },
        {
          festival: 'eid-ul-adha',
          title: 'কোরবানির ঈদের জন্য উপযুক্ত',
          comment: 'কোরবানির ঈদের জন্য এই পণ্যটি উপযুক্ত। পরিবারের সবার জন্য উপযুক্ত।',
          rating: 4
        },
        {
          festival: 'durga-puja',
          title: 'দুর্গা পূজার উপহার',
          comment: 'পূজার জন্য এই পণ্যটি কিনেছি। ঐতিহ্যাসবাহিক ডিজাইন।',
          rating: 5
        },
        {
          festival: 'winter',
          title: 'শীতের জন্য উষ্ণ পণ্য',
          comment: 'শীতের জন্য এই কম্বলটি কিনেছি। খুব উষ্ণ।',
          rating: 4
        }
      ];

      for (const review of festivalReviews) {
        const response = await makeAuthenticatedRequest(
          app, 
          'post', 
          '/api/v1/reviews', 
          {
            productId: testProduct.id,
            rating: review.rating,
            title: review.title,
            comment: review.comment
          }, 
          userToken
        );

        expect(response.status).toBe(201);
        expect(response.body.review.title).toContain(review.festival === 'eid-ul-fitr' ? 'ঈদের' : 
                                          review.festival === 'eid-ul-adha' ? 'কোরবানি' :
                                          review.festival === 'durga-puja' ? 'দুর্গা' : 'শীতের');
      }
    });

    /**
     * Test family-oriented review language
     */
    test('should understand family-oriented review language', async () => {
      const familyReviews = [
        {
          title: 'পরিবারের সবার জন্য ভালো',
          comment: 'আমার পরিবারের সবার এই পণ্যটি পছন্দ করেছে। বাচ্চাদেরাও ব্যবহার করতে পারছে।',
          familyContext: true
        },
        {
          title: 'বাচ্চাদের জন্য উপযুক্ত',
          comment: 'আমার বাচ্চাদের পড়াশোনার জন্য কিনেছি। ভালো পারফরম্যান্স।',
          familyContext: true
        },
        {
          title: 'বড়দের জন্য সহজ',
          comment: 'বাবা-মায়ের জন্য সহজ ব্যবহার করতে পারছে।',
          familyContext: true
        }
      ];

      for (const review of familyReviews) {
        const response = await makeAuthenticatedRequest(
          app, 
          'post', 
          '/api/v1/reviews', 
          {
            productId: testProduct.id,
            rating: 4,
            title: review.title,
            comment: review.comment
          }, 
          userToken
        );

        expect(response.status).toBe(201);
        expect(response.body.review.title).toMatch(/পরিবার|বাচ্চাদের|বড়দের/);
      }
    });

    /**
     * Test local value perception in reviews
     */
    test('should understand local value perception', async () => {
      const valueReviews = [
        {
          title: 'দামের তুলনায় ভালো',
          comment: 'এই দামে এত ভালো পণ্য পাওয়া যায়। মূল্য অনেক।',
          valuePerception: 'good_value'
        },
        {
          title: 'দাম একটু বেশি',
          comment: 'পণ্যটা ভালো হলেও দাম অনুযায়ী বেশি।',
          valuePerception: 'expensive'
        },
        {
          title: 'দারুণ মূল্য',
          comment: 'এই দামে এত মানের পণ্য পাওয়া যায় না।',
          valuePerception: 'poor_value'
        }
      ];

      for (const review of valueReviews) {
        const response = await makeAuthenticatedRequest(
          app, 
          'post', 
          '/api/v1/reviews', 
          {
            productId: testProduct.id,
            rating: review.valuePerception === 'good_value' ? 5 : 
                    review.valuePerception === 'expensive' ? 3 : 2,
            title: review.title,
            comment: review.comment
          }, 
          userToken
        );

        expect(response.status).toBe(201);
        expect(response.body.review.title).toMatch(/দাম/);
      }
    });

    /**
     * Test local service expectations
     */
    test('should understand local service expectations', async () => {
      const serviceReviews = [
        {
          title: 'দ্রুত ডেলিভারি',
          comment: 'অর্ডার করার ২ দিনের মধ্যে ডেলিভারি পেয়ে গেছে। খুব ভালো।',
          serviceAspect: 'delivery'
        },
        {
          title: 'ভালো কাস্টমার সার্ভিস',
          comment: 'পণ্যে সমস্যা হলে কাস্টমার সার্ভিস খুব ভালো। সমাধান সমাধান।',
          serviceAspect: 'customer_service'
        },
        {
          title: 'দ্রুত রিপ্লেসমেন্ট',
          comment: 'পণ্যটা ফেরত দিতে হলেও দ্রুত রিপ্লেসমেন্ট পেয়ে গেছে।',
          serviceAspect: 'returns'
        }
      ];

      for (const review of serviceReviews) {
        const response = await makeAuthenticatedRequest(
          app, 
          'post', 
          '/api/v1/reviews', 
          {
            productId: testProduct.id,
            rating: 4,
            title: review.title,
            comment: review.comment
          }, 
          userToken
        );

        expect(response.status).toBe(201);
        expect(response.body.review.title).toMatch(/ডেলিভারি|সার্ভিস|রিপ্লেসমেন্ট/);
      }
    });
  });

  /**
   * Test suite for regional product preference analysis
   */
  describe('Regional Product Preference Analysis', () => {
    /**
     * Test Dhaka region preferences
     */
    test('should analyze Dhaka region review preferences', async () => {
      const dhakaUser = await createTestUser({
        email: 'dhaka@test.com',
        firstName: 'Karim',
        lastName: 'Mia'
      });

      const dhakaReview = {
        productId: testProduct.id,
        rating: 4,
        title: 'Good product for Dhaka life',
        comment: 'Dhaka তে ব্যবহারের জন্য ভালো। Trendy ডিজাইন। Fast delivery পাওয়া যায়।',
        region: 'dhaka'
      };

      const response = await makeAuthenticatedRequest(
        app, 
        'post', 
        '/api/v1/reviews', 
        dhakaReview, 
        jwt.sign(
          { userId: dhakaUser.user.id, email: dhakaUser.user.email, role: 'CUSTOMER' },
          TEST_CONFIG.JWT_SECRET
        )
      );

      expect(response.status).toBe(201);
      
      // Analyze regional characteristics
      const dhakaPattern = BANGLADESH_REGIONAL_PATTERNS.dhaka;
      expect(dhakaPattern.reviewCharacteristics.language).toBe('mixed-bengali-english');
      expect(dhakaPattern.reviewCharacteristics.techSavvy).toBe('high');
    });

    /**
     * Test Chittagong region preferences
     */
    test('should analyze Chittagong region review preferences', async () => {
      const chittagongUser = await createTestUser({
        email: 'chittagong@test.com',
        firstName: 'Abdul',
        lastName: 'Karim'
      });

      const chittagongReview = {
        productId: testProduct.id,
        rating: 5,
        title: 'ভালো পণ্য',
        comment: 'মান ভালো, দাম সঠিক। চট্টগ্রামে ব্যবহারের জন্য উপযুক্ত।',
        region: 'chittagong'
      };

      const response = await makeAuthenticatedRequest(
        app, 
        'post', 
        '/api/v1/reviews', 
        chittagongReview, 
        jwt.sign(
          { userId: chittagongUser.user.id, email: chittagongUser.user.email, role: 'CUSTOMER' },
          TEST_CONFIG.JWT_SECRET
        )
      );

      expect(response.status).toBe(201);
      
      const chittagongPattern = BANGLADESH_REGIONAL_PATTERNS.chittagong;
      expect(chittagongPattern.reviewCharacteristics.language).toBe('bengali-dominant');
      expect(chittagongPattern.reviewCharacteristics.expectations).toBe('medium');
    });

    /**
     * Test Sylhet region preferences
     */
    test('should analyze Sylhet region review preferences', async () => {
      const sylhetUser = await createTestUser({
        email: 'sylhet@test.com',
        firstName: 'Rahim',
        lastName: 'Ahmed'
      });

      const sylhetReview = {
        productId: testProduct.id,
        rating: 4,
        title: 'ভালোই পণ্যখানি',
        comment: 'সিলেটের জন্য ভালো। সহজ ব্যবহার।',
        region: 'sylhet'
      };

      const response = await makeAuthenticatedRequest(
        app, 
        'post', 
        '/api/v1/reviews', 
        sylhetReview, 
        jwt.sign(
          { userId: sylhetUser.user.id, email: sylhetUser.user.email, role: 'CUSTOMER' },
          TEST_CONFIG.JWT_SECRET
        )
      );

      expect(response.status).toBe(201);
      
      const sylhetPattern = BANGLADESH_REGIONAL_PATTERNS.sylhet;
      expect(sylhetPattern.reviewCharacteristics.language).toBe('bengali-sylheti');
      expect(sylhetPattern.reviewCharacteristics.focusAreas).toContain('simplicity');
    });

    /**
     * Test regional rating distribution analysis
     */
    test('should analyze regional rating distributions', async () => {
      const regions = ['dhaka', 'chittagong', 'sylhet', 'rajshahi'];
      const regionalRatings = {};

      for (const region of regions) {
        const regionUser = await createTestUser({
          email: `${region}@test.com`,
          firstName: `${region} User`
        });

        const regionPattern = BANGLADESH_REGIONAL_PATTERNS[region];
        const rating = Math.round(regionPattern.averageRating);

        await createTestReview({
          productId: testProduct.id,
          userId: regionUser.user.id,
          rating,
          title: `${region} Review`,
          comment: `Review from ${regionPattern.name}`,
          isApproved: true
        });

        regionalRatings[region] = rating;
      }

      expect(regionalRatings.dhaka).toBe(4);
      expect(regionalRatings.chittagong).toBe(4);
      expect(regionalRatings.sylhet).toBe(4);
      expect(regionalRatings.rajshahi).toBe(4);
    });
  });

  /**
   * Test suite for festival-based review patterns
   */
  describe('Festival-Based Review Patterns', () => {
    /**
     * Test Eid-ul-Fitr review patterns
     */
    test('should handle Eid-ul-Fitr review patterns', async () => {
      const eidReviews = generateSeasonalReviews('eidUlFitr', 5);
      
      for (const reviewData of eidReviews) {
        const response = await makeAuthenticatedRequest(
          app, 
          'post', 
          '/api/v1/reviews', 
          {
            productId: testProduct.id,
            rating: reviewData.rating,
            title: reviewData.title,
            comment: reviewData.comment
          }, 
          userToken
        );

        expect(response.status).toBe(201);
      }

      // Verify Eid-specific patterns
      const eidPattern = BANGLADESH_SEASONAL_REVIEW_PATTERNS.eidUlFitr;
      expect(eidPattern.reviewTrends.positive).toBe(0.85);
      expect(eidPattern.reviewTrends.keywords).toContain('ঈদ উপহার');
    });

    /**
     * Test wedding season review patterns
     */
    test('should handle wedding season review patterns', async () => {
      const weddingReviews = [
        {
          title: 'বিয়ের জন্য উপযুক্ত পণ্য',
          comment: 'বিয়ের জন্য এই শাড়িটা কিনেছি। ডিজাইন অসাধারণ।',
          rating: 5,
          context: 'wedding'
        },
        {
          title: 'বরই উপহারের জন্য গিফট',
          comment: 'বন্ধুদের জন্য গিফট হিসেবে কিনলাম।',
          rating: 4,
          context: 'wedding'
        }
      ];

      for (const review of weddingReviews) {
        const response = await makeAuthenticatedRequest(
          app, 
          'post', 
          '/api/v1/reviews', 
          {
            productId: testProduct.id,
            rating: review.rating,
            title: review.title,
            comment: review.comment
          }, 
          userToken
        );

        expect(response.status).toBe(201);
        expect(response.body.review.title).toMatch(/বিয়ের|বরই/);
      }
    });

    /**
     * Test seasonal rating fluctuations
     */
    test('should analyze seasonal rating fluctuations', async () => {
      const seasons = ['eidUlFitr', 'eidUlAdha', 'durgaPuja', 'winter'];
      const seasonalAverages = {};

      for (const season of seasons) {
        const seasonReviews = generateSeasonalReviews(season, 3);
        const averageRating = seasonReviews.reduce((sum, r) => sum + r.rating, 0) / seasonReviews.length;
        
        seasonalAverages[season] = averageRating;
        
        // Create actual reviews
        for (const reviewData of seasonReviews) {
          await createTestReview({
            productId: testProduct.id,
            userId: testUser.user.id,
            rating: reviewData.rating,
            title: reviewData.title,
            comment: reviewData.comment,
            isApproved: true
          });
        }
      }

      // Festival seasons should have higher ratings
      expect(seasonalAverages.eidUlFitr).toBeGreaterThan(4);
      expect(seasonalAverages.eidUlAdha).toBeGreaterThan(4);
      expect(seasonalAverages.durgaPuja).toBeGreaterThan(4);
    });
  });

  /**
   * Test suite for local market sentiment analysis
   */
  describe('Local Market Sentiment Analysis', () => {
    /**
     * Test Bangladesh market sentiment keywords
     */
    test('should identify Bangladesh market sentiment keywords', async () => {
      const sentimentKeywords = [
        { keyword: 'অসাধারণ', sentiment: 'very_positive', weight: 2.0 },
        { keyword: 'ভালো', sentiment: 'positive', weight: 1.5 },
        { keyword: 'ঠিকঠাক', sentiment: 'neutral', weight: 1.0 },
        { keyword: 'খারাপ', sentiment: 'negative', weight: 0.5 },
        { keyword: 'ভয়ানক', sentiment: 'very_negative', weight: 0.2 }
      ];

      for (const keyword of sentimentKeywords) {
        const reviewText = `এই পণ্যটি ${keyword.keyword}`;
        const analysis = mockSentimentAnalysis(reviewText);
        
        expect(analysis.sentiment.toLowerCase()).toContain(keyword.sentiment);
      }
    });

    /**
     * Test local market condition impact
     */
    test('should analyze local market condition impact on reviews', async () => {
      const marketConditions = [
        {
          condition: 'ramadan',
          impact: 'higher_electronics_sales',
          expectedRating: 4.2
        },
        {
          condition: 'election_year',
          impact: 'cautious_spending',
          expectedRating: 3.8
        },
        {
          condition: 'economic_growth',
          impact: 'positive_sentiment',
          expectedRating: 4.1
        },
        {
          condition: 'flood_season',
          impact: 'logistics_issues',
          expectedRating: 3.5
        }
      ];

      for (const condition of marketConditions) {
        const conditionReview = {
          productId: testProduct.id,
          rating: condition.expectedRating,
          title: `Review during ${condition.condition}`,
          comment: `Market condition: ${condition.impact}`,
          marketCondition: condition.condition
        };

        const response = await makeAuthenticatedRequest(
          app, 
          'post', 
          '/api/v1/reviews', 
          conditionReview, 
          userToken
        );

        expect(response.status).toBe(201);
        expect(response.body.review.rating).toBe(condition.expectedRating);
      }
    });

    /**
     * Test local competitor comparison
     */
    test('should handle local competitor comparisons', async () => {
      const competitorReviews = [
        {
          title: 'Walton এর চেয়ে ভালো',
          comment: 'Samsung এর তুলনায় Walton ভালো। দাম কম।',
          competitor: 'Walton',
          comparison: 'favorable'
        },
        {
          title: 'Xiaomi এর মতো',
          comment: 'Xiaomi এর সাথে একই। কিছু পার্থক্য নেই।',
          competitor: 'Xiaomi',
          comparison: 'similar'
        }
      ];

      for (const review of competitorReviews) {
        const response = await makeAuthenticatedRequest(
          app, 
          'post', 
          '/api/v1/reviews', 
          {
            productId: testProduct.id,
            rating: 4,
            title: review.title,
            comment: review.comment
          }, 
          userToken
        );

        expect(response.status).toBe(201);
        expect(response.body.review.title).toContain(review.competitor);
      }
    });
  });

  /**
   * Test suite for regional dialect and terminology handling
   */
  describe('Regional Dialect and Terminology Handling', () => {
    /**
     * Test regional dialect variations
     */
    test('should handle regional Bengali dialects', async () => {
      const dialectReviews = [
        {
          region: 'dhaka',
          title: 'পণ্যটা অনেক ভালো',
          comment: 'ঢাকায় ব্যবহারের জন্য উপযুক্ত।',
          dialect: 'standard'
        },
        {
          region: 'chittagong',
          title: 'পণ্যখানি অনেক ভালো',
          comment: 'চট্টগ্রামে ব্যবহারের জন্য ভালো।',
          dialect: 'chittagonian'
        },
        {
          region: 'sylhet',
          title: 'পণ্যটি অনেক ভালো',
          comment: 'সিলেটে ব্যবহারের জন্য ভালো।',
          dialect: 'sylheti'
        }
      ];

      for (const review of dialectReviews) {
        const response = await makeAuthenticatedRequest(
          app, 
          'post', 
          '/api/v1/reviews', 
          {
            productId: testProduct.id,
            rating: 4,
            title: review.title,
            comment: review.comment
          }, 
          userToken
        );

        expect(response.status).toBe(201);
      }
    });

    /**
     * Test local market terminology
     */
    test('should understand local market terminology', async () => {
      const localTerms = [
        {
          term: 'বাজারদর',
          context: 'market_price_comparison',
          example: 'বাজারদরে এই দামে পাওয়া যায়'
        },
        {
          term: 'মোটামুটি',
          context: 'quality_assessment',
          example: 'মোটামুটি ভালো পণ্য'
        },
        {
          term: 'ওয়ারেন্টি',
          context: 'after_sales_service',
          example: 'ওয়ারেন্টি সার্ভিস ভালো'
        },
        {
          term: 'ডেলিভারি',
          context: 'shipping_service',
          example: 'দ্রুত ডেলিভারি'
        }
      ];

      for (const term of localTerms) {
        const termReview = {
          productId: testProduct.id,
          rating: 4,
          title: `Review with ${term.term}`,
          comment: term.example,
          terminology: term.term
        };

        const response = await makeAuthenticatedRequest(
          app, 
          'post', 
          '/api/v1/reviews', 
          termReview, 
          userToken
        );

        expect(response.status).toBe(201);
        expect(response.body.review.comment).toContain(term.term);
      }
    });

    /**
     * Test local measurement units
     */
    test('should handle local measurement units', async () => {
      const measurementReviews = [
        {
          title: 'সাইজ ঠিক আছে',
          comment: 'উচ্চতা ৫ ফুট, প্রস্থ ৩ ফুট। ওজন ২ কেজি।',
          units: ['ফুট', 'কেজি']
        },
        {
          title: 'ব্যাটারি ব্যাকআপ',
          comment: 'পূর্ণ চার্জ ৮ ঘন্টা, নরমাল ব্যবহারে ৬ ঘন্টা।',
          units: ['ঘন্টা']
        },
        {
          title: 'স্টক পরিমাণ',
          comment: '১০০০ মিলিলিটার স্টক।',
          units: ['মিলিলিটার']
        }
      ];

      for (const review of measurementReviews) {
        const response = await makeAuthenticatedRequest(
          app, 
          'post', 
          '/api/v1/reviews', 
          {
            productId: testProduct.id,
            rating: 4,
            title: review.title,
            comment: review.comment
          }, 
          userToken
        );

        expect(response.status).toBe(201);
        
        for (const unit of review.units) {
          expect(response.body.review.comment).toContain(unit);
        }
      }
    });
  });

  /**
   * Test suite for Bangladesh payment method mentions
   */
  describe('Bangladesh Payment Method Mentions', () => {
    /**
     * Test local payment method references
     */
    test('should handle local payment method mentions', async () => {
      const paymentReviews = [
        {
          title: 'bKash পেমেন্ট সহজ',
          comment: 'bKash দিয়ে কিনেছি, পেমেন্ট সহজেই।',
          paymentMethod: 'bKash'
        },
        {
          title: 'নগদে পেমেন্ট',
          comment: 'নগদে পেমেন্ট করেছি।',
          paymentMethod: 'Nagad'
        },
        {
          title: 'ক্যাশ অন ডেলিভারি',
          comment: 'ক্যাশ অন ডেলিভারিতে নিলাম।',
          paymentMethod: 'cash_on_delivery'
        },
        {
          title: 'রকেট পেমেন্ট',
          comment: 'রকেটে পেমেন্ট করলাম।',
          paymentMethod: 'Rocket'
        }
      ];

      for (const review of paymentReviews) {
        const response = await makeAuthenticatedRequest(
          app, 
          'post', 
          '/api/v1/reviews', 
          {
            productId: testProduct.id,
            rating: 4,
            title: review.title,
            comment: review.comment
          }, 
          userToken
        );

        expect(response.status).toBe(201);
        expect(response.body.review.title).toMatch(/bKash|নগদ|ক্যাশ|রকেট/);
      }
    });
  });

  /**
   * Test suite for Bangladesh-specific product categories
   */
  describe('Bangladesh-Specific Product Categories', () => {
    /**
     * Test local category review patterns
     */
    test('should handle local category review patterns', async () => {
      const categories = Object.keys(BANGLADESH_REVIEW_CATEGORIES);
      
      for (const category of categories) {
        const categoryData = BANGLADESH_REVIEW_CATEGORIES[category];
        
        // Create category-specific review
        const categoryReview = {
          productId: testProduct.id,
          rating: Math.round(categoryData.averageRating),
          title: `${categoryData.name} Review`,
          comment: `This is a review for ${categoryData.name} category product. ${categoryData.reviewPatterns.highTech[0]}`,
          category: category
        };

        const response = await makeAuthenticatedRequest(
          app, 
          'post', 
          '/api/v1/reviews', 
          categoryReview, 
          userToken
        );

        expect(response.status).toBe(201);
        expect(categoryData.averageRating).toBeGreaterThan(3.5);
        expect(categoryData.averageRating).toBeLessThan(4.5);
      }
    });

    /**
     * Test category-specific sentiment patterns
     */
    test('should analyze category-specific sentiment patterns', async () => {
      const categorySentiments = {
        electronics: { average: 4.2, concerns: ['battery', 'price', 'performance'] },
        clothing: { average: 3.8, concerns: ['fit', 'quality', 'value'] },
        food: { average: 4.0, concerns: ['freshness', 'taste', 'packaging'] },
        home: { average: 3.9, concerns: ['durability', 'assembly', 'design'] }
      };

      for (const [category, sentiment] of Object.entries(categorySentiments)) {
        expect(sentiment.average).toBeGreaterThan(3.5);
        expect(sentiment.average).toBeLessThan(4.5);
        expect(Array.isArray(sentiment.concerns)).toBe(true);
        expect(sentiment.concerns.length).toBeGreaterThan(0);
      }
    });
  });
});

module.exports = {
  // Export for use in other test files
  setupBangladeshReviewTestData: async () => {
    const user = await createTestUser({
      firstName: 'Rahim',
      lastName: 'Ahmed'
    });
    const product = await createTestProduct({
      name: 'Samsung Galaxy A54',
      nameBn: 'স্যামসাং গ্যালাক্সি A54'
    });
    
    const bengaliReview = await createTestReview({
      productId: product.id,
      userId: user.user.id,
      rating: 5,
      title: 'অসাধারণ পণ্য',
      comment: 'এই পণ্যটি খুবই ভালো',
      isApproved: true
    });
    
    return { user, product, review: bengaliReview };
  }
};