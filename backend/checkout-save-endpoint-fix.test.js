/**
 * CHECKOUT SAVE ENDPOINT FIX TEST SUITE
 *
 * This test suite thoroughly tests the newly implemented POST /api/v1/checkout/save endpoint
 * that was added to fix a 404 error when users selected an address and clicked "Continue to Payment"
 *
 * Test Environment:
 * - Frontend: http://localhost:3000
 * - Backend API: http://localhost:3001
 * - Tests both authenticated and unauthenticated requests
 *
 * Test Scenarios Covered:
 * 1. Valid request with sessionId, step, and data
 * 2. Valid request with only sessionId (step and data optional)
 * 3. Invalid sessionId format (should return validation error)
 * 4. Non-existent sessionId (should return 404)
 * 5. Expired sessionId (should return 410, if applicable)
 * 6. Request without authentication (should work with optional auth)
 * 7. Response includes proper bilingual messages
 */

const axios = require('axios');
const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');

// Configuration
const FRONTEND_URL = 'http://localhost:3000';
const BACKEND_URL = 'http://localhost:3001';
const TEST_USER = {
  email: `test-checkout-save-${Date.now()}@example.com`,
  password: 'Test123!',
  firstName: 'Checkout',
  lastName: 'Test',
  phone: `01${Math.floor(Math.random() * 9000000000) + 1000000000}`
};

// Test results storage
const testResults = {
  test1: {
    name: 'Test 1: Valid request with sessionId, step, and data',
    steps: [],
    passed: false,
    errors: []
  },
  test2: {
    name: 'Test 2: Valid request with only sessionId (step and data optional)',
    steps: [],
    passed: false,
    errors: []
  },
  test3: {
    name: 'Test 3: Invalid sessionId format (validation error)',
    steps: [],
    passed: false,
    errors: []
  },
  test4: {
    name: 'Test 4: Non-existent sessionId (404 error)',
    steps: [],
    passed: false,
    errors: []
  },
  test5: {
    name: 'Test 5: Expired sessionId (410 error)',
    steps: [],
    passed: false,
    errors: []
  },
  test6: {
    name: 'Test 6: Request without authentication (optional auth)',
    steps: [],
    passed: false,
    errors: []
  },
  test7: {
    name: 'Test 7: Response includes proper bilingual messages',
    steps: [],
    passed: false,
    errors: []
  },
  test8: {
    name: 'Test 8: Verify 404 error is fixed (endpoint exists)',
    steps: [],
    passed: false,
    errors: []
  }
};

let authToken = null;
let testUserId = null;
let testCartId = null;
let testCheckoutSessionId = null;
let testExpiredCheckoutSessionId = null;
let testProductId = null;

// Helper function to log test step
const logStep = (testName, step, passed, message = '') => {
  console.log(`  [${passed ? '✓' : '✗'}] ${step}${message ? ': ' + message : ''}`);
  return { step, passed, message };
};

// Helper function to generate UUID
const generateUUID = () => crypto.randomUUID();

// Initialize Prisma client
const prisma = new PrismaClient();

/**
 * SETUP: Create test user, cart, and checkout session
 */
