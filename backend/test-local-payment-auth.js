/**
 * Test script to verify Local Payment API with authentication
 * This script:
 * 1. Logs in as super admin
 * 2. Gets the JWT token
 * 3. Tests the local payment methods endpoint with the token
 */

const http = require('http');

const config = {
  host: 'localhost',
  port: 3001
};

function makeRequest(options, data = null) {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    
    const req = http.request(options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        const duration = Date.now() - startTime;
        try {
          const parsedData = JSON.parse(responseData);
          resolve({
            statusCode: res.statusCode,
            data: parsedData,
            duration
          });
        } catch (e) {
          resolve({
            statusCode: res.statusCode,
            data: responseData,
            duration
          });
        }
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    req.setTimeout(10000, () => {
      req.destroy();
      reject(new Error('Request timeout after 10 seconds'));
    });
    
    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

async function loginAndGetToken() {
  console.log('\n' + '='.repeat(80));
  console.log('STEP 1: Logging in as super admin');
  console.log('='.repeat(80));
  
  const loginData = {
    identifier: 'admin@smarttech.com',
    password: 'AdminPassword123'
  };
  
  console.log('Login credentials:', { email: loginData.email });
  
  try {
    const result = await makeRequest({
      ...config,
      path: '/api/v1/auth/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    }, loginData);
    
    console.log('Status Code:', result.statusCode);
    console.log('Duration:', result.duration, 'ms');
    
    if (result.statusCode === 200 && result.data.token) {
      console.log('✓ Login successful');
      console.log('Token received:', result.data.token.substring(0, 50) + '...');
      return result.data.token;
    } else {
      console.log('✗ Login failed');
      console.log('Response:', JSON.stringify(result.data, null, 2));
      return null;
    }
  } catch (error) {
    console.error('✗ Login request failed:', error.message);
    return null;
  }
}

async function testLocalPaymentMethods(token) {
  console.log('\n' + '='.repeat(80));
  console.log('STEP 2: Testing Local Payment Methods endpoint');
  console.log('='.repeat(80));
  
  try {
    const result = await makeRequest({
      ...config,
      path: '/api/v1/admin/local-payment/methods',
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('Status Code:', result.statusCode);
    console.log('Duration:', result.duration, 'ms');
    
    if (result.statusCode === 200 && result.data.success) {
      console.log('✓ Request successful');
      console.log('Methods count:', result.data.data.length);
      console.log('\nPayment Methods:');
      result.data.data.forEach((method, index) => {
        console.log(`\n${index + 1}. ${method.displayName} (${method.code})`);
        console.log(`   ID: ${method.id}`);
        console.log(`   Active: ${method.isActive}`);
      });
      return true;
    } else {
      console.log('✗ Request failed');
      console.log('Response:', JSON.stringify(result.data, null, 2));
      return false;
    }
  } catch (error) {
    console.error('✗ Request failed:', error.message);
    return false;
  }
}

async function runTest() {
  console.log('\n' + '='.repeat(80));
  console.log('LOCAL PAYMENT METHODS API AUTHENTICATION TEST');
  console.log('='.repeat(80));
  
  // Step 1: Login
  const token = await loginAndGetToken();
  
  if (!token) {
    console.log('\n' + '='.repeat(80));
    console.log('TEST ABORTED: Could not obtain authentication token');
    console.log('='.repeat(80));
    console.log('\nPossible solutions:');
    console.log('1. Ensure the super admin user exists');
    console.log('2. Run: node create-super-admin.js');
    console.log('3. Check the password in the script');
    console.log('='.repeat(80) + '\n');
    return;
  }
  
  // Step 2: Test endpoint
  const success = await testLocalPaymentMethods(token);
  
  console.log('\n' + '='.repeat(80));
  console.log('TEST SUMMARY');
  console.log('='.repeat(80));
  
  if (success) {
    console.log('✓ Authentication middleware fix verified');
    console.log('✓ Local Payment Methods endpoint is working correctly');
    console.log('✓ Data is being returned successfully');
  } else {
    console.log('✗ Test failed');
  }
  
  console.log('='.repeat(80) + '\n');
}

runTest().catch(error => {
  console.error('Test suite failed:', error);
  process.exit(1);
});
