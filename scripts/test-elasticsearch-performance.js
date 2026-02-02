/**
 * Elasticsearch Performance Testing Script
 * 
 * This script tests various query types (search, aggregations, filters) and measures
 * response times to validate that queries complete within the 300ms target.
 * 
 * Usage:
 *   node scripts/test-elasticsearch-performance.js
 *   node scripts/test-elasticsearch-performance.js --iterations 100
 *   node scripts/test-elasticsearch-performance.js --warmup
 *   node scripts/test-elasticsearch-performance.js --report json
 */

const path = require('path');
const fs = require('fs');

// Set up paths for backend modules
const backendPath = path.join(__dirname, '..', 'backend');
process.chdir(backendPath);

const { elasticsearchClientService } = require('./services/elasticsearch/client');
const { SearchService } = require('./services/elasticsearch/searchService');
const { IndexManager } = require('./services/elasticsearch/indexManager');
const { loggerService } = require('./services/logger');

/**
 * Performance test configuration
 */
const TEST_CONFIG = {
  // Performance targets (in milliseconds)
  TARGETS: {
    SEARCH_RESPONSE_TIME: 300,
    FILTER_RESPONSE_TIME: 100,
    AGGREGATION_RESPONSE_TIME: 200,
    GET_BY_ID_RESPONSE_TIME: 50
  },
  
  // Test settings
  DEFAULT_ITERATIONS: 50,
  WARMUP_ITERATIONS: 10,
  DELAY_BETWEEN_TESTS: 100, // ms
  
  // Report settings
  REPORT_DIR: path.join(__dirname, '..', 'test-reports'),
  REPORT_FORMAT: 'text' // 'text' or 'json'
};

/**
 * Performance test results collector
 */
class TestResults {
  constructor() {
    this.results = {
      summary: {
        totalTests: 0,
        passed: 0,
        failed: 0,
        startTime: null,
        endTime: null,
        duration: 0
      },
      tests: {},
      targets: TEST_CONFIG.TARGETS
    };
  }

  startTest(testName) {
    this.results.tests[testName] = {
      name: testName,
      durations: [],
      min: Infinity,
      max: 0,
      avg: 0,
      p50: 0,
      p95: 0,
      p99: 0,
      passed: false,
      errors: [],
      target: null
    };
  }

  addDuration(testName, duration) {
    const test = this.results.tests[testName];
    if (!test) return;

    test.durations.push(duration);
    test.min = Math.min(test.min, duration);
    test.max = Math.max(test.max, duration);
  }

  addError(testName, error) {
    const test = this.results.tests[testName];
    if (!test) return;
    test.errors.push(error);
  }

  calculateStatistics(testName) {
    const test = this.results.tests[testName];
    if (!test || test.durations.length === 0) return;

    const sorted = [...test.durations].sort((a, b) => a - b);
    const sum = sorted.reduce((a, b) => a + b, 0);

    test.avg = (sum / sorted.length).toFixed(2);
    test.p50 = sorted[Math.floor(sorted.length * 0.50)];
    test.p95 = sorted[Math.floor(sorted.length * 0.95)];
    test.p99 = sorted[Math.floor(sorted.length * 0.99)];
  }

  setTarget(testName, target) {
    const test = this.results.tests[testName];
    if (!test) return;
    test.target = target;
  }

  checkPass(testName) {
    const test = this.results.tests[testName];
    if (!test || !test.target) return;

    test.passed = test.p95 <= test.target;
  }

  finalize() {
    this.results.summary.endTime = new Date().toISOString();
    this.results.summary.duration = 
      new Date(this.results.summary.endTime) - new Date(this.results.summary.startTime);

    let totalTests = 0;
    let passed = 0;
    let failed = 0;

    for (const testName in this.results.tests) {
      if (testName === 'summary') continue;
      const test = this.results.tests[testName];
      totalTests++;
      if (test.passed) {
        passed++;
      } else {
        failed++;
      }
    }

    this.results.summary.totalTests = totalTests;
    this.results.summary.passed = passed;
    this.results.summary.failed = failed;
  }

  getResults() {
    return this.results;
  }
}

/**
 * Performance test runner
 */
class PerformanceTestRunner {
  constructor() {
    this.client = null;
    this.searchService = null;
    this.indexManager = null;
    this.results = new TestResults();
    this.warmup = false;
  }