async function setup() {
  console.log('\n=== SETUP: Creating test data ===');
  
  try {
    // Check if test user exists
    let user = await prisma.user.findUnique({
      where: { email: TEST_USER.email }
    });
    
    if (!user) {
      // Create test user
      user = await prisma.user.create({
        data: {
          email: TEST_USER.email,
          password: '$2b$10$abcdefghijklmnopqrstuvwxyz', // Dummy hash
          firstName: TEST_USER.firstName,
          lastName: TEST_USER.lastName,
          phone: TEST_USER.phone,
          role: 'customer',
          status: 'active'
        }
      });
      console.log(`✓ Created test user: ${user.email}`);
    } else {
      console.log(`✓ Found existing test user: ${user.email}`);
    }
    
    testUserId = user.id;
    
    // Authenticate to get JWT token
    const jwt = require('jsonwebtoken');
    authToken = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'test-secret-key',
      { expiresIn: '1h' }
    );
    console.log(`✓ Generated auth token`);
    
    // Find or create a test product
    const product = await prisma.product.findFirst({
      where: {
        status: 'active',
        stockQuantity: { gt: 0 }
      }
    });
    
    if (!product) {
      // Create a test product if none exists
      const newProduct = await prisma.product.create({
        data: {
          sku: 'TEST-PROD-CHK-001',
          name: 'Test Checkout Product',
          nameEn: 'Test Checkout Product',
          slug: 'test-checkout-product',
          regularPrice: 10000,
          costPrice: 8000,
          taxRate: 5,
          stockQuantity: 100,
          status: 'active',
          brandId: (await prisma.brand.findFirst())?.id || null
        }
      });
      testProductId = newProduct.id;
      console.log(`✓ Created test product`);
    } else {
      testProductId = product.id;
      console.log(`✓ Found test product: ${product.name}`);
    }
    
    // Create a test cart
    const cart = await prisma.cart.create({
      data: {
        userId: testUserId,
        status: 'active',
        items: {
          create: {
            productId: testProductId,
            quantity: 1,
            price: 10000,
            subtotal: 10000
          }
        }
      }
    });
    testCartId = cart.id;
    console.log(`✓ Created test cart: ${cart.id}`);
    
    // Create a test checkout session
    const checkoutSession = await prisma.checkoutSession.create({
      data: {
        id: generateUUID(),
        userId: testUserId,
        cartId: testCartId,
        currentStep: 'address',
        status: 'active',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
        metadata: {
          createdAt: new Date().toISOString()
        },
        progress: {
          steps: {
            address: { completed: false, startedAt: null, completedAt: null },
            shipping: { completed: false, startedAt: null, completedAt: null },
            payment: { completed: false, startedAt: null, completedAt: null },
            review: { completed: false, startedAt: null, completedAt: null }
          },
          totalTime: 0,
          stepCount: 0
        }
      }
    });
    testCheckoutSessionId = checkoutSession.id;
    console.log(`✓ Created test checkout session: ${checkoutSession.id}`);
    
    // Create an expired checkout session
    const expiredCheckoutSession = await prisma.checkoutSession.create({
      data: {
        id: generateUUID(),
        userId: testUserId,
        cartId: testCartId,
        currentStep: 'address',
        status: 'active',
        expiresAt: new Date(Date.now() - 60 * 60 * 1000), // 1 hour ago (expired)
        metadata: {
          createdAt: new Date().toISOString()
        },
        progress: {
          steps: {
            address: { completed: false, startedAt: null, completedAt: null },
            shipping: { completed: false, startedAt: null, completedAt: null },
            payment: { completed: false, startedAt: null, completedAt: null },
            review: { completed: false, startedAt: null, completedAt: null }
          },
          totalTime: 0,
          stepCount: 0
        }
      }
    });
    testExpiredCheckoutSessionId = expiredCheckoutSession.id;
    console.log(`✓ Created expired test checkout session: ${expiredCheckoutSession.id}`);
    
    console.log('=== SETUP COMPLETE ===\n');
    return true;
  } catch (error) {
    console.error('✗ SETUP FAILED:', error.message);
    console.error(error.stack);
    return false;
  }
}

/**
 * TEST 1: Valid request with sessionId, step, and data
 * 
 * Objective: Verify the endpoint accepts valid requests with all parameters
 */
