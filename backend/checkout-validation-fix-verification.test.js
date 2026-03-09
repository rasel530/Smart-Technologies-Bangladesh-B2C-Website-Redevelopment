/**
 * CHECKOUT VALIDATION FIX VERIFICATION TEST SUITE
 *
 * This test suite verifies the checkout validation fix implemented in checkoutService.js
 * 
 * Context:
 * - The fix addresses the issue where checkout validation failed when data was in request body
 * - Original issue: validateCheckoutStep only checked session data, not request body data
 * - Fix implemented with:
 *   1. Updated validateCheckoutStep function signature to accept optional checkoutData parameter
 *   2. Modified review step validation to check BOTH session data AND request body data
 *   3. Updated completeCheckoutSession to pass checkoutData to validation
 *   4. Added diagnostic logging
 *
 * Test Scenarios Covered:
 * 1. Verify validateCheckoutStep accepts checkoutData parameter
 * 2. Verify review step validation checks both session and request data
 * 3. Verify validation passes when data is in request body
 * 4. Verify validation passes when data is in session (existing behavior)
 * 5. Verify diagnostic logging shows data flow
 * 6. Verify order can be completed successfully with request body data
 */

const { PrismaClient } = require('@prisma/client');
const { checkoutService } = require('./services/checkoutService');
const { cartService } = require('./services/cartService');
const { loggerService } = require('./services/logger');

// Configuration
const TEST_USER = {
  email: `test-validation-fix-${Date.now()}@example.com`,
  password: 'Test123!',
  firstName: 'Validation',
  lastName: 'Test',
  phone: `01${Math.floor(Math.random() * 9000000000) + 1000000000}`
};

// Test results storage
const testResults = {
  test1: {
    name: 'Test 1: Verify validateCheckoutStep accepts checkoutData parameter',
    description: 'Verify function signature includes optional checkoutData parameter',
    steps: [],
    passed: false,
    errors: []
  },
  test2: {
    name: 'Test 2: Verify review step validation checks both session and request data',
    description: 'Verify validation logic checks multiple data sources',
    steps: [],
    passed: false,
    errors: []
  },
  test3: {
    name: 'Test 3: Verify validation passes when data is in request body',
    description: 'Verify checkout validation succeeds with data in request body only',
    steps: [],
    passed: false,
    errors: []
  },
  test4: {
    name: 'Test 4: Verify validation passes when data is in session',
    description: 'Verify existing behavior still works (data in session)',
    steps: [],
    passed: false,
    errors: []
  },
  test5: {
    name: 'Test 5: Verify diagnostic logging shows data flow',
    description: 'Verify logs show which data sources are being validated',
    steps: [],
    passed: false,
    errors: []
  },
  test6: {
    name: 'Test 6: Verify order can be completed with request body data',
    description: 'Verify completeCheckoutSession works with request body data',
    steps: [],
    passed: false,
    errors: []
  }
};

let prisma = null;
let testUserId = null;
let testCartId = null;
let testCheckoutSessionId = null;
let testProductId = null;
let createdOrderId = null;
let logMessages = [];

// Mock logger to capture log messages
const mockLogger = {
  info: (message, data) => {
    logMessages.push({ level: 'info', message, data });
    console.log(`[INFO] ${message}`, data ? JSON.stringify(data) : '');
  },
  warn: (message, data) => {
    logMessages.push({ level: 'warn', message, data });
    console.warn(`[WARN] ${message}`, data ? JSON.stringify(data) : '');
  },
  error: (message, data) => {
    logMessages.push({ level: 'error', message, data });
    console.error(`[ERROR] ${message}`, data ? JSON.stringify(data) : '');
  },
  debug: (message, data) => {
    logMessages.push({ level: 'debug', message, data });
    console.debug(`[DEBUG] ${message}`, data ? JSON.stringify(data) : '');
  }
};

/**
 * Setup test environment
 */
