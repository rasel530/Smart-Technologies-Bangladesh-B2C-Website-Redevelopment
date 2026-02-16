/**
 * Guest Cart Stock Validation Test
 * 
 * Tests the /api/v1/cart/guest/validate-stock endpoint to ensure it works correctly
 * for both guest users and logged-in users.
 * 
 * Test Cases:
 * 1. Successful stock validation for guest user
 * 2. Stock validation with out-of-stock item
 * 3. Invalid request - missing items array
 * 4. Invalid request - missing productId
 * 5. Invalid request - invalid quantity
 * 6. Stock validation for logged-in user
 */

const axios = require('axios');

// API Configuration
const API_BASE_URL = 'http://localhost:3001/api/v1';
const TEST_USER = {
  identifier: 'raselbepari88@gmail.com',
  password: '74Vfo^71~_oY'
};

// Test configuration
const TEST_CONFIG = {
  timeout: 10000,
  verbose: true
};

// Global variables
let authToken = null;
let testProductId = null;
let testProductIdLowStock = null;
let testVariantId = null;

// Utility functions
function log(message, type = 'info') {
  const timestamp = new Date().toISOString();
  const prefix = {
    info: 'ℹ️',
    success: '✅',
    error: '❌',
    warning: '⚠️',
    skip: '⏭️'
  };
  
  console.log(`${prefix[type]} [${timestamp}] ${message}`);
}

function makeRequest(method, url, data = null, headers = {}) {
  const config = {
    method,
    url: `${API_BASE_URL}${url}`,
    timeout: TEST_CONFIG.timeout,
    headers: {
      'Content-Type': 'application/json',
      ...headers
    }
  };
  
  if (data) {
    config.data = data;
  }
  
  return axios(config);
}

async function testEndpoint(description, testFn) {
  log(`Testing: ${description}`, 'info');
  
  try {
    const result = await testFn();
    log(`SUCCESS: ${description}`, 'success');
    return { success: true, result };
  } catch (error) {
    const errorMsg = error.response ? 
      `${error.response.status}: ${JSON.stringify(error.response.data)}` : 
      error.message;
    log(`FAILED: ${description} - ${errorMsg}`, 'error');
    return { success: false, error: errorMsg, status: error.response?.status };
  }
}

// Helper functions
async function login() {
  log('=== Login ===', 'info');
  try {
    const response = await makeRequest('POST', '/auth/login', TEST_USER);
    
    if (response.status === 200 || response.status === 201) {
      if (response.data.token) {
        authToken = response.data.token;
        log('Login successful', 'success');
        log(`User ID: ${response.data.user?.id}`, 'info');
        return true;
      } else {
        log('Login failed: No token in response', 'error');
        return false;
      }
    } else {
      log(`Login failed: ${response.status}`, 'error');
      log(`Error: ${response.data.message || 'Unknown error'}`, 'error');
      return false;
    }
  } catch (error) {
    log(`Login error: ${error.message}`, 'error');
    return false;
  }
}

async function getProducts() {
  log('\n=== Get Products ===', 'info');
  try {
    const response = await makeRequest('GET', '/products?limit=20', null, {
      'Authorization': `Bearer ${authToken}`
    });

    if (response.status === 200) {
      const products = response.data.products || response.data || [];
      log(`Retrieved ${products.length} products`, 'success');
      
      // Find products with different stock levels
      const highStockProducts = products.filter(p => (p.stock || p.stockQuantity || 0) >= 10);
      const lowStockProducts = products.filter(p => {
        const stock = p.stock || p.stockQuantity || 0;
        return stock > 0 && stock < 10;
      });
      
      if (highStockProducts.length > 0) {
        testProductId = highStockProducts[0].id;
        // Check for variants
        if (highStockProducts[0].variants && highStockProducts[0].variants.length > 0) {
          testVariantId = highStockProducts[0].variants[0].id;
        }
        log(`Selected high stock product ID: ${testProductId}`, 'info');
        if (testVariantId) {
          log(`Selected variant ID: ${testVariantId}`, 'info');
        }
      }
      
      if (lowStockProducts.length > 0) {
        testProductIdLowStock = lowStockProducts[0].id;
        log(`Selected low stock product ID: ${testProductIdLowStock}`, 'info');
      }
      
      return products;
    } else {
      log(`Get products failed: ${response.status}`, 'error');
      return [];
    }
  } catch (error) {
    log(`Get products error: ${error.message}`, 'error');
    return [];
  }
}

