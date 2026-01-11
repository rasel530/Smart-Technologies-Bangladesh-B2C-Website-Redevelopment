/**
 * Login Diagnostic Test
 *
 * This script tests the backend login endpoint to diagnose the CredentialsSignin 401 error
 */

// Use built-in fetch (Node.js 18+) or require node-fetch for older versions
let fetch;
try {
  fetch = globalThis.fetch;
} catch (e) {
  try {
    fetch = require('node-fetch');
  } catch (e2) {
    console.error('Neither globalThis.fetch nor node-fetch is available');
    console.error('Please install node-fetch: npm install node-fetch');
    process.exit(1);
  }
}

// Configuration
const BACKEND_URL = 'http://localhost:3001/api/v1/auth/login';

// Test credentials (using demo user)
const testCredentials = {
  identifier: 'demo@smarttechnologies-bd.com',
  password: 'Demo@123456',
  rememberMe: false
};

async function testLogin() {
  console.log('=== LOGIN DIAGNOSTIC TEST ===');
  console.log('Testing backend login endpoint...');
  console.log('URL:', BACKEND_URL);
  console.log('Credentials:', {
    identifier: testCredentials.identifier,
    password: '***',
    rememberMe: testCredentials.rememberMe
  });
  console.log('');

  try {
    const response = await fetch(BACKEND_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testCredentials),
    });

    console.log('Response Status:', response.status);
    console.log('Response Status Text:', response.statusText);
    console.log('Response Headers:', Object.fromEntries(response.headers.entries()));
    console.log('');

    // Get raw text first
    const rawText = await response.text();
    console.log('Raw Response Body (first 500 chars):', rawText.substring(0, 500));
    console.log('');

    // Try to parse as JSON
    let data;
    try {
      data = JSON.parse(rawText);
      console.log('Parsed Response Data:', JSON.stringify(data, null, 2));
    } catch (parseError) {
      console.error('Failed to parse JSON:', parseError.message);
      console.log('Response is not valid JSON');
    }
    console.log('');

    // Analyze response
    if (response.ok) {
      console.log('✅ Login successful!');
      console.log('User:', data?.user?.email);
      console.log('Token:', data?.token ? 'Present' : 'Missing');
      console.log('Session ID:', data?.sessionId ? 'Present' : 'Missing');
    } else {
      console.log('❌ Login failed!');
      console.log('Error:', data?.error);
      console.log('Message:', data?.message);
      console.log('MessageBn:', data?.messageBn);
      
      // Check for specific error conditions
      if (response.status === 401) {
        console.log('');
        console.log('Possible causes for 401 error:');
        console.log('1. Invalid credentials (email/password mismatch)');
        console.log('2. User not found in database');
        console.log('3. User password is null');
        console.log('4. User status is PENDING and verification is required');
        console.log('5. Database connection issue');
      }
    }
  } catch (error) {
    console.error('❌ Test failed with exception:', error.message);
    console.error('Error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack
    });
  }

  console.log('');
  console.log('=== DIAGNOSTIC TEST COMPLETE ===');
}

// Run the test
testLogin();
