/**
 * CHECKOUT COMPLETE ADDRESS FIX VERIFICATION TEST SUITE
 *
 * This test suite verifies that the "Shipping address is required" error has been fixed
 * when completing checkout via POST /api/v1/checkout/complete
 *
 * Context:
 * - Error occurred at: POST http://localhost:3001/api/v1/checkout/complete
 * - Error was: "Shipping address is required"
 * - Fix implemented with:
 *   1. Backend validation fix in checkoutService.js to verify actual address data exists
 *   2. Frontend enhancement in useCheckout.ts to include address data in completeCheckout request
 *   3. Type definition update in checkout.ts for CompleteCheckoutRequest
 *   4. Backend controller update to extract and merge address data
 *
 * Test Scenarios Covered:
 * 1. Full checkout flow with address data in request body (Priority 1)
 * 2. Full checkout flow with saved address ID (Priority 2)
 * 3. Full checkout flow with address ID in stepData (Priority 3)
 * 4. Full checkout flow with address object in stepData (Priority 4)
 * 5. Verify "Shipping address is required" error is NOT thrown when address is provided
 * 6. Verify backend properly validates address data from all sources
 * 7. Verify order is created successfully with address data
 */

const axios = require('axios');
const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');

// Configuration
const BACKEND_URL = 'http://localhost:3001';
const TEST_USER = {
  email: `test-checkout-complete-${Date.now()}@example.com`,
  password: 'Test123!',
  firstName: 'Checkout',
  lastName: 'Complete',
  phone: `01${Math.floor(Math.random() * 9000000000) + 1000000000}`
};

// Test results storage
const testResults = {
  test1: {
    name: 'Test 1: Full checkout flow with address data in request body (Priority 1)',
    description: 'Verify checkout completes when address is provided in request body',
    steps: [],
    passed: false,
    errors: []
  },
  test2: {
    name: 'Test 2: Full checkout flow with saved address ID (Priority 2)',
    description: 'Verify checkout completes when saved address ID is used',
    steps: [],
    passed: false,
    errors: []
  },
  test3: {
    name: 'Test 3: Full checkout flow with address ID in stepData (Priority 3)',
    description: 'Verify checkout completes when address ID is in stepData',
    steps: [],
    passed: false,
    errors: []
  },
  test4: {
    name: 'Test 4: Full checkout flow with address object in stepData (Priority 4)',
    description: 'Verify checkout completes when address object is in stepData',
    steps: [],
    passed: false,
    errors: []
  },
  test5: {
    name: 'Test 5: Verify "Shipping address is required" error is NOT thrown',
    description: 'Verify no error when address is properly provided',
    steps: [],
    passed: false,
    errors: []
  },
  test6: {
    name: 'Test 6: Verify backend validates address from all sources',
    description: 'Verify backend checks all possible address locations',
    steps: [],
    passed: false,
    errors: []
  },
  test7: {
    name: 'Test 7: Verify order is created with address data',
    description: 'Verify order record includes proper address information',
    steps: [],
    passed: false,
    errors: []
  }
};

let authToken = null;
let testUserId = null;
let testCartId = null;
let testCheckoutSessionId = null;
let testProductId = null;
let testAddressId = null;
let createdOrderId = null;

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
 * SETUP: Create test user, cart, address, and checkout session
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
    const bcrypt = require('bcryptjs');
    
    // Generate a proper bcrypt hash for the test password
    const hashedPassword = await bcrypt.hash(TEST_USER.password, 10);
    
    // Update user with proper password hash
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword }
    });
    
    authToken = jwt.sign(
      { id: user.id, userId: user.id, email: user.email, role: user.role },
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
          sku: 'TEST-PROD-COMP-001',
          name: 'Test Checkout Complete Product',
          nameEn: 'Test Checkout Complete Product',
          slug: 'test-checkout-complete-product',
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
    
    // Create a test address
    const address = await prisma.address.create({
      data: {
        userId: testUserId,
        type: 'shipping',
        firstName: 'Test',
        lastName: 'User',
        phone: '01712345678',
        address: '123 Test Street',
        addressLine2: 'Apt 4B',
        city: 'Dhaka',
        district: 'Dhaka',
        division: 'dhaka',
        postalCode: '1000',
        isDefault: false
      }
    });
    testAddressId = address.id;
    console.log(`✓ Created test address: ${address.id}`);
    
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
        currentStep: 'review',
        status: 'active',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
        metadata: {
          createdAt: new Date().toISOString()
        },
        progress: {
          steps: {
            address: { completed: true, startedAt: new Date().toISOString(), completedAt: new Date().toISOString() },
            shipping: { completed: true, startedAt: new Date().toISOString(), completedAt: new Date().toISOString() },
            payment: { completed: true, startedAt: new Date().toISOString(), completedAt: new Date().toISOString() },
            review: { completed: false, startedAt: null, completedAt: null }
          },
          totalTime: 0,
          stepCount: 3
        },
        stepData: {
          address: {
            shippingAddressId: testAddressId,
            shippingAddress: {
              firstName: 'Test',
              lastName: 'User',
              phone: '01712345678',
              address: '123 Test Street',
              addressLine2: 'Apt 4B',
              city: 'Dhaka',
              district: 'Dhaka',
              postalCode: '1000'
            },
            billingAddressId: testAddressId,
            billingAddress: {
              firstName: 'Test',
              lastName: 'User',
              phone: '01712345678',
              address: '123 Test Street',
              addressLine2: 'Apt 4B',
              city: 'Dhaka',
              district: 'Dhaka',
              postalCode: '1000'
            },
            useSameAddress: true
          },
          shipping: {
            method: 'STANDARD',
            cost: 100,
            estimatedDays: '3-5'
          },
          payment: {
            method: 'CASH_ON_DELIVERY',
            details: null,
            fee: 0
          },
          review: {
            notes: 'Test order notes'
          }
        }
      }
    });
    testCheckoutSessionId = checkoutSession.id;
    console.log(`✓ Created test checkout session: ${checkoutSession.id}`);
    
    console.log('=== SETUP COMPLETE ===\n');
    return true;
  } catch (error) {
    console.error('✗ SETUP FAILED:', error.message);
    console.error(error.stack);
    return false;
  }
}

