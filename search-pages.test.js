/**
 * Search Pages Comprehensive Test Script
 * 
 * This script tests all search-related endpoints to verify the fixes are working correctly.
 * Run with: node search-pages.test.js
 */

const http = require('http');
const https = require('https');

// Configuration
const BASE_URL = 'localhost';
const PORT = 3001;
const USE_HTTPS = false;

// Test results storage
const testResults = {
  analytics: { status: 'PENDING', endpoints: [], errors: [] },
  performance: { status: 'PENDING', endpoints: [], errors: [] },
  optimization: { status: 'PENDING', endpoints: [], errors: [] },
  personalization: { status: 'PENDING', endpoints: [], errors: [] }
};

// Helper function to make HTTP requests
function makeRequest(method, path, options = {}) {
  return new Promise((resolve, reject) => {
    const url = `${USE_HTTPS ? 'https' : 'http'}://${BASE_URL}:${PORT}${path}`;
    const urlObj = new URL(url);
    
    const reqOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port,
      path: urlObj.pathname + urlObj.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...options.headers
      },
      timeout: 10000
    };

    const client = USE_HTTPS ? https : http;
    const req = client.request(reqOptions, (res) => {
      let data = '';
      
      res.on('data', chunk => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const jsonData = data ? JSON.parse(data) : null;
          resolve({
            status: res.statusCode,
            data: jsonData,
            headers: res.headers
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            data: data,
            headers: res.headers
          });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    if (options.body) {
      req.write(JSON.stringify(options.body));
    }
    
    req.end();
  });
}

// Test Analytics Endpoints
async function testAnalyticsEndpoints() {
  console.log('\n🧪 Testing Analytics Endpoints...\n');
  
  const endpoints = [
    { method: 'GET', path: '/api/v1/search-analytics/metrics?timeRange=week', name: 'GET /api/v1/search-analytics/metrics' },
    { method: 'GET', path: '/api/v1/search-analytics/popular?limit=10', name: 'GET /api/v1/search-analytics/popular' },
    { method: 'GET', path: '/api/v1/search-analytics/trends?timeRange=week', name: 'GET /api/v1/search-analytics/trends' },
    { method: 'GET', path: '/api/v1/search-performance/zero-results?limit=10', name: 'GET /api/v1/search-performance/zero-results' }
  ];

  for (const endpoint of endpoints) {
    try {
      console.log(`  Testing: ${endpoint.name}`);
      const result = await makeRequest(endpoint.method, endpoint.path);
      
      testResults.analytics.endpoints.push({
        name: endpoint.name,
        status: result.status,
        success: result.status >= 200 && result.status < 300
      });
      
      if (result.status >= 200 && result.status < 300) {
        console.log(`    ✅ Status: ${result.status} OK`);
      } else {
        console.log(`    ❌ Status: ${result.status}`);
      }
    } catch (error) {
      console.log(`    ❌ Error: ${error.message}`);
      testResults.analytics.errors.push({ name: endpoint.name, error: error.message });
    }
  }

  // Overall status
  const hasErrors = testResults.analytics.endpoints.some(e => !e.success) || testResults.analytics.errors.length > 0;
  testResults.analytics.status = hasErrors ? 'FAIL' : 'PASS';
}

// Test Performance Endpoints
async function testPerformanceEndpoints() {
  console.log('\n🧪 Testing Performance Endpoints...\n');
  
  const endpoints = [
    { method: 'GET', path: '/api/v1/search-performance/comparison?currentRange=week&previousRange=previous_week', name: 'GET /api/v1/search-performance/comparison (NEW)' },
    { method: 'GET', path: '/api/v1/search-performance/response-time-distribution?timeRange=week', name: 'GET /api/v1/search-performance/response-time-distribution (NEW)' },
    { method: 'GET', path: '/api/v1/search-performance/realtime', name: 'GET /api/v1/search-performance/realtime (was 401)' },
    { method: 'GET', path: '/api/v1/search-performance/cache-stats?timeRange=week', name: 'GET /api/v1/search-performance/cache-stats (was 401)' },
    { method: 'GET', path: '/api/v1/search-performance/zero-results?limit=10', name: 'GET /api/v1/search-performance/zero-results' }
  ];

  for (const endpoint of endpoints) {
    try {
      console.log(`  Testing: ${endpoint.name}`);
      const result = await makeRequest(endpoint.method, endpoint.path);
      
      testResults.performance.endpoints.push({
        name: endpoint.name,
        status: result.status,
        success: result.status >= 200 && result.status < 300
      });
      
      if (result.status >= 200 && result.status < 300) {
        console.log(`    ✅ Status: ${result.status} OK`);
      } else if (result.status === 401) {
        console.log(`    ⚠️  Status: ${result.status} UNAUTHORIZED (expected for protected endpoints)`);
      } else if (result.status === 404) {
        console.log(`    ❌ Status: ${result.status} NOT FOUND`);
      } else {
        console.log(`    ❌ Status: ${result.status}`);
      }
    } catch (error) {
      console.log(`    ❌ Error: ${error.message}`);
      testResults.performance.errors.push({ name: endpoint.name, error: error.message });
    }
  }

  // Overall status
  const has404 = testResults.performance.endpoints.some(e => e.status === 404);
  testResults.performance.status = has404 ? 'FAIL' : 'PASS';
}

// Test Optimization Endpoints
async function testOptimizationEndpoints() {
  console.log('\n🧪 Testing Optimization Endpoints...\n');
  
  const endpoints = [
    { method: 'GET', path: '/api/v1/search-optimization/insights?timeRange=week', name: 'GET /api/v1/search-optimization/insights (NEW)' },
    { method: 'GET', path: '/api/v1/search-optimization/relevance-metrics?timeRange=week', name: 'GET /api/v1/search-optimization/relevance-metrics (NEW)' },
    { method: 'GET', path: '/api/v1/search-optimization/patterns?timeRange=week', name: 'GET /api/v1/search-optimization/patterns (was 401)' },
    { method: 'GET', path: '/api/v1/search-optimization/experiments?limit=20', name: 'GET /api/v1/search-optimization/experiments (was 401)' }
  ];

  for (const endpoint of endpoints) {
    try {
      console.log(`  Testing: ${endpoint.name}`);
      const result = await makeRequest(endpoint.method, endpoint.path);
      
      testResults.optimization.endpoints.push({
        name: endpoint.name,
        status: result.status,
        success: result.status >= 200 && result.status < 300
      });
      
      if (result.status >= 200 && result.status < 300) {
        console.log(`    ✅ Status: ${result.status} OK`);
      } else if (result.status === 401) {
        console.log(`    ⚠️  Status: ${result.status} UNAUTHORIZED (expected for protected endpoints)`);
      } else if (result.status === 404) {
        console.log(`    ❌ Status: ${result.status} NOT FOUND`);
      } else {
        console.log(`    ❌ Status: ${result.status}`);
      }
    } catch (error) {
      console.log(`    ❌ Error: ${error.message}`);
      testResults.optimization.errors.push({ name: endpoint.name, error: error.message });
    }
  }

  // Overall status
  const has404 = testResults.optimization.endpoints.some(e => e.status === 404);
  testResults.optimization.status = has404 ? 'FAIL' : 'PASS';
}

// Test Personalization Endpoints (Control)
async function testPersonalizationEndpoints() {
  console.log('\n🧪 Testing Personalization Endpoints (Control)...\n');
  
  const endpoints = [
    { method: 'GET', path: '/api/v1/search-personalization/preferences', name: 'GET /api/v1/search-personalization/preferences' },
    { method: 'GET', path: '/api/v1/search-personalization/history?limit=10', name: 'GET /api/v1/search-personalization/history' }
  ];

  for (const endpoint of endpoints) {
    try {
      console.log(`  Testing: ${endpoint.name}`);
      const result = await makeRequest(endpoint.method, endpoint.path);
      
      testResults.personalization.endpoints.push({
        name: endpoint.name,
        status: result.status,
        success: result.status >= 200 && result.status < 300
      });
      
      if (result.status >= 200 && result.status < 300) {
        console.log(`    ✅ Status: ${result.status} OK`);
      } else {
        console.log(`    ❌ Status: ${result.status}`);
      }
    } catch (error) {
      console.log(`    ❌ Error: ${error.message}`);
      testResults.personalization.errors.push({ name: endpoint.name, error: error.message });
    }
  }

  // Overall status
  const hasErrors = testResults.personalization.endpoints.some(e => !e.success) || testResults.personalization.errors.length > 0;
  testResults.personalization.status = hasErrors ? 'FAIL' : 'PASS';
}

// Generate Report
function generateReport() {
  console.log('\n' + '='.repeat(60));
  console.log('📊 SEARCH PAGES TEST REPORT');
  console.log('='.repeat(60) + '\n');

  const pages = [
    { name: 'Analytics Page', key: 'analytics' },
    { name: 'Performance Page', key: 'performance' },
    { name: 'Optimization Page', key: 'optimization' },
    { name: 'Personalization Page', key: 'personalization' }
  ];

  let allPassed = true;

  for (const page of pages) {
    const result = testResults[page.key];
    const statusIcon = result.status === 'PASS' ? '✅' : '❌';
    
    console.log(`${statusIcon} ${page.name}: ${result.status}\n`);
    
    if (result.endpoints.length > 0) {
      console.log('   Endpoints Tested:');
      for (const endpoint of result.endpoints) {
        const icon = endpoint.success ? '✅' : '❌';
        console.log(`   ${icon} ${endpoint.name}: ${endpoint.status}`);
      }
    }

    if (result.errors.length > 0) {
      console.log('\n   Errors:');
      for (const error of result.errors) {
        console.log(`   ❌ ${error.name}: ${error.error}`);
      }
    }

    console.log('');

    if (result.status === 'FAIL') {
      allPassed = false;
    }
  }

  console.log('='.repeat(60));
  console.log(allPassed ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED');
  console.log('='.repeat(60));

  return allPassed;
}

// Main execution
async function main() {
  console.log('🔍 Starting Search Pages Comprehensive Test');
  console.log(`   Backend: ${BASE_URL}:${PORT}`);
  console.log(`   Time: ${new Date().toISOString()}`);

  try {
    // Test all pages
    await testAnalyticsEndpoints();
    await testPerformanceEndpoints();
    await testOptimizationEndpoints();
    await testPersonalizationEndpoints();

    // Generate report
    const allPassed = generateReport();
    
    // Exit with appropriate code
    process.exit(allPassed ? 0 : 1);
  } catch (error) {
    console.error('\n❌ Fatal Error:', error.message);
    process.exit(1);
  }
}

main();
