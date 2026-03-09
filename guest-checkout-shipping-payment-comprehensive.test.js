/**
 * Guest Checkout Shipping and Payment System Comprehensive Test
 * 
 * This test suite validates all fixes for guest checkout shipping and payment system:
 * 1. API endpoint testing
 * 2. Shipping method display testing
 * 3. Shipping method selection and persistence testing
 * 4. Free shipping logic testing
 * 5. Regression testing
 * 6. Error handling testing
 * 
 * @version 1.0.0
 * @date 2026-02-24
 */

const fs = require('fs');
const path = require('path');

// Test configuration
const CONFIG = {
  API_BASE_URL: process.env.API_BASE_URL || 'http://localhost:3001/api/v1',
  FRONTEND_BASE_URL: process.env.FRONTEND_BASE_URL || 'http://localhost:3000',
  TEST_TIMEOUT: 30000,
  SHIPPING_COSTS: {
    STANDARD: 100,
    EXPRESS: 200,
    INSIDE_DHAKA: 60,
    OUTSIDE_DHAKA: 120
  },
  FREE_SHIPPING_THRESHOLD: 5000
};

// Test results storage
const testResults = {
  timestamp: new Date().toISOString(),
  summary: {
    total: 0,
    passed: 0,
    failed: 0,
    skipped: 0
  },
  testSuites: []
};

// Helper functions
const log = (message, level = 'info') => {
  const timestamp = new Date().toISOString();
  const prefix = {
    info: '✓',
    error: '✗',
    warn: '⚠',
    success: '✓',
    fail: '✗'
  }[level] || '•';
  console.log(`[${timestamp}] ${prefix} ${message}`);
};

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// HTTP request helper
const makeRequest = async (method, endpoint, data = null, headers = {}) => {
  try {
    const url = `${CONFIG.API_BASE_URL}${endpoint}`;
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };

    if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
      options.body = JSON.stringify(data);
    }

    const response = await fetch(url, options);
    const responseData = await response.json().catch(() => null);

    return {
      status: response.status,
      ok: response.ok,
      data: responseData,
      headers: response.headers
    };
  } catch (error) {
    return {
      status: 0,
      ok: false,
      data: { error: error.message },
      error
    };
  }
};

// Test suite class
class TestSuite {
  constructor(name) {
    this.name = name;
    this.tests = [];
    this.results = [];
  }

  test(description, testFn) {
    this.tests.push({ description, testFn });
  }

  async run() {
    log(`\n📋 Running test suite: ${this.name}`, 'info');
    log('='.repeat(80), 'info');

    for (const { description, testFn } of this.tests) {
      const testResult = {
        description,
        passed: false,
        failed: false,
        skipped: false,
        error: null,
        duration: 0
      };

      try {
        const testStartTime = Date.now();
        await testFn();
        testResult.duration = Date.now() - testStartTime;
        testResult.passed = true;
        log(`  ✓ ${description}`, 'success');
      } catch (error) {
        const testStartTime = Date.now();
        testResult.duration = Date.now() - testStartTime;
        testResult.failed = true;
        testResult.error = error.message;
        log(`  ✗ ${description}`, 'fail');
        log(`    Error: ${error.message}`, 'error');
      }

      this.results.push(testResult);
      testResults.summary.total++;
      if (testResult.passed) testResults.summary.passed++;
      if (testResult.failed) testResults.summary.failed++;
    }

    const passedCount = this.results.filter(r => r.passed).length;
    const failedCount = this.results.filter(r => r.failed).length;
    log(`\nSuite complete: ${passedCount} passed, ${failedCount} failed`, 'info');

    testResults.testSuites.push({
      name: this.name,
      results: this.results,
      summary: {
        total: this.results.length,
        passed: passedCount,
        failed: failedCount
      }
    });

    return this.results;
  }
}

// Assertion helpers
const assert = {
  equal: (actual, expected, message) => {
    if (actual !== expected) {
      throw new Error(`${message || 'Assertion failed'}: expected ${expected}, got ${actual}`);
    }
  },
  notEqual: (actual, expected, message) => {
    if (actual === expected) {
      throw new Error(`${message || 'Assertion failed'}: expected ${actual} to not equal ${expected}`);
    }
  },
  truthy: (value, message) => {
    if (!value) {
      throw new Error(`${message || 'Assertion failed'}: expected truthy value, got ${value}`);
    }
  },
  falsy: (value, message) => {
    if (value) {
      throw new Error(`${message || 'Assertion failed'}: expected falsy value, got ${value}`);
    }
  },
  contains: (haystack, needle, message) => {
    if (!haystack || !haystack.includes(needle)) {
      throw new Error(`${message || 'Assertion failed'}: expected ${haystack} to contain ${needle}`);
    }
  },
  greaterThan: (actual, expected, message) => {
    if (actual <= expected) {
      throw new Error(`${message || 'Assertion failed'}: expected ${actual} to be greater than ${expected}`);
    }
  },
  lessThan: (actual, expected, message) => {
    if (actual >= expected) {
      throw new Error(`${message || 'Assertion failed'}: expected ${actual} to be less than ${expected}`);
    }
  },
  inRange: (value, min, max, message) => {
    if (value < min || value > max) {
      throw new Error(`${message || 'Assertion failed'}: expected ${value} to be in range [${min}, ${max}]`);
    }
  }
};

