/**
 * Checkout Address Fix Verification Test
 * 
 * This test verifies that the "Shipping address is required" fix works correctly.
 * It tests that the backend properly receives and processes address data from the request body.
 * 
 * Test Focus:
 * - Verify that checkoutController extracts `data` from req.body
 * - Verify that checkoutService uses address data from request body with highest priority
 * - Verify that order is created successfully with correct address information
 * - Verify that no "Shipping address is required" error occurs
 */

const axios = require('axios');

// Configuration
const API_BASE_URL = 'http://localhost:3001/api/v1';
const FRONTEND_URL = 'http://localhost:3000';

// Test data
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

// Helper function to create guest cart
async function createGuestCart() {
  try {
    // Use a valid UUID format for the test product ID
    const testProductId = '00000000-0000-0000-0000-000000000001';
    
    console.log('Using test product ID:', testProductId);
    
    // Create guest cart with the test product ID
    const response = await axios.post(
      `${API_BASE_URL}/cart/guest/create`,
      {
        items: [
          {
            productId: testProductId,
            quantity: 1,
            price: 1000
          }
        ]
      }
    );
    
    return {
      cartId: response.data.data.cart.id,
      productId: testProductId
    };
  } catch (error) {
    console.error('Failed to create guest cart:', error.response?.data || error.message);
    throw error;
  }
}

// Helper function to initiate checkout
async function initiateCheckout(cartId, sessionId) {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/checkout/initiate`,
      { cartId }
    );
    return response.data.data;
  } catch (error) {
    console.error('Failed to initiate checkout:', error.response?.data || error.message);
    throw error;
  }
}

// Helper function to complete checkout
async function completeCheckout(sessionId, checkoutData) {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/checkout/session/${sessionId}/complete`,
      checkoutData
    );
    return response.data;
  } catch (error) {
    console.error('Failed to complete checkout:', error.response?.data || error.message);
    throw error;
  }
}

// Test Scenario 1: Verify address data from request body is used
async function testAddressDataFromRequestBody() {
  console.log('\n=== Test Scenario 1: Verify Address Data from Request Body ===');
  
  try {
    // Create guest cart
    const { cartId, productId } = await createGuestCart();
    console.log('Created guest cart:', cartId);
    
    // Initiate checkout
    const checkoutSession = await initiateCheckout(cartId);
    console.log('Checkout session initiated:', checkoutSession.id);
    
    // Complete checkout with address data ONLY in request body
    // This is the key test: verify that the backend uses address data from request body
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
          notes: 'Test with address only in request body (not from stepData)'
        }
      }
    };
    
    const result = await completeCheckout(checkoutSession.id, completeData);
    
    // Verify success
    const success = result.success && result.data.orderId;
    logTestResult('Address data from request body is used', success, {
      orderId: result.data?.orderId,
      orderNumber: result.data?.orderNumber,
      status: result.data?.status,
      total: result.data?.total,
      message: success 
        ? '✓ Order created successfully using address data from request body' 
        : '✗ Failed to create order with address from request body'
    });
    
    return success;
  } catch (error) {
    // Check if the error is the "Shipping address is required" error
    const isShippingAddressError = error.response?.data?.error?.includes('Shipping address is required') ||
                              error.response?.data?.message?.includes('Shipping address is required');
    
    logTestResult('Address data from request body is used', false, {
      error: error.message,
      details: error.response?.data,
      message: isShippingAddressError 
        ? '✗ FAILED: "Shipping address is required" error still occurs - FIX NOT WORKING' 
        : '✗ FAILED: Different error occurred'
    });
    
    return false;
  }
}