  /**
   * Initialize services
   */
  async initialize() {
    try {
      console.log('Initializing Elasticsearch Performance Test Runner...\n');

      // Initialize client service
      const initResult = await elasticsearchClientService.initialize({
        enableMonitoring: false
      });

      if (!initResult.success) {
        throw new Error(`Failed to initialize Elasticsearch client: ${initResult.error}`);
      }

      this.client = elasticsearchClientService.getClient();
      this.indexManager = new IndexManager(this.client);

      // Initialize search service
      this.searchService = new SearchService(this.client, this.indexManager);
      const searchInitResult = await this.searchService.initialize();

      if (!searchInitResult.success) {
        console.warn('Warning: Search service initialization failed:', searchInitResult.error);
      }

      console.log('✓ Elasticsearch client initialized\n');
      return true;
    } catch (error) {
      console.error('✗ Failed to initialize:', error.message);
      throw error;
    }
  }

  /**
   * Run a single test iteration
   */
  async runTestIteration(testName, testFunction, iterations) {
    this.results.startTest(testName);
    console.log(`\nRunning test: ${testName}`);
    console.log(`Iterations: ${iterations}`);

    for (let i = 0; i < iterations; i++) {
      try {
        const startTime = Date.now();
        await testFunction();
        const duration = Date.now() - startTime;

        this.results.addDuration(testName, duration);

        if (i % 10 === 0 && i > 0) {
          console.log(`  Progress: ${i}/${iterations} iterations completed`);
        }

        // Small delay between iterations
        if (i < iterations - 1) {
          await this.sleep(TEST_CONFIG.DELAY_BETWEEN_TESTS);
        }
      } catch (error) {
        this.results.addError(testName, error.message);
        console.error(`  ✗ Error in iteration ${i + 1}:`, error.message);
      }
    }

    this.results.calculateStatistics(testName);
  }

  /**
   * Test: Basic product search
   */
  async testBasicSearch(iterations) {
    const testName = 'basic_search';
    const target = TEST_CONFIG.TARGETS.SEARCH_RESPONSE_TIME;

    await this.runTestIteration(testName, async () => {
      const result = await this.searchService.searchProducts({
        query: 'laptop',
        page: 1,
        size: 20,
        useCache: false
      });

      if (!result.success) {
        throw new Error(result.error || 'Search failed');
      }
    }, iterations);

    this.results.setTarget(testName, target);
    this.results.checkPass(testName);

    const test = this.results.getResults().tests[testName];
    console.log(`  Average: ${test.avg}ms | P95: ${test.p95}ms | Target: ${target}ms`);
    console.log(`  Status: ${test.passed ? '✓ PASSED' : '✗ FAILED'}`);
  }

  /**
   * Test: Complex search with filters
   */
  async testSearchWithFilters(iterations) {
    const testName = 'search_with_filters';
    const target = TEST_CONFIG.TARGETS.SEARCH_RESPONSE_TIME;

    await this.runTestIteration(testName, async () => {
      const result = await this.searchService.searchProducts({
        query: 'phone',
        filters: {
          priceRange: { min: 100, max: 1000 },
          category: 'Electronics',
          inStock: true
        },
        page: 1,
        size: 20,
        useCache: false
      });

      if (!result.success) {
        throw new Error(result.error || 'Search with filters failed');
      }
    }, iterations);

    this.results.setTarget(testName, target);
    this.results.checkPass(testName);

    const test = this.results.getResults().tests[testName];
    console.log(`  Average: ${test.avg}ms | P95: ${test.p95}ms | Target: ${target}ms`);
    console.log(`  Status: ${test.passed ? '✓ PASSED' : '✗ FAILED'}`);
  }

  /**
   * Test: Aggregations/Facets
   */
  async testAggregations(iterations) {
    const testName = 'aggregations';
    const target = TEST_CONFIG.TARGETS.AGGREGATION_RESPONSE_TIME;

    await this.runTestIteration(testName, async () => {
      const result = await this.searchService.getProductFacets({
        filters: {
          category: 'Electronics'
        },
        useCache: false
      });

      if (!result.success) {
        throw new Error(result.error || 'Aggregations failed');
      }
    }, iterations);

    this.results.setTarget(testName, target);
    this.results.checkPass(testName);

    const test = this.results.getResults().tests[testName];
    console.log(`  Average: ${test.avg}ms | P95: ${test.p95}ms | Target: ${target}ms`);
    console.log(`  Status: ${test.passed ? '✓ PASSED' : '✗ FAILED'}`);
  }

