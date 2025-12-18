
/**
 * Comprehensive Review Management Test Runner
 * 
 * This test runner executes all review-related test suites and provides:
 * - Centralized test execution with proper error handling
 * - Test result aggregation and reporting
 * - Performance benchmarking
 * - Coverage analysis and reporting
 * - Bangladesh-specific test execution context
 * - Parallel test execution capabilities
 * - Detailed error logging and debugging
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');
const { performance } = require('perf_hooks');

// Test configuration
const TEST_CONFIG = {
  TEST_TIMEOUT: 60000, // 60 seconds
  PARALLEL_EXECUTION: true,
  COVERAGE_THRESHOLD: 80, // Minimum coverage percentage
  PERFORMANCE_BENCHMARK: true,
  MAX_CONCURRENT_TESTS: 3,
  RETRY_FAILED_TESTS: true,
  MAX_RETRIES: 2,
  DETAILED_LOGGING: true
};

/**
 * List of all review test files with categories
 */
const REVIEW_TEST_FILES = [
  { file: 'bangladesh-review-fixtures.test.js', category: 'fixtures', priority: 1 },
  { file: 'api-reviews-basic.test.js', category: 'basic', priority: 2 },
  { file: 'api-reviews-moderation.test.js', category: 'moderation', priority: 3 },
  { file: 'api-reviews-aggregation.test.js', category: 'aggregation', priority: 4 },
  { file: 'api-reviews-bangladesh.test.js', category: 'bangladesh', priority: 5 },
  { file: 'api-reviews-analytics.test.js', category: 'analytics', priority: 6 },
  { file: 'api-reviews-performance.test.js', category: 'performance', priority: 7 }
];

/**
 * Bangladesh-specific test insights
 */
const BANGLADESH_INSIGHTS = {
  culturalContext: {
    description: 'All tests include Bangladesh cultural context and language support',
    coverage: ['Bengali language', 'Regional preferences', 'Festival patterns', 'Local payment methods']
  },
  marketSpecific: {
    description: 'Tests cover Bangladesh market-specific scenarios',
    coverage: ['Price sensitivity', 'Brand loyalty', 'Regional variations', 'Seasonal trends']
  },
  performance: {
    description: 'Performance tests handle Bangladesh-specific load patterns',
    coverage: ['High traffic periods', 'Festival season load', 'Regional user patterns']
  }
};

/**
 * Test results structure with enhanced tracking
 */
class TestResults {
  constructor() {
    this.results = {
      total: 0,
      passed: 0,
      failed: 0,
      skipped: 0,
      suites: {},
      performance: {},
      coverage: {},
      duration: 0,
      timestamp: new Date().toISOString(),
      errors: [],
      warnings: [],
      retries: {}
    };
  }

  /**
   * Add test result with enhanced tracking
   * @param {string} testFile - Test file name
   * @param {string} testName - Test name
   * @param {string} status - Test status (passed, failed, skipped)
   * @param {number} duration - Test execution time in ms
   * @param {string|null} error - Error message if failed
   * @param {Object} performance - Performance metrics
   * @param {number} retryCount - Number of retries for this test
   */
  addResult(testFile, testName, status, duration, error = null, performance = {}, retryCount = 0) {
    this.results.total++;
    
    if (status === 'passed') {
      this.results.passed++;
    } else if (status === 'failed') {
      this.results.failed++;
      if (error) {
        this.results.errors.push({
          testFile,
          testName,
          error,
          timestamp: new Date().toISOString()
        });
      }
    } else if (status === 'skipped') {
      this.results.skipped++;
    }

    // Initialize suite if not exists
    if (!this.results.suites[testFile]) {
      this.results.suites[testFile] = {
        total: 0,
        passed: 0,
        failed: 0,
        skipped: 0,
        tests: {},
        duration: 0,
        startTime: null,
        endTime: null,
        category: this.getTestCategory(testFile),
        priority: this.getTestPriority(testFile),
        retries: 0
      };
    }

    // Add test to suite
    this.results.suites[testFile].tests[testName] = {
      status,
      duration,
      error,
      performance,
      retryCount,
      timestamp: new Date().toISOString()
    };

    // Update suite totals
    this.results.suites[testFile].total++;
    if (status === 'passed') {
      this.results.suites[testFile].passed++;
    } else if (status === 'failed') {
      this.results.suites[testFile].failed++;
    } else if (status === 'skipped') {
      this.results.suites[testFile].skipped++;
    }

    // Track retries
    if (retryCount > 0) {
      this.results.suites[testFile].retries += retryCount;
      if (!this.results.retries[testFile]) {
        this.results.retries[testFile] = 0;
      }
      this.results.retries[testFile] += retryCount;
    }

    // Add performance data
    if (Object.keys(performance).length > 0) {
      if (!this.results.performance[testFile]) {
        this.results.performance[testFile] = [];
      }
      this.results.performance[testFile].push(performance);
    }
  }

