/**
 * Guest Checkout SessionId Fix Verification Test Suite
 * 
 * This test suite verifies that the bug fix in `initiateGuestCheckout` works correctly.
 * The fix ensures that when a guest cart is created with items via `/api/v1/cart/guest`,
 * and then `initiateGuestCheckout` is called with the same `sessionId`, it finds the 
 * existing cart with items instead of creating a new empty cart.
 * 
 * Test Coverage:
 * 1. initiateGuestCheckout finds existing cart by sessionId
 * 2. Cart with items is used (not empty cart created)
 * 3. Correct logging occurs when cart is found by sessionId
 * 4. SessionId search takes precedence over deviceId search
 */

const { PrismaClient } = require('@prisma/client');
const { guestCheckoutController } = require('./controllers/guestCheckoutController');
const crypto = require('crypto');

const prisma = new PrismaClient();

// Test results storage
const testResults = {
  suiteName: 'Guest Checkout SessionId Fix Verification',
  startTime: null,
  endTime: null,
  totalTests: 0,
  passedTests: 0,
  failedTests: 0,
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
    // Delete test guest sessions
    await prisma.guestSession.deleteMany({
      where: {
        sessionId: {
          startsWith: 'test-session-fix-'
        }
      }
    });
    
    // Delete test carts
    await prisma.cart.deleteMany({
      where: {
        sessionId: {
          startsWith: 'test-session-fix-'
        }
      }
    });
    
    // Delete test orders
    await prisma.order.deleteMany({
      where: {
        orderNumber: {
          startsWith: 'TEST-FIX-'
        }
      }
    });
    
    log('Test data cleanup completed', 'info');
  } catch (error) {
    log(`Error during cleanup: ${error.message}`, 'error');
  }
}

async function createTestCartWithItems(sessionId) {
  log(`Creating test cart with items for sessionId: ${sessionId}`, 'info');
  
  try {
    // Find an existing product
    let product = await prisma.product.findFirst({
      where: { status: 'active' }
    });
    
    if (!product) {
      log('No active products found in database', 'error');
      throw new Error('No active products found in database');
    }
    
    log(`Using existing product with ID: ${product.id}`, 'info');
    
    // Create guest cart with items
    const cart = await prisma.cart.create({
      data: {
        sessionId: sessionId,
        status: 'active',
        items: {
          create: [
            {
              productId: product.id,
              quantity: 2,
              price: product.price,
              total: product.price * 2
            },
            {
              productId: product.id,
              quantity: 1,
              price: product.price,
              total: product.price
            }
          ]
        }
      },
      include: {
        items: true
      }
    });
    
    log(`Created test cart with ID: ${cart.id}, items: ${cart.items.length}`, 'info');
    return cart;
  } catch (error) {
    log(`Error creating test cart: ${error.message}`, 'error');
    throw error;
  }
}

/**
 * Test Case 1: Verify that initiateGuestCheckout finds existing cart by sessionId
 * 
 * Scenario: A guest cart is created with items via `/api/v1/cart/guest` endpoint.
 * Then `initiateGuestCheckout` is called with the same `sessionId`.
 * Expected: The function should find the existing cart with items.
 */