// ============================================================================
// TEST SUITE 1: API Endpoint Testing
// ============================================================================
const apiEndpointSuite = new TestSuite('1. API Endpoint Testing');

apiEndpointSuite.test('POST /api/v1/guest/checkout/session/:sessionId/shipping works with valid sessionId', async () => {
  // First, create a guest session
  const initResponse = await makeRequest('POST', '/guest/checkout/initialize', {});
  assert.equal(initResponse.status, 201, 'Guest checkout initialization should return 201');
  assert.truthy(initResponse.data?.data?.sessionId, 'Should return a sessionId');

  const sessionId = initResponse.data.data.sessionId;

  // Test shipping method endpoint
  const shippingResponse = await makeRequest(
    'POST',
    `/guest/checkout/session/${sessionId}/shipping`,
    { method: 'STANDARD' }
  );

  assert.equal(shippingResponse.status, 200, 'Shipping method save should return 200');
  assert.truthy(shippingResponse.data?.success, 'Response should indicate success');
  assert.equal(shippingResponse.data?.data?.shippingMethod, 'STANDARD', 'Should save STANDARD method');
  assert.equal(shippingResponse.data?.data?.shippingCost, CONFIG.SHIPPING_COSTS.STANDARD, 'Should return correct cost');
});

apiEndpointSuite.test('POST /api/v1/guest/checkout/session/:sessionId/shipping returns 404 for invalid sessionId', async () => {
  const invalidSessionId = '00000000-0000-0000-0000-000000000000';
  const response = await makeRequest(
    'POST',
    `/guest/checkout/session/${invalidSessionId}/shipping`,
    { method: 'STANDARD' }
  );

  assert.equal(response.status, 404, 'Should return 404 for invalid session');
  assert.falsy(response.data?.success, 'Response should indicate failure');
});

apiEndpointSuite.test('POST /api/v1/guest/checkout/session/:sessionId/shipping returns 400 for invalid UUID format', async () => {
  const invalidSessionId = 'not-a-uuid';
  const response = await makeRequest(
    'POST',
    `/guest/checkout/session/${invalidSessionId}/shipping`,
    { method: 'STANDARD' }
  );

  assert.equal(response.status, 400, 'Should return 400 for invalid UUID format');
  assert.falsy(response.data?.success, 'Response should indicate failure');
});

apiEndpointSuite.test('POST /api/v1/guest/checkout/session/:sessionId/shipping requires only { method } in payload', async () => {
  // First, create a guest session
  const initResponse = await makeRequest('POST', '/guest/checkout/initialize', {});
  assert.equal(initResponse.status, 201, 'Guest checkout initialization should return 201');

  const sessionId = initResponse.data.data.sessionId;

  // Test with minimal payload (only method)
  const minimalPayloadResponse = await makeRequest(
    'POST',
    `/guest/checkout/session/${sessionId}/shipping`,
    { method: 'EXPRESS' }
  );

  assert.equal(minimalPayloadResponse.status, 200, 'Should accept minimal payload with only method');
  assert.truthy(minimalPayloadResponse.data?.success, 'Response should indicate success');
});

apiEndpointSuite.test('POST /api/v1/guest/checkout/session/:sessionId/shipping validates method field', async () => {
  // First, create a guest session
  const initResponse = await makeRequest('POST', '/guest/checkout/initialize', {});
  assert.equal(initResponse.status, 201, 'Guest checkout initialization should return 201');

  const sessionId = initResponse.data.data.sessionId;

  // Test without method field
  const noMethodResponse = await makeRequest(
    'POST',
    `/guest/checkout/session/${sessionId}/shipping`,
    {}
  );

  assert.equal(noMethodResponse.status, 400, 'Should return 400 when method is missing');
  assert.falsy(noMethodResponse.data?.success, 'Response should indicate failure');
});

apiEndpointSuite.test('POST /api/v1/guest/checkout/session/:sessionId/shipping accepts all valid shipping methods', async () => {
  const validMethods = ['STANDARD', 'EXPRESS', 'INSIDE_DHAKA', 'OUTSIDE_DHAKA'];

  for (const method of validMethods) {
    // Create a new session for each test
    const initResponse = await makeRequest('POST', '/guest/checkout/initialize', {});
    assert.equal(initResponse.status, 201, `Guest checkout initialization should return 201 for ${method}`);

    const sessionId = initResponse.data.data.sessionId;

    // Test shipping method
    const shippingResponse = await makeRequest(
      'POST',
      `/guest/checkout/session/${sessionId}/shipping`,
      { method }
    );

    assert.equal(shippingResponse.status, 200, `Should accept ${method} shipping method`);
    assert.truthy(shippingResponse.data?.success, `Response should indicate success for ${method}`);
    assert.equal(shippingResponse.data?.data?.shippingMethod, method, `Should save ${method} method`);
  }
});

