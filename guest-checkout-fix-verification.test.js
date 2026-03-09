/**
 * Guest Checkout Fix Verification Test
 * 
 * This test verifies the fix for the "Cart not found" error in guest checkout.
 * The fix adds:
 * 1. Multiple cart lookup strategies (by id, sessionId, deviceId)
 * 2. Enhanced diagnostic logging at each step
 * 3. Better error handling for cart totals calculation
 * 4. Better error handling for guest session creation
 * 5. Fallback strategy to handle sessionId vs cart.id confusion
 */

const http = require('http');

// Test configuration
const API_BASE_URL = 'http://localhost:3001/api/v1';
const TEST_CART_ID = '4f553681-2713-4564-be70-c605e42ed883';
const TEST_SESSION_ID = '30841788-dc0e-4034-9d65-a85693ffa4d2';
const TEST_DEVICE_ID = 'test-device-123';

/**
 * Helper function to make HTTP requests
 */
async function makeRequest(method, endpoint, data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3001,
      path: `/api/v1${endpoint}`,
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    if (data) {
      options.headers['Content-Length'] = Buffer.byteLength(JSON.stringify(data));
    }

    const req = http.request(options, (res) => {
      let body = '';

      res.on('data', (chunk) => {
        body += chunk;
      });

      res.on('end', () => {
        try {
          const response = JSON.parse(body);
          resolve(response);
        } catch (error) {
          reject(error);
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

/**
 * Test 1: Create a guest cart
 */
async function test1_createGuestCart() {
  console.log('\n=== Test 1: Create Guest Cart ===');
  
  try {
    const response = await makeRequest('POST', '/cart/guest/create', {
      items: [
        {
          productId: '4010caae-464e-4787-ad8f-ee04096100d0',
          quantity: 1,
          price: 5000
        }
      ]
    });

    console.log('Status:', response.statusCode);
    console.log('Response:', JSON.stringify(response, null, 2));

    if (response.success) {
      console.log('✓ Guest cart created successfully');
      console.log('  Cart ID:', response.data.cart.id);
      console.log('  Session ID:', response.data.sessionId);
      return {
        success: true,
        cartId: response.data.cart.id,
        sessionId: response.data.sessionId
      };
    } else {
      console.log('✗ Failed to create guest cart');
      return { success: false };
    }
  } catch (error) {
    console.error('✗ Error creating guest cart:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Test 2: Verify cart exists by cart ID
 */
async function test2_verifyCartById() {
  console.log('\n=== Test 2: Verify Cart by ID ===');
  
  try {
    const response = await makeRequest('GET', `/cart/guest/${TEST_CART_ID}`);

    console.log('Status:', response.statusCode);
    console.log('Response:', JSON.stringify(response, null, 2));

    if (response.success) {
      console.log('✓ Cart found by ID');
      console.log('  Cart ID:', response.data.cart.id);
      console.log('  Item count:', response.data.cart.items.length);
      console.log('  Cart status:', response.data.cart.status);
      return { success: true };
    } else {
      console.log('✗ Cart not found by ID');
      return { success: false };
    }
  } catch (error) {
    console.error('✗ Error verifying cart by ID:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Test 3: Verify cart exists by session ID
 */
async function test3_verifyCartBySessionId() {
  console.log('\n=== Test 3: Verify Cart by Session ID ===');
  
  try {
    const response = await makeRequest('GET', `/cart/guest/${TEST_SESSION_ID}`);

    console.log('Status:', response.statusCode);
    console.log('Response:', JSON.stringify(response, null, 2));

    if (response.success) {
      console.log('✓ Cart found by Session ID');
      console.log('  Cart ID:', response.data.cart.id);
      console.log('  Item count:', response.data.cart.items.length);
      console.log('  Cart status:', response.data.cart.status);
      return { success: true };
    } else {
      console.log('✗ Cart not found by Session ID');
      return { success: false };
    }
  } catch (error) {
    console.error('✗ Error verifying cart by Session ID:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Test 4: Initiate guest checkout with cart ID
 */
async function test4_initiateCheckoutWithCartId() {
  console.log('\n=== Test 4: Initiate Checkout with Cart ID ===');
  
  try {
    const response = await makeRequest('POST', '/guest/checkout/initiate', {
      cartId: TEST_CART_ID,
      platform: 'desktop',
      language: 'en'
    });

    console.log('Status:', response.statusCode);
    console.log('Response:', JSON.stringify(response, null, 2));

    if (response.success) {
      console.log('✓ Guest checkout initiated successfully');
      console.log('  Session ID:', response.data.sessionId);
      console.log('  Cart ID:', response.data.cartId);
      console.log('  Totals:', response.data.totals);
      return { success: true };
    } else {
      console.log('✗ Failed to initiate guest checkout');
      console.log('  Error:', response.error);
      console.log('  Message:', response.message);
      return { success: false, error: response.error };
    }
  } catch (error) {
    console.error('✗ Error initiating checkout:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Test 5: Initiate guest checkout with session ID
 */
async function test5_initiateCheckoutWithSessionId() {
  console.log('\n=== Test 5: Initiate Checkout with Session ID ===');
  
  try {
    const response = await makeRequest('POST', '/guest/checkout/initiate', {
      cartId: TEST_SESSION_ID,
      platform: 'desktop',
      language: 'en'
    });

    console.log('Status:', response.statusCode);
    console.log('Response:', JSON.stringify(response, null, 2));

    if (response.success) {
      console.log('✓ Guest checkout initiated successfully');
      console.log('  Session ID:', response.data.sessionId);
      console.log('  Cart ID:', response.data.cartId);
      console.log('  Totals:', response.data.totals);
      return { success: true };
    } else {
      console.log('✗ Failed to initiate guest checkout');
      console.log('  Error:', response.error);
      console.log('  Message:', response.message);
      return { success: false, error: response.error };
    }
  } catch (error) {
    console.error('✗ Error initiating checkout:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Test 6: Initiate guest checkout with deviceId
 */
async function test6_initiateCheckoutWithDeviceId() {
  console.log('\n=== Test 6: Initiate Checkout with Device ID ===');
  
  try {
    const response = await makeRequest('POST', '/guest/checkout/initiate', {
      cartId: TEST_CART_ID,
      deviceId: TEST_DEVICE_ID,
      platform: 'desktop',
      language: 'en'
    });

    console.log('Status:', response.statusCode);
    console.log('Response:', JSON.stringify(response, null, 2));

    if (response.success) {
      console.log('✓ Guest checkout initiated successfully');
      console.log('  Session ID:', response.data.sessionId);
      console.log('  Cart ID:', response.data.cartId);
      console.log('  Totals:', response.data.totals);
      return { success: true };
    } else {
      console.log('✗ Failed to initiate guest checkout');
      console.log('  Error:', response.error);
      console.log('  Message:', response.message);
      return { success: false, error: response.error };
    }
  } catch (error) {
    console.error('✗ Error initiating checkout:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Test 7: Initiate guest checkout with invalid cart ID
 */
async function test7_initiateCheckoutWithInvalidCartId() {
  console.log('\n=== Test 7: Initiate Checkout with Invalid Cart ID ===');
  
  try {
    const response = await makeRequest('POST', '/guest/checkout/initiate', {
      cartId: 'invalid-cart-id',
      platform: 'desktop',
      language: 'en'
    });

    console.log('Status:', response.statusCode);
    console.log('Response:', JSON.stringify(response, null, 2));

    if (response.statusCode === 400) {
      console.log('✓ Correctly rejected invalid cart ID');
      return { success: true };
    } else {
      console.log('✗ Unexpected response for invalid cart ID');
      return { success: false };
    }
  } catch (error) {
    console.error('✗ Error testing invalid cart ID:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Test 8: Initiate guest checkout with non-existent cart ID
 */
async function test8_initiateCheckoutWithNonExistentCartId() {
  console.log('\n=== Test 8: Initiate Checkout with Non-Existent Cart ID ===');
  
  try {
    const response = await makeRequest('POST', '/guest/checkout/initiate', {
      cartId: '00000000-0000-0000-0000-000000000000',
      platform: 'desktop',
      language: 'en'
    });

    console.log('Status:', response.statusCode);
    console.log('Response:', JSON.stringify(response, null, 2));

    if (response.statusCode === 404) {
      console.log('✓ Correctly returned 404 for non-existent cart');
      return { success: true };
    } else if (response.statusCode === 500) {
      console.log('✗ Got 500 error for non-existent cart (should be 404)');
      console.log('  Error:', response.error);
      return { success: false, error: 'Got 500 instead of 404' };
    } else {
      console.log('✗ Unexpected status code:', response.statusCode);
      return { success: false };
    }
  } catch (error) {
    console.error('✗ Error testing non-existent cart:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Main test runner
 */
async function runTests() {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║     Guest Checkout Fix Verification Test Suite                     ║');
  console.log('╚══════════════════════════════════════════════════════════╝\n');

  const results = [];

  // Test 1: Create guest cart
  const result1 = await test1_createGuestCart();
  results.push({ test: 'Create Guest Cart', ...result1 });
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Test 2: Verify cart by ID
  const result2 = await test2_verifyCartById();
  results.push({ test: 'Verify Cart by ID', ...result2 });
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Test 3: Verify cart by Session ID
  const result3 = await test3_verifyCartBySessionId();
  results.push({ test: 'Verify Cart by Session ID', ...result3 });
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Test 4: Initiate checkout with cart ID
  const result4 = await test4_initiateCheckoutWithCartId();
  results.push({ test: 'Initiate Checkout with Cart ID', ...result4 });
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Test 5: Initiate checkout with session ID
  const result5 = await test5_initiateCheckoutWithSessionId();
  results.push({ test: 'Initiate Checkout with Session ID', ...result5 });
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Test 6: Initiate checkout with device ID
  const result6 = await test6_initiateCheckoutWithDeviceId();
  results.push({ test: 'Initiate Checkout with Device ID', ...result6 });
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Test 7: Invalid cart ID
  const result7 = await test7_initiateCheckoutWithInvalidCartId();
  results.push({ test: 'Initiate Checkout with Invalid Cart ID', ...result7 });
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Test 8: Non-existent cart ID
  const result8 = await test8_initiateCheckoutWithNonExistentCartId();
  results.push({ test: 'Initiate Checkout with Non-Existent Cart ID', ...result8 });
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Print summary
  console.log('\n╔═════════════════════════════════════════════════════════════╗');
  console.log('║                        Test Summary                                ║');
  console.log('╠══════════════════════════════════════════════════════════╣\n');

  const passed = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;

  console.log(`Total Tests: ${results.length}`);
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed}`);
  console.log(`Success Rate: ${((passed / results.length) * 100).toFixed(1)}%`);

  console.log('\nDetailed Results:');
  results.forEach((result, index) => {
    const status = result.success ? '✓ PASS' : '✗ FAIL';
    console.log(`${index + 1}. ${status}: ${result.test}`);
    if (result.error) {
      console.log(`   Error: ${result.error}`);
    }
  });

  console.log('\n╚════════════════════════════════════════════════════════════╝\n');

  return {
    total: results.length,
    passed,
    failed,
    successRate: ((passed / results.length) * 100).toFixed(1)
  };
}

// Run tests if executed directly
if (require.main === module) {
  runTests().then(summary => {
    process.exit(summary.failed > 0 ? 1 : 0);
  });
}

module.exports = {
  runTests,
  test1_createGuestCart,
  test2_verifyCartById,
  test3_verifyCartBySessionId,
  test4_initiateCheckoutWithCartId,
  test5_initiateCheckoutWithSessionId,
  test6_initiateCheckoutWithDeviceId,
  test7_initiateCheckoutWithInvalidCartId,
  test8_initiateCheckoutWithNonExistentCartId
};