async function setupTestEnvironment() {
  console.log('\n=== Setting up test environment ===\n');
  
  try {
    prisma = new PrismaClient();
    
    // Create test user
    const user = await prisma.user.create({
      data: {
        email: TEST_USER.email,
        password: TEST_USER.password,
        firstName: TEST_USER.firstName,
        lastName: TEST_USER.lastName,
        phone: TEST_USER.phone,
        role: 'customer',
        status: 'active',
        accountStatus: 'active'
      }
    });
    testUserId = user.id;
    console.log(`✓ Created test user: ${user.id}`);
    
    // Create test product
    const category = await prisma.category.findFirst();
    const brand = await prisma.brand.findFirst();
    
    const product = await prisma.product.create({
      data: {
        name: `Test Product ${Date.now()}`,
        nameEn: `Test Product ${Date.now()}`,
        nameBn: 'টেস্ট পণ্য',
        slug: `test-product-${Date.now()}`,
        shortDescription: 'Test product short description',
        description: 'Test product for validation verification',
        sku: `SKU-${Date.now()}`,
        regularPrice: 1000,
        salePrice: null,
        costPrice: 500,
        stockQuantity: 100,
        lowStockThreshold: 10,
        status: 'active',
        visibility: 'public',
        warrantyPeriod: 12,
        warrantyType: 'Manufacturer Warranty',
        categories: category ? {
          create: {
            categoryId: category.id
          }
        } : undefined,
        brandId: brand?.id || null
      }
    });
    testProductId = product.id;
    console.log(`✓ Created test product: ${product.id}`);
    
    // Create cart for user
    const cart = await prisma.cart.create({
      data: {
        userId: testUserId,
        status: 'active'
      }
    });
    testCartId = cart.id;
    console.log(`✓ Created test cart: ${cart.id}`);
    
    // Add item to cart
    await prisma.cartItem.create({
      data: {
        cartId: testCartId,
        productId: testProductId,
        quantity: 1,
        price: 1000,
        subtotal: 1000
      }
    });
    console.log(`✓ Added item to cart`);
    
    // Create checkout session
    const checkoutSession = await prisma.checkoutSession.create({
      data: {
        id: crypto.randomUUID(),
        userId: testUserId,
        cartId: testCartId,
        currentStep: 'review',
        status: 'active',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        progress: {
          steps: {
            address: { completed: true, startedAt: new Date().toISOString(), completedAt: new Date().toISOString() },
            shipping: { completed: true, startedAt: new Date().toISOString(), completedAt: new Date().toISOString() },
            payment: { completed: true, startedAt: new Date().toISOString(), completedAt: new Date().toISOString() },
            review: { completed: false, startedAt: null, completedAt: null }
          }
        },
        stepData: {
          address: {
            shippingAddressId: null,
            shippingAddress: null
          },
          shipping: {
            method: null
          },
          payment: {
            method: null
          }
        },
        metadata: {
          createdAt: new Date().toISOString()
        }
      }
    });
    testCheckoutSessionId = checkoutSession.id;
    console.log(`✓ Created test checkout session: ${checkoutSession.id}`);
    
    console.log('\n✓ Test environment setup complete\n');
    return true;
  } catch (error) {
    console.error('✗ Setup failed:', error);
    return false;
  }
}

/**
 * Cleanup test environment
 */
async function cleanupTestEnvironment() {
  console.log('\n=== Cleaning up test environment ===\n');
  
  try {
    if (createdOrderId) {
      await prisma.order.deleteMany({ where: { id: createdOrderId } });
      console.log(`✓ Deleted test order`);
    }
    
    if (testCheckoutSessionId) {
      await prisma.checkoutSession.deleteMany({ where: { id: testCheckoutSessionId } });
      console.log(`✓ Deleted test checkout session`);
    }
    
    if (testCartId) {
      await prisma.cartItem.deleteMany({ where: { cartId: testCartId } });
      await prisma.cart.deleteMany({ where: { id: testCartId } });
      console.log(`✓ Deleted test cart`);
    }
    
    if (testProductId) {
      await prisma.product.deleteMany({ where: { id: testProductId } });
      console.log(`✓ Deleted test product`);
    }
    
    if (testUserId) {
      await prisma.user.deleteMany({ where: { id: testUserId } });
      console.log(`✓ Deleted test user`);
    }
    
    await prisma.$disconnect();
    console.log('\n✓ Cleanup complete\n');
  } catch (error) {
    console.error('✗ Cleanup failed:', error);
  }
}

