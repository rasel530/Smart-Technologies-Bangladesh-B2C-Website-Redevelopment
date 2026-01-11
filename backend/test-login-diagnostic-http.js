/**
 * Login Diagnostic Test using native HTTP module
 * 
 * This script tests the backend login endpoint to diagnose the CredentialsSignin 401 error
 */

const http = require('http');

// Configuration
const BACKEND_URL = 'http://localhost:3001/api/v1/auth/login';
const PARSED_URL = new URL(BACKEND_URL);

// Test credentials (using demo user)
const testCredentials = {
  identifier: 'demo@smarttechnologies-bd.com',
  password: 'Demo@123456',
  rememberMe: false
};

function testLogin() {
  console.log('=== LOGIN DIAGNOSTIC TEST ===');
  console.log('Testing backend login endpoint...');
  console.log('URL:', BACKEND_URL);
  console.log('Credentials:', {
    identifier: testCredentials.identifier,
    password: '***',
    rememberMe: testCredentials.rememberMe
  });
  console.log('');

  const postData = JSON.stringify(testCredentials);

  const options = {
    hostname: PARSED_URL.hostname,
    port: PARSED_URL.port || 80,
    path: PARSED_URL.pathname + PARSED_URL.search,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData)
    }
  };

  const req = http.request(options, (res) => {
    console.log('Response Status:', res.statusCode);
    console.log('Response Status Text:', res.statusMessage);
    console.log('Response Headers:', res.headers);
    console.log('');

    let data = '';

    res.on('data', (chunk) => {
      data += chunk;
    });

    res.on('end', () => {
      console.log('Raw Response Body (first 500 chars):', data.substring(0, 500));
      console.log('');

      // Try to parse as JSON
      let parsedData;
      try {
        parsedData = JSON.parse(data);
        console.log('Parsed Response Data:', JSON.stringify(parsedData, null, 2));
      } catch (parseError) {
        console.error('Failed to parse JSON:', parseError.message);
        console.log('Response is not valid JSON');
      }
      console.log('');

      // Analyze response
      if (res.statusCode >= 200 && res.statusCode < 300) {
        console.log('✅ Login successful!');
        console.log('User:', parsedData?.user?.email);
        console.log('Token:', parsedData?.token ? 'Present' : 'Missing');
        console.log('Session ID:', parsedData?.sessionId ? 'Present' : 'Missing');
      } else {
        console.log('❌ Login failed!');
        console.log('Error:', parsedData?.error);
        console.log('Message:', parsedData?.message);
        console.log('MessageBn:', parsedData?.messageBn);
        
        // Check for specific error conditions
        if (res.statusCode === 401) {
          console.log('');
          console.log('Possible causes for 401 error:');
          console.log('1. Invalid credentials (email/password mismatch)');
          console.log('2. User not found in database');
          console.log('3. User password is null');
          console.log('4. User status is PENDING and verification is required');
          console.log('5. Database connection issue');
        } else if (res.statusCode === 403) {
          console.log('');
          console.log('Possible causes for 403 error:');
          console.log('1. Account not verified (email or phone verification required)');
          console.log('2. Account is disabled or suspended');
        } else if (res.statusCode === 500) {
          console.log('');
          console.log('Possible causes for 500 error:');
          console.log('1. Server internal error');
          console.log('2. Database connection issue');
          console.log('3. Missing environment variables (JWT_SECRET)');
        }
      }

      console.log('');
      console.log('=== DIAGNOSTIC TEST COMPLETE ===');
    });
  });

  req.on('error', (error) => {
    console.error('❌ Test failed with exception:', error.message);
    console.error('Error details:', {
      name: error.name,
      message: error.message,
      code: error.code
    });
    console.log('');
    console.log('=== DIAGNOSTIC TEST COMPLETE ===');
  });

  req.write(postData);
  req.end();
}

// Run test
testLogin();
