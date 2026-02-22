/**
 * Test script for /api/v1/admin/carts/recovery/stats endpoint
 * This script verifies the 404 error has been fixed
 */

const http = require('http');

// Configuration
const config = {
  host: 'localhost',
  port: process.env.BACKEND_PORT || 3001,
  path: '/api/v1/admin/carts/recovery/stats',
  method: 'GET'
};

// Test options
const testOptions = {
  hostname: config.host,
  port: config.port,
  path: config.path,
  method: config.method,
  headers: {
    'Content-Type': 'application/json'
  }
};

console.log('='.repeat(70));
console.log('Testing /api/v1/admin/carts/recovery/stats endpoint');
console.log('='.repeat(70));
console.log(`URL: http://${config.host}:${config.port}${config.path}`);
console.log(`Method: ${config.method}`);
console.log('');

// Test 1: Without authentication (should return 401)
console.log('Test 1: Request without authentication');
console.log('-'.repeat(70));

const req1 = http.request(testOptions, (res) => {
  console.log(`Status Code: ${res.statusCode}`);
  console.log(`Status Message: ${res.statusMessage}`);
  
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    try {
      const response = JSON.parse(data);
      console.log('Response:', JSON.stringify(response, null, 2));
      
      if (res.statusCode === 401) {
        console.log('✓ PASS: Correctly returned 401 for unauthenticated request');
      } else if (res.statusCode === 404) {
        console.log('✗ FAIL: Returned 404 - route not found (this was the original issue)');
      } else {
        console.log(`? UNEXPECTED: Returned ${res.statusCode}`);
      }
    } catch (e) {
      console.log('Response (raw):', data);
    }
    
    console.log('');
    console.log('Test 2: Request with invalid token (should return 401)');
    console.log('-'.repeat(70));
    
    const authOptions = {
      ...testOptions,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer invalid_token_here'
      }
    };
    
    const req2 = http.request(authOptions, (res2) => {
      console.log(`Status Code: ${res2.statusCode}`);
      console.log(`Status Message: ${res2.statusMessage}`);
      
      let data2 = '';
      res2.on('data', (chunk) => {
        data2 += chunk;
      });
      
      res2.on('end', () => {
        try {
          const response2 = JSON.parse(data2);
          console.log('Response:', JSON.stringify(response2, null, 2));
          
          if (res2.statusCode === 401) {
            console.log('✓ PASS: Correctly returned 401 for invalid token');
          } else if (res2.statusCode === 404) {
            console.log('✗ FAIL: Returned 404 - route not found (this was the original issue)');
          } else {
            console.log(`? UNEXPECTED: Returned ${res2.statusCode}`);
          }
        } catch (e) {
          console.log('Response (raw):', data2);
        }
        
        console.log('');
        console.log('='.repeat(70));
        console.log('Test Summary');
        console.log('='.repeat(70));
        console.log('');
        console.log('If both tests returned 401 (not 404), the fix is successful!');
        console.log('The endpoint is now properly registered and accessible.');
        console.log('');
        console.log('To test with valid authentication:');
        console.log('1. Get a valid JWT token from /api/v1/auth/login');
        console.log('2. Add the token to the Authorization header');
        console.log('3. Make the request again');
        console.log('');
      });
    });
    
    req2.on('error', (error) => {
      console.error('Error:', error.message);
      console.log('');
      console.log('Note: Make sure the backend server is running!');
    });
    
    req2.end();
  });
});

req1.on('error', (error) => {
  console.error('Error:', error.message);
  console.log('');
  console.log('Note: Make sure the backend server is running!');
  console.log('Start it with: npm run dev (from backend directory)');
});

req1.end();