/**
 * Test 1: Verify validateCheckoutStep accepts checkoutData parameter
 */
async function test1_ValidateCheckoutStepSignature() {
  console.log('\n--- Test 1: Verify validateCheckoutStep accepts checkoutData parameter ---\n');
  
  try {
    const step = 'Test 1: Check function signature';
    testResults.test1.steps.push(step);
    
    // Get the function definition
    const service = new (require('./services/checkoutService').CheckoutService)();
    const functionString = service.validateCheckoutStep.toString();
    
    // Check if function accepts checkoutData parameter
    const hasCheckoutDataParam = functionString.includes('checkoutData') || 
                               functionString.match(/validateCheckoutStep\s*\([^)]*checkoutData/);
    
    if (hasCheckoutDataParam) {
      console.log('✓ validateCheckoutStep function accepts checkoutData parameter');
      testResults.test1.passed = true;
    } else {
      console.log('✗ validateCheckoutStep function does NOT accept checkoutData parameter');
      testResults.test1.errors.push('Function signature missing checkoutData parameter');
    }
    
    // Check if default value is null
    const hasDefaultValue = functionString.includes('checkoutData = null') || 
                          functionString.includes('checkoutData=null');
    
    if (hasDefaultValue) {
      console.log('✓ checkoutData parameter has default value of null');
    } else {
      console.log('⚠ checkoutData parameter may not have default value');
    }
    
    return testResults.test1.passed;
  } catch (error) {
    testResults.test1.errors.push(error.message);
    console.error('✗ Test 1 failed:', error);
    return false;
  }
}

/**
 * Test 2: Verify review step validation checks both session and request data
 */
async function test2_ReviewStepValidationChecksBothSources() {
  console.log('\n--- Test 2: Verify review step validation checks both session and request data ---\n');
  
  try {
    const step = 'Test 2: Check validation logic';
    testResults.test2.steps.push(step);
    
    const service = new (require('./services/checkoutService').CheckoutService)();
    const functionString = service.validateCheckoutStep.toString();
    
    // Check if validation checks checkoutData for address
    const checksCheckoutDataAddress = functionString.includes('checkoutData?.address?.shippingAddress');
    
    // Check if validation checks checkoutData for shipping method
    const checksCheckoutDataShipping = functionString.includes('checkoutData?.shipping?.method');
    
    // Check if validation checks checkoutData for payment method
    const checksCheckoutDataPayment = functionString.includes('checkoutData?.payment?.method');
    
    if (checksCheckoutDataAddress && checksCheckoutDataShipping && checksCheckoutDataPayment) {
      console.log('✓ Review step validation checks checkoutData for address, shipping, and payment');
      testResults.test2.passed = true;
    } else {
      if (!checksCheckoutDataAddress) {
        console.log('✗ Review step validation does NOT check checkoutData for address');
        testResults.test2.errors.push('Missing checkoutData address check');
      }
      if (!checksCheckoutDataShipping) {
        console.log('✗ Review step validation does NOT check checkoutData for shipping method');
        testResults.test2.errors.push('Missing checkoutData shipping check');
      }
      if (!checksCheckoutDataPayment) {
        console.log('✗ Review step validation does NOT check checkoutData for payment method');
        testResults.test2.errors.push('Missing checkoutData payment check');
      }
    }
    
    return testResults.test2.passed;
  } catch (error) {
    testResults.test2.errors.push(error.message);
    console.error('✗ Test 2 failed:', error);
    return false;
  }
}