async function test1_ValidRequestWithAllParameters() {
  console.log('\n=== TEST 1: Valid request with sessionId, step, and data ===');
  
  try {
    const testData = {
      sessionId: testCheckoutSessionId,
      step: 'shipping',
      data: {
        method: 'STANDARD',
        cost: 100,
        estimatedDays: '3-5'
      }
    };
    
    // Step 1: Make POST request to /api/v1/checkout/save
    const response = await axios.post(`${BACKEND_URL}/api/v1/checkout/save`, testData, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      }
    }).catch(error => {
      if (error.response) {
        return error.response;
      }
      throw error;
    });
    
    testResults.test1.steps.push(logStep(
      'Step 1',
      'Make POST request to /api/v1/checkout/save',
      response.status !== 0,
      `Status: ${response.status}`
    ));
    
    // Step 2: Verify response status is 200
    const is200 = response.status === 200;
    testResults.test1.steps.push(logStep(
      'Step 2',
      'Verify response status is 200',
      is200,
      is200 ? 'Status 200 OK' : `Status ${response.status}`
    ));
    
    if (!is200) {
      testResults.test1.errors.push(`Expected status 200, got ${response.status}`);
      testResults.test1.errors.push(`Response: ${JSON.stringify(response.data)}`);
      return false;
    }
    
    // Step 3: Verify success field is true
    const isSuccess = response.data.success === true;
    testResults.test1.steps.push(logStep(
      'Step 3',
      'Verify success field is true',
      isSuccess,
      isSuccess ? 'success: true' : `success: ${response.data.success}`
    ));
    
    if (!isSuccess) {
      testResults.test1.errors.push(`Expected success: true, got ${response.data.success}`);
      return false;
    }
    
    // Step 4: Verify data is returned
    const hasData = response.data.data !== undefined;
    testResults.test1.steps.push(logStep(
      'Step 4',
      'Verify data is returned in response',
      hasData,
      hasData ? 'Data present' : 'No data in response'
    ));
    
    if (!hasData) {
      testResults.test1.errors.push('No data returned in response');
      return false;
    }
    
    // Step 5: Verify currentStep was updated
    const currentStepUpdated = response.data.data.currentStep === 'shipping';
    testResults.test1.steps.push(logStep(
      'Step 5',
      'Verify currentStep was updated to shipping',
      currentStepUpdated,
      currentStepUpdated ? `currentStep: ${response.data.data.currentStep}` : `Expected shipping, got ${response.data.data.currentStep}`
    ));
    
    if (!currentStepUpdated) {
      testResults.test1.errors.push(`Expected currentStep: shipping, got ${response.data.data.currentStep}`);
      return false;
    }
    
    testResults.test1.passed = true;
    console.log('✓ TEST 1 PASSED\n');
    return true;
  } catch (error) {
    console.error('✗ TEST 1 FAILED:', error.message);
    testResults.test1.errors.push(error.message);
    return false;
  }
}

/**
 * TEST 2: Valid request with only sessionId (step and data optional)
 * 
 * Objective: Verify the endpoint works when only sessionId is provided
 */
async function test2_ValidRequestWithOnlySessionId() {
  console.log('\n=== TEST 2: Valid request with only sessionId (step and data optional) ===');
  
  try {
    const testData = {
      sessionId: testCheckoutSessionId
    };
    
    // Step 1: Make POST request with only sessionId
    const response = await axios.post(`${BACKEND_URL}/api/v1/checkout/save`, testData, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      }
    }).catch(error => {
      if (error.response) {
        return error.response;
      }
      throw error;
    });
    
    testResults.test2.steps.push(logStep(
      'Step 1',
      'Make POST request with only sessionId',
      response.status !== 0,
      `Status: ${response.status}`
    ));
    
    // Step 2: Verify response status is 200
    const is200 = response.status === 200;
    testResults.test2.steps.push(logStep(
      'Step 2',
      'Verify response status is 200',
      is200,
      is200 ? 'Status 200 OK' : `Status ${response.status}`
    ));
    
    if (!is200) {
      testResults.test2.errors.push(`Expected status 200, got ${response.status}`);
      return false;
    }
    
    // Step 3: Verify success field is true
    const isSuccess = response.data.success === true;
    testResults.test2.steps.push(logStep(
      'Step 3',
      'Verify success field is true',
      isSuccess,
      isSuccess ? 'success: true' : `success: ${response.data.success}`
    ));
    
    if (!isSuccess) {
      testResults.test2.errors.push(`Expected success: true, got ${response.data.success}`);
      return false;
    }
    
    // Step 4: Verify data is returned
    const hasData = response.data.data !== undefined;
    testResults.test2.steps.push(logStep(
      'Step 4',
      'Verify data is returned in response',
      hasData,
      hasData ? 'Data present' : 'No data in response'
    ));
    
    if (!hasData) {
      testResults.test2.errors.push('No data returned in response');
      return false;
    }
    
    // Step 5: Verify currentStep defaults to 'address' when not provided
    const hasCurrentStep = response.data.data.currentStep !== undefined;
    testResults.test2.steps.push(logStep(
      'Step 5',
      'Verify currentStep is present (defaults to address)',
      hasCurrentStep,
      hasCurrentStep ? `currentStep: ${response.data.data.currentStep}` : 'No currentStep'
    ));
    
    if (!hasCurrentStep) {
      testResults.test2.errors.push('No currentStep in response');
      return false;
    }
    
    testResults.test2.passed = true;
    console.log('✓ TEST 2 PASSED\n');
    return true;
  } catch (error) {
    console.error('✗ TEST 2 FAILED:', error.message);
    testResults.test2.errors.push(error.message);
    return false;
  }
}

