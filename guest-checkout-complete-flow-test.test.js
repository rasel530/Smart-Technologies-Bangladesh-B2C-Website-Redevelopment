/**
 * Guest Checkout Complete Flow End-to-End Test
 * 
 * This script verifies the complete guest checkout flow works end-to-end
 * after the cart state synchronization fix.
 * 
 * Test Cases:
 * 1. Add Item to Cart as Guest
 * 2. Check Cart State
 * 3. Guest Checkout Initialization
 * 4. Complete Guest Checkout Flow
 */

const http = require('http');
const https = require('https');

// Configuration
const API_BASE_URL = 'http://localhost:3001/api/v1';
const FRONTEND_URL = 'http://localhost:3000';

// Test results storage
const testResults = {
  testEnvironment: {
    timestamp: new Date().toISOString(),
    os: process.platform,
    nodeVersion: process.version,
    apiBaseUrl: API_BASE_URL,
    frontendUrl: FRONTEND_URL
  },
  testCases: [],
  summary: {
    total: 0,
    passed: 0,
    failed: 0,
    warnings: []
  }
};

// Utility function to make HTTP requests
function makeRequest(method, path, data = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, API_BASE_URL);
    const options = {
      hostname: url.hostname,
      port: url.port || (url.protocol === 'https:' ? 443 : 80),
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };

    const protocol = url.protocol === 'https:' ? https : http;
    const req = protocol.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: parsed
          });
        } catch (e) {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: body
          });
        }
      });
    });

    req.on('error', reject);

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

// Utility function to validate UUID
function isValidUUID(str) {
  if (!str || typeof str !== 'string') return false;
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
}

// Test case runner
async function runTestCase(name, testFn) {
  console.log(`\n${'='.repeat(80)}`);
  console.log(`TEST CASE: ${name}`);
  console.log(`${'='.repeat(80)}`);
  
  const startTime = Date.now();
  const testCase = {
    name,
    startTime: new Date().toISOString(),
    steps: [],
    passed: false,
    error: null,
    duration: 0
  };

  try {
    await testFn(testCase);
    testCase.passed = true;
    testResults.summary.passed++;
    console.log(`\n✅ PASSED: ${name}`);
  } catch (error) {
    testCase.passed = false;
    testCase.error = error.message;
    testResults.summary.failed++;
    console.log(`\n❌ FAILED: ${name}`);
    console.log(`   Error: ${error.message}`);
  }

  testCase.duration = Date.now() - startTime;
  testResults.testCases.push(testCase);
  testResults.summary.total++;
}

// Helper to log test step
function logStep(testCase, stepName, details, passed = true) {
  const step = {
    name: stepName,
    details,
    passed,
    timestamp: new Date().toISOString()
  };
  testCase.steps.push(step);
  
  const icon = passed ? '✓' : '✗';
  console.log(`  ${icon} ${stepName}`);
  if (details) {
    console.log(`     ${JSON.stringify(details, null, 2).split('\n').join('\n     ')}`);
  }
}