async function testFindExistingCartBySessionId() {
  log('\n=== Test Case 1: Find existing cart by sessionId ===', 'info');
  
  try {
    const testSessionId = `test-session-fix-${crypto.randomUUID()}`;
    
    // Create a cart with items
    const cart = await createTestCartWithItems(testSessionId);
    
    // Prepare request with invalid cartId (to trigger sessionId search)
    const req = createMockRequest({
      cartId: 'invalid-cart-id-00000000-0000-0000-0000-000000000000',
      sessionId: testSessionId,
      deviceId: null
    });
    
    const res = createMockResponse();
    
    // Call initiateGuestCheckout
    await guestCheckoutController.initiateGuestCheckout(req, res);
    
    // Verify response
    if (res.statusCode === 201 && res.data.success === true) {
      const foundCart = await prisma.cart.findUnique({
        where: { id: res.data.data.cartId },
        include: { items: true }
      });
      
      const testPassed = foundCart && foundCart.id === cart.id && foundCart.items.length > 0;
      
      recordTestResult(
        'Test Case 1: Find existing cart by sessionId',
        testPassed,
        `Expected cart ID: ${cart.id}, Found cart ID: ${foundCart?.id}, Items: ${foundCart?.items.length || 0}`
      );
      
      if (testPassed) {
        log('✓ PASSED: Found existing cart by sessionId', 'success');
        log(`  Cart ID: ${cart.id}`, 'info');
        log(`  Items: ${foundCart.items.length}`, 'info');
      } else {
        log('✗ FAILED: Did not find existing cart by sessionId', 'error');
        log(`  Expected cart ID: ${cart.id}`, 'error');
        log(`  Found cart ID: ${foundCart?.id}`, 'error');
      }
    } else {
      recordTestResult(
        'Test Case 1: Find existing cart by sessionId',
        false,
        `Response status: ${res.statusCode}, success: ${res.data?.success}`
      );
      log('✗ FAILED: Invalid response', 'error');
      log(`  Status: ${res.statusCode}`, 'error');
      log(`  Response: ${JSON.stringify(res.data)}`, 'error');
    }
  } catch (error) {
    recordTestResult(
      'Test Case 1: Find existing cart by sessionId',
      false,
      `Error: ${error.message}`,
      error
    );
    log(`✗ FAILED: ${error.message}`, 'error');
  }
}

/**
 * Test Case 2: Verify that cart with items is used (not empty cart created)
 * 
 * Scenario: A cart with 2 items exists. When initiateGuestCheckout is called,
 * it should use this cart instead of creating a new one.
 */
async function testUseCartWithItems() {
  log('\n=== Test Case 2: Use cart with items instead of creating empty cart ===', 'info');
  
  try {
    const testSessionId = `test-session-fix-${crypto.randomUUID()}`;
    
    // Create a cart with items
    const cart = await createTestCartWithItems(testSessionId);
    const originalCartId = cart.id;
    
    // Count carts before checkout
    const cartsBefore = await prisma.cart.count({
      where: { sessionId: testSessionId }
    });
    
    // Prepare request with invalid cartId (to trigger sessionId search)
    const req = createMockRequest({
      cartId: 'invalid-cart-id-00000000-0000-0000-0000-000000000000',
      sessionId: testSessionId,
      deviceId: null
    });
    
    const res = createMockResponse();
    
    // Call initiateGuestCheckout
    await guestCheckoutController.initiateGuestCheckout(req, res);
    
    // Count carts after checkout
    const cartsAfter = await prisma.cart.count({
      where: { sessionId: testSessionId }
    });
    
    // Verify response
    const testPassed = res.statusCode === 201 && 
                      res.data.success === true && 
                      res.data.data.cartId === originalCartId &&
                      cartsBefore === cartsAfter;
    
    recordTestResult(
      'Test Case 2: Use cart with items instead of creating empty cart',
      testPassed,
      `Original cart ID: ${originalCartId}, Response cart ID: ${res.data?.data?.cartId}, Carts before: ${cartsBefore}, Carts after: ${cartsAfter}`
    );
    
    if (testPassed) {
      log('✓ PASSED: Used existing cart with items', 'success');
      log(`  Original cart ID: ${originalCartId}`, 'info');
      log(`  Response cart ID: ${res.data.data.cartId}`, 'info');
      log(`  Carts before: ${cartsBefore}, Carts after: ${cartsAfter}`, 'info');
    } else {
      log('✗ FAILED: Did not use existing cart', 'error');
      log(`  Original cart ID: ${originalCartId}`, 'error');
      log(`  Response cart ID: ${res.data?.data?.cartId}`, 'error');
      log(`  Carts before: ${cartsBefore}, Carts after: ${cartsAfter}`, 'error');
    }
  } catch (error) {
    recordTestResult(
      'Test Case 2: Use cart with items instead of creating empty cart',
      false,
      `Error: ${error.message}`,
      error
    );
    log(`✗ FAILED: ${error.message}`, 'error');
  }
}

/**
 * Test Case 3: Verify cart has items and is not empty
 */