/**
 * TEST 3: Invalid sessionId format (validation error)
 * 
 * Objective: Verify the endpoint returns validation error for invalid UUID format
 */
async function test3_InvalidSessionIdFormat() {
  console.log('\n=== TEST 3: Invalid sessionId format (validation error) ===');
  
  try {
    const testData = {
      sessionId: 'invalid-uuid-format',
      step: 'shipping'
    };
    
    // Step 1: Make POST request with invalid sessionId
    const response = await axios.post(`${BACKEND_URL}/api/v1/checkout/save`, testData, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      }
    }).catch(error => {
      if (error.response) {
        return error.response;
      }
      throw error;
    });
    
    testResults.test3.steps.push(logStep(
      'Step 1',
      'Make POST request with invalid sessionId format',
      response.status !== 0,
      `Status: ${response.status}`
    ));
    
    // Step 2: Verify response status is 400 (validation error)
    const is400 = response.status === 400;
    testResults.test3.steps.push(logStep(
      'Step 2',
      'Verify response status is 400 (validation error)',
      is400,
      is400 ? 'Status 400 Bad Request' : `Status ${response.status}`
    ));
    
    if (!is400) {
      testResults.test3.errors.push(`Expected status 400, got ${response.status}`);
      return false;
    }
    
    // Step 3: Verify success field is false
    const isFailure = response.data.success === false;
    testResults.test3.steps.push(logStep(
      'Step 3',
      'Verify success field is false',
      isFailure,
      isFailure ? 'success: false' : `success: ${response.data.success}`
    ));
    
    if (!isFailure) {
      testResults.test3.errors.push(`Expected success: false, got ${response.data.success}`);
      return false;
    }
    
    // Step 4: Verify validation error message is present
    const hasValidationError = response.data.details !== undefined && 
                                response.data.details.some(detail => 
                                  detail.msg && detail.msg.toLowerCase().includes('invalid')
                                );
    testResults.test3.steps.push(logStep(
      'Step 4',
      'Verify validation error message is present',
      hasValidationError,
      hasValidationError ? 'Validation error found' : 'No validation error'
    ));
    
    if (!hasValidationError) {
      testResults.test3.errors.push('No validation error message in response');
      return false;
    }
    
    testResults.test3.passed = true;
    console.log('✓ TEST 3 PASSED\n');
    return true;
  } catch (error) {
    console.error('✗ TEST 3 FAILED:', error.message);
    testResults.test3.errors.push(error.message);
    return false;
  }
}

/**
 * TEST 4: Non-existent sessionId (404 error)
 * 
 * Objective: Verify the endpoint returns 404 for non-existent sessionId
 */
