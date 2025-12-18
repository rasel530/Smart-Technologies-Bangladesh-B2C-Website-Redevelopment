/**
 * API Test Runner
 * 
 * This test suite runs all API endpoint tests for the Smart Technologies Bangladesh B2C Website.
 * It provides comprehensive testing coverage and generates detailed reports.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

/**
 * Test configuration
 */
const TEST_CONFIG = {
  testFiles: [
    'api-auth.test.js',
    'api-users.test.js',
    'api-products.test.js',
    'api-categories.test.js',
    'api-brands.test.js',
    'api-orders.test.js',
    // Add more test files as they are created
    // 'api-cart.test.js',
    // 'api-wishlist.test.js',
    // 'api-reviews.test.js',
    // 'api-coupons.test.js'
  ],
  testDirectory: './tests',
  coverageDirectory: './coverage',
  reportFile: './test-results/api-test-report.json',
  jestConfig: {
    testEnvironment: 'node',
    collectCoverage: true,
    coverageDirectory: './coverage',
    coverageReporters: ['text', 'lcov', 'json', 'html'],
    verbose: true,
    detectOpenHandles: true,
    forceExit: false,
    maxWorkers: 4,
    testTimeout: 30000,
    setupFilesAfterEnv: ['<rootDir>/tests/test-setup.js']
  }
};

/**
 * Colors for console output
 */
const COLORS = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

/**
 * Print colored message to console
 * @param {string} message - Message to print
 * @param {string} color - Color to use
 */
const printColor = (message, color = COLORS.reset) => {
  console.log(`${color}${message}${COLORS.reset}`);
};

/**
 * Print section header
 * @param {string} title - Section title
 */
const printSection = (title) => {
  printColor(`\n${'='.repeat(60)}`, COLORS.cyan);
  printColor(`  ${title}`, COLORS.bright);
  printColor(`${'='.repeat(60)}\n`, COLORS.cyan);
};

/**
 * Print test result
 * @param {string} testName - Test name
 * @param {boolean} passed - Whether test passed
 * @param {string} details - Additional details
 */
const printTestResult = (testName, passed, details = '') => {
  const status = passed ? '✓ PASSED' : '✗ FAILED';
  const color = passed ? COLORS.green : COLORS.red;
  printColor(`  ${status.padEnd(12)} ${testName}`, color);
  if (details) {
    printColor(`    ${details}`, COLORS.yellow);
  }
};

/**
 * Ensure coverage directory exists
 */
const ensureCoverageDirectory = () => {
  if (!fs.existsSync(TEST_CONFIG.coverageDirectory)) {
    fs.mkdirSync(TEST_CONFIG.coverageDirectory, { recursive: true });
  }
};

/**
 * Run Jest tests for a specific file
 * @param {string} testFile - Test file to run
 * @returns {Object} Test result
 */
const runJestTest = (testFile) => {
  printSection(`Running ${testFile}`);
  const jestCommand = `npx jest ${testFile} --config=jest.config.js --json --outputFile=${TEST_CONFIG.reportFile}`;
  try {
    const result = execSync(jestCommand, { 
      encoding: 'utf8',
      stdio: 'pipe',
      cwd: path.resolve(__dirname, '..')
    });
    
    return {
      success: true,
      output: result
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      output: error.stdout || ''
    };
  }
};

/**
 * Parse Jest JSON output
 * @param {string} jsonOutput - Jest JSON output
 * @returns {Object} Parsed test results
 */
const parseJestOutput = (jsonOutput) => {
  try {
    // Extract JSON from Jest output
    const jsonMatch = jsonOutput.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    return null;
  } catch (error) {
    printColor(`Error parsing Jest output: ${error.message}`, COLORS.red);
    return null;
  }
};

/**
 * Generate test summary report
 * @param {Array} testResults - Array of test results
 */
