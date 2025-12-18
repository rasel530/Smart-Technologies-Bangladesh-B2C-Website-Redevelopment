const { AutomatedTestRunner } = require('./automated-test-runner');

/**
 * Comprehensive Test Suite - Main Entry Point
 * Provides complete testing solution for all scenarios
 */
class ComprehensiveTestSuite {
  constructor() {
    this.runner = null;
    this.testScenarios = {
      quick: {
        name: 'Quick Test',
        description: 'Fast validation tests with mock database',
        options: {
          environment: 'development',
          testCategories: ['database', 'api'],
          runPerformanceTests: false,
          generateReports: true,
          cleanupAfter: true,
          parallelTests: false,
          timeout: 60000
        }
      },
      
      full: {
        name: 'Full Test Suite',
        description: 'Complete testing with all categories and performance',
        options: {
          environment: 'testing',
          testCategories: ['database', 'api', 'integration', 'performance'],
          runPerformanceTests: true,
          generateReports: true,
          cleanupAfter: true,
          parallelTests: true,
          timeout: 300000
        }
      },
      
      production: {
        name: 'Production Validation',
        description: 'Production environment validation with real database',
        options: {
          environment: 'production',
          testCategories: ['database', 'api', 'integration'],
          runPerformanceTests: true,
          generateReports: true,
          cleanupAfter: false,
          parallelTests: false,
          timeout: 600000
        }
      },
      
      ci: {
        name: 'CI/CD Pipeline',
        description: 'Automated testing for CI/CD pipelines',
        options: {
          environment: 'testing',
          testCategories: ['database', 'api', 'integration'],
          runPerformanceTests: false,
          generateReports: true,
          cleanupAfter: true,
          parallelTests: true,
          timeout: 180000
        }
      }
    };
  }

  async run(scenario = 'quick') {
    console.log('🚀 Starting Comprehensive Test Suite');
    console.log('='.repeat(60));
    
    if (!this.testScenarios[scenario]) {
      throw new Error(`Unknown test scenario: ${scenario}`);
    }
    
    const testScenario = this.testScenarios[scenario];
    console.log(`📋 Scenario: ${testScenario.name}`);
    console.log(`📝 Description: ${testScenario.description}`);
    console.log('='.repeat(60));
    
    try {
      // Initialize runner with scenario options
      this.runner = new AutomatedTestRunner(testScenario.options);
      
      // Run the tests
      const results = await this.runner.run();
      
      // Print scenario-specific summary
      this.printScenarioSummary(scenario, results);
      
      return results;
    } catch (error) {
      console.error(`❌ Test scenario '${scenario}' failed:`, error.message);
      throw error;
    }
  }

  async runMultiple(scenarios = ['quick']) {
    console.log('🚀 Starting Multiple Test Scenarios');
    console.log('='.repeat(60));
    
    const allResults = {};
    
    for (const scenario of scenarios) {
      if (!this.testScenarios[scenario]) {
        console.warn(`⚠️  Skipping unknown scenario: ${scenario}`);
        continue;
      }
      
      console.log(`\n🔄 Running scenario: ${scenario}`);
      try {
        allResults[scenario] = await this.run(scenario);
      } catch (error) {
        console.error(`❌ Scenario '${scenario}' failed:`, error.message);
        allResults[scenario] = {
          success: false,
          error: error.message,
          duration: 0
        };
      }
    }
    
    // Print combined summary
    this.printCombinedSummary(allResults);
    
    return allResults;
  }

  printScenarioSummary(scenario, results) {
    const testScenario = this.testScenarios[scenario];
    
    console.log('\n' + '='.repeat(60));
    console.log(`📊 ${testScenario.name} - Results Summary`);
    console.log('='.repeat(60));
    console.log(`Environment: ${results.environment.name}`);
    console.log(`Duration: ${(results.duration / 1000).toFixed(2)} seconds`);
    console.log(`Status: ${results.success ? '✅ SUCCESS' : '❌ FAILED'}`);
    
    if (results.testResults) {
      console.log(`Total Tests: ${results.testResults.summary.totalTests}`);
      console.log(`Passed: ${results.testResults.summary.totalPassed}`);
      console.log(`Failed: ${results.testResults.summary.totalFailed}`);
      console.log(`Success Rate: ${results.testResults.summary.successRate.toFixed(1)}%`);
    }
    
    if (results.error) {
      console.log(`Error: ${results.error}`);
    }
    
    console.log('='.repeat(60));
  }

