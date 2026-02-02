/**
 * Elasticsearch Load Testing Script
 * 
 * This script simulates concurrent users/requests and tests under increasing load
 * to measure throughput and latency, identify performance bottlenecks, and validate
 * the system can handle expected traffic.
 * 
 * Usage:
 *   node scripts/test-elasticsearch-load.js
 *   node scripts/test-elasticsearch-load.js --concurrent 50,100,200
 *   node scripts/test-elasticsearch-load.js --duration 60
 *   node scripts/test-elasticsearch-load.js --report json
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
 * Load test configuration
 */
const LOAD_TEST_CONFIG = {
  // Performance targets
  TARGETS: {
    MAX_RESPONSE_TIME_P95: 300, // ms
    MAX_ERROR_RATE: 1, // percentage
    MIN_THROUGHPUT: 100 // requests per second
  },
  
  // Test settings
  DEFAULT_CONCURRENT_LEVELS: [10, 50, 100, 200],
  DEFAULT_DURATION: 30, // seconds per test level
  REQUESTS_PER_USER: 10,
  RAMP_UP_TIME: 5, // seconds
  
  // Report settings
  REPORT_DIR: path.join(__dirname, '..', 'test-reports'),
  REPORT_FORMAT: 'text' // 'text' or 'json'
};

/**
 * Load test results collector
 */
class LoadTestResults {
  constructor() {
    this.results = {
      summary: {
        startTime: null,
        endTime: null,
        totalDuration: 0,
        totalTests: 0,
        totalRequests: 0,
        totalErrors: 0,
        passedLevels: 0,
        failedLevels: 0
      },
      targets: LOAD_TEST_CONFIG.TARGETS,
      levels: []
    };
  }

  addLevel(level, levelResults) {
    this.results.levels.push({
      level,
      ...levelResults
    });
  }

  finalize() {
    this.results.summary.endTime = new Date().toISOString();
    this.results.summary.totalDuration = 
      new Date(this.results.summary.endTime) - new Date(this.results.summary.startTime);
    this.results.summary.totalTests = this.results.levels.length;
    this.results.summary.totalRequests = this.results.levels.reduce(
      (sum, level) => sum + level.totalRequests, 0
    );
    this.results.summary.totalErrors = this.results.levels.reduce(
      (sum, level) => sum + level.errors, 0
    );
    this.results.summary.passedLevels = this.results.levels.filter(
      level => level.passed
    ).length;
    this.results.summary.failedLevels = this.results.levels.filter(
      level => !level.passed
    ).length;
  }

  getResults() {
    return this.results;
  }
}

/**
 * Load test runner
 */
class LoadTestRunner {
  constructor() {
    this.client = null;
    this.searchService = null;
    this.indexManager = null;
    this.results = new LoadTestResults();
    this.isRunning = false;
  }