/**
 * Test 3: Verify validation passes when data is in request body
 */
async function test3_ValidationPassesWithRequestBodyData() {
  console.log('\n--- Test 3: Verify validation passes when data is in request body ---\n');
  
  try {
    const step = 'Test 3: Validate with request body data';
    testResults.test3.steps.push(step);
    
    const service = new (require('./services/checkoutService').CheckoutService)();
    
    // Prepare checkout data in request body (simulating frontend request)
    const checkoutData = {
      address: {
        shippingAddress: {
          firstName: 'Test',
          lastName: 'User',
          phone: '01712345678',
          addressLine1: '123 Test Street',
          addressLine2: 'Apt 4B',
          city: 'Dhaka',
          district: 'Dhaka',
          postalCode: '1000',
          country: 'Bangladesh'
        }
      },
      shipping: {
        method: 'STANDARD'
      },
      payment: {
        method: 'CASH_ON_DELIVERY'
      }
    };
    
    console.log('Calling validateCheckoutStep with checkoutData...');
    const validation = await service.validateCheckoutStep(testCheckoutSessionId, 'review', checkoutData);
    
    if (validation.isValid) {
      console.log('✓ Validation passed with data in request body');
      testResults.test3.passed = true;
    } else {
      console.log('✗ Validation failed with data in request body');
      console.log('Errors:', validation.errors);
      testResults.test3.errors.push(...validation.errors);
    }
    
    return testResults.test3.passed;
  } catch (error) {
    testResults.test3.errors.push(error.message);
    console.error('✗ Test 3 failed:', error);
    return false;
  }
}

/**
 * Test 4: Verify validation passes when data is in session (existing behavior)
 */
async function test4_ValidationPassesWithSessionData() {
  console.log('\n--- Test 4: Verify validation passes when data is in session ---\n');
  
  try {
    const step = 'Test 4: Validate with session data';
    testResults.test4.steps.push(step);
    
    // Update checkout session with data in stepData
    await prisma.checkoutSession.update({
      where: { id: testCheckoutSessionId },
      data: {
        stepData: {
          address: {
            shippingAddress: {
              firstName: 'Test',
              lastName: 'User',
              phone: '01712345678',
              addressLine1: '123 Test Street',
              addressLine2: 'Apt 4B',
              city: 'Dhaka',
              district: 'Dhaka',
              postalCode: '1000',
              country: 'Bangladesh'
            }
          },
          shipping: {
            method: 'STANDARD'
          },
          payment: {
            method: 'CASH_ON_DELIVERY'
          }
        }
      }
    });
    
    const service = new (require('./services/checkoutService').CheckoutService)();
    
    console.log('Calling validateCheckoutStep without checkoutData (using session data)...');
    const validation = await service.validateCheckoutStep(testCheckoutSessionId, 'review', null);
    
    if (validation.isValid) {
      console.log('✓ Validation passed with data in session');
      testResults.test4.passed = true;
    } else {
      console.log('✗ Validation failed with data in session');
      console.log('Errors:', validation.errors);
      testResults.test4.errors.push(...validation.errors);
    }
    
    return testResults.test4.passed;
  } catch (error) {
    testResults.test4.errors.push(error.message);
    console.error('✗ Test 4 failed:', error);
    return false;
  }
}

/**
 * Test 5: Verify diagnostic logging shows data flow
 */