  printCombinedSummary(allResults) {
    console.log('\n' + '='.repeat(60));
    console.log('📊 Combined Test Results Summary');
    console.log('='.repeat(60));
    
    let totalTests = 0;
    let totalPassed = 0;
    let totalFailed = 0;
    let successCount = 0;
    let failureCount = 0;
    
    for (const [scenario, results] of Object.entries(allResults)) {
      const testScenario = this.testScenarios[scenario];
      
      console.log(`\n${scenario.toUpperCase()} - ${testScenario.name}:`);
      console.log(`  Status: ${results.success ? '✅ SUCCESS' : '❌ FAILED'}`);
      console.log(`  Duration: ${(results.duration / 1000).toFixed(2)}s`);
      
      if (results.success) {
        successCount++;
      } else {
        failureCount++;
      }
      
      if (results.testResults) {
        totalTests += results.testResults.summary.totalTests;
        totalPassed += results.testResults.summary.totalPassed;
        totalFailed += results.testResults.summary.totalFailed;
        
        console.log(`  Tests: ${results.testResults.summary.totalPassed}/${results.testResults.summary.totalTests}`);
        console.log(`  Success Rate: ${results.testResults.summary.successRate.toFixed(1)}%`);
      } else {
        console.log(`  Error: ${results.error}`);
      }
    }
    
    console.log('\n' + '-'.repeat(60));
    console.log('OVERALL SUMMARY:');
    console.log(`Scenarios Run: ${Object.keys(allResults).length}`);
    console.log(`Successful Scenarios: ${successCount}`);
    console.log(`Failed Scenarios: ${failureCount}`);
    console.log(`Total Tests: ${totalTests}`);
    console.log(`Total Passed: ${totalPassed}`);
    console.log(`Total Failed: ${totalFailed}`);
    
    if (totalTests > 0) {
      const overallSuccessRate = (totalPassed / totalTests) * 100;
      console.log(`Overall Success Rate: ${overallSuccessRate.toFixed(1)}%`);
    }
    
    console.log('='.repeat(60));
    
    if (failureCount === 0) {
      console.log('🎉 ALL SCENARIOS PASSED! System is fully validated.');
    } else {
      console.log('⚠️  Some scenarios failed. Please review and fix issues.');
    }
  }

  // Method to run specific test categories
  async runDatabaseTests(scenario = 'quick') {
    const options = { ...this.testScenarios[scenario].options };
    options.testCategories = ['database'];
    
    const runner = new AutomatedTestRunner(options);
    return await runner.run();
  }

  async runAPITests(scenario = 'quick') {
    const options = { ...this.testScenarios[scenario].options };
    options.testCategories = ['api'];
    
    const runner = new AutomatedTestRunner(options);
    return await runner.run();
  }

  async runIntegrationTests(scenario = 'quick') {
    const options = { ...this.testScenarios[scenario].options };
    options.testCategories = ['integration'];
    
    const runner = new AutomatedTestRunner(options);
    return await runner.run();
  }

  async runPerformanceTests(scenario = 'full') {
    const options = { ...this.testScenarios[scenario].options };
    options.testCategories = ['performance'];
    
    const runner = new AutomatedTestRunner(options);
    return await runner.run();
  }

  // Method to validate specific components
  async validateDatabase(scenario = 'quick') {
    console.log('🗄️ Validating Database Configuration...');
    
    const options = { ...this.testScenarios[scenario].options };
    options.testCategories = ['database'];
    options.generateReports = false;
    options.cleanupAfter = true;
    
    const runner = new AutomatedTestRunner(options);
    const results = await runner.run();
    
    return results.success;
  }

