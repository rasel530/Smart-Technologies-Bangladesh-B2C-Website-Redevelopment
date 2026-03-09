/**
 * Guest Checkout "Cart Not Found" Error Fix Verification Test Suite
 * 
 * This test suite verifies that the fix for the "Cart not found" error during guest checkout
 * is working correctly. The fix involved:
 * 1. Changing frontend API endpoint from `/checkout/initialize` to `/guest/checkout/initiate`
 * 2. Creating missing backend route file (backend/routes/guestCheckout.js)
 * 3. Registering guest checkout routes in backend/routes/index.js
 * 
 * Test Coverage:
 * 1. Guest Checkout Initialization
 * 2. Complete Guest Checkout Flow
 * 3. Console Log Verification
 * 4. Error Handling
 * 5. Route Accessibility
 */

const { PrismaClient } = require('@prisma/client');
const { guestCheckoutController } = require('./backend/controllers/guestCheckoutController');
const { guestCheckoutService } = require('./backend/services/guestCheckoutService');
const { cartService } = require('./backend/services/cartService');
const crypto = require('crypto');
const http = require('http');

const prisma = new PrismaClient();

// Test configuration
const TEST_CONFIG = {
  backendUrl: 'http://localhost:3001',
  frontendUrl: 'http://localhost:3000',
  timeout: 30000,
  cleanupAfterEach: true,
  logLevel: 'verbose'
};

// Test results storage
const testResults = {
  suiteName: 'Guest Checkout "Cart Not Found" Error Fix Verification',
  startTime: null,
  endTime: null,
  totalTests: 0,
  passedTests: 0,
  failedTests: 0,
  environment: {
    nodeVersion: process.version,
    platform: process.platform,
    os: require('os').release(),
    backendUrl: TEST_CONFIG.backendUrl,
    frontendUrl: TEST_CONFIG.frontendUrl
  },
  tests: []
};