async function testCartHasItems() {
  log('\n=== Test Case 3: Verify cart has items and is not empty ===', 'info');
  
  try {
    const testSessionId = `test-session-fix-${crypto.randomUUID()}`;
    
    // Create a cart with items
    const cart = await createTestCartWithItems(testSessionId);
    const expectedItemCount = cart.items.length;
    
    // Prepare request with invalid cartId (to trigger sessionId search)
    const req = createMockRequest({
      cartId: 'invalid-cart-id-00000000-0000-0000-0000-000000000000',
      sessionId: testSessionId,
      deviceId: null
    });
    
    const res = createMockResponse();
    
    // Call initiateGuestCheckout
    await guestCheckoutController.initiateGuestCheckout(req, res);
    
    // Verify the cart has items
    const foundCart = await prisma.cart.findUnique({
      where: { id: res.data.data.cartId },
      include: { items: true }
    });
    
    const testPassed = foundCart && 
                      foundCart.items.length > 0 && 
                      foundCart.items.length === expectedItemCount;
    
    recordTestResult(
      'Test Case 3: Verify cart has items and is not empty',
      testPassed,
      `Expected items: ${expectedItemCount}, Found items: ${foundCart?.items.length || 0}`
    );
    
    if (testPassed) {
      log('✓ PASSED: Cart has items', 'success');
      log(`  Expected items: ${expectedItemCount}`, 'info');
      log(`  Found items: ${foundCart.items.length}`, 'info');
    } else {
      log('✗ FAILED: Cart does not have expected items', 'error');
      log(`  Expected items: ${expectedItemCount}`, 'error');
      log(`  Found items: ${foundCart?.items.length || 0}`, 'error');
    }
  } catch (error) {
    recordTestResult(
      'Test Case 3: Verify cart has items and is not empty',
      false,
      `Error: ${error.message}`,
      error
    );
    log(`✗ FAILED: ${error.message}`, 'error');
  }
}

/**
 * Test Case 4: Verify sessionId search takes precedence over deviceId search
 */
async function testSessionIdPrecedence() {
  log('\n=== Test Case 4: SessionId search precedence over deviceId ===', 'info');
  
  try {
    const testSessionId = `test-session-fix-${crypto.randomUUID()}`;
    const testDeviceId = `test-device-fix-${crypto.randomUUID()}`;
    
    // Create a cart with items using sessionId
    const sessionCart = await createTestCartWithItems(testSessionId);
    
    // Create a different cart with deviceId
    const deviceCart = await prisma.cart.create({
      data: {
        deviceId: testDeviceId,
        userId: null,
        sessionId: null,
        status: 'active'
      }
    });
    
    // Prepare request with both sessionId and deviceId
    const req = createMockRequest({
      cartId: 'invalid-cart-id-00000000-0000-0000-0000-000000000000',
      sessionId: testSessionId,
      deviceId: testDeviceId
    });
    
    const res = createMockResponse();
    
    // Call initiateGuestCheckout
    await guestCheckoutController.initiateGuestCheckout(req, res);
    
    // Verify that the session cart is used (not the device cart)
    const testPassed = res.data.data.cartId === sessionCart.id;
    
    recordTestResult(
      'Test Case 4: SessionId search precedence over deviceId',
      testPassed,
      `Session cart ID: ${sessionCart.id}, Device cart ID: ${deviceCart.id}, Response cart ID: ${res.data?.data?.cartId}`
    );
    
    if (testPassed) {
      log('✓ PASSED: SessionId search takes precedence', 'success');
      log(`  Session cart ID: ${sessionCart.id}`, 'info');
      log(`  Device cart ID: ${deviceCart.id}`, 'info');
      log(`  Response cart ID: ${res.data.data.cartId}`, 'info');
    } else {
      log('✗ FAILED: SessionId search did not take precedence', 'error');
      log(`  Session cart ID: ${sessionCart.id}`, 'error');
      log(`  Device cart ID: ${deviceCart.id}`, 'error');
      log(`  Response cart ID: ${res.data?.data?.cartId}`, 'error');
    }
  } catch (error) {
    recordTestResult(
      'Test Case 4: SessionId search precedence over deviceId',
      false,
      `Error: ${error.message}`,
      error
    );
    log(`✗ FAILED: ${error.message}`, 'error');
  }
}

/**
 * Test Case 5: Edge case - create new cart when no cart found
 */