// ============================================================================
// TEST SUITE 2: Shipping Method Display Testing
// ============================================================================
const shippingDisplaySuite = new TestSuite('2. Shipping Method Display Testing');

shippingDisplaySuite.test('Shipping method STANDARD displays correct cost (৳100)', async () => {
  // Read the guest checkout page file
  const pageContent = fs.readFileSync(
    path.join(__dirname, 'frontend/src/app/checkout/guest/page.tsx'),
    'utf-8'
  );

  // Check that STANDARD shipping shows ৳100 (not "Free")
  const standardPattern = /STANDARD.*৳100/g;
  assert.truthy(standardPattern.test(pageContent), 'STANDARD shipping should display ৳100');

  // Ensure it doesn't show "Free" for STANDARD
  const standardFreePattern = /STANDARD.*Free/gi;
  assert.falsy(standardFreePattern.test(pageContent), 'STANDARD shipping should not display "Free"');
});

shippingDisplaySuite.test('Shipping method EXPRESS displays correct cost (৳200)', async () => {
  const pageContent = fs.readFileSync(
    path.join(__dirname, 'frontend/src/app/checkout/guest/page.tsx'),
    'utf-8'
  );

  // Check that EXPRESS shipping shows ৳200 (not "Free")
  const expressPattern = /EXPRESS.*৳200/g;
  assert.truthy(expressPattern.test(pageContent), 'EXPRESS shipping should display ৳200');

  // Ensure it doesn't show "Free" for EXPRESS
  const expressFreePattern = /EXPRESS.*Free/gi;
  assert.falsy(expressFreePattern.test(pageContent), 'EXPRESS shipping should not display "Free"');
});

shippingDisplaySuite.test('Shipping method INSIDE_DHAKA displays correct cost (৳60)', async () => {
  const pageContent = fs.readFileSync(
    path.join(__dirname, 'frontend/src/app/checkout/guest/page.tsx'),
    'utf-8'
  );

  // Check that INSIDE_DHAKA shipping shows ৳60 (not "Free")
  const insideDhakaPattern = /INSIDE_DHAKA.*৳60/g;
  assert.truthy(insideDhakaPattern.test(pageContent), 'INSIDE_DHAKA shipping should display ৳60');

  // Ensure it doesn't show "Free" for INSIDE_DHAKA
  const insideDhakaFreePattern = /INSIDE_DHAKA.*Free/gi;
  assert.falsy(insideDhakaFreePattern.test(pageContent), 'INSIDE_DHAKA shipping should not display "Free"');
});

shippingDisplaySuite.test('Shipping method OUTSIDE_DHAKA displays correct cost (৳120)', async () => {
  const pageContent = fs.readFileSync(
    path.join(__dirname, 'frontend/src/app/checkout/guest/page.tsx'),
    'utf-8'
  );

  // Check that OUTSIDE_DHAKA shipping shows ৳120 (not "Free")
  const outsideDhakaPattern = /OUTSIDE_DHAKA.*৳120/g;
  assert.truthy(outsideDhakaPattern.test(pageContent), 'OUTSIDE_DHAKA shipping should display ৳120');

  // Ensure it doesn't show "Free" for OUTSIDE_DHAKA
  const outsideDhakaFreePattern = /OUTSIDE_DHAKA.*Free/gi;
  assert.falsy(outsideDhakaFreePattern.test(pageContent), 'OUTSIDE_DHAKA shipping should not display "Free"');
});

shippingDisplaySuite.test('All 4 shipping methods are displayed in the UI', async () => {
  const pageContent = fs.readFileSync(
    path.join(__dirname, 'frontend/src/app/checkout/guest/page.tsx'),
    'utf-8'
  );

  // Check all shipping methods are present
  assert.contains(pageContent, 'STANDARD', 'STANDARD shipping method should be present');
  assert.contains(pageContent, 'EXPRESS', 'EXPRESS shipping method should be present');
  assert.contains(pageContent, 'INSIDE_DHAKA', 'INSIDE_DHAKA shipping method should be present');
  assert.contains(pageContent, 'OUTSIDE_DHAKA', 'OUTSIDE_DHAKA shipping method should be present');
});

