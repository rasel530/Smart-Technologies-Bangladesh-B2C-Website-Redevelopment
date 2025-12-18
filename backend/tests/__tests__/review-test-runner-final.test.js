/**
 * Final Review Management Test Runner
 * 
 * A simplified but comprehensive test runner that works with the existing environment:
 * - Executes all review-related test suites
 * - Provides detailed reporting and analysis
 * - Includes Bangladesh-specific insights
 * - Handles environment issues gracefully
 * - Generates comprehensive test reports
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');
const { performance } = require('perf_hooks');

// Test configuration
const TEST_CONFIG = {
  TEST_TIMEOUT: 30000, // 30 seconds
  COVERAGE_THRESHOLD: 80,
  DETAILED_LOGGING: true,
  GENERATE_REPORTS: true
};

/**
 * Review test files with categories
 */
const REVIEW_TEST_FILES = [
  'bangladesh-review-fixtures.test.js',
  'api-reviews-basic.test.js',
  'api-reviews-moderation.test.js',
  'api-reviews-aggregation.test.js',
  'api-reviews-bangladesh.test.js',
  'api-reviews-analytics.test.js',
  'api-reviews-performance.test.js'
];

/**
 * Test results tracker
 */
class TestResults {
  constructor() {
    this.results = {
      total: 0,
      passed: 0,
      failed: 0,
      skipped: 0,
      suites: {},
      startTime: null,
      endTime: null,
      errors: [],
      warnings: []
    };
  }

  addSuiteResult(testFile, result) {
    if (!this.results.suites[testFile]) {
      this.results.suites[testFile] = {
        total: 0,
        passed: 0,
        failed: 0,
        skipped: 0,
        duration: 0,
        status: 'unknown',
        errors: []
      };
    }

    this.results.suites[testFile] = {
      ...this.results.suites[testFile],
      ...result
    };

    // Update totals
    this.results.total += result.total || 0;
    this.results.passed += result.passed || 0;
    this.results.failed += result.failed || 0;
    this.results.skipped += result.skipped || 0;

    // Track errors
    if (result.errors && result.errors.length > 0) {
      this.results.errors.push(...result.errors.map(err => ({
        testFile,
        error: err,
        timestamp: new Date().toISOString()
      })));
    }
  }

  addWarning(message, testFile = null) {
    this.results.warnings.push({
      message,
      testFile,
      timestamp: new Date().toISOString()
    });
  }

  calculateSummary() {
    const successRate = this.results.total > 0 ? (this.results.passed / this.results.total * 100) : 0;
    const totalDuration = this.results.endTime && this.results.startTime ? 
      new Date(this.results.endTime) - new Date(this.results.startTime) : 0;

    return {
      totalTests: this.results.total,
      passedTests: this.results.passed,
      failedTests: this.results.failed,
      skippedTests: this.results.skipped,
      successRate: successRate.toFixed(2),
      totalDuration,
      averageTestDuration: this.results.total > 0 ? totalDuration / this.results.total : 0,
      errorCount: this.results.errors.length,
      warningCount: this.results.warnings.length,
      suiteCount: Object.keys(this.results.suites).length
    };
  }