  /**
   * Test: Get product by ID
   */
  async testGetProductById(iterations) {
    const testName = 'get_product_by_id';
    const target = TEST_CONFIG.TARGETS.GET_BY_ID_RESPONSE_TIME;

    // First, find a valid product ID
    let productId = 'test-product-1';
    try {
      const searchResult = await this.searchService.searchProducts({
        query: '',
        page: 1,
        size: 1,
        useCache: false
      });

      if (searchResult.success && searchResult.hits && searchResult.hits.length > 0) {
        productId = searchResult.hits[0]._id;
      }
    } catch (error) {
      console.log('  Using default product ID for testing');
    }

    const finalProductId = productId;

    await this.runTestIteration(testName, async () => {
      const result = await this.searchService.getProductById(finalProductId);

      if (!result.success) {
        throw new Error(result.error || 'Get product by ID failed');
      }
    }, iterations);

    this.results.setTarget(testName, target);
    this.results.checkPass(testName);

    const test = this.results.getResults().tests[testName];
    console.log(`  Average: ${test.avg}ms | P95: ${test.p95}ms | Target: ${target}ms`);
    console.log(`  Status: ${test.passed ? '✓ PASSED' : '✗ FAILED'}`);
  }

  /**
   * Test: Category search
   */
  async testCategorySearch(iterations) {
    const testName = 'category_search';
    const target = TEST_CONFIG.TARGETS.SEARCH_RESPONSE_TIME;

    await this.runTestIteration(testName, async () => {
      const result = await this.searchService.searchCategories({
        query: 'electronics',
        page: 1,
        size: 20,
        useCache: false
      });

      if (!result.success) {
        throw new Error(result.error || 'Category search failed');
      }
    }, iterations);

    this.results.setTarget(testName, target);
    this.results.checkPass(testName);

    const test = this.results.getResults().tests[testName];
    console.log(`  Average: ${test.avg}ms | P95: ${test.p95}ms | Target: ${target}ms`);
    console.log(`  Status: ${test.passed ? '✓ PASSED' : '✗ FAILED'}`);
  }

  /**
   * Test: Brand search
   */
  async testBrandSearch(iterations) {
    const testName = 'brand_search';
    const target = TEST_CONFIG.TARGETS.SEARCH_RESPONSE_TIME;

    await this.runTestIteration(testName, async () => {
      const result = await this.searchService.searchBrands({
        query: 'tech',
        page: 1,
        size: 20,
        useCache: false
      });

      if (!result.success) {
        throw new Error(result.error || 'Brand search failed');
      }
    }, iterations);

    this.results.setTarget(testName, target);
    this.results.checkPass(testName);

    const test = this.results.getResults().tests[testName];
    console.log(`  Average: ${test.avg}ms | P95: ${test.p95}ms | Target: ${target}ms`);
    console.log(`  Status: ${test.passed ? '✓ PASSED' : '✗ FAILED'}`);
  }

  /**
   * Test: Large result set
   */
  async testLargeResultSet(iterations) {
    const testName = 'large_result_set';
    const target = TEST_CONFIG.TARGETS.SEARCH_RESPONSE_TIME;

    await this.runTestIteration(testName, async () => {
      const result = await this.searchService.searchProducts({
        query: '',
        page: 1,
        size: 100,
        useCache: false
      });

      if (!result.success) {
        throw new Error(result.error || 'Large result set search failed');
      }
    }, iterations);

    this.results.setTarget(testName, target);
    this.results.checkPass(testName);

    const test = this.results.getResults().tests[testName];
    console.log(`  Average: ${test.avg}ms | P95: ${test.p95}ms | Target: ${target}ms`);
    console.log(`  Status: ${test.passed ? '✓ PASSED' : '✗ FAILED'}`);
  }