  async validateAPI(scenario = 'quick') {
    console.log('🌐 Validating API Endpoints...');
    
    const options = { ...this.testScenarios[scenario].options };
    options.testCategories = ['api'];
    options.generateReports = false;
    options.cleanupAfter = true;
    
    const runner = new AutomatedTestRunner(options);
    const results = await runner.run();
    
    return results.success;
  }

  async validateIntegration(scenario = 'full') {
    console.log('🔗 Validating Integration Flows...');
    
    const options = { ...this.testScenarios[scenario].options };
    options.testCategories = ['integration'];
    options.generateReports = false;
    options.cleanupAfter = true;
    
    const runner = new AutomatedTestRunner(options);
    const results = await runner.run();
    
    return results.success;
  }

  // Bangladesh-specific validation methods
  async validateBangladeshFeatures(scenario = 'full') {
    console.log('🇧🇩 Validating Bangladesh-Specific Features...');
    
    const options = { ...this.testScenarios[scenario].options };
    options.testCategories = ['database', 'api'];
    options.generateReports = false;
    options.cleanupAfter = true;
    
    const runner = new AutomatedTestRunner(options);
    const results = await runner.run();
    
    // Check Bangladesh-specific requirements
    const dbResults = results.testResults?.database;
    const apiResults = results.testResults?.api;
    
    let bangladeshValid = true;
    const bangladeshIssues = [];
    
    // Check divisions
    if (dbResults && dbResults.errors.length > 0) {
      const divisionErrors = dbResults.errors.filter(e => e.test.includes('Bangladesh'));
      if (divisionErrors.length > 0) {
        bangladeshValid = false;
        bangladeshIssues.push('Division validation failed');
      }
    }
    
    // Check payment methods
    if (apiResults && apiResults.errors.length > 0) {
      const paymentErrors = apiResults.errors.filter(e => e.test.includes('payment'));
      if (paymentErrors.length > 0) {
        bangladeshValid = false;
        bangladeshIssues.push('Payment method validation failed');
      }
    }
    
    console.log(`Bangladesh Features Valid: ${bangladeshValid ? '✅' : '❌'}`);
    if (!bangladeshValid) {
      console.log('Issues:', bangladeshIssues.join(', '));
    }
    
    return bangladeshValid;
  }