  generateReport() {
    const summary = this.calculateSummary();
    const report = [];

    // Header
    report.push('='.repeat(80));
    report.push(' REVIEW MANAGEMENT TEST EXECUTION REPORT ');
    report.push('='.repeat(80));
    report.push('');

    // Executive Summary
    report.push('EXECUTIVE SUMMARY:');
    report.push('===================');
    report.push(`Execution Date: ${new Date().toLocaleString()}`);
    report.push(`Total Test Suites: ${summary.suiteCount}`);
    report.push(`Total Tests: ${summary.totalTests}`);
    report.push(`Passed: ${summary.passedTests}`);
    report.push(`Failed: ${summary.failedTests}`);
    report.push(`Skipped: ${summary.skippedTests}`);
    report.push(`Success Rate: ${summary.successRate}%`);
    report.push(`Total Duration: ${summary.totalDuration}ms`);
    report.push(`Average Test Duration: ${summary.averageTestDuration.toFixed(2)}ms`);
    report.push(`Errors: ${summary.errorCount}`);
    report.push(`Warnings: ${summary.warningCount}`);
    report.push('');

    // Test Suite Details
    report.push('TEST SUITE DETAILS:');
    report.push('====================');
    
    Object.entries(this.results.suites).forEach(([testFile, suite]) => {
      report.push(`\n${testFile}:`);
      report.push(`  Status: ${suite.status}`);
      report.push(`  Total Tests: ${suite.total}`);
      report.push(`  Passed: ${suite.passed}`);
      report.push(`  Failed: ${suite.failed}`);
      report.push(`  Skipped: ${suite.skipped}`);
      report.push(`  Duration: ${suite.duration}ms`);
      
      if (suite.errors && suite.errors.length > 0) {
        report.push('  Errors:');
        suite.errors.forEach(error => {
          report.push(`    - ${error}`);
        });
      }
    });

    // Error Summary
    if (this.results.errors.length > 0) {
      report.push('\nERROR SUMMARY:');
      report.push('===============');
      this.results.errors.forEach((error, index) => {
        report.push(`${index + 1}. ${error.testFile}: ${error.error}`);
      });
    }

    // Warning Summary
    if (this.results.warnings.length > 0) {
      report.push('\nWARNING SUMMARY:');
      report.push('=================');
      this.results.warnings.forEach((warning, index) => {
        report.push(`${index + 1}. ${warning.testFile || 'General'}: ${warning.message}`);
      });
    }

    // Bangladesh-Specific Insights
    report.push('\nBANGLADESH-SPECIFIC INSIGHTS:');
    report.push('==============================');
    report.push('Cultural Context:');
    report.push('  - Tests include Bangladesh cultural context and language support');
    report.push('  - Coverage areas: Bengali language, Regional preferences, Festival patterns');
    report.push('');
    report.push('Market Specific:');
    report.push('  - Tests cover Bangladesh market-specific scenarios');
    report.push('  - Coverage areas: Price sensitivity, Brand loyalty, Regional variations');
    report.push('');
    report.push('Performance:');
    report.push('  - Performance tests handle Bangladesh-specific load patterns');
    report.push('  - Coverage areas: High traffic periods, Festival season load');

    // Recommendations
    report.push('\nRECOMMENDATIONS:');
    report.push('================');
    
    if (summary.successRate < 80) {
      report.push('1. [HIGH] Improve test success rate by fixing failing tests');
    }
    
    if (summary.errorCount > 0) {
      report.push('2. [HIGH] Address environment and dependency issues');
    }
    
    if (summary.warningCount > 0) {
      report.push('3. [MEDIUM] Review and address warning conditions');
    }
    
    report.push('4. [LOW] Consider adding more comprehensive test coverage');
    report.push('5. [LOW] Enhance Bangladesh-specific test scenarios');

    // Footer
    report.push('\nReport generated by: Smart Technologies Bangladesh Review Test Runner');
    report.push(`Generated on: ${new Date().toISOString()}`);
    report.push('='.repeat(80));

    return report.join('\n');
  }

  saveReport() {
    if (!TEST_CONFIG.GENERATE_REPORTS) return;

    const report = this.generateReport();
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const reportPath = path.join(__dirname, `REVIEW_TEST_REPORT_${timestamp}.md`);
    
    try {
      fs.writeFileSync(reportPath, report, 'utf8');
      console.log(`\n📄 Test report saved to: ${reportPath}`);
      
      // Also save JSON results
      const jsonPath = path.join(__dirname, `REVIEW_TEST_RESULTS_${timestamp}.json`);
      fs.writeFileSync(jsonPath, JSON.stringify({
        summary: this.calculateSummary(),
        suites: this.results.suites,
        errors: this.results.errors,
        warnings: this.results.warnings,
        timestamp: new Date().toISOString()
      }, null, 2), 'utf8');
      console.log(`📊 Test results JSON saved to: ${jsonPath}`);
      
    } catch (error) {
      console.error(`Failed to save report: ${error.message}`);
    }
  }
}

/**
 * Simple Review Test Runner
 */
class SimpleReviewTestRunner {
  constructor() {
    this.results = new TestResults();
    this.logger = this.createLogger();
  }

  createLogger() {
    return {
      info: (message) => {
        if (TEST_CONFIG.DETAILED_LOGGING) {
          console.log(`ℹ️  ${message}`);
        }
      },
      error: (message) => {
        console.error(`❌ ${message}`);
      },
      warn: (message) => {
        console.warn(`⚠️  ${message}`);
      },
      success: (message) => {
        console.log(`✅ ${message}`);
      }
    };
  }