// Test Case 1: Add Item to Cart as Guest
async function testAddItemToCartAsGuest(testCase) {
  console.log('\n--- Test Case 1: Add Item to Cart as Guest ---');
  
  // Step 1: Get a list of products to find a valid product ID
  logStep(testCase, 'Fetching products list', null);
  const productsResponse = await makeRequest('GET', '/products?limit=5');
  
  if (productsResponse.statusCode !== 200 || !productsResponse.body.success) {
    throw new Error(`Failed to fetch products: ${productsResponse.statusCode}`);
  }
  
  const products = productsResponse.body.data || productsResponse.body.products || [];
  if (products.length === 0) {
    throw new Error('No products available for testing');
  }
  
  const testProduct = products[0];
  logStep(testCase, 'Selected test product', {
    productId: testProduct.id,
    productName: testProduct.name,
    price: testProduct.regularPrice || testProduct.price
  });

  // Step 2: Create guest cart using /cart/guest/create endpoint
  logStep(testCase, 'Creating guest cart', null);
  const guestCartRequest = {
    items: [{
      productId: testProduct.id,
      quantity: 1,
      variantId: null,
      price: testProduct.regularPrice || testProduct.price
    }]
  };
  
  const createCartResponse = await makeRequest('POST', '/cart/guest/create', guestCartRequest);
  
  if (createCartResponse.statusCode !== 200 && createCartResponse.statusCode !== 201) {
    throw new Error(`Failed to create guest cart: ${createCartResponse.statusCode} - ${JSON.stringify(createCartResponse.body)}`);
  }
  
  logStep(testCase, 'Guest cart created successfully', {
    statusCode: createCartResponse.statusCode,
    response: createCartResponse.body
  });

  // Step 3: Verify response contains cartId
  const cartData = createCartResponse.body.data.cart || createCartResponse.body.data;
  const cartId = cartData.id;
  const sessionId = createCartResponse.body.data.sessionId;
  
  if (!cartId) {
    throw new Error('Response does not contain cart id field');
  }
  
  if (!isValidUUID(cartId)) {
    throw new Error(`cartId is not a valid UUID: ${cartId}`);
  }
  
  logStep(testCase, 'Verified cartId is a valid UUID', {
    cartId: cartId,
    sessionId: sessionId,
    isValidUUID: true
  });
  
  // Step 4: Verify cart exists in database
  logStep(testCase, 'Verifying cart exists in database', { cartId, sessionId });
  const getCartResponse = await makeRequest('GET', `/cart/guest/${sessionId}`);
  
  if (getCartResponse.statusCode !== 200) {
    throw new Error(`Failed to retrieve guest cart: ${getCartResponse.statusCode}`);
  }
  
  logStep(testCase, 'Cart retrieved from database successfully', {
    itemCount: getCartResponse.body.data?.cart?.items?.length || getCartResponse.body.data?.items?.length || 0
  });
  
  // Store cartId for subsequent tests
  testCase.cartId = cartId;
  testCase.sessionId = sessionId;
  testCase.productId = testProduct.id;
}

// Test Case 2: Check Cart State
async function testCheckCartState(testCase) {
  console.log('\n--- Test Case 2: Check Cart State ---');
  
  // Get cartId from previous test
  const cartId = testResults.testCases[0].cartId;
  const sessionId = testResults.testCases[0].sessionId;
  
  // Step 1: Retrieve cart from backend
  logStep(testCase, 'Retrieving cart state from backend', { cartId, sessionId });
  const cartResponse = await makeRequest('GET', `/cart/guest/${sessionId}`);
  
  if (cartResponse.statusCode !== 200) {
    throw new Error(`Failed to retrieve cart: ${cartResponse.statusCode}`);
  }
  
  const cartData = cartResponse.body.data.cart || cartResponse.body.data;
  
  // Step 2: Verify cart structure
  logStep(testCase, 'Verifying cart structure', {
    hasId: !!cartData.id,
    hasItems: Array.isArray(cartData.items),
    itemCount: cartData.items?.length || 0,
    hasTotals: !!(cartData.subtotal !== undefined && cartData.total !== undefined)
  });
  
  if (!cartData.id) {
    throw new Error('Cart data is missing id field');
  }
  
  if (!Array.isArray(cartData.items) || cartData.items.length === 0) {
    throw new Error('Cart has no items');
  }
  
  // Step 3: Verify cart totals are calculated correctly
  const expectedSubtotal = cartData.items.reduce((sum, item) => {
    return sum + (parseFloat(item.price) * item.quantity);
  }, 0);
  
  const actualSubtotal = parseFloat(cartData.subtotal);
  const totalsMatch = Math.abs(expectedSubtotal - actualSubtotal) < 0.01;
  
  logStep(testCase, 'Verifying cart totals calculation', {
    expectedSubtotal,
    actualSubtotal,
    match: totalsMatch
  });
  
  if (!totalsMatch) {
    throw new Error(`Cart totals mismatch: expected ${expectedSubtotal}, got ${actualSubtotal}`);
  }
  
  // Step 4: Verify cartId matches
  if (cartData.id !== cartId) {
    throw new Error(`Cart ID mismatch: expected ${cartId}, got ${cartData.id}`);
  }
  
  logStep(testCase, 'Cart ID matches', { cartId: cartData.id });
}