  /**
   * Initialize services
   */
  async initialize() {
    try {
      console.log('Initializing Elasticsearch Load Test Runner...\n');

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
   * Simulate a user making requests
   */
  async simulateUser(userId, duration, queryTypes) {
    const userResults = {
      userId,
      requests: 0,
      errors: 0,
      durations: [],
      startTime: Date.now()
    };

    const endTime = userResults.startTime + (duration * 1000);

    while (Date.now() < endTime && this.isRunning) {
      const queryType = queryTypes[Math.floor(Math.random() * queryTypes.length)];
      const startTime = Date.now();

      try {
        await this.executeQuery(queryType);
        const duration = Date.now() - startTime;
        
        userResults.requests++;
        userResults.durations.push(duration);
      } catch (error) {
        userResults.errors++;
        userResults.durations.push(Date.now() - startTime);
      }

      // Small delay between requests
      await this.sleep(Math.random() * 100 + 50);
    }

    return userResults;
  }

  /**
   * Execute a query based on type
   */
  async executeQuery(queryType) {
    switch (queryType) {
      case 'basic_search':
        await this.searchService.searchProducts({
          query: ['laptop', 'phone', 'tablet', 'monitor', 'keyboard'][Math.floor(Math.random() * 5)],
          page: 1,
          size: 20,
          useCache: false
        });
        break;

      case 'search_with_filters':
        await this.searchService.searchProducts({
          query: '',
          filters: {
            priceRange: { min: 50, max: 1000 },
            inStock: true
          },
          page: 1,
          size: 20,
          useCache: false
        });
        break;

      case 'aggregations':
        await this.searchService.getProductFacets({
          useCache: false
        });
        break;

      case 'category_search':
        await this.searchService.searchCategories({
          query: ['electronics', 'clothing', 'books', 'home'][Math.floor(Math.random() * 4)],
          page: 1,
          size: 20,
          useCache: false
        });
        break;

      case 'brand_search':
        await this.searchService.searchBrands({
          query: '',
          page: 1,
          size: 20,
          useCache: false
        });
        break;

      default:
        throw new Error(`Unknown query type: ${queryType}`);
    }
  }

  /**
   * Run load test at a specific concurrency level
   */
  async runLoadLevel(concurrentUsers, duration) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`LOAD LEVEL: ${concurrentUsers} CONCURRENT USERS`);
    console.log(`Duration: ${duration} seconds`);
    console.log('='.repeat(60));

    const queryTypes = ['basic_search', 'search_with_filters', 'aggregations', 'category_search', 'brand_search'];
    const userPromises = [];
    const startTime = Date.now();

    this.isRunning = true;

    // Ramp up users
    console.log(`\nRamping up ${concurrentUsers} users over ${LOAD_TEST_CONFIG.RAMP_UP_TIME} seconds...`);
    const rampUpDelay = (LOAD_TEST_CONFIG.RAMP_UP_TIME * 1000) / concurrentUsers;

    for (let i = 0; i < concurrentUsers; i++) {
      const userId = i + 1;
      const userPromise = this.simulateUser(userId, duration, queryTypes);
      userPromises.push(userPromise);

      // Ramp up delay
      if (i < concurrentUsers - 1) {
        await this.sleep(rampUpDelay);
      }
    }

    // Wait for all users to complete
    console.log('\nAll users started. Waiting for test to complete...\n');
    const userResults = await Promise.all(userPromises);
    this.isRunning = false;

    const actualDuration = (Date.now() - startTime) / 1000;

    // Aggregate results
    const allDurations = userResults.flatMap(ur => ur.durations);
    const allErrors = userResults.reduce((sum, ur) => sum + ur.errors, 0);
    const allRequests = userResults.reduce((sum, ur) => sum + ur.requests, 0);

    const sortedDurations = allDurations.sort((a, b) => a - b);
    const avgDuration = (sortedDurations.reduce((a, b) => a + b, 0) / sortedDurations.length).toFixed(2);

    const levelResults = {
      concurrentUsers,
      duration: actualDuration.toFixed(2),
      totalRequests: allRequests,
      errors: allErrors,
      errorRate: ((allErrors / allRequests) * 100).toFixed(2),
      throughput: (allRequests / actualDuration).toFixed(2),
      minDuration: sortedDurations[0],
      maxDuration: sortedDurations[sortedDurations.length - 1],
      avgDuration,
      p50Duration: sortedDurations[Math.floor(sortedDurations.length * 0.50)],
      p95Duration: sortedDurations[Math.floor(sortedDurations.length * 0.95)],
      p99Duration: sortedDurations[Math.floor(sortedDurations.length * 0.99)],
      passed: true
    };

    // Check against targets
    if (levelResults.p95Duration > LOAD_TEST_CONFIG.TARGETS.MAX_RESPONSE_TIME_P95) {
      levelResults.passed = false;
      levelResults.failureReason = `P95 response time (${levelResults.p95Duration}ms) exceeds target (${LOAD_TEST_CONFIG.TARGETS.MAX_RESPONSE_TIME_P95}ms)`;
    }

    if (parseFloat(levelResults.errorRate) > LOAD_TEST_CONFIG.TARGETS.MAX_ERROR_RATE) {
      levelResults.passed = false;
      levelResults.failureReason = `Error rate (${levelResults.errorRate}%) exceeds target (${LOAD_TEST_CONFIG.MAX_ERROR_RATE}%)`;
    }

    this.results.addLevel(concurrentUsers, levelResults);

    // Print results
    console.log(`\nResults for ${concurrentUsers} concurrent users:`);
    console.log(`  Total Requests:    ${levelResults.totalRequests}`);
    console.log(`  Errors:            ${levelResults.errors}`);
    console.log(`  Error Rate:        ${levelResults.errorRate}%`);
    console.log(`  Throughput:        ${levelResults.throughput} req/s`);
    console.log(`  Min Duration:      ${levelResults.minDuration}ms`);
    console.log(`  Max Duration:      ${levelResults.maxDuration}ms`);
    console.log(`  Avg Duration:      ${levelResults.avgDuration}ms`);
    console.log(`  P50 Duration:      ${levelResults.p50Duration}ms`);
    console.log(`  P95 Duration:      ${levelResults.p95Duration}ms`);
    console.log(`  P99 Duration:      ${levelResults.p99Duration}ms`);
    console.log(`  Status:            ${levelResults.passed ? '✓ PASSED' : '✗ FAILED'}`);
    
    if (!levelResults.passed) {
      console.log(`  Failure Reason:    ${levelResults.failureReason}`);
    }

    return levelResults;
  }

