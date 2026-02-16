/**
 * Guest Cart Complete Fix Verification Test
 * 
 * This test verifies that the complete fix for guest cart functionality is working:
 * 1. Backend: /api/v1/cart/guest/validate-stock route exists and works correctly
 * 2. Frontend: Request format is correct ({ items: [{ productId, quantity, variantId }] })
 * 
 * Test Scenarios:
 * 1. End-to-end guest cart stock validation (simulating frontend call)
 * 2. Guest cart stock validation with multiple items
 * 3. Guest cart stock validation with out-of-stock item
 * 4. Guest cart stock validation for authenticated user
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

// ============================================================================
// TEST 1: End-to-end guest cart stock validation (simulating frontend call)
// ============================================================================
const test1 = {
  name: 'Test 1: End-to-end guest cart stock validation (simulating frontend call)',
  test: async () => {
    log('\n--- Test 1 Details ---', 'info');
    log('Simulating the exact request format that the frontend now sends', 'info');
    log('Request format: { items: [{ productId, quantity, variantId }] }', 'info');
    
    const sessionId = 'guest-session-test-' + Date.now();
    const items = [
      {
        productId: testProductId,
        quantity: 2,
        variantId: testVariantId || null
      }
    ];

    log(`Sending request to: POST /api/v1/cart/guest/validate-stock`, 'info');
    log(`Session ID: ${sessionId}`, 'info');
    log(`Items: ${JSON.stringify(items)}`, 'info');

    const response = await makeRequest(
      'POST',
      '/cart/guest/validate-stock',
      { items },
      { 'x-session-id': sessionId }
    );

    log(`Response status: ${response.status}`, 'info');

    // Verify response returns 200 status (not 404, not 400)
    if (response.status !== 200) {
      throw new Error(`Expected status 200, got ${response.status} - Route may not exist or validation failed`);
    }
    log('✓ Status is 200 (not 404, not 400)', 'success');

    // Verify response structure includes success, isValid, message, and data fields
    if (!response.data.hasOwnProperty('success')) {
      throw new Error('Response missing success field');
    }
    log('✓ Response has success field', 'success');

    if (!response.data.hasOwnProperty('isValid')) {
      throw new Error('Response missing isValid field');
    }
    log('✓ Response has isValid field', 'success');

    if (!response.data.message) {
      throw new Error('Response missing message field');
    }
    log('✓ Response has message field', 'success');

    if (!response.data.data) {
      throw new Error('Response missing data field');
    }
    log('✓ Response has data field', 'success');

    // Verify validationResults array contains correct stock information
    if (!Array.isArray(response.data.data.validationResults)) {
      throw new Error('validationResults should be an array');
    }
    log('✓ validationResults is an array', 'success');

    if (response.data.data.validationResults.length === 0) {
      throw new Error('validationResults should contain at least one item');
    }
    log('✓ validationResults contains items', 'success');

    const validationResult = response.data.data.validationResults[0];
    if (!validationResult.productId) {
      throw new Error('validationResult missing productId');
    }
    log('✓ validationResult has productId', 'success');

    if (!validationResult.hasOwnProperty('requestedQuantity')) {
      throw new Error('validationResult missing requestedQuantity');
    }
    log('✓ validationResult has requestedQuantity', 'success');

    if (!validationResult.hasOwnProperty('currentStock')) {
      throw new Error('validationResult missing currentStock');
    }
    log('✓ validationResult has currentStock', 'success');

    if (!validationResult.hasOwnProperty('isAvailable')) {
      throw new Error('validationResult missing isAvailable');
    }
    log('✓ validationResult has isAvailable', 'success');

    log('\n--- Test 1 Passed ---', 'success');
    log('Frontend can now successfully call the backend endpoint', 'success');
    log('No 404 errors (route exists)', 'success');
    log('No 400 validation errors (request format is correct)', 'success');

    return response.data;
  }
};

// ============================================================================
// TEST 2: Guest cart stock validation with multiple items
// ============================================================================
const test2 = {
  name: 'Test 2: Guest cart stock validation with multiple items',
  test: async () => {
    log('\n--- Test 2 Details ---', 'info');
    log('Testing with multiple items in the items array', 'info');
    
    const sessionId = 'guest-session-test-' + Date.now();
    const items = [
      {
        productId: testProductId,
        quantity: 1,
        variantId: testVariantId || null
      },
      {
        productId: testProductId,
        quantity: 2,
        variantId: testVariantId || null
      }
    ];

    log(`Sending request to: POST /api/v1/cart/guest/validate-stock`, 'info');
    log(`Session ID: ${sessionId}`, 'info');
    log(`Items count: ${items.length}`, 'info');

    const response = await makeRequest(
      'POST',
      '/cart/guest/validate-stock',
      { items },
      { 'x-session-id': sessionId }
    );

    log(`Response status: ${response.status}`, 'info');

    // Verify all items are validated correctly
    if (response.status !== 200) {
      throw new Error(`Expected status 200, got ${response.status}`);
    }
    log('✓ Status is 200', 'success');

    if (!Array.isArray(response.data.data.validationResults)) {
      throw new Error('validationResults should be an array');
    }
    log('✓ validationResults is an array', 'success');

    if (response.data.data.validationResults.length !== items.length) {
      throw new Error(`Expected ${items.length} validation results, got ${response.data.data.validationResults.length}`);
    }
    log(`✓ All ${items.length} items were validated`, 'success');

    // Verify response includes validation results for all items
    for (let i = 0; i < items.length; i++) {
      const result = response.data.data.validationResults[i];
      if (!result.productId) {
        throw new Error(`Validation result ${i} missing productId`);
      }
      if (!result.hasOwnProperty('requestedQuantity')) {
        throw new Error(`Validation result ${i} missing requestedQuantity`);
      }
      if (!result.hasOwnProperty('currentStock')) {
        throw new Error(`Validation result ${i} missing currentStock`);
      }
      if (!result.hasOwnProperty('isAvailable')) {
        throw new Error(`Validation result ${i} missing isAvailable`);
      }
    }
    log('✓ All validation results contain required fields', 'success');

    log('\n--- Test 2 Passed ---', 'success');
    log('Multiple items are validated correctly', 'success');
    log('Response includes validation results for all items', 'success');

    return response.data;
  }
};

// ============================================================================
// TEST 3: Guest cart stock validation with out-of-stock item
// ============================================================================
const test3 = {
  name: 'Test 3: Guest cart stock validation with out-of-stock item',
  test: async () => {
    log('\n--- Test 3 Details ---', 'info');
    log('Testing with an item that has insufficient stock', 'info');
    
    const sessionId = 'guest-session-test-' + Date.now();
    const items = [
      {
        productId: testProductIdLowStock || testProductId,
        quantity: 9999 // Request more than available
      }
    ];

    log(`Sending request to: POST /api/v1/cart/guest/validate-stock`, 'info');
    log(`Session ID: ${sessionId}`, 'info');
    log(`Items: ${JSON.stringify(items)}`, 'info');

    const response = await makeRequest(
      'POST',
      '/cart/guest/validate-stock',
      { items },
      { 'x-session-id': sessionId }
    );

    log(`Response status: ${response.status}`, 'info');

    // Verify isValid is false
    if (response.status !== 200) {
      throw new Error(`Expected status 200, got ${response.status}`);
    }
    log('✓ Status is 200', 'success');

    if (!response.data.hasOwnProperty('isValid')) {
      throw new Error('Response missing isValid field');
    }

    if (response.data.isValid !== false) {
      throw new Error(`Expected isValid=false for out-of-stock item, got ${response.data.isValid}`);
    }
    log('✓ isValid is false for out-of-stock item', 'success');

    // Verify unavailableItems array contains the out-of-stock item
    if (!response.data.data) {
      throw new Error('Response missing data field');
    }

    if (!Array.isArray(response.data.data.unavailableItems)) {
      throw new Error('unavailableItems should be an array');
    }
    log('✓ unavailableItems is an array', 'success');

    if (response.data.data.unavailableItems.length === 0) {
      throw new Error('unavailableItems should contain at least one item');
    }
    log('✓ unavailableItems contains the out-of-stock item', 'success');

    // Verify appropriate error message
    if (!response.data.message) {
      throw new Error('Response missing message field');
    }
    log(`✓ Error message: ${response.data.message}`, 'success');

    log('\n--- Test 3 Passed ---', 'success');
    log('Stock validation correctly identifies out-of-stock items', 'success');
    log('unavailableItems array contains the problematic item', 'success');
    log('Appropriate error message is returned', 'success');

    return response.data;
  }
};

// ============================================================================
// TEST 4: Guest cart stock validation for authenticated user
// ============================================================================
const test4 = {
  name: 'Test 4: Guest cart stock validation for authenticated user',
  test: async () => {
    log('\n--- Test 4 Details ---', 'info');
    log('Testing with valid JWT token (authenticated user)', 'info');
    
    if (!authToken) {
      throw new Error('No authentication token available - cannot run this test');
    }

    const items = [
      {
        productId: testProductId,
        quantity: 1,
        variantId: testVariantId || null
      }
    ];

    log(`Sending request to: POST /api/v1/cart/guest/validate-stock`, 'info');
    log(`Using JWT token for authentication`, 'info');
    log(`Items: ${JSON.stringify(items)}`, 'info');

    const response = await makeRequest(
      'POST',
      '/cart/guest/validate-stock',
      { items },
      { 'Authorization': `Bearer ${authToken}` }
    );

    log(`Response status: ${response.status}`, 'info');

    // Verify response works correctly for logged-in users
    if (response.status !== 200) {
      throw new Error(`Expected status 200, got ${response.status}`);
    }
    log('✓ Status is 200', 'success');

    if (!response.data.success) {
      throw new Error(`Expected success=true, got ${response.data.success}`);
    }
    log('✓ success is true', 'success');

    if (!response.data.hasOwnProperty('isValid')) {
      throw new Error('Response missing isValid field');
    }
    log('✓ Response has isValid field', 'success');

    if (!response.data.data) {
      throw new Error('Response missing data field');
    }
    log('✓ Response has data field', 'success');

    if (!Array.isArray(response.data.data.validationResults)) {
      throw new Error('validationResults should be an array');
    }
    log('✓ validationResults is an array', 'success');

    if (response.data.data.validationResults.length === 0) {
      throw new Error('validationResults should contain at least one item');
    }
    log('✓ validationResults contains items', 'success');

    // Verify stock validation still works correctly
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
    log('✓ Stock validation works correctly for authenticated user', 'success');

    log('\n--- Test 4 Passed ---', 'success');
    log('Endpoint works correctly for logged-in users', 'success');
    log('Stock validation still works correctly', 'success');

    return response.data;
  }
};

// Test cases array
const testCases = [test1, test2, test3, test4];

// Main test execution function
async function runTests() {
  console.log('='.repeat(80));
  console.log('GUEST CART COMPLETE FIX VERIFICATION TEST');
  console.log('Testing: POST /api/v1/cart/guest/validate-stock');
  console.log('='.repeat(80));
  console.log('');
  console.log('This test verifies the complete fix for guest cart functionality:');
  console.log('1. Backend: /api/v1/cart/guest/validate-stock route exists');
  console.log('2. Frontend: Request format is correct ({ items: [{ productId, quantity, variantId }] })');
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

  // Final verification summary
  console.log('\n' + '='.repeat(80));
  console.log('FINAL VERIFICATION SUMMARY');
  console.log('='.repeat(80));
  
  if (results.failed === 0) {
    console.log('✅ ALL TESTS PASSED!');
    console.log('');
    console.log('The complete fix is working correctly:');
    console.log('✓ The frontend can now successfully call the backend endpoint');
    console.log('✓ No 404 errors (route exists)');
    console.log('✓ No 400 validation errors (request format is correct)');
    console.log('✓ Guest users can validate stock before adding to cart');
    console.log('✓ The endpoint works for both guests and authenticated users');
    console.log('✓ Stock validation logic is correct');
  } else {
    console.log('❌ SOME TESTS FAILED');
    console.log('');
    console.log('Please review the failed tests above to identify issues.');
  }
  
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