  // Method to generate test documentation
  generateTestDocumentation() {
    const doc = `
# Smart Technologies Bangladesh - Comprehensive Test Suite

## Overview
This comprehensive test suite provides complete testing capabilities for the Smart Technologies Bangladesh B2C website backend.

## Features
- **Mock Database Testing**: Complete in-memory database simulation
- **Real Database Testing**: PostgreSQL database validation
- **API Endpoint Testing**: Comprehensive REST API testing
- **Integration Testing**: End-to-end workflow validation
- **Performance Testing**: Database and API performance analysis
- **Bangladesh-Specific Testing**: Local payment methods, divisions, and language support

## Test Scenarios

### 1. Quick Test
- **Purpose**: Fast validation during development
- **Database**: Mock
- **Tests**: Database connectivity, basic API endpoints
- **Duration**: ~30 seconds
- **Usage**: \`node tests/comprehensive-test-suite.js quick\`

### 2. Full Test Suite
- **Purpose**: Complete validation before deployment
- **Database**: Mock
- **Tests**: All categories including performance
- **Duration**: ~2-3 minutes
- **Usage**: \`node tests/comprehensive-test-suite.js full\`

### 3. Production Validation
- **Purpose**: Production environment validation
- **Database**: Real PostgreSQL
- **Tests**: Database, API, integration (no performance)
- **Duration**: ~5 minutes
- **Usage**: \`node tests/comprehensive-test-suite.js production\`

### 4. CI/CD Pipeline
- **Purpose**: Automated testing in CI/CD
- **Database**: Mock
- **Tests**: Database, API, integration (parallel execution)
- **Duration**: ~1 minute
- **Usage**: \`node tests/comprehensive-test-suite.js ci\`

## Environment Configuration

### Development Environment
- Mock database with auto-seeded test data
- Debug logging enabled
- Hot reload support
- Performance tests disabled

### Testing Environment
- Mock database with comprehensive test data
- Debug logging enabled
- All test categories enabled
- Performance tests enabled

### Staging Environment
- Real PostgreSQL database
- Production-like configuration
- Performance tests enabled
- Debug logging disabled

### Production Environment
- Real PostgreSQL database
- Production configuration
- Essential tests only
- Performance tests enabled

## Bangladesh-Specific Features

### Supported Divisions
- Dhaka, Chittagong, Rajshahi, Sylhet
- Khulna, Barishal, Rangpur, Mymensingh

### Payment Methods
- bKash, Nagad, Rocket
- Cash on Delivery
- Bank Transfer
- Credit Card

### Language Support
- English (primary)
- Bengali (secondary)
- Localized content and error messages

## Test Data

### Users
- Admin, Manager, Customer accounts
- Bangladesh-specific names and phone numbers
- Multiple user roles and statuses

### Products
- Electronics, Mobile Phones, Computers
- Local and international brands
- Bengali language support

### Orders
- Complete order workflows
- Bangladesh-specific payment methods
- Local shipping addresses

## Reports

### Test Reports
- JSON format for programmatic access
- HTML format for visual review
- Summary reports for quick overview
- Error reports for debugging

### Performance Metrics
- Database query performance
- API response times
- Concurrent request handling
- Large dataset processing

## Usage Examples

### Quick Development Test
\`\`\`bash
# Run quick validation test
node backend/tests/comprehensive-test-suite.js quick
\`\`\`

### Full Validation Test
\`\`\`bash
# Run complete test suite
node backend/tests/comprehensive-test-suite.js full
\`\`\`

### Production Validation
\`\`\`bash
# Validate production environment
NODE_ENV=production DATABASE_URL=postgresql://... node backend/tests/comprehensive-test-suite.js production
\`\`\`

### Custom Test Configuration
\`\`\`javascript
const { ComprehensiveTestSuite } = require('./backend/tests/comprehensive-test-suite');

const testSuite = new ComprehensiveTestSuite();

// Run custom test with specific options
await testSuite.run({
  environment: 'testing',
  testCategories: ['database', 'api'],
  runPerformanceTests: true,
  generateReports: true
});
\`\`\`

## Troubleshooting

### Database Connection Issues
- Check PostgreSQL service status
- Verify connection string format
- Ensure database exists and is accessible

### Test Failures
- Review test reports in \`test-reports/\` directory
- Check error logs for detailed information
- Validate environment configuration

### Performance Issues
- Check system resources
- Review database query performance
- Analyze API response times

## Integration with CI/CD

### GitHub Actions
\`\`\`yaml
- name: Run Tests
  run: |
    node backend/tests/comprehensive-test-suite.js ci
\`\`\`

### Docker Integration
\`\`\`bash
# Run tests in Docker container
docker run -v $(pwd):/app node:18-alpine npm test
\`\`\`

## Support

For issues and questions:
- Review generated test reports
- Check error logs
- Validate environment configuration
- Consult development team

---

*This test suite ensures comprehensive validation of the Smart Technologies Bangladesh B2C website backend with full Bangladesh-specific feature support.*
`;

    return doc;
  }

  // Static methods for easy access
  static async quickRun() {
    const suite = new ComprehensiveTestSuite();
    return await suite.run('quick');
  }

  static async fullRun() {
    const suite = new ComprehensiveTestSuite();
    return await suite.run('full');
  }

  static async productionRun() {
    const suite = new ComprehensiveTestSuite();
    return await suite.run('production');
  }

  static async ciRun() {
    const suite = new ComprehensiveTestSuite();
    return await suite.run('ci');
  }
}

// Command line interface
if (require.main === module) {
  const args = process.argv.slice(2);
  const scenario = args[0] || 'quick';
  
  const suite = new ComprehensiveTestSuite();
  
  suite.run(scenario)
    .then(() => {
      console.log('\n✅ Test execution completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Test execution failed:', error.message);
      process.exit(1);
    });
}

module.exports = {
  ComprehensiveTestSuite
};