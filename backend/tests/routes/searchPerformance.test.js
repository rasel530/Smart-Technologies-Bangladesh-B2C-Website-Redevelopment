/**
 * Search Performance API Routes Tests
 * 
 * Comprehensive integration tests for search performance API endpoints covering:
 * - GET / - Get performance metrics
 * - GET /alerts - Get performance alerts
 * - POST /record - Record performance metrics
 * - GET /aggregate - Aggregate performance data
 * - GET /zero-results - Get zero-result queries
 * - GET /realtime - Get real-time statistics
 * - POST /flush - Flush performance metrics
 */

const request = require('supertest');
const express = require('express');
const { router, initializeSearchPerformanceController } = require('../../routes/searchPerformance');
const { SearchPerformanceService } = require('../../services/searchPerformance.service');

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
jest.mock('../../services/searchPerformance.service', () => ({
  SearchPerformanceService: jest.fn().mockImplementation(() => ({
    getPerformanceMetrics: jest.fn(),
    getPerformanceAlerts: jest.fn(),
    recordPerformanceMetrics: jest.fn(),
    aggregatePerformanceData: jest.fn(),
    getZeroResultQueries: jest.fn(),
    getRealTimeStats: jest.fn(),
    flushMetrics: jest.fn()
  }))
}));
jest.mock('../../services/logger');

