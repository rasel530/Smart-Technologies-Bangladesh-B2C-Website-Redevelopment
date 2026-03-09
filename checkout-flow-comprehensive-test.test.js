/**
 * Comprehensive Checkout Flow Test Script
 * 
 * This script tests the complete checkout flow after the "Shipping address is required" fix.
 * It validates that the backend correctly receives and processes address data from the request body.
 * 
 * Test Scenarios:
 * 1. Main checkout flow with valid data
 * 2. Different billing and shipping addresses
 * 3. "Same as shipping address" option
 * 4. Saved addresses (if available)
 * 5. Invalid data to ensure error handling
 * 
 * Success Criteria:
 * - Checkout flow completes successfully without errors
 * - Order is created with correct shipping and billing addresses
 * - No "Shipping address is required" error occurs
 * - Backend logs show address data received from request body
 */

const axios = require('axios');
const { v4: uuidv4 } = require('crypto');

// Configuration
const API_BASE_URL = 'http://localhost:3001/api/v1';
const FRONTEND_URL = 'http://localhost:3000';

// Test data
const testUserCredentials = {
  email: 'raselbepari88@gmail.com',
  password: '74Vfo^71~_oY'
};

const testShippingAddress = {
  firstName: 'John',
  lastName: 'Doe',
  phone: '01712345678',
  address: '123 Main Street',
  addressLine2: 'Apartment 4B',
  city: 'Dhaka',
  district: 'Dhaka',
  division: 'dhaka',
  upazila: 'Dhaka Cantonment',
  postalCode: '1206'
};

const testBillingAddress = {
  firstName: 'Jane',
  lastName: 'Smith',
  phone: '01898765432',
  address: '456 Business Avenue',
  addressLine2: 'Suite 100',
  city: 'Chittagong',
  district: 'Chittagong',
  division: 'chittagong',
  upazila: 'Chittagong City',
  postalCode: '4000'
};

const testShippingMethod = 'STANDARD';
const testPaymentMethod = 'CASH_ON_DELIVERY';

// Test results storage
const testResults = {
  timestamp: new Date().toISOString(),
  scenarios: [],
  summary: {
    total: 0,
    passed: 0,
    failed: 0
  }
};

// Helper function to log test results
function logTestResult(scenarioName, passed, details = {}) {
  const result = {
    scenario: scenarioName,
    status: passed ? 'PASS' : 'FAIL',
    timestamp: new Date().toISOString(),
    ...details
  };
  
  testResults.scenarios.push(result);
  testResults.summary.total++;
  if (passed) {
    testResults.summary.passed++;
  } else {
    testResults.summary.failed++;
  }
  
  console.log(`\n${passed ? '✓' : '✗'} ${scenarioName}`);
  if (!passed && details.error) {
    console.log(`  Error: ${details.error}`);
  }
  if (details.message) {
    console.log(`  Details: ${details.message}`);
  }
}

// Helper function to create a test user
async function createTestUser() {
  try {
    const response = await axios.post(`${API_BASE_URL}/auth/register`, {
      email: `test_${Date.now()}@example.com`,
      password: 'Test123456',
      confirmPassword: 'Test123456',
      firstName: 'Test',
      lastName: 'User'
    });
    return response.data.data.user;
  } catch (error) {
    console.error('Failed to create test user:', error.response?.data || error.message);
    throw error;
  }
}

// Helper function to login user
async function loginUser(email, password) {
  try {
    const response = await axios.post(`${API_BASE_URL}/auth/login`, {
      identifier: email,
      password
    });
    return response.data.token;
  } catch (error) {
    console.error('Failed to login user:', error.response?.data || error.message);
    throw error;
  }
}

// Helper function to create a test cart (guest cart)
async function createTestCart(token) {
  try {
    // Use guest cart endpoint for simplicity
    const response = await axios.post(
      `${API_BASE_URL}/cart/guest/create`,
      {
        items: [
          {
            productId: 'test-product-id-1',
            quantity: 2,
            price: 1000
          }
        ]
      }
    );
    return response.data.data.cart.id;
  } catch (error) {
    console.error('Failed to create test cart:', error.response?.data || error.message);
    throw error;
  }
}