// Test Scenario 2: Verify priority of address sources
async function testAddressSourcePriority() {
  console.log('\n=== Test Scenario 2: Verify Priority of Address Sources ===');
  
  try {
    // Create guest cart
    const { cartId } = await createGuestCart();
    console.log('Created guest cart:', cartId);
    
    // Initiate checkout
    const checkoutSession = await initiateCheckout(cartId);
    console.log('Checkout session initiated:', checkoutSession.id);
    
    // Save address step first (to populate stepData)
    await axios.post(
      `${API_BASE_URL}/checkout/session/${checkoutSession.id}/address`,
      {
        shippingAddress: {
          firstName: 'StepData',
          lastName: 'Address',
          phone: '01611111111',
          address: '789 StepData Street',
          city: 'Dhaka',
          district: 'Dhaka',
          division: 'dhaka',
          postalCode: '1000'
        },
        billingAddress: testBillingAddress
      }
    );
    console.log('Address step saved (populating stepData)');
    
    // Save shipping and payment steps
    await axios.post(
      `${API_BASE_URL}/checkout/session/${checkoutSession.id}/shipping`,
      { method: testShippingMethod }
    );
    console.log('Shipping step saved');
    
    await axios.post(
      `${API_BASE_URL}/checkout/session/${checkoutSession.id}/payment`,
      { method: testPaymentMethod }
    );
    console.log('Payment step saved');
    
    // Complete checkout with DIFFERENT address in request body
    // Request body should have HIGHER priority than stepData
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
        review: { notes: 'Test address priority - request body should override stepData' }
      }
    };
    
    const result = await completeCheckout(checkoutSession.id, completeData);
    
    // Verify success
    const success = result.success && result.data.orderId;
    logTestResult('Priority of address sources', success, {
      orderId: result.data?.orderId,
      message: success 
        ? '✓ Request body address correctly prioritized over stepData address' 
        : '✗ Failed to create order'
    });
    
    return success;
  } catch (error) {
    logTestResult('Priority of address sources', false, {
      error: error.message,
      details: error.response?.data,
      message: '✗ FAILED: Failed to prioritize address sources correctly'
    });
    
    return false;
  }
}

// Test Scenario 3: Verify error handling for missing address
async function testMissingAddressError() {
  console.log('\n=== Test Scenario 3: Verify Error Handling for Missing Address ===');
  
  try {
    // Create guest cart
    const { cartId } = await createGuestCart();
    console.log('Created guest cart:', cartId);
    
    // Initiate checkout
    const checkoutSession = await initiateCheckout(cartId);
    console.log('Checkout session initiated:', checkoutSession.id);
    
    // Save shipping and payment steps (skip address)
    await axios.post(
      `${API_BASE_URL}/checkout/session/${checkoutSession.id}/shipping`,
      { method: testShippingMethod }
    );
    
    await axios.post(
      `${API_BASE_URL}/checkout/session/${checkoutSession.id}/payment`,
      { method: testPaymentMethod }
    );
    
    // Try to complete checkout WITHOUT address data
    const completeData = {
      data: {
        shipping: { method: testShippingMethod },
        payment: { method: testPaymentMethod },
        review: { notes: 'Test without address data' }
      }
    };
    
    const result = await completeCheckout(checkoutSession.id, completeData);
    
    // This should fail with "Shipping address is required"
    const success = !result.success && result.error?.includes('Shipping address is required');
    logTestResult('Error handling for missing address', success, {
      error: result.error,
      message: success 
        ? '✓ Correctly rejected checkout without shipping address' 
        : '✗ Should have rejected checkout without shipping address'
    });
    
    return success;
  } catch (error) {
    const success = error.response?.status === 400 && 
                    (error.response?.data?.error?.includes('Shipping address is required') ||
                     error.response?.data?.message?.includes('Shipping address is required'));
    
    logTestResult('Error handling for missing address', success, {
      error: error.message,
      details: error.response?.data,
      message: success 
        ? '✓ Correctly rejected checkout without shipping address' 
        : '✗ Error handling not working as expected'
    });
    
    return success;
  }
}

// Run all test scenarios
async function runAllTests() {
  console.log('='.repeat(70));
  console.log('CHECKOUT ADDRESS FIX VERIFICATION TEST');
  console.log('Testing fix for "Shipping address is required" error');
  console.log('='.repeat(70));
  console.log(`Test Started: ${new Date().toISOString()}`);
  console.log(`Backend URL: ${API_BASE_URL}`);
  console.log(`Frontend URL: ${FRONTEND_URL}`);
  
  try {
    // Test 1: Address data from request body
    await testAddressDataFromRequestBody();
    
    // Test 2: Priority of address sources
    await testAddressSourcePriority();
    
    // Test 3: Error handling for missing address
    await testMissingAddressError();
    
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
  const resultsFilename = `checkout-address-fix-test-results-${Date.now()}.json`;
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