/**
 * TEST 1: Full checkout flow with address data in request body (Priority 1)
 * 
 * Objective: Verify checkout completes when address is provided in request body
 * This tests the highest priority address source in the backend
 */
async function test1_AddressInRequestBody() {
  console.log('\n=== TEST 1: Full checkout flow with address data in request body (Priority 1) ===');
  
  try {
    // Create a fresh checkout session for this test
    const freshSession = await prisma.checkoutSession.create({
      data: {
        id: generateUUID(),
        userId: testUserId,
        cartId: testCartId,
        currentStep: 'review',
        status: 'active',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        metadata: { createdAt: new Date().toISOString() },
        progress: {
          steps: {
            address: { completed: true, startedAt: new Date().toISOString(), completedAt: new Date().toISOString() },
            shipping: { completed: true, startedAt: new Date().toISOString(), completedAt: new Date().toISOString() },
            payment: { completed: true, startedAt: new Date().toISOString(), completedAt: new Date().toISOString() },
            review: { completed: false, startedAt: null, completedAt: null }
          },
          totalTime: 0,
          stepCount: 3
        },
        stepData: {
          shipping: { method: 'STANDARD', cost: 100, estimatedDays: '3-5' },
          payment: { method: 'CASH_ON_DELIVERY', details: null, fee: 0 }
        }
      }
    });
    
    const testData = {
      data: {
        shipping: { method: 'STANDARD', cost: 100, estimatedDays: '3-5' },
        payment: { method: 'CASH_ON_DELIVERY', details: null, fee: 0 },
        review: { notes: 'Test order notes' }
      },
      address: {
        shippingAddress: {
          firstName: 'Test',
          lastName: 'User',
          phone: '01712345678',
          address: '123 Test Street',
          addressLine2: 'Apt 4B',
          city: 'Dhaka',
          district: 'Dhaka',
          postalCode: '1000'
        },
        useSameAddress: true
      }
    };
    
    // Step 1: Make POST request to /api/v1/checkout/session/:sessionId/complete
    const response = await axios.post(`${BACKEND_URL}/api/v1/checkout/session/${freshSession.id}/complete`, testData, {
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
      'Make POST request to /api/v1/checkout/session/:sessionId/complete',
      response.status !== 0,
      `Status: ${response.status}`
    ));
    
    // Step 2: Verify response status is 201 (Created)
    const is201 = response.status === 201;
    testResults.test1.steps.push(logStep(
      'Step 2',
      'Verify response status is 201 (Created)',
      is201,
      is201 ? 'Status 201 Created' : `Status ${response.status}`
    ));
    
    if (!is201) {
      testResults.test1.errors.push(`Expected status 201, got ${response.status}`);
      // Handle error as string or object
      const errorMessage = typeof response.data.error === 'string'
        ? response.data.error
        : (response.data.error?.message || JSON.stringify(response.data.error));
      if (errorMessage && errorMessage.includes('Shipping address is required')) {
        testResults.test1.errors.push('ERROR: "Shipping address is required" error still occurs!');
      }
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
      if (response.data && response.data.error && response.data.error.includes('Shipping address is required')) {
        testResults.test1.errors.push('ERROR: "Shipping address is required" error still occurs!');
      }
      return false;
    }
    
    // Step 4: Verify orderId is returned
    const hasOrderId = response.data.data && response.data.data.orderId !== undefined;
    testResults.test1.steps.push(logStep(
      'Step 4',
      'Verify orderId is returned in response',
      hasOrderId,
      hasOrderId ? `orderId: ${response.data.data.orderId}` : 'No orderId in response'
    ));
    
    if (!hasOrderId) {
      testResults.test1.errors.push('No orderId returned in response');
      return false;
    }
    
    createdOrderId = response.data.data.orderId;
    
    // Step 5: Verify order was created in database
    const order = await prisma.order.findUnique({
      where: { id: createdOrderId },
      include: { address: true }
    });
    const orderExists = order !== null;
    testResults.test1.steps.push(logStep(
      'Step 5',
      'Verify order was created in database',
      orderExists,
      orderExists ? `Order found: ${order.orderNumber}` : 'Order not found'
    ));
    
    if (!orderExists) {
      testResults.test1.errors.push('Order was not created in database');
      return false;
    }
    
    // Step 6: Verify order has address
    const hasAddress = order.address !== null;
    testResults.test1.steps.push(logStep(
      'Step 6',
      'Verify order has address linked',
      hasAddress,
      hasAddress ? `Address ID: ${order.addressId}` : 'No address linked'
    ));
    
    if (!hasAddress) {
      testResults.test1.errors.push('Order does not have address linked');
      return false;
    }
    
    testResults.test1.passed = true;
    console.log('✓ TEST 1 PASSED\n');
    return true;
  } catch (error) {
    console.error('✗ TEST 1 FAILED:', error.message);
    testResults.test1.errors.push(error.message);
    if (error.response && error.response.data && error.response.data.error && 
        error.response.data.error.includes('Shipping address is required')) {
      testResults.test1.errors.push('ERROR: "Shipping address is required" error still occurs!');
    }
    return false;
  }
}

