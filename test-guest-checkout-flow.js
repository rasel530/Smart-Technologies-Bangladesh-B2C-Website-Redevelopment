/**
 * Guest Checkout Flow Verification Test
 * Tests the complete flow after cart validation fixes
 */

const http = require('http');

function makeRequest(method, path, data = null) {
  return new Promise((resolve, reject) => {
    const url = new URL('http://localhost:3001' + path);
    const options = {
      hostname: url.hostname,
      port: url.port || 80,
      path: url.pathname + url.search,
      method: method,
      headers: { 
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve({ statusCode: res.statusCode, body: JSON.parse(body) });
        } catch (e) {
          resolve({ statusCode: res.statusCode, body: body });
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

async function runTest() {
  console.log('='.repeat(60));
  console.log('GUEST CHECKOUT FLOW VERIFICATION TEST');
  console.log('='.repeat(60));
  
  let passed = 0;
  let failed = 0;
  
  try {
    // Test 1: Initialize guest checkout (creates new empty cart)
    console.log('\n[1] Testing guest checkout initialization...');
    const initRes = await makeRequest('POST', '/api/v1/guest/checkout/initiate', { cartId: null });
    console.log('    Status:', initRes.statusCode);
    console.log('    Response:', JSON.stringify(initRes.body, null, 2));
    
    if (initRes.statusCode === 201 || initRes.statusCode === 200) {
      console.log('    ✅ PASSED: Guest checkout initialized');
      passed++;
      
      const sessionId = initRes.body.data?.sessionId;
      const cartId = initRes.body.data?.cartId;
      
      if (sessionId && cartId) {
        // Test 2: Add item to cart
        console.log('\n[2] Adding item to cart...');
        const addItemRes = await makeRequest('POST', '/api/v1/cart/guest/add', {
          items: [{
            productId: 'prod-test-001',
            quantity: 1,
            price: 1000
          }],
          sessionId: cartId
        });
        console.log('    Status:', addItemRes.statusCode);
        console.log('    Response:', JSON.stringify(addItemRes.body, null, 2));
        
        // Test 3: Complete guest checkout with items
        console.log('\n[3] Testing complete guest checkout with items...');
        const completeRes = await makeRequest('POST', `/api/v1/guest/checkout/session/${sessionId}/complete`, {
          shippingAddress: {
            firstName: 'Test',
            lastName: 'User',
            phone: '01712345678',
            address: '123 Test St',
            city: 'Dhaka',
            district: 'Dhaka',
            division: 'Dhaka',
            postalCode: '1200'
          },
          paymentMethod: 'cash_on_delivery'
        });
        console.log('    Status:', completeRes.statusCode);
        console.log('    Response:', JSON.stringify(completeRes.body, null, 2));
        
        if (completeRes.statusCode === 201 || completeRes.statusCode === 200) {
          console.log('    ✅ PASSED: Order created successfully');
          console.log('    Order Number:', completeRes.body.data?.orderNumber);
          passed++;
        } else {
          console.log('    ❌ FAILED: Could not create order');
          console.log('    Error:', completeRes.body.error || completeRes.body.message);
          failed++;
        }
      }
    } else {
      console.log('    ❌ FAILED: Could not initialize guest checkout');
      console.log('    Error:', initRes.body.error || initRes.body.message);
      failed++;
    }
    
  } catch (error) {
    console.error('\n❌ Test error:', error.message);
    failed++;
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('TEST SUMMARY');
  console.log('='.repeat(60));
  console.log('Passed:', passed);
  console.log('Failed:', failed);
  console.log('='.repeat(60));
  
  if (failed === 0) {
    console.log('✅ ALL TESTS PASSED');
  } else {
    console.log('❌ SOME TESTS FAILED');
  }
}

