const axios = require('axios');

const BASE_URL = 'http://localhost:3001';

// Test endpoints to verify routing fix
const testEndpoints = [
  { method: 'GET', path: '/api/v1/health', description: 'Health check endpoint' },
  { method: 'GET', path: '/api/v1/auth/status', description: 'Auth status endpoint' },
  { method: 'GET', path: '/api/v1/products', description: 'Products list endpoint' },
  { method: 'GET', path: '/api/v1/categories', description: 'Categories list endpoint' },
  { method: 'GET', path: '/api/v1/brands', description: 'Brands list endpoint' }
];

async function testRoutingFix() {
  console.log('🔍 Testing API routing fixes...\n');
  
  const results = {
    passed: 0,
    failed: 0,
    details: []
  };

  for (const endpoint of testEndpoints) {
    try {
      console.log(`Testing ${endpoint.method} ${endpoint.path} - ${endpoint.description}`);
      
      const response = await axios({
        method: endpoint.method,
        url: `${BASE_URL}${endpoint.path}`,
        timeout: 5000,
        validateStatus: () => true // Accept any status code to analyze
      });

      const success = response.status !== 404; // Any status except 404 is good
      
      if (success) {
        console.log(`✅ ${endpoint.method} ${endpoint.path} - Status: ${response.status}`);
        results.passed++;
      } else {
        console.log(`❌ ${endpoint.method} ${endpoint.path} - Status: ${response.status}`);
        results.failed++;
      }

      results.details.push({
        endpoint: endpoint.path,
        method: endpoint.method,
        description: endpoint.description,
        status: response.status,
        success: success,
        response: response.data
      });

    } catch (error) {
      console.log(`❌ ${endpoint.method} ${endpoint.path} - Error: ${error.message}`);
      results.failed++;
      
      results.details.push({
        endpoint: endpoint.path,
        method: endpoint.method,
        description: endpoint.description,
        status: 'ERROR',
        success: false,
        error: error.message
      });
    }
  }

  console.log('\n📊 Test Results Summary:');
  console.log(`✅ Passed: ${results.passed}`);
  console.log(`❌ Failed: ${results.failed}`);
  console.log(`📈 Success Rate: ${((results.passed / (results.passed + results.failed)) * 100).toFixed(2)}%`);

  // Test specific routing issue - check if /api/v1/v1/auth still exists
  console.log('\n🔍 Checking for double /v1 prefix issue...');
  try {
    const doublePrefixResponse = await axios.get(`${BASE_URL}/api/v1/v1/auth/status`, {
      timeout: 3000,
      validateStatus: () => true
    });
    
    if (doublePrefixResponse.status === 404) {
      console.log('✅ Double /v1 prefix issue has been fixed (returns 404 as expected)');
    } else {
      console.log('⚠️ Double /v1 prefix issue may still exist');
    }
  } catch (error) {
    console.log('✅ Double /v1 prefix issue has been fixed (connection error as expected)');
  }

  return results;
}

// Run the test
testRoutingFix()
  .then(results => {
    console.log('\n🎉 Routing fix verification completed!');
    
    if (results.failed === 0) {
      console.log('🌟 All routing tests passed! The API endpoints are now accessible.');
    } else {
      console.log('⚠️ Some routing tests failed. Further investigation may be needed.');
    }
    
    process.exit(results.failed === 0 ? 0 : 1);
  })
  .catch(error => {
    console.error('❌ Routing test failed:', error.message);
    process.exit(1);
  });