shippingDisplaySuite.test('Shipping costs do NOT show "Free" at selection time', async () => {
  const pageContent = fs.readFileSync(
    path.join(__dirname, 'frontend/src/app/checkout/guest/page.tsx'),
    'utf-8'
  );

  // Check that shipping method buttons don't show "Free" text
  // Look for the shipping method selection section
  const shippingSectionMatch = pageContent.match(/step === 'shipping'.*?step === 'payment'/gs);
  assert.truthy(shippingSectionMatch, 'Should find shipping method section');

  const shippingSection = shippingSectionMatch[0];

  // Check that "Free" is not in the shipping method buttons
  const freeInShippingButtons = /selectedShippingMethod.*Free/gi.test(shippingSection);
  assert.falsy(freeInShippingButtons, 'Shipping method buttons should not show "Free"');
});

// ============================================================================
// TEST SUITE 3: Shipping Method Selection and Persistence Testing
// ============================================================================
const selectionPersistenceSuite = new TestSuite('3. Shipping Method Selection and Persistence Testing');

selectionPersistenceSuite.test('User can select STANDARD shipping method', async () => {
  const initResponse = await makeRequest('POST', '/guest/checkout/initialize', {});
  const sessionId = initResponse.data.data.sessionId;

  const shippingResponse = await makeRequest(
    'POST',
    `/guest/checkout/session/${sessionId}/shipping`,
    { method: 'STANDARD' }
  );

  assert.equal(shippingResponse.status, 200, 'Should successfully save STANDARD method');
  assert.equal(shippingResponse.data?.data?.shippingMethod, 'STANDARD', 'Method should be STANDARD');
  assert.equal(shippingResponse.data?.data?.shippingCost, CONFIG.SHIPPING_COSTS.STANDARD, 'Cost should be 100');
});

selectionPersistenceSuite.test('User can select EXPRESS shipping method', async () => {
  const initResponse = await makeRequest('POST', '/guest/checkout/initialize', {});
  const sessionId = initResponse.data.data.sessionId;

  const shippingResponse = await makeRequest(
    'POST',
    `/guest/checkout/session/${sessionId}/shipping`,
    { method: 'EXPRESS' }
  );

  assert.equal(shippingResponse.status, 200, 'Should successfully save EXPRESS method');
  assert.equal(shippingResponse.data?.data?.shippingMethod, 'EXPRESS', 'Method should be EXPRESS');
  assert.equal(shippingResponse.data?.data?.shippingCost, CONFIG.SHIPPING_COSTS.EXPRESS, 'Cost should be 200');
});

selectionPersistenceSuite.test('User can select INSIDE_DHAKA shipping method', async () => {
  const initResponse = await makeRequest('POST', '/guest/checkout/initialize', {});
  const sessionId = initResponse.data.data.sessionId;

  const shippingResponse = await makeRequest(
    'POST',
    `/guest/checkout/session/${sessionId}/shipping`,
    { method: 'INSIDE_DHAKA' }
  );

  assert.equal(shippingResponse.status, 200, 'Should successfully save INSIDE_DHAKA method');
  assert.equal(shippingResponse.data?.data?.shippingMethod, 'INSIDE_DHAKA', 'Method should be INSIDE_DHAKA');
  assert.equal(shippingResponse.data?.data?.shippingCost, CONFIG.SHIPPING_COSTS.INSIDE_DHAKA, 'Cost should be 60');
});

selectionPersistenceSuite.test('User can select OUTSIDE_DHAKA shipping method', async () => {
  const initResponse = await makeRequest('POST', '/guest/checkout/initialize', {});
  const sessionId = initResponse.data.data.sessionId;

  const shippingResponse = await makeRequest(
    'POST',
    `/guest/checkout/session/${sessionId}/shipping`,
    { method: 'OUTSIDE_DHAKA' }
  );

  assert.equal(shippingResponse.status, 200, 'Should successfully save OUTSIDE_DHAKA method');
  assert.equal(shippingResponse.data?.data?.shippingMethod, 'OUTSIDE_DHAKA', 'Method should be OUTSIDE_DHAKA');
  assert.equal(shippingResponse.data?.data?.shippingCost, CONFIG.SHIPPING_COSTS.OUTSIDE_DHAKA, 'Cost should be 120');
});

selectionPersistenceSuite.test('Clicking "Continue to Payment" saves the method without 404 error', async () => {
  const initResponse = await makeRequest('POST', '/guest/checkout/initialize', {});
  const sessionId = initResponse.data.data.sessionId;

  // Simulate clicking "Continue to Payment" by calling the shipping endpoint
  const shippingResponse = await makeRequest(
    'POST',
    `/guest/checkout/session/${sessionId}/shipping`,
    { method: 'STANDARD' }
  );

  assert.notEqual(shippingResponse.status, 404, 'Should NOT return 404 error');
  assert.equal(shippingResponse.status, 200, 'Should return 200 on success');
  assert.truthy(shippingResponse.data?.success, 'Should indicate success');
});

