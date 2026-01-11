/**
 * Test Backend Login Token Generation
 * 
 * This test directly calls the backend login endpoint to verify
 * that JWT tokens are generated with the new configuration
 */

const axios = require('axios');

const API_BASE_URL = 'http://localhost:3001/api/v1';

// Test user credentials (using demo users from database)
const testUser = {
  email: 'customer@example.com',
  password: 'customer123'
};

console.log('╔══════════════════════════════════════════════════════════╗');
console.log('║       BACKEND LOGIN TOKEN GENERATION TEST                 ║');
console.log('╚══════════════════════════════════════════════════════════╝\n');

async function testBackendLogin() {
  console.log('=== Test: Backend Login Token Generation ===\n');
  
  try {
    console.log('Login request to:', `${API_BASE_URL}/auth/login`);
    console.log('User:', testUser.email);
    console.log('Password:', '***');
    console.log('');

    const response = await axios.post(`${API_BASE_URL}/auth/login`, {
      identifier: testUser.email,
      password: testUser.password,
      rememberMe: false
    });

    console.log('✓ Login successful');
    console.log('Response status:', response.status);
    console.log('');

    console.log('Response structure:');
    console.log('  - message:', response.data.message);
    console.log('  - has user:', !!response.data.user);
    console.log('  - has token:', !!response.data.token);
    console.log('  - has sessionId:', !!response.data.sessionId);
    console.log('  - has expiresAt:', !!response.data.expiresAt);
    console.log('');

    if (response.data.token) {
      const token = response.data.token;
      console.log('Token Information:');
      console.log('  - Token length:', token.length);
      console.log('  - Token preview:', token.substring(0, 50) + '...');
      console.log('');

      // Check token length
      if (token.length >= 150) {
        console.log('✓ Token length is acceptable (>= 150 characters)');
      } else {
        console.log('✗ Token length is too short (< 150 characters)');
        console.log('  This may cause "Invalid token" errors during authentication');
      }
      console.log('');

      // Decode token to check payload
      const jwt = require('jsonwebtoken');
      const decoded = jwt.decode(token);
      console.log('Decoded Token:');
      console.log('  - userId:', decoded.userId);
      console.log('  - email:', decoded.email);
      console.log('  - role:', decoded.role);
      console.log('  - sessionId:', decoded.sessionId);
      console.log('  - iat (issued at):', decoded.iat);
      console.log('  - exp (expires at):', decoded.exp);
      console.log('');

      // Calculate token expiry
      const now = Math.floor(Date.now() / 1000);
      const expiresIn = decoded.exp - now;
      const expiresInDays = Math.floor(expiresIn / 86400);
      console.log('Token Expiry:');
      console.log('  - Expires in:', expiresIn, 'seconds');
      console.log('  - Expires in:', expiresInDays, 'days');
      console.log('');

      if (expiresInDays >= 7) {
        console.log('✓ Token expiry is correct (7 days)');
      } else {
        console.log('✗ Token expiry is incorrect (expected 7 days, got', expiresInDays, 'days)');
      }
      console.log('');

      // Verify token
      try {
        const verified = jwt.verify(token, process.env.JWT_SECRET);
        console.log('✓ Token verified successfully with JWT_SECRET');
      } catch (verifyError) {
        console.log('✗ Token verification failed:', verifyError.message);
      }
      console.log('');

    } else {
      console.log('✗ No token in response');
      console.log('Full response:', JSON.stringify(response.data, null, 2));
    }

  } catch (error) {
    console.log('✗ Login failed');
    console.log('Error:', error.response?.data || error.message);
    if (error.response) {
      console.log('Status:', error.response.status);
      console.log('Headers:', error.response.headers);
    }
  }

  console.log('\n=== Test Complete ===\n');
}

// Run test
testBackendLogin();