/**
 * TEST 2: Full checkout flow with saved address ID (Priority 2)
 * 
 * Objective: Verify checkout completes when saved address ID is used
 */
async function test2_SavedAddressId() {
  console.log('\n=== TEST 2: Full checkout flow with saved address ID (Priority 2) ===');
  
  try {
    // Create a fresh checkout session with saved address ID
    const freshSession = await prisma.checkoutSession.create({
      data: {
        id: generateUUID(),
        userId: testUserId,
        cartId: testCartId,
        currentStep: 'review',
        status: 'active',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        shippingAddressId: testAddressId,
        billingAddressId: testAddressId,
        metadata: { createdAt: new Date().toISOString() },
        progress: {
          steps: {
            address: { completed: true, startedAt: new Date().toISOString(), completedAt: new Date().toISOString() },
            shipping: { completed: true, startedAt: new Date().toISOString(), completedAt: new Date().toISOString() },
            payment: { completed: true, startedAt: new Date().toISOString(), completedAt: new Date().toISOString() },
            review: { completed: false, startedAt: null, completedAt: null }
          },
          totalTime: 0,
          stepCount: 3
        },
        stepData: {
          shipping: { method: 'STANDARD', cost: 100, estimatedDays: '3-5' },
          payment: { method: 'CASH_ON_DELIVERY', details: null, fee: 0 }
        }
      }
    });
    
    const testData = {
      data: {
        shipping: { method: 'STANDARD', cost: 100, estimatedDays: '3-5' },
        payment: { method: 'CASH_ON_DELIVERY', details: null, fee: 0 },
        review: { notes: 'Test order notes' }
      }
    };
    
    // Step 1: Make POST request with saved address ID
    const response = await axios.post(`${BACKEND_URL}/api/v1/checkout/session/${freshSession.id}/complete`, testData, {
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
      'Make POST request with saved address ID',
      response.status !== 0,
      `Status: ${response.status}`
    ));
    
    // Step 2: Verify response status is 201
    const is201 = response.status === 201;
    testResults.test2.steps.push(logStep(
      'Step 2',
      'Verify response status is 201 (Created)',
      is201,
      is201 ? 'Status 201 Created' : `Status ${response.status}`
    ));
    
    if (!is201) {
      testResults.test2.errors.push(`Expected status 201, got ${response.status}`);
      if (response.data && response.data.error && response.data.error.includes('Shipping address is required')) {
        testResults.test2.errors.push('ERROR: "Shipping address is required" error still occurs!');
      }
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
    
    // Step 4: Verify order was created with address
    const orderId = response.data.data.orderId;
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { address: true }
    });
    const orderHasAddress = order !== null && order.address !== null;
    testResults.test2.steps.push(logStep(
      'Step 4',
      'Verify order was created with saved address',
      orderHasAddress,
      orderHasAddress ? `Address ID: ${order.addressId}` : 'No address linked'
    ));
    
    if (!orderHasAddress) {
      testResults.test2.errors.push('Order was not created with saved address');
      return false;
    }
    
    testResults.test2.passed = true;
    console.log('✓ TEST 2 PASSED\n');
    return true;
  } catch (error) {
    console.error('✗ TEST 2 FAILED:', error.message);
    testResults.test2.errors.push(error.message);
    if (error.response && error.response.data && error.response.data.error && 
        error.response.data.error.includes('Shipping address is required')) {
      testResults.test2.errors.push('ERROR: "Shipping address is required" error still occurs!');
    }
    return false;
  }
}

/**
 * TEST 3: Full checkout flow with address ID in stepData (Priority 3)
 * 
 * Objective: Verify checkout completes when address ID is in stepData
 */
