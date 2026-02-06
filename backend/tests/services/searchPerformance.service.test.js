/**
 * Search Performance Service Tests
 * 
 * Comprehensive unit tests for SearchPerformanceService covering:
 * - Performance metrics recording
 * - Performance metrics retrieval
 * - Performance alerts generation
 * - Performance data aggregation
 * - Real-time statistics
 * - Zero-result queries analysis
 * - Query tracking and flushing
 */

const { SearchPerformanceService } = require('../../services/searchPerformance.service');

// Mock logger
jest.mock('../../services/logger');

describe('SearchPerformanceService', () => {
  let searchPerformanceService;
  let mockPrisma;

  beforeEach(() => {
    // Create mock Prisma client
    mockPrisma = {
      searchPerformanceMetrics: {
        create: jest.fn(),
        findMany: jest.fn(),
      },
      searchAnalytics: {
        findMany: jest.fn(),
      },
    };

    searchPerformanceService = new SearchPerformanceService(mockPrisma);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('recordPerformanceMetrics', () => {
    it('should record performance metrics with valid parameters', async () => {
      const performanceMetricsData = {
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

      mockPrisma.searchPerformanceMetrics.create.mockResolvedValue(performanceMetricsData);

      const result = await searchPerformanceService.recordPerformanceMetrics(
        1000,
        150,
        300,
        500,
        0.75,
        50
      );

      expect(mockPrisma.searchPerformanceMetrics.create).toHaveBeenCalledWith({
        data: {
          queryCount: 1000,
          avgResponseTime: 150,
          p95ResponseTime: 300,
          p99ResponseTime: 500,
          cacheHitRate: 0.75,
          zeroResultQueries: 50,
          totalQueries: 1000,
        },
      });

      expect(result).toEqual(performanceMetricsData);
    });

    it('should handle zero cache hit rate', async () => {
      const performanceMetricsData = {
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

      mockPrisma.searchPerformanceMetrics.create.mockResolvedValue(performanceMetricsData);

      const result = await searchPerformanceService.recordPerformanceMetrics(
        500,
        200,
        400,
        600,
        0,
        100
      );

      expect(result.cacheHitRate).toBe(0);
    });

    it('should handle perfect cache hit rate', async () => {
      const performanceMetricsData = {
        id: 'metrics-789',
        queryCount: 100,
        avgResponseTime: 50,
        p95ResponseTime: 100,
        p99ResponseTime: 150,
        cacheHitRate: 1,
        zeroResultQueries: 0,
        totalQueries: 100,
        timestamp: new Date(),
      };

      mockPrisma.searchPerformanceMetrics.create.mockResolvedValue(performanceMetricsData);

      const result = await searchPerformanceService.recordPerformanceMetrics(
        100,
        50,
        100,
        150,
        1,
        0
      );

      expect(result.cacheHitRate).toBe(1);
    });

    it('should handle database errors', async () => {
      const error = new Error('Database connection failed');
      mockPrisma.searchPerformanceMetrics.create.mockRejectedValue(error);

      await expect(
        searchPerformanceService.recordPerformanceMetrics(
          1000,
          150,
          300,
          500,
          0.75,
          50
        )
      ).rejects.toThrow('Database connection failed');
    });
  });

  describe('getPerformanceMetrics', () => {
    it('should retrieve performance metrics for a time range', async () => {
      const metricsData = [
        {
          id: 'metrics-1',
          queryCount: 1000,
          avgResponseTime: 150,
          p95ResponseTime: 300,
          p99ResponseTime: 500,
          cacheHitRate: 0.75,
          zeroResultQueries: 50,
          totalQueries: 1000,
          timestamp: new Date('2024-01-15'),
        },
        {
          id: 'metrics-2',
          queryCount: 800,
          avgResponseTime: 140,
          p95ResponseTime: 280,
          p99ResponseTime: 450,
          cacheHitRate: 0.8,
          zeroResultQueries: 40,
          totalQueries: 800,
          timestamp: new Date('2024-01-16'),
        },
      ];

      mockPrisma.searchPerformanceMetrics.findMany.mockResolvedValue(metricsData);

      const result = await searchPerformanceService.getPerformanceMetrics('day');

      expect(mockPrisma.searchPerformanceMetrics.findMany).toHaveBeenCalledWith({
        where: {
          timestamp: {
            gte: expect.any(Date),
          },
        },
        orderBy: {
          timestamp: 'desc',
        },
      });

      expect(result.timeRange).toBe('day');
      expect(result.metrics).toHaveLength(2);
      expect(result.summary).toBeDefined();
    });

    it('should return empty summary when no metrics found', async () => {
      mockPrisma.searchPerformanceMetrics.findMany.mockResolvedValue([]);

      const result = await searchPerformanceService.getPerformanceMetrics('hour');

      expect(result.summary).toEqual({
        avgResponseTime: 0,
        p95ResponseTime: 0,
        p99ResponseTime: 0,
        cacheHitRate: 0,
        zeroResultRate: 0,
        totalQueries: 0,
      });
    });

    it('should calculate correct summary statistics', async () => {
      const metricsData = [
        {
          avgResponseTime: 150,
          p95ResponseTime: 300,
          p99ResponseTime: 500,
          cacheHitRate: 0.75,
          zeroResultQueries: 50,
          totalQueries: 1000,
        },
        {
          avgResponseTime: 170,
          p95ResponseTime: 320,
          p99ResponseTime: 550,
          cacheHitRate: 0.8,
          zeroResultQueries: 60,
          totalQueries: 1200,
        },
      ];

      mockPrisma.searchPerformanceMetrics.findMany.mockResolvedValue(metricsData);

      const result = await searchPerformanceService.getPerformanceMetrics('day');

      expect(result.summary.avgResponseTime).toBe(160);
      expect(result.summary.p95ResponseTime).toBe(310);
      expect(result.summary.p99ResponseTime).toBe(525);
      expect(result.summary.cacheHitRate).toBe(0.775);
      expect(result.summary.totalQueries).toBe(2200);
    });

    it('should handle different time ranges', async () => {
      const timeRanges = ['hour', 'day', 'week', 'month'];

      for (const range of timeRanges) {
        mockPrisma.searchPerformanceMetrics.findMany.mockResolvedValue([]);

        await searchPerformanceService.getPerformanceMetrics(range);

        expect(mockPrisma.searchPerformanceMetrics.findMany).toHaveBeenCalled();
      }
    });

    it('should handle database errors', async () => {
      const error = new Error('Database error');
      mockPrisma.searchPerformanceMetrics.findMany.mockRejectedValue(error);

      await expect(
        searchPerformanceService.getPerformanceMetrics('day')
      ).rejects.toThrow('Database error');
    });
  });

  describe('getPerformanceAlerts', () => {
    it('should generate alerts for high response times', async () => {
      const recentMetrics = [
        {
          avgResponseTime: 1500,
          p95ResponseTime: 2500,
          p99ResponseTime: 3500,
          cacheHitRate: 0.8,
          zeroResultQueries: 50,
          totalQueries: 1000,
          timestamp: new Date(),
        },
      ];

      mockPrisma.searchPerformanceMetrics.findMany.mockResolvedValue(recentMetrics);

      const alerts = await searchPerformanceService.getPerformanceAlerts({
        maxAvgResponseTime: 1000,
        maxP95ResponseTime: 2000,
        maxP99ResponseTime: 3000,
        minCacheHitRate: 0.7,
        maxZeroResultRate: 0.1,
      });

      expect(alerts).toHaveLength(3);
      expect(alerts[0].type).toBe('high_response_time');
      expect(alerts[1].type).toBe('high_p95_response_time');
      expect(alerts[2].type).toBe('high_p99_response_time');
    });

    it('should generate alerts for low cache hit rate', async () => {
      const recentMetrics = [
        {
          avgResponseTime: 150,
          p95ResponseTime: 300,
          p99ResponseTime: 500,
          cacheHitRate: 0.5,
          zeroResultQueries: 50,
          totalQueries: 1000,
          timestamp: new Date(),
        },
      ];

      mockPrisma.searchPerformanceMetrics.findMany.mockResolvedValue(recentMetrics);

      const alerts = await searchPerformanceService.getPerformanceAlerts({
        minCacheHitRate: 0.7,
      });

      expect(alerts).toHaveLength(1);
      expect(alerts[0].type).toBe('low_cache_hit_rate');
    });

    it('should generate alerts for high zero result rate', async () => {
      const recentMetrics = [
        {
          avgResponseTime: 150,
          p95ResponseTime: 300,
          p99ResponseTime: 500,
          cacheHitRate: 0.8,
          zeroResultQueries: 150,
          totalQueries: 1000,
          timestamp: new Date(),
        },
      ];

      mockPrisma.searchPerformanceMetrics.findMany.mockResolvedValue(recentMetrics);

      const alerts = await searchPerformanceService.getPerformanceAlerts({
        maxZeroResultRate: 0.1,
      });

      expect(alerts).toHaveLength(1);
      expect(alerts[0].type).toBe('high_zero_result_rate');
    });

    it('should return empty array when no alerts', async () => {
      const recentMetrics = [
        {
          avgResponseTime: 150,
          p95ResponseTime: 300,
          p99ResponseTime: 500,
          cacheHitRate: 0.8,
          zeroResultQueries: 50,
          totalQueries: 1000,
          timestamp: new Date(),
        },
      ];

      mockPrisma.searchPerformanceMetrics.findMany.mockResolvedValue(recentMetrics);

      const alerts = await searchPerformanceService.getPerformanceAlerts();

      expect(alerts).toHaveLength(0);
    });

    it('should set correct severity levels', async () => {
      const recentMetrics = [
        {
          avgResponseTime: 2500,
          p95ResponseTime: 300,
          p99ResponseTime: 500,
          cacheHitRate: 0.8,
          zeroResultQueries: 50,
          totalQueries: 1000,
          timestamp: new Date(),
        },
      ];

      mockPrisma.searchPerformanceMetrics.findMany.mockResolvedValue(recentMetrics);

      const alerts = await searchPerformanceService.getPerformanceAlerts({
        maxAvgResponseTime: 1000,
      });

      expect(alerts[0].severity).toBe('critical');
    });
  });

  describe('aggregatePerformanceData', () => {
    it('should aggregate performance data for a date range', async () => {
      const metricsData = [
        {
          avgResponseTime: 150,
          p95ResponseTime: 300,
          p99ResponseTime: 500,
          cacheHitRate: 0.75,
          zeroResultQueries: 50,
          totalQueries: 1000,
          timestamp: new Date('2024-01-15'),
        },
        {
          avgResponseTime: 170,
          p95ResponseTime: 320,
          p99ResponseTime: 550,
          cacheHitRate: 0.8,
          zeroResultQueries: 60,
          totalQueries: 1200,
          timestamp: new Date('2024-01-16'),
        },
      ];

      mockPrisma.searchPerformanceMetrics.findMany.mockResolvedValue(metricsData);

      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-31');

      const result = await searchPerformanceService.aggregatePerformanceData(startDate, endDate);

      expect(mockPrisma.searchPerformanceMetrics.findMany).toHaveBeenCalledWith({
        where: {
          timestamp: {
            gte: startDate,
            lte: endDate,
          },
        },
        orderBy: {
          timestamp: 'asc',
        },
      });

      expect(result.totalRecords).toBe(2);
      expect(result.summary).toBeDefined();
      expect(result.summary.totalQueries).toBe(2200);
    });

    it('should return empty result when no data found', async () => {
      mockPrisma.searchPerformanceMetrics.findMany.mockResolvedValue([]);

      const result = await searchPerformanceService.aggregatePerformanceData(
        new Date('2024-01-01'),
        new Date('2024-01-31')
      );

      expect(result.totalRecords).toBe(0);
      expect(result.summary).toBeNull();
    });

    it('should calculate hourly breakdown', async () => {
      const metricsData = [
        {
          avgResponseTime: 150,
          totalQueries: 100,
          cacheHitRate: 0.75,
          zeroResultQueries: 10,
          timestamp: new Date('2024-01-15T10:00:00'),
        },
        {
          avgResponseTime: 170,
          totalQueries: 120,
          cacheHitRate: 0.8,
          zeroResultQueries: 12,
          timestamp: new Date('2024-01-15T10:00:00'),
        },
      ];

      mockPrisma.searchPerformanceMetrics.findMany.mockResolvedValue(metricsData);

      const result = await searchPerformanceService.aggregatePerformanceData(
        new Date('2024-01-01'),
        new Date('2024-01-31')
      );

      expect(result.hourlyBreakdown).toBeDefined();
    });

    it('should calculate min and max response times', async () => {
      const metricsData = [
        { avgResponseTime: 100, totalQueries: 100, cacheHitRate: 0.75, zeroResultQueries: 10 },
        { avgResponseTime: 200, totalQueries: 120, cacheHitRate: 0.8, zeroResultQueries: 12 },
        { avgResponseTime: 150, totalQueries: 110, cacheHitRate: 0.78, zeroResultQueries: 11 },
      ];

      mockPrisma.searchPerformanceMetrics.findMany.mockResolvedValue(metricsData);

      const result = await searchPerformanceService.aggregatePerformanceData(
        new Date('2024-01-01'),
        new Date('2024-01-31')
      );

      expect(result.summary.minResponseTime).toBe(100);
      expect(result.summary.maxResponseTime).toBe(200);
    });
  });

  describe('trackQuery', () => {
    it('should track a cached query', () => {
      searchPerformanceService.trackQuery(100, true, 10);

      expect(searchPerformanceService.queryCount).toBe(1);
      expect(searchPerformanceService.cacheHits).toBe(1);
      expect(searchPerformanceService.cacheMisses).toBe(0);
      expect(searchPerformanceService.responseTimeBuffer).toContain(100);
    });

    it('should track an uncached query', () => {
      searchPerformanceService.trackQuery(150, false, 5);

      expect(searchPerformanceService.queryCount).toBe(1);
      expect(searchPerformanceService.cacheHits).toBe(0);
      expect(searchPerformanceService.cacheMisses).toBe(1);
      expect(searchPerformanceService.responseTimeBuffer).toContain(150);
    });

    it('should track zero-result queries', () => {
      searchPerformanceService.trackQuery(100, false, 0);

      expect(searchPerformanceService.zeroResultCount).toBe(1);
    });

    it('should manage buffer size', () => {
      // Fill buffer beyond max size
      for (let i = 0; i < 1100; i++) {
        searchPerformanceService.trackQuery(100, false, 10);
      }

      expect(searchPerformanceService.responseTimeBuffer.length).toBe(1000);
    });
  });

  describe('flushMetrics', () => {
    it('should flush metrics to database', async () => {
      // Track some queries
      searchPerformanceService.trackQuery(100, true, 10);
      searchPerformanceService.trackQuery(150, false, 5);
      searchPerformanceService.trackQuery(200, true, 8);

      const performanceMetricsData = {
        id: 'metrics-123',
        queryCount: 3,
        avgResponseTime: 150,
        p95ResponseTime: 200,
        p99ResponseTime: 200,
        cacheHitRate: 0.6666666666666666,
        zeroResultQueries: 0,
        totalQueries: 3,
        timestamp: new Date(),
      };

      mockPrisma.searchPerformanceMetrics.create.mockResolvedValue(performanceMetricsData);

      const result = await searchPerformanceService.flushMetrics();

      expect(mockPrisma.searchPerformanceMetrics.create).toHaveBeenCalled();
      expect(result).toEqual(performanceMetricsData);
    });

    it('should reset counters after flush', async () => {
      searchPerformanceService.trackQuery(100, true, 10);
      searchPerformanceService.trackQuery(150, false, 5);

      mockPrisma.searchPerformanceMetrics.create.mockResolvedValue({});

      await searchPerformanceService.flushMetrics();

      expect(searchPerformanceService.queryCount).toBe(0);
      expect(searchPerformanceService.cacheHits).toBe(0);
      expect(searchPerformanceService.cacheMisses).toBe(0);
      expect(searchPerformanceService.zeroResultCount).toBe(0);
      expect(searchPerformanceService.responseTimeBuffer).toEqual([]);
    });

    it('should return null when no queries tracked', async () => {
      const result = await searchPerformanceService.flushMetrics();

      expect(result).toBeNull();
    });

    it('should calculate correct percentiles', async () => {
      // Track queries with varying response times
      const responseTimes = [100, 150, 200, 250, 300, 350, 400, 450, 500, 550];
      responseTimes.forEach(time => searchPerformanceService.trackQuery(time, true, 10));

      mockPrisma.searchPerformanceMetrics.create.mockResolvedValue({});

      await searchPerformanceService.flushMetrics();

      expect(mockPrisma.searchPerformanceMetrics.create).toHaveBeenCalledWith(
        expect.objectContaining({
          p95ResponseTime: expect.any(Number),
          p99ResponseTime: expect.any(Number),
        })
      );
    });
  });

  describe('getRealTimeStats', () => {
    it('should return real-time statistics', () => {
      searchPerformanceService.trackQuery(100, true, 10);
      searchPerformanceService.trackQuery(150, false, 5);
      searchPerformanceService.trackQuery(200, true, 8);

      const stats = searchPerformanceService.getRealTimeStats();

      expect(stats.queryCount).toBe(3);
      expect(stats.cacheHits).toBe(2);
      expect(stats.cacheMisses).toBe(1);
      expect(stats.cacheHitRate).toBe(0.6666666666666666);
      expect(stats.zeroResultCount).toBe(0);
      expect(stats.avgResponseTime).toBe(150);
    });

    it('should handle empty statistics', () => {
      const stats = searchPerformanceService.getRealTimeStats();

      expect(stats.queryCount).toBe(0);
      expect(stats.cacheHitRate).toBe(0);
      expect(stats.avgResponseTime).toBe(0);
    });

    it('should calculate correct zero result rate', () => {
      searchPerformanceService.trackQuery(100, true, 0);
      searchPerformanceService.trackQuery(150, false, 5);
      searchPerformanceService.trackQuery(200, true, 0);

      const stats = searchPerformanceService.getRealTimeStats();

      expect(stats.zeroResultCount).toBe(2);
      expect(stats.zeroResultRate).toBe(0.6666666666666666);
    });

    it('should calculate P95 and P99 percentiles', () => {
      const responseTimes = [100, 150, 200, 250, 300, 350, 400, 450, 500, 550];
      responseTimes.forEach(time => searchPerformanceService.trackQuery(time, true, 10));

      const stats = searchPerformanceService.getRealTimeStats();

      expect(stats.p95ResponseTime).toBeGreaterThan(0);
      expect(stats.p99ResponseTime).toBeGreaterThan(0);
      expect(stats.p99ResponseTime).toBeGreaterThanOrEqual(stats.p95ResponseTime);
    });
  });

  describe('getZeroResultQueries', () => {
    it('should retrieve zero-result queries', async () => {
      const zeroResultQueries = [
        {
          id: 'search-1',
          query: 'nonexistent-product',
          resultsCount: 0,
          timestamp: new Date('2024-01-15'),
        },
        {
          id: 'search-2',
          query: 'another-missing-item',
          resultsCount: 0,
          timestamp: new Date('2024-01-16'),
        },
      ];

      mockPrisma.searchAnalytics.findMany.mockResolvedValue(zeroResultQueries);

      const result = await searchPerformanceService.getZeroResultQueries(
        new Date('2024-01-01'),
        new Date('2024-01-31')
      );

      expect(mockPrisma.searchAnalytics.findMany).toHaveBeenCalledWith({
        where: {
          resultsCount: 0,
          timestamp: {
            gte: expect.any(Date),
            lte: expect.any(Date),
          },
        },
        orderBy: {
          timestamp: 'desc',
        },
        take: 100,
      });

      expect(result.totalQueries).toBe(2);
      expect(result.uniqueQueries).toBe(2);
      expect(result.topQueries).toHaveLength(2);
    });

    it('should group and sort zero-result queries', async () => {
      const zeroResultQueries = [
        { id: 'search-1', query: 'laptop', resultsCount: 0, timestamp: new Date() },
        { id: 'search-2', query: 'laptop', resultsCount: 0, timestamp: new Date() },
        { id: 'search-3', query: 'phone', resultsCount: 0, timestamp: new Date() },
        { id: 'search-4', query: 'laptop', resultsCount: 0, timestamp: new Date() },
      ];

      mockPrisma.searchAnalytics.findMany.mockResolvedValue(zeroResultQueries);

      const result = await searchPerformanceService.getZeroResultQueries(
        new Date('2024-01-01'),
        new Date('2024-01-31')
      );

      expect(result.topQueries[0].query).toBe('laptop');
      expect(result.topQueries[0].count).toBe(3);
      expect(result.topQueries[1].query).toBe('phone');
      expect(result.topQueries[1].count).toBe(1);
    });

    it('should return empty result when no zero-result queries', async () => {
      mockPrisma.searchAnalytics.findMany.mockResolvedValue([]);

      const result = await searchPerformanceService.getZeroResultQueries(
        new Date('2024-01-01'),
        new Date('2024-01-31')
      );

      expect(result.totalQueries).toBe(0);
      expect(result.uniqueQueries).toBe(0);
      expect(result.topQueries).toHaveLength(0);
    });

    it('should limit top queries to 20', async () => {
      const zeroResultQueries = Array.from({ length: 30 }, (_, i) => ({
        id: `search-${i}`,
        query: `query-${i}`,
        resultsCount: 0,
        timestamp: new Date(),
      }));

      mockPrisma.searchAnalytics.findMany.mockResolvedValue(zeroResultQueries);

      const result = await searchPerformanceService.getZeroResultQueries(
        new Date('2024-01-01'),
        new Date('2024-01-31')
      );

      expect(result.topQueries.length).toBeLessThanOrEqual(20);
    });
  });

  describe('calculateAverage', () => {
    it('should calculate average of numbers', () => {
      const values = [100, 150, 200, 250, 300];
      const average = searchPerformanceService.calculateAverage(values);

      expect(average).toBe(200);
    });

    it('should return 0 for empty array', () => {
      const average = searchPerformanceService.calculateAverage([]);

      expect(average).toBe(0);
    });

    it('should handle single value', () => {
      const average = searchPerformanceService.calculateAverage([150]);

      expect(average).toBe(150);
    });

    it('should handle decimal values', () => {
      const average = searchPerformanceService.calculateAverage([100.5, 200.5, 300]);

      expect(average).toBeCloseTo(200.33, 2);
    });
  });
});
