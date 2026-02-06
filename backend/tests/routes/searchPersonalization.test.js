/**
 * Search Personalization API Routes Tests
 * 
 * Comprehensive integration tests for search personalization API endpoints covering:
 * - GET /preferences - Get user preferences
 * - PUT /preferences - Update user preferences
 * - GET /results - Get personalized search results
 * - GET /suggestions - Get personalized suggestions
 * - GET /recommendations - Get recommendations
 * - POST /recommendation/click - Track recommendation click
 * - POST /recommendation/conversion - Track recommendation conversion
 * - POST /history - Add search to history
 * - GET /history - Get search history
 * - DELETE /history - Clear search history
 * - POST /behavior - Learn from user behavior
 */

const request = require('supertest');
const express = require('express');
const { router, initializeSearchPersonalizationController } = require('../../routes/searchPersonalization');
const { SearchPersonalizationService } = require('../../services/searchPersonalization.service');

// Mock authentication middleware
jest.mock('../../middleware/auth', () => ({
  authenticate: (req, res, next) => {
    req.user = { id: 'test-user-id', role: 'customer' };
    next();
  },
  authenticateAdmin: (req, res, next) => {
    req.user = { id: 'test-admin-id', role: 'admin' };
    next();
  }
}));

// Mock services
jest.mock('../../services/searchPersonalization.service', () => ({
  SearchPersonalizationService: jest.fn().mockImplementation(() => ({
    getUserPreferences: jest.fn(),
    updateUserPreferences: jest.fn(),
    getPersonalizedResults: jest.fn(),
    getPersonalizedSuggestions: jest.fn(),
    generateRecommendations: jest.fn(),
    trackRecommendationClick: jest.fn(),
    trackRecommendationConversion: jest.fn(),
    addToSearchHistory: jest.fn(),
    getSearchHistory: jest.fn(),
    clearSearchHistory: jest.fn(),
    learnFromBehavior: jest.fn()
  }))
}));
jest.mock('../../services/logger');

