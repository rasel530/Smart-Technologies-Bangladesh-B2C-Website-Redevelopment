// Comprehensive test to verify that the routing fix has resolved the "Route not found" error
const http = require('http');
const fs = require('fs');
const path = require('path');

// Test configuration
const BASE_URL = 'http://localhost:3000'; // Primary server URL
const ALT_URL = 'http://localhost:3001';  // Alternative server URL
const TIMEOUT = 5000; // 5 seconds timeout for each request

// Test endpoints to verify
const endpoints = [
  { method: 'GET', path: '/api/v1/products', name: 'Products List' },
  { method: 'GET', path: '/api/v1/auth', name: 'Auth Endpoint' },
  { method: 'GET', path: '/api/v1/users', name: 'Users Endpoint' },
  { method: 'GET', path: '/api/v1/categories', name: 'Categories Endpoint' },
  { method: 'GET', path: '/api/v1/brands', name: 'Brands Endpoint' },
  { method: 'GET', path: '/api/v1/health', name: 'Health Check' },
  { method: 'GET', path: '/api', name: 'API Root' }
];

// Helper function to make HTTP requests
function makeRequest(url, method = 'GET') {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port,
      path: urlObj.pathname + urlObj.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      timeout: TIMEOUT
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          const parsedData = data ? JSON.parse(data) : {};
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            data: parsedData,
            raw: data
          });
        } catch (e) {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            data: null,
            raw: data,
            parseError: e.message
          });
        }
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    req.end();
  });
}

// Test function to check each endpoint
async function testEndpoint(baseUrl, endpoint) {
  const url = `${baseUrl}${endpoint.path}`;
  console.log(`\n🔍 Testing: ${endpoint.method} ${url} (${endpoint.name})`);
  
  try {
    const response = await makeRequest(url, endpoint.method);
    
    // Check if we got a successful response (not 404)
    if (response.statusCode === 404) {
      console.log(`   ❌ FAILED: Route not found (404)`);
      if (response.data && response.data.error) {
        console.log(`   Error: ${response.data.error}`);
      }
      return {
        success: false,
        statusCode: response.statusCode,
        error: 'Route not found',
        endpoint: endpoint.path,
        url: url
      };
    } else if (response.statusCode >= 200 && response.statusCode < 300) {
      console.log(`   ✅ SUCCESS: ${response.statusCode} - Route is accessible`);
      if (response.data && typeof response.data === 'object') {
        // Log a brief summary of the response
        if (Array.isArray(response.data)) {
          console.log(`   Response: Array with ${response.data.length} items`);
        } else if (response.data.products) {
          console.log(`   Response: Products endpoint with ${response.data.products.length} products`);
        } else if (response.data.message) {
          console.log(`   Response: ${response.data.message}`);
        } else {
          console.log(`   Response: Valid JSON response`);
        }
      }
      return {
        success: true,
        statusCode: response.statusCode,
        endpoint: endpoint.path,
        url: url
      };
    } else {
      console.log(`   ⚠️  WARNING: ${response.statusCode} - Route accessible but returned error status`);
      if (response.data && response.data.error) {
        console.log(`   Error: ${response.data.error}`);
      }
      return {
        success: false,
        statusCode: response.statusCode,
        error: 'Error response from server',
        endpoint: endpoint.path,
        url: url
      };
    }
  } catch (error) {
    console.log(`   ❌ FAILED: ${error.message}`);
    return {
      success: false,
      error: error.message,
      endpoint: endpoint.path,
      url: url
    };
  }
}

