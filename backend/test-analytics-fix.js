/**
 * Test script to verify the tracking analytics endpoint fix
 * This script will login as admin and test the analytics endpoint
 */

const http = require('http');

const BASE_URL = 'localhost';
const PORT = 3001;
const ADMIN_EMAIL = 'admin@smarttech.com';
const ADMIN_PASSWORD = 'AdminPassword123';

function makeRequest(method, path, data = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: BASE_URL,
      port: PORT,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
      });
      res.on('end', () => {
        try {
          const jsonData = body ? JSON.parse(body) : null;
          resolve({
            statusCode: res.statusCode,
            statusMessage: res.statusMessage,
            data: jsonData
          });
        } catch (error) {
          resolve({
            statusCode: res.statusCode,
            statusMessage: res.statusMessage,
            data: body,
            parseError: error.message
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

async function testAnalyticsEndpoint() {
  console.log('========================================');
  console.log('  TRACKING ANALYTICS FIX VERIFICATION');
  console.log('========================================\n');

  try {
    // Step 1: Login to get auth token
    console.log('Step 1: Logging in as admin...');
    const loginResponse = await makeRequest('POST', '/api/v1/auth/login', {
      identifier: ADMIN_EMAIL,
      password: ADMIN_PASSWORD
    });

    if (loginResponse.statusCode !== 200) {
      console.error('❌ Login failed:');
      console.error(`   Status: ${loginResponse.statusCode}`);
      console.error(`   Response: ${JSON.stringify(loginResponse.data)}`);
      console.log('\nPlease update the ADMIN_PASSWORD in this script with the correct password.');
      process.exit(1);
    }

    const token = loginResponse.data.token;
    console.log('✓ Login successful');
    console.log(`  Token: ${token.substring(0, 20)}...\n`);

    // Step 2: Test analytics endpoint
    console.log('Step 2: Testing /api/v1/admin/tracking/analytics...');
    const analyticsResponse = await makeRequest('GET', '/api/v1/admin/tracking/analytics', null, {
      'Authorization': `Bearer ${token}`
    });

    console.log(`Status: ${analyticsResponse.statusCode} ${analyticsResponse.statusMessage}`);
    
    if (analyticsResponse.statusCode === 500) {
      console.error('❌ 500 Internal Server Error - FIX FAILED');
      console.error(`   Response: ${JSON.stringify(analyticsResponse.data)}`);
      process.exit(1);
    } else if (analyticsResponse.statusCode === 200) {
      console.log('✓ 200 OK - FIX SUCCESSFUL');
      console.log(`   Response: ${JSON.stringify(analyticsResponse.data, null, 2).substring(0, 500)}...`);
    } else {
      console.log(`⚠ Unexpected status code: ${analyticsResponse.statusCode}`);
      console.log(`   Response: ${JSON.stringify(analyticsResponse.data)}`);
    }

    console.log('\n========================================');
    console.log('  VERIFICATION COMPLETE');
    console.log('========================================');

  } catch (error) {
    console.error('\n❌ Test failed with error:');
    console.error(error.message);
    process.exit(1);
  }
}

testAnalyticsEndpoint();