// Test cases
const testCases = [
  {
    name: 'Test Case 1: Successful stock validation for guest user',
    test: async () => {
      const sessionId = 'guest-session-test-' + Date.now();
      const items = [
        {
          productId: testProductId,
          quantity: 2,
          variantId: testVariantId || null
        }
      ];

      const response = await makeRequest(
        'POST',
        '/cart/guest/validate-stock',
        { items },
        { 'x-session-id': sessionId }
      );

      // Verify response structure
      if (response.status !== 200) {
        throw new Error(`Expected status 200, got ${response.status}`);
      }

      if (!response.data.success) {
        throw new Error(`Expected success=true, got ${response.data.success}`);
      }

      if (!response.data.hasOwnProperty('isValid')) {
        throw new Error('Response missing isValid field');
      }

      if (!response.data.message) {
        throw new Error('Response missing message field');
      }

      if (!response.data.data) {
        throw new Error('Response missing data field');
      }

      if (!Array.isArray(response.data.data.validationResults)) {
        throw new Error('validationResults should be an array');
      }

      if (response.data.data.validationResults.length === 0) {
        throw new Error('validationResults should contain at least one item');
      }

      const validationResult = response.data.data.validationResults[0];
      if (!validationResult.productId) {
        throw new Error('validationResult missing productId');
      }

      if (!validationResult.hasOwnProperty('requestedQuantity')) {
        throw new Error('validationResult missing requestedQuantity');
      }

      if (!validationResult.hasOwnProperty('currentStock')) {
        throw new Error('validationResult missing currentStock');
      }

      if (!validationResult.hasOwnProperty('isAvailable')) {
        throw new Error('validationResult missing isAvailable');
      }

      return response.data;
    }
  },

  {
    name: 'Test Case 2: Stock validation with out-of-stock item',
    test: async () => {
      const sessionId = 'guest-session-test-' + Date.now();
      const items = [
        {
          productId: testProductIdLowStock || testProductId,
          quantity: 9999 // Request more than available
        }
      ];

      const response = await makeRequest(
        'POST',
        '/cart/guest/validate-stock',
        { items },
        { 'x-session-id': sessionId }
      );

      // Verify response structure
      if (response.status !== 200) {
        throw new Error(`Expected status 200, got ${response.status}`);
      }

      if (!response.data.hasOwnProperty('isValid')) {
        throw new Error('Response missing isValid field');
      }

      if (response.data.isValid !== false) {
        throw new Error(`Expected isValid=false for out-of-stock item, got ${response.data.isValid}`);
      }

      if (!response.data.data) {
        throw new Error('Response missing data field');
      }

      if (!Array.isArray(response.data.data.unavailableItems)) {
        throw new Error('unavailableItems should be an array');
      }

      if (response.data.data.unavailableItems.length === 0) {
        throw new Error('unavailableItems should contain at least one item');
      }

      return response.data;
    }
  },

  {
    name: 'Test Case 3: Invalid request - missing items array',
    test: async () => {
      const sessionId = 'guest-session-test-' + Date.now();

      try {
        const response = await makeRequest(
          'POST',
          '/cart/guest/validate-stock',
          {}, // Missing items array
          { 'x-session-id': sessionId }
        );

        // If we get here, the endpoint didn't validate properly
        if (response.status === 200) {
          throw new Error('Expected validation error (400/422), but got 200');
        }

        return response.data;
      } catch (error) {
        // Expected to fail with validation error
        if (error.response && (error.response.status === 400 || error.response.status === 422)) {
          return { status: error.response.status, data: error.response.data };
        }
        throw error;
      }
    }
  },

  {
    name: 'Test Case 4: Invalid request - missing productId',
    test: async () => {
      const sessionId = 'guest-session-test-' + Date.now();
      const items = [
        {
          quantity: 2 // Missing productId
        }
      ];

      try {
        const response = await makeRequest(
          'POST',
          '/cart/guest/validate-stock',
          { items },
          { 'x-session-id': sessionId }
        );

        // If we get here, the endpoint didn't validate properly
        if (response.status === 200) {
          throw new Error('Expected validation error (400/422), but got 200');
        }

        return response.data;
      } catch (error) {
        // Expected to fail with validation error
        if (error.response && (error.response.status === 400 || error.response.status === 422)) {
          return { status: error.response.status, data: error.response.data };
        }
        throw error;
      }
    }
  },

  {
    name: 'Test Case 5: Invalid request - invalid quantity',
    test: async () => {
      const sessionId = 'guest-session-test-' + Date.now();
      const items = [
        {
          productId: testProductId,
          quantity: 0 // Invalid quantity
        }
      ];

      try {
        const response = await makeRequest(
          'POST',
          '/cart/guest/validate-stock',
          { items },
          { 'x-session-id': sessionId }
        );

        // If we get here, the endpoint didn't validate properly
        if (response.status === 200) {
          throw new Error('Expected validation error (400/422), but got 200');
        }

        return response.data;
      } catch (error) {
        // Expected to fail with validation error
        if (error.response && (error.response.status === 400 || error.response.status === 422)) {
          return { status: error.response.status, data: error.response.data };
        }
        throw error;
      }
    }
  },

  {
    name: 'Test Case 6: Stock validation for logged-in user',
    test: async () => {
      if (!authToken) {
        throw new Error('No authentication token available');
      }

      const items = [
        {
          productId: testProductId,
          quantity: 1,
          variantId: testVariantId || null
        }
      ];

      const response = await makeRequest(
        'POST',
        '/cart/guest/validate-stock',
        { items },
        { 'Authorization': `Bearer ${authToken}` }
      );

      // Verify response structure
      if (response.status !== 200) {
        throw new Error(`Expected status 200, got ${response.status}`);
      }

      if (!response.data.success) {
        throw new Error(`Expected success=true, got ${response.data.success}`);
      }

      if (!response.data.hasOwnProperty('isValid')) {
        throw new Error('Response missing isValid field');
      }

      if (!response.data.data) {
        throw new Error('Response missing data field');
      }

      if (!Array.isArray(response.data.data.validationResults)) {
        throw new Error('validationResults should be an array');
      }

      if (response.data.data.validationResults.length === 0) {
        throw new Error('validationResults should contain at least one item');
      }

      return response.data;
    }
  }
];

