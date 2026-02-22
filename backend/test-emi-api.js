/**
 * Test script to check EMI API endpoints
 * Run with: node test-emi-api.js
 */
const http = require('http');

const API_BASE = 'http://localhost:3001/api/v1/admin/emi';

// Test without authentication first
function testEndpoint(endpoint, method = 'GET', body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(endpoint, API_BASE);
    const options = {
      hostname: url.hostname,
      port: url.port || 3001,
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
      }
    };

    if (body) {
      options.headers['Content-Length'] = Buffer.byteLength(JSON.stringify(body));
    }

    console.log(`\nTesting: ${method} ${url.pathname + url.search}`);
    console.log(`Full URL: http://localhost:3001${url.pathname + url.search}`);

    const req = http.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          console.log(`Status: ${res.statusCode}`);
          console.log(`Response:`, JSON.stringify(jsonData, null, 2));
          resolve({ status: res.statusCode, data: jsonData });
        } catch (e) {
          console.log(`Status: ${res.statusCode}`);
          console.log(`Raw Response:`, data);
          resolve({ status: res.statusCode, data: data });
        }
      });
    });

    req.on('error', (error) => {
      console.error(`Error: ${error.message}`);
      reject(error);
    });

    if (body) {
      req.write(JSON.stringify(body));
    }

    req.end();
  });
}

async function runTests() {
  console.log('=== EMI API ENDPOINT TEST ===\n');

  try {
    // Test 1: Get providers
    console.log('1. Testing GET /admin/emi/providers?page=1&limit=5');
    const providersResult = await testEndpoint('/providers?page=1&limit=5');

    // Test 2: Get plans
    console.log('\n2. Testing GET /admin/emi/plans?page=1&limit=5');
    const plansResult = await testEndpoint('/plans?page=1&limit=5');

    console.log('\n=== TEST COMPLETE ===');
    console.log('\nSUMMARY:');
    console.log(`- Providers endpoint: ${providersResult.status === 200 ? '✓ Working' : '✗ Failed (' + providersResult.status + ')'}`);
    console.log(`- Plans endpoint: ${plansResult.status === 200 ? '✓ Working' : '✗ Failed (' + plansResult.status + ')'}`);

    if (providersResult.status === 401 || plansResult.status === 401) {
      console.log('\n⚠️  ISSUE IDENTIFIED: Authentication required!');
      console.log('   The API endpoints require authentication but no token was provided.');
    }

    if (providersResult.status === 403 || plansResult.status === 403) {
      console.log('\n⚠️  ISSUE IDENTIFIED: Permission denied!');
      console.log('   The user does not have the required permissions (emi:read).');
    }

  } catch (error) {
    console.error('\n❌ Test failed:', error);
  }
}

runTests();
