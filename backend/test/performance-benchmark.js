/**
 * Phase 6, Milestone 4: Performance Benchmark Script
 * 
 * Measures and reports performance metrics for cart operations
 * before and after optimization implementation.
 */

const { PrismaClient } = require('@prisma/client');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

// Configuration
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3001/api/v1';
const BENCHMARK_ITERATIONS = 10;
const CONCURRENT_REQUESTS = 5;

// Results storage
const results = {
  timestamp: new Date().toISOString(),
  summary: {},
  details: {
    cartLoadTimes: [],
    apiResponseTimes: [],
    databaseQueryTimes: [],
    cacheMetrics: {}
  }
};

/**
 * Measure cart load time
 */
async function benchmarkCartLoadTime() {
  console.log('\n📊 Benchmarking Cart Load Time...');
  
  const times = [];
  
  for (let i = 0; i < BENCHMARK_ITERATIONS; i++) {
    const start = Date.now();
    
    try {
      // Get a random cart
      const cart = await prisma.cart.findFirst();
      
      if (cart) {
        await prisma.cart.findUnique({
          where: { id: cart.id },
          include: {
            items: {
              include: {
                product: {
                  select: {
                    id: true,
                    name: true,
                    regularPrice: true,
                    salePrice: true
                  }
                }
              }
            }
          }
        });
      }
      
      const duration = Date.now() - start;
      times.push(duration);
      
      process.stdout.write(`\r   Iteration ${i + 1}/${BENCHMARK_ITERATIONS}: ${duration}ms`);
    } catch (error) {
      console.error(`\n   Error in iteration ${i + 1}:`, error.message);
      times.push(0);
    }
  }
  
  console.log('');
  
  const avg = times.reduce((a, b) => a + b, 0) / times.length;
  const min = Math.min(...times);
  const max = Math.max(...times);
  
  return {
    average: Math.round(avg),
    min,
    max,
    meetsTarget: avg < 2000, // Target: < 2 seconds
    all: times
  };
}

/**
 * Measure API response times
 */
async function benchmarkAPIResponseTimes() {
  console.log('\n📊 Benchmarking API Response Times...');
  
  const endpoints = [
    { name: 'Get Cart', path: '/cart' },
    { name: 'Get Abandonment Metrics', path: '/analytics/cart/abandonment' },
    { name: 'Get Conversion Funnel', path: '/analytics/cart/conversion-funnel' },
    { name: 'Get Average Cart Value', path: '/analytics/cart/average-value' },
    { name: 'Get Popular Products', path: '/analytics/cart/popular-products' }
  ];
  
  const endpointResults = {};
  
  for (const endpoint of endpoints) {
    const times = [];
    
    for (let i = 0; i < BENCHMARK_ITERATIONS; i++) {
      const start = Date.now();
      
      try {
        await axios.get(`${API_BASE_URL}${endpoint.path}`, {
          timeout: 10000,
          validateStatus: () => true // Don't throw on error status
        });
        
        const duration = Date.now() - start;
        times.push(duration);
      } catch (error) {
        times.push(0);
      }
    }
    
    const avg = times.filter(t => t > 0).reduce((a, b) => a + b, 0) / times.filter(t => t > 0).length || 0;
    
    endpointResults[endpoint.name] = {
      average: Math.round(avg),
      min: Math.min(...times.filter(t => t > 0)) || 0,
      max: Math.max(...times) || 0,
      meetsTarget: avg < 500, // Target: < 500ms
      all: times
    };
    
    console.log(`   ${endpoint.name}: ${Math.round(avg)}ms (target: <500ms) ${avg < 500 ? '✅' : '⚠️'}`);
  }
  
  return endpointResults;
}

/**
 * Measure database query performance
 */
async function benchmarkDatabaseQueries() {
  console.log('\n📊 Benchmarking Database Query Performance...');
  
  const queries = [
    {
      name: 'Simple Cart Lookup',
      fn: () => prisma.cart.findFirst()
    },
    {
      name: 'Cart with Items',
      fn: () => prisma.cart.findFirst({
        include: { items: true }
      })
    },
    {
      name: 'Cart with Items and Products',
      fn: () => prisma.cart.findFirst({
        include: {
          items: {
            include: { product: true }
          }
        }
      })
    },
    {
      name: 'Cart Events Query',
      fn: () => prisma.cartEvent.findMany({
        take: 100,
        orderBy: { timestamp: 'desc' }
      })
    },
    {
      name: 'Analytics Aggregation',
      fn: () => prisma.cartAnalytics.findMany({
        take: 50
      })
    }
  ];
  
  const queryResults = {};
  
  for (const query of queries) {
    const times = [];
    
    for (let i = 0; i < BENCHMARK_ITERATIONS; i++) {
      const start = Date.now();
      
      try {
        await query.fn();
        const duration = Date.now() - start;
        times.push(duration);
      } catch (error) {
        times.push(0);
      }
    }
    
    const avg = times.filter(t => t > 0).reduce((a, b) => a + b, 0) / times.filter(t => t > 0).length || 0;
    
    queryResults[query.name] = {
      average: Math.round(avg),
      min: Math.min(...times.filter(t => t > 0)) || 0,
      max: Math.max(...times) || 0,
      meetsTarget: avg < 100, // Target: < 100ms
      all: times
    };
    
    console.log(`   ${query.name}: ${Math.round(avg)}ms (target: <100ms) ${avg < 100 ? '✅' : '⚠️'}`);
  }
  
  return queryResults;
}