async function test5_DiagnosticLoggingShowsDataFlow() {
  console.log('\n--- Test 5: Verify diagnostic logging shows data flow ---\n');
  
  try {
    const step = 'Test 5: Check diagnostic logs';
    testResults.test5.steps.push(step);
    
    const service = new (require('./services/checkoutService').CheckoutService)();
    const originalLogger = service.logger;
    
    // Replace logger with mock
    service.logger = mockLogger;
    
    // Clear previous log messages
    logMessages = [];
    
    const checkoutData = {
      address: {
        shippingAddress: {
          firstName: 'Test',
          lastName: 'User',
          phone: '01712345678',
          addressLine1: '123 Test Street',
          city: 'Dhaka',
          district: 'Dhaka',
          postalCode: '1000',
          country: 'Bangladesh'
        }
      },
      shipping: {
        method: 'STANDARD'
      },
      payment: {
        method: 'CASH_ON_DELIVERY'
      }
    };
    
    console.log('Calling validateCheckoutStep to generate logs...');
    await service.validateCheckoutStep(testCheckoutSessionId, 'review', checkoutData);
    
    // Restore original logger
    service.logger = originalLogger;
    
    // Check for diagnostic log messages
    const hasCheckoutDataDetailsLog = logMessages.some(log => 
      log.message.includes('checkoutData details') || 
      log.message.includes('Review validation - checkoutData details')
    );
    
    const hasAddressValidationLog = logMessages.some(log => 
      log.message.includes('Address validation details')
    );
    
    const hasValidationCompletedLog = logMessages.some(log => 
      log.message.includes('Step validation completed')
    );
    
    if (hasCheckoutDataDetailsLog) {
      console.log('✓ Found checkoutData details log');
      testResults.test5.passed = true;
    } else {
      console.log('✗ Missing checkoutData details log');
      testResults.test5.errors.push('Missing checkoutData diagnostic log');
    }
    
    if (hasAddressValidationLog) {
      console.log('✓ Found address validation details log');
    } else {
      console.log('⚠ Missing address validation details log');
    }
    
    if (hasValidationCompletedLog) {
      console.log('✓ Found validation completed log');
    } else {
      console.log('⚠ Missing validation completed log');
    }
    
    // Print sample logs
    console.log('\nSample log messages:');
    logMessages.slice(0, 5).forEach(log => {
      console.log(`  [${log.level.toUpperCase()}] ${log.message}`);
    });
    
    return testResults.test5.passed;
  } catch (error) {
    testResults.test5.errors.push(error.message);
    console.error('✗ Test 5 failed:', error);
    return false;
  }
}

/**
 * Test 6: Verify order can be completed with request body data
 */
async function test6_OrderCompletesWithRequestBodyData() {
  console.log('\n--- Test 6: Verify order can be completed with request body data ---\n');
  
  try {
    const step = 'Test 6: Complete checkout with request body data';
    testResults.test6.steps.push(step);
    
    // Reset checkout session to have empty stepData
    await prisma.checkoutSession.update({
      where: { id: testCheckoutSessionId },
      data: {
        stepData: {
          address: {
            shippingAddressId: null,
            shippingAddress: null
          },
          shipping: {
            method: null
          },
          payment: {
            method: null
          }
        }
      }
    });
    
    const service = new (require('./services/checkoutService').CheckoutService)();
    const originalLogger = service.logger;
    service.logger = mockLogger;
    
    // Clear previous log messages
    logMessages = [];
    
    // Prepare checkout data in request body
    const checkoutData = {
      address: {
        shippingAddress: {
          firstName: 'Test',
          lastName: 'User',
          phone: '01712345678',
          addressLine1: '123 Test Street',
          addressLine2: 'Apt 4B',
          city: 'Dhaka',
          district: 'Dhaka',
          postalCode: '1000',
          country: 'Bangladesh'
        }
      },
      shipping: {
        method: 'STANDARD'
      },
      payment: {
        method: 'CASH_ON_DELIVERY'
      }
    };
    
    console.log('Calling completeCheckoutSession with checkoutData...');
    try {
      const order = await service.completeCheckoutSession(testCheckoutSessionId, checkoutData);
      
      if (order && order.id) {
        createdOrderId = order.id;
        console.log(`✓ Order created successfully: ${order.id}`);
        console.log(`✓ Order number: ${order.orderNumber}`);
        testResults.test6.passed = true;
      } else {
        console.log('✗ Order creation returned unexpected result');
        testResults.test6.errors.push('Order creation returned invalid result');
      }
    } catch (error) {
      console.log(`✗ Order completion failed: ${error.message}`);
      testResults.test6.errors.push(error.message);
    }
    
    // Restore original logger
    service.logger = originalLogger;
    
    // Check for diagnostic logs
    const hasCompleteCheckoutLog = logMessages.some(log => 
      log.message.includes('Completing checkout session')
    );
    
    const hasAddressDataDetailsLog = logMessages.some(log => 
      log.message.includes('Address data details')
    );
    
    if (hasCompleteCheckoutLog) {
      console.log('✓ Found completeCheckoutSession diagnostic log');
    } else {
      console.log('⚠ Missing completeCheckoutSession diagnostic log');
    }
    
    if (hasAddressDataDetailsLog) {
      console.log('✓ Found address data details log');
    } else {
      console.log('⚠ Missing address data details log');
    }
    
    return testResults.test6.passed;
  } catch (error) {
    testResults.test6.errors.push(error.message);
    console.error('✗ Test 6 failed:', error);
    return false;
  }
}