  /**
   * Run warmup tests
   */
  async runWarmup() {
    console.log('\n' + '='.repeat(60));
    console.log('WARMUP PHASE');
    console.log('='.repeat(60));

    const warmupTests = [
      () => this.testBasicSearch(TEST_CONFIG.WARMUP_ITERATIONS),
      () => this.testSearchWithFilters(TEST_CONFIG.WARMUP_ITERATIONS),
      () => this.testAggregations(TEST_CONFIG.WARMUP_ITERATIONS)
    ];

    for (const test of warmupTests) {
      try {
        await test();
      } catch (error) {
        console.log(`Warmup test completed with errors: ${error.message}`);
      }
    }

    console.log('\nWarmup completed. Clearing results...\n');
    this.results = new TestResults();
  }

  /**
   * Run all performance tests
   */
  async runAllTests(iterations = TEST_CONFIG.DEFAULT_ITERATIONS) {
    this.results.getResults().summary.startTime = new Date().toISOString();

    console.log('='.repeat(60));
    console.log('ELASTICSEARCH PERFORMANCE TESTS');
    console.log('='.repeat(60));
    console.log(`Target Response Time: ${TEST_CONFIG.TARGETS.SEARCH_RESPONSE_TIME}ms`);
    console.log(`Iterations per test: ${iterations}`);
    console.log('='.repeat(60));

    // Run warmup if requested
    if (this.warmup) {
      await this.runWarmup();
    }

    // Run actual tests
    console.log('\n' + '='.repeat(60));
    console.log('TESTING PHASE');
    console.log('='.repeat(60));

    const tests = [
      () => this.testBasicSearch(iterations),
      () => this.testSearchWithFilters(iterations),
      () => this.testAggregations(iterations),
      () => this.testGetProductById(iterations),
      () => this.testCategorySearch(iterations),
      () => this.testBrandSearch(iterations),
      () => this.testLargeResultSet(iterations)
    ];

    for (const test of tests) {
      try {
        await test();
      } catch (error) {
        console.error(`\n✗ Test failed: ${error.message}`);
      }

      await this.sleep(500);
    }

    this.results.finalize();
  }

  /**
   * Generate text report
   */
  generateTextReport() {
    const results = this.results.getResults();
    const summary = results.summary;
    const targets = results.targets;

    let report = '\n';
    report += '='.repeat(60) + '\n';
    report += 'ELASTICSEARCH PERFORMANCE TEST REPORT\n';
    report += '='.repeat(60) + '\n\n';

    // Summary
    report += 'SUMMARY\n';
    report += '-'.repeat(60) + '\n';
    report += `Start Time:     ${summary.startTime}\n`;
    report += `End Time:       ${summary.endTime}\n`;
    report += `Duration:       ${summary.duration}ms\n`;
    report += `Total Tests:    ${summary.totalTests}\n`;
    report += `Passed:         ${summary.passed}\n`;
    report += `Failed:         ${summary.failed}\n`;
    report += `Success Rate:   ${((summary.passed / summary.totalTests) * 100).toFixed(2)}%\n\n`;

    // Performance Targets
    report += 'PERFORMANCE TARGETS\n';
    report += '-'.repeat(60) + '\n';
    report += `Search Response Time:     ${targets.SEARCH_RESPONSE_TIME}ms\n`;
    report += `Filter Response Time:     ${targets.FILTER_RESPONSE_TIME}ms\n`;
    report += `Aggregation Response Time: ${targets.AGGREGATION_RESPONSE_TIME}ms\n`;
    report += `Get By ID Response Time:  ${targets.GET_BY_ID_RESPONSE_TIME}ms\n\n`;

    // Test Results
    report += 'TEST RESULTS\n';
    report += '-'.repeat(60) + '\n';

    for (const testName in results.tests) {
      if (testName === 'summary') continue;
      const test = results.tests[testName];

      report += `\n${test.name.replace(/_/g, ' ').toUpperCase()}\n`;
      report += '  '.repeat(30) + '\n';
      report += `  Iterations:  ${test.durations.length}\n`;
      report += `  Min:         ${test.min}ms\n`;
      report += `  Max:         ${test.max}ms\n`;
      report += `  Average:     ${test.avg}ms\n`;
      report += `  P50:         ${test.p50}ms\n`;
      report += `  P95:         ${test.p95}ms\n`;
      report += `  P99:         ${test.p99}ms\n`;
      if (test.target) {
        report += `  Target:      ${test.target}ms\n`;
        report += `  Status:      ${test.passed ? '✓ PASSED' : '✗ FAILED'}\n`;
      }
      if (test.errors.length > 0) {
        report += `  Errors:      ${test.errors.length}\n`;
      }
    }

    // Overall Assessment
    report += '\n' + '='.repeat(60) + '\n';
    report += 'OVERALL ASSESSMENT\n';
    report += '='.repeat(60) + '\n';

    if (summary.failed === 0) {
      report += '✓ ALL TESTS PASSED - Performance targets met!\n';
    } else {
      report += `✗ ${summary.failed} TEST(S) FAILED - Performance targets not met\n`;
      report += '\nRecommendations:\n';
      report += '  - Review slow queries and optimize indices\n';
      report += '  - Check Elasticsearch cluster health and resources\n';
      report += '  - Consider increasing hardware resources\n';
      report += '  - Review query complexity and add caching\n';
    }

    report += '\n' + '='.repeat(60) + '\n';

    return report;
  }