async function test3_AddressIdInStepData() {
  console.log('\n=== TEST 3: Full checkout flow with address ID in stepData (Priority 3) ===');
  
  try {
    // Create a fresh checkout session with address ID in stepData
    const freshSession = await prisma.checkoutSession.create({
      data: {
        id: generateUUID(),
        userId: testUserId,
        cartId: testCartId,
        currentStep: 'review',
        status: 'active',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        metadata: { createdAt: new Date().toISOString() },
        progress: {
          steps: {
            address: { completed: true, startedAt: new Date().toISOString(), completedAt: new Date().toISOString() },
            shipping: { completed: true, startedAt: new Date().toISOString(), completedAt: new Date().toISOString() },
            payment: { completed: true, startedAt: new Date().toISOString(), completedAt: new Date().toISOString() },
            review: { completed: false, startedAt: null, completedAt: null }
          },
          totalTime: 0,
          stepCount: 3
        },
        stepData: {
          address: {
            shippingAddressId: testAddressId,
            billingAddressId: testAddressId
          },
          shipping: { method: 'STANDARD', cost: 100, estimatedDays: '3-5' },
          payment: { method: 'CASH_ON_DELIVERY', details: null, fee: 0 }
        }
      }
    });
    
    const testData = {
      data: {
        shipping: { method: 'STANDARD', cost: 100, estimatedDays: '3-5' },
        payment: { method: 'CASH_ON_DELIVERY', details: null, fee: 0 },
        review: { notes: 'Test order notes' }
      }
    };
    
    // Step 1: Make POST request with address ID in stepData
    const response = await axios.post(`${BACKEND_URL}/api/v1/checkout/session/${freshSession.id}/complete`, testData, {
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
      'Make POST request with address ID in stepData',
      response.status !== 0,
      `Status: ${response.status}`
    ));
    
    // Step 2: Verify response status is 201
    const is201 = response.status === 201;
    testResults.test3.steps.push(logStep(
      'Step 2',
      'Verify response status is 201 (Created)',
      is201,
      is201 ? 'Status 201 Created' : `Status ${response.status}`
    ));
    
    if (!is201) {
      testResults.test3.errors.push(`Expected status 201, got ${response.status}`);
      if (response.data && response.data.error && response.data.error.includes('Shipping address is required')) {
        testResults.test3.errors.push('ERROR: "Shipping address is required" error still occurs!');
      }
      return false;
    }
    
    // Step 3: Verify success field is true
    const isSuccess = response.data.success === true;
    testResults.test3.steps.push(logStep(
      'Step 3',
      'Verify success field is true',
      isSuccess,
      isSuccess ? 'success: true' : `success: ${response.data.success}`
    ));
    
    if (!isSuccess) {
      testResults.test3.errors.push(`Expected success: true, got ${response.data.success}`);
      return false;
    }
    
    // Step 4: Verify order was created with address
    const orderId = response.data.data.orderId;
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { address: true }
    });
    const orderHasAddress = order !== null && order.address !== null;
    testResults.test3.steps.push(logStep(
      'Step 4',
      'Verify order was created with address from stepData',
      orderHasAddress,
      orderHasAddress ? `Address ID: ${order.addressId}` : 'No address linked'
    ));
    
    if (!orderHasAddress) {
      testResults.test3.errors.push('Order was not created with address from stepData');
      return false;
    }
    
    testResults.test3.passed = true;
    console.log('✓ TEST 3 PASSED\n');
    return true;
  } catch (error) {
    console.error('✗ TEST 3 FAILED:', error.message);
    testResults.test3.errors.push(error.message);
    if (error.response && error.response.data && error.response.data.error && 
        error.response.data.error.includes('Shipping address is required')) {
      testResults.test3.errors.push('ERROR: "Shipping address is required" error still occurs!');
    }
    return false;
  }
}

/**
 * TEST 4: Full checkout flow with address object in stepData (Priority 4)
 * 
 * Objective: Verify checkout completes when address object is in stepData
 */
async function test4_AddressObjectInStepData() {
  console.log('\n=== TEST 4: Full checkout flow with address object in stepData (Priority 4) ===');
  
  try {
    // Create a fresh checkout session with address object in stepData
    const freshSession = await prisma.checkoutSession.create({
      data: {
        id: generateUUID(),
        userId: testUserId,
        cartId: testCartId,
        currentStep: 'review',
        status: 'active',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        metadata: { createdAt: new Date().toISOString() },
        progress: {
          steps: {
            address: { completed: true, startedAt: new Date().toISOString(), completedAt: new Date().toISOString() },
            shipping: { completed: true, startedAt: new Date().toISOString(), completedAt: new Date().toISOString() },
            payment: { completed: true, startedAt: new Date().toISOString(), completedAt: new Date().toISOString() },
            review: { completed: false, startedAt: null, completedAt: null }
          },
          totalTime: 0,
          stepCount: 3
        },
        stepData: {
          address: {
            shippingAddress: {
              firstName: 'Test',
              lastName: 'User',
              phone: '01712345678',
              address: '123 Test Street',
              addressLine2: 'Apt 4B',
              city: 'Dhaka',
              district: 'Dhaka',
              postalCode: '1000'
            },
            billingAddress: {
              firstName: 'Test',
              lastName: 'User',
              phone: '01712345678',
              address: '123 Test Street',
              addressLine2: 'Apt 4B',
              city: 'Dhaka',
              district: 'Dhaka',
              postalCode: '1000'
            },
            useSameAddress: true
          },
          shipping: { method: 'STANDARD', cost: 100, estimatedDays: '3-5' },
          payment: { method: 'CASH_ON_DELIVERY', details: null, fee: 0 }
        }
      }
    });
    
    const testData = {
      data: {
        shipping: { method: 'STANDARD', cost: 100, estimatedDays: '3-5' },
        payment: { method: 'CASH_ON_DELIVERY', details: null, fee: 0 },
        review: { notes: 'Test order notes' }
      }
    };
    
    // Step 1: Make POST request with address object in stepData
    const response = await axios.post(`${BACKEND_URL}/api/v1/checkout/session/${freshSession.id}/complete`, testData, {
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
      'Make POST request with address object in stepData',
      response.status !== 0,
      `Status: ${response.status}`
    ));
    
    // Step 2: Verify response status is 201
    const is201 = response.status === 201;
    testResults.test4.steps.push(logStep(
      'Step 2',
      'Verify response status is 201 (Created)',
      is201,
      is201 ? 'Status 201 Created' : `Status ${response.status}`
    ));
    
    if (!is201) {
      testResults.test4.errors.push(`Expected status 201, got ${response.status}`);
      if (response.data && response.data.error && response.data.error.includes('Shipping address is required')) {
        testResults.test4.errors.push('ERROR: "Shipping address is required" error still occurs!');
      }
      return false;
    }
    
    // Step 3: Verify success field is true
    const isSuccess = response.data.success === true;
    testResults.test4.steps.push(logStep(
      'Step 3',
      'Verify success field is true',
      isSuccess,
      isSuccess ? 'success: true' : `success: ${response.data.success}`
    ));
    
    if (!isSuccess) {
      testResults.test4.errors.push(`Expected success: true, got ${response.data.success}`);
      return false;
    }
    
    // Step 4: Verify order was created with address
    const orderId = response.data.data.orderId;
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { address: true }
    });
    const orderHasAddress = order !== null && order.address !== null;
    testResults.test4.steps.push(logStep(
      'Step 4',
      'Verify order was created with address object from stepData',
      orderHasAddress,
      orderHasAddress ? `Address ID: ${order.addressId}` : 'No address linked'
    ));
    
    if (!orderHasAddress) {
      testResults.test4.errors.push('Order was not created with address object from stepData');
      return false;
    }
    
    testResults.test4.passed = true;
    console.log('✓ TEST 4 PASSED\n');
    return true;
  } catch (error) {
    console.error('✗ TEST 4 FAILED:', error.message);
    testResults.test4.errors.push(error.message);
    if (error.response && error.response.data && error.response.data.error && 
        error.response.data.error.includes('Shipping address is required')) {
      testResults.test4.errors.push('ERROR: "Shipping address is required" error still occurs!');
    }
    return false;
  }
}