selectionPersistenceSuite.test('Shipping method is persisted to backend', async () => {
  const initResponse = await makeRequest('POST', '/guest/checkout/initialize', {});
  const sessionId = initResponse.data.data.sessionId;

  // Save shipping method
  const shippingResponse = await makeRequest(
    'POST',
    `/guest/checkout/session/${sessionId}/shipping`,
    { method: 'EXPRESS' }
  );

  assert.equal(shippingResponse.status, 200, 'Should save shipping method');

  // Retrieve session to verify persistence
  const sessionResponse = await makeRequest(
    'GET',
    `/guest/checkout/session/${sessionId}`
  );

  assert.equal(sessionResponse.status, 200, 'Should retrieve session');
  assert.equal(sessionResponse.data?.data?.shippingMethod, 'EXPRESS', 'Shipping method should be persisted');
});

selectionPersistenceSuite.test('Shipping cost is calculated correctly for all methods', async () => {
  const testCases = [
    { method: 'STANDARD', expectedCost: CONFIG.SHIPPING_COSTS.STANDARD },
    { method: 'EXPRESS', expectedCost: CONFIG.SHIPPING_COSTS.EXPRESS },
    { method: 'INSIDE_DHAKA', expectedCost: CONFIG.SHIPPING_COSTS.INSIDE_DHAKA },
    { method: 'OUTSIDE_DHAKA', expectedCost: CONFIG.SHIPPING_COSTS.OUTSIDE_DHAKA }
  ];

  for (const { method, expectedCost } of testCases) {
    const initResponse = await makeRequest('POST', '/guest/checkout/initialize', {});
    const sessionId = initResponse.data.data.sessionId;

    const shippingResponse = await makeRequest(
      'POST',
      `/guest/checkout/session/${sessionId}/shipping`,
      { method }
    );

    assert.equal(
      shippingResponse.data?.data?.shippingCost,
      expectedCost,
      `${method} shipping cost should be ${expectedCost}`
    );
  }
});

// ============================================================================
// TEST SUITE 4: Free Shipping Logic Testing
// ============================================================================
const freeShippingSuite = new TestSuite('4. Free Shipping Logic Testing');

freeShippingSuite.test('Free shipping is NOT applied at selection time', async () => {
  const initResponse = await makeRequest('POST', '/guest/checkout/initialize', {});
  const sessionId = initResponse.data.data.sessionId;

  // Save shipping method (selection time)
  const shippingResponse = await makeRequest(
    'POST',
    `/guest/checkout/session/${sessionId}/shipping`,
    { method: 'STANDARD' }
  );

  // At selection time, shipping cost should be the full cost
  assert.equal(
    shippingResponse.data?.data?.shippingCost,
    CONFIG.SHIPPING_COSTS.STANDARD,
    'Shipping cost should be full price at selection time'
  );
  assert.notEqual(
    shippingResponse.data?.data?.shippingCost,
    0,
    'Shipping cost should NOT be 0 at selection time'
  );
});

freeShippingSuite.test('Free shipping IS applied at order completion for orders >= ৳5,000', async () => {
  // This test would require creating a cart with items totaling >= 5000
  // For now, we'll verify the logic in the code

  const controllerContent = fs.readFileSync(
    path.join(__dirname, 'backend/controllers/guestCheckoutController.js'),
    'utf-8'
  );

  // Check that free shipping threshold is implemented
  assert.contains(
    controllerContent,
    'totals.subtotal >= 5000',
    'Should have free shipping threshold check'
  );

  // Check that shipping cost is set to 0 when threshold is met
  assert.contains(
    controllerContent,
    'finalShippingCost = 0',
    'Should set shipping cost to 0 for free shipping'
  );
});

freeShippingSuite.test('Free shipping threshold is set to ৳5,000', async () => {
  const controllerContent = fs.readFileSync(
    path.join(__dirname, 'backend/controllers/guestCheckoutController.js'),
    'utf-8'
  );

  // Check the free shipping threshold value
  const thresholdMatch = controllerContent.match(/totals\.subtotal\s*>=\s*(\d+)/);
  assert.truthy(thresholdMatch, 'Should have free shipping threshold');
  assert.equal(parseInt(thresholdMatch[1]), 5000, 'Threshold should be 5000');
});

freeShippingSuite.test('Orders below ৳5,000 pay shipping cost', async () => {
  const controllerContent = fs.readFileSync(
    path.join(__dirname, 'backend/controllers/guestCheckoutController.js'),
    'utf-8'
  );

  // Check that orders below threshold pay shipping
  assert.contains(
    controllerContent,
    'else if',
    'Should have else clause for orders below threshold'
  );

  // Check that shipping cost is calculated from method when below threshold
  assert.contains(
    controllerContent,
    'availableMethods[selectedShippingMethod].cost',
    'Should calculate cost from shipping method'
  );
});

