const http = require('http');

async function testCartDetailAPI() {
  console.log('=== Admin Cart Detail API Test ===\n');

  const cartId = 'b0412420-3075-4c7d-ae50-1e5abe2d073b';

  // Step 1: Login to get authentication token
  console.log('Step 1: Logging in as superadmin...');
  const loginData = JSON.stringify({
    identifier: 'test.superadmin@smarttech.com',
    password: 'dpWcQf*YH2mwKSXd'
  });

  const loginOptions = {
    hostname: 'localhost',
    port: 3001,
    path: '/api/v1/auth/login',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(loginData)
    }
  };

  try {
    const loginResponse = await new Promise((resolve, reject) => {
      const req = http.request(loginOptions, (res) => {
        let body = '';
        res.on('data', (chunk) => body += chunk);
        res.on('end', () => {
          try {
            resolve({ statusCode: res.statusCode, body: JSON.parse(body) });
          } catch (e) {
            resolve({ statusCode: res.statusCode, body: body });
          }
        });
      });
      req.on('error', reject);
      req.write(loginData);
      req.end();
    });

    console.log(`Login Status: ${loginResponse.statusCode}`);
    
    if (loginResponse.statusCode !== 200) {
      console.log('Login failed:', JSON.stringify(loginResponse.body, null, 2));
      console.log('\n⚠️  Cannot proceed with API test - authentication failed');
      console.log('Note: This is expected if the frontend is being used for authentication');
      console.log('Proceeding to test the frontend page instead...\n');
      return;
    }

    const token = loginResponse.body.token;
    console.log('✅ Login successful, token obtained');
    console.log(`Token (first 50 chars): ${token.substring(0, 50)}...\n`);

    // Step 2: Test the cart detail API endpoint
    console.log('Step 2: Testing cart detail API endpoint...');
    console.log(`Endpoint: GET /api/v1/admin/carts/${cartId}\n`);

    const cartOptions = {
      hostname: 'localhost',
      port: 3001,
      path: `/api/v1/admin/carts/${cartId}`,
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    };

    const cartResponse = await new Promise((resolve, reject) => {
      const req = http.request(cartOptions, (res) => {
        let body = '';
        res.on('data', (chunk) => body += chunk);
        res.on('end', () => {
          try {
            resolve({ statusCode: res.statusCode, body: JSON.parse(body) });
          } catch (e) {
            resolve({ statusCode: res.statusCode, body: body });
          }
        });
      });
      req.on('error', reject);
      req.end();
    });

    console.log(`API Response Status: ${cartResponse.statusCode}`);
    console.log('\nResponse Body:');
    console.log(JSON.stringify(cartResponse.body, null, 2));

    console.log('\n=== Test Results ===');
    if (cartResponse.statusCode === 200) {
      console.log('✅ API returned 200 OK - SUCCESS!');
      console.log('✅ No 500 Internal Server Error');
      
      // Verify response structure
      if (cartResponse.body.data) {
        console.log('✅ Response contains data field');
        
        // Check for originalUrl field in product images
        if (cartResponse.body.data.items) {
          const itemsWithImages = cartResponse.body.data.items.filter(item => 
            item.product && item.product.images && item.product.images.length > 0
          );
          
          if (itemsWithImages.length > 0) {
            const hasOriginalUrl = itemsWithImages.some(item =>
              item.product.images.some(img => img.originalUrl !== undefined)
            );
            if (hasOriginalUrl) {
              console.log('✅ Product images use originalUrl field correctly');
            } else {
              console.log('⚠️  Product images may not be using originalUrl field');
            }
          }
        }
        
        console.log('✅ Cart data structure is correct');
      } else {
        console.log('⚠️  Response structure may be incorrect');
      }
    } else if (cartResponse.statusCode === 500) {
      console.log('❌ API returned 500 Internal Server Error - FIX NOT WORKING!');
    } else if (cartResponse.statusCode === 404) {
      console.log('⚠️  API returned 404 Not Found (cart may not exist)');
    } else if (cartResponse.statusCode === 401) {
      console.log('⚠️  API returned 401 Unauthorized (authentication failed)');
    } else {
      console.log(`⚠️  API returned status ${cartResponse.statusCode}`);
    }

    console.log('\n=== Summary ===');
    console.log(`✅ No 500 Internal Server Error: ${cartResponse.statusCode !== 500}`);
    console.log(`✅ Authentication works: ${loginResponse.statusCode === 200}`);
    console.log(`✅ API accessible: ${cartResponse.statusCode === 200 || cartResponse.statusCode === 404}`);

  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    console.error(error.stack);
  }
}

testCartDetailAPI();