/**
 * TEST 5: Verify "Shipping address is required" error is NOT thrown
 * 
 * Objective: Verify no error when address is properly provided
 */
async function test5_NoShippingAddressError() {
  console.log('\n=== TEST 5: Verify "Shipping address is required" error is NOT thrown ===');
  
  try {
    // Create a fresh checkout session
    const freshSession = await prisma.checkoutSession.create({
      data: {
        id: generateUUID(),
        userId: testUserId,
        cartId: testCartId,
        currentStep: 'review',
        status: 'active',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        metadata: { createdAt: new Date().toISOString() },
        progress: {
          steps: {
            address: { completed: true, startedAt: new Date().toISOString(), completedAt: new Date().toISOString() },
            shipping: { completed: true, startedAt: new Date().toISOString(), completedAt: new Date().toISOString() },
            payment: { completed: true, startedAt: new Date().toISOString(), completedAt: new Date().toISOString() },
            review: { completed: false, startedAt: null, completedAt: null }
          },
          totalTime: 0,
          stepCount: 3
        },
        stepData: {
          shipping: { method: 'STANDARD', cost: 100, estimatedDays: '3-5' },
          payment: { method: 'CASH_ON_DELIVERY', details: null, fee: 0 }
        }
      }
    });
    
    const testData = {
      data: {
        shipping: { method: 'STANDARD', cost: 100, estimatedDays: '3-5' },
        payment: { method: 'CASH_ON_DELIVERY', details: null, fee: 0 },
        review: { notes: 'Test order notes' }
      },
      address: {
        shippingAddress: {
          firstName: 'Test',
          lastName: 'User',
          phone: '01712345678',
          address: '123 Test Street',
          addressLine2: 'Apt 4B',
          city: 'Dhaka',
          district: 'Dhaka',
          postalCode: '1000'
        },
        useSameAddress: true
      }
    };
    
    // Step 1: Make POST request with address data
    const response = await axios.post(`${BACKEND_URL}/api/v1/checkout/session/${freshSession.id}/complete`, testData, {
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
      'Make POST request with address data',
      response.status !== 0,
      `Status: ${response.status}`
    ));
    
    // Step 2: Verify "Shipping address is required" error is NOT in response
    const hasShippingAddressError = response.data && response.data.error && 
                                   response.data.error.includes('Shipping address is required');
    const noShippingAddressError = !hasShippingAddressError;
    testResults.test5.steps.push(logStep(
      'Step 2',
      'Verify "Shipping address is required" error is NOT present',
      noShippingAddressError,
      noShippingAddressError ? 'No shipping address error' : 'ERROR: Shipping address error present!'
    ));
    
    if (hasShippingAddressError) {
      testResults.test5.errors.push('ERROR: "Shipping address is required" error still occurs!');
      testResults.test5.errors.push(`Response: ${JSON.stringify(response.data)}`);
      return false;
    }
    
    // Step 3: Verify response is successful (200 or 201)
    const isSuccess = response.status === 200 || response.status === 201;
    testResults.test5.steps.push(logStep(
      'Step 3',
      'Verify response is successful',
      isSuccess,
      isSuccess ? `Status ${response.status}` : `Status ${response.status}`
    ));
    
    if (!isSuccess) {
      testResults.test5.errors.push(`Expected status 200 or 201, got ${response.status}`);
      return false;
    }
    
    testResults.test5.passed = true;
    console.log('✓ TEST 5 PASSED - "Shipping address is required" error is fixed!\n');
    return true;
  } catch (error) {
    console.error('✗ TEST 5 FAILED:', error.message);
    testResults.test5.errors.push(error.message);
    if (error.response && error.response.data && error.response.data.error && 
        error.response.data.error.includes('Shipping address is required')) {
      testResults.test5.errors.push('ERROR: "Shipping address is required" error still occurs!');
    }
    return false;
  }
}