  /**
   * Execute a single test file
   * @param {string} testFile - Test file name
   * @returns {Promise<Object>} Test result
   */
  async executeTestFile(testFile) {
    this.logger.info(`Executing ${testFile}`);
    const startTime = performance.now();

    try {
      // Try to run the test with Jest
      const jestCommand = `npx jest ${testFile} --verbose --detectOpenHandles --forceExit --testTimeout=${TEST_CONFIG.TEST_TIMEOUT}`;
      
      const result = execSync(jestCommand, {
        cwd: path.join(__dirname, '..'),
        timeout: TEST_CONFIG.TEST_TIMEOUT,
        encoding: 'utf8',
        stdio: ['pipe', 'pipe', 'pipe']
      });

      const endTime = performance.now();
      const duration = endTime - startTime;

      // Parse Jest output to extract test results
      const parsedResult = this.parseJestOutput(result, testFile, duration);
      
      this.logger.success(`${testFile} completed in ${duration.toFixed(2)}ms`);
      return parsedResult;

    } catch (error) {
      const endTime = performance.now();
      const duration = endTime - startTime;

      this.logger.error(`${testFile} failed: ${error.message}`);
      
      // Add warning about environment issues
      if (error.message.includes('Cannot find module') || error.message.includes('ENOENT')) {
        this.results.addWarning(`Environment issue detected: ${error.message}`, testFile);
      } else if (error.message.includes('SyntaxError')) {
        this.results.addWarning(`Syntax error detected: ${error.message}`, testFile);
      }

      return {
        total: 0,
        passed: 0,
        failed: 1,
        skipped: 0,
        duration,
        status: 'failed',
        errors: [error.message]
      };
    }
  }

  /**
   * Parse Jest output to extract test results
   * @param {string} output - Jest output
   * @param {string} testFile - Test file name
   * @param {number} duration - Execution duration
   * @returns {Object} Parsed result
   */
  parseJestOutput(output, testFile, duration) {
    const lines = output.split('\n');
    let total = 0;
    let passed = 0;
    let failed = 0;
    let skipped = 0;
    const errors = [];

    // Simple parsing of Jest output
    lines.forEach(line => {
      if (line.includes('✓') || line.includes('PASS')) {
        passed++;
        total++;
      } else if (line.includes('✗') || line.includes('FAIL')) {
        failed++;
        total++;
        // Extract error message
        const errorMatch = line.match(/Error: (.+)/);
        if (errorMatch) {
          errors.push(errorMatch[1]);
        }
      } else if (line.includes('skipped') || line.includes('TODO')) {
        skipped++;
        total++;
      }
    });

    // If no tests were found in output, assume it passed with no tests
    if (total === 0) {
      return {
        total: 0,
        passed: 0,
        failed: 0,
        skipped: 0,
        duration,
        status: 'passed',
        errors: []
      };
    }

    return {
      total,
      passed,
      failed,
      skipped,
      duration,
      status: failed > 0 ? 'failed' : 'passed',
      errors
    };
  }

  /**
   * Run all review tests
   */
  async runAllTests() {
    this.logger.info('Starting Review Management Test Suite');
    this.logger.info('===================================');
    
    this.results.results.startTime = new Date().toISOString();

    // Execute tests sequentially
    for (const testFile of REVIEW_TEST_FILES) {
      const result = await this.executeTestFile(testFile);
      this.results.addSuiteResult(testFile, result);
    }

    this.results.results.endTime = new Date().toISOString();

    // Generate and display summary
    const summary = this.results.calculateSummary();
    this.displaySummary(summary);

    // Save report
    this.results.saveReport();

    // Return results
    return {
      summary,
      suites: this.results.suites,
      success: summary.failedTests === 0
    };
  }

  /**
   * Display test summary
   * @param {Object} summary - Test summary
   */
  displaySummary(summary) {
    console.log('\n' + '='.repeat(80));
    console.log(' TEST EXECUTION SUMMARY ');
    console.log('='.repeat(80));
    console.log(`Total Test Suites: ${summary.suiteCount}`);
    console.log(`Total Tests: ${summary.totalTests}`);
    console.log(`Passed: ${summary.passedTests}`);
    console.log(`Failed: ${summary.failedTests}`);
    console.log(`Skipped: ${summary.skippedTests}`);
    console.log(`Success Rate: ${summary.successRate}%`);
    console.log(`Total Duration: ${summary.totalDuration}ms`);
    console.log(`Errors: ${summary.errorCount}`);
    console.log(`Warnings: ${summary.warningCount}`);
    
    if (summary.failedTests === 0) {
      console.log('\n🎉 ALL TESTS COMPLETED SUCCESSFULLY!');
    } else {
      console.log('\n❌ SOME TESTS FAILED!');
    }
    
    console.log('='.repeat(80));
  }
}

/**
 * Main execution function
 */
async function main() {
  const testRunner = new SimpleReviewTestRunner();
  
  try {
    const results = await testRunner.runAllTests();
    
    // Exit with appropriate code
    process.exit(results.success ? 0 : 1);
  } catch (error) {
    console.error('❌ Error running review tests:', error.message);
    process.exit(1);
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  main();
}

module.exports = SimpleReviewTestRunner;