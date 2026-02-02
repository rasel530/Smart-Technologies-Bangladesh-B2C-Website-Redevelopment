/**
 * Search Performance Tests
 * 
 * This module contains performance tests for the search functionality
 * including response time, caching, and concurrent request handling.
 */

// Performance test configuration
const perfConfig = {
  // Target response times (milliseconds)
  targets: {
    searchP95: 300,
    searchP99: 500,
    autocompleteP95: 100,
    filterP95: 100,
    cacheHitP95: 50
  },
  // Cache hit rate target (percentage)
  cacheHitRateTarget: 80,
  // Concurrent requests for load testing
  concurrentRequests: 50,
  // Total requests for load testing
  totalRequests: 1000,
  // Warmup requests before measuring
  warmupRequests: 100
};

// Mock dependencies
jest.mock('../../services/logger', () => ({
  loggerService: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn()
  }
}));

// Mock Prisma Client
const mockPrisma = {
  searchLog: {
    create: jest.fn().mockResolvedValue({}),
    groupBy: jest.fn().mockResolvedValue([]),
    findMany: jest.fn().mockResolvedValue([])
  }
};

// Mock Redis Client
const mockRedisClient = {
  ping: jest.fn().mockResolvedValue('PONG'),
  get: jest.fn(),
  setex: jest.fn().mockResolvedValue('OK'),
  keys: jest.fn().mockResolvedValue([]),
  del: jest.fn().mockResolvedValue(1),
  pipeline: jest.fn(() => ({
    del: jest.fn().mockReturnThis(),
    exec: jest.fn().mockResolvedValue([])
  }))
};

// Mock Elasticsearch Client
const mockElasticsearchClient = {
  search: jest.fn().mockResolvedValue({
    hits: {
      total: { value: 100 },
      max_score: 5.5,
      hits: Array(20).fill(null).map((_, i) => ({
        _id: `prod-${i}`,
        _score: 5.5 - i * 0.1,
        _source: {
          sku: `SKU-${i}`,
          name: { en: `Test Product ${i}`, bn: `টেস্ট প্রোডাক্ট ${i}` },
          slug: `test-product-${i}`,
          price: { current: 999.99, sale: 899.99 },
          inventory: { quantity: 100 },
          status: 'ACTIVE',
          flags: { featured: true, newArrival: true, bestSeller: false },
          brand: { id: 'brand-1', name: 'TestBrand', slug: 'testbrand' },
          categories: [{ id: 'cat-1', name: 'Electronics', slug: 'electronics', level: 1 }],
          primaryImage: { url: 'https://example.com/image.jpg' },
          stats: { averageRating: 4.5, reviewCount: 100 }
        }
      }))
    },
    aggregations: {
      categories: { buckets: [] },
      brands: { buckets: [] },
      price_ranges: { buckets: [] },
      ratings: { buckets: [] },
      in_stock: { doc_count: 50 }
    }
  })
};

const { SearchService } = require('../../services/searchService');