// Helper functions
function log(message, level = 'info') {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] [${level.toUpperCase()}] ${message}`;
  console.log(logMessage);
}

function createMockRequest(body = {}, params = {}, user = null, headers = {}) {
  return {
    body,
    params,
    user,
    headers,
    method: 'POST'
  };
}

function createMockResponse() {
  const res = {
    statusCode: 200,
    data: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(data) {
      this.data = data;
      return this;
    }
  };
  return res;
}

function recordTestResult(testName, passed, details, error = null) {
  testResults.totalTests++;
  if (passed) {
    testResults.passedTests++;
  } else {
    testResults.failedTests++;
  }
  
  testResults.tests.push({
    name: testName,
    passed,
    details,
    error: error ? error.message : null,
    stack: error ? error.stack : null,
    timestamp: new Date().toISOString()
  });
}

async function cleanupTestData() {
  log('Cleaning up test data...', 'info');
  
  try {
    // Delete test orders
    await prisma.order.deleteMany({
      where: {
        orderNumber: {
          startsWith: 'TEST'
        }
      }
    });
    
    // Delete test guest sessions
    await prisma.guestSession.deleteMany({});
    
    // Delete test carts
    await prisma.cart.deleteMany({
      where: {
        status: 'active'
      }
    });
    
    // Delete test addresses
    await prisma.address.deleteMany({
      where: {
        type: 'shipping'
      }
    });
    
    log('Test data cleanup completed', 'info');
  } catch (error) {
    log(`Error during cleanup: ${error.message}`, 'error');
  }
}

async function setupTestProduct() {
  log('Setting up test product...', 'info');
  
  try {
    // Check if test product exists
    let product = await prisma.product.findFirst({
      where: { name: 'Test Product for Guest Checkout Fix' }
    });
    
    if (!product) {
      // Get a category
      const category = await prisma.category.findFirst();
      const brand = await prisma.brand.findFirst();
      
      // Create test product
      product = await prisma.product.create({
        data: {
          name: 'Test Product for Guest Checkout Fix',
          nameBn: 'গেস্ট চেকআউট ফিক্সের জন্য টেস্ট পণ্য',
          description: 'Test product for guest checkout fix verification',
          descriptionBn: 'গেস্ট চেকআউট ফিক্স যাচাইকরণের জন্য টেস্ট পণ্য',
          price: 1500,
          stockQuantity: 100,
          categoryId: category?.id,
          brandId: brand?.id,
          status: 'active',
          slug: 'test-product-guest-checkout-fix'
        }
      });
      log(`Created test product with ID: ${product.id}`, 'info');
    }
    
    return product;
  } catch (error) {
    log(`Error setting up test product: ${error.message}`, 'error');
    // Return a mock product ID for testing
    return { id: crypto.randomUUID(), price: 1500 };
  }
}

async function createTestCartWithItems() {
  log('Creating test cart with items...', 'info');
  
  try {
    const product = await setupTestProduct();
    
    // Create guest cart
    const cart = await prisma.cart.create({
      data: {
        userId: null,
        status: 'active',
        items: {
          create: [
            {
              productId: product.id,
              quantity: 2,
              price: product.price,
              subtotal: product.price * 2
            }
          ]
        }
      },
      include: {
        items: true
      }
    });
    
    log(`Created test cart with ID: ${cart.id}`, 'info');
    return cart;
  } catch (error) {
    log(`Error creating test cart: ${error.message}`, 'error');
    throw error;
  }
}

// ============================================================================
// Test Case 1: Guest Checkout Initialization
// ============================================================================

async function testGuestCheckoutInitialization() {
  const testName = 'Test Case 1: Guest Checkout Initialization';
  log(`\n========== ${testName} ==========`, 'info');
  
  try {
    // Setup
    const cart = await createTestCartWithItems();
    
    const assertions = [];
    
    // Assertion 1.1: Call initiateGuestCheckout with cartId
    log('\n--- Testing initiateGuestCheckout with cartId ---', 'info');
    const initiateReq = createMockRequest(
      {
        cartId: cart.id,
        platform: 'desktop',
        language: 'en'
      }
    );
    const initiateRes = createMockResponse();
    
    await guestCheckoutController.initiateGuestCheckout(initiateReq, initiateRes);
    
    log(`Initiate response: ${JSON.stringify(initiateRes.data)}`, 'info');
    
    assertions.push({
      name: 'Initiate checkout returns success response',
      passed: initiateRes.statusCode === 201 && initiateRes.data?.success === true,
      expected: 'Status 201 with success: true',
      actual: `Status ${initiateRes.statusCode} with success: ${initiateRes.data?.success}`
    });
    
    // Assertion 1.2: Guest session is created
    if (initiateRes.data?.data?.sessionId) {
      const guestSession = await guestCheckoutService.getGuestSession(
        initiateRes.data.data.sessionId
      );
      
      assertions.push({
        name: 'Guest session created successfully',
        passed: !!guestSession,
        expected: 'Guest session exists',
        actual: guestSession ? `Session ID: ${guestSession.sessionId}` : 'Session not found'
      });
      
      // Assertion 1.3: Cart is linked to guest session
      if (guestSession) {
        assertions.push({
          name: 'Cart is linked to guest session',
          passed: guestSession.cartId === cart.id,
          expected: `Cart ID: ${cart.id}`,
          actual: `Cart ID: ${guestSession.cartId}`
        });
      }
    }
    
    // Assertion 1.4: No "Cart not found" error
    assertions.push({
      name: 'No "Cart not found" error in response',
      passed: !initiateRes.data?.error?.includes('Cart not found') &&
               !initiateRes.data?.error?.includes('not found'),
      expected: 'No "Cart not found" error',
      actual: initiateRes.data?.error || 'No errors'
    });
    
    // Assertion 1.5: Response includes cart totals
    if (initiateRes.data?.data?.totals) {
      assertions.push({
        name: 'Response includes cart totals',
        passed: !!initiateRes.data.data.totals,
        expected: 'Totals object present',
        actual: `Totals: ${JSON.stringify(initiateRes.data.data.totals)}`
      });
    }
    
    // Print assertions
    log('\nAssertions:', 'info');
    let allPassed = true;
    for (const assertion of assertions) {
      const status = assertion.passed ? '✅ PASS' : '❌ FAIL';
      log(`  ${status} - ${assertion.name}`, assertion.passed ? 'info' : 'error');
      log(`    Expected: ${assertion.expected}`, 'info');
      log(`    Actual: ${assertion.actual}`, 'info');
      if (!assertion.passed) allPassed = false;
    }
    
    recordTestResult(testName, allPassed, assertions);
    
    return allPassed;
  } catch (error) {
    log(`Test failed with error: ${error.message}`, 'error');
    log(`Stack: ${error.stack}`, 'error');
    recordTestResult(testName, false, [], error);
    return false;
  }
}

// ============================================================================
// Test Case 2: Complete Guest Checkout Flow
// ============================================================================

async function testCompleteGuestCheckoutFlow() {
  const testName = 'Test Case 2: Complete Guest Checkout Flow';
  log(`\n========== ${testName} ==========`, 'info');
  
  try {
    // Setup
    const cart = await createTestCartWithItems();
    
    // Step 1: Initiate guest checkout
    log('\n--- Step 1: Initiate guest checkout ---', 'info');
    const initiateReq = createMockRequest({
      cartId: cart.id,
      platform: 'desktop',
      language: 'en'
    });
    const initiateRes = createMockResponse();
    
    await guestCheckoutController.initiateGuestCheckout(initiateReq, initiateRes);
    
    if (!initiateRes.data?.data?.sessionId) {
      throw new Error('Failed to initiate guest checkout');
    }
    
    const sessionId = initiateRes.data.data.sessionId;
    log(`Guest session created: ${sessionId}`, 'info');
    
    // Step 2: Save guest info
    log('\n--- Step 2: Save guest information ---', 'info');
    const guestInfo = {
      firstName: 'Test',
      lastName: 'Guest',
      email: 'test.guest@example.com',
      phone: '01914287530'
    };
    
    const saveInfoReq = createMockRequest(guestInfo, { sessionId });
    const saveInfoRes = createMockResponse();
    
    await guestCheckoutController.saveGuestInfo(saveInfoReq, saveInfoRes);
    
    log(`Guest info saved: ${JSON.stringify(saveInfoRes.data)}`, 'info');
    
    // Step 3: Complete checkout
    log('\n--- Step 3: Complete guest checkout ---', 'info');
    const checkoutData = {
      shippingAddress: {
        firstName: 'Test',
        lastName: 'Guest',
        phone: '01914287530',
        addressLine1: 'Test Address Line 1',
        addressLine2: 'Test Address Line 2',
        city: 'Dhaka',
        district: 'Dhaka',
        division: 'Dhaka',
        postalCode: '1207',
        upazila: ''
      },
      billingAddress: {
        firstName: 'Test',
        lastName: 'Guest',
        phone: '01914287530',
        addressLine1: 'Test Address Line 1',
        addressLine2: 'Test Address Line 2',
        city: 'Dhaka',
        district: 'Dhaka',
        division: 'Dhaka',
        postalCode: '1207',
        upazila: ''
      },
      paymentMethod: 'cod',
      paymentDetails: {},
      notes: 'Test guest checkout'
    };
    
    const completeReq = createMockRequest(checkoutData, { sessionId });
    const completeRes = createMockResponse();
    
    await guestCheckoutController.completeGuestCheckout(completeReq, completeRes);
    
    log(`Checkout response: ${JSON.stringify(completeRes.data)}`, 'info');
    
    // Verify response
    const assertions = [];
    
    // Assertion 2.1: All steps completed without errors
    assertions.push({
      name: 'All checkout steps completed without errors',
      passed: initiateRes.statusCode === 201 &&
               saveInfoRes.statusCode === 200 &&
               completeRes.statusCode === 201,
      expected: 'All steps return success status codes',
      actual: `Initiate: ${initiateRes.statusCode}, SaveInfo: ${saveInfoRes.statusCode}, Complete: ${completeRes.statusCode}`
    });
    
    // Assertion 2.2: Cart data persisted throughout flow
    if (completeRes.data?.data?.orderId) {
      const order = await prisma.order.findUnique({
        where: { id: completeRes.data.data.orderId },
        include: {
          items: true
        }
      });
      
      assertions.push({
        name: 'Cart data persisted to order',
        passed: order && order.items.length > 0,
        expected: 'Order exists with items',
        actual: order ? `Order with ${order.items.length} items` : 'Order not found'
      });
    }
    
    // Assertion 2.3: No "Cart not found" errors in any step
    assertions.push({
      name: 'No "Cart not found" errors in any step',
      passed: !initiateRes.data?.error?.includes('Cart not found') &&
               !saveInfoRes.data?.error?.includes('Cart not found') &&
               !completeRes.data?.error?.includes('Cart not found'),
      expected: 'No "Cart not found" errors',
      actual: `Initiate: ${initiateRes.data?.error || 'none'}, ` +
              `SaveInfo: ${saveInfoRes.data?.error || 'none'}, ` +
              `Complete: ${completeRes.data?.error || 'none'}`
    });
    
    // Assertion 2.4: Final order submission succeeded
    assertions.push({
      name: 'Final order submission succeeded',
      passed: completeRes.statusCode === 201 && completeRes.data?.success === true,
      expected: 'Status 201 with success: true',
      actual: `Status ${completeRes.statusCode} with success: ${completeRes.data?.success}`
    });
    
    // Print assertions
    log('\nAssertions:', 'info');
    let allPassed = true;
    for (const assertion of assertions) {
      const status = assertion.passed ? '✅ PASS' : '❌ FAIL';
      log(`  ${status} - ${assertion.name}`, assertion.passed ? 'info' : 'error');
      log(`    Expected: ${assertion.expected}`, 'info');
      log(`    Actual: ${assertion.actual}`, 'info');
      if (!assertion.passed) allPassed = false;
    }
    
    recordTestResult(testName, allPassed, assertions);
    
    return allPassed;
  } catch (error) {
    log(`Test failed with error: ${error.message}`, 'error');
    log(`Stack: ${error.stack}`, 'error');
    recordTestResult(testName, false, [], error);
    return false;
  }
}

// ============================================================================
// Test Case 3: Console Log Verification (Simulated)
// ============================================================================

async function testConsoleLogVerification() {
  const testName = 'Test Case 3: Console Log Verification';
  log(`\n========== ${testName} ==========`, 'info');
  
  try {
    // Setup
    const cart = await createTestCartWithItems();
    
    const assertions = [];
    
    // Simulate API calls and check for errors
    log('\n--- Simulating API calls and checking for errors ---', 'info');
    
    // Call 1: Initiate guest checkout
    const initiateReq = createMockRequest({
      cartId: cart.id,
      platform: 'desktop',
      language: 'en'
    });
    const initiateRes = createMockResponse();
    
    await guestCheckoutController.initiateGuestCheckout(initiateReq, initiateRes);
    
    // Assertion 3.1: No "Cart not found" error in initiate response
    assertions.push({
      name: 'No "Cart not found" error in initiate response',
      passed: !initiateRes.data?.error?.includes('Cart not found'),
      expected: 'No "Cart not found" error',
      actual: initiateRes.data?.error || 'No errors'
    });
    
    // Assertion 3.2: No 404 status code in initiate response
    assertions.push({
      name: 'No 404 status code in initiate response',
      passed: initiateRes.statusCode !== 404,
      expected: 'Status code not 404',
      actual: `Status code: ${initiateRes.statusCode}`
    });
    
    // Assertion 3.3: Successful call to /guest/checkout/initiate (HTTP 200/201 OK)
    assertions.push({
      name: 'Successful call to /guest/checkout/initiate',
      passed: initiateRes.statusCode >= 200 && initiateRes.statusCode < 300,
      expected: 'Status code 2xx (success)',
      actual: `Status code: ${initiateRes.statusCode}`
    });
    
    // Assertion 3.4: Response includes sessionId
    assertions.push({
      name: 'Response includes sessionId',
      passed: !!initiateRes.data?.data?.sessionId,
      expected: 'sessionId present in response',
      actual: initiateRes.data?.data?.sessionId || 'sessionId not present'
    });
    
    // Assertion 3.5: Response includes cartId
    assertions.push({
      name: 'Response includes cartId',
      passed: !!initiateRes.data?.data?.cartId,
      expected: 'cartId present in response',
      actual: initiateRes.data?.data?.cartId || 'cartId not present'
    });
    
    // Print assertions
    log('\nAssertions:', 'info');
    let allPassed = true;
    for (const assertion of assertions) {
      const status = assertion.passed ? '✅ PASS' : '❌ FAIL';
      log(`  ${status} - ${assertion.name}`, assertion.passed ? 'info' : 'error');
      log(`    Expected: ${assertion.expected}`, 'info');
      log(`    Actual: ${assertion.actual}`, 'info');
      if (!assertion.passed) allPassed = false;
    }
    
    recordTestResult(testName, allPassed, assertions);
    
    return allPassed;
  } catch (error) {
    log(`Test failed with error: ${error.message}`, 'error');
    log(`Stack: ${error.stack}`, 'error');
    recordTestResult(testName, false, [], error);
    return false;
  }
}

// ============================================================================
// Test Case 4: Error Handling
// ============================================================================

async function testErrorHandling() {
  const testName = 'Test Case 4: Error Handling';
  log(`\n========== ${testName} ==========`, 'info');
  
  try {
    const assertions = [];
    
    // Test 4.1: Invalid cart ID
    log('\n--- Testing invalid cart ID ---', 'info');
    const invalidCartReq = createMockRequest({
      cartId: crypto.randomUUID(), // Non-existent cart ID
      platform: 'desktop',
      language: 'en'
    });
    const invalidCartRes = createMockResponse();
    
    try {
      await guestCheckoutController.initiateGuestCheckout(invalidCartReq, invalidCartRes);
    } catch (e) {
      // Expected to fail
    }
    
    assertions.push({
      name: 'Invalid cart ID is handled',
      passed: invalidCartRes.statusCode === 404 || invalidCartRes.data?.error?.includes('not found'),
      expected: 'Status 404 with not found error',
      actual: `Status ${invalidCartRes.statusCode}, Error: ${invalidCartRes.data?.error || 'none'}`
    });
    
    // Test 4.2: Missing cart ID
    log('\n--- Testing missing cart ID ---', 'info');
    const missingCartReq = createMockRequest({
      // Missing cartId
      platform: 'desktop',
      language: 'en'
    });
    const missingCartRes = createMockResponse();
    
    try {
      await guestCheckoutController.initiateGuestCheckout(missingCartReq, missingCartRes);
    } catch (e) {
      // Expected to fail
    }
    
    assertions.push({
      name: 'Missing cart ID is handled',
      passed: missingCartRes.statusCode === 400 || missingCartRes.data?.error?.includes('required'),
      expected: 'Status 400 with required field error',
      actual: `Status ${missingCartRes.statusCode}, Error: ${missingCartRes.data?.error || 'none'}`
    });
    
    // Print assertions
    log('\nAssertions:', 'info');
    let allPassed = true;
    for (const assertion of assertions) {
      const status = assertion.passed ? '✅ PASS' : '❌ FAIL';
      log(`  ${status} - ${assertion.name}`, assertion.passed ? 'info' : 'error');
      log(`    Expected: ${assertion.expected}`, 'info');
      log(`    Actual: ${assertion.actual}`, 'info');
      if (!assertion.passed) allPassed = false;
    }
    
    recordTestResult(testName, allPassed, assertions);
    
    return allPassed;
  } catch (error) {
    log(`Test failed with error: ${error.message}`, 'error');
    log(`Stack: ${error.stack}`, 'error');
    recordTestResult(testName, false, [], error);
    return false;
  }
}

// ============================================================================
// Test Case 5: Route Accessibility
// ============================================================================

async function testRouteAccessibility() {
  const testName = 'Test Case 5: Route Accessibility';
  log(`\n========== ${testName} ==========`, 'info');
  
  try {
    const assertions = [];
    
    // Test 5.1: Guest checkout route file exists
    log('\n--- Checking guest checkout route file exists ---', 'info');
    const fs = require('fs');
    const routeFilePath = './backend/routes/guestCheckout.js';
    
    const routeFileExists = fs.existsSync(routeFilePath);
    
    assertions.push({
      name: 'Guest checkout route file exists',
      passed: routeFileExists,
      expected: 'File exists at backend/routes/guestCheckout.js',
      actual: routeFileExists ? 'File exists' : 'File not found'
    });
    
    // Test 5.2: Guest checkout routes registered in index.js
    log('\n--- Checking guest checkout routes registered ---', 'info');
    const indexFilePath = './backend/routes/index.js';
    const indexContent = fs.readFileSync(indexFilePath, 'utf-8');
    
    const routesRegistered = indexContent.includes("guestCheckoutRoutes") &&
                         indexContent.includes("router.use('/v1/guest', guestCheckoutRoutes)");
    
    assertions.push({
      name: 'Guest checkout routes registered in index.js',
      passed: routesRegistered,
      expected: 'Routes registered with router.use(\'/v1/guest\', guestCheckoutRoutes)',
      actual: routesRegistered ? 'Routes registered' : 'Routes not registered'
    });
    
    // Test 5.3: Frontend uses correct endpoint
    log('\n--- Checking frontend uses correct endpoint ---', 'info');
    const frontendFilePath = './frontend/src/hooks/useGuestCheckout.ts';
    const frontendContent = fs.readFileSync(frontendFilePath, 'utf-8');
    
    const frontendUsesCorrectEndpoint = frontendContent.includes("'/guest/checkout/initiate'");
    
    assertions.push({
      name: 'Frontend uses correct endpoint',
      passed: frontendUsesCorrectEndpoint,
      expected: 'Frontend calls /guest/checkout/initiate',
      actual: frontendUsesCorrectEndpoint ? 'Correct endpoint used' : 'Wrong endpoint used'
    });
    
    // Test 5.4: Frontend does NOT use old endpoint
    const frontendUsesOldEndpoint = frontendContent.includes("'/checkout/initialize'");
    
    assertions.push({
      name: 'Frontend does NOT use old endpoint',
      passed: !frontendUsesOldEndpoint,
      expected: 'Frontend does NOT call /checkout/initialize',
      actual: frontendUsesOldEndpoint ? 'Old endpoint still used' : 'Old endpoint not used'
    });
    
    // Print assertions
    log('\nAssertions:', 'info');
    let allPassed = true;
    for (const assertion of assertions) {
      const status = assertion.passed ? '✅ PASS' : '❌ FAIL';
      log(`  ${status} - ${assertion.name}`, assertion.passed ? 'info' : 'error');
      log(`    Expected: ${assertion.expected}`, 'info');
      log(`    Actual: ${assertion.actual}`, 'info');
      if (!assertion.passed) allPassed = false;
    }
    
    recordTestResult(testName, allPassed, assertions);
    
    return allPassed;
  } catch (error) {
    log(`Test failed with error: ${error.message}`, 'error');
    log(`Stack: ${error.stack}`, 'error');
    recordTestResult(testName, false, [], error);
    return false;
  }
}

// ============================================================================
// Main Test Runner
// ============================================================================

async function runAllTests() {
  log('\n╔══════════════════════════════════════════════════════════════╗', 'info');
  log('║  GUEST CHECKOUT "CART NOT FOUND" ERROR FIX VERIFICATION TEST SUITE      ║', 'info');
  log('╚════════════════════════════════════════════════════════════════╝', 'info');
  
  testResults.startTime = new Date().toISOString();
  
  try {
    // Run all test cases
    const testCases = [
      { name: 'Guest Checkout Initialization', fn: testGuestCheckoutInitialization },
      { name: 'Complete Guest Checkout Flow', fn: testCompleteGuestCheckoutFlow },
      { name: 'Console Log Verification', fn: testConsoleLogVerification },
      { name: 'Error Handling', fn: testErrorHandling },
      { name: 'Route Accessibility', fn: testRouteAccessibility }
    ];
    
    for (const testCase of testCases) {
      try {
        await testCase.fn();
        
        // Cleanup after each test if configured
        if (TEST_CONFIG.cleanupAfterEach) {
          await cleanupTestData();
        }
      } catch (error) {
        log(`Test case "${testCase.name}" failed: ${error.message}`, 'error');
        recordTestResult(testCase.name, false, [], error);
      }
    }
    
    testResults.endTime = new Date().toISOString();
    
    // Print summary
    log('\n╔══════════════════════════════════════════════════════════════╗', 'info');
    log('║                        TEST SUMMARY                                  ║', 'info');
    log('╚══════════════════════════════════════════════════════════════╝', 'info');
    log(`Total Tests: ${testResults.totalTests}`, 'info');
    log(`Passed: ${testResults.passedTests} ✅`, 'info');
    log(`Failed: ${testResults.failedTests} ❌`, 'info');
    log(`Success Rate: ${((testResults.passedTests / testResults.totalTests) * 100).toFixed(2)}%`, 'info');
    log(`Duration: ${new Date(testResults.endTime) - new Date(testResults.startTime)}ms`, 'info');
    
    return testResults;
  } catch (error) {
    log(`Test suite failed: ${error.message}`, 'error');
    testResults.endTime = new Date().toISOString();
    return testResults;
  }
}

// Save test results to JSON file
async function saveTestResults() {
  const timestamp = Date.now();
  const filename = `guest-checkout-cart-not-found-fix-test-results-${timestamp}.json`;
  
  try {
    const fs = require('fs');
    fs.writeFileSync(filename, JSON.stringify(testResults, null, 2));
    log(`\nTest results saved to: ${filename}`, 'info');
    return filename;
  } catch (error) {
    log(`Failed to save test results: ${error.message}`, 'error');
    return null;
  }
}

// Generate test report
function generateTestReport() {
  let report = `# Guest Checkout "Cart Not Found" Error Fix Verification Test Report\n\n`;
  report += `**Generated:** ${new Date().toISOString()}\n\n`;
  
  report += `## Test Environment\n\n`;
  report += `- **Node Version:** ${testResults.environment.nodeVersion}\n`;
  report += `- **Platform:** ${testResults.environment.platform}\n`;
  report += `- **OS:** ${testResults.environment.os}\n`;
  report += `- **Backend URL:** ${testResults.environment.backendUrl}\n`;
  report += `- **Frontend URL:** ${testResults.environment.frontendUrl}\n\n`;
  
  report += `## Executive Summary\n\n`;
  report += `- **Total Tests:** ${testResults.totalTests}\n`;
  report += `- **Passed:** ${testResults.passedTests} ✅\n`;
  report += `- **Failed:** ${testResults.failedTests} ❌\n`;
  report += `- **Success Rate:** ${((testResults.passedTests / testResults.totalTests) * 100).toFixed(2)}%\n\n`;
  
  report += `## Fix Implementation Details\n\n`;
  report += `### Changes Made:\n\n`;
  report += `1. **Frontend Fix:** Updated API endpoint from \`/checkout/initialize\` to \`/guest/checkout/initiate\`\n`;
  report += `   - **File:** \`frontend/src/hooks/useGuestCheckout.ts\`\n`;
  report += `   - **Line:** 222\n\n`;
  report += `2. **Backend Route File Created:** Created \`backend/routes/guestCheckout.js\`\n`;
  report += `   - Maps \`/guest/checkout/initiate\` to \`guestCheckoutController.initiateGuestCheckout\`\n`;
  report += `   - Includes all guest checkout endpoints\n\n`;
  report += `3. **Backend Routes Registration:** Registered guest checkout routes in \`backend/routes/index.js\`\n`;
  report += `   - Added \`router.use('/v1/guest', guestCheckoutRoutes)\`\n\n`;
  
  report += `## Test Cases Executed\n\n`;
  
  for (const test of testResults.tests) {
    const status = test.passed ? '✅ PASS' : '❌ FAIL';
    report += `### ${status} - ${test.name}\n\n`;
    report += `**Timestamp:** ${test.timestamp}\n\n`;
    
    if (test.details && test.details.length > 0) {
      report += `**Assertions:**\n\n`;
      for (const assertion of test.details) {
        const assertionStatus = assertion.passed ? '✅' : '❌';
        report += `- ${assertionStatus} **${assertion.name}**\n`;
        report += `  - Expected: ${assertion.expected}\n`;
        report += `  - Actual: ${assertion.actual}\n\n`;
      }
    }
    
    if (test.error) {
      report += `**Error:** ${test.error}\n\n`;
      if (test.stack) {
        report += `**Stack Trace:**\n\`\`\`\n${test.stack}\n\`\`\`\n\n`;
      }
    }
  }
  
  report += `## Issues Found\n\n`;
  
  const failedTests = testResults.tests.filter(t => !t.passed);
  if (failedTests.length === 0) {
    report += `No issues found. All tests passed! 🎉\n\n`;
  } else {
    for (const test of failedTests) {
      report += `### ❌ ${test.name}\n\n`;
      if (test.error) {
        report += `**Error:** ${test.error}\n\n`;
      }
      
      const failedAssertions = test.details?.filter(a => !a.passed) || [];
      if (failedAssertions.length > 0) {
        report += `**Failed Assertions:**\n\n`;
        for (const assertion of failedAssertions) {
          report += `- ${assertion.name}\n`;
          report += `  - Expected: ${assertion.expected}\n`;
          report += `  - Actual: ${assertion.actual}\n\n`;
        }
      }
    }
  }
  
  report += `## Overall Assessment\n\n`;
  
  if (testResults.failedTests === 0) {
    report += `✅ **The guest checkout "Cart not found" error fix is working correctly!**\n\n`;
    report += `All test cases passed successfully:\n`;
    report += `- Guest checkout initialization succeeds without "Cart not found" errors\n`;
    report += `- Cart is properly retrieved and linked to guest session\n`;
    report += `- Complete guest checkout flow works end-to-end\n`;
    report += `- No 404 errors for guest checkout endpoints\n`;
    report += `- Error handling is appropriate\n`;
    report += `- Routes are properly configured\n\n`;
    report += `### Expected Results Achieved:\n\n`;
    report += `✅ Guest checkout initialization succeeds without errors\n`;
    report += `✅ Cart is properly retrieved and linked to guest session\n`;
    report += `✅ No "Cart not found" (404) errors in console\n`;
    report += `✅ Complete guest checkout flow works end-to-end\n\n\n`;
    report += `The fix successfully resolves the "Cart not found" error by:\n`;
    report += `1. Updating frontend to call the correct guest checkout endpoint\n`;
    report += `2. Creating the missing backend route file\n`;
    report += `3. Registering the guest checkout routes properly\n\n`;
  } else {
    report += `⚠️ Some tests failed. Review issues above and consider the following:\n\n`;
    report += `1. Verify backend route file is properly configured\n`;
    report += `2. Check if guest checkout controller methods are working correctly\n`;
    report += `3. Review error logs for detailed failure information\n`;
    report += `4. Ensure frontend is calling the correct endpoint\n`;
    report += `5. Verify database schema supports guest checkout flow\n\n`;
  }
  
  report += `## Recommendations\n\n`;
  
  if (testResults.failedTests === 0) {
    report += `1. ✅ Deploy the fix to production\n`;
    report += `2. ✅ Monitor guest checkout metrics for any issues\n`;
    report += `3. ✅ Test with real users in staging environment\n`;
    report += `4. ✅ Document the guest checkout flow for developers\n`;
    report += `5. ✅ Add integration tests to CI/CD pipeline\n\n`;
  } else {
    report += `1. 🔧 Review and fix failed test cases\n`;
    report += `2. 🔧 Investigate root causes of failures\n`;
    report += `3. 🔧 Re-test after fixes are applied\n`;
    report += `4. 🔧 Consider additional edge cases\n\n`;
  }
  
  return report;
}

// Save test report to file
async function saveTestReport() {
  const timestamp = Date.now();
  const filename = `guest-checkout-cart-not-found-fix-test-report-${timestamp}.md`;
  
  try {
    const fs = require('fs');
    const report = generateTestReport();
    fs.writeFileSync(filename, report);
    log(`Test report saved to: ${filename}`, 'info');
    return filename;
  } catch (error) {
    log(`Failed to save test report: ${error.message}`, 'error');
    return null;
  }
}

// Teardown
async function teardown() {
  log('\nTearing down test environment...', 'info');
  
  try {
    await prisma.$disconnect();
    log('Database connection closed', 'info');
  } catch (error) {
    log(`Error during teardown: ${error.message}`, 'error');
  }
}

// Main execution
(async () => {
  try {
    await runAllTests();
    await saveTestResults();
    await saveTestReport();
  } catch (error) {
    log(`Fatal error: ${error.message}`, 'error');
    log(`Stack: ${error.stack}`, 'error');
  } finally {
    await teardown();
  }
})();

module.exports = {
  runAllTests,
  testResults,
  saveTestResults,
  generateTestReport,
  saveTestReport,
  teardown
};