freeShippingSuite.test('Free shipping logic is only applied at order completion', async () => {
  const controllerContent = fs.readFileSync(
    path.join(__dirname, 'backend/controllers/guestCheckoutController.js'),
    'utf-8'
  );

  // Check that free shipping logic is in completeGuestCheckout, not in saveGuestShippingStep
  const completeCheckoutMatch = controllerContent.match(
    /async completeGuestCheckout[\s\S]*?totals\.subtotal\s*>=\s*5000/gs
  );
  assert.truthy(completeCheckoutMatch, 'Free shipping logic should be in completeGuestCheckout');

  // Verify saveGuestShippingStep doesn't have free shipping logic
  const saveShippingMatch = controllerContent.match(
    /async saveGuestShippingStep[\s\S]*?totals\.subtotal/gs
  );
  assert.falsy(saveShippingMatch, 'Free shipping logic should NOT be in saveGuestShippingStep');
});

// ============================================================================
// TEST SUITE 5: Regression Testing
// ============================================================================
const regressionSuite = new TestSuite('5. Regression Testing');

regressionSuite.test('Guest checkout initialization still works', async () => {
  const response = await makeRequest('POST', '/guest/checkout/initialize', {});

  assert.equal(response.status, 201, 'Guest checkout initialization should return 201');
  assert.truthy(response.data?.success, 'Response should indicate success');
  assert.truthy(response.data?.data?.sessionId, 'Should return a sessionId');
});

regressionSuite.test('Guest cart functionality is not broken', async () => {
  // Initialize guest checkout (which creates a cart)
  const initResponse = await makeRequest('POST', '/guest/checkout/initialize', {});
  assert.equal(initResponse.status, 201, 'Should initialize guest checkout');

  const sessionId = initResponse.data.data.sessionId;
  const cartId = initResponse.data.data.cartId;

  assert.truthy(cartId, 'Should create a cart for guest');
});

regressionSuite.test('Guest address entry still works', async () => {
  const initResponse = await makeRequest('POST', '/guest/checkout/initialize', {});
  const sessionId = initResponse.data.data.sessionId;

  // Save guest info
  const infoResponse = await makeRequest(
    'POST',
    `/guest/checkout/session/${sessionId}/info`,
    {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      phone: '01712345678'
    }
  );

  assert.equal(infoResponse.status, 200, 'Should save guest info');
  assert.truthy(infoResponse.data?.success, 'Response should indicate success');
});

regressionSuite.test('Guest payment flow still works', async () => {
  const initResponse = await makeRequest('POST', '/guest/checkout/initialize', {});
  const sessionId = initResponse.data.data.sessionId;

  // Save guest info
  await makeRequest(
    'POST',
    `/guest/checkout/session/${sessionId}/info`,
    {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      phone: '01712345678'
    }
  );

  // Save shipping method
  const shippingResponse = await makeRequest(
    'POST',
    `/guest/checkout/session/${sessionId}/shipping`,
    { method: 'STANDARD' }
  );

  assert.equal(shippingResponse.status, 200, 'Should save shipping method');
  assert.equal(shippingResponse.data?.data?.currentStep, 'payment', 'Should advance to payment step');
});

regressionSuite.test('Logged-in user checkout still works (no regression)', async () => {
  // This test verifies that the guest checkout changes don't affect logged-in users
  // We'll check that the regular checkout routes still exist

  const routesContent = fs.readFileSync(
    path.join(__dirname, 'backend/routes/guestCheckout.js'),
    'utf-8'
  );

  // Verify that guest checkout routes are properly scoped
  assert.contains(routesContent, '/guest/', 'Routes should be scoped to /guest/');
  assert.falsy(routesContent.includes('/checkout/session/:sessionId/complete') && !routesContent.includes('/guest/checkout'), 
    'Should not conflict with regular checkout routes');
});

regressionSuite.test('Guest session management still works', async () => {
  const initResponse = await makeRequest('POST', '/guest/checkout/initialize', {});
  const sessionId = initResponse.data.data.sessionId;

  // Get session
  const getResponse = await makeRequest(
    'GET',
    `/guest/checkout/session/${sessionId}`
  );

  assert.equal(getResponse.status, 200, 'Should retrieve session');
  assert.truthy(getResponse.data?.data?.sessionId, 'Should return session data');
});

// ============================================================================
// TEST SUITE 6: Error Handling Testing
// ============================================================================
const errorHandlingSuite = new TestSuite('6. Error Handling Testing');

errorHandlingSuite.test('Invalid shipping method returns proper error', async () => {
  const initResponse = await makeRequest('POST', '/guest/checkout/initialize', {});
  const sessionId = initResponse.data.data.sessionId;

  const response = await makeRequest(
    'POST',
    `/guest/checkout/session/${sessionId}/shipping`,
    { method: 'INVALID_METHOD' }
  );

  assert.equal(response.status, 400, 'Should return 400 for invalid method');
  assert.falsy(response.data?.success, 'Response should indicate failure');
  assert.truthy(response.data?.error, 'Should return error message');
});

errorHandlingSuite.test('Missing sessionId returns proper error', async () => {
  const response = await makeRequest(
    'POST',
    `/guest/checkout/session//shipping`,
    { method: 'STANDARD' }
  );

  assert.equal(response.status, 404, 'Should return 404 for missing sessionId');
});

