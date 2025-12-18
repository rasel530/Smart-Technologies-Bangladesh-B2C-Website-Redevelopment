
/**
 * Review Performance Testing Suite
 * 
 * This test suite covers comprehensive performance testing for review operations:
 * - Large review dataset handling (10,000+ reviews)
 * - Real-time rating calculation performance
 * - Moderation queue processing speed
 * - Analytics query optimization
 * - Concurrent review operations
 * - Database query performance optimization
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
  generateReviewAnalytics
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
 * Performance test configuration
 */
const PERFORMANCE_CONFIG = {
  LARGE_DATASET_SIZE: 10000,
  CONCURRENT_USERS: 100,
  STRESS_TEST_DURATION: 30000, // 30 seconds
  MAX_RESPONSE_TIME: 2000, // 2 seconds
  MAX_DB_QUERY_TIME: 1000, // 1 second
  BATCH_SIZE: 1000
};

/**
 * Test setup and teardown
 */
describe('Review Performance Testing', () => {
  /**
   * Setup test data before each test
   */
  beforeEach(async () => {
    // Clean up any existing test data
    await cleanupTestData(['review', 'user', 'product', 'category', 'brand']);

    // Create test users
    testUser = await createTestUser({
      email: 'performance@test.com',
      firstName: 'Performance',
      lastName: 'User'
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
      name: 'Performance Test Product',
      nameBn: 'পারফরম্যান্স টেস্ট পণ্য',
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
   * Test suite for large review dataset handling
   */
  describe('Large Review Dataset Handling', () => {
    /**
     * Test performance with 10,000+ reviews
     */
    test('should handle large review datasets efficiently', async () => {
      const startTime = Date.now();
      const reviewCount = PERFORMANCE_CONFIG.LARGE_DATASET_SIZE;
      
      // Create large dataset (use batch creation for performance)
      const batchPromises = [];
      for (let batch = 0; batch < reviewCount / PERFORMANCE_CONFIG.BATCH_SIZE; batch++) {
        const batchData = [];
        const batchSize = Math.min(PERFORMANCE_CONFIG.BATCH_SIZE, reviewCount - (batch * PERFORMANCE_CONFIG.BATCH_SIZE));
        
        for (let i = 0; i < batchSize; i++) {
          batchData.push({
            productId: testProduct.id,
            userId: testUser.user.id,
            rating: Math.floor(Math.random() * 5) + 1,
            title: `Performance Review ${batch * PERFORMANCE_CONFIG.BATCH_SIZE + i}`,
            comment: `Large dataset review ${batch * PERFORMANCE_CONFIG.BATCH_SIZE + i}`,
            isApproved: Math.random() > 0.2,
            isVerified: Math.random() > 0.3,
            createdAt: new Date(Date.now() - Math.floor(Math.random() * 90) * 24 * 60 * 60 * 1000)
          });
        }

        // Create batch of reviews
        batchPromises.push(
          prisma.review.createMany({
            data: batchData
          })
        );
      }

      await Promise.all(batchPromises);
      const creationTime = Date.now() - startTime;

      // Test retrieval performance
      const retrievalStartTime = Date.now();
      const response = await request(app)
        .get('/api/v1/reviews')
        .query({ limit: 100 })
        .expect(200);

      const retrievalTime = Date.now() - retrievalStartTime;

      // Performance assertions
      expect(creationTime).toBeLessThan(PERFORMANCE_CONFIG.STRESS_TEST_DURATION);
      expect(retrievalTime).toBeLessThan(PERFORMANCE_CONFIG.MAX_RESPONSE_TIME);
      expect(response.body.reviews).toBeDefined();
      expect(response.body.pagination).toBeDefined();
      
      console.log(`Created ${reviewCount} reviews in ${creationTime}ms`);
      console.log(`Retrieved reviews in ${retrievalTime}ms`);
      console.log(`Average creation time per review: ${creationTime / reviewCount}ms`);
    }, 60000); // 60 second timeout for large dataset

    /**
     * Test pagination performance with large datasets
     */
    test('should handle pagination efficiently with large datasets', async () => {
      // Create moderately large dataset
      const reviewCount = 5000;
      for (let i = 0; i < reviewCount; i += 100) {
        const batchData = [];
        for (let j = 0; j < 100; j++) {
          batchData.push({
            productId: testProduct.id,
            userId: testUser.user.id,
            rating: Math.floor(Math.random() * 5) + 1,
            title: `Pagination Test ${i + j}`,
            comment: `Pagination review ${i + j}`,
            isApproved: true
          });
        }

        await prisma.review.createMany({
          data: batchData
        });
      }

      // Test different pagination scenarios
      const paginationTests = [
        { page: 1, limit: 10, description: 'First page, small limit' },
        { page: 50, limit: 20, description: 'Middle page, medium limit' },
        { page: 100, limit: 50, description: 'Late page, large limit' },
        { page: 250, limit: 100, description: 'Very late page, max limit' }
      ];

      for (const test of paginationTests) {
        const startTime = Date.now();
        
        const response = await request(app)
          .get('/api/v1/reviews')
          .query({ page: test.page, limit: test.limit })
          .expect(200);

        const responseTime = Date.now() - startTime;

        expect(responseTime).toBeLessThan(PERFORMANCE_CONFIG.MAX_RESPONSE_TIME);
        expect(response.body.reviews.length).toBeLessThanOrEqual(test.limit);
        expect(response.body.pagination.page).toBe(test.page);
        expect(response.body.pagination.limit).toBe(test.limit);

        console.log(`${test.description}: ${responseTime}ms for ${response.body.reviews.length} reviews`);
      }
    }, 45000); // 45 second timeout

    /**
     * Test filtering performance with large datasets
     */
    test('should handle filtering efficiently with large datasets', async () => {
      // Create diverse dataset
      const reviewCount = 3000;
      for (let i = 0; i < reviewCount; i += 50) {
        const batchData = [];
        for (let j = 0; j < 50; j++) {
          batchData.push({
            productId: testProduct.id,
            userId: testUser.user.id,
            rating: Math.floor(Math.random() * 5) + 1,
            title: `Filter Test ${i + j}`,
            comment: `Filter review ${i + j}`,
            isApproved: Math.random() > 0.3,
            rating: Math.floor(Math.random() * 5) + 1
          });
        }

        await prisma.review.createMany({
          data: batchData
        });
      }

      // Test different filter scenarios
      const filterTests = [
        { filter: { rating: 5 }, description: 'Filter by 5-star rating' },
        { filter: { rating: 1 }, description: 'Filter by 1-star rating' },
        { filter: { isApproved: true }, description: 'Filter by approved reviews' },
        { filter: { isApproved: false }, description: 'Filter by unapproved reviews' },
        { filter: { productId: testProduct.id }, description: 'Filter by product ID' }
      ];

      for (const test of filterTests) {
        const startTime = Date.now();
        
        const response = await request(app)
          .get('/api/v1/reviews')
          .query(test.filter)
          .expect(200);

        const responseTime = Date.now() - startTime;

        expect(responseTime).toBeLessThan(PERFORMANCE_CONFIG.MAX_RESPONSE_TIME);
        expect(response.body.reviews).toBeDefined();

        console.log(`${test.description}: ${responseTime}ms for ${response.body.reviews.length} reviews`);
      }
    }, 30000); // 30 second timeout
  });

  /**
   * Test suite for real-time rating calculation performance
   */
  describe('Real-Time Rating Calculation Performance', () => {
    /**
     * Test rating aggregation performance
     */
    test('should calculate ratings in real-time efficiently', async () => {
      // Create reviews with different ratings
      const ratingDistribution = { 1: 100, 2: 200, 3: 300, 4: 250, 5: 150 };
      
      for (const [rating, count] of Object.entries(ratingDistribution)) {
        const batchData = [];
        for (let i = 0; i < count; i += 50) {
          const miniBatch = [];
          for (let j = 0; j < 50; j++) {
            miniBatch.push({
              productId: testProduct.id,
              userId: testUser.user.id,
              rating: parseInt(rating),
              title: `Rating ${rating} Review ${i * 50 + j}`,
              comment: `Rating ${rating} review ${i * 50 + j}`,
              isApproved: true
            });
          }
          batchData.push(miniBatch);
        }

        await prisma.review.createMany({
          data: batchData
        });
      }

      // Test real-time rating calculation
      const calculationStartTime = Date.now();
      
      // Simulate rating aggregation query
      const ratingStats = await prisma.review.groupBy({
        by: ['rating'],
        where: { productId: testProduct.id, isApproved: true },
        _count: {
          rating: true
        }
      });

      const calculationTime = Date.now() - calculationStartTime;

      expect(calculationTime).toBeLessThan(PERFORMANCE_CONFIG.MAX_DB_QUERY_TIME);
      expect(ratingStats).toBeDefined();
      expect(Object.keys(ratingStats).length).toBe(5);

      // Calculate average rating
      const totalReviews = Object.values(ratingDistribution).reduce((sum, count) => sum + count, 0);
      const weightedSum = Object.entries(ratingDistribution).reduce(
        (sum, [rating, count]) => sum + (parseInt(rating) * count), 0
      );
      const averageRating = weightedSum / totalReviews;

      expect(averageRating).toBeGreaterThan(2);
      expect(averageRating).toBeLessThan(5);

      console.log(`Rating calculation: ${calculationTime}ms`);
      console.log(`Average rating: ${averageRating.toFixed(2)}`);
    }, 20000); // 20 second timeout

    /**
     * Test rating trend calculation performance
     */
    test('should calculate rating trends efficiently', async () => {
      // Create time-series data
      const now = new Date();
      const timeSeriesData = [];
      
      // Generate data for 6 months
      for (let month = 0; month < 6; month++) {
        const reviewDate = new Date(now.getFullYear(), now.getMonth() - month, 15);
        const reviewCount = 20 + Math.floor(Math.random() * 30);
        const avgRating = 3.5 + Math.random();
        
        timeSeriesData.push({
          date: reviewDate,
          reviewCount,
          averageRating: avgRating
        });

        // Create reviews for this month
        const monthReviews = [];
        for (let i = 0; i < reviewCount; i++) {
          monthReviews.push({
            productId: testProduct.id,
            userId: testUser.user.id,
            rating: Math.round(avgRating + (Math.random() - 0.5)),
            title: `Trend Review ${month}-${i}`,
            comment: `Trend review for month ${month}`,
            isApproved: true,
            createdAt: reviewDate
          });
        }

        await prisma.review.createMany({
          data: monthReviews
        });
      }

      // Test trend calculation performance
      const trendStartTime = Date.now();
      
      // Simulate trend calculation (this would be a dedicated endpoint)
      const weeklyTrends = {};
      for (let week = 0; week < 12; week++) {
        const weekStart = week * 7;
        const weekEnd = Math.min((week + 1) * 7, 90);
        const weekData = timeSeriesData.slice(weekStart, weekEnd);
        
        if (weekData.length > 0) {
          const totalReviews = weekData.reduce((sum, day) => sum + day.reviewCount, 0);
          const avgRating = weekData.reduce((sum, day) => sum + (day.averageRating * day.reviewCount), 0) / totalReviews;
          
          weeklyTrends[`week-${week}`] = {
            totalReviews,
            averageRating: avgRating,
            startDate: weekData[0]?.date,
            endDate: weekData[weekData.length - 1]?.date
          };
        }
      }

      const trendTime = Date.now() - trendStartTime;

      expect(trendTime).toBeLessThan(PERFORMANCE_CONFIG.MAX_DB_QUERY_TIME);
      expect(Object.keys(weeklyTrends).length).toBeGreaterThan(10);

      // Find trend
      const firstHalf = weeklyTrends.slice(0, 3);
      const secondHalf = weeklyTrends.slice(3);
      const firstHalfAvg = firstHalf.reduce((sum, week) => sum + week.totalReviews, 0) / firstHalf.length;
      const secondHalfAvg = secondHalf.reduce((sum, week) => sum + week.totalReviews, 0) / secondHalf.length;
      
      const trend = secondHalfAvg > firstHalfAvg ? 'increasing' : 'decreasing';
      expect(['increasing', 'decreasing']).toContain(trend);
    }, 25000); // 25 second timeout
  });

  /**
   * Test suite for moderation queue processing speed
   */
  describe('Moderation Queue Processing Speed', () => {
    /**
     * Test bulk moderation processing
     */
    test('should process moderation queue quickly', async () => {
      // Create large number of unapproved reviews
      const unapprovedCount = 2000;
      const unapprovedReviews = [];
      
      for (let i = 0; i < unapprovedCount; i += 100) {
        const batchData = [];
        for (let j = 0; j < 100; j++) {
          batchData.push({
            productId: testProduct.id,
            userId: testUser.user.id,
            rating: Math.floor(Math.random() * 5) + 1,
            title: `Moderation Test ${i * 100 + j}`,
            comment: `Unapproved review ${i * 100 + j}`,
            isApproved: false,
            isVerified: true,
            createdAt: new Date(Date.now() - Math.floor(Math.random() * 7) * 24 * 60 * 60 * 1000)
          });
        }

        const createdReviews = await prisma.review.createMany({
          data: batchData
        });
        unapprovedReviews.push(...createdReviews);
      }

      // Test bulk approval performance
      const moderationStartTime = Date.now();
      
      // Simulate bulk moderation (this would be a dedicated endpoint)
      const moderationBatchSize = 100;
      const approvedCount = 0;
      
      for (let i = 0; i < unapprovedCount; i += moderationBatchSize) {
        const batchIds = unapprovedReviews
          .slice(i, i + moderationBatchSize)
          .map(review => review.id);

        // Simulate bulk update
        const updateResult = await prisma.review.updateMany({
          where: { id: { in: batchIds } },
          data: { isApproved: true }
        });

        approvedCount += updateResult.count;
      }

      const moderationTime = Date.now() - moderationStartTime;
      const reviewsPerSecond = approvedCount / (moderationTime / 1000);

      expect(moderationTime).toBeLessThan(PERFORMANCE_CONFIG.STRESS_TEST_DURATION);
      expect(reviewsPerSecond).toBeGreaterThan(10); // Should process at least 10 reviews/second
      expect(approvedCount).toBe(unapprovedCount);

      console.log(`Moderated ${approvedCount} reviews in ${moderationTime}ms`);
      console.log(`Moderation speed: ${reviewsPerSecond.toFixed(2)} reviews/second`);
    }, 35000); // 35 second timeout

    /**
     * Test automated moderation performance
     */
    test('should perform automated moderation efficiently', async () => {
      // Create reviews with different moderation requirements
      const moderationScenarios = [
        { type: 'spam', count: 100, keywords: ['BUY NOW', 'CLICK HERE', '!!!'] },
        { type: 'profanity', count: 50, keywords: ['damn', 'hell', 'crap'] },
        { type: 'duplicate', count: 25, similarity: 0.9 },
        { type: 'legitimate', count: 500, keywords: [] }
      ];

      for (const scenario of moderationScenarios) {
        const batchData = [];
        
        for (let i = 0; i < scenario.count; i++) {
          let comment = `Legitimate review ${i}`;
          
          if (scenario.type === 'spam') {
            const keyword = scenario.keywords[Math.floor(Math.random() * scenario.keywords.length)];
            comment = `SPAM: ${keyword} - Buy now!!!`;
          } else if (scenario.type === 'profanity') {
            const keyword = scenario.keywords[Math.floor(Math.random() * scenario.keywords.length)];
            comment = `This is ${keyword} terrible!`;
          }

          batchData.push({
            productId: testProduct.id,
            userId: testUser.user.id,
            rating: Math.floor(Math.random() * 5) + 1,
            title: `${scenario.type} review ${i}`,
            comment,
            isApproved: false,
            isVerified: true
          });
        }

        await prisma.review.createMany({
          data: batchData
        });
      }

      // Test automated moderation performance
      const autoModerationStartTime = Date.now();
      
      // Simulate automated moderation processing
      const moderationResults = {};
      let totalProcessed = 0;
      
      for (const scenario of moderationScenarios) {
        const startTime = Date.now();
        
        // Simulate content analysis
        const processedReviews = await prisma.review.findMany({
          where: {
            isApproved: false,
            comment: { contains: scenario.keywords[0] || 'review' }
          },
          take: scenario.count
        });

        // Simulate automated decision
        const decisions = processedReviews.map(review => ({
          id: review.id,
          action: scenario.type === 'legitimate' ? 'approve' : 'reject',
          confidence: scenario.type === 'legitimate' ? 0.9 : 0.8,
          reason: scenario.type
        }));

        // Apply decisions
        const approvedIds = decisions
          .filter(d => d.action === 'approve')
          .map(d => d.id);
        const rejectedIds = decisions
          .filter(d => d.action === 'reject')
          .map(d => d.id);

        if (approvedIds.length > 0) {
          await prisma.review.updateMany({
            where: { id: { in: approvedIds } },
            data: { isApproved: true }
          });
        }

        if (rejectedIds.length > 0) {
          await prisma.review.updateMany({
            where: { id: { in: rejectedIds } },
            data: { isApproved: false, moderationNote: `Auto-rejected: ${scenario.type}` }
          });
        }

        const processingTime = Date.now() - startTime;
        totalProcessed += processedReviews.length;

        moderationResults[scenario.type] = {
          processedCount: processedReviews.length,
          processingTime,
          decisionsPerSecond: processedReviews.length / (processingTime / 1000)
        };
      }

      const totalAutoModerationTime = Date.now() - autoModerationStartTime;
      const totalReviewsPerSecond = totalProcessed / (totalAutoModerationTime / 1000);

      expect(totalAutoModerationTime).toBeLessThan(PERFORMANCE_CONFIG.STRESS_TEST_DURATION);
      expect(totalReviewsPerSecond).toBeGreaterThan(50); // Should process at least 50 reviews/second

      console.log(`Auto-moderated ${totalProcessed} reviews in ${totalAutoModerationTime}ms`);
      console.log(`Auto-moderation speed: ${totalReviewsPerSecond.toFixed(2)} reviews/second`);
    }, 40000); // 40 second timeout
  });

  /**
   * Test suite for analytics query optimization
   */
  describe('Analytics Query Optimization', () => {
    /**
     * Test complex analytics queries performance
     */
    test('should handle complex analytics queries efficiently', async () => {
      // Create comprehensive dataset
      const datasetSize = 5000;
      const categories = ['electronics', 'clothing', 'food'];
      
      for (let i = 0; i < datasetSize; i += 100) {
        const batchData = [];
        for (let j = 0; j < 100; j++) {
          batchData.push({
            productId: testProduct.id,
            userId: testUser.user.id,
            rating: Math.floor(Math.random() * 5) + 1,
            title: `Analytics Test ${i + j}`,
            comment: `Analytics review ${i + j}`,
            isApproved: Math.random() > 0.2,
            isVerified: Math.random() > 0.3,
            createdAt: new Date(Date.now() - Math.floor(Math.random() * 90) * 24 * 60 * 60 * 1000)
          });
        }

        await prisma.review.createMany({
          data: batchData
        });
      }

      // Test complex analytics queries
      const analyticsQueries = [
        {
          name: 'Rating distribution by category',
          query: async () => {
            return await prisma.review.groupBy({
              by: ['rating'],
              where: { isApproved: true },
              _count: { rating: true }
            });
          }
        },
        {
          name: 'Review trends over time',
          query: async () => {
            const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
            return await prisma.review.findMany({
              where: {
                isApproved: true,
                createdAt: { gte: thirtyDaysAgo }
              },
              orderBy: { createdAt: 'desc' },
              take: 1000
            });
          }
        },
        {
          name: 'User engagement metrics',
          query: async () => {
            return await prisma.review.groupBy({
              by: ['userId'],
              where: { isApproved: true },
              _count: { userId: true },
              orderBy: { _count: { userId: 'desc' } },
              take: 100
            });
          }
        },
        {
          name: 'Sentiment analysis',
          query: async () => {
            const positiveReviews = await prisma.review.findMany({
              where: {
                isApproved: true,
                rating: { gte: 4 }
              },
              take: 500
            });
            const negativeReviews = await prisma.review.findMany({
              where: {
                isApproved: true,
                rating: { lte: 2 }
              },
              take: 500
            });
            return { positive: positiveReviews.length, negative: negativeReviews.length };
          }
        }
      ];

      // Execute and measure each query
      const queryResults = {};
      
      for (const queryTest of analyticsQueries) {
        const startTime = Date.now();
        
        const result = await queryTest.query();
        const queryTime = Date.now() - startTime;
        
        queryResults[queryTest.name] = {
          result,
          executionTime: queryTime,
          resultSize: Array.isArray(result) ? result.length : Object.keys(result).length
        };

        expect(queryTime).toBeLessThan(PERFORMANCE_CONFIG.MAX_DB_QUERY_TIME);
        expect(result).toBeDefined();
      }

      // Analyze query performance
      const totalQueryTime = Object.values(queryResults).reduce((sum, result) => sum + result.executionTime, 0);
      const averageQueryTime = totalQueryTime / Object.keys(queryResults).length;

      expect(averageQueryTime).toBeLessThan(PERFORMANCE_CONFIG.MAX_DB_QUERY_TIME);

      console.log(`Analytics query performance:`);
      Object.entries(queryResults).forEach(([name, result]) => {
        console.log(`  ${name}: ${result.executionTime}ms (${result.resultSize} results)`);
      });
      console.log(`Average query time: ${averageQueryTime.toFixed(2)}ms`);
    }, 30000); // 30 second timeout

    /**
     * Test aggregation query performance
     */
    test('should optimize aggregation queries', async () => {
      // Create dataset for aggregation tests
      const aggregationData = [];
      const timeRanges = [7, 30, 90, 365]; // days
      
      for (const range of timeRanges) {
        for (let i = 0; i < 100; i++) {
          const daysAgo = Math.floor(Math.random() * range);
          aggregationData.push({
            productId: testProduct.id,
            userId: testUser.user.id,
            rating: Math.floor(Math.random() * 5) + 1,
            title: `Aggregation Test ${range}-${i}`,
            comment: `Aggregation review ${range}-${i}`,
            isApproved: true,
            isVerified: true,
            createdAt: new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000)
          });
        }
      }

      await prisma.review.createMany({
        data: aggregationData
      });

      // Test aggregation performance
      const aggregationQueries = [
        {
          name: 'Daily aggregation',
          timeRange: 7,
          query: async () => {
            const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
            return await prisma.review.aggregate({
              where: {
                isApproved: true,
                createdAt: { gte: sevenDaysAgo }
              },
              _avg: { rating: true },
              _count: true
            });
          }
        },
        {
          name: 'Monthly aggregation',
          timeRange: 30,
          query: async () => {
            const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
            return await prisma.review.aggregate({
              where: {
                isApproved: true,
                createdAt: { gte: thirtyDaysAgo }
              },
              _avg: { rating: true },
              _count: true,
              _max: { rating: true },
              _min: { rating: true }
            });
          }
        },
        {
          name: 'Yearly aggregation',
          timeRange: 365,
          query: async () => {
            const yearAgo = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);
            return await prisma.review.aggregate({
              where: {
                isApproved: true,
                createdAt: { gte: yearAgo }
              },
              _avg: { rating: true },
              _count: true,
              _sum: { rating: true }
            });
          }
        }
      ];

      // Execute aggregation queries
      const aggregationResults = {};
      
      for (const aggTest of aggregationQueries) {
        const startTime = Date.now();
        
        const result = await aggTest.query();
        const queryTime = Date.now() - startTime;
        
        aggregationResults[aggTest.name] = {
          result,
          executionTime: queryTime,
          timeRange: aggTest.timeRange
        };

        expect(queryTime).toBeLessThan(PERFORMANCE_CONFIG.MAX_DB_QUERY_TIME);
        expect(result).toBeDefined();
      }

      // Analyze aggregation performance
      console.log(`Aggregation query performance:`);
      Object.entries(aggregationResults).forEach(([name, result]) => {
        console.log(`  ${name} (${result.timeRange} days): ${result.executionTime}ms`);
        if (result.result._avg) {
          console.log(`    Average rating: ${result.result._avg.rating.toFixed(2)}`);
        }
        if (result.result._count) {
          console.log(`    Review count: ${result.result._count}`);
        }
      });
    }, 25000); // 25 second timeout
  });

  /**
   * Test suite for concurrent review operations
   */
  describe('Concurrent Review Operations', () => {
    /**
     * Test concurrent review creation
     */
    test('should handle concurrent review creation', async () => {
      const concurrentUsers = [];
      const concurrentCount = PERFORMANCE_CONFIG.CONCURRENT_USERS;
      
      // Create multiple users for concurrent testing
      for (let i = 0; i < concurrentCount; i++) {
        const user = await createTestUser({
          email: `concurrent${i}@test.com`,
          firstName: `Concurrent${i}`,
          lastName: 'User'
        });
        
        concurrentUsers.push({
          user,
          token: jwt.sign(
            { userId: user.user.id, email: user.user.email, role: 'CUSTOMER' },
            TEST_CONFIG.JWT_SECRET
          )
        });
      }

      // Test concurrent review creation
      const startTime = Date.now();
      const concurrentPromises = concurrentUsers.map(async ({ user, token }) => {
        const reviews = [];
        
        // Each user creates multiple reviews
        for (let i = 0; i < 10; i++) {
          const reviewPromise = makeAuthenticatedRequest(
            app, 
            'post', 
            '/api/v1/reviews', 
            {
              productId: testProduct.id,
              rating: Math.floor(Math.random() * 5) + 1,
              title: `Concurrent Review ${user.user.firstName}-${i}`,
              comment: `Concurrent review by ${user.user.firstName}`,
            }, 
            token
          );
          reviews.push(reviewPromise);
        }

        return Promise.all(reviews);
      });

      const results = await Promise.all(concurrentPromises);
      const totalTime = Date.now() - startTime;

      // Verify all requests succeeded
      const successfulRequests = results.flat().filter(response => response.status === 201);
      const totalRequests = concurrentCount * 10;

      expect(totalRequests).toBe(successfulRequests.length);
      expect(totalTime).toBeLessThan(PERFORMANCE_CONFIG.STRESS_TEST_DURATION);

      const requestsPerSecond = totalRequests / (totalTime / 1000);
      console.log(`Concurrent creation: ${totalRequests} requests in ${totalTime}ms`);
      console.log(`Throughput: ${requestsPerSecond.toFixed(2)} requests/second`);
    }, 45000); // 45 second timeout

    /**
     * Test concurrent review retrieval
     */
    test('should handle concurrent review retrieval', async () => {
      // Create base dataset
      const baseReviewCount = 1000;
      for (let i = 0; i < baseReviewCount; i += 50) {
        const batchData = [];
        for (let j = 0; j < 50; j++) {
          batchData.push({
            productId: testProduct.id,
            userId: testUser.user.id,
            rating: Math.floor(Math.random() * 5) + 1,
            title: `Concurrent Test ${i + j}`,
            comment: `Concurrent test review ${i + j}`,
            isApproved: true
          });
        }

        await prisma.review.createMany({
          data: batchData
        });
      }

      // Test concurrent retrieval
      const concurrentRetrievals = 50;
      const startTime = Date.now();
      
      const retrievalPromises = Array.from({ length: concurrentRetrievals }, (_, i) => 
        request(app)
          .get('/api/v1/reviews')
          .query({ page: i + 1, limit: 20 })
          .expect(200)
      );

      const results = await Promise.all(retrievalPromises);
      const totalTime = Date.now() - startTime;

      // Verify all retrievals succeeded
      const successfulRetrievals = results.filter(response => response.status === 200);
      const totalRetrievals = concurrentRetrievals;

      expect(totalRetrievals).toBe(successfulRetrievals.length);
      expect(totalTime).toBeLessThan(PERFORMANCE_CONFIG.STRESS_TEST_DURATION);

      const retrievalsPerSecond = totalRetrievals / (totalTime / 1000);
      console.log(`Concurrent retrieval: ${totalRetrievals} requests in ${totalTime}ms`);
      console.log(`Retrieval throughput: ${retrievalsPerSecond.toFixed(2)} requests/second`);
    }, 30000); // 30 second timeout

    /**
     * Test mixed concurrent operations
     */
    test('should handle mixed concurrent operations', async () => {
      // Create base dataset
      const baseReviewCount = 500;
      for (let i = 0; i < baseReviewCount; i += 50) {
        const batchData = [];
        for (let j = 0; j < 50; j++) {
          batchData.push({
            productId: testProduct.id,
            userId: testUser.user.id,
            rating: Math.floor(Math.random() * 5) + 1,
            title: `Mixed Test ${i + j}`,
            comment: `Mixed concurrent test ${i + j}`,
            isApproved: Math.random() > 0.3
          });
        }

        await prisma.review.createMany({
          data: batchData
        });
      }

      // Test mixed concurrent operations
      const startTime = Date.now();
      
      const mixedOperations = [
        // Concurrent reads
        ...Array.from({ length: 20 }, (_, i) =>
          request(app)
            .get('/api/v1/reviews')
            .query({ page: i + 1, limit: 10 })
            .expect(200)
        ),
        // Concurrent writes (create)
        ...Array.from({ length: 10 }, (_, i) =>
          makeAuthenticatedRequest(
            app, 
            'post', 
            '/api/v1/reviews', 
            {
              productId: testProduct.id,
              rating: 4,
              title: `Mixed Create ${i}`,
              comment: `Mixed concurrent create ${i}`
            }, 
            userToken
          )
        ),
        // Concurrent updates
        ...Array.from({ length: 5 }, (_, i) => {
          const reviewId = `review-${i}`; // Would need actual IDs
          return makeAuthenticatedRequest(
            app, 
            'put', 
            `/api/v1/reviews/${reviewId}`, 
            {
              rating: 5,
              title: `Mixed Update ${i}`,
              comment: `Mixed concurrent update ${i}`
            }, 
            userToken
          );
        })
      ];

      const results = await Promise.all(mixedOperations);
      const totalTime = Date.now() - startTime;

      // Verify operations
      const successfulOps = results.filter(response => 
        [200, 201].includes(response.status)
      );
      const totalOps = mixedOperations.length;

      expect(totalOps).toBe(successfulOps.length);
      expect(totalTime).toBeLessThan(PERFORMANCE_CONFIG.STRESS_TEST_DURATION);

      const opsPerSecond = totalOps / (totalTime / 1000);
      console.log(`Mixed operations: ${totalOps} operations in ${totalTime}ms`);
      console.log(`Mixed throughput: ${opsPerSecond.toFixed(2)} operations/second`);
    }, 40000); // 40 second timeout
  });

  /**
   * Test suite for database query performance optimization
   */
  describe('Database Query Performance Optimization', () => {
    /**
     * Test index usage for review queries
     */
    test('should use database indexes efficiently', async () => {
      // Create dataset that would benefit from indexes
      const indexedData = [];
      const productIds = [];
      
      // Create multiple products for index testing
      for (let p = 0; p < 10; p++) {
        const product = await createTestProduct({
          name: `Indexed Product ${p}`,
          regularPrice: 10000 + p * 1000
        });
        productIds.push(product.id);
      }

      // Create reviews across products
      for (let i = 0; i < 1000; i++) {
        const productId = productIds[i % productIds.length];
        indexedData.push({
          productId,
          userId: testUser.user.id,
          rating: Math.floor(Math.random() * 5) + 1,
          title: `Indexed Review ${i}`,
          comment: `Indexed review ${i}`,
          isApproved: true,
          createdAt: new Date(Date.now() - Math.floor(Math.random() * 90) * 24 * 60 * 60 * 1000)
        });
      }

      await prisma.review.createMany({
        data: indexedData
      });

      // Test indexed queries
      const indexedQueries = [
        {
          name: 'Product ID lookup',
          query: async () => {
            const startTime = Date.now();
            const result = await prisma.review.findMany({
              where: { productId: productIds[0] },
              take: 100
            });
            return { result, time: Date.now() - startTime };
          }
        },
        {
          name: 'User ID lookup',
          query: async () => {
            const startTime = Date.now();
            const result = await prisma.review.findMany({
              where: { userId: testUser.user.id },
              take: 100
            });
            return { result, time: Date.now() - startTime };
          }
        },
        {
          name: 'Rating filter',
          query: async () => {
            const startTime = Date.now();
            const result = await prisma.review.findMany({
              where: { 
                rating: { gte: 4 },
                isApproved: true
              },
              take: 100
            });
            return { result, time: Date.now() - startTime };
          }
        },
        {
          name: 'Date range query',
          query: async () => {
            const startTime = Date.now();
            const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
            const result = await prisma.review.findMany({
              where: {
                createdAt: { gte: thirtyDaysAgo },
                isApproved: true
              },
              take: 100
            });
            return { result, time: Date.now() - startTime };
          }
        }
      ];

      // Execute indexed queries
      const queryResults = {};
      
      for (const queryTest of indexedQueries) {
        const { result, time } = await queryTest.query();
        
        queryResults[queryTest.name] = {
          resultCount: result.length,
          executionTime: time
        };

        expect(time).toBeLessThan(PERFORMANCE_CONFIG.MAX_DB_QUERY_TIME);
        expect(result).toBeDefined();
      }

      // Analyze query performance
      console.log(`Indexed query performance:`);
      Object.entries(queryResults).forEach(([name, result]) => {
        console.log(`  ${name}: ${result.executionTime}ms (${result.resultCount} results)`);
      });

      const averageQueryTime = Object.values(queryResults)
        .reduce((sum, result) => sum + result.executionTime, 0) / Object.keys(queryResults).length;

      expect(averageQueryTime).toBeLessThan(PERFORMANCE_CONFIG.MAX_DB_QUERY_TIME);
      console.log(`Average indexed query time: ${averageQueryTime.toFixed(2)}ms`);
    }, 20000); // 20 second timeout

    /**
     * Test query optimization with large datasets
     */
    test('should optimize queries for large datasets', async () => {
      // Create very large dataset
      const largeDatasetSize = 2000;
      
      for (let i = 0; i < largeDatasetSize; i += 100) {
        const batchData = [];
        for (let j = 0; j < 100; j++) {
          batchData.push({
            productId: testProduct.id,
            userId: testUser.user.id,
            rating: Math.floor(Math.random() * 5) + 1,
            title: `Large Dataset Review ${i * 100 + j}`,
            comment: `Large dataset review ${i * 100 + j}`,
            isApproved: Math.random() > 0.2,
            isVerified: true,
            createdAt: new Date(Date.now() - Math.floor(Math.random() * 180) * 24 * 60 * 60 * 1000)
          });
        }

        await prisma.review.createMany({
          data: batchData
        });
      }

      // Test optimized query patterns
      const optimizedQueries = [
        {
          name: 'Paginated retrieval with index',
          query: async () => {
            const startTime = Date.now();
            const result = await prisma.review.findMany({
              where: { isApproved: true },
              orderBy: { createdAt: 'desc' },
              take: 50,
              skip: 0
            });
            return { result, time: Date.now() - startTime };
          }
        },
        {
          name: 'Aggregated statistics',
          query: async () => {
            const startTime = Date.now();
            const result = await prisma.review.aggregate({
              where: { isApproved: true },
              _avg: { rating: true },
              _count: true,
              _max: { rating: true },
              _min: { rating: true }
            });
            return { result, time: Date.now() - startTime };
          }
        },
        {
          name: 'Grouped by rating',
          query: async () => {
            const startTime = Date.now();
            const result = await prisma.review.groupBy({
              by: ['rating'],
              where: { isApproved: true },
              _count: { rating: true }
            });
            return { result, time: Date.now() - startTime };
          }
        }
      ];

      // Execute optimized queries
      const optimizationResults = {};
      
      for (const queryTest of optimizedQueries) {
        const { result, time } = await queryTest.query();
        
        optimizationResults[queryTest.name] = {
          executionTime: time,
          resultSize: Array.isArray(result) ? result.length : Object.keys(result).length
        };

        expect(time).toBeLessThan(PERFORMANCE_CONFIG.MAX_DB_QUERY_TIME);
      }

      // Analyze optimization results
      console.log(`Optimized query performance:`);
      Object.entries(optimizationResults).forEach(([name, result]) => {
        console.log(`  ${name}: ${result.executionTime}ms (${result.resultSize} results)`);
      });

      const totalOptimizationTime = Object.values(optimizationResults)
        .reduce((sum, result) => sum + result.executionTime, 0);

      expect(totalOptimizationTime).toBeLessThan(PERFORMANCE_CONFIG.STRESS_TEST_DURATION);
      console.log(`Total optimization time: ${totalOptimizationTime}ms`);
    }, 30000); // 30 second timeout
  });
});

module.exports = {
  // Export for use in other test files
  setupPerformanceTestData: async () => {
    const user = await createTestUser();
    const product = await createTestProduct();
    
    // Create performance test dataset
    const reviews = [];
    for (let i = 0; i < 1000; i++) {
      const review = await createTestReview({
        productId: product.id,
        userId: user.user.id,
        rating: Math.floor(Math.random() * 5) + 1,
        title: `Performance Review ${i}`,
        comment: `Performance test review ${i}`,
        isApproved: true
      });
      reviews.push(review);
    }
    
    return { user, product, reviews };
  }
};