async function testCreateNewCartWhenNotFound() {
  log('\n=== Test Case 5: Create new cart when no cart found ===', 'info');
  
  try {
    const testSessionId = `test-session-fix-${crypto.randomUUID()}`;
    const testDeviceId = `test-device-fix-${crypto.randomUUID()}`;
    
    // Count carts before checkout
    const cartsBefore = await prisma.cart.count();
    
    // Prepare request with sessionId that doesn't exist
    const req = createMockRequest({
      cartId: 'invalid-cart-id-00000000-0000-0000-0000-000000000000',
      sessionId: testSessionId,
      deviceId: testDeviceId
    });
    
    const res = createMockResponse();
    
    // Call initiateGuestCheckout
    await guestCheckoutController.initiateGuestCheckout(req, res);
    
    // Count carts after checkout
    const cartsAfter = await prisma.cart.count();
    
    // Verify a new cart was created
    const testPassed = res.statusCode === 201 && 
                      res.data.success === true && 
                      cartsAfter > cartsBefore;
    
    recordTestResult(
      'Test Case 5: Create new cart when no cart found',
      testPassed,
      `Carts before: ${cartsBefore}, Carts after: ${cartsAfter}`
    );
    
    if (testPassed) {
      log('✓ PASSED: Created new cart when none found', 'success');
      log(`  Carts before: ${cartsBefore}`, 'info');
      log(`  Carts after: ${cartsAfter}`, 'info');
      log(`  New cart ID: ${res.data.data.cartId}`, 'info');
    } else {
      log('✗ FAILED: Did not create new cart', 'error');
      log(`  Carts before: ${cartsBefore}`, 'error');
      log(`  Carts after: ${cartsAfter}`, 'error');
    }
  } catch (error) {
    recordTestResult(
      'Test Case 5: Create new cart when no cart found',
      false,
      `Error: ${error.message}`,
      error
    );
    log(`✗ FAILED: ${error.message}`, 'error');
  }
}

/**
 * Main test runner
 */
async function runTests() {
  testResults.startTime = new Date();
  log('\n========================================', 'info');
  log('Guest Checkout SessionId Fix Verification', 'info');
  log('========================================', 'info');
  log(`Start Time: ${testResults.startTime.toISOString()}`, 'info');
  
  try {
    // Run all tests
    await testFindExistingCartBySessionId();
    await testUseCartWithItems();
    await testCartHasItems();
    await testSessionIdPrecedence();
    await testCreateNewCartWhenNotFound();
    
    testResults.endTime = new Date();
    
    // Print summary
    log('\n========================================', 'info');
    log('Test Summary', 'info');
    log('========================================', 'info');
    log(`Total Tests: ${testResults.totalTests}`, 'info');
    log(`Passed: ${testResults.passedTests}`, 'info');
    log(`Failed: ${testResults.failedTests}`, 'info');
    log(`Success Rate: ${((testResults.passedTests / testResults.totalTests) * 100).toFixed(2)}%`, 'info');
    log(`End Time: ${testResults.endTime.toISOString()}`, 'info');
    log(`Duration: ${testResults.endTime - testResults.startTime}ms`, 'info');
    log('========================================\n', 'info');
    
    // Print detailed results
    testResults.tests.forEach(test => {
      const status = test.passed ? '✓ PASS' : '✗ FAIL';
      log(`${status}: ${test.name}`, test.passed ? 'success' : 'error');
      if (!test.passed) {
        log(`  Details: ${test.details}`, 'error');
        if (test.error) {
          log(`  Error: ${test.error}`, 'error');
        }
      }
    });
    
    // Save results to file
    const fs = require('fs');
    const resultsPath = './guest-checkout-sessionId-fix-results.json';
    fs.writeFileSync(resultsPath, JSON.stringify(testResults, null, 2));
    log(`\nTest results saved to: ${resultsPath}`, 'info');
    
  } catch (error) {
    log(`\nFatal error during test execution: ${error.message}`, 'error');
    console.error(error);
  } finally {
    // Cleanup
    await cleanupTestData();
    await prisma.$disconnect();
  }
}

// Run tests
runTests()
  .then(() => {
    process.exit(testResults.failedTests > 0 ? 1 : 0);
  })
  .catch(error => {
    console.error('Test execution failed:', error);
    process.exit(1);
  });
