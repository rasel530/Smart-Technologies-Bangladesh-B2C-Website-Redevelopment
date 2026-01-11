/**
 * Test script to verify registration with a strong password
 * This tests if the registration endpoint works with a password that meets all requirements
 */

const http = require('http');

// Test configuration
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3001';
const API_ENDPOINT = '/api/v1/auth/register';

// Test user data with a strong password that meets all requirements
const testUserData = {
  email: `test_${Date.now()}@example.com`,
  password: 'SecureP@ssw0rd!2024',
  confirmPassword: 'SecureP@ssw0rd!2024',
  firstName: 'John',
  lastName: 'Doe'
};

console.log('='.repeat(80));
console.log('REGISTRATION WITH STRONG PASSWORD TEST');
console.log('='.repeat(80));
console.log(`Backend URL: ${BACKEND_URL}`);
console.log(`API Endpoint: ${API_ENDPOINT}`);
console.log(`Test Data:`, JSON.stringify(testUserData, null, 2));
console.log('='.repeat(80));

// Function to make HTTP request
function makeRequest(url, method, data) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || (urlObj.protocol === 'https:' ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
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

// Test registration with strong password
async function testRegistration() {
  console.log('\n[TEST] Testing registration with strong password...');
  try {
    const response = await makeRequest(
      `${BACKEND_URL}${API_ENDPOINT}`,
      'POST',
      testUserData
    );

    console.log(`✅ Registration endpoint responded`);
    console.log(`   Status Code: ${response.statusCode}`);
    console.log(`   Response Headers:`, {
      'Content-Type': response.headers['content-type'],
      'Access-Control-Allow-Origin': response.headers['access-control-allow-origin']
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
    console.log(`\n❌ Registration request failed`);
    console.log(`   Error: ${error.message}`);
    console.log(`   Error Code: ${error.code}`);
    return false;
  }
}

// Run test
testRegistration().then((success) => {
  console.log('\n' + '='.repeat(80));
  if (success) {
    console.log('CONCLUSION: Registration endpoint is working correctly');
    console.log('The "Failed to fetch" error in the frontend is likely due to:');
    console.log('1. Frontend error handling issue');
    console.log('2. Network/CORS configuration issue on the client side');
    console.log('3. Frontend using wrong API URL');
  } else {
    console.log('CONCLUSION: Registration endpoint has issues');
    console.log('Need to investigate the backend implementation');
  }
  console.log('='.repeat(80));
  process.exit(success ? 0 : 1);
}).catch((error) => {
  console.error('\nFATAL ERROR:', error);
  process.exit(1);
});
