const http = require('http');

// Function to make HTTP requests
function makeRequest(path, method = 'GET') {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3001,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: data
        });
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    req.end();
  });
}

// Test function
async function testRouting() {
  console.log('='.repeat(80));
  console.log('API ROUTING TEST REPORT');
  console.log('='.repeat(80));
  console.log('Testing API endpoints with /api/v1/ prefix\n');

  const endpoints = [
    '/api/v1/products',
    '/api/v1/auth',
    '/api/v1/users',
    '/api/v1/categories',
    '/api/v1/brands',
    '/api/v1/orders',
    '/api/v1/cart',
    '/api/v1/wishlist',
    '/api/v1/reviews',
    '/api/v1/coupons',
    '/api/v1/health',
    '/api-docs'
  ];

  const results = [];

  for (const endpoint of endpoints) {
    try {
      console.log(`Testing: ${endpoint}`);
      const response = await makeRequest(endpoint);
      
      let status;
      if (response.statusCode === 200) {
        status = '✅ SUCCESS';
      } else if (response.statusCode === 404) {
        status = '❌ NOT FOUND';
      } else if (response.statusCode === 500) {
        status = '⚠️ SERVER ERROR';
      } else {
        status = `⚠️ HTTP ${response.statusCode}`;
      }

      console.log(`  Status: ${status}`);
      console.log(`  Response: ${response.body.substring(0, 100)}${response.body.length > 100 ? '...' : ''}`);
      console.log('');

      results.push({
        endpoint,
        status: response.statusCode,
        statusText: status,
        response: response.body
      });
    } catch (error) {
      console.log(`  Error: ${error.message}`);
      console.log('');
      
      results.push({
        endpoint,
        status: 'ERROR',
        statusText: '❌ CONNECTION ERROR',
        response: error.message
      });
    }
  }

  // Test the old routes for comparison
  console.log('='.repeat(80));
  console.log('TESTING OLD ROUTES FOR COMPARISON');
  console.log('='.repeat(80));
  
  const oldEndpoints = [
    '/v1/products',
    '/v1/auth',
    '/v1/users',
    '/v1/categories'
  ];

  for (const endpoint of oldEndpoints) {
    try {
      console.log(`Testing old route: ${endpoint}`);
      const response = await makeRequest(endpoint);
      
      let status;
      if (response.statusCode === 200) {
        status = '✅ SUCCESS';
      } else if (response.statusCode === 404) {
        status = '❌ NOT FOUND';
      } else if (response.statusCode === 500) {
        status = '⚠️ SERVER ERROR';
      } else {
        status = `⚠️ HTTP ${response.statusCode}`;
      }

      console.log(`  Status: ${status}`);
      console.log(`  Response: ${response.body.substring(0, 100)}${response.body.length > 100 ? '...' : ''}`);
      console.log('');

      results.push({
        endpoint: `${endpoint} (OLD)`,
        status: response.statusCode,
        statusText: status,
        response: response.body
      });
    } catch (error) {
      console.log(`  Error: ${error.message}`);
      console.log('');
      
      results.push({
        endpoint: `${endpoint} (OLD)`,
        status: 'ERROR',
        statusText: '❌ CONNECTION ERROR',
        response: error.message
      });
    }
  }

  // Summary
  console.log('='.repeat(80));
  console.log('TEST SUMMARY');
  console.log('='.repeat(80));
  
  const successCount = results.filter(r => r.status === 200).length;
  const notFoundCount = results.filter(r => r.status === 404).length;
  const serverErrorCount = results.filter(r => r.status === 500).length;
  const errorCount = results.filter(r => r.status === 'ERROR').length;
  
  console.log(`Total endpoints tested: ${results.length}`);
  console.log(`Successful (200): ${successCount}`);
  console.log(`Not found (404): ${notFoundCount}`);
  console.log(`Server error (500): ${serverErrorCount}`);
  console.log(`Connection errors: ${errorCount}`);
  console.log('');

  // Generate JSON report
  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      total: results.length,
      success: successCount,
      notFound: notFoundCount,
      serverError: serverErrorCount,
      connectionError: errorCount
    },
    results: results
  };

  // Save report to file
  const fs = require('fs');
  const reportFilename = `routing-test-report-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
  fs.writeFileSync(reportFilename, JSON.stringify(report, null, 2));
  
  console.log(`Detailed report saved to: ${reportFilename}`);
  
  // Conclusion
  console.log('\n' + '='.repeat(80));
  console.log('CONCLUSION');
  console.log('='.repeat(80));
  
  if (notFoundCount > 0) {
    console.log('❌ ROUTING ISSUE DETECTED');
    console.log('Some endpoints with /api/v1/ prefix are returning 404 errors.');
    console.log('This indicates that the routing fix has not been properly applied.');
  } else {
    console.log('✅ ROUTING APPEARS TO BE WORKING');
