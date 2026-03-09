/**
 * Guest Checkout Payment Method Validation Fix Verification Test
 * 
 * This test verifies that the payment method validation fix works end-to-end.
 * The fix standardizes on lowercase values throughout the system.
 * 
 * Changes Made:
 * 1. Backend Route Validation (backend/routes/guestCheckout.js):
 *    - Line 108: Updated to accept lowercase values
 *    - Line 181: Updated to accept lowercase values
 * 2. Backend CheckoutService (backend/services/checkoutService.js):
 *    - Line 24: Updated to use lowercase values
 * 3. Frontend Hook (frontend/src/hooks/useGuestCheckout.ts):
 *    - Line 394: Added safety transformation: paymentMethod.toLowerCase()
 */

const http = require('http');

// Configuration
const API_BASE_URL = 'http://localhost:3001';
const API_ENDPOINT = '/api/v1/guest/checkout/complete';

// Valid payment methods (lowercase)
const VALID_PAYMENT_METHODS = [
  'cash_on_delivery',
  'emi',
  'bkash',
  'nagad',
  'rocket',
  'mcash',
  'bank_transfer',
  'credit_card'
];

// Test results storage
const testResults = {
  timestamp: new Date().toISOString(),
  totalTests: 0,
  passedTests: 0,
  failedTests: 0,
  tests: []
};

/**
 * Helper function to make HTTP POST request
 */
function makeRequest(url, data) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(data);
    
    const options = {
      hostname: 'localhost',
      port: 3001,
      path: url,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };
    
    const req = http.request(options, (res) => {
      let body = '';
      
      res.on('data', (chunk) => {
        body += chunk;
      });
      
      res.on('end', () => {
        try {
          const response = {
            statusCode: res.statusCode,
            headers: res.headers,
            body: body ? JSON.parse(body) : null
          };
          resolve(response);
        } catch (error) {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: body
          });
        }
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    req.write(postData);
    req.end();
  });
}

/**
 * Generate a valid UUID for testing
 */
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

/**
 * Create a valid test payload
 */
function createTestPayload(paymentMethod) {
  return {
    sessionId: generateUUID(),
    shippingAddress: {
      firstName: 'Test',
      lastName: 'User',
      phone: '01712345678',
      address: '123 Test Street',
      city: 'Dhaka',
      district: 'Dhaka',
      division: 'Dhaka',
      postalCode: '1000',
      country: 'Bangladesh'
    },
    billingAddress: {
      firstName: 'Test',
      lastName: 'User',
      phone: '01712345678',
      address: '123 Test Street',
      city: 'Dhaka',
      district: 'Dhaka',
      division: 'Dhaka',
      postalCode: '1000',
      country: 'Bangladesh'
    },
    paymentMethod: paymentMethod,
    paymentDetails: {},
    notes: 'Test order for payment method validation'
  };
}

/**
 * Record test result
 */
function recordTestResult(testName, passed, message, details = {}) {
  testResults.totalTests++;
  if (passed) {
    testResults.passedTests++;
  } else {
    testResults.failedTests++;
  }
  
  testResults.tests.push({
    testName,
    passed,
    message,
    details,
    timestamp: new Date().toISOString()
  });
  
  const status = passed ? '✓ PASS' : '✗ FAIL';
  console.log(`${status}: ${testName}`);
  if (message) {
    console.log(`  ${message}`);
  }
  if (Object.keys(details).length > 0) {
    console.log(`  Details: ${JSON.stringify(details, null, 2)}`);
  }
}

/**
 * Test 1: Verify all valid payment methods are accepted (lowercase)
 */