/**
 * Run all tests
 */
async function runAllTests() {
  console.log('╔════════════════════════════════════════════════════════════════╗');
  console.log('║  CHECKOUT VALIDATION FIX VERIFICATION TEST SUITE               ║');
  console.log('╚════════════════════════════════════════════════════════════════╝\n');
  
  const setupSuccess = await setupTestEnvironment();
  if (!setupSuccess) {
    console.error('✗ Test environment setup failed. Aborting tests.');
    return;
  }
  
  // Run tests
  await test1_ValidateCheckoutStepSignature();
  await test2_ReviewStepValidationChecksBothSources();
  await test3_ValidationPassesWithRequestBodyData();
  await test4_ValidationPassesWithSessionData();
  await test5_DiagnosticLoggingShowsDataFlow();
  await test6_OrderCompletesWithRequestBodyData();
  
  // Cleanup
  await cleanupTestEnvironment();
  
  // Print results
  printTestResults();
  
  // Save results to file
  saveTestResults();
}

/**
 * Print test results
 */
function printTestResults() {
  console.log('\n╔════════════════════════════════════════════════════════════════╗');
  console.log('║  TEST RESULTS SUMMARY                                              ║');
  console.log('╚════════════════════════════════════════════════════════════════╝\n');
  
  const totalTests = Object.keys(testResults).length;
  const passedTests = Object.values(testResults).filter(t => t.passed).length;
  const failedTests = totalTests - passedTests;
  
  console.log(`Total Tests: ${totalTests}`);
  console.log(`Passed: ${passedTests}`);
  console.log(`Failed: ${failedTests}\n`);
  
  Object.keys(testResults).forEach(key => {
    const test = testResults[key];
    const status = test.passed ? '✓ PASS' : '✗ FAIL';
    console.log(`${status} - ${test.name}`);
    if (test.errors.length > 0) {
      test.errors.forEach(error => {
        console.log(`  ✗ ${error}`);
      });
    }
  });
  
  console.log('\n');
}

/**
 * Save test results to file
 */
function saveTestResults() {
  const results = {
    timestamp: new Date().toISOString(),
    summary: {
      total: Object.keys(testResults).length,
      passed: Object.values(testResults).filter(t => t.passed).length,
      failed: Object.values(testResults).filter(t => !t.passed).length
    },
    tests: testResults
  };
  
  const filename = `checkout-validation-fix-verification-results-${Date.now()}.json`;
  const fs = require('fs');
  fs.writeFileSync(filename, JSON.stringify(results, null, 2));
  console.log(`✓ Test results saved to: ${filename}`);
}

// Run tests
runAllTests().then(() => {
  process.exit(0);
}).catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
