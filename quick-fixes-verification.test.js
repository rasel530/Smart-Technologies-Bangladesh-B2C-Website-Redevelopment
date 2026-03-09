#!/usr/bin/env node

/**
 * Quick Verification Test for Permanent Fixes
 * Tests all fixes using correct Docker hostname
 */

const http = require('http');

const BACKEND_URL = 'http://host.docker.internal:3001';

console.log('🧪 QUICK PERMANENT FIXES VERIFICATION TEST');
console.log('================================================================================\n');

const results = {
  total: 0,
  passed: 0,
  failed: 0,
  tests: []
};

async function makeRequest(method, path, headers = {}) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'host.docker.internal',
      port: 3001,
      path: path,
      method: method,
      headers: headers
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: data
        });
      });
    });

    req.on('error', reject);
    req.setTimeout(5000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
    req.end();
  });
}

async function testWishlistAuth() {
  console.log('🧪 Test 1: Verify Wishlist Endpoint Authentication');
  console.log('Testing wishlist endpoint without authentication...');
  
  try {
    const response = await makeRequest('GET', '/api/v1/wishlist');
    
    results.total++;
    
    if (response.statusCode === 401) {
      console.log('✅ PASS: Wishlist endpoint returns 401 without auth');
      console.log('Response:', response.statusCode);
      results.passed++;
      results.tests.push({
        name: 'Wishlist Endpoint Authentication',
        status: 'PASS',
        details: 'Returns 401 without authentication'
      });
    } else {
      console.log('❌ FAIL: Expected 401, got', response.statusCode);
      results.failed++;
      results.tests.push({
        name: 'Wishlist Endpoint Authentication',
        status: 'FAIL',
        details: `Expected 401, got ${response.statusCode}`
      });
    }
  } catch (error) {
    console.log('❌ FAIL: Request failed:', error.message);
    results.total++;
    results.failed++;
    results.tests.push({
      name: 'Wishlist Endpoint Authentication',
      status: 'FAIL',
      details: `Request failed: ${error.message}`
    });
  }
  console.log();
}

async function testAdminDashboard() {
  console.log('🧪 Test 2: Verify Admin Dashboard Endpoint');
  console.log('Testing admin dashboard endpoint without authentication...');
  
  try {
    const response = await makeRequest('GET', '/api/v1/admin/dashboard');
    
    results.total++;
    
    if (response.statusCode === 401 || response.statusCode === 403) {
      console.log('✅ PASS: Admin dashboard requires authentication');
      console.log('Response:', response.statusCode);
      results.passed++;
      results.tests.push({
        name: 'Admin Dashboard Endpoint',
        status: 'PASS',
        details: `Returns ${response.statusCode} without authentication`
      });
    } else if (response.statusCode === 404) {
      console.log('❌ FAIL: Admin dashboard endpoint not found (404)');
      results.failed++;
      results.tests.push({
        name: 'Admin Dashboard Endpoint',
        status: 'FAIL',
        details: 'Endpoint returns 404 - route not configured'
      });
    } else {
      console.log('❌ FAIL: Unexpected status code:', response.statusCode);
      results.failed++;
      results.tests.push({
        name: 'Admin Dashboard Endpoint',
        status: 'FAIL',
        details: `Unexpected status code: ${response.statusCode}`
      });
    }
  } catch (error) {
    console.log('❌ FAIL: Request failed:', error.message);
    results.total++;
    results.failed++;
    results.tests.push({
      name: 'Admin Dashboard Endpoint',
      status: 'FAIL',
      details: `Request failed: ${error.message}`
    });
  }
  console.log();
}

async function testAdminProducts() {
  console.log('🧪 Test 3: Verify Admin Products Endpoint');
  console.log('Testing admin products endpoint without authentication...');
  
  try {
    const response = await makeRequest('GET', '/api/v1/admin/products');
    
    results.total++;
    
    if (response.statusCode === 401 || response.statusCode === 403) {
      console.log('✅ PASS: Admin products requires authentication');
      console.log('Response:', response.statusCode);
      results.passed++;
      results.tests.push({
        name: 'Admin Products Endpoint',
        status: 'PASS',
        details: `Returns ${response.statusCode} without authentication`
      });
    } else if (response.statusCode === 404) {
      console.log('❌ FAIL: Admin products endpoint not found (404)');
      results.failed++;
      results.tests.push({
        name: 'Admin Products Endpoint',
        status: 'FAIL',
        details: 'Endpoint returns 404 - route not configured'
      });
    } else {
      console.log('❌ FAIL: Unexpected status code:', response.statusCode);
      results.failed++;
      results.tests.push({
        name: 'Admin Products Endpoint',
        status: 'FAIL',
        details: `Unexpected status code: ${response.statusCode}`
      });
    }
  } catch (error) {
    console.log('❌ FAIL: Request failed:', error.message);
    results.total++;
    results.failed++;
    results.tests.push({
      name: 'Admin Products Endpoint',
      status: 'FAIL',
      details: `Request failed: ${error.message}`
    });
  }
  console.log();
}