describe('Search Personalization API Routes', () => {
  let app;
  let mockSearchPersonalizationService;

  beforeEach(() => {
    // Create Express app
    app = express();
    app.use(express.json());
    app.use('/', router);

    // Mock service
    mockSearchPersonalizationService = new SearchPersonalizationService();
    initializeSearchPersonalizationController({ searchPersonalizationService: mockSearchPersonalizationService });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /preferences', () => {
    it('should return user preferences', async () => {
      const preferences = {
        userId: 'user-123',
        preferredCategories: [
          { categoryId: 'cat-1', categoryName: 'Electronics', score: 0.9 },
          { categoryId: 'cat-2', categoryName: 'Computers', score: 0.8 },
        ],
        preferredBrands: [
          { brandId: 'brand-1', brandName: 'Apple', score: 0.95 },
          { brandId: 'brand-2', brandName: 'Samsung', score: 0.7 },
        ],
        priceRangeMin: 100,
        priceRangeMax: 1000,
        searchHistory: ['laptop', 'phone'],
        behaviorProfile: {
          avgSessionDuration: 300,
          avgQueriesPerSession: 5,
          preferredDeviceType: 'desktop',
        },
        lastUpdated: new Date(),
      };

      mockSearchPersonalizationService.getUserPreferences.mockResolvedValue(preferences);

      const response = await request(app)
        .get('/preferences')
        .set('Authorization', 'Bearer user-token');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        data: preferences,
      });

      expect(mockSearchPersonalizationService.getUserPreferences).toHaveBeenCalledWith('user-123');
    });

    it('should return default preferences for new user', async () => {
      const defaultPreferences = {
        userId: 'user-999',
        preferredCategories: [],
        preferredBrands: [],
        priceRangeMin: null,
        priceRangeMax: null,
        searchHistory: [],
        lastUpdated: expect.any(Date),
      };

      mockSearchPersonalizationService.getUserPreferences.mockResolvedValue(defaultPreferences);

      const response = await request(app)
        .get('/preferences')
        .set('Authorization', 'Bearer user-999-token');

      expect(response.status).toBe(200);
      expect(response.body.data.preferredCategories).toEqual([]);
      expect(response.body.data.preferredBrands).toEqual([]);
    });

    it('should return 401 for unauthenticated request', async () => {
      const response = await request(app)
        .get('/preferences');

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Authentication required');
    });

    it('should handle service errors', async () => {
      mockSearchPersonalizationService.getUserPreferences.mockRejectedValue(new Error('Service error'));

      const response = await request(app)
        .get('/preferences')
        .set('Authorization', 'Bearer user-token');

      expect(response.status).toBe(500);
    });
  });

  describe('PUT /preferences', () => {
    it('should update user preferences successfully', async () => {
      const updatedPreferences = {
        userId: 'user-123',
        preferredCategories: [
          { categoryId: 'cat-1', categoryName: 'Electronics', score: 0.9 },
          { categoryId: 'cat-3', categoryName: 'Tablets', score: 0.85 },
        ],
        preferredBrands: [
          { brandId: 'brand-1', brandName: 'Apple', score: 0.95 },
          { brandId: 'brand-3', brandName: 'Sony', score: 0.8 },
        ],
        priceRangeMin: 50,
        priceRangeMax: 1500,
        searchHistory: ['laptop', 'phone', 'tablet'],
        lastUpdated: expect.any(Date),
      };

      mockSearchPersonalizationService.updateUserPreferences.mockResolvedValue(updatedPreferences);

      const response = await request(app)
        .put('/preferences')
        .set('Authorization', 'Bearer user-token')
        .send({
          preferredCategories: ['cat-1', 'cat-3'],
          preferredBrands: ['brand-1', 'brand-3'],
          priceRangeMin: 50,
          priceRangeMax: 1500,
        });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        data: updatedPreferences,
      });

      expect(mockSearchPersonalizationService.updateUserPreferences).toHaveBeenCalledWith(
        'user-123',
        {
          preferredCategories: ['cat-1', 'cat-3'],
          preferredBrands: ['brand-1', 'brand-3'],
          priceRangeMin: 50,
          priceRangeMax: 1500,
        }
      );
    });

    it('should handle partial preference updates', async () => {
      const updatedPreferences = {
        userId: 'user-123',
        preferredCategories: [
          { categoryId: 'cat-1', categoryName: 'Electronics', score: 0.9 },
        ],
        preferredBrands: [
          { brandId: 'brand-1', brandName: 'Apple', score: 0.95 },
        ],
        priceRangeMin: 100,
        priceRangeMax: 1000,
        searchHistory: ['laptop', 'phone'],
        lastUpdated: expect.any(Date),
      };

      mockSearchPersonalizationService.updateUserPreferences.mockResolvedValue(updatedPreferences);

      const response = await request(app)
        .put('/preferences')
        .set('Authorization', 'Bearer user-token')
        .send({
          preferredCategories: ['cat-1'],
        });

      expect(response.status).toBe(200);
      expect(mockSearchPersonalizationService.updateUserPreferences).toHaveBeenCalledWith(
        'user-123',
        { preferredCategories: ['cat-1'] }
      );
    });

    it('should return 401 for unauthenticated request', async () => {
      const response = await request(app)
        .put('/preferences')
        .send({
          preferredCategories: ['cat-1'],
        });

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Authentication required');
    });

    it('should reject request with invalid price range', async () => {
      const response = await request(app)
        .put('/preferences')
        .set('Authorization', 'Bearer user-token')
        .send({
          priceRangeMin: -100,
          priceRangeMax: 1000,
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Validation failed');
    });

    it('should reject request with invalid category array', async () => {
      const response = await request(app)
        .put('/preferences')
        .set('Authorization', 'Bearer user-token')
        .send({
          preferredCategories: 'not-an-array',
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Validation failed');
    });

    it('should handle service errors', async () => {
      mockSearchPersonalizationService.updateUserPreferences.mockRejectedValue(new Error('Service error'));

      const response = await request(app)
        .put('/preferences')
        .set('Authorization', 'Bearer user-token')
        .send({
          preferredCategories: ['cat-1'],
        });

      expect(response.status).toBe(500);
    });
  });

  describe('GET /results', () => {
    it('should return personalized search results', async () => {
      const personalizedResults = {
        total: 10,
        results: [
          { id: 'product-1', name: 'Laptop 1', score: 1.5 },
          { id: 'product-2', name: 'Laptop 2', score: 1.3 },
        ],
        personalized: true,
        preferencesApplied: {
          categories: ['cat-1', 'cat-2'],
          brands: ['brand-1'],
          priceRange: { min: 100, max: 1000 },
        },
      };

      mockSearchPersonalizationService.getPersonalizedResults.mockResolvedValue(personalizedResults);

      const response = await request(app)
        .get('/results?query=laptop')
        .set('Authorization', 'Bearer user-token');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        data: personalizedResults,
      });

      expect(mockSearchPersonalizationService.getPersonalizedResults).toHaveBeenCalledWith('laptop', 'user-123');
    });

    it('should return 401 for unauthenticated request', async () => {
      const response = await request(app)
        .get('/results?query=laptop');

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Authentication required');
    });

    it('should reject request with missing query', async () => {
      const response = await request(app)
        .get('/results')
        .set('Authorization', 'Bearer user-token');

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Validation failed');
    });

    it('should handle service errors', async () => {
      mockSearchPersonalizationService.getPersonalizedResults.mockRejectedValue(new Error('Service error'));

      const response = await request(app)
        .get('/results?query=laptop')
        .set('Authorization', 'Bearer user-token');

      expect(response.status).toBe(500);
    });
  });

  describe('GET /suggestions', () => {
    it('should return personalized suggestions', async () => {
      const suggestions = [
        { type: 'recent_search', text: 'laptop', timestamp: new Date() },
        { type: 'recent_search', text: 'phone', timestamp: new Date() },
        {
          type: 'recommendation',
          productId: 'product-1',
          product: {
            id: 'product-1',
            name: 'Laptop 1',
            slug: 'laptop-1',
            regularPrice: 999,
            salePrice: 899,
            primaryImage: 'laptop-1.jpg',
          },
          reason: 'Based on your preferences',
          score: 0.9,
        },
      ];

      mockSearchPersonalizationService.getPersonalizedSuggestions.mockResolvedValue(suggestions);

      const response = await request(app)
        .get('/suggestions')
        .set('Authorization', 'Bearer user-token');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        data: suggestions,
      });

      expect(mockSearchPersonalizationService.getPersonalizedSuggestions).toHaveBeenCalledWith('user-123', 10);
    });

    it('should respect limit parameter', async () => {
      const suggestions = Array.from({ length: 20 }, (_, i) => ({
        type: 'recent_search',
        text: `query-${i}`,
        timestamp: new Date(),
      }));

      mockSearchPersonalizationService.getPersonalizedSuggestions.mockResolvedValue(suggestions);

      const response = await request(app)
        .get('/suggestions?limit=5')
        .set('Authorization', 'Bearer user-token');

      expect(response.body.data.length).toBeLessThanOrEqual(5);
    });

    it('should return 401 for unauthenticated request', async () => {
      const response = await request(app)
        .get('/suggestions');

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Authentication required');
    });

    it('should reject request with invalid limit', async () => {
      const response = await request(app)
        .get('/suggestions?limit=100')
        .set('Authorization', 'Bearer user-token');

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Validation failed');
    });

    it('should handle service errors', async () => {
      mockSearchPersonalizationService.getPersonalizedSuggestions.mockRejectedValue(new Error('Service error'));

      const response = await request(app)
        .get('/suggestions')
        .set('Authorization', 'Bearer user-token');

      expect(response.status).toBe(500);
    });
  });

  describe('GET /recommendations', () => {
    it('should return recommendations', async () => {
      const recommendations = [
        {
          id: 'rec-1',
          userId: 'user-123',
          productId: 'product-1',
          recommendationType: 'personalized',
          score: 0.9,
          reason: 'Based on your preferences',
          clicked: false,
          converted: false,
          product: {
            id: 'product-1',
            name: 'Laptop 1',
            slug: 'laptop-1',
            regularPrice: 999,
            salePrice: 899,
            primaryImage: 'laptop-1.jpg',
          },
        },
        {
          id: 'rec-2',
          userId: 'user-123',
          productId: 'product-2',
          recommendationType: 'collaborative',
          score: 0.8,
          reason: 'Users like you also viewed this',
          clicked: false,
          converted: false,
          product: {
            id: 'product-2',
            name: 'Laptop 2',
            slug: 'laptop-2',
            regularPrice: 799,
            salePrice: 699,
            primaryImage: 'laptop-2.jpg',
          },
        },
      ];

      mockSearchPersonalizationService.generateRecommendations.mockResolvedValue(recommendations);

      const response = await request(app)
        .get('/recommendations?type=personalized')
        .set('Authorization', 'Bearer user-token');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        data: recommendations,
      });

      expect(mockSearchPersonalizationService.generateRecommendations).toHaveBeenCalledWith('user-123', 'personalized', 10);
    });

    it('should respect type parameter', async () => {
      const recommendations = [];

      mockSearchPersonalizationService.generateRecommendations.mockResolvedValue(recommendations);

      const response = await request(app)
        .get('/recommendations?type=trending')
        .set('Authorization', 'Bearer user-token');

      expect(mockSearchPersonalizationService.generateRecommendations).toHaveBeenCalledWith('user-123', 'trending', 10);
    });

    it('should return 401 for unauthenticated request', async () => {
      const response = await request(app)
        .get('/recommendations');

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Authentication required');
    });

    it('should reject request with invalid type', async () => {
      const response = await request(app)
        .get('/recommendations?type=invalid')
        .set('Authorization', 'Bearer user-token');

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Validation failed');
    });

    it('should handle service errors', async () => {
      mockSearchPersonalizationService.generateRecommendations.mockRejectedValue(new Error('Service error'));

      const response = await request(app)
        .get('/recommendations?type=personalized')
        .set('Authorization', 'Bearer user-token');

      expect(response.status).toBe(500);
    });
  });

  describe('POST /recommendation/click', () => {
    it('should track recommendation click successfully', async () => {
      const result = { count: 1 };

      mockSearchPersonalizationService.trackRecommendationClick.mockResolvedValue(result);

      const response = await request(app)
        .post('/recommendation/click')
        .set('Authorization', 'Bearer user-token')
        .send({
          productId: 'product-123',
          recommendationId: 'rec-123',
        });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        data: result,
      });

      expect(mockSearchPersonalizationService.trackRecommendationClick).toHaveBeenCalledWith('user-123', 'product-123', 'rec-123');
    });

    it('should handle click without recommendation ID', async () => {
      const result = { count: 1 };

      mockSearchPersonalizationService.trackRecommendationClick.mockResolvedValue(result);

      const response = await request(app)
        .post('/recommendation/click')
        .set('Authorization', 'Bearer user-token')
        .send({
          productId: 'product-123',
        });

      expect(response.status).toBe(200);
      expect(mockSearchPersonalizationService.trackRecommendationClick).toHaveBeenCalledWith('user-123', 'product-123', null);
    });

    it('should return 401 for unauthenticated request', async () => {
      const response = await request(app)
        .post('/recommendation/click')
        .send({
          productId: 'product-123',
          recommendationId: 'rec-123',
        });

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Authentication required');
    });

    it('should reject request with invalid product ID', async () => {
      const response = await request(app)
        .post('/recommendation/click')
        .set('Authorization', 'Bearer user-token')
        .send({
          productId: 'invalid-id',
          recommendationId: 'rec-123',
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Validation failed');
    });

    it('should handle service errors', async () => {
      mockSearchPersonalizationService.trackRecommendationClick.mockRejectedValue(new Error('Service error'));

      const response = await request(app)
        .post('/recommendation/click')
        .set('Authorization', 'Bearer user-token')
        .send({
          productId: 'product-123',
          recommendationId: 'rec-123',
        });

      expect(response.status).toBe(500);
    });
  });

  describe('POST /recommendation/conversion', () => {
    it('should track recommendation conversion successfully', async () => {
      const result = { count: 1 };

      mockSearchPersonalizationService.trackRecommendationConversion.mockResolvedValue(result);

      const response = await request(app)
        .post('/recommendation/conversion')
        .set('Authorization', 'Bearer user-token')
        .send({
          productId: 'product-123',
        });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        data: result,
      });

      expect(mockSearchPersonalizationService.trackRecommendationConversion).toHaveBeenCalledWith('user-123', 'product-123');
    });

    it('should return 401 for unauthenticated request', async () => {
      const response = await request(app)
        .post('/recommendation/conversion')
        .send({
          productId: 'product-123',
        });

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Authentication required');
    });

    it('should reject request with invalid product ID', async () => {
      const response = await request(app)
        .post('/recommendation/conversion')
        .set('Authorization', 'Bearer user-token')
        .send({
          productId: 'invalid-id',
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Validation failed');
    });

    it('should handle service errors', async () => {
      mockSearchPersonalizationService.trackRecommendationConversion.mockRejectedValue(new Error('Service error'));

      const response = await request(app)
        .post('/recommendation/conversion')
        .set('Authorization', 'Bearer user-token')
        .send({
          productId: 'product-123',
        });

      expect(response.status).toBe(500);
    });
  });

  describe('POST /history', () => {
    it('should add search to history successfully', async () => {
      const updatedPreferences = {
        userId: 'user-123',
        searchHistory: ['tablet', 'laptop', 'phone'],
        lastUpdated: expect.any(Date),
      };

      mockSearchPersonalizationService.addToSearchHistory.mockResolvedValue(updatedPreferences);

      const response = await request(app)
        .post('/history')
        .set('Authorization', 'Bearer user-token')
        .send({
          query: 'tablet',
        });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        data: updatedPreferences,
      });

      expect(mockSearchPersonalizationService.addToSearchHistory).toHaveBeenCalledWith('user-123', 'tablet');
    });

    it('should return 401 for unauthenticated request', async () => {
      const response = await request(app)
        .post('/history')
        .send({
          query: 'laptop',
        });

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Authentication required');
    });

    it('should reject request with missing query', async () => {
      const response = await request(app)
        .post('/history')
        .set('Authorization', 'Bearer user-token')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Validation failed');
    });

    it('should handle service errors', async () => {
      mockSearchPersonalizationService.addToSearchHistory.mockRejectedValue(new Error('Service error'));

      const response = await request(app)
        .post('/history')
        .set('Authorization', 'Bearer user-token')
        .send({
          query: 'laptop',
        });

      expect(response.status).toBe(500);
    });
  });

  describe('GET /history', () => {
    it('should return search history', async () => {
      const preferences = {
        userId: 'user-123',
        searchHistory: ['laptop', 'phone', 'tablet', 'monitor'],
      };

      mockSearchPersonalizationService.getSearchHistory.mockResolvedValue(preferences.searchHistory);

      const response = await request(app)
        .get('/history')
        .set('Authorization', 'Bearer user-token');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        data: preferences.searchHistory,
      });

      expect(mockSearchPersonalizationService.getSearchHistory).toHaveBeenCalledWith('user-123', 20);
    });

    it('should respect limit parameter', async () => {
      const preferences = {
        userId: 'user-123',
        searchHistory: Array.from({ length: 30 }, (_, i) => `query-${i}`),
      };

      mockSearchPersonalizationService.getSearchHistory.mockResolvedValue(preferences.searchHistory);

      const response = await request(app)
        .get('/history?limit=10')
        .set('Authorization', 'Bearer user-token');

      expect(response.body.data.length).toBeLessThanOrEqual(10);
    });

    it('should return 401 for unauthenticated request', async () => {
      const response = await request(app)
        .get('/history');

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Authentication required');
    });

    it('should reject request with invalid limit', async () => {
      const response = await request(app)
        .get('/history?limit=100')
        .set('Authorization', 'Bearer user-token');

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Validation failed');
    });

    it('should handle service errors', async () => {
      mockSearchPersonalizationService.getSearchHistory.mockRejectedValue(new Error('Service error'));

      const response = await request(app)
        .get('/history')
        .set('Authorization', 'Bearer user-token');

      expect(response.status).toBe(500);
    });
  });

  describe('DELETE /history', () => {
    it('should clear search history successfully', async () => {
      const updatedPreferences = {
        userId: 'user-123',
        searchHistory: [],
        lastUpdated: expect.any(Date),
      };

      mockSearchPersonalizationService.clearSearchHistory.mockResolvedValue(updatedPreferences);

      const response = await request(app)
        .delete('/history')
        .set('Authorization', 'Bearer user-token');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        data: updatedPreferences,
      });

      expect(mockSearchPersonalizationService.clearSearchHistory).toHaveBeenCalledWith('user-123');
    });

    it('should return 401 for unauthenticated request', async () => {
      const response = await request(app)
        .delete('/history');

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Authentication required');
    });

    it('should handle service errors', async () => {
      mockSearchPersonalizationService.clearSearchHistory.mockRejectedValue(new Error('Service error'));

      const response = await request(app)
        .delete('/history')
        .set('Authorization', 'Bearer user-token');

      expect(response.status).toBe(500);
    });
  });

  describe('POST /behavior', () => {
    it('should learn from purchase behavior', async () => {
      const updatedPreferences = {
        userId: 'user-123',
        preferredCategories: ['cat-1', 'cat-2'],
        preferredBrands: ['brand-1'],
        priceRangeMin: 100,
        priceRangeMax: 1000,
        searchHistory: [],
        lastUpdated: expect.any(Date),
      };

      const product = {
        id: 'product-123',
        name: 'Laptop 1',
        categories: [{ id: 'cat-1', name: 'Electronics' }],
        brand: { id: 'brand-1', name: 'Apple' },
      };

      mockPrisma.product.findUnique.mockResolvedValue(product);
      mockSearchPersonalizationService.getUserPreferences.mockResolvedValue({
        userId: 'user-123',
        preferredCategories: ['cat-3'],
        preferredBrands: ['brand-2'],
      });
      mockSearchPersonalizationService.updateUserPreferences.mockResolvedValue(updatedPreferences);

      const response = await request(app)
        .post('/behavior')
        .set('Authorization', 'Bearer user-token')
        .send({
          productId: 'product-123',
          action: 'purchase',
        });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        data: updatedPreferences,
      });

      expect(mockSearchPersonalizationService.learnFromBehavior).toHaveBeenCalledWith('user-123', 'product-123', 'purchase');
    });

    it('should learn from add_to_cart behavior', async () => {
      const updatedPreferences = {
        userId: 'user-123',
        preferredCategories: ['cat-1'],
        preferredBrands: ['brand-1'],
        priceRangeMin: 100,
        priceRangeMax: 1000,
        searchHistory: [],
        lastUpdated: expect.any(Date),
      };

      const product = {
        id: 'product-456',
        name: 'Phone 1',
        categories: [{ id: 'cat-1' }],
        brand: { id: 'brand-1' },
      };

      mockPrisma.product.findUnique.mockResolvedValue(product);
      mockSearchPersonalizationService.getUserPreferences.mockResolvedValue({
        userId: 'user-123',
        preferredCategories: [],
        preferredBrands: [],
      });
      mockSearchPersonalizationService.updateUserPreferences.mockResolvedValue(updatedPreferences);

      const response = await request(app)
        .post('/behavior')
        .set('Authorization', 'Bearer user-token')
        .send({
          productId: 'product-456',
          action: 'add_to_cart',
        });

      expect(response.status).toBe(200);
      expect(mockSearchPersonalizationService.learnFromBehavior).toHaveBeenCalledWith('user-123', 'product-456', 'add_to_cart');
    });

    it('should not learn from view behavior', async () => {
      const updatedPreferences = {
        userId: 'user-123',
        preferredCategories: [],
        preferredBrands: [],
        priceRangeMin: 100,
        priceRangeMax: 1000,
        searchHistory: [],
        lastUpdated: expect.any(Date),
      };

      const product = {
        id: 'product-789',
        name: 'Tablet 1',
        categories: [{ id: 'cat-1' }],
        brand: { id: 'brand-1' },
      };

      mockPrisma.product.findUnique.mockResolvedValue(product);
      mockSearchPersonalizationService.getUserPreferences.mockResolvedValue({
        userId: 'user-123',
        preferredCategories: [],
        preferredBrands: [],
      });
      mockSearchPersonalizationService.updateUserPreferences.mockResolvedValue(updatedPreferences);

      const response = await request(app)
        .post('/behavior')
        .set('Authorization', 'Bearer user-token')
        .send({
          productId: 'product-789',
          action: 'view',
        });

      expect(response.status).toBe(200);
      expect(mockSearchPersonalizationService.learnFromBehavior).toHaveBeenCalledWith('user-123', 'product-789', 'view');
    });

    it('should return 401 for unauthenticated request', async () => {
      const response = await request(app)
        .post('/behavior')
        .send({
          productId: 'product-123',
          action: 'purchase',
        });

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Authentication required');
    });

    it('should reject request with invalid product ID', async () => {
      const response = await request(app)
        .post('/behavior')
        .set('Authorization', 'Bearer user-token')
        .send({
          productId: 'invalid-id',
          action: 'purchase',
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Validation failed');
    });

    it('should reject request with invalid action', async () => {
      const response = await request(app)
        .post('/behavior')
        .set('Authorization', 'Bearer user-token')
        .send({
          productId: 'product-123',
          action: 'invalid_action',
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Validation failed');
    });

    it('should handle service errors', async () => {
      mockPrisma.product.findUnique.mockRejectedValue(new Error('Database error'));
      mockSearchPersonalizationService.getUserPreferences.mockResolvedValue({
        userId: 'user-123',
        preferredCategories: [],
        preferredBrands: [],
      });
      mockSearchPersonalizationService.updateUserPreferences.mockResolvedValue({});

      const response = await request(app)
        .post('/behavior')
        .set('Authorization', 'Bearer user-token')
        .send({
          productId: 'product-123',
          action: 'purchase',
        });

      expect(response.status).toBe(500);
    });
  });
});
