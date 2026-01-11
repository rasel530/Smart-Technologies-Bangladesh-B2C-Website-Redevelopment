/**
 * API Test Script for Rebuild Verification
 * Tests critical endpoints to ensure the backend is working after rebuild
 */

const http = require('http');

const BASE_URL = 'localhost';
const BACKEND_PORT = 3001;

const endpoints = [
  { path: '/health', method: 'GET', description: 'Health Check' },
  { path: '/api/v1/health', method: 'GET', description: 'API Health Check' },
];

function testEndpoint(endpoint) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: BASE_URL,
      port: BACKEND_PORT,
      path: endpoint.path,
      method: endpoint.method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    const req = http.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        resolve({
          endpoint: endpoint.path,
          method: endpoint.method,
          description: endpoint.description,
          status: res.statusCode,
          success: res.statusCode >= 200 && res.statusCode < 300,
          response: data,
        });
      });
    });

    req.on('error', (error) => {
      resolve({
        endpoint: endpoint.path,
        method: endpoint.method,
        description: endpoint.description,
        status: 'ERROR',
        success: false,
        response: error.message,
      });
    });

    req.setTimeout(5000, () => {
      req.destroy();
      resolve({
        endpoint: endpoint.path,
        method: endpoint.method,
        description: endpoint.description,
        status: 'TIMEOUT',
        success: false,
        response: 'Request timed out after 5 seconds',
      });
    });

    req.end();
  });
}

async function runTests() {
  console.log('='.repeat(60));
  console.log('Backend API Rebuild Verification Test');
  console.log('='.repeat(60));
  console.log(`Testing backend at: http://${BASE_URL}:${BACKEND_PORT}`);
  console.log('');

  let passedTests = 0;
  let failedTests = 0;

  for (const endpoint of endpoints) {
    console.log(`Testing: ${endpoint.description} (${endpoint.method} ${endpoint.path})`);
    const result = await testEndpoint(endpoint);

    if (result.success) {
      console.log(`  ✅ PASSED - Status: ${result.status}`);
      passedTests++;
    } else {
      console.log(`  ❌ FAILED - Status: ${result.status}`);
      console.log(`     Error: ${result.response}`);
      failedTests++;
    }
    console.log('');
  }

  console.log('='.repeat(60));
  console.log('Test Summary');
  console.log('='.repeat(60));
  console.log(`Total Tests: ${endpoints.length}`);
  console.log(`Passed: ${passedTests}`);
  console.log(`Failed: ${failedTests}`);
  console.log('='.repeat(60));

  if (failedTests === 0) {
    console.log('✅ All tests passed! Backend is running successfully.');
    process.exit(0);
  } else {
    console.log('❌ Some tests failed. Please check the backend logs.');
    process.exit(1);
  }
}

runTests().catch((error) => {
  console.error('Test execution error:', error);
  process.exit(1);
});
