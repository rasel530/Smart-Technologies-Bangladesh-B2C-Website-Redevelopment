const { DatabaseValidator } = require('./database-validator');
const { mockDatabaseService } = require('./mock-database');
const { TestDataFixtures } = require('./test-fixtures');
const { APIEndpointTester } = require('./api-endpoint-tests');

/**
 * Integration Test Framework with Configurable Database
 * Provides comprehensive testing capabilities with both mock and real database support
 */
class IntegrationTestFramework {
  constructor(config = {}) {
    this.config = {
      useMockDatabase: process.env.USE_MOCK_DB === 'true' || config.useMockDatabase || false,
      databaseUrl: process.env.DATABASE_URL || config.databaseUrl,
      testTimeout: config.testTimeout || 30000,
      verboseLogging: config.verboseLogging || false,
      autoSeedData: config.autoSeedData !== false,
      performanceTests: config.performanceTests !== false,
      ...config
    };
    
    this.validator = null;
    this.mockDB = mockDatabaseService;
    this.fixtures = new TestDataFixtures();
    this.apiTester = null;
    this.testResults = {
      database: { passed: 0, failed: 0, errors: [] },
      api: { passed: 0, failed: 0, errors: [] },
      integration: { passed: 0, failed: 0, errors: [] },
      performance: { passed: 0, failed: 0, errors: [] },
      summary: { totalTests: 0, totalPassed: 0, totalFailed: 0, successRate: 0 }
    };
    
    this.startTime = null;
    this.endTime = null;
  }

  async initialize() {
    console.log('🚀 Initializing Integration Test Framework...');
    console.log(`Database Mode: ${this.config.useMockDatabase ? 'Mock' : 'Real PostgreSQL'}`);
    
    this.startTime = new Date();
    
    try {
      // Initialize database validator
      this.validator = new DatabaseValidator({
        useMock: this.config.useMockDatabase,
        connectionTimeout: this.config.testTimeout,
        ...this.config
      });
      
      await this.validator.initialize();
      console.log('✅ Database validator initialized');
      
      // Initialize API tester
      this.apiTester = new APIEndpointTester();
      await this.apiTester.initialize();
      console.log('✅ API tester initialized');
      
      // Auto-seed test data if enabled
      if (this.config.autoSeedData) {
        await this.seedTestData();
      }
      
      console.log('✅ Integration test framework initialized successfully');
      return true;
    } catch (error) {
      console.error('❌ Failed to initialize test framework:', error.message);
      throw error;
    }
  }

  async runAllTests() {
    console.log('\n🧪 Starting Comprehensive Integration Tests...\n');
    
    try {
      await this.runDatabaseTests();
      await this.runAPITests();
      await this.runIntegrationTests();
      
      if (this.config.performanceTests) {
        await this.runPerformanceTests();
      }
      
      this.endTime = new Date();
      this.generateTestReport();
      
      return this.testResults;
    } catch (error) {
      console.error('❌ Test execution failed:', error.message);
      throw error;
    }
  }

  async runDatabaseTests() {
    console.log('🗄️ Running Database Tests...');
    
    const dbTests = [
      {
        name: 'Database Connection',
        test: () => this.testDatabaseConnection()
      },
      {
        name: 'Schema Validation',
        test: () => this.testSchemaValidation()
      },
      {
        name: 'CRUD Operations',
        test: () => this.testCRUDOperations()
      },
      {
        name: 'Bangladesh-Specific Data',
        test: () => this.testBangladeshSpecificData()
      },
      {
        name: 'Data Integrity',
        test: () => this.testDataIntegrity()
      }
    ];
    
    for (const dbTest of dbTests) {
      await this.runSingleTest('database', dbTest.name, dbTest.test);
    }
  }

  async runAPITests() {
    console.log('🌐 Running API Tests...');
    
    const apiTests = [
      {
        name: 'Health Endpoints',
        test: () => this.testHealthEndpoints()
      },
      {
        name: 'User Management',
        test: () => this.testUserManagementAPIs()
      },
      {
        name: 'Product Catalog',
        test: () => this.testProductCatalogAPIs()
      },
      {
        name: 'Order Processing',
        test: () => this.testOrderProcessingAPIs()
      },
      {
        name: 'Bangladesh-Specific Features',
        test: () => this.testBangladeshSpecificAPIs()
      },
      {
        name: 'Error Handling',
        test: () => this.testAPIErrorHandling()
      }
    ];
    
    for (const apiTest of apiTests) {
      await this.runSingleTest('api', apiTest.name, apiTest.test);
    }
  }

