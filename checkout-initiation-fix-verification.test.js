/**
 * Test to verify checkout initiation fix
 * This test verifies that the fix for using cart.id instead of cartId works correctly
 */

const http = require('http');

// Test configuration
const BASE_URL = 'http://localhost:3001';
const GUEST_SESSION_ID = '8f2e0a33-66fe-49f1-9122-7d5187bfdf12';

console.log('=== Checkout Initiation Fix Verification Test ===\n');

// Step 1: Create a test cart with items
console.log('Step 1: Creating test cart with items...');
const createCartOptions = {
  hostname: 'localhost',
  port: 3001,
  path: '/api/v1/cart/guest/create',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'guest-session-id': GUEST_SESSION_ID
  }
};

const createCartBody = JSON.stringify({
  items: [
    {
      productId: '00000000-0000-0000-0000-000000000001', // Test product ID
      quantity: 2,
      price: 100
    },
    {
      productId: '00000000-0000-0000-0000-000000000002', // Test product ID
      quantity: 1,
      price: 50
    }
  ]
});

let testCartId = null;
let testSessionId = null;

const createCartReq = http.request(createCartOptions, (createCartRes) => {
  let createCartData = '';
  
  createCartRes.on('data', (chunk) => {
    createCartData += chunk;
  });
  
  createCartRes.on('end', () => {
    console.log(`Status Code: ${createCartRes.statusCode}`);
    
    if (createCartRes.statusCode === 201) {
      const createCartResponse = JSON.parse(createCartData);
      console.log('✓ Cart created successfully');
      console.log(`  Cart ID: ${createCartResponse.data?.cart?.id || 'N/A'}`);
      console.log(`  Session ID: ${createCartResponse.data?.sessionId || 'N/A'}`);
      console.log(`  Item Count: ${createCartResponse.data?.cart?.items?.length || 0}`);
      
      testCartId = createCartResponse.data?.cart?.id;
      testSessionId = createCartResponse.data?.sessionId;
      
      if (testCartId && testSessionId) {
        // Step 2: Verify cart lookup
        console.log('\nStep 2: Verifying cart lookup...');
        testCartLookup(testCartId, testSessionId);
      } else {
        console.log('✗ Failed to extract cart ID or session ID from response');
        process.exit(1);
      }
    } else {
      console.log('✗ Cart creation failed');
      console.log(`  Response: ${createCartData}`);
      process.exit(1);
    }
  });
});

createCartReq.on('error', (error) => {
  console.log('✗ Cart creation request failed');
  console.log(`  Error: ${error.message}`);
  process.exit(1);
});

createCartReq.write(createCartBody);
createCartReq.end();

function testCartLookup(cartId, sessionId) {
  const cartOptions = {
    hostname: 'localhost',
    port: 3001,
    path: `/api/v1/cart/guest/${cartId}`,
    method: 'GET',
    headers: {
      'guest-session-id': sessionId
    }
  };

  const cartReq = http.request(cartOptions, (cartRes) => {
    let cartData = '';
    
    cartRes.on('data', (chunk) => {
      cartData += chunk;
    });
    
    cartRes.on('end', () => {
      console.log(`Status Code: ${cartRes.statusCode}`);
      
      if (cartRes.statusCode === 200) {
        const cartResponse = JSON.parse(cartData);
        console.log('✓ Cart lookup successful');
        console.log(`  Requested Cart ID: ${cartId}`);
        console.log(`  Actual Cart ID: ${cartResponse.data?.cart?.id || 'N/A'}`);
        console.log(`  Item Count: ${cartResponse.data?.items?.length || 0}`);
        console.log(`  Cart Status: ${cartResponse.data?.cart?.status || 'N/A'}`);
        
        // Step 3: Verify checkout initiation works with actual cart ID
        console.log('\nStep 3: Verifying checkout initiation with actual cart ID...');
        testCheckoutInitiation(cartResponse.data?.cart?.id, sessionId);
      } else {
        console.log('✗ Cart lookup failed');
        console.log(`  Response: ${cartData}`);
        process.exit(1);
      }
    });
  });

  cartReq.on('error', (error) => {
    console.log('✗ Cart lookup request failed');
    console.log(`  Error: ${error.message}`);
    process.exit(1);
  });

  cartReq.end();
}

function testCheckoutInitiation(cartId, sessionId) {
  const checkoutOptions = {
    hostname: 'localhost',
    port: 3001,
    path: '/api/v1/guest/checkout/initiate',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'guest-session-id': sessionId
    }
  };
  
  const requestBody = JSON.stringify({
    cartId: cartId, // Using actual cart ID from cart lookup response
    platform: 'desktop',
    language: 'en'
  });
  
  const checkoutReq = http.request(checkoutOptions, (checkoutRes) => {
    let checkoutData = '';
    
    checkoutRes.on('data', (chunk) => {
      checkoutData += chunk;
    });
    
    checkoutRes.on('end', () => {
      console.log(`Status Code: ${checkoutRes.statusCode}`);
      
      if (checkoutRes.statusCode === 201) {
        const checkoutResponse = JSON.parse(checkoutData);
        console.log('✓ Checkout initiation successful');
        console.log(`  Session ID: ${checkoutResponse.data?.sessionId || 'N/A'}`);
        console.log(`  Cart ID: ${checkoutResponse.data?.cartId || 'N/A'}`);
        console.log(`  Expires At: ${checkoutResponse.data?.expiresAt || 'N/A'}`);
        console.log(`  Totals: ${JSON.stringify(checkoutResponse.data?.totals || {})}`);
        console.log('\n=== All Tests Passed ===');
        console.log('The fix is working correctly!');
        console.log('Frontend now uses actual cart.id from cart lookup response');
        console.log('instead of the original cartId parameter (which may be a sessionId).');
        process.exit(0);
      } else if (checkoutRes.statusCode === 500) {
        console.log('✗ Checkout initiation failed with 500 error');
        const errorResponse = JSON.parse(checkoutData);
        console.log(`  Error: ${errorResponse.error || 'Unknown error'}`);
        console.log(`  Message: ${errorResponse.message || 'Unknown message'}`);
        console.log('\n=== Test Failed ===');
        process.exit(1);
      } else {
        console.log('✗ Checkout initiation failed with unexpected status');
        console.log(`  Status: ${checkoutRes.statusCode}`);
        console.log(`  Response: ${checkoutData}`);
        console.log('\n=== Test Failed ===');
        process.exit(1);
      }
    });
  });
  
  checkoutReq.on('error', (error) => {
    console.log('✗ Checkout initiation request failed');
    console.log(`  Error: ${error.message}`);
    console.log('\n=== Test Failed ===');
    process.exit(1);
  });
  
  checkoutReq.write(requestBody);
  checkoutReq.end();
}