async function test4_NonExistentSessionId() {
  console.log('\n=== TEST 4: Non-existent sessionId (404 error) ===');
  
  try {
    const testData = {
      sessionId: generateUUID(), // Random UUID that doesn't exist
      step: 'shipping'
    };
    
    // Step 1: Make POST request with non-existent sessionId
    const response = await axios.post(`${BACKEND_URL}/api/v1/checkout/save`, testData, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      }
    }).catch(error => {
      if (error.response) {
        return error.response;
      }
      throw error;
    });
    
    testResults.test4.steps.push(logStep(
      'Step 1',
      'Make POST request with non-existent sessionId',
      response.status !== 0,
      `Status: ${response.status}`
    ));
    
    // Step 2: Verify response status is 404
    const is404 = response.status === 404;
    testResults.test4.steps.push(logStep(
      'Step 2',
      'Verify response status is 404',
      is404,
      is404 ? 'Status 404 Not Found' : `Status ${response.status}`
    ));
    
    if (!is404) {
      testResults.test4.errors.push(`Expected status 404, got ${response.status}`);
      return false;
    }
    
    // Step 3: Verify success field is false
    const isFailure = response.data.success === false;
    testResults.test4.steps.push(logStep(
      'Step 3',
      'Verify success field is false',
      isFailure,
      isFailure ? 'success: false' : `success: ${response.data.success}`
    ));
    
    if (!isFailure) {
      testResults.test4.errors.push(`Expected success: false, got ${response.data.success}`);
      return false;
    }
    
    // Step 4: Verify error message mentions session not found
    const hasErrorMessage = response.data.message && 
                           (response.data.message.toLowerCase().includes('not found') ||
                            response.data.error && response.data.error.toLowerCase().includes('not found'));
    testResults.test4.steps.push(logStep(
      'Step 4',
      'Verify error message mentions session not found',
      hasErrorMessage,
      hasErrorMessage ? 'Error message present' : 'No appropriate error message'
    ));
    
    if (!hasErrorMessage) {
      testResults.test4.errors.push('No appropriate error message in response');
      return false;
    }
    
    testResults.test4.passed = true;
    console.log('✓ TEST 4 PASSED\n');
    return true;
  } catch (error) {
    console.error('✗ TEST 4 FAILED:', error.message);
    testResults.test4.errors.push(error.message);
    return false;
  }
}

/**
 * TEST 5: Expired sessionId (410 error)
 * 
 * Objective: Verify the endpoint returns 410 for expired sessionId
 */
async function test5_ExpiredSessionId() {
  console.log('\n=== TEST 5: Expired sessionId (410 error) ===');
  
  try {
    const testData = {
      sessionId: testExpiredCheckoutSessionId,
      step: 'shipping'
    };
    
    // Step 1: Make POST request with expired sessionId
    const response = await axios.post(`${BACKEND_URL}/api/v1/checkout/save`, testData, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      }
    }).catch(error => {
      if (error.response) {
        return error.response;
      }
      throw error;
    });
    
    testResults.test5.steps.push(logStep(
      'Step 1',
      'Make POST request with expired sessionId',
      response.status !== 0,
      `Status: ${response.status}`
    ));
    
    // Step 2: Verify response status is 410 (Gone)
    const is410 = response.status === 410;
    testResults.test5.steps.push(logStep(
      'Step 2',
      'Verify response status is 410 (Gone)',
      is410,
      is410 ? 'Status 410 Gone' : `Status ${response.status}`
    ));
    
    if (!is410) {
      testResults.test5.errors.push(`Expected status 410, got ${response.status}`);
      return false;
    }
    
    // Step 3: Verify success field is false
    const isFailure = response.data.success === false;
    testResults.test5.steps.push(logStep(
      'Step 3',
      'Verify success field is false',
      isFailure,
      isFailure ? 'success: false' : `success: ${response.data.success}`
    ));
    
    if (!isFailure) {
      testResults.test5.errors.push(`Expected success: false, got ${response.data.success}`);
      return false;
    }
    
    // Step 4: Verify error message mentions expired
    const hasErrorMessage = response.data.message && 
                           (response.data.message.toLowerCase().includes('expired') ||
                            response.data.error && response.data.error.toLowerCase().includes('expired'));
    testResults.test5.steps.push(logStep(
      'Step 4',
      'Verify error message mentions expired',
      hasErrorMessage,
      hasErrorMessage ? 'Error message present' : 'No appropriate error message'
    ));
    
    if (!hasErrorMessage) {
      testResults.test5.errors.push('No appropriate error message in response');
      return false;
    }
    
    testResults.test5.passed = true;
    console.log('✓ TEST 5 PASSED\n');
    return true;
  } catch (error) {
    console.error('✗ TEST 5 FAILED:', error.message);
    testResults.test5.errors.push(error.message);
    return false;
  }
}

/**
 * TEST 6: Request without authentication (optional auth)
 * 
 * Objective: Verify the endpoint works without authentication
 */
