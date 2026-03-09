/**
 * Guest Cart variantId null Validation Fix Test
 * 
 * This test verifies that the guest cart endpoint properly accepts items with null variantId
 * after fixing the validation rules to use .optional({ nullable: true, checkFalsy: true })
 */

const http = require('http');

// Test configuration
const API_BASE_URL = 'http://localhost:3001';
const GUEST_CART_ENDPOINT = '/api/v1/cart/guest';

// Test data - items with null variantId (products without variants)
const testItems = [
  {
    productId: 'c571ed71-fd5b-4158-ad6d-87405e75f046',
    quantity: 1,
    variantId: null,
    price: 850,
    addedAt: new Date().toISOString()
  },
  {
    productId: '0eaf0abf-fffd-4a15-99e4-793887219687',
    quantity: 1,
    variantId: null,
    price: 70000,
    addedAt: new Date().toISOString()
  },
  {
    productId: '4010caae-464e-4787-ad8f-ee04096100d0',
    quantity: 1,
    variantId: null,
    price: 5000,
    addedAt: new Date().toISOString()
  }
];

// Test data - items with valid variantId (products with variants)
const testItemsWithVariants = [
  {
    productId: 'c571ed71-fd5b-4158-ad6d-87405e75f046',
    quantity: 1,
    variantId: '550e8400-e29b-41d4-a716-446655440000',
    price: 850,
    addedAt: new Date().toISOString()
  }
];

// Test data - items without variantId field (should also work)
const testItemsWithoutVariantId = [
  {
    productId: 'c571ed71-fd5b-4158-ad6d-87405e75f046',
    quantity: 1,
    price: 850,
    addedAt: new Date().toISOString()
  }
];

/**
 * Make HTTP request to API
 */
function makeRequest(data, description) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(data);

    const options = {
      hostname: 'localhost',
      port: 3001,
      path: GUEST_CART_ENDPOINT,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    console.log(`\n${'='.repeat(80)}`);
    console.log(`TEST: ${description}`);
    console.log('='.repeat(80));
    console.log('Request Data:', JSON.stringify(data, null, 2));

    const req = http.request(options, (res) => {
      let body = '';

      res.on('data', (chunk) => {
        body += chunk;
      });

      res.on('end', () => {
        console.log(`\nResponse Status: ${res.statusCode}`);
        console.log(`Response Headers:`, res.headers);
        
        try {
          const response = JSON.parse(body);
          console.log(`Response Body:`, JSON.stringify(response, null, 2));
          
          if (res.statusCode === 200 || res.statusCode === 201) {
            console.log(`✅ SUCCESS: Request accepted`);
            resolve({ success: true, statusCode: res.statusCode, response });
          } else {
            console.log(`❌ FAILED: Request rejected`);
            resolve({ success: false, statusCode: res.statusCode, response });
          }
        } catch (e) {
          console.log(`Response Body (raw):`, body);
          console.log(`❌ ERROR: Failed to parse response`);
          resolve({ success: false, statusCode: res.statusCode, body });
        }
      });
    });

    req.on('error', (error) => {
      console.error(`❌ ERROR: ${error.message}`);
      reject(error);
    });

    req.write(postData);
    req.end();
  });
}

/**
 * Run all tests
 */
async function runTests() {
  console.log('\n' + '='.repeat(80));
  console.log('GUEST CART VARIANTID NULL VALIDATION FIX TEST');
  console.log('='.repeat(80));
  console.log('Testing that guest cart endpoint accepts items with null variantId');
  console.log('After fixing validation rules to use .optional({ nullable: true, checkFalsy: true })');

  const results = [];

  // Test 1: Items with null variantId
  try {
    const result = await makeRequest(
      {
        items: testItems,
        sessionId: 'test-session-null-variantid'
      },
      'Test 1: Items with null variantId (products without variants)'
    );
    results.push({ test: 'Test 1', ...result });
  } catch (error) {
    console.error('Test 1 failed with error:', error.message);
    results.push({ test: 'Test 1', success: false, error: error.message });
  }

  // Test 2: Items with valid variantId
  try {
    const result = await makeRequest(
      {
        items: testItemsWithVariants,
        sessionId: 'test-session-with-variantid'
      },
      'Test 2: Items with valid variantId (products with variants)'
    );
    results.push({ test: 'Test 2', ...result });
  } catch (error) {
    console.error('Test 2 failed with error:', error.message);
    results.push({ test: 'Test 2', success: false, error: error.message });
  }

  // Test 3: Items without variantId field
  try {
    const result = await makeRequest(
      {
        items: testItemsWithoutVariantId,
        sessionId: 'test-session-without-variantid'
      },
      'Test 3: Items without variantId field (should also work)'
    );
    results.push({ test: 'Test 3', ...result });
  } catch (error) {
    console.error('Test 3 failed with error:', error.message);
    results.push({ test: 'Test 3', success: false, error: error.message });
  }

  // Test 4: Mixed items (some with null, some with valid variantId)
  try {
    const result = await makeRequest(
      {
        items: [...testItems, ...testItemsWithVariants],
        sessionId: 'test-session-mixed'
      },
      'Test 4: Mixed items (some null, some with variantId)'
    );
    results.push({ test: 'Test 4', ...result });
  } catch (error) {
    console.error('Test 4 failed with error:', error.message);
    results.push({ test: 'Test 4', success: false, error: error.message });
  }

  // Print summary
  console.log('\n' + '='.repeat(80));
  console.log('TEST SUMMARY');
  console.log('='.repeat(80));
  
  results.forEach((result, index) => {
    console.log(`\n${result.test}:`);
    console.log(`  Status: ${result.success ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`  HTTP Status: ${result.statusCode}`);
    if (result.error) {
      console.log(`  Error: ${result.error}`);
    }
  });

  const passedTests = results.filter(r => r.success).length;
  const totalTests = results.length;
  
  console.log('\n' + '-'.repeat(80));
  console.log(`Total Tests: ${totalTests}`);
  console.log(`Passed: ${passedTests}`);
  console.log(`Failed: ${totalTests - passedTests}`);
  console.log(`Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);
  console.log('-'.repeat(80));

  if (passedTests === totalTests) {
    console.log('\n✅ ALL TESTS PASSED! The variantId null validation fix is working correctly.');
    console.log('Guest cart endpoint now accepts items with null variantId.');
  } else {
    console.log('\n❌ SOME TESTS FAILED! Please check the validation rules in backend/routes/cart.js');
    console.log('Make sure all variantId validations use: .optional({ nullable: true, checkFalsy: true })');
  }
  
  console.log('\n' + '='.repeat(80));
}

// Run tests
runTests().catch(error => {
  console.error('\nFatal error running tests:', error);
  process.exit(1);
});