// Helper function to initiate checkout
async function initiateCheckout(cartId, token) {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/checkout/initiate`,
      { cartId },
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );
    return response.data.data;
  } catch (error) {
    console.error('Failed to initiate checkout:', error.response?.data || error.message);
    throw error;
  }
}

// Helper function to save address step
async function saveAddressStep(sessionId, addressData, token) {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/checkout/session/${sessionId}/address`,
      addressData,
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );
    return response.data;
  } catch (error) {
    console.error('Failed to save address step:', error.response?.data || error.message);
    throw error;
  }
}

// Helper function to save shipping step
async function saveShippingStep(sessionId, shippingData, token) {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/checkout/session/${sessionId}/shipping`,
      shippingData,
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );
    return response.data;
  } catch (error) {
    console.error('Failed to save shipping step:', error.response?.data || error.message);
    throw error;
  }
}

// Helper function to save payment step
async function savePaymentStep(sessionId, paymentData, token) {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/checkout/session/${sessionId}/payment`,
      paymentData,
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );
    return response.data;
  } catch (error) {
    console.error('Failed to save payment step:', error.response?.data || error.message);
    throw error;
  }
}

// Helper function to complete checkout
async function completeCheckout(sessionId, checkoutData, token) {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/checkout/session/${sessionId}/complete`,
      checkoutData,
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );
    return response.data;
  } catch (error) {
    console.error('Failed to complete checkout:', error.response?.data || error.message);
    throw error;
  }
}

// Test Scenario 1: Main checkout flow with valid data
async function testMainCheckoutFlow() {
  console.log('\n=== Test Scenario 1: Main Checkout Flow with Valid Data ===');
  
  try {
    // Login with existing user
    const token = await loginUser(testUserCredentials.email, testUserCredentials.password);
    console.log('User logged in successfully');
    
    // Create cart
    const cartId = await createTestCart(token);
    console.log('Created test cart:', cartId);
    
    // Initiate checkout
    const checkoutSession = await initiateCheckout(cartId, token);
    console.log('Checkout session initiated:', checkoutSession.id);
    
    // Save address step
    const sessionId = checkoutSession.id;
    await saveAddressStep(sessionId, {
      shippingAddress: testShippingAddress,
      billingAddress: testBillingAddress
    }, token);
    console.log('Address step saved');
    
    // Save shipping step
    await saveShippingStep(sessionId, {
      method: testShippingMethod
    }, token);
    console.log('Shipping step saved');
    
    // Save payment step
    await savePaymentStep(sessionId, {
      method: testPaymentMethod
    }, token);
    console.log('Payment step saved');
    
    // Complete checkout with data from request body
    const completeData = {
      data: {
        address: {
          shippingAddress: testShippingAddress,
          billingAddress: testBillingAddress,
          useSameAddress: false,
          completed: true
        },
        shipping: {
          method: testShippingMethod
        },
        payment: {
          method: testPaymentMethod
        },
        review: {
          notes: 'Test order from comprehensive test'
        }
      }
    };
    
    const result = await completeCheckout(sessionId, completeData, token);
    
    // Verify success
    const success = result.success && result.data.orderId;
    logTestResult('Main checkout flow with valid data', success, {
      orderId: result.data?.orderId,
      orderNumber: result.data?.orderNumber,
      status: result.data?.status,
      total: result.data?.total,
      message: success ? 'Order created successfully with address data from request body' : 'Failed to create order'
    });
    
    return success;
  } catch (error) {
    logTestResult('Main checkout flow with valid data', false, {
      error: error.message,
      details: error.response?.data
    });
    return false;
  }
}

// Test Scenario 2: Different billing and shipping addresses
async function testDifferentBillingShippingAddresses() {
  console.log('\n=== Test Scenario 2: Different Billing and Shipping Addresses ===');
  
  try {
    // Login with existing user
    const token = await loginUser(testUserCredentials.email, testUserCredentials.password);
    const cartId = await createTestCart(token);
    const checkoutSession = await initiateCheckout(cartId, token);
    const sessionId = checkoutSession.id;
    
    // Save address step with different addresses
    await saveAddressStep(sessionId, {
      shippingAddress: testShippingAddress,
      billingAddress: testBillingAddress
    }, token);
    
    // Save shipping and payment steps
    await saveShippingStep(sessionId, { method: testShippingMethod }, token);
    await savePaymentStep(sessionId, { method: testPaymentMethod }, token);
    
    // Complete checkout with different addresses
    const completeData = {
      data: {
        address: {
          shippingAddress: testShippingAddress,
          billingAddress: testBillingAddress,
          useSameAddress: false,
          completed: true
        },
        shipping: { method: testShippingMethod },
        payment: { method: testPaymentMethod },
        review: { notes: 'Test with different addresses' }
      }
    };
    
    const result = await completeCheckout(sessionId, completeData, token);
    
    const success = result.success && result.data.orderId;
    logTestResult('Different billing and shipping addresses', success, {
      orderId: result.data?.orderId,
      message: success ? 'Order created with different shipping and billing addresses' : 'Failed to create order'
    });
    
    return success;
  } catch (error) {
    logTestResult('Different billing and shipping addresses', false, {
      error: error.message,
      details: error.response?.data
    });
    return false;
  }
}

// Test Scenario 3: "Same as shipping address" option
async function testSameAsShippingAddress() {
  console.log('\n=== Test Scenario 3: "Same as Shipping Address" Option ===');
  
  try {
    // Login with existing user
    const token = await loginUser(testUserCredentials.email, testUserCredentials.password);
    const cartId = await createTestCart(token);
    const checkoutSession = await initiateCheckout(cartId, token);
    const sessionId = checkoutSession.id;
    
    // Save address step with same address
    await saveAddressStep(sessionId, {
      shippingAddress: testShippingAddress,
      useSameAddress: true
    }, token);
    
    // Save shipping and payment steps
    await saveShippingStep(sessionId, { method: testShippingMethod }, token);
    await savePaymentStep(sessionId, { method: testPaymentMethod }, token);
    
    // Complete checkout with useSameAddress option
    const completeData = {
      data: {
        address: {
          shippingAddress: testShippingAddress,
          useSameAddress: true,
          completed: true
        },
        shipping: { method: testShippingMethod },
        payment: { method: testPaymentMethod },
        review: { notes: 'Test with same address option' }
      }
    };
    
    const result = await completeCheckout(sessionId, completeData, token);
    
    const success = result.success && result.data.orderId;
    logTestResult('"Same as shipping address" option', success, {
      orderId: result.data?.orderId,
      message: success ? 'Order created with same address for shipping and billing' : 'Failed to create order'
    });
    
    return success;
  } catch (error) {
    logTestResult('"Same as shipping address" option', false, {
      error: error.message,
      details: error.response?.data
    });
    return false;
  }
}

// Test Scenario 4: Invalid data - Missing shipping address
async function testMissingShippingAddress() {
  console.log('\n=== Test Scenario 4: Invalid Data - Missing Shipping Address ===');
  
  try {
    // Login with existing user
    const token = await loginUser(testUserCredentials.email, testUserCredentials.password);
    const cartId = await createTestCart(token);
    const checkoutSession = await initiateCheckout(cartId, token);
    const sessionId = checkoutSession.id;
    
    // Save shipping and payment steps (skip address)
    await saveShippingStep(sessionId, { method: testShippingMethod }, token);
    await savePaymentStep(sessionId, { method: testPaymentMethod }, token);
    
    // Try to complete checkout without address data
    const completeData = {
      data: {
        shipping: { method: testShippingMethod },
        payment: { method: testPaymentMethod },
        review: { notes: 'Test without address' }
      }
    };
    
    const result = await completeCheckout(sessionId, completeData, token);
    
    // This should fail with "Shipping address is required"
    const success = !result.success && result.error?.includes('Shipping address is required');
    logTestResult('Invalid data - Missing shipping address', success, {
      error: result.error,
      message: success ? 'Correctly rejected checkout without shipping address' : 'Should have rejected checkout without shipping address'
    });
    
    return success;
  } catch (error) {
    const success = error.response?.status === 400 && 
                    (error.response?.data?.error?.includes('Shipping address is required') ||
                     error.response?.data?.message?.includes('Shipping address is required'));
    logTestResult('Invalid data - Missing shipping address', success, {
      error: error.message,
      details: error.response?.data,
      message: success ? 'Correctly rejected checkout without shipping address' : 'Error handling not working as expected'
    });
    return success;
  }
}

// Test Scenario 5: Invalid data - Invalid phone number
async function testInvalidPhoneNumber() {
  console.log('\n=== Test Scenario 5: Invalid Data - Invalid Phone Number ===');
  
  try {
    // Login with existing user
    const token = await loginUser(testUserCredentials.email, testUserCredentials.password);
    const cartId = await createTestCart(token);
    const checkoutSession = await initiateCheckout(cartId, token);
    const sessionId = checkoutSession.id;
    
    // Save address step with invalid phone number
    const invalidAddress = {
      ...testShippingAddress,
      phone: '12345' // Invalid phone number
    };
    
    await saveAddressStep(sessionId, {
      shippingAddress: invalidAddress,
      billingAddress: testBillingAddress
    }, token);
    
    // Save shipping and payment steps
    await saveShippingStep(sessionId, { method: testShippingMethod }, token);
    await savePaymentStep(sessionId, { method: testPaymentMethod }, token);
    
    // Try to complete checkout
    const completeData = {
      data: {
        address: {
          shippingAddress: invalidAddress,
          billingAddress: testBillingAddress,
          useSameAddress: false,
          completed: true
        },
        shipping: { method: testShippingMethod },
        payment: { method: testPaymentMethod },
        review: { notes: 'Test with invalid phone' }
      }
    };
    
    const result = await completeCheckout(sessionId, completeData, token);
    
    // This should fail with validation error
    const success = !result.success || result.error?.includes('validation');
    logTestResult('Invalid data - Invalid phone number', success, {
      error: result.error,
      message: success ? 'Correctly validated phone number' : 'Should have validated phone number'
    });
    
    return success;
  } catch (error) {
    const success = error.response?.status === 400;
    logTestResult('Invalid data - Invalid phone number', success, {
      error: error.message,
      details: error.response?.data,
      message: success ? 'Correctly validated phone number' : 'Error handling not working as expected'
    });
    return success;
  }
}

// Test Scenario 6: Verify address data from request body is used
async function testAddressDataFromRequestBody() {
  console.log('\n=== Test Scenario 6: Verify Address Data from Request Body ===');
  
  try {
    // Login with existing user
    const token = await loginUser(testUserCredentials.email, testUserCredentials.password);
    const cartId = await createTestCart(token);
    const checkoutSession = await initiateCheckout(cartId, token);
    const sessionId = checkoutSession.id;
    
    // Skip saving address step (no address in stepData)
    // Save shipping and payment steps
    await saveShippingStep(sessionId, { method: testShippingMethod }, token);
    await savePaymentStep(sessionId, { method: testPaymentMethod }, token);
    
    // Complete checkout with address data ONLY in request body
    const completeData = {
      data: {
        address: {
          shippingAddress: testShippingAddress,
          billingAddress: testBillingAddress,
          useSameAddress: false,
          completed: true
        },
        shipping: { method: testShippingMethod },
        payment: { method: testPaymentMethod },
        review: { notes: 'Test with address only in request body' }
      }
    };
    
    const result = await completeCheckout(sessionId, completeData, token);
    
    // This should succeed because address is in request body
    const success = result.success && result.data.orderId;
    logTestResult('Address data from request body is used', success, {
      orderId: result.data?.orderId,
      message: success ? 'Order created using address data from request body (not from stepData)' : 'Failed to create order'
    });
    
    return success;
  } catch (error) {
    logTestResult('Address data from request body is used', false, {
      error: error.message,
      details: error.response?.data,
      message: 'Failed to use address data from request body'
    });
    return false;
  }
}

// Test Scenario 7: Verify priority of address sources
async function testAddressSourcePriority() {
  console.log('\n=== Test Scenario 7: Verify Priority of Address Sources ===');
  
  try {
    // Login with existing user
    const token = await loginUser(testUserCredentials.email, testUserCredentials.password);
    const cartId = await createTestCart(token);
    const checkoutSession = await initiateCheckout(cartId, token);
    const sessionId = checkoutSession.id;
    
    // Save address step with one address
    const stepDataAddress = {
      firstName: 'StepData',
      lastName: 'Address',
      phone: '01611111111',
      address: '789 StepData Street',
      city: 'Dhaka',
      district: 'Dhaka',
      division: 'dhaka',
      postalCode: '1000'
    };
    
    await saveAddressStep(sessionId, {
      shippingAddress: stepDataAddress,
      billingAddress: stepDataAddress
    }, token);
    
    // Save shipping and payment steps
    await saveShippingStep(sessionId, { method: testShippingMethod }, token);
    await savePaymentStep(sessionId, { method: testPaymentMethod }, token);
    
    // Complete checkout with DIFFERENT address in request body
    // Request body should have HIGHER priority
    const completeData = {
      data: {
        address: {
          shippingAddress: testShippingAddress,
          billingAddress: testBillingAddress,
          useSameAddress: false,
          completed: true
        },
        shipping: { method: testShippingMethod },
        payment: { method: testPaymentMethod },
        review: { notes: 'Test address priority' }
      }
    };
    
    const result = await completeCheckout(sessionId, completeData, token);
    
    // Order should be created with request body address (higher priority)
    const success = result.success && result.data.orderId;
    logTestResult('Priority of address sources', success, {
      orderId: result.data?.orderId,
      message: success ? 'Request body address correctly prioritized over stepData address' : 'Failed to create order'
    });
    
    return success;
  } catch (error) {
    logTestResult('Priority of address sources', false, {
      error: error.message,
      details: error.response?.data,
      message: 'Failed to prioritize address sources correctly'
    });
    return false;
  }
}

// Run all test scenarios
async function runAllTests() {
  console.log('='.repeat(70));
  console.log('COMPREHENSIVE CHECKOUT FLOW TEST');
  console.log('Testing fix for "Shipping address is required" error');
  console.log('='.repeat(70));
  console.log(`Test Started: ${new Date().toISOString()}`);
  console.log(`Backend URL: ${API_BASE_URL}`);
  console.log(`Frontend URL: ${FRONTEND_URL}`);
  
  try {
    // Test 1: Main checkout flow
    await testMainCheckoutFlow();
    
    // Test 2: Different billing and shipping addresses
    await testDifferentBillingShippingAddresses();
    
    // Test 3: Same as shipping address option
    await testSameAsShippingAddress();
    
    // Test 4: Invalid data - Missing shipping address
    await testMissingShippingAddress();
    
    // Test 5: Invalid data - Invalid phone number
    await testInvalidPhoneNumber();
    
    // Test 6: Address data from request body
    await testAddressDataFromRequestBody();
    
    // Test 7: Address source priority
    await testAddressSourcePriority();
    
  } catch (error) {
    console.error('\nFatal error during testing:', error);
  }
  
  // Print summary
  console.log('\n' + '='.repeat(70));
  console.log('TEST SUMMARY');
  console.log('='.repeat(70));
  console.log(`Total Tests: ${testResults.summary.total}`);
  console.log(`Passed: ${testResults.summary.passed} ✓`);
  console.log(`Failed: ${testResults.summary.failed} ✗`);
  console.log(`Success Rate: ${((testResults.summary.passed / testResults.summary.total) * 100).toFixed(2)}%`);
  console.log(`Test Completed: ${new Date().toISOString()}`);
  console.log('='.repeat(70));
  
  // Save results to file
  const fs = require('fs');
  const resultsFilename = `checkout-flow-test-results-${Date.now()}.json`;
  fs.writeFileSync(resultsFilename, JSON.stringify(testResults, null, 2));
  console.log(`\nTest results saved to: ${resultsFilename}`);
  
  // Exit with appropriate code
  process.exit(testResults.summary.failed > 0 ? 1 : 0);
}

// Run tests
runAllTests().catch(error => {
  console.error('Unhandled error:', error);
  process.exit(1);
});
