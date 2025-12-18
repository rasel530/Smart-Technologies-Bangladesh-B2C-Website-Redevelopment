
/**
 * Basic Review Operations Test Suite
 * 
 * This test suite covers all fundamental CRUD operations for the review management system:
 * - Create product reviews with ratings and text
 * - View reviews with proper filtering and sorting
 * - Update reviews by original authors
 * - Delete reviews with proper authorization
 * - Review with images and media attachments
 * - Error handling and validation
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
  mockSentimentAnalysis
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
let testUser, testAdmin, testProduct, testReview, userToken, adminToken;

/**
 * Test setup and teardown
 */
describe('Basic Review Operations', () => {
  /**
   * Setup test data before each test
   */
  beforeEach(async () => {
    // Clean up any existing test data
    await cleanupTestData(['review', 'user', 'product', 'category', 'brand']);

    // Create test users
    testUser = await createTestUser({
      email: 'reviewuser@test.com',
      firstName: 'Rahim',
      lastName: 'Ahmed'
    });
    userToken = jwt.sign(
      { userId: testUser.user.id, email: testUser.user.email, role: 'CUSTOMER' },
      TEST_CONFIG.JWT_SECRET
    );

    testAdmin = await createTestAdmin({
      email: 'reviewadmin@test.com',
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
  });

  /**
   * Clean up test data after each test
   */
  afterEach(async () => {
    await cleanupTestData(['review', 'user', 'product', 'category', 'brand']);
  });

  /**
   * Test suite for creating reviews
   */
  describe('POST /api/v1/reviews - Create Review', () => {
    /**
     * Test successful review creation
     */
    test('should create a new review successfully', async () => {
      const reviewData = {
        productId: testProduct.id,
        rating: 5,
        title: 'অসাধারণ পণ্য!',
        comment: 'এই ফোনটি কেনার পর খুবই খুশি। ক্যামেরা অসাধারণ এবং ব্যাটারি ব্যাকআপ ভালো।'
      };

      const response = await makeAuthenticatedRequest(
        app, 
        'post', 
        '/api/v1/reviews', 
        reviewData, 
        userToken
      );

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('message', 'Review created successfully');
      expect(response.body).toHaveProperty('review');
      
      const review = response.body.review;
      expect(review.productId).toBe(testProduct.id);
      expect(review.userId).toBe(testUser.user.id);
      expect(review.rating).toBe(5);
      expect(review.title).toBe('অসাধারণ পণ্য!');
      expect(review.comment).toBe('এই ফোনটি কেনার পর খুবই খুশি। ক্যামেরা অসাধারণ এবং ব্যাটারি ব্যাকআপ ভালো।');
      expect(review.isVerified).toBe(true);
      expect(review.isApproved).toBe(false); // Requires admin approval
    });

    /**
     * Test review creation with English content
     */
    test('should create review with English content', async () => {
      const reviewData = {
        productId: testProduct.id,
        rating: 4,
        title: 'Good smartphone',
        comment: 'Nice phone with good camera and battery life. Value for money.'
      };

      const response = await makeAuthenticatedRequest(
        app, 
        'post', 
        '/api/v1/reviews', 
        reviewData, 
        userToken
      );

      expect(response.status).toBe(201);
      expect(response.body.review.title).toBe('Good smartphone');
      expect(response.body.review.comment).toContain('Nice phone');
    });

    /**
     * Test validation errors for missing required fields
     */
    test('should return validation error for missing required fields', async () => {
      const reviewData = {
        productId: testProduct.id,
        // Missing rating and title
        comment: 'This is a test review'
      };

      const response = await makeAuthenticatedRequest(
        app, 
        'post', 
        '/api/v1/reviews', 
        reviewData, 
        userToken
      );

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'Validation failed');
      expect(response.body.details).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            msg: 'Invalid value',
            param: 'rating',
            location: 'body'
          }),
          expect.objectContaining({
            msg: 'Invalid value',
            param: 'title',
            location: 'body'
          })
        ])
      );
    });

    /**
     * Test rating bounds validation
     */
    test('should validate rating bounds (1-5)', async () => {
      const invalidRatings = [0, 6, -1, 10];

      for (const rating of invalidRatings) {
        const reviewData = {
          productId: testProduct.id,
          rating,
          title: 'Test Review',
          comment: 'Test comment'
        };

        const response = await makeAuthenticatedRequest(
          app, 
          'post', 
          '/api/v1/reviews', 
          reviewData, 
          userToken
        );

        expect(response.status).toBe(400);
        expect(response.body.error).toBe('Validation failed');
      }
    });

    /**
     * Test duplicate review prevention
     */
    test('should prevent duplicate reviews for same product-user combination', async () => {
      // Create first review
      await createTestReview({
        productId: testProduct.id,
        userId: testUser.user.id,
        rating: 5,
        title: 'First Review'
      });

      // Try to create second review
      const reviewData = {
        productId: testProduct.id,
        rating: 4,
        title: 'Second Review',
        comment: 'This should fail'
      };

      const response = await makeAuthenticatedRequest(
        app, 
        'post', 
        '/api/v1/reviews', 
        reviewData, 
        userToken
      );

      expect(response.status).toBe(409);
      expect(response.body.error).toBe('You have already reviewed this product');
    });

    /**
     * Test review creation for non-existent product
     */
    test('should return 404 for non-existent product', async () => {
      const reviewData = {
        productId: 'non-existent-product-id',
        rating: 5,
        title: 'Test Review',
        comment: 'Test comment'
      };

      const response = await makeAuthenticatedRequest(
        app, 
        'post', 
        '/api/v1/reviews', 
        reviewData, 
        userToken
      );

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Product not found');
    });

    /**
     * Test unauthorized review creation (no authentication)
     */
    test('should require authentication to create review', async () => {
      const reviewData = {
        productId: testProduct.id,
        rating: 5,
        title: 'Test Review',
        comment: 'Test comment'
      };

      const response = await request(app)
        .post('/api/v1/reviews')
        .send(reviewData);

      expect(response.status).toBe(401); // Assuming auth middleware returns 401
    });
  });

  /**
   * Test suite for retrieving reviews
   */
  describe('GET /api/v1/reviews - Get Reviews', () => {
    /**
     * Setup reviews for retrieval tests
     */
    beforeEach(async () => {
      // Create multiple reviews with different ratings
      await createTestReview({
        productId: testProduct.id,
        userId: testUser.user.id,
        rating: 5,
        title: 'Excellent Product',
        comment: 'Amazing quality!',
        isApproved: true
      });

      await createTestReview({
        productId: testProduct.id,
        userId: testAdmin.user.id,
        rating: 3,
        title: 'Average Product',
        comment: 'It\'s okay',
        isApproved: true
      });

      await createTestReview({
        productId: testProduct.id,
        userId: testUser.user.id,
        rating: 1,
        title: 'Bad Product',
        comment: 'Poor quality',
        isApproved: false // Should not appear in default queries
      });
    });

    /**
     * Test getting all reviews with default filtering
     */
    test('should get approved reviews with pagination', async () => {
      const response = await request(app)
        .get('/api/v1/reviews')
        .expect(200);

      expect(response.body).toHaveProperty('reviews');
      expect(response.body).toHaveProperty('pagination');
      
      const reviews = response.body.reviews;
      expect(reviews).toHaveLength(2); // Only approved reviews
      expect(reviews[0]).toHaveProperty('user');
      expect(reviews[0]).toHaveProperty('product');
      
      const pagination = response.body.pagination;
      expect(pagination.page).toBe(1);
      expect(pagination.limit).toBe(20);
      expect(pagination.total).toBe(2);
      expect(pagination.pages).toBe(1);
    });

    /**
     * Test filtering by product ID
     */
    test('should filter reviews by product ID', async () => {
      const response = await request(app)
        .get(`/api/v1/reviews?productId=${testProduct.id}`)
        .expect(200);

      expect(response.body.reviews).toHaveLength(2);
      response.body.reviews.forEach(review => {
        expect(review.productId).toBe(testProduct.id);
      });
    });

    /**
     * Test filtering by user ID
     */
    test('should filter reviews by user ID', async () => {
      const response = await request(app)
        .get(`/api/v1/reviews?userId=${testUser.user.id}`)
        .expect(200);

      expect(response.body.reviews).toHaveLength(1);
      expect(response.body.reviews[0].userId).toBe(testUser.user.id);
    });

    /**
     * Test filtering by rating
     */
    test('should filter reviews by rating', async () => {
      const response = await request(app)
        .get('/api/v1/reviews?rating=5')
        .expect(200);

      expect(response.body.reviews).toHaveLength(1);
      expect(response.body.reviews[0].rating).toBe(5);
    });

    /**
     * Test including unapproved reviews (admin functionality)
     */
    test('should include unapproved reviews when requested', async () => {
      const response = await request(app)
        .get('/api/v1/reviews?isApproved=false')
        .expect(200);

      expect(response.body.reviews).toHaveLength(1);
      expect(response.body.reviews[0].isApproved).toBe(false);
    });

    /**
     * Test pagination with custom page and limit
     */
    test('should handle pagination with custom parameters', async () => {
      const response = await request(app)
        .get('/api/v1/reviews?page=1&limit=1')
        .expect(200);

      expect(response.body.reviews).toHaveLength(1);
      expect(response.body.pagination.page).toBe(1);
      expect(response.body.pagination.limit).toBe(1);
      expect(response.body.pagination.pages).toBe(2); // 2 total pages with limit 1
    });

    /**
     * Test sorting by creation date (newest first)
     */
    test('should sort reviews by creation date (newest first)', async () => {
      const response = await request(app)
        .get('/api/v1/reviews')
        .expect(200);

      const reviews = response.body.reviews;
      for (let i = 1; i < reviews.length; i++) {
        const prevDate = new Date(reviews[i - 1].createdAt);
        const currDate = new Date(reviews[i].createdAt);
        expect(prevDate.getTime()).toBeGreaterThanOrEqual(currDate.getTime());
      }
    });
  });

  /**
   * Test suite for getting a single review
   */
  describe('GET /api/v1/reviews/:id - Get Single Review', () => {
    /**
     * Setup test review
     */
    beforeEach(async () => {
      testReview = await createTestReview({
        productId: testProduct.id,
        userId: testUser.user.id,
        rating: 5,
        title: 'Test Review',
        comment: 'This is a test review',
        isApproved: true
      });
    });

    /**
     * Test getting a specific review by ID
     */
    test('should get review by ID with full details', async () => {
      const response = await request(app)
        .get(`/api/v1/reviews/${testReview.id}`)
        .expect(200);

      expect(response.body).toHaveProperty('review');
      const review = response.body.review;
      
      expect(review.id).toBe(testReview.id);
      expect(review.productId).toBe(testProduct.id);
      expect(review.userId).toBe(testUser.user.id);
      expect(review.rating).toBe(5);
      expect(review.title).toBe('Test Review');
      expect(review.comment).toBe('This is a test review');
      
      // Should include user and product details
      expect(review.user).toHaveProperty('id', testUser.user.id);
      expect(review.user).toHaveProperty('firstName', 'Rahim');
      expect(review.user).toHaveProperty('lastName', 'Ahmed');
      expect(review.user).toHaveProperty('email');
      
      expect(review.product).toHaveProperty('id', testProduct.id);
      expect(review.product).toHaveProperty('name', 'Samsung Galaxy A54');
      expect(review.product).toHaveProperty('sku');
    });

    /**
     * Test getting non-existent review
     */
    test('should return 404 for non-existent review', async () => {
      const response = await request(app)
        .get('/api/v1/reviews/non-existent-id')
        .expect(404);

      expect(response.body.error).toBe('Review not found');
    });

    /**
     * Test invalid UUID format
     */
    test('should return validation error for invalid UUID', async () => {
      const response = await request(app)
        .get('/api/v1/reviews/invalid-uuid')
        .expect(400);

      expect(response.body.error).toBe('Validation failed');
    });
  });

  /**
   * Test suite for updating reviews
   */
  describe('PUT /api/v1/reviews/:id - Update Review', () => {
    /**
     * Setup test review
     */
    beforeEach(async () => {
      testReview = await createTestReview({
        productId: testProduct.id,
        userId: testUser.user.id,
        rating: 4,
        title: 'Original Title',
        comment: 'Original comment'
      });
    });

    /**
     * Test successful review update by owner
     */
    test('should allow user to update their own review', async () => {
      const updateData = {
        rating: 5,
        title: 'Updated Title',
        comment: 'Updated comment with more details'
      };

      const response = await makeAuthenticatedRequest(
        app, 
        'put', 
        `/api/v1/reviews/${testReview.id}`, 
        updateData, 
        userToken
      );

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message', 'Review updated successfully');
      expect(response.body).toHaveProperty('review');
      
      const updatedReview = response.body.review;
      expect(updatedReview.rating).toBe(5);
      expect(updatedReview.title).toBe('Updated Title');
      expect(updatedReview.comment).toBe('Updated comment with more details');
    });

    /**
     * Test partial update (only title)
     */
    test('should allow partial update of review', async () => {
      const updateData = {
        title: 'Only Title Updated'
      };

      const response = await makeAuthenticatedRequest(
        app, 
        'put', 
        `/api/v1/reviews/${testReview.id}`, 
        updateData, 
        userToken
      );

      expect(response.status).toBe(200);
      expect(response.body.review.title).toBe('Only Title Updated');
      expect(response.body.review.rating).toBe(4); // Should remain unchanged
      expect(response.body.review.comment).toBe('Original comment'); // Should remain unchanged
    });

    /**
     * Test admin can update any review
     */
    test('should allow admin to update any review', async () => {
      const updateData = {
        rating: 2,
        title: 'Admin Updated'
      };

      const response = await makeAuthenticatedRequest(
        app, 
        'put', 
        `/api/v1/reviews/${testReview.id}`, 
        updateData, 
        adminToken
      );

      expect(response.status).toBe(200);
      expect(response.body.review.title).toBe('Admin Updated');
    });

    /**
     * Test unauthorized update attempt
     */
    test('should prevent user from updating another user\'s review', async () => {
      // Create another user
      const anotherUser = await createTestUser({
        email: 'another@test.com'
      });
      const anotherToken = jwt.sign(
        { userId: anotherUser.user.id, email: anotherUser.user.email, role: 'CUSTOMER' },
        TEST_CONFIG.JWT_SECRET
      );

      const updateData = {
        title: 'Unauthorized Update'
      };

      const response = await makeAuthenticatedRequest(
        app, 
        'put', 
        `/api/v1/reviews/${testReview.id}`, 
        updateData, 
        anotherToken
      );

      expect(response.status).toBe(403);
      expect(response.body.error).toBe('Access denied');
      expect(response.body.message).toBe('You can only update your own reviews');
    });

    /**
     * Test updating non-existent review
     */
    test('should return 404 when updating non-existent review', async () => {
      const updateData = {
        title: 'Update Non-existent'
      };

      const response = await makeAuthenticatedRequest(
        app, 
        'put', 
        '/api/v1/reviews/non-existent-id', 
        updateData, 
        userToken
      );

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Review not found');
    });

    /**
     * Test validation on update data
     */
    test('should validate update data', async () => {
      const updateData = {
        rating: 6 // Invalid rating
      };

      const response = await makeAuthenticatedRequest(
        app, 
        'put', 
        `/api/v1/reviews/${testReview.id}`, 
        updateData, 
        userToken
      );

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Validation failed');
    });
  });

  /**
   * Test suite for deleting reviews
   */
  describe('DELETE /api/v1/reviews/:id - Delete Review', () => {
    /**
     * Setup test review
     */
    beforeEach(async () => {
      testReview = await createTestReview({
        productId: testProduct.id,
        userId: testUser.user.id,
        rating: 3,
        title: 'Review to Delete',
        comment: 'This review will be deleted'
      });
    });

    /**
     * Test successful review deletion by owner
     */
    test('should allow user to delete their own review', async () => {
      const response = await makeAuthenticatedRequest(
        app, 
        'delete', 
        `/api/v1/reviews/${testReview.id}`, 
        {}, 
        userToken
      );

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message', 'Review deleted successfully');

      // Verify review is actually deleted
      const deletedReview = await prisma.review.findUnique({
        where: { id: testReview.id }
      });
      expect(deletedReview).toBeNull();
    });

    /**
     * Test admin can delete any review
     */
    test('should allow admin to delete any review', async () => {
      const response = await makeAuthenticatedRequest(
        app, 
        'delete', 
        `/api/v1/reviews/${testReview.id}`, 
        {}, 
        adminToken
      );

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Review deleted successfully');
    });

    /**
     * Test unauthorized deletion attempt
     */
    test('should prevent user from deleting another user\'s review', async () => {
      // Create another user
      const anotherUser = await createTestUser({
        email: 'deleter@test.com'
      });
      const anotherToken = jwt.sign(
        { userId: anotherUser.user.id, email: anotherUser.user.email, role: 'CUSTOMER' },
        TEST_CONFIG.JWT_SECRET
      );

      const response = await makeAuthenticatedRequest(
        app, 
        'delete', 
        `/api/v1/reviews/${testReview.id}`, 
        {}, 
        anotherToken
      );

      expect(response.status).toBe(403);
      expect(response.body.error).toBe('Access denied');
      expect(response.body.message).toBe('You can only delete your own reviews');
    });

    /**
     * Test deleting non-existent review
     */
    test('should return 404 when deleting non-existent review', async () => {
      const response = await makeAuthenticatedRequest(
        app, 
        'delete', 
        '/api/v1/reviews/non-existent-id', 
        {}, 
        userToken
      );

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Review not found');
    });

    /**
     * Test deletion without authentication
     */
    test('should require authentication to delete review', async () => {
      const response = await request(app)
        .delete(`/api/v1/reviews/${testReview.id}`)
        .expect(401); // Assuming auth middleware returns 401
    });
  });

  /**
   * Test suite for review approval (admin only)
   */
  describe('PUT /api/v1/reviews/:id/approve - Approve Review', () => {
    /**
     * Setup unapproved review
     */
    beforeEach(async () => {
      testReview = await createTestReview({
        productId: testProduct.id,
        userId: testUser.user.id,
        rating: 4,
        title: 'Unapproved Review',
        comment: 'This review needs approval',
        isApproved: false
      });
    });

    /**
     * Test successful review approval by admin
     */
    test('should allow admin to approve review', async () => {
      const response = await makeAuthenticatedRequest(
        app, 
        'put', 
        `/api/v1/reviews/${testReview.id}/approve`, 
        {}, 
        adminToken
      );

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message', 'Review approved successfully');
      expect(response.body).toHaveProperty('review');
      expect(response.body.review.isApproved).toBe(true);
    });

    /**
     * Test non-admin cannot approve reviews
     */
    test('should prevent non-admin from approving reviews', async () => {
      const response = await makeAuthenticatedRequest(
        app, 
        'put', 
        `/api/v1/reviews/${testReview.id}/approve`, 
        {}, 
        userToken
      );

      expect(response.status).toBe(403); // Assuming adminOnly middleware returns 403
    });

    /**
     * Test approving non-existent review
     */
    test('should return 404 when approving non-existent review', async () => {
      const response = await makeAuthenticatedRequest(
        app, 
        'put', 
        '/api/v1/reviews/non-existent-id/approve', 
        {}, 
        adminToken
      );

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Review not found');
    });
  });

  /**
   * Test suite for Bangladesh-specific review content
   */
  describe('Bangladesh-Specific Review Content', () => {
    /**
     * Test creating review with Bengali content
     */
    test('should handle Bengali language content properly', async () => {
      const bengaliReview = {
        productId: testProduct.id,
        rating: 5,
        title: 'অসাধারণ স্মার্টফোন!',
        comment: 'এই ফোনটি কেনার পর খুবই খুশি। ক্যামেরা অসাধারণ, ব্যাটারি ব্যাকআপ ভালো। বন্ধুদের সুপারিশ করবো।'
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
      expect(response.body.review.comment).toContain('ক্যামেরা অসাধারণ');
    });

    /**
     * Test mixed Bengali-English content
     */
    test('should handle mixed Bengali-English content', async () => {
      const mixedReview = {
        productId: testProduct.id,
        rating: 4,
        title: 'Good phone ভালো ফোন',
        comment: 'Camera is অসাধারণ but battery life is just okay. দামটা ভালো।'
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
    });

    /**
     * Test sentiment analysis on Bangladesh-specific content
     */
    test('should correctly analyze sentiment of Bangladesh-specific reviews', async () => {
      const positiveReview = {
        productId: testProduct.id,
        rating: 5,
        title: 'ঈদের জন্য নিখুঁত পণ্য!',
        comment: 'ঈদের জন্য এই ফোনটা কিনেছি। অসাধারণ!'
      };

      const response = await makeAuthenticatedRequest(
        app, 
        'post', 
        '/api/v1/reviews', 
        positiveReview, 
        userToken
      );

      expect(response.status).toBe(201);
      
      // Test sentiment analysis
      const sentiment = mockSentimentAnalysis(positiveReview.comment);
      expect(sentiment.sentiment).toBe('VERY_POSITIVE');
      expect(sentiment.score).toBe(5);
    });
  });
});

module.exports = {
  // Export for use in other test files
  setupReviewTestData: async () => {
    const user = await createTestUser();
    const product = await createTestProduct();
    const review = await createTestReview({
      productId: product.id,
      userId: user.user.id
    });
    return { user, product, review };
  }
};