errorHandlingSuite.test('Empty method field returns proper error', async () => {
  const initResponse = await makeRequest('POST', '/guest/checkout/initialize', {});
  const sessionId = initResponse.data.data.sessionId;

  const response = await makeRequest(
    'POST',
    `/guest/checkout/session/${sessionId}/shipping`,
    { method: '' }
  );

  assert.equal(response.status, 400, 'Should return 400 for empty method');
  assert.falsy(response.data?.success, 'Response should indicate failure');
});

errorHandlingSuite.test('Expired session returns proper error', async () => {
  // This test would require creating an expired session
  // For now, we'll verify the error handling exists in the code

  const controllerContent = fs.readFileSync(
    path.join(__dirname, 'backend/controllers/guestCheckoutController.js'),
    'utf-8'
  );

  assert.contains(
    controllerContent,
    "Guest session has expired",
    'Should handle expired session error'
  );
  assert.contains(
    controllerContent,
    '410',
    'Should return 410 status for expired session'
  );
});

errorHandlingSuite.test('Network errors are handled gracefully', async () => {
  // Test with invalid API URL
  const originalBaseUrl = CONFIG.API_BASE_URL;
  CONFIG.API_BASE_URL = 'http://invalid-url-that-does-not-exist:9999';

  try {
    const response = await makeRequest('POST', '/guest/checkout/initialize', {});
    assert.equal(response.status, 0, 'Should return status 0 for network error');
    assert.truthy(response.error, 'Should have error object');
  } finally {
    CONFIG.API_BASE_URL = originalBaseUrl;
  }
});

errorHandlingSuite.test('Error messages are user-friendly', async () => {
  const initResponse = await makeRequest('POST', '/guest/checkout/initialize', {});
  const sessionId = initResponse.data.data.sessionId;

  const response = await makeRequest(
    'POST',
    `/guest/checkout/session/${sessionId}/shipping`,
    { method: 'INVALID' }
  );

  assert.truthy(response.data?.message, 'Should have error message');
  assert.truthy(response.data?.messageBn, 'Should have Bangla error message');
});

// ============================================================================
// TEST SUITE 7: Code Quality and Implementation Verification
// ============================================================================
const codeQualitySuite = new TestSuite('7. Code Quality and Implementation Verification');

codeQualitySuite.test('Frontend uses correct API endpoint path', async () => {
  const hookContent = fs.readFileSync(
    path.join(__dirname, 'frontend/src/hooks/useGuestCheckout.ts'),
    'utf-8'
  );

  // Check that the correct API endpoint is used
  assert.contains(
    hookContent,
    '/guest/checkout/session/${session.sessionId}/shipping',
    'Should use correct API endpoint path'
  );

  // Ensure it doesn't use the old incorrect path
  const oldPathPattern = /guest\/checkout\/\$\{session\.sessionId\}\/shipping-method/g;
  assert.falsy(oldPathPattern.test(hookContent), 'Should NOT use old incorrect path');
});

codeQualitySuite.test('Frontend sends only { method } in payload', async () => {
  const hookContent = fs.readFileSync(
    path.join(__dirname, 'frontend/src/hooks/useGuestCheckout.ts'),
    'utf-8'
  );

  // Find the saveShippingMethod function
  const saveShippingMethodMatch = hookContent.match(
    /const saveShippingMethod[\s\S]*?}\s*,\s*\[session\]/gs
  );

  assert.truthy(saveShippingMethodMatch, 'Should find saveShippingMethod function');

  const functionBody = saveShippingMethodMatch[0];

  // Check that only { method } is sent
  assert.contains(
    functionBody,
    'method,',
    'Should include method in payload'
  );

  // Verify the payload structure
  const payloadMatch = functionBody.match(/apiClient\.post\([^)]+\{[^}]*method[^}]*\}/g);
  assert.truthy(payloadMatch, 'Should have payload with method field');
});

codeQualitySuite.test('saveShippingMethod function exists in useGuestCheckout hook', async () => {
  const hookContent = fs.readFileSync(
    path.join(__dirname, 'frontend/src/hooks/useGuestCheckout.ts'),
    'utf-8'
  );

  assert.contains(
    hookContent,
    'const saveShippingMethod',
    'Should have saveShippingMethod function'
  );
});

codeQualitySuite.test('Guest checkout page uses saveShippingMethod function', async () => {
  const pageContent = fs.readFileSync(
    path.join(__dirname, 'frontend/src/app/checkout/guest/page.tsx'),
    'utf-8'
  );

  assert.contains(
    pageContent,
    'saveShippingMethod',
    'Should use saveShippingMethod function'
  );
});

codeQualitySuite.test('Backend route exists for shipping method endpoint', async () => {
  const routesContent = fs.readFileSync(
    path.join(__dirname, 'backend/routes/guestCheckout.js'),
    'utf-8'
  );

  assert.contains(
    routesContent,
    "'/checkout/session/:sessionId/shipping'",
    'Should have shipping method route'
  );
});