const generateSummaryReport = (testResults) => {
  const summary = {
    totalTests: 0,
    totalPassed: 0,
    totalFailed: 0,
    totalSuites: testResults.length,
    passedSuites: 0,
    failedSuites: 0,
    coverage: {},
    timestamp: new Date().toISOString(),
    duration: 0
  };

  testResults.forEach(result => {
    if (result.success && result.output) {
      const jestData = parseJestOutput(result.output);
      if (jestData) {
        summary.totalTests += jestData.numTotalTests || 0;
        summary.totalPassed += jestData.numPassedTests || 0;
        summary.totalFailed += jestData.numFailedTests || 0;
        summary.duration += jestData.testResults?.[0]?.duration || 0;
        
        if (jestData.numFailedTests === 0) {
          summary.passedSuites++;
        } else {
          summary.failedSuites++;
        }

        // Extract coverage data
        if (jestData.coverageMap) {
          summary.coverage = jestData.coverageMap;
        }
      }
    } else {
      summary.failedSuites++;
    }
  });

  return summary;
};

/**
 * Print detailed test summary
 * @param {Object} summary - Test summary
 */
const printDetailedSummary = (summary) => {
  printSection('TEST EXECUTION SUMMARY');
  
  printColor(`Total Test Suites: ${summary.totalSuites}`, COLORS.bright);
  printColor(`Passed Suites: ${summary.passedSuites}`, COLORS.green);
  printColor(`Failed Suites: ${summary.failedSuites}`, COLORS.red);  
  printColor(`\nTotal Tests: ${summary.totalTests}`, COLORS.bright);
  printColor(`Passed Tests: ${summary.totalPassed}`, COLORS.green);
  printColor(`Failed Tests: ${summary.totalFailed}`, COLORS.red);  
  const passRate = summary.totalTests > 0 
    ? ((summary.totalPassed / summary.totalTests) * 100).toFixed(2)
    : 0;  
  printColor(`\nSuccess Rate: ${passRate}%`, passRate >= 90 ? COLORS.green : passRate >= 70 ? COLORS.yellow : COLORS.red);
  printColor(`Total Duration: ${(summary.duration / 1000).toFixed(2)}s`, COLORS.blue);
};

/**
 * Print coverage summary
 * @param {Object} coverage - Coverage data
 */
const printCoverageSummary = (coverage) => {
  if (!coverage || Object.keys(coverage).length === 0) {
    printColor('\nNo coverage data available', COLORS.yellow);
    return;
  }

  printSection('CODE COVERAGE SUMMARY');
  
  Object.keys(coverage).forEach(filename => {
    const fileCoverage = coverage[filename];
    if (fileCoverage.lines) {
      const lines = fileCoverage.lines;
      const coveragePercent = lines.pct || 0;
      
      let color = COLORS.red;
      if (coveragePercent >= 80) color = COLORS.green;
      else if (coveragePercent >= 60) color = COLORS.yellow;
      
      printColor(`${filename}: ${coveragePercent.toFixed(2)}%`, color);
    }
  });
};

/**
 * Save detailed report to file
 * @param {Object} summary - Test summary
 */
const saveReportToFile = (summary) => {
  const reportDir = path.dirname(TEST_CONFIG.reportFile);
  if (!fs.existsSync(reportDir)) {
    fs.mkdirSync(reportDir, { recursive: true });
  }

  const report = {
    summary,
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'test',
    nodeVersion: process.version,
    platform: process.platform,
    testConfig: TEST_CONFIG
  };

  fs.writeFileSync(TEST_CONFIG.reportFile, JSON.stringify(report, null, 2));
  printColor(`\nDetailed report saved to: ${TEST_CONFIG.reportFile}`, COLORS.cyan);
};

/**
 * Main test runner function
 */