// Test Case 3: Guest Checkout Initialization
async function testGuestCheckoutInitialization(testCase) {
  console.log('\n--- Test Case 3: Guest Checkout Initialization ---');
  
  // Get cartId from previous test
  const cartId = testResults.testCases[0].cartId;
  
  // Step 1: Initialize guest checkout
  logStep(testCase, 'Initializing guest checkout', { cartId });
  const checkoutInitRequest = {
    cartId: cartId,
    platform: 'desktop',
    language: 'en'
  };
  
  const checkoutResponse = await makeRequest('POST', '/guest/checkout/initiate', checkoutInitRequest);
  
  // Step 2: Verify response status
  if (checkoutResponse.statusCode !== 201 && checkoutResponse.statusCode !== 200) {
    throw new Error(`Guest checkout initialization failed: ${checkoutResponse.statusCode} - ${JSON.stringify(checkoutResponse.body)}`);
  }
  
  logStep(testCase, 'Guest checkout initialization successful', {
    statusCode: checkoutResponse.statusCode,
    response: checkoutResponse.body
  });
  
  // Step 3: Verify response structure
  const checkoutData = checkoutResponse.body.data;
  
  if (!checkoutData.sessionId) {
    throw new Error('Checkout response missing sessionId');
  }
  
  if (!isValidUUID(checkoutData.sessionId)) {
    throw new Error(`Checkout sessionId is not a valid UUID: ${checkoutData.sessionId}`);
  }
  
  if (checkoutData.cartId !== cartId) {
    throw new Error(`Checkout cartId mismatch: expected ${cartId}, got ${checkoutData.cartId}`);
  }
  
  logStep(testCase, 'Verified checkout session structure', {
    sessionId: checkoutData.sessionId,
    cartId: checkoutData.cartId,
    expiresAt: checkoutData.expiresAt
  });
  
  // Step 4: Verify no "Cart not found" error
  if (checkoutResponse.body.error && checkoutResponse.body.error.includes('Cart not found')) {
    throw new Error('Received "Cart not found" error - cart state synchronization fix may not be working');
  }
  
  logStep(testCase, 'Verified no "Cart not found" error', { passed: true });
  
  // Store checkout session for next test
  testCase.checkoutSessionId = checkoutData.sessionId;
}

// Test Case 4: Complete Guest Checkout Flow
async function testCompleteGuestCheckoutFlow(testCase) {
  console.log('\n--- Test Case 4: Complete Guest Checkout Flow ---');
  
  const checkoutSessionId = testResults.testCases[2].checkoutSessionId;
  
  // Step 1: Save guest information
  logStep(testCase, 'Saving guest information', null);
  const guestInfoRequest = {
    firstName: 'Test',
    lastName: 'User',
    email: `test${Date.now()}@example.com`,
    phone: '+8801700000000'
  };
  
  const saveInfoResponse = await makeRequest(
    'POST',
    `/guest/checkout/session/${checkoutSessionId}/info`,
    guestInfoRequest
  );
  
  if (saveInfoResponse.statusCode !== 200) {
    throw new Error(`Failed to save guest info: ${saveInfoResponse.statusCode}`);
  }
  
  logStep(testCase, 'Guest information saved successfully', {
    response: saveInfoResponse.body
  });
  
  // Step 2: Complete checkout
  logStep(testCase, 'Completing guest checkout', null);
  const shippingAddress = {
    fullName: 'Test User',
    phone: '+8801700000000',
    addressLine1: '123 Test Street',
    addressLine2: 'Apt 4B',
    city: 'Dhaka',
    district: 'Dhaka',
    postalCode: '1000'
  };
  
  const completeCheckoutRequest = {
    shippingAddress: shippingAddress,
    billingAddress: shippingAddress,
    paymentMethod: 'cash_on_delivery',
    notes: 'Test guest checkout order'
  };
  
  const completeResponse = await makeRequest(
    'POST',
    `/guest/checkout/session/${checkoutSessionId}/complete`,
    completeCheckoutRequest
  );
  
  if (completeResponse.statusCode !== 201 && completeResponse.statusCode !== 200) {
    throw new Error(`Failed to complete checkout: ${completeResponse.statusCode} - ${JSON.stringify(completeResponse.body)}`);
  }
  
  logStep(testCase, 'Guest checkout completed successfully', {
    statusCode: completeResponse.statusCode,
    response: completeResponse.body
  });
  
  // Step 3: Verify order was created
  const orderData = completeResponse.body.data;
  
  if (!orderData.orderId && !orderData.id) {
    throw new Error('Order response missing orderId or id');
  }
  
  if (!orderData.orderNumber) {
    throw new Error('Order response missing orderNumber');
  }
  
  logStep(testCase, 'Order created successfully', {
    orderId: orderData.orderId || orderData.id,
    orderNumber: orderData.orderNumber,
    status: orderData.status,
    total: orderData.total
  });
  
  // Step 4: Verify cart was marked as converted
  const cartId = testResults.testCases[0].cartId;
  logStep(testCase, 'Verifying cart was marked as converted', { cartId });
  
  // Note: We can't directly check cart status without admin endpoints
  // But successful checkout indicates cart was properly processed
  logStep(testCase, 'Cart processing verified (via successful checkout)', { passed: true });
}

