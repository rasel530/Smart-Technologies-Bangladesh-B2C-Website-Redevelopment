/**
 * Test script to simulate browser-like request to registration endpoint
 * This tests with proper headers and origin to match browser behavior
 */

const http = require('http');

// Test configuration
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3001';
const API_ENDPOINT = '/api/v1/auth/register';

// Test user data with a strong password
const testUserData = {
  email: `test_${Date.now()}@example.com`,
  password: 'SecureP@ssw0rd!2024',
  confirmPassword: 'SecureP@ssw0rd!2024',
  firstName: 'John',
  lastName: 'Doe'
};

console.log('='.repeat(80));
console.log('BROWSER-LIKE REQUEST TEST');
console.log('='.repeat(80));
console.log(`Backend URL: ${BACKEND_URL}`);
console.log(`API Endpoint: ${API_ENDPOINT}`);
console.log(`Test Data:`, JSON.stringify(testUserData, null, 2));
console.log('='.repeat(80));

// Function to make HTTP request with browser-like headers
function makeBrowserLikeRequest(url, method, data) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || (urlObj.protocol === 'https:' ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Origin': 'http://localhost:3000',
        'Referer': 'http://localhost:3000/register'
      }
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
      });
      res.on('end', () => {
        try {
          const parsedBody = body ? JSON.parse(body) : null;
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: parsedBody,
            rawBody: body
          });
        } catch (e) {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: null,
            rawBody: body
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

// Test registration with browser-like headers
async function testRegistration() {
  console.log('\n[TEST] Testing registration with browser-like headers...');
  try {
    const response = await makeBrowserLikeRequest(
      `${BACKEND_URL}${API_ENDPOINT}`,
      'POST',
      testUserData
    );

    console.log(`✅ Request completed`);
    console.log(`   Status Code: ${response.statusCode}`);
    console.log(`   Response Headers:`, {
      'Content-Type': response.headers['content-type'],
      'Access-Control-Allow-Origin': response.headers['access-control-allow-origin'],
      'Access-Control-Allow-Credentials': response.headers['access-control-allow-credentials'],
      'Access-Control-Allow-Methods': response.headers['access-control-allow-methods']
    });
    
    if (response.body) {
      console.log(`   Response Body:`, JSON.stringify(response.body, null, 2));
    }

    if (response.statusCode >= 200 && response.statusCode < 300) {
      console.log(`\n✅ SUCCESS: Registration completed successfully!`);
      console.log(`   User ID: ${response.body.user?.id}`);
      console.log(`   Email: ${response.body.user?.email}`);
      console.log(`   Status: ${response.body.user?.status}`);
      return true;
    } else {
      console.log(`\n⚠️  Registration returned status ${response.statusCode}`);
      console.log(`   Error: ${response.body?.error || response.body?.message}`);
      return false;
    }
  } catch (error) {
    console.log(`\n❌ Request failed`);
    console.log(`   Error: ${error.message}`);
    console.log(`   Error Code: ${error.code}`);
    console.log(`   Error Stack:`, error.stack);
    return false;
  }
}

// Run test
testRegistration().then((success) => {
  console.log('\n' + '='.repeat(80));
  if (success) {
    console.log('CONCLUSION: Backend is working correctly with browser-like requests');
    console.log('If frontend still shows "Failed to fetch", check:');
    console.log('1. Browser console for specific errors');
    console.log('2. Network tab in DevTools');
    console.log('3. Frontend is making request to correct URL');
    console.log('4. No browser extensions blocking requests');
  } else {
    console.log('CONCLUSION: Backend has issues with browser-like requests');
    console.log('Need to investigate CORS or request handling');
  }
  console.log('='.repeat(80));
  process.exit(success ? 0 : 1);
}).catch((error) => {
  console.error('\nFATAL ERROR:', error);
  process.exit(1);
});