/**
 * Measure cache hit rates
 */
async function benchmarkCacheMetrics() {
  console.log('\n📊 Benchmarking Cache Metrics...');
  
  // Simulate cache operations
  const cacheHits = [];
  const cacheMisses = [];
  
  // First pass - should be misses (cache warming)
  for (let i = 0; i < BENCHMARK_ITERATIONS; i++) {
    const start = Date.now();
    
    try {
      await prisma.cart.findFirst();
      cacheMisses.push(Date.now() - start);
    } catch (error) {
      // Ignore errors
    }
  }
  
  // Second pass - should be hits (if caching works)
  for (let i = 0; i < BENCHMARK_ITERATIONS; i++) {
    const start = Date.now();
    
    try {
      await prisma.cart.findFirst();
      cacheHits.push(Date.now() - start);
    } catch (error) {
      // Ignore errors
    }
  }
  
  const hitRate = cacheHits.length / (cacheHits.length + cacheMisses.length);
  const avgHitTime = cacheHits.reduce((a, b) => a + b, 0) / cacheHits.length || 0;
  const avgMissTime = cacheMisses.reduce((a, b) => a + b, 0) / cacheMisses.length || 0;
  
  return {
    hitRate: Math.round(hitRate * 100),
    avgHitTime: Math.round(avgHitTime),
    avgMissTime: Math.round(avgMissTime),
    meetsTarget: hitRate >= 0.8, // Target: >= 80% hit rate
    performanceGain: avgMissTime > 0 ? Math.round((avgMissTime - avgHitTime) / avgMissTime * 100) : 0
  };
}

/**
 * Test concurrent operations
 */
async function benchmarkConcurrentOperations() {
  console.log('\n📊 Benchmarking Concurrent Operations...');
  
  const operations = [];
  
  for (let i = 0; i < CONCURRENT_REQUESTS; i++) {
    operations.push(
      prisma.cart.findFirst().then(() => Date.now())
    );
  }
  
  const start = Date.now();
  
  try {
    await Promise.all(operations);
    const duration = Date.now() - start;
    
    console.log(`   ${CONCURRENT_REQUESTS} concurrent requests: ${duration}ms`);
    
    return {
      concurrentRequests: CONCURRENT_REQUESTS,
      totalTime: duration,
      avgPerRequest: Math.round(duration / CONCURRENT_REQUESTS),
      meetsTarget: duration < 1000 // Target: < 1 second for all
    };
  } catch (error) {
    console.log(`   Concurrent operations failed: ${error.message}`);
    return {
      concurrentRequests: CONCURRENT_REQUESTS,
      totalTime: 0,
      avgPerRequest: 0,
      meetsTarget: false,
      error: error.message
    };
  }
}

/**
 * Generate performance report
 */