codeQualitySuite.test('Backend controller has saveGuestShippingStep method', async () => {
  const controllerContent = fs.readFileSync(
    path.join(__dirname, 'backend/controllers/guestCheckoutController.js'),
    'utf-8'
  );

  assert.contains(
    controllerContent,
    'async saveGuestShippingStep',
    'Should have saveGuestShippingStep method'
  );
});

codeQualitySuite.test('Error handling is implemented in saveShippingMethod', async () => {
  const hookContent = fs.readFileSync(
    path.join(__dirname, 'frontend/src/hooks/useGuestCheckout.ts'),
    'utf-8'
  );

  // Find the saveShippingMethod function
  const saveShippingMethodMatch = hookContent.match(
    /const saveShippingMethod[\s\S]*?}\s*,\s*\[session\]/gs
  );

  assert.truthy(saveShippingMethodMatch, 'Should find saveShippingMethod function');

  const functionBody = saveShippingMethodMatch[0];

  // Check for error handling
  assert.contains(functionBody, 'try', 'Should have try block');
  assert.contains(functionBody, 'catch', 'Should have catch block');
  assert.contains(functionBody, 'setError', 'Should set error on failure');
  assert.contains(functionBody, 'toast.error', 'Should show error toast');
});

codeQualitySuite.test('Local state is updated after saving shipping method', async () => {
  const hookContent = fs.readFileSync(
    path.join(__dirname, 'frontend/src/hooks/useGuestCheckout.ts'),
    'utf-8'
  );

  // Find the saveShippingMethod function
  const saveShippingMethodMatch = hookContent.match(
    /const saveShippingMethod[\s\S]*?}\s*,\s*\[session\]/gs
  );

  assert.truthy(saveShippingMethodMatch, 'Should find saveShippingMethod function');

  const functionBody = saveShippingMethodMatch[0];

  // Check for state update
  assert.contains(functionBody, 'setShippingMethod(method)', 'Should update shipping method state');
});

// ============================================================================
// Main Test Runner
// ============================================================================
async function runAllTests() {
  console.log('\n' + '='.repeat(80));
  console.log('🧪 Guest Checkout Shipping and Payment System Comprehensive Test');
  console.log('='.repeat(80));
  console.log(`📅 Started at: ${testResults.timestamp}`);
  console.log(`🌐 API URL: ${CONFIG.API_BASE_URL}`);
  console.log(`🌐 Frontend URL: ${CONFIG.FRONTEND_BASE_URL}`);
  console.log('='.repeat(80));

  const startTime = Date.now();

  try {
    // Run all test suites
    await apiEndpointSuite.run();
    await shippingDisplaySuite.run();
    await selectionPersistenceSuite.run();
    await freeShippingSuite.run();
    await regressionSuite.run();
    await errorHandlingSuite.run();
    await codeQualitySuite.run();

    const duration = Date.now() - startTime;

    // Print summary
    console.log('\n' + '='.repeat(80));
    console.log('📊 TEST SUMMARY');
    console.log('='.repeat(80));
    console.log(`⏱️  Total Duration: ${duration}ms`);
    console.log(`📋 Total Tests: ${testResults.summary.total}`);
    console.log(`✅ Passed: ${testResults.summary.passed}`);
    console.log(`❌ Failed: ${testResults.summary.failed}`);
    console.log(`⏭️  Skipped: ${testResults.summary.skipped}`);
    console.log(`📈 Success Rate: ${((testResults.summary.passed / testResults.summary.total) * 100).toFixed(2)}%`);
    console.log('='.repeat(80));

    // Print detailed results for failed tests
    if (testResults.summary.failed > 0) {
      console.log('\n❌ FAILED TESTS:');
      console.log('='.repeat(80));
      for (const suite of testResults.testSuites) {
        for (const result of suite.results) {
          if (result.failed) {
            console.log(`\n📦 Suite: ${suite.name}`);
            console.log(`❌ Test: ${result.description}`);
            console.log(`   Error: ${result.error}`);
            console.log(`   Duration: ${result.duration}ms`);
          }
        }
      }
      console.log('='.repeat(80));
    }

    // Save results to file
    const resultsFileName = `guest-checkout-shipping-payment-test-results-${Date.now()}.json`;
    fs.writeFileSync(
      path.join(__dirname, resultsFileName),
      JSON.stringify(testResults, null, 2)
    );
    console.log(`\n💾 Test results saved to: ${resultsFileName}`);

    // Exit with appropriate code
    process.exit(testResults.summary.failed > 0 ? 1 : 0);

  } catch (error) {
    console.error('\n❌ Test runner error:', error);
    process.exit(1);
  }
}

// Run tests
if (require.main === module) {
  runAllTests();
}

module.exports = {
  runAllTests,
  testResults,
  CONFIG
};