  /**
   * Run all load tests
   */
  async runAllTests(concurrentLevels = LOAD_TEST_CONFIG.DEFAULT_CONCURRENT_LEVELS, duration = LOAD_TEST_CONFIG.DEFAULT_DURATION) {
    this.results.getResults().summary.startTime = new Date().toISOString();

    console.log('='.repeat(60));
    console.log('ELASTICSEARCH LOAD TESTS');
    console.log('='.repeat(60));
    console.log(`Concurrent Levels:  ${concurrentLevels.join(', ')}`);
    console.log(`Duration per Level: ${duration} seconds`);
    console.log(`Ramp-up Time:       ${LOAD_TEST_CONFIG.RAMP_UP_TIME} seconds`);
    console.log('='.repeat(60));

    for (const level of concurrentLevels) {
      try {
        await this.runLoadLevel(level, duration);
      } catch (error) {
        console.error(`\n✗ Load test at level ${level} failed:`, error.message);
        
        // Add failed level result
        this.results.addLevel(level, {
          concurrentUsers: level,
          duration: 0,
          totalRequests: 0,
          errors: 1,
          errorRate: 100,
          throughput: 0,
          minDuration: 0,
          maxDuration: 0,
          avgDuration: 0,
          p50Duration: 0,
          p95Duration: 0,
          p99Duration: 0,
          passed: false,
          failureReason: error.message
        });
      }

      // Cooldown between levels
      if (level !== concurrentLevels[concurrentLevels.length - 1]) {
        console.log('\nCooldown before next level...\n');
        await this.sleep(5000);
      }
    }

    this.results.finalize();
  }

  /**
   * Identify performance bottlenecks
   */
  identifyBottlenecks() {
    const results = this.results.getResults();
    const bottlenecks = [];

    for (const level of results.levels) {
      if (!level.passed) {
        if (level.p95Duration > LOAD_TEST_CONFIG.TARGETS.MAX_RESPONSE_TIME_P95) {
          bottlenecks.push({
            level: level.concurrentUsers,
            type: 'high_latency',
            severity: level.p95Duration > LOAD_TEST_CONFIG.TARGETS.MAX_RESPONSE_TIME_P95 * 2 ? 'critical' : 'warning',
            message: `P95 latency (${level.p95Duration}ms) exceeds target at ${level.concurrentUsers} concurrent users`,
            recommendation: 'Consider optimizing queries, adding more Elasticsearch nodes, or increasing hardware resources'
          });
        }

        if (parseFloat(level.errorRate) > LOAD_TEST_CONFIG.TARGETS.MAX_ERROR_RATE) {
          bottlenecks.push({
            level: level.concurrentUsers,
            type: 'high_error_rate',
            severity: parseFloat(level.errorRate) > 5 ? 'critical' : 'warning',
            message: `Error rate (${level.errorRate}%) exceeds target at ${level.concurrentUsers} concurrent users`,
            recommendation: 'Check Elasticsearch cluster health, connection pooling, and resource limits'
          });
        }
      }
    }

    // Check for throughput degradation
    if (results.levels.length >= 2) {
      for (let i = 1; i < results.levels.length; i++) {
        const prevLevel = results.levels[i - 1];
        const currLevel = results.levels[i];

        if (parseFloat(currLevel.throughput) < parseFloat(prevLevel.throughput)) {
          bottlenecks.push({
            level: currLevel.concurrentUsers,
            type: 'throughput_degradation',
            severity: 'warning',
            message: `Throughput decreased from ${prevLevel.throughput} to ${currLevel.throughput} req/s when increasing from ${prevLevel.concurrentUsers} to ${currLevel.concurrentUsers} concurrent users`,
            recommendation: 'System may be reaching capacity limits. Consider scaling Elasticsearch cluster'
          });
        }
      }
    }

    return bottlenecks;
  }

