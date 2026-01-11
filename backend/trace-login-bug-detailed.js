/**
 * Detailed trace to understand the login bug
 * This script mimics the frontend's exact logic
 */

const axios = require('axios');

const API_BASE_URL = 'http://localhost:3001/api/v1';

// Mimic frontend's AuthContext.login() logic
async function frontendLoginLogic(identifier, password, rememberMe = false) {
  console.log('\n=== FRONTEND LOGIN LOGIC SIMULATION ===');
  console.log('Input:', { identifier, password: password ? '***' : '', rememberMe });

  try {
    // Step 1: API call (mimicking apiClient.post)
    console.log('\n[Step 1] Making API request to /auth/login');
    const response = await axios.post(`${API_BASE_URL}/auth/login`, {
      identifier,
      password,
      rememberMe
    }, {
      validateStatus: function (status) {
        // This mimics fetch's behavior - only throws on network errors
        // NOT on HTTP error status codes
        return status >= 200 && status < 600;
      }
    });

    console.log('[Step 1] Response received');
    console.log('  Status:', response.status);
    console.log('  Status Text:', response.statusText);
    console.log('  Response Data:', JSON.stringify(response.data, null, 2));

    // Step 2: Check if response is OK (mimicking handleResponse)
    console.log('\n[Step 2] Checking if response is OK');
    const isOk = response.status >= 200 && response.status < 300;
    console.log('  Is OK (200-299):', isOk);

    if (!isOk) {
      console.log('  ❌ Response not OK - should throw error');
      const message = response.data?.message || response.data?.error || 'Request failed';
      console.log('  Error message:', message);
      throw new Error(message);
    }

    // Step 3: Frontend success check (mimicking AuthContext line 307)
    console.log('\n[Step 3] Frontend success check');
    const hasToken = !!response.data.token;
    const hasUser = !!response.data.user;
    const isSuccess = hasToken && hasUser;

    console.log('  Has token:', hasToken);
    console.log('  Has user:', hasUser);
    console.log('  Is SUCCESS:', isSuccess);

    if (isSuccess) {
      console.log('  ✅ LOGIN SUCCESS - would show success toast');
      return { success: true, data: response.data };
    } else {
      console.log('  ❌ LOGIN FAILURE - would show error toast');
      console.log('  Error:', response.data.message || 'Login failed');
      return { success: false, error: response.data };
    }

  } catch (error) {
    // Step 4: Error handling (mimicking AuthContext line 340-354)
    console.log('\n[Step 4] Error caught');
    console.log('  Error message:', error.message);
    console.log('  Error response status:', error.response?.status);
    console.log('  Error response data:', error.response?.data);

    const errorData = error.response?.data || {};
    const errorPayload = {
      message: errorData.message || error.message || 'Login failed',
      messageBn: errorData.messageBn || 'লগইন ব্যর্থ হয়েছে',
      requiresVerification: errorData.requiresVerification || null,
      verificationType: errorData.verificationType || null,
      code: errorData.code || null
    };

    console.log('  ❌ LOGIN FAILURE - would show error toast');
    console.log('  Error payload:', errorPayload);
    return { success: false, error: errorPayload };
  }
}

// Test cases
async function runTests() {
  console.log('='.repeat(70));
  console.log('DETAILED LOGIN BUG TRACE');
  console.log('='.repeat(70));

  const testCases = [
    {
      name: 'Test 1: Valid email, wrong password',
      identifier: 'demo.user1@smarttech.bd',
      password: 'wrongpassword123',
      rememberMe: false
    },
    {
      name: 'Test 2: Invalid email (non-existent)',
      identifier: 'nonexistent@example.com',
      password: 'anypassword',
      rememberMe: false
    },
    {
      name: 'Test 3: Invalid phone number',
      identifier: '01700000000',
      password: 'anypassword',
      rememberMe: false
    },
    {
      name: 'Test 4: Empty identifier',
      identifier: '',
      password: 'anypassword',
      rememberMe: false
    }
  ];

  for (const testCase of testCases) {
    console.log('\n' + '='.repeat(70));
    console.log(testCase.name);
    console.log('='.repeat(70));

    const result = await frontendLoginLogic(
      testCase.identifier,
      testCase.password,
      testCase.rememberMe
    );

    console.log('\n--- FINAL RESULT ---');
    console.log('Success:', result.success);
    console.log('Expected Success: false');
    if (result.success === false) {
      console.log('✅ CORRECT - Login correctly failed');
    } else {
      console.log('❌ BUG - Login incorrectly succeeded!');
    }
  }

  console.log('\n' + '='.repeat(70));
  console.log('ALL TESTS COMPLETE');
  console.log('='.repeat(70));
}

// Run tests
runTests().catch(error => {
  console.error('Test script failed:', error);
  process.exit(1);
});