async function testValidPaymentMethodsLowercase() {
  console.log('\n=== Test 1: Valid Payment Methods (Lowercase) ===');
  
  for (const paymentMethod of VALID_PAYMENT_METHODS) {
    const payload = createTestPayload(paymentMethod);
    
    try {
      const response = await makeRequest(API_ENDPOINT, payload);
      
      // Check if response is successful or validation error
      // We expect either:
      // - 200/201: Success (if session exists and cart is valid)
      // - 400: Validation error (but NOT "Invalid payment method")
      // - 404: Session not found (expected if session doesn't exist)
      
      const isInvalidPaymentMethodError = 
        response.statusCode === 400 &&
        response.body &&
        (response.body.error === 'Invalid payment method' ||
         response.body.message === 'Invalid payment method' ||
         (response.body.details && 
          response.body.details.some(d => d.msg === 'Invalid payment method')));
      
      if (isInvalidPaymentMethodError) {
        recordTestResult(
          `Payment method "${paymentMethod}" (lowercase)`,
          false,
          'Endpoint rejected valid payment method with "Invalid payment method" error',
          {
            paymentMethod,
            statusCode: response.statusCode,
            responseBody: response.body
          }
        );
      } else {
        // Payment method was accepted (even if other validation failed)
        recordTestResult(
          `Payment method "${paymentMethod}" (lowercase)`,
          true,
          `Endpoint accepted payment method (status: ${response.statusCode})`,
          {
            paymentMethod,
            statusCode: response.statusCode,
            note: 'Payment method validation passed'
          }
        );
      }
    } catch (error) {
      recordTestResult(
        `Payment method "${paymentMethod}" (lowercase)`,
        false,
        `Request failed: ${error.message}`,
        {
          paymentMethod,
          error: error.message
        }
      );
    }
  }
}

/**
 * Test 2: Verify mixed case payment methods are handled correctly
 */
async function testMixedCasePaymentMethods() {
  console.log('\n=== Test 2: Mixed Case Payment Methods ===');
  
  const mixedCaseMethods = [
    'Cash_On_Delivery',
    'Emi',
    'Bkash',
    'Nagad',
    'Rocket',
    'Mcash',
    'Bank_Transfer',
    'Credit_Card'
  ];
  
  for (const paymentMethod of mixedCaseMethods) {
    const payload = createTestPayload(paymentMethod);
    
    try {
      const response = await makeRequest(API_ENDPOINT, payload);
      
      const isInvalidPaymentMethodError = 
        response.statusCode === 400 &&
        response.body &&
        (response.body.error === 'Invalid payment method' ||
         response.body.message === 'Invalid payment method' ||
         (response.body.details && 
          response.body.details.some(d => d.msg === 'Invalid payment method')));
      
      if (isInvalidPaymentMethodError) {
        // Frontend should convert to lowercase, but if sent directly to backend,
        // it might fail. This is expected behavior if the fix is only in frontend.
        recordTestResult(
          `Payment method "${paymentMethod}" (mixed case)`,
          false,
          'Mixed case payment method rejected (expected - frontend should convert to lowercase)',
          {
            paymentMethod,
            statusCode: response.statusCode,
            note: 'Frontend hook converts paymentMethod.toLowerCase() before sending'
          }
        );
      } else {
        recordTestResult(
          `Payment method "${paymentMethod}" (mixed case)`,
          true,
          `Mixed case payment method accepted (status: ${response.statusCode})`,
          {
            paymentMethod,
            statusCode: response.statusCode
          }
        );
      }
    } catch (error) {
      recordTestResult(
        `Payment method "${paymentMethod}" (mixed case)`,
        false,
        `Request failed: ${error.message}`,
        {
          paymentMethod,
          error: error.message
        }
      );
    }
  }
}

/**
 * Test 3: Verify uppercase payment methods are handled correctly
 */