  /**
   * Generate text report
   */
  generateTextReport() {
    const results = this.results.getResults();
    const summary = results.summary;
    const targets = results.targets;
    const bottlenecks = this.identifyBottlenecks();

    let report = '\n';
    report += '='.repeat(60) + '\n';
    report += 'ELASTICSEARCH LOAD TEST REPORT\n';
    report += '='.repeat(60) + '\n\n';

    // Summary
    report += 'SUMMARY\n';
    report += '-'.repeat(60) + '\n';
    report += `Start Time:        ${summary.startTime}\n`;
    report += `End Time:          ${summary.endTime}\n`;
    report += `Total Duration:    ${(summary.totalDuration / 1000).toFixed(2)}s\n`;
    report += `Test Levels:       ${summary.totalTests}\n`;
    report += `Total Requests:    ${summary.totalRequests}\n`;
    report += `Total Errors:      ${summary.totalErrors}\n`;
    report += `Passed Levels:     ${summary.passedLevels}\n`;
    report += `Failed Levels:     ${summary.failedLevels}\n\n`;

    // Performance Targets
    report += 'PERFORMANCE TARGETS\n';
    report += '-'.repeat(60) + '\n';
    report += `Max P95 Response Time: ${targets.MAX_RESPONSE_TIME_P95}ms\n`;
    report += `Max Error Rate:       ${targets.MAX_ERROR_RATE}%\n`;
    report += `Min Throughput:       ${targets.MIN_THROUGHPUT} req/s\n\n`;

    // Test Results by Level
    report += 'TEST RESULTS BY LEVEL\n';
    report += '-'.repeat(60) + '\n';

    for (const level of results.levels) {
      report += `\n${level.concurrentUsers} Concurrent Users\n`;
      report += `  Duration:           ${level.duration}s\n`;
      report += `  Total Requests:     ${level.totalRequests}\n`;
      report += `  Errors:             ${level.errors}\n`;
      report += `  Error Rate:         ${level.errorRate}%\n`;
      report += `  Throughput:         ${level.throughput} req/s\n`;
      report += `  Min Duration:       ${level.minDuration}ms\n`;
      report += `  Max Duration:       ${level.maxDuration}ms\n`;
      report += `  Avg Duration:       ${level.avgDuration}ms\n`;
      report += `  P50 Duration:       ${level.p50Duration}ms\n`;
      report += `  P95 Duration:       ${level.p95Duration}ms\n`;
      report += `  P99 Duration:       ${level.p99Duration}ms\n`;
      report += `  Status:             ${level.passed ? '✓ PASSED' : '✗ FAILED'}\n`;
      if (!level.passed) {
        report += `  Failure Reason:     ${level.failureReason}\n`;
      }
    }

    // Bottlenecks
    if (bottlenecks.length > 0) {
      report += '\n' + '='.repeat(60) + '\n';
      report += 'PERFORMANCE BOTTLENECKS\n';
      report += '='.repeat(60) + '\n';

      for (const bottleneck of bottlenecks) {
        report += `\n[${bottleneck.severity.toUpperCase()}] ${bottleneck.level} Concurrent Users\n`;
        report += `  Type:           ${bottleneck.type}\n`;
        report += `  Issue:          ${bottleneck.message}\n`;
        report += `  Recommendation: ${bottleneck.recommendation}\n`;
      }
    }

    // Overall Assessment
    report += '\n' + '='.repeat(60) + '\n';
    report += 'OVERALL ASSESSMENT\n';
    report += '='.repeat(60) + '\n';

    if (summary.failedLevels === 0) {
      report += '✓ ALL LOAD LEVELS PASSED\n';
      report += '  System can handle all tested concurrency levels within performance targets.\n';
    } else {
      report += `✗ ${summary.failedLevels} LOAD LEVEL(S) FAILED\n`;
      report += `  System can handle up to ${results.levels.filter(l => l.passed).pop()?.concurrentUsers || 0} concurrent users.\n`;
      report += '  See bottlenecks section for recommendations.\n';
    }

    // Capacity Estimation
    if (results.levels.length > 0) {
      const maxPassedLevel = results.levels.filter(l => l.passed).pop();
      if (maxPassedLevel) {
        report += `\nEstimated Capacity: ${maxPassedLevel.concurrentUsers} concurrent users\n`;
      }
    }

    report += '\n' + '='.repeat(60) + '\n';

    return report;
  }