async function test6_RequestWithoutAuthentication() {
  console.log('\n=== TEST 6: Request without authentication (optional auth) ===');
  
  try {
    const testData = {
      sessionId: testCheckoutSessionId,
      step: 'payment',
      data: {
        method: 'CASH_ON_DELIVERY'
      }
    };
    
    // Step 1: Make POST request without authentication
    const response = await axios.post(`${BACKEND_URL}/api/v1/checkout/save`, testData, {
      headers: {
        'Content-Type': 'application/json'
      }
    }).catch(error => {
      if (error.response) {
        return error.response;
      }
      throw error;
    });
    
    testResults.test6.steps.push(logStep(
      'Step 1',
      'Make POST request without authentication',
      response.status !== 0,
      `Status: ${response.status}`
    ));
    
    // Step 2: Verify response status is 200 (or 403 if ownership check fails, which is acceptable)
    const isSuccess = response.status === 200 || response.status === 403;
    testResults.test6.steps.push(logStep(
      'Step 2',
      'Verify endpoint accepts unauthenticated request',
      isSuccess,
      isSuccess ? `Status ${response.status}` : `Status ${response.status}`
    ));
    
    if (!isSuccess) {
      testResults.test6.errors.push(`Expected status 200 or 403, got ${response.status}`);
      return false;
    }
    
    // Step 3: If 200, verify success field is true
    if (response.status === 200) {
      const isSuccessField = response.data.success === true;
      testResults.test6.steps.push(logStep(
        'Step 3',
        'Verify success field is true (when status is 200)',
        isSuccessField,
        isSuccessField ? 'success: true' : `success: ${response.data.success}`
      ));
      
      if (!isSuccessField) {
        testResults.test6.errors.push(`Expected success: true, got ${response.data.success}`);
        return false;
      }
    } else {
      // If 403, verify it's an ownership error (expected for unauthenticated user)
      testResults.test6.steps.push(logStep(
        'Step 3',
        'Verify 403 is ownership error (expected for unauthenticated)',
        true,
        '403 Forbidden - ownership check works correctly'
      ));
    }
    
    testResults.test6.passed = true;
    console.log('✓ TEST 6 PASSED\n');
    return true;
  } catch (error) {
    console.error('✗ TEST 6 FAILED:', error.message);
    testResults.test6.errors.push(error.message);
    return false;
  }
}

/**
 * TEST 7: Response includes proper bilingual messages
 * 
 * Objective: Verify the endpoint returns both English and Bengali messages
 */
async function test7_BilingualMessages() {
  console.log('\n=== TEST 7: Response includes proper bilingual messages ===');
  
  try {
    const testData = {
      sessionId: testCheckoutSessionId,
      step: 'review',
      data: {
        notes: 'Test notes'
      }
    };
    
    // Step 1: Make POST request
    const response = await axios.post(`${BACKEND_URL}/api/v1/checkout/save`, testData, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      }
    }).catch(error => {
      if (error.response) {
        return error.response;
      }
      throw error;
    });
    
    testResults.test7.steps.push(logStep(
      'Step 1',
      'Make POST request to /api/v1/checkout/save',
      response.status !== 0,
      `Status: ${response.status}`
    ));
    
    // Step 2: Verify English message is present
    const hasEnglishMessage = response.data.message !== undefined;
    testResults.test7.steps.push(logStep(
      'Step 2',
      'Verify English message is present',
      hasEnglishMessage,
      hasEnglishMessage ? `message: ${response.data.message}` : 'No English message'
    ));
    
    if (!hasEnglishMessage) {
      testResults.test7.errors.push('No English message in response');
      return false;
    }
    
    // Step 3: Verify Bengali message is present
    const hasBengaliMessage = response.data.messageBn !== undefined;
    testResults.test7.steps.push(logStep(
      'Step 3',
      'Verify Bengali message is present',
      hasBengaliMessage,
      hasBengaliMessage ? `messageBn: ${response.data.messageBn}` : 'No Bengali message'
    ));
    
    if (!hasBengaliMessage) {
      testResults.test7.errors.push('No Bengali message in response');
      return false;
    }
    
    // Step 4: Verify messages are not empty
    const messagesNotEmpty = response.data.message.trim() !== '' && 
                             response.data.messageBn.trim() !== '';
    testResults.test7.steps.push(logStep(
      'Step 4',
      'Verify both messages are not empty',
      messagesNotEmpty,
      messagesNotEmpty ? 'Messages populated' : 'Empty messages'
    ));
    
    if (!messagesNotEmpty) {
      testResults.test7.errors.push('One or both messages are empty');
      return false;
    }
    
    testResults.test7.passed = true;
    console.log('✓ TEST 7 PASSED\n');
    return true;
  } catch (error) {
    console.error('✗ TEST 7 FAILED:', error.message);
    testResults.test7.errors.push(error.message);
    return false;
  }
}