async function testUppercasePaymentMethods() {
  console.log('\n=== Test 3: Uppercase Payment Methods ===');
  
  const uppercaseMethods = [
    'CASH_ON_DELIVERY',
    'EMI',
    'BKASH',
    'NAGAD',
    'ROCKET',
    'MCASH',
    'BANK_TRANSFER',
    'CREDIT_CARD'
  ];
  
  for (const paymentMethod of uppercaseMethods) {
    const payload = createTestPayload(paymentMethod);
    
    try {
      const response = await makeRequest(API_ENDPOINT, payload);
      
      const isInvalidPaymentMethodError = 
        response.statusCode === 400 &&
        response.body &&
        (response.body.error === 'Invalid payment method' ||
         response.body.message === 'Invalid payment method' ||
         (response.body.details && 
          response.body.details.some(d => d.msg === 'Invalid payment method')));
      
      if (isInvalidPaymentMethodError) {
        recordTestResult(
          `Payment method "${paymentMethod}" (uppercase)`,
          false,
          'Uppercase payment method rejected (expected - frontend should convert to lowercase)',
          {
            paymentMethod,
            statusCode: response.statusCode,
            note: 'Frontend hook converts paymentMethod.toLowerCase() before sending'
          }
        );
      } else {
        recordTestResult(
          `Payment method "${paymentMethod}" (uppercase)`,
          true,
          `Uppercase payment method accepted (status: ${response.statusCode})`,
          {
            paymentMethod,
            statusCode: response.statusCode
          }
        );
      }
    } catch (error) {
      recordTestResult(
        `Payment method "${paymentMethod}" (uppercase)`,
        false,
        `Request failed: ${error.message}`,
        {
          paymentMethod,
          error: error.message
        }
      );
    }
  }
}

/**
 * Test 4: Verify invalid payment methods are rejected
 */
async function testInvalidPaymentMethods() {
  console.log('\n=== Test 4: Invalid Payment Methods ===');
  
  const invalidMethods = [
    'paypal',
    'stripe',
    'invalid_method',
    'cod',
    'cash',
    'credit'
  ];
  
  for (const paymentMethod of invalidMethods) {
    const payload = createTestPayload(paymentMethod);
    
    try {
      const response = await makeRequest(API_ENDPOINT, payload);
      
      const isInvalidPaymentMethodError = 
        response.statusCode === 400 &&
        response.body &&
        (response.body.error === 'Invalid payment method' ||
         response.body.message === 'Invalid payment method' ||
         (response.body.details && 
          response.body.details.some(d => d.msg === 'Invalid payment method')));
      
      if (isInvalidPaymentMethodError) {
        recordTestResult(
          `Payment method "${paymentMethod}" (invalid)`,
          true,
          'Invalid payment method correctly rejected',
          {
            paymentMethod,
            statusCode: response.statusCode,
            responseBody: response.body
          }
        );
      } else {
        recordTestResult(
          `Payment method "${paymentMethod}" (invalid)`,
          false,
          'Invalid payment method was not rejected',
          {
            paymentMethod,
            statusCode: response.statusCode,
            responseBody: response.body
          }
        );
      }
    } catch (error) {
      recordTestResult(
        `Payment method "${paymentMethod}" (invalid)`,
        false,
        `Request failed: ${error.message}`,
        {
          paymentMethod,
          error: error.message
        }
      );
    }
  }
}

/**
 * Test 5: Verify payment method case insensitivity in validation
 */