const runAllTests = async () => {
  printSection('SMART TECHNOLOGIES BANGLADESH API TEST SUITE');
  printColor('Starting comprehensive API endpoint testing...', COLORS.bright);
  const startTime = Date.now();
  ensureCoverageDirectory();
  
  const testResults = [];
  // Run each test file
  for (const testFile of TEST_CONFIG.testFiles) {
    const testFilePath = path.join(TEST_CONFIG.testDirectory, testFile);
    
    if (fs.existsSync(testFilePath)) {
      const result = runJestTest(testFile);
      testResults.push({
        file: testFile,
        ...result
      });
      
      printTestResult(
        testFile, 
        result.success, 
        result.success ? '' : result.error
      );
    } else {
      printTestResult(testFile, false, 'Test file not found');
      testResults.push({
        file: testFile,
        success: false,
        error: 'Test file not found'
      });
    }
  }
  
  const endTime = Date.now();
  const totalDuration = endTime - startTime;
  // Generate and print summary
  const summary = generateSummaryReport(testResults);
  summary.duration = totalDuration;
  printDetailedSummary(summary);
  
  if (summary.coverage) {
    printCoverageSummary(summary.coverage);
  }
  
  // Save report to file
  saveReportToFile(summary);
  
  // Exit with appropriate code
  const exitCode = summary.totalFailed > 0 ? 1 : 0;
  printSection('TEST COMPLETION');
  if (exitCode === 0) {
    printColor('🎉 All tests completed successfully!', COLORS.green);
  } else {
    printColor(`❌ ${summary.totalFailed} test(s) failed. Please review the errors above.`, COLORS.red);
  }
  
  process.exit(exitCode);
};

/**
 * Handle command line arguments
 */
const handleArguments = () => {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    return;
  }
  
  switch (args[0]) {
    case '--help':
    case '-h':
      printSection('API TEST RUNNER HELP');
      printColor('Usage: node api-test-runner.test.js [options]', COLORS.bright);
      printColor('\nOptions:', COLORS.yellow);
      printColor('  --help, -h     Show this help message', COLORS.cyan);
      printColor('  --list, -l      List available test files', COLORS.cyan);
      printColor('  --file, -f      Run specific test file', COLORS.cyan);
      printColor('  --coverage, -c  Generate coverage report only', COLORS.cyan);
      process.exit(0);
      break;
      
    case '--list':
    case '-l':
      printSection('AVAILABLE TEST FILES');
      TEST_CONFIG.testFiles.forEach(file => {
        printColor(`  - ${file}`, COLORS.cyan);
      });
      process.exit(0);
      break;
      
    case '--file':
    case '-f':
      if (args[1]) {
        const testFile = args[1];
        if (TEST_CONFIG.testFiles.includes(testFile)) {
          printSection(`RUNNING SINGLE TEST: ${testFile}`);
          const result = runJestTest(testFile);
          printTestResult(testFile, result.success, result.error);
          process.exit(result.success ? 0 : 1);
        } else {
          printColor(`Error: Test file '${testFile}' not found`, COLORS.red);
          printColor('Available files:', COLORS.yellow);
          TEST_CONFIG.testFiles.forEach(file => {
            printColor(`  - ${file}`, COLORS.cyan);
          });
          process.exit(1);
        }
      } else {
        printColor('Error: Please specify a test file', COLORS.red);
        printColor('Usage: node api-test-runner.test.js --file <test-file>', COLORS.yellow);
        process.exit(1);
      }
      break;
      
    case '--coverage':
    case '-c':
      printSection('GENERATING COVERAGE REPORT');
      ensureCoverageDirectory();
      
      const coverageCommand = `npx jest --coverage --config=jest.config.js`;
      try {
        execSync(coverageCommand, { 
          stdio: 'inherit',
          cwd: path.resolve(__dirname, '..')
        });
        printColor('Coverage report generated successfully!', COLORS.green);
      } catch (error) {
        printColor(`Error generating coverage: ${error.message}`, COLORS.red);
        process.exit(1);
      }
      break;
      
    default:
      printColor(`Error: Unknown option '${args[0]}'`, COLORS.red);
      printColor('Use --help for available options', COLORS.yellow);
      process.exit(1);
  }
};

/**
 * Check if Jest is installed
 */
const checkDependencies = () => {
  try {
    execSync('npx jest --version', { stdio: 'pipe' });
  } catch (error) {
    printColor('Error: Jest is not installed or not available', COLORS.red);
    printColor('Please install Jest by running: npm install --save-dev jest', COLORS.yellow);
    process.exit(1);
  }
};

// Main execution
if (require.main === module) {
  checkDependencies();
  handleArguments();
  runAllTests();
}

module.exports = {
  runAllTests,
  runJestTest,
  generateSummaryReport,
  TEST_CONFIG
};