  /**
   * Get test category from filename
   * @param {string} testFile - Test file name
   * @returns {string} Test category
   */
  getTestCategory(testFile) {
    const testConfig = REVIEW_TEST_FILES.find(config => config.file === testFile);
    return testConfig ? testConfig.category : 'other';
  }

  /**
   * Get test priority from filename
   * @param {string} testFile - Test file name
   * @returns {number} Test priority
   */
  getTestPriority(testFile) {
    const testConfig = REVIEW_TEST_FILES.find(config => config.file === testFile);
    return testConfig ? testConfig.priority : 999;
  }

  /**
   * Mark suite start time
   * @param {string} testFile - Test file name
   */
  startSuite(testFile) {
    if (!this.results.suites[testFile]) {
      this.results.suites[testFile] = {
        total: 0,
        passed: 0,
        failed: 0,
        skipped: 0,
        tests: {},
        duration: 0,
        startTime: null,
        endTime: null,
        category: this.getTestCategory(testFile),
        priority: this.getTestPriority(testFile),
        retries: 0
      };
    }
    this.results.suites[testFile].startTime = new Date().toISOString();
  }

  /**
   * Mark suite end time
   * @param {string} testFile - Test file name
   */
  endSuite(testFile) {
    if (this.results.suites[testFile]) {
      this.results.suites[testFile].endTime = new Date().toISOString();
      this.results.suites[testFile].duration = 
        new Date(this.results.suites[testFile].endTime) - 
        new Date(this.results.suites[testFile].startTime);
    }
  }