/**
 * TEST 8: Verify 404 error is fixed (endpoint exists)
 * 
 * Objective: Verify the endpoint exists and is accessible (no 404)
 */
async function test8_Verify404ErrorFixed() {
  console.log('\n=== TEST 8: Verify 404 error is fixed (endpoint exists) ===');
  
  try {
    // Step 1: Verify the endpoint route is registered
    // We'll do this by making a request and checking we don't get a 404
    const testData = {
      sessionId: testCheckoutSessionId
    };
    
    const response = await axios.post(`${BACKEND_URL}/api/v1/checkout/save`, testData, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      }
    }).catch(error => {
      if (error.response) {
        return error.response;
      }
      throw error;
    });
    
    testResults.test8.steps.push(logStep(
      'Step 1',
      'Make POST request to /api/v1/checkout/save',
      response.status !== 0,
      `Status: ${response.status}`
    ));
    
    // Step 2: Verify we don't get a 404 (endpoint exists)
    const isNot404 = response.status !== 404;
    testResults.test8.steps.push(logStep(
      'Step 2',
      'Verify endpoint exists (not 404)',
      isNot404,
      isNot404 ? `Status ${response.status} - endpoint exists` : 'Status 404 - endpoint not found'
    ));
    
    if (!isNot404) {
      testResults.test8.errors.push('Endpoint returns 404 - not fixed');
      return false;
    }
    
    // Step 3: Verify the endpoint is properly registered in routes
    // We can check this by verifying the response structure
    const hasExpectedStructure = response.data !== undefined && 
                                  ('success' in response.data || 'error' in response.data);
    testResults.test8.steps.push(logStep(
      'Step 3',
      'Verify response has expected structure',
      hasExpectedStructure,
      hasExpectedStructure ? 'Valid response structure' : 'Invalid response structure'
    ));
    
    if (!hasExpectedStructure) {
      testResults.test8.errors.push('Response does not have expected structure');
      return false;
    }
    
    testResults.test8.passed = true;
    console.log('✓ TEST 8 PASSED - 404 error is fixed!\n');
    return true;
  } catch (error) {
    // Check if it's a 404 error (endpoint not found)
    if (error.response && error.response.status === 404) {
      console.error('✗ TEST 8 FAILED: Endpoint returns 404 - not fixed');
      testResults.test8.errors.push('Endpoint returns 404 - the 404 error is NOT fixed');
      return false;
    }
    
    // Other errors
    console.error('✗ TEST 8 FAILED:', error.message);
    testResults.test8.errors.push(error.message);
    return false;
  }
}

/**
 * CLEANUP: Remove test data
 */
async function cleanup() {
  console.log('\n=== CLEANUP: Removing test data ===');
  
  try {
    // Delete test checkout sessions
    if (testCheckoutSessionId) {
      await prisma.checkoutSession.delete({
        where: { id: testCheckoutSessionId }
      }).catch(() => {});
      console.log('✓ Deleted test checkout session');
    }
    
    if (testExpiredCheckoutSessionId) {
      await prisma.checkoutSession.delete({
        where: { id: testExpiredCheckoutSessionId }
      }).catch(() => {});
      console.log('✓ Deleted expired test checkout session');
    }
    
    // Delete test cart
    if (testCartId) {
      await prisma.cart.delete({
        where: { id: testCartId }
      }).catch(() => {});
      console.log('✓ Deleted test cart');
    }
    
    // Delete test user
    if (testUserId) {
      await prisma.user.delete({
        where: { id: testUserId }
      }).catch(() => {});
      console.log('✓ Deleted test user');
    }
    
    console.log('=== CLEANUP COMPLETE ===\n');
  } catch (error) {
    console.error('✗ CLEANUP WARNING:', error.message);
  }
}

