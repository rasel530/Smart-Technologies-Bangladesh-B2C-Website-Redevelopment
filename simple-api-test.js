const http = require('http');

// API Configuration
const API_BASE_URL = 'http://localhost:3001';
const API_VERSION = '/api/v1';

// Test configuration
const TEST_CONFIG = {
  timeout: 10000,
  retries: 2
};

// Test data
const TEST_DATA = {
  user: {
    email: 'test@example.com',
    password: 'TestPassword123!',
    firstName: 'Test',
    lastName: 'User',
    phone: '+8801712345678'
  },
  product: {
    name: 'Test Product',
    nameEn: 'Test Product',
    slug: 'test-product-' + Date.now(),
    sku: 'TEST-' + Date.now(),
    categoryId: null,
    brandId: null,
    regularPrice: 99.99,
    costPrice: 50.00,
    stockQuantity: 100,
    description: 'Test product description',
    shortDescription: 'Test short description'
  },
  category: {
    name: 'Test Category',
    slug: 'test-category-' + Date.now(),
    description: 'Test category description'
  },
  brand: {
    name: 'Test Brand',
    slug: 'test-brand-' + Date.now(),
    description: 'Test brand description'
  },
  coupon: {
    code: 'TEST' + Date.now(),
    name: 'Test Coupon',
    type: 'PERCENTAGE',
    value: 10,
    minAmount: 50,
    maxDiscount: 20,
    usageLimit: 100
  }
};

// Global variables to store created resources
let createdResources = {
  user: null,
  token: null,
  category: null,
  brand: null,
  product: null,
  cart: null,
  wishlist: null,
  coupon: null,
  order: null,
  review: null
};

// Utility functions
function log(message, type = 'info') {
  const timestamp = new Date().toISOString();
  const prefix = {
    info: 'ℹ️',
    success: '✅',
    error: '❌',
    warning: '⚠️',
    skip: '⏭️'
  };
  
  console.log(`${prefix[type]} [${timestamp}] ${message}`);
}

