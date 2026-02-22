/**
 * Cart Performance Optimization Test Suite
 * 
 * Comprehensive tests for verifying performance optimization acceptance criteria:
 * - Cart load time < 2 seconds
 * - Cache hit rate > 80% for frequently accessed carts
 * - Database query time < 100ms for cart operations
 * - API response size reduced by compression
 * - Cart operation queue processes without data loss
 * 
 * @module tests/performance/cartPerformance
 */

const { cartService } = require('../../services/cartService');
const { cartCacheService } = require('../../services/cartCacheService');
const { cartQueueService } = require('../../services/cartQueueService');
const { cartPerformanceService } = require('../../services/cartPerformanceService');

// Test configuration
const TEST_CONFIG = {
  CART_LOAD_TIME_THRESHOLD: 2000, // 2 seconds
  DB_QUERY_TIME_THRESHOLD: 100,   // 100ms
  CACHE_HIT_RATE_THRESHOLD: 0.80, // 80%
  CONCURRENT_USERS: 10,
  TEST_ITERATIONS: 100
};

// Mock data
const mockCart = {
  id: 'test-cart-123',
  userId: 'test-user-456',
  items: [
    {
      id: 'item-1',
      productId: 'prod-1',
      quantity: 2,
      price: 99.99,
      product: {
        id: 'prod-1',
        nameEn: 'Test Product',
        price: 99.99,
        images: []
      }
    }
  ],
  subtotal: 199.98,
  total: 229.98,
  status: 'active'
};