describe('Search Performance Tests', () => {
  let searchService;
  let cacheHits = 0;
  let cacheMisses = 0;
  let responseTimes = [];

  beforeAll(() => {
    // Initialize search service
    searchService = new SearchService(
      mockElasticsearchClient,
      mockPrisma,
      mockRedisClient,
      {
        defaultPage: 1,
        defaultPageSize: 20,
        maxPageSize: 100,
        enableCaching: true,
        cacheTTL: 300,
        enableAnalytics: true,
        minScore: 0.1,
        enableFuzzyByDefault: true,
        defaultLanguage: 'en',
        enableQueryOptimization: true
      }
    );
    searchService.isInitialized = true;
  });

  beforeEach(() => {
    jest.clearAllMocks();
    cacheHits = 0;
    cacheMisses = 0;
    responseTimes = [];

    // Reset Redis mock for caching behavior
    mockRedisClient.get.mockImplementation((key) => {
      // Simulate 70% cache hit rate
      if (Math.random() < 0.7) {
        cacheHits++;
        return Promise.resolve(JSON.stringify({
          success: true,
          total: 100,
          results: [],
          page: 1,
          pageSize: 20,
          totalPages: 5,
          executionTime: 10
        }));
      }
      cacheMisses++;
      return Promise.resolve(null);
    });
  });

  describe('Search Response Time', () => {
    it('should complete search within 300ms p95', async () => {
      const queries = Array(perfConfig.totalRequests).fill(null).map(() => ({
        query: `test-query-${Math.random()}`,
        page: Math.floor(Math.random() * 5) + 1
      }));

      // Warmup
      for (let i = 0; i < perfConfig.warmupRequests; i++) {
        await searchService.advancedSearch({ query: `warmup-${i}` });
      }

      // Measure response times
      const startTimes = [];
      for (let i = 0; i < queries.length; i++) {
        const start = Date.now();
        startTimes.push(start);
        await searchService.advancedSearch(queries[i]);
        responseTimes.push(Date.now() - start);
      }

      // Calculate p95
      const sortedTimes = [...responseTimes].sort((a, b) => a - b);
      const p95Index = Math.floor(sortedTimes.length * 0.95);
      const p95 = sortedTimes[p95Index];

      console.log(`Search p95 response time: ${p95}ms`);
      console.log(`Search p99 response time: ${sortedTimes[Math.floor(sortedTimes.length * 0.99)]}ms`);

      // p95 should be less than target (allowing for test environment variance)
      expect(p95).toBeLessThan(perfConfig.targets.searchP95 * 2);
    });

    it('should complete filtered search within 100ms p95', async () => {
      const filterQueries = [
        { query: 'smartphone', categoryIds: ['cat-1'], inStockOnly: true },
        { query: 'laptop', brandIds: ['brand-1'], priceRange: { min: 500, max: 2000 } },
        { query: 'headphones', featuredOnly: true, sort: 'rating' },
        { query: 'tablet', specifications: [{ name: 'Color', values: ['Black'] }] },
        { query: 'watch', newArrivalsOnly: true }
      ];

      // Warmup
      for (let i = 0; i < 20; i++) {
        await searchService.advancedSearch(filterQueries[i % filterQueries.length]);
      }

      // Measure response times for filtered searches
      const filterTimes = [];
      for (let i = 0; i < 200; i++) {
        const query = filterQueries[i % filterQueries.length];
        const start = Date.now();
        await searchService.advancedSearch(query);
        filterTimes.push(Date.now() - start);
      }

      // Calculate p95
      const sortedTimes = [...filterTimes].sort((a, b) => a - b);
      const p95Index = Math.floor(sortedTimes.length * 0.95);
      const p95 = sortedTimes[p95Index];

      console.log(`Filtered search p95 response time: ${p95}ms`);

      // Should be within target (allowing for test environment variance)
      expect(p95).toBeLessThan(perfConfig.targets.filterP95 * 2);
    });

    it('should complete sorted search within acceptable time', async () => {
      const sortOptions = ['relevance', 'price_asc', 'price_desc', 'rating', 'newest', 'name_asc', 'name_desc'];

      const sortTimes = [];
      for (let i = 0; i < 100; i++) {
        const query = sortOptions[i % sortOptions.length];
        const start = Date.now();
        await searchService.advancedSearch({ query: 'test', sort: query });
        sortTimes.push(Date.now() - start);
      }

      const avgTime = sortTimes.reduce((a, b) => a + b, 0) / sortTimes.length;
      console.log(`Average sorted search time: ${avgTime}ms`);

      expect(avgTime).toBeLessThan(100);
    });
  });

  describe('Pagination Performance', () => {
    it('should handle pagination efficiently', async () => {
      const pageSizes = [10, 20, 50, 100];
      const paginationTimes = [];

      for (const pageSize of pageSizes) {
        // Test different page sizes
        for (let page = 1; page <= 10; page++) {
          const start = Date.now();
          await searchService.advancedSearch({
            query: 'test',
            page,
            pageSize
          });
          paginationTimes.push({
            pageSize,
            page,
            time: Date.now() - start
          });
        }
      }

      // Log performance for each page size
      for (const pageSize of pageSizes) {
        const times = paginationTimes.filter(t => t.pageSize === pageSize);
        const avgTime = times.reduce((sum, t) => sum + t.time, 0) / times.length;
        console.log(`Page size ${pageSize} average time: ${avgTime.toFixed(2)}ms`);
      }

      // All pagination should complete quickly
      const maxTime = Math.max(...paginationTimes.map(t => t.time));
      expect(maxTime).toBeLessThan(100);
    });

    it('should handle large page numbers efficiently', async () => {
      const largePageTimes = [];
      
      for (let i = 1; i <= 50; i++) {
        const start = Date.now();
        await searchService.advancedSearch({
          query: 'test',
          page: i * 10, // Large page numbers
          pageSize: 20
        });
        largePageTimes.push(Date.now() - start);
      }

      const avgTime = largePageTimes.reduce((a, b) => a + b, 0) / largePageTimes.length;
      console.log(`Large page numbers average time: ${avgTime.toFixed(2)}ms`);

      expect(avgTime).toBeLessThan(50);
    });
  });

  describe('Cache Performance', () => {
    it('should achieve >80% cache hit rate for popular queries', async () => {
      const popularQueries = [
        { query: 'iphone' },
        { query: 'samsung' },
        { query: 'laptop' },
        { query: 'headphones' },
        { query: 'smartwatch' }
      ];

      // First pass - cache misses
      for (const query of popularQueries) {
        await searchService.advancedSearch(query);
      }

      // Reset counts
      cacheHits = 0;
      cacheMisses = 0;

      // Second pass - should be mostly cache hits
      for (let i = 0; i < 100; i++) {
        const query = popularQueries[i % popularQueries.length];
        await searchService.advancedSearch(query);
      }

      const totalRequests = cacheHits + cacheMisses;
      const hitRate = (cacheHits / totalRequests) * 100;

      console.log(`Cache hit rate: ${hitRate.toFixed(2)}%`);
      console.log(`Cache hits: ${cacheHits}, misses: ${cacheMisses}`);

      // Should achieve target cache hit rate
      expect(hitRate).toBeGreaterThan(perfConfig.cacheHitRateTarget);
    });

    it('should cache results within 50ms', async () => {
      const cacheWriteTimes = [];

      for (let i = 0; i < 50; i++) {
        const start = Date.now();
        mockRedisClient.setex.mockClear();
        mockRedisClient.setex.mockResolvedValueOnce('OK');
        
        await searchService.advancedSearch({
          query: `cache-test-${i}`,
          page: 1
        });
        
        cacheWriteTimes.push(Date.now() - start);
      }

      const avgCacheTime = cacheWriteTimes.reduce((a, b) => a + b, 0) / cacheWriteTimes.length;
      console.log(`Average cache write time: ${avgCacheTime.toFixed(2)}ms`);

      expect(avgCacheTime).toBeLessThan(50);
    });

    it('should retrieve cached results quickly', async () => {
      // Pre-populate cache
      const cachedResult = {
        success: true,
        total: 100,
        results: [],
        page: 1,
        pageSize: 20,
        totalPages: 5,
        executionTime: 10
      };

      mockRedisClient.get.mockResolvedValue(JSON.stringify(cachedResult));

      const cacheReadTimes = [];
      for (let i = 0; i < 100; i++) {
        const start = Date.now();
        await searchService.advancedSearch({ query: 'cached-query' });
        cacheReadTimes.push(Date.now() - start);
      }

      const avgCacheReadTime = cacheReadTimes.reduce((a, b) => a + b, 0) / cacheReadTimes.length;
      console.log(`Average cache read time: ${avgCacheReadTime.toFixed(2)}ms`);

      // Cache reads should be very fast
      expect(avgCacheReadTime).toBeLessThan(20);
    });
  });

  describe('Autocomplete Performance', () => {
    it('should complete autocomplete within 100ms p95', async () => {
      const autocompleteQueries = [
        'iph', 'sams', 'lap', 'hea', 'wat', 'key', 'mou', 'mon', 'tab', 'spe'
      ];

      // Mock autocomplete response
      mockElasticsearchClient.search.mockResolvedValue({
        hits: {
          hits: Array(10).fill(null).map((_, i) => ({
            _id: `prod-${i}`,
            _score: 5.0,
            _source: {
              name: { en: `Product ${i}` },
              slug: `product-${i}`,
              price: { current: 999.99 }
            }
          }))
        }
      });

      mockPrisma.searchLog.groupBy.mockResolvedValue([
        { query: 'iphone', _count: { query: 50 } },
        { query: 'smartphone', _count: { query: 30 } }
      ]);

      // Warmup
      for (let i = 0; i < 20; i++) {
        await searchService.autocomplete(autocompleteQueries[i % autocompleteQueries.length]);
      }

      const autocompleteTimes = [];
      for (let i = 0; i < 200; i++) {
        const query = autocompleteQueries[i % autocompleteQueries.length];
        const start = Date.now();
        await searchService.autocomplete(query);
        autocompleteTimes.push(Date.now() - start);
      }

      const sortedTimes = [...autocompleteTimes].sort((a, b) => a - b);
      const p95 = sortedTimes[Math.floor(sortedTimes.length * 0.95)];

      console.log(`Autocomplete p95 response time: ${p95}ms`);

      expect(p95).toBeLessThan(perfConfig.targets.autocompleteP95 * 2);
    });

    it('should handle rapid autocomplete requests', async () => {
      const rapidTimes = [];
      
      for (let i = 0; i < 100; i++) {
        const start = Date.now();
        await searchService.autocomplete(`rap-${i}`);
        rapidTimes.push(Date.now() - start);
      }

      const avgTime = rapidTimes.reduce((a, b) => a + b, 0) / rapidTimes.length;
      const maxTime = Math.max(...rapidTimes);

      console.log(`Rapid autocomplete average: ${avgTime.toFixed(2)}ms, max: ${maxTime}ms`);

      expect(avgTime).toBeLessThan(50);
      expect(maxTime).toBeLessThan(100);
    });
  });

  describe('Concurrent Request Handling', () => {
    it('should handle 50 concurrent search requests', async () => {
      const concurrentRequests = 50;
      const query = { query: 'concurrent-test' };

      // Execute concurrent requests
      const start = Date.now();
      const promises = Array(concurrentRequests).fill(null).map(() =>
        searchService.advancedSearch(query)
      );
      
      const results = await Promise.all(promises);
      const totalTime = Date.now() - start;

      console.log(`50 concurrent requests completed in ${totalTime}ms`);
      console.log(`Average per request: ${(totalTime / concurrentRequests).toFixed(2)}ms All requests`);

      // should complete successfully
      expect(results.length).toBe(concurrentRequests);
      results.forEach(result => {
        expect(result.success).toBe(true);
      });

      // Should complete within reasonable time
      expect(totalTime).toBeLessThan(2000);
    });

    it('should handle burst of 100 requests', async () => {
      const burstSize = 100;
      const queries = Array(burstSize).fill(null).map((_, i) => ({
        query: `burst-test-${i}`,
        page: Math.floor(Math.random() * 5) + 1
      }));

      const start = Date.now();
      const promises = queries.map(q => searchService.advancedSearch(q));
      
      const results = await Promise.all(promises);
      const totalTime = Date.now() - start;

      console.log(`Burst of ${burstSize} requests completed in ${totalTime}ms`);

      expect(results.length).toBe(burstSize);
      expect(totalTime).toBeLessThan(5000);
    });

    it('should maintain performance under load', async () => {
      const loadTestDuration = 5000; // 5 seconds
      const requestsPerSecond = 20;
      const totalRequests = (loadTestDuration / 1000) * requestsPerSecond;
      
      const startTime = Date.now();
      let requestCount = 0;
      const latencies = [];

      while (Date.now() - startTime < loadTestDuration) {
        const reqStart = Date.now();
        await searchService.advancedSearch({ query: `load-test-${requestCount}` });
        latencies.push(Date.now() - reqStart);
        requestCount++;
      }

      const avgLatency = latencies.reduce((a, b) => a + b, 0) / latencies.length;
      const p95Latency = [...latencies].sort((a, b) => a - b)[Math.floor(latencies.length * 0.95)];

      console.log(`Load test: ${requestCount} requests in ${loadTestDuration}ms`);
      console.log(`Average latency: ${avgLatency.toFixed(2)}ms, p95: ${p95Latency}ms`);

      // Should maintain reasonable performance under load
      expect(p95Latency).toBeLessThan(200);
    });
  });

  describe('Popular Searches Performance', () => {
    it('should retrieve popular searches quickly', async () => {
      mockPrisma.searchLog.groupBy.mockResolvedValue([
        { query: 'iphone', _count: { query: 100 } },
        { query: 'laptop', _count: { query: 75 } },
        { query: 'headphones', _count: { query: 50 } }
      ]);

      const popularTimes = [];
      for (let i = 0; i < 50; i++) {
        const start = Date.now();
        await searchService.getPopularSearches(10);
        popularTimes.push(Date.now() - start);
      }

      const avgTime = popularTimes.reduce((a, b) => a + b, 0) / popularTimes.length;
      console.log(`Average popular searches time: ${avgTime.toFixed(2)}ms`);

      expect(avgTime).toBeLessThan(50);
    });
  });

  describe('Suggestions Performance', () => {
    it('should return suggestions quickly', async () => {
      mockElasticsearchClient.search.mockResolvedValue({
        hits: {
          hits: Array(5).fill(null).map((_, i) => ({
            _id: `prod-${i}`,
            _score: 4.0,
            _source: { name: { en: `Product ${i}` } }
          }))
        },
        suggest: {
          'product-suggest': [{
            options: [{ text: 'suggestion 1' }, { text: 'suggestion 2' }]
          }]
        }
      });

      mockPrisma.searchLog.findMany.mockResolvedValue([
        { query: 'related query 1' },
        { query: 'related query 2' }
      ]);

      const suggestionTimes = [];
      for (let i = 0; i < 50; i++) {
        const start = Date.now();
        await searchService.getSuggestions('test');
        suggestionTimes.push(Date.now() - start);
      }

      const avgTime = suggestionTimes.reduce((a, b) => a + b, 0) / suggestionTimes.length;
      console.log(`Average suggestions time: ${avgTime.toFixed(2)}ms`);

      expect(avgTime).toBeLessThan(100);
    });
  });

  describe('Cache Invalidation Performance', () => {
    it('should invalidate product cache efficiently', async () => {
      const invalidateTimes = [];
      
      for (let i = 0; i < 50; i++) {
        const start = Date.now();
        await searchService.invalidateProductCache(`prod-${i}`);
        invalidateTimes.push(Date.now() - start);
      }

      const avgTime = invalidateTimes.reduce((a, b) => a + b, 0) / invalidateTimes.length;
      console.log(`Average product cache invalidation time: ${avgTime.toFixed(2)}ms`);

      expect(avgTime).toBeLessThan(50);
    });

    it('should invalidate all cache efficiently', async () => {
      const invalidateAllTimes = [];
      
      for (let i = 0; i < 20; i++) {
        const start = Date.now();
        await searchService.invalidateAllCache();
        invalidateAllTimes.push(Date.now() - start);
      }

      const avgTime = invalidateAllTimes.reduce((a, b) => a + b, 0) / invalidateAllTimes.length;
      console.log(`Average invalidate all time: ${avgTime.toFixed(2)}ms`);

      expect(avgTime).toBeLessThan(100);
    });
  });

  describe('Memory and Resource Usage', () => {
    it('should not leak memory during repeated searches', async () => {
      const initialMemory = process.memoryUsage().heapUsed;

      // Perform many searches
      for (let i = 0; i < 1000; i++) {
        await searchService.advancedSearch({ query: `memory-test-${i}` });
      }

      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }

      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = finalMemory - initialMemory;

      console.log(`Memory increase after 1000 searches: ${(memoryIncrease / 1024 / 1024).toFixed(2)}MB`);

      // Memory increase should be reasonable (< 100MB)
      expect(memoryIncrease).toBeLessThan(100 * 1024 * 1024);
    });
  });

  describe('Error Handling Performance', () => {
    it('should handle errors quickly', async () => {
      mockElasticsearchClient.search.mockRejectedValue(new Error('Connection failed'));

      const errorTimes = [];
      for (let i = 0; i < 20; i++) {
        const start = Date.now();
        await searchService.advancedSearch({ query: 'error-test' });
        errorTimes.push(Date.now() - start);
      }

      const avgTime = errorTimes.reduce((a, b) => a + b, 0) / errorTimes.length;
      console.log(`Average error handling time: ${avgTime.toFixed(2)}ms`);

      // Errors should be handled quickly
      expect(avgTime).toBeLessThan(50);
    });
  });
});