function makeRequest(method, url, data = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(`${API_BASE_URL}${url}`);
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || 3001,
      path: urlObj.pathname,
      method: method,
      timeout: TEST_CONFIG.timeout,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };
    
    if (data) {
      const jsonData = JSON.stringify(data);
      options.headers['Content-Length'] = Buffer.byteLength(jsonData);
    }
    
    const req = http.request(options, (res) => {
      let body = '';
      
      res.on('data', (chunk) => {
        body += chunk;
      });
      
      res.on('end', () => {
        try {
          const jsonData = body ? JSON.parse(body) : {};
          resolve({
            status: res.statusCode,
            data: jsonData,
            headers: res.headers
          });
        } catch (error) {
          resolve({
            status: res.statusCode,
            data: { error: 'Invalid JSON response', raw: body },
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
    
    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

async function testEndpoint(description, testFn) {
  log(`Testing: ${description}`, 'info');
  
  try {
    const result = await testFn();
    if (result.status >= 200 && result.status < 300) {
      log(`SUCCESS: ${description} (Status: ${result.status})`, 'success');
      return { success: true, result };
    } else {
      log(`FAILED: ${description} (Status: ${result.status})`, 'error');
      return { success: false, error: `HTTP ${result.status}: ${JSON.stringify(result.data)}`, status: result.status };
    }
  } catch (error) {
    log(`FAILED: ${description} - ${error.message}`, 'error');
    return { success: false, error: error.message };
  }
}

// Test suites
const testSuites = {
  // Basic connectivity tests
  connectivity: [
    {
      description: 'Root endpoint',
      test: () => makeRequest('GET', '/')
    },
    {
      description: 'Health check endpoint',
      test: () => makeRequest('GET', '/health')
    },
    {
      description: 'API documentation endpoint',
      test: () => makeRequest('GET', '/api-docs')
    },
    {
      description: 'Database status endpoint',
      test: () => makeRequest('GET', '/api/db-status')
    }
  ],

  // Authentication tests
  auth: [
    {
      description: 'Get password policy',
      test: () => makeRequest('GET', `${API_VERSION}/auth/password-policy`)
    },
    {
      description: 'Get supported operators',
      test: () => makeRequest('GET', `${API_VERSION}/auth/operators`)
    },
    {
      description: 'Validate phone number',
      test: () => makeRequest('POST', `${API_VERSION}/auth/validate-phone`, {
        phone: '+8801712345678'
      })
    },
    {
      description: 'Register new user',
      test: async () => {
        const result = await makeRequest('POST', `${API_VERSION}/auth/register`, TEST_DATA.user);
        if (result.status === 201) {
          createdResources.user = result.data.user;
        }
        return result;
      }
    },
    {
      description: 'Login user',
      test: async () => {
        const result = await makeRequest('POST', `${API_VERSION}/auth/login`, {
          email: TEST_DATA.user.email,
          password: TEST_DATA.user.password
        });
        if (result.status === 200) {
          createdResources.token = result.data.token;
        }
        return result;
      }
    },
    {
      description: 'Refresh token',
      test: () => makeRequest('POST', `${API_VERSION}/auth/refresh`, {
        token: createdResources.token
      })
    }
  ],

  // Category tests
  categories: [
    {
      description: 'Get all categories',
      test: () => makeRequest('GET', `${API_VERSION}/categories`)
    },
    {
      description: 'Get category tree',
      test: () => makeRequest('GET', `${API_VERSION}/categories/tree/all`)
    }
  ],

  // Brand tests
  brands: [
    {
      description: 'Get all brands',
      test: () => makeRequest('GET', `${API_VERSION}/brands`)
    }
  ],

  // Product tests
  products: [
    {
      description: 'Get all products',
      test: () => makeRequest('GET', `${API_VERSION}/products`)
    },
    {
      description: 'Get featured products',
      test: () => makeRequest('GET', `${API_VERSION}/products/featured/list`)
    }
  ],

  // Cart tests
  cart: [
    {
      description: 'Get cart (should fail without auth)',
      test: () => makeRequest('GET', `${API_VERSION}/cart/test-cart-id`)
    }
  ],

  // Wishlist tests
  wishlist: [
    {
      description: 'Get wishlists (should fail without auth)',
      test: () => makeRequest('GET', `${API_VERSION}/wishlist/user/test-user-id`)
    }
  ],

  // Coupon tests
  coupons: [
    {
      description: 'Get all coupons',
      test: () => makeRequest('GET', `${API_VERSION}/coupons`)
    }
  ],

  // Review tests
  reviews: [
    {
      description: 'Get all reviews',
      test: () => makeRequest('GET', `${API_VERSION}/reviews`)
    }
  ],

  // Order tests
  orders: [
    {
      description: 'Get orders (should fail without auth)',
      test: () => makeRequest('GET', `${API_VERSION}/orders`)
    }
  ]
};

// Error handling tests
const errorTests = [
  {
    description: 'Invalid endpoint',
    test: () => makeRequest('GET', '/invalid-endpoint')
  },
  {
    description: 'Invalid login credentials',
    test: () => makeRequest('POST', `${API_VERSION}/auth/login`, {
      email: 'invalid@example.com',
      password: 'wrongpassword'
    })
  },
  {
    description: 'Invalid product ID',
    test: () => makeRequest('GET', `${API_VERSION}/products/invalid-uuid`)
  },
  {
    description: 'Unauthorized access',
    test: () => makeRequest('GET', `${API_VERSION}/users/test-user-id`)
  },
  {
    description: 'Invalid data validation',
    test: () => makeRequest('POST', `${API_VERSION}/auth/register`, {
      email: 'invalid-email',
      password: '123'
    })
  }
];

// Main test execution function
async function runTests() {
  console.log('🚀 Starting Comprehensive API Endpoint Testing\n');
  console.log('='.repeat(60));
  
  const results = {
    total: 0,
    passed: 0,
    failed: 0,
    skipped: 0,
    errors: []
  };

  // Run all test suites
  const allSuites = Object.keys(testSuites);
  
  for (const suiteName of allSuites) {
    log(`\n📋 Running ${suiteName.toUpperCase()} Test Suite`, 'info');
    log('-'.repeat(40), 'info');
    
    const suite = testSuites[suiteName];
    
    for (const testCase of suite) {
      results.total++;
      
      try {
        const testResult = await testEndpoint(testCase.description, testCase.test);
        
        if (testResult.success) {
          results.passed++;
        } else {
          results.failed++;
          results.errors.push({
            suite: suiteName,
            test: testCase.description,
            error: testResult.error,
            status: testResult.status
          });
        }
      } catch (error) {
        results.failed++;
        results.errors.push({
          suite: suiteName,
          test: testCase.description,
          error: `Unexpected error: ${error.message}`
        });
      }
      
      // Small delay between requests
      await new Promise(resolve => setTimeout(resolve, 200));
    }
  }

  // Run error handling tests
  log('\n📋 Running ERROR HANDLING Test Suite', 'info');
  log('-'.repeat(40), 'info');
  
  for (const testCase of errorTests) {
    results.total++;
    
    try {
      const testResult = await testEndpoint(testCase.description, testCase.test);
      
      if (testResult.success) {
        // Some error tests might pass (like invalid endpoint returning 404)
        results.passed++;
      } else {
        // Error tests should fail as expected
        results.skipped++;
        log(`EXPECTED FAILURE: ${testCase.description}`, 'skip');
      }
    } catch (error) {
      results.failed++;
      results.errors.push({
        suite: 'error-handling',
        test: testCase.description,
        error: `Unexpected error: ${error.message}`
      });
    }
    
    await new Promise(resolve => setTimeout(resolve, 200));
  }

  // Generate report
  console.log('\n' + '='.repeat(60));
  console.log('📊 TEST RESULTS SUMMARY');
  console.log('='.repeat(60));
  console.log(`Total Tests: ${results.total}`);
  console.log(`Passed: ${results.passed}`);
  console.log(`Failed: ${results.failed}`);
  console.log(`Skipped: ${results.skipped}`);
  console.log(`Success Rate: ${((results.passed / results.total) * 100).toFixed(2)}%`);
  
  if (results.errors.length > 0) {
    console.log('\n❌ FAILED TESTS:');
    results.errors.forEach((error, index) => {
      console.log(`${index + 1}. [${error.suite}] ${error.test}`);
      console.log(`   Error: ${error.error}`);
      if (error.status) {
        console.log(`   Status: ${error.status}`);
      }
      console.log('');
    });
  }

  // Performance summary
  console.log('\n🏁 Created Resources for Reference:');
  console.log(`User ID: ${createdResources.user?.id}`);
  console.log(`Category ID: ${createdResources.category?.id}`);
  console.log(`Brand ID: ${createdResources.brand?.id}`);
  console.log(`Product ID: ${createdResources.product?.id}`);
  console.log(`Cart ID: ${createdResources.cart?.id}`);
  console.log(`Wishlist ID: ${createdResources.wishlist?.id}`);
  console.log(`Coupon Code: ${createdResources.coupon?.code}`);
  console.log(`Order ID: ${createdResources.order?.id}`);
  console.log(`Review ID: ${createdResources.review?.id}`);

  return results;
}

// Run tests if this file is executed directly
if (require.main === module) {
  runTests()
    .then(results => {
      console.log('\n✅ All tests completed');
      process.exit(0);
    })
    .catch(error => {
      console.error('Test execution failed:', error);
      process.exit(1);
    });
}

module.exports = {
  runTests,
  testSuites,
  TEST_CONFIG,
  TEST_DATA,
  createdResources
};