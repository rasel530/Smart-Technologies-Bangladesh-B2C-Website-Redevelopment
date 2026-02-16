const http = require('http');

// Test configuration
const config = {
  backendUrl: 'http://localhost:3001',
  email: 'test.superadmin@smarttech.com',
  password: 'dpWcQf*YH2mwKSXd',
  cartId: 'b0412420-3075-4c7d-ae50-1e5abe2d073b'
};

function makeRequest(options, data = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';

      res.on('data', (chunk) => {
        body += chunk;
      });

      res.on('end', () => {
        try {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: body ? JSON.parse(body) : null
          });
        } catch (e) {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: body
          });
        }
      });
    });

    req.on('error', (e) => {
      reject(e);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

async function testCartDetailAPI() {
  try {
    console.log('=== Admin Cart Detail API Test ===\n');

    // Step 1: Login to get token
    console.log('1. Logging in as superadmin...');
    const loginOptions = {
      hostname: 'localhost',
      port: 3001,
      path: '/api/v1/auth/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const loginResponse = await makeRequest(loginOptions, {
      identifier: config.email,
      password: config.password
    });

    console.log(`   Status: ${loginResponse.statusCode}`);

    if (loginResponse.statusCode !== 200) {
      console.log('❌ Login failed!');
      console.log('   Response:', JSON.stringify(loginResponse.body, null, 2));
      return;
    }

    const token = loginResponse.body.token || loginResponse.body.data?.token;
    if (!token) {
      console.log('❌ No token received in login response!');
      console.log('   Response:', JSON.stringify(loginResponse.body, null, 2));
      return;
    }

    console.log('✅ Login successful, token received');
    console.log(`   Token (first 50 chars): ${token.substring(0, 50)}...`);

    console.log('\n');

    // Step 2: Test cart detail endpoint
    console.log('2. Testing cart detail endpoint...');
    console.log(`   Endpoint: GET /api/v1/admin/carts/${config.cartId}`);

    const cartOptions = {
      hostname: 'localhost',
      port: 3001,
      path: `/api/v1/admin/carts/${config.cartId}`,
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    };

    const cartResponse = await makeRequest(cartOptions);

    console.log(`   Status: ${cartResponse.statusCode}`);
    console.log(`   Content-Type: ${cartResponse.headers['content-type']}`);

    console.log('\n   Response body:');
    console.log(JSON.stringify(cartResponse.body, null, 2));

    console.log('\n');

    // Step 3: Analyze results
    console.log('3. Test Results Analysis:');

    if (cartResponse.statusCode === 200) {
      console.log('✅ SUCCESS: API returned 200 OK');
      console.log('✅ Cart data retrieved successfully');
      console.log('✅ RBAC middleware passed');
      console.log('✅ No 500 Internal Server Error');
    } else if (cartResponse.statusCode === 404) {
      console.log('⚠️  Cart not found (404) - This is acceptable');
      console.log('✅ RBAC middleware passed (got past authentication)');
      console.log('✅ No 500 Internal Server Error');
    } else if (cartResponse.statusCode === 500) {
      console.log('❌ FAILURE: API returned 500 Internal Server Error');
      console.log('❌ Fix did not resolve the issue');
    } else if (cartResponse.statusCode === 401 || cartResponse.statusCode === 403) {
      console.log('❌ FAILURE: Authentication/Authorization failed');
      console.log(`   Status: ${cartResponse.statusCode}`);
    } else {
      console.log(`⚠️  Unexpected status code: ${cartResponse.statusCode}`);
    }

    console.log('\n');

    // Step 4: Check for error messages
    if (cartResponse.body && cartResponse.body.error) {
      console.log('4. Error Message Check:');
      if (cartResponse.body.error.includes('Failed to retrieve cart')) {
        console.log('❌ Found "Failed to retrieve cart" error - Fix may not be complete');
      } else {
        console.log(`ℹ️  Error message: ${cartResponse.body.error}`);
      }
    }

    console.log('\n=== Test Complete ===');

  } catch (error) {
    console.error('\n❌ ERROR during test:', error.message);
    console.error(error.stack);
  }
}

testCartDetailAPI();
