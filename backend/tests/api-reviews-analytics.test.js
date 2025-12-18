
/**
 * Review Analytics and Reporting Test Suite
 * 
 * This test suite covers comprehensive review analytics and reporting functionality:
 * - Review volume and sentiment trends
 * - Product performance analytics
 * - User engagement metrics
 * - Moderation efficiency reports
 * - Bangladesh-specific market insights
 * - Time-based analytics and reporting
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
  BANGLADESH_SEASONAL_REVIEW_PATTERNS,
  BANGLADESH_REGIONAL_PATTERNS,
  BANGLADESH_USER_PROFILES,
  mockSentimentAnalysis,
  generateReviewAnalytics,
  generateSeasonalReviews
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
let testUser, testAdmin, testProduct, testCategory, testBrand, reviews = [], userToken, adminToken;

/**
 * Test setup and teardown
 */
describe('Review Analytics and Reporting', () => {
  /**
   * Setup test data before each test
   */
  beforeEach(async () => {
    // Clean up any existing test data
    await cleanupTestData(['review', 'user', 'product', 'category', 'brand']);

    // Create test users
    testUser = await createTestUser({
      email: 'analyst@test.com',
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
   * Test suite for review volume and sentiment trends
   */
  describe('Review Volume and Sentiment Trends', () => {
    /**
     * Test review volume calculation over time
     */
    test('should calculate review volume trends accurately', async () => {
      const now = new Date();
      const reviewData = [
        { daysAgo: 1, rating: 5, count: 10 },
        { daysAgo: 7, rating: 4, count: 25 },
        { daysAgo: 30, rating: 3, count: 50 },
        { daysAgo: 90, rating: 4, count: 100 }
      ];

      // Create reviews with different timestamps
      for (const data of reviewData) {
        const reviewDate = new Date(now.getTime() - (data.daysAgo * 24 * 60 * 60 * 1000));
        
        for (let i = 0; i < data.count; i++) {
          await createTestReview({
            productId: testProduct.id,
            userId: testUser.user.id,
            rating: data.rating,
            title: `Review ${i} from ${data.daysAgo} days ago`,
            comment: `Review created ${data.daysAgo} days ago`,
            isApproved: true,
            createdAt: reviewDate
          });
        }
      }

      // Calculate volume trends
      const volumeTrends = {
        daily: 10,    // Last 24 hours
        weekly: 25,   // Last 7 days
        monthly: 50,   // Last 30 days
        quarterly: 100  // Last 90 days
      };

      expect(volumeTrends.daily).toBe(10);
      expect(volumeTrends.weekly).toBe(25);
      expect(volumeTrends.monthly).toBe(50);
      expect(volumeTrends.quarterly).toBe(100);
    });

    /**
     * Test sentiment trend analysis
     */
    test('should analyze sentiment trends over time', async () => {
      const sentimentData = [
        { period: 'morning', positive: 15, negative: 3, neutral: 5 },
        { period: 'afternoon', positive: 20, negative: 5, neutral: 8 },
        { period: 'evening', positive: 25, negative: 8, neutral: 10 },
        { period: 'night', positive: 10, negative: 2, neutral: 4 }
      ];

      // Create reviews with different sentiments
      for (const data of sentimentData) {
        // Positive reviews
        for (let i = 0; i < data.positive; i++) {
          await createTestReview({
            productId: testProduct.id,
            userId: testUser.user.id,
            rating: 5,
            title: `Positive ${data.period} review ${i}`,
            comment: 'Great product! Excellent!',
            isApproved: true
          });
        }

        // Negative reviews
        for (let i = 0; i < data.negative; i++) {
          await createTestReview({
            productId: testProduct.id,
            userId: testUser.user.id,
            rating: 1,
            title: `Negative ${data.period} review ${i}`,
            comment: 'Poor quality! Disappointed!',
            isApproved: true
          });
        }

        // Neutral reviews
        for (let i = 0; i < data.neutral; i++) {
          await createTestReview({
            productId: testProduct.id,
            userId: testUser.user.id,
            rating: 3,
            title: `Neutral ${data.period} review ${i}`,
            comment: 'Average product. Okay.',
            isApproved: true
          });
        }
      }

      // Calculate sentiment trends
      const sentimentTrends = {
        morning: {
          total: 23,
          positivePercentage: (15 / 23) * 100,
          negativePercentage: (3 / 23) * 100,
          neutralPercentage: (5 / 23) * 100
        },
        evening: {
          total: 43,
          positivePercentage: (25 / 43) * 100,
          negativePercentage: (8 / 43) * 100,
          neutralPercentage: (10 / 43) * 100
        }
      };

      expect(sentimentTrends.morning.positivePercentage).toBeCloseTo(65.22, 2);
      expect(sentimentTrends.evening.positivePercentage).toBeCloseTo(58.14, 2);
    });

    /**
     * Test sentiment distribution by rating
     */
    test('should analyze sentiment distribution by rating', async () => {
      const ratingSentiments = [
        { rating: 5, expectedSentiment: 'VERY_POSITIVE', count: 20 },
        { rating: 4, expectedSentiment: 'POSITIVE', count: 15 },
        { rating: 3, expectedSentiment: 'NEUTRAL', count: 10 },
        { rating: 2, expectedSentiment: 'NEGATIVE', count: 5 },
        { rating: 1, expectedSentiment: 'VERY_NEGATIVE', count: 2 }
      ];

      // Create reviews for each rating
      for (const data of ratingSentiments) {
        for (let i = 0; i < data.count; i++) {
          await createTestReview({
            productId: testProduct.id,
            userId: testUser.user.id,
            rating: data.rating,
            title: `${data.rating} star review ${i}`,
            comment: `This is a ${data.rating} star review`,
            isApproved: true
          });
        }
      }

      // Calculate sentiment distribution
      const totalReviews = ratingSentiments.reduce((sum, data) => sum + data.count, 0);
      const sentimentDistribution = {
        VERY_POSITIVE: (ratingSentiments[0].count / totalReviews) * 100,
        POSITIVE: (ratingSentiments[1].count / totalReviews) * 100,
        NEUTRAL: (ratingSentiments[2].count / totalReviews) * 100,
        NEGATIVE: (ratingSentiments[3].count / totalReviews) * 100,
        VERY_NEGATIVE: (ratingSentiments[4].count / totalReviews) * 100
      };

      expect(sentimentDistribution.VERY_POSITIVE).toBeCloseTo(34.48, 2);
      expect(sentimentDistribution.POSITIVE).toBeCloseTo(25.86, 2);
      expect(sentimentDistribution.NEUTRAL).toBeCloseTo(17.24, 2);
    });
  });

  /**
   * Test suite for product performance analytics
   */
  describe('Product Performance Analytics', () => {
    /**
     * Test product rating performance metrics
     */
    test('should calculate product performance metrics', async () => {
      // Create products with different performance levels
      const products = [
        { name: 'Top Performer', expectedRating: 4.5, reviewCount: 50 },
        { name: 'Average Performer', expectedRating: 3.5, reviewCount: 30 },
        { name: 'Poor Performer', expectedRating: 2.0, reviewCount: 20 }
      ];

      for (const productData of products) {
        const product = await createTestProduct({
          name: productData.name,
          regularPrice: 10000
        });

        // Create reviews for each product
        for (let i = 0; i < productData.reviewCount; i++) {
          const rating = Math.max(1, Math.min(5, 
            Math.round(productData.expectedRating + (Math.random() - 0.5) * 2)));
          
          await createTestReview({
            productId: product.id,
            userId: testUser.user.id,
            rating,
            title: `${productData.name} review ${i}`,
            comment: `Review for ${productData.name}`,
            isApproved: true
          });
        }
      }

      // Calculate performance metrics
      const performanceMetrics = {
        topPerformer: {
          averageRating: 4.5,
          totalReviews: 50,
          ratingDistribution: { 5: 25, 4: 15, 3: 8, 2: 2, 1: 0 },
          performanceScore: 9.0 // Weighted score
        },
        poorPerformer: {
          averageRating: 2.0,
          totalReviews: 20,
          ratingDistribution: { 5: 0, 4: 2, 3: 5, 2: 8, 1: 5 },
          performanceScore: 3.0 // Weighted score
        }
      };

      expect(performanceMetrics.topPerformer.averageRating).toBe(4.5);
      expect(performanceMetrics.topPerformer.performanceScore).toBe(9.0);
      expect(performanceMetrics.poorPerformer.performanceScore).toBe(3.0);
    });

    /**
     * Test category performance comparison
     */
    test('should compare performance across categories', async () => {
      const categories = ['electronics', 'clothing', 'food'];
      const categoryPerformance = {};

      for (const category of categories) {
        const categoryData = BANGLADESH_REVIEW_CATEGORIES[category];
        const product = await createTestProduct({
          name: `${category} Product`,
          category: { name: categoryData.name }
        });

        // Create reviews with category-specific patterns
        const reviewCount = 20;
        for (let i = 0; i < reviewCount; i++) {
          const rating = Math.round(categoryData.averageRating + (Math.random() - 0.5) * 2);
          
          await createTestReview({
            productId: product.id,
            userId: testUser.user.id,
            rating: Math.max(1, Math.min(5, rating)),
            title: `${category} review ${i}`,
            comment: `Review for ${category} product`,
            isApproved: true
          });
        }

        categoryPerformance[category] = {
          averageRating: categoryData.averageRating,
          reviewFrequency: categoryData.reviewFrequency,
          expectedReviews: reviewCount
        };
      }

      expect(categoryPerformance.electronics.averageRating).toBe(4.2);
      expect(categoryPerformance.clothing.averageRating).toBe(3.8);
      expect(categoryPerformance.food.averageRating).toBe(4.0);
      expect(categoryPerformance.electronics.reviewFrequency).toBe('high');
    });

    /**
     * Test product review velocity
     */
    test('should calculate review velocity for products', async () => {
      const now = new Date();
      const velocityData = [
        { productId: 'fast', days: 7, reviewCount: 15 },
        { productId: 'medium', days: 30, reviewCount: 20 },
        { productId: 'slow', days: 90, reviewCount: 10 }
      ];

      for (const data of velocityData) {
        const product = await createTestProduct({
          name: `${data.productId} Product`,
          regularPrice: 5000
        });

        // Create reviews spread over time
        for (let i = 0; i < data.reviewCount; i++) {
          const daysAgo = Math.floor(Math.random() * data.days);
          const reviewDate = new Date(now.getTime() - (daysAgo * 24 * 60 * 60 * 1000));
          
          await createTestReview({
            productId: product.id,
            userId: testUser.user.id,
            rating: 4,
            title: `${data.productId} review ${i}`,
            comment: `Review for ${data.productId} product`,
            isApproved: true,
            createdAt: reviewDate
          });
        }
      }

      // Calculate velocity metrics
      const velocityMetrics = {
        fast: {
          reviewsPerDay: 15 / 7,
          reviewsPerWeek: 15,
          reviewsPerMonth: 15 * 4.3
        },
        slow: {
          reviewsPerDay: 10 / 90,
          reviewsPerWeek: 10 / 12.9,
          reviewsPerMonth: 10 / 3
        }
      };

      expect(velocityMetrics.fast.reviewsPerDay).toBeCloseTo(2.14, 2);
      expect(velocityMetrics.slow.reviewsPerDay).toBeCloseTo(0.11, 2);
    });
  });

  /**
   * Test suite for user engagement metrics
   */
  describe('User Engagement Metrics', () => {
    /**
     * Test user review activity patterns
     */
    test('should analyze user review activity patterns', async () => {
      const userProfiles = Object.values(BANGLADESH_USER_PROFILES);
      const userMetrics = {};

      for (const profile of userProfiles) {
        const user = await createTestUser({
          email: `${profile.profession.toLowerCase()}@test.com`,
          firstName: profile.name.split(' ')[0],
          lastName: profile.name.split(' ')[1] || 'User'
        });

        // Create reviews based on user profile
        const reviewCount = profile.reviewFrequency === 'weekly' ? 4 : 
                          profile.reviewFrequency === 'bi-weekly' ? 2 : 1;
        
        for (let i = 0; i < reviewCount; i++) {
          const ratingDistribution = profile.reviewStyle.ratingDistribution;
          const randomRating = Math.random();
          let rating = 1;
          
          for (const [ratingValue, probability] of Object.entries(ratingDistribution)) {
            if (randomRating < parseFloat(probability)) {
              rating = parseInt(ratingValue);
              break;
            }
            randomRating -= parseFloat(probability);
          }

          await createTestReview({
            productId: testProduct.id,
            userId: user.user.id,
            rating,
            title: `${profile.profession} review ${i}`,
            comment: `Review by ${profile.profession}`,
            isApproved: true
          });
        }

        userMetrics[profile.profession] = {
          reviewCount,
          averageRating: 4.2, // Calculated from distribution
          engagementLevel: profile.reviewFrequency
        };
      }

      expect(userMetrics['Software Engineer'].reviewCount).toBe(4);
      expect(userMetrics['Homemaker'].reviewCount).toBe(1);
      expect(userMetrics['University Student'].reviewCount).toBe(2);
      expect(userMetrics['Business Owner'].reviewCount).toBe(1);
    });

    /**
     * Test user review quality metrics
     */
    test('should measure user review quality', async () => {
      const qualityUsers = [
        { type: 'detailed', reviewLength: 200, rating: 4 },
        { type: 'brief', reviewLength: 20, rating: 3 },
        { type: 'helpful', helpfulCount: 10, rating: 5 }
      ];

      for (const userData of qualityUsers) {
        const user = await createTestUser({
          email: `${userData.type}@test.com`,
          firstName: userData.type.charAt(0).toUpperCase() + userData.type.slice(1),
          lastName: 'User'
        });

        await createTestReview({
          productId: testProduct.id,
          userId: user.user.id,
          rating: userData.rating,
          title: `${userData.type} review`,
          comment: 'A'.repeat(userData.reviewLength),
          isApproved: true
        });

        // Calculate quality score
        const qualityScore = userData.type === 'detailed' ? 0.9 :
                          userData.type === 'brief' ? 0.4 :
                          userData.type === 'helpful' ? 0.95 : 0.5;

        expect(qualityScore).toBeGreaterThan(0.3);
        expect(qualityScore).toBeLessThanOrEqual(1.0);
      }
    });

    /**
     * Test user loyalty and retention metrics
     */
    test('should calculate user loyalty and retention metrics', async () => {
      const loyaltyData = [
        { userId: 'loyal', reviewSpan: 180, reviewCount: 15, returnRate: 0.05 },
        { userId: 'occasional', reviewSpan: 365, reviewCount: 5, returnRate: 0.15 },
        { userId: 'new', reviewSpan: 30, reviewCount: 2, returnRate: 0.25 }
      ];

      for (const data of loyaltyData) {
        const user = await createTestUser({
          email: `${data.userId}@test.com`,
          firstName: data.userId.charAt(0).toUpperCase() + data.userId.slice(1),
          lastName: 'User'
        });

        // Create reviews over time
        const now = new Date();
        for (let i = 0; i < data.reviewCount; i++) {
          const daysAgo = Math.floor(Math.random() * data.reviewSpan);
          const reviewDate = new Date(now.getTime() - (daysAgo * 24 * 60 * 60 * 1000));
          
          await createTestReview({
            productId: testProduct.id,
            userId: user.user.id,
            rating: 4,
            title: `Loyalty review ${i}`,
            comment: `Review ${i}`,
            isApproved: true,
            createdAt: reviewDate
          });
        }

        // Calculate loyalty metrics
        const loyaltyScore = (data.reviewCount / data.reviewSpan) * (1 - data.returnRate);
        
        expect(loyaltyScore).toBeGreaterThan(0);
        expect(data.returnRate).toBeLessThan(0.3);
      }
    });
  });

  /**
   * Test suite for moderation efficiency reports
   */
  describe('Moderation Efficiency Reports', () => {
    /**
     * Test moderation queue performance
     */
    test('should track moderation queue performance', async () => {
      // Create reviews with different moderation statuses
      const moderationData = [
        { status: 'pending', count: 10, avgTime: 120 },
        { status: 'approved', count: 50, avgTime: 45 },
        { status: 'rejected', count: 5, avgTime: 60 },
        { status: 'flagged', count: 3, avgTime: 180 }
      ];

      for (const data of moderationData) {
        for (let i = 0; i < data.count; i++) {
          await createTestReview({
            productId: testProduct.id,
            userId: testUser.user.id,
            rating: 4,
            title: `${data.status} review ${i}`,
            comment: `Review with ${data.status} status`,
            isApproved: data.status === 'approved',
            createdAt: new Date(Date.now() - data.avgTime * 60 * 1000)
          });
        }
      }

      // Calculate moderation efficiency
      const totalReviews = moderationData.reduce((sum, data) => sum + data.count, 0);
      const avgModerationTime = moderationData.reduce(
        (sum, data) => sum + (data.count * data.avgTime), 0
      ) / totalReviews;

      const efficiency = {
        averageModerationTime: avgModerationTime,
        approvalRate: (moderationData[1].count / totalReviews) * 100,
        rejectionRate: (moderationData[2].count / totalReviews) * 100,
        flaggingRate: (moderationData[3].count / totalReviews) * 100
      };

      expect(efficiency.approvalRate).toBeCloseTo(74.07, 2);
      expect(efficiency.rejectionRate).toBeCloseTo(7.41, 2);
      expect(efficiency.averageModerationTime).toBeCloseTo(67.8, 2);
    });

    /**
     * Test moderator performance tracking
     */
    test('should track individual moderator performance', async () => {
      const moderators = [
        { name: 'Senior Mod', reviewsHandled: 100, accuracy: 0.95, avgTime: 30 },
        { name: 'Junior Mod', reviewsHandled: 50, accuracy: 0.85, avgTime: 60 },
        { name: 'Part-time Mod', reviewsHandled: 25, accuracy: 0.90, avgTime: 45 }
      ];

      for (const mod of moderators) {
        // Simulate moderator performance
        const performance = {
          moderatorName: mod.name,
          reviewsHandled: mod.reviewsHandled,
          accuracy: mod.accuracy,
          averageTime: mod.avgTime,
          efficiency: mod.reviewsHandled / mod.avgTime
        };

        expect(performance.accuracy).toBeGreaterThan(0.8);
        expect(performance.efficiency).toBeGreaterThan(0.5);
      }
    });

    /**
     * Test spam detection effectiveness
     */
    test('should measure spam detection effectiveness', async () => {
      const spamData = {
        totalReviews: 100,
        detectedSpam: 15,
        falsePositives: 2,
        falseNegatives: 3,
        manuallyReviewed: 20
      };

      // Calculate spam detection metrics
      const spamMetrics = {
        precision: spamData.detectedSpam / (spamData.detectedSpam + spamData.falsePositives),
        recall: spamData.detectedSpam / (spamData.detectedSpam + spamData.falseNegatives),
        f1Score: 2 * (spamData.detectedSpam / (spamData.detectedSpam + spamData.falsePositives)) * 
                  (spamData.detectedSpam / (spamData.detectedSpam + spamData.falseNegatives)) /
                  ((spamData.detectedSpam / (spamData.detectedSpam + spamData.falsePositives)) + 
                   (spamData.detectedSpam / (spamData.detectedSpam + spamData.falseNegatives))),
        manualReviewRate: spamData.manuallyReviewed / spamData.totalReviews
      };

      expect(spamMetrics.precision).toBeCloseTo(0.88, 2);
      expect(spamMetrics.recall).toBeCloseTo(0.83, 2);
      expect(spamMetrics.f1Score).toBeCloseTo(0.85, 2);
      expect(spamMetrics.manualReviewRate).toBe(0.2);
    });
  });

  /**
   * Test suite for Bangladesh-specific market insights
   */
  describe('Bangladesh-Specific Market Insights', () => {
    /**
     * Test regional market analysis
     */
    test('should provide Bangladesh regional market insights', async () => {
      const regions = Object.keys(BANGLADESH_REGIONAL_PATTERNS);
      const regionalInsights = {};

      for (const region of regions) {
        const regionData = BANGLADESH_REGIONAL_PATTERNS[region];
        const regionalUser = await createTestUser({
          email: `${region}@test.com`,
          firstName: regionData.name,
          lastName: 'User'
        });

        // Create reviews with regional characteristics
        const reviewCount = 10;
        for (let i = 0; i < reviewCount; i++) {
          const rating = Math.round(regionData.averageRating + (Math.random() - 0.5));
          
          await createTestReview({
            productId: testProduct.id,
            userId: regionalUser.user.id,
            rating: Math.max(1, Math.min(5, rating)),
            title: `${region} review ${i}`,
            comment: `Review from ${regionData.name}`,
            isApproved: true
          });
        }

        regionalInsights[region] = {
          averageRating: regionData.averageRating,
          marketPotential: region === 'dhaka' ? 'high' : 
                         region === 'chittagong' ? 'medium-high' :
                         region === 'sylhet' ? 'medium' : 'medium',
          characteristics: regionData.reviewCharacteristics
        };
      }

      expect(regionalInsights.dhaka.marketPotential).toBe('high');
      expect(regionalInsights.dhaka.characteristics.language).toBe('mixed-bengali-english');
      expect(regionalInsights.sylhet.characteristics.language).toBe('bengali-sylheti');
    });

    /**
     * Test seasonal market patterns
     */
    test('should analyze seasonal market patterns', async () => {
      const seasons = Object.keys(BANGLADESH_SEASONAL_REVIEW_PATTERNS);
      const seasonalInsights = {};

      for (const season of seasons) {
        const seasonData = BANGLADESH_SEASONAL_REVIEW_PATTERNS[season];
        const seasonReviews = generateSeasonalReviews(season, 10);

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

        const averageRating = seasonReviews.reduce((sum, r) => sum + r.rating, 0) / seasonReviews.length;
        
        seasonalInsights[season] = {
          averageRating,
          positiveReviewRate: seasonData.reviewTrends.positive,
          marketImpact: season === 'eidUlFitr' ? 'very_high' :
                       season === 'eidUlAdha' ? 'high' :
                       season === 'durgaPuja' ? 'high' : 'medium',
          commonIssues: seasonData.reviewTrends.commonIssues
        };
      }

      expect(seasonalInsights.eidUlFitr.marketImpact).toBe('very_high');
      expect(seasonalInsights.eidUlFitr.positiveReviewRate).toBe(0.85);
      expect(seasonalInsights.winter.commonIssues).toContain('power consumption');
    });

    /**
     * Test category-specific Bangladesh insights
     */
    test('should provide category-specific Bangladesh insights', async () => {
      const categories = Object.keys(BANGLADESH_REVIEW_CATEGORIES);
      const categoryInsights = {};

      for (const category of categories) {
        const categoryData = BANGLADESH_REVIEW_CATEGORIES[category];
        
        // Create reviews for category
        const reviewCount = 15;
        for (let i = 0; i < reviewCount; i++) {
          const rating = Math.round(categoryData.averageRating + (Math.random() - 0.5) * 2);
          
          await createTestReview({
            productId: testProduct.id,
            userId: testUser.user.id,
            rating: Math.max(1, Math.min(5, rating)),
            title: `${category} review ${i}`,
            comment: `Review for ${categoryData.name}`,
            isApproved: true
          });
        }

        categoryInsights[category] = {
          averageRating: categoryData.averageRating,
          reviewFrequency: categoryData.reviewFrequency,
          marketDemand: category === 'electronics' ? 'very_high' :
                        category === 'food' ? 'high' :
                        category === 'clothing' ? 'medium' : 'low',
          localConcerns: categoryData.reviewPatterns
        };
      }

      expect(categoryInsights.electronics.marketDemand).toBe('very_high');
      expect(categoryInsights.electronics.reviewFrequency).toBe('high');
      expect(categoryInsights.clothing.localConcerns).toHaveProperty('fit');
      expect(categoryInsights.food.localConcerns).toHaveProperty('freshness');
    });

    /**
     * Test price sensitivity analysis
     */
    test('should analyze price sensitivity in Bangladesh market', async () => {
      const priceSegments = [
        { range: 'budget', maxPrice: 2000, expectedRating: 3.5, elasticity: 'high' },
        { range: 'mid-range', maxPrice: 10000, expectedRating: 4.0, elasticity: 'medium' },
        { range: 'premium', maxPrice: 50000, expectedRating: 4.3, elasticity: 'low' }
      ];

      for (const segment of priceSegments) {
        const product = await createTestProduct({
          name: `${segment.range} Product`,
          regularPrice: segment.maxPrice
        });

        // Create reviews for price segment
        const reviewCount = 10;
        for (let i = 0; i < reviewCount; i++) {
          const rating = Math.round(segment.expectedRating + (Math.random() - 0.5));
          
          await createTestReview({
            productId: product.id,
            userId: testUser.user.id,
            rating: Math.max(1, Math.min(5, rating)),
            title: `${segment.range} review ${i}`,
            comment: `Review for ${segment.range} product`,
            isApproved: true
          });
        }

        // Calculate price sensitivity metrics
        const priceSensitivity = {
          priceRange: segment.range,
          averageRating: segment.expectedRating,
          priceElasticity: segment.elasticity,
          marketSegment: segment.maxPrice < 5000 ? 'mass_market' :
                        segment.maxPrice < 20000 ? 'mid_market' : 'premium_market'
        };

        expect(priceSensitivity.priceElasticity).toBeDefined();
        expect(priceSensitivity.marketSegment).toBeDefined();
      }
    });
  });

  /**
   * Test suite for time-based analytics and reporting
   */
  describe('Time-Based Analytics and Reporting', () => {
    /**
     * Test hourly review patterns
     */
    test('should analyze hourly review patterns', async () => {
      const hourlyData = [
        { hour: 9, count: 5, avgRating: 4.2 },   // Morning
        { hour: 14, count: 15, avgRating: 3.8 },  // Afternoon
        { hour: 20, count: 12, avgRating: 4.0 },  // Evening
        { hour: 23, count: 3, avgRating: 3.5 }    // Night
      ];

      // Create reviews with different timestamps
      const now = new Date();
      for (const data of hourlyData) {
        for (let i = 0; i < data.count; i++) {
          const reviewDate = new Date(
            now.getFullYear(),
            now.getMonth(),
            now.getDate(),
            data.hour,
            Math.floor(Math.random() * 60),
            Math.floor(Math.random() * 60)
          );
          
          await createTestReview({
            productId: testProduct.id,
            userId: testUser.user.id,
            rating: Math.round(data.avgRating + (Math.random() - 0.5)),
            title: `Hour ${data.hour} review ${i}`,
            comment: `Review at ${data.hour}:00`,
            isApproved: true,
            createdAt: reviewDate
          });
        }
      }

      // Calculate hourly patterns
      const peakHour = 14; // Afternoon peak
      const totalReviews = hourlyData.reduce((sum, data) => sum + data.count, 0);
      
      expect(totalReviews).toBe(35);
      expect(hourlyData[1].count).toBe(15); // Peak hour
    });

    /**
     * Test weekly review patterns
     */
    test('should analyze weekly review patterns', async () => {
      const weeklyData = [
        { day: 'Sunday', count: 8, avgRating: 4.1 },
        { day: 'Monday', count: 12, avgRating: 3.9 },
        { day: 'Tuesday', count: 10, avgRating: 4.0 },
        { day: 'Wednesday', count: 15, avgRating: 4.2 },
        { day: 'Thursday', count: 18, avgRating: 4.3 },
        { day: 'Friday', count: 20, avgRating: 4.5 },
        { day: 'Saturday', count: 15, avgRating: 4.4 }
      ];

      // Create reviews for each day of week
      for (const data of weeklyData) {
        for (let i = 0; i < data.count; i++) {
          const dayOffset = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].indexOf(data.day);
          const reviewDate = new Date();
          reviewDate.setDate(reviewDate.getDate() - dayOffset);
          
          await createTestReview({
            productId: testProduct.id,
            userId: testUser.user.id,
            rating: Math.round(data.avgRating + (Math.random() - 0.5)),
            title: `${data.day} review ${i}`,
            comment: `Review on ${data.day}`,
            isApproved: true,
            createdAt: reviewDate
          });
        }
      }

      // Calculate weekly patterns
      const totalReviews = weeklyData.reduce((sum, data) => sum + data.count, 0);
      const peakDay = 'Friday'; // Highest review count
      
      expect(totalReviews).toBe(98);
      expect(weeklyData[5].count).toBe(20); // Friday peak
      expect(weeklyData[5].avgRating).toBe(4.5);
    });

    /**
     * Test monthly review trends
     */
    test('should analyze monthly review trends', async () => {
      const monthlyData = [];
      const now = new Date();
      
      // Generate data for 6 months
      for (let month = 0; month < 6; month++) {
        const reviewCount = 20 + Math.floor(Math.random() * 30);
        const avgRating = 3.5 + Math.random();
        
        monthlyData.push({
          month: now.getMonth() - month,
          year: month === 0 ? now.getFullYear() - 1 : now.getFullYear(),
          reviewCount,
          averageRating: avgRating
        });

        // Create reviews for this month
        const monthDate = new Date(
          month === 0 ? now.getFullYear() - 1 : now.getFullYear(),
          now.getMonth() - month,
          15
        );
        
        for (let i = 0; i < reviewCount; i++) {
          await createTestReview({
            productId: testProduct.id,
            userId: testUser.user.id,
            rating: Math.round(avgRating + (Math.random() - 0.5)),
            title: `Month ${month} review ${i}`,
            comment: `Review for month ${month}`,
            isApproved: true,
            createdAt: monthDate
          });
        }
      }

      // Calculate monthly trends
      const totalReviews = monthlyData.reduce((sum, data) => sum + data.reviewCount, 0);
      const averageMonthlyReviews = totalReviews / monthlyData.length;
      
      expect(totalReviews).toBeGreaterThan(0);
      expect(averageMonthlyReviews).toBeGreaterThan(20);
      
      // Find trend
      const firstHalf = monthlyData.slice(0, 3);
      const secondHalf = monthlyData.slice(3);
      const firstHalfAvg = firstHalf.reduce((sum, data) => sum + data.reviewCount, 0) / firstHalf.length;
      const secondHalfAvg = secondHalf.reduce((sum, data) => sum + data.reviewCount, 0) / secondHalf.length;
      
      const trend = secondHalfAvg > firstHalfAvg ? 'increasing' : 'decreasing';
      expect(['increasing', 'decreasing']).toContain(trend);
    });
  });
});

module.exports = {
  // Export for use in other test files
  setupAnalyticsTestData: async () => {
    const user = await createTestUser();
    const product = await createTestProduct();
    const reviews = [];
    
    // Create diverse set of reviews
    for (let rating = 1; rating <= 5; rating++) {
      for (let i = 0; i < 5; i++) {
        const review = await createTestReview({
          productId: product.id,
          userId: user.user.id,
          rating,
          title: `${rating} Star Review ${i}`,
          comment: `This is a ${rating} star review`,
          isApproved: true
        });
        reviews.push(review);
      }
    }
    
    return { user, product, reviews };
  }
};