async function testAdminUsers() {
  console.log('🧪 Test 4: Verify Admin Users Endpoint');
  console.log('Testing admin users endpoint without authentication...');
  
  try {
    const response = await makeRequest('GET', '/api/v1/admin/users');
    
    results.total++;
    
    if (response.statusCode === 401 || response.statusCode === 403) {
      console.log('✅ PASS: Admin users requires authentication');
      console.log('Response:', response.statusCode);
      results.passed++;
      results.tests.push({
        name: 'Admin Users Endpoint',
        status: 'PASS',
        details: `Returns ${response.statusCode} without authentication`
      });
    } else if (response.statusCode === 404) {
      console.log('❌ FAIL: Admin users endpoint not found (404)');
      results.failed++;
      results.tests.push({
        name: 'Admin Users Endpoint',
        status: 'FAIL',
        details: 'Endpoint returns 404 - route not configured'
      });
    } else {
      console.log('❌ FAIL: Unexpected status code:', response.statusCode);
      results.failed++;
      results.tests.push({
        name: 'Admin Users Endpoint',
        status: 'FAIL',
        details: `Unexpected status code: ${response.statusCode}`
      });
    }
  } catch (error) {
    console.log('❌ FAIL: Request failed:', error.message);
    results.total++;
    results.failed++;
    results.tests.push({
      name: 'Admin Users Endpoint',
      status: 'FAIL',
      details: `Request failed: ${error.message}`
    });
  }
  console.log();
}

async function testDatabaseConnection() {
  console.log('🧪 Test 5: Verify Database Connection');
  console.log('Testing health check endpoint...');
  
  try {
    const response = await makeRequest('GET', '/api/v1/health');
    
    results.total++;
    
    if (response.statusCode === 200) {
      const body = JSON.parse(response.body);
      
      if (body.services && body.services.database && body.services.database.status === 'healthy') {
        console.log('✅ PASS: Database is connected and healthy');
        console.log('Database status:', body.services.database.status);
        results.passed++;
        results.tests.push({
          name: 'Database Connection',
          status: 'PASS',
          details: 'Database is connected and healthy'
        });
      } else {
        console.log('❌ FAIL: Database status not healthy');
        console.log('Response:', body);
        results.failed++;
        results.tests.push({
          name: 'Database Connection',
          status: 'FAIL',
          details: 'Database status not healthy'
        });
      }
    } else {
      console.log('❌ FAIL: Health endpoint returned', response.statusCode);
      results.failed++;
      results.tests.push({
        name: 'Database Connection',
        status: 'FAIL',
        details: `Health endpoint returned ${response.statusCode}`
      });
    }
  } catch (error) {
    console.log('❌ FAIL: Request failed:', error.message);
    results.total++;
    results.failed++;
    results.tests.push({
      name: 'Database Connection',
      status: 'FAIL',
      details: `Request failed: ${error.message}`
    });
  }
  console.log();
}

async function testProductsEndpoint() {
  console.log('🧪 Test 6: Verify Products Endpoint');
  console.log('Testing products endpoint...');
  
  try {
    const response = await makeRequest('GET', '/api/v1/products');
    
    results.total++;
    
    if (response.statusCode === 200) {
      console.log('✅ PASS: Products endpoint is accessible');
      console.log('Response:', response.statusCode);
      results.passed++;
      results.tests.push({
        name: 'Products Endpoint',
        status: 'PASS',
        details: 'Products endpoint returns 200'
      });
    } else {
      console.log('❌ FAIL: Products endpoint returned', response.statusCode);
      results.failed++;
      results.tests.push({
        name: 'Products Endpoint',
        status: 'FAIL',
        details: `Products endpoint returned ${response.statusCode}`
      });
    }
  } catch (error) {
    console.log('❌ FAIL: Request failed:', error.message);
    results.total++;
    results.failed++;
    results.tests.push({
      name: 'Products Endpoint',
      status: 'FAIL',
      details: `Request failed: ${error.message}`
    });
  }
  console.log();
}

