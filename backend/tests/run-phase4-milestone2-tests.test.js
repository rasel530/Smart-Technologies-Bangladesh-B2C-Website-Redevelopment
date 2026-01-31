/**
 * Phase 4 Milestone 2 Test Execution Script
 * 
 * This script runs all test suites for Phase 4 Milestone 2 and generates comprehensive reports.
 * 
 * Test Suites:
 * 1. Search Functionality Tests (20+ tests)
 * 2. Bulk Operations Tests (15+ tests)
 * 3. Backward Compatibility Tests (15+ tests)
 * 4. Integration Tests (10+ tests)
 * 5. Performance Tests (5+ tests)
 * 6. Security Tests (5+ tests)
 * 
 * Total: 70+ tests
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Test configuration
const TEST_SUITES = [
  {
    name: 'Search Functionality Tests',
    file: 'phase4-milestone2-integration.test.js',
    pattern: 'Search Functionality Tests'
  },
  {
    name: 'Bulk Operations Tests',
    file: 'phase4-milestone2-integration.test.js',
    pattern: 'Bulk Operations Tests'
  },
  {
    name: 'Backward Compatibility Tests',
    file: 'phase4-milestone2-integration.test.js',
    pattern: 'Backward Compatibility Tests'
  },
  {
    name: 'Integration Tests',
    file: 'phase4-milestone2-integration.test.js',
    pattern: 'Integration Tests'
  },
  {
    name: 'Performance Tests',
    file: 'phase4-milestone2-integration.test.js',
    pattern: 'Performance Tests'
  },
  {
    name: 'Security Tests',
    file: 'phase4-milestone2-integration.test.js',
    pattern: 'Security Tests'
  }
];

// Report structure
let testResults = {
  testRun: {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    testSuite: 'Phase 4 Milestone 2 Integration Tests'
  },
  summary: {
    totalTests: 0,
    passed: 0,
    failed: 0,
    skipped: 0,
    passRate: '0%',
    totalExecutionTime: '0s'
  },
  testSuites: [],
  failedTests: [],
  performanceMetrics: {
    searchResponseTimeP95: 'N/A',
    bulkCreatePerformance: 'N/A',
    bulkUpdatePerformance: 'N/A',
    bulkDeletePerformance: 'N/A',
    elasticsearchIndexingPerformance: 'N/A'
  },
  backwardCompatibility: {
    status: 'NOT TESTED',
    regressionsFound: 0
  }
};

// Helper function to run Jest tests
function runTestSuite(testSuite) {
  console.log(`\n========================================`);
  console.log(`Running: ${testSuite.name}`);
  console.log(`========================================\n`);

  const startTime = Date.now();

  try {
    // Run Jest with verbose output and JSON reporter
    const jestCommand = `npx jest ${testSuite.file} --testNamePattern="${testSuite.pattern}" --verbose --json --outputFile=test-results-${testSuite.name.replace(/\s+/g, '-').toLowerCase()}.json`;

    console.log(`Executing: ${jestCommand}`);
    execSync(jestCommand, {
      stdio: 'inherit',
      cwd: __dirname
    });

    const endTime = Date.now();
    const executionTime = endTime - startTime;

    console.log(`\n✓ ${testSuite.name} completed in ${(executionTime / 1000).toFixed(2)}s`);

    return {
      name: testSuite.name,
      executionTime,
      status: 'completed'
    };
  } catch (error) {
    const endTime = Date.now();
    const executionTime = endTime - startTime;

    console.log(`\n✗ ${testSuite.name} failed after ${(executionTime / 1000).toFixed(2)}s`);
    console.error(error.message);

    return {
      name: testSuite.name,
      executionTime,
      status: 'failed',
      error: error.message
    };
  }
}

// Helper function to parse Jest JSON results
function parseJestResults(resultFile) {
  const resultPath = path.join(__dirname, resultFile);

  if (!fs.existsSync(resultPath)) {
    console.warn(`Result file not found: ${resultPath}`);
    return null;
  }

  try {
    const content = fs.readFileSync(resultPath, 'utf8');
    const data = JSON.parse(content);

    // Clean up result file
    fs.unlinkSync(resultPath);

    return data;
  } catch (error) {
    console.error(`Error parsing result file: ${error.message}`);
    return null;
  }
}

// Helper function to extract test results from Jest output
function extractTestResults(jestData) {
  if (!jestData || !jestData.testResults) {
    return {
      totalTests: 0,
      passed: 0,
      failed: 0,
      skipped: 0,
      failedTests: []
    };
  }

  const testResults = jestData.testResults[0];
  const assertionResults = testResults.assertionResults;

  let totalTests = 0;
  let passed = 0;
  let failed = 0;
  let skipped = 0;
  const failedTests = [];

  assertionResults.forEach(result => {
    totalTests++;

    if (result.status === 'passed') {
      passed++;
    } else if (result.status === 'failed') {
      failed++;
      failedTests.push({
        testName: result.fullName,
        suite: result.ancestorTitles.join(' > '),
        error: result.failureMessages ? result.failureMessages.join('; ') : 'Unknown error',
        stackTrace: result.failureDetails || ''
      });
    } else if (result.status === 'skipped') {
      skipped++;
    }
  });

  return {
    totalTests,
    passed,
    failed,
    skipped,
    failedTests
  };
}

// Helper function to format execution time
function formatExecutionTime(ms) {
  if (ms < 1000) {
    return `${ms}ms`;
  } else if (ms < 60000) {
    return `${(ms / 1000).toFixed(2)}s`;
  } else {
    return `${(ms / 60000).toFixed(2)}m`;
  }
}

// Helper function to calculate pass rate
function calculatePassRate(passed, total) {
  if (total === 0) return '0%';
  return `${((passed / total) * 100).toFixed(2)}%`;
}

// Helper function to generate JSON report
function generateJSONReport() {
  const reportPath = path.join(__dirname, 'phase4-milestone2-test-report.json');
  
  fs.writeFileSync(reportPath, JSON.stringify(testResults, null, 2), 'utf8');
  
  console.log(`\n✓ JSON report saved to: ${reportPath}`);
}

// Helper function to generate Markdown report
function generateMarkdownReport() {
  const reportPath = path.join(__dirname, 'phase4-milestone2-test-report.md');
  
  let markdown = `# Phase 4 Milestone 2 Integration Test Report\n\n`;
  markdown += `**Generated:** ${testResults.testRun.timestamp}\n`;
  markdown += `**Environment:** ${testResults.testRun.environment}\n\n`;
  
  // Summary
  markdown += `## Summary\n\n`;
  markdown += `| Metric | Value |\n`;
  markdown += `|--------|-------|\n`;
  markdown += `| Total Tests | ${testResults.summary.totalTests} |\n`;
  markdown += `| Passed | ${testResults.summary.passed} |\n`;
  markdown += `| Failed | ${testResults.summary.failed} |\n`;
  markdown += `| Skipped | ${testResults.summary.skipped} |\n`;
  markdown += `| Pass Rate | ${testResults.summary.passRate} |\n`;
  markdown += `| Total Execution Time | ${testResults.summary.totalExecutionTime} |\n\n`;
  
  // Test Suites
  markdown += `## Test Suites\n\n`;
  testResults.testSuites.forEach(suite => {
    const statusIcon = suite.status === 'completed' ? '✓' : '✗';
    markdown += `### ${statusIcon} ${suite.name}\n\n`;
    markdown += `- **Status:** ${suite.status}\n`;
    markdown += `- **Execution Time:** ${formatExecutionTime(suite.executionTime)}\n`;
    markdown += `- **Total Tests:** ${suite.totalTests}\n`;
    markdown += `- **Passed:** ${suite.passed}\n`;
    markdown += `- **Failed:** ${suite.failed}\n`;
    markdown += `- **Pass Rate:** ${suite.passRate}\n\n`;
  });
  
  // Failed Tests
  if (testResults.failedTests.length > 0) {
    markdown += `## Failed Tests\n\n`;
    testResults.failedTests.forEach((test, index) => {
      markdown += `### ${index + 1}. ${test.testName}\n\n`;
      markdown += `- **Suite:** ${test.suite}\n`;
      markdown += `- **Error:** ${test.error}\n`;
      markdown += `- **Stack Trace:**\n\`\`\n${test.stackTrace}\n\`\`\n\n`;
    });
  }
  
  // Performance Metrics
  markdown += `## Performance Metrics\n\n`;
  markdown += `| Metric | Value |\n`;
  markdown += `|--------|-------|\n`;
  markdown += `| Search Response Time (P95) | ${testResults.performanceMetrics.searchResponseTimeP95} |\n`;
  markdown += `| Bulk Create Performance | ${testResults.performanceMetrics.bulkCreatePerformance} |\n`;
  markdown += `| Bulk Update Performance | ${testResults.performanceMetrics.bulkUpdatePerformance} |\n`;
  markdown += `| Bulk Delete Performance | ${testResults.performanceMetrics.bulkDeletePerformance} |\n`;
  markdown += `| Elasticsearch Indexing Performance | ${testResults.performanceMetrics.elasticsearchIndexingPerformance} |\n\n`;
  
  // Backward Compatibility
  markdown += `## Backward Compatibility\n\n`;
  markdown += `- **Status:** ${testResults.backwardCompatibility.status}\n`;
  markdown += `- **Regressions Found:** ${testResults.backwardCompatibility.regressionsFound}\n\n`;
  
  // Recommendations
  if (testResults.summary.failed > 0) {
    markdown += `## Recommendations\n\n`;
    markdown += `Based on the test results, the following actions are recommended:\n\n`;
    
    if (testResults.backwardCompatibility.regressionsFound > 0) {
      markdown += `1. **Address Backward Compatibility Issues:** ${testResults.backwardCompatibility.regressionsFound} regressions were found. Review and fix the affected endpoints.\n\n`;
    }
    
    if (testResults.failedTests.some(t => t.suite.includes('Performance'))) {
      markdown += `2. **Optimize Performance:** Some performance tests failed. Review the slow operations and optimize them.\n\n`;
    }
    
    if (testResults.failedTests.some(t => t.suite.includes('Security'))) {
      markdown += `3. **Security Hardening:** Security tests failed. Review authentication and authorization mechanisms.\n\n`;
    }
    
    markdown += `4. **Review Failed Tests:** Each failed test above should be reviewed and fixed.\n\n`;
  } else {
    markdown += `## Recommendations\n\n`;
    markdown += `All tests passed! The system is ready for deployment.\n\n`;
  }
  
  fs.writeFileSync(reportPath, markdown, 'utf8');
  
  console.log(`✓ Markdown report saved to: ${reportPath}`);
}

// Helper function to generate console summary
function generateConsoleSummary() {
  console.log('\n========================================');
  console.log('TEST EXECUTION SUMMARY');
  console.log('========================================\n');
  
  console.log(`Total Tests: ${testResults.summary.totalTests}`);
  console.log(`Passed: ${testResults.summary.passed}`);
  console.log(`Failed: ${testResults.summary.failed}`);
  console.log(`Skipped: ${testResults.summary.skipped}`);
  console.log(`Pass Rate: ${testResults.summary.passRate}`);
  console.log(`Total Execution Time: ${testResults.summary.totalExecutionTime}\n`);
  
  console.log('Test Suites:');
  testResults.testSuites.forEach(suite => {
    const statusIcon = suite.status === 'completed' ? '✓' : '✗';
    console.log(`  ${statusIcon} ${suite.name}: ${suite.passed}/${suite.totalTests} passed (${suite.passRate}) - ${formatExecutionTime(suite.executionTime)}`);
  });
  
  console.log('\nPerformance Metrics:');
  console.log(`  Search Response Time (P95): ${testResults.performanceMetrics.searchResponseTimeP95}`);
  console.log(`  Bulk Create Performance: ${testResults.performanceMetrics.bulkCreatePerformance}`);
  console.log(`  Bulk Update Performance: ${testResults.performanceMetrics.bulkUpdatePerformance}`);
  console.log(`  Bulk Delete Performance: ${testResults.performanceMetrics.bulkDeletePerformance}`);
  console.log(`  Elasticsearch Indexing Performance: ${testResults.performanceMetrics.elasticsearchIndexingPerformance}`);
  
  console.log('\nBackward Compatibility:');
  console.log(`  Status: ${testResults.backwardCompatibility.status}`);
  console.log(`  Regressions Found: ${testResults.backwardCompatibility.regressionsFound}`);
  
  if (testResults.summary.failed > 0) {
    console.log(`\n⚠ ${testResults.summary.failed} test(s) failed. See reports for details.`);
  } else {
    console.log('\n✓ All tests passed!');
  }
}

// Main execution function
async function main() {
  console.log('========================================');
  console.log('PHASE 4 MILESTONE 2 TEST EXECUTION');
  console.log('========================================\n');
  
  const overallStartTime = Date.now();
  
  // Run each test suite
  for (const testSuite of TEST_SUITES) {
    const result = runTestSuite(testSuite);
    
    // Parse results
    const resultFile = `test-results-${testSuite.name.replace(/\s+/g, '-').toLowerCase()}.json`;
    const jestData = parseJestResults(resultFile);
    
    if (jestData) {
      const extractedResults = extractTestResults(jestData);
      
      testResults.summary.totalTests += extractedResults.totalTests;
      testResults.summary.passed += extractedResults.passed;
      testResults.summary.failed += extractedResults.failed;
      testResults.summary.skipped += extractedResults.skipped;
      testResults.failedTests.push(...extractedResults.failedTests);
      
      // Extract performance metrics
      if (testSuite.name === 'Performance Tests') {
        // Look for performance metrics in test results
        const perfTest = extractedResults.failedTests.find(t => 
          t.testName.includes('search response time')
        );
        
        if (perfTest) {
          // Extract p95 value from error message
          const match = perfTest.error.match(/Expected (\d+) to be less than/);
          if (match) {
            testResults.performanceMetrics.searchResponseTimeP95 = `${match[1]}ms`;
          }
        }
      }
      
      testResults.testSuites.push({
        name: testSuite.name,
        totalTests: extractedResults.totalTests,
        passed: extractedResults.passed,
        failed: extractedResults.failed,
        executionTime: result.executionTime,
        passRate: calculatePassRate(extractedResults.passed, extractedResults.totalTests),
        status: result.status
      });
    }
  }
  
  const overallEndTime = Date.now();
  const overallExecutionTime = overallEndTime - overallStartTime;
  
  // Update summary
  testResults.summary.totalExecutionTime = formatExecutionTime(overallExecutionTime);
  testResults.summary.passRate = calculatePassRate(
    testResults.summary.passed,
    testResults.summary.totalTests
  );
  
  // Check backward compatibility
  const backwardCompatibilitySuite = testResults.testSuites.find(
    s => s.name === 'Backward Compatibility Tests'
  );
  
  if (backwardCompatibilitySuite) {
    if (backwardCompatibilitySuite.failed === 0) {
      testResults.backwardCompatibility.status = 'PASS';
    } else {
      testResults.backwardCompatibility.status = 'FAIL';
      testResults.backwardCompatibility.regressionsFound = backwardCompatibilitySuite.failed;
    }
  }
  
  // Generate reports
  console.log('\n========================================');
  console.log('GENERATING REPORTS');
  console.log('========================================\n');
  
  generateJSONReport();
  generateMarkdownReport();
  generateConsoleSummary();
  
  console.log('\n========================================');
  console.log('TEST EXECUTION COMPLETE');
  console.log('========================================');
}

// Execute main function
main().catch(error => {
  console.error('Fatal error during test execution:', error);
  process.exit(1);
});