/**
 * TEST 6: Verify backend validates address from all sources
 * 
 * Objective: Verify backend checks all possible address locations
 */
async function test6_BackendValidatesAllAddressSources() {
  console.log('\n=== TEST 6: Verify backend validates address from all sources ===');
  
  try {
    let allSourcesValidated = true;
    let validationResults = [];
    
    // Test Priority 1: Address in request body
    const session1 = await prisma.checkoutSession.create({
      data: {
        id: generateUUID(),
        userId: testUserId,
        cartId: testCartId,
        currentStep: 'review',
        status: 'active',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        metadata: { createdAt: new Date().toISOString() },
        progress: {
          steps: {
            address: { completed: true, startedAt: new Date().toISOString(), completedAt: new Date().toISOString() },
            shipping: { completed: true, startedAt: new Date().toISOString(), completedAt: new Date().toISOString() },
            payment: { completed: true, startedAt: new Date().toISOString(), completedAt: new Date().toISOString() },
            review: { completed: false, startedAt: null, completedAt: null }
          },
          totalTime: 0,
          stepCount: 3
        },
        stepData: {
          shipping: { method: 'STANDARD', cost: 100, estimatedDays: '3-5' },
          payment: { method: 'CASH_ON_DELIVERY', details: null, fee: 0 }
        }
      }
    });
    
    const response1 = await axios.post(`${BACKEND_URL}/api/v1/checkout/session/${session1.id}/complete`, {
      data: {
        shipping: { method: 'STANDARD', cost: 100, estimatedDays: '3-5' },
        payment: { method: 'CASH_ON_DELIVERY', details: null, fee: 0 }
      },
      address: {
        shippingAddress: {
          firstName: 'Test', lastName: 'User', phone: '01712345678',
          address: '123 Test Street', city: 'Dhaka', district: 'Dhaka', postalCode: '1000'
        }
      }
    }, {
      headers: { 'Authorization': `Bearer ${authToken}`, 'Content-Type': 'application/json' }
    }).catch(e => e.response || e);
    
    const priority1Valid = response1.status === 201;
    validationResults.push({ priority: '1 (request body)', valid: priority1Valid });
    
    // Test Priority 2: Saved address ID
    const session2 = await prisma.checkoutSession.create({
      data: {
        id: generateUUID(),
        userId: testUserId,
        cartId: testCartId,
        currentStep: 'review',
        status: 'active',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        shippingAddressId: testAddressId,
        metadata: { createdAt: new Date().toISOString() },
        progress: {
          steps: {
            address: { completed: true, startedAt: new Date().toISOString(), completedAt: new Date().toISOString() },
            shipping: { completed: true, startedAt: new Date().toISOString(), completedAt: new Date().toISOString() },
            payment: { completed: true, startedAt: new Date().toISOString(), completedAt: new Date().toISOString() },
            review: { completed: false, startedAt: null, completedAt: null }
          },
          totalTime: 0,
          stepCount: 3
        },
        stepData: {
          shipping: { method: 'STANDARD', cost: 100, estimatedDays: '3-5' },
          payment: { method: 'CASH_ON_DELIVERY', details: null, fee: 0 }
        }
      }
    });
    
    const response2 = await axios.post(`${BACKEND_URL}/api/v1/checkout/session/${session2.id}/complete`, {
      data: {
        shipping: { method: 'STANDARD', cost: 100, estimatedDays: '3-5' },
        payment: { method: 'CASH_ON_DELIVERY', details: null, fee: 0 }
      }
    }, {
      headers: { 'Authorization': `Bearer ${authToken}`, 'Content-Type': 'application/json' }
    }).catch(e => e.response || e);
    
    const priority2Valid = response2.status === 201;
    validationResults.push({ priority: '2 (saved address ID)', valid: priority2Valid });
    
    // Test Priority 3: Address ID in stepData
    const session3 = await prisma.checkoutSession.create({
      data: {
        id: generateUUID(),
        userId: testUserId,
        cartId: testCartId,
        currentStep: 'review',
        status: 'active',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        metadata: { createdAt: new Date().toISOString() },
        progress: {
          steps: {
            address: { completed: true, startedAt: new Date().toISOString(), completedAt: new Date().toISOString() },
            shipping: { completed: true, startedAt: new Date().toISOString(), completedAt: new Date().toISOString() },
            payment: { completed: true, startedAt: new Date().toISOString(), completedAt: new Date().toISOString() },
            review: { completed: false, startedAt: null, completedAt: null }
          },
          totalTime: 0,
          stepCount: 3
        },
        stepData: {
          address: { shippingAddressId: testAddressId },
          shipping: { method: 'STANDARD', cost: 100, estimatedDays: '3-5' },
          payment: { method: 'CASH_ON_DELIVERY', details: null, fee: 0 }
        }
      }
    });
    
    const response3 = await axios.post(`${BACKEND_URL}/api/v1/checkout/session/${session3.id}/complete`, {
      data: {
        shipping: { method: 'STANDARD', cost: 100, estimatedDays: '3-5' },
        payment: { method: 'CASH_ON_DELIVERY', details: null, fee: 0 }
      }
    }, {
      headers: { 'Authorization': `Bearer ${authToken}`, 'Content-Type': 'application/json' }
    }).catch(e => e.response || e);
    
    const priority3Valid = response3.status === 201;
    validationResults.push({ priority: '3 (address ID in stepData)', valid: priority3Valid });
    
    // Test Priority 4: Address object in stepData
    const session4 = await prisma.checkoutSession.create({
      data: {
        id: generateUUID(),
        userId: testUserId,
        cartId: testCartId,
        currentStep: 'review',
        status: 'active',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        metadata: { createdAt: new Date().toISOString() },
        progress: {
          steps: {
            address: { completed: true, startedAt: new Date().toISOString(), completedAt: new Date().toISOString() },
            shipping: { completed: true, startedAt: new Date().toISOString(), completedAt: new Date().toISOString() },
            payment: { completed: true, startedAt: new Date().toISOString(), completedAt: new Date().toISOString() },
            review: { completed: false, startedAt: null, completedAt: null }
          },
          totalTime: 0,
          stepCount: 3
        },
        stepData: {
          address: {
            shippingAddress: {
              firstName: 'Test', lastName: 'User', phone: '01712345678',
              address: '123 Test Street', city: 'Dhaka', district: 'Dhaka', postalCode: '1000'
            }
          },
          shipping: { method: 'STANDARD', cost: 100, estimatedDays: '3-5' },
          payment: { method: 'CASH_ON_DELIVERY', details: null, fee: 0 }
        }
      }
    });
    
    const response4 = await axios.post(`${BACKEND_URL}/api/v1/checkout/session/${session4.id}/complete`, {
      data: {
        shipping: { method: 'STANDARD', cost: 100, estimatedDays: '3-5' },
        payment: { method: 'CASH_ON_DELIVERY', details: null, fee: 0 }
      }
    }, {
      headers: { 'Authorization': `Bearer ${authToken}`, 'Content-Type': 'application/json' }
    }).catch(e => e.response || e);
    
    const priority4Valid = response4.status === 201;
    validationResults.push({ priority: '4 (address object in stepData)', valid: priority4Valid });
    
    // Log validation results
    testResults.test6.steps.push(logStep(
      'Step 1',
      'Test Priority 1: Address in request body',
      priority1Valid,
      priority1Valid ? 'Valid' : 'Failed'
    ));
    
    testResults.test6.steps.push(logStep(
      'Step 2',
      'Test Priority 2: Saved address ID',
      priority2Valid,
      priority2Valid ? 'Valid' : 'Failed'
    ));
    
    testResults.test6.steps.push(logStep(
      'Step 3',
      'Test Priority 3: Address ID in stepData',
      priority3Valid,
      priority3Valid ? 'Valid' : 'Failed'
    ));
    
    testResults.test6.steps.push(logStep(
      'Step 4',
      'Test Priority 4: Address object in stepData',
      priority4Valid,
      priority4Valid ? 'Valid' : 'Failed'
    ));
    
    // Step 5: Verify all priority sources work
    allSourcesValidated = priority1Valid && priority2Valid && priority3Valid && priority4Valid;
    testResults.test6.steps.push(logStep(
      'Step 5',
      'Verify all priority sources are validated',
      allSourcesValidated,
      allSourcesValidated ? 'All sources validated' : 'Some sources failed'
    ));
    
    if (!allSourcesValidated) {
      testResults.test6.errors.push('Not all address priority sources are working correctly');
      testResults.test6.errors.push(`Validation results: ${JSON.stringify(validationResults)}`);
      return false;
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
 * TEST 7: Verify order is created with address data
 * 
 * Objective: Verify order record includes proper address information
 */
async function test7_OrderCreatedWithAddress() {
  console.log('\n=== TEST 7: Verify order is created with address data ===');
  
  try {
    // Use the order created in Test 1
    if (!createdOrderId) {
      testResults.test7.errors.push('No order ID available from previous test');
      return false;
    }
    
    // Step 1: Retrieve order from database
    const order = await prisma.order.findUnique({
      where: { id: createdOrderId },
      include: { address: true }
    });
    
    const orderExists = order !== null;
    testResults.test7.steps.push(logStep(
      'Step 1',
      'Retrieve order from database',
      orderExists,
      orderExists ? `Order found: ${order.orderNumber}` : 'Order not found'
    ));
    
    if (!orderExists) {
      testResults.test7.errors.push('Order not found in database');
      return false;
    }
    
    // Step 2: Verify order has address linked
    const hasAddress = order.address !== null;
    testResults.test7.steps.push(logStep(
      'Step 2',
      'Verify order has address linked',
      hasAddress,
      hasAddress ? `Address ID: ${order.addressId}` : 'No address linked'
    ));
    
    if (!hasAddress) {
      testResults.test7.errors.push('Order does not have address linked');
      return false;
    }
    
    // Step 3: Verify address data is complete
    const address = order.address;
    const addressComplete = address.firstName && address.lastName && address.phone && 
                          address.address && address.city && address.district && 
                          address.postalCode;
    testResults.test7.steps.push(logStep(
      'Step 3',
      'Verify address data is complete',
      addressComplete,
      addressComplete ? 'All address fields present' : 'Missing address fields'
    ));
    
    if (!addressComplete) {
      testResults.test7.errors.push('Address data is incomplete');
      testResults.test7.errors.push(`Address: ${JSON.stringify(address)}`);
      return false;
    }
    
    // Step 4: Verify order status is pending
    const orderStatusPending = order.status === 'pending';
    testResults.test7.steps.push(logStep(
      'Step 4',
      'Verify order status is pending',
      orderStatusPending,
      orderStatusPending ? `Status: ${order.status}` : `Status: ${order.status}`
    ));
    
    if (!orderStatusPending) {
      testResults.test7.errors.push(`Order status is ${order.status}, expected pending`);
      return false;
    }
    
    // Step 5: Verify order total is calculated correctly
    const orderTotalValid = order.total > 0;
    testResults.test7.steps.push(logStep(
      'Step 5',
      'Verify order total is calculated correctly',
      orderTotalValid,
      orderTotalValid ? `Total: ${order.total}` : 'Total is 0 or negative'
    ));
    
    if (!orderTotalValid) {
      testResults.test7.errors.push('Order total is not calculated correctly');
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
 * CLEANUP: Remove test data
 */
async function cleanup() {
  console.log('\n=== CLEANUP: Removing test data ===');
  
  try {
    // Delete test checkout sessions (all created during tests)
    await prisma.checkoutSession.deleteMany({
      where: { userId: testUserId }
    }).catch(() => {});
    console.log('✓ Deleted test checkout sessions');
    
    // Delete test orders
    await prisma.order.deleteMany({
      where: { userId: testUserId }
    }).catch(() => {});
    console.log('✓ Deleted test orders');
    
    // Delete test cart
    if (testCartId) {
      await prisma.cart.delete({
        where: { id: testCartId }
      }).catch(() => {});
      console.log('✓ Deleted test cart');
    }
    
    // Delete test address
    if (testAddressId) {
      await prisma.address.delete({
        where: { id: testAddressId }
      }).catch(() => {});
      console.log('✓ Deleted test address');
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
      totalTests: 7,
      passed: 0,
      failed: 0
    },
    tests: testResults,
    fixVerified: false
  };
  
  // Calculate summary
  Object.values(testResults).forEach(test => {
    if (test.passed) {
      report.summary.passed++;
    } else {
      report.summary.failed++;
    }
  });
  
  // Check if fix is verified (all critical tests pass)
  const criticalTestsPass = testResults.test1.passed && testResults.test5.passed && testResults.test6.passed;
  report.fixVerified = criticalTestsPass;
  
  // Print report to console
  console.log('\n' + '='.repeat(80));
  console.log('CHECKOUT COMPLETE ADDRESS FIX VERIFICATION TEST REPORT');
  console.log('='.repeat(80));
  console.log(`Timestamp: ${timestamp}`);
  console.log(`Total Tests: ${report.summary.totalTests}`);
  console.log(`Passed: ${report.summary.passed}`);
  console.log(`Failed: ${report.summary.failed}`);
  console.log('='.repeat(80));
  
  Object.entries(testResults).forEach(([testId, test]) => {
    console.log(`\n${test.name}`);
    console.log(`Description: ${test.description}`);
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
  console.log('FIX VERIFICATION SUMMARY');
  console.log('='.repeat(80));
  if (report.fixVerified) {
    console.log('✓ The "Shipping address is required" error has been FIXED');
    console.log('✓ Checkout completion works correctly with address data');
    console.log('✓ Backend properly validates address from all priority sources');
  } else {
    console.log('✗ The "Shipping address is required" error is NOT fixed');
    console.log('✗ Some critical tests failed');
  }
  console.log('='.repeat(80) + '\n');
  
  return report;
}

/**
 * Main test execution
 */
async function main() {
  console.log('\n╔════════════════════════════════════════════════════════════════════════════╗');
  console.log('║     CHECKOUT COMPLETE ADDRESS FIX VERIFICATION TEST SUITE                  ║');
  console.log('║     Testing POST /api/v1/checkout/complete endpoint fix               ║');
  console.log('╚════════════════════════════════════════════════════════════════════════════╝');
  
  // Setup
  const setupSuccess = await setup();
  if (!setupSuccess) {
    console.error('\n✗ SETUP FAILED - ABORTING TESTS');
    process.exit(1);
  }
  
  // Run tests
  const test1Result = await test1_AddressInRequestBody();
  const test2Result = await test2_SavedAddressId();
  const test3Result = await test3_AddressIdInStepData();
  const test4Result = await test4_AddressObjectInStepData();
  const test5Result = await test5_NoShippingAddressError();
  const test6Result = await test6_BackendValidatesAllAddressSources();
  const test7Result = await test7_OrderCreatedWithAddress();
  
  // Cleanup
  await cleanup();
  
  // Generate report
  const report = generateTestReport();
  
  // Save report to file
  const fs = require('fs');
  const reportFileName = `checkout-complete-address-fix-verification-results-${Date.now()}.json`;
  fs.writeFileSync(reportFileName, JSON.stringify(report, null, 2));
  console.log(`✓ Test report saved to: ${reportFileName}`);
  
  // Exit with appropriate code
  const allPassed = test1Result && test2Result && test3Result && test4Result && 
                    test5Result && test6Result && test7Result;
  process.exit(allPassed ? 0 : 1);
}

// Run tests
main().catch(error => {
  console.error('\n✗ UNEXPECTED ERROR:', error);
  process.exit(1);
});
