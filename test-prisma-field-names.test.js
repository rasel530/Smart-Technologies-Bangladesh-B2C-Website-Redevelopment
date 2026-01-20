const http = require('http');

// Test script to verify Prisma field names are correct
const BASE_URL = 'http://localhost:3001';

// Function to make HTTP request
function makeRequest(method, path, data = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const options = {
      hostname: url.hostname,
      port: url.port || 3001,
      path: url.pathname + url.search,
      method: method,
      headers: {
        ...headers
      }
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: body ? JSON.parse(body) : null
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: body
          });
        }
      });
    });

    req.on('error', reject);

    if (data) {
      req.write(typeof data === 'string' ? data : Buffer.from(data));
    }

    req.end();
  });
}

async function testPrismaFieldNames() {
  console.log('=== Testing Prisma Field Names ===\n');

  // Use existing test credentials
  const testEmail = 'raselbepari88@gmail.com';
  const testPassword = '54Vfo^71~_oQ';

  try {
    // Step 1: Login to get JWT token
    console.log('Step 1: Logging in with existing user...');
    const loginResponse = await makeRequest('POST', '/api/v1/auth/login', {
      identifier: testEmail,
      password: testPassword
    });

    console.log(`Status: ${loginResponse.status}`);
    console.log(`Response: ${JSON.stringify(loginResponse.data, null, 2)}`);

    if (loginResponse.status !== 200) {
      console.error('Failed to login');
      return;
    }

    const token = loginResponse.data.token;
    const userId = loginResponse.data.user?.id;
    console.log(`JWT Token: ${token.substring(0, 20)}...`);
    console.log(`User ID: ${userId}\n`);

    // Step 2: Test corporate registration endpoint
    console.log('Step 2: Testing corporate registration endpoint...');
    console.log('This will test if Prisma field names are correct\n');

    // Create a minimal test with FormData (using boundary for multipart)
    const boundary = '----WebKitFormBoundary' + Math.random().toString(16).substring(2);
    const formData = [
      `--${boundary}`,
      'Content-Disposition: form-data; name="userId"',
      '',
      userId,
      `--${boundary}`,
      'Content-Disposition: form-data; name="companyName"',
      '',
      'Test Company Ltd',
      `--${boundary}`,
      'Content-Disposition: form-data; name="companyRegistrationNumber"',
      '',
      `REG${Date.now()}`,
      `--${boundary}`,
      'Content-Disposition: form-data; name="businessAddress"',
      '',
      '123 Test Street',
      `--${boundary}`,
      'Content-Disposition: form-data; name="division"',
      '',
      'Dhaka',
      `--${boundary}`,
      'Content-Disposition: form-data; name="district"',
      '',
      'Dhaka',
      `--${boundary}`,
      'Content-Disposition: form-data; name="authorizedPersonName"',
      '',
      'Test Person',
      `--${boundary}`,
      'Content-Disposition: form-data; name="authorizedPersonEmail"',
      '',
      testEmail,
      `--${boundary}`,
      'Content-Disposition: form-data; name="authorizedPersonPhone"',
      '',
      '+8801912345678',
      `--${boundary}`,
      'Content-Disposition: form-data; name="companyEmail"',
      '',
      testEmail,
      `--${boundary}`,
      'Content-Disposition: form-data; name="tradeLicense"; filename="test.txt"',
      'Content-Type: text/plain',
      '',
      'This is a test file for trade license',
      `--${boundary}--`,
      ''
    ].join('\r\n');

    const corpResponse = await makeRequest('POST', '/api/v1/corporate/register', formData, {
      'Content-Type': `multipart/form-data; boundary=${boundary}`,
      'Authorization': `Bearer ${token}`
    });

    console.log(`Status: ${corpResponse.status}`);
    console.log(`Response: ${JSON.stringify(corpResponse.data, null, 2)}\n`);

    // Step 3: Check backend logs
    console.log('Step 3: Checking backend logs for Prisma errors...');
    console.log('Run: docker logs smarttech_backend --tail 50 | findstr /i "prisma\\|error\\|corporate"\n');

    // Summary
    console.log('=== Test Summary ===');
    console.log(`User Login: ${loginResponse.status === 200 ? 'PASS' : 'FAIL'}`);
    console.log(`Corporate Registration: ${corpResponse.status === 201 ? 'PASS' : 'FAIL'}`);

    if (corpResponse.status === 500) {
      console.log('\n⚠️  500 Error detected - Prisma field name issue likely exists');
      console.log('Check backend logs for Prisma validation errors');
    } else if (corpResponse.status === 201) {
      console.log('\n✅ Corporate registration successful - Prisma field names are correct');
    } else {
      console.log(`\n⚠️  Unexpected status code: ${corpResponse.status}`);
    }

  } catch (error) {
    console.error('Error:', error.message);
  }
}

// Run the test
testPrismaFieldNames();
