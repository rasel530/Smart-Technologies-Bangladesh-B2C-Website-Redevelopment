/**
 * Existing Cart Functionality Verification Test
 * 
 * This test verifies that all existing logged-in user cart functionality 
 * remains fully intact after implementing the new /api/v1/cart/guest/validate-stock route.
 * 
 * Test Endpoints:
 * 1. GET /api/v1/cart - Get user cart
 * 2. POST /api/v1/cart/items - Add item to cart
 * 3. PUT /api/v1/cart/items/:id - Update cart item
 * 4. DELETE /api/v1/cart/items/:id - Remove cart item
 * 5. DELETE /api/v1/cart - Clear cart
 * 6. POST /api/v1/cart/validate - Validate cart stock (logged-in user version)
 * 7. GET /api/v1/cart/summary - Get cart summary
 * 8. GET /api/v1/cart/count - Get cart item count
 * 9. POST /api/v1/cart/stock/check - Check stock availability
 * 10. POST /api/v1/cart/merge - Merge guest cart on login
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
let testCartId = null;
let testProductId = null;
let testVariantId = null;
let testCartItemId = null;
let guestSessionId = null;

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
        log(`Email: ${response.data.user?.email}`, 'info');
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
    const response = await makeRequest('GET', '/products?limit=10', null, {
      'Authorization': `Bearer ${authToken}`
    });

    if (response.status === 200) {
      const products = response.data.products || response.data || [];
      log(`Retrieved ${products.length} products`, 'success');
      
      if (products.length > 0) {
        testProductId = products[0].id;
        // Check for variants
        if (products[0].variants && products[0].variants.length > 0) {
          testVariantId = products[0].variants[0].id;
        }
        log(`Selected product ID: ${testProductId}`, 'info');
        if (testVariantId) {
          log(`Selected variant ID: ${testVariantId}`, 'info');
        }
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
// TEST CASES - Existing Cart Functionality
// ============================================================================

const testCases = [
  // ============================================================================
  // 1. GET /api/v1/cart - Get user cart
  // ============================================================================
  {
    name: 'Test 1.1: GET /api/v1/cart - Get user cart (authenticated)',
    test: async () => {
      if (!authToken) {
        throw new Error('No authentication token available');
      }

      const response = await makeRequest(
        'GET',
        '/cart',
        null,
        { 'Authorization': `Bearer ${authToken}` }
      );

      // Verify response structure
      if (response.status !== 200) {
        throw new Error(`Expected status 200, got ${response.status}`);
      }

      if (!response.data.success) {
        throw new Error(`Expected success=true, got ${response.data.success}`);
      }

      if (!response.data.data) {
        throw new Error('Response missing data field');
      }

      // Store cart ID for later tests
      if (response.data.data.id) {
        testCartId = response.data.data.id;
      }

      return response.data;
    }
  },

  {
    name: 'Test 1.2: GET /api/v1/cart - Verify response structure',
    test: async () => {
      const response = await makeRequest(
        'GET',
        '/cart',
        null,
        { 'Authorization': `Bearer ${authToken}` }
      );

      // Verify expected fields
      const expectedFields = ['id', 'items', 'subtotal', 'tax', 'shippingCost', 'total'];
      for (const field of expectedFields) {
        if (!response.data.data.hasOwnProperty(field)) {
          throw new Error(`Response missing expected field: ${field}`);
        }
      }

      // Verify items is an array
      if (!Array.isArray(response.data.data.items)) {
        throw new Error('items field should be an array');
      }

      return response.data;
    }
  },

  // ============================================================================
  // 2. POST /api/v1/cart/items - Add item to cart
  // ============================================================================
  {
    name: 'Test 2.1: POST /api/v1/cart/items - Add item to cart (authenticated)',
    test: async () => {
      if (!testCartId || !testProductId) {
        throw new Error('Missing cart ID or product ID');
      }

      const cartData = {
        cartId: testCartId,
        productId: testProductId,
        quantity: 2
      };

      const response = await makeRequest(
        'POST',
        '/cart/items',
        cartData,
        { 'Authorization': `Bearer ${authToken}` }
      );

      // Verify response structure
      if (response.status !== 200 && response.status !== 201) {
        throw new Error(`Expected status 200/201, got ${response.status}`);
      }

      if (!response.data.success) {
        throw new Error(`Expected success=true, got ${response.data.success}`);
      }

      return response.data;
    }
  },

  {
    name: 'Test 2.2: POST /api/v1/cart/items - Add item with variant',
    test: async () => {
      if (!testCartId || !testProductId) {
        throw new Error('Missing cart ID or product ID');
      }

      const cartData = {
        cartId: testCartId,
        productId: testProductId,
        quantity: 1,
        variantId: testVariantId || null
      };

      const response = await makeRequest(
        'POST',
        '/cart/items',
        cartData,
        { 'Authorization': `Bearer ${authToken}` }
      );

      if (response.status !== 200 && response.status !== 201) {
        throw new Error(`Expected status 200/201, got ${response.status}`);
      }

      return response.data;
    }
  },

  {
    name: 'Test 2.3: POST /api/v1/cart/items - Error: Missing required fields',
    test: async () => {
      try {
        const response = await makeRequest(
          'POST',
          '/cart/items',
          { cartId: testCartId }, // Missing productId and quantity
          { 'Authorization': `Bearer ${authToken}` }
        );

        // Should fail with validation error
        if (response.status === 200 || response.status === 201) {
          throw new Error('Expected validation error (400), but got 200/201');
        }

        return { status: response.status, data: response.data };
      } catch (error) {
        if (error.response && error.response.status === 400) {
          return { status: error.response.status, data: error.response.data };
        }
        throw error;
      }
    }
  },

  // ============================================================================
  // 3. PUT /api/v1/cart/items/:id - Update cart item
  // ============================================================================
  {
    name: 'Test 3.1: PUT /api/v1/cart/items/:id - Update cart item quantity',
    test: async () => {
      // First get cart to find an item ID
      const cartResponse = await makeRequest(
        'GET',
        '/cart',
        null,
        { 'Authorization': `Bearer ${authToken}` }
      );

      if (!cartResponse.data.data.items || cartResponse.data.data.items.length === 0) {
        throw new Error('No cart items found to update');
      }

      const itemId = cartResponse.data.data.items[0].id;
      testCartItemId = itemId;

      const response = await makeRequest(
        'PUT',
        `/cart/items/${itemId}`,
        { quantity: 5 },
        { 'Authorization': `Bearer ${authToken}` }
      );

      // Verify response structure
      if (response.status !== 200) {
        throw new Error(`Expected status 200, got ${response.status}`);
      }

      if (!response.data.success) {
        throw new Error(`Expected success=true, got ${response.data.success}`);
      }

      return response.data;
    }
  },

  {
    name: 'Test 3.2: PUT /api/v1/cart/items/:id - Error: Invalid quantity',
    test: async () => {
      if (!testCartItemId) {
        throw new Error('No cart item ID available');
      }

      try {
        const response = await makeRequest(
          'PUT',
          `/cart/items/${testCartItemId}`,
          { quantity: 0 }, // Invalid quantity
          { 'Authorization': `Bearer ${authToken}` }
        );

        if (response.status === 200) {
          throw new Error('Expected validation error (400), but got 200');
        }

        return { status: response.status, data: response.data };
      } catch (error) {
        if (error.response && error.response.status === 400) {
          return { status: error.response.status, data: error.response.data };
        }
        throw error;
      }
    }
  },

  {
    name: 'Test 3.3: PUT /api/v1/cart/items/:id - Error: Invalid item ID',
    test: async () => {
      try {
        const response = await makeRequest(
          'PUT',
          '/cart/items/00000000-0000-0000-0000-000000000000', // Invalid UUID
          { quantity: 2 },
          { 'Authorization': `Bearer ${authToken}` }
        );

        if (response.status === 200) {
          throw new Error('Expected 404 error, but got 200');
        }

        return { status: response.status, data: response.data };
      } catch (error) {
        if (error.response && (error.response.status === 404 || error.response.status === 400)) {
          return { status: error.response.status, data: error.response.data };
        }
        throw error;
      }
    }
  },

  // ============================================================================
  // 4. DELETE /api/v1/cart/items/:id - Remove cart item
  // ============================================================================
  {
    name: 'Test 4.1: DELETE /api/v1/cart/items/:id - Remove cart item',
    test: async () => {
      // First get cart to find an item ID
      const cartResponse = await makeRequest(
        'GET',
        '/cart',
        null,
        { 'Authorization': `Bearer ${authToken}` }
      );

      if (!cartResponse.data.data.items || cartResponse.data.data.items.length === 0) {
        // Add an item first
        await makeRequest(
          'POST',
          '/cart/items',
          { cartId: testCartId, productId: testProductId, quantity: 1 },
          { 'Authorization': `Bearer ${authToken}` }
        );

        // Get cart again
        const cartResponse2 = await makeRequest(
          'GET',
          '/cart',
          null,
          { 'Authorization': `Bearer ${authToken}` }
        );

        if (!cartResponse2.data.data.items || cartResponse2.data.data.items.length === 0) {
          throw new Error('No cart items found to remove');
        }

        testCartItemId = cartResponse2.data.data.items[0].id;
      } else {
        testCartItemId = cartResponse.data.data.items[0].id;
      }

      const response = await makeRequest(
        'DELETE',
        `/cart/items/${testCartItemId}`,
        null,
        { 'Authorization': `Bearer ${authToken}` }
      );

      // Verify response structure
      if (response.status !== 200) {
        throw new Error(`Expected status 200, got ${response.status}`);
      }

      if (!response.data.success) {
        throw new Error(`Expected success=true, got ${response.data.success}`);
      }

      return response.data;
    }
  },

  {
    name: 'Test 4.2: DELETE /api/v1/cart/items/:id - Error: Invalid item ID',
    test: async () => {
      try {
        const response = await makeRequest(
          'DELETE',
          '/cart/items/00000000-0000-0000-0000-000000000000', // Invalid UUID
          null,
          { 'Authorization': `Bearer ${authToken}` }
        );

        if (response.status === 200) {
          throw new Error('Expected 404 error, but got 200');
        }

        return { status: response.status, data: response.data };
      } catch (error) {
        if (error.response && (error.response.status === 404 || error.response.status === 400)) {
          return { status: error.response.status, data: error.response.data };
        }
        throw error;
      }
    }
  },

  // ============================================================================
  // 5. DELETE /api/v1/cart - Clear cart
  // ============================================================================
  {
    name: 'Test 5.1: DELETE /api/v1/cart - Clear cart (authenticated)',
    test: async () => {
      // First add some items to cart
      await makeRequest(
        'POST',
        '/cart/items',
        { cartId: testCartId, productId: testProductId, quantity: 1 },
        { 'Authorization': `Bearer ${authToken}` }
      );

      const response = await makeRequest(
        'DELETE',
        '/cart',
        null,
        { 'Authorization': `Bearer ${authToken}` }
      );

      // Verify response structure
      if (response.status !== 200) {
        throw new Error(`Expected status 200, got ${response.status}`);
      }

      if (!response.data.success) {
        throw new Error(`Expected success=true, got ${response.data.success}`);
      }

      // Verify cart is now empty
      const cartResponse = await makeRequest(
        'GET',
        '/cart',
        null,
        { 'Authorization': `Bearer ${authToken}` }
      );

      if (cartResponse.data.data.items.length !== 0) {
        throw new Error('Cart should be empty after clear operation');
      }

      return response.data;
    }
  },

  // ============================================================================
  // 6. POST /api/v1/cart/validate - Validate cart stock (logged-in user version)
  // ============================================================================
  {
    name: 'Test 6.1: POST /api/v1/cart/validate - Validate cart stock (authenticated)',
    test: async () => {
      // First add an item to cart
      await makeRequest(
        'POST',
        '/cart/items',
        { cartId: testCartId, productId: testProductId, quantity: 1 },
        { 'Authorization': `Bearer ${authToken}` }
      );

      const response = await makeRequest(
        'POST',
        '/cart/validate',
        null,
        { 'Authorization': `Bearer ${authToken}` }
      );

      // Verify response structure
      if (response.status !== 200) {
        throw new Error(`Expected status 200, got ${response.status}`);
      }

      if (!response.data.success) {
        throw new Error(`Expected success=true, got ${response.data.success}`);
      }

      if (!response.data.data) {
        throw new Error('Response missing data field');
      }

      if (!response.data.data.hasOwnProperty('isValid')) {
        throw new Error('Response missing isValid field');
      }

      return response.data;
    }
  },

  {
    name: 'Test 6.2: POST /api/v1/cart/validate - Verify validation results structure',
    test: async () => {
      const response = await makeRequest(
        'POST',
        '/cart/validate',
        null,
        { 'Authorization': `Bearer ${authToken}` }
      );

      // Verify expected fields in validation results
      if (response.data.data.validationResults) {
        if (!Array.isArray(response.data.data.validationResults)) {
          throw new Error('validationResults should be an array');
        }
      }

      return response.data;
    }
  },

  // ============================================================================
  // 7. GET /api/v1/cart/summary - Get cart summary
  // ============================================================================
  {
    name: 'Test 7.1: GET /api/v1/cart/summary - Get cart summary (authenticated)',
    test: async () => {
      const response = await makeRequest(
        'GET',
        '/cart/summary',
        null,
        { 'Authorization': `Bearer ${authToken}` }
      );

      // Verify response structure
      if (response.status !== 200) {
        throw new Error(`Expected status 200, got ${response.status}`);
      }

      if (!response.data.success) {
        throw new Error(`Expected success=true, got ${response.data.success}`);
      }

      if (!response.data.data) {
        throw new Error('Response missing data field');
      }

      return response.data;
    }
  },

  {
    name: 'Test 7.2: GET /api/v1/cart/summary - Verify summary fields',
    test: async () => {
      const response = await makeRequest(
        'GET',
        '/cart/summary',
        null,
        { 'Authorization': `Bearer ${authToken}` }
      );

      // Verify expected fields
      const expectedFields = ['subtotal', 'tax', 'shippingCost', 'total'];
      for (const field of expectedFields) {
        if (!response.data.data.hasOwnProperty(field)) {
          throw new Error(`Response missing expected field: ${field}`);
        }
      }

      return response.data;
    }
  },

  // ============================================================================
  // 8. GET /api/v1/cart/count - Get cart item count
  // ============================================================================
  {
    name: 'Test 8.1: GET /api/v1/cart/count - Get cart item count (authenticated)',
    test: async () => {
      const response = await makeRequest(
        'GET',
        '/cart/count',
        null,
        { 'Authorization': `Bearer ${authToken}` }
      );

      // Verify response structure
      if (response.status !== 200) {
        throw new Error(`Expected status 200, got ${response.status}`);
      }

      if (!response.data.success) {
        throw new Error(`Expected success=true, got ${response.data.success}`);
      }

      if (!response.data.data) {
        throw new Error('Response missing data field');
      }

      if (!response.data.data.hasOwnProperty('itemCount')) {
        throw new Error('Response missing itemCount field');
      }

      return response.data;
    }
  },

  {
    name: 'Test 8.2: GET /api/v1/cart/count - Verify count matches cart items',
    test: async () => {
      // Get cart count
      const countResponse = await makeRequest(
        'GET',
        '/cart/count',
        null,
        { 'Authorization': `Bearer ${authToken}` }
      );

      // Get full cart
      const cartResponse = await makeRequest(
        'GET',
        '/cart',
        null,
        { 'Authorization': `Bearer ${authToken}` }
      );

      // Calculate expected count
      const expectedCount = cartResponse.data.data.items.reduce(
        (total, item) => total + (item.quantity || 0),
        0
      );

      const actualCount = countResponse.data.data.itemCount;

      if (actualCount !== expectedCount) {
        throw new Error(`Item count mismatch: expected ${expectedCount}, got ${actualCount}`);
      }

      return countResponse.data;
    }
  },

  // ============================================================================
  // 9. POST /api/v1/cart/stock/check - Check stock availability
  // ============================================================================
  {
    name: 'Test 9.1: POST /api/v1/cart/stock/check - Check stock availability',
    test: async () => {
      if (!testProductId) {
        throw new Error('No product ID available');
      }

      const stockData = {
        productId: testProductId,
        quantity: 1,
        cartId: testCartId
      };

      const response = await makeRequest(
        'POST',
        '/cart/stock/check',
        stockData,
        { 'Authorization': `Bearer ${authToken}` }
      );

      // Verify response structure
      if (response.status !== 200) {
        throw new Error(`Expected status 200, got ${response.status}`);
      }

      if (!response.data.success) {
        throw new Error(`Expected success=true, got ${response.data.success}`);
      }

      if (!response.data.data) {
        throw new Error('Response missing data field');
      }

      return response.data;
    }
  },

  {
    name: 'Test 9.2: POST /api/v1/cart/stock/check - Verify stock check fields',
    test: async () => {
      const stockData = {
        productId: testProductId,
        quantity: 1,
        cartId: testCartId
      };

      const response = await makeRequest(
        'POST',
        '/cart/stock/check',
        stockData,
        { 'Authorization': `Bearer ${authToken}` }
      );

      // Verify expected fields
      const expectedFields = ['available', 'currentStock', 'availableForSale'];
      for (const field of expectedFields) {
        if (!response.data.data.hasOwnProperty(field)) {
          throw new Error(`Response missing expected field: ${field}`);
        }
      }

      return response.data;
    }
  },

  {
    name: 'Test 9.3: POST /api/v1/cart/stock/check - Error: Invalid product ID',
    test: async () => {
      try {
        const stockData = {
          productId: '00000000-0000-0000-0000-000000000000', // Invalid UUID
          quantity: 1
        };

        const response = await makeRequest(
          'POST',
          '/cart/stock/check',
          stockData,
          { 'Authorization': `Bearer ${authToken}` }
        );

        if (response.status === 200) {
          throw new Error('Expected error response, but got 200');
        }

        return { status: response.status, data: response.data };
      } catch (error) {
        if (error.response && error.response.status !== 200) {
          return { status: error.response.status, data: error.response.data };
        }
        throw error;
      }
    }
  },

  // ============================================================================
  // 10. POST /api/v1/cart/merge - Merge guest cart on login
  // ============================================================================
  {
    name: 'Test 10.1: POST /api/v1/cart/merge - Merge guest cart (authenticated)',
    test: async () => {
      if (!authToken) {
        throw new Error('No authentication token available');
      }

      // Create a guest session ID
      guestSessionId = 'test-guest-session-' + Date.now();

      // Add items to guest cart first
      try {
        await makeRequest(
          'POST',
          '/cart/items',
          { cartId: testCartId, productId: testProductId, quantity: 1 },
          { 'x-session-id': guestSessionId }
        );
      } catch (error) {
        // Guest cart might not exist, that's ok for this test
      }

      const mergeData = {
        guestSessionId: guestSessionId
      };

      const response = await makeRequest(
        'POST',
        '/cart/merge',
        mergeData,
        { 'Authorization': `Bearer ${authToken}` }
      );

      // Verify response structure
      if (response.status !== 200) {
        throw new Error(`Expected status 200, got ${response.status}`);
      }

      if (!response.data.success) {
        throw new Error(`Expected success=true, got ${response.data.success}`);
      }

      if (!response.data.data) {
        throw new Error('Response missing data field');
      }

      return response.data;
    }
  },

  {
    name: 'Test 10.2: POST /api/v1/cart/merge - Verify merge response fields',
    test: async () => {
      const mergeData = {
        guestSessionId: 'test-guest-session-' + Date.now()
      };

      const response = await makeRequest(
        'POST',
        '/cart/merge',
        mergeData,
        { 'Authorization': `Bearer ${authToken}` }
      );

      // Verify expected fields
      const expectedFields = ['cartId', 'itemsMerged'];
      for (const field of expectedFields) {
        if (!response.data.data.hasOwnProperty(field)) {
          throw new Error(`Response missing expected field: ${field}`);
        }
      }

      return response.data;
    }
  },

  {
    name: 'Test 10.3: POST /api/v1/cart/merge - Error: Missing guestSessionId',
    test: async () => {
      try {
        const response = await makeRequest(
          'POST',
          '/cart/merge',
          {}, // Missing guestSessionId
          { 'Authorization': `Bearer ${authToken}` }
        );

        if (response.status === 200) {
          throw new Error('Expected validation error (400), but got 200');
        }

        return { status: response.status, data: response.data };
      } catch (error) {
        if (error.response && error.response.status === 400) {
          return { status: error.response.status, data: error.response.data };
        }
        throw error;
      }
    }
  },

  {
    name: 'Test 10.4: POST /api/v1/cart/merge - Error: Unauthenticated',
    test: async () => {
      try {
        const mergeData = {
          guestSessionId: 'test-guest-session-' + Date.now()
        };

        const response = await makeRequest(
          'POST',
          '/cart/merge',
          mergeData,
          {} // No auth header
        );

        if (response.status === 200) {
          throw new Error('Expected authentication error (401), but got 200');
        }

        return { status: response.status, data: response.data };
      } catch (error) {
        if (error.response && error.response.status === 401) {
          return { status: error.response.status, data: error.response.data };
        }
        throw error;
      }
    }
  }
];

// Main test execution function
async function runTests() {
  console.log('='.repeat(80));
  console.log('EXISTING CART FUNCTIONALITY VERIFICATION TEST');
  console.log('Testing: All existing logged-in user cart endpoints');
  console.log('Purpose: Verify functionality remains intact after new route addition');
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
    log('\n❌ Cannot proceed without authentication', 'error');
    return results;
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
  console.log(`User Email: ${TEST_USER.identifier}`);
  console.log(`Cart ID: ${testCartId || 'N/A'}`);
  console.log(`Product ID: ${testProductId || 'N/A'}`);
  console.log(`Variant ID: ${testVariantId || 'N/A'}`);
  console.log(`Cart Item ID: ${testCartItemId || 'N/A'}`);
  console.log(`Guest Session ID: ${guestSessionId || 'N/A'}`);
  console.log('='.repeat(80));

  // Save results to JSON file
  const timestamp = Date.now();
  const resultsFilename = `existing-cart-functionality-test-results-${timestamp}.json`;
  const fs = require('fs');
  fs.writeFileSync(
    resultsFilename,
    JSON.stringify({
      timestamp: new Date().toISOString(),
      results,
      testData: {
        cartId: testCartId,
        productId: testProductId,
        variantId: testVariantId,
        cartItemId: testCartItemId,
        guestSessionId: guestSessionId
      }
    }, null, 2)
  );
  log(`Test results saved to: ${resultsFilename}`, 'info');

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
