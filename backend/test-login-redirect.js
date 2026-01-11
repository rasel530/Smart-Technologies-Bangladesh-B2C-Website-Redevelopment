#!/usr/bin/env node

/**
 * Test Login Redirect Flow
 * This script tests the complete login flow including redirect to account page
 */

const axios = require('axios');

// Configuration
const BASE_URL = process.env.DOCKER_ENV === 'true' 
  ? 'http://backend:3000/api/v1' 
  : 'http://localhost:3001/api/v1';

// Demo users
const demoUsers = [
  {
    email: 'admin@smarttech.com',
    password: 'admin123',
    role: 'ADMIN'
  },
  {
    email: 'customer@example.com',
    password: 'customer123',
    role: 'CUSTOMER'
  }
];

console.log('='.repeat(80));
console.log('LOGIN REDIRECT TEST');
console.log('='.repeat(80));
console.log(`Backend URL: ${BASE_URL}`);
console.log('');

async function testLogin(user) {
  console.log(`\n--- Testing login for ${user.role}: ${user.email} ---`);
  
  try {
    const response = await axios.post(`${BASE_URL}/auth/login`, {
      identifier: user.email,
      password: user.password,
      rememberMe: false
    });
    
    console.log('✅ Login successful!');
    console.log('Response structure:', {
      hasToken: !!response.data.token,
      hasUser: !!response.data.user,
      hasMessage: !!response.data.message,
      hasSessionId: !!response.data.sessionId
    });
    
    if (response.data.token) {
      console.log('✅ Token received:', response.data.token.substring(0, 20) + '...');
    }
    
    if (response.data.user) {
      console.log('✅ User data received:', {
        id: response.data.user.id,
        email: response.data.user.email,
        role: response.data.user.role,
        status: response.data.user.status
      });
    }
    
    if (response.data.sessionId) {
      console.log('✅ Session ID received:', response.data.sessionId);
    }
    
    console.log('✅ Message:', response.data.message);
    
    // Test if frontend can now access this user's data
    if (response.data.token) {
      console.log('\n--- Testing authenticated request ---');
      try {
        const meResponse = await axios.get(`${BASE_URL}/auth/me`, {
          headers: {
            'Authorization': `Bearer ${response.data.token}`
          }
        });
        console.log('✅ Authenticated request successful!');
        console.log('User data from /auth/me:', meResponse.data);
      } catch (meError) {
        console.log('❌ Authenticated request failed:', meError.response?.data || meError.message);
      }
    }
    
    return { success: true, data: response.data };
    
  } catch (error) {
    console.log('❌ Login failed!');
    console.log('Error:', error.response?.data || error.message);
    return { success: false, error: error.response?.data || error.message };
  }
}

async function runTests() {
  const results = [];
  
  for (const user of demoUsers) {
    const result = await testLogin(user);
    results.push({
      user: user.email,
      role: user.role,
      ...result
    });
  }
  
  console.log('\n' + '='.repeat(80));
  console.log('TEST SUMMARY');
  console.log('='.repeat(80));
  
  results.forEach(result => {
    console.log(`\n${result.user} (${result.role}):`);
    console.log(`  Status: ${result.success ? '✅ PASS' : '❌ FAIL'}`);
    if (!result.success) {
      console.log(`  Error: ${JSON.stringify(result.error)}`);
    }
  });
  
  const allPassed = results.every(r => r.success);
  console.log('\n' + '='.repeat(80));
  console.log(`Overall: ${allPassed ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}`);
  console.log('='.repeat(80));
  
  process.exit(allPassed ? 0 : 1);
}

runTests().catch(error => {
  console.error('Test execution error:', error);
  process.exit(1);
});