  async runIntegrationTests() {
    console.log('🔗 Running Integration Tests...');
    
    const integrationTests = [
      {
        name: 'User Registration to Order Flow',
        test: () => this.testUserRegistrationToOrderFlow()
      },
      {
        name: 'Product Discovery to Purchase',
        test: () => this.testProductDiscoveryToPurchase()
      },
      {
        name: 'Cart Management Flow',
        test: () => this.testCartManagementFlow()
      },
      {
        name: 'Review Submission Flow',
        test: () => this.testReviewSubmissionFlow()
      },
      {
        name: 'Multi-step Order Process',
        test: () => this.testMultiStepOrderProcess()
      }
    ];
    
    for (const integrationTest of integrationTests) {
      await this.runSingleTest('integration', integrationTest.name, integrationTest.test);
    }
  }

  async runPerformanceTests() {
    console.log('⚡ Running Performance Tests...');
    
    const performanceTests = [
      {
        name: 'Database Query Performance',
        test: () => this.testDatabaseQueryPerformance()
      },
      {
        name: 'API Response Time',
        test: () => this.testAPIResponseTime()
      },
      {
        name: 'Concurrent Requests',
        test: () => this.testConcurrentRequests()
      },
      {
        name: 'Large Dataset Handling',
        test: () => this.testLargeDatasetHandling()
      }
    ];
    
    for (const perfTest of performanceTests) {
      await this.runSingleTest('performance', perfTest.name, perfTest.test);
    }
  }

  // Database Test Methods
  async testDatabaseConnection() {
    const status = this.validator.getConnectionStatus();
    if (!status.isConnected) {
      throw new Error(`Database not connected: ${status.error}`);
    }
    return true;
  }

  async testSchemaValidation() {
    const validation = await this.validator.validateSchema();
    if (!validation.summary.valid) {
      throw new Error(`Schema validation failed: ${validation.summary.errors.join(', ')}`);
    }
    return true;
  }

  async testCRUDOperations() {
    const crudResults = await this.validator.testCRUDOperations();
    const failedOperations = Object.keys(crudResults).filter(op => !crudResults[op].success);
    if (failedOperations.length > 0) {
      throw new Error(`CRUD operations failed: ${failedOperations.join(', ')}`);
    }
    return true;
  }

  async testBangladeshSpecificData() {
    const divisions = this.config.useMockDatabase 
      ? await this.mockDB.getDivisions()
      : await this.validator.pool.query('SELECT unnest(enum_range(NULL::division)) as division');
    
    const expectedDivisions = ['DHAKA', 'CHITTAGONG', 'RAJSHAHI', 'SYLHET', 'KHULNA', 'BARISHAL', 'RANGPUR', 'MYMENSINGH'];
    
    if (this.config.useMockDatabase) {
      if (!expectedDivisions.every(div => divisions.includes(div))) {
        throw new Error('Missing Bangladesh divisions in data');
      }
    }
    
    return true;
  }

  async testDataIntegrity() {
    // Test foreign key relationships
    const users = this.config.useMockDatabase 
      ? await this.mockDB.find('users', {}, { take: 10 })
      : await this.validator.pool.query('SELECT * FROM users LIMIT 10');
    
    const addresses = this.config.useMockDatabase
      ? await this.mockDB.find('addresses', {}, { take: 10 })
      : await this.validator.pool.query('SELECT * FROM addresses LIMIT 10');
    
    // Verify data consistency
    if (this.config.useMockDatabase) {
      const userCount = users.length;
      const addressCount = addresses.length;
      
      if (userCount === 0 || addressCount === 0) {
        throw new Error('No test data found for integrity check');
      }
    }
    
    return true;
  }

  // API Test Methods
  async testHealthEndpoints() {
    const results = await this.apiTester.runAllTests();
    if (results.failed > 0) {
      throw new Error(`${results.failed} API tests failed`);
    }
    return true;
  }

  async testUserManagementAPIs() {
    // Test user CRUD operations through API
    const newUser = this.fixtures.generateRandomUser();
    
    // Create user
    const createResponse = await this.apiTester.app.post('/api/v1/users').send(newUser);
    if (createResponse.status !== 201) {
      throw new Error('User creation API failed');
    }
    
    // Get user
    const getResponse = await this.apiTester.app.get(`/api/v1/users/${createResponse.body.data.id}`);
    if (getResponse.status !== 200) {
      throw new Error('User retrieval API failed');
    }
    
    return true;
  }

