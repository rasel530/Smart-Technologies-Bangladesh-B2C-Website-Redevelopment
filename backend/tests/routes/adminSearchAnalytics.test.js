/**
 * Admin Search Analytics API Routes Tests
 * 
 * Comprehensive integration tests for admin search analytics API endpoints covering:
 * - GET /analytics/overview - Get analytics overview
 * - GET /analytics/metrics - Get detailed analytics metrics
 * - GET /analytics/queries - Get search queries
 * - GET /analytics/queries/:id - Get query details
 * - GET /analytics/zero-results - Get zero-result queries
 * - GET /analytics/conversions - Get conversion data
 * - GET /analytics/export - Export analytics data
 * - GET /performance/overview - Get performance overview
 * - GET /performance/metrics - Get performance metrics
 * - GET /performance/alerts - Get performance alerts
 * - GET /performance/comparison - Get performance comparison
 * - POST /performance/threshold - Update performance threshold
 * - GET /optimization/patterns - Get query patterns
 * - GET /optimization/experiments - Get experiments
 * - GET /optimization/experiments/:id - Get experiment details
 * - POST /optimization/experiments - Create experiment
 * - PUT /optimization/experiments/:id/status - Update experiment status
 * - DELETE /optimization/experiments/:id - Delete experiment
 * - GET /optimization/insights - Get optimization insights
 * - GET /personalization/overview - Get personalization overview
 * - GET /personalization/users - Get user preferences list
 * - GET /personalization/users/:id - Get user preferences detail
 * - PUT /personalization/users/:id - Update user preferences
 * - GET /personalization/metrics - Get personalization metrics
 * - GET /personalization/recommendations - Get recommendation statistics
 * - PUT /personalization/config - Update personalization configuration
 * - GET /trending/overview - Get trending overview
 * - GET /trending/searches - Get trending searches
 * - GET /trending/products - Get trending products
 * - POST /trending/calculate - Calculate trends
 * - PUT /trending/threshold - Update trend threshold
 * - PUT /trending/decay - Update trend decay
 * - DELETE /trending/old - Clear old trends
 */

const request = require('supertest');
const express = require('express');
const { router, initializeAdminSearchAnalyticsController } = require('../../routes/admin/searchAnalytics');
const { AdminSearchAnalyticsService } = require('../../services/adminSearchAnalytics.service');

// Mock authentication middleware
jest.mock('../../middleware/auth', () => ({
  authMiddleware: {
    authenticate: () => (req, res, next) => {
      req.user = { id: 'test-admin-id', role: 'admin' };
      next();
    },
    adminOnly: () => (req, res, next) => {
      if (req.user && req.user.role === 'admin') {
        next();
      } else {
        return res.status(403).json({ error: 'Insufficient permissions' });
      }
    }
  }
}));

// Mock services
jest.mock('../../services/adminSearchAnalytics.service', () => ({
  AdminSearchAnalyticsService: jest.fn().mockImplementation(() => ({
    // Analytics methods
    getAnalyticsOverview: jest.fn(),
    getAnalyticsMetrics: jest.fn(),
    getSearchQueries: jest.fn(),
    getQueryDetails: jest.fn(),
    getZeroResultQueries: jest.fn(),
    getConversionData: jest.fn(),
    exportAnalyticsData: jest.fn(),
    // Performance methods
    getPerformanceOverview: jest.fn(),
    getPerformanceMetrics: jest.fn(),
    getPerformanceAlerts: jest.fn(),
    updateAlertStatus: jest.fn(),
    getPerformanceComparison: jest.fn(),
    updatePerformanceThreshold: jest.fn(),
    // Optimization methods
    getQueryPatterns: jest.fn(),
    getExperiments: jest.fn(),
    getExperimentDetails: jest.fn(),
    createExperiment: jest.fn(),
    updateExperimentStatus: jest.fn(),
    deleteExperiment: jest.fn(),
    getOptimizationInsights: jest.fn(),
    // Personalization methods
    getPersonalizationOverview: jest.fn(),
    getUserPreferencesList: jest.fn(),
    getUserPreferencesDetail: jest.fn(),
    updateUserPreferencesAdmin: jest.fn(),
    getPersonalizationMetrics: jest.fn(),
    getRecommendationStats: jest.fn(),
    updatePersonalizationConfig: jest.fn(),
    // Trending methods
    getTrendingOverview: jest.fn(),
    getTrendingSearches: jest.fn(),
    getTrendingProducts: jest.fn(),
    calculateTrends: jest.fn(),
    updateTrendThreshold: jest.fn(),
    updateTrendDecay: jest.fn(),
    clearOldTrends: jest.fn()
  }))
}));

jest.mock('../../services/logger');