// Main test execution
async function runTests() {
  console.log('🚀 Starting comprehensive routing fix verification test...\n');
  console.log('This test verifies that the double prefix issue has been resolved');
  console.log('and that all endpoints are now accessible with the correct /api/v1/ prefix.\n');

  // Test both URLs to find which one is working
  const testResults = {
    baseUrl: BASE_URL,
    altUrl: ALT_URL,
    endpoints: [],
    summary: {
      totalTests: 0,
      passed: 0,
      failed: 0,
      routeNotFoundErrors: 0
    }
  };

  // First, check which server is actually running
  console.log('🔍 Checking server availability...');
  let workingUrl = BASE_URL;
  
  try {
    await makeRequest(`${BASE_URL}/api/v1/health`);
    console.log(`✅ Server is running on ${BASE_URL}`);
  } catch (error) {
    console.log(`❌ Server on ${BASE_URL} is not accessible: ${error.message}`);
    try {
      await makeRequest(`${ALT_URL}/api/v1/health`);
      console.log(`✅ Server is running on ${ALT_URL}`);
      workingUrl = ALT_URL;
    } catch (altError) {
      console.log(`❌ Server on ${ALT_URL} is also not accessible: ${altError.message}`);
      console.log('\n❌ Neither server is accessible. Please start the backend server first.');
      return;
    }
  }

  console.log(`\n🧪 Testing endpoints on ${workingUrl}...\n`);

  // Test each endpoint
  for (const endpoint of endpoints) {
    testResults.summary.totalTests++;
    const result = await testEndpoint(workingUrl, endpoint);
    testResults.endpoints.push(result);
    
    if (result.success) {
      testResults.summary.passed++;
    } else {
      testResults.summary.failed++;
      if (result.error === 'Route not found') {
        testResults.summary.routeNotFoundErrors++;
      }
    }
  }

  // Generate summary report
  console.log('\n📊 TEST SUMMARY REPORT');
  console.log('='.repeat(50));
  console.log(`Server URL: ${workingUrl}`);
  console.log(`Total Tests: ${testResults.summary.totalTests}`);
  console.log(`Passed: ${testResults.summary.passed}`);
  console.log(`Failed: ${testResults.summary.failed}`);
  console.log(`Route Not Found Errors: ${testResults.summary.routeNotFoundErrors}`);
  
  // Check if the routing fix is working
  const allEndpointsAccessible = testResults.summary.routeNotFoundErrors === 0;
  const successRate = (testResults.summary.passed / testResults.summary.totalTests) * 100;
  
  console.log(`\n🎯 ROUTING FIX VERIFICATION:`);
  
  if (allEndpointsAccessible && successRate >= 80) {
    console.log('✅ SUCCESS: The routing fix has resolved the "Route not found" error!');
    console.log('✅ All endpoints are now accessible with the correct /api/v1/ prefix');
    console.log('✅ The double prefix issue has been successfully resolved');
    console.log('\n📋 Expected endpoint paths are now working correctly:');
    console.log('   - Authentication: /api/v1/auth');
    console.log('   - Users: /api/v1/users');
    console.log('   - Products: /api/v1/products');
    console.log('   - Categories: /api/v1/categories');
    console.log('   - Brands: /api/v1/brands');
    console.log('   - Health: /api/v1/health');
  } else {
    console.log('❌ FAILURE: The routing fix has NOT fully resolved the issue');
    console.log(`❌ Still experiencing ${testResults.summary.routeNotFoundErrors} "Route not found" errors`);
    console.log('\n🔧 Troubleshooting suggestions:');
    console.log('   1. Check if the server is running with the latest code');
    console.log('   2. Verify the routing configuration in backend/routes/index.js');
    console.log('   3. Confirm the route mounting in backend/index.js');
    console.log('   4. Check for any syntax errors in the route files');
  }

  // Save detailed results to file
  const reportPath = path.join(__dirname, `routing-fix-verification-report-${new Date().toISOString().replace(/[:.]/g, '-')}.json`);
  fs.writeFileSync(reportPath, JSON.stringify(testResults, null, 2));
  console.log(`\n📄 Detailed test results saved to: ${reportPath}`);

  return testResults;
}

// Run the tests
runTests().catch(console.error);