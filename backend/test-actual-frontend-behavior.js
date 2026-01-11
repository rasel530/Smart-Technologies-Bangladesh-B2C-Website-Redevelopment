/**
 * Test to simulate EXACT frontend behavior using fetch (not axios)
 * This mimics what the frontend actually does
 */

const API_BASE_URL = 'http://localhost:3001/api/v1';

// Mimic the frontend's apiClient.request method using fetch
async function fetchLogin(identifier, password, rememberMe = false) {
  console.log('\n=== FETCH REQUEST SIMULATION ===');
  console.log('URL:', `${API_BASE_URL}/auth/login`);
  console.log('Method: POST');
  console.log('Body:', { identifier, password, rememberMe });

  try {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ identifier, password, rememberMe })
    });

    console.log('\n[Response] Status:', response.status);
    console.log('[Response] OK:', response.ok);

    // Parse response body
    const data = await response.json();
    console.log('[Response] Data:', JSON.stringify(data, null, 2));

    // Check if response is OK (mimicking handleResponse line 243)
    if (!response.ok) {
      console.log('\n❌ Response NOT OK - should throw error');
      const message = data?.message || data?.error || 'Request failed';
      console.log('Error message:', message);
      throw new Error(message);
    }

    // Frontend success check (mimicking AuthContext line 307)
    console.log('\n[Frontend Check] Has token:', !!data.token);
    console.log('[Frontend Check] Has user:', !!data.user);

    if (data.token && data.user) {
      console.log('✅ FRONTEND WOULD SHOW SUCCESS TOAST');
      return { success: true, data };
    } else {
      console.log('❌ FRONTEND WOULD SHOW ERROR TOAST');
      console.log('Error:', data.message || 'Login failed');
      return { success: false, error: data };
    }

  } catch (error) {
    console.log('\n❌ CATCH BLOCK - Error:', error.message);
    console.log('❌ FRONTEND WOULD SHOW ERROR TOAST');
    return { success: false, error: { message: error.message } };
  }
}

// Test cases
async function runTests() {
  console.log('='.repeat(70));
  console.log('TESTING ACTUAL FRONTEND BEHAVIOR WITH FETCH');
  console.log('='.repeat(70));

  const testCases = [
    {
      name: 'Test 1: Valid email, WRONG password',
      identifier: 'demo.user1@smarttech.bd',
      password: 'wrongpassword',
      rememberMe: false
    },
    {
      name: 'Test 2: Non-existent email',
      identifier: 'nonexistent@example.com',
      password: 'anypassword',
      rememberMe: false
    },
    {
      name: 'Test 3: Invalid phone',
      identifier: '01700000000',
      password: 'anypassword',
      rememberMe: false
    }
  ];

  for (const testCase of testCases) {
    console.log('\n' + '='.repeat(70));
    console.log(testCase.name);
    console.log('='.repeat(70));

    const result = await fetchLogin(
      testCase.identifier,
      testCase.password,
      testCase.rememberMe
    );

    console.log('\n--- RESULT ---');
    console.log('Success:', result.success);
    console.log('Expected: false');

    if (result.success === false) {
      console.log('✅ CORRECT - Login correctly failed');
    } else {
      console.log('❌ BUG FOUND - Login incorrectly succeeded!');
      console.log('THIS IS THE BUG THE USER REPORTED!');
    }
  }

  console.log('\n' + '='.repeat(70));
  console.log('TESTS COMPLETE');
  console.log('='.repeat(70));
}

runTests().catch(error => {
  console.error('Test failed:', error);
  process.exit(1);
});