describe('Admin Search Analytics API Routes', () => {
  let app;
  let mockAdminSearchAnalyticsService;

  beforeEach(() => {
    // Create Express app
    app = express();
    app.use(express.json());
    app.use('/', router);

    // Mock service
    mockAdminSearchAnalyticsService = new AdminSearchAnalyticsService();

    initializeAdminSearchAnalyticsController({
      adminSearchAnalyticsService: mockAdminSearchAnalyticsService
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // ============================================================================
  // ANALYTICS ENDPOINTS
  // ============================================================================

  describe('GET /analytics/overview', () => {
    it('should return analytics overview', async () => {
      const overview = {
        totalSearches: 10000,
        avgResponseTime: '150.00',
        conversionRate: '5.50',
        zeroResults: 250,
        clickThroughRate: '12.30',
        uniqueQueries: 5000,
        resultsRate: '97.50',
        medianResponseTime: '145.00',
        timeSeries: [
          { date: '2024-01-01', count: 500 },
          { date: '2024-01-02', count: 600 }
        ],
        period: {
          startDate: '2024-01-01T00:00:00.000Z',
          endDate: '2024-01-08T00:00:00.000Z'
        }
      };

      mockAdminSearchAnalyticsService.getAnalyticsOverview.mockResolvedValue(overview);

      const response = await request(app)
        .get('/analytics/overview')
        .set('Authorization', 'Bearer admin-token');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        data: overview
      });

      expect(mockAdminSearchAnalyticsService.getAnalyticsOverview).toHaveBeenCalledWith('week');
    });

    it('should respect time range parameter', async () => {
      const overview = {
        totalSearches: 1000,
        avgResponseTime: '150.00',
        conversionRate: '5.00',
        zeroResults: 25,
        clickThroughRate: '10.00',
        uniqueQueries: 500,
        resultsRate: '97.50',
        medianResponseTime: '145.00',
        timeSeries: [],
        period: {
          startDate: '2024-01-01T00:00:00.000Z',
          endDate: '2024-01-02T00:00:00.000Z'
        }
      };

      mockAdminSearchAnalyticsService.getAnalyticsOverview.mockResolvedValue(overview);

      const response = await request(app)
        .get('/analytics/overview?timeRange=month')
        .set('Authorization', 'Bearer admin-token');

      expect(response.status).toBe(200);
      expect(mockAdminSearchAnalyticsService.getAnalyticsOverview).toHaveBeenCalledWith('month');
    });

    it('should handle service errors', async () => {
      mockAdminSearchAnalyticsService.getAnalyticsOverview.mockRejectedValue(new Error('Service error'));

      const response = await request(app)
        .get('/analytics/overview')
        .set('Authorization', 'Bearer admin-token');

      expect(response.status).toBe(500);
    });
  });

  describe('GET /analytics/metrics', () => {
    it('should return detailed analytics metrics', async () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-31');

      const metrics = {
        totalSearches: 5000,
        uniqueQueries: 2500,
        searchesWithResults: 4750,
        searchesWithoutResults: 250,
        resultsRate: '95.00',
        avgResponseTime: '150.00',
        medianResponseTime: '145.00',
        p95ResponseTime: '300.00',
        p99ResponseTime: '500.00',
        conversions: 250,
        conversionRate: '5.00',
        clicks: 500,
        clickThroughRate: '10.00',
        period: {
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString()
        }
      };

      mockAdminSearchAnalyticsService.getAnalyticsMetrics.mockResolvedValue(metrics);

      const response = await request(app)
        .get(`/analytics/metrics?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`)
        .set('Authorization', 'Bearer admin-token');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        data: metrics
      });

      expect(mockAdminSearchAnalyticsService.getAnalyticsMetrics).toHaveBeenCalledWith(
        expect.any(Date),
        expect.any(Date)
      );
    });

    it('should reject request with invalid date format', async () => {
      const response = await request(app)
        .get('/analytics/metrics?startDate=invalid-date&endDate=2024-01-31')
        .set('Authorization', 'Bearer admin-token');

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Validation failed');
    });

    it('should handle service errors', async () => {
      mockAdminSearchAnalyticsService.getAnalyticsMetrics.mockRejectedValue(new Error('Service error'));

      const response = await request(app)
        .get('/analytics/metrics?startDate=2024-01-01&endDate=2024-01-31')
        .set('Authorization', 'Bearer admin-token');

      expect(response.status).toBe(500);
    });
  });

  describe('GET /analytics/queries', () => {
    it('should return search queries', async () => {
      const queries = {
        queries: [
          { query: 'laptop', count: 500, avgResults: 20, avgResponseTime: '150.00', lastSearchedAt: '2024-01-15T10:00:00.000Z' },
          { query: 'phone', count: 400, avgResults: 15, avgResponseTime: '140.00', lastSearchedAt: '2024-01-15T09:00:00.000Z' }
        ],
        pagination: {
          page: 1,
          limit: 20,
          total: 2,
          pages: 1
        }
      };

      mockAdminSearchAnalyticsService.getSearchQueries.mockResolvedValue(queries);

      const response = await request(app)
        .get('/analytics/queries?page=1&limit=20')
        .set('Authorization', 'Bearer admin-token');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        data: queries
      });

      expect(mockAdminSearchAnalyticsService.getSearchQueries).toHaveBeenCalledWith(
        {},
        { page: 1, limit: 20, sortBy: 'count', sortOrder: 'desc' }
      );
    });

    it('should handle service errors', async () => {
      mockAdminSearchAnalyticsService.getSearchQueries.mockRejectedValue(new Error('Service error'));

      const response = await request(app)
        .get('/analytics/queries')
        .set('Authorization', 'Bearer admin-token');

      expect(response.status).toBe(500);
    });
  });

  describe('GET /analytics/queries/:id', () => {
    it('should return query details', async () => {
      const details = {
        query: 'laptop',
        frequency: 500,
        avgResults: 20,
        avgResponseTime: '150.00',
        clickThroughRate: '12.00',
        conversionRate: '5.00',
        uniqueUsers: 300,
        clicksByPosition: { 0: 100, 1: 80, 2: 60 },
        timeTrends: [
          { date: '2024-01-15', count: 50 },
          { date: '2024-01-14', count: 45 }
        ],
        relatedQueries: [
          { query: 'laptop case', count: 20 },
          { query: 'laptop charger', count: 15 }
        ],
        recentSearches: []
      };

      mockAdminSearchAnalyticsService.getQueryDetails.mockResolvedValue(details);

      const response = await request(app)
        .get('/analytics/queries/laptop')
        .set('Authorization', 'Bearer admin-token');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        data: details
      });

      expect(mockAdminSearchAnalyticsService.getQueryDetails).toHaveBeenCalledWith('laptop');
    });

    it('should handle service errors', async () => {
      mockAdminSearchAnalyticsService.getQueryDetails.mockRejectedValue(new Error('Service error'));

      const response = await request(app)
        .get('/analytics/queries/laptop')
        .set('Authorization', 'Bearer admin-token');

      expect(response.status).toBe(500);
    });
  });

  describe('GET /analytics/zero-results', () => {
    it('should return zero-result queries', async () => {
      const queries = [
        { query: 'nonexistent-product', count: 10, lastSearched: '2024-01-15T10:00:00.000Z' },
        { query: 'missing-item', count: 8, lastSearched: '2024-01-15T09:00:00.000Z' }
      ];

      mockAdminSearchAnalyticsService.getZeroResultQueries.mockResolvedValue(queries);

      const response = await request(app)
        .get('/analytics/zero-results?limit=10')
        .set('Authorization', 'Bearer admin-token');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        data: queries
      });

      expect(mockAdminSearchAnalyticsService.getZeroResultQueries).toHaveBeenCalledWith(10);
    });

    it('should handle service errors', async () => {
      mockAdminSearchAnalyticsService.getZeroResultQueries.mockRejectedValue(new Error('Service error'));

      const response = await request(app)
        .get('/analytics/zero-results')
        .set('Authorization', 'Bearer admin-token');

      expect(response.status).toBe(500);
    });
  });

  describe('GET /analytics/conversions', () => {
    it('should return conversion data', async () => {
      const data = {
        totalSearches: 5000,
        conversions: 250,
        conversionRate: '5.00',
        conversionByType: {
          click: 150,
          add_to_cart: 75,
          purchase: 25
        },
        funnel: {
          searches: 5000,
          searchesWithResults: 4750,
          clicks: 500,
          conversions: 250
        },
        period: {
          startDate: '2024-01-01T00:00:00.000Z',
          endDate: '2024-01-08T00:00:00.000Z'
        }
      };

      mockAdminSearchAnalyticsService.getConversionData.mockResolvedValue(data);

      const response = await request(app)
        .get('/analytics/conversions?timeRange=week')
        .set('Authorization', 'Bearer admin-token');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        data: data
      });

      expect(mockAdminSearchAnalyticsService.getConversionData).toHaveBeenCalledWith('week');
    });

    it('should handle service errors', async () => {
      mockAdminSearchAnalyticsService.getConversionData.mockRejectedValue(new Error('Service error'));

      const response = await request(app)
        .get('/analytics/conversions')
        .set('Authorization', 'Bearer admin-token');

      expect(response.status).toBe(500);
    });
  });

  describe('GET /analytics/export', () => {
    it('should export analytics data successfully', async () => {
      const exportData = {
        format: 'csv',
        data: [
          { timestamp: '2024-01-15T10:00:00.000Z', query: 'laptop', resultsCount: 10, responseTime: 150, userId: 'user-1', sessionId: 'session-1', conversionType: 'click', productId: 'prod-1', deviceType: 'desktop' }
        ],
        count: 1,
        exportedAt: '2024-01-15T10:00:00.000Z'
      };

      mockAdminSearchAnalyticsService.exportAnalyticsData.mockResolvedValue(exportData);

      const response = await request(app)
        .get('/analytics/export?format=csv&startDate=2024-01-01&endDate=2024-01-31')
        .set('Authorization', 'Bearer admin-token');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        data: exportData
      });

      expect(mockAdminSearchAnalyticsService.exportAnalyticsData).toHaveBeenCalledWith(
        'csv',
        { startDate: '2024-01-01', endDate: '2024-01-31' }
      );
    });

    it('should reject request with invalid format', async () => {
      const response = await request(app)
        .get('/analytics/export?format=invalid')
        .set('Authorization', 'Bearer admin-token');

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Validation failed');
    });

    it('should handle service errors', async () => {
      mockAdminSearchAnalyticsService.exportAnalyticsData.mockRejectedValue(new Error('Service error'));

      const response = await request(app)
        .get('/analytics/export?format=csv')
        .set('Authorization', 'Bearer admin-token');

      expect(response.status).toBe(500);
    });
  });

  // ============================================================================
  // PERFORMANCE ENDPOINTS
  // ============================================================================

  describe('GET /performance/overview', () => {
    it('should return performance overview', async () => {
      const overview = {
        totalSearches: 10000,
        avgResponseTime: '150.00',
        medianResponseTime: '145.00',
        p95ResponseTime: '300.00',
        p99ResponseTime: '500.00',
        cacheHitRate: '75.50',
        zeroResultQueries: 250,
        zeroResultRate: '2.50',
        period: {
          startDate: '2024-01-01T00:00:00.000Z',
          endDate: '2024-01-08T00:00:00.000Z'
        }
      };

      mockAdminSearchAnalyticsService.getPerformanceOverview.mockResolvedValue(overview);

      const response = await request(app)
        .get('/performance/overview')
        .set('Authorization', 'Bearer admin-token');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        data: overview
      });

      expect(mockAdminSearchAnalyticsService.getPerformanceOverview).toHaveBeenCalledWith('week');
    });

    it('should handle service errors', async () => {
      mockAdminSearchAnalyticsService.getPerformanceOverview.mockRejectedValue(new Error('Service error'));

      const response = await request(app)
        .get('/performance/overview')
        .set('Authorization', 'Bearer admin-token');

      expect(response.status).toBe(500);
    });
  });

  describe('GET /performance/metrics', () => {
    it('should return performance metrics', async () => {
      const metrics = {
        totalSearches: 10000,
        avgResponseTime: '150.00',
        medianResponseTime: '145.00',
        p95ResponseTime: '300.00',
        p99ResponseTime: '500.00',
        maxResponseTime: '1000',
        minResponseTime: '50',
        avgResultsCount: '15.00',
        zeroResultQueries: 250,
        zeroResultRate: '2.50',
        slowQueries: 100,
        fastQueries: 8000,
        slowQueryRate: '1.00',
        fastQueryRate: '80.00',
        period: {
          startDate: '2024-01-01T00:00:00.000Z',
          endDate: '2024-01-08T00:00:00.000Z'
        }
      };

      mockAdminSearchAnalyticsService.getPerformanceMetrics.mockResolvedValue(metrics);

      const response = await request(app)
        .get('/performance/metrics')
        .set('Authorization', 'Bearer admin-token');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        data: metrics
      });

      expect(mockAdminSearchAnalyticsService.getPerformanceMetrics).toHaveBeenCalledWith('week');
    });

    it('should handle service errors', async () => {
      mockAdminSearchAnalyticsService.getPerformanceMetrics.mockRejectedValue(new Error('Service error'));

      const response = await request(app)
        .get('/performance/metrics')
        .set('Authorization', 'Bearer admin-token');

      expect(response.status).toBe(500);
    });
  });

  describe('GET /performance/alerts', () => {
    it('should return performance alerts', async () => {
      const alerts = [
        {
          id: 'alert_slow_queries_1234567890',
          type: 'slow_query',
          severity: 'high',
          message: '10 slow queries detected (>1000ms)',
          metric: 'responseTime',
          value: 1500,
          threshold: 1000,
          timestamp: new Date(),
          resolved: false
        }
      ];

      mockAdminSearchAnalyticsService.getPerformanceAlerts.mockResolvedValue(alerts);

      const response = await request(app)
        .get('/performance/alerts?slowQueryThreshold=1000')
        .set('Authorization', 'Bearer admin-token');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        data: alerts
      });

      expect(mockAdminSearchAnalyticsService.getPerformanceAlerts).toHaveBeenCalledWith({
        slowQueryThreshold: 1000,
        highZeroResultsThreshold: 10,
        lowCacheHitThreshold: 50
      });
    });

    it('should handle service errors', async () => {
      mockAdminSearchAnalyticsService.getPerformanceAlerts.mockRejectedValue(new Error('Service error'));

      const response = await request(app)
        .get('/performance/alerts')
        .set('Authorization', 'Bearer admin-token');

      expect(response.status).toBe(500);
    });
  });

  describe('PUT /performance/alerts/:id', () => {
    it('should update alert status', async () => {
      const result = { success: true };

      mockAdminSearchAnalyticsService.updateAlertStatus.mockResolvedValue(result);

      const response = await request(app)
        .put('/performance/alerts/alert-1')
        .set('Authorization', 'Bearer admin-token')
        .send({ status: 'acknowledged' });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        data: result
      });

      expect(mockAdminSearchAnalyticsService.updateAlertStatus).toHaveBeenCalledWith('alert-1', 'acknowledged');
    });

    it('should reject request with invalid status', async () => {
      const response = await request(app)
        .put('/performance/alerts/alert-1')
        .set('Authorization', 'Bearer admin-token')
        .send({ status: 'invalid' });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Validation failed');
    });

    it('should handle service errors', async () => {
      mockAdminSearchAnalyticsService.updateAlertStatus.mockRejectedValue(new Error('Service error'));

      const response = await request(app)
        .put('/performance/alerts/alert-1')
        .set('Authorization', 'Bearer admin-token')
        .send({ status: 'acknowledged' });

      expect(response.status).toBe(500);
    });
  });

  describe('GET /performance/comparison', () => {
    it('should return performance comparison', async () => {
      const comparison = {
        currentPeriod: {
          avgResponseTime: '150.00',
          p95ResponseTime: '300.00',
          cacheHitRate: '75.50',
          zeroResultRate: '2.50'
        },
        previousPeriod: {
          avgResponseTime: '160.00',
          p95ResponseTime: '320.00',
          cacheHitRate: '73.00',
          zeroResultRate: '3.00'
        },
        change: {
          avgResponseTime: '-6.25',
          p95ResponseTime: '-6.25',
          cacheHitRate: '0.00',
          zeroResultRate: '-16.67'
        }
      };

      mockAdminSearchAnalyticsService.getPerformanceComparison.mockResolvedValue(comparison);

      const response = await request(app)
        .get('/performance/comparison?period1=week&period2=month')
        .set('Authorization', 'Bearer admin-token');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        data: comparison
      });

      expect(mockAdminSearchAnalyticsService.getPerformanceComparison).toHaveBeenCalledWith('week', 'month');
    });

    it('should reject request with invalid periods', async () => {
      const response = await request(app)
        .get('/performance/comparison?period1=invalid&period2=month')
        .set('Authorization', 'Bearer admin-token');

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Validation failed');
    });

    it('should handle service errors', async () => {
      mockAdminSearchAnalyticsService.getPerformanceComparison.mockRejectedValue(new Error('Service error'));

      const response = await request(app)
        .get('/performance/comparison?period1=week&period2=month')
        .set('Authorization', 'Bearer admin-token');

      expect(response.status).toBe(500);
    });
  });

  describe('POST /performance/threshold', () => {
    it('should update performance threshold', async () => {
      const result = { success: true, thresholds: { slowQueryThreshold: 1000, highZeroResultsThreshold: 10, lowCacheHitThreshold: 50 } };

      mockAdminSearchAnalyticsService.updatePerformanceThreshold.mockResolvedValue(result);

      const response = await request(app)
        .post('/performance/threshold')
        .set('Authorization', 'Bearer admin-token')
        .send({ slowQueryThreshold: 1000, highZeroResultsThreshold: 10, lowCacheHitThreshold: 50 });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        data: result
      });

      expect(mockAdminSearchAnalyticsService.updatePerformanceThreshold).toHaveBeenCalledWith({
        slowQueryThreshold: 1000,
        highZeroResultsThreshold: 10,
        lowCacheHitThreshold: 50
      });
    });

    it('should handle service errors', async () => {
      mockAdminSearchAnalyticsService.updatePerformanceThreshold.mockRejectedValue(new Error('Service error'));

      const response = await request(app)
        .post('/performance/threshold')
        .set('Authorization', 'Bearer admin-token')
        .send({ slowQueryThreshold: 1000 });

      expect(response.status).toBe(500);
    });
  });

  // ============================================================================
  // OPTIMIZATION ENDPOINTS
  // ============================================================================

  describe('GET /optimization/patterns', () => {
    it('should return query patterns', async () => {
      const patterns = {
        commonPatterns: [
          { pattern: 'laptop', count: 500, percentage: '10.00', avgResults: 20 },
          { pattern: 'phone', count: 400, percentage: '8.00', avgResults: 15 }
        ],
        zeroResultQueries: [
          { query: 'nonexistent', count: 10, lastSearched: '2024-01-15T10:00:00.000Z' }
        ],
        queryLengthDistribution: [
          { lengthRange: '10-19', count: 2000, percentage: '40.00' }
        ],
        filterUsage: [
          { filterName: 'category', count: 1000, percentage: '20.00', avgResults: 15 }
        ],
        sortByUsage: [
          { sortBy: 'relevance', count: 2000, percentage: '40.00', sortOrder: 'desc' }
        ]
      };

      mockAdminSearchAnalyticsService.getQueryPatterns.mockResolvedValue(patterns);

      const response = await request(app)
        .get('/optimization/patterns?timeRange=week')
        .set('Authorization', 'Bearer admin-token');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        data: patterns
      });

      expect(mockAdminSearchAnalyticsService.getQueryPatterns).toHaveBeenCalledWith('week');
    });

    it('should handle service errors', async () => {
      mockAdminSearchAnalyticsService.getQueryPatterns.mockRejectedValue(new Error('Service error'));

      const response = await request(app)
        .get('/optimization/patterns')
        .set('Authorization', 'Bearer admin-token');

      expect(response.status).toBe(500);
    });
  });

  describe('GET /optimization/experiments', () => {
    it('should return experiments', async () => {
      const experiments = [
        {
          id: 'exp-1',
          name: 'Test ML-based ranking',
          description: 'Test description',
          algorithmVariant: 'ml_based',
          startDate: new Date('2024-01-01'),
          endDate: null,
          isActive: true,
          sampleSize: 1000,
          controlGroupSize: 500,
          variantGroupSize: 500
        }
      ];

      mockAdminSearchAnalyticsService.getExperiments.mockResolvedValue(experiments);

      const response = await request(app)
        .get('/optimization/experiments?status=active')
        .set('Authorization', 'Bearer admin-token');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        data: experiments
      });

      expect(mockAdminSearchAnalyticsService.getExperiments).toHaveBeenCalledWith({
        status: 'active',
        sortBy: 'startDate',
        sortOrder: 'desc'
      });
    });

    it('should handle service errors', async () => {
      mockAdminSearchAnalyticsService.getExperiments.mockRejectedValue(new Error('Service error'));

      const response = await request(app)
        .get('/optimization/experiments')
        .set('Authorization', 'Bearer admin-token');

      expect(response.status).toBe(500);
    });
  });

  describe('GET /optimization/experiments/:id', () => {
    it('should return experiment details', async () => {
      const details = {
        id: 'exp-1',
        name: 'Test ML-based ranking',
        description: 'Test description',
        algorithmVariant: 'ml_based',
        startDate: new Date('2024-01-01'),
        endDate: null,
        isActive: true,
        sampleSize: 1000,
        controlGroupSize: 500,
        variantGroupSize: 500,
        metrics: []
      };

      mockAdminSearchAnalyticsService.getExperimentDetails.mockResolvedValue(details);

      const response = await request(app)
        .get('/optimization/experiments/exp-1')
        .set('Authorization', 'Bearer admin-token');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        data: details
      });

      expect(mockAdminSearchAnalyticsService.getExperimentDetails).toHaveBeenCalledWith('exp-1');
    });

    it('should handle service errors', async () => {
      mockAdminSearchAnalyticsService.getExperimentDetails.mockRejectedValue(new Error('Service error'));

      const response = await request(app)
        .get('/optimization/experiments/exp-1')
        .set('Authorization', 'Bearer admin-token');

      expect(response.status).toBe(500);
    });
  });

  describe('POST /optimization/experiments', () => {
    it('should create experiment', async () => {
      const experiment = {
        id: 'exp-2',
        name: 'New Experiment',
        description: 'New experiment description',
        algorithmVariant: 'ml_based',
        startDate: new Date('2024-01-01'),
        endDate: null,
        isActive: true,
        sampleSize: 1000,
        controlGroupSize: 500,
        variantGroupSize: 500
      };

      mockAdminSearchAnalyticsService.createExperiment.mockResolvedValue(experiment);

      const response = await request(app)
        .post('/optimization/experiments')
        .set('Authorization', 'Bearer admin-token')
        .send({
          name: 'New Experiment',
          description: 'New experiment description',
          algorithmVariant: 'ml_based',
          startDate: '2024-01-01T00:00:00.000Z',
          sampleSize: 1000,
          controlGroupPercentage: 50
        });

      expect(response.status).toBe(201);
      expect(response.body).toEqual({
        success: true,
        data: experiment
      });

      expect(mockAdminSearchAnalyticsService.createExperiment).toHaveBeenCalledWith({
        name: 'New Experiment',
        description: 'New experiment description',
        algorithmVariant: 'ml_based',
        startDate: '2024-01-01T00:00:00.000Z',
        sampleSize: 1000,
        controlGroupPercentage: 50
      });
    });

    it('should reject request with invalid data', async () => {
      const response = await request(app)
        .post('/optimization/experiments')
        .set('Authorization', 'Bearer admin-token')
        .send({ name: '', description: '' });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Validation failed');
    });

    it('should handle service errors', async () => {
      mockAdminSearchAnalyticsService.createExperiment.mockRejectedValue(new Error('Service error'));

      const response = await request(app)
        .post('/optimization/experiments')
        .set('Authorization', 'Bearer admin-token')
        .send({
          name: 'New Experiment',
          description: 'New experiment description',
          algorithmVariant: 'ml_based',
          startDate: '2024-01-01T00:00:00.000Z',
          sampleSize: 1000
        });

      expect(response.status).toBe(500);
    });
  });

  describe('PUT /optimization/experiments/:id/status', () => {
    it('should update experiment status', async () => {
      const experiment = {
        id: 'exp-1',
        name: 'Test Experiment',
        isActive: false,
        endDate: new Date()
      };

      mockAdminSearchAnalyticsService.updateExperimentStatus.mockResolvedValue(experiment);

      const response = await request(app)
        .put('/optimization/experiments/exp-1/status')
        .set('Authorization', 'Bearer admin-token')
        .send({ status: 'completed' });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        data: experiment
      });

      expect(mockAdminSearchAnalyticsService.updateExperimentStatus).toHaveBeenCalledWith('exp-1', 'completed');
    });

    it('should reject request with invalid status', async () => {
      const response = await request(app)
        .put('/optimization/experiments/exp-1/status')
        .set('Authorization', 'Bearer admin-token')
        .send({ status: 'invalid' });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Validation failed');
    });

    it('should handle service errors', async () => {
      mockAdminSearchAnalyticsService.updateExperimentStatus.mockRejectedValue(new Error('Service error'));

      const response = await request(app)
        .put('/optimization/experiments/exp-1/status')
        .set('Authorization', 'Bearer admin-token')
        .send({ status: 'completed' });

      expect(response.status).toBe(500);
    });
  });

  describe('DELETE /optimization/experiments/:id', () => {
    it('should delete experiment', async () => {
      mockAdminSearchAnalyticsService.deleteExperiment.mockResolvedValue(undefined);

      const response = await request(app)
        .delete('/optimization/experiments/exp-1')
        .set('Authorization', 'Bearer admin-token');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        message: 'Experiment deleted successfully'
      });

      expect(mockAdminSearchAnalyticsService.deleteExperiment).toHaveBeenCalledWith('exp-1');
    });

    it('should handle service errors', async () => {
      mockAdminSearchAnalyticsService.deleteExperiment.mockRejectedValue(new Error('Service error'));

      const response = await request(app)
        .delete('/optimization/experiments/exp-1')
        .set('Authorization', 'Bearer admin-token');

      expect(response.status).toBe(500);
    });
  });

  describe('GET /optimization/insights', () => {
    it('should return optimization insights', async () => {
      const insights = [
        {
          type: 'query',
          priority: 'high',
          title: 'High Zero-Result Queries',
          description: 'Query "test" has 25 zero-result searches. Consider adding synonyms or related products.',
          impact: 'High',
          effort: 'Medium',
          status: 'pending'
        }
      ];

      mockAdminSearchAnalyticsService.getOptimizationInsights.mockResolvedValue(insights);

      const response = await request(app)
        .get('/optimization/insights')
        .set('Authorization', 'Bearer admin-token');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        data: insights
      });

      expect(mockAdminSearchAnalyticsService.getOptimizationInsights).toHaveBeenCalled();
    });

    it('should handle service errors', async () => {
      mockAdminSearchAnalyticsService.getOptimizationInsights.mockRejectedValue(new Error('Service error'));

      const response = await request(app)
        .get('/optimization/insights')
        .set('Authorization', 'Bearer admin-token');

      expect(response.status).toBe(500);
    });
  });

  // ============================================================================
  // PERSONALIZATION ENDPOINTS
  // ============================================================================

  describe('GET /personalization/overview', () => {
    it('should return personalization overview', async () => {
      const overview = {
        totalUsers: 1000,
        usersWithPreferences: 500,
        personalizationEnabled: true,
        recommendationEngineStatus: 'active',
        lastUpdated: '2024-01-15T10:00:00.000Z'
      };

      mockAdminSearchAnalyticsService.getPersonalizationOverview.mockResolvedValue(overview);

      const response = await request(app)
        .get('/personalization/overview')
        .set('Authorization', 'Bearer admin-token');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        data: overview
      });

      expect(mockAdminSearchAnalyticsService.getPersonalizationOverview).toHaveBeenCalled();
    });

    it('should handle service errors', async () => {
      mockAdminSearchAnalyticsService.getPersonalizationOverview.mockRejectedValue(new Error('Service error'));

      const response = await request(app)
        .get('/personalization/overview')
        .set('Authorization', 'Bearer admin-token');

      expect(response.status).toBe(500);
    });
  });

  describe('GET /personalization/users', () => {
    it('should return user preferences list', async () => {
      const result = {
        preferences: [
          {
            id: 'pref-1',
            userId: 'user-1',
            user: {
              id: 'user-1',
              email: 'user1@example.com',
              firstName: 'John',
              lastName: 'Doe'
            }
          }
        ],
        pagination: {
          page: 1,
          limit: 20,
          total: 1,
          pages: 1
        }
      };

      mockAdminSearchAnalyticsService.getUserPreferencesList.mockResolvedValue(result);

      const response = await request(app)
        .get('/personalization/users?page=1&limit=20')
        .set('Authorization', 'Bearer admin-token');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        data: result
      });

      expect(mockAdminSearchAnalyticsService.getUserPreferencesList).toHaveBeenCalledWith({}, { page: 1, limit: 20 });
    });

    it('should handle service errors', async () => {
      mockAdminSearchAnalyticsService.getUserPreferencesList.mockRejectedValue(new Error('Service error'));

      const response = await request(app)
        .get('/personalization/users')
        .set('Authorization', 'Bearer admin-token');

      expect(response.status).toBe(500);
    });
  });

  describe('GET /personalization/users/:id', () => {
    it('should return user preferences detail', async () => {
      const detail = {
        id: 'pref-1',
        userId: 'user-1',
        user: {
          id: 'user-1',
          email: 'user1@example.com',
          firstName: 'John',
          lastName: 'Doe'
        },
        searchHistory: [],
        clicks: []
      };

      mockAdminSearchAnalyticsService.getUserPreferencesDetail.mockResolvedValue(detail);

      const response = await request(app)
        .get('/personalization/users/user-1')
        .set('Authorization', 'Bearer admin-token');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        data: detail
      });

      expect(mockAdminSearchAnalyticsService.getUserPreferencesDetail).toHaveBeenCalledWith('user-1');
    });

    it('should handle service errors', async () => {
      mockAdminSearchAnalyticsService.getUserPreferencesDetail.mockRejectedValue(new Error('Service error'));

      const response = await request(app)
        .get('/personalization/users/user-1')
        .set('Authorization', 'Bearer admin-token');

      expect(response.status).toBe(500);
    });
  });

  describe('PUT /personalization/users/:id', () => {
    it('should update user preferences', async () => {
      const updated = {
        id: 'pref-1',
        userId: 'user-1',
        preferredCategories: ['Electronics']
      };

      mockAdminSearchAnalyticsService.updateUserPreferencesAdmin.mockResolvedValue(updated);

      const response = await request(app)
        .put('/personalization/users/user-1')
        .set('Authorization', 'Bearer admin-token')
        .send({ preferredCategories: ['Electronics'] });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        data: updated
      });

      expect(mockAdminSearchAnalyticsService.updateUserPreferencesAdmin).toHaveBeenCalledWith('user-1', {
        preferredCategories: ['Electronics']
      });
    });

    it('should handle service errors', async () => {
      mockAdminSearchAnalyticsService.updateUserPreferencesAdmin.mockRejectedValue(new Error('Service error'));

      const response = await request(app)
        .put('/personalization/users/user-1')
        .set('Authorization', 'Bearer admin-token')
        .send({ preferredCategories: ['Electronics'] });

      expect(response.status).toBe(500);
    });
  });

  describe('GET /personalization/metrics', () => {
    it('should return personalization metrics', async () => {
      const metrics = {
        totalSearches: 5000,
        personalizedSearches: 2500,
        personalizedRate: '50.00',
        personalizedClickRate: '15.00',
        nonPersonalizedClickRate: '10.00',
        personalizedConversionRate: '5.00',
        nonPersonalizedConversionRate: '3.00',
        improvement: {
          clickRate: '5.00',
          conversionRate: '2.00'
        },
        period: {
          startDate: '2024-01-01T00:00:00.000Z',
          endDate: '2024-01-08T00:00:00.000Z'
        }
      };

      mockAdminSearchAnalyticsService.getPersonalizationMetrics.mockResolvedValue(metrics);

      const response = await request(app)
        .get('/personalization/metrics?timeRange=week')
        .set('Authorization', 'Bearer admin-token');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        data: metrics
      });

      expect(mockAdminSearchAnalyticsService.getPersonalizationMetrics).toHaveBeenCalledWith('week');
    });

    it('should handle service errors', async () => {
      mockAdminSearchAnalyticsService.getPersonalizationMetrics.mockRejectedValue(new Error('Service error'));

      const response = await request(app)
        .get('/personalization/metrics')
        .set('Authorization', 'Bearer admin-token');

      expect(response.status).toBe(500);
    });
  });

  describe('GET /personalization/recommendations', () => {
    it('should return recommendation statistics', async () => {
      const stats = {
        totalRecommendations: 1250,
        clickThroughRate: '12.50',
        conversionRate: '3.20',
        avgPosition: 2.3,
        topCategories: [
          { category: 'Laptops', count: 450, percentage: '36.00' },
          { category: 'Smartphones', count: 380, percentage: '30.40' }
        ],
        period: {
          startDate: '2024-01-01T00:00:00.000Z',
          endDate: '2024-01-08T00:00:00.000Z'
        }
      };

      mockAdminSearchAnalyticsService.getRecommendationStats.mockResolvedValue(stats);

      const response = await request(app)
        .get('/personalization/recommendations?timeRange=week')
        .set('Authorization', 'Bearer admin-token');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        data: stats
      });

      expect(mockAdminSearchAnalyticsService.getRecommendationStats).toHaveBeenCalledWith('week');
    });

    it('should handle service errors', async () => {
      mockAdminSearchAnalyticsService.getRecommendationStats.mockRejectedValue(new Error('Service error'));

      const response = await request(app)
        .get('/personalization/recommendations')
        .set('Authorization', 'Bearer admin-token');

      expect(response.status).toBe(500);
    });
  });

  describe('PUT /personalization/config', () => {
    it('should update personalization configuration', async () => {
      const result = { success: true, config: { enabled: true } };

      mockAdminSearchAnalyticsService.updatePersonalizationConfig.mockResolvedValue(result);

      const response = await request(app)
        .put('/personalization/config')
        .set('Authorization', 'Bearer admin-token')
        .send({ enabled: true });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        data: result
      });

      expect(mockAdminSearchAnalyticsService.updatePersonalizationConfig).toHaveBeenCalledWith({ enabled: true });
    });

    it('should handle service errors', async () => {
      mockAdminSearchAnalyticsService.updatePersonalizationConfig.mockRejectedValue(new Error('Service error'));

      const response = await request(app)
        .put('/personalization/config')
        .set('Authorization', 'Bearer admin-token')
        .send({ enabled: true });

      expect(response.status).toBe(500);
    });
  });

  // ============================================================================
  // TRENDING ENDPOINTS
  // ============================================================================

  describe('GET /trending/overview', () => {
    it('should return trending overview', async () => {
      const overview = {
        totalTrendingSearches: 45,
        totalTrendingProducts: 23,
        trendThreshold: 10,
        trendDecay: 0.1,
        lastCalculated: '2024-01-15T10:00:00.000Z'
      };

      mockAdminSearchAnalyticsService.getTrendingOverview.mockResolvedValue(overview);

      const response = await request(app)
        .get('/trending/overview')
        .set('Authorization', 'Bearer admin-token');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        data: overview
      });

      expect(mockAdminSearchAnalyticsService.getTrendingOverview).toHaveBeenCalled();
    });

    it('should handle service errors', async () => {
      mockAdminSearchAnalyticsService.getTrendingOverview.mockRejectedValue(new Error('Service error'));

      const response = await request(app)
        .get('/trending/overview')
        .set('Authorization', 'Bearer admin-token');

      expect(response.status).toBe(500);
    });
  });

  describe('GET /trending/searches', () => {
    it('should return trending searches', async () => {
      const searches = [
        { query: 'laptop', searchCount: 500, trendScore: 100, isTrending: true, trend: 'rising', timeRange: '24h' },
        { query: 'phone', searchCount: 400, trendScore: 95, isTrending: true, trend: 'rising', timeRange: '24h' }
      ];

      mockAdminSearchAnalyticsService.getTrendingSearches.mockResolvedValue(searches);

      const response = await request(app)
        .get('/trending/searches?limit=20&timeRange=24h')
        .set('Authorization', 'Bearer admin-token');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        data: searches
      });

      expect(mockAdminSearchAnalyticsService.getTrendingSearches).toHaveBeenCalledWith({
        limit: 20,
        timeRange: '24h'
      });
    });

    it('should handle service errors', async () => {
      mockAdminSearchAnalyticsService.getTrendingSearches.mockRejectedValue(new Error('Service error'));

      const response = await request(app)
        .get('/trending/searches')
        .set('Authorization', 'Bearer admin-token');

      expect(response.status).toBe(500);
    });
  });

  describe('GET /trending/products', () => {
    it('should return trending products', async () => {
      const products = [
        {
          productId: 'prod-1',
          productName: 'Laptop',
          category: 'Electronics',
          searchCount: 100,
          trendScore: 100,
          imageUrl: '/image1.jpg',
          price: 999.99,
          trend: 'rising'
        }
      ];

      mockAdminSearchAnalyticsService.getTrendingProducts.mockResolvedValue(products);

      const response = await request(app)
        .get('/trending/products?limit=20&timeRange=24h')
        .set('Authorization', 'Bearer admin-token');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        data: products
      });

      expect(mockAdminSearchAnalyticsService.getTrendingProducts).toHaveBeenCalledWith({
        limit: 20,
        timeRange: '24h'
      });
    });

    it('should handle service errors', async () => {
      mockAdminSearchAnalyticsService.getTrendingProducts.mockRejectedValue(new Error('Service error'));

      const response = await request(app)
        .get('/trending/products')
        .set('Authorization', 'Bearer admin-token');

      expect(response.status).toBe(500);
    });
  });

  describe('POST /trending/calculate', () => {
    it('should calculate trends', async () => {
      const result = { success: true };

      mockAdminSearchAnalyticsService.calculateTrends.mockResolvedValue(result);

      const response = await request(app)
        .post('/trending/calculate')
        .set('Authorization', 'Bearer admin-token');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        data: result
      });

      expect(mockAdminSearchAnalyticsService.calculateTrends).toHaveBeenCalled();
    });

    it('should handle service errors', async () => {
      mockAdminSearchAnalyticsService.calculateTrends.mockRejectedValue(new Error('Service error'));

      const response = await request(app)
        .post('/trending/calculate')
        .set('Authorization', 'Bearer admin-token');

      expect(response.status).toBe(500);
    });
  });

  describe('PUT /trending/threshold', () => {
    it('should update trend threshold', async () => {
      const result = { success: true, threshold: 10 };

      mockAdminSearchAnalyticsService.updateTrendThreshold.mockResolvedValue(result);

      const response = await request(app)
        .put('/trending/threshold')
        .set('Authorization', 'Bearer admin-token')
        .send({ threshold: 10 });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        data: result
      });

      expect(mockAdminSearchAnalyticsService.updateTrendThreshold).toHaveBeenCalledWith(10);
    });

    it('should reject request with invalid threshold', async () => {
      const response = await request(app)
        .put('/trending/threshold')
        .set('Authorization', 'Bearer admin-token')
        .send({ threshold: -1 });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Validation failed');
    });

    it('should handle service errors', async () => {
      mockAdminSearchAnalyticsService.updateTrendThreshold.mockRejectedValue(new Error('Service error'));

      const response = await request(app)
        .put('/trending/threshold')
        .set('Authorization', 'Bearer admin-token')
        .send({ threshold: 10 });

      expect(response.status).toBe(500);
    });
  });

  describe('PUT /trending/decay', () => {
    it('should update trend decay', async () => {
      const result = { success: true, decay: 0.1 };

      mockAdminSearchAnalyticsService.updateTrendDecay.mockResolvedValue(result);

      const response = await request(app)
        .put('/trending/decay')
        .set('Authorization', 'Bearer admin-token')
        .send({ decay: 0.1 });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        data: result
      });

      expect(mockAdminSearchAnalyticsService.updateTrendDecay).toHaveBeenCalledWith(0.1);
    });

    it('should reject request with invalid decay', async () => {
      const response = await request(app)
        .put('/trending/decay')
        .set('Authorization', 'Bearer admin-token')
        .send({ decay: 1.5 });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Validation failed');
    });

    it('should handle service errors', async () => {
      mockAdminSearchAnalyticsService.updateTrendDecay.mockRejectedValue(new Error('Service error'));

      const response = await request(app)
        .put('/trending/decay')
        .set('Authorization', 'Bearer admin-token')
        .send({ decay: 0.1 });

      expect(response.status).toBe(500);
    });
  });

  describe('DELETE /trending/old', () => {
    it('should clear old trends', async () => {
      const result = { success: true };

      mockAdminSearchAnalyticsService.clearOldTrends.mockResolvedValue(result);

      const response = await request(app)
        .delete('/trending/old?days=30')
        .set('Authorization', 'Bearer admin-token');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        data: result
      });

      expect(mockAdminSearchAnalyticsService.clearOldTrends).toHaveBeenCalledWith(30);
    });

    it('should handle service errors', async () => {
      mockAdminSearchAnalyticsService.clearOldTrends.mockRejectedValue(new Error('Service error'));

      const response = await request(app)
        .delete('/trending/old')
        .set('Authorization', 'Bearer admin-token');

      expect(response.status).toBe(500);
    });
  });
});
