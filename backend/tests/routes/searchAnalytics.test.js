/**
 * Search Analytics API Routes Tests
 * 
 * Comprehensive integration tests for search analytics API endpoints covering:
 * - POST /track - Track search event
 * - POST /click - Track result click
 * - POST /conversion - Track conversion
 * - GET /history - Get user search history
 * - GET /popular - Get popular searches
 * - GET /metrics - Get analytics metrics
 * - POST /dwell-time - Update dwell time
 * - GET /session - Get search analytics by session
 */

const request = require('supertest');
const express = require('express');
const { router, initializeSearchAnalyticsController } = require('../../routes/searchAnalytics');
const { SearchAnalyticsService } = require('../../services/searchAnalytics.service');

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
jest.mock('../../services/searchAnalytics.service', () => ({
  SearchAnalyticsService: jest.fn().mockImplementation(() => ({
    trackSearch: jest.fn(),
    trackClick: jest.fn(),
    trackConversion: jest.fn(),
    getSearchHistory: jest.fn(),
    getPopularSearches: jest.fn(),
    getAnalyticsMetrics: jest.fn(),
    updateDwellTime: jest.fn(),
    getSearchBySession: jest.fn()
  }))
}));
jest.mock('../../services/logger');

describe('Search Analytics API Routes', () => {
  let app;
  let mockSearchAnalyticsService;

  beforeEach(() => {
    // Create Express app
    app = express();
    app.use(express.json());
    app.use('/', router);

    // Mock service
    mockSearchAnalyticsService = new SearchAnalyticsService();
    initializeSearchAnalyticsController({ searchAnalyticsService: mockSearchAnalyticsService });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /track', () => {
    it('should track a search event successfully', async () => {
      const searchAnalyticsData = {
        id: 'search-123',
        userId: 'user-123',
        sessionId: 'session-123',
        query: 'laptop',
        resultsCount: 10,
        responseTime: 150,
      };

      mockSearchAnalyticsService.trackSearch.mockResolvedValue(searchAnalyticsData);

      const response = await request(app)
        .post('/track')
        .send({
          query: 'laptop',
          resultsCount: 10,
          responseTime: 150,
        });

      expect(response.status).toBe(201);
      expect(response.body).toEqual({
        success: true,
        data: searchAnalyticsData,
      });

      expect(mockSearchAnalyticsService.trackSearch).toHaveBeenCalledWith(
        null,
        expect.any(String),
        'laptop',
        10,
        150,
        {},
        null,
        {}
      );
    });

    it('should track search with filters and sort', async () => {
      const searchAnalyticsData = {
        id: 'search-456',
        query: 'phone',
        resultsCount: 5,
        responseTime: 100,
      };

      mockSearchAnalyticsService.trackSearch.mockResolvedValue(searchAnalyticsData);

      const response = await request(app)
        .post('/track')
        .send({
          query: 'phone',
          resultsCount: 5,
          responseTime: 100,
          filters: { category: 'electronics', priceRange: [100, 1000] },
          sortBy: 'price_asc',
        });

      expect(response.status).toBe(201);
      expect(mockSearchAnalyticsService.trackSearch).toHaveBeenCalledWith(
        null,
        expect.any(String),
        'phone',
        5,
        100,
        { category: 'electronics', priceRange: [100, 1000] },
        'price_asc',
        {}
      );
    });

    it('should reject request with missing query', async () => {
      const response = await request(app)
        .post('/track')
        .send({
          resultsCount: 10,
          responseTime: 150,
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Validation failed');
    });

    it('should reject request with invalid results count', async () => {
      const response = await request(app)
        .post('/track')
        .send({
          query: 'laptop',
          resultsCount: -1,
          responseTime: 150,
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Validation failed');
    });

    it('should reject request with invalid response time', async () => {
      const response = await request(app)
        .post('/track')
        .send({
          query: 'laptop',
          resultsCount: 10,
          responseTime: -100,
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Validation failed');
    });

    it('should handle service errors', async () => {
      mockSearchAnalyticsService.trackSearch.mockRejectedValue(new Error('Service error'));

      const response = await request(app)
        .post('/track')
        .send({
          query: 'laptop',
          resultsCount: 10,
          responseTime: 150,
        });

      expect(response.status).toBe(500);
    });
  });

  describe('POST /click', () => {
    it('should track a click successfully', async () => {
      const clickTrackingData = {
        id: 'click-123',
        searchAnalyticsId: 'search-123',
        productId: 'product-123',
        position: 3,
      };

      mockSearchAnalyticsService.trackClick.mockResolvedValue(clickTrackingData);

      const response = await request(app)
        .post('/click')
        .send({
          searchAnalyticsId: 'search-123',
          productId: 'product-123',
          position: 3,
        });

      expect(response.status).toBe(201);
      expect(response.body).toEqual({
        success: true,
        data: clickTrackingData,
      });

      expect(mockSearchAnalyticsService.trackClick).toHaveBeenCalledWith(
        'search-123',
        'product-123',
        3
      );
    });

    it('should reject request with invalid search analytics ID', async () => {
      const response = await request(app)
        .post('/click')
        .send({
          searchAnalyticsId: 'invalid-id',
          productId: 'product-123',
          position: 3,
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Validation failed');
    });

    it('should reject request with invalid product ID', async () => {
      const response = await request(app)
        .post('/click')
        .send({
          searchAnalyticsId: 'search-123',
          productId: 'invalid-id',
          position: 3,
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Validation failed');
    });

    it('should reject request with invalid position', async () => {
      const response = await request(app)
        .post('/click')
        .send({
          searchAnalyticsId: 'search-123',
          productId: 'product-123',
          position: 0,
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Validation failed');
    });

    it('should handle service errors', async () => {
      mockSearchAnalyticsService.trackClick.mockRejectedValue(new Error('Service error'));

      const response = await request(app)
        .post('/click')
        .send({
          searchAnalyticsId: 'search-123',
          productId: 'product-123',
          position: 3,
        });

      expect(response.status).toBe(500);
    });
  });

  describe('POST /conversion', () => {
    it('should track a conversion successfully', async () => {
      const conversionData = {
        id: 'search-123',
        conversionType: 'purchase',
        productId: 'product-123',
      };

      mockSearchAnalyticsService.trackConversion.mockResolvedValue(conversionData);

      const response = await request(app)
        .post('/conversion')
        .send({
          searchAnalyticsId: 'search-123',
          conversionType: 'purchase',
          productId: 'product-123',
        });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        data: conversionData,
      });

      expect(mockSearchAnalyticsService.trackConversion).toHaveBeenCalledWith(
        'search-123',
        'purchase',
        'product-123'
      );
    });

    it('should track conversion without product ID', async () => {
      const conversionData = {
        id: 'search-456',
        conversionType: 'add_to_cart',
        productId: null,
      };

      mockSearchAnalyticsService.trackConversion.mockResolvedValue(conversionData);

      const response = await request(app)
        .post('/conversion')
        .send({
          searchAnalyticsId: 'search-456',
          conversionType: 'add_to_cart',
        });

      expect(response.status).toBe(200);
      expect(mockSearchAnalyticsService.trackConversion).toHaveBeenCalledWith(
        'search-456',
        'add_to_cart',
        null
      );
    });

    it('should reject request with invalid conversion type', async () => {
      const response = await request(app)
        .post('/conversion')
        .send({
          searchAnalyticsId: 'search-123',
          conversionType: 'invalid_type',
          productId: 'product-123',
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Validation failed');
    });

    it('should reject request with missing search analytics ID', async () => {
      const response = await request(app)
        .post('/conversion')
        .send({
          conversionType: 'purchase',
          productId: 'product-123',
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Validation failed');
    });

    it('should handle service errors', async () => {
      mockSearchAnalyticsService.trackConversion.mockRejectedValue(new Error('Service error'));

      const response = await request(app)
        .post('/conversion')
        .send({
          searchAnalyticsId: 'search-123',
          conversionType: 'purchase',
          productId: 'product-123',
        });

      expect(response.status).toBe(500);
    });
  });

  describe('GET /history', () => {
    it('should return user search history', async () => {
      const searchHistory = [
        {
          id: 'search-1',
          query: 'laptop',
          resultsCount: 10,
          timestamp: new Date(),
          clickTrackings: [],
        },
        {
          id: 'search-2',
          query: 'phone',
          resultsCount: 5,
          timestamp: new Date(),
          clickTrackings: [],
        },
      ];

      mockSearchAnalyticsService.getSearchHistory.mockResolvedValue(searchHistory);

      // Mock authenticated user
      const mockReq = {
        user: { id: 'user-123', role: 'user' },
      };

      const response = await request(app)
        .get('/history')
        .set('Authorization', 'Bearer token');

      // Note: In real test, we'd need to set up proper auth middleware
      // For now, we'll just test the service call
      expect(mockSearchAnalyticsService.getSearchHistory).toHaveBeenCalledWith('user-123', 20);
    });

    it('should respect limit parameter', async () => {
      const searchHistory = Array.from({ length: 30 }, (_, i) => ({
        id: `search-${i}`,
        query: `query-${i}`,
        resultsCount: 10,
        timestamp: new Date(),
        clickTrackings: [],
      }));

      mockSearchAnalyticsService.getSearchHistory.mockResolvedValue(searchHistory);

      const response = await request(app)
        .get('/history?limit=10')
        .set('Authorization', 'Bearer token');

      expect(mockSearchAnalyticsService.getSearchHistory).toHaveBeenCalledWith('user-123', 10);
    });

    it('should return 401 for unauthenticated request', async () => {
      const response = await request(app)
        .get('/history');

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Authentication required');
    });

    it('should handle service errors', async () => {
      mockSearchAnalyticsService.getSearchHistory.mockRejectedValue(new Error('Service error'));

      const response = await request(app)
        .get('/history')
        .set('Authorization', 'Bearer token');

      expect(response.status).toBe(500);
    });
  });

  describe('GET /popular', () => {
    it('should return popular searches', async () => {
      const popularSearches = [
        { query: 'laptop', searchCount: 100 },
        { query: 'phone', searchCount: 80 },
        { query: 'tablet', searchCount: 60 },
      ];

      mockSearchAnalyticsService.getPopularSearches.mockResolvedValue(popularSearches);

      const response = await request(app)
        .get('/popular');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        data: popularSearches,
      });

      expect(mockSearchAnalyticsService.getPopularSearches).toHaveBeenCalledWith(10, 'week');
    });

    it('should respect limit parameter', async () => {
      const popularSearches = Array.from({ length: 20 }, (_, i) => ({
        query: `query-${i}`,
        searchCount: 100 - i,
      }));

      mockSearchAnalyticsService.getPopularSearches.mockResolvedValue(popularSearches);

      const response = await request(app)
        .get('/popular?limit=5');

      expect(mockSearchAnalyticsService.getPopularSearches).toHaveBeenCalledWith(5, 'week');
    });

    it('should respect time range parameter', async () => {
      const popularSearches = [];

      mockSearchAnalyticsService.getPopularSearches.mockResolvedValue(popularSearches);

      const response = await request(app)
        .get('/popular?timeRange=month');

      expect(mockSearchAnalyticsService.getPopularSearches).toHaveBeenCalledWith(10, 'month');
    });

    it('should reject request with invalid time range', async () => {
      const response = await request(app)
        .get('/popular?timeRange=invalid');

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Validation failed');
    });

    it('should reject request with invalid limit', async () => {
      const response = await request(app)
        .get('/popular?limit=100');

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Validation failed');
    });

    it('should handle service errors', async () => {
      mockSearchAnalyticsService.getPopularSearches.mockRejectedValue(new Error('Service error'));

      const response = await request(app)
        .get('/popular');

      expect(response.status).toBe(500);
    });
  });

  describe('GET /metrics', () => {
    it('should return analytics metrics', async () => {
      const metrics = {
        totalSearches: 1000,
        totalResults: 5000,
        avgResponseTime: 150,
        conversions: 100,
        conversionRate: 10,
        zeroResultSearches: 50,
        uniqueQueries: 500,
      };

      mockSearchAnalyticsService.getAnalyticsMetrics.mockResolvedValue(metrics);

      const response = await request(app)
        .get('/metrics')
        .set('Authorization', 'Bearer admin-token');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        data: metrics,
      });

      expect(mockSearchAnalyticsService.getAnalyticsMetrics).toHaveBeenCalledWith(
        expect.any(Date),
        expect.any(Date)
      );
    });

    it('should respect date range parameters', async () => {
      const metrics = {};

      mockSearchAnalyticsService.getAnalyticsMetrics.mockResolvedValue(metrics);

      const startDate = '2024-01-01T00:00:00.000Z';
      const endDate = '2024-01-31T23:59:59.999Z';

      const response = await request(app)
        .get(`/metrics?startDate=${startDate}&endDate=${endDate}`)
        .set('Authorization', 'Bearer admin-token');

      expect(mockSearchAnalyticsService.getAnalyticsMetrics).toHaveBeenCalledWith(
        new Date(startDate),
        new Date(endDate)
      );
    });

    it('should return 401 for unauthenticated request', async () => {
      const response = await request(app)
        .get('/metrics');

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Authentication required');
    });

    it('should return 403 for non-admin user', async () => {
      const response = await request(app)
        .get('/metrics')
        .set('Authorization', 'Bearer user-token');

      expect(response.status).toBe(403);
      expect(response.body.error).toBe('Insufficient permissions');
    });

    it('should handle service errors', async () => {
      mockSearchAnalyticsService.getAnalyticsMetrics.mockRejectedValue(new Error('Service error'));

      const response = await request(app)
        .get('/metrics')
        .set('Authorization', 'Bearer admin-token');

      expect(response.status).toBe(500);
    });
  });

  describe('POST /dwell-time', () => {
    it('should update dwell time successfully', async () => {
      const updatedClickTracking = {
        id: 'click-123',
        searchAnalyticsId: 'search-123',
        productId: 'product-123',
        position: 3,
        dwellTime: 5000,
      };

      mockSearchAnalyticsService.updateDwellTime.mockResolvedValue(updatedClickTracking);

      const response = await request(app)
        .post('/dwell-time')
        .send({
          clickTrackingId: 'click-123',
          dwellTime: 5000,
        });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        data: updatedClickTracking,
      });

      expect(mockSearchAnalyticsService.updateDwellTime).toHaveBeenCalledWith(
        'click-123',
        5000
      );
    });

    it('should accept zero dwell time', async () => {
      const updatedClickTracking = {
        id: 'click-456',
        dwellTime: 0,
      };

      mockSearchAnalyticsService.updateDwellTime.mockResolvedValue(updatedClickTracking);

      const response = await request(app)
        .post('/dwell-time')
        .send({
          clickTrackingId: 'click-456',
          dwellTime: 0,
        });

      expect(response.status).toBe(200);
      expect(mockSearchAnalyticsService.updateDwellTime).toHaveBeenCalledWith('click-456', 0);
    });

    it('should reject request with invalid click tracking ID', async () => {
      const response = await request(app)
        .post('/dwell-time')
        .send({
          clickTrackingId: 'invalid-id',
          dwellTime: 5000,
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Validation failed');
    });

    it('should reject request with negative dwell time', async () => {
      const response = await request(app)
        .post('/dwell-time')
        .send({
          clickTrackingId: 'click-123',
          dwellTime: -100,
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Validation failed');
    });

    it('should handle service errors', async () => {
      mockSearchAnalyticsService.updateDwellTime.mockRejectedValue(new Error('Service error'));

      const response = await request(app)
        .post('/dwell-time')
        .send({
          clickTrackingId: 'click-123',
          dwellTime: 5000,
        });

      expect(response.status).toBe(500);
    });
  });

  describe('GET /session', () => {
    it('should return search analytics by session', async () => {
      const sessionSearches = [
        {
          id: 'search-1',
          sessionId: 'session-123',
          query: 'laptop',
          resultsCount: 10,
          timestamp: new Date(),
          clickTrackings: [],
        },
        {
          id: 'search-2',
          sessionId: 'session-123',
          query: 'phone',
          resultsCount: 5,
          timestamp: new Date(),
          clickTrackings: [],
        },
      ];

      mockSearchAnalyticsService.getSearchBySession.mockResolvedValue(sessionSearches);

      const response = await request(app)
        .get('/session?sessionId=session-123');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        data: sessionSearches,
      });

      expect(mockSearchAnalyticsService.getSearchBySession).toHaveBeenCalledWith('session-123');
    });

    it('should return empty array for session with no searches', async () => {
      mockSearchAnalyticsService.getSearchBySession.mockResolvedValue([]);

      const response = await request(app)
        .get('/session?sessionId=session-999');

      expect(response.status).toBe(200);
      expect(response.body.data).toEqual([]);
    });

    it('should reject request with missing session ID', async () => {
      const response = await request(app)
        .get('/session');

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Validation failed');
    });

    it('should handle service errors', async () => {
      mockSearchAnalyticsService.getSearchBySession.mockRejectedValue(new Error('Service error'));

      const response = await request(app)
        .get('/session?sessionId=session-123');

      expect(response.status).toBe(500);
    });
  });
});
