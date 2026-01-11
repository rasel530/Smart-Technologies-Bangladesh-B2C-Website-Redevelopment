/**
 * NextAuth Login Diagnostic Test
 * 
 * This script tests the backend API directly to verify:
 * 1. Backend API is accessible
 * 2. Login endpoint works with test credentials
 * 3. Response format matches NextAuth expectations
 */

const BACKEND_API_URL = 'http://localhost:3001/api/v1';

async function testBackendLogin() {
  console.log('=== BACKEND API LOGIN TEST ===\n');
  
  const testCredentials = {
    identifier: 'test@example.com',
    password: 'TestPassword123!',
    rememberMe: false
  };
  
  console.log('1. Testing backend API accessibility...');
  console.log('   URL:', `${BACKEND_API_URL}/auth/login`);
  console.log('   Method: POST');
  console.log('   Headers: Content-Type: application/json');
  console.log('   Body:', JSON.stringify({
    identifier: testCredentials.identifier,
    password: '[REDACTED]',
    rememberMe: testCredentials.rememberMe
  }));
  
  try {
    console.log('\n2. Sending request to backend...');
    const response = await fetch(`${BACKEND_API_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testCredentials),
    });
    
    console.log('\n3. Response received:');
    console.log('   Status:', response.status, response.statusText);
    console.log('   OK:', response.ok);
    console.log('   Headers:', Object.fromEntries(response.headers.entries()));
    
    // Get raw response
    const rawText = await response.text();
    console.log('\n4. Raw response body (first 500 chars):');
    console.log('   ', rawText.substring(0, 500));
    
    // Try to parse as JSON
    let data;
    try {
      data = JSON.parse(rawText);
      console.log('\n5. Parsed JSON response:');
      console.log('   ', JSON.stringify(data, null, 2));
    } catch (parseError) {
      console.error('\n   ERROR: Failed to parse JSON:', parseError.message);
      console.log('   Response is not valid JSON');
      return;
    }
    
    // Validate response structure for NextAuth
    console.log('\n6. Validating response structure for NextAuth:');
    console.log('   Has token?', !!data.token);
    console.log('   Has user?', !!data.user);
    console.log('   Has sessionId?', !!data.sessionId);
    
    if (!response.ok) {
      console.log('\n❌ Backend returned error status:', response.status);
      if (data.error) {
        console.log('   Error:', data.error);
        console.log('   Message:', data.message);
      }
    } else if (!data.token) {
      console.log('\n❌ Response missing token field');
    } else if (!data.user) {
      console.log('\n❌ Response missing user field');
    } else {
      console.log('\n✅ Backend login successful!');
      console.log('   User ID:', data.user.id);
      console.log('   Email:', data.user.email);
      console.log('   Role:', data.user.role);
      console.log('   Token length:', data.token.length);
      console.log('   Session ID:', data.sessionId);
    }
    
  } catch (error) {
    console.error('\n❌ Network or fetch error:');
    console.error('   Error:', error.message);
    console.error('   Stack:', error.stack);
    
    if (error.code === 'ECONNREFUSED') {
      console.error('\n   ⚠️  Backend server is not running or not accessible');
      console.error('   ⚠️  Please start backend server on port 3001');
    }
  }
}

// Run the test
console.log('Starting NextAuth Login Diagnostic Test...\n');
testBackendLogin().then(() => {
  console.log('\n=== TEST COMPLETE ===\n');
  process.exit(0);
}).catch((error) => {
  console.error('\n=== TEST FAILED ===');
  console.error(error);
  process.exit(1);
});