  /**
   * Generate JSON report
   */
  generateJsonReport() {
    return JSON.stringify(this.results.getResults(), null, 2);
  }

  /**
   * Save report to file
   */
  async saveReport(format = TEST_CONFIG.REPORT_FORMAT) {
    const results = this.results.getResults();
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    
    // Ensure report directory exists
    if (!fs.existsSync(TEST_CONFIG.REPORT_DIR)) {
      fs.mkdirSync(TEST_CONFIG.REPORT_DIR, { recursive: true });
    }

    const filename = `elasticsearch-performance-${timestamp}.${format === 'json' ? 'json' : 'txt'}`;
    const filepath = path.join(TEST_CONFIG.REPORT_DIR, filename);

    const content = format === 'json' 
      ? this.generateJsonReport() 
      : this.generateTextReport();

    fs.writeFileSync(filepath, content, 'utf8');
    console.log(`\nReport saved to: ${filepath}`);

    return filepath;
  }

  /**
   * Sleep utility
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Shutdown
   */
  async shutdown() {
    try {
      if (this.searchService) {
        await this.searchService.shutdown();
      }
      await elasticsearchClientService.shutdown();
      console.log('\n✓ Test runner shutdown complete');
    } catch (error) {
      console.error('Error during shutdown:', error.message);
    }
  }
}

/**
 * Parse command line arguments
 */
function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    iterations: TEST_CONFIG.DEFAULT_ITERATIONS,
    warmup: false,
    reportFormat: TEST_CONFIG.REPORT_FORMAT
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    const nextArg = args[i + 1];

    if (arg === '--iterations' || arg === '-i') {
      options.iterations = parseInt(nextArg) || TEST_CONFIG.DEFAULT_ITERATIONS;
      i++;
    } else if (arg === '--warmup' || arg === '-w') {
      options.warmup = true;
    } else if (arg === '--report' || arg === '-r') {
      options.reportFormat = nextArg === 'json' ? 'json' : 'text';
      i++;
    } else if (arg === '--help' || arg === '-h') {
      console.log(`
Elasticsearch Performance Testing Script

Usage:
  node scripts/test-elasticsearch-performance.js [options]

Options:
  --iterations, -i <number>  Number of iterations per test (default: 50)
  --warmup, -w               Run warmup tests before actual tests
  --report, -r <format>      Report format: text or json (default: text)
  --help, -h                 Show this help message

Examples:
  node scripts/test-elasticsearch-performance.js
  node scripts/test-elasticsearch-performance.js --iterations 100
  node scripts/test-elasticsearch-performance.js --warmup --report json
      `);
      process.exit(0);
    }
  }

  return options;
}

/**
 * Main execution
 */
async function main() {
  const options = parseArgs();
  const runner = new PerformanceTestRunner();
  runner.warmup = options.warmup;

  try {
    await runner.initialize();
    await runner.runAllTests(options.iterations);

    // Generate and display report
    const report = options.reportFormat === 'json' 
      ? runner.generateJsonReport() 
      : runner.generateTextReport();
    
    console.log(report);

    // Save report
    await runner.saveReport(options.reportFormat);

    const results = runner.results.getResults();
    const exitCode = results.summary.failed > 0 ? 1 : 0;
    process.exit(exitCode);

  } catch (error) {
    console.error('\n✗ Performance testing failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    await runner.shutdown();
  }
}

// Run if executed directly
if (require.main === module) {
  main().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

module.exports = { PerformanceTestRunner, TEST_CONFIG };