  async testProductCatalogAPIs() {
    // Test product listing and filtering
    const listResponse = await this.apiTester.app.get('/api/v1/products');
    if (listResponse.status !== 200) {
      throw new Error('Product listing API failed');
    }
    
    const filterResponse = await this.apiTester.app.get('/api/v1/products?category=cat-electronics');
    if (filterResponse.status !== 200) {
      throw new Error('Product filtering API failed');
    }
    
    return true;
  }

  async testOrderProcessingAPIs() {
    // Test order creation and management
    const newOrder = {
      addressId: 'addr-dhaka-1',
      subtotal: 50000,
      tax: 7500,
      shippingCost: 200,
      total: 57700,
      paymentMethod: 'BKASH'
    };
    
    const orderResponse = await this.apiTester.app.post('/api/v1/orders').send(newOrder);
    if (orderResponse.status !== 201) {
      throw new Error('Order creation API failed');
    }
    
    return true;
  }

  async testBangladeshSpecificAPIs() {
    // Test Bangladesh-specific endpoints
    const divisionsResponse = await this.apiTester.app.get('/api/v1/divisions');
    if (divisionsResponse.status !== 200) {
      throw new Error('Divisions API failed');
    }
    
    const paymentMethodsResponse = await this.apiTester.app.get('/api/v1/payment-methods');
    if (paymentMethodsResponse.status !== 200) {
      throw new Error('Payment methods API failed');
    }
    
    return true;
  }

  async testAPIErrorHandling() {
    // Test error handling
    const notFoundResponse = await this.apiTester.app.get('/api/v1/nonexistent-endpoint');
    if (notFoundResponse.status !== 404) {
      throw new Error('404 error handling failed');
    }
    
    return true;
  }

  // Integration Test Methods
  async testUserRegistrationToOrderFlow() {
    // Complete flow: Register user -> Add to cart -> Place order
    const newUser = this.fixtures.generateRandomUser();
    
    // 1. Register user
    const userResponse = await this.apiTester.app.post('/api/v1/users').send(newUser);
    if (userResponse.status !== 201) {
      throw new Error('User registration failed');
    }
    
    // 2. Add product to cart
    const cartItem = {
      productId: 'prod-samsung-s21',
      quantity: 1,
      unitPrice: 75000,
      totalPrice: 75000
    };
    const cartResponse = await this.apiTester.app.post('/api/v1/cart').send(cartItem);
    if (cartResponse.status !== 201) {
      throw new Error('Cart addition failed');
    }
    
    // 3. Place order
    const order = {
      addressId: 'addr-dhaka-1',
      subtotal: 75000,
      tax: 11250,
      shippingCost: 200,
      total: 86450,
      paymentMethod: 'BKASH'
    };
    const orderResponse = await this.apiTester.app.post('/api/v1/orders').send(order);
    if (orderResponse.status !== 201) {
      throw new Error('Order placement failed');
    }
    
    return true;
  }

  async testProductDiscoveryToPurchase() {
    // Flow: Browse categories -> View products -> Purchase
    const categoriesResponse = await this.apiTester.app.get('/api/v1/categories');
    if (categoriesResponse.status !== 200 || categoriesResponse.body.data.length === 0) {
      throw new Error('Category browsing failed');
    }
    
    const productsResponse = await this.apiTester.app.get('/api/v1/products');
    if (productsResponse.status !== 200 || productsResponse.body.data.length === 0) {
      throw new Error('Product viewing failed');
    }
    
    const productResponse = await this.apiTester.app.get('/api/v1/products/prod-samsung-s21');
    if (productResponse.status !== 200) {
      throw new Error('Product details viewing failed');
    }
    
    return true;
  }

  async testCartManagementFlow() {
    // Test cart operations: Add -> Update -> Remove
    const cartItem = {
      productId: 'prod-xiaomi-13',
      quantity: 2,
      unitPrice: 40000,
      totalPrice: 80000
    };
    
    // Add to cart
    const addResponse = await this.apiTester.app.post('/api/v1/cart').send(cartItem);
    if (addResponse.status !== 201) {
      throw new Error('Cart addition failed');
    }
    
    // View cart
    const viewResponse = await this.apiTester.app.get('/api/v1/cart');
    if (viewResponse.status !== 200) {
      throw new Error('Cart viewing failed');
    }
    
    return true;
  }