async function runAllTests() {
  const startTime = Date.now();
  
  await testWishlistAuth();
  await testAdminDashboard();
  await testAdminProducts();
  await testAdminUsers();
  await testDatabaseConnection();
  await testProductsEndpoint();
  
  const endTime = Date.now();
  const duration = ((endTime - startTime) / 1000).toFixed(2);
  
  console.log('================================================================================');
  console.log('🧪 FINAL VERIFICATION REPORT');
  console.log('================================================================================\n');
  
  console.log('SUMMARY');
  console.log('----------------------------------------');
  console.log(`Total Tests: ${results.total}`);
  console.log(`Passed: ${results.passed}`);
  console.log(`Failed: ${results.failed}`);
  console.log(`Duration: ${duration}s`);
  console.log();
  
  results.tests.forEach((test, index) => {
    console.log(`Test ${index + 1}: ${test.name}`);
    console.log(`Status: ${test.status}`);
    console.log(`Details: ${test.details}`);
    console.log();
  });
  
  console.log('================================================================================');
  console.log('🧪 FINAL VERIFICATION STATUS');
  console.log('================================================================================\n');
  
  const wishlistAuthFixed = results.tests.find(t => t.name === 'Wishlist Endpoint Authentication')?.status === 'PASS';
  const adminRoutesWorking = results.tests.filter(t => t.name.includes('Admin')).every(t => t.status !== 'FAIL' || t.details.includes('404') === false);
  const databaseConnected = results.tests.find(t => t.name === 'Database Connection')?.status === 'PASS';
  const existingFeaturesWorking = results.tests.find(t => t.name === 'Products Endpoint')?.status === 'PASS';
  
  console.log(`Is the 401 error permanently resolved? ${wishlistAuthFixed ? '✅ YES' : '❌ NO'}`);
  console.log(`Are admin routes working? ${adminRoutesWorking ? '✅ YES' : '❌ NO'}`);
  console.log(`Is database connected? ${databaseConnected ? '✅ YES' : '❌ NO'}`);
  console.log(`Are existing features working? ${existingFeaturesWorking ? '✅ YES' : '❌ NO'}`);
  console.log();
  
  const allIssuesResolved = wishlistAuthFixed && adminRoutesWorking && databaseConnected && existingFeaturesWorking;
  const anyFunctionalityBroken = results.failed > 0;
  
  console.log(`Are all original issues permanently resolved? ${allIssuesResolved ? '✅ YES' : '❌ NO'}`);
  console.log(`Is any functionality broken? ${anyFunctionalityBroken ? '✅ YES' : '❌ NO'}`);
  console.log(`Is the system ready for production? ${allIssuesResolved && !anyFunctionalityBroken ? '✅ YES' : '❌ NO'}`);
  console.log();
  
  console.log('================================================================================');
  console.log('🧪 OVERALL ASSESSMENT');
  console.log('================================================================================\n');
  
  if (allIssuesResolved && !anyFunctionalityBroken) {
    console.log('✅ All critical issues have been permanently resolved.');
    console.log('✅ The 401 error issue has been fully resolved.');
    console.log('✅ Admin routes are working correctly.');
    console.log('✅ All existing features are functional.');
    console.log('✅ The system is ready for production deployment.');
  } else {
    console.log('❌ Some issues remain that need to be addressed before production.');
    if (!wishlistAuthFixed) {
      console.log('❌ The 401 error issue has not been fully resolved.');
    }
    if (!adminRoutesWorking) {
      console.log('❌ Admin routes are not working correctly.');
    }
    if (!databaseConnected) {
      console.log('❌ Database connection is not healthy.');
    }
    if (!existingFeaturesWorking) {
      console.log('❌ Some existing features have regressed.');
    }
  }
  
  console.log();
  console.log('================================================================================');
  console.log('🧪 END OF REPORT');
  console.log('================================================================================\n');
  
  // Save results to file
  const fs = require('fs');
  const timestamp = Date.now();
  const filename = `quick-fixes-verification-results-${timestamp}.json`;
  fs.writeFileSync(filename, JSON.stringify({
    timestamp: new Date().toISOString(),
    summary: {
      total: results.total,
      passed: results.passed,
      failed: results.failed,
      duration: duration
    },
    tests: results.tests,
    verificationStatus: {
      wishlistAuthFixed,
      adminRoutesWorking,
      databaseConnected,
      existingFeaturesWorking,
      allIssuesResolved,
      anyFunctionalityBroken,
      readyForProduction: allIssuesResolved && !anyFunctionalityBroken
    }
  }, null, 2));
  
  console.log(`✅ Report saved to: ${filename}`);
}

runAllTests().catch(error => {
  console.error('❌ Test execution failed:', error);
  process.exit(1);
});