  /**
   * Generate JSON report
   */
  generateJsonReport() {
    const results = this.results.getResults();
    return JSON.stringify({
      ...results,
      bottlenecks: this.identifyBottlenecks()
    }, null, 2);
  }

  /**
   * Save report to file
   */
  async saveReport(format = LOAD_TEST_CONFIG.REPORT_FORMAT) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    
    // Ensure report directory exists
    if (!fs.existsSync(LOAD_TEST_CONFIG.REPORT_DIR)) {
      fs.mkdirSync(LOAD_TEST_CONFIG.REPORT_DIR, { recursive: true });
    }

    const filename = `elasticsearch-load-${timestamp}.${format === 'json' ? 'json' : 'txt'}`;
    const filepath = path.join(LOAD_TEST_CONFIG.REPORT_DIR, filename);

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
      this.isRunning = false;
      
      if (this.searchService) {
        await this.searchService.shutdown();
      }
      await elasticsearchClientService.shutdown();
      console.log('\n✓ Load test runner shutdown complete');
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
    concurrentLevels: LOAD_TEST_CONFIG.DEFAULT_CONCURRENT_LEVELS,
    duration: LOAD_TEST_CONFIG.DEFAULT_DURATION,
    reportFormat: LOAD_TEST_CONFIG.REPORT_FORMAT
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    const nextArg = args[i + 1];

    if (arg === '--concurrent' || arg === '-c') {
      const levels = nextArg ? nextArg.split(',').map(n => parseInt(n)) : LOAD_TEST_CONFIG.DEFAULT_CONCURRENT_LEVELS;
      options.concurrentLevels = levels.filter(n => !isNaN(n) && n > 0);
      i++;
    } else if (arg === '--duration' || arg === '-d') {
      options.duration = parseInt(nextArg) || LOAD_TEST_CONFIG.DEFAULT_DURATION;
      i++;
    } else if (arg === '--report' || arg === '-r') {
      options.reportFormat = nextArg === 'json' ? 'json' : 'text';
      i++;
    } else if (arg === '--help' || arg === '-h') {
      console.log(`
Elasticsearch Load Testing Script

Usage:
  node scripts/test-elasticsearch-load.js [options]

Options:
  --concurrent, -c <levels>  Comma-separated list of concurrent user levels (default: 10,50,100,200)
  --duration, -d <seconds>   Duration per test level in seconds (default: 30)
  --report, -r <format>      Report format: text or json (default: text)
  --help, -h                 Show this help message

Examples:
  node scripts/test-elasticsearch-load.js
  node scripts/test-elasticsearch-load.js --concurrent 20,50,100
  node scripts/test-elasticsearch-load.js --duration 60 --report json
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
  const runner = new LoadTestRunner();

  try {
    await runner.initialize();
    await runner.runAllTests(options.concurrentLevels, options.duration);

    // Generate and display report
    const report = options.reportFormat === 'json' 
      ? runner.generateJsonReport() 
      : runner.generateTextReport();
    
    console.log(report);

    // Save report
    await runner.saveReport(options.reportFormat);

    const results = runner.results.getResults();
    const exitCode = results.summary.failedLevels > 0 ? 1 : 0;
    process.exit(exitCode);

  } catch (error) {
    console.error('\n✗ Load testing failed:', error.message);
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

module.exports = { LoadTestRunner, LOAD_TEST_CONFIG };