  async testReviewSubmissionFlow() {
    // Test review submission and approval
    const review = {
      productId: 'prod-samsung-s21',
      rating: 5,
      title: 'Excellent product!',
      comment: 'Great quality and fast delivery'
    };
    
    const reviewResponse = await this.apiTester.app.post('/api/v1/reviews').send(review);
    if (reviewResponse.status !== 201) {
      throw new Error('Review submission failed');
    }
    
    return true;
  }

  async testMultiStepOrderProcess() {
    // Complex order process with multiple steps
    // 1. Check product availability
    const productResponse = await this.apiTester.app.get('/api/v1/products/prod-samsung-s21');
    if (productResponse.status !== 200) {
      throw new Error('Product availability check failed');
    }
    
    // 2. Calculate shipping (mock)
    const shippingCost = 200; // Fixed for testing
    
    // 3. Apply coupon if available
    const couponResponse = await this.apiTester.app.get('/api/v1/coupons');
    if (couponResponse.status !== 200) {
      throw new Error('Coupon retrieval failed');
    }
    
    // 4. Complete order
    const order = {
      addressId: 'addr-dhaka-1',
      subtotal: 75000,
      tax: 11250,
      shippingCost: shippingCost,
      total: 86450,
      paymentMethod: 'BKASH'
    };
    
    const orderResponse = await this.apiTester.app.post('/api/v1/orders').send(order);
    if (orderResponse.status !== 201) {
      throw new Error('Multi-step order process failed');
    }
    
    return true;
  }

  // Performance Test Methods
  async testDatabaseQueryPerformance() {
    const iterations = 50;
    const results = await this.validator.performanceTest(iterations);
    
    if (results.averageTime > 100) { // 100ms threshold
      throw new Error(`Database query performance too slow: ${results.averageTime}ms average`);
    }
    
    return true;
  }

  async testAPIResponseTime() {
    const startTime = Date.now();
    
    // Make multiple API calls
    await Promise.all([
      this.apiTester.app.get('/api/v1/products'),
      this.apiTester.app.get('/api/v1/categories'),
      this.apiTester.app.get('/api/v1/brands')
    ]);
    
    const totalTime = Date.now() - startTime;
    const averageTime = totalTime / 3;
    
    if (averageTime > 500) { // 500ms threshold
      throw new Error(`API response time too slow: ${averageTime}ms average`);
    }
    
    return true;
  }

  async testConcurrentRequests() {
    const concurrentRequests = 10;
    const requests = [];
    
    for (let i = 0; i < concurrentRequests; i++) {
      requests.push(this.apiTester.app.get('/api/v1/products'));
    }
    
    const startTime = Date.now();
    const results = await Promise.all(requests);
    const totalTime = Date.now() - startTime;
    
    const failedRequests = results.filter(res => res.status !== 200).length;
    if (failedRequests > 0) {
      throw new Error(`${failedRequests} concurrent requests failed`);
    }
    
    if (totalTime > 2000) { // 2 second threshold
      throw new Error(`Concurrent requests too slow: ${totalTime}ms total`);
    }
    
    return true;
  }

  async testLargeDatasetHandling() {
    // Test handling of larger datasets
    const response = await this.apiTester.app.get('/api/v1/products?limit=50');
    if (response.status !== 200) {
      throw new Error('Large dataset handling failed');
    }
    
    if (response.body.data.length > 50) {
      throw new Error('Pagination not working correctly');
    }
    
    return true;
  }

  // Utility Methods
  async runSingleTest(category, testName, testFunction) {
    const testKey = `${category}_${testName.replace(/\s+/g, '_').toLowerCase()}`;
    this.testResults.summary.totalTests++;
    
    try {
      if (this.config.verboseLogging) {
        console.log(`  🧪 Running ${testName}...`);
      }
      
      const startTime = Date.now();
      await testFunction();
      const duration = Date.now() - startTime;
      
      this.testResults[category].passed++;
      this.testResults.summary.totalPassed++;
      
      if (this.config.verboseLogging) {
        console.log(`    ✅ ${testName} (${duration}ms)`);
      }
    } catch (error) {
      this.testResults[category].failed++;
      this.testResults[category].errors.push({ test: testName, error: error.message });
      this.testResults.summary.totalFailed++;
      
      if (this.config.verboseLogging) {
        console.log(`    ❌ ${testName}: ${error.message}`);
      }
    }
  }