describe('Search Performance API Routes', () => {
  let app;
  let mockSearchPerformanceService;

  beforeEach(() => {
    // Create Express app
    app = express();
    app.use(express.json());
    app.use('/', router);

    // Mock service
    mockSearchPerformanceService = new SearchPerformanceService();
    initializeSearchPerformanceController({ searchPerformanceService: mockSearchPerformanceService });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /', () => {
    it('should return performance metrics', async () => {
      const performanceMetrics = {
        timeRange: 'day',
        metrics: [
          {
            id: 'metrics-1',
            queryCount: 1000,
            avgResponseTime: 150,
            p95ResponseTime: 300,
            p99ResponseTime: 500,
            cacheHitRate: 0.75,
            zeroResultQueries: 50,
            totalQueries: 1000,
            timestamp: new Date(),
          },
        ],
        summary: {
          avgResponseTime: 150,
          p95ResponseTime: 300,
          p99ResponseTime: 500,
          cacheHitRate: 0.75,
          zeroResultRate: 0.05,
          totalQueries: 1000,
        },
      };

      mockSearchPerformanceService.getPerformanceMetrics.mockResolvedValue(performanceMetrics);

      const response = await request(app)
        .get('/')
        .set('Authorization', 'Bearer admin-token');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        data: performanceMetrics,
      });

      expect(mockSearchPerformanceService.getPerformanceMetrics).toHaveBeenCalledWith('day');
    });

    it('should respect time range parameter', async () => {
      const performanceMetrics = {
        timeRange: 'week',
        metrics: [],
        summary: {
          avgResponseTime: 0,
          p95ResponseTime: 0,
          p99ResponseTime: 0,
          cacheHitRate: 0,
          zeroResultRate: 0,
          totalQueries: 0,
        },
      };

      mockSearchPerformanceService.getPerformanceMetrics.mockResolvedValue(performanceMetrics);

      const response = await request(app)
        .get('/?timeRange=week')
        .set('Authorization', 'Bearer admin-token');

      expect(mockSearchPerformanceService.getPerformanceMetrics).toHaveBeenCalledWith('week');
    });

    it('should return empty summary when no metrics', async () => {
      const performanceMetrics = {
        timeRange: 'hour',
        metrics: [],
        summary: {
          avgResponseTime: 0,
          p95ResponseTime: 0,
          p99ResponseTime: 0,
          cacheHitRate: 0,
          zeroResultRate: 0,
          totalQueries: 0,
        },
      };

      mockSearchPerformanceService.getPerformanceMetrics.mockResolvedValue(performanceMetrics);

      const response = await request(app)
        .get('/?timeRange=hour')
        .set('Authorization', 'Bearer admin-token');

      expect(response.body.data.summary.totalQueries).toBe(0);
    });

    it('should return 401 for unauthenticated request', async () => {
      const response = await request(app)
        .get('/');

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Authentication required');
    });

    it('should return 403 for non-admin user', async () => {
      const response = await request(app)
        .get('/')
        .set('Authorization', 'Bearer user-token');

      expect(response.status).toBe(403);
      expect(response.body.error).toBe('Insufficient permissions');
    });

    it('should reject request with invalid time range', async () => {
      const response = await request(app)
        .get('/?timeRange=invalid')
        .set('Authorization', 'Bearer admin-token');

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Validation failed');
    });

    it('should handle service errors', async () => {
      mockSearchPerformanceService.getPerformanceMetrics.mockRejectedValue(new Error('Service error'));

      const response = await request(app)
        .get('/')
        .set('Authorization', 'Bearer admin-token');

      expect(response.status).toBe(500);
    });
  });

  describe('GET /alerts', () => {
    it('should return performance alerts', async () => {
      const alerts = [
        {
          id: 'alert-1',
          type: 'high_response_time',
          severity: 'warning',
          message: 'Average response time 1200ms exceeds threshold 1000ms',
          value: 1200,
          threshold: 1000,
          timestamp: new Date(),
        },
        {
          id: 'alert-2',
          type: 'low_cache_hit_rate',
          severity: 'critical',
          message: 'Cache hit rate 50% below threshold 70%',
          value: 0.5,
          threshold: 0.7,
          timestamp: new Date(),
        },
      ];

      mockSearchPerformanceService.getPerformanceAlerts.mockResolvedValue(alerts);

      const response = await request(app)
        .get('/alerts')
        .set('Authorization', 'Bearer admin-token');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        data: alerts,
      });

      expect(mockSearchPerformanceService.getPerformanceAlerts).toHaveBeenCalledWith({
        maxAvgResponseTime: 1000,
        maxP95ResponseTime: 2000,
        maxP99ResponseTime: 3000,
        minCacheHitRate: 0.7,
        maxZeroResultRate: 0.1,
      });
    });

    it('should respect custom threshold parameters', async () => {
      const alerts = [];

      mockSearchPerformanceService.getPerformanceAlerts.mockResolvedValue(alerts);

      const response = await request(app)
        .get('/alerts?maxAvgResponseTime=2000&minCacheHitRate=0.5')
        .set('Authorization', 'Bearer admin-token');

      expect(mockSearchPerformanceService.getPerformanceAlerts).toHaveBeenCalledWith({
        maxAvgResponseTime: 2000,
        maxP95ResponseTime: 2000,
        maxP99ResponseTime: 3000,
        minCacheHitRate: 0.5,
        maxZeroResultRate: 0.1,
      });
    });

    it('should return empty array when no alerts', async () => {
      mockSearchPerformanceService.getPerformanceAlerts.mockResolvedValue([]);

      const response = await request(app)
        .get('/alerts')
        .set('Authorization', 'Bearer admin-token');

      expect(response.body.data).toEqual([]);
    });

    it('should return 401 for unauthenticated request', async () => {
      const response = await request(app)
        .get('/alerts');

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Authentication required');
    });

    it('should return 403 for non-admin user', async () => {
      const response = await request(app)
        .get('/alerts')
        .set('Authorization', 'Bearer user-token');

      expect(response.status).toBe(403);
      expect(response.body.error).toBe('Insufficient permissions');
    });

    it('should reject request with invalid threshold values', async () => {
      const response = await request(app)
        .get('/alerts?minCacheHitRate=1.5')
        .set('Authorization', 'Bearer admin-token');

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Validation failed');
    });

    it('should handle service errors', async () => {
      mockSearchPerformanceService.getPerformanceAlerts.mockRejectedValue(new Error('Service error'));

      const response = await request(app)
        .get('/alerts')
        .set('Authorization', 'Bearer admin-token');

      expect(response.status).toBe(500);
    });
  });

  describe('POST /record', () => {
    it('should record performance metrics successfully', async () => {
      const performanceMetrics = {
        id: 'metrics-123',
        queryCount: 1000,
        avgResponseTime: 150,
        p95ResponseTime: 300,
        p99ResponseTime: 500,
        cacheHitRate: 0.75,
        zeroResultQueries: 50,
        totalQueries: 1000,
        timestamp: new Date(),
      };

      mockSearchPerformanceService.recordPerformanceMetrics.mockResolvedValue(performanceMetrics);

      const response = await request(app)
        .post('/record')
        .set('Authorization', 'Bearer admin-token')
        .send({
          queryCount: 1000,
          avgResponseTime: 150,
          p95ResponseTime: 300,
          p99ResponseTime: 500,
          cacheHitRate: 0.75,
          zeroResultQueries: 50,
        });

      expect(response.status).toBe(201);
      expect(response.body).toEqual({
        success: true,
        data: performanceMetrics,
      });

      expect(mockSearchPerformanceService.recordPerformanceMetrics).toHaveBeenCalledWith(
        1000,
        150,
        300,
        500,
        0.75,
        50
      );
    });

    it('should handle zero cache hit rate', async () => {
      const performanceMetrics = {
        id: 'metrics-456',
        queryCount: 500,
        avgResponseTime: 200,
        p95ResponseTime: 400,
        p99ResponseTime: 600,
        cacheHitRate: 0,
        zeroResultQueries: 100,
        totalQueries: 500,
        timestamp: new Date(),
      };

      mockSearchPerformanceService.recordPerformanceMetrics.mockResolvedValue(performanceMetrics);

      const response = await request(app)
        .post('/record')
        .set('Authorization', 'Bearer admin-token')
        .send({
          queryCount: 500,
          avgResponseTime: 200,
          p95ResponseTime: 400,
          p99ResponseTime: 600,
          cacheHitRate: 0,
          zeroResultQueries: 100,
        });

      expect(response.status).toBe(201);
      expect(mockSearchPerformanceService.recordPerformanceMetrics).toHaveBeenCalledWith(
        500,
        200,
        400,
        600,
        0,
        100
      );
    });

    it('should return 401 for unauthenticated request', async () => {
      const response = await request(app)
        .post('/record')
        .send({
          queryCount: 1000,
          avgResponseTime: 150,
          p95ResponseTime: 300,
          p99ResponseTime: 500,
          cacheHitRate: 0.75,
          zeroResultQueries: 50,
        });

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Authentication required');
    });

    it('should return 403 for non-admin user', async () => {
      const response = await request(app)
        .post('/record')
        .set('Authorization', 'Bearer user-token')
        .send({
          queryCount: 1000,
          avgResponseTime: 150,
          p95ResponseTime: 300,
          p99ResponseTime: 500,
          cacheHitRate: 0.75,
          zeroResultQueries: 50,
        });

      expect(response.status).toBe(403);
      expect(response.body.error).toBe('Insufficient permissions');
    });

    it('should reject request with invalid cache hit rate', async () => {
      const response = await request(app)
        .post('/record')
        .set('Authorization', 'Bearer admin-token')
        .send({
          queryCount: 1000,
          avgResponseTime: 150,
          p95ResponseTime: 300,
          p99ResponseTime: 500,
          cacheHitRate: 1.5,
          zeroResultQueries: 50,
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Validation failed');
    });

    it('should reject request with negative query count', async () => {
      const response = await request(app)
        .post('/record')
        .set('Authorization', 'Bearer admin-token')
        .send({
          queryCount: -100,
          avgResponseTime: 150,
          p95ResponseTime: 300,
          p99ResponseTime: 500,
          cacheHitRate: 0.75,
          zeroResultQueries: 50,
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Validation failed');
    });

    it('should handle service errors', async () => {
      mockSearchPerformanceService.recordPerformanceMetrics.mockRejectedValue(new Error('Service error'));

      const response = await request(app)
        .post('/record')
        .set('Authorization', 'Bearer admin-token')
        .send({
          queryCount: 1000,
          avgResponseTime: 150,
          p95ResponseTime: 300,
          p99ResponseTime: 500,
          cacheHitRate: 0.75,
          zeroResultQueries: 50,
        });

      expect(response.status).toBe(500);
    });
  });

  describe('GET /aggregate', () => {
    it('should return aggregated performance data', async () => {
      const aggregatedData = {
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-31'),
        totalRecords: 10,
        summary: {
          totalQueries: 5000,
          avgResponseTime: 150,
          minResponseTime: 100,
          maxResponseTime: 200,
          p95ResponseTime: 180,
          p99ResponseTime: 195,
          avgCacheHitRate: 0.75,
          totalZeroResults: 250,
          zeroResultRate: 0.05,
          dataPoints: 10,
        },
        hourlyBreakdown: {},
      };

      mockSearchPerformanceService.aggregatePerformanceData.mockResolvedValue(aggregatedData);

      const startDate = '2024-01-01T00:00:00.000Z';
      const endDate = '2024-01-31T23:59:59.999Z';

      const response = await request(app)
        .get(`/aggregate?startDate=${startDate}&endDate=${endDate}`)
        .set('Authorization', 'Bearer admin-token');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        data: aggregatedData,
      });

      expect(mockSearchPerformanceService.aggregatePerformanceData).toHaveBeenCalledWith(
        new Date(startDate),
        new Date(endDate)
      );
    });

    it('should return 401 for unauthenticated request', async () => {
      const response = await request(app)
        .get('/aggregate?startDate=2024-01-01&endDate=2024-01-31');

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Authentication required');
    });

    it('should return 403 for non-admin user', async () => {
      const response = await request(app)
        .get('/aggregate?startDate=2024-01-01&endDate=2024-01-31')
        .set('Authorization', 'Bearer user-token');

      expect(response.status).toBe(403);
      expect(response.body.error).toBe('Insufficient permissions');
    });

    it('should reject request with missing start date', async () => {
      const response = await request(app)
        .get('/aggregate?endDate=2024-01-31')
        .set('Authorization', 'Bearer admin-token');

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Validation failed');
    });

    it('should reject request with missing end date', async () => {
      const response = await request(app)
        .get('/aggregate?startDate=2024-01-01')
        .set('Authorization', 'Bearer admin-token');

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Validation failed');
    });

    it('should reject request with invalid date format', async () => {
      const response = await request(app)
        .get('/aggregate?startDate=invalid-date&endDate=2024-01-31')
        .set('Authorization', 'Bearer admin-token');

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Validation failed');
    });

    it('should handle service errors', async () => {
      mockSearchPerformanceService.aggregatePerformanceData.mockRejectedValue(new Error('Service error'));

      const response = await request(app)
        .get('/aggregate?startDate=2024-01-01&endDate=2024-01-31')
        .set('Authorization', 'Bearer admin-token');

      expect(response.status).toBe(500);
    });
  });

  describe('GET /zero-results', () => {
    it('should return zero-result queries', async () => {
      const zeroResultData = {
        totalQueries: 100,
        uniqueQueries: 50,
        topQueries: [
          { query: 'nonexistent-product', count: 10, lastSeen: new Date() },
          { query: 'missing-item', count: 8, lastSeen: new Date() },
        ],
      };

      mockSearchPerformanceService.getZeroResultQueries.mockResolvedValue(zeroResultData);

      const startDate = '2024-01-01T00:00:00.000Z';
      const endDate = '2024-01-31T23:59:59.999Z';

      const response = await request(app)
        .get(`/zero-results?startDate=${startDate}&endDate=${endDate}`)
        .set('Authorization', 'Bearer admin-token');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        data: zeroResultData,
      });

      expect(mockSearchPerformanceService.getZeroResultQueries).toHaveBeenCalledWith(
        new Date(startDate),
        new Date(endDate)
      );
    });

    it('should return empty result when no zero-result queries', async () => {
      const zeroResultData = {
        totalQueries: 0,
        uniqueQueries: 0,
        topQueries: [],
      };

      mockSearchPerformanceService.getZeroResultQueries.mockResolvedValue(zeroResultData);

      const response = await request(app)
        .get('/zero-results?startDate=2024-01-01&endDate=2024-01-31')
        .set('Authorization', 'Bearer admin-token');

      expect(response.body.data.totalQueries).toBe(0);
    });

    it('should return 401 for unauthenticated request', async () => {
      const response = await request(app)
        .get('/zero-results?startDate=2024-01-01&endDate=2024-01-31');

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Authentication required');
    });

    it('should return 403 for non-admin user', async () => {
      const response = await request(app)
        .get('/zero-results?startDate=2024-01-01&endDate=2024-01-31')
        .set('Authorization', 'Bearer user-token');

      expect(response.status).toBe(403);
      expect(response.body.error).toBe('Insufficient permissions');
    });

    it('should handle service errors', async () => {
      mockSearchPerformanceService.getZeroResultQueries.mockRejectedValue(new Error('Service error'));

      const response = await request(app)
        .get('/zero-results?startDate=2024-01-01&endDate=2024-01-31')
        .set('Authorization', 'Bearer admin-token');

      expect(response.status).toBe(500);
    });
  });

  describe('GET /realtime', () => {
    it('should return real-time statistics', async () => {
      const realTimeStats = {
        queryCount: 100,
        avgResponseTime: 150,
        p95ResponseTime: 300,
        p99ResponseTime: 500,
        cacheHitRate: 0.75,
        cacheHits: 75,
        cacheMisses: 25,
        zeroResultCount: 10,
        zeroResultRate: 0.1,
      };

      mockSearchPerformanceService.getRealTimeStats.mockReturnValue(realTimeStats);

      const response = await request(app)
        .get('/realtime')
        .set('Authorization', 'Bearer admin-token');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        data: realTimeStats,
      });

      expect(mockSearchPerformanceService.getRealTimeStats).toHaveBeenCalled();
    });

    it('should return empty statistics when no data', async () => {
      const realTimeStats = {
        queryCount: 0,
        avgResponseTime: 0,
        p95ResponseTime: 0,
        p99ResponseTime: 0,
        cacheHitRate: 0,
        cacheHits: 0,
        cacheMisses: 0,
        zeroResultCount: 0,
        zeroResultRate: 0,
      };

      mockSearchPerformanceService.getRealTimeStats.mockReturnValue(realTimeStats);

      const response = await request(app)
        .get('/realtime')
        .set('Authorization', 'Bearer admin-token');

      expect(response.body.data.queryCount).toBe(0);
    });

    it('should return 401 for unauthenticated request', async () => {
      const response = await request(app)
        .get('/realtime');

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Authentication required');
    });

    it('should return 403 for non-admin user', async () => {
      const response = await request(app)
        .get('/realtime')
        .set('Authorization', 'Bearer user-token');

      expect(response.status).toBe(403);
      expect(response.body.error).toBe('Insufficient permissions');
    });
  });

  describe('POST /flush', () => {
    it('should flush performance metrics successfully', async () => {
      const flushedMetrics = {
        id: 'metrics-123',
        queryCount: 100,
        avgResponseTime: 150,
        p95ResponseTime: 300,
        p99ResponseTime: 500,
        cacheHitRate: 0.75,
        zeroResultQueries: 10,
        totalQueries: 100,
        timestamp: new Date(),
      };

      mockSearchPerformanceService.flushMetrics.mockResolvedValue(flushedMetrics);

      const response = await request(app)
        .post('/flush')
        .set('Authorization', 'Bearer admin-token');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        data: flushedMetrics,
      });

      expect(mockSearchPerformanceService.flushMetrics).toHaveBeenCalled();
    });

    it('should return null when no metrics to flush', async () => {
      mockSearchPerformanceService.flushMetrics.mockResolvedValue(null);

      const response = await request(app)
        .post('/flush')
        .set('Authorization', 'Bearer admin-token');

      expect(response.body.data).toBeNull();
    });

    it('should return 401 for unauthenticated request', async () => {
      const response = await request(app)
        .post('/flush');

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Authentication required');
    });

    it('should return 403 for non-admin user', async () => {
      const response = await request(app)
        .post('/flush')
        .set('Authorization', 'Bearer user-token');

      expect(response.status).toBe(403);
      expect(response.body.error).toBe('Insufficient permissions');
    });

    it('should handle service errors', async () => {
      mockSearchPerformanceService.flushMetrics.mockRejectedValue(new Error('Service error'));

      const response = await request(app)
        .post('/flush')
        .set('Authorization', 'Bearer admin-token');

      expect(response.status).toBe(500);
    });
  });
});