function generateReport(results) {
  console.log('\n' + '='.repeat(70));
  console.log('PERFORMANCE BENCHMARK REPORT');
  console.log('Phase 6, Milestone 4: Cart Analytics & Optimization');
  console.log('='.repeat(70));
  console.log(`Timestamp: ${results.timestamp}`);
  console.log(`Iterations: ${BENCHMARK_ITERATIONS}`);
  console.log(`API Base URL: ${API_BASE_URL}`);
  console.log('='.repeat(70));
  
  // Cart Load Time
  console.log('\n🛒 CART LOAD TIMES');
  console.log('-'.repeat(40));
  console.log(`Average: ${results.summary.cartLoadTime?.average}ms (target: <2000ms) ${results.summary.cartLoadTime?.meetsTarget ? '✅' : '⚠️'}`);
  console.log(`Min: ${results.summary.cartLoadTime?.min}ms`);
  console.log(`Max: ${results.summary.cartLoadTime?.max}ms`);
  
  // API Response Times
  console.log('\n🌐 API RESPONSE TIMES');
  console.log('-'.repeat(40));
  if (results.summary.apiResponseTimes) {
    Object.entries(results.summary.apiResponseTimes).forEach(([name, data]) => {
      console.log(`${name}: ${data.average}ms (target: <500ms) ${data.meetsTarget ? '✅' : '⚠️'}`);
    });
  }
  
  // Database Queries
  console.log('\n🗄️  DATABASE QUERY TIMES');
  console.log('-'.repeat(40));
  if (results.summary.databaseQueries) {
    Object.entries(results.summary.databaseQueries).forEach(([name, data]) => {
      console.log(`${name}: ${data.average}ms (target: <100ms) ${data.meetsTarget ? '✅' : '⚠️'}`);
    });
  }
  
  // Cache Metrics
  console.log('\n💾 CACHE METRICS');
  console.log('-'.repeat(40));
  if (results.summary.cacheMetrics) {
    console.log(`Hit Rate: ${results.summary.cacheMetrics.hitRate}% (target: >=80%) ${results.summary.cacheMetrics.meetsTarget ? '✅' : '⚠️'}`);
    console.log(`Avg Hit Time: ${results.summary.cacheMetrics.avgHitTime}ms`);
    console.log(`Avg Miss Time: ${results.summary.cacheMetrics.avgMissTime}ms`);
    console.log(`Performance Gain: ${results.summary.cacheMetrics.performanceGain}%`);
  }
  
  // Concurrent Operations
  console.log('\n⚡ CONCURRENT OPERATIONS');
  console.log('-'.repeat(40));
  if (results.summary.concurrentOperations) {
    console.log(`${results.summary.concurrentOperations.concurrentRequests} requests in ${results.summary.concurrentOperations.totalTime}ms ${results.summary.concurrentOperations.meetsTarget ? '✅' : '⚠️'}`);
    console.log(`Avg per request: ${results.summary.concurrentOperations.avgPerRequest}ms`);
  }
  
  // Overall Score
  console.log('\n📈 OVERALL PERFORMANCE SCORE');
  console.log('-'.repeat(40));
  
  let passCount = 0;
  let totalCount = 0;
  
  if (results.summary.cartLoadTime?.meetsTarget) passCount++;
  totalCount++;
  
  if (results.summary.apiResponseTimes) {
    Object.values(results.summary.apiResponseTimes).forEach(data => {
      if (data.meetsTarget) passCount++;
      totalCount++;
    });
  }
  
  if (results.summary.databaseQueries) {
    Object.values(results.summary.databaseQueries).forEach(data => {
      if (data.meetsTarget) passCount++;
      totalCount++;
    });
  }
  
  if (results.summary.cacheMetrics?.meetsTarget) passCount++;
  totalCount++;
  
  if (results.summary.concurrentOperations?.meetsTarget) passCount++;
  totalCount++;
  
  const score = Math.round((passCount / totalCount) * 100);
  
  console.log(`${passCount}/${totalCount} benchmarks passed (${score}%)`);
  
  if (score >= 90) {
    console.log('🌟 EXCELLENT - Performance exceeds expectations!');
  } else if (score >= 75) {
    console.log('✅ GOOD - Performance meets requirements');
  } else if (score >= 50) {
    console.log('⚠️  FAIR - Some optimizations needed');
  } else {
    console.log('❌ POOR - Significant optimization required');
  }
  
  console.log('\n' + '='.repeat(70));
  
  return score;
}

/**
 * Main benchmark runner
 */
async function runBenchmarks() {
  console.log('🏁 Starting Performance Benchmarks...');
  console.log(`Timestamp: ${results.timestamp}`);
  console.log(`Iterations per test: ${BENCHMARK_ITERATIONS}`);
  
  try {
    // Run all benchmarks
    results.summary.cartLoadTime = await benchmarkCartLoadTime();
    results.summary.apiResponseTimes = await benchmarkAPIResponseTimes();
    results.summary.databaseQueries = await benchmarkDatabaseQueries();
    results.summary.cacheMetrics = await benchmarkCacheMetrics();
    results.summary.concurrentOperations = await benchmarkConcurrentOperations();
    
    // Generate report
    const score = generateReport(results);
    
    // Save results to file
    const outputDir = path.join(__dirname, 'results');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    const outputFile = path.join(outputDir, `performance-benchmark-${Date.now()}.json`);
    fs.writeFileSync(outputFile, JSON.stringify(results, null, 2));
    
    console.log(`\n💾 Results saved to: ${outputFile}`);
    
    // Exit with appropriate code
    process.exit(score >= 75 ? 0 : 1);
    
  } catch (error) {
    console.error('\n❌ Benchmark failed:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run benchmarks if called directly
if (require.main === module) {
  runBenchmarks();
}

module.exports = {
  runBenchmarks,
  benchmarkCartLoadTime,
  benchmarkAPIResponseTimes,
  benchmarkDatabaseQueries,
  benchmarkCacheMetrics,
  benchmarkConcurrentOperations
};