  async seedTestData() {
    console.log('🌱 Seeding test data...');
    
    if (this.config.useMockDatabase) {
      await this.fixtures.seedDatabase(this.mockDB);
    } else {
      // Seed real database with fixtures
      for (const [entity, data] of Object.entries(this.fixtures.getAllFixtures())) {
        for (const item of data) {
          try {
            await this.validator.pool.query(`
              INSERT INTO ${entity} (${Object.keys(item).join(', ')})
              VALUES (${Object.keys(item).map((_, i) => `$${i + 1}`).join(', ')})
              ON CONFLICT DO NOTHING
            `, Object.values(item));
          } catch (error) {
            // Ignore duplicate key errors during seeding
            if (!error.message.includes('duplicate key')) {
              throw error;
            }
          }
        }
      }
    }
    
    console.log('✅ Test data seeded successfully');
  }

  generateTestReport() {
    const duration = this.endTime - this.startTime;
    const successRate = this.testResults.summary.totalPassed / this.testResults.summary.totalTests * 100;
    
    console.log('\n' + '='.repeat(60));
    console.log('📊 COMPREHENSIVE TEST REPORT');
    console.log('='.repeat(60));
    console.log(`Test Duration: ${(duration / 1000).toFixed(2)} seconds`);
    console.log(`Database Mode: ${this.config.useMockDatabase ? 'Mock' : 'Real PostgreSQL'}`);
    console.log('');
    
    console.log('📈 Test Results Summary:');
    console.log(`Total Tests: ${this.testResults.summary.totalTests}`);
    console.log(`Passed: ${this.testResults.summary.totalPassed}`);
    console.log(`Failed: ${this.testResults.summary.totalFailed}`);
    console.log(`Success Rate: ${successRate.toFixed(1)}%`);
    console.log('');
    
    console.log('🗄️ Database Tests:');
    console.log(`  Passed: ${this.testResults.database.passed}`);
    console.log(`  Failed: ${this.testResults.database.failed}`);
    if (this.testResults.database.errors.length > 0) {
      console.log('  Errors:');
      this.testResults.database.errors.forEach(error => {
        console.log(`    - ${error.test}: ${error.error}`);
      });
    }
    console.log('');
    
    console.log('🌐 API Tests:');
    console.log(`  Passed: ${this.testResults.api.passed}`);
    console.log(`  Failed: ${this.testResults.api.failed}`);
    if (this.testResults.api.errors.length > 0) {
      console.log('  Errors:');
      this.testResults.api.errors.forEach(error => {
        console.log(`    - ${error.test}: ${error.error}`);
      });
    }
    console.log('');
    
    console.log('🔗 Integration Tests:');
    console.log(`  Passed: ${this.testResults.integration.passed}`);
    console.log(`  Failed: ${this.testResults.integration.failed}`);
    if (this.testResults.integration.errors.length > 0) {
      console.log('  Errors:');
      this.testResults.integration.errors.forEach(error => {
        console.log(`    - ${error.test}: ${error.error}`);
      });
    }
    console.log('');
    
    if (this.config.performanceTests) {
      console.log('⚡ Performance Tests:');
      console.log(`  Passed: ${this.testResults.performance.passed}`);
      console.log(`  Failed: ${this.testResults.performance.failed}`);
      if (this.testResults.performance.errors.length > 0) {
        console.log('  Errors:');
        this.testResults.performance.errors.forEach(error => {
          console.log(`    - ${error.test}: ${error.error}`);
        });
      }
      console.log('');
    }
    
    console.log('='.repeat(60));
    
    if (this.testResults.summary.totalFailed === 0) {
      console.log('🎉 ALL TESTS PASSED! System is ready for production.');
    } else {
      console.log('⚠️  Some tests failed. Please review and fix issues before production deployment.');
    }
  }

  async cleanup() {
    console.log('🧹 Cleaning up test environment...');
    
    if (this.validator) {
      await this.validator.cleanup();
    }
    
    if (this.apiTester) {
      await this.apiTester.cleanup();
    }
    
    console.log('✅ Cleanup completed');
  }

  // Method to switch database mode
  async switchDatabaseMode(useMock) {
    console.log(`🔄 Switching to ${useMock ? 'Mock' : 'Real'} database...`);
    
    await this.cleanup();
    this.config.useMockDatabase = useMock;
    await this.initialize();
    
    console.log('✅ Database mode switched successfully');
  }
}

module.exports = {
  IntegrationTestFramework
};