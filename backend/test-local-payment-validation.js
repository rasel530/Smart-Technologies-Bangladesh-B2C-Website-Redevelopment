/**
 * Test script to reproduce the validation error on Local Payment Methods create/edit/update/delete
 * 
 * This script tests various data formats to identify what's causing validation to fail.
 */

const http = require('http');

// Configuration
const API_BASE_URL = 'http://localhost:3001/api/v1';
const ADMIN_CREDENTIALS = {
  identifier: 'admin@smarttech.com',
  password: 'AdminPassword123'
};

let authToken = null;

/**
 * Helper function to make HTTP requests
 */
function makeRequest(method, path, data = null, token = null) {
  return new Promise((resolve, reject) => {
    // Remove leading slash from path if present to avoid double slashes
    const cleanPath = path.startsWith('/') ? path.substring(1) : path;
    const fullPath = `${API_BASE_URL}/${cleanPath}`;

    const url = new URL(fullPath);
    const options = {
      hostname: url.hostname,
      port: url.port || 3001,
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
      }
    };

    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`;
    }

    console.log(`[DEBUG] Making ${method} request to: ${url.href}`);

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
      });
      res.on('end', () => {
        try {
          const parsedBody = body ? JSON.parse(body) : null;
          resolve({
            status: res.statusCode,
            headers: res.headers,
            body: parsedBody
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            body: body
          });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

/**
 * Login as admin to get auth token
 */
async function login() {
  console.log('\n=== LOGIN ===');
  try {
    const response = await makeRequest('POST', '/auth/login', ADMIN_CREDENTIALS);
    console.log('Login response status:', response.status);
    console.log('Login response body:', JSON.stringify(response.body, null, 2));

    if (response.status === 200 && response.body && response.body.token) {
      authToken = response.body.token;
      console.log('✓ Login successful, token obtained');
      console.log('Token length:', authToken.length);
      console.log('Token preview:', authToken.substring(0, 50) + '...');
      return true;
    } else {
      console.error('✗ Login failed');
      return false;
    }
  } catch (error) {
    console.error('✗ Login error:', error.message);
    return false;
  }
}

/**
 * Test 1: Create payment method with minimal required fields
 */
async function test1_minimalRequiredFields() {
  console.log('\n=== TEST 1: Minimal Required Fields ===');
  const payload = {
    name: 'Test Payment',
    code: 'testpayment',
    displayName: 'Test Payment Method'
  };

  console.log('Request payload:', JSON.stringify(payload, null, 2));

  try {
    const response = await makeRequest('POST', '/admin/local-payment/methods', payload, authToken);
    console.log('Response status:', response.status);
    console.log('Response body:', JSON.stringify(response.body, null, 2));

    if (response.status === 201) {
      console.log('✓ Test 1 PASSED');
      return response.body.data.id;
    } else {
      console.log('✗ Test 1 FAILED');
      return null;
    }
  } catch (error) {
    console.error('✗ Test 1 ERROR:', error.message);
    return null;
  }
}

/**
 * Test 2: Create payment method with all fields (including supportedNetworks as empty array)
 */
async function test2_allFieldsWithEmptyArray() {
  console.log('\n=== TEST 2: All Fields with Empty Array ===');
  const payload = {
    name: 'Test Payment 2',
    code: 'testpayment2',
    displayName: 'Test Payment Method 2',
    logoUrl: null,
    isActive: true,
    minAmount: 10,
    maxAmount: 200000,
    processingFee: 0,
    processingFeePercent: 0,
    requiresPhone: true,
    requiresPin: false,
    description: null,
    instructions: null,
    supportedNetworks: []
  };

  console.log('Request payload:', JSON.stringify(payload, null, 2));

  try {
    const response = await makeRequest('POST', '/admin/local-payment/methods', payload, authToken);
    console.log('Response status:', response.status);
    console.log('Response body:', JSON.stringify(response.body, null, 2));

    if (response.status === 201) {
      console.log('✓ Test 2 PASSED');
      return response.body.data.id;
    } else {
      console.log('✗ Test 2 FAILED');
      return null;
    }
  } catch (error) {
    console.error('✗ Test 2 ERROR:', error.message);
    return null;
  }
}

/**
 * Test 3: Create payment method with supportedNetworks as array with values
 */
async function test3_allFieldsWithNetworks() {
  console.log('\n=== TEST 3: All Fields with Networks Array ===');
  const payload = {
    name: 'Test Payment 3',
    code: 'testpayment3',
    displayName: 'Test Payment Method 3',
    logoUrl: null,
    isActive: true,
    minAmount: 10,
    maxAmount: 200000,
    processingFee: 0,
    processingFeePercent: 0,
    requiresPhone: true,
    requiresPin: false,
    description: null,
    instructions: null,
    supportedNetworks: ['GP', 'Banglalink', 'Robi', 'Airtel']
  };

  console.log('Request payload:', JSON.stringify(payload, null, 2));

  try {
    const response = await makeRequest('POST', '/admin/local-payment/methods', payload, authToken);
    console.log('Response status:', response.status);
    console.log('Response body:', JSON.stringify(response.body, null, 2));

    if (response.status === 201) {
      console.log('✓ Test 3 PASSED');
      return response.body.data.id;
    } else {
      console.log('✗ Test 3 FAILED');
      return null;
    }
  } catch (error) {
    console.error('✗ Test 3 ERROR:', error.message);
    return null;
  }
}

/**
 * Test 4: Create payment method with supportedNetworks as comma-separated string (WRONG FORMAT)
 */
async function test4_networksAsString() {
  console.log('\n=== TEST 4: Networks as Comma-Separated String (WRONG FORMAT) ===');
  const payload = {
    name: 'Test Payment 4',
    code: 'testpayment4',
    displayName: 'Test Payment Method 4',
    logoUrl: null,
    isActive: true,
    minAmount: 10,
    maxAmount: 200000,
    processingFee: 0,
    processingFeePercent: 0,
    requiresPhone: true,
    requiresPin: false,
    description: null,
    instructions: null,
    supportedNetworks: 'GP, Banglalink, Robi, Airtel'
  };

  console.log('Request payload:', JSON.stringify(payload, null, 2));

  try {
    const response = await makeRequest('POST', '/admin/local-payment/methods', payload, authToken);
    console.log('Response status:', response.status);
    console.log('Response body:', JSON.stringify(response.body, null, 2));

    if (response.status === 400) {
      console.log('✓ Test 4 PASSED (Expected validation error)');
      return null;
    } else {
      console.log('✗ Test 4 FAILED (Should have returned 400)');
      return null;
    }
  } catch (error) {
    console.error('✗ Test 4 ERROR:', error.message);
    return null;
  }
}

/**
 * Test 5: Create payment method without supportedNetworks field
 */
async function test5_noNetworksField() {
  console.log('\n=== TEST 5: No supportedNetworks Field ===');
  const payload = {
    name: 'Test Payment 5',
    code: 'testpayment5',
    displayName: 'Test Payment Method 5',
    logoUrl: null,
    isActive: true,
    minAmount: 10,
    maxAmount: 200000,
    processingFee: 0,
    processingFeePercent: 0,
    requiresPhone: true,
    requiresPin: false,
    description: null,
    instructions: null
  };

  console.log('Request payload:', JSON.stringify(payload, null, 2));

  try {
    const response = await makeRequest('POST', '/admin/local-payment/methods', payload, authToken);
    console.log('Response status:', response.status);
    console.log('Response body:', JSON.stringify(response.body, null, 2));

    if (response.status === 201) {
      console.log('✓ Test 5 PASSED');
      return response.body.data.id;
    } else {
      console.log('✗ Test 5 FAILED');
      return null;
    }
  } catch (error) {
    console.error('✗ Test 5 ERROR:', error.message);
    return null;
  }
}

/**
 * Test 6: Update payment method with all fields
 */
async function test6_updatePaymentMethod(methodId) {
  console.log('\n=== TEST 6: Update Payment Method ===');
  const payload = {
    name: 'Updated Payment',
    code: 'testpayment',
    displayName: 'Updated Payment Method',
    logoUrl: null,
    isActive: false,
    minAmount: 20,
    maxAmount: 150000,
    processingFee: 5,
    processingFeePercent: 1.5,
    requiresPhone: false,
    requiresPin: true,
    description: 'Updated description',
    instructions: 'Updated instructions',
    supportedNetworks: ['GP', 'Robi']
  };

  console.log('Request payload:', JSON.stringify(payload, null, 2));
  console.log('Method ID:', methodId);

  try {
    const response = await makeRequest('PUT', `/admin/local-payment/methods/${methodId}`, payload, authToken);
    console.log('Response status:', response.status);
    console.log('Response body:', JSON.stringify(response.body, null, 2));

    if (response.status === 200) {
      console.log('✓ Test 6 PASSED');
      return true;
    } else {
      console.log('✗ Test 6 FAILED');
      return false;
    }
  } catch (error) {
    console.error('✗ Test 6 ERROR:', error.message);
    return false;
  }
}

/**
 * Test 7: Delete payment method
 */
async function test7_deletePaymentMethod(methodId) {
  console.log('\n=== TEST 7: Delete Payment Method ===');
  console.log('Method ID:', methodId);

  try {
    const response = await makeRequest('DELETE', `/admin/local-payment/methods/${methodId}`, null, authToken);
    console.log('Response status:', response.status);
    console.log('Response body:', JSON.stringify(response.body, null, 2));

    if (response.status === 200) {
      console.log('✓ Test 7 PASSED');
      return true;
    } else {
      console.log('✗ Test 7 FAILED');
      return false;
    }
  } catch (error) {
    console.error('✗ Test 7 ERROR:', error.message);
    return false;
  }
}

/**
 * Test 8: Create payment method matching exact frontend payload format
 */
async function test8_frontendExactFormat() {
  console.log('\n=== TEST 8: Frontend Exact Format ===');
  const payload = {
    name: 'bKash',
    code: 'bkash',
    displayName: 'bKash Mobile Payment',
    logoUrl: '',
    isActive: true,
    minAmount: 10,
    maxAmount: 200000,
    processingFee: 0,
    processingFeePercent: 0,
    requiresPhone: true,
    requiresPin: false,
    description: '',
    instructions: '',
    supportedNetworks: []
  };

  console.log('Request payload:', JSON.stringify(payload, null, 2));

  try {
    const response = await makeRequest('POST', '/admin/local-payment/methods', payload, authToken);
    console.log('Response status:', response.status);
    console.log('Response body:', JSON.stringify(response.body, null, 2));

    if (response.status === 201) {
      console.log('✓ Test 8 PASSED');
      return response.body.data.id;
    } else {
      console.log('✗ Test 8 FAILED');
      return null;
    }
  } catch (error) {
    console.error('✗ Test 8 ERROR:', error.message);
    return null;
  }
}

/**
 * Test 9: Create payment method with networks as string (simulating frontend bug)
 */
async function test9_networksStringBug() {
  console.log('\n=== TEST 9: Networks as String (Simulating Bug) ===');
  const payload = {
    name: 'Test Payment 9',
    code: 'testpayment9',
    displayName: 'Test Payment Method 9',
    logoUrl: '',
    isActive: true,
    minAmount: 10,
    maxAmount: 200000,
    processingFee: 0,
    processingFeePercent: 0,
    requiresPhone: true,
    requiresPin: false,
    description: '',
    instructions: '',
    supportedNetworks: 'GP, Banglalink, Robi, Airtel'
  };

  console.log('Request payload:', JSON.stringify(payload, null, 2));

  try {
    const response = await makeRequest('POST', '/admin/local-payment/methods', payload, authToken);
    console.log('Response status:', response.status);
    console.log('Response body:', JSON.stringify(response.body, null, 2));

    if (response.status === 400) {
      console.log('✓ Test 9 PASSED (Expected validation error for string instead of array)');
      return null;
    } else {
      console.log('✗ Test 9 FAILED (Should have returned 400)');
      return null;
    }
  } catch (error) {
    console.error('✗ Test 9 ERROR:', error.message);
    return null;
  }
}

/**
 * Main test runner
 */
async function runTests() {
  console.log('='.repeat(80));
  console.log('LOCAL PAYMENT VALIDATION TEST SUITE');
  console.log('='.repeat(80));
  console.log('API Base URL:', API_BASE_URL);
  console.log('Admin Email:', ADMIN_CREDENTIALS.email);
  console.log('='.repeat(80));

  // Login first
  const loginSuccess = await login();
  if (!loginSuccess) {
    console.error('\n✗ CRITICAL: Login failed. Cannot proceed with tests.');
    process.exit(1);
  }

  // Run tests
  const test1Id = await test1_minimalRequiredFields();
  const test2Id = await test2_allFieldsWithEmptyArray();
  const test3Id = await test3_allFieldsWithNetworks();
  await test4_networksAsString();
  const test5Id = await test5_noNetworksField();
  await test6_updatePaymentMethod(test1Id);
  await test7_deletePaymentMethod(test1Id);
  const test8Id = await test8_frontendExactFormat();
  await test9_networksStringBug();

  // Cleanup
  if (test2Id) await test7_deletePaymentMethod(test2Id);
  if (test3Id) await test7_deletePaymentMethod(test3Id);
  if (test5Id) await test7_deletePaymentMethod(test5Id);
  if (test8Id) await test7_deletePaymentMethod(test8Id);

  console.log('\n' + '='.repeat(80));
  console.log('TEST SUITE COMPLETED');
  console.log('='.repeat(80));
}

// Run tests
runTests().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