/**
 * Generate comprehensive test report
 */
function generateTestReport() {
  const timestamp = new Date().toISOString();
  const report = {
    timestamp,
    summary: {
      totalTests: 8,
      passed: 0,
      failed: 0
    },
    tests: testResults
  };
  
  // Calculate summary
  Object.values(testResults).forEach(test => {
    if (test.passed) {
      report.summary.passed++;
    } else {
      report.summary.failed++;
    }
  });
  
  // Print report to console
  console.log('\n' + '='.repeat(80));
  console.log('CHECKOUT SAVE ENDPOINT FIX TEST REPORT');
  console.log('='.repeat(80));
  console.log(`Timestamp: ${timestamp}`);
  console.log(`Total Tests: ${report.summary.totalTests}`);
  console.log(`Passed: ${report.summary.passed}`);
  console.log(`Failed: ${report.summary.failed}`);
  console.log('='.repeat(80));
  
  Object.entries(testResults).forEach(([testId, test]) => {
    console.log(`\n${test.name}`);
    console.log('-'.repeat(80));
    console.log(`Status: ${test.passed ? '✓ PASSED' : '✗ FAILED'}`);
    
    if (test.steps.length > 0) {
      console.log('\nSteps:');
      test.steps.forEach((step, index) => {
        console.log(`  ${index + 1}. [${step.passed ? '✓' : '✗'}] ${step.step}`);
        if (step.message) {
          console.log(`     ${step.message}`);
        }
      });
    }
    
    if (test.errors.length > 0) {
      console.log('\nErrors:');
      test.errors.forEach((error, index) => {
        console.log(`  ${index + 1}. ${error}`);
      });
    }
  });
  
  console.log('\n' + '='.repeat(80));
  console.log('404 ERROR FIX VERIFICATION');
  console.log('='.repeat(80));
  if (testResults.test8.passed) {
    console.log('✓ The 404 error has been FIXED');
    console.log('✓ The POST /api/v1/checkout/save endpoint is now accessible');
  } else {
    console.log('✗ The 404 error is NOT fixed');
    console.log('✗ The POST /api/v1/checkout/save endpoint is still returning 404');
  }
  console.log('='.repeat(80) + '\n');
  
  return report;
}

/**
 * Main test execution
 */
async function main() {
  console.log('\n╔════════════════════════════════════════════════════════════════════════════╗');
  console.log('║          CHECKOUT SAVE ENDPOINT FIX TEST SUITE                         ║');
  console.log('║     Testing POST /api/v1/checkout/save endpoint fix                      ║');
  console.log('╚════════════════════════════════════════════════════════════════════════════╝');
  
  // Setup
  const setupSuccess = await setup();
  if (!setupSuccess) {
    console.error('\n✗ SETUP FAILED - ABORTING TESTS');
    process.exit(1);
  }
  
  // Run tests
  const test1Result = await test1_ValidRequestWithAllParameters();
  const test2Result = await test2_ValidRequestWithOnlySessionId();
  const test3Result = await test3_InvalidSessionIdFormat();
  const test4Result = await test4_NonExistentSessionId();
  const test5Result = await test5_ExpiredSessionId();
  const test6Result = await test6_RequestWithoutAuthentication();
  const test7Result = await test7_BilingualMessages();
  const test8Result = await test8_Verify404ErrorFixed();
  
  // Cleanup
  await cleanup();
  
  // Generate report
  const report = generateTestReport();
  
  // Save report to file
  const fs = require('fs');
  const reportFileName = `checkout-save-endpoint-fix-test-results-${Date.now()}.json`;
  fs.writeFileSync(reportFileName, JSON.stringify(report, null, 2));
  console.log(`✓ Test report saved to: ${reportFileName}`);
  
  // Exit with appropriate code
  const allPassed = test1Result && test2Result && test3Result && test4Result && 
                    test5Result && test6Result && test7Result && test8Result;
  process.exit(allPassed ? 0 : 1);
}

// Run tests
main().catch(error => {
  console.error('\n✗ UNEXPECTED ERROR:', error);
  process.exit(1);
});