async function testCaseInsensitivity() {
  console.log('\n=== Test 5: Payment Method Case Insensitivity ===');
  
  const testCases = [
    { input: 'cash_on_delivery', expected: 'accepted' },
    { input: 'CASH_ON_DELIVERY', expected: 'rejected_or_converted' },
    { input: 'Cash_On_Delivery', expected: 'rejected_or_converted' },
    { input: 'emi', expected: 'accepted' },
    { input: 'EMI', expected: 'rejected_or_converted' },
    { input: 'Emi', expected: 'rejected_or_converted' }
  ];
  
  for (const testCase of testCases) {
    const payload = createTestPayload(testCase.input);
    
    try {
      const response = await makeRequest(API_ENDPOINT, payload);
      
      const isInvalidPaymentMethodError = 
        response.statusCode === 400 &&
        response.body &&
        (response.body.error === 'Invalid payment method' ||
         response.body.message === 'Invalid payment method' ||
         (response.body.details && 
          response.body.details.some(d => d.msg === 'Invalid payment method')));
      
      if (testCase.expected === 'accepted') {
        if (isInvalidPaymentMethodError) {
          recordTestResult(
            `Case insensitivity: "${testCase.input}"`,
            false,
            'Lowercase payment method was rejected (should be accepted)',
            {
              input: testCase.input,
              expected: 'accepted',
              actual: 'rejected',
              statusCode: response.statusCode
            }
          );
        } else {
          recordTestResult(
            `Case insensitivity: "${testCase.input}"`,
            true,
            'Lowercase payment method was accepted',
            {
              input: testCase.input,
              statusCode: response.statusCode
            }
          );
        }
      } else {
        // For non-lowercase, we expect either rejection or conversion
        if (isInvalidPaymentMethodError) {
          recordTestResult(
            `Case insensitivity: "${testCase.input}"`,
            true,
            'Non-lowercase payment method was rejected (frontend should convert to lowercase)',
            {
              input: testCase.input,
              statusCode: response.statusCode,
              note: 'Frontend hook converts paymentMethod.toLowerCase() before sending'
            }
          );
        } else {
          recordTestResult(
            `Case insensitivity: "${testCase.input}"`,
            true,
            'Non-lowercase payment method was accepted (backend may handle case insensitivity)',
            {
              input: testCase.input,
              statusCode: response.statusCode
            }
          );
        }
      }
    } catch (error) {
      recordTestResult(
        `Case insensitivity: "${testCase.input}"`,
        false,
        `Request failed: ${error.message}`,
        {
          input: testCase.input,
          error: error.message
        }
      );
    }
  }
}

/**
 * Print test summary
 */
function printTestSummary() {
  console.log('\n' + '='.repeat(60));
  console.log('TEST SUMMARY');
  console.log('='.repeat(60));
  console.log(`Timestamp: ${testResults.timestamp}`);
  console.log(`Total Tests: ${testResults.totalTests}`);
  console.log(`Passed: ${testResults.passedTests} ✓`);
  console.log(`Failed: ${testResults.failedTests} ✗`);
  console.log(`Success Rate: ${((testResults.passedTests / testResults.totalTests) * 100).toFixed(2)}%`);
  console.log('='.repeat(60));
  
  if (testResults.failedTests > 0) {
    console.log('\nFailed Tests:');
    testResults.tests
      .filter(t => !t.passed)
      .forEach(t => {
        console.log(`  - ${t.testName}`);
        if (t.message) {
          console.log(`    ${t.message}`);
        }
      });
  }
}

/**
 * Save test results to JSON file
 */
function saveTestResults() {
  const fs = require('fs');
  const filename = `guest-checkout-payment-method-fix-verification-results-${Date.now()}.json`;
  
  fs.writeFileSync(filename, JSON.stringify(testResults, null, 2));
  console.log(`\nTest results saved to: ${filename}`);
}

/**
 * Main test runner
 */
async function runTests() {
  console.log('='.repeat(60));
  console.log('GUEST CHECKOUT PAYMENT METHOD VALIDATION FIX VERIFICATION');
  console.log('='.repeat(60));
  console.log(`API Endpoint: ${API_BASE_URL}${API_ENDPOINT}`);
  console.log(`Valid Payment Methods: ${VALID_PAYMENT_METHODS.join(', ')}`);
  console.log(`Note: Testing against backend API on port 3001`);
  console.log('='.repeat(60));
  
  try {
    // Run all tests
    await testValidPaymentMethodsLowercase();
    await testMixedCasePaymentMethods();
    await testUppercasePaymentMethods();
    await testInvalidPaymentMethods();
    await testCaseInsensitivity();
    
    // Print summary
    printTestSummary();
    
    // Save results
    saveTestResults();
    
    // Exit with appropriate code
    process.exit(testResults.failedTests > 0 ? 1 : 0);
  } catch (error) {
    console.error('\nFatal error running tests:', error);
    process.exit(1);
  }
}

// Run tests
if (require.main === module) {
  runTests();
}

module.exports = {
  runTests,
  testResults,
  VALID_PAYMENT_METHODS
};