// Main test execution function
async function runTests() {
  console.log('='.repeat(80));
  console.log('GUEST CART STOCK VALIDATION TEST');
  console.log('Testing: POST /api/v1/cart/guest/validate-stock');
  console.log('='.repeat(80));
  
  const results = {
    total: 0,
    passed: 0,
    failed: 0,
    errors: []
  };

  // Login first
  const loginSuccess = await login();
  if (!loginSuccess) {
    log('\n❌ Cannot proceed without authentication for some tests', 'warning');
    log('Will continue with guest-only tests', 'warning');
  }

  // Get products for test data
  const products = await getProducts();
  if (products.length === 0) {
    log('\n❌ No products available for testing', 'error');
    return results;
  }

  if (!testProductId) {
    log('\n❌ No suitable product found for testing', 'error');
    return results;
  }

  // Run all test cases
  log('\n' + '='.repeat(80));
  log('RUNNING TEST CASES');
  log('='.repeat(80));
  
  for (const testCase of testCases) {
    results.total++;
    
    try {
      const testResult = await testEndpoint(testCase.name, testCase.test);
      
      if (testResult.success) {
        results.passed++;
      } else {
        results.failed++;
        results.errors.push({
          test: testCase.name,
          error: testResult.error,
          status: testResult.status
        });
      }
    } catch (error) {
      results.failed++;
      results.errors.push({
        test: testCase.name,
        error: `Unexpected error: ${error.message}`
      });
    }
    
    // Small delay between requests
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  // Generate report
  console.log('\n' + '='.repeat(80));
  console.log('TEST RESULTS SUMMARY');
  console.log('='.repeat(80));
  console.log(`Total Tests: ${results.total}`);
  console.log(`Passed: ${results.passed}`);
  console.log(`Failed: ${results.failed}`);
  console.log(`Success Rate: ${((results.passed / results.total) * 100).toFixed(2)}%`);
  
  if (results.errors.length > 0) {
    console.log('\n❌ FAILED TESTS:');
    results.errors.forEach((error, index) => {
      console.log(`${index + 1}. ${error.test}`);
      console.log(`   Error: ${error.error}`);
      if (error.status) {
        console.log(`   Status: ${error.status}`);
      }
      console.log('');
    });
  }

  console.log('\n' + '='.repeat(80));
  console.log('TEST DATA USED');
  console.log('='.repeat(80));
  console.log(`Product ID (High Stock): ${testProductId}`);
  console.log(`Product ID (Low Stock): ${testProductIdLowStock || 'N/A'}`);
  console.log(`Variant ID: ${testVariantId || 'N/A'}`);
  console.log('='.repeat(80));

  return results;
}

// Run tests if this file is executed directly
if (require.main === module) {
  runTests()
    .then(results => {
      console.log('\n✅ All tests completed');
      
      // Exit with appropriate code
      process.exit(results.failed > 0 ? 1 : 0);
    })
    .catch(error => {
      console.error('Test execution failed:', error);
      process.exit(1);
    });
}

module.exports = {
  runTests,
  testCases,
  TEST_CONFIG
};