  /**
   * Add warning message
   * @param {string} message - Warning message
   * @param {string} testFile - Related test file
   */
  addWarning(message, testFile = null) {
    this.results.warnings.push({
      message,
      testFile,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Calculate final results with enhanced metrics
   * @returns {Object} Final results object
   */
  calculateFinalResults() {
    const totalDuration = this.results.endTime - this.results.startTime;
    const successRate = this.results.total > 0 ? (this.results.passed / this.results.total * 100) : 0;
    
    return {
      summary: {
        totalTests: this.results.total,
        passedTests: this.results.passed,
        failedTests: this.results.failed,
        skippedTests: this.results.skipped,
        successRate: successRate.toFixed(2),
        totalDuration: totalDuration,
        averageTestDuration: this.results.total > 0 ? totalDuration / this.results.total : 0,
        timestamp: new Date().toISOString(),
        errorCount: this.results.errors.length,
        warningCount: this.results.warnings.length,
        retryCount: Object.values(this.results.retries).reduce((sum, count) => sum + count, 0)
      },
      suites: this.results.suites,
      performance: this.aggregatePerformanceData(),
      coverage: this.calculateCoverageData(),
      errors: this.results.errors,
      warnings: this.results.warnings,
      bangladeshInsights: this.generateBangladeshInsights(),
      recommendations: this.generateRecommendations()
    };
  }

  /**
   * Aggregate performance data across all tests
   * @returns {Object} Aggregated performance data
   */
  aggregatePerformanceData() {
    const performanceData = {};
    
    for (const [testFile, suite] of Object.entries(this.results.suites)) {
      if (this.results.performance[testFile] && this.results.performance[testFile].length > 0) {
        const suitePerformance = this.results.performance[testFile];
        
        // Calculate performance metrics for this suite
        const avgExecutionTime = suitePerformance.reduce((sum, perf) => sum + perf.executionTime, 0) / suitePerformance.length;
        const minExecutionTime = Math.min(...suitePerformance.map(p => p.executionTime));
        const maxExecutionTime = Math.max(...suitePerformance.map(p => p.executionTime));
        
        performanceData[testFile] = {
          testCount: suitePerformance.length,
          averageExecutionTime: avgExecutionTime,
          minExecutionTime,
          maxExecutionTime,
          slowestTest: suitePerformance.find(p => p.executionTime === maxExecutionTime),
          fastestTest: suitePerformance.find(p => p.executionTime === minExecutionTime),
          performanceScore: this.calculatePerformanceScore(suitePerformance)
        };
      }
    }

    // Calculate overall performance metrics
    const allPerformanceData = Object.values(performanceData);
    if (allPerformanceData.length > 0) {
      const overallAvgTime = allPerformanceData.reduce((sum, suite) => sum + suite.averageExecutionTime, 0) / allPerformanceData.length;
      const overallMinTime = Math.min(...allPerformanceData.map(suite => suite.minExecutionTime));
      const overallMaxTime = Math.max(...allPerformanceData.map(suite => suite.maxExecutionTime));
      
      performanceData.overall = {
        totalTestSuites: allPerformanceData.length,
        averageExecutionTime: overallAvgTime,
        minExecutionTime: overallMinTime,
        maxExecutionTime: overallMaxTime,
        performanceGrade: this.calculateOverallPerformanceGrade(allPerformanceData)
      };
    }

    return performanceData;
  }

  /**
   * Calculate performance score for a test suite
   * @param {Array} performanceData - Performance data array
   * @returns {number} Performance score (0-100)
   */
  calculatePerformanceScore(performanceData) {
    if (performanceData.length === 0) return 0;
    
    const avgTime = performanceData.reduce((sum, perf) => sum + perf.executionTime, 0) / performanceData.length;
    const maxAcceptableTime = 5000; // 5 seconds
    const score = Math.max(0, Math.min(100, 100 - ((avgTime / maxAcceptableTime) * 100)));
    
    return Math.round(score);
  }

  /**
   * Calculate overall performance grade
   * @param {Array} allPerformanceData - All performance data
   * @returns {string} Performance grade
   */
  calculateOverallPerformanceGrade(allPerformanceData) {
    if (allPerformanceData.length === 0) return 'N/A';
    
    const avgScore = allPerformanceData.reduce((sum, suite) => sum + suite.performanceScore, 0) / allPerformanceData.length;
    
    if (avgScore >= 90) return 'A+ (Excellent)';
    if (avgScore >= 80) return 'A (Very Good)';
    if (avgScore >= 70) return 'B+ (Good)';
    if (avgScore >= 60) return 'B (Satisfactory)';
    if (avgScore >= 50) return 'C (Needs Improvement)';
    return 'D (Poor)';
  }

  /**
   * Calculate coverage data with improved logic
   * @returns {Object} Coverage data
   */
  calculateCoverageData() {
    const coverageData = {
      basic: { passed: 0, failed: 0, total: 0, coverage: 0 },
      moderation: { passed: 0, failed: 0, total: 0, coverage: 0 },
      aggregation: { passed: 0, failed: 0, total: 0, coverage: 0 },
      bangladesh: { passed: 0, failed: 0, total: 0, coverage: 0 },
      analytics: { passed: 0, failed: 0, total: 0, coverage: 0 },
      performance: { passed: 0, failed: 0, total: 0, coverage: 0 },
      fixtures: { passed: 0, failed: 0, total: 0, coverage: 0 }
    };

    // Calculate coverage for each test category
    for (const [testFile, suite] of Object.entries(this.results.suites)) {
      const category = this.getTestCategory(testFile);
      const totalTests = Object.keys(suite.tests).length;
      const passedTests = Object.values(suite.tests).filter(test => test.status === 'passed').length;
      
      if (coverageData[category]) {
        coverageData[category].total += totalTests;
        coverageData[category].passed += passedTests;
        coverageData[category].failed += totalTests - passedTests;
      }
    }

    // Calculate coverage percentage for each category
    Object.keys(coverageData).forEach(category => {
      const data = coverageData[category];
      data.coverage = data.total > 0 ? (data.passed / data.total * 100) : 0;
    });

    // Calculate overall coverage
    const totalTests = Object.values(coverageData).reduce((sum, cat) => sum + cat.total, 0);
    const totalPassed = Object.values(coverageData).reduce((sum, cat) => sum + cat.passed, 0);
    
    coverageData.overall = {
      total: totalTests,
      passed: totalPassed,
      failed: totalTests - totalPassed,
      coverage: totalTests > 0 ? (totalPassed / totalTests * 100) : 0,
      meetsThreshold: totalTests > 0 ? (totalPassed / totalTests * 100) >= TEST_CONFIG.COVERAGE_THRESHOLD : false
    };

    return coverageData;
  }

  /**
   * Generate Bangladesh-specific insights
   * @returns {Object} Bangladesh insights
   */
  generateBangladeshInsights() {
    const insights = {
      culturalContext: {
        ...BANGLADESH_INSIGHTS.culturalContext,
        testCoverage: this.calculateBangladeshCoverage('cultural')
      },
      marketSpecific: {
        ...BANGLADESH_INSIGHTS.marketSpecific,
        testCoverage: this.calculateBangladeshCoverage('market')
      },
      performance: {
        ...BANGLADESH_INSIGHTS.performance,
        testCoverage: this.calculateBangladeshCoverage('performance')
      }
    };

    return insights;
  }

  /**
   * Calculate Bangladesh-specific test coverage
   * @param {string} type - Type of coverage (cultural, market, performance)
   * @returns {Object} Coverage data
   */
  calculateBangladeshCoverage(type) {
    const bangladeshTests = this.results.suites['api-reviews-bangladesh.test.js'];
    const performanceTests = this.results.suites['api-reviews-performance.test.js'];
    
    if (!bangladeshTests) {
      return { coverage: 0, total: 0, passed: 0 };
    }

    const totalTests = Object.keys(bangladeshTests.tests).length;
    const passedTests = Object.values(bangladeshTests.tests).filter(test => test.status === 'passed').length;
    
    return {
      total: totalTests,
      passed: passedTests,
      coverage: totalTests > 0 ? (passedTests / totalTests * 100) : 0,
      performanceMetrics: performanceTests ? {
        averageExecutionTime: this.calculateAverageExecutionTime(performanceTests),
        totalTests: Object.keys(performanceTests.tests).length
      } : null
    };
  }

  /**
   * Calculate average execution time for a test suite
   * @param {Object} suite - Test suite
   * @returns {number} Average execution time
   */
  calculateAverageExecutionTime(suite) {
    if (!suite || !suite.tests) return 0;
    
    const testTimes = Object.values(suite.tests).map(test => test.duration);
    return testTimes.length > 0 ? testTimes.reduce((sum, time) => sum + time, 0) / testTimes.length : 0;
  }

  /**
   * Generate recommendations based on test results
   * @returns {Array} Array of recommendations
   */
  generateRecommendations() {
    const recommendations = [];
    const coverage = this.calculateCoverageData();
    
    // Coverage recommendations
    if (coverage.overall.coverage < TEST_CONFIG.COVERAGE_THRESHOLD) {
      recommendations.push({
        type: 'coverage',
        priority: 'high',
        message: `Test coverage (${coverage.overall.coverage.toFixed(2)}%) is below target threshold (${TEST_CONFIG.COVERAGE_THRESHOLD}%). Consider adding more comprehensive tests.`
      });
    }

    // Performance recommendations
    const performance = this.aggregatePerformanceData();
    if (performance.overall && (performance.overall.performanceGrade.includes('C') || performance.overall.performanceGrade.includes('D'))) {
      recommendations.push({
        type: 'performance',
        priority: 'medium',
        message: `Performance grade (${performance.overall.performanceGrade}) needs improvement. Consider optimizing test execution and database queries.`
      });
    }

    // Error recommendations
    if (this.results.errors.length > 0) {
      recommendations.push({
        type: 'reliability',
        priority: 'high',
        message: `${this.results.errors.length} test failures detected. Review error logs and fix failing tests.`
      });
    }

    // Bangladesh-specific recommendations
    const bangladeshCoverage = this.calculateBangladeshCoverage('cultural');
    if (bangladeshCoverage.coverage < 90) {
      recommendations.push({
        type: 'localization',
        priority: 'medium',
        message: `Bangladesh-specific test coverage (${bangladeshCoverage.coverage.toFixed(2)}%) could be improved. Add more cultural and regional test scenarios.`
      });
    }

    return recommendations;
  }

  /**
   * Generate comprehensive test report
   * @returns {string} Formatted report
   */
  generateReport() {
    const report = [];
    
    // Header
    report.push('='.repeat(80));
    report.push(' COMPREHENSIVE REVIEW MANAGEMENT TEST REPORT ');
    report.push('='.repeat(80));
    report.push('');
    
    // Executive Summary
    report.push('EXECUTIVE SUMMARY:');
    report.push('========================');
    report.push(`Test Execution Date: ${new Date().toLocaleString()}`);
    report.push(`Total Test Files: ${REVIEW_TEST_FILES.length}`);
    report.push(`Total Test Suites: ${Object.keys(this.results.suites).length}`);
    report.push(`Total Tests Executed: ${this.results.total}`);
    report.push(`Tests Passed: ${this.results.passed}`);
    report.push(`Tests Failed: ${this.results.failed}`);
    report.push(`Tests Skipped: ${this.results.skipped}`);
    report.push(`Success Rate: ${this.results.total > 0 ? (this.results.passed / this.results.total * 100).toFixed(2) : '0.00'}%`);
    report.push(`Total Duration: ${this.results.endTime - this.results.startTime}ms`);
    report.push(`Average Test Duration: ${this.results.total > 0 ? (this.results.endTime - this.results.startTime) / this.results.total : 0}ms`);
    report.push(`Total Retries: ${Object.values(this.results.retries).reduce((sum, count) => sum + count, 0)}`);
    report.push('');

    // Coverage Summary
    report.push('COVERAGE SUMMARY:');
    report.push('==================');
    
    const coverage = this.calculateCoverageData();
    const categories = ['basic', 'moderation', 'aggregation', 'bangladesh', 'analytics', 'performance', 'fixtures'];
    
    categories.forEach(category => {
      const data = coverage[category];
      const categoryName = category.charAt(0).toUpperCase() + category.slice(1).replace(/([A-Z])/g, ' $1');
      report.push(`${categoryName} Coverage:`);
      report.push(`  Total Tests: ${data.total}`);
      report.push(`  Passed: ${data.passed}`);
      report.push(`  Failed: ${data.failed}`);
      report.push(`  Coverage: ${data.coverage.toFixed(2)}%`);
      report.push('');
    });
    
    report.push('OVERALL COVERAGE:');
    report.push(`  Total Tests: ${coverage.overall.total}`);
    report.push(`  Passed: ${coverage.overall.passed}`);
    report.push(`  Failed: ${coverage.overall.failed}`);
    report.push(`  Coverage: ${coverage.overall.coverage.toFixed(2)}%`);
    report.push(`Target Coverage: ${TEST_CONFIG.COVERAGE_THRESHOLD}%`);
    report.push(`Coverage Status: ${coverage.overall.meetsThreshold ? '✅ PASSED' : '❌ NEEDS IMPROVEMENT'}`);
    report.push('');

    // Performance Summary
    if (TEST_CONFIG.PERFORMANCE_BENCHMARK && Object.keys(this.results.performance).length > 0) {
      report.push('PERFORMANCE BENCHMARKS:');
      report.push('=======================');
      
      const performance = this.aggregatePerformanceData();
      
      if (performance.overall) {
        report.push('Overall Performance:');
        report.push(`  Total Test Suites: ${performance.overall.totalTestSuites}`);
        report.push(`  Average Execution Time: ${performance.overall.averageExecutionTime.toFixed(2)}ms`);
        report.push(`  Min Execution Time: ${performance.overall.minExecutionTime}ms`);
        report.push(`  Max Execution Time: ${performance.overall.maxExecutionTime}ms`);
        report.push(`  Performance Grade: ${performance.overall.performanceGrade}`);
        report.push('');

        // Performance by test type
        Object.entries(performance).forEach(([testFile, perfData]) => {
          if (testFile !== 'overall' && perfData) {
            report.push(`${testFile.replace('.test.js', '').replace(/-/g, ' ').toUpperCase()} Performance:`);
            report.push(`  Test Count: ${perfData.testCount}`);
            report.push(`  Average Time: ${perfData.averageExecutionTime.toFixed(2)}ms`);
            report.push(`  Performance Score: ${perfData.performanceScore}/100`);
            
            if (perfData.slowestTest && perfData.fastestTest) {
              report.push(`  Slowest Test: ${perfData.slowestTest.test} (${perfData.slowestTest.executionTime}ms)`);
              report.push(`  Fastest Test: ${perfData.fastestTest.test} (${perfData.fastestTest.executionTime}ms)`);
            }
            report.push('');
          }
        });
      }
    }

    // Bangladesh-Specific Insights
    report.push('BANGLADESH-SPECIFIC INSIGHTS:');
    report.push('=============================');
    
    const bangladeshInsights = this.generateBangladeshInsights();
    Object.entries(bangladeshInsights).forEach(([key, insight]) => {
      report.push(`${key.replace(/([A-Z])/g, ' $1').toUpperCase()}:`);
      report.push(`  Description: ${insight.description}`);
      report.push(`  Coverage Areas: ${insight.coverage.join(', ')}`);
      if (insight.testCoverage) {
        report.push(`  Test Coverage: ${insight.testCoverage.coverage.toFixed(2)}%`);
      }
      report.push('');
    });

    // Error Summary
    if (this.results.errors.length > 0) {
      report.push('ERROR SUMMARY:');
      report.push('===============');
      report.push(`Total Errors: ${this.results.errors.length}`);
      
      this.results.errors.forEach((error, index) => {
        report.push(`${index + 1}. ${error.testFile} - ${error.testName}:`);
        report.push(`   ${error.error}`);
      });
      report.push('');
    }

    // Warning Summary
    if (this.results.warnings.length > 0) {
      report.push('WARNING SUMMARY:');
      report.push('=================');
      report.push(`Total Warnings: ${this.results.warnings.length}`);
      
      this.results.warnings.forEach((warning, index) => {
        report.push(`${index + 1}. ${warning.testFile || 'General'}: ${warning.message}`);
      });
      report.push('');
    }

    // Recommendations
    const recommendations = this.generateRecommendations();
    if (recommendations.length > 0) {
      report.push('RECOMMENDATIONS:');
      report.push('==================');
      
      recommendations.forEach((rec, index) => {
        report.push(`${index + 1}. [${rec.priority.toUpperCase()}] ${rec.type}:`);
        report.push(`   ${rec.message}`);
      });
      report.push('');
    }

    // Test Suite Details
    report.push('DETAILED TEST RESULTS:');
    report.push('=======================');
    
    // Sort suites by priority
    const sortedSuites = Object.entries(this.results.suites).sort((a, b) => {
      return a[1].priority - b[1].priority;
    });
    
    sortedSuites.forEach(([testFile, suite]) => {
      report.push(`\n${testFile} (${suite.category}):`);
      report.push(`  Status: ${suite.failed > 0 ? '❌ FAILED' : '✅ PASSED'}`);
      report.push(`  Priority: ${suite.priority}`);
      report.push(`  Duration: ${suite.duration}ms`);
      report.push(`  Tests: ${Object.keys(suite.tests).length}`);
      report.push(`  Retries: ${suite.retries}`);
      
      if (suite.failed > 0) {
        report.push('  Failed Tests:');
        const failedTests = Object.entries(suite.tests).filter(([name, test]) => test.status === 'failed');
        failedTests.forEach(([testName, test]) => {
          report.push(`    - ${testName}: ${test.error || 'Unknown error'}`);
        });
      }
      
      if (suite.skipped > 0) {
        report.push('  Skipped Tests:');
        const skippedTests = Object.entries(suite.tests).filter(([name, test]) => test.status === 'skipped');
        skippedTests.forEach(([testName, test]) => {
          report.push(`    - ${testName}: Skipped`);
        });
      }
      
      report.push('');
    });

    // Footer
    report.push('Report generated by: Smart Technologies Bangladesh Review Management Test Runner');
    report.push(`Generated on: ${new Date().toISOString()}`);
    report.push('='.repeat(80));

    return report.join('\n');
  }

  /**
   * Save report to file with timestamp
   * @param {string} report - Report content
   */
  saveReportToFile(report) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const reportPath = path.join(__dirname, `REVIEW_MANAGEMENT_TEST_REPORT_${timestamp}.md`);
    
    try {
      fs.writeFileSync(reportPath, report, 'utf8');
      console.log(`Test report saved to: ${reportPath}`);
      
      // Also save JSON results for programmatic access
      const jsonPath = path.join(__dirname, `REVIEW_MANAGEMENT_TEST_RESULTS_${timestamp}.json`);
      fs.writeFileSync(jsonPath, JSON.stringify(this.calculateFinalResults(), null, 2), 'utf8');
      console.log(`Test results JSON saved to: ${jsonPath}`);
      
    } catch (error) {
      console.error(`Failed to save report: ${error.message}`);
    }
  }
}

/**
 * Enhanced Review Test Runner with improved error handling and logging
 */
class ReviewTestRunner {
  constructor() {
    this.results = new TestResults();
    this.logger = this.createLogger();
  }

  /**
   * Create logger for test execution
   * @returns {Object} Logger object
   */
  createLogger() {
    return {
      info: (message, testFile = null) => {
        if (TEST_CONFIG.DETAILED_LOGGING) {
          const timestamp = new Date().toISOString();
          const prefix = testFile ? `[${testFile}] ` : '';
          console.log(`${timestamp} ${prefix}INFO: ${message}`);
        }
      },
      error: (message, testFile = null, error = null) => {
        const timestamp = new Date().toISOString();
        const prefix = testFile ? `[${testFile}] ` : '';
        console.error(`${timestamp} ${prefix}ERROR: ${message}`);
        if (error && TEST_CONFIG.DETAILED_LOGGING) {
          console.error(error);
        }
      },
      warn: (message, testFile = null) => {
        if (TEST_CONFIG.DETAILED_LOGGING) {
          const timestamp = new Date().toISOString();
          const prefix = testFile ? `[${testFile}] ` : '';
          console.warn(`${timestamp} ${prefix}WARN: ${message}`);
        }
      }
    };
  }

  /**
   * Execute single test file with enhanced error handling
   * @param {string} testFile - Test file name
   * @param {number} retryCount - Current retry attempt
   * @returns {Promise<boolean>} Success status
   */
  async executeTestFile(testFile, retryCount = 0) {
    this.logger.info(`Executing ${testFile} (attempt ${retryCount + 1})`, testFile);
    
    const startTime = performance.now();
    this.results.startSuite(testFile);
    
    try {
      // Execute test file with enhanced Jest options
      const jestOptions = [
        'npx jest',
        testFile,
        '--verbose',
        '--detectOpenHandles',
        '--forceExit',
        '--json',
        '--outputFile=jest-results.json',
        `--testTimeout=${TEST_CONFIG.TEST_TIMEOUT}`
      ];

      if (TEST_CONFIG.PARALLEL_EXECUTION) {
        jestOptions.push('--runInBand');
      }

      const result = execSync(jestOptions.join(' '), {
        cwd: __dirname,
        timeout: TEST_CONFIG.TEST_TIMEOUT,
        encoding: 'utf8',
        maxBuffer: 1024 * 1024 * 10 // 10MB buffer
      });
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      this.results.endSuite(testFile);
      
      // Parse Jest JSON output if available
      await this.parseJestResults(testFile, duration);
      
      this.logger.info(`✅ ${testFile} completed in ${duration.toFixed(2)}ms`, testFile);
      return true;
      
    } catch (error) {
      const endTime = performance.now();
      const duration = endTime - startTime;
      this.results.endSuite(testFile);
      
      this.logger.error(`❌ Error executing ${testFile}: ${error.message}`, testFile, error);
      
      // Add error result
      this.results.addResult(testFile, 'execution', 'failed', duration, error.message);
      
      // Retry logic
      if (TEST_CONFIG.RETRY_FAILED_TESTS && retryCount < TEST_CONFIG.MAX_RETRIES) {
        this.logger.warn(`Retrying ${testFile} (${retryCount + 1}/${TEST_CONFIG.MAX_RETRIES})`, testFile);
        await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second before retry
        return await this.executeTestFile(testFile, retryCount + 1);
      }
      
      return false;
    }
  }

  /**
   * Parse Jest JSON results
   * @param {string} testFile - Test file name
   * @param {number} duration - Execution duration
   */
  async parseJestResults(testFile, duration) {
    try {
      const resultsPath = path.join(__dirname, 'jest-results.json');
      if (fs.existsSync(resultsPath)) {
        const jestResults = JSON.parse(fs.readFileSync(resultsPath, 'utf8'));
        
        if (jestResults.testResults) {
          jestResults.testResults.forEach(testResult => {
            const status = testResult.status === 'passed' ? 'passed' : 
                           testResult.status === 'pending' ? 'skipped' : 'failed';
            
            this.results.addResult(
              testFile,
              testResult.title,
              status,
              testResult.duration || 0,
              testResult.failureMessages ? testResult.failureMessages.join('; ') : null,
              {
                executionTime: testResult.duration || 0,
                memoryUsage: testResult.memoryUsage,
                testPath: testResult.testFilePath
              }
            );
          });
        }
        
        // Clean up JSON results file
        fs.unlinkSync(resultsPath);
      }
    } catch (error) {
      this.logger.warn(`Failed to parse Jest results for ${testFile}: ${error.message}`, testFile);
    }
  }

  /**
   * Run all review tests with parallel execution support
   */
  async runAllTests() {
    this.logger.info('Starting Comprehensive Review Management Test Suite');
    this.logger.info('================================================');
    
    // Initialize results tracking
    this.results.startTime = new Date().toISOString();
    
    let executionPromises;
    
    if (TEST_CONFIG.PARALLEL_EXECUTION) {
      // Execute tests in parallel batches
      const batches = this.createTestBatches(REVIEW_TEST_FILES, TEST_CONFIG.MAX_CONCURRENT_TESTS);
      executionPromises = batches.map(batch => 
        this.executeTestBatch(batch)
      );
    } else {
      // Execute tests sequentially
      executionPromises = REVIEW_TEST_FILES.map(config => 
        this.executeTestFile(config.file)
      );
    }
    
    // Wait for all tests to complete
    const results = await Promise.allSettled(executionPromises);
    
    // Calculate final results
    this.results.endTime = new Date().toISOString();
    
    // Generate and display report
    const report = this.results.generateReport();
    console.log(report);
    
    // Save report to file
    this.results.saveReportToFile(report);
    
    // Determine overall success
    const finalResults = this.results.calculateFinalResults();
    const overallSuccess = finalResults.summary.failedTests === 0 && 
                          finalResults.summary.passedTests > 0 && 
                          finalResults.coverage.overall.meetsThreshold;
    
    if (overallSuccess) {
      this.logger.info('🎉 ALL TESTS PASSED SUCCESSFULLY!');
      this.logger.info(`✅ Success Rate: ${finalResults.summary.successRate}%`);
      this.logger.info(`✅ Coverage Target: ${TEST_CONFIG.COVERAGE_THRESHOLD}%`);
      this.logger.info(`✅ Total Duration: ${finalResults.summary.totalDuration}ms`);
    } else {
      this.logger.error('❌ SOME TESTS FAILED!');
      this.logger.error(`❌ Success Rate: ${finalResults.summary.successRate}%`);
      this.logger.error(`❌ Coverage Target: ${TEST_CONFIG.COVERAGE_THRESHOLD}%`);
      
      if (finalResults.summary.errorCount > 0) {
        this.logger.error('\nFailed Test Summary:');
        finalResults.errors.forEach(error => {
          this.logger.error(`  ${error.testFile} - ${error.testName}: ${error.error}`);
        });
      }
    }
    
    return finalResults;
  }

  /**
   * Create test batches for parallel execution
   * @param {Array} testFiles - Array of test file configurations
   * @param {number} batchSize - Maximum batch size
   * @returns {Array} Array of test batches
   */
  createTestBatches(testFiles, batchSize) {
    const batches = [];
    for (let i = 0; i < testFiles.length; i += batchSize) {
      batches.push(testFiles.slice(i, i + batchSize));
    }
    return batches;
  }

  /**
   * Execute a batch of tests
   * @param {Array} batch - Array of test file configurations
   * @returns {Promise<Array>} Array of execution results
   */
  async executeTestBatch(batch) {
    const batchPromises = batch.map(config => 
      this.executeTestFile(config.file)
    );
    return await Promise.allSettled(batchPromises);
  }
}

/**
 * Main execution function
 */
async function main() {
  const testRunner = new ReviewTestRunner();
  
  try {
    const results = await testRunner.runAllTests();
    process.exit(results.summary.failedTests > 0 ? 1 : 0);
  } catch (error) {
    console.error('❌ Error running review tests:', error.message);
    if (TEST_CONFIG.DETAILED_LOGGING) {
      console.error(error);
    }
    process.exit(1);
  }
}

// Run tests if this file is executed directly