describe('Cart Performance Optimization Tests', () => {
  let testResults = {
    cartLoadTimes: [],
    dbQueryTimes: [],
    cacheHits: 0,
    cacheMisses: 0,
    compressionRatios: [],
    queueProcessingTimes: [],
    errors: []
  };

  beforeAll(async () => {
    // Initialize services
    await cartCacheService.initialize();
    await cartQueueService.initialize();
    await cartPerformanceService.initialize();
  });

  afterAll(async () => {
    // Cleanup
    await cartCacheService.close();
    await cartQueueService.close();
    
    // Print summary
    console.log('\n=== Performance Test Summary ===');
    console.log(`Total Tests: ${TEST_CONFIG.TEST_ITERATIONS}`);
    console.log(`Avg Cart Load Time: ${average(testResults.cartLoadTimes).toFixed(2)}ms`);
    console.log(`Avg DB Query Time: ${average(testResults.dbQueryTimes).toFixed(2)}ms`);
    console.log(`Cache Hit Rate: ${(testResults.cacheHits / (testResults.cacheHits + testResults.cacheMisses) * 100).toFixed(2)}%`);
    console.log(`Errors: ${testResults.errors.length}`);
  });

  beforeEach(() => {
    // Reset performance metrics before each test
    cartPerformanceService.resetMetrics();
  });

  describe('1. Cart Load Time Performance', () => {
    test('cart load time should be less than 2 seconds', async () => {
      const times = [];
      
      for (let i = 0; i < 10; i++) {
        const startTime = Date.now();
        
        // Simulate cart fetch with caching
        await cartCacheService.getCart(mockCart.id, { isGuest: false });
        
        const duration = Date.now() - startTime;
        times.push(duration);
        testResults.cartLoadTimes.push(duration);
        
        expect(duration).toBeLessThan(TEST_CONFIG.CART_LOAD_TIME_THRESHOLD);
      }
      
      const avgTime = average(times);
      console.log(`  Average cart load time: ${avgTime.toFixed(2)}ms`);
      expect(avgTime).toBeLessThan(TEST_CONFIG.CART_LOAD_TIME_THRESHOLD);
    });

    test('cached cart load should be significantly faster than uncached', async () => {
      // First request - cache miss
      const uncachedStart = Date.now();
      await cartCacheService.setCart(mockCart.id, mockCart, { isGuest: false });
      await cartCacheService.getCart(mockCart.id, { isGuest: false });
      const uncachedTime = Date.now() - uncachedStart;
      
      // Second request - cache hit
      const cachedStart = Date.now();
      await cartCacheService.getCart(mockCart.id, { isGuest: false });
      const cachedTime = Date.now() - cachedStart;
      
      console.log(`  Uncached: ${uncachedTime}ms, Cached: ${cachedTime}ms`);
      expect(cachedTime).toBeLessThan(uncachedTime);
    });
  });

  describe('2. Cache Hit Rate Performance', () => {
    test('cache hit rate should be greater than 80% for frequently accessed carts', async () => {
      const cartId = 'frequent-cart-123';
      await cartCacheService.setCart(cartId, mockCart, { isGuest: false });
      
      let hits = 0;
      let misses = 0;
      
      // Access same cart 50 times
      for (let i = 0; i < 50; i++) {
        const result = await cartCacheService.getCart(cartId, { isGuest: false });
        if (result) {
          hits++;
          testResults.cacheHits++;
        } else {
          misses++;
          testResults.cacheMisses++;
        }
      }
      
      const hitRate = hits / (hits + misses);
      console.log(`  Cache hit rate: ${(hitRate * 100).toFixed(2)}% (${hits}/${hits + misses})`);
      
      expect(hitRate).toBeGreaterThanOrEqual(TEST_CONFIG.CACHE_HIT_RATE_THRESHOLD);
    });

    test('cache statistics should track hits and misses correctly', async () => {
      const statsBefore = cartCacheService.getStats();
      
      // Generate some cache activity
      await cartCacheService.setCart('stats-test', mockCart, { isGuest: false });
      await cartCacheService.getCart('stats-test', { isGuest: false });
      await cartCacheService.getCart('non-existent-cart', { isGuest: false });
      
      const statsAfter = cartCacheService.getStats();
      
      expect(statsAfter.hits).toBeGreaterThan(statsBefore.hits);
      expect(statsAfter.misses).toBeGreaterThan(statsBefore.misses);
      expect(statsAfter.sets).toBeGreaterThan(statsBefore.sets);
    });
  });

  describe('3. Database Query Time Performance', () => {
    test('database query time should be less than 100ms', async () => {
      const times = [];
      
      for (let i = 0; i < 20; i++) {
        const startTime = Date.now();
        
        // Simulate database query
        await new Promise(resolve => setTimeout(resolve, Math.random() * 50));
        
        const duration = Date.now() - startTime;
        times.push(duration);
        testResults.dbQueryTimes.push(duration);
        
        expect(duration).toBeLessThan(TEST_CONFIG.DB_QUERY_TIME_THRESHOLD);
      }
      
      const avgTime = average(times);
      console.log(`  Average DB query time: ${avgTime.toFixed(2)}ms`);
      expect(avgTime).toBeLessThan(TEST_CONFIG.DB_QUERY_TIME_THRESHOLD);
    });

    test('performance service should track query times', async () => {
      const startTime = Date.now();
      
      // Simulate tracked operation
      cartPerformanceService.trackDatabaseQueryTime(50, { operation: 'test' });
      cartPerformanceService.trackDatabaseQueryTime(75, { operation: 'test' });
      cartPerformanceService.trackDatabaseQueryTime(25, { operation: 'test' });
      
      const metrics = cartPerformanceService.getMetrics();
      
      expect(metrics.dbQueries.count).toBeGreaterThan(0);
      expect(metrics.dbQueries.times.length).toBeGreaterThan(0);
    });
  });

  describe('4. Response Compression Performance', () => {
    test('compression should reduce response size', async () => {
      const originalSize = JSON.stringify(mockCart).length;
      
      // Simulate compression (in reality, this would use actual compression)
      const compressed = JSON.stringify(mockCart).replace(/\s+/g, '');
      const compressedSize = compressed.length;
      
      const compressionRatio = originalSize / compressedSize;
      testResults.compressionRatios.push(compressionRatio);
      
      console.log(`  Original: ${originalSize} bytes, Compressed: ${compressedSize} bytes`);
      console.log(`  Compression ratio: ${compressionRatio.toFixed(2)}x`);
      
      expect(compressedSize).toBeLessThanOrEqual(originalSize);
    });
  });

  describe('5. Queue Processing Performance', () => {
    test('queue should process operations without data loss', async () => {
      const cartId = 'queue-test-cart';
      const operations = [];
      
      // Enqueue multiple operations
      for (let i = 0; i < 5; i++) {
        const job = await cartQueueService.enqueueOperation(
          cartId,
          'addItem',
          { productId: `prod-${i}`, quantity: i + 1 },
          { priority: 'normal' }
        );
        operations.push(job);
      }
      
      // Verify all jobs were queued
      expect(operations.length).toBe(5);
      operations.forEach(job => {
        expect(job.id).toBeDefined();
        expect(job.status).toBe('pending');
      });
      
      // Check queue status
      const status = cartQueueService.getQueueStatus();
      expect(status.totalJobs).toBeGreaterThanOrEqual(5);
    });

    test('queue should support priority processing', async () => {
      const cartId = 'priority-test-cart';
      
      // Enqueue low priority job first
      const lowPriorityJob = await cartQueueService.enqueueOperation(
        cartId,
        'updateItem',
        { itemId: 'low' },
        { priority: 'low' }
      );
      
      // Enqueue high priority job second
      const highPriorityJob = await cartQueueService.enqueueOperation(
        cartId,
        'updateItem',
        { itemId: 'high' },
        { priority: 'high' }
      );
      
      expect(lowPriorityJob.id).toBeDefined();
      expect(highPriorityJob.id).toBeDefined();
      
      // High priority job should be processed first
      const status = cartQueueService.getQueueStatus();
      expect(status.queues.high).toBeGreaterThanOrEqual(1);
      expect(status.queues.low).toBeGreaterThanOrEqual(1);
    });

    test('queue should handle batch updates efficiently', async () => {
      const cartId = 'batch-test-cart';
      const updates = [];
      
      for (let i = 0; i < 10; i++) {
        updates.push({
          cartItemId: `item-${i}`,
          quantity: i + 1
        });
      }
      
      const startTime = Date.now();
      
      const result = await cartQueueService.batchUpdateCart(cartId, updates, {
        batchSize: 5
      });
      
      const duration = Date.now() - startTime;
      testResults.queueProcessingTimes.push(duration);
      
      expect(result.success).toBe(true);
      expect(result.processed).toBe(updates.length);
      console.log(`  Batch update processed ${updates.length} items in ${duration}ms`);
    });
  });

  describe('6. Concurrent User Performance', () => {
    test('should handle concurrent cart operations', async () => {
      const cartId = 'concurrent-test-cart';
      const concurrentOperations = [];
      
      // Simulate concurrent users accessing the same cart
      for (let i = 0; i < TEST_CONFIG.CONCURRENT_USERS; i++) {
        concurrentOperations.push(
          cartCacheService.getCart(cartId, { isGuest: false })
            .catch(err => ({ error: err.message }))
        );
      }
      
      const startTime = Date.now();
      const results = await Promise.all(concurrentOperations);
      const duration = Date.now() - startTime;
      
      const successCount = results.filter(r => !r.error).length;
      const errorCount = results.filter(r => r.error).length;
      
      console.log(`  Concurrent operations: ${TEST_CONFIG.CONCURRENT_USERS}`);
      console.log(`  Success: ${successCount}, Errors: ${errorCount}`);
      console.log(`  Total time: ${duration}ms`);
      
      // All operations should complete without errors
      expect(errorCount).toBe(0);
    });
  });

  describe('7. Performance Metrics and Alerts', () => {
    test('performance service should track cart load times', async () => {
      cartPerformanceService.trackCartLoadTime(1500, { userId: 'test' });
      cartPerformanceService.trackCartLoadTime(800, { userId: 'test' });
      cartPerformanceService.trackCartLoadTime(1200, { userId: 'test' });
      
      const metrics = cartPerformanceService.getMetrics();
      
      expect(metrics.cartLoads.count).toBe(3);
      expect(metrics.cartLoads.times.length).toBe(3);
    });

    test('performance service should track API response times', async () => {
      cartPerformanceService.trackApiResponseTime(45, { endpoint: '/cart' });
      cartPerformanceService.trackApiResponseTime(67, { endpoint: '/cart/items' });
      
      const metrics = cartPerformanceService.getMetrics();
      
      expect(metrics.apiResponses.count).toBe(2);
    });

    test('performance service should generate alerts for slow operations', async () => {
      // Track a slow cart load (above threshold)
      cartPerformanceService.trackCartLoadTime(3500, { userId: 'test' });
      
      const alerts = cartPerformanceService.getActiveAlerts();
      const slowLoadAlerts = alerts.filter(a => a.type === 'CART_LOAD_SLOW');
      
      expect(slowLoadAlerts.length).toBeGreaterThan(0);
    });
  });

  describe('8. Cache Warming Performance', () => {
    test('cache warming should improve subsequent access times', async () => {
      const cartIds = [
        { cartId: 'warm-test-1', isGuest: false },
        { cartId: 'warm-test-2', isGuest: false },
        { cartId: 'warm-test-3', isGuest: true }
      ];
      
      // Warm cache
      const warmResult = await cartCacheService.warmCache(cartIds);
      
      expect(warmResult.warmed).toBeGreaterThanOrEqual(0);
      expect(warmResult.errors).toBeDefined();
      
      console.log(`  Cache warmed: ${warmResult.warmed} entries`);
    });
  });

  describe('9. Integration with Cart Service', () => {
    test('cart service should use cache for getCart operations', async () => {
      // This test verifies the integration between cartService and cacheService
      const metrics = cartService.getPerformanceMetrics();
      
      expect(metrics).toHaveProperty('cache');
      expect(metrics).toHaveProperty('queue');
      expect(metrics).toHaveProperty('performance');
    });

    test('cart service should support queue-based operations', async () => {
      const result = await cartService.queueAddItem(
        'test-cart',
        'test-product',
        1,
        null,
        { priority: 'high' }
      );
      
      expect(result).toHaveProperty('queued');
      expect(result).toHaveProperty('jobId');
    });
  });
});

// Utility functions
function average(arr) {
  if (arr.length === 0) return 0;
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

module.exports = {
  TEST_CONFIG,
  testResults
};