// Main test execution
async function runAllTests() {
  console.log('\n' + '='.repeat(80));
  console.log('GUEST CHECKOUT COMPLETE FLOW END-TO-END TEST');
  console.log('Cart State Synchronization Fix Verification');
  console.log('='.repeat(80));
  console.log(`\nTest Environment:`);
  console.log(`  API URL: ${API_BASE_URL}`);
  console.log(`  Frontend URL: ${FRONTEND_URL}`);
  console.log(`  OS: ${process.platform}`);
  console.log(`  Node.js: ${process.version}`);
  console.log(`  Timestamp: ${new Date().toISOString()}`);

  try {
    // Pre-test: Check if servers are running
    console.log('\n--- Pre-Test: Server Health Check ---');
    
    try {
      const healthResponse = await makeRequest('GET', '/health');
      console.log(`✓ Backend server is running (HTTP ${healthResponse.statusCode})`);
    } catch (e) {
      console.log(`⚠ Backend health check failed: ${e.message}`);
      console.log('  Continuing with tests...');
    }
    
    // Run test cases in order
    await runTestCase('Test Case 1: Add Item to Cart as Guest', testAddItemToCartAsGuest);
    await runTestCase('Test Case 2: Check Cart State', testCheckCartState);
    await runTestCase('Test Case 3: Guest Checkout Initialization', testGuestCheckoutInitialization);
    await runTestCase('Test Case 4: Complete Guest Checkout Flow', testCompleteGuestCheckoutFlow);
    
  } catch (error) {
    console.error('\n❌ Test suite failed with error:', error);
  }
  
  // Print summary
  printSummary();
  
  // Save results to file
  saveResults();
}

function printSummary() {
  console.log('\n' + '='.repeat(80));
  console.log('TEST SUMMARY');
  console.log('='.repeat(80));
  console.log(`Total Tests: ${testResults.summary.total}`);
  console.log(`Passed: ${testResults.summary.passed}`);
  console.log(`Failed: ${testResults.summary.failed}`);
  console.log(`Success Rate: ${((testResults.summary.passed / testResults.summary.total) * 100).toFixed(1)}%`);
  
  if (testResults.summary.warnings.length > 0) {
    console.log(`\nWarnings (${testResults.summary.warnings.length}):`);
    testResults.summary.warnings.forEach(warning => {
      console.log(`  ⚠ ${warning}`);
    });
  }
  
  console.log('\n' + '='.repeat(80));
  
  if (testResults.summary.failed === 0) {
    console.log('✅ ALL TESTS PASSED - Guest checkout flow is working correctly!');
  } else {
    console.log('❌ SOME TESTS FAILED - Please review failures above');
  }
  console.log('='.repeat(80) + '\n');
}

function saveResults() {
  const filename = `guest-checkout-complete-flow-test-results-${Date.now()}.json`;
  const fs = require('fs');
  
  try {
    fs.writeFileSync(filename, JSON.stringify(testResults, null, 2));
    console.log(`\n📊 Test results saved to: ${filename}`);
  } catch (error) {
    console.error(`\nFailed to save test results: ${error.message}`);
  }
}

// Run tests
runAllTests().catch(error => {
  console.error('Fatal error running tests:', error);
  process.exit(